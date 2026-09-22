import {
  type CycleBounds,
  type PeriodicityUnit,
  getCycleBoundsOffset,
  occurrencesInRange,
} from "./periodicity";

export interface ExpenseInput {
  id: string;
  name: string;
  amount: number;
  isOneTime: boolean;
  dueDate: Date;
  periodicityUnit: PeriodicityUnit | null;
  periodicityValue: number | null;
}

export interface WishlistInput {
  id: string;
  budget: number;
  isPurchased: boolean;
  purchasedAt: Date | null;
}

export interface IncomeInput {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
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

export function isWishlistItemPurchasedInCycle(item: WishlistInput, cycle: CycleBounds): boolean {
  return (
    item.isPurchased &&
    item.purchasedAt !== null &&
    item.purchasedAt >= cycle.start &&
    item.purchasedAt < cycle.end
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Clé canonique d'un cycle : date de début en heure locale, "YYYY-MM-DD". */
export function cycleKeyOf(cycle: CycleBounds): string {
  const d = cycle.start;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Revenu total d'un cycle : chaque entrée récurrente tombe une fois par cycle. */
export function totalIncomeForCycle(incomes: IncomeInput[]): number {
  return incomes.reduce((sum, i) => sum + i.amount, 0);
}

export interface CycleBudget {
  offset: number;
  cycle: CycleBounds;
  cycleKey: string;
  totalIncome: number;
  dueExpenses: number;
  deductedExpenses: number;
  deductedWishlist: number;
  remaining: number;
  projectedRemaining: number;
}

/**
 * Budget d'un cycle donné (courant, passé ou futur via `offset`).
 * `remaining` ne déduit que les dépenses cochées POUR CE CYCLE (checkedExpenseIds) ;
 * `projectedRemaining` déduit toutes les échéances du cycle, cochées ou non.
 */
export function computeCycleBudget(params: {
  incomes: IncomeInput[];
  cycleStartDay: number;
  referenceDate: Date;
  offset: number;
  expenses: ExpenseInput[];
  checkedExpenseIds: ReadonlySet<string>;
  wishlistItems: WishlistInput[];
}): CycleBudget {
  const cycle = getCycleBoundsOffset(params.referenceDate, params.cycleStartDay, params.offset);
  const cycleKey = cycleKeyOf(cycle);
  const totalIncome = totalIncomeForCycle(params.incomes);

  const dueExpenses = params.expenses
    .filter((e) => isExpenseDueInCycle(e, cycle))
    .reduce((sum, e) => sum + e.amount, 0);
  const deductedExpenses = params.expenses
    .filter((e) => params.checkedExpenseIds.has(e.id) && isExpenseDueInCycle(e, cycle))
    .reduce((sum, e) => sum + e.amount, 0);
  const deductedWishlist = params.wishlistItems
    .filter((w) => isWishlistItemPurchasedInCycle(w, cycle))
    .reduce((sum, w) => sum + w.budget, 0);

  return {
    offset: params.offset,
    cycle,
    cycleKey,
    totalIncome,
    dueExpenses,
    deductedExpenses,
    deductedWishlist,
    remaining: totalIncome - deductedExpenses - deductedWishlist,
    projectedRemaining: totalIncome - dueExpenses - deductedWishlist,
  };
}

/**
 * Projection sur une plage de cycles [fromOffset, toOffset]. Utilisée pour la bande
 * "Prévisions" : elle ne connaît pas les coches par cycle (elles n'ont de sens que pour le
 * cycle affiché), donc `remaining` y est toujours égal à `projectedRemaining`.
 */
export function projectCycles(params: {
  incomes: IncomeInput[];
  cycleStartDay: number;
  referenceDate: Date;
  fromOffset: number;
  toOffset: number;
  expenses: ExpenseInput[];
  wishlistItems: WishlistInput[];
}): CycleBudget[] {
  const projections: CycleBudget[] = [];
  for (let offset = params.fromOffset; offset <= params.toOffset; offset++) {
    projections.push(
      computeCycleBudget({
        incomes: params.incomes,
        cycleStartDay: params.cycleStartDay,
        referenceDate: params.referenceDate,
        offset,
        expenses: params.expenses,
        checkedExpenseIds: new Set(),
        wishlistItems: params.wishlistItems,
      }),
    );
  }
  return projections;
}
