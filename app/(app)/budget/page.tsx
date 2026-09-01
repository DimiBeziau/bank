import { getSettings } from "@/lib/actions/settings";
import { getExpenses } from "@/lib/actions/expenses";
import { getWishlistItems } from "@/lib/actions/wishlist";
import { getCategories } from "@/lib/actions/categories";
import {
  computeCurrentCycleBudget,
  isExpenseDueInCycle,
  projectFutureCycles,
  type ExpenseInput,
} from "@/lib/services/forecast";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SettingsCard } from "@/components/budget/SettingsCard";
import { ExpenseList } from "@/components/budget/ExpenseList";
import { ForecastStrip } from "@/components/budget/ForecastStrip";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { formatCurrency } from "@/lib/format";
import type { CategoryDTO, ExpenseDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const FORECAST_MONTHS_AHEAD = 5;

export default async function BudgetPage() {
  const [settings, expenses, wishlistItems, categories] = await Promise.all([
    getSettings(),
    getExpenses(),
    getWishlistItems(),
    getCategories(),
  ]);

  const referenceDate = new Date();

  const expenseInputs: ExpenseInput[] = expenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    isOneTime: e.isOneTime,
    isChecked: e.isChecked,
    dueDate: e.dueDate,
    periodicityUnit: e.periodicityUnit,
    periodicityValue: e.periodicityValue,
  }));

  const currentCycle = computeCurrentCycleBudget({
    startingCapital: settings.startingCapital,
    cycleStartDay: settings.cycleStartDay,
    referenceDate,
    expenses: expenseInputs,
    wishlistItems: wishlistItems.map((w) => ({ id: w.id, budget: w.budget, isPurchased: w.isPurchased })),
  });

  const forecast = projectFutureCycles({
    startingCapital: settings.startingCapital,
    cycleStartDay: settings.cycleStartDay,
    referenceDate,
    monthsAhead: FORECAST_MONTHS_AHEAD,
    expenses: expenseInputs,
  });

  const categoryTotals = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    amount: expenses
      .filter((e) => e.categoryId === c.id && e.isChecked && isExpenseDueInCycle(e, currentCycle.cycle))
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const spent = currentCycle.deductedExpenses + currentCycle.deductedWishlist;
  const percentUsed = settings.startingCapital > 0 ? (spent / settings.startingCapital) * 100 : 0;

  const categoryDTOs: CategoryDTO[] = categories;
  const expenseDTOs: ExpenseDTO[] = expenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    categoryId: e.categoryId,
    isOneTime: e.isOneTime,
    dueDate: e.dueDate.toISOString(),
    periodicityUnit: e.periodicityUnit,
    periodicityValue: e.periodicityValue,
    isChecked: e.isChecked,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Budget</h1>
          <p className="text-muted text-sm">
            Cycle en cours jusqu&apos;au {currentCycle.cycle.end.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <SettingsCard settings={{ startingCapital: settings.startingCapital, cycleStartDay: settings.cycleStartDay }} />
      </div>

      <GlassCard className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
        <ProgressRing
          percent={percentUsed}
          color="var(--accent)"
          value={`${Math.round(percentUsed)}%`}
          label="du capital utilisé"
        />
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <div>
            <p className="text-muted text-xs">Budget restant</p>
            <p className={`big-number text-3xl ${currentCycle.remaining < 0 ? "text-red-400" : ""}`}>
              {formatCurrency(currentCycle.remaining)}
            </p>
          </div>
          <div className="text-muted text-xs">
            Capital {formatCurrency(settings.startingCapital)} − dépenses{" "}
            {formatCurrency(currentCycle.deductedExpenses)} − wishlist{" "}
            {formatCurrency(currentCycle.deductedWishlist)}
          </div>
        </div>
      </GlassCard>

      <ForecastStrip
        entries={forecast.map((f) => ({
          cycleStart: f.cycle.start.toISOString(),
          projectedExpenses: f.projectedExpenses,
          remaining: f.remaining,
        }))}
      />

      <CategoryBreakdown totals={categoryTotals} />

      <ExpenseList expenses={expenseDTOs} categories={categoryDTOs} />
    </div>
  );
}
