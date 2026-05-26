# houndshield Brain AI — Architecture + Seed Content
**File:** BRAIN.md | **Version:** 1.0

---

## What the Brain AI Is

The Brain AI is houndshield's persistent, self-evolving knowledge system. It answers any question about:
- Product architecture and decisions
- CMMC/SOC 2/HIPAA compliance requirements
- Competitive landscape and positioning
- Market data and go-to-market strategy
- Current project state and next actions

It serves two interfaces:
1. **Founder-facing:** "Should I take this meeting with Palo Alto?" "What's our CMMC story for SC.3.187?" "Which RPO should I call first?"
2. **Agent-facing:** Every Claude Code agent reads from the Brain at session start. Agents never re-read the entire codebase to answer a context question.

It is token-efficient. The knowledge graph is compressed. Agents load the relevant domain graph node, not the entire graph.

---

## File Structure

```
/brain/
├── knowledge-graph.json      # Compressed knowledge graph (main data store)
├── query.ts                  # Founder query interface (CLI + API)
├── agent-context.ts          # Agent query interface (returns compressed context for domain)
├── update.ts                 # Update mechanism (called post-session)
├── domains/
│   ├── product.json          # Product features, architecture, ADRs
│   ├── compliance.json       # CMMC, SOC 2, HIPAA — all 110 practices mapped
│   ├── competitors.json      # Competitor intelligence (funding, status, weakness)
│   ├── market.json           # Market data, TAM, buyer profiles
│   ├── gtm.json              # GTM strategy, RPO contacts, pricing
│   └── codebase.json         # Current codebase state, tech stack, file map
└── BRAIN.md                  # This file
```

---

## Knowledge Graph Schema

```json
{
  "version": "1.0",
  "last_updated": "2026-04-27",
  "nodes": {
    "product": { "ref": "./domains/product.json" },
    "compliance": { "ref": "./domains/compliance.json" },
    "competitors": { "ref": "./domains/competitors.json" },
    "market": { "ref": "./domains/market.json" },
    "gtm": { "ref": "./domains/gtm.json" },
    "codebase": { "ref": "./domains/codebase.json" }
  },
  "edges": [
    { "from": "product", "to": "compliance", "rel": "satisfies" },
    { "from": "competitors", "to": "market", "rel": "occupies" },
    { "from": "gtm", "to": "market", "rel": "targets" },
    { "from": "codebase", "to": "product", "rel": "implements" }
  ],
  "session_log": []
}
```

---

## Day-1 Seed Content

### DOMAIN: compliance.json

```json
{
  "cmmc_level_2": {
    "total_practices": 110,
    "houndshield_covers_directly": [
      {
        "practice": "AC.1.001",
        "title": "Authorized Access Control",
        "how": "Keycloak auth — only authenticated users can use proxy. Audit log records all access.",
        "status": "covered"
      },
      {
        "practice": "AC.1.002",
        "title": "Transaction & Function Control",
        "how": "Policy engine restricts which AI models users can access. Configurable per role.",
        "status": "covered"
      },
      {
        "practice": "AC.3.017",
        "title": "Privileged User Actions",
        "how": "Admin vs user roles in Keycloak. Admin actions logged separately with elevated audit detail.",
        "status": "covered"
      },
      {
        "practice": "AU.2.041",
        "title": "Audit Logging",
        "how": "Every prompt and response logged with timestamp, user, model, entities detected, action taken.",
        "status": "covered"
      },
      {
        "practice": "AU.2.042",
        "title": "Audit Log Review",
        "how": "Admin dashboard provides real-time event feed. Alerting on policy violations.",
        "status": "covered"
      },
      {
        "practice": "AU.3.045",
        "title": "Audit Log Protection",
        "how": "SHA-256 hash chain — tamper-evident. Logs stored in PostgreSQL with write-once semantics.",
        "status": "covered"
      },
      {
        "practice": "SC.3.177",
        "title": "FIPS-Validated Cryptography",
        "how": "OpenSSL FIPS module enabled in all containers. AES-256 for data at rest. TLS 1.3 only in transit.",
        "status": "covered"
      },
      {
        "practice": "SC.3.187",
        "title": "Boundary Protection",
        "how": "Proxy intercepts ALL AI traffic at the boundary. CUI cannot exit without passing through houndshield.",
        "status": "covered — this is the core value prop"
      },
      {
        "practice": "SI.1.210",
        "title": "Malicious Code Protection",
        "how": "Prompt injection detection engine catches adversarial prompt inputs.",
        "status": "covered"
      },
      {
        "practice": "SI.1.211",
        "title": "Security Alerts and Advisories",
        "how": "Real-time alerts on policy violations. Webhook + email delivery.",
        "status": "covered"
      },
      {
        "practice": "IA.3.083",
        "title": "Multifactor Authentication",
        "how": "Keycloak supports MFA (TOTP, WebAuthn). Must be configured — not enforced by default.",
        "status": "partial — customer must enable MFA in Keycloak"
      }
    ],
    "houndshield_does_not_cover": [
      "Physical access controls (PE domain)",
      "Personnel security (PS domain)",
      "Configuration management for non-AI systems (CM domain)",
      "Incident response beyond AI-specific events (IR domain)",
      "Media protection (MP domain)"
    ],
    "sales_statement": "houndshield directly satisfies 10 of the 110 CMMC Level 2 practices, all related to AI system governance, boundary protection, audit, and cryptography. For a defense contractor that has adopted AI tools, these are among the most commonly failed practices in C3PAO assessments."
  },
  "soc2": {
    "relevant_criteria": ["CC6.1", "CC6.6", "CC7.2", "CC7.3"],
    "houndshield_evidence": {
      "CC6.1": "Logical access: Keycloak RBAC, audit log of all access events",
      "CC6.6": "External threats: prompt injection detection, block policy on malicious inputs",
      "CC7.2": "System monitoring: real-time dashboard, alert system, SIEM integration",
      "CC7.3": "Incident response: violation alerts, log export for incident investigation"
    }
  },
  "hipaa": {
    "relevant_rules": ["164.312(a)(1)", "164.312(b)", "164.312(e)(1)"],
    "phi_entities": ["SSN", "MRN", "DOB", "diagnosis_codes", "prescription_data", "insurance_id"],
    "houndshield_evidence": {
      "164.312(a)(1)": "Access control: Keycloak RBAC",
      "164.312(b)": "Audit controls: tamper-evident log",
      "164.312(e)(1)": "Transmission security: TLS 1.3, FIPS encryption"
    }
  }
}
```

### DOMAIN: competitors.json

```json
{
  "acquired": [
    {
      "name": "Protect AI",
      "acquirer": "Palo Alto Networks",
      "price": "$500M+",
      "date": "July 2025",
      "what_they_built": "LLM Guard (open source), ModelScan, NB Defense. ML model security.",
      "weakness_vs_houndshield": "Now part of Palo Alto XSIAM — requires buying into Palo Alto ecosystem. Not available standalone. No CMMC-specific workflow.",
      "lesson": "Open-source community (17,000 researchers) drove acquisition. Do this."
    },
    {
      "name": "Lakera",
      "acquirer": "Check Point",
      "price": "~$300M",
      "date": "September 2025",
      "what_they_built": "Gandalf game (1M users, 35M attack datapoints), Guardrails API (cloud-based).",
      "weakness_vs_houndshield": "Cloud-based — sends prompts to Lakera servers. Disqualifying for CUI. No CMMC focus.",
      "lesson": "Viral marketing (Gandalf game) drove community. Consider a CMMC game: 'Can you leak CUI?'"
    },
    {
      "name": "Prompt Security",
      "acquirer": "SentinelOne",
      "price": "~$250M",
      "date": "August 2025",
      "what_they_built": "Enterprise AI firewall. Cloud-based.",
      "weakness_vs_houndshield": "Cloud-based. No CMMC-specific features. Requires SentinelOne platform.",
      "lesson": "Validated the market is large enough for acquisition. We are building in the right space."
    },
    {
      "name": "Robust Intelligence",
      "acquirer": "Cisco",
      "price": "~$400M",
      "date": "October 2024",
      "what_they_built": "AI model validation and red-teaming. Enterprise.",
      "weakness_vs_houndshield": "Model validation focus, not runtime proxy. Different product.",
      "lesson": "Cisco paid $400M for AI security — market is validated at the top."
    },
    {
      "name": "Pangea",
      "acquirer": "CrowdStrike",
      "price": "~$260M",
      "date": "September 2025",
      "what_they_built": "Security API platform including AI security.",
      "weakness_vs_houndshield": "Developer API focus. Requires code integration. Not drop-in proxy.",
      "lesson": "CrowdStrike buying validates security platform consolidation."
    },
    {
      "name": "CalypsoAI",
      "acquirer": "F5",
      "price": "Undisclosed",
      "date": "September 2025",
      "what_they_built": "AI security for enterprises.",
      "weakness_vs_houndshield": "F5 network-level — same architectural approach but no CMMC focus.",
      "lesson": "F5 is now a competitor at the enterprise level. Watch."
    }
  ],
  "independent": [
    {
      "name": "Noma Security",
      "funding": "$132M",
      "status": "Independent",
      "target": "Fortune 500 financial services",
      "weakness_vs_houndshield": "Enterprise only. No SMB defense contractor play. No CMMC workflow. Quote-based pricing.",
      "threat_level": "LOW — different market segment"
    },
    {
      "name": "HiddenLayer",
      "funding": "$56M (Microsoft-backed)",
      "status": "Independent",
      "target": "ML model security (not runtime prompt proxy)",
      "weakness_vs_houndshield": "Model security focus, not prompt interception. Cloud-based.",
      "threat_level": "LOW — different product category"
    }
  ],
  "free_bundled": [
    {
      "name": "AWS Bedrock Guardrails",
      "pricing": "Included with Bedrock usage",
      "weakness_vs_houndshield": "Works ONLY for AWS Bedrock models. If customer uses ChatGPT, Claude.ai, GitHub Copilot, or any non-Bedrock tool, Bedrock Guardrails does nothing. No CMMC mapping. No audit log format for C3PAO.",
      "rebuttal": "We cover every AI tool simultaneously. Bedrock Guardrails covers one. Your employees use 6.",
      "threat_level": "MEDIUM — will confuse buyers who don't understand the scope limitation"
    },
    {
      "name": "Microsoft Purview (AI Hub)",
      "pricing": "Included with M365 E5",
      "weakness_vs_houndshield": "Microsoft ecosystem only. No coverage for OpenAI direct, Anthropic, or non-Microsoft AI. Complex to configure. No CMMC-specific workflow.",
      "threat_level": "MEDIUM — relevant for Microsoft-heavy enterprises"
    }
  ],
  "real_competitor": "Doing nothing. The modal response from defense contractors is zero AI governance. This is what we're replacing."
}
```

### DOMAIN: market.json

```json
{
  "primary_market": {
    "name": "US Defense Industrial Base (DIB)",
    "size": 76598,
    "unit": "organizations requiring CMMC Level 2",
    "compliance_rate": 0.014,
    "non_compliant": 75511,
    "deadline": "November 10, 2026",
    "urgency": "CRITICAL — contracts at risk for non-compliant organizations",
    "average_contract_value": "$2M-50M",
    "annual_cmmc_consulting_spend": "$3,000-15,000/month per organization",
    "houndshield_price": "$299-799/month",
    "roi_statement": "houndshield costs 2-10% of typical CMMC consulting spend and covers the AI governance gap consultants cannot fill."
  },
  "secondary_markets": [
    {
      "name": "Healthcare (HIPAA)",
      "size": "6,090 hospitals + thousands of clinics and health systems",
      "urgency": "HIGH — first HIPAA Security Rule update in 20 years (2025)",
      "entry_path": "Same product, HIPAA compliance mapping, PHI entity types already in Presidio"
    },
    {
      "name": "Financial Services (SOX, PCI DSS)",
      "size": "~15,000 regulated financial institutions",
      "urgency": "MEDIUM — AI governance requirements emerging but not yet mandatory",
      "entry_path": "P1 feature set, enter after defense contractor beachhead is established"
    }
  ],
  "buyer_profile": {
    "primary": {
      "title": "IT Director or CISO at 10-500 person defense contractor",
      "situation": "Told by prime contractor that CMMC Level 2 is now required. Assessment in 6-12 months. No dedicated compliance staff. No AI governance tools. Employees using ChatGPT daily.",
      "pain_intensity": "10/10 — contract loss is existential for the company",
      "budget_authority": "Yes — IT budget $50K-500K/year",
      "decision_speed": "Fast (weeks) when contract is at risk",
      "discovery_path": "CMMC RPO recommendation > Google search 'CMMC AI tools' > houndshield"
    }
  },
  "demand_signals": {
    "employees_pasting_data_into_ai": "77%",
    "enterprise_data_leaks_via_ai_2024": "42%",
    "average_ai_breach_cost": "$5.2M",
    "ai_breach_premium_over_conventional": "28%",
    "organizations_with_ai_security_incidents_2024": "86%",
    "shadow_ai_additional_breach_cost": "$670,000"
  },
  "market_size": {
    "ai_trisM_2024": "$2.34B",
    "ai_trisM_2030": "$7.44B",
    "cagr": "21.6%",
    "shadow_ai_segment_cagr": "39.4%",
    "ai_firewall_current": "$30M",
    "ai_firewall_2026": "$60M (projected)"
  }
}
```

### DOMAIN: gtm.json

```json
{
  "phase1_partners": [
    {
      "name": "Summit 7 Systems",
      "location": "Huntsville, AL",
      "type": "CMMC RPO (Registered Practitioner Organization)",
      "why_first": "Largest CMMC-focused MSP in the US. Hundreds of defense contractor clients. Deep DoD relationship.",
      "contact_approach": "LinkedIn outreach to VP of Services or CTO. Reference CMMC Phase 2 deadline.",
      "pitch": "We solve the AI governance gap your customers can't solve themselves. Drop-in. You get 30% recurring revenue.",
      "website": "https://summit7systems.com"
    },
    {
      "name": "SysArc",
      "location": "Annapolis, MD",
      "type": "CMMC RPO",
      "why": "Strong Mid-Atlantic presence. Known for accessible pricing for SMB defense contractors.",
      "website": "https://sysarc.com"
    },
    {
      "name": "CyberSheath Services",
      "location": "Fairfax, VA",
      "type": "CMMC RPO",
      "why": "Strong DC metro presence. Government contractor focus.",
      "website": "https://cybersheath.com"
    }
  ],
  "target_investors": [
    { "firm": "DataTribe", "focus": "Cybersecurity, government-adjacent", "location": "MD" },
    { "firm": "Shield Capital", "focus": "National security tech", "location": "DC" },
    { "firm": "Paladin Capital", "focus": "Defense, national security", "location": "DC" },
    { "firm": "Evolution Equity Partners", "focus": "Cybersecurity", "location": "NY" },
    { "firm": "Ten Eleven Ventures", "focus": "Cybersecurity", "location": "NY" }
  ],
  "open_source_strategy": {
    "component": "houndshield-scan",
    "license": "MIT",
    "what_it_includes": "PII/CUI detection engine (Presidio wrapper with CUI entity types). No dashboard, no compliance mapping, no deployment tooling.",
    "rationale": "Builds developer community (Protect AI playbook). Creates backlinks. Establishes credibility with C3PAO assessors. OSS scanner cannot compete with the full product.",
    "target": "500 GitHub stars in 6 months. 1,000 in 12 months."
  }
}
```

### DOMAIN: codebase.json

```json
{
  "stack": {
    "frontend": "Next.js 15, React 19, TypeScript strict, Tailwind CSS, Framer Motion",
    "backend": "Node.js (TypeScript strict), http-proxy, Next.js API routes",
    "database": "PostgreSQL 16 (self-hosted Docker) — REPLACING Supabase",
    "auth": "Keycloak (self-hosted Docker, OIDC/SAML) — REPLACING Supabase Auth",
    "detection": "Microsoft Presidio (Python, sidecar Docker container)",
    "payments": "Stripe",
    "email": "Resend",
    "deployment": "Docker Compose (SMB), Helm/Kubernetes (Enterprise), Vercel (SaaS dashboard only)"
  },
  "root": "compliance-firewall-agent/",
  "key_files": {
    "proxy": "app/api/gateway/intercept/route.ts",
    "detection": "lib/gateway/scanner.ts (calls Presidio sidecar)",
    "compliance": "lib/shieldready/controls.ts + scoring.ts",
    "dashboard": "app/command-center/page.tsx",
    "auth": "middleware.ts + lib/auth/keycloak.ts (NEW — replaces supabase)",
    "db": "db/schema.sql + db/migrations/"
  },
  "current_phase": "Month 1 — Foundation",
  "critical_blockers": [
    "Supabase replacement (CUI incompatibility) — MUST COMPLETE BEFORE FIRST CUSTOMER",
    "houndshield rebrand (Kaelus → houndshield) — complete in Week 1"
  ]
}
```

---

## Query Interface

```typescript
// brain/query.ts — Founder-facing query interface

import { readFileSync } from 'fs';
import { join } from 'path';

type Domain = 'compliance' | 'competitors' | 'market' | 'gtm' | 'codebase' | 'product';

export function queryBrain(domain: Domain, question?: string): Record<string, unknown> {
  const domainPath = join(__dirname, 'domains', `${domain}.json`);
  const data = JSON.parse(readFileSync(domainPath, 'utf-8'));
  
  if (!question) return data;
  
  // For structured queries, return relevant subset
  // Full AI query goes through Claude with this data as context
  return {
    domain,
    data,
    question,
    instruction: 'Pass this to Claude with the question for AI-assisted analysis'
  };
}

// CLI usage: npx ts-node brain/query.ts compliance "What CMMC practices does houndshield cover?"
// Agent usage: import { queryBrain } from './brain/query'; const ctx = queryBrain('competitors');
```

---

## Update Mechanism

```typescript
// brain/update.ts — Called post-session by brain-update.sh hook

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SessionUpdate {
  date: string;
  changes: string[];
  new_decisions: string[];
  market_intel?: string[];
}

export function updateBrain(domain: string, updates: Record<string, unknown>, session: SessionUpdate): void {
  const domainPath = join(__dirname, 'domains', `${domain}.json`);
  const existing = JSON.parse(readFileSync(domainPath, 'utf-8'));
  
  const updated = {
    ...existing,
    ...updates,
    _meta: {
      last_updated: session.date,
      last_session_changes: session.changes
    }
  };
  
  writeFileSync(domainPath, JSON.stringify(updated, null, 2));
  
  // Update session log in knowledge-graph.json
  const graphPath = join(__dirname, 'knowledge-graph.json');
  const graph = JSON.parse(readFileSync(graphPath, 'utf-8'));
  graph.last_updated = session.date;
  graph.session_log.push(session);
  writeFileSync(graphPath, JSON.stringify(graph, null, 2));
}
```
