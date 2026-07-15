export default function AlertesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Alertes & Notifications</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Restez informé des échéances et opportunités critiques.
          </p>
        </div>
        <button className="text-sm text-[var(--color-accent)]">Tout marquer comme lu</button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm text-[var(--color-muted)]">
          TODO: fil chronologique — types &quot;echeance&quot;, &quot;mise_a_jour_marche&quot;,
          &quot;correspondance_ia&quot; (voir <code>AlertType</code> dans lib/types.ts).
        </p>
      </div>
    </div>
  );
}
