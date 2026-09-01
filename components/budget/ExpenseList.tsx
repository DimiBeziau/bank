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
}: {
  expenses: ExpenseDTO[];
  categories: CategoryDTO[];
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? expenses
        : expenses.filter((e) => e.categoryId === categoryFilter),
    [expenses, categoryFilter],
  );

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Dépenses</h2>
        <div className="flex items-center gap-2">
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
          <p className="text-muted py-6 text-center text-sm">Aucune dépense pour l&apos;instant.</p>
        )}
        {filtered.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            category={categoryById.get(expense.categoryId)}
            categories={categories}
          />
        ))}
      </div>
    </GlassCard>
  );
}
