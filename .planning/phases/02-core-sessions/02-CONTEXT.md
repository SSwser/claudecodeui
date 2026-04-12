# Phase 2: Core Sessions - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers Project Management and Session Lifecycle capabilities: users can organize work into Projects (with optional multi-Workspace via worktree), manage sessions from creation through freeze/archive/delete, and navigate efficiently between projects and sessions via a redesigned Sidebar + Project Inbox architecture.

**Not in scope:** Virtual session branching (Phase 3), multi-pane/kanban views (Phase 5), Tab visual redesign (deferred).

</domain>

<decisions>
## Implementation Decisions

### Session Freeze/Resume Mechanism

- **D-01:** "Freeze" means safely killing the backend CLI process (Claude/Codex/etc.) and marking the session as frozen in the database. Claude/Codex already manage their own session snapshots — we do NOT need to implement snapshot persistence ourselves.
- **D-02:** Special attention required for Windows: must kill the entire process tree (child processes), not just the parent process. This is a known Windows-specific challenge.
- **D-03:** The data layer (message history) is always accessible from local files without starting any process. Users can read chat history of a frozen session. Only sending new messages requires a running process.
- **D-04:** Frozen sessions keep their Tab open with a frozen-state Badge (snowflake icon or similar). The Tab content area shows the chat history (read-only) with a prominent "Resume" action.
- **D-05:** Resuming a frozen session displays a summary/context of the last conversation state. The user manually decides next steps — no automatic prompt injection.
- **D-06:** Freeze can be triggered from two places: Tab right-click context menu, and chat interface top action bar button.
- **D-07:** Future extensions (idle auto-sleep, scheduled wake-up for task execution) are noted but out of Phase 2 scope. The freeze architecture should not block these.

### Sidebar / Navigation Restructure

- **D-08:** Complete Sidebar redesign. Sessions list is NO LONGER in the Sidebar — it moves to the MainContent area (Project Inbox).
- **D-09:** Sidebar has two distinct sections:
  - **Top section:** Global recent sessions (last 10 across all projects). Clicking a recent session navigates directly to the chat interface.
  - **Bottom section:** Project list. Each project shows only name + status indicator (dot if has active sessions). Clicking a project opens its Project Inbox in MainContent.
- **D-10:** Project Inbox in MainContent is a simplified Inbox-style view for Phase 2: session list with status, search, and CRUD operations. Designed to evolve into a richer Inbox experience in later phases (multi-session views, kanban, split-pane — this is WHY these later phases exist).
- **D-11:** Session items in Project Inbox display: name + last message timestamp + status Badge (Active/Frozen/Archived) + AI provider icon. Hover (desktop) or long-press (mobile) shows last message preview.

### Workspace Model

- **D-12:** By default, each Project = one implicit Workspace. No multi-Workspace UI exposed unless explicitly enabled.
- **D-13:** Users can enable multi-Workspace management per project during creation or in project settings. Once enabled, it CANNOT be disabled (irreversible).
- **D-14:** When multi-Workspace is enabled, Workspaces are backed by git worktrees. Each Workspace = a worktree branch.
- **D-15:** Active Workspace can be switched via MainContent header (within Project Inbox) or a dedicated Sidebar section (similar to the existing update notification area).
- **D-16:** Use case: parallel work streams within one project (like channels/topics/branches), not frequent cross-project switching.

### Project Creation Flow

- **D-17:** Redesigned 3-step creation wizard:
  1. Project basics (name only currently)
  2. Directory selection (local folder or git repo URL)
  3. Enable Workspace management toggle (optional, off by default)
- **D-18:** Local project scanning is manual — user triggers "Import project" action, not automatic on first launch.

### Session Search

- **D-19:** Search lives in the Project Inbox — scoped to the current project's sessions.
- **D-20:** Full-text search of message content, with backend async index building using SQLite FTS5.
- **D-21:** Search UX: instant title filtering (as-you-type) + debounced full-text search (after typing pause). Two-tier results display.

### Deletion Behavior

- **D-22:** Deleting a Project is a soft delete (DB flag only). No local filesystem changes. Sessions and history are preserved and accessible through an archive/deleted area.
- **D-23:** When multi-Workspace is enabled: deleting a Workspace prompts whether to also delete the associated git worktree. If user declines, the worktree reverts to a regular branch visible in GitPanel, no longer associated with a Workspace.
- **D-24:** When multi-Workspace is NOT enabled: no Workspace delete option exists — only project-level soft delete.

### Tab Behavior (Partial — Deferred)

- **D-25:** Tab right-click context menu includes freeze/archive/close actions.
- **D-26:** Tab visual design and open behavior (single-click vs new tab) are deferred for a dedicated Tab redesign discussion. Current behavior is maintained for Phase 2.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements and Prior Decisions

- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, requirements PROJ-01 through SESS-08
- `.planning/REQUIREMENTS.md` — Full requirement definitions for Project Management and Session Management
- `.planning/PROJECT.md` — Project constraints, tech stack decisions, virtual session architecture overview
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1 locked decisions: Landing Page structure, Tab model (browser-style), Workspace creation modes (logical vs worktree), layout system (CSS Grid), startup behavior

### Existing Code (Key Files)

- `src/hooks/useProjectsState.ts` — Current project state management hook (will need significant changes)
- `src/hooks/useAppTabs.ts` — Tab management hook (interface preserved, freeze state added)
- `src/components/sidebar/` — Current Sidebar components (complete restructure needed)
- `src/components/home/LandingPage.tsx` — Landing Page (Phase 1, reference for design patterns)
- `server/routes/projects.js` — Backend project/workspace routes (workspace validation, clone support)
- `server/database/init.sql` — Current DB schema (needs new tables for workspace, session state)
- `server/database/db.js` — Database layer (needs FTS5 index, session state columns, soft-delete)
- `server/sessionManager.js` — Session process management (freeze/kill logic lives here)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `SidebarProjectList` / `SidebarProjectItem` / `SidebarSessionItem` — Will be restructured but contain existing project/session rendering logic
- `useHomePreferences` — Home page preferences hook, pattern for Inbox preferences
- `useAppTabs` — Tab management with add/remove/switch; needs freeze state extension
- `FavoritesSection` / `RecentSessionsList` — Landing page components with favorites/recent patterns
- `server/routes/projects.js` — Workspace path validation, worktree creation, git clone support already implemented
- `session_names` table in DB — Custom session naming pattern to reuse for session metadata

### Established Patterns

- State management: React Context + hooks (no Zustand yet in codebase)
- Styling: Tailwind CSS with semantic tokens (bg-background, text-foreground, etc.)
- DB: better-sqlite3 with migration system in db.js
- Real-time: WebSocket messages for session updates (AppSocketMessage type)
- i18n: react-i18next with translation keys

### Integration Points

- Sidebar connects to useProjectsState for project data
- MainContent renders based on React Router routes
- Tab strip is in the shell component layer
- WebSocket messages broadcast session state changes
- Session process management in server/sessionManager.js

</code_context>

<specifics>
## Specific Ideas

- **Inbox metaphor:** User explicitly described wanting the project view to feel like an Inbox — "让用户作为首席信息官高效做出决策" (let users act as Chief Information Officers making efficient decisions). This is the foundational UX principle for the Project Inbox design.
- **Workspace = parallel work streams:** User compared Workspaces to channels/topics/branches — lightweight parallel contexts within one project, NOT heavyweight isolation between projects.
- **Process lifecycle clarity:** The freeze/resume model intentionally separates data access (always available, local files) from compute (process lifecycle). This separation is a core architectural principle that enables future features like idle sleep and scheduled wake-up.

</specifics>

<deferred>
## Deferred Ideas

- **Tab visual redesign** — Current tab design doesn't match user expectations. Needs dedicated discussion before implementation. May affect Phase 2 Tab behavior decisions.
- **Idle auto-sleep / scheduled wake-up** — Automatically freeze idle sessions; wake frozen sessions on schedule to execute tasks. Phase 3+ scope.
- **Rich Inbox evolution** — The simplified Inbox in Phase 2 is designed to grow into multi-session monitoring views, kanban boards, and split-pane in Phase 5.
- **Landing Page redesign** — User noted the current Landing Page is "太难看且信息混乱" (ugly and information is chaotic). Needs design attention but not in Phase 2 scope.

</deferred>

---

_Phase: 02-core-sessions_
_Context gathered: 2026-04-12_
