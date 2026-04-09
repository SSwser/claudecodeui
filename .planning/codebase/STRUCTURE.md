# Codebase Structure

**Analysis Date:** 2026-04-10

## Directory Layout

```
claudecodeui/
├── server/                 # Backend Express.js application
│   ├── routes/            # API endpoint handlers
│   ├── providers/         # AI provider adapters
│   ├── database/          # SQLite database and migrations
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   ├── utils/             # Server utilities
│   └── constants/         # Server-side constants
├── src/                   # Frontend React application
│   ├── components/        # React components (feature-based)
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand state stores
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Frontend utilities
│   ├── lib/               # Library utilities
│   ├── i18n/              # Internationalization config
│   ├── constants/         # Frontend constants
│   └── shared/            # Frontend-specific shared code
├── shared/                # Code shared between frontend and backend
├── public/                # Static assets
├── scripts/               # Build and utility scripts
├── plugins/               # Plugin system
├── docker/                # Docker configurations
└── .planning/             # Planning and documentation
    └── codebase/          # Codebase analysis documents
```

## Directory Purposes

**server/**
- Purpose: Backend Node.js/Express application
- Contains: API routes, WebSocket handlers, provider integrations, database
- Key files: `index.js` (main server), `cli.js` (CLI entry), `projects.js` (project management)

**server/routes/**
- Purpose: Express route handlers organized by domain
- Contains: REST API endpoints for different features
- Key files: `agent.js`, `auth.js`, `git.js`, `projects.js`, `mcp.js`, `taskmaster.js`, `settings.js`, `plugins.js`

**server/providers/**
- Purpose: AI provider abstraction layer
- Contains: Adapter implementations for Claude, Codex, Cursor, Gemini
- Key files: `registry.js` (provider lookup), `types.js` (common interfaces), `claude/adapter.js`, `codex/adapter.js`, `cursor/adapter.js`, `gemini/adapter.js`

**server/database/**
- Purpose: Database connection and schema management
- Contains: SQLite database setup, migrations, initialization SQL
- Key files: `db.js` (database connection and migrations), `init.sql` (schema definition)

**server/services/**
- Purpose: Business logic services
- Contains: Notification orchestration, VAPID key management
- Key files: `notification-orchestrator.js`, `vapid-keys.js`

**server/middleware/**
- Purpose: Express middleware functions
- Contains: Authentication, validation middleware
- Key files: `auth.js` (JWT validation, API key validation)

**server/utils/**
- Purpose: Server-side utility functions
- Contains: Plugin management, MCP detection, command parsing, git config
- Key files: `plugin-process-manager.js`, `plugin-loader.js`, `mcp-detector.js`, `commandParser.js`, `taskmaster-websocket.js`

**src/**
- Purpose: Frontend React application root
- Contains: Main app component, entry point, global styles
- Key files: `main.jsx` (React entry), `App.tsx` (root component), `index.css` (global styles)

**src/components/**
- Purpose: React components organized by feature
- Contains: Feature-based component directories with view/hooks/types/utils subdirectories
- Key subdirectories: `app/`, `auth/`, `chat/`, `code-editor/`, `file-tree/`, `git-panel/`, `main-content/`, `settings/`, `shell/`, `sidebar/`

**src/components/[feature]/**
- Purpose: Self-contained feature modules
- Contains: `view/` (UI components), `hooks/` (custom hooks), `types/` (TypeScript types), `utils/` (utilities), `constants/` (feature constants)
- Pattern: Each feature is isolated with its own subdirectories

**src/contexts/**
- Purpose: React Context providers for global state
- Contains: Context definitions and provider components
- Key files: `AuthContext.jsx`, `WebSocketContext.tsx`, `ThemeContext.jsx`, `PluginsContext.tsx`, `TaskMasterContext.ts`, `TasksSettingsContext.jsx`

**src/hooks/**
- Purpose: Reusable custom React hooks
- Contains: Hooks for device settings, local storage, projects state, UI preferences
- Key files: `useProjectsState.ts`, `useDeviceSettings.ts`, `useUiPreferences.ts`, `useSessionProtection.ts`, `useWebPush.ts`

**src/stores/**
- Purpose: Zustand state management stores
- Contains: Client-side state stores
- Key files: `useSessionStore.ts` (session state management)

**src/types/**
- Purpose: TypeScript type definitions
- Contains: Shared type definitions for frontend
- Key files: Application-wide TypeScript interfaces and types

**src/utils/**
- Purpose: Frontend utility functions
- Contains: Helper functions for frontend logic
- Key files: Various utility modules

**src/lib/**
- Purpose: Library-level utilities
- Contains: Low-level utility functions
- Key files: `utils.js`

**src/i18n/**
- Purpose: Internationalization configuration
- Contains: i18next setup and translation files
- Key files: `config.js` (i18n initialization)

**shared/**
- Purpose: Code shared between frontend and backend
- Contains: Constants and utilities used by both client and server
- Key files: `modelConstants.js`, `networkHosts.js`

**public/**
- Purpose: Static assets served directly
- Contains: Icons, images, screenshots, service worker
- Key subdirectories: `icons/`, `screenshots/`

**scripts/**
- Purpose: Build and maintenance scripts
- Contains: Post-install scripts, build utilities
- Key files: `fix-node-pty.js`

**plugins/**
- Purpose: Plugin system for extensibility
- Contains: Plugin starter templates and plugin implementations
- Key subdirectories: `starter/`

**docker/**
- Purpose: Docker configurations for different providers
- Contains: Dockerfiles and configurations
- Key subdirectories: `claude-code/`, `codex/`, `gemini/`, `shared/`

**.planning/**
- Purpose: Project planning and documentation
- Contains: Codebase analysis documents
- Key subdirectories: `codebase/` (architecture, structure, conventions, etc.)

## Key File Locations

**Entry Points:**
- `src/main.jsx`: Frontend React application entry
- `server/index.js`: Backend Express server entry
- `server/cli.js`: CLI command entry point
- `index.html`: HTML entry point for SPA

**Configuration:**
- `package.json`: Project metadata and dependencies
- `vite.config.js`: Vite build configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `eslint.config.js`: ESLint configuration
- `.env.example`: Environment variable template

**Core Logic:**
- `src/App.tsx`: Root React component with providers
- `src/components/app/AppContent.tsx`: Main application orchestrator
- `server/projects.js`: Project and session management
- `server/sessionManager.js`: Active session tracking
- `server/providers/registry.js`: Provider adapter registry

**Testing:**
- Not detected (no test files found in standard locations)

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` or `.jsx` extension (e.g., `ChatInterface.tsx`, `AppContent.tsx`)
- Server modules: kebab-case with `.js` extension (e.g., `plugin-process-manager.js`, `mcp-detector.js`)
- Hooks: camelCase with `use` prefix (e.g., `useProjectsState.ts`, `useDeviceSettings.ts`)
- Context files: PascalCase with `Context` suffix (e.g., `WebSocketContext.tsx`, `ThemeContext.jsx`)
- Route files: lowercase singular (e.g., `auth.js`, `git.js`, `projects.js`)

**Directories:**
- Component features: kebab-case (e.g., `code-editor/`, `file-tree/`, `git-panel/`)
- Standard subdirectories: lowercase (e.g., `view/`, `hooks/`, `types/`, `utils/`, `constants/`)
- Provider directories: lowercase provider name (e.g., `claude/`, `codex/`, `cursor/`, `gemini/`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/components/[feature-name]/`
- Create subdirectories: `view/`, `hooks/`, `types/`, `utils/`, `constants/` as needed
- Tests: Not applicable (no test infrastructure detected)

**New API Endpoint:**
- Implementation: `server/routes/[domain].js`
- If new domain: Create new route file and register in `server/index.js`
- Business logic: `server/services/` or root-level service files

**New AI Provider:**
- Adapter: `server/providers/[provider-name]/adapter.js`
- Register in: `server/providers/registry.js`
- CLI integration: `server/[provider-name]-cli.js` (if needed)

**New Component/Module:**
- React component: `src/components/[feature]/view/[ComponentName].tsx`
- Custom hook: `src/components/[feature]/hooks/use[HookName].ts` or `src/hooks/use[HookName].ts` (if shared)
- Context provider: `src/contexts/[Name]Context.tsx`

**Utilities:**
- Shared helpers (frontend): `src/utils/` or `src/lib/`
- Shared helpers (backend): `server/utils/`
- Shared between frontend and backend: `shared/`

**Database Changes:**
- Schema: Add migration logic in `server/database/db.js` `runMigrations()` function
- Initial schema: Update `server/database/init.sql`

**Middleware:**
- Express middleware: `server/middleware/[purpose].js`
- Register in routes or `server/index.js`

## Special Directories

**node_modules/**
- Purpose: NPM dependencies
- Generated: Yes (via npm install)
- Committed: No

**dist/**
- Purpose: Vite build output for production
- Generated: Yes (via npm run build)
- Committed: No

**.git/**
- Purpose: Git version control metadata
- Generated: Yes (git repository)
- Committed: No

**.planning/**
- Purpose: Project planning and codebase documentation
- Generated: By GSD commands and manual documentation
- Committed: Yes

**.serena/**
- Purpose: Serena MCP server cache and memories
- Generated: Yes (by Serena semantic coding tools)
- Committed: No

**.husky/**
- Purpose: Git hooks for pre-commit linting
- Generated: Yes (via husky)
- Committed: Yes

**public/**
- Purpose: Static assets copied to dist during build
- Generated: No (manually created assets)
- Committed: Yes

---

*Structure analysis: 2026-04-10*
