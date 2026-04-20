/**
 * Brain AI — Tool Definitions
 *
 * Formal tool definition schema compatible with OpenRouter / OpenAI function calling.
 * Brain AI original implementation for Hound Shield.
 */

export interface ToolParameterSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: string[];
  items?: ToolParameterSchema;
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterSchema>;
    required: string[];
  };
  returnsStream?: boolean;
  requiresAuth?: boolean;
}

// Default tool definitions (OpenAI function-calling compatible)
export const DEFAULT_TOOLS: ToolDefinition[] = [
  {
    name: "web-search",
    description: "Search the web for information using DuckDuckGo. Returns titles, URLs, and snippets.",
    category: "research",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        maxResults: { type: "number", description: "Maximum number of results (default: 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "web-browse",
    description: "Fetch and extract the text content of a web page.",
    category: "research",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to browse" },
      },
      required: ["url"],
    },
  },
  {
    name: "compliance-scan",
    description: "Scan text for CUI, PII, and compliance violations (CMMC/HIPAA/SOC2).",
    category: "compliance",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content to scan" },
        framework: {
          type: "string",
          enum: ["cmmc", "hipaa", "soc2", "all"],
          description: "Compliance framework to check against",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "code-execute",
    description: "Execute JavaScript code in a sandboxed environment.",
    category: "coding",
    requiresAuth: true,
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript code to execute" },
        timeout: { type: "number", description: "Execution timeout in ms (default: 5000)" },
      },
      required: ["code"],
    },
  },
  {
    name: "file-analyze",
    description: "Parse and analyze a JSON, CSV, or Markdown file.",
    category: "analysis",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "File content as a string" },
        fileType: {
          type: "string",
          enum: ["json", "csv", "markdown", "auto"],
          description: "File type (use auto to detect)",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "data-query",
    description: "Run SQL-like queries on JSON data arrays.",
    category: "analysis",
    parameters: {
      type: "object",
      properties: {
        data: { type: "array", description: "Array of objects to query" },
        query: { type: "string", description: "SQL-like query (SELECT, WHERE, ORDER BY, LIMIT)" },
      },
      required: ["data", "query"],
    },
  },
  {
    name: "generate-chart",
    description: "Generate Chart.js-compatible chart data for visualization.",
    category: "visualization",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["bar", "line", "pie", "doughnut", "area", "table"],
          description: "Chart type",
        },
        data: { type: "object", description: "Chart data (labels and datasets)" },
        title: { type: "string", description: "Chart title" },
      },
      required: ["type", "data"],
    },
  },
  {
    name: "knowledge-base",
    description: "Store, retrieve, and search compliance knowledge documents.",
    category: "knowledge",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["store", "retrieve", "search", "list"],
          description: "Action to perform",
        },
        content: { type: "string", description: "Content to store or search query" },
        id: { type: "string", description: "Document ID (for retrieve/delete)" },
        tags: { type: "array", description: "Tags for categorization" },
      },
      required: ["action"],
    },
  },
];

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return DEFAULT_TOOLS.find((t) => t.name === name);
}

export function getToolDefinitions(names?: string[]): ToolDefinition[] {
  if (!names) return DEFAULT_TOOLS;
  return DEFAULT_TOOLS.filter((t) => names.includes(t.name));
}

/**
 * Convert to OpenRouter/OpenAI function-calling format.
 */
export function toOpenRouterTools(defs: ToolDefinition[]): object[] {
  return defs.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}
