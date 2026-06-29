import { NISTControl, ControlFamily } from '../types';

// ─── Family Imports ──────────────────────────────────────────────────────────
import { AC_CONTROLS } from './ac';
import { AT_CONTROLS, AU_CONTROLS, CM_CONTROLS } from './at-au-cm';
import { IA_CONTROLS, IR_CONTROLS, MA_CONTROLS, MP_CONTROLS } from './ia-ir-ma-mp';
import {
  PS_CONTROLS,
  PE_CONTROLS,
  RA_CONTROLS,
  CA_CONTROLS,
  SC_CONTROLS,
  SI_CONTROLS,
} from './ps-pe-ra-ca-sc-si';

// ─── Combined Export ─────────────────────────────────────────────────────────

/**
 * All 110 NIST SP 800-171 Rev 2 controls across 14 families,
 * ordered by family code.
 */
export const ALL_CONTROLS: NISTControl[] = [
  ...AC_CONTROLS,
  ...AT_CONTROLS,
  ...AU_CONTROLS,
  ...CA_CONTROLS,
  ...CM_CONTROLS,
  ...IA_CONTROLS,
  ...IR_CONTROLS,
  ...MA_CONTROLS,
  ...MP_CONTROLS,
  ...PE_CONTROLS,
  ...PS_CONTROLS,
  ...RA_CONTROLS,
  ...SC_CONTROLS,
  ...SI_CONTROLS,
];

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/** Return every control belonging to a given family code. */
export function getControlsByFamily(family: ControlFamily): NISTControl[] {
  return ALL_CONTROLS.filter((c) => c.family === family);
}

/** Find a single control by its exact ID (e.g. "AC.1.001"). */
export function getControlById(id: string): NISTControl | undefined {
  return ALL_CONTROLS.find((c) => c.id === id);
}

/** Return only CMMC Level 1 (Basic Safeguarding) controls. */
export function getLevel1Controls(): NISTControl[] {
  return ALL_CONTROLS.filter((c) => c.cmmcLevel === 1);
}

/** Return only CMMC Level 2 (full NIST 800-171) controls. */
export function getLevel2Controls(): NISTControl[] {
  return ALL_CONTROLS.filter((c) => c.cmmcLevel === 2);
}

// Re-export individual family arrays for direct consumption
export {
  AC_CONTROLS,
  AT_CONTROLS,
  AU_CONTROLS,
  CM_CONTROLS,
  IA_CONTROLS,
  IR_CONTROLS,
  MA_CONTROLS,
  MP_CONTROLS,
  PS_CONTROLS,
  PE_CONTROLS,
  RA_CONTROLS,
  CA_CONTROLS,
  SC_CONTROLS,
  SI_CONTROLS,
};
