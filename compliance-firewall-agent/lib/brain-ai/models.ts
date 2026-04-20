/**
 * Brain AI — Core Data Models
 *
 * Brain AI — original TypeScript implementation for Hound Shield.py (houndshield/Brain AI).
 * Original Brain AI implementation for Hound Shield.
 * 
 */

// ─── Infrastructure ────────────────────────────────────────────────────────

export interface Subsystem {
  name: string;
  path: string;
  fileCount: number;
  notes: string;
}

export interface PortingModule {
  name: string;
  responsibility: string;
  sourceHint: string;
  status: "pending" | "in_progress" | "complete" | "skipped";
}

// ─── Execution tracking ────────────────────────────────────────────────────

export interface PermissionDenial {
  toolName: string;
  reason: string;
}

export interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function createUsageSummary(): UsageSummary {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function addTurn(
  summary: UsageSummary,
  inputTokens: number,
  outputTokens: number
): UsageSummary {
  return {
    inputTokens: summary.inputTokens + inputTokens,
    outputTokens: summary.outputTokens + outputTokens,
    totalTokens: summary.totalTokens + inputTokens + outputTokens,
  };
}

// ─── Command execution ─────────────────────────────────────────────────────

export interface CommandExecution {
  name: string;
  sourceHint: string;
  prompt: string;
  handled: boolean;
  message: string;
}

export interface ToolExecution {
  name: string;
  category: string;
  prompt: string;
  handled: boolean;
  result: unknown;
}

// ─── Turn & session results ────────────────────────────────────────────────

export interface TurnResult {
  prompt: string;
  output: string;
  matchedCommands: CommandExecution[];
  matchedTools: ToolExecution[];
  permissionDenials: PermissionDenial[];
  usage: UsageSummary;
  stopReason: "end_turn" | "max_turns" | "max_tokens" | "error" | "user_stop";
}

export interface RuntimeSession {
  sessionId: string;
  prompt: string;
  setup: string;
  history: TurnResult[];
  totalUsage: UsageSummary;
  createdAt: number;
  updatedAt: number;
}

// ─── Stored session (persisted to disk) ───────────────────────────────────

export interface StoredMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface StoredSession {
  sessionId: string;
  messages: StoredMessage[];
  inputTokens: number;
  outputTokens: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

// ─── Query engine config ───────────────────────────────────────────────────

export interface QueryEngineConfig {
  maxTurns: number;
  maxBudgetTokens: number;
  model: string;
  systemPrompt: string;
  temperature: number;
}

export function defaultQueryEngineConfig(): QueryEngineConfig {
  return {
    maxTurns: 15,
    maxBudgetTokens: 8192,
    model: "google/gemini-flash-1.5",
    systemPrompt:
      "You are Brain AI — the intelligent core of Hound Shield, an AI compliance firewall for defense contractors and regulated industries. You help users achieve CMMC Level 2, HIPAA, and SOC 2 compliance through intelligent guidance, threat analysis, and automated documentation.",
    temperature: 0.7,
  };
}

// ─── Routing ───────────────────────────────────────────────────────────────

export interface RoutedMatch {
  type: "command" | "tool";
  name: string;
  score: number;
  sourceHint: string;
}

// ─── Manifest ─────────────────────────────────────────────────────────────

export interface PortManifest {
  projectName: string;
  subsystems: Subsystem[];
  totalFiles: number;
  generatedAt: number;
}

// ─── Parity audit ─────────────────────────────────────────────────────────

export interface ParityAuditResult {
  coverage: number;
  missing: string[];
  present: string[];
  report: string;
}
