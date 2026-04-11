# 产品愿景分析：仓库直连 + AI + 本地部署

> 基于 2026-04-11 竞品调研结论，分析一个全新产品方向的可行性。

---

## 一、愿景概述

构建一个**完全可本地部署**的设计系统平台，核心差异化：

1. **开发仓库直接接入** — 不依赖 Storybook/Figma 中间件，AST 直接解析组件源码
2. **AI 驱动全链路** — Story 自动生成、Token 传播、设计审查、代码生成
3. **完全本地部署** — Docker Compose 开箱即用，支持本地 LLM

---

## 二、市场空白验证

### 所有竞品缺失的能力组合

| 能力                           | story.to.design | Supernova | Knapsack | 本产品 |
| ------------------------------ | --------------- | --------- | -------- | ------ |
| 直接解析源码（无需 Storybook） | ❌              | ⚠️ 部分   | ⚠️ 部分  | ✅     |
| AI 自动生成 Stories            | ❌              | ❌        | ❌       | ✅     |
| AI 组件代码生成                | ❌              | ❌        | ❌       | ✅     |
| AI Token 变更影响分析          | ❌              | ❌        | ❌       | ✅     |
| Figma Variables 绑定           | ❌              | ✅ 导入   | ✅       | ✅     |
| 完全本地部署                   | ❌              | ❌        | ❌       | ✅     |
| 本地 LLM 支持                  | ❌              | ❌        | ❌       | ✅     |

### 核心洞察

**没有任何竞品同时覆盖"仓库直连 + AI 全链路 + 本地部署"。**

原因分析：

- 现有竞品都是 **design-first**（从 Figma 开始），本产品是 **code-first**（从仓库开始）
- SaaS 模式使竞品不愿/无法提供本地部署（破坏 recurring revenue 模型）
- AI 能力需要深度组件理解，现有工具停留在截图/渲染层面

---

## 三、竞品模式 vs 本产品模式

### 现有竞品的数据流

```
设计师在 Figma 中设计
    → 导出 Token/Variables
    → 同步到代码仓库
    → 开发者实现组件
    → （可选）story.to.design 反向同步到 Figma
```

**问题：** 对于 code-first 团队（没有设计师，或设计能力嵌入开发中），这个流程是反直觉的。

### 本产品的数据流

```
开发者在代码仓库中开发
    → 平台自动分析组件、Token、变体
    → AI 生成 Storybook Stories + 组件预览
    → 自动同步到 Figma（Variables + 组件）
    → 设计师在 Figma 中微调
    → 变更自动回写代码
```

**优势：** 以代码为单一事实源（Single Source of Truth），设计跟随代码。

---

## 四、技术架构

```
┌────────────── 本产品（完全本地部署） ──────────────────┐
│                                                         │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │ 仓库引擎  │  │ 设计系统中心 │  │   AI 引擎    │      │
│  │          │  │             │  │              │      │
│  │ Git 集成  │  │ Token 管理   │  │ Story 生成   │      │
│  │ AST 解析  │  │ 组件目录     │  │ 代码生成     │      │
│  │ 变更检测  │  │ 文档平台     │  │ 设计审查     │      │
│  │ CI/CD    │  │ 版本管理     │  │ Token 传播   │      │
│  └──────────┘  └─────────────┘  └──────────────┘      │
│                                                         │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │ 设计集成  │  │ 代码自动化   │  │  协作层      │      │
│  │          │  │             │  │              │      │
│  │ Figma API│  │ CSS/Tailwind│  │ 实时编辑     │      │
│  │ Penpot   │  │ iOS/Android │  │ 评论/审批    │      │
│  │ 截图导入  │  │ Git PR      │  │ 权限管理     │      │
│  └──────────┘  └─────────────┘  └──────────────┘      │
│                                                         │
│  部署方式：Docker Compose / K8s / 单机二进制            │
│  AI 后端：云端 API || 本地 Ollama/vLLM（可选切换）      │
│  数据库：SQLite（单机）/ PostgreSQL（团队）             │
└─────────────────────────────────────────────────────────┘
```

### 核心模块详解

#### 1. 仓库引擎

- **Git 集成**：clone/pull 用户仓库，Watch 分支变更
- **AST 解析**：
  - React: `@babel/parser` + `@babel/traverse` 解析 JSX/TSX
  - Vue: `@vue/compiler-sfc` 解析 SFC
  - Angular: TypeScript AST + decorator 分析
- **组件发现**：自动识别组件定义、Props 接口、CVA variants、样式引用
- **Token 提取**：解析 CSS Variables、Tailwind config、SCSS variables

#### 2. AI 引擎

- **Story 生成**：分析 Props schema → 生成覆盖所有 variant×size 组合的 stories
- **代码生成**：从设计规格（Token + Layout）生成组件代码
- **设计审查**：截图对比 Figma 设计稿 → 标注像素级偏差
- **Token 传播**：修改一个 Token → 分析全代码库影响范围 → 生成批量修改 PR
- **LLM 路由**：优先本地 Ollama（隐私），fallback 到云端 API（质量）

#### 3. 设计系统中心

- **Token 管理**：可视化编辑器，支持 Collections、Themes、Aliases
- **组件目录**：从 AST 自动生成，展示 Props、Variants、实时预览
- **文档平台**：Markdown 编辑器 + 组件 Playground 嵌入
- **版本管理**：Git-based，每次变更可追溯

---

## 五、AI 能力 vs Supernova 对比

| 能力               | Supernova AI          | 本产品 AI                  |
| ------------------ | --------------------- | -------------------------- |
| 原型生成           | ✅ 从描述生成页面原型 | ✅ + 从现有组件组合        |
| 文档写作           | ✅ PRD/产品文档       | ✅ + 组件 API 文档自动生成 |
| 设计系统问答       | ✅ 搜索设计系统数据   | ✅ + 搜索代码实现          |
| **Story 自动生成** | ❌                    | ✅ 分析源码→写 stories     |
| **组件代码生成**   | ❌（原型级别）        | ✅ 生产级组件代码          |
| **Token 变更传播** | ❌                    | ✅ 全库影响分析            |
| **设计审查**       | ❌                    | ✅ 截图对比+偏差标注       |
| **本地 LLM**       | ❌（仅云端）          | ✅ Ollama/vLLM             |
| **MCP Server**     | ✅ 远程               | ✅ 本地+远程               |

---

## 六、目标用户画像

### 画像 1：Code-First 中小团队

- 3-15 人，无专职设计师
- 开发者兼任 UI 设计
- 不想手动维护 Figma 文件
- **痛点**：代码是事实源但缺少可视化设计交付物

### 画像 2：中国企业/政府/金融

- 数据不能出境
- 无法使用海外 SaaS
- 需要内网部署
- **痛点**：没有合规的设计系统管理工具

### 画像 3：大型企业设计系统团队

- 50+ 开发者使用设计系统
- 需要严格的 Token Governance
- 使用 Penpot 或其他自托管设计工具
- **痛点**：Supernova/Knapsack 太贵且数据锁定

---

## 七、商业模式

### 定价策略

| 版本        | 价格      | 目标                           |
| ----------- | --------- | ------------------------------ |
| Community   | 免费      | 个人/开源项目，3 人以下        |
| Team        | $29/人/月 | 中小团队，基础 AI + Git 集成   |
| Enterprise  | $59/人/月 | 大团队，全量 AI + SSO + 审批流 |
| Self-Hosted | 按年授权  | 数据合规需求，私有部署         |

### 与竞品价格对比

- story.to.design: $149/月（团队） — 功能单一
- Supernova Pro: $20-35/人/月 — 功能全面但 SaaS
- Knapsack: 5 位数年费起 — 纯企业
- **本产品 Team $29/人/月**：比 Supernova 略低，功能覆盖更广（含 AI Story/Code Gen + 本地部署选项）

---

## 八、MVP 路径

### Phase 1（1-2 月）：仓库引擎 + Token 管理

- [ ] Git 仓库接入（clone + watch）
- [ ] React 组件 AST 解析（Props/Variants 提取）
- [ ] CSS Variables 提取 + 可视化 Token 管理器
- [ ] Web UI（React + Tailwind，复用 ClaudecodeUI 架构）
- [ ] Docker Compose 部署

### Phase 2（1 月）：AI Story 生成 + 预览

- [ ] 组件分析 → AI 生成 Storybook stories
- [ ] 内置 Storybook-like 预览器
- [ ] 截图服务（Playwright）

### Phase 3（1 月）：设计系统中心 + Figma 集成

- [ ] Token 编辑器（可视化修改并回写 CSS/Tailwind）
- [ ] Figma Variables 同步（REST API 脚本）
- [ ] 组件文档自动生成

### Phase 4（持续）：AI 增强 + 生态

- [ ] 组件代码生成（从设计规格）
- [ ] 设计审查（截图对比）
- [ ] Token 变更影响分析
- [ ] MCP Server（远程 + 本地）
- [ ] Vue/Angular 支持

---

## 九、风险与缓解

| 风险                         | 概率 | 影响 | 缓解                                   |
| ---------------------------- | ---- | ---- | -------------------------------------- |
| AI Story 生成质量不足        | 中   | 高   | 提供手动编辑+AI 建议模式               |
| AST 解析覆盖不全（各种写法） | 中   | 中   | 优先 TypeScript+CVA 模式，渐进支持更多 |
| Figma API 变更               | 低   | 中   | 抽象 adapter 层，同时支持 Penpot       |
| 本地 LLM 质量不够            | 中   | 中   | 默认云端 API，本地 LLM 标注"beta"      |
| 竞品跟进本地部署             | 低   | 中   | 先发优势 + 开源社区建设                |
