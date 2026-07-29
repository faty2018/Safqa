import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { GenererReponseButton } from "@/components/ui/GenererReponseButton";
import {
  Building2,
  ExternalLink,
  ChevronLeft,
  Wallet,
  Clock,
  Gauge,
  Check,
  CalendarClock,
  AlertTriangle,
  FileWarning,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface AnalyseJSON {
  resume?: string;
  exigences_cles?: string[];
  montant_estime?: string | null;
  delai_execution?: string | null;
  score_complexite?: "faible" | "moyen" | "eleve";
  dates_importantes?: string[];
}

const COMPLEXITE_STYLES: Record<string, string> = {
  faible: "bg-emerald-50 text-emerald-900",
  moyen: "bg-amber-50 text-amber-900",
  eleve: "bg-red-50 text-red-900",
};

export default async function AODetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ao, error } = await supabase
    .from("ao")
    .select(
      "id, reference, intitule, objet, acheteur_public, montant_estime, date_limite_remise_plis, lien_source, statut_analyse, analyse_resume, analyse_json"
    )
    .eq("id", id)
    .single();

  if (error || !ao) notFound();

  const analyse = ao.analyse_json as AnalyseJSON | null;

  return (
    <div className="space-y-6">
      <Link
        href="/recherche"
        className="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:underline"
      >
        <ChevronLeft size={14} /> Retour à la recherche
      </Link>

      {/* En-tête AO */}
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <h1 className="text-lg font-semibold text-[var(--color-navy)]">
          {ao.intitule}
        </h1>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
          <Building2 size={14} />
          <span>{ao.acheteur_public}</span>
        </div>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
          {ao.reference}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {ao.montant_estime && (
            <span>
              <strong>Montant :</strong> {ao.montant_estime}
            </span>
          )}
          {ao.date_limite_remise_plis && (
            <span>
              <strong>Date limite :</strong>{" "}
              {new Date(ao.date_limite_remise_plis).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>

        {ao.lien_source && (
          <a
            href={ao.lien_source}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)] hover:underline"
          >
            Voir sur le portail source <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Analyse IA */}
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Analyse IA
        </h2>

        {ao.statut_analyse === "terminee" && ao.analyse_resume ? (
          <div className="space-y-5">
            {/* Stats clés */}
            {(analyse?.montant_estime ||
              analyse?.delai_execution ||
              analyse?.score_complexite) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {analyse?.montant_estime && (
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <Wallet size={13} /> Montant estimé
                    </p>
                    <p className="text-base font-semibold text-emerald-900">
                      {analyse.montant_estime}
                    </p>
                  </div>
                )}
                {analyse?.delai_execution && (
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                      <Clock size={13} /> Délai d&apos;exécution
                    </p>
                    <p className="text-base font-semibold text-amber-900">
                      {analyse.delai_execution}
                    </p>
                  </div>
                )}
                {analyse?.score_complexite && (
                  <div
                    className={`rounded-xl p-3 ${
                      COMPLEXITE_STYLES[analyse.score_complexite] ??
                      "bg-sky-50 text-sky-900"
                    }`}
                  >
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium opacity-80">
                      <Gauge size={13} /> Complexité
                    </p>
                    <p className="text-base font-semibold capitalize">
                      {analyse.score_complexite}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Résumé */}
            <div className="rounded-md border-l-[3px] border-[var(--color-navy)] bg-[var(--color-accent-light)] px-4 py-3">
              <p className="mb-1.5 text-xs font-medium text-[var(--color-muted)]">
                Résumé
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-navy)]">
                {ao.analyse_resume}
              </p>
            </div>

            {/* Exigences clés */}
            {analyse?.exigences_cles && analyse.exigences_cles.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
                  Exigences clés
                </p>
                <div className="flex flex-col gap-1.5">
                  {analyse.exigences_cles.map((exigence, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md bg-[var(--color-accent-light)] px-2.5 py-2"
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />
                      <span className="text-sm leading-relaxed text-[var(--color-navy)]">
                        {exigence}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates importantes */}
            {analyse?.dates_importantes && analyse.dates_importantes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
                  Dates importantes
                </p>
                <div className="flex flex-col gap-1.5">
                  {analyse.dates_importantes.map((date, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md bg-[var(--color-accent-light)] px-2.5 py-2"
                    >
                      <CalendarClock
                        size={15}
                        className="mt-0.5 shrink-0 text-sky-600"
                      />
                      <span className="text-sm leading-relaxed text-[var(--color-navy)]">
                        {date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton pour générer la réponse */}
            <div className="border-t border-[var(--color-border)] pt-4">
              <GenererReponseButton aoId={ao.id} />
            </div>
          </div>
        ) : ao.statut_analyse === "echec" ? (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle size={15} className="shrink-0" />
            L&apos;analyse IA a échoué pour ce dossier.
          </div>
        ) : ao.statut_analyse === "non_analysable" ? (
          <div className="flex items-center gap-2 rounded-md bg-[var(--color-accent-light)] px-3 py-2.5 text-sm text-[var(--color-muted)]">
            <FileWarning size={15} className="shrink-0" />
            Ce dossier ne contient pas de document analysable.
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-[var(--color-accent-light)] px-3 py-2.5 text-sm text-[var(--color-muted)]">
            <Loader2 size={15} className="shrink-0" />
            Analyse en cours de traitement.
          </div>
        )}
      </div>
    </div>
  );
}