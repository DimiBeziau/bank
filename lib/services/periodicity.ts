import { addDays, addMonths, getDaysInMonth } from "date-fns";

export type PeriodicityUnit = "DAY" | "WEEK" | "MONTH";

export interface Periodicity {
  unit: PeriodicityUnit;
  value: number;
}

export interface CycleBounds {
  start: Date;
  end: Date;
}

const MAX_ITERATIONS = 1200;

function stepDate(date: Date, periodicity: Periodicity): Date {
  switch (periodicity.unit) {
    case "DAY":
      return addDays(date, periodicity.value);
    case "WEEK":
      return addDays(date, periodicity.value * 7);
    case "MONTH":
      return addMonths(date, periodicity.value);
  }
}

/** Première occurrence >= `from`, en avançant par pas de `periodicity` depuis `dueDate`. */
export function nextOccurrenceOnOrAfter(
  dueDate: Date,
  periodicity: Periodicity,
  from: Date,
): Date {
  let occurrence = dueDate;
  let iterations = 0;
  while (occurrence < from) {
    occurrence = stepDate(occurrence, periodicity);
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      throw new Error("Calcul de périodicité : nombre d'itérations maximal dépassé");
    }
  }
  return occurrence;
}

/** Toutes les occurrences dans [rangeStart, rangeEnd). */
export function occurrencesInRange(
  dueDate: Date,
  periodicity: Periodicity,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const occurrences: Date[] = [];
  let occurrence = nextOccurrenceOnOrAfter(dueDate, periodicity, rangeStart);
  let iterations = 0;
  while (occurrence < rangeEnd) {
    occurrences.push(occurrence);
    occurrence = stepDate(occurrence, periodicity);
    iterations++;
    if (iterations > MAX_ITERATIONS) break;
  }
  return occurrences;
}

function clampDayForMonth(year: number, monthIndex: number, day: number): number {
  const daysInThatMonth = getDaysInMonth(new Date(year, monthIndex));
  return Math.min(day, daysInThatMonth);
}

function cycleStartForMonth(year: number, monthIndex: number, cycleStartDay: number): Date {
  const day = clampDayForMonth(year, monthIndex, cycleStartDay);
  return new Date(year, monthIndex, day);
}

/** Bornes [start, end) du cycle mensuel contenant `referenceDate`. */
export function getCurrentCycleBounds(referenceDate: Date, cycleStartDay: number): CycleBounds {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  let start = cycleStartForMonth(year, monthIndex, cycleStartDay);
  if (referenceDate < start) {
    const prevMonth = addMonths(start, -1);
    start = cycleStartForMonth(prevMonth.getFullYear(), prevMonth.getMonth(), cycleStartDay);
  }
  const nextMonth = addMonths(start, 1);
  const end = cycleStartForMonth(nextMonth.getFullYear(), nextMonth.getMonth(), cycleStartDay);
  return { start, end };
}

/** Bornes du cycle décalé de `offset` mois par rapport au cycle courant (0 = cycle courant). */
export function getCycleBoundsOffset(
  referenceDate: Date,
  cycleStartDay: number,
  offset: number,
): CycleBounds {
  const current = getCurrentCycleBounds(referenceDate, cycleStartDay);
  const targetMonth = addMonths(current.start, offset);
  const start = cycleStartForMonth(targetMonth.getFullYear(), targetMonth.getMonth(), cycleStartDay);
  const endMonth = addMonths(start, 1);
  const end = cycleStartForMonth(endMonth.getFullYear(), endMonth.getMonth(), cycleStartDay);
  return { start, end };
}
