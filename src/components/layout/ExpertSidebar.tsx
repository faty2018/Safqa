"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, History, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/expert/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/expert/mes-demandes", label: "Mes demandes", icon: ClipboardList },
  { href: "/expert/historique", label: "Historique", icon: History },
];

export function ExpertSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-white">
      <div className="px-5 py-5">
        <p className="text-lg font-semibold text-[var(--color-navy)]">Safqa</p>
        <p className="text-xs text-[var(--color-muted)]">Expert</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--color-navy)] text-white"
                  : "text-gray-600 hover:bg-[var(--color-accent-light)]"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <Link
          href="/expert/profil"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname.startsWith("/expert/profil")
              ? "bg-[var(--color-navy)] text-white"
              : "text-gray-600 hover:bg-[var(--color-accent-light)]"
          }`}
        >
          <User size={18} />
          Mon profil
        </Link>
      </div>
    </aside>
  );
}