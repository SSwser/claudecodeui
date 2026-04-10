# Project Research Summary

**Project:** CloudCLI UI - Desktop UX Enhancement
**Domain:** Multi-AI coding assistant desktop application with session organization
**Researched:** 2026-04-10
**Confidence:** MEDIUM-HIGH

## Executive Summary

CloudCLI UI is a desktop AI coding assistant that manages multiple AI provider sessions (Claude, Cursor, Codex, Gemini). The v1 enhancement focuses on **organization management, virtual session branching, and UI component migration**. Research indicates the best approach is a **CSS Grid-based multi-pane layout** with **Context + Immer state management** extending the existing React 18 architecture, plus **@dnd-kit for accessible drag-and-drop**. The ~26KB bundle increase is acceptable for the feature scope.

The virtual session mechanism is the core differentiator. It uses a **hybrid branching model** (transparent auto-branch + visible manual controls) to solve context window limits. This follows Git branch semantics that users already understand. Key implementation challenges include: preventing Zustand store memory leaks, avoiding WebSocket race conditions across tabs, and maintaining context continuity during automatic branching.

For v1, prioritize **Landing Page + Layout Infrastructure**, then **Session Management + Virtual Sessions**, then **UI Component Migration**. Multi-window tiling, Kanban views, and WebSocket cross-pane sync should be deferred to v2+.

## Key Findings

### Recommended Stack

The recommended stack extends existing architecture with minimal additions. **@dnd-kit** (core, sortable, utilities) replaces deprecated react-beautiful-dnd for accessible, performant drag-and-drop. **Immer** enables immutable state updates with minimal boilerplate, following existing Context patterns. **CSS Grid** handles multi-pane layout without iframe isolation overhead.

**Core technologies:**
- **@dnd-kit/core ^6.x** — React 18 native drag-and-drop primitives with accessibility
- **@dnd-kit/sortable ^8.x** — Sortable lists built on dnd-kit core
- **@dnd-kit/utilities ^3.x** — Minimal tree-shakeable CSS utilities
- **Immer ^10.x** — Immutable state updates, use with every Context reducer
- **CSS Grid (native)** — Multi-pane layout, no bundle size cost
- **react-window** (optional) — Virtualized lists for 100+ Kanban cards

**Bundle impact:** ~26KB gzipped total (dnd-kit ~20KB + Immer ~6KB)

### Expected Features

**Must have (table stakes):**
- Landing Page with recent projects/sessions and favorites
- Project/Workspace management with worktree detection
- Session pause/freeze and resume
- Multi-tab session management
- Basic UI component migration (shadcn/ui integration)

**Should have (competitive):**
- Virtual session mechanism with hybrid branching (auto + manual)
- Context compression (sliding window + summarization + pruning)
- Session timeline visualization (Git branch model)
- Basic Kanban layout (deferred to late v1 or v2)

**Defer (v2+):**
- Multi-window tiling (CSS Grid panes)
- Full Kanban view with drag-and-drop
- Workspace swimlanes
- Cross-pane WebSocket synchronization
- Mobile adaptation
- Desktop packaging (Tauri/Electron)

### Architecture Approach

The architecture extends existing patterns: **LayoutContext + CSS Grid** for view modes (single/dual/quad/kanban), **normalized Kanban state** for O(1) lookups, and **immutable state updates** via Immer. The existing WebSocketContext can be extended for cross-pane sync in a later phase.

**Major components:**
1. **LayoutContext** — View mode, pane configuration, layout persistence to localStorage
2. **LayoutContainer** — CSS Grid template management with responsive breakpoints
3. **Pane** — Isolated session container rendered per grid slot
4. **KanbanContext** — Normalized lane/card state with immutable updates
5. **SyncProvider** (Phase 4+) — WebSocket message protocol for cross-pane state sync

### Critical Pitfalls

1. **Zustand Store Memory Leaks** — useSessionStore returns stable references via useMemo, causing unbounded session accumulation. Sessions are added but never removed. **Prevention:** Implement LRU eviction policy with configurable max (50 sessions), add explicit cleanup on archive/delete.

2. **WebSocket Multi-Tab Race Conditions** — Each tab maintains independent WebSocket connections. session_state changes may arrive out of order, causing duplicate messages or UI inconsistencies. **Prevention:** Add tab identification to messages, implement optimistic updates with versioning.

3. **Virtual Session Branching Breaks Context Continuity** — Auto-branching happens transparently without user notification, causing AI responses to reference wrong branch context. **Prevention:** Show visual branch indicator, provide "View Branch Timeline" UI before auto-branch, add branch management controls.

4. **Component Library Migration Breaks i18n Context** — Migrating to shadcn/ui may break existing translation keys or use hardcoded strings. **Prevention:** Audit all translation keys before migration, create old→new key mapping document, set up CI checks for hardcoded strings.

5. **Provider Adapter Contract Mismatch** — UI components depend on NormalizedMessage type matching server-side adapter outputs. Adding new message kinds without updating both ends causes silent failures. **Prevention:** Create shared message type definition, establish contract tests, use TypeScript strict mode.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundational work and risk mitigation:

### Phase 1: Foundation — Landing Page + Layout Infrastructure
**Rationale:** Establishes visual anchor and reusable layout primitives before building session features. Low risk, high confidence patterns.

**Delivers:** Landing page with recent projects/sessions, favorites UI, LayoutContext, LayoutContainer with CSS Grid templates, view mode switcher.

**Addresses:** Landing Page feature, Multi-window foundation.

**Avoids:** Premature drag-and-drop complexity, WebSocket sync complexity.

**Uses:** CSS Grid, LayoutContext + Immer, localStorage persistence.

---

### Phase 2: Core Sessions — Project Management + Session Lifecycle
**Rationale:** Implements project workspace concept and session CRUD before adding branching complexity. Session management is prerequisite for virtual sessions.

**Delivers:** Project/Workspace CRUD, worktree detection, session create/archive/delete, session freeze/resume UI.

**Addresses:** Project management, Session freeze/pause.

**Avoids:** Store memory leaks by implementing eviction policy early.

**Research Flag:** Database migration for session schema — needs careful testing to avoid corrupting existing data.

---

### Phase 3: Virtual Sessions — Hybrid Branching + Timeline
**Rationale:** Core innovation differentiator. Must be rock-solid as it affects all user sessions. Depends on Phase 2 session infrastructure.

**Delivers:** Virtual session data model, branch table/relationships, hybrid branching (auto + manual), context compression (sliding window + pruning), session timeline visualization, branch management panel.

**Addresses:** Virtual session mechanism, Context compression, Branch timeline.

**Avoids:** Context continuity issues by implementing branch indicator UI and timeline before auto-branch.

**Research Flag:** Compression quality — protected context patterns need validation with real user conversations.

---

### Phase 4: UI Migration — Component Library + i18n
**Rationale:** UI component migration is independent of session features but must be coordinated. i18n is critical to get right.

**Delivers:** shadcn/ui component integration, translation audit and mapping, CSS variable system for theming.

**Addresses:** Component library migration.

**Avoids:** i18n breakage by auditing keys first, setting up CI checks.

**Research Flag:** Style conflicts between Tailwind and shadcn defaults — implement visual regression tests.

---

### Phase 5: Multi-Pane + Kanban (v2 transition)
**Rationale:** More complex features that benefit from stability of previous phases. WebSocket sync is deferred entirely.

**Delivers:** Multi-pane sessions (refactor MainContent), basic Kanban layout (lanes), @dnd-kit integration.

**Addresses:** Multi-tab support, Basic Kanban.

**Avoids:** WebSocket race conditions by using local state only (no sync).

**Research Flag:** Performance with multiple ChatInterface instances — may need virtualization for 4+ panes.

---

### Phase Ordering Rationale

- **Phase 1-2 build foundation** — Layout primitives and session management are prerequisites for everything else
- **Phase 3 is the differentiator** — Virtual sessions require solid session infrastructure first
- **Phase 4 can run parallel** — UI migration is independent but needs coordination with session features
- **Phase 5 is v2 scope** — Multi-pane and Kanban are additive on stable foundation
- **WebSocket sync deferred** — Too many variables, wait for stable multi-pane baseline

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2 (Database):** Complex migration for session schema, needs testing against production-sized data
- **Phase 3 (Compression):** Protected context patterns need validation with real conversations
- **Phase 4 (Styles):** Tailwind + shadcn conflict resolution needs visual regression testing setup
- **Phase 5 (Performance):** Multiple ChatInterface instances may need architectural changes

Phases with standard patterns (skip research-phase):

- **Phase 1 (Layout):** CSS Grid + Context is well-established, existing codebase patterns
- **Phase 2 (CRUD):** Standard patterns, minimal new territory

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Well-established React ecosystem, @dnd-kit battle-tested |
| Features | HIGH | Kanban and virtual session patterns are mature |
| Architecture | HIGH | CSS Grid + Context + Immer follows proven patterns |
| Pitfalls | MEDIUM | Codebase analysis + engineering principles, not production-validated |
| Performance | MEDIUM | Estimates based on similar apps, needs measurement |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Context compression quality:** Protected patterns (variable declarations, imports) need testing with real conversations to validate they preserve enough context
- **Multi-pane performance:** Rendering multiple ChatInterface instances is expensive; may need CodeMirror sharing or virtualization
- **Cross-tab sync complexity:** BroadcastChannel + WebSocket hybrid needs prototype before full implementation
- **Mobile Kanban touch:** Drag-and-drop gestures on tablet not researched
- **Real-time collaboration:** CRDT vs operational transforms not evaluated

## Sources

### Primary (HIGH confidence)
- @dnd-kit official documentation (https://dndkit.com) — Library selection and implementation patterns
- Immer documentation (https://immerjs.github.io/immer/) — State management patterns
- CSS Grid Layout specification (W3C) — Layout implementation
- Existing CloudCLI UI codebase (src/contexts/, src/hooks/) — Current architecture patterns

### Secondary (MEDIUM confidence)
- CloudCLI UI codebase analysis (PITFALLS.md) — Identified risks from code review
- Product analysis of Claude Code, Cursor, GitHub Copilot (FEATURES.md) — Competitive positioning
- React Context + Immer patterns community consensus

### Tertiary (LOW confidence)
- Session timeline visualization design — Needs user testing
- Compression quality heuristics — Needs production validation
- Multi-pane performance estimates — Needs measurement

---

*Research completed: 2026-04-10*
*Ready for roadmap: yes*
