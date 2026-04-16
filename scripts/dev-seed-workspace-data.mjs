import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.join(os.homedir(), '.chorus', 'auth.db');
const args = process.argv.slice(2);

const usage = () => {
  console.log(`
Usage: node dev-seed-workspace-data.mjs [options]

Options:
  --db-path <path>             Path to the SQLite auth DB (default: ~/.chorus/auth.db)
  --project-name <name>        Project name (default: dev-seed-project)
  --project-display-name <name> Project display name (default: same as project name)
  --project-path <path>        Project directory path (default: ./dummy-path)
  --workspace-name <name>      Workspace name (default: dev-stale-workspace)
  --worktree-path <path>       Workspace worktree path (default: .worktrees/<workspace-name>)
  --branch <name>              Worktree branch name (default: feat/<workspace-name>)
  --status <status>            Workspace status (default: active)
  --stale [0|1]                Mark workspace stale (default: 1)
  --default [0|1]              Mark workspace as default (default: 0)
  --help                       Show this help message
`);
};

const getArg = (key, fallback = undefined) => {
  const index = args.indexOf(key);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
};

const hasFlag = (key) => args.includes(key);

const toBoolean = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

if (hasFlag('--help') || hasFlag('-h')) {
  usage();
  process.exit(0);
}

const dbPath = getArg('--db-path', defaultDbPath);
const projectName = getArg('--project-name', 'dev-seed-project');
const projectDisplayName = getArg('--project-display-name', projectName);
const projectDirectoryPath = getArg('--project-path', path.resolve(process.cwd(), 'dummy-path'));
const workspaceName = getArg('--workspace-name', 'dev-stale-workspace');
const worktreePath = getArg(
  '--worktree-path',
  path.resolve(process.cwd(), '.worktrees', workspaceName)
);
const workspaceBranch = getArg('--branch', `feat/${workspaceName}`);
const workspaceStatus = getArg('--status', 'active');
const workspaceStale = toBoolean(getArg('--stale', '1'));
const workspaceDefault = toBoolean(getArg('--default', '0'));

console.log(`Using database: ${dbPath}`);
console.log(`Seeding project: ${projectName}`);
console.log(`Seeding workspace: ${workspaceName}`);

const db = new Database(dbPath);

const normalizeBool = (value) => (value ? 1 : 0);

const insertOrUpdateProject = (name, displayName, directoryPath) => {
  const projectRow = db.prepare('SELECT id FROM projects WHERE name = ?').get(name);
  if (projectRow) {
    db.prepare(
      'UPDATE projects SET display_name = ?, directory_path = ?, multi_workspace_enabled = ? WHERE id = ?'
    ).run(displayName, directoryPath, 1, projectRow.id);
    console.log(`Updated project id=${projectRow.id}`);
    return projectRow.id;
  }

  const result = db
    .prepare(
      'INSERT INTO projects (name, display_name, directory_path, multi_workspace_enabled) VALUES (?, ?, ?, ?)'
    )
    .run(name, displayName, directoryPath, 1);
  console.log(`Inserted project id=${result.lastInsertRowid}`);
  return result.lastInsertRowid;
};

const insertOrUpdateWorkspace = (
  projectId,
  name,
  worktreePathValue,
  branch,
  status,
  isStale,
  isDefault
) => {
  const workspaceRow = db
    .prepare('SELECT id FROM workspaces WHERE project_id = ? AND name = ?')
    .get(projectId, name);

  const staleDetectedAt = isStale ? new Date().toISOString() : null;

  if (workspaceRow) {
    db.prepare(
      'UPDATE workspaces SET worktree_path = ?, worktree_branch = ?, status = ?, is_stale = ?, stale_detected_at = ?, is_default = ? WHERE id = ?'
    ).run(
      worktreePathValue,
      branch,
      status,
      normalizeBool(isStale),
      staleDetectedAt,
      normalizeBool(isDefault),
      workspaceRow.id
    );
    console.log(`Updated workspace id=${workspaceRow.id}`);
    return workspaceRow.id;
  }

  const result = db
    .prepare(
      'INSERT INTO workspaces (project_id, name, worktree_path, worktree_branch, status, is_stale, stale_detected_at, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      projectId,
      name,
      worktreePathValue,
      branch,
      status,
      normalizeBool(isStale),
      staleDetectedAt,
      normalizeBool(isDefault)
    );
  console.log(`Inserted workspace id=${result.lastInsertRowid}`);
  return result.lastInsertRowid;
};

try {
  db.exec('BEGIN');

  const projectId = insertOrUpdateProject(projectName, projectDisplayName, projectDirectoryPath);
  insertOrUpdateWorkspace(
    projectId,
    workspaceName,
    worktreePath,
    workspaceBranch,
    workspaceStatus,
    workspaceStale,
    workspaceDefault
  );

  db.exec('COMMIT');
  console.log('Dev workspace seed completed successfully.');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('Failed to seed workspace data:', error);
  process.exit(1);
} finally {
  db.close();
}
