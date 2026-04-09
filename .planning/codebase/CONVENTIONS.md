# Coding Conventions

**Analysis Date:** 2026-04-10

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `ChatInterface.tsx`, `AppContent.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useProjectsState.ts`, `useChatMessages.ts`)
- Utilities: camelCase with `.ts` or `.js` extension (e.g., `chatStorage.ts`, `api.js`)
- Types: camelCase with `.ts` extension (e.g., `types.ts`)
- Constants: camelCase with `.ts` extension (e.g., `constants.ts`, `thinkingModes.ts`)
- Context providers: PascalCase with `Context.tsx` suffix (e.g., `AuthContext.tsx`, `WebSocketContext.tsx`)

**Functions:**
- React components: PascalCase (e.g., `ChatInterface`, `MobileNav`)
- Hooks: camelCase prefixed with `use` (e.g., `useAuth`, `useWebSocket`)
- Regular functions: camelCase (e.g., `parseJsonSafely`, `resolveApiErrorMessage`)
- Event handlers: camelCase prefixed with `on` or `handle` (e.g., `onFileOpen`, `handleSubmit`)

**Variables:**
- camelCase for all variables (e.g., `selectedProject`, `isLoading`)
- Boolean variables prefixed with `is`, `has`, `should`, `can` (e.g., `isConnected`, `hasMoreMessages`, `shouldShowTasksTab`, `canAbortSession`)
- Refs: camelCase suffixed with `Ref` (e.g., `streamBufferRef`, `moreRef`, `wasConnectedRef`)

**Types:**
- Interfaces: PascalCase (e.g., `Project`, `ProjectSession`, `ChatMessage`)
- Type aliases: PascalCase (e.g., `SessionProvider`, `AppTab`, `MessageKind`)
- Props types: PascalCase suffixed with `Props` (e.g., `ChatInterfaceProps`, `MobileNavProps`, `AuthProviderProps`)
- Context value types: PascalCase suffixed with `Value` (e.g., `AuthContextValue`)
- Payload types: PascalCase suffixed with `Payload` (e.g., `AuthSessionPayload`, `OnboardingStatusPayload`)

## Code Style

**Formatting:**
- No Prettier config detected - formatting enforced via ESLint
- Indentation: 2 spaces (inferred from source files)
- Semicolons: Required at end of statements
- Quotes: Single quotes for strings
- Trailing commas: Used in multiline objects/arrays

**Linting:**
- Tool: ESLint 9.39.3 with TypeScript ESLint
- Config: `eslint.config.js` using flat config format
- Key plugins:
  - `eslint-plugin-react` - React-specific rules
  - `eslint-plugin-react-hooks` - Hooks rules enforcement
  - `eslint-plugin-react-refresh` - Vite HMR compatibility
  - `eslint-plugin-import-x` - Import ordering and hygiene
  - `eslint-plugin-tailwindcss` - Tailwind class validation
  - `eslint-plugin-unused-imports` - Unused import detection
- Strict mode: TypeScript strict mode enabled in `tsconfig.json`
- Pre-commit: Husky + lint-staged runs ESLint on staged files

**Key ESLint Rules:**
- `unused-imports/no-unused-imports`: warn
- `unused-imports/no-unused-vars`: warn (ignore vars prefixed with `_`)
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warn
- `import-x/order`: warn - groups: builtin, external, internal, parent, sibling, index
- `import-x/no-duplicates`: warn
- `tailwindcss/classnames-order`: warn
- `@typescript-eslint/no-explicit-any`: off (any is allowed)
- `react/react-in-jsx-scope`: off (React 18 JSX transform)

## Import Organization

**Order:**
1. React and React ecosystem (react, react-dom, react-router-dom, react-i18next)
2. External libraries (lucide-react, etc.)
3. Internal contexts (`../../contexts/`)
4. Internal hooks (`../../hooks/`)
5. Internal components (`../components/`)
6. Internal utilities (`../../utils/`)
7. Internal types (`../types/`)
8. Internal constants (`../constants/`)

**Pattern:**
```typescript
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Folder } from 'lucide-react';
import { useTasksSettings } from '../../contexts/TasksSettingsContext';
import { usePlugins } from '../../contexts/PluginsContext';
import { AppTab } from '../../types/app';
```

**Path Aliases:**
- Not used - all imports use relative paths (`../../`, `../`)

**Newlines:**
- No newlines between import groups (enforced by `import-x/order` with `newlines-between: never`)

## Error Handling

**Patterns:**
- Try-catch blocks used extensively (171 occurrences across codebase)
- Async errors caught with `.catch()` handlers
- Console logging for errors: `console.error('[Context] Error message:', e`
- Graceful degradation: errors logged but don't crash the app
- API errors resolved with utility: `resolveApiErrorMessage(payload, fallback)`

**Example:**
```typescript
try {
  const response = await api.user.onboardingStatus();
  if (!response.ok) {
    return;
  }
  const payload = await parseJsonSafely<OnboardingStatusPayload>(response);
  setHasCompletedOnboarding(Boolean(payload?.hasCompletedOnboarding));
} catch (caughtError) {
  console.error('Error checking onboarding status:', caughtError);
  // Fail open to avoid blocking access
  setHasCompletedOnboarding(true);
}
```

**Safe parsing:**
```typescript
export async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
```

**localStorage safety:**
- Wrapped in `safeLocalStorage` utility (`src/components/chat/utils/chatStorage.ts`)
- Handles `QuotaExceededError` by clearing old drafts
- All operations wrapped in try-catch

## Logging

**Framework:** Native `console` methods

**Patterns:**
- Errors: `console.error('[Component] Description:', error)`
- Warnings: `console.warn('Description')`
- Context prefix: Use `[ComponentName]` or `[Context]` prefix for clarity
- No debug/info logging in production code

**Examples:**
```typescript
console.error('[SessionStore] fetch failed for ${sessionId}:', error);
console.warn('WebSocket not connected');
console.error('Error parsing WebSocket message:', error);
```

## Comments

**When to Comment:**
- Complex logic requiring explanation
- Non-obvious behavior or workarounds
- Public API documentation (function purpose, parameters)
- Section headers in large files

**JSDoc/TSDoc:**
- Used sparingly for utility functions
- Type definitions provide most documentation
- Example from `src/components/chat/hooks/useChatMessages.ts`:
```typescript
/**
 * Mesormalization utilities.
 * Converts NormalizedMessage[] from the session store into ChatMessage[] for the UI.
 */
```

**Inline comments:**
- Used to explain non-obvious code
- Example: `// Fail open to avoid blocking access on transient onboarding status errors.`

## Function Design

**Size:** 
- Hooks can be large (500-1000 lines) with multiple responsibilities
- Component functions typically 100-500 lines
- Utility functions kept small (10-50 lines)

**Parameters:**
- Props objects for React components
- Destructured parameters for hooks
- Options objects for functions with many parameters
- Type-safe TypeScript interfaces

**Return Values:**
- Hooks return objects with named properties (not arrays)
- Components return JSX
- Utilities return typed values or null for errors
- Async functions return Promises

**Example hook signature:**
```typescript
type UseProjectsStateArgs = {
  sessionId?: string;
  navigate: NavigateFunction;
  latestMessage: AppSocketMessage | null;
  isMobile: boolean;
  activeSessions: Set<string>;
};

export function useProjectsState(args: UseProjectsStateArgs) {
  // ... implementation
  return {
    selectedProject,
    selectedSession,
    activeTab,
    // ... more properties
  };
}
```

## Module Design

**Exports:**
- Named exports preferred over default exports for utilities and types
- Default exports used for React components
- Context hooks exported alongside providers (e.g., `useAuth` with `AuthProvider`)

**Barrel Files:**
- Used in `src/components/auth/index.ts` to re-export public API
- Pattern:
```typescript
export { AuthProvider, ProtectedRoute } from './context/AuthContext';
export { useAuth } from './context/AuthContext';
```

**File Organization:**
- Components: `view/` subdirectory for UI components
- Hooks: `hooks/` sdirectory
- Types: `types/` subdirectos.ts` file
- Utils: `utils/` subdirectory or individual files
- Constants: `constants/` subdirectory or `constants.ts` file

## TypeScript Conventions

**Strict Mode:** Enabled in `tsconfig.json`

**Type Annotations:**
- Explicit types for function parameters
- Return types inferred for simple functions
- Explicit return types for complex functions and hooks
- Props always typed with interfaces

**Type Guards:**
- Runtime checks for optional properties
- Null coalescing and optional chaining used extensively

**Any Usage:**
- Allowed (`@typescript-eslint/no-explicit-any: off`)
- Used sparingly for dynamic data (e.g., WebSocket messages, API responses)

## React Conventions

**Component Style:**
- Functional components only (no class components)
- Hooks for state and side effects
- TypeScript for all components

**State Management:**
- `useState` for local state
- Context API for shared state (Auth, WebSocket, Theme, Plugins)
- Custom stores for complex state (`useSessionStore`)

**Props:**
- Destructured in function signature
- Typed with interfaces suffixed with `Props`
- Optional props marked with `?`

**Refs:**
- `useRef` for DOM references and mutable values
- Typed explicitly: `useRef<HTMLDivElement | null>(null)`

**Effects:**
- `useEffect` for side effects
- Dependencies array always provided
- Cleanup functions returned when needed

**Callbacks:**
- `useCallback` for memoized callbacks passed to children
- `useMemo` for expensive computations

## Git Conventions

**Commit Messages:**
- Format: Conventional Commits (enforced by commitlint)
- Config: `@commitlint/config-conventional`
- Examples: `feat:`, `fix:`, `chore:`, `docs:`

**Pre-commit:**
- Husky hook runs `lint-staged`
- ESLint runs on staged `.ts`, `.tsx`, `.js`, `.jsx` files in `src/`

---

*Convention analysis: 2026-04-10*
