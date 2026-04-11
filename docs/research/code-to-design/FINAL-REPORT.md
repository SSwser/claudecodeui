# Code-to-Design 最终深度分析报告

> 调研周期：2026-04-10 ~ 2026-04-11
> 项目上下文：ClaudecodeUI（React 18 + Tailwind CSS 3 + CSS Variables + CVA）
> Figma 计划：Pro（支持 Variables REST API，不支持 Code Connect）

---

## 一、问题背景

### 原始需求

如何将当前应用设计在 Figma 还原，自动建立关联后通过修改 Figma UI 原型来调整界面，以及同步 design system。

### 演变路径

1. Figma 还原 → 发现 Pro 版限制
2. 工具调研 → 发现没有成熟的直接方案
3. 上下游分析 → 发现产品机会
4. 产品愿景 → 仓库直连 + AI + 本地部署

---

## 二、Figma Pro 版能力边界

### 支持的能力

| 能力               | API                             | 说明                                                                   |
| ------------------ | ------------------------------- | ---------------------------------------------------------------------- |
| Variables REST API | `POST /v1/files/:key/variables` | 可创建/更新 Variables，包括 Collections、Modes                         |
| 读取文件结构       | `GET /v1/files/:key`            | 获取完整 node tree                                                     |
| 导出图片           | `GET /v1/images/:key`           | 导出节点为 PNG/SVG/PDF                                                 |
| Comments API       | 完整                            | 评论读写                                                               |
| Desktop MCP        | 6 工具（只读）                  | get_metadata, get_design_context, get_screenshot, get_variable_defs 等 |

### 不支持的能力

| 能力                                 | 所需计划                | 影响                            |
| ------------------------------------ | ----------------------- | ------------------------------- |
| Code Connect                         | Organization/Enterprise | 无法将代码片段关联到 Figma 组件 |
| 创建可视节点（Frame/Rectangle/Text） | 仅 Plugin API           | REST API 无法创建 UI 元素       |
| 写入 MCP                             | 不存在                  | @figma/mcp 包不存在于 npm       |

### 关键约束

**Figma REST API 无法创建视觉节点** — 这是所有 code→Figma 方案的根本限制。只有运行在 Figma 客户端内的 Plugin API 才能创建 Frame、Rectangle、Text 等节点。这意味着自动化方案必须依赖 Figma 插件（如 html.to.design、story.to.design）作为桥梁。

---

## 三、CSS → Figma Variables 工具链现状

### 调研过的工具

| 工具                                  | 方向                                    | 成熟度   | 问题                              |
| ------------------------------------- | --------------------------------------- | -------- | --------------------------------- |
| `@divriots/style-dictionary-to-figma` | Style Dictionary → Figma JSON           | 成熟     | 仅生成中间格式，不推送到 Figma    |
| `figma-token-engine`                  | Figma → CSS                             | 反方向   | 不是我们需要的                    |
| `@tokens-studio/sd-transforms`        | Tokens Studio format ↔ Style Dictionary | 格式转换 | 不直接操作 Figma                  |
| Tokens Studio Figma 插件              | JSON ↔ Figma Variables                  | 最成熟   | 需手动操作插件或 GitHub JSON 同步 |

### 结论

**没有成熟的 CSS Variables → Figma Variables 一步到位工具。**

推荐方案（直接 REST API 脚本）：

```
CSS Variables (src/index.css)
    → Node.js 解析脚本
    → POST /v1/files/:key/variables
    → Figma Variables + Collections + Modes(Light/Dark)
```

---

## 四、Code → Figma 组件的三条路径

### 路径 A：html.to.design

- **原理**：Figma 插件，截取 localhost URL 渲染结果导入 Figma
- **优点**：零代码，即时可用，免费 10次/月
- **缺点**：生成 hex 值不绑定 Variables；层级结构扁平；不保留组件语义

### 路径 B：story.to.design（需先建 Storybook）

- **原理**：连接 Storybook URL，解析 stories 生成 Figma 组件
- **优点**：保留 auto-layout、嵌套组件、伪状态；可持续同步
- **缺点**：需先写 Storybook stories；$149/月；Token 只支持 Color Styles（不支持 Variables）

### 路径 C：Storybook + Playwright 截图 + 手动组装

- **原理**：写 stories → 启动 Storybook → Playwright 截图 → html.to.design 批量导入 → 手动组装 Component Set
- **优点**：成本最低（全免费工具）
- **缺点**：手动工作量大（4 个核心组件约 1-2 天）；无持续同步

### 推荐

对于当前项目（ClaudecodeUI），最务实的方案是：

1. 先用自定义脚本将 CSS Variables → Figma Variables（一次性投入）
2. 用 html.to.design 快速导入全页面截图作为设计参考
3. 核心组件手动在 Figma 中搭建并绑定 Variables

---

## 五、竞品全景

### 竞品矩阵

| 维度                | story.to.design | Supernova.io | Knapsack      | Builder.io        | Pencil.dev   |
| ------------------- | --------------- | ------------ | ------------- | ----------------- | ------------ |
| **定位**            | Storybook→Figma | 设计系统全栈 | 企业数字生产  | 可视化开发        | AI 原型→代码 |
| **起步价**          | $149/月         | Free/$20/月  | 年费(Contact) | Free/$19/月       | 免费         |
| **仓库集成**        | via Storybook   | Figma+Git    | Git+CI/CD     | CMS+API           | ❌           |
| **Figma Variables** | ❌              | ✅ 导入+配置 | ✅ Token管理  | ❌                | ❌           |
| **代码导出**        | ❌              | ✅ 多平台    | ✅ 实时渲染   | ✅ React/Vue      | ✅ React     |
| **AI**              | ❌              | ✅ 原型+文档 | ⚠️ 标签       | ⚠️ Visual Copilot | ✅ 设计→代码 |
| **本地部署**        | ❌              | ❌           | ❌            | ❌                | ❌           |
| **开源**            | ❌              | SDK/CLI      | ❌            | SDK 部分          | ❌           |

### 关键发现

1. **所有主流竞品都是纯 SaaS** — 没有任何一家提供完整本地部署
2. **story.to.design Token 功能 3 年未实质推进** — 仍是 Alpha，仅 Color Styles
3. **Supernova 是最全面的** — 但"Codebase behind VPN"不等于本地部署
4. **Knapsack 最贵但最企业化** — 无免费试用，年费起步
5. **上游（Story 自动生成）是空白** — 没有任何工具从源码自动生成 Storybook Stories

---

## 六、产品机会分析

### 市场空白

```
[上游] 源码 → Story 自动生成     ← 完全空白
[中游] Story → Figma 组件        ← story.to.design 占领
[下游] Figma Variables 绑定      ← story.to.design 不支持
[下游] Token → 多平台代码导出    ← Supernova 占领
[横切] 完全本地部署              ← 所有竞品空白
```

### 产品愿景：仓库直连 + AI + 本地部署

**三大差异化支柱：**

1. **开发仓库直接接入** — 不依赖 Storybook/Figma 中间件，AST 直接解析组件源码
2. **AI 驱动全链路** — Story 自动生成、Token 传播、设计审查、代码生成
3. **完全本地部署** — Docker Compose 开箱即用，支持本地 LLM（Ollama/vLLM）

**详细愿景分析见 [PRODUCT-VISION.md](./PRODUCT-VISION.md)**

### 可行性评估

| 维度       | 评分         | 说明                                        |
| ---------- | ------------ | ------------------------------------------- |
| 技术可行性 | 4/5          | AST 解析、Token 管理、代码生成都有成熟方案  |
| 市场需求   | 5/5          | 本地部署是零竞争蓝海                        |
| 竞争壁垒   | 4/5          | SaaS 竞品不太可能转本地部署（破坏商业模式） |
| 收入潜力   | 5/5          | 企业级定价 + 本地部署溢价                   |
| 开发成本   | 3-4 人月 MVP | 含仓库分析 + Token 管理 + AI Story 生成     |

---

## 七、后续行动建议

### 对当前项目（ClaudecodeUI）

1. [ ] 编写 CSS Variables → Figma Variables 的 Node.js 脚本
2. [ ] 用 html.to.design 导入页面截图到 Figma
3. [ ] 手动搭建 Button、Badge、Input 核心组件 Component Set

### 对产品机会

1. [ ] 验证 React 组件 AST 解析 → Props/Variants 提取的技术原型
2. [ ] 验证 AI（GPT-4/Claude）生成 Storybook Stories 的质量
3. [ ] 搭建 Docker Compose 基础架构原型
4. [ ] 确定 MVP 范围和目标用户画像

---

## 附录

### A. ClaudecodeUI 设计系统现状

**CSS Variables (src/index.css)：**

- 语义色（Light/Dark 双模式），HSL 格式
- 间距标尺（--spacing-1 ~ --spacing-40）
- 圆角 Token（micro/small/medium/large/pill）
- 字体、阴影

**Tailwind 映射 (tailwind.config.js)：**

- 完整的 CSS Variable → Tailwind theme 映射
- 色彩：border, background, foreground, brand, success, warning, surface, sidebar, primary, secondary, destructive, muted, accent, popover, card

**组件库 (src/shared/view/ui/)：**

- Button：7 variants × 4 sizes = 28 组合（CVA）
- Badge：5 variants（CVA）
- Input, Textarea, ScrollArea, Tooltip, PillBar, DarkModeToggle, LanguageSelector

### B. MCP 配置

- Desktop MCP: `http://127.0.0.1:3845/mcp`（只读，6 工具）
- 全局配置: `C:\Users\admin\AppData\Roaming\Code\User\mcp.json`

### C. 相关文档

- Figma Variables REST API: https://www.figma.com/developers/api#variables
- story.to.design: https://story.to.design/
- Supernova.io: https://www.supernova.io/
- Knapsack: https://www.knapsack.cloud/
