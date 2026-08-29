"use client";

import { useState } from "react";
import { DemandesStaffTable } from "./DemandesStaffTable";
import { Demande } from "@/app/types/assistance-experts";

export function AdminDemandesClient({
    demandesActives,
    demandesHistorique,
}: {
    demandesActives: Demande[];
    demandesHistorique: Demande[];
}) {
    const [onglet, setOnglet] = useState<"actives" | "historique">("actives");

    return (
        <div>
            <div className="mt-6 flex gap-2">
                <button
                    onClick={() => setOnglet("actives")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${onglet === "actives"
                            ? "bg-[var(--color-navy)] text-white"
                            : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]"
                        }`}
                >
                    Actives ({demandesActives.length})
                </button>
                <button
                    onClick={() => setOnglet("historique")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${onglet === "historique"
                            ? "bg-[var(--color-navy)] text-white"
                            : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]"
                        }`}
                >
                    Historique ({demandesHistorique.length})
                </button>
            </div>
            {onglet === "actives" ? (
                <DemandesStaffTable
                    key="actives"
                    demandesInitiales={demandesActives}
                    emptyMessage="Aucune demande active pour le moment."
                />
            ) : (
                <DemandesStaffTable
                    key="historique"
                    demandesInitiales={demandesHistorique}
                    emptyMessage="Aucune demande résolue pour le moment."
                />
            )}
        </div>
    );
}
