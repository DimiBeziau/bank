import { GlassCard } from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/format";

export interface PurchasedWishlistItem {
  id: string;
  name: string;
  budget: number;
  categoryColor: string | undefined;
  categoryName: string | undefined;
}

export function WishlistPurchasedList({ items }: { items: PurchasedWishlistItem[] }) {
  if (items.length === 0) return null;

  return (
    <GlassCard className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Achats wishlist ce cycle</h2>
      <div className="flex flex-col divide-y divide-white/5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-1 py-3">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.categoryColor ?? "#999" }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-muted truncate text-xs">{item.categoryName ?? "Sans catégorie"}</p>
            </div>
            <span className="big-number shrink-0 text-sm">{formatCurrency(item.budget)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
