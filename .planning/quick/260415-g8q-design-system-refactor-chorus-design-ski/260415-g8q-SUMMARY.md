# Quick Task 260415-g8q Summary

## Goal

Refactor the Chorus design-system structure around a portable `chorus-design` skill, a Tokens Studio compatible token registry, and a cleaner boundary between generic design-system guidance and Pencil-specific workflow.

## Completed

1. Added a new reusable skill at `.claude/skills/chorus-design/`.
   - `SKILL.md` defines the generic design-system workflow.
   - `PROJECT-CHORUS.md` captures Chorus-specific paths, token namespace, token mappings, and canvas rules.
   - `scripts/build-tokens.template.cjs` provides a portable template for derived token-doc generation.

2. Rebalanced the existing Pencil adaptation.
   - `.claude/skills/pencil-mcp/PROJECT-CHORUS.md` now stays Pencil-specific.
   - Token mappings and token sync workflow were moved behind explicit references to the new `chorus-design` skill.
   - Direct hex duplication was removed from active guidance.

3. Migrated `design/tokens.json` to a Tokens Studio compatible schema.
   - Root moved to `global.*` sections.
   - Color tokens now use `$value`, `$type`, `$description`, and `$extensions.com.chorus.design`.
   - Radius, typography, and spacing tokens were also migrated into token-node form.
   - Existing bridge metadata (`pencilHex`, `css`, `tailwind`, `light`, `dark`, `lineHeight`) was preserved in the extension namespace.

4. Updated the token build pipeline.
   - `scripts/build-tokens.cjs` now reads the new schema.
   - `design/TOKENS.md` regenerates correctly and remains an AI context artifact.

5. Tightened design-document boundaries.
   - `design/PRODUCT.md` now positions Section 6 as product-level visual intent.
   - Raw visual implementation detail remains delegated to `DESIGN.md` and generated token artifacts.

## Already True On This Branch

The current branch already had the simplified canvas setup in place before this quick task finished:

- `design/canvas.json` already existed as the active machine-readable canvas index.
- `design/CANVAS-MAP.md` was already absent.
- `scripts/build-canvas-map.cjs` was already absent.
- `package.json` already had no `build:canvas` script.

Because of that, the quick task normalized the surrounding docs instead of performing a live rename/delete in this branch.

## Validation

- Ran `npm run build:tokens`
- Verified regenerated `design/TOKENS.md`
- Ran markdown/file diagnostics on modified skill and product docs
- Confirmed no active-file references remain to `main.pen.index`, `CANVAS-MAP.md`, or `build:canvas` outside the quick-task plan artifact

## Code Commits

- `e184e6c` `docs(design): add chorus-design skill boundary`
- `c08504b` `style(design): migrate token registry format`
