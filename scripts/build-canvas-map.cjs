#!/usr/bin/env node

/**
 * Canvas Map Build Script
 *
 * Reads design/main.pen.index (SSOT) and regenerates design/CANVAS-MAP.md
 * as a human-readable reference table for PR review and AI prose queries.
 *
 * Usage: node scripts/build-canvas-map.cjs
 *        npm run build:canvas
 *
 * DO NOT hand-edit CANVAS-MAP.md — edit main.pen.index instead.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.resolve(__dirname, '..', 'design', 'main.pen.index');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'design', 'CANVAS-MAP.md');

const STATUS_ICON = { locked: '`[x]`', wip: '`[~]`', pending: '`[ ]`' };
const BRIEF_BASE = '.planning/phases/02-core-sessions/';

function briefLink(file) {
  if (!file) return '—';
  const [filename, anchor] = file.split('#');
  const display = anchor
    ? `${filename} §${anchor.replace(/-/g, ' ').replace(/\d+\s*/g, '')}`
    : filename;
  return `[${display.trim()}](./${BRIEF_BASE}${file})`;
}

function flowLink(anchor) {
  if (!anchor) return '—';
  if (anchor.startsWith('02-DESIGN-BRIEF-FLOWS')) {
    const [file, hash] = anchor.split('#');
    return `[FLOWS.md §${hash}](./${BRIEF_BASE}${file}.md#${hash})`;
  }
  return anchor;
}

function buildPagesSection(pages) {
  const lines = [];
  lines.push('## 01 — Pages (`5NJPi`)\n');
  lines.push('Full-screen app state pages, organized into 3 row groups.\n');

  for (const [groupName, group] of Object.entries(pages)) {
    lines.push(`### ${groupName} (\`${group.groupId}\` → content \`${group.contentId}\`)\n`);
    lines.push(
      '| Status | Wrapper ID | Screen ID | Frame Name | Brief Section | Flow Anchor | Impl Path |'
    );
    lines.push(
      '| ------ | ---------- | --------- | ---------- | ------------- | ----------- | --------- |'
    );
    for (const f of group.frames) {
      const status = STATUS_ICON[f.status] || STATUS_ICON.wip;
      const brief = briefLink(f.brief);
      const flow = flowLink(f.flowAnchor);
      const impl = f.implPath ? `\`${f.implPath}\`` : '—';
      lines.push(
        `| ${status} | \`${f.wrapperId}\` | \`${f.screenId}\` | \`${f.name}\` | ${brief} | ${flow} | ${impl} |`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function buildComponentsSection(components) {
  const lines = [];

  for (const [sectionKey, section] of Object.entries(components)) {
    const sectionNum = { sidebar: '02', session: '03', overlays: '04' }[sectionKey] || '??';
    const rootIds = { sidebar: 'Z3eP8', session: 'nlmcQ', overlays: '7fmkI' };
    lines.push(`## ${sectionNum} — ${section.label} (\`${rootIds[sectionKey]}\`)\n`);
    lines.push('| Status | Node ID | Frame Name | Brief Section | Impl Path |');
    lines.push('| ------ | ------- | ---------- | ------------- | --------- |');

    for (const item of section.items) {
      const status = STATUS_ICON[item.status] || STATUS_ICON.wip;
      const brief = briefLink(item.brief);
      const impl = item.implPath ? `\`${item.implPath}\`` : '—';
      lines.push(`| ${status} | \`${item.nodeId}\` | \`${item.name}\` | ${brief} | ${impl} |`);

      if (item.variantGroups) {
        for (const [, group] of Object.entries(item.variantGroups)) {
          const variantList = Object.entries(group.variants)
            .map(([id, label]) => `\`${id}\` ${label}`)
            .join(' · ');
          lines.push(`| | | > **${group.label}**: ${variantList} | | |`);
        }
      } else if (item.variants) {
        const variantList = Object.entries(item.variants)
          .map(([id, label]) => `\`${id}\` ${label}`)
          .join(' · ');
        lines.push(`| | | > **Variants**: ${variantList} | | |`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function buildGapSection(gapAnalysis) {
  const lines = [];
  lines.push('## Gap Analysis — Brief ↔ Canvas\n');

  lines.push('### Open Gaps\n');
  lines.push('| # | Area | Description | Severity | Note |');
  lines.push('| - | ---- | ----------- | -------- | ---- |');
  for (const g of gapAnalysis.open) {
    lines.push(`| ${g.id} | ${g.area} | ${g.description} | ${g.severity} | ${g.note} |`);
  }
  lines.push('');

  lines.push('### Resolved\n');
  lines.push('| # | Description | Resolution |');
  lines.push('| - | ----------- | ---------- |');
  for (const g of gapAnalysis.resolved) {
    lines.push(`| ${g.id} | ${g.description} | ${g.resolution} |`);
  }
  lines.push('');

  return lines.join('\n');
}

function buildPendingSection(pending) {
  if (!pending || pending.length === 0) return '';
  const lines = [];
  lines.push('## Pending — 未开始\n');
  lines.push('| Status | Planned Frame Name | Brief Section | Note |');
  lines.push('| ------ | ------------------ | ------------- | ---- |');
  for (const p of pending) {
    const brief = briefLink(p.brief);
    lines.push(`| \`[ ]\` | \`${p.name}\` | ${brief} | ${p.note || '—'} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function build() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

  const header = `# Pencil Canvas Map

> **Auto-generated** from \`design/main.pen.index\` — do NOT hand-edit this file.
> Run \`npm run build:canvas\` to regenerate after editing the index source.
>
> **Version**: ${index.$version} · **Updated**: ${index.$updated}
> **Canvas file**: \`${index.$file}\`

**Status key**: \`[x]\` locked · \`[~]\` wip · \`[ ]\` pending

---

`;

  const pages = buildPagesSection(index.pages);
  const components = buildComponentsSection(index.components);
  const pending = buildPendingSection(index.pending);
  const gaps = buildGapSection(index.gapAnalysis);
  const footer = `---

> Edit \`design/main.pen.index\` to update this map, then run \`npm run build:canvas\`.
`;

  const output = header + pages + '---\n\n' + components + '---\n\n' + pending + gaps + footer;
  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(`✓ CANVAS-MAP.md generated from main.pen.index (v${index.$version})`);
}

build();
