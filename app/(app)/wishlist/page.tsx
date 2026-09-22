import { getWishlistItems } from "@/lib/actions/wishlist";
import { getCategories } from "@/lib/actions/categories";
import { GlassCard } from "@/components/ui/GlassCard";
import { WishlistList } from "@/components/wishlist/WishlistList";
import { formatCurrency } from "@/lib/format";
import type { CategoryDTO, WishlistItemDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const [items, categories] = await Promise.all([getWishlistItems(), getCategories()]);

  const totalEngaged = items.filter((i) => i.isPurchased).reduce((sum, i) => sum + i.budget, 0);
  const totalPlanned = items.reduce((sum, i) => sum + i.budget, 0);

  const itemDTOs: WishlistItemDTO[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    categoryId: i.categoryId,
    budget: i.budget,
    isPurchased: i.isPurchased,
    purchasedAt: i.purchasedAt ? i.purchasedAt.toISOString() : null,
  }));
  const categoryDTOs: CategoryDTO[] = categories;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Wishlist</h1>
        <p className="text-muted text-sm">Envies et achats à venir, déductibles du budget du mois.</p>
      </div>

      <GlassCard className="flex flex-col gap-4 sm:flex-row sm:justify-around sm:text-center">
        <div>
          <p className="text-muted text-xs">Engagé ce mois-ci</p>
          <p className="big-number text-3xl">{formatCurrency(totalEngaged)}</p>
        </div>
        <div>
          <p className="text-muted text-xs">Total planifié</p>
          <p className="big-number text-3xl">{formatCurrency(totalPlanned)}</p>
        </div>
      </GlassCard>

      <WishlistList items={itemDTOs} categories={categoryDTOs} />
    </div>
  );
}
