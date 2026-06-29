// ============================================================================
// Pixel Engine — Canvas 2D game loop with BFS pathfinding & character FSM
// Adapted from pixel-agents (pablodelucca/pixel-agents)
// ============================================================================

import {
    type SpriteFrame,
    type CharacterSprites,
    PALETTES,
    generateCharacterSprites,
    makeDeskSprite,
    makeChairSprite,
    makePlantSprite,
    makeBookshelfSprite,
    makeCoolerSprite,
} from './pixel-sprites';

// ── Constants ───────────────────────────────────────────────────
const TILE_SIZE = 16;
const COLS = 18;
const ROWS = 11;
const WALK_SPEED = 48; // px/sec
const WALK_FRAME_DUR = 0.15;
const TYPE_FRAME_DUR = 0.3;
const WANDER_PAUSE_MIN = 2.0;
const WANDER_PAUSE_MAX = 8.0;
const BG_COLOR = '#0f0f1a';
const FLOOR_COLOR = '#2a2a3e';
const FLOOR_COLOR_ALT = '#252536';
const WALL_COLOR = '#1a1a2e';

// ── Types ───────────────────────────────────────────────────────
export type AgentStatus = 'typing' | 'reading' | 'idle' | 'waiting' | 'running';

export interface AgentInfo {
    id: string;
    name: string;
    status: AgentStatus;
    role: string;
}

interface Vec2 { x: number; y: number }

type CharState = 'idle' | 'walk' | 'type';

interface Desk {
    col: number;
    row: number;
    chairCol: number;
    chairRow: number;
}

interface PixelCharacter {
    id: string;
    name: string;
    palette: number;
    sprites: CharacterSprites;
    state: CharState;
    x: number;
    y: number;
    tileCol: number;
    tileRow: number;
    targetCol: number;
    targetRow: number;
    path: Array<{ col: number; row: number }>;
    moveProgress: number;
    frame: number;
    frameTimer: number;
    wanderTimer: number;
    deskIdx: number;
    isActive: boolean;
    status: AgentStatus;
    bubbleText: string;
}

// ── Tile Map ────────────────────────────────────────────────────
// 0 = wall, 1 = floor
function createTileMap(): number[][] {
    const map: number[][] = [];
    for (let r = 0; r < ROWS; r++) {
        map[r] = [];
        for (let c = 0; c < COLS; c++) {
            // Walls on edges
            if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
                map[r][c] = 0;
            } else {
                map[r][c] = 1;
            }
        }
    }
    return map;
}

// ── Default desks (pre-placed layout) ───────────────────────────
function createDesks(): Desk[] {
    return [
        { col: 3, row: 2, chairCol: 3, chairRow: 3 },
        { col: 7, row: 2, chairCol: 7, chairRow: 3 },
        { col: 11, row: 2, chairCol: 11, chairRow: 3 },
        { col: 15, row: 2, chairCol: 15, chairRow: 3 },
        { col: 3, row: 7, chairCol: 3, chairRow: 6 },
        { col: 7, row: 7, chairCol: 7, chairRow: 6 },
        { col: 11, row: 7, chairCol: 11, chairRow: 6 },
        { col: 15, row: 7, chairCol: 15, chairRow: 6 },
    ];
}

// ── BFS Pathfinding ─────────────────────────────────────────────
function bfs(
    tileMap: number[][],
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    blockedSet: Set<string>,
): Array<{ col: number; row: number }> {
    if (startCol === endCol && startRow === endRow) return [];
    const key = (c: number, r: number) => `${c},${r}`;
    const visited = new Set<string>();
    const queue: Array<{ col: number; row: number; path: Array<{ col: number; row: number }> }> = [];
    queue.push({ col: startCol, row: startRow, path: [] });
    visited.add(key(startCol, startRow));

    const dirs = [
        { dc: 0, dr: -1 },
        { dc: 0, dr: 1 },
        { dc: -1, dr: 0 },
        { dc: 1, dr: 0 },
    ];

    while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const d of dirs) {
            const nc = cur.col + d.dc;
            const nr = cur.row + d.dr;
            if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
            if (tileMap[nr][nc] === 0) continue;
            const k = key(nc, nr);
            if (visited.has(k)) continue;
            if (blockedSet.has(k) && !(nc === endCol && nr === endRow)) continue;
            visited.add(k);
            const newPath = [...cur.path, { col: nc, row: nr }];
            if (nc === endCol && nr === endRow) return newPath;
            queue.push({ col: nc, row: nr, path: newPath });
        }
    }
    return [];
}

// ── Sprite Renderer ─────────────────────────────────────────────
function drawSprite(
    ctx: CanvasRenderingContext2D,
    sprite: SpriteFrame,
    px: number,
    py: number,
    zoom: number,
) {
    const pxSize = zoom;
    for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[r].length; c++) {
            const color = sprite[r][c];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(
                Math.floor(px + c * pxSize),
                Math.floor(py + r * pxSize),
                Math.ceil(pxSize),
                Math.ceil(pxSize),
            );
        }
    }
}

// ── Helpers ─────────────────────────────────────────────────────
function tileCenter(col: number, row: number): Vec2 {
    return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

// ── Main Engine ─────────────────────────────────────────────────
export class PixelOfficeEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private zoom: number;
    private tileMap: number[][];
    private desks: Desk[];
    private characters: Map<string, PixelCharacter> = new Map();
    private deskSprite: SpriteFrame;
    private chairSprite: SpriteFrame;
    private plantSprite: SpriteFrame;
    private bookshelfSprite: SpriteFrame;
    private coolerSprite: SpriteFrame;
    private lastTime = 0;
    private rafId = 0;
    private stopped = false;
    private paletteIdx = 0;
    private offsetX = 0;
    private offsetY = 0;

    constructor(canvas: HTMLCanvasElement, zoom = 3) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
        this.zoom = zoom;
        this.tileMap = createTileMap();
        this.desks = createDesks();
        this.deskSprite = makeDeskSprite();
        this.chairSprite = makeChairSprite();
        this.plantSprite = makePlantSprite();
        this.bookshelfSprite = makeBookshelfSprite();
        this.coolerSprite = makeCoolerSprite();

        // Size canvas
        this.resize();
    }

    resize() {
        const w = COLS * TILE_SIZE * this.zoom;
        const h = ROWS * TILE_SIZE * this.zoom;
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.imageSmoothingEnabled = false;
        // Center offset
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setZoom(z: number) {
        this.zoom = Math.max(1, Math.min(6, z));
        this.resize();
    }

    getZoom() { return this.zoom; }

    // ── Agent Management ────────────────────────────────────────
    setAgents(agents: AgentInfo[]) {
        // Add new agents
        for (const agent of agents) {
            if (!this.characters.has(agent.id)) {
                const deskIdx = this.characters.size % this.desks.length;
                const desk = this.desks[deskIdx];
                const palette = this.paletteIdx % PALETTES.length;
                this.paletteIdx++;

                const ch: PixelCharacter = {
                    id: agent.id,
                    name: agent.name,
                    palette,
                    sprites: generateCharacterSprites(PALETTES[palette]),
                    state: 'idle',
                    x: desk.chairCol * TILE_SIZE + TILE_SIZE / 2,
                    y: desk.chairRow * TILE_SIZE + TILE_SIZE / 2,
                    tileCol: desk.chairCol,
                    tileRow: desk.chairRow,
                    targetCol: desk.chairCol,
                    targetRow: desk.chairRow,
                    path: [],
                    moveProgress: 0,
                    frame: 0,
                    frameTimer: 0,
                    wanderTimer: randomRange(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX),
                    deskIdx,
                    isActive: agent.status === 'typing' || agent.status === 'running',
                    status: agent.status,
                    bubbleText: '',
                };
                this.characters.set(agent.id, ch);
            }
        }

        // Update existing agents
        for (const agent of agents) {
            const ch = this.characters.get(agent.id);
            if (ch) {
                ch.status = agent.status;
                ch.name = agent.name;
                ch.isActive = agent.status === 'typing' || agent.status === 'running';
                ch.bubbleText = agent.status === 'waiting' ? '' : '';
            }
        }

        // Remove gone agents
        const currentIds = new Set(agents.map(a => a.id));
        for (const [id] of this.characters) {
            if (!currentIds.has(id)) {
                this.characters.delete(id);
            }
        }
    }

    // ── Game Loop ───────────────────────────────────────────────
    start() {
        this.stopped = false;
        this.lastTime = 0;
        const frame = (time: number) => {
            if (this.stopped) return;
            const dt = this.lastTime === 0 ? 0 : Math.min((time - this.lastTime) / 1000, 0.1);
            this.lastTime = time;
            this.update(dt);
            this.render();
            this.rafId = requestAnimationFrame(frame);
        };
        this.rafId = requestAnimationFrame(frame);
    }

    stop() {
        this.stopped = true;
        cancelAnimationFrame(this.rafId);
    }

    // ── Update Loop ─────────────────────────────────────────────
    private update(dt: number) {
        const blockedSet = new Set<string>();
        // Mark desk/chair tiles as semi-blocked
        for (const desk of this.desks) {
            blockedSet.add(`${desk.col},${desk.row}`);
        }

        for (const ch of this.characters.values()) {
            this.updateCharacter(ch, dt, blockedSet);
        }
    }

    private updateCharacter(ch: PixelCharacter, dt: number, blockedSet: Set<string>) {
        const desk = this.desks[ch.deskIdx];

        switch (ch.state) {
            case 'idle': {
                ch.wanderTimer -= dt;

                if (ch.isActive || ch.status === 'typing' || ch.status === 'running') {
                    // Walk to desk
                    if (ch.tileCol !== desk.chairCol || ch.tileRow !== desk.chairRow) {
                        ch.path = bfs(this.tileMap, ch.tileCol, ch.tileRow, desk.chairCol, desk.chairRow, blockedSet);
                        if (ch.path.length > 0) {
                            ch.state = 'walk';
                            ch.moveProgress = 0;
                        }
                    } else {
                        ch.state = 'type';
                        ch.frame = 0;
                        ch.frameTimer = 0;
                    }
                } else if (ch.wanderTimer <= 0) {
                    // Random wander
                    const walkable: Array<{ col: number; row: number }> = [];
                    for (let r = 1; r < ROWS - 1; r++) {
                        for (let c = 1; c < COLS - 1; c++) {
                            if (this.tileMap[r][c] === 1 && !blockedSet.has(`${c},${r}`)) {
                                walkable.push({ col: c, row: r });
                            }
                        }
                    }
                    if (walkable.length > 0) {
                        const target = walkable[Math.floor(Math.random() * walkable.length)];
                        ch.path = bfs(this.tileMap, ch.tileCol, ch.tileRow, target.col, target.row, blockedSet);
                        if (ch.path.length > 0) {
                            ch.state = 'walk';
                            ch.moveProgress = 0;
                        }
                    }
                    ch.wanderTimer = randomRange(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX);
                }
                break;
            }

            case 'walk': {
                if (ch.path.length === 0) {
                    ch.state = ch.isActive ? 'type' : 'idle';
                    ch.frame = 0;
                    ch.frameTimer = 0;
                    break;
                }

                const next = ch.path[0];
                const from = tileCenter(ch.tileCol, ch.tileRow);
                const to = tileCenter(next.col, next.row);

                ch.moveProgress += (WALK_SPEED * dt) / TILE_SIZE;

                if (ch.moveProgress >= 1) {
                    ch.tileCol = next.col;
                    ch.tileRow = next.row;
                    ch.x = to.x;
                    ch.y = to.y;
                    ch.path.shift();
                    ch.moveProgress = 0;
                } else {
                    ch.x = from.x + (to.x - from.x) * ch.moveProgress;
                    ch.y = from.y + (to.y - from.y) * ch.moveProgress;
                }

                // Walk animation frames
                ch.frameTimer += dt;
                if (ch.frameTimer >= WALK_FRAME_DUR) {
                    ch.frameTimer -= WALK_FRAME_DUR;
                    ch.frame = (ch.frame + 1) % ch.sprites.walk.length;
                }
                break;
            }

            case 'type': {
                if (!ch.isActive && ch.status !== 'typing' && ch.status !== 'running') {
                    ch.state = 'idle';
                    ch.wanderTimer = randomRange(WANDER_PAUSE_MIN, WANDER_PAUSE_MAX);
                    break;
                }

                ch.frameTimer += dt;
                if (ch.frameTimer >= TYPE_FRAME_DUR) {
                    ch.frameTimer -= TYPE_FRAME_DUR;
                    ch.frame = (ch.frame + 1) % ch.sprites.type.length;
                }
                break;
            }
        }
    }

    // ── Render Loop ─────────────────────────────────────────────
    private render() {
        const ctx = this.ctx;
        const z = this.zoom;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, w, h);

        // Draw tile grid
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const px = c * TILE_SIZE * z + this.offsetX;
                const py = r * TILE_SIZE * z + this.offsetY;
                const sz = TILE_SIZE * z;

                if (this.tileMap[r][c] === 0) {
                    ctx.fillStyle = WALL_COLOR;
                } else {
                    ctx.fillStyle = (r + c) % 2 === 0 ? FLOOR_COLOR : FLOOR_COLOR_ALT;
                }
                ctx.fillRect(px, py, sz, sz);

                // Subtle grid lines
                ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                ctx.strokeRect(px, py, sz, sz);
            }
        }

        // Draw decorations (plants, bookshelves, cooler)
        drawSprite(ctx, this.plantSprite, 1 * TILE_SIZE * z, 1 * TILE_SIZE * z, z);
        drawSprite(ctx, this.plantSprite, 16 * TILE_SIZE * z, 1 * TILE_SIZE * z, z);
        drawSprite(ctx, this.bookshelfSprite, 1 * TILE_SIZE * z, 5 * TILE_SIZE * z, z);
        drawSprite(ctx, this.coolerSprite, 16 * TILE_SIZE * z, 5 * TILE_SIZE * z, z);

        // Draw desks and chairs
        for (const desk of this.desks) {
            drawSprite(ctx, this.deskSprite, desk.col * TILE_SIZE * z, desk.row * TILE_SIZE * z, z);
            drawSprite(ctx, this.chairSprite, desk.chairCol * TILE_SIZE * z, desk.chairRow * TILE_SIZE * z, z);
        }

        // Sort characters by Y for depth
        const sorted = [...this.characters.values()].sort((a, b) => a.y - b.y);

        // Draw characters
        for (const ch of sorted) {
            let sprite: SpriteFrame;
            switch (ch.state) {
                case 'walk':
                    sprite = ch.sprites.walk[ch.frame % ch.sprites.walk.length];
                    break;
                case 'type':
                    sprite = ch.sprites.type[ch.frame % ch.sprites.type.length];
                    break;
                default:
                    sprite = ch.sprites.idle[0];
            }

            const px = (ch.x - TILE_SIZE / 2) * z + this.offsetX;
            const py = (ch.y - TILE_SIZE / 2) * z + this.offsetY;
            drawSprite(ctx, sprite, px, py, z);

            // Name label
            const labelX = ch.x * z + this.offsetX;
            const labelY = (ch.y - TILE_SIZE) * z + this.offsetY;
            const fontSize = Math.max(8, z * 3);
            ctx.font = `bold ${fontSize}px monospace`;
            ctx.textAlign = 'center';

            // Background pill
            const metrics = ctx.measureText(ch.name);
            const pillW = metrics.width + 8;
            const pillH = fontSize + 4;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            const pillRadius = 3;
            const pillX = labelX - pillW / 2;
            const pillY = labelY - pillH + 2;
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
            ctx.fill();

            // Label text
            ctx.fillStyle = this.getStatusColor(ch.status);
            ctx.fillText(ch.name, labelX, labelY);

            // Status dot
            const dotRadius = Math.max(2, z);
            ctx.beginPath();
            ctx.arc(labelX + pillW / 2 - 2, pillY + pillH / 2, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.getStatusColor(ch.status);
            ctx.fill();

            // Bubble
            if (ch.bubbleText) {
                const bubbleY = pillY - fontSize - 4;
                ctx.font = `${fontSize + 2}px sans-serif`;
                ctx.fillText(ch.bubbleText, labelX, bubbleY);
            }
        }
    }

    private getStatusColor(status: AgentStatus): string {
        switch (status) {
            case 'typing': return '#22c55e';
            case 'running': return '#3b82f6';
            case 'reading': return '#a855f7';
            case 'waiting': return '#eab308';
            case 'idle': return '#94a3b8';
            default: return '#94a3b8';
        }
    }
}
