/**
 * Hound Shield Proxy — request body schemas.
 *
 * Zod strip mode is deliberate DLP posture: unknown fields cannot smuggle
 * content past the scanner. Every field a client legitimately needs forwarded
 * must be enumerated here — OpenAI tool-calling fields included, otherwise
 * function-calling traffic silently breaks (tools/tool_calls dropped).
 */

import { z } from "zod";

/** OpenAI tool call — `arguments` must be a string so the scanner can gate it. */
export const ToolCallSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

export const MessageSchema = z.object({
  role: z.string(),
  // Nullable/optional: assistant tool-call turns carry content: null in
  // OpenAI conversation history.
  content: z
    .union([z.string(), z.array(z.record(z.string(), z.unknown())), z.null()])
    .optional(),
  name: z.string().optional(),
  tool_calls: z.array(ToolCallSchema).optional(),
  tool_call_id: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(MessageSchema),
  stream: z.boolean().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  tools: z.array(z.record(z.string(), z.unknown())).optional(),
  tool_choice: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
});
