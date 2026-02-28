// ============================================================================
// Kaelus Agentic AI — Type System
// ============================================================================

export type AgentEventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'content'
  | 'usage'
  | 'done'
  | 'error'
  | 'compliance_block'
  | 'step_start'
  | 'step_end';

export interface AgentStreamEvent {
  type: AgentEventType;
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  callId?: string;
  result?: string;
  tokens?: { prompt: number; completion: number };
  cost?: number;
  totalSteps?: number;
  totalTokens?: number;
  message?: string;
  step?: number;
  maxSteps?: number;
  timestamp?: number;
}

// Tool definitions compatible with OpenRouter/OpenAI function calling
export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
  default?: unknown;
}

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolParameterSchema;
  };
}

export interface ToolHandler {
  name: string;
  description: string;
  category: 'research' | 'analysis' | 'coding' | 'compliance' | 'knowledge' | 'visualization';
  icon: string; // lucide icon name
  parameters: ToolParameterSchema;
  execute: (args: Record<string, unknown>) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  success: boolean;
  result: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    source?: string;
    dataType?: string;
    [key: string]: unknown;
  };
}

// OpenRouter API types for tool calling
export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface OpenRouterStreamDelta {
  role?: string;
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

export interface OpenRouterStreamChoice {
  index: number;
  delta: OpenRouterStreamDelta;
  finish_reason: string | null;
}

export interface OpenRouterStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenRouterStreamChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Agent configuration
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxIterations: number;
  tools: string[]; // tool names this agent can use
  category: 'enterprise' | 'technical' | 'custom';
  icon: string;
  color: string;
  exampleTasks: string[];
  isActive: boolean;
  conversations: number;
  createdAt: string;
}

// Agent execution state
export interface AgentExecutionStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'answer';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  tokens?: number;
  duration?: number;
  timestamp: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  status: 'running' | 'completed' | 'error' | 'stopped';
  steps: AgentExecutionStep[];
  totalTokens: number;
  totalCost: number;
  startTime: number;
  endTime?: number;
  messages: OpenRouterMessage[];
}

// Memory types
export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'preference' | 'insight' | 'document';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  tags: string[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'csv' | 'json' | 'markdown';
  size: number;
  addedAt: number;
  chunks?: string[]; // pre-chunked for search
}

// Chart types for generate-chart tool
export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'table';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

// Request/Response types for the API
export interface AgentExecuteRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  tools?: string[];
  agentId?: string;
  systemPrompt?: string;
  maxIterations?: number;
  temperature?: number;
}

// Model pricing (per 1M tokens)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'google/gemini-2.0-flash-exp:free': { input: 0, output: 0 },
  'meta-llama/llama-3.3-70b-instruct:free': { input: 0, output: 0 },
  'deepseek/deepseek-chat-v3-0324:free': { input: 0, output: 0 },
  'qwen/qwen-2.5-72b-instruct:free': { input: 0, output: 0 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
};

export const AGENT_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', provider: 'Google', free: true, supportsTools: true },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'Meta', free: true, supportsTools: true },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', provider: 'DeepSeek', free: true, supportsTools: true },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', provider: 'Qwen', free: true, supportsTools: true },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', free: false, supportsTools: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', free: false, supportsTools: true },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', free: false, supportsTools: true },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', free: false, supportsTools: true },
];
