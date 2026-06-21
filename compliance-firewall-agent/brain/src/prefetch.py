from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any, Literal

PrefetchSource = Literal["memory", "filesystem", "api", "env"]


@dataclass
class PrefetchEntry:
    key: str
    value: Any
    fetched_at: int
    ttl_ms: int
    source: PrefetchSource


DetectedFramework = Literal["nextjs", "vite", "remix", "unknown"]


@dataclass
class ProjectScanResult:
    root_path: str
    file_count: int
    has_next_config: bool
    has_env_file: bool
    has_supabase_schema: bool
    has_compliance_data: bool
    has_test_suite: bool
    detected_framework: DetectedFramework
    detected_languages: list[str]
    entry_points: list[str]
    scanned_at: int


@dataclass
class KeychainEntry:
    name: str
    present: bool
    masked_value: str
    required_for: str


@dataclass
class PrefetchReport:
    entries: list[PrefetchEntry]
    project_scan: ProjectScanResult
    keychain: list[KeychainEntry]
    warmup_duration_ms: int
    ready: bool


_cache: dict[str, PrefetchEntry] = {}


def cache_set(key: str, value: Any, ttl_ms: int = 60_000, source: PrefetchSource = "memory") -> None:
    _cache[key] = PrefetchEntry(key=key, value=value, fetched_at=int(time.time() * 1000), ttl_ms=ttl_ms, source=source)


def cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if not entry:
        return None
    if int(time.time() * 1000) - entry.fetched_at > entry.ttl_ms:
        del _cache[key]
        return None
    return entry.value


def cache_clear() -> None:
    _cache.clear()


def get_cache_snapshot() -> list[PrefetchEntry]:
    return list(_cache.values())


_KEYCHAIN_DEFS: list[tuple[str, str, str]] = [
    ("Supabase URL", "NEXT_PUBLIC_SUPABASE_URL", "database & auth"),
    ("Supabase Anon Key", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "database & auth"),
    ("OpenRouter API Key", "OPENROUTER_API_KEY", "LLM calls"),
    ("Stripe Secret Key", "STRIPE_SECRET_KEY", "billing"),
    ("Stripe Webhook Secret", "STRIPE_WEBHOOK_SECRET", "billing webhooks"),
    ("Resend API Key", "RESEND_API_KEY", "transactional email"),
    ("PostHog Key", "NEXT_PUBLIC_POSTHOG_KEY", "analytics"),
    ("Sentry DSN", "NEXT_PUBLIC_SENTRY_DSN", "error tracking"),
    ("Brain AI Model", "BRAIN_AI_MODEL", "LLM routing"),
]


def keychain_prefetch() -> list[KeychainEntry]:
    result = []
    for name, env_var, required_for in _KEYCHAIN_DEFS:
        raw = os.environ.get(env_var, "")
        present = len(raw) > 0
        masked_value = (raw[:4] + "****" + raw[-2:]) if present else "(not set)"
        result.append(KeychainEntry(name=name, present=present, masked_value=masked_value, required_for=required_for))
    return result


def mdm_raw_read(key: str) -> str | None:
    return os.environ.get(f"BRAIN_MDM_{key.upper()}")


def project_scan(root_path: str = ".") -> ProjectScanResult:
    has_next_config = False
    has_env_file = False
    has_supabase_schema = False
    has_compliance_data = False
    has_test_suite = False
    file_count = 0

    def check(rel: str) -> bool:
        try:
            return os.path.exists(os.path.join(root_path, rel))
        except Exception:
            return False

    try:
        has_next_config = check("next.config.js") or check("next.config.ts")
        has_env_file = check(".env") or check(".env.local")
        has_supabase_schema = check("supabase/schema.sql") or check("supabase/migrations")
        has_compliance_data = check("reference-data") or check("compliance-data")
        has_test_suite = check("__tests__") or check("tests") or check("spec")

        def walk(directory: str, depth: int = 0) -> int:
            if depth > 3:
                return 0
            count = 0
            try:
                for f in os.listdir(directory):
                    if f.startswith(".") or f == "node_modules":
                        continue
                    full = os.path.join(directory, f)
                    if os.path.isdir(full):
                        count += walk(full, depth + 1)
                    else:
                        count += 1
            except Exception:
                pass
            return count

        file_count = walk(root_path)
    except Exception:
        pass

    return ProjectScanResult(
        root_path=root_path,
        file_count=file_count,
        has_next_config=has_next_config,
        has_env_file=has_env_file,
        has_supabase_schema=has_supabase_schema,
        has_compliance_data=has_compliance_data,
        has_test_suite=has_test_suite,
        detected_framework="nextjs" if has_next_config else "unknown",
        detected_languages=["TypeScript", "TSX", "CSS"],
        entry_points=["app/page.tsx", "app/layout.tsx", "app/api/brain-ai/execute/route.ts"],
        scanned_at=int(time.time() * 1000),
    )


async def run_prefetch(root_path: str = ".") -> PrefetchReport:
    start = int(time.time() * 1000)

    keychain = keychain_prefetch()
    project_scan_result = project_scan(root_path)

    cache_set("keychain", keychain, 300_000, "env")
    cache_set("project_scan", project_scan_result, 120_000, "filesystem")

    entries = get_cache_snapshot()
    warmup_duration_ms = int(time.time() * 1000) - start

    core_keys_present = all(
        k.present for k in keychain if k.name in ("Supabase URL", "OpenRouter API Key")
    )

    return PrefetchReport(
        entries=entries,
        project_scan=project_scan_result,
        keychain=keychain,
        warmup_duration_ms=warmup_duration_ms,
        ready=core_keys_present,
    )


def render_prefetch_report(report: PrefetchReport) -> str:
    lines = [
        "## Brain AI Prefetch Report",
        f"**Warmup:** {report.warmup_duration_ms}ms · **Ready:** {'✅' if report.ready else '⚠️'}",
        "",
        "### Keychain",
    ]
    for k in report.keychain:
        icon = "✅" if k.present else "❌"
        lines.append(f"- {icon} **{k.name}** — {k.required_for} ({k.masked_value})")
    lines.append("")
    lines.append("### Project Scan")
    s = report.project_scan
    lines.append(f"- Framework: **{s.detected_framework}**")
    lines.append(f"- Files: {s.file_count}")
    lines.append(f"- Next config: {'✅' if s.has_next_config else '❌'}")
    lines.append(f"- Env file: {'✅' if s.has_env_file else '❌'}")
    lines.append(f"- Tests: {'✅' if s.has_test_suite else '❌'}")
    return "\n".join(lines)
