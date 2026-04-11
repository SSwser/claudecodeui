import { FolderOpen, Globe, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Textarea } from '../../../../shared/view/ui';
import { Select } from '../../../ui/select';
import { DEFAULT_CLAUDE_MCP_FORM } from '../../constants/constants';
import type {
  ClaudeMcpFormState,
  McpServer,
  McpScope,
  McpTransportType,
  SettingsProject,
} from '../../types/types';

type ClaudeMcpFormModalProps = {
  isOpen: boolean;
  editingServer: McpServer | null;
  projects: SettingsProject[];
  onClose: () => void;
  onSubmit: (formData: ClaudeMcpFormState, editingServer: McpServer | null) => Promise<void>;
};

const getSafeTransportType = (value: unknown): McpTransportType => {
  if (value === 'sse' || value === 'http') {
    return value;
  }

  return 'stdio';
};

const getSafeScope = (value: unknown): McpScope => (value === 'local' ? 'local' : 'user');

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

const createFormStateFromServer = (server: McpServer): ClaudeMcpFormState => ({
  name: server.name || '',
  type: getSafeTransportType(server.type),
  scope: getSafeScope(server.scope),
  projectPath: server.projectPath || '',
  config: {
    command: server.config?.command || '',
    args: server.config?.args || [],
    env: server.config?.env || {},
    url: server.config?.url || '',
    headers: server.config?.headers || {},
    timeout: server.config?.timeout || 30000,
  },
  importMode: 'form',
  jsonInput: '',
  raw: server.raw,
});

export default function ClaudeMcpFormModal({
  isOpen,
  editingServer,
  projects,
  onClose,
  onSubmit,
}: ClaudeMcpFormModalProps) {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState<ClaudeMcpFormState>(DEFAULT_CLAUDE_MCP_FORM);
  const [jsonValidationError, setJsonValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingServer);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setJsonValidationError('');
    if (editingServer) {
      setFormData(createFormStateFromServer(editingServer));
      return;
    }

    setFormData(DEFAULT_CLAUDE_MCP_FORM);
  }, [editingServer, isOpen]);

  const canSubmit = useMemo(() => {
    if (!formData.name.trim()) {
      return false;
    }

    if (formData.importMode === 'json') {
      return Boolean(formData.jsonInput.trim()) && !jsonValidationError;
    }

    if (formData.scope === 'local' && !formData.projectPath.trim()) {
      return false;
    }

    if (formData.type === 'stdio') {
      return Boolean(formData.config.command.trim());
    }

    return Boolean(formData.config.url.trim());
  }, [formData, jsonValidationError]);

  if (!isOpen) {
    return null;
  }

  const updateConfig = <K extends keyof ClaudeMcpFormState['config']>(
    key: K,
    value: ClaudeMcpFormState['config'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const handleJsonValidation = (value: string) => {
    if (!value.trim()) {
      setJsonValidationError('');
      return;
    }

    try {
      const parsed = JSON.parse(value) as { type?: string; command?: string; url?: string };
      if (!parsed.type) {
        setJsonValidationError(t('mcpForm.validation.missingType'));
      } else if (parsed.type === 'stdio' && !parsed.command) {
        setJsonValidationError(t('mcpForm.validation.stdioRequiresCommand'));
      } else if ((parsed.type === 'http' || parsed.type === 'sse') && !parsed.url) {
        setJsonValidationError(t('mcpForm.validation.httpRequiresUrl', { type: parsed.type }));
      } else {
        setJsonValidationError('');
      }
    } catch {
      setJsonValidationError(t('mcpForm.validation.invalidJson'));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData, editingServer);
    } catch (error) {
      alert(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-border/80 bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/80 p-5">
          <h3 className="text-lg font-medium text-foreground">
            {isEditing ? t('mcpForm.title.edit') : t('mcpForm.title.add')}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {!isEditing && (
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, importMode: 'form' }))}
                className={`rounded-xl border px-4 py-2 font-medium transition-colors ${
                  formData.importMode === 'form'
                    ? 'border-brand/15 bg-brand text-brand-foreground shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {t('mcpForm.importMode.form')}
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, importMode: 'json' }))}
                className={`rounded-xl border px-4 py-2 font-medium transition-colors ${
                  formData.importMode === 'json'
                    ? 'border-brand/15 bg-brand text-brand-foreground shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {t('mcpForm.importMode.json')}
              </button>
            </div>
          )}

          {formData.importMode === 'form' && isEditing && (
            <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t('mcpForm.scope.label')}
              </label>
              <div className="flex items-center gap-2">
                {formData.scope === 'user' ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {formData.scope === 'user'
                    ? t('mcpForm.scope.userGlobal')
                    : t('mcpForm.scope.projectLocal')}
                </span>
                {formData.scope === 'local' && formData.projectPath && (
                  <span className="text-xs text-muted-foreground">- {formData.projectPath}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('mcpForm.scope.cannotChange')}
              </p>
            </div>
          )}

          {formData.importMode === 'form' && !isEditing && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.scope.label')} *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, scope: 'user', projectPath: '' }))
                    }
                    className={`flex-1 rounded-xl border px-4 py-2 font-medium transition-colors ${
                      formData.scope === 'user'
                        ? 'border-brand/15 bg-brand text-brand-foreground shadow-sm'
                        : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{t('mcpForm.scope.userGlobal')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, scope: 'local' }))}
                    className={`flex-1 rounded-xl border px-4 py-2 font-medium transition-colors ${
                      formData.scope === 'local'
                        ? 'border-brand/15 bg-brand text-brand-foreground shadow-sm'
                        : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>{t('mcpForm.scope.projectLocal')}</span>
                    </div>
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formData.scope === 'user'
                    ? t('mcpForm.scope.userDescription')
                    : t('mcpForm.scope.projectDescription')}
                </p>
              </div>

              {formData.scope === 'local' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {t('mcpForm.fields.selectProject')} *
                  </label>
                  <Select
                    value={formData.projectPath}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, projectPath: value }));
                    }}
                    options={[
                      {
                        value: '',
                        label: `${t('mcpForm.fields.selectProject')}...`,
                      },
                      ...projects.map((project) => ({
                        value: project.path || project.fullPath,
                        label: project.displayName || project.name,
                      })),
                    ]}
                  />
                  {formData.projectPath && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('mcpForm.projectPath', { path: formData.projectPath })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={formData.importMode === 'json' ? 'md:col-span-2' : ''}>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t('mcpForm.fields.serverName')} *
              </label>
              <Input
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t('mcpForm.placeholders.serverName')}
                required
              />
            </div>

            {formData.importMode === 'form' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.fields.transportType')} *
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      type: getSafeTransportType(value),
                    }));
                  }}
                  options={[
                    { value: 'stdio', label: 'stdio' },
                    { value: 'sse', label: 'SSE' },
                    { value: 'http', label: 'HTTP' },
                  ]}
                />
              </div>
            )}
          </div>

          {isEditing && Boolean(formData.raw) && formData.importMode === 'form' && (
            <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
              <h4 className="mb-2 text-sm font-medium text-foreground">
                {t('mcpForm.configDetails', {
                  configFile:
                    editingServer?.scope === 'global' ? '~/.claude.json' : 'project config',
                })}
              </h4>
              <pre className="overflow-x-auto rounded-xl border border-border/70 bg-background p-3 text-xs text-foreground shadow-inner">
                {JSON.stringify(formData.raw, null, 2)}
              </pre>
            </div>
          )}

          {formData.importMode === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.fields.jsonConfig')} *
                </label>
                <Textarea
                  value={formData.jsonInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormData((prev) => ({ ...prev, jsonInput: value }));
                    handleJsonValidation(value);
                  }}
                  className={`font-code text-sm ${
                    jsonValidationError
                      ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15'
                      : ''
                  }`}
                  rows={8}
                  placeholder={
                    '{\n  "type": "stdio",\n  "command": "/path/to/server",\n  "args": ["--api-key", "abc123"],\n  "env": {\n    "CACHE_DIR": "/tmp"\n  }\n}'
                  }
                  required
                />
                {jsonValidationError && (
                  <p className="mt-1 text-xs text-red-500">{jsonValidationError}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('mcpForm.validation.jsonHelp')}
                  <br />- stdio:{' '}
                  {`{"type":"stdio","command":"npx","args":["@upstash/context7-mcp"]}`}
                  <br />- http/sse: {`{"type":"http","url":"https://api.example.com/mcp"}`}
                </p>
              </div>
            </div>
          )}

          {formData.importMode === 'form' && formData.type === 'stdio' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.fields.command')} *
                </label>
                <Input
                  value={formData.config.command}
                  onChange={(event) => updateConfig('command', event.target.value)}
                  placeholder="/path/to/mcp-server"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.fields.arguments')}
                </label>
                <Textarea
                  value={formData.config.args.join('\n')}
                  onChange={(event) => {
                    const args = event.target.value.split('\n').filter((arg) => arg.trim());
                    updateConfig('args', args);
                  }}
                  rows={3}
                  placeholder="--api-key&#10;abc123"
                />
              </div>
            </div>
          )}

          {formData.importMode === 'form' &&
            (formData.type === 'sse' || formData.type === 'http') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.fields.url')} *
                </label>
                <Input
                  value={formData.config.url}
                  onChange={(event) => updateConfig('url', event.target.value)}
                  placeholder="https://api.example.com/mcp"
                  type="url"
                  required
                />
              </div>
            )}

          {formData.importMode === 'form' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t('mcpForm.fields.envVars')}
              </label>
              <Textarea
                value={Object.entries(formData.config.env)
                  .map(([key, value]) => `${key}=${value}`)
                  .join('\n')}
                onChange={(event) => {
                  const env: Record<string, string> = {};
                  event.target.value.split('\n').forEach((line) => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && key.trim()) {
                      env[key.trim()] = valueParts.join('=').trim();
                    }
                  });
                  updateConfig('env', env);
                }}
                rows={3}
                placeholder="API_KEY=your-key&#10;DEBUG=true"
              />
            </div>
          )}

          {formData.importMode === 'form' &&
            (formData.type === 'sse' || formData.type === 'http') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('mcpForm.fields.headers')}
                </label>
                <Textarea
                  value={Object.entries(formData.config.headers)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n')}
                  onChange={(event) => {
                    const headers: Record<string, string> = {};
                    event.target.value.split('\n').forEach((line) => {
                      const [key, ...valueParts] = line.split('=');
                      if (key && key.trim()) {
                        headers[key.trim()] = valueParts.join('=').trim();
                      }
                    });
                    updateConfig('headers', headers);
                  }}
                  rows={3}
                  placeholder="Authorization=Bearer token&#10;X-API-Key=your-key"
                />
              </div>
            )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('mcpForm.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="bg-brand text-brand-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting
                ? t('mcpForm.actions.saving')
                : isEditing
                  ? t('mcpForm.actions.updateServer')
                  : t('mcpForm.actions.addServer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
