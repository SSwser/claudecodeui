# Pencil MCP — API Patterns Reference

> SSOT for all Pencil MCP tool call syntax, property schemas, and icon reference.
> Pitfalls and gotchas → see [`SKILL.md`](../SKILL.md).

## Table of Contents

1. [batch_design — Operation DSL](#batch_design--operation-dsl)
2. [replace_all_matching_properties](#replace_all_matching_properties)
3. [search_all_unique_properties](#search_all_unique_properties)
4. [set_variables / get_variables](#set_variables--get_variables)
5. [batch_get](#batch_get)
6. [get_guidelines](#get_guidelines)
7. [Icons](#icons)
8. [Node Properties](#node-properties)
9. [Layout Properties](#layout-properties)

---

## `batch_design` — Operation DSL

Each line is a separate operation. Bindings (`foo=I(...)`) are **local to the call block** — they expire when the call returns.

```js
// Insert node into parent — type is REQUIRED (see SKILL.md §Node Operations)
foo = I('parentId', { type: 'frame', ...props });

// Copy existing node into parent
bar = C('sourceNodeId', 'parentId', { ...overrides });

// Replace node entirely (keeps node ID, replaces content)
baz = R('nodeId', { ...newProps });

// Update specific properties on existing node
U('nodeId', { height: 40, fill: '$cc--background' });

// Delete node permanently (no undo, no visible:false alternative)
D('nodeId');

// Move node to different parent at index
M('nodeId', 'newParentId', 2);

// Generate AI image into node
G('nodeId', 'ai', 'prompt text');
```

### Insert at position

```js
// ⚠️ I() with index 0 crashes — use M() instead (see SKILL.md §Node Operations)
foo=I("parentId", { type: "icon_font", ... })
M(foo, "parentId", 0)  // move to first position
```

### Path notation for descendants

```js
parent = I('canvas', { type: 'ref', ref: 'componentId' });
child = I(parent + '/slotNodeId', { type: 'ref', ref: 'itemId' });
```

### Token references in properties

Use the `$` sigil to bind a design token variable:

```js
U('nodeId', { fill: '$cc--background' });
I('parentId', { type: 'frame', fill: '$cc--surface-2', stroke: { fill: '$cc--border' } });
```

**Only `batch_design` stores token refs correctly.** See SKILL.md §Color & Token for why `replace_all_matching_properties` cannot be used for token binding.

---

## `replace_all_matching_properties`

Batch-replace property values across an entire subtree. **For hex → hex normalization only** — never for `$token` binding.

```js
replace_all_matching_properties(
  parents: ["rootNodeId"],
  properties: {
    fillColor: [
      { from: "#oldHex", to: "#newHex" },
      { from: "#oldHexff", to: "#newHex" }  // cover alpha variant
    ],
    textColor: [
      { from: "#aaa", to: "#bbb" }
    ]
  }
)
```

Key constraints — full explanations and workarounds in SKILL.md §Color & Token:

- `properties` is grouped by type (`fillColor`, `textColor`, `strokeColor`) — not a flat array
- Alpha-suffixed hex variants (`#rrggbbff`) are NOT matched by bare `#rrggbb` — both must be listed
- Replaces across the ENTIRE subtree — scope `parents` to smallest target
- **Cannot bind `$token` refs** — `to: "$cc--xxx"` stores `\$cc--xxx` (escaped)

---

## `search_all_unique_properties`

Discover all unique property values in a subtree. Run before `replace_all_matching_properties` to audit what will be affected.

```js
search_all_unique_properties(
  parents: ["nodeId"],
  properties: ["fillColor", "textColor", "strokeColor", "fontFamily"]
)
```

---

## `set_variables` / `get_variables`

Define or read design token variables. `set_variables` defines metadata — to **bind** tokens to canvas nodes, use `batch_design U()`.

```js
// Define a themed color variable
set_variables({
  'cc--background': {
    type: 'color',
    value: [
      { value: '#ffffff' }, // default (may be discarded in single-theme files)
      { theme: { Mode: 'Dark' }, value: '#07080a' }, // themed override
    ],
  },
});

// Read all variables
get_variables();
```

Key constraints — full explanations in SKILL.md §Color & Token:

- Variable names and theme keys **cannot contain colons** → `{ "Mode": "Dark" }`, not `{ "9:Mode": "Dark" }`
- Single-theme files may silently discard the default (non-themed) value entry
- Global (non-themed) variables cannot be updated via `set_variables` once created

---

## `batch_get`

Retrieve node tree data for inspection.

```js
batch_get(nodeIds: ["nodeId1", "nodeId2"], depth: 4)
```

**Depth guidance:**

- `2` — top-level frame + direct children (structure overview)
- `4` — full row anatomy (good for most audits)
- `6` — deeply nested compositions (large output — use sparingly)

---

## `get_guidelines`

```js
// List available guides and styles (index only)
get_guidelines()

// Load full guide content — MUST pass both category AND name (see SKILL.md §Tool API)
get_guidelines(category: "guide", name: "Web App")
get_guidelines(category: "guide", name: "Design System")
get_guidelines(category: "guide", name: "Mobile App")
get_guidelines(category: "guide", name: "Code")

// Load style content
get_guidelines(category: "style", name: "Dark Centered Platform")
```

---

## Icons

`icon_font` node type. Use `lucide` family (matches codebase's `lucide-react`).

```js
{ type: "icon_font", iconFontFamily: "lucide", iconFontName: "NAME", width: 16, height: 16, fill: "$cc--label-dim" }
```

### Common Lucide Icon Names

| Use case            | `iconFontName`    |
| ------------------- | ----------------- |
| Search              | `search`          |
| Settings / gear     | `settings`        |
| Plus / add          | `plus`            |
| Close / X           | `x`               |
| Check               | `check`           |
| Home                | `home`            |
| User / avatar       | `user`            |
| Folder              | `folder`          |
| Folder with dot     | `folder-dot`      |
| File                | `file`            |
| List rows           | `align-justify`   |
| Grid                | `layout-grid`     |
| Plug / plugin       | `plug`            |
| Bell / notification | `bell`            |
| Arrow right         | `arrow-right`     |
| Chevron down        | `chevron-down`    |
| Menu / hamburger    | `menu`            |
| Terminal            | `terminal`        |
| Git branch          | `git-branch`      |
| Code                | `code`            |
| Play                | `play`            |
| Pause               | `pause`           |
| Refresh             | `refresh-cw`      |
| External link       | `external-link`   |
| Copy                | `copy`            |
| Trash               | `trash-2`         |
| Edit / pencil       | `pencil`          |
| Download            | `download`        |
| Upload              | `upload`          |
| Filter              | `filter`          |
| Sort                | `arrow-up-down`   |
| More horizontal     | `more-horizontal` |
| More vertical       | `more-vertical`   |
| Loader / spinner    | `loader-2`        |
| Sidebar toggle      | `sidebar`         |
| Layers              | `layers`          |
| Zap / lightning     | `zap`             |
| Bot / AI            | `bot`             |
| Clock               | `clock`           |
| Calendar            | `calendar`        |

Other font families: `feather`, `Material Symbols Outlined`, `Material Symbols Rounded`, `Material Symbols Sharp`.

---

## Node Properties

> Property-level gotchas (stroke format, padding syntax, font names, visible:false) → see SKILL.md §Properties & Rendering.

### Common (all node types)

```js
{
  type: "frame" | "text" | "icon_font",  // REQUIRED on I()
  name: "...",          // optional label
  width: 120 | "fill_container" | "hug_contents",
  height: 40 | "fill_container" | "hug_contents",
  fill: "#hexcolor" | "$token-name",     // hex or token reference
  stroke: { fill: "#hexcolor" | "$token-name" },  // object — NOT a string, NOT {color, width}
  cornerRadius: 6,
  opacity: 1.0,
}
```

### Frame layout

```js
{
  type: "frame",
  layout: "vertical" | "horizontal",
  alignItems: "center" | "flex-start" | "flex-end",
  justifyContent: "center" | "flex-start" | "flex-end" | "space_between",
  gap: 8,
  padding: 16,                    // single value
  padding: [16, 20],              // [vertical, horizontal]
  padding: [16, 20, 16, 20],     // [top, right, bottom, left]
  // paddingTop etc → NOT valid; use padding array
}
```

### Text

```js
{
  type: "text",
  content: "Text string",        // NOT textContent (silently ignored)
  fontFamily: "Inter",            // exact string — "GeistMono" INVALID, use "Geist Mono"
  fontSize: 12,
  fontWeight: "normal" | "500" | "600" | "700",
  fill: "#f9f9f9" | "$cc--foreground",
  letterSpacing: 0.2,
  lineHeight: 1.4,
}
```

### Icon font

```js
{
  type: "icon_font",
  iconFontFamily: "lucide",       // NOT fontFamily
  iconFontName: "settings",
  width: 16,
  height: 16,
  fill: "#6a6b6c" | "$cc--label-dim",
  weight: 400,                    // Material Symbols only
}
```

---

## Layout Properties

### `fill_container` vs `hug_contents`

- `fill_container` — expands to fill parent (like `flex: 1`). **Requires parent to have `layout` set** — without it, renders at zero height.
- `hug_contents` — shrinks to fit content
- Number — fixed pixel value

### Common patterns

```js
// Status dot (circle indicator)
{ type: "frame", width: 6, height: 6, cornerRadius: 3, fill: "$cc--brand" }

// Divider line
{ type: "frame", width: "fill_container", height: 1, fill: "$cc--border" }

// Spacer (flex push to end)
{ type: "frame", width: "fill_container", height: 1 }
```

## snapshot_layout

Returns computed bounding boxes. Use to find insertion positions before adding nodes.

```js
snapshot_layout(); // whole canvas
// Then target specific nodeId to scope results
```
