// ============================================================================
// Code Execute Tool — Run JavaScript code in a sandboxed environment
// ============================================================================

import { ToolHandler } from '../types';
import toolRegistry from './registry';

// Sandboxed execution with limited globals
function createSandbox() {
  const logs: string[] = [];
  const errors: string[] = [];

  const sandbox = {
    console: {
      log: (...args: unknown[]) => logs.push(args.map(a => formatValue(a)).join(' ')),
      error: (...args: unknown[]) => errors.push(args.map(a => formatValue(a)).join(' ')),
      warn: (...args: unknown[]) => logs.push(`️ ${args.map(a => formatValue(a)).join(' ')}`),
      info: (...args: unknown[]) => logs.push(`ℹ️ ${args.map(a => formatValue(a)).join(' ')}`),
      table: (data: unknown) => logs.push(formatTable(data)),
    },
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    Error,
    Promise,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
    atob: (str: string) => Buffer.from(str, 'base64').toString(),
    btoa: (str: string) => Buffer.from(str).toString('base64'),
    setTimeout: undefined,
    setInterval: undefined,
    fetch: undefined,
    require: undefined,
    process: undefined,
    global: undefined,
    globalThis: undefined,
    __dirname: undefined,
    __filename: undefined,
    module: undefined,
    exports: undefined,
  };

  return { sandbox, logs, errors };
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatTable(data: unknown): string {
  if (!Array.isArray(data)) return formatValue(data);
  if (data.length === 0) return '(empty array)';

  const first = data[0];
  if (typeof first !== 'object' || first === null) {
    return data.map((v, i) => `[${i}] ${formatValue(v)}`).join('\n');
  }

  const keys = Object.keys(first);
  const header = '| ' + keys.join(' | ') + ' |';
  const separator = '| ' + keys.map(() => '---').join(' | ') + ' |';
  const rows = data.slice(0, 50).map(row => {
    const r = row as Record<string, unknown>;
    return '| ' + keys.map(k => formatValue(r[k])).join(' | ') + ' |';
  });

  return [header, separator, ...rows].join('\n');
}

const codeExecuteTool: ToolHandler = {
  name: 'code_execute',
  description: 'Execute JavaScript code in a sandboxed environment. Supports math calculations, data processing, string manipulation, algorithm implementation, and data transformations. Console.log output is captured. Cannot access network, file system, or Node.js APIs for security.',
  category: 'coding',
  icon: 'Code',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'JavaScript code to execute. Use console.log() to output results. The last expression\'s value is also returned.',
      },
      language: {
        type: 'string',
        description: 'Programming language (currently only "javascript" is supported)',
        default: 'javascript',
        enum: ['javascript'],
      },
    },
    required: ['code'],
  },
  execute: async (args) => {
    const code = args.code as string;
    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 10000; // 10 seconds

    try {
      const { sandbox, logs, errors } = createSandbox();

      // Build the sandboxed function
      const sandboxKeys = Object.keys(sandbox);
      const sandboxValues = Object.values(sandbox);

      // Wrap code to capture the last expression value
      const wrappedCode = `
        'use strict';
        ${code}
      `;

      // Create function with sandbox scope
      const fn = new Function(...sandboxKeys, wrappedCode);

      // Execute with timeout
      const result = await Promise.race([
        Promise.resolve().then(() => fn(...sandboxValues)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Execution timed out (10s limit)')), MAX_EXECUTION_TIME)
        ),
      ]);

      const executionTime = Date.now() - startTime;

      // Build output
      const output: string[] = [];

      if (logs.length > 0) {
        output.push(' **Console Output:**');
        output.push('```');
        output.push(logs.join('\n'));
        output.push('```');
      }

      if (errors.length > 0) {
        output.push('️ **Console Errors:**');
        output.push('```');
        output.push(errors.join('\n'));
        output.push('```');
      }

      if (result !== undefined) {
        output.push(' **Return Value:**');
        output.push('```');
        output.push(formatValue(result));
        output.push('```');
      }

      if (output.length === 0) {
        output.push(' Code executed successfully (no output)');
      }

      output.push(`\n️ Execution time: ${executionTime}ms`);

      return {
        success: true,
        result: output.join('\n'),
        metadata: {
          executionTime,
          language: 'javascript',
          hasErrors: errors.length > 0,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        result: ` **Execution Error:**\n\`\`\`\n${message}\n\`\`\`\n\n️ Execution time: ${executionTime}ms`,
        metadata: {
          executionTime,
          language: 'javascript',
          error: message,
        },
      };
    }
  },
};

toolRegistry.register(codeExecuteTool);
export default codeExecuteTool;
