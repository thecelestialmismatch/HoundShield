import * as fs from 'fs';

const categories = ["finance", "marketing", "engineering", "sales", "operations", "crypto"];
const templates = [];

// Defi Research Analyst
templates.push({
    name: "DeFi Research Analyst",
    icon: "LineChart",
    description: "Deep-dive analysis of DeFi protocols, tokenomics, and yield farming strategies.",
    systemPrompt: "You are a senior DeFi Research Analyst. Your job is to analyze smart contracts, tokenomics, TVL trends, and yield farming strategies. Deliver Alpha. Always cite on-chain data and audit reports.",
    model: "claude-sonnet",
    color: "brand",
    tools: ['web_search', 'web_browse', 'data_query', 'generate_chart'],
    exampleTasks: ["Analyze the tokenomics of the new Arbitrum native DEX", "Evaluate the risk of this new yield farming strategy"],
    category: "crypto"
});

const roles = [
    "Social Media Manager", "SEO Strategist", "Copywriter", "Email Marketing Specialist", "Growth Hacker",
    "Frontend Developer", "Backend Engineer", "DevOps Specialist", "QA Automation Engineer", "Database Administrator",
    "Account Executive", "Sales Development Rep", "Customer Success Manager", "Sales Operations Analyst", "Partnerships Manager",
    "Financial Analyst", "Accountant", "Investment Banker", "FP&A Manager", "Risk Manager",
    "HR Generalist", "Technical Recruiter", "Onboarding Specialist", "Compliance Officer", "Operations Manager",
    "Smart Contract Auditor", "NFT Strategist", "Web3 Community Manager", "Crypto Trader", "Tokenomics Designer",
    "Product Manager", "UX Designer", "UI Researcher", "Data Scientist", "Machine Learning Engineer",
    "Legal Advisor", "Contract Reviewer", "IP Lawyer", "Privacy Consultant", "M&A Analyst",
    "Supply Chain Manager", "Logistics Coordinator", "Procurement Specialist", "Inventory Analyst", "Fulfillment Manager",
    "Event Planner", "PR Manager", "Brand Strategist", "Communications Director", "Crisis Manager",
    "CEO Advisor", "Chief of Staff", "Strategy Consultant", "Market Researcher", "Pricing Analyst"
];

const models = ["gemini-flash", "llama-70b", "deepseek-v3", "gpt-4o", "claude-sonnet", "claude-haiku"];
const colors = ["brand", "info", "success", "warning", "danger"];

roles.forEach((role, i) => {
    templates.push({
        name: role,
        icon: ["Users", "Globe", "Target", "Database", "Shield", "LineChart", "Code", "PenTool", "FileText", "Brain"][i % 10],
        description: `Expert autonomous ${role.toLowerCase()} powered by OpenClaw architecture.`,
        systemPrompt: `You are an expert ${role}. Provide actionable, high-quality, professional outputs. Perform your tasks autonomously utilizing your provided tools.`,
        model: models[i % models.length],
        color: colors[i % colors.length],
        tools: ['web_search', 'web_browse', 'data_query'],
        exampleTasks: [`Perform a standard ${role.toLowerCase()} task`, `Analyze current trends in ${role.toLowerCase()}`],
        category: categories[i % categories.length]
    });
});

const content = `
import {
  Users, Globe, Target, Database, Shield, LineChart, Code, PenTool, FileText, Brain, TrendingUp, AlertTriangle, Rocket
} from "lucide-react";

export const OPENCLAW_TEMPLATES = [
  ${templates.map(t => `{
    name: "${t.name}",
    icon: ${t.icon},
    description: "${t.description}",
    systemPrompt: ${JSON.stringify(t.systemPrompt)},
    model: "${t.model}",
    color: "${t.color}",
    tools: ${JSON.stringify(t.tools)},
    exampleTasks: ${JSON.stringify(t.exampleTasks)},
    category: "${t.category}"
  }`).join(",\n  ")}
];
`;

fs.writeFileSync('./components/dashboard/openclaw-templates.ts', content);
console.log("Wrote 50+ templates to components/dashboard/openclaw-templates.ts");
