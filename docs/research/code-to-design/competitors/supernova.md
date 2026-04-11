# Supernova.io — 竞品深度研究报告

> 最后更新: 2026-07  
> 数据来源: supernova.io 官网、定价页、功能文档  
> 验证状态: ✅ 已验证

## 产品概述

| 字段     | 内容                                                  |
| -------- | ----------------------------------------------------- |
| 产品名称 | Supernova.io                                          |
| 官网     | https://supernova.io                                  |
| 定位     | Design System 管理平台 — "The design system platform" |
| 阶段     | 成熟产品，已有多年运营                                |
| 类型     | SaaS 平台                                             |

## 核心功能

### 1. Design Token 管理

- 从 Figma 导入 Design Tokens
- 集中管理和组织 tokens
- Token 继承和别名
- 多主题支持 (Light/Dark 等)
- Token 变更追踪

### 2. 代码生成 (Code Delivery)

- Design Token → 多平台代码输出
  - CSS Variables
  - SCSS/SASS
  - Swift (iOS)
  - Kotlin (Android)
  - Flutter
  - React Native
  - Style Dictionary format
- 自定义代码模板 (Custom Exporters)
- CI/CD 集成 — 自动发布到 npm/Git

### 3. 设计系统文档

- 自动生成组件文档
- Markdown 支持
- 交互式组件预览
- 版本化文档

### 4. Figma 集成

- Figma Plugin: 双向同步设计 tokens
- 导入 Figma Styles 和 Variables
- Figma 文件监控和变更检测

### 5. 版本控制

- 设计系统版本管理
- 变更日志
- 回滚能力

### 6. "Codebase behind VPN" (Enterprise)

- ⚠️ **这不是本地部署/自托管**
- 仅表示 Supernova 可通过 VPN tunnel 访问客户代码仓库
- 平台本身仍完全运行在 Supernova 的云端
- 这是之前讨论中的关键澄清点

## 定价

| 方案           | 价格          | 核心功能                                 |
| -------------- | ------------- | ---------------------------------------- |
| **Free**       | $0            | 基础 token 管理，有限功能                |
| **Pro**        | $20/editor/月 | 完整 token 管理，Figma 集成，代码导出    |
| **Team**       | $35/editor/月 | 多团队，高级权限，自定义模板             |
| **Enterprise** | 自定义        | SSO, RBAC, VPN codebase access, 专属支持 |

### 定价分析

- **Pro $20/editor/月 = $240/年/人** — 为行业中位价
- Editor 计费 — 查看者可能免费
- Enterprise 需要 contact sales — 通常 $10K+/年

## 技术架构分析

### 工作原理

```
Figma File → Supernova Plugin → Supernova Cloud Platform
                                     ↓
                              Token Management
                              Documentation
                              Code Generation
                                     ↓
                              npm / Git / CI/CD
```

### 技术特点

1. **Figma-first**: 以 Figma 为设计数据源
2. **Cloud-native**: 平台完全云端
3. **Exporter 系统**: 可自定义代码输出格式 (类似模板引擎)
4. **Webhook/API**: 支持与 CI/CD 集成
5. **多平台输出**: 单一 token → 多平台代码

### 技术限制

1. **纯 SaaS** — 无本地部署选项，Enterprise 的 "VPN" 也不是自托管
2. **Figma 依赖** — 如果不用 Figma，价值大减
3. **代码→Figma 方向较弱** — 主要是 Figma→代码
4. **不扫描代码仓库** — 不能自动发现代码中的 token
5. **不生成组件** — 只管理 token 和文档，不做 UI 组件转换

## 与我们产品愿景的关系

### 竞争维度

| 维度              | 重叠度 | 说明                                  |
| ----------------- | ------ | ------------------------------------- |
| Design Token 管理 | 🔴 高  | Supernova 核心功能                    |
| 代码生成          | 🔴 高  | Token → 多平台代码                    |
| Figma 集成        | 🔴 高  | 深度 Figma 集成                       |
| 仓库连接          | 🟡 中  | 通过 CI/CD 推送到仓库，但不"理解"仓库 |
| AI 驱动           | 🟢 低  | 传统工具，非 AI 原生                  |
| 本地部署          | 🟢 低  | 纯 SaaS                               |
| 代码→设计         | 🟢 低  | 主要是设计→代码方向                   |
| Storybook 集成    | 🟢 低  | 不涉及                                |

### 差异化机会

1. **本地部署** — Supernova 纯 SaaS，对数据敏感客户不可用
2. **AI 驱动的 Token 发现** — Supernova 需要手动配置，我们可自动扫描代码
3. **代码→设计方向** — Supernova 侧重设计→代码，我们做双向
4. **仓库原生** — Supernova 对仓库的理解有限
5. **开源社区版** — Supernova 闭源

### 可学习的地方

1. **Token 管理 UI 和工作流** — 成熟产品的设计经验
2. **多平台代码输出** — Exporter 系统的灵活性
3. **文档自动生成** — 减少设计系统维护负担
4. **定价阶梯** — Free → Pro → Team → Enterprise 的渐进模式
5. **CI/CD 集成模式** — 自动化发布工作流

### 潜在威胁

- Supernova 如果添加 AI 功能 + 本地部署选项 → 直接竞争
- 已有成熟的客户基础和品牌认知
- 如果他们收购/整合 Storybook 工具 → 功能更完整

## 关键洞察

1. **Supernova 是目前最成熟的 Design Token 管理平台** — 功能完善但架构传统
2. **"Codebase behind VPN" ≠ 本地部署** — 这个误导性描述本身就说明了市场对本地部署的需求
3. **$20-35/editor/月 的定价区间为我们提供了参考基线**
4. **Exporter 模板系统是优秀的设计** — 允许自定义输出而不硬编码
5. **纯 SaaS + 非 AI = 可能被"仓库直连 + AI"新范式颠覆**
6. **Supernova 不涉及组件转换** — 只做 token，这留下了空间

## 需要继续跟踪的问题

- [ ] Supernova 是否有 AI 功能路线图？
- [ ] Exporter 系统的具体模板语法和能力？
- [ ] 实际 token 导入/导出的精度和体验？
- [ ] Enterprise 的具体价格区间？
- [ ] 是否有"本地部署"的客户请求/路线图？
- [ ] 与 Style Dictionary / Design Tokens Community Group 标准的兼容程度？
