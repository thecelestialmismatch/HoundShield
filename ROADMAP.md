# Hound Shield — Revenue Roadmap
## From $0 to $10K MRR → YC S26/W27

**Written for:** A founder who built the product but knows nothing about the defense contracting ecosystem.
**Goal:** First paying customer in 14 days. $10K MRR in 6 months. YC application with traction.
**Budget:** $0 until first dollar arrives.

---

## Part 1: Know Your World (Read Once, Never Again)

You built an AI compliance firewall. Before you talk to a single customer, you need to speak their language fluently. This section is a crash course. It takes 10 minutes to read. Without it, every sales call will fail because you'll sound like you don't understand their world.

### The Vocabulary

| Term | What It Means | Why It Matters to Hound Shield |
|---|---|---|
| **CMMC** | Cybersecurity Maturity Model Certification — a DoD cybersecurity standard | This is the regulation that makes customers need Hound Shield |
| **CMMC Level 2** | The middle tier — 110 security controls, required for most contractors handling CUI | Your target buyer is trying to reach this level |
| **CUI** | Controlled Unclassified Information — government data that isn't classified but still needs protection | When an employee pastes a CUI document into ChatGPT, that's a violation. Hound Shield prevents it. |
| **NIST 800-171** | The underlying security standard CMMC Level 2 is built on — 110 controls | Your SPRS scoring engine maps to these controls |
| **SPRS** | Supplier Performance Risk System — DoD system where contractors self-report their security score | Score ranges from -203 to +110. Most contractors have negative scores. Hound Shield helps raise it. |
| **C3PAO** | Certified Third-Party Assessor Organization — companies certified by DoD to audit contractors | **This is your sales channel.** Each C3PAO has 20-100 contractor clients. One C3PAO = many customers. |
| **CRP** | CMMC Registered Practitioner — individual consultant, one tier below C3PAO | Also part of your sales channel. More numerous than C3PAOs. |
| **OSC** | Organization Seeking Certification — the defense contractor trying to get CMMC certified | This is your end customer. |
| **DFARS 7012** | Defense Federal Acquisition Regulation — the contract clause that makes CMMC mandatory | When a contractor says "I got a 7012 clause," they need CMMC. They need Hound Shield. |
| **DCSA** | Defense Counterintelligence and Security Agency — the federal agency that investigates security violations | A CUI spill via ChatGPT can trigger a DCSA investigation. This is the existential fear you're selling against. |
| **Prime contractor** | Large defense company (Raytheon, Lockheed, Boeing) that has DoD contracts | They push CMMC requirements down to their subcontractors. When a prime says "get certified," subcontractors panic-buy tools. |
| **Subcontractor / OSC** | Smaller company (5-500 employees) working for a prime | Your actual buyer. They have the fear. They have the budget. They don't know what to do. |
| **C3PAO Assessment** | The actual audit — costs $30K-$150K, takes months, schedules are full | Hound Shield is NOT a replacement. It's a preparatory and ongoing compliance tool. |

### The Regulation Timeline

- **November 2025**: CMMC Phase 1 enforcement began. New DoD contracts can require CMMC Level 1 self-attestation.
- **November 10, 2026**: CMMC Phase 2 enforcement. Most contracts handling CUI require Level 2 certification or a credible plan.
- **Right now**: ~80,000 contractors need CMMC Level 2. ~400 are certified. Panic is accelerating.

### Why Your Product Specifically Matters

CMMC Level 2 includes controls that specifically require:
- **AC.L2-3.1.3**: Control the flow of CUI per approved authorizations — includes AI tools
- **AU.L2-3.3.1**: Audit and log actions on systems processing CUI — includes AI tool usage logs
- **SI.L2-3.14.1**: Identify, report, and correct information system flaws — includes CUI leaks via AI

Every cloud-based competitor (Nightfall, Strac, Cisco, Cloudflare) violates CMMC by sending CUI to their cloud for scanning. Hound Shield scans locally. This is not a feature — it's a regulatory requirement that your competitors literally cannot comply with for this use case. Learn to say this clearly and quickly.

**The exact sentence:** "Every cloud-based AI DLP tool sends your CUI to their servers to scan it. That's itself a potential CUI spill under DFARS 7012. Hound Shield scans everything locally. Nothing leaves your network."

---

## Part 2: Your Exact Sales Channel

### Why C3PAOs Are Your Distribution

You don't have a sales team. You can't run ads. Cold calls to random defense contractors take months to convert. But C3PAOs have one thing you need: a list of 20-100 defense contractors who are actively trying to get CMMC compliant RIGHT NOW, who trust the C3PAO's recommendations, and who will act on a tool recommendation within days.

One conversation with one C3PAO = potentially 10-50 paying customers.

### Where to Find C3PAOs (Free, Public Directories)

1. **CMMC-AB Marketplace** (primary): [https://marketplace.cmmcab.org/s/find-a-c3pao](https://marketplace.cmmcab.org/s/find-a-c3pao)
   - Shows all certified C3PAO organizations
   - Filter by state, size, specialization
   - Find name + website + contact info

2. **CMMC Registered Practitioners**: [https://marketplace.cmmcab.org/s/find-a-rp](https://marketplace.cmmcab.org/s/find-a-rp)
   - Individual consultants (more numerous, often more accessible than firms)
   - Each manages 5-20 contractor clients
   - More willing to try new tools — less bureaucracy

3. **LinkedIn Search** (free):
   - Search: `"CMMC" AND ("C3PAO" OR "registered practitioner") AND "defense"`
   - Filter: People → United States
   - Look for consultants at firms, not employees at large companies

4. **GovCon Wire**: [https://www.govconwire.com](https://www.govconwire.com)
   - Defense industry news. Read it for 30 minutes to understand buyer language and current events.

### Finding Direct Defense Contractor Contacts (Free)

LinkedIn search strings:
- `"IT manager" AND "defense" AND "CMMC"` → IT admins actively working on compliance
- `"VP operations" AND "DoD contractor" AND "cybersecurity"` → Budget owners
- `"CMMC compliance" AND "subcontractor"` → Pain-aware buyers

Look for people who have posted about CMMC recently — they're already pain-aware and actively seeking solutions.

Communities:
- **r/CMMC** on Reddit — active community of defense contractors and consultants
- **GovCon Network on LinkedIn** — search "GovCon Network" as a LinkedIn group
- **Defense Contractors Association LinkedIn groups** — search by state (e.g., "Virginia defense contractors")

---

## Part 3: 14-Day Revenue Sprint (First Paying Customer)

### Before Day 1: Verify These Work

Do NOT start outreach until you can answer YES to all of these:

- [ ] Install Hound Shield on a clean Windows machine in under 30 minutes (most contractors use Windows)
- [ ] Within 10 minutes of install, trigger a CUI block by typing a fake CAGE code into ChatGPT
- [ ] Download a PDF report showing the block event
- [ ] The PDF says "Controlled Unclassified Information block event" with a timestamp and reference to AC.L2-3.1.3
- [ ] The report can be emailed to a C3PAO auditor as evidence of technical control

If any of these fail, fix them before contacting anyone.

**How to test**: Spin up a fresh $0 VM (Google Cloud free tier, AWS free tier, or your own spare machine). Follow your own install instructions. Time it. Fix every friction point.

---

### Day 1-2: Build Your Outreach List

Create a spreadsheet with two tabs:

**Tab 1: C3PAOs (target 30)**
Columns: Company Name | Contact Name | Email | LinkedIn URL | State | Date Contacted | Response

**Tab 2: Direct Contractors (target 20)**
Columns: Company Name | Contact Name | Title | LinkedIn URL | CMMC Status (if known) | Date Contacted | Response

Fill Tab 1 from the CMMC-AB Marketplace. Fill Tab 2 from LinkedIn searches.

---

### Day 2: Record Your Demo

Record a single Loom video (free at loom.com). Max 5 minutes. No slides. No deck.

**Exact script:**
1. (30 sec) "Defense contractors lose their contracts when employees paste CUI into ChatGPT. No cloud-based tool can safely scan that data — they'd be creating a second CUI spill. Hound Shield is the only AI data protection tool that scans everything locally."
2. (60 sec) Show the install: terminal, one command, proxy running
3. (90 sec) Open a fake ChatGPT session, type a fake contract number (format: W52P1J-24-C-0001), show Hound Shield block it in real time
4. (60 sec) Click "Download Report" — show the PDF with the control reference (AC.L2-3.1.3)
5. (30 sec) "This is what you show your C3PAO auditor. $199/month. Local install. No data leaves your network."

Upload to Loom. Copy the link. This link goes into every outreach email.

---

### Day 3-4: Send First Outreach Wave (C3PAOs)

Email template for C3PAO firms (send from personal email, not noreply):

---
**Subject:** Local AI CUI protection tool for your CMMC clients — free demo license

Hi [First Name],

Built a tool your defense contractor clients probably need right now.

The problem: employees using ChatGPT and Copilot to process CUI is now a documented CMMC gap. Every cloud-based DLP tool (Nightfall, Strac, etc.) actually makes it worse — they send CUI to their cloud to scan it, creating a second potential spill.

Hound Shield runs entirely on the client's own server. Zero data leaves their network. It blocks CUI in real time before it reaches any AI tool, and generates a PDF audit log that maps directly to AC.L2-3.1.3 and AU.L2-3.3.1.

[5-min demo video: INSERT LOOM LINK]

$199/month per organization. I'd give you a free license to test with one client. If it's useful, I'd love to be a tool you recommend during your assessments.

Worth a 15-minute call?

[Your name]
houndshield.com

---

Send 15 emails on Day 3. Send 15 more on Day 4.

**LinkedIn message template (shorter):**

> "Hi [Name] — I built a local-only AI CUI protection tool for CMMC clients. Every cloud DLP solution creates a second CUI spill risk. This one scans on-premises. Would you test it with one client? [Loom link] — takes 5 min to see."

Send 20 LinkedIn messages by end of Day 4.

---

### Day 5-7: First Demos

When someone responds, reply within 1 hour. Offer a 20-minute Zoom call.

**Demo agenda (exactly this — no deviation):**
1. (5 min) Ask: "Which of your clients have AI tool usage as an open CMMC gap right now?"
   - This tells you if they have the problem AND gives you a live prospect
2. (5 min) Show the Loom demo live on your screen
3. (5 min) Show the install on your own machine (already set up) — "it's this simple"
4. (3 min) Show the PDF report — "this is what goes to the auditor"
5. (2 min) "I can give you a free 30-day license for one of your clients. Want to send this to [the client you mentioned in minute 1]?"

Goal of the demo: Get the C3PAO to forward a free trial license to one specific client.

---

### Day 8-10: Convert Trials

For every contractor who starts a free trial:
- Send a Stripe payment link for $199/month with a 30-day free trial
- REQUIRE a credit card to start the trial (Stripe supports this — trial period, charge after 30 days)
- Do NOT offer free trials without a card on file. This filters serious buyers from tire-kickers.

Follow up on Day 3 and Day 7 of their trial:
- Day 3: "Any questions on the install? Did the first block fire?"
- Day 7: "Has your C3PAO seen the PDF report yet?"

---

### Day 11-14: Close First Payment

**When a contractor says "this is great":**
> "Glad it's working. The trial runs 30 more days and then it's $199/month — no action needed on your end, the card on file handles it. Just let me know if you want to add any team members or need the SPRS score breakdown in the report."

**The C3PAO referral ask:**
After any positive demo:
> "Would you be comfortable forwarding this to two of your other clients who have AI tool usage as a gap? I'll give you a $50/month credit for each client you bring."

**Target end state, Day 14:**
- At least 1 paying customer ($199/month first charge)
- 3-5 active trials with cards on file
- 1 C3PAO actively forwarding your tool to their clients

---

## Part 4: Month 1 → $1K MRR

After first paying customer, do this and only this.

### Week 3-4 Actions

**1. Run the Day 1-14 playbook again.** Same emails. Same demo. Same trial process. You now have a reference customer. Use them.

Update your outreach email to add:
> "One C3PAO is already recommending this to their clients. A contractor in [state/industry] has it running and generating audit reports."

**2. Ask your first customer for a referral immediately.**

> "You're one of the first organizations running this. Do you know two other defense contractors who are trying to figure out their AI tool CUI controls? I'd set them up with a free trial and mention you sent them."

Defense contractors talk to each other constantly. One referral from a satisfied customer is worth 100 cold emails.

**3. Post once in r/CMMC.**

Post something genuinely useful (not a pitch). Example:
> "CMMC assessors are starting to ask specifically about AI tool CUI controls — AC.L2-3.1.3 and AU.L2-3.3.1. Here's what documentation they're expecting and why cloud-based DLP tools actually fail this control. Happy to answer questions."

Post the content. Don't mention Hound Shield in the post. When someone asks "what tool do you use?" — answer then.

**4. End of Month 1 target: 5 paying customers = $995/month.**

If below target: check whether outreach volume is high enough (should be 50+ C3PAO/contractor contacts), not whether the product needs changes.

---

## Part 5: Month 2-3 → $5K MRR

### Unlock the MSSP/C3PAO Reseller Tier

This is the highest-leverage move available at $0 cost.

A C3PAO firm with 50 defense contractor clients could theoretically resell Hound Shield to all 50. At $99/client/month through a reseller arrangement, that's $4,950/month from one partnership.

How to propose this:

> "I want to make it easy for you to include AI CUI protection in your service offering. I'll give you Hound Shield at $75/client/month — you invoice your clients at whatever rate works for your business. I just need a list of client domains and I'll provision their accounts. Monthly billing, no contracts."

C3PAO economics: They bill contractors at $150-$300/hour for assessment and remediation work. Adding a $75/month/client tool to their stack is trivial. They mark it up to $150-$200/month and keep the margin.

One C3PAO reseller deal = $1,500-$5,000 MRR instantly.

Target: Sign 2 C3PAO reseller agreements by end of Month 3.

### Product Updates for Month 2

Only add features that were specifically requested by paying customers. Common requests in this space:
- "Can I see which employee triggered each block?" → add user attribution to logs
- "Can I get an email alert when CUI is blocked?" → add notification webhook
- "Can the PDF report include our SPRS score impact?" → already built, make sure it's visible

Do NOT add features that weren't requested. Do not rebuild the landing page. Do not launch on Product Hunt. Do not write blog posts. Only outreach and customer conversations.

---

## Part 6: Month 4-6 → $10K MRR

### The Numbers

$10K MRR = 50 customers at $199/month OR 5 C3PAO reseller deals at $2,000/month each.

The reseller path is faster. Target 5 C3PAO resellers by Month 6.

### Product Milestones That Enable the Reseller Path

These features make C3PAOs more likely to resell:
1. **Multi-tenant dashboard** — C3PAO can see all their clients' Hound Shield status in one view
2. **White-label option** — C3PAO can offer "Our AI CUI Protection Service (Powered by Hound Shield)" under their brand
3. **SPRS score impact report** — shows the contractor exactly which CMMC control Hound Shield satisfies and the point impact on their SPRS score

These are the only three features that drive revenue at this stage. Build them in this order.

### Govcon Conference Strategy

At Month 4-5, you should have enough traction (5+ paying customers, 1+ reseller deal) to attend one govcon event at zero or minimal cost.

Free/low-cost options:
- **CMMC Con** (annual, virtual option available) — CMMC practitioners attend. You are a vendor with a live product.
- **GovCon Local meetups** — DC, Northern Virginia, San Diego, Huntsville AL are major defense contractor hubs. LinkedIn groups post these events.
- **Defense contractors association meetings** — many are free to attend as a vendor

At these events, you are not pitching. You are listening. Ask everyone: "What's the biggest gap you're seeing in AI tool CUI control for your clients?" Then listen for 20 minutes. You'll learn more in one day than in 6 months of guessing.

---

## Part 7: Month 6-12 → YC Application

### What YC S26 or W27 Needs to See

YC funds traction, not ideas. The application that gets in has:
- **Real revenue**: $10K+ MRR minimum. More = better.
- **Growth rate**: 10-20% month-over-month for at least 3 months
- **Customer evidence**: Named customers willing to be referenced (or quoted anonymously)
- **Defensible insight**: "We know something about this market that nobody else does"

Your defensible insight is: **CUI cannot legally leave the network. Every cloud-based competitor is technically non-compliant for CMMC. We built the only architecture that's actually legal for this use case.**

Practice saying this in 30 seconds until it sounds natural.

### Application Checklist (Start at Month 8)

- [ ] $10K MRR demonstrated with screenshots of Stripe dashboard
- [ ] Customer growth graph showing month-over-month increase
- [ ] 3 customer quotes (can be anonymous: "a 40-person aerospace subcontractor in Virginia")
- [ ] Clear explanation of the regulatory moat (CUI cannot leave network)
- [ ] 1-line company description that a 10-year-old could understand: "We stop defense contractors from accidentally leaking classified information to ChatGPT"
- [ ] Answer to "what have you built in the last 2 weeks?" — always be shipping something

### What Not to Do Before YC

- Do not raise angel funding. You don't need it and it reduces YC's ownership interest. Bootstrap to $10K MRR.
- Do not hire anyone. One founder, one product, one customer.
- Do not pivot to enterprise. The $10M contract with Raytheon isn't coming. The 200 SMB contractors at $199/month is.
- Do not redesign the product. Defense contractors don't buy on UI. They buy on trust and compliance proof.

---

## Part 8: Objection Handling (Memorize These)

Every sales call will have one of these objections. Know the answer before it's asked.

### "We just banned AI tools. Problem solved."

> "Policies don't show up on audit reports as technical controls. When your assessor asks for documentation of AI tool CUI controls, a policy memo fails that check. Also — your employees are using AI tools on personal devices and not telling you. The ban removed your visibility, not their usage."

### "This is expensive. We can just write a policy."

> "A policy costs nothing and fails your CMMC audit. A C3PAO assessment to fix one failed control costs $10K-$30K to redo. Hound Shield is $199/month — cheaper than two hours of your C3PAO's time."

### "How do we know data doesn't leave our network?"

> "The proxy runs entirely inside your Docker container on your server. The only outbound traffic is a license key check — a single HTTPS call with no content. You can verify this yourself: run `tcpdump` while a CUI block happens and you'll see zero outbound traffic except the license ping. I'll walk you through it on a call."

### "We already have Nightfall/Microsoft Purview."

> "Nightfall processes your prompts on their cloud servers. Under DFARS 7012, sending CUI to a third-party cloud for processing is the same category of risk as sending it to ChatGPT. We'd love to show you why your CMMC assessor may flag this as a gap. No commitment — 20 minutes."

### "We're a small shop, we can't manage another tool."

> "The install is one Docker command and one proxy URL change in your AI tool settings. After that, it runs silently. No dashboard to check, no alerts to manage unless a CUI block fires. Maintenance is close to zero."

### "We need to check with our prime contractor first."

> "Makes sense. Would it help if I sent you a one-pager you could forward to them? It explains how this satisfies the flow-down requirements they're likely asking about."

---

## Part 9: Metrics to Track (Simple)

Track these weekly in a spreadsheet. Nothing else.

| Metric | Week 1 Target | Month 1 Target | Month 3 Target | Month 6 Target |
|---|---|---|---|---|
| C3PAO/CRP contacts made | 30 | 80 | 150 | 250 |
| Demos run | 3 | 10 | 25 | 50 |
| Trials started | 1 | 5 | 15 | 35 |
| Paying customers | 0 | 5 | 20 | 50 |
| MRR | $0 | $995 | $3,980 | $9,950 |
| C3PAO reseller deals | 0 | 0 | 1 | 3-5 |

If MRR is below target: the problem is **outreach volume**, not product. Make more contacts.
If demos convert poorly: the problem is **demo execution**, not product. Practice the demo 10 times alone.
If trials don't convert to paid: the problem is **value not delivered in 30 days**. Follow up more aggressively on Day 3 and Day 7.

---

## Part 10: What "Knowing Nothing" Actually Means

You said you know nothing about this space. That's fine. Here's the honest truth:

**You don't need to know the defense industry to sell to it. You need to know the specific pain.**

The pain is: "My CMMC assessor is going to ask me for documentation of AI tool CUI controls and I have nothing to show them."

Everything else — DFARS clauses, SPRS scores, CAGE codes — is vocabulary. You can learn vocabulary by reading this document and spending 2 hours on govconwire.com. What you can't fake is whether the product actually works. And it does.

The defense contractors and C3PAOs you'll call are not technical experts in AI security. They're cybersecurity practitioners who understand compliance frameworks. They evaluate tools by:
1. Does it address a specific gap in the 110 controls?
2. Can I explain it to my auditor?
3. Is the data handling verifiably secure?
4. Does it install in under an hour?

You can answer yes to all four. That's enough to sell.

**Your unfair advantage is the local architecture.** Nobody else at this price point can claim CUI never leaves the network and actually mean it architecturally. Own that. It's the one thing you have that $58 million cannot immediately replicate for the SMB market.

---

## Appendix: Free Resources to Get Smart Fast

| Resource | What It Is | Time to Skim |
|---|---|---|
| [NIST SP 800-171 Rev 2](https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final) | The actual 110 controls. Read the summaries, not the full text. | 30 min |
| [DoD CUI Registry](https://www.archives.gov/cui) | What counts as CUI. Learn the categories. | 20 min |
| [CMMC-AB Model Overview](https://cmmc-coa.com/resources) | How the certification process works. | 20 min |
| [GovCon Wire](https://govconwire.com) | Defense industry news. Skim daily for 5 min. | Ongoing |
| [r/CMMC](https://reddit.com/r/cmmc) | Active practitioners. Read questions, learn pain points. | 30 min |
| [DFARS 7012 text](https://www.acq.osd.mil/dpap/dars/dfars/html/current/252204.htm) | The actual contract clause. Read section (b) and (c). | 15 min |
| [SPRS Scoring Guide](https://www.sprs.csd.disa.mil/pdf/SPRS_CS_ScoringGuide.pdf) | How the -203 to +110 score is calculated. | 20 min |

---

*Last updated: 2026-04-16*
*Next review: After first 5 paying customers or 60 days, whichever comes first.*
