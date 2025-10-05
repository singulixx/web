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
import Pagination from "@/components/ui/Pagination";

type Charts = {
  salesByChannel: Record<string, number>;
  trendsDaily: Record<string, number>;
};

function unwrapEnvelope<T = any>(x: any): { data: T; total?: number } {
  if (
    x &&
    typeof x === "object" &&
    ("data" in x || "status" in x || "meta" in x)
  ) {
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
      // reload list quickly by updating page state (trigger useEffect)
      setPage(1); // reset to first page
      setReloadFlag((x) => x + 1);
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus transaksi");
    }
  }

  const { token } = useAuth();
  useNetworkWatcher();
  const [filters, setFilters] = useState<Filters>({});
  const [charts, setCharts] = useState<Charts | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const exportCsv = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${
          api.API_BASE
        }/api/reports/export/transactions.csv?${new URLSearchParams(
          filters as any
        ).toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, "transactions.csv");
    } catch (e: any) {
      alert(e?.message || "Gagal export CSV");
    }
  };

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const [chartsRes, txRes] = await Promise.all([
          fetch(
            `${api.API_BASE}/api/reports/charts?${new URLSearchParams(
              filters as any
            ).toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${api.API_BASE}/api/transactions?${new URLSearchParams({
              ...(filters as any),
              q: search,
              sort: sortKey === "total" ? "totalPrice" : "occurredAt",
              dir: sortDir,
              limit: String(pageSize),
              skip: String((page - 1) * pageSize),
            }).toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);
        if (!chartsRes.ok) throw new Error(await chartsRes.text());
        if (!txRes.ok) throw new Error(await txRes.text());
        const chartsEnv = unwrapEnvelope(await chartsRes.json());
        const txEnv = unwrapEnvelope(await txRes.json());
        setCharts(chartsEnv.data as any);
        setTxs(Array.isArray(txEnv.data) ? txEnv.data : []);
        setTotal(
          typeof txEnv.total === "number"
            ? txEnv.total
            : Array.isArray(txEnv.data)
            ? txEnv.data.length
            : 0
        );
      } catch (e: any) {
        setErr(
          typeof e?.message === "string"
            ? e.message
            : "Gagal memuat data laporan."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token, filters, search, sortKey, sortDir, page]);

  const line = useMemo(() => {
    if (!charts) return [];
    return Object.entries(charts?.trendsDaily || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, v]) => ({ name: d.slice(5), value: v }));
  }, [charts]);

  const sortedFiltered = useMemo(() => {
    const filtered = txs.filter((t) => {
      if (!search) return true;
      const hay = `${t.product?.name || ""} ${t.customer || ""} ${
        t.note || ""
      }`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
    const sorted = [...filtered].sort((a, b) => {
      const av =
        sortKey === "total"
          ? a.totalPrice || a.qty * (a.unitPrice || 0) || 0
          : new Date(a.occurredAt).getTime();
      const bv =
        sortKey === "total"
          ? b.totalPrice || b.qty * (b.unitPrice || 0) || 0
          : new Date(b.occurredAt).getTime();
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [txs, search, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedFiltered.slice(start, start + pageSize);
  }, [sortedFiltered, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const bar = useMemo(() => {
    if (!charts) return [];
    const agg: Record<string, number> = {};
    Object.entries(charts?.salesByChannel || {}).forEach(([key, val]) => {
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
      {token && <ReportFilters value={filters} onChange={setFilters} />}
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
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="text-sm text-slate-300 mb-2">
              Tren Penjualan (harian)
            </h3>
            {loading && token ? <SkeletonChart /> : <LineKpi data={line} />}
          </div>
          <div>
            <h3 className="text-sm text-slate-300 mb-2">
              Penjualan per Channel
            </h3>
            {loading && token ? <SkeletonChart /> : <BarChannel data={bar} />}
          </div>
        </div>

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
            onChange={(e) => setSortKey(e.target.value as any)}
          >
            <option value="date">Sort: Tanggal</option>
            <option value="total">Sort: Total</option>
          </select>
          <select
            className="input"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as any)}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="mt-4">
          <ReusableTable
            data={paged} // pakai hasil paginasi
            rowKey={(t: any) => t.id} // atau rowKey="id" kalau ReusableTable mendukung string key
            columns={[
              {
                header: "Tanggal",
                accessor: (t: any) =>
                  new Date(t.occurredAt).toLocaleString("id-ID"),
              },
              {
                header: "Produk",
                accessor: (t: any) => t.product?.name || "-",
              },
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
                accessor: (t: any) =>
                  `Rp ${Intl.NumberFormat("id-ID").format(
                    Math.round(t.totalPrice || t.qty * (t.unitPrice || 0) || 0)
                  )}`,
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

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <button
                className="btn"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    
<Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
</div>
  );
}