# Architecture Research: Multi-Window and Kanban Patterns

**Project:** CloudCLI UI
**Researched:** 2026-04-10
**Confidence:** MEDIUM-HIGH (based on existing codebase patterns + established React ecosystem practices)

## Executive Summary

CloudCLI UI is a React 18 application with tab-based navigation and Context-driven state management. The request to add multi-window tiling and Kanban views can be achieved through a **Layout Context + CSS Grid** approach for views, and **immutable state + normalization** for Kanban data structures. This avoids the complexity of iframe isolation while maintaining React's component model.

**Key architectural decisions:**
1. Use CSS Grid for multi-window tiling (not separate windows/iframes)
2. Implement a LayoutContext to manage view modes and pane configuration
3. Use Zustand or React Context + Immer for Kanban state (not Redux - overkill)
4. Leverage existing WebSocket infrastructure for cross-pane state sync

---

## Recommended Architecture

### Multi-Window View Modes

| Mode | Grid Layout | Use Case |
|------|-------------|----------|
| **Single** | `1x1` (default) | Focus mode, mobile fallback |
| **Dual** | `1x2` or `2x1` | Side-by-side comparison, reference |
| **Quad** | `2x2` | Multi-agent parallel work |
| **Triple** | `1x3` or `3x1` | Chat + Files + Preview |
| **Kanban** | Custom horizontal scroll | Workspace swimlanes |

### Component Hierarchy

```
<LayoutProvider>
  <AppShell>
    <Sidebar />
    <LayoutContainer mode={viewMode}>
      {/* Single/Dual/Quad: renders Pane components */}
      <Pane slot="main" />      <Pane slot="secondary" />
      <Pane slot="tertiary" />
      <Pane slot="quaternary" />

      {/* Kanban: renders Swimlane components */}
      <Swimlane id="todo" />
      <Swimlane id="in-progress" />
      <Swimlane id="done" />
    </LayoutContainer>
  </AppShell>
</LayoutProvider>
```

### Component Boundaries

| Component | Responsibility | State Ownership |
|-----------|---------------|-----------------|
| `LayoutProvider` | View mode, pane config, layout persistence | Local state + localStorage |
| `LayoutContainer` | CSS Grid template, responsive breakpoints | Controlled by LayoutProvider |
| `Pane` | Session container, drag-drop target | Props from parent |
| `Swimlane` | Kanban column with drop zone | KanbanContext |
| `KanbanCard` | Draggable session card | Immutable data |

---

## State Management Strategy

### Option 1: LayoutContext + Immer (Recommended)

**Rationale:** Matches existing architecture pattern. Immer enables immutable updates with minimal boilerplate.

```typescript
// contexts/LayoutContext.tsx
import { createContext, useContext, useReducer, useCallback } from 'react';
import { produce } from 'immer';

type ViewMode = 'single' | 'dual' | 'quad' | 'triple' | 'kanban';

interface LayoutState {
  viewMode: ViewMode;
  activePanes: string[]; // session IDs
  paneConfig: Record<string, { slot: string; ratio?: number }>;
}

type LayoutAction =
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'SET_PANES'; panes: string[] }
  | { type: 'SWAP_PANES'; from: string; to: string }
  | { type: 'ADD_PANE'; sessionId: string; slot: string }
  | { type: 'REMOVE_PANE'; sessionId: string };

const initialState: LayoutState = {
  viewMode: 'single',
  activePanes: [],
  paneConfig: {},
};

function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'SET_VIEW_MODE':
        draft.viewMode = action.mode;
        break;
      case 'SET_PANES':
        draft.activePanes = action.panes;
        break;
      case 'SWAP_PANES':
        const fromIndex = draft.activePanes.indexOf(action.from);
        const toIndex = draft.activePanes.indexOf(action.to);
        if (fromIndex !== -1 && toIndex !== -1) {
          draft.activePanes[fromIndex] = action.to;
          draft.activePanes[toIndex] = action.from;
        }
        break;
      case 'ADD_PANE':
        if (!draft.activePanes.includes(action.sessionId)) {
          draft.activePanes.push(action.sessionId);
        }
        draft.paneConfig[action.sessionId] = { slot: action.slot };
        break;
      case 'REMOVE_PANE':
        draft.activePanes = draft.activePanes.filter(id => id !== action.sessionId);
        delete draft.paneConfig[action.sessionId];
        break;
    }
  });
}
```

### Option 2: Zustand (Alternative)

**Rationale:** Zustand offers simpler API than Redux with less boilerplate than Context+Reducer. Good for complex cross-component state.

```typescript
// stores/layoutStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutStore {
  viewMode: ViewMode;
  activePanes: string[];
  paneConfig: Record<string, { slot: string; ratio?: number }>;
  setViewMode: (mode: ViewMode) => void;
  setPanes: (panes: string[]) => void;
  swapPanes: (from: string, to: string) => void;
  addPane: (sessionId: string, slot: string) => void;
  removePane: (sessionId: string) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      viewMode: 'single',
      activePanes: [],
      paneConfig: {},
      setViewMode: (mode) => set({ viewMode: mode }),
      setPanes: (panes) => set({ activePanes: panes }),
      swapPanes: (from, to) => set((state) => {
        const fromIndex = state.activePanes.indexOf(from);
        const toIndex = state.activePanes.indexOf(to);
        if (fromIndex === -1 || toIndex === -1) return state;
        const newPanes = [...state.activePanes];
        [newPanes[fromIndex], newPanes[toIndex]] = [newPanes[toIndex], newPanes[fromIndex]];
        return { activePanes: newPanes };
      }),
      addPane: (sessionId, slot) => set((state) => ({
        activePanes: state.activePanes.includes(sessionId)
          ? state.activePanes
          : [...state.activePanes, sessionId],
        paneConfig: { ...state.paneConfig, [sessionId]: { slot } },
      })),
      removePane: (sessionId) => set((state) => ({
        activePanes: state.activePanes.filter(id => id !== sessionId),
        paneConfig: Object.fromEntries(
          Object.entries(state.paneConfig).filter(([k]) => k !== sessionId)
        ),
      })),
    }),
    { name: 'layout-preferences' }
  )
);
```

### Kanban State Structure

```typescript
// types/kanban.ts
interface KanbanBoard {
  id: string;
  lanes: KanbanLane[];
}

interface KanbanLane {
  id: string;
  title: string;
  cardIds: string[];
  limit?: number; // WIP limit
  color?: string;
}

interface KanbanCard {
  id: string; // matches sessionId
  title: string;
  provider: 'claude' | 'cursor' | 'codex' | 'gemini';
  priority?: 'low' | 'medium' | 'high';
  labels?: string[];
  assignee?: string;
  createdAt: number;
  updatedAt: number;
}

// Normalized state for O(1) lookups
interface KanbanState {
  board: KanbanBoard;
  lanes: Record<string, KanbanLane>;
  cards: Record<string, KanbanCard>;
}
```

### Recommendation

**Use LayoutContext + Immer for MVP.** It follows the existing Context pattern in the codebase (WebSocketContext, TaskMasterContext). If the Kanban complexity grows (filters, bulk operations, history), migrate to Zustand.

---

## CSS Grid Layout Implementation

### LayoutContainer Component

```tsx
// components/layout/LayoutContainer.tsx
import React from 'react';
import { useLayout } from '../../contexts/LayoutContext';

const GRID_TEMPLATES: Record<ViewMode, string> = {
  single: '"main"',
  dual: '"main secondary" / 1fr 1fr',
  quad: '"main secondary" "tertiary quaternary" / 1fr 1fr',
  triple: '"main secondary tertiary" / 1fr 1fr 1fr',
  kanban: '"lanes" / repeat(auto-fit, minmax(300px, 1fr))',
};

const SLOT_TO_GRID_AREA: Record<string, string> = {
  main: 'main',
  secondary: 'secondary',
  tertiary: 'tertiary',
  quaternary: 'quaternary',
};

interface LayoutContainerProps {
  children: React.ReactNode;
}

export function LayoutContainer({ children }: LayoutContainerProps) {
  const { viewMode } = useLayout();

  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateAreas: GRID_TEMPLATES[viewMode],
    gridTemplateColumns: viewMode === 'single' ? '1fr' :
                         viewMode === 'quad' ? '1fr 1fr' :
                         'repeat(Math.min(activePanes.length, 3), 1fr)',
    gridTemplateRows: viewMode === 'quad' ? '1fr 1fr' : '1fr',
    gap: '0.5rem',
    height: '100%',
    padding: '0.5rem',
    overflow: 'hidden',
  };

  return (
    <div className="layout-container" style={style}>
      {children}
    </div>
  );
}
```

### Pane Component

```tsx
// components/layout/Pane.tsx
import React, { useMemo } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import ChatInterface from '../chat/view/ChatInterface';
import { useProjectsState } from '../../hooks/useProjectsState';

interface PaneProps {
  sessionId: string;
  slot: string;
}

export function Pane({ sessionId, slot }: PaneProps) {
  const { paneConfig } = useLayout();
  const config = paneConfig[sessionId];

  const style: React.CSSProperties = useMemo(() => ({
    gridArea: SLOT_TO_GRID_AREA[slot] || 'main',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }), [slot]);

  // Find the session data from existing state
  // This would connect to useProjectsState or a derived hook

  return (
    <div className="pane" style={style}>
      {/* Render ChatInterface with isolated session context */}
      <ChatInterface
        selectedProject={/* derived from sessionId */}
        selectedSession={/* derived from sessionId */}
        isInPane={true}
        paneId={sessionId}
      />
    </div>
  );
}
```

---

## Drag and Drop Implementation

### Library Recommendation

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **@dnd-kit/core** | Accessible, performant, React 18 compatible | Learning curve | **Best for Kanban** |
| dnd-kit/sortable | Built on dnd-kit, great for lists | Bundle size | Use with dnd-kit |
| react-beautiful-dnd | Good animations | Deprecated, not React 18 | Avoid |
| @hello-pangea/dnd | Fork of react-beautiful-dnd | Maintenance concerns | Legacy only |

**Recommendation:** Use `@dnd-kit/core` + `@dnd-kit/sortable`

### Implementation Pattern

```typescript
// hooks/useKanbanDrag.ts
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Draggable Card
function KanbanCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {card.title}
    </div>
  );
}

// Droppable Lane
function KanbanLane({ lane }: { lane: KanbanLane }) {
  const { setNodeRef, isOver } = useDroppable({
    id: lane.id,
    data: { type: 'lane', lane },
  });

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'drop-target-active' : ''}
    >
      <SortableContext items={lane.cardIds} strategy={verticalListSortingStrategy}>
        {lane.cardIds.map(cardId => (
          <KanbanCard key={cardId} card={cards[cardId]} />
        ))}
      </SortableContext>
    </div>
  );
}
```

---

## Responsive Layout Strategy

### Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

const VIEW_MODE_BREAKPOINTS: Record<ViewMode, number> = {
  single: 0,     // Always available
  dual: 768,     // tablet+
  quad: 1024,    // desktop+
  triple: 1024,  // desktop+
  kanban: 640,   // tablet+ (horizontal scroll)
};
```

### CSS Implementation

```css
/* Tailwind already configured, use responsive prefixes */
.layout-container {
  @apply grid gap-2 p-2;
}

@media (min-width: 768px) {
  .layout-container[data-view="dual"] {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .layout-container[data-view="quad"] {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
```

---

## WebSocket State Synchronization

The existing WebSocket implementation in `WebSocketContext` can be extended to sync layout and Kanban state across panes.

### Message Protocol Extension

```typescript
// types/sync-messages.ts
type SyncMessage =
  | { type: 'layout:update'; payload: Partial<LayoutState> }
  | { type: 'kanban:move-card'; payload: { cardId: string; fromLane: string; toLane: string; newIndex: number } }
  | { type: 'kanban:create-card'; payload: { laneId: string; card: KanbanCard } }
  | { type: 'kanban:delete-card'; payload: { cardId: string } }
  | { type: 'kanban:sync'; payload: KanbanState }
  | { type: 'pane:focus'; payload: { paneId: string } };
```

### Sync Provider Pattern

```typescript
// contexts/SyncContext.tsx
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { sendMessage, latestMessage } = useWebSocket();
  const { dispatch } = useLayout();
  const kanbanDispatch = useKanbanDispatch();

  useEffect(() => {
    if (!latestMessage) return;

    switch (latestMessage.type) {
      case 'layout:update':
        dispatch({ type: 'MERGE', payload: latestMessage.payload });
        break;
      case 'kanban:move-card':
        kanbanDispatch({
          type: 'MOVE_CARD',
          cardId: latestMessage.payload.cardId,
          toLane: latestMessage.payload.toLane,
          newIndex: latestMessage.payload.newIndex,
        });
        break;
      case 'kanban:sync':
        kanbanDispatch({ type: 'SYNC', payload: latestMessage.payload });
        break;
    }
  }, [latestMessage, dispatch, kanbanDispatch]);

  // Broadcast local changes
  const broadcast = useCallback((message: SyncMessage) => {
    sendMessage(message);
  }, [sendMessage]);

  return (
    <SyncContext.Provider value={{ broadcast }}>
      {children}
    </SyncContext.Provider>
  );
}
```

---

## Performance Considerations

### 1. Multiple Chat Instances

Rendering multiple `ChatInterface` components is expensive. Each instance:
- Maintains its own message list state
- Has independent WebSocket subscription logic
- Uses separate CodeMirror instances (heavy)

**Optimization strategies:**
- Use `React.memo` aggressively
- Virtualize message lists (react-window)
- Share WebSocket subscription at context level
- Debounce typing indicators

### 2. Kanban Card Rendering

- Use `React.memo` for cards
- Virtualize lists with 100+ cards
- Lazy load card details
- Avoid re-renders on unrelated card updates

### 3. Memory Management

```typescript
// Limit concurrent panes based on viewport
const MAX_PANES_BY_BREAKPOINT = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
  wide: 4,
};
```

### 4. Bundle Size Impact

| Feature | Added Bundle Size (estimated) |
|---------|------------------------------|
| @dnd-kit/core | ~15KB gzipped |
| @dnd-kit/sortable | ~5KB gzipped |
| Immer | ~6KB gzipped |
| Zustand (optional) | ~3KB gzipped |
| react-window (optional) | ~6KB gzipped |

**Total added:** ~20-35KB gzipped (acceptable)

---

## Migration Path

### Phase 1: Layout Infrastructure
1. Create `LayoutContext`
2. Add `LayoutContainer` component
3. Implement CSS Grid templates
4. Add view mode switcher UI

### Phase 2: Multi-Pane Support
1. Refactor `MainContent` to use `LayoutContainer`
2. Create `Pane` wrapper component
3. Connect pane state to existing session state
4. Add pane focus/activation

### Phase 3: Kanban Implementation
1. Create `KanbanContext` with normalized state
2. Build `Swimlane` and `KanbanCard` components
3. Integrate dnd-kit for drag-and-drop
4. Add lane management (create, rename, delete)

### Phase 4: WebSocket Sync
1. Define sync message protocol
2. Implement `SyncProvider`
3. Add optimistic updates
4. Handle conflicts/resolution

---

## Anti-Patterns to Avoid

### 1. No Native Window Spawning (for MVP)
Opening native browser windows adds complexity:
- State synchronization across windows
- Browser security restrictions
- User experience fragmentation
- Testing complexity

**Instead:** Use CSS Grid-based panes within single window.

### 2. Avoid Deeply Nested Providers
```typescript
// BAD - creates "provider hell"
<WebSocketProvider>
  <LayoutProvider>
    <KanbanProvider>
      <SyncProvider>
        <App />
      </SyncProvider>
    </KanbanProvider>
  </LayoutProvider>
</WebSocketProvider>

// GOOD - flatten where possible
<Providers>
  <App />
</Providers>
```

### 3. Don't Over-Normalize Early
Start with nested data structure. Normalize when performance issues arise.

### 4. Avoid Blocking Drag-and-Drop
```typescript
// BAD - blocks UI during drag
const handleDragStart = async () => {
  await fetchCardDetails(cardId); // blocks
};

// GOOD - preload on hover or idle
useEffect(() => {
  const prefetch = setTimeout(() => prefetchCard(cardId), 100);
  return () => clearTimeout(prefetch);
}, [cardId]);
```

---

## Testing Strategy

### Unit Tests
- LayoutReducer state transitions
- Kanban operations (move, add, remove)
- Drag-and-drop handlers

### Integration Tests
- Pane-to-pane communication
- WebSocket sync scenarios
- localStorage persistence

### E2E Tests (Playwright)
- View mode switching
- Cross-pane drag-and-drop
- Responsive layout changes

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Multi-window layout | HIGH | CSS Grid is well-established |
| State management | HIGH | Context pattern matches codebase |
| Drag-and-drop | HIGH | dnd-kit is battle-tested |
| WebSocket sync | MEDIUM | Architecture sound, needs implementation |
| Performance | MEDIUM | Estimates based on similar apps |

---

## Gaps for Later Research

- Real-time collaboration (CRDT vs operational transforms)
- PWA multi-window support
- Touch gesture support for mobile Kanban
- Undo/redo for Kanban operations
