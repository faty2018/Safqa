import { getNotifications } from "@/lib/actions/notifications";
import { ListeNotifications } from "@/components/alertes/ListeNotifications";
import { BoutonToutMarquerLu } from "@/components/alertes/BoutonToutMarquerLu";

export default async function AlertesPage() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Alertes & Notifications</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Restez informé des échéances et opportunités critiques.
          </p>
        </div>
        <BoutonToutMarquerLu />
      </div>

      <ListeNotifications notifications={notifications} />
    </div>
  );
}