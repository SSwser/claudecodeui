# ClaudecodeUI — VS Code Copilot Instructions

> See [AGENTS.md](../AGENTS.md) for the full project guide (applies to all AI tools).
> This file adds VS Code Copilot-specific context only.

## Reading Order

1. Read `AGENTS.md` in the repo root — contains all project conventions, GSD workflow policy, and architecture rules.
2. This file — Copilot-specific overrides (none currently; file is reserved for future Copilot-only rules).

## Design Context

### Users

- **Primary**: Independent developers and small teams doing parallel multi-project work on desktop
- **Secondary**: Users monitoring and controlling AI Agent task progress remotely via mobile
- **Context**: Managing multiple AI coding Agents simultaneously (Claude Code, Cursor, Codex, Gemini CLI), switching rapidly between projects and sessions. Users may not be professional programmers — the product must be approachable enough for non-technical users to harness AI Agents
- **Environment**: Long deep-work sessions, desktop-primary with mobile as a complement; dark environments (night or dim office) are the most common use setting

### Brand Personality

**Mastery · Intuitive · Fluid**

- **Mastery**: A commander's control console — powerful enough to inspire confidence, where every action communicates "you are in control"
- **Intuitive**: Zero-learning-curve depth; non-programmers can naturally collaborate with AI Agents without needing to understand development workflows
- **Fluid**: Switching between tasks feels like water flowing — state transitions and panel changes are seamless and never break focus

**Emotional goal**: A sense of mastery and confidence — a pilot's cockpit where everything is under control

### Aesthetic Direction

- Raycast-inspired precision dark-tool aesthetic (`#07080a` near-black background, macOS-native multi-layer shadows)
- Dark mode primary, light mode optional
- Brand color: Raycast Red (`#FF6363`) as a punctuation accent — used sparingly and with intention
- Typography: Inter + GeistMono, positive letter-spacing (+0.2px) for airiness on dark surfaces
- Anti-references: Don't import Linear/Jira-style project management concepts; don't build another IDE

### Design Principles

1. **Commander's View**: Clear information hierarchy, critical status visible at a glance, direct paths to action
2. **Progressive Complexity**: Simple on the surface, powerful underneath — beginners operate on instinct, power users discover shortcuts
3. **Fluid Context**: Switching between tasks, sessions, and Agents is zero-friction and never interrupts flow
4. **Restrained Refinement**: Every visual element must earn its place; use brand color as punctuation, not wallpaper
5. **Democratized Power**: Non-programmers can wield AI Agents — avoid jargon and complex development workflow concepts
