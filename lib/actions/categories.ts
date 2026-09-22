"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";

export async function getCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
}

export async function getCategoriesWithUsage() {
  const userId = await requireUserId();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { expenses: true, wishlistItems: true } } },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    usageCount: c._count.expenses + c._count.wishlistItems,
    expenseCount: c._count.expenses,
    wishlistCount: c._count.wishlistItems,
  }));
}

export async function createCategory(formData: FormData) {
  const userId = await requireUserId();
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  await prisma.category.create({ data: { ...parsed, userId } });

  revalidatePath("/budget");
  revalidatePath("/wishlist");
}

export async function updateCategory(id: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  await prisma.category.update({ where: { id, userId }, data: parsed });

  revalidatePath("/budget");
  revalidatePath("/wishlist");
  revalidatePath("/categories");
}

export type DeleteCategoryResult =
  | { ok: true }
  | { ok: false; reason: "IN_USE"; expenseCount: number; wishlistCount: number }
  | { ok: false; reason: "NOT_FOUND" };

export async function deleteCategory(
  id: string,
  options?: { cascade?: boolean },
): Promise<DeleteCategoryResult> {
  const userId = await requireUserId();

  const category = await prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
  if (!category) return { ok: false, reason: "NOT_FOUND" };

  const [expenseCount, wishlistCount] = await Promise.all([
    prisma.expense.count({ where: { categoryId: id, userId } }),
    prisma.wishlistItem.count({ where: { categoryId: id, userId } }),
  ]);

  if (expenseCount > 0 || wishlistCount > 0) {
    if (!options?.cascade) {
      return { ok: false, reason: "IN_USE", expenseCount, wishlistCount };
    }

    await prisma.$transaction([
      prisma.expenseCycleCheck.deleteMany({ where: { userId, expense: { categoryId: id } } }),
      prisma.expense.deleteMany({ where: { categoryId: id, userId } }),
      prisma.wishlistItem.deleteMany({ where: { categoryId: id, userId } }),
      prisma.category.delete({ where: { id, userId } }),
    ]);

    revalidatePath("/budget");
    revalidatePath("/wishlist");
    revalidatePath("/categories");
    return { ok: true };
  }

  await prisma.category.delete({ where: { id, userId } });
  revalidatePath("/budget");
  revalidatePath("/wishlist");
  revalidatePath("/categories");
  return { ok: true };
}
