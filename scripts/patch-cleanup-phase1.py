"""
Patch script: Issue 1 (tab close flicker) + Issue 2 (remove dual pane) + Issue 3 (landing/session chrome)
- AppTabStrip.tsx  → simplify props, fix close button, move + outside scroll area
- TabContextMenu.tsx → remove "Open in New Pane"
- AppContent.tsx  → remove dual-pane, split showShellChrome into showTabStrip + showDesktopSidebar
"""
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def write_file(rel_path, content):
    path = os.path.join(BASE, rel_path.replace('/', os.sep))
    # Detect existing line endings
    if os.path.exists(path):
        with open(path, 'rb') as f:
            raw = f.read()
        use_crlf = b'\r\n' in raw
    else:
        use_crlf = False
    encoded = content.replace('\r\n', '\n')
    if use_crlf:
        encoded = encoded.replace('\n', '\r\n')
    with open(path, 'wb') as f:
        f.write(encoded.encode('utf-8'))
    print(f"  wrote {rel_path}")

def patch_file(rel_path, replacements):
    """Each replacement is (old_str, new_str). Matches LF or CRLF variants."""
    path = os.path.join(BASE, rel_path.replace('/', os.sep))
    with open(path, 'rb') as f:
        raw = f.read()
    use_crlf = b'\r\n' in raw
    content = raw.decode('utf-8').replace('\r\n', '\n')
    ok = True
    for old, new in replacements:
        old_n = old.replace('\r\n', '\n')
        new_n = new.replace('\r\n', '\n')
        if old_n in content:
            content = content.replace(old_n, new_n, 1)
            print(f"  patched: {repr(old_n[:60])} ...")
        else:
            print(f"  MISS: {repr(old_n[:80])}")
            ok = False
    if use_crlf:
        out = content.replace('\n', '\r\n').encode('utf-8')
    else:
        out = content.encode('utf-8')
    with open(path, 'wb') as f:
        f.write(out)
    return ok

# ─────────────────────────────────────────────
# 1. AppTabStrip.tsx — full rewrite
# ─────────────────────────────────────────────
APP_TAB_STRIP = """\
import { useEffect, useState } from 'react'
import { Home, Plus, X } from 'lucide-react'
import type { AppShellTab } from '../../../types/app'
import { Button } from '../../ui/button'
import TabContextMenu from './TabContextMenu'

type AppTabStripProps = {
\ttabs: AppShellTab[]
\tactiveTabId: string
\tonSelectTab: (tabId: string) => void
\tonCloseTab: (tabId: string) => void
\tonActivateHome: () => void
\tonAddTab: () => void
}

export default function AppTabStrip({
\ttabs,
\tactiveTabId,
\tonSelectTab,
\tonCloseTab,
\tonActivateHome,
\tonAddTab,
}: AppTabStripProps) {
\tconst [menuState, setMenuState] = useState<{ tabId: string; x: number; y: number } | null>(null)

\tuseEffect(() => {
\t\tconst handleEscape = (event: KeyboardEvent) => {
\t\t\tif (event.key === 'Escape') {
\t\t\t\tsetMenuState(null)
\t\t\t}
\t\t}
\t\twindow.addEventListener('keydown', handleEscape)
\t\treturn () => window.removeEventListener('keydown', handleEscape)
\t}, [])

\treturn (
\t\t<div className='flex items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur sm:px-4'>
\t\t\t<div className='flex min-w-0 flex-1 items-center gap-2 overflow-x-auto'>
\t\t\t\t{tabs.map(tab => {
\t\t\t\t\tconst isActive = tab.id === activeTabId
\t\t\t\t\tconst isHome = tab.kind === 'home'

\t\t\t\t\treturn (
\t\t\t\t\t\t<div
\t\t\t\t\t\t\tkey={tab.id}
\t\t\t\t\t\t\tonContextMenu={event => {
\t\t\t\t\t\t\t\tif (isHome) {
\t\t\t\t\t\t\t\t\treturn
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\tevent.preventDefault()
\t\t\t\t\t\t\t\tsetMenuState({ tabId: tab.id, x: event.clientX, y: event.clientY })
\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\tclassName={`group flex items-center gap-1 rounded-2xl border px-3 py-2 text-sm transition ${isActive ? 'border-primary/30 bg-primary/10 text-foreground shadow-sm' : 'border-border/60 bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}
\t\t\t\t\t\t>
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\ttype='button'
\t\t\t\t\t\t\t\tonClick={() => (isHome ? onActivateHome() : onSelectTab(tab.id))}
\t\t\t\t\t\t\t\tclassName='flex items-center gap-2'
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t{isHome ? <Home className='h-3.5 w-3.5' /> : null}
\t\t\t\t\t\t\t\t<span className='max-w-44 truncate'>{tab.label}</span>
\t\t\t\t\t\t\t</button>

\t\t\t\t\t\t\t{!isHome ? (
\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\ttype='button'
\t\t\t\t\t\t\t\t\tonMouseDown={e => {
\t\t\t\t\t\t\t\t\t\te.preventDefault()
\t\t\t\t\t\t\t\t\t\te.stopPropagation()
\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\tonClick={e => {
\t\t\t\t\t\t\t\t\t\te.stopPropagation()
\t\t\t\t\t\t\t\t\t\tonCloseTab(tab.id)
\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\tclassName='rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground'
\t\t\t\t\t\t\t\t\taria-label={`Close ${tab.label}`}
\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t<X className='h-3.5 w-3.5' />
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t) : null}
\t\t\t\t\t\t</div>
\t\t\t\t\t)
\t\t\t\t})}
\t\t\t</div>

\t\t\t<Button
\t\t\t\ttype='button'
\t\t\t\tvariant='ghost'
\t\t\t\tsize='icon'
\t\t\t\tclassName='h-9 w-9 flex-shrink-0 rounded-2xl'
\t\t\t\tonClick={onAddTab}
\t\t\t>
\t\t\t\t<Plus className='h-4 w-4' />
\t\t\t</Button>

\t\t\t<TabContextMenu
\t\t\t\topen={Boolean(menuState)}
\t\t\t\tx={menuState?.x || 0}
\t\t\t\ty={menuState?.y || 0}
\t\t\t\tonClose={() => setMenuState(null)}
\t\t\t\tonCloseTab={() => {
\t\t\t\t\tif (menuState) {
\t\t\t\t\t\tonCloseTab(menuState.tabId)
\t\t\t\t\t}
\t\t\t\t}}
\t\t\t/>
\t\t</div>
\t)
}
"""

# ─────────────────────────────────────────────
# 2. TabContextMenu.tsx — remove "Open in New Pane"
# ─────────────────────────────────────────────
TAB_CONTEXT_MENU = """\
import { X } from 'lucide-react'

type TabContextMenuProps = {
\topen: boolean
\tx: number
\ty: number
\tonClose: () => void
\tonCloseTab: () => void
}

export default function TabContextMenu({ open, x, y, onClose, onCloseTab }: TabContextMenuProps) {
\tif (!open) {
\t\treturn null
\t}

\treturn (
\t\t<>
\t\t\t<button
\t\t\t\ttype='button'
\t\t\t\tclassName='fixed inset-0 z-[75] cursor-default'
\t\t\t\tonClick={onClose}
\t\t\t\taria-label='Close tab menu'
\t\t\t/>
\t\t\t<div
\t\t\t\tclassName='fixed z-[76] min-w-40 rounded-2xl border border-border/70 bg-popover p-1.5 shadow-2xl'
\t\t\t\tstyle={{ left: x, top: y }}
\t\t\t>
\t\t\t\t<button
\t\t\t\t\ttype='button'
\t\t\t\t\tonClick={() => {
\t\t\t\t\t\tonCloseTab()
\t\t\t\t\t\tonClose()
\t\t\t\t\t}}
\t\t\t\t\tclassName='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted'
\t\t\t\t>
\t\t\t\t\t<X className='h-4 w-4' />
\t\t\t\t\tClose Tab
\t\t\t\t</button>
\t\t\t</div>
\t\t</>
\t)
}
"""

# ─────────────────────────────────────────────
# 3. AppContent.tsx — targeted patches
# ─────────────────────────────────────────────
APPCONTENT_PATCHES = [
    # 3a. Remove useLayout and PaneDropZone imports
    (
        "import { useLayout } from '../../contexts/LayoutContext'\n"
        "import MobileNav from './MobileNav'\n"
        "import AppTabStrip from './view/AppTabStrip'\n"
        "import PaneDropZone from './view/PaneDropZone'",
        "import MobileNav from './MobileNav'\n"
        "import AppTabStrip from './view/AppTabStrip'"
    ),

    # 3b. Remove draggedShellTabId state
    (
        "\tconst [draggedShellTabId, setDraggedShellTabId] = useState<string | null>(null)\n",
        ""
    ),

    # 3c. Remove useLayout destructuring
    (
        "\tconst { layoutMode, panes, setLayoutMode, setPaneContentTab, assignSessionToPane, clearPane } = useLayout()\n",
        ""
    ),

    # 3d. Replace secondaryPane vars + old showShellChrome with new split vars
    (
        "\tconst secondaryPane = panes.find(pane => pane.paneId === 'secondary')\n"
        "\tconst secondaryPaneContext = secondaryPane?.sessionId ? resolveSessionContext(secondaryPane.sessionId) : null\n"
        "\tconst secondaryActiveTab = secondaryPane?.activeContentTab || 'chat'\n"
        "\t// Show shell chrome (tab strip + pane layout) only when actively in a session or empty-new-session state.\n"
        "\t// The landing page never shows the chrome — including when a project is selected but no session is open.\n"
        "\tconst showShellChrome = Boolean(sessionId || selectedSession || rootViewMode === 'empty')",
        "\t// Tab strip only visible when inside an active session.\n"
        "\tconst showTabStrip = Boolean(sessionId || selectedSession)\n"
        "\t// Sidebar visible when in a session OR in new-session creation mode (project selected, no session yet).\n"
        "\tconst showDesktopSidebar = Boolean(sessionId || selectedSession || rootViewMode === 'empty')"
    ),

    # 3e. Remove setPaneContentTab useEffect
    (
        "\tuseEffect(() => {\n"
        "\t\tsetPaneContentTab('primary', activeTab)\n"
        "\t}, [activeTab, setPaneContentTab])\n\n",
        ""
    ),

    # 3f. Remove assignSessionToPane useEffect
    (
        "\tuseEffect(() => {\n"
        "\t\tif (!selectedSession) {\n"
        "\t\t\tassignSessionToPane('primary', { sessionId: null, projectName: null, tabId: null })\n"
        "\t\t\treturn\n"
        "\t\t}\n\n"
        "\t\tassignSessionToPane('primary', {\n"
        "\t\t\tsessionId: selectedSession.id,\n"
        "\t\t\tprojectName: selectedProject?.name || selectedSession.__projectName || null,\n"
        "\t\t\ttabId: activeShellTabId,\n"
        "\t\t\tactiveContentTab: activeTab,\n"
        "\t\t})\n"
        "\t}, [activeShellTabId, activeTab, assignSessionToPane, selectedProject?.name, selectedSession])\n\n",
        ""
    ),

    # 3g. Desktop sidebar: showShellChrome → showDesktopSidebar
    (
        "\t\t\t{!isMobile && showShellChrome ? (",
        "\t\t\t{!isMobile && showDesktopSidebar ? ("
    ),

    # 3h. AppTabStrip wrapper: showShellChrome → showTabStrip
    (
        "\t\t\t{showShellChrome ? (\n"
        "\t\t\t\t<AppTabStrip",
        "\t\t\t{showTabStrip ? (\n"
        "\t\t\t\t<AppTabStrip"
    ),

    # 3i. Simplify onCloseTab (remove clearPane) and remove layout/drag props from AppTabStrip
    (
        "\t\t\t\t\tonCloseTab={tabId => {\n"
        "\t\t\t\t\t\tconst closingTab = shellTabs.find(tab => tab.id === tabId)\n"
        "\t\t\t\t\t\tif (closingTab?.sessionId === secondaryPane?.sessionId) {\n"
        "\t\t\t\t\t\t\tclearPane('secondary')\n"
        "\t\t\t\t\t\t}\n"
        "\t\t\t\t\t\tcloseShellTab(tabId)\n"
        "\t\t\t\t\t}}\n"
        "\t\t\t\t\tonActivateHome={activateHomeTab}\n"
        "\t\t\t\t\tonAddTab={() => {\n"
        "\t\t\t\t\t\tif (selectedProject) {\n"
        "\t\t\t\t\t\t\tsetRootViewMode('empty')\n"
        "\t\t\t\t\t\t\thandleNewSession(selectedProject)\n"
        "\t\t\t\t\t\t\treturn\n"
        "\t\t\t\t\t\t}\n\n"
        "\t\t\t\t\t\tsetRootViewMode('landing')\n"
        "\t\t\t\t\t\tnavigate('/')\n"
        "\t\t\t\t\t}}\n"
        "\t\t\t\t\tonLayoutModeChange={mode => {\n"
        "\t\t\t\t\t\tsetLayoutMode(mode)\n"
        "\t\t\t\t\t\tif (mode === 'single') {\n"
        "\t\t\t\t\t\t\tclearPane('secondary')\n"
        "\t\t\t\t\t\t}\n"
        "\t\t\t\t\t}}\n"
        "\t\t\t\t\tonOpenInNewPane={tabId => {\n"
        "\t\t\t\t\t\tconst tab = shellTabs.find(entry => entry.id === tabId)\n"
        "\t\t\t\t\t\tif (!tab?.sessionId) {\n"
        "\t\t\t\t\t\t\treturn\n"
        "\t\t\t\t\t\t}\n\n"
        "\t\t\t\t\t\tsetLayoutMode('dual')\n"
        "\t\t\t\t\t\tassignSessionToPane('secondary', {\n"
        "\t\t\t\t\t\t\tsessionId: tab.sessionId,\n"
        "\t\t\t\t\t\t\tprojectName: tab.projectName,\n"
        "\t\t\t\t\t\t\ttabId: tab.id,\n"
        "\t\t\t\t\t\t})\n"
        "\t\t\t\t\t}}\n"
        "\t\t\t\t\tonDragTabStart={setDraggedShellTabId}\n"
        "\t\t\t\t\tonDragTabEnd={() => setDraggedShellTabId(null)}",
        "\t\t\t\t\tonCloseTab={closeShellTab}\n"
        "\t\t\t\t\tonActivateHome={activateHomeTab}\n"
        "\t\t\t\t\tonAddTab={() => {\n"
        "\t\t\t\t\t\tif (selectedProject) {\n"
        "\t\t\t\t\t\t\tsetRootViewMode('empty')\n"
        "\t\t\t\t\t\t\tnavigate('/')\n"
        "\t\t\t\t\t\t\treturn\n"
        "\t\t\t\t\t\t}\n"
        "\t\t\t\t\t\tsetRootViewMode('landing')\n"
        "\t\t\t\t\t\tnavigate('/')\n"
        "\t\t\t\t\t}}"
    ),

    # 3j. Remove layoutMode prop from AppTabStrip
    (
        "\t\t\t\t\tlayoutMode={layoutMode}\n"
        "\t\t\t\t\tonSelectTab={selectShellTab}",
        "\t\t\t\t\tonSelectTab={selectShellTab}"
    ),

    # 3k. Fix grid div — remove layoutMode conditional
    (
        "\t\t\t\t<div\n"
        "\t\t\t\t\tclassName={`grid min-h-0 flex-1 overflow-hidden ${layoutMode === 'dual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}\n"
        "\t\t\t\t>",
        "\t\t\t\t<div className='flex min-h-0 flex-1 overflow-hidden'>"
    ),

    # 3l. Remove second MainContent (dual pane) block
    (
        "\n\t\t\t\t\t{layoutMode === 'dual' ? (\n"
        "\t\t\t\t\t\t<MainContent\n"
        "\t\t\t\t\t\t\tprojects={projects}\n"
        "\t\t\t\t\t\t\tselectedProject={secondaryPaneContext?.project || null}\n"
        "\t\t\t\t\t\t\tselectedSession={secondaryPaneContext?.session || null}\n"
        "\t\t\t\t\t\t\tactiveTab={secondaryActiveTab}\n"
        "\t\t\t\t\t\t\tsetActiveTab={value => {\n"
        "\t\t\t\t\t\t\t\tconst nextTab = typeof value === 'function' ? value(secondaryActiveTab) : value\n"
        "\t\t\t\t\t\t\t\tsetPaneContentTab('secondary', nextTab)\n"
        "\t\t\t\t\t\t\t}}\n"
        "\t\t\t\t\t\t\tws={ws}\n"
        "\t\t\t\t\t\t\tsendMessage={sendMessage}\n"
        "\t\t\t\t\t\t\tlatestMessage={latestMessage}\n"
        "\t\t\t\t\t\t\tisMobile={isMobile}\n"
        "\t\t\t\t\t\t\tonMenuClick={() => setSidebarOpen(true)}\n"
        "\t\t\t\t\t\t\tisLoading={isLoadingProjects}\n"
        "\t\t\t\t\t\t\tonInputFocusChange={setIsInputFocused}\n"
        "\t\t\t\t\t\t\tonSessionActive={markSessionAsActive}\n"
        "\t\t\t\t\t\t\tonSessionInactive={markSessionAsInactive}\n"
        "\t\t\t\t\t\t\tonSessionProcessing={markSessionAsProcessing}\n"
        "\t\t\t\t\t\t\tonSessionNotProcessing={markSessionAsNotProcessing}\n"
        "\t\t\t\t\t\t\tprocessingSessions={processingSessions}\n"
        "\t\t\t\t\t\t\tonReplaceTemporarySession={replaceTemporarySession}\n"
        "\t\t\t\t\t\t\tonNavigateToSession={(targetSessionId: string) => navigate(`/session/${targetSessionId}`)}\n"
        "\t\t\t\t\t\t\tonShowSettings={() => setShowSettings(true)}\n"
        "\t\t\t\t\t\t\texternalMessageUpdate={externalMessageUpdate}\n"
        "\t\t\t\t\t\t\tshowLandingPage={false}\n"
        "\t\t\t\t\t\t\tforceEmptyState={false}\n"
        "\t\t\t\t\t\t\tlandingPageData={landingPageData}\n"
        "\t\t\t\t\t\t\tonLandingFiltersChange={{\n"
        "\t\t\t\t\t\t\t\tonSearchChange: setLandingSearch,\n"
        "\t\t\t\t\t\t\t\tonProjectChange: setLandingProjectFilter,\n"
        "\t\t\t\t\t\t\t\tonWorkspaceChange: setLandingWorkspaceFilter,\n"
        "\t\t\t\t\t\t\t\tonSessionTypeChange: setLandingSessionTypeFilter,\n"
        "\t\t\t\t\t\t\t}}\n"
        "\t\t\t\t\t\t\tonLandingActions={{\n"
        "\t\t\t\t\t\t\t\tonOpenWorkspace: () => undefined,\n"
        "\t\t\t\t\t\t\t\tonOpenSession: () => undefined,\n"
        "\t\t\t\t\t\t\t\tonToggleWorkspaceFavorite: () => undefined,\n"
        "\t\t\t\t\t\t\t\tonToggleSessionFavorite: () => undefined,\n"
        "\t\t\t\t\t\t\t\tonCreateSession: () => undefined,\n"
        "\t\t\t\t\t\t\t\tonCreateWorkspace: () => undefined,\n"
        "\t\t\t\t\t\t\t}}\n"
        "\t\t\t\t\t\t/>\n"
        "\t\t\t\t\t) : null}",
        ""
    ),

    # 3m. Remove PaneDropZone
    (
        "\n\t\t\t<PaneDropZone\n"
        "\t\t\t\topen={Boolean(draggedShellTabId) && !isMobile}\n"
        "\t\t\t\tonDropToPane={paneId => {\n"
        "\t\t\t\t\tif (!draggedShellTabId) {\n"
        "\t\t\t\t\t\treturn\n"
        "\t\t\t\t\t}\n\n"
        "\t\t\t\t\tconst draggedTab = shellTabs.find(tab => tab.id === draggedShellTabId)\n"
        "\t\t\t\t\tif (!draggedTab?.sessionId) {\n"
        "\t\t\t\t\t\tsetDraggedShellTabId(null)\n"
        "\t\t\t\t\t\treturn\n"
        "\t\t\t\t\t}\n\n"
        "\t\t\t\t\tconst context = resolveSessionContext(draggedTab.sessionId)\n"
        "\t\t\t\t\tif (!context) {\n"
        "\t\t\t\t\t\tsetDraggedShellTabId(null)\n"
        "\t\t\t\t\t\treturn\n"
        "\t\t\t\t\t}\n\n"
        "\t\t\t\t\tif (paneId === 'primary') {\n"
        "\t\t\t\t\t\tnavigate(`/session/${draggedTab.sessionId}`)\n"
        "\t\t\t\t\t} else {\n"
        "\t\t\t\t\t\tsetLayoutMode('dual')\n"
        "\t\t\t\t\t\tassignSessionToPane('secondary', {\n"
        "\t\t\t\t\t\t\tsessionId: draggedTab.sessionId,\n"
        "\t\t\t\t\t\t\tprojectName: context.project.name,\n"
        "\t\t\t\t\t\t\ttabId: draggedTab.id,",
        ""
    ),
]

print("=== Patching AppTabStrip.tsx ===")
write_file('src/components/app/view/AppTabStrip.tsx', APP_TAB_STRIP)

print("\n=== Patching TabContextMenu.tsx ===")
write_file('src/components/app/view/TabContextMenu.tsx', TAB_CONTEXT_MENU)

print("\n=== Patching AppContent.tsx ===")
ok = patch_file('src/components/app/AppContent.tsx', APPCONTENT_PATCHES)

if ok:
    print("\n✓ All patches applied successfully.")
else:
    print("\n✗ Some patches missed — check output above.")
    sys.exit(1)
