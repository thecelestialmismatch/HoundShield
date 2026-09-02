"""
NexusSwift :: core.models
=========================

Data models, the canonical SQLite schema, and the asynchronous persistence
layer for the clearing hub.

Design decisions that are load-bearing, stated up front because a reader who
does not know them will "simplify" the code into an incorrect settlement
engine:

1.  **Money is never a float, and never a bare Decimal in the database.**
    Every monetary value is persisted as an *integer count of minor units*
    (``amount_minor``) alongside its ISO 4217 currency. ``Decimal`` is the
    boundary representation used at the XML edge and in the API; integers are
    the storage and arithmetic representation. A float would silently lose
    0.01 on a large USD ledger; a Decimal stored as TEXT cannot be summed by
    SQL without a lossy CAST. The ``amount`` column additionally carries the
    canonical decimal *string* so that raw SQL forensics reads naturally, but
    ``amount_minor`` is the authoritative value and the two are written
    together from a single conversion.

2.  **The five settlement statuses in ``SettlementStatus`` are the complete,
    closed set of ledger-visible outcomes**, enforced by a SQL CHECK
    constraint. Real-world clearing produces more failure *causes* than that
    (unknown institution, currency mismatch, frozen account, malformed
    envelope). Those are recorded in the separate ``rejection_reason`` column
    as a machine-readable code. Collapsing cause into status would either
    explode the status enum until dashboards break, or throw away the
    forensic detail an investigator needs. Status answers "what happened to
    the money"; reason answers "why".

3.  **``raw_payload`` is invariant.** It stores the exact bytes that were
    signed, decoded as UTF-8. It is never re-serialised, pretty-printed, or
    round-tripped through a DOM before storage. The moment you re-serialise a
    signed document you have destroyed the ability to re-verify it, because
    XML serialisers disagree about attribute order and whitespace. Signature
    verification in ``core.crypto`` operates on these bytes and nothing else.

4.  **``uetr`` is the primary key and ``msg_id`` carries a UNIQUE index.**
    Idempotency is therefore enforced by the storage engine itself, not by a
    read-then-write check in application code. A read-then-write check has a
    race window between the SELECT and the INSERT; under concurrent
    submission of the same payment that window duplicates money. The database
    constraint has no such window, so the engine deliberately attempts the
    INSERT and treats ``IntegrityError`` as the duplicate signal.

5.  **The ledger is double-entry and hash-chained.** Every settlement writes
    exactly two rows summing to zero, and each row commits to its predecessor
    via SHA-256. Balances are therefore reconstructible from the journal, and
    silent post-hoc mutation of a settled row is detectable.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import sqlite3
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from enum import Enum
from pathlib import Path
from typing import Any, AsyncIterator, Final, Iterable, Mapping, Sequence

import aiosqlite

__all__ = [
    "CurrencyError",
    "InstitutionStatus",
    "SettlementStatus",
    "AccountStatus",
    "LedgerDirection",
    "RejectionReason",
    "Institution",
    "Account",
    "PaymentRecord",
    "LedgerEntry",
    "CURRENCY_MINOR_UNITS",
    "minor_units",
    "to_minor",
    "from_minor",
    "parse_amount",
    "format_amount",
    "utc_now",
    "iso_timestamp",
    "new_uetr",
    "sha256_hex",
    "Database",
    "ConnectionPool",
    "SCHEMA_STATEMENTS",
    "MIGRATIONS",
    "GENESIS_HASH",
]


# --------------------------------------------------------------------------
# Time
# --------------------------------------------------------------------------

def utc_now() -> datetime:
    """Timezone-aware UTC now.

    Naive datetimes are banned in this codebase. A settlement timestamp
    without an offset is ambiguous across the two annual DST transitions, and
    an ambiguous settlement timestamp is an unanswerable audit question.
    """
    return datetime.now(timezone.utc)


def iso_timestamp(moment: datetime | None = None) -> str:
    """ISO 8601 with an explicit ``Z``, which is what ISO 20022 requires."""
    moment = moment or utc_now()
    if moment.tzinfo is None:
        raise ValueError("refusing to format a naive datetime; supply tzinfo")
    return moment.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def new_uetr() -> str:
    """A fresh UETR.

    SWIFT gpi mandates a UUID **version 4** here, lowercase, in the canonical
    8-4-4-4-12 hyphenated form. Version matters: a v1 UUID leaks the MAC
    address and creation time of the issuing host, which is why the standard
    pins v4 specifically rather than "a UUID".
    """
    return str(uuid.uuid4())


# --------------------------------------------------------------------------
# Enumerations
# --------------------------------------------------------------------------

class SettlementStatus(str, Enum):
    """The closed set of ledger-visible outcomes for a payment.

    Inherits from ``str`` so that instances serialise transparently into
    SQLite TEXT columns and JSON without a custom adapter, while still
    comparing equal to their wire representation.
    """

    PENDING = "PENDING"
    SETTLED = "SETTLED"
    REJECTED_TAMPERED = "REJECTED_TAMPERED"
    REJECTED_DUPLICATE = "REJECTED_DUPLICATE"
    REJECTED_LIQUIDITY = "REJECTED_LIQUIDITY"

    @property
    def is_terminal(self) -> bool:
        return self is not SettlementStatus.PENDING

    @property
    def is_rejection(self) -> bool:
        return self.value.startswith("REJECTED_")


class RejectionReason(str, Enum):
    """Precise cause codes, orthogonal to :class:`SettlementStatus`.

    The prefixes mirror the ISO 20022 external code sets an operator would
    recognise from a pacs.002 status report, so an investigator can map a
    NexusSwift rejection onto the reason code the counterparty will see.
    """

    NONE = ""
    #: Envelope failed structural or namespace validation (ISO: FF01).
    SCHEMA_INVALID = "FF01_SCHEMA_INVALID"
    #: Debtor or creditor agent BIC is not a registered participant (RC01).
    UNKNOWN_INSTITUTION = "RC01_UNKNOWN_INSTITUTION"
    #: Institution is registered but suspended from clearing (RC08).
    INSTITUTION_SUSPENDED = "RC08_INSTITUTION_SUSPENDED"
    #: No public key on file for the sending institution.
    NO_REGISTERED_KEY = "RC01_NO_REGISTERED_KEY"
    #: RSA-PSS verification failed: the payload does not match the signature.
    SIGNATURE_INVALID = "AM05_SIGNATURE_INVALID"
    #: The signature field was absent or not valid Base64.
    SIGNATURE_MALFORMED = "AM05_SIGNATURE_MALFORMED"
    #: UETR or MsgId already present in the journal.
    DUPLICATE_UETR = "AM05_DUPLICATE_UETR"
    DUPLICATE_MSG_ID = "AM05_DUPLICATE_MSG_ID"
    #: Debtor account has insufficient available balance (AM04).
    INSUFFICIENT_FUNDS = "AM04_INSUFFICIENT_FUNDS"
    #: Settlement would breach the institution's intraday debit cap.
    LIMIT_EXCEEDED = "AM04_LIMIT_EXCEEDED"
    #: Named settlement account does not exist (AC01).
    UNKNOWN_ACCOUNT = "AC01_UNKNOWN_ACCOUNT"
    #: Account exists but is frozen or closed (AC06).
    ACCOUNT_BLOCKED = "AC06_ACCOUNT_BLOCKED"
    #: Payment currency does not match the settlement account currency (AM03).
    CURRENCY_MISMATCH = "AM03_CURRENCY_MISMATCH"
    #: Amount has more fraction digits than the currency permits (AM11).
    AMOUNT_PRECISION = "AM11_AMOUNT_PRECISION"


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"

    @property
    def can_settle(self) -> bool:
        return self is AccountStatus.ACTIVE


class InstitutionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class LedgerDirection(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

    @property
    def sign(self) -> int:
        """+1 credits the account, -1 debits it.

        Note this is the *account holder's* perspective on their balance at
        this hub, not classical accounting sign convention. A DEBIT reduces
        the participant's settlement balance.
        """
        return -1 if self is LedgerDirection.DEBIT else 1


# --------------------------------------------------------------------------
# ISO 4217 minor units
# --------------------------------------------------------------------------

#: Currencies whose minor-unit exponent is not the default 2.
#:
#: Getting this wrong is not cosmetic. If JPY is treated as 2-decimal, every
#: yen amount is stored 100x too small and every reconciliation against the
#: correspondent breaks. If BHD (3 decimals) is treated as 2, the engine
#: silently truncates a tenth of a fils on every transfer. The full ISO 4217
#: table is large; these are the exceptions, and the default is 2.
_MINOR_UNIT_EXCEPTIONS: Final[Mapping[str, int]] = {
    # Zero-decimal currencies.
    "BIF": 0, "CLP": 0, "DJF": 0, "GNF": 0, "ISK": 0, "JPY": 0, "KMF": 0,
    "KRW": 0, "PYG": 0, "RWF": 0, "UGX": 0, "UYI": 0, "VND": 0, "VUV": 0,
    "XAF": 0, "XOF": 0, "XPF": 0,
    # Three-decimal currencies.
    "BHD": 3, "IQD": 3, "JOD": 3, "KWD": 3, "LYD": 3, "OMR": 3, "TND": 3,
    # Four-decimal currencies.
    "CLF": 4, "UYW": 4,
}

#: The set of currencies this hub will clear. Restricting the set is a
#: deliberate control: an unrecognised code must be rejected rather than
#: defaulted to 2 decimals, because defaulting is how a 3-decimal dinar
#: amount gets truncated in production.
CURRENCY_MINOR_UNITS: Final[Mapping[str, int]] = {
    code: _MINOR_UNIT_EXCEPTIONS.get(code, 2)
    for code in (
        "AED", "AUD", "BHD", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR",
        "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KES", "KRW",
        "KWD", "MXN", "MYR", "NOK", "NZD", "OMR", "PHP", "PLN", "QAR", "RON",
        "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "USD", "ZAR",
    )
}


class CurrencyError(ValueError):
    """Raised for an unknown ISO 4217 code or an over-precise amount."""


def minor_units(currency: str) -> int:
    """Minor-unit exponent for ``currency``, or raise :class:`CurrencyError`."""
    try:
        return CURRENCY_MINOR_UNITS[currency]
    except KeyError:
        raise CurrencyError(
            f"unsupported ISO 4217 currency {currency!r}; "
            f"refusing to assume 2 minor units"
        ) from None


def to_minor(amount: Decimal, currency: str) -> int:
    """Convert a :class:`Decimal` to an exact integer count of minor units.

    Rejects — rather than rounds — an amount carrying more precision than the
    currency admits. Rounding here would mean the hub settled a different
    number than the one the debtor signed, which breaks non-repudiation: the
    signed document and the ledger would disagree.
    """
    exponent = minor_units(currency)
    scaled = amount.scaleb(exponent)
    if scaled != scaled.to_integral_value():
        raise CurrencyError(
            f"amount {amount} carries more precision than {currency} "
            f"permits ({exponent} minor units)"
        )
    return int(scaled)


def from_minor(amount_minor: int, currency: str) -> Decimal:
    """Inverse of :func:`to_minor`. Exact; no floating point involved."""
    return Decimal(amount_minor).scaleb(-minor_units(currency))


def parse_amount(raw: str, currency: str) -> Decimal:
    """Parse an ISO 20022 ``ActiveCurrencyAndAmount`` text node.

    ISO 20022 amounts use a period as the decimal separator, no thousands
    grouping, and no sign (direction is carried by the message type, not the
    amount). Exponent notation is rejected: ``1E3`` is a valid Decimal but is
    not a valid amount in a payment instruction, and accepting it invites a
    parser-differential attack where the hub and the counterparty read the
    same bytes as different numbers.
    """
    text = raw.strip()
    if not text:
        raise CurrencyError("empty amount")
    if not _is_iso20022_amount(text):
        raise CurrencyError(f"malformed ISO 20022 amount {raw!r}")
    try:
        value = Decimal(text)
    except InvalidOperation:
        raise CurrencyError(f"malformed ISO 20022 amount {raw!r}") from None
    if value <= 0:
        raise CurrencyError(f"amount must be strictly positive, got {value}")
    # Round-trip through minor units to enforce the precision rule.
    to_minor(value, currency)
    return value


def _is_iso20022_amount(text: str) -> bool:
    """``digits`` or ``digits.digits`` only. No sign, no exponent, no comma."""
    head, separator, tail = text.partition(".")
    if not head.isdigit():
        return False
    if separator and not tail.isdigit():
        return False
    return True


def format_amount(amount: Decimal, currency: str) -> str:
    """Canonical ISO 20022 text form, with exactly the currency's precision."""
    exponent = minor_units(currency)
    quantised = amount.quantize(Decimal(1).scaleb(-exponent))
    return f"{quantised:f}"


# --------------------------------------------------------------------------
# Hash chain
# --------------------------------------------------------------------------

#: The chain anchor. 64 zeroes, so a chain of length zero is distinguishable
#: from a chain whose first link was deleted.
GENESIS_HASH: Final[str] = "0" * 64


def sha256_hex(*parts: str | bytes) -> str:
    digest = hashlib.sha256()
    for part in parts:
        digest.update(part.encode("utf-8") if isinstance(part, str) else part)
        digest.update(b"\x1e")  # ASCII record separator: unambiguous framing
    return digest.hexdigest()


# --------------------------------------------------------------------------
# Domain records
# --------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class Institution:
    """A registered clearing participant, identified by its ISO 9362 BIC."""

    bic: str
    name: str
    country: str
    public_key_pem: str
    status: InstitutionStatus = InstitutionStatus.ACTIVE
    registered_at: datetime = field(default_factory=utc_now)

    @property
    def key_fingerprint(self) -> str:
        """SHA-256 over the DER-equivalent PEM body, for operator display."""
        body = "".join(
            line for line in self.public_key_pem.splitlines()
            if line and not line.startswith("-----")
        )
        return hashlib.sha256(body.encode("ascii")).hexdigest()


@dataclass(frozen=True, slots=True)
class Account:
    """A settlement account held at the hub by a participant institution."""

    account_id: str
    bic: str
    currency: str
    balance_minor: int
    status: AccountStatus = AccountStatus.ACTIVE
    #: Intraday credit line, in minor units. Balance may go this far negative.
    overdraft_limit_minor: int = 0

    @property
    def balance(self) -> Decimal:
        return from_minor(self.balance_minor, self.currency)

    @property
    def available_minor(self) -> int:
        return self.balance_minor + self.overdraft_limit_minor

    def can_debit(self, amount_minor: int) -> bool:
        return self.status.can_settle and self.available_minor >= amount_minor


@dataclass(frozen=True, slots=True)
class PaymentRecord:
    """One pacs.008 customer credit transfer, as journalled by the hub."""

    uetr: str
    msg_id: str
    sender_bic: str
    receiver_bic: str
    amount: Decimal
    currency: str
    settlement_status: SettlementStatus
    raw_payload: str
    signature: str
    instr_id: str = ""
    end_to_end_id: str = ""
    debtor_account: str = ""
    creditor_account: str = ""
    charge_bearer: str = "SHAR"
    settlement_date: str = ""
    rejection_reason: RejectionReason = RejectionReason.NONE
    payload_sha256: str = ""
    created_at: datetime = field(default_factory=utc_now)
    settled_at: datetime | None = None

    @property
    def amount_minor(self) -> int:
        return to_minor(self.amount, self.currency)

    def to_json(self) -> str:
        return json.dumps(
            {
                "uetr": self.uetr,
                "msg_id": self.msg_id,
                "sender_bic": self.sender_bic,
                "receiver_bic": self.receiver_bic,
                "amount": format_amount(self.amount, self.currency),
                "currency": self.currency,
                "settlement_status": self.settlement_status.value,
                "rejection_reason": self.rejection_reason.value,
                "payload_sha256": self.payload_sha256,
                "created_at": iso_timestamp(self.created_at),
                "settled_at": iso_timestamp(self.settled_at) if self.settled_at else None,
            },
            sort_keys=True,
            separators=(",", ":"),
        )


@dataclass(frozen=True, slots=True)
class LedgerEntry:
    """One leg of a double-entry settlement posting."""

    entry_id: int
    uetr: str
    account_id: str
    direction: LedgerDirection
    amount_minor: int
    currency: str
    balance_after_minor: int
    prev_hash: str
    entry_hash: str
    created_at: datetime

    @staticmethod
    def compute_hash(
        *,
        uetr: str,
        account_id: str,
        direction: LedgerDirection,
        amount_minor: int,
        currency: str,
        balance_after_minor: int,
        created_at: str,
        prev_hash: str,
    ) -> str:
        """Commit to every field of the entry plus its predecessor.

        Field order is fixed and each field is separator-framed by
        :func:`sha256_hex`, so ``("AB", "C")`` and ``("A", "BC")`` produce
        different digests. Without that framing an attacker could shift a
        digit between adjacent fields and preserve the hash.
        """
        return sha256_hex(
            uetr,
            account_id,
            direction.value,
            str(amount_minor),
            currency,
            str(balance_after_minor),
            created_at,
            prev_hash,
        )


# --------------------------------------------------------------------------
# Schema
# --------------------------------------------------------------------------

#: Executed in order on an empty database. Every statement is idempotent
#: (``IF NOT EXISTS``) so re-running migration on a live database is safe.
SCHEMA_STATEMENTS: Final[tuple[str, ...]] = (
    """
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version     INTEGER PRIMARY KEY,
        applied_at  TEXT NOT NULL,
        description TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS institutions (
        bic             TEXT PRIMARY KEY
                        CHECK (length(bic) IN (8, 11)),
        name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 140),
        country         TEXT NOT NULL CHECK (length(country) = 2),
        public_key_pem  TEXT NOT NULL
                        CHECK (public_key_pem LIKE '-----BEGIN PUBLIC KEY-----%'),
        status          TEXT NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'SUSPENDED')),
        registered_at   TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS accounts (
        account_id              TEXT PRIMARY KEY,
        bic                     TEXT NOT NULL REFERENCES institutions(bic)
                                ON DELETE RESTRICT,
        currency                TEXT NOT NULL CHECK (length(currency) = 3),
        balance_minor           INTEGER NOT NULL DEFAULT 0,
        overdraft_limit_minor   INTEGER NOT NULL DEFAULT 0
                                CHECK (overdraft_limit_minor >= 0),
        status                  TEXT NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
        opened_at               TEXT NOT NULL,
        -- A settlement account may never fall below its agreed credit line.
        -- Enforced here as well as in application code: the CHECK is the
        -- backstop that survives a bug in the engine.
        CHECK (balance_minor + overdraft_limit_minor >= 0)
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_accounts_bic_ccy
        ON accounts (bic, currency)
    """,
    """
    CREATE TABLE IF NOT EXISTS payments (
        uetr                TEXT PRIMARY KEY
                            CHECK (length(uetr) = 36),
        msg_id              TEXT NOT NULL,
        instr_id            TEXT NOT NULL DEFAULT '',
        end_to_end_id       TEXT NOT NULL DEFAULT '',
        sender_bic          TEXT NOT NULL CHECK (length(sender_bic) IN (8, 11)),
        receiver_bic        TEXT NOT NULL CHECK (length(receiver_bic) IN (8, 11)),
        debtor_account      TEXT NOT NULL DEFAULT '',
        creditor_account    TEXT NOT NULL DEFAULT '',
        amount              TEXT NOT NULL,
        amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
        currency            TEXT NOT NULL CHECK (length(currency) = 3),
        charge_bearer       TEXT NOT NULL DEFAULT 'SHAR'
                            CHECK (charge_bearer IN ('CRED', 'DEBT', 'SHAR', 'SLEV')),
        settlement_date     TEXT NOT NULL DEFAULT '',
        settlement_status   TEXT NOT NULL
                            CHECK (settlement_status IN (
                                'PENDING', 'SETTLED', 'REJECTED_TAMPERED',
                                'REJECTED_DUPLICATE', 'REJECTED_LIQUIDITY')),
        rejection_reason    TEXT NOT NULL DEFAULT '',
        raw_payload         TEXT NOT NULL,
        payload_sha256      TEXT NOT NULL CHECK (length(payload_sha256) = 64),
        signature           TEXT NOT NULL,
        created_at          TEXT NOT NULL,
        settled_at          TEXT
    )
    """,
    # MsgId uniqueness is scoped to the sending institution, matching ISO
    # 20022: MsgId is unique per sender, not globally. A global unique index
    # would let one participant deny service to another by burning a MsgId.
    """
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_sender_msgid
        ON payments (sender_bic, msg_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_payments_status_created
        ON payments (settlement_status, created_at)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_payments_receiver
        ON payments (receiver_bic, created_at)
    """,
    """
    CREATE TABLE IF NOT EXISTS ledger_entries (
        entry_id            INTEGER PRIMARY KEY AUTOINCREMENT,
        uetr                TEXT NOT NULL REFERENCES payments(uetr)
                            ON DELETE RESTRICT,
        account_id          TEXT NOT NULL REFERENCES accounts(account_id)
                            ON DELETE RESTRICT,
        direction           TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
        amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
        currency            TEXT NOT NULL CHECK (length(currency) = 3),
        balance_after_minor INTEGER NOT NULL,
        prev_hash           TEXT NOT NULL CHECK (length(prev_hash) = 64),
        entry_hash          TEXT NOT NULL UNIQUE CHECK (length(entry_hash) = 64),
        created_at          TEXT NOT NULL
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_ledger_uetr ON ledger_entries (uetr)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries (account_id, entry_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_log (
        audit_id    INTEGER PRIMARY KEY AUTOINCREMENT,
        occurred_at TEXT NOT NULL,
        actor       TEXT NOT NULL,
        event       TEXT NOT NULL,
        uetr        TEXT,
        detail      TEXT NOT NULL DEFAULT '{}',
        prev_hash   TEXT NOT NULL CHECK (length(prev_hash) = 64),
        entry_hash  TEXT NOT NULL UNIQUE CHECK (length(entry_hash) = 64)
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_audit_uetr ON audit_log (uetr)
    """,
)

MIGRATIONS: Final[tuple[tuple[int, str], ...]] = (
    (1, "initial schema: institutions, accounts, payments, ledger, audit"),
)


# --------------------------------------------------------------------------
# Connection pool
# --------------------------------------------------------------------------

class ConnectionPool:
    """A bounded pool of ``aiosqlite`` connections.

    SQLite in WAL mode supports one writer and many concurrent readers. A
    single shared connection serialises *reads* behind writes for no reason;
    a connection per task exhausts file descriptors under load. A bounded
    pool is the correct middle: readers proceed in parallel, and the writer
    count is naturally capped by the pool size.

    Each connection is configured identically on checkout-time creation.
    PRAGMAs are per-connection in SQLite — setting ``foreign_keys`` on one
    connection does not affect another — so a pool that configures only the
    first connection silently disables referential integrity on the rest.
    That bug is why ``_configure`` runs for every connection without
    exception.
    """

    def __init__(self, path: str | Path, *, size: int = 5, timeout: float = 30.0) -> None:
        if size < 1:
            raise ValueError("pool size must be >= 1")
        self._path = str(path)
        self._size = size
        self._timeout = timeout
        self._pool: asyncio.Queue[aiosqlite.Connection] = asyncio.Queue(maxsize=size)
        self._all: list[aiosqlite.Connection] = []
        self._open = False
        self._lock = asyncio.Lock()

    @property
    def path(self) -> str:
        return self._path

    @property
    def size(self) -> int:
        return self._size

    async def open(self) -> None:
        async with self._lock:
            if self._open:
                return
            for _ in range(self._size):
                conn = await self._connect()
                self._all.append(conn)
                self._pool.put_nowait(conn)
            self._open = True

    async def _connect(self) -> aiosqlite.Connection:
        conn = await aiosqlite.connect(self._path, timeout=self._timeout, isolation_level=None)
        # aiosqlite drives each connection from a dedicated worker *thread*,
        # and as of 0.22 that thread is NOT a daemon. A connection that is
        # never closed therefore keeps the interpreter alive after the main
        # coroutine returns: the process hangs at exit with no traceback and
        # no CPU use, and in a container the orchestrator eventually SIGKILLs
        # it past the grace period. Marking the thread daemon makes an
        # unclean shutdown merely untidy instead of fatal. It is a backstop,
        # not a licence to skip close(): a daemon thread is killed abruptly,
        # so an in-flight WAL checkpoint is still lost. Always call close().
        if isinstance(conn, __import__("threading").Thread):
            conn.daemon = True
        conn.row_factory = sqlite3.Row
        await self._configure(conn)
        return conn

    @staticmethod
    async def _configure(conn: aiosqlite.Connection) -> None:
        # journal_mode is persistent in the database file, but the remaining
        # PRAGMAs are per-connection and must be re-issued every time.
        await conn.execute("PRAGMA journal_mode = WAL")
        await conn.execute("PRAGMA foreign_keys = ON")
        await conn.execute("PRAGMA busy_timeout = 30000")
        # FULL, not NORMAL: this is a settlement ledger. NORMAL can lose the
        # last committed transaction on power loss, which for a payment hub
        # means a debit that reached the counterparty but not the journal.
        await conn.execute("PRAGMA synchronous = FULL")

    @asynccontextmanager
    async def acquire(self) -> AsyncIterator[aiosqlite.Connection]:
        if not self._open:
            await self.open()
        conn = await self._pool.get()
        try:
            yield conn
        finally:
            self._pool.put_nowait(conn)

    async def close(self) -> None:
        async with self._lock:
            if not self._open:
                return
            self._open = False
            for conn in self._all:
                try:
                    await conn.close()
                except Exception:  # pragma: no cover - best-effort teardown
                    pass
            self._all.clear()
            while not self._pool.empty():
                self._pool.get_nowait()


# --------------------------------------------------------------------------
# Database facade
# --------------------------------------------------------------------------

class Database:
    """Async persistence facade over :class:`ConnectionPool`."""

    def __init__(self, path: str | Path = ":memory:", *, pool_size: int = 5) -> None:
        # ``:memory:`` gives every *connection* its own private database, so a
        # pooled in-memory database would appear empty from four of its five
        # connections. The shared-cache URI form makes all pooled connections
        # address one database.
        #
        # The name must be unique per Database instance. A fixed name would
        # make every ``Database(":memory:")`` in a process alias the SAME
        # database — two test cases would then see each other's institutions,
        # accounts and ledger entries, and a suite that passes in isolation
        # would fail (or, far worse, spuriously pass) when run together.
        if str(path) == ":memory:":
            path = f"file:nexusswift_{uuid.uuid4().hex}?mode=memory&cache=shared"
            # Shared-cache in-memory databases are torn down when the LAST
            # connection closes, so the pool must hold them all open for the
            # lifetime of the Database. A pool larger than one is fine; one
            # keeps teardown deterministic and avoids SQLITE_LOCKED, which
            # shared-cache mode raises instead of SQLITE_BUSY (and which the
            # busy_timeout handler does NOT retry).
            pool_size = 1
        self._path = str(path)
        self._pool = ConnectionPool(self._path, size=pool_size)
        #: Serialises settlement. SQLite permits a single writer; taking this
        #: lock in-process turns a would-be ``SQLITE_BUSY`` retry storm into
        #: an orderly queue and makes read-modify-write on balances atomic
        #: against other tasks in this process.
        self.settlement_lock = asyncio.Lock()

    @property
    def path(self) -> str:
        return self._path

    @property
    def pool(self) -> ConnectionPool:
        return self._pool

    async def connect(self) -> "Database":
        await self._pool.open()
        return self

    async def close(self) -> None:
        await self._pool.close()

    async def __aenter__(self) -> "Database":
        return await self.connect()

    async def __aexit__(self, *_exc: object) -> None:
        await self.close()

    # -- schema ------------------------------------------------------------

    async def migrate(self) -> int:
        """Apply the schema. Returns the resulting schema version."""
        async with self._pool.acquire() as conn:
            for statement in SCHEMA_STATEMENTS:
                await conn.execute(statement)
            for version, description in MIGRATIONS:
                await conn.execute(
                    "INSERT OR IGNORE INTO schema_migrations (version, applied_at, description) "
                    "VALUES (?, ?, ?)",
                    (version, iso_timestamp(), description),
                )
            await conn.commit()
            cursor = await conn.execute("SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations")
            row = await cursor.fetchone()
            await cursor.close()
            return int(row["v"]) if row else 0

    # -- generic helpers ---------------------------------------------------

    async def fetch_one(self, sql: str, params: Sequence[Any] = ()) -> sqlite3.Row | None:
        async with self._pool.acquire() as conn:
            cursor = await conn.execute(sql, params)
            try:
                return await cursor.fetchone()
            finally:
                await cursor.close()

    async def fetch_all(self, sql: str, params: Sequence[Any] = ()) -> list[sqlite3.Row]:
        async with self._pool.acquire() as conn:
            cursor = await conn.execute(sql, params)
            try:
                return list(await cursor.fetchall())
            finally:
                await cursor.close()

    async def execute(self, sql: str, params: Sequence[Any] = ()) -> int:
        async with self._pool.acquire() as conn:
            cursor = await conn.execute(sql, params)
            await conn.commit()
            rowcount = cursor.rowcount
            await cursor.close()
            return rowcount

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator[aiosqlite.Connection]:
        """An explicit ``BEGIN IMMEDIATE`` transaction.

        IMMEDIATE, not DEFERRED. A deferred transaction takes the write lock
        lazily on first write, so two concurrent settlements can both read a
        balance, both decide there is cover, and only then contend — at which
        point one must be rolled back after work is already done. IMMEDIATE
        takes the reserved lock at BEGIN, so the loser blocks before it reads
        a balance it is not entitled to act on.
        """
        async with self._pool.acquire() as conn:
            await conn.execute("BEGIN IMMEDIATE")
            try:
                yield conn
            except BaseException:
                await conn.rollback()
                raise
            else:
                await conn.commit()

    # -- institutions ------------------------------------------------------

    async def register_institution(self, institution: Institution) -> None:
        await self.execute(
            "INSERT INTO institutions (bic, name, country, public_key_pem, status, registered_at) "
            "VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(bic) DO UPDATE SET "
            "  name = excluded.name, "
            "  country = excluded.country, "
            "  public_key_pem = excluded.public_key_pem, "
            "  status = excluded.status",
            (
                institution.bic,
                institution.name,
                institution.country,
                institution.public_key_pem,
                institution.status.value,
                iso_timestamp(institution.registered_at),
            ),
        )

    async def get_institution(self, bic: str) -> Institution | None:
        row = await self.fetch_one("SELECT * FROM institutions WHERE bic = ?", (bic,))
        return self._institution_from_row(row) if row else None

    @staticmethod
    def _institution_from_row(row: sqlite3.Row) -> Institution:
        return Institution(
            bic=row["bic"],
            name=row["name"],
            country=row["country"],
            public_key_pem=row["public_key_pem"],
            status=InstitutionStatus(row["status"]),
            registered_at=datetime.fromisoformat(row["registered_at"].replace("Z", "+00:00")),
        )

    # -- accounts ----------------------------------------------------------

    async def open_account(self, account: Account) -> bool:
        """Open an account, or update the terms of an existing one.

        Returns ``True`` if a new account was created, ``False`` if an
        existing one was updated.

        **An existing account's balance is never overwritten.** Only
        ``status`` and ``overdraft_limit_minor`` are updated on conflict.
        Re-opening an account and resetting its balance is not a banking
        operation — it is value created from nothing, and it silently
        invalidates every reconciliation that replays the journal from the
        opening balance.

        This was not theoretical: seeding the demo twice against a persistent
        volume reset both balances while the first run's ledger legs
        remained, and :meth:`ClearingEngine.reconcile` correctly reported the
        drift. The bug was in the reset, not in the detector. To move value,
        settle a payment; to correct an error, post a compensating entry.
        """
        minor_units(account.currency)  # validate the currency eagerly
        created = await self.fetch_one(
            "SELECT 1 AS present FROM accounts WHERE account_id = ?", (account.account_id,)
        ) is None
        await self.execute(
            "INSERT INTO accounts "
            "(account_id, bic, currency, balance_minor, overdraft_limit_minor, status, opened_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(account_id) DO UPDATE SET "
            "  overdraft_limit_minor = excluded.overdraft_limit_minor, "
            "  status = excluded.status "
            "WHERE accounts.account_id = excluded.account_id",
            (
                account.account_id,
                account.bic,
                account.currency,
                account.balance_minor,
                account.overdraft_limit_minor,
                account.status.value,
                iso_timestamp(),
            ),
        )
        return created

    async def get_account(self, account_id: str) -> Account | None:
        row = await self.fetch_one("SELECT * FROM accounts WHERE account_id = ?", (account_id,))
        return self._account_from_row(row) if row else None

    @staticmethod
    def _account_from_row(row: sqlite3.Row) -> Account:
        return Account(
            account_id=row["account_id"],
            bic=row["bic"],
            currency=row["currency"],
            balance_minor=int(row["balance_minor"]),
            status=AccountStatus(row["status"]),
            overdraft_limit_minor=int(row["overdraft_limit_minor"]),
        )

    async def accounts_for(self, bic: str) -> list[Account]:
        rows = await self.fetch_all(
            "SELECT * FROM accounts WHERE bic = ? ORDER BY account_id", (bic,)
        )
        return [self._account_from_row(row) for row in rows]

    # -- payments ----------------------------------------------------------

    async def get_payment(self, uetr: str) -> PaymentRecord | None:
        row = await self.fetch_one("SELECT * FROM payments WHERE uetr = ?", (uetr,))
        return self._payment_from_row(row) if row else None

    @staticmethod
    def _payment_from_row(row: sqlite3.Row) -> PaymentRecord:
        settled_at = row["settled_at"]
        return PaymentRecord(
            uetr=row["uetr"],
            msg_id=row["msg_id"],
            sender_bic=row["sender_bic"],
            receiver_bic=row["receiver_bic"],
            amount=Decimal(row["amount"]),
            currency=row["currency"],
            settlement_status=SettlementStatus(row["settlement_status"]),
            raw_payload=row["raw_payload"],
            signature=row["signature"],
            instr_id=row["instr_id"],
            end_to_end_id=row["end_to_end_id"],
            debtor_account=row["debtor_account"],
            creditor_account=row["creditor_account"],
            charge_bearer=row["charge_bearer"],
            settlement_date=row["settlement_date"],
            rejection_reason=RejectionReason(row["rejection_reason"]),
            payload_sha256=row["payload_sha256"],
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
            settled_at=(
                datetime.fromisoformat(settled_at.replace("Z", "+00:00")) if settled_at else None
            ),
        )

    async def payments_by_status(self, status: SettlementStatus) -> list[PaymentRecord]:
        rows = await self.fetch_all(
            "SELECT * FROM payments WHERE settlement_status = ? ORDER BY created_at",
            (status.value,),
        )
        return [self._payment_from_row(row) for row in rows]

    # -- ledger ------------------------------------------------------------

    async def ledger_for(self, uetr: str) -> list[LedgerEntry]:
        rows = await self.fetch_all(
            "SELECT * FROM ledger_entries WHERE uetr = ? ORDER BY entry_id", (uetr,)
        )
        return [self._ledger_from_row(row) for row in rows]

    async def all_ledger_entries(self) -> list[LedgerEntry]:
        rows = await self.fetch_all("SELECT * FROM ledger_entries ORDER BY entry_id")
        return [self._ledger_from_row(row) for row in rows]

    @staticmethod
    def _ledger_from_row(row: sqlite3.Row) -> LedgerEntry:
        return LedgerEntry(
            entry_id=int(row["entry_id"]),
            uetr=row["uetr"],
            account_id=row["account_id"],
            direction=LedgerDirection(row["direction"]),
            amount_minor=int(row["amount_minor"]),
            currency=row["currency"],
            balance_after_minor=int(row["balance_after_minor"]),
            prev_hash=row["prev_hash"],
            entry_hash=row["entry_hash"],
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
        )

    async def verify_ledger_chain(self) -> tuple[bool, str | None]:
        """Recompute the hash chain end to end.

        Returns ``(True, None)`` when intact, otherwise ``(False, detail)``
        naming the first entry that does not reconcile. This is the check an
        auditor runs: it proves no settled row was altered after the fact,
        because altering any field changes that row's hash and every hash
        after it.
        """
        entries = await self.all_ledger_entries()
        prev = GENESIS_HASH
        for entry in entries:
            if entry.prev_hash != prev:
                return False, (
                    f"entry {entry.entry_id} claims prev_hash {entry.prev_hash[:12]}… "
                    f"but chain head is {prev[:12]}…"
                )
            recomputed = LedgerEntry.compute_hash(
                uetr=entry.uetr,
                account_id=entry.account_id,
                direction=entry.direction,
                amount_minor=entry.amount_minor,
                currency=entry.currency,
                balance_after_minor=entry.balance_after_minor,
                created_at=iso_timestamp(entry.created_at),
                prev_hash=entry.prev_hash,
            )
            if recomputed != entry.entry_hash:
                return False, f"entry {entry.entry_id} hash mismatch (row was altered)"
            prev = entry.entry_hash
        return True, None

    async def ledger_head(self, conn: aiosqlite.Connection | None = None) -> str:
        sql = "SELECT entry_hash FROM ledger_entries ORDER BY entry_id DESC LIMIT 1"
        if conn is not None:
            cursor = await conn.execute(sql)
            row = await cursor.fetchone()
            await cursor.close()
        else:
            row = await self.fetch_one(sql)
        return row["entry_hash"] if row else GENESIS_HASH

    # -- audit -------------------------------------------------------------

    async def append_audit(
        self,
        *,
        actor: str,
        event: str,
        uetr: str | None = None,
        detail: Mapping[str, Any] | None = None,
        conn: aiosqlite.Connection | None = None,
    ) -> str:
        """Append a hash-chained audit record. Returns the new head hash."""
        occurred_at = iso_timestamp()
        payload = json.dumps(dict(detail or {}), sort_keys=True, separators=(",", ":"))

        async def _write(connection: aiosqlite.Connection) -> str:
            cursor = await connection.execute(
                "SELECT entry_hash FROM audit_log ORDER BY audit_id DESC LIMIT 1"
            )
            row = await cursor.fetchone()
            await cursor.close()
            prev = row["entry_hash"] if row else GENESIS_HASH
            entry_hash = sha256_hex(occurred_at, actor, event, uetr or "", payload, prev)
            await connection.execute(
                "INSERT INTO audit_log (occurred_at, actor, event, uetr, detail, prev_hash, entry_hash) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (occurred_at, actor, event, uetr, payload, prev, entry_hash),
            )
            return entry_hash

        if conn is not None:
            # Already inside a caller's transaction: the head read and the
            # insert are atomic by virtue of that transaction.
            return await _write(conn)

        # Standalone append. This MUST be a transaction, not a bare
        # execute+commit. The chain is a read-modify-write — read the current
        # head, hash against it, insert — and two concurrent appends that
        # read the same head compute their hashes over the same predecessor.
        # When the rest of the input matches too (same actor, event, UETR and
        # detail, within the same millisecond — exactly what a replay burst
        # against one payment produces) the two hashes are IDENTICAL and the
        # second insert dies on the UNIQUE constraint.
        #
        # That surfaced as a nondeterministic IntegrityError under a 16-way
        # concurrent replay burst. BEGIN IMMEDIATE serialises the whole
        # read-modify-write, so every append sees a distinct head and the
        # chain stays strictly linear.
        async with self.transaction() as connection:
            return await _write(connection)

    async def audit_trail(self, uetr: str | None = None) -> list[sqlite3.Row]:
        if uetr is None:
            return await self.fetch_all("SELECT * FROM audit_log ORDER BY audit_id")
        return await self.fetch_all(
            "SELECT * FROM audit_log WHERE uetr = ? ORDER BY audit_id", (uetr,)
        )
