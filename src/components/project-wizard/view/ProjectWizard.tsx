import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderGit2, FolderPlus, Layers3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { authenticatedFetch } from '../../../utils/api';
import { cloneWorkspaceWithProgress } from '../../project-creation-wizard/data/workspaceApi';
import WizardStepBasics from './WizardStepBasics';
import WizardStepDirectory from './WizardStepDirectory';
import WizardStepWorkspace from './WizardStepWorkspace';

type WizardStep = 1 | 2 | 3;

type ProjectWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project?: Record<string, unknown>) => void;
};

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

type ProjectCreateResponse = {
  id?: number;
  name?: string;
  displayName?: string | null;
  directoryPath?: string;
  multiWorkspaceEnabled?: boolean;
  error?: string;
};

const STEP_META = [
  { id: 1 as const, label: 'Basics', icon: FolderPlus },
  { id: 2 as const, label: 'Directory', icon: FolderGit2 },
  { id: 3 as const, label: 'Workspace', icon: Layers3 },
];

async function createProjectRequest(payload: {
  name: string;
  directoryPath: string;
  multiWorkspaceEnabled: boolean;
}) {
  const response = await authenticatedFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProjectCreateResponse;
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create project');
  }

  return data;
}

async function validateDirectoryPath(pathValue: string) {
  const response = await authenticatedFetch(
    `/api/browse-filesystem?path=${encodeURIComponent(pathValue)}`,
  );

  return response.ok;
}

export default function ProjectWizard({ open, onOpenChange, onProjectCreated }: ProjectWizardProps) {
  const { t } = useTranslation('projects');
  const [step, setStep] = useState<WizardStep>(1);
  const [projectName, setProjectName] = useState('');
  const [directoryPath, setDirectoryPath] = useState('');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [multiWorkspaceEnabled, setMultiWorkspaceEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathValidationState, setPathValidationState] = useState<ValidationState>('idle');
  const [pathValidationMessage, setPathValidationMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloneProgress, setCloneProgress] = useState('');
  const validationSeqRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setProjectName('');
      setDirectoryPath('');
      setGitRepoUrl('');
      setMultiWorkspaceEnabled(false);
      setError(null);
      setPathValidationState('idle');
      setPathValidationMessage(null);
      setCloneProgress('');
    }
  }, [open]);

  useEffect(() => {
    const trimmedPath = directoryPath.trim();
    const isCloneFlow = gitRepoUrl.trim().length > 0;

    if (!trimmedPath) {
      setPathValidationState('idle');
      setPathValidationMessage(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const validationId = validationSeqRef.current + 1;
      validationSeqRef.current = validationId;
      setPathValidationState('validating');
      setPathValidationMessage(t('wizard.directory.validation.validating'));

      try {
        const exists = await validateDirectoryPath(trimmedPath);
        if (validationSeqRef.current !== validationId) {
          return;
        }

        if (exists) {
          setPathValidationState('valid');
          setPathValidationMessage(t('wizard.directory.validation.exists'));
          return;
        }

        setPathValidationState('invalid');
        setPathValidationMessage(
          isCloneFlow
            ? t('wizard.directory.validation.cloneTargetMissing')
            : t('wizard.directory.validation.missing'),
        );
      } catch {
        if (validationSeqRef.current !== validationId) {
          return;
        }

        setPathValidationState('invalid');
        setPathValidationMessage(
          isCloneFlow
            ? t('wizard.directory.validation.cloneTargetMissing')
            : t('wizard.directory.validation.missing'),
        );
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [directoryPath, gitRepoUrl, t]);

  const isCloneFlow = gitRepoUrl.trim().length > 0;

  const summaryRows = useMemo(
    () => [
      { label: t('wizard.summary.name'), value: projectName || '—' },
      { label: t('wizard.summary.directory'), value: directoryPath || '—' },
      { label: t('wizard.summary.repository'), value: gitRepoUrl || t('wizard.summary.none') },
      {
        label: t('wizard.summary.workspaces'),
        value: multiWorkspaceEnabled ? t('wizard.summary.enabled') : t('wizard.summary.disabled'),
      },
    ],
    [directoryPath, gitRepoUrl, multiWorkspaceEnabled, projectName, t],
  );

  const validateStep = () => {
    setError(null);

    if (step === 1) {
      const trimmedName = projectName.trim();
      if (!trimmedName) {
        setError(t('wizard.basics.errors.required'));
        return false;
      }
      if (trimmedName.length < 3) {
        setError(t('wizard.basics.errors.short'));
        return false;
      }
      if (trimmedName.length > 100) {
        setError(t('wizard.basics.errors.long'));
        return false;
      }
    }

    if (step === 2) {
      if (!directoryPath.trim()) {
        setError(t('wizard.directory.errors.required'));
        return false;
      }

      if (!isCloneFlow && pathValidationState === 'invalid') {
        setError(t('wizard.directory.errors.missingLocalPath'));
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    setStep((previousStep) => (Math.min(previousStep + 1, 3) as WizardStep));
  };

  const handleCreate = async () => {
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setCloneProgress('');

    try {
      if (isCloneFlow) {
        await cloneWorkspaceWithProgress(
          {
            workspacePath: directoryPath.trim(),
            githubUrl: gitRepoUrl.trim(),
            tokenMode: 'none',
            selectedGithubToken: '',
            newGithubToken: '',
          },
          {
            onProgress: setCloneProgress,
          },
        );
      }

      const createdProject = await createProjectRequest({
        name: projectName.trim(),
        directoryPath: directoryPath.trim(),
        multiWorkspaceEnabled,
      });

      onProjectCreated?.(createdProject);
      onOpenChange(false);
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : t('wizard.errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader>
          <div className="border-b border-border/70 px-6 pb-4 pt-6">
            <DialogTitle>{t('wizard.title')}</DialogTitle>
            <DialogDescription>{t('wizard.description')}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-2 pt-1">
          <div className="grid grid-cols-3 gap-3">
            {STEP_META.map((item) => {
              const isActive = item.id === step;
              const isComplete = item.id < step;

              return (
                <div
                  key={item.id}
                  className={`rounded-large border px-4 py-3 ${
                    isActive
                      ? 'border-ring bg-ring/5'
                      : isComplete
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                        : 'border-border/70 bg-card/70'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <item.icon className="h-4 w-4" />
                    {t(`wizard.steps.${item.id}`)}
                  </div>
                </div>
              );
            })}
          </div>

          {step === 1 ? (
            <WizardStepBasics value={projectName} error={error} onChange={setProjectName} />
          ) : null}

          {step === 2 ? (
            <WizardStepDirectory
              directoryPath={directoryPath}
              gitRepoUrl={gitRepoUrl}
              validationMessage={pathValidationMessage}
              validationState={pathValidationState}
              error={error}
              onDirectoryPathChange={setDirectoryPath}
              onGitRepoUrlChange={setGitRepoUrl}
              onBrowseRequest={() => {
                const nextPath = window.prompt(t('wizard.directory.browsePrompt'), directoryPath);
                if (nextPath !== null) {
                  setDirectoryPath(nextPath);
                }
              }}
            />
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <WizardStepWorkspace
                multiWorkspaceEnabled={multiWorkspaceEnabled}
                onChange={setMultiWorkspaceEnabled}
              />

              <div className="rounded-large border border-border/70 bg-surface-2/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('wizard.summary.title')}
                </h3>
                <div className="mt-3 space-y-2">
                  {summaryRows.map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="max-w-[70%] break-all text-right text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {cloneProgress ? (
                <div className="rounded-medium border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
                  {cloneProgress}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-medium border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between border-t border-border/70 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t('wizard.actions.cancel')}
            </Button>
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep((previousStep) => (Math.max(previousStep - 1, 1) as WizardStep))} disabled={isSubmitting}>
                  {t('wizard.actions.back')}
                </Button>
              ) : null}
              {step < 3 ? (
                <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                  {t('wizard.actions.next')}
                </Button>
              ) : (
                <Button type="button" onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting
                    ? isCloneFlow
                      ? t('wizard.actions.cloning')
                      : t('wizard.actions.creating')
                    : t('wizard.actions.create')}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}