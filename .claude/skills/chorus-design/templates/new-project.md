# Adopting chorus-design in a New Project

Use this guide when you want to bring the `chorus-design` workflow to a project other than Chorus.

---

## What to Copy (Skill Assets — Generic)

These files live in `.claude/skills/chorus-design/` and are fully project-agnostic. Copy the entire directory:

```
.claude/skills/chorus-design/
  SKILL.md                        ← generic workflow rules (no changes needed)
  references/
    elevation.md                  ← replace with your project's elevation system
    typography.md                 ← replace with your project's type scale
    visual-language.md            ← replace with your project's visual reference
  templates/
    new-project.md                ← this file
    tokens.template.json          ← seed your design/tokens.json from this
    canvas.template.json          ← seed your design/canvas.json from this
  scripts/
    build-tokens.template.cjs     ← copy to scripts/build-tokens.cjs, adjust paths
```

---

## What to Create (Project-Specific Adaptation)

### 1. Create `PROJECT-<YOURPROJECT>.md`

Copy `PROJECT-CHORUS.md` and rewrite every project-specific section:

| Section              | What to change                                              |
| -------------------- | ----------------------------------------------------------- |
| Canonical Files      | Update file paths for your repo layout                      |
| Token Namespace      | Set your Pencil prefix (e.g. `myapp--`), theme axis         |
| Token Mapping Tables | Replace Chorus token names with your project's tokens       |
| Token Pipeline       | Update paths in the pipeline diagram                        |
| Canvas Index Rules   | Keep rules generic; update file path for your `canvas.json` |

### 2. Create `design/tokens.json`

Seed from `templates/tokens.template.json`. Fill in:

- Your actual color values (not Chorus values)
- Your token names (replace `cc--` prefix with your project's prefix)
- Your CSS variable names (replace `--background` etc.)
- Your Tailwind utility class names

### 3. Create `design/canvas.json`

Seed from `templates/canvas.template.json`. Register your top-level Pencil frames as you create them.

### 4. Create `design/PRODUCT.md`

Document your product's:

- Mental model and user personas
- Core interaction principles
- State system (not visual — behavioral)
- Brand personality and tone

### 5. Replace `references/` files

The three reference files in `references/` are Chorus-specific. Replace with your project's:

- `visual-language.md`: Your raw visual inspiration, color palette, component stylings, do/don'ts
- `elevation.md`: Your surface level table and shadow system
- `typography.md`: Your type scale, font families, OpenType settings

### 6. Wire up `npm run build:tokens`

Copy `scripts/build-tokens.template.cjs` → `scripts/build-tokens.cjs`.
Update the `SOURCE_FILE` and `OUTPUT_FILE` paths. Add to `package.json`:

```json
"scripts": {
  "build:tokens": "node scripts/build-tokens.cjs"
}
```

---

## Portability Checklist

Before using the skill in a new project, verify:

- [ ] `PROJECT-<YOURPROJECT>.md` exists alongside `SKILL.md`
- [ ] `design/tokens.json` is seeded and has your token namespace prefix
- [ ] `design/canvas.json` is initialized with `$version` and `$updated`
- [ ] `design/PRODUCT.md` documents product intent (not visual specs)
- [ ] `references/visual-language.md` reflects your visual language (not Chorus)
- [ ] `references/elevation.md` and `typography.md` are replaced with your values
- [ ] `npm run build:tokens` generates `design/TOKENS.md` successfully
- [ ] `src/index.css` contains your CSS custom properties
- [ ] `tailwind.config.js` bridges your CSS vars to semantic utility classes

---

## Self-Evolution Pattern

This skill is designed to evolve with the project. Update artifacts in this order:

1. **Visual language changes**: Update `references/visual-language.md` first; the distilled `elevation.md` / `typography.md` are extracted from it
2. **Token changes**: Update `design/tokens.json` (SSOT) → run `build:tokens` → update `src/index.css` → update `tailwind.config.js`
3. **Canvas structure changes**: Update `design/canvas.json` (bump `$version`) after any top-level frame addition or rename
4. **Workflow improvements**: Update `SKILL.md` when you discover a better pattern; the project adaptation file (`PROJECT-XXX.md`) captures project-specific deviations

Never update generated files (`TOKENS.md`) or project adaptation (`PROJECT-XXX.md`) without first updating the canonical source upstream.
