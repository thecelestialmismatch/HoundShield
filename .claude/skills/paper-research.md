---
name: paper-research
description: Use when analyzing research papers, NIST publications, CMMC guidance documents, or compliance frameworks. Extracts atomic findings, assesses credibility, and links to existing knowledge graph. Especially useful for NIST SP 800-171 revisions, CMMC scoping guides, and C3PAO assessment guides.
---

# Paper Research — Compliance Document Analyzer

Analyzes research papers and compliance documents. Extracts atomic findings, assesses quality, and integrates knowledge into the Brain AI knowledge graph.

## When to Use

- Analyzing new NIST SP 800-171 revisions
- Processing CMMC Assessment Guides from CMMC-AB
- Reading C3PAO assessor guidance
- Reviewing CVE advisories for security patterns
- Processing SOC 2 or HIPAA updates (post-$10K MRR)

## Core Workflow

### Step 1: Read the Document

```bash
# PDF: extract text
pdftotext document.pdf document.txt

# Or use pdfplumber for structured extraction
python3 -c "
import pdfplumber
with pdfplumber.open('document.pdf') as pdf:
    text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
    print(text[:5000])  # preview first 5000 chars
"
```

### Step 2: Extract Atomic Findings

Each finding must be:

1. **Atomic** — one proposition per finding. Split "X improves Y AND reduces Z" into two.
2. **Testable** — something a future document could support or contradict.
3. **Sourced** — cite section and page: `§3.2, p.5`
4. **Typed** — one of:
   - `empirical`: supported by measurements/data
   - `regulatory`: formal requirement or control
   - `definitional`: a new definition, metric, or formalization
   - `guidance`: recommended practice, not mandatory

Output format:
```json
[
  {
    "statement": "CMMC Level 2 requires implementation of all 110 NIST SP 800-171 Rev 2 practices",
    "source-ref": "§1.3, p.12",
    "finding-type": "regulatory",
    "hedging": "asserted",
    "quote": "Level 2 encompasses all 110 practices in NIST SP 800-171...",
    "nist-controls": ["AC.L2-3.1.3", "AU.L2-3.3.1"]
  }
]
```

`hedging` values:
- `asserted`: stated as fact
- `hedged`: with qualifications
- `speculative`: authors flag as conjecture

### Step 3: Assess Document Quality

```json
{
  "credibility": 5,           // 1-5: trust given authority + evidence
  "regulatory-authority": 5,  // 1-5: official vs informal source
  "reproducibility": "code-released | partial | none",
  "rationale": "NIST SP 800-171 Rev 2 is the authoritative CMMC Level 2 requirement source. DoD-mandated."
}
```

Authority hierarchy:
- **5**: NIST SP / FIPS / DoD directive / CMMC-AB official
- **4**: C3PAO published guidance / major defense contractor guidance
- **3**: Industry analysis / consultant white papers
- **2**: Blog posts / unofficial analysis
- **1**: Speculation / unverified claims

### Step 4: Link to Knowledge Graph

After extracting findings, check which Knowledge Graph nodes they update:

```typescript
// lib/brain/knowledge-base.ts nodes to update:
// - Domain nodes: "AC - Access Control", "AU - Audit and Accountability", etc.
// - SPRS scoring weights if changed
// - Competitor nodes if relevant

// Run: npx tsx lib/brain/knowledge-base.ts  (to verify node structure)
```

For NIST nodes: mark `source: "NIST SP 800-171 Rev 2"` and `confidence: 1.0` — never decay.
For advisory nodes: `confidence: 0.9`, decay rate: `0.01/week`.

### Step 5: Update Knowledge Graph

Edit `compliance-firewall-agent/lib/brain/knowledge-base.ts`:

```typescript
{
  id: "nist-ac-update-2026",
  label: "AC.L2-3.1.3 Update — 2026 Guidance",
  category: "CMMC",
  content: "[finding statement]",
  source: "NIST SP 800-171 Rev 3 (draft)",
  confidence: 0.85,  // draft — not final
  nistControls: ["AC.L2-3.1.3"],
  sprsWeight: 5,
  relations: ["nist-ac-access-control"]
}
```

## Compliance Document Sources

| Source | URL | Trust |
|---|---|---|
| NIST SP 800-171 Rev 2 | csrc.nist.gov | 5 |
| CMMC Assessment Guide L2 | dodcio.defense.gov | 5 |
| CMMC-AB Scoping Guide | cyberaxb.com | 4 |
| CUI Registry | cui.archives.gov | 5 |
| NIST SP 800-171A | csrc.nist.gov | 5 |

## Guardrails

- **Atomic findings only** — 3-8 per document is typical
- **Never hallucinate NIST control numbers** — verify against the official NIST source
- **SPRS weights are fixed** — do not change without explicit CMMC-AB guidance
- **No per-item LLM loops** — batch findings, don't iterate per sentence
- NIST nodes: `confidence: 1.0`, no decay
- Draft documents: `confidence: 0.7-0.85`
