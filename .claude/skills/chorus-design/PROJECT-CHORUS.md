# Chorus Design — Project Adaptation

Use this file with [`SKILL.md`](./SKILL.md) when working on the Chorus design system.

---

## Canonical Files

| File                                                    | Role                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `design/tokens.json`                                    | Tokens Studio compatible token SSOT                                            |
| `design/TOKENS.md`                                      | Generated agent context artifact from `tokens.json`                            |
| `design/canvas.json`                                    | Machine-readable node index for top-level Pencil frames and component variants |
| `design/main.pen`                                       | Visual SSOT for composition, spacing, and component anatomy                    |
| `src/index.css`                                         | CSS variable bridge for light and dark theme values                            |
| `tailwind.config.js`                                    | Tailwind bridge from CSS variables to semantic utilities                       |
| `design/PRODUCT.md`                                     | Product-level design intent and UX constraints                                 |
| `DESIGN.md`                                             | Raw visual language reference and implementation detail                        |
| `.claude/skills/chorus-design/references/elevation.md`  | Surface level table, shadow recipes, semantic tinting rules                    |
| `.claude/skills/chorus-design/references/typography.md` | Full type scale, font families, OpenType settings                              |

---

## Token Namespace

- Pencil variable prefix: `cc--`
- Pencil token reference shape: `$cc--token-name`
- Active Pencil theme axis: `Mode: Dark`
- CSS token style: `--token-name`
- Tailwind style: semantic utilities like `bg-background`, `text-foreground`, `border-border`

---

## Token Mapping Reference

Hex values stay in `design/tokens.json`. This table exists only to bridge Pencil variables to CSS tokens and usage intent.

### Surface & Background

| Pencil Variable          | CSS Token            | Notes                        |
| ------------------------ | -------------------- | ---------------------------- |
| `$cc--background`        | `--background`       | alias of `$cc--surface-1`    |
| `$cc--surface-1`         | `--surface-1`        | app shell background         |
| `$cc--surface-2`         | `--surface-2`        | cards, selected rows         |
| `$cc--surface-3`         | `--surface-3`        | bars and toolbars            |
| `$cc--surface-elevated`  | `--surface-elevated` | popovers and modal shells    |
| `$cc--surface-container` | _(gap)_              | content container background |
| `$cc--surface-deep`      | _(gap)_              | deepest layer background     |
| `$cc--panel-bg`          | _(gap)_              | panel background             |
| `$cc--modal-bg`          | _(gap)_              | modal background             |
| `$cc--menu-bg`           | _(gap)_              | menu background              |
| `$cc--input-bg`          | _(gap)_              | input background             |
| `$cc--card-dark`         | _(gap)_              | dark card variant            |
| `$cc--overlay`           | _(gap)_              | overlay or scrim             |
| `$cc--skeleton-bg`       | _(gap)_              | skeleton placeholder         |
| `$cc--status-bar-bg`     | _(gap)_              | status bar background        |

### Text & Border

| Pencil Variable         | CSS Token            | Notes                         |
| ----------------------- | -------------------- | ----------------------------- |
| `$cc--foreground`       | `--foreground`       | primary text                  |
| `$cc--muted`            | `--muted`            | hover row background          |
| `$cc--muted-foreground` | `--muted-foreground` | muted text                    |
| `$cc--label-dim`        | _(gap)_              | section labels and idle icons |
| `$cc--border`           | `--border`           | default divider               |
| `$cc--sidebar-border`   | `--sidebar-border`   | sidebar divider               |

### Sidebar

| Pencil Variable       | CSS Token          | Notes                 |
| --------------------- | ------------------ | --------------------- |
| `$cc--sidebar-bg`     | `--sidebar-bg`     | sidebar background    |
| `$cc--sidebar-fg`     | `--sidebar-fg`     | sidebar foreground    |
| `$cc--sidebar-accent` | `--sidebar-accent` | active sidebar accent |

### Brand & Status

| Pencil Variable               | CSS Token                  | Notes                          |
| ----------------------------- | -------------------------- | ------------------------------ |
| `$cc--brand`                  | `--brand`                  | brand accent and waiting state |
| `$cc--primary`                | `--primary`                | primary action alias           |
| `$cc--brand-foreground`       | `--brand-foreground`       | text on brand                  |
| `$cc--primary-foreground`     | `--primary-foreground`     | text on primary                |
| `$cc--success`                | `--success`                | success state                  |
| `$cc--warning`                | `--warning`                | warning and running state      |
| `$cc--destructive`            | `--destructive`            | destructive action             |
| `$cc--destructive-foreground` | `--destructive-foreground` | text on destructive            |
| `$cc--status-waiting`         | `--brand`                  | waiting dot                    |
| `$cc--status-running`         | `--warning`                | running dot                    |
| `$cc--status-idle`            | `--muted-foreground`       | idle dot                       |
| `$cc--status-frozen`          | _(gap)_                    | frozen dot                     |
| `$cc--status-running-bg`      | _(gap)_                    | running background tint        |
| `$cc--status-error-bg`        | _(gap)_                    | error background tint          |
| `$cc--status-frozen-bg`       | _(gap)_                    | frozen background tint         |
| `$cc--user-msg-border`        | _(gap)_                    | user message border            |
| `$cc--frozen-notice-border`   | _(gap)_                    | frozen notice border           |

---

## Token Pipeline

```text
design/tokens.json
  → npm run build:tokens
  → design/TOKENS.md
  → src/index.css
  → tailwind.config.js
  → set_variables() in design/main.pen
```

Use two phases and keep them separate:

1. Define token metadata and bridges
2. Bind the resulting Pencil variables onto concrete canvas nodes

### Phase 1: Define token metadata

1. Edit `design/tokens.json`
2. Edit `src/index.css` if the token is consumed by runtime CSS
3. Edit `tailwind.config.js` if the token needs a semantic utility
4. Run `npm run build:tokens`
5. Open `design/main.pen` and update variables with `set_variables()`

### Phase 2: Bind tokens to nodes

1. Audit existing raw fills or strokes on target nodes
2. Use `batch_design U()` to bind `$cc--...` variables
3. Validate with `get_screenshot()`

Never use raw hex in React components or as a long-term Pencil fill once a token exists.

---

## Canvas Index Rules

- Update `design/canvas.json` when a top-level frame or component variant set changes
- Bump `$version` and `$updated` in the same edit
- Keep internal child nodes out of `canvas.json`; document them only when a brief truly needs them
- Query `canvas.json` directly rather than maintaining a second human-readable map
