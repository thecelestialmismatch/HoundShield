/**
 * Control Map presentation tokens.
 *
 * One place for the status → colour mapping so the table, the legend, and the
 * KPI cards never drift. Palette is HoundShield dark-steel (NOT the reference's
 * purple): brand steel is the accent, emerald = done, amber = at-risk warning
 * (used sparingly, exactly like the reference's warning triangle), slate =
 * dormant. Hex values mirror the design-system tokens in tailwind.config.js.
 */
import type { ControlStatus } from '@/lib/dashboard/control-map-data';

/** Brand steel — the primary accent (tailwind brand-400 / brand-500). */
export const STEEL = '#AACDDC';
export const STEEL_DEEP = '#81A6C6';

export interface StatusStyle {
  /** Text colour class for the status pill. */
  text: string;
  /** Background tint class for the status pill. */
  bg: string;
  /** Border class for the status pill. */
  border: string;
  /** Raw hex for the SVG/inline progress fill. */
  hex: string;
}

export const STATUS_STYLES: Record<ControlStatus, StatusStyle> = {
  implemented: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    hex: '#10B981',
  },
  in_progress: {
    text: 'text-brand-300',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/25',
    hex: STEEL_DEEP,
  },
  not_started: {
    text: 'text-slate-400',
    bg: 'bg-white/[0.04]',
    border: 'border-white/[0.08]',
    hex: '#64748B',
  },
};

/** Progress-bar fill colour keyed off status. */
export function progressHex(status: ControlStatus): string {
  return STATUS_STYLES[status].hex;
}
