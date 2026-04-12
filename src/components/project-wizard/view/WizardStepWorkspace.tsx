import { useTranslation } from 'react-i18next';
import SettingsToggle from '../../settings/view/SettingsToggle';

type WizardStepWorkspaceProps = {
  multiWorkspaceEnabled: boolean;
  onChange: (value: boolean) => void;
};

export default function WizardStepWorkspace({
  multiWorkspaceEnabled,
  onChange,
}: WizardStepWorkspaceProps) {
  const { t } = useTranslation('projects');

  return (
    <div className="space-y-5">
      <div className="rounded-large border border-border/70 bg-card/80 p-4 shadow-subtle">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">{t('wizard.workspace.title')}</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {t('wizard.workspace.description')}
            </p>
          </div>
          <SettingsToggle
            checked={multiWorkspaceEnabled}
            onChange={onChange}
            ariaLabel={t('wizard.workspace.title')}
          />
        </div>
      </div>

      <div className="rounded-large border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">{t('wizard.workspace.warningTitle')}</p>
        <p className="mt-1">
          {t('wizard.workspace.warningBody')}
        </p>
      </div>

      {multiWorkspaceEnabled ? (
        <div className="rounded-large border border-border/70 bg-surface-2/80 p-4 text-sm leading-6 text-muted-foreground">
          {t('wizard.workspace.enabledDetails')}
        </div>
      ) : null}
    </div>
  );
}