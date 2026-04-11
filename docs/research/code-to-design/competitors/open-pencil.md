# OpenPencil — 竞品深度研究报告

> 最后更新: 2026-07  
> 数据来源: openpencil.dev 官网（主页、automation、comparison、tech-stack、getting-started）  
> 验证状态: ✅ 已深度验证

## 产品概述

| 字段     | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| 产品名称 | OpenPencil                                                  |
| 官网     | https://openpencil.dev                                      |
| GitHub   | https://github.com/open-pencil/open-pencil                  |
| 许可证   | **MIT**                                                     |
| 定位     | Open-Source Design Editor — Figma 兼容、AI 原生、完全可编程 |
| 阶段     | 活跃开发中 (docs 最后更新 2026-03-30)                       |
| 价格     | **完全免费** — 开源                                         |

## 核心功能

### 1. Figma 兼容性

- **原生 .fig 文件打开** — 使用 Kiwi 二进制编解码器
- 支持 Figma 剪贴板复制/粘贴（读取 Figma 的 Kiwi 二进制格式）
- 兼容 Figma 多人协议
- 29 种节点类型来自 Figma 的 Kiwi schema
- ~390 fields/NodeChange (Figma 兼容)

### 2. AI 原生 (AI-Native)

- **内置 AI Chat** — 90 个工具覆盖编辑器完整功能
- 工具分类: read, create, modify, structure, variables, vector path, analyze (color/typography/spacing/clusters), diff, boolean operations, arrangement
- MCP Server — 支持 Claude Code, Cursor, Windsurf
- MCP 传输: stdio + HTTP (支持 session)

### 3. 完全可编程 (Programmable)

- **CLI**: 检查、lint、导出、分析设计文件（无需打开编辑器）
  - 列出页面、搜索节点、提取设计 token
  - 检测布局/无障碍问题
  - 渲染为 PNG
  - 机器可读 JSON 输出
  - 支持 RPC 连接运行中的桌面应用
- **Figma Plugin API via eval**: 无头脚本执行
- **Tailwind CSS 导出**
- JSON 输出用于 CI 自动化

### 4. JSX 渲染器

- 用 JSX 语法描述 UI（与 React 相同语法）
- 单次调用创建完整组件树（frames, text, auto-layout, fills, strokes）
- 反向导出: 选中设计 → JSX + Tailwind classes
- 适合 LLM 交互和开发交接

### 5. Vue SDK

- 与应用内部使用相同的 Vue SDK
- 可嵌入到其他产品中
- 暴露: editor context, canvas wiring, selection state, command models, property-panel composables, headless primitives

### 6. 实时协作

- P2P via WebRTC (Trystero + Yjs)
- **无服务器、无账号**
- 共享链接即可协作
- CRDT 同步 — 弱网情况下自动合并
- y-indexeddb 本地持久化

### 7. 桌面应用

- **Tauri v2** — ~5MB（vs Electron ~100MB）
- 支持 macOS (Apple Silicon + Intel), Windows (x64 + ARM), Linux (x64)
- macOS 可通过 Homebrew 安装

## 技术架构

### 技术栈

| 组件     | 技术                  | 说明                          |
| -------- | --------------------- | ----------------------------- |
| 渲染     | Skia CanvasKit WASM   | 与 Figma 相同引擎             |
| UI       | Vue 3 + VueUse        | 响应式组合 API                |
| 组件库   | Reka UI               | 无头可访问 UI 原语            |
| 样式     | **Tailwind CSS 4**    | utility-first                 |
| 布局     | **Yoga WASM**         | Meta 的 CSS flexbox/grid 引擎 |
| 文件格式 | Kiwi binary + Zstd    | Figma 原生格式                |
| 协作     | Trystero + Yjs        | P2P WebRTC + CRDT             |
| AI/MCP   | MCP SDK + Hono        | 90+ 工具                      |
| JSX      | Sucrase               | 轻量级 JSX 转换               |
| 桌面     | Tauri v2              | 原生应用                      |
| 构建     | Vite 7                | 快速 HMR                      |
| 测试     | Playwright + bun:test | E2E + 单元测试                |
| Lint     | oxlint                | Rust 实现                     |
| 格式化   | oxfmt                 | Rust 实现                     |
| 类型检查 | typescript-go (tsgo)  | Go 实现的 TS 检查器           |

### 架构特点

- **单进程架构**: 无服务器、无数据库、无 Docker
- 场景图: 扁平 `Map<string, SceneNode>` (TypeScript)
- 渲染: 从 TS 直接调用 Skia CanvasKit
- 布局: Yoga WASM 同步调用
- **代码量**: ~26,000 LOC / ~143 源文件（全 TypeScript）

### vs Penpot 对比（来自官方文档）

| 维度       | OpenPencil        | Penpot                     |
| ---------- | ----------------- | -------------------------- |
| 架构       | 单进程，无服务器  | 5+ 服务，Docker Compose    |
| 渲染       | 直接 CanvasKit    | SVG DOM(默认) 或 Rust WASM |
| 代码量     | ~26K LOC (1 语言) | ~299K LOC (4+ 语言)        |
| Figma 兼容 | 原生 .fig 打开    | 无 .fig 支持               |
| 开发者入门 | TS/Vue            | Clojure/Rust/Docker        |
| 桌面应用   | Tauri (~5MB)      | 无 (仅浏览器)              |
| 冷启动     | <2s               | 10s+                       |
| 内存基线   | ~50MB             | ~300MB+                    |
| 离线       | 完全支持          | 不支持                     |

## 与我们产品愿景的关系

### 竞争维度

| 维度              | 重叠度 | 说明                                          |
| ----------------- | ------ | --------------------------------------------- |
| AI 原生           | 🔴 高  | 90 个 AI 工具 + MCP Server                    |
| 开源              | 🔴 高  | MIT 许可 — 可自由使用和修改                   |
| 本地优先          | 🔴 高  | 完全本地运行，无需服务器                      |
| Figma 兼容        | 🔴 高  | 原生 .fig 文件支持                            |
| 仓库集成          | 🟡 中  | 文件本地存储，但无 Git 工作流集成             |
| Design Token 同步 | 🟡 中  | CLI 可提取 token，但无 CSS→Variables 自动同步 |
| 代码→设计         | 🟡 中  | JSX 渲染器可从代码生成设计，但非主要工作流    |
| Storybook 集成    | 🟢 低  | 未涉及                                        |

### 差异化机会

1. **OpenPencil 是设计工具**，我们是**设计系统同步平台**
2. OpenPencil 没有 **CSS Variables → Design Token 自动扫描和同步**
3. 我们的目标包括 **Storybook 自动生成和集成**
4. OpenPencil 没有 **团队管理、权限控制** — 纯桌面应用

### 潜在合作/集成机会

- **OpenPencil 作为设计端引擎**: 我们的平台可以集成 OpenPencil 作为嵌入式设计编辑器
- **Vue SDK**: 可嵌入到我们的 Web 应用中
- **MCP Server**: 可集成到我们的 AI 工作流中
- **CLI 工具链**: 可在 CI/CD 中使用其 token 提取功能
- **MIT 许可**: 完全可以 fork 和定制

### 潜在威胁

- 如果 OpenPencil 加入 Git 工作流和 design system 管理 → 直接竞争
- 开源 + 免费 → 对付费竞品形成价格压力
- 技术架构先进（同引擎但更轻量） → 可能快速迭代

## 关键洞察

1. **OpenPencil 是目前最接近"代码友好设计工具"的开源方案**
2. **技术架构极其优雅** — 26K LOC vs Penpot 299K LOC，同样的功能覆盖
3. **AI/MCP 生态完整** — 90 个工具，stdio+HTTP 双传输
4. **JSX 渲染器是关键差异化** — 连接代码世界和设计世界的桥梁
5. **MIT 许可 = 可嵌入/fork** — 我们的产品可能可以基于它构建
6. **Figma 原生兼容 + 开源** — 这组合在市场上独一无二
7. 但 **不是设计系统管理平台** — 仍然缺少我们产品愿景中的"自动同步"核心功能

## 需要继续跟踪的问题

- [ ] 实际使用体验和稳定性？（需要安装试用）
- [ ] GitHub star 数和社区活跃度？
- [ ] 路线图中是否有 design system 管理功能？
- [ ] .fig 文件兼容性覆盖率？（哪些 Figma 功能未支持？）
- [ ] JSX 渲染器的实际代码输出质量？
- [ ] 是否可以作为我们产品的嵌入式编辑器？
