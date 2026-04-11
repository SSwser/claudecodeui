type ShellConnectionOverlayProps = {
  mode: 'loading' | 'connect' | 'connecting';
  description: string;
  loadingLabel: string;
  connectLabel: string;
  connectTitle: string;
  connectingLabel: string;
  onConnect: () => void;
};

export default function ShellConnectionOverlay({
  mode,
  description,
  loadingLabel,
  connectLabel,
  connectTitle,
  connectingLabel,
  onConnect,
}: ShellConnectionOverlayProps) {
  if (mode === 'loading') {
    return (
      <div className="bg-background/88 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
        <div className="text-foreground">{loadingLabel}</div>
      </div>
    );
  }

  if (mode === 'connect') {
    return (
      <div className="bg-background/88 absolute inset-0 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm text-center">
          <button
            onClick={onConnect}
            className="flex w-full items-center justify-center space-x-2 rounded-pill border border-brand/25 bg-brand px-6 py-3 text-base font-medium text-brand-foreground shadow-button transition-colors hover:bg-brand/90 sm:w-auto"
            title={connectTitle}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>{connectLabel}</span>
          </button>
          <p className="mt-3 px-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/88 absolute inset-0 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center space-x-3 text-[hsl(var(--warning))]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--warning))] border-t-transparent"></div>
          <span className="text-base font-medium">{connectingLabel}</span>
        </div>
        <p className="mt-3 px-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
