"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Headset,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/entreprises", label: "Entreprises", icon: Building2 },
  { href: "/admin/appels-offres", label: "Appels d'offres", icon: FileText },
  { href: "/admin/assistance-experts", label: "Assistance experts", icon: Headset },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-white">
      <div className="px-5 py-5">
        <p className="text-lg font-semibold text-[var(--color-navy)]">Safqa</p>
        <p className="text-xs text-[var(--color-muted)]">Admin</p>
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
          href="/admin/parametres-plateforme"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname.startsWith("/admin/parametres-plateforme")
              ? "bg-[var(--color-navy)] text-white"
              : "text-gray-600 hover:bg-[var(--color-accent-light)]"
          }`}
        >
          <Settings size={18} />
          Paramètres plateforme
        </Link>
      </div>
    </aside>
  );
}