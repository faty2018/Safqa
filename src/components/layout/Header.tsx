"use client";

import Link from "next/link";
import { Search, Bell, Headset, LogOut } from "lucide-react";

interface HeaderProps {
  companyName: string;
  userName: string;
  nombreNotificationsNonLues?: number;
}

export function Header({ companyName, userName, nombreNotificationsNonLues = 0 }: HeaderProps) {
  async function handleSignOut() {
    await fetch("/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
      <div className="flex w-96 items-center gap-2 rounded-md  border-[var(--color-border)] px-3 py-2">

      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/assistance-experts"
          aria-label="Assistance experts"
          className="text-[var(--color-muted)] hover:text-[var(--color-navy)]"
        >
          <Headset size={20} />
        </Link>
        <Link
          href="/alertes"
          aria-label="Notifications"
          className="relative text-[var(--color-muted)] hover:text-[var(--color-navy)]"
        >
          <Bell size={20} />
          {nombreNotificationsNonLues > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {nombreNotificationsNonLues > 9 ? "9+" : nombreNotificationsNonLues}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-medium text-white">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-[var(--color-muted)]">{companyName}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Se déconnecter"
            className="ml-2 text-[var(--color-muted)] hover:text-[var(--color-navy)]"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}