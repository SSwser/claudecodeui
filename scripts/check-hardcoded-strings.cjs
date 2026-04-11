const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const FILE_PATTERN = /\.(tsx|jsx)$/i;
const IGNORE_FILE_PATTERN = /\.(test|spec|stories)\.[jt]sx?$/i;
const DEFAULT_ALLOWLIST = [
  /^\d+(\.\d+)?$/,
  /^https?:\/\//,
  /^[a-z0-9-_]+$/,
  /^v\d+\.\d+/,
  /^[A-Z_]+$/,
  /^#[0-9a-fA-F]{3,8}$/,
  /^\s*$/,
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function loadAllowlist() {
  const extraAllowlistPath = process.env.I18N_ALLOWLIST;

  if (!extraAllowlistPath) {
    return DEFAULT_ALLOWLIST;
  }

  const resolvedPath = path.resolve(ROOT_DIR, extraAllowlistPath);
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('I18N_ALLOWLIST must be a JSON array of strings or regex sources.');
  }

  return DEFAULT_ALLOWLIST.concat(
    parsed.map(entry => {
      if (entry && typeof entry === 'object' && typeof entry.pattern === 'string') {
        return new RegExp(entry.pattern, entry.flags || '');
      }

      if (typeof entry === 'string') {
        return new RegExp(`^${escapeRegExp(entry)}$`);
      }

      throw new Error('I18N_ALLOWLIST entries must be strings or { pattern, flags } objects.');
    }),
  );
}

function listSourceFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (FILE_PATTERN.test(entry.name) && !IGNORE_FILE_PATTERN.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isAllowedText(text, allowlist) {
  return allowlist.some(pattern => pattern.test(text));
}

function shouldSkipCandidate(text) {
  return (
    text.length < 4 ||
    text.includes('{') ||
    text.includes('}') ||
    text.includes('=') ||
    text.includes('&') ||
    text.includes('|') ||
    text.includes('=>') ||
    /^[^A-Za-z]*$/.test(text)
  );
}

function collectViolations(filePath, allowlist) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const violations = [];
  const textNodePattern = /<[A-Za-z][^>]*>\s*([^<{][^<]*?[A-Za-z][^<]*?)\s*<\//g;

  lines.forEach((line, index) => {
    if (line.includes('// i18n-ignore')) {
      return;
    }

    let match = textNodePattern.exec(line);
    while (match) {
      const candidate = match[1].trim().replace(/\s+/g, ' ');

      if (!shouldSkipCandidate(candidate) && !isAllowedText(candidate, allowlist)) {
        violations.push({
          filePath,
          line: index + 1,
          text: candidate,
        });
      }

      match = textNodePattern.exec(line);
    }
  });

  return violations;
}

function main() {
  const allowlist = loadAllowlist();
  const files = listSourceFiles(SRC_DIR);
  const violations = files.flatMap(filePath => collectViolations(filePath, allowlist));

  console.log('Checking src/ for hardcoded UI strings...');
  console.log('');

  if (violations.length === 0) {
    console.log('No hardcoded string violations found.');
    process.exit(0);
  }

  for (const violation of violations) {
    const relativePath = path.relative(ROOT_DIR, violation.filePath).replace(/\\/g, '/');
    console.log(`VIOLATION: ${relativePath}:${violation.line}`);
    console.log(`  > ${violation.text}`);
    console.log("  Use: t('namespace.section.key') or add // i18n-ignore");
    console.log('');
  }

  console.log(
    `Found ${violations.length} violation(s). Run with I18N_ALLOWLIST=path/to/allowlist.json to add exceptions.`,
  );
  process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}