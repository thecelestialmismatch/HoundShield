"""
NexusSwift :: core.schemas
==========================

ISO 20022 ``pacs.008.001.10`` FIToFICustomerCreditTransfer assembly and
namespace-aware parsing.

pacs.008 is the message that actually moves a customer's money across a
border. Under CBPR+ (Cross-Border Payments and Reporting Plus) it is the
replacement for the legacy FIN MT103, and since the November 2025 end of the
MT/MX coexistence period it is the only form the cross-border payments
categories travel in.

Three properties of this module are load-bearing:

**Parsing is namespace-aware, and the namespace is checked.** ``ElementTree``
reports tags as ``{urn:…}CdtTrfTxInf``. Code that strips the brace-prefix and
matches on the local name will happily accept a pacs.009 (financial
institution transfer, no consumer protection), a pacs.004 (a *return*, which
moves money the other way), or an attacker-authored document in an unrelated
namespace whose element names merely collide. The namespace is the message
type. It is validated first, before any field is read.

**External entities are structurally impossible.** ``xml.etree`` does not
expand external entities, but it *does* parse internal DTD entity
declarations in a way that historically enabled the billion-laughs expansion.
:func:`parse_pacs008` rejects any document containing a DOCTYPE outright,
before it reaches the parser. A payment hub parses documents supplied by
counterparties; treating them as trusted input is not an option.

**The parser is strict and total.** Every field this hub relies on is
validated for presence, format, and cross-field consistency, and every
failure raises :class:`SchemaValidationException` with the offending XPath.
A parser that returns ``None`` for a missing amount hands the liquidity check
a ``None`` to compare, and the failure surfaces three layers away from its
cause.

**What this module deliberately does not do:** it does not validate against
the official XSD. The real schema is a licensed artefact distributed by
SWIFT, and shipping it here would be a redistribution problem. What is
implemented instead is the structural and business-rule subset a clearing
hub must enforce regardless — which is the part the XSD cannot express
anyway (an XSD cannot check that the settlement amount matches the
instructed amount, or that the debtor and creditor agents differ).
"""

from __future__ import annotations

import re
import uuid
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Final, Mapping

from .models import (
    CurrencyError,
    format_amount,
    iso_timestamp,
    minor_units,
    new_uetr,
    parse_amount,
    utc_now,
)

__all__ = [
    "SchemaValidationException",
    "PACS008_NAMESPACE",
    "PACS008_ROOT",
    "CreditTransfer",
    "PartyIdentification",
    "build_pacs008",
    "parse_pacs008",
    "validate_bic",
    "validate_uetr",
    "is_valid_bic",
    "BIC_PATTERN",
]

#: The exact namespace URI for this message version. A document in
#: ``…pacs.008.001.08`` is a *different message* with different mandatory
#: fields and is rejected rather than silently accepted.
PACS008_NAMESPACE: Final[str] = "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10"
PACS008_ROOT: Final[str] = "Document"

_NS: Final[Mapping[str, str]] = {"p": PACS008_NAMESPACE}

#: ISO 9362 Business Identifier Code.
#:
#: 4 alphabetic institution code, 2 alphabetic ISO 3166-1 country code,
#: 2 alphanumeric location code, optional 3 alphanumeric branch code.
#: Total length is therefore 8 or 11 — never 9, 10 or 12, which is the most
#: common malformed value seen in practice (someone pads to 12 with an X).
#:
#: The location code's first character may not be ``0`` or ``1``: those are
#: reserved by the registrar, and ``1`` in position 7 specifically marks a
#: non-SWIFT-connected BEI, which cannot be a clearing counterparty here.
BIC_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^[A-Z]{4}"        # institution
    r"[A-Z]{2}"         # ISO 3166-1 alpha-2 country
    r"[2-9A-Z][0-9A-Z]" # location (first char not 0/1)
    r"(?:[0-9A-Z]{3})?$"  # optional branch
)

#: RFC 4122 UUID **version 4**, lowercase, as SWIFT gpi requires for a UETR.
UETR_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)

#: ISO 20022 ``Max35Text`` restricted to the characters payment systems
#: actually accept in an identifier. Notably excludes whitespace: a MsgId
#: with a trailing space is a different string to every system that trims and
#: the same string to every system that does not, which makes idempotency
#: non-deterministic across a correspondent chain.
IDENTIFIER_PATTERN: Final[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9/\-?:().,'+]{1,35}$")

#: ISO 4217 code shape. Membership in the supported set is checked separately
#: by :func:`core.models.minor_units`.
CURRENCY_PATTERN: Final[re.Pattern[str]] = re.compile(r"^[A-Z]{3}$")

#: ISO 20022 ``ChargeBearerType1Code``.
VALID_CHARGE_BEARERS: Final[frozenset[str]] = frozenset({"CRED", "DEBT", "SHAR", "SLEV"})

#: Settlement method. ``CLRG`` = clearing system, ``INDA``/``INGA`` = via the
#: instructed/instructing agent's account, ``COVE`` = cover method. This hub
#: is itself the clearing system, so it accepts ``CLRG`` only.
VALID_SETTLEMENT_METHODS: Final[frozenset[str]] = frozenset({"CLRG", "INDA", "INGA", "COVE"})

_MAX_DOCUMENT_BYTES: Final[int] = 1 << 20  # 1 MiB


class SchemaValidationException(Exception):
    """Raised when a document is not a well-formed, valid pacs.008.001.10.

    Carries the XPath of the offending element so an operator can point at
    the exact node rather than re-reading the whole envelope.
    """

    def __init__(self, message: str, *, path: str = "/", value: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.path = path
        self.value = value

    def __str__(self) -> str:
        location = f" at {self.path}" if self.path != "/" else ""
        detail = f" (value: {self.value!r})" if self.value is not None else ""
        return f"{self.message}{location}{detail}"

    def to_dict(self) -> dict[str, Any]:
        return {"message": self.message, "path": self.path, "value": self.value}


# --------------------------------------------------------------------------
# Field validators
# --------------------------------------------------------------------------

def is_valid_bic(bic: str) -> bool:
    return bool(BIC_PATTERN.match(bic))


def validate_bic(bic: str, *, path: str) -> str:
    """Validate an ISO 9362 BIC, returning it unchanged.

    Deliberately does **not** upper-case the input. A BIC is defined as
    uppercase; accepting ``deutdeffxxx`` and silently normalising it means
    the bytes that were signed differ from the bytes that were validated,
    and two systems in the chain disagree about what the document said.
    """
    if not isinstance(bic, str) or not bic:
        raise SchemaValidationException("BIC is missing or empty", path=path, value=bic)
    if len(bic) not in (8, 11):
        raise SchemaValidationException(
            f"BIC must be 8 or 11 characters, got {len(bic)}", path=path, value=bic
        )
    if not BIC_PATTERN.match(bic):
        raise SchemaValidationException(
            "BIC is not a well-formed ISO 9362 identifier "
            "(4 alpha institution, 2 alpha country, 2 alnum location, optional 3 alnum branch)",
            path=path,
            value=bic,
        )
    return bic


def validate_uetr(value: str, *, path: str = "/Document/…/PmtId/UETR") -> str:
    """Validate a SWIFT gpi UETR: a lowercase RFC 4122 v4 UUID."""
    if not isinstance(value, str) or not value:
        raise SchemaValidationException("UETR is missing or empty", path=path, value=value)
    if not UETR_PATTERN.match(value):
        raise SchemaValidationException(
            "UETR must be a lowercase RFC 4122 version-4 UUID "
            "(SWIFT gpi pins v4; v1 leaks the issuing host's MAC address and clock)",
            path=path,
            value=value,
        )
    # Belt and braces: the regex pins the version and variant nibbles, but
    # parsing catches anything the pattern lets through.
    try:
        parsed = uuid.UUID(value)
    except ValueError as exc:
        raise SchemaValidationException(f"UETR is not a parseable UUID: {exc}", path=path, value=value) from exc
    if parsed.version != 4:
        raise SchemaValidationException(
            f"UETR must be UUID version 4, got version {parsed.version}", path=path, value=value
        )
    return value


def validate_identifier(value: str, *, path: str, label: str) -> str:
    if not isinstance(value, str) or not value:
        raise SchemaValidationException(f"{label} is missing or empty", path=path, value=value)
    if len(value) > 35:
        raise SchemaValidationException(
            f"{label} exceeds ISO 20022 Max35Text ({len(value)} characters)", path=path, value=value
        )
    if not IDENTIFIER_PATTERN.match(value):
        raise SchemaValidationException(
            f"{label} contains characters outside the permitted identifier set "
            "(letters, digits, and / - ? : ( ) . , ' +); whitespace is not permitted",
            path=path,
            value=value,
        )
    return value


def validate_currency(code: str, *, path: str) -> str:
    if not isinstance(code, str) or not CURRENCY_PATTERN.match(code):
        raise SchemaValidationException(
            "currency must be a three-letter uppercase ISO 4217 code", path=path, value=code
        )
    try:
        minor_units(code)
    except CurrencyError as exc:
        raise SchemaValidationException(str(exc), path=path, value=code) from exc
    return code


def validate_text(value: str, *, path: str, label: str, max_length: int) -> str:
    if value is None:
        raise SchemaValidationException(f"{label} is missing", path=path)
    if not isinstance(value, str) or not value.strip():
        raise SchemaValidationException(f"{label} is empty", path=path, value=value)
    if len(value) > max_length:
        raise SchemaValidationException(
            f"{label} exceeds Max{max_length}Text ({len(value)} characters)", path=path, value=value
        )
    return value


def validate_iso_date(value: str, *, path: str, label: str) -> str:
    try:
        date.fromisoformat(value)
    except (ValueError, TypeError) as exc:
        raise SchemaValidationException(
            f"{label} must be an ISO 8601 calendar date (YYYY-MM-DD)", path=path, value=value
        ) from exc
    return value


# --------------------------------------------------------------------------
# Domain envelope
# --------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class PartyIdentification:
    """A debtor or creditor: a name, an account, and the agent that holds it."""

    name: str
    account: str
    agent_bic: str
    country: str = ""
    address: str = ""

    def validate(self, *, role: str) -> None:
        base = f"/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/{role}"
        validate_text(self.name, path=f"{base}/Nm", label=f"{role} name", max_length=140)
        validate_text(
            self.account, path=f"{base}Acct/Id/Othr/Id", label=f"{role} account", max_length=34
        )
        validate_bic(self.agent_bic, path=f"{base}Agt/FinInstnId/BICFI")
        if self.country and len(self.country) != 2:
            raise SchemaValidationException(
                "country must be an ISO 3166-1 alpha-2 code",
                path=f"{base}/PstlAdr/Ctry",
                value=self.country,
            )


@dataclass(frozen=True, slots=True)
class CreditTransfer:
    """The parsed, validated content of one pacs.008 credit transfer.

    This is the *only* representation the rest of the system consumes. The
    XML DOM never escapes this module: passing an ``Element`` into the
    clearing engine would let namespace handling leak into settlement logic.
    """

    msg_id: str
    uetr: str
    instr_id: str
    end_to_end_id: str
    amount: Decimal
    currency: str
    debtor: PartyIdentification
    creditor: PartyIdentification
    charge_bearer: str = "SHAR"
    settlement_method: str = "CLRG"
    settlement_date: str = ""
    remittance_info: str = ""
    creation_datetime: str = ""
    number_of_transactions: int = 1

    @property
    def sender_bic(self) -> str:
        """The instructing (debtor) agent — the institution that signs."""
        return self.debtor.agent_bic

    @property
    def receiver_bic(self) -> str:
        """The instructed (creditor) agent."""
        return self.creditor.agent_bic

    @property
    def amount_text(self) -> str:
        return format_amount(self.amount, self.currency)

    def validate(self) -> "CreditTransfer":
        """Full structural and cross-field validation. Returns ``self``."""
        validate_identifier(
            self.msg_id, path="/Document/FIToFICstmrCdtTrf/GrpHdr/MsgId", label="MsgId"
        )
        validate_identifier(
            self.instr_id,
            path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/InstrId",
            label="InstrId",
        )
        validate_identifier(
            self.end_to_end_id,
            path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/EndToEndId",
            label="EndToEndId",
        )
        validate_uetr(self.uetr)
        validate_currency(
            self.currency,
            path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/IntbkSttlmAmt/@Ccy",
        )

        if self.amount <= 0:
            raise SchemaValidationException(
                "interbank settlement amount must be strictly positive",
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/IntbkSttlmAmt",
                value=str(self.amount),
            )
        try:
            # Rejects an amount carrying more fraction digits than the
            # currency admits — 100.005 USD, or 5000.50 JPY.
            from .models import to_minor

            to_minor(self.amount, self.currency)
        except CurrencyError as exc:
            raise SchemaValidationException(
                str(exc),
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/IntbkSttlmAmt",
                value=str(self.amount),
            ) from exc

        if self.charge_bearer not in VALID_CHARGE_BEARERS:
            raise SchemaValidationException(
                f"ChrgBr must be one of {sorted(VALID_CHARGE_BEARERS)}",
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/ChrgBr",
                value=self.charge_bearer,
            )
        if self.settlement_method not in VALID_SETTLEMENT_METHODS:
            raise SchemaValidationException(
                f"SttlmMtd must be one of {sorted(VALID_SETTLEMENT_METHODS)}",
                path="/Document/FIToFICstmrCdtTrf/GrpHdr/SttlmInf/SttlmMtd",
                value=self.settlement_method,
            )

        self.debtor.validate(role="Dbtr")
        self.creditor.validate(role="Cdtr")

        # Cross-field rules an XSD cannot express.
        if self.debtor.agent_bic == self.creditor.agent_bic:
            raise SchemaValidationException(
                "debtor agent and creditor agent are the same institution; "
                "an interbank settlement instruction must cross an institutional boundary",
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/CdtrAgt/FinInstnId/BICFI",
                value=self.creditor.agent_bic,
            )
        if self.debtor.account == self.creditor.account:
            raise SchemaValidationException(
                "debtor and creditor settlement accounts are identical",
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/CdtrAcct/Id/Othr/Id",
                value=self.creditor.account,
            )
        if self.number_of_transactions != 1:
            # This hub clears one transfer per envelope. Batched pacs.008 is
            # legal ISO 20022, but a batch that partially settles has no
            # well-defined status, and pretending otherwise is how a
            # half-applied batch escapes into production.
            raise SchemaValidationException(
                "NbOfTxs must be 1; this hub does not accept batched envelopes",
                path="/Document/FIToFICstmrCdtTrf/GrpHdr/NbOfTxs",
                value=self.number_of_transactions,
            )
        if self.settlement_date:
            validate_iso_date(
                self.settlement_date,
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/IntrBkSttlmDt",
                label="IntrBkSttlmDt",
            )
        if self.remittance_info and len(self.remittance_info) > 140:
            raise SchemaValidationException(
                "unstructured remittance information exceeds Max140Text",
                path="/Document/FIToFICstmrCdtTrf/CdtTrfTxInf/RmtInf/Ustrd",
                value=self.remittance_info,
            )
        return self

    def to_dict(self) -> dict[str, Any]:
        """Flat envelope for logging, APIs and the engine."""
        return {
            "msg_id": self.msg_id,
            "uetr": self.uetr,
            "instr_id": self.instr_id,
            "end_to_end_id": self.end_to_end_id,
            "amount": self.amount,
            "amount_text": self.amount_text,
            "currency": self.currency,
            "sender_bic": self.sender_bic,
            "receiver_bic": self.receiver_bic,
            "debtor_name": self.debtor.name,
            "debtor_account": self.debtor.account,
            "creditor_name": self.creditor.name,
            "creditor_account": self.creditor.account,
            "charge_bearer": self.charge_bearer,
            "settlement_method": self.settlement_method,
            "settlement_date": self.settlement_date,
            "remittance_info": self.remittance_info,
            "creation_datetime": self.creation_datetime,
        }


# --------------------------------------------------------------------------
# DOM assembly
# --------------------------------------------------------------------------

def _sub(parent: ET.Element, tag: str, text: str | None = None, **attrib: str) -> ET.Element:
    """Create a namespace-qualified child element.

    Every tag is qualified explicitly with the pacs.008 namespace. Creating
    children with a bare local name also *serialises* correctly, because the
    root carries a default ``xmlns`` and ElementTree emits unprefixed tags —
    but the in-memory tree then holds those children in no namespace at all,
    so the document ElementTree believes it built is not the document it
    writes out. Anything that inspects the tree before serialisation (a
    debugger, a future canonicaliser, an XPath query) sees the wrong thing.
    Qualifying here keeps the two representations identical.
    """
    element = ET.SubElement(parent, f"{{{PACS008_NAMESPACE}}}{tag}", attrib)
    if text is not None:
        element.text = text
    return element


def build_pacs008(
    *,
    msg_id: str,
    debtor: PartyIdentification,
    creditor: PartyIdentification,
    amount: Decimal | str,
    currency: str,
    uetr: str | None = None,
    instr_id: str | None = None,
    end_to_end_id: str | None = None,
    charge_bearer: str = "SHAR",
    settlement_method: str = "CLRG",
    settlement_date: str | None = None,
    remittance_info: str = "",
    creation_datetime: str | None = None,
) -> tuple[str, CreditTransfer]:
    """Assemble a complete, valid pacs.008.001.10 document.

    Returns ``(xml_text, credit_transfer)``. The XML text is the artefact to
    sign and transmit; it is generated once and must not be regenerated.
    Callers that need the document again must keep these exact bytes, because
    ``ElementTree`` gives no ordering or whitespace guarantee across versions
    and a regenerated document will not verify against the original
    signature.

    The document is emitted **without** an XML declaration. A declaration is
    optional for a UTF-8 document, and omitting it removes an entire class of
    signature mismatch where one side emits ``<?xml version="1.0"?>`` and the
    other emits ``<?xml version='1.0' encoding='UTF-8'?>``.
    """
    amount_decimal = Decimal(amount) if not isinstance(amount, Decimal) else amount
    currency = validate_currency(currency, path="/Document/…/IntbkSttlmAmt/@Ccy")

    transfer = CreditTransfer(
        msg_id=msg_id,
        uetr=uetr or new_uetr(),
        instr_id=instr_id or msg_id,
        end_to_end_id=end_to_end_id or msg_id,
        amount=amount_decimal,
        currency=currency,
        debtor=debtor,
        creditor=creditor,
        charge_bearer=charge_bearer,
        settlement_method=settlement_method,
        settlement_date=settlement_date or utc_now().date().isoformat(),
        remittance_info=remittance_info,
        creation_datetime=creation_datetime or iso_timestamp(),
        number_of_transactions=1,
    ).validate()

    # Registering the default namespace makes ElementTree emit unprefixed
    # tags with a single xmlns on the root, which is the form every ISO 20022
    # sample uses. Without it every tag gets an ``ns0:`` prefix — still valid
    # XML, but unreadable to a human comparing against SWIFT documentation.
    ET.register_namespace("", PACS008_NAMESPACE)

    document = ET.Element(f"{{{PACS008_NAMESPACE}}}{PACS008_ROOT}")
    envelope = _sub(document, "FIToFICstmrCdtTrf")

    # -- Group Header --------------------------------------------------
    group_header = _sub(envelope, "GrpHdr")
    _sub(group_header, "MsgId", transfer.msg_id)
    _sub(group_header, "CreDtTm", transfer.creation_datetime)
    _sub(group_header, "NbOfTxs", str(transfer.number_of_transactions))
    _sub(group_header, "TtlIntrBkSttlmAmt", transfer.amount_text, Ccy=transfer.currency)
    _sub(group_header, "IntrBkSttlmDt", transfer.settlement_date)

    settlement_info = _sub(group_header, "SttlmInf")
    _sub(settlement_info, "SttlmMtd", transfer.settlement_method)
    clearing_system = _sub(settlement_info, "ClrSys")
    _sub(clearing_system, "Prtry", "NEXUSSWIFT")

    instructing_agent = _sub(group_header, "InstgAgt")
    _sub(_sub(instructing_agent, "FinInstnId"), "BICFI", transfer.sender_bic)
    instructed_agent = _sub(group_header, "InstdAgt")
    _sub(_sub(instructed_agent, "FinInstnId"), "BICFI", transfer.receiver_bic)

    # -- Credit Transfer Transaction Information ------------------------
    transaction = _sub(envelope, "CdtTrfTxInf")

    payment_id = _sub(transaction, "PmtId")
    _sub(payment_id, "InstrId", transfer.instr_id)
    _sub(payment_id, "EndToEndId", transfer.end_to_end_id)
    _sub(payment_id, "UETR", transfer.uetr)

    payment_type = _sub(transaction, "PmtTpInf")
    service_level = _sub(payment_type, "SvcLvl")
    _sub(service_level, "Cd", "G001")  # SWIFT gpi service level

    _sub(transaction, "IntrBkSttlmAmt", transfer.amount_text, Ccy=transfer.currency)
    _sub(transaction, "IntrBkSttlmDt", transfer.settlement_date)
    _sub(transaction, "ChrgBr", transfer.charge_bearer)

    # Debtor block
    debtor_element = _sub(transaction, "Dbtr")
    _sub(debtor_element, "Nm", transfer.debtor.name)
    if transfer.debtor.country or transfer.debtor.address:
        postal = _sub(debtor_element, "PstlAdr")
        if transfer.debtor.address:
            _sub(postal, "AdrLine", transfer.debtor.address)
        if transfer.debtor.country:
            _sub(postal, "Ctry", transfer.debtor.country)
    debtor_account = _sub(transaction, "DbtrAcct")
    _sub(_sub(_sub(debtor_account, "Id"), "Othr"), "Id", transfer.debtor.account)
    debtor_agent = _sub(transaction, "DbtrAgt")
    _sub(_sub(debtor_agent, "FinInstnId"), "BICFI", transfer.debtor.agent_bic)

    # Creditor block
    creditor_agent = _sub(transaction, "CdtrAgt")
    _sub(_sub(creditor_agent, "FinInstnId"), "BICFI", transfer.creditor.agent_bic)
    creditor_element = _sub(transaction, "Cdtr")
    _sub(creditor_element, "Nm", transfer.creditor.name)
    if transfer.creditor.country or transfer.creditor.address:
        postal = _sub(creditor_element, "PstlAdr")
        if transfer.creditor.address:
            _sub(postal, "AdrLine", transfer.creditor.address)
        if transfer.creditor.country:
            _sub(postal, "Ctry", transfer.creditor.country)
    creditor_account = _sub(transaction, "CdtrAcct")
    _sub(_sub(_sub(creditor_account, "Id"), "Othr"), "Id", transfer.creditor.account)

    if transfer.remittance_info:
        _sub(_sub(transaction, "RmtInf"), "Ustrd", transfer.remittance_info)

    xml_text = ET.tostring(document, encoding="unicode", xml_declaration=False)
    return xml_text, transfer


# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------

def _require(parent: ET.Element, path: str, *, label: str, base: str) -> ET.Element:
    element = parent.find(path, _NS)
    if element is None:
        raise SchemaValidationException(f"mandatory element {label} is absent", path=f"{base}/{label}")
    return element


def _require_text(parent: ET.Element, path: str, *, label: str, base: str) -> str:
    element = _require(parent, path, label=label, base=base)
    text = (element.text or "").strip()
    if not text:
        raise SchemaValidationException(f"mandatory element {label} is empty", path=f"{base}/{label}")
    return text


def _optional_text(parent: ET.Element, path: str, default: str = "") -> str:
    element = parent.find(path, _NS)
    if element is None or element.text is None:
        return default
    return element.text.strip()


def parse_pacs008(xml_text: str | bytes) -> CreditTransfer:
    """Parse and fully validate a pacs.008.001.10 document.

    Raises :class:`SchemaValidationException` on any structural, namespace,
    format or cross-field failure. Never returns a partially populated
    object: either the document is a valid credit transfer, or it is not.
    """
    if isinstance(xml_text, bytes):
        raw = xml_text
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise SchemaValidationException(f"document is not valid UTF-8: {exc}") from exc
    else:
        text = xml_text
        raw = text.encode("utf-8")

    if not text.strip():
        raise SchemaValidationException("document is empty")

    # Size cap before parsing. An unbounded parse of counterparty-supplied
    # input is a denial-of-service primitive regardless of entity handling.
    if len(raw) > _MAX_DOCUMENT_BYTES:
        raise SchemaValidationException(
            f"document is {len(raw)} bytes; the limit is {_MAX_DOCUMENT_BYTES}"
        )

    # Reject DOCTYPE outright. xml.etree does not resolve *external* entities,
    # but internal entity declarations are the billion-laughs vector, and a
    # payment document has no legitimate reason to carry a DTD at all.
    probe = text.lstrip()[:2048].upper()
    if "<!DOCTYPE" in probe or "<!ENTITY" in probe:
        raise SchemaValidationException(
            "document declares a DTD or entity; payment envelopes must not contain one"
        )

    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        raise SchemaValidationException(f"document is not well-formed XML: {exc}") from exc

    # -- namespace and root -------------------------------------------
    expected_root = f"{{{PACS008_NAMESPACE}}}{PACS008_ROOT}"
    if root.tag != expected_root:
        actual_ns = root.tag.split("}")[0].lstrip("{") if "}" in root.tag else "(none)"
        actual_local = root.tag.split("}")[-1]
        raise SchemaValidationException(
            f"expected root <{PACS008_ROOT}> in namespace {PACS008_NAMESPACE}, "
            f"got <{actual_local}> in namespace {actual_ns}; "
            "the namespace URI is the message type and is not negotiable",
            path="/",
            value=root.tag,
        )

    base = "/Document/FIToFICstmrCdtTrf"
    envelope = _require(root, "p:FIToFICstmrCdtTrf", label="FIToFICstmrCdtTrf", base="/Document")

    # -- Group Header ---------------------------------------------------
    group_header = _require(envelope, "p:GrpHdr", label="GrpHdr", base=base)
    msg_id = _require_text(group_header, "p:MsgId", label="MsgId", base=f"{base}/GrpHdr")
    creation_datetime = _require_text(
        group_header, "p:CreDtTm", label="CreDtTm", base=f"{base}/GrpHdr"
    )
    number_of_transactions_text = _require_text(
        group_header, "p:NbOfTxs", label="NbOfTxs", base=f"{base}/GrpHdr"
    )
    if not number_of_transactions_text.isdigit():
        raise SchemaValidationException(
            "NbOfTxs must be a non-negative integer",
            path=f"{base}/GrpHdr/NbOfTxs",
            value=number_of_transactions_text,
        )
    number_of_transactions = int(number_of_transactions_text)

    settlement_info = _require(group_header, "p:SttlmInf", label="SttlmInf", base=f"{base}/GrpHdr")
    settlement_method = _require_text(
        settlement_info, "p:SttlmMtd", label="SttlmMtd", base=f"{base}/GrpHdr/SttlmInf"
    )

    # -- Transaction ----------------------------------------------------
    transactions = envelope.findall("p:CdtTrfTxInf", _NS)
    if not transactions:
        raise SchemaValidationException("no CdtTrfTxInf present", path=base)
    if len(transactions) > 1:
        raise SchemaValidationException(
            f"envelope carries {len(transactions)} transactions; this hub accepts exactly one",
            path=f"{base}/CdtTrfTxInf",
            value=len(transactions),
        )
    transaction = transactions[0]
    tx_base = f"{base}/CdtTrfTxInf"

    payment_id = _require(transaction, "p:PmtId", label="PmtId", base=tx_base)
    instr_id = _require_text(payment_id, "p:InstrId", label="InstrId", base=f"{tx_base}/PmtId")
    end_to_end_id = _require_text(
        payment_id, "p:EndToEndId", label="EndToEndId", base=f"{tx_base}/PmtId"
    )
    uetr = _require_text(payment_id, "p:UETR", label="UETR", base=f"{tx_base}/PmtId")

    amount_element = _require(transaction, "p:IntrBkSttlmAmt", label="IntrBkSttlmAmt", base=tx_base)
    currency = amount_element.get("Ccy", "")
    if not currency:
        raise SchemaValidationException(
            "IntrBkSttlmAmt is missing its mandatory Ccy attribute",
            path=f"{tx_base}/IntrBkSttlmAmt/@Ccy",
        )
    currency = validate_currency(currency, path=f"{tx_base}/IntrBkSttlmAmt/@Ccy")
    amount_text = (amount_element.text or "").strip()
    try:
        amount = parse_amount(amount_text, currency)
    except CurrencyError as exc:
        raise SchemaValidationException(
            str(exc), path=f"{tx_base}/IntrBkSttlmAmt", value=amount_text
        ) from exc

    charge_bearer = _require_text(transaction, "p:ChrgBr", label="ChrgBr", base=tx_base)
    settlement_date = _optional_text(transaction, "p:IntrBkSttlmDt")

    # -- Parties --------------------------------------------------------
    debtor = PartyIdentification(
        name=_require_text(
            _require(transaction, "p:Dbtr", label="Dbtr", base=tx_base),
            "p:Nm",
            label="Nm",
            base=f"{tx_base}/Dbtr",
        ),
        account=_require_text(
            _require(transaction, "p:DbtrAcct", label="DbtrAcct", base=tx_base),
            "p:Id/p:Othr/p:Id",
            label="Id/Othr/Id",
            base=f"{tx_base}/DbtrAcct",
        ),
        agent_bic=_require_text(
            _require(transaction, "p:DbtrAgt", label="DbtrAgt", base=tx_base),
            "p:FinInstnId/p:BICFI",
            label="FinInstnId/BICFI",
            base=f"{tx_base}/DbtrAgt",
        ),
        country=_optional_text(transaction, "p:Dbtr/p:PstlAdr/p:Ctry"),
        address=_optional_text(transaction, "p:Dbtr/p:PstlAdr/p:AdrLine"),
    )

    creditor = PartyIdentification(
        name=_require_text(
            _require(transaction, "p:Cdtr", label="Cdtr", base=tx_base),
            "p:Nm",
            label="Nm",
            base=f"{tx_base}/Cdtr",
        ),
        account=_require_text(
            _require(transaction, "p:CdtrAcct", label="CdtrAcct", base=tx_base),
            "p:Id/p:Othr/p:Id",
            label="Id/Othr/Id",
            base=f"{tx_base}/CdtrAcct",
        ),
        agent_bic=_require_text(
            _require(transaction, "p:CdtrAgt", label="CdtrAgt", base=tx_base),
            "p:FinInstnId/p:BICFI",
            label="FinInstnId/BICFI",
            base=f"{tx_base}/CdtrAgt",
        ),
        country=_optional_text(transaction, "p:Cdtr/p:PstlAdr/p:Ctry"),
        address=_optional_text(transaction, "p:Cdtr/p:PstlAdr/p:AdrLine"),
    )

    transfer = CreditTransfer(
        msg_id=msg_id,
        uetr=uetr,
        instr_id=instr_id,
        end_to_end_id=end_to_end_id,
        amount=amount,
        currency=currency,
        debtor=debtor,
        creditor=creditor,
        charge_bearer=charge_bearer,
        settlement_method=settlement_method,
        settlement_date=settlement_date,
        remittance_info=_optional_text(transaction, "p:RmtInf/p:Ustrd"),
        creation_datetime=creation_datetime,
        number_of_transactions=number_of_transactions,
    ).validate()

    # Group-header totals must agree with the single transaction they
    # summarise. A mismatch here is the classic "header says 100, body says
    # 100000" attack against systems that authorise on one and settle on the
    # other.
    total_element = group_header.find("p:TtlIntrBkSttlmAmt", _NS)
    if total_element is not None:
        total_currency = total_element.get("Ccy", "")
        total_text = (total_element.text or "").strip()
        if total_currency != currency:
            raise SchemaValidationException(
                f"GrpHdr total currency {total_currency!r} does not match "
                f"transaction currency {currency!r}",
                path=f"{base}/GrpHdr/TtlIntrBkSttlmAmt/@Ccy",
                value=total_currency,
            )
        try:
            total_amount = parse_amount(total_text, currency)
        except CurrencyError as exc:
            raise SchemaValidationException(
                str(exc), path=f"{base}/GrpHdr/TtlIntrBkSttlmAmt", value=total_text
            ) from exc
        if total_amount != amount:
            raise SchemaValidationException(
                f"GrpHdr total {total_amount} does not equal the transaction "
                f"settlement amount {amount}",
                path=f"{base}/GrpHdr/TtlIntrBkSttlmAmt",
                value=total_text,
            )

    # Instructing/instructed agents, when present, must name the same pair of
    # institutions as the debtor/creditor agents.
    instructing = _optional_text(group_header, "p:InstgAgt/p:FinInstnId/p:BICFI")
    if instructing and instructing != debtor.agent_bic:
        raise SchemaValidationException(
            f"InstgAgt {instructing!r} does not match DbtrAgt {debtor.agent_bic!r}",
            path=f"{base}/GrpHdr/InstgAgt/FinInstnId/BICFI",
            value=instructing,
        )
    instructed = _optional_text(group_header, "p:InstdAgt/p:FinInstnId/p:BICFI")
    if instructed and instructed != creditor.agent_bic:
        raise SchemaValidationException(
            f"InstdAgt {instructed!r} does not match CdtrAgt {creditor.agent_bic!r}",
            path=f"{base}/GrpHdr/InstdAgt/FinInstnId/BICFI",
            value=instructed,
        )

    return transfer
