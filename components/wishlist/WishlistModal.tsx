"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { createWishlistItem, updateWishlistItem } from "@/lib/actions/wishlist";
import type { CategoryDTO, WishlistItemDTO } from "@/lib/types";

export function WishlistModal({
  categories,
  item,
  trigger,
}: {
  categories: CategoryDTO[];
  item?: WishlistItemDTO;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(item);

  return (
    <Modal open={open} onOpenChange={setOpen} title={isEdit ? "Modifier l'item" : "Nouvel item"} trigger={trigger}>
      <form
        action={(formData) => {
          startTransition(async () => {
            if (item) {
              await updateWishlistItem(item.id, formData);
            } else {
              await createWishlistItem(formData);
            }
            setOpen(false);
          });
        }}
        className="flex flex-col gap-4"
      >
        <Field>
          Nom
          <Input name="name" defaultValue={item?.name} required />
        </Field>
        <div className="flex gap-3">
          <Field className="flex-1">
            Budget prévu (€)
            <Input name="budget" type="number" step="0.01" min="0.01" defaultValue={item?.budget} required />
          </Field>
          <Field className="flex-1">
            Catégorie
            <Select name="categoryId" defaultValue={item?.categoryId} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field>
          <span className="flex items-center gap-2">
            <input type="checkbox" name="isPurchased" defaultChecked={item?.isPurchased} />
            Achetée (déduite du budget du mois en cours)
          </span>
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}
