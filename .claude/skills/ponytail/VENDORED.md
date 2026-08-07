# Vendored: ponytail

Upstream: https://github.com/DietrichGebert/ponytail
Commit:   16f29800fd2681bdf24f3eb4ccffe38be3baec6b
Vendored: 2026-08-07
License:  MIT (see LICENSE in this directory)

`SKILL.md` files are copied verbatim — do not edit them here. To update, re-copy
from upstream and bump the commit above, so local drift never masquerades as upstream.

Installed: `ponytail` (the ladder, default mode `full`) · `ponytail-review`
(over-engineering review of a diff) · `ponytail-audit` (same, repo-wide) ·
`ponytail-debt` (harvests every `ponytail:` comment into a ledger).

Not installed: `ponytail-gain` (a scoreboard of the vendor's own benchmark medians —
this repo does not publish metrics it cannot verify) and `ponytail-help` (reference
card; the modes are documented in the houndshield skill's Mode C).

This repo already uses the `ponytail:` comment convention that rule 7 of the skill
defines — see `proxy/ooda/loop.ts`, `lib/audit/seed-anchor.ts` and
`app/api/dashboard/overview/route.ts`. Run `/ponytail-debt` to list them.
