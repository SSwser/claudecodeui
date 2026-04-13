# ClaudeCodeUI — Workflow

## 设计工作流

### Token 管线

```
design/tokens.json  ─── npm run tokens:build ───▶  design/TOKENS.md（自动生成参考表）
      │ (SSOT)
      ▼ (手动同步)
src/index.css          HSL CSS 变量，:root 明 + .dark 暗双主题
      │
      ▼ (桥接)
tailwind.config.js     hsl(var(--xxx)) → Tailwind 工具类
```

**改 token 的流程**：改 `tokens.json` → 改 `index.css` → 如有新 token 改 `tailwind.config.js` → 跑 `npm run tokens:build`

### 设计 ↔ 代码分工

| 层             | 权威来源                        | 说明                                         |
| -------------- | ------------------------------- | -------------------------------------------- |
| 视觉/布局      | Pencil 画布 (`design/main.pen`) | 布局、间距、外观的视觉 SSOT                  |
| 行为/逻辑      | 代码 (`src/` + `server/`)       | phase 交付后，代码即正式实现                 |
| Token 映射     | `design/tokens.json`            | Pencil hex ↔ CSS token ↔ Tailwind 的完整对照 |
| 产品决策       | `design/PRODUCT.md`             | 心智模型、状态系统、UX 原则（长期有效）      |
| Phase 设计意图 | phase brief（`.planning/`）     | 阶段性的"为什么"，交付后归档不维护           |

### 规则

- **永远不在组件里写死 hex** — 用 CSS token (`var(--xxx)`) 或 Tailwind 类
- **TOKENS.md 不手动编辑** — 它是自动生成的

---

## GSD 开发工作流

```
gsd-discuss-phase → gsd-plan-phase → gsd-execute-phase → gsd-verify-work → gsd-ship
```

每个 phase 必须在 **worktree** 中执行：

```powershell
git worktree add .worktrees/phase-XX -b feat/phase-XX
cd .worktrees/phase-XX
# 执行所有 plan → 原子提交 → 验证 → PR
```

完整 checklist 在 `AGENTS.md` 的 Phase Execution Checklist 章节。

---

## 代码规范

详见 [`AGENTS.md`](AGENTS.md) — 包含完整的样式、组件、格式化、提交、包管理规范。

---

## 目录结构要点

```
src/components/<feature>/     # 按功能分模块（view/ hooks/ types/ utils/）
src/shared/view/ui/           # 基础组件（Button, Input, Badge…）
src/components/ui/            # 桥接 wrapper 和新共享控件
design/                       # tokens.json + TOKENS.md + PRODUCT.md + main.pen
.planning/                    # GSD 规划文档（不进 src/）
scripts/                      # 构建/检查脚本
```

整体是一个 **Pencil 设计 → JSON token SSOT → CSS/Tailwind → React 组件** 的单向流水线，配合 GSD 的 phase-based 开发循环。
