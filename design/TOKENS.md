# ClaudeCodeUI — Design Token Reference

**Role**: Single source of truth for color implementation. Resolves Pencil-origin hex values to CSS tokens and Tailwind classes.  
**Maintained in**: `design/TOKENS.md` (repo root)  
**Last updated**: 2026-04-13

> **Implementation rule**: always use the **CSS token** or **Tailwind class** column when writing code.  
> Hex values are Pencil wireframe references only — hex values in production code are a bug.

---

## Core Color Tokens

| Role                            | Hex (Pencil)  | CSS token            | Tailwind class                |
| ------------------------------- | ------------- | -------------------- | ----------------------------- |
| App background                  | `#07080a`     | `--background`       | `bg-background`               |
| Primary text                    | `#f9f9f9`     | `--foreground`       | `text-foreground`             |
| Idle / muted text               | `#6a6b6c`     | `--muted-foreground` | `text-muted-foreground`       |
| Selected row / elevated surface | `#101111`     | `--surface-2`        | `bg-surface-2`                |
| Hover row bg / border chip bg   | `#1b1c1e`     | `--muted`            | `bg-muted`                    |
| Divider / border                | `#161718`     | `--border`           | `bg-border` / `border-border` |
| Left selected bar bg            | `#252627`     | `--surface-3`        | —                             |
| **Section labels / dim icons**  | **`#434345`** | **⚠️ no token yet**  | `text-[#434345]` (temp)       |

> **`#434345` gap**: Used for section labels (`PROJECT`, `RECENT`), chevrons, and search placeholder. It is darker than `--muted-foreground` (≈`#9b9ba0` in dark mode). A `--label` or `--icon-dim` token should be added to `src/index.css` before widespread use. Until then, use `text-[#434345]` as a temporary escape hatch, and flag it with a `// TODO: replace with CSS token` comment.

---

## Semantic / Status Color Tokens

| Role                                           | Hex (Pencil) | CSS token               | Tailwind class              |
| ---------------------------------------------- | ------------ | ----------------------- | --------------------------- |
| Brand / Waiting / Error                        | `#FF6363`    | `--brand` / `--primary` | `text-brand` `bg-brand`     |
| Running / Warning / Accent                     | `#fbbf24`    | `--warning`             | `text-warning` `bg-warning` |
| Success (legacy — retired from status dot use) | `#5fc992`    | `--success`             | `text-success`              |

---

## Elevation / Surface Border Tokens

These token names correspond to the 6-level elevation system in [`PRODUCT.md §6.3`](./PRODUCT.md#63-surface-elevation-system).

| Role                                     | Hex (Pencil)                  | CSS token           | Tailwind class       |
| ---------------------------------------- | ----------------------------- | ------------------- | -------------------- |
| Level 1 divider edge                     | `#1b1c1e`                     | `--border`          | `border-border`      |
| Level 2 card ring (outer)                | `#1b1c1e`                     | `--ring`            | `ring-1 ring-border` |
| Level 2 inner highlight                  | `rgba(255,255,255,0.05)`      | `--highlight-inner` | —                    |
| Level 3 input / card stroke              | `rgba(255,255,255,0.06)–0.10` | `--border-subtle`   | `border-border/60`   |
| Level 3 user msg border (blue tint)      | `#1d3550`                     | —                   | `border-[#1d3550]`   |
| Level 3 frozen notice border (blue tint) | `#2a3550`                     | —                   | `border-[#2a3550]`   |
| Level 4–5 overlay border                 | `rgba(255,255,255,0.06)`      | `--border-overlay`  | —                    |
| Level 5 modal drop shadow                | `rgba(0,0,0,0.50)`            | —                   | `shadow-xl`          |

---

## Status-Semantic Tints on Level 2 Cards

Session card rings use status-tinted variants at Level 2 to communicate state at a glance:

| Session state       | Ring color                  | Notes                               |
| ------------------- | --------------------------- | ----------------------------------- |
| `Running`           | `#1e2018` (green-warm dark) | Subtle green tint on the outer ring |
| `Waiting` / `Error` | `#201818` (red-warm dark)   | Subtle red tint on the outer ring   |
| `Idle` / `Frozen`   | `#1b1c1e`                   | Standard neutral ring               |

---

## Session Status Dot — Color Reference

See [`PRODUCT.md §4.1`](./PRODUCT.md#41-session-status--semantic-color-rules) for the full rules. Quick reference:

| State                | Dot color             | Token                |
| -------------------- | --------------------- | -------------------- |
| Waiting (needs user) | `#FF6363`             | `--brand`            |
| Running (autonomous) | `#fbbf24`             | `--warning`          |
| Idle / Fresh         | `#6a6b6c`             | `--muted-foreground` |
| Frozen               | dim blue (≈`#4a6fa5`) | no token yet         |
