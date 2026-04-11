import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import type {
  ChatMessage,
  ClaudePermissionSuggestion,
  PermissionGrantResult,
  Provider,
} from '../../types/types';
import { formatUsageLimitText } from '../../utils/chatFormatting';
import { getClaudePermissionSuggestion } from '../../utils/chatPermissions';
import type { Project } from '../../../../types/app';
import { ToolRenderer, shouldHideToolResult } from '../../tools';
import { Markdown } from './Markdown';
import MessageCopyControl from './MessageCopyControl';

type DiffLine = {
  type: string;
  content: string;
  lineNum: number;
};

type MessageComponentProps = {
  message: ChatMessage;
  prevMessage: ChatMessage | null;
  createDiff: (oldStr: string, newStr: string) => DiffLine[];
  onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
  onShowSettings?: () => void;
  onGrantToolPermission?: (
    suggestion: ClaudePermissionSuggestion
  ) => PermissionGrantResult | null | undefined;
  autoExpandTools?: boolean;
  showRawParameters?: boolean;
  showThinking?: boolean;
  selectedProject?: Project | null;
  provider: Provider | string;
};

type InteractiveOption = {
  number: string;
  text: string;
  isSelected: boolean;
};

type PermissionGrantState = 'idle' | 'granted' | 'error';
const COPY_HIDDEN_TOOL_NAMES = new Set(['Bash', 'Edit', 'Write', 'ApplyPatch']);

const MessageComponent = memo(
  ({
    message,
    prevMessage,
    createDiff,
    onFileOpen,
    onShowSettings,
    onGrantToolPermission,
    autoExpandTools,
    showRawParameters,
    showThinking,
    selectedProject,
    provider,
  }: MessageComponentProps) => {
    const { t } = useTranslation('chat');
    const isGrouped =
      prevMessage &&
      prevMessage.type === message.type &&
      (prevMessage.type === 'assistant' ||
        prevMessage.type === 'user' ||
        prevMessage.type === 'tool' ||
        prevMessage.type === 'error');
    const messageRef = useRef<HTMLDivElement | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const permissionSuggestion = getClaudePermissionSuggestion(message, provider);
    const [permissionGrantState, setPermissionGrantState] = useState<PermissionGrantState>('idle');
    const userCopyContent = String(message.content || '');
    const formattedMessageContent = useMemo(
      () => formatUsageLimitText(String(message.content || '')),
      [message.content]
    );
    const assistantCopyContent = message.isToolUse
      ? String(message.displayText || message.content || '')
      : formattedMessageContent;
    const isCommandOrFileEditToolResponse = Boolean(
      message.isToolUse && COPY_HIDDEN_TOOL_NAMES.has(String(message.toolName || ''))
    );
    const shouldShowUserCopyControl = message.type === 'user' && userCopyContent.trim().length > 0;
    const shouldShowAssistantCopyControl =
      message.type === 'assistant' &&
      assistantCopyContent.trim().length > 0 &&
      !isCommandOrFileEditToolResponse;

    useEffect(() => {
      setPermissionGrantState('idle');
    }, [permissionSuggestion?.entry, message.toolId]);

    useEffect(() => {
      const node = messageRef.current;
      if (!autoExpandTools || !node || !message.isToolUse) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isExpanded) {
              setIsExpanded(true);
              const details = node.querySelectorAll<HTMLDetailsElement>('details');
              details.forEach((detail) => {
                detail.open = true;
              });
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(node);

      return () => {
        observer.unobserve(node);
      };
    }, [autoExpandTools, isExpanded, message.isToolUse]);

    const formattedTime = useMemo(
      () => new Date(message.timestamp).toLocaleTimeString(),
      [message.timestamp]
    );
    const shouldHideThinkingMessage = Boolean(message.isThinking && !showThinking);

    if (shouldHideThinkingMessage) {
      return null;
    }

    return (
      <div
        ref={messageRef}
        data-message-timestamp={message.timestamp || undefined}
        className={`chat-message ${message.type} ${isGrouped ? 'grouped' : ''} ${message.type === 'user' ? 'flex justify-end px-3 sm:px-0' : 'px-3 sm:px-0'}`}
      >
        {message.type === 'user' ? (
          /* User message bubble on the right */
          <div className="flex w-full items-end space-x-0 sm:w-auto sm:max-w-[85%] sm:space-x-3 md:max-w-md lg:max-w-lg xl:max-w-xl">
            <div className="group flex-1 rounded-[var(--radius-message,1.25rem)] rounded-br-md border border-brand/15 bg-brand px-3 py-2 text-brand-foreground shadow-sm sm:flex-initial sm:px-4">
              <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
              {message.images && message.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.images.map((img, idx) => (
                    <img
                      key={img.name || idx}
                      src={img.data}
                      alt={img.name}
                      className="h-auto max-w-full cursor-pointer rounded-xl border border-brand-foreground/15 transition-opacity hover:opacity-90"
                      onClick={() => window.open(img.data, '_blank')}
                    />
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-brand-foreground/75">
                {shouldShowUserCopyControl && (
                  <MessageCopyControl content={userCopyContent} messageType="user" />
                )}
                <span>{formattedTime}</span>
              </div>
            </div>
            {!isGrouped && (
              <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand/15 bg-brand text-sm font-medium text-brand-foreground shadow-sm sm:flex">
                U
              </div>
            )}
          </div>
        ) : message.isTaskNotification ? (
          /* Compact task notification on the left */
          <div className="w-full">
            <div className="flex items-center gap-2 py-0.5">
              <span
                className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${message.taskStatus === 'completed' ? 'bg-success' : 'bg-warning'}`}
              />
              <span className="text-xs text-muted-foreground">{message.content}</span>
            </div>
          </div>
        ) : (
          /* Claude/Error/Tool messages on the left */
          <div className="w-full">
            {!isGrouped && (
              <div className="mb-2 flex items-center space-x-3">
                {message.type === 'error' ? (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-destructive/20 bg-destructive text-sm text-destructive-foreground shadow-sm">
                    !
                  </div>
                ) : message.type === 'tool' ? (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted text-sm text-foreground shadow-sm">
                    🔧
                  </div>
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border/80 bg-card p-1 text-sm text-foreground shadow-sm">
                    <SessionProviderLogo provider={provider} className="h-full w-full" />
                  </div>
                )}
                <div className="text-sm font-medium text-foreground">
                  {message.type === 'error'
                    ? t('messageTypes.error')
                    : message.type === 'tool'
                      ? t('messageTypes.tool')
                      : provider === 'cursor'
                        ? t('messageTypes.cursor')
                        : provider === 'codex'
                          ? t('messageTypes.codex')
                          : provider === 'gemini'
                            ? t('messageTypes.gemini')
                            : t('messageTypes.claude')}
                </div>
              </div>
            )}

            <div className="w-full">
              {message.isToolUse ? (
                <>
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <Markdown className="prose prose-sm max-w-none dark:prose-invert">
                        {String(message.displayText || '')}
                      </Markdown>
                    </div>
                  </div>

                  {message.toolInput && (
                    <ToolRenderer
                      toolName={message.toolName || 'UnknownTool'}
                      toolInput={message.toolInput}
                      toolResult={message.toolResult}
                      toolId={message.toolId}
                      mode="input"
                      onFileOpen={onFileOpen}
                      createDiff={createDiff}
                      selectedProject={selectedProject}
                      autoExpandTools={autoExpandTools}
                      showRawParameters={showRawParameters}
                      rawToolInput={
                        typeof message.toolInput === 'string' ? message.toolInput : undefined
                      }
                      isSubagentContainer={message.isSubagentContainer}
                      subagentState={message.subagentState}
                    />
                  )}

                  {/* Tool Result Section */}
                  {message.toolResult &&
                    !shouldHideToolResult(message.toolName || 'UnknownTool', message.toolResult) &&
                    (message.toolResult.isError ? (
                      // Error results - red error box with content
                      <div
                        id={`tool-result-${message.toolId}`}
                        className="relative mt-2 scroll-mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 shadow-sm"
                      >
                        <div className="relative mb-2 flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-destructive"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="text-xs font-medium text-destructive">
                            {t('messageTypes.error')}
                          </span>
                        </div>
                        <div className="relative text-sm text-foreground">
                          <Markdown className="prose prose-sm prose-red max-w-none dark:prose-invert">
                            {String(message.toolResult.content || '')}
                          </Markdown>
                          {permissionSuggestion && (
                            <div className="mt-4 border-t border-destructive/15 pt-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!onGrantToolPermission) return;
                                    const result = onGrantToolPermission(permissionSuggestion);
                                    if (result?.success) {
                                      setPermissionGrantState('granted');
                                    } else {
                                      setPermissionGrantState('error');
                                    }
                                  }}
                                  disabled={
                                    permissionSuggestion.isAllowed ||
                                    permissionGrantState === 'granted'
                                  }
                                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    permissionSuggestion.isAllowed ||
                                    permissionGrantState === 'granted'
                                      ? 'cursor-default border-success/25 bg-success/10 text-success'
                                      : 'border-border bg-background/90 text-foreground hover:bg-background'
                                  }`}
                                >
                                  {permissionSuggestion.isAllowed ||
                                  permissionGrantState === 'granted'
                                    ? t('permissions.added')
                                    : t('permissions.grant', {
                                        tool: permissionSuggestion.toolName,
                                      })}
                                </button>
                                {onShowSettings && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onShowSettings();
                                    }}
                                    className="text-xs text-brand underline underline-offset-2 hover:opacity-80"
                                  >
                                    {t('permissions.openSettings')}
                                  </button>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {t('permissions.addTo', { entry: permissionSuggestion.entry })}
                              </div>
                              {permissionGrantState === 'error' && (
                                <div className="mt-2 text-xs text-destructive">
                                  {t('permissions.error')}
                                </div>
                              )}
                              {(permissionSuggestion.isAllowed ||
                                permissionGrantState === 'granted') && (
                                <div className="mt-2 text-xs text-success">
                                  {t('permissions.retry')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Non-error results - route through ToolRenderer (single source of truth)
                      <div id={`tool-result-${message.toolId}`} className="scroll-mt-4">
                        <ToolRenderer
                          toolName={message.toolName || 'UnknownTool'}
                          toolInput={message.toolInput}
                          toolResult={message.toolResult}
                          toolId={message.toolId}
                          mode="result"
                          onFileOpen={onFileOpen}
                          createDiff={createDiff}
                          selectedProject={selectedProject}
                          autoExpandTools={autoExpandTools}
                        />
                      </div>
                    ))}
                </>
              ) : message.isInteractivePrompt ? (
                // Special handling for interactive prompts
                <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground shadow-sm">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-3 text-base font-semibold text-foreground">
                        {t('interactive.title')}
                      </h4>
                      {(() => {
                        const lines = (message.content || '')
                          .split('\n')
                          .filter((line) => line.trim());
                        const questionLine =
                          lines.find((line) => line.includes('?')) || lines[0] || '';
                        const options: InteractiveOption[] = [];

                        // Parse the menu options
                        lines.forEach((line) => {
                          // Match lines like "❯ 1. Yes" or "  2. No"
                          const optionMatch = line.match(/[❯\s]*(\d+)\.\s+(.+)/);
                          if (optionMatch) {
                            const isSelected = line.includes('❯');
                            options.push({
                              number: optionMatch[1],
                              text: optionMatch[2].trim(),
                              isSelected,
                            });
                          }
                        });

                        return (
                          <>
                            <p className="mb-4 text-sm text-muted-foreground">{questionLine}</p>

                            {/* Option buttons */}
                            <div className="mb-4 space-y-2">
                              {options.map((option) => (
                                <button
                                  key={option.number}
                                  className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
                                    option.isSelected
                                      ? 'border-warning bg-warning text-warning-foreground shadow-sm'
                                      : 'border-border bg-background text-foreground'
                                  } cursor-not-allowed opacity-75`}
                                  disabled
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                        option.isSelected
                                          ? 'bg-white/20'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {option.number}
                                    </span>
                                    <span className="flex-1 text-sm font-medium sm:text-base">
                                      {option.text}
                                    </span>
                                    {option.isSelected && <span className="text-lg">❯</span>}
                                  </div>
                                </button>
                              ))}
                            </div>

                            <div className="rounded-xl border border-warning/20 bg-warning/15 p-3">
                              <p className="mb-1 text-sm font-medium text-foreground">
                                {t('interactive.waiting')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('interactive.instruction')}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : message.isThinking ? (
                /* Thinking messages - collapsible by default */
                <div className="text-sm text-muted-foreground">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
                      <svg
                        className="h-3 w-3 transition-transform group-open:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span>{t('thinking.emoji')}</span>
                    </summary>
                    <div className="mt-2 border-l-2 border-border pl-4 text-sm text-muted-foreground">
                      <Markdown className="prose prose-sm prose-gray max-w-none dark:prose-invert">
                        {message.content}
                      </Markdown>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {/* Thinking accordion for reasoning */}
                  {showThinking && message.reasoning && (
                    <details className="mb-3">
                      <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                        {t('thinking.emoji')}
                      </summary>
                      <div className="mt-2 border-l-2 border-border pl-4 text-sm italic text-muted-foreground">
                        <div className="whitespace-pre-wrap">{message.reasoning}</div>
                      </div>
                    </details>
                  )}

                  {(() => {
                    const content = formattedMessageContent;

                    // Detect if content is pure JSON (starts with { or [)
                    const trimmedContent = content.trim();
                    if (
                      (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) &&
                      (trimmedContent.endsWith('}') || trimmedContent.endsWith(']'))
                    ) {
                      try {
                        const parsed = JSON.parse(trimmedContent);
                        const formatted = JSON.stringify(parsed, null, 2);

                        return (
                          <div className="my-2">
                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="font-medium">{t('json.response')}</span>
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                              <pre className="overflow-x-auto p-4">
                                <code className="font-code block whitespace-pre text-sm text-foreground">
                                  {formatted}
                                </code>
                              </pre>
                            </div>
                          </div>
                        );
                      } catch {
                        // Not valid JSON, fall through to normal rendering
                      }
                    }

                    // Normal rendering for non-JSON content
                    return message.type === 'assistant' ? (
                      <Markdown className="prose prose-sm prose-gray max-w-none dark:prose-invert">
                        {content}
                      </Markdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{content}</div>
                    );
                  })()}
                </div>
              )}

              {(shouldShowAssistantCopyControl || !isGrouped) && (
                <div className="mt-1 flex w-full items-center gap-2 text-[11px] text-muted-foreground/80">
                  {shouldShowAssistantCopyControl && (
                    <MessageCopyControl content={assistantCopyContent} messageType="assistant" />
                  )}
                  {!isGrouped && <span>{formattedTime}</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default MessageComponent;
