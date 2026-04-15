import { Play, Snowflake } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface FrozenSessionOverlayProps {
  sessionId: string;
  onResume: () => void;
  isResuming?: boolean;
  className?: string;
}

/**
 * Overlay rendered over the chat composer area when a session is frozen.
 * Allows messages to remain readable (does not cover the scroll area)
 * while blocking new input with a Resume CTA.
 */
export default function FrozenSessionOverlay({
  sessionId: _sessionId,
  onResume,
  isResuming = false,
  className,
}: FrozenSessionOverlayProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 border-t border-sky-200 bg-background/80 px-6 py-8 backdrop-blur-sm dark:border-sky-900/40',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40">
          <Snowflake className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">This session is frozen</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Message history is still readable. Resume to continue chatting.
          </p>
        </div>
      </div>
      <Button type="button" onClick={onResume} disabled={isResuming} className="gap-2" size="sm">
        <Play className="h-3.5 w-3.5" />
        {isResuming ? 'Resuming...' : 'Resume Session'}
      </Button>
    </div>
  );
}
