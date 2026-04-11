import { useState, useRef, useEffect } from 'react';
import { Brain, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { thinkingModes } from '../../constants/thinkingModes';

type ThinkingModeSelectorProps = {
  selectedMode: string;
  onModeChange: (modeId: string) => void;
  onClose?: () => void;
  className?: string;
};

function ThinkingModeSelector({
  selectedMode,
  onModeChange,
  onClose,
  className = '',
}: ThinkingModeSelectorProps) {
  const { t } = useTranslation('chat');

  // Mapping from mode ID to translation key
  const modeKeyMap: Record<string, string> = {
    'think-hard': 'thinkHard',
    'think-harder': 'thinkHarder',
  };
  // Create translated modes for display
  const translatedModes = thinkingModes.map((mode) => {
    const modeKey = modeKeyMap[mode.id] || mode.id;
    return {
      ...mode,
      name: t(`thinkingMode.modes.${modeKey}.name`),
      description: t(`thinkingMode.modes.${modeKey}.description`),
      prefix: t(`thinkingMode.modes.${modeKey}.prefix`),
    };
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const currentMode =
    translatedModes.find((mode) => mode.id === selectedMode) || translatedModes[0];
  const IconComponent = currentMode.icon || Brain;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-pill border transition-opacity sm:h-10 sm:w-10 ${
          selectedMode === 'none'
            ? 'border-border/60 bg-surface-2 hover:opacity-60'
            : 'border-brand/35 bg-brand/10 hover:opacity-60'
        }`}
        title={t('thinkingMode.buttonTitle', { mode: currentMode.name })}
      >
        <IconComponent className={`h-5 w-5 ${currentMode.color}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-large border border-border/70 bg-card shadow-ring">
          <div className="border-b border-border/60 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-ui text-foreground">
                {t('thinkingMode.selector.title')}
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="rounded-small p-1 transition-opacity hover:opacity-60"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="mt-1 text-xs tracking-body text-muted-foreground">
              {t('thinkingMode.selector.description')}
            </p>
          </div>

          <div className="py-1">
            {translatedModes.map((mode) => {
              const ModeIcon = mode.icon;
              const isSelected = mode.id === selectedMode;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                    if (onClose) onClose();
                  }}
                  className={`w-full px-4 py-3 text-left transition-opacity hover:opacity-60 ${
                    isSelected ? 'bg-surface-2' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${mode.icon ? mode.color : 'text-muted-foreground'}`}>
                      {ModeIcon ? <ModeIcon className="h-5 w-5" /> : <div className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium tracking-ui ${
                            isSelected ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {mode.name}
                        </span>
                        {isSelected && (
                          <span className="rounded-small border border-brand/25 bg-brand/10 px-2 py-0.5 text-xs text-brand">
                            {t('thinkingMode.selector.active')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs tracking-body text-muted-foreground">
                        {mode.description}
                      </p>
                      {mode.prefix && (
                        <code className="rounded-small mt-1 inline-block border border-border/60 bg-surface-2 px-1.5 py-0.5 text-xs text-foreground">
                          {mode.prefix}
                        </code>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/60 bg-surface-2 p-3">
            <p className="text-xs tracking-body text-muted-foreground">
              <strong>Tip:</strong> {t('thinkingMode.selector.tip')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThinkingModeSelector;
