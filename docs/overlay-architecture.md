# Overlay Architecture

## Why This Exists

The codebase currently mixes several different concepts behind similar backdrop markup:

- modal dialogs
- destructive confirmation prompts
- side panels
- view-scoped blocking states
- fullscreen task surfaces

At the time of writing, `src/` contains at least 26 direct backdrop implementations using hand-written `fixed inset-0`, `bg-black/50`, or similar classes. That makes semantics inconsistent, raises accessibility risk, and forces each feature to solve stacking, dismissal, and styling on its own.

This document defines a long-term, shadcn-aligned overlay model that is maintainable, semantically clear, and safe to migrate toward incrementally.

## Design Principles

1. Choose the primitive by interaction semantics, not by visual similarity.
2. Reuse shadcn-style open-code primitives for modal behaviors.
3. Introduce one explicit app primitive for non-modal blocking states instead of abusing `Dialog`.
4. Centralize backdrop and surface styling so visual changes happen once.
5. Stop adding new hand-rolled backdrop layers unless the case is intentionally outside the shared system.

## Semantic Taxonomy

### 1. Dialog

Use for user-driven modal tasks that temporarily interrupt the current flow and require focus management.

Examples:

- rename forms
- settings subflows
- multi-step wizards that are truly modal
- upgrade details / informational modal content

Required behavior:

- `role="dialog"`
- `aria-modal="true"`
- title and description support
- ESC handling
- focus handoff / restore
- portal-based stacking

Implementation baseline:

- `src/components/ui/dialog.tsx`
- follow shadcn composition: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`

### 2. Alert Dialog

Use for destructive or high-risk confirmation prompts.

Examples:

- delete project
- discard changes
- revert destructive git actions

Why separate it from `Dialog`:

- the user intent is confirmation, not general modal content
- button hierarchy and safe default focus must be consistent
- the component should encode destructive semantics instead of letting each feature improvise

Implementation target:

- add `src/components/ui/alert-dialog.tsx`
- model it after shadcn `AlertDialog`

### 3. Sheet / Drawer

Use for supplemental panels that complement, rather than replace, the current screen.

Examples:

- quick settings side panel
- inspector panels
- filters / contextual side tools

Why it is not a `Dialog`:

- the motion and placement are edge-attached
- the panel is secondary to the main surface
- mobile and desktop variants often need different directions

Implementation target:

- add `src/components/ui/sheet.tsx`
- use sheet semantics for side-mounted panels instead of custom slide-over markup

### 4. State Overlay

Use for blocking states that belong to a specific screen or container, not to the global application modal layer.

Examples:

- stale workspace resolution in `ProjectInbox`
- shell connection / reconnect / loading blocker
- blocking loading or error state for a workspace-specific panel

Why it is not a `Dialog`:

- it represents the current surface state, not a separate modal task
- dismissal is often not user-controlled
- it usually needs to cover a view while preserving that view's layout context underneath

Why it is not “just a backdrop”:

- it still needs a consistent panel shell, actions, and readable hierarchy
- it should use shared styling and accessibility rules

Implementation target:

- add `src/components/ui/state-overlay.tsx`
- container-scoped by default with `absolute inset-0`
- no modal semantics by default
- no implicit ESC close
- can optionally expose an `aria-live` or labelled panel when needed

### 5. Custom Fullscreen Overlay

Keep a separate category for specialized fullscreen experiences that do not map cleanly to shadcn modal primitives.

Examples:

- code editor fullscreen surfaces
- image viewer canvas mode
- drag overlays
- screenshot / design capture overlays

These are valid exceptions, but they must remain explicit exceptions.

## Proposed Shared Architecture

### A. Keep shadcn-aligned modal primitives in `src/components/ui`

Shared modal primitives should live next to existing shadcn-style components:

- `dialog.tsx`
- `alert-dialog.tsx`
- `sheet.tsx`
- `state-overlay.tsx`

This keeps ownership clear: these are app-wide UI primitives, not feature-local helpers.

### B. Introduce a shared style recipe layer

Add a small internal utility for shared overlay styling. This should not become a mega-framework. It only needs to centralize the visual shell.

Suggested file:

- `src/components/ui/overlay-styles.ts`

Suggested responsibilities:

- backdrop classes
- panel surface classes
- elevation variants
- inset / center / side positioning helpers

This avoids repeated hard-coded combinations like:

- `bg-black/50`
- `bg-background/75`
- `backdrop-blur-sm`
- `rounded-xl border border-border bg-card shadow-2xl`

### C. Add exactly one non-modal app primitive

`StateOverlay` is the missing piece that explains most current inconsistency.

Suggested API:

```tsx
<StateOverlay open={isBlocked}>
  <StateOverlayPanel size="sm">
    <StateOverlayEyebrow>{workspaceName}</StateOverlayEyebrow>
    <StateOverlayTitle>Worktree removed</StateOverlayTitle>
    <StateOverlayDescription>
      This stream's worktree no longer exists on disk.
    </StateOverlayDescription>
    <StateOverlayActions>
      <Button variant="outline">Archive</Button>
      <Button variant="destructive">Delete</Button>
    </StateOverlayActions>
  </StateOverlayPanel>
</StateOverlay>
```

Required behavior:

- rendered within the current surface, not portaled to `document.body` by default
- blocks pointer interaction with the covered view
- preserves underlying layout so the user understands what is being blocked
- visually consistent with dialog surfaces, but semantically separate

## Implementation Rules

1. No new raw backdrop markup for modal use cases.
2. Every new destructive confirmation must use `AlertDialog`.
3. Every new edge-attached secondary panel must use `Sheet`.
4. Every blocking view state must use `StateOverlay`, not `Dialog`.
5. `Dialog`, `Sheet`, and `AlertDialog` must always include a title, following shadcn accessibility guidance.
6. Z-index values should be owned by the primitive, not scattered in feature code.
7. Feature components should provide content and actions, not backdrop mechanics.

## Recommended Changes To Existing Primitives

### `src/components/ui/dialog.tsx`

Keep it, but tighten it toward shadcn conventions:

- preserve title requirements
- keep portal ownership inside the primitive
- move backdrop and panel classes into shared overlay style helpers
- do not use `Dialog` as a generic answer for view-scoped blocking states

### Add `AlertDialog`

Current gap:

- there is no shared confirmation primitive in the repo today

Impact:

- several destructive flows are forced into custom modal components

### Add `Sheet`

Current gap:

- side panels use custom slide-over markup and custom backdrop logic

Impact:

- placement, close behavior, and mobile adaptation are inconsistent

### Add `StateOverlay`

Current gap:

- view-scoped blocking states are implemented ad hoc

Impact:

- `ProjectInbox` and similar features must choose between an inline card, a fake modal, or custom absolute overlay code

## Migration Plan

### Phase 1: Establish primitives

Build the shared foundation first.

Deliverables:

- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/state-overlay.tsx`
- `src/components/ui/overlay-styles.ts`

Success criteria:

- no new feature needs to write raw backdrop markup for common overlay cases

### Phase 2: Migrate the highest semantic mismatches

These are the places where the current primitive choice is most misleading.

#### Move to `StateOverlay`

- `src/components/project-inbox/view/ProjectInbox.tsx`
- `src/components/shell/view/subcomponents/ShellConnectionOverlay.tsx`

Reason:

- both represent blocking surface state, not general modal tasks

#### Move to `AlertDialog`

- `src/components/git-panel/view/modals/ConfirmActionModal.tsx`
- `src/components/prd-editor/view/OverwriteConfirmModal.tsx`
- sidebar delete confirmation in `src/components/sidebar/view/subcomponents/SidebarModals.tsx`

Reason:

- these are destructive confirmations and should converge on one accessible confirmation primitive

### Phase 3: Migrate supplemental panel patterns

#### Move to `Sheet`

- `src/components/quick-settings-panel/view/QuickSettingsPanelView.tsx`
- other side-attached panels that are currently custom slide-overs

Reason:

- these are contextual side panels, not freeform modal implementations

### Phase 4: Migrate standard modals onto `Dialog`

Candidates:

- `src/components/version-upgrade/view/VersionUpgradeModal.tsx`
- `src/components/task-master/view/modals/TaskHelpModal.tsx`
- `src/components/task-master/view/modals/CreateTaskModal.tsx`
- `src/components/task-master/view/modals/TaskMasterSetupModal.tsx`
- `src/components/project-creation-wizard/components/FolderBrowserModal.tsx`
- `src/components/project-wizard/view/ProjectWizard.tsx`

Reason:

- these are true modal flows and should share the same shell, accessibility, and portal behavior

### Phase 5: Explicitly document exceptions

Do not force-fit specialized fullscreen experiences into the shared modal primitives.

Likely exceptions:

- code editor fullscreen surfaces
- binary viewer / image viewer fullscreen modes
- drag-and-drop overlays
- design capture overlays

For these cases, keep the custom implementation but mark them as deliberate exceptions in code comments or follow-up docs.

## Assessment Of Other Existing Implementations

### Good candidates for immediate standardization

- destructive confirmations
- informational modals
- side panels with backdrop
- view-scoped blocking states

These share enough structure that standardization will reduce maintenance cost immediately.

### Poor candidates for forced standardization

- temporary drag overlays
- overlays tied to canvas capture or screenshot behavior
- fullscreen editor shells with complex mobile/desktop layout rules

These should not be migrated just to satisfy visual uniformity.

## Decision For `ProjectInbox`

The stale workspace treatment should use `StateOverlay`, not `Dialog`.

Why:

- it belongs to the current project surface
- it should appear before or over the project view loading flow
- it blocks a view-specific state, rather than opening a separate modal task

This gives the user the desired behavior without lying about semantics.

## Team Rules Going Forward

Before adding any new overlay, ask in this order:

1. Is this a destructive confirmation? Use `AlertDialog`.
2. Is this a modal task? Use `Dialog`.
3. Is this a side-attached supporting panel? Use `Sheet`.
4. Is this a blocking state of the current view? Use `StateOverlay`.
5. Is this a specialized fullscreen surface or functional overlay? Keep it custom and document why.

If the answer is none of the above, add a new primitive only after documenting why the existing taxonomy is insufficient.
