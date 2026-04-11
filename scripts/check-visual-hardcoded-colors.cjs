const fs = require('fs');
const path = require('path');

const TARGET_DIRECTORIES = [
  'src/components/home/view',
  'src/components/app/view',
  'src/components/auth/view',
  'src/components/chat/view/subcomponents',
  'src/components/chat/constants',
  'src/components/settings/view',
  'src/components/version-upgrade/view',
];

const INCLUDED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const BANNED_PATTERNS = [
  /bg-blue-[^\s'"`}]+/g,
  /text-blue-[^\s'"`}]+/g,
  /hover:bg-blue-[^\s'"`}]+/g,
  /hover:text-blue-[^\s'"`}]+/g,
  /bg-purple-[^\s'"`}]+/g,
  /text-purple-[^\s'"`}]+/g,
  /hover:bg-purple-[^\s'"`}]+/g,
  /hover:text-purple-[^\s'"`}]+/g,
  /bg-gray-[^\s'"`}]+/g,
  /text-gray-[^\s'"`}]+/g,
  /hover:bg-gray-[^\s'"`}]+/g,
  /hover:text-gray-[^\s'"`}]+/g,
  /dark:bg-gray-[^\s'"`}]+/g,
  /dark:text-gray-[^\s'"`}]+/g,
  /focus:ring-blue-[^\s'"`}]+/g,
  /focus:border-blue-[^\s'"`}]+/g,
];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function getLineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function collectViolations(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  for (const pattern of BANNED_PATTERNS) {
    const matches = source.matchAll(pattern);
    for (const match of matches) {
      if (typeof match.index !== 'number') {
        continue;
      }

      violations.push({
        line: getLineNumber(source, match.index),
        value: match[0],
      });
    }
  }

  return violations;
}

const root = process.cwd();
const violations = [];

for (const relativeDirectory of TARGET_DIRECTORIES) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) {
    continue;
  }

  for (const filePath of walk(absoluteDirectory)) {
    const fileViolations = collectViolations(filePath);
    for (const violation of fileViolations) {
      violations.push({
        filePath: path.relative(root, filePath),
        ...violation,
      });
    }
  }
}

if (violations.length > 0) {
  console.error(
    'design-md audit failed. Remove legacy blue/purple/gray hardcoded visual classes from covered surfaces:'
  );
  for (const violation of violations) {
    console.error(`- ${violation.filePath}:${violation.line} -> ${violation.value}`);
  }
  process.exit(1);
}

console.log(
  'design-md audit passed. No banned hardcoded visual classes found in covered directories.'
);
