export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  publishedAt: string;
  readingTimeMin: number;
  category: string;
  tags: string[];
  excerpt: string;
  content: BlogSection[];
}

export interface BlogSection {
  type: "h2" | "h3" | "p" | "callout" | "code" | "list" | "table";
  text?: string;
  variant?: "warning" | "info" | "success" | "danger";
  items?: string[];
  language?: string;
  rows?: string[][];
  headers?: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-cloud-ai-dlp-violates-dfars-7012",
    title: "Why Cloud-Based AI DLP Violates DFARS 7012",
    subtitle: "Nightfall, Strac, and Microsoft Purview all send your data to the cloud. Under DFARS 252.204-7012, that's a reportable incident waiting to happen.",
    publishedAt: "2026-05-03",
    readingTimeMin: 8,
    category: "CMMC Compliance",
    tags: ["CMMC", "DFARS", "CUI", "DLP", "AI Security"],
    excerpt:
      "Every time your employees paste a contract number into ChatGPT, Nightfall's cloud scanner reads it. Under DFARS 252.204-7012, that's a data flow requiring a cloud service provider agreement — one your vendor almost certainly doesn't have.",
    content: [
      {
        type: "callout",
        variant: "warning",
        text: "Bottom line up front: If your AI data-loss prevention tool sends prompt content to a cloud scanning service, it is itself a DFARS 252.204-7012 compliance event. This post explains exactly why, and what the only architecturally compliant alternative looks like.",
      },
      {
        type: "h2",
        text: "What DFARS 252.204-7012 Actually Requires",
      },
      {
        type: "p",
        text: "DFARS 252.204-7012, 'Safeguarding Covered Defense Information and Cyber Incident Reporting,' is the contract clause that flows down from the Pentagon to every prime contractor and subcontractor in the Defense Industrial Base. It has two teeth:",
      },
      {
        type: "list",
        items: [
          "Adequate security: Implement NIST SP 800-171 on all systems that process, store, or transmit Covered Defense Information (CDI) — the superset of CUI.",
          "Rapid reporting: Report any cyber incident to DoD within 72 hours, preserve images of compromised systems, and submit a malware sample if relevant.",
        ],
      },
      {
        type: "p",
        text: "The phrase 'process, store, or transmit' is where most vendors go wrong. If a system touches CUI — even ephemerally, even for 200 milliseconds to run a regex scan — it is in scope. Full stop.",
      },
      {
        type: "h2",
        text: "The Cloud DLP Architecture Problem",
      },
      {
        type: "p",
        text: "Traditional DLP tools like Nightfall, Strac, and Microsoft Purview were designed for a world before AI chat. Their architecture works like this: your employees' text flows through the vendor's cloud API, where it's scanned for sensitive patterns, then either blocked or allowed through. The vendor's servers process your prompts.",
      },
      {
        type: "p",
        text: "This creates a specific DFARS problem: the vendor's cloud infrastructure is now a system that processes CDI. Under 7012, that cloud environment must itself meet NIST 800-171 — or the vendor must be a FedRAMP-authorized cloud service provider.",
      },
      {
        type: "callout",
        variant: "danger",
        text: "Check your DLP vendor's compliance documentation right now. Does it say 'FedRAMP Authorized'? Not 'FedRAMP Ready.' Not 'FedRAMP In Process.' Authorized. If not, you have an unauthorized external system processing your CDI.",
      },
      {
        type: "h2",
        text: "Why None of the Major AI DLP Vendors Qualify",
      },
      {
        type: "table",
        headers: ["Vendor", "Architecture", "FedRAMP Status", "DFARS 7012 Compliant?"],
        rows: [
          ["Nightfall AI", "Cloud API (SaaS)", "Not Authorized", "No"],
          ["Strac", "Cloud API (SaaS)", "Not Authorized", "No"],
          ["Microsoft Purview", "Azure cloud", "Azure Gov only — not the commercial DLP tier", "No (commercial)"],
          ["Forcepoint", "Cloud-hybrid", "In Process", "No"],
          ["HoundShield", "Local proxy — on-prem", "N/A (data never leaves)", "Yes"],
        ],
      },
      {
        type: "p",
        text: "Microsoft is the subtlest trap. Azure Government has FedRAMP High authorization. But Microsoft Purview for AI prompt scanning runs on commercial Azure infrastructure, not Azure Government. If your tenant is commercial M365, Purview's AI DLP does not run in the FedRAMP-authorized boundary.",
      },
      {
        type: "h2",
        text: "The Specific Regulation Text",
      },
      {
        type: "p",
        text: "Here's the operative section of DFARS 252.204-7012(b)(2)(ii)(D):",
      },
      {
        type: "callout",
        variant: "info",
        text: "\"...the contractor shall ensure that the cloud service provider meets security requirements equivalent to those established by the Government for the Federal Risk and Authorization Management Program (FedRAMP) Moderate baseline and that the cloud service provider complies with requirements in paragraphs (c) through (g) of this clause for cyber incident reporting, malicious software, media preservation and protection, access to additional information and equipment necessary for forensic analysis, and cyber incident damage assessment.\"",
      },
      {
        type: "p",
        text: "The word 'equivalent' matters. FedRAMP Moderate is the minimum. A vendor claiming SOC 2 Type II, ISO 27001, or NIST 800-53 compliance is not a substitute — those are different frameworks and explicitly do not satisfy the 7012 cloud service provider requirement.",
      },
      {
        type: "h2",
        text: "What an Unauthorized Data Flow Looks Like",
      },
      {
        type: "p",
        text: "Here's a concrete scenario. Your engineer at an aerospace contractor pastes a work order with a CAGE code and contract number into ChatGPT. You have Nightfall installed as your AI DLP. This is what happens:",
      },
      {
        type: "list",
        items: [
          "The ChatGPT browser extension or proxy intercepts the prompt.",
          "Nightfall's cloud API receives the full prompt text — including the CAGE code and contract number — for classification.",
          "Nightfall's cloud infrastructure (not FedRAMP authorized) has now processed CDI.",
          "Under DFARS 7012(c), this is a 'cyber incident' requiring DoD notification within 72 hours.",
          "If your contract requires CMMC Level 2 certification, this event will appear in your SPRS record.",
        ],
      },
      {
        type: "p",
        text: "The irony: you deployed DLP to prevent data exfiltration and created an unauthorized data flow in the process.",
      },
      {
        type: "h2",
        text: "The Architecturally Correct Alternative",
      },
      {
        type: "p",
        text: "The only DFARS-compliant AI DLP architecture is one where the scanning happens before the prompt leaves your network. This means:",
      },
      {
        type: "list",
        items: [
          "A proxy that runs on-premises or on a machine your organization controls",
          "Pattern matching engines that execute locally — no cloud API calls with prompt content",
          "Audit logs that stay on your infrastructure",
          "License validation that only sends a hash — never prompt content",
        ],
      },
      {
        type: "code",
        language: "bash",
        text: "# HoundShield proxy — inspect what actually leaves your network\n# All pattern matching runs locally. Zero prompt content transmitted.\ncurl -s http://localhost:8765/status | jq .data_boundary\n# → {\"prompt_content_leaves_network\": false, \"license_hash_transmitted\": true}",
      },
      {
        type: "p",
        text: "This is the architecture HoundShield is built on. The proxy server runs on a machine in your environment. The 16-pattern CUI/PII/PHI detection engine executes in Node.js, in memory, on your hardware. The only external communication is a SHA-256 hash of your license key plus a prompt count — no prompt text, no entity values, no CUI.",
      },
      {
        type: "h2",
        text: "The SPRS Implications",
      },
      {
        type: "p",
        text: "CMMC assessors are now specifically asking about AI tool usage. Practice 3.13.1 (boundary protection) and 3.13.2 (network traffic control) in NIST 800-171 Rev 2 directly apply to the prompt data flows you create. If your C3PAO finds that your DLP vendor is an unauthorized external processor, you are looking at deficiencies that affect your SPRS score across at least three practices:",
      },
      {
        type: "list",
        items: [
          "3.13.1: Boundary protection — unauthorized data flow to non-FedRAMP cloud",
          "3.13.8: Cryptographic mechanisms for network transmission — vendor may not meet requirements",
          "3.12.3: Security control monitoring — you cannot monitor what happens inside the vendor's infrastructure",
        ],
      },
      {
        type: "p",
        text: "Three deficiencies at typical SPRS weights could cost you 15-30 points on a scale that runs from -203 to 110. At the low end of the DoD contractor range, that may push your score below contractual minimums.",
      },
      {
        type: "h2",
        text: "What To Do Right Now",
      },
      {
        type: "list",
        items: [
          "Audit every AI tool your team uses: ChatGPT, Claude, Copilot, Gemini, LangChain-based internal tools",
          "Map the data flow: where does each prompt go before the AI sees it?",
          "Check every DLP/monitoring tool in that path for FedRAMP authorization status",
          "Replace any cloud-scanning DLP with a local-only proxy before your CMMC assessment",
          "Document your data flows in your System Security Plan (SSP) before the C3PAO asks",
        ],
      },
      {
        type: "callout",
        variant: "success",
        text: "HoundShield is free for up to 5 users. You can deploy the proxy, run a CUI scan on your team's AI usage, and have evidence-quality audit logs ready for your C3PAO in under 15 minutes. No cloud service provider agreement required — because no data leaves your network.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
