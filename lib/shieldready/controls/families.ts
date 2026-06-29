import { ControlFamilyMeta } from '../types';

export const CONTROL_FAMILIES: ControlFamilyMeta[] = [
  { code: 'AC', name: 'Access Control', description: 'Limit system access to authorized users, processes, and devices', controlCount: 22, maxDeduction: 54 },
  { code: 'AT', name: 'Awareness & Training', description: 'Ensure personnel are aware of security risks and trained in policies', controlCount: 3, maxDeduction: 9 },
  { code: 'AU', name: 'Audit & Accountability', description: 'Create, protect, and retain system audit records', controlCount: 9, maxDeduction: 27 },
  { code: 'CM', name: 'Configuration Management', description: 'Establish and maintain baseline configurations and inventories', controlCount: 9, maxDeduction: 27 },
  { code: 'IA', name: 'Identification & Authentication', description: 'Identify and authenticate users, processes, and devices', controlCount: 11, maxDeduction: 29 },
  { code: 'IR', name: 'Incident Response', description: 'Establish operational incident-handling capability', controlCount: 3, maxDeduction: 9 },
  { code: 'MA', name: 'Maintenance', description: 'Perform timely maintenance on organizational systems', controlCount: 6, maxDeduction: 18 },
  { code: 'MP', name: 'Media Protection', description: 'Protect, sanitize, and destroy media containing CUI', controlCount: 9, maxDeduction: 15 },
  { code: 'PS', name: 'Personnel Security', description: 'Screen individuals and protect CUI during personnel actions', controlCount: 2, maxDeduction: 6 },
  { code: 'PE', name: 'Physical Protection', description: 'Limit physical access to systems and protect physical plant', controlCount: 6, maxDeduction: 18 },
  { code: 'RA', name: 'Risk Assessment', description: 'Periodically assess risk to operations, assets, and individuals', controlCount: 3, maxDeduction: 9 },
  { code: 'CA', name: 'Security Assessment', description: 'Assess, monitor, and correct deficiencies in security controls', controlCount: 4, maxDeduction: 12 },
  { code: 'SC', name: 'System & Communications Protection', description: 'Monitor, control, and protect communications at boundaries', controlCount: 16, maxDeduction: 40 },
  { code: 'SI', name: 'System & Information Integrity', description: 'Identify, report, and correct system flaws in a timely manner', controlCount: 7, maxDeduction: 21 },
];
