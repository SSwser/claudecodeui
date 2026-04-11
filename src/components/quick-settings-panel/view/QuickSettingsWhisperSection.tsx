import { useTranslation } from 'react-i18next';
import { TOGGLE_ROW_CLASS, WHISPER_OPTIONS } from '../constants';
import { useWhisperMode } from '../hooks/useWhisperMode';
import QuickSettingsSection from './QuickSettingsSection';

export default function QuickSettingsWhisperSection() {
  const { t } = useTranslation('settings');
  const { setWhisperMode, isOptionSelected } = useWhisperMode();

  return (
    // This section stays hidden intentionally until dictation modes are reintroduced.
    <QuickSettingsSection title={t('quickSettings.sections.whisperDictation')} className="hidden">
      <div className="space-y-2">
        {WHISPER_OPTIONS.map(({ value, icon: Icon, titleKey, descriptionKey }) => (
          <label key={value} className={`${TOGGLE_ROW_CLASS} flex items-start`}>
            <input
              type="radio"
              name="whisperMode"
              value={value}
              checked={isOptionSelected(value)}
              onChange={() => setWhisperMode(value)}
              className="mt-0.5 h-4 w-4 border-border bg-surface-1 text-brand focus:ring-2 focus:ring-ring dark:border-border dark:bg-surface-1"
            />
            <div className="ml-3 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {t(titleKey)}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">{t(descriptionKey)}</p>
            </div>
          </label>
        ))}
      </div>
    </QuickSettingsSection>
  );
}
