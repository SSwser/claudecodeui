import { FolderPlus, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WorkspaceType } from '../types';

type StepTypeSelectionProps = {
  workspaceType: WorkspaceType;
  onWorkspaceTypeChange: (workspaceType: WorkspaceType) => void;
};

export default function StepTypeSelection({
  workspaceType,
  onWorkspaceTypeChange,
}: StepTypeSelectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h4 className="mb-3 text-sm font-medium text-muted-foreground">
        {t('projectWizard.step1.question')}
      </h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => onWorkspaceTypeChange('logical')}
          className={`rounded-lg border-2 p-4 text-left transition-all ${
            workspaceType === 'logical'
              ? 'bg-brand/8 border-brand/50 shadow-subtle'
              : 'border-border/70 bg-surface-2/70 hover:border-brand/20 hover:bg-surface-3/70'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-large border border-brand/15 bg-brand/10">
              <FolderPlus className="h-5 w-5 text-brand" />
            </div>
            <div className="flex-1">
              <h5 className="mb-1 font-semibold text-foreground">
                {t('projectWizard.step1.existing.title')}
              </h5>
              <p className="text-sm text-muted-foreground">
                {t('projectWizard.step1.existing.description')}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onWorkspaceTypeChange('worktree')}
          className={`rounded-lg border-2 p-4 text-left transition-all ${
            workspaceType === 'worktree'
              ? 'bg-brand/8 border-brand/50 shadow-subtle'
              : 'border-border/70 bg-surface-2/70 hover:border-brand/20 hover:bg-surface-3/70'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-large border border-border/60 bg-surface-3">
              <GitBranch className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <h5 className="mb-1 font-semibold text-foreground">
                {t('projectWizard.step1.new.title')}
              </h5>
              <p className="text-sm text-muted-foreground">
                {t('projectWizard.step1.new.description')}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
