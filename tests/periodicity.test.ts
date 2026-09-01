import { describe, expect, it } from "vitest";
import {
  getCurrentCycleBounds,
  getCycleBoundsOffset,
  nextOccurrenceOnOrAfter,
  occurrencesInRange,
} from "../lib/services/periodicity";

describe("getCurrentCycleBounds", () => {
  it("place la référence après le jour de cycle dans le cycle du mois courant", () => {
    const bounds = getCurrentCycleBounds(new Date(2026, 2, 10), 5);
    expect(bounds.start).toEqual(new Date(2026, 2, 5));
    expect(bounds.end).toEqual(new Date(2026, 3, 5));
  });

  it("place la référence avant le jour de cycle dans le cycle du mois précédent", () => {
    const bounds = getCurrentCycleBounds(new Date(2026, 2, 2), 5);
    expect(bounds.start).toEqual(new Date(2026, 1, 5));
    expect(bounds.end).toEqual(new Date(2026, 2, 5));
  });

  it("clampe le jour de cycle sur les mois plus courts (ex: 31 -> 28/29)", () => {
    // 15 fév 2026 est avant le 28 (clamp de 31 sur février) -> encore dans le cycle
    // démarré le 31 janvier (clampé lui aussi car janvier a 31 jours -> pas de clamp).
    const bounds = getCurrentCycleBounds(new Date(2026, 1, 15), 31);
    expect(bounds.start).toEqual(new Date(2026, 0, 31));
    expect(bounds.end).toEqual(new Date(2026, 1, 28));
  });
});

describe("getCycleBoundsOffset", () => {
  it("avance de N cycles en conservant le jour de cycle", () => {
    const bounds = getCycleBoundsOffset(new Date(2026, 2, 10), 5, 2);
    expect(bounds.start).toEqual(new Date(2026, 4, 5));
    expect(bounds.end).toEqual(new Date(2026, 5, 5));
  });
});

describe("nextOccurrenceOnOrAfter", () => {
  it("avance par pas de jours", () => {
    const occ = nextOccurrenceOnOrAfter(
      new Date(2026, 0, 1),
      { unit: "DAY", value: 10 },
      new Date(2026, 0, 25),
    );
    expect(occ).toEqual(new Date(2026, 0, 31));
  });

  it("avance par pas de mois avec clamp de fin de mois", () => {
    const occ = nextOccurrenceOnOrAfter(
      new Date(2026, 0, 31),
      { unit: "MONTH", value: 1 },
      new Date(2026, 1, 1),
    );
    expect(occ).toEqual(new Date(2026, 1, 28));
  });
});

describe("occurrencesInRange", () => {
  it("retourne toutes les occurrences hebdomadaires dans une fenêtre", () => {
    const occs = occurrencesInRange(
      new Date(2026, 0, 1),
      { unit: "WEEK", value: 1 },
      new Date(2026, 0, 1),
      new Date(2026, 0, 22),
    );
    expect(occs).toEqual([
      new Date(2026, 0, 1),
      new Date(2026, 0, 8),
      new Date(2026, 0, 15),
    ]);
  });

  it("ne retourne rien si la dépense démarre après la fenêtre", () => {
    const occs = occurrencesInRange(
      new Date(2026, 5, 1),
      { unit: "MONTH", value: 1 },
      new Date(2026, 0, 1),
      new Date(2026, 1, 1),
    );
    expect(occs).toEqual([]);
  });
});
