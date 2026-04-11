# Phase 4: UI Migration - Discussion Log

**Gathered:** 2026-04-11
**Status:** Complete

## Boundary Notes

- User raised a larger idea: rewrite the whole project while preserving the core conversation experience.
- This was treated as out of scope for Phase 4 and recorded as deferred rather than folded into current phase scope.

## Question Audit

### Area: Component Migration Boundary

**Question:** Phase 4 结束时，你希望组件迁移停在哪种边界？

**Options presented:**

- 统一入口，渐进收口
- 阶段内尽量清空旧 shared 基础组件
- 只规定新功能必须走新入口，旧页面先不动

**User selection:** 阶段内尽量清空旧 shared 基础组件

**Follow-up question:** 这次优先清空哪一层？

**Options presented:**

- 只清基础交互件
- 基础交互件 + 常用展示件
- 能迁的都迁，界面层一起重构

**User selection:** 只清基础交互件

### Area: Theme Token Scope

**Question:** Phase 4 里你希望 token 系统补到哪一层？

**Options presented:**

- 补齐完整语义 token，但不做品牌重设计
- 只补颜色和少量尺寸 token
- 直接按 DESIGN.md 做整套视觉重置

**User selection:** 直接按 DESIGN.md 做整套视觉重置

**Scope adjustment:** full visual reset was identified as backlog-scale work and narrowed before locking the phase decision.

**Follow-up question:** 如果只允许在 Phase 4 吸收一部分 `DESIGN.md`，你要锁哪一层？

**Options presented:**

- 仅 token 层对齐
- token + 基础组件外观对齐
- 只把 DESIGN.md 当长期参考，不进入 Phase 4 交付

**User selection:** token + 基础组件外观对齐

### Area: i18n Migration And CI Guardrails

**Question:** 现有翻译键结构，你想怎么收口？

**Options presented:**

- 保留现有 namespace，补映射文档并清理缺口
- 整理成更明确的 feature/shared 双层结构
- 直接全面重命名 key

**User selection:** 直接全面重命名 key

**Follow-up question:** 全面重命名里，你更想要哪种执行方式？

**Options presented:**

- 先定新命名规范，再边迁组件边改 key
- 先做一次全仓 key 改名，再开始组件迁移
- 只重命名 Phase 4 触达的模块

**User selection:** 先定新命名规范，再边迁组件边改 key

**Follow-up question:** 防止新增硬编码字符串，你希望 CI 用哪种拦截方式？

**Options presented:**

- 先上自定义 lint / 脚本门禁，允许白名单
- 要求 ESLint 级强规则，PR 必须零违规
- 先做报告模式，不阻塞 CI

**User selection:** 先上自定义 lint / 脚本门禁，允许白名单

### Area: Visual Regression Strategy

**Question:** 第一版视觉回归，你希望基线建在哪？

**Options presented:**

- 页面级关键流截图
- 组件级截图
- 组件级 + 页面级一起上

**User selection:** 页面级关键流截图

**Follow-up question:** 页面级视觉回归的初始覆盖，你要哪种？

**Options presented:**

- 试点页面 + 全局壳层
- 所有本 phase 触达页面
- 先只测全局壳层

**User selection:** 所有本 phase 触达页面

### Area: Figma And Design Workflow

**Question:** Phase 4 里，你希望 Figma / Code Connect 流程被执行到什么程度？

**Options presented:**

- 文档规则强制遵守，roundtrip 先做试点
- 只把文档当参考，不做 roundtrip 试点
- 要求迁移页面默认都走 Figma roundtrip

**User selection:** 文档规则强制遵守，roundtrip 先做试点

## Finalized Direction

- Aggressive but bounded primitive migration
- Expanded semantic token system with selective `DESIGN.md` adoption
- Progressive i18n key renaming with mapping doc and CI string gate
- Page-level visual regression for all touched screens
- Mandatory Figma guardrails plus a pilot roundtrip and mapping starter list

---

*Phase: 04-ui-migration*
*Discussion logged: 2026-04-11*
