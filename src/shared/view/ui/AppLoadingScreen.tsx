import { MessageSquare } from 'lucide-react';

type AppLoadingScreenProps = {
  title: string;
  description: string;
  fullScreen?: boolean;
};

const loadingDotAnimationDelays = ['0s', '0.1s', '0.2s'];

export default function AppLoadingScreen({
  title,
  description,
  fullScreen = true,
}: AppLoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen items-center justify-center bg-background p-4'
          : 'flex h-full w-full flex-1 items-center justify-center bg-background p-6'
      }
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-large border border-border/60 bg-surface-2 shadow-button">
            <MessageSquare className="h-8 w-8 text-brand" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-display text-foreground">{title}</h1>

        <div className="mt-4 flex items-center justify-center gap-2">
          {loadingDotAnimationDelays.map((delay) => (
            <div
              key={delay}
              className="h-2 w-2 animate-pulse rounded-full bg-brand"
              style={{ animationDelay: delay }}
            />
          ))}
        </div>

        <p className="mt-4 text-sm tracking-body text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
