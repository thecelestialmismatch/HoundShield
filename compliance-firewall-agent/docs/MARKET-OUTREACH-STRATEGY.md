# Market and Outreach Strategy

**Research date:** 17 August 2026  
**Purpose:** Define an evidence-led launch motion for HoundShield without overstating product scope or regulatory conclusions.

## Market signal

The AI data-protection market is converging on three buyer expectations: visibility across AI activity, enforcement at the point of data movement, and evidence for an existing governance programme. Nightfall markets broad coverage across AI agents, MCP servers, endpoints, SaaS, email, and browsers, with endpoint/browser agents, integrations, detection, lineage, remediation, and customer proof.[1] Microsoft Purview positions AI risk management as an extension of data classification, DLP, audit, retention, eDiscovery, endpoint controls, and DSPM across Microsoft and supported enterprise/third-party AI contexts.[2]

For defence contractors handling CUI, the architecture and system boundary are the decision point. The Cloud Security Alliance’s 2026 CMMC Level 2 guide explains that AI platforms processing, storing, or transmitting CUI must be evaluated under the applicable cloud-use requirements; it recommends approved boundaries, technical safeguards, documented SSP scope, access controls, auditability, and ongoing monitoring.[3] HoundShield should therefore not promise universal CMMC compliance. It should offer a **self-hosted control path and an evidence-oriented assessment** that helps the buyer document how compatible AI traffic is governed within their chosen boundary.

## Positioning decision

> **HoundShield is not “Nightfall for smaller companies” and not “a replacement for Microsoft Purview.” It is a self-hosted AI prompt-control and evidence workflow for regulated teams that need to prove what crosses their approved boundary.**

| Buyer situation | Correct HoundShield message | Do not claim |
|---|---|---|
| Defence contractor preparing for CMMC Level 2 | “Map approved AI use, put compatible traffic through a self-hosted control path, and assemble evidence for your SSP and assessment.” | “This makes you CMMC compliant” or “all CUI is safe in every AI tool.” |
| Microsoft 365-heavy organisation | “Use HoundShield alongside Purview when you need an explicit control path for AI services and developer tools outside the M365 productivity surface.” | “Purview cannot protect third-party AI” or “replace Purview.” |
| SaaS/security team comparing broad DLP | “If browser/endpoint/SaaS-wide coverage is the priority, evaluate a broad DLP platform. If the priority is a contained AI prompt boundary and evidence workflow, evaluate HoundShield.” | “HoundShield has equivalent enterprise endpoint/browser coverage.” |
| HIPAA-sensitive team | “Use the self-hosted path to assess compatible prompt controls and document your data flow; validate every workload with your privacy/security programme.” | “HIPAA-certified” or “the hosted demo is appropriate for PHI.” |

## ICP and outreach sequence

The recommended first ICP is a **20–200 person defence-industrial-base contractor** that is actively preparing an SSP/POA&M or CMMC assessment, has visible employee adoption of external AI tools, and lacks a clean answer to “where does prompt data go?” This buyer has a near-term proof requirement, a bounded evaluation path, and a reason to value local deployment over broad enterprise DLP features.

| Step | Asset or action | Success condition |
|---|---|---|
| 1. Segment | Build a consented/legitimate-business-interest list by role: CISO/IT director, CMMC programme owner, security consultant, or MSP serving DIB clients. | Every record has source, role, company, region, and suppression status. |
| 2. Educate | Send a short, plain-language note: “Can you show where AI prompts leave your approved boundary?” Link to a sourced boundary checklist, not a product deck. | Positive reply, checklist download, or self-selected assessment interest. |
| 3. Diagnose | Offer a 20-minute architecture review or a fixed-scope $499 assessment. Ask about AI services, data types, authorised boundary, SSP owner, and evidence gap. | Prospect chooses a bounded next step. |
| 4. Prove | Run a self-hosted, non-CUI test with a customer-controlled sample; show policy, event, and evidence output. | Buyer validates fit and identifies deployment owner. |
| 5. Convert | Deliver the evidence-oriented report with scope caveats, findings, remediation order, and a 30-day implementation plan. | Paid report or implementation engagement. |

## Email readiness gate

Do not send outbound email until the release checklist confirms sender authentication, recipient suppression, unsubscribe processing, physical address, reply handling, and measurement. Google requires sender authentication and specifies stronger SPF/DKIM/DMARC and unsubscribe requirements for bulk senders; it also recommends gradual volume increases and low complaint rates.[4] Yahoo has parallel authentication, alignment, unsubscribe, and complaint-rate requirements.[5] The US FTC states CAN-SPAM applies to commercial email, including B2B, and requires truthful routing/subjects, a physical address, a clear opt-out mechanism, and honoring opt-outs within ten business days.[6]

## First email: approved style, not a send instruction

**Subject:** Where do AI prompts leave your approved boundary?

Hi {{FirstName}},

Teams preparing for CMMC can usually point to their AI policy. Fewer can show the architecture, enforcement point, and evidence trail for prompts sent to external AI tools.

We built a short boundary checklist for teams that need to document approved AI use without routing sensitive prompt content through another inspection cloud. If that question is active for {{Company}}, I can send it over or walk through it in 20 minutes.

{{SenderName}}
{{Company}}
{{PostalAddress}}
Unsubscribe: {{OneClickUnsubscribeUrl}}

This is a copy template only. It must not be sent until the legal, deliverability, suppression, and security gates above are verified.

## Evidence requirements for website comparison pages

Every comparison row must include a source URL and review date. Use scope-qualified wording such as “HoundShield’s self-hosted path is designed for compatible AI prompt traffic” rather than absolutes such as “only HoundShield” or “competitor X cannot.” Update or remove claims when the source changes.

## References

[1]: https://www.nightfall.ai/ "Nightfall — AI Data Security & DLP"
[2]: https://learn.microsoft.com/en-us/purview/ai-microsoft-purview "Microsoft Purview — AI data security and compliance"
[3]: https://cloudsecurityalliance.org/blog/2026/01/23/securing-ai-in-cmmc-level-2-environments-a-strategic-guide-for-cisos-and-cloud-security-engineers "Cloud Security Alliance — Securing AI in CMMC Level 2 Environments"
[4]: https://support.google.com/mail/answer/81126?hl=en "Google — Email sender guidelines"
[5]: https://senders.yahooinc.com/best-practices/ "Yahoo — Sender requirements and recommendations"
[6]: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business "FTC — CAN-SPAM compliance guide"
