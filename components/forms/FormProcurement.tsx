"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type PurchaseType = "UNIT" | "BULK" | "KG";

interface NewItem {
  existingProductId?: number;
  newProduct?: { name: string; category: string; grade: "A" | "B" | "REJECT" };
  qtyOrKg: number;
  buyPrice: number;
}

export default function FormProcurement({
  onCreated,
  onCancel,
}: {
  onCreated?: (p: any) => void;
  onCancel?: () => void;
}) {
  const { token } = useAuth();

  const [supplier, setSupplier] = useState("");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("UNIT");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");

  const [items, setItems] = useState<NewItem[]>([
    {
      qtyOrKg: 1,
      buyPrice: 0,
      newProduct: { name: "", category: "", grade: "A" },
    },
  ]);
  const [loading, setLoading] = useState(false);

  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, ""),
    []
  );
  const URL = `${API_BASE}/api/procurements`;

  const totalSubtotal = items.reduce(
    (s, it) => s + Number(it.qtyOrKg || 0) * Number(it.buyPrice || 0),
    0
  );

  const addItem = () =>
    setItems((p) => [
      ...p,
      {
        qtyOrKg: 1,
        buyPrice: 0,
        newProduct: { name: "", category: "", grade: "A" },
      },
    ]);

  const updateItem = (i: number, v: Partial<NewItem>) =>
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, ...v } : it)));

  const removeItem = (i: number) =>
    setItems((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const removeLastItem = () =>
    setItems((p) => (p.length > 1 ? p.slice(0, -1) : p));

  const canRemove = items.length > 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return toast.error("Anda harus login.");
    if (!items.length) return toast.error("Minimal 1 item.");

    setLoading(true);
    try {
      const payload = {
        supplier: supplier || undefined,
        purchaseType,
        occurredAt,
        note: note || undefined,
        items: items.map((it) => ({
          productId: it.existingProductId || undefined,
          newProduct: it.existingProductId ? undefined : it.newProduct,
          qtyOrKg: Number(it.qtyOrKg),
          buyPrice: Number(it.buyPrice),
        })),
      };

      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Gagal menyimpan");
      const out = await res.json();
      toast.success("Pembelian tersimpan");
      onCreated?.(out);
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  }

  const card = "card bg-base-200/20 border border-white/10 shadow-lg";
  const body = "card-body";
  const input = "input input-bordered bg-base-200/20 border-white/10 w-full";
  const select = "select select-bordered bg-base-200/20 border-white/10 w-full";

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* HEADER FORM (judul kiri + tombol Tutup kanan atas) */}
      <div className={card}>
        <div className={`${body} pb-2`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Pembelian Baru</h2>
              <p className="text-sm text-slate-400">
                Catat pembelian langsung untuk menambah stok produk.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onCancel}
            >
              Tutup
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Supplier</span>
              </label>
              <input
                className={input}
                placeholder="nama supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Jenis Pembelian</span>
              </label>
              <select
                className={select}
                value={purchaseType}
                onChange={(e) =>
                  setPurchaseType(e.target.value as PurchaseType)
                }
              >
                <option value="UNIT">UNIT</option>
                <option value="BULK">BULK</option>
                <option value="KG">KG</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Tanggal</span>
              </label>
              <input
                type="date"
                className={input}
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="label">
              <span className="label-text">Catatan (opsional)</span>
            </label>
            <input
              className={input}
              placeholder="PO/No nota/keterangan"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className={card}>
        <div className={body}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Item</h3>
            <div className="text-sm opacity-70">
              Total Modal:{" "}
              <span className="font-medium">
                Rp {totalSubtotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((it, idx) => {
              const isExisting = Boolean(it.existingProductId);
              return (
                <div
                  key={idx}
                  className="relative rounded-xl border border-white/10 bg-base-200/10 p-3"
                >
                  {/* Tombol Hapus di pojok kanan atas item */}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={!canRemove}
                    title={canRemove ? "Hapus item ini" : "Minimal 1 item"}
                    className="absolute right-2 top-2 btn btn-error btn-xs text-white inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>

                  <div className="grid md:grid-cols-12 gap-3">
                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-400 mb-1">
                        ID (opsional)
                      </div>
                      <input
                        type="number"
                        min={1}
                        className={input}
                        placeholder="ID produk"
                        value={it.existingProductId ?? ""}
                        onChange={(e) =>
                          updateItem(idx, {
                            existingProductId: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>

                    <div className="md:col-span-4">
                      <div className="text-xs text-slate-400 mb-1">
                        Nama baru
                      </div>
                      <input
                        disabled={isExisting}
                        className={input}
                        placeholder="Nama produk"
                        value={it.newProduct?.name || ""}
                        onChange={(e) =>
                          updateItem(idx, {
                            newProduct: {
                              ...(it.newProduct || {
                                name: "",
                                category: "",
                                grade: "A",
                              }),
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-xs text-slate-400 mb-1">
                        Kategori
                      </div>
                      <input
                        disabled={isExisting}
                        className={input}
                        placeholder="Kategori"
                        value={it.newProduct?.category || ""}
                        onChange={(e) =>
                          updateItem(idx, {
                            newProduct: {
                              ...(it.newProduct || {
                                name: "",
                                category: "",
                                grade: "A",
                              }),
                              category: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-xs text-slate-400 mb-1">Grade</div>
                      <select
                        disabled={isExisting}
                        className={select}
                        value={it.newProduct?.grade || "A"}
                        onChange={(e) =>
                          updateItem(idx, {
                            newProduct: {
                              ...(it.newProduct || {
                                name: "",
                                category: "",
                                grade: "A",
                              }),
                              grade: e.target.value as any,
                            },
                          })
                        }
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="REJECT">REJECT</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-400 mb-1">Qty/Kg</div>
                      <input
                        type="number"
                        min={1}
                        className={input}
                        value={it.qtyOrKg}
                        onChange={(e) =>
                          updateItem(idx, { qtyOrKg: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-400 mb-1">
                        Harga Beli
                      </div>
                      <input
                        type="number"
                        min={0}
                        className={input}
                        value={it.buyPrice}
                        onChange={(e) =>
                          updateItem(idx, { buyPrice: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end">
                      <div className="text-sm opacity-70">Subtotal</div>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <div className="font-medium">
                        Rp{" "}
                        {(
                          Number(it.qtyOrKg || 0) * Number(it.buyPrice || 0)
                        ).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addItem}
              >
                + Tambah Item
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={removeLastItem}
                disabled={!canRemove}
                title={canRemove ? "Hapus item terakhir" : "Minimal 1 item"}
              >
                − Kurangi Item
              </button>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${loading ? "btn-disabled" : ""}`}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
