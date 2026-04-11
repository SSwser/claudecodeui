# Phase 4: UI Migration - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase standardizes the application on a modern component-library workflow, completes the theme token foundation required for migration, audits and restructures i18n usage, and adds migration guardrails in CI and visual regression coverage. The scope is UI migration infrastructure and migration rules, not a full product rewrite and not a full brand-wide visual redesign.

</domain>

<decisions>
## Implementation Decisions

### Component Migration Boundary

- **D-01:** Phase 4 should aggressively reduce the old base-component layer instead of leaving indefinite dual-track ownership.
- **D-02:** The aggressive migration is still bounded to foundational interactive primitives first: `Button`, `Input`, `Dialog`, `Select`, `Badge`, and equivalent base controls.
- **D-03:** Feature-level presentation components are not part of the first cleanup wave unless they are directly required by the primitive migration.

### Theme Token Scope

- **D-04:** Phase 4 should expand the CSS variable / semantic token system beyond colors to cover themeable surfaces, borders, radius, spacing, and typography.
- **D-05:** Phase 4 should absorb `DESIGN.md` at the token layer and for base component appearance, but not treat full Raycast-style product-wide visual unification as part of this phase.
- **D-06:** The migration must keep a semantic token model and must not introduce a second token system parallel to the existing Tailwind + CSS variable setup.

### i18n Migration And CI Guardrails

- **D-07:** i18n keys may be renamed, but the migration should define the new naming convention first and then replace keys progressively as components and screens are migrated.
- **D-08:** The team should maintain a mapping document from old translation keys to the new structure during the transition instead of trying to flip the whole repository in one pass.
- **D-09:** CI should block newly introduced hardcoded UI strings with a custom lint/script gate that supports a controlled allowlist rather than waiting for perfect ESLint-only enforcement.

### Visual Regression Strategy

- **D-10:** Visual regression testing should start with page-level screenshots instead of component-only baselines.
- **D-11:** Initial screenshot coverage should include every page touched by the Phase 4 migration, not just a single pilot page.
- **D-12:** Global UI shell surfaces such as tab strip, shell layout, and dialogs are part of the regression surface because primitive migration changes can cascade there.

### Figma And Design Workflow

- **D-13:** All migration work in this phase should follow the repository Figma integration rules and checklist in `docs/figma/*`.
- **D-14:** Phase 4 should include one pilot roundtrip record for Design -> Code -> Design delta -> Code and a starter mapping list for high-frequency primitives.
- **D-15:** Figma roundtrip is a required pilot workflow for this phase, but not a hard requirement for every migrated screen.

### the agent's Discretion

- Choice of the exact visual regression toolchain and screenshot runner
- Exact naming convention details for the new i18n key structure
- Sequencing of which migrated screens happen first, as long as foundational primitives are prioritized
- How compatibility wrappers are removed incrementally while preserving a single outward migration path

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements And Prior Decisions

- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, entry gate, and support backlog for UI migration
- `.planning/REQUIREMENTS.md` — `UI-01` through `UI-07` requirement definitions
- `.planning/PROJECT.md` — project constraints, progressive migration rule, and v1 UI migration intent
- `.planning/STATE.md` — current project status and Phase 4 research flag about Tailwind + shadcn conflicts / visual regression
- `.planning/phases/01-foundation/01-CONTEXT.md` — prior locked decision that `shadcn/ui` is the component-library direction and migration should be progressive

### Figma Workflow Guardrails

- `docs/figma/INTEGRATION-RULES.md` — repository rules for token usage, component reuse, asset placement, and feature-folder ownership
- `docs/figma/FIGMA-TO-CODE-CHECKLIST.md` — implementation checklist for migrated UI work
- `docs/figma/MCP-CODE-CONNECT-WORKFLOW.md` — roundtrip and Code Connect workflow expectations for Phase 4

### Visual Direction

- `DESIGN.md` — token and base-component visual reference to borrow from selectively in Phase 4 without turning full visual unification into current scope

[If additional specs are introduced during planning, they should be appended here before execution.]

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/ui/button.tsx` and the parallel `input`, `dialog`, `select` wrappers — current outward-compatible entrypoint for shadcn-style primitives
- `src/shared/view/ui/Button.tsx` and sibling primitives — current base implementation layer that migration will need to shrink or replace
- `src/i18n/config.js` — existing i18next namespace/resource wiring across `common`, `settings`, `auth`, `sidebar`, `chat`, `codeEditor`, `tasks`
- `src/index.css` — existing CSS variable definitions including semantic colors, radius, nav tokens, and safe-area variables
- `tailwind.config.js` — current semantic `hsl(var(--token))` bridge for Tailwind usage
- `eslint.config.js` — current lint baseline where new hardcoded-string enforcement will need to integrate

### Established Patterns

- Tailwind-first styling with semantic CSS variables is already the repository standard
- Shared primitives use `class-variance-authority` and `cn()` composition patterns
- Feature UI remains feature-folder owned, with `src/components/ui/` acting as a thin primitive access layer
- i18n already uses namespace JSON files plus `react-i18next`; migration should build on that instead of replacing the runtime stack

### Integration Points

- Primitive migration will center on `src/components/ui/`, `src/shared/view/ui/`, and the high-traffic consumers already importing from `src/components/ui/*`
- Token expansion will primarily affect `src/index.css`, `tailwind.config.js`, and any primitive classes that still encode spacing/typography inline
- i18n restructuring will affect `src/i18n/`, component call sites using `useTranslation`, and CI/lint integration for string enforcement
- Visual regression will need to plug into existing package scripts / CI workflow from `package.json`

</code_context>

<specifics>
## Specific Ideas

- Preserve the core chat / conversation experience while modernizing the shared UI layer around it.
- Treat `DESIGN.md` as a real source for token and base-component appearance decisions, not just inspiration.
- Make the migration feel decisive rather than leaving long-lived duplicate primitive systems.

</specifics>

<deferred>
## Deferred Ideas

- Full-project rewrite that keeps only the core conversation experience — out of scope for Phase 4, should be evaluated as a separate milestone or backlog phase.
- Full Raycast-style visual unification of the whole product from `DESIGN.md` — backlog-scale work aligned with backlog 999.2 rather than this migration phase.

</deferred>

---

*Phase: 04-ui-migration*
*Context gathered: 2026-04-11*
