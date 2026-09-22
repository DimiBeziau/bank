import { describe, expect, it } from "vitest";
import {
  computeCycleBudget,
  cycleKeyOf,
  projectCycles,
  type ExpenseInput,
  type IncomeInput,
} from "../lib/services/forecast";

const referenceDate = new Date(2026, 2, 10); // 10 mars 2026, cycle démarrant le 5

const salary = (amount: number): IncomeInput[] => [
  { id: "i1", name: "Salaire", amount, dayOfMonth: 5 },
];

function expense(overrides: Partial<ExpenseInput>): ExpenseInput {
  return {
    id: "e1",
    name: "Loyer",
    amount: 100,
    isOneTime: false,
    dueDate: new Date(2026, 2, 5),
    periodicityUnit: "MONTH",
    periodicityValue: 1,
    ...overrides,
  };
}

describe("computeCycleBudget", () => {
  it("déduit uniquement les dépenses cochées et échues dans le cycle courant", () => {
    const result = computeCycleBudget({
      incomes: salary(1000),
      cycleStartDay: 5,
      referenceDate,
      offset: 0,
      expenses: [
        expense({ id: "checked-due", amount: 100 }),
        expense({ id: "unchecked-due", amount: 200 }),
        expense({ id: "checked-not-due", amount: 300, dueDate: new Date(2026, 5, 5) }),
      ],
      checkedExpenseIds: new Set(["checked-due", "checked-not-due"]),
      wishlistItems: [
        { id: "w1", budget: 50, isPurchased: true, purchasedAt: new Date(2026, 2, 10) },
        { id: "w2", budget: 999, isPurchased: false, purchasedAt: null },
      ],
    });

    expect(result.deductedExpenses).toBe(100);
    expect(result.deductedWishlist).toBe(50);
    expect(result.remaining).toBe(1000 - 100 - 50);
  });

  it("déduit une dépense ponctuelle cochée dont l'échéance tombe dans le cycle", () => {
    const result = computeCycleBudget({
      incomes: salary(500),
      cycleStartDay: 5,
      referenceDate,
      offset: 0,
      expenses: [
        expense({
          id: "onetime",
          amount: 42,
          isOneTime: true,
          periodicityUnit: null,
          periodicityValue: null,
          dueDate: new Date(2026, 2, 20),
        }),
      ],
      checkedExpenseIds: new Set(["onetime"]),
      wishlistItems: [],
    });

    expect(result.deductedExpenses).toBe(42);
  });

  it("somme plusieurs entrées d'argent", () => {
    const result = computeCycleBudget({
      incomes: [
        { id: "i1", name: "Salaire", amount: 1500, dayOfMonth: 1 },
        { id: "i2", name: "APL", amount: 150, dayOfMonth: 5 },
      ],
      cycleStartDay: 5,
      referenceDate,
      offset: 0,
      expenses: [],
      checkedExpenseIds: new Set(),
      wishlistItems: [],
    });

    expect(result.totalIncome).toBe(1650);
  });

  it("ne déduit un souhait acheté que dans le cycle contenant sa date d'achat", () => {
    const wishlistItems = [{ id: "w1", budget: 200, isPurchased: true, purchasedAt: new Date(2026, 1, 20) }];

    const currentCycle = computeCycleBudget({
      incomes: salary(1000),
      cycleStartDay: 5,
      referenceDate,
      offset: 0,
      expenses: [],
      checkedExpenseIds: new Set(),
      wishlistItems,
    });
    const previousCycle = computeCycleBudget({
      incomes: salary(1000),
      cycleStartDay: 5,
      referenceDate,
      offset: -1,
      expenses: [],
      checkedExpenseIds: new Set(),
      wishlistItems,
    });

    expect(currentCycle.deductedWishlist).toBe(0);
    expect(previousCycle.deductedWishlist).toBe(200);
  });

  it("un offset négatif renvoie un cycle strictement avant aujourd'hui", () => {
    const result = computeCycleBudget({
      incomes: salary(1000),
      cycleStartDay: 5,
      referenceDate,
      offset: -1,
      expenses: [],
      checkedExpenseIds: new Set(),
      wishlistItems: [],
    });

    expect(result.cycle.end.getTime()).toBeLessThanOrEqual(new Date(2026, 2, 5).getTime());
  });
});

describe("cycleKeyOf", () => {
  it("renvoie une date locale zero-paddée", () => {
    const result = computeCycleBudget({
      incomes: [],
      cycleStartDay: 5,
      referenceDate,
      offset: 0,
      expenses: [],
      checkedExpenseIds: new Set(),
      wishlistItems: [],
    });

    expect(cycleKeyOf(result.cycle)).toBe("2026-03-05");
  });
});

describe("projectCycles", () => {
  it("projette les occurrences futures d'une dépense mensuelle sur chaque cycle, capital reset à chaque fois", () => {
    const projections = projectCycles({
      incomes: salary(1000),
      cycleStartDay: 5,
      referenceDate,
      fromOffset: 0,
      toOffset: 2,
      expenses: [expense({ amount: 100 })],
      wishlistItems: [],
    });

    expect(projections).toHaveLength(3);
    for (const p of projections) {
      expect(p.dueExpenses).toBe(100);
      expect(p.projectedRemaining).toBe(900);
    }
  });

  it("ne projette une dépense ponctuelle que dans le cycle de son échéance", () => {
    const projections = projectCycles({
      incomes: salary(1000),
      cycleStartDay: 5,
      referenceDate,
      fromOffset: 0,
      toOffset: 2,
      expenses: [
        expense({
          isOneTime: true,
          periodicityUnit: null,
          periodicityValue: null,
          amount: 250,
          dueDate: new Date(2026, 3, 10), // cycle offset 1
        }),
      ],
      wishlistItems: [],
    });

    expect(projections[0].dueExpenses).toBe(0);
    expect(projections[1].dueExpenses).toBe(250);
    expect(projections[2].dueExpenses).toBe(0);
  });
});
