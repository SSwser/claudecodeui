type TokenUsagePieProps = {
  used: number;
  total: number;
};

export default function TokenUsagePie({ used, total }: TokenUsagePieProps) {
  // Token usage visualization component
  // Only bail out on missing values or non‐positive totals; allow used===0 to render 0%
  if (used == null || total == null || total <= 0) return null;

  const percentage = Math.min(100, (used / total) * 100);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const toneClass =
    percentage < 50 ? 'text-brand' : percentage < 75 ? 'text-warning' : 'text-destructive';

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${toneClass}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90 transform">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={toneClass}
        />
      </svg>
      <span
        className={toneClass}
        title={`${used.toLocaleString()} / ${total.toLocaleString()} tokens`}
      >
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}
