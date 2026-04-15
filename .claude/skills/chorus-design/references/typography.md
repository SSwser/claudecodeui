# Typography Reference — Chorus

> Source: `DESIGN.md §3` (Raycast typography rules).
> Specimens and exact values live here; `PRODUCT.md §6.2` only carries a summary pointer.

---

## Font Families

| Role      | Family        | Fallbacks                                                          | Usage                           |
| --------- | ------------- | ------------------------------------------------------------------ | ------------------------------- |
| Primary   | `Inter`       | `Inter Fallback`, system sans-serif                                | All UI copy                     |
| System    | `SF Pro Text` | `SF Pro Icons`, `Inter`, `Inter Fallback`                          | Select macOS-native UI elements |
| Monospace | `GeistMono`   | `ui-monospace`, `SFMono-Regular`, `Roboto Mono`, `Menlo`, `Monaco` | Code blocks, terminal output    |

**OpenType features** (globally enabled): `calt`, `kern`, `liga`, `ss03`
**Display text**: additionally `ss02`, `ss08`
**Hero headings**: `"liga" 0` (liga disabled)

---

## Type Scale

| Role            | Size             | Weight | Line Height | Letter Spacing | Notes                               |
| --------------- | ---------------- | ------ | ----------- | -------------- | ----------------------------------- |
| Display Hero    | 64px             | 600    | 1.10        | 0px            | OpenType: liga 0, ss02, ss08        |
| Section Display | 56px             | 400    | 1.17        | 0.2px          | OpenType: calt, kern, liga, ss03    |
| Section Heading | 24px             | 500    | normal      | 0.2px          | OpenType: calt, kern, liga, ss03    |
| Card Heading    | 22px             | 400    | 1.15        | 0px            | OpenType: calt, kern, liga, ss03    |
| Sub-heading     | 20px             | 500    | 1.60        | 0.2px          | Relaxed line-height for readability |
| Body Large      | 18px             | 400    | 1.15        | 0.2px          | OpenType: calt, kern, liga, ss03    |
| Body            | 16px             | 500    | 1.60        | 0.2px          | Primary body text, relaxed rhythm   |
| Body Tight      | 16px             | 400    | 1.15        | 0.1px          | UI labels, compact contexts         |
| Button          | 16px             | 600    | 1.15        | 0.3px          | Semibold, slightly wider tracking   |
| Nav Link        | 16px             | 500    | 1.40        | 0.3px          | Links in navigation                 |
| Caption         | 14px             | 500    | 1.14        | 0.2px          | Small labels, metadata              |
| Caption Bold    | 14px             | 600    | 1.40        | 0px            | Emphasized captions                 |
| Small           | 12px             | 600    | 1.33        | 0px            | Badges, tags, micro-labels          |
| Small Link      | 12px             | 400    | 1.50        | 0.4px          | Footer links, fine print            |
| Code            | 14px (GeistMono) | 500    | 1.60        | 0.3px          | Code blocks, technical content      |
| Code Small      | 12px (GeistMono) | 400    | 1.60        | 0.2px          | Inline code, terminal output        |

---

## Principles

- **Positive tracking on dark**: +0.2px to +0.4px letter-spacing creates an airy, readable feel on dark backgrounds — compensates for the dark surface absorbing contrast
- **Weight 500 as baseline**: most body text uses medium weight (not regular 400) — subtle extra heft improves legibility on dark surfaces
- **Display restraint**: 64px/600 is confident but not oversized — avoid typographic spectacle in favor of functional elegance
- **OpenType everywhere**: `ss03` globally enabled across Inter gives a slightly more geometric, tool-like quality
