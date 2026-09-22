const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

export function formatCycleLabel(start: Date): string {
  return monthFormatter.format(start);
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

const cycleTitleFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export function formatCycleTitle(start: Date): string {
  return cycleTitleFormatter.format(start);
}

/** "YYYY-MM-DD" en heure locale — ne pas utiliser toISOString(), qui décale en UTC. */
export function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
