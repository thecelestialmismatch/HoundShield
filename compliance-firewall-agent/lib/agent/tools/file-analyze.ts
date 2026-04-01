// ============================================================================
// File Analyze Tool — Parse and analyze uploaded file content
// Supports CSV, JSON, text, and markdown
// ============================================================================

import { ToolHandler } from '../types';
import toolRegistry from './registry';

function parseCSV(content: string): { headers: string[]; rows: string[][]; summary: string } {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [], summary: 'Empty CSV' };

  // Detect delimiter
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : semiCount > commaCount ? ';' : ',';

  const headers = lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1)
    .filter(line => line.trim())
    .map(line => line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim()));

  // Generate summary statistics for numeric columns
  const stats: string[] = [];
  for (let col = 0; col < headers.length; col++) {
    const values = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    if (values.length > rows.length * 0.5) { // Mostly numeric column
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      stats.push(`  ${headers[col]}: min=${min}, max=${max}, avg=${avg.toFixed(2)}, sum=${sum.toFixed(2)}`);
    }
  }

  const summary = [
    `Rows: ${rows.length}`,
    `Columns: ${headers.length} (${headers.join(', ')})`,
    stats.length > 0 ? `Numeric Statistics:\n${stats.join('\n')}` : '',
  ].filter(Boolean).join('\n');

  return { headers, rows, summary };
}

function parseJSON(content: string): string {
  try {
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      const count = data.length;
      const sample = data.slice(0, 3);
      const keys = count > 0 && typeof data[0] === 'object' ? Object.keys(data[0]) : [];

      return [
        `Type: Array with ${count} items`,
        keys.length > 0 ? `Fields: ${keys.join(', ')}` : '',
        `\nSample (first ${Math.min(3, count)} items):`,
        '```json',
        JSON.stringify(sample, null, 2),
        '```',
      ].filter(Boolean).join('\n');
    }

    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      const nested = keys.filter(k => typeof data[k] === 'object');

      return [
        `Type: Object with ${keys.length} keys`,
        `Keys: ${keys.join(', ')}`,
        nested.length > 0 ? `Nested objects: ${nested.join(', ')}` : '',
        '\nPreview:',
        '```json',
        JSON.stringify(data, null, 2).slice(0, 3000),
        '```',
      ].filter(Boolean).join('\n');
    }

    return `Type: ${typeof data}\nValue: ${String(data)}`;
  } catch (e) {
    return `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`;
  }
}

function analyzeText(content: string): string {
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const chars = content.length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(w => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lower.length > 3) {
      wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1);
    }
  });
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => `${word} (${count})`);

  return [
    ` **Text Analysis:**`,
    `• Characters: ${chars.toLocaleString()}`,
    `• Words: ${words.length.toLocaleString()}`,
    `• Lines: ${lines.length.toLocaleString()}`,
    `• Sentences: ${sentences.length}`,
    `• Paragraphs: ${paragraphs.length}`,
    `• Avg words/sentence: ${(words.length / Math.max(sentences.length, 1)).toFixed(1)}`,
    '',
    ` **Top Words:** ${topWords.join(', ')}`,
    '',
    ` **Preview (first 500 chars):**`,
    content.slice(0, 500),
    content.length > 500 ? '...' : '',
  ].join('\n');
}

const fileAnalyzeTool: ToolHandler = {
  name: 'file_analyze',
  description: 'Analyze and parse file content. Supports CSV data (with statistics), JSON (with structure analysis), plain text (with word counts and frequency analysis), and Markdown. Provide the file content as a string.',
  category: 'analysis',
  icon: 'FileText',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The file content to analyze (text, CSV, JSON, or Markdown)',
      },
      filename: {
        type: 'string',
        description: 'Original filename to help detect format (e.g., "data.csv", "config.json")',
      },
      format: {
        type: 'string',
        description: 'File format: "csv", "json", "text", or "auto" to detect automatically',
        default: 'auto',
        enum: ['csv', 'json', 'text', 'auto'],
      },
    },
    required: ['content'],
  },
  execute: async (args) => {
    const content = args.content as string;
    const filename = (args.filename as string) || '';
    let format = (args.format as string) || 'auto';

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        result: 'No content provided. Please provide file content to analyze.',
      };
    }

    // Auto-detect format
    if (format === 'auto') {
      if (filename.endsWith('.csv') || filename.endsWith('.tsv')) {
        format = 'csv';
      } else if (filename.endsWith('.json')) {
        format = 'json';
      } else {
        // Try to detect from content
        const trimmed = content.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            JSON.parse(trimmed);
            format = 'json';
          } catch {
            format = 'text';
          }
        } else if (trimmed.includes(',') && trimmed.split('\n').length > 1) {
          const firstLine = trimmed.split('\n')[0];
          const commas = (firstLine.match(/,/g) || []).length;
          if (commas > 0 && commas === (trimmed.split('\n')[1]?.match(/,/g) || []).length) {
            format = 'csv';
          } else {
            format = 'text';
          }
        } else {
          format = 'text';
        }
      }
    }

    try {
      let result: string;

      switch (format) {
        case 'csv': {
          const { headers, rows, summary } = parseCSV(content);
          const preview = rows.slice(0, 5);
          const table = preview.map(row =>
            '| ' + row.map(c => c.slice(0, 30)).join(' | ') + ' |'
          );

          result = [
            ` **CSV Analysis** ${filename ? `(${filename})` : ''}`,
            '',
            summary,
            '',
            '**Data Preview (first 5 rows):**',
            '| ' + headers.join(' | ') + ' |',
            '| ' + headers.map(() => '---').join(' | ') + ' |',
            ...table,
            rows.length > 5 ? `\n... and ${rows.length - 5} more rows` : '',
          ].filter(Boolean).join('\n');
          break;
        }
        case 'json': {
          result = ` **JSON Analysis** ${filename ? `(${filename})` : ''}\n\n${parseJSON(content)}`;
          break;
        }
        default: {
          result = analyzeText(content);
          break;
        }
      }

      return {
        success: true,
        result,
        metadata: { format, filename, contentLength: content.length },
      };
    } catch (error) {
      return {
        success: false,
        result: `Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

toolRegistry.register(fileAnalyzeTool);
export default fileAnalyzeTool;
