# Requirements: CloudCLI UI - Desktop UX Enhancement

**Defined:** 2026-04-10
**Core Value:** 清晰的组织管理 - 让用户能够轻松管理多个项目、workspace 和会话

## v1 Requirements

### Navigation & App Shell

> Note: The Landing Page concept (LAND-01 through LAND-07) was removed during Phase 2 architecture review (2026-04-12). The Sidebar redesign and Project Inbox replace the Landing Page as the primary navigation surface.

- [ ] **NAV-01**: 应用启动后 MainContent 显示欢迎/空白占位页面；Sidebar 为主导航区
- [ ] **NAV-02**: Sidebar 重构为两区块：顶部显示全局最近 10 条会话（点击直接进入聊天）；底部显示项目列表（名称+活跃状态指示）
- [ ] **NAV-03**: 最近会话列表支持收藏置顶，收藏在 Project Inbox 内管理（非全局 Sidebar）
- [ ] **NAV-04**: 点击项目后 MainContent 切换为 Project Inbox（简化 Inbox 风格：会话列表、状态 Badge、时间戳、AI 提供商图标、搜索、CRUD）
- [ ] **NAV-05**: 启用多 Workspace 时，Sidebar 底部展示当前活跃 Workspace 名称（被动展示）；MainContent header 提供 Workspace 切换下拉操作

### Landing Page (Removed)

> **SUPERSEDED** — LAND-01 through LAND-07 were replaced by NAV-01 through NAV-05 and Project Management requirements, effective 2026-04-12.

### Project Management

- [ ] **PROJ-01**: 用户通过手动向导（3 步）创建或导入项目；项目创建/导入成功后，系统自动扫描该项目目录下的已有会话历史
- [ ] **PROJ-02**: 导入含 git worktree 的项目时，自动检测已有 worktree 并在 GitPanel 中展示；用户可从 GitPanel 手动将 worktree 提升为 Workspace（仅当项目已启用多-Workspace 模式）
- [ ] **PROJ-03**: 可选的多-Workspace 模式：在项目创建时启用（不可逆），同一项目可创建多个 Workspace（每个对应一个 git worktree）
- [ ] **PROJ-04**: Workspace 包含独立的会话历史和配置（决策-14/D-16）
- [ ] **PROJ-05**: 当多-Workspace 模式启用时，用户可在该项目内创建/重命名/删除 Workspace
- [ ] **PROJ-06**: 项目视图支持按名称/最近使用/收藏排序

### Session Management

- [ ] **SESS-01**: 用户可在 Workspace 内创建新会话
- [ ] **SESS-02**: 会话支持冰结操作：安全 kill 后台进程（包括 Windows 进程树），释放系统资源
- [ ] **SESS-03**: 冰结的会话可恢复：重启后台进程，展示对话摘要供用户手动决定继续方向（对话历史始终可读，不需要进程）
- [ ] **SESS-04**: 用户可归档(archive)不再需要但想保留的会话
- [ ] **SESS-05**: 用户可删除会话,确认后永久移除
- [ ] **SESS-06**: 会话列表支持搜索(按名称或内容)
- [ ] **SESS-07**: 多 Tab 管理 - 同一窗口支持多个会话 Tab
- [ ] **SESS-08**: Tab 切换保留各自的位置和滚动状态

### Virtual Sessions

- [ ] **VIRT-01**: 系统追踪每个会话的上下文使用量
- [ ] **VIRT-02**: 上下文接近限制时(80%),显示警告提示用户
- [ ] **VIRT-03**: 上下文即将超限时,自动创建分支(透明对用户)
- [ ] **VIRT-04**: 自动分支保留历史消息,开始新的对话流
- [ ] **VIRT-05**: 用户可查看会话分支时间线(类似 Git)
- [ ] **VIRT-06**: 用户可切换到任意历史分支继续对话
- [ ] **VIRT-07**: 用户可手动创建分支(从当前或历史点)
- [ ] **VIRT-08**: 用户可命名/备注分支,便于识别
- [ ] **VIRT-09**: 上下文压缩策略:滑动窗口 + 摘要 + 剪枝组合
- [ ] **VIRT-10**: 关键上下文(变量声明、import)受保护不被压缩

### UI Component Library

- [x] **UI-01**: 调研并选择合适的组件库(shadcn/ui 或其他)
- [x] **UI-02**: 建立 CSS 变量系统用于主题定制
- [x] **UI-03**: 审计现有 i18n 翻译键,创建映射文档
- [x] **UI-04**: 渐进式替换基础组件(Button, Input, Dialog 等)
- [x] **UI-05**: 新功能使用新组件库,旧组件逐步迁移
- [x] **UI-06**: 组件迁移期间保持 CI 检查,防止硬编码字符串
- [x] **UI-07**: 设置视觉回归测试,确保 UI 质量

### Layout Infrastructure

- [ ] **LAY-01**: 创建 LayoutContext 管理视图模式
- [ ] **LAY-02**: 实现 CSS Grid 布局容器
- [ ] **LAY-03**: 支持单视图/双视图布局切换
- [ ] **LAY-04**: 布局配置持久化到 localStorage
- [ ] **LAY-05**: 视图模式切换器 UI

## v2 Requirements

### Multi-Pane Views

- **MPAN-01**: 支持多窗格布局(1x1, 2x2, 1x3 等)
- **MPAN-02**: 每个窗格渲染独立的会话界面
- **MPAN-03**: 窗格可调整大小
- **MPAN-04**: 窗格布局持久化

### Kanban Views

- **KBN-01**: 看板视图支持卡片式会话管理
- **KBN-02**: 支持泳道(按 Workspace 分组)
- **KBN-03**: 拖拽卡片改变会话状态
- **KBN-04**: 待处理队列显示需要用户回复的会话
- **KBN-05**: 快速回复组件(类似 AskUserQuestion)

### Performance & Polish

- **PERF-01**: 100+ 卡片时启用虚拟化渲染
- **PERF-02**: 多 ChatInterface 实例性能优化
- **PERF-03**: 会话状态跨 Tab 同步(BroadcastChannel)

### Mobile & Desktop

- **MOBI-01**: 响应式设计,支持移动设备
- **MOBI-02**: 移动端简化版功能(查看/回复)
- **DESK-01**: 桌面端打包(本地模式)
- **DESK-02**: 桌面端打包(Cloud 模式)

## Out of Scope

| Feature            | Reason                             |
| ------------------ | ---------------------------------- |
| 移动端原生应用     | 仅做响应式 Web 适配,不开发独立 App |
| 多人协作/实时编辑  | 高复杂度,不是核心价值              |
| AI 模型训练或微调  | 仅使用现有 AI 提供商 API           |
| 代码执行沙箱       | 依赖现有提供商安全机制             |
| 跨设备会话同步     | 本地优先,云端同步留待 Cloud 模式   |
| 分支合并(语义冲突) | 非结构化数据合并复杂,延后评估      |

## Traceability

| Requirement             | Phase       | Status                               |
| ----------------------- | ----------- | ------------------------------------ |
| NAV-01                  | Phase 2     | Pending                              |
| NAV-02                  | Phase 2     | Pending                              |
| NAV-03                  | Phase 2     | Pending                              |
| NAV-04                  | Phase 2     | Pending                              |
| NAV-05                  | Phase 2     | Pending                              |
| LAND-01 through LAND-07 | **Removed** | Superseded by NAV-01~05 (2026-04-12) |
| LAY-01                  | Phase 1     | Pending                              |
| LAY-02                  | Phase 1     | Pending                              |
| LAY-03                  | Phase 1     | Pending                              |
| LAY-04                  | Phase 1     | Pending                              |
| LAY-05                  | Phase 1     | Pending                              |
| PROJ-01                 | Phase 2     | Pending                              |
| PROJ-02                 | Phase 2     | Pending                              |
| PROJ-03                 | Phase 2     | Pending                              |
| PROJ-04                 | Phase 2     | Pending                              |
| PROJ-05                 | Phase 2     | Pending                              |
| PROJ-06                 | Phase 2     | Pending                              |
| SESS-01                 | Phase 2     | Pending                              |
| SESS-02                 | Phase 2     | Pending                              |
| SESS-03                 | Phase 2     | Pending                              |
| SESS-04                 | Phase 2     | Pending                              |
| SESS-05                 | Phase 2     | Pending                              |
| SESS-06                 | Phase 2     | Pending                              |
| SESS-07                 | Phase 2     | Pending                              |
| SESS-08                 | Phase 2     | Pending                              |
| VIRT-01                 | Phase 3     | Pending                              |
| VIRT-02                 | Phase 3     | Pending                              |
| VIRT-03                 | Phase 3     | Pending                              |
| VIRT-04                 | Phase 3     | Pending                              |
| VIRT-05                 | Phase 3     | Pending                              |
| VIRT-06                 | Phase 3     | Pending                              |
| VIRT-07                 | Phase 3     | Pending                              |
| VIRT-08                 | Phase 3     | Pending                              |
| VIRT-09                 | Phase 3     | Pending                              |
| VIRT-10                 | Phase 3     | Pending                              |
| UI-01                   | Phase 4     | Complete                             |
| UI-02                   | Phase 4     | Complete                             |
| UI-03                   | Phase 4     | Complete                             |
| UI-04                   | Phase 4     | Complete                             |
| UI-05                   | Phase 4     | Complete                             |
| UI-06                   | Phase 4     | Complete                             |
| UI-07                   | Phase 4     | Complete                             |

**Coverage:**

- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---

_Requirements defined: 2026-04-10_
_Last updated: 2026-04-10 after roadmap creation_
