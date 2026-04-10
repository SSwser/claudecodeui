# Requirements: CloudCLI UI - Desktop UX Enhancement

**Defined:** 2026-04-10
**Core Value:** 清晰的组织管理 - 让用户能够轻松管理多个项目、workspace 和会话

## v1 Requirements

### Landing Page

- [ ] **LAND-01**: 应用启动时显示 Landing Page 而非直接进入会话
- [ ] **LAND-02**: Landing Page 显示最近访问的项目列表(最近 10 个)
- [ ] **LAND-03**: Landing Page 显示最近的会话列表(最近 10 个)
- [ ] **LAND-04**: 用户可以将项目或会话添加到收藏夹
- [ ] **LAND-05**: 收藏的项目和会话显示在专用区域,优先于最近列表
- [ ] **LAND-06**: 点击项目或会话可直接进入对应的会话视图
- [ ] **LAND-07**: 新建项目/会话的入口在 Landing Page 可见

### Project Management

- [ ] **PROJ-01**: 系统自动扫描并显示用户目录下的所有项目
- [ ] **PROJ-02**: 自动检测 git worktree,在项目选择界面显示所有工作树
- [ ] **PROJ-03**: 支持 Workspace 概念 - 同一项目可创建多个工作区
- [ ] **PROJ-04**: Workspace 包含独立的会话历史和配置
- [ ] **PROJ-05**: 用户可创建/重命名/删除 Workspace
- [ ] **PROJ-06**: 项目视图支持按名称/最近使用/收藏排序

### Session Management

- [ ] **SESS-01**: 用户可在 Workspace 内创建新会话
- [ ] **SESS-02**: 会话支持暂停/冻结操作,释放后台进程资源
- [ ] **SESS-03**: 冻结的会话可恢复,保留完整的上下文状态
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

- [ ] **UI-01**: 调研并选择合适的组件库(shadcn/ui 或其他)
- [ ] **UI-02**: 建立 CSS 变量系统用于主题定制
- [ ] **UI-03**: 审计现有 i18n 翻译键,创建映射文档
- [ ] **UI-04**: 渐进式替换基础组件(Button, Input, Dialog 等)
- [ ] **UI-05**: 新功能使用新组件库,旧组件逐步迁移
- [ ] **UI-06**: 组件迁移期间保持 CI 检查,防止硬编码字符串
- [ ] **UI-07**: 设置视觉回归测试,确保 UI 质量

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

| Feature | Reason |
|---------|--------|
| 移动端原生应用 | 仅做响应式 Web 适配,不开发独立 App |
| 多人协作/实时编辑 | 高复杂度,不是核心价值 |
| AI 模型训练或微调 | 仅使用现有 AI 提供商 API |
| 代码执行沙箱 | 依赖现有提供商安全机制 |
| 跨设备会话同步 | 本地优先,云端同步留待 Cloud 模式 |
| 分支合并(语义冲突) | 非结构化数据合并复杂,延后评估 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAND-01 | Phase 1 | Pending |
| LAND-02 | Phase 1 | Pending |
| LAND-03 | Phase 1 | Pending |
| LAND-04 | Phase 1 | Pending |
| LAND-05 | Phase 1 | Pending |
| LAND-06 | Phase 1 | Pending |
| LAND-07 | Phase 1 | Pending |
| LAY-01 | Phase 1 | Pending |
| LAY-02 | Phase 1 | Pending |
| LAY-03 | Phase 1 | Pending |
| LAY-04 | Phase 1 | Pending |
| LAY-05 | Phase 1 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| PROJ-04 | Phase 2 | Pending |
| PROJ-05 | Phase 2 | Pending |
| PROJ-06 | Phase 2 | Pending |
| SESS-01 | Phase 2 | Pending |
| SESS-02 | Phase 2 | Pending |
| SESS-03 | Phase 2 | Pending |
| SESS-04 | Phase 2 | Pending |
| SESS-05 | Phase 2 | Pending |
| SESS-06 | Phase 2 | Pending |
| SESS-07 | Phase 2 | Pending |
| SESS-08 | Phase 2 | Pending |
| VIRT-01 | Phase 3 | Pending |
| VIRT-02 | Phase 3 | Pending |
| VIRT-03 | Phase 3 | Pending |
| VIRT-04 | Phase 3 | Pending |
| VIRT-05 | Phase 3 | Pending |
| VIRT-06 | Phase 3 | Pending |
| VIRT-07 | Phase 3 | Pending |
| VIRT-08 | Phase 3 | Pending |
| VIRT-09 | Phase 3 | Pending |
| VIRT-10 | Phase 3 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |
| UI-07 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after initial definition*
