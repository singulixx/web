"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Store = { id: number; name: string; type?: string };
type PreviewTx = {
  orderId?: string | number;
  occurredAt: string;
  productName: string;
  qty: number;
  unitPrice: number;
  total?: number;
};

interface Props {
  token: string | null;
  stores: Store[];
  onImported?: () => void;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * Shopee Quick Import
 * - Pilih store bertipe SHOPEE
 * - Pick date range
 * - Preview (dryRun) -> Commit
 * Endpoint utama yang dicoba:
 *   POST /api/channelss/:id/import-transactions?from=&to=&dryRun=true|false
 * Fallback (jika 404):
 *   POST /api/transactions/shopee/import  (body: { storeId, from, to, dryRun })
 */
export default function ShopeeQuickImport({ token, stores, onImported }: Props) {
  const shopeeStores = useMemo(() => (stores || []).filter(s => (s.type || "").toUpperCase() === "SHOPEE"), [stores]);
  const [storeId, setStoreId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewTx[] | null>(null);

  const hasSelection = storeId && from && to;

  async function callPrimary(dryRun: boolean) {
    const url = `${BASE}/api/channelss/${storeId}/import-transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${dryRun ? "&dryRun=true" : ""}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`Primary endpoint error ${res.status}`);
    return res.json();
  }

  async function callFallback(dryRun: boolean) {
    const url = `${BASE}/api/transactions/shopee/import`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storeId: Number(storeId), from, to, dryRun }),
    });
    if (!res.ok) throw new Error(`Fallback endpoint error ${res.status}`);
    return res.json();
  }

  function mapPreview(data: any): PreviewTx[] {
    // Try several shapes defensively
    const arr = Array.isArray(data) ? data
      : Array.isArray(data?.items) ? data.items
      : Array.isArray(data?.transactions) ? data.transactions
      : [];
    return arr.map((it: any) => ({
      orderId: it.orderId ?? it.id ?? it.order_no,
      occurredAt: it.occurredAt ?? it.time ?? it.createdAt ?? new Date().toISOString(),
      productName: it.productName ?? it.product?.name ?? it.item_name ?? "(produk)",
      qty: Number(it.qty ?? it.quantity ?? 1),
      unitPrice: Number(it.unitPrice ?? it.price ?? 0),
      total: Number(it.unitPrice ?? it.price ?? 0) * Number(it.qty ?? it.quantity ?? 1),
    }));
  }

  async function doPreview() {
    if (!hasSelection) {
      toast.error("Pilih store Shopee dan rentang tanggal");
      return;
    }
    setLoading(true);
    try {
      let data: any;
      try {
        data = await callPrimary(true);
      } catch (e) {
        data = await callFallback(true);
      }
      const pv = mapPreview(data);
      if (!pv.length) {
        toast.warning("Tidak ada transaksi yang ditemukan untuk rentang ini.");
      }
      setPreview(pv);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Gagal preview import");
    } finally {
      setLoading(false);
    }
  }

  async function doCommit() {
    if (!hasSelection) return;
    setLoading(true);
    try {
      try {
        await callPrimary(false);
      } catch (e) {
        await callFallback(false);
      }
      toast.success("Import Shopee berhasil");
      setPreview(null);
      setFrom("");
      setTo("");
      setStoreId("");
      if (onImported) onImported();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Gagal import Shopee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card bg-white shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Quick Import Shopee</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm mb-1">Store Shopee</label>
          <select className="select select-bordered w-full" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="">Pilih Store</option>
            {shopeeStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Dari</label>
          <input type="date" className="input input-bordered w-full" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Sampai</label>
          <input type="date" className="input input-bordered w-full" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={doPreview} disabled={loading || !hasSelection} className="px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50">Preview</button>
          <button onClick={doCommit} disabled={loading || !preview?.length} className="px-3 py-2 border rounded-md disabled:opacity-50">Commit</button>
        </div>
      </div>

      {preview && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Preview ({preview.length} transaksi)</h4>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Tanggal</th>
                  <th>Produk</th>
                  <th>Qty</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, idx) => (
                  <tr key={idx}>
                    <td>{String(p.orderId ?? "-")}</td>
                    <td>{new Date(p.occurredAt).toLocaleString("id-ID")}</td>
                    <td>{p.productName}</td>
                    <td>{p.qty}</td>
                    <td>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.unitPrice)}</td>
                    <td>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format((p.total ?? (p.unitPrice * p.qty)))}</td>
                  </tr>
                ))}
                {!preview.length && (
                  <tr><td colSpan={6} className="text-center py-4">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
