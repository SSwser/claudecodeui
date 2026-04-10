# CloudCLI UI - 桌面端 UX 改进

## What This Is

CloudCLI UI 是一个多 AI 提供商的编码助手桌面应用,支持 Claude、Codex、Cursor 和 Gemini。当前版本提供基础的会话管理和项目交互功能。本次改进聚焦于桌面端用户体验,通过更清晰的组织结构、创新的虚拟会话机制和现代化的 UI 组件,解决多项目、多会话管理中的痛点。

## Core Value

**清晰的组织管理** - 让用户能够轻松管理多个项目、workspace 和会话,快速找到需要的对话,高效地在不同工作上下文间切换。如果只能做好一件事,就是让项目和会话的组织结构一目了然。

## Requirements

### Validated

以下是现有代码库已实现的核心能力:

- ✓ 多 AI 提供商支持(Claude、Codex、Cursor、Gemini) - existing
- ✓ WebSocket 实时通信和会话管理 - existing
- ✓ React SPA 前端 + Express 后端架构 - existing
- ✓ JWT 认证和用户管理 - existing
- ✓ 文件系统监控和项目扫描 - existing
- ✓ MCP (Model Context Protocol) 插件系统 - existing
- ✓ 终端模拟和 shell 会话支持 - existing
- ✓ 代码编辑器集成(CodeMirror) - existing
- ✓ 国际化支持(i18next) - existing
- ✓ SQLite 数据持久化 - existing

### Active

v1 版本目标(组织管理 + 虚拟会话 + UI 重构):

- [ ] **Landing Page** - 应用启动时显示最近项目和会话,支持收藏功能快速访问
- [ ] **项目/Workspace 管理** - 自动检测 git worktree,在项目选择界面显示所有工作树,支持 workspace 概念
- [ ] **虚拟会话机制** - 混合模式:默认透明自动分支(上下文即将超限时自动 branch),用户可查看时间线和手动管理分支
- [ ] **会话暂停/冻结** - 释放后台进程资源,保留会话状态供后续恢复
- [ ] **多 Tab 管理** - 在同一窗口内支持多个会话 tab,方便快速切换
- [ ] **UI 组件库迁移** - 调研并迁移到 shadcn/ui 或类似的现代化组件库,提升整体视觉体验

v2+ 版本目标(多视图和扩展能力):

- [ ] **多窗口平铺视图** - 支持将多个会话像监视器一样平铺显示(1x1, 2x2, 1x3 等布局),用于任务监控
- [ ] **看板视图** - 卡片式管理会话,支持任务看板和待处理队列,集成快速回复组件(类似 AskUserQuestion)
- [ ] **Workspace 泳道** - 在看板视图中为每个 workspace 分配独立泳道
- [ ] **移动端适配** - 响应式设计,支持移动设备访问(简化版功能)
- [ ] **桌面端打包** - 支持本地模式(内置服务端)和 Cloud 模式(连接云端服务)双模式交付

### Out of Scope

- 移动端原生应用 - 仅做响应式 Web 适配,不开发独立 App
- 多人协作功能 - 当前聚焦单用户体验,协作功能留待后续评估
- AI 模型训练或微调 - 仅使用现有 AI 提供商的 API,不涉及模型层面工作
- 代码执行沙箱 - 依赖现有提供商的安全机制,不自建沙箱环境

## Context

**技术环境:**
- 前端: React 18 + TypeScript + Vite + Tailwind CSS
- 后端: Node.js 22 + Express + SQLite
- 实时通信: WebSocket (ws)
- 当前 UI: 基础组件,需要现代化升级

**用户痛点(来自实际使用):**
- 会话查找困难 - 在多个项目间切换时找不到之前的对话
- 多会话监控不便 - 需要同时关注多个会话进展,来回切换很麻烦
- 资源占用问题 - 长时间运行的会话占用资源,但又不想关闭
- 组织结构混乱 - 项目和会话的组织结构不清晰

**核心创新:**
- **虚拟会话机制** - 用户看到连续的对话流,系统在后台自动管理多个物理会话。上下文即将超限时自动 branch 并压缩,用户可基于历史时间线回溯信息和分支测试。默认透明运行,但提供可视化界面查看和管理分支结构。

**已有基础:**
- 完整的多提供商抽象层
- 成熟的 WebSocket 实时通信
- 文件系统监控和项目扫描能力
- 插件系统和 MCP 支持

## Constraints

- **技术栈**: 保持 React + Express 架构,不引入新的框架(如 Next.js)
- **兼容性**: 必须向后兼容现有的提供商适配器和数据库结构
- **性能**: 虚拟会话的自动分支不能影响用户感知的响应速度
- **渐进式**: UI 迁移需要支持渐进式替换,不能一次性重写所有组件
- **数据迁移**: 新的会话管理机制需要提供从现有数据的平滑迁移路径

## 技术决策(研究结果)

**推荐技术栈:**
- **布局**: CSS Grid (原生,无包体积成本) + LayoutContext
- **状态**: Context + Immer (匹配现有架构模式,~6KB)
- **拖拽**: @dnd-kit (React 18 原生,无障碍,~20KB)
- **虚拟化**: react-window (100+ 看板卡片时可选)

**关键风险缓解:**
- Zustand Store 需实现 LRU 驱逐策略(max 50 sessions)
- WebSocket 多 Tab 需实现 tab 标识和乐观更新
- 虚拟会话需在自动分支前显示分支指示器
- UI 迁移需先审计 i18n 翻译键

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 核心价值定位为"组织管理" | 基于实际使用痛点,多项目/会话管理是最突出的问题 | ✓ Confirmed |
| v1 包含 UI 组件库迁移 | 研究确认新功能需要现代化 UI 支撑,同步进行避免二次重构 | ✓ Confirmed |
| 虚拟会话采用混合模式 | 研究确认默认透明降低认知负担,可视化管理满足高级用户需求 | ✓ Confirmed |
| 移动端分阶段开发 | 研究建议先桌面端,移动端体验延后(v2+) | ✓ Confirmed |
| 桌面端支持双模式打包 | 研究确认本地+Cloud 双模式满足不同用户场景 | ✓ Confirmed |
| CSS Grid 用于多窗口布局 | 研究确认优于 iframe/原生窗口,无同步复杂度 | ✓ Confirmed |
| @dnd-kit 用于拖拽 | 研究确认 React 18 原生支持,无障碍高性能 | ✓ Confirmed |
| Context + Immer 状态管理 | 研究确认匹配现有架构,避免 Redux 过度设计 | ✓ Confirmed |

## Evolution

本文档在阶段转换和里程碑边界时演进。

**每次阶段转换后** (通过 `/gsd-transition`):
1. 需求失效? → 移至 Out of Scope 并说明原因
2. 需求验证? → 移至 Validated 并标注阶段
3. 新需求出现? → 添加到 Active
4. 需要记录的决策? → 添加到 Key Decisions
5. "What This Is" 仍然准确? → 如有偏离则更新

**每次里程碑后** (通过 `/gsd-complete-milestone`):
1. 全面审查所有章节
2. Core Value 检查 - 优先级是否仍然正确?
3. 审计 Out of Scope - 原因是否仍然有效?
4. 更新 Context 反映当前状态

---
*Last updated: 2026-04-10 after initialization*
