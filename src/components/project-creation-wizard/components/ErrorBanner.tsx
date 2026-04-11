import { AlertCircle } from 'lucide-react';

type ErrorBannerProps = {
  message: string;
};

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-large border border-destructive/25 bg-destructive/10 p-4 text-destructive">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
