"""
NexusSwift :: multi-vector security validation harness
======================================================

Run with either::

    python -m unittest discover -s tests -v
    python -m pytest tests/ -v          # if pytest is installed

Built on ``unittest.IsolatedAsyncioTestCase`` from the standard library
rather than ``pytest-asyncio``. A security harness that cannot run without
first installing a plugin is a harness that stops being run.

**RSA key size in tests.** The suite generates 2048-bit keys, not the
production 4096. A 4096-bit generation costs 2–3 seconds; at ~40 test
methods that is minutes of wall clock per run, and a slow suite is a suite
people skip. The tests here exercise *protocol logic* — what the engine does
with a valid or invalid signature — which is identical at either modulus.
:class:`ProductionDefaultsTest` separately asserts that the production
default really is 4096 and that weak keys are refused, so the shortcut
cannot silently become the deployed configuration.

Keys are generated once per class in ``setUpClass`` and reused. Generating
per test method would dominate the runtime and test nothing extra.
"""

from __future__ import annotations

import asyncio
import base64
import sqlite3
import unittest
from decimal import Decimal

from core.crypto import (
    KeyGenerationError,
    KeyImportError,
    KeyPair,
    KeyRegistry,
    RSA_KEY_SIZE,
    PSS_SALT_LENGTH,
    SignatureMalformedError,
    SigningEngine,
)
from core.engine import ClearingEngine
from core.models import (
    Account,
    AccountStatus,
    CurrencyError,
    Database,
    GENESIS_HASH,
    Institution,
    InstitutionStatus,
    LedgerDirection,
    RejectionReason,
    SettlementStatus,
    from_minor,
    minor_units,
    parse_amount,
    to_minor,
)
from core.schemas import (
    PartyIdentification,
    SchemaValidationException,
    build_pacs008,
    is_valid_bic,
    parse_pacs008,
    validate_uetr,
)

TEST_KEY_SIZE = 2048

SENDER_BIC = "DEUTDEFFXXX"
RECEIVER_BIC = "CHASUS33XXX"
THIRD_BIC = "BNPAFRPPXXX"

DEBTOR_ACCOUNT = "DE89370400440532013000"
CREDITOR_ACCOUNT = "US64SVBK00000012345678"

OPENING_DEBTOR_MINOR = 1_000_000_00   # EUR 1,000,000.00
OPENING_CREDITOR_MINOR = 50_000_00    # EUR    50,000.00


class ClearingHarness(unittest.IsolatedAsyncioTestCase):
    """Base fixture: a migrated hub with two funded participants."""

    sender_keys: KeyPair
    receiver_keys: KeyPair
    third_keys: KeyPair

    @classmethod
    def setUpClass(cls) -> None:
        cls.sender_keys = SigningEngine.generate_keypair(SENDER_BIC, key_size=TEST_KEY_SIZE)
        cls.receiver_keys = SigningEngine.generate_keypair(RECEIVER_BIC, key_size=TEST_KEY_SIZE)
        cls.third_keys = SigningEngine.generate_keypair(THIRD_BIC, key_size=TEST_KEY_SIZE)

    async def asyncSetUp(self) -> None:
        self.db = Database(":memory:")
        await self.db.connect()
        await self.db.migrate()
        self.engine = ClearingEngine(self.db)

        await self.engine.register_institution(
            Institution(
                bic=SENDER_BIC,
                name="Deutsche Bank AG",
                country="DE",
                public_key_pem=self.sender_keys.public_pem(),
            )
        )
        await self.engine.register_institution(
            Institution(
                bic=RECEIVER_BIC,
                name="JPMorgan Chase Bank NA",
                country="US",
                public_key_pem=self.receiver_keys.public_pem(),
            )
        )
        await self.engine.open_account(
            Account(DEBTOR_ACCOUNT, SENDER_BIC, "EUR", OPENING_DEBTOR_MINOR)
        )
        await self.engine.open_account(
            Account(CREDITOR_ACCOUNT, RECEIVER_BIC, "EUR", OPENING_CREDITOR_MINOR)
        )

        self.debtor = PartyIdentification(
            "ACME MANUFACTURING GMBH", DEBTOR_ACCOUNT, SENDER_BIC, "DE", "Taunusanlage 12"
        )
        self.creditor = PartyIdentification(
            "PACIFIC RIM TRADING LLC", CREDITOR_ACCOUNT, RECEIVER_BIC, "US", "270 Park Avenue"
        )

    async def asyncTearDown(self) -> None:
        await self.db.close()

    # -- helpers -------------------------------------------------------

    def build(
        self,
        msg_id: str,
        amount: str = "4500.00",
        currency: str = "EUR",
        *,
        debtor: PartyIdentification | None = None,
        creditor: PartyIdentification | None = None,
        **kwargs: object,
    ) -> tuple[str, object]:
        return build_pacs008(
            msg_id=msg_id,
            debtor=debtor or self.debtor,
            creditor=creditor or self.creditor,
            amount=Decimal(amount),
            currency=currency,
            **kwargs,  # type: ignore[arg-type]
        )

    def sign(self, xml: str, keys: KeyPair | None = None) -> str:
        return SigningEngine.sign((keys or self.sender_keys).private_key, xml)

    def signed(self, msg_id: str, amount: str = "4500.00", **kw: object) -> tuple[str, str, object]:
        xml, transfer = self.build(msg_id, amount, **kw)  # type: ignore[arg-type]
        return xml, self.sign(xml), transfer

    async def balance(self, account_id: str) -> int:
        account = await self.db.get_account(account_id)
        assert account is not None, account_id
        return account.balance_minor

    async def assertLedgerHealthy(self) -> None:
        report = await self.engine.reconcile()
        self.assertTrue(report["conserved"], f"value was created or destroyed: {report}")
        self.assertTrue(report["chain_intact"], f"hash chain broken: {report['chain_detail']}")
        self.assertTrue(report["balances_agree"], f"balance drift: {report['balance_drift']}")
        self.assertTrue(report["healthy"], report)


# ==========================================================================
# VECTOR 1 — the happy path
# ==========================================================================

class EndToEndSettlementTest(ClearingHarness):
    """A valid, correctly signed cross-border transfer must clear completely."""

    async def test_valid_transaction_settles(self) -> None:
        xml, signature, transfer = self.signed("NXS20260902000001")

        result = await self.engine.clear(xml, signature)

        self.assertTrue(result.settled, f"expected SETTLED, got {result}")
        self.assertIs(result.status, SettlementStatus.SETTLED)
        self.assertIs(result.reason, RejectionReason.NONE)
        self.assertEqual(result.uetr, transfer.uetr)

    async def test_balances_move_by_exactly_the_instructed_amount(self) -> None:
        xml, signature, _ = self.signed("NXS20260902000002", "4500.00")
        await self.engine.clear(xml, signature)

        amount_minor = 4500_00
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR - amount_minor)
        self.assertEqual(await self.balance(CREDITOR_ACCOUNT), OPENING_CREDITOR_MINOR + amount_minor)

    async def test_settlement_writes_two_balanced_ledger_legs(self) -> None:
        xml, signature, transfer = self.signed("NXS20260902000003")
        await self.engine.clear(xml, signature)

        entries = await self.db.ledger_for(transfer.uetr)
        self.assertEqual(len(entries), 2, "double-entry requires exactly two legs")

        directions = {entry.direction for entry in entries}
        self.assertEqual(directions, {LedgerDirection.DEBIT, LedgerDirection.CREDIT})

        net = sum(entry.direction.sign * entry.amount_minor for entry in entries)
        self.assertEqual(net, 0, "the two legs must sum to zero")

        debit = next(e for e in entries if e.direction is LedgerDirection.DEBIT)
        credit = next(e for e in entries if e.direction is LedgerDirection.CREDIT)
        self.assertEqual(debit.account_id, DEBTOR_ACCOUNT)
        self.assertEqual(credit.account_id, CREDITOR_ACCOUNT)
        self.assertEqual(debit.balance_after_minor, OPENING_DEBTOR_MINOR - 4500_00)
        self.assertEqual(credit.balance_after_minor, OPENING_CREDITOR_MINOR + 4500_00)

    async def test_payment_is_journalled_with_the_invariant_payload(self) -> None:
        xml, signature, transfer = self.signed("NXS20260902000004")
        await self.engine.clear(xml, signature)

        record = await self.db.get_payment(transfer.uetr)
        self.assertIsNotNone(record)
        assert record is not None

        # The stored payload must be byte-identical to what was signed: it is
        # the evidence that makes the signature re-verifiable years later.
        self.assertEqual(record.raw_payload, xml)
        self.assertEqual(record.signature, signature)
        self.assertEqual(record.payload_sha256, SigningEngine.digest(xml))
        self.assertIs(record.settlement_status, SettlementStatus.SETTLED)
        self.assertEqual(record.amount, Decimal("4500.00"))
        self.assertEqual(record.currency, "EUR")
        self.assertEqual(record.sender_bic, SENDER_BIC)
        self.assertEqual(record.receiver_bic, RECEIVER_BIC)
        self.assertIsNotNone(record.settled_at)

        # And it must still verify straight out of the database.
        self.assertTrue(
            SigningEngine.verify(
                self.sender_keys.public_key, record.raw_payload, record.signature
            ),
            "a settled payment must remain independently verifiable from storage",
        )

    async def test_settlement_is_audited(self) -> None:
        xml, signature, transfer = self.signed("NXS20260902000005")
        await self.engine.clear(xml, signature)

        trail = await self.db.audit_trail(transfer.uetr)
        events = [row["event"] for row in trail]
        self.assertIn("PAYMENT_SETTLED", events)

    async def test_many_sequential_settlements_conserve_value(self) -> None:
        total = 0
        for index in range(25):
            xml, signature, _ = self.signed(f"NXSBULK{index:06d}", "100.00")
            result = await self.engine.clear(xml, signature)
            self.assertTrue(result.settled, str(result))
            total += 100_00

        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR - total)
        self.assertEqual(await self.balance(CREDITOR_ACCOUNT), OPENING_CREDITOR_MINOR + total)
        await self.assertLedgerHealthy()

    async def test_zero_decimal_currency_settles_without_scaling_error(self) -> None:
        """JPY has no minor unit; 500000 JPY must not become 5000.00."""
        await self.engine.open_account(Account("JP-DEBTOR-001", SENDER_BIC, "JPY", 1_000_000))
        await self.engine.open_account(Account("JP-CREDITOR-01", RECEIVER_BIC, "JPY", 0))

        debtor = PartyIdentification("ACME KK", "JP-DEBTOR-001", SENDER_BIC, "JP")
        creditor = PartyIdentification("PACIFIC KK", "JP-CREDITOR-01", RECEIVER_BIC, "JP")
        xml, _ = self.build("NXSJPY0001", "500000", "JPY", debtor=debtor, creditor=creditor)

        result = await self.engine.clear(xml, self.sign(xml))
        self.assertTrue(result.settled, str(result))
        self.assertEqual(await self.balance("JP-DEBTOR-001"), 500_000)
        self.assertEqual(await self.balance("JP-CREDITOR-01"), 500_000)
        self.assertEqual(from_minor(500_000, "JPY"), Decimal("500000"))


# ==========================================================================
# VECTOR 2 — in-flight data manipulation
# ==========================================================================

class TamperingAttackTest(ClearingHarness):
    """Any mutation of a signed document must be intercepted before settlement."""

    async def test_amount_altered_after_signing_is_rejected(self) -> None:
        """The canonical attack: sign 4,500 and settle 999,999."""
        xml, signature, transfer = self.signed("NXSTAMPER001", "4500.00")

        tampered = xml.replace(">4500.00<", ">999999.00<")
        self.assertNotEqual(tampered, xml, "the test mutation must actually change the document")

        result = await self.engine.clear(tampered, signature)

        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)

        # Not one minor unit may have moved.
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)
        self.assertEqual(await self.balance(CREDITOR_ACCOUNT), OPENING_CREDITOR_MINOR)
        self.assertEqual(await self.db.ledger_for(transfer.uetr), [])

    async def test_creditor_account_redirection_is_rejected(self) -> None:
        """Rewriting the beneficiary account — theft, not corruption."""
        await self.engine.open_account(Account("ATTACKER-ACCT-1", RECEIVER_BIC, "EUR", 0))
        xml, signature, _ = self.signed("NXSTAMPER002")

        tampered = xml.replace(CREDITOR_ACCOUNT, "ATTACKER-ACCT-1")
        result = await self.engine.clear(tampered, signature)

        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)
        self.assertEqual(await self.balance("ATTACKER-ACCT-1"), 0)

    async def test_currency_substitution_is_rejected(self) -> None:
        xml, signature, _ = self.signed("NXSTAMPER003")
        tampered = xml.replace('Ccy="EUR"', 'Ccy="USD"')
        result = await self.engine.clear(tampered, signature)
        self.assertTrue(result.rejected)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)

    async def test_single_character_mutation_is_rejected(self) -> None:
        """RSA-PSS is all-or-nothing: one flipped character invalidates it."""
        xml, signature, _ = self.signed("NXSTAMPER004")
        tampered = xml.replace("PACIFIC RIM TRADING LLC", "PACIFIC RIM TRADING LLD")
        result = await self.engine.clear(tampered, signature)
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)

    async def test_whitespace_only_mutation_is_rejected(self) -> None:
        """XML-equivalent is not byte-equivalent, and the signature covers bytes."""
        xml, signature, _ = self.signed("NXSTAMPER005")
        tampered = xml.replace("><", "> <", 1)
        result = await self.engine.clear(tampered, signature)
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)

    async def test_signature_from_a_different_institution_is_rejected(self) -> None:
        """A registered participant cannot authorise another's debits."""
        xml, _, _ = self.signed("NXSTAMPER006")
        foreign_signature = self.sign(xml, self.receiver_keys)

        result = await self.engine.clear(xml, foreign_signature)

        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)

    async def test_signature_from_an_unregistered_key_is_rejected(self) -> None:
        xml, _, _ = self.signed("NXSTAMPER007")
        rogue = await SigningEngine.generate_keypair_async("ROGUEXX0", key_size=TEST_KEY_SIZE)
        result = await self.engine.clear(xml, self.sign(xml, rogue))
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)

    async def test_malformed_signature_is_distinguished_from_an_invalid_one(self) -> None:
        """Structurally broken != cryptographically wrong. Operators need both.

        Each sub-test uses a fresh document so the cases stay independent —
        an earlier rejection must not colour a later one.
        """
        for index, bad_signature in enumerate(("", "   ", "!!!not base64!!!", "QUJDREVG")):
            with self.subTest(signature=bad_signature):
                xml, _ = self.build(f"NXSTAMPER0080{index}")
                result = await self.engine.clear(xml, bad_signature)
                self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
                self.assertIs(result.reason, RejectionReason.SIGNATURE_MALFORMED)

    async def test_repeated_bad_signatures_on_one_document_stay_unauthenticated(self) -> None:
        """Every attempt reports the true cause, never a phantom duplicate.

        Regression guard for the denial-of-service hole this suite found: an
        unauthenticated rejection used to be journalled, which consumed the
        UETR, so the *second* garbage submission of the same document came
        back as REJECTED_DUPLICATE. That both hid the real cause from the
        operator and let any observer burn a UETR they did not own.
        """
        xml, _, transfer = self.signed("NXSTAMPER0081")

        for attempt in range(4):
            with self.subTest(attempt=attempt):
                result = await self.engine.clear(xml, "!!!not base64!!!")
                self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
                self.assertIs(result.reason, RejectionReason.SIGNATURE_MALFORMED)

        self.assertIsNone(
            await self.db.get_payment(transfer.uetr),
            "an unauthenticated message must not create a payment record",
        )

    async def test_truncated_signature_is_rejected(self) -> None:
        xml, signature, _ = self.signed("NXSTAMPER009")
        raw = base64.b64decode(signature)
        truncated = base64.b64encode(raw[:-1]).decode("ascii")
        result = await self.engine.clear(xml, truncated)
        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)

    async def test_a_forged_attempt_cannot_burn_a_genuine_uetr(self) -> None:
        """The denial-of-service case, stated as a test.

        An attacker who observes a UETR in flight submits a tampered copy of
        it. That forgery must be rejected AND must leave the genuine payment
        able to settle afterwards. If the failed forgery consumed the UETR,
        any observer could block any payment at will.
        """
        xml, signature, transfer = self.signed("NXSTAMPER010")
        tampered = xml.replace(">4500.00<", ">1.00<")

        forged = await self.engine.clear(tampered, signature)
        self.assertIs(forged.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(forged.reason, RejectionReason.SIGNATURE_INVALID)

        self.assertIsNone(
            await self.db.get_payment(transfer.uetr),
            "an unauthenticated forgery must not occupy the genuine payment's UETR",
        )

        # The real payment, arriving second, still settles.
        genuine = await self.engine.clear(xml, signature)
        self.assertTrue(genuine.settled, f"the genuine payment was blocked by a forgery: {genuine}")
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR - 4500_00)
        await self.assertLedgerHealthy()

    async def test_unauthenticated_rejections_are_audited_not_journalled(self) -> None:
        xml, _, transfer = self.signed("NXSTAMPER012")
        rogue = await SigningEngine.generate_keypair_async("ROGUEXX0", key_size=TEST_KEY_SIZE)

        result = await self.engine.clear(xml, self.sign(xml, rogue))
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)

        self.assertIsNone(await self.db.get_payment(transfer.uetr))
        events = [row["event"] for row in await self.db.audit_trail(transfer.uetr)]
        self.assertIn("UNAUTHENTICATED_REJECTED", events)

    async def test_ledger_remains_healthy_after_every_tamper_attempt(self) -> None:
        xml, signature, _ = self.signed("NXSTAMPER011")
        for mutation in (">4500.00<", "PACIFIC", "CHASUS33XXX"):
            await self.engine.clear(xml.replace(mutation, mutation.replace("4", "5").replace("P", "Q").replace("C", "D")), signature)
        await self.assertLedgerHealthy()


# ==========================================================================
# VECTOR 3 — replay
# ==========================================================================

class ReplayAttackTest(ClearingHarness):
    """Identical identifiers must never execute twice, at any concurrency."""

    async def test_identical_resubmission_is_rejected(self) -> None:
        xml, signature, transfer = self.signed("NXSREPLAY001")

        first = await self.engine.clear(xml, signature)
        self.assertTrue(first.settled)
        balance_after_first = await self.balance(DEBTOR_ACCOUNT)

        second = await self.engine.clear(xml, signature)

        self.assertIs(second.status, SettlementStatus.REJECTED_DUPLICATE)
        self.assertIs(second.reason, RejectionReason.DUPLICATE_UETR)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), balance_after_first)
        self.assertEqual(len(await self.db.ledger_for(transfer.uetr)), 2)

    async def test_replay_is_rejected_on_every_subsequent_attempt(self) -> None:
        xml, signature, _ = self.signed("NXSREPLAY002")
        self.assertTrue((await self.engine.clear(xml, signature)).settled)

        for attempt in range(10):
            with self.subTest(attempt=attempt):
                result = await self.engine.clear(xml, signature)
                self.assertIs(result.status, SettlementStatus.REJECTED_DUPLICATE)

        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR - 4500_00)

    async def test_resigned_replay_is_still_rejected(self) -> None:
        """PSS is randomised, so a replay can carry a *fresh, valid* signature.

        This is why replay defence must key on the UETR and not on signature
        equality: the attacker cannot re-sign (no private key), but the
        genuine sender's own retry produces different bytes for the same
        payment, and both must be caught.
        """
        xml, signature, _ = self.signed("NXSREPLAY003")
        self.assertTrue((await self.engine.clear(xml, signature)).settled)

        fresh_signature = self.sign(xml)
        self.assertNotEqual(fresh_signature, signature, "PSS must be randomised")

        result = await self.engine.clear(xml, fresh_signature)
        self.assertIs(result.status, SettlementStatus.REJECTED_DUPLICATE)

    async def test_msg_id_reuse_with_a_fresh_uetr_is_rejected(self) -> None:
        xml_one, signature_one, _ = self.signed("NXSREPLAY004")
        self.assertTrue((await self.engine.clear(xml_one, signature_one)).settled)

        # Same MsgId, brand-new UETR — a different message that reuses an
        # identifier the sender has already spent.
        xml_two, signature_two, _ = self.signed("NXSREPLAY004")
        result = await self.engine.clear(xml_two, signature_two)

        self.assertIs(result.status, SettlementStatus.REJECTED_DUPLICATE)
        self.assertIs(result.reason, RejectionReason.DUPLICATE_MSG_ID)

    async def test_msg_id_uniqueness_is_scoped_per_sender(self) -> None:
        """Two institutions may legitimately use the same MsgId.

        A globally unique MsgId index would let one participant deny service
        to another by burning identifiers.
        """
        await self.engine.register_institution(
            Institution(
                bic=THIRD_BIC,
                name="BNP Paribas",
                country="FR",
                public_key_pem=self.third_keys.public_pem(),
            )
        )
        await self.engine.open_account(Account("FR-DEBTOR-0001", THIRD_BIC, "EUR", 100_000_00))

        xml_one, signature_one, _ = self.signed("SHAREDMSGID01")
        self.assertTrue((await self.engine.clear(xml_one, signature_one)).settled)

        third_debtor = PartyIdentification("BNP CLIENT", "FR-DEBTOR-0001", THIRD_BIC, "FR")
        xml_two, _ = self.build("SHAREDMSGID01", "10.00", debtor=third_debtor)
        result = await self.engine.clear(xml_two, self.sign(xml_two, self.third_keys))

        self.assertTrue(result.settled, f"MsgId must be unique per sender only: {result}")

    async def test_concurrent_replay_burst_settles_exactly_once(self) -> None:
        """Twenty simultaneous submissions of one payment. Exactly one settles.

        This is the race a SELECT-then-INSERT idempotency check loses: every
        ``await`` is a scheduling point, so all twenty tasks can pass the
        existence check before any of them inserts. Only a UNIQUE constraint
        closes it.
        """
        xml, signature, transfer = self.signed("NXSREPLAY005")

        results = await asyncio.gather(
            *(self.engine.clear(xml, signature) for _ in range(20))
        )

        settled = [r for r in results if r.settled]
        duplicates = [r for r in results if r.status is SettlementStatus.REJECTED_DUPLICATE]

        self.assertEqual(len(settled), 1, f"exactly one must settle, got {len(settled)}")
        self.assertEqual(len(duplicates), 19)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR - 4500_00)
        self.assertEqual(len(await self.db.ledger_for(transfer.uetr)), 2)
        await self.assertLedgerHealthy()

    async def test_replay_attempts_are_audited(self) -> None:
        xml, signature, transfer = self.signed("NXSREPLAY006")
        await self.engine.clear(xml, signature)
        await self.engine.clear(xml, signature)
        await self.engine.clear(xml, signature)

        events = [row["event"] for row in await self.db.audit_trail(transfer.uetr)]
        self.assertEqual(events.count("REPLAY_REJECTED"), 2)
        self.assertEqual(events.count("PAYMENT_SETTLED"), 1)


# ==========================================================================
# VECTOR 4 — liquidity
# ==========================================================================

class LiquidityEnforcementTest(ClearingHarness):
    """Settlement must never overdraw beyond the agreed credit line."""

    async def test_transfer_exceeding_balance_is_rejected(self) -> None:
        xml, signature, _ = self.signed("NXSLIQ0001", "10000000.00")

        result = await self.engine.clear(xml, signature)

        self.assertIs(result.status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertIs(result.reason, RejectionReason.INSUFFICIENT_FUNDS)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)
        self.assertEqual(await self.balance(CREDITOR_ACCOUNT), OPENING_CREDITOR_MINOR)

    async def test_transfer_of_exactly_the_balance_succeeds(self) -> None:
        """The boundary must be inclusive: an account may go to exactly zero."""
        xml, signature, _ = self.signed("NXSLIQ0002", "1000000.00")
        result = await self.engine.clear(xml, signature)
        self.assertTrue(result.settled, str(result))
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), 0)

    async def test_one_minor_unit_over_the_balance_is_rejected(self) -> None:
        """Off-by-one at the liquidity boundary, in the strictest form."""
        xml, signature, _ = self.signed("NXSLIQ0003", "1000000.01")
        result = await self.engine.clear(xml, signature)
        self.assertIs(result.status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)

    async def test_overdraft_limit_is_honoured(self) -> None:
        await self.engine.open_account(
            Account("OD-DEBTOR-0001", SENDER_BIC, "EUR", 1_000_00, overdraft_limit_minor=500_00)
        )
        debtor = PartyIdentification("OVERDRAFT CO", "OD-DEBTOR-0001", SENDER_BIC, "DE")

        # 1,400 against a 1,000 balance + 500 credit line: within the line.
        xml, _ = self.build("NXSLIQ0004", "1400.00", debtor=debtor)
        result = await self.engine.clear(xml, self.sign(xml))
        self.assertTrue(result.settled, str(result))
        self.assertEqual(await self.balance("OD-DEBTOR-0001"), -400_00)

        # A further 200 would reach -600, breaching the 500 line.
        xml, _ = self.build("NXSLIQ0005", "200.00", debtor=debtor)
        result = await self.engine.clear(xml, self.sign(xml))
        self.assertIs(result.status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertEqual(await self.balance("OD-DEBTOR-0001"), -400_00)

    async def test_sequential_drain_stops_at_the_limit(self) -> None:
        """Repeated withdrawals must stop exactly at zero, never below."""
        settled = 0
        for index in range(12):
            xml, signature, _ = self.signed(f"NXSDRAIN{index:05d}", "100000.00")
            if (await self.engine.clear(xml, signature)).settled:
                settled += 1

        self.assertEqual(settled, 10, "1,000,000 / 100,000 = exactly ten transfers")
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), 0)
        await self.assertLedgerHealthy()

    async def test_concurrent_double_spend_is_prevented(self) -> None:
        """Two tasks, each for the full balance. Exactly one may settle.

        Without the settlement lock both coroutines read the same balance,
        both see sufficient funds, and the account ends negative — the
        classic asyncio TOCTOU double-spend.
        """
        xml_one, signature_one, _ = self.signed("NXSRACE0001", "1000000.00")
        xml_two, signature_two, _ = self.signed("NXSRACE0002", "1000000.00")

        results = await asyncio.gather(
            self.engine.clear(xml_one, signature_one),
            self.engine.clear(xml_two, signature_two),
        )

        settled = [r for r in results if r.settled]
        self.assertEqual(len(settled), 1, f"double-spend: {[str(r) for r in results]}")
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), 0)
        self.assertGreaterEqual(await self.balance(DEBTOR_ACCOUNT), 0, "balance went negative")
        await self.assertLedgerHealthy()

    async def test_high_concurrency_never_overdraws(self) -> None:
        """Fifty concurrent 30,000 transfers against a 1,000,000 balance."""
        submissions = [self.signed(f"NXSBURST{i:05d}", "30000.00") for i in range(50)]
        results = await asyncio.gather(
            *(self.engine.clear(xml, signature) for xml, signature, _ in submissions)
        )

        settled = [r for r in results if r.settled]
        rejected = [r for r in results if r.status is SettlementStatus.REJECTED_LIQUIDITY]

        self.assertEqual(len(settled), 33, "1,000,000 / 30,000 = 33 whole transfers")
        self.assertEqual(len(rejected), 17)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), 1_000_000_00 - 33 * 30_000_00)
        self.assertGreaterEqual(await self.balance(DEBTOR_ACCOUNT), 0)
        await self.assertLedgerHealthy()

    async def test_authenticated_rejection_does_consume_its_uetr(self) -> None:
        """The other half of the attribution rule.

        Once the sender is cryptographically proven, its rejected payment IS
        journalled and the UETR is spent. Funding the account and replaying
        the same instruction must NOT settle it — gpi requires a new UETR for
        a new attempt, and the terminal status is final.
        """
        xml, signature, transfer = self.signed("NXSBURN0001", "5000000.00")

        first = await self.engine.clear(xml, signature)
        self.assertIs(first.status, SettlementStatus.REJECTED_LIQUIDITY)

        record = await self.db.get_payment(transfer.uetr)
        self.assertIsNotNone(record, "an authenticated rejection must be journalled")
        assert record is not None
        self.assertIs(record.settlement_status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertIs(record.rejection_reason, RejectionReason.INSUFFICIENT_FUNDS)

        # Replay must stay rejected as a duplicate regardless of funding:
        # the UETR is spent, and a spent UETR can never settle.
        replay = await self.engine.clear(xml, signature)
        self.assertIs(replay.status, SettlementStatus.REJECTED_DUPLICATE)
        self.assertIs(replay.reason, RejectionReason.DUPLICATE_UETR)
        self.assertEqual(await self.balance(CREDITOR_ACCOUNT), OPENING_CREDITOR_MINOR)

    async def test_frozen_account_cannot_settle(self) -> None:
        await self.engine.open_account(
            Account(DEBTOR_ACCOUNT, SENDER_BIC, "EUR", OPENING_DEBTOR_MINOR, status=AccountStatus.FROZEN)
        )
        xml, signature, _ = self.signed("NXSFROZEN001")
        result = await self.engine.clear(xml, signature)

        self.assertIs(result.status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertIs(result.reason, RejectionReason.ACCOUNT_BLOCKED)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)

    async def test_unknown_settlement_account_is_rejected(self) -> None:
        ghost = PartyIdentification("GHOST GMBH", "DE00000000000000000000", SENDER_BIC, "DE")
        xml, _ = self.build("NXSGHOST001", debtor=ghost)
        result = await self.engine.clear(xml, self.sign(xml))

        self.assertIs(result.status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertIs(result.reason, RejectionReason.UNKNOWN_ACCOUNT)

    async def test_currency_mismatch_is_rejected_not_converted(self) -> None:
        """A clearing hub must never invent an FX rate."""
        await self.engine.open_account(Account("USD-CRED-0001", RECEIVER_BIC, "USD", 0))
        creditor = PartyIdentification("USD BENEFICIARY", "USD-CRED-0001", RECEIVER_BIC, "US")
        xml, _ = self.build("NXSFX0001", "1000.00", "EUR", creditor=creditor)

        result = await self.engine.clear(xml, self.sign(xml))

        self.assertIs(result.status, SettlementStatus.REJECTED_LIQUIDITY)
        self.assertIs(result.reason, RejectionReason.CURRENCY_MISMATCH)
        self.assertEqual(await self.balance("USD-CRED-0001"), 0)

    async def test_account_not_held_by_the_named_agent_is_rejected(self) -> None:
        """A participant may not debit an account it does not hold."""
        thief = PartyIdentification("THIEF GMBH", CREDITOR_ACCOUNT, SENDER_BIC, "DE")
        victim = PartyIdentification("VICTIM", DEBTOR_ACCOUNT, RECEIVER_BIC, "US")
        xml, _ = self.build("NXSTHEFT001", "50000.00", debtor=thief, creditor=victim)

        result = await self.engine.clear(xml, self.sign(xml))

        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.UNKNOWN_ACCOUNT)
        self.assertEqual(await self.balance(CREDITOR_ACCOUNT), OPENING_CREDITOR_MINOR)


# ==========================================================================
# Identity and participant control
# ==========================================================================

class ParticipantControlTest(ClearingHarness):

    async def test_unregistered_sender_is_rejected(self) -> None:
        stranger = PartyIdentification("STRANGER SA", DEBTOR_ACCOUNT, THIRD_BIC, "FR")
        xml, _ = self.build("NXSUNREG001", debtor=stranger)
        result = await self.engine.clear(xml, self.sign(xml, self.third_keys))

        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.UNKNOWN_INSTITUTION)

    async def test_unregistered_receiver_is_rejected(self) -> None:
        stranger = PartyIdentification("STRANGER SA", CREDITOR_ACCOUNT, THIRD_BIC, "FR")
        xml, _ = self.build("NXSUNREG002", creditor=stranger)
        result = await self.engine.clear(xml, self.sign(xml))
        self.assertIs(result.reason, RejectionReason.UNKNOWN_INSTITUTION)

    async def test_suspended_institution_cannot_clear(self) -> None:
        await self.db.register_institution(
            Institution(
                bic=SENDER_BIC,
                name="Deutsche Bank AG",
                country="DE",
                public_key_pem=self.sender_keys.public_pem(),
                status=InstitutionStatus.SUSPENDED,
            )
        )
        xml, signature, _ = self.signed("NXSSUSP0001")
        result = await self.engine.clear(xml, signature)

        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.INSTITUTION_SUSPENDED)
        self.assertEqual(await self.balance(DEBTOR_ACCOUNT), OPENING_DEBTOR_MINOR)

    async def test_key_rotation_invalidates_the_old_key(self) -> None:
        """After rotation, a signature from the retired key must not verify."""
        xml, old_signature, _ = self.signed("NXSROT0001")

        rotated = await SigningEngine.generate_keypair_async(SENDER_BIC, key_size=TEST_KEY_SIZE)
        await self.engine.register_institution(
            Institution(
                bic=SENDER_BIC,
                name="Deutsche Bank AG",
                country="DE",
                public_key_pem=rotated.public_pem(),
            )
        )

        result = await self.engine.clear(xml, old_signature)
        self.assertIs(result.reason, RejectionReason.SIGNATURE_INVALID)

        xml_new, _ = self.build("NXSROT0002")
        result = await self.engine.clear(xml_new, self.sign(xml_new, rotated))
        self.assertTrue(result.settled, "the rotated key must work immediately")


# ==========================================================================
# Schema
# ==========================================================================

class SchemaValidationTest(ClearingHarness):

    async def test_structurally_invalid_document_is_rejected_before_any_lookup(self) -> None:
        result = await self.engine.clear("<not-a-payment/>", "QUJD")
        self.assertIs(result.status, SettlementStatus.REJECTED_TAMPERED)
        self.assertIs(result.reason, RejectionReason.SCHEMA_INVALID)

    async def test_wrong_namespace_is_rejected(self) -> None:
        xml, signature, _ = self.signed("NXSNS0001")
        wrong = xml.replace("pacs.008.001.10", "pacs.009.001.10")
        result = await self.engine.clear(wrong, signature)
        self.assertIs(result.reason, RejectionReason.SCHEMA_INVALID)

    async def test_doctype_is_rejected(self) -> None:
        """Billion-laughs and XXE both begin with a DTD."""
        xml, signature, _ = self.signed("NXSXXE0001")
        payload = '<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;">]>' + xml
        result = await self.engine.clear(payload, signature)
        self.assertIs(result.reason, RejectionReason.SCHEMA_INVALID)

    def test_amount_parsing_rejects_ambiguous_forms(self) -> None:
        for bad in ("1E3", "-5.00", "1,000.00", "", "  ", "1.2.3", "0", "0.00", "abc", "+5.00"):
            with self.subTest(amount=bad):
                with self.assertRaises(CurrencyError):
                    parse_amount(bad, "EUR")

    def test_amount_precision_is_enforced_per_currency(self) -> None:
        self.assertEqual(to_minor(Decimal("1.234"), "BHD"), 1234)
        self.assertEqual(to_minor(Decimal("500000"), "JPY"), 500_000)
        self.assertEqual(to_minor(Decimal("10.99"), "USD"), 1099)
        with self.assertRaises(CurrencyError):
            to_minor(Decimal("1.005"), "USD")
        with self.assertRaises(CurrencyError):
            to_minor(Decimal("100.5"), "JPY")
        with self.assertRaises(CurrencyError):
            minor_units("XYZ")

    def test_bic_validation(self) -> None:
        for good in ("DEUTDEFF", "DEUTDEFFXXX", "CHASUS33XXX", "BNPAFRPPXXX", "NWBKGB2L"):
            self.assertTrue(is_valid_bic(good), good)
        for bad in ("DEUTDEFFX", "DEUTDEFFXXXX", "DEUT1EFF", "deutdeff", "DEUTDE0F", "DEUTDE1F", "", "DEUT"):
            self.assertFalse(is_valid_bic(bad), bad)

    def test_uetr_must_be_uuid_v4(self) -> None:
        validate_uetr("8b1c1d38-5393-42e1-ab3e-455bdb9cd230")
        for bad in (
            "8B1C1D38-5393-42E1-AB3E-455BDB9CD230",   # uppercase
            "8b1c1d38-5393-12e1-ab3e-455bdb9cd230",   # version 1
            "8b1c1d38-5393-42e1-cb3e-455bdb9cd230",   # bad variant nibble
            "not-a-uuid",
            "",
        ):
            with self.subTest(uetr=bad):
                with self.assertRaises(SchemaValidationException):
                    validate_uetr(bad)

    def test_round_trip_is_byte_stable(self) -> None:
        xml, transfer = self.build("NXSRT0001")
        self.assertEqual(parse_pacs008(xml), transfer)

    def test_batched_envelope_is_refused(self) -> None:
        xml, _ = self.build("NXSBATCH001")
        with self.assertRaises(SchemaValidationException):
            parse_pacs008(xml.replace("<NbOfTxs>1</NbOfTxs>", "<NbOfTxs>2</NbOfTxs>"))

    def test_group_header_total_must_match_the_transaction(self) -> None:
        xml, _ = self.build("NXSHDR0001", "4500.00")
        with self.assertRaises(SchemaValidationException):
            parse_pacs008(xml.replace('<TtlIntrBkSttlmAmt Ccy="EUR">4500.00', '<TtlIntrBkSttlmAmt Ccy="EUR">1.00'))


# ==========================================================================
# Ledger integrity
# ==========================================================================

class LedgerIntegrityTest(ClearingHarness):

    async def test_chain_links_every_entry_to_its_predecessor(self) -> None:
        for index in range(5):
            xml, signature, _ = self.signed(f"NXSCHAIN{index:05d}", "100.00")
            await self.engine.clear(xml, signature)

        entries = await self.db.all_ledger_entries()
        self.assertEqual(len(entries), 10)
        self.assertEqual(entries[0].prev_hash, GENESIS_HASH)
        for previous, current in zip(entries, entries[1:]):
            self.assertEqual(current.prev_hash, previous.entry_hash)

        intact, detail = await self.db.verify_ledger_chain()
        self.assertTrue(intact, detail)

    async def test_post_hoc_row_mutation_is_detected(self) -> None:
        """Rewrite a settled amount directly in SQL. The chain must catch it."""
        xml, signature, transfer = self.signed("NXSCHAIN10001")
        await self.engine.clear(xml, signature)

        intact, _ = await self.db.verify_ledger_chain()
        self.assertTrue(intact)

        await self.db.execute(
            "UPDATE ledger_entries SET amount_minor = 999999 WHERE uetr = ? AND direction = 'CREDIT'",
            (transfer.uetr,),
        )

        intact, detail = await self.db.verify_ledger_chain()
        self.assertFalse(intact, "an altered settled row must break the chain")
        self.assertIn("hash mismatch", detail or "")

    async def test_entry_deletion_is_detected(self) -> None:
        for index in range(3):
            xml, signature, _ = self.signed(f"NXSDEL{index:05d}", "100.00")
            await self.engine.clear(xml, signature)

        await self.db.execute("DELETE FROM ledger_entries WHERE entry_id = 2")

        intact, detail = await self.db.verify_ledger_chain()
        self.assertFalse(intact, "a deleted link must break the chain")
        self.assertIsNotNone(detail)

    async def test_reconcile_reports_healthy_on_a_clean_ledger(self) -> None:
        for index in range(4):
            xml, signature, _ = self.signed(f"NXSREC{index:05d}", "250.00")
            await self.engine.clear(xml, signature)

        report = await self.engine.reconcile()
        self.assertTrue(report["healthy"], report)
        self.assertEqual(report["per_currency_net_minor"], {"EUR": 0})

    async def test_reconcile_detects_an_out_of_band_balance_change(self) -> None:
        xml, signature, _ = self.signed("NXSDRIFT0001")
        await self.engine.clear(xml, signature)

        await self.db.execute(
            "UPDATE accounts SET balance_minor = balance_minor + 1 WHERE account_id = ?",
            (CREDITOR_ACCOUNT,),
        )

        report = await self.engine.reconcile()
        self.assertFalse(report["balances_agree"])
        self.assertIn(CREDITOR_ACCOUNT, report["balance_drift"])
        self.assertFalse(report["healthy"])

    async def test_audit_log_is_chained(self) -> None:
        xml, signature, _ = self.signed("NXSAUDIT0001")
        await self.engine.clear(xml, signature)

        rows = await self.db.audit_trail()
        self.assertGreater(len(rows), 0)
        self.assertEqual(rows[0]["prev_hash"], GENESIS_HASH)
        for previous, current in zip(rows, rows[1:]):
            self.assertEqual(current["prev_hash"], previous["entry_hash"])

    async def test_database_constraint_blocks_a_negative_balance(self) -> None:
        """The SQL CHECK is the backstop if the engine's logic is ever wrong."""
        with self.assertRaises(sqlite3.IntegrityError):
            await self.db.execute(
                "UPDATE accounts SET balance_minor = -1 WHERE account_id = ?", (DEBTOR_ACCOUNT,)
            )


# ==========================================================================
# Cryptographic primitives
# ==========================================================================

class SeedingAndAuditRaceTest(ClearingHarness):
    """Regressions for two bugs that only appear on the second run."""

    async def test_reopening_an_account_never_overwrites_its_balance(self) -> None:
        """Re-seeding must not create value out of nothing."""
        xml, signature, _ = self.signed("NXSSEED0001", "1000.00")
        self.assertTrue((await self.engine.clear(xml, signature)).settled)
        after_settlement = await self.balance(DEBTOR_ACCOUNT)
        self.assertEqual(after_settlement, OPENING_DEBTOR_MINOR - 1000_00)

        # Exactly what a repeated seed run does.
        created = await self.engine.open_account(
            Account(DEBTOR_ACCOUNT, SENDER_BIC, "EUR", OPENING_DEBTOR_MINOR)
        )
        self.assertFalse(created, "an existing account must not be reported as created")
        self.assertEqual(
            await self.balance(DEBTOR_ACCOUNT),
            after_settlement,
            "re-opening an account must not restore its balance",
        )
        await self.assertLedgerHealthy()

    async def test_reopening_still_updates_status_and_limits(self) -> None:
        await self.engine.open_account(
            Account(
                DEBTOR_ACCOUNT,
                SENDER_BIC,
                "EUR",
                0,
                status=AccountStatus.FROZEN,
                overdraft_limit_minor=250_00,
            )
        )
        account = await self.db.get_account(DEBTOR_ACCOUNT)
        assert account is not None
        self.assertIs(account.status, AccountStatus.FROZEN)
        self.assertEqual(account.overdraft_limit_minor, 250_00)
        self.assertEqual(account.balance_minor, OPENING_DEBTOR_MINOR)

    async def test_opening_balance_is_recorded_exactly_once(self) -> None:
        for _ in range(3):
            await self.engine.open_account(
                Account(DEBTOR_ACCOUNT, SENDER_BIC, "EUR", OPENING_DEBTOR_MINOR)
            )
        events = [
            row["event"]
            for row in await self.db.audit_trail()
            if row["event"] in ("ACCOUNT_OPENED", "ACCOUNT_TERMS_UPDATED")
        ]
        self.assertEqual(events.count("ACCOUNT_OPENED"), 2, "one per seeded account")
        self.assertEqual(events.count("ACCOUNT_TERMS_UPDATED"), 3)

    async def test_concurrent_audit_appends_do_not_collide(self) -> None:
        """The audit chain is a read-modify-write and must be serialised.

        Fifty identical appends, issued simultaneously: same actor, event,
        UETR and detail, all within a millisecond or two. Before the fix each
        one read the same chain head and computed the same entry hash, and
        the second insert died on the UNIQUE constraint.
        """
        await asyncio.gather(
            *(
                self.db.append_audit(
                    actor=SENDER_BIC,
                    event="REPLAY_REJECTED",
                    uetr="11111111-1111-4111-8111-111111111111",
                    detail={"reason": "identical", "msg_id": "SAME"},
                )
                for _ in range(50)
            )
        )

        rows = await self.db.audit_trail()
        hashes = [row["entry_hash"] for row in rows]
        self.assertEqual(len(hashes), len(set(hashes)), "audit hashes must be unique")

        # And the chain must still be strictly linear.
        self.assertEqual(rows[0]["prev_hash"], GENESIS_HASH)
        for previous, current in zip(rows, rows[1:]):
            self.assertEqual(current["prev_hash"], previous["entry_hash"])

    async def test_replay_burst_audit_chain_survives(self) -> None:
        """End-to-end version of the same race, through the engine."""
        xml, signature, transfer = self.signed("NXSAUDITRACE1")
        results = await asyncio.gather(*(self.engine.clear(xml, signature) for _ in range(24)))

        self.assertEqual(sum(1 for r in results if r.settled), 1)
        rows = await self.db.audit_trail()
        hashes = [row["entry_hash"] for row in rows]
        self.assertEqual(len(hashes), len(set(hashes)))
        for previous, current in zip(rows, rows[1:]):
            self.assertEqual(current["prev_hash"], previous["entry_hash"])
        await self.assertLedgerHealthy()


class CryptographicEngineTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls) -> None:
        cls.keys = SigningEngine.generate_keypair("TESTBIC0", key_size=TEST_KEY_SIZE)

    def test_sign_and_verify_round_trip(self) -> None:
        payload = b"<Document>settlement</Document>"
        self.assertTrue(SigningEngine.verify(self.keys.public_key, payload, SigningEngine.sign(self.keys.private_key, payload)))

    def test_pss_is_randomised(self) -> None:
        payload = "same bytes every time"
        first = SigningEngine.sign(self.keys.private_key, payload)
        second = SigningEngine.sign(self.keys.private_key, payload)
        self.assertNotEqual(first, second)
        self.assertTrue(SigningEngine.verify(self.keys.public_key, payload, first))
        self.assertTrue(SigningEngine.verify(self.keys.public_key, payload, second))

    def test_verification_fails_on_any_mutation(self) -> None:
        payload = "amount=4500.00"
        signature = SigningEngine.sign(self.keys.private_key, payload)
        for mutated in ("amount=4500.01", "amount=4500.00 ", " amount=4500.00", "Amount=4500.00"):
            with self.subTest(payload=mutated):
                self.assertFalse(SigningEngine.verify(self.keys.public_key, mutated, signature))

    def test_cross_key_verification_fails(self) -> None:
        other = SigningEngine.generate_keypair("OTHERBIC", key_size=TEST_KEY_SIZE)
        payload = "cross-key"
        signature = SigningEngine.sign(self.keys.private_key, payload)
        self.assertFalse(SigningEngine.verify(other.public_key, payload, signature))

    def test_malformed_signatures_raise(self) -> None:
        for bad in ("", "   ", "not base64!", "QUJD"):
            with self.subTest(signature=bad):
                with self.assertRaises(SignatureMalformedError):
                    SigningEngine.verify(self.keys.public_key, "payload", bad)

    def test_empty_payload_is_refused(self) -> None:
        with self.assertRaises(Exception):
            SigningEngine.sign(self.keys.private_key, "")

    def test_pem_round_trip_unencrypted(self) -> None:
        restored = SigningEngine.keypair_from_pem("TESTBIC0", self.keys.private_pem())
        self.assertEqual(restored.fingerprint, self.keys.fingerprint)

    def test_pem_round_trip_encrypted(self) -> None:
        password = b"a-long-passphrase-for-the-signing-key"
        pem = self.keys.private_pem(password=password)
        self.assertIn("ENCRYPTED PRIVATE KEY", pem)
        restored = SigningEngine.keypair_from_pem("TESTBIC0", pem, password=password)
        self.assertEqual(restored.fingerprint, self.keys.fingerprint)
        with self.assertRaises(KeyImportError):
            SigningEngine.load_private_key(pem, password=b"wrong")

    def test_public_pem_round_trip(self) -> None:
        loaded = SigningEngine.load_public_key(self.keys.public_pem())
        self.assertEqual(loaded.key_size, TEST_KEY_SIZE)

    def test_garbage_pem_is_refused(self) -> None:
        for junk in ("", "-----BEGIN PUBLIC KEY-----\nnope\n-----END PUBLIC KEY-----\n", "hello"):
            with self.subTest(pem=junk[:20]):
                with self.assertRaises(KeyImportError):
                    SigningEngine.load_public_key(junk)

    def test_registry_caches_and_rotates(self) -> None:
        registry = KeyRegistry()
        pem = self.keys.public_pem()
        registry.register("TESTBIC0", pem)
        self.assertIn("TESTBIC0", registry)
        self.assertIs(registry.resolve("TESTBIC0", pem), registry.get("TESTBIC0"))

        original = registry.get("TESTBIC0")
        rotated = SigningEngine.generate_keypair("TESTBIC0", key_size=TEST_KEY_SIZE)
        resolved = registry.resolve("TESTBIC0", rotated.public_pem())

        # A changed PEM must force a re-parse, not serve the stale key.
        self.assertIsNot(resolved, original)
        self.assertIs(registry.get("TESTBIC0"), resolved)
        payload = "rotation check"
        self.assertTrue(
            SigningEngine.verify(resolved, payload, SigningEngine.sign(rotated.private_key, payload))
        )
        self.assertFalse(
            SigningEngine.verify(resolved, payload, SigningEngine.sign(self.keys.private_key, payload)),
            "the retired key must no longer verify after rotation",
        )

        self.assertTrue(registry.revoke("TESTBIC0"))
        self.assertFalse(registry.revoke("TESTBIC0"))

    def test_fingerprint_is_stable_and_distinct(self) -> None:
        other = SigningEngine.generate_keypair("OTHERBIC", key_size=TEST_KEY_SIZE)
        self.assertEqual(self.keys.fingerprint, self.keys.fingerprint)
        self.assertNotEqual(self.keys.fingerprint, other.fingerprint)
        self.assertEqual(len(self.keys.fingerprint), 64)


class ProductionDefaultsTest(unittest.TestCase):
    """Guards the shortcut the rest of the suite takes.

    The suite uses 2048-bit keys for speed. These assertions make sure that
    convenience cannot leak into the deployed configuration.
    """

    def test_production_modulus_is_4096(self) -> None:
        self.assertEqual(RSA_KEY_SIZE, 4096)

    def test_pss_salt_is_pinned_to_the_digest_length(self) -> None:
        self.assertEqual(PSS_SALT_LENGTH, 32)

    def test_weak_keys_are_refused(self) -> None:
        for weak in (512, 1024, 2047):
            with self.subTest(bits=weak):
                with self.assertRaises(KeyGenerationError):
                    SigningEngine.generate_keypair("WEAKBIC0", key_size=weak)


if __name__ == "__main__":
    unittest.main(verbosity=2)
