/**
 * Brain AI — Hooks System
 *
 * Event-driven hooks that fire before/after tool calls, messages, and sessions.
 * Brain AI original implementation for Hound Shield.
 */

export type HookEvent =
  | "before_message"
  | "after_message"
  | "before_tool"
  | "after_tool"
  | "session_start"
  | "session_end"
  | "error"
  | "permission_denied"
  | "turn_complete";

export interface HookPayload {
  event: HookEvent;
  sessionId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export type HookHandler = (payload: HookPayload) => void | Promise<void>;

export interface RegisteredHook {
  id: string;
  event: HookEvent;
  handler: HookHandler;
  priority: number;   // lower runs first
  once: boolean;
}

// ─── Hook registry ─────────────────────────────────────────────────────────────

const _hooks = new Map<HookEvent, RegisteredHook[]>();
let _hookCounter = 0;

export function on(event: HookEvent, handler: HookHandler, priority = 50): string {
  const id = `hook_${++_hookCounter}`;
  const list = _hooks.get(event) ?? [];
  list.push({ id, event, handler, priority, once: false });
  list.sort((a, b) => a.priority - b.priority);
  _hooks.set(event, list);
  return id;
}

export function once(event: HookEvent, handler: HookHandler, priority = 50): string {
  const id = `hook_${++_hookCounter}`;
  const list = _hooks.get(event) ?? [];
  list.push({ id, event, handler, priority, once: true });
  list.sort((a, b) => a.priority - b.priority);
  _hooks.set(event, list);
  return id;
}

export function off(hookId: string): boolean {
  for (const [event, list] of _hooks.entries()) {
    const idx = list.findIndex((h) => h.id === hookId);
    if (idx !== -1) {
      list.splice(idx, 1);
      _hooks.set(event, list);
      return true;
    }
  }
  return false;
}

export async function emit(event: HookEvent, sessionId: string, data: Record<string, unknown> = {}): Promise<void> {
  const list = _hooks.get(event);
  if (!list || list.length === 0) return;

  const payload: HookPayload = { event, sessionId, timestamp: Date.now(), data };
  const toRemove: string[] = [];

  for (const hook of list) {
    try {
      await hook.handler(payload);
    } catch (err) {
      // Hooks must not crash Brain AI
      console.error(`[BrainAI Hook] Error in ${hook.id} (${event}):`, err);
    }
    if (hook.once) toRemove.push(hook.id);
  }

  for (const id of toRemove) off(id);
}

export function clearHooks(event?: HookEvent): void {
  if (event) {
    _hooks.delete(event);
  } else {
    _hooks.clear();
  }
}

export function getHookCount(event?: HookEvent): number {
  if (event) return _hooks.get(event)?.length ?? 0;
  let total = 0;
  for (const list of _hooks.values()) total += list.length;
  return total;
}

// ─── Built-in telemetry hooks ─────────────────────────────────────────────────

export function registerTelemetryHooks(onEvent: (e: HookPayload) => void): void {
  const events: HookEvent[] = [
    "session_start", "session_end", "turn_complete", "error", "permission_denied",
  ];
  for (const event of events) {
    on(event, onEvent, 100);
  }
}

// ─── Convenience builders ─────────────────────────────────────────────────────

export function buildPayload(
  event: HookEvent,
  sessionId: string,
  data: Record<string, unknown> = {}
): HookPayload {
  return { event, sessionId, timestamp: Date.now(), data };
}

export function renderHookRegistry(): string {
  const lines = ["## Brain AI Hook Registry\n"];
  for (const [event, list] of _hooks.entries()) {
    lines.push(`### ${event} (${list.length} handler${list.length !== 1 ? "s" : ""})`);
    for (const h of list) {
      lines.push(`- \`${h.id}\` priority=${h.priority}${h.once ? " (once)" : ""}`);
    }
    lines.push("");
  }
  if (_hooks.size === 0) lines.push("_No hooks registered._");
  return lines.join("\n");
}
