# HoundShield — 12-Month Roadmap

**Written 2026-07-28.** Every number here was verified against the live site, the test
suite, or a primary source. Where something is unknown, it says unknown.

---

## The situation in five lines

- The **product works**: 1,531 passing tests, 61 proxy tests, scan latency **p99 0.492ms**
  against a 10ms budget, a working NIST-mapped PDF generator.
- **Nobody can pay you**: `/api/health` reports `payments: malformed_key`.
- **Nobody can install it**: `houndshield/proxy:latest` was never published.
- **The deadline you were selling against is gone**: DoD suspended CMMC Phase 2 on
  **2026-07-13**.
- **Zero customers, zero partners, zero interviews.** That is the actual problem.

---

## The strategic reset

The old pitch was *"get C3PAO-ready before 10 November."* That deadline no longer exists.
Two things survived the suspension, and they are enough:

1. **The obligation didn't move.** DFARS 252.204-7012, the 110 NIST 800-171 Rev 2
   controls, and annual SPRS self-attestation all remain in force. Only the third-party
   *certificate* was paused.
2. **The liability got sharper.** With no assessor in the loop, the SPRS score is the
   contractor's own representation to the government — and DOJ has settled **15 False
   Claims Act cases** under the Civil Cyber-Fraud Initiative, more than half in FY2025.
   **MORSECORP paid $4.6M** for an inflated score; **LOGZONE paid $507,144** for
   certifying a perfect 110 with controls unimplemented.

**And the better market never depended on a deadline at all.** Netskope Threat Labs 2025:
**89%** of healthcare genAI policy violations involve regulated data, against a **31%**
cross-industry average, with **43%** of healthcare workers using personal genAI accounts
at work. No FedRAMP blocker, no government timetable, faster cycle.

**So: healthcare first, defense second (re-messaged for FCA), and stop selling deadlines.**

---

## Hard launch date: **Monday 15 September 2026**

Chosen deliberately — the DoD 60-day review concludes around **11 September**, so you
launch knowing whether defense is alive. It also replaces the old 1 September kill date,
which was set nine days too early to be an informed decision.

**Must be true before that date:**
- [ ] `/api/health` reads `payments: connected` and `payments_webhook: configured`
- [ ] `docker pull houndshield/proxy:latest` works
- [ ] One price on one page *(done — 2026-07-28)*
- [ ] Proxy tests green *(done — 61 passing)*
- [ ] **≥3 customers already closed manually**

That last one is the real gate. Launching to nobody is not a launch.

---

## Month by month

| Month | Build | Validate | Money | Success = |
|---|---|---|---|---|
| **Aug 2026** | Fix Stripe (day 1). Publish Docker image. Nothing else. | **30 cold emails → 10 interviews** | **First $499** | ≥10 interviews, ≥1 paid |
| **Sep** | Self-serve install + license keys | Objections → copy | **3 paid** | **LAUNCH 15 Sep** |
| **Oct** | 60-second deploy video | Can anyone install unaided? | 5 paid | 1 install with zero help from you |
| **Nov** | Onboarding polish; ship browser extension | Do they run it twice? | 8 paid | 1 signed MSP partner |
| **Dec** | Hardening; second-report upsell | Will a buyer buy again? | 12 paid / $6K cumulative | ≥2 repeat buyers |
| **Jan 2027** | Subscription tier ($299/mo) — **only now** | Do repeat buyers convert? | First MRR | 5 subs ≈ $1.5K MRR |
| **Feb** | Multi-seat, roles | Team vs solo buyer | $3K MRR | 10 subs |
| **Mar** | SOC 2 Type I begins (~$5–15K) | Does SOC 2 unblock deals? | $5K MRR | SOC 2 underway |
| **Apr** | Partner portal | Do MSPs resell unaided? | $8K MRR | 3 active partners |
| **May** | Scale the winning channel | Which channel has the best CAC? | $12K MRR | CAC < $500 |
| **Jun** | Re-enter defense **if** certification is reinstated; evaluate a static Go binary **only if** an air-gapped buyer demands it | Is CMMC back? | $18K MRR | Explicit defense decision |
| **Jul 2027** | Depends on the above | Annual review | $25K MRR | Fundable or profitably independent |

---

## Revised kill criteria — decide **15 September 2026**

Shut down or pivot hard if **two or more** are true:

1. Fewer than **3 paying customers**
2. **No signed channel partner**
3. Fewer than **10 completed customer interviews**

Criterion 3 is new and it is the one that actually predicts the other two. If you cannot
get ten compliance officers to spend fifteen minutes on the phone, the problem is not the
product.

*(The old criterion "CMMC deadline extended ≥6 months" is retired — it already happened,
in a form worse than an extension: an indefinite suspension. It is priced in.)*

---

## The next 30 days

**Talk to 30 healthcare privacy officers. Close 1 paying customer. Write no new features.**

Everything above is downstream of one unanswered question: *will Rachel pay $499?*
274 commits have assumed yes. Thirty emails will tell you in two weeks.

**Where to find them:** AHIMA and HCCA member directories and local chapters; state
medical association compliance officers; LinkedIn title search (`"Privacy Officer"` +
healthcare, 50–300 employees); regional HIMSS chapters; MSPs and vCISOs already serving
clinics.

**The email is in [OUTREACH-HEALTHCARE.md](./OUTREACH-HEALTHCARE.md).** The ask is a
15-minute interview, not a sale. On every call, ask one question and then stop talking:

> "If this existed today, would you pay $499 for the report?"

**Put the `/demo#snapshot` link in every email.** It lets a privacy officer prove the
local-only claim to themselves in 30 seconds, with no account and no trust required. It
is a better demo than a call.

---

## What not to build

Ranked by how much time it would waste:

1. **The subscription tier.** Not until 3 people have paid $499.
2. **Anything in `/command-center/*`.** 20+ pages for users who do not exist.
3. **A Go rewrite.** The scanner is 20× faster than its own advertised budget. Revisit
   only if a named air-gapped customer refuses Docker — a static binary is a genuinely
   better artifact for a SCIF, and that is the *only* reason it would earn its cost.
4. **SOC 2.** March, and only if a real deal is blocked on it.
5. **A mobile app.** Not before 50 customers.
