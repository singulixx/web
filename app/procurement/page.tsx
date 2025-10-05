"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import ReusableTable from "@/components/ui/ReusableTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormProcurement from "@/components/forms/FormProcurement";
import Alert from "@/components/Alert";
import SkeletonList from "@/components/ui/SkeletonList";
import Pagination from "@/components/ui/Pagination";

type PurchaseType = "UNIT" | "BULK" | "KG";

interface ProcurementItem {
  id: number;
  productId: number;
  qtyOrKg: number;
  buyPrice: number;
  subtotal: number;
}
interface ProcurementRow {
  id: number;
  supplier?: string | null;
  purchaseType: PurchaseType;
  occurredAt: string;
  items: ProcurementItem[];
  createdAt: string;
}

export default function Page() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { token } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ProcurementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; id?: number }>({
    open: false,
  });
  const [error, setError] = useState<string | null>(null);

  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, ""),
    []
  );
  const URL = `${API_BASE}/api/procurements?limit=${pageSize}&skip=${(page-1)*pageSize}`;

  const normalizeList = (raw: any): ProcurementRow[] => {
    if (Array.isArray(raw)) return raw as ProcurementRow[];
    if (raw?.data && Array.isArray(raw.data))
      return raw.data as ProcurementRow[];
    if (raw?.items && Array.isArray(raw.items))
      return raw.items as ProcurementRow[];
    return [];
  };

  const prettyType = (t: PurchaseType) =>
    t === "UNIT" ? "Per Pcs" : t === "BULK" ? "Borongan" : "Per Kg";

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        let msg = "Gagal memuat pembelian.";
        try {
          const e = await r.json();
          msg = e?.message || e?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = await r.json().catch(() => null);
      const _items = normalizeList(data);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Gagal memuat pembelian.");
      toast.error(e?.message || "Gagal memuat pembelian.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      toast.error("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = (id: number) => setConfirm({ open: true, id });

  const confirmDelete = async () => {
    if (!confirm.id || !token) return;
    try {
      const r = await fetch(`${URL}/${confirm.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        let msg = "Gagal menghapus pembelian.";
        try {
          const e = await r.json();
          msg = e?.message || e?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      toast.success("Pembelian dihapus. Stok dikembalikan otomatis.");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus.");
    } finally {
      setConfirm({ open: false, id: undefined });
    }
  };

  const columns = [
    { header: "ID", accessor: (r: ProcurementRow) => `#${r.id}` },
    {
      header: "Supplier",
      accessor: (r: ProcurementRow) =>
        r.supplier || <span className="opacity-60">-</span>,
    },
    {
      header: "Jenis Pembelian",
      accessor: (r: ProcurementRow) => (
        <span
          className={`badge ${
            r.purchaseType === "UNIT"
              ? "badge-info"
              : r.purchaseType === "BULK"
              ? "badge-warning"
              : "badge-success"
          }`}
        >
          {prettyType(r.purchaseType)}
        </span>
      ),
    },
    {
      header: "Tanggal",
      accessor: (r: ProcurementRow) =>
        new Date(r.occurredAt).toLocaleDateString("id-ID"),
    },
    {
      header: "Jumlah Item",
      accessor: (r: ProcurementRow) => r.items?.length || 0,
    },
    {
      header: "Total Modal",
      accessor: (r: ProcurementRow) =>
        `Rp ${(r.items || [])
          .reduce((s, it) => s + (it.subtotal || 0), 0)
          .toLocaleString("id-ID")}`,
    },
    {
      header: "Aksi",
      className: "whitespace-normal align-top p-1",
      accessor: (r: ProcurementRow) => (
        <div className="grid gap-1 w-[96px]">
          <button
            onClick={() => handleDelete(r.id)}
            className="btn btn-danger btn-xs w-full"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  const card = "card bg-base-100 shadow";
  const body = "card-body";

  return (
    <div className="space-y-6">
      {/* Header atas halaman */}
      <div className={`${body} py-3`}>
        <div className="flex items-center justify-between">
          {!showForm && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowForm(true)}
            >
              + Pembelian Baru
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {!token && (
        <Alert message="Anda belum login. Silakan login untuk mengelola pembelian." />
      )}
      {error && <Alert message={error} />}

      {/* Form (dengan tombol Tutup di pojok kanan atas, dirender oleh komponen form) */}
      {showForm && (
        <div className={card}>
          <div className={body}>
            <FormProcurement
              onCreated={() => {
                setShowForm(false);
                toast.success("Pembelian tersimpan");
                load();
              }}
              onCancel={() => setShowForm(false)} // tombol "Tutup" di header form memanggil ini
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className={card}>
        <div className={body}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Riwayat Pembelian</h2>
            <span className="text-xs opacity-70">
              Total: {rows.length.toLocaleString("id-ID")}
            </span>
          </div>

          {loading ? (
            <SkeletonList rows={8} />
          ) : (
            <ReusableTable
              data={rows}
              columns={columns}
              loading={false}
              emptyMessage="Belum ada pembelian."
              rowKey="id"
            />
          )}
        </div>
      </div>

      {/* Dialog hapus */}
      <ConfirmDialog
        open={confirm.open}
        title="Hapus Pembelian?"
        message="Stok dari pembelian ini akan dikembalikan (rollback) otomatis."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onClose={() => setConfirm({ open: false })}
      />
    
<Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
</div>
  );
}