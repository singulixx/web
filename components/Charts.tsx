"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full w-full grid place-items-center">
      <div className="text-xs text-slate-400 border border-dashed border-slate-700 rounded-lg px-3 py-6">
        {label}
      </div>
    </div>
  );
}

const GRADE_COLORS: Record<string, string> = {
  "Grade A": "#10b981",
  "Grade B": "#60a5fa",
  Reject: "#f87171",
};

const CHANNEL_COLORS: Record<string, string> = {
  Shopee: "#f97316",
  TikTok: "#06b6d4",
  Offline: "#84cc16",
};

export function LineKpi({ data }: { data: any[] }) {
  const safe = Array.isArray(data) ? data : [];
  return (
    <div className="card h-72">
      <ResponsiveContainer width="100%" height="100%">
        {safe.length === 0 ? (
          <EmptyChart label="Belum ada data tren" />
        ) : (
          <LineChart data={safe}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#b5bbc4"
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function PieGrade({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const safe = Array.isArray(data) ? data : [];
  return (
    <div className="card h-72">
      <ResponsiveContainer width="100%" height="100%">
        {safe.length === 0 ? (
          <EmptyChart label="Belum ada data grade" />
        ) : (
          <PieChart>
            <Pie
              data={safe}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
            >
              {safe.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={GRADE_COLORS[entry.name] || "#cbd5e1"}
                />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function BarChannel({ data }: { data: any[] }) {
  const safe = Array.isArray(data) ? data : [];
  const hasAny = safe.some((row) =>
    Object.keys(row).some((k) => k !== "name" && (row as any)[k])
  );
  return (
    <div className="card h-72">
      <ResponsiveContainer width="100%" height="100%">
        {!hasAny ? (
          <EmptyChart label="Belum ada data channel" />
        ) : (
          <BarChart data={safe}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Shopee" fill={CHANNEL_COLORS.Shopee} />
            <Bar dataKey="TikTok" fill={CHANNEL_COLORS.TikTok} />
            <Bar dataKey="Offline" fill={CHANNEL_COLORS.Offline} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
