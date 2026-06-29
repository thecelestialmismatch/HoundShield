/**
 * HoundShield CMMC Control Coverage Mapping
 *
 * Maps all 110 NIST SP 800-171 Rev 2 practice requirements to HoundShield's
 * actual technical coverage. This is the authoritative source for what
 * HoundShield enforces, monitors, partially covers, or is out of scope.
 *
 * Coverage levels:
 *   ENFORCED     — HoundShield IS the technical control. Customer can claim MET.
 *   MONITORED    — HoundShield generates the required evidence/logging. Needs policy wrapper.
 *   PARTIAL      — HoundShield addresses the AI-channel dimension. Additional controls needed.
 *   OUT_OF_SCOPE — Physical, personnel, traditional IAM, patching — outside proxy domain.
 *
 * sprsProtected: SPRS points HoundShield protects (full deduction × coverage weight).
 *   ENFORCED  = full deduction value
 *   MONITORED = full deduction value (evidence for assessor)
 *   PARTIAL   = half deduction value
 *   OUT_OF_SCOPE = 0
 */

export type CoverageStatus = 'ENFORCED' | 'MONITORED' | 'PARTIAL' | 'OUT_OF_SCOPE';

export interface ControlCoverage {
  controlId: string;
  status: CoverageStatus;
  /** How HoundShield addresses this control (empty string for OUT_OF_SCOPE) */
  description: string;
  /** SPRS deduction points HoundShield protects (positive integer) */
  sprsProtected: number;
}

export const COVERAGE_DATA: readonly ControlCoverage[] = [
  // ─── AC — Access Control (22 controls) ───────────────────────────────────

  {
    controlId: 'AC.1.001',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.1.002',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.003',
    status: 'ENFORCED',
    description:
      'Core HoundShield function. Every AI prompt is intercepted before transmission and blocked if it contains CUI detected by the 16-pattern classifier. CUI never flows to an unauthorized AI destination.',
    sprsProtected: 5,
  },
  {
    controlId: 'AC.2.004',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.005',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.006',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.007',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.008',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.009',
    status: 'PARTIAL',
    description:
      'HoundShield displays intercept banners and policy notices when a prompt is blocked, informing users of CUI handling requirements. Satisfies the AI-channel notice requirement; organization-wide privacy notices remain the customer\'s responsibility.',
    sprsProtected: 1,
  },
  {
    controlId: 'AC.2.010',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.011',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.012',
    status: 'MONITORED',
    description:
      'HoundShield logs every AI tool session: user identity, destination AI service, prompt hash, timestamp, and action taken. Provides a complete audit trail for remote-access monitoring of AI channels.',
    sprsProtected: 3,
  },
  {
    controlId: 'AC.2.013',
    status: 'PARTIAL',
    description:
      'All AI traffic routed through the HoundShield proxy uses TLS encryption, ensuring cryptographic protection for the AI-access channel. Broader remote-access cryptography (VPN, RDP) remains the customer\'s responsibility.',
    sprsProtected: 2,
  },
  {
    controlId: 'AC.2.014',
    status: 'PARTIAL',
    description:
      'All outbound AI traffic is routed through the HoundShield proxy — a centrally managed access control point. Partial because organization-wide remote access routing (VPN concentrators, jump hosts) is broader than AI traffic alone.',
    sprsProtected: 2,
  },
  {
    controlId: 'AC.2.015',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.016',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.017',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.018',
    status: 'PARTIAL',
    description:
      'When mobile devices route AI traffic through the HoundShield proxy, CUI is blocked regardless of device type. Partial because MDM enrollment and broader mobile device policy are outside HoundShield\'s scope.',
    sprsProtected: 1,
  },
  {
    controlId: 'AC.2.019',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.020',
    status: 'PARTIAL',
    description:
      'AI services (ChatGPT, Copilot, Claude, Gemini) are external systems. HoundShield verifies and controls these connections via allow/block policy, providing evidence that external AI connections are managed. Broader external system inventory is out of scope.',
    sprsProtected: 1,
  },
  {
    controlId: 'AC.2.021',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AC.2.022',
    status: 'ENFORCED',
    description:
      'HoundShield prevents CUI from being posted to publicly accessible AI systems (ChatGPT, Gemini, public Copilot). Prompts containing CUI are blocked before reaching any public AI endpoint.',
    sprsProtected: 1,
  },

  // ─── AT — Awareness & Training (3 controls) ──────────────────────────────

  {
    controlId: 'AT.2.001',
    status: 'PARTIAL',
    description:
      'The Command Center dashboard shows employees which data was blocked and why (CUI category, policy triggered), building direct awareness of CUI risks in AI workflows. Formal security awareness training program is the customer\'s responsibility.',
    sprsProtected: 2,
  },
  {
    controlId: 'AT.2.002',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'AT.2.003',
    status: 'MONITORED',
    description:
      'OODA behavioral analytics detects anomalous AI usage patterns (bulk exfiltration attempts, unusual prompt volumes, off-hours AI use with CUI) that may indicate insider threats. Provides the detection evidence component of an insider threat program.',
    sprsProtected: 3,
  },

  // ─── AU — Audit & Accountability (9 controls) ────────────────────────────

  {
    controlId: 'AU.2.001',
    status: 'ENFORCED',
    description:
      'HoundShield creates an immutable audit log for every AI interaction: user identity, timestamp, destination AI service, prompt hash, detected CUI categories, policy decision, and action taken. Logs are retained per configured retention policy.',
    sprsProtected: 5,
  },
  {
    controlId: 'AU.2.002',
    status: 'ENFORCED',
    description:
      'Every audit log entry is bound to the authenticated user making the AI request. User identity is recorded for all events — allows — blocks, and detections — ensuring individual accountability for AI usage.',
    sprsProtected: 5,
  },
  {
    controlId: 'AU.2.003',
    status: 'MONITORED',
    description:
      'The Command Center provides an admin interface for reviewing logged AI events and updating which event types are captured. Admins can adjust detection sensitivity and logged fields as requirements evolve.',
    sprsProtected: 1,
  },
  {
    controlId: 'AU.2.004',
    status: 'MONITORED',
    description:
      'HoundShield monitors proxy health and surfaces logging failures in the dashboard. Alerts are generated when the audit pipeline encounters errors, ensuring logging failures are visible to administrators.',
    sprsProtected: 3,
  },
  {
    controlId: 'AU.2.005',
    status: 'MONITORED',
    description:
      'The analytics engine correlates AI events across users, time periods, and AI services to surface patterns — repeated policy violations, high-risk users, CUI categories most frequently detected. Provides the cross-event correlation evidence assessors require.',
    sprsProtected: 3,
  },
  {
    controlId: 'AU.2.006',
    status: 'MONITORED',
    description:
      'The Reports module generates filtered compliance reports from raw audit data, supporting CMMC assessment evidence packages. Report exports include event counts, policy summaries, and trend analysis.',
    sprsProtected: 1,
  },
  {
    controlId: 'AU.2.007',
    status: 'ENFORCED',
    description:
      'All HoundShield audit log entries include precise UTC timestamps synchronized to system time. Every event — intercept, block, allow — carries a reliable, sortable timestamp for forensic reconstruction.',
    sprsProtected: 1,
  },
  {
    controlId: 'AU.2.008',
    status: 'PARTIAL',
    description:
      'Supabase Row-Level Security restricts audit log access to authorized admin roles. The local-only architecture means logs never leave the customer\'s environment. Full tamper-evidence depends on database-level security configuration managed by the customer.',
    sprsProtected: 3,
  },
  {
    controlId: 'AU.2.009',
    status: 'PARTIAL',
    description:
      'Role-based access control limits who can modify, export, or delete audit logs in the Command Center. Full implementation requires the customer to configure RBAC aligned with their privileged-user policy.',
    sprsProtected: 2,
  },

  // ─── CA — Security Assessment (4 controls) ───────────────────────────────

  {
    controlId: 'CA.2.001',
    status: 'PARTIAL',
    description:
      'The SPRS Assessment module provides a structured, scored assessment workflow against all 110 NIST 800-171 controls. Periodic reassessment scheduling and formal assessment team coordination remain the customer\'s responsibility.',
    sprsProtected: 2,
  },
  {
    controlId: 'CA.2.002',
    status: 'PARTIAL',
    description:
      'Gap Analysis generates a prioritized remediation roadmap with estimated hours and affordable tools per unmet control — the core inputs for a Plan of Action & Milestones (POA&M). POA&M execution and tracking remain the customer\'s responsibility.',
    sprsProtected: 2,
  },
  {
    controlId: 'CA.2.003',
    status: 'MONITORED',
    description:
      'The real-time Command Center dashboard provides continuous visibility into AI-related control effectiveness — active detections, trend lines, policy violation rates. Satisfies the continuous monitoring requirement for AI channels.',
    sprsProtected: 3,
  },
  {
    controlId: 'CA.2.004',
    status: 'PARTIAL',
    description:
      'SPRS assessment outputs generate structured evidence suitable for System Security Plan (SSP) documentation. Full SSP authoring, approval workflows, and system boundary documentation are out of scope.',
    sprsProtected: 2,
  },

  // ─── CM — Configuration Management (9 controls) ──────────────────────────

  {
    controlId: 'CM.2.001',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'CM.2.002',
    status: 'PARTIAL',
    description:
      'HoundShield enforces AI security policy settings — which CUI patterns trigger blocks, which AI services are allowed, which users have exemptions. Provides a policy-based configuration control layer specifically for AI channels.',
    sprsProtected: 3,
  },
  {
    controlId: 'CM.2.003',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'CM.2.004',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'CM.2.005',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'CM.2.006',
    status: 'PARTIAL',
    description:
      'HoundShield enforces least-functionality for AI channels: only approved AI services receive traffic, and only non-CUI content is allowed through. Applies the deny-by-exception principle to the AI tooling surface area.',
    sprsProtected: 2,
  },
  {
    controlId: 'CM.2.007',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'CM.2.008',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'CM.2.009',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── IA — Identification & Authentication (11 controls) ──────────────────

  {
    controlId: 'IA.1.076',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.1.077',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.078',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.079',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.080',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.081',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.082',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.083',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.084',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.085',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'IA.2.086',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── IR — Incident Response (3 controls) ─────────────────────────────────

  {
    controlId: 'IR.2.092',
    status: 'PARTIAL',
    description:
      'HoundShield provides the detection and evidence layer for AI-related CUI incidents: real-time block events, audit trails, and exportable incident reports. Formal IR team, escalation procedures, and response playbooks remain the customer\'s responsibility.',
    sprsProtected: 3,
  },
  {
    controlId: 'IR.2.093',
    status: 'MONITORED',
    description:
      'Every HoundShield detection event is automatically documented with full context: user, time, AI service, data category, action taken, and policy triggered. Exportable as structured incident reports for CMMC assessment evidence.',
    sprsProtected: 3,
  },
  {
    controlId: 'IR.2.097',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── MA — Maintenance (6 controls) ───────────────────────────────────────

  {
    controlId: 'MA.2.111',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MA.2.112',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MA.2.113',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MA.2.114',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MA.2.115',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MA.2.116',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── MP — Media Protection (9 controls) ──────────────────────────────────

  {
    controlId: 'MP.1.118',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.1.119',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.1.120',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.2.121',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.2.122',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.2.123',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.2.124',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.2.125',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'MP.2.126',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── PE — Physical & Environmental Protection (6 controls) ───────────────

  {
    controlId: 'PE.1.001',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'PE.1.002',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'PE.2.003',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'PE.2.004',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'PE.2.005',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'PE.2.006',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── PS — Personnel Security (2 controls) ────────────────────────────────

  {
    controlId: 'PS.2.001',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'PS.2.002',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },

  // ─── RA — Risk Assessment (3 controls) ───────────────────────────────────

  {
    controlId: 'RA.2.001',
    status: 'PARTIAL',
    description:
      'The SPRS scoring engine provides quantitative risk assessment across all 110 controls, including AI-specific risk vectors. Partial because broader organizational risk assessment (IT infrastructure, supply chain, facilities) is outside HoundShield\'s scope.',
    sprsProtected: 2,
  },
  {
    controlId: 'RA.2.002',
    status: 'PARTIAL',
    description:
      'HoundShield continuously scans all AI traffic for CUI exposure vulnerabilities — the AI-channel dimension of vulnerability scanning. Network and endpoint vulnerability scanning remain the customer\'s responsibility.',
    sprsProtected: 2,
  },
  {
    controlId: 'RA.2.003',
    status: 'PARTIAL',
    description:
      'Gap Analysis provides a prioritized remediation roadmap with effort estimates per control, directly supporting risk-driven remediation sequencing. Actual remediation execution across non-AI systems is the customer\'s responsibility.',
    sprsProtected: 2,
  },

  // ─── SC — System & Communications Protection (16 controls) ───────────────

  {
    controlId: 'SC.1.001',
    status: 'ENFORCED',
    description:
      'HoundShield IS the communications boundary control for AI traffic. Every outbound AI prompt crosses the proxy boundary where it is inspected, classified, and either allowed or blocked. Monitors and protects the AI channel at the network boundary.',
    sprsProtected: 5,
  },
  {
    controlId: 'SC.1.005',
    status: 'PARTIAL',
    description:
      'HoundShield creates a logical security boundary between internal CUI-processing systems and external public AI services, implementing separation between trusted and untrusted components. Physical network segmentation is broader than HoundShield\'s scope.',
    sprsProtected: 3,
  },
  {
    controlId: 'SC.2.002',
    status: 'PARTIAL',
    description:
      'HoundShield adds a dedicated security architecture layer (proxy + classifier + policy engine) for AI communications — an effective security architecture component. Full enterprise security architecture design is out of scope.',
    sprsProtected: 2,
  },
  {
    controlId: 'SC.2.003',
    status: 'PARTIAL',
    description:
      'HoundShield\'s admin console (management functionality) is separate from the proxy endpoint (user functionality). Broader system management separation across the organization\'s entire IT stack is out of scope.',
    sprsProtected: 1,
  },
  {
    controlId: 'SC.2.004',
    status: 'ENFORCED',
    description:
      'Directly prevents unauthorized CUI transfer via shared AI resources. When multiple users share an AI service subscription, HoundShield ensures no user\'s CUI leaks through the shared channel. Prompt content is never logged to external services.',
    sprsProtected: 1,
  },
  {
    controlId: 'SC.2.006',
    status: 'PARTIAL',
    description:
      'HoundShield enforces deny-by-exception for AI traffic: unapproved AI services are blocked by default, and only allowlisted destinations receive traffic. Network-layer default-deny policy (firewalls) is broader than HoundShield\'s scope.',
    sprsProtected: 2,
  },
  {
    controlId: 'SC.2.007',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SC.2.008',
    status: 'PARTIAL',
    description:
      'All AI traffic through the HoundShield proxy is encrypted via TLS, protecting CUI in transit on the AI channel. Broader transit encryption (email, file transfer, internal APIs) remains the customer\'s responsibility.',
    sprsProtected: 3,
  },
  {
    controlId: 'SC.2.009',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SC.2.010',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SC.2.011',
    status: 'PARTIAL',
    description:
      'HoundShield uses industry-standard TLS with FIPS-compatible algorithms for all proxy communications. Full FIPS validation across the organization\'s cryptographic modules (disk encryption, email, VPN) is broader than HoundShield\'s scope.',
    sprsProtected: 3,
  },
  {
    controlId: 'SC.2.012',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SC.2.013',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SC.2.014',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SC.2.015',
    status: 'PARTIAL',
    description:
      'The proxy enforces TLS for AI sessions and validates session integrity. Protection of communication session authenticity on the AI channel is provided. Broader session protection (web apps, internal services) is the customer\'s responsibility.',
    sprsProtected: 1,
  },
  {
    controlId: 'SC.2.016',
    status: 'PARTIAL',
    description:
      'Supabase Row-Level Security and the local-only architecture ensure audit logs and configuration data are protected at rest. CUI in prompts is never stored — it is classified and blocked in-flight. Full data-at-rest encryption for broader CUI repositories is the customer\'s responsibility.',
    sprsProtected: 3,
  },

  // ─── SI — System & Information Integrity (7 controls) ────────────────────

  {
    controlId: 'SI.1.001',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SI.1.002',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SI.1.004',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SI.1.005',
    status: 'OUT_OF_SCOPE',
    description: '',
    sprsProtected: 0,
  },
  {
    controlId: 'SI.2.003',
    status: 'MONITORED',
    description:
      'HoundShield monitors AI security advisories and emerging CUI exfiltration techniques. Detection patterns are updated as new threat vectors are identified. Provides the AI-specific security threat monitoring component.',
    sprsProtected: 3,
  },
  {
    controlId: 'SI.2.006',
    status: 'MONITORED',
    description:
      'Real-time monitoring of all AI traffic for attack indicators: bulk exfiltration attempts, prompt injection patterns, policy bypass attempts, and anomalous usage volumes. OODA behavioral analytics flags deviations from baseline.',
    sprsProtected: 3,
  },
  {
    controlId: 'SI.2.007',
    status: 'ENFORCED',
    description:
      'HoundShield detects and flags unauthorized AI usage: unapproved AI services, employees using AI to process CUI in violation of policy, and attempts to circumvent the proxy. Every unauthorized use incident is recorded and surfaced in the dashboard.',
    sprsProtected: 3,
  },
] as const;
