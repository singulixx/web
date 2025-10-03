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

  // Fallback dummy (hanya saat belum login)
  const gradeDataDummy = [
    { name: "Grade A", value: 58 },
    { name: "Grade B", value: 32 },
    { name: "Reject", value: 10 },
  ];
  const kpiDummy = [
    { name: "M", value: 12000000 },
    { name: "S", value: 8000000 },
    { name: "R", value: 9500000 },
    { name: "K", value: 14000000 },
    { name: "J", value: 18000000 },
  ];
  const channelDummy = [
    { name: "Shopee", Shopee: 12, TikTok: 9, Offline: 6 },
    { name: "Tokopedia", Shopee: 18, TikTok: 7, Offline: 4 },
  ];

  useEffect(() => {
    (async () => {
      if (!token) return; // keep template kalau belum login
      setLoading(true);
      setErr(null);
      try {
        const qs = new URLSearchParams(filters as any).toString();
        const [sRes, cRes] = await Promise.all([
          fetch(`${api.API_BASE}/api/reports/summary?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${api.API_BASE}/api/reports/charts?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!sRes.ok) throw new Error(await sRes.text());
        if (!cRes.ok) throw new Error(await cRes.text());
        const sJson = await sRes.json();
        const cJson = await cRes.json();
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
  }, [token, filters]); // ✅ refetch saat filter berubah

  const gradeData = useMemo(() => {
    if (!charts) return gradeDataDummy;
    // Derive dari supplierQuality: aproksimasi komposisi A/B
    const supplier = Array.isArray(charts?.supplierQuality)
      ? charts!.supplierQuality
      : [];
    const total = supplier.length;
    if (!total) return gradeDataDummy;
    const avgA = total
      ? supplier.reduce((acc: number, q: any) => acc + (q?.pctA ?? 0), 0) /
        total
      : 0;
    const avgB = total
      ? supplier.reduce((acc: number, q: any) => acc + (q?.pctB ?? 0), 0) /
        total
      : 0;
    const rej = Math.max(0, 1 - (avgA + avgB));
    return [
      { name: "Grade A", value: Math.round(avgA * 100) },
      { name: "Grade B", value: Math.round(avgB * 100) },
      { name: "Reject", value: Math.round(rej * 100) },
    ];
  }, [charts]);

  const kpi = useMemo(() => {
    if (!charts) return kpiDummy;
    // Tren harian -> Recharts line data
    const entries = Object.entries(charts?.trendsDaily || {}).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return entries.map(([d, v]) => ({ name: d.slice(5), value: v as number }));
  }, [charts]);

  const channel = useMemo(() => {
    if (!charts) return channelDummy;
    // Agregasi penjualan per platform
    const agg: Record<string, number> = {};
    Object.entries(charts?.salesByChannel || {}).forEach(([key, val]) => {
      const platform = key.split("-")[0];
      agg[platform] = (agg[platform] || 0) + (Number(val) || 0);
    });
    return Object.keys(agg).map((platform) => ({
      name: platform,
      [platform]: agg[platform],
    }));
  }, [charts]);

  return (
    <div className="space-y-6">
      <LoadingOverlay show={loading && !!token} text="Memuat dashboard..." />
      {token && <ReportFilters value={filters} onChange={setFilters} />}
      {!token && (
        <Alert message="Anda belum login. Data di bawah adalah template. Silakan login untuk data live." />
      )}
      {err && <Alert message={err} />}

      <div className="grid md:grid-cols-4 gap-4">
        {loading && token ? (
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

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-slate-300 mb-2">
            Tren Penjualan (harian)
          </h3>
          {loading && token ? <SkeletonChart /> : <LineKpi data={kpi} />}
        </div>
        <div>
          <h3 className="text-sm text-slate-300 mb-2">Persentase Grade</h3>
          {loading && token ? <SkeletonChart /> : <PieGrade data={gradeData} />}
        </div>
      </div>

      <div>
        <h3 className="text-sm text-slate-300 mb-2">Penjualan per Channel</h3>
        {loading && token ? <SkeletonChart /> : <BarChannel data={channel} />}
      </div>
    </div>
  );
}
