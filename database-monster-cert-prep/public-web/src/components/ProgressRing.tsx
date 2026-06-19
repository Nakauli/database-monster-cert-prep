import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  label,
  size = 148,
  stroke = 12,
  className,
}: {
  value: number;
  label?: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
        />
      </svg>
      <div className="absolute text-center">
        <strong className="block text-4xl font-semibold tracking-[-0.05em] text-ink">{Math.round(clamped)}%</strong>
        {label && <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
