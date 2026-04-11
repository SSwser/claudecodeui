# Roadmap: CloudCLI UI - Desktop UX Enhancement

**Granularity:** Coarse (3-5 phases, 1-3 plans each)
**Created:** 2026-04-10
**Core Value:** 清晰的组织管理 - 让用户能够轻松管理多个项目、workspace 和会话

---

## Phases

- [~] **Phase 1: Foundation** - Landing Page + Layout Infrastructure
- [ ] **Phase 2: Core Sessions** - Project Management + Session Lifecycle
- [ ] **Phase 3: Virtual Sessions** - Hybrid Branching + Timeline
- [ ] **Phase 4: UI Migration** - Component Library + i18n
- [ ] **Phase 5: Multi-Pane + Kanban** - v2 Transition (v2 scope)

---

## Coverage

| Requirement Category | Count | Phase |
|-----------------------|-------|-------|
| Landing Page | 7 | Phase 1 |
| Layout Infrastructure | 5 | Phase 1 |
| Project Management | 6 | Phase 2 |
| Session Management | 8 | Phase 2 |
| Virtual Sessions | 10 | Phase 3 |
| UI Component Library | 7 | Phase 4 |

**Total v1 Coverage:** 43/43 requirements mapped

---

## Phase Details

### Phase 1: Foundation

**Goal:** Users land on a welcoming page that shows recent projects and sessions, with the layout system ready for multi-pane expansion.

**Depends on:** Nothing (first phase)

**Requirements:** LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07, LAY-01, LAY-02, LAY-03, LAY-04, LAY-05

**Success Criteria** (what must be TRUE):

1. User sees Landing Page on app launch instead of direct session entry
2. User sees list of 10 most recent projects on Landing Page
3. User sees list of 10 most recent sessions on Landing Page
4. User can mark projects or sessions as favorites, which appear in dedicated section above recent items
5. User can click any project or session to enter that context
6. User can initiate new project or session creation from Landing Page
7. Layout persists across page refreshes (localStorage)
8. User can switch between single-view and dual-view layout modes
9. Layout mode switcher is accessible from any view

**Plans:** 4 plans

Plans:

- [x] 01-01-PLAN.md - Home-state contracts, persistence, and LayoutContext foundation
- [x] 01-02-PLAN.md - Workspace creation modes and wizard contract update
- [x] 01-03-PLAN.md - Landing page UI, favorites, recent activity, and startup routing
- [ ] 01-04-PLAN.md - Browser-style tabs and single/dual-pane shell behaviors (awaiting human verification)

**UI hint:** yes

---

### Phase 2: Core Sessions

**Goal:** Users can organize work into Projects and Workspaces, managing the full session lifecycle from creation through archival.

**Depends on:** Phase 1

**Requirements:** PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, SESS-07, SESS-08

**Success Criteria** (what must be TRUE):

1. System automatically discovers and displays projects in user directory
2. Git worktrees are detected and shown as separate entries under parent project
3. User can create, rename, and delete Workspaces within a project
4. Each Workspace maintains independent session history and configuration
5. User can create new sessions within a Workspace
6. User can freeze a running session, releasing background resources
7. User can resume a frozen session, restoring full context state
8. User can archive sessions they want to keep but not actively use
9. User can delete sessions after confirmation
10. Session list supports search by name or content
11. Multiple tabs can be open simultaneously, each showing different sessions
12. Each tab remembers its own scroll position and context

**Plans:** TBD

### Phase 3: Virtual Sessions

**Goal:** Users experience uninterrupted conversation flow while the system transparently manages context limits through intelligent branching and compression.

**Depends on:** Phase 2

**Requirements:** VIRT-01, VIRT-02, VIRT-03, VIRT-04, VIRT-05, VIRT-06, VIRT-07, VIRT-08, VIRT-09, VIRT-10

**Success Criteria** (what must be TRUE):

1. System displays real-time context usage percentage for each session
2. Warning appears when context reaches 80% capacity
3. System automatically creates a new branch when context approaches limits, visible as a notification but not blocking user flow
4. Auto-branch preserves all previous messages and continues conversation in new branch
5. User can view a Git-like timeline showing all branches and their relationships
6. User can switch to any historical branch and continue from that point
7. User can manually create branches from current point or any historical point
8. User can add names or notes to branches for easier identification
9. Context compression uses sliding window, summarization, and pruning strategies
10. Protected contexts (variable declarations, imports, function signatures) are excluded from compression

**Plans:** TBD

### Phase 4: UI Migration

**Goal:** Application adopts a modern, consistent component library with proper internationalization support.

**Depends on:** Phase 1 (can run in parallel with Phase 2-3)

**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07

**Success Criteria** (what must be TRUE):

1. Component library evaluation completed with selection documented
2. CSS variable system covers all themeable properties (colors, spacing, typography)
3. All existing i18n translation keys are audited and mapped to new structure
4. Basic components (Button, Input, Dialog, Select) are replaced with library equivalents
5. New features use component library exclusively
6. CI prevents new hardcoded strings from being added (i18n enforcement)
7. Visual regression tests catch unintended UI changes during migration

**Phase 4 Entry Gate** (must be done before official start):

1. Figma integration rules are documented in `docs/figma/INTEGRATION-RULES.md`
2. Figma-to-code checklist is documented in `docs/figma/FIGMA-TO-CODE-CHECKLIST.md`
3. MCP / Code Connect workflow guidance is documented in `docs/figma/MCP-CODE-CONNECT-WORKFLOW.md`

**Backlog (pre-Phase 4 and Phase 4 support):**

- [ ] Add one pilot screen roundtrip record (Design -> Code -> Design delta -> Code)
- [ ] Add CI-friendly checklist verification note for UI PR template
- [ ] Add component mapping starter list for Code Connect high-frequency primitives

**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — CSS token foundation and primitive alignment (Button, Badge, Input)
- [x] 04-02-PLAN.md — i18n key convention, mapping document, and CI hardcoded string gate
- [ ] 04-03-PLAN.md — Dialog and Select component migration (portal, keyboard accessibility)
- [ ] 04-04-PLAN.md — Playwright visual regression setup and Figma pilot roundtrip record

### Phase 5: Multi-Pane + Kanban (v2 Transition)

**Goal:** Multi-window session monitoring and Kanban-style session management are introduced as a foundation for v2.

**Depends on:** Phase 3 (Virtual Sessions core must be stable)

**Requirements:** MPAN-01, MPAN-02, MPAN-03, MPAN-04, KBN-01, KBN-02, KBN-03

**Success Criteria** (what must be TRUE):

1. User can arrange multiple sessions in a grid layout (1x1, 2x2, 1x3 configurations)
2. Each pane renders an independent session interface
3. Panes can be resized by user interaction
4. Layout configuration persists across sessions
5. Kanban view displays sessions as draggable cards organized in lanes
6. Workspace lanes group sessions by their parent Workspace
7. Cards can be dragged between lanes to change session status

**Plans:** TBD

---

## Phase Dependencies

```
Phase 1 (Foundation)
       │
       ├── Phase 2 (Core Sessions)
       │         │
       │         └── Phase 3 (Virtual Sessions)
       │                   │
       │                   └── Phase 5 (Multi-Pane + Kanban)
       │
       └── Phase 4 (UI Migration) [can run parallel to Phase 2-3]
```

---

## Risk Summary

| Phase | Key Risks |
|-------|-----------|
| Phase 1 | Landing Page performance with large project lists; Layout persistence edge cases |
| Phase 2 | Database migration for session schema; Worktree detection reliability |
| Phase 3 | Context compression quality; Branch continuity during auto-branch |
| Phase 4 | Tailwind + shadcn style conflicts; i18n key mapping completeness; Figma workflow adoption consistency |
| Phase 5 | Multiple ChatInterface performance; Cross-pane WebSocket sync complexity |

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/4 | In progress | 01-01, 01-02, 01-03 |
| 2. Core Sessions | 0/3 | Not started | - |
| 3. Virtual Sessions | 0/3 | Not started | - |
| 4. UI Migration | 1/4 | In progress | 04-01 |
| 5. Multi-Pane + Kanban | 0/3 | Not started | - |

---

*Last updated: 2026-04-11*

---

## Backlog

### Phase 999.1: Dev Login Skip or Credential Management (BACKLOG)

**Goal:** 评估并实现开发体验优化：在开发环境通过环境变量自动跳过登录，或开发完整的免登录用户凭证管理功能。

**Context:**

- 应用当前有登录页面，每次开发调试需要手动登录，影响迭代效率
- 方案 A（轻量）：读取 `DEV_AUTO_LOGIN` 环境变量，开发模式下自动注入测试凭证，绕过登录页面
- 方案 B（完整）：设计无感知凭证管理，支持持久化 token、自动刷新、多账号切换
- 需评估安全边界：方案 A 必须严格限制为开发/测试环境，不能泄漏到生产构建

**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: 参考 design.md 统一视觉风格 (BACKLOG)

**Goal:** 以 DESIGN.md 中的 Raycast 风格设计系统为基准，全面统一应用视觉语言——包括色彩 token、排版比例、圆角、阴影、间距以及组件样式，使 UI 风格一致且具有品牌辨识度。

**Context:**

- `DESIGN.md` 定义了 Raycast 启发的暗色主题：近黑背景 `#07080a`、Raycast Red `#FF6363`、Inter 字体、多层 macOS 原生阴影
- 当前代码库使用 Tailwind semantic CSS variable token，与 DESIGN.md 的色板存在差距
- Phase 1 UI-SPEC 已锁定当前阶段的交互合约；本 backlog 针对品牌视觉层的系统性对齐
- 需要更新 `src/index.css`（CSS 变量）、`tailwind.config.js`（token 映射）以及相关组件的 class 用法
- 优先保证 dark 模式一致性；light 模式适配可作为子任务

**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

