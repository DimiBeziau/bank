"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { deleteIncomeEntry, updateIncomeEntry } from "@/lib/actions/income";
import { formatCurrency } from "@/lib/format";
import type { IncomeEntryDTO } from "@/lib/types";

export function IncomeEntryRow({ income }: { income: IncomeEntryDTO }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateIncomeEntry(income.id, formData);
            setEditing(false);
          });
        }}
        className="flex items-center gap-2"
      >
        <div className="flex-1">
          <Input name="name" defaultValue={income.name} maxLength={40} required />
        </div>
        <div className="w-24">
          <Input name="amount" type="number" step="0.01" defaultValue={income.amount} required />
        </div>
        <div className="w-16">
          <Input name="dayOfMonth" type="number" min={1} max={28} defaultValue={income.dayOfMonth} required />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10"
          aria-label="Valider"
        >
          <Check size={15} />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setEditing(false)}
          className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10"
          aria-label="Annuler"
        >
          <X size={15} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{income.name}</p>
        <p className="text-muted truncate text-xs">le {income.dayOfMonth}</p>
      </div>
      <span className="big-number shrink-0 text-sm">{formatCurrency(income.amount)}</span>
      <button
        className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10"
        aria-label="Modifier le revenu"
        onClick={() => setEditing(true)}
      >
        <Pencil size={15} />
      </button>
      <button
        className="text-muted shrink-0 rounded-full p-1.5 hover:bg-white/10 disabled:opacity-40"
        aria-label="Supprimer le revenu"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteIncomeEntry(income.id);
          });
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
