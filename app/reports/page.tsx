"use client";

import Alert from "@/components/Alert";
import { useAuth } from "@/lib/useAuth";
import api from "@/lib/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import ReusableTable from "@/components/ui/ReusableTable";
import { SkeletonChart } from "@/components/Skeletons";
import ReportFilters, { Filters } from "@/components/ReportFilters";
import { useNetworkWatcher } from "@/lib/useNetwork";
import { saveAs } from "./saveAs";
import { useEffect, useMemo, useState } from "react";
import { BarChannel, LineKpi } from "@/components/Charts";
import Pagination from "@/app/components/ui/Pagination";

type Charts = {
  salesByChannel: Record<string, number>;
  trendsDaily: Record<string, number>;
};

function unwrapEnvelope<T = any>(x: any): { data: T; total?: number } {
  if (x && typeof x === "object" && ("data" in x || "status" in x || "meta" in x)) {
    const data = x?.data ?? x?.items ?? x;
    const total =
      x?.meta?.total ??
      x?.total ??
      (Array.isArray(data) ? data.length : undefined);
    return { data, total };
  }
  return { data: x, total: Array.isArray(x) ? x.length : undefined };
}

export default function Page() {
  async function handleDeleteTx(id: number, token?: string | null) {
    if (!token) return alert("Not authorized");
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      const res = await fetch(`${api.API_BASE}/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      // reload list dengan reset page supaya trigger fetch
      setPage(1);
      setReloadFlag((x) => x + 1);
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus transaksi");
    }
  }

  const { token } = useAuth();
  useNetworkWatcher();

  // filters & UI state
  const [filters, setFilters] = useState<Filters>({});
  const [charts, setCharts] = useState<Charts | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  const [reloadFlag, setReloadFlag] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const exportCsv = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${api.API_BASE}/api/reports/export/transactions.csv?${new URLSearchParams(
          filters as any
        ).toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, "transactions.csv");
    } catch (e: any) {
      alert(e?.message || "Gagal export CSV");
    }
  };

  // Build query untuk transaksi (server-side pagination)
  const txQuery = useMemo(() => {
    const params = new URLSearchParams({
      ...(filters as any),
      q: search,
      sort: sortKey === "total" ? "totalPrice" : "occurredAt",
      dir: sortDir,
      limit: String(pageSize),
      skip: String((page - 1) * pageSize), // ganti ke "offset" jika backend pakai offset
    } as any);
    return params.toString();
  }, [filters, search, sortKey, sortDir, page]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const chartsUrl = `${api.API_BASE}/api/reports/charts?${new URLSearchParams(
          filters as any
        ).toString()}`;
        const txUrl = `${api.API_BASE}/api/transactions?${txQuery}`;

        const [chartsRes, txRes] = await Promise.all([
          fetch(chartsUrl, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(txUrl, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!chartsRes.ok) throw new Error(await chartsRes.text());
        if (!txRes.ok) throw new Error(await txRes.text());

        const chartsEnv = unwrapEnvelope<Charts>(await chartsRes.json());
        const txEnv = unwrapEnvelope<any[]>(await txRes.json());

        setCharts(chartsEnv.data ?? null);

        const list = Array.isArray(txEnv.data) ? txEnv.data : [];
        setTxs(list);
        setTotal(typeof txEnv.total === "number" ? txEnv.total : list.length);
      } catch (e: any) {
        setErr(typeof e?.message === "string" ? e.message : "Gagal memuat data laporan.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, filters, txQuery, reloadFlag]);

  // Chart: line (trends)
  const line = useMemo(() => {
    if (!charts) return [];
    return Object.entries(charts.trendsDaily || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, v]) => ({ name: d.slice(5), value: v }));
  }, [charts]);

  // Chart: bar (per platform)
  const bar = useMemo(() => {
    if (!charts) return [];
    const agg: Record<string, number> = {};
    Object.entries(charts.salesByChannel || {}).forEach(([key, val]) => {
      const platform = key.split("-")[0];
      agg[platform] = (agg[platform] || 0) + (val || 0);
    });
    return Object.keys(agg).map((platform) => ({
      name: platform,
      [platform]: agg[platform],
    }));
  }, [charts]);

  return (
    <div className="space-y-6">
      <LoadingOverlay show={loading && !!token} text="Memuat laporan..." />

      {token && (
        <ReportFilters
          value={filters}
          onChange={(v) => {
            setFilters(v);
            setPage(1); // reset halaman saat filter berubah
          }}
        />
      )}

      {!token && (
        <Alert message="Anda belum login. Data di bawah adalah template. Silakan login untuk data live." />
      )}
      {err && <Alert message={err} />}

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Laporan</h2>
            <p className="text-sm text-slate-400">Grafik & export laporan</p>
          </div>
          {token && (
            <button className="btn btn-primary" onClick={exportCsv}>
              Export CSV
            </button>
          )}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="text-sm text-slate-300 mb-2">Tren Penjualan (harian)</h3>
            {loading && token ? <SkeletonChart /> : <LineKpi data={line} />}
          </div>
          <div>
            <h3 className="text-sm text-slate-300 mb-2">Penjualan per Channel</h3>
            {loading && token ? <SkeletonChart /> : <BarChannel data={bar} />}
          </div>
        </div>

        {/* Controls list */}
        <div className="flex items-center gap-2 mt-6">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari produk/pelanggan/catatan..."
            className="input w-full md:w-80"
          />
          <select
            className="input"
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="date">Sort: Tanggal</option>
            <option value="total">Sort: Total</option>
          </select>
          <select
            className="input"
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        {/* Tabel: langsung pakai data dari server (tanpa slice client-side) */}
        <div className="mt-4">
          <ReusableTable
            data={txs}
            rowKey={(t: any) => t.id}
            columns={[
              {
                header: "Tanggal",
                accessor: (t: any) => new Date(t.occurredAt).toLocaleString("id-ID"),
              },
              { header: "Produk", accessor: (t: any) => t.product?.name || "-" },
              { header: "Qty", accessor: (t: any) => t.qty },
              {
                header: "Harga",
                accessor: (t: any) =>
                  `Rp ${Intl.NumberFormat("id-ID").format(
                    Math.round(t.unitPrice || 0)
                  )}`,
              },
              {
                header: "Total",
                accessor: (t: any) => {
                  const subtotal = t.qty * (t.unitPrice ?? 0);
                  const total = (t.totalPrice ?? subtotal) || 0; // hindari ?? + || tanpa kurung
                  return `Rp ${Intl.NumberFormat("id-ID").format(Math.round(total))}`;
                },
              },
              { header: "Store", accessor: (t: any) => t.store?.name || "-" },
              {
                header: "Aksi",
                accessor: (t: any) => (
                  <button
                    className="btn btn-xs"
                    onClick={() => handleDeleteTx(t.id, token)}
                  >
                    Hapus
                  </button>
                ),
              },
            ]}
            emptyMessage="Belum ada transaksi."
          />
        </div>

        {/* Pagination sederhana */}
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
