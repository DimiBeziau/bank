"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import type { CategoryDTO, ExpenseDTO } from "@/lib/types";

interface ExpenseModalProps {
  categories: CategoryDTO[];
  expense?: ExpenseDTO;
  trigger: React.ReactNode;
  defaultDueDate: string;
}

export function ExpenseModal({ categories, expense, trigger, defaultDueDate }: ExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const [isOneTime, setIsOneTime] = useState(expense?.isOneTime ?? false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(expense);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={isEdit ? "Modifier la dépense" : "Nouvelle dépense"}
      trigger={trigger}
    >
      <form
        action={(formData) => {
          startTransition(async () => {
            if (expense) {
              await updateExpense(expense.id, formData);
            } else {
              await createExpense(formData);
            }
            setOpen(false);
          });
        }}
        className="flex flex-col gap-4"
      >
        <Field>
          Nom
          <Input name="name" defaultValue={expense?.name} required />
        </Field>
        <div className="flex gap-3">
          <Field className="flex-1">
            Montant (€)
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={expense?.amount}
              required
            />
          </Field>
          <Field className="flex-1">
            Catégorie
            <Select name="categoryId" defaultValue={expense?.categoryId} required>
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
            <input
              type="checkbox"
              name="isOneTime"
              defaultChecked={expense?.isOneTime}
              onChange={(e) => setIsOneTime(e.target.checked)}
            />
            Dépense ponctuelle (pas de récurrence)
          </span>
        </Field>

        <Field>
          {isOneTime ? "Date d'échéance" : "Date de référence (1ère occurrence)"}
          <Input
            name="dueDate"
            type="date"
            defaultValue={expense?.dueDate.slice(0, 10) ?? defaultDueDate}
            required
          />
        </Field>

        {!isOneTime && (
          <div className="flex gap-3">
            <Field className="flex-1">
              Tous les
              <Input
                name="periodicityValue"
                type="number"
                min={1}
                defaultValue={expense?.periodicityValue ?? 1}
                required={!isOneTime}
              />
            </Field>
            <Field className="flex-1">
              Unité
              <Select
                name="periodicityUnit"
                defaultValue={expense?.periodicityUnit ?? "MONTH"}
                required={!isOneTime}
              >
                <option value="DAY">Jour(s)</option>
                <option value="WEEK">Semaine(s)</option>
                <option value="MONTH">Mois</option>
              </Select>
            </Field>
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}
