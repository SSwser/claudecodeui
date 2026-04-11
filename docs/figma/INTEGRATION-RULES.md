# Figma Integration Rules (CloudCLI UI)

This is the canonical Figma integration guide for this repository.

Related docs:

- `docs/figma/FIGMA-TO-CODE-CHECKLIST.md`
- `docs/figma/MCP-CODE-CONNECT-WORKFLOW.md`

## Scope

Use this document when converting Figma designs into code.

- Match existing React + Tailwind + CSS variable patterns
- Reuse existing UI primitives before creating new abstractions
- Keep assets local-first under `public/`
- Preserve feature-folder ownership (`src/components/<feature>/view/`)

## Design Tokens

Primary token sources:

- `src/index.css`
- `tailwind.config.js`
- `src/contexts/ThemeContext.jsx`

Rules:

- Use semantic classes first (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`)
- Add new CSS variables only when there is no existing semantic role
- Do not introduce a second token system

## Component Reuse

Primary component locations:

- `src/shared/view/ui/`
- `src/components/ui/`
- Feature-local UI in `src/components/*/view/`

Rules:

- Reuse `Button`, `Input`, `Badge`, existing `Dialog` patterns first
- Keep feature UI in its feature folder
- Move to shared primitives only when cross-feature reuse is proven

## Styling and Theming

- Styling is Tailwind-first, with global CSS variables in `src/index.css`
- Variant API uses `class-variance-authority`
- Class composition uses `cn()` from `src/lib/utils.js`
- Dark mode is class-based (`.dark`) via `ThemeContext`

Do not introduce:

- CSS Modules
- Sass/Less
- Styled Components / Emotion

## Assets and Delivery

Asset locations:

- `public/icons/`
- `public/screenshots/`
- other static assets in `public/`

Rules:

- Reference static assets with root-relative paths (example: `/icons/claude-ai-icon.svg`)
- Prefer local assets over external CDN links
- Keep caching behavior aligned with existing server rules:
  - hashed assets immutable cache
  - HTML no-cache
  - plugin assets no-store

## Icons

- Generic product icons: `lucide-react`
- Provider branding: `src/components/llm-logo-provider/SessionProviderLogo.tsx` and assets in `public/icons/`
- Keep provider logos as brand assets, do not redraw with generic icon set

## Project Structure Fit

Frontend:

- `src/components/` feature-first modules
- common patterns: `view/`, `hooks/`, `types/`, `utils/`

Backend:

- `server/routes/`, `server/services/`, `server/providers/`, `server/middleware/`

Rule:

- Figma-driven UI changes stay in frontend feature folders unless backend work is explicitly required.
