# Technology Stack: Multi-Window and Kanban Features

**Project:** CloudCLI UI
**Researched:** 2026-04-10

## Recommended Stack

### Core Architecture

| Technology | Purpose | Why |
|------------|---------|-----|
| **React 18** (existing) | UI framework | Already in use |
| **CSS Grid** (native) | Multi-pane layout | Native support, no bundle size |
| **React Context + Immer** | State management | Matches existing architecture |

### Drag-and-Drop

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| **@dnd-kit/core** | ^6.x | Accessible drag-and-drop primitives | React 18 native, accessible, performant |
| **@dnd-kit/sortable** | ^8.x | Sortable lists and grids | Built on dnd-kit core, great animations |
| **@dnd-kit/utilities** | ^3.x | CSS utilities | Minimal, tree-shakeable |

**Why not alternatives:**
- **react-beautiful-dnd:** Deprecated, no React 18 support
- **@hello-pangea/dnd:** Unmaintained fork
- **react-dnd:** Complex API, accessibility issues

### State Management Extensions

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **immer** | ^10.x | Immutable state updates | Every Context reducer |
| **zustand** (optional) | ^5.x | Lightweight store | If Context becomes unwieldy |

### Optional Performance Libraries

| Library | Purpose | When to Add |
|---------|---------|-------------|
| **react-window** | Virtualized lists | 100+ Kanban cards |
| **react-virtualized** | Alternative virtualization | If react-window insufficient |

## Installation

```bash
# Core dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities immer

# Optional
npm install zustand
npm install react-window
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Drag-and-drop | @dnd-kit | react-beautiful-dnd | Deprecated, no React 18 |
| Drag-and-drop | @dnd-kit | react-dnd | Complex API, poor accessibility |
| State | Context + Immer | Redux Toolkit | Overkill for this use case |
| State | Context + Immer | MobX | Less React-idiomatic |
| Layout | CSS Grid | iframe | Isolation overhead, cross-window comms |
| Layout | CSS Grid | React Portal | Unnecessary complexity |

## Existing Stack Compatibility

CloudCLI UI already has:
- React 18.2.0
- Tailwind CSS 3.4.0
- WebSocket (ws) for real-time
- React Router 6.x

New additions are minimal:
- @dnd-kit packages (~20KB gzipped)
- Immer (~6KB gzipped)

Total new bundle: ~26KB gzipped (acceptable)

## Sources

- @dnd-kit official documentation: https://dndkit.com
- Immer documentation: https://immerjs.github.io/immer/
- Zustand GitHub: https://github.com/pmndrs/zustand
- CSS Grid Layout: https://css-tricks.com/snippets/css/complete-guide-grid/
