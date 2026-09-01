"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { ExpenseModal } from "@/components/budget/ExpenseModal";
import { toggleExpenseChecked, deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CategoryDTO, ExpenseDTO } from "@/lib/types";

const UNIT_LABEL: Record<string, string> = { DAY: "j", WEEK: "sem", MONTH: "mois" };

export function ExpenseRow({
  expense,
  category,
  categories,
}: {
  expense: ExpenseDTO;
  category: CategoryDTO | undefined;
  categories: CategoryDTO[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/5">
      <Checkbox
        checked={expense.isChecked}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await toggleExpenseChecked(expense.id, checked);
          });
        }}
      />

      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: category?.color ?? "#999" }}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.name}</p>
        <p className="text-muted truncate text-xs">
          {category?.name ?? "Sans catégorie"} ·{" "}
          {expense.isOneTime
            ? `échéance ${formatDate(new Date(expense.dueDate))}`
            : `tous les ${expense.periodicityValue} ${UNIT_LABEL[expense.periodicityUnit ?? "MONTH"]}`}
        </p>
      </div>

      <span className="big-number shrink-0 text-sm">{formatCurrency(expense.amount)}</span>

      <ExpenseModal
        categories={categories}
        expense={expense}
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
            await deleteExpense(expense.id);
          });
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
