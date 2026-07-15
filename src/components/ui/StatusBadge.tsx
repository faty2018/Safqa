import type { TenderStatus } from "@/lib/types";

const STYLES: Record<TenderStatus, { label: string; text: string; bg: string }> = {
  nouveau: {
    label: "Nouveau",
    text: "text-[var(--color-status-new)]",
    bg: "bg-[var(--color-status-new-bg)]",
  },
  en_cours: {
    label: "En cours",
    text: "text-[var(--color-status-progress)]",
    bg: "bg-[var(--color-status-progress-bg)]",
  },
  cloture: {
    label: "Clôturé",
    text: "text-[var(--color-status-done)]",
    bg: "bg-[var(--color-status-done-bg)]",
  },
};

// Only ever these 3 states — matches the validated mockups.
// Resist the temptation to add a 4th ("urgent", etc.) here.
export function StatusBadge({ status }: { status: TenderStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.text} ${style.bg}`}
    >
      {style.label}
    </span>
  );
}
