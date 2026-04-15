import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const children = new Set();
let shuttingDown = false;
let resolved = false;

const terminateChild = (child) => {
  if (!child || child.killed) {
    return;
  }

  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
};

const shutdown = (code = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    terminateChild(child);
  }

  if (!resolved) {
    resolved = true;
    process.exitCode = code;
  }
};

const runScript = (name, color) => {
  const child = isWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', `npm run ${name}`], {
        stdio: 'inherit',
        shell: false,
        cwd: repoRoot,
        env: {
          ...process.env,
          FORCE_COLOR: process.env.FORCE_COLOR ?? color,
        },
      })
    : spawn('npm', ['run', name], {
        stdio: 'inherit',
        shell: false,
        cwd: repoRoot,
        env: {
          ...process.env,
          FORCE_COLOR: process.env.FORCE_COLOR ?? color,
        },
      });

  children.add(child);

  child.on('exit', (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      if (!children.size && !resolved) {
        resolved = true;
        process.exit(code ?? (signal ? 1 : 0));
      }
      return;
    }

    shutdown(code ?? (signal ? 1 : 0));
  });

  child.on('error', () => {
    shutdown(1);
  });

  return child;
};

runScript('dev:server', '1');
runScript('dev:client', '1');

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
