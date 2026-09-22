"use client";

import { useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteCategory } from "@/lib/actions/categories";
import type { CategoryWithUsage } from "@/components/budget/CategoryRow";

export function CategoryDeleteDialog({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryWithUsage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Supprimer « ${category.name} » ?`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm">Cette catégorie est utilisée. La supprimer effacera définitivement :</p>
        <ul className="text-muted list-disc pl-5 text-sm">
          {category.expenseCount > 0 && (
            <li>
              {category.expenseCount} dépense{category.expenseCount > 1 ? "s" : ""}
            </li>
          )}
          {category.wishlistCount > 0 && (
            <li>
              {category.wishlistCount} souhait{category.wishlistCount > 1 ? "s" : ""}
            </li>
          )}
        </ul>
        <p className="text-sm font-medium text-red-400">Cette action est irréversible.</p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteCategory(category.id, { cascade: true });
                onOpenChange(false);
              });
            }}
          >
            {isPending ? "Suppression…" : "Tout supprimer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
