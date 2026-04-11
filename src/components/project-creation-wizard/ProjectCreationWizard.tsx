import { useCallback, useMemo, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ErrorBanner from './components/ErrorBanner';
import StepConfiguration from './components/StepConfiguration';
import StepReview from './components/StepReview';
import StepTypeSelection from './components/StepTypeSelection';
import WizardFooter from './components/WizardFooter';
import WizardProgress from './components/WizardProgress';
import { useGithubTokens } from './hooks/useGithubTokens';
import { cloneWorkspaceWithProgress, createWorkspaceRequest } from './data/workspaceApi';
import { isCloneWorkflow, shouldShowGithubAuthentication } from './utils/pathUtils';
import type {
  CreateWorkspacePayload,
  TokenMode,
  WizardFormState,
  WizardStep,
  WorkspaceType,
} from './types';

type ProjectCreationWizardProps = {
  onClose: () => void;
  onProjectCreated?: (project?: Record<string, unknown>) => void;
};

const initialFormState: WizardFormState = {
  workspaceType: 'logical',
  workspacePath: '',
  sourcePath: '',
  branchName: '',
  baseBranch: 'main',
  githubUrl: '',
  tokenMode: 'stored',
  selectedGithubToken: '',
  newGithubToken: '',
};

const buildCreateWorkspacePayload = (formState: WizardFormState): CreateWorkspacePayload => {
  const workspaceType = formState.workspaceType;
  const path = formState.workspacePath.trim();

  if (workspaceType === 'worktree') {
    return {
      workspaceType,
      path,
      sourcePath: formState.sourcePath.trim(),
      branchName: formState.branchName.trim(),
      baseBranch: formState.baseBranch.trim() || 'main',
    };
  }

  const githubUrl = formState.githubUrl.trim();

  return {
    workspaceType,
    path,
    ...(githubUrl
      ? {
          githubUrl,
          githubTokenId:
            formState.tokenMode === 'stored' ? formState.selectedGithubToken || undefined : undefined,
          newGithubToken:
            formState.tokenMode === 'new' ? formState.newGithubToken.trim() || undefined : undefined,
        }
      : {}),
  };
};

const getConfigurationValidationError = (
  formState: WizardFormState,
  t: (key: string) => string
): string | null => {
  if (!formState.workspacePath.trim()) {
    return formState.workspaceType === 'worktree'
      ? t('projectWizard.errors.provideWorktreePath')
      : t('projectWizard.errors.provideLogicalPath');
  }

  if (formState.workspaceType === 'worktree' && !formState.sourcePath.trim()) {
    return t('projectWizard.errors.provideSourcePathAction');
  }

  if (formState.workspaceType === 'worktree' && !formState.branchName.trim()) {
    return t('projectWizard.errors.provideBranchNameAction');
  }

  return null;
};

export default function ProjectCreationWizard({
  onClose,
  onProjectCreated,
}: ProjectCreationWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>(1);
  const [formState, setFormState] = useState<WizardFormState>(initialFormState);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneProgress, setCloneProgress] = useState('');

  const shouldLoadTokens =
    step === 2 && shouldShowGithubAuthentication(formState.workspaceType, formState.githubUrl);

  const autoSelectToken = useCallback((tokenId: string) => {
    setFormState((previous) => ({ ...previous, selectedGithubToken: tokenId }));
  }, []);

  const {
    tokens: availableTokens,
    loading: loadingTokens,
    loadError: tokenLoadError,
    selectedTokenName,
  } = useGithubTokens({
    shouldLoad: shouldLoadTokens,
    selectedTokenId: formState.selectedGithubToken,
    onAutoSelectToken: autoSelectToken,
  });

  // Keep cross-step values in this component; local UI state lives in child components.
  const updateField = useCallback(
    <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => {
      setFormState((previous) => ({ ...previous, [key]: value }));
    },
    []
  );

  const updateWorkspaceType = useCallback(
    (workspaceType: WorkspaceType) => {
      setFormState((previous) => ({
        ...previous,
        workspaceType,
        sourcePath: workspaceType === 'worktree' ? previous.sourcePath : '',
        branchName: workspaceType === 'worktree' ? previous.branchName : '',
        baseBranch: workspaceType === 'worktree' ? previous.baseBranch || 'main' : 'main',
        githubUrl: workspaceType === 'logical' ? previous.githubUrl : '',
        tokenMode: workspaceType === 'logical' ? previous.tokenMode : 'stored',
        selectedGithubToken: workspaceType === 'logical' ? previous.selectedGithubToken : '',
        newGithubToken: workspaceType === 'logical' ? previous.newGithubToken : '',
      }));
    },
    []
  );

  const updateTokenMode = useCallback(
    (tokenMode: TokenMode) => updateField('tokenMode', tokenMode),
    [updateField]
  );

  const handleNext = useCallback(() => {
    setError(null);

    if (step === 1) {
      if (!formState.workspaceType) {
        setError(t('projectWizard.errors.selectType'));
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const validationError = getConfigurationValidationError(formState, t);
      if (validationError) {
        setError(validationError);
        return;
      }

      setStep(3);
    }
  }, [formState, step, t]);

  const handleBack = useCallback(() => {
    setError(null);
    setStep((previousStep) =>
      previousStep > 1 ? ((previousStep - 1) as WizardStep) : previousStep
    );
  }, []);

  const reviewPayload = useMemo(() => buildCreateWorkspacePayload(formState), [formState]);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    setCloneProgress('');

    try {
      const payload = buildCreateWorkspacePayload(formState);
      const shouldCloneRepository =
        payload.workspaceType === 'logical' && Boolean(payload.githubUrl && payload.githubUrl.trim());

      if (shouldCloneRepository) {
        const project = await cloneWorkspaceWithProgress(
          {
            workspacePath: payload.path,
            githubUrl: payload.githubUrl || '',
            tokenMode: formState.tokenMode,
            selectedGithubToken: formState.selectedGithubToken,
            newGithubToken: formState.newGithubToken,
          },
          {
            onProgress: setCloneProgress,
          }
        );

        onProjectCreated?.(project);
        onClose();
        return;
      }

      const project = await createWorkspaceRequest(payload);

      onProjectCreated?.(project);
      onClose();
    } catch (createError) {
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : t('projectWizard.errors.failedToCreate');
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [formState, onClose, onProjectCreated, t]);

  const shouldCloneRepository = useMemo(
    () => isCloneWorkflow(formState.workspaceType, formState.githubUrl),
    [formState.githubUrl, formState.workspaceType]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-[60] flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-4">
      <div className="h-full w-full overflow-y-auto rounded-none border-0 border-border/70 bg-surface-2 text-foreground shadow-ring sm:h-auto sm:max-w-2xl sm:rounded-large sm:border">
        <div className="flex items-center justify-between border-b border-border/70 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-large border border-brand/20 bg-brand/10">
              <FolderPlus className="h-4 w-4 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('projectWizard.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-medium p-2 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
            disabled={isCreating}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <WizardProgress step={step} />

        <div className="min-h-[300px] space-y-6 p-6">
          {error && <ErrorBanner message={error} />}

          {step === 1 && (
            <StepTypeSelection
              workspaceType={formState.workspaceType}
              onWorkspaceTypeChange={updateWorkspaceType}
            />
          )}

          {step === 2 && (
            <StepConfiguration
              workspaceType={formState.workspaceType}
              workspacePath={formState.workspacePath}
              sourcePath={formState.sourcePath}
              branchName={formState.branchName}
              baseBranch={formState.baseBranch}
              githubUrl={formState.githubUrl}
              tokenMode={formState.tokenMode}
              selectedGithubToken={formState.selectedGithubToken}
              newGithubToken={formState.newGithubToken}
              availableTokens={availableTokens}
              loadingTokens={loadingTokens}
              tokenLoadError={tokenLoadError}
              isCreating={isCreating}
              onWorkspacePathChange={(workspacePath) => updateField('workspacePath', workspacePath)}
              onSourcePathChange={(sourcePath) => updateField('sourcePath', sourcePath)}
              onBranchNameChange={(branchName) => updateField('branchName', branchName)}
              onBaseBranchChange={(baseBranch) => updateField('baseBranch', baseBranch)}
              onGithubUrlChange={(githubUrl) => updateField('githubUrl', githubUrl)}
              onTokenModeChange={updateTokenMode}
              onSelectedGithubTokenChange={(selectedGithubToken) =>
                updateField('selectedGithubToken', selectedGithubToken)
              }
              onNewGithubTokenChange={(newGithubToken) =>
                updateField('newGithubToken', newGithubToken)
              }
              onAdvanceToConfirm={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <StepReview
              payload={reviewPayload}
              formState={formState}
              selectedTokenName={selectedTokenName}
              isCreating={isCreating}
              cloneProgress={cloneProgress}
            />
          )}
        </div>

        <WizardFooter
          step={step}
          isCreating={isCreating}
          isCloneWorkflow={shouldCloneRepository}
          onClose={onClose}
          onBack={handleBack}
          onNext={handleNext}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
