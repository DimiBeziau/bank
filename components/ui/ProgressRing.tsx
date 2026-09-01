interface ProgressRingProps {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  value: string;
}

export function ProgressRing({
  percent,
  color,
  size = 160,
  strokeWidth = 14,
  label,
  value,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="big-number text-3xl">{value}</span>
        <span className="text-muted text-xs">{label}</span>
      </div>
    </div>
  );
}
