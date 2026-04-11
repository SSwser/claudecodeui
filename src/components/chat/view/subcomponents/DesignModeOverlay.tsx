import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface ElementInfo {
  tag: string;
  id: string;
  classes: string;
  text: string;
  width: number;
  height: number;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    borderRadius: string;
  };
  rect: DOMRect;
}

interface DesignModeOverlayProps {
  onCapture: (text: string, screenshot: File | null) => void;
  onClose: () => void;
}

export default function DesignModeOverlay({ onCapture, onClose }: DesignModeOverlayProps) {
  const [hoveredInfo, setHoveredInfo] = useState<ElementInfo | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const getElementInfo = useCallback((el: Element): ElementInfo => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const rawText = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);

    return {
      tag: el.tagName.toLowerCase(),
      id: el.id ?? '',
      classes: Array.from(el.classList).slice(0, 8).join(' '),
      text: rawText,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      styles: {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        borderRadius: styles.borderRadius,
      },
      rect,
    };
  }, []);

  const formatCaptureText = useCallback((info: ElementInfo): string => {
    const selector = `${info.tag}${info.id ? '#' + info.id : ''}${info.classes ? '.' + info.classes.replace(/ /g, '.') : ''}`;
    const lines: string[] = [
      '**[Design Mode Capture]**',
      '',
      `**Element:** \`<${selector}>\``,
      `**Size:** ${info.width} × ${info.height}px`,
    ];
    if (info.text) lines.push(`**Text:** "${info.text}"`);
    lines.push('', '**Computed styles:**');
    lines.push(`- color: \`${info.styles.color}\``);
    lines.push(`- background: \`${info.styles.backgroundColor}\``);
    lines.push(`- font-size: \`${info.styles.fontSize}\`, weight: \`${info.styles.fontWeight}\``);
    if (info.styles.borderRadius !== '0px') {
      lines.push(`- border-radius: \`${info.styles.borderRadius}\``);
    }
    lines.push('', 'Please analyze this UI element and suggest improvements.');
    return lines.join('\n');
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const overlay = overlayRef.current;
      if (!overlay || isCapturing) return;

      overlay.style.pointerEvents = 'none';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.pointerEvents = 'auto';

      if (el && el !== document.body && el !== document.documentElement) {
        setHoveredInfo(getElementInfo(el));
      } else {
        setHoveredInfo(null);
      }
    };

    const handleClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const overlay = overlayRef.current;
      if (!overlay || isCapturing) return;

      setIsCapturing(true);

      overlay.style.pointerEvents = 'none';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.pointerEvents = 'auto';

      const info = el && el !== document.body ? getElementInfo(el) : null;
      const text = info ? formatCaptureText(info) : '[Design Mode] Screenshot captured.';

      // Take screenshot — hide overlay first
      let screenshot: File | null = null;
      try {
        overlay.style.display = 'none';
        const canvas = await html2canvas(document.body, {
          scale: 0.75,
          useCORS: true,
          allowTaint: true,
          logging: false,
          ignoreElements: (node) => node === overlay,
        });
        overlay.style.display = '';
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        if (blob) {
          screenshot = new File([blob], 'design-capture.png', { type: 'image/png' });
        }
      } catch {
        if (overlayRef.current) overlayRef.current.style.display = '';
      }

      onCapture(text, screenshot);
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCapturing, getElementInfo, formatCaptureText, onCapture, onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998]"
      style={{ cursor: isCapturing ? 'wait' : 'crosshair', pointerEvents: 'auto' }}
    >
      {/* Top banner */}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] border-b border-brand/20 bg-brand/90 py-1.5 text-center text-xs font-medium text-brand-foreground shadow-sm backdrop-blur-sm">
        {isCapturing ? 'Capturing…' : 'Design Mode — Click any element to capture · Esc to cancel'}
      </div>

      {/* Element highlight box */}
      {hoveredInfo && !isCapturing && (
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            top: hoveredInfo.rect.top - 2,
            left: hoveredInfo.rect.left - 2,
            width: hoveredInfo.rect.width + 4,
            height: hoveredInfo.rect.height + 4,
            border: '2px dashed hsl(var(--brand))',
            borderRadius: 3,
            boxShadow: '0 0 0 2px rgba(59,130,246,0.20)',
            backgroundColor: 'rgba(59,130,246,0.06)',
          }}
        />
      )}

      {/* Tooltip */}
      {hoveredInfo && !isCapturing && (
        <div
          className="pointer-events-none fixed z-[9999] max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-900/95 px-2 py-1 font-mono text-[11px] text-slate-200"
          style={{
            top: Math.min(hoveredInfo.rect.bottom + 6, window.innerHeight - 40),
            left: Math.max(4, Math.min(hoveredInfo.rect.left, window.innerWidth - 268)),
          }}
        >
          {'<'}
          {hoveredInfo.tag}
          {'>'} {hoveredInfo.width}×{hoveredInfo.height}px
          {hoveredInfo.text ? ` · "${hoveredInfo.text.slice(0, 30)}…"` : ''}
        </div>
      )}
    </div>
  );
}
