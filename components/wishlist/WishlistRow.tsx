"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { WishlistModal } from "@/components/wishlist/WishlistModal";
import { toggleWishlistPurchased, deleteWishlistItem } from "@/lib/actions/wishlist";
import { formatCurrency } from "@/lib/format";
import type { CategoryDTO, WishlistItemDTO } from "@/lib/types";

export function WishlistRow({
  item,
  category,
  categories,
}: {
  item: WishlistItemDTO;
  category: CategoryDTO | undefined;
  categories: CategoryDTO[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/5">
      <Checkbox
        checked={item.isPurchased}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await toggleWishlistPurchased(item.id, checked);
          });
        }}
      />

      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category?.color ?? "#999" }} />

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${item.isPurchased ? "line-through opacity-60" : ""}`}>
          {item.name}
        </p>
        <p className="text-muted truncate text-xs">{category?.name ?? "Sans catégorie"}</p>
      </div>

      <span className="big-number shrink-0 text-sm">{formatCurrency(item.budget)}</span>

      <WishlistModal
        categories={categories}
        item={item}
        trigger={
          <button className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10" aria-label="Modifier">
            <Pencil size={15} />
          </button>
        }
      />

      <button
        className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10"
        aria-label="Supprimer"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteWishlistItem(item.id);
          });
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
