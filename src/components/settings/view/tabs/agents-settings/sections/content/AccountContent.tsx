import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button } from '../../../../../../../shared/view/ui';
import SessionProviderLogo from '../../../../../../llm-logo-provider/SessionProviderLogo';
import type { AgentProvider, AuthStatus } from '../../../../../types/types';

type AccountContentProps = {
  agent: AgentProvider;
  authStatus: AuthStatus;
  onLogin: () => void;
};

type AgentVisualConfig = {
  name: string;
  description?: string;
};

const agentConfig: Record<AgentProvider, AgentVisualConfig> = {
  claude: {
    name: 'Claude',
  },
  cursor: {
    name: 'Cursor',
  },
  codex: {
    name: 'Codex',
  },
  gemini: {
    name: 'Gemini',
    description: 'Google Gemini AI assistant',
  },
};

export default function AccountContent({ agent, authStatus, onLogin }: AccountContentProps) {
  const { t } = useTranslation('settings');
  const config = agentConfig[agent];

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center gap-3">
        <SessionProviderLogo provider={agent} className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-medium text-foreground">{config.name}</h3>
          <p className="text-sm text-muted-foreground">
            {t(`agents.account.${agent}.description`)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium text-foreground">{t('agents.connectionStatus')}</div>
              <div className="text-sm text-muted-foreground">
                {authStatus.loading
                  ? t('agents.authStatus.checkingAuth')
                  : authStatus.authenticated
                    ? t('agents.authStatus.loggedInAs', {
                        email: authStatus.email || t('agents.authStatus.authenticatedUser'),
                      })
                    : t('agents.authStatus.notConnected')}
              </div>
            </div>
            <div>
              {authStatus.loading ? (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {t('agents.authStatus.checking')}
                </Badge>
              ) : authStatus.authenticated ? (
                <Badge
                  variant="secondary"
                  className="border border-success/20 bg-success/10 text-success"
                >
                  {t('agents.authStatus.connected')}
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="border border-border/80 bg-muted/70 text-muted-foreground"
                >
                  {t('agents.authStatus.disconnected')}
                </Badge>
              )}
            </div>
          </div>

          {authStatus.method !== 'api_key' && (
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">
                    {authStatus.authenticated
                      ? t('agents.login.reAuthenticate')
                      : t('agents.login.title')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {authStatus.authenticated
                      ? t('agents.login.reAuthDescription')
                      : t('agents.login.description', { agent: config.name })}
                  </div>
                </div>
                <Button
                  onClick={onLogin}
                  className="bg-brand text-brand-foreground hover:opacity-90"
                  size="sm"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {authStatus.authenticated
                    ? t('agents.login.reLoginButton')
                    : t('agents.login.button')}
                </Button>
              </div>
            </div>
          )}

          {authStatus.error && (
            <div className="border-t border-border/50 pt-4">
              <div className="text-sm text-destructive">
                {t('agents.error', { error: authStatus.error })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
