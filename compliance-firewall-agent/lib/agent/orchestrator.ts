// ============================================================================
// Kaelus Agent Orchestrator — ReAct Loop v2
//
// Evolution highlights:
//
//   • Parallel tool execution — when the model requests multiple tools in one
//     turn, they now run concurrently via Promise.allSettled instead of
//     serially. This can cut multi-tool turns from N×latency to max(latency).
//
//   • Per-tool timeout — every tool call is raced against a configurable
//     deadline (default 30s). Timed-out tools return a structured error result
//     rather than hanging the entire turn.
//
//   • Provider retry with exponential backoff — 429 (rate-limit) and 500/503
//     responses from OpenRouter are retried up to 3 times before failing.
//
//   • Structured error isolation — a failed tool call no longer crashes the
//     agent loop. The error is surfaced as a tool_result event and the model
//     can decide how to proceed.
// ============================================================================

import {
  AgentStreamEvent,
  OpenRouterMessage,
  OpenRouterStreamChunk,
  OpenRouterToolCall,
  MODEL_PRICING,
} from './types';
import { toolRegistry } from './tools/index';
import { agentMemory } from './memory';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Maximum time to wait for a single tool call to complete. */
const TOOL_TIMEOUT_MS = 30_000;

/** Exponential backoff delays (ms) for 429/5xx retries from OpenRouter. */
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrchestratorConfig {
  model: string;
  systemPrompt: string;
  tools?: string[];
  maxIterations: number;
  temperature: number;
  apiKey: string;
  sessionId?: string;
  onEvent: (event: AgentStreamEvent) => void;
  agentId?: string;
}

interface PartialToolCall {
  id: string;
  name: string;
  arguments: string;
}

// ---------------------------------------------------------------------------
// Provider fetch with retry
// ---------------------------------------------------------------------------

async function fetchOpenRouter(
  body: string,
  apiKey: string,
  maxRetries = 3
): Promise<Response> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://kaelus.online',
      'X-Title': 'Kaelus Agent',
    },
    body,
  };

  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
        continue;
      }
      throw err;
    }

    // Retry on rate-limit or transient server errors
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      lastResponse = response;
      const retryAfterSec = parseInt(response.headers.get('retry-after') ?? '0', 10);
      const waitMs = retryAfterSec > 0
        ? retryAfterSec * 1_000
        : RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      await sleep(waitMs);
      continue;
    }

    return response;
  }

  return lastResponse!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Tool execution with timeout
// ---------------------------------------------------------------------------

interface ToolCallOutcome {
  tc: PartialToolCall;
  parsedArgs: Record<string, unknown>;
  result: string;
  success: boolean;
  durationMs: number;
}

/**
 * Executes a single tool call with a hard timeout.
 * Never throws — errors are returned as a structured result string.
 */
async function executeToolCall(tc: PartialToolCall): Promise<ToolCallOutcome> {
  const start = Date.now();

  let parsedArgs: Record<string, unknown> = {};
  try {
    parsedArgs = JSON.parse(tc.arguments || '{}');
  } catch {
    parsedArgs = { raw: tc.arguments };
  }

  const timeoutPromise = sleep(TOOL_TIMEOUT_MS).then(() => {
    throw new Error(`Tool '${tc.name}' timed out after ${TOOL_TIMEOUT_MS}ms`);
  });

  try {
    const outcome = await Promise.race([
      toolRegistry.execute(tc.name, parsedArgs),
      timeoutPromise,
    ]);

    return {
      tc,
      parsedArgs,
      result: outcome.result,
      success: outcome.success,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    return {
      tc,
      parsedArgs,
      result: `Error: ${message}`,
      success: false,
      durationMs: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// Main agent loop
// ---------------------------------------------------------------------------

export async function executeAgentLoop(
  messages: OpenRouterMessage[],
  config: OrchestratorConfig
): Promise<void> {
  const {
    model,
    systemPrompt,
    tools,
    maxIterations,
    temperature,
    apiKey,
    onEvent,
  } = config;

  const toolDefinitions = toolRegistry.getDefinitions(tools);
  const hasTools = toolDefinitions.length > 0;

  const conversationMessages: OpenRouterMessage[] = [
    { role: 'system', content: buildSystemPrompt(systemPrompt, hasTools) },
    ...messages,
  ];

  let iteration = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  try {
    while (iteration < maxIterations) {
      iteration++;

      onEvent({
        type: 'step_start',
        step: iteration,
        maxSteps: maxIterations,
        timestamp: Date.now(),
      });

      // ── Call OpenRouter (with retry) ──────────────────────────────────────
      const requestBody = JSON.stringify({
        model,
        messages: conversationMessages,
        temperature,
        stream: true,
        max_tokens: 4096,
        ...(hasTools
          ? {
              tools: toolDefinitions,
              tool_choice: 'auto',
              parallel_tool_calls: true,
            }
          : {}),
      });

      const response = await fetchOpenRouter(requestBody, apiKey);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMsg = `API Error ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message ?? errorMsg;
        } catch { /* use default */ }
        onEvent({ type: 'error', message: errorMsg });
        return;
      }

      // ── Process streaming response ────────────────────────────────────────
      const reader = response.body?.getReader();
      if (!reader) {
        onEvent({ type: 'error', message: 'No response stream' });
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      const toolCalls: PartialToolCall[] = [];
      let finishReason = '';
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const chunk: OpenRouterStreamChunk = JSON.parse(data);
            const choice = chunk.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta;

            // Content tokens
            if (delta.content) {
              assistantContent += delta.content;
              onEvent({
                type: iteration === 1 && toolCalls.length === 0 ? 'thinking' : 'content',
                content: delta.content,
              });
            }

            // Accumulate parallel tool call fragments
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                while (toolCalls.length <= idx) {
                  toolCalls.push({ id: '', name: '', arguments: '' });
                }
                if (tc.id) toolCalls[idx].id = tc.id;
                if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
              }
            }

            if (choice.finish_reason) finishReason = choice.finish_reason;

            if (chunk.usage) {
              totalPromptTokens += chunk.usage.prompt_tokens ?? 0;
              totalCompletionTokens += chunk.usage.completion_tokens ?? 0;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Add assistant message to conversation history
      const assistantMessage: OpenRouterMessage = {
        role: 'assistant',
        content: assistantContent || null,
      };
      if (toolCalls.length > 0) {
        assistantMessage.tool_calls = toolCalls.map((tc) => ({
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        }));
      }
      conversationMessages.push(assistantMessage);

      // ── Execute tool calls in parallel ────────────────────────────────────
      if (finishReason === 'tool_calls' && toolCalls.length > 0) {
        // Emit tool_call events before parallel execution begins
        for (const tc of toolCalls) {
          let parsedArgs: Record<string, unknown> = {};
          try { parsedArgs = JSON.parse(tc.arguments || '{}'); } catch { /* ignore */ }
          onEvent({
            type: 'tool_call',
            tool: tc.name,
            args: parsedArgs,
            callId: tc.id,
          });
        }

        // Run all tools concurrently; individual failures are isolated
        const outcomes = await Promise.allSettled(
          toolCalls.map((tc) => executeToolCall(tc))
        );

        for (let i = 0; i < outcomes.length; i++) {
          const settled = outcomes[i];
          const tc = toolCalls[i];
          const callId = tc.id || `call_${Date.now()}`;

          let resultContent: string;
          if (settled.status === 'fulfilled') {
            const o = settled.value;
            resultContent = o.result;
            onEvent({
              type: 'tool_result',
              callId,
              tool: tc.name,
              result: o.result,
              content: '',
            });
          } else {
            const msg = settled.reason instanceof Error
              ? settled.reason.message
              : 'Tool execution failed';
            resultContent = `Error: ${msg}`;
            onEvent({
              type: 'tool_result',
              callId,
              tool: tc.name,
              result: resultContent,
              content: '',
            });
          }

          conversationMessages.push({
            role: 'tool',
            tool_call_id: callId,
            content: resultContent,
          });
        }

        onEvent({
          type: 'step_end',
          step: iteration,
          content: `Completed ${toolCalls.length} tool call(s) in parallel`,
        });

        // Continue loop so the model can process tool results
        continue;
      }

      // ── Final answer — no more tool calls ────────────────────────────────
      onEvent({ type: 'step_end', step: iteration });

      const pricing = MODEL_PRICING[model] ?? { input: 0, output: 0 };
      const cost =
        (totalPromptTokens * pricing.input +
          totalCompletionTokens * pricing.output) /
        1_000_000;

      onEvent({
        type: 'usage',
        tokens: { prompt: totalPromptTokens, completion: totalCompletionTokens },
        cost,
      });

      if (config.sessionId) {
        agentMemory.addExecution({
          id: `exec_${Date.now()}`,
          agentName: 'Agent',
          task: messages[messages.length - 1]?.content ?? '',
          result: assistantContent.slice(0, 200),
          timestamp: Date.now(),
          tokens: totalPromptTokens + totalCompletionTokens,
          cost,
        });
      }

      onEvent({
        type: 'done',
        totalSteps: iteration,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        cost,
      });

      return;
    }

    // Hit max iterations
    onEvent({
      type: 'error',
      message: `Agent reached maximum iterations (${maxIterations}). Break the task into smaller steps.`,
    });
  } catch (error) {
    onEvent({
      type: 'error',
      message: `Agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(userSystemPrompt: string, hasTools: boolean): string {
  const toolSection = hasTools
    ? `

## Tool Usage
You have access to powerful tools. Use them proactively to help the user:
- Search the web for current information when needed
- Browse specific URLs to read content
- Execute code for calculations and data processing
- Analyze files and data
- Query datasets with SQL-like syntax
- Scan text for compliance issues
- Generate charts for data visualization
- Store and search the knowledge base

When using tools:
1. Think about what information you need
2. Select the right tool for the task
3. Call the tool with proper arguments — you may call multiple tools in parallel
4. Analyze the results
5. Continue reasoning or provide your answer

You can call multiple tools in a single turn. They will execute concurrently.`
    : '';

  const memoryContext = agentMemory.buildContextSummary();

  return `${userSystemPrompt}
${toolSection}

## Response Guidelines
- Be thorough and comprehensive in your analysis
- Use structured formatting (headers, bullet points, tables) for clarity
- When doing research, synthesize information from multiple sources
- Provide actionable insights and recommendations
- If you need more information, use your tools to find it
- Always cite your sources when using web search/browse
- For data analysis, show your methodology and key findings
- Generate charts when visualizing data would help understanding
${memoryContext}`;
}

export default executeAgentLoop;
