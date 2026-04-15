# Pencil MCP — Chorus Project Adaptation

> Project-specific conventions for using Pencil MCP on Chorus.
> Load alongside generic [`SKILL.md`](./SKILL.md) (pitfalls/workflows) and [`references/api-patterns.md`](references/api-patterns.md) (API syntax).
> For design-system ownership, token mappings, and token sync workflow, also load [`../chorus-design/SKILL.md`](../chorus-design/SKILL.md)
> and [`../chorus-design/PROJECT-CHORUS.md`](../chorus-design/PROJECT-CHORUS.md).

---

## Design Files

| File                                                         | Purpose                                                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `design/main.pen`                                            | Primary wireframe canvas — visual SSOT for layout, spacing, component anatomy       |
| `design/tokens.json`                                         | Token SSOT — Pencil hex ↔ CSS token ↔ Tailwind class mapping                        |
| `design/TOKENS.md`                                           | Auto-generated reference table (never edit manually)                                |
| `design/PRODUCT.md`                                          | Canonical product design decisions — overrides any phase brief                      |
| `.claude/skills/chorus-design/references/visual-language.md` | Raycast-inspired aesthetic reference — shadow recipes, typography, do/don'ts        |
| `.claude/skills/chorus-design/PROJECT-CHORUS.md`             | Chorus design-system adaptation — token mappings, sync pipeline, canvas conventions |

Always open `design/main.pen` as the entry point. Do not create new `.pen` files without explicit instruction.

---

## Design-System Boundary

This file now stays Pencil-specific.

- Token mappings, token metadata, and the canonical sync pipeline live in [`../chorus-design/PROJECT-CHORUS.md`](../chorus-design/PROJECT-CHORUS.md).
- Use this file for Pencil execution rules: canvas entry points, node-index maintenance, screenshot cadence, and brief back-port rules.
- In Pencil, continue referencing variables as `$cc--...` and bind them on the `Mode: Dark` theme axis.

---

## Design ↔ Code Authority Table

| Layer                     | SSOT                 | Rule                                                               |
| ------------------------- | -------------------- | ------------------------------------------------------------------ |
| Visual layout & spacing   | `design/main.pen`    | Wireframe wins; spec only back-ports decision-bearing deviations   |
| Token values              | `design/tokens.json` | All colors via CSS tokens — never hardcode hex in React components |
| Product decisions / "why" | `design/PRODUCT.md`  | Overrides phase briefs on conflict                                 |
| Component behavior        | `src/` code          | After phase ships, code is canonical                               |

For the full token pipeline, read [`../chorus-design/PROJECT-CHORUS.md`](../chorus-design/PROJECT-CHORUS.md).

---

## Aesthetic & Architecture Reference

Do not duplicate these here — read the canonical sources directly:

| Topic                                           | SSOT                                                                   | Key facts for Pencil use                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Visual aesthetic (shadows, colors, typography)  | [`visual-language.md`](../chorus-design/references/visual-language.md) | Near-black base; brand red as punctuation only; airy positive letter-spacing                 |
| App shell zones, status model, responsive rules | [`design/PRODUCT.md`](design/PRODUCT.md)                               | 3-zone shell: Sidebar + Main Canvas + Mobile Nav; no global HUD; status in 3-layer hierarchy |
| Token values and mappings                       | [`design/tokens.json`](design/tokens.json)                             | Canonical token metadata lives here — never copy raw values into this file                   |

---

## Canvas Node Index

All Pencil node IDs, frame statuses, component variants, and brief cross-references live in:

```text
design/canvas.json       ← Machine-readable SSOT
```

**Do not use phase planning docs** as the node ID source — use `design/canvas.json`.

### Before each Pencil session

Load `design/canvas.json` to get current node IDs and statuses.

### After each Pencil session

If you created, renamed, or deleted a **top-level frame** or changed a component's variant set:

1. Edit `design/canvas.json` — update entry, bump `$version`, set `$updated`
2. Commit: `style(design): update canvas index vX.Y`

**Internal nodes** (children of a frame, e.g. card sub-nodes) are NOT added to `canvas.json` — document them in the brief's Node Reference table.

### Status lifecycle

```text
pending → wip → locked
```

- `wip` → `locked`: design is finalized; set before code handoff
- Never revert `locked` to `wip` without a version bump and PR comment

---

## Workflow: Designing a New Page/Phase Screen

```text
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

Use [`../chorus-design/SKILL.md`](../chorus-design/SKILL.md) plus
[`../chorus-design/PROJECT-CHORUS.md`](../chorus-design/PROJECT-CHORUS.md) for the authoritative token sync workflow.

Pencil-specific reminder only:

```text
1. Confirm the token exists and has been bridged into CSS/Tailwind before touching the canvas
2. Open main.pen and update variables with set_variables()
3. Bind tokens to nodes with batch_design U()
4. get_screenshot() to verify rendering is unchanged
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
