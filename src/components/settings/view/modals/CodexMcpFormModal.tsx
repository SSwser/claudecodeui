import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Textarea } from '../../../../shared/view/ui';
import { DEFAULT_CODEX_MCP_FORM } from '../../constants/constants';
import type { CodexMcpFormState, McpServer } from '../../types/types';

type CodexMcpFormModalProps = {
  isOpen: boolean;
  editingServer: McpServer | null;
  onClose: () => void;
  onSubmit: (formData: CodexMcpFormState, editingServer: McpServer | null) => Promise<void>;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

const createFormStateFromServer = (server: McpServer): CodexMcpFormState => ({
  name: server.name || '',
  type: 'stdio',
  config: {
    command: server.config?.command || '',
    args: server.config?.args || [],
    env: server.config?.env || {},
  },
});

export default function CodexMcpFormModal({
  isOpen,
  editingServer,
  onClose,
  onSubmit,
}: CodexMcpFormModalProps) {
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState<CodexMcpFormState>(DEFAULT_CODEX_MCP_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingServer) {
      setFormData(createFormStateFromServer(editingServer));
      return;
    }

    setFormData(DEFAULT_CODEX_MCP_FORM);
  }, [editingServer, isOpen]);

  if (!isOpen) {
    return null;
  }

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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-border/80 bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/80 p-5">
          <h3 className="text-lg font-medium text-foreground">
            {editingServer ? t('mcpForm.title.edit') : t('mcpForm.title.add')}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('mcpForm.fields.command')} *
            </label>
            <Input
              value={formData.config.command}
              onChange={(event) => {
                const command = event.target.value;
                setFormData((prev) => ({
                  ...prev,
                  config: { ...prev.config, command },
                }));
              }}
              placeholder="npx @my-org/mcp-server"
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
                setFormData((prev) => ({
                  ...prev,
                  config: { ...prev.config, args },
                }));
              }}
              placeholder="--port&#10;3000"
              rows={3}
            />
          </div>

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
                  if (key && valueParts.length > 0) {
                    env[key.trim()] = valueParts.join('=').trim();
                  }
                });
                setFormData((prev) => ({
                  ...prev,
                  config: { ...prev.config, env },
                }));
              }}
              placeholder="API_KEY=xxx&#10;DEBUG=true"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border/80 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('mcpForm.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.config.command.trim()}
              className="bg-brand text-brand-foreground hover:opacity-90"
            >
              {isSubmitting
                ? t('mcpForm.actions.saving')
                : editingServer
                  ? t('mcpForm.actions.updateServer')
                  : t('mcpForm.actions.addServer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
