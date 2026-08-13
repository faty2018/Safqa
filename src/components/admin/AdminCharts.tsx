"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COULEURS_STATUT = ["#d97706", "#2563eb", "#16a34a"]; // amber, blue, green

export function CollecteChart({
  data,
}: {
  data: { date: string; ao: number }[];
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-[var(--color-navy)]">
        AO collectés (14 derniers jours)
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="ao"
            stroke="var(--color-navy)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DemandesStatutChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-[var(--color-navy)]">
        Demandes experts par statut
      </p>
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-muted)]">
          Aucune demande pour le moment.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COULEURS_STATUT[i % COULEURS_STATUT.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}