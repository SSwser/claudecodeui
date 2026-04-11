import { useTranslation } from 'react-i18next';
import { Input } from '../../../shared/view/ui';
import { shouldShowGithubAuthentication } from '../utils/pathUtils';
import type { GithubTokenCredential, TokenMode, WorkspaceType } from '../types';
import GithubAuthenticationCard from './GithubAuthenticationCard';
import WorkspacePathField from './WorkspacePathField';

type StepConfigurationProps = {
  workspaceType: WorkspaceType;
  workspacePath: string;
  sourcePath: string;
  branchName: string;
  baseBranch: string;
  githubUrl: string;
  tokenMode: TokenMode;
  selectedGithubToken: string;
  newGithubToken: string;
  availableTokens: GithubTokenCredential[];
  loadingTokens: boolean;
  tokenLoadError: string | null;
  isCreating: boolean;
  onWorkspacePathChange: (workspacePath: string) => void;
  onSourcePathChange: (sourcePath: string) => void;
  onBranchNameChange: (branchName: string) => void;
  onBaseBranchChange: (baseBranch: string) => void;
  onGithubUrlChange: (githubUrl: string) => void;
  onTokenModeChange: (tokenMode: TokenMode) => void;
  onSelectedGithubTokenChange: (tokenId: string) => void;
  onNewGithubTokenChange: (tokenValue: string) => void;
  onAdvanceToConfirm: () => void;
};

export default function StepConfiguration({
  workspaceType,
  workspacePath,
  sourcePath,
  branchName,
  baseBranch,
  githubUrl,
  tokenMode,
  selectedGithubToken,
  newGithubToken,
  availableTokens,
  loadingTokens,
  tokenLoadError,
  isCreating,
  onWorkspacePathChange,
  onSourcePathChange,
  onBranchNameChange,
  onBaseBranchChange,
  onGithubUrlChange,
  onTokenModeChange,
  onSelectedGithubTokenChange,
  onNewGithubTokenChange,
  onAdvanceToConfirm,
}: StepConfigurationProps) {
  const { t } = useTranslation();
  const showGithubAuth = shouldShowGithubAuthentication(workspaceType, githubUrl);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          {workspaceType === 'worktree'
            ? t('projectWizard.step2.worktreePath')
            : t('projectWizard.step2.logicalPath')}
        </label>

        <WorkspacePathField
          workspaceType={workspaceType}
          value={workspacePath}
          disabled={isCreating}
          onChange={onWorkspacePathChange}
          onAdvanceToConfirm={onAdvanceToConfirm}
        />

        <p className="mt-1 text-xs text-muted-foreground">
          {workspaceType === 'worktree'
            ? t('projectWizard.step2.worktreeHelp')
            : t('projectWizard.step2.logicalHelp')}
        </p>
      </div>

      {workspaceType === 'logical' && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('projectWizard.step2.githubUrl')}
            </label>
            <Input
              type="text"
              value={githubUrl}
              onChange={(event) => onGithubUrlChange(event.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full"
              disabled={isCreating}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('projectWizard.step2.githubHelp')}
            </p>
          </div>

          {showGithubAuth && (
            <GithubAuthenticationCard
              tokenMode={tokenMode}
              selectedGithubToken={selectedGithubToken}
              newGithubToken={newGithubToken}
              availableTokens={availableTokens}
              loadingTokens={loadingTokens}
              tokenLoadError={tokenLoadError}
              onTokenModeChange={onTokenModeChange}
              onSelectedGithubTokenChange={onSelectedGithubTokenChange}
              onNewGithubTokenChange={onNewGithubTokenChange}
            />
          )}
        </>
      )}

      {workspaceType === 'worktree' && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('projectWizard.step2.sourcePath')}
            </label>
            <Input
              type="text"
              value={sourcePath}
              onChange={(event) => onSourcePathChange(event.target.value)}
              placeholder={t('projectWizard.step2.sourcePathPlaceholder')}
              className="w-full"
              disabled={isCreating}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('projectWizard.step2.sourcePathHelp')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t('projectWizard.step2.branchName')}
              </label>
              <Input
                type="text"
                value={branchName}
                onChange={(event) => onBranchNameChange(event.target.value)}
                placeholder={t('projectWizard.step2.branchNamePlaceholder')}
                className="w-full"
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t('projectWizard.step2.baseBranch')}
              </label>
              <Input
                type="text"
                value={baseBranch}
                onChange={(event) => onBaseBranchChange(event.target.value)}
                placeholder={t('projectWizard.step2.baseBranchPlaceholder')}
                className="w-full"
                disabled={isCreating}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('projectWizard.step2.baseBranchHelp')}
              </p>
            </div>
          </div>

          <div className="rounded-large border border-[hsl(var(--warning)/0.28)] bg-[hsl(var(--warning)/0.14)] p-3 text-sm text-foreground">
            {t('projectWizard.step2.worktreeConsequences')}
          </div>
        </>
      )}
    </div>
  );
}
