"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthActionState } from "@/lib/actions/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Créer un compte</h1>
        <p className="text-muted mb-6 text-sm">Ton espace Bank, privé et indépendant.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <Field>
            Email
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field>
            Mot de passe
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>

          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Création…" : "Créer mon compte"}
          </Button>
        </form>

        <p className="text-muted mt-6 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Se connecter
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
