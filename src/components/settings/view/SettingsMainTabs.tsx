import { GitBranch, Key, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SettingsMainTab } from '../types/types';

type SettingsMainTabsProps = {
  activeTab: SettingsMainTab;
  onChange: (tab: SettingsMainTab) => void;
};

type MainTabConfig = {
  id: SettingsMainTab;
  labelKey?: string;
  label?: string;
  icon?: typeof GitBranch;
};

const TAB_CONFIG: MainTabConfig[] = [
  { id: 'agents', labelKey: 'mainTabs.agents' },
  { id: 'appearance', labelKey: 'mainTabs.appearance' },
  { id: 'git', labelKey: 'mainTabs.git', icon: GitBranch },
  { id: 'api', labelKey: 'mainTabs.apiTokens', icon: Key },
  { id: 'tasks', labelKey: 'mainTabs.tasks' },
  { id: 'notifications', labelKey: 'mainTabs.notifications' },
  { id: 'plugins', labelKey: 'mainTabs.plugins', icon: Puzzle },
];

export default function SettingsMainTabs({ activeTab, onChange }: SettingsMainTabsProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="border-b border-border/60 px-4 md:px-6">
      <div
        className="scrollbar-hide flex gap-2 overflow-x-auto py-3"
        role="tablist"
        aria-label={t('mainTabs.label', { defaultValue: 'Settings' })}
      >
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`rounded-small whitespace-nowrap border px-4 py-2.5 text-sm font-medium tracking-ui transition-opacity ${
                isActive
                  ? 'border-border/70 bg-surface-2 text-foreground shadow-subtle'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:opacity-60'
              }`}
            >
              {Icon && <Icon className="mr-2 inline h-4 w-4" />}
              {tab.labelKey ? t(tab.labelKey) : tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
