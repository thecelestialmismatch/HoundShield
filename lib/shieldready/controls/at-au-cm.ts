import { NISTControl } from '../types';

// =============================================================================
// AWARENESS & TRAINING (AT) — 3 Controls
// NIST SP 800-171 Rev 2  |  Section 3.2
// SPRS max deduction for family: -9
// =============================================================================

export const AT_CONTROLS: NISTControl[] = [
  {
    id: 'AT.2.001',
    family: 'AT',
    familyName: 'Awareness & Training',
    title: 'Security Awareness of Risks Associated with CUI',
    officialDescription:
      'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.',
    plainEnglish:
      'Every person in your 8-person shop who touches a computer—the owner, the machinists logging job hours, the office manager sending purchase orders—must be told annually that they are handling government-sensitive information (CUI), what that means, and what they must never do (e.g., email drawings to personal Gmail, leave a USB drive in the parking lot). A one-hour lunch-and-learn plus a signed acknowledgment sheet satisfies this for a small shop.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Has every employee who accesses systems containing CUI received documented security awareness training in the past 12 months and signed an acknowledgment?',
    remediationSteps: [
      'Create a one-page "CUI Handling Rules" document specific to your machine shop—include what CUI looks like (drawings, specs, contract line items), where it lives (shared drive, email), and what is forbidden (personal cloud, social media, unencrypted USB).',
      'Schedule a one-hour annual training session for all staff. Use free CISA resources at cisa.gov/cybersecurity-training-exercises or the DoD Cyber Awareness Challenge (free at https://public.cyber.mil/training/cyber-awareness-challenge/).',
      'Create a one-page sign-off sheet listing each employee name, training date, and a checkbox confirming they received and understood the policy. Collect signatures immediately after training.',
      'Store signed acknowledgments in a physical binder AND scan them into a protected folder. Label the folder "CMMC Evidence — AT — Awareness Training." Repeat annually or when someone is newly hired.',
      'Set a recurring calendar reminder for 11 months from now so the next training cycle is never missed.',
    ],
    affordableTools: [
      'DoD Cyber Awareness Challenge — free at public.cyber.mil, takes ~1 hour, auto-generates completion certificates',
      'CISA Free Training Catalog — cisa.gov/cybersecurity-training-exercises',
      'Microsoft Word or Google Docs — for drafting your CUI policy and sign-off sheet',
      'Microsoft 365 SharePoint or a shared network folder — to store evidence files',
      'Google Calendar or Outlook — for annual recurring training reminders',
    ],
    evidenceRequired: [
      'Signed attendance/acknowledgment sheet with employee names, dates, and signatures',
      'Training material used (printout, slide deck, or DoD completion certificate)',
      'Written CUI handling policy that was presented during training',
      'Roster showing all employees who have system access were included',
    ],
    policyMapping: [
      'CUI Security Awareness Policy',
      'Acceptable Use Policy (AUP)',
      'Information Security Program Plan (ISPP)',
    ],
    estimatedHours: 4,
    riskPriority: 'HIGH',
  },

  {
    id: 'AT.2.002',
    family: 'AT',
    familyName: 'Awareness & Training',
    title: 'Role-Based Security Training',
    officialDescription:
      'Ensure that personnel are trained to carry out their assigned information security responsibilities.',
    plainEnglish:
      'Certain people in your shop have bigger security jobs than others. Whoever manages your network, sets up Windows computers, or administers your file server needs hands-on training beyond the general awareness session—they should know how to configure Windows firewall, manage user accounts, and respond if something looks wrong. Even in an 8-person shop this might just be you (the owner) or a part-time IT person. Document what they know and how they learned it.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Has every person with elevated system privileges or IT responsibilities received role-specific security training appropriate to their duties, with documentation on file?',
    remediationSteps: [
      'Identify every role that has security responsibilities: system administrator (installs software, manages accounts), IT administrator (network/firewall), and any backup administrator. In a small shop these may all be one person.',
      'For each role, list the specific security tasks they perform—e.g., "creates/removes Windows user accounts," "reviews Windows Event Viewer weekly," "applies Windows Update patches monthly."',
      'Match each task to a free training resource. Microsoft Learn (learn.microsoft.com) offers free courses on Windows Server administration, Azure, and security fundamentals. CompTIA Security+ study materials cover most topics.',
      'Have each role-holder complete at least one relevant training module per year and save the completion certificate to your CMMC evidence folder.',
      'Document a "Role-Based Training Matrix": a simple spreadsheet with columns for Role, Person, Training Completed, Date, and Certificate File Name.',
    ],
    affordableTools: [
      'Microsoft Learn — learn.microsoft.com, fully free, role-based learning paths for Windows and Azure',
      'CISA Free Training — cisa.gov/resources-tools/training, free role-based cybersecurity courses',
      'SANS Cyber Aces — free foundational IT security training at cyberaces.org',
      'DoD Cyber Workforce Framework resources — free role-based guidance at dodcwf.mil',
      'Microsoft Excel or Google Sheets — to maintain the role-based training matrix',
    ],
    evidenceRequired: [
      'Role-based training matrix listing each privileged/IT role, the person filling it, training completed, and date',
      'Training completion certificates or screenshots for each role-holder',
      'Job descriptions or role descriptions documenting security responsibilities',
      'Records showing newly hired personnel with IT roles received training before being granted access',
    ],
    policyMapping: [
      'Role-Based Security Training Policy',
      'Information Security Program Plan (ISPP)',
      'Personnel Security Policy',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },

  {
    id: 'AT.2.003',
    family: 'AT',
    familyName: 'Awareness & Training',
    title: 'Insider Threat Awareness',
    officialDescription:
      'Provide security awareness training on recognizing and reporting potential indicators of insider threat.',
    plainEnglish:
      'An insider threat is not just a spy movie villain—it is a disgruntled employee copying drawings to a thumb drive before quitting, or a well-meaning machinist who emails a blueprint to his brother at another shop. Your team needs to know the warning signs (coworker downloading unusual amounts of data, accessing files outside their job, talking about financial trouble combined with access to sensitive specs) and exactly how to report it (tell the owner/manager immediately). This is a 30-minute add-on to your annual awareness training.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does annual security awareness training include a specific section on insider threat indicators and the process for reporting suspicious behavior?',
    remediationSteps: [
      'Add an "Insider Threat" section to your existing annual training. Cover three categories: (1) unintentional insiders (accidents, mistakes), (2) negligent insiders (ignoring policy), (3) malicious insiders (deliberate theft or sabotage).',
      'List concrete indicators relevant to your shop: unusual after-hours system access, bulk copying of CUI files to USB, forwarding contract emails to personal accounts, repeated attempts to access areas outside job scope.',
      'Define your reporting procedure in writing: "If you observe suspicious behavior involving CUI or company systems, immediately notify [Owner Name] in person or at [phone/email]. Do not confront the individual yourself."',
      'Reference the free CISA Insider Threat resources (cisa.gov/insider-threat-mitigation) and the NITTF (National Insider Threat Task Force) awareness materials—both are free and DoD-aligned.',
      'Document that this topic was covered in the training sign-off sheet (add a checkbox: "Insider threat indicators and reporting procedures reviewed").',
    ],
    affordableTools: [
      'CISA Insider Threat Mitigation resources — free at cisa.gov/insider-threat-mitigation',
      'NITTF Awareness Training materials — free at dni.gov/index.php/ncsc-how-we-work/ncsc-nittf',
      'DoD Cyber Awareness Challenge — includes an insider threat module, free at public.cyber.mil',
      'Microsoft 365 Compliance Center — audit logs to detect unusual bulk file access or downloads (if on M365)',
      'Windows Event Viewer — monitor logon events and file access on local systems at no cost',
    ],
    evidenceRequired: [
      'Training materials showing an insider threat topic was explicitly covered',
      'Updated training sign-off sheet with insider threat acknowledgment checkbox',
      'Written reporting procedure for suspected insider threat incidents',
      'Evidence that all employees with CUI access attended the training',
    ],
    policyMapping: [
      'Insider Threat Program Policy',
      'CUI Security Awareness Policy',
      'Incident Response Policy',
    ],
    estimatedHours: 3,
    riskPriority: 'MEDIUM',
  },
];

// =============================================================================
// AUDIT & ACCOUNTABILITY (AU) — 9 Controls
// NIST SP 800-171 Rev 2  |  Section 3.3
// SPRS max deduction for family: -27
// =============================================================================

export const AU_CONTROLS: NISTControl[] = [
  {
    id: 'AU.2.001',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Create and Retain System Audit Logs',
    officialDescription:
      'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.',
    plainEnglish:
      'Your computers need to keep a diary of who logged in, when, what files were opened, and what changes were made—especially to anything touching CUI like contract drawings or specs. Windows does this automatically through Event Viewer and Microsoft 365 does it through the Unified Audit Log, but you have to turn it on and make sure the logs are kept long enough (at least 90 days online, 1 year archived is the DoD expectation). If you ever have a breach or an employee dispute, these logs are your only evidence of what actually happened.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are audit logs enabled on all systems that process, store, or transmit CUI, and are those logs retained for at least 90 days with evidence of the retention configuration?',
    remediationSteps: [
      'On every Windows workstation and server: open Group Policy (gpedit.msc) and navigate to Computer Configuration > Windows Settings > Security Settings > Advanced Audit Policy Configuration. Enable "Audit Logon Events," "Audit Object Access," "Audit Account Management," and "Audit Process Creation" for both Success and Failure.',
      'For Microsoft 365: go to the Microsoft Purview compliance portal (compliance.microsoft.com), select "Audit," and verify that audit logging is turned ON. M365 Business Premium retains audit logs for 90 days by default; E3/E5 retains for 1 year.',
      'Configure Windows Event Log retention: open Event Viewer > right-click "Security" log > Properties > set maximum log size to at least 1 GB and select "Archive the log when full, do not overwrite events."',
      'Set up a monthly task to export and archive Windows Security logs to a protected folder (e.g., \\\\server\\CMMC-Evidence\\AuditLogs\\YYYY-MM). Keep archives for at least 12 months.',
      'Document your log retention configuration with screenshots and store them in your CMMC evidence folder under "AU — Audit Logs."',
    ],
    affordableTools: [
      'Windows Event Viewer — built into every Windows OS, no cost',
      'Group Policy Editor (gpedit.msc) — built into Windows Pro/Enterprise, enables audit policy at no cost',
      'Microsoft 365 Unified Audit Log — included in M365 Business Basic and above',
      'Microsoft Purview Compliance Portal — audit search included in M365 Business Premium',
      'PowerShell (Export-EventLog cmdlet) — free, built-in tool for automating log exports',
    ],
    evidenceRequired: [
      'Screenshots of Group Policy audit settings showing which event categories are enabled',
      'Screenshot of Microsoft 365 audit log status showing it is enabled',
      'Windows Event Log retention settings (max size, archive policy) — screenshot from Event Viewer',
      'Sample exported audit log file demonstrating records are being captured',
      'Written log retention policy specifying minimum 90-day online and 1-year archive retention',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'System Security Plan (SSP)',
      'Configuration Management Plan',
    ],
    estimatedHours: 8,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'AU.2.002',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Ensure User Accountability Through Unique Identifiers',
    officialDescription:
      'Ensure that the actions of individual system users can be uniquely traced to those users so they can be held accountable for their actions.',
    plainEnglish:
      'Every person at your shop must have their own unique Windows login—no shared accounts like "shop_user" or "admin." When Event Viewer shows that someone deleted a file at 11 PM on a Friday, you need to know exactly which employee it was. Shared accounts make it impossible to hold anyone accountable and will cause an automatic CMMC failure. This also means each person logs out when they leave a machine—no leaving a session open for the next person.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does every individual who accesses systems containing CUI have a unique, personally assigned user account, with no shared credentials in use?',
    remediationSteps: [
      'Audit all current Windows accounts: open Computer Management > Local Users and Groups and list every account. Identify any shared or generic accounts (e.g., "admin," "shop," "machinist") and document who uses them.',
      'Create individual named accounts for every employee: format as firstname.lastname or first initial + last name (e.g., j.smith). Assign each person to appropriate groups (Users group for standard staff, Administrators only for IT-responsible personnel).',
      'Disable or delete all shared/generic accounts after migrating each person to their individual account. If a generic account is needed for a specific application, document the business justification and ensure it is not used for interactive login.',
      'Enforce account uniqueness with Group Policy: Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options > enable "Interactive logon: Do not display last user name" and configure screen lock after 15 minutes of inactivity.',
      'Document all current user accounts with an account inventory spreadsheet: columns for Account Name, Full Name, Role, Date Created, and Account Type (standard/admin).',
    ],
    affordableTools: [
      'Windows Computer Management (compmgmt.msc) — built-in, free user account management',
      'Active Directory Users and Computers — free with Windows Server, centralizes account management',
      'Group Policy Editor (gpedit.msc) — enforce account policies, screen lock, password requirements',
      'Microsoft 365 Admin Center — manage M365/Azure AD accounts centrally at admin.microsoft.com',
      'PowerShell (Get-LocalUser, Get-ADUser) — free audit scripts to enumerate all accounts',
    ],
    evidenceRequired: [
      'Account inventory spreadsheet listing all user accounts with assigned individual',
      'Screenshot from Computer Management or Active Directory showing only individually named accounts',
      'Documentation that shared/generic interactive accounts have been disabled',
      'Group Policy settings showing account lockout and session timeout policies',
      'Sample audit log entry demonstrating individual user attribution (e.g., logon event showing a specific username)',
    ],
    policyMapping: [
      'Account Management Policy',
      'Identification and Authentication Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 6,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'AU.2.003',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Review and Update Logged Events',
    officialDescription:
      'Review and update logged events.',
    plainEnglish:
      'The list of things your systems record in their logs should not be set once and forgotten. Once a year (or whenever your IT setup changes significantly—you add a new server, move to cloud storage, bring on a new contract), review whether you are logging the right events. A machine shop that just got its first file server needs different log settings than one that has been running a server for five years. Keep a written record of when you reviewed the log policy and what you decided.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented annual review of audit log configurations to verify that the correct events are being captured for all systems processing CUI, with records of those reviews retained?',
    remediationSteps: [
      'Create a one-page "Audit Event Review Checklist" that lists every system (workstations, servers, M365, network devices) and the events currently being logged for each.',
      'Once per year—schedule it alongside your annual security awareness training—walk through the checklist. Ask: Did we add new systems? Did we change how we store CUI? Are there new threat types (ransomware via email is common in machine shops) that need new log coverage?',
      'Update the audit policy in Group Policy or M365 to reflect any changes identified during the review.',
      'Document the review outcome in a simple memo: "Annual Audit Log Review — [Date] — Reviewer: [Name] — Finding: No changes needed / Changes made: [describe]." Sign and date it.',
      'File the memo in your CMMC evidence folder under "AU — Event Review."',
    ],
    affordableTools: [
      'Group Policy Editor (gpedit.msc) — modify audit policies after review, no cost',
      'Microsoft Purview Compliance Portal — review and update M365 audit settings',
      'Windows Event Viewer — verify events are being captured per updated policy',
      'Microsoft Word or Google Docs — for the annual review memo',
      'Outlook Calendar — annual recurring reminder for the review',
    ],
    evidenceRequired: [
      'Dated and signed annual audit event review memo or checklist',
      'Current audit policy configuration (screenshot) showing events being logged',
      'Record of any changes made to log settings as a result of the review',
      'Evidence that the review covers all systems processing CUI',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'System Security Plan (SSP)',
      'Configuration Management Plan',
    ],
    estimatedHours: 2,
    riskPriority: 'LOW',
  },

  {
    id: 'AU.2.004',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Alert on Audit Logging Process Failure',
    officialDescription:
      'Alert in the event of an audit logging process failure.',
    plainEnglish:
      'If your logging system breaks—the log file fills up, Windows stops recording events, or M365 audit gets accidentally turned off—you need to know about it right away, not three months later during an assessment. Set up a simple alert so that if logging stops or the log becomes full, someone gets an email or sees a Windows alert. Otherwise you could have a gap in your audit trail and not realize it.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there an automated or procedural mechanism in place to alert designated personnel when audit logging fails or audit logs reach capacity, with evidence of the alerting configuration?',
    remediationSteps: [
      'In Windows Event Viewer, configure the Security log to send an alert when it reaches a size threshold: right-click Security log > Properties > set the log size limit and choose "Archive the log when full." Then create a Windows Task Scheduler task that triggers on Event ID 1104 (Security audit log was cleared) and sends an email or creates a desktop notification.',
      'For Microsoft 365: go to Microsoft Purview Compliance Portal > Alerts > Create alert policy. Create a policy that fires if audit logging is disabled or if there is unusual activity. Route the alert to the owner or IT-responsible person.',
      'If you use a SIEM or log aggregator (even the free Wazuh), configure a rule that alerts when no new events are received from a monitored source for more than 24 hours—this catches silent failures.',
      'Test the alert annually: temporarily pause logging on a test machine, confirm the alert fires, then re-enable logging. Document the test result.',
      'Write a one-paragraph procedure describing what to do when an alert is received: who is notified, what they check, how quickly they must respond.',
    ],
    affordableTools: [
      'Windows Task Scheduler — built-in, free; triggers on Event IDs including audit failure events',
      'Windows Event Viewer — configure log size limits and archive behavior',
      'Microsoft Purview Alert Policies — included in M365 Business Premium, alerts on audit issues',
      'Wazuh SIEM — free, open-source; detects log source failures and gaps',
      'PowerShell + Send-MailMessage — free script to send email alerts on Windows event triggers',
    ],
    evidenceRequired: [
      'Screenshot of Windows Event Log size/archive configuration',
      'Screenshot or export of Task Scheduler task configured to alert on Event ID 1104 or log-full condition',
      'Microsoft Purview alert policy configuration screenshot (if using M365)',
      'Documentation of annual alert test with results',
      'Written procedure for responding to audit logging failure alerts',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'Incident Response Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 5,
    riskPriority: 'HIGH',
  },

  {
    id: 'AU.2.005',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Correlate Audit Review, Analysis, and Reporting',
    officialDescription:
      'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.',
    plainEnglish:
      'When something suspicious happens—a login at 2 AM, a huge file download, a failed access attempt—you should not be looking at five separate systems in five separate places. The goal here is to connect the dots between your Windows logs, your M365 logs, your firewall logs, and your physical access records so you can see the whole picture. For a small shop, this can be as simple as a weekly 10-minute review of all logs together using a free SIEM or a shared spreadsheet log, and a written process for how you would investigate if you found something alarming.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented process for correlating audit logs across multiple systems to investigate suspicious activity, and is there evidence of regular log reviews being performed?',
    remediationSteps: [
      'Define which log sources you have: Windows Event logs, Microsoft 365 Unified Audit Log, firewall logs (router syslog), physical access (door key log or badge swipe if applicable). List them in a one-page "Log Source Inventory."',
      'Establish a weekly log review procedure. Even a 10-minute weekly scan is sufficient for a small shop. The reviewer checks for: failed logins (Event ID 4625), after-hours access, large file transfers, and disabled accounts accessing systems. Document the review in a simple log review logbook (date, reviewer, findings, actions taken).',
      'Consider deploying Wazuh (free SIEM) on an inexpensive VM or spare PC. Wazuh can ingest Windows events, M365 logs via API, and network device syslog, then correlate them in a single dashboard with built-in correlation rules.',
      'For M365: use the Microsoft Purview Audit search to run cross-workload queries—search for a specific user across Exchange, SharePoint, and Teams simultaneously to correlate activity.',
      'Document a simple incident investigation procedure: "If unusual activity is found during log review, the reviewer will: (1) document the finding, (2) pull correlated logs from all relevant sources for the same time window, (3) escalate to [Owner Name] within 4 hours."',
    ],
    affordableTools: [
      'Wazuh SIEM — free, open-source; ingests Windows, Linux, M365, and network logs; built-in correlation',
      'Microsoft Purview Audit (Cross-Workload Search) — free in M365 Business Premium',
      'Windows Event Viewer — filter and search across multiple event categories',
      'Microsoft Sentinel — 90-day free trial; connects to M365 natively for cross-source correlation',
      'Microsoft Excel or Google Sheets — log review logbook for documenting weekly reviews',
    ],
    evidenceRequired: [
      'Log source inventory listing all systems generating audit records',
      'Completed log review logbook showing dated weekly reviews with reviewer name and findings',
      'Written procedure for correlating logs during an investigation',
      'Evidence of at least one example of cross-system log correlation (e.g., a sample query result or SIEM dashboard screenshot)',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'Incident Response Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 10,
    riskPriority: 'HIGH',
  },

  {
    id: 'AU.2.006',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Provide Audit Record Reduction and Report Generation',
    officialDescription:
      'Provide audit record reduction and report generation to support on-demand analysis and reporting.',
    plainEnglish:
      'Raw audit logs are overwhelming—a small Windows workstation can generate thousands of events per day. You need a way to filter, sort, and report on logs so you can answer questions like "Show me everything user john.smith did between March 1 and March 5" or "Show me all failed logins in the last 30 days" without wading through millions of lines. Windows Event Viewer has built-in filtering. Microsoft 365 has a search-and-export function. For a small shop these built-in tools are sufficient as long as you document how to use them.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented capability and procedure for filtering, searching, and generating reports from audit logs to support on-demand investigation, with evidence that personnel know how to use it?',
    remediationSteps: [
      'In Windows Event Viewer, practice creating a Custom View: Action > Create Custom View > filter by Event Level, Event Source, and Event ID. Save a custom view for "Failed Logons" (Event ID 4625) and another for "Account Management" (Event IDs 4720, 4722, 4725, 4726, 4728, 4732, 4756). Screenshot these saved views as evidence.',
      'In Microsoft Purview (compliance.microsoft.com > Audit), practice running and exporting an audit search: set date range, select user, select activities (e.g., "FileDownloaded"), export to CSV. Save one sample export as evidence.',
      'Document a one-page "Log Query Reference Card" showing the 5-6 most important searches your shop needs (failed logins, file access by a specific user, after-hours activity, bulk downloads) with step-by-step instructions for running each query.',
      'If using Wazuh, document the equivalent queries/dashboards and save screenshots of the built-in security overview dashboards.',
      'Test the process: have the IT-responsible person run a sample report on-demand and document the result. This demonstrates the capability is working and personnel know how to use it.',
    ],
    affordableTools: [
      'Windows Event Viewer Custom Views — built-in, filter and save complex event queries at no cost',
      'Microsoft Purview Audit Search and Export — included in M365 Business Premium, exports to CSV',
      'PowerShell (Get-WinEvent) — free, powerful cmdlet for scripted log queries and report generation',
      'Wazuh Dashboards — free SIEM with pre-built compliance reports and ad-hoc search',
      'Microsoft Excel — format and analyze CSV audit log exports for reporting',
    ],
    evidenceRequired: [
      'Screenshot of saved Windows Event Viewer custom views for key security events',
      'Sample Microsoft 365 audit log export (CSV) showing the export capability works',
      'Log Query Reference Card documenting standard queries and how to run them',
      'Evidence that the IT-responsible person has run at least one on-demand log report',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 4,
    riskPriority: 'LOW',
  },

  {
    id: 'AU.2.007',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Provide System Clock Capability for Audit Timestamps',
    officialDescription:
      'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.',
    plainEnglish:
      'If your computer clock is 20 minutes off, your audit logs become useless for investigations because you cannot line up events across different systems. Windows Time (W32tm) can automatically sync your computers to NIST time servers or Microsoft time servers for free. This is a 5-minute configuration change, but many small shops never do it deliberately—their computers drift. This control simply requires you to configure NTP time sync on every system and document that it is working.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are all systems that generate audit records configured to synchronize their clocks to an authoritative NTP time source (e.g., time.nist.gov or time.windows.com), and is there evidence this synchronization is active?',
    remediationSteps: [
      'On every Windows workstation and server, verify NTP sync: open Command Prompt as Administrator and run "w32tm /query /status". The output should show a time source (e.g., time.windows.com or time.nist.gov) and a Last Successful Sync Time.',
      'If NTP is not configured or syncing to a reliable source, set it: run "w32tm /config /manualpeerlist:time.nist.gov /syncfromflags:manual /reliable:YES /update" followed by "net stop w32tm && net start w32tm && w32tm /resync".',
      'In a domain environment (Active Directory), configure the PDC Emulator domain controller to sync with an external NTP source; all domain members will automatically sync from it. Use Group Policy: Computer Configuration > Administrative Templates > System > Windows Time Service.',
      'Verify network devices (firewall/router) are also NTP-synchronized. Most consumer-grade routers support NTP in their admin panel—set the NTP server to time.nist.gov.',
      'Document the NTP configuration with a screenshot of "w32tm /query /status" output from each system showing it is actively synced, and store in your CMMC evidence folder under "AU — Time Synchronization."',
    ],
    affordableTools: [
      'Windows Time Service (W32tm) — built into every Windows OS, free NTP synchronization',
      'Group Policy Editor — enforce NTP settings across all domain-joined machines, no cost',
      'time.nist.gov — free authoritative NTP server operated by NIST',
      'time.windows.com — free Microsoft NTP server, reliable alternative',
      'Command Prompt (w32tm /query /status) — built-in verification command',
    ],
    evidenceRequired: [
      'Output of "w32tm /query /status" from each system showing active NTP sync and time source',
      'Group Policy or local policy configuration showing NTP server settings',
      'Screenshot of network device (router/firewall) NTP configuration',
      'Written procedure for checking NTP sync as part of regular maintenance',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'System Security Plan (SSP)',
      'Configuration Management Plan',
    ],
    estimatedHours: 2,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'AU.2.008',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Protect Audit Information and Tools from Unauthorized Access',
    officialDescription:
      'Protect audit information and audit tools from unauthorized access, modification, and deletion.',
    plainEnglish:
      'Your audit logs are only useful as evidence if someone cannot tamper with them. An attacker who gets into your system will try to delete the logs that prove they were there. You need to store logs somewhere that standard user accounts—and even most admin accounts—cannot delete or modify. This means restricting who can clear the Windows Security log, setting NTFS permissions on archived log files, and making sure M365 audit logs cannot be turned off without an alert being triggered. For extra protection, consider sending logs to a separate system where they cannot be edited.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are audit logs and audit tools protected from unauthorized modification or deletion through access controls and permissions, with evidence that only authorized personnel can manage audit settings?',
    remediationSteps: [
      'Restrict who can clear Windows Security logs: in Group Policy navigate to Computer Configuration > Windows Settings > Security Settings > Local Policies > User Rights Assignment > "Manage auditing and security log." Ensure only the designated IT administrator account is listed here—remove standard users.',
      'Protect archived log files with NTFS permissions: navigate to the archive folder (e.g., \\\\server\\CMMC-Evidence\\AuditLogs), right-click > Properties > Security. Grant Read access to your IT admin account only. Remove write/delete permissions for standard users. Enable auditing on the folder itself so any access is logged.',
      'For Microsoft 365: assign the Audit Reader role only to individuals who need to review logs (compliance.microsoft.com > Roles). Use Privileged Identity Management (PIM) if on E5 to require justification for elevated access.',
      'Consider forwarding Windows event logs to a Wazuh SIEM instance on a separate machine with its own credentials. Once logs are forwarded, they are protected even if the source machine is compromised.',
      'Document the access control configuration in a one-page "Audit Log Protection Summary": who has access, what access level, and how it was configured. Store screenshots of the NTFS permissions and Group Policy settings as evidence.',
    ],
    affordableTools: [
      'Windows NTFS Permissions — built-in, restrict read/write/delete on audit log folders',
      'Group Policy Editor — restrict "Manage auditing and security log" user right to specific accounts',
      'Microsoft Purview Role Management — control who can access and export audit logs in M365',
      'Wazuh SIEM — free; collect and store logs on a separate protected system',
      'Windows File Auditing — enable object access auditing on the log folder to detect tampering attempts',
    ],
    evidenceRequired: [
      'Group Policy configuration showing only authorized accounts have "Manage auditing and security log" right',
      'NTFS permissions screenshot for the audit log archive folder showing restricted access',
      'Microsoft 365 role assignments showing only designated personnel have Audit Reader/Manager roles',
      'Written "Audit Log Protection Summary" documenting the access control design',
      'Evidence of regular review that log permissions have not been changed',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'Access Control Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 6,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'AU.2.009',
    family: 'AU',
    familyName: 'Audit & Accountability',
    title: 'Limit Audit Log Management to Privileged Users',
    officialDescription:
      'Limit management of audit logging to a subset of privileged users.',
    plainEnglish:
      'Only the person specifically responsible for IT security should be able to change what gets logged, clear logs, or adjust audit settings. Not every person with an admin account should have this power—in fact, in a small shop you should have only one person (or at most two, for backup) who can touch audit configuration. This prevents an insider threat scenario where someone disables logging before doing something they should not. This control overlaps with AU.2.008 but focuses on limiting who can change the logging configuration itself rather than just who can read logs.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is the ability to modify audit logging configuration restricted to a named subset of privileged users, documented by policy and enforced by technical controls?',
    remediationSteps: [
      'Create a dedicated "Audit Administrator" role or use an existing minimal-privilege admin account. This account—not the general IT admin account used for daily tasks—should be the only account with rights to modify audit policy.',
      'In Group Policy (Computer Configuration > Windows Settings > Security Settings > Local Policies > User Rights Assignment), ensure only the designated Audit Administrator account appears in "Manage auditing and security log." Document the account name and the person responsible.',
      'For Microsoft 365, assign the "Audit Manager" or "Compliance Administrator" role only to the designated individual. Audit this role assignment quarterly to ensure it has not been expanded.',
      'Write a one-paragraph policy addendum specifying: "Only [Name/Role] is authorized to modify audit logging settings, clear audit logs, or change log retention configuration. Any such change must be documented in the Change Management Log with justification and date."',
      'Enable monitoring of audit policy changes: Event ID 4719 (System audit policy was changed) and 4817 (Auditing settings on object were changed) will fire in Windows if audit settings are modified. Ensure these events are themselves captured in your logs.',
    ],
    affordableTools: [
      'Group Policy Editor — assign and restrict "Manage auditing and security log" user right',
      'Microsoft 365 Admin Center — assign and audit Compliance/Audit Administrator roles',
      'Windows Event Viewer — Event ID 4719 alerts on audit policy changes',
      'Active Directory (if in use) — role separation and privileged account management',
      'Microsoft Word — document the policy addendum specifying authorized roles',
    ],
    evidenceRequired: [
      'Group Policy configuration showing only one or two named accounts have audit management rights',
      'Microsoft 365 role assignment showing the Audit Manager role is limited to named individuals',
      'Written policy naming who is authorized to manage audit logging',
      'Change log entry for any time audit settings were modified, showing justification and approver',
      'Evidence that Event ID 4719 is being captured (screenshot of the event in logs)',
    ],
    policyMapping: [
      'Audit Logging and Monitoring Policy',
      'Account Management Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 3,
    riskPriority: 'HIGH',
  },
];

// =============================================================================
// CONFIGURATION MANAGEMENT (CM) — 9 Controls
// NIST SP 800-171 Rev 2  |  Section 3.4
// SPRS max deduction for family: -27
// =============================================================================

export const CM_CONTROLS: NISTControl[] = [
  {
    id: 'CM.2.001',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Establish and Maintain Baseline Configurations',
    officialDescription:
      'Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.',
    plainEnglish:
      'Write down—and keep current—a list of every computer, server, router, and piece of software in your shop. For each machine, document what operating system and version it runs, what software is installed, and how it is configured for security (e.g., firewall on, BitLocker enabled, specific Group Policy settings). This "baseline" is your reference point: if something changes unexpectedly, you can detect it. For an 8-person shop this might be a spreadsheet and a Word document. Think of it as the build sheet for your CNC machines, but for your IT.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented and maintained baseline configuration and hardware/software inventory for all systems that process, store, or transmit CUI, updated within the past 12 months?',
    remediationSteps: [
      'Create a Hardware Inventory spreadsheet with columns: Device Name, Device Type, Make/Model, Serial Number, Operating System + Version, Location, Primary User, Date Added. List every computer, laptop, server, network device, and printer that touches your network.',
      'Create a Software Inventory spreadsheet with columns: Software Name, Version, License Key/Type, Installed On (device name), Business Purpose, Vendor. Walk through each device with "Apps & Features" (Windows Settings) to populate this.',
      'Document a Baseline Configuration document for each device type. For your standard Windows workstation this means: OS version + patch level, enabled Windows features, installed software list, Group Policy settings (password policy, screen lock, firewall), BitLocker status, and antivirus product and version.',
      'Use the free Microsoft Security Compliance Toolkit (download from Microsoft) to generate and export a baseline Group Policy configuration. This creates an exportable, auditable record of your security settings.',
      'Schedule a quarterly review to update the inventories when equipment is added or removed. Store all documents in your CMMC evidence folder under "CM — Baseline Configuration."',
    ],
    affordableTools: [
      'Microsoft Security Compliance Toolkit — free download from Microsoft; generates exportable baseline GPO reports',
      'Windows Settings > Apps & Features — enumerate installed software on each machine',
      'Belarc Advisor — free tool that generates a detailed hardware/software inventory report per machine',
      'Microsoft Excel or Google Sheets — maintain hardware and software inventory spreadsheets',
      'PowerShell (Get-ComputerInfo, Get-InstalledModule) — free scripts to automate inventory collection',
    ],
    evidenceRequired: [
      'Hardware inventory spreadsheet showing all devices with OS versions and serial numbers',
      'Software inventory spreadsheet showing all installed applications across all systems',
      'Baseline configuration document(s) showing security settings for each device type',
      'Date stamp showing inventories were updated within the past 12 months',
      'Group Policy or Microsoft Security Compliance Toolkit export of security baseline settings',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Configuration Management Plan (CMP)',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 12,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'CM.2.002',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Establish and Enforce Security Configuration Settings',
    officialDescription:
      'Establish and enforce security configuration settings for information technology products employed in organizational systems.',
    plainEnglish:
      'It is not enough to list your configurations—you have to actually apply secure settings and enforce them. The CIS Benchmarks (free downloads from cisecurity.org) give you a specific, prescriptive list of settings for Windows 10/11, Windows Server, and Microsoft 365. Apply these settings via Group Policy and document which benchmarks you used. For a machine shop, the most critical settings are: auto-lock screen after inactivity, require password complexity, disable USB autorun, enable Windows Defender, and require BitLocker on laptops.',
    sprsDeduction: -5,
    cmmcLevel: 2,
    assessmentQuestion:
      'Have security configuration settings been applied to all systems based on an industry-recognized security benchmark (e.g., CIS Benchmarks or DISA STIGs), with documentation of which benchmark was used and evidence of the settings being enforced?',
    remediationSteps: [
      'Download the free CIS Benchmark for Windows 10 or Windows 11 from cisecurity.org/cis-benchmarks. Also download the CIS Microsoft 365 Foundations Benchmark if you use M365. These are detailed PDFs listing every recommended security setting.',
      'Work through the "Level 1" recommendations (the minimum baseline). Use Group Policy to apply settings: Computer Configuration > Windows Settings > Security Settings. Key settings to prioritize: password minimum length 14 characters, account lockout after 5 attempts, screen lock after 15 minutes, Windows Defender enabled and updated, Windows Firewall enabled for all profiles, USB autorun disabled.',
      'For Microsoft 365, use the Microsoft Secure Score dashboard (security.microsoft.com) as your benchmark enforcement tool. It shows your current score, what you have not configured, and provides one-click remediation for many settings.',
      'Document which benchmark you used, the date applied, and who applied it. Create a "Configuration Benchmark Compliance Checklist" by copying the CIS Level 1 items relevant to your systems and marking each as Compliant / Non-Compliant / Compensating Control.',
      'Run the free CIS-CAT Lite tool (available at cisecurity.org/cybersecurity-tools/cis-cat-lite) against your workstations to generate an automated compliance report against the CIS Benchmark. This is excellent assessment evidence.',
    ],
    affordableTools: [
      'CIS Benchmarks — free PDF downloads at cisecurity.org/cis-benchmarks for Windows, M365, and more',
      'CIS-CAT Lite — free automated benchmark assessment tool from cisecurity.org',
      'Group Policy Editor (gpedit.msc) — apply and enforce security settings at no cost',
      'Microsoft Secure Score — free in M365, benchmarks and remediates M365 security settings',
      'Microsoft Security Compliance Toolkit — free GPO templates pre-aligned to security baselines',
    ],
    evidenceRequired: [
      'Identification of the security benchmark used (e.g., CIS Windows 11 Benchmark Level 1, version and date)',
      'Configuration benchmark compliance checklist showing each control item as compliant or non-compliant with justification',
      'Group Policy settings export or screenshot demonstrating key settings are enforced',
      'CIS-CAT Lite report or Microsoft Secure Score screenshot showing benchmark compliance percentage',
      'Documentation of any deviations from the benchmark with compensating controls described',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Configuration Management Plan (CMP)',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 16,
    riskPriority: 'CRITICAL',
  },

  {
    id: 'CM.2.003',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Track, Review, Approve, and Log Changes to Systems',
    officialDescription:
      'Track, review, approve, and log changes to organizational systems.',
    plainEnglish:
      'Every significant change to your IT systems—installing new software, adding a user account, changing firewall rules, plugging in a new piece of equipment—should go through a simple approval process and be documented. This does not need to be a formal IT change management system with tickets; for an 8-person shop a shared change log in a spreadsheet works fine. The goal is that if something breaks, or if an assessor asks "why was this software installed?"—you have an answer. No undocumented shadow IT.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a documented change management process requiring approval before significant system changes are made, and is a change log maintained showing what was changed, when, by whom, and why?',
    remediationSteps: [
      'Create a Change Log spreadsheet with columns: Change ID, Date Requested, Requester, System Affected, Description of Change, Business Justification, Approver, Approval Date, Implementation Date, Implemented By, and Result/Notes.',
      'Define what constitutes a "significant change" requiring a log entry: installing or removing software, adding or removing user accounts, changing firewall or network settings, adding new hardware, applying major software updates (OS upgrades), and changing Group Policy.',
      'Establish a simple approval process: any change to a system handling CUI must be approved by the owner or designated IT manager before implementation. Document the approval in the Change Log (even if it is just an email reply, paste the email reference number).',
      'Configure Windows to help you track changes automatically: ensure Event ID 4688 (Process Creation) is logged so new software executions appear in audit logs. Enable Software Restriction Policy logging or AppLocker event log to capture software installation attempts.',
      'Review the change log monthly for completeness and accuracy. At the annual configuration review, verify that all changes in the log are reflected in the updated baseline configuration document.',
    ],
    affordableTools: [
      'Microsoft Excel or Google Sheets — maintain the change log spreadsheet',
      'Microsoft 365 SharePoint — host the change log so it is accessible and version-controlled',
      'Windows Event Viewer (Event ID 4688) — automatic log of new process creation to catch undocumented changes',
      'AppLocker Event Log — logs software execution attempts, helps identify undocumented installs',
      'Email (Outlook) — change approval trail; paste approval email references into the change log',
    ],
    evidenceRequired: [
      'Change log spreadsheet showing recent entries with required fields (who, what, when, why, approval)',
      'Written change management procedure defining what requires a change request and approval',
      'Evidence of approvals (email excerpts, signatures, or digital approvals in the log)',
      'At least one example of a rejected or deferred change showing the process was followed',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Configuration Management Plan (CMP)',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },

  {
    id: 'CM.2.004',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Analyze Security Impact of Changes Prior to Implementation',
    officialDescription:
      'Analyze the security impact of changes prior to implementation.',
    plainEnglish:
      'Before you install that new quoting software, plug in that used laptop from eBay, or let an IT vendor remote into your server, someone needs to take 5 minutes to think through the security implications. Could this software introduce malware? Does it require opening firewall ports? Will it have access to your CUI folders? For a small shop, this does not need to be a formal risk assessment—a brief written "security impact analysis" in your change log entry is sufficient.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Does the change management process include a documented security impact analysis step that must be completed before implementing changes to systems that process CUI?',
    remediationSteps: [
      'Add a "Security Impact" column to your existing Change Log spreadsheet. Before approving any change, the approver must fill in this column with a brief assessment: "Low — standard patch update, no new attack surface" or "Medium — new software installed, requires firewall rule, tested in isolation first" or "High — new vendor access, requires monitoring, limited to specific files."',
      'Create a simple Security Impact Analysis checklist (5 questions on a single page): (1) Does this change open new network ports or change firewall rules? (2) Does this change grant new access to CUI? (3) Does this software come from a trusted/vetted vendor? (4) Could this change break existing security controls (antivirus, audit logging)? (5) Does this require vendor/third-party access?',
      'For any change rated Medium or High, require the checklist to be completed and filed with the change record before work begins. Low-impact changes (monthly Windows updates, password resets) can use a simplified one-line entry.',
      'For vendor access specifically: require a Non-Disclosure Agreement (NDA) on file, supervise the session, and review audit logs after the session ends. Document this in the change record.',
      'Train your IT-responsible person to ask these questions habitually before touching any system configuration.',
    ],
    affordableTools: [
      'Microsoft Excel or Google Sheets — add the security impact column to existing change log',
      'Microsoft Word — one-page security impact checklist template',
      'Windows Event Viewer — review logs after any vendor access session to verify scope',
      'Microsoft 365 SharePoint — store completed checklists alongside change records',
      'Remote Desktop audit logging — capture vendor remote sessions via Windows built-in RDP logging',
    ],
    evidenceRequired: [
      'Change log entries showing a security impact assessment was recorded before each significant change',
      'Completed security impact checklist for at least 3 recent changes (one high-impact example preferred)',
      'Written procedure specifying that security impact analysis is required before implementing changes',
      'Evidence that at least one change was modified or deferred based on the security impact analysis',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Configuration Management Plan (CMP)',
      'Risk Assessment Policy',
    ],
    estimatedHours: 3,
    riskPriority: 'LOW',
  },

  {
    id: 'CM.2.005',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Define and Enforce Access Restrictions for Configuration Changes',
    officialDescription:
      'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.',
    plainEnglish:
      'Only specific, authorized people should be able to make configuration changes to your IT systems. The machinist running a job should not be able to install software, change firewall settings, or add new user accounts—even if they have good intentions. Enforce this with standard (non-admin) user accounts for regular employees, and a separate privileged admin account for IT tasks. The admin account should not be used for everyday work like email and web browsing—only for deliberate administrative actions.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are access rights to make configuration changes to systems restricted to designated authorized personnel through both technical controls (non-admin standard accounts for regular users) and documented procedures?',
    remediationSteps: [
      'Audit all Windows accounts and their group memberships: open Computer Management > Local Users and Groups > Groups > Administrators. Confirm that only the IT-responsible person(s) account is in the Administrators group. Remove all regular employees from the Administrators group.',
      'Create a separate admin account for IT tasks (e.g., "admin.jsmith") that is different from the daily-use account (e.g., "jsmith"). The daily-use account should be a standard user. IT personnel use their standard account for email and browsing, and the admin account only when making system changes.',
      'Use Group Policy to prevent standard users from installing software: Computer Configuration > Administrative Templates > Windows Components > Windows Installer > set "Prohibit non-administrators from applying vendor signed updates" and "Prevent users from installing printer drivers" as appropriate.',
      'For Microsoft 365: ensure only Global Administrators and designated admin roles can change tenant settings. Use the Principle of Least Privilege in the M365 Admin Center—assign the minimum role needed (e.g., User Administrator instead of Global Admin for user management tasks).',
      'Document the access restriction policy: "System configuration changes may only be performed by [Name/Role]. Standard user accounts do not have local administrator rights. Admin accounts are used only for administrative tasks and not for daily computing activities."',
    ],
    affordableTools: [
      'Windows Computer Management — manage local group memberships at no cost',
      'Group Policy Editor — enforce software installation restrictions for standard users',
      'Active Directory Users and Computers — manage domain account privileges centrally',
      'Microsoft 365 Admin Center — assign minimal necessary admin roles',
      'Microsoft LAPS (Local Administrator Password Solution) — free tool to manage and rotate local admin passwords',
    ],
    evidenceRequired: [
      'Screenshot of Windows Administrators group showing only authorized IT accounts are members',
      'Account inventory showing regular employees have standard (non-admin) accounts',
      'Group Policy settings restricting software installation to administrators only',
      'Microsoft 365 admin role assignments showing minimal privilege principle applied',
      'Written policy specifying who is authorized to make configuration changes',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Access Control Policy',
      'Account Management Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 5,
    riskPriority: 'HIGH',
  },

  {
    id: 'CM.2.006',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Employ Principle of Least Functionality',
    officialDescription:
      'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.',
    plainEnglish:
      'Your work computers should only be able to do what they need to do for the job. A workstation used by machinists to access job orders and drawings does not need Bluetooth enabled, does not need a web browser that can access any website, does not need games, and should not have file-sharing features turned on. Disable or remove everything that is not needed for the business. Fewer features means fewer ways for attackers to get in. This is the IT equivalent of not leaving tools lying around where they do not belong.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Have systems been configured to disable or remove unnecessary features, ports, protocols, and services not required for business operations, with documentation of what was disabled and why?',
    remediationSteps: [
      'Run the free CIS-CAT Lite tool or manually work through the CIS Benchmark to identify unnecessary Windows features and services. Common items to disable in a machine shop environment: Bluetooth (if not needed), infrared ports, SNMP service, Telnet client, FTP client, Remote Desktop (if not used for IT management), and Windows Media Player.',
      'Use Windows Programs and Features (Control Panel > Programs > Turn Windows Features On or Off) to remove unused Windows components. Document what was removed and the business rationale.',
      'Disable unnecessary Windows services: open services.msc and set services like "Routing and Remote Access," "Print Spooler" (on non-print workstations), "Remote Registry," and "Xbox Live" services to Disabled. Document each change in your change log.',
      'Use Group Policy to restrict access to control panel features that standard users do not need: User Configuration > Administrative Templates > Control Panel.',
      'Create a "Least Functionality Baseline" document listing every disabled feature, service, and port across your standard workstation configuration. Update this whenever the baseline is changed. This document directly satisfies assessor requests for evidence.',
    ],
    affordableTools: [
      'CIS-CAT Lite — free tool to identify unnecessary/insecure features against the CIS Benchmark',
      'Windows Services Manager (services.msc) — disable unnecessary services at no cost',
      'Group Policy Editor — restrict access to features and control panel items for standard users',
      'Windows Features (optionalfeatures.exe) — remove unused Windows components',
      'PowerShell (Get-Service, Set-Service) — automate service hardening across multiple machines',
    ],
    evidenceRequired: [
      '"Least Functionality Baseline" document listing disabled features, services, and ports',
      'Change log entries documenting each feature/service disabled and business justification',
      'Screenshot of Windows Services showing unnecessary services are Disabled',
      'Windows Features screenshot showing unused components are removed',
      'CIS-CAT Lite report or equivalent showing compliance with hardening benchmark',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Configuration Management Plan (CMP)',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 8,
    riskPriority: 'HIGH',
  },

  {
    id: 'CM.2.007',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Restrict, Disable, or Prevent Use of Nonessential Programs',
    officialDescription:
      'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.',
    plainEnglish:
      'This is the operational enforcement of the previous control—not just disabling things during setup, but actively preventing people from turning them back on or installing new nonessential programs over time. Use Windows AppLocker or Software Restriction Policies to create a whitelist of approved programs. If it is not on the list, Windows blocks it from running. For a machine shop this is very practical: your machinists should only be running your CAM software, your ERP, Microsoft Office, and a web browser—not unapproved software downloaded from the internet.',
    sprsDeduction: -1,
    cmmcLevel: 2,
    assessmentQuestion:
      'Are there technical controls in place (such as application whitelisting or software restriction policies) that prevent users from running unauthorized or nonessential programs on systems that process CUI?',
    remediationSteps: [
      'Evaluate AppLocker (available on Windows 10/11 Enterprise and Education, and Windows Server) as your application whitelisting solution. If on Windows 10/11 Pro, use Software Restriction Policies (SRP) in Group Policy as a free alternative.',
      'Create an inventory of approved applications for each device type: standard workstation (CAM software, ERP/job management, Microsoft Office, approved browser), administrative workstation (same plus accounting software), IT admin workstation (same plus admin tools). This becomes your whitelist.',
      'Configure AppLocker or SRP: use the "Executable Rules" to allow only listed programs and block everything else. Start in "Audit Only" mode for 2 weeks to see what would be blocked (review AppLocker event log at Applications and Services Logs > Microsoft > Windows > AppLocker). Then switch to enforcement mode.',
      'Block known high-risk file types at the email gateway and web filter level: .exe, .bat, .ps1, .vbs attachments in email; downloads from software distribution sites. Microsoft 365 Defender (included in M365 Business Premium) can block malicious attachments automatically.',
      'Document the approved software list and the AppLocker/SRP configuration. Update the whitelist via the change management process (CM.2.003) whenever new approved software is added.',
    ],
    affordableTools: [
      'Windows AppLocker — built into Windows 10/11 Enterprise; application whitelisting at no additional cost',
      'Software Restriction Policies (SRP) — built into all Windows Pro versions via Group Policy, free alternative to AppLocker',
      'Microsoft 365 Defender — included in M365 Business Premium; blocks malicious attachments and downloads',
      'AppLocker Event Log — built-in; audit mode shows what would be blocked before enforcing',
      'PowerShell (Get-AppLockerPolicy) — export and document current AppLocker rules',
    ],
    evidenceRequired: [
      'Approved software inventory (whitelist) for each device type',
      'AppLocker or SRP policy export/screenshot showing enforcement configuration',
      'AppLocker event log excerpt showing the policy is active and blocking unauthorized programs',
      'Written procedure for adding new approved software through the change management process',
      'Evidence that audit mode was run before enforcement to prevent business disruption',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Acceptable Use Policy (AUP)',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 10,
    riskPriority: 'MEDIUM',
  },

  {
    id: 'CM.2.008',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Apply Deny-by-Exception Policy to Prevent Use of Unauthorized Software',
    officialDescription:
      'Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.',
    plainEnglish:
      'This is the formal policy underpinning CM.2.007. You need a written policy that explicitly states your approach: either (a) block specific known bad software and allow everything else (blacklisting—easier to start with), or (b) only allow specifically approved software and block everything else (whitelisting—more secure, recommended by DoD). Most small shops start with blacklisting and then move to whitelisting. Document which approach you use, why, and how it is enforced. Assessors want to see the policy document, not just the technical control.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a written software use policy that explicitly adopts either a deny-by-exception (blacklist) or deny-all-permit-by-exception (whitelist) approach, and is this policy enforced by technical controls with evidence of both?',
    remediationSteps: [
      'Write a one-page "Software Use Policy" that states: (a) the approach taken (blacklist or whitelist), (b) the list of prohibited software categories (peer-to-peer file sharing, torrent clients, unapproved remote access tools, cryptocurrency mining software, games), (c) the list of approved software (if whitelist approach), and (d) the consequences of violating the policy.',
      'For a blacklist approach: use Windows Defender Application Control (WDAC) or Group Policy > Software Restriction Policies to block specific known-bad applications by hash, certificate, or path. Maintain a "Prohibited Software List" updated when new threats are identified (reference CISA Known Exploited Vulnerabilities catalog at cisa.gov/known-exploited-vulnerabilities-catalog).',
      'For a whitelist approach (recommended): use AppLocker or WDAC configured in "deny-all, permit-by-exception" mode as described in CM.2.007. The approved software inventory from CM.2.007 becomes your permit list.',
      'Align the written policy with your technical enforcement: if your Group Policy enforces a whitelist, your written policy should say "deny-all, permit-by-exception." Assessors will verify that the policy and technical controls are consistent.',
      'Review and update the software use policy annually or when new contract requirements are received. Document the review with a date and signature.',
    ],
    affordableTools: [
      'Windows Defender Application Control (WDAC) — built-in Windows 10/11 feature for application control',
      'AppLocker — built-in Windows Enterprise feature for application whitelisting',
      'Group Policy Software Restriction Policies — built-in Windows Pro for basic blacklisting',
      'CISA Known Exploited Vulnerabilities catalog — free reference for blacklisted software/vulnerabilities',
      'Microsoft Word — author the Software Use Policy document',
    ],
    evidenceRequired: [
      'Written Software Use Policy specifying blacklist or whitelist approach, prohibited software categories, and enforcement mechanism',
      'Technical control configuration (WDAC, AppLocker, or SRP policy export) consistent with the written policy',
      'Evidence of policy review date and approver signature',
      'Prohibited software list (if blacklist approach) or approved software list (if whitelist approach)',
      'Evidence that the policy has been communicated to all users (e.g., included in annual awareness training)',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Acceptable Use Policy (AUP)',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 6,
    riskPriority: 'HIGH',
  },

  {
    id: 'CM.2.009',
    family: 'CM',
    familyName: 'Configuration Management',
    title: 'Control and Monitor User-Installed Software',
    officialDescription:
      'Control and monitor user-installed software.',
    plainEnglish:
      'Even with the best policies, employees sometimes find ways to install software you did not approve—a browser extension, a PDF converter from a sketchy website, a remote access tool a vendor emailed them. You need both a technical control that prevents or alerts on unauthorized installs, AND a monitoring process where someone periodically checks what is actually installed across all machines against your approved software list. For an 8-person shop, a monthly 10-minute spot check of installed programs on each machine plus Event Viewer logs is sufficient.',
    sprsDeduction: -3,
    cmmcLevel: 2,
    assessmentQuestion:
      'Is there a process in place to both technically control user-installed software and to periodically monitor systems to detect unauthorized software that may have been installed, with records of monitoring reviews?',
    remediationSteps: [
      'Technical prevention: ensure all regular employee accounts are standard (non-admin) users—this is your first line of defense because standard users cannot install most software without administrator credentials. Verify this is in place per CM.2.005.',
      'Configure Windows Event Auditing to capture software installation events: Event IDs 11707 (product installed), 11724 (product removed), and 1033/1034 (Windows Installer). Enable these by auditing Application log entries. This creates an automatic record of installation attempts.',
      'Create a monthly "Software Spot Check" procedure: on the first Monday of each month, the IT-responsible person uses Programs and Features (or PowerShell: Get-WmiObject -Class Win32_Product) on at least 2-3 randomly selected machines to compare installed software against the approved software list. Document the check in a log: date, machines checked, findings, actions taken.',
      'For Microsoft 365 environments: use Microsoft Intune (included in M365 Business Premium) to deploy and enforce approved app lists on managed devices. Intune can block sideloaded apps and report on installed software inventory automatically.',
      'If unauthorized software is found: document it in the change log, remove it immediately, investigate how it was installed (check Event ID 4688 process creation logs), and retrain or counsel the employee involved.',
    ],
    affordableTools: [
      'Windows Programs and Features — built-in; list all installed software per machine',
      'PowerShell (Get-WmiObject Win32_Product) — free script to export installed software list for comparison',
      'Windows Event Viewer — Event IDs 11707/11724 log software installations and removals',
      'Microsoft Intune — included in M365 Business Premium; automated device and app management',
      'Belarc Advisor — free tool to generate full software inventory reports per machine for monthly checks',
    ],
    evidenceRequired: [
      'Monthly software spot-check log showing dates, machines checked, reviewer, and findings',
      'Approved software list used as the baseline for comparison during spot checks',
      'Windows Event Log excerpt showing software installation events are being captured',
      'Evidence that standard users cannot self-install software (account type screenshots)',
      'At least one documented example of unauthorized software being found, removed, and investigated',
    ],
    policyMapping: [
      'Configuration Management Policy',
      'Acceptable Use Policy (AUP)',
      'Software Use Policy',
      'System Security Plan (SSP)',
    ],
    estimatedHours: 5,
    riskPriority: 'HIGH',
  },
];
