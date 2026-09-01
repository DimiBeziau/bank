"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";

export async function getCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
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

export async function deleteCategory(id: string) {
  const userId = await requireUserId();
  await prisma.category.delete({ where: { id, userId } });
  revalidatePath("/budget");
  revalidatePath("/wishlist");
}
