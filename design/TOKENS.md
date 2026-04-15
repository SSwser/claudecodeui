# Design Tokens Reference

> **AI context injection artifact** — auto-generated from `design/tokens.json`. Do not edit manually.
> Run `npm run build:tokens` to regenerate.

### Core Colors

| Pencil Hex | CSS Token            | Tailwind                | Description                   |
| ---------- | -------------------- | ----------------------- | ----------------------------- |
| #07080a    | `--background`       | `bg-background`         | App background                |
| #f9f9f9    | `--foreground`       | `text-foreground`       | Primary text                  |
| #1b1c1e    | `--muted`            | `bg-muted`              | Hover row bg / border chip bg |
| #6a6b6c    | `--muted-foreground` | `text-muted-foreground` | Idle / muted text             |
| #161718    | `--border`           | `border-border`         | Divider / border              |
| —          | `--ring`             | `ring-ring`             | Focus ring                    |
| —          | `--input`            | —                       | Input border                  |

### Brand Colors

| Pencil Hex | CSS Token              | Tailwind                    | Description                     |
| ---------- | ---------------------- | --------------------------- | ------------------------------- |
| #FF6363    | `--brand`              | `bg-brand / text-brand`     | Brand / Waiting / Error accent  |
| #ffffff    | `--brand-foreground`   | `text-brand-foreground`     | Text on brand color             |
| #FF6363    | `--primary`            | `bg-primary / text-primary` | Primary action (alias of brand) |
| #ffffff    | `--primary-foreground` | `text-primary-foreground`   | Text on primary                 |

### Semantic Colors

| Pencil Hex | CSS Token                  | Tailwind                      | Description                |
| ---------- | -------------------------- | ----------------------------- | -------------------------- |
| #5fc992    | `--success`                | `text-success`                | Success state              |
| —          | `--success-foreground`     | `text-success-foreground`     | Text on success            |
| #e5a700    | `--warning`                | `text-warning / bg-warning`   | Running / Warning / Accent |
| —          | `--warning-foreground`     | `text-warning-foreground`     | Text on warning            |
| #FF6363    | `--destructive`            | `bg-destructive`              | Destructive action         |
| #ffffff    | `--destructive-foreground` | `text-destructive-foreground` | Text on destructive        |

### Surface Colors

| Pencil Hex | CSS Token                | Tailwind                    | Description                                                  |
| ---------- | ------------------------ | --------------------------- | ------------------------------------------------------------ |
| —          | `--card`                 | `bg-card`                   | Card background                                              |
| —          | `--card-foreground`      | `text-card-foreground`      | Card text                                                    |
| —          | `--popover`              | `bg-popover`                | Popover background                                           |
| —          | `--popover-foreground`   | `text-popover-foreground`   | Popover text                                                 |
| —          | `--secondary`            | `bg-secondary`              | Secondary backgrounds                                        |
| —          | `--secondary-foreground` | `text-secondary-foreground` | Secondary text                                               |
| —          | `--accent`               | `bg-accent`                 | Accent backgrounds                                           |
| —          | `--accent-foreground`    | `text-accent-foreground`    | Accent text                                                  |
| #07080a    | `--surface-1`            | `bg-surface-1`              | Surface level 1 (app shell)                                  |
| #101111    | `--surface-2`            | `bg-surface-2`              | Surface level 2 (selected row / elevated)                    |
| #252627    | `--surface-3`            | `bg-surface-3`              | Surface level 3 (bar bg)                                     |
| #1b1c1e    | `--surface-elevated`     | `bg-surface-elevated`       | Elevated surface (popovers, modals shell)                    |
| #0d0e11    | `--surface-inset`        | `bg-surface-inset`          | Inset surface — embedded inputs, filter bar, tab bar inners  |
| #111214    | `--surface-container`    | `bg-surface-container`      | Container surface — StatusBar, Drawer/Panel, bottom sheets   |
| #1c1e22    | `--surface-popup`        | `bg-surface-popup`          | Popup surface — ContextMenu, dropdown menus                  |
| #0e0f16    | `--overlay-bg`           | `bg-overlay`                | Deep overlay background — Search Modal, full-screen overlays |

### Sidebar Colors

| Pencil Hex | CSS Token          | Tailwind                  | Description        |
| ---------- | ------------------ | ------------------------- | ------------------ |
| #07080a    | `--sidebar-bg`     | `bg-sidebar`              | Sidebar background |
| #f9f9f9    | `--sidebar-fg`     | `text-sidebar-foreground` | Sidebar text       |
| #161718    | `--sidebar-border` | `border-sidebar-border`   | Sidebar border     |
| #FF6363    | `--sidebar-accent` | `bg-sidebar-accent`       | Sidebar accent     |

### Status Colors

| Pencil Hex | CSS Token             | Tailwind                | Description                                      |
| ---------- | --------------------- | ----------------------- | ------------------------------------------------ |
| #FF6363    | `--brand`             | `text-brand`            | Waiting (needs user) dot                         |
| #e5a700    | `--warning`           | `text-warning`          | Running (autonomous) dot                         |
| #6a6b6c    | `--muted-foreground`  | `text-muted-foreground` | Idle / Fresh dot                                 |
| #4a6fa5    | `--status-frozen`     | `text-status-frozen`    | Frozen dot                                       |
| #1a2e1a    | `--status-running-bg` | `bg-status-running-bg`  | Running session card background tint (green)     |
| #2e1a1a    | `--status-error-bg`   | `bg-status-error-bg`    | Error/waiting session card background tint (red) |
| #1a1c2a    | `--status-frozen-bg`  | `bg-status-frozen-bg`   | Frozen session card background tint (blue)       |

### Elevation Colors

| Pencil Hex | CSS Token                | Tailwind                      | Description                             |
| ---------- | ------------------------ | ----------------------------- | --------------------------------------- |
| #1e2018    | —                        | —                             | Running session card ring tint          |
| #201818    | —                        | —                             | Waiting/Error session card ring tint    |
| #1d3550    | `--user-msg-border`      | `border-user-msg-border`      | User message border (blue tint)         |
| #2a3550    | `--frozen-notice-border` | `border-frozen-notice-border` | Frozen notice border (blue-indigo tint) |

### Gaps Colors

| Pencil Hex | CSS Token     | Tailwind         | Description                                                    |
| ---------- | ------------- | ---------------- | -------------------------------------------------------------- |
| #434345    | `--label-dim` | `text-label-dim` | Section labels (PROJECT, RECENT), chevrons, search placeholder |

### Border Radius

| Name   | Value | CSS Token         | Tailwind        |
| ------ | ----- | ----------------- | --------------- |
| micro  | 3px   | `--radius-micro`  | `rounded-micro` |
| small  | 6px   | `--radius-small`  | `rounded-sm`    |
| medium | 8px   | `--radius-medium` | `rounded-md`    |
| large  | 16px  | `--radius-large`  | `rounded-lg`    |
| pill   | 86px  | `--radius-pill`   | `rounded-pill`  |

### Font Size

| Name | Size | Line Height | CSS Token     |
| ---- | ---- | ----------- | ------------- |
| xs   | 12px | 1rem        | `--text-xs`   |
| sm   | 14px | 1.25rem     | `--text-sm`   |
| base | 16px | 1.5rem      | `--text-base` |
| lg   | 18px | 1.75rem     | `--text-lg`   |
| xl   | 22px | 1.75rem     | `--text-xl`   |
| 2xl  | 24px | 2rem        | `--text-2xl`  |

### Font Weight

| Name     | Value | CSS Token                |
| -------- | ----- | ------------------------ |
| normal   | 500   | `--font-weight-normal`   |
| medium   | 500   | `--font-weight-medium`   |
| semibold | 600   | `--font-weight-semibold` |
| bold     | 700   | `--font-weight-bold`     |

### Letter Spacing

| Name    | Value | CSS Token            |
| ------- | ----- | -------------------- |
| body    | 0.2px | `--tracking-body`    |
| ui      | 0.3px | `--tracking-ui`      |
| display | 0.2px | `--tracking-display` |
| code    | 0.3px | `--tracking-code`    |

### Spacing Scale

| Name | Value | CSS Token      |
| ---- | ----- | -------------- |
| 1    | 4px   | `--spacing-1`  |
| 2    | 8px   | `--spacing-2`  |
| 3    | 12px  | `--spacing-3`  |
| 4    | 16px  | `--spacing-4`  |
| 5    | 20px  | `--spacing-5`  |
| 6    | 24px  | `--spacing-6`  |
| 8    | 32px  | `--spacing-8`  |
| 10   | 40px  | `--spacing-10` |
| 12   | 48px  | `--spacing-12` |
| 16   | 64px  | `--spacing-16` |
| 20   | 80px  | `--spacing-20` |
| 24   | 96px  | `--spacing-24` |
| 32   | 128px | `--spacing-32` |
| 40   | 160px | `--spacing-40` |
