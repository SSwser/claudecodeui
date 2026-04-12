import { Badge } from '../../../../shared/view/ui';
import { useTranslation } from 'react-i18next';

type WorkspaceIndicatorProps = {
  workspaceName: string;
};

export default function WorkspaceIndicator({ workspaceName }: WorkspaceIndicatorProps) {
  const { t } = useTranslation('sidebar');

  return (
    <div className="border-t border-sidebar-border/70 px-3 py-3">
      <Badge
        variant="secondary"
        className="w-full justify-center rounded-full bg-sidebar-accent px-3 py-1.5 text-xs font-medium text-muted-foreground"
      >
        {t('workspaceIndicator.currentWorkspace')}: {workspaceName}
      </Badge>
    </div>
  );
}