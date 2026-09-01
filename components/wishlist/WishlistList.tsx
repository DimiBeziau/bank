"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { WishlistModal } from "@/components/wishlist/WishlistModal";
import { WishlistRow } from "@/components/wishlist/WishlistRow";
import type { CategoryDTO, WishlistItemDTO } from "@/lib/types";

export function WishlistList({
  items,
  categories,
}: {
  items: WishlistItemDTO[];
  categories: CategoryDTO[];
}) {
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Items</h2>
        <WishlistModal
          categories={categories}
          trigger={
            <Button className="gap-1">
              <Plus size={16} />
              Ajouter
            </Button>
          }
        />
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {items.length === 0 && (
          <p className="text-muted py-6 text-center text-sm">Votre wishlist est vide.</p>
        )}
        {items.map((item) => (
          <WishlistRow key={item.id} item={item} category={categoryById.get(item.categoryId)} categories={categories} />
        ))}
      </div>
    </GlassCard>
  );
}
