# Chorus — VS Code Copilot Instructions

> See [AGENTS.md](../AGENTS.md) for the full project guide (applies to all AI tools).
> This file adds VS Code Copilot-specific context only.

## Reading Order

1. Read `AGENTS.md` in the repo root — contains all project conventions, GSD workflow policy, and architecture rules.
2. This file — Copilot-specific overrides (none currently; file is reserved for future Copilot-only rules).

## Design Context

> **Brand Upgrade** — 2026-04-14  
> Product renamed from **CloudCLI** → **Chorus**. Positioning upgraded from "local multi-Agent UI" to "cloud-native AI work orchestration platform."

### Product Name

**Chorus** — In music, the chorus is where multiple voices come together in harmony under a conductor. The user is the conductor; AI Agents are the performers; code is the score.

### Users

- **Primary**: Independent developers and small teams orchestrating multiple AI Agents in parallel on desktop
- **Secondary**: Users monitoring and controlling AI Agent task progress remotely via mobile; enterprise tech teams managing shared AI workflows
- **Context**: Managing multiple AI coding Agents simultaneously (Claude Code, Cursor, Codex, Gemini CLI), switching rapidly between projects, Streams, and sessions. Users may not be professional programmers — the product must be approachable enough for non-technical users to harness AI Agents
- **Environment**: Long deep-work sessions, desktop-primary with mobile as a complement; dark environments (night or dim office) are the most common use setting

### Brand Personality

**Mastery · Intuitive · Fluid**

- **Mastery**: Like a conductor commanding an orchestra — immense power expressed through effortless precision. Every action communicates "you are conducting, not being driven"
- **Intuitive**: Zero-learning-curve depth; non-programmers can naturally collaborate with AI Agents without needing to understand development workflows
- **Fluid**: Switching between tasks feels like water flowing — state transitions and panel changes are seamless and never break focus

**Emotional goal**: The conductor's presence — orchestrating a complex AI workflow with a raised baton, watching multiple Agents respond in unison

### Positioning

**From**: Local desktop tool wrapping multiple AI CLIs  
**To**: Cloud-native AI work orchestration platform — turning human intent into multiple parallel Agent execution streams, supporting team collaboration and remote access

**Core claim**: Chorus is not a terminal tool wrapper. It explores the information flow experience of the AI development era — you lead, Agents respond, Chorus is the stage where they perform together.

### Aesthetic Direction

- Raycast-inspired precision dark-tool aesthetic (`#07080a` near-black background, macOS-native multi-layer shadows)
- Dark mode primary, light mode optional
- Brand color: Raycast Red (`#FF6363`) as a punctuation accent — used sparingly and with intention
- Typography: Inter + GeistMono, positive letter-spacing (+0.2px) for airiness on dark surfaces
- Anti-references: Terminal tool wrappers; Linear/Jira-style project management; another IDE; cyber/neon AI aesthetics (purple-blue gradients, glowing borders)

### Design Principles

1. **Conductor's View**: The interface makes the user feel like a conductor — multiple Agent states visible at a glance, actions direct, decisions require no architectural knowledge
2. **Progressive Complexity**: Simple on the surface, powerful underneath — beginners operate on instinct, power users discover orchestration capabilities
3. **Fluid Context**: Switching between projects, Streams, Sessions, and Agents is zero-friction and never interrupts flow
4. **Restrained Refinement**: Every visual element must earn its place; use brand color as punctuation, not wallpaper
5. **Democratized Power**: Non-programmers can wield AI Agents — avoid exposing git / CLI / process management complexity
