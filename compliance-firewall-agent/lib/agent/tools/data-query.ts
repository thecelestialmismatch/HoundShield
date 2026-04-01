// ============================================================================
// Data Query Tool — SQL-like querying on JSON/CSV datasets
// ============================================================================

import { ToolHandler } from '../types';
import toolRegistry from './registry';

interface QueryOptions {
  select?: string[];
  where?: Array<{ field: string; op: string; value: unknown }>;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  groupBy?: string;
  limit?: number;
  aggregate?: Array<{ function: string; field: string; alias?: string }>;
}

function parseData(dataStr: string): Record<string, unknown>[] {
  const trimmed = dataStr.trim();

  // Try JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  }

  // Try CSV
  const lines = trimmed.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());

  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = values[i] || '';
      const num = Number(val);
      row[h] = val === '' ? null : !isNaN(num) && val !== '' ? num : val;
    });
    return row;
  });
}

function evaluateCondition(row: Record<string, unknown>, condition: { field: string; op: string; value: unknown }): boolean {
  const fieldValue = row[condition.field];
  const compareValue = condition.value;

  switch (condition.op) {
    case '=':
    case '==':
      return fieldValue == compareValue;
    case '===':
      return fieldValue === compareValue;
    case '!=':
    case '<>':
      return fieldValue != compareValue;
    case '>':
      return Number(fieldValue) > Number(compareValue);
    case '>=':
      return Number(fieldValue) >= Number(compareValue);
    case '<':
      return Number(fieldValue) < Number(compareValue);
    case '<=':
      return Number(fieldValue) <= Number(compareValue);
    case 'contains':
    case 'like':
      return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());
    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());
    case 'in':
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case 'isNull':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'isNotNull':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    default:
      return true;
  }
}

function executeQuery(data: Record<string, unknown>[], options: QueryOptions): Record<string, unknown>[] {
  let result = [...data];

  // WHERE
  if (options.where && options.where.length > 0) {
    result = result.filter(row =>
      options.where!.every(condition => evaluateCondition(row, condition))
    );
  }

  // GROUP BY with aggregation
  if (options.groupBy) {
    const groups = new Map<string, Record<string, unknown>[]>();
    result.forEach(row => {
      const key = String(row[options.groupBy!] || 'null');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });

    result = Array.from(groups.entries()).map(([key, rows]) => {
      const grouped: Record<string, unknown> = { [options.groupBy!]: key, _count: rows.length };

      if (options.aggregate) {
        for (const agg of options.aggregate) {
          const values = rows.map(r => Number(r[agg.field])).filter(v => !isNaN(v));
          const alias = agg.alias || `${agg.function}_${agg.field}`;

          switch (agg.function.toLowerCase()) {
            case 'sum':
              grouped[alias] = values.reduce((a, b) => a + b, 0);
              break;
            case 'avg':
              grouped[alias] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
              break;
            case 'min':
              grouped[alias] = values.length > 0 ? Math.min(...values) : null;
              break;
            case 'max':
              grouped[alias] = values.length > 0 ? Math.max(...values) : null;
              break;
            case 'count':
              grouped[alias] = rows.length;
              break;
          }
        }
      }

      return grouped;
    });
  }

  // ORDER BY
  if (options.orderBy) {
    const { field, direction } = options.orderBy;
    result.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) return 0;
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'desc' ? numB - numA : numA - numB;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return direction === 'desc' ? -comparison : comparison;
    });
  }

  // SELECT
  if (options.select && options.select.length > 0) {
    result = result.map(row => {
      const selected: Record<string, unknown> = {};
      options.select!.forEach(field => {
        if (field in row) selected[field] = row[field];
      });
      return selected;
    });
  }

  // LIMIT
  if (options.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}

function formatResults(results: Record<string, unknown>[]): string {
  if (results.length === 0) return 'No results found.';

  const keys = Object.keys(results[0]);

  // Format as markdown table
  const header = '| ' + keys.join(' | ') + ' |';
  const separator = '| ' + keys.map(() => '---').join(' | ') + ' |';
  const rows = results.slice(0, 100).map(row =>
    '| ' + keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'number') return Number.isInteger(val) ? String(val) : val.toFixed(2);
      return String(val).slice(0, 50);
    }).join(' | ') + ' |'
  );

  return [header, separator, ...rows].join('\n') +
    (results.length > 100 ? `\n\n... showing 100 of ${results.length} results` : '');
}

const dataQueryTool: ToolHandler = {
  name: 'data_query',
  description: 'Run SQL-like queries on JSON or CSV data. Supports SELECT, WHERE (with operators: =, !=, >, <, >=, <=, contains, startsWith, endsWith, in, isNull, isNotNull), ORDER BY, GROUP BY with aggregations (SUM, AVG, MIN, MAX, COUNT), and LIMIT. Provide data as a JSON array or CSV string.',
  category: 'analysis',
  icon: 'Database',
  parameters: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'The data to query — either a JSON array string or CSV text',
      },
      query: {
        type: 'string',
        description: 'JSON query object with optional: select (array of field names), where (array of {field, op, value}), orderBy ({field, direction}), groupBy (field name), aggregate (array of {function, field, alias}), limit (number). Example: {"where":[{"field":"age","op":">","value":25}],"orderBy":{"field":"name","direction":"asc"},"limit":10}',
      },
    },
    required: ['data', 'query'],
  },
  execute: async (args) => {
    const dataStr = args.data as string;
    const queryStr = args.query as string;

    try {
      const data = parseData(dataStr);
      if (data.length === 0) {
        return { success: false, result: 'No data to query. The dataset appears empty.' };
      }

      let queryOptions: QueryOptions;
      try {
        queryOptions = JSON.parse(queryStr);
      } catch {
        return {
          success: false,
          result: 'Invalid query JSON. Provide a valid JSON object with select, where, orderBy, groupBy, aggregate, and/or limit fields.',
        };
      }

      const results = executeQuery(data, queryOptions);
      const formatted = formatResults(results);

      return {
        success: true,
        result: [
          ` **Query Results** (${results.length} rows from ${data.length} total)`,
          '',
          formatted,
          '',
          `Available fields: ${Object.keys(data[0]).join(', ')}`,
        ].join('\n'),
        metadata: {
          totalRows: data.length,
          resultRows: results.length,
          fields: Object.keys(data[0]),
        },
      };
    } catch (error) {
      return {
        success: false,
        result: `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

toolRegistry.register(dataQueryTool);
export default dataQueryTool;
