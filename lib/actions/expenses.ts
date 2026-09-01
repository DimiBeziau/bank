"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { expenseSchema } from "@/lib/validation/schemas";

export async function getExpenses() {
  const userId = await requireUserId();
  return prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { dueDate: "asc" },
  });
}

function parseExpenseForm(formData: FormData) {
  const isOneTime = formData.get("isOneTime") === "on" || formData.get("isOneTime") === "true";

  return expenseSchema.parse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    isOneTime,
    dueDate: formData.get("dueDate"),
    periodicityUnit: isOneTime ? undefined : (formData.get("periodicityUnit") ?? undefined),
    periodicityValue: isOneTime ? undefined : (formData.get("periodicityValue") ?? undefined),
    isChecked: formData.get("isChecked") === "on" || formData.get("isChecked") === "true",
  });
}

export async function createExpense(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseExpenseForm(formData);

  await prisma.expense.create({
    data: {
      userId,
      name: parsed.name,
      amount: parsed.amount,
      categoryId: parsed.categoryId,
      isOneTime: parsed.isOneTime,
      dueDate: parsed.dueDate,
      periodicityUnit: parsed.isOneTime ? null : (parsed.periodicityUnit ?? null),
      periodicityValue: parsed.isOneTime ? null : (parsed.periodicityValue ?? null),
      isChecked: parsed.isChecked,
    },
  });

  revalidatePath("/budget");
}

export async function updateExpense(id: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseExpenseForm(formData);

  await prisma.expense.update({
    where: { id, userId },
    data: {
      name: parsed.name,
      amount: parsed.amount,
      categoryId: parsed.categoryId,
      isOneTime: parsed.isOneTime,
      dueDate: parsed.dueDate,
      periodicityUnit: parsed.isOneTime ? null : (parsed.periodicityUnit ?? null),
      periodicityValue: parsed.isOneTime ? null : (parsed.periodicityValue ?? null),
      isChecked: parsed.isChecked,
    },
  });

  revalidatePath("/budget");
}

export async function toggleExpenseChecked(id: string, isChecked: boolean) {
  const userId = await requireUserId();
  await prisma.expense.update({ where: { id, userId }, data: { isChecked } });
  revalidatePath("/budget");
}

export async function deleteExpense(id: string) {
  const userId = await requireUserId();
  await prisma.expense.delete({ where: { id, userId } });
  revalidatePath("/budget");
}
