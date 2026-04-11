import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../ui/input';
import { Select, type SelectOption } from '../../ui/select';

type HomeFiltersProps = {
  search: string;
  project: string | null;
  workspace: string | null;
  sessionType: string;
  projectOptions: SelectOption[];
  workspaceOptions: SelectOption[];
  onSearchChange: (value: string) => void;
  onProjectChange: (value: string | null) => void;
  onWorkspaceChange: (value: string | null) => void;
  onSessionTypeChange: (value: string) => void;
};

export default function HomeFilters({
  search,
  project,
  workspace,
  sessionType,
  projectOptions,
  workspaceOptions,
  onSearchChange,
  onProjectChange,
  onWorkspaceChange,
  onSessionTypeChange,
}: HomeFiltersProps) {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-4 rounded-large border border-border/70 bg-card/95 p-5 shadow-ring">
      <div className="flex items-center gap-3 rounded-medium border border-border/60 bg-surface-2 px-4 py-3 shadow-subtle">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('landing.searchPlaceholder')}
          className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Select
          value={project || 'all'}
          onValueChange={(value) => onProjectChange(value === 'all' ? null : value)}
          options={projectOptions}
        />
        <Select
          value={workspace || 'all'}
          onValueChange={(value) => onWorkspaceChange(value === 'all' ? null : value)}
          options={workspaceOptions}
        />
        <Select
          value={sessionType}
          onValueChange={onSessionTypeChange}
          options={[
            { value: 'all', label: t('landing.filters.allTypes') },
            { value: 'claude', label: 'Claude' },
            { value: 'cursor', label: 'Cursor' },
            { value: 'codex', label: 'Codex' },
            { value: 'gemini', label: 'Gemini' },
          ]}
        />
      </div>
    </div>
  );
}
