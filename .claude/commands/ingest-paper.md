---
description: Ingest a compliance document or research paper, extract findings, and optionally update the Brain AI knowledge graph. Works with PDFs, URLs, and local text files.
argument-hint: "<pdf-path | url | arxiv-id>"
---

# /ingest-paper

Fast triage ingest of compliance documents, NIST publications, CVE advisories, and research papers. `$ARGUMENTS` is the document reference.

## Step 0 — Greet and validate

Print:
> 📖 Ingesting document — extracting compliance findings. This may take a moment.

Check: does the document relate to CMMC, NIST, HIPAA, SOC 2, or security CVEs? If not, ask for confirmation before proceeding.

## Step 1 — Fetch and extract

**For PDF (local path)**:
```bash
# Extract text
pdftotext "$ARGUMENTS" /tmp/ingest-doc.txt
wc -l /tmp/ingest-doc.txt  # verify extraction worked
```

**For URL**:
```bash
# Download and extract
curl -L "$ARGUMENTS" -o /tmp/ingest-doc.pdf
pdftotext /tmp/ingest-doc.pdf /tmp/ingest-doc.txt
```

**For arxiv ID** (e.g., `2312.01234`):
```bash
curl "https://arxiv.org/pdf/$ARGUMENTS" -o /tmp/ingest-doc.pdf
pdftotext /tmp/ingest-doc.pdf /tmp/ingest-doc.txt
```

Parse the text into three slices:
- `brief.txt`: abstract + intro + conclusion (for quick summary)
- `findings.txt`: methods + results + requirements (for finding extraction)
- `meta.txt`: first 2 pages (for metadata)

## Step 2 — Scan Knowledge Graph for context

Read current Knowledge Graph nodes to avoid duplication:
```bash
grep -h '"id":' compliance-firewall-agent/lib/brain/knowledge-base.ts | head -80
```

## Step 3 — Fan-out: parallel extraction

Launch in **one parallel message**:

1. Invoke `compliance-drafter` agent with `brief.txt` — returns summary JSON (4 sections)
2. Invoke `compliance-researcher` agent with `findings.txt` + KG node list — returns findings JSON

## Step 4 — Assess document

After `compliance-drafter` returns, extract metadata:
- Document title, authority (NIST/CMMC-AB/other), publication date
- Trust level: 1-5 based on authority
- Framework: cmmc | nist | hipaa | soc2 | cve | guidance

## Step 5 — Review findings with user

Display extracted findings in a readable table:

```
| # | Statement | Source | Type | HS Coverage |
|---|-----------|--------|------|-------------|
| 1 | [statement] | §3.2 | regulatory | ✅ COVERED |
```

Ask: "Should any of these findings be added to the Brain AI knowledge graph? (y/n/select)"

## Step 6 — Update Knowledge Graph (if approved)

For approved findings, add nodes to `compliance-firewall-agent/lib/brain/knowledge-base.ts`:

```typescript
{
  id: "doc-<title-slug>-<year>-<n>",
  label: "<finding statement (truncated to 60 chars)>",
  category: "CMMC | NIST | CVE | HIPAA | SOC2",
  content: "<full finding statement>",
  source: "<document title>",
  confidence: <trust-level / 5>,  // e.g., 1.0 for NIST, 0.85 for draft
  nistControls: ["<control-ids>"],
  sprsWeight: <weight or null>,
  relations: ["<related-node-ids>"]
}
```

**NIST nodes**: `confidence: 1.0`, NO decay — spec doesn't change.
**Draft/guidance nodes**: `confidence: 0.7-0.85`, decay: `0.01/week`.

## Step 7 — Run build check

If Knowledge Graph updated:
```bash
cd compliance-firewall-agent && npm run build
```
Build must pass before commit.

## Step 8 — Report

End-of-run summary:
- Document title + trust level
- Finding count (total extracted / added to KG)
- KG nodes added or updated
- Hound Shield coverage assessment
- Any gaps identified

## Guardrails

- Never hallucinate NIST control numbers — verify in the document text
- Never update SPRS weights without CMMC-AB official source
- Never add nodes with `confidence > 0.85` unless source is NIST or DoD official
- KG update requires user confirmation before writing
- Build must pass after any KG change
