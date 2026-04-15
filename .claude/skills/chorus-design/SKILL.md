---
name: chorus-design
description: Reusable design-system workflow for projects that pair a Pencil canvas, a canvas.json node index, and a Tokens Studio compatible token registry bridged into CSS variables and Tailwind. Use when refactoring token SSOT files, generated token docs, canvas index conventions, or project adaptation rules for design-to-code work. Read the project adaptation file in this skill for repo-specific paths, prefixes, and sync rules.
---

# Chorus Design

Use this skill when the task is about design-system structure rather than raw Pencil API mechanics.

- Token schema changes
- Token build scripts and generated token artifacts
- Canvas index ownership and lifecycle
- Design-to-code authority boundaries
- Project adaptation docs for a specific repo

For Pencil API pitfalls and mutation patterns, load `../pencil-mcp/SKILL.md` separately.

## Core Model

Three artifacts define the design system contract:

1. `tokens.json`: canonical token registry in Tokens Studio compatible format
2. `canvas.json`: machine-readable registry for top-level Pencil frames and component variants
3. Project adaptation file: repo-specific bridges from tokens into CSS, Tailwind, and Pencil variables

Generated Markdown files are secondary artifacts. They are for agent context and review ergonomics, not the source of truth.

## Workflow

### 1. Load project adaptation first

Read the project adaptation file in this skill before editing anything. It should tell you:

- where `tokens.json`, `canvas.json`, and the Pencil file live
- which CSS file owns design tokens
- which Tailwind config bridges semantic tokens
- the Pencil variable prefix and theme axis

### 2. Keep tokens Tokens Studio compatible

Token nodes should use the DTCG-style shape:

```json
{
  "$value": "#07080a",
  "$type": "color",
  "$description": "App background",
  "$extensions": {
    "com.example.design": {
      "css": "--background",
      "tailwind": "bg-background",
      "light": "220 23% 97%",
      "dark": "216 18% 3%"
    }
  }
}
```

Rules:

- Put interoperability fields in `$value` and `$type`
- Put repo-specific bridge metadata in `$extensions`
- Do not duplicate raw values across multiple project docs
- Preserve the bridge metadata needed by CSS, Tailwind, and Pencil sync scripts

### 3. Treat generated token docs as derived artifacts

If the repo generates a `TOKENS.md`-style file:

- keep it auto-generated
- position it as an agent context artifact, not a parallel source of truth
- regenerate it immediately after token edits

### 4. Keep canvas index machine-readable

`canvas.json` should only track top-level frames, component variant sets, statuses, and code or brief cross-links that need to survive outside the design file.

Do not create a second human-maintained map if agents can query `canvas.json` directly.

### 5. Split generic workflow from project adaptation

Keep this skill generic. Move repo-specific details into a sibling project adaptation file.

- Generic skill owns: workflow, schema expectations, artifact boundaries
- Project adaptation owns: file paths, token prefixes, theme axes, naming conventions, concrete mappings

## Templateable Architecture

This skill is designed to be portable across projects. The directory structure separates generic workflow from project-specific knowledge:

```
.claude/skills/chorus-design/
  SKILL.md                        ← generic workflow (shared, never project-specific)
  PROJECT-<YOURPROJECT>.md        ← project adaptation: paths, prefix, token maps
  references/
    visual-language.md            ← project's raw visual system (colors, components, do/don'ts)
    elevation.md                  ← surface level table + shadow recipes
    typography.md                 ← type scale, font families, OpenType settings
  templates/
    new-project.md                ← step-by-step guide for adopting in a new repo
    tokens.template.json          ← seed file for a new project's tokens.json
    canvas.template.json          ← seed file for a new project's canvas.json
  scripts/
    build-tokens.cjs              ← project instance of the token doc generator
    build-tokens.template.cjs     ← portable template for generating TOKENS.md
```

**To adopt in a new project:**

1. Copy the entire `chorus-design/` directory to `.claude/skills/your-design/`
2. Create `PROJECT-<YOURPROJECT>.md` from `templates/new-project.md`
3. Replace `references/*.md` with your project's visual language
4. Seed `design/tokens.json` from `templates/tokens.template.json`
5. Seed `design/canvas.json` from `templates/canvas.template.json`
6. Copy `scripts/build-tokens.template.cjs` → `scripts/build-tokens.cjs`, adjust paths

**Self-evolution rule**: when you discover a better generic pattern, update `SKILL.md`. When you discover a better project-specific pattern, update `PROJECT-XXX.md`. Never mix the two.

## Bundled Resources

- `PROJECT-CHORUS.md`: Chorus-specific adaptation for this repo
- `references/visual-language.md`: raw visual language — color palette, component stylings, do/don'ts, agent prompt guide
- `references/elevation.md`: surface level table, Raycast shadow recipes, and CSS card shadow implementation
- `references/typography.md`: full type scale, font families, and OpenType settings
- `templates/new-project.md`: guide for adopting this skill in a new project
- `templates/tokens.template.json`: minimal DTCG-style token schema seed
- `templates/canvas.template.json`: minimal canvas.json seed
- `scripts/build-tokens.cjs`: Chorus instance of the token doc generator (called by `npm run build:tokens`)
- `scripts/build-tokens.template.cjs`: portable template for adopting this workflow in other projects
