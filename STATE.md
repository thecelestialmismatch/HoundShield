# Kaelus State
updated: 2026-04-19
beachhead: CMMC L2 defense subcontractors (50–500 employees)
week: 1 (cold-email pipeline open — sprint started 2026-04-19)
mrr_usd: 0
pilots:
  installed: 0
  active_weekly: 0
  paid: 0
next_kill_gate:
  date: 2026-06-03
  criteria: 45 days from first cold-email send — if <2 active pilots or $0 paid pilot revenue, pivot to healthcare PHI firewall
top_3_assumptions_under_test:
  - A CMMC-L2-bound DoD sub (50–500 emp) will reply to cold email and book a discovery call within 7 days
  - The pilot will install the Go proxy on a real workstation and generate a CMMC evidence report within 21 days
  - At least 1 pilot will sign a paid contract of $5K+ within 45 days of first send
blockers:
  - Go proxy (local-only, on-prem) does not exist yet — current product is cloud-based. Must scaffold before first pilot install. Owner: founder. Day 0.
  - Cold emails not yet sent — batch 1 prospect list requires LinkedIn verification of contacts. Owner: founder. Est. 2h.
last_checkpoint_summary: |
  First Beast session. Cold-email batch 1 drafted and committed to advisory/cold-outreach-batch-1.md.
  Contains: SAM.gov + LinkedIn Sales Nav methodology, 10 named targets with personalized emails,
  20 template slots, A/B subject lines, discovery call script, qualification criteria, tracking CSV.
  Critical architecture gap identified and logged in DECISIONS.md: current product is cloud-proxied
  (compliance-firewall-agent routes prompts through kaelus.online). Go proxy MVP required before
  first CMMC pilot install. Next engineering P0: scaffold Go proxy repo.
validation_doc: KAELUS-RUTHLESS-VALIDATION.md (2026-04-17)
beast_prompt: KAELUS-BEAST-PROMPT.md (v1.0)
internalized: true
