import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Plus, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../../../../../../shared/view/ui';
import type { CodexPermissionMode, GeminiPermissionMode } from '../../../../../types/types';
import SettingsToggle from '../../../../SettingsToggle';

const COMMON_CLAUDE_TOOLS = [
  'Bash(git log:*)',
  'Bash(git diff:*)',
  'Bash(git status:*)',
  'Write',
  'Read',
  'Edit',
  'Glob',
  'Grep',
  'MultiEdit',
  'Task',
  'TodoWrite',
  'TodoRead',
  'WebFetch',
  'WebSearch',
];

const COMMON_CURSOR_COMMANDS = [
  'Shell(ls)',
  'Shell(mkdir)',
  'Shell(cd)',
  'Shell(cat)',
  'Shell(echo)',
  'Shell(git status)',
  'Shell(git diff)',
  'Shell(git log)',
  'Shell(npm install)',
  'Shell(npm run)',
  'Shell(python)',
  'Shell(node)',
];

const addUnique = (items: string[], value: string): string[] => {
  const normalizedValue = value.trim();
  if (!normalizedValue || items.includes(normalizedValue)) {
    return items;
  }

  return [...items, normalizedValue];
};

const removeValue = (items: string[], value: string): string[] =>
  items.filter((item) => item !== value);

type PermissionToggleCardProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
};

function PermissionToggleCard({
  title,
  description,
  checked,
  onChange,
  ariaLabel,
}: PermissionToggleCardProps) {
  return (
    <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <SettingsToggle checked={checked} onChange={onChange} ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}

type PermissionModeCardProps = {
  name: string;
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description: string;
  accentClassName: string;
};

function PermissionModeCard({
  name,
  selected,
  onSelect,
  title,
  description,
  accentClassName,
}: PermissionModeCardProps) {
  return (
    <button
      type="button"
      role="radio"
      name={name}
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        selected ? accentClassName : 'border-border bg-card/50 hover:bg-accent/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected ? 'border-primary bg-primary/10' : 'border-border bg-background'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full transition-opacity ${
              selected ? 'bg-primary opacity-100' : 'opacity-0'
            }`}
          />
        </span>
        <div>
          <div className="font-medium text-foreground">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
    </button>
  );
}

type ClaudePermissionsProps = {
  agent: 'claude';
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedTools: string[];
  onAllowedToolsChange: (value: string[]) => void;
  disallowedTools: string[];
  onDisallowedToolsChange: (value: string[]) => void;
};

function ClaudePermissions({
  skipPermissions,
  onSkipPermissionsChange,
  allowedTools,
  onAllowedToolsChange,
  disallowedTools,
  onDisallowedToolsChange,
}: Omit<ClaudePermissionsProps, 'agent'>) {
  const { t } = useTranslation('settings');
  const [newAllowedTool, setNewAllowedTool] = useState('');
  const [newDisallowedTool, setNewDisallowedTool] = useState('');

  const handleAddAllowedTool = (tool: string) => {
    const updated = addUnique(allowedTools, tool);
    if (updated.length === allowedTools.length) {
      return;
    }

    onAllowedToolsChange(updated);
    setNewAllowedTool('');
  };

  const handleAddDisallowedTool = (tool: string) => {
    const updated = addUnique(disallowedTools, tool);
    if (updated.length === disallowedTools.length) {
      return;
    }

    onDisallowedToolsChange(updated);
    setNewDisallowedTool('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground">{t('permissions.title')}</h3>
        </div>
        <PermissionToggleCard
          checked={skipPermissions}
          onChange={onSkipPermissionsChange}
          ariaLabel={t('permissions.skipPermissions.label')}
          title={t('permissions.skipPermissions.label')}
          description={t('permissions.skipPermissions.claudeDescription')}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">
            {t('permissions.allowedTools.title')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('permissions.allowedTools.description')}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newAllowedTool}
            onChange={(event) => setNewAllowedTool(event.target.value)}
            placeholder={t('permissions.allowedTools.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddAllowedTool(newAllowedTool);
              }
            }}
            className="h-10 flex-1"
          />
          <Button
            onClick={() => handleAddAllowedTool(newAllowedTool)}
            disabled={!newAllowedTool.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">{t('permissions.actions.add')}</span>
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t('permissions.allowedTools.quickAdd')}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CLAUDE_TOOLS.map((tool) => (
              <Button
                key={tool}
                variant="outline"
                size="sm"
                onClick={() => handleAddAllowedTool(tool)}
                disabled={allowedTools.includes(tool)}
                className="h-8 text-xs"
              >
                {tool}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {allowedTools.map((tool) => (
            <div
              key={tool}
              className="flex items-center justify-between rounded-xl border border-success/25 bg-success/10 p-3"
            >
              <span className="font-mono text-sm text-foreground">{tool}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAllowedToolsChange(removeValue(allowedTools, tool))}
                className="text-success hover:bg-success/10 hover:text-success"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {allowedTools.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              {t('permissions.allowedTools.empty')}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-foreground">
            {t('permissions.blockedTools.title')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('permissions.blockedTools.description')}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newDisallowedTool}
            onChange={(event) => setNewDisallowedTool(event.target.value)}
            placeholder={t('permissions.blockedTools.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddDisallowedTool(newDisallowedTool);
              }
            }}
            className="h-10 flex-1"
          />
          <Button
            onClick={() => handleAddDisallowedTool(newDisallowedTool)}
            disabled={!newDisallowedTool.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">{t('permissions.actions.add')}</span>
          </Button>
        </div>

        <div className="space-y-2">
          {disallowedTools.map((tool) => (
            <div
              key={tool}
              className="flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/10 p-3"
            >
              <span className="font-mono text-sm text-foreground">{tool}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisallowedToolsChange(removeValue(disallowedTools, tool))}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {disallowedTools.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              {t('permissions.blockedTools.empty')}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand/10 p-4">
        <h4 className="mb-2 font-medium text-foreground">{t('permissions.toolExamples.title')}</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Bash(git log:*)"
            </code>{' '}
            {t('permissions.toolExamples.bashGitLog')}
          </li>
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Bash(git diff:*)"
            </code>{' '}
            {t('permissions.toolExamples.bashGitDiff')}
          </li>
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Write"
            </code>{' '}
            {t('permissions.toolExamples.write')}
          </li>
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Bash(rm:*)"
            </code>{' '}
            {t('permissions.toolExamples.bashRm')}
          </li>
        </ul>
      </div>
    </div>
  );
}

type CursorPermissionsProps = {
  agent: 'cursor';
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedCommands: string[];
  onAllowedCommandsChange: (value: string[]) => void;
  disallowedCommands: string[];
  onDisallowedCommandsChange: (value: string[]) => void;
};

function CursorPermissions({
  skipPermissions,
  onSkipPermissionsChange,
  allowedCommands,
  onAllowedCommandsChange,
  disallowedCommands,
  onDisallowedCommandsChange,
}: Omit<CursorPermissionsProps, 'agent'>) {
  const { t } = useTranslation('settings');
  const [newAllowedCommand, setNewAllowedCommand] = useState('');
  const [newDisallowedCommand, setNewDisallowedCommand] = useState('');

  const handleAddAllowedCommand = (command: string) => {
    const updated = addUnique(allowedCommands, command);
    if (updated.length === allowedCommands.length) {
      return;
    }

    onAllowedCommandsChange(updated);
    setNewAllowedCommand('');
  };

  const handleAddDisallowedCommand = (command: string) => {
    const updated = addUnique(disallowedCommands, command);
    if (updated.length === disallowedCommands.length) {
      return;
    }

    onDisallowedCommandsChange(updated);
    setNewDisallowedCommand('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground">{t('permissions.title')}</h3>
        </div>
        <PermissionToggleCard
          checked={skipPermissions}
          onChange={onSkipPermissionsChange}
          ariaLabel={t('permissions.skipPermissions.label')}
          title={t('permissions.skipPermissions.label')}
          description={t('permissions.skipPermissions.cursorDescription')}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">
            {t('permissions.allowedCommands.title')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('permissions.allowedCommands.description')}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newAllowedCommand}
            onChange={(event) => setNewAllowedCommand(event.target.value)}
            placeholder={t('permissions.allowedCommands.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddAllowedCommand(newAllowedCommand);
              }
            }}
            className="h-10 flex-1"
          />
          <Button
            onClick={() => handleAddAllowedCommand(newAllowedCommand)}
            disabled={!newAllowedCommand.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">{t('permissions.actions.add')}</span>
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t('permissions.allowedCommands.quickAdd')}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CURSOR_COMMANDS.map((command) => (
              <Button
                key={command}
                variant="outline"
                size="sm"
                onClick={() => handleAddAllowedCommand(command)}
                disabled={allowedCommands.includes(command)}
                className="h-8 text-xs"
              >
                {command}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {allowedCommands.map((command) => (
            <div
              key={command}
              className="flex items-center justify-between rounded-xl border border-success/25 bg-success/10 p-3"
            >
              <span className="font-mono text-sm text-foreground">{command}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAllowedCommandsChange(removeValue(allowedCommands, command))}
                className="text-success hover:bg-success/10 hover:text-success"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {allowedCommands.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              {t('permissions.allowedCommands.empty')}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-foreground">
            {t('permissions.blockedCommands.title')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('permissions.blockedCommands.description')}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newDisallowedCommand}
            onChange={(event) => setNewDisallowedCommand(event.target.value)}
            placeholder={t('permissions.blockedCommands.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddDisallowedCommand(newDisallowedCommand);
              }
            }}
            className="h-10 flex-1"
          />
          <Button
            onClick={() => handleAddDisallowedCommand(newDisallowedCommand)}
            disabled={!newDisallowedCommand.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">{t('permissions.actions.add')}</span>
          </Button>
        </div>

        <div className="space-y-2">
          {disallowedCommands.map((command) => (
            <div
              key={command}
              className="flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/10 p-3"
            >
              <span className="font-mono text-sm text-foreground">{command}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisallowedCommandsChange(removeValue(disallowedCommands, command))}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {disallowedCommands.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              {t('permissions.blockedCommands.empty')}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-brand/20 bg-brand/10 p-4">
        <h4 className="mb-2 font-medium text-foreground">{t('permissions.shellExamples.title')}</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Shell(ls)"
            </code>{' '}
            {t('permissions.shellExamples.ls')}
          </li>
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Shell(git status)"
            </code>{' '}
            {t('permissions.shellExamples.gitStatus')}
          </li>
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Shell(npm install)"
            </code>{' '}
            {t('permissions.shellExamples.npmInstall')}
          </li>
          <li>
            <code className="font-code rounded bg-background/80 px-1 py-0.5 text-foreground">
              "Shell(rm -rf)"
            </code>{' '}
            {t('permissions.shellExamples.rmRf')}
          </li>
        </ul>
      </div>
    </div>
  );
}

type CodexPermissionsProps = {
  agent: 'codex';
  permissionMode: CodexPermissionMode;
  onPermissionModeChange: (value: CodexPermissionMode) => void;
};

function CodexPermissions({
  permissionMode,
  onPermissionModeChange,
}: Omit<CodexPermissionsProps, 'agent'>) {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">
            {t('permissions.codex.permissionMode')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('permissions.codex.description')}</p>

        <div
          role="radiogroup"
          aria-label={t('permissions.codex.permissionMode')}
          className="space-y-4"
        >
          <PermissionModeCard
            name="codexPermissionMode"
            selected={permissionMode === 'default'}
            onSelect={() => onPermissionModeChange('default')}
            title={t('permissions.codex.modes.default.title')}
            description={t('permissions.codex.modes.default.description')}
            accentClassName="border-border bg-accent"
          />

          <PermissionModeCard
            name="codexPermissionMode"
            selected={permissionMode === 'acceptEdits'}
            onSelect={() => onPermissionModeChange('acceptEdits')}
            title={t('permissions.codex.modes.acceptEdits.title')}
            description={t('permissions.codex.modes.acceptEdits.description')}
            accentClassName="border-success/25 bg-success/10"
          />

          <PermissionModeCard
            name="codexPermissionMode"
            selected={permissionMode === 'bypassPermissions'}
            onSelect={() => onPermissionModeChange('bypassPermissions')}
            title={
              <span className="flex items-center gap-2">
                {t('permissions.codex.modes.bypassPermissions.title')}
                <AlertTriangle className="h-4 w-4" />
              </span>
            }
            description={t('permissions.codex.modes.bypassPermissions.description')}
            accentClassName="border-warning/25 bg-warning/10"
          />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {t('permissions.codex.technicalDetails')}
          </summary>
          <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>{t('permissions.codex.modes.default.title')}:</strong>{' '}
              {t('permissions.codex.technicalInfo.default')}
            </p>
            <p>
              <strong>{t('permissions.codex.modes.acceptEdits.title')}:</strong>{' '}
              {t('permissions.codex.technicalInfo.acceptEdits')}
            </p>
            <p>
              <strong>{t('permissions.codex.modes.bypassPermissions.title')}:</strong>{' '}
              {t('permissions.codex.technicalInfo.bypassPermissions')}
            </p>
            <p className="text-xs opacity-75">
              {t('permissions.codex.technicalInfo.overrideNote')}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

type GeminiPermissionsProps = {
  agent: 'gemini';
  permissionMode: GeminiPermissionMode;
  onPermissionModeChange: (value: GeminiPermissionMode) => void;
};

// Gemini Permissions
function GeminiPermissions({
  permissionMode,
  onPermissionModeChange,
}: Omit<GeminiPermissionsProps, 'agent'>) {
  const { t } = useTranslation(['settings', 'chat']);
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">{t('gemini.permissionMode')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('gemini.description')}</p>

        {/* Default Mode */}
        <div role="radiogroup" aria-label={t('gemini.permissionMode')} className="space-y-4">
          <PermissionModeCard
            name="geminiPermissionMode"
            selected={permissionMode === 'default'}
            onSelect={() => onPermissionModeChange('default')}
            title={t('gemini.modes.default.title')}
            description={t('gemini.modes.default.description')}
            accentClassName="border-border bg-accent"
          />

          <PermissionModeCard
            name="geminiPermissionMode"
            selected={permissionMode === 'auto_edit'}
            onSelect={() => onPermissionModeChange('auto_edit')}
            title={t('gemini.modes.autoEdit.title')}
            description={t('gemini.modes.autoEdit.description')}
            accentClassName="border-success/25 bg-success/10"
          />

          <PermissionModeCard
            name="geminiPermissionMode"
            selected={permissionMode === 'yolo'}
            onSelect={() => onPermissionModeChange('yolo')}
            title={
              <span className="flex items-center gap-2">
                {t('gemini.modes.yolo.title')}
                <AlertTriangle className="h-4 w-4" />
              </span>
            }
            description={t('gemini.modes.yolo.description')}
            accentClassName="border-warning/25 bg-warning/10"
          />
        </div>
      </div>
    </div>
  );
}

type PermissionsContentProps =
  | ClaudePermissionsProps
  | CursorPermissionsProps
  | CodexPermissionsProps
  | GeminiPermissionsProps;

export default function PermissionsContent(props: PermissionsContentProps) {
  if (props.agent === 'claude') {
    return <ClaudePermissions {...props} />;
  }

  if (props.agent === 'cursor') {
    return <CursorPermissions {...props} />;
  }

  if (props.agent === 'gemini') {
    return <GeminiPermissions {...props} />;
  }

  return <CodexPermissions {...props} />;
}
