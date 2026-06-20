# Tools / IDEs / Apps / Skills — recommended stack for HoundShield

> What to actually use. Lean, aligned to a launch + Brain AI, not a kitchen sink.

## Cost control (do this first — you pasted the guide)
- **ccusage** — `npx ccusage@latest`. Find your biggest token line item, route cheap edits to Sonnet/Haiku, batch heavy work into one 5-hour block. Pair with the free-LLM-API repos below for Brain AI fallbacks.

## IDEs / editors
- **VS Code** (+ this Claude Code CLI) — primary. Already in use.
- **Cursor** — optional, only if you want inline multi-file edits; not required.

## Skills already available this session (use, don't reinstall)
- `frontend-design`, `ui-ux-pro-max`, `seo`, `seo-technical`, `seo-meta-optimizer`,
  `seo-schema`, `schema-markup`, `geo-fundamentals`, `vercel-deployment`,
  `supabase`, `stripe-integration`, `payment-integration`, `webapp-testing`.

## Skills worth adding (from the repo list)
- `qwoted-seo-backlinks-skill` → backlinks for the SEO ask
- `taste-skill` → visual QA heuristic
- `design-motion-principles` → motion reference

## Apps / services (already wired — just need keys/config)
| Service | Status | Action |
|---------|--------|--------|
| Vercel | deploys from `main` | set env vars (see AUDIT report) |
| Supabase | auth + DB wired | set 3 keys + push migrations 003/004 |
| Stripe | checkout + webhook wired | set price IDs + webhook secret |
| OpenRouter | powers Brain AI/chat/agents | set `OPENROUTER_API_KEY` |
| Resend | email | configured |
| PostHog | analytics | active |
| Sentry | errors | active |

## Brain AI model strategy (cost-aware)
- Primary: OpenRouter (`OPENROUTER_API_KEY`), model pinned via `BRAIN_AI_MODEL`.
- Demo-critical answers already work **keyless** via the FAQ layer (`lib/brain-ai/faq.ts`) — keep that.
- Fallback chain: mine `free-llm-api-resources` / `freellmapi` for free models when OpenRouter quota is hit.
- **NVIDIA NIM** is *not wired yet* — see AUDIT report "NVIDIA" note for the 1-file change to add it.
