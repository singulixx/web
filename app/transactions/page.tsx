"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import Alert from "@/components/Alert";
import ReusableTable from "@/components/ui/ReusableTable";
import SkeletonList from "@/components/ui/SkeletonList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormTransaction from "@/components/forms/FormTransaction";
import ShopeeQuickImport from "@/components/forms/ShopeeQuickImport";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

type Tx = {
  id: number;
  qty: number;
  unitPrice: number;
  occurredAt: string;
  channel: string;
  product?: { id: number; name: string } | null;
  store?: { id: number; name: string; type?: string } | null;
};

const CHANNEL_LABEL: Record<string, string> = {
  tiktok_manual: "TikTok Manual",
  offline: "Offline",
  shopee: "Shopee",
};

function fmtIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Page() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { token } = useAuth();

  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  // Store list for filters & Quick Import
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const params = useMemo(() => {
    const p: Record<string, any> = {};
    if (storeId) p.storeId = storeId;
    if (channel) p.channel = channel;
    if (from) p.from = from;
    if (to) p.to = to;
    if (q) p.q = q;
    return p;
  }, [storeId, channel, from, to, q]);

  const fetchStores = async () => {
    if (!token) return;
    try {
      const data = await api.Stores.list(token);
      setStores(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    // kalau belum login, kosongkan tabel + total
    if (!token) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      // ✅ panggil API sesuai signature di api.ts
      const data = (await api.Transactions.list({
        authToken: token,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        query: params,
      })) as { items: Tx[]; total: number };

      // ✅ set data & total sesuai bentuk {items,total}
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(
        Number.isFinite(data?.total as number)
          ? (data.total as number)
          : data?.items?.length ?? 0
      );
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error(error?.message || "Gagal mengambil data transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [token]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params, page]);

  const handleDelete = (id: number) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !targetId) return;
    try {
      await api.Transactions.remove(targetId, token);
      toast.success("Transaksi dihapus");
      fetchTransactions();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Gagal menghapus");
    } finally {
      setConfirmOpen(false);
      setTargetId(null);
    }
  };

  const columns = [
    {
      header: "Tanggal",
      accessor: (t: Tx) => new Date(t.occurredAt).toLocaleString("id-ID"),
    },
    { header: "Store", accessor: (t: Tx) => t.store?.name ?? "-" },
    {
      header: "Produk",
      accessor: (t: Tx) =>
        t.product ? (
          <Link className="link" href={`/produk/${t.product.id}`}>
            {t.product.name}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      header: "Channel",
      accessor: (t: Tx) => CHANNEL_LABEL[t.channel] ?? t.channel,
    },
    { header: "Qty", accessor: (t: Tx) => t.qty },
    { header: "Harga", accessor: (t: Tx) => fmtIDR(t.unitPrice) },
    {
      header: "Total",
      accessor: (t: Tx) => fmtIDR(Math.round(t.unitPrice * t.qty)),
    },
    {
      header: "Aksi",
      accessor: (t: Tx) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleDelete(t.id)}
            className="btn btn-primary px-2 py-1 rounded-md"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ] as const;

  return (
    <div className="space-y-4">
      {!token && (
        <Alert message="Anda belum login. Silakan login untuk melihat transaksi live." />
      )}

      {/* Quick Import Shopee */}
      <ShopeeQuickImport
        token={token}
        stores={stores as any}
        onImported={fetchTransactions}
      />

      {/* Form Create */}
      {!showTxForm ? (
        <button
          className="btn btn-primary mb-4"
          onClick={() => setShowTxForm(true)}
        >
          + Tambah Transaksi
        </button>
      ) : null}

      {showTxForm && (
        <div className="card bg-base-100 shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tambah Transaksi Manual</h2>
            <button
              className="btn btn-ghost"
              onClick={() => setShowTxForm(false)}
            >
              Tutup
            </button>
          </div>
          {token ? (
            <FormTransaction token={token} onSaved={fetchTransactions} />
          ) : (
            <p className="text-sm text-gray-500">
              Login untuk membuat transaksi.
            </p>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="card bg-base-100 shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm mb-1">Store</label>
            <select
              className="select select-bordered w-full"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">Semua</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Channel</label>
            <select
              className="select select-bordered w-full"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="tiktok_manual">TikTok Manual</option>
              <option value="offline">Offline</option>
              <option value="shopee">Shopee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Dari</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Sampai</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Cari</label>
            <input
              type="text"
              placeholder="Customer / Catatan"
              className="input input-bordered w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={fetchTransactions}
            className="px-3 py-2 bg-gray-800 text-white rounded-md"
          >
            Terapkan
          </button>
          <button
            onClick={() => {
              setStoreId("");
              setChannel("");
              setFrom("");
              setTo("");
              setQ("");
              setPage(1);
            }}
            className="px-3 py-2 border rounded-md"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Daftar Transaksi</h2>
        {loading ? (
          <SkeletonList rows={8} />
        ) : (
          <ReusableTable<Tx>
            data={items}
            columns={columns as any}
            loading={loading}
            emptyMessage="Belum ada transaksi"
            rowKey={(t) => t.id}
          />
        )}
      </div>

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini?"
      />

      {/* Reusable Pagination */}
      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
