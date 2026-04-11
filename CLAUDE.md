# CloudCLI UI Figma Integration Rules

This document captures the actual UI architecture and styling rules in this repository so Figma designs can be adapted into code without fighting the existing system.

## Canonical Figma Docs

To avoid coupling all guidance to a single `CLAUDE.md`, Figma-specific guidance is maintained in dedicated docs:

- `docs/figma/INTEGRATION-RULES.md` (canonical integration rules)
- `docs/figma/FIGMA-TO-CODE-CHECKLIST.md` (execution checklist)
- `docs/figma/MCP-CODE-CONNECT-WORKFLOW.md` (MCP / Code Connect workflow and roundtrip guidance)

`CLAUDE.md` remains a high-level index and summary for agents.

## Purpose

Use these rules when translating Figma nodes into CloudCLI UI components.

- Match the existing React + Tailwind + CSS variable stack.
- Reuse existing shared primitives before creating new UI abstractions.
- Prefer semantic theme tokens like `bg-background` or `text-foreground` over hard-coded colors.
- Keep assets local-first and reference files from `public/` when a static asset is needed.
- Follow the current feature-folder structure instead of introducing a parallel design-system tree.

## 1. Design System Structure

### Token Definitions

Primary token sources:

- `src/index.css`
- `tailwind.config.js`
- `src/contexts/ThemeContext.jsx`

Observed token model:

- Tokens are defined as CSS custom properties in `:root` and `.dark`.
- Tailwind maps semantic color names to those CSS variables using `hsl(var(--token))`.
- Spacing tokens are minimal and mostly Tailwind-native, with a few custom CSS variables for mobile safe areas and nav sizing.
- Typography is not tokenized deeply. The global font stack is set on `body` in `src/index.css`.
- Border radius is tokenized through `--radius` and surfaced in Tailwind.

Representative pattern:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --radius: 0.5rem;
    --mobile-nav-total: calc(var(--mobile-nav-height) + var(--mobile-nav-padding) + env(safe-area-inset-bottom, 0px));
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
  }
}
```

Tailwind token bridge:

```js
extend: {
  colors: {
    border: 'hsl(var(--border))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))',
    },
  },
  borderRadius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)',
  },
}
```

Token transformation systems:

- No Style Dictionary, Tokens Studio export, Theo, or custom token build pipeline is present.
- No generated design-token JSON files were found.
- Token changes are authored directly in CSS and Tailwind config.

Practical rule for Figma MCP:

- Map Figma colors to existing semantic tokens first.
- Add new CSS variables only when a new semantic role is truly needed.
- Do not push raw hex values directly into component class strings unless the existing code already does so for a one-off effect.

### Component Library

Primary component locations:

- `src/shared/view/ui/` for reusable primitives
- `src/components/ui/` for thin compatibility wrappers and newer local primitives
- `src/components/*/view/` for feature-specific components

Observed component architecture:

- Feature folders are organized by domain, for example `sidebar`, `file-tree`, `git-panel`, `project-creation-wizard`.
- Many features split code into `view/`, `hooks/`, `types/`, `utils/`, and sometimes `constants/`.
- Shared primitives are intentionally small and class-based.
- Variant-heavy primitives use `class-variance-authority` and `cn()`.

Representative primitive pattern:

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-sm',
        icon: 'h-10 w-10',
      },
    },
  },
)
```

Wrapper pattern:

```tsx
export { Button, buttonVariants } from '../../shared/view/ui/Button'
```

Component documentation and Storybook:

- No Storybook config or `*.stories.*` files were found.
- No MDX component catalog was found.
- The component source itself is the canonical documentation.

Practical rule for Figma MCP:

- Prefer existing primitives such as `Button`, `Input`, `Badge`, and the local `Dialog` before introducing new primitives.
- Add new feature UI inside the relevant feature folder.
- If a design introduces a reusable control, implement it in `src/shared/view/ui/` or `src/components/ui/` only after confirming it is cross-feature.

## 2. Frameworks & Libraries

Primary stack:

- React 18
- React Router 6
- Vite 7
- Tailwind CSS 3
- PostCSS + Autoprefixer
- Express backend under `server/`

Key UI libraries:

- `class-variance-authority` for variants
- `clsx` + `tailwind-merge` through `cn()`
- `lucide-react` for UI icons
- `@uiw/react-codemirror` and CodeMirror language packages for code editing
- `@xterm/xterm` for terminal UI
- `react-i18next` for localization

Build system and bundling:

- Vite handles the frontend build.
- `vite.config.js` defines manual chunks for React, CodeMirror, and xterm.
- Express serves `public/` and built `dist/` assets.

Representative build snippet:

```js
build: {
  outDir: 'dist',
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-codemirror': ['@uiw/react-codemirror', '@codemirror/lang-javascript'],
        'vendor-xterm': ['@xterm/xterm', '@xterm/addon-fit'],
      }
    }
  }
}
```

Practical rule for Figma MCP:

- Generate React components, not framework-agnostic HTML.
- Use Tailwind classes and existing component props, not CSS-in-JS.
- Keep imports relative; no path alias system was found.

## 3. Asset Management

Primary asset locations:

- `public/` for app-level static assets
- `public/icons/` for provider and PWA icons
- `public/screenshots/` for documentation screenshots

Storage and reference model:

- Public assets are referenced by root-relative URLs such as `/icons/claude-ai-icon.svg`.
- Feature code uses `<img src="/icons/..." />` for provider logos and PWA assets.
- No asset imports from `src/assets/` were found.

Representative asset pattern:

```tsx
<img src="/icons/claude-ai-icon.svg" alt="Claude" className={className} />
```

Optimization and caching:

- Vite produces hashed build assets in `dist/assets`.
- Express serves built static assets with `Cache-Control: public, max-age=31536000, immutable`.
- HTML is explicitly served with `no-cache` headers.
- `public/sw.js` uses network-first for navigations and cache-first for hashed `/assets/` files.
- Plugin assets are explicitly served with `no-store` to avoid stale frontend plugin bundles.

Relevant server behavior:

```js
if (filePath.endsWith('.html')) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
} else if (filePath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
}
```

CDN configuration:

- No CDN configuration was found.
- Assets are served locally by Express and Vite output.

Practical rule for Figma MCP:

- Put brand assets, exported illustrations, or static images in `public/` when they need a stable URL.
- Use root-relative URLs in components for those public assets.
- Avoid introducing a remote CDN dependency for design assets unless the codebase is intentionally changed to support it.

## 4. Icon System

There are two icon paths in this repo.

### UI Icons

- Source: `lucide-react`
- Usage: imported directly inside components
- Scope: buttons, menus, tabs, status indicators, file tree, settings, onboarding, task master, and more

Example:

```tsx
import { Home, Plus, X } from 'lucide-react'
```

### Brand and Provider Icons

- Source: `public/icons/`
- Usage: wrapped by components in `src/components/llm-logo-provider/`
- Theme-aware variants exist for Cursor and Codex using light/dark SVG pairs.

Example:

```tsx
const CursorLogo = ({ className = 'w-5 h-5' }) => {
  const { isDarkMode } = useTheme()

  return (
    <img
      src={isDarkMode ? '/icons/cursor-white.svg' : '/icons/cursor.svg'}
      alt='Cursor'
      className={className}
    />
  )
}
```

Naming conventions:

- Provider brand icons use semantic names like `claude-ai-icon.svg`, `cursor.svg`, `cursor-white.svg`, `codex.svg`, `gemini-ai-icon.svg`.
- PWA icons follow size-based names like `icon-192x192.png` and `icon-512x512.svg`.
- File-type icons are not asset files; they are resolved from an extension map in `src/components/file-tree/constants/fileIcons.ts`.

Practical rule for Figma MCP:

- Use Lucide for generic product UI icons.
- Use `src/components/llm-logo-provider/SessionProviderLogo.tsx` or the provider-specific logo components for model/provider branding.
- If Figma includes a branded provider glyph, do not redraw it with Lucide.

## 5. Styling Approach

Primary styling method:

- Tailwind utility classes in JSX
- Global CSS variables and base styles in `src/index.css`
- `class-variance-authority` for reusable variant APIs
- `cn()` helper from `src/lib/utils.js` to merge conditional classes

What is not used:

- No CSS Modules
- No Styled Components
- No Emotion
- No Sass or Less files

Theme model:

- Theme is toggled by applying or removing the `.dark` class on `document.documentElement`.
- `ThemeContext` manages localStorage persistence and updates browser theme meta tags.

Representative helper:

```js
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

Responsive implementation:

- Standard Tailwind breakpoints such as `sm:`, `md:`, `lg:`, and `xl:`
- CSS variables for safe areas and mobile nav height
- PWA-specific adjustments in global CSS for standalone mode

Representative responsive pattern:

```tsx
<div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
```

Practical rule for Figma MCP:

- Express layout and spacing in Tailwind first.
- Reuse semantic token utilities like `bg-card`, `border-border`, `text-muted-foreground`, `ring-ring`.
- Put only cross-cutting theme variables and global behaviors in `src/index.css`.
- Do not introduce ad hoc component-level CSS files unless there is a strong reason.

## 6. Project Structure

Top-level layout:

- `src/` frontend app
- `server/` Express backend, WebSocket handling, routes, providers, services
- `shared/` cross-runtime shared constants and helpers
- `public/` static assets
- `plugins/` plugin starter material
- `docker/` container definitions

Frontend structure:

- `src/components/` feature-first UI modules
- `src/contexts/` app-wide context providers
- `src/hooks/` cross-feature hooks
- `src/types/` shared frontend types
- `src/utils/` generic frontend utilities
- `src/shared/view/ui/` reusable primitives

Representative feature pattern:

- `src/components/sidebar/hooks/`
- `src/components/sidebar/types/`
- `src/components/sidebar/utils/`
- `src/components/sidebar/view/`

Backend structure:

- `server/routes/` HTTP route modules
- `server/providers/` provider integrations
- `server/services/` service-layer utilities
- `server/middleware/` auth and request middleware
- `server/utils/` backend helpers
- `server/database/` SQLite setup

Practical rule for Figma MCP:

- Put new UI into the existing feature folder that owns the workflow.
- If a Figma design spans multiple features, extract only the smallest truly shared primitive.
- Keep backend or persistence changes isolated under `server/` and frontend rendering under `src/`.

## 7. Figma MCP Implementation Rules

When adapting Figma designs into this repo, follow these rules in order.

1. Map design tokens to the semantic CSS variable system in `src/index.css` and `tailwind.config.js` before adding anything new.
2. Compose screens from existing primitives in `src/shared/view/ui/` and `src/components/ui/` whenever the design uses standard controls.
3. Keep feature-specific components inside the owning feature folder under `src/components/<feature>/view/`.
4. Use Tailwind classes for layout, spacing, and responsive behavior.
5. Use Lucide for generic UI symbols and the logo-provider components for model branding.
6. Put exported static assets in `public/` and reference them with root-relative URLs.
7. Preserve dark-mode behavior by using semantic classes and checking `ThemeContext` only when asset variants differ by theme.
8. Avoid introducing a parallel token system, CSS-in-JS library, Storybook-only abstractions, or one-off global styles without a repo-wide reason.

## 8. Figma-to-Code Checklist

Use this as a ship checklist before opening a PR.

### A. Pre-check (before coding)

- [ ] Confirm target feature folder under `src/components/<feature>/view/`.
- [ ] Search existing primitives in `src/shared/view/ui/` and `src/components/ui/`.
- [ ] Identify whether design uses provider branding (Claude/Cursor/Codex/Gemini).
- [ ] List any new assets needed and plan them under `public/`.

### B. Tokens and styling

- [ ] Use semantic Tailwind classes (`bg-background`, `text-foreground`, `border-border`, etc.).
- [ ] Map colors/radius/spacing to existing tokens in `src/index.css` and `tailwind.config.js`.
- [ ] Add new CSS variables only if no existing semantic token fits.
- [ ] Do not introduce CSS Modules, Sass/Less, styled-components, or Emotion.

### C. Component composition

- [ ] Reuse `Button`, `Input`, `Badge`, and existing shared controls before creating new ones.
- [ ] Keep new reusable primitives in `src/shared/view/ui/` (or `src/components/ui/` if it is a bridge case).
- [ ] Keep feature-specific UI local to the feature folder.
- [ ] Follow existing patterns: `cva` variants + `cn()` class merge.

### D. Icons and assets

- [ ] Use `lucide-react` for generic UI icons.
- [ ] Use `src/components/llm-logo-provider/SessionProviderLogo.tsx` for provider logos.
- [ ] Reference static assets via root-relative paths like `/icons/...`.
- [ ] Avoid remote CDN-hosted design assets unless repo architecture is intentionally changed.

### E. Behavior and responsiveness

- [ ] Validate both light and dark themes.
- [ ] Validate responsive behavior on mobile and desktop (`sm/md/lg/xl` breakpoints).
- [ ] Respect existing safe-area/mobile-nav variables in `src/index.css`.
- [ ] Ensure the implementation matches current interaction patterns (tabs, dialogs, menus).

### F. Delivery quality gate

- [ ] No hard-coded one-off hex values where semantic tokens exist.
- [ ] No parallel design-system layer added.
- [ ] No Storybook/docs dependencies introduced for this change.
- [ ] Confirm imports/build stay aligned with Vite + existing project conventions.

## 9. Gaps To Be Aware Of

- Token coverage is strongest for colors, surfaces, borders, and radius, but weaker for typography scales and spacing scales.
- There is no formal design-system documentation site.
- There is no automated token sync from Figma.
- Some newer primitives exist in `src/components/ui/` while older shared primitives live in `src/shared/view/ui/`, so check both before adding a new one.

## 10. Key File Paths

- `src/index.css`
- `tailwind.config.js`
- `src/contexts/ThemeContext.jsx`
- `src/shared/view/ui/Button.tsx`
- `src/shared/view/ui/Input.tsx`
- `src/shared/view/ui/Badge.tsx`
- `src/components/ui/`
- `src/components/llm-logo-provider/SessionProviderLogo.tsx`
- `src/components/file-tree/constants/fileIcons.ts`
- `src/lib/utils.js`
- `src/main.jsx`
- `vite.config.js`
- `public/manifest.json`
- `public/sw.js`
- `public/icons/`
- `server/index.js`
- `server/routes/plugins.js`
