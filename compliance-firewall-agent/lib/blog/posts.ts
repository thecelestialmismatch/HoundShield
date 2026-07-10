// ─────────────────────────────────────────────────────────────────────────────
// Blog post registry — add new posts here, they automatically appear in:
//   - /blog listing page
//   - sitemap.xml
//   - JSON-LD Article schema
// ─────────────────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  description: string;       // ≤160 chars — used for meta description
  excerpt: string;           // ≤300 chars — shown on listing page
  date: string;              // ISO 8601: "2026-05-08"
  updatedDate?: string;
  author: string;
  authorTitle: string;
  category: BlogCategory;
  tags: string[];
  readingTime: number;       // minutes
  featured?: boolean;
  content: string;           // Full MDX/HTML content
}

export type BlogCategory =
  | "CMMC Compliance"
  | "HIPAA Compliance"
  | "AI Security"
  | "SOC 2"
  | "How-To"
  | "Industry News";

const posts: BlogPost[] = [
  {
    slug: "cmmc-level-2-compliance-checklist-2026",
    title: "CMMC Level 2 Compliance Checklist: Everything Defense Contractors Need in 2026",
    description:
      "The complete CMMC Level 2 compliance checklist for 2026. 110 NIST 800-171 controls, C3PAO assessment prep, CUI handling, and how AI tools create hidden violations.",
    excerpt:
      "CMMC Phase 2 enforcement begins November 2026. If you're a defense contractor and haven't started, you're behind. This is the no-fluff checklist: 110 controls, what auditors actually look for, and the AI blind spot most contractors miss.",
    date: "2026-05-08",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "CMMC Compliance",
    tags: ["CMMC", "CMMC Level 2", "NIST 800-171", "CUI", "defense contractor", "C3PAO"],
    readingTime: 12,
    featured: true,
    content: `
<h2>Why CMMC Level 2 Matters Right Now</h2>
<p>The Department of Defense's CMMC Phase 2 enforcement deadline is November 2026. Defense contractors handling Controlled Unclassified Information (CUI) must achieve CMMC Level 2 certification — or lose their contracts.</p>
<p>CMMC Level 2 maps directly to all 110 security requirements in NIST SP 800-171 Rev 2. No exceptions. No partial credit.</p>

<h2>The 17 CMMC Level 2 Domains</h2>
<p>CMMC Level 2 spans 17 domains:</p>
<ul>
  <li><strong>AC — Access Control</strong> (22 practices): Who can touch CUI and when</li>
  <li><strong>AT — Awareness and Training</strong> (3 practices): Every employee who touches CUI needs training</li>
  <li><strong>AU — Audit and Accountability</strong> (9 practices): Tamper-evident logs of all CUI access</li>
  <li><strong>CA — Assessment, Authorization, and Monitoring</strong> (9 practices): Continuous system assessment</li>
  <li><strong>CM — Configuration Management</strong> (9 practices): Baseline configs, change control</li>
  <li><strong>IA — Identification and Authentication</strong> (11 practices): MFA, password policies</li>
  <li><strong>IR — Incident Response</strong> (3 practices): Detection, response, recovery plans</li>
  <li><strong>MA — Maintenance</strong> (6 practices): Controlled maintenance of CUI systems</li>
  <li><strong>MP — Media Protection</strong> (9 practices): How you handle, store, and destroy CUI media</li>
  <li><strong>PE — Physical Protection</strong> (6 practices): Physical access to CUI systems</li>
  <li><strong>PS — Personnel Security</strong> (2 practices): Background checks, termination procedures</li>
  <li><strong>RA — Risk Assessment</strong> (3 practices): Periodic risk assessments</li>
  <li><strong>CA — Security Assessment</strong> (4 practices): Annual assessments</li>
  <li><strong>SC — System and Communications Protection</strong> (16 practices): Network segmentation, encryption</li>
  <li><strong>SI — System and Information Integrity</strong> (7 practices): Malware protection, patch management</li>
  <li><strong>SR — Supply Chain Risk Management</strong> (3 practices): Vendor vetting</li>
  <li><strong>SA — Software and System Acquisition</strong> (3 practices): Secure development</li>
</ul>

<h2>The AI Blind Spot Every Auditor Will Check</h2>
<p>Here's what most checklists miss: <strong>AI tools are a CMMC landmine.</strong></p>
<p>When your employees use ChatGPT, Copilot, Claude, or any cloud-based AI with CUI in prompts, that data leaves your network and travels to a third-party server. That is a CMMC violation. Full stop.</p>
<p>NIST 800-171 3.13.1 requires you to "monitor, control, and protect communications at the external boundary." Sending CUI to an AI API is not monitored, not controlled, and not protected.</p>
<p>C3PAO assessors are specifically trained to look for AI usage in 2026 assessments. Don't hand them an easy deficiency.</p>

<h2>How to Fix the AI Problem</h2>
<p>You have two options: ban AI entirely (not realistic) or deploy a local-only AI proxy that scans prompts before they leave your network.</p>
<p>HoundShield is the only AI compliance firewall built specifically for CMMC. One URL change, sub-10ms scanning, tamper-evident PDF evidence your C3PAO assessor can review on-site.</p>

<h2>The 30-Day Sprint to C3PAO-Ready</h2>
<ol>
  <li><strong>Days 1-5:</strong> System Security Plan (SSP) gap analysis against all 110 controls</li>
  <li><strong>Days 6-10:</strong> Remediate Critical/High gaps (access control, encryption, MFA)</li>
  <li><strong>Days 11-15:</strong> Deploy AI DLP proxy, document CUI data flows</li>
  <li><strong>Days 16-20:</strong> Evidence collection — screenshots, logs, config exports</li>
  <li><strong>Days 21-25:</strong> Internal mock assessment</li>
  <li><strong>Days 26-30:</strong> Final SSP review, C3PAO scheduling</li>
</ol>
    `,
  },
  {
    slug: "ai-tools-that-violate-cmmc-what-defense-contractors-need-to-know",
    title: "AI Tools That Violate CMMC: What Defense Contractors Need to Know in 2026",
    description:
      "Using ChatGPT, Copilot, or Claude with CUI? That's a CMMC violation. Here's which AI tools create compliance risk and exactly how to fix it before your C3PAO assessment.",
    excerpt:
      "Your employees are using AI. Some of them are pasting contract details, technical specs, and project names into ChatGPT. Every one of those sessions is a potential CMMC violation — and your auditor will ask about it.",
    date: "2026-05-06",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "CMMC Compliance",
    tags: ["CMMC", "ChatGPT", "AI security", "CUI protection", "NIST 800-171", "LLM firewall"],
    readingTime: 8,
    featured: false,
    content: `
<h2>The Problem with Cloud AI and CUI</h2>
<p>Controlled Unclassified Information (CUI) cannot leave your organization's control boundary without explicit authorization. Cloud-based AI tools — ChatGPT, Microsoft Copilot, Google Gemini, Claude.ai — are not within your control boundary. They are external services operated by third parties.</p>
<p>When an employee pastes a DoD contract number, technical spec, or personnel record into a cloud AI prompt, that data is transmitted to and processed on external servers. This is a direct violation of NIST 800-171 control 3.13.1 (boundary protection).</p>

<h2>Which AI Tools Create CMMC Risk</h2>
<ul>
  <li><strong>ChatGPT (OpenAI):</strong> All tiers, including Team and Enterprise, route prompts through OpenAI infrastructure</li>
  <li><strong>Microsoft Copilot:</strong> Even M365 Copilot with "data privacy" settings can still process data on Microsoft's servers</li>
  <li><strong>Google Gemini / Workspace AI:</strong> Same issue — Google's servers, not yours</li>
  <li><strong>Claude.ai (Anthropic):</strong> The web interface sends data to Anthropic's infrastructure</li>
  <li><strong>GitHub Copilot:</strong> Code suggestions involving CUI-related identifiers can expose data</li>
</ul>

<h2>What "Local-Only" Actually Means</h2>
<p>The only CMMC-compliant way to use AI is through a local-only proxy that intercepts prompts before they reach any external service, scans for CUI markers, and either blocks the request or strips the sensitive content.</p>
<p>HoundShield works as a drop-in proxy: your AI tools point to our local endpoint instead of the cloud AI API. Sub-10ms scanning. Zero data leaves your network. Every scan creates a tamper-evident log entry your C3PAO can review.</p>
    `,
  },
  {
    slug: "houndshield-vs-nightfall-cmmc-compliant-ai-firewall",
    title: "HoundShield vs Nightfall: The CMMC-Compliant AI Firewall Comparison",
    description:
      "Nightfall costs $75K/yr and is cloud-based — which makes it CMMC non-compliant for CUI. HoundShield is local-only, under $500/mo, and built for defense contractors.",
    excerpt:
      "If you're evaluating DLP solutions for CMMC compliance, you need to ask one question first: does the vendor's product send your data to their cloud? If yes, it's non-compliant for CUI. Here's how the major options stack up.",
    date: "2026-05-04",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "CMMC Compliance",
    tags: ["CMMC", "Nightfall", "DLP", "AI firewall", "CUI protection", "defense contractor", "comparison"],
    readingTime: 7,
    featured: false,
    content: `
<h2>The Compliance Catch with Cloud DLP</h2>
<p>Most DLP (Data Loss Prevention) solutions — Nightfall, Cloudflare AI Gateway, Forcepoint — are cloud-based. Your prompts go to their servers for scanning. That's the fundamental problem for CMMC.</p>
<p>Under NIST 800-171 and CMMC Level 2, CUI must stay within your organizational control boundary. Sending CUI to a third-party cloud scanner — even for security purposes — creates a new data exposure risk that auditors will flag.</p>

<h2>Comparison: HoundShield vs Alternatives</h2>
<table>
  <thead><tr><th>Feature</th><th>HoundShield</th><th>Nightfall</th><th>Cloudflare AI GW</th></tr></thead>
  <tbody>
    <tr><td>Deployment</td><td>Local-only ✅</td><td>Cloud ❌</td><td>Cloud ❌</td></tr>
    <tr><td>CMMC Compliant for CUI</td><td>Yes ✅</td><td>No ❌</td><td>No ❌</td></tr>
    <tr><td>Price (monthly)</td><td>From $69/mo</td><td>~$6,250/mo</td><td>Free (cloud)</td></tr>
    <tr><td>C3PAO PDF Evidence</td><td>Yes ✅</td><td>No</td><td>No</td></tr>
    <tr><td>Setup time</td><td>&lt;10 minutes</td><td>Weeks</td><td>Hours</td></tr>
    <tr><td>NIST 800-171 Mapping</td><td>Built-in ✅</td><td>Partial</td><td>None</td></tr>
  </tbody>
</table>

<h2>Why "Local-Only" Is the Only Defensible Architecture</h2>
<p>When a C3PAO assessor asks "how do you prevent CUI from reaching unauthorized external services?", your answer must include evidence, not just policy documents. HoundShield generates tamper-evident PDF logs of every AI prompt scan — blocked, flagged, and clean — so you walk into your assessment with proof.</p>
    `,
  },
  {
    slug: "how-to-protect-cui-when-using-chatgpt-defense-contractor-guide",
    title: "How to Protect CUI When Using ChatGPT: A Defense Contractor's Complete Guide",
    description:
      "Defense contractors using ChatGPT with CUI risk CMMC violations and contract loss. This guide covers detection, prevention, and the only compliant architecture for AI use in DoD environments.",
    excerpt:
      "You can't just ban ChatGPT. Employees will use it anyway — on personal devices, at home, through browser extensions. The only solution that actually works is a local AI proxy that catches CUI before it leaves your network.",
    date: "2026-05-01",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "AI Security",
    tags: ["ChatGPT", "CUI", "CMMC", "defense contractor", "AI compliance", "data loss prevention"],
    readingTime: 9,
    featured: false,
    content: `
<h2>What Is CUI and Why It Matters for AI</h2>
<p>Controlled Unclassified Information (CUI) includes any information the U.S. government creates or possesses that requires safeguarding or dissemination controls under law, regulation, or government-wide policy. For defense contractors, this includes contract numbers, technical specifications, personnel data, procurement-sensitive information, and more.</p>
<p>The CUI Registry (cui.gov) lists 125 CUI categories. If you handle DoD contracts, you almost certainly handle CUI.</p>

<h2>How CUI Gets Into ChatGPT (And How to Stop It)</h2>
<p>The three most common CUI leakage patterns in defense contractor organizations:</p>
<ol>
  <li><strong>Document summarization:</strong> Engineer uploads a contract document to get a summary. Contract contains CUI.</li>
  <li><strong>Code completion:</strong> Developer asks AI to generate code, includes variable names that contain contract identifiers.</li>
  <li><strong>Report drafting:</strong> Program manager uses AI to draft a status report, pastes in project details.</li>
</ol>

<h2>The Technical Solution: Local AI Proxy</h2>
<p>HoundShield intercepts every AI API call before it leaves your network. It runs 16 detection engines matching CUI indicators (CAGE codes, contract numbers, classification markings, clearance levels, PHI markers) in under 10ms. Blocked requests never reach the external AI service. Every decision creates an immutable log entry.</p>
<p>Setup is one line: point your AI tool's API base URL to your Kaelus endpoint instead of api.openai.com. No code changes. No agent installation on every machine. One network-level change covers your entire organization.</p>
    `,
  },

  // ── Tier-1 SEO sprint (2026-07-10) — additive only; entries above unchanged ──
  {
    slug: "gcc-high-copilot-vs-third-party-ai-proxy-cmmc-cost",
    title: "GCC High Copilot vs Third-Party AI Proxy: Which Is Cheaper for CMMC? (2026)",
    description:
      "GCC High migration runs $149K–$200K/yr and fits 200+ person orgs. A local AI proxy costs a fraction of that. The real CMMC cost math, side by side.",
    excerpt:
      "Microsoft's answer to CMMC-safe AI is Copilot inside GCC High — 'free' with your E5/G5 licensing, after a $149K–$200K/yr tenant migration. For contractors under 200 employees, that math rarely closes. Here is the honest cost comparison, including when GCC High genuinely wins.",
    date: "2026-07-10",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "CMMC Compliance",
    tags: ["CMMC", "GCC High", "Copilot", "Microsoft Purview", "AI proxy", "cost comparison", "defense contractor"],
    readingTime: 10,
    featured: true,
    content: `
<p><strong>Short answer:</strong> for a defense contractor under roughly 200 employees, a third-party local AI proxy is dramatically cheaper than moving to GCC High to get compliant Copilot — because GCC High is not a product you buy, it is a tenant migration that typically runs $149K–$200K per year on top of E5/G5 licensing. For large, all-Microsoft DIB primes already inside GCC High, Copilot there is a strong answer. This post walks the actual math for both paths.</p>

<h2>Why this comparison exists at all</h2>
<p>Your engineers are already using AI. The question your assessor will ask is where CUI goes when they do. Microsoft's compliant path keeps AI inside a US-sovereign cloud boundary (GCC High). The proxy path keeps AI usage on commercial tools but inspects and blocks CUI locally, before any prompt leaves your network. Both are defensible architectures. They differ mostly in cost, timeline, and how much of your stack must be Microsoft.</p>

<h2>The GCC High path: what it actually costs</h2>
<p>GCC High is a separate Microsoft cloud environment for controlled data. Getting Copilot compliantly means getting your tenant there first:</p>
<ul>
  <li><strong>Migration:</strong> a GCC High migration is typically quoted in the $149K–$200K per year range for mid-market contractors, and it is a project (identity, mail, SharePoint, Teams, endpoints), not a checkbox.</li>
  <li><strong>Licensing:</strong> Copilot is layered on E5/G5-class licensing — the per-seat cost is materially higher than commercial M365.</li>
  <li><strong>Eligibility and timeline:</strong> onboarding requires validation as a US defense supply chain entity, and real-world migrations run months, not weeks.</li>
  <li><strong>Scope:</strong> it protects Microsoft AI. Engineers using Claude, Gemini, or a coding assistant outside the tenant are still outside the boundary.</li>
</ul>
<p>This is why, in practice, GCC High Copilot is a 200-plus-employee play. Below that size, the fixed migration cost dominates everything else in the equation.</p>

<h2>The proxy path: what it actually costs</h2>
<p>A local AI firewall like <a href="/features">HoundShield</a> sits between your users and every AI endpoint. Prompts are scanned on your own infrastructure in under 10 milliseconds; anything matching CUI, ITAR, or PHI patterns is blocked before it leaves the network, and every event lands in a SHA-256 hash-chained audit log.</p>
<ul>
  <li><strong>Entry cost:</strong> a one-time <a href="/pricing">$499 CMMC AI Risk Assessment Report</a> — run the proxy for 14 days, get a signed PDF that risk-scores every AI prompt event against NIST 800-171 Rev 2.</li>
  <li><strong>Deployment:</strong> self-hosted Docker (Mode B) on your own infrastructure. That self-hosted mode is what keeps CUI inside your boundary — the hosted trial exists for demos and non-CUI evaluation only.</li>
  <li><strong>Coverage:</strong> any OpenAI-compatible endpoint — ChatGPT, Copilot, Claude, Gemini — through one URL change, no per-seat agent rollout.</li>
  <li><strong>Timeline:</strong> the deployment is measured in minutes; the evidence PDF in days.</li>
</ul>

<h2>Side-by-side cost math</h2>
<table>
  <thead><tr><th>Factor</th><th>GCC High + Copilot</th><th>Local AI proxy (Mode B)</th></tr></thead>
  <tbody>
    <tr><td>Up-front platform cost</td><td>$149K–$200K/yr migration + E5/G5 uplift</td><td>$499 one-time assessment; self-hosted plans after</td></tr>
    <tr><td>Time to first assessor-ready evidence</td><td>Months (post-migration)</td><td>14 days (signed PDF)</td></tr>
    <tr><td>AI tools covered</td><td>Microsoft Copilot within the tenant</td><td>Any OpenAI-compatible AI endpoint</td></tr>
    <tr><td>Where prompts are processed</td><td>US-sovereign Microsoft cloud</td><td>Your own network — nothing leaves</td></tr>
    <tr><td>Org size where the math works</td><td>Roughly 200+ employees</td><td>5–500 employees</td></tr>
    <tr><td>Stack assumption</td><td>All-in Microsoft</td><td>Stack-agnostic</td></tr>
  </tbody>
</table>

<h2>When GCC High genuinely wins</h2>
<p>Honesty matters more than winning the comparison. Choose GCC High Copilot when:</p>
<ul>
  <li>You are already in GCC High, or your primes contractually require it — then Copilot there is incremental, not a migration.</li>
  <li>You are a larger DIB organization standardized on Microsoft 365 end to end, and consolidating on one vendor boundary simplifies your SSP.</li>
  <li>You need AI to operate <em>on</em> CUI (summarizing CUI documents inside the boundary), not just to be protected <em>from</em> CUI leakage. A blocking proxy prevents spills; it does not give you a compliant place to process CUI.</li>
</ul>

<h2>When the proxy wins</h2>
<ul>
  <li>You are under ~200 employees and the migration line item alone exceeds your entire security budget.</li>
  <li>Your team uses AI tools beyond Copilot and you need one control covering all of them.</li>
  <li>You need evidence for an assessor in weeks — a POA&amp;M-closing artifact, not a platform project.</li>
</ul>
<p>For the deeper architectural comparison, see <a href="/compare/microsoft-purview-gcc-high">HoundShield vs Microsoft Purview + GCC High</a>. For the fastest path to evidence, the <a href="/pricing">$499 assessment report</a> is where the DIB mid-market starts.</p>
    `,
  },
  {
    slug: "chatgpt-and-hipaa-what-privacy-officers-need-to-know-2026",
    title: "ChatGPT and HIPAA: What Your Privacy Officer Needs to Know in 2026",
    description:
      "ChatGPT is not HIPAA-compliant without a BAA — and consumer ChatGPT has none. What Privacy Officers must do about staff pasting PHI into AI tools in 2026.",
    excerpt:
      "Staff are pasting patient information into ChatGPT today, and the consumer product has no BAA. Netskope measured 81% of healthcare data policy violations involving regulated data. The Privacy Officer's playbook: what is permitted, what is a breach, and how to allow AI without exposure.",
    date: "2026-07-10",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "HIPAA Compliance",
    tags: ["HIPAA", "PHI", "ChatGPT", "BAA", "healthcare", "privacy officer", "AI compliance"],
    readingTime: 9,
    featured: true,
    content: `
<p><strong>Bottom line up front:</strong> ChatGPT is not HIPAA-compliant by default. Consumer and Plus versions offer no Business Associate Agreement (BAA), so entering protected health information (PHI) into them discloses PHI to a vendor with no HIPAA obligations — a potential reportable breach. OpenAI supports BAAs only for its API and enterprise offerings, and a BAA alone does not make workflows compliant. Your practical choices in 2026: block PHI from reaching AI tools, or route AI through a BAA-covered, safeguarded path.</p>

<h2>The scale of the problem is measured, not hypothetical</h2>
<p>Netskope's May 2025 healthcare analysis found that <strong>81% of data policy violations in healthcare organizations involved regulated data</strong> — overwhelmingly the kind of information staff paste into generative AI tools to summarize a chart, draft a letter, or translate discharge instructions. The intent is almost always good. The disclosure is still a disclosure.</p>

<h2>What HIPAA actually requires here</h2>
<ul>
  <li><strong>A BAA before PHI touches a vendor.</strong> If a third party creates, receives, maintains, or transmits PHI on your behalf, you need a Business Associate Agreement. Consumer ChatGPT has none, and OpenAI's terms for the consumer product do not contemplate PHI.</li>
  <li><strong>The minimum necessary standard.</strong> Even under a BAA, sending a full chart to draft a two-line letter fails minimum-necessary scrutiny.</li>
  <li><strong>Access controls and audit trails (Security Rule).</strong> You must be able to show who disclosed what, when — browser-pasted prompts leave you nothing.</li>
  <li><strong>Breach analysis when it goes wrong.</strong> PHI sent to a non-BAA vendor triggers a four-factor breach risk assessment, and potentially notification to patients and HHS.</li>
</ul>

<h2>Why "just ban it" fails</h2>
<p>Policy-only bans do not survive contact with a busy clinic. Staff use personal devices, personal accounts, and whatever tool answers fastest. A written AI policy with no technical control is an unenforced policy — and unenforced policies read badly in an OCR investigation.</p>

<h2>The compliant architecture: allow AI, block PHI</h2>
<p>The workable posture for most physician groups and clinics is a <strong>local AI firewall</strong>:</p>
<ol>
  <li>Route staff AI traffic through a proxy running on your own infrastructure (<a href="/hipaa">HoundShield's HIPAA deployment</a> runs as self-hosted Docker — prompt content never leaves your network to be scanned).</li>
  <li>Detection engines scan each prompt locally in under 10ms for PHI markers — names, MRNs, DOBs, diagnosis codes, insurance identifiers.</li>
  <li>Prompts containing PHI are blocked or require justification; clean prompts pass through, so staff keep the productivity win.</li>
  <li>Every event lands in a tamper-evident audit log — the artifact your next risk analysis and any OCR inquiry will ask for.</li>
</ol>
<p>Note the contrast with cloud-based DLP products: tools that scan prompts <em>in their own cloud</em> receive your PHI in order to protect it, which puts you right back in BAA territory with the DLP vendor. Local scanning avoids the recursion entirely.</p>

<h2>A Privacy Officer's 30-day checklist</h2>
<ol>
  <li><strong>Week 1 — discover:</strong> survey which AI tools staff actually use (assume more than you think), and check whether any have BAAs in place.</li>
  <li><strong>Week 2 — policy:</strong> publish a one-page AI acceptable-use policy: no PHI in any AI tool without an approved, BAA-covered pathway.</li>
  <li><strong>Week 3 — enforce:</strong> deploy local scanning so the policy is a control, not a memo.</li>
  <li><strong>Week 4 — evidence:</strong> add AI usage to your HIPAA risk analysis, and keep the audit log as standing documentation.</li>
</ol>
<p>Common questions — including the AI-scribe vendors and BAA-covered API workflows — are answered at <a href="/answers/is-chatgpt-hipaa-compliant">Is ChatGPT HIPAA compliant?</a>. To see what your staff's AI traffic actually contains, the <a href="/pricing">$499 AI risk assessment</a> runs 14 days in your environment and reports every PHI event it caught.</p>
    `,
  },
  {
    slug: "employee-pasted-cui-into-chatgpt-incident-response-playbook",
    title: "Did an Employee Paste CUI Into ChatGPT? The CMMC Incident-Response Playbook",
    description:
      "An employee pasted CUI into ChatGPT — now what? The 72-hour DFARS 7012 reporting clock, DIBNet, evidence preservation, and the exact steps to take, in order.",
    excerpt:
      "Someone on your team pasted contract data into ChatGPT. You may be inside DFARS 7012's 72-hour reporting window. This playbook walks the first hour, day, and week — containment, scoping, DIBNet reporting, evidence preservation, and the corrective action assessors respect.",
    date: "2026-07-10",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "CMMC Compliance",
    tags: ["CMMC", "DFARS 7012", "incident response", "CUI", "DIBNet", "ChatGPT", "defense contractor"],
    readingTime: 11,
    featured: false,
    content: `
<p><strong>Bottom line up front:</strong> if CUI reached ChatGPT, treat it as a potential cyber incident under DFARS 252.204-7012 from the moment you learn of it. That clause requires rapid reporting to DoD — within 72 hours of discovery — via DIBNet, and preservation of relevant system images and monitoring data for at least 90 days. This playbook gives you the sequence. It is an engineering playbook, not legal advice: loop in counsel and your contracts team immediately.</p>

<h2>Hour 0–1: Contain and freeze</h2>
<ol>
  <li><strong>Stop the bleeding.</strong> Identify the account and device involved. Suspend further AI use from that account until scoping is done.</li>
  <li><strong>Capture the conversation.</strong> Screenshot and export the full chat before anything is deleted — you need the exact content for scoping. Deleting the chat does <em>not</em> un-disclose the data, but the record of what was sent is your scoping evidence.</li>
  <li><strong>Preserve, don't clean.</strong> DFARS 7012 requires preserving images of known affected systems and relevant monitoring data for at least 90 days from report submission. Resist the instinct to wipe.</li>
</ol>

<h2>Hour 1–24: Scope the disclosure</h2>
<ol>
  <li><strong>Was it actually CUI?</strong> Check the content against your CUI registry categories and contract markings — contract numbers, CAGE codes, technical specs, export-controlled data (ITAR/EAR), personnel information. Not every internal document is CUI; your answer determines everything downstream.</li>
  <li><strong>Which contract(s)?</strong> Map the data to the covered contracts. This decides who must be notified and what your prime-flowdown obligations are.</li>
  <li><strong>Account and retention settings.</strong> Document whether the ChatGPT account had history/training enabled, whether it was a consumer or enterprise account, and submit a data-deletion request to the vendor — while noting for the record that deletion requests mitigate, not cure.</li>
</ol>

<h2>Hour 24–72: Report</h2>
<ol>
  <li><strong>DIBNet report.</strong> If CUI was involved, DFARS 252.204-7012 directs reporting through DoD's DIBNet portal (dibnet.dod.mil), which requires a DoD-approved medium-assurance certificate — <em>obtain that certificate now, before an incident, because procurement takes days you will not have</em>.</li>
  <li><strong>Notify your prime / contracting officer</strong> per your contract's flowdown clauses. Silence discovered later is worse than the incident.</li>
  <li><strong>Write the internal incident record.</strong> Timeline, content, scope, decisions, notifications — this document is what your C3PAO assessor will read when they test your incident-response practices (NIST 800-171 3.6.1 and 3.6.2).</li>
</ol>

<h2>Week 1+: Corrective action that actually closes the gap</h2>
<p>An assessor's follow-up question is always the same: <em>what stops the next one?</em> A memo re-banning ChatGPT is not a control. The corrective actions that hold up:</p>
<ul>
  <li><strong>Technical enforcement:</strong> route all AI traffic through a local scanning proxy so CUI-bearing prompts are blocked before they leave the network. <a href="/features">HoundShield</a> does this on your own infrastructure (self-hosted Docker) with 16 detection engines and a SHA-256 hash-chained log.</li>
  <li><strong>Evidence going forward:</strong> the same log becomes your standing proof that AI usage is monitored and controlled — turning this incident's corrective action into next assessment's strength.</li>
  <li><strong>A written AI-use policy</strong> tied to the enforcement (see our <a href="/blog/cmmc-ai-use-policy-template">CMMC AI use policy template</a>), plus training that references this exact scenario.</li>
</ul>

<h2>What this incident should teach the SSP</h2>
<p>Map the fix to controls so it strengthens your score instead of just closing a ticket: flow control (3.1.3), boundary monitoring (3.13.1), audit records (3.3.1), incident handling (3.6.1–3.6.2). The full mapping lives in <a href="/blog/nist-800-171-controls-that-map-to-ai-prompt-monitoring">NIST 800-171 controls that map to AI prompt monitoring</a>.</p>
<p>If you want to know whether this is already happening quietly across your team, the <a href="/pricing">$499 CMMC AI Risk Assessment</a> runs 14 days in your environment and reports every AI prompt event, risk-scored against NIST 800-171 — before an assessor or an adversary finds it first.</p>
    `,
  },
  {
    slug: "nist-800-171-controls-that-map-to-ai-prompt-monitoring",
    title: "NIST 800-171 Controls That Map to AI Prompt Monitoring (Full Mapping)",
    description:
      "The mapping of NIST 800-171 Rev 2 controls to AI prompt monitoring — flow control, boundary protection, audit, incident handling — and the evidence for each.",
    excerpt:
      "Which of the 110 NIST 800-171 Rev 2 requirements does AI prompt monitoring actually satisfy? This is the full control-by-control mapping — 3.1.3 flow control, 3.13.1 boundary protection, 3.3.1 audit records, 3.6.x incident handling — with the evidence a C3PAO assessor accepts for each.",
    date: "2026-07-10",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "CMMC Compliance",
    tags: ["NIST 800-171", "CMMC", "control mapping", "SPRS", "audit", "AI monitoring"],
    readingTime: 12,
    featured: false,
    content: `
<p><strong>Bottom line up front:</strong> AI prompt monitoring is not a single checkbox — it produces evidence for a cluster of NIST 800-171 Rev 2 requirements spanning access control (3.1.x), audit and accountability (3.3.x), incident response (3.6.x), and system/communications protection (3.13.x). This post maps each control to what an AI prompt firewall concretely provides, so you can cite it in your SSP and your assessor can test it.</p>

<h2>Why AI usage shows up in a CMMC assessment at all</h2>
<p>Employees sending prompts to ChatGPT, Copilot, or Claude are moving data across your external boundary to systems you do not control. The moment CUI can ride along, that data flow falls squarely inside 800-171's scope. Assessors in 2026 ask about AI usage because it is the newest unmonitored egress path in most environments — and because it is testable: either you can show controlled, logged AI data flows, or you cannot.</p>

<h2>The mapping</h2>
<table>
  <thead><tr><th>Requirement (Rev 2)</th><th>What it says (abridged)</th><th>What AI prompt monitoring provides</th></tr></thead>
  <tbody>
    <tr><td><strong>3.1.3</strong></td><td>Control the flow of CUI in accordance with approved authorizations</td><td>Prompts are inspected against CUI patterns before leaving the network; unauthorized flows are blocked, not just observed</td></tr>
    <tr><td><strong>3.1.20</strong></td><td>Verify and control connections to external systems</td><td>AI endpoints become an enumerated, controlled connection through one proxy — instead of unbounded per-user egress</td></tr>
    <tr><td><strong>3.1.22</strong></td><td>Control CUI posted on publicly accessible systems</td><td>Blocks CUI from being submitted to public AI services in the first place</td></tr>
    <tr><td><strong>3.3.1</strong></td><td>Create and retain system audit logs to enable monitoring and investigation</td><td>Every AI prompt event is logged with timestamp, user, decision, and matched pattern — SHA-256 hash-chained so the record is tamper-evident</td></tr>
    <tr><td><strong>3.3.2</strong></td><td>Ensure individual user actions can be uniquely traced</td><td>Prompt events are attributable to the requesting user/API key</td></tr>
    <tr><td><strong>3.3.8</strong></td><td>Protect audit information from unauthorized modification/deletion</td><td>Hash-chained, append-only log — any tampering breaks the chain verifiably</td></tr>
    <tr><td><strong>3.6.1 / 3.6.2</strong></td><td>Operational incident-handling capability; track, document, and report incidents</td><td>Blocked-prompt events are detection signals with a built-in record; the log feeds your DIBNet timeline if a spill occurs</td></tr>
    <tr><td><strong>3.13.1</strong></td><td>Monitor, control, and protect communications at external boundaries</td><td>The proxy IS a boundary control for AI traffic — monitored, enforced, and evidenced</td></tr>
    <tr><td><strong>3.14.6 / 3.14.7</strong></td><td>Monitor systems to detect attacks and unauthorized use</td><td>Anomalous AI usage (volume spikes, repeated CUI attempts) is surfaced from the same event stream</td></tr>
  </tbody>
</table>
<p><em>Numbering note:</em> you will also see legacy CMMC v1 practice IDs (for example SC.3.177, AU.2.041) used in older documentation and tooling for the same territory. Cite the Rev 2 requirement numbers above in your SSP — that is what assessors test against today.</p>

<h2>What evidence satisfies the assessor</h2>
<ul>
  <li><strong>Architecture:</strong> a data-flow diagram showing AI traffic routed through the local proxy — with scanning inside your boundary. (Deployment mode matters: the CUI-safe claim holds for self-hosted Docker on your infrastructure, not for anyone's hosted trial endpoint.)</li>
  <li><strong>Configuration:</strong> the active detection pattern set and blocking policy.</li>
  <li><strong>Records:</strong> a sample of the hash-chained log showing allowed and blocked events, with chain verification.</li>
  <li><strong>The report:</strong> a signed assessment PDF that risk-scores prompt events against the controls above — the artifact the <a href="/pricing">$499 CMMC AI Risk Assessment</a> produces after 14 days in your environment.</li>
</ul>

<h2>What AI prompt monitoring does NOT satisfy</h2>
<p>Honest scoping keeps SSPs credible. A prompt firewall does not give you MFA (3.5.3), encryption at rest (3.13.16), physical protection (3.10.x), or personnel screening (3.9.x). It is one control family's worth of strong, cheap evidence — not a compliance program. Pair it with the broader checklist in our <a href="/blog/cmmc-level-2-compliance-checklist-2026">CMMC Level 2 compliance checklist</a>.</p>
    `,
  },
  {
    slug: "cmmc-ai-use-policy-template",
    title: "CMMC AI Use Policy Template [Free, Copy-Paste, Control-Mapped]",
    description:
      "A free, copy-paste AI acceptable-use policy template for CMMC Level 2 contractors — mapped to NIST 800-171 flow-control and audit requirements.",
    excerpt:
      "Every contractor needs a written AI use policy before a C3PAO assessment — and most online templates are generic IT policies with 'AI' pasted in. This one is built for CUI environments: scope, prohibitions, enforcement, logging, and incident response, each mapped to its NIST 800-171 requirement.",
    date: "2026-07-10",
    author: "HoundShield Security Team",
    authorTitle: "AI Compliance Engineers",
    category: "How-To",
    tags: ["CMMC", "policy template", "AI acceptable use", "NIST 800-171", "CUI", "free template"],
    readingTime: 8,
    featured: false,
    content: `
<p><strong>What this is:</strong> a complete, copy-paste AI acceptable-use policy for organizations handling CUI, with each section mapped to the NIST 800-171 Rev 2 requirement it supports. A policy alone is not a control — the enforcement section below is what turns it into one — but assessors do expect the written artifact, and this saves you writing it from scratch.</p>

<h2>How to use this template</h2>
<ol>
  <li>Replace bracketed placeholders with your organization's specifics.</li>
  <li>Have leadership and counsel review — especially the incident-response section against your actual DFARS contracts.</li>
  <li>Publish it, train on it, and wire the technical enforcement so the policy describes reality.</li>
</ol>

<h2>The template</h2>

<h3>1. Purpose and scope</h3>
<p><em>[Organization] permits the use of generative AI tools to improve productivity, subject to the controls in this policy. This policy applies to all employees, contractors, and systems that access [Organization]'s network or handle Controlled Unclassified Information (CUI). It supports [Organization]'s obligations under DFARS 252.204-7012 and NIST SP 800-171.</em></p>

<h3>2. Approved AI tools and pathway (maps to 3.1.20 — external connections)</h3>
<p><em>AI tools may be used only through [Organization]'s approved AI gateway at [proxy address]. Direct access to AI services that bypasses the gateway is prohibited on organizational systems. The approved tool list is maintained by [role] and reviewed quarterly.</em></p>

<h3>3. Prohibited content (maps to 3.1.3 — CUI flow control)</h3>
<p><em>The following must never be entered into any AI tool, regardless of pathway: CUI in any form (including contract numbers, CAGE codes, technical data, and program details); ITAR/EAR-controlled technical data; personnel or clearance information; customer data governed by contract; authentication secrets. When in doubt, treat content as CUI and do not submit it.</em></p>

<h3>4. Technical enforcement (maps to 3.13.1 — boundary protection)</h3>
<p><em>All AI traffic is routed through a locally hosted scanning proxy that inspects prompts on [Organization]'s own infrastructure before transmission. Prompts matching CUI, export-control, or PII patterns are blocked automatically. The scanning system runs within [Organization]'s network boundary; prompt content is not transmitted to any third party for inspection.</em></p>

<h3>5. Logging and audit (maps to 3.3.1, 3.3.2, 3.3.8)</h3>
<p><em>Every AI prompt event — allowed or blocked — is recorded in a tamper-evident, hash-chained audit log attributing the event to an individual user. Audit records are retained for [retention period, e.g. 3 years] and are protected from modification. Logs are reviewed [weekly/monthly] by [role].</em></p>

<h3>6. Incident response (maps to 3.6.1, 3.6.2)</h3>
<p><em>Suspected submission of CUI to an AI tool must be reported to [security contact] immediately. [Organization] will assess scope, preserve evidence, and where required report through DIBNet within 72 hours of discovery per DFARS 252.204-7012. See [incident-response plan reference].</em></p>

<h3>7. Training and acknowledgment</h3>
<p><em>All personnel complete AI-use training at onboarding and annually. Each employee acknowledges this policy in writing. Violations are handled under [disciplinary policy].</em></p>

<h3>8. Review</h3>
<p><em>This policy is reviewed [annually] by [owner] and after any AI-related security incident.</em></p>

<h2>Making it real</h2>
<p>Section 4 is the one assessors probe: a policy that says "employees must not paste CUI" with no enforcement is an honor system, and honor systems fail audits. The enforcement architecture — local scanning, blocking, hash-chained logs — is exactly what <a href="/docs">HoundShield deploys in minutes as self-hosted Docker</a>. If an incident has already happened, start with the <a href="/blog/employee-pasted-cui-into-chatgpt-incident-response-playbook">incident-response playbook</a>; to baseline what your team is actually sending to AI tools today, run the <a href="/pricing">$499 assessment</a> and attach its PDF to this policy as evidence.</p>
    `,
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter((p) => p.featured);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}
