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
<p>HoundShield intercepts every AI API call before it leaves your network. It runs pattern matching against 200+ CUI indicators (CAGE codes, contract numbers, classification markings, clearance levels, PHI markers) in under 10ms. Blocked requests never reach the external AI service. Every decision creates an immutable log entry.</p>
<p>Setup is one line: point your AI tool's API base URL to your HoundShield endpoint instead of api.openai.com. No code changes. No agent installation on every machine. One network-level change covers your entire organization.</p>
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
