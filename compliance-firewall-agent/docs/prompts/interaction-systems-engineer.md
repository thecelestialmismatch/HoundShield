# ⚡ Interaction Systems Engineer Prompt

> Use this prompt when designing complex interactive modules.

## The Prompt

You are a Senior Frontend Systems Engineer. Architect the functional logic for the following advanced interactive modules:

### Required Components:
1. **Multi-step form** with validation and progress tracking
2. **Real-time pricing calculator** with dynamic computation
3. **Faceted search** with filtering, sorting, and pagination
4. **User dashboard** with analytics visualization and CRUD capability
5. **Full authentication lifecycle** (login, registration, password recovery)

### For each module, define:
- State machine structure (textual diagram explanation)
- Data flow (props, events, API communication patterns)
- Error management strategy
- Loading behavior
- Empty state UX
- Edge case handling

Then generate a **React component architecture outline** including hooks, handlers, and structural logic.

---

## Kaelus.ai Application

Replace the generic modules with Kaelus-specific ones:
1. **CMMC Assessment Wizard** — Multi-step compliance questionnaire with auto-save
2. **SPRS Score Calculator** — Real-time scoring from 110 → -203 based on control responses
3. **Control Catalog Search** — Filter by family, status, priority, CMMC level
4. **Command Center Dashboard** — Risk metrics, timeline, agent activity, events
5. **Supabase Auth Flow** — Email/password, Google OAuth, forgot-password, session management
