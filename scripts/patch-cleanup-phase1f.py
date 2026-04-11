"""
Refine showTabStrip: also visible when in empty-state AND existing session tabs are present.
This way + from within a session keeps the strip visible so users can navigate between tabs.
"""
import os, re

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(BASE, 'src', 'components', 'app', 'AppContent.tsx')

with open(path, 'rb') as f:
    raw = f.read()
use_crlf = b'\r\n' in raw
content = raw.decode('utf-8').replace('\r\n', '\n')

old = (
    "\t// Tab strip only visible when inside an active session.\n"
    "\tconst showTabStrip = Boolean(sessionId || selectedSession)\n"
    "\t// Sidebar visible when in a session OR in new-session creation mode (project selected, no session yet).\n"
    "\tconst showDesktopSidebar = Boolean(sessionId || selectedSession || rootViewMode === 'empty')"
)
new = (
    "\t// Tab strip: show when in a session, OR in new-session mode with existing session tabs\n"
    "\t// (so + from within a session keeps the strip visible for navigation).\n"
    "\tconst hasSessionTabs = shellTabs.some(t => t.kind === 'session')\n"
    "\tconst showTabStrip = Boolean(sessionId || selectedSession || (rootViewMode === 'empty' && hasSessionTabs))\n"
    "\t// Sidebar: visible when in a session OR in new-session creation mode.\n"
    "\tconst showDesktopSidebar = Boolean(sessionId || selectedSession || rootViewMode === 'empty')"
)

if old in content:
    content = content.replace(old, new, 1)
    print("✓ showTabStrip refined")
else:
    print("MISS")

if use_crlf:
    out = content.replace('\n', '\r\n').encode('utf-8')
else:
    out = content.encode('utf-8')
with open(path, 'wb') as f:
    f.write(out)
print(f"Written ({len(out)} bytes)")
