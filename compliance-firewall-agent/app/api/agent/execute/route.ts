// ============================================================================
// Kaelus Agent Execute API — SSE Streaming Endpoint
// Accepts task, runs agentic ReAct loop, streams results
// ============================================================================

import { NextRequest } from 'next/server';
import { classifyRisk } from '@/lib/classifier/risk-engine';
import { executeAgentLoop } from '@/lib/agent/orchestrator';
import { AgentStreamEvent, AgentExecuteRequest } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body: AgentExecuteRequest = await req.json();
    const { messages, model, tools, systemPrompt, maxIterations = 10, temperature = 0.7 } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = req.headers.get('x-openrouter-key') || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'no_api_key', message: 'OpenRouter API key required. Set it in Settings.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Compliance scan on the latest user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      const scanResult = await classifyRisk(lastUserMsg.content);
      if (scanResult.should_block) {
        return new Response(
          JSON.stringify({
            error: 'compliance_block',
            message: `Message blocked by compliance engine: ${scanResult.classifications.join(', ')}`,
            scan: {
              risk_level: scanResult.risk_level,
              classifications: scanResult.classifications,
              entities: scanResult.entities.map(e => ({
                type: e.type,
                pattern: e.pattern_matched,
              })),
            },
          }),
          { status: 451, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Extended model mapping — 13 free + 5 paid
    const MODEL_MAP: Record<string, string> = {
      // Free models
      'gemini-flash': 'google/gemini-2.0-flash-exp:free',
      'llama-70b': 'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek-v3': 'deepseek/deepseek-chat-v3-0324:free',
      'qwen-72b': 'qwen/qwen-2.5-72b-instruct:free',
      'mistral-small': 'mistralai/mistral-small-3.1-24b-instruct:free',
      'gemma-27b': 'google/gemma-3-27b-it:free',
      'nemotron-70b': 'nvidia/llama-3.1-nemotron-70b-instruct:free',
      'phi-4': 'microsoft/phi-4-reasoning-plus:free',
      // Paid models
      'gpt-4o-mini': 'openai/gpt-4o-mini',
      'gpt-4o': 'openai/gpt-4o',
      'claude-sonnet': 'anthropic/claude-3.5-sonnet',
      'claude-haiku': 'anthropic/claude-3-haiku',
      'gemini-pro': 'google/gemini-2.5-pro-preview',
    };

    const resolvedModel = MODEL_MAP[model] || model;

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (event: AgentStreamEvent) => {
      try {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      } catch {
        // Stream closed
      }
    };

    const agentPromise = executeAgentLoop(
      messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      {
        model: resolvedModel,
        systemPrompt: systemPrompt || 'You are Kaelus AI, a powerful enterprise agentic assistant. You help users solve complex business problems with thorough analysis, research, and data processing.',
        tools,
        maxIterations: Math.min(maxIterations, 15),
        temperature,
        apiKey,
        onEvent: sendEvent,
      }
    );

    agentPromise
      .then(async () => {
        try {
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close();
        } catch { /* stream already closed */ }
      })
      .catch(async (error) => {
        try {
          await sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Agent execution failed',
          });
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close();
        } catch { /* stream already closed */ }
      });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET endpoint to retrieve available tools and models
export async function GET() {
  await import('@/lib/agent/tools/index');
  const { toolRegistry } = await import('@/lib/agent/tools/index');

  return new Response(
    JSON.stringify({
      tools: toolRegistry.getManifest(),
      models: [
        // Free
        { id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'Google', free: true },
        { id: 'llama-70b', name: 'Llama 3.3 70B', provider: 'Meta', free: true },
        { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', free: true },
        { id: 'qwen-72b', name: 'Qwen 2.5 72B', provider: 'Qwen', free: true },
        { id: 'mistral-small', name: 'Mistral Small 3.1', provider: 'Mistral', free: true },
        { id: 'gemma-27b', name: 'Gemma 3 27B', provider: 'Google', free: true },
        { id: 'nemotron-70b', name: 'Nemotron 70B', provider: 'NVIDIA', free: true },
        { id: 'phi-4', name: 'Phi-4 Reasoning+', provider: 'Microsoft', free: true },
        // Paid
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', free: false },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', free: false },
        { id: 'claude-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', free: false },
        { id: 'claude-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', free: false },
        { id: 'gemini-pro', name: 'Gemini 2.5 Pro', provider: 'Google', free: false },
      ],
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
