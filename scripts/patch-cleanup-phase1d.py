"""Remove orphaned PaneDropZone tail code"""
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(BASE, 'src', 'components', 'app', 'AppContent.tsx')

with open(path, 'rb') as f:
    raw = f.read()
use_crlf = b'\r\n' in raw
content = raw.decode('utf-8').replace('\r\n', '\n')

# Remove the orphaned PaneDropZone tail
orphan = (
    '\n\n\t\t\t\t\t\tactiveContentTab: activeTab,\n'
    '\t\t\t\t\t})\n'
    '\t\t\t\t}\n'
    '\n'
    '\t\t\t\t\tsetDraggedShellTabId(null)\n'
    '\t\t\t\t}}\n'
    '\t\t\t/>\n'
)

if orphan in content:
    content = content.replace(orphan, '\n', 1)
    print("✓ Orphaned PaneDropZone tail removed")
else:
    # Try to find what's actually there
    idx = content.find('setDraggedShellTabId(null)')
    if idx >= 0:
        print(f"Found at {idx}: {repr(content[idx-100:idx+80])}")
    else:
        print("Not found")

if use_crlf:
    out = content.replace('\n', '\r\n').encode('utf-8')
else:
    out = content.encode('utf-8')
with open(path, 'wb') as f:
    f.write(out)
print(f"Written ({len(out)} bytes)")
