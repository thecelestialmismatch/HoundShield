"""
Kaelus.Online — Compliance Brain Training Data Preparation

Builds brain/input.txt from:
  1. NIST SP 800-171 Rev 2 — all 110 controls with descriptions
  2. CMMC Level 2 domain knowledge
  3. CUI detection patterns and examples
  4. SPRS scoring methodology
  5. Defense contractor compliance context

Run: python brain/prepare.py
Output: brain/input.txt (~50KB of compliance domain text)
"""

import os

OUTPUT = os.path.join(os.path.dirname(__file__), 'input.txt')

# ─── NIST SP 800-171 Rev 2 Controls (all 14 families, 110 controls) ───────────
NIST_CONTROLS = """
3.1.1 Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).

3.1.2 Limit system access to the types of transactions and functions that authorized users are permitted to execute.

3.1.3 Control the flow of CUI in accordance with approved authorizations.

3.1.4 Separate the duties of individuals to reduce the risk of malevolent activity without collusion.

3.1.5 Employ the principle of least privilege, including for specific security functions and privileged accounts.

3.1.6 Use non-privileged accounts or roles when accessing non-security functions.

3.1.7 Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.

3.1.8 Limit unsuccessful logon attempts.

3.1.9 Provide privacy and security notices consistent with CUI rules.

3.1.10 Use session lock with pattern-hiding displays after a period of inactivity.

3.1.11 Terminate (automatically) a user session after a defined condition.

3.1.12 Monitor and control remote access sessions.

3.1.13 Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.

3.1.14 Route remote access via managed access control points.

3.1.15 Authorize remote execution of privileged commands and access to security-relevant information via remote access only for documented operational needs.

3.1.16 Authorize wireless access prior to allowing such connections.

3.1.17 Protect wireless access using authentication and encryption.

3.1.18 Control connection of mobile devices.

3.1.19 Encrypt CUI on mobile devices and mobile computing platforms.

3.1.20 Verify and control all connections to external systems.

3.1.21 Limit use of portable storage devices on external systems.

3.1.22 Control CUI posted or processed on publicly accessible systems.

3.2.1 Ensure that organizational personnel are aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of organizational systems.

3.2.2 Ensure that organizational personnel are trained to carry out their assigned information security-related duties and responsibilities.

3.2.3 Provide security awareness training on recognizing and reporting potential threats.

3.3.1 Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.

3.3.2 Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions.

3.3.3 Review and update logged events.

3.3.4 Alert in the event of an audit logging process failure.

3.3.5 Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.

3.3.6 Provide audit record reduction and report generation to support on-demand analysis and reporting.

3.3.7 Provide a system capability that compares and synchronizes internal system clocks with an authoritative source.

3.3.8 Protect audit information and audit tools from unauthorized access, modification, and deletion.

3.3.9 Limit management of audit logging to a subset of privileged users.

3.4.1 Establish and maintain baseline configurations and inventories of organizational systems.

3.4.2 Establish and enforce security configuration settings for information technology products employed in organizational systems.

3.4.3 Track, review, approve, and log changes to organizational systems.

3.4.4 Analyze the security impact of changes prior to implementation.

3.4.5 Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.

3.4.6 Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.

3.4.7 Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.

3.4.8 Apply deny-by-exception policy to prevent the use of unauthorized software.

3.4.9 Control and monitor user-installed software.

3.5.1 Identify system users, processes acting on behalf of users, and devices.

3.5.2 Authenticate the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.

3.5.3 Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.

3.5.4 Employ replay-resistant authentication mechanisms.

3.5.5 Employ identifier management practices.

3.5.6 Employ authentication practices that strengthen the security of user authentication.

3.5.7 Enforce a minimum password complexity and change of characters when passwords are changed.

3.5.8 Prohibit password reuse for a specified number of generations.

3.5.9 Allow temporary password use during initial login.

3.5.10 Store and transmit only cryptographically protected passwords.

3.5.11 Obscure feedback of authentication information.

3.6.1 Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.

3.6.2 Track, document, and report incidents to designated officials and/or authorities.

3.6.3 Test the organizational incident response capability.

3.7.1 Perform maintenance on organizational systems.

3.7.2 Provide controls on the tools, techniques, mechanisms, and personnel for the performance of system maintenance.

3.7.3 Ensure equipment removed for maintenance is sanitized.

3.7.4 Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.

3.7.5 Require multifactor authentication to establish nonlocal maintenance sessions.

3.7.6 Supervise the maintenance activities of maintenance personnel without required access authorization.

3.8.1 Protect system media containing CUI.

3.8.2 Limit access to CUI on system media to authorized users.

3.8.3 Sanitize or destroy system media before disposal or reuse.

3.8.4 Mark media with necessary CUI markings and distribution limitations.

3.8.5 Control access to media containing CUI and maintain accountability for media during transport.

3.8.6 Implement cryptographic mechanisms to protect CUI during transport unless protected by alternative physical safeguards.

3.8.7 Control the use of removable media on system components.

3.8.8 Prohibit the use of portable storage devices when such devices have no identifiable owner.

3.8.9 Protect the confidentiality of backup CUI at storage locations.

3.9.1 Screen individuals prior to authorizing access to organizational systems containing CUI.

3.9.2 Ensure that CUI is protected during and after personnel actions such as terminations and transfers.

3.10.1 Limit physical access to organizational systems to authorized individuals.

3.10.2 Protect and monitor the physical facility and support infrastructure for organizational systems.

3.10.3 Escort visitors and monitor visitor activity.

3.10.4 Maintain audit logs of physical access.

3.10.5 Control and manage physical access devices.

3.10.6 Enforce safeguarding measures for CUI at alternate work sites.

3.11.1 Periodically assess the risk to organizational operations, assets, and individuals.

3.11.2 Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems are identified.

3.11.3 Remediate vulnerabilities in accordance with risk assessments.

3.12.1 Periodically assess the security controls in organizational systems to determine if the controls are effective.

3.12.2 Develop and implement plans of action designed to correct deficiencies and reduce vulnerabilities.

3.12.3 Monitor security controls on an ongoing basis.

3.13.1 Monitor, control, and protect communications at the external boundaries and key internal boundaries of organizational systems.

3.13.2 Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security.

3.13.3 Separate user functionality from system management functionality.

3.13.4 Prevent unauthorized and unintended information transfer via shared resources.

3.13.5 Implement subnetworks for publicly accessible system components.

3.13.6 Deny network communications traffic by default.

3.13.7 Prevent remote devices from simultaneously using a VPN and accessing other resources.

3.13.8 Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission.

3.13.9 Terminate network connections after a defined period of inactivity.

3.13.10 Establish and manage cryptographic keys.

3.13.11 Employ FIPS-validated cryptography.

3.13.12 Prohibit remote activation of collaborative computing devices.

3.13.13 Control and monitor the use of mobile code.

3.13.14 Control and monitor the use of VoIP technologies.

3.13.15 Protect the authenticity of communications sessions.

3.13.16 Protect CUI at rest.

3.14.1 Identify, report, and correct system flaws in a timely manner.

3.14.2 Provide protection from malicious code at appropriate locations within organizational systems.

3.14.3 Monitor system security alerts and advisories.

3.14.4 Update malicious code protection mechanisms.

3.14.5 Perform periodic scans of organizational systems.

3.14.6 Monitor organizational systems to detect attacks and indicators of potential attacks.

3.14.7 Identify unauthorized use of organizational systems.
"""

# ─── CMMC Domain Knowledge ────────────────────────────────────────────────────
CMMC_KNOWLEDGE = """
CMMC Level 2 requires implementation of all 110 practices from NIST SP 800-171 Rev 2.

Defense contractors handling Controlled Unclassified Information (CUI) must achieve CMMC Level 2 certification by November 2026 to maintain Department of Defense contracts.

The SPRS score is calculated as 110 minus the sum of point values for unimplemented practices. The maximum score is 110 and the minimum is -203. Scores must be submitted to the Supplier Performance Risk System.

CAGE codes are five-character alphanumeric identifiers assigned to defense contractors by the Defense Logistics Agency. All defense contractors bidding on DoD contracts must have a valid CAGE code.

The DD Form 254 (Department of Defense Contract Security Classification Specification) defines security requirements for classified contracts. All contractors handling classified information must comply with DD-254 requirements.

Controlled Unclassified Information categories include: FOUO (For Official Use Only), Privacy Act data, export controlled technical data, law enforcement sensitive information, and proprietary business information.

A Plan of Action and Milestones (POA&M) documents deficiencies in security controls and plans for remediation. Contractors must maintain current POA&Ms for all identified weaknesses.

The System Security Plan (SSP) describes how security requirements are met in the contractor's environment. The SSP must cover all systems that process, store, or transmit CUI.

C3PAOs (Certified Third-Party Assessment Organizations) are authorized by the CMMC Accreditation Body to conduct CMMC Level 2 assessments. Assessment costs range from $30,000 to $150,000.

Multi-Factor Authentication (MFA) is required for all privileged accounts under NIST control 3.5.3. MFA must use two or more factors: something you know, something you have, or something you are.

Encryption of CUI at rest is required under control 3.13.16. FIPS 140-2 validated encryption must be used under control 3.13.11. AES-256 encryption satisfies both requirements.

Audit logs must be retained for a minimum period sufficient to support after-the-fact investigation of security incidents. Audit records must be protected from unauthorized modification and deletion.

Incident response capability must include preparation, detection, analysis, containment, recovery, and user response activities. Security incidents must be reported to appropriate authorities.

Supply chain risk management requires vetting subcontractors and vendors who have access to CUI. Contractors must flow down CMMC requirements to their supply chain.
"""

# ─── CUI Patterns and Examples ────────────────────────────────────────────────
CUI_PATTERNS = """
CAGE code examples: 1ABC2 3DE45 7FGH8 9JKL0 2MNP3

NIST control reference examples: 3.1.1 3.5.3 3.13.16 3.14.2 3.8.9 3.3.1

Contract number examples:
Army: W912AB-22-C-0042 W52P1J-21-D-0033
Air Force: FA8721-20-D-0001 FA2517-22-C-0088
Navy: N00030-21-C-0047

Document markings: CUI// FOUO FOR OFFICIAL USE ONLY (U) (C) (S)

Clearance levels: SECRET TOP SECRET TS/SCI CONFIDENTIAL

DD-254 references: DD Form 254 DoD Contract Security Classification Specification

CUI handling rule: CUI must be encrypted at rest using FIPS 140-2 validated AES-256 encryption.

CUI handling rule: CUI must be protected during transmission using TLS 1.2 or higher.

CUI handling rule: Access to CUI must be limited to authorized personnel with need-to-know.

CUI handling rule: CUI must not be processed on publicly accessible systems without explicit authorization.

CUI handling rule: All CUI must be marked with appropriate CUI markings before dissemination.
"""

# ─── Assessment Question Templates ────────────────────────────────────────────
ASSESSMENT_TEMPLATES = """
Assessment question for 3.1.1: Do you limit system access to authorized users, processes acting on behalf of authorized users, and devices?
Evidence required: Access control policy, user access list, system configuration showing access controls.

Assessment question for 3.5.3: Do you use multifactor authentication for local and network access to privileged accounts?
Evidence required: MFA configuration documentation, screenshots of MFA enforcement, privileged account list.

Assessment question for 3.13.16: Do you protect CUI at rest using encryption?
Evidence required: Encryption policy, configuration of encryption at rest, validation of FIPS 140-2 compliance.

Assessment question for 3.3.1: Do you create and retain audit logs sufficient to support investigation of security incidents?
Evidence required: Audit log configuration, sample audit logs, log retention policy.

Assessment question for 3.11.2: Do you periodically scan for vulnerabilities in your systems?
Evidence required: Vulnerability scan reports, scan schedule, remediation tracking.

SPRS score of 110: All 110 NIST 800-171 controls fully implemented. Maximum possible score.
SPRS score of 88: 22 practices not yet implemented. Moderate compliance posture.
SPRS score of 55: Significant gaps in implementation. High risk of contract loss.
SPRS score of 20: Major deficiencies across multiple control families. Immediate action required.
SPRS score of -50: Severe deficiencies. Contract award extremely unlikely.
"""

# ─── Combine and write ────────────────────────────────────────────────────────
corpus = '\n\n'.join([
    NIST_CONTROLS.strip(),
    CMMC_KNOWLEDGE.strip(),
    CUI_PATTERNS.strip(),
    ASSESSMENT_TEMPLATES.strip(),
])

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(corpus)

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"[prepare] Training data written to {OUTPUT}")
print(f"[prepare] Size: {size_kb:.1f} KB | Characters: {len(corpus):,}")
print(f"[prepare] Unique chars: {len(set(corpus))}")
print(f"[prepare] Documents (sections): {len([d for d in corpus.split(chr(10)*2) if d.strip()])}")
print(f"\n[prepare] Ready. Run: python brain/gpt.py")
