# Builder.io — 竞品深度研究报告

> 最后更新: 2026-07  
> 数据来源: builder.io 官网、定价页、Fusion 产品页  
> 验证状态: ✅ 已验证

## 产品概述

| 字段     | 内容                                                                       |
| -------- | -------------------------------------------------------------------------- |
| 产品名称 | Builder.io                                                                 |
| 官网     | https://www.builder.io                                                     |
| 定位     | AI product development platform for your real codebase and design system   |
| 主要产品 | **Fusion** (Visual IDE / 代码生成) + **Publish** (Visual CMS / 页面构建器) |
| 安全认证 | SOC 2 Type II                                                              |
| 知名客户 | Zapier, Everlane, J.Crew, ClickUp, Panasonic, Schneider Electric, Vimeo    |

## 产品体系

### Fusion — Visual IDE

核心定位: "One platform for design and code, powered by your design system and production code"

#### 工作流程

1. **Connect** — 连接 GitHub/GitLab/Bitbucket 仓库 + Figma 文件
2. **Generate & Edit** — AI 实时构建 UI，支持可视化编辑
3. **Ship** — 生成 PR、预览链接、或导出代码到本地开发
4. **Workflow Integration** — 支持 @mention Builder in Slack / Jira ticket 分配

#### 连接方式

- GitHub / GitLab / Bitbucket 仓库连接
- Figma 导入
- MCP Servers
- Cursor 扩展
- VS Code 扩展

#### 支持的框架和样式

| 类别       | 支持                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| 框架       | React, React Native, Vue, Svelte, Qwik, Angular, Solid, HTML, Flutter, Kotlin, SwiftUI |
| 样式       | Tailwind CSS, Material UI, Emotion, CSS Modules                                        |
| TypeScript | 可切换开关                                                                             |

### Publish — Visual CMS

- 拖拽式页面构建器
- 无头 CMS
- 多品牌 CMS 支持
- 适用于营销网站和落地页

## Design-to-Code 特性

### Figma Plugin

- 将 Figma 设计转换为高质量、可访问的代码
- 自动响应式设计（即使 Figma 中没有使用 auto-layout）
- **组件映射**: Figma 组件 ↔ 代码组件同步
- **Design Token 连接**: 连接到 CSS Variables
- 号称 "50-80% reduced development timelines"（beta 反馈数据）

### AI 迭代

- 支持对话式代码精细调整
- Enterprise 客户可选择/接入**自有 LLM**

### 工作流集成

- Figma → Cursor
- Figma → Windsurf
- Figma → Lovable
- Figma → Storybook

## 定价详情

### Fusion 定价 (月付)

| 方案           | 价格        | 用户上限 | Agent Credits         | 核心特性                                                                                        |
| -------------- | ----------- | -------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| **Free**       | $0/user/mo  | 5 人     | 60/月, 15/日上限      | GitHub/GitLab/Bitbucket 连接, Figma 插件, VS Code 扩展, 仅管理员角色                            |
| **Pro**        | $24/user/mo | 5 人     | 500/月 (额外 $25/500) | 按量付费扩展, 信用积分结转, 30天历史, 内置 MCP, 标准支持                                        |
| **Team**       | $40/user/mo | 20 人    | 500/月 (额外 $25/500) | AI 训练退出, Slack/JIRA Agent, 多角色, 评论/评审, 自定义 MCP, 密码保护预览, 使用指标, 优先支持  |
| **Enterprise** | 自定义      | 自定义   | 自定义                | Bitbucket/GitLab Enterprise, Azure DevOps, Design System Intelligence, SSO, RBAC, SLA, 入职支持 |

### Agent Credit 说明

- Agent Credit 是 Builder 统一的 AI 用量指标
- 每个 Credit 代表固定美元值，覆盖底层模型成本 + Builder 服务利润
- Pro/Team: 额外 500 credits = $25/月
- Free 用途: 25 credits/日, 75 credits/月总上限

### 关键差异点

- **Free → Pro**: 主要增加 Agent 使用量和 MCP 服务器
- **Pro → Team**: 增加协作功能 (评论、评审) 和工作流集成 (Slack/JIRA)
- **Team → Enterprise**: 安全治理 (SSO, RBAC, 隐私模式) 和企业级 Git 支持

## 技术架构分析

### 创新点

1. **Design System Intelligence** (Enterprise): 自动识别和映射设计系统
2. **Component Mapping**: Figma 组件 ↔ 代码组件双向映射
3. **多框架输出**: 单一设计 → 多框架代码
4. **Enterprise LLM 选择**: 客户可接入自有 LLM

### 技术限制

- **纯 SaaS** — 无本地部署选项
- **AI Credit 驱动** — 重度使用成本可能快速上升
- 组件映射仍需 Figma Plugin 中间层
- 对已有代码库的"理解"深度取决于仓库连接和索引质量

## 与我们产品愿景的关系

### 竞争维度

| 维度              | 重叠度 | 说明                                                 |
| ----------------- | ------ | ---------------------------------------------------- |
| 仓库连接          | 🔴 高  | 支持 GitHub/GitLab/Bitbucket 连接                    |
| 设计→代码         | 🔴 高  | 核心功能之一                                         |
| 代码→设计         | 🟡 中  | 主要方向是设计→代码，代码→设计为辅                   |
| AI 驱动           | 🔴 高  | AI-first 平台                                        |
| 本地部署          | 🟢 低  | 纯 SaaS，无自托管                                    |
| Design Token 同步 | 🟡 中  | 支持 CSS Variables 连接，但不是完整的 token 同步平台 |

### 差异化机会

1. **本地部署** — Builder.io 完全依赖云端，对数据敏感团队不可用
2. **代码→设计方向** — Builder.io 侧重设计→代码，我们双向
3. **Token 全生命周期管理** — Builder.io 的 token 支持有限
4. **开源核心** — Builder.io 闭源，Community Edition 可形成差异

### 潜在威胁

- Builder.io 资金充足、客户基础庞大
- 如果他们加入本地部署选项 → 直接竞争我们的差异化点
- Fusion 产品的"仓库连接"体验如果优化得好 → 减少我们的存在意义
- Agent Credit 模式成熟后可能被效仿

## 关键洞察

1. **Builder.io 验证了"连接仓库 + AI 生成"市场有价值** — 已有 Zapier/ClickUp 等大客户
2. **$24/user/mo 的 Pro 定价为市场定了基线**
3. **Agent Credit 模式值得研究** — 可能是 AI 工具定价的趋势
4. **"Design System Intelligence" 概念可借鉴** — Enterprise 愿意为此付费
5. **多框架输出是强需求** — 我们也应考虑

## 需要继续跟踪的问题

- [ ] Fusion 实际代码生成质量如何？（需要试用验证）
- [ ] Agent Credit 在实际使用中消耗速度？
- [ ] Design System Intelligence 的技术实现和效果？
- [ ] 是否有本地部署的路线图？
- [ ] Publish 和 Fusion 结合使用时的工作流体验？
