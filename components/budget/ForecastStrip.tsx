import { GlassCard } from "@/components/ui/GlassCard";
import { formatCurrency, formatCycleLabel } from "@/lib/format";

export interface ForecastEntry {
  cycleStart: string;
  projectedExpenses: number;
  remaining: number;
}

export function ForecastStrip({ entries }: { entries: ForecastEntry[] }) {
  return (
    <GlassCard>
      <h2 className="mb-4 text-lg font-bold">Prévisions</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {entries.map((entry, i) => (
          <div
            key={entry.cycleStart}
            className="glass-pill min-w-[9.5rem] shrink-0 rounded-2xl! px-4 py-3"
          >
            <p className="text-muted text-xs capitalize">
              {i === 0 ? "Ce cycle" : formatCycleLabel(new Date(entry.cycleStart))}
            </p>
            <p
              className={`big-number text-xl ${entry.remaining < 0 ? "text-red-400" : ""}`}
            >
              {formatCurrency(entry.remaining)}
            </p>
            <p className="text-muted text-xs">
              −{formatCurrency(entry.projectedExpenses)} projeté
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
