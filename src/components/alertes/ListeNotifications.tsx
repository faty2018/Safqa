"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { NotificationAlerte } from "@/lib/types";
import { marquerNotificationLue } from "@/lib/actions/notifications";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ListeNotifications({ notifications }: { notifications: NotificationAlerte[] }) {
    const [isPending, startTransition] = useTransition();

    if (notifications.length === 0) {
        return (
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[var(--color-muted)]">Aucune notification pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-white">
            {notifications.map((notif) => (
                <Link
                    key={notif.id}
                    href={`/recherche/${notif.aoId}`}
                    onClick={() => {
                        if (!notif.lu) startTransition(() => marquerNotificationLue(notif.id));
                    }}
                    className={`flex items-start justify-between gap-4 p-4 hover:bg-[var(--background)] ${!notif.lu ? "bg-blue-50/50" : ""
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {!notif.lu && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />}
                        <div>
                            <p className="text-sm font-medium">{notif.titre}</p>
                            {notif.message && (
                                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{notif.message}</p>
                            )}
                        </div>
                    </div>
                    {/* <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDate(notif.createdAt)}</span> */}
                    <span className="shrink-0 text-xs text-[var(--color-muted)]">
                        {/* {formatDate(notif.createdAt)} */}
                        {notif.dateLimiteOffre && (
                            <span className="ml-2 font-medium text-amber-600">
                                Publié le {new Date(notif.dateLimiteOffre).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        )}
                    </span>
                </Link>
            ))}
        </div>
    );
}