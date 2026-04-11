# story.to.design — 竞品深度研究报告

> 最后更新: 2026-07  
> 数据来源: story.to.design 官网、博客、Figma Community 页面  
> 验证状态: ✅ 已验证

## 产品概述

| 字段     | 内容                                         |
| -------- | -------------------------------------------- |
| 产品名称 | story.to.design                              |
| 官网     | https://story.to.design                      |
| 开发商   | **‹div›RIOTS** (同 html.to.design 母公司)    |
| 安装量   | ~11,000 用户 (Figma 社区)                    |
| 类型     | Figma 插件                                   |
| 定位     | Storybook UI 组件 → Figma 设计资产，自动同步 |
| 博客活跃 | 持续更新至 2026-03                           |

## 核心功能

### 1. Storybook → Figma 自动转换

- 连接 Storybook instance
- 将 React/Vue/Angular 等组件自动导入 Figma
- 包含所有 variants/stories

### 2. 组件同步

- Storybook 组件变更后可重新同步到 Figma
- 保持 Figma 设计资产与代码一致

### 3. Design Token 支持 (Alpha)

- **仅支持 Color → Figma Styles** (不是 Variables)
- Token 功能 **已停滞 3 年仍为 Alpha**
- 不支持: spacing, typography, radius 等其他 token 类型
- 不支持 Figma Variables API

### 4. 支持的框架

- React
- Vue
- Angular
- Web Components
- Svelte (可能)

## 定价

| 方案       | 价格        | 说明       |
| ---------- | ----------- | ---------- |
| Free       | $0          | 有限功能   |
| Pro        | **$149/月** | 完整功能   |
| Enterprise | 自定义      | 企业级支持 |

> 注: $149/月 = $1,788/年，在设计工具插件中属于**高价位**

## 技术架构分析

### 工作原理

1. 用户提供 Storybook URL (公网可访问)
2. 插件抓取 Storybook 的组件列表和 stories
3. 渲染每个 story 到 iframe
4. 捕获渲染结果并转换为 Figma 节点
5. 通过 Figma Plugin API 写入 Figma 文件

### 前提条件

- **必须有 Storybook** — 无 Storybook 则无法使用
- Storybook 实例必须**公网可访问** (或使用 ngrok/tunnel)
- 如果已有 Storybook → 使用门槛低
- 如果没有 Storybook → 需要先搭建 (对 ClaudecodeUI 来说是额外工作)

### 技术限制

1. **Storybook 依赖**: 必须先有 Storybook，入门门槛高
2. **公网暴露**: Storybook URL 需可访问，私有仓库/VPN 内的项目不便
3. **Token 停滞**: Color Styles Alpha 已 3 年无进展
4. **不支持 Variables**: 仍在使用旧的 Figma Styles (非 Variables API)
5. **单向**: 仅 Storybook → Figma，无反向工作流
6. **快照式**: 不是实时同步，需要手动触发同步

## 与 html.to.design 的关系

同属 **‹div›RIOTS** 公司:

| 产品            | 方向              | 用户量 | 价格    |
| --------------- | ----------------- | ------ | ------- |
| html.to.design  | 网页 → Figma      | 2.2M   | $18/月  |
| story.to.design | Storybook → Figma | 11K    | $149/月 |

**观察**:

- html.to.design 用户量是 story.to.design 的 200 倍
- 说明直接导入网页的需求远大于 Storybook 组件导入
- story.to.design 高价+低用户量 = 可能是**利基市场**

## 与我们产品愿景的关系

### 竞争维度

| 维度              | 重叠度 | 说明               |
| ----------------- | ------ | ------------------ |
| Storybook→Figma   | 🔴 高  | 核心功能直接重叠   |
| 组件同步          | 🔴 高  | 同为组件级别的同步 |
| Design Token 同步 | 🟡 中  | 有尝试但停滞       |
| 仓库直连          | 🟢 低  | 不连接仓库         |
| AI 驱动           | 🟢 低  | 非 AI 产品         |
| 本地部署          | 🟢 低  | Figma 插件         |

### 差异化机会

1. **Token 全量同步** — story.to.design 仅 Color Alpha，我们做全 token
2. **无需 Storybook** — 我们的 AI 可直接扫描代码仓库生成设计
3. **本地部署** — story.to.design 依赖 Figma 平台
4. **双向同步** — story.to.design 是单向的
5. **AI 自动化** — 不需要手动配置和触发

### 潜在风险

- 如果 ‹div›RIOTS 整合两个产品 + 加入 Token/Variables 支持 → 更强竞争力
- $149/月 = 用户愿意为此类功能支付高价 → 市场空间存在
- 现有 11K 用户 = 已有用户基础和品牌认知

## 关键洞察

1. **$149/月 的定价验证了"组件同步"的商业价值** — 用户愿意付费
2. **Token Alpha 停滞 3 年 = 技术难度大或优先级低** — 我们有机会超越
3. **11K 用户 vs html.to.design 2.2M = Storybook 流程不够通用**
4. **必须有 Storybook 的前提限制了市场规模** — 我们的"直接扫描仓库"更通用
5. **‹div›RIOTS 同时持有两个互补产品但未整合 = 组织执行力可能有限**
6. **$149/月 的价格空间允许我们以更低价格+更多功能进入市场**

## 需要继续跟踪的问题

- [ ] Token 功能是否有新进展？
- [ ] 是否计划支持 Figma Variables API？
- [ ] 与 html.to.design 是否有整合计划？
- [ ] Enterprise 版本的具体功能和价格？
- [ ] 实际组件导入的质量和体验？（需要试用验证）
- [ ] 用户留存率和活跃度？（11K 是安装数还是活跃数？）
