import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

export const CATEGORY_PALETTE = DEFAULT_CATEGORIES.map((c) => c.color);

function randomPastelHex(): string {
  const hue = Math.floor(Math.random() * 360);
  return hslToHex(hue, 65, 68);
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

/** Première couleur de la palette non utilisée, sinon une teinte pastel aléatoire. */
export function pickUnusedColor(usedColors: string[]): string {
  const used = new Set(usedColors.map((c) => c.toLowerCase()));
  return CATEGORY_PALETTE.find((c) => !used.has(c.toLowerCase())) ?? randomPastelHex();
}
