import type { PeriodicityUnit } from "@/lib/services/periodicity";

export interface CategoryDTO {
  id: string;
  name: string;
  color: string;
}

export interface ExpenseDTO {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  isOneTime: boolean;
  dueDate: string;
  periodicityUnit: PeriodicityUnit | null;
  periodicityValue: number | null;
  isChecked: boolean;
}

export interface WishlistItemDTO {
  id: string;
  name: string;
  categoryId: string;
  budget: number;
  isPurchased: boolean;
}

export interface SettingsDTO {
  startingCapital: number;
  cycleStartDay: number;
}
