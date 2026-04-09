# Technology Stack

**Analysis Date:** 2026-04-10

## Languages

**Primary:**
- JavaScript (ES2020+) - Server-side code in `server/` directory
- TypeScript (5.9.3) - Client-side code in `src/` directory

**Secondary:**
- JSX/TSX - React components

## Runtime

**Environment:**
- Node.js v22 (specified in `.nvmrc`)

**Package Manager:**
- npm
- Lockfile: present (package-lock.json expected)

## Frameworks

**Core:**
- React 18.2.0 - Frontend UI framework
- Express 4.18.2 - Backend HTTP server
- Vite 7.0.4 - Build tool and dev server

**Testing:**
- Not detected - No test framework configured

**Build/Dev:**
- Vite 7.0.4 - Frontend bundler with HMR
- TypeScript 5.9.3 - Type checking
- ESLint 9.39.3 - Code linting
- Prettier (via config) - Code formatting
- Concurrently 8.2.2 - Run multiple dev processes

## Key Dependencies

**Critical:**
- `@anthropic-ai/claude-agent-sdk` 0.2.59 - Claude AI integration via SDK
- `@openai/codex-sdk` 0.101.0 - OpenAI Codex integration
- `better-sqlite3` 12.6.2 - Embedded database for auth and user data
- `ws` 8.14.2 - WebSocket server for real-time communication
- `node-pty` 1.1.0-beta34 - Terminal emulation for shell sessions

**Infrastructure:**
- `jsonwebtoken` 9.0.2 - JWT authentication
- `bcrypt` 6.0.0 - Password hashing
- `cors` 2.8.5 - CORS middleware
- `web-push` 3.6.7 - Web push notifications (VAPID)
- `@octokit/rest` 22.0.0 - GitHub API client
- `chokidar` 4.0.3 - File system watching

**UI Components:**
- `@uiw/react-codemirror` 4.23.13 - Code editor component
- `@xterm/xterm` 5.5.0 - Terminal emulator UI
- `react-router-dom` 6.8.1 - Client-side routing
- `react-markdown` 10.1.0 - Markdown rendering
- `lucide-react` 0.515.0 - Icon library
- `tailwindcss` 3.4.0 - Utility-first CSS framework

**Internationalization:**
- `i18next` 25.7.4 - i18n framework
- `react-i18next` 16.5.3 - React bindings for i18n
- `i18next-browser-languagedetector` 8.2.0 - Language detection

**Utilities:**
- `fuse.js` 7.0.0 - Fuzzy search
- `gray-matter` 4.0.3 - Frontmatter parsing
- `katex` 0.16.25 - Math rendering
- `jszip` 3.10.1 - ZIP file handling
- `multer` 2.0.1 - File upload handling

## Configuration

**Environment:**
- Configuration via `.env` file (see `.env.example`)
- Key variables: `SERVER_PORT`, `VITE_PORT`, `HOST`, `DATABASE_PATH`, `CONTEXT_WINDOW`, `JWT_SECRET`, `CLAUDE_CLI_PATH`
- Default database location: `~/.cloudcli/auth.db` (set in `server/load-env.js`)

**Build:**
- `vite.config.js` - Vite configuration with proxy setup for `/api`, `/ws`, `/shell`
- `tsconfig.json` - TypeScript configuration (ES2020, ESNext modules, React JSX)
- `tailwind.config.js` - Tailwind CSS configuration with custom theme
- `eslint.config.js` - ESLint flat config with React, TypeScript, Tailwind rules
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer
- `commitlint.config.js` - Conventional commits enforcement

## Platform Requirements

**Development:**
- Node.js v22
- npm (any recent version)
- Native build tools for `node-pty`, `better-sqlite3`, `bcrypt` (node-gyp)

**Production:**
- Deployment target: Self-hosted Node.js server
- Binary package: `@cloudcli-ai/cloudcli` published to npm
- CLI command: `cloudcli` (via `server/cli.js`)

---

*Stack analysis: 2026-04-10*
