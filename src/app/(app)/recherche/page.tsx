import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deriveStatus, type AO, type TenderStatus } from "@/lib/types";
import { Building2, Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { FollowButton } from "@/components/ui/FollowButton";

const CATEGORIES = ["Travaux", "Fournitures", "Services"] as const;
const PAGE_SIZE = 6;

const CATEGORY_STYLES: Record<string, string> = {
  Travaux: "bg-amber-50 text-amber-700 border-amber-200",
  Fournitures: "bg-sky-50 text-sky-700 border-sky-200",
  Services: "bg-violet-50 text-violet-700 border-violet-200",
};

const STATUT_LABELS: Record<TenderStatus, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  cloture: "Clôturé",
};

interface SearchParamsShape {
  q?: string;
  categorie?: string;
  statut?: string;
  page?: string;
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categorie = params.categorie ?? "";
  const statut = params.statut ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = await createClient();

  const selectFields = categorie
    ? "id, reference, intitule, objet, acheteur_public, montant_estime, date_limite_remise_plis, lien_source, created_at, statut_analyse, ao_domaines!inner(domaines!inner(nom))"
    : "id, reference, intitule, objet, acheteur_public, montant_estime, date_limite_remise_plis, lien_source, created_at, statut_analyse";
  function applyFilters(q_: ReturnType<typeof supabase.from>) {
    let query = q_.select(selectFields, { count: "exact" });

    if (q) {
      query = query.or(`intitule.ilike.%${q}%,acheteur_public.ilike.%${q}%`);
    }
    if (categorie) {
      query = query.eq("ao_domaines.domaines.nom", categorie);
    }

    const now = new Date();
    const dans7Jours = new Date(now.getTime() + 7 * 86_400_000);
    if (statut === "cloture") {
      query = query.lt("date_limite_remise_plis", now.toISOString());
    } else if (statut === "en_cours") {
      query = query
        .gte("date_limite_remise_plis", now.toISOString())
        .lte("date_limite_remise_plis", dans7Jours.toISOString());
    } else if (statut === "nouveau") {
      query = query.or(
        `date_limite_remise_plis.gt.${dans7Jours.toISOString()},date_limite_remise_plis.is.null`
      );
    }

    return query;
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: rows, count } = await applyFilters(supabase.from("ao"))
    .order("date_limite_remise_plis", { ascending: true, nullsFirst: false })
    .range(from, to);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let suivisIds = new Set<string>();
  if (user) {
    const { data: profile } = await supabase
      .from("utilisateurs")
      .select("entreprise_id")
      .eq("id", user.id)
      .single();

    if (profile?.entreprise_id) {
      const { data: suivis } = await supabase
        .from("ao_suivis")
        .select("ao_id")
        .eq("entreprise_id", profile.entreprise_id);
      suivisIds = new Set((suivis ?? []).map((s) => s.ao_id));
    }
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const aoList: AO[] = (rows ?? []).map((row: any) => ({
    id: row.id,
    reference: row.reference,
    intitule: row.intitule,
    objet: row.objet,
    acheteurPublic: row.acheteur_public,
    montantEstime: row.montant_estime,
    dateLimiteRemisePlis: row.date_limite_remise_plis,
    lienSource: row.lien_source,
    createdAt: row.created_at,
    statutAnalyse: row.statut_analyse,
  }));

  const buildHref = (overrides: Partial<SearchParamsShape>) => {
    const next = { q, categorie, statut, page: String(page), ...overrides };
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.categorie) sp.set("categorie", next.categorie);
    if (next.statut) sp.set("statut", next.statut);
    if (next.page && next.page !== "1") sp.set("page", next.page);
    const qs = sp.toString();
    return qs ? `/recherche?${qs}` : "/recherche";
  };

  const resultLabel =
    total > 1
      ? `${total} appels d'offres trouvés sur le marché marocain.`
      : total === 1
        ? `1 appel d'offres trouvé sur le marché marocain.`
        : `Aucun appel d'offres trouvé.`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-navy)]">
          Recherche &amp; Filtrage
        </h1>
        <p className="text-sm text-[var(--color-muted)]">{resultLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filtres */}
        <aside className="lg:sticky lg:top-6 lg:h-fit lg:col-span-1 rounded-lg border border-[var(--color-border)] bg-white p-4">
          <form method="get" className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase text-[var(--color-muted)]">
                Recherche
              </label>
              <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-2">
                <Search size={15} className="shrink-0 text-[var(--color-muted)]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Intitulé, acheteur..."
                  className="w-full text-sm outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase text-[var(--color-muted)]">
                Catégorie
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={buildHref({ categorie: "", page: "1" })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${!categorie
                    ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-light)]"
                    }`}
                >
                  Toutes
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={buildHref({ categorie: cat, page: "1" })}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${categorie === cat
                      ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-light)]"
                      }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
              <input type="hidden" name="categorie" value={categorie} />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase text-[var(--color-muted)]">
                Statut
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={buildHref({ statut: "", page: "1" })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${!statut
                    ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-light)]"
                    }`}
                >
                  Tous
                </Link>
                {(["nouveau", "en_cours", "cloture"] as TenderStatus[]).map((s) => (
                  <Link
                    key={s}
                    href={buildHref({ statut: s, page: "1" })}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${statut === s
                      ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-light)]"
                      }`}
                  >
                    {STATUT_LABELS[s]}
                  </Link>
                ))}
              </div>
              <input type="hidden" name="statut" value={statut} />
              <input type="hidden" name="page" value="1" />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[var(--color-navy)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Appliquer les filtres
            </button>
            {(q || categorie || statut) && (
              <Link
                href="/recherche"
                className="block text-center text-xs text-[var(--color-muted)] hover:underline"
              >
                Réinitialiser
              </Link>
            )}
          </form>
        </aside>

        {/* Résultats */}
        <section className="lg:col-span-3">
          {aoList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-white py-16 text-center">
              <p className="text-sm font-medium text-[var(--color-navy)]">
                Aucun appel d&apos;offres ne correspond à ces critères
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Essayez d&apos;élargir votre recherche ou de réinitialiser les filtres.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {aoList.map((ao) => {
                  const status = deriveStatus(ao);
                  const rawRow = (rows ?? []).find((r: any) => r.id === ao.id) as any;
                  const nomCategorie: string | undefined =
                    rawRow?.ao_domaines?.[0]?.domaines?.nom;

                  return (
                    <article
                      key={ao.id}
                      className="flex flex-col rounded-lg border border-[var(--color-border)] bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        {nomCategorie ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[nomCategorie] ??
                              "border-[var(--color-border)] text-[var(--color-muted)]"
                              }`}
                          >
                            {nomCategorie}
                          </span>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={status} />
                          {ao.statutAnalyse === "terminee" && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              Analysé IA
                            </span>
                          )}
                          <FollowButton aoId={ao.id} initialFollowing={suivisIds.has(ao.id)} />
                        </div>
                      </div>

                      <Link href={`/recherche/${ao.id}`}>
                        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-navy)] hover:underline">
                          {ao.intitule}
                        </h3>
                      </Link>

                      <div className="mb-3 flex items-start gap-1.5 text-xs text-[var(--color-muted)]">
                        <Building2 size={13} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{ao.acheteurPublic}</span>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                        <div>
                          <p className="font-mono text-[11px] text-[var(--color-muted)]">
                            {ao.reference}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {ao.dateLimiteRemisePlis
                              ? `Limite : ${new Date(ao.dateLimiteRemisePlis).toLocaleDateString(
                                "fr-FR"
                              )}`
                              : "Date limite non renseignée"}
                          </p>
                        </div>
                        {ao.lienSource ? (
                          <a
                            href={ao.lienSource}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-[var(--color-navy)] hover:underline"
                          >
                            Voir <ExternalLink size={12} />
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-[var(--color-muted)]">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildHref({ page: String(Math.max(1, page - 1)) })}
                      aria-disabled={page <= 1}
                      className={`flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium ${page <= 1
                        ? "pointer-events-none opacity-40"
                        : "text-[var(--color-navy)] hover:bg-[var(--color-accent-light)]"
                        }`}
                    >
                      <ChevronLeft size={14} /> Précédent
                    </Link>
                    <Link
                      href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
                      aria-disabled={page >= totalPages}
                      className={`flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium ${page >= totalPages
                        ? "pointer-events-none opacity-40"
                        : "text-[var(--color-navy)] hover:bg-[var(--color-accent-light)]"
                        }`}
                    >
                      Suivant <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}