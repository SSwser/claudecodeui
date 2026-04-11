# MCP + Code Connect Workflow

This guide explains how to use Figma MCP and Code Connect in this repo, including a practical code <-> Figma roundtrip.

## 1. What Each Capability Is For

- Figma MCP (`use_figma`, `get_design_context`, `generate_figma_design`): read/write design content and convert web pages to Figma when needed.
- Code Connect: map Figma component nodes to code components so generated/adapted code can prefer real project primitives.

## 2. Recommended Workflows

### A. Figma -> Code (most common)

1. Get design context from target node.
2. Adapt output to this repo conventions:
   - semantic Tailwind tokens
   - existing primitives in `src/shared/view/ui/` and `src/components/ui/`
   - feature-folder placement (`src/components/<feature>/view/`)
3. Validate responsive + dark mode.
4. Run project checks (typecheck/build/lint if applicable).

### B. Existing Web UI -> Figma (capture)

Use `generate_figma_design` when you need to capture a running page/view into Figma initially.

Typical use:

1. Start local app and identify exact URL/view.
2. Call capture workflow.
3. Choose output mode (`newFile`, `existingFile`, or `clipboard`).
4. Open resulting Figma and continue design iteration.

### C. Figma Node -> Code Mapping (Code Connect)

1. Request mapping suggestions for a node.
2. Review suggested code component paths and names.
3. Save approved mappings.
4. Use mappings in subsequent adaptation so generated code reuses real components.

## 3. Can We Do Code -> Figma -> Adjust -> Restore Back to Code?

Short answer: yes, but with guardrails.

Practical expectation:

- Yes: you can generate/capture UI into Figma, adjust layout/visuals, then implement back into repo code.
- Not fully automatic: Figma edits do not guarantee one-click, lossless reverse-compilation to production code.
- Best result comes from a controlled loop:
  1. Keep component boundaries stable in code.
  2. Use Code Connect mappings for core components.
  3. Re-apply changed structure/tokens manually (or semi-automatically) into existing feature files.

## 4. Recommended Roundtrip Protocol (Team-safe)

1. Pick a single screen or feature scope.
2. Ensure existing code components are mapped (Code Connect).
3. Capture or sync current UI state to Figma if needed.
4. Designer adjusts layout in Figma.
5. Export target node context and implement delta only (not full rewrite).
6. Validate with checklist in `docs/figma/FIGMA-TO-CODE-CHECKLIST.md`.
7. Repeat in small iterations.

## 5. Repo-specific Guardrails

- Keep tokens semantic (`src/index.css`, `tailwind.config.js`).
- Prefer existing primitives over new base components.
- Keep static assets under `public/`.
- Use `lucide-react` for generic icons and provider logo wrappers for model branding.
- Avoid introducing parallel styling systems.

## 6. Minimal Decision Guide

- Need to capture a web page into Figma for first-time design work: use MCP capture workflow.
- Need to turn Figma node into repo code: use design context + checklist.
- Need consistent component reuse across iterations: configure Code Connect mappings.
- Need exact visual parity after design edits: implement in small deltas and verify in app, not by full regenerated overwrite.
