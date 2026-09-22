"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ExpenseModal } from "@/components/budget/ExpenseModal";
import { ExpenseRow } from "@/components/budget/ExpenseRow";
import type { CategoryDTO, ExpenseDTO } from "@/lib/types";

export function ExpenseList({
  expenses,
  categories,
  cycleOffset,
  defaultDueDate,
}: {
  expenses: ExpenseDTO[];
  categories: CategoryDTO[];
  cycleOffset: number;
  defaultDueDate: string;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "recurring" | "oneTime">("all");
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => categoryFilter === "all" || e.categoryId === categoryFilter)
        .filter((e) => {
          if (typeFilter === "all") return true;
          return typeFilter === "oneTime" ? e.isOneTime : !e.isOneTime;
        }),
    [expenses, categoryFilter, typeFilter],
  );

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Dépenses de ce cycle</h2>
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="w-auto"
          >
            <option value="all">Ponctuelles et périodiques</option>
            <option value="recurring">Périodiques</option>
            <option value="oneTime">Ponctuelles</option>
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-auto"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <ExpenseModal
            categories={categories}
            defaultDueDate={defaultDueDate}
            trigger={
              <Button className="gap-1">
                <Plus size={16} />
                Ajouter
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col divide-y divide-white/5">
        {filtered.length === 0 && (
          <p className="text-muted py-6 text-center text-sm">Aucune dépense ce cycle-ci.</p>
        )}
        {filtered.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            category={categoryById.get(expense.categoryId)}
            categories={categories}
            cycleOffset={cycleOffset}
            defaultDueDate={defaultDueDate}
          />
        ))}
      </div>
    </GlassCard>
  );
}
