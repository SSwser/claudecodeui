#!/usr/bin/env node

/**
 * Token Build Script
 *
 * Reads design/tokens.json (SSOT) and regenerates design/TOKENS.md
 * as a human-readable reference table.
 *
 * Usage: node scripts/build-tokens.js
 */

const fs = require('fs');
const path = require('path');

const TOKENS_PATH = path.resolve(__dirname, '..', 'design', 'tokens.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'design', 'TOKENS.md');

function loadTokens() {
  const raw = fs.readFileSync(TOKENS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function renderColorTable(title, tokens) {
  const rows = [];
  for (const [key, token] of Object.entries(tokens)) {
    if (key.startsWith('_')) continue;
    const hex = token.pencilHex || '—';
    const css = token.css ? `\`${token.css}\`` : '—';
    const tw = token.tailwind ? `\`${token.tailwind}\`` : '—';
    const desc = token.description || '';
    const note = token._gap || token._note || '';
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
    if (key.startsWith('_')) continue;
    const cols = columns.map((col) => {
      const val = token[col.key];
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

  const sections = [];

  // Header
  sections.push(
    [
      '# Design Tokens Reference',
      '',
      '> **Auto-generated** from `design/tokens.json`. Do not edit manually.',
      '> Run `npm run tokens:build` to regenerate.',
      '',
    ].join('\n')
  );

  // Color sections
  const colorGroups = tokens.color || {};
  for (const [groupName, group] of Object.entries(colorGroups)) {
    const title = groupName.charAt(0).toUpperCase() + groupName.slice(1) + ' Colors';
    const table = renderColorTable(title, group);
    if (table) sections.push(table);
  }

  // Radius
  if (tokens.radius) {
    sections.push(
      renderSimpleTable('Border Radius', tokens.radius, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
        { key: 'tailwind', label: 'Tailwind', code: true },
      ])
    );
  }

  // Typography — font size
  if (tokens.typography?.fontSize) {
    sections.push(
      renderSimpleTable('Font Size', tokens.typography.fontSize, [
        { key: 'value', label: 'Size', code: false },
        { key: 'lineHeight', label: 'Line Height', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  // Typography — font weight
  if (tokens.typography?.fontWeight) {
    sections.push(
      renderSimpleTable('Font Weight', tokens.typography.fontWeight, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  // Typography — letter spacing
  if (tokens.typography?.letterSpacing) {
    sections.push(
      renderSimpleTable('Letter Spacing', tokens.typography.letterSpacing, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  // Spacing
  if (tokens.spacing) {
    sections.push(
      renderSimpleTable('Spacing Scale', tokens.spacing, [
        { key: 'value', label: 'Value', code: false },
        { key: 'css', label: 'CSS Token', code: true },
      ])
    );
  }

  const output = sections.join('\n');
  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_PATH}`);
}

build();
