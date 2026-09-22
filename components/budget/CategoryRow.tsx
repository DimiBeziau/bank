"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryModal } from "@/components/budget/CategoryModal";
import { deleteCategory } from "@/lib/actions/categories";

export interface CategoryWithUsage {
  id: string;
  name: string;
  color: string;
  usageCount: number;
}

export function CategoryRow({ category }: { category: CategoryWithUsage }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/5">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{category.name}</p>
          <p className="text-muted truncate text-xs">
            {category.usageCount > 0
              ? `${category.usageCount} élément${category.usageCount > 1 ? "s" : ""} associé${category.usageCount > 1 ? "s" : ""}`
              : "Inutilisée"}
          </p>
        </div>

        <CategoryModal
          category={category}
          trigger={
            <button className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10" aria-label="Modifier">
              <Pencil size={15} />
            </button>
          }
        />

        <button
          className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10 disabled:opacity-40"
          aria-label="Supprimer"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await deleteCategory(category.id);
              } catch {
                setError("Catégorie utilisée : réassignez ses dépenses/souhaits avant de la supprimer.");
              }
            });
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
      {error && <p className="px-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
