"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { wishlistItemSchema } from "@/lib/validation/schemas";

export async function getWishlistItems() {
  const userId = await requireUserId();
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWishlistItem(formData: FormData) {
  const userId = await requireUserId();
  const parsed = wishlistItemSchema.parse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    budget: formData.get("budget"),
    isPurchased: formData.get("isPurchased") === "on" || formData.get("isPurchased") === "true",
  });

  await prisma.wishlistItem.create({ data: { ...parsed, userId } });

  revalidatePath("/wishlist");
  revalidatePath("/budget");
}

export async function updateWishlistItem(id: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = wishlistItemSchema.parse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    budget: formData.get("budget"),
    isPurchased: formData.get("isPurchased") === "on" || formData.get("isPurchased") === "true",
  });

  await prisma.wishlistItem.update({ where: { id, userId }, data: parsed });

  revalidatePath("/wishlist");
  revalidatePath("/budget");
}

export async function toggleWishlistPurchased(id: string, isPurchased: boolean) {
  const userId = await requireUserId();
  await prisma.wishlistItem.update({ where: { id, userId }, data: { isPurchased } });
  revalidatePath("/wishlist");
  revalidatePath("/budget");
}

export async function deleteWishlistItem(id: string) {
  const userId = await requireUserId();
  await prisma.wishlistItem.delete({ where: { id, userId } });
  revalidatePath("/wishlist");
  revalidatePath("/budget");
}
