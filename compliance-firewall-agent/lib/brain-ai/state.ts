/**
 * Brain AI — State Management
 *
 * Centralized runtime state for the Brain AI agent.
 * Brain AI original implementation for Kaelus.online.
 */

export type AgentStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "processing"
  | "streaming"
  | "error"
  | "shutdown";

export interface ToolCallState {
  toolName: string;
  callId: string;
  startedAt: number;
  endedAt?: number;
  success?: boolean;
  errorMessage?: string;
}

export interface TurnState {
  turnIndex: number;
  userMessage: string;
  startedAt: number;
  endedAt?: number;
  tokensUsed: number;
  toolCalls: ToolCallState[];
  responsePreview: string;
}

export interface SessionState {
  sessionId: string;
  status: AgentStatus;
  createdAt: number;
  lastActivityAt: number;
  turnCount: number;
  totalTokens: number;
  currentTurn: TurnState | null;
  turns: TurnState[];
  errorCount: number;
  lastError: string | null;
}

export interface GlobalAgentState {
  status: AgentStatus;
  activeSessions: Map<string, SessionState>;
  totalSessionsCreated: number;
  totalTurnsProcessed: number;
  totalTokensConsumed: number;
  startedAt: number;
  lastActivityAt: number;
}

// ─── Global state singleton ───────────────────────────────────────────────────

const _globalState: GlobalAgentState = {
  status: "idle",
  activeSessions: new Map(),
  totalSessionsCreated: 0,
  totalTurnsProcessed: 0,
  totalTokensConsumed: 0,
  startedAt: Date.now(),
  lastActivityAt: Date.now(),
};

// ─── Global state accessors ───────────────────────────────────────────────────

export function getGlobalState(): Readonly<Omit<GlobalAgentState, "activeSessions">> & {
  sessionCount: number;
} {
  return {
    status: _globalState.status,
    totalSessionsCreated: _globalState.totalSessionsCreated,
    totalTurnsProcessed: _globalState.totalTurnsProcessed,
    totalTokensConsumed: _globalState.totalTokensConsumed,
    startedAt: _globalState.startedAt,
    lastActivityAt: _globalState.lastActivityAt,
    sessionCount: _globalState.activeSessions.size,
  };
}

export function setGlobalStatus(status: AgentStatus): void {
  _globalState.status = status;
  _globalState.lastActivityAt = Date.now();
}

// ─── Session state management ─────────────────────────────────────────────────

export function createSessionState(sessionId: string): SessionState {
  const state: SessionState = {
    sessionId,
    status: "idle",
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
    turnCount: 0,
    totalTokens: 0,
    currentTurn: null,
    turns: [],
    errorCount: 0,
    lastError: null,
  };
  _globalState.activeSessions.set(sessionId, state);
  _globalState.totalSessionsCreated++;
  return state;
}

export function getSessionState(sessionId: string): SessionState | undefined {
  return _globalState.activeSessions.get(sessionId);
}

export function updateSessionStatus(sessionId: string, status: AgentStatus): void {
  const s = _globalState.activeSessions.get(sessionId);
  if (!s) return;
  s.status = status;
  s.lastActivityAt = Date.now();
  _globalState.lastActivityAt = Date.now();
}

export function startTurn(sessionId: string, userMessage: string): TurnState {
  const s = _globalState.activeSessions.get(sessionId);
  if (!s) throw new Error(`Session not found: ${sessionId}`);

  const turn: TurnState = {
    turnIndex: s.turnCount,
    userMessage,
    startedAt: Date.now(),
    tokensUsed: 0,
    toolCalls: [],
    responsePreview: "",
  };

  s.currentTurn = turn;
  s.status = "processing";
  s.lastActivityAt = Date.now();
  return turn;
}

export function endTurn(
  sessionId: string,
  tokensUsed: number,
  responsePreview: string
): void {
  const s = _globalState.activeSessions.get(sessionId);
  if (!s || !s.currentTurn) return;

  const turn = s.currentTurn;
  turn.endedAt = Date.now();
  turn.tokensUsed = tokensUsed;
  turn.responsePreview = responsePreview.substring(0, 200);

  s.turns.push(turn);
  s.currentTurn = null;
  s.turnCount++;
  s.totalTokens += tokensUsed;
  s.status = "ready";
  s.lastActivityAt = Date.now();

  _globalState.totalTurnsProcessed++;
  _globalState.totalTokensConsumed += tokensUsed;
  _globalState.lastActivityAt = Date.now();
}

export function recordToolCall(
  sessionId: string,
  toolName: string,
  callId: string
): void {
  const s = _globalState.activeSessions.get(sessionId);
  if (!s?.currentTurn) return;
  s.currentTurn.toolCalls.push({ toolName, callId, startedAt: Date.now() });
}

export function resolveToolCall(
  sessionId: string,
  callId: string,
  success: boolean,
  errorMessage?: string
): void {
  const s = _globalState.activeSessions.get(sessionId);
  if (!s?.currentTurn) return;
  const tc = s.currentTurn.toolCalls.find((t) => t.callId === callId);
  if (tc) {
    tc.endedAt = Date.now();
    tc.success = success;
    tc.errorMessage = errorMessage;
  }
}

export function recordError(sessionId: string, message: string): void {
  const s = _globalState.activeSessions.get(sessionId);
  if (!s) return;
  s.errorCount++;
  s.lastError = message;
  s.status = "error";
  s.lastActivityAt = Date.now();
}

export function removeSession(sessionId: string): boolean {
  return _globalState.activeSessions.delete(sessionId);
}

export function renderStateReport(sessionId?: string): string {
  if (sessionId) {
    const s = _globalState.activeSessions.get(sessionId);
    if (!s) return `Session \`${sessionId}\` not found.`;
    return [
      `## Session State: ${sessionId}`,
      `- Status: **${s.status}**`,
      `- Turns: ${s.turnCount}`,
      `- Tokens: ${s.totalTokens}`,
      `- Errors: ${s.errorCount}`,
      s.lastError ? `- Last error: ${s.lastError}` : "",
    ].filter(Boolean).join("\n");
  }

  const g = getGlobalState();
  return [
    `## Brain AI Global State`,
    `- Status: **${g.status}**`,
    `- Active sessions: ${g.sessionCount}`,
    `- Total sessions: ${g.totalSessionsCreated}`,
    `- Total turns: ${g.totalTurnsProcessed}`,
    `- Total tokens: ${g.totalTokensConsumed}`,
  ].join("\n");
}
