import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CycleNavigator({
  offset,
  label,
  rangeLabel,
}: {
  offset: number;
  label: string;
  rangeLabel: string;
}) {
  const prevHref = offset - 1 === 0 ? "/budget" : `/budget?cycle=${offset - 1}`;
  const nextHref = offset + 1 === 0 ? "/budget" : `/budget?cycle=${offset + 1}`;

  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          aria-label="Mois précédent"
          className="text-muted rounded-full p-1.5 hover:bg-white/10"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold capitalize">{label}</p>
          <p className="text-muted text-xs">{rangeLabel}</p>
        </div>
        <Link
          href={nextHref}
          aria-label="Mois suivant"
          className="text-muted rounded-full p-1.5 hover:bg-white/10"
        >
          <ChevronRight size={18} />
        </Link>
      </div>
      {offset !== 0 && (
        <Link href="/budget" className="glass-pill rounded-2xl! px-3 py-1.5 text-xs font-medium">
          Aujourd&apos;hui
        </Link>
      )}
    </div>
  );
}
