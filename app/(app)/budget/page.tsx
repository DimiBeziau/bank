import { getSettings } from "@/lib/actions/settings";
import { getExpenses, getCycleChecks } from "@/lib/actions/expenses";
import { getWishlistItems } from "@/lib/actions/wishlist";
import { getCategories } from "@/lib/actions/categories";
import { getIncomeEntries } from "@/lib/actions/income";
import {
  computeCycleBudget,
  isExpenseDueInCycle,
  isWishlistItemPurchasedInCycle,
  projectCycles,
  type ExpenseInput,
} from "@/lib/services/forecast";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SettingsCard } from "@/components/budget/SettingsCard";
import { ExpenseList } from "@/components/budget/ExpenseList";
import { ForecastStrip } from "@/components/budget/ForecastStrip";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { CycleNavigator } from "@/components/budget/CycleNavigator";
import { WishlistPurchasedList } from "@/components/budget/WishlistPurchasedList";
import { formatCurrency, formatCycleTitle, formatDate, toDateInputValue } from "@/lib/format";
import type { CategoryDTO, ExpenseDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const FORECAST_MONTHS_AHEAD = 5;
const MAX_OFFSET = 60;

function parseOffset(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n)) return 0;
  return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, n));
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const offset = parseOffset((await searchParams).cycle);

  const [settings, expenses, wishlistItems, categories, incomes, checkedIds] = await Promise.all([
    getSettings(),
    getExpenses(),
    getWishlistItems(),
    getCategories(),
    getIncomeEntries(),
    getCycleChecks(offset),
  ]);
  const checkedIdSet = new Set(checkedIds);

  const referenceDate = new Date();

  const expenseInputs: ExpenseInput[] = expenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    isOneTime: e.isOneTime,
    dueDate: e.dueDate,
    periodicityUnit: e.periodicityUnit,
    periodicityValue: e.periodicityValue,
  }));
  const wishlistInputs = wishlistItems.map((w) => ({
    id: w.id,
    budget: w.budget,
    isPurchased: w.isPurchased,
    purchasedAt: w.purchasedAt,
  }));

  const cycleBudget = computeCycleBudget({
    incomes,
    cycleStartDay: settings.cycleStartDay,
    referenceDate,
    offset,
    expenses: expenseInputs,
    checkedExpenseIds: checkedIdSet,
    wishlistItems: wishlistInputs,
  });

  const forecast = projectCycles({
    incomes,
    cycleStartDay: settings.cycleStartDay,
    referenceDate,
    fromOffset: 0,
    toOffset: FORECAST_MONTHS_AHEAD,
    expenses: expenseInputs,
    wishlistItems: wishlistInputs,
  });

  const categoryTotals = categories.map((c) => {
    const expenseAmount = expenses
      .filter(
        (e) => e.categoryId === c.id && checkedIdSet.has(e.id) && isExpenseDueInCycle(e, cycleBudget.cycle),
      )
      .reduce((sum, e) => sum + e.amount, 0);
    const wishlistAmount = wishlistItems
      .filter((w) => w.categoryId === c.id && isWishlistItemPurchasedInCycle(w, cycleBudget.cycle))
      .reduce((sum, w) => sum + w.budget, 0);
    return { id: c.id, name: c.name, color: c.color, amount: expenseAmount + wishlistAmount };
  });

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const purchasedWishlistThisCycle = wishlistItems
    .filter((w) => isWishlistItemPurchasedInCycle(w, cycleBudget.cycle))
    .map((w) => ({
      id: w.id,
      name: w.name,
      budget: w.budget,
      categoryColor: categoryById.get(w.categoryId)?.color,
      categoryName: categoryById.get(w.categoryId)?.name,
    }));

  const isFuture = offset > 0;
  const displayedRemaining = isFuture ? cycleBudget.projectedRemaining : cycleBudget.remaining;
  const deductedExpensesShown = isFuture ? cycleBudget.dueExpenses : cycleBudget.deductedExpenses;
  const spent = deductedExpensesShown + cycleBudget.deductedWishlist;
  const percentUsed = cycleBudget.totalIncome > 0 ? (spent / cycleBudget.totalIncome) * 100 : 0;

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
    isChecked: checkedIdSet.has(e.id),
  }));

  const defaultDueDate = toDateInputValue(offset === 0 ? referenceDate : cycleBudget.cycle.start);

  const ringLabel = isFuture ? "du capital projeté" : "du capital utilisé";
  const blockTitle = offset === 0 ? "Budget restant" : isFuture ? "Budget prévisionnel" : "Solde de fin de mois";
  const expensesLabel = isFuture ? "dépenses projetées" : "dépenses";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Budget</h1>
          <p className="text-muted text-sm">
            Cycle du {formatDate(cycleBudget.cycle.start)} au {formatDate(cycleBudget.cycle.end)}
          </p>
        </div>
        <SettingsCard settings={{ cycleStartDay: settings.cycleStartDay }} incomes={incomes} />
      </div>

      <GlassCard>
        <CycleNavigator
          offset={offset}
          label={formatCycleTitle(cycleBudget.cycle.start)}
          rangeLabel={`du ${formatDate(cycleBudget.cycle.start)} au ${formatDate(cycleBudget.cycle.end)}`}
        />
      </GlassCard>

      <GlassCard className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
        <ProgressRing
          percent={percentUsed}
          color="var(--accent)"
          value={`${Math.round(percentUsed)}%`}
          label={ringLabel}
        />
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <div>
            <p className="text-muted text-xs">{blockTitle}</p>
            <p className={`big-number text-3xl ${displayedRemaining < 0 ? "text-red-400" : ""}`}>
              {formatCurrency(displayedRemaining)}
            </p>
          </div>
          <div className="text-muted text-xs">
            Revenus {formatCurrency(cycleBudget.totalIncome)} − {expensesLabel}{" "}
            {formatCurrency(deductedExpensesShown)} − wishlist{" "}
            {formatCurrency(cycleBudget.deductedWishlist)}
          </div>
        </div>
      </GlassCard>

      <ForecastStrip
        entries={forecast.map((f) => ({
          cycleStart: f.cycle.start.toISOString(),
          projectedExpenses: f.dueExpenses,
          remaining: f.projectedRemaining,
        }))}
      />

      <CategoryBreakdown totals={categoryTotals} />

      <WishlistPurchasedList items={purchasedWishlistThisCycle} />

      <ExpenseList
        expenses={expenseDTOs}
        categories={categoryDTOs}
        cycleOffset={offset}
        defaultDueDate={defaultDueDate}
      />
    </div>
  );
}
