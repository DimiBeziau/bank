import { z } from "zod";

export const periodicityUnitSchema = z.enum(["DAY", "WEEK", "MONTH"]);

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "8 caractères minimum"),
});

export const settingsSchema = z.object({
  cycleStartDay: z.coerce.number().int().min(1).max(28),
});

export const incomeEntrySchema = z.object({
  name: z.string().trim().min(1).max(40),
  amount: z.coerce.number().finite(),
  dayOfMonth: z.coerce.number().int().min(1).max(28),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide"),
});

export const expenseSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    amount: z.coerce.number().positive(),
    categoryId: z.string().min(1),
    isOneTime: z.coerce.boolean(),
    dueDate: z.coerce.date(),
    periodicityUnit: periodicityUnitSchema.optional(),
    periodicityValue: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => data.isOneTime || (data.periodicityUnit && data.periodicityValue), {
    message: "Une dépense périodique doit avoir une unité et une valeur de périodicité",
    path: ["periodicityUnit"],
  });

export const wishlistItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.string().min(1),
  budget: z.coerce.number().positive(),
  isPurchased: z.coerce.boolean().default(false),
});
