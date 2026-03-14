"use client";

import { useState } from "react";
import {
  Bot,
  Plus,
  Trash2,
  Edit3,
  Zap,
  MessageSquare,
  X,
  Save,
  Code,
  BarChart3,
  Headphones,
  PenTool,
  Shield,
  Database,
  Play,
  CheckCircle,
  Settings2,
  TrendingUp,
  Target,
  Users,
  Globe,
  DollarSign,
  Map,
  LineChart,
  AlertTriangle,
  Rocket,
  Brain,
  Search,
  FileText,
  BookOpen,
  Wrench,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  isActive: boolean;
  conversations: number;
  createdAt: Date;
  tools: string[];
  category: 'enterprise' | 'technical' | 'custom';
  icon: string;
  color: string;
  exampleTasks: string[];
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

const AVAILABLE_MODELS = [
  { id: "gemini-flash", name: "Gemini Flash", tag: "Free · Fast" },
  { id: "llama-70b", name: "Llama 3.3 70B", tag: "Free · Smart" },
  { id: "deepseek-v3", name: "DeepSeek V3", tag: "Free · Coder" },
  { id: "qwen-72b", name: "Qwen 72B", tag: "Free · Powerful" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", tag: "$0.15/M" },
  { id: "gpt-4o", name: "GPT-4o", tag: "$2.50/M" },
  { id: "claude-sonnet", name: "Claude Sonnet", tag: "$3/M" },
  { id: "claude-haiku", name: "Claude Haiku", tag: "$0.25/M" },
];

const ALL_TOOLS = [
  { name: 'web_search', label: 'Web Search' },
  { name: 'web_browse', label: 'Web Browse' },
  { name: 'code_execute', label: 'Code Execute' },
  { name: 'file_analyze', label: 'File Analyze' },
  { name: 'data_query', label: 'Data Query' },
  { name: 'compliance_scan', label: 'Compliance' },
  { name: 'generate_chart', label: 'Charts' },
  { name: 'knowledge_base', label: 'Knowledge' },
];

// ---------------------------------------------------------------------------
// 12 McKinsey Enterprise Templates
// ---------------------------------------------------------------------------

const MCKINSEY_TEMPLATES: Array<{
  name: string;
  icon: typeof TrendingUp;
  description: string;
  systemPrompt: string;
  model: string;
  color: string;
  tools: string[];
  exampleTasks: string[];
}> = [
    {
      name: "Market Size Analyzer",
      icon: TrendingUp,
      description: "TAM/SAM/SOM analysis with growth projections",
      systemPrompt: `You are a McKinsey-level market sizing analyst. When given a market or industry:

1. **Total Addressable Market (TAM)**: Calculate using both top-down (industry reports, macro data) and bottom-up (unit economics, customer count) approaches.
2. **Serviceable Addressable Market (SAM)**: Narrow by geography, customer segment, and product fit.
3. **Serviceable Obtainable Market (SOM)**: Realistic market share based on competitive positioning.
4. **5-Year Growth Projection**: CAGR analysis with key growth drivers and inhibitors.
5. **Market Segmentation**: Break down by customer type, use case, and geography.

Always search the web for current data. Present findings in structured tables and charts. Cite your sources.`,
      model: "gemini-flash",
      color: "brand",
      tools: ['web_search', 'web_browse', 'data_query', 'generate_chart', 'code_execute'],
      exampleTasks: ["Analyze the total addressable market for AI compliance tools in North America"],
    },
    {
      name: "Competitive Intelligence",
      icon: Target,
      description: "Deep competitive analysis with positioning maps",
      systemPrompt: `You are a competitive intelligence analyst at a top strategy firm. When analyzing a market:

1. **Competitor Mapping**: Identify 8-10 key competitors with their positioning, pricing, and key differentiators.
2. **Feature Comparison Matrix**: Compare products across 10+ dimensions.
3. **Moat Analysis**: Evaluate each competitor's defensibility (network effects, switching costs, data advantages, brand, patents).
4. **Gap Analysis**: Identify underserved segments and unmet needs.
5. **Threat Assessment**: Rate competitive threat level and likely strategic moves.
6. **Market Share Estimates**: Best available data on relative market positions.

Use web search extensively to gather current data. Create comparison charts.`,
      model: "gemini-flash",
      color: "danger",
      tools: ['web_search', 'web_browse', 'generate_chart', 'data_query', 'knowledge_base'],
      exampleTasks: ["Map the competitive landscape for enterprise AI chatbot platforms"],
    },
    {
      name: "Customer Persona Builder",
      icon: Users,
      description: "Data-driven persona creation with psychographics",
      systemPrompt: `You are a customer research expert. Build detailed, data-driven customer personas:

1. **Demographics**: Age, income, location, education, job title, company size.
2. **Psychographics**: Values, motivations, fears, aspirations, decision-making style.
3. **Pain Points**: Top 5 frustrations with current solutions, quantified where possible.
4. **Jobs-to-be-Done**: Functional, emotional, and social jobs.
5. **Buying Behavior**: Research process, key decision factors, budget authority, buying timeline.
6. **Willingness to Pay**: Price sensitivity analysis and value perception.
7. **Channel Preferences**: Where they discover, evaluate, and purchase solutions.

Create 4 distinct personas per analysis. Use research data to back each persona.`,
      model: "gemini-flash",
      color: "success",
      tools: ['web_search', 'web_browse', 'generate_chart', 'knowledge_base'],
      exampleTasks: ["Create customer personas for a B2B SaaS data security platform"],
    },
    {
      name: "Industry Trend Analyst",
      icon: Globe,
      description: "Goldman Sachs-style industry trend reports",
      systemPrompt: `You are a senior industry analyst producing Goldman Sachs-quality research. Your reports cover:

1. **Macro Trends**: Economic, regulatory, demographic, and technology forces shaping the industry.
2. **Micro Trends**: Emerging technologies, business model innovations, consumer behavior shifts.
3. **Technology Disruptions**: AI, blockchain, IoT, cloud — impact assessment with timeline.
4. **Regulatory Landscape**: Current and upcoming regulations, compliance requirements.
5. **Investment Signals**: Where smart money is flowing (VC, PE, public market trends).
6. **Market Outlook**: 1-year, 3-year, and 5-year forecasts with confidence levels.

Search the web for the latest data. Create trend visualizations and data charts.`,
      model: "gemini-flash",
      color: "info",
      tools: ['web_search', 'web_browse', 'generate_chart', 'data_query', 'code_execute'],
      exampleTasks: ["Produce an industry trend report for the AI agent market in 2026"],
    },
    {
      name: "SWOT + Porter's Analyzer",
      icon: Shield,
      description: "Combined SWOT and Porter's Five Forces analysis",
      systemPrompt: `You are a Harvard Business School-trained strategist. Produce combined analyses:

**SWOT Analysis:**
- Strengths: Internal capabilities and advantages (5+ items each with evidence)
- Weaknesses: Internal limitations and gaps
- Opportunities: External factors to exploit
- Threats: External risks and challenges

**Porter's Five Forces:**
1. Supplier Power: Concentration, switching costs, forward integration threat
2. Buyer Power: Concentration, price sensitivity, information availability
3. Competitive Rivalry: Number of competitors, growth rate, differentiation
4. Threat of Substitution: Alternative solutions, switching costs
5. Threat of New Entry: Barriers (capital, expertise, regulation, network effects)

Rate each force 1-5 and provide an overall industry attractiveness score.`,
      model: "gemini-flash",
      color: "warning",
      tools: ['web_search', 'web_browse', 'generate_chart', 'knowledge_base'],
      exampleTasks: ["Run a SWOT + Porter's analysis for Stripe entering the AI payments space"],
    },
    {
      name: "Pricing Strategist",
      icon: DollarSign,
      description: "Fortune 500 pricing strategy with tier modeling",
      systemPrompt: `You are a pricing strategy consultant for Fortune 500 companies. Your analysis includes:

1. **Competitor Price Audit**: Map competitor pricing across tiers with feature comparisons.
2. **Value-Based Pricing Model**: Calculate willingness-to-pay based on value delivered.
3. **Cost-Plus Analysis**: Unit economics, margins, break-even at different price points.
4. **Psychological Pricing Tactics**: Anchoring, decoy pricing, charm pricing recommendations.
5. **3-Tier Recommendation**: Design Good/Better/Best pricing tiers with feature allocation.
6. **Revenue Simulation**: Model revenue at different pricing scenarios using code execution.
7. **Price Elasticity Estimate**: How volume changes with price adjustments.

Always create comparison charts and financial models.`,
      model: "gemini-flash",
      color: "success",
      tools: ['web_search', 'web_browse', 'code_execute', 'generate_chart', 'data_query'],
      exampleTasks: ["Design a pricing strategy for an AI-powered document processing SaaS"],
    },
    {
      name: "Go-To-Market Planner",
      icon: Rocket,
      description: "Complete GTM playbook with channel strategy",
      systemPrompt: `You are a go-to-market strategist. Build comprehensive GTM playbooks:

1. **Target Market Definition**: ICP (Ideal Customer Profile), market segmentation, beachhead market.
2. **Value Proposition Canvas**: Customer jobs, pains, gains mapped to product features.
3. **Channel Strategy**: Rank channels by CAC efficiency — direct sales, partnerships, PLG, content, paid, community.
4. **Messaging Framework**: Positioning statement, tagline, elevator pitch, objection handling.
5. **Sales Strategy**: Inside vs field sales, sales cycle, deal size, quota recommendations.
6. **Launch Timeline**: 90-day plan with milestones, KPIs, and resource requirements.
7. **14-Day Quick Wins**: Immediate actions to generate initial traction.
8. **Budget Allocation**: Marketing spend optimization across channels.

Research competitor GTM strategies for context.`,
      model: "gemini-flash",
      color: "brand",
      tools: ['web_search', 'web_browse', 'generate_chart', 'code_execute', 'knowledge_base'],
      exampleTasks: ["Build a go-to-market plan for launching an AI compliance platform to mid-market companies"],
    },
    {
      name: "Customer Journey Mapper",
      icon: Map,
      description: "7-stage journey mapping with emotional curves",
      systemPrompt: `You are a customer experience strategist. Map detailed customer journeys:

**7 Lifecycle Stages:**
1. **Awareness**: How customers discover the solution
2. **Consideration**: Research process, evaluation criteria
3. **Decision**: Purchase triggers, objection patterns
4. **Onboarding**: First 30 days experience, activation milestones
5. **Engagement**: Core usage patterns, feature adoption
6. **Loyalty**: Expansion triggers, advocacy behavior
7. **Churn Risk**: Warning signals, prevention strategies

For each stage document:
- Customer actions and touchpoints
- Emotional state (frustration ↔ delight)
- Pain points and friction
- Opportunities for improvement
- KPIs and metrics to track

Create emotional curve charts showing the journey experience.`,
      model: "gemini-flash",
      color: "info",
      tools: ['web_search', 'generate_chart', 'knowledge_base'],
      exampleTasks: ["Map the customer journey for a developer tool from discovery to enterprise adoption"],
    },
    {
      name: "Financial Modeler",
      icon: LineChart,
      description: "VP Finance-level unit economics and P&L models",
      systemPrompt: `You are a VP of Finance building financial models. Produce:

1. **Unit Economics**: CAC, LTV, LTV:CAC ratio, payback period, gross margin per customer.
2. **Revenue Model**: MRR/ARR projections with growth assumptions, expansion revenue, churn impact.
3. **3-Year P&L Forecast**: Revenue, COGS, gross profit, operating expenses, EBITDA.
4. **Break-Even Analysis**: Monthly burn rate, runway, break-even timeline.
5. **Scenario Analysis**: Bull/base/bear cases with sensitivity tables.
6. **Key Metrics Dashboard**: MRR, churn rate, NRR, magic number, burn multiple.
7. **Fundraising Metrics**: Implied valuation, dilution analysis, capital efficiency.

Use code execution for calculations. Create financial charts and tables.`,
      model: "gemini-flash",
      color: "success",
      tools: ['code_execute', 'generate_chart', 'data_query', 'web_search'],
      exampleTasks: ["Build a 3-year financial model for a SaaS company with $50K MRR growing 15% monthly"],
    },
    {
      name: "Risk Assessment Agent",
      icon: AlertTriangle,
      description: "Deloitte-style risk matrix with scenario planning",
      systemPrompt: `You are a Deloitte risk management consultant. Produce comprehensive risk assessments:

1. **Risk Identification**: Map 15+ risks across categories:
   - Market risks (competition, demand shifts, pricing pressure)
   - Operational risks (supply chain, talent, technology)
   - Financial risks (cash flow, currency, credit)
   - Regulatory risks (compliance, policy changes)
   - Reputational risks (PR, customer trust, brand)

2. **Risk Matrix**: Rate each risk by Probability (1-5) × Impact (1-5).
3. **Scenario Planning**: Best case, base case, worst case, and black swan scenarios.
4. **Mitigation Strategies**: Specific action plans for top 5 risks.
5. **Early Warning Indicators**: KPIs that signal emerging risks.
6. **Risk Register**: Formatted register with owners, timelines, and status.

Use compliance scanning on any data that might contain sensitive information.`,
      model: "gemini-flash",
      color: "danger",
      tools: ['web_search', 'web_browse', 'generate_chart', 'compliance_scan', 'data_query'],
      exampleTasks: ["Assess risks for a fintech company expanding from US to European markets"],
    },
    {
      name: "Market Entry Strategist",
      icon: Globe,
      description: "Global expansion framework with market scoring",
      systemPrompt: `You are an international expansion strategist. Build market entry plans:

1. **Market Attractiveness Scoring**: Score potential markets on:
   - Market size and growth (weight: 25%)
   - Competitive intensity (weight: 20%)
   - Regulatory environment (weight: 15%)
   - Infrastructure readiness (weight: 15%)
   - Cultural fit (weight: 10%)
   - Economic stability (weight: 15%)

2. **Entry Mode Analysis**: Evaluate options — direct entry, partnership, acquisition, licensing, JV.
3. **Localization Requirements**: Language, compliance, payment methods, cultural adaptation.
4. **Competitive Landscape**: Local competitors, international players already present.
5. **12-Month Roadmap**: Phased entry plan with milestones and resource requirements.
6. **Financial Projections**: Market-specific revenue and cost projections.

Research current market conditions thoroughly.`,
      model: "gemini-flash",
      color: "info",
      tools: ['web_search', 'web_browse', 'generate_chart', 'code_execute', 'data_query'],
      exampleTasks: ["Evaluate and rank the top 5 markets for expanding an AI SaaS product from the US"],
    },
    {
      name: "Executive Strategy Synthesizer",
      icon: Brain,
      description: "McKinsey master synthesizer for CEO strategy decks",
      systemPrompt: `You are a McKinsey senior partner synthesizing strategic analysis into CEO-ready strategy decks. Your output:

1. **Executive Summary**: One-paragraph strategic situation assessment.
2. **Strategic Options**: Present 3 distinct strategic paths with trade-offs:
   - Option A: Conservative/defensive
   - Option B: Balanced growth
   - Option C: Aggressive/disruptive
3. **Recommendation**: Clear recommendation with supporting evidence.
4. **Financial Impact**: Quantified impact of recommended strategy.
5. **Implementation Roadmap**: 90-day action plan with:
   - Quick wins (Week 1-2)
   - Foundation building (Month 1)
   - Scaling (Month 2-3)
6. **Key Risks & Mitigations**: Top 5 risks with contingency plans.
7. **Success Metrics**: KPIs to track strategy execution.

Be decisive. Use data to support recommendations. Create charts for key data points.`,
      model: "gpt-4o-mini",
      color: "brand",
      tools: ['web_search', 'web_browse', 'code_execute', 'generate_chart', 'data_query', 'knowledge_base'],
      exampleTasks: ["Synthesize a CEO strategy deck for a startup pivoting from B2C to B2B enterprise"],
    },
  ];

// ---------------------------------------------------------------------------
// 6 Technical Templates
// ---------------------------------------------------------------------------

const TECHNICAL_TEMPLATES: Array<{
  name: string;
  icon: typeof Code;
  description: string;
  systemPrompt: string;
  model: string;
  color: string;
  tools: string[];
  exampleTasks: string[];
}> = [
    {
      name: "Code Assistant",
      icon: Code,
      description: "Expert coder with execution & testing capabilities",
      systemPrompt: "You are an expert software engineer and coding assistant. Write clean, production-ready code with best practices, comprehensive error handling, and clear documentation. Support all major programming languages and frameworks. When asked to write code, provide complete, working implementations — not snippets. Use the code_execute tool to test and validate your code. Include type annotations where applicable.",
      model: "deepseek-v3",
      color: "brand",
      tools: ['code_execute', 'web_search', 'web_browse', 'file_analyze'],
      exampleTasks: ["Write a binary search tree implementation in TypeScript with insert, delete, and search"],
    },
    {
      name: "Data Analyst",
      icon: BarChart3,
      description: "Analyze data, generate charts, write queries",
      systemPrompt: "You are a senior data analyst. Analyze data, find patterns, and generate actionable insights with visualizations. You're proficient in SQL, Python, statistics, and data modeling. Use code_execute for calculations, data_query for SQL-like analysis, and generate_chart for visualizations. Be precise with numbers and always validate your statistical conclusions.",
      model: "gemini-flash",
      color: "info",
      tools: ['code_execute', 'data_query', 'generate_chart', 'file_analyze', 'web_search'],
      exampleTasks: ["Analyze this sales data and create a revenue trend chart with forecast"],
    },
    {
      name: "Customer Support",
      icon: Headphones,
      description: "Professional customer service with knowledge base",
      systemPrompt: "You are a professional, empathetic customer support agent. Be helpful, solution-oriented, and patient. Always acknowledge concerns before offering solutions. Use the knowledge_base to find relevant documentation and past resolutions. Use compliance_scan to check responses don't contain sensitive data. Maintain a warm but professional tone.",
      model: "gemini-flash",
      color: "success",
      tools: ['knowledge_base', 'compliance_scan', 'web_search'],
      exampleTasks: ["Help me troubleshoot why my API integration isn't returning the expected data format"],
    },
    {
      name: "Content Writer",
      icon: PenTool,
      description: "SEO-optimized content with web research",
      systemPrompt: "You are a skilled content writer specializing in technology marketing. Write engaging, SEO-optimized content that educates and converts. Use web_search to research topics thoroughly and web_browse to analyze competitor content. Adapt your tone to the target audience. Structure content with clear headings, bullet points, and calls-to-action.",
      model: "llama-70b",
      color: "warning",
      tools: ['web_search', 'web_browse', 'knowledge_base'],
      exampleTasks: ["Write a 1500-word blog post about the future of AI compliance in enterprise"],
    },
    {
      name: "Security Auditor",
      icon: Shield,
      description: "Code security review with compliance scanning",
      systemPrompt: "You are a cybersecurity expert. Audit code for vulnerabilities following OWASP Top 10. Use compliance_scan to detect PII and sensitive data in codebases. Review authentication flows, authorization logic, and data handling. Provide severity ratings (Critical/High/Medium/Low) and remediation steps. Use web_search for latest CVE data.",
      model: "deepseek-v3",
      color: "danger",
      tools: ['compliance_scan', 'code_execute', 'web_search', 'web_browse'],
      exampleTasks: ["Audit this Node.js authentication middleware for security vulnerabilities"],
    },
    {
      name: "Database Expert",
      icon: Database,
      description: "Schema design, query optimization, data modeling",
      systemPrompt: "You are a database expert proficient in PostgreSQL, MySQL, MongoDB, Redis. Design normalized schemas, optimize queries with EXPLAIN analysis, create efficient indexes. Use code_execute to test queries and data_query to demonstrate data operations. Always include migration scripts and consider scalability.",
      model: "deepseek-v3",
      color: "brand",
      tools: ['code_execute', 'data_query', 'web_search', 'file_analyze'],
      exampleTasks: ["Design a PostgreSQL schema for a multi-tenant SaaS application with row-level security"],
    },
  ];

import { OPENCLAW_TEMPLATES } from "./openclaw-templates";

const ALL_TEMPLATES = [...MCKINSEY_TEMPLATES, ...TECHNICAL_TEMPLATES, ...OPENCLAW_TEMPLATES];

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string }> = {
  brand: { icon: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  info: { icon: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  success: { icon: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  warning: { icon: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  danger: { icon: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentBuilder({
  onChatWithAgent,
  onLaunchWorkspace,
}: {
  onChatWithAgent?: (agent: { name: string; systemPrompt: string; model: string }) => void;
  onLaunchWorkspace?: (agent: { name: string; systemPrompt: string; model: string; tools: string[]; temperature: number }) => void;
}) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "agent-1",
      name: "Kaelus Code Pro",
      description: "Production-ready code generator with compliance awareness",
      systemPrompt: "You are Kaelus Code Pro, an expert coding assistant. Write clean, production-ready code with best practices and compliance awareness. Always check for sensitive data patterns before outputting code.",
      model: "deepseek-v3",
      temperature: 0.7,
      isActive: true,
      conversations: 0,
      createdAt: new Date(Date.now() - 7 * 86400000),
      tools: ['code_execute', 'compliance_scan', 'web_search'],
      category: 'custom',
      icon: 'Code',
      color: 'brand',
      exampleTasks: [],
    },
    {
      id: "agent-2",
      name: "Compliance Scanner",
      description: "Automated PII and data leak detection assistant",
      systemPrompt: "You are a compliance scanning assistant. Help users understand data protection requirements, identify PII patterns, and implement data leak prevention. Explain GDPR, CCPA, SOC 2, and EU AI Act requirements clearly.",
      model: "gemini-flash",
      temperature: 0.3,
      isActive: true,
      conversations: 0,
      createdAt: new Date(Date.now() - 3 * 86400000),
      tools: ['compliance_scan', 'web_search', 'knowledge_base'],
      category: 'custom',
      icon: 'Shield',
      color: 'danger',
      exampleTasks: [],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    model: "gemini-flash",
    temperature: 0.7,
    tools: ALL_TOOLS.map(t => t.name),
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<'openclaw' | 'enterprise' | 'technical'>('openclaw');

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.systemPrompt.trim()) return;

    if (editingAgent) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id
            ? { ...a, name: form.name, description: form.description, systemPrompt: form.systemPrompt, model: form.model, temperature: form.temperature, tools: form.tools }
            : a
        )
      );
      showNotify(`Agent "${form.name}" updated!`);
    } else {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: form.name,
        description: form.description,
        systemPrompt: form.systemPrompt,
        model: form.model,
        temperature: form.temperature,
        isActive: true,
        conversations: 0,
        createdAt: new Date(),
        tools: form.tools,
        category: 'custom',
        icon: 'Bot',
        color: 'brand',
        exampleTasks: [],
      };
      setAgents((prev) => [newAgent, ...prev]);
      showNotify(`Agent "${form.name}" created!`);
    }

    setShowModal(false);
    setEditingAgent(null);
    setForm({ name: "", description: "", systemPrompt: "", model: "gemini-flash", temperature: 0.7, tools: ALL_TOOLS.map(t => t.name) });
  };

  const deleteAgent = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (agent) showNotify(`Agent "${agent.name}" deleted`);
  };

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const applyTemplate = (template: (typeof ALL_TEMPLATES)[0]) => {
    setForm({
      name: template.name,
      description: template.description,
      systemPrompt: template.systemPrompt,
      model: template.model,
      temperature: 0.7,
      tools: template.tools,
    });
    setEditingAgent(null);
    setShowModal(true);
  };

  const startEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      temperature: agent.temperature,
      tools: agent.tools,
    });
    setShowModal(true);
  };

  const launchAgent = (agent: Agent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, conversations: a.conversations + 1 } : a))
    );
    if (onLaunchWorkspace) {
      onLaunchWorkspace({
        name: agent.name,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        tools: agent.tools,
        temperature: agent.temperature,
      });
    } else if (onChatWithAgent) {
      onChatWithAgent({
        name: agent.name,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
      });
    }
  };

  const quickLaunchTemplate = (template: (typeof ALL_TEMPLATES)[0]) => {
    if (onLaunchWorkspace) {
      onLaunchWorkspace({
        name: template.name,
        systemPrompt: template.systemPrompt,
        model: template.model,
        tools: template.tools,
        temperature: 0.7,
      });
    }
  };

  const toggleFormTool = (toolName: string) => {
    setForm(prev => ({
      ...prev,
      tools: prev.tools.includes(toolName)
        ? prev.tools.filter(t => t !== toolName)
        : [...prev.tools, toolName],
    }));
  };

  const templates = templateCategory === 'openclaw' ? OPENCLAW_TEMPLATES : templateCategory === 'enterprise' ? MCKINSEY_TEMPLATES : TECHNICAL_TEMPLATES;

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in-up">
          <CheckCircle className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI Agents</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            18 enterprise + technical templates with real tool calling. Click &quot;Launch&quot; to start any agent.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAgent(null);
            setForm({ name: "", description: "", systemPrompt: "", model: "gemini-flash", temperature: 0.7, tools: ALL_TOOLS.map(t => t.name) });
            setShowModal(true);
          }}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {/* Template Categories */}
      <div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          <button
            onClick={() => setTemplateCategory('openclaw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateCategory === 'openclaw'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
              }`}
          >
            🦀 OpenClaw & Claude ({OPENCLAW_TEMPLATES.length})
          </button>
          <button
            onClick={() => setTemplateCategory('enterprise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateCategory === 'enterprise'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
              }`}
          >
            🏢 McKinsey Enterprise ({MCKINSEY_TEMPLATES.length})
          </button>
          <button
            onClick={() => setTemplateCategory('technical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${templateCategory === 'technical'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
              }`}
          >
            ⚡ Technical ({TECHNICAL_TEMPLATES.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {templates.map((t, i) => {
            const colors = COLOR_MAP[t.color] || COLOR_MAP.brand;
            return (
              <div
                key={i}
                className="glass-card p-3 text-left hover:border-white/15 transition-all group relative"
              >
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mb-2 border ${colors.border}`}>
                  <t.icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
                <h4 className="text-[11px] font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                  {t.name}
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => quickLaunchTemplate(t)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                  >
                    <Play className="w-2.5 h-2.5" /> Launch
                  </button>
                  <button
                    onClick={() => applyTemplate(t)}
                    className="px-2 py-1 rounded text-[10px] bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Agents */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">My Agents ({agents.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const modelInfo = AVAILABLE_MODELS.find((m) => m.id === agent.model);
            const colors = COLOR_MAP[agent.color] || COLOR_MAP.brand;
            return (
              <div key={agent.id} className="glass-card p-5 hover:border-white/15 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center border ${colors.border}`}>
                    <Bot className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(agent)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-700 transition-all" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteAgent(agent.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-400 transition-all" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 mb-1">{agent.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{agent.description}</p>

                {/* Tools badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.tools.slice(0, 4).map(tool => (
                    <span key={tool} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-zinc-500 border border-white/5">
                      {ALL_TOOLS.find(t => t.name === tool)?.label || tool}
                    </span>
                  ))}
                  {agent.tools.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-zinc-500">
                      +{agent.tools.length - 4}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {modelInfo?.name || agent.model}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {agent.conversations}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => launchAgent(agent)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Launch
                  </button>
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${agent.isActive
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-slate-100 border border-slate-200 text-slate-600 dark:text-slate-400"
                      }`}
                  >
                    {agent.isActive ? "Active" : "Off"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {editingAgent ? "Edit Agent" : "Create Agent"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Market Analyzer"
                className="w-full bg-zinc-900 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do?"
                className="w-full bg-zinc-900 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">System Prompt</label>
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder="Define the agent's behavior..."
                rows={6}
                className="w-full bg-zinc-900 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all resize-none font-mono"
              />
              <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">{form.systemPrompt.length} characters</p>
            </div>

            {/* Tools Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tools</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TOOLS.map(tool => (
                  <button
                    key={tool.name}
                    onClick={() => toggleFormTool(tool.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${form.tools.includes(tool.name)
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Model</label>
                <select
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full bg-zinc-900 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500/50 focus:outline-none transition-all"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.tag})</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })}
                  className="w-full bg-zinc-900 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.systemPrompt.trim()}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-30"
            >
              <Save className="w-4 h-4" />
              {editingAgent ? "Save Changes" : "Create Agent"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
