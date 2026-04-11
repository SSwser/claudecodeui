import type { ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';

type AuthScreenLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  logo?: ReactNode;
};

export default function AuthScreenLayout({
  title,
  description,
  children,
  footerText,
  logo,
}: AuthScreenLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,99,99,0.08),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(85,179,255,0.08),_transparent_18%)] p-4">
      <div className="w-full max-w-md">
        <div className="space-y-6 rounded-large border border-border/70 bg-card p-8 shadow-ring">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              {logo ?? (
                <div className="flex h-16 w-16 items-center justify-center rounded-large border border-border/60 bg-surface-2 shadow-button">
                  <MessageSquare className="h-8 w-8 text-brand" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-display text-foreground">{title}</h1>
            <p className="mt-2 tracking-body text-muted-foreground">{description}</p>
          </div>

          {children}

          <div className="text-center">
            <p className="text-sm tracking-body text-muted-foreground">{footerText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
