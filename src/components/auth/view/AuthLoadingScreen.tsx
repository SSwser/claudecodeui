import { useTranslation } from 'react-i18next';
import AppLoadingScreen from '../../../shared/view/ui/AppLoadingScreen';

export default function AuthLoadingScreen() {
  const { t } = useTranslation('common');

  return (
    <AppLoadingScreen
      title={t('mainContent.loading')}
      description={t('mainContent.settingUpWorkspace')}
    />
  );
}
