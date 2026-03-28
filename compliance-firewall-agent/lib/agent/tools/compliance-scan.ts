// ============================================================================
// Compliance Scan Tool — Scan text through Kaelus compliance engine
// ============================================================================

import { ToolHandler } from '../types';
import toolRegistry from './registry';
import { classifyRisk } from '../../classifier/risk-engine';

const complianceScanTool: ToolHandler = {
  name: 'compliance_scan',
  description: 'Scan any text through the Kaelus compliance engine to detect PII (Personal Identifiable Information), sensitive data, security risks, and policy violations. Returns risk level, detected entities, and recommended actions. Use this to audit content before publishing, sending, or processing.',
  category: 'compliance',
  icon: 'Shield',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text content to scan for compliance issues',
      },
      context: {
        type: 'string',
        description: 'Optional context about the text purpose (e.g., "email to customer", "public blog post", "internal report")',
      },
    },
    required: ['text'],
  },
  execute: async (args) => {
    const text = args.text as string;
    const context = (args.context as string) || 'general';

    if (!text || text.trim().length === 0) {
      return { success: false, result: 'No text provided to scan.' };
    }

    try {
      const scanResult = await classifyRisk(text);

      const riskEmoji: Record<string, string> = {
        NONE: '',
        LOW: '',
        MEDIUM: '',
        HIGH: '',
        CRITICAL: '',
      };

      const output: string[] = [
        `️ **Kaelus Compliance Scan Report**`,
        `Context: ${context}`,
        '',
        `**Risk Level:** ${riskEmoji[scanResult.risk_level] || ''} ${scanResult.risk_level}`,
        `**Confidence:** ${(scanResult.confidence * 100).toFixed(1)}%`,
        `**Action:** ${scanResult.should_block ? ' BLOCK' : scanResult.should_quarantine ? '️ QUARANTINE' : ' ALLOW'}`,
        '',
      ];

      if (scanResult.classifications.length > 0) {
        output.push(`**Classifications:** ${scanResult.classifications.join(', ')}`);
      }

      if (scanResult.entities.length > 0) {
        output.push('');
        output.push(`**Detected Entities (${scanResult.entities.length}):**`);
        for (const entity of scanResult.entities) {
          output.push(`  • **${entity.type}**: ${entity.value_redacted} (confidence: ${(entity.confidence * 100).toFixed(0)}%, pattern: ${entity.pattern_matched})`);
        }
      }

      if (scanResult.matched_rules.length > 0) {
        output.push('');
        output.push(`**Matched Rules:** ${scanResult.matched_rules.join(', ')}`);
      }

      output.push('');
      output.push('---');
      output.push(`Scanned ${text.length} characters | ${new Date().toISOString()}`);

      return {
        success: true,
        result: output.join('\n'),
        metadata: {
          riskLevel: scanResult.risk_level,
          entitiesFound: scanResult.entities.length,
          blocked: scanResult.should_block,
          quarantined: scanResult.should_quarantine,
        },
      };
    } catch (error) {
      return {
        success: false,
        result: `Compliance scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

toolRegistry.register(complianceScanTool);
export default complianceScanTool;
