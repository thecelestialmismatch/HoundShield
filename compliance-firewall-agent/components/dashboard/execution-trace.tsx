'use client';

import React from 'react';
import {
  Brain,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  DollarSign,
} from 'lucide-react';

export interface TraceStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'answer' | 'error';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  duration?: number;
  timestamp: number;
  status?: 'running' | 'complete' | 'error';
}

interface ExecutionTraceProps {
  steps: TraceStep[];
  isRunning: boolean;
  totalTokens: number;
  totalCost: number;
  currentStep: number;
  maxSteps: number;
}

export default function ExecutionTrace({
  steps,
  isRunning,
  totalTokens,
  totalCost,
  currentStep,
  maxSteps,
}: ExecutionTraceProps) {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStepIcon = (step: TraceStep) => {
    switch (step.type) {
      case 'thinking':
        return <Brain className="w-4 h-4 text-brand-400" />;
      case 'tool_call':
        return step.status === 'running'
          ? <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
          : <Wrench className="w-4 h-4 text-brand-400" />;
      case 'tool_result':
        return step.status === 'error'
          ? <XCircle className="w-4 h-4 text-red-500" />
          : <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'answer':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Brain className="w-4 h-4 text-white/30" />;
    }
  };

  const getStepLabel = (step: TraceStep) => {
    switch (step.type) {
      case 'thinking': return 'Reasoning';
      case 'tool_call': return `Tool: ${step.toolName || 'unknown'}`;
      case 'tool_result': return `Result: ${step.toolName || 'unknown'}`;
      case 'answer': return 'Final Answer';
      case 'error': return 'Error';
      default: return step.type;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-400" />
            Execution Trace
          </h3>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Step {currentStep}/{maxSteps}
            </span>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {totalTokens.toLocaleString()} tokens
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ${totalCost.toFixed(4)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {steps.length} steps
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="px-4 pt-2">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / maxSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
            <Brain className="w-8 h-8 mb-2 opacity-30" />
            <p>Agent execution trace will appear here</p>
            <p className="text-xs mt-1 text-white/20">See each thinking step and tool call</p>
          </div>
        ) : (
          steps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.id);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-[11px] top-7 bottom-0 w-px bg-white/[0.08]" />
                )}

                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className="mt-0.5 flex-shrink-0">
                    {getStepIcon(step)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/70">
                        {getStepLabel(step)}
                      </span>
                      {step.duration && (
                        <span className="text-[10px] text-white/30">
                          {formatDuration(step.duration)}
                        </span>
                      )}
                      {step.status === 'running' && (
                        <span className="text-[10px] text-amber-500 animate-pulse">
                          running...
                        </span>
                      )}
                    </div>

                    {/* Preview */}
                    {!isExpanded && step.content && (
                      <p className="text-[11px] text-white/30 truncate mt-0.5">
                        {step.content.slice(0, 120)}
                      </p>
                    )}
                  </div>

                  {step.content && (
                    <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isExpanded
                        ? <ChevronDown className="w-3 h-3 text-white/30" />
                        : <ChevronRight className="w-3 h-3 text-white/30" />
                      }
                    </div>
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && step.content && (
                  <div className="ml-8 mb-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    {step.type === 'tool_call' && step.toolArgs && (
                      <div className="mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                          Arguments
                        </span>
                        <pre className="text-[11px] text-white/50 mt-1 overflow-x-auto whitespace-pre-wrap font-mono">
                          {JSON.stringify(step.toolArgs, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div>
                      {step.type === 'tool_call' && (
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                          Reasoning
                        </span>
                      )}
                      <pre className="text-[11px] text-white/50 mt-1 overflow-x-auto whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                        {step.content}
                      </pre>
                    </div>

                    {step.toolResult && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                          Result
                        </span>
                        <pre className="text-[11px] text-white/50 mt-1 overflow-x-auto whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                          {step.toolResult}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Running indicator */}
        {isRunning && (
          <div className="flex items-center gap-2 p-2 text-xs text-white/40">
            <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
            Agent is working...
          </div>
        )}
      </div>
    </div>
  );
}
