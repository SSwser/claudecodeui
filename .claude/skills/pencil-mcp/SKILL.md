---
name: pencil-mcp
description: Guide for using the Pencil MCP server to read and design .pen files. Use when working with any .pen file — wireframing screens, updating colors, inserting icons, or modifying layout. Contains critical API pitfalls that cause silent failures.
---

# Pencil MCP — Usage Guide

See `references/api-patterns.md` for full operation syntax, icon names, and node property reference.

---

## File Responsibilities

This skill is split into two layers:

| File                       | Owns                                                                                                           | Does NOT own                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **`SKILL.md`** (this file) | Generic Pencil API rules, all known pitfalls, universal workflows                                              | Project file paths, token names, design authority decisions, project-specific workflows |
| **`PROJECT-<name>.md`**    | Project-specific conventions: file map, token variable names, design ↔ code authority table, project workflows | API mechanics — those stay in SKILL.md                                                  |

**When starting a Pencil task**: load SKILL.md first for API rules, then load the matching `PROJECT-xxx.md` for project context. The two files are complementary and non-overlapping — each owns distinct knowledge.

---

## Critical Pitfalls (read before every session)

### 1. `get_guidelines` — must pass BOTH `category` AND `name`

Passing only `name` returns the index list silently without error:

```js
// ❌ silently returns index — no content loaded
get_guidelines(name: "Design System")

// ✅ correct — returns actual guide content
get_guidelines(category: "guide", name: "Design System")
get_guidelines(category: "guide", name: "Web App")
```

Valid category values: `"guide"` | `"style"` (inferred — not documented in tool).

### 2. `replace_all_matching_properties` — properties must be grouped by type

```js
// ❌ wrong — flat replacements array
{ replacements: [{property: "fillColor", from: "#aaa", to: "#bbb"}] }

// ✅ correct — nested under properties object, grouped by property name
{ properties: { fillColor: [{from: "#aaa", to: "#bbb"}], textColor: [{from: "#ccc", to: "#ddd"}] } }
```

### 3. `batch_design` bindings die after each call

Bindings (e.g., `foo=I(...)`) are only valid within the same `batch_design` call. If multi-step work requires a binding from step 1 in step 2, put both steps in a single call.

### 4. `R()` (replace) does NOT resize parent containers

After replacing a text node with an icon_font node, the parent frame keeps its original `gap`/`padding`. If sizing matters, `U()` the parent in the same batch.

### 5. `D("nodeId")` is permanent — and `visible: false` does NOT work

`U("nodeId", {visible: false})` throws an error — it is **not a valid property** in `batch_design`. There is no soft-hide option. If you need to remove a node, you must `D()` it. Double-check node IDs before deleting.

### 6. Font family names are exact strings — typos silently fall back

```js
// ❌ fails silently (wrong)
{
  fontFamily: 'GeistMono';
}

// ✅ correct
{
  fontFamily: 'Geist Mono';
} // space required
{
  fontFamily: 'Inter';
} // no variants needed
```

Other valid families: `"Geist Mono"`, `"Inter"`. Material Symbols use `iconFontFamily`, not `fontFamily`.

### 7. `I()` with index `0` as third argument crashes

Pencil misinterprets the third argument `0` as the parent node ID (a numeric 0), not an insert index. This throws: `"Cannot create property 'id' on number '0'"`.

```js
// ❌ crashes
foo=I("parent", { ... }, 0)

// ✅ append first, then reorder with M()
foo=I("parent", { ... })
M(foo, "parent", 0)
```

Non-zero indices are unaffected — `I("parent", {...}, 2)` works. Only `0` triggers the bug.

### 8. `stroke` format is `{fill: "#hex"}` — not a string or `{color, width}`

```js
// ❌ wrong
{ stroke: "#161718" }
{ stroke: { color: "#161718", width: 1 } }

// ✅ correct
{ stroke: { fill: "#161718" } }
```

### 9. Update text content via `content`, not `textContent`

```js
// ❌ silently ignored
U('nodeId', { textContent: 'new text' });

// ✅ correct
U('nodeId', { content: 'new text' });
```

### 10. `fill_container` height requires parent to have explicit `layout`

Setting `height: "fill_container"` on a child does nothing if the parent frame has no `layout` property set. The strip renders at zero or unresolved height.

```js
// ❌ strip won't render — parent has no layout
U('childId', { height: 'fill_container' });

// ✅ set parent layout first, then child fill
U('parentId', { layout: 'vertical' }); // or "horizontal"
U('childId', { height: 'fill_container' });
```

Both calls can be in the same `batch_design`.

### 11. `replace_all_matching_properties` — alpha-suffixed hex variants are NOT matched

Colors stored internally as `#rrggbbff` (with full-opacity alpha suffix) will not match a bare `#rrggbb` replacement rule. Both forms must be covered explicitly.

```js
replace_all_matching_properties(parents: ["rootId"], properties: {
  fillColor: [
    { from: "#161718",   to: "#newvalue" },
    { from: "#161718ff", to: "#newvalue" }   // also cover the alpha variant
  ]
})
```

Run `search_all_unique_properties` first to discover which form is actually stored.

### 12. `replace_all_matching_properties` replaces across the ENTIRE subtree

A single color value often appears on multiple semantically different nodes (e.g., two different status indicators sharing the same hex). Global replace will change ALL of them.

**Safe pattern:**

1. Scope `parents` to the smallest subtree possible
2. Run `search_all_unique_properties` first to see what will be affected
3. After replacing, call `get_screenshot` to verify no unintended changes

### 13. `set_variables` — naming and theme key constraints

Variable names and theme keys **cannot contain colons**. Both constraints are hard errors (not silent).

```js
// ❌ errors — colons in variable name or theme key
set_variables({ "my:token": { ... } })
set_variables({ "mytoken": { type: "color", value: [{ theme: { "9:Mode": "Dark" }, value: "#07080a" }] } })

// ✅ correct — dashes only in names, drop numeric prefix from theme keys
set_variables({
  "my-token": {
    type: "color",
    value: [
      { value: "#ffffff" },                          // default
      { theme: { "Mode": "Dark" }, value: "#07080a" } // themed override
    ]
  }
})
```

**Single-theme files**: If the `.pen` file only has one theme axis registered (e.g. `Mode: ["Dark"]`), the default value entry may be silently discarded — only the themed override is retained. Verify with `get_variables` after writing.

**Global (non-themed) variables** — once created with a bare value (no theme override), `set_variables` **cannot update the value**. It throws `"does not have a valid definition"`. Workaround: use `replace_all_matching_properties` to update the actual hex values in the canvas, and accept the variable metadata is stale. To fix the variable definition, delete and recreate it.

**Reference variables in `batch_design`** using `$` sigil:

```js
I('parentId', { fill: '$my-token', stroke: { fill: '$my-border' } });
```

### 14. `I()` requires explicit `type` property on the props object

Omitting `type` from the second argument throws: `"must have a string 'type' property"`.

```js
// ❌ crashes — no type
I('parent', { width: 340, fill: '#131415' });

// ✅ correct — always include type
I('parent', { type: 'frame', width: 340, fill: '#131415' });
I('parent', { type: 'text', content: 'Hello', fontSize: 12 });
```

### 15. `padding` must be a single value or array — no individual padding properties

`paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight` are **not valid**. Use the `padding` shorthand.

```js
// ❌ crashes — invalid properties
I('parent', { type: 'frame', paddingTop: 40, paddingBottom: 40 });

// ✅ correct — single value or [top, right, bottom, left] array
I('parent', { type: 'frame', padding: 40 });
I('parent', { type: 'frame', padding: [40, 40, 40, 40] });
```

### 16. `C()` may fail when target parent has no descendants yet

`C()` (Copy) throws `"Cannot use 'in' operator to search for 'descendants'"` when copying into a newly created or empty parent frame — even if that parent was created in a prior `batch_design` call and has a valid ID.

**Workaround**: Instead of `C()`, manually rebuild the node with `I()`. This is particularly relevant for deep structures that need to be duplicated for comparison layouts.

```js
// ❌ may crash — copying into a leaf/empty frame
C("sourceNode", "emptyParent")

// ✅ reliable alternative — rebuild with I()
card=I("emptyParent", { type: "frame", width: 340, fill: "#131415", cornerRadius: 8, ... })
// ...recreate children with I() inside card
```

---

## Icons — Lucide icon_font Usage

Pencil supports `icon_font` type natively. Use `lucide` for all UI icons (matches the codebase's `lucide-react` dependency).

```js
// Standalone icon
I('parentId', {
  type: 'icon_font',
  iconFontFamily: 'lucide',
  iconFontName: 'settings',
  width: 16,
  height: 16,
  fill: '#6a6b6c',
});

// Replace text/emoji node with icon
R('nodeId', {
  type: 'icon_font',
  iconFontFamily: 'lucide',
  iconFontName: 'search',
  width: 14,
  height: 14,
  fill: '#434345',
});
```

Common icon names → see `references/api-patterns.md#icons`.

---

## Workflow: Color Calibration

Audit first, then batch-replace. Use `search_all_unique_properties` to find what values are currently in use:

```js
// 1. Audit current colors in a section
search_all_unique_properties(parents: ["<nodeId>"], properties: ["fillColor", "textColor"])

// 2. Batch replace — all replacements in one call
replace_all_matching_properties(
  parents: ["<nodeId>"],
  properties: {
    fillColor: [{from: "#oldvalue", to: "#newvalue"}, ...],
    textColor: [{from: "#oldvalue", to: "#newvalue"}, ...]
  }
)
```

---

## Workflow: Gap Analysis (Spec vs Wireframe)

Use this workflow when auditing a screen against a design spec to find and fix discrepancies.

```
1. get_screenshot(rootNodeId)          → visual overview
2. batch_get([key node IDs], depth: 4) → inspect actual property values
3. Cross-check against spec (colors, sizes, content, structure)
4. Write out gaps explicitly before touching anything
5. Execute fixes in batch_design — group related ops per call
6. get_screenshot again → verify nothing regressed
```

**`batch_get` depth guidance:**

- `depth: 2` — top-level frame + direct children (layout/structure)
- `depth: 4` — full row anatomy (good for most audits)
- `depth: 6` — deeply nested compositions (use sparingly — large output)

---

## Workflow: Adding Icons to Replace Text/Emoji

```js
// Pattern: Replace text node, then insert icon into same parent at position 0
srch = R('textNodeId', { type: 'frame', alignItems: 'center', gap: 5 });
I(srch, {
  type: 'icon_font',
  iconFontFamily: 'lucide',
  iconFontName: 'search',
  width: 14,
  height: 14,
  fill: '#434345',
});
I(srch, { type: 'text', content: 'Label', fontFamily: 'Inter', fontSize: 12, fill: '#6a6b6c' });
```

---

## Workflow: Node Restructure (reorder or reshape children)

Do NOT try to move existing child nodes into a new order by repositioning — it's unreliable.
Instead: **delete the old structure and rebuild from a copy template**.

```
1. C("templateNodeId", "parentId") → new copy with correct structure
2. U(copy, { content: "...", fill: "..." }) → override data in same batch
3. D("oldNodeId") → remove old node
```

This is more reliable than trying to reorder siblings or patch deeply nested nodes.

---

## Workflow: Syncing a Design Spec (brief) from Pencil Truth

When updating a written spec/brief to match what Pencil actually shows:

1. `get_screenshot` + `batch_get` (3–4 key nodes, depth 3–4) — establish ground truth
2. Compare against the brief file; sort findings into:
   - **Sync directly**: clear discrepancies with a single correct answer
   - **Needs clarification**: ambiguous intent, conflicting signals, or missing data
3. Ask ALL clarification questions in one message — don't drip-feed
4. After answers confirmed, batch-apply edits with `multi_replace_string_in_file`

**Do not edit the brief before clarifications are confirmed.**

---

## Project Adaptation Layer

This skill covers generic Pencil MCP API rules. Project-specific conventions (token variable tables, file paths, design authority rules, phase design workflows) live in a separate adaptation file alongside this skill.

**When working on a project**, load the corresponding project file before starting:

| Project      | Adaptation File                                        |
| ------------ | ------------------------------------------------------ |
| ClaudeCodeUI | [`PROJECT-CLAUDECODEUI.md`](./PROJECT-CLAUDECODEUI.md) |

The adaptation file contains:

- Token variable table (`$cc--xxx` names + dark hex values)
- Design ↔ code authority table (which file wins on conflict)
- Token sync pipeline (when to re-run `set_variables`)
- Phase screen design workflow
- Aesthetic rules (surface hierarchy, shadows, typography)

---

## Canvas Node Index (SSOT)

All Pencil node IDs, frame statuses, component variants, and brief cross-references for ClaudeCodeUI live in:

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
