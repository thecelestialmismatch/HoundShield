/**
 * Tool-calling round-trip tests.
 *
 * OpenAI function-calling traffic must survive the proxy intact:
 *   - ChatRequestSchema keeps tools / tool_choice; MessageSchema keeps
 *     tool_calls / tool_call_id / name and accepts content: null
 *   - unknown fields are still stripped (DLP posture unchanged)
 *   - redactMessages preserves tool_calls
 *   - tool-call arguments are scanned on the request path
 *   - a benign tool-calling request is forwarded upstream verbatim
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import type { Response } from "express";

vi.mock("node-fetch", () => ({
  default: vi.fn(async () => ({
    status: 200,
    json: async () => ({ id: "chatcmpl-test", choices: [] }),
    body: null,
  })),
}));

import fetch from "node-fetch";
import { ChatRequestSchema } from "../schema.js";
import { redactMessages } from "../ooda/act.js";
import { runOODALoop, toolCallArgText } from "../ooda/loop.js";
import { scanMessages, clearScanCache } from "../scanner.js";
import { closeOodaDb } from "../ooda/db.js";
import { closeDb } from "../storage.js";
import { resetRateTracker } from "../ooda/rate-tracker.js";
import { resetBaselineCache } from "../ooda/baseline.js";
import type { OODAContext } from "../ooda/types.js";

const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

// ── Test isolation: fresh SQLite DB per test via tempDir ────────────────────

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hs-toolcall-test-"));
  process.env["HOUNDSHIELD_DATA_DIR"] = tempDir;
  resetRateTracker();
  resetBaselineCache();
  closeOodaDb();
  closeDb();
  clearScanCache();
  fetchMock.mockClear();
});

afterEach(() => {
  closeOodaDb();
  closeDb();
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env["HOUNDSHIELD_DATA_DIR"];
});

// ── Fixtures ────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a city",
      parameters: {
        type: "object",
        properties: { city: { type: "string" } },
        required: ["city"],
      },
    },
  },
];

const TOOL_CALL = {
  id: "call_1",
  type: "function",
  function: { name: "get_weather", arguments: '{"city":"Boston"}' },
};

const TOOL_CONVERSATION = [
  { role: "system", content: "You are a helpful assistant" },
  { role: "user", content: "What is the weather in Boston?" },
  { role: "assistant", content: null, tool_calls: [TOOL_CALL] },
  { role: "tool", tool_call_id: "call_1", name: "get_weather", content: '{"temp_f":72}' },
];

function makeCtx(overrides: Partial<OODAContext> = {}): OODAContext {
  return {
    request_id: "req-tool-1",
    org_id: "org-tool-test",
    user_id: "user-tool-test",
    session_id: "sess-tool-1",
    messages: TOOL_CONVERSATION.map((m) => ({ ...m })),
    provider: "openai",
    upstream_key: "sk-test",
    upstream_url: "https://upstream.invalid/v1/chat/completions",
    stream: false,
    rest: { model: "gpt-4o", tools: TOOLS, tool_choice: "auto" },
    ...overrides,
  };
}

function stubRes(): {
  res: Response;
  headers: Record<string, unknown>;
  state: { status: number; body: unknown };
} {
  const headers: Record<string, unknown> = {};
  const state = { status: 0, body: undefined as unknown };
  const res = {
    setHeader(key: string, value: unknown) {
      headers[key] = value;
      return res;
    },
    status(code: number) {
      state.status = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { res: res as unknown as Response, headers, state };
}

// ── Schema round-trip ───────────────────────────────────────────────────────

describe("ChatRequestSchema tool-calling round-trip", () => {
  it("keeps tools, tool_choice, tool_calls, tool_call_id, name, and content: null", () => {
    const body = {
      model: "gpt-4o",
      messages: TOOL_CONVERSATION,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.2,
    };
    const parsed = ChatRequestSchema.parse(body);
    expect(parsed).toEqual(body);
  });

  it("accepts object-form tool_choice", () => {
    const parsed = ChatRequestSchema.parse({
      messages: [{ role: "user", content: "hi" }],
      tool_choice: { type: "function", function: { name: "get_weather" } },
    });
    expect(parsed.tool_choice).toEqual({
      type: "function",
      function: { name: "get_weather" },
    });
  });

  it("still strips unknown top-level fields (DLP posture)", () => {
    const parsed = ChatRequestSchema.parse({
      messages: [{ role: "user", content: "hi" }],
      smuggle_channel: "CAGE code 1ABC2",
    });
    expect(parsed).not.toHaveProperty("smuggle_channel");
  });

  it("rejects tool_calls with non-string arguments", () => {
    const result = ChatRequestSchema.safeParse({
      messages: [
        {
          role: "assistant",
          content: null,
          tool_calls: [{ function: { name: "f", arguments: 42 } }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("still rejects a body without messages", () => {
    expect(ChatRequestSchema.safeParse({ model: "gpt-4o" }).success).toBe(false);
  });
});

// ── Redaction preserves tool fields ─────────────────────────────────────────

describe("redactMessages with tool fields", () => {
  it("keeps tool_calls and tool_call_id on redacted messages", () => {
    const messages = [
      {
        role: "assistant",
        content: "Patient SSN 123-45-6789 noted",
        tool_calls: [TOOL_CALL],
      },
      { role: "tool", tool_call_id: "call_1", content: "ok" },
    ];
    const redacted = redactMessages(messages, ["SSN (Social Security Number)"]);
    expect(redacted[0]?.content).not.toContain("123-45-6789");
    expect((redacted[0] as { tool_calls?: unknown[] }).tool_calls).toEqual([TOOL_CALL]);
    expect((redacted[1] as { tool_call_id?: string }).tool_call_id).toBe("call_1");
  });
});

// ── Request-path argument scanning ──────────────────────────────────────────

describe("tool-call argument scanning", () => {
  it("toolCallArgText collects every arguments string", () => {
    expect(toolCallArgText(TOOL_CONVERSATION)).toBe('{"city":"Boston"}');
    expect(toolCallArgText([{ role: "user", content: "hi" }])).toBe("");
  });

  it("detects CUI hidden in tool_call arguments", () => {
    const messages = [
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_2",
            type: "function",
            function: { name: "save_note", arguments: '{"note":"CAGE code 1ABC2"}' },
          },
        ],
      },
    ];
    const argText = toolCallArgText(messages);
    const scan = scanMessages([...messages, { role: "tool", content: argText }]);
    expect(scan.risk_level).toBe("CRITICAL");
    expect(scan.entities.map((e) => e.pattern_name)).toContain("CAGE code");
  });

  it("blocks the request when tool_call arguments contain CUI", async () => {
    const cuiMessages = [
      { role: "user", content: "Save this note" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_3",
            type: "function",
            function: { name: "save_note", arguments: '{"note":"CAGE code 1ABC2"}' },
          },
        ],
      },
    ];
    const ctx = makeCtx({ messages: cuiMessages });
    const { res, state } = stubRes();
    await runOODALoop(ctx, res);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.status).toBe(403);
  });
});

// ── Upstream forward round-trip ─────────────────────────────────────────────

describe("upstream forward", () => {
  it("forwards tools, tool_choice, and tool messages verbatim", async () => {
    const ctx = makeCtx();
    const { res, state } = stubRes();
    await runOODALoop(ctx, res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const sent = JSON.parse(init.body) as {
      messages: Array<Record<string, unknown>>;
      tools: unknown;
      tool_choice: unknown;
      model: string;
    };

    expect(sent.model).toBe("gpt-4o");
    expect(sent.tools).toEqual(TOOLS);
    expect(sent.tool_choice).toBe("auto");
    expect(sent.messages[2]?.tool_calls).toEqual([TOOL_CALL]);
    expect(sent.messages[3]?.tool_call_id).toBe("call_1");
    expect(sent.messages[3]?.name).toBe("get_weather");
    expect(state.status).toBe(200);
  });
});

// ── Response-path tool-argument gate ────────────────────────────────────────

describe("response-path tool-argument gate", () => {
  it("flags CUI in upstream tool_call arguments via name-only headers", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        id: "chatcmpl-resp",
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_9",
                  type: "function",
                  function: {
                    name: "save_note",
                    arguments: '{"note":"CAGE code 9ZYX8"}',
                  },
                },
              ],
            },
          },
        ],
      }),
      body: null,
    });
    const ctx = makeCtx();
    const { res, headers, state } = stubRes();
    await runOODALoop(ctx, res);

    expect(state.status).toBe(200); // surfaced, never blocked
    expect(headers["X-HoundShield-Response-Risk"]).toBe("CRITICAL");
    expect(headers["X-HoundShield-Response-Patterns"]).toBe("CAGE code");
    // Name-only contract: matched substring never appears in headers
    expect(JSON.stringify(headers)).not.toContain("9ZYX8");
  });

  it("sets no response-gate headers when arguments are clean", async () => {
    const ctx = makeCtx();
    const { res, headers } = stubRes();
    await runOODALoop(ctx, res);
    expect(headers).not.toHaveProperty("X-HoundShield-Response-Risk");
    expect(headers).not.toHaveProperty("X-HoundShield-Response-Patterns");
  });
});
