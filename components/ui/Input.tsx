import { type InputHTMLAttributes, type SelectHTMLAttributes, type LabelHTMLAttributes } from "react";
import clsx from "clsx";

export function Field({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx("flex flex-col gap-1 text-sm", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "glass-pill w-full rounded-2xl! px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "glass-pill w-full rounded-2xl! px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
