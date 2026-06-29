import { NISTControl } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// PS — Personnel Security (2 controls)
// ═══════════════════════════════════════════════════════════════════════════════

export const PS_CONTROLS: NISTControl[] = [
  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'PS.2.001',
    family: 'PS',
    familyName: 'Personnel Security',
    title: 'Screen Individuals Before Granting Access',
    officialDescription:
      'Screen individuals prior to authorizing access to organizational systems containing CUI.',
    plainEnglish:
      'Before giving any employee, temp worker, or contractor access to your computers and files that hold government contract information, you need to run a background check on them. This does not have to be expensive — a basic criminal and identity check is a solid start. The point is to make sure you are not handing the keys to someone with a history of fraud, theft, or security violations. Document who you checked and when.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you conduct background screening (such as criminal history checks and identity verification) on all individuals before granting them access to systems or data containing CUI?',
    remediationSteps: [
      'Select a background screening provider such as GoodHire, Checkr, or Sterling — plans start around $30 per check and cover criminal history, identity verification, and employment history.',
      'Write a short Personnel Screening Policy that states all new hires and contractors must complete a background check before receiving any account credentials or physical access badges.',
      'Add background screening as a mandatory step in your onboarding checklist before IT creates their user account or issues an access badge.',
      'Store completed screening records (date completed, provider used, pass/fail result) in a locked personnel file — physical filing cabinet or encrypted digital folder.',
    ],
    affordableTools: [
      'GoodHire (from $30/check) — online background check service with compliance-friendly reports',
      'Checkr (from $35/check) — fast background screening with digital consent and delivery',
      'Sterling Volunteers (low-cost tier) — background checks with compliance documentation',
      'Google Workspace or Microsoft 365 (existing subscription) — store screening records in encrypted folders',
    ],
    evidenceRequired: [
      'Written Personnel Screening Policy stating screening is required before access is granted',
      'Completed background check records or certificates for each employee with CUI access',
      'Onboarding checklist showing background check step occurs before account provisioning',
      'Log or spreadsheet tracking screening dates, provider, and results for all personnel',
    ],
    policyMapping: [
      'Personnel Security Policy',
      'Onboarding and Offboarding Policy',
      'System Security Plan (SSP) Section 3.9',
      'Insider Threat Program Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },

  {
    id: 'PS.2.002',
    family: 'PS',
    familyName: 'Personnel Security',
    title: 'Protect CUI During Personnel Actions',
    officialDescription:
      'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.',
    plainEnglish:
      'When someone quits, gets fired, or moves to a different role, you need a plan to immediately cut off their access to CUI. That means disabling their computer login, collecting their keys and badges, and making sure they cannot still get into email or cloud drives from their phone at home. Do not wait until Monday — do it the same day. Also, when someone transfers to a new role, review whether they still need the same file access or if it should change.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have a documented offboarding process that ensures system access is revoked and CUI is protected on the same day an employee departs or changes roles, including collecting physical access devices and disabling all accounts?',
    remediationSteps: [
      'Create a one-page offboarding checklist: disable Active Directory or Microsoft 365 account, revoke VPN access, collect badge and keys, wipe or collect company devices, and remove from any shared folders or groups — all within the same business day.',
      'In Microsoft 365 Admin Center, learn how to block sign-in immediately: go to Users > Active users > select the user > Block sign-in. Practice this so you can do it in under two minutes.',
      'For role transfers, schedule an access review with the employee\'s new manager within one week to adjust folder and system access to match the new role using the principle of least privilege.',
      'Maintain a termination log (spreadsheet or HR system) recording the date, who was offboarded, each checklist item completed, and who performed the steps.',
      'Review the termination log quarterly to ensure no gaps exist and all departed employees have been fully removed from all systems.',
    ],
    affordableTools: [
      'Microsoft 365 Admin Center (included with M365 subscription) — block sign-in and revoke access instantly',
      'JumpCloud Free (up to 10 users free) — centralized identity management with instant account disable',
      'Google Sheets or Excel (free) — offboarding checklist tracker and termination log',
      'Bitwarden Teams ($3/user/month) — revoke shared password access immediately on departure',
    ],
    evidenceRequired: [
      'Written offboarding/termination procedure with same-day access revocation requirement',
      'Completed offboarding checklists for recent departures showing all steps performed',
      'Microsoft 365 or AD logs showing accounts were disabled on or before the departure date',
      'Evidence of collected devices and physical access items (signed receipt or inventory log)',
      'Transfer access review documentation showing permissions adjusted for role changes',
    ],
    policyMapping: [
      'Personnel Security Policy',
      'Onboarding and Offboarding Policy',
      'Access Control Policy',
      'System Security Plan (SSP) Section 3.9',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PE — Physical Protection (6 controls)
// ═══════════════════════════════════════════════════════════════════════════════

export const PE_CONTROLS: NISTControl[] = [
  // ─── LEVEL 1 ───────────────────────────────────────────────────────────────

  {
    id: 'PE.1.001',
    family: 'PE',
    familyName: 'Physical Protection',
    title: 'Limit Physical Access to Systems',
    officialDescription:
      'Limit physical access to organizational information systems, equipment, and the respective operating environments to authorized individuals.',
    plainEnglish:
      'Lock the doors to any rooms where your computers, servers, or filing cabinets with government contract data are kept. Not everyone in the building should be able to walk into the server closet or the office where CUI is stored. Use locked doors, key cards, or even simple deadbolts with a sign-out key log. If you have a server rack, put it in a locked room or a locked cabinet — not sitting in the open shop floor.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Are rooms and areas containing systems, servers, or paper files with CUI physically locked or otherwise restricted so that only authorized employees can enter?',
    remediationSteps: [
      'Identify every location where CUI is stored or processed — server closets, offices with CUI workstations, filing cabinets with printed CUI. Mark these on a simple floor plan.',
      'Install keyed deadbolt locks or keypad locks on doors to server rooms and CUI storage areas. A basic keypad deadbolt like Schlage BE365 costs about $100 and requires no wiring.',
      'Maintain a key or access code log: record who has a key or knows the code, and review quarterly. When someone leaves, re-key or change the code.',
      'For server racks in shared spaces, use a locking server cabinet (available for $300-$500) if a dedicated room is not feasible.',
      'Post "Authorized Personnel Only" signage on doors to restricted areas.',
    ],
    affordableTools: [
      'Schlage BE365 keypad deadbolt (~$100) — no wiring, programmable codes, audit trail',
      'Wyze Cam v3 (~$35) — affordable indoor security camera for monitoring restricted areas',
      'StarTech 12U locking server cabinet (~$400) — enclose server equipment in shared spaces',
      'Key log spreadsheet (free) — track who holds keys and when codes were last changed',
    ],
    evidenceRequired: [
      'Floor plan or diagram showing restricted areas where CUI systems are located',
      'Photos of locked doors, keypad locks, or badge readers on restricted areas',
      'Key/access code issuance log showing who has physical access',
      'Written Physical Access Control Policy or procedure',
      'Signage photos showing "Authorized Personnel Only" on restricted areas',
    ],
    policyMapping: [
      'Physical Protection Policy',
      'Facility Security Plan',
      'System Security Plan (SSP) Section 3.10',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },

  {
    id: 'PE.1.002',
    family: 'PE',
    familyName: 'Physical Protection',
    title: 'Protect and Monitor Physical Facility',
    officialDescription:
      'Protect and monitor the physical facility and support infrastructure for organizational systems.',
    plainEnglish:
      'You need to keep your building and the things that keep your computers running — like power, internet, and HVAC — safe and monitored. This means having security cameras at entry points, keeping exterior doors locked after hours, and making sure someone would know if the power went out or a pipe burst near your server. You do not need a fancy security operations center — basic cameras and a monitored alarm system cover this.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Do you have security measures such as cameras, alarms, or monitoring in place to protect the physical facility where CUI systems are located, including infrastructure like power and network equipment?',
    remediationSteps: [
      'Install security cameras at all building entry points and in hallways leading to restricted areas. Wyze or Ring cameras cost $30-$60 each and include cloud storage options.',
      'Set up a basic alarm system for after-hours intrusion detection. SimpliSafe or Ring Alarm starts around $15/month with professional monitoring.',
      'Ensure your server room or closet has a basic environmental monitor — a $30 temperature and humidity sensor with alerts (like Govee WiFi sensor) will warn you before equipment overheats.',
      'Verify that your UPS (uninterruptible power supply) for servers and critical workstations is working and tested. APC Back-UPS units start around $80 for a basic model.',
      'Document your physical security setup in a one-page facility protection summary including camera locations, alarm zones, and emergency contacts.',
    ],
    affordableTools: [
      'Ring Alarm system (from $15/month) — affordable monitored security with door/window sensors',
      'Wyze Cam v3 ($35 each) — budget security cameras with motion detection and cloud recording',
      'Govee WiFi Temperature/Humidity Monitor (~$30) — alerts on phone if server area gets too hot',
      'APC Back-UPS 600VA (~$80) — battery backup for servers and critical workstations',
      'SimpliSafe ($15/month) — wireless alarm system with professional monitoring',
    ],
    evidenceRequired: [
      'Security camera placement diagram or photos showing camera coverage at entries',
      'Alarm system monitoring contract or subscription confirmation',
      'Environmental monitoring evidence (sensor photos, alert configuration screenshots)',
      'UPS equipment inventory and last test date',
      'Facility protection summary document or physical security section of SSP',
    ],
    policyMapping: [
      'Physical Protection Policy',
      'Facility Security Plan',
      'Contingency Plan',
      'System Security Plan (SSP) Section 3.10',
    ],
    estimatedHours: 10,
    riskPriority: 'HIGH',
  },

  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'PE.2.003',
    family: 'PE',
    familyName: 'Physical Protection',
    title: 'Escort and Monitor Visitors',
    officialDescription:
      'Escort visitors and monitor visitor activity.',
    plainEnglish:
      'When someone who does not work for you visits your office or shop — a vendor, a repair person, a customer — they should never wander around on their own near your computers or files. Have someone walk with them at all times, especially near areas where CUI is stored. Keep a visitor log at the front desk: who they are, who they are visiting, what time they arrived and left. It is simple but assessors absolutely check for this.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you require all visitors to sign in, wear identification, and be escorted by an authorized employee when in areas where CUI systems or data are present?',
    remediationSteps: [
      'Create a visitor sign-in log at your main entrance: a simple paper logbook or tablet app (Envoy has a free tier) that captures visitor name, company, host employee, date, time in, and time out.',
      'Issue temporary visitor badges (stick-on adhesive badges cost about $10 for 100) that are visually distinct from employee badges, so everyone can see who is a visitor.',
      'Write a short Visitor Policy: all visitors must be signed in, badged, and escorted at all times in areas containing CUI. Post the policy at the entrance.',
      'Brief all employees: if they see someone without a badge or escort, they should politely ask who they are visiting and walk them to the front desk.',
    ],
    affordableTools: [
      'Paper visitor log book (~$10) — simple sign-in/sign-out tracking at front desk',
      'Envoy Visitors (free tier) — digital visitor sign-in with host notifications',
      'Adhesive visitor badges (~$10/100 pack) — temporary identification for visitors',
      'Printed Visitor Policy poster (~$5 at office supply store) — post at entrance',
    ],
    evidenceRequired: [
      'Visitor sign-in log (physical or digital) with entries showing escort assignments',
      'Written Visitor Policy describing escort requirements and badge procedures',
      'Photo of visitor badge system in use',
      'Employee awareness documentation showing staff know the visitor escort procedure',
    ],
    policyMapping: [
      'Physical Protection Policy',
      'Visitor Management Policy',
      'Facility Security Plan',
      'System Security Plan (SSP) Section 3.10',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'PE.2.004',
    family: 'PE',
    familyName: 'Physical Protection',
    title: 'Maintain Physical Access Audit Logs',
    officialDescription:
      'Maintain audit logs of physical access.',
    plainEnglish:
      'You need a record of who entered and left your restricted areas and when. If you use keypad locks, they may have a built-in log. If you use key cards, the system tracks entries automatically. Even if you use regular keys, you can maintain a simple paper sign-in sheet on the door of the server room. An assessor will want to see that you can look back at least 90 days and tell them who accessed the room on any given day.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you maintain logs (electronic or paper) that record who accessed restricted areas containing CUI systems, including dates and times, and are these logs retained for at least 90 days?',
    remediationSteps: [
      'If using keypad locks (like Schlage), enable the audit trail feature and download the log monthly using the manufacturer\'s app or software.',
      'If using key card systems, ensure the access control software is configured to retain logs for at least 90 days. Export and back up logs monthly.',
      'If using manual keys, place a sign-in sheet in a holder on the door of each restricted room: columns for date, time in, time out, name, and purpose.',
      'Store completed paper logs in a secure location for at least one year. Scan and save digitally as backup.',
      'Review physical access logs monthly for unusual patterns — access outside business hours, unknown names, or excessive frequency.',
    ],
    affordableTools: [
      'Schlage keypad locks with audit trail (~$100-$150) — built-in access logging',
      'Kisi cloud access control (from $5/door/month) — keycard system with automatic digital logs',
      'Paper sign-in sheets (free) — manual but effective for small offices',
      'Google Sheets (free) — digitize and track physical access log data',
    ],
    evidenceRequired: [
      'Physical access logs for restricted areas covering at least the past 90 days',
      'Evidence of regular log review (monthly review notes or sign-off)',
      'Access control system configuration showing retention settings',
      'Written procedure for maintaining and reviewing physical access logs',
    ],
    policyMapping: [
      'Physical Protection Policy',
      'Audit and Accountability Policy',
      'Facility Security Plan',
      'System Security Plan (SSP) Section 3.10',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'PE.2.005',
    family: 'PE',
    familyName: 'Physical Protection',
    title: 'Control Physical Access Devices',
    officialDescription:
      'Control and manage physical access devices.',
    plainEnglish:
      'Keys, key cards, access codes, combinations, and badges — you need to know exactly who has what. Maintain a list of every physical access device you have issued. When someone leaves or no longer needs access, get the key back and change the code. If a key is lost, re-key the lock. This is just like managing computer passwords but for physical locks. Assessors will ask to see your key issuance list.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you maintain an inventory of all physical access devices (keys, badges, access codes) with records of who they are issued to, and do you promptly recover or deactivate them when no longer needed?',
    remediationSteps: [
      'Create a physical access device inventory spreadsheet listing every key, badge, and access code: the device identifier, who it is issued to, date issued, and the area it grants access to.',
      'Add a step to your offboarding checklist: collect all physical access devices (keys, badges) and note the return date in your inventory. Change access codes within 24 hours if the departing employee knew them.',
      'Conduct a quarterly audit: compare your inventory spreadsheet to current employees and verify no keys or badges are unaccounted for.',
      'If a key or badge is reported lost, re-key the affected lock or deactivate the badge within 24 hours and document the incident.',
    ],
    affordableTools: [
      'Google Sheets or Excel (free) — physical access device inventory tracker',
      'Key tags and label maker (~$20) — physically label and track each key',
      'Schlage re-keyable locks (~$30-$50) — change key without replacing entire lock',
      'Kisi access control (from $5/door/month) — remotely deactivate cards instantly',
    ],
    evidenceRequired: [
      'Physical access device inventory (spreadsheet or database) with issuance records',
      'Evidence of device recovery on personnel departure (signed receipt or inventory update)',
      'Quarterly audit records showing inventory was reviewed and reconciled',
      'Incident log for lost or stolen access devices showing response actions taken',
    ],
    policyMapping: [
      'Physical Protection Policy',
      'Onboarding and Offboarding Policy',
      'Facility Security Plan',
      'System Security Plan (SSP) Section 3.10',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'PE.2.006',
    family: 'PE',
    familyName: 'Physical Protection',
    title: 'Safeguard CUI at Alternate Work Sites',
    officialDescription:
      'Enforce safeguarding measures for CUI at alternate work sites.',
    plainEnglish:
      'If employees work from home or at client sites with CUI, the same protection rules apply outside the office. They need to lock their laptop when they step away, use encrypted hard drives, avoid working on CUI at a coffee shop where someone can see their screen, and connect through VPN. Write a short remote work agreement that spells out these rules. A lost laptop with unencrypted CUI is a reportable incident.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have a documented telework or remote work policy that requires employees to protect CUI with encryption, screen privacy, VPN use, and physical security measures when working outside the primary office?',
    remediationSteps: [
      'Write a one-page Remote Work / Telework Agreement that employees sign: it should require BitLocker encryption on all laptops, VPN use when accessing company systems, screen lock after 5 minutes of inactivity, and no CUI work in public spaces without a privacy screen.',
      'Enable BitLocker on all company laptops: go to Control Panel > BitLocker Drive Encryption > Turn on BitLocker. Store recovery keys in your Microsoft 365 admin or a printed lockbox.',
      'Deploy a VPN for remote access. WireGuard (free and open-source) or a pfSense-based VPN costs nothing beyond the hardware you likely already have.',
      'Provide privacy screen filters (~$30 each) for employees who must occasionally work in shared spaces or during travel.',
      'Include remote work security in your annual security awareness training so employees understand their responsibilities.',
    ],
    affordableTools: [
      'BitLocker (included with Windows Pro) — full disk encryption at no extra cost',
      'WireGuard VPN (free, open-source) — fast and simple VPN for remote access',
      '3M Privacy Screen Filter (~$30) — prevents visual snooping on laptop screens',
      'Microsoft 365 GCC with Intune (from $12/user/month) — enforce device policies remotely',
    ],
    evidenceRequired: [
      'Written Telework/Remote Work Policy or Agreement signed by employees',
      'Evidence BitLocker or equivalent encryption is enabled on all remote laptops (management console screenshot)',
      'VPN configuration and usage logs showing remote employees connect through VPN',
      'Privacy screen filter distribution records or receipts',
      'Training materials or sign-off showing remote security was covered in awareness training',
    ],
    policyMapping: [
      'Physical Protection Policy',
      'Telework / Remote Work Policy',
      'Media Protection Policy',
      'System Security Plan (SSP) Section 3.10',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// RA — Risk Assessment (3 controls)
// ═══════════════════════════════════════════════════════════════════════════════

export const RA_CONTROLS: NISTControl[] = [
  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'RA.2.001',
    family: 'RA',
    familyName: 'Risk Assessment',
    title: 'Periodically Assess Risk',
    officialDescription:
      'Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.',
    plainEnglish:
      'At least once a year, sit down and think about what could go wrong with your computers and data. What if an employee clicks a phishing link? What if your server hard drive dies? What if a disgruntled ex-employee still has a password? Write down these risks, rate how likely they are and how bad the impact would be, and then decide what you are doing about each one. This does not have to be fancy — a spreadsheet with columns for threat, likelihood, impact, and mitigation works fine.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you perform a documented risk assessment at least annually that identifies threats and vulnerabilities to your systems and CUI, rates their likelihood and impact, and documents planned mitigations?',
    remediationSteps: [
      'Download the NIST SP 800-30 risk assessment template or create a spreadsheet with columns: Threat Source, Threat Event, Vulnerability, Likelihood (Low/Medium/High), Impact (Low/Medium/High), Risk Level, and Planned Mitigation.',
      'Schedule a half-day annual risk assessment meeting with your key staff. Walk through each threat category: insider threats, external hackers, natural disasters, equipment failure, supply chain issues.',
      'For each identified risk, assign an owner (the person responsible for the mitigation) and a target completion date. Document this in your risk register spreadsheet.',
      'Review and update the risk assessment whenever there is a significant change — new system, new contract, new location, or after a security incident.',
      'Store the completed risk assessment with your compliance documentation and reference it in your System Security Plan.',
    ],
    affordableTools: [
      'NIST SP 800-30 Risk Assessment Template (free) — official government risk assessment framework',
      'Google Sheets or Excel (free) — create and maintain a risk register spreadsheet',
      'Vanta ($5,000-$10,000/year for small orgs) — automated risk assessment and compliance tracking',
      'CISA Cyber Resilience Review (free) — self-assessment tool from the US government',
    ],
    evidenceRequired: [
      'Completed risk assessment document or risk register with identified threats and vulnerabilities',
      'Evidence of likelihood and impact ratings for each identified risk',
      'Mitigation plans with assigned owners and target dates',
      'Evidence the risk assessment was reviewed or updated within the past 12 months',
      'Meeting notes or attendance from the annual risk assessment session',
    ],
    policyMapping: [
      'Risk Assessment Policy',
      'Risk Management Framework',
      'System Security Plan (SSP) Section 3.11',
      'Plan of Action and Milestones (POA&M)',
    ],
    estimatedHours: 16,
    riskPriority: 'HIGH',
  },

  {
    id: 'RA.2.002',
    family: 'RA',
    familyName: 'Risk Assessment',
    title: 'Scan for Vulnerabilities Periodically',
    officialDescription:
      'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.',
    plainEnglish:
      'Run automated scans on your computers and network at least once a month to find security holes — missing patches, misconfigured settings, outdated software with known weaknesses. Think of it like a health checkup for your computers. Tools like Nessus Essentials (free for up to 16 IPs) or Windows built-in tools can do this. When a major new vulnerability is announced (like Log4j was), scan again right away to check if you are affected.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you perform automated vulnerability scans on your systems and network at least monthly, and do you perform additional scans when new critical vulnerabilities are publicly disclosed?',
    remediationSteps: [
      'Download and install Nessus Essentials (free for up to 16 IP addresses) from tenable.com. Run your first scan on your internal network to establish a baseline of vulnerabilities.',
      'Schedule monthly vulnerability scans: set Nessus or your chosen tool to run automatically on the first weekend of each month. Review results the following Monday.',
      'For each scan result, triage vulnerabilities by severity: Critical and High should be remediated within 30 days, Medium within 90 days, Low can be addressed in the next patch cycle.',
      'Subscribe to CISA Known Exploited Vulnerabilities (KEV) alerts at cisa.gov to get notified when new critical vulnerabilities are announced, and run an ad-hoc scan immediately after.',
      'Save scan reports as PDF and store them with your compliance documentation. Track remediation progress in your POA&M.',
    ],
    affordableTools: [
      'Nessus Essentials (free for up to 16 IPs) — industry-standard vulnerability scanner',
      'OpenVAS / Greenbone Community Edition (free, open-source) — full-featured vulnerability scanning',
      'Microsoft Defender Vulnerability Management (included with Windows) — built-in vulnerability assessment',
      'Qualys Community Edition (free) — cloud-based vulnerability scanning for small environments',
    ],
    evidenceRequired: [
      'Vulnerability scan reports from the past 12 months showing at least monthly scans',
      'Evidence of remediation for critical and high vulnerabilities found in scans',
      'Written vulnerability scanning procedure describing frequency and scope',
      'POA&M entries for any open vulnerabilities that are not yet remediated',
      'Evidence of ad-hoc scans performed in response to newly announced critical vulnerabilities',
    ],
    policyMapping: [
      'Risk Assessment Policy',
      'Vulnerability Management Procedure',
      'System Security Plan (SSP) Section 3.11',
      'Plan of Action and Milestones (POA&M)',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },

  {
    id: 'RA.2.003',
    family: 'RA',
    familyName: 'Risk Assessment',
    title: 'Remediate Vulnerabilities Per Risk Assessments',
    officialDescription:
      'Remediate vulnerabilities in accordance with risk assessments.',
    plainEnglish:
      'Finding vulnerabilities is only half the job — you have to actually fix them. When your vulnerability scans find a critical problem, patch it or mitigate it based on how severe it is. Critical and High issues should be fixed within 30 days. If you cannot fix something immediately, document it in your Plan of Action and Milestones (POA&M) with a target date and who is responsible. Do not just run scans and ignore the results — that is worse than not scanning at all because it shows you knew and did nothing.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you remediate identified vulnerabilities based on their risk severity within defined timeframes (e.g., Critical within 14 days, High within 30 days), and do you track open vulnerabilities in a Plan of Action and Milestones (POA&M)?',
    remediationSteps: [
      'Establish remediation timeframes in your Vulnerability Management Procedure: Critical = 14 days, High = 30 days, Medium = 90 days, Low = next scheduled maintenance window.',
      'After each vulnerability scan, create a remediation task list in your POA&M spreadsheet: vulnerability ID, affected system, severity, owner, planned fix date, and status.',
      'Apply patches promptly using Windows Update for Servers and workstations, or WSUS if you have it. For third-party software, use tools like Patch My PC (free for home, affordable for business) or Ninite Pro.',
      'After applying patches or mitigations, re-scan the affected systems to verify the vulnerability is actually fixed. Document the verification.',
      'Review your POA&M monthly to ensure nothing is overdue and escalate any items that are past their target date.',
    ],
    affordableTools: [
      'Windows Update / WSUS (free) — Microsoft patch management for Windows systems',
      'Patch My PC (free home / $3 per device business) — third-party application patching',
      'Ninite Pro (from $1/machine/month) — automated patching for common third-party apps',
      'Google Sheets or Excel (free) — POA&M tracking spreadsheet',
    ],
    evidenceRequired: [
      'POA&M with tracked vulnerabilities showing severity, owner, target date, and remediation status',
      'Evidence that critical and high vulnerabilities were remediated within defined timeframes',
      'Re-scan reports showing vulnerabilities were verified as fixed after remediation',
      'Written Vulnerability Management Procedure with defined remediation timeframes',
      'Patch management logs showing when patches were applied',
    ],
    policyMapping: [
      'Risk Assessment Policy',
      'Vulnerability Management Procedure',
      'Plan of Action and Milestones (POA&M)',
      'System Security Plan (SSP) Section 3.11',
    ],
    estimatedHours: 12,
    riskPriority: 'HIGH',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CA — Security Assessment (4 controls)
// ═══════════════════════════════════════════════════════════════════════════════

export const CA_CONTROLS: NISTControl[] = [
  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'CA.2.001',
    family: 'CA',
    familyName: 'Security Assessment',
    title: 'Periodically Assess Security Controls',
    officialDescription:
      'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.',
    plainEnglish:
      'At least once a year, go through all 110 NIST controls and honestly check whether each one is actually working — not just whether you wrote a policy, but whether people are following it. Is your password policy enforced, or is everyone still using "password123"? Are your backups actually running, or did they silently fail three months ago? This self-assessment is how you find gaps before an assessor does.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you conduct at least an annual self-assessment of all NIST SP 800-171 security controls to verify they are implemented and operating effectively, and do you document the results?',
    remediationSteps: [
      'Download the NIST SP 800-171A assessment guide (free) which provides specific assessment procedures for each control. Use this as your checklist.',
      'Schedule an annual security control assessment — block out 2-3 days on your calendar. Walk through each of the 110 controls with evidence in hand.',
      'For each control, record a status (Met / Partially Met / Not Met) and supporting evidence. Use a spreadsheet or a tool like Vanta to track this.',
      'Any controls rated Partially Met or Not Met should be added to your POA&M with planned remediation actions, responsible parties, and deadlines.',
      'Have someone other than the person who implemented a control verify its effectiveness when possible — fresh eyes catch things.',
    ],
    affordableTools: [
      'NIST SP 800-171A Assessment Guide (free, from NIST) — official assessment procedures for each control',
      'Vanta ($5,000-$10,000/year for small orgs) — automated compliance monitoring and assessment',
      'Google Sheets or Excel (free) — self-assessment tracking spreadsheet',
      'Totem CMMC (free tier) — CMMC-specific self-assessment tool for small businesses',
    ],
    evidenceRequired: [
      'Completed annual self-assessment report showing status of all 110 controls',
      'Evidence of assessment methodology used (NIST 800-171A or equivalent)',
      'Assessment findings log with control-by-control status and supporting evidence references',
      'POA&M entries for any controls found to be partially met or not met',
      'Evidence that assessments are performed at least annually (dates on reports)',
    ],
    policyMapping: [
      'Security Assessment Policy',
      'Continuous Monitoring Strategy',
      'System Security Plan (SSP) Section 3.12',
      'Plan of Action and Milestones (POA&M)',
    ],
    estimatedHours: 24,
    riskPriority: 'HIGH',
  },

  {
    id: 'CA.2.002',
    family: 'CA',
    familyName: 'Security Assessment',
    title: 'Develop and Implement Plans of Action',
    officialDescription:
      'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.',
    plainEnglish:
      'When you find a security gap — from your self-assessment, a vulnerability scan, or an incident — you need to write it down in a formal Plan of Action and Milestones (POA&M). This is basically a to-do list for security fixes with deadlines. For each gap, record what the problem is, how you plan to fix it, who is responsible, and when it will be done. The DoD takes POA&Ms seriously — you will submit your SPRS score alongside any open POA&M items.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you maintain a Plan of Action and Milestones (POA&M) that documents all known security deficiencies with planned corrective actions, responsible parties, and target completion dates?',
    remediationSteps: [
      'Create a POA&M spreadsheet with columns: ID, Control Reference, Weakness Description, Severity, Planned Corrective Action, Responsible Person, Resources Required, Start Date, Target Completion Date, Milestones, and Status.',
      'Populate the POA&M with all known gaps from your self-assessment, vulnerability scans, and any audit findings. Do not leave anything out — an honest POA&M is better than a hidden gap.',
      'Set realistic target dates: critical items within 30 days, high within 90 days, medium within 180 days. Assign a specific person (not a department) to each item.',
      'Review the POA&M at least monthly: update status on each item, close completed items with evidence, and add any new items discovered.',
      'Store the POA&M alongside your SSP and be prepared to submit it to your prime contractor or the DoD if requested.',
    ],
    affordableTools: [
      'Google Sheets or Excel (free) — POA&M tracking template',
      'Totem CMMC (free tier) — generates POA&M from assessment results',
      'Vanta ($5,000-$10,000/year) — automated POA&M management and tracking',
      'NIST POA&M Template (free, from NIST) — official template format',
    ],
    evidenceRequired: [
      'Current POA&M document with all open security deficiencies',
      'Evidence of regular POA&M reviews (monthly review meeting notes or update timestamps)',
      'Closed POA&M items with evidence of completed remediation',
      'POA&M tied to self-assessment findings and vulnerability scan results',
      'Responsible parties assigned to each POA&M item',
    ],
    policyMapping: [
      'Security Assessment Policy',
      'Plan of Action and Milestones (POA&M)',
      'System Security Plan (SSP) Section 3.12',
      'Risk Management Framework',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },

  {
    id: 'CA.2.003',
    family: 'CA',
    familyName: 'Security Assessment',
    title: 'Monitor Security Controls Continuously',
    officialDescription:
      'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.',
    plainEnglish:
      'Security is not a one-time setup. You need to keep an eye on your protections all the time — not just once a year. This means regularly checking that antivirus is up to date, patches are being applied, backups are completing successfully, and your firewall rules have not been changed. Set up automated alerts where you can. At a minimum, do a monthly check of your critical controls. Think of it like checking the oil in your truck — do not wait until the engine seizes.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you continuously or at least monthly monitor the effectiveness of your security controls through automated tools, regular reviews, or dashboard checks to ensure they remain operational and effective?',
    remediationSteps: [
      'Set up Windows Defender to email you if antivirus definitions are out of date or if a threat is detected. In Windows Security > Virus & Threat Protection, enable notifications.',
      'Create a monthly security controls checklist: verify antivirus is current, verify patches are applied, check backup completion logs, verify firewall rules, review active user accounts, and check physical access logs.',
      'If using Microsoft 365 GCC, check the Security Dashboard at security.microsoft.com at least weekly for alerts, risky sign-ins, and compliance scores.',
      'Set up automated monitoring where possible: use Windows Task Scheduler to run scripts that check critical services, or use a free tool like Uptime Robot to monitor availability.',
      'Document your continuous monitoring activities in a log. Even a simple spreadsheet with date, what was checked, findings, and actions taken satisfies the requirement.',
    ],
    affordableTools: [
      'Microsoft 365 Security Dashboard (included with M365 GCC) — centralized security monitoring',
      'Windows Defender Security Center (free, built-in) — antivirus and threat monitoring',
      'Uptime Robot (free for 50 monitors) — availability monitoring for servers and services',
      'Vanta ($5,000-$10,000/year) — continuous compliance monitoring with automated evidence collection',
      'Wazuh (free, open-source) — security monitoring and SIEM for small environments',
    ],
    evidenceRequired: [
      'Continuous monitoring plan or strategy document describing what is monitored and how frequently',
      'Monthly security control review checklists (completed and signed)',
      'Automated monitoring tool dashboards or alert configuration screenshots',
      'Log of monitoring activities and any issues discovered with remediation actions',
      'Evidence that monitoring findings feed into the POA&M and risk assessment processes',
    ],
    policyMapping: [
      'Continuous Monitoring Strategy',
      'Security Assessment Policy',
      'System Security Plan (SSP) Section 3.12',
      'Incident Response Plan',
    ],
    estimatedHours: 10,
    riskPriority: 'HIGH',
  },

  {
    id: 'CA.2.004',
    family: 'CA',
    familyName: 'Security Assessment',
    title: 'Develop and Maintain System Security Plans',
    officialDescription:
      'Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.',
    plainEnglish:
      'Your System Security Plan (SSP) is the master document that describes your entire security setup. It covers what systems you have, how they are connected, where CUI flows, and how you handle each of the 110 security controls. Think of it as the blueprint for your security program. A C3PAO assessor will read your SSP first — it is literally the map they follow. Keep it updated whenever you add a new system, change a network, or modify a security practice.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have a current System Security Plan (SSP) that accurately describes your system boundaries, network architecture, CUI data flows, and how each NIST SP 800-171 control is implemented, and is it reviewed and updated at least annually?',
    remediationSteps: [
      'Download the NIST SP 800-171 SSP template from NIST or use the DoD-provided template. Fill in each section: system description, system boundary, network diagram, CUI flow description, and control-by-control implementation details.',
      'Create a network diagram showing all devices that touch CUI: workstations, servers, firewalls, routers, cloud services. Draw.io (free) works well for this. Include IP addresses or subnet ranges.',
      'For each of the 110 controls, write 2-3 sentences describing exactly how your organization implements it. Be specific — "We use BitLocker on all Windows workstations" not "Encryption is used."',
      'Set a calendar reminder to review the SSP at least annually and after any significant system change (new server, new cloud service, office move, network redesign).',
      'Store the SSP in a controlled location with limited access. It contains sensitive details about your security — treat it as CUI itself.',
    ],
    affordableTools: [
      'NIST SSP Template (free) — official starting template from NIST',
      'Draw.io / diagrams.net (free) — network diagram creation tool',
      'Totem CMMC (free tier) — generates SSP from self-assessment responses',
      'Microsoft Word or Google Docs (free/included) — document creation and version control',
      'Vanta ($5,000-$10,000/year) — automated SSP generation and maintenance',
    ],
    evidenceRequired: [
      'Current System Security Plan document covering all 110 NIST SP 800-171 controls',
      'Network architecture diagram showing system boundaries and CUI data flows',
      'Evidence the SSP was reviewed and updated within the past 12 months (revision history or review date)',
      'System inventory referenced in the SSP matching actual deployed systems',
      'SSP stored in a controlled location with limited access',
    ],
    policyMapping: [
      'System Security Plan (SSP)',
      'Security Assessment Policy',
      'Configuration Management Policy',
      'Risk Management Framework',
    ],
    estimatedHours: 40,
    riskPriority: 'CRITICAL',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SC — System and Communications Protection (16 controls)
// ═══════════════════════════════════════════════════════════════════════════════

export const SC_CONTROLS: NISTControl[] = [
  // ─── LEVEL 1 ───────────────────────────────────────────────────────────────

  {
    id: 'SC.1.001',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Monitor and Protect Communications at Boundaries',
    officialDescription:
      'Monitor, control, and protect communications (i.e., information transmitted or received by organizational systems) at the external boundaries and key internal boundaries of organizational systems.',
    plainEnglish:
      'You need a firewall between your network and the internet, and it needs to be actually configured — not just plugged in with default settings. The firewall watches all traffic going in and out and blocks anything suspicious. If you have separate networks (like an office network and a shop floor network), put a firewall or at least managed switch rules between them too. Check your firewall logs periodically to see if anything sketchy is trying to get in.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Do you have a properly configured firewall at your internet boundary that monitors and controls inbound and outbound network traffic, and do you review firewall logs for suspicious activity?',
    remediationSteps: [
      'If you are using the basic router from your ISP, replace it with a proper firewall. A pfSense appliance (Netgate 1100 for ~$189) or a Ubiquiti Dream Machine (~$379) gives you real firewall capabilities with logging.',
      'Configure your firewall with a "deny all inbound" default rule, then create specific allow rules only for traffic you actually need (e.g., inbound VPN, outbound web browsing, outbound email).',
      'Enable firewall logging and review logs weekly for blocked connection attempts, especially from foreign IP addresses or unusual ports.',
      'If you have different network segments (office, shop floor, guest WiFi), configure firewall rules between them so the guest WiFi cannot reach your CUI systems.',
      'Document your firewall rules in a spreadsheet: rule number, source, destination, port, protocol, action (allow/deny), and business justification.',
    ],
    affordableTools: [
      'pfSense (free software, Netgate hardware from $189) — enterprise-grade open-source firewall',
      'Ubiquiti Dream Machine ($379) — all-in-one router, firewall, and network management',
      'Windows Defender Firewall (free, built-in) — host-based firewall on every Windows machine',
      'Wireshark (free, open-source) — network traffic analysis for investigating suspicious activity',
    ],
    evidenceRequired: [
      'Firewall configuration export showing rule set with deny-by-default policy',
      'Network diagram showing firewall placement at external and key internal boundaries',
      'Firewall log samples showing traffic is being monitored and suspicious traffic blocked',
      'Documented firewall rule set with business justifications for each allow rule',
      'Evidence of periodic firewall log review (review notes or screenshots)',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Network Security Policy',
      'System Security Plan (SSP) Section 3.13',
      'Firewall Management Procedure',
    ],
    estimatedHours: 12,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'SC.1.005',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Implement Subnetworks for Public Components',
    officialDescription:
      'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.',
    plainEnglish:
      'If you have anything connected to the internet that outsiders can reach — like a public website, a web server, or a guest WiFi network — it must be on a completely separate network segment from your internal computers that handle CUI. This is called a DMZ or a separate VLAN. If a hacker breaks into your website, they should not be able to hop over to your accounting server. Your guest WiFi should be on its own VLAN so visitors cannot see your internal network.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Are publicly accessible systems (such as web servers or guest WiFi) on separate network segments (VLANs or DMZ) that are logically or physically isolated from internal networks containing CUI?',
    remediationSteps: [
      'Identify all publicly accessible components: web servers, guest WiFi, any services exposed to the internet. These must be isolated from your internal CUI network.',
      'Configure your firewall or managed switch to create separate VLANs: at minimum, a CUI/internal VLAN, a guest WiFi VLAN, and a DMZ VLAN for any public-facing servers.',
      'Set firewall rules so the guest WiFi VLAN can only reach the internet — not your internal VLAN. The DMZ should only allow specific, necessary traffic to the internal network.',
      'Test the segmentation: connect a device to the guest WiFi and try to ping or browse to an internal CUI system. It should fail. Document the test result.',
      'Update your network diagram to show VLAN segmentation and firewall rules between segments.',
    ],
    affordableTools: [
      'pfSense (free software) — VLAN and DMZ configuration with firewall rules between segments',
      'Ubiquiti UniFi managed switches (from $100) — VLAN support for network segmentation',
      'Ubiquiti Dream Machine ($379) — built-in VLAN and network segmentation capabilities',
      'Netgear managed switches (from $80) — affordable VLAN-capable switches for small networks',
    ],
    evidenceRequired: [
      'Network diagram showing VLAN or DMZ segmentation with publicly accessible components isolated',
      'Firewall or switch VLAN configuration showing separate segments',
      'Firewall rules between segments demonstrating traffic restrictions',
      'Test results showing guest WiFi or DMZ cannot access internal CUI systems',
      'Written network segmentation documentation or policy',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Network Security Policy',
      'System Security Plan (SSP) Section 3.13',
      'Network Architecture Documentation',
    ],
    estimatedHours: 10,
    riskPriority: 'CRITICAL',
  },

  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'SC.2.002',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Employ Effective Security Architecture',
    officialDescription:
      'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.',
    plainEnglish:
      'Design your network and systems with security baked in from the start — do not bolt it on later. This means things like defense in depth (multiple layers of protection), least privilege (give the minimum access needed), and keeping CUI systems separated from non-sensitive ones. If you are buying new equipment or setting up a new cloud service, think about how it fits into your security architecture before deploying it. A flat network where everything can talk to everything is a poor architecture.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is your network and system architecture designed with security principles such as defense in depth, network segmentation, and least privilege, rather than relying on a single point of protection?',
    remediationSteps: [
      'Document your current network architecture in a diagram showing all network segments, firewalls, servers, and key workstations. Identify any areas where segmentation is missing.',
      'Implement defense in depth: ensure you have protection at multiple layers — perimeter firewall, host-based firewall on each machine, endpoint antivirus, email filtering, and network monitoring.',
      'Segment your network so CUI systems are on a dedicated VLAN that only authorized users and services can reach. Do not mix CUI workstations with general-purpose devices on the same flat network.',
      'Apply least privilege to network services: disable unnecessary ports and services on all systems, remove default accounts, and ensure service accounts have minimum required permissions.',
      'Review architecture whenever you add new systems or services. Document any architectural decisions and their security rationale.',
    ],
    affordableTools: [
      'Draw.io / diagrams.net (free) — create and maintain network architecture diagrams',
      'pfSense (free) — implement defense in depth with firewall, VPN, and network segmentation',
      'Windows Defender Firewall (free) — host-based firewall on every Windows workstation',
      'CIS Benchmarks (free) — hardening guides for operating systems and applications',
    ],
    evidenceRequired: [
      'Network architecture diagram showing defense-in-depth layers and segmentation',
      'Documentation of security architecture design principles applied to the environment',
      'Evidence of multiple protection layers (firewall, endpoint, email, network)',
      'System hardening documentation or CIS Benchmark compliance evidence',
      'Architecture review records showing security was considered for new systems',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Network Security Policy',
      'System Security Plan (SSP) Section 3.13',
      'Configuration Management Policy',
    ],
    estimatedHours: 16,
    riskPriority: 'HIGH',
  },

  {
    id: 'SC.2.003',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Separate User and System Management Functionality',
    officialDescription:
      'Separate user functionality from system management functionality.',
    plainEnglish:
      'The account you use to check email and browse the web should not be the same account you use to manage servers and install software. Create separate admin accounts for IT tasks. Your day-to-day account should be a standard user. When you need to do something administrative, use "Run as Administrator" or log in with your admin credentials. This way, if your regular account gets compromised by a phishing email, the attacker does not get admin powers.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do administrators use separate accounts for day-to-day work and system administration tasks, ensuring that standard user activities like email and web browsing are not performed with administrative credentials?',
    remediationSteps: [
      'For anyone who performs IT administration: create a separate admin account (e.g., "john.admin") in addition to their regular user account (e.g., "john"). The admin account should only be used for administrative tasks.',
      'Remove the regular user account from the local Administrators group on all workstations. Day-to-day work should be done as a standard user.',
      'When administrative tasks are needed, use "Run as Administrator" or Remote Desktop with the admin account — never browse the web, read email, or open documents with the admin account.',
      'Configure Windows User Account Control (UAC) to "Always Notify" so any elevation prompt requires the admin credentials explicitly.',
    ],
    affordableTools: [
      'Windows Active Directory (included with Windows Server) — manage separate admin and user accounts',
      'Windows UAC (free, built-in) — enforce separation of admin and user activities',
      'Microsoft 365 Admin roles (included) — separate admin and regular user roles in the cloud',
      'JumpCloud Free (up to 10 users) — manage separate admin identities centrally',
    ],
    evidenceRequired: [
      'List of admin accounts showing they are separate from regular user accounts',
      'Screenshots showing admin users have a standard (non-admin) account for daily work',
      'UAC configuration set to "Always Notify" (screenshot of UAC settings)',
      'Written policy requiring separation of admin and user accounts',
    ],
    policyMapping: [
      'Access Control Policy',
      'System and Communications Protection Policy',
      'System Security Plan (SSP) Section 3.13',
      'Least Privilege Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'SC.2.004',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Prevent Unauthorized Info Transfer via Shared Resources',
    officialDescription:
      'Prevent unauthorized and unintended information transfer via shared system resources.',
    plainEnglish:
      'When multiple users share a computer or system, make sure one person\'s data does not leak to another. Clear clipboard data, temporary files, and browser caches between user sessions. If you use shared workstations, each user should have their own Windows profile. Disable features like shared clipboard in remote desktop sessions if they are not needed. The goal is to prevent CUI from accidentally ending up where it should not be.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you take measures to prevent CUI from leaking between users through shared system resources such as temporary files, clipboard data, shared workstations, and browser caches?',
    remediationSteps: [
      'Ensure every user on shared workstations has their own Windows user profile — no shared "shop" logins. Each profile isolates temporary files, downloads, and browser data.',
      'Configure Group Policy to clear the paging file on shutdown: Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options > "Shutdown: Clear virtual memory pagefile" set to Enabled.',
      'Disable clipboard redirection in Remote Desktop if users RDP into shared servers: Group Policy > Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Device and Resource Redirection > "Do not allow clipboard redirection."',
      'Set browsers to clear cache, cookies, and download history on exit for shared workstations.',
    ],
    affordableTools: [
      'Windows Group Policy (free, built-in) — configure shared resource protections',
      'BleachBit (free, open-source) — clear temporary files, caches, and logs on demand',
      'Windows User Profiles (free, built-in) — isolate user data on shared workstations',
      'CCleaner Free — automated cleanup of temporary files and browser caches',
    ],
    evidenceRequired: [
      'Group Policy settings showing virtual memory pagefile is cleared on shutdown',
      'Evidence that shared workstations use individual user profiles (not shared accounts)',
      'Remote Desktop clipboard redirection policy configuration (if applicable)',
      'Browser configuration showing cache clearing on exit for shared workstations',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Access Control Policy',
      'System Security Plan (SSP) Section 3.13',
      'Media Protection Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'LOW',
  },

  {
    id: 'SC.2.006',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Deny Network Traffic by Default',
    officialDescription:
      'Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).',
    plainEnglish:
      'Your firewall should start by blocking everything and then you open up only the specific traffic you need. Do not start with "allow all" and try to block the bad stuff — you will miss something. For example, allow outbound web traffic on ports 80 and 443, allow your VPN port, allow email ports, and block everything else. This applies to both your network firewall and the Windows firewall on each machine. If you cannot explain why a port is open, close it.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are your firewalls (network and host-based) configured with a default-deny policy that blocks all traffic except for specifically authorized and documented exceptions?',
    remediationSteps: [
      'On your network firewall (pfSense, Ubiquiti, etc.), set the default rule on every interface to DENY ALL. Then add specific allow rules above it for traffic that is needed.',
      'Document each firewall allow rule with a business justification: "Allow outbound TCP 443 from internal VLAN to any — required for web browsing and cloud services."',
      'On Windows workstations, verify Windows Defender Firewall is set to block inbound connections by default: Windows Security > Firewall & Network Protection > verify all profiles show "Firewall is on" and inbound connections are blocked.',
      'Audit your firewall rules quarterly: remove any rules that no longer have a valid business need. Stale rules are security holes.',
      'Test your deny-default configuration by attempting to connect on a port you have not explicitly allowed — it should be blocked.',
    ],
    affordableTools: [
      'pfSense (free) — default-deny firewall configuration with rule documentation',
      'Windows Defender Firewall (free, built-in) — host-based default-deny firewall',
      'Ubiquiti Dream Machine ($379) — firewall with default-deny policy support',
      'Nmap (free, open-source) — test which ports are open to verify deny-default is working',
    ],
    evidenceRequired: [
      'Firewall configuration showing default-deny rule as the last rule on each interface',
      'Documented firewall rule set with business justification for each allow rule',
      'Windows Defender Firewall configuration screenshot showing inbound blocked by default',
      'Quarterly firewall rule audit records',
      'Port scan test results confirming unauthorized ports are blocked',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Network Security Policy',
      'Firewall Management Procedure',
      'System Security Plan (SSP) Section 3.13',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },

  {
    id: 'SC.2.007',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Prevent Remote Device Split Tunneling',
    officialDescription:
      'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (i.e., split tunneling).',
    plainEnglish:
      'When employees connect to your company network through VPN from home, all their internet traffic should go through the VPN — not just the traffic to company resources. Without this, an attacker on their home network could potentially use the employee\'s computer as a bridge into your company network. Configure your VPN to use "full tunnel" mode, not "split tunnel." This means their Netflix might be slower while on VPN, but your network stays safe.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is your VPN configured to use full-tunnel mode (not split-tunnel) so that all traffic from remote devices passes through the organizational network when connected via VPN?',
    remediationSteps: [
      'Check your current VPN configuration: in pfSense OpenVPN settings, ensure "Redirect IPv4 Gateway" is checked. In WireGuard, set AllowedIPs to 0.0.0.0/0 in the client config.',
      'If using Windows built-in VPN, go to the VPN connection properties > Networking > TCP/IPv4 Properties > Advanced, and check "Use default gateway on remote network."',
      'Test full-tunnel is working: while connected to VPN, visit whatismyip.com — it should show the company\'s public IP, not the employee\'s home IP.',
      'Document the VPN configuration showing full-tunnel mode is enforced and include it in your network documentation.',
    ],
    affordableTools: [
      'WireGuard (free, open-source) — modern VPN with easy full-tunnel configuration',
      'pfSense OpenVPN (free) — full-tunnel VPN with centralized management',
      'Windows built-in VPN client (free) — supports full-tunnel configuration',
      'Tailscale (free for up to 3 users) — modern VPN with exit node for full-tunnel capability',
    ],
    evidenceRequired: [
      'VPN server configuration showing full-tunnel (not split-tunnel) is enforced',
      'VPN client configuration files showing all traffic routes through the tunnel',
      'Test results confirming full-tunnel is active (IP address verification while on VPN)',
      'Written VPN policy requiring full-tunnel mode for all remote connections',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Remote Access Policy',
      'System Security Plan (SSP) Section 3.13',
      'Network Security Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'SC.2.008',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Encrypt CUI in Transit',
    officialDescription:
      'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission.',
    plainEnglish:
      'Anytime CUI moves over a network — whether over the internet or even within your office — it must be encrypted. This means using HTTPS (not HTTP) for web applications, encrypted email (TLS), VPN for remote access, and encrypted file transfers (SFTP, not FTP). If you send CUI in an email, either your email system must enforce TLS encryption or you should use an encrypted email service. Think of encryption as a locked envelope — anyone who intercepts it cannot read the contents.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is all CUI encrypted during transmission using approved cryptographic methods such as TLS 1.2+, VPN, or encrypted email, including both external communications and internal network transfers?',
    remediationSteps: [
      'Enable TLS 1.2 or higher on all web services and disable older protocols (TLS 1.0, 1.1, SSL). In IIS, use IIS Crypto (free tool) to configure this in one click.',
      'Configure Microsoft 365 to enforce TLS for all email in transit: Exchange Admin Center > Mail Flow > Connectors, verify opportunistic TLS is enabled (it is by default in M365 GCC).',
      'For file transfers, switch from FTP to SFTP or use OneDrive/SharePoint with HTTPS — never transfer CUI over unencrypted protocols.',
      'Ensure your VPN uses strong encryption: AES-256 for WireGuard or OpenVPN. Verify this in your VPN server configuration.',
      'Test your encryption: use Qualys SSL Labs (free) to test your web server and email TLS configuration at ssllabs.com.',
    ],
    affordableTools: [
      'Microsoft 365 GCC (from $12/user/month) — TLS encryption for email and file sharing built-in',
      'WireGuard VPN (free) — AES-256 encrypted VPN tunnels',
      'IIS Crypto by Nartac Software (free) — configure TLS settings on Windows servers with one click',
      'Qualys SSL Labs (free) — test your TLS configuration online',
      'Let\'s Encrypt (free) — free TLS certificates for websites',
    ],
    evidenceRequired: [
      'TLS configuration showing TLS 1.2 or higher is enforced on web and email services',
      'VPN configuration showing strong encryption (AES-256 or equivalent)',
      'Qualys SSL Labs test results showing good TLS configuration grades',
      'Email transport rules or connector settings showing TLS enforcement',
      'Written policy requiring encryption of CUI in transit',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Encryption Policy',
      'System Security Plan (SSP) Section 3.13',
      'Media Protection Policy',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'SC.2.009',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Terminate Sessions After Inactivity',
    officialDescription:
      'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.',
    plainEnglish:
      'When someone walks away from their computer or their VPN session sits idle, the connection should automatically end after a set period. This prevents someone from coming back to an unlocked session hours later — or worse, an attacker finding an active session on an unattended machine. Set VPN timeouts, web application session timeouts, and remote desktop timeouts to disconnect after 15-30 minutes of inactivity.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do your systems automatically terminate VPN connections, remote desktop sessions, and web application sessions after a defined period of inactivity (typically 15-30 minutes)?',
    remediationSteps: [
      'Configure Windows screen lock to activate after 15 minutes of inactivity: Settings > Personalization > Lock Screen > Screen timeout settings, or via Group Policy.',
      'Set VPN session timeout: in pfSense OpenVPN, set "Inactive" to 1800 seconds (30 minutes). In WireGuard, configure PersistentKeepalive and handle timeouts at the firewall level.',
      'For Remote Desktop sessions, configure idle timeout via Group Policy: Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Session Time Limits > set idle limit to 30 minutes.',
      'For web applications, configure session timeout in the application settings (most default to 20-30 minutes, verify this is enabled and not set to "never").',
    ],
    affordableTools: [
      'Windows Group Policy (free, built-in) — configure screen lock and session timeouts',
      'pfSense VPN settings (free) — configure VPN idle timeout',
      'Windows Remote Desktop Session Settings (free, built-in) — idle disconnect configuration',
      'Browser settings (free) — configure session timeout behavior',
    ],
    evidenceRequired: [
      'Group Policy or Windows Settings showing screen lock timeout of 15 minutes or less',
      'VPN configuration showing session idle timeout (30 minutes or less)',
      'Remote Desktop session timeout policy configuration screenshot',
      'Web application session timeout configuration evidence',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Access Control Policy',
      'System Security Plan (SSP) Section 3.13',
      'Remote Access Policy',
    ],
    estimatedHours: 3,
    riskPriority: 'LOW',
  },

  {
    id: 'SC.2.010',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Establish and Manage Cryptographic Keys',
    officialDescription:
      'Establish and manage cryptographic keys for cryptography employed in organizational systems.',
    plainEnglish:
      'If you are using encryption (and you should be), you need to manage the keys properly. BitLocker recovery keys, TLS certificate private keys, VPN keys — they all need to be stored securely and you need to know where they are. Do not leave recovery keys on sticky notes. Store them in a password manager or a secure, backed-up location. When keys expire or are compromised, replace them. Keep a simple inventory of what keys you have and where they are stored.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you maintain an inventory of cryptographic keys used in your environment (BitLocker, TLS, VPN) with secure storage, defined lifetimes, and procedures for key rotation and revocation?',
    remediationSteps: [
      'Create a cryptographic key inventory spreadsheet: key type (BitLocker, TLS cert, VPN key), associated system, creation date, expiration date, storage location, and responsible person.',
      'Store BitLocker recovery keys in Microsoft 365 Azure AD (automatic with Intune) or in a secure, encrypted document in your password manager. Never store them in plain text on the same machine.',
      'Set calendar reminders for TLS certificate renewals — most certificates expire annually. Consider Let\'s Encrypt with auto-renewal to avoid surprise expirations.',
      'For VPN keys, document where the server key is stored and ensure it has restricted file permissions. Rotate VPN keys annually or if a compromise is suspected.',
    ],
    affordableTools: [
      'Microsoft 365 with Azure AD (included) — automatic BitLocker key storage and management',
      'Bitwarden Teams ($3/user/month) — secure storage for encryption keys and certificates',
      'Let\'s Encrypt with Certbot (free) — automated TLS certificate management with auto-renewal',
      'Google Sheets or Excel (free) — cryptographic key inventory tracker',
    ],
    evidenceRequired: [
      'Cryptographic key inventory listing all keys, their types, and storage locations',
      'Evidence of secure key storage (Azure AD for BitLocker, password manager for others)',
      'Key rotation or renewal records showing keys are managed within their lifetimes',
      'Written key management procedure describing generation, storage, rotation, and revocation',
    ],
    policyMapping: [
      'Encryption Policy',
      'System and Communications Protection Policy',
      'System Security Plan (SSP) Section 3.13',
      'Key Management Procedure',
    ],
    estimatedHours: 6,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'SC.2.011',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Employ FIPS-Validated Cryptography',
    officialDescription:
      'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.',
    plainEnglish:
      'The encryption you use to protect CUI must be FIPS 140-2 validated — this is a government certification that the encryption algorithm and implementation have been tested and approved. The good news is Windows has a FIPS mode built in, and BitLocker uses FIPS-validated encryption when FIPS mode is enabled. You do not need to buy special software — just enable the FIPS compliance setting in Windows and make sure your VPN and TLS configurations use FIPS-approved algorithms like AES-256.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is FIPS 140-2 validated cryptography enabled and used for all encryption protecting CUI, including full-disk encryption, VPN tunnels, and data in transit?',
    remediationSteps: [
      'Enable FIPS compliance mode in Windows via Group Policy: Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options > "System cryptography: Use FIPS compliant algorithms for encryption, hashing, and signing" set to Enabled.',
      'Verify BitLocker is using AES-256 (FIPS-validated) by running "manage-bde -status" in an admin command prompt. If using AES-128, re-encrypt with AES-256.',
      'Check your VPN configuration to ensure it uses FIPS-approved ciphers: AES-256-GCM for OpenVPN, or ChaCha20-Poly1305 for WireGuard (check FIPS validation status of your specific implementation).',
      'For TLS, ensure your web servers and email services use TLS 1.2+ with FIPS-approved cipher suites. Use IIS Crypto to configure this on Windows servers.',
      'Document all cryptographic modules in use and their FIPS 140-2 validation certificate numbers. Check the NIST CMVP database at csrc.nist.gov.',
    ],
    affordableTools: [
      'Windows FIPS Mode (free, built-in) — enable FIPS-compliant algorithms via Group Policy',
      'BitLocker with AES-256 (free, included with Windows Pro) — FIPS-validated full-disk encryption',
      'IIS Crypto by Nartac Software (free) — configure FIPS-compliant TLS cipher suites',
      'NIST CMVP Database (free, online) — verify FIPS validation status of cryptographic modules',
    ],
    evidenceRequired: [
      'Group Policy setting showing FIPS compliance mode is enabled',
      'BitLocker status showing AES-256 encryption on all CUI workstations',
      'VPN configuration showing FIPS-approved encryption algorithms',
      'TLS configuration showing FIPS-compliant cipher suites',
      'List of cryptographic modules in use with FIPS 140-2 certificate numbers',
    ],
    policyMapping: [
      'Encryption Policy',
      'System and Communications Protection Policy',
      'System Security Plan (SSP) Section 3.13',
      'Key Management Procedure',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'SC.2.012',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Prohibit Remote Activation of Collaborative Devices',
    officialDescription:
      'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.',
    plainEnglish:
      'Webcams and microphones on computers in areas where CUI is discussed should not be remotely activatable by anyone — not by IT staff, not by a hacker. Disable remote camera and mic activation features. When a webcam is active, there should be a visible indicator light so people in the room know they could be recorded. For conference room speakerphones and webcams, unplug or cover them when not in a meeting. This prevents eavesdropping on sensitive conversations.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are collaborative computing devices (webcams, microphones, speakerphones) protected against remote activation, and do they provide visible or audible indicators when active?',
    remediationSteps: [
      'Verify all laptops have a physical webcam indicator light (most modern laptops do). For external webcams without indicator lights, use a physical webcam cover slide (~$5 for a pack).',
      'In Windows, disable remote access to camera and microphone: Settings > Privacy > Camera and Microphone, disable access for apps that do not need it.',
      'For conference room equipment, establish a procedure to disconnect or power off webcams and speakerphones when not in active use. A simple power strip with an on/off switch works well.',
      'Implement a Group Policy to restrict which applications can access the camera and microphone on CUI workstations.',
    ],
    affordableTools: [
      'Webcam cover slides (~$5/pack) — physical privacy covers for laptop cameras',
      'Windows Privacy Settings (free, built-in) — control which apps can access camera and microphone',
      'Power strip with switch (~$10) — disconnect conference room devices when not in use',
      'Windows Group Policy (free) — restrict camera and microphone application access',
    ],
    evidenceRequired: [
      'Windows Privacy settings screenshots showing camera and microphone access restrictions',
      'Photo evidence of webcam covers or indicator lights on workstations in CUI areas',
      'Procedure document for conference room device management (disconnect when not in use)',
      'Group Policy configuration restricting camera and microphone access',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Physical Protection Policy',
      'System Security Plan (SSP) Section 3.13',
      'Acceptable Use Policy',
    ],
    estimatedHours: 2,
    riskPriority: 'LOW',
  },

  {
    id: 'SC.2.013',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Control Mobile Code',
    officialDescription:
      'Control and monitor the use of mobile code.',
    plainEnglish:
      'Mobile code means things like JavaScript, Java applets, ActiveX controls, and macros in Office documents — code that runs automatically when you visit a website or open a file. These can be used to attack your systems. Block Office macros from running by default (most ransomware starts with a macro), disable Java in browsers unless specifically needed, and use browser security settings to control what scripts can execute. An assessor wants to see you have thought about this and have protections in place.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you control mobile code execution by blocking Office macros by default, restricting browser plugins and scripts, and preventing unauthorized active content from running on systems containing CUI?',
    remediationSteps: [
      'Block Office macros by default via Group Policy: User Configuration > Administrative Templates > Microsoft Office > Security Settings > "Block macros from running in Office files from the Internet" set to Enabled.',
      'Configure Windows Defender Attack Surface Reduction (ASR) rules to block Office applications from creating child processes and injecting code — this stops macro-based attacks.',
      'Remove or disable Java browser plugins on all workstations unless specifically required for a business application. Document any exceptions.',
      'Enable Windows SmartScreen: Settings > Privacy & Security > Windows Security > App & Browser Control > Reputation-based protection settings, enable all options.',
    ],
    affordableTools: [
      'Windows Group Policy (free) — block Office macros and control mobile code',
      'Windows Defender ASR Rules (free, built-in) — attack surface reduction for mobile code threats',
      'Windows SmartScreen (free, built-in) — block malicious downloads and scripts',
      'Browser security settings (free) — restrict JavaScript and plugin execution',
    ],
    evidenceRequired: [
      'Group Policy configuration showing Office macros are blocked from internet sources',
      'Windows Defender ASR rules configuration showing relevant protections enabled',
      'Browser security settings showing script and plugin controls',
      'Written policy on mobile code restrictions and any documented exceptions',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Configuration Management Policy',
      'System Security Plan (SSP) Section 3.13',
      'Acceptable Use Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'SC.2.014',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Control VoIP Technologies',
    officialDescription:
      'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.',
    plainEnglish:
      'If you use internet-based phone systems like Microsoft Teams calling, Zoom Phone, or a VoIP service, you need to make sure those calls are encrypted and the system is configured securely. VoIP calls can be intercepted if they are not encrypted. Make sure your VoIP system uses encryption (most modern ones do by default), put VoIP traffic on its own VLAN if possible, and have a policy about discussing CUI over VoIP versus regular phone lines. Document what VoIP system you use and how it is secured.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you monitor and control VoIP usage by ensuring VoIP traffic is encrypted, VoIP devices are on a separate network segment where feasible, and policies exist regarding discussion of CUI over VoIP?',
    remediationSteps: [
      'Inventory your VoIP systems: document what platform you use (Microsoft Teams, Zoom, RingCentral, on-premises PBX) and verify it supports encryption for voice traffic.',
      'Verify encryption is enabled: Microsoft Teams encrypts calls by default. For other providers, check their security settings and confirm TLS/SRTP encryption is active.',
      'If using on-premises VoIP phones, configure a separate VLAN for VoIP traffic to prevent snooping from the data network.',
      'Write a short policy statement: CUI may only be discussed over encrypted VoIP systems or traditional phone lines — not over unencrypted consumer apps.',
    ],
    affordableTools: [
      'Microsoft Teams (included with M365 GCC) — encrypted VoIP with compliance features',
      'Zoom Phone (from $10/user/month) — encrypted VoIP with call monitoring capabilities',
      'VoIP VLAN configuration on managed switches (existing hardware) — network segmentation for VoIP',
      'Wireshark (free) — verify VoIP traffic is encrypted on your network',
    ],
    evidenceRequired: [
      'Inventory of VoIP systems in use with encryption status documented',
      'VoIP platform configuration showing encryption is enabled (TLS/SRTP)',
      'Network diagram showing VoIP VLAN segmentation (if applicable)',
      'Written policy on VoIP usage and CUI discussion restrictions',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Acceptable Use Policy',
      'System Security Plan (SSP) Section 3.13',
      'Network Security Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'LOW',
  },

  {
    id: 'SC.2.015',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Protect Authenticity of Communication Sessions',
    officialDescription:
      'Protect the authenticity of communications sessions.',
    plainEnglish:
      'When your systems communicate — your browser to a website, your email client to the server, your VPN client to the VPN server — you need to be sure you are actually talking to the right system, not an impersonator. This is what TLS certificates and VPN authentication do. Make sure your web applications use valid TLS certificates (the padlock in the browser), your VPN verifies the server identity with certificates, and your email server authenticates before accepting connections. This prevents man-in-the-middle attacks.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do your systems verify the identity of communication endpoints using mechanisms like TLS certificates, VPN server authentication, and email server authentication to prevent man-in-the-middle attacks?',
    remediationSteps: [
      'Ensure all internal and external web services use valid TLS certificates from a trusted certificate authority. Use Let\'s Encrypt (free) for external sites and verify certificates are not expired.',
      'Configure your VPN to authenticate the server using a certificate, not just a pre-shared key. In OpenVPN, use certificate-based authentication for both server and client.',
      'Enable SPF, DKIM, and DMARC for your email domain to prevent email spoofing: these DNS records verify that emails actually came from your mail servers.',
      'Train employees to verify the padlock icon in browsers when accessing CUI systems and to report certificate warnings immediately.',
    ],
    affordableTools: [
      'Let\'s Encrypt (free) — trusted TLS certificates with automatic renewal',
      'OpenVPN with certificate auth (free) — mutual certificate authentication for VPN',
      'MXToolbox (free) — verify SPF, DKIM, and DMARC email authentication records',
      'Qualys SSL Labs (free) — test TLS certificate validity and configuration',
    ],
    evidenceRequired: [
      'TLS certificate inventory showing valid, non-expired certificates on all services',
      'VPN configuration showing certificate-based authentication',
      'DNS records showing SPF, DKIM, and DMARC are configured for email authentication',
      'Qualys SSL Labs test results for external-facing web services',
    ],
    policyMapping: [
      'System and Communications Protection Policy',
      'Encryption Policy',
      'System Security Plan (SSP) Section 3.13',
      'Email Security Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'SC.2.016',
    family: 'SC',
    familyName: 'System and Communications Protection',
    title: 'Protect Confidentiality of CUI at Rest',
    officialDescription:
      'Protect the confidentiality of CUI at rest.',
    plainEnglish:
      'CUI sitting on a hard drive, USB stick, or file server must be encrypted even when nobody is actively using it. If someone steals a laptop, the encrypted hard drive is useless to them without the password. Use BitLocker to encrypt all hard drives on computers that store CUI. For removable media like USB drives, use BitLocker To Go. For cloud storage, ensure your provider encrypts data at rest (Microsoft 365 GCC does this by default). A stolen, unencrypted laptop with CUI is a reportable incident.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is CUI encrypted at rest on all storage media including workstation hard drives, server storage, removable media, and cloud storage using FIPS-validated encryption such as BitLocker?',
    remediationSteps: [
      'Enable BitLocker on all Windows workstations that store or process CUI: Control Panel > BitLocker Drive Encryption > Turn on BitLocker. Use AES-256 encryption.',
      'For USB drives used with CUI, enable BitLocker To Go: insert the USB, right-click in File Explorer > Turn on BitLocker. Require a password to unlock.',
      'Configure a Group Policy to require BitLocker on all fixed and removable drives: Computer Configuration > Administrative Templates > Windows Components > BitLocker Drive Encryption.',
      'Verify cloud storage encryption: confirm your Microsoft 365 GCC or cloud provider encrypts data at rest (M365 uses AES-256 by default). Get a letter of attestation from the provider if possible.',
      'Store BitLocker recovery keys securely in Azure AD or a printed copy in a fire-safe. Never store recovery keys on the same machine that is encrypted.',
    ],
    affordableTools: [
      'BitLocker (free, included with Windows Pro/Enterprise) — FIPS-validated full-disk encryption',
      'BitLocker To Go (free, built-in) — encryption for USB drives and removable media',
      'Microsoft 365 GCC (from $12/user/month) — data-at-rest encryption included',
      'VeraCrypt (free, open-source) — file and volume encryption for non-Windows systems',
    ],
    evidenceRequired: [
      'BitLocker status report showing all CUI workstations are encrypted (manage-bde -status output)',
      'Group Policy configuration requiring BitLocker on fixed and removable drives',
      'BitLocker recovery key storage documentation (Azure AD or secure physical location)',
      'Cloud provider attestation of data-at-rest encryption',
      'Written policy requiring encryption of CUI at rest on all media',
    ],
    policyMapping: [
      'Encryption Policy',
      'Media Protection Policy',
      'System and Communications Protection Policy',
      'System Security Plan (SSP) Section 3.13',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SI — System and Information Integrity (7 controls)
// ═══════════════════════════════════════════════════════════════════════════════

export const SI_CONTROLS: NISTControl[] = [
  // ─── LEVEL 1 ───────────────────────────────────────────────────────────────

  {
    id: 'SI.1.001',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Identify, Report, and Correct System Flaws',
    officialDescription:
      'Identify, report, and correct information and information system flaws in a timely manner.',
    plainEnglish:
      'Keep your computers patched and updated. When Microsoft releases a Windows update or a software vendor pushes a security fix, apply it within 30 days for critical patches and within 90 days for everything else. Enable Windows Update on all machines and check weekly that it is actually working. This is one of the most basic and most important things you can do — the majority of cyberattacks exploit known vulnerabilities that already have patches available but were never installed.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Do you apply security patches and updates to operating systems and software within defined timeframes (e.g., critical patches within 30 days) and verify that automatic updates are functioning on all systems?',
    remediationSteps: [
      'Enable Windows Update on all workstations and servers: Settings > Update & Security > Windows Update > ensure updates are set to install automatically.',
      'Check Windows Update weekly: verify no updates are pending or failed. Create a recurring calendar task for this check.',
      'For third-party software (browsers, Adobe, Java, etc.), use Patch My PC or Ninite Pro to automate updates, or check manually monthly.',
      'Establish patch management timeframes in your policy: Critical patches within 14 days, Important within 30 days, Moderate within 90 days.',
      'Keep a patch log: record when patches were applied, which systems, and any issues encountered. A simple spreadsheet works fine.',
    ],
    affordableTools: [
      'Windows Update (free, built-in) — automatic Microsoft security patches',
      'WSUS (free, included with Windows Server) — centralized patch management for Windows environments',
      'Patch My PC (free home / $3/device business) — third-party application patching',
      'Ninite Pro (from $1/machine/month) — automated third-party software updates',
    ],
    evidenceRequired: [
      'Windows Update settings showing automatic updates are enabled on all systems',
      'Patch compliance report showing current patch level of all systems',
      'Patch log documenting when patches were applied and to which systems',
      'Written patch management policy with defined timeframes for different severity levels',
      'Evidence of third-party software patching (update logs or tool reports)',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Patch Management Procedure',
      'Configuration Management Policy',
      'System Security Plan (SSP) Section 3.14',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'SI.1.002',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Provide Malicious Code Protection',
    officialDescription:
      'Provide protection from malicious code at appropriate locations within organizational information systems.',
    plainEnglish:
      'Every computer needs antivirus software that is actually running and up to date. Windows Defender is free, built into Windows 10 and 11, and is good enough for most small defense contractors. Make sure it is turned on, real-time protection is enabled, and it is updating its virus definitions at least daily. Do not let employees disable it. Also, make sure your email has spam and malware filtering — most ransomware starts with a phishing email carrying a malicious attachment.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Is antivirus or anti-malware software installed, actively running with real-time protection enabled, and automatically updating on all systems that store or process CUI?',
    remediationSteps: [
      'Verify Windows Defender is enabled on all workstations: Windows Security > Virus & Threat Protection > verify "Real-time protection" is ON and "Cloud-delivered protection" is ON.',
      'Ensure automatic definition updates are working: Windows Security > Virus & Threat Protection > Protection updates, verify definitions were updated within the last 24 hours.',
      'Prevent users from disabling antivirus via Group Policy: Computer Configuration > Administrative Templates > Windows Components > Microsoft Defender Antivirus > "Turn off Microsoft Defender Antivirus" set to Not Configured or Disabled.',
      'Enable email malware filtering: if using Microsoft 365 GCC, verify Microsoft Defender for Office 365 is configured with Safe Attachments and Safe Links policies.',
      'Run a full system scan on all workstations monthly, in addition to the ongoing real-time protection.',
    ],
    affordableTools: [
      'Windows Defender (free, built-in) — enterprise-quality antivirus included with Windows',
      'Microsoft Defender for Office 365 (included with M365 Business Premium or GCC) — email malware filtering',
      'Malwarebytes Free — on-demand malware scanner for second-opinion scans',
      'ClamAV (free, open-source) — antivirus for servers and Linux systems',
    ],
    evidenceRequired: [
      'Windows Defender status screenshots showing real-time protection enabled on all systems',
      'Antivirus definition update timestamps showing updates within the last 24 hours',
      'Group Policy configuration preventing users from disabling antivirus',
      'Email filtering configuration showing malware scanning is active',
      'Monthly full scan logs or reports',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Malware Protection Policy',
      'System Security Plan (SSP) Section 3.14',
      'Incident Response Plan',
    ],
    estimatedHours: 4,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'SI.1.004',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Update Malicious Code Protection Mechanisms',
    officialDescription:
      'Update malicious code protection mechanisms when new releases are available.',
    plainEnglish:
      'Your antivirus is only as good as its latest update. New viruses and malware are discovered every day, and your antivirus needs the latest definitions to catch them. Make sure virus definitions update automatically at least once per day. Also update the antivirus engine itself when new versions are released. If a computer has been offline for a while (like a laptop that was in a drawer for a month), update it before reconnecting it to the network.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Are antivirus and anti-malware definitions configured to update automatically at least daily, and are antivirus engine updates applied when new versions are released?',
    remediationSteps: [
      'Verify Windows Defender automatic updates are enabled: Windows Security > Virus & Threat Protection > Protection updates > check that "Security intelligence" shows a recent update date (within 24 hours).',
      'Ensure Windows Update is set to install updates automatically, as Defender definition updates are delivered through Windows Update.',
      'For any offline or infrequently used devices, establish a procedure: before reconnecting to the network, connect to the internet, run Windows Update, and verify Defender definitions are current.',
      'If using a third-party antivirus, verify its automatic update settings are enabled and check the vendor\'s update frequency (should be at least daily).',
    ],
    affordableTools: [
      'Windows Defender Automatic Updates (free, built-in) — automatic daily definition updates via Windows Update',
      'Windows Update (free, built-in) — delivers Defender engine and definition updates',
      'WSUS (free, with Windows Server) — centralized antivirus update management and reporting',
      'Microsoft Endpoint Manager / Intune (from $8/user/month) — cloud-based AV update management',
    ],
    evidenceRequired: [
      'Windows Defender definition update timestamps showing daily updates across all systems',
      'Windows Update configuration showing automatic updates are enabled',
      'Antivirus engine version information showing the current version is installed',
      'Procedure for updating offline devices before network reconnection',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Malware Protection Policy',
      'Patch Management Procedure',
      'System Security Plan (SSP) Section 3.14',
    ],
    estimatedHours: 2,
    riskPriority: 'HIGH',
  },

  {
    id: 'SI.1.005',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Perform Periodic and Real-Time Malware Scans',
    officialDescription:
      'Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.',
    plainEnglish:
      'Real-time scanning means your antivirus checks every file the moment it is opened, downloaded, or run. Periodic scanning means running a full scan of the entire hard drive on a schedule — at least weekly. You need both. Real-time scanning catches threats immediately, but a full scan can find malware that was hiding before your definitions were updated. Also, any file from email, a USB drive, or the internet should be scanned before opening it.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Is real-time malware scanning enabled on all systems to scan files as they are downloaded or opened, and do you run periodic full-system scans at least weekly?',
    remediationSteps: [
      'Verify real-time protection is enabled in Windows Defender: Windows Security > Virus & Threat Protection > verify "Real-time protection" toggle is ON.',
      'Schedule a weekly full system scan: open Task Scheduler > create a new task that runs "C:\\Program Files\\Windows Defender\\MpCmdRun.exe -Scan -ScanType 2" every Sunday at 2:00 AM.',
      'Enable scanning of removable drives: Windows Security > Virus & Threat Protection > Scan options > ensure "Removable drives" is included in scan settings.',
      'Configure email attachment scanning: in Microsoft 365 GCC, verify Safe Attachments policy is enabled in Microsoft Defender for Office 365.',
      'Educate employees: never open a file from a USB drive or email attachment without first verifying the source. When in doubt, right-click the file and select "Scan with Microsoft Defender."',
    ],
    affordableTools: [
      'Windows Defender Real-Time Protection (free, built-in) — continuous file scanning',
      'Windows Task Scheduler (free, built-in) — schedule weekly full system scans',
      'Microsoft Defender for Office 365 (included with M365 Business Premium/GCC) — email attachment scanning',
      'Malwarebytes Free — on-demand second-opinion scanning',
    ],
    evidenceRequired: [
      'Windows Defender settings showing real-time protection is enabled on all systems',
      'Scheduled task or scan policy showing weekly full scans are configured',
      'Recent full scan reports showing completion and findings (or clean results)',
      'Email scanning configuration showing attachments are scanned before delivery',
      'Policy or procedure requiring scanning of removable media before use',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Malware Protection Policy',
      'Media Protection Policy',
      'System Security Plan (SSP) Section 3.14',
    ],
    estimatedHours: 3,
    riskPriority: 'HIGH',
  },

  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'SI.2.003',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Monitor Security Alerts and Advisories',
    officialDescription:
      'Monitor system security alerts and advisories and take action in response.',
    plainEnglish:
      'Stay informed about new security threats that could affect your systems. Subscribe to alerts from CISA (the US cybersecurity agency), Microsoft Security, and your firewall vendor. When a critical alert comes out — like a major Windows vulnerability or a widespread ransomware campaign — read it and take action. This might mean applying an emergency patch, blocking a specific website, or warning your employees about a phishing campaign. Do not just subscribe and ignore the emails.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you subscribe to security alert sources (such as CISA, Microsoft Security, vendor advisories) and have a process to review alerts, determine applicability, and take timely action on relevant advisories?',
    remediationSteps: [
      'Subscribe to CISA alerts at cisa.gov/subscribe — select "Alerts" and "Current Activity" notifications. These are free and cover the most critical threats.',
      'Subscribe to Microsoft Security Response Center (MSRC) notifications at msrc.microsoft.com for Windows and Office vulnerability alerts.',
      'Designate one person (your IT point of contact) as the security alert reviewer. They should check alert emails at least twice per week and determine if any apply to your systems.',
      'Create a simple alert response log: date received, alert source, description, applicability (yes/no), action taken, and date completed.',
      'For critical alerts that apply to your systems, respond within 48 hours — whether that means patching, changing a configuration, or alerting employees.',
    ],
    affordableTools: [
      'CISA Alerts (free) — US government cybersecurity advisories and threat intelligence',
      'Microsoft Security Response Center (free) — vulnerability alerts for Microsoft products',
      'US-CERT National Vulnerability Database (free) — comprehensive vulnerability database',
      'Google Sheets or Excel (free) — alert tracking and response log',
    ],
    evidenceRequired: [
      'Evidence of active subscriptions to security alert sources (email subscription confirmations)',
      'Alert response log showing received alerts, applicability assessments, and actions taken',
      'Examples of actions taken in response to security advisories (patches applied, configurations changed)',
      'Written procedure for monitoring and responding to security alerts',
      'Designated personnel responsible for alert monitoring',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Incident Response Plan',
      'Vulnerability Management Procedure',
      'System Security Plan (SSP) Section 3.14',
    ],
    estimatedHours: 4,
    riskPriority: 'HIGH',
  },

  {
    id: 'SI.2.006',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Monitor Systems for Attacks',
    officialDescription:
      'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.',
    plainEnglish:
      'You need to be watching what is happening on your network — not just blocking things with a firewall, but actively looking for suspicious activity. This means monitoring network traffic for unusual patterns, checking for failed login attempts, watching for large data transfers, and looking for connections to known-bad IP addresses. You do not need a full security operations center — free tools like Windows Defender with its built-in firewall logging, or Wazuh (free SIEM), can give you visibility into what is happening.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you actively monitor your network and systems for indicators of attack, including unusual login attempts, unexpected data transfers, connections to suspicious destinations, and malware indicators?',
    remediationSteps: [
      'Enable Windows Defender Firewall logging on all workstations: Windows Defender Firewall > Advanced Settings > Properties > select each profile (Domain, Private, Public) > Logging > enable log dropped packets and successful connections.',
      'If using pfSense, enable Snort or Suricata IDS package (free) to monitor network traffic for attack signatures. Configure it to alert on suspicious traffic patterns.',
      'Set up failed login monitoring: in Windows Event Viewer, create a custom view filtering for Event ID 4625 (failed logon) and review weekly for brute force attempts.',
      'Consider deploying Wazuh (free, open-source SIEM) on a dedicated machine to centralize log collection and alerting from all your systems.',
      'Review monitoring dashboards or logs at least weekly. Document any suspicious findings and actions taken in your security log.',
    ],
    affordableTools: [
      'Wazuh (free, open-source) — full SIEM with intrusion detection and log analysis',
      'Snort / Suricata (free, open-source) — network intrusion detection systems',
      'Windows Defender Firewall Logging (free, built-in) — network traffic logging',
      'Windows Event Viewer (free, built-in) — monitor failed logins and security events',
      'pfSense with Snort package (free) — network-level intrusion detection on your firewall',
    ],
    evidenceRequired: [
      'Network monitoring tool configuration (IDS, SIEM, or firewall logging)',
      'Sample monitoring reports or dashboard screenshots showing active monitoring',
      'Log review records showing weekly or more frequent analysis of security events',
      'Evidence of response to detected suspicious activity (incident tickets or log entries)',
      'Written monitoring procedure describing what is monitored, how often, and by whom',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Continuous Monitoring Strategy',
      'Incident Response Plan',
      'System Security Plan (SSP) Section 3.14',
    ],
    estimatedHours: 16,
    riskPriority: 'HIGH',
  },

  {
    id: 'SI.2.007',
    family: 'SI',
    familyName: 'System and Information Integrity',
    title: 'Identify Unauthorized System Use',
    officialDescription:
      'Identify unauthorized use of organizational systems.',
    plainEnglish:
      'You need to be able to spot when someone is using your systems in a way they should not be — whether that is an employee accessing files outside their role, someone logging in at 3 AM from a foreign country, or a program running that nobody installed. Review your audit logs and watch for anomalies. Set up alerts for things like logins from unusual locations, access to sensitive folders by unauthorized accounts, or new software installations. The earlier you catch unauthorized use, the less damage it can do.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have mechanisms to detect unauthorized use of your systems, such as monitoring for anomalous login patterns, unauthorized file access, unapproved software installations, and off-hours activity?',
    remediationSteps: [
      'Enable Windows audit logging via Group Policy: Computer Configuration > Windows Settings > Security Settings > Advanced Audit Policy Configuration > enable Logon/Logoff, Object Access, and Account Management audit events.',
      'In Microsoft 365, enable Unified Audit Logging in the Compliance Center: search.compliance.microsoft.com > Audit > verify auditing is turned on. This logs all user activity in email, SharePoint, and Teams.',
      'Create alerts for suspicious patterns: in Microsoft 365 Security Center, set up alert policies for impossible travel activity, mass file downloads, and logins from unfamiliar locations.',
      'Review Windows Security Event logs weekly for Event ID 4624 (successful logon) at unusual hours and Event ID 4663 (file access) to sensitive CUI folders.',
      'Maintain a baseline of normal system usage (who logs in when, what software runs, typical data transfer volumes) so you can spot deviations.',
    ],
    affordableTools: [
      'Windows Advanced Audit Policy (free, built-in) — detailed security event logging',
      'Microsoft 365 Unified Audit Log (included with M365) — cloud activity monitoring',
      'Microsoft 365 Alert Policies (included) — automated alerts for suspicious activity',
      'Wazuh (free, open-source) — centralized log analysis and anomaly detection',
      'Netwrix Auditor Free — file access auditing and change detection',
    ],
    evidenceRequired: [
      'Audit logging configuration showing relevant events are captured (logon, file access, account changes)',
      'Evidence of regular audit log review (weekly review notes or automated alert reports)',
      'Alert policy configuration for suspicious activity patterns',
      'Examples of detected unauthorized use and response actions taken (if any occurred)',
      'Written procedure for detecting and responding to unauthorized system use',
    ],
    policyMapping: [
      'System and Information Integrity Policy',
      'Audit and Accountability Policy',
      'Incident Response Plan',
      'System Security Plan (SSP) Section 3.14',
    ],
    estimatedHours: 10,
    riskPriority: 'HIGH',
  },
];
