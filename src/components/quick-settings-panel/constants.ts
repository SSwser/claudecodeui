import { ArrowDown, Brain, Eye, FileText, Languages, Maximize2, Mic, Sparkles } from 'lucide-react';
import type { PreferenceToggleItem, WhisperMode, WhisperOption } from './types';

export const HANDLE_POSITION_STORAGE_KEY = 'quickSettingsHandlePosition';
export const WHISPER_MODE_STORAGE_KEY = 'whisperMode';
export const WHISPER_MODE_CHANGED_EVENT = 'whisperModeChanged';

export const DEFAULT_HANDLE_POSITION = 50;
export const HANDLE_POSITION_MIN = 10;
export const HANDLE_POSITION_MAX = 90;
export const DRAG_THRESHOLD_PX = 5;

export const SETTING_ROW_CLASS =
  'flex items-center justify-between rounded-large border border-border/60 bg-surface-2/90 p-3 text-foreground shadow-subtle transition-colors hover:border-brand/20 hover:bg-surface-3/75 dark:border-border/70 dark:bg-surface-2';

export const TOGGLE_ROW_CLASS = `${SETTING_ROW_CLASS} cursor-pointer`;

export const CHECKBOX_CLASS =
  'h-4 w-4 rounded border-border bg-surface-1 text-brand focus:ring-2 focus:ring-ring dark:border-border dark:bg-surface-1 dark:text-brand';

export const TOOL_DISPLAY_TOGGLES: PreferenceToggleItem[] = [
  {
    key: 'autoExpandTools',
    labelKey: 'quickSettings.autoExpandTools',
    icon: Maximize2,
  },
  {
    key: 'showRawParameters',
    labelKey: 'quickSettings.showRawParameters',
    icon: Eye,
  },
  {
    key: 'showThinking',
    labelKey: 'quickSettings.showThinking',
    icon: Brain,
  },
];

export const VIEW_OPTION_TOGGLES: PreferenceToggleItem[] = [
  {
    key: 'autoScrollToBottom',
    labelKey: 'quickSettings.autoScrollToBottom',
    icon: ArrowDown,
  },
];

export const INPUT_SETTING_TOGGLES: PreferenceToggleItem[] = [
  {
    key: 'sendByCtrlEnter',
    labelKey: 'quickSettings.sendByCtrlEnter',
    icon: Languages,
  },
];

export const WHISPER_OPTIONS: WhisperOption[] = [
  {
    value: 'default',
    titleKey: 'quickSettings.whisper.modes.default',
    descriptionKey: 'quickSettings.whisper.modes.defaultDescription',
    icon: Mic,
  },
  {
    value: 'prompt',
    titleKey: 'quickSettings.whisper.modes.prompt',
    descriptionKey: 'quickSettings.whisper.modes.promptDescription',
    icon: Sparkles,
  },
  {
    value: 'vibe',
    titleKey: 'quickSettings.whisper.modes.vibe',
    descriptionKey: 'quickSettings.whisper.modes.vibeDescription',
    icon: FileText,
  },
];

export const VIBE_MODE_ALIASES: WhisperMode[] = ['vibe', 'instructions', 'architect'];
