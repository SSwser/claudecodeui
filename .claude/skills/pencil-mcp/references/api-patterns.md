# Pencil MCP — API Patterns Reference

## Table of Contents

1. [Operation Syntax (batch_design)](#operations)
2. [Icon Names](#icons)
3. [Node Properties](#node-properties)
4. [Layout Properties](#layout-properties)

---

## Operations

### `batch_design` — operation DSL

Each line is a separate operation. Bindings (`foo=I(...)`) are local to the call block.

```js
// Insert node into parent
foo=I("parentId", { ...props })

// Copy existing node into parent
bar=C("sourceNodeId", "parentId", { ...overrides })

// Replace node entirely (keeps node ID, replaces content)
baz=R("nodeId", { ...newProps })

// Update specific properties on existing node
U("nodeId", { height: 40, fill: "#07080a" })

// Delete node permanently
D("nodeId")

// Move node to different parent at index
M("nodeId", "newParentId", 2)

// Generate AI image into node
G("nodeId", "ai", "prompt text")

// Insert child at specific position using binding
srch=I("jSL2J", {type: "icon_font", ...})
M(srch, "jSL2J", 0)  // move to first position
```

### Path notation for descendants

```js
// Insert into a slot inside a previously-inserted component
parent = I('canvas', { type: 'ref', ref: 'componentId' });
child = I(parent + '/slotNodeId', { type: 'ref', ref: 'itemId' });
```

---

## Icons

`icon_font` node type. Use `lucide` family (matches codebase).

```js
{ type: "icon_font", iconFontFamily: "lucide", iconFontName: "NAME", width: 16, height: 16, fill: "#color" }
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

Other font families available: `feather`, `Material Symbols Outlined`, `Material Symbols Rounded`, `Material Symbols Sharp`.

---

## Node Properties

### Common properties for any node type

```js
{
  type: "frame" | "text" | "icon_font",
  id: "...",            // read-only from get
  name: "...",          // optional label
  width: 120 | "fill_container" | "hug_contents",
  height: 40 | "fill_container" | "hug_contents",
  fill: "#hexcolor",
  cornerRadius: 6,      // border radius
  // NOTE: visible: false is NOT a valid property in U() — use D() to remove nodes
  opacity: 1.0,
}
```

### Frame layout properties

```js
{
  type: "frame",
  layout: "vertical" | "horizontal",  // default: horizontal
  alignItems: "center" | "flex-start" | "flex-end",
  justifyContent: "center" | "flex-start" | "flex-end" | "space-between",
  gap: 8,
  padding: [top, right, bottom, left],  // or [vertical, horizontal] or single value
}
```

### Text properties

```js
{
  type: "text",
  content: "Text string",
  fontFamily: "Inter" | "Geist Mono",  // exact strings — "GeistMono" is INVALID
  fontSize: 12,
  fontWeight: "normal" | "600" | "700",
  fill: "#f9f9f9",
  letterSpacing: 0.2,
  lineHeight: 1.4,
}
```

### Icon font properties

```js
{
  type: "icon_font",
  iconFontFamily: "lucide",
  iconFontName: "settings",
  width: 16,
  height: 16,
  fill: "#6a6b6c",
  weight: 400,   // for Material Symbols only
}
```

---

## Layout Properties

### `fill_container` vs `hug_contents`

- `fill_container` — expands to fill parent (like `flex: 1` in CSS)
  - ⚠️ **Requires parent to have an explicit `layout: "horizontal"` or `"vertical"` property**. Without it, `fill_container` has no effect.
- `hug_contents` — shrinks to fit content
- Number — fixed pixel value

### Status dot (circle indicator)

```js
{ type: "frame", width: 6, height: 6, cornerRadius: 3, fill: "#FF6363" }
```

### Divider line

```js
{ type: "frame", width: "fill_container", height: 1, fill: "#161718" }
```

### Spacer (flex push to end)

```js
{ type: "frame", width: "fill_container", height: 1 }
```

---

## get_guidelines Reference

```js
// List available guides and styles (index only)
get_guidelines()

// Load full guide content — MUST pass both params
get_guidelines(category: "guide", name: "Web App")
get_guidelines(category: "guide", name: "Design System")
get_guidelines(category: "guide", name: "Mobile App")
get_guidelines(category: "guide", name: "Code")

// Load style content
get_guidelines(category: "style", name: "Dark Centered Platform")
```

---

## snapshot_layout

Returns computed bounding boxes. Use to find insertion positions before adding nodes.

```js
snapshot_layout(); // whole canvas
// Then target specific nodeId to scope results
```
