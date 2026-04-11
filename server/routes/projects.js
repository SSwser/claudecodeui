import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';
import { addProjectManually } from '../projects.js';

const router = express.Router();
const CLONE_PROGRESS_SESSION_TTL_MS = 10 * 60 * 1000;
const cloneProgressSessions = new Map();
const VALID_WORKSPACE_TYPES = new Set(['existing', 'new', 'logical', 'worktree']);
const VALID_BRANCH_PATTERN = /^(?!.*\.\.)(?!.*\/$)(?!-)(?!.*\s)[A-Za-z0-9._/-]+$/;

function sanitizeGitError(message, token) {
  if (!message || !token) return message;
  return message.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '***');
}

function createCloneProgressSession({ userId, workspacePath, githubUrl, githubTokenId, newGithubToken }) {
  const sessionId = `clone-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

  cloneProgressSessions.set(sessionId, {
    userId,
    workspacePath,
    githubUrl,
    githubTokenId,
    newGithubToken,
    expiresAt: Date.now() + CLONE_PROGRESS_SESSION_TTL_MS,
  });

  return sessionId;
}

function consumeCloneProgressSession(sessionId, userId) {
  const session = cloneProgressSessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now() || session.userId !== userId) {
    cloneProgressSessions.delete(sessionId);
    return null;
  }

  cloneProgressSessions.delete(sessionId);
  return session;
}

function sanitizeProgressMessage(message, githubToken) {
  return sanitizeGitError(String(message || '').trim(), githubToken);
}

// Configure allowed workspace root (defaults to user's home directory)
export const WORKSPACES_ROOT = process.env.WORKSPACES_ROOT || os.homedir();

// System-critical paths that should never be used as workspace directories
export const FORBIDDEN_PATHS = [
  // Unix
  '/',
  '/etc',
  '/bin',
  '/sbin',
  '/usr',
  '/dev',
  '/proc',
  '/sys',
  '/var',
  '/boot',
  '/root',
  '/lib',
  '/lib64',
  '/opt',
  '/tmp',
  '/run',
  // Windows
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  'C:\\System Volume Information',
  'C:\\$Recycle.Bin'
];

/**
 * Validates that a path is safe for workspace operations
 * @param {string} requestedPath - The path to validate
 * @returns {Promise<{valid: boolean, resolvedPath?: string, error?: string}>}
 */
export async function validateWorkspacePath(requestedPath) {
  try {
    // Resolve to absolute path
    let absolutePath = path.resolve(requestedPath);

    // Check if path is a forbidden system directory
    const normalizedPath = path.normalize(absolutePath);
    if (FORBIDDEN_PATHS.includes(normalizedPath) || normalizedPath === '/') {
      return {
        valid: false,
        error: 'Cannot use system-critical directories as workspace locations'
      };
    }

    // Additional check for paths starting with forbidden directories
    for (const forbidden of FORBIDDEN_PATHS) {
      if (normalizedPath === forbidden ||
          normalizedPath.startsWith(forbidden + path.sep)) {
        // Exception: /var/tmp and similar user-accessible paths might be allowed
        // but /var itself and most /var subdirectories should be blocked
        if (forbidden === '/var' &&
            (normalizedPath.startsWith('/var/tmp') ||
             normalizedPath.startsWith('/var/folders'))) {
          continue; // Allow these specific cases
        }

        return {
          valid: false,
          error: `Cannot create workspace in system directory: ${forbidden}`
        };
      }
    }

    // Try to resolve the real path (following symlinks)
    let realPath;
    try {
      // Check if path exists to resolve real path
      await fs.access(absolutePath);
      realPath = await fs.realpath(absolutePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Path doesn't exist yet - check parent directory
        let parentPath = path.dirname(absolutePath);
        try {
          const parentRealPath = await fs.realpath(parentPath);

          // Reconstruct the full path with real parent
          realPath = path.join(parentRealPath, path.basename(absolutePath));
        } catch (parentError) {
          if (parentError.code === 'ENOENT') {
            // Parent doesn't exist either - use the absolute path as-is
            // We'll validate it's within allowed root
            realPath = absolutePath;
          } else {
            throw parentError;
          }
        }
      } else {
        throw error;
      }
    }

    // Resolve the workspace root to its real path
    const resolvedWorkspaceRoot = await fs.realpath(WORKSPACES_ROOT);

    // Ensure the resolved path is contained within the allowed workspace root
    if (!realPath.startsWith(resolvedWorkspaceRoot + path.sep) &&
        realPath !== resolvedWorkspaceRoot) {
      return {
        valid: false,
        error: `Workspace path must be within the allowed workspace root: ${WORKSPACES_ROOT}`
      };
    }

    // Additional symlink check for existing paths
    try {
      await fs.access(absolutePath);
      const stats = await fs.lstat(absolutePath);

      if (stats.isSymbolicLink()) {
        // Verify symlink target is also within allowed root
        const linkTarget = await fs.readlink(absolutePath);
        const resolvedTarget = path.resolve(path.dirname(absolutePath), linkTarget);
        const realTarget = await fs.realpath(resolvedTarget);

        if (!realTarget.startsWith(resolvedWorkspaceRoot + path.sep) &&
            realTarget !== resolvedWorkspaceRoot) {
          return {
            valid: false,
            error: 'Symlink target is outside the allowed workspace root'
          };
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Path doesn't exist - that's fine for new workspace creation
    }

    return {
      valid: true,
      resolvedPath: realPath
    };

  } catch (error) {
    return {
      valid: false,
      error: `Path validation failed: ${error.message}`
    };
  }
}

function validateBranchName(branchName) {
  if (!branchName || !VALID_BRANCH_PATTERN.test(branchName)) {
    return {
      valid: false,
      error: 'Invalid branch name. Use letters, numbers, ., _, /, and - only.',
    };
  }

  return { valid: true };
}

function normalizeWorkspacePayload(body = {}) {
  const legacyWorkspaceType = typeof body.workspaceType === 'string' ? body.workspaceType : 'logical';
  const normalizedWorkspaceType = legacyWorkspaceType === 'worktree' ? 'worktree' : 'logical';

  return {
    requestedWorkspaceType: legacyWorkspaceType,
    workspaceType: normalizedWorkspaceType,
    path: body.path,
    githubUrl: body.githubUrl,
    githubTokenId: body.githubTokenId,
    newGithubToken: body.newGithubToken,
    sourcePath: typeof body.sourcePath === 'string' ? body.sourcePath.trim() : '',
    branchName: typeof body.branchName === 'string' ? body.branchName.trim() : '',
    baseBranch: typeof body.baseBranch === 'string' && body.baseBranch.trim() ? body.baseBranch.trim() : 'main',
  };
}

function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(stderr || stdout || `Command failed: ${command}`);
      error.code = code;
      reject(error);
    });
  });
}

async function ensureGitRepository(projectPath) {
  await spawnAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: projectPath });
}

async function createWorktreeWorkspace({ sourcePath, targetPath, branchName, baseBranch }) {
  const branchValidation = validateBranchName(branchName);
  if (!branchValidation.valid) {
    throw new Error(branchValidation.error);
  }

  const baseValidation = validateBranchName(baseBranch);
  if (!baseValidation.valid) {
    throw new Error('Invalid base branch name');
  }

  await ensureGitRepository(sourcePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  await spawnAsync(
    'git',
    ['worktree', 'add', '-b', branchName, targetPath, baseBranch],
    { cwd: sourcePath },
  );
}

/**
 * Create a new workspace
 * POST /api/projects/create-workspace
 *
 * Body:
 * - workspaceType: 'logical' | 'worktree' (legacy 'existing' | 'new' still accepted)
 * - path: string (workspace path)
 * - githubUrl?: string (optional, for new workspaces)
 * - githubTokenId?: number (optional, ID of stored token)
 * - newGithubToken?: string (optional, one-time token)
 * - sourcePath?: string (required for worktree mode when creating a new worktree)
 * - branchName?: string (required for worktree mode)
 * - baseBranch?: string (optional, defaults to main)
 */
router.post('/create-workspace', async (req, res) => {
  try {
    const {
      requestedWorkspaceType,
      workspaceType,
      path: workspacePath,
      githubUrl,
      githubTokenId,
      newGithubToken,
      sourcePath,
      branchName,
      baseBranch,
    } = normalizeWorkspacePayload(req.body);

    // Validate required fields
    if (!workspaceType || !workspacePath) {
      return res.status(400).json({ error: 'workspaceType and path are required' });
    }

    if (!VALID_WORKSPACE_TYPES.has(requestedWorkspaceType)) {
      return res.status(400).json({ error: 'workspaceType must be logical or worktree' });
    }

    // Validate path safety before any operations
    const validation = await validateWorkspacePath(workspacePath);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid workspace path',
        details: validation.error
      });
    }

    const absolutePath = validation.resolvedPath;

    // Logical workspaces stay path-based and support the legacy existing/new payloads.
    if (workspaceType === 'logical') {
      try {
        await fs.access(absolutePath);
        const stats = await fs.stat(absolutePath);

        if (!stats.isDirectory()) {
          return res.status(400).json({ error: 'Path exists but is not a directory' });
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // If GitHub URL is provided, clone the repository into the requested folder.
      if (githubUrl) {
        await fs.mkdir(absolutePath, { recursive: true });
        let githubToken = null;

        // Get GitHub token if needed
        if (githubTokenId) {
          // Fetch token from database
          const token = await getGithubTokenById(githubTokenId, req.user.id);
          if (!token) {
            // Clean up created directory
            await fs.rm(absolutePath, { recursive: true, force: true });
            return res.status(404).json({ error: 'GitHub token not found' });
          }
          githubToken = token.github_token;
        } else if (newGithubToken) {
          githubToken = newGithubToken;
        }

        // Extract repo name from URL for the clone destination
        const normalizedUrl = githubUrl.replace(/\/+$/, '').replace(/\.git$/, '');
        const repoName = normalizedUrl.split('/').pop() || 'repository';
        const clonePath = path.join(absolutePath, repoName);

        // Check if clone destination already exists to prevent data loss
        try {
          await fs.access(clonePath);
          return res.status(409).json({
            error: 'Directory already exists',
            details: `The destination path "${clonePath}" already exists. Please choose a different location or remove the existing directory.`
          });
        } catch (err) {
          // Directory doesn't exist, which is what we want
        }

        // Clone the repository into a subfolder
        try {
          await cloneGitHubRepository(githubUrl, clonePath, githubToken);
        } catch (error) {
          // Only clean up if clone created partial data (check if dir exists and is empty or partial)
          try {
            const stats = await fs.stat(clonePath);
            if (stats.isDirectory()) {
              await fs.rm(clonePath, { recursive: true, force: true });
            }
          } catch (cleanupError) {
            // Directory doesn't exist or cleanup failed - ignore
          }
          throw new Error(`Failed to clone repository: ${error.message}`);
        }

        // Add the cloned repo path to the project list
        const project = await addProjectManually(clonePath);

        return res.json({
          success: true,
          project,
          workspaceMode: 'logical',
          message: 'Logical workspace created and repository cloned successfully'
        });
      }

      // Existing path: attach. Missing path: create and attach.
      await fs.mkdir(absolutePath, { recursive: true });
      const project = await addProjectManually(absolutePath);

      return res.json({
        success: true,
        project,
        workspaceMode: 'logical',
        message: 'Logical workspace is ready'
      });
    }

    if (workspaceType === 'worktree') {
      if (!sourcePath) {
        return res.status(400).json({
          error: 'sourcePath is required for worktree mode',
        });
      }

      if (!branchName) {
        return res.status(400).json({
          error: 'branchName is required for worktree mode',
        });
      }

      const branchValidation = validateBranchName(branchName);
      if (!branchValidation.valid) {
        return res.status(400).json({
          error: branchValidation.error,
        });
      }

      const targetExists = await fs.access(absolutePath).then(() => true).catch(() => false);

      const sourceValidation = await validateWorkspacePath(sourcePath);
      if (!sourceValidation.valid) {
        return res.status(400).json({
          error: 'Invalid sourcePath for worktree mode',
          details: sourceValidation.error,
        });
      }

      if (targetExists) {
        await ensureGitRepository(absolutePath);
        const project = await addProjectManually(absolutePath);

        return res.json({
          success: true,
          project,
          workspaceMode: 'worktree',
          metadata: {
            sourcePath: sourceValidation.resolvedPath,
            branchName,
            baseBranch,
            associationOnly: true,
          },
          message: 'Existing worktree associated successfully',
        });
      }

      await createWorktreeWorkspace({
        sourcePath: sourceValidation.resolvedPath,
        targetPath: absolutePath,
        branchName,
        baseBranch,
      });

      const project = await addProjectManually(absolutePath);

      return res.json({
        success: true,
        project,
        workspaceMode: 'worktree',
        metadata: {
          sourcePath: sourceValidation.resolvedPath,
          branchName,
          baseBranch,
        },
        message: 'Worktree workspace created successfully',
      });
    }

  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      error: error.message || 'Failed to create workspace',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Helper function to get GitHub token from database
 */
async function getGithubTokenById(tokenId, userId) {
  const { db } = await import('../database/db.js');

  const credential = db.prepare(
    'SELECT * FROM user_credentials WHERE id = ? AND user_id = ? AND credential_type = ? AND is_active = 1'
  ).get(tokenId, userId, 'github_token');

  // Return in the expected format (github_token field for compatibility)
  if (credential) {
    return {
      ...credential,
      github_token: credential.credential_value
    };
  }

  return null;
}

/**
 * Start a clone progress session without sending one-time git credentials in the URL.
 * POST /api/projects/clone-progress/start
 */
router.post('/clone-progress/start', async (req, res) => {
  const { path: workspacePath, githubUrl, githubTokenId, newGithubToken } = req.body || {};

  if (!workspacePath || !githubUrl) {
    return res.status(400).json({ error: 'workspacePath and githubUrl are required' });
  }

  const sessionId = createCloneProgressSession({
    userId: req.user.id,
    workspacePath,
    githubUrl,
    githubTokenId,
    newGithubToken,
  });

  return res.json({ sessionId });
});

/**
 * Clone repository with progress streaming (SSE)
 * GET /api/projects/clone-progress
 */
router.get('/clone-progress', async (req, res) => {
  const { sessionId } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    if (!sessionId || typeof sessionId !== 'string') {
      sendEvent('error', { message: 'clone session is required' });
      res.end();
      return;
    }

    const cloneSession = consumeCloneProgressSession(sessionId, req.user.id);
    if (!cloneSession) {
      sendEvent('error', { message: 'clone session expired or is invalid' });
      res.end();
      return;
    }

    const { workspacePath, githubUrl, githubTokenId, newGithubToken } = cloneSession;

    const validation = await validateWorkspacePath(workspacePath);
    if (!validation.valid) {
      sendEvent('error', { message: validation.error });
      res.end();
      return;
    }

    const absolutePath = validation.resolvedPath;

    await fs.mkdir(absolutePath, { recursive: true });

    let githubToken = null;
    if (githubTokenId) {
      const token = await getGithubTokenById(parseInt(githubTokenId), req.user.id);
      if (!token) {
        await fs.rm(absolutePath, { recursive: true, force: true });
        sendEvent('error', { message: 'GitHub token not found' });
        res.end();
        return;
      }
      githubToken = token.github_token;
    } else if (newGithubToken) {
      githubToken = newGithubToken;
    }

    const normalizedUrl = githubUrl.replace(/\/+$/, '').replace(/\.git$/, '');
    const repoName = normalizedUrl.split('/').pop() || 'repository';
    const clonePath = path.join(absolutePath, repoName);

    // Check if clone destination already exists to prevent data loss
    try {
      await fs.access(clonePath);
      sendEvent('error', { message: `Directory "${repoName}" already exists. Please choose a different location or remove the existing directory.` });
      res.end();
      return;
    } catch (err) {
      // Directory doesn't exist, which is what we want
    }

    let cloneUrl = githubUrl;
    if (githubToken) {
      try {
        const url = new URL(githubUrl);
        url.username = githubToken;
        url.password = '';
        cloneUrl = url.toString();
      } catch (error) {
        // SSH URL or invalid - use as-is
      }
    }

    sendEvent('progress', { message: `Cloning into '${repoName}'...` });

    const gitProcess = spawn('git', ['clone', '--progress', cloneUrl, clonePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0'
      }
    });

    let lastError = '';

    gitProcess.stdout.on('data', (data) => {
      const message = sanitizeProgressMessage(data, githubToken);
      if (message) {
        sendEvent('progress', { message });
      }
    });

    gitProcess.stderr.on('data', (data) => {
      const message = sanitizeProgressMessage(data, githubToken);
      lastError = message;
      if (message) {
        sendEvent('progress', { message });
      }
    });

    gitProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          const project = await addProjectManually(clonePath);
          sendEvent('complete', { project, message: 'Repository cloned successfully' });
        } catch (error) {
          sendEvent('error', { message: `Clone succeeded but failed to add project: ${error.message}` });
        }
      } else {
        const sanitizedError = sanitizeGitError(lastError, githubToken);
        let errorMessage = 'Git clone failed';
        if (lastError.includes('Authentication failed') || lastError.includes('could not read Username')) {
          errorMessage = 'Authentication failed. Please check your credentials.';
        } else if (lastError.includes('Repository not found')) {
          errorMessage = 'Repository not found. Please check the URL and ensure you have access.';
        } else if (lastError.includes('already exists')) {
          errorMessage = 'Directory already exists';
        } else if (sanitizedError) {
          errorMessage = sanitizedError;
        }
        try {
          await fs.rm(clonePath, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error('Failed to clean up after clone failure:', sanitizeGitError(cleanupError.message, githubToken));
        }
        sendEvent('error', { message: errorMessage });
      }
      res.end();
    });

    gitProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        sendEvent('error', { message: 'Git is not installed or not in PATH' });
      } else {
        sendEvent('error', { message: sanitizeGitError(error.message, githubToken) });
      }
      res.end();
    });

    req.on('close', () => {
      gitProcess.kill();
    });

  } catch (error) {
    sendEvent('error', { message: sanitizeGitError(error.message, null) });
    res.end();
  }
});

/**
 * Helper function to clone a GitHub repository
 */
function cloneGitHubRepository(githubUrl, destinationPath, githubToken = null) {
  return new Promise((resolve, reject) => {
    let cloneUrl = githubUrl;

    if (githubToken) {
      try {
        const url = new URL(githubUrl);
        url.username = githubToken;
        url.password = '';
        cloneUrl = url.toString();
      } catch (error) {
        // SSH URL - use as-is
      }
    }

    const gitProcess = spawn('git', ['clone', '--progress', cloneUrl, destinationPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0'
      }
    });

    let stdout = '';
    let stderr = '';

    gitProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        let errorMessage = 'Git clone failed';
        const sanitizedStderr = sanitizeGitError(stderr, githubToken);

        if (sanitizedStderr.includes('Authentication failed') || sanitizedStderr.includes('could not read Username')) {
          errorMessage = 'Authentication failed. Please check your GitHub token.';
        } else if (sanitizedStderr.includes('Repository not found')) {
          errorMessage = 'Repository not found. Please check the URL and ensure you have access.';
        } else if (sanitizedStderr.includes('already exists')) {
          errorMessage = 'Directory already exists';
        } else if (sanitizedStderr) {
          errorMessage = sanitizedStderr;
        }

        reject(new Error(errorMessage));
      }
    });

    gitProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error('Git is not installed or not in PATH'));
      } else {
        reject(error);
      }
    });
  });
}

export default router;
