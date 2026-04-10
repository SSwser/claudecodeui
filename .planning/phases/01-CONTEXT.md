# Phase 1 Context: Foundation - Landing Page + Layout Infrastructure

**Phase Goal:** Users land on a welcoming page that shows recent projects and sessions, with the layout system ready for multi-pane expansion.

**Requirements Covered:** LAND-01 through LAND-07, LAY-01 through LAY-05 (12 total)

---

## Decisions

### Landing Page Structure

**Layout Model:** Hybrid Google Drive-inspired design
- **Top bar:** Global search + multi-dimensional filters (Project/Workspace/Type)
- **Favorites section:** Card-based display of favorited workspaces and sessions
- **Recent section:** Timeline-style list of recent sessions with status indicators
- **No sidebar:** Top filters replace traditional sidebar navigation

**Visual Structure:**
```
┌─────────────────────────────────────────────────┐
│  CloudCLI UI                        [新建会话]   │
├─────────────────────────────────────────────────┤
│  🔍 [搜索会话、项目...]                          │
│  [全部] [项目▾] [工作区▾] [会话类型▾]           │
├─────────────────────────────────────────────────┤
│  ⭐ 收藏                          [查看全部>]    │
│  📂 Workspace (3)                                │
│  [卡片] [卡片] [卡片]                            │
│  💬 会话 (5)                                     │
│  [卡片] [卡片] [卡片]                            │
├─────────────────────────────────────────────────┤
│  📋 最近的会话                                   │
│  [列表项 - 状态 + 预览 + 元信息]                 │
│  [列表项]                                        │
│  [加载更多...]                                   │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Search box supports session name, content, and project name
- Cascading filters: [Project] → [Workspace] → [Session Type]
- Favorites section shows max 3-4 workspaces + 5 sessions by default
- Recent sessions show status indicators: 🟢 Active / 🔵 Paused / ⚪ Archived
- Projects appear as auxiliary metadata, not primary organization

### Navigation Behavior

**Tab Model:** Browser-style tab navigation (similar to VS Code)
```
┌─────────────────────────────────────────────┐
│ [🏠] [会话A ×] [会话B ×] [会话C ×]  [+]     │
├─────────────────────────────────────────────┤
│         Current session content              │
└─────────────────────────────────────────────┘
```

**Startup Behavior:** User-configurable
- Options: Full restore / Last active only / Always Landing Page
- Default: Full restore (most friendly for multi-tasking users)
- Stored in user preferences (localStorage or database)

**Tab Insertion:** New tabs insert to the right of current active tab

**Last Tab Close:** Show empty state with "Open Session" prompt (not Landing Page, not exit app)

### Layout System (Phase 1 Scope)

**Dual-View Support:** Simple left-right split for Phase 1
- Single view (default)
- Dual view (1x2 horizontal split)
- Phase 5 will expand to grid layouts (2x2, 3x3, etc.)

**Switching Mechanisms:** Combined approach
- Top toolbar button `[⊞ 布局]`
- Drag tab to edge for split
- Right-click tab menu "Open in New Pane"

**Persistence:** Global - remembers last used layout mode across restarts

**Implementation:** CSS Grid (native, no bundle cost)

### Workspace Implementation

**Default Mode:** Pure logical workspace (no worktree)
- Workspaces are logical containers stored in database
- Multiple workspaces can share same filesystem directory
- Lightweight, no git dependency

**Optional Worktree-Backed Mode:**
- User can choose to create worktree when creating workspace
- Similar to `/gsd-new-workspace` functionality
- Each workspace gets independent filesystem directory + git branch
- UI shows worktree path and branch info

**Creation Flow:**
```
Create Workspace Dialog:
- Name: [________]
- Type:
  ○ Logical workspace (shared filesystem) [DEFAULT]
  ○ Independent worktree (create new git worktree)
- If worktree selected:
  - Branch: [________]
  - Based on: [main ▾]
```

**Lifecycle:**
- Delete workspace → Ask user if worktree should also be deleted
- Existing worktrees → User manually associates with workspace (not auto-import)

### Favorites Functionality

**Scope:** Sessions + Workspaces only
- Projects support "hide" (not "favorite")
- Favorites are for quick access, hide is for reducing clutter

**Organization:** Split display
```
⭐ 收藏                    [查看全部>]
📂 Workspace (3)
[cards...]
💬 会话 (5)
[cards...]
```

**Limits:** Soft limit with overflow
- Landing Page shows top 3 workspaces + top 5 sessions
- Sorted by recent activity by default
- "View All" opens dialog with full list + search
- Warning when exceeds 20 items (soft limit, not enforced)

**Persistence:** Global (shared across all projects)

### Design System

**Component Library:** shadcn/ui
- Copy-to-project model (no runtime dependency)
- Full customization control
- Tailwind-native

**Migration Strategy:** Hybrid (critical components first)
- Priority: Button, Input, Dialog, Select (high-frequency components)
- New features use shadcn/ui exclusively
- Non-critical components migrate opportunistically

**Theme System:** Tailwind configuration
- Extend Tailwind theme for colors, spacing, typography
- Avoid CSS variables for Phase 1 (keep it simple)
- Phase 4 will formalize full theme system

---

## Constraints

### Technical
- **React 18 + TypeScript** - existing stack, no framework changes
- **Tailwind CSS 3.4** - existing styling system
- **WebSocket (ws)** - existing real-time communication
- **SQLite** - existing database, schema changes must be backward-compatible
- **Vite** - existing build tool

### Architectural
- **Context pattern** - extend existing AuthContext, WebSocketContext patterns
- **No Redux** - use Context + Immer for state management
- **Progressive enhancement** - Landing Page must not break existing session entry paths during development

### Performance
- **Landing Page load** - must render within 500ms for 100+ projects
- **Tab switching** - must feel instant (<100ms perceived latency)
- **Layout persistence** - localStorage read/write must not block UI

### Compatibility
- **Existing sessions** - must continue to work without migration
- **Existing routes** - `/chat`, `/projects` routes must remain functional during Landing Page development
- **Provider adapters** - no changes to provider abstraction layer

---

## Codebase Assets

### Existing Contexts (Reusable Patterns)
- `src/contexts/AuthContext.jsx` - Context + reducer pattern
- `src/contexts/WebSocketContext.tsx` - WebSocket state management
- `src/contexts/ThemeContext.jsx` - Theme persistence to localStorage
- `src/contexts/TaskMasterContext.ts` - Complex state with Immer-like updates

**Pattern to follow:** Context + useReducer + localStorage persistence

### Existing Hooks
- `src/hooks/useLocalStorage.jsx` - localStorage persistence hook
- `src/hooks/useProjectsState.ts` - Project list state management
- `src/hooks/useUiPreferences.ts` - UI preferences persistence

**Reuse for:** Layout mode persistence, favorites persistence, startup behavior config

### Existing Components (Reference for Style)
- `src/components/sidebar/Sidebar.jsx` - Navigation patterns
- `src/components/main-content/MainContent.jsx` - Layout container patterns
- `src/components/chat/ChatInterface.jsx` - Session rendering (will be embedded in panes)

### Existing Routes
- `src/App.jsx` - Route definitions
- Current entry point: `/chat` (direct to session)
- Need to add: `/` (Landing Page), preserve `/chat` for backward compat

### Database Schema (Existing)
- `server/database/schema.sql` - sessions, projects, users tables
- Need to add: workspaces table, favorites table, layout_preferences table

---

## Open Questions

### For Research Phase
1. **Landing Page performance:** How to efficiently render 100+ projects without virtualization? Should we implement pagination or infinite scroll?
2. **Favorites storage:** SQLite table vs localStorage? (Consider sync implications for future cloud mode)
3. **Workspace-worktree association:** Database schema design for optional worktree backing
4. **Layout state serialization:** What layout state needs to persist? (pane sizes, active tabs, scroll positions?)

### For Planning Phase
1. **Migration path:** How to introduce Landing Page without breaking existing users' workflows?
2. **Empty states:** What should users see when they have no projects, no sessions, no favorites?
3. **Error handling:** What happens if worktree creation fails? If localStorage is full?
4. **Accessibility:** Keyboard navigation for Landing Page, tab management, layout switching

### Deferred to Later Phases
- Multi-pane sync (Phase 5)
- Kanban view integration (Phase 5)
- Mobile responsive design (v2)
- Cross-device favorites sync (v2, cloud mode)

---

## Success Criteria (from Roadmap)

Phase 1 is complete when:
1. ✅ User sees Landing Page on app launch instead of direct session entry
2. ✅ User sees list of 10 most recent projects on Landing Page
3. ✅ User sees list of 10 most recent sessions on Landing Page
4. ✅ User can mark projects or sessions as favorites, which appear in dedicated section above recent items
5. ✅ User can click any project or session to enter that context
6. ✅ User can initiate new project or session creation from Landing Page
7. ✅ Layout persists across page refreshes (localStorage)
8. ✅ User can switch between single-view and dual-view layout modes
9. ✅ Layout mode switcher is accessible from any view

---

*Context captured: 2026-04-10*
*Decisions from: discuss-phase session*
