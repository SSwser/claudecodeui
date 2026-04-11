---
date: '2026-04-11 15:32'
promoted: false
---

Orca agent workflow skill 化实践

来源：Orca 项目深度研究

## 目录结构

.agents/skills/<name>/SKILL.md // 通用，所有 AI 工具可读
.claude/skills/<name> // symlink 指向 .agents/skills/<name>，Claude Code 专属路径

.agents/skills/ 下每个 skill 是独立子目录，包含 SKILL.md 一个文件。

## SKILL.md frontmatter

```yaml
---
name: my-skill
description: '一句话描述，agent 靠这个决定是否调用'
allowed-tools:
  - Read
  - Write
  - Bash(git:*) # 只允许 git 开头的 Bash 命令
  - Bash(agent-browser:*) # 只允许特定工具的 Bash 调用
argument-hint: 'Describe what argument to pass'
---
```

- **allowed-tools**：安全约束，限制 skill agent 只能使用指定工具，防止越权操作
- **argument-hint**：告诉调用方如何传参，显示在 agent picker 里
- **description**：触发条件必须精准，避免 agent 误调用

## skills-lock.json

锁定外部安装的 skill 版本（类似 package-lock.json），防止 skill 悄悄升级后改变 agent 行为：

```json
{
  "skills": {
    "auto-review-fix": {
      "repo": "github.com/orca-app/skills",
      "version": "1.2.3",
      "hash": "sha256:..."
    }
  }
}
```

安装外部 skill：`npx skills add <repo> --skill <name>`
升级 skill：需要显式操作，不会自动升级

## auto-review-fix skill 模式（高级）

Orca 的 auto-review-fix 展示了复杂 skill 的几个关键设计：

**并行 review subagent**

- 主 skill 启动多个 review subagent 并行分析不同文件/模块
- 汇总结果后统一决策哪些 issue 需要 fix

**Crash recovery（迭代状态持久化）**

- 在 context file 中写入"Iteration State"
- agent 崩溃或超时后重启，读取 context file 恢复到上次进度
- 避免从头重跑整个 review 流程

**Skipped Issues 持久化**

- 用户选择跳过的 issue 写入文件，下次运行不再重复提示
- 防止 agent 反复建议用户已明确拒绝的改动

## 实践建议

1. 先盘点有哪些重复执行的 agent 工作流（每周/每次 PR/每次发版都跑的流程）
2. 把流程步骤写成 SKILL.md，用 allowed-tools 约束权限
3. 复杂流程（如 review+fix）才需要 subagent 并行 + Iteration State
4. 简单流程（如 note/gsd-fast）直接 inline 执行，不需要 subagent
5. 外部引入的 skill 务必用 skills-lock.json 锁版本
