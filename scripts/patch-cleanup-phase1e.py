"""Remove orphaned PaneDropZone tail code — with correct indent"""
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(BASE, 'src', 'components', 'app', 'AppContent.tsx')

with open(path, 'rb') as f:
    raw = f.read()
use_crlf = b'\r\n' in raw
content = raw.decode('utf-8').replace('\r\n', '\n')

# The exact orphan from the debug output:
orphan = (
    '\n\t\t\t\t\t\t\tactiveContentTab: activeTab,\n'
    '\t\t\t\t\t\t})\n'
    '\t\t\t\t\t}\n'
    '\n'
    '\t\t\t\t\tsetDraggedShellTabId(null)\n'
    '\t\t\t\t}}\n'
    '\t\t\t/>'
)

if orphan in content:
    content = content.replace(orphan, '', 1)
    print("✓ Orphaned code removed")
else:
    print("MISS — dumping file tail for inspection:")
    print(repr(content[-800:]))

if use_crlf:
    out = content.replace('\n', '\r\n').encode('utf-8')
else:
    out = content.encode('utf-8')
with open(path, 'wb') as f:
    f.write(out)
print(f"Written ({len(out)} bytes)")
