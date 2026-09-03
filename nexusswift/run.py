#!/usr/bin/env python3
"""
NexusSwift :: orchestration entrypoint
======================================

Runs the database migration, establishes test institutions with freshly
generated RSA-4096 key material, and drives a runtime validation loop that
exercises the clearing pipeline against every attack vector the hub is
designed to stop.

    python run.py                 # migrate, seed, run the validation loop
    python run.py --migrate-only  # schema only (init container / job)
    python run.py --db ledger.db  # persist instead of using memory
    python run.py --key-size 2048 # faster demo; NOT for production

Exit status is 0 only if every stage behaved exactly as specified — the
settlements settled, and every attack was rejected with the expected reason
code. A non-zero exit means the hub is not safe to serve traffic, which is
what makes this usable as a container healthcheck or a deployment gate.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import secrets
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from core.crypto import KeyPair, SigningEngine
from core.engine import ClearingEngine, ClearingResult
from core.models import (
    Account,
    Database,
    Institution,
    RejectionReason,
    SettlementStatus,
    from_minor,
)
from core.schemas import PartyIdentification, build_pacs008

# --------------------------------------------------------------------------
# Presentation
# --------------------------------------------------------------------------

_COLOUR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _paint(text: str, code: str) -> str:
    return f"\033[{code}m{text}\033[0m" if _COLOUR else text


def ok(text: str) -> str:
    return _paint(text, "32")


def bad(text: str) -> str:
    return _paint(text, "31")


def dim(text: str) -> str:
    return _paint(text, "2")


def head(title: str) -> None:
    print(f"\n{_paint('━' * 74, '2')}")
    print(_paint(f" {title}", "1;36"))
    print(_paint("━" * 74, "2"))


# --------------------------------------------------------------------------
# Seed data
# --------------------------------------------------------------------------

INSTITUTIONS: tuple[tuple[str, str, str], ...] = (
    ("DEUTDEFFXXX", "Deutsche Bank AG", "DE"),
    ("CHASUS33XXX", "JPMorgan Chase Bank NA", "US"),
    ("BNPAFRPPXXX", "BNP Paribas SA", "FR"),
)

#: Base account identifiers. The demo suffixes each with a per-run token —
#: see :func:`account_id`.
ACCOUNTS: tuple[tuple[str, str, str, int], ...] = (
    ("DE89370400440532013000", "DEUTDEFFXXX", "EUR", 2_500_000_00),
    ("US64SVBK0000001234", "CHASUS33XXX", "EUR",   750_000_00),
    ("FR76300060000112345678", "BNPAFRPPXXX", "EUR", 1_200_000_00),
)


def account_id(base: str, run_id: str) -> str:
    """Scope an account identifier to one demo run.

    Balances are deliberately never reset when an existing account is
    re-opened (see ``Database.open_account``), so a run that drains an
    account — and this one does, on purpose, to exercise the concurrent
    double-spend path — would leave the NEXT run with no liquidity and a
    wall of spurious failures.

    Fresh accounts per run is also the honest model: the persistent ledger
    then accumulates real history across runs rather than being rewritten,
    which is what ``--healthcheck`` reconciles.
    """
    return f"{base}-{run_id}"


async def seed(engine: ClearingEngine, key_size: int, run_id: str) -> dict[str, KeyPair]:
    """Generate key material and register participants and their accounts."""
    keys: dict[str, KeyPair] = {}

    for bic, name, country in INSTITUTIONS:
        pair = await SigningEngine.generate_keypair_async(bic, key_size=key_size)
        keys[bic] = pair
        await engine.register_institution(
            Institution(bic=bic, name=name, country=country, public_key_pem=pair.public_pem())
        )
        print(f"  {ok('✓')} {bic}  {name:26s} RSA-{pair.key_size}  {dim(pair.short_fingerprint)}")

    for base, bic, currency, opening in ACCOUNTS:
        identifier = account_id(base, run_id)
        await engine.open_account(Account(identifier, bic, currency, opening))
        print(
            f"  {ok('✓')} {identifier:33s} {bic}  "
            f"{from_minor(opening, currency):>14,.2f} {currency}"
        )

    return keys


# --------------------------------------------------------------------------
# Validation loop
# --------------------------------------------------------------------------

class Validator:
    """Runs each scenario and records whether it behaved as specified."""

    def __init__(self) -> None:
        self.passed = 0
        self.failed: list[str] = []

    def check(
        self,
        label: str,
        result: ClearingResult,
        expect_status: SettlementStatus,
        expect_reason: RejectionReason | None = None,
    ) -> None:
        status_ok = result.status is expect_status
        reason_ok = expect_reason is None or result.reason is expect_reason

        if status_ok and reason_ok:
            self.passed += 1
            detail = result.reason.value if result.reason is not RejectionReason.NONE else ""
            print(f"  {ok('PASS')}  {label:46s} {result.status.value:19s} {dim(detail)}")
        else:
            expected = expect_status.value + (f"/{expect_reason.value}" if expect_reason else "")
            actual = f"{result.status.value}/{result.reason.value}"
            self.failed.append(f"{label}: expected {expected}, got {actual}")
            print(f"  {bad('FAIL')}  {label:46s} expected {expected}, got {actual}")


async def validate(engine: ClearingEngine, keys: dict[str, KeyPair], run_id: str) -> Validator:
    # MsgId is unique per sender for the lifetime of the journal, so a fixed
    # set of literals works exactly once. Against a persistent /data volume
    # the SECOND run would fail every check with DUPLICATE_MSG_ID — the
    # engine behaving correctly, the demo behaving carelessly. A per-run
    # prefix is also what a real sending institution does.
    sender, receiver = "DEUTDEFFXXX", "CHASUS33XXX"
    debtor_account = account_id("DE89370400440532013000", run_id)
    creditor_account = account_id("US64SVBK0000001234", run_id)
    third_account = account_id("FR76300060000112345678", run_id)
    debtor = PartyIdentification(
        "ACME MANUFACTURING GMBH", debtor_account, sender, "DE", "Taunusanlage 12"
    )
    creditor = PartyIdentification(
        "PACIFIC RIM TRADING LLC", creditor_account, receiver, "US", "270 Park Avenue"
    )

    def make(msg_id: str, amount: str = "4500.00", **kw: object) -> tuple[str, str]:
        xml, _ = build_pacs008(
            msg_id=f"NXS{run_id}{msg_id}",
            debtor=kw.pop("debtor", debtor),  # type: ignore[arg-type]
            creditor=kw.pop("creditor", creditor),  # type: ignore[arg-type]
            amount=Decimal(amount),
            currency="EUR",
            **kw,  # type: ignore[arg-type]
        )
        return xml, SigningEngine.sign(keys[sender].private_key, xml)

    validator = Validator()

    head("STAGE 3 — runtime validation loop")

    # 1. Baseline: a genuine payment must settle.
    xml, signature = make("TX01", "4500.00", remittance_info="INVOICE 2026-8871")
    validator.check(
        "valid cross-border transfer", await engine.clear(xml, signature), SettlementStatus.SETTLED
    )

    # 2. In-flight manipulation: alter the amount after signing.
    tampered_xml, tampered_signature = make("TX02")
    validator.check(
        "in-flight amount manipulation",
        await engine.clear(tampered_xml.replace(">4500.00<", ">999999.00<"), tampered_signature),
        SettlementStatus.REJECTED_TAMPERED,
        RejectionReason.SIGNATURE_INVALID,
    )

    # 3. Beneficiary redirection.
    redirect_xml, redirect_signature = make("TX03")
    validator.check(
        "beneficiary account redirection",
        await engine.clear(
            redirect_xml.replace(creditor_account, third_account),
            redirect_signature,
        ),
        SettlementStatus.REJECTED_TAMPERED,
        RejectionReason.SIGNATURE_INVALID,
    )

    # 4. Replay of the exact settled bytes.
    validator.check(
        "replay of a settled payment",
        await engine.clear(xml, signature),
        SettlementStatus.REJECTED_DUPLICATE,
        RejectionReason.DUPLICATE_UETR,
    )

    # 5. Concurrent replay burst — exactly one may settle.
    burst_xml, burst_signature = make("TX05")
    burst = await asyncio.gather(*(engine.clear(burst_xml, burst_signature) for _ in range(16)))
    settled = sum(1 for r in burst if r.settled)
    if settled == 1:
        validator.passed += 1
        print(f"  {ok('PASS')}  {'concurrent replay burst (16 tasks)':46s} 1 settled, {len(burst) - 1} duplicates")
    else:
        validator.failed.append(f"concurrent replay burst: {settled} settled, expected exactly 1")
        print(f"  {bad('FAIL')}  {'concurrent replay burst (16 tasks)':46s} {settled} settled, expected 1")

    # 6. MsgId reuse under a fresh UETR.
    reuse_xml, reuse_signature = make("TX01")
    validator.check(
        "MsgId reuse with a fresh UETR",
        await engine.clear(reuse_xml, reuse_signature),
        SettlementStatus.REJECTED_DUPLICATE,
        RejectionReason.DUPLICATE_MSG_ID,
    )

    # 7. Liquidity ceiling.
    liquidity_xml, liquidity_signature = make("TX07", "99000000.00")
    validator.check(
        "transfer beyond available liquidity",
        await engine.clear(liquidity_xml, liquidity_signature),
        SettlementStatus.REJECTED_LIQUIDITY,
        RejectionReason.INSUFFICIENT_FUNDS,
    )

    # 8. Concurrent double-spend of the whole balance.
    account = await engine.db.get_account(debtor_account)
    assert account is not None
    whole = f"{from_minor(account.balance_minor, 'EUR'):f}"
    race_a = make("TX08", whole)
    race_b = make("TX09", whole)
    race = await asyncio.gather(engine.clear(*race_a), engine.clear(*race_b))
    settled = sum(1 for r in race if r.settled)
    if settled == 1:
        validator.passed += 1
        print(f"  {ok('PASS')}  {'concurrent double-spend':46s} 1 settled, 1 rejected")
    else:
        validator.failed.append(f"concurrent double-spend: {settled} settled, expected exactly 1")
        print(f"  {bad('FAIL')}  {'concurrent double-spend':46s} {settled} settled, expected 1")

    # 9. Signature from a different registered institution.
    foreign_xml, _ = make("TX10")
    validator.check(
        "signature from the wrong institution",
        await engine.clear(foreign_xml, SigningEngine.sign(keys[receiver].private_key, foreign_xml)),
        SettlementStatus.REJECTED_TAMPERED,
        RejectionReason.SIGNATURE_INVALID,
    )

    # 10. Structurally invalid envelope.
    validator.check(
        "malformed (non-pacs.008) envelope",
        await engine.clear("<Document><nope/></Document>", "QUJD"),
        SettlementStatus.REJECTED_TAMPERED,
        RejectionReason.SCHEMA_INVALID,
    )

    # 11. XXE / billion-laughs.
    xxe_xml, xxe_signature = make("TX11")
    validator.check(
        "DTD / entity-expansion payload",
        await engine.clear('<!DOCTYPE x [<!ENTITY a "a">]>' + xxe_xml, xxe_signature),
        SettlementStatus.REJECTED_TAMPERED,
        RejectionReason.SCHEMA_INVALID,
    )

    # 12. Debiting an account the sender does not hold.
    theft = PartyIdentification("THIEF GMBH", third_account, sender, "DE")
    theft_xml, theft_signature = make("TX12", "100000.00", debtor=theft)
    validator.check(
        "debiting an account not held by sender",
        await engine.clear(theft_xml, theft_signature),
        SettlementStatus.REJECTED_TAMPERED,
        RejectionReason.UNKNOWN_ACCOUNT,
    )

    return validator


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------

async def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="nexusswift", description="NexusSwift clearing hub — migrate, seed and validate."
    )
    parser.add_argument(
        "--db",
        default=os.environ.get("NEXUSSWIFT_DB", ":memory:"),
        help="SQLite path, or ':memory:' (default).",
    )
    parser.add_argument(
        "--key-size",
        type=int,
        default=int(os.environ.get("NEXUSSWIFT_KEY_SIZE", "4096")),
        help="RSA modulus for seeded institutions. 4096 is the production default.",
    )
    parser.add_argument("--migrate-only", action="store_true", help="Apply the schema and exit.")
    parser.add_argument(
        "--healthcheck",
        action="store_true",
        help="Fast liveness probe: verify the schema and reconcile the LIVE ledger, then exit.",
    )
    parser.add_argument("--json", action="store_true", help="Emit a machine-readable summary.")
    args = parser.parse_args(argv)

    database = Database(args.db, pool_size=1 if args.db == ":memory:" else 5)
    await database.connect()

    try:
        head("STAGE 1 — schema migration")
        version = await database.migrate()
        print(f"  {ok('✓')} schema at version {version}  {dim(database.path)}")

        if args.migrate_only:
            print(f"\n{ok('Migration complete.')}")
            return 0

        if args.healthcheck:
            # Deliberately cheap and deliberately pointed at the REAL ledger.
            # The full validation loop below generates three RSA-4096 keys and
            # clears a dozen payments; running that once a minute as a probe
            # burns CPU that settlement needs, and it proves only that a
            # throwaway in-memory database works. What matters in production
            # is whether the live journal still reconciles.
            probe = await ClearingEngine(database).reconcile()
            for label, key in (
                ("value conserved", "conserved"),
                ("hash chain intact", "chain_intact"),
                ("balances agree", "balances_agree"),
            ):
                print(f"  {ok('PASS') if probe[key] else bad('FAIL')}  {label}")
            if probe["healthy"]:
                print(f"\n{ok('Healthy.')}")
                return 0
            print(f"\n{bad('UNHEALTHY')} {json.dumps(probe, default=str)}")
            return 1

        engine = ClearingEngine(database)

        run_id = secrets.token_hex(3).upper()
        head(f"STAGE 2 — participant onboarding (RSA-{args.key_size}) · run {run_id}")
        keys = await seed(engine, args.key_size, run_id)

        validator = await validate(engine, keys, run_id)

        head("STAGE 4 — ledger reconciliation")
        report = await engine.reconcile()
        for label, key in (
            ("value conserved (debits + credits = 0)", "conserved"),
            ("hash chain intact", "chain_intact"),
            ("balances agree with the journal", "balances_agree"),
        ):
            mark = ok("PASS") if report[key] else bad("FAIL")
            print(f"  {mark}  {label}")
        if not report["healthy"]:
            validator.failed.append(f"reconciliation: {report}")

        head("STAGE 5 — final position")
        stats = await engine.statistics()
        for base, bic, currency, opening in ACCOUNTS:
            identifier = account_id(base, run_id)
            account = await database.get_account(identifier)
            assert account is not None
            delta = account.balance_minor - opening
            arrow = "▲" if delta > 0 else ("▼" if delta < 0 else "·")
            print(
                f"  {identifier:33s} {bic}  "
                f"{account.balance:>16,.2f} {currency}  "
                f"{arrow} {from_minor(abs(delta), currency):>14,.2f}"
            )
        print()
        print(f"  payments journalled : {stats['total']}")
        for status, count in stats["by_status"].items():
            if count:
                print(f"    {status:20s} {count}")
        print(f"  settled value       : {from_minor(stats['settled_value_minor'], 'EUR'):,.2f} EUR")

        head("RESULT")
        total = validator.passed + len(validator.failed)
        if validator.failed:
            print(f"  {bad(f'{len(validator.failed)} of {total} checks FAILED')}")
            for failure in validator.failed:
                print(f"    {bad('✗')} {failure}")
        else:
            print(f"  {ok(f'All {total} runtime checks passed. Ledger reconciled. Hub is healthy.')}")

        if args.json:
            print(
                json.dumps(
                    {
                        "schema_version": version,
                        "checks_passed": validator.passed,
                        "checks_failed": validator.failed,
                        "reconciliation": report,
                        "statistics": stats,
                    },
                    indent=2,
                    default=str,
                )
            )

        return 1 if validator.failed else 0

    finally:
        # Must run: aiosqlite worker threads are marked daemon as a backstop,
        # but an unclosed pool skips the WAL checkpoint on the way out.
        await database.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
