---
phase: 04-ui-migration
plan: '02'
subsystem: i18n-guardrails
tags:
  - i18n
  - docs
  - ci
requires: []
provides:
  - i18n naming convention and migration map for 7 namespaces
  - repository hardcoded string detection script with allowlist support
affects:
  - docs/i18n-key-migration-map.md
  - scripts/check-hardcoded-strings.cjs
  - package.json
tech_stack:
  added: []
  patterns:
    - documentation-first i18n migration
    - regex-based JSX text node scanning
key_files:
  created:
    - docs/i18n-key-migration-map.md
    - scripts/check-hardcoded-strings.cjs
  modified:
    - package.json
decisions:
  - Grouped large namespaces by stable subtree instead of enumerating every leaf key in the migration map.
  - Kept the i18n gate dependency-free and filesystem-only for CI portability.
metrics:
  completed_at: 2026-04-11
  tasks_completed: 2
  commits: 2
---

# Phase 04 Plan 02: i18n Mapping And CI Guard Summary

Defined the i18n naming convention and migration reference for all loaded English namespaces, then added a repo-local gate that reports hardcoded JSX UI strings through `lint:i18n`.

## Task Results

| Task | Status   | Commit  | Notes                                                                           |
| ---- | -------- | ------- | ------------------------------------------------------------------------------- |
| 1    | Complete | ed57346 | Added naming convention, grouped key inventory, and migration strategy document |
| 2    | Complete | 2d6499b | Added hardcoded JSX string checker and `lint:i18n` package script               |

## Verification

- `Test-Path docs/i18n-key-migration-map.md` satisfied by file creation and commit.
- `node scripts/check-hardcoded-strings.cjs` ran successfully and exited `1` after reporting 86 existing violations.
- `npm run lint:i18n` resolved to the new script and exited `1` with the same violation inventory.
- The checker no longer reports the earlier TypeScript generic false positives after narrowing detection to same-line JSX text nodes.

## Deviations from Plan

None.

## Decisions Made

- Used grouped subtree rows for `chat`, `common`, and `settings` to keep the mapping document maintainable while still covering every namespace.
- Treated currently discovered hardcoded UI strings as baseline findings for later migration plans rather than auto-fixing them in this documentation and guardrail plan.

## Known Stubs

None.

## Self-Check: PASSED

- Summary file created.
- Verified commits `ed57346` and `2d6499b` exist.
