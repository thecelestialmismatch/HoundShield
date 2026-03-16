# Technical Architecture Analysis: Token-Efficient Agent Patterns

## Executive Summary

Two complementary architectures for building token-efficient AI agents:

1. **ACE (Agentic Context Engine)** — In-context learning via Skillbook injection (49% token reduction)
2. **AutoResearch** — Task decomposition with time-budgeted autonomy and controlled scope

---

## Repository 1: ACE (Agentic Context Engine)

**URL:** https://github.com/kayba-ai/agentic-context-engine
**GitHub Stats:** Public, multiple integration points, comprehensive documentation
**Key Achievement:** 49% token reduction in browser automation; 20-35% performance gains

### Core Architecture

**Three-Role System:**
1. **Agent** — Executes tasks leveraging strategies from the Skillbook
2. **Reflector** — Analyzes execution traces using sandboxed code execution (not simple summarization)
3. **SkillManager** — Maintains the Skillbook by adding, refining, removing strategies

**Key Innovation:** The Recursive Reflector uses sandboxed Python execution to programmatically analyze traces and discover patterns, rather than single-pass summarization.

### Context Compression Strategy: Skillbook Injection

The **Skillbook** is a continuously evolving document of learned strategies injected as in-context knowledge. Rather than fine-tuning or training data, ACE compresses context by:

- **Collecting learned patterns** from successful executions
- **Injecting them directly into prompts** as pre-context knowledge
- **Continuously refining** based on reflection analysis

**Result:** 49% token reduction while maintaining/improving performance.

### Pipeline Architecture Pattern

The framework uses **step-based composition** with immutable context:

```
Step Contract:
- requires: {fields needed}
- provides: {fields written}

def __call__(ctx: StepContext) -> StepContext:
    # Pure function: constructor args + context → new context
    # Returns ctx.replace(**new_fields)
```

**Learning Tail (reusable across all runners):**
```
ReflectStep → TagStep → UpdateStep → ApplyStep
```

This sequence appears in TraceAnalyser, ACE, and all integrations.

### Skillbook Immutability Pattern

**Clever read-write separation:**
- Read-only steps: Access via `ctx.skillbook` (SkillbookView—only read methods)
- Write steps: Receive actual `Skillbook` via constructor injection
- **Benefit:** Mypy catches unauthorized mutations; context stays frozen

### Core Components (Type System)

```
Data Types:
- Skill (capability definition)
- Skillbook (collection + version tracking)
- UpdateOperation, UpdateBatch (change tracking)

Agent Roles:
- Agent, ReplayAgent, Reflector (configurable modes), SkillManager

Output Types:
- AgentOutput, ReflectorOutput, SkillManagerOutput

Adaptation Loops:
- OfflineACE (batch processing)
- OnlineACE (real-time learning)

Integrations:
- ACELiteLLM (100+ providers)
- ACELangChain (chain/agent wrapping)
- ACEAgent (browser-use enhancement)
- ACEClaudeCode (Claude Code CLI integration)
```

### Integration Pattern: Execute → Convert → Learn

**Two-step contract for each integration:**
1. Execute step: Framework interaction + skillbook injection → result
2. ToTrace step: Result conversion → standardized trace dict

Benefits: Independent testing, flexible trace formatting, easy customization.

### Session Memory Pattern for AI Agents

**Key for Kaelus.ai dev skill:**

1. **Skillbook as session state** — Store learned patterns across multi-step tasks
2. **Immutable context flow** — Each step receives frozen context, returns modified copy
3. **Stateless steps** — No invocation counters; use `global_sample_index` from context
4. **Trace-agnostic reflection** — Raw traces pass through unchanged; analysis stays in Reflector

**Session Memory Implementation:**
```python
class SessionSkillbook:
    def __init__(self):
        self.skillbook = Skillbook()
        self.trace_history = []

    def execute_with_learning(self, task):
        # 1. Execute task with current skillbook injected
        output = agent.run(task, context=skillbook)
        # 2. Trace execution
        trace = convert_to_trace(output)
        # 3. Reflect and update skillbook
        reflector_output = reflector.analyze(trace)
        self.skillbook.update(reflector_output.updates)
        # 4. Persist for next iteration
        self.trace_history.append(trace)
        return output
```

### Performance Characteristics

- **20-35% performance improvement** on complex tasks
- **49% token reduction** in browser automation
- **Doubled consistency** on multi-step agentic tasks (Tau2 Benchmark)
- **No context collapse** over extended interactions

---

## Repository 2: AutoResearch

**URL:** https://github.com/karpathy/autoresearch
**Default Branch:** master (not main)
**GitHub Stats:** Created 2026-03-06, 37K+ stars, 5K+ forks
**Language:** Python (single-GPU focused)

### Core Architecture: Three-File Design

**Fixed infrastructure** (human-controlled):
- `prepare.py` — Constants, one-time setup (data download, BPE tokenizer training, utilities)
- `program.md` — Human-authored instructions guiding agent behavior

**Experimental code** (agent-modified):
- `train.py` — Complete GPT model, optimizers (MuonAdamW), training loop (all agent edits here)

**Key principle:** Humans control research direction; agents optimize within constraints.

### Task Decomposition: Fixed Time-Budget Strategy

**5-minute wall-clock training window** enforces:
- **Comparability:** Different architectural mods remain directly comparable
- **Hardware optimization:** System converges toward best model for specific GPU
- **Autonomous iteration:** ~12 experiments/hour, ~100 overnight iterations

**Single-file modification principle:**
- Agents can only edit `train.py`
- Reviewable diffs for human oversight
- Clear separation: fixed infrastructure ↔ experimental variables

### Autonomous Research Iteration Loop

```
Continuous (until manually stopped):
1. Examine git state
2. Modify train.py experimentally
3. Commit changes
4. Execute training (5-min budget)
5. Extract metrics from logs
6. Record results in TSV (untracked)
7. Retain improvements OR revert failures
8. Continue → goto 1 (no pausing)
```

### Token/Batch Efficiency in Training

**Time-budgeted instead of token-budgeted:**
- Per optimizer step: ~524K tokens total
- Device batch: 128 sequences × 2048 tokens
- Gradient accumulation: `TOTAL_BATCH_SIZE / (DEVICE_BATCH_SIZE * MAX_SEQ_LEN)`
- Training stops when `total_training_time >= TIME_BUDGET` (after warmup)

**Token efficiency via document packing:**
```
Best-fit bin packing strategy:
- Each row starts with BOS token
- Select largest document that fits remaining space
- Crop only when necessary (shortest doc truncated)
- Result: 100% utilization (no padding waste)
```

### Tokenization Approach for Efficiency

**BPE (Byte Pair Encoding) via rustbpe:**
- Pattern: GPT-4 style with modifications
- Vocabulary: 8,192 tokens (includes 4 reserved)
- Efficiency tracking: Token ID → UTF-8 byte length lookup table
- Conversion: tiktoken encoding for runtime

### Architecture Configuration (GPTConfig)

**Model design emphasizes single-GPU efficiency:**
- 8 transformer layers, 768-dim embeddings
- 6 attention heads × 128-dim per head
- Sliding window attention (SSSL: alternating short/long windows)
- 32,768 vocabulary size
- RMSNorm, rotary position embeddings

**Optimizations:**
- CausalSelfAttention with Flash Attention 3
- Alternating value embeddings (ResFormer-style gating)
- MLP with `relu().square()` activation
- MuonAdamW hybrid optimizer (Muon for 2D, AdamW for embeddings/scalars)

### Constraints & Monitoring

**Permitted in train.py:**
- Model architecture changes
- Hyperparameter tuning
- Optimizer selection
- Batch size adjustments

**Prohibited (fixed):**
- No prepare.py modifications
- No package installations
- No evaluation changes
- No external dependencies

**Soft constraints:**
- Single GPU per run
- VRAM monitoring
- Crash recovery via stack trace

### Task Guidance Structure (program.md)

**Three-phase workflow:**

1. **Setup Phase:**
   - Agree on run tag (date-based)
   - Fresh branch creation
   - Context review of key files
   - Data verification
   - Results tracking initialization

2. **Experimentation Phase:**
   - Objective: "get the lowest val_bpb"
   - Trade-off principle: Simplicity valued equally with minor improvements

3. **Iteration Loop:**
   - Continuous autonomous refinement
   - No pausing between experiments

### Patterns Useful for Autonomous Multi-Step Execution

1. **Fixed-budget constraints** — Define clear time/resource limits for each subtask
2. **Single-file modification** — Restrict agent changes to one editable scope
3. **Markdown-based instructions** — Human-readable task guidance that remains static
4. **Continuous iteration** — No requirement to pause/request between experiments
5. **Git-backed state** — Version control enables safe reversion on failure
6. **Metrics as ground truth** — Optimize against numerical metric (val_bpb), not proxy signals

---

## Comparison Matrix

| Aspect | ACE | AutoResearch |
|--------|-----|--------------|
| **Primary Goal** | In-context skill learning | Autonomous research iteration |
| **Token Efficiency Method** | Skillbook injection | Document packing + time-budget |
| **Session State** | Skillbook (mutable, versioned) | Git-backed train.py |
| **Scope Control** | Role-based (Agent/Reflector/Manager) | File-based (prepare.py ↔ train.py) |
| **Context Compression** | 49% reduction via learned strategies | 100% packing utilization |
| **Autonomy Model** | Reflector-driven learning | Time-budgeted iteration |
| **Integration Points** | LiteLLM, LangChain, browser-use, Claude Code | Direct Python training |
| **Performance Gain** | 20-35% + consistency doubling | Val_bpb optimization |

---

## Patterns for Kaelus.ai Dev Skill

### 1. Session Memory Architecture (from ACE)

```python
class SessionMemory:
    """Persistent skill learning across task invocations"""

    def __init__(self):
        self.skillbook = Skillbook()      # Learned patterns
        self.trace_history = []           # Execution history
        self.context_view = SkillbookView(self.skillbook)  # Read-only

    def inject_into_prompt(self, base_prompt: str) -> str:
        """Prepend learned skills to compress context"""
        return f"{self.skillbook.format()}\n\n{base_prompt}"

    def learn_from_execution(self, execution_result):
        """Extract patterns from successful execution"""
        trace = self._to_trace(execution_result)
        updates = self.reflector.analyze(trace)
        self.skillbook.update(updates)
        self.trace_history.append(trace)
```

### 2. Step-Based Composition (from ACE)

```python
class CodeModificationStep:
    requires = {"task", "codebase"}
    provides = {"modifications", "reasoning"}

    def __call__(self, ctx: StepContext) -> StepContext:
        # 1. Inject learned patterns
        prompt = session.inject_into_prompt(ctx.task)
        # 2. Execute with full context
        modifications = agent.generate(prompt, ctx.codebase)
        # 3. Return frozen context update
        return ctx.replace(
            modifications=modifications,
            reasoning=modifications.metadata["reasoning"]
        )
```

### 3. Autonomous Multi-Step with Time Budgets (from AutoResearch)

```python
class AutonomousDevTask:
    """Mimic AutoResearch's continuous iteration pattern"""

    TIME_BUDGET = 300  # 5 minutes like AutoResearch

    def run_autonomous(self):
        start = time.time()
        iteration = 0

        while time.time() - start < self.TIME_BUDGET:
            iteration += 1

            # Single editable file approach
            result = self.modify_and_test()

            if result.success:
                # Persist improvement
                self.session_state.update(result)
            else:
                # Revert failure
                self.revert_to_last_good()

            # No pausing—continue iteration
            if not self.should_continue():
                break

        return self.session_state
```

### 4. Markdown-Based Task Guidance (from AutoResearch)

```markdown
# Dev Task: Implement Feature X

## Constraints
- Permitted: Modify src/feature.py (logic layer only)
- Prohibited: Change API contracts, dependencies
- Time budget: 10 minutes per improvement cycle

## Evaluation Metric
- Primary: All tests pass
- Secondary: Test execution time ≤ 5s

## Iteration Loop
1. Examine current state (git status)
2. Propose change in feature.py
3. Run tests
4. If pass: commit; if fail: revert
5. Continue until time budget exhausted
```

---

## Recommendations for Kaelus.ai Implementation

### Immediate Wins (from ACE)

1. **Skillbook Registry** — Store and inject learned patterns from past successful tasks
2. **Immutable context flow** — Use frozen dataclasses for task state, `.replace()` for updates
3. **Trace-based reflection** — Log execution traces, extract patterns programmatically
4. **Integration pattern** — Separate execution from trace conversion for flexibility

### Medium-term (from AutoResearch)

1. **Time-budgeted tasks** — Constrain autonomous work with clear time limits
2. **Markdown task specs** — Humans write program.md, agents edit implementation
3. **Single-file modification** — Restrict agent scope to one editable file per task
4. **Git-backed iteration** — Use version control for safe reversion on failure

### Session Memory Persistence

**Storage model (union of both):**
- Skillbook (learned patterns) — in-memory + serialized to disk
- Trace history — append-only log for future analysis
- Task context — frozen dataclass with `.replace()` updates
- Configuration — markdown + toml files (human-readable)

**Expected token savings:**
- ACE approach: 40-50% via skillbook injection
- AutoResearch approach: Additional 20-30% via precise scoping + time budgets
- Combined: 50-60% overall reduction on multi-step autonomous tasks

---

## Source References

1. **ACE Framework** (kayba-ai/agentic-context-engine)
   - README.md: Core architecture and performance metrics
   - AGENTS.md: Integration patterns and configuration
   - ACE_DESIGN.md: Pipeline, skillbook, and step protocols
   - PIPELINE_DESIGN.md: Composition and context flow patterns

2. **AutoResearch** (karpathy/autoresearch)
   - README.md (master branch): Architecture and task decomposition
   - program.md: Task guidance structure and iteration workflow
   - train.py: Training loop, token budget, and architecture
   - prepare.py: Tokenization and document packing strategy
