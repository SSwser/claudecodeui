## Design -> Code

Pilot component: `Button`

Source files:
- `src/shared/view/ui/Button.tsx`
- `src/index.css`
- `tailwind.config.js`

Applied design contract:
1. Button variants consume semantic tokens instead of one-off colors.
2. Surface hierarchy introduced `surface-2` and `surface-3` so neutral actions can sit above the page canvas without inventing new ad hoc grays.
3. Link and surface variants were added to cover common Figma action states with the same primitive API.

## Code -> Design Delta

Observed deltas after implementation:
1. Existing product surfaces already relied on semantic tokens, so the pilot stayed within the current Tailwind + CSS variable system rather than introducing a standalone Button theme map.
2. The `surface` variant became the primary bridge between Figma neutral panels and the application shell, which means future component mocks should reference `surface-2` / `surface-3` instead of generic gray fills.
3. Hover and active states remain token-based opacity adjustments on top of the current product palette; they are intentionally conservative until broader Phase 999.2 visual unification work lands.

## Design Feedback For Next Round

1. Figma component specs should call out semantic token names alongside visual fills so code can map directly to `primary`, `secondary`, `surface-2`, and `surface-3`.
2. New primitive designs should specify whether the intent is `outline`, `surface`, or `ghost`, since those now map to materially different shell layers.
3. When a design depends on modal or dropdown layering, annotate whether it belongs on `surface-elevated`; that keeps dialog/select screenshots aligned with the same elevation model.

## Follow-up Mapping

High-frequency primitives to map next:
- `Input` -> `src/shared/view/ui/Input.tsx`
- `Dialog` -> `src/components/ui/dialog.tsx`
- `Select` -> `src/components/ui/select.tsx`