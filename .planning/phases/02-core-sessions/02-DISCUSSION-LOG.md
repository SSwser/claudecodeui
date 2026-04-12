# Phase 2: Core Sessions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 02-core-sessions
**Areas discussed:** 会话冻结/恢复机制, Sidebar / 导航重构, 会话搜索范围和索引, Workspace 删除级联行为

---

## 会话冻结/恢复机制

### Q1: "冻结" 在技术上意味着什么？

| Option                            | Description                                                                                                       | Selected |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Kill 后端进程 + 保存状态快照      | 把 claude/codex 进程彻底杀掉，把当前消息历史和上下文快照存到 DB；恢复时重启进程，重新加载快照。真正释放系统资源。 | ✓        |
| 暂停 WebSocket 连接，进程后台挂起 | 保持进程存在但挂起，断开 WebSocket；恢复时重连。资源释放不彻底，但恢复速度快。                                    |          |
| 仅断开前端连接                    | 后端进程继续跑，前端只是不显示；不释放任何资源，只是 UI 状态。                                                    |          |

**User's choice:** Kill 后端进程 + 保存状态快照
**Notes:** User clarified that Claude/Codex already implement session snapshot management — we don't need extra snapshot handling. Just safely kill the process, especially handling Windows process tree kill issues.

### Q2: 冻结的会话应该多久自动清理或转换状态？

**User's choice:** (Free text) Claude/Codex 自身已经实现了会话快照管理，不需要我们额外处理，只要安全 kill 后端进程，特别是 Windows 上系统底层的问题。
**Notes:** No auto-cleanup needed — freeze is about process lifecycle only, not data management.

### Q3: 冻结后 Tab 和 UI 的状态如何展现？

| Option                        | Description                                                                              | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Tab 保持开着 + 冻结状态 Badge | 冻结后显示一个轻一的「已冻结」Badge，点击可立即恢复。冻结的 Tab 保持开着但显示冰雪图标。 | ✓        |
| Tab 关闭 + 列表中显示状态     | 冻结后 Tab 自动关闭，会话在列表中显示「冷冻」标记；用户需要点列表中冻结项才能恢复。      |          |
| 保持 Tab + 全局 Snackbar 提示 | 冻结后既保持 Tab 开着，同时在小屏显示全局提示（Snack bar）。                             |          |

**User's choice:** Tab 保持开着 + 冻结状态 Badge

### Q4: 恢复冻结会话时，用户期望怎样的体验？

| Option                  | Description                                                                            | Selected |
| ----------------------- | -------------------------------------------------------------------------------------- | -------- |
| 重启进程 + 加载快照     | 恢复时重新启动一个新的 Claude/Codex 进程，加载快照就和新建一样操作。用户可以继续输入。 |          |
| 显示摘要 + 手动操作     | 恢复时展示一个想心 prompt 让用户获得上下文，然后手动操作。                             | ✓        |
| 自动发送微型提示 prompt | 恢复时自动运行一段小丝鸿请用户提供下一步计划。                                         |          |

**User's choice:** 显示摘要 + 手动操作
**Notes:** User added: conversation content doesn't need a running process to view (local files), only sending new messages requires starting the process. Also noted future possibilities for idle sleep and scheduled wake-up.

### Q5: 冻结操作从哪里触发？

| Option                      | Description                                                                            | Selected |
| --------------------------- | -------------------------------------------------------------------------------------- | -------- |
| Tab 右键 + 聊天界面顶部按钮 | Tab 标签右键菜单中有「冻结」选项；聊天界面顶部 Action Bar 也有冻结按钮。两处均可操作。 | ✓        |
| 只在聊天顶部，Tab 不有右键  | 只在聊天界面顶部有冻结按钮，Tab 不提供右键操作。                                       |          |
| 只在 Inbox 列表行动按钮里   | 只在 Project Inbox 会话列表中每个会话项的行动按钮里有冻结，界面内不提供。              |          |

**User's choice:** Tab 右键 + 聊天界面顶部按钮

---

## Sidebar / 导航重构

### Q1: Sidebar 应该怎样展示项目 → Workspace → 会话层级结构？

**User's choice:** (Free text) Complete redesign:

1. 项目列表不再展开显示会话列表，会话列表内聚到 MainContent 中
2. 对话中按照最近聊天过的顺序显示最近 10 个，以及用户主动收藏的对话
3. 默认每个项目就是一个 workspace；如果在初始化项目的时候选择了启用多 workspace 的功能，就会用 worktree 来聚合管理
   - 项目启用多 workspace 之后就不可以关闭
   - workspace 可以在 maincontent 的 header 上切换
   - 或者是在 sidebar 再增加一块区域显示当前打开的 workspace
   - 用户多项目来回切换的场景不多，但是在同一个项目需要多线并行还是有必要

### Q2: Sidebar 项目栏里，每个项目项显示什么？

| Option                             | Description                                                                                    | Selected |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| 项目列表只显示名称+状态            | 项目名 + 状态指示（有活跃会话则显示圆点），点击打开 maincontent 项目详情页（会话列表在内容区） | ✓        |
| 项目名 + 买赞会话预览              | 项目名 + 活跃会话摘要（最近 1-2 条）展示，精简预览                                             |          |
| 极简 sidebar，内容全在 maincontent | 仅显示项目图标/名称，所有详情在 maincontent，不展开任何子项                                    |          |

**User's choice:** 项目列表只显示名称+状态

### Q3: 选中左侧 Sidebar 中一个项目后，mainContent 这个区域展示什么？

**User's choice:** (Free text) 和 landing page 相似的页面，但是要重新设计，现在的 landing page 太难看且信息混乱；我想把这个页面设计成 inbox 一样，让用户作为首席信息官高效做出决策

### Q4: Inbox 设计是局部就全做，还是 Phase 2 先做基础版、后续阶段进化？

| Option                                        | Description                                                                                                    | Selected |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Phase 2：简化 Inbox（列表+状态+操作）         | 且山 Phase 2 居中当：项目首页 = 简化 Inbox，展示这个项目的会话列表（状态、最新消息预览、搜索），快速打开会话。 | ✓        |
| Phase 2：最简列表，不设计 Inbox 概念          | Phase 2 采用占位符，仅实现会话列表 + CRUD；Inbox 设计留给 Phase 5 Kanban 第一次做就做好。                      |          |
| Phase 2：丰富版 Inbox，收兖后续阶段的可扩展性 | Phase 2 直接做局部 Inbox，平衡当前设计及小量技番此阶段就实现一个完整展现会话的完整页面。                       |          |

**User's choice:** Phase 2：简化 Inbox（列表+状态+操作）

### Q5: Sidebar 中 "10 个最近" 就话和 "项目列表" 如何共存？

| Option                                | Description                                                         | Selected |
| ------------------------------------- | ------------------------------------------------------------------- | -------- |
| 两区块：Top=最近就话, Bottom=项目列表 | (置顶) 最近就话，点击直接开聊天 / (下方) 项目列表，点击开项目 Inbox | ✓        |
| 只有项目列表，没有 Sidebar 全局最近   | 只有项目列表；最近就话在 Landing Page + 项目 Inbox 里，不在 Sidebar |          |
| 只有最近就话，项目通过其他入口访问    | 只有最近就话；项目导航在顶部搜索框或多级可不自项目栏                |          |

**User's choice:** 两区块：Top=最近就话, Bottom=项目列表
**Notes:** Global recent sessions click navigates directly to chat interface.

### Q6: 新建项目/向导流程需要在 Phase 2 重写吗？

| Option                                          | Description                                                                                                               | Selected |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| 重设计创建流程（本地扫描 + Workspace + 初始化） | 需要重新设计创建流程，包含本地扫描加载 + git 初始化 + Workspace 配置，更多步骤，但更完整。                                | ✓        |
| 继承 Phase 1 向导，补充 Workspace 选项          | 与 Phase 1 的项目创建向导一致，在 Phase 2 里补充 Workspace 可选项（单 Workspace 默认 vs 多 Workspace 启用）。不重写向导。 |          |

**User's choice:** 重设计创建流程
**Notes:** 3-step wizard: (1) Project basics (name), (2) Directory selection (local folder / git repo), (3) Enable Workspace management toggle.

### Q7: 应用初始化时的本地项目扫描是如何触发的？

| Option                              | Description                                                              | Selected |
| ----------------------------------- | ------------------------------------------------------------------------ | -------- |
| 手动触发扫描，不主动                | 用户手动点击 "+ 导入项目" 才触发扫描，不主动提示。                       | ✓        |
| 首次启动自动扫描 + 展示项目选择截面 | 初次入基时展示扫描进度，完成后显示发现的项目列表，用户可选择要导入哪些。 |          |
| 卫决指定目录，不做全量扫描          | 与现有逻辑一致，指定目录后执行扫描。不做全量扫描。                       |          |

**User's choice:** 手动触发扫描，不主动

---

## 会话搜索范围和索引

### Q1: 会话搜索的定位是什么？

**User's choice:** (Free text) User asked to reconsider based on Sidebar redesign decisions. Analysis: search belongs in Project Inbox (project-scoped), not as a standalone global feature.

### Q2: Project Inbox 中每条会话项显示内容？

**User's choice:** (Free text) 名称 + 最后消息时间 + 状态 badge + AI 提供商；鼠标悬浮或移动端长按显示最后一条对话记录预览

### Q3: Project Inbox 里的会话列表搜索索引什么内容？

| Option                    | Description                                         | Selected      |
| ------------------------- | --------------------------------------------------- | ------------- |
| 全文搜索（消息内容）      | 全文搜索消息内容（需要索引建设、性能开销大）。      | ✓ (free text) |
| 只搜名称                  | 只搜索会话名称（用户自定义标题），轻量快速。        |               |
| 搜名称 + 最后一条消息预览 | 搜索名称 + 会话最后一条消息预览，方便用户识别内容。 |               |

**User's choice:** 全文搜索，后台异步完成索引建设

### Q4: 搜索情意出现方式？

| Option               | Description                                    | Selected |
| -------------------- | ---------------------------------------------- | -------- |
| 即时名称 + 防抖全文  | 先搜名称（即时），再搜全文（防抖后、少延迟）。 | ✓        |
| Real-time 输入即过滤 | 用户输入时即时显示过滤结果，无需回车。         |          |
| 回车提交搜索         | 用户回车或点搜索按钮才执行。                   |          |

**User's choice:** 即时名称 + 防抖全文

### Q5: 全文索引存储在哪里？

| Option                       | Description                                                                                                | Selected |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| SQLite FTS5 内置索引         | SQLite FTS5（内置全文搜索，无额外依赖），在现有 DB 里建索引表。Phase 2 范围内可实现。                      | ✓        |
| 索引文件系统中的原始历史文件 | 文件系统存储会话，Claude/Codex 把历史写 json/md 文件 — 建索引静态文件内容。直接索引原始文件，无需导入 DB。 |          |
| 全文索引延到后续阶段         | Phase 2 就只搜索名称，全文索引延到 Phase 3+。                                                              |          |

**User's choice:** SQLite FTS5 内置索引

---

## Workspace 删除级联行为

### Q1: 删除 Workspace 时，里面的会话怎么处理？

**User's choice:** (Free text)

1. 默认不启用多 workspace，不提供删除功能，只有删除项目，删除项目不触发本地数据变化，只是数据库中软删除
2. 启用多 workspace，删除 workspace 时会询问是否关联删除 worktree，如果否，worktree 就恢复为普通数据在 GitPanel 中显示，不再和 workspace 有关联

### Q2: 确认项目/Workspace 删除服务

| Option                       | Description                                                                                                        | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| 确认：项目软删除，数据不丢失 | 删除项目 = 软删除（DB 标记 deleted，本地文件不动），项目从列表移除但数据不丢失。已就的会话和历史也保留在归档区域。 | ✓        |
| 删除目标警告（就话数＋状态） | 删除项目对话时应该警告并给出确认物（就话数量、是否有未完成任务），设计上更谨慎。                                   |          |

**User's choice:** 确认：项目软删除，数据不丢失

---

## Claude's Discretion

- Tab open behavior when clicking sessions (single-click reuse vs new tab) — deferred pending Tab redesign discussion
- Exact freeze Badge visual design (icon, color, placement)
- FTS5 index update strategy (on-write vs periodic batch)
- Project Inbox sort order options (by time, by status, by name)
- Sidebar collapse behavior on mobile

## Deferred Ideas

- Tab visual redesign — current design doesn't match user expectations
- Idle auto-sleep / scheduled wake-up for frozen sessions
- Landing Page visual redesign — user stated current design is "ugly and chaotic"
- Rich Inbox evolution into kanban/multi-pane (Phase 5)

---

## Architecture Review Session — 2026-04-12 (Post-Discussion Consistency Pass)

> Triggered by: user-initiated review of inconsistencies between CONTEXT.md decisions and ROADMAP/REQUIREMENTS.
> All decisions below amend or supersede earlier decisions in this log.
> Corresponding changes applied to: CONTEXT.md, REQUIREMENTS.md, ROADMAP.md.

---

### Issue #1: 项目扫描方式（PROJ-01 / SC#1 矛盾）

**问题：** Roadmap SC#1 和 PROJ-01 写的是"系统自动发现项目"，但初次讨论决定了手动导入。

**User's choice:** (Free text) 用户手动添加项目，走完新建项目向导（3步）之后，系统自动扫描**该项目目录**下的已有会话历史。未来待手动流程成熟后，再考虑"批量导入建议"（适合本地项目较多的情况）作为可选功能引入。

**Impact:** PROJ-01 措辞更新为手动向导 + 创建后自动扫描。Roadmap SC#1 同步修改。批量导入建议列入 Deferred。

---

### Issue #2: Workspace CRUD 可见性（PROJ-02/03/05 / SC#3 矛盾）

**问题：** PROJ-05 和 SC#3 写的是"User can create/rename/delete Workspaces"（始终可用），但实际决策是默认隐式单 Workspace、opt-in 才显示多 Workspace 管理 UI。

**User's choice:** (Free text) 详细补充如下：

1. 默认每个项目 = 一个隐式 Workspace，不暴露任何 Workspace 管理 UI
2. New Project 时可主动选择启用多 Workspace（可选高级功能），启用后不可关闭
3. 默认 worktree 只在 GitPanel 显示；也可通过 GitPanel 将 worktree **提升**为 Workspace
4. Workspace 切换在 MainContent header 操作；Sidebar 底部也有区域展示当前 Workspace（类更新通知组件）
5. 启用多 Workspace 后，Project Inbox 中的会话卡片显示 worktree label

**还回答了 "为什么是 Workspace 而不是直接叫 Worktree"：**
Claude 解释：①抽象隔离（worktree 是 git 底层，Workspace 是会话管理上层）；②未来可扩展到非 git 场景；③操作边界不同（GitPanel 管 git，Project Inbox header 管活跃 Workspace）。用户用了"提升（promote）"这个词，自然验证了分层概念。

**Impact:** D-12~D-16 更新，PROJ-02/03/05 措辞修订，Roadmap SC#2/3 更新。

---

### Issue #3: SESS-03 措辞歧义

**问题：** "保留完整的上下文状态" 容易被误解为 VM 级进程快照恢复。

**User's choice:** A — 修正文案，明确"清醒入现场"而不是"快照恢复"。

**Impact:** SESS-03 改为"重启后端进程，展示对话摘要供用户手动决定，会话历史始终可读无需运行进程"。

---

### Issue #4: 导入含 worktree 的 git 项目处理

**问题：** 手动导入项目后，如果项目已有多个 worktree，PROJ-02 原文不清楚。

**User's choice:** A — 自动检测已有 worktree 并展示在 GitPanel；不自动变成 Workspace，用户手动提升。

**Impact:** D-28 新增，PROJ-02 措辞补充"自动检测展示于 GitPanel + 手动提升路径"。

---

### Issue #5: Sidebar 重构未在 Requirements 中覆盖

**问题：** Phase 2 最大的 UI 架构变化（Sidebar 整体重设计）在 Requirements 里没有任何对应条目，执行者无法用 requirements 验收。

**User's choice:** A — 新增 NAV-01~05 系列需求到 REQUIREMENTS，覆盖 Sidebar 结构、Project Inbox、Workspace 切换 UI。

**Impact:** REQUIREMENTS.md 新增 `### Navigation & App Shell` 章节，REQUIREMENTS 需求总数调整，Roadmap Phase 2 requirements 列表补充 NAV-01~05。

---

### Issue #6: Landing Page 与 Sidebar 最近会话的架构关系

**问题：** Phase 1 Landing Page (LAND-02/03) 和 Phase 2 Sidebar Top 都要展示"全局最近 10 个会话"，存在双重冗余或架构不清晰。

**User's choice:** (Free text) **移除 Landing Page**。最近会话列表是全局的，由 Sidebar 承担。

**追问：移除后应用启动进入什么页面？**
**User's choice:** A — 启动后 MainContent 是空白/欢迎占位页，Sidebar 内容（全局最近 + 项目列表）即为全部导航。

**收藏功能去向：**
**User's choice:** (Free text) 在 Project Inbox 里。Sidebar Top 只展示全局最近会话（不含收藏专区）。

**Impact:** LAND-01~07 整批移除（标记为 Superseded），替换为 NAV-01~05。D-09 更新（收藏在 Inbox，Sidebar Top 只显示最近）。D-27 新增（Landing Page 移除声明）。Phase 1 Roadmap 目标/SC 更新，去掉 Landing Page 相关 SC。

---

### Issue #7: Workspace 切换 UI 的 "or" 歧义（D-15）

**问题：** D-15 写的是 "via MainContent header **OR** a dedicated Sidebar section"，到底实现哪个？

**Claude 建议方案 C 的理由：** 类比 VS Code 底部状态栏显示分支名（被动看），切换分支点状态栏（同处操作）。Sidebar 底部 = 被动感知"我在哪个 Workspace"；MainContent header = 主动操作切换。

**User's choice:** 同意 C — Sidebar 底部展示当前 Workspace 名（常驻被动展示），MainContent header 提供切换下拉（操作入口）。

**Impact:** D-15 精确化为"方案 C"，NAV-05 需求条文对应更新。
