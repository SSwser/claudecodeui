---
name: pencil-mcp
description: Guide for using the Pencil MCP server to read and design .pen files. Use when working with any .pen file — wireframing screens, updating colors, inserting icons, or modifying layout. Contains critical API pitfalls that cause silent failures.
---

# Pencil MCP — Usage Guide

See `references/api-patterns.md` for full operation syntax, icon names, and node property reference.

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

### 7. `replace_all_matching_properties` replaces across the ENTIRE subtree

A single color value often appears on multiple semantically different nodes (e.g., two different status indicators sharing the same hex). Global replace will change ALL of them.

**Safe pattern:**

1. Scope `parents` to the smallest subtree possible
2. Run `search_all_unique_properties` first to see what will be affected
3. After replacing, call `get_screenshot` to verify no unintended changes

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
