"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { createCategory } from "@/lib/actions/categories";

const DEFAULT_COLOR = "#a78bfa";

export function CategoryModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Modal open={open} onOpenChange={setOpen} title="Nouvelle catégorie" trigger={trigger}>
      <form
        action={(formData) => {
          startTransition(async () => {
            await createCategory(formData);
            setOpen(false);
          });
        }}
        className="flex flex-col gap-4"
      >
        <Field>
          Nom
          <Input name="name" maxLength={40} required autoFocus />
        </Field>
        <Field>
          Couleur
          <Input name="color" type="color" defaultValue={DEFAULT_COLOR} className="h-10 p-1" />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}
