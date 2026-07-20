/**
 * Compliance ROI presentation tokens.
 *
 * The reference the founder loves uses vivid magenta→blue gradient tiles. The
 * HoundShield design system forbids those as a brand accent, so this translates
 * the SAME visual language (rich gradient stat cards, a positive-signal trend)
 * into the dark-steel palette: a five-step steel→sky ramp for the category
 * bars, a steel gradient for the tiles, and emerald reserved for the positive
 * "value protected" trend — the one place a positive semantic is earned.
 * Hexes mirror the design tokens used across control-map + pdf-brand.
 */
import type { CategoryId } from '@/lib/dashboard/roi-model';

/** Steel ramp, deepest → lightest sky. */
export const STEEL_RAMP = ['#132638', '#2B4F6B', '#4E7A99', '#81A6C6', '#AACDDC'] as const;

export const SKY = '#AACDDC';
export const STEEL = '#2B4F6B';

/** Emerald — the positive "protected / saved" signal (already used site-wide). */
export const POSITIVE = '#34D399';
export const POSITIVE_DEEP = '#10B981';

/** Per-category fill, spread across the steel ramp so each row is distinct. */
export const CATEGORY_HEX: Record<CategoryId, string> = {
  secrets: STEEL_RAMP[1],
  cui: STEEL_RAMP[2],
  ip: STEEL_RAMP[2],
  phi: STEEL_RAMP[3],
  pii: STEEL_RAMP[4],
};

/** Gradient for a standard stat tile. */
export const TILE_GRADIENT = 'linear-gradient(135deg, #16324a 0%, #0c1c2c 100%)';

/** Gradient for the hero "total value protected" tile. */
export const HERO_GRADIENT = 'linear-gradient(135deg, #24506e 0%, #142a3d 55%, #0d1e2d 100%)';
