import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isSshGitUrl } from '../utils/pathUtils';
import type { CreateWorkspacePayload, WizardFormState } from '../types';

type StepReviewProps = {
  payload: CreateWorkspacePayload;
  formState: WizardFormState;
  selectedTokenName: string | null;
  isCreating: boolean;
  cloneProgress: string;
};

export default function StepReview({
  payload,
  formState,
  selectedTokenName,
  isCreating,
  cloneProgress,
}: StepReviewProps) {
  const { t } = useTranslation();

  const authenticationLabel = useMemo(() => {
    if (formState.tokenMode === 'stored' && formState.selectedGithubToken) {
      return `${t('projectWizard.step3.usingStoredToken')} ${selectedTokenName || 'Unknown'}`;
    }

    if (formState.tokenMode === 'new' && formState.newGithubToken.trim()) {
      return t('projectWizard.step3.usingProvidedToken');
    }

    if (isSshGitUrl(formState.githubUrl)) {
      return t('projectWizard.step3.sshKey', { defaultValue: 'SSH Key' });
    }

    return t('projectWizard.step3.noAuthentication');
  }, [formState, selectedTokenName, t]);

  return (
    <div className="space-y-4">
      <div className="rounded-large border border-border/70 bg-surface-3/55 p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">
          {t('projectWizard.step3.reviewConfig')}
        </h4>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('projectWizard.step3.workspaceType')}</span>
            <span className="font-medium text-foreground">
              {payload.workspaceType === 'logical'
                ? t('projectWizard.step3.existingWorkspace')
                : t('projectWizard.step3.newWorkspace')}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('projectWizard.step3.path')}</span>
            <span className="break-all font-mono text-xs text-foreground">
              {payload.path}
            </span>
          </div>

          {payload.workspaceType === 'logical' && payload.githubUrl && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('projectWizard.step3.cloneFrom')}</span>
                <span className="break-all font-mono text-xs text-foreground">
                  {payload.githubUrl}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('projectWizard.step3.authentication')}
                </span>
                <span className="text-xs text-foreground">{authenticationLabel}</span>
              </div>
            </>
          )}

          {payload.workspaceType === 'worktree' && (
            <>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{t('projectWizard.step3.sourcePath')}</span>
                <span className="break-all font-mono text-xs text-foreground">
                  {payload.sourcePath}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('projectWizard.step3.branchName')}</span>
                <span className="font-medium text-foreground">{payload.branchName}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('projectWizard.step3.baseBranch')}</span>
                <span className="font-medium text-foreground">{payload.baseBranch}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-brand/8 rounded-large border border-brand/20 p-4">
        {isCreating && cloneProgress ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t('projectWizard.step3.cloningRepository', {
                defaultValue: 'Cloning repository...',
              })}
            </p>
            <code className="block whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
              {cloneProgress}
            </code>
          </div>
        ) : (
          <p className="text-sm text-foreground">
            {payload.workspaceType === 'logical'
              ? t('projectWizard.step3.existingInfo')
              : payload.githubUrl
                ? t('projectWizard.step3.newWithClone')
                : t('projectWizard.step3.worktreeInfo')}
          </p>
        )}
      </div>
    </div>
  );
}
