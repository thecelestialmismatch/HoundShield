// ============================================================================
// Hound Shield Agent Tool Registry
// Central registry for all agent tools — register, discover, execute
// ============================================================================

import { ToolHandler, ToolDefinition, ToolExecutionResult } from '../types';

class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();

  register(handler: ToolHandler): void {
    this.tools.set(handler.name, handler);
  }

  get(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getAll(): ToolHandler[] {
    return Array.from(this.tools.values());
  }

  getByCategory(category: ToolHandler['category']): ToolHandler[] {
    return this.getAll().filter(t => t.category === category);
  }

  // Get OpenRouter-compatible tool definitions
  getDefinitions(toolNames?: string[]): ToolDefinition[] {
    const tools = toolNames
      ? toolNames.map(n => this.tools.get(n)).filter(Boolean) as ToolHandler[]
      : this.getAll();

    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  // Get a manifest of all tools (for UI display)
  getManifest(): Array<{
    name: string;
    description: string;
    category: string;
    icon: string;
    parameters: string[];
  }> {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      icon: tool.icon,
      parameters: Object.keys(tool.parameters.properties),
    }));
  }

  // Execute a tool by name
  async execute(name: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        result: `Tool "${name}" not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
      };
    }

    const startTime = Date.now();
    try {
      const result = await tool.execute(args);
      result.metadata = {
        ...result.metadata,
        executionTime: Date.now() - startTime,
      };
      return result;
    } catch (error) {
      return {
        success: false,
        result: `Tool "${name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  }
}

// Singleton registry
const globalRegistry = globalThis as unknown as { __houndshield_tool_registry?: ToolRegistry };
if (!globalRegistry.__houndshield_tool_registry) {
  globalRegistry.__houndshield_tool_registry = new ToolRegistry();
}

export const toolRegistry: ToolRegistry = globalRegistry.__houndshield_tool_registry;
export default toolRegistry;
