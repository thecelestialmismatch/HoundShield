// Kaelus CMMC Core Types

export type ControlFamily =
  | 'AC' | 'AT' | 'AU' | 'CM' | 'IA'
  | 'IR' | 'MA' | 'MP' | 'PS' | 'PE'
  | 'RA' | 'CA' | 'SC' | 'SI';

export type ControlStatus = 'MET' | 'PARTIAL' | 'UNMET' | 'NOT_ASSESSED';
export type CMMCLevel = 1 | 2;
export type RiskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface NISTControl {
  id: string;                    // e.g. "AC.1.001"
  family: ControlFamily;
  familyName: string;            // e.g. "Access Control"
  title: string;                 // Short title
  officialDescription: string;   // NIST official language
  plainEnglish: string;          // Simple explanation
  sprsDeduction: number;         // Points deducted if unmet (-1 to -5)
  cmmcLevel: CMMCLevel;          // 1 or 2
  assessmentQuestion: string;    // Yes/no/partial question for contractor
  remediationSteps: string[];    // Step-by-step fix guidance
  affordableTools: string[];     // Budget-friendly tools to implement
  evidenceRequired: string[];    // What a C3PAO assessor needs to see
  policyMapping: string[];       // Which policy documents this maps to
  estimatedHours: number;        // Estimated implementation time
  riskPriority: RiskPriority;    // How critical this control is
}

export interface ControlFamilyMeta {
  code: ControlFamily;
  name: string;
  description: string;
  controlCount: number;
  maxDeduction: number;          // Sum of all SPRS deductions in family
}

export interface Assessment {
  id: string;
  organizationId: string;
  cmmcLevel: CMMCLevel;
  responses: AssessmentResponse[];
  sprsScore: number;
  startedAt: string;
  completedAt: string | null;
  lastUpdatedAt: string;
}

export interface AssessmentResponse {
  controlId: string;
  status: ControlStatus;
  notes: string;
  evidenceUploaded: boolean;
  answeredAt: string;
}

export interface SPRSScore {
  total: number;                 // -203 to +110
  byFamily: Record<ControlFamily, { met: number; partial: number; unmet: number; score: number }>;
  metCount: number;
  partialCount: number;
  unmetCount: number;
  assessedCount: number;
  completionPercent: number;
}

export interface Organization {
  id: string;
  name: string;
  employeeCount: number;
  contractTypes: string[];
  handlesCUI: boolean;
  handlesFCI: boolean;
  cmmcLevel: CMMCLevel;
  createdAt: string;
}
