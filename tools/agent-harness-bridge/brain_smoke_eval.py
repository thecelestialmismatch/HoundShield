#!/usr/bin/env python3
"""HoundShield Brain AI — demo-critical answer regression eval.

A dependency-free (stdlib only) evaluation harness in the spirit of AgentHarness:
it POSTs the questions that MUST work in any demo to the Brain AI API and checks the
keyless answers contain the expected substance. No GPU, no API keys, no model serving
required — these answers are served by the local FAQ layer (lib/brain-ai/faq.ts).

Usage:
    python3 brain_smoke_eval.py                                   # http://localhost:3000
    python3 brain_smoke_eval.py --base-url https://www.houndshield.com
    python3 brain_smoke_eval.py --json                            # machine-readable output

Exit code 0 = all demo-critical answers pass; non-zero = a regression. Wire into CI.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

# (question, [substrings that must appear, case-insensitive, ANY-of within a group])
# Each expectation group is a list of acceptable phrasings; all groups must be satisfied.
CASES: list[tuple[str, list[list[str]]]] = [
    ("Who are you?", [["brain ai"], ["houndshield"]]),
    ("What is HoundShield?", [["firewall", "compliance", "local"]]),
    ("How much does HoundShield cost?", [["$199", "199"], ["pro", "growth", "enterprise"]]),
    ("What is a DFARS 7012 spill?", [["dfars", "7012"], ["cui"]]),
    ("Hello", [["brain ai", "houndshield", "help"]]),
]

TIMEOUT_S = 20


def ask(base_url: str, question: str) -> str:
    """POST {question} to /api/brain/query and return the answer text."""
    url = base_url.rstrip("/") + "/api/brain/query"
    payload = json.dumps({"question": question}).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    # Response envelope: { success, data }. `data` may be a string or an object.
    data = body.get("data", body)
    if isinstance(data, dict):
        return str(data.get("answer") or data.get("text") or json.dumps(data))
    return str(data)


def check(answer: str, groups: list[list[str]]) -> list[str]:
    """Return the list of expectation groups that FAILED (none satisfied)."""
    low = answer.lower()
    failures: list[str] = []
    for group in groups:
        if not any(token.lower() in low for token in group):
            failures.append(" / ".join(group))
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="HoundShield Brain AI regression eval")
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args()

    results = []
    passed = 0
    for question, groups in CASES:
        try:
            answer = ask(args.base_url, question)
            failures = check(answer, groups)
            ok = not failures
        except (urllib.error.URLError, TimeoutError, ValueError) as err:
            answer, failures, ok = f"<error: {err}>", ["request failed"], False
        passed += int(ok)
        results.append({"question": question, "ok": ok, "missing": failures, "answer": answer[:300]})

    if args.json:
        print(json.dumps({"passed": passed, "total": len(CASES), "results": results}, indent=2))
    else:
        for r in results:
            mark = "PASS" if r["ok"] else "FAIL"
            print(f"[{mark}] {r['question']}")
            if not r["ok"]:
                print(f"        missing: {r['missing']}")
                print(f"        got: {r['answer']}")
        print(f"\n{passed}/{len(CASES)} demo-critical Brain answers passed.")

    return 0 if passed == len(CASES) else 1


if __name__ == "__main__":
    sys.exit(main())
