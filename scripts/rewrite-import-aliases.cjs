#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = process.cwd();
const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const ALIAS_ROOTS = [
  {
    alias: '@shared',
    absolutePath: path.join(ROOT_DIR, 'shared'),
  },
  {
    alias: '@',
    absolutePath: path.join(ROOT_DIR, 'src'),
  },
];

function printHelp() {
  console.log(`Rewrite deep relative imports to configured aliases.

Usage:
  node scripts/rewrite-import-aliases.cjs --staged [--restage]
  node scripts/rewrite-import-aliases.cjs --file src/App.tsx --file src/main.jsx
  node scripts/rewrite-import-aliases.cjs --dir src/components/main-content --dir src/hooks
  node scripts/rewrite-import-aliases.cjs src/App.tsx src/main.jsx
  node scripts/rewrite-import-aliases.cjs --dir src/components --check

Options:
  --file, --files <path>    Add one or more files (repeatable, comma-separated supported)
  --dir, --dirs <path>      Add one or more directories recursively
  --staged                  Include currently staged git files
  --restage                 Re-add modified files to the git index after rewriting
  --check                   Report pending rewrites without writing files
  --help                    Show this help text
`);
}

function normalizeToPosix(value) {
  return value.split(path.sep).join('/');
}

function splitArgValues(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const options = {
    files: [],
    dirs: [],
    staged: false,
    restage: false,
    check: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--staged') {
      options.staged = true;
      continue;
    }

    if (arg === '--restage') {
      options.restage = true;
      continue;
    }

    if (arg === '--check' || arg === '--dry-run') {
      options.check = true;
      continue;
    }

    if (arg === '--file' || arg === '--files') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a path value`);
      }
      options.files.push(...splitArgValues(value));
      index += 1;
      continue;
    }

    if (arg === '--dir' || arg === '--dirs') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a path value`);
      }
      options.dirs.push(...splitArgValues(value));
      index += 1;
      continue;
    }

    if (!arg.startsWith('-')) {
      options.files.push(arg);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isSupportedFile(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function isInsidePath(candidatePath, parentPath) {
  const relativePath = path.relative(parentPath, candidatePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function resolveInputPath(inputPath) {
  return path.resolve(ROOT_DIR, inputPath);
}

function collectFilesFromDirectory(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesFromDirectory(fullPath));
      continue;
    }

    if (entry.isFile() && isSupportedFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getStagedFiles() {
  const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
  }).trim();

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((filePath) => resolveInputPath(filePath))
    .filter(
      (filePath) =>
        fs.existsSync(filePath) && fs.statSync(filePath).isFile() && isSupportedFile(filePath)
    );
}

function collectTargetFiles(options) {
  const targetFiles = new Set();

  for (const inputPath of options.files) {
    const filePath = resolveInputPath(inputPath);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new Error(`File not found: ${inputPath}`);
    }
    if (isSupportedFile(filePath)) {
      targetFiles.add(filePath);
    }
  }

  for (const inputPath of options.dirs) {
    const directoryPath = resolveInputPath(inputPath);
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      throw new Error(`Directory not found: ${inputPath}`);
    }
    for (const filePath of collectFilesFromDirectory(directoryPath)) {
      targetFiles.add(filePath);
    }
  }

  if (options.staged) {
    for (const filePath of getStagedFiles()) {
      targetFiles.add(filePath);
    }
  }

  return [...targetFiles].sort((left, right) => left.localeCompare(right));
}

function rewriteSpecifier(fromFilePath, specifier) {
  if (!specifier.match(/^(\.\.\/){2,}/)) {
    return specifier;
  }

  const absoluteTarget = path.resolve(path.dirname(fromFilePath), specifier);

  for (const aliasRoot of ALIAS_ROOTS) {
    if (!isInsidePath(absoluteTarget, aliasRoot.absolutePath)) {
      continue;
    }

    const relativeTarget = normalizeToPosix(path.relative(aliasRoot.absolutePath, absoluteTarget));
    return relativeTarget ? `${aliasRoot.alias}/${relativeTarget}` : aliasRoot.alias;
  }

  return specifier;
}

function rewriteFileImports(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;

  const patterns = [/(\bfrom\s*['"])([^'"]+)(['"])/g, /(\bimport\s*\(\s*['"])([^'"]+)(['"]\s*\))/g];

  let updatedSource = source;

  for (const pattern of patterns) {
    updatedSource = updatedSource.replace(pattern, (fullMatch, prefix, specifier, suffix) => {
      const nextSpecifier = rewriteSpecifier(filePath, specifier);
      if (nextSpecifier === specifier) {
        return fullMatch;
      }

      replacements += 1;
      return `${prefix}${nextSpecifier}${suffix}`;
    });
  }

  return {
    changed: updatedSource !== source,
    replacements,
    updatedSource,
  };
}

function restageFiles(filePaths) {
  if (filePaths.length === 0) {
    return;
  }

  // Keep staged intent intact after rewrites so the user can continue reviewing
  // the same staged file set instead of having changes unexpectedly drop to unstaged.
  const relativeFilePaths = filePaths.map((filePath) => path.relative(ROOT_DIR, filePath));
  execFileSync('git', ['add', '--', ...relativeFilePaths], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const targetFiles = collectTargetFiles(options);
  if (targetFiles.length === 0) {
    throw new Error('No target files found. Use --file, --dir, or --staged.');
  }

  const changedFiles = [];
  let replacementCount = 0;

  for (const filePath of targetFiles) {
    const result = rewriteFileImports(filePath);
    if (!result.changed) {
      continue;
    }

    replacementCount += result.replacements;
    changedFiles.push(filePath);

    if (!options.check) {
      fs.writeFileSync(filePath, result.updatedSource, 'utf8');
    }
  }

  if (changedFiles.length === 0) {
    console.log(`No matching deep relative imports found in ${targetFiles.length} file(s).`);
    return;
  }

  const relativeChangedFiles = changedFiles.map((filePath) =>
    normalizeToPosix(path.relative(ROOT_DIR, filePath))
  );

  if (!options.check && options.restage) {
    restageFiles(changedFiles);
  }

  console.log(
    `${options.check ? 'Would rewrite' : 'Rewrote'} ${replacementCount} import path(s) in ${changedFiles.length} file(s).`
  );
  for (const filePath of relativeChangedFiles) {
    console.log(`- ${filePath}`);
  }

  if (options.check) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
