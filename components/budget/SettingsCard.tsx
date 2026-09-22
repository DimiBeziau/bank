"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { saveSettings } from "@/lib/actions/settings";
import { createIncomeEntry } from "@/lib/actions/income";
import { IncomeEntryRow } from "@/components/budget/IncomeEntryRow";
import { formatCurrency } from "@/lib/format";
import type { IncomeEntryDTO, SettingsDTO } from "@/lib/types";

export function SettingsCard({
  settings,
  incomes,
}: {
  settings: SettingsDTO;
  incomes: IncomeEntryDTO[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);

  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Réglages du mois"
      trigger={
        <Button variant="ghost" className="gap-2">
          <Settings2 size={16} />
          Réglages
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <form
          action={(formData) => {
            startTransition(async () => {
              await saveSettings(formData);
            });
          }}
          className="flex flex-col gap-4"
        >
          <Field>
            Jour de début de cycle
            <Input
              name="cycleStartDay"
              type="number"
              min={1}
              max={28}
              defaultValue={settings.cycleStartDay}
              required
            />
          </Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>

        <hr className="border-white/10" />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Revenus mensuels</h3>
          <span className="text-muted text-xs">{formatCurrency(total)} / mois</span>
        </div>

        {incomes.length === 0 && (
          <p className="text-muted text-xs">
            Aucun revenu enregistré. Ajoute ton salaire ou tes aides pour calculer ton capital du mois.
          </p>
        )}

        <div className="flex flex-col gap-1">
          {incomes.map((income) => (
            <IncomeEntryRow key={income.id} income={income} />
          ))}
        </div>

        <form
          ref={addFormRef}
          action={(formData) => {
            startAddTransition(async () => {
              await createIncomeEntry(formData);
              addFormRef.current?.reset();
            });
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1">
            <Input name="name" placeholder="Nom" maxLength={40} required />
          </div>
          <div className="w-24">
            <Input name="amount" type="number" step="0.01" placeholder="Montant" required />
          </div>
          <div className="w-16">
            <Input name="dayOfMonth" type="number" min={1} max={28} placeholder="Jour" required />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10"
            aria-label="Ajouter le revenu"
          >
            <Plus size={16} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
