"""Fix remaining 3 misses in AppContent.tsx"""
import os, re

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(BASE, 'src', 'components', 'app', 'AppContent.tsx')

with open(path, 'rb') as f:
    raw = f.read()

use_crlf = b'\r\n' in raw
content = raw.decode('utf-8').replace('\r\n', '\n')

orig_len = len(content)

# Debug: find the showShellChrome line
idx = content.find('showShellChrome ? (')
if idx >= 0:
    print(f"Found 'showShellChrome ? (' at byte offset {idx}")
    snippet = content[idx-20:idx+80]
    print(f"Context: {repr(snippet)}")
else:
    print("'showShellChrome ? (' NOT FOUND in normalized content")

# Use regex replacement since the earlier script may have changed something subtle
# Fix 1: showShellChrome ? ( → showTabStrip ? (
content, n = re.subn(
    r'\{showShellChrome \? \(',
    '{showTabStrip ? (',
    content
)
print(f"  Fix 1 (showShellChrome→showTabStrip): {n} replacements")

# Fix 2: replace the entire AppTabStrip props block (layoutMode + complex onCloseTab + all old props)
old_block = (
    '\t\t\t\t\ttabs={shellTabs}\n'
    '\t\t\t\t\tactiveTabId={activeShellTabId}\n'
    '\t\t\t\t\tlayoutMode={layoutMode}\n'
    '\t\t\t\t\tonSelectTab={selectShellTab}\n'
    '\t\t\t\t\tonCloseTab={tabId => {\n'
    '\t\t\t\t\t\tconst closingTab = shellTabs.find(tab => tab.id === tabId)\n'
    '\t\t\t\t\t\tif (closingTab?.sessionId === secondaryPane?.sessionId) {\n'
    '\t\t\t\t\t\t\tclearPane(\'secondary\')\n'
    '\t\t\t\t\t\t}\n'
    '\t\t\t\t\t\tcloseShellTab(tabId)\n'
    '\t\t\t\t\t}}\n'
    '\t\t\t\t\tonActivateHome={activateHomeTab}\n'
    '\t\t\t\t\tonAddTab={() => {\n'
    '\t\t\t\t\t\tif (selectedProject) {\n'
    '\t\t\t\t\t\t\tsetRootViewMode(\'empty\')\n'
    '\t\t\t\t\t\t\thandleNewSession(selectedProject)\n'
    '\t\t\t\t\t\t\treturn\n'
    '\t\t\t\t\t\t}\n'
    '\n'
    '\t\t\t\t\t\tsetRootViewMode(\'landing\')\n'
    '\t\t\t\t\t\tnavigate(\'/\')\n'
    '\t\t\t\t\t}}\n'
    '\t\t\t\t\tonLayoutModeChange={mode => {\n'
    '\t\t\t\t\t\tsetLayoutMode(mode)\n'
    '\t\t\t\t\t\tif (mode === \'single\') {\n'
    '\t\t\t\t\t\t\tclearPane(\'secondary\')\n'
    '\t\t\t\t\t\t}\n'
    '\t\t\t\t\t}}\n'
    '\t\t\t\t\tonOpenInNewPane={tabId => {\n'
    '\t\t\t\t\t\tconst tab = shellTabs.find(entry => entry.id === tabId)\n'
    '\t\t\t\t\t\tif (!tab?.sessionId) {\n'
    '\t\t\t\t\t\t\treturn\n'
    '\t\t\t\t\t\t}\n'
    '\n'
    '\t\t\t\t\t\tsetLayoutMode(\'dual\')\n'
    '\t\t\t\t\t\tassignSessionToPane(\'secondary\', {\n'
    '\t\t\t\t\t\t\tsessionId: tab.sessionId,\n'
    '\t\t\t\t\t\t\tprojectName: tab.projectName,\n'
    '\t\t\t\t\t\t\ttabId: tab.id,\n'
    '\t\t\t\t\t\t})\n'
    '\t\t\t\t\t}}\n'
    '\t\t\t\t\tonDragTabStart={setDraggedShellTabId}\n'
    '\t\t\t\t\tonDragTabEnd={() => setDraggedShellTabId(null)}'
)
new_block = (
    '\t\t\t\t\ttabs={shellTabs}\n'
    '\t\t\t\t\tactiveTabId={activeShellTabId}\n'
    '\t\t\t\t\tonSelectTab={selectShellTab}\n'
    '\t\t\t\t\tonCloseTab={closeShellTab}\n'
    '\t\t\t\t\tonActivateHome={activateHomeTab}\n'
    '\t\t\t\t\tonAddTab={() => {\n'
    '\t\t\t\t\t\tif (selectedProject) {\n'
    '\t\t\t\t\t\t\tsetRootViewMode(\'empty\')\n'
    '\t\t\t\t\t\t\tnavigate(\'/\')\n'
    '\t\t\t\t\t\t\treturn\n'
    '\t\t\t\t\t\t}\n'
    '\t\t\t\t\t\tsetRootViewMode(\'landing\')\n'
    '\t\t\t\t\t\tnavigate(\'/\')\n'
    '\t\t\t\t\t}}'
)
if old_block in content:
    content = content.replace(old_block, new_block, 1)
    print("  Fix 2 (AppTabStrip props): applied")
else:
    print("  Fix 2 MISS — trying shorter version")
    # Shorter fallback: just replace the tabs/props section differently
    # Find and print what's actually there
    apos = content.find('\t\t\t\t\ttabs={shellTabs}')
    if apos >= 0:
        print(f"  Found tabs prop block at {apos}, content: {repr(content[apos:apos+300])}")

if use_crlf:
    out = content.replace('\n', '\r\n').encode('utf-8')
else:
    out = content.encode('utf-8')

with open(path, 'wb') as f:
    f.write(out)
print(f"Written back ({len(out)} bytes, orig {orig_len} chars)")
