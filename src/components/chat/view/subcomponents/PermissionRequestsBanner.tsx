import React from 'react';
import type { PendingPermissionRequest } from '../../types/types';
import {
  buildClaudeToolPermissionEntry,
  formatToolInputForDisplay,
} from '../../utils/chatPermissions';
import { getClaudeSettings } from '../../utils/chatStorage';
import {
  getPermissionPanel,
  registerPermissionPanel,
} from '../../tools/configs/permissionPanelRegistry';
import { AskUserQuestionPanel } from '../../tools/components/InteractiveRenderers';

registerPermissionPanel('AskUserQuestion', AskUserQuestionPanel);

interface PermissionRequestsBannerProps {
  pendingPermissionRequests: PendingPermissionRequest[];
  handlePermissionDecision: (
    requestIds: string | string[],
    decision: {
      allow?: boolean;
      message?: string;
      rememberEntry?: string | null;
      updatedInput?: unknown;
    }
  ) => void;
  handleGrantToolPermission: (suggestion: { entry: string; toolName: string }) => {
    success: boolean;
  };
}

export default function PermissionRequestsBanner({
  pendingPermissionRequests,
  handlePermissionDecision,
  handleGrantToolPermission,
}: PermissionRequestsBannerProps) {
  if (!pendingPermissionRequests.length) {
    return null;
  }

  return (
    <div className="mb-3 space-y-2">
      {pendingPermissionRequests.map((request) => {
        const CustomPanel = getPermissionPanel(request.toolName);
        if (CustomPanel) {
          return (
            <CustomPanel
              key={request.requestId}
              request={request}
              onDecision={handlePermissionDecision}
            />
          );
        }

        const rawInput = formatToolInputForDisplay(request.input);
        const permissionEntry = buildClaudeToolPermissionEntry(request.toolName, rawInput);
        const settings = getClaudeSettings();
        const alreadyAllowed = permissionEntry
          ? settings.allowedTools.includes(permissionEntry)
          : false;
        const rememberLabel = alreadyAllowed ? 'Allow (saved)' : 'Allow & remember';
        const matchingRequestIds = permissionEntry
          ? pendingPermissionRequests
              .filter(
                (item) =>
                  buildClaudeToolPermissionEntry(
                    item.toolName,
                    formatToolInputForDisplay(item.input)
                  ) === permissionEntry
              )
              .map((item) => item.requestId)
          : [request.requestId];

        return (
          <div
            key={request.requestId}
            className="rounded-2xl border border-warning/25 bg-warning/10 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Permission required</div>
                <div className="text-xs text-muted-foreground">
                  Tool: <span className="font-mono">{request.toolName}</span>
                </div>
              </div>
              {permissionEntry && (
                <div className="text-xs text-muted-foreground">
                  Allow rule: <span className="font-mono">{permissionEntry}</span>
                </div>
              )}
            </div>

            {rawInput && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  View tool input
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-border/80 bg-background/90 p-3 text-xs text-foreground shadow-inner">
                  {rawInput}
                </pre>
              </details>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePermissionDecision(request.requestId, { allow: true })}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                Allow once
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permissionEntry && !alreadyAllowed) {
                    handleGrantToolPermission({
                      entry: permissionEntry,
                      toolName: request.toolName,
                    });
                  }
                  handlePermissionDecision(matchingRequestIds, {
                    allow: true,
                    rememberEntry: permissionEntry,
                  });
                }}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  permissionEntry
                    ? 'border-border bg-background/90 text-foreground hover:bg-muted'
                    : 'cursor-not-allowed border-border text-muted-foreground opacity-60'
                }`}
                disabled={!permissionEntry}
              >
                {rememberLabel}
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePermissionDecision(request.requestId, {
                    allow: false,
                    message: 'User denied tool use',
                  })
                }
                className="inline-flex items-center gap-2 rounded-md border border-destructive/25 bg-background/80 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Deny
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
