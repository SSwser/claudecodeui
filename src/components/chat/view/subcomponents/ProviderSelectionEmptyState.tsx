import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS, GEMINI_MODELS } from '@shared/modelConstants';
import SessionProviderLogo from '@/components/llm-logo-provider/SessionProviderLogo';
import { Select, type SelectOption } from '@/components/ui/select';
import type { ProjectSession, SessionProvider } from '@/types/app';
import { NextTaskBanner } from '@/components/task-master';

type ProviderSelectionEmptyStateProps = {
  selectedSession: ProjectSession | null;
  currentSessionId: string | null;
  provider: SessionProvider;
  setProvider: (next: SessionProvider) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  claudeModel: string;
  setClaudeModel: (model: string) => void;
  cursorModel: string;
  setCursorModel: (model: string) => void;
  codexModel: string;
  setCodexModel: (model: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  onShowAllTasks?: (() => void) | null;
  setInput: React.Dispatch<React.SetStateAction<string>>;
};

type ProviderDef = {
  id: SessionProvider;
  name: string;
  infoKey: string;
};

const PROVIDERS: ProviderDef[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    infoKey: 'providerSelection.providerInfo.anthropic',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    infoKey: 'providerSelection.providerInfo.cursorEditor',
  },
  {
    id: 'codex',
    name: 'Codex',
    infoKey: 'providerSelection.providerInfo.openai',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    infoKey: 'providerSelection.providerInfo.google',
  },
];

function getModelConfig(p: SessionProvider) {
  if (p === 'claude') return CLAUDE_MODELS;
  if (p === 'codex') return CODEX_MODELS;
  if (p === 'gemini') return GEMINI_MODELS;
  return CURSOR_MODELS;
}

function getModelValue(p: SessionProvider, c: string, cu: string, co: string, g: string) {
  if (p === 'claude') return c;
  if (p === 'codex') return co;
  if (p === 'gemini') return g;
  return cu;
}

export default function ProviderSelectionEmptyState({
  selectedSession,
  currentSessionId,
  provider,
  setProvider,
  textareaRef,
  claudeModel,
  setClaudeModel,
  cursorModel,
  setCursorModel,
  codexModel,
  setCodexModel,
  geminiModel,
  setGeminiModel,
  tasksEnabled,
  isTaskMasterInstalled,
  onShowAllTasks,
  setInput,
}: ProviderSelectionEmptyStateProps) {
  const { t } = useTranslation('chat');
  const nextTaskPrompt = t('tasks.nextTaskPrompt', {
    defaultValue: 'Start the next task',
  });

  const selectProvider = (next: SessionProvider) => {
    setProvider(next);
    localStorage.setItem('selected-provider', next);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleModelChange = (value: string) => {
    if (provider === 'claude') {
      setClaudeModel(value);
      localStorage.setItem('claude-model', value);
    } else if (provider === 'codex') {
      setCodexModel(value);
      localStorage.setItem('codex-model', value);
    } else if (provider === 'gemini') {
      setGeminiModel(value);
      localStorage.setItem('gemini-model', value);
    } else {
      setCursorModel(value);
      localStorage.setItem('cursor-model', value);
    }
  };

  const modelConfig = getModelConfig(provider);
  const currentModel = getModelValue(provider, claudeModel, cursorModel, codexModel, geminiModel);

  /* ── New session — provider picker ── */
  if (!selectedSession && !currentSessionId) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {t('providerSelection.title')}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t('providerSelection.description')}
            </p>
          </div>

          {/* Provider cards — horizontal row, equal width */}
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {PROVIDERS.map((p) => {
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectProvider(p.id)}
                  className={`
                    relative flex flex-col items-center gap-2.5 rounded-xl border-[1.5px] px-2
                    pb-4 pt-5 transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30
                    focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    active:scale-[0.97]
                    ${
                      active
                        ? 'border-brand/30 bg-card shadow-sm ring-2 ring-brand/15'
                        : 'border-border bg-card/60 hover:border-border/80 hover:bg-card'
                    }
                  `}
                >
                  <SessionProviderLogo
                    provider={p.id}
                    className={`h-9 w-9 transition-transform duration-150 ${active ? 'scale-110' : ''}`}
                  />
                  <div className="text-center">
                    <p className="text-[13px] font-semibold leading-none text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                      {t(p.infoKey)}
                    </p>
                  </div>
                  {/* Check badge */}
                  {active && (
                    <div className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Model picker — appears after provider is chosen */}
          <div
            className={`transition-all duration-200 ${provider ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'}`}
          >
            <div className="mb-5 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('providerSelection.selectModel')}
              </span>
              <Select
                value={currentModel}
                onValueChange={handleModelChange}
                options={modelConfig.OPTIONS.map(
                  ({ value, label }: { value: string; label: string }): SelectOption => ({
                    value,
                    label,
                  })
                )}
                className="w-28"
              />
            </div>

            <p className="text-center text-sm text-muted-foreground/70">
              {
                {
                  claude: t('providerSelection.readyPrompt.claude', {
                    model: claudeModel,
                  }),
                  cursor: t('providerSelection.readyPrompt.cursor', {
                    model: cursorModel,
                  }),
                  codex: t('providerSelection.readyPrompt.codex', {
                    model: codexModel,
                  }),
                  gemini: t('providerSelection.readyPrompt.gemini', {
                    model: geminiModel,
                  }),
                }[provider]
              }
            </p>
          </div>

          {/* Task banner */}
          {provider && tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-5">
              <NextTaskBanner
                onStartTask={() => setInput(nextTaskPrompt)}
                onShowAllTasks={onShowAllTasks}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Existing session — continue prompt ── */
  if (selectedSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <p className="mb-1.5 text-lg font-semibold text-foreground">
            {t('session.continue.title')}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('session.continue.description')}
          </p>

          {tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-5">
              <NextTaskBanner
                onStartTask={() => setInput(nextTaskPrompt)}
                onShowAllTasks={onShowAllTasks}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
