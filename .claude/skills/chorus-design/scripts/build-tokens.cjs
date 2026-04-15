#!/usr/bin/env node

/**
 * Token Build Script — Chorus
 *
 * Reads design/tokens.json (Tokens Studio compatible, SSOT) and regenerates
 * design/TOKENS.md as a human-readable reference table for AI context injection.
 *
 * Usage: node .claude/skills/chorus-design/scripts/build-tokens.cjs
 *    or: npm run build:tokens
 */

const fs = require('fs');
const path = require('path');

// 4 levels up from .claude/skills/chorus-design/scripts/ → project root
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TOKENS_PATH = path.join(PROJECT_ROOT, 'design', 'tokens.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'design', 'TOKENS.md');
const EXTENSION_NAMESPACE = 'com.chorus.design';

function loadTokens() {
  const raw = fs.readFileSync(TOKENS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function isTokenNode(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && '$value' in value;
}

function getTokenMeta(token) {
  return token.$extensions?.[EXTENSION_NAMESPACE] || {};
}

function formatTitle(value) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderColorTable(title, tokens) {
  const rows = [];
  for (const [key, token] of Object.entries(tokens)) {
    if (key.startsWith('$') || !isTokenNode(token)) continue;
    const meta = getTokenMeta(token);
    const hex = meta.pencilHex || '—';
    const css = meta.css ? `\`${meta.css}\`` : '—';
    const tw = meta.tailwind ? `\`${meta.tailwind}\`` : '—';
    const desc = token.$description || '';
    const note = meta.gap || meta.note || '';
    const descCol = note ? `${desc} ⚠️ ${note}` : desc;
    rows.push(`| ${hex} | ${css} | ${tw} | ${descCol} |`);
  }

  if (rows.length === 0) return '';

  return [
    `### ${title}`,
    '',
    '| Pencil Hex | CSS Token | Tailwind | Description |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

function renderSimpleTable(title, tokens, columns) {
  const rows = [];
  for (const [key, token] of Object.entries(tokens)) {
    if (key.startsWith('$') || !isTokenNode(token)) continue;

    const meta = getTokenMeta(token);
    const cols = columns.map((col) => {
      const val = col.key === 'value' ? token.$value : meta[col.key];
      if (val === undefined || val === null) return '—';
      if (col.code) return `\`${val}\``;
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    });
    rows.push(`| ${key} | ${cols.join(' | ')} |`);
  }

  if (rows.length === 0) return '';

  const header = columns.map((c) => c.label).join(' | ');
  const separator = columns.map(() => '---').join(' | ');

  return [`### ${title}`, '', `| Name | ${header} |`, `| --- | ${separator} |`, ...rows, ''].join(
    '\n'
  );
}

function build() {
  const tokens = loadTokens();
  const tokenRoot = tokens.global || tokens;

  const sections = [];

  // Header
  sections.push(
    [
      '# Design Tokens Reference',
      '',
      '> **AI context injection artifact** — auto-generated from `design/tokens.json`. Do not edit manually.',
      '> Run `npm run build:tokens` to regenerate.',
      '',
    ].join('\n')
  );

  // Color sections
  const colorGroups = tokenRoot.color || {};
  for (const [groupName, group] of Object.entries(colorGroups)) {
    if (groupName.startsWith('$')) continue;
    const title = `${formatTitle(groupName)} Colors`;
    const table = renderColorTable(title, group);
    if (table) sections.push(table);
  }

  // Radius
  if (tokenRoot.radius) {
    sections.push(
      renderSimpleTable('Border Radius', tokenRoot.radius, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
        { key: 'tailwind', label: 'Tailwind', code: true },
      ])
    );
  }

  // Typography — font size
  if (tokenRoot.typography?.fontSize) {
    sections.push(
      renderSimpleTable('Font Size', tokenRoot.typography.fontSize, [
        { key: 'value', label: 'Size', code: false },
        { key: 'lineHeight', label: 'Line Height', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  // Typography — font weight
  if (tokenRoot.typography?.fontWeight) {
    sections.push(
      renderSimpleTable('Font Weight', tokenRoot.typography.fontWeight, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  // Typography — letter spacing
  if (tokenRoot.typography?.letterSpacing) {
    sections.push(
      renderSimpleTable('Letter Spacing', tokenRoot.typography.letterSpacing, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  // Spacing
  if (tokenRoot.spacing) {
    sections.push(
      renderSimpleTable('Spacing Scale', tokenRoot.spacing, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  const output = sections.join('\n');
  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_PATH}`);
  console.log('');
  console.log('⚡ design/tokens.json updated — remember to sync Pencil variables:');
  console.log(
    '   In your AI agent, load chorus-design for token workflow and pencil-mcp for canvas updates'
  );
}

build();
