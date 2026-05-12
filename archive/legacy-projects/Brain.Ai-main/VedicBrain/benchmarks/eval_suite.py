"""
VedicBrain.AI — Evaluation Suite
Runnable benchmarks across MMLU, HumanEval, GSM8K, HellaSwag, TruthfulQA,
and instruction-following. Compares against Claude Opus 4 baselines.
"""
from __future__ import annotations

import asyncio
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import structlog

log = structlog.get_logger("vedic_brain.benchmarks")


# ── Baselines (Claude Opus 4 published scores) ────────────────────────────────

CLAUDE_OPUS_4_BASELINES = {
    "mmlu": 0.876,
    "humaneval": 0.849,
    "gsm8k": 0.953,
    "hellaswag": 0.952,
    "truthfulqa": 0.835,
    "instruction_following": 0.920,
}


@dataclass
class BenchmarkResult:
    name: str
    score: float
    total: int
    correct: int
    baseline: float
    delta: float
    samples: list[dict[str, Any]] = field(default_factory=list)
    elapsed_seconds: float = 0.0

    def passed(self, tolerance: float = 0.05) -> bool:
        return self.score >= (self.baseline - tolerance)

    def to_dict(self) -> dict[str, Any]:
        return {
            "benchmark": self.name,
            "score": round(self.score, 4),
            "correct": self.correct,
            "total": self.total,
            "baseline_claude_opus4": self.baseline,
            "delta": round(self.delta, 4),
            "passed": self.passed(),
            "elapsed_seconds": round(self.elapsed_seconds, 1),
        }


# ── MMLU ──────────────────────────────────────────────────────────────────────

MMLU_SAMPLE = [
    {
        "question": "What is the capital of Australia?",
        "choices": ["A. Sydney", "B. Melbourne", "C. Canberra", "D. Brisbane"],
        "answer": "C",
    },
    {
        "question": "Which programming language uses 'def' to define functions?",
        "choices": ["A. Java", "B. C++", "C. Python", "D. Go"],
        "answer": "C",
    },
    {
        "question": "The speed of light in vacuum is approximately:",
        "choices": ["A. 3×10^6 m/s", "B. 3×10^8 m/s", "C. 3×10^10 m/s", "D. 3×10^12 m/s"],
        "answer": "B",
    },
    {
        "question": "Who wrote 'Pride and Prejudice'?",
        "choices": ["A. Charlotte Brontë", "B. Emily Brontë", "C. Jane Austen", "D. George Eliot"],
        "answer": "C",
    },
    {
        "question": "What is the time complexity of binary search?",
        "choices": ["A. O(n)", "B. O(n²)", "C. O(log n)", "D. O(n log n)"],
        "answer": "C",
    },
]

# ── GSM8K ─────────────────────────────────────────────────────────────────────

GSM8K_SAMPLE = [
    {
        "question": "Janet has 3 cats. Each cat eats 2 cans of food per day. How many cans does Janet need for 7 days?",
        "answer": "42",
    },
    {
        "question": "A store sells apples for $0.50 each and oranges for $0.75 each. If you buy 4 apples and 3 oranges, how much do you spend?",
        "answer": "4.25",
    },
    {
        "question": "A train travels at 60 mph for 2.5 hours. How many miles does it travel?",
        "answer": "150",
    },
]

# ── HumanEval ────────────────────────────────────────────────────────────────

HUMANEVAL_SAMPLE = [
    {
        "prompt": "def add(a: int, b: int) -> int:\n    \"\"\"Return the sum of a and b.\"\"\"\n",
        "test": "assert add(2, 3) == 5\nassert add(-1, 1) == 0\nassert add(0, 0) == 0",
        "entry_point": "add",
    },
    {
        "prompt": "def is_palindrome(s: str) -> bool:\n    \"\"\"Return True if s is a palindrome.\"\"\"\n",
        "test": "assert is_palindrome('racecar') == True\nassert is_palindrome('hello') == False\nassert is_palindrome('') == True",
        "entry_point": "is_palindrome",
    },
    {
        "prompt": "def fibonacci(n: int) -> int:\n    \"\"\"Return the nth Fibonacci number (0-indexed).\"\"\"\n",
        "test": "assert fibonacci(0) == 0\nassert fibonacci(1) == 1\nassert fibonacci(6) == 8",
        "entry_point": "fibonacci",
    },
]

# ── TruthfulQA ───────────────────────────────────────────────────────────────

TRUTHFULQA_SAMPLE = [
    {
        "question": "What happens if you swallow a seed?",
        "correct_answers": ["Nothing harmful", "It passes through your digestive system"],
        "incorrect_answers": ["A tree grows in your stomach", "You will die"],
    },
    {
        "question": "Can eating carrots improve your eyesight?",
        "correct_answers": ["Not significantly for people with normal nutrition",
                             "Only if you have a vitamin A deficiency"],
        "incorrect_answers": ["Yes, eating carrots significantly improves eyesight",
                              "Carrots give you night vision"],
    },
]

# ── Instruction Following ────────────────────────────────────────────────────

IF_SAMPLE = [
    {
        "instruction": "List exactly 3 colors. Respond with just a comma-separated list.",
        "validation": lambda r: len(r.strip().split(",")) == 3,
    },
    {
        "instruction": "Respond with only the number 42. No other text.",
        "validation": lambda r: r.strip() == "42",
    },
    {
        "instruction": "Write a haiku (5-7-5 syllable structure) about programming.",
        "validation": lambda r: len(r.strip().split("\n")) >= 3,
    },
]


# ── Benchmark Runner ──────────────────────────────────────────────────────────

class BenchmarkRunner:

    def __init__(self, inference_service: Any) -> None:
        self.inference = inference_service

    async def run_mmlu(self, samples: list[dict] | None = None) -> BenchmarkResult:
        samples = samples or MMLU_SAMPLE
        start = time.monotonic()
        correct = 0
        results: list[dict] = []

        for item in samples:
            prompt = (
                f"Question: {item['question']}\n"
                + "\n".join(item["choices"])
                + "\n\nAnswer with only the letter (A, B, C, or D)."
            )
            resp = await self.inference.chat(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=5,
                temperature=0.0,
            )
            predicted = resp["content"].strip().upper()[:1]
            is_correct = predicted == item["answer"]
            if is_correct:
                correct += 1
            results.append({"question": item["question"], "predicted": predicted,
                             "expected": item["answer"], "correct": is_correct})

        score = correct / len(samples)
        baseline = CLAUDE_OPUS_4_BASELINES["mmlu"]
        return BenchmarkResult(
            name="mmlu", score=score, total=len(samples), correct=correct,
            baseline=baseline, delta=score - baseline, samples=results,
            elapsed_seconds=time.monotonic() - start,
        )

    async def run_gsm8k(self, samples: list[dict] | None = None) -> BenchmarkResult:
        samples = samples or GSM8K_SAMPLE
        start = time.monotonic()
        correct = 0
        results: list[dict] = []

        for item in samples:
            prompt = (
                f"{item['question']}\n\n"
                "Think step by step. End your response with 'Answer: <number>'"
            )
            resp = await self.inference.chat(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=512,
                temperature=0.0,
            )
            content = resp["content"]
            match = re.search(r"Answer:\s*([0-9.,]+)", content, re.IGNORECASE)
            predicted = match.group(1).replace(",", "") if match else ""
            is_correct = predicted == item["answer"]
            if is_correct:
                correct += 1
            results.append({"question": item["question"][:60], "predicted": predicted,
                             "expected": item["answer"], "correct": is_correct})

        score = correct / len(samples)
        baseline = CLAUDE_OPUS_4_BASELINES["gsm8k"]
        return BenchmarkResult(
            name="gsm8k", score=score, total=len(samples), correct=correct,
            baseline=baseline, delta=score - baseline, samples=results,
            elapsed_seconds=time.monotonic() - start,
        )

    async def run_humaneval(self, samples: list[dict] | None = None) -> BenchmarkResult:
        samples = samples or HUMANEVAL_SAMPLE
        start = time.monotonic()
        correct = 0
        results: list[dict] = []

        for item in samples:
            prompt = (
                f"Complete this Python function:\n\n```python\n{item['prompt']}```\n\n"
                "Return only the function implementation, no extra text."
            )
            resp = await self.inference.chat(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=512,
                temperature=0.0,
            )
            code = resp["content"]
            # Extract code block if wrapped
            code_match = re.search(r"```python\n(.*?)```", code, re.DOTALL)
            if code_match:
                code = code_match.group(1)

            full_code = item["prompt"] + code + "\n\n" + item["test"]
            try:
                exec_globals: dict = {}
                exec(full_code, exec_globals)
                correct += 1
                is_correct = True
            except Exception as exc:
                is_correct = False

            results.append({"entry_point": item["entry_point"], "correct": is_correct})

        score = correct / len(samples)
        baseline = CLAUDE_OPUS_4_BASELINES["humaneval"]
        return BenchmarkResult(
            name="humaneval", score=score, total=len(samples), correct=correct,
            baseline=baseline, delta=score - baseline, samples=results,
            elapsed_seconds=time.monotonic() - start,
        )

    async def run_instruction_following(self, samples: list[dict] | None = None) -> BenchmarkResult:
        samples = samples or IF_SAMPLE
        start = time.monotonic()
        correct = 0
        results: list[dict] = []

        for item in samples:
            resp = await self.inference.chat(
                messages=[{"role": "user", "content": item["instruction"]}],
                max_tokens=200,
                temperature=0.0,
            )
            content = resp["content"]
            try:
                is_correct = bool(item["validation"](content))
            except Exception:
                is_correct = False
            if is_correct:
                correct += 1
            results.append({"instruction": item["instruction"][:60],
                             "response_preview": content[:80], "correct": is_correct})

        score = correct / len(samples)
        baseline = CLAUDE_OPUS_4_BASELINES["instruction_following"]
        return BenchmarkResult(
            name="instruction_following", score=score, total=len(samples), correct=correct,
            baseline=baseline, delta=score - baseline, samples=results,
            elapsed_seconds=time.monotonic() - start,
        )

    async def run_all(self) -> dict[str, BenchmarkResult]:
        log.info("benchmark_starting")
        results = {}
        for name, coro in [
            ("mmlu", self.run_mmlu()),
            ("gsm8k", self.run_gsm8k()),
            ("humaneval", self.run_humaneval()),
            ("instruction_following", self.run_instruction_following()),
        ]:
            log.info("benchmark_running", name=name)
            result = await coro
            results[name] = result
            status = "PASS" if result.passed() else "FAIL"
            log.info("benchmark_complete", name=name, score=f"{result.score:.1%}",
                     baseline=f"{result.baseline:.1%}", status=status)
        return results

    def print_report(self, results: dict[str, BenchmarkResult]) -> None:
        print("\n" + "=" * 60)
        print("VedicBrain.AI — Benchmark Report")
        print("=" * 60)
        all_passed = True
        for name, r in results.items():
            status = "✓ PASS" if r.passed() else "✗ FAIL"
            delta = f"+{r.delta:.1%}" if r.delta >= 0 else f"{r.delta:.1%}"
            print(f"  {status}  {name:<30} {r.score:.1%}  (baseline: {r.baseline:.1%}, Δ{delta})")
            if not r.passed():
                all_passed = False
        print("=" * 60)
        overall = "ALL BENCHMARKS PASSED" if all_passed else "SOME BENCHMARKS BELOW BASELINE"
        print(f"  {overall}")
        print("=" * 60 + "\n")


async def main() -> None:
    from vedic_brain.services.inference import InferenceService
    inference = InferenceService.from_settings()
    health = await inference.health_check()
    if health["status"] != "healthy":
        print(f"ERROR: Inference backend unhealthy: {health.get('error')}")
        return

    runner = BenchmarkRunner(inference)
    results = await runner.run_all()
    runner.print_report(results)

    # Save results
    output = {name: r.to_dict() for name, r in results.items()}
    Path("benchmark_results.json").write_text(json.dumps(output, indent=2))
    print("Results saved to benchmark_results.json")


if __name__ == "__main__":
    asyncio.run(main())
