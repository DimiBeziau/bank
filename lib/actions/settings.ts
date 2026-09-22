"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/validation/schemas";

export async function getSettings() {
  const userId = await requireUserId();
  const settings = await prisma.settings.findUnique({ where: { userId } });
  return (
    settings ?? {
      id: "",
      userId,
      cycleStartDay: 1,
      updatedAt: new Date(),
    }
  );
}

export async function saveSettings(formData: FormData) {
  const userId = await requireUserId();
  const parsed = settingsSchema.parse({
    cycleStartDay: formData.get("cycleStartDay"),
  });

  await prisma.settings.upsert({
    where: { userId },
    create: { userId, ...parsed },
    update: parsed,
  });

  revalidatePath("/budget");
}
