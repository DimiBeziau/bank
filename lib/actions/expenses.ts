"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { expenseSchema } from "@/lib/validation/schemas";
import { getCycleBoundsOffset } from "@/lib/services/periodicity";
import { cycleKeyOf } from "@/lib/services/forecast";

export async function getExpenses() {
  const userId = await requireUserId();
  return prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { dueDate: "asc" },
  });
}

async function cycleKeyForOffset(userId: string, offset: number): Promise<string> {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const cycleStartDay = settings?.cycleStartDay ?? 1;
  return cycleKeyOf(getCycleBoundsOffset(new Date(), cycleStartDay, offset));
}

export async function getCycleChecks(offset: number): Promise<string[]> {
  const userId = await requireUserId();
  const cycleKey = await cycleKeyForOffset(userId, offset);
  const checks = await prisma.expenseCycleCheck.findMany({
    where: { userId, cycleKey },
    select: { expenseId: true },
  });
  return checks.map((c) => c.expenseId);
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
    },
  });

  revalidatePath("/budget");
}

export async function toggleExpenseChecked(id: string, offset: number, isChecked: boolean) {
  const userId = await requireUserId();

  const expense = await prisma.expense.findFirst({ where: { id, userId }, select: { id: true } });
  if (!expense) return;

  const cycleKey = await cycleKeyForOffset(userId, offset);

  if (isChecked) {
    await prisma.expenseCycleCheck.upsert({
      where: { expenseId_cycleKey: { expenseId: id, cycleKey } },
      create: { expenseId: id, userId, cycleKey },
      update: {},
    });
  } else {
    await prisma.expenseCycleCheck.deleteMany({ where: { expenseId: id, userId, cycleKey } });
  }

  revalidatePath("/budget");
}

export async function deleteExpense(id: string) {
  const userId = await requireUserId();
  await prisma.expense.delete({ where: { id, userId } });
  revalidatePath("/budget");
}
