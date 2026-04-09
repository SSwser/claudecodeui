# External Integrations

**Analysis Date:** 2026-04-10

## APIs & External Services

**AI Providers:**
- Anthropic Claude - AI coding assistant
  - SDK/Client: `@anthropic-ai/claude-agent-sdk`
  - Implementation: `server/claude-sdk.js`, `server/providers/claude/adapter.js`
  - Auth: API key managed by Claude CLI (not in env)
  
- OpenAI Codex - AI coding assistant
  - SDK/Client: `@openai/codex-sdk`
  - Implementation: `server/openai-codex.js`, `server/providers/codex/adapter.js`
  - Auth: `OPENAI_API_KEY` (referenced in `server/index.js:1999`)
  
- Cursor - AI coding assistant
  - Implementation: `server/cursor-cli.js`, `server/providers/cursor/adapter.js`
  - Auth: Managed by Cursor CLI
  - Database: Reads from `~/.cursor/chats` SQLite database
  
- Google Gemini - AI coding assistant
  - Implementation: `server/gemini-cli.js`, `server/providers/gemini/adapter.js`
  - Auth: Managed by Gemini CLI
  - CLI Path: `GEMINI_PATH` env var (default: `gemini`)

**Version Control:**
- GitHub - Repository operations and PR management
  - SDK/Client: `@octokit/rest`
  - Implementation: `server/routes/agent.js`, `server/routes/git.js`
  - Auth: GitHub personal access token stored in `user_credentials` table (type: `github_token`)

## Data Storage

**Databases:**
- SQLite (better-sqlite3)
  - Connection: `DATABASE_PATH` env var (default: `~/.cloudcli/auth.db`)
  - Client: `better-sqlite3` (synchronous API)
  - Schema: `server/database/init.sql`
  - Tables: `users`, `api_keys`, `user_credentials`, `app_config`, `session_names`, `user_notification_preferences`, `vapid_keys`, `push_subscriptions`
  - Implementation: `server/database/db.js`

**File Storage:**
- Local filesystem only
  - Project workspaces: User-specified directories
  - Provider session data: `~/.claude/projects`, `~/.cursor/chats`, `~/.codex/sessions`, `~/.gemini/projects`
  - File uploads: Handled via `multer` middleware

**Caching:**
- None - No external caching service

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `server/middleware/auth.js`
  - Token generation: `jsonwebtoken` library
  - Password hashing: `bcrypt` (6.0.0)
  - JWT Secret: Auto-generated per installation (stored in `app_config` table) or via `JWT_SECRET` env var
  - Token lifetime: 7 days with auto-refresh at halfway point
  - Platform mode: Single-user bypass via `VITE_IS_PLATFORM` env var

**API Key Authentication:**
- Custom API key system
  - Format: `ck_` prefix + 64 hex characters
  - Storage: `api_keys` table
  - Implementation: `server/database/db.js` (apiKeysDb)

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service

**Logs:**
- Console logging only
  - Server logs to stdout/stderr
  - Client logs to browser console

## CI/CD & Deployment

**Hosting:**
- Self-hosted (users run their own instance)

**CI Pipeline:**
- Git hooks via Husky 9.1.7
  - Pre-commit: `lint-staged` runs ESLint on staged files
  - Commit-msg: `commitlint` enforces conventional commits

**Release:**
- `release-it` 19.0.5 with conventional changelog
  - Script: `./release.sh`
  - Auto-changelog generation

## Environment Configuration

**Required env vars:**
- `SERVER_PORT` - Backend server port (default: 3001)
- `VITE_PORT` - Frontend dev server port (default: 5173)
- `HOST` - Bind address (default: 0.0.0.0)
- `DATABASE_PATH` - SQLite database location (default: ~/.cloudcli/auth.db)
- `CONTEXT_WINDOW` - Claude context window size (default: 160000)
- `VITE_CONTEXT_WINDOW` - Frontend context window display (default: 160000)

**Optional env vars:**
- `JWT_SECRET` - Custom JWT signing secret
- `CLAUDE_CLI_PATH` - Custom Claude CLI path (default: `claude`)
- `GEMINI_PATH` - Custom Gemini CLI path (default: `gemini`)
- `OPENAI_API_KEY` - OpenAI API key for Codex
- `CLAUDE_TOOL_APPROVAL_TIMEOUT_MS` - Tool approval timeout (default: 55000)
- `CLAUDE_CODE_STREAM_CLOSE_TIMEOUT` - Stream close timeout (default: 300000)
- `VITE_IS_PLATFORM` - Platform mode flag (single-user bypass)

**Secrets location:**
- SQLite database (`auth.db`): User passwords (bcrypt hashed), API keys, GitHub tokens
- Environment variables: Optional API keys and secrets
- VAPID keys: Auto-generated and stored in `vapid_keys` table

## Webhooks & Callbacks

**Incoming:**
- None - No webhook endpoints

**Outgoing:**
- Web Push Notifications
  - Service: `web-push` library (VAPID protocol)
  - Implementation: `server/services/notification-orchestrator.js`, `server/services/vapid-keys.js`
  - VAPID keys: Auto-generated per installation
  - Contact: `mailto:noreply@claudecodeui.local`
  - Events: `actionRequired`, `stop`, `error`

## WebSocket Connections

**Real-time Communication:**
- WebSocket server via `ws` library
  - Endpoints: `/ws` (general), `/shell` (terminal sessions)
  - Auth: JWT token via query param or WebSocket upgrade headers
  - Implementation: `server/index.js`
  - Use cases: AI streaming responses, terminal I/O, file system watching, project updates

## File System Watching

**Project Monitoring:**
- Chokidar 4.0.3
  - Watched paths: `~/.claude/projects`, `~/.cursor/chats`, `~/.codex/sessions`, `~/.gemini/projects`
  - Implementation: `server/index.js` (PROVIDER_WATCH_PATHS)
  - Debounce: 300ms
  - Broadcasts updates to connected WebSocket clients

---

*Integration audit: 2026-04-10*
