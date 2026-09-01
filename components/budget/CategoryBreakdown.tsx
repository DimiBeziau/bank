import { GlassCard } from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/format";

export interface CategoryTotal {
  id: string;
  name: string;
  color: string;
  amount: number;
}

export function CategoryBreakdown({ totals }: { totals: CategoryTotal[] }) {
  const max = Math.max(1, ...totals.map((t) => t.amount));
  const nonEmpty = totals.filter((t) => t.amount > 0);

  return (
    <GlassCard>
      <h2 className="mb-4 text-lg font-bold">Répartition par catégorie</h2>
      {nonEmpty.length === 0 && (
        <p className="text-muted text-sm">Aucune dépense prise en compte ce cycle-ci.</p>
      )}
      <div className="flex flex-col gap-3">
        {nonEmpty.map((t) => (
          <div key={t.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{t.name}</span>
              <span className="text-muted">{formatCurrency(t.amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${(t.amount / max) * 100}%`, backgroundColor: t.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
