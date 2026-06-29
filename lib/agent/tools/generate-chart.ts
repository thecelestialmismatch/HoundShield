// ============================================================================
// Generate Chart Tool — Create chart data for client-side rendering
// Returns structured chart data that the UI renders as SVG charts
// ============================================================================

import { ToolHandler, ChartData } from '../types';
import toolRegistry from './registry';

const generateChartTool: ToolHandler = {
  name: 'generate_chart',
  description: 'Generate chart/graph data for visualization. Supports bar charts, line charts, pie charts, doughnut charts, area charts, and data tables. Provide labels and data values. The chart will be rendered in the agent workspace. Use this to visualize data analysis results, comparisons, trends, and distributions.',
  category: 'visualization',
  icon: 'BarChart3',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Chart type',
        enum: ['bar', 'line', 'pie', 'doughnut', 'area', 'table'],
      },
      title: {
        type: 'string',
        description: 'Chart title',
      },
      labels: {
        type: 'string',
        description: 'Comma-separated labels for the x-axis or categories (e.g., "Jan,Feb,Mar,Apr,May")',
      },
      datasets: {
        type: 'string',
        description: 'JSON array of datasets. Each dataset: {"label":"Series Name","data":[1,2,3,4,5],"color":"#6366f1"}. For single series, use: [{"label":"Sales","data":[10,20,30]}]',
      },
    },
    required: ['type', 'title', 'labels', 'datasets'],
  },
  execute: async (args) => {
    const chartType = args.type as ChartData['type'];
    const title = args.title as string;
    const labelsStr = args.labels as string;
    const datasetsStr = args.datasets as string;

    try {
      const labels = labelsStr.split(',').map(l => l.trim());

      let datasets: ChartData['datasets'];
      try {
        datasets = JSON.parse(datasetsStr);
      } catch {
        // Try to parse as simple comma-separated values
        const values = datasetsStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        datasets = [{ label: 'Data', data: values }];
      }

      // Validate
      if (labels.length === 0) {
        return { success: false, result: 'No labels provided. Provide comma-separated labels.' };
      }
      if (datasets.length === 0) {
        return { success: false, result: 'No datasets provided.' };
      }

      // Assign default colors
      const defaultColors = [
        '#6366f1', '#8b5cf6', '#a78bfa', '#10b981',
        '#f59e0b', '#ef4444', '#06b6d4', '#ec4899',
      ];
      datasets = datasets.map((ds, i) => ({
        ...ds,
        color: ds.color || defaultColors[i % defaultColors.length],
      }));

      const chartData: ChartData = { type: chartType, title, labels, datasets };

      // Generate text representation for the AI to reference
      const textRepresentation: string[] = [
        ` **Chart: ${title}** (${chartType})`,
        '',
      ];

      if (chartType === 'table') {
        // Render as markdown table
        const header = '| Category | ' + datasets.map(ds => ds.label).join(' | ') + ' |';
        const separator = '| --- | ' + datasets.map(() => '---').join(' | ') + ' |';
        const rows = labels.map((label, i) =>
          '| ' + label + ' | ' + datasets.map(ds => {
            const val = ds.data[i];
            return val !== undefined ? (Number.isInteger(val) ? String(val) : val.toFixed(2)) : '-';
          }).join(' | ') + ' |'
        );
        textRepresentation.push(header, separator, ...rows);
      } else {
        // Summary statistics
        for (const ds of datasets) {
          const values = ds.data.filter(v => !isNaN(v));
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);

          textRepresentation.push(`**${ds.label}:** min=${min}, max=${max}, avg=${avg.toFixed(2)}, total=${sum.toFixed(2)}`);
        }

        textRepresentation.push('');
        textRepresentation.push('Data points:');
        labels.forEach((label, i) => {
          const values = datasets.map(ds => `${ds.label}: ${ds.data[i] ?? '-'}`).join(', ');
          textRepresentation.push(`  ${label}: ${values}`);
        });
      }

      // Include chart data as JSON for client-side rendering
      textRepresentation.push('');
      textRepresentation.push(`<!--CHART_DATA:${JSON.stringify(chartData)}:CHART_DATA-->`);

      return {
        success: true,
        result: textRepresentation.join('\n'),
        metadata: {
          dataType: 'chart',
          chartType,
          dataPoints: labels.length,
          series: datasets.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        result: `Chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

toolRegistry.register(generateChartTool);
export default generateChartTool;
