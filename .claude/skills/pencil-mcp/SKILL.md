---
name: pencil-mcp
description: Guide for using the Pencil MCP server to read and design .pen files. Use when working with any .pen file — wireframing screens, updating colors, inserting icons, or modifying layout. Contains critical API pitfalls that cause silent failures.
---

# Pencil MCP — Usage Guide

Full API syntax, property schemas, and icon reference → [`references/api-patterns.md`](references/api-patterns.md).

---

## File Responsibilities

| File                       | Owns                                                                    | Does NOT own                                               |
| -------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`SKILL.md`** (this file) | All pitfalls (categorized), universal workflows                         | API syntax (→ api-patterns), project specifics (→ PROJECT) |
| **`api-patterns.md`**      | Tool call syntax, property schemas, icon table, layout patterns         | Pitfalls, workflows, project data                          |
| **`PROJECT-<name>.md`**    | Token table, file map, design authority, canvas node index, project wfs | API mechanics, generic pitfalls                            |

**When starting a Pencil task**: load SKILL.md for pitfalls/workflows → api-patterns.md for syntax → PROJECT-xxx.md for project context.

---

## Critical Pitfalls

### Node Operations (I / C / R / D / M / U)

**Bindings are call-scoped.** `foo=I(...)` is only valid within the same `batch_design` call. Multi-step work requiring a step-1 binding in step 2 must be in a single call.

**`I()` requires explicit `type`.** Omitting `type` from props throws `"must have a string 'type' property"`:

```js
// ❌ crashes
I('parent', { width: 340, fill: '#131415' });
// ✅ correct
I('parent', { type: 'frame', width: 340, fill: '#131415' });
```

**`I()` with index `0` crashes.** Pencil misinterprets the third arg `0` as a parent node ID. Use `M()` instead:

```js
// ❌ crashes: "Cannot create property 'id' on number '0'"
foo=I("parent", { ... }, 0)
// ✅ append then reorder
foo=I("parent", { ... })
M(foo, "parent", 0)
```

Non-zero indices work fine.

**`R()` does NOT resize parent containers.** After replacing a node, the parent keeps its original `gap`/`padding`. If sizing matters, `U()` the parent in the same batch.

**`D()` is permanent — `visible: false` does NOT work.** `U("id", { visible: false })` throws an error. There is no soft-hide. Double-check node IDs before deleting.

**`C()` may fail on empty parents.** Copying into a newly created or empty parent throws `"Cannot use 'in' operator to search for 'descendants'"`. Workaround: rebuild with `I()` instead of copying.

**`content`, not `textContent`.** `U("id", { textContent: "..." })` is silently ignored. Use `content`:

```js
U('id', { content: 'new text' });
```

### Properties & Rendering

**`stroke` format is `{ fill: "#hex" }`.** Not a string, not `{ color, width }`:

```js
// ❌ wrong
{ stroke: "#161718" }
{ stroke: { color: "#161718", width: 1 } }
// ✅ correct
{ stroke: { fill: "#161718" } }
{ stroke: { fill: "$cc--border" } }
```

**Font family names are exact strings.** Typos fall back silently:

```js
// ❌ wrong: "GeistMono"
// ✅ correct: "Geist Mono" (space required), "Inter"
```

**`fill_container` requires parent `layout`.** Setting `height: "fill_container"` on a child does nothing if the parent has no `layout` property. Set parent layout first:

```js
U('parentId', { layout: 'vertical' });
U('childId', { height: 'fill_container' });
```

**`padding` — single value or array only.** `paddingTop`, `paddingBottom` etc. are invalid. Use:

```js
padding: 40; // uniform
padding: [40, 20]; // [vertical, horizontal]
padding: [40, 20, 40, 20]; // [top, right, bottom, left]
```

### Color & Token

**`replace_all_matching_properties` — hex → hex only, NEVER for token binding.**
Passing `to: "$cc--xxx"` stores `\$cc--xxx` (backslash-escaped `$`). The canvas renders correctly but the stored format is non-canonical. All `$token` bindings must use `batch_design U()`:

```js
// ❌ stores \$cc--background
replace_all_matching_properties(parents: ["id"], properties: {
  fillColor: [{ from: "#07080a", to: "$cc--background" }]
})
// ✅ stores $cc--background (canonical)
U("nodeId", { fill: "$cc--background" })
```

**`replace_all_matching_properties` — properties grouped by type, not flat.**

```js
// ❌ wrong format
{
  replacements: [{ property: 'fillColor', from: '#aaa', to: '#bbb' }];
}
// ✅ correct format
{
  properties: {
    fillColor: [{ from: '#aaa', to: '#bbb' }];
  }
}
```

**Alpha-suffixed hex not matched.** `#rrggbbff` is a distinct value from `#rrggbb` — both must be listed:

```js
fillColor: [
  { from: '#161718', to: '#newvalue' },
  { from: '#161718ff', to: '#newvalue' },
];
```

Run `search_all_unique_properties` first to discover which form is stored.

**`replace_all_matching_properties` replaces entire subtree.** Scope `parents` to the smallest target. Verify with `get_screenshot` after.

**`set_variables` — naming constraints.** Variable names and theme keys cannot contain colons. Use `{ "Mode": "Dark" }`, not `{ "9:Mode": "Dark" }`. Single-theme files may silently discard the default value — verify with `get_variables`.

**Global (non-themed) variables cannot be updated.** `set_variables` throws `"does not have a valid definition"`. Workaround: `replace_all_matching_properties` to update hex values on canvas (metadata stays stale), or delete and recreate the variable.

### Tool API

**`get_guidelines` — must pass BOTH `category` AND `name`.** Passing only `name` returns the index silently (no error):

```js
// ❌ returns index, not content
get_guidelines(name: "Design System")
// ✅ correct
get_guidelines(category: "guide", name: "Design System")
```

---

## Workflow: Color Calibration

**Two distinct operations — never mix them:**

| Operation               | Tool                              | Use when                                               |
| ----------------------- | --------------------------------- | ------------------------------------------------------ |
| Hex → hex normalization | `replace_all_matching_properties` | Unifying raw color values (e.g. `#161718` → `#161819`) |
| Bind design token       | `batch_design U()`                | Replacing a hex value with a `$cc--token` reference    |

```js
// 1. Audit current colors
search_all_unique_properties(parents: ["<nodeId>"], properties: ["fillColor", "textColor"])

// 2a. Hex normalization
replace_all_matching_properties(parents: ["<nodeId>"], properties: {
  fillColor: [{ from: "#oldvalue", to: "#newvalue" }]
})

// 2b. Token binding — MUST use batch_design
U("nodeId", { fill: "$cc--background" })
```

**Verify clean token storage** (PowerShell):

```powershell
$t = [IO.File]::ReadAllText("path/to/main.pen")
([regex]::Matches($t, '\\$cc--')).Count   # escaped tokens: must be 0
([regex]::Matches($t, '\$cc--')).Count    # total token references
([regex]::Matches($t, '"fill":"#')).Count # hardcoded fills: should be 0
```

---

## Workflow: Gap Analysis (Spec vs Wireframe)

```
1. get_screenshot(rootNodeId)          → visual overview
2. batch_get([key node IDs], depth: 4) → inspect actual property values
3. Cross-check against spec (colors, sizes, content, structure)
4. Write out gaps explicitly before touching anything
5. Execute fixes in batch_design — group related ops per call
6. get_screenshot again → verify nothing regressed
```

---

## Workflow: Adding Icons to Replace Text/Emoji

Icon names → see `references/api-patterns.md#icons`.

```js
// Replace text node with icon + label container
srch = R('textNodeId', { type: 'frame', alignItems: 'center', gap: 5 });
I(srch, {
  type: 'icon_font',
  iconFontFamily: 'lucide',
  iconFontName: 'search',
  width: 14,
  height: 14,
  fill: '$cc--label-dim',
});
I(srch, {
  type: 'text',
  content: 'Label',
  fontFamily: 'Inter',
  fontSize: 12,
  fill: '$cc--muted-foreground',
});
```

---

## Workflow: Node Restructure (reorder or reshape children)

Do NOT reorder children by repositioning — unreliable. **Delete old, rebuild from copy template:**

```
1. C("templateNodeId", "parentId") → new copy
2. U(copy, { content: "...", fill: "..." }) → override data in same batch
3. D("oldNodeId") → remove old node
```

---

## Workflow: Syncing a Design Spec (brief) from Pencil Truth

1. `get_screenshot` + `batch_get` (3–4 key nodes, depth 3–4) — establish ground truth
2. Compare against brief; sort into:
   - **Sync directly**: clear discrepancies with a single correct answer
   - **Needs clarification**: ambiguous intent, conflicting signals
3. Ask ALL clarification questions in one message — don't drip-feed
4. After confirmed, batch-apply edits with `multi_replace_string_in_file`

**Do not edit the brief before clarifications are confirmed.**

---

## Project Adaptation Layer

This skill covers generic Pencil MCP API rules. Project-specific conventions live in a separate adaptation file:

| Project | Adaptation File                            |
| ------- | ------------------------------------------ |
| Chorus  | [`PROJECT-CHORUS.md`](./PROJECT-CHORUS.md) |

<<<<<<< HEAD
The adaptation file contains: token variable table, design file map, design ↔ code authority, canvas node index, and project-specific workflows.
=======
| Project | Adaptation File                                        |
| ------- | ------------------------------------------------------ |
| Chorus  | [`PROJECT-CLAUDECODEUI.md`](./PROJECT-CLAUDECODEUI.md) |

The adaptation file contains:

- Token variable table (`$cc--xxx` names + dark hex values)
- Design ↔ code authority table (which file wins on conflict)
- Token sync pipeline (when to re-run `set_variables`)
- Phase screen design workflow
- Aesthetic rules (surface hierarchy, shadows, typography)

---

## Canvas Node Index (SSOT)

All Pencil node IDs, frame statuses, component variants, and brief cross-references for Chorus live in:

```
design/main.pen.index       ← WRITE source (machine-readable SSOT)
design/CANVAS-MAP.md        ← READ-ONLY view (auto-generated, human-readable)
```

**Do not use phase planning docs** (`.planning/phases/*/02-CANVAS-MAP.md`) as the node ID source — that file is deprecated in favour of `design/main.pen.index`. The planning-dir copy is kept only as a change log / phase artifact.

### Before each Pencil session

Load `design/main.pen.index` to get current node IDs and statuses. Example query pattern:

```jsonc
// Find the node ID for "Session Card States" component
// → components.session.items → nodeId: "ja1S0", variantGroups: { active: { variants: { J7orz: "Running", ... } }, ... }
```

### After each Pencil session

If you created, renamed, or deleted a **top-level frame** (any direct child of `5NJPi`, `Z3eP8`, `nlmcQ`, or `7fmkI`), or changed a component's variant set:

1. Edit `design/main.pen.index` — update the relevant entry, bump `$version` (patch for rename/status, minor for new frame), set `$updated`
2. Run `npm run canvas:build` to regenerate `design/CANVAS-MAP.md`
3. Commit both files together: `style(design): update canvas index vX.Y`

**Internal nodes** (children of a Cmp / or Page / frame, e.g. session list group headers, card sub-nodes) are NOT added to `main.pen.index`. Document them in the brief's Node Reference table instead.

### Status lifecycle

```
pending → wip → locked
```

- `wip` → `locked`: design is finalized; set in `main.pen.index` before code handoff begins
- Never revert a `locked` entry to `wip` without a version bump and PR comment
>>>>>>> 5cdfe52 (refactor: rename instances of "Claude Code UI" to "Chorus" across the codebase)
