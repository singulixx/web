"use client";

import CardStat from "@/components/CardStat";
import Alert from "@/components/Alert";
import { PieGrade, LineKpi, BarChannel } from "@/components/Charts";
import { useAuth } from "@/lib/useAuth";
import api from "@/lib/api";
import { BarChart2, Package, Layers, ShoppingBag } from "lucide-react";
import { SkeletonCard, SkeletonChart } from "@/components/Skeletons";
import LoadingOverlay from "@/components/LoadingOverlay";
import ReportFilters, { Filters } from "@/components/ReportFilters";
import { useNetworkWatcher } from "@/lib/useNetwork";
import { useEffect, useMemo, useState } from "react";

type Summary = {
  totalBall: { unopened: number; opened: number; sorted: number };
  totalProducts: number;
  stock: { totalKg: number; totalQty: number };
  sales: { total: number; today: number; month: number };
};

type Charts = {
  modalVsOmset: { name: string; modal: number; omset: number }[];
  supplierQuality: { supplier: string; pctA: number; pctB: number }[];
  salesByChannel: Record<string, number>;
  trendsDaily: Record<string, number>;
  channels: { id: number; platform: string; label: string }[];
};

export default function Dashboard() {
  const { token } = useAuth();
  useNetworkWatcher();

  const [filters, setFilters] = useState<Filters>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Hooks harus selalu dipanggil, jangan di-bypass oleh return bersyarat
  useEffect(() => {
    (async () => {
      if (!token) return; // aman: hook tetap terpanggil, hanya logic-nya yang guard
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams(filters as any).toString();
        const [sRes, cRes] = await Promise.all([
          fetch(`${api.API_BASE}/api/reports/summary?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${api.API_BASE}/api/reports/charts?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);
        if (!sRes.ok) throw new Error(await sRes.text());
        if (!cRes.ok) throw new Error(await cRes.text());
        const sJson: Summary = await sRes.json();
        const cJson: Charts = await cRes.json();
        setSummary(sJson);
        setCharts(cJson);
      } catch (e: any) {
        setErr(
          typeof e?.message === "string"
            ? e.message
            : "Gagal memuat data dashboard."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token, filters]);

  // ✅ useMemo juga harus selalu dipanggil; datanya boleh kosong saat belum login
  const gradeData = useMemo(() => {
    if (!charts?.supplierQuality?.length) return [];
    const supplier = charts.supplierQuality;
    const total = supplier.length || 1;
    const avgA = supplier.reduce((acc, q) => acc + (q?.pctA ?? 0), 0) / total;
    const avgB = supplier.reduce((acc, q) => acc + (q?.pctB ?? 0), 0) / total;
    const rej = Math.max(0, 1 - (avgA + avgB));
    return [
      { name: "Grade A", value: Math.round(avgA * 100) },
      { name: "Grade B", value: Math.round(avgB * 100) },
      { name: "Reject", value: Math.round(rej * 100) },
    ];
  }, [charts]);

  const kpi = useMemo(() => {
    if (!charts?.trendsDaily) return [];
    const entries = Object.entries(charts.trendsDaily).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return entries.map(([d, v]) => ({
      name: d.slice(5),
      value: Number(v) || 0,
    }));
  }, [charts]);

  const channel = useMemo(() => {
    if (!charts?.salesByChannel) return [];
    const agg: Record<string, number> = {};
    Object.entries(charts.salesByChannel).forEach(([key, val]) => {
      const platform = key.split("-")[0];
      agg[platform] = (agg[platform] || 0) + (Number(val) || 0);
    });
    return Object.keys(agg).map((platform) => ({
      name: platform,
      [platform]: agg[platform],
    }));
  }, [charts]);

  // 🔻 Rendering dikondisikan di JSX, bukan memotong alur hooks dengan return di atas
  if (!token) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-3xl">
          <Alert message="Anda belum login. Silakan login untuk melihat dashboard." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LoadingOverlay show={loading} text="Memuat dashboard..." />
      <ReportFilters value={filters} onChange={setFilters} />
      {err && <Alert message={err} />}

      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">
        {loading || !summary ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <CardStat
              icon={<Layers size={18} />}
              title="Bal"
              value={`${
                (summary?.totalBall?.unopened ?? 0) +
                (summary?.totalBall?.opened ?? 0)
              }`}
            />
            <CardStat
              icon={<Package size={18} />}
              title="Produk"
              value={`${summary?.totalProducts ?? 0}`}
            />
            <CardStat
              icon={<ShoppingBag size={18} />}
              title="Stok (Qty)"
              value={`${summary?.stock?.totalQty ?? 0}`}
            />
            <CardStat
              icon={<BarChart2 size={18} />}
              title="Omzet Bulan Ini"
              value={`Rp ${Intl.NumberFormat("id-ID").format(
                summary?.sales?.month ?? 0
              )}`}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-slate-300 mb-2">
            Tren Penjualan (harian)
          </h3>
          {loading ? (
            <SkeletonChart />
          ) : kpi.length ? (
            <LineKpi data={kpi} />
          ) : (
            <Alert message="Belum ada data tren untuk rentang filter ini." />
          )}
        </div>
        <div>
          <h3 className="text-sm text-slate-300 mb-2">Persentase Grade</h3>
          {loading ? (
            <SkeletonChart />
          ) : gradeData.length ? (
            <PieGrade data={gradeData} />
          ) : (
            <Alert message="Belum ada data kualitas pemasok." />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm text-slate-300 mb-2">Penjualan per Channel</h3>
        {loading ? (
          <SkeletonChart />
        ) : channel.length ? (
          <BarChannel data={channel} />
        ) : (
          <Alert message="Belum ada data penjualan per channel." />
        )}
      </div>
    </div>
  );
}
