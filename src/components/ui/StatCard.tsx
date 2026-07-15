interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  accent?: boolean;
}

export function StatCard({ label, value, trend, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] p-4 ${
        accent ? "bg-[var(--color-navy)] text-white" : "bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          accent ? "text-white/70" : "text-[var(--color-muted)]"
        }`}
      >
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold">{value}</p>
        {trend && (
          <span
            className={`text-xs ${accent ? "text-white/80" : "text-[var(--color-status-done)]"}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
