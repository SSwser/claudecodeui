import { FolderSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type WizardStepDirectoryProps = {
  directoryPath: string;
  gitRepoUrl: string;
  validationMessage: string | null;
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
  error?: string | null;
  onDirectoryPathChange: (value: string) => void;
  onGitRepoUrlChange: (value: string) => void;
  onBrowseRequest: () => void;
};

export default function WizardStepDirectory({
  directoryPath,
  gitRepoUrl,
  validationMessage,
  validationState,
  error,
  onDirectoryPathChange,
  onGitRepoUrlChange,
  onBrowseRequest,
}: WizardStepDirectoryProps) {
  const { t } = useTranslation('projects');

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="project-wizard-directory" className="text-sm font-medium text-foreground">
          {t('wizard.directory.directoryLabel')}
        </label>
        <div className="flex gap-2">
          <Input
            id="project-wizard-directory"
            value={directoryPath}
            onChange={(event) => onDirectoryPathChange(event.target.value)}
            placeholder={t('wizard.directory.directoryPlaceholder')}
          />
          <Button type="button" variant="outline" onClick={onBrowseRequest}>
            <FolderSearch className="h-4 w-4" />
            {t('wizard.directory.browse')}
          </Button>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('wizard.directory.directoryHelp')}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="project-wizard-git-url" className="text-sm font-medium text-foreground">
          {t('wizard.directory.gitUrlLabel')}
        </label>
        <Input
          id="project-wizard-git-url"
          value={gitRepoUrl}
          onChange={(event) => onGitRepoUrlChange(event.target.value)}
          placeholder={t('wizard.directory.gitUrlPlaceholder')}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          {t('wizard.directory.gitUrlHelp')}
        </p>
      </div>

      {validationState !== 'idle' && validationMessage ? (
        <div
          className={`rounded-medium border px-3 py-2 text-sm ${
            validationState === 'invalid'
              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
              : validationState === 'validating'
                ? 'border-border/70 bg-surface-2 text-muted-foreground'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
          }`}
        >
          {validationMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-medium border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
