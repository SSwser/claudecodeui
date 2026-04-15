#!/usr/bin/env node

/**
 * Portable token-doc generator template.
 *
 * Expected input: a Tokens Studio compatible token registry where repo-specific
 * bridge metadata lives under `$extensions[namespace]`.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TOKENS_PATH = path.join(PROJECT_ROOT, 'design', 'tokens.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'design', 'TOKENS.md');
const NAMESPACE = 'com.example.design';

function loadTokens() {
  return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
}

function isTokenNode(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && '$value' in value;
}

function getMeta(token) {
  return token.$extensions?.[NAMESPACE] || {};
}

function toTitle(key) {
  return key
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderColorTable(groupName, groupTokens) {
  const rows = Object.entries(groupTokens)
    .filter(([key, value]) => !key.startsWith('$') && isTokenNode(value))
    .map(([, token]) => {
      const meta = getMeta(token);
      const hex = meta.pencilHex || '—';
      const css = meta.css ? `\`${meta.css}\`` : '—';
      const tailwind = meta.tailwind ? `\`${meta.tailwind}\`` : '—';
      const description = token.$description || '—';
      return `| ${hex} | ${css} | ${tailwind} | ${description} |`;
    });

  if (rows.length === 0) {
    return '';
  }

  return [
    `### ${toTitle(groupName)} Colors`,
    '',
    '| Pencil Hex | CSS Token | Tailwind | Description |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

function build() {
  const tokens = loadTokens();
  const colorGroups = tokens.global?.color || {};
  const sections = [
    '# Design Tokens Reference',
    '',
    '> **AI context injection artifact** — auto-generated from `design/tokens.json`. Do not edit manually.',
    '',
  ];

  for (const [groupName, groupTokens] of Object.entries(colorGroups)) {
    if (groupName.startsWith('$')) {
      continue;
    }

    const table = renderColorTable(groupName, groupTokens);
    if (table) {
      sections.push(table);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, `${sections.join('\n')}\n`, 'utf8');
  console.log(`Generated ${OUTPUT_PATH}`);
}

build();
