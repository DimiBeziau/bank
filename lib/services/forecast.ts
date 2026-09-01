import {
  type CycleBounds,
  type PeriodicityUnit,
  getCurrentCycleBounds,
  getCycleBoundsOffset,
  occurrencesInRange,
} from "./periodicity";

export interface ExpenseInput {
  id: string;
  name: string;
  amount: number;
  isOneTime: boolean;
  isChecked: boolean;
  dueDate: Date;
  periodicityUnit: PeriodicityUnit | null;
  periodicityValue: number | null;
}

export interface WishlistInput {
  id: string;
  budget: number;
  isPurchased: boolean;
}

/** Une occurrence de la dépense tombe-t-elle dans le cycle donné ? */
export function isExpenseDueInCycle(expense: ExpenseInput, cycle: CycleBounds): boolean {
  if (expense.isOneTime) {
    return expense.dueDate >= cycle.start && expense.dueDate < cycle.end;
  }
  if (!expense.periodicityUnit || !expense.periodicityValue) return false;
  return (
    occurrencesInRange(
      expense.dueDate,
      { unit: expense.periodicityUnit, value: expense.periodicityValue },
      cycle.start,
      cycle.end,
    ).length > 0
  );
}

export interface CurrentCycleBudget {
  cycle: CycleBounds;
  deductedExpenses: number;
  deductedWishlist: number;
  remaining: number;
}

/**
 * Budget restant du cycle courant = capital − dépenses cochées échues dans le cycle
 * − items wishlist cochés (déduits du cycle courant, sans date propre).
 */
export function computeCurrentCycleBudget(params: {
  startingCapital: number;
  cycleStartDay: number;
  referenceDate: Date;
  expenses: ExpenseInput[];
  wishlistItems: WishlistInput[];
}): CurrentCycleBudget {
  const cycle = getCurrentCycleBounds(params.referenceDate, params.cycleStartDay);
  const deductedExpenses = params.expenses
    .filter((e) => e.isChecked && isExpenseDueInCycle(e, cycle))
    .reduce((sum, e) => sum + e.amount, 0);
  const deductedWishlist = params.wishlistItems
    .filter((w) => w.isPurchased)
    .reduce((sum, w) => sum + w.budget, 0);

  return {
    cycle,
    deductedExpenses,
    deductedWishlist,
    remaining: params.startingCapital - deductedExpenses - deductedWishlist,
  };
}

export interface CycleProjection {
  cycle: CycleBounds;
  projectedExpenses: number;
  remaining: number;
}

/**
 * Projection sur `monthsAhead` cycles futurs. Chaque cycle repart du même capital
 * configuré (hypothèse : capital resaisi chaque mois) moins les occurrences
 * *projetées* des dépenses (cochées ou non — elles ne sont pas encore cochées dans
 * le futur). Les items wishlist ne sont pas récurrents et ne sont donc pas projetés.
 */
export function projectFutureCycles(params: {
  startingCapital: number;
  cycleStartDay: number;
  referenceDate: Date;
  monthsAhead: number;
  expenses: ExpenseInput[];
}): CycleProjection[] {
  const projections: CycleProjection[] = [];
  for (let offset = 0; offset <= params.monthsAhead; offset++) {
    const cycle = getCycleBoundsOffset(params.referenceDate, params.cycleStartDay, offset);
    const projectedExpenses = params.expenses
      .filter((e) => isExpenseDueInCycle(e, cycle))
      .reduce((sum, e) => sum + e.amount, 0);
    projections.push({
      cycle,
      projectedExpenses,
      remaining: params.startingCapital - projectedExpenses,
    });
  }
  return projections;
}
