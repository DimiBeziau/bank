"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, label, disabled }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        className="flex size-5 shrink-0 items-center justify-center rounded-md border border-white/30 bg-white/10 data-[state=checked]:bg-[var(--accent)]"
      >
        <RadixCheckbox.Indicator>
          <Check size={14} className="text-black" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label}
    </label>
  );
}
