# ClaudecodeUI — Agent Instructions

> Universal agent instruction file. Applies to all AI coding tools:
> Claude Code, GitHub Copilot, Cursor, Gemini CLI, and others.
>
> Tool-specific overrides:
>
> - VS Code Copilot → `.github/copilot-instructions.md`
> - Claude Code CLI → `CLAUDE.md`

## Project Overview

ClaudecodeUI is a browser-based UI for managing Claude Code sessions. It provides project management, file editing, git integration, and real-time terminal output — all running as a local Express + React app.

## Tech Stack

| Layer         | Technology                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| Frontend      | React 18, React Router 6, Vite 7, Tailwind CSS 3                                    |
| Backend       | Express.js, WebSocket, SQLite                                                       |
| UI primitives | `class-variance-authority`, `lucide-react`, `@uiw/react-codemirror`, `@xterm/xterm` |
| i18n          | `react-i18next`                                                                     |
| Testing       | Vitest, Playwright                                                                  |

## Project Structure

```
src/
  components/<feature>/     # Feature-first modules
    view/                   # React components
    hooks/                  # Feature-specific hooks
    types/                  # TypeScript types
    utils/                  # Feature utilities
  shared/view/ui/           # Reusable primitives (Button, Input, Badge…)
  components/ui/            # Bridge wrappers and newer shared controls
  contexts/                 # App-wide React context providers
  hooks/                    # Cross-feature hooks
server/
  routes/                   # HTTP route modules
  providers/                # LLM provider integrations
  services/                 # Service layer
  middleware/               # Auth and request middleware
```

## Package Manager

This project uses **npm**. Never use `pnpm` or `yarn`.

- Use `npm install` (not `pnpm install`)
- Use `npm install <pkg>` (not `pnpm add <pkg>`)
- Use `npm run <script>` (not `pnpm run <script>`)
- The lock file is `package-lock.json`. Do not generate `pnpm-lock.yaml` or `yarn.lock`.

## Code Comments: Document the "Why"

When implementing behavior driven by a design doc, spec, or non-obvious constraint, **add a comment explaining why** the code does what it does — not just what it does. Target these categories:

- **Safety constraints** — suppressing an action because it could silently corrupt state or mislead the user
- **Fallback/error-handling choices** — e.g., defaulting to a conservative value because it's the least misleading option
- **Architectural boundaries** — why state lives in the frontend and never crosses to the server, or why a feature belongs to one module and not another
- **Compatibility shims** — when a field exists purely for downstream plumbing and carries no semantic meaning
- **Intentional omissions** — skipping an edge case because the data source doesn't support it

A future maintainer who hasn't read the design doc should understand from the comment alone why the code must not be changed casually.

## Code Conventions

### Styling

- **Tailwind first**: use semantic tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`)
- Token definitions: `src/index.css` (CSS variables) + `tailwind.config.js` (Tailwind bridge)
- Dark mode: toggle `.dark` on `document.documentElement`; use `ThemeContext` for asset variants
- No CSS Modules, CSS-in-JS, Sass, or Emotion

### Components

- Variant APIs: `cva()` + `cn()` from `src/lib/utils.js`
- UI icons: `lucide-react` only
- Provider brand logos: `src/components/llm-logo-provider/SessionProviderLogo.tsx`
- Static assets: `public/`; reference via root-relative URLs (`/icons/logo.svg`)
- Check both `src/shared/view/ui/` and `src/components/ui/` before creating new primitives

### Formatting (enforced)

- Prettier (`.prettierrc.json`): `singleQuote`, `semi`, `tabWidth: 2`, `printWidth: 100`, `endOfLine: lf`
- ESLint for logic rules; Prettier for all whitespace/style
- LF line endings enforced by `.gitattributes` and `.editorconfig`
- Run `npm run format` to normalize; `npm run format:check` in CI

### Commits

- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `style`, `docs`, `refactor`, `test`
- Known issue: `lint-staged` pre-commit hook fails with `fatal: Needed a single revision` on Windows — use `git commit --no-verify` as workaround until resolved

## GSD Workflow Policy

> GSD = "Get Stuff Done" — AI agent planning/execution framework used in this repo.
> Phases and plans live in `.planning/phases/`.

### Worktree Policy — MANDATORY

Every plan execution (`gsd-execute-phase` / `gsd-executor`) **MUST** run inside a dedicated git worktree. Never execute plans directly on `main` or the active development branch.

```bash
# 1. Create worktree before executing a plan
git worktree add ../claudecodeui-phase-<phase-id> -b feat/phase-<phase-id>

# 2. Execute the plan inside the worktree
cd ../claudecodeui-phase-<phase-id>
# ... run gsd-executor here ...

# 3. After verification passes, open PR → merge
# 4. Remove worktree after merge
git worktree remove ../claudecodeui-phase-<phase-id>
```

**Branch naming**: `feat/phase-<phase-id>` (e.g., `feat/phase-05-1`)  
**One worktree per plan**, not per phase (a phase with 3 plans = 3 sequential worktrees, or parallel if plans are independent).

### Worktree Safety

Always use the current working directory (the worktree) for all file reads and edits. Never follow absolute paths from subagent results that point to a different worktree or the main repo.

### Phase Execution Checklist

1. [ ] Read `PLAN.md` and `RESEARCH.md` for the phase
2. [ ] Create worktree: `git worktree add ../claudecodeui-phase-<id> -b feat/phase-<id>`
3. [ ] Execute all tasks in the worktree with atomic commits
4. [ ] Run `gsd-verifier` to confirm phase goal achieved
5. [ ] Open PR from worktree branch → `main`
6. [ ] After merge: `git worktree remove ../claudecodeui-phase-<id>`

### Other GSD Rules

- Planning docs belong in `.planning/` — never in `src/` or `server/`
- Commit `.planning/` changes separately from source code changes
- `gsd-code-review` runs before any phase is marked complete

## Figma Integration (Reference Only)

When implementing UI from Figma designs, consult the canonical docs:

- [`docs/figma/INTEGRATION-RULES.md`](docs/figma/INTEGRATION-RULES.md) — token mapping, component composition, asset management
- [`docs/figma/FIGMA-TO-CODE-CHECKLIST.md`](docs/figma/FIGMA-TO-CODE-CHECKLIST.md) — pre-PR ship checklist
- [`docs/figma/MCP-CODE-CONNECT-WORKFLOW.md`](docs/figma/MCP-CODE-CONNECT-WORKFLOW.md) — MCP / Code Connect roundtrip

**Quick rules**: map colors to semantic tokens first → reuse existing primitives → Tailwind for layout → Lucide for icons → validate dark mode.
