"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Heart, LogOut } from "lucide-react";
import clsx from "clsx";
import { logout } from "@/lib/actions/auth";

const LINKS = [
  { href: "/budget", label: "Budget", icon: LayoutGrid },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

const PUBLIC_PATHS = ["/login", "/signup"];

export function Nav() {
  const pathname = usePathname();

  if (PUBLIC_PATHS.includes(pathname)) return null;

  return (
    <>
      <nav className="glass-pill fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 p-1 md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-0.5 rounded-full px-5 py-2 text-xs font-medium",
                active ? "bg-[var(--accent)] text-black" : "text-muted",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
        <form action={logout}>
          <button
            type="submit"
            className="text-muted flex flex-col items-center gap-0.5 rounded-full px-5 py-2 text-xs font-medium"
          >
            <LogOut size={18} />
            Sortir
          </button>
        </form>
      </nav>

      <aside className="glass-card fixed top-6 left-6 hidden h-[calc(100dvh-3rem)] w-56 flex-col gap-2 p-4 md:flex">
        <div className="mb-6 px-2 text-xl font-extrabold tracking-tight">Bank</div>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-[var(--accent)] text-black" : "text-muted hover:bg-white/10",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="text-muted flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </form>
      </aside>
    </>
  );
}
