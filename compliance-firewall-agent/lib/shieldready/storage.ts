/**
 * ShieldReady — localStorage Persistence Layer
 *
 * Zero-cost data storage using the browser's localStorage API.
 * All assessment data, org settings, and activity logs are persisted
 * locally so ShieldReady works fully offline with no backend needed.
 *
 * Storage keys:
 *   shieldready_org        — Organization profile from onboarding
 *   shieldready_assessment — All assessment responses
 *   shieldready_activity   — Recent activity timeline entries
 */

import { z } from 'zod';
import type {
  Organization,
  AssessmentResponse,
  ControlStatus,
  CMMCLevel,
} from './types';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const KEYS = {
  ORG: 'shieldready_org',
  ASSESSMENT: 'shieldready_assessment',
  ACTIVITY: 'shieldready_activity',
} as const;

// ─── Zod Schemas (validate on read to prevent corrupt data) ──────────────────
const orgSchema = z.object({
  id: z.string(),
  name: z.string(),
  employeeCount: z.number(),
  contractTypes: z.array(z.string()),
  handlesCUI: z.boolean(),
  handlesFCI: z.boolean(),
  cmmcLevel: z.union([z.literal(1), z.literal(2)]),
  createdAt: z.string(),
});

const responseSchema = z.object({
  controlId: z.string(),
  status: z.enum(['MET', 'PARTIAL', 'UNMET', 'NOT_ASSESSED']),
  notes: z.string(),
  evidenceUploaded: z.boolean(),
  answeredAt: z.string(),
});

const activitySchema = z.object({
  id: z.string(),
  action: z.string(),
  controlId: z.string().optional(),
  timestamp: z.string(),
});

export type ActivityEntry = z.infer<typeof activitySchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeRead<T>(key: string, schema: z.ZodType<T>): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return schema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function safeReadArray<T>(key: string, itemSchema: z.ZodType<T>): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: unknown) => {
        try { return itemSchema.parse(item); } catch { return null; }
      })
      .filter((item: T | null): item is T => item !== null);
  } catch {
    return [];
  }
}

function safeWrite(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[ShieldReady] Failed to write to localStorage key "${key}":`, e);
  }
}

// ─── Organization ────────────────────────────────────────────────────────────
export function saveOrganization(org: Organization): void {
  safeWrite(KEYS.ORG, org);
}

export function getOrganization(): Organization | null {
  return safeRead(KEYS.ORG, orgSchema);
}

export function createOrganization(data: {
  name: string;
  employeeCount: number;
  contractTypes: string[];
  handlesCUI: boolean;
  handlesFCI: boolean;
  cmmcLevel: CMMCLevel;
}): Organization {
  const org: Organization = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveOrganization(org);
  return org;
}

// ─── Assessment Responses ────────────────────────────────────────────────────
export function getAssessmentResponses(): AssessmentResponse[] {
  return safeReadArray(KEYS.ASSESSMENT, responseSchema);
}

export function saveAssessmentResponse(response: AssessmentResponse): void {
  const responses = getAssessmentResponses();
  const existing = responses.findIndex((r) => r.controlId === response.controlId);
  if (existing >= 0) {
    responses[existing] = response;
  } else {
    responses.push(response);
  }
  safeWrite(KEYS.ASSESSMENT, responses);
}

export function saveAllAssessmentResponses(responses: AssessmentResponse[]): void {
  safeWrite(KEYS.ASSESSMENT, responses);
}

export function getResponseForControl(controlId: string): AssessmentResponse | null {
  const responses = getAssessmentResponses();
  return responses.find((r) => r.controlId === controlId) ?? null;
}

export function setControlStatus(
  controlId: string,
  status: ControlStatus,
  notes: string = '',
  evidenceUploaded: boolean = false,
): void {
  const response: AssessmentResponse = {
    controlId,
    status,
    notes,
    evidenceUploaded,
    answeredAt: new Date().toISOString(),
  };
  saveAssessmentResponse(response);
  logActivity(`Set ${controlId} to ${status}`, controlId);
}

// ─── Activity Timeline ───────────────────────────────────────────────────────
const MAX_ACTIVITIES = 50;

export function getActivities(): ActivityEntry[] {
  return safeReadArray(KEYS.ACTIVITY, activitySchema);
}

export function logActivity(action: string, controlId?: string): void {
  const activities = getActivities();
  activities.unshift({
    id: crypto.randomUUID(),
    action,
    controlId,
    timestamp: new Date().toISOString(),
  });
  // Keep only recent entries
  safeWrite(KEYS.ACTIVITY, activities.slice(0, MAX_ACTIVITIES));
}

// ─── Clear / Reset ───────────────────────────────────────────────────────────
export function clearAll(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export function clearAssessment(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.ASSESSMENT);
  localStorage.removeItem(KEYS.ACTIVITY);
}

// ─── Stats (quick summary without full scoring engine) ───────────────────────
export function getQuickStats(): {
  totalResponses: number;
  metCount: number;
  partialCount: number;
  unmetCount: number;
  hasOrg: boolean;
} {
  const responses = getAssessmentResponses();
  const org = getOrganization();
  let met = 0, partial = 0, unmet = 0;
  for (const r of responses) {
    if (r.status === 'MET') met++;
    else if (r.status === 'PARTIAL') partial++;
    else if (r.status === 'UNMET') unmet++;
  }
  return {
    totalResponses: responses.length,
    metCount: met,
    partialCount: partial,
    unmetCount: unmet,
    hasOrg: org !== null,
  };
}
