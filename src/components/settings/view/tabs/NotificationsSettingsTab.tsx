import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NotificationPreferencesState } from '../../types/types';
import { Button } from '../../../ui/button';
import SettingsToggle from '../SettingsToggle';

type NotificationsSettingsTabProps = {
  notificationPreferences: NotificationPreferencesState;
  onNotificationPreferencesChange: (value: NotificationPreferencesState) => void;
  pushPermission: NotificationPermission | 'unsupported';
  isPushSubscribed: boolean;
  isPushLoading: boolean;
  onEnablePush: () => void;
  onDisablePush: () => void;
};

export default function NotificationsSettingsTab({
  notificationPreferences,
  onNotificationPreferencesChange,
  pushPermission,
  isPushSubscribed,
  isPushLoading,
  onEnablePush,
  onDisablePush,
}: NotificationsSettingsTabProps) {
  const { t } = useTranslation('settings');

  const pushSupported = pushPermission !== 'unsupported';
  const pushDenied = pushPermission === 'denied';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-brand" />
          <h3 className="text-lg font-medium text-foreground">{t('notifications.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('notifications.description')}</p>
      </div>

      <div className="space-y-4 rounded-large border border-border/70 bg-card p-4 shadow-ring">
        <h4 className="font-medium text-foreground">{t('notifications.webPush.title')}</h4>
        {!pushSupported ? (
          <p className="text-sm text-muted-foreground">{t('notifications.webPush.unsupported')}</p>
        ) : pushDenied ? (
          <p className="text-sm text-muted-foreground">{t('notifications.webPush.denied')}</p>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={isPushLoading}
              onClick={() => {
                if (isPushSubscribed) {
                  onDisablePush();
                } else {
                  onEnablePush();
                }
              }}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                isPushSubscribed
                  ? 'border-destructive/35 bg-destructive/10 text-destructive shadow-subtle hover:opacity-60'
                  : 'border-border/70 bg-card text-foreground shadow-button hover:opacity-60'
              }`}
            >
              {isPushLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPushSubscribed ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <BellRing className="h-4 w-4" />
              )}
              {isPushLoading
                ? t('notifications.webPush.loading')
                : isPushSubscribed
                  ? t('notifications.webPush.disable')
                  : t('notifications.webPush.enable')}
            </Button>
            {isPushSubscribed && (
              <span className="text-sm text-success">{t('notifications.webPush.enabled')}</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-large border border-border/70 bg-card p-4 shadow-ring">
        <h4 className="font-medium text-foreground">{t('notifications.events.title')}</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-2/80 p-3">
            <span className="text-sm text-foreground">
              {t('notifications.events.actionRequired')}
            </span>
            <SettingsToggle
              checked={notificationPreferences.events.actionRequired}
              onChange={(checked) =>
                onNotificationPreferencesChange({
                  ...notificationPreferences,
                  events: {
                    ...notificationPreferences.events,
                    actionRequired: checked,
                  },
                })
              }
              ariaLabel={t('notifications.events.actionRequired')}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-2/80 p-3">
            <span className="text-sm text-foreground">{t('notifications.events.stop')}</span>
            <SettingsToggle
              checked={notificationPreferences.events.stop}
              onChange={(checked) =>
                onNotificationPreferencesChange({
                  ...notificationPreferences,
                  events: {
                    ...notificationPreferences.events,
                    stop: checked,
                  },
                })
              }
              ariaLabel={t('notifications.events.stop')}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-2/80 p-3">
            <span className="text-sm text-foreground">{t('notifications.events.error')}</span>
            <SettingsToggle
              checked={notificationPreferences.events.error}
              onChange={(checked) =>
                onNotificationPreferencesChange({
                  ...notificationPreferences,
                  events: {
                    ...notificationPreferences.events,
                    error: checked,
                  },
                })
              }
              ariaLabel={t('notifications.events.error')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
