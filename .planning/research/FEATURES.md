# Feature Landscape: Virtual Sessions and Branch Management

**Project:** CloudCLI UI - Multi-AI Coding Assistant
**Researched:** 2026-04-10
**Confidence:** MEDIUM (based on product analysis, competitive research, and domain expertise; WebSearch unavailable)

---

## Executive Summary

虚拟会话机制是 CloudCLI UI 的核心创新点。它通过类似 Git 分支的模型管理 AI 对话上下文,解决上下文窗口限制和组织混乱两大痛点。核心设计采用**混合模式**:默认透明自动分支以保证流畅体验,同时提供可视化界面满足高级用户需求。

关键发现:
1. **上下文管理是所有 AI 编码工具的共同挑战** - 各家采用不同策略但都围绕"压缩"和"分支"
2. **Git 分支模型是最直观的类比** - 用户已有心智模型,降低学习成本
3. **混合模式是最佳平衡** - 完全透明失去控制感,完全手动增加认知负担
4. **会话时间线是用户最需要的可视化** - 直观展示分支结构和决策点

---

## 1. Core Feature Patterns

### 1.1 Virtual Session / Branch Model

**Definition:** 虚拟会话是一个逻辑容器,映射到一个或多个物理会话(由 AI 提供商管理)。用户在虚拟层看到统一的对话流,系统在后端自动管理物理会话的创建、切换和压缩。

**Pattern A: Shadow Branching (透明自动分支)**
- 系统在后台监控上下文窗口使用率
- 当达到阈值(建议 70-80%)时,自动创建新分支
- 用户看到的是连续对话,无感知切换
- 优点: 用户体验最流畅
- 缺点: 用户失去对分支的控制

**Pattern B: Explicit Branching (显式分支)**
- 用户手动触发分支创建
- 每个分支有明确命名和描述
- 用户在分支间自由切换
- 优点: 完全控制
- 缺点: 需要用户主动决策,增加认知负担

**Pattern C: Hybrid Branching (混合模式) - RECOMMENDED**
- 默认透明自动分支保证流畅体验
- 用户可随时查看分支时间线
- 支持手动创建分支和合并
- 自动分支有系统生成的名称(可重命名)
- 优点: 平衡体验和控制
- 缺点: 实现复杂度较高

```
CloudCLI 采用 Hybrid 模式:

用户视角:
  [主会话时间线] ======A======|========B========|========C========>
                            (自动)              (自动)           (自动)
                              ↓                   ↓                ↓
  [时间线面板可查看]    [Branch: 2026-04-10 14:32] [Branch: 2026-04-10 15:45] ...

用户可选择:
  - 继续在主会话工作(透明切换)
  - 切换到某个分支深入探索
  - 创建新分支进行实验
  - 合并分支回主会话
```

### 1.2 Context Window Management

**Token Budget Tracking:**
```typescript
interface ContextBudget {
  maxTokens: number;           // 提供商最大上下文
  usedTokens: number;          // 当前使用
  reservedTokens: number;      // 保留空间(响应缓冲)
  effectiveLimit: number;     // maxTokens - reservedTokens
  utilizationPercent: number;  // usedTokens / effectiveLimit * 100
}
```

**Trigger Strategy:**

| 阈值 | 触发条件 | 动作 |
|------|----------|------|
| 60% | 达到 60% | 启动压缩准备,收集可压缩消息 |
| 75% | 达到 75% | 显示警告 UI,提示用户可选操作 |
| 85% | 达到 85% | 自动分支(混合模式下) |
| 95% | 达到 95% | 强制分支(防止上下文溢出) |

### 1.3 Automatic Compression Strategies

**Strategy 1: Summarization (摘要压缩)**
- 对早期消息生成摘要
- 保留关键决策、变量定义、架构选择
- 删除中间过程细节
- **适用场景**: 长程项目上下文
- **实现复杂度**: High (需要 LLM 进行摘要)

**Strategy 2: Pruning (剪枝)**
- 删除特定的工具调用结果(如已验证的测试输出)
- 保留工具调用本身(保留意图)
- 删除重复的确认消息
- **适用场景**: 快速迭代阶段
- **实现复杂度**: Medium

**Strategy 3: Windowing (滑动窗口)**
- 保留最近 N 条消息
- 早期消息存入"历史存档"
- 可按需检索历史存档
- **适用场景**: 短期任务
- **实现复杂度**: Low

**Strategy 4: Semantic Chunking (语义分块)**
- 按功能/主题分割对话
- 每个块有语义描述
- 只加载相关块到上下文
- **适用场景**: 多功能项目
- **实现复杂度**: High

**Recommended Combination:**
```
Hybrid 压缩策略:
1. 滑动窗口作为基础(保留最近 50 条消息)
2. 对早期消息进行摘要(保留关键上下文)
3. 对工具结果进行剪枝(保留意图,删除细节)
4. 关键决策点标记保留(不被压缩)
```

### 1.4 Session Freeze / Pause / Resume

**Freeze State Machine:**
```
[Active] --freeze()--> [Frozen] --resume()--> [Active]
                |                           |
                +-------delete()-------> [Deleted]
```

**Freeze Implementation:**
```typescript
interface FrozenSession {
  sessionId: string;
  virtualSessionId: string;
  frozenAt: Date;
  frozenContext: {
    messages: NormalizedMessage[];
    lastBranchId: string;
    cursorPosition: number;
    scrollPosition: number;
  };
  resourceState: {
    backendProcess: 'paused' | 'terminated';
    websocketConnection: 'active' | 'suspended';
    fileWatchers: string[];  // 监控中的文件路径
  };
  metadata: {
    frozenBy: 'user' | 'system' | 'idle_timeout';
    reason?: string;
  };
}
```

**Freeze Benefits:**
- 释放内存和 CPU 资源
- 保持 WebSocket 连接但不活跃
- 保留完整状态可快速恢复
- 支持远程恢复(跨设备)

**Resume Behavior:**
1. 重新建立 WebSocket 连接
2. 恢复 UI 状态(滚动位置、光标)
3. 重新加载最近消息到内存
4. 恢复文件监控
5. 继续最后的分支

### 1.5 Multi-Session State Synchronization

**Sync Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    CloudCLI App                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Tab: A     │  │  Tab: B     │  │  Tab: C     │     │
│  │  Session 1  │  │  Session 2  │  │  Session 1  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                               │
│                  ┌────────▼────────┐                     │
│                  │  Sync Manager   │                     │
│                  │  - Tab registry │                     │
│                  │  - Event bus    │                     │
│                  │  - Conflict res │                     │
│                  └────────┬────────┘                     │
│                           │                               │
│                  ┌────────▼────────┐                     │
│                  │  Session Store  │                     │
│                  │  (Zustand)      │                     │
│                  └────────┬────────┘                     │
│                           │                               │
│         ┌─────────────────┼─────────────────┐             │
│         │                 │                 │             │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐    │
│  │  Realtime   │   │   Server    │   │   Local     │    │
│  │  (WebSocket)│   │   (REST)    │   │   (SQLite)  │    │
│  └─────────────┘   └─────────────┘   └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Conflict Resolution Strategies:**

| Conflict Type | Resolution Strategy | User Impact |
|---------------|---------------------|-------------|
| 并发编辑 | Last-Write-Wins + 通知 | 最小 |
| 分支冲突 | 提示用户选择保留版本 | 需要决策 |
| 状态不一致 | 强制刷新 + 显示提示 | 短暂中断 |
| 资源竞争 | 锁机制 + 队列 | 串行化 |

**Sync Events:**
```typescript
type SyncEvent =
  | { type: 'SESSION_UPDATED'; sessionId: string; tabId: string }
  | { type: 'BRANCH_CREATED'; virtualSessionId: string; branchId: string }
  | { type: 'BRANCH_MERGED'; sourceBranchId: string; targetBranchId: string }
  | { type: 'SESSION_FROZEN'; sessionId: string }
  | { type: 'SESSION_RESUMED'; sessionId: string }
  | { type: 'TAB_REGISTERED'; tabId: string; sessionId: string }
  | { type: 'TAB_UNREGISTERED'; tabId: string }
  | { type: 'CONFLICT_DETECTED'; sessionId: string; conflicts: Conflict[] };
```

---

## 2. Competitive Analysis

### 2.1 Claude Code

**Session Management:**
- 基于项目目录的会话组织
- 会话历史存储在 `~/.claude/projects/<project>/sessions/`
- JSONL 格式存储每条消息
- 支持通过 `--resume` 恢复会话

**Branching:**
- 手动创建新会话(隐式分支)
- 不支持自动分支
- 无可视化分支管理

**Context Handling:**
- 依赖 Claude API 的上下文窗口
- 提示用户上下文接近限制
- 无自动压缩或摘要

**Strengths:**
- 简单可靠
- 与文件系统紧密集成
- 易于调试和审计

**Limitations:**
- 长对话需要手动管理
- 无法同时探索多个方向
- 缺乏分支可视化

### 2.2 Cursor

**Session Management:**
- 基于项目的会话列表
- 每个会话有独立的聊天历史
- Tab 界面支持多会话

**Branching:**
- "Composer" 模式支持多文件编辑
- 不支持对话分支
- 基于版本控制的实验(Private Mode)

**Context Handling:**
- 固定上下文窗口
- 提示上下文使用情况
- 限制长对话中的历史信息

**Strengths:**
- 优秀的 UI/UX
- 实时协作功能
- Git 集成

**Limitations:**
- 上下文管理不透明
- 不支持真正的对话分支
- 长程项目管理困难

### 2.3 GitHub Copilot

**Session Management:**
- 无持久会话概念
- 每个文件编辑是独立上下文
- 依赖 IDE 状态

**Branching:**
- 依赖 Git 分支
- 无 AI 层面的分支概念

**Context Handling:**
- 仅当前文件/光标上下文
- 无历史管理

**Strengths:**
- 轻量集成
- 低延迟响应

**Limitations:**
- 无会话持久性
- 无法进行多轮对话
- 不适合复杂任务

### 2.4 Comparison Matrix

| Feature | Claude Code | Cursor | GitHub Copilot | CloudCLI (Proposed) |
|---------|-------------|--------|----------------|---------------------|
| 会话持久化 | Yes | Yes | No | Yes |
| 分支管理 | Manual | Limited | Git-based | Hybrid |
| 自动分支 | No | No | No | Yes |
| 可视化时间线 | No | Partial | No | Yes |
| 上下文压缩 | No | No | No | Yes |
| 会话冻结 | Via resume | Partial | No | Yes |
| 多 Tab 支持 | No | Yes | No | Yes |
| 冲突处理 | N/A | Limited | Git | Advanced |

### 2.5 Key Differentiators for CloudCLI

1. **透明自动分支** - 唯一提供此功能的产品
2. **完整分支可视化** - 时间线 + 差异对比
3. **会话冻结/恢复** - 跨设备、跨时间
4. **混合压缩策略** - 智能上下文管理
5. **多 Tab + 同步** - 企业级会话管理

---

## 3. Session Data Model

### 3.1 Core Entities

```typescript
// 虚拟会话 - 用户感知的会话单位
interface VirtualSession {
  id: string;                    // UUID
  projectId: string;             // 关联项目
  name: string;                  // 可读名称
  description?: string;          // 可选描述

  // 关系
  currentBranchId: string;      // 当前活跃分支
  branchIds: string[];           // 所有分支

  // 元数据
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;

  // 状态
  status: 'active' | 'frozen' | 'archived';
  frozenAt?: Date;

  // 设置
  autoBranchEnabled: boolean;    // 是否启用自动分支
  branchThreshold: number;       // 分支触发阈值 (0-1)
}

// 分支 - 物理会话的逻辑包装
interface Branch {
  id: string;                    // UUID
  virtualSessionId: string;      // 父虚拟会话

  // 血统
  parentBranchId?: string;      // 父分支(用于合并追踪)
  rootBranchId: string;         // 根分支(主会话的第一个分支)
  generation: number;            // 分支代数(0=主分支)

  // 物理会话映射
  providerSessionId: string;     // 提供商原生会话 ID
  provider: SessionProvider;     // claude | codex | cursor | gemini

  // 内容
  messageCount: number;
  tokenUsage: ContextBudget;

  // 分支信息
  name: string;                 // 用户定义或自动生成
  createdBy: 'user' | 'system';
  branchPoint: number;           // 从父分支的第几条消息开始

  // 元数据
  createdAt: Date;
  endedAt?: Date;               // 分支结束时间
  isMainLine: boolean;          // 是否主分支
}

// 分支事件 - 用于时间线可视化
interface BranchEvent {
  id: string;
  branchId: string;
  type: 'created' | 'merged' | 'renamed' | 'archived' | 'branched_from';
  payload: Record<string, unknown>;
  timestamp: Date;
}

// 压缩记录 - 追踪上下文压缩
interface CompressionRecord {
  id: string;
  branchId: string;
  originalMessageCount: number;
  compressedMessageCount: number;
  compressionType: 'summarize' | 'prune' | 'window';
  summary?: string;             // 如果是摘要压缩
  preservedMessageIds: string[]; // 保留的消息 ID
  compressedMessageIds: string[];// 压缩的消息 ID
  tokenSavings: number;
  timestamp: Date;
}

// 会话冻结状态
interface FreezeState {
  sessionId: string;
  branchId: string;

  // 资源状态
  memorySnapshot: {
    messages: NormalizedMessage[];
    scrollPosition: number;
    activeFiles: string[];
  };

  // 进程状态
  processState: {
    backendPid?: number;
    fileWatchers: string[];
    lastCheckpoint: Date;
  };

  // 元数据
  frozenAt: Date;
  frozenBy: 'user' | 'system' | 'idle';
  frozenReason?: string;
}
```

### 3.2 Database Schema Extensions

```sql
-- 虚拟会话表
CREATE TABLE virtual_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_branch_id TEXT,
  status TEXT DEFAULT 'active',
  auto_branch_enabled BOOLEAN DEFAULT 1,
  branch_threshold REAL DEFAULT 0.75,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME,
  frozen_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_virtual_sessions_project ON virtual_sessions(project_id);
CREATE INDEX idx_virtual_sessions_status ON virtual_sessions(status);

-- 分支表
CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  virtual_session_id TEXT NOT NULL,
  provider_session_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  parent_branch_id TEXT,
  root_branch_id TEXT,
  generation INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  created_by TEXT DEFAULT 'system',
  branch_point INTEGER DEFAULT 0,
  is_main_line BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY (virtual_session_id) REFERENCES virtual_sessions(id),
  FOREIGN KEY (parent_branch_id) REFERENCES branches(id),
  FOREIGN KEY (root_branch_id) REFERENCES branches(id)
);

CREATE INDEX idx_branches_virtual ON branches(virtual_session_id);
CREATE INDEX idx_branches_provider ON branches(provider, provider_session_id);

-- 分支事件表
CREATE TABLE branch_events (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,  -- JSON
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX idx_branch_events_branch ON branch_events(branch_id);

-- 压缩记录表
CREATE TABLE compression_records (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  original_count INTEGER,
  compressed_count INTEGER,
  compression_type TEXT NOT NULL,
  summary TEXT,
  preserved_ids TEXT,  -- JSON array
  compressed_ids TEXT, -- JSON array
  token_savings INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 冻结状态表
CREATE TABLE freeze_states (
  session_id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  memory_snapshot TEXT,  -- JSON
  process_state TEXT,    -- JSON
  frozen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  frozen_by TEXT NOT NULL,
  frozen_reason TEXT,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
```

### 3.3 State Transitions

```
VirtualSession State Machine:
┌─────────┐ create() ┌──────────┐ freeze() ┌────────┐
│  null   │────────>│  active  │────────>│ frozen │
└─────────┘         └──────────┘          └────────┘
                       │                     │
                       │ archive()           │ resume()
                       ▼                     ▼
                  ┌──────────┐         ┌──────────┐
                  │ archived │         │  active  │
                  └──────────┘         └──────────┘

Branch State Machine:
┌──────────┐ create()    ┌──────────┐ merge()    ┌──────────┐
│  null    │───────────> │  active  │───────────>│  merged  │
└──────────┘             └──────────┘            └──────────┘
                             │
                             │ close()
                             ▼
                        ┌──────────┐
                        │  ended   │
                        └──────────┘
```

---

## 4. UI/UX Design Patterns

### 4.1 Session Timeline Visualization

**Purpose:** 直观展示分支结构和决策历史

**Design Principles:**
1. **水平时间线** - 从左到右表示时间流逝
2. **垂直分支** - 分支在时间线下方展开
3. **节点标记** - 关键事件(分支点、合并)用节点标记
4. **色彩编码** - 主分支蓝色,实验分支橙色,已合并灰色

**Component Hierarchy:**
```
SessionTimeline
├── TimelineHeader (项目名、分支数、状态)
├── TimelineRuler (时间刻度)
├── MainLineTrack (主分支)
│   ├── MessageNodes (消息节点)
│   └── CompressionMarkers (压缩点)
├── BranchTracks[] (实验分支)
│   ├── BranchHeader (分支名、创建者)
│   ├── MessageNodes
│   └── MergeIndicator
├── CurrentPositionIndicator (当前位置)
└── Controls (缩放、过滤、操作)
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Session: Project Alpha                              [+] [🔍] [≡]    │
├─────────────────────────────────────────────────────────────────────┤
│ ──────────────────────────────────────────────────────────────────  │
│   Main Branch                                              (ACTIVE) │
│ ─┬────────────────●─────────────────────────────────────────────────│
│  │                  │                                              │
│  │              [Branch: Refactor API]                             │
│  │                  │                                              │
│  │              ┌───▼────────────────●──────┐                     │
│  │              │  Experiment: v2 approach  ○─│───> Merged          │
│  │              └────────────────────────────┘                     │
│  │                                                             ●   │
│ └─────────────────────────────────────────────────────────────────  │
│      10:00      10:30      11:00      11:30      12:00     12:30     │
├─────────────────────────────────────────────────────────────────────┤
│ [+] New Branch   [📋] Copy Branch   [🗑] Delete   [📊] View Stats  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Branch Management Panel

**Purpose:** 提供分支的详细管理和操作

**Sections:**
1. **Branch List** - 所有分支的卡片列表
2. **Branch Detail** - 选中分支的详情
3. **Comparison View** - 分支间差异
4. **Merge Conflicts** - 冲突解决界面

**Branch Card:**
```
┌────────────────────────────────────────┐
│ 🌿 experiment: async-refactor         │
│    Created by you • 2 hours ago        │
│ ────────────────────────────────────── │
│ Messages: 45 | Tokens: 32K/200K (16%)  │
│ ████████░░░░░░░░░░░░░░░░ 16%           │
│ ────────────────────────────────────── │
│ [Continue] [Compare] [Merge] [Delete]  │
└────────────────────────────────────────┘
```

### 4.3 Compression Indicator

**Purpose:** 可视化上下文压缩状态

**Design:**
```
┌────────────────────────────────────────────────────────┐
│ Context Status                                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│   [████████████░░░░░░░░░░░░░░░░░░░░░░░]  62%           │
│    ↑                                               ↑  │
│    │                    ↑                         │  │
│    │                    │                         │  │
│  60% (compress       75% (warn)             85% (branch)  │
│   prepare)                                                   │
│                                                        │
│   Summary: 12 messages compressed to 1                │
│   [View Summary] [Keep All] [Branch Now]              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.4 Freeze/Resume UI

**Freeze Action:**
- 快捷键: Cmd/Ctrl + Shift + F
- 下拉菜单: "Pause Session"
- 自动冻结: Idle 超时后

**Resume Flow:**
```
┌─────────────────────────────────────────────┐
│ Session Paused                              │
│                                             │
│ Last active: 2 hours ago                   │
│ Branch: main • Messages: 156                │
│ Token usage: 45%                           │
│                                             │
│ Files being watched: 12                     │
│                                             │
│ [▶ Resume] [📋 Resume in New Tab] [🗑 End]  │
│                                             │
│ Auto-resume in: 30s  [-] [●] [+]           │
└─────────────────────────────────────────────┘
```

---

## 5. Technical Challenges and Solutions

### 5.1 Challenge: Real-time Context Tracking

**Problem:** 准确追踪上下文使用情况,避免在临界点出现延迟。

**Solution:**
```typescript
// 流式 token 计数
class ContextTracker {
  private rollingCount: number = 0;
  private messageTokens: Map<string, number> = new Map();

  // 估算每条消息的 token 数
  estimateTokens(content: string): number {
    // 粗略估算: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }

  // 更新计数
  onMessageAdded(message: NormalizedMessage): void {
    const tokens = this.estimateTokens(message.content || '');
    this.messageTokens.set(message.id, tokens);
    this.rollingCount += tokens;
  }

  onMessageRemoved(messageId: string): void {
    const tokens = this.messageTokens.get(messageId) || 0;
    this.rollingCount -= tokens;
    this.messageTokens.delete(messageId);
  }

  getUtilization(maxTokens: number): number {
    return this.rollingCount / maxTokens;
  }

  getRemaining(): number {
    return this.maxTokens - this.rollingCount - this.reservedBuffer;
  }
}
```

### 5.2 Challenge: Branch State Consistency

**Problem:** 多个客户端同时操作分支时的一致性问题。

**Solution: Optimistic Updates + Conflict Resolution**
```typescript
class BranchSyncManager {
  private pendingOps: Map<string, BranchOp> = new Map();
  private serverState: BranchState;

  async createBranch(virtualSessionId: string): Promise<Branch> {
    const opId = generateOpId();
    const optimisticBranch = this.createOptimistic(opId, virtualSessionId);

    // 立即更新 UI
    this.applyOptimistic(optimisticBranch);

    try {
      const confirmed = await this.server.createBranch(virtualSessionId);
      this.confirmOp(opId, confirmed);
      return confirmed;
    } catch (error) {
      this.rollbackOp(opId);
      throw error;
    }
  }

  // 冲突检测和解决
  onServerUpdate(serverState: BranchState): void {
    const conflicts = this.detectConflicts(serverState);
    if (conflicts.length > 0) {
      this.notifyUserConflicts(conflicts);
      // 显示冲突解决 UI
    } else {
      this.serverState = serverState;
      this.applyServerState(serverState);
    }
  }
}
```

### 5.3 Challenge: Compression Quality

**Problem:** 自动压缩可能导致关键上下文丢失。

**Solution: Protected Context + User-in-the-loop**
```typescript
interface CompressionConfig {
  // 保留策略
  protectedPatterns: RegExp[] = [
    /\b(const|let|var)\s+\w+\s*=/,  // 变量声明
    /\b(class|interface|type)\s+\w+/, // 类型定义
    /\b(import|export)\b/,            // 导入导出
    /TODO|FIXME|HACK/gi,              // 标记
  ];

  // 最小保留消息数
  minMessagesToKeep: number = 10;

  // 摘要长度限制
  maxSummaryLength: number = 2000;
}

async function compressBranch(
  branch: Branch,
  config: CompressionConfig
): Promise<CompressionRecord> {
  const messages = await loadMessages(branch.id);

  // 1. 识别保护消息(关键上下文)
  const protected = messages.filter(msg =>
    config.protectedPatterns.some(p => p.test(msg.content))
  );
  const protectedIds = new Set(protected.map(m => m.id));

  // 2. 计算可压缩消息
  const compressible = messages.filter(m => !protectedIds.has(m.id));

  // 3. 如果可压缩不足,使用摘要
  if (compressible.length < config.minMessagesToKeep) {
    return await createSummaryCompression(branch, messages, config);
  }

  // 4. 否则进行剪枝
  return await createPruningCompression(branch, compressible);
}
```

### 5.4 Challenge: Cross-Tab State Synchronization

**Problem:** 用户在多个 Tab 中打开同一会话,状态同步复杂。

**Solution: Broadcast Channel + Tab Registry**
```typescript
class TabSyncManager {
  private channel: BroadcastChannel;
  private tabId: string;
  private registeredSessions: Set<string> = new Set();

  constructor() {
    this.tabId = generateTabId();
    this.channel = new BroadcastChannel('cloudcli-tabs');

    this.channel.onmessage = (event) => {
      this.handleRemoteEvent(event.data);
    };

    // Tab 关闭时清理
    window.addEventListener('beforeunload', () => {
      this.broadcast({ type: 'TAB_CLOSED', tabId: this.tabId });
    });
  }

  // 注册会话
  registerSession(sessionId: string): void {
    this.registeredSessions.add(sessionId);
    this.broadcast({
      type: 'TAB_REGISTERED',
      tabId: this.tabId,
      sessionId,
      timestamp: Date.now(),
    });
  }

  // 广播状态更新
  broadcastUpdate(sessionId: string, update: SessionUpdate): void {
    this.broadcast({
      type: 'SESSION_UPDATE',
      sessionId,
      update,
      sourceTab: this.tabId,
      timestamp: Date.now(),
    });
  }

  // 冲突检测
  private handleRemoteEvent(event: TabEvent): void {
    if (event.tabId === this.tabId) return;

    switch (event.type) {
      case 'SESSION_UPDATE':
        if (event.sourceTab !== this.tabId) {
          // 检查是否与本地更新冲突
          if (this.hasLocalPendingUpdate(event.sessionId)) {
            this.showConflictUI(event);
          } else {
            this.applyRemoteUpdate(event);
          }
        }
        break;

      case 'TAB_CLOSED':
        this.handleTabClosed(event.tabId);
        break;
    }
  }
}
```

### 5.5 Challenge: Freeze State Durability

**Problem:** 冻结状态需要可靠持久化,支持跨应用重启恢复。

**Solution: Hybrid Storage + Checkpointing**
```typescript
interface FreezePersistence {
  // 内存: 快速访问
  memoryCache: Map<string, FreezeState>;

  // SQLite: 持久化
  db: Database;

  // 文件系统: 大型数据(JSONL 消息)
  messageStore: FileSystem;
}

async function freezeSession(sessionId: string): Promise<void> {
  const state = await captureState(sessionId);

  // 1. 写入 SQLite(元数据)
  await this.db.run(`
    INSERT OR REPLACE INTO freeze_states
    (session_id, branch_id, memory_snapshot, process_state, frozen_at, frozen_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    sessionId,
    state.branchId,
    JSON.stringify(state.memorySnapshot),
    JSON.stringify(state.processState),
    new Date().toISOString(),
    'user',
  ]);

  // 2. 刷新消息到文件系统
  await this.flushMessages(sessionId);

  // 3. 释放进程资源
  await this.releaseProcessResources(sessionId);

  // 4. 更新内存缓存
  this.memoryCache.set(sessionId, state);
}

async function resumeSession(sessionId: string): Promise<void> {
  // 1. 恢复进程资源
  await this.restoreProcessResources(sessionId);

  // 2. 加载消息回内存
  await this.loadMessages(sessionId);

  // 3. 恢复 UI 状态
  await this.restoreUIState(sessionId);

  // 4. 删除冻结状态
  await this.db.run('DELETE FROM freeze_states WHERE session_id = ?', [sessionId]);
  this.memoryCache.delete(sessionId);
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (MVP)
- [ ] 虚拟会话数据模型
- [ ] 分支表和关系
- [ ] 基础的时间线 UI
- [ ] 手动分支创建
- [ ] 分支切换

### Phase 2: Auto-Branching
- [ ] 上下文使用追踪
- [ ] 自动分支触发
- [ ] 压缩策略实现
- [ ] 压缩 UI 提示

### Phase 3: Freeze/Resume
- [ ] 冻结状态持久化
- [ ] 进程资源管理
- [ ] 恢复流程
- [ ] 自动冻结(Idle)

### Phase 4: Multi-Tab Sync
- [ ] Tab 注册
- [ ] 状态广播
- [ ] 冲突检测
- [ ] 冲突解决 UI

### Phase 5: Advanced Features
- [ ] 分支合并
- [ ] 分支比较
- [ ] 高级压缩策略
- [ ] 跨设备同步

---

## Sources

**Product Analysis:**
- Claude Code session management patterns (based on internal implementation review)
- Cursor composer and tab interface (based on documented behavior)
- GitHub Copilot context handling (based on documented behavior)

**Technical References:**
- Git branch model for version control best practices
- BroadcastChannel API for cross-tab communication
- Context window management patterns from AI SDKs

**Design Patterns:**
- Optimistic UI updates pattern
- State machine design for session lifecycle
- Hybrid compression strategies for LLM contexts

---

*Last updated: 2026-04-10*
