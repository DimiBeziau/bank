"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import type { CategoryDTO } from "@/lib/types";

const DEFAULT_COLOR = "#a78bfa";

interface CategoryModalProps {
  trigger: React.ReactNode;
  category?: CategoryDTO;
}

export function CategoryModal({ trigger, category }: CategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(category);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
      trigger={trigger}
    >
      <form
        action={(formData) => {
          startTransition(async () => {
            if (category) {
              await updateCategory(category.id, formData);
            } else {
              await createCategory(formData);
            }
            setOpen(false);
          });
        }}
        className="flex flex-col gap-4"
      >
        <Field>
          Nom
          <Input name="name" maxLength={40} defaultValue={category?.name} required autoFocus />
        </Field>
        <Field>
          Couleur
          <Input
            name="color"
            type="color"
            defaultValue={category?.color ?? DEFAULT_COLOR}
            className="h-10 p-1"
          />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}
