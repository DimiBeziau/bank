"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { saveSettings } from "@/lib/actions/settings";
import type { SettingsDTO } from "@/lib/types";

export function SettingsCard({ settings }: { settings: SettingsDTO }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Réglages du mois"
      trigger={
        <Button variant="ghost" className="gap-2">
          <Settings2 size={16} />
          Réglages
        </Button>
      }
    >
      <form
        action={(formData) => {
          startTransition(async () => {
            await saveSettings(formData);
            setOpen(false);
          });
        }}
        className="flex flex-col gap-4"
      >
        <Field>
          Capital de départ du mois (€)
          <Input
            name="startingCapital"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.startingCapital}
            required
          />
        </Field>
        <Field>
          Jour de début de cycle
          <Input
            name="cycleStartDay"
            type="number"
            min={1}
            max={28}
            defaultValue={settings.cycleStartDay}
            required
          />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </Modal>
  );
}
