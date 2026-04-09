# Codebase Concerns

**Analysis Date:** 2026-04-10

## Tech Debt

**Legacy PORT Environment Variable:**
- Issue: Deprecated PORT variable still supported alongside SERVER_PORT
- Files: `vite.config.js:17`, `server/cli.js:113`, `server/cli.js:291-292`
- Impact: Configuration confusion, multiple ways to set the same value
- Fix approach: Remove PORT support in next major release, document migration path

**Deprecated npm Dependencies:**
- Issue: Multiple deprecated packages in dependency tree
- Files: `package-lock.json` (9 deprecated packages detected)
- Impact: Security vulnerabilities, lack of maintenance, potential breaking changes
- Fix approach: Audit and upgrade deprecated packages:
  - `@npmcli/move-file` → moved to `@npmcli/fs`
  - `domexception` → no longer supported
  - `punycode` → no longer supported
  - `git-raw-commits` → use `@conventional-changelog/git-client`
  - `inflight` → memory leaks, use `lru-cache`
  - `rimraf` < v4 → upgrade to v4+
  - `glob` < v9 → upgrade to v9+

**Mixed SQLite Libraries:**
- Issue: Using both `better-sqlite3` (synchronous) and `sqlite3` (async) in same codebase
- Files: `server/database/db.js:1` (better-sqlite3), `server/projects.js:65` (sqlite3), `server/routes/cursor.js:6` (sqlite3)
- Impact: Inconsistent error handling, different API patterns, increased bundle size
- Fix approach: Standardize on one library (prefer `better-sqlite3` for simplicity)

**node-pty Permission Issues:**
- Issue: Requires postinstall script to fix spawn-helper permissions on macOS
- Files: `scripts/fix-node-pty.js`, `package.json:37`
- Impact: Installation failures if postinstall doesn't run, platform-specific workaround
- Fix approach: Monitor upstream issue https://github.com/microsoft/node-pty/issues/850, consider alternative terminal libraries

**Large Monolithic Files:**
- Issue: Several files exceed 1000 lines, indicating high complexity
- Files: 
  - `server/index.js` (2577 lines)
  - `server/routes/taskmaster.js` (1963 lines)
  - `server/routes/git.js` (1488 lines)
  - `server/routes/agent.js` (1245 lines)
  - `src/components/chat/hooks/useChatComposerState.ts` (1003 lines)
  - `src/components/settings/hooks/useSettingsController.ts` (951 lines)
- Impact: Difficult to maintain, test, and review; high cognitive load
- Fix approach: Extract logical modules into separate files, apply single responsibility principle

**Excessive Console Logging:**
- Issue: 336 console.log/warn/error statements across 30 files
- Files: Widespread across `server/` and `src/` directories
- Impact: Performance overhead, cluttered logs, no structured logging
- Fix approach: Implement proper logging library (winston, pino), add log levels, remove debug statements

**Empty Catch Blocks:**
- Issue: Multiple catch blocks with no error handling or silent failures
- Files: 
  - `server/gemini-cli.js:233`, `server/gemini-cli.js:428`
  - `server/gemini-response-handler.js:70`
  - `server/claude-sdk.js:386`, `server/claude-sdk.js:393`
- Impact: Errors swallowed silently, difficult to debug production issues
- Fix approach: Add proper error logging, consider error recovery strategies

## Known Bugs

**Cursor Project Discovery Limitation:**
- Symptoms: Cannot discover Cursor-only projects without Claude sessions
- Files: `server/projects.js:40-41`
- Trigger: User has Cursor projects but no corresponding Claude projects
- Workaround: Manually add project paths via UI
- Root cause: Cursor stores projects by MD5 hash of path, no reverse lookup possible

**Project Relocation Breaks History:**
- Symptoms: Moving/renaming project directory makes Cursor sessions inaccessible
- Files: `server/projects.js:43-45`
- Trigger: User moves project to different directory
- Workaround: Manually add old path to recover sessions
- Root cause: MD5 hash changes when path changes, no migration mechanism

**Reentrant getProjects Calls:**
- Symptoms: File watcher can trigger overlapping project scans
- Files: `server/index.js:100`, `server/index.js:142-144`
- Trigger: Rapid file changes in watched directories
- Current mitigation: `isGetProjectsRunning` flag prevents reentrancy
- Risk: Race conditions if flag logic fails

## Security Considerations

**JWT Secret Generation:**
- Risk: JWT secret auto-generated if not provided
- Files: `server/middleware/auth.js:6`, `server/database/db.js` (getOrCreateJwtSecret)
- Current mitigation: Secret stored in database, persists across restarts
- Recommendations: Document JWT_SECRET environment variable, warn on first-time generation

**API Key Storage:**
- Risk: API keys stored in SQLite database
- Files: `server/database/db.js:26` (DATABASE_PATH)
- Current mitigation: Database file permissions, bcrypt for passwords
- Recommendations: Add encryption at rest, document backup procedures

**Environment Variable Exposure:**
- Risk: Multiple process.env accesses without validation
- Files: 30+ locations across `server/` directory
- Current mitigation: Default values provided for most variables
- Recommendations: Centralize env validation, use schema validation (zod, joi)

**File System Access:**
- Risk: Direct file system operations based on user input
- Files: `server/index.js` (file read/write endpoints), `server/routes/commands.js`
- Current mitigation: Path validation in some endpoints
- Recommendations: Implement comprehensive path traversal protection, whitelist allowed directories

**CORS Configuration:**
- Risk: CORS enabled but configuration not visible in analysis
- Files: `server/index.js:40` (cors import)
- Current mitigation: Unknown without seeing full configuration
- Recommendations: Review CORS settings, restrict origins in production

## Performance Bottlenecks

**Synchronous File Operations:**
- Problem: Some file operations may block event loop
- Files: `server/database/db.js` (better-sqlite3 is synchronous)
- Cause: Synchronous SQLite operations on large databases
- Improvement path: Use async sqlite3 for large queries, implement connection pooling

**Project Directory Cache:**
- Problem: Cache clearing on every file change
- Files: `server/index.js:150` (clearProjectDirectoryCache)
- Cause: Aggressive cache invalidation
- Improvement path: Implement smarter cache invalidation, only clear affected projects

**Large File Handling:**
- Problem: No streaming for large file reads/writes
- Files: `server/index.js` (file endpoints)
- Cause: Loading entire files into memory
- Improvement path: Implement streaming for files > 1MB

**WebSocket Broadcasting:**
- Problem: Broadcasting to all clients without filtering
- Files: `server/index.js:103-112` (broadcastProgress)
- Cause: No per-project or per-session filtering
- Improvement path: Implement targeted messaging, reduce unnecessary broadcasts

## Fragile Areas

**Session Management:**
- Files: `server/sessionManager.js`, `server/claude-sdk.js:30` (activeSessions Map)
- Why fragile: In-memory session storage, no persistence across restarts
- Safe modification: Always check session existence before operations
- Test coverage: No test files detected

**Tool Approval System:**
- Files: `server/claude-sdk.js:32-98` (pendingToolApprovals, waitForToolApproval)
- Why fragile: Complex timeout and abort signal handling, race conditions possible
- Safe modification: Thoroughly test timeout scenarios, ensure cleanup always runs
- Test coverage: No test files detected

**File Watcher Setup:**
- Files: `server/index.js:116-212` (setupProjectsWatcher)
- Why fragile: Complex async cleanup, debouncing, error handling for missing directories
- Safe modification: Test with missing directories, rapid file changes
- Test coverage: No test files detected

**Provider Adapters:**
- Files: `server/providers/claude/adapter.js`, `server/providers/cursor/adapter.js`, `server/providers/codex/adapter.js`, `server/providers/gemini/adapter.js`
- Why fragile: Parsing external CLI output, format changes break parsing
- Safe modification: Add version detection, graceful degradation
- Test coverage: No test files detected

## Scaling Limits

**In-Memory Session Storage:**
- Current capacity: 100 sessions max (configurable)
- Limit: Memory exhaustion with many concurrent users
- Scaling path: Implement Redis or database-backed session storage

**File System Watchers:**
- Current capacity: 5 watched directories (PROVIDER_WATCH_PATHS)
- Limit: File descriptor limits on systems with many projects
- Scaling path: Implement polling fallback, configurable watch depth

**WebSocket Connections:**
- Current capacity: Unbounded Set of connections
- Limit: Memory and CPU with thousands of concurrent connections
- Scaling path: Implement connection limits, load balancing

**SQLite Database:**
- Current capacity: Single-file database for all users
- Limit: Write contention with multiple concurrent users
- Scaling path: Migrate to PostgreSQL or MySQL for multi-user deployments

## Dependencies at Risk

**node-pty:**
- Risk: Beta version (1.1.0-beta34), known permission issues
- Impact: Terminal functionality breaks
- Migration plan: Monitor stable releases, consider xterm.js alternatives

**node-fetch v2:**
- Risk: Using v2 (2.7.0), v3 is ESM-only and breaking
- Impact: Stuck on old version due to CommonJS compatibility
- Migration plan: Migrate to native fetch (Node 18+) or undici

## Missing Critical Features

**No Test Suite:**
- Problem: Zero test files detected in codebase
- Blocks: Confident refactoring, regression prevention, CI/CD
- Priority: High

**No Error Monitoring:**
- Problem: No integration with error tracking services (Sentry, Rollbar)
- Blocks: Production debugging, error trend analysis
- Priority: Medium

**No Rate Limiting:**
- Problem: API endpoints lack rate limiting
- Blocks: Protection against abuse, DoS attacks
- Priority: High for production deployments

**No Health Checks:**
- Problem: No /health or /readiness endpoints
- Blocks: Load balancer integration, monitoring
- Priority: Medium

## Test Coverage Gaps

**Untested area: Authentication System**
- What's not tested: JWT generation, API key validation, token refresh
- Files: `server/middleware/auth.js`, `server/routes/auth.js`, `server/routes/cli-auth.js`
- Risk: Security vulnerabilities, authentication bypass
- Priority: Critical

**Untested area: Provider Adapters**
- What's not tested: Message normalization, CLI output parsing, error handling
- Files: `server/providers/*/adapter.js`
- Risk: Parsing failures break entire provider
- Priority: High

**Untested area: Database Migrations**
- What's not tested: Schema migrations, data integrity
- Files: `server/database/db.js:83-100` (runMigrations)
- Risk: Data loss during upgrades
- Priority: High

**Untested area: File System Operations**
- What's not tested: Path traversal protection, permission handling
- Files: `server/index.js` (file endpoints), `server/routes/commands.js`
- Risk: Security vulnerabilities, data corruption
- Priority: Critical

**Untested area: WebSocket Communication**
- What's not tested: Connection handling, message routing, error recovery
- Files: `server/index.js` (WebSocket setup)
- Risk: Connection leaks, message loss
- Priority: Medium

---

*Concerns audit: 2026-04-10*
