# Code-to-Design 调研文档

> 调研目标：探索从代码仓库自动同步/生成设计系统到 Figma 的可行方案，以及产品化机会分析。

## 文档索引

### 核心分析

| 文档                                       | 说明                                   |
| ------------------------------------------ | -------------------------------------- |
| [FINAL-REPORT.md](./FINAL-REPORT.md)       | 最终深度分析报告（全景总结）           |
| [KEY-CONCLUSIONS.md](./KEY-CONCLUSIONS.md) | 关键结论与技术发现（分 topic）         |
| [PRODUCT-VISION.md](./PRODUCT-VISION.md)   | 产品愿景分析：仓库直连 + AI + 本地部署 |

### 竞品研究报告（每产品一份）

| 文档                                                               | 产品            | 定位                               | 价格                 | 威胁度           |
| ------------------------------------------------------------------ | --------------- | ---------------------------------- | -------------------- | ---------------- |
| [competitors/pencil-dev.md](./competitors/pencil-dev.md)           | Pencil.dev      | Agent-driven MCP 设计画布          | 免费 (早期)          | 🔴 高            |
| [competitors/builder-io.md](./competitors/builder-io.md)           | Builder.io      | AI 产品开发平台 (Fusion + Publish) | $0-40/user/mo        | 🔴 高            |
| [competitors/open-pencil.md](./competitors/open-pencil.md)         | OpenPencil      | 开源 Figma 兼容设计编辑器          | 免费 MIT             | 🟡 中 (合作机会) |
| [competitors/html-to-design.md](./competitors/html-to-design.md)   | html.to.design  | HTML/网页→Figma 插件               | $0-18/mo             | 🟡 中            |
| [competitors/story-to-design.md](./competitors/story-to-design.md) | story.to.design | Storybook→Figma 插件               | $0-149/mo            | 🟡 中            |
| [competitors/supernova.md](./competitors/supernova.md)             | Supernova.io    | Design Token 管理平台              | $0-35/editor/mo      | 🟡 中            |
| [competitors/knapsack.md](./competitors/knapsack.md)               | Knapsack        | 企业级 Design System 平台          | Contact Sales (年付) | 🟢 低            |
| [competitors/google-stitch.md](./competitors/google-stitch.md)     | Google Stitch   | AI 原型生成工具 (Labs)             | 免费 (实验)          | 🟢 低            |

### 竞品对照矩阵

| 能力       | Pencil | Builder | OpenPencil | html2d | story2d   | Supernova | Knapsack | Stitch |
| ---------- | ------ | ------- | ---------- | ------ | --------- | --------- | -------- | ------ |
| 仓库直连   | ✅     | ✅      | ❌         | ❌     | ❌        | ❌        | ❌       | ❌     |
| AI 原生    | ✅     | ✅      | ✅         | 🟡     | ❌        | ❌        | ❌       | ✅     |
| 本地部署   | 🟡     | ❌      | ✅         | ❌     | ❌        | ❌        | ❌       | ❌     |
| Figma 集成 | ❌     | ✅      | ✅(.fig)   | ✅     | ✅        | ✅        | ✅       | ❌     |
| Token 同步 | ❌     | 🟡      | 🟡         | ❌     | 🟡(Alpha) | ✅        | ✅       | ❌     |
| 代码→设计  | ❌     | 🟡      | 🟡(JSX)    | ✅     | ✅        | ❌        | ❌       | ❌     |
| 设计→代码  | ✅     | ✅      | ✅         | ❌     | ❌        | ✅        | ❌       | ✅     |
| MCP 支持   | ✅     | ✅      | ✅         | ✅     | ❌        | ❌        | ❌       | ❌     |
| 开源       | ❌     | ❌      | ✅ MIT     | ❌     | ❌        | ❌        | ❌       | ❌     |

## 调研时间线

- 2026-04-10: 启动调研，Figma Pro 限制分析，CSS→Figma Variables 工具搜索
- 2026-04-11: 完成竞品深度分析，产品愿景形成
- 2026-07: 8 个竞品深度研究报告完成，对照矩阵更新
