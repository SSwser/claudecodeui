## Naming Convention

Pattern: `<namespace>.<component-or-section>.<key>`

Rules:
1. All lowercase, dot-separated segments.
2. Namespace = locale file name: `common`, `auth`, `chat`, `sidebar`, `settings`, `codeEditor`, `tasks`.
3. Component or section = React component name or logical grouping. Convert camelCase sections to kebab-case when new keys are introduced.
4. Key = brief English description in snake_case.
5. Prefer three segments: `namespace.section.key`.
   Exception: use four segments only for deep UI trees such as `namespace.screen.section.key`.
6. No abbreviations. Prefer `button_label` over `btn_lbl`.
7. Error keys end with `.error` or `.*_error` where appropriate.
8. Dynamic placeholders stay in translation values using standard i18next `{{value}}` syntax.

Bad examples -> Good examples:

| Bad | Good |
|-----|------|
| `settings.sessionSettings` | `settings.session.title` |
| `common.loading` | `common.status.loading` |
| `auth.loginError` | `auth.login.password_error` |

## Key Inventory

The tables below cover all 7 English namespaces currently loaded by `src/i18n/config.js`. Small namespaces are listed at leaf level. Large namespaces are grouped by stable subtrees to keep this document maintainable during the migration.

### auth

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| auth | `login.*` | `auth.login.*` | keep; normalize future leaf names to snake_case when touched |
| auth | `login.errors.invalidCredentials` | `auth.login.invalid_credentials_error` | rename |
| auth | `login.errors.requiredFields` | `auth.login.required_fields_error` | rename |
| auth | `login.errors.networkError` | `auth.login.network_error` | rename |
| auth | `login.placeholders.username` | `auth.login.username_placeholder` | rename |
| auth | `login.placeholders.password` | `auth.login.password_placeholder` | rename |
| auth | `register.*` | `auth.register.*` | keep; normalize future leaf names to snake_case when touched |
| auth | `register.errors.passwordMismatch` | `auth.register.password_mismatch_error` | rename |
| auth | `register.errors.usernameTaken` | `auth.register.username_taken_error` | rename |
| auth | `register.errors.weakPassword` | `auth.register.weak_password_error` | rename |
| auth | `logout.*` | `auth.logout.*` | keep |

### chat

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| chat | `codeBlock.*` | `chat.code-block.*` | rename section to kebab-case |
| chat | `copyMessage.*` | `chat.copy-message.*` | rename section to kebab-case |
| chat | `messageTypes.*` | `chat.message-types.*` | rename section to kebab-case |
| chat | `tools.*` | `chat.tools.*` | keep |
| chat | `search.*` | `chat.search.*` | keep |
| chat | `fileOperations.*` | `chat.file-operations.*` | rename section to kebab-case |
| chat | `interactive.*` | `chat.interactive.*` | keep |
| chat | `thinking.*` | `chat.thinking.*` | keep |
| chat | `json.response` | `chat.json.response_label` | rename |
| chat | `permissions.*` | `chat.permissions.*` | keep |
| chat | `todo.*` | `chat.todo.*` | keep |
| chat | `plan.*` | `chat.plan.*` | keep |
| chat | `usageLimit.resetAt` | `chat.usage-limit.reset_at` | rename |
| chat | `codex.*` | `chat.codex.*` | keep |
| chat | `gemini.*` | `chat.gemini.*` | keep |
| chat | `input.*` | `chat.input.*` | keep |
| chat | `thinkingMode.*` | `chat.thinking-mode.*` | rename section to kebab-case |
| chat | `providerSelection.*` | `chat.provider-selection.*` | rename section to kebab-case |
| chat | `session.continue.*` | `chat.session-continue.*` | rename subtree for flatter usage |
| chat | `session.loading.*` | `chat.session-loading.*` | rename subtree for flatter usage |
| chat | `session.messages.*` | `chat.session-messages.*` | rename subtree for flatter usage |
| chat | `shell.*` | `chat.shell.*` | keep |
| chat | `claudeStatus.*` | `chat.claude-status.*` | rename section to kebab-case |
| chat | `projectSelection.startChatWithProvider` | `chat.project-selection.start_chat_with_provider` | rename |
| chat | `tasks.nextTaskPrompt` | `chat.tasks.next_task_prompt` | rename |

### codeEditor

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| codeEditor | `toolbar.*` | `codeEditor.toolbar.*` | keep namespace, normalize future leaf names |
| codeEditor | `loading` | `codeEditor.status.loading` | rename |
| codeEditor | `header.showingChanges` | `codeEditor.header.showing_changes` | rename |
| codeEditor | `actions.*` | `codeEditor.actions.*` | keep; normalize future leaf names |
| codeEditor | `footer.lines` | `codeEditor.footer.lines_label` | rename |
| codeEditor | `footer.characters` | `codeEditor.footer.characters_label` | rename |
| codeEditor | `footer.shortcuts` | `codeEditor.footer.shortcuts_label` | rename |
| codeEditor | `binaryFile.title` | `codeEditor.binary-file.title` | rename section to kebab-case |
| codeEditor | `binaryFile.message` | `codeEditor.binary-file.message` | rename section to kebab-case |

### common

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| common | `buttons.*` | `common.buttons.*` | keep |
| common | `tabs.*` | `common.tabs.*` | keep |
| common | `status.*` | `common.status.*` | keep |
| common | `messages.*` | `common.messages.*` | keep |
| common | `navigation.*` | `common.navigation.*` | keep |
| common | `common.*` | `common.fields.*` | rename ambiguous subtree |
| common | `time.*` | `common.time.*` | keep |
| common | `fileOperations.*` | `common.file-operations.*` | rename section to kebab-case |
| common | `mainContent.*` | `common.main-content.*` | rename section to kebab-case |
| common | `fileTree.*` | `common.file-tree.*` | rename section to kebab-case |
| common | `projectWizard.*` | `common.project-wizard.*` | rename section to kebab-case |
| common | `landing.*` | `common.landing.*` | keep |
| common | `notifications.*` | `common.notifications.*` | keep |
| common | `versionUpdate.*` | `common.version-update.*` | rename section to kebab-case |

### settings

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| settings | `title` | `settings.general.title` | rename |
| settings | `tabs.*` | `settings.tabs.*` | keep |
| settings | `account.*` | `settings.account.*` | keep |
| settings | `mcp.*` | `settings.mcp.*` | keep |
| settings | `appearance.*` | `settings.appearance.*` | keep |
| settings | `actions.*` | `settings.actions.*` | keep |
| settings | `quickSettings.*` | `settings.quick-settings.*` | rename section to kebab-case |
| settings | `terminalShortcuts.*` | `settings.terminal-shortcuts.*` | rename section to kebab-case |
| settings | `mainTabs.*` | `settings.main-tabs.*` | rename section to kebab-case |
| settings | `notifications.*` | `settings.notifications.*` | keep |
| settings | `appearanceSettings.*` | `settings.appearance-settings.*` | rename section to kebab-case |
| settings | `mcpForm.*` | `settings.mcp-form.*` | rename section to kebab-case |
| settings | `saveStatus.*` | `settings.save-status.*` | rename section to kebab-case |
| settings | `footerActions.*` | `settings.footer-actions.*` | rename section to kebab-case |
| settings | `git.*` | `settings.git.*` | keep |
| settings | `apiKeys.*` | `settings.api-keys.*` | rename section to kebab-case |
| settings | `tasks.*` | `settings.tasks.*` | keep |
| settings | `agents.*` | `settings.agents.*` | keep |
| settings | `permissions.*` | `settings.permissions.*` | keep |
| settings | `mcpServers.*` | `settings.mcp-servers.*` | rename section to kebab-case |
| settings | `pluginSettings.*` | `settings.plugin-settings.*` | rename section to kebab-case |

### sidebar

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| sidebar | `projects.*` | `sidebar.projects.*` | keep |
| sidebar | `app.title` | `sidebar.app.title` | keep |
| sidebar | `app.subtitle` | `sidebar.app.subtitle` | keep |
| sidebar | `sessions.*` | `sidebar.sessions.*` | keep |
| sidebar | `tooltips.*` | `sidebar.tooltips.*` | keep |
| sidebar | `navigation.*` | `sidebar.navigation.*` | keep |
| sidebar | `actions.*` | `sidebar.actions.*` | keep |
| sidebar | `status.*` | `sidebar.status.*` | keep |
| sidebar | `time.*` | `sidebar.time.*` | keep |
| sidebar | `messages.*` | `sidebar.messages.*` | keep |
| sidebar | `version.updateAvailable` | `sidebar.version.update_available` | rename |
| sidebar | `search.*` | `sidebar.search.*` | keep |
| sidebar | `deleteConfirmation.*` | `sidebar.delete-confirmation.*` | rename section to kebab-case |

### tasks

| Namespace | Current Key Path | Proposed New Key Path | Notes |
|-----------|------------------|-----------------------|-------|
| tasks | `notConfigured.*` | `tasks.not-configured.*` | rename section to kebab-case |
| tasks | `gettingStarted.*` | `tasks.getting-started.*` | rename section to kebab-case |
| tasks | `setupModal.*` | `tasks.setup-modal.*` | rename section to kebab-case |
| tasks | `helpGuide.*` | `tasks.help-guide.*` | rename section to kebab-case |
| tasks | `search.placeholder` | `tasks.search.placeholder` | keep |
| tasks | `filters.*` | `tasks.filters.*` | keep |
| tasks | `sort.*` | `tasks.sort.*` | keep |
| tasks | `views.*` | `tasks.views.*` | keep |
| tasks | `kanban.*` | `tasks.kanban.*` | keep |
| tasks | `buttons.*` | `tasks.buttons.*` | keep |
| tasks | `prd.modified` | `tasks.prd.modified_label` | rename |
| tasks | `statuses.*` | `tasks.statuses.*` | keep |
| tasks | `priorities.*` | `tasks.priorities.*` | keep |
| tasks | `noMatchingTasks.title` | `tasks.no-matching-tasks.title` | rename section to kebab-case |
| tasks | `noMatchingTasks.description` | `tasks.no-matching-tasks.description` | rename section to kebab-case |

## Migration Strategy

1. Convention defined in this document during Phase 4 Plan 02.
2. Components migrated in Phase 4 should introduce only new-format keys.
3. Legacy keys remain in locale files until all consumers are migrated.
4. Keys marked `remove` are deleted only after usage is verified with search and runtime testing.
5. This mapping document is updated as each screen or primitive migration lands.
