import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../ui/input';

type WizardStepBasicsProps = {
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
};

export default function WizardStepBasics({ value, error, onChange }: WizardStepBasicsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation('projects');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="project-wizard-name" className="text-sm font-medium text-foreground">
          {t('wizard.basics.label')}
        </label>
        <Input
          ref={inputRef}
          id="project-wizard-name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('wizard.basics.placeholder')}
          maxLength={100}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          {t('wizard.basics.help')}
        </p>
      </div>

      {error ? (
        <div className="rounded-medium border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
