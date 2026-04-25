# Hound Shield — Startup Validation Report
## Paul Graham-Style Pressure Test and Full Validation Pipeline

*Grounded in a complete read of the codebase: proxy/scanner.ts, proxy/patterns/index.ts,
proxy/server.ts, docs/KAELUS-PRD.md, ROADMAP.md, advisory/architecture.md,
brain/research.md, and the full Next.js application structure.*

*Written: 2026-04-26*

---

## Phase 1: Pressure Test

### The Single Core Assumption

**Hypothesis:** Defense contractors subject to CMMC Level 2 will pay a recurring monthly fee
for a local-only AI prompt scanner because they cannot use any cloud-based alternative without
creating a secondary CUI exposure event, and because CMMC enforcement deadlines create a
mandatory compliance timeline that functions as a forcing function for purchase.

This is a testable, falsifiable, specific hypothesis. If it is wrong, the company dies. If it is
right, there is a legally-mandated market of roughly 80,000 contractors who need this product.
No other framing of this business matters until this hypothesis is tested.

---

### Three Most Likely Failure Modes

**Failure Mode 1: The "Policy Memo" Defense (Severity: Existential)**

Defense contractors have survived CMMC non-compliance for years by claiming intent rather than
demonstrating technical controls. The specific risk for Hound Shield is that C3PAO assessors
accept a written AI usage policy ("employees may not paste CUI into ChatGPT") as satisfying
AC.L2-3.1.3 rather than requiring a technical enforcement mechanism.

What makes this unique to Hound Shield: the codebase already contains the counter-argument
(proxy/server.ts returns X-HoundShield headers proving technical enforcement, and ROADMAP.md
articulates the objection-handling script precisely). But the risk is that the market accepts
the cheaper workaround. If assessors accept policy memos, no technical enforcement product
exists. This is not a generic "competition" problem. It is a regulatory interpretation problem
that cannot be resolved by product iteration.

The observable evidence to watch: if C3PAO practitioners in r/CMMC are asking "do I need
technical controls for AI tools or is policy sufficient?" the answer to that question determines
the size of the addressable market. Not the number of contractors. Not the pricing. The
regulatory interpretation.

**Failure Mode 2: IT Friction Blocks the Sale at the Last Mile (Severity: High)**

The product requires a URL change in every AI tool's environment config. The ROADMAP.md
correctly identifies this as a single-step deployment. What it underestimates is the
organizational dynamics at a 50-200 person defense contractor: the person who feels the
CMMC pain (compliance officer or CISO) is not the person who controls environment variables
on employee laptops (IT administrator). The sale completes with the compliance officer. The
deployment depends on IT. These two people often do not communicate efficiently. The product
sits on the shelf between them.

What makes this unique to Hound Shield: cloud-based DLP tools like Nightfall deploy at the
network layer (DNS, firewall rules, browser extension), not at the application layer. An
IT admin can deploy Nightfall company-wide in one change. Hound Shield requires per-tool,
per-employee environment variable changes unless the customer has a centralized AI API
gateway, which 80% of small defense contractors do not. The Docker deployment model
(proxy/Dockerfile exists, docker-compose.yml exists, install.sh is incomplete) partially
addresses this, but install.sh is marked incomplete in tasks/todo.md.

**Failure Mode 3: Scanner False Positive Rate Destroys Trust (Severity: High)**

The scanner uses regex patterns. The patterns are well-crafted (CAGE code detection, DoD
contract number format matching, CUI marking detection are all specific). But email addresses
and phone numbers trigger LOW/QUARANTINE at every scan. In a defense contracting firm where
employees share phone numbers, email addresses, and internal IP ranges constantly, the
quarantine queue will fill with noise within hours of deployment. One false positive that
blocks a legitimate prompt costs the user their workflow. Three false positives generates a
ticket to IT to turn it off. Five generates a meeting where leadership decides to uninstall.

What makes this unique to Hound Shield: the local-only architecture means the vendor cannot
tune patterns based on aggregate behavioral data across customers, which is exactly how
Nightfall and Strac improve precision. Every Hound Shield customer gets the same static
regex set. The codebase has no mechanism for per-organization pattern tuning (the PRD flags
custom patterns as a planned feature). The LRU cache (scanner.ts lines 18-51) mitigates
repeat identical prompts but not first-occurrence false positives.

---

### Vitamin or Painkiller

Painkiller. Specifically, the compliance officer at a contractor facing CMMC Phase 2 enforcement
(November 10, 2026) does not evaluate this product as a convenience. They evaluate it as
insurance against contract loss. A DoD contract worth $2 million to a 75-person shop cannot
be lost because an employee pasted a contract number into ChatGPT. The ROADMAP.md identifies
C3PAO assessments at $30,000-$150,000 per audit cycle. Against that reference price, $199/month
is not a budget conversation. It is a rounding error in the compliance budget.

What the painkiller verdict means for customer acquisition: painkiller products sell on fear,
not aspiration. The sales motion is not "imagine what you could do with this" but "imagine
what happens to you if you do not have this." The outreach script in ROADMAP.md is correctly
calibrated to this. Every email template leads with contract loss risk, not product features.
This is right.

What it means for pricing: painkiller products in regulatory verticals tolerate price increases
on tier expansions without significant churn. The $199 Pro to $499 Growth jump is achievable.
The $999 Enterprise tier is achievable for multi-site contractors. The $2,499 Agency tier for
C3PAO resellers is defensible because C3PAOs markup technology to their clients as part of
assessment packages.

What it means for market urgency: the forcing function is real and has a specific date. CMMC
Phase 2 enforcement on November 10, 2026 creates a hard deadline. Products that prevent
regulatory failure benefit from deadline-driven purchasing. The pipeline of prospects who
have not yet bought but will eventually need to buy compresses into the 6 months before the
enforcement date. This creates a natural spike in demand in mid-2026 that Hound Shield is
positioned to capture if it has a functioning product and a sales motion in place now.

---

### Founder-Market Fit Assessment

The codebase reveals genuine technical depth in the right areas. The pattern registry
(proxy/patterns/index.ts) correctly implements CAGE code detection, DoD contract number
format validation, ITAR terminology matching, SF-86 references, NIPRNet/SIPRNet identifiers,
and DD form numbers with proper NIST 800-171 control citations. This is not generic DLP
boilerplate. Someone read the CMMC control families and mapped them to specific detectable
patterns. The architectural decisions document (advisory/architecture.md) shows ADR-001
through ADR-008 are thoughtful, non-obvious choices: regex-first for latency, Gemini Flash
concurrent race for context-aware detection, DLQ pattern for SIEM reliability.

The gap is on the go-to-market side, and the ROADMAP.md acknowledges this explicitly:
"Written for a founder who built the product but knows nothing about the defense contracting
ecosystem." This is honest and useful. The technical foundation is strong. The domain
vocabulary has been learned. The sales motion is documented. The outstanding question is
whether the founder has the stomach for the specific kind of sales that this market requires:
high-trust, relationship-based, slow to close, conservative buyers who evaluate based on
demonstrated competence in their regulatory framework, not marketing copy.

Founder-market fit verdict: sufficient for launch, tested by first 5 customer conversations.

---

### Overall Verdict: Build

Not "strong build." Not "obvious winner." Build with urgency and specific conditions.

The technical differentiation is genuine: local-only scanning is not a marketing claim, it is
an architectural property verified in the codebase. The regulatory tailwind is real and
time-bounded. The market is specific and reachable through C3PAO channel partnerships. The
pricing is in the right range for the buyer's reference frame.

The risks are real but not fatal: false positive rate must be measured before launch, install
friction must be tested on a clean Windows machine, and the policy-vs-technical-control
regulatory interpretation question must be validated in first 10 customer conversations. If
assessors accept policy memos, the TAM shrinks dramatically and a pivot to a different
compliance signal (PDF audit reports for self-attestation, SPRS score calculator) may be
required. But the hypothesis is testable and the cost of testing it is low.

---

## Phase 2: Validate the Real Problem

### The Specific Customer Frustration and When It Occurs

The frustration does not occur when the employee uses ChatGPT. It occurs three to six weeks
later, when the compliance officer or CISO sits down to prepare for a CMMC gap assessment
and realizes they have no documentation of what their employees have been sending to external
AI systems. The moment is specific: they are filling out the SSP (System Security Plan) for
AC.L2-3.1.3 and the control reads "control the flow of CUI in accordance with approved
authorizations." They stare at it. They know their employees use ChatGPT. They do not know
if those employees have ever pasted CUI into it. They have no logs. They have no policy
enforcement. They have nothing to show an auditor.

A secondary trigger: a prime contractor (Raytheon, Northrop, L3Harris) sends a flow-down
compliance requirement to a subcontractor demanding documentation of AI tool CUI controls.
This creates immediate urgency for the subcontractor because prime contractor relationships
are high-value and non-negotiable. A single flow-down email from a prime creates a defined
deadline and a defined scope.

### The Specific Customer

Jordan, IT Security Lead at a 120-person defense electronics subcontractor in Huntsville,
Alabama. The company holds a DFARS 7012 contract clause with a prime. Jordan is responsible
for CMMC compliance but has no dedicated security team. Jordan's team uses GitHub Copilot
for firmware development and ChatGPT for documentation drafts. Jordan suspects some of those
documentation drafts contain contract numbers and possibly CAGE codes. Jordan has no evidence
either way. Jordan is not a security researcher. Jordan is a generalist IT professional who
became the de facto compliance owner because no one else was available.

Jordan's constraint: Jordan cannot ask employees to stop using AI tools because productivity
would drop and the prime contractor does not care about Hound Shield's existence, only about
documentation of controls. Jordan's budget: a few thousand dollars per year on security tools
is normal. Jordan's decision timeline: three to six months before the next assessment or
the next prime flow-down.

### Recommended Beachhead Segment: CMMC Registered Practitioners and C3PAOs as Channel

The direct buyer (Jordan) is reachable but the sales cycle is slow. A better beachhead is the
C3PAO and Registered Practitioner channel. A C3PAO conducting assessments on 30-50 defense
contractors has a unique position: they see Jordan's pain firsthand during every assessment,
they have the trust relationship that makes a tool recommendation credible, and they have
economic incentive to recommend tools that reduce the scope of non-compliance they are being
asked to remediate. One C3PAO referral reaches 30 Jordans simultaneously.

Why C3PAOs first, not direct: cold outreach to individual contractors requires identifying
the Jordan role at each company, which is time-consuming and has low response rates. C3PAOs
self-identify publicly in the CMMC-AB Marketplace, are actively looking for tools to recommend
to clients, and convert channel relationships at higher rates than cold prospect outreach.

### 5 Discovery Questions

1. "Walk me through the last time you had to document AI tool usage as part of a CMMC gap
assessment. What did you find when you looked for records?"

This question forces the customer to recall an actual incident, not speculate about a
hypothetical. It surfaces whether the problem has already manifested as a documented gap or
whether it is a latent risk the customer has not yet confronted.

2. "When you think about employees using ChatGPT or Copilot for work, what worries you most
about what might be in those prompts?"

This surfaces the specific data type the customer is protecting. If they say "contract numbers
and CAGE codes," they understand the CUI risk. If they say "I don't really know," they have
not yet internalized the problem and are not a ready buyer.

3. "How are you currently controlling what goes into AI tools across your team, and how do
you know it's working?"

This reveals current workarounds (acceptable use policy, browser blocks, no controls at all)
and whether the customer has already invested in something that Hound Shield would need to
displace or complement.

4. "If a CMMC assessor asked you right now to show documentation of your AI tool CUI controls,
what would you hand them?"

This is the moment of truth question. It surfaces whether the customer has a gap they know
about, a gap they do not know about, or a partial solution they believe is sufficient. The
answer determines urgency and readiness to buy.

5. "What would need to be true about a tool for you to be comfortable recommending it to a
client who is two months out from their C3PAO assessment?"

Asked to C3PAOs specifically. This surfaces the C3PAO's trust threshold, documentation
requirements, and deal-breaker criteria. It is more valuable than asking about features.

### Explicit Validation Criteria

The problem is real and urgent if customers say any of the following unprompted:
- "We have no logs of what went into ChatGPT."
- "Our assessor asked about AI tools and we had to mark it as an open finding."
- "Our prime sent us a memo about AI tool usage and we don't know what to do with it."
- "We have a policy but no technical control."

The problem is a vitamin if customers say:
- "We just banned AI tools, so it's not an issue."
- "Our assessor didn't ask about AI tools specifically."
- "We use Microsoft Copilot and IT says it's already compliant."

The problem is worth paying for if a customer agrees to start a credit-card-required trial
within two weeks of a first conversation. Anything slower than that indicates insufficient
urgency or an insufficiently tight regulatory deadline.

### Current Workarounds

Yes, customers are cobbling together workarounds. The three most common:

- **Written acceptable use policy** with no enforcement. Cost: zero. Effectiveness: fails CMMC
audit. Adoption: extremely high because it requires no IT work.
- **Microsoft Copilot with M365 E5 data classification** policies. Cost: $57/user/month as
part of M365 E5. Effectiveness: covers Copilot only, not ChatGPT, Claude, or Gemini. Many
contractors are on M365 E3 and do not have data classification enabled.
- **Company-wide ChatGPT ban** with no enforcement mechanism. Same problem as written policy.

The existence of workarounds signals: (a) customers are aware of the problem, (b) they have
already decided the problem is real enough to attempt a solution, and (c) the existing solutions
are inadequate. This is precisely the market condition that favors a purpose-built tool.

What it does NOT signal: that customers are in active pain right now, today, looking for a
solution. Many of them believe their workaround is sufficient. They will learn it is not when
their assessor marks it as an open finding. The sale often happens after the assessment, not
before it.

### Vitamin/Painkiller Verdict (Phase 2 Refinement)

Painkiller for the subset of contractors who have already had a CMMC assessment and received
an open finding on AI tool controls. Vitamin for the much larger set who believe their
written policy is sufficient and have not yet been tested. This distinction matters for
targeting: focus initial outreach on contractors who are post-assessment with open findings,
not pre-assessment. Post-assessment buyers have confirmed pain. Pre-assessment buyers are
speculating about future pain.

Positioning implication: lead with "you already have an open finding on this" rather than
"you might have a problem." Find the buyers who already know they have the problem.

---

## Phase 3: Map the Real Competition

### Current Customer Behavior (The Actual Baseline)

Most defense contractors do nothing technical about AI tool CUI controls. They write a policy.
They tell employees not to paste sensitive data into AI tools. They mark the control as "in
progress" or "not applicable" on their SSP. When the C3PAO assessor arrives, this conversation
either results in an open finding (expensive) or the assessor accepts the policy as sufficient
(which varies by assessor, by assessment type, and by the specific control interpretation).

This is the baseline Hound Shield competes against. Not Nightfall. Not Strac. Not Microsoft
Purview. The primary competitor is inaction plus a Word document.

The implication: Hound Shield does not need to be better than sophisticated enterprise DLP.
It needs to be better than a policy memo. The bar is low in absolute terms but real in practice
because switching from "policy memo" to "any technical tool" requires IT involvement, budget
approval, and vendor trust. These are non-trivial friction points in a 50-200 person
defense contractor.

### Direct Competitors

**Nightfall AI (cloud-based DLP with AI scanning)**
- Advantage: Distribution through enterprise security channels, extensive integrations
(Slack, Google Drive, GitHub), well-funded ($90M+ raised), brand recognition in DLP space.
- Weakness specific to CMMC: processes prompt content on Nightfall's cloud servers. For CMMC
contractors, this means sending CUI to a third-party cloud for scanning, which is functionally
equivalent to sending CUI to ChatGPT from a DFARS 7012 perspective. A C3PAO assessor who
understands this will flag Nightfall itself as a CUI exposure risk.
- Verdict: Nightfall is the competitor that looks like a solution but creates a compliance problem.
Sales conversations should lead with this.

**Strac (DLP for generative AI, cloud-based)**
- Advantage: Purpose-built for generative AI DLP, modern developer-friendly API, good
documentation, active in the AI security space.
- Weakness: Same cloud-processing problem as Nightfall. Also targets primarily developer
and software company buyers, not defense contractors specifically. No CMMC-specific
positioning, no NIST 800-171 control mapping.
- Verdict: More technically similar to Hound Shield than Nightfall, but cloud-based and
not CMMC-focused. Not a direct competitor in the CMMC vertical.

**Microsoft Purview (data classification and DLP)**
- Advantage: Already deployed in most Microsoft shops, native M365 integration, trusted
brand, no procurement friction for existing Microsoft customers.
- Weakness: Covers Microsoft products only (Copilot, Teams, SharePoint). Does not cover
ChatGPT, Claude, Gemini, or GitHub Copilot when accessed through non-Microsoft surfaces.
M365 E5 required for data classification, which most small contractors do not have. Not
local-only. Not CMMC-specific in control mapping.
- Verdict: The most common existing solution and the hardest to displace for Microsoft-heavy
shops. Sales motion should acknowledge it: "Purview covers your Copilot. It doesn't cover
anything else your team uses."

**Forcepoint / Digital Guardian / Symantec DLP (legacy enterprise DLP)**
- Advantage: Deep enterprise relationships, compliance pedigree, existing network DLP that
could theoretically be extended to cover AI traffic.
- Weakness: These are legacy endpoint and network DLP products built for structured data in
files and emails. They have no purpose-built AI prompt interception layer. Deploying them
to cover AI API traffic would require custom integration work costing tens of thousands of
dollars. Completely out of reach for a 50-200 person defense contractor.
- Verdict: Not a realistic competitor in the SMB defense contractor market. May appear in
enterprise deals at 500+ person contractors but is irrelevant to the beachhead.

**Cloudflare AI Gateway (API gateway with logging)**
- Advantage: Simple deployment, zero vendor trust required (Cloudflare is already trusted
infrastructure), low cost, logs all AI API calls.
- Weakness: Does not scan content for CUI. It logs that a request happened, not whether it
contained sensitive data. Cannot generate a compliance report that maps to NIST 800-171 controls.
- Verdict: Superficially competitive (it is a proxy), fundamentally different (no DLP).
Customers using Cloudflare AI Gateway have more operational sophistication but still have a
compliance gap that Hound Shield fills.

### Indirect Competitors

**LangKit / Rebuff / PromptArmor (prompt injection detection)**
- Solve a different problem (adversarial AI inputs) rather than data exfiltration in AI prompts.
No compliance mapping. No audit reports. Not relevant to CMMC buyer.

**Vanta (compliance automation)**
- Relevant to the same buyer but solves a different layer of the compliance problem: Vanta
helps contractors demonstrate and track compliance posture across all controls, not specifically
AI tool controls. Vanta is an evidence collector, not a technical enforcement mechanism. They
could theoretically partner: Vanta collects the evidence, Hound Shield creates the evidence.
- Verdict: Potential distribution partner, not a competitor.

**CrowdStrike Falcon / SentinelOne (endpoint security with DLP modules)**
- Have DLP capabilities but are endpoint-focused and expensive ($25-60/endpoint/month for
full suite). Small contractors cannot afford full endpoint DLP stacks. These products are not
purpose-built for AI prompt interception.

**Prompt injection / jailbreak filters (from OpenAI, Anthropic, Google)**
- These are server-side, controlled by the AI provider, not the customer. They scan for
adversarial inputs to the model, not for customer data leaking out. Fundamentally different
problem.

### The Real Enemy Behavior

If Hound Shield did not exist, the most likely default behavior is: defense contractors adopt
AI tools and accept the risk, believing their written acceptable use policy satisfies the CMMC
control requirement. A smaller percentage bans AI tools entirely and loses the productivity
benefit. An even smaller percentage builds internal solutions (IT-managed proxy with custom
logging). Almost none pay for commercial DLP tools specifically for AI traffic.

The "accept the risk" behavior is dominant for three reasons:
1. The regulatory interpretation of whether a technical control is required is ambiguous and
assessor-dependent.
2. The cost of non-compliance is probabilistic (depends on whether an assessor catches it and
flags it), not certain.
3. Most IT administrators at small defense contractors have 20 other compliance tasks and AI
tool DLP is not the most urgent.

This tells us: urgency is primarily created by assessor behavior, prime contractor flow-downs,
and imminent assessment dates. Hound Shield marketing should be timed to these triggers.

### Hound Shield's Genuine Differentiation

Local-only architecture is a real competitive advantage in this specific market, not because
customers care about privacy in the abstract, but because the alternative is legally problematic.

The argument, verified against the codebase: proxy/server.ts proxies requests to OpenAI,
Anthropic, Google, and OpenRouter. The scanner (proxy/scanner.ts) runs entirely in memory
on the customer's infrastructure. The only outbound calls are: (1) the forwarded request to
the upstream AI provider, which the customer has already authorized, and (2) a metadata
webhook to Hound Shield servers that contains request ID, org ID, action taken, risk level,
pattern name, NIST control, and scan time. Line 134-139 of proxy/server.ts confirms this:
`enqueueEvent` sends metadata, never prompt content. This is verifiable by a technically
literate C3PAO assessor.

For which customers is this a must-have: contractors with DFARS 7012 clauses who handle CUI
categories that are restricted to authorized networks (technical CUI categories under the DoD
CUI registry). This includes contractors working on weapons systems, export-controlled
technology, personnel security information, and intelligence-related data.

For which customers is this a nice-to-have: contractors handling only commercial or
administrative CUI (ITAR-light, personnel records, procurement documents) where the sensitivity
is lower and the regulatory scrutiny is less intense. These customers care about cost and
ease of deployment more than the local-only property.

---

## Phase 4: Pivot Decision

### Verdict: Build

Conditional on executing a specific validation sequence in the first 30 days. This is not
a "build and hope." It is a "build and verify the hypothesis while shipping."

**What must be validated to confirm the problem is real:**
Within 30 days, conduct 15 customer conversations with C3PAOs and Registered Practitioners.
If 8 of 15 say their clients have AI tool CUI controls as an open finding or a known gap, the
problem is confirmed real. If fewer than 5 say this, the market is either unaware of the
problem or has resolved it through means Hound Shield does not understand.

**What would kill the company:**
A formal regulatory guidance from DoD or CMMC-AB stating that written acceptable use policies
satisfy AC.L2-3.1.3 for AI tools, and that technical enforcement mechanisms are not required.
This would eliminate the forced-purchase dynamic. Monitor CMMC-AB guidance documents quarterly.

**The smallest scope of customer validation needed:**
One paying customer from the CMMC space who used the tool before a C3PAO assessment and
received credit for the control. One testimonial that says "my assessor accepted Hound Shield
as satisfying AC.L2-3.1.3" is worth more than 100 prospects on a waitlist.

**What NOT to do during this phase:**
Do not add features. The PRD lists 10 gaps. Only Gap 1 (PDF reports) directly impacts
conversion. Fix that. Leave everything else alone until there is revenue evidence of what
customers actually need.

---

## Phase 5: MVP in 7 Days

### The One Core Assumption to Test

A C3PAO or defense contractor will install a local proxy, route AI traffic through it, and
pay $199/month specifically because it generates a PDF compliance report they can show to
an auditor, and because the local-only architecture satisfies DFARS 7012's prohibition on
sending CUI to third-party cloud services.

This is the one thing. Not "does the scanner work." Not "is the UI pretty." Not "does the
dashboard load fast." The testable event is: a real human in the CMMC ecosystem installs
Hound Shield, triggers a CUI block with a test prompt, downloads the PDF report, and says
"yes, I could show this to my assessor." If that event does not occur in 7 days with at
least one real prospect, the business does not work as currently conceived.

### Minimum Feature Set

**Must work perfectly:**
1. `docker run -e HOUNDSHIELD_LICENSE_KEY=xxx -p 8080:8080 houndshield/proxy` installs and
starts in under 2 minutes on a clean Ubuntu or macOS machine. No errors. No manual fixes.
2. `OPENAI_BASE_URL=http://localhost:8080/v1` routes a real OpenAI API call through the proxy.
3. A test prompt containing "CAGE code: 1A234" triggers a BLOCK response with
X-HoundShield-Risk-Level: CRITICAL in the response header.
4. `GET /v1/events` returns the block event with timestamp, pattern name (CAGE code),
NIST control (AC.L2-3.1.3), and risk level.
5. A PDF (even a minimal one: two pages, plaintext, no charts) downloads from the web
dashboard or from a CLI command showing the block event with the NIST control reference.

**Can be faked or skipped:**
- Multi-user dashboard. Use a shared read-only demo link.
- Supabase production setup. The proxy stores events locally in SQLite (proxy/storage.ts).
That is sufficient for the MVP test.
- Stripe billing. Give the test user a free license key. Billing is not part of the
activation hypothesis.
- SPRS score calculator. Nice to have. Not tested in this week.
- Browser extension. Not needed. The proxy URL change is the deployment method.

**Cannot be faked:**
- The block actually happening. The scan actually running. The NIST control actually correct.
- The PDF actually containing auditor-legible compliance evidence.

### Local-Only Architecture for MVP

The proxy runs as a Docker container on the customer's machine or internal server. No cloud
infrastructure required from Hound Shield's side during the test.

Deployment model:

```
Customer machine (their infrastructure)
  Docker container: houndshield/proxy
    - listens on port 8080
    - scans in-memory, never writes prompt content to disk
    - stores event metadata in local SQLite
    - forwards to upstream AI (OpenAI, Anthropic, etc.)
    - serves local dashboard at http://localhost:8080/dashboard
    - serves audit events at http://localhost:8080/v1/events

Hound Shield infrastructure (minimal)
  - License key validation (hash only, no content)
  - Metadata telemetry (request_id, org_id, action, risk_level, pattern_name, scan_ms)
```

This matches what proxy/server.ts already does. The only thing missing is the PDF export and
the complete install.sh script (confirmed incomplete in tasks/todo.md).

### Test Criteria: What Proves the Assumption True

**Quantitative:**
- At least 1 C3PAO or defense contractor installs the proxy on their own machine without
assistance from Hound Shield.
- That person triggers at least one block event with a test prompt.
- That person downloads or receives a PDF report.
- That person says, in writing or verbally: "I could present this to an auditor" or equivalent.

**Qualitative:**
- At least 3 of 5 prospects who see the demo ask about pricing unprompted.
- No prospect raises the local-only claim as something they do not believe. If they say
"prove it doesn't phone home," that is evidence the claim needs to be more demonstrable,
not that the product does not work.

**What failure looks like:**
- The person cannot install it in 30 minutes on a Windows machine.
- The person installs it but cannot trigger a block.
- The person triggers a block but the PDF is not auditor-legible.
- The person says "my assessor wouldn't care about this."

If any failure mode occurs, diagnose the specific friction before moving on.

### Day-by-Day Launch Plan

**Day 1 (Monday): Fix the install path.**

Current state: `proxy/install.sh` is incomplete (confirmed in tasks/todo.md). The Docker
container and compose file exist. The install must work end-to-end.

Tasks:
- Complete `proxy/install.sh` as a single `curl | bash` script that: pulls the Docker image,
prompts for license key, writes an `.env` file, runs `docker compose up -d`, and prints
`proxy running at http://localhost:8080/v1`.
- Test on a clean Mac (M1/M2). Time the install. It must complete in under 5 minutes
from the curl command.
- Test on a clean Ubuntu 22.04 VM (Google Cloud free tier). Same test. Fix any
divergence between platforms.
- Record every friction point. Fix every friction point. This is the product. If the
install does not work, nothing else matters.

Completion gate: A fresh VM runs the install and routes a real OpenAI call through the
proxy with a visible block event in `GET /v1/events`.

**Day 2 (Tuesday): Build the PDF report.**

Current state: `app/api/reports/generate/` returns JSON. The PRD explicitly flags PDF
as Gap 1 and the highest-impact conversion driver.

Tasks:
- Add PDF generation to the report endpoint using jsPDF or react-pdf. The PDF needs:
  - Page 1: Executive summary (org name, date range, total scans, total blocks, total
    quarantines, top triggered pattern, CMMC controls addressed)
  - Page 2+: Event table (timestamp, action, risk level, pattern name, NIST control,
    request ID for cross-reference)
  - Final page: Merkle root for tamper-evidence (the audit/merkle infrastructure is
    already built per PRD Section 2 table)
  - Hound Shield logo, generated timestamp, note: "Generated by Hound Shield local proxy.
    No prompt content is included in this report."
- The PDF must be downloadable from the Next.js dashboard and optionally from a CLI command
  hitting the proxy's REST API directly (for customers who skip the dashboard).
- Test with 5 fake events. Verify the PDF renders correctly and all fields are present.

Completion gate: A PDF opens in a PDF viewer, is legible, contains NIST control references,
and a non-technical person looking at it can say "this looks like a compliance document."

**Day 3 (Wednesday): Build the outreach list and record the demo.**

Tasks:
- Create a spreadsheet: 30 C3PAOs from CMMC-AB Marketplace. 20 Registered Practitioners
from LinkedIn search. Fields: Name, Organization, Email/LinkedIn, Date Contacted, Response.
- Record a 5-minute Loom demo (script is in ROADMAP.md Part 2, Day 2 section verbatim):
  30 seconds on why cloud DLP fails CMMC, 60 seconds on install, 90 seconds on triggering
  a block with a fake CAGE code, 60 seconds on the PDF report, 30 seconds on pricing.
- No slides. No deck. No product branding video. Screen share of the terminal, the proxy
  running, the block event, the PDF. That is the demo.

Completion gate: Loom video exists, is under 5 minutes, and shows a real block event and a
real PDF download.

**Day 4 (Thursday): Send first outreach wave.**

Tasks:
- Send 20 emails to C3PAOs using the exact template from ROADMAP.md Part 3, Day 3-4.
Subject: "Local AI CUI protection tool for your CMMC clients — free demo license"
- Send 20 LinkedIn messages to Registered Practitioners using the shorter template.
- Do not customize. Send the template. Volume matters more than personalization at this stage.
- Set up a simple Calendly or equivalent for booking 20-minute calls.

Completion gate: 40 outreach contacts made. At least 1 response.

**Day 5 (Friday): Run first demos.**

Tasks:
- Any responses that came in on Day 4 get same-day replies with a calendar link.
- Prepare a clean demo environment: a fresh Docker container, a test OpenAI key,
  a test prompt with a fake CAGE code ready to paste.
- Follow the demo agenda from ROADMAP.md Part 3, Day 5-7 exactly:
  5 min asking about their clients' AI tool gaps, 5 min Loom demo, 5 min live install,
  3 min PDF report, 2 min free trial offer.
- Goal: convert at least 1 demo to a free trial with a credit card on file.

Completion gate: At least 1 demo run. Notes taken on exactly what the prospect said and what
friction appeared.

**Day 6 (Saturday): Fix friction from Day 5. Send second wave.**

Tasks:
- Review notes from Day 5 demo. What did not work? What question were you not prepared for?
  Fix the one most impactful friction point (usually install or PDF legibility).
- Send 20 more outreach emails. Same template.
- Post one genuinely useful thread in r/CMMC about AI tool CUI documentation requirements,
  no product pitch in the post.

Completion gate: Second wave sent. One product fix shipped.

**Day 7 (Sunday): Assess and decide.**

Evaluate: Did one human install the proxy, trigger a block, and see the PDF?
- If yes: the MVP assumption is validated. Move to Day 8 with a paid trial setup.
- If no: identify the specific step that failed and whether it is fixable in 3 days.
  If the install failed, fix the install. If no one responded to outreach, increase volume.
  If the PDF was not convincing, improve the PDF. Do not change the product thesis.

The week produces one of three states:
1. A human saw the complete flow and said "yes, this is what I'd show my assessor." Proceed.
2. A human saw the flow but had a specific objection about local-only proof, pricing, or
   installer reliability. Fix that specific thing.
3. No human saw the flow. The problem is outreach volume, not product. Double the volume.

---

## Appendix: Codebase Reality Check

The following gaps between the current codebase and launch readiness were identified during
review. These are verified against actual file states, not assumptions.

**Verified working (read directly from source):**
- proxy/scanner.ts: LRU cache (256 entries, 5-min TTL), early-exit on CRITICAL BLOCK,
  obfuscation decode (base64, hex), scan_ms measurement. No I/O, no Supabase dependency.
- proxy/patterns/index.ts: 33 patterns across CMMC/CUI, HIPAA/PHI, and PII/CREDENTIAL
  categories. CAGE code, DoD contract number, CUI marking, ITAR, SF-86, NIPRNet all present
  with correct NIST 800-171 control citations. Sorted CRITICAL-first.
- proxy/server.ts: Complete OpenAI-compatible proxy. Blocks on BLOCK action, quarantines on
  QUARANTINE, forwards on ALLOW. Streams supported. Provider routing (OpenAI, Anthropic,
  Google, OpenRouter). Metadata webhook via enqueueEvent. Graceful shutdown.
- advisory/architecture.md: ADR-001 through ADR-008 are coherent, non-obvious, and defensible.

**Confirmed incomplete or broken (verified against tasks/todo.md and code):**
- proxy/install.sh: Marked incomplete in tasks/todo.md. Single-command install does not exist.
- PDF reports: app/api/reports/generate/ returns JSON only. PDF is the highest-impact gap.
- Stripe webhook: Not configured in production. STRIPE_WEBHOOK_SECRET not in Vercel.
- Supabase migrations 003+004: Not pushed to production database.
- Test suite: No jest or vitest configured. Pre-commit hook blocks on <80% coverage.
- install.sh not tested on Windows: tasks/todo.md notes Windows testing required.
  Most defense contractors run Windows.

**Potential false positive risk (assessed from patterns):**
- Email address pattern: LOW/QUARANTINE fires on every email address, including internal
  org emails that appear in every document header. Will create quarantine noise.
- US phone number: LOW/QUARANTINE fires on phone numbers in signatures. Same noise issue.
- Private IPv4: MEDIUM/QUARANTINE fires on any internal IP address, common in technical docs.
  These three patterns alone will generate a high quarantine rate on normal business documents.
  Recommend adding a per-org allowlist for known-safe domains before launch.

---

*Report generated: 2026-04-26*
*Author: Hound Shield validation pipeline*
*Based on complete codebase read: proxy/, compliance-firewall-agent/, docs/, advisory/*
