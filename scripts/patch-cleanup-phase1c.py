"""Fix AppTabStrip props block with correct 6-tab indent"""
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(BASE, 'src', 'components', 'app', 'AppContent.tsx')

with open(path, 'rb') as f:
    raw = f.read()
use_crlf = b'\r\n' in raw
content = raw.decode('utf-8').replace('\r\n', '\n')

T = '\t'  # one tab

# The props are at 6 tabs deep inside:
#   return (                              1t
#     <div>                               2t
#       <div>                             3t
#         <div flex-col>                  4t
#           {showTabStrip}                4t
#             <AppTabStrip               5t
#               tabs=...                 6t

old_block = (
    T*6 + 'tabs={shellTabs}\n'
    + T*6 + 'activeTabId={activeShellTabId}\n'
    + T*6 + 'layoutMode={layoutMode}\n'
    + T*6 + 'onSelectTab={selectShellTab}\n'
    + T*6 + 'onCloseTab={tabId => {\n'
    + T*7 + 'const closingTab = shellTabs.find(tab => tab.id === tabId)\n'
    + T*7 + 'if (closingTab?.sessionId === secondaryPane?.sessionId) {\n'
    + T*8 + "clearPane('secondary')\n"
    + T*7 + '}\n'
    + T*7 + 'closeShellTab(tabId)\n'
    + T*6 + '}}\n'
    + T*6 + 'onActivateHome={activateHomeTab}\n'
    + T*6 + 'onAddTab={() => {\n'
    + T*7 + 'if (selectedProject) {\n'
    + T*8 + "setRootViewMode('empty')\n"
    + T*8 + 'handleNewSession(selectedProject)\n'
    + T*8 + 'return\n'
    + T*7 + '}\n'
    + '\n'
    + T*7 + "setRootViewMode('landing')\n"
    + T*7 + "navigate('/')\n"
    + T*6 + '}}\n'
    + T*6 + 'onLayoutModeChange={mode => {\n'
    + T*7 + 'setLayoutMode(mode)\n'
    + T*7 + "if (mode === 'single') {\n"
    + T*8 + "clearPane('secondary')\n"
    + T*7 + '}\n'
    + T*6 + '}}\n'
    + T*6 + 'onOpenInNewPane={tabId => {\n'
    + T*7 + 'const tab = shellTabs.find(entry => entry.id === tabId)\n'
    + T*7 + 'if (!tab?.sessionId) {\n'
    + T*8 + 'return\n'
    + T*7 + '}\n'
    + '\n'
    + T*7 + "setLayoutMode('dual')\n"
    + T*7 + "assignSessionToPane('secondary', {\n"
    + T*8 + 'sessionId: tab.sessionId,\n'
    + T*8 + 'projectName: tab.projectName,\n'
    + T*8 + 'tabId: tab.id,\n'
    + T*7 + '})\n'
    + T*6 + '}}\n'
    + T*6 + 'onDragTabStart={setDraggedShellTabId}\n'
    + T*6 + 'onDragTabEnd={() => setDraggedShellTabId(null)}'
)

new_block = (
    T*6 + 'tabs={shellTabs}\n'
    + T*6 + 'activeTabId={activeShellTabId}\n'
    + T*6 + 'onSelectTab={selectShellTab}\n'
    + T*6 + 'onCloseTab={closeShellTab}\n'
    + T*6 + 'onActivateHome={activateHomeTab}\n'
    + T*6 + 'onAddTab={() => {\n'
    + T*7 + 'if (selectedProject) {\n'
    + T*8 + "setRootViewMode('empty')\n"
    + T*8 + "navigate('/')\n"
    + T*8 + 'return\n'
    + T*7 + '}\n'
    + T*7 + "setRootViewMode('landing')\n"
    + T*7 + "navigate('/')\n"
    + T*6 + '}}'
)

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    print("✓ AppTabStrip props block replaced")
else:
    # Partial: just remove layoutMode line and simplify what we can
    print("full block miss — trying targeted approach")
    # Just remove layoutMode={layoutMode} line
    content = content.replace(
        T*6 + 'layoutMode={layoutMode}\n',
        ''
    )
    print("  removed layoutMode prop line")

    # Replace onCloseTab complex handler with simple one
    old_close = (
        T*6 + 'onCloseTab={tabId => {\n'
        + T*7 + 'const closingTab = shellTabs.find(tab => tab.id === tabId)\n'
        + T*7 + 'if (closingTab?.sessionId === secondaryPane?.sessionId) {\n'
        + T*8 + "clearPane('secondary')\n"
        + T*7 + '}\n'
        + T*7 + 'closeShellTab(tabId)\n'
        + T*6 + '}}'
    )
    new_close = T*6 + 'onCloseTab={closeShellTab}'
    if old_close in content:
        content = content.replace(old_close, new_close, 1)
        print("  replaced onCloseTab")
    else:
        print("  onCloseTab miss")

    # Replace onAddTab handler
    old_add = (
        T*6 + 'onAddTab={() => {\n'
        + T*7 + 'if (selectedProject) {\n'
        + T*8 + "setRootViewMode('empty')\n"
        + T*8 + 'handleNewSession(selectedProject)\n'
        + T*8 + 'return\n'
        + T*7 + '}\n'
        + '\n'
        + T*7 + "setRootViewMode('landing')\n"
        + T*7 + "navigate('/')\n"
        + T*6 + '}}'
    )
    new_add = (
        T*6 + 'onAddTab={() => {\n'
        + T*7 + 'if (selectedProject) {\n'
        + T*8 + "setRootViewMode('empty')\n"
        + T*8 + "navigate('/')\n"
        + T*8 + 'return\n'
        + T*7 + '}\n'
        + T*7 + "setRootViewMode('landing')\n"
        + T*7 + "navigate('/')\n"
        + T*6 + '}}'
    )
    if old_add in content:
        content = content.replace(old_add, new_add, 1)
        print("  replaced onAddTab")
    else:
        print("  onAddTab miss")

    # Remove onLayoutModeChange block
    old_layout = (
        '\n' + T*6 + 'onLayoutModeChange={mode => {\n'
        + T*7 + 'setLayoutMode(mode)\n'
        + T*7 + "if (mode === 'single') {\n"
        + T*8 + "clearPane('secondary')\n"
        + T*7 + '}\n'
        + T*6 + '}}'
    )
    if old_layout in content:
        content = content.replace(old_layout, '', 1)
        print("  removed onLayoutModeChange")
    else:
        print("  onLayoutModeChange miss")

    # Remove onOpenInNewPane block
    old_pane = (
        '\n' + T*6 + 'onOpenInNewPane={tabId => {\n'
        + T*7 + 'const tab = shellTabs.find(entry => entry.id === tabId)\n'
        + T*7 + 'if (!tab?.sessionId) {\n'
        + T*8 + 'return\n'
        + T*7 + '}\n'
        + '\n'
        + T*7 + "setLayoutMode('dual')\n"
        + T*7 + "assignSessionToPane('secondary', {\n"
        + T*8 + 'sessionId: tab.sessionId,\n'
        + T*8 + 'projectName: tab.projectName,\n'
        + T*8 + 'tabId: tab.id,\n'
        + T*7 + '})\n'
        + T*6 + '}}'
    )
    if old_pane in content:
        content = content.replace(old_pane, '', 1)
        print("  removed onOpenInNewPane")
    else:
        print("  onOpenInNewPane miss")

    # Remove onDragTabStart/End
    old_drag = (
        '\n' + T*6 + 'onDragTabStart={setDraggedShellTabId}\n'
        + T*6 + 'onDragTabEnd={() => setDraggedShellTabId(null)}'
    )
    if old_drag in content:
        content = content.replace(old_drag, '', 1)
        print("  removed onDragTabStart/End")
    else:
        print("  onDragTabStart/End miss")

if use_crlf:
    out = content.replace('\n', '\r\n').encode('utf-8')
else:
    out = content.encode('utf-8')

with open(path, 'wb') as f:
    f.write(out)
print(f"Written ({len(out)} bytes)")
