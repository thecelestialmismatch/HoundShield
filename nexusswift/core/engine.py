"""
NexusSwift :: core.engine
=========================

The asynchronous clearing gateway: the component that decides whether a
signed pacs.008 becomes money moving between two institutions.

The transaction lifecycle is a fixed, ordered pipeline, and **the order is a
security property, not a style choice**:

    1. PARSE      structural + namespace validation (core.schemas)
    2. IDEMPOTENCY has this UETR or (sender, MsgId) been seen before?
    3. IDENTITY    are both agents registered, active participants?
    4. AUTHENTICITY RSA-PSS verification against the sender's registered key
    5. SETTLEMENT  atomic, double-entry, liquidity-checked balance transfer

Why this order and no other:

*Parse before everything* — you cannot look up a sender you have not parsed.

*Idempotency before signature verification.* Verification is the single most
expensive step in the pipeline (an RSA-4096 public operation plus a SHA-256
over the document). A replay attacker who can force verification before the
duplicate check gets an amplification primitive: cheap to send, expensive to
reject. Checking the index first makes a replay cost a B-tree lookup.

*Identity before authenticity.* Verifying a signature requires a public key;
resolving the public key requires knowing the institution. There is no way to
authenticate a party you cannot identify.

*Authenticity before settlement, always.* This is the invariant the whole
system rests on. No balance is read, no lock is taken, and no row is written
against an unverified document. An engine that checks liquidity first leaks
account balances to an unauthenticated caller through timing and error codes.

*Settlement last, and atomically.* The debit, the credit, the two ledger
rows, and the payment's status change are one database transaction. There is
no interleaving in which money exists in both accounts or in neither.

Attributable vs unattributable rejection
----------------------------------------

Where a rejection is *recorded* depends on whether the hub can prove who
sent the message, and this is a security property rather than a filing
convention.

A message that fails at or before step 4 is **unattributable**: the hub
cannot name a responsible party, so it is written to the append-only audit
log and nowhere else. In particular it does NOT consume the UETR. If it did,
anyone who observed a UETR in flight could submit it with a garbage
signature and permanently block the genuine payment behind it — a
denial-of-service primitive available to any unauthenticated party.

A message that reaches step 5 has a cryptographically proven sender and is
**attributable**. Its rejection is journalled into ``payments``, consuming
the UETR and terminating that payment's lifecycle with a final status. This
is the SWIFT gpi semantic: a terminally rejected payment is finished, and
the payer retries under a new UETR rather than resurrecting a closed one.

Concurrency model
-----------------

Two layers guard against double-spend:

**In-process:** ``Database.settlement_lock`` serialises the read-modify-write
on balances between asyncio tasks. Without it, two coroutines can both await
a balance read, both observe sufficient funds, and both proceed — the classic
TOCTOU double-spend, which asyncio makes *easy* to hit because every ``await``
is a yield point.

**Cross-process:** ``BEGIN IMMEDIATE`` plus the ``UNIQUE`` constraints. The
in-process lock does nothing for a second worker process, so correctness may
not depend on it. Idempotency is enforced by the ``payments.uetr`` primary
key and the ``(sender_bic, msg_id)`` unique index — the engine *attempts* the
insert and treats ``IntegrityError`` as the duplicate signal, because a
SELECT-then-INSERT has a race window and a constraint does not.
"""

from __future__ import annotations

import asyncio
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any, Final, Mapping, Sequence

import aiosqlite

from .crypto import (
    KeyImportError,
    KeyRegistry,
    SignatureMalformedError,
    SigningEngine,
)
from .models import (
    Account,
    AccountStatus,
    CurrencyError,
    Database,
    GENESIS_HASH,
    Institution,
    InstitutionStatus,
    LedgerDirection,
    LedgerEntry,
    PaymentRecord,
    RejectionReason,
    SettlementStatus,
    format_amount,
    iso_timestamp,
    sha256_hex,
    to_minor,
    utc_now,
)
from .schemas import (
    CreditTransfer,
    SchemaValidationException,
    parse_pacs008,
)

__all__ = [
    "ClearingResult",
    "ClearingEngine",
    "ClearingError",
]


class ClearingError(Exception):
    """Raised only for conditions that are the hub's own fault.

    A rejected payment is *not* an error — it is a normal, expected outcome
    reported through :class:`ClearingResult`. Raising on a rejection would
    force every caller into a try/except to handle the ordinary case, and
    the exceptional path is where bugs hide. This exception is reserved for
    the hub being broken: an unmigrated database, a corrupt ledger chain.
    """


@dataclass(frozen=True, slots=True)
class ClearingResult:
    """The outcome of submitting one payment. Never raises; always explains."""

    status: SettlementStatus
    reason: RejectionReason = RejectionReason.NONE
    uetr: str = ""
    msg_id: str = ""
    detail: str = ""
    #: Populated only on SETTLED.
    debit_balance_after: int | None = None
    credit_balance_after: int | None = None
    ledger_entry_ids: tuple[int, ...] = ()
    #: Wall-clock duration of the whole pipeline, milliseconds.
    elapsed_ms: float = 0.0

    @property
    def settled(self) -> bool:
        return self.status is SettlementStatus.SETTLED

    @property
    def rejected(self) -> bool:
        return self.status.is_rejection

    def __str__(self) -> str:
        head = f"{self.status.value}"
        if self.reason is not RejectionReason.NONE:
            head += f" [{self.reason.value}]"
        if self.uetr:
            head += f" uetr={self.uetr}"
        if self.detail:
            head += f" — {self.detail}"
        return head

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status.value,
            "reason": self.reason.value,
            "uetr": self.uetr,
            "msg_id": self.msg_id,
            "detail": self.detail,
            "debit_balance_after": self.debit_balance_after,
            "credit_balance_after": self.credit_balance_after,
            "ledger_entry_ids": list(self.ledger_entry_ids),
            "elapsed_ms": round(self.elapsed_ms, 3),
        }


class ClearingEngine:
    """The central clearing gateway."""

    def __init__(self, database: Database, *, hub_name: str = "NEXUSSWIFT") -> None:
        self._db = database
        self._hub = hub_name
        self._keys = KeyRegistry()

    @property
    def db(self) -> Database:
        return self._db

    @property
    def keys(self) -> KeyRegistry:
        return self._keys

    # ------------------------------------------------------------------
    # Participant administration
    # ------------------------------------------------------------------

    async def register_institution(self, institution: Institution) -> None:
        """Register or update a participant and cache its public key.

        The PEM is parsed here, at registration time, so an unusable key is
        rejected by the operator who is registering it rather than surfacing
        hours later as a mysterious verification failure on a live payment.
        """
        try:
            self._keys.register(institution.bic, institution.public_key_pem)
        except KeyImportError as exc:
            raise ClearingError(
                f"cannot register {institution.bic}: {exc}"
            ) from exc
        await self._db.register_institution(institution)
        await self._db.append_audit(
            actor=self._hub,
            event="INSTITUTION_REGISTERED",
            detail={
                "bic": institution.bic,
                "name": institution.name,
                "key_fingerprint": institution.key_fingerprint,
            },
        )

    async def open_account(self, account: Account) -> bool:
        """Open an account, or update the terms of an existing one.

        ``ACCOUNT_OPENED`` is emitted exactly once per account, carrying the
        opening balance that :meth:`reconcile` replays the journal from. An
        update emits ``ACCOUNT_TERMS_UPDATED`` instead and never restates an
        opening balance, because a second opening balance for the same
        account would make the replay ambiguous.
        """
        created = await self._db.open_account(account)
        if created:
            await self._db.append_audit(
                actor=self._hub,
                event="ACCOUNT_OPENED",
                detail={
                    "account_id": account.account_id,
                    "bic": account.bic,
                    "currency": account.currency,
                    "opening_balance_minor": account.balance_minor,
                    "overdraft_limit_minor": account.overdraft_limit_minor,
                },
            )
        else:
            await self._db.append_audit(
                actor=self._hub,
                event="ACCOUNT_TERMS_UPDATED",
                detail={
                    "account_id": account.account_id,
                    "status": account.status.value,
                    "overdraft_limit_minor": account.overdraft_limit_minor,
                },
            )
        return created

    async def _resolve_key(self, institution: Institution):
        """Public key for an institution, parsing only on a cache miss."""
        return self._keys.resolve(institution.bic, institution.public_key_pem)

    # ------------------------------------------------------------------
    # The clearing pipeline
    # ------------------------------------------------------------------

    async def clear(self, raw_payload: str, signature_b64: str) -> ClearingResult:
        """Submit one signed pacs.008 for clearing.

        ``raw_payload`` must be the exact document that was signed. It is
        stored verbatim and never re-serialised — see ``core.schemas``.
        """
        started = asyncio.get_running_loop().time()

        def finish(result: ClearingResult) -> ClearingResult:
            elapsed = (asyncio.get_running_loop().time() - started) * 1000.0
            return ClearingResult(
                status=result.status,
                reason=result.reason,
                uetr=result.uetr,
                msg_id=result.msg_id,
                detail=result.detail,
                debit_balance_after=result.debit_balance_after,
                credit_balance_after=result.credit_balance_after,
                ledger_entry_ids=result.ledger_entry_ids,
                elapsed_ms=elapsed,
            )

        # -- STEP 1: parse and structurally validate --------------------
        try:
            transfer = parse_pacs008(raw_payload)
        except SchemaValidationException as exc:
            # Nothing is journalled: without a valid UETR there is no primary
            # key to journal under, and inventing one would create a record
            # that no counterparty can ever reference or query.
            await self._db.append_audit(
                actor=self._hub,
                event="REJECTED_AT_PARSE",
                detail={"error": exc.message, "path": exc.path},
            )
            return finish(
                ClearingResult(
                    status=SettlementStatus.REJECTED_TAMPERED,
                    reason=RejectionReason.SCHEMA_INVALID,
                    detail=str(exc),
                )
            )

        payload_digest = SigningEngine.digest(raw_payload)

        # -- STEP 2: idempotency ----------------------------------------
        # Cheap index lookups before the expensive RSA operation, so a replay
        # flood cannot be amplified into a CPU exhaustion attack.
        existing = await self._db.get_payment(transfer.uetr)
        if existing is not None:
            return finish(
                await self._reject_duplicate(
                    transfer,
                    RejectionReason.DUPLICATE_UETR,
                    f"UETR {transfer.uetr} was already processed at "
                    f"{iso_timestamp(existing.created_at)} with status "
                    f"{existing.settlement_status.value}",
                )
            )

        clashing = await self._db.fetch_one(
            "SELECT uetr, created_at FROM payments WHERE sender_bic = ? AND msg_id = ?",
            (transfer.sender_bic, transfer.msg_id),
        )
        if clashing is not None:
            return finish(
                await self._reject_duplicate(
                    transfer,
                    RejectionReason.DUPLICATE_MSG_ID,
                    f"MsgId {transfer.msg_id} was already used by "
                    f"{transfer.sender_bic} for UETR {clashing['uetr']}",
                )
            )

        # -- STEP 3: identity -------------------------------------------
        sender = await self._db.get_institution(transfer.sender_bic)
        if sender is None:
            return finish(
                await self._reject_unauthenticated(
                    transfer,
                    payload_digest,
                    RejectionReason.UNKNOWN_INSTITUTION,
                    f"debtor agent {transfer.sender_bic} is not a registered participant",
                )
            )
        receiver = await self._db.get_institution(transfer.receiver_bic)
        if receiver is None:
            return finish(
                await self._reject_unauthenticated(
                    transfer,
                    payload_digest,
                    RejectionReason.UNKNOWN_INSTITUTION,
                    f"creditor agent {transfer.receiver_bic} is not a registered participant",
                )
            )
        for participant in (sender, receiver):
            if participant.status is not InstitutionStatus.ACTIVE:
                return finish(
                    await self._reject_unauthenticated(
                        transfer,
                        payload_digest,
                        RejectionReason.INSTITUTION_SUSPENDED,
                        f"{participant.bic} is {participant.status.value} and may not clear",
                    )
                )

        # -- STEP 4: authenticity ---------------------------------------
        try:
            public_key = await self._resolve_key(sender)
        except KeyImportError as exc:
            return finish(
                await self._reject_unauthenticated(
                    transfer,
                    payload_digest,
                    RejectionReason.NO_REGISTERED_KEY,
                    f"registered key for {sender.bic} is unusable: {exc}",
                )
            )

        try:
            authentic = SigningEngine.verify(public_key, raw_payload, signature_b64)
        except SignatureMalformedError as exc:
            return finish(
                await self._reject_unauthenticated(
                    transfer,
                    payload_digest,
                    RejectionReason.SIGNATURE_MALFORMED,
                    str(exc),
                )
            )
        if not authentic:
            return finish(
                await self._reject_unauthenticated(
                    transfer,
                    payload_digest,
                    RejectionReason.SIGNATURE_INVALID,
                    "RSA-PSS verification failed: the payload does not match the "
                    "signature presented by the debtor agent",
                )
            )

        # -- STEP 5: settlement -----------------------------------------
        return finish(
            await self._settle(
                transfer=transfer,
                raw_payload=raw_payload,
                signature_b64=signature_b64,
                payload_digest=payload_digest,
            )
        )

    # ------------------------------------------------------------------
    # Rejection journalling
    # ------------------------------------------------------------------

    async def _reject_duplicate(
        self, transfer: CreditTransfer, reason: RejectionReason, detail: str
    ) -> ClearingResult:
        """A replay is audited but deliberately NOT journalled again.

        Writing a second ``payments`` row is impossible anyway (the UETR is
        the primary key), and inventing a surrogate key for the replay would
        make ``SELECT … WHERE uetr = ?`` ambiguous. The audit log is the
        correct home for "someone tried this again": it is append-only, it
        preserves the attempt count, and it does not corrupt the payment
        journal's one-row-per-payment invariant.
        """
        await self._db.append_audit(
            actor=transfer.sender_bic,
            event="REPLAY_REJECTED",
            uetr=transfer.uetr,
            detail={"reason": reason.value, "msg_id": transfer.msg_id, "detail": detail},
        )
        return ClearingResult(
            status=SettlementStatus.REJECTED_DUPLICATE,
            reason=reason,
            uetr=transfer.uetr,
            msg_id=transfer.msg_id,
            detail=detail,
        )

    async def _reject_unauthenticated(
        self,
        transfer: CreditTransfer,
        payload_digest: str,
        reason: RejectionReason,
        detail: str,
    ) -> ClearingResult:
        """Reject a message whose sender could not be authenticated.

        Audited, but deliberately **not** journalled into ``payments``.

        The distinction is a security property. Journalling consumes the
        UETR, and a consumed UETR can never settle. If an unauthenticated
        message could consume one, then anyone who observes a UETR in flight
        — or guesses one — could submit it with a garbage signature and
        permanently block the genuine payment behind it. That is a
        denial-of-service primitive handed out for free, and it is strictly
        worse than the problem journalling was meant to solve.

        The rule that resolves it: **an unattributable message may not mutate
        state that authenticated parties depend on.** A message that fails
        signature verification is unattributable by definition — the hub
        cannot say who sent it, so it cannot hold anyone accountable for the
        consequences of acting on it. It is recorded in the append-only audit
        log, where it is available for forensics and rate-limiting, and
        nowhere else.

        Once a sender IS proven (verification passed), the calculus inverts:
        that party is accountable, its UETR lifecycle is its own to spend,
        and :meth:`_journal_rejection` terminates it.
        """
        await self._db.append_audit(
            actor=transfer.sender_bic,
            event="UNAUTHENTICATED_REJECTED",
            uetr=transfer.uetr,
            detail={
                "reason": reason.value,
                "msg_id": transfer.msg_id,
                "detail": detail,
                "payload_sha256": payload_digest,
                "claimed_sender": transfer.sender_bic,
                "claimed_receiver": transfer.receiver_bic,
            },
        )
        return ClearingResult(
            status=SettlementStatus.REJECTED_TAMPERED,
            reason=reason,
            uetr=transfer.uetr,
            msg_id=transfer.msg_id,
            detail=detail,
        )

    async def _journal_rejection(
        self,
        transfer: CreditTransfer,
        raw_payload: str,
        signature_b64: str,
        payload_digest: str,
        status: SettlementStatus,
        reason: RejectionReason,
        detail: str,
    ) -> ClearingResult:
        """Persist a rejection from an *authenticated* sender, consuming its UETR.

        Only reachable after RSA-PSS verification has succeeded, so the
        sender is cryptographically proven. Journalling here terminates that
        UETR's lifecycle with a final status, which is exactly the SWIFT gpi
        semantic: a payment that reaches a terminal rejection is finished,
        and the payer retries with a NEW UETR rather than resurrecting a
        closed one.

        This must never be called for a message that failed authentication.
        See :meth:`_reject_unauthenticated` for why that would hand an
        attacker a denial-of-service primitive.
        """
        try:
            amount_minor = to_minor(transfer.amount, transfer.currency)
        except CurrencyError:  # pragma: no cover - schema validation precedes this
            amount_minor = 0

        try:
            async with self._db.transaction() as conn:
                await conn.execute(
                    """
                    INSERT INTO payments (
                        uetr, msg_id, instr_id, end_to_end_id,
                        sender_bic, receiver_bic, debtor_account, creditor_account,
                        amount, amount_minor, currency, charge_bearer, settlement_date,
                        settlement_status, rejection_reason,
                        raw_payload, payload_sha256, signature, created_at, settled_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                    """,
                    (
                        transfer.uetr,
                        transfer.msg_id,
                        transfer.instr_id,
                        transfer.end_to_end_id,
                        transfer.sender_bic,
                        transfer.receiver_bic,
                        transfer.debtor.account,
                        transfer.creditor.account,
                        format_amount(transfer.amount, transfer.currency),
                        max(amount_minor, 1),  # CHECK requires > 0
                        transfer.currency,
                        transfer.charge_bearer,
                        transfer.settlement_date,
                        status.value,
                        reason.value,
                        raw_payload,
                        payload_digest,
                        signature_b64,
                        iso_timestamp(),
                    ),
                )
                await self._db.append_audit(
                    actor=transfer.sender_bic,
                    event="PAYMENT_REJECTED",
                    uetr=transfer.uetr,
                    detail={"status": status.value, "reason": reason.value, "detail": detail},
                    conn=conn,
                )
        except sqlite3.IntegrityError as exc:
            # Lost a race against a concurrent submission of the same UETR.
            # The constraint did its job; report it as the duplicate it is.
            return await self._reject_duplicate(
                transfer,
                RejectionReason.DUPLICATE_UETR,
                f"concurrent submission won the race for UETR {transfer.uetr} ({exc})",
            )

        return ClearingResult(
            status=status,
            reason=reason,
            uetr=transfer.uetr,
            msg_id=transfer.msg_id,
            detail=detail,
        )

    # ------------------------------------------------------------------
    # Settlement
    # ------------------------------------------------------------------

    async def _settle(
        self,
        *,
        transfer: CreditTransfer,
        raw_payload: str,
        signature_b64: str,
        payload_digest: str,
    ) -> ClearingResult:
        """Atomically move value and journal the result.

        Everything below the lock happens inside one ``BEGIN IMMEDIATE``
        transaction. Any exception rolls the whole thing back, including the
        payment row, so there is no state in which a payment is marked
        SETTLED without its two ledger legs.
        """
        amount_minor = to_minor(transfer.amount, transfer.currency)
        now = iso_timestamp()

        async with self._db.settlement_lock:
            try:
                async with self._db.transaction() as conn:
                    # -- load both accounts under the write lock ---------
                    debtor_account = await self._load_account(conn, transfer.debtor.account)
                    creditor_account = await self._load_account(conn, transfer.creditor.account)

                    if debtor_account is None:
                        raise _Rejected(
                            SettlementStatus.REJECTED_LIQUIDITY,
                            RejectionReason.UNKNOWN_ACCOUNT,
                            f"debtor settlement account {transfer.debtor.account} does not exist",
                        )
                    if creditor_account is None:
                        raise _Rejected(
                            SettlementStatus.REJECTED_LIQUIDITY,
                            RejectionReason.UNKNOWN_ACCOUNT,
                            f"creditor settlement account {transfer.creditor.account} does not exist",
                        )

                    # The account must belong to the agent that claims it.
                    # Without this, a registered participant could name a
                    # rival's account as the debtor and drain it with a
                    # perfectly valid signature over its own document.
                    if debtor_account.bic != transfer.sender_bic:
                        raise _Rejected(
                            SettlementStatus.REJECTED_TAMPERED,
                            RejectionReason.UNKNOWN_ACCOUNT,
                            f"account {debtor_account.account_id} is held by "
                            f"{debtor_account.bic}, not by debtor agent {transfer.sender_bic}",
                        )
                    if creditor_account.bic != transfer.receiver_bic:
                        raise _Rejected(
                            SettlementStatus.REJECTED_TAMPERED,
                            RejectionReason.UNKNOWN_ACCOUNT,
                            f"account {creditor_account.account_id} is held by "
                            f"{creditor_account.bic}, not by creditor agent {transfer.receiver_bic}",
                        )

                    for account, role in ((debtor_account, "debtor"), (creditor_account, "creditor")):
                        if account.status is not AccountStatus.ACTIVE:
                            raise _Rejected(
                                SettlementStatus.REJECTED_LIQUIDITY,
                                RejectionReason.ACCOUNT_BLOCKED,
                                f"{role} account {account.account_id} is {account.status.value}",
                            )
                        if account.currency != transfer.currency:
                            raise _Rejected(
                                SettlementStatus.REJECTED_LIQUIDITY,
                                RejectionReason.CURRENCY_MISMATCH,
                                f"{role} account {account.account_id} is denominated in "
                                f"{account.currency}; the instruction settles {transfer.currency}. "
                                "This hub does not perform FX conversion.",
                            )

                    # -- liquidity ---------------------------------------
                    if not debtor_account.can_debit(amount_minor):
                        shortfall = amount_minor - debtor_account.available_minor
                        raise _Rejected(
                            SettlementStatus.REJECTED_LIQUIDITY,
                            RejectionReason.INSUFFICIENT_FUNDS,
                            f"debtor account {debtor_account.account_id} has "
                            f"{format_amount(debtor_account.balance, transfer.currency)} "
                            f"{transfer.currency} available "
                            f"(limit {debtor_account.overdraft_limit_minor} minor units); "
                            f"instruction requires "
                            f"{format_amount(transfer.amount, transfer.currency)} — "
                            f"short by {shortfall} minor units",
                        )

                    # -- journal the payment first -----------------------
                    # Inserted before the balance movement so that the
                    # ledger rows' foreign key to payments(uetr) resolves,
                    # and so the UNIQUE constraint rejects a concurrent
                    # duplicate before any money moves.
                    await conn.execute(
                        """
                        INSERT INTO payments (
                            uetr, msg_id, instr_id, end_to_end_id,
                            sender_bic, receiver_bic, debtor_account, creditor_account,
                            amount, amount_minor, currency, charge_bearer, settlement_date,
                            settlement_status, rejection_reason,
                            raw_payload, payload_sha256, signature, created_at, settled_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)
                        """,
                        (
                            transfer.uetr,
                            transfer.msg_id,
                            transfer.instr_id,
                            transfer.end_to_end_id,
                            transfer.sender_bic,
                            transfer.receiver_bic,
                            transfer.debtor.account,
                            transfer.creditor.account,
                            format_amount(transfer.amount, transfer.currency),
                            amount_minor,
                            transfer.currency,
                            transfer.charge_bearer,
                            transfer.settlement_date,
                            SettlementStatus.SETTLED.value,
                            raw_payload,
                            payload_digest,
                            signature_b64,
                            now,
                            now,
                        ),
                    )

                    # -- move the money ----------------------------------
                    debit_balance = debtor_account.balance_minor - amount_minor
                    credit_balance = creditor_account.balance_minor + amount_minor

                    await conn.execute(
                        "UPDATE accounts SET balance_minor = ? WHERE account_id = ?",
                        (debit_balance, debtor_account.account_id),
                    )
                    await conn.execute(
                        "UPDATE accounts SET balance_minor = ? WHERE account_id = ?",
                        (credit_balance, creditor_account.account_id),
                    )

                    # -- double-entry ledger, hash-chained ---------------
                    head = await self._db.ledger_head(conn)
                    debit_id, head = await self._append_ledger(
                        conn,
                        uetr=transfer.uetr,
                        account_id=debtor_account.account_id,
                        direction=LedgerDirection.DEBIT,
                        amount_minor=amount_minor,
                        currency=transfer.currency,
                        balance_after_minor=debit_balance,
                        created_at=now,
                        prev_hash=head,
                    )
                    credit_id, head = await self._append_ledger(
                        conn,
                        uetr=transfer.uetr,
                        account_id=creditor_account.account_id,
                        direction=LedgerDirection.CREDIT,
                        amount_minor=amount_minor,
                        currency=transfer.currency,
                        balance_after_minor=credit_balance,
                        created_at=now,
                        prev_hash=head,
                    )

                    await self._db.append_audit(
                        actor=transfer.sender_bic,
                        event="PAYMENT_SETTLED",
                        uetr=transfer.uetr,
                        detail={
                            "msg_id": transfer.msg_id,
                            "amount": format_amount(transfer.amount, transfer.currency),
                            "currency": transfer.currency,
                            "debtor_account": debtor_account.account_id,
                            "creditor_account": creditor_account.account_id,
                            "debit_balance_after": debit_balance,
                            "credit_balance_after": credit_balance,
                            "payload_sha256": payload_digest,
                            "ledger_head": head,
                        },
                        conn=conn,
                    )

                    return ClearingResult(
                        status=SettlementStatus.SETTLED,
                        uetr=transfer.uetr,
                        msg_id=transfer.msg_id,
                        detail=(
                            f"{format_amount(transfer.amount, transfer.currency)} "
                            f"{transfer.currency} {transfer.sender_bic} → {transfer.receiver_bic}"
                        ),
                        debit_balance_after=debit_balance,
                        credit_balance_after=credit_balance,
                        ledger_entry_ids=(debit_id, credit_id),
                    )

            except _Rejected as rejection:
                # The settlement transaction has already rolled back, so no
                # balance moved. Journal the rejection in its own transaction.
                return await self._journal_rejection(
                    transfer,
                    raw_payload,
                    signature_b64,
                    payload_digest,
                    rejection.status,
                    rejection.reason,
                    rejection.detail,
                )
            except sqlite3.IntegrityError as exc:
                return await self._reject_duplicate(
                    transfer,
                    RejectionReason.DUPLICATE_UETR,
                    f"concurrent submission won the race for UETR {transfer.uetr} ({exc})",
                )

    @staticmethod
    async def _load_account(conn: aiosqlite.Connection, account_id: str) -> Account | None:
        cursor = await conn.execute("SELECT * FROM accounts WHERE account_id = ?", (account_id,))
        row = await cursor.fetchone()
        await cursor.close()
        if row is None:
            return None
        return Account(
            account_id=row["account_id"],
            bic=row["bic"],
            currency=row["currency"],
            balance_minor=int(row["balance_minor"]),
            status=AccountStatus(row["status"]),
            overdraft_limit_minor=int(row["overdraft_limit_minor"]),
        )

    @staticmethod
    async def _append_ledger(
        conn: aiosqlite.Connection,
        *,
        uetr: str,
        account_id: str,
        direction: LedgerDirection,
        amount_minor: int,
        currency: str,
        balance_after_minor: int,
        created_at: str,
        prev_hash: str,
    ) -> tuple[int, str]:
        entry_hash = LedgerEntry.compute_hash(
            uetr=uetr,
            account_id=account_id,
            direction=direction,
            amount_minor=amount_minor,
            currency=currency,
            balance_after_minor=balance_after_minor,
            created_at=created_at,
            prev_hash=prev_hash,
        )
        cursor = await conn.execute(
            """
            INSERT INTO ledger_entries (
                uetr, account_id, direction, amount_minor, currency,
                balance_after_minor, prev_hash, entry_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                uetr,
                account_id,
                direction.value,
                amount_minor,
                currency,
                balance_after_minor,
                prev_hash,
                entry_hash,
                created_at,
            ),
        )
        entry_id = int(cursor.lastrowid or 0)
        await cursor.close()
        return entry_id, entry_hash

    # ------------------------------------------------------------------
    # Reconciliation
    # ------------------------------------------------------------------

    async def reconcile(self) -> dict[str, Any]:
        """Prove the ledger is internally consistent.

        Three independent checks, all of which must hold:

        1. **Conservation.** Debits and credits sum to zero per currency. A
           non-zero sum means value was created or destroyed.
        2. **Chain integrity.** Every entry hash recomputes, and every
           ``prev_hash`` matches its predecessor. A break means a settled row
           was altered after the fact.
        3. **Balance agreement.** Each account's stored balance equals the
           replay of its ledger legs from its opening balance. Disagreement
           means an ``UPDATE`` ran outside the settlement path.
        """
        per_currency: dict[str, int] = {}
        replayed: dict[str, int] = {}
        for entry in await self._db.all_ledger_entries():
            per_currency[entry.currency] = (
                per_currency.get(entry.currency, 0) + entry.direction.sign * entry.amount_minor
            )
            replayed[entry.account_id] = (
                replayed.get(entry.account_id, 0) + entry.direction.sign * entry.amount_minor
            )

        chain_ok, chain_detail = await self._db.verify_ledger_chain()

        opening = {
            row["account_id"]: int(row["opening_balance_minor"])
            for row in await self._db.fetch_all(
                "SELECT a.account_id, "
                "  COALESCE(("
                "    SELECT CAST(json_extract(l.detail, '$.opening_balance_minor') AS INTEGER) "
                "    FROM audit_log l "
                "    WHERE l.event = 'ACCOUNT_OPENED' "
                "      AND json_extract(l.detail, '$.account_id') = a.account_id "
                "    ORDER BY l.audit_id DESC LIMIT 1"
                "  ), 0) AS opening_balance_minor "
                "FROM accounts a"
            )
        }

        drift: dict[str, dict[str, int]] = {}
        for row in await self._db.fetch_all("SELECT account_id, balance_minor FROM accounts"):
            account_id = row["account_id"]
            expected = opening.get(account_id, 0) + replayed.get(account_id, 0)
            actual = int(row["balance_minor"])
            if expected != actual:
                drift[account_id] = {"expected": expected, "actual": actual}

        return {
            "conserved": all(total == 0 for total in per_currency.values()),
            "per_currency_net_minor": per_currency,
            "chain_intact": chain_ok,
            "chain_detail": chain_detail,
            "balances_agree": not drift,
            "balance_drift": drift,
            "healthy": (
                all(total == 0 for total in per_currency.values()) and chain_ok and not drift
            ),
        }

    async def statistics(self) -> dict[str, Any]:
        """Counts by status, for a health or operations endpoint."""
        rows = await self._db.fetch_all(
            "SELECT settlement_status, COUNT(*) AS n, "
            "       COALESCE(SUM(CASE WHEN settlement_status = 'SETTLED' "
            "                    THEN amount_minor ELSE 0 END), 0) AS settled_minor "
            "FROM payments GROUP BY settlement_status"
        )
        by_status = {row["settlement_status"]: int(row["n"]) for row in rows}
        settled_value = sum(int(row["settled_minor"]) for row in rows)
        return {
            "by_status": {status.value: by_status.get(status.value, 0) for status in SettlementStatus},
            "total": sum(by_status.values()),
            "settled_value_minor": settled_value,
            "registered_keys": len(self._keys),
        }


class _Rejected(Exception):
    """Internal control-flow signal used to unwind the settlement transaction.

    Raised inside the ``BEGIN IMMEDIATE`` block so the context manager rolls
    back before anything is journalled. Never escapes this module: ``_settle``
    catches it and converts it into a :class:`ClearingResult`.
    """

    def __init__(self, status: SettlementStatus, reason: RejectionReason, detail: str) -> None:
        super().__init__(detail)
        self.status = status
        self.reason = reason
        self.detail = detail
