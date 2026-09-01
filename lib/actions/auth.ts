"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

export interface AuthActionState {
  error?: string;
}

export async function signup(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      settings: { create: { startingCapital: 0, cycleStartDay: 1 } },
      categories: { create: DEFAULT_CATEGORIES.map((c) => ({ name: c.name, color: c.color })) },
    },
  });

  await createSession(user.id);
  redirect("/budget");
}

export async function login(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  // Message générique volontaire : ne pas indiquer si c'est l'email ou le
  // mot de passe qui est incorrect (évite l'énumération de comptes).
  const invalidCredentials = { error: "Email ou mot de passe invalide." };
  if (!parsed.success) return invalidCredentials;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return invalidCredentials;

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return invalidCredentials;

  await createSession(user.id);
  redirect("/budget");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
