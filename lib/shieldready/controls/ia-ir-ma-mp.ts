import { NISTControl } from '../types';

// ============================================================
// IDENTIFICATION & AUTHENTICATION (IA) — 11 Controls
// NIST SP 800-171 Rev 2, Section 3.5
// Max SPRS Deduction: -29
// ============================================================

export const IA_CONTROLS: NISTControl[] = [
  {
    id: 'IA.1.076',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Identify system users, processes, and devices',
    officialDescription:
      'Identify information system users, processes acting on behalf of users, and devices.',
    plainEnglish:
      'Every person, computer program, and device that touches your system must have a unique identity — no shared accounts, no anonymous logins. Think of it like a sign-in sheet at your office front door: you need to know exactly who (or what) came in. For your 8-person shop, this means every employee has their own Windows login, every service account has a name, and every printer or networked device is registered. If someone leaves, you know exactly which account to disable.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Does every user, automated process, and networked device have a unique, individually assigned identifier — with no shared or generic accounts in active use?',
    remediationSteps: [
      'Audit all user accounts in Active Directory or Azure AD and confirm each maps to one specific, named individual.',
      'Delete or disable all shared, guest, or named-after-roles accounts (e.g., "admin", "front-desk") and create personal accounts for each user.',
      'Inventory every networked device (printers, NAS drives, IoT devices) and assign each a documented hostname and service account where applicable.',
      'Document all automated service accounts (backup jobs, monitoring agents) with an owner assigned and a purpose recorded.',
      'Set a quarterly review calendar reminder to audit account lists and remove any stale identities.',
    ],
    affordableTools: [
      'Azure Active Directory Free (included with Microsoft 365 Business Basic)',
      'Windows Local Users and Groups (built-in, no cost)',
      'Microsoft 365 Admin Center — user management console',
      'Netwrix Account Lockout Examiner (free edition)',
    ],
    evidenceRequired: [
      'Screenshot of full user account list showing no shared or generic accounts',
      'Device inventory spreadsheet mapping each device to an owner or service account',
      'Service account register with owner names and business purpose',
      'Signed Acceptable Use Policy referencing individual account responsibility',
    ],
    policyMapping: [
      'User Account Management Policy',
      'Acceptable Use Policy',
      'System Access Control Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'CRITICAL',
  },
  {
    id: 'IA.1.077',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Authenticate identities of users, processes, and devices',
    officialDescription:
      'Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.',
    plainEnglish:
      'After you know who someone claims to be (identification), you must verify it is really them before letting them in. The most basic form is a password. Every single account on every single system must require a password before access is granted — no auto-login workstations, no Wi-Fi without a password, no systems that just open when you click them. For your small team, this means Windows login passwords are mandatory on every laptop, your router requires a strong admin password, and any cloud service requires a password at login.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Does every system, application, and device require credential-based authentication before granting access — with no systems accessible without logging in?',
    remediationSteps: [
      'Enable Windows password requirement on all workstations via Group Policy or local security policy: require password at logon and on wake from sleep.',
      'Change all default passwords on routers, switches, printers, and NAS devices to strong unique passwords documented in a password manager.',
      'Verify every cloud application (email, file storage, CRM) requires a username and password — disable any "open" or "anonymous" access configurations.',
      'Enable screen-lock after 15 minutes of inactivity on all workstations and mobile devices accessing company data.',
      'Store all administrative credentials in a password manager (Bitwarden Teams) so no password is written on a sticky note or stored in plain text.',
    ],
    affordableTools: [
      'Windows Group Policy (built-in with Windows Pro/Enterprise)',
      'Bitwarden Teams — password manager ($3/user/month)',
      'Microsoft 365 — enforces authentication on all cloud services',
      'Router admin console (built-in to your existing network hardware)',
    ],
    evidenceRequired: [
      'Group Policy Object (GPO) export or screenshot showing password requirement enforced',
      'Screenshot of screen-lock policy applied to all workstations',
      'Password manager subscription showing all team members enrolled',
      'Evidence that default passwords have been changed on all network devices (configuration screenshots)',
    ],
    policyMapping: [
      'Password Management Policy',
      'System Access Control Policy',
      'Workstation Security Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'CRITICAL',
  },
  {
    id: 'IA.2.078',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Use multifactor authentication for local and network access',
    officialDescription:
      'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.',
    plainEnglish:
      'A password alone is not enough anymore — attackers can steal passwords. MFA adds a second check (like a code on your phone) so even if your password is stolen, the attacker still cannot get in. For your team: every person must use MFA to log into Microsoft 365 email, and any admin account must use MFA even for local Windows logins. Microsoft Authenticator is free, takes 10 minutes to set up per person, and is the single highest-return security investment you can make. This one control blocks over 99% of automated credential-stuffing attacks.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is MFA enforced on all privileged accounts for both local and network access, AND on all non-privileged accounts for network access — with no exemptions or bypass methods in place?',
    remediationSteps: [
      'Enable Azure AD MFA for all users in Microsoft 365 Admin Center: go to Azure Active Directory > Security > MFA and enable per-user MFA or use Conditional Access (included in Microsoft 365 Business Premium).',
      'Deploy Microsoft Authenticator app on every employee smartphone — walk each person through enrollment in a 15-minute setup session.',
      'Create a Conditional Access policy (Business Premium) or enforce Security Defaults (free) that blocks any login without MFA regardless of location.',
      'For privileged/admin accounts, enforce MFA via Windows Hello for Business or require FIDO2 security keys for local machine access.',
      'Document MFA enrollment for each user and test a simulated login from outside the office to confirm MFA challenge fires.',
    ],
    affordableTools: [
      'Microsoft Authenticator — free iOS/Android app',
      'Azure AD Security Defaults — free MFA enforcement for Microsoft 365',
      'Microsoft 365 Business Premium — includes Conditional Access ($22/user/month)',
      'FIDO2 YubiKey security keys for admin accounts (~$25-$50 each, one-time cost)',
      'Duo Security Free — up to 10 users at no cost',
    ],
    evidenceRequired: [
      'Azure AD MFA status report showing 100% of users enrolled',
      'Conditional Access policy screenshot showing MFA required for all apps',
      'Authentication log showing MFA challenges being triggered on logins',
      'Signed user enrollment records confirming each employee completed MFA setup',
    ],
    policyMapping: [
      'Multifactor Authentication Policy',
      'Password Management Policy',
      'Privileged Access Management Policy',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },
  {
    id: 'IA.2.079',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Employ replay-resistant authentication mechanisms',
    officialDescription:
      'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.',
    plainEnglish:
      'Some attacks work by intercepting your login credentials and "replaying" them later to gain access. Replay-resistant authentication prevents this by making each login attempt unique — so a captured credential is useless. In practice, using modern protocols like Kerberos (built into Windows domain login), TLS 1.2/1.3 (used automatically by HTTPS websites), and time-based one-time passwords (TOTP, which is what Microsoft Authenticator generates) all qualify. If your team is on Microsoft 365 with MFA already enforced, you likely satisfy this control already — the key is documenting it.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do all network authentication mechanisms use replay-resistant protocols (such as Kerberos, TLS 1.2+, or TOTP-based MFA) — and has this been verified and documented?',
    remediationSteps: [
      'Verify Windows domain authentication uses Kerberos by checking Active Directory settings; if using a workgroup, configure Windows Hello for Business which uses asymmetric cryptography (inherently replay-resistant).',
      'Confirm all remote access (VPN, RDP) uses TLS 1.2 or 1.3 by checking server/VPN configuration and disabling TLS 1.0 and 1.1.',
      'Ensure MFA tokens used are time-based (TOTP) or challenge-based — Microsoft Authenticator satisfies this by default.',
      'Disable NTLM authentication in Group Policy where feasible and enforce Kerberos for internal domain authentication.',
      'Document the authentication protocols in use as part of your System Security Plan (SSP).',
    ],
    affordableTools: [
      'Windows Active Directory / Azure AD Kerberos (built-in)',
      'Microsoft Authenticator TOTP (free)',
      'IIS Crypto (free tool to verify and enforce TLS settings)',
      'Nmap SSL scan or Qualys SSL Labs (free online TLS checker)',
    ],
    evidenceRequired: [
      'Group Policy configuration showing NTLM restricted or Kerberos enforced',
      'TLS configuration screenshot showing only TLS 1.2 and 1.3 enabled on all servers and VPN endpoints',
      'System Security Plan section documenting replay-resistant mechanisms in use',
      'Screenshot of MFA method configuration confirming TOTP or challenge-response tokens',
    ],
    policyMapping: [
      'Authentication Standards Policy',
      'Network Security Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 5,
    riskPriority: 'HIGH',
  },
  {
    id: 'IA.2.080',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Prevent reuse of identifiers',
    officialDescription:
      'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.',
    plainEnglish:
      'Once a user account is deleted or disabled, you must never give that same username or employee ID to a new person. If John Smith (jsmith) leaves, the next employee cannot be assigned "jsmith" even if their name is Jane Smith. This prevents audit logs from being ambiguous — every action recorded under an ID should permanently link back to one specific person. For your 8-person team, this is straightforward: keep a simple spreadsheet of all usernames ever assigned, even for people who have left, and check it before creating new accounts.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented process ensuring that identifiers (usernames, employee IDs, device names) are never reassigned to a different user or device after being retired?',
    remediationSteps: [
      'Create and maintain a "Username Registry" spreadsheet listing every username ever assigned, the person it was assigned to, their start date, and end date if applicable.',
      'When creating new accounts, consult the registry and verify the proposed username has never been previously assigned.',
      'Configure Azure AD to retain disabled account records — do not permanently delete accounts for at least 90 days so audit trails remain intact.',
      'Establish a naming convention that includes a numeric suffix (jsmith1, jsmith2) to handle natural name collisions without reuse.',
      'Include identifier non-reuse as a checklist item in your employee offboarding procedure.',
    ],
    affordableTools: [
      'Microsoft Excel or Google Sheets — username registry tracking',
      'Azure AD (retains deleted account history for 30 days by default, configurable)',
      'Microsoft 365 Admin Center — shows all active and deleted users',
    ],
    evidenceRequired: [
      'Username registry spreadsheet showing historical assignments with dates',
      'Account creation procedure document referencing registry check step',
      'Azure AD deleted users list showing deactivated accounts retained for audit',
      'Offboarding checklist with identifier retirement step included',
    ],
    policyMapping: [
      'User Account Management Policy',
      'Identity Lifecycle Management Policy',
    ],
    estimatedHours: 2,
    riskPriority: 'LOW',
  },
  {
    id: 'IA.2.081',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Disable identifiers after defined period of inactivity',
    officialDescription:
      'Disable identifiers after a defined inactivity period.',
    plainEnglish:
      'If someone has not logged into an account in a long time — say 90 days — that account should be automatically disabled. Dormant accounts are dangerous because they can be compromised without anyone noticing. For your small company, this is most relevant for vendor accounts, old employee accounts that were not properly offboarded, and service accounts for tools you no longer use. Set a policy (90 days is standard) and configure Azure AD or your domain to auto-disable inactive accounts.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are user and service account identifiers automatically disabled after a defined period of inactivity (90 days or less) — and is this enforced technically, not just procedurally?',
    remediationSteps: [
      'Set a formal inactivity threshold in your policy — 90 days is the CMMC-accepted standard.',
      'In Azure AD, use the "Sign-in activity" report to identify accounts with no login in 90+ days; export and review quarterly.',
      'For on-premises Active Directory, run the PowerShell command: Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 on a scheduled task to auto-disable accounts.',
      'Configure Azure AD Access Reviews (available in Azure AD Premium P2, or manually via script in free tier) to flag stale accounts monthly.',
      'Include a "last login review" step in your quarterly IT security checklist.',
    ],
    affordableTools: [
      'Azure AD Sign-in Activity Reports (included in Microsoft 365)',
      'PowerShell with AD module — free, built-in for Windows Server',
      'Netwrix Auditor Free Community Edition — inactive account detection',
      'Microsoft 365 Admin Center — last activity dates visible per user',
    ],
    evidenceRequired: [
      'Written policy defining 90-day (or shorter) inactivity threshold',
      'Screenshot of inactive account report showing review was performed',
      'Evidence of disabled accounts (audit log of disable actions)',
      'Quarterly calendar entry or task record for scheduled account review',
    ],
    policyMapping: [
      'User Account Management Policy',
      'Identity Lifecycle Management Policy',
      'Offboarding Procedures',
    ],
    estimatedHours: 3,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'IA.2.082',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Enforce minimum password complexity and change of characters',
    officialDescription:
      'Enforce a minimum password complexity and change of characters when new passwords are created.',
    plainEnglish:
      'Passwords must meet minimum strength requirements: a mix of uppercase letters, lowercase letters, numbers, and symbols — and they must be long enough that they are hard to guess. NIST now recommends focusing on length over complexity: a 12-14 character minimum with at least one number and one symbol is the sweet spot. The "change of characters" requirement means a new password must be meaningfully different from the old one — not just changing one character. For your team, configure Windows password policy and Microsoft 365 password policy to enforce these rules automatically.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is a minimum password complexity standard (length, character variety, change-of-character requirements) technically enforced on all systems — not just documented in policy?',
    remediationSteps: [
      'Set Windows password policy via Group Policy (Computer Configuration > Windows Settings > Security Settings > Account Policies > Password Policy): minimum 12 characters, complexity enabled (forces mixed character types).',
      'In Microsoft 365 Admin Center, configure password expiration and complexity settings under Settings > Org Settings > Security & Privacy > Password Policy.',
      'Configure the "minimum password age" to at least 1 day and "enforce password history" to 24 passwords to prevent immediate recycling.',
      'Consider adopting a passphrase standard (e.g., four random words: "purple-table-canyon-7") which is long, complex, and memorable — document this in your Password Policy.',
      'Deploy Bitwarden or similar password manager so employees can handle complex passwords without writing them down.',
    ],
    affordableTools: [
      'Windows Group Policy — built-in password complexity enforcement',
      'Microsoft 365 Password Policy settings (Admin Center)',
      'Bitwarden Teams — $3/user/month password manager',
      'Have I Been Pwned API (free) — check if passwords appear in breach databases',
    ],
    evidenceRequired: [
      'Group Policy Object screenshot showing minimum password length (12+) and complexity enabled',
      'Microsoft 365 password policy screenshot',
      'Written Password Policy document specifying complexity requirements',
      'Screenshot of password history setting (24 generations recommended)',
    ],
    policyMapping: [
      'Password Management Policy',
      'System Access Control Policy',
    ],
    estimatedHours: 3,
    riskPriority: 'HIGH',
  },
  {
    id: 'IA.2.083',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Prohibit password reuse for a specified number of generations',
    officialDescription:
      'Prohibit password reuse for a specified number of generations.',
    plainEnglish:
      'Your employees cannot keep cycling back to the same password. If Windows remembers the last 24 passwords and refuses to let you re-use any of them, that is this control. This prevents the common habit of "Password1!" → "Password2!" → back to "Password1!" when forced to change. For your team, this is a single Group Policy setting that takes 2 minutes to configure and requires zero ongoing effort once set.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is password reuse technically prevented for a defined number of generations (minimum 5, ideally 24) on all systems — enforced at the system level, not just by policy?',
    remediationSteps: [
      'In Group Policy Editor, navigate to Computer Configuration > Windows Settings > Security Settings > Account Policies > Password Policy and set "Enforce password history" to 24.',
      'For Microsoft 365 accounts, the platform enforces password history automatically — verify this is not overridden to a lower value.',
      'For any line-of-business applications with their own authentication (ERP, CRM), check if they have a password history setting and configure it to match.',
      'Document the selected number of generations (24) in your Password Management Policy.',
      'Test the enforcement by attempting to set a previous password on a test account and confirming the system rejects it.',
    ],
    affordableTools: [
      'Windows Group Policy (built-in, no cost)',
      'Microsoft 365 Admin Center — built-in history enforcement',
      'Bitwarden Teams — generates unique passwords making reuse a non-issue',
    ],
    evidenceRequired: [
      'Group Policy screenshot showing "Enforce password history" set to 24 or greater',
      'Microsoft 365 password settings screenshot',
      'Password Management Policy document specifying the number of prohibited generations',
      'Test evidence showing rejected attempt to reuse a previous password',
    ],
    policyMapping: [
      'Password Management Policy',
      'System Access Control Policy',
    ],
    estimatedHours: 1,
    riskPriority: 'LOW',
  },
  {
    id: 'IA.2.084',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Allow temporary password use with immediate change requirement',
    officialDescription:
      'Allow temporary password use for system logons with an immediate change to a permanent password.',
    plainEnglish:
      'When IT creates a new account or resets a forgotten password, they give the employee a temporary password. The system must force the employee to change that temporary password the very first time they log in — the employee should never be allowed to keep using the temporary password day-to-day. This is a standard feature in Windows and Microsoft 365: when you create an account, you check the box "User must change password at next logon." For your team, make this part of every new account setup and every password reset procedure.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is the "user must change password at next logon" flag set whenever a temporary or reset password is issued — and is it technically enforced so the user cannot bypass it?',
    remediationSteps: [
      'For every new Windows account creation or password reset, check the "User must change password at next logon" option in Active Directory Users and Computers or Azure AD.',
      'In Microsoft 365, when resetting a user\'s password, always leave the "Require this user to change their password when they first sign in" toggle enabled.',
      'Document this requirement as a mandatory step in your New Employee Onboarding and Password Reset procedures.',
      'Verify the enforcement by logging in with a reset account and confirming the password change prompt appears before any other action is possible.',
      'Train the helpdesk person (even if that is you, the owner) to never skip this step when creating or resetting accounts.',
    ],
    affordableTools: [
      'Azure Active Directory — built-in "must change password" flag (included in Microsoft 365)',
      'Windows Active Directory Users and Computers — built-in, no cost',
      'Microsoft 365 Admin Center — password reset interface with the toggle',
    ],
    evidenceRequired: [
      'Screenshot of the new user creation screen showing "must change password at next logon" selected',
      'Password Reset Procedure document specifying mandatory temporary password with forced change',
      'Test log showing a newly reset account prompted for password change on first login',
    ],
    policyMapping: [
      'Password Management Policy',
      'User Account Management Policy',
      'Onboarding and Offboarding Procedures',
    ],
    estimatedHours: 1,
    riskPriority: 'LOW',
  },
  {
    id: 'IA.2.085',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Store and transmit only cryptographically-protected passwords',
    officialDescription:
      'Store and transmit only cryptographically-protected passwords.',
    plainEnglish:
      'Passwords must never be stored in plain text (like in a spreadsheet or a text file) or sent across the network unencrypted. Properly protected means the password is "hashed" — converted into a scrambled one-way code using an algorithm like bcrypt or PBKDF2, so even if the database is stolen, the actual passwords cannot be recovered. Transmission protection means passwords are only ever sent over HTTPS/TLS connections, never over HTTP, plain FTP, or unencrypted email. For your team: use a password manager (never a spreadsheet), ensure all services use HTTPS, and never email passwords in plain text.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are all passwords stored exclusively in cryptographically hashed form (not plaintext or reversibly encrypted) — and are all password transmissions protected by TLS 1.2 or higher?',
    remediationSteps: [
      'Immediately audit whether any passwords are stored in plain text: check shared drives, SharePoint, OneNote, email threads, and sticky notes. Delete or replace any found.',
      'Migrate all password storage to Bitwarden Teams or Microsoft 365 Password Manager — both use AES-256 encryption and PBKDF2 hashing for storage.',
      'For any custom web applications or databases your company operates, verify the developer used bcrypt, Argon2, or PBKDF2 for password hashing — never MD5 or SHA-1 alone.',
      'Force HTTPS-only on any web services or applications you manage: configure HSTS headers and redirect all HTTP traffic to HTTPS.',
      'Confirm all remote access tools (VPN, RDP gateway, web portals) use TLS 1.2 or 1.3 — use IIS Crypto or SSL Labs to verify.',
    ],
    affordableTools: [
      'Bitwarden Teams — AES-256 encrypted password vault ($3/user/month)',
      'Let\'s Encrypt — free TLS certificates for any web service you host',
      'IIS Crypto (free) — configure TLS settings on Windows servers',
      'SSL Labs Server Test (free online) — verify your TLS configuration',
      'Qualys BrowserCheck (free) — verify client TLS support',
    ],
    evidenceRequired: [
      'Password manager enrollment showing all users storing credentials in the vault',
      'SSL Labs test results showing A or A+ rating for all web services',
      'Attestation that no plain-text password files exist (with evidence of audit)',
      'TLS configuration screenshot for VPN and RDP gateway endpoints',
      'System Security Plan section documenting password storage and transmission protection mechanisms',
    ],
    policyMapping: [
      'Password Management Policy',
      'Cryptography Policy',
      'Data Transmission Security Policy',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },
  {
    id: 'IA.2.086',
    family: 'IA',
    familyName: 'Identification & Authentication',
    title: 'Obscure feedback of authentication information',
    officialDescription:
      'Obscure feedback of authentication information during the authentication process to protect the information from possible exploitation/use by unauthorized individuals.',
    plainEnglish:
      'When someone types a password, the characters must appear as dots or asterisks — not as the actual letters and numbers. This prevents "shoulder surfing," where someone nearby reads your password as you type it. It also applies to any error messages: a failed login should say "Invalid username or password" not "Invalid password" (which confirms the username is correct). This is a default behavior in every modern operating system and browser, but you must verify it has not been disabled anywhere and that no custom application you use shows password characters in clear text.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are all password entry fields on all systems configured to mask input characters — and do authentication failure messages avoid disclosing whether the username or password was the failing element?',
    remediationSteps: [
      'Test every login screen used by your employees (Windows logon, Microsoft 365, VPN portal, line-of-business apps) and confirm password characters display as dots or asterisks.',
      'If any custom or third-party application shows password characters in plain text, contact the vendor for a fix or configuration change; document it as a Plan of Action & Milestones (POA&M) item if no fix is available.',
      'Review authentication error messages across all systems: they should say "invalid credentials" rather than specifically identifying which field failed.',
      'Disable the "Show password" reveal button on any kiosk or shared workstation login screens through Group Policy if your environment warrants it.',
      'Add a "shoulder surfing awareness" note to your annual security awareness training.',
    ],
    affordableTools: [
      'Windows Group Policy — can restrict password reveal button in Internet Explorer/Edge',
      'Microsoft Intune (included in Microsoft 365 Business Premium) — manage mobile device login screen settings',
      'Manual verification checklist (no special tool needed for most of this)',
    ],
    evidenceRequired: [
      'Screenshots of each major login screen showing masked password fields',
      'Documentation of any exceptions identified and POA&M entries created',
      'Review of authentication error messages confirming generic wording',
      'Security awareness training materials including shoulder surfing guidance',
    ],
    policyMapping: [
      'Password Management Policy',
      'User Interface Security Standards',
      'Security Awareness Training Policy',
    ],
    estimatedHours: 2,
    riskPriority: 'LOW',
  },
];

// ============================================================
// INCIDENT RESPONSE (IR) — 3 Controls
// NIST SP 800-171 Rev 2, Section 3.6
// Max SPRS Deduction: -9
// ============================================================

export const IR_CONTROLS: NISTControl[] = [
  {
    id: 'IR.2.092',
    family: 'IR',
    familyName: 'Incident Response',
    title: 'Establish operational incident-handling capability',
    officialDescription:
      'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.',
    plainEnglish:
      'You need a written plan for what to do when something goes wrong — a ransomware attack, a stolen laptop, an employee accidentally emailing CUI to the wrong person. The plan must cover six phases: (1) preparation (have the plan before you need it), (2) detection (how do you find out an incident happened), (3) analysis (figure out what happened and how bad it is), (4) containment (stop the bleeding — disconnect infected machines, revoke compromised accounts), (5) recovery (restore from backups, rebuild systems), and (6) user response (notify affected parties). For your 8-person shop, this does not need to be 200 pages — a clear 5-10 page Incident Response Plan that your whole team can understand and follow is perfect.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does the organization have a documented, approved, and accessible Incident Response Plan covering all six phases (prepare, detect, analyze, contain, recover, respond) — and does every employee know where to find it and what their role is?',
    remediationSteps: [
      'Draft an Incident Response Plan (IRP) using the NIST 800-61 Rev 2 framework as a template. At minimum, define: incident categories (malware, data breach, lost device, insider threat), severity levels, and response procedures for each.',
      'Assign roles even in your small team: one person is the Incident Response Lead (probably the owner or most technical person), one is the Communications Lead (who notifies customers, DOD, insurance), and define the backup if someone is unavailable.',
      'Create a one-page Emergency Contact Card listing: your IT support contact (MSP), your Cyber Insurance carrier\'s 24/7 claims line, DOD/DCSA reporting contact, your attorney, and your backup contact person.',
      'Define your containment playbooks: (a) Ransomware — immediately disconnect infected machine from network, call IT support, do NOT pay ransom; (b) Lost laptop — immediately remotely wipe via Microsoft 365 Mobile Device Management; (c) Phishing success — revoke session tokens, reset password, enable MFA.',
      'Store the IRP in at least two places: a printed copy in a physical binder and a digital copy in SharePoint or a USB drive kept off the main network — so it is accessible even if your systems are down.',
    ],
    affordableTools: [
      'NIST 800-61 Rev 2 — free incident response framework guide',
      'Microsoft 365 Security & Compliance Center — incident detection and investigation',
      'Microsoft Defender for Business (included in M365 Business Premium) — automated incident detection',
      'CyberInsurance carrier IR hotline — included with most SMB cyber policies ($500-$2,000/year)',
      'CISA Free Incident Response resources at cisa.gov',
    ],
    evidenceRequired: [
      'Approved and dated Incident Response Plan document',
      'Evidence of plan distribution to all employees (email confirmation, signed acknowledgment)',
      'Emergency contact card with current phone numbers and reporting contacts',
      'Documented incident response roles and responsibilities with named individuals',
      'At least one completed incident log from a real or tabletop exercise event',
    ],
    policyMapping: [
      'Incident Response Plan',
      'Business Continuity Plan',
      'Data Breach Notification Policy',
    ],
    estimatedHours: 16,
    riskPriority: 'CRITICAL',
  },
  {
    id: 'IR.2.093',
    family: 'IR',
    familyName: 'Incident Response',
    title: 'Track, document, and report incidents',
    officialDescription:
      'Track, document, and report incidents to appropriate officials and/or authorities both internal and external to the organization.',
    plainEnglish:
      'When a security incident happens — even a minor one like a phishing email that someone clicked — you must write it down: what happened, when, who was affected, what you did about it, and what the outcome was. Some incidents must also be reported externally: if CUI is compromised or potentially compromised, you may need to report to the contracting officer and potentially DCSA within 72 hours. Keeping an "Incident Log" does not need to be fancy — even a shared Google Sheet or a SharePoint list works, as long as it is consistently maintained and backed up.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is every security incident (including minor events like phishing clicks) logged with date, description, impact assessment, response actions, and resolution — and are applicable incidents reported to required external authorities within required timeframes?',
    remediationSteps: [
      'Create an Incident Log template with fields: Incident ID, Date Detected, Date Reported, Incident Type, Systems Affected, Description of Event, Severity (Low/Medium/High/Critical), Containment Actions, Recovery Actions, Root Cause, Lessons Learned, and Reporter Name.',
      'Store the incident log in SharePoint or a secure shared drive with access limited to the IR Lead and senior management.',
      'Define reporting timelines in your IRP: internal notification within 1 hour of detection, external reporting to DOD contracting officer within 72 hours for any suspected CUI compromise (per DFARS 252.204-7012).',
      'Identify and record your specific reporting contacts: your Contracting Officer Representative (COR) name and email, DCSA CyberCrime notification address (dibnet.dod.mil), and your cyber insurance carrier.',
      'Train your team that "no incident is too small to log" — even suspected phishing or an employee clicking a suspicious link should generate a record.',
    ],
    affordableTools: [
      'Microsoft SharePoint or Lists — free incident tracking with M365 subscription',
      'Google Sheets (free) — simple incident log if not on M365',
      'DIBNET Portal (dibnet.dod.mil) — mandatory DOD incident reporting portal (free)',
      'Microsoft Defender for Business — auto-generates incident tickets when threats detected',
    ],
    evidenceRequired: [
      'Incident Log showing at least one real or simulated incident entry with all required fields',
      'External reporting contact list with current names, emails, and phone numbers',
      'Documented reporting timelines in the Incident Response Plan',
      'Evidence of at least one external report submitted (or attestation of no reportable incidents in the period)',
      'DFARS 252.204-7012 clause identified in at least one active contract',
    ],
    policyMapping: [
      'Incident Response Plan',
      'Data Breach Notification Policy',
      'Records Retention Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },
  {
    id: 'IR.2.097',
    family: 'IR',
    familyName: 'Incident Response',
    title: 'Test organizational incident response capability',
    officialDescription:
      'Test the organizational incident response capability.',
    plainEnglish:
      'Having a plan written down is not enough — you need to actually practice it. A "tabletop exercise" is exactly what it sounds like: your team sits around a table (or on a video call) and someone walks through a hypothetical scenario ("Our email system says 3,000 emails were sent from the CEO account at 3am — what do we do?"). You do not actually have to hack anything or shut systems down — just talk through the steps. For an 8-person company, a 90-minute annual tabletop exercise that you document is fully sufficient to satisfy this control.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Has the organization conducted at least one documented test of the incident response plan (tabletop exercise, simulation, or live drill) within the past 12 months — with lessons learned captured and plan updates made as needed?',
    remediationSteps: [
      'Schedule a 90-minute annual tabletop exercise with all employees — put it on the calendar now for the same time every year (e.g., first Tuesday of March).',
      'Choose a realistic scenario relevant to defense contractors: ransomware attack, spear-phishing leading to CUI exfiltration, or a lost/stolen laptop containing CUI.',
      'Use the CISA Tabletop Exercise Package (free download from cisa.gov) as a structured agenda — they have pre-built scenarios for SMBs.',
      'During the exercise, have a designated note-taker record what steps were taken, what gaps were discovered, and what questions could not be answered.',
      'After the exercise, update your Incident Response Plan with any gaps found and document the exercise with: date, attendees, scenario used, key findings, and action items with owners and due dates.',
    ],
    affordableTools: [
      'CISA Tabletop Exercise Packages — free at cisa.gov/tabletop-exercise-packages',
      'Microsoft Teams or Zoom — remote tabletop if team is distributed',
      'Google Docs or SharePoint — document exercise findings and action items',
      'NIST 800-84 — free guide to test, training, and exercise programs for IT',
    ],
    evidenceRequired: [
      'Exercise After-Action Report (AAR) with date, attendees, scenario description, findings, and action items',
      'Calendar invitation or meeting record showing annual exercise is scheduled',
      'Updated Incident Response Plan with post-exercise revisions noted',
      'Sign-in sheet or attendance record for the exercise session',
    ],
    policyMapping: [
      'Incident Response Plan',
      'Security Awareness Training Policy',
      'Business Continuity Plan',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },
];

// ============================================================
// MAINTENANCE (MA) — 6 Controls
// NIST SP 800-171 Rev 2, Section 3.7
// Max SPRS Deduction: -18
// ============================================================

export const MA_CONTROLS: NISTControl[] = [
  {
    id: 'MA.2.111',
    family: 'MA',
    familyName: 'Maintenance',
    title: 'Perform maintenance on organizational systems',
    officialDescription:
      'Perform maintenance on organizational systems.',
    plainEnglish:
      'You need a documented, regular schedule for maintaining your computers, servers, and network equipment — not just fixing things when they break, but proactive maintenance. This includes applying security patches and Windows updates, replacing end-of-life hardware, and checking that backups are running correctly. For your 8-person team, this means setting Windows Update to auto-install patches, scheduling a monthly check on all systems, and keeping a maintenance log. Think of it like an oil change schedule for your cars — you do not wait until the engine seizes.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is system maintenance performed on a documented, recurring schedule — with maintenance activities logged including date, technician, system affected, and work performed?',
    remediationSteps: [
      'Create a Maintenance Schedule document listing all systems (workstations, servers, network devices, printers) with their maintenance frequency: Windows Update monthly, antivirus definition verification weekly, hardware inspection annually.',
      'Enable Windows Update Automatic Updates on all workstations and set to "Install automatically" — configure via Group Policy to force updates outside business hours.',
      'Set up a Maintenance Log (spreadsheet or SharePoint list) with columns: Date, System Name, Maintenance Type, Performed By, Work Description, Issues Found, Resolution.',
      'Schedule a recurring monthly calendar event (30 minutes) labeled "Monthly System Maintenance Review" — check update status, review logs, confirm backups ran successfully.',
      'For any vendor or contractor who performs maintenance on your systems, require them to log their activities in your Maintenance Log immediately after completing work.',
    ],
    affordableTools: [
      'Windows Update / Microsoft Update (built-in, free)',
      'Microsoft Endpoint Configuration Manager or Microsoft Intune (included in M365 Business Premium)',
      'Patch My PC (free for personal/basic use) — third-party app patching',
      'Microsoft 365 SharePoint Lists — free maintenance log',
    ],
    evidenceRequired: [
      'Written Maintenance Schedule document listing all systems and maintenance frequencies',
      'Maintenance Log showing entries for the past 12 months',
      'Windows Update configuration screenshot showing automatic updates enabled',
      'Evidence of recent patch compliance report (Intune compliance report or Windows Update history)',
    ],
    policyMapping: [
      'System Maintenance Policy',
      'Configuration Management Policy',
      'Change Management Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MA.2.112',
    family: 'MA',
    familyName: 'Maintenance',
    title: 'Provide controls on tools and personnel for maintenance',
    officialDescription:
      'Provide controls on the tools, techniques, mechanisms, and personnel that perform maintenance on organizational systems.',
    plainEnglish:
      'When someone comes to fix or maintain your computers — whether that is your MSP (managed service provider), a vendor technician, or an employee — you need controls over what they do and what tools they use. You must approve who can do maintenance, what tools they are allowed to use (no unauthorized software), and what they are allowed to access. This means: your MSP should have a signed agreement listing what systems they can access, you should be present or have a log of remote sessions, and unauthorized tools (like a personal USB drive with unknown software) should not be used on your systems.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are maintenance personnel vetted and authorized before performing maintenance — and are maintenance tools and activities controlled, logged, and reviewed to prevent unauthorized access or installation of software?',
    remediationSteps: [
      'Establish a list of authorized maintenance personnel and contractors — include name, company, contact info, and systems they are authorized to access.',
      'Require all third-party maintenance providers to sign a Maintenance Access Agreement specifying: no unauthorized software installation, all actions must be logged, no data copying without written approval, and immediate notification of any issues discovered.',
      'When your MSP performs remote maintenance, require them to use a remote access tool that logs session recordings (many RMM tools like ConnectWise or Datto do this automatically).',
      'Restrict maintenance tool usage: only allow your approved IT tools (from a defined software whitelist) on company systems; prevent installation of unknown utilities.',
      'After any maintenance session, review the activity log and have the technician sign off on a Maintenance Record form confirming what was done.',
    ],
    affordableTools: [
      'ConnectWise Control (formerly ScreenConnect) — remote maintenance with session logging (~$24/month)',
      'Splashtop Business ($5/month) — session-logged remote access for MSP',
      'Microsoft Intune — software whitelist and device compliance (M365 Business Premium)',
      'Standard vendor contract template with maintenance access clauses',
    ],
    evidenceRequired: [
      'Authorized Maintenance Personnel List with signatures',
      'Signed Maintenance Access Agreements from all third-party providers',
      'Sample remote access session log showing technician activity was recorded',
      'Maintenance Records for the past 12 months with technician sign-offs',
      'Software whitelist policy for approved maintenance tools',
    ],
    policyMapping: [
      'System Maintenance Policy',
      'Third-Party Access Policy',
      'Change Management Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },
  {
    id: 'MA.2.113',
    family: 'MA',
    familyName: 'Maintenance',
    title: 'Ensure equipment removed for offsite maintenance is sanitized',
    officialDescription:
      'Ensure equipment removed for offsite maintenance is sanitized to remove the following information from equipment prior to removal: CUI and FCI.',
    plainEnglish:
      'If a laptop or server needs to leave your office for repair — whether sent to a manufacturer, a repair shop, or your MSP — you must first remove all CUI (Controlled Unclassified Information) from it before it leaves. This means wiping the hard drive or using BitLocker to encrypt the data so the repair technician cannot read your government contract files even if they tried. If you cannot sanitize a device before it leaves (e.g., the hard drive is broken and that is why it is being repaired), you must document this as a risk and take compensating measures like requiring an escort or NDA.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented procedure requiring CUI and FCI to be removed or cryptographically protected before any system equipment leaves the organization\'s premises for offsite maintenance — and is compliance tracked per equipment removal?',
    remediationSteps: [
      'Create an Equipment Removal Procedure that requires: (1) review whether the device contains CUI, (2) if yes, either delete CUI files and verify deletion, or use BitLocker to encrypt the drive before the device leaves, (3) document the removal in an Equipment Removal Log.',
      'Enable BitLocker full-disk encryption on all Windows workstations and laptops (built-in, free on Windows Pro/Enterprise) — this means even if a laptop goes offsite, the data is cryptographically protected.',
      'For devices where data cannot be removed (broken hard drive going to repair), require a signed NDA and data handling agreement from the repair vendor before releasing the device.',
      'Maintain an Equipment Removal Log: Device Name/Serial, Date Removed, Destination, Purpose, CUI Present (Y/N), Sanitization Method, Return Date.',
      'Train your team: never send a work laptop to a repair shop without first checking with the owner/manager and completing the Equipment Removal Procedure.',
    ],
    affordableTools: [
      'BitLocker Drive Encryption (built-in, free on Windows 10/11 Pro)',
      'Eraser (free, open-source) — secure file deletion tool for Windows',
      'DBAN (Darik\'s Boot and Nuke) — free drive wiping tool for full disk erasure',
      'Microsoft Intune — remote wipe capability if device needs to be wiped before shipping',
    ],
    evidenceRequired: [
      'Equipment Removal Procedure document',
      'Equipment Removal Log showing all offsite maintenance events for the past 12 months',
      'BitLocker encryption status report showing all laptops/workstations are encrypted',
      'Signed vendor NDA/data handling agreement for any third-party repair vendors used',
    ],
    policyMapping: [
      'System Maintenance Policy',
      'Media Protection Policy',
      'Physical Security Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'HIGH',
  },
  {
    id: 'MA.2.114',
    family: 'MA',
    familyName: 'Maintenance',
    title: 'Check media containing diagnostic programs for malicious code',
    officialDescription:
      'Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.',
    plainEnglish:
      'Before your technician plugs in a USB drive with diagnostic software, or runs a downloaded maintenance tool on your company computer, you must scan it for viruses and malware first. This prevents an attacker from compromising a vendor\'s USB drive and using it to infect your systems during routine maintenance. For your team: require that any USB drive or external media used by a maintenance technician be scanned with Windows Defender before connecting it to any company computer that stores CUI.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is all external media (USB drives, CDs, diagnostic tools) scanned for malicious code using updated antivirus software before being connected to or used on organizational systems?',
    remediationSteps: [
      'Create a standing rule in your Maintenance Policy: all external media used for diagnostics or maintenance must be scanned with updated antivirus before use on any company system.',
      'Configure Windows Defender to auto-scan USB drives when inserted: Group Policy > Computer Configuration > Windows Defender Antivirus > Scan > check "Scan removable drives" and enable the removable drive scan on full scans.',
      'Consider enabling Windows Defender\'s "USB scan on connect" feature (via PowerShell or Intune) so any inserted USB drive is automatically scanned in the background.',
      'For downloaded diagnostic tools, require technicians to download to a sandboxed environment or scan the installer with VirusTotal (free web tool) before running on company systems.',
      'Log each scan result in the Maintenance Record: tool name, scan date, scan result (clean/quarantined), and who performed the scan.',
    ],
    affordableTools: [
      'Windows Defender Antivirus (built-in, free) — auto-scans removable media',
      'VirusTotal.com (free) — scan downloaded files with 70+ antivirus engines before running',
      'Malwarebytes Free — secondary on-demand scanner for suspicious media',
      'Microsoft Intune — enforce USB scan policy via Endpoint Protection profile',
    ],
    evidenceRequired: [
      'Windows Defender configuration screenshot showing removable drive scan enabled',
      'Maintenance Policy document with external media scan requirement',
      'Sample Maintenance Log entries showing scan results for media used in recent maintenance',
      'VirusTotal scan screenshots for any downloaded diagnostic tools used in the past year',
    ],
    policyMapping: [
      'System Maintenance Policy',
      'Malware Protection Policy',
      'Media Protection Policy',
    ],
    estimatedHours: 2,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MA.2.115',
    family: 'MA',
    familyName: 'Maintenance',
    title: 'Require multifactor authentication for nonlocal maintenance',
    officialDescription:
      'Require MFA to establish nonlocal maintenance sessions via external networks and terminate such connections when nonlocal maintenance is complete.',
    plainEnglish:
      'When your MSP or IT support person connects to your systems remotely over the internet — not from inside your office — they must use MFA to authenticate, just like your employees do. No remote access over the internet should be possible with just a password. Additionally, when the remote maintenance session is done, the connection must be cleanly terminated — not left open or set to auto-reconnect indefinitely. This control is specifically about remote (nonlocal) access for maintenance purposes, separate from regular employee remote work.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do all remote maintenance connections (MSP, vendor, IT support) require MFA — and are these sessions explicitly terminated upon completion of maintenance rather than left open indefinitely?',
    remediationSteps: [
      'Require your MSP to use MFA on their admin accounts before initiating any remote session to your systems — get this confirmed in writing as part of your MSP contract.',
      'Use a remote access tool that supports MFA natively: ConnectWise Control, Splashtop Business, and TeamViewer Business all support MFA for technician accounts.',
      'Configure your VPN (if used for remote maintenance) to require MFA — compatible with Azure AD MFA using RADIUS integration for most commercial VPN products.',
      'Establish a policy that remote maintenance sessions must be terminated within 15 minutes of completing the maintenance task — no persistent backdoors or always-on remote sessions.',
      'Review your remote access logs monthly to confirm all sessions were properly terminated and no unauthorized remote connections occurred.',
    ],
    affordableTools: [
      'ConnectWise Control — session-logged remote access with MFA support (~$24/month)',
      'Splashtop Business — MFA-enabled remote support ($5-$8/month)',
      'Azure AD MFA — enforce MFA on all administrative accounts used for remote access',
      'Microsoft Always On VPN or Azure Point-to-Site VPN — MFA-integrated remote access',
    ],
    evidenceRequired: [
      'MSP contract or addendum confirming MFA requirement for remote access',
      'Remote access tool configuration showing MFA enforcement on technician accounts',
      'Remote access session logs showing session start, activity, and clean termination',
      'System Maintenance Policy section specifying MFA and session termination requirements',
    ],
    policyMapping: [
      'System Maintenance Policy',
      'Remote Access Policy',
      'Third-Party Access Policy',
    ],
    estimatedHours: 5,
    riskPriority: 'HIGH',
  },
  {
    id: 'MA.2.116',
    family: 'MA',
    familyName: 'Maintenance',
    title: 'Supervise maintenance activities without required access authorization',
    officialDescription:
      'Supervise the maintenance activities of maintenance personnel without required access authorization.',
    plainEnglish:
      'If a maintenance technician does not have a security clearance or formal authorization to access your CUI systems, you must have an authorized employee physically present with them while they work — or at minimum watching their remote session in real time. A repairman who comes to fix a broken hard drive in your server has no clearance and no authorization to see your government files; an authorized employee must watch them the entire time. This is about accountability: you are responsible for what happens on your systems, so when an uncleared person is working on them, one of your cleared people stays with them.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented procedure requiring that an authorized employee supervises any maintenance technician who does not have the required access authorization — and is this supervision actually occurring and being logged?',
    remediationSteps: [
      'Define "authorized maintenance personnel" in your Maintenance Policy: people who have been background-checked, trained, and formally granted access to systems containing CUI.',
      'For all other maintenance personnel (repair technicians, hardware vendors, building contractors who must access server rooms), create a "Supervised Maintenance" procedure: an authorized employee must escort and observe the technician for the entire duration.',
      'For remote supervision, use your remote access tool\'s session recording feature — the authorized employee watches the live session and the recording is retained for audit.',
      'Create a Supervision Log entry for every supervised maintenance event: Date, Technician Name/Company, Work Performed, Authorized Supervisor Name, Duration, and any concerns noted.',
      'Train all employees on the rule: if an uncleared vendor or contractor needs access to company IT systems, they must call an authorized employee to supervise — no exceptions.',
    ],
    affordableTools: [
      'ConnectWise Control or Splashtop — session recording for remote supervision ($5-$24/month)',
      'Microsoft Teams or Zoom — screen-share supervision for remote sessions at no extra cost',
      'Physical visitor log (paper) — simple and effective for in-person maintenance visits',
      'SharePoint list — Supervision Log with structured fields',
    ],
    evidenceRequired: [
      'Maintenance Policy defining authorized vs. unauthorized maintenance personnel',
      'Supervised Maintenance Procedure document',
      'Supervision Log with entries for the past 12 months',
      'Session recording files or screenshots for remote supervised maintenance sessions',
      'Physical visitor log showing escorted access for any on-premises maintenance visits',
    ],
    policyMapping: [
      'System Maintenance Policy',
      'Physical Security Policy',
      'Third-Party Access Policy',
    ],
    estimatedHours: 3,
    riskPriority: 'MEDIUM',
  },
];

// ============================================================
// MEDIA PROTECTION (MP) — 9 Controls
// NIST SP 800-171 Rev 2, Section 3.8
// Max SPRS Deduction: -15
// ============================================================

export const MP_CONTROLS: NISTControl[] = [
  {
    id: 'MP.1.118',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Protect system media containing CUI',
    officialDescription:
      'Protect (i.e., physically control and securely store) information system media containing CUI, both paper and digital.',
    plainEnglish:
      'Any physical item that contains your government contract information must be stored securely. This includes laptops, USB drives, printed documents, CDs, backup drives, and even paper notes that have CUI written on them. "Securely stored" means locked cabinets or offices when not in use, encrypted hard drives on laptops, and not leaving sensitive printouts on desks overnight. For your 8-person team: lock paper files in a filing cabinet, encrypt all laptop hard drives with BitLocker, keep backup drives in a locked drawer, and shred sensitive documents rather than tossing them in recycling.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Is all media containing CUI (both digital and paper) physically secured when not in use — with digital media encrypted and paper media stored in locked containers?',
    remediationSteps: [
      'Enable BitLocker full-disk encryption on every company laptop, workstation, and external hard drive that contains or may contain CUI — store the BitLocker recovery keys in Azure AD or a secured password manager vault.',
      'Purchase a locking filing cabinet for all paper documents containing CUI — keep it locked when not actively in use, with the key held only by authorized personnel.',
      'Purchase a cross-cut shredder (Level P-4 or higher, approximately $60-$120) for destroying paper CUI — place it near the printer so there is no excuse to use the recycling bin.',
      'Create a "Clean Desk Policy": no CUI documents left on desks overnight, laptops locked or stored securely after business hours.',
      'Conduct a quarterly Media Inventory to account for all CUI-bearing media: list each device, its location, its encryption status, and its custodian.',
    ],
    affordableTools: [
      'BitLocker Drive Encryption (built-in, free on Windows 10/11 Pro)',
      'Azure AD BitLocker Key Management — free with Microsoft 365',
      'Fellowes Level P-4 Cross-Cut Shredder (~$80, one-time cost)',
      'Locking filing cabinet (~$150-$300, one-time cost)',
      'Microsoft Information Protection labels (included in M365 Business Premium)',
    ],
    evidenceRequired: [
      'BitLocker encryption status report for all company devices',
      'Azure AD BitLocker recovery key escrow screenshot',
      'Photograph of locked filing cabinet used for paper CUI storage',
      'Written Clean Desk Policy distributed to all employees',
      'Media Inventory showing all CUI-bearing media, locations, and encryption status',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Physical Security Policy',
      'Information Classification Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },
  {
    id: 'MP.1.119',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Limit access to CUI on system media',
    officialDescription:
      'Limit access to CUI on system media to authorized users.',
    plainEnglish:
      'Not everyone in your company needs access to every piece of CUI. The person doing accounting should not necessarily have access to the technical drawings for a defense system, and vice versa. You need to control who can access which CUI files — both digital files on the network and physical media like USBs and printed documents. On Microsoft 365 or SharePoint, this means setting folder permissions so that only the people who need a specific file can open it. For physical media, it means that locked filing cabinet key is only given to the employees who need those files.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Is access to CUI on all media (digital and physical) restricted to only those employees with a documented need-to-know — with access controls technically enforced and regularly reviewed?',
    remediationSteps: [
      'Create a CUI Data Map: list all locations where CUI is stored (SharePoint folders, network drives, local folders, physical binders) and for each, document who currently has access.',
      'Apply the principle of least privilege: review the access list for each CUI storage location and remove access for any employee who does not have a documented business need for that specific CUI.',
      'In Microsoft SharePoint or OneDrive, set folder-level permissions for CUI content — use Azure AD security groups (e.g., "CUI-Access-Group") rather than individual user assignments for easier management.',
      'For physical media, document who holds keys to CUI storage areas and create a formal key checkout log.',
      'Schedule a semi-annual access review to re-evaluate who has access and remove anyone whose role no longer requires it.',
    ],
    affordableTools: [
      'Microsoft SharePoint permissions management (included in Microsoft 365)',
      'Azure AD Security Groups (free) — manage CUI access by group membership',
      'Microsoft Purview Information Protection (included in M365 Business Premium) — apply sensitivity labels to CUI files',
      'Physical key lockbox (~$20-$40) — controlled physical key management',
    ],
    evidenceRequired: [
      'CUI Data Map listing all storage locations and current authorized users',
      'SharePoint/OneDrive permission reports for CUI folders showing restricted access',
      'Azure AD Security Group membership list for CUI access groups',
      'Physical media access log or key checkout record',
      'Semi-annual access review documentation with any removed accesses noted',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Access Control Policy',
      'Information Classification Policy',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },
  {
    id: 'MP.1.120',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Sanitize or destroy system media before disposal or reuse',
    officialDescription:
      'Sanitize or destroy information system media before disposal or reuse.',
    plainEnglish:
      'Before you throw away, sell, donate, or repurpose a computer, hard drive, USB drive, or printed document that contained CUI, you must make sure the data is unrecoverable. Simply deleting files or formatting a hard drive is NOT enough — the data can be recovered with free tools. You must use a secure wipe tool (like DBAN for hard drives), physically destroy the drive (drilling or degaussing), or use a certified destruction vendor. For paper, use a cross-cut shredder. For your small company, the easiest approach is: wipe drives with DBAN before any device leaves your control, or physically destroy the drive.',
    sprsDeduction: -3,
    cmmcLevel: 1,
    assessmentQuestion:
      'Is all media sanitized using NIST 800-88-compliant methods (secure wipe, physical destruction, or certified third-party destruction) before disposal, recycling, or repurposing — and is each disposal event documented?',
    remediationSteps: [
      'Create a Media Disposal Procedure: before any device is discarded, sold, donated, or returned to a vendor, run the Media Disposal Checklist — determine if it ever stored CUI, and if so, perform appropriate sanitization.',
      'For hard drives and SSDs containing CUI: use DBAN (for HDDs, free) or manufacturer secure erase utilities (for SSDs) to perform a full overwrite or cryptographic erase before disposal.',
      'For BitLocker-encrypted drives: decrypting and wiping, OR destroying the BitLocker key (which makes data unrecoverable) qualifies as cryptographic sanitization per NIST 800-88.',
      'For paper CUI: shred with a P-4 cross-cut shredder or use a certified document destruction service (Iron Mountain, Shred-it) with a Certificate of Destruction.',
      'Maintain a Media Disposal Log: Device/Media Description, Serial Number if applicable, Date, CUI Present (Y/N), Sanitization Method, Performed By, and Certificate of Destruction number if applicable.',
    ],
    affordableTools: [
      'DBAN (Darik\'s Boot and Nuke) — free, bootable hard drive wiper (HDDs only)',
      'Eraser for Windows (free) — secure file/folder deletion on Windows',
      'Samsung Magician or Crucial Storage Executive — free SSD secure erase utilities',
      'Shred-it or Iron Mountain — certified document and media destruction (~$30-$100/visit)',
      'Microsoft BitLocker cryptographic erase (built-in) — destroy the key to render data unrecoverable',
    ],
    evidenceRequired: [
      'Media Disposal Procedure document',
      'Media Disposal Log for the past 12 months',
      'Certificates of Destruction from any third-party media destruction vendor',
      'Screenshots of DBAN or secure erase completion screens (or photos of physically destroyed media)',
      'Cross-cut shredder in inventory (receipt or photo)',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Asset Disposal Policy',
      'Information Classification Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'HIGH',
  },
  {
    id: 'MP.2.121',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Mark media with necessary CUI markings and distribution limitations',
    officialDescription:
      'Mark media with necessary CUI markings and distribution limitations.',
    plainEnglish:
      'Any physical or digital media that contains CUI must be labeled so anyone who handles it knows it contains sensitive government information and knows who is authorized to receive it. For printed documents, this means a "CUI" header/footer on every page. For a USB drive or external hard drive containing CUI, it needs a physical label saying "CUI" and possibly the specific category and distribution limitation (like "CUI//SP-CTI" for specific Controlled Technical Information). The government provides free templates and labeling guidance — this is mostly about creating a labeling habit and applying sensitivity labels in Microsoft 365.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are all documents, files, and physical media containing CUI marked with the appropriate CUI designation and distribution/dissemination limitations — and is this marking applied consistently by all employees?',
    remediationSteps: [
      'Download the official CUI marking templates from the National Archives CUI Registry (archives.gov/cui) — use these as your standard document headers and footers.',
      'Configure Microsoft Word and Outlook templates with a pre-built CUI header/footer so employees do not have to remember to add it manually.',
      'Enable Microsoft Purview sensitivity labels in Microsoft 365 (available in Business Premium) and create a "CUI" label that automatically adds a header/footer to documents and emails and restricts forwarding.',
      'Purchase pre-printed CUI label stickers or a label printer for physical media (USB drives, external hard drives, printed binders) — label every piece of physical media that contains CUI.',
      'Include CUI marking requirements in your annual security awareness training and add it as a checklist item in the new employee onboarding process.',
    ],
    affordableTools: [
      'Microsoft Purview Sensitivity Labels (included in M365 Business Premium) — automatic document labeling',
      'Microsoft Word/Outlook templates (free) — pre-formatted CUI headers and footers',
      'DYMO LabelWriter or Brother P-Touch label printer (~$40-$80) — for physical media labels',
      'National Archives CUI Registry (archives.gov/cui) — free official marking guidance',
    ],
    evidenceRequired: [
      'Sample CUI-marked documents showing correct header/footer format',
      'Microsoft Purview sensitivity label configuration screenshot',
      'Photograph of CUI-labeled physical media (USB drives, binders)',
      'Employee acknowledgment that CUI marking requirements were covered in training',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Information Classification Policy',
      'CUI Handling Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MP.2.122',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Control access to media containing CUI during transport',
    officialDescription:
      'Control access to media containing CUI during transport outside of controlled areas and maintain accountability for media during transport.',
    plainEnglish:
      'When CUI leaves your office — whether you are carrying a laptop to a meeting, mailing a USB drive to a subcontractor, or shipping a hard drive to a customer — you must have controls to prevent unauthorized access during transit. Encryption is the most important control here (BitLocker means even if the laptop is stolen from your car, the data cannot be accessed). But you also need to track what media went where: a transport log, using trackable shipping methods, and requiring confirmation of receipt. Never email CUI unencrypted — use encrypted email or Microsoft 365\'s protected email feature.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is all CUI-bearing media encrypted before transport outside controlled areas — and is each transport event logged with the media description, destination, method, and confirmation of receipt?',
    remediationSteps: [
      'Encrypt all laptops and portable drives with BitLocker before they are ever carried outside the office — this is your primary transport protection and means stolen-in-transit is not a reportable breach.',
      'Create a Media Transport Log: Date, Media Description/Serial, Transport Method (hand-carry, FedEx, email), Sender, Recipient, Destination, Tracking Number if applicable, and Confirmation of Receipt date.',
      'For physical media shipped by courier, use FedEx or UPS with tracking, signature-required delivery, and tamper-evident packaging — never use standard mail for CUI-bearing physical media.',
      'For electronic transmission of CUI, use only encrypted channels: Microsoft 365 encrypted email, SharePoint with TLS, or a FIPS-validated file transfer tool — never plain email or FTP.',
      'Define a maximum transport duration: if media does not arrive and receipt is not confirmed within 48 hours, treat it as a potential incident and initiate your incident response procedure.',
    ],
    affordableTools: [
      'BitLocker (built-in, free) — encrypt portable media before transport',
      'Microsoft 365 encrypted email (Message Encryption, included in Business Premium)',
      'FedEx Business or UPS with tracking and signature confirmation',
      'Microsoft SharePoint with enforced TLS (included in M365) — secure electronic transfer',
    ],
    evidenceRequired: [
      'Media Transport Log with entries for all CUI transport events',
      'BitLocker encryption status showing all portable devices are encrypted',
      'Shipping receipts or tracking records for physical media transport',
      'Encrypted email logs or SharePoint transfer records for electronic transmission',
      'CUI Transport Procedure document',
    ],
    policyMapping: [
      'Media Protection Policy',
      'CUI Handling Policy',
      'Data Transmission Security Policy',
    ],
    estimatedHours: 3,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MP.2.123',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Implement cryptographic mechanisms to protect CUI during transport',
    officialDescription:
      'Implement cryptographic mechanisms to protect the confidentiality of CUI during transmission unless otherwise protected by alternative physical safeguards.',
    plainEnglish:
      'Whenever CUI travels over a network or the internet — email, file transfer, web upload — it must be encrypted in transit so it cannot be intercepted and read. "Encryption in transit" means the connection is protected with TLS (you see "https://" in the browser or the email is sent over an encrypted connection). For your team, this means: only send CUI by email using Microsoft 365 encrypted email, only upload CUI to systems accessed over HTTPS, and never transmit CUI over unencrypted connections like plain HTTP, plain FTP, or unprotected public Wi-Fi without a VPN.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is all CUI transmitted over networks protected by FIPS-validated cryptographic mechanisms (TLS 1.2+, AES-256) — and are employees prevented from transmitting CUI over unencrypted channels?',
    remediationSteps: [
      'Verify all services used for CUI file sharing use HTTPS with TLS 1.2 or higher: check SharePoint, email, and any cloud storage — use SSL Labs (free) to confirm the TLS version.',
      'Configure Microsoft 365 to automatically encrypt outbound emails containing CUI using Microsoft Purview Message Encryption — set up transport rules that trigger encryption when the subject includes "CUI" or the sensitivity label is applied.',
      'Block unencrypted transmission channels: configure your email server to reject connections that do not use TLS (Microsoft 365 enforces TLS by default — verify this has not been disabled).',
      'Deploy a VPN for employees working from locations with untrusted Wi-Fi (coffee shops, hotels) — any CUI work on public Wi-Fi must go through the VPN tunnel.',
      'Update your CUI Handling Policy and employee training to explicitly prohibit sending CUI via personal email, unencrypted FTP, or direct messaging apps that do not support end-to-end encryption.',
    ],
    affordableTools: [
      'Microsoft Purview Message Encryption (included in M365 Business Premium)',
      'Microsoft SharePoint over HTTPS (TLS 1.3, included in M365)',
      'SSL Labs Server Test (free) — verify TLS configuration',
      'ProtonVPN Free or NordVPN Teams ($5/user/month) — employee VPN for travel',
      'Microsoft Always On VPN — enterprise VPN built into Windows Server',
    ],
    evidenceRequired: [
      'SSL Labs test results for all web-accessible services showing TLS 1.2+',
      'Microsoft 365 transport rule configuration showing encrypted email enforcement',
      'Purview Message Encryption configuration screenshot',
      'VPN policy and employee acknowledgment for CUI work on public networks',
      'CUI Handling Policy section specifying encrypted transmission requirements',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Cryptography Policy',
      'Data Transmission Security Policy',
    ],
    estimatedHours: 5,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MP.2.124',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Control use of removable media on system components',
    officialDescription:
      'Control the use of removable media on system components.',
    plainEnglish:
      'USB drives, external hard drives, SD cards, and any other plug-in storage devices are a major data security risk — employees can accidentally (or intentionally) copy CUI onto an unencrypted thumb drive and lose it. You need a policy and technical controls that define who can use removable media, on which computers, and under what conditions. The simplest approach for a small company: block all USB storage by default using Group Policy, and only allow it on specific approved machines for employees who have a documented business need. Require that any approved USB drives are encrypted.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is the use of removable media technically restricted on company systems — with approved use limited to authorized personnel, authorized media, and documented business purposes?',
    remediationSteps: [
      'Block all USB storage devices by default using Group Policy: Computer Configuration > Administrative Templates > System > Removable Storage Access > set "All Removable Storage Classes: Deny all access" to Enabled.',
      'Create an exception process: employees who have a legitimate business need for USB storage must submit a request, receive management approval, and be issued a company-owned encrypted USB drive (IronKey or BitLocker To Go).',
      'For approved USB use, require BitLocker To Go (built-in, free) on all company USB drives — this forces anyone who finds a lost drive to know the password before accessing files.',
      'Document each approved exception: employee name, device description, serial number, purpose, and expiration date for the exception.',
      'Monitor USB device connections via Windows Event Logs or Microsoft Defender for Endpoint (included in M365 Business Premium) — alert on any unapproved USB connection attempts.',
    ],
    affordableTools: [
      'Windows Group Policy (built-in, free) — block all USB storage by default',
      'BitLocker To Go (built-in, free) — encrypt approved USB drives',
      'IronKey Encrypted USB Drives (~$50-$100 each) — hardware-encrypted USB for approved use',
      'Microsoft Defender for Endpoint (included in M365 Business Premium) — USB connection monitoring',
      'Microsoft Intune — enforce device restriction policies across all enrolled workstations',
    ],
    evidenceRequired: [
      'Group Policy configuration showing removable storage access blocked by default',
      'Removable Media Exception Register with approved USB users, devices, and purposes',
      'BitLocker To Go configuration screenshots for company-issued USB drives',
      'USB device connection audit log showing monitoring is active',
      'Removable Media Policy document',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Acceptable Use Policy',
      'Data Loss Prevention Policy',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MP.2.125',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Prohibit use of portable storage without identifiable owner',
    officialDescription:
      'Prohibit the use of portable storage devices when such devices have no identifiable owner.',
    plainEnglish:
      'If someone finds a USB drive in a parking lot or receives one in the mail unexpectedly, they must NEVER plug it into a company computer. "Unowned" USB drives are a classic attack vector — attackers leave infected drives in parking lots, and curious employees pick them up and plug them in. This control requires both a technical block (your USB policy from the previous control handles this) and a cultural rule: any USB drive must be traceable to a specific approved owner before it can be used. If origin is unknown, destroy or quarantine it.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented policy and technical control prohibiting the use of any removable storage device that lacks an identifiable, authorized owner — and have employees been trained on the risks of unknown media?',
    remediationSteps: [
      'Add an explicit prohibition to your Acceptable Use Policy and Removable Media Policy: "No portable storage device may be connected to company systems unless it is assigned to an identified owner in the Removable Media Register and has been pre-approved."',
      'Cover the "USB drop attack" scenario in annual security awareness training — show employees real examples of attacks that began with someone plugging in a found USB drive.',
      'Establish a procedure for handling suspicious/unknown media: employees who find or receive an unknown USB drive must deliver it to the owner/manager for review — it is never plugged into company systems under any circumstance.',
      'The Group Policy block from control MP.2.124 provides the technical enforcement — unknown/unregistered USBs will simply not function on company systems.',
      'Post a visible reminder near workstations and printers: "Found a USB drive? Do NOT plug it in. Give it to [Manager Name] immediately."',
    ],
    affordableTools: [
      'Windows Group Policy USB block (built-in, free) — unknown drives simply will not work',
      'SANS Security Awareness training materials (free) — USB drop attack awareness',
      'Physical reminder poster (print in-house) — near workstations',
      'Microsoft Defender for Endpoint alert — flags any USB connect attempt for review',
    ],
    evidenceRequired: [
      'Acceptable Use Policy and Removable Media Policy with explicit unknown-media prohibition',
      'Security awareness training materials covering USB drop attacks',
      'Training attendance record showing all employees completed USB security awareness',
      'Removable Media Register showing all authorized USB devices have identified owners',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Acceptable Use Policy',
      'Security Awareness Training Policy',
    ],
    estimatedHours: 2,
    riskPriority: 'MEDIUM',
  },
  {
    id: 'MP.2.126',
    family: 'MP',
    familyName: 'Media Protection',
    title: 'Protect backups of CUI at storage locations',
    officialDescription:
      'Protect the confidentiality of backup CUI at storage locations.',
    plainEnglish:
      'Your backups contain copies of all your most sensitive data — including all of your CUI. If you protect the original but not the backup, the backup is the weak link. Backups must be encrypted (both on-site and off-site), access-controlled (only authorized people can restore from them), and physically secured (if kept on a physical drive, locked up). For your small company: encrypt your Microsoft 365 backups (Microsoft handles this automatically), encrypt any local backup drives with BitLocker, and store offsite backup drives in a locked, secure location — not in the same building as the originals.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are all backups containing CUI protected with encryption both in transit and at rest — with physical backup media stored securely and access to backup systems restricted to authorized personnel only?',
    remediationSteps: [
      'Identify all backup locations: Microsoft 365 cloud backup, local NAS/external hard drives, any third-party backup service (Veeam, Backblaze) — document each in your Media Inventory.',
      'For any local or external backup drives: encrypt with BitLocker and store in a locked cabinet or safe when not in active use — never leave them plugged in permanently without access controls.',
      'For off-site backups: use a cloud backup service that encrypts data at rest and in transit (Backblaze B2 with client-side encryption, Azure Backup, or Microsoft 365 Backup) — confirm the encryption standard in the vendor\'s documentation.',
      'Restrict backup system access: only the owner/administrator should have credentials to the backup system — create a dedicated backup service account and do not share credentials.',
      'Test backup restoration quarterly: attempt to restore a small set of files and verify they restore correctly and the restored data matches the original — log the test results.',
    ],
    affordableTools: [
      'Microsoft 365 Backup (included or ~$0.15/GB/month) — encrypted cloud backup of M365 data',
      'Azure Backup ($2-$5/month for small volumes) — encrypted backup with geo-redundancy',
      'Backblaze B2 with Duplicati or Restic (client-side encryption, ~$6/TB/month)',
      'BitLocker To Go (built-in, free) — encrypt external backup drives',
      'Veeam Agent for Windows Free — local system backup with encryption',
    ],
    evidenceRequired: [
      'Media Inventory listing all backup locations and their encryption status',
      'BitLocker encryption status for all local and portable backup media',
      'Cloud backup vendor documentation confirming encryption at rest and in transit',
      'Backup system access control list showing restricted administrative access',
      'Quarterly backup restoration test log with dates and results',
    ],
    policyMapping: [
      'Media Protection Policy',
      'Backup and Recovery Policy',
      'Cryptography Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },
];
