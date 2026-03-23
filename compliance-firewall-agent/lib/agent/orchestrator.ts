// ============================================================================
// Kaelus Agent Orchestrator — The Beast AI Brain
// Advanced ReAct (Reason + Act) loop with streaming tool execution and multi-agent collaboration
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
import { memoryDNA } from './memory-dna';

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
  collaboration?: {
    enabled: boolean;
    agents: Array<{
      id: string;
      name: string;
      role: string;
      model: string;
      tools: string[];
    }>;
  };
}

// Parse streaming tool calls from deltas
interface PartialToolCall {
  id: string;
  name: string;
  arguments: string;
}

export async function executeAgentLoop(
  messages: OpenRouterMessage[],
  config: OrchestratorConfig
): Promise<void> {
  const { model, systemPrompt, tools, maxIterations, temperature, apiKey, onEvent } = config;

  // Initialize tools
  const toolDefinitions = toolRegistry.getDefinitions(tools);
  const hasTools = toolDefinitions.length > 0;

  // Build message history
  const conversationMessages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(systemPrompt, hasTools),
    },
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

      // Call OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://kaelus.online',
          'X-Title': 'Kaelus Agent',
        },
        body: JSON.stringify({
          model,
          messages: conversationMessages,
          temperature,
          stream: true,
          max_tokens: 4096,
          ...(hasTools ? {
            tools: toolDefinitions,
            tool_choice: 'auto',
            parallel_tool_calls: true,
          } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API Error ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorMsg;
        } catch { /* use default */ }

        onEvent({ type: 'error', message: errorMsg });
        return;
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        onEvent({ type: 'error', message: 'No response stream' });
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      const toolCalls: PartialToolCall[] = [];
      let finishReason = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

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

            // Tool calls building up
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;

                // Initialize new tool call
                if (tc.id) {
                  while (toolCalls.length <= idx) {
                    toolCalls.push({ id: '', name: '', arguments: '' });
                  }
                  toolCalls[idx].id = tc.id;
                }

                if (tc.function?.name) {
                  if (!toolCalls[idx]) toolCalls[idx] = { id: '', name: '', arguments: '' };
                  toolCalls[idx].name = tc.function.name;
                }

                if (tc.function?.arguments) {
                  if (!toolCalls[idx]) toolCalls[idx] = { id: '', name: '', arguments: '' };
                  toolCalls[idx].arguments += tc.function.arguments;
                }
              }
            }

            if (choice.finish_reason) {
              finishReason = choice.finish_reason;
            }

            // Capture usage
            if (chunk.usage) {
              totalPromptTokens += chunk.usage.prompt_tokens || 0;
              totalCompletionTokens += chunk.usage.completion_tokens || 0;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Add assistant message to conversation
      const assistantMessage: OpenRouterMessage = {
        role: 'assistant',
        content: assistantContent || null,
      };

      if (toolCalls.length > 0) {
        assistantMessage.tool_calls = toolCalls.map(tc => ({
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        }));
      }

      conversationMessages.push(assistantMessage);

      // If model wants to call tools
      if (finishReason === 'tool_calls' && toolCalls.length > 0) {
        // Execute each tool call
        for (const tc of toolCalls) {
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.arguments || '{}');
          } catch {
            parsedArgs = { raw: tc.arguments };
          }

          onEvent({
            type: 'tool_call',
            tool: tc.name,
            args: parsedArgs,
            callId: tc.id,
          });

          // Execute the tool
          const result = await toolRegistry.execute(tc.name, parsedArgs);

          onEvent({
            type: 'tool_result',
            callId: tc.id,
            tool: tc.name,
            result: result.result,
            content: result.success ? '✅' : '❌',
          });

          // Add tool result to conversation
          conversationMessages.push({
            role: 'tool',
            tool_call_id: tc.id || `call_${Date.now()}`,
            content: result.result,
          });
        }

        onEvent({
          type: 'step_end',
          step: iteration,
          content: `Completed ${toolCalls.length} tool call(s)`,
        });

        // Continue the loop — model will process tool results
        continue;
      }

      // No tool calls — this is the final answer
      onEvent({ type: 'step_end', step: iteration });

      // Calculate cost
      const pricing = MODEL_PRICING[model] || { input: 0, output: 0 };
      const cost = (totalPromptTokens * pricing.input + totalCompletionTokens * pricing.output) / 1_000_000;

      onEvent({
        type: 'usage',
        tokens: { prompt: totalPromptTokens, completion: totalCompletionTokens },
        cost,
      });

      // Save execution to memory
      if (config.sessionId) {
        agentMemory.addExecution({
          id: `exec_${Date.now()}`,
          agentName: 'Agent',
          task: messages[messages.length - 1]?.content || '',
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

      return; // Done!
    }

    // Hit max iterations
    onEvent({
      type: 'error',
      message: `Agent reached maximum iterations (${maxIterations}). The task may need to be broken into smaller steps.`,
    });

  } catch (error) {
    onEvent({
      type: 'error',
      message: `Agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

function buildSystemPrompt(userSystemPrompt: string, hasTools: boolean): string {
  const toolSection = hasTools ? `

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
3. Call the tool with proper arguments
4. Analyze the results
5. Continue reasoning or provide your answer

You can call multiple tools in sequence to solve complex problems. Each tool call should have a clear purpose.` : '';

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
