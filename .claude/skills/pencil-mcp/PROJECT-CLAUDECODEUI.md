# Pencil MCP — Chorus Project Adaptation

> Project-specific conventions for using Pencil MCP on Chorus.
> Read this alongside the generic `SKILL.md` when working on any `.pen` file in this repo.

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

Variables are injected as `cc--` prefix, bound to `Mode: Dark` theme axis.
Reference them in `batch_design` using the `$` sigil.

**Hex values are NOT duplicated here** — read [`design/tokens.json`](../../../design/tokens.json) (SSOT) or [`design/TOKENS.md`](../../../design/TOKENS.md) for all values. This table only documents the Pencil variable name → CSS token mapping (the part that doesn't exist in tokens.json).

| Pencil Variable               | Maps to CSS Token          | Notes                      |
| ----------------------------- | -------------------------- | -------------------------- |
| `$cc--background`             | `--background`             | alias of `$cc--surface-1`  |
| `$cc--surface-1`              | `--surface-1`              | app shell bg               |
| `$cc--surface-2`              | `--surface-2`              | cards, selected rows       |
| `$cc--surface-3`              | `--surface-3`              | toolbars, bars             |
| `$cc--surface-elevated`       | `--surface-elevated`       | popovers, modals           |
| `$cc--foreground`             | `--foreground`             | primary text               |
| `$cc--muted`                  | `--muted`                  | hover row bg               |
| `$cc--muted-foreground`       | `--muted-foreground`       | secondary text             |
| `$cc--label-dim`              | _(gap — no CSS token)_     | section labels, idle icons |
| `$cc--border`                 | `--border`                 | dividers                   |
| `$cc--sidebar-bg`             | `--sidebar-bg`             | sidebar background         |
| `$cc--sidebar-fg`             | `--sidebar-fg`             | sidebar text               |
| `$cc--sidebar-border`         | `--sidebar-border`         | sidebar divider            |
| `$cc--sidebar-accent`         | `--sidebar-accent`         | sidebar active accent      |
| `$cc--brand`                  | `--brand`                  | brand accent, primary CTA  |
| `$cc--primary`                | `--primary`                | alias of brand             |
| `$cc--brand-foreground`       | `--brand-foreground`       | text on brand              |
| `$cc--primary-foreground`     | `--primary-foreground`     | alias of brand-foreground  |
| `$cc--success`                | `--success`                | success state              |
| `$cc--warning`                | `--warning`                | warning / accent           |
| `$cc--destructive`            | `--destructive`            | destructive action         |
| `$cc--destructive-foreground` | `--destructive-foreground` | text on destructive        |
| `$cc--status-waiting`         | `--brand`                  | waiting dot (= brand)      |
| `$cc--status-running`         | `--warning`                | running dot (= warning)    |
| `$cc--status-idle`            | `--muted-foreground`       | idle dot                   |
| `$cc--status-frozen`          | _(gap — no CSS token yet)_ | frozen dot `#4a6fa5`       |
| `$cc--user-msg-border`        | _(gap — no CSS token)_     | user message border        |
| `$cc--frozen-notice-border`   | _(gap — no CSS token)_     | frozen notice border       |

**Typography**: `fontFamily: 'Inter'` for UI text, `fontFamily: 'Geist Mono'` for code/terminal.

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
tokens.json → npm run tokens:build → TOKENS.md (auto)
    ↓ (manual)
src/index.css    (CSS vars: :root light + .dark dark)
    ↓ (bridge)
tailwind.config.js   (hsl(var(--xxx)) → Tailwind utilities)
    ↓ (remind)
set_variables in main.pen  (cc-- variables must be re-synced)
```

After any `tokens.json` change: run `npm run tokens:build` — the script will remind you to sync Pencil variables.

---

## Aesthetic & Architecture Reference

Do not duplicate these here — read the canonical sources directly:

| Topic                                           | SSOT                                                | Key facts for Pencil use                                                                     |
| ----------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Visual aesthetic (shadows, colors, typography)  | [`DESIGN.md`](../../../DESIGN.md)                   | Near-black `#07080a` bg; brand red as punctuation only; +0.2px letter-spacing                |
| App shell zones, status model, responsive rules | [`design/PRODUCT.md`](../../../design/PRODUCT.md)   | 3-zone shell: Sidebar + Main Canvas + Mobile Nav; no global HUD; status in 3-layer hierarchy |
| Token hex values                                | [`design/tokens.json`](../../../design/tokens.json) | All `pencilHex` values live here — never copy into this file                                 |

**Status dot variables** (Pencil-only mapping, hex values in tokens.json):

| Status               | Pencil Variable       | CSS Token alias      |
| -------------------- | --------------------- | -------------------- |
| Waiting (needs user) | `$cc--status-waiting` | `--brand`            |
| Running (autonomous) | `$cc--status-running` | `--warning`          |
| Idle / Fresh         | `$cc--status-idle`    | `--muted-foreground` |
| Frozen               | `$cc--status-frozen`  | _(no CSS token yet)_ |

---

## Workflow: Designing a New Page/Phase Screen

When a GSD phase requires UI design work in Pencil:

```
1. Read design/PRODUCT.md §3 (shell architecture) — understand zone constraints
2. open_document("design/main.pen") if not already active
3. get_editor_state() → find the right canvas / existing frames
4. snapshot_layout() on parent frame → understand current occupied space
5. find_empty_space_on_canvas() → place new frame without overlap
6. Design using $cc--xxx tokens for ALL colors (never hardcode hex)
7. Use fontFamily: 'Inter' (UI) / 'Geist Mono' (code/mono)
8. Use iconFontFamily: 'lucide' for all icons
9. get_screenshot() after each meaningful batch to validate
10. Back-port only decision-bearing deviations to phase brief (not pixel specs)
```

---

## Workflow: Token Sync After tokens.json Update

```
1. Edit design/tokens.json
2. Edit src/index.css (CSS vars)
3. If new token: edit tailwind.config.js
4. npm run tokens:build  → regenerates TOKENS.md + prints reminder
5. Open main.pen, call set_variables() with updated cc-- values
   - Variable names: dashes only, no colons
   - Theme key: { "Mode": "Dark" }, not { "9:Mode": "Dark" }
6. get_variables() to verify write succeeded
```

---

## Workflow: Phase Brief ↔ Wireframe Sync

Rule: `PRODUCT.md` > phase brief. Visual specs live in Pencil only.

When brief and wireframe diverge:

- **Visual-only diff** (spacing, font sizes) → do nothing; wireframe is truth, no back-port needed
- **Decision-bearing diff** (layout pattern change, component added/removed) → add a dated footnote in brief: `> [2026-04-13] Wireframe update: ...`

When updating brief from Pencil truth (see generic SKILL.md workflow):

1. Confirm ambiguities with user before editing
2. Use `multi_replace_string_in_file` for batch edits
