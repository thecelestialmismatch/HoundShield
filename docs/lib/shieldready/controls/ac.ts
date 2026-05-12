import { NISTControl } from '../types';

export const AC_CONTROLS: NISTControl[] = [
  // ─── LEVEL 1 ───────────────────────────────────────────────────────────────

  {
    id: 'AC.1.001',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Limit System Access to Authorized Users',
    officialDescription:
      'Limit information system access to authorized users, processes acting on behalf of authorized users, and devices (including other information systems).',
    plainEnglish:
      'Only people who are supposed to have access to your computer systems and files can actually get in. If someone leaves your shop, their login should be turned off immediately. Your computers should require a username and password to log in — no shared accounts, and no leaving machines unlocked for anyone to walk up and use.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Do all users have individual accounts with unique usernames and passwords to access computers and systems that store or process government contract information, and are accounts promptly disabled when employees leave or change roles?',
    remediationSteps: [
      'Enable Windows user accounts on every computer: go to Settings > Accounts > Family & other users, create a named account for each employee, and set a strong password requirement.',
      'Disable or delete accounts within 24 hours of an employee departing: maintain a simple offboarding checklist that includes "disable Windows account" and "remove from Microsoft 365".',
      'If using Microsoft 365 GCC, review active users at admin.microsoft.com monthly and remove any accounts that are no longer needed.',
      'Ensure no shared "shop" or "generic" accounts exist — every user must log in with their own credentials so activity can be traced back to an individual.',
      'Enable screen lock via Group Policy or Windows Settings so computers lock automatically after 15 minutes of inactivity, requiring a password to return.',
    ],
    affordableTools: [
      'Microsoft 365 GCC (from $12/user/month) — centralized user account management',
      'Windows Active Directory (included with Windows Server) — free if you already have Windows Server',
      'Windows 10/11 Pro built-in local account management — free, no additional tools needed',
      'Bitwarden Teams ($3/user/month) — password manager to enforce strong unique passwords',
    ],
    evidenceRequired: [
      'Screenshot or export of all active user accounts on each system',
      'Written user access policy or procedure stating accounts are individual and reviewed',
      'Sample of offboarding checklist showing account-disable step',
      'Evidence of disabled/deleted accounts for departed employees (admin logs or screenshots)',
      'Screen lock policy configuration (Group Policy screenshot or Windows Settings photo)',
    ],
    policyMapping: [
      'Access Control Policy',
      'User Account Management Procedure',
      'Onboarding and Offboarding Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'AC.1.002',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Limit System Access to Authorized Transaction Types',
    officialDescription:
      'Limit information system access to the types of transactions and functions that authorized users are permitted to execute.',
    plainEnglish:
      'Just because someone has a login doesn\'t mean they should be able to do everything on your systems. Your shop floor worker doesn\'t need access to accounting files. Your bookkeeper doesn\'t need to install software. Give people access only to the folders and programs they actually need to do their job — nothing more.',
    sprsDeduction: -5,
    cmmcLevel: 1,
    assessmentQuestion:
      'Are user accounts restricted so each person can only access the files, folders, and applications they need for their specific job role — for example, production workers cannot access contract finance files, and regular employees cannot install software?',
    remediationSteps: [
      'Audit current folder permissions on shared drives or file servers: right-click any shared folder > Properties > Security tab, and verify that only the appropriate people or groups have Read/Write access.',
      'Create Windows user groups by role (e.g., "Shop Floor", "Office Admin", "Management") and assign folder permissions to groups rather than individuals so changes are easier to manage.',
      'In Microsoft 365 SharePoint or OneDrive, set site and folder sharing permissions so CUI contract documents are only accessible to staff who work with those contracts.',
      'Remove standard users from the local "Administrators" group on their computers: go to Settings > Accounts > Your Account and confirm they are set as "Standard User" not "Administrator".',
      'Document each role\'s approved access in a simple spreadsheet: employee name, role, systems they can access, and date last reviewed.',
    ],
    affordableTools: [
      'Windows NTFS Permissions (built-in, free) — folder-level access control on any Windows machine',
      'Microsoft 365 SharePoint permissions (included with M365) — document library access control',
      'Windows Group Policy (free, included with Windows Pro/Server) — restrict software installation for standard users',
      'Netwrix Auditor Free Edition (free) — reports on who has access to what on file servers',
    ],
    evidenceRequired: [
      'Screenshot of folder permission settings on shared drives showing role-based access',
      'List of user roles and their approved access levels (access matrix)',
      'Confirmation that standard users do not have local administrator rights (screenshot)',
      'SharePoint or OneDrive sharing permission screenshots for CUI document libraries',
      'Written Access Control Policy defining permitted transaction types by role',
    ],
    policyMapping: [
      'Access Control Policy',
      'Role-Based Access Control (RBAC) Procedure',
      'Least Privilege Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 10,
    riskPriority: 'CRITICAL',
  },

  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────

  {
    id: 'AC.2.003',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Control CUI Flow per Authorizations',
    officialDescription:
      'Control the flow of CUI in accordance with approved authorizations.',
    plainEnglish:
      'Know exactly where your government contract information (called CUI — Controlled Unclassified Information) lives and travels. Don\'t let it drift to personal email, personal cloud storage, or unauthorized thumb drives. If you receive a drawing marked "CUI" from a prime contractor, it should only live in your approved, secure folder — not in a Gmail inbox or on a personal USB stick.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have controls in place to prevent CUI from flowing to unauthorized locations — such as blocking CUI from being emailed to personal accounts, uploaded to unapproved cloud services like personal Google Drive, or copied to unauthorized USB drives?',
    remediationSteps: [
      'Designate a specific, protected folder or SharePoint site as the only approved location for CUI. Label it clearly (e.g., "CUI - Controlled Documents") and restrict access as described in AC.1.002.',
      'In Microsoft 365 GCC, enable Microsoft Purview Information Protection (formerly AIP) sensitivity labels to tag CUI documents and prevent forwarding or downloading to unmanaged devices.',
      'Configure Exchange Online mail flow rules in Microsoft 365 GCC admin center to block outbound emails with CUI labels going to personal email domains (gmail.com, yahoo.com, etc.).',
      'Use Windows Group Policy to disable AutoRun on USB drives and consider blocking unknown USB storage devices via Device Control settings in Microsoft Defender for Business.',
      'Train employees to recognize CUI markings and document the training so you have a record. A 30-minute lunch-and-learn with a sign-in sheet satisfies this evidence requirement.',
    ],
    affordableTools: [
      'Microsoft 365 GCC (from $12/user/month) — Purview sensitivity labels, mail flow rules, SharePoint permissions',
      'Microsoft Defender for Business (included in M365 Business Premium at ~$22/user/month) — USB device control',
      'Microsoft Purview Information Protection (included in M365 E3/GCC) — document labeling and flow control',
      'Netwrix Data Classification (paid, but free trial) — identifies where CUI exists across your systems',
    ],
    evidenceRequired: [
      'Data flow diagram or written description showing where CUI enters, is stored, processed, and exits your environment',
      'Screenshot of SharePoint/OneDrive CUI folder with restricted permissions',
      'Mail flow rule configurations in Microsoft 365 admin center',
      'Sensitivity label policy configuration screenshots',
      'USB device control policy or written procedure',
      'Employee training records on CUI handling',
    ],
    policyMapping: [
      'CUI Handling Policy',
      'Data Flow Diagram (required in SSP)',
      'Information Flow Control Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 16,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'AC.2.004',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Separate Duties to Reduce Risk',
    officialDescription:
      'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.',
    plainEnglish:
      'Don\'t let one person have complete control over something important from start to finish. For example, the same person who approves purchase orders shouldn\'t also be the one who processes payments. Or the person who manages IT accounts shouldn\'t be the only one who reviews those accounts. Splitting up critical tasks means one bad actor alone can\'t cause a major problem.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are critical functions — such as approving financial transactions, creating user accounts, and reviewing system logs — divided between two or more people so no single individual has end-to-end control without oversight?',
    remediationSteps: [
      'Make a short list of your most sensitive functions: who approves contract-related purchases, who manages IT admin accounts, who reviews audit logs. Ensure at least two people are involved in each critical process.',
      'In Microsoft 365, ensure the Global Admin role is held by at least two people (owner and backup) and that the IT manager\'s account activities are reviewable by the business owner.',
      'Set up a simple two-person rule for financial approvals: the person who requests payment is different from the person who approves it — document this in your purchasing procedure.',
      'Use Microsoft 365 Privileged Identity Management (PIM) if available to require approval before elevated admin roles are activated.',
      'Document your separation-of-duties assignments in a simple one-page matrix: task, primary responsible person, secondary reviewer/approver.',
    ],
    affordableTools: [
      'Microsoft 365 GCC admin roles (free, built-in) — assign limited admin roles rather than Global Admin to everyone',
      'Microsoft Entra ID (formerly Azure AD, free tier) — role-based access and audit logs for account management',
      'QuickBooks (from $30/month) — approval workflows for financial transactions',
      'Written SOD matrix (free — a simple Word or Excel document suffices)',
    ],
    evidenceRequired: [
      'Separation of duties matrix listing critical functions and assigned personnel',
      'Screenshot of Microsoft 365 admin roles showing multiple admins with limited roles',
      'Written purchasing or financial approval procedure showing two-person requirement',
      'Interview notes or attestation from owner confirming SOD is practiced',
    ],
    policyMapping: [
      'Separation of Duties Policy',
      'Access Control Policy',
      'Insider Threat Program Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.005',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Employ Least Privilege',
    officialDescription:
      'Employ the principle of least privilege, including for specific security functions and privileged accounts.',
    plainEnglish:
      'Give everyone the minimum access they need to do their job — nothing extra. If your machinist only needs to read job traveler files, don\'t give them write or delete access. If your office manager doesn\'t need to change system settings, make sure they can\'t. This limits the damage if an account gets hacked or an employee makes a mistake.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does each employee and each system account have only the minimum permissions required to perform their specific duties — meaning no one has unnecessary admin rights, extra folder access, or software installation privileges beyond what their job requires?',
    remediationSteps: [
      'Conduct an access review: list every user account and what they currently have access to, then ask "does this person actually need this access for their job?" Remove anything that isn\'t necessary.',
      'Remove all employees from the local Administrators group on their workstations unless they specifically need admin rights to do their job. Go to Computer Management > Local Users and Groups > Administrators.',
      'For shared network drives, audit folder permissions and apply the "minimum necessary" test: Read-only for those who only need to view files, Read/Write only for those who must edit, and Full Control only for the folder owner or IT admin.',
      'Create a separate named "admin account" for IT tasks that is different from the daily-use account. The IT admin should log in with a regular account for email and browsing, and only switch to the admin account when performing IT functions.',
      'Document your least-privilege decisions in an access matrix and review it at least annually or whenever someone changes roles.',
    ],
    affordableTools: [
      'Windows built-in Local Users and Groups (free) — manage local admin rights on each workstation',
      'Microsoft 365 GCC admin role management (free, built-in) — assign scoped admin roles',
      'Microsoft Entra ID Free tier — access reviews for cloud accounts',
      'Netwrix Auditor Free Edition — reports on excessive permissions across Windows file systems',
    ],
    evidenceRequired: [
      'Access rights matrix showing each user\'s permissions across all systems',
      'Screenshot confirming standard users are not in the local Administrators group',
      'Evidence of access review (signed-off spreadsheet, email confirmation, or audit log)',
      'Separate admin account policy or procedure documentation',
      'Folder permission screenshots for CUI storage locations',
    ],
    policyMapping: [
      'Least Privilege Policy',
      'Access Control Policy',
      'Privileged Account Management Procedure',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 12,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'AC.2.006',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Use Non-Privileged Accounts for Non-Security Functions',
    officialDescription:
      'Use non-privileged accounts or roles when accessing non-security functions.',
    plainEnglish:
      'Even your IT person (or you, as the owner) should not use their admin account for everyday tasks like checking email, browsing the web, or opening documents. Admin-level accounts are powerful — if someone tricks your admin account into running malware, it gets admin access to everything. Use a regular account for everyday work and only switch to admin when you truly need to.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does anyone with administrative or elevated privileges have a separate standard user account that they use for day-to-day activities like reading email and browsing the web, rather than using their admin account for everything?',
    remediationSteps: [
      'Create a second, standard (non-admin) Windows account for the IT administrator or owner that they use for all normal daily activity: email, web browsing, document editing.',
      'Reserve the admin account strictly for IT tasks: installing software, configuring settings, managing user accounts. Log out of admin and into the standard account as soon as the IT task is complete.',
      'In Microsoft 365, assign Global Admin rights to a break-glass admin account that is not used for daily email. The daily Microsoft 365 account should have a standard user license.',
      'Use Windows User Account Control (UAC) set to "Always Notify" (highest setting) so any attempt to run admin-level tasks from a standard account requires explicit admin approval.',
      'Document this requirement in your Access Control Policy: "Privileged accounts shall not be used for non-administrative activities."',
    ],
    affordableTools: [
      'Windows built-in account management (free) — create standard and admin accounts at no cost',
      'Windows UAC settings (free, built-in) — prompts for admin credentials even on admin machines',
      'Microsoft Entra Privileged Identity Management (PIM) — just-in-time admin elevation (requires M365 P2 license, ~$9/user/month add-on)',
    ],
    evidenceRequired: [
      'Screenshot showing separate admin and standard accounts exist for IT administrator(s)',
      'Written procedure describing when admin accounts may be used',
      'UAC configuration screenshot showing "Always Notify" or equivalent setting',
      'Microsoft 365 admin role assignment showing daily-use account is not Global Admin',
    ],
    policyMapping: [
      'Privileged Account Management Policy',
      'Access Control Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 3,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.007',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Prevent Non-Privileged Users from Executing Privileged Functions',
    officialDescription:
      'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.',
    plainEnglish:
      'Regular employees should not be able to do things that only administrators are supposed to do — like installing software, changing system settings, or disabling your antivirus. And when an admin does perform one of these special actions, the system should keep a record of it so you can look back and see who did what and when.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are standard user accounts blocked from installing software or changing system security settings, and does your system maintain logs that record when administrator-level actions are performed?',
    remediationSteps: [
      'Ensure all employees are configured as "Standard User" in Windows (not Administrator): Settings > Accounts. Standard users will be prompted for admin credentials if they attempt to install software or change system settings.',
      'Enable Windows audit logging for privileged operations: open Local Security Policy (secpol.msc) > Advanced Audit Policy Configuration > Privilege Use > "Audit Sensitive Privilege Use" — set to Success and Failure.',
      'In Microsoft 365 GCC, enable Unified Audit Log (UAC): go to the Microsoft Purview compliance portal > Audit > Start recording user and admin activity. This captures all admin actions.',
      'Use Windows Defender Application Control (WDAC) or AppLocker (both free, built into Windows 10/11 Enterprise or via Group Policy) to create an allowlist of approved software, preventing unauthorized installs.',
      'Review audit logs monthly — set a recurring calendar reminder to spend 30 minutes reviewing the Microsoft 365 Unified Audit Log for unusual privileged activity.',
    ],
    affordableTools: [
      'Windows Local Security Policy / Group Policy (free, built-in) — audit privileged function execution',
      'Microsoft 365 Unified Audit Log (included with M365 GCC) — captures admin and privileged activity',
      'Windows Defender Application Control / AppLocker (free, built into Windows 10/11 Pro/Enterprise)',
      'Microsoft Sentinel (pay-as-you-go, starts very low for small shops) — log aggregation and alerting',
    ],
    evidenceRequired: [
      'Screenshot confirming standard users are not in local Administrators group',
      'Windows Audit Policy configuration showing privileged use auditing enabled',
      'Sample audit log entries showing privileged function executions',
      'Microsoft 365 Unified Audit Log activation screenshot',
      'Written policy stating non-privileged users may not execute privileged functions',
    ],
    policyMapping: [
      'Access Control Policy',
      'Audit and Accountability Policy',
      'Privileged Account Management Procedure',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 6,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.008',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Limit Unsuccessful Logon Attempts',
    officialDescription:
      'Limit unsuccessful logon attempts.',
    plainEnglish:
      'If someone (or a hacking program) keeps guessing the wrong password to get into one of your systems, the system should automatically lock that account after a certain number of failed tries — typically 3 to 10 attempts. This stops automated programs from trying thousands of passwords until they get lucky.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are your systems configured to lock a user account automatically after a defined number of consecutive failed login attempts (typically between 3 and 10), and do you have this setting documented and applied consistently across all systems?',
    remediationSteps: [
      'Set Windows account lockout policy: open Local Security Policy (secpol.msc) > Account Policies > Account Lockout Policy. Set "Account lockout threshold" to 5 invalid attempts, "Account lockout duration" to 15 minutes, and "Reset account lockout counter after" to 15 minutes.',
      'For Microsoft 365 accounts, enable Smart Lockout in Microsoft Entra ID: Azure Portal > Microsoft Entra ID > Security > Authentication methods > Password protection. Set lockout threshold to 10 and lockout duration to 60 seconds minimum.',
      'For any web-based systems or VPN portals, verify that the vendor\'s lockout settings are enabled — check vendor documentation or admin console settings.',
      'Test the lockout works: on a test account, deliberately enter the wrong password the defined number of times and confirm the account locks. Document the test as evidence.',
      'Ensure admins receive an alert when accounts are locked out frequently (a sign of a brute-force attack) — Microsoft 365 can be configured to alert on this via the Microsoft Defender portal.',
    ],
    affordableTools: [
      'Windows Local Security Policy (free, built-in) — account lockout policy for local Windows accounts',
      'Microsoft Entra ID Smart Lockout (free tier, included with M365) — cloud account lockout for Microsoft 365',
      'Group Policy Management (free, built-in with Windows Server/Pro) — push lockout policy across all machines',
    ],
    evidenceRequired: [
      'Screenshot of Windows Account Lockout Policy settings (secpol.msc)',
      'Screenshot of Microsoft Entra ID Smart Lockout configuration',
      'Written policy documenting defined lockout threshold and duration',
      'Test evidence showing lockout activates after defined failed attempts',
      'VPN or remote access portal lockout settings screenshot (if applicable)',
    ],
    policyMapping: [
      'Access Control Policy',
      'Password and Authentication Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 3,
    riskPriority: 'HIGH',
  },

  {
    id: 'AC.2.009',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Provide Privacy and Security Notices',
    officialDescription:
      'Provide privacy and security notices consistent with CUI rules.',
    plainEnglish:
      'When someone logs into your computer systems, they should see a short warning message that tells them the system is for authorized use only and that their activity may be monitored. You\'ve probably seen a similar banner when logging into government websites — you need to do the same thing. It\'s a simple text box that pops up before login.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do your computer systems display a logon banner or warning message before login that informs users the system is for authorized use only and that activities are subject to monitoring?',
    remediationSteps: [
      'Set a Windows logon banner via Local Security Policy: open secpol.msc > Local Policies > Security Options. Set "Interactive logon: Message title for users attempting to log on" to "AUTHORIZED USE ONLY" and "Interactive logon: Message text..." to the standard notice below.',
      'Use this standard notice text (copy it exactly): "This system is the property of [Your Company Name]. It is for authorized use only. Users (authorized or unauthorized) have no explicit or implicit expectation of privacy. Any or all uses of this system and all files on this system may be intercepted, monitored, recorded, copied, audited, inspected, and disclosed to authorized site and law enforcement personnel. By using this system, the user consents to such monitoring. Unauthorized or improper use of this system may result in disciplinary action and civil and criminal penalties."',
      'For Microsoft 365, add a Terms of Use policy in Microsoft Entra ID: Azure Portal > Microsoft Entra ID > Security > Conditional Access > Terms of Use. Users will be required to accept it before accessing company resources.',
      'For any VPN or remote access portals, configure the pre-login banner in the VPN client or portal settings — check vendor documentation for the specific setting name.',
      'Take a screenshot of the banner on each system type and retain it as evidence.',
    ],
    affordableTools: [
      'Windows Local Security Policy (free, built-in) — configure logon message text and title',
      'Group Policy (free, built-in) — push banner to all domain-joined machines simultaneously',
      'Microsoft Entra ID Terms of Use (included with Microsoft Entra ID P1, ~$6/user/month) — cloud logon banner',
    ],
    evidenceRequired: [
      'Screenshot of Windows logon banner message as it appears to users',
      'Screenshot of Local Security Policy settings showing banner text configured',
      'Microsoft Entra Terms of Use policy screenshot (if using M365)',
      'VPN pre-login banner screenshot (if applicable)',
      'Written policy referencing the use of system-use notices',
    ],
    policyMapping: [
      'System Use Notification Policy',
      'Access Control Policy',
      'CUI Handling Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 2,
    riskPriority: 'LOW',
  },

  {
    id: 'AC.2.010',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Use Session Lock with Pattern-Hiding Displays',
    officialDescription:
      'Use session lock with pattern-hiding displays after a period of inactivity.',
    plainEnglish:
      'When someone walks away from their computer without logging out, the screen should automatically lock after a few minutes of no activity — ideally showing a screensaver or blank screen rather than leaving work visible. Anyone who wants to use that computer then needs to enter a password. This prevents someone from walking by an unattended machine and reading or stealing CUI.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are all computers configured to automatically lock the screen and require a password after 15 minutes or less of inactivity, and does the lock screen hide the work that was on-screen rather than leaving it visible?',
    remediationSteps: [
      'Set screen lock timeout in Windows: Settings > Personalization > Lock screen > Screen timeout settings, then set "Screen" to 10 minutes. Also set Settings > Accounts > Sign-in options > "Require sign-in" to "When PC wakes from sleep."',
      'Set the screensaver with password protection: right-click desktop > Personalize > Lock screen > Screen saver settings. Check "On resume, display logon screen" and set wait time to 10 minutes. Use a blank screensaver (not a pattern that shows work content).',
      'Push this setting across all machines using Group Policy (if you have a Windows domain) or Intune (if using Microsoft 365 Business Premium): Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options: "Interactive logon: Machine inactivity limit" — set to 600 seconds (10 minutes).',
      'Confirm the setting is working by walking away from a computer for 10 minutes and verifying the screen locks.',
      'Remind employees to manually lock their screen (Windows key + L) whenever they step away, even for short periods — add this to your security awareness training.',
    ],
    affordableTools: [
      'Windows Settings / Group Policy (free, built-in) — screen lock timeout and screensaver settings',
      'Microsoft Intune (included with M365 Business Premium at ~$22/user/month) — push screen lock policy to all managed devices',
      'Local Security Policy secpol.msc (free, built-in) — machine inactivity limit setting',
    ],
    evidenceRequired: [
      'Screenshot of Windows screen lock / screensaver settings showing timeout value',
      'Group Policy or Intune policy screenshot showing inactivity lock configured',
      'Written policy stating screen lock must activate within 15 minutes of inactivity',
      'Photo or screenshot of lock screen appearing on a test machine after timeout period',
    ],
    policyMapping: [
      'Access Control Policy',
      'Clean Desk and Screen Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 2,
    riskPriority: 'LOW',
  },

  {
    id: 'AC.2.011',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Terminate Sessions After Defined Conditions',
    officialDescription:
      'Terminate (automatically) a user session after a defined condition.',
    plainEnglish:
      'Your systems should automatically end a user\'s session after a defined period of inactivity — not just lock the screen, but actually log them out or disconnect the session. This is especially important for remote access (like VPN or Remote Desktop) where a forgotten connected session could stay open indefinitely and be exploited.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are remote access sessions (VPN, Remote Desktop, web portals) automatically terminated after a defined period of inactivity, and is there a documented policy specifying these timeout conditions?',
    remediationSteps: [
      'For Remote Desktop Protocol (RDP) connections: open Group Policy editor (gpedit.msc) > Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Remote Desktop Session Host > Session Time Limits. Set "Set time limit for disconnected sessions" to 1 hour and "End session when time limits are reached" to Enabled.',
      'For Microsoft 365 web sessions: in Microsoft Entra ID Conditional Access, configure a session policy that signs out users after a defined period of inactivity (requires Microsoft Entra ID P1 license).',
      'For VPN sessions, check your VPN provider\'s admin console for idle-session timeout settings. Most commercial VPNs (Cisco AnyConnect, OpenVPN, etc.) have configurable idle timeouts — set to 30 minutes.',
      'For web application portals, configure session timeout in the application settings. Most modern web applications have idle session timeout in their settings or admin panel.',
      'Document the defined conditions: create a one-page policy stating the specific timeout values for each system type (workstation lock: 10 minutes, RDP disconnect: 1 hour, VPN idle: 30 minutes, web portal: 30 minutes).',
    ],
    affordableTools: [
      'Windows Group Policy (free, built-in) — RDP session timeout configuration',
      'Microsoft Entra ID Conditional Access (requires P1 license, ~$6/user/month) — session timeout for cloud apps',
      'OpenVPN (free, open-source) — configurable idle session timeout',
      'Most commercial VPNs (built-in admin console timeout settings)',
    ],
    evidenceRequired: [
      'Group Policy screenshot showing RDP session timeout configured',
      'VPN admin console screenshot showing idle session timeout value',
      'Microsoft Entra Conditional Access session policy screenshot (if applicable)',
      'Written policy document specifying session termination conditions for each system',
    ],
    policyMapping: [
      'Access Control Policy',
      'Remote Access Policy',
      'Session Management Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 4,
    riskPriority: 'LOW',
  },

  {
    id: 'AC.2.012',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Monitor and Control Remote Access Sessions',
    officialDescription:
      'Monitor and control remote access sessions.',
    plainEnglish:
      'If your employees (or IT support) access your company\'s systems from outside the office — from home, on the road, or via a support vendor — you need to know when those remote sessions happen, who initiated them, and be able to shut them down if something looks wrong. You can\'t just have an open door into your systems without watching who\'s coming through.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have a way to see who is currently connected remotely to your systems, do you keep logs of remote access sessions (who connected, from where, when), and can you terminate a suspicious remote session if needed?',
    remediationSteps: [
      'Use a VPN for all remote access rather than exposing Remote Desktop directly to the internet. OpenVPN Access Server (free for up to 2 connections) or a hardware VPN router (Cisco RV series, ~$100-$300) centralizes remote connections through one monitored gateway.',
      'Enable Windows Event Logging for remote connections: in Event Viewer, Security logs capture logon events (Event ID 4624 for successful logon, 4625 for failed). Enable these under Local Security Policy > Audit Policy.',
      'In Microsoft 365 GCC, use Microsoft Entra Sign-in Logs to monitor all cloud-based remote access: Azure Portal > Microsoft Entra ID > Monitoring > Sign-in logs. Review this monthly.',
      'For IT support vendors, use a PAM (Privileged Access Management) tool like BeyondTrust Remote Support Free or AnyDesk Business to ensure vendor sessions are recorded and you must approve them before they connect.',
      'Create a remote access log review procedure: designate someone to review remote access logs weekly, and document that review with a dated sign-off.',
    ],
    affordableTools: [
      'OpenVPN Access Server (free for up to 2 concurrent connections, open-source) — centralized, monitored VPN',
      'Microsoft Entra Sign-in Logs (free, included with M365) — remote cloud access monitoring',
      'Windows Event Viewer (free, built-in) — local remote access session logs',
      'AnyDesk Business (~$15/month) — monitored, approved remote support sessions with session recording',
      'Cisco RV series VPN routers (~$100-$300 one-time) — hardware VPN with built-in logging',
    ],
    evidenceRequired: [
      'VPN or remote access solution configuration showing logging is enabled',
      'Sample remote access log entries (with PII redacted if needed for review)',
      'Written Remote Access Policy describing monitoring requirements',
      'Process or procedure for periodic review of remote access logs',
      'Evidence of log review (dated sign-off or ticketing system entry)',
    ],
    policyMapping: [
      'Remote Access Policy',
      'Access Control Policy',
      'Monitoring and Audit Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },

  {
    id: 'AC.2.013',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Employ Cryptographic Mechanisms for Remote Access',
    officialDescription:
      'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.',
    plainEnglish:
      'When your employees connect remotely to your systems, the connection must be encrypted — meaning the data traveling back and forth is scrambled so that anyone who intercepts it on the internet can\'t read it. A VPN (Virtual Private Network) using modern encryption like AES-256 satisfies this. Plain Remote Desktop open to the internet, unencrypted FTP, or HTTP (not HTTPS) do not.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is all remote access to your systems protected by strong encryption — for example, using a VPN with AES-256 encryption, TLS 1.2 or higher for web-based access, or SSH for server access — rather than unencrypted protocols?',
    remediationSteps: [
      'Deploy a VPN solution that uses AES-256 encryption for all remote worker connections. OpenVPN (free, uses AES-256 by default) or WireGuard (free, uses ChaCha20 encryption which is FIPS-acceptable) are excellent free options.',
      'Never expose Remote Desktop (RDP) port 3389 directly to the internet — it must only be accessible through an encrypted VPN. Check your firewall/router settings to confirm port 3389 is not open externally.',
      'Ensure any web portals used for remote access use HTTPS (TLS 1.2 or 1.3 minimum) and not plain HTTP. Verify by checking that the URL starts with "https://" and the browser shows a padlock icon.',
      'For file transfer, use SFTP (Secure FTP) or SharePoint/OneDrive (which uses TLS) rather than plain FTP. Disable FTP on your servers if it is running.',
      'Document which encryption protocol and minimum key length is in use for each remote access method in your System Security Plan.',
    ],
    affordableTools: [
      'OpenVPN Community Edition (free, open-source) — AES-256 encrypted VPN',
      'WireGuard (free, open-source) — modern, fast, secure VPN protocol',
      'Windows Server SSTP VPN (included with Windows Server) — TLS-encrypted built-in VPN',
      'Microsoft 365 / SharePoint (included with M365 subscription) — all access over TLS 1.2+',
      'FileZilla Server with SFTP (free) — encrypted file transfer replacing plain FTP',
    ],
    evidenceRequired: [
      'VPN configuration screenshots showing encryption protocol and cipher suite (AES-256 or equivalent)',
      'Firewall rule export or screenshot confirming RDP port 3389 is blocked from external access',
      'Network diagram or written description of all remote access paths and their encryption methods',
      'SSL/TLS configuration for any web portals (e.g., SSL Labs test result showing TLS 1.2+)',
      'Written Remote Access Policy specifying required encryption standards',
    ],
    policyMapping: [
      'Remote Access Policy',
      'Cryptographic Policy',
      'System and Communications Protection Policy',
      'System Security Plan (SSP) Section 3.1 and 3.13',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },

  {
    id: 'AC.2.014',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Route Remote Access via Managed Access Control Points',
    officialDescription:
      'Route remote access via managed access control points.',
    plainEnglish:
      'All remote access to your network should funnel through a single, controlled entry point — like a VPN gateway or firewall — rather than having multiple different ways in that are hard to monitor. Think of it like your physical shop having one front door with a lock and camera, rather than ten different unlocked entrances scattered around the building.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does all remote access to your company\'s network and systems go through a single managed entry point (such as a VPN or firewall with access control), rather than multiple unmonitored pathways like open RDP ports, unsecured file-sharing services, or direct internet-exposed servers?',
    remediationSteps: [
      'Audit your current remote access paths: ask your IT person or a consultant to list every way someone can connect to your network from outside. Common hidden pathways include open RDP ports, TeamViewer left running, FTP servers, and remote printer software.',
      'Consolidate all remote access through a single VPN gateway. If you have a business-grade router/firewall (Fortinet, SonicWall, Cisco, Ubiquiti — typically $200-$800), enable the built-in VPN feature and require all remote workers to use it.',
      'Block all other inbound remote access at your firewall: close all inbound ports except what is explicitly needed. Run a free external port scan at Shields Up (grc.com/shieldsup) to identify any unexpected open ports.',
      'Require your IT support vendors to access your systems through the VPN or through an approved, auditable remote support tool (AnyDesk, Splashtop) rather than via their own direct connection methods.',
      'Document the single approved remote access path in your Remote Access Policy and System Security Plan.',
    ],
    affordableTools: [
      'Fortinet FortiGate 40F (~$300-$500) — business firewall with built-in VPN gateway',
      'Ubiquiti UniFi Security Gateway (~$150-$400) — managed firewall/VPN with logging',
      'pfSense (free, open-source) — full-featured firewall/VPN if you have spare hardware',
      'OpenVPN Access Server (free for 2 connections) — centralized VPN gateway',
      'GRC Shields Up (free, web-based) — external port scan to find unexpected open ports',
    ],
    evidenceRequired: [
      'Network diagram showing the single managed remote access entry point',
      'Firewall rule export or screenshot showing only VPN port is open externally (no RDP, FTP, etc.)',
      'VPN gateway configuration screenshot',
      'Port scan results confirming no unexpected open ports',
      'Written Remote Access Policy requiring use of the approved access point',
    ],
    policyMapping: [
      'Remote Access Policy',
      'Network Security Policy',
      'System and Communications Protection Policy',
      'System Security Plan (SSP) Section 3.1 and 3.13',
    ],
    estimatedHours: 10,
    riskPriority: 'HIGH',
  },

  {
    id: 'AC.2.015',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Authorize Remote Execution of Privileged Commands',
    officialDescription:
      'Authorize remote execution of privileged commands and access to security-relevant information via remote access only for documented operational needs.',
    plainEnglish:
      'If an IT admin needs to make important system changes or run powerful commands while working remotely — like installing software, changing configurations, or accessing security settings — that should only be allowed when there\'s a specific documented reason. You can\'t just let admins do anything remotely at any time without oversight. There should be a process for approving and tracking these remote privileged actions.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented process for authorizing and tracking when IT administrators perform privileged functions (like changing system settings, installing software, or accessing security configurations) via remote access, rather than those activities being unrestricted?',
    remediationSteps: [
      'Create a simple Remote Privileged Access Request form (a Word document or Google Form works) that requires: requester name, date/time, system to be accessed, reason for privileged remote access, and manager approval.',
      'Implement a just-in-time (JIT) approach: admin accounts should not be permanently enabled for remote access. The admin requests access, gets approved, performs the task, and access is revoked. Microsoft Entra PIM (Privileged Identity Management) automates this.',
      'For vendor remote access, require a written work order or ticket before any vendor connects remotely with privileged access. The business owner or designated manager must approve.',
      'Enable and review audit logs for all remote privileged command executions. In Windows Event Log, Event IDs 4672 (special privileges assigned to new logon) and 4673 (privileged service called) capture these events.',
      'Document in your System Security Plan the specific operational needs that justify remote privileged access, who is authorized to approve it, and the review schedule for those authorizations.',
    ],
    affordableTools: [
      'Microsoft Entra Privileged Identity Management (requires Entra ID P2, ~$9/user/month) — just-in-time admin activation',
      'Windows Event Log (free, built-in) — tracks privileged command execution events',
      'Simple approval workflow in Microsoft Forms + Outlook (included with M365) — request and approval tracking',
      'AnyDesk Business with session recording (~$15/month) — records all remote privileged sessions',
    ],
    evidenceRequired: [
      'Written Remote Privileged Access Policy or procedure',
      'Sample completed remote privileged access request/approval form',
      'Audit log entries showing remote privileged command executions',
      'Microsoft Entra PIM configuration screenshot (if using M365)',
      'List of personnel authorized to approve remote privileged access',
    ],
    policyMapping: [
      'Remote Access Policy',
      'Privileged Account Management Policy',
      'Access Control Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 5,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.016',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Authorize Wireless Access Prior to Allowing Connections',
    officialDescription:
      'Authorize wireless access to the system prior to allowing such connections.',
    plainEnglish:
      'Before any device can connect to your business Wi-Fi network (especially the one that touches your CUI/contract data), it should be approved and authorized. This means having a documented list of which devices are allowed on your business network, and not just having an open Wi-Fi with a password that anyone who knows it can use. Personal smartphones and guest devices should never be on the same network as your work computers.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is your business Wi-Fi network configured so that only authorized, company-approved devices can connect to the network where CUI is stored or processed — for example, through MAC address filtering, device certificates, or a separate guest network that is isolated from business systems?',
    remediationSteps: [
      'Create two separate Wi-Fi networks on your business router: one for company computers and devices (the "CUI network"), and a completely separate guest/personal network for visitors and personal phones. Most modern business routers support this for free.',
      'Maintain an inventory list of all authorized devices (company laptops, workstations, printers) that are allowed on the CUI network. Include device name, MAC address, and owner.',
      'Enable MAC address filtering on your CUI network Wi-Fi: in your router admin panel, set up a whitelist of approved MAC addresses. Only devices on the list can connect. Note: this is a basic control and should be combined with WPA3 or WPA2-Enterprise.',
      'For stronger security, deploy WPA2-Enterprise (802.1X) authentication using a RADIUS server — Ubiquiti UniFi and similar business routers support this and it requires certificate-based authentication, not just a password.',
      'Document wireless access authorization in your Access Control Policy: who approves devices, how devices are added to the approved list, and how often the list is reviewed.',
    ],
    affordableTools: [
      'Ubiquiti UniFi Access Points (~$100-$200) — easy VLAN segmentation, guest network isolation, and device management',
      'Most business routers (ASUS, Netgear Business, TP-Link Omada) — free MAC filtering and guest network features',
      'Windows Network Policy Server (NPS, free with Windows Server) — RADIUS server for WPA2-Enterprise',
      'Meraki Go (SMB version, ~$150/year per AP) — cloud-managed Wi-Fi with device policy controls',
    ],
    evidenceRequired: [
      'Router/access point configuration screenshot showing separate CUI and guest networks (VLANs)',
      'Authorized wireless device inventory list',
      'MAC address filtering configuration screenshot',
      'Written Wireless Access Policy',
      'Network diagram showing Wi-Fi network segmentation',
    ],
    policyMapping: [
      'Wireless Access Policy',
      'Access Control Policy',
      'Network Security Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 6,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.017',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Protect Wireless Access Using Authentication and Encryption',
    officialDescription:
      'Protect wireless access using authentication and encryption.',
    plainEnglish:
      'Your business Wi-Fi must use strong encryption (WPA2 or WPA3) with a strong password, so that the data traveling over the wireless signal is protected and random people nearby can\'t just join your network. WPA1 (old) and open/unsecured Wi-Fi are not acceptable. The password should be complex — not "shop1234" — and changed periodically.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is your business Wi-Fi network secured with WPA2 or WPA3 encryption and a strong, complex password (not a simple word or default router password), and have you verified that no access points are running older WEP or WPA1 encryption or are configured as open/unencrypted networks?',
    remediationSteps: [
      'Log into your router\'s admin page (usually 192.168.1.1 or 192.168.0.1) and navigate to Wireless Settings. Verify the security mode is set to WPA2-AES or WPA3. If it says WEP, WPA (version 1), or None/Open, change it immediately.',
      'Set a strong Wi-Fi password for your CUI network: minimum 16 characters, mixing uppercase, lowercase, numbers, and symbols. Use a password manager like Bitwarden to generate and store it.',
      'Enable WPA3 if your router and devices support it (most hardware manufactured after 2020 does). WPA3 is significantly more resistant to password-guessing attacks than WPA2.',
      'Conduct a wireless survey: walk around your facility and use a free tool like Wireless Network Watcher (NirSoft, free) to confirm no rogue or unauthorized access points are broadcasting near your facility.',
      'Change the Wi-Fi password on a schedule (every 6-12 months) and whenever an employee who knew the password leaves the company. Document the last date the password was changed.',
    ],
    affordableTools: [
      'Built-in router admin console (free) — WPA2/WPA3 configuration',
      'Bitwarden (free individual, $3/month teams) — generate and store complex Wi-Fi passwords',
      'Wireless Network Watcher by NirSoft (free) — detect all wireless access points in range',
      'Acrylic Wi-Fi Home (free) — detailed Wi-Fi network scanner and security audit tool',
    ],
    evidenceRequired: [
      'Router admin console screenshot showing WPA2 or WPA3 encryption enabled on the CUI network',
      'Evidence that default router passwords have been changed (no specific password needed, just confirmation)',
      'Written policy specifying minimum Wi-Fi encryption standard (WPA2/WPA3) and password complexity requirements',
      'Wireless survey results confirming no unauthorized or unencrypted access points',
    ],
    policyMapping: [
      'Wireless Access Policy',
      'Cryptographic Policy',
      'Network Security Policy',
      'System Security Plan (SSP) Section 3.1 and 3.13',
    ],
    estimatedHours: 3,
    riskPriority: 'HIGH',
  },

  {
    id: 'AC.2.018',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Control Connection of Mobile Devices',
    officialDescription:
      'Control connection of mobile devices.',
    plainEnglish:
      'If your employees use smartphones or tablets to access company email, files, or systems — or if they connect personal phones to company Wi-Fi — you need to have rules and controls around that. A personal phone that hasn\'t been updated in two years and has no PIN code shouldn\'t have access to your CUI. You should know which mobile devices connect to your systems and be able to wipe them remotely if they\'re lost or stolen.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have policies and technical controls governing which mobile devices (smartphones, tablets) can access company systems and data — for example, requiring devices to have a PIN/password, be enrolled in Mobile Device Management (MDM), or be company-owned — and can you remotely wipe a lost or stolen device that had access to CUI?',
    remediationSteps: [
      'Enroll all mobile devices that access company data into a Mobile Device Management (MDM) solution. Microsoft Intune (included with M365 Business Premium) is the most practical option — it lets you enforce PIN requirements, encryption, and remote wipe.',
      'Set a baseline mobile device policy in Intune or your MDM: require a 6-digit PIN or biometric unlock, require device encryption (enabled by default on modern iOS and Android), and configure automatic remote wipe after 10 failed unlock attempts.',
      'If you don\'t want to use MDM, at minimum implement a written policy requiring employees to: use a PIN, keep the OS updated, and never store CUI directly on personal devices (use SharePoint/OneDrive with the mobile app instead).',
      'Register and inventory every mobile device that accesses company resources. Include device type, owner, OS version, and enrollment date in your device inventory.',
      'Consider a "company-owned, personally-enabled" (COPE) approach for devices that regularly handle CUI: the company provides a dedicated work phone/tablet, maintaining full control.',
    ],
    affordableTools: [
      'Microsoft Intune (included with M365 Business Premium at ~$22/user/month) — MDM for iOS, Android, Windows',
      'Microsoft 365 Basic Mobility and Security (free, included with most M365 plans) — lightweight MDM alternative',
      'Jamf Now (free for up to 3 Apple devices, then $4/device/month) — Apple-specific MDM',
      'Google Workspace Endpoint Management (free with Google Workspace) — Android and iOS MDM if using Google',
    ],
    evidenceRequired: [
      'MDM enrollment list showing all authorized mobile devices',
      'MDM policy configuration screenshot showing PIN, encryption, and remote wipe requirements',
      'Written Mobile Device Policy covering access rules, security requirements, and incident procedures',
      'Device inventory list with device type, owner, OS version, and access level',
    ],
    policyMapping: [
      'Mobile Device Policy',
      'Access Control Policy',
      'Media Protection Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 8,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.019',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Encrypt CUI on Mobile Devices',
    officialDescription:
      'Encrypt CUI on mobile devices and mobile computing platforms.',
    plainEnglish:
      'If any government contract information (CUI) is stored on a laptop, tablet, or smartphone, that device\'s storage must be encrypted. Encryption scrambles the data on the device so that if the device is lost or stolen, the thief cannot read the files without the encryption key. BitLocker on Windows laptops and the built-in encryption on iPhones and modern Androids are common ways to meet this.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is the storage on all laptops and mobile devices that contain or access CUI encrypted — for example, is BitLocker enabled on company Windows laptops, and is encryption enabled on company iPhones or Android devices?',
    remediationSteps: [
      'Enable BitLocker on all Windows laptops and mobile workstations: go to Control Panel > System and Security > BitLocker Drive Encryption > Turn on BitLocker. Save the recovery key to your Microsoft account or print it and store it in a secure location (not on the encrypted drive itself).',
      'Verify BitLocker is enabled on each machine: open a command prompt and run "manage-bde -status" to see the protection status of each drive. Screenshot the output as evidence.',
      'For iPhones: encryption is enabled automatically when you set a device passcode. Go to Settings > [Your Name] > iPhone Backup to verify. For Android (version 6 and later): go to Settings > Security > Encryption and confirm it\'s enabled.',
      'For company-issued laptops running Windows 10/11 Home (which doesn\'t include BitLocker): upgrade to Windows 10/11 Pro (~$100 upgrade key) to get BitLocker, or use VeraCrypt (free, open-source) as an alternative.',
      'Maintain a log of which devices have encryption enabled: device name, user, OS, encryption method, and key backup location (not the key itself).',
    ],
    affordableTools: [
      'BitLocker (free, built into Windows 10/11 Pro/Enterprise) — full disk encryption for Windows laptops',
      'VeraCrypt (free, open-source) — full disk or container encryption for Windows Home and other OSes',
      'iOS built-in encryption (free, automatic when passcode is set)',
      'Android built-in encryption (free, built into Android 6.0+)',
      'Microsoft Intune (included with M365 Business Premium) — enforce and verify encryption across all managed devices',
    ],
    evidenceRequired: [
      'BitLocker status output from "manage-bde -status" or BitLocker management console for each laptop',
      'Intune device compliance report showing encryption status (if using Intune)',
      'iOS/Android encryption confirmation screenshots for mobile devices',
      'Written policy requiring encryption on all mobile devices and laptops that access CUI',
      'Encryption key management record (showing keys are backed up securely)',
    ],
    policyMapping: [
      'Mobile Device Policy',
      'Cryptographic Policy',
      'Media Protection Policy',
      'CUI Handling Policy',
      'System Security Plan (SSP) Section 3.1 and 3.13',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },

  {
    id: 'AC.2.020',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Verify and Control Connections to External Systems',
    officialDescription:
      'Verify and control/limit connections to external systems.',
    plainEnglish:
      'When your employees connect company devices to external networks or systems — like using their work laptop on a coffee shop Wi-Fi, connecting to a customer\'s network, or accessing a cloud service not approved by your company — you need rules around that. Company devices that handle CUI should only connect to trusted, known networks, and there should be a process for approving connections to outside systems.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have a policy and technical controls that restrict company computers and devices (especially those that handle CUI) from connecting to untrusted external networks without protection — for example, requiring VPN use when on public Wi-Fi, maintaining a list of approved cloud services, and prohibiting CUI work on personal or guest networks?',
    remediationSteps: [
      'Establish a written policy requiring employees to use the company VPN whenever working on any non-company network (hotel, coffee shop, client site). The VPN encrypts traffic and routes it through your controlled gateway.',
      'Create an approved cloud services list: document which cloud services employees are authorized to use for work (Microsoft 365 GCC, specific approved SaaS tools) and prohibit use of unauthorized services for CUI (personal Dropbox, personal Google Drive, WeTransfer, etc.).',
      'Enable Microsoft Defender\'s "Network Protection" feature to block connections to known malicious sites: in Windows Security > Virus and Threat Protection > Virus and Threat Protection Settings, enable Cloud-delivered protection and Automatic sample submission.',
      'Use Microsoft 365 Conditional Access to require that company devices be compliant (enrolled in Intune, up to date) before accessing Microsoft 365 resources — this prevents unmanaged or personal devices from accessing CUI in the cloud.',
      'Conduct a quarterly review of which cloud services are being used: Microsoft 365 GCC Defender for Cloud Apps can generate a Cloud Discovery report showing all cloud services accessed from your network.',
    ],
    affordableTools: [
      'Company VPN (OpenVPN free, or VPN included with firewall hardware) — protect work on external networks',
      'Microsoft 365 Conditional Access (requires Entra ID P1, ~$6/user/month) — enforce device compliance for cloud access',
      'Microsoft Defender for Cloud Apps (included with M365 E5 or as add-on) — discover and control cloud service use',
      'Windows Defender Network Protection (free, built into Windows 10/11 with Defender) — block known malicious connections',
    ],
    evidenceRequired: [
      'Written External Connection Policy or Acceptable Use Policy listing approved and prohibited external services',
      'VPN usage policy and evidence that VPN is deployed and required for remote work',
      'Approved cloud services list with authorization documentation',
      'Conditional Access policy screenshots (if using M365)',
      'Cloud Discovery report showing controlled cloud service usage (if available)',
    ],
    policyMapping: [
      'External Connection Policy',
      'Acceptable Use Policy',
      'Remote Access Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 6,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.021',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Limit Use of Portable Storage on External Systems',
    officialDescription:
      'Limit use of portable storage devices on external systems.',
    plainEnglish:
      'Your employees shouldn\'t be plugging company USB drives (containing CUI or work data) into computers you don\'t control — like a customer\'s computer, a public library PC, or a personal home computer. And external USB drives from unknown sources shouldn\'t be plugged into your company machines. This prevents malware from jumping in on a USB stick and prevents data from walking out the door on a thumb drive.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have policies and/or technical controls that prevent employees from using company USB storage devices on external/unmanaged computers, and that prevent unknown or unauthorized USB devices from being inserted into company computers that store or process CUI?',
    remediationSteps: [
      'Write a clear policy: "Company USB drives may only be used on company-owned and managed computers. Do not insert company USB drives into personal computers, customer computers, or any unmanaged device. Do not insert personal or unknown USB drives into company computers."',
      'Use Microsoft Defender for Business (included in M365 Business Premium) Device Control to restrict USB storage device usage: go to Microsoft Intune > Endpoint Security > Attack surface reduction > Device control. Create a policy that blocks unknown/unmanaged USB storage devices.',
      'For computers where USB blocking is not feasible, use Windows Group Policy to disable AutoPlay and AutoRun for USB drives: Computer Configuration > Administrative Templates > Windows Components > AutoPlay Policies > Turn off AutoPlay — set to All Drives.',
      'If you need to exchange files with external parties, use an approved method (secure email via M365, SharePoint sharing links with expiration) rather than USB drives.',
      'Conduct periodic checks: ask employees how they transfer files to and from work computers. If USB drives are common, accelerate the technical controls above.',
    ],
    affordableTools: [
      'Microsoft Defender for Business Device Control (included with M365 Business Premium) — USB storage device blocking',
      'Windows Group Policy AutoPlay/AutoRun disable (free, built-in) — prevent automatic execution from USB',
      'Microsoft Intune Device Configuration (included with M365 Business Premium) — push USB restriction policies',
      'Endpoint Protector by CoSoSys (free trial, then paid) — granular USB device control',
    ],
    evidenceRequired: [
      'Written Portable Storage Policy or Removable Media Policy',
      'Defender for Business or Intune Device Control policy screenshot showing USB restrictions',
      'Group Policy AutoRun disable configuration screenshot',
      'Employee training acknowledgment of the portable storage policy',
    ],
    policyMapping: [
      'Removable Media Policy',
      'Media Protection Policy',
      'Access Control Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 4,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AC.2.022',
    family: 'AC',
    familyName: 'Access Control',
    title: 'Control CUI Posted to Publicly Accessible Systems',
    officialDescription:
      'Control CUI posted or processed on publicly accessible systems.',
    plainEnglish:
      'If your company has a website, social media accounts, a public file server, or any other publicly accessible system, make absolutely sure no government contract information (CUI) ends up there. Never post drawings, specs, contract details, or any government-related work on your public website or public social media. This sounds obvious, but it\'s a real problem — companies accidentally post sensitive files to public GitHub repositories, public Dropbox links, or on public job postings.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Do you have a process to verify that CUI is never posted to publicly accessible systems like your company website, public social media, public cloud storage links (like an unsecured Dropbox or Google Drive link), or public code repositories — and has someone recently reviewed your public-facing systems to confirm no CUI is visible?',
    remediationSteps: [
      'Conduct an immediate audit: search your company website, any public GitHub/GitLab repositories, public Dropbox or Google Drive shares, and social media accounts for any government contract information, drawings, part numbers, or documents marked CUI.',
      'Establish a review process: before posting anything publicly (website update, social media post, job listing, press release), require someone to confirm it contains no CUI. Document this as part of your content publication procedure.',
      'Make Microsoft 365 SharePoint sharing link policies restrict public sharing: in SharePoint admin center > Policies > Sharing, set external sharing to "Only people in your organization" or "Existing guests only." This prevents accidental "anyone with the link" public sharing of documents.',
      'If your company uses GitHub or any source code repository for CAD macros, CNC programs, or tooling scripts, ensure those repositories are set to Private. Never commit files containing CUI to a public repository.',
      'Train employees: cover this topic in your annual security awareness training. Include a real example of how this happens accidentally (e.g., "we sent a contract drawing in an email that could be forwarded to anyone").',
    ],
    affordableTools: [
      'Microsoft 365 SharePoint Sharing Policies (included with M365) — restrict who can share documents externally',
      'Microsoft Purview Data Loss Prevention (DLP) (included with M365 E3/GCC) — scan for CUI in outgoing content',
      'GitHub repository visibility settings (free, built-in) — ensure repositories are private',
      'Google Alerts (free) — monitor for your company name or contract keywords appearing publicly online',
    ],
    evidenceRequired: [
      'Written policy prohibiting posting CUI to publicly accessible systems',
      'Documentation of periodic review of public-facing systems (website, social media, public cloud links)',
      'SharePoint external sharing policy configuration screenshot showing restricted sharing',
      'Evidence that any GitHub/code repositories related to CUI work are set to Private',
      'Employee training records covering this topic',
    ],
    policyMapping: [
      'CUI Handling Policy',
      'Information Classification and Handling Policy',
      'Access Control Policy',
      'Public Affairs and Communications Policy',
      'System Security Plan (SSP) Section 3.1',
    ],
    estimatedHours: 5,
    riskPriority: 'MEDIUM',
  },
];
