# Architecture

**Analysis Date:** 2026-04-10

## Pattern Overview

**Overall:** Client-Server Architecture with WebSocket Communication

**Key Characteristics:**
- React SPA frontend communicating with Express.js backend via REST API and WebSocket
- Multi-provider abstraction layer supporting Claude, Codex, Cursor, and Gemini AI providers
- Real-time bidirectional communication for chat sessions and file system monitoring
- Plugin system with MCP (Model Context Protocol) support
- SQLite database for authentication and session management

## Layers

**Presentation Layer (React Frontend):**
- Purpose: User interface for AI coding assistant interactions
- Location: `src/`
- Contains: React components, hooks, contexts, stores
- Depends on: Backend API endpoints, WebSocket connections
- Used by: End users via web browser

**API Layer (Express Routes):**
- Purpose: HTTP endpoints for CRUD operations and command execution
- Location: `server/routes/`
- Contains: Route handlers for auth, projects, git, settings, agents, MCP, plugins
- Depends on: Services layer, database, provider adapters
- Used by: Frontend components via fetch/axios

**Service Layer:**
- Purpose: Business logic and orchestration
- Location: `server/services/`, `server/` (root level services)
- Contains: Session management, notification orchestration, VAPID keys
- Depends on: Database, provider adapters, external APIs
- Used by: Route handlers, WebSocket handlers

**Provider Abstraction Layer:**
- Purpose: Unified interface for multiple AI providers
- Location: `server/providers/`
- Contains: Provider adapters (claude, codex, cursor, gemini), registry, type definitions
- Depends on: Provider-specific SDKs and CLIs
- Used by: Service layer, route handlers

**Data Layer:**
- Purpose: Persistent storage for users, sessions, settings
- Location: `server/database/`
- Contains: SQLite database connection, migrations, initialization SQL
- Depends on: better-sqlite3 library
- Used by: All server-side code requiring persistence

**Shared Layer:**
- Purpose: Code shared between frontend and backend
- Location: `shared/`
- Contains: Model constants, network host utilities
- Depends on: Nothing (pure utilities)
- Used by: Both `src/` and `server/`

## Data Flow

**Chat Message Flow:**

1. User types message in `src/components/chat/view/ChatInterface.tsx`
2. Message sent via WebSocket through `src/contexts/WebSocketContext.tsx`
3. Backend WebSocket handler in `server/index.js` receives message
4. Provider adapter selected from `server/providers/registry.js`
5. Provider-specific implementation (e.g., `server/providers/claude/adapter.js`) invokes AI SDK
6. Response streamed back through WebSocket to frontend
7. Frontend updates UI with streaming response

**Project/Session Management Flow:**

1. Frontend requests projects via `GET /api/projects` endpoint
2. `server/routes/projects invokes `server/projects.js` functions
3. File system scanned for provider-specific directories (`~/.claude/projects`, `~/.cursor/chats`, etc.)
4. Results aggregated and returned to frontend
5. Frontend stores in `src/hooks/useProjectsState.ts` and `src/stores/useSessionStore.ts`
6. File system watchers (chokidar) detect changes and broadcast updates via WebSocket

**State Management:**
- Frontend: React Context API for global state (Auth, WebSocket, Theme, Plugins, TaskMaster)
- Frontend: Zustand store (`src/stores/useSessionStore.ts`) for session-specific state
- Backend: In-memory session tracking via `server/sessionManager.js`
- Backend: SQLite for persistent user data and settings

## Key Abstractions

**Provider Adapter:**
- Purpose: Normalize different AI provider APIs into common interface
- Examples: `server/providers/claude/adapter.js`, `server/providers/codex/adapter.js`
- Pattern: Adapter pattern with registry-based lookup

**WebSocket Message Protocol:**
- Purpose: Real-time communication between client and server
- Examples: Message types in `server/index.js` (loading_progress, projects_updated, session_output)
- Pattern: Event-driven messaging with type discriminators

**Componenecture:**
- Purpose: Modular UI components with separation of concerns
- Examples: `src/components/chat/`, `src/components/file-tree/`, `src/components/git-panel/`
- Pattern: Feature-based folder structure with view/hooks/types/utils subdirectories

**Route Modules:**
- Purpose: Organize API endpoints by domain
- Examples: `server/routes/git.js`, `server/routes/agent.js`, `server/routes/mcp.js`
- Pattern: Express Router modules with middleware composition

## Entry Points

**Frontend Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Initialize React app, register service worker, mount root component

**Backend Entry:**
- Location: `server/index.js`
- Triggers: Node.js execution via `npm run server` or CLI command
- Responsibilities: Start Express server, initialize WebSocket server, setup file watchers, load routes

**CLI Entry:**
- Location: `server/cli.js`
- Triggers: `cloudcli` command execution
- Responsibilities: Parse CLI arguments, start server with appropriate configuration

**Application Root:**
- Location: `src/App.tsx`
- Triggers: Mounted by `src/main.jsx`
- Responsibilities: Setup context providers, routing, authentication

**Main Application View:**
- Location: `src/components/app/AppContent.tsx`
- Triggers: Routed by React Router
- Responsibilities: Orchestrate sidebar, main content, WebSocket connection, session management

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**
- Frontend: React Error Boundaries (`src/components/main-content/view/ErrorBoundary.tsx`)
- Frontend: Try-catch in async operations with user-facing error messages
- Backend: Express error middleware for route errors
- Backend: WebSocket error events for connection failures
- Backend: Provider-specific error normalization in adapters

## Cross-Cutting Concerns

**Logging:** Console-based logging with ANSI color codes for terminal output (server-side)

**Validation:** 
- API key validation via `server/middleware/auth.js`
- Workspace path validation in `server/routes/projects.js`
- JWT token authentication for protected routes

**Authentication:** 
- JWT-based authentication with bcrypt password hashing
- Token stored in localStorage on fr Middleware-based route protection cateToken`, `authenticateWebSocket`)
- User management via `server/routes/auth.js` and `server/database/db.js`

**Internationalization:** 
- i18next for multi-language support
- Configuration in `src/i18n/config.js`
- Translation files loaded dynamically

**Real-time Updates:**
- File system watchers (chokidar) for project/session changes
- WebSocket broadcasting to all connected clients
- Debounced updates to prevent excessive notifications

---

*Architecture analysis: 2026-04-10*
