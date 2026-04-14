# Pencil MCP — Chorus Project Adaptation

> Project-specific conventions for using Pencil MCP on Chorus.
> Load alongside generic [`SKILL.md`](./SKILL.md) (pitfalls/workflows) and [`references/api-patterns.md`](references/api-patterns.md) (API syntax).

---

## Design Files

| File                 | Purpose                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `design/main.pen`    | Primary wireframe canvas — visual SSOT for layout, spacing, component anatomy |
| `design/tokens.json` | Token SSOT — Pencil hex ↔ CSS token ↔ Tailwind class mapping                  |
| `design/TOKENS.md`   | Auto-generated reference table (never edit manually)                          |
| `design/PRODUCT.md`  | Canonical product design decisions — overrides any phase brief                |
| `DESIGN.md`          | Raycast-inspired aesthetic reference — shadow recipes, typography             |

Always open `design/main.pen` as the entry point. Do not create new `.pen` files without explicit instruction.

---

## Design Token Variables (main.pen)

Token variables are named with `cc--` prefix and referenced in `batch_design` as `$cc--...` (e.g., `fill: "$cc--background"`).
They are bound to the `Mode: Dark` theme axis in this repo.

**Hex values are NOT duplicated here** — read [`design/tokens.json`](design/tokens.json) (SSOT) or [`design/TOKENS.md`](design/TOKENS.md) for all values. This table documents the Pencil variable name → CSS token mapping only.

### Surface & Background

| Pencil Variable          | CSS Token            | Notes                        |
| ------------------------ | -------------------- | ---------------------------- |
| `$cc--background`        | `--background`       | alias of `$cc--surface-1`    |
| `$cc--surface-1`         | `--surface-1`        | app shell bg                 |
| `$cc--surface-2`         | `--surface-2`        | cards, selected rows         |
| `$cc--surface-3`         | `--surface-3`        | toolbars, bars               |
| `$cc--surface-elevated`  | `--surface-elevated` | popovers, modals             |
| `$cc--surface-container` | _(gap)_              | content container bg         |
| `$cc--surface-deep`      | _(gap)_              | deepest layer bg             |
| `$cc--panel-bg`          | _(gap)_              | panel backgrounds            |
| `$cc--modal-bg`          | _(gap)_              | modal dialog bg              |
| `$cc--menu-bg`           | _(gap)_              | dropdown/context menu bg     |
| `$cc--input-bg`          | _(gap)_              | input field bg               |
| `$cc--card-dark`         | _(gap)_              | dark card variant            |
| `$cc--overlay`           | _(gap)_              | overlay/scrim bg             |
| `$cc--skeleton-bg`       | _(gap)_              | skeleton loading placeholder |
| `$cc--status-bar-bg`     | _(gap)_              | status bar bg                |

### Text & foreground

| Pencil Variable         | CSS Token            | Notes                      |
| ----------------------- | -------------------- | -------------------------- |
| `$cc--foreground`       | `--foreground`       | primary text               |
| `$cc--heading`          | _(gap)_              | heading text               |
| `$cc--muted`            | `--muted`            | hover row bg               |
| `$cc--muted-foreground` | `--muted-foreground` | secondary text             |
| `$cc--label-dim`        | _(gap)_              | section labels, idle icons |

### Border & divider

| Pencil Variable       | CSS Token          | Notes           |
| --------------------- | ------------------ | --------------- |
| `$cc--border`         | `--border`         | dividers        |
| `$cc--sidebar-border` | `--sidebar-border` | sidebar divider |

### Sidebar

| Pencil Variable       | CSS Token          | Notes                 |
| --------------------- | ------------------ | --------------------- |
| `$cc--sidebar-bg`     | `--sidebar-bg`     | sidebar background    |
| `$cc--sidebar-fg`     | `--sidebar-fg`     | sidebar text          |
| `$cc--sidebar-accent` | `--sidebar-accent` | sidebar active accent |

### Brand & semantic

| Pencil Variable               | CSS Token                  | Notes                     |
| ----------------------------- | -------------------------- | ------------------------- |
| `$cc--brand`                  | `--brand`                  | brand accent, primary CTA |
| `$cc--primary`                | `--primary`                | alias of brand            |
| `$cc--brand-foreground`       | `--brand-foreground`       | text on brand             |
| `$cc--primary-foreground`     | `--primary-foreground`     | alias of brand-foreground |
| `$cc--success`                | `--success`                | success state             |
| `$cc--warning`                | `--warning`                | warning / accent          |
| `$cc--destructive`            | `--destructive`            | destructive action        |
| `$cc--destructive-foreground` | `--destructive-foreground` | text on destructive       |
| `$cc--amber-deep`             | _(gap)_                    | deep amber accent         |

### Accent colors

| Pencil Variable      | CSS Token | Notes         |
| -------------------- | --------- | ------------- |
| `$cc--accent-blue`   | _(gap)_   | blue accent   |
| `$cc--accent-indigo` | _(gap)_   | indigo accent |
| `$cc--accent-purple` | _(gap)_   | purple accent |
| `$cc--accent-orange` | _(gap)_   | orange accent |

### Status indicators

| Pencil Variable          | CSS Token Alias      | Notes                   |
| ------------------------ | -------------------- | ----------------------- |
| `$cc--status-waiting`    | `--brand`            | waiting dot (= brand)   |
| `$cc--status-running`    | `--warning`          | running dot (= warning) |
| `$cc--status-idle`       | `--muted-foreground` | idle dot                |
| `$cc--status-frozen`     | _(gap)_              | frozen dot `#4a6fa5`    |
| `$cc--status-running-bg` | _(gap)_              | running status bg       |
| `$cc--status-error-bg`   | _(gap)_              | error status bg         |
| `$cc--status-frozen-bg`  | _(gap)_              | frozen status bg        |

### Message-specific

| Pencil Variable             | CSS Token | Notes                |
| --------------------------- | --------- | -------------------- |
| `$cc--user-msg-border`      | _(gap)_   | user message border  |
| `$cc--frozen-notice-border` | _(gap)_   | frozen notice border |

**Typography**: `fontFamily: "Inter"` for UI text, `fontFamily: "Geist Mono"` for code/terminal.

---

## Design ↔ Code Authority Table

| Layer                     | SSOT                 | Rule                                                               |
| ------------------------- | -------------------- | ------------------------------------------------------------------ |
| Visual layout & spacing   | `design/main.pen`    | Wireframe wins; spec only back-ports decision-bearing deviations   |
| Token values              | `design/tokens.json` | All colors via CSS tokens — never hardcode hex in React components |
| Product decisions / "why" | `design/PRODUCT.md`  | Overrides phase briefs on conflict                                 |
| Component behavior        | `src/` code          | After phase ships, code is canonical                               |

### Token update pipeline

```
tokens.json → npm run build:tokens → TOKENS.md (auto)
    ↓ (manual)
src/index.css    (CSS vars: :root light + .dark dark)
    ↓ (bridge)
tailwind.config.js   (hsl(var(--xxx)) → Tailwind utilities)
    ↓ (remind)
set_variables in main.pen  (cc-- variables must be re-synced)
```

After any `tokens.json` change: run `npm run build:tokens` — the script will remind you to sync Pencil variables.

---

## Aesthetic & Architecture Reference

Do not duplicate these here — read the canonical sources directly:

| Topic                                           | SSOT                                       | Key facts for Pencil use                                                                     |
| ----------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Visual aesthetic (shadows, colors, typography)  | [`DESIGN.md`](DESIGN.md)                   | Near-black `#07080a` bg; brand red as punctuation only; +0.2px letter-spacing                |
| App shell zones, status model, responsive rules | [`design/PRODUCT.md`](design/PRODUCT.md)   | 3-zone shell: Sidebar + Main Canvas + Mobile Nav; no global HUD; status in 3-layer hierarchy |
| Token hex values                                | [`design/tokens.json`](design/tokens.json) | All `pencilHex` values live here — never copy into this file                                 |

---

## Canvas Node Index

All Pencil node IDs, frame statuses, component variants, and brief cross-references live in:

```
design/main.pen.index       ← WRITE source (machine-readable SSOT)
design/CANVAS-MAP.md        ← READ-ONLY view (auto-generated, human-readable)
```

**Do not use phase planning docs** (`.planning/phases/*/02-CANVAS-MAP.md`) as the node ID source — deprecated in favour of `design/main.pen.index`.

### Before each Pencil session

Load `design/main.pen.index` to get current node IDs and statuses.

### After each Pencil session

If you created, renamed, or deleted a **top-level frame** or changed a component's variant set:

1. Edit `design/main.pen.index` — update entry, bump `$version`, set `$updated`
2. Run `npm run build:canvas` to regenerate `design/CANVAS-MAP.md`
3. Commit both: `style(design): update canvas index vX.Y`

**Internal nodes** (children of a frame, e.g. card sub-nodes) are NOT added to `main.pen.index` — document them in the brief's Node Reference table.

### Status lifecycle

```
pending → wip → locked
```

- `wip` → `locked`: design is finalized; set before code handoff
- Never revert `locked` to `wip` without a version bump and PR comment

---

## Workflow: Designing a New Page/Phase Screen

```
1. Read design/PRODUCT.md §3 (shell architecture) — understand zone constraints
2. open_document("design/main.pen") if not already active
3. get_editor_state() → find the right canvas / existing frames
4. snapshot_layout() on parent frame → understand current occupied space
5. find_empty_space_on_canvas() → place new frame without overlap
6. Design using $cc--xxx tokens for ALL colors (never hardcode hex)
7. Use fontFamily: "Inter" (UI) / "Geist Mono" (code/mono)
8. Use iconFontFamily: "lucide" for all icons
9. get_screenshot() after each meaningful batch to validate
10. Back-port only decision-bearing deviations to phase brief
```

---

## Workflow: Token Sync After tokens.json Update

Two distinct steps — never conflate:

### Step A: Define token variables (metadata)

```
1. Edit design/tokens.json
2. Edit src/index.css (CSS vars)
3. If new token: edit tailwind.config.js
4. npm run build:tokens → regenerates TOKENS.md
5. Open main.pen, call set_variables() with updated cc-- definitions
   - Variable names: dashes only, no colons
   - Theme key: { "Mode": "Dark" }, not { "9:Mode": "Dark" }
6. get_variables() to verify write succeeded
```

### Step B: Bind tokens to canvas nodes

After variables exist, bind them to actual canvas elements:

```
1. search_all_unique_properties() → audit which nodes use raw hex
2. batch_design U() for each node needing token binding
   - ⚠️ NEVER use replace_all_matching_properties for $token binding (see SKILL.md §Color & Token)
3. get_screenshot() to verify rendering unchanged
```

---

## Workflow: Phase Brief ↔ Wireframe Sync

Rule: `PRODUCT.md` > phase brief. Visual specs live in Pencil only.

When brief and wireframe diverge:

- **Visual-only diff** (spacing, font sizes) → do nothing; wireframe is truth
- **Decision-bearing diff** (layout pattern change, component added/removed) → add dated footnote: `> [2026-04-13] Wireframe update: ...`

When updating brief from Pencil truth (see generic SKILL.md workflow):

1. Confirm ambiguities with user before editing
2. Use `multi_replace_string_in_file` for batch edits
