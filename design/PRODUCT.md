# Chorus — Product Design

**Role**: Canonical source for product-wide design decisions. Applies to all phases and all contributors.  
**Maintained in**: `design/PRODUCT.md` (repo root)  
**Last updated**: 2026-04-13

> Phase briefs reference this file. When this document conflicts with a phase brief,
> this document wins — unless the phase brief contains a clearly dated override note.

---

## Document Map

| File                              | Scope                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| **This file**                     | Product-wide mental model, architecture, status model, UX+visual principles                |
| [`design/TOKENS.md`](./TOKENS.md) | Auto-generated agent context artifact — token registry rendered from `tokens.json`         |
| [`design/main.pen`](./main.pen)   | Canonical wireframe — visual composition, spacing, component layout                        |
| [`DESIGN.md`](../DESIGN.md)       | Raycast design system reference — visual inspiration, shadow recipes, typography specimens |

---

## 1. Brief vs. Wireframe — Role Division

These two artefacts serve different purposes and intentionally diverge:

| Artefact                            | Owns                                                                                                          | Does NOT own                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Brief** (this doc + phase briefs) | Design intent, constraints, "why", interaction decisions, final copy                                          | Pixel specs, typography values, spacing numbers, layout coordinates             |
| **Wireframe** (`design/main.pen`)   | Visual composition, information hierarchy, component layout, discovery of details the brief didn't anticipate | Rationale, "why this choice", decisions that affect implementation architecture |

**Sync rule**: When the wireframe diverges from the brief, only **decision-bearing deviations** are back-ported into the brief — recorded as `> [date] Wireframe update:` footnotes. Visual-only details (font size, padding, exact spacing) live exclusively in the wireframe and are never duplicated into the brief.

---

## 2. Design Intent — Mental Model

> ClaudeCodeUI is a **pilot's cockpit**, not an air traffic control tower.
>
> The user is **inside a project**, steering one agent deep-focus mission — not watching a dashboard of everything simultaneously. Status awareness exists in context, not as a global HUD.

**Mental model shift:**

| Old (rejected)                               | New (correct)                                                        |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Dashboard showing all agents simultaneously  | Cockpit showing THIS mission's instruments                           |
| Global Agent Status Bar at top of every view | Status embedded in Sidebar → Project View → Session header (3-layer) |
| Landing Page as home screen                  | Sidebar as the navigation surface                                    |
| "Which project am I in?" prompt              | Sidebar always visible, project context always clear                 |

**Emotional goal**: A sense of mastery and confidence — a pilot's cockpit where everything is under control.

---

## 3. App Shell Architecture

### 3.1 Three-Zone Shell

```text
┌─────────────────────────────────────────────────────────────────┐
│ [B] Sidebar (collapsible)  │  [C] Main Canvas (flex-1)          │
│  ├ Stream List (scrollable)│   ├ State: Project View            │
│  └ Recent (fixed bottom)   │   ├ State: Session View            │
│                            │   └ State: Minimal Empty (launch)  │
└─────────────────────────────────────────────────────────────────┘
           [D] Mobile Bottom Nav Bar (≤768px only)
```

**No Global Status Bar / HUD at the top.** Status awareness is embedded in the structure.

### 3.2 Responsive Breakpoints

| Breakpoint            | Layout                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `≥1024px` (desktop)   | Sidebar visible (240px default, collapsible to 48px rail)        |
| `768–1023px` (tablet) | Sidebar collapsed to rail by default; tap icon to expand overlay |
| `<768px` (mobile)     | Sidebar hidden; [D] Mobile Bottom Nav appears                    |

### 3.3 Zone [B] — Sidebar (summary)

240px collapsible sidebar. The primary navigation surface. Sidebar is **always visible** on desktop — it does not collapse when entering a Session View.

- **Width**: 240px expanded, 48px rail collapsed
- **Structure**: Brand header → Search/filter bar → Projects section header → Stream list (flex-1 scroll) → RECENT (pinned) → Bottom stack (Update chip / Plugins / Settings)
- **Atomic unit**: Stream row (git branch/worktree), not the Project container

> Full spec: phase-specific sidebar brief (`02-DESIGN-BRIEF-SIDEBAR.md`)

### 3.4 Zone [C] — Main Canvas (summary)

Three mutually exclusive states:

| State             | Trigger                                    |
| ----------------- | ------------------------------------------ |
| **Minimal Empty** | No project selected / first launch         |
| **Project View**  | Click project/stream in Sidebar            |
| **Session View**  | Open a session from Project View or RECENT |

> Full spec: phase-specific main canvas brief (`02-DESIGN-BRIEF-MAIN-CANVAS.md`)

### 3.5 Zone [D] — Mobile Bottom Navigation (≤768px)

```text
┌─────────────────────────────────────────┐
│  🏠 Home    📋 Inbox    ⚡ Active    ≡ Menu │
└─────────────────────────────────────────┘
```

- `Home`: Sidebar sheet (slide up from bottom)
- `Inbox`: Current project's session inbox
- `Active`: Filter to show only active sessions across current project
- `Menu`: Settings, user, etc.
- **No HUD** — status is visible as badge on the `Active` tab icon

---

## 4. Status Awareness — 3-Layer Model

Replaces the rejected Global Agent Status Bar (HUD). Status is **embedded in context**, never floating above it.

| Layer              | Location                      | Granularity                                           | Update mechanism                       |
| ------------------ | ----------------------------- | ----------------------------------------------------- | -------------------------------------- |
| **1 — Project**    | Sidebar Stream row status dot | Stream-level state (active/idle/fresh) + unread badge | WebSocket push                         |
| **2 — Sessions**   | Project View sessions list    | Session-level: all active sessions in this project    | WebSocket push (session state changes) |
| **3 — Live agent** | Session View header badge     | Real-time agent state                                 | WebSocket stream                       |

**Design rationale**: You see Layer 1 always (Sidebar). You see Layer 2 when you enter a project. You see Layer 3 when you enter a session. Each layer deepens focus — never disrupts it.

### 4.1 Session Status — Semantic Color Rules

These rules apply everywhere session status is expressed (sidebar dots, status bar pills, session cards, badges):

| State                        | Color                            | Rule                                                                                            |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Waiting` (needs user input) | `#FF6363` / `--brand`            | **Brand red = needs you.** Solid dot, pulse glow on animated surfaces. Highest visual priority. |
| `Running` (autonomous)       | `#fbbf24` / `--warning`          | Yellow dot = working without you. Slow breath animation on animated surfaces.                   |
| `Idle` / `Fresh`             | `#6a6b6c` / `--muted-foreground` | Grey = at rest. Static, no animation.                                                           |
| `Frozen`                     | `$cc--status-frozen` (dim blue)  | Static, no pulse. Shown at tray bottom if recently frozen.                                      |
| `Error`                      | `#FF6363` / `--brand`            | Same as Waiting visually — red means attention needed. Context disambiguates.                   |

> **`#FF6363` exclusivity rule**: Brand red is used **only** for Waiting and Error states. Never use it for decoration, hover, or non-attention-demanding contexts. This makes it unmissable — when the user sees red, they know something needs them.

---

## 5. UX Design Principles

| Principle                  | Application                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Commander's View**       | Sidebar always visible = you always know where you are. Project row `●` = instant project status.            |
| **Progressive Complexity** | Default: single Workspace (invisible). Advanced: multi-Workspace (opt-in per project).                       |
| **Fluid Context**          | Sidebar → Project View → Session is a linear drill-down with a single `[←]` back. No breadcrumbs, no modals. |
| **Restrained Refinement**  | HUD removed. Status is contextual, not decorative. Workspace switcher hidden unless needed.                  |
| **Democratized Power**     | "Workspace" not "worktree". "Freeze" not "kill process". "Resume" not "restart session".                     |

---

## 6. Visual Design Language

This section captures product-level visual intent only. Raw implementation details such as exact color tables,
shadow recipes, and typography specimens live in [`DESIGN.md`](../DESIGN.md) and the generated
[`TOKENS.md`](./TOKENS.md).

### 6.1 Brand Personality

#### Mastery · Intuitive · Fluid

| Dimension     | Expression                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| **Mastery**   | A commander's control console — powerful enough to inspire confidence; every action says "you are in control" |
| **Intuitive** | Zero-learning-curve depth — non-programmers can collaborate with AI Agents without dev workflow knowledge     |
| **Fluid**     | Switching between tasks feels like water flowing — state transitions are seamless and never break focus       |

**Anti-references**: Do not import Linear/Jira-style project management concepts. Do not build another IDE.

### 6.2 Aesthetic Direction

- **Dark-first**: preserve the near-black, blue-cold base. Dark mode is primary; light mode is optional.
- **Raycast-inspired precision**: preserve crisp macOS-like elevation, restrained contrast, and tight micro-detail. See [`DESIGN.md`](../DESIGN.md) for the exact visual reference.
- **Brand accent**: use brand red as punctuation, not wallpaper. Reserve it for Waiting state, primary CTAs, and destructive actions.
- **Typography**: Inter for UI copy and GeistMono for code-like content. Exact specimens and sizing references live in [`DESIGN.md`](../DESIGN.md).

### 6.3 Surface Elevation System

Elevation is expressed through **stroke + shadow** combos, **not** background lightness — raising background color is not an elevation tool.

> Full surface-level table, shadow recipes, and semantic tinting rules live in
> [`.claude/skills/chorus-design/references/elevation.md`](../.claude/skills/chorus-design/references/elevation.md).
> Token values used in implementation: see [`TOKENS.md`](./TOKENS.md).

**Core constraint**: Never raise `background-color` to signal elevation — use ring + shadow only. The dark void must stay dark.
