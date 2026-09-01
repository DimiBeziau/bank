import { describe, expect, it } from "vitest";
import {
  computeCurrentCycleBudget,
  projectFutureCycles,
  type ExpenseInput,
} from "../lib/services/forecast";

const referenceDate = new Date(2026, 2, 10); // 10 mars 2026, cycle démarrant le 5

function expense(overrides: Partial<ExpenseInput>): ExpenseInput {
  return {
    id: "e1",
    name: "Loyer",
    amount: 100,
    isOneTime: false,
    isChecked: false,
    dueDate: new Date(2026, 2, 5),
    periodicityUnit: "MONTH",
    periodicityValue: 1,
    ...overrides,
  };
}

describe("computeCurrentCycleBudget", () => {
  it("déduit uniquement les dépenses cochées et échues dans le cycle courant", () => {
    const result = computeCurrentCycleBudget({
      startingCapital: 1000,
      cycleStartDay: 5,
      referenceDate,
      expenses: [
        expense({ id: "checked-due", amount: 100, isChecked: true }),
        expense({ id: "unchecked-due", amount: 200, isChecked: false }),
        expense({
          id: "checked-not-due",
          amount: 300,
          isChecked: true,
          dueDate: new Date(2026, 5, 5),
        }),
      ],
      wishlistItems: [
        { id: "w1", budget: 50, isPurchased: true },
        { id: "w2", budget: 999, isPurchased: false },
      ],
    });

    expect(result.deductedExpenses).toBe(100);
    expect(result.deductedWishlist).toBe(50);
    expect(result.remaining).toBe(1000 - 100 - 50);
  });

  it("déduit une dépense ponctuelle cochée dont l'échéance tombe dans le cycle", () => {
    const result = computeCurrentCycleBudget({
      startingCapital: 500,
      cycleStartDay: 5,
      referenceDate,
      expenses: [
        expense({
          id: "onetime",
          amount: 42,
          isChecked: true,
          isOneTime: true,
          periodicityUnit: null,
          periodicityValue: null,
          dueDate: new Date(2026, 2, 20),
        }),
      ],
      wishlistItems: [],
    });

    expect(result.deductedExpenses).toBe(42);
  });
});

describe("projectFutureCycles", () => {
  it("projette les occurrences futures d'une dépense mensuelle sur chaque cycle, capital reset à chaque fois", () => {
    const projections = projectFutureCycles({
      startingCapital: 1000,
      cycleStartDay: 5,
      referenceDate,
      monthsAhead: 2,
      expenses: [expense({ amount: 100, isChecked: false })],
    });

    expect(projections).toHaveLength(3);
    for (const p of projections) {
      expect(p.projectedExpenses).toBe(100);
      expect(p.remaining).toBe(900);
    }
  });

  it("ne projette une dépense ponctuelle que dans le cycle de son échéance", () => {
    const projections = projectFutureCycles({
      startingCapital: 1000,
      cycleStartDay: 5,
      referenceDate,
      monthsAhead: 2,
      expenses: [
        expense({
          isOneTime: true,
          periodicityUnit: null,
          periodicityValue: null,
          amount: 250,
          dueDate: new Date(2026, 3, 10), // cycle offset 1
        }),
      ],
    });

    expect(projections[0].projectedExpenses).toBe(0);
    expect(projections[1].projectedExpenses).toBe(250);
    expect(projections[2].projectedExpenses).toBe(0);
  });
});
