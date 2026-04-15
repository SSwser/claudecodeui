import {
  MessageSquare,
  Terminal,
  Folder,
  GitBranch,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { AppTab } from '@/types/app';
import { usePlugins } from '@/contexts/PluginsContext';
import PluginIcon from '@/components/plugins/view/PluginIcon';

type MainContentTabSwitcherProps = {
  activeTab: AppTab;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
  shouldShowTasksTab: boolean;
  /** When true, show project-level tabs (Sessions) instead of session-level (Chat, Shell) */
  isProjectView?: boolean;
};

type BuiltInTab = {
  kind: 'builtin';
  id: AppTab;
  labelKey: string;
  icon: LucideIcon;
};

type PluginTab = {
  kind: 'plugin';
  id: AppTab;
  label: string;
  pluginName: string;
  iconFile: string;
};

type TabDefinition = BuiltInTab | PluginTab;

/** Project-level tabs — no Shell, Chat becomes "Sessions" */
const PROJECT_TABS: BuiltInTab[] = [
  { kind: 'builtin', id: 'chat', labelKey: 'Sessions', icon: MessageSquare },
  { kind: 'builtin', id: 'files', labelKey: 'Files', icon: Folder },
  { kind: 'builtin', id: 'git', labelKey: 'Version Control', icon: GitBranch },
];

/** Session-level tabs — includes Shell */
const SESSION_TABS: BuiltInTab[] = [
  { kind: 'builtin', id: 'chat', labelKey: 'tabs.chat', icon: MessageSquare },
  { kind: 'builtin', id: 'shell', labelKey: 'tabs.shell', icon: Terminal },
  { kind: 'builtin', id: 'files', labelKey: 'Files', icon: Folder },
  { kind: 'builtin', id: 'git', labelKey: 'Version Control', icon: GitBranch },
];

const TASKS_TAB: BuiltInTab = {
  kind: 'builtin',
  id: 'tasks',
  labelKey: 'Tasks',
  icon: ClipboardCheck,
};

export default function MainContentTabSwitcher({
  activeTab,
  setActiveTab,
  shouldShowTasksTab,
  isProjectView = false,
}: MainContentTabSwitcherProps) {
  const { t } = useTranslation();
  const { plugins } = usePlugins();

  const baseTabs = isProjectView ? PROJECT_TABS : SESSION_TABS;
  const builtInTabs: BuiltInTab[] = shouldShowTasksTab ? [...baseTabs, TASKS_TAB] : baseTabs;

  const pluginTabs: PluginTab[] = plugins
    .filter((p) => p.enabled)
    .map((p) => ({
      kind: 'plugin',
      id: `plugin:${p.name}` as AppTab,
      label: p.displayName,
      pluginName: p.name,
      iconFile: p.icon,
    }));

  const tabs: TabDefinition[] = [...builtInTabs, ...pluginTabs];

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        // Literal labels (not translation keys) start uppercase and don't contain dots
        const displayLabel =
          tab.kind === 'builtin'
            ? tab.labelKey.includes('.')
              ? t(tab.labelKey)
              : tab.labelKey
            : tab.label;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-[6px] px-[14px] py-[6px] text-[12px] font-medium transition-colors',
              isActive
                ? 'bg-surface-3 text-foreground'
                : 'text-dim-foreground hover:text-muted-foreground'
            )}
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}
