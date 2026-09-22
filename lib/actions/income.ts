"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { incomeEntrySchema } from "@/lib/validation/schemas";

export async function getIncomeEntries() {
  const userId = await requireUserId();
  return prisma.incomeEntry.findMany({ where: { userId }, orderBy: { dayOfMonth: "asc" } });
}

export async function createIncomeEntry(formData: FormData) {
  const userId = await requireUserId();
  const parsed = incomeEntrySchema.parse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dayOfMonth: formData.get("dayOfMonth"),
  });

  await prisma.incomeEntry.create({ data: { ...parsed, userId } });

  revalidatePath("/budget");
}

export async function updateIncomeEntry(id: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = incomeEntrySchema.parse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dayOfMonth: formData.get("dayOfMonth"),
  });

  await prisma.incomeEntry.update({ where: { id, userId }, data: parsed });

  revalidatePath("/budget");
}

export async function deleteIncomeEntry(id: string) {
  const userId = await requireUserId();
  await prisma.incomeEntry.delete({ where: { id, userId } });
  revalidatePath("/budget");
}
