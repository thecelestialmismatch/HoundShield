# Kaelus Decisions Log
Append-only. Every material direction change gets an entry.

## 2026-03-31 — Kill the $30/mo individual tier
Decision: Discontinue the $30/month individual-developer tier as a revenue engine.
Why: Math caps at ~$2,700 MRR under optimistic assumptions; solo founder cannot acquire and retain 333 individuals with $0 marketing budget.
Reversible? Yes, low cost — can be re-introduced as a lead-gen tier if bottom-up funnel proves viable.
Evidence: /sessions/confident-vigilant-franklin/mnt/.auto-memory/project_revenue_strategy.md

## 2026-04-17 — Narrow to CMMC L2 defense-subcontractor beachhead
Decision: Pivot from "multi-compliance AI DLP for SMBs + enterprises + devs" to "CMMC Level 2 AI Compliance Firewall for defense subcontractors (50–500 employees)."
Why: Only positioning where local-only scanning is a hard buying requirement, regulation creates deadline urgency, incumbents are under-invested, and pricing supports $10K–$50K annual contracts.
Reversible? Yes — architecture stays; segment / pricing / evidence packaging would rebuild. Second-choice pivot is healthcare PHI firewall.
Evidence: KAELUS-RUTHLESS-VALIDATION.md

## 2026-04-19 — Current product is cloud-proxied, not local-only
Decision: The live compliance-firewall-agent routes all prompts through kaelus.online (cloud-based Next.js proxy). The CMMC on-prem pitch requires a local Go proxy binary with no egress — that product does not yet exist. Both architectures can coexist: cloud SaaS for non-CMMC customers, Go proxy MVP as the CMMC pilot product.
Why: Prevents pitching "no prompt leaves the host" using the cloud product, which would be false and disqualifying with any CMMC-aware buyer. Also clarifies that the Go proxy is the actual pilot deliverable, not the web app.
Reversible? N/A — architectural clarification, not a direction change.
Evidence: lib/gateway/stream-proxy.ts (cloud proxy confirmed), BACKLOG.md P0 item "Scaffold Go proxy repo"

## 2026-04-19 — Adopt Beast Prompt v1.0 as operating contract
Decision: All future Kaelus work sessions run under KAELUS-BEAST-PROMPT.md v1.0 — mission-locked system prompt with file-based memory, checkpoint protocol, daily money-making loop, and monthly self-evolution patches.
Why: Solve the cross-session memory problem by structure (state files), enforce token economy, keep every response tied to ARR or ARR-enabling work.
Reversible? Yes — prompt can be bypassed at any time; state files survive independently.
Evidence: KAELUS-BEAST-PROMPT.md

## 2026-05-26 — HERMES compass correction (5-in-1 pivot)
Decision: Pivoted from "$199/mo SaaS-first / Jordan-only / C3PAO channel / 10 customers by June 10" to "$499 one-time gap report / Rachel-first sequence / RPO+MSP channel / 3 paid reports + 1 RPO agreement by June 25."
Why:
  1. 84-day median B2B SaaS cycle made "10 customers in 4 weeks" arithmetically impossible.
  2. $499 PO bypasses procurement; subscription needs MSA review. Faster-to-cash.
  3. C3PAOs are legally prohibited from product endorsement (32 CFR Part 170, CMMC CoPC, ISO 17020 cooling-off). The old channel was always going to refuse.
  4. Vercel hosted endpoint is NOT FedRAMP-authorized — any C3PAO assessor would disqualify the "CUI-safe" claim. Introduced explicit Mode A (Vercel, trial) / Mode B (Docker, CUI-safe) / Mode C (air-gapped) distinction.
  5. Healthcare buyers (Rachel) move faster than defense (Jordan) and don't require vendor FedRAMP. Reordered buyer sequence.
Reversible? Pricing and channel can flip back. Architecture mode distinctions are physical facts and cannot be undone without losing FedRAMP-track customers.
Kill criteria added: Sept 1, 2026 — shut down or pivot if ANY TWO of (<5 paid customers / no signed channel partner / CMMC Phase 2 extended ≥6 months).
Evidence: `/Users/yantr/.claude/plans/update-identity-you-are-breezy-orbit.md` + `memory/decisions.md` 2026-05-26 entry.
