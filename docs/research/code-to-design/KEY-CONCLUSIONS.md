# 关键结论与技术发现

> 按 topic 分类记录讨论中的重要发现、技术验证结果和决策依据。
> 每个 topic 标注置信度：✅ 已验证 | ⚠️ 需进一步确认 | ❌ 已否定

---

## Topic 1：Figma Pro 版 API 能力边界

### 已验证结论 ✅

1. **Figma Variables REST API 在 Pro 版可用**
   - 端点: `POST /v1/files/:key/variables`
   - 可创建 Variable Collections、Variables、Modes
   - 可设置 Light/Dark 模式值
   - 验证方式：官方文档确认

2. **Code Connect 需要 Organization/Enterprise 计划**
   - Pro 版不支持 Code Connect (将代码片段关联到 Figma 组件的功能)
   - 验证方式：Figma 官方文档明确标注

3. **REST API 无法创建视觉节点**
   - Frame、Rectangle、Text、Component 等节点只能通过 Plugin API 创建
   - Plugin API 只能在 Figma 客户端（桌面/Web）中运行
   - 这是所有 code→Figma 自动化方案的根本瓶颈
   - 验证方式：Figma API 文档，无写入端点

4. **Desktop MCP 仅支持只读操作**
   - 地址: `http://127.0.0.1:3845/mcp`
   - 6 个工具: get_metadata, get_design_context, get_screenshot, get_variable_defs, create_design_system_rules, get_figjam
   - 验证方式：实际连接测试

5. **@figma/mcp 包不存在**
   - npm 上找不到 `@figma/mcp`
   - 网上提到的 writable MCP 是第三方或未发布的
   - 验证方式：`npm search @figma/mcp` 返回空

---

## Topic 2：CSS → Figma Variables 同步工具链

### 已验证结论 ✅

1. **没有成熟的 CSS Variables → Figma Variables 一步到位工具**
   - 搜索了 npm 上所有相关包
   - 现有工具要么方向相反（Figma→CSS），要么只做格式转换

2. **现有工具定位**
   - `@divriots/style-dictionary-to-figma`: Style Dictionary → Figma JSON 中间格式（不推送到 Figma）
   - `figma-token-engine`: Figma → 代码（反方向）
   - `@tokens-studio/sd-transforms`: Tokens Studio ↔ Style Dictionary 格式转换
   - 这些工具可以组合使用但无法一步完成

3. **推荐方案：自定义 Node.js 脚本直接调 REST API**
   - 解析 CSS Variables → 构造 API payload → POST 到 Figma
   - 需处理 HSL→RGB 转换（Figma Variables 用 RGBA 0-1 范围）
   - 技术风险低，1-2 天可完成

### 待确认 ⚠️

4. **Tokens Studio Figma 插件 + GitHub JSON 同步方案**
   - 理论可行：项目中维护一份 design-tokens.json → Git push → Tokens Studio 自动拉取
   - 但未实际测试 Tokens Studio Pro 的 GitHub Sync 功能
   - 且 Tokens Studio Pro 有额外月费

---

## Topic 3：从代码生成 Figma 组件的可行路径

### 已验证结论 ✅

1. **html.to.design 可以从 localhost URL 导入**
   - 免费 10 次/月
   - 生成 hex 值不绑定 Figma Variables
   - 层结构较扁平
   - 验证方式：官方文档确认

2. **story.to.design 需要现有 Storybook**
   - 价格 $149/月
   - 连接 Storybook URL → 选择组件 → 生成 Figma 组件
   - 生成质量高：auto-layout、嵌套组件检测
   - 但 Token 功能仅 Alpha（只支持 Color → Figma Styles，不支持 Variables）
   - 验证方式：官网 + 博客文章

3. **我们项目没有 Storybook**
   - grep 确认：无 `storybook` 依赖，无 `.stories.` 文件
   - 加装 Storybook 需要：安装依赖 + 为每个组件写 stories
   - 4 个核心组件（Button/Badge/Input/Textarea）约 1 天编写

### 关键发现 ✅

4. **AI 理解组件并生成 Figma 表达的 5 个技术难点**
   - Tailwind 工具类 → Figma 属性映射（无标准方案）
   - Alpha 透明度语义（`bg-card/80` 的 `/80` 是 opacity）
   - 变体命名约定（CVA variant key → Figma Component Property）
   - CVA default variant 的隐式处理
   - 伪状态映射（hover/focus/active → Figma interaction states）

---

## Topic 4：story.to.design 产品分析

### 已验证结论 ✅

1. **产品持续活跃**
   - 最新博文 2026-03-05
   - 11,000+ 用户，1,000,000+ 变体已生成
   - 支持 Storybook 10（2025-11 发布）

2. **Design Token 功能停滞 3 年**
   - 2023-01 发布 Token 支持（Alpha）
   - 至今仍只支持 CSS color → Figma Styles
   - 不支持 Figma Variables API
   - 不支持 spacing/radius/typography
   - 博文提到"希望很快支持 W3C Tokens 和 Style-Dictionary" — 3 年后仍未兑现

3. **核心能力边界清晰**
   - 强：Storybook → Figma 组件生成（中游）
   - 弱：上游（无 Story 自动生成）、下游（无 Variable 绑定）

---

## Topic 5：Supernova.io 平台深度分析

### 已验证结论 ✅

1. **定位已从"设计系统文档"转型为"Vibe coding for enterprise"**
   - 两大产品线：Design System Platform + Portal（AI 原型）
   - 融合了 Lovable/v0（原型）+ ChatPRD（文档）+ Zeroheight（文档）的能力

2. **价格体系**
   - Free: $0（5 用户，600/天 AI credits）
   - Pro: Builder $20/月, Full $35/月
   - Enterprise: 定制

3. **"Codebase behind VPN" ≠ 本地部署**
   - Enterprise 特性中的此项仅指：允许 Supernova 通过 VPN 隧道访问客户内网代码
   - 平台本身仍然是 SaaS，数据存在 Supernova 云端
   - 验证方式：pricing 页面特性对比 + enterprise 页面无任何 self-hosted 措辞

4. **Remote MCP Server 是新亮点**
   - Free: 1000 函数调用/月
   - Pro: 100,000 函数调用/月
   - 让外部 AI 工具（Claude Code 等）可以读取设计系统数据

5. **代码自动化覆盖全栈**
   - Figma Variables → CSS/Tailwind/Swift/Android/自定义格式
   - 支持 GitHub/GitLab/Bitbucket/Azure DevOps PR 自动化
   - 有 SDK、CLI、VS Code 扩展

---

## Topic 6：本地部署市场空白

### 已验证结论 ✅

1. **所有主流设计系统平台都是纯 SaaS**
   - Supernova: SaaS ✅ 本地 ❌
   - Knapsack: SaaS ✅ 本地 ❌
   - story.to.design: Figma 插件 ✅ 本地 ❌
   - Builder.io: SaaS ✅ 本地 ❌
   - Zeroheight: SaaS ✅ 本地 ❌

2. **为什么没人做本地部署**
   - 设计系统平台依赖 Figma API（Figma 是 SaaS）
   - 协作实时同步需要中心化服务器
   - AI 功能依赖云端大模型 API
   - 市场主力客户（美国企业）普遍接受 SaaS

3. **为什么现在可以做**
   - Penpot（开源设计工具）成熟度提升，可替代 Figma
   - 本地 LLM 技术成熟（Ollama、vLLM、llama.cpp）
   - 中国市场数据合规需求强烈
   - Air-gapped 环境刚需（军工、金融、政府）

---

## Topic 7：产品机会 — 差异化定位

### 分析结论 ✅

1. **上游空白：AI 自动生成 Storybook Stories**
   - 现有竞品全部依赖用户手写 stories
   - AI（GPT-4/Claude）技术上可以：分析组件源码 → 提取 Props → 生成覆盖所有变体的 stories
   - 但质量需验证（边界条件、交互状态）

2. **下游空白：Figma Variables 自动绑定**
   - story.to.design 只做 Color Styles，不做 Variables
   - 技术上需要：AST 分析组件使用的 CSS Variable → 映射到 Figma Variable ID → 通过 Plugin API 绑定
   - Plugin API 绑定是必须的（REST API 无法设置节点的 Variable 绑定）

3. **横切空白：完全本地部署**
   - 0 个竞品提供此能力
   - Docker Compose 做到开箱即用
   - AI 引擎可选：云端 API 或本地 Ollama
   - 最大差异化壁垒

### 可行性矩阵

| 维度       | 评分     | 备注                                            |
| ---------- | -------- | ----------------------------------------------- |
| 技术可行性 | 4/5      | AST 解析、Token 管理成熟；AI 质量是变量         |
| 市场需求   | 5/5      | 本地部署零竞争；中国市场强需求                  |
| 竞争壁垒   | 4/5      | SaaS 竞品不太可能转本地（破坏商业模式）         |
| 收入潜力   | 5/5      | 企业级定价 + 本地部署溢价                       |
| 开发成本   | 3-4 人月 | MVP 范围：仓库分析 + Token 管理 + AI Story 生成 |
| 差异化     | ★★★★★    | 唯一同时满足"仓库直连 + AI + 本地部署"          |

---

## Topic 8：ClaudecodeUI 设计系统现状

### 已验证数据 ✅

1. **CSS Variables 架构**
   - 定义在 `src/index.css`
   - HSL 格式（如 `--background: 220 23% 97%`）
   - Light 模式 `:root`，Dark 模式 `.dark`
   - 完整覆盖：颜色、间距（1-40）、圆角（micro/small/medium/large/pill）、字体、阴影

2. **Tailwind 映射**
   - `tailwind.config.js` 完整映射 CSS Variable → Tailwind theme
   - 语义化 token：border, background, foreground, brand, success, warning, surface, sidebar...

3. **组件库状态**
   - 位置：`src/shared/view/ui/`
   - Button: 7 variants × 4 sizes（CVA）
   - Badge: 5 variants（CVA）
   - 其他：Input, Textarea, ScrollArea, Tooltip, PillBar, DarkModeToggle, LanguageSelector
   - 容器 API 使用 `cn()` + `cva()` 模式

4. **无 Storybook**
   - 没有 `@storybook/*` 依赖
   - 没有 `.stories.tsx` 文件
   - 需要从零搭建

---

## 更新日志

| 日期       | 更新内容                                                        |
| ---------- | --------------------------------------------------------------- |
| 2026-04-10 | 初始调研：Figma Pro 限制、CSS→Variables 工具链、代码→Figma 路径 |
| 2026-04-11 | story.to.design 深度分析、Supernova.io 全面拆解、产品愿景成型   |
| 2026-04-11 | 竞品矩阵完成、本地部署空白验证、可行性评估                      |
