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

### Fast Adjustment Lane — Use This Instead of Full GSD When Scope Is Small

Not every change should pay the cost of the full discuss → plan → execute loop.

Use the **fast lane** (`gsd-quick`, `gsd-fast`, or an equivalent one-shot worktree task) when the change is **local, reversible, and does not alter architecture**:

- visual polish inside an existing screen or component
- copy, spacing, icon, or hierarchy cleanup
- token bridge completion (`tokens.json` → `index.css` → `tailwind.config.js`)
- Pencil-only refinement with no behavior change
- isolated bug fixes that do not introduce a new screen state or contract

Stay on the **full phase flow** when the work changes product behavior or coordination boundaries:

- new feature or screen state
- new API / DB / schema / route contract
- cross-component interaction redesign
- new token families or design-system primitives
- any change that needs a new brief, `UI-SPEC.md`, or multi-plan verification

**Fast lane rule**: still obey SSOT. Update the owning source once, run focused verification, and commit atomically. Do not spin up a full planning loop for a one-file or one-surface adjustment.

### Repo-local Frontend Planning Gate — MANDATORY

For any UI-facing phase, **run `gsd-ui-phase` before `gsd-plan-phase` unless the task qualifies for the fast lane above**.

A frontend phase is **not ready for planning** until these inputs exist and are current:

1. product intent from `design/PRODUCT.md`
2. token mapping from `design/tokens.json` / `design/TOKENS.md`
3. visual references from `design/main.pen` and `design/canvas.json`
4. phase-specific design intent (`*-DESIGN-BRIEF*.md`) when the phase changes UX behavior
5. `*-UI-SPEC.md` when implementation must match a designed UI contract

If one of these is missing, the next step is to create or refresh that artifact — **not** to let the executor guess.

### Repo-local Plan / Execute Override — Strict SSOT Enforcement

This repo extends GSD behavior through project instructions instead of patching upstream skills.

#### For `gsd-plan-phase`

Treat `/impeccable` output as a **shaping input**, not the final execution contract. It may refine the brief or canvas, but for non-fast-lane UI work the plan still needs a repo-local `UI-SPEC.md` before execution.

When a plan touches UI, the plan context must reference the correct SSOT layers already used successfully in Phase 01 and Phase 999.2:

- `design/PRODUCT.md` for product intent and UX constraints
- `design/TOKENS.md` for token bridge reference
- `design/canvas.json` for machine-readable Pencil node lookup
- `*-UI-SPEC.md` for implementation contract
- `*-DESIGN-BRIEF*.md` only for intent, rationale, and state-flow decisions

Each plan should make the ownership explicit: **behavior**, **visual**, **token bridge**, or **mixed**.

#### For `gsd-execute-phase` / `gsd-executor`

For UI work, always read in this order:

1. `design/PRODUCT.md` — product rules and mental model
2. `*-DESIGN-BRIEF*.md` — why, structure, and interactions
3. `*-UI-SPEC.md` — implementation contract for the phase
4. `design/canvas.json` + Pencil canvas — node IDs and visual reference
5. `design/TOKENS.md` plus runtime bridges in `src/index.css` / `tailwind.config.js`
6. implementation code in `src/`

**SSOT conflict rule**:

- token value conflicts → `design/tokens.json` wins
- visual/layout conflicts → Pencil (`design/main.pen` / `design/canvas.json`) wins
- interaction/intent conflicts → phase brief wins unless overridden by `design/PRODUCT.md`
- shipped runtime behavior → code is canonical after delivery

**Hard rule**: never copy raw hex or spacing guesses from a brief into React code. If a visual value matters in code, first bridge it through the token pipeline.

## Design Workflow

### Token Pipeline

```text
design/tokens.json  ─── npm run build:tokens ───▶  design/TOKENS.md (agent context artifact)
      │ (SSOT)
      ▼ (manual sync)
src/index.css          HSL CSS variables, :root light + .dark dark
      │
      ▼ (bridge)
tailwind.config.js     hsl(var(--xxx)) → Tailwind semantic utilities
      │
      ▼ (set_variables)
design/main.pen        Pencil canvas variable bindings
```

When adding or changing a design token:

1. Update `design/tokens.json`
2. Update `src/index.css` (light + dark values)
3. If new token, add Tailwind mapping in `tailwind.config.js`
4. Run `npm run build:tokens` to regenerate `TOKENS.md`

### Layer Authority

| Layer                      | Authority                         | Notes                                                              |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| Product decisions          | `design/PRODUCT.md`               | Mental model, state system, UX principles; long-lived              |
| Phase design intent        | phase brief (`.planning/`)        | "Why", structure, interaction constraints; archived after delivery |
| UI implementation contract | `XX-UI-SPEC.md`                   | Execution contract; freezes UI constraints for a phase             |
| Visual/layout              | Pencil canvas (`design/main.pen`) | Visual SSOT for layout, spacing, and appearance                    |
| Node index                 | `design/canvas.json`              | Machine-readable Pencil node index for agent lookups               |
| Token mapping              | `design/tokens.json`              | Pencil hex ↔ CSS token ↔ Tailwind mapping                          |
| Behavior/logic             | code (`src/` + `server/`)         | After delivery, code is the canonical implementation               |

### Token System

- **Single source of truth**: `design/tokens.json` — all Pencil hex ↔ CSS token ↔ Tailwind class mappings
- **Reference table**: `design/TOKENS.md` — auto-generated session context artifact; run `npm run build:tokens` to regenerate; never edit manually
- **CSS variables**: `src/index.css` — HSL-based, dual theme (`:root` light + `.dark`)
- **Tailwind bridge**: `tailwind.config.js` — maps CSS vars to utilities via `hsl(var(--xxx))`

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
