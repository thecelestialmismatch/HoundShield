---
name: ast-outline
description: Use ast-outline for code exploration before full file reads. Works on .rs, .cs, .py, .ts, .tsx, .js, .jsx, .java, .kt, .go, .md files. Read structure (signatures, types, methods) before loading full content — 5-10x smaller than full reads.
---

# Code Exploration — ast-outline

For `.rs`, `.cs`, `.py`, `.pyi`, `.ts`, `.tsx`, `.js`, `.jsx`, `.java`, `.kt`, `.kts`, `.scala`, `.sc`, `.go`, and `.md` files, read structure with `ast-outline` **before** opening full contents.

Pull method bodies only once you know which ones you need.

**Stop at the step that answers the question.**

## 4-Step Ladder

### 1. Unfamiliar directory
```bash
ast-outline digest <dir>
```
One-page map of every file's types and public methods.

### 2. One file's shape
```bash
ast-outline <file>
```
Signatures with line ranges, no bodies — 5–10× smaller than a full read.

### 3. One method, class, or markdown section
```bash
ast-outline show <file> <Symbol>
```
Suffix matching: `TakeDamage`, or `Player.TakeDamage` when ambiguous.
Multiple at once: `ast-outline show Player.cs TakeDamage Heal Die`
For markdown: symbol is the heading text.

### 4. Who implements/extends a type
```bash
ast-outline implements <Type> <dir>
```
AST-accurate (skip `grep`), transitive by default with `[via Parent]` tags.
Add `--direct` for level-1 only.

Fall back to full read only when you need context beyond what `show` returned.

## Hound Shield Patterns

### Explore lib/brain-ai/
```bash
ast-outline digest compliance-firewall-agent/lib/brain-ai/
```

### Inspect a specific orchestrator shape
```bash
ast-outline compliance-firewall-agent/lib/brain-ai/multi-agent-orchestrator.ts
```

### Find who implements AgentResult interface
```bash
ast-outline implements AgentResult compliance-firewall-agent/lib/brain-ai/
```

### Explore API routes
```bash
ast-outline digest compliance-firewall-agent/app/api/
```

## Warning

If outline header contains `# WARNING: N parse errors`, the outline for that file is partial — read the source directly for the affected region.

```bash
ast-outline help    # flags and rare options
```

## Install

```bash
# macOS
brew install aeroxy/tap/ast-outline

# From source (Rust required)
git clone https://github.com/aeroxy/ast-outline.git
cd ast-outline && cargo install --path .
```
