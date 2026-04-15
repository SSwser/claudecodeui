# Elevation & Depth Reference — Chorus

> Source: `DESIGN.md §6` (Raycast shadow recipes) + `PRODUCT.md §6.3` (surface-level semantic rules).
> This file is the authoritative reference for elevation decisions. `PRODUCT.md §6.3` only carries a pointer here.

---

## Surface Level Table

| Level | Surface type                                                               | Stroke treatment                                                           | Shadow treatment                                                                |
| ----- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **0** | Base canvas / app background                                               | None                                                                       | None                                                                            |
| **1** | Layout dividers (sidebar right edge, header bottom, tab bottom, input top) | Directional 1px `border-divider` on the separating edge only               | None                                                                            |
| **2** | Cards, AI message bubbles, component containers                            | 1px inside stroke `border-subtle`                                          | Outer ring `ring-outer` 0px 0px 0px 1px + inner highlight 0px 1px 0px 0px inset |
| **3** | Interactive surfaces (user message bubbles, input boxes, CTA cards)        | 1px inside stroke; tinted where semantic (blue for user, white for inputs) | Drop shadow `shadow-sm` + inner highlight                                       |
| **4** | Elevated floaters (preview panels, context menus)                          | 1px inside stroke `border-overlay`                                         | Outer ring + ambient drop shadow `shadow-md`                                    |
| **5** | Modal / dialog overlays                                                    | 1px inside stroke `border-overlay`                                         | Outer ring + heavy drop shadow `shadow-xl` (0px 16px 48px) + inner highlight    |

**Key rules:**

- Never raise `background-color` to signal elevation — use ring + shadow only (the dark void must stay dark)
- Semantic tinting at Level 3: user message bubbles → blue-tinted border; frozen notices → blue-tinted inner shadow
- Status-semantic tinting on Level 2 cards: running sessions → green-tinted ring; waiting/errored → red-tinted ring

---

## Raycast Shadow Recipes (DESIGN.md §6)

| Level              | Treatment                                                                                                                                     | Use                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Level 0 (Void)     | No shadow, `#07080a` surface                                                                                                                  | Page background                                                    |
| Level 1 (Subtle)   | `rgba(0, 0, 0, 0.28) 0px 1.189px 2.377px`                                                                                                     | Minimal lift, inline elements                                      |
| Level 2 (Ring)     | `rgb(27, 28, 30) 0px 0px 0px 1px` outer + `rgb(7, 8, 10) 0px 0px 0px 1px inset` inner                                                         | Card containment, double-ring technique                            |
| Level 3 (Button)   | `rgba(255, 255, 255, 0.05) 0px 1px 0px 0px inset` + `rgba(255, 255, 255, 0.25) 0px 0px 0px 1px` + `rgba(0, 0, 0, 0.2) 0px -1px 0px 0px inset` | macOS-native button press — white highlight top, dark inset bottom |
| Level 4 (Key)      | 5-layer shadow stack with inset press effects                                                                                                 | Keyboard shortcut key caps — physical 3D appearance                |
| Level 5 (Floating) | `rgba(0, 0, 0, 0.5) 0px 0px 0px 2px` + `rgba(255, 255, 255, 0.19) 0px 0px 14px` + insets                                                      | Command palette, floating panels — heavy depth with glow           |

### Shadow Philosophy

Multi-layer shadows combine:

- **Outer rings** — containment, replacing traditional borders
- **Inset top highlights** (`rgba(255, 255, 255, 0.05–0.25)`) — light source from above
- **Inset bottom darks** (`rgba(0, 0, 0, 0.2)`) — shadow from underneath

The effect is physical: elements feel like glass or brushed metal, not flat rectangles.

---

## Card Shadow (Level 2 Ring) — CSS Recipe

All card-type containers (session cards, AI message bubbles, skeleton loaders) use Level 2 Ring as baseline:

```css
box-shadow:
  0 0 0 1px rgb(27, 28, 30),
  /* outer ring — dark containment */ inset 0 0 0 1px rgb(7, 8, 10),
  /* inner ring — void edge */ inset 0 1px 0 0 rgba(255, 255, 255, 0.05); /* top highlight — light source */
border: 1px solid rgba(255, 255, 255, 0.02); /* near-invisible stroke */
```

Stroke alpha by interaction state:

| State    | Stroke Alpha | Hex         | Rationale                   |
| -------- | ------------ | ----------- | --------------------------- |
| Default  | 2%           | `#ffffff05` | Nearly invisible, ring-only |
| Archived | 1%           | `#ffffff03` | Dimmer than default         |
| Hover    | 4%           | `#ffffff0a` | Subtle brightness on hover  |
| Selected | 8%           | `#ffffff14` | Clear selection indicator   |

Elements **not** using Level 2 Ring:

- **Dragging cards**: heavy blur + brand color glow for drag-lift feedback
- **Context menus**: deep blur shadow for floating layer emphasis
- **User message bubbles**: blue-tinted stroke (`#1d3550`) with blur shadow
- **Overlay panels**: Level 5 (Floating) with heavy depth + glow

---

## Decorative Depth

- **Warm glow**: `rgba(215, 201, 175, 0.05) 0px 0px 20px 5px` — subtle warm aura behind featured elements
- **Blue info glow**: `rgba(0, 153, 255, 0.15)` — interactive state emphasis
- **Red danger glow**: `rgba(255, 99, 99, 0.15)` — error/destructive state emphasis
