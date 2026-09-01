import { type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95",
        variant === "primary" && "bg-[var(--accent)] text-black hover:brightness-95",
        variant === "ghost" && "glass-pill hover:bg-white/10",
        variant === "danger" && "bg-red-500/90 text-white hover:bg-red-500",
        className,
      )}
      {...props}
    />
  );
}
