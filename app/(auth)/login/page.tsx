"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "@/lib/actions/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Connexion</h1>
        <p className="text-muted mb-6 text-sm">Accède à ton budget Bank.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <Field>
            Email
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field>
            Mot de passe
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>

          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>

        <p className="text-muted mt-6 text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-[var(--accent)]">
            Créer un compte
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
