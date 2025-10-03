"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

/* ---- Utils ---- */
function normalizeChannel(storeType?: string) {
  const t = String(storeType || "").toUpperCase();
  if (t === "TIKTOK") return "tiktok_manual";
  if (t === "OFFLINE") return "offline";
  if (t === "SHOPEE") return "shopee";
  return "";
}
function formatRupiah(n: number | string) {
  const num = typeof n === "string" ? Number(n) || 0 : n || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
function digitsOnly(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

/* ---- Types ---- */
interface FormTransactionProps {
  token: string | null;
  transaction?: any;
  onSaved: () => Promise<void> | void;
}

export default function FormTransaction({
  token,
  transaction,
  onSaved,
}: FormTransactionProps) {
  const [form, setForm] = useState<any>({
    storeId: "",
    productId: "",
    qtyStr: "1", // <<— simpan sebagai string saat input
    unitPrice: 0,
  });

  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [includeSortir, setIncludeSortir] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSortir = (p: any) =>
    !!(p?.ballCode || p?.ball?.code || p?.source === "SORTIR");
  const pickPrice = (p: any) => p?.pricePcs ?? p?.priceBulk ?? p?.priceKg ?? 0;

  /* Load data */
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          api.Stores.list({ authToken: token }),
          api.Products.list({ authToken: token }),
        ]);
        if (!mounted) return;
        setStores(Array.isArray(s) ? s : []);
        setProducts(Array.isArray(p) ? p : []);
      } catch (err) {
        console.error("Gagal memuat store/produk:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  /* Prefill edit */
  useEffect(() => {
    if (transaction) {
      setForm({
        storeId: transaction.storeId ?? "",
        productId: transaction.productId ?? "",
        qtyStr: String(transaction.qty ?? 1), // <<— jadi string
        unitPrice: Number(transaction.unitPrice ?? 0),
      });
    }
  }, [transaction]);

  const productsManual = products.filter(
    (p) => !isSortir(p) && (p.stock ?? 0) >= 0
  );
  const productsSortir = products.filter(
    (p) => isSortir(p) && (p.stock ?? 0) >= 0
  );

  /* Handlers */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "qtyStr") {
      // izinkan kosong, hanya digit
      const clean = digitsOnly(value);
      setForm((prev: any) => ({ ...prev, qtyStr: clean }));
      return;
    }

    if (name === "storeId") {
      setForm((prev: any) => ({ ...prev, storeId: value }));
      return;
    }

    if (name === "productId") {
      const prod = products.find((p) => String(p.id) === String(value));
      setForm((prev: any) => ({
        ...prev,
        productId: value,
        unitPrice: prev.unitPrice ? prev.unitPrice : pickPrice(prod),
      }));
      return;
    }

    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // konversi qty dari string -> number (tanpa leading zero issue)
    const qty = parseInt(form.qtyStr || "0", 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Qty harus angka dan > 0");
      return;
    }

    setLoading(true);
    try {
      const selected = stores.find(
        (s) => String(s.id) === String(form.storeId)
      );
      const ch = normalizeChannel(selected?.type);
      if (ch === "shopee") {
        toast.error(
          "Transaksi Shopee tidak bisa diinput manual. Gunakan fitur Import Shopee."
        );
        setLoading(false);
        return;
      }

      const payload: any = {
        storeId: Number(form.storeId),
        productId: Number(form.productId),
        qty,
        unitPrice: Number(form.unitPrice) || 0,
        channel: ch,
      };

      if (transaction) {
        await api.Transactions.update(transaction.id, payload, token as string);
      } else {
        await api.Transactions.create(payload, token as string);
      }

      toast.success("Transaksi berhasil disimpan");
      const r = onSaved?.();
      if (r instanceof Promise) await r;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Gagal menyimpan transaksi");
    } finally {
      setLoading(false);
    }
  };

  /* Render */
  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Store */}
      <div>
        <label className="block text-sm font-medium mb-1">Store</label>
        <select
          name="storeId"
          value={form.storeId}
          onChange={handleChange}
          className="select select-bordered w-full [color-scheme:dark]"
          required
        >
          <option value="">Pilih Store</option>
          {stores
            .filter((s: any) => String(s.type).toUpperCase() !== "SHOPEE")
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </div>

      {/* Channel */}
      <div>
        <label className="block text-sm font-medium mb-1">Channel</label>
        <input
          type="text"
          className="input input-bordered w-full bg-gray-100"
          value={
            normalizeChannel(
              stores.find((s) => String(s.id) === String(form.storeId))?.type
            ) || ""
          }
          readOnly
        />
      </div>

      {/* Produk + toggle sortir */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Produk</label>
          <label className="flex items-center gap-2 text-xs opacity-80">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={includeSortir}
              onChange={(e) => setIncludeSortir(e.target.checked)}
            />
            Termasuk produk hasil sortir
          </label>
        </div>

        <select
          name="productId"
          value={form.productId}
          onChange={handleChange}
          className="select select-bordered w-full [color-scheme:dark]"
          required
        >
          <option value="">Pilih Produk</option>
          <option value="" disabled>
            — Produk (Manual) — {productsManual.length} —
          </option>
          {productsManual.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.stock ? `• Stok ${p.stock}` : ""}
            </option>
          ))}
          {includeSortir && (
            <>
              <option value="" disabled>
                — Produk Hasil Sortir — {productsSortir.length} —
              </option>
              {productsSortir.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.grade} - {p.category}
                  {p.ballCode || p.ball?.code
                    ? ` - ${p.ballCode || p.ball?.code}`
                    : ""}{" "}
                  {p.stock ? `• Stok ${p.stock}` : ""}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Qty (text numeric agar tidak jadi 08) */}
      <div>
        <label className="block text-sm font-medium mb-1">Qty</label>
        <input
          type="text"
          name="qtyStr"
          inputMode="numeric"
          pattern="\d*"
          value={form.qtyStr}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="contoh: 8"
        />
      </div>

      {/* Harga Satuan */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Harga Satuan</label>
        <input
          type="text"
          name="unitPriceFormatted"
          inputMode="numeric"
          className="input input-bordered w-full"
          value={formatRupiah(form.unitPrice)}
          onChange={(e) => {
            const onlyDigits = digitsOnly(e.target.value);
            const num = onlyDigits ? Number(onlyDigits) : 0;
            setForm((prev: any) => ({ ...prev, unitPrice: num }));
          }}
          placeholder="Rp0"
          required
        />
      </div>

      {/* Submit */}
      <div className="md:col-span-2 flex justify-end pt-2">
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading
            ? "Menyimpan..."
            : transaction
            ? "Update Transaksi"
            : "Tambah Transaksi"}
        </button>
      </div>
    </form>
  );
}
