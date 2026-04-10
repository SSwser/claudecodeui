# Domain Pitfalls

**Project:** CloudCLI UI - Desktop UX Enhancement
**Researched:** 2026-04-10
**Confidence:** MEDIUM (based on codebase analysis + general engineering principles)

---

## Critical Pitfalls

Mistakes that cause rewrites, major regressions, or significant user impact.

---

### Pitfall 1: Progressive Migration Breaking Provider Adapter Contracts

**What goes wrong:** UI component changes inadvertently break the interface between frontend and provider adapters, causing chat sessions to fail silently or produce garbled output.

**Why it happens:**
- The codebase uses a provider adapter pattern (`server/providers/*/adapter.js`) with message normalization
- The `NormalizedMessage` type in `useSessionStore.ts` must match the server-side adapter outputs
- UI components directly use message `kind` fields for rendering (`src/components/chat/view/subcomponents/MessageComponent.tsx`)
- Adding new message types or changing existing ones without updating both ends creates a contract mismatch

**Consequences:**
- Chat messages render incorrectly or not at all
- Tool results display as raw JSON instead of formatted content
- Streaming messages fail to finalize properly
- Users lose trust in the application's reliability

**Prevention:**
1. Create a shared message type definition (currently `NormalizedMessage` is duplicated in client code)
2. Establish a formal contract test suite for provider adapters
3. Use TypeScript strict mode to catch type mismatches early
4. Document all message `kind` values in both frontend and backend codebases

**Detection:**
- WebSocket messages with unknown `kind` values appear in console logs
- `MessageComponent` throws or renders fallback for unrecognized kinds
- Manual testing of each provider's chat flow reveals rendering issues

**Codebase Evidence:**
```typescript
// src/stores/useSessionStore.ts - NormalizedMessage type must match server
export type MessageKind =
  | 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'stream_delta'
  | 'stream_end' | 'error' | 'complete' | 'status' | 'permission_request'
  // Adding new kinds here requires UI component updates
```

---

### Pitfall 2: Zustand Store Reference Leaks Causing Memory Bloat

**What goes wrong:** The `useSessionStore()` returns a stable reference via `useMemo`, causing session data to accumulate in memory without cleanup. With many virtual sessions and long-running tabs, the browser tab consumes excessive memory.

**Why it happens:**
- Current `useSessionStore` implementation stores all session data in a `Map` (`storeRef.current`)
- Sessions are added but never removed unless explicitly cleared
- `MAX_REALTIME_MESSAGES = 500` caps individual session messages but not total sessions
- No cleanup mechanism when users close tabs or navigate away

**Consequences:**
- Memory usage grows linearly with number of sessions accessed
- Tab becomes unresponsive or crashes on systems with limited RAM
- "Virtual sessions" feature (creating many branch sessions) amplifies the problem
- Users experience slowdowns after extended use

**Prevention:**
1. Implement session eviction policy (LRU cache with configurable max size)
2. Add explicit session cleanup when sessions are archived or deleted
3. Use `WeakRef` for session slots to allow garbage collection
4. Monitor memory usage and add warning thresholds

**Detection:**
- Browser DevTools Memory Profiler shows increasing heap size over time
- `Map` size in `storeRef.current` grows unbounded
- Users report browser tab crashes after extended use

**Suggested Fix:**
```typescript
// In useSessionStore.ts - add eviction policy
const MAX_CACHED_SESSIONS = 50; // configurable

const getSlot = useCallback((sessionId: string): SessionSlot => {
  const store = storeRef.current;
  if (!store.has(sessionId)) {
    // Evict oldest session if at capacity
    if (store.size >= MAX_CACHED_SESSIONS) {
      const firstKey = store.keys().next().value;
      store.delete(firstKey);
    }
    store.set(sessionId, createEmptySlot());
  }
  return store.get(sessionId)!;
}, []);
```

---

### Pitfall 3: WebSocket Reconnection Race Conditions in Multi-Tab Scenarios

**What goes wrong:** When users open multiple tabs or windows, each tab maintains its own WebSocket connection. Session state changes (new messages, session updates) may arrive in unexpected order, causing UI inconsistencies.

**Why it happens:**
- Each browser tab creates independent WebSocket connections (see `WebSocketContext.tsx:38-50`)
- `projects_updated` and `session_output` messages broadcast to all tabs
- Tabs may have different `activeSessionId` values
- No per-tab session state versioning or conflict resolution

**Consequences:**
- One tab shows "Session created" while another still shows loading state
- Messages appear out of order or duplicated across tabs
- User in Tab A sees changes they didn't initiate, disrupting flow
- Tab B might display stale data while Tab A shows fresh data

**Prevention:**
1. Implement session state versioning with optimistic updates
2. Add tab identification to WebSocket messages
3. Use operational transforms for concurrent edits
4. Consider server-side session locking for multi-tab coordination

**Detection:**
- Users report seeing duplicate messages or messages appearing/disappearing
- Browser console shows WebSocket messages arriving out of expected order
- Session message counts differ between tabs viewing same session

---

### Pitfall 4: Virtual Session Branching Breaks Context Continuity

**What goes wrong:** The virtual session mechanism (auto-branching when context approaches limits) causes users to lose conversational context or experience disjointed responses.

**Why it happens:**
- Auto-branching happens transparently without clear user notification
- Branch metadata (parent session ID, branch point) not visible in UI
- Resume feature must reconstruct context from multiple branch sessions
- No visual indicator showing which "virtual session" is currently active

**Consequences:**
- AI responses reference context from wrong branch
- Users lose track of conversation flow across branches
- Resume functionality produces inconsistent results
- User trust in session persistence erodes

**Prevention:**
1. Show visual branch indicator in chat UI (branch icon + parent session link)
2. Provide explicit "View Branch Timeline" UI before auto-branching occurs
3. Implement context preview: show what will be included in resume
4. Add branch management controls: name branches, compare branches, merge branches

**Detection:**
- Users report "AI forgot what we were discussing"
- Branch sessions don't appear in project session list
- Resume produces different responses than expected
- Session metadata shows gaps in message sequence

---

### Pitfall 5: Component Library Migration Breaks i18n Context

**What goes wrong:** Migrating to shadcn/ui or similar component library breaks existing i18n strings, causes duplicate translations, or loses language context in new components.

**Why it happens:**
- Current i18n setup uses `i18next` with namespace-based organization (`config.js:158`)
- New component libraries may use different i18n patterns (inline strings, different hooks)
- Translation JSON files are organized by feature, not by component
- `useSuspense: true` in React config (`config.js:177`) may conflict with new component patterns

**Consequences:**
- New UI components display English strings regardless of user language
- Existing translated strings become orphaned when components are replaced
- Runtime errors when accessing translations that don't exist in new namespace structure
- User confusion when parts of UI appear in different languages

**Prevention:**
1. Audit all translation keys before migration
2. Create translation mapping document for old → new component keys
3. Use `react-i18next` hooks consistently across all components
4. Set up CI checks that fail if new components use hardcoded strings
5. Implement runtime fallback for missing translation keys

**Detection:**
- Users report mixed-language UI after component library update
- Translation files show keys that no longer match component usage
- Browser console shows i18n warnings about missing keys

---

## Moderate Pitfalls

Issues that cause significant effort to fix but don't require complete rewrites.

---

### Pitfall 6: Tailwind Config Changes Cascade into Runtime Style Inconsistencies

**What goes wrong:** Adding new theme colors or modifying Tailwind config causes unexpected style changes across existing components.

**Why it happens:**
- Tailwind CSS purges unused styles in production build
- Component styles reference Tailwind utility classes directly
- Custom theme colors (`tailwind.config.js`) may conflict with new shadcn/ui defaults
- No visual regression testing in place

**Prevention:**
1. Use CSS variables for design tokens, not hardcoded Tailwind values
2. Add custom color palette to Tailwind config with semantic names
3. Implement visual regression tests with Playwright or Chromatic
4. Document all custom utility classes and their intended usage

**Detection:**
- CI build shows unexpected style changes
- Visual diffs in screenshot comparisons
- User reports "the app looks different now"

---

### Pitfall 7: Session Freeze/Resume State Persistence Gaps

**What goes wrong:** Pausing sessions (freezing) works but resuming fails to restore complete state, causing tool execution errors or missing context.

**Why it happens:**
- Session state includes in-memory data (tool approval states, pending operations)
- SQLite only stores persistent session metadata, not full state
- Freeze captures point-in-time but doesn't capture pending async operations
- Resume must re-establish connections and reload context

**Prevention:**
1. Implement session state serialization before freeze
2. Store pending operations queue in database for resume
3. Test freeze/resume cycle with active tool execution
4. Provide user feedback when resume may have side effects

**Detection:**
- Resume throws errors about pending operations
- Tool execution fails with "session not in expected state"
- User reports "the session resumed but didn't continue where I left off"

---

### Pitfall 8: Database Migration for Virtual Session Schema Breaks Existing Data

**What goes wrong:** Adding virtual session tables (branch metadata, session timeline) requires database migration that corrupts existing session data or breaks rollback.

**Why it happens:**
- Current database schema (`server/database/`) not designed for branching sessions
- Migration runs on startup (`runMigrations` in `db.js:83-100`)
- No backup before migration in development
- SQLite migrations are tricky with complex schema changes

**Prevention:**
1. Write migration scripts with up/down procedures
2. Test migrations against production-sized datasets
3. Implement data migration path from flat sessions to branching model
4. Add migration tests to CI pipeline
5. Provide manual migration fallback for corrupted data

**Detection:**
- Migration fails with SQL errors
- Existing sessions become inaccessible after update
- Database file grows unexpectedly or becomes corrupted

---

## Minor Pitfalls

Issues that cause localized problems but are quickly fixable.

---

### Pitfall 9: React Context Re-render Cascade

**What goes wrong:** Changing auth token or theme triggers unnecessary re-renders across entire app due to context provider hierarchy.

**Why it happens:**
- `WebSocketContext` depends on auth token (`WebSocketContext.tsx:36`)
- Token changes trigger WebSocket reconnect
- Provider hierarchy wraps entire app in context dependencies
- No memoization at consumer level

**Prevention:**
1. Split context into stable and volatile slices
2. Use selector pattern for context consumption
3. Memoize expensive computations in context providers
4. Consider Zustand for volatile state, Context for stable config

---

### Pitfall 10: Message Ordering in Streaming vs Server Fetch

**What goes wrong:** Real-time messages from WebSocket appear out of order relative to server-fetched messages, causing duplicate or missing messages in merged view.

**Why it happens:**
- `computeMerged` function (`useSessionStore.ts:110-117`) uses ID-based deduplication
- Streaming messages have provisional IDs (`__streaming_{sessionId}`)
- Server messages have permanent IDs assigned after stream completes
- Network latency can cause server fetch to return before streaming completes

**Prevention:**
1. Use server-provided sequence numbers when available
2. Implement timestamp-based ordering with threshold
3. Clear realtime messages after confirmed server sync

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Landing Page | i18n missing for new UI strings | Audit translations before building |
| Session Management | Store memory leaks | Implement eviction policy early |
| Virtual Sessions | Branch metadata loss | Design schema with branch support from start |
| UI Library Migration | Style conflicts | CSS variable system before migration |
| Multi-Tab Support | Race conditions | State versioning before multi-tab feature |
| Desktop Packaging | IPC complexity | Test IPC scenarios thoroughly |

---

## Debugging Strategies

### Memory Profiling
```bash
# Use Chrome DevTools
1. Open DevTools > Memory tab
2. Take heap snapshot
3. Navigate between sessions
4. Take another snapshot
5. Compare to find retained objects
```

### WebSocket Debugging
```typescript
// Add to WebSocketContext.tsx for debugging
websocket.onmessage = (event) => {
  console.log('[WS Debug]', event.data);
  // Parse and log message type, session ID
};
```

### i18n Audit
```bash
# Find hardcoded strings in source
grep -r "useTranslation\|t\('" src/components --include="*.tsx" | wc -l
# Compare against translation file key count
```

### Session State Inspection
```typescript
// Add to DevTools in development
if (import.meta.env.DEV) {
  (window as any).__sessionStore = storeRef.current;
}
```

---

## Resources

### React Migration Patterns
- **Strangler Fig Pattern:** Incrementally replace old components with new ones
- **Feature Flags:** Use flags to toggle between old/new implementations
- **Component Wrappers:** Create adapters for old→new component transitions

### State Management
- **Zustand Best Practices:** https://docs.pmnd.rs/zustand/recipes
- **React Context Optimization:** Use `useContextSelector` pattern

### i18n
- **i18next Best Practices:** https://www.i18next.com/
- **react-i18next Patterns:** https://react.i18next.com/latest/usetranslation-hook

### Testing
- **Playwright for UI:** Visual regression testing
- **Vitest for Unit:** Component and hook testing

---

*Pitfalls research: 2026-04-10*
