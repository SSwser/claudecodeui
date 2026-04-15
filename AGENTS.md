# Chorus — Agent Instructions

> Universal agent instruction file. Applies to all AI coding tools:
> Claude Code, GitHub Copilot, Cursor, Gemini CLI, and others.
>
> Tool-specific overrides:
>
> - VS Code Copilot → `.github/copilot-instructions.md`
> - Claude Code CLI → `CLAUDE.md`

## Project Overview

Chorus is a cloud-native AI work orchestration platform. It provides project management, file editing, git integration, and real-time terminal output — all running as a local Express + React app.

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

Every phase execution (`gsd-execute-phase` / `gsd-executor`) **MUST** run inside a dedicated git worktree. Never execute plans directly on `main` or the active development branch.

**One worktree per phase.** All plans within a phase share the same worktree and branch.

#### Creating a Worktree (Windows-safe)

Always use the `.worktrees/` subdirectory inside the repo root. Never use `../` relative paths — on Windows, Git resolves paths relative to the git root, not `$PWD`, which causes silent failures.

```powershell
# 1. Create worktree under .worktrees/ (Windows-safe, same drive, no path ambiguity)
git worktree add .worktrees/phase-<id> -b feat/phase-<id>

# 2. Execute all plans inside the worktree
cd .worktrees/phase-<id>
# ... run gsd-executor here ...
```

The `.worktrees/` directory is listed in `.gitignore` — worktree directories are not source files and must never be committed.

**Branch naming**: `feat/phase-<id>` (e.g., `feat/phase-02`)

#### Worktree Lifecycle

Worktrees are **not removed automatically** after phase completion. The lifecycle is:

```
Phase complete → push branch → open PR → merge → update STATE.md → gsd-progress prompts cleanup
```

1. **After phase verification passes**: push branch and open PR.
2. **After PR is merged**: update `STATE.md` to record the merge and add a cleanup todo (see Recording section below).
3. **`gsd-progress`** reads `STATE.md` and surfaces any pending cleanup todos — it will prompt the user to run `/gsd-remove-workspace`.
4. **User runs `/gsd-remove-workspace <worktree-name>`** to safely remove the worktree after confirming no uncommitted changes remain.

Do not run `git worktree remove` directly — always use `gsd-remove-workspace`, which checks for uncommitted work first.

#### Recording Worktree State in STATE.md

When creating a worktree, add a `worktree` block to `STATE.md` frontmatter:

```yaml
worktree:
  path: .worktrees/phase-<id>
  branch: feat/phase-<id>
  status: active # active | merged | removed
  pr: null # fill in PR number once opened
```

When PR is merged, update the block **and** add a cleanup todo to the `### Todo` section of `STATE.md`:

```yaml
worktree:
  path: .worktrees/phase-<id>
  branch: feat/phase-<id>
  status: merged
  pr: 42
```

```markdown
### Todo

- [ ] Worktree cleanup: run `/gsd-remove-workspace phase-<id>` to remove `.worktrees/phase-<id>`
```

`gsd-progress` reads `STATE.md` in full and will surface this todo as a pending action.

### Worktree Safety

Always use the current working directory (the worktree) for all file reads and edits. Never follow absolute paths from subagent results that point to a different worktree or the main repo.

### Phase Execution Checklist

1. [ ] Read `PLAN.md` and `RESEARCH.md` for the phase
2. [ ] Create worktree: `git worktree add .worktrees/phase-<id> -b feat/phase-<id>`
3. [ ] Add `worktree` block to `STATE.md` frontmatter (status: active)
4. [ ] Execute all tasks in the worktree with atomic commits
5. [ ] Run `gsd-verifier` to confirm phase goal achieved
6. [ ] Run `/gsd-pr-branch dev` — strips `.planning/` commits from the branch so reviewers only see code changes (target: `dev`)
7. [ ] Run `/gsd-ship` — pushes the clean branch, auto-generates PR body, opens PR against `dev`, and tracks merge; record PR number in `STATE.md` worktree block
8. [ ] After merge: set `worktree.status: merged` in `STATE.md` and add cleanup todo
9. [ ] Run `/gsd-remove-workspace phase-<id>` when prompted by `gsd-progress`

> **Why `gsd-pr-branch` before `gsd-ship`**: GSD phase branches mix code commits with `.planning/` artifact commits (PLAN.md, STATE.md, SUMMARY.md). `gsd-pr-branch` creates a filtered copy of the branch with only code commits, keeping PR diffs clean for reviewers. `gsd-ship` then pushes and opens the PR from that clean branch.

### Other GSD Rules

- Planning docs belong in `.planning/` — never in `src/` or `server/`
- Commit `.planning/` changes separately from source code changes
- `gsd-code-review` runs before any phase is marked complete

## Design Workflow

### Token System

- **Single source of truth**: `design/tokens.json` — all Pencil hex ↔ CSS token ↔ Tailwind class mappings
- **Reference table**: `design/TOKENS.md` — auto-generated session context artifact; run `npm run build:tokens` to regenerate; never edit manually
- **CSS variables**: `src/index.css` — HSL-based, dual theme (`:root` light + `.dark`)
- **Tailwind bridge**: `tailwind.config.js` — maps CSS vars to utilities via `hsl(var(--xxx))`

When adding or changing a design token:

1. Update `design/tokens.json`
2. Update `src/index.css` (light + dark values)
3. If new token, add Tailwind mapping in `tailwind.config.js`
4. Run `npm run build:tokens` to regenerate `TOKENS.md`

### Token Layer Architecture

This project uses **two parallel token layers** that serve different consumers. Writing business component code requires knowing which layer to use.

#### Layer Definitions

| Layer                  | CSS Variables                                                                                           | Tailwind Classes                                                              | Use In                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **shadcn Alias Layer** | `--card`, `--popover`, `--secondary`, `--accent`                                                        | `bg-card`, `bg-popover`, `bg-secondary`, `bg-accent`                          | shadcn built-in components only (Dialog, Popover, DropdownMenu, Tooltip…) |
| **App Semantic Layer** | `--surface-1/2/3`, `--surface-elevated`, `--brand`, `--warning`, `--frozen`, `--success`, `--label-dim` | `bg-surface-2`, `text-brand`, `bg-warning`, `bg-frozen`, `text-label-dim`…    | **Business components** — use these                                       |
| **Core Layer**         | `--background`, `--foreground`, `--border`, `--muted`, `--muted-foreground`, `--ring`, `--input`        | `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`… | Both layers                                                               |

#### Rule for Business Components

> **Business component code MUST only use App Semantic Layer + Core Layer.**
> Do NOT write `bg-card`, `bg-secondary`, `bg-accent`, or `bg-popover` in business component files.

**Correct:**

```tsx
<div className="bg-surface-2 text-foreground border-border">  // ✅ App Semantic + Core
<span className="text-muted-foreground">...</span>            // ✅ Core
<div className={cn('bg-warning', isActive && 'text-foreground')}>  // ✅
```

**Incorrect:**

```tsx
<div className="bg-card text-foreground">   // ❌ shadcn alias in business code
<div className="bg-secondary">              // ❌
<div style={{ backgroundColor: '#e5a700' }}>  // ❌ hardcoded hex
```

#### Why Two Layers Coexist

In dark mode, `--card` and `--surface-2` currently map to the same HSL value — but they serve different semantic purposes. Removing `--card` would break shadcn's Dialog and Popover internal styles. Do NOT delete the shadcn alias layer.

#### Adding New Tokens

Follow the three-file pipeline: `design/tokens.json` → `src/index.css` → `tailwind.config.js`, then `npm run tokens:build`.
See the "Token System" section above for the step-by-step procedure.

### Canvas Node Index

- **Single source of truth**: `design/canvas.json` — all Pencil node IDs, frame statuses, component variant IDs, and brief cross-references
- **AI tools** query `canvas.json` directly for node IDs; do not rely on phase planning docs for node ID lookups

When adding or renaming a top-level Pencil frame or component:

1. Update `design/canvas.json` — add/edit the relevant entry, bump `$version`, set `$updated`
2. Commit: `style(design): update canvas index vX.Y`

Internal nodes (children of a frame, e.g. sub-components, group headers) are documented in the brief's Node Reference table only — not in `canvas.json`.

### Pencil ↔ Code Consistency

- **Pencil wireframes** are the visual source of truth for layout, spacing, and appearance
- **Code** is the behavior source of truth — after a phase ships, implementation is canonical
- **Phase briefs** are ephemeral — they capture design intent ("why") per phase; archived after delivery, not actively maintained
- Never hardcode hex colors in components — always use CSS tokens (`var(--xxx)`) or Tailwind classes

## Figma Integration (Reference Only)

When implementing UI from Figma designs, consult the canonical docs:

- [`docs/figma/INTEGRATION-RULES.md`](docs/figma/INTEGRATION-RULES.md) — token mapping, component composition, asset management
- [`docs/figma/FIGMA-TO-CODE-CHECKLIST.md`](docs/figma/FIGMA-TO-CODE-CHECKLIST.md) — pre-PR ship checklist
- [`docs/figma/MCP-CODE-CONNECT-WORKFLOW.md`](docs/figma/MCP-CODE-CONNECT-WORKFLOW.md) — MCP / Code Connect roundtrip

**Quick rules**: map colors to semantic tokens first → reuse existing primitives → Tailwind for layout → Lucide for icons → validate dark mode.
