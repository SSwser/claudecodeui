# Phase 2: Core Sessions — Research

**Researched:** 2026-04-13
**Level:** 2 (Standard Research)

## 1. Database Schema Design

### Current State

The existing SQLite database (`server/database/db.js` + `init.sql`) has tables: `users`, `api_keys`, `user_credentials`, `user_notification_preferences`, `vapid_keys`, `push_subscriptions`, `session_names`, `app_config`. **No project, workspace, or session-state tables exist.**

Migration system uses `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN` pattern in `runMigrations()`.

### New Tables Required

```sql
-- Projects (soft-delete via is_deleted flag per D-22)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  display_name TEXT,
  directory_path TEXT NOT NULL,
  multi_workspace_enabled BOOLEAN DEFAULT 0,  -- irreversible per D-13
  is_deleted BOOLEAN DEFAULT 0,               -- soft-delete per D-22
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_path ON projects(directory_path) WHERE is_deleted = 0;

-- Workspaces (each project has at least one implicit workspace per D-12)
CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  worktree_path TEXT,          -- NULL for implicit/default workspace
  worktree_branch TEXT,        -- git branch name
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_workspaces_project ON workspaces(project_id);

-- Session state tracking (complements in-memory sessionManager)
CREATE TABLE IF NOT EXISTS session_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  workspace_id INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'claude',
  status TEXT NOT NULL DEFAULT 'active',  -- active | frozen | archived | deleted
  title TEXT,
  summary TEXT,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  frozen_at DATETIME,
  archived_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_session_state_workspace ON session_state(workspace_id);
CREATE INDEX IF NOT EXISTS idx_session_state_status ON session_state(status);
CREATE INDEX IF NOT EXISTS idx_session_state_session ON session_state(session_id, provider);

-- FTS5 virtual table for full-text search (D-20)
CREATE VIRTUAL TABLE IF NOT EXISTS session_search USING fts5(
  title,
  content,
  content='',                 -- contentless: stores only index, not original text
  contentless_delete=1,       -- supports DELETE without storing content
  tokenize='unicode61'
);
```

### FTS5 Integration Notes

- **better-sqlite3** bundles SQLite with FTS5 enabled by default — no additional setup needed.
- Using **contentless-delete** mode (`content='', contentless_delete=1`): index-only, no content duplication, supports deletes.
- Insert pattern: `INSERT INTO session_search(rowid, title, content) VALUES(?, ?, ?)` where rowid maps to session_state.id.
- Query pattern: `SELECT rowid, rank FROM session_search WHERE session_search MATCH ? ORDER BY rank LIMIT 20`.
- **Two-tier search UX (D-21):** Title filtering is a simple SQL `LIKE` on session_state.title (instant). Full-text content search goes through FTS5 (debounced, async on backend).
- Prefix search supported: `MATCH 'term*'` for partial word matching.
- `highlight()` and `snippet()` functions not usable with contentless tables — return highlighted matches from the original stored text on the frontend.

## 2. Process Lifecycle (Freeze/Resume)

### Current State

- `server/sessionManager.js`: In-memory `Map<sessionId, {messages, createdAt, lastActivity}>`. Only handles message history with JSON file persistence in `~/.gemini/sessions/`. **No process lifecycle management.**
- `server/cursor-cli.js` / `server/gemini-cli.js`: Use `cross-spawn` for Windows process spawning.
- `tree-kill@1.2.2` already in `package.json` — critical for Windows process tree killing (D-02).

### Freeze Implementation Approach

1. **Freeze = kill process tree + DB status update:**
   - Use `tree-kill(pid, 'SIGTERM')` to kill the entire process tree (handles Windows child processes).
   - Update `session_state.status = 'frozen'`, set `frozen_at`.
   - Tab keeps showing chat history (read-only from local files per D-03).

2. **Resume = restart process + DB status update:**
   - Use existing `cross-spawn` patterns to restart the CLI process.
   - Update `session_state.status = 'active'`, clear `frozen_at`.
   - Display conversation summary (D-05) — derived from last N messages.

3. **Process tracking:** Need a process registry mapping session_id → `{pid, provider, status}` in sessionManager. This extends the existing in-memory Map.

### Trigger Points (D-06)

- Tab right-click context menu → send WebSocket message → server freeze/resume
- Chat interface top action bar button → same WebSocket flow

## 3. Sidebar Restructure

### Current Component Tree

```
Sidebar.tsx
├── SidebarCollapsed
├── SidebarContent
│   ├── SidebarProjectList
│   │   ├── SidebarProjectItem (per project)
│   │   │   └── SidebarProjectSessions
│   │   │       └── SidebarSessionItem (per session)
```

### Target Architecture (D-08, D-09)

```
Sidebar.tsx
├── SidebarCollapsed (minimal changes)
├── SidebarContent
│   ├── GlobalRecentsSection (D-09 top: last 10 sessions across all projects)
│   │   └── SidebarRecentItem (clickable → opens session chat directly)
│   ├── ProjectListSection (D-09 bottom)
│   │   └── SidebarProjectItem (name + active dot indicator only)
│   └── WorkspaceIndicator (D-15: passive, shown when multi-ws enabled)
```

Sessions list moves ENTIRELY out of Sidebar into Project Inbox in MainContent.

### Migration Strategy

- `SidebarProjectSessions` and `SidebarSessionItem` are removed from Sidebar.
- `SidebarProjectItem` is simplified: no expanding session list, no nested children.
- New `GlobalRecentsSection` reuses patterns from Phase 1's `RecentSessionsList`.
- `useSidebarController` hook is simplified (remove session-related logic).

## 4. Project Inbox (MainContent)

### New Component

```
ProjectInbox.tsx
├── ProjectInboxHeader (project name, workspace switcher if multi-ws, search bar)
├── ProjectInboxSearch (D-19: instant title filter + debounced FTS5)
├── SessionList
│   └── SessionCard (D-11: name, timestamp, status badge, provider icon)
│       └── Hover/LongPress → last message preview
├── EmptyState (no sessions)
```

### Data Flow

1. User clicks project in Sidebar → React Router updates to `/project/:id`
2. `useProjectInbox(projectId)` hook fetches sessions from API
3. API endpoint: `GET /api/projects/:id/sessions?status=active&q=searchTerm`
4. WebSocket broadcasts session state changes → hook updates real-time

## 5. WebSocket Protocol Extensions

### Current Messages

```typescript
type AppSocketMessage =
  | LoadingProgressMessage // { type: 'loading_progress', ... }
  | ProjectsUpdatedMessage; // { type: 'projects_updated', ... }
```

### New Messages Needed

```typescript
| SessionStateChanged         // { type: 'session_state_changed', sessionId, status, provider }
| SessionFrozen               // { type: 'session_frozen', sessionId }
| SessionResumed              // { type: 'session_resumed', sessionId }
| ProjectCreated              // { type: 'project_created', project }
| ProjectDeleted              // { type: 'project_deleted', projectId }
| SearchIndexReady            // { type: 'search_index_ready', projectId }
```

## 6. Don't Hand-Roll

| Need                           | Use                                      |
| ------------------------------ | ---------------------------------------- |
| Process tree killing (Windows) | `tree-kill` (already in deps)            |
| Process spawning               | `cross-spawn` (already in deps)          |
| SQLite FTS5                    | Built into `better-sqlite3`              |
| State management               | React Context + hooks (existing pattern) |
| Real-time updates              | WebSocket (existing pattern)             |

## 7. Common Pitfalls

- **FTS5 contentless tables:** Cannot use `highlight()` or `snippet()` — must reconstruct highlights on frontend from match positions.
- **Windows SIGTERM:** `tree-kill` handles this correctly, but verify with `cross-spawn` child processes.
- **SQLite WAL mode:** Already enabled in current setup. FTS5 works fine with WAL.
- **Migration ordering:** New tables must be created in order (projects → workspaces → session_state → FTS5) due to foreign key constraints.
- **Soft-delete queries:** All project queries must filter `WHERE is_deleted = 0` unless explicitly showing archived/deleted items.
