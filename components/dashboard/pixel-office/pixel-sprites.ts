// ============================================================================
// Pixel Sprites — Procedurally generated 16x16 character sprites
// Inspired by pixel-agents (pablodelucca/pixel-agents)
// ============================================================================

export type SpriteFrame = string[][]; // [row][col] hex colors, '' = transparent

export interface CharacterPalette {
    skin: string;
    hair: string;
    shirt: string;
    pants: string;
    shoes: string;
    outline: string;
}

// 6 diverse character palettes
export const PALETTES: CharacterPalette[] = [
    { skin: '#f5d6b8', hair: '#4a3728', shirt: '#3b82f6', pants: '#1e3a5f', shoes: '#2d2d2d', outline: '#1a1a2e' },
    { skin: '#d4a373', hair: '#1a1a1a', shirt: '#ef4444', pants: '#374151', shoes: '#1f1f1f', outline: '#1a1a2e' },
    { skin: '#fce4c0', hair: '#c2410c', shirt: '#22c55e', pants: '#1e40af', shoes: '#3d2b1f', outline: '#1a1a2e' },
    { skin: '#8b6914', hair: '#0f0f0f', shirt: '#a855f7', pants: '#1e293b', shoes: '#1a1a1a', outline: '#1a1a2e' },
    { skin: '#f0c8a0', hair: '#fbbf24', shirt: '#06b6d4', pants: '#334155', shoes: '#292524', outline: '#1a1a2e' },
    { skin: '#c68642', hair: '#3b1f0b', shirt: '#f97316', pants: '#1e3a5f', shoes: '#1c1917', outline: '#1a1a2e' },
];

const T = ''; // transparent

/** Generate a front-facing idle frame */
function makeIdleFrame(p: CharacterPalette): SpriteFrame {
    const O = p.outline, S = p.skin, H = p.hair, SH = p.shirt, P = p.pants, SHO = p.shoes;
    return [
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, O, O, O, O, T, T, T, T, T, T],
        [T, T, T, T, T, O, H, H, H, H, O, T, T, T, T, T],
        [T, T, T, T, T, O, H, H, H, H, O, T, T, T, T, T],
        [T, T, T, T, T, O, S, S, S, S, O, T, T, T, T, T],
        [T, T, T, T, T, O, S, '#1a1a2e', S, '#1a1a2e', O, T, T, T, T, T],
        [T, T, T, T, T, T, O, S, S, O, T, T, T, T, T, T],
        [T, T, T, T, T, O, SH, SH, SH, SH, O, T, T, T, T, T],
        [T, T, T, T, O, S, SH, SH, SH, SH, S, O, T, T, T, T],
        [T, T, T, T, T, O, SH, SH, SH, SH, O, T, T, T, T, T],
        [T, T, T, T, T, O, P, P, P, P, O, T, T, T, T, T],
        [T, T, T, T, T, O, P, P, P, P, O, T, T, T, T, T],
        [T, T, T, T, T, O, SHO, O, SHO, O, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    ];
}

/** Generate a walk frame (arms/legs shifted) */
function makeWalkFrame(p: CharacterPalette, step: 0 | 1): SpriteFrame {
    const frame = makeIdleFrame(p);
    const O = p.outline, S = p.skin, SHO = p.shoes;
    if (step === 0) {
        // Left arm forward, right leg forward
        frame[9] = [T, T, T, O, S, T, frame[9][6], frame[9][7], frame[9][8], frame[9][9], T, S, O, T, T, T];
        frame[13] = [T, T, T, T, O, SHO, O, T, T, SHO, O, T, T, T, T, T];
    } else {
        // Right arm forward, left leg forward
        frame[9] = [T, T, T, S, O, T, frame[9][6], frame[9][7], frame[9][8], frame[9][9], T, O, S, T, T, T];
        frame[13] = [T, T, T, T, T, SHO, O, T, O, SHO, T, T, T, T, T, T];
    }
    return frame;
}

/** Generate a typing frame (arms forward on desk) */
function makeTypeFrame(p: CharacterPalette): SpriteFrame {
    const frame = makeIdleFrame(p);
    const O = p.outline, S = p.skin;
    frame[9] = [T, T, T, T, S, O, frame[9][6], frame[9][7], frame[9][8], frame[9][9], O, S, T, T, T, T];
    frame[10] = [T, T, T, O, S, O, frame[10][6], frame[10][7], frame[10][8], frame[10][9], O, S, O, T, T, T];
    return frame;
}

export interface CharacterSprites {
    idle: SpriteFrame[];
    walk: SpriteFrame[];
    type: SpriteFrame[];
}

/** Generate all animation frames for a palette */
export function generateCharacterSprites(palette: CharacterPalette): CharacterSprites {
    return {
        idle: [makeIdleFrame(palette)],
        walk: [makeWalkFrame(palette, 0), makeIdleFrame(palette), makeWalkFrame(palette, 1), makeIdleFrame(palette)],
        type: [makeTypeFrame(palette), makeIdleFrame(palette)],
    };
}

// ── Furniture Sprites ──────────────────────────────────────────

const DESK_COLOR = '#8b6e4e';
const DESK_TOP = '#a0845c';
const DESK_DARK = '#6b5238';
const MONITOR = '#2d3748';
const SCREEN = '#63b3ed';
const KEYBOARD = '#4a5568';

export function makeDeskSprite(): SpriteFrame {
    const D = DESK_COLOR, DT = DESK_TOP, DD = DESK_DARK, M = MONITOR, SC = SCREEN, K = KEYBOARD;
    return [
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, M, M, M, M, M, M, T, T, T, T, T],
        [T, T, T, T, T, M, SC, SC, SC, SC, M, T, T, T, T, T],
        [T, T, T, T, T, M, SC, SC, SC, SC, M, T, T, T, T, T],
        [T, T, T, T, T, M, SC, SC, SC, SC, M, T, T, T, T, T],
        [T, T, T, T, T, T, T, M, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, K, K, K, T, T, T, T, T, T, T],
        [T, T, DT, DT, DT, DT, DT, DT, DT, DT, DT, DT, DT, DT, T, T],
        [T, T, D, DT, DT, DT, DT, DT, DT, DT, DT, DT, DT, D, T, T],
        [T, T, D, D, D, D, D, D, D, D, D, D, D, D, T, T],
        [T, T, DD, T, T, T, T, T, T, T, T, T, T, DD, T, T],
        [T, T, DD, T, T, T, T, T, T, T, T, T, T, DD, T, T],
        [T, T, DD, T, T, T, T, T, T, T, T, T, T, DD, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    ];
}

export function makeChairSprite(): SpriteFrame {
    const C = '#4a4a5a', B = '#3a3a4a', S = '#5a5a6a';
    return [
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, B, B, B, B, B, B, T, T, T, T, T],
        [T, T, T, T, T, B, C, C, C, C, B, T, T, T, T, T],
        [T, T, T, T, T, B, C, C, C, C, B, T, T, T, T, T],
        [T, T, T, T, T, B, B, B, B, B, B, T, T, T, T, T],
        [T, T, T, T, T, T, S, S, S, S, T, T, T, T, T, T],
        [T, T, T, T, T, S, S, S, S, S, S, T, T, T, T, T],
        [T, T, T, T, T, S, C, C, C, C, S, T, T, T, T, T],
        [T, T, T, T, T, T, B, T, T, B, T, T, T, T, T, T],
        [T, T, T, T, T, T, B, T, T, B, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    ];
}

export function makePlantSprite(): SpriteFrame {
    const L = '#22c55e', LD = '#15803d', P = '#92400e', PD = '#78350f';
    return [
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, L, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, L, L, L, T, T, T, T, T, T, T],
        [T, T, T, T, T, L, L, LD, L, L, T, T, T, T, T, T],
        [T, T, T, T, L, L, LD, L, LD, L, L, T, T, T, T, T],
        [T, T, T, T, T, L, L, LD, L, L, T, T, T, T, T, T],
        [T, T, T, T, T, T, L, L, L, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, LD, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, LD, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, P, P, P, T, T, T, T, T, T, T],
        [T, T, T, T, T, P, PD, P, PD, P, T, T, T, T, T, T],
        [T, T, T, T, T, P, P, P, P, P, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    ];
}

export function makeBookshelfSprite(): SpriteFrame {
    const W = '#92400e', WD = '#78350f', B1 = '#ef4444', B2 = '#3b82f6', B3 = '#22c55e', B4 = '#eab308', B5 = '#a855f7';
    return [
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, W, W, W, W, W, W, W, W, W, W, T, T, T],
        [T, T, T, W, B1, B2, B3, B4, B5, B1, B2, B3, W, T, T, T],
        [T, T, T, W, B1, B2, B3, B4, B5, B1, B2, B3, W, T, T, T],
        [T, T, T, W, W, W, W, W, W, W, W, W, W, T, T, T],
        [T, T, T, W, B4, B5, B1, B2, B3, B4, B5, B1, W, T, T, T],
        [T, T, T, W, B4, B5, B1, B2, B3, B4, B5, B1, W, T, T, T],
        [T, T, T, W, W, W, W, W, W, W, W, W, W, T, T, T],
        [T, T, T, W, B2, B3, B4, B5, B1, B2, B3, B4, W, T, T, T],
        [T, T, T, W, B2, B3, B4, B5, B1, B2, B3, B4, W, T, T, T],
        [T, T, T, W, W, W, W, W, W, W, W, W, W, T, T, T],
        [T, T, T, WD, T, T, T, T, T, T, T, T, WD, T, T, T],
        [T, T, T, WD, T, T, T, T, T, T, T, T, WD, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    ];
}

export function makeCoolerSprite(): SpriteFrame {
    const B = '#93c5fd', BD = '#60a5fa', W = '#e5e7eb', WD = '#d1d5db';
    return [
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, W, W, W, W, T, T, T, T, T, T],
        [T, T, T, T, T, T, W, B, B, W, T, T, T, T, T, T],
        [T, T, T, T, T, T, W, B, BD, W, T, T, T, T, T, T],
        [T, T, T, T, T, T, W, BD, BD, W, T, T, T, T, T, T],
        [T, T, T, T, T, T, W, W, W, W, T, T, T, T, T, T],
        [T, T, T, T, T, T, WD, WD, WD, WD, T, T, T, T, T, T],
        [T, T, T, T, T, T, WD, B, B, WD, T, T, T, T, T, T],
        [T, T, T, T, T, T, WD, W, W, WD, T, T, T, T, T, T],
        [T, T, T, T, T, T, WD, WD, WD, WD, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
        [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    ];
}
