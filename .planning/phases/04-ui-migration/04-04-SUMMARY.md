---
phase: 04-ui-migration
plan: "04"
subsystem: visual-regression
tags:
  - playwright
  - visual-regression
  - figma
requires: []
provides:
  - playwright visual baseline tooling for phase 4 surfaces
  - figma design-to-code pilot roundtrip note for Button
affects:
  - playwright.config.ts
  - tests/visual/baseline.spec.ts
  - docs/figma/figma-pilot-roundtrip.md
  - package.json
  - .gitignore
tech_stack:
  added:
    - @playwright/test
  patterns:
    - page-level screenshot baselines with conditional shell coverage
    - local snapshot generation ignored from git history
key_files:
  created:
    - playwright.config.ts
    - tests/visual/baseline.spec.ts
    - docs/figma/figma-pilot-roundtrip.md
  modified:
    - package.json
    - package-lock.json
    - .gitignore
    - src/components/sidebar/view/subcomponents/SidebarContent.tsx
    - src/components/ui/dialog.tsx
decisions:
  - Used the current app entry route `/` for visual baselines instead of inventing unsupported `/login` or `/settings` routes.
  - Added non-breaking `data-testid` hooks on the sidebar surface and dialog trigger to support visual capture.
  - Kept shell-dependent tests conditional so auth-state differences do not crash the baseline run.
metrics:
  completed_at: 2026-04-11
  tasks_completed: 2
  commits: 1
---

# Phase 04 Plan 04: Visual Regression And Figma Pilot Summary

Configured Playwright visual regression coverage for Phase 4 surfaces, captured initial local baselines, and documented the Button design-to-code pilot roundtrip.

## Task Results

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| 1 | Complete | da8f247 | Added Playwright config, baseline spec, npm scripts, gitignore entries, test hooks, and Figma pilot document |
| 2 | Complete | human-approved | Human verification approved after baseline generation and comparison run |

## Verification

- `npm run typecheck` passed after adding Playwright configuration and visual test files.
- `npm run build` passed.
- `npm run test:visual -- --list` discovered 6 visual regression tests.
- With `BASE_URL=http://localhost:4001`, `npm run test:visual:update` passed with `2 passed, 4 skipped` and wrote local baselines.
- With the same base URL, `npm run test:visual` passed with `2 passed, 4 skipped`.
- Human verification result: approved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted visual baseline routes to the current app entrypoints**
- **Found during:** Task 1 implementation
- **Issue:** The plan examples referenced `/login` and `/settings` routes that do not exist in the current router; forcing those routes would only produce 404 or unrelated states.
- **Fix:** Baselines were adapted to the existing `/` route, with shell-only screenshots gated by real UI availability and `data-testid` hooks.
- **Files modified:** `playwright.config.ts`, `tests/visual/baseline.spec.ts`, `src/components/sidebar/view/subcomponents/SidebarContent.tsx`, `src/components/ui/dialog.tsx`
- **Commit:** da8f247

### Auth Gates

None. The local environment already had a usable backend on port `3001`, and the front-end verification run used `http://localhost:4001` successfully.

## Decisions Made

- Snapshot files remain gitignored as planned; the generated local baselines were used only for verification.
- Settings, sidebar, chat shell, and dialog screenshots are configured as conditional captures so the suite remains stable across logged-out and logged-in environments.

## Known Stubs

None.

## Self-Check: PASSED

- Summary file created.
- Verified commit `da8f247` exists.