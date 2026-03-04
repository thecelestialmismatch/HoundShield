'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  Bot,
  User,
  Brain,
  Wrench,
  ChevronDown,
  ChevronRight,
  StopCircle,
  Settings2,
  Sparkles,
  BarChart3,
  Globe,
  Search,
  Code,
  FileText,
  Shield,
  BookOpen,
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Zap,
  DollarSign,
  RotateCcw,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import ExecutionTrace, { TraceStep } from './execution-trace';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: string;
    status: 'running' | 'complete' | 'error';
  }>;
  tokens?: number;
  cost?: number;
  steps?: number;
  timestamp: number;
}

interface AgentWorkspaceProps {
  agentName?: string;
  agentSystemPrompt?: string;
  agentModel?: string;
  agentTools?: string[];
  agentTemperature?: number;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  web_search: <Search className="w-3.5 h-3.5" />,
  web_browse: <Globe className="w-3.5 h-3.5" />,
  code_execute: <Code className="w-3.5 h-3.5" />,
  file_analyze: <FileText className="w-3.5 h-3.5" />,
  data_query: <Database className="w-3.5 h-3.5" />,
  compliance_scan: <Shield className="w-3.5 h-3.5" />,
  generate_chart: <BarChart3 className="w-3.5 h-3.5" />,
  knowledge_base: <BookOpen className="w-3.5 h-3.5" />,
};

const ALL_TOOLS = [
  { name: 'web_search', label: 'Web Search', icon: 'Search', category: 'research' },
  { name: 'web_browse', label: 'Web Browse', icon: 'Globe', category: 'research' },
  { name: 'code_execute', label: 'Code Execute', icon: 'Code', category: 'coding' },
  { name: 'file_analyze', label: 'File Analyze', icon: 'FileText', category: 'analysis' },
  { name: 'data_query', label: 'Data Query', icon: 'Database', category: 'analysis' },
  { name: 'compliance_scan', label: 'Compliance', icon: 'Shield', category: 'compliance' },
  { name: 'generate_chart', label: 'Charts', icon: 'BarChart3', category: 'visualization' },
  { name: 'knowledge_base', label: 'Knowledge', icon: 'BookOpen', category: 'knowledge' },
];

const MODELS = [
  { id: 'gemini-flash', name: 'Gemini 2.0 Flash', free: true },
  { id: 'llama-70b', name: 'Llama 3.3 70B', free: true },
  { id: 'deepseek-v3', name: 'DeepSeek V3', free: true },
  { id: 'qwen-72b', name: 'Qwen 2.5 72B', free: true },
  { id: 'mistral-small', name: 'Mistral Small 3.1', free: true },
  { id: 'gemma-27b', name: 'Gemma 3 27B', free: true },
  { id: 'nemotron-70b', name: 'Nemotron 70B', free: true },
  { id: 'phi-4', name: 'Phi-4 Reasoning+', free: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', free: false },
  { id: 'gpt-4o', name: 'GPT-4o', free: false },
  { id: 'claude-sonnet', name: 'Claude Sonnet', free: false },
  { id: 'claude-haiku', name: 'Claude Haiku', free: false },
  { id: 'gemini-pro', name: 'Gemini 2.5 Pro', free: false },
];

const EXAMPLE_TASKS = [
  "Research the top 5 competitors in the AI compliance space and create a comparison chart",
  "Analyze this CSV data and find the top performing products by revenue",
  "Create a comprehensive SWOT analysis for a SaaS startup entering the healthcare market",
  "Search the web for the latest AI regulations in the EU and summarize key requirements",
  "Write a Python function to calculate compound interest and test it with sample data",
  "Scan this text for PII and compliance violations: John Smith SSN 123-45-6789",
];

export default function AgentWorkspace({
  agentName,
  agentSystemPrompt,
  agentModel,
  agentTools,
  agentTemperature,
}: AgentWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState(agentModel || 'gemini-flash');
  const [selectedTools, setSelectedTools] = useState<string[]>(
    agentTools || ALL_TOOLS.map(t => t.name)
  );
  const [maxIterations, setMaxIterations] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrace, setShowTrace] = useState(true);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(10);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const toggleToolExpand = (callId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(callId)) next.delete(callId);
      else next.add(callId);
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isRunning) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsRunning(true);
    setTraceSteps([]);
    setTotalTokens(0);
    setTotalCost(0);
    setCurrentStep(0);

    const assistantMessage: Message = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: '',
      thinking: '',
      toolCalls: [],
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const apiKey = localStorage.getItem('kaelus_openrouter_key') || '';

      const allMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: trimmed },
      ];

      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-openrouter-key': apiKey } : {}),
        },
        body: JSON.stringify({
          messages: allMessages,
          model: selectedModel,
          tools: selectedTools,
          systemPrompt: agentSystemPrompt || undefined,
          maxIterations,
          temperature: agentTemperature || 0.7,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.content = error.error === 'compliance_block'
              ? `🛡️ **Compliance Block:** ${error.message}`
              : error.error === 'no_api_key'
                ? '⚙️ **API Key Required.** Go to Settings and add your OpenRouter API key to use the agent.'
                : `❌ **Error:** ${error.message || 'Something went wrong'}`;
          }
          return updated;
        });
        setIsRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let thinkingContent = '';
      let answerContent = '';
      let currentToolCalls: Message['toolCalls'] = [];
      let isThinking = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'step_start':
                setCurrentStep(event.step || 0);
                setMaxSteps(event.maxSteps || maxIterations);
                break;

              case 'thinking':
                thinkingContent += event.content || '';
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.thinking = thinkingContent;
                  }
                  return [...updated];
                });

                // Add/update thinking trace step
                setTraceSteps(prev => {
                  const existing = prev.find(s => s.type === 'thinking' && s.status === 'running');
                  if (existing) {
                    return prev.map(s =>
                      s.id === existing.id ? { ...s, content: thinkingContent } : s
                    );
                  }
                  return [...prev, {
                    id: `trace_think_${Date.now()}`,
                    type: 'thinking' as const,
                    content: thinkingContent,
                    timestamp: Date.now(),
                    status: 'running' as const,
                  }];
                });
                break;

              case 'tool_call': {
                isThinking = false;
                // Complete thinking step
                setTraceSteps(prev => prev.map(s =>
                  s.type === 'thinking' && s.status === 'running'
                    ? { ...s, status: 'complete' as const }
                    : s
                ));

                const newToolCall = {
                  id: event.callId || `tc_${Date.now()}`,
                  name: event.tool || 'unknown',
                  args: event.args || {},
                  status: 'running' as const,
                };
                currentToolCalls = [...(currentToolCalls || []), newToolCall];

                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.toolCalls = currentToolCalls;
                  }
                  return [...updated];
                });

                setTraceSteps(prev => [...prev, {
                  id: `trace_call_${event.callId}`,
                  type: 'tool_call',
                  content: `Calling ${event.tool}`,
                  toolName: event.tool,
                  toolArgs: event.args,
                  timestamp: Date.now(),
                  status: 'running',
                }]);
                break;
              }

              case 'tool_result': {
                const callId = event.callId;
                currentToolCalls = (currentToolCalls || []).map(tc =>
                  tc.id === callId
                    ? { ...tc, result: event.result, status: event.content === '❌' ? 'error' as const : 'complete' as const }
                    : tc
                );

                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.toolCalls = currentToolCalls;
                  }
                  return [...updated];
                });

                setTraceSteps(prev => prev.map(s =>
                  s.id === `trace_call_${callId}`
                    ? { ...s, toolResult: event.result, status: event.content === '❌' ? 'error' as const : 'complete' as const }
                    : s
                ));
                break;
              }

              case 'content':
                answerContent += event.content || '';
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.content = answerContent;
                  }
                  return [...updated];
                });
                break;

              case 'usage':
                setTotalTokens(
                  (event.tokens?.prompt || 0) + (event.tokens?.completion || 0)
                );
                setTotalCost(event.cost || 0);

                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.tokens = (event.tokens?.prompt || 0) + (event.tokens?.completion || 0);
                    last.cost = event.cost;
                  }
                  return [...updated];
                });
                break;

              case 'done':
                setTraceSteps(prev => prev.map(s =>
                  s.status === 'running' ? { ...s, status: 'complete' as const } : s
                ));
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.steps = event.totalSteps;
                  }
                  return [...updated];
                });
                break;

              case 'error':
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.role === 'assistant') {
                    last.content += `\n\n❌ **Error:** ${event.message}`;
                  }
                  return [...updated];
                });
                setTraceSteps(prev => [...prev, {
                  id: `trace_error_${Date.now()}`,
                  type: 'error',
                  content: event.message || 'Unknown error',
                  timestamp: Date.now(),
                  status: 'complete',
                }]);
                break;
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            last.content = `❌ **Connection Error:** ${(error as Error).message}`;
          }
          return [...updated];
        });
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [input, isRunning, messages, selectedModel, selectedTools, maxIterations, agentSystemPrompt, agentTemperature]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (content: string) => {
    // Parse charts
    const chartRegex = /<!--CHART_DATA:([\s\S]*?):CHART_DATA-->/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = chartRegex.exec(content)) !== null) {
      // Add text before chart
      if (match.index > lastIndex) {
        parts.push(renderMarkdown(content.slice(lastIndex, match.index), `text_${lastIndex}`));
      }

      // Render chart
      try {
        const chartData = JSON.parse(match[1]);
        parts.push(renderChart(chartData, `chart_${match.index}`));
      } catch {
        // Skip invalid chart data
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(renderMarkdown(content.slice(lastIndex), `text_${lastIndex}`));
    }

    return parts.length > 0 ? parts : renderMarkdown(content, 'full');
  };

  const renderMarkdown = (text: string, key: string) => {
    // Simple markdown rendering
    const lines = text.split('\n');
    return (
      <div key={key} className="space-y-1">
        {lines.map((line, i) => {
          // Headers
          if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-semibold text-gray-900 mt-3 mb-1">{line.slice(4)}</h4>;
          if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4 mb-1">{line.slice(3)}</h3>;
          if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.slice(2)}</h2>;

          // Horizontal rules
          if (line.trim() === '---') return <hr key={i} className="border-gray-200 my-3" />;

          // Code blocks
          if (line.startsWith('```')) return null; // Skip markers

          // Bold
          const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>');

          // Bullet points
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={i} className="flex gap-2 ml-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: boldLine.slice(2) }} />
              </div>
            );
          }

          // Table rows
          if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').filter(c => c.trim());
            if (cells.every(c => c.trim().match(/^-+$/))) {
              return null; // Skip separator
            }
            return (
              <div key={i} className="flex text-xs">
                {cells.map((cell, j) => (
                  <div key={j} className="flex-1 px-2 py-1 border-b border-gray-100 text-gray-600">
                    <span dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') }} />
                  </div>
                ))}
              </div>
            );
          }

          // Empty lines
          if (line.trim() === '') return <div key={i} className="h-2" />;

          // Regular text
          return (
            <p key={i} className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine }} />
          );
        })}
      </div>
    );
  };

  const renderChart = (chartData: { type: string; title: string; labels: string[]; datasets: Array<{ label: string; data: number[]; color?: string }> }, key: string) => {
    const maxValue = Math.max(...chartData.datasets.flatMap(ds => ds.data));

    if (chartData.type === 'bar') {
      return (
        <div key={key} className="my-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">{chartData.title}</h4>
          <div className="space-y-2">
            {chartData.labels.map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 truncate">{label}</span>
                <div className="flex-1 flex gap-1">
                  {chartData.datasets.map((ds, j) => (
                    <div key={j} className="flex-1">
                      <div
                        className="h-6 rounded transition-all duration-500"
                        style={{
                          width: `${(ds.data[i] / maxValue) * 100}%`,
                          backgroundColor: ds.color || '#16a34a',
                          minWidth: '4px',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">
                  {chartData.datasets.map(ds => ds.data[i]).join(' / ')}
                </span>
              </div>
            ))}
          </div>
          {chartData.datasets.length > 1 && (
            <div className="flex gap-4 mt-3 pt-2 border-t border-gray-100">
              {chartData.datasets.map((ds, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ds.color || '#16a34a' }} />
                  {ds.label}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (chartData.type === 'pie' || chartData.type === 'doughnut') {
      const total = chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 1;
      const colors = ['#16a34a', '#059669', '#34d399', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

      return (
        <div key={key} className="my-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">{chartData.title}</h4>
          <div className="space-y-1.5">
            {chartData.labels.map((label, i) => {
              const value = chartData.datasets[0]?.data[i] || 0;
              const pct = ((value / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-xs text-gray-600 flex-1">{label}</span>
                  <span className="text-xs text-gray-500">{pct}%</span>
                  <div className="w-24">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Default: table
    return (
      <div key={key} className="my-4 p-4 rounded-xl bg-gray-50 border border-gray-200 overflow-x-auto">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">{chartData.title}</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Category</th>
              {chartData.datasets.map((ds, i) => (
                <th key={i} className="text-right py-1.5 px-2 text-gray-500 font-medium">{ds.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.labels.map((label, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-1.5 px-2 text-gray-600">{label}</td>
                {chartData.datasets.map((ds, j) => (
                  <td key={j} className="text-right py-1.5 px-2 text-gray-600">{ds.data[i]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#faf9f6]' : ''}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-emerald-500/20 border border-brand-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-400" fill="rgba(99,102,241,0.15)" />
              <Zap className="w-1.5 h-1.5 text-emerald-400 absolute" style={{ fill: 'currentColor' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {agentName || 'Kaelus Agent'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
                </span>
                <span>•</span>
                <span>{selectedTools.length} tools active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTrace(!showTrace)}
              className={`p-2 rounded-lg transition-colors ${showTrace ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {showTrace ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
            {/* Model Selection */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">Model</label>
              <div className="flex flex-wrap gap-1.5">
                {MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${selectedModel === model.id
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {model.name}
                    {model.free && <span className="ml-1 text-green-600">FREE</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Selection */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">Tools</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TOOLS.map(tool => (
                  <button
                    key={tool.name}
                    onClick={() => toggleTool(tool.name)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${selectedTools.includes(tool.name)
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {TOOL_ICONS[tool.name]}
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Iterations */}
            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Max Steps</label>
              <input
                type="range"
                min="1"
                max="15"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                className="flex-1 h-1 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600"
              />
              <span className="text-xs text-gray-500 w-6 text-center">{maxIterations}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-emerald-500/20 border border-brand-500/30 flex items-center justify-center mb-4 relative">
                <Shield className="w-8 h-8 text-brand-400" fill="rgba(99,102,241,0.15)" />
                <Zap className="w-3.5 h-3.5 text-emerald-400 absolute" style={{ fill: 'currentColor' }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {agentName || 'Kaelus Agent'}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                I&apos;m an agentic AI that can search the web, execute code, analyze data, generate charts, and more. Give me a complex task and I&apos;ll break it down step by step.
              </p>

              <div className="w-full space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Try these:</p>
                {EXAMPLE_TASKS.slice(0, 4).map((task, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(task)}
                    className="w-full text-left p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs text-gray-500 hover:text-gray-600"
                  >
                    <Sparkles className="w-3 h-3 inline mr-2 text-green-600" />
                    {task}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500/20 to-emerald-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 relative">
                    <Shield className="w-3.5 h-3.5 text-brand-400" fill="rgba(99,102,241,0.15)" />
                    <Zap className="w-1.5 h-1.5 text-emerald-400 absolute" style={{ fill: 'currentColor' }} />
                  </div>
                )}

                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  {/* User message */}
                  {message.role === 'user' && (
                    <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-green-50 border border-green-200">
                      <p className="text-sm text-gray-900">{message.content}</p>
                    </div>
                  )}

                  {/* Assistant message */}
                  {message.role === 'assistant' && (
                    <div className="space-y-2">
                      {/* Thinking */}
                      {message.thinking && (
                        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Brain className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Thinking</span>
                          </div>
                          <p className="text-xs text-emerald-700/70 line-clamp-3">{message.thinking}</p>
                        </div>
                      )}

                      {/* Tool Calls */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="space-y-1.5">
                          {message.toolCalls.map(tc => (
                            <div key={tc.id} className="rounded-lg border border-gray-200 overflow-hidden">
                              <button
                                onClick={() => toggleToolExpand(tc.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="text-blue-600">
                                  {TOOL_ICONS[tc.name] || <Wrench className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-xs font-medium text-gray-600">{tc.name}</span>
                                <div className="flex-1" />
                                {tc.status === 'running' ? (
                                  <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                                ) : tc.status === 'error' ? (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                )}
                                {expandedTools.has(tc.id)
                                  ? <ChevronDown className="w-3 h-3 text-gray-400" />
                                  : <ChevronRight className="w-3 h-3 text-gray-400" />
                                }
                              </button>

                              {expandedTools.has(tc.id) && (
                                <div className="px-3 py-2 bg-white space-y-2">
                                  {Object.keys(tc.args).length > 0 && (
                                    <div>
                                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Args</span>
                                      <pre className="text-[11px] text-gray-500 mt-0.5 overflow-x-auto whitespace-pre-wrap font-mono">
                                        {JSON.stringify(tc.args, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {tc.result && (
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Result</span>
                                        <button
                                          onClick={() => copyToClipboard(tc.result!, tc.id)}
                                          className="text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                          {copiedId === tc.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                      <pre className="text-[11px] text-gray-500 mt-0.5 overflow-x-auto whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                                        {tc.result}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Main Content */}
                      {message.content && (
                        <div className="px-3 py-2">
                          {renderContent(message.content)}
                        </div>
                      )}

                      {/* Footer stats */}
                      {(message.tokens || message.steps) && (
                        <div className="flex items-center gap-3 px-3 text-[10px] text-gray-400">
                          {message.steps && (
                            <span className="flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5" />
                              {message.steps} steps
                            </span>
                          )}
                          {message.tokens && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />
                              {message.tokens.toLocaleString()} tokens
                            </span>
                          )}
                          {message.cost !== undefined && message.cost > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-2.5 h-2.5" />
                              ${message.cost.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Loading indicator */}
                      {isRunning && message === messages[messages.length - 1] && !message.content && !message.thinking && (
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                          <span className="text-xs text-gray-500">Agent is thinking...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRunning ? 'Agent is working...' : 'Give the agent a task...'}
                disabled={isRunning}
                rows={1}
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-400 resize-none disabled:opacity-50 max-h-32"
                style={{ minHeight: '42px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
            </div>

            {isRunning ? (
              <button
                onClick={handleStop}
                className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Execution Trace Panel */}
      {showTrace && (
        <div className="w-72 border-l border-gray-200 bg-white flex-shrink-0">
          <ExecutionTrace
            steps={traceSteps}
            isRunning={isRunning}
            totalTokens={totalTokens}
            totalCost={totalCost}
            currentStep={currentStep}
            maxSteps={maxSteps}
          />
        </div>
      )}
    </div>
  );
}
