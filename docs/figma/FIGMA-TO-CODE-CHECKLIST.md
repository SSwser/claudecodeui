# Figma-to-Code Checklist

Use this checklist before opening a PR.

## A. Pre-check

- [ ] Confirm target feature folder under `src/components/<feature>/view/`
- [ ] Search existing primitives in `src/shared/view/ui/` and `src/components/ui/`
- [ ] Check if provider branding is involved (Claude/Cursor/Codex/Gemini)
- [ ] List required new assets and place under `public/`

## B. Tokens and Styling

- [ ] Use semantic Tailwind classes first
- [ ] Map colors/radius/spacing to `src/index.css` + `tailwind.config.js`
- [ ] Add new CSS vars only when needed
- [ ] Avoid CSS Modules, Sass/Less, styled-components, Emotion

## C. Component Composition

- [ ] Reuse `Button`, `Input`, `Badge`, and existing patterns first
- [ ] Keep feature-specific UI local to feature folder
- [ ] Only create shared primitives when truly cross-feature
- [ ] Follow `cva` + `cn()` conventions

## D. Icons and Assets

- [ ] Use `lucide-react` for generic UI symbols
- [ ] Use `SessionProviderLogo` for provider branding
- [ ] Use root-relative asset paths (`/icons/...`)
- [ ] Avoid introducing remote CDN dependencies for design assets

## E. Responsive and Theme Behavior

- [ ] Validate light + dark mode
- [ ] Validate mobile + desktop breakpoints
- [ ] Respect safe-area and mobile-nav variables
- [ ] Match existing interaction patterns (tabs, dialogs, menus)

## F. Quality Gate

- [ ] No one-off hardcoded hex values where semantic tokens exist
- [ ] No parallel design-system layer
- [ ] No Storybook/doc tooling introduced just for this task
- [ ] Build/lint/typecheck remain aligned with current project conventions
