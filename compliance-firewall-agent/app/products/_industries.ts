/**
 * Industry product-page content — one HoundShield firewall, every framework.
 * Single source of truth for /products/[industry] routes, the NavV3 mega-menu,
 * and the sitemap. Copy is ported from the approved Direction-A spec; every
 * statistic is attributed and no capability is overstated (FedRAMP = roadmap).
 */

export type ControlStatus =
  | "Enforced"
  | "Logged"
  | "Alerted"
  | "Live"
  | "Roadmap";

export interface FrameworkRow {
  control: string;
  detail: string;
  status: ControlStatus;
}

export interface ProductStep {
  title: string;
  body: string;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface Industry {
  slug: string;
  navLabel: string;
  eyebrow: string;
  comingSoon?: boolean;
  h1: string;
  sub: string;
  metaTitle: string;
  metaDescription: string;
  whatItIs: string;
  whoFor: string;
  howUse: string;
  detects: string[];
  steps: ProductStep[];
  frameworkTitle: string;
  framework: FrameworkRow[];
  faqs: ProductFaq[];
  cta: { title: string; body: string; button: string; href: string };
  primaryCtaHref: string;
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "technology",
    navLabel: "Technology",
    eyebrow: "Technology · SOC 2 · AI Governance",
    h1: "Your engineers paste secrets into Copilot. HoundShield catches them.",
    sub: "Every developer using ChatGPT, Copilot or Cursor is one paste away from leaking an API key, a credential, or proprietary source. HoundShield inspects each prompt on your hardware and blocks the leak before it reaches the model — no behavior change for your team.",
    metaTitle: "AI DLP for Engineering Teams (SOC 2) | HoundShield",
    metaDescription:
      "Stop engineers leaking API keys, credentials and source code into ChatGPT and Copilot. HoundShield scans every AI prompt locally and blocks secrets before they leave — SOC 2 evidence included.",
    whatItIs:
      "An OpenAI-compatible proxy that sits in front of every AI tool your engineers use and scans prompts for secrets and source before they leave the network.",
    whoFor:
      "CTOs, platform & security engineers, and anyone preparing for SOC 2 who can't see what their team is pasting into AI.",
    howUse:
      "Change one base URL in your AI SDK or IDE. Secrets are blocked in under 10ms, logged as SOC 2 evidence, and your devs never notice.",
    detects: [
      "API keys & tokens",
      "AWS / cloud keys",
      "JWT / OAuth secrets",
      "Source code",
      "Internal hostnames",
      "Customer PII",
      "DB connection strings",
      "Private IP ranges",
    ],
    steps: [
      {
        title: "Point your tools at HoundShield",
        body: "Set the base URL in Copilot, Cursor or your OpenAI SDK. No installs, no agents.",
      },
      {
        title: "Secrets get blocked locally",
        body: "A pasted key or proprietary file is caught on your hardware and never reaches the provider.",
      },
      {
        title: "SOC 2 evidence writes itself",
        body: "Every decision lands in a SHA-256 audit log your auditor can export.",
      },
    ],
    frameworkTitle: "How HoundShield supports SOC 2",
    framework: [
      {
        control: "CC6.1 — Logical access",
        detail: "API keys and credentials blocked before they leave the network",
        status: "Enforced",
      },
      {
        control: "CC6.7 — Data in transit",
        detail: "Every AI prompt inspected at the egress boundary",
        status: "Enforced",
      },
      {
        control: "CC7.2 — System monitoring",
        detail: "SHA-256 tamper-evident log of every request",
        status: "Logged",
      },
      {
        control: "CC7.3 — Incident detection",
        detail: "Real-time alerts on blocked prompts",
        status: "Alerted",
      },
    ],
    faqs: [
      {
        q: "Does it slow my engineers down?",
        a: "No. Median scan time is under 10ms and it's a drop-in base-URL change — your team won't notice it until it stops a leak.",
      },
      {
        q: "Can HoundShield see our source code?",
        a: "No. Detection runs entirely on your hardware. Prompts, keys and code are never sent to HoundShield servers.",
      },
      {
        q: "Which AI tools does it cover?",
        a: "Anything that speaks the OpenAI API — ChatGPT, Copilot, Cursor, Claude via gateway, and your own SDK calls. You point the base URL at HoundShield.",
      },
      {
        q: "What happens to a blocked prompt?",
        a: "It's stopped at the boundary, the offending entity is redacted or quarantined for review, and the event is written to the audit log. The user gets immediate feedback.",
      },
    ],
    cta: {
      title: "The average data breach costs $4.45M",
      body: "That figure is from IBM's 2023 Cost of a Data Breach report. HoundShield costs less than one engineer-hour a month. Start free, no card.",
      button: "Protect your team",
      href: "/signup",
    },
    primaryCtaHref: "/signup",
  },
  {
    slug: "healthcare",
    navLabel: "Healthcare",
    eyebrow: "Healthcare · HIPAA · 45 CFR Part 164",
    h1: "Clinicians paste PHI into AI every day. Make it a non-event.",
    sub: "Documentation, billing and summarization tools are too useful to ban — but every patient record pasted into them is a HIPAA disclosure. HoundShield detects PHI on your hardware and blocks or quarantines it before it reaches any model, satisfying minimum-necessary and audit requirements.",
    metaTitle: "HIPAA-Safe AI for Healthcare | HoundShield",
    metaDescription:
      "Let clinicians use AI documentation tools without disclosing PHI. HoundShield detects patient data locally and blocks it before it reaches any model — mapped to 45 CFR Part 164.",
    whatItIs:
      "A local proxy that scans every AI prompt for protected health information before it leaves your facility's network.",
    whoFor:
      "CISOs, compliance officers and privacy leads at hospitals, clinics, payers and digital-health companies.",
    howUse:
      "Route your documentation AI through HoundShield. PHI is held for human review or stripped — clinicians keep working.",
    detects: [
      "MRN / patient ID",
      "ICD / diagnosis codes",
      "Patient names + DOB",
      "SSN",
      "Insurance / member IDs",
      "Lab & imaging results",
      "Prescriptions",
      "Provider NPI",
    ],
    steps: [
      {
        title: "Route documentation AI through HoundShield",
        body: "One URL change for your scribe, coding or summarization tool.",
      },
      {
        title: "PHI is blocked or quarantined",
        body: "The exact identifier is flagged on-device; nothing reaches the model unreviewed.",
      },
      {
        title: "Audit-ready for OCR",
        body: "Tamper-evident logs map to 45 CFR 164 access & disclosure requirements.",
      },
    ],
    frameworkTitle: "How HoundShield supports HIPAA (45 CFR 164)",
    framework: [
      {
        control: "164.312(a)(1) — Access control",
        detail: "PHI blocked before it can be disclosed to a model",
        status: "Enforced",
      },
      {
        control: "164.312(b) — Audit controls",
        detail: "Tamper-evident log of every prompt decision",
        status: "Logged",
      },
      {
        control: "164.502(b) — Minimum necessary",
        detail: "PHI stripped or held for review before the model sees it",
        status: "Enforced",
      },
      {
        control: "164.308(a)(6) — Incident response",
        detail: "Real-time alerts when PHI is caught in a prompt",
        status: "Alerted",
      },
    ],
    faqs: [
      {
        q: "Do you receive our PHI? Is a BAA needed?",
        a: "Detection runs on your hardware and we never receive PHI, so HoundShield isn't a typical cloud BAA exposure — and we still sign a BAA on paid plans.",
      },
      {
        q: "Will it block clinicians from working?",
        a: "No. Clean prompts pass through; only PHI is held for review or stripped, so documentation keeps flowing.",
      },
      {
        q: "Does it cover ambient scribe and coding tools?",
        a: "Yes. Any AI tool that speaks the OpenAI API can be routed through the gateway, including scribe, medical-coding and summarization assistants.",
      },
      {
        q: "How is quarantined PHI stored?",
        a: "Quarantined content is encrypted at rest with AES-256 and only released after human review. Raw prompt content is never stored in plaintext.",
      },
    ],
    cta: {
      title: "HIPAA settlements have reached $16M",
      body: "HHS OCR penalties run from tens of thousands into eight figures (Anthem settled for $16M). Let your team use AI without becoming the next enforcement headline.",
      button: "Protect PHI",
      href: "/signup",
    },
    primaryCtaHref: "/signup",
  },
  {
    slug: "defense",
    navLabel: "Defense",
    eyebrow: "Defense · CMMC Level 2 · NIST 800-171",
    h1: "Leak CUI into ChatGPT and you've failed your C3PAO assessment.",
    sub: "Roughly 80,000 DoD contractors must reach CMMC Level 2 to keep their contracts, and AI prompt leakage is the most common unaddressed gap in the defense industrial base. HoundShield blocks CUI, CAGE codes and contract data locally — the only architecture that doesn't itself create a DFARS 7012 spill — and generates the SSP, POA&M and SPRS evidence your assessor needs.",
    metaTitle: "CMMC Level 2 AI Firewall for Defense Contractors | HoundShield",
    metaDescription:
      "Defense contractors can use AI without failing CMMC. HoundShield blocks CUI, CAGE codes and contract data locally before prompts leave the network — and exports C3PAO-ready SSP, POA&M and SPRS evidence.",
    whatItIs:
      "A local-only AI firewall plus a full CMMC suite: 110-control assessment, live SPRS scoring and C3PAO-ready document export.",
    whoFor:
      "ISSOs and IT security managers at 50–500 person defense contractors preparing for a C3PAO assessment.",
    howUse:
      "One URL change routes your team's AI through the gateway; the dashboard tracks your SPRS score and open controls in real time.",
    detects: [
      "CUI markings",
      "CAGE codes",
      "Contract / DoDAAC #",
      "Clearance levels",
      "ITAR / EAR terms",
      "Export-control data",
      "Personnel PII",
      "Technical drawings",
    ],
    steps: [
      {
        title: "Change one URL",
        body: "Point ChatGPT, Copilot or Claude at your HoundShield proxy. Live in 10 minutes.",
      },
      {
        title: "CUI is blocked locally",
        body: "Nothing leaves your network — so HoundShield itself can never cause a DFARS 7012 spill.",
      },
      {
        title: "Export C3PAO evidence",
        body: "Generate your SSP, POA&M and SPRS attestation as SHA-256 signed PDFs on demand.",
      },
    ],
    frameworkTitle: "How HoundShield supports CMMC L2 / NIST 800-171",
    framework: [
      {
        control: "3.1 — Access Control",
        detail: "CUI blocked at the AI egress point",
        status: "Enforced",
      },
      {
        control: "3.3 — Audit & Accountability",
        detail: "SHA-256 signed log of every prompt",
        status: "Logged",
      },
      {
        control: "3.13 — System & Comms Protection",
        detail: "Prompt content never leaves your boundary",
        status: "Enforced",
      },
      {
        control: "3.14 — System & Info Integrity",
        detail: "Real-time CUI-leak detection & quarantine",
        status: "Alerted",
      },
    ],
    faqs: [
      {
        q: "Does HoundShield itself cause a DFARS 7012 spill?",
        a: "No — and that's the entire point. Detection is local; CUI never transits to us. Cloud DLP tools that scan in their own cloud can't make that claim.",
      },
      {
        q: "Does it generate C3PAO evidence?",
        a: "Yes. Your SSP, POA&M and SPRS attestation export as SHA-256-signed PDFs, mapped to all 110 controls.",
      },
      {
        q: "How long does deployment take?",
        a: "Most teams are live in under 10 minutes — it's a single base-URL change with a Docker deployment. No agent installs on individual machines.",
      },
      {
        q: "Can we run it fully on-prem or air-gapped?",
        a: "Yes. HoundShield runs self-hosted via Docker for CUI workloads, and air-gapped for the most sensitive environments.",
      },
    ],
    cta: {
      title: "A C3PAO assessment is estimated at $31k–$150k",
      body: "Industry estimates put a Level 2 assessment in the tens to low hundreds of thousands. Don't fail it on an AI leak. One URL change. 10 minutes. C3PAO-ready.",
      button: "Protect your CUI",
      href: "/signup",
    },
    primaryCtaHref: "/signup",
  },
  {
    slug: "legal",
    navLabel: "Legal & Finance",
    eyebrow: "Legal & Finance · SOC 2 · PCI DSS",
    h1: "Privileged and cardholder data shouldn't train someone else's model.",
    sub: "Lawyers and analysts paste privileged matters, deal terms and account data into AI to move faster. HoundShield scans every prompt locally and blocks privileged, PII and PCI data before it leaves — protecting attorney-client privilege and your PCI scope at the same time.",
    metaTitle: "AI Data Firewall for Legal & Finance | HoundShield",
    metaDescription:
      "Keep privileged matters, MNPI and cardholder data out of public AI models. HoundShield scans every prompt locally and blocks privileged, PII and PCI data — protecting privilege and PCI scope.",
    whatItIs:
      "A local AI gateway that keeps privileged and regulated financial data out of public models.",
    whoFor:
      "GCs, compliance and infosec leads at law firms, banks, funds and fintechs.",
    howUse:
      "Route your AI tools through HoundShield; privileged and PCI content is blocked and logged for audit.",
    detects: [
      "Privilege markings",
      "Matter / case numbers",
      "PCI card data",
      "Bank account #",
      "SSN / TIN",
      "MNPI / deal terms",
      "Client PII",
      "Routing numbers",
    ],
    steps: [
      {
        title: "Route your AI through the gateway",
        body: "One URL change for your research and drafting tools.",
      },
      {
        title: "Privileged & PCI data blocked",
        body: "Caught locally, so privilege is preserved and your PCI scope stays small.",
      },
      {
        title: "Defensible audit trail",
        body: "Signed logs for SOC 2, PCI DSS and bar-association reviews.",
      },
    ],
    frameworkTitle: "How HoundShield supports PCI DSS & privilege",
    framework: [
      {
        control: "PCI DSS Req. 3 — Protect stored data",
        detail: "Cardholder data blocked before it reaches a model",
        status: "Enforced",
      },
      {
        control: "PCI DSS Req. 4 — Protect transmission",
        detail: "AI egress inspected on-device",
        status: "Enforced",
      },
      {
        control: "Attorney-client privilege",
        detail: "Privileged markings detected and held locally",
        status: "Enforced",
      },
      {
        control: "SOC 2 CC7 — Monitoring",
        detail: "Full audit trail for review",
        status: "Logged",
      },
    ],
    faqs: [
      {
        q: "Does this shrink our PCI scope?",
        a: "It stops cardholder data reaching external models, reducing your AI tools' exposure. It's a strong control, not a scope guarantee — confirm treatment with your QSA.",
      },
      {
        q: "How does it protect privilege?",
        a: "Privileged content is caught locally and never disclosed to a third-party model, avoiding an inadvertent waiver.",
      },
      {
        q: "Can compliance review what was blocked?",
        a: "Yes. Every decision is written to a signed, timestamped audit trail you can export for SOC 2, PCI DSS and bar-association reviews.",
      },
      {
        q: "Does it work with our existing AI tools?",
        a: "Yes — any OpenAI-compatible research or drafting tool routes through HoundShield with a single base-URL change.",
      },
    ],
    cta: {
      title: "One privileged leak can sink a case",
      body: "Give your team AI speed without the malpractice or PCI risk. Start free, no card.",
      button: "Protect privilege",
      href: "/signup",
    },
    primaryCtaHref: "/signup",
  },
  {
    slug: "global",
    navLabel: "Five Eyes / Global",
    eyebrow: "Five Eyes / Global · DISP · ASD Essential Eight",
    h1: "Allied data should never leave allied soil. Keep it local.",
    sub: "International defence and government suppliers navigating AUKUS, DISP and allied frameworks can't route classified-adjacent data through a US cloud. HoundShield runs entirely on your own infrastructure, in your own country, so caveated and export-controlled data is detected and contained on-prem.",
    metaTitle: "Sovereign AI Firewall for Five Eyes & Allied Suppliers | HoundShield",
    metaDescription:
      "A sovereign, local-only AI firewall for AUKUS, DISP and ASD Essential Eight. Caveated and export-controlled data is detected on your own infrastructure — nothing crosses a border or hits a vendor cloud.",
    whatItIs:
      "A sovereign, local-only AI firewall you host yourself — no data crosses a border or hits a vendor cloud.",
    whoFor:
      "Defence primes and suppliers across AU, UK, CA and NZ working to DISP and Essential Eight.",
    howUse:
      "Deploy on-prem or air-gapped; caveated markings and export-control terms are caught before AI use.",
    detects: [
      "AUSTEO / REL caveats",
      "Protective markings",
      "ITAR / export-control",
      "National security data",
      "Personnel PII",
      "Programme codewords",
      "Technical data",
      "Supplier IP",
    ],
    steps: [
      {
        title: "Deploy on your own infrastructure",
        body: "Run HoundShield on-prem or air-gapped, inside your own country's boundary.",
      },
      {
        title: "Caveated data is contained locally",
        body: "Protective markings and export-control terms are detected before any prompt reaches a model.",
      },
      {
        title: "Evidence for accreditation",
        body: "Signed audit logs support your authority to operate — and HoundShield never phones home.",
      },
    ],
    frameworkTitle: "How HoundShield supports allied frameworks",
    framework: [
      {
        control: "DISP — Data security",
        detail: "Data stays on your sovereign infrastructure",
        status: "Enforced",
      },
      {
        control: "ASD Essential Eight",
        detail: "Egress control on every AI interaction",
        status: "Enforced",
      },
      {
        control: "Export control (ITAR / EAR)",
        detail: "Controlled terms & caveats detected pre-model",
        status: "Enforced",
      },
      {
        control: "Accreditation audit",
        detail: "Signed logs for your authority to operate",
        status: "Logged",
      },
    ],
    faqs: [
      {
        q: "Where does our data physically go?",
        a: "Nowhere outside your environment. Deploy on-prem or air-gapped; HoundShield never phones home — to us or anyone.",
      },
      {
        q: "Does it work offline / air-gapped?",
        a: "Yes. Detection is fully local; only the AI provider you choose needs outbound connectivity.",
      },
      {
        q: "Can it detect our national caveats and codewords?",
        a: "Yes. Detection patterns extend to AUSTEO/REL caveats, protective markings and programme codewords on top of the standard 16 engines.",
      },
      {
        q: "Who hosts it?",
        a: "You do. There is no HoundShield cloud in the data path — sovereignty is a property of the architecture, not a contractual promise.",
      },
    ],
    cta: {
      title: "Sovereign by architecture",
      body: "The only AI compliance firewall that never phones home — to anyone.",
      button: "Book a sovereign deployment",
      href: "/partners",
    },
    primaryCtaHref: "/partners",
  },
  {
    slug: "government",
    navLabel: "Government",
    eyebrow: "Government · FedRAMP · FISMA",
    comingSoon: true,
    h1: "Agencies are adopting AI faster than they can govern it.",
    sub: "Public-sector teams want AI productivity without a compliant data-handling framework. HoundShield gives agencies an on-prem AI firewall that keeps CUI and citizen PII inside the boundary — FedRAMP and FISMA alignment is on the roadmap.",
    metaTitle: "On-Prem AI Firewall for Government Agencies | HoundShield",
    metaDescription:
      "An on-prem AI firewall that keeps CUI and citizen PII inside an agency boundary. CUI/FOUO handling is live today; FISMA control mapping and FedRAMP authorization are on the roadmap.",
    whatItIs:
      "An on-prem AI gateway that enforces data-handling policy on every prompt inside an agency boundary.",
    whoFor:
      "Agency CIOs/CISOs and program offices piloting generative AI under FISMA.",
    howUse:
      "Deploy inside your ATO boundary; CUI and PII are detected and contained before any model call.",
    detects: [
      "CUI / FOUO",
      "Citizen PII",
      "SSN / records",
      "Law-enforcement data",
      "Procurement-sensitive",
      "Geospatial / infra",
      "Health (CMS)",
      "Tax data",
    ],
    steps: [
      {
        title: "Deploy inside your ATO boundary",
        body: "HoundShield runs on-prem, inside your existing authorization boundary.",
      },
      {
        title: "CUI & citizen PII contained",
        body: "Sensitive data is detected and held before any model call — nothing leaves the boundary.",
      },
      {
        title: "Signed evidence for review",
        body: "Tamper-evident logs of every prompt support audit and oversight.",
      },
    ],
    frameworkTitle: "Where the public-sector edition stands today",
    framework: [
      {
        control: "CUI / FOUO handling",
        detail: "Detected before the model — on-prem, available today",
        status: "Live",
      },
      {
        control: "Audit & accountability",
        detail: "Signed logs of every prompt",
        status: "Live",
      },
      {
        control: "FISMA control alignment",
        detail: "Mapping in progress",
        status: "Roadmap",
      },
      {
        control: "FedRAMP authorization",
        detail: "Planned — not yet authorized",
        status: "Roadmap",
      },
    ],
    faqs: [
      {
        q: "Can we deploy today?",
        a: "Yes — on-prem inside your existing boundary. FedRAMP authorization is on the roadmap and not yet complete, so we're upfront about that.",
      },
      {
        q: "Does anything leave our ATO boundary?",
        a: "No. HoundShield runs inside your boundary and never sends data out.",
      },
      {
        q: "Is HoundShield FedRAMP authorized?",
        a: "Not yet. FedRAMP authorization and full FISMA control mapping are on the roadmap. The on-prem CUI/FOUO controls are available today.",
      },
    ],
    cta: {
      title: "Be first in line for the public-sector edition",
      body: "Join the waitlist and we'll bring you in as FISMA mapping and FedRAMP authorization land.",
      button: "Join the waitlist",
      href: "/partners",
    },
    primaryCtaHref: "/partners",
  },
];

export const INDUSTRY_SLUGS = INDUSTRIES.map((i) => i.slug);

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
