"use client";

import Alert from "@/components/Alert";
import { useEffect, useMemo, useState } from "react";
import FormProduk from "@/components/forms/FormProduk";
import { useAuth } from "@/lib/useAuth";
import ReusableTable from "@/components/ui/ReusableTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/app/components/ui/Pagination";

type Media = { id?: number; url: string; kind?: "IMAGE" | "DOCUMENT" };

interface Product {
  id: number;
  name: string;
  category: string;
  grade: "A" | "B" | "REJECT" | string;
  pricePcs: number | null;
  priceBulk: number | null;
  priceKg: number | null;
  stock: number;
  imageUrl?: string | null;
  media?: Media[];
  source?: "MANUAL" | "SORTIR";
  ballCode?: string | null;
  ball?: { code?: string } | null;
}

export default function Page() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { token } = useAuth();

  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, ""),
    []
  );
  const PRODUCTS_URL = `${API_BASE}/api/products`;
  const UPLOAD_URL = `${API_BASE}/api/upload`;

  const [items, setItems] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  /** Unwrap helper untuk segala bentuk respons */
  const unwrap = <T,>(raw: any, fallback: T): T => {
    if (raw == null) return fallback;
    if (Array.isArray(raw)) return raw as any as T;
    if (typeof raw === "object") {
      if ("data" in raw) return (raw as any).data as T;
      if ("items" in raw) return (raw as any).items as T;
    }
    return raw as any as T;
  };

  const normalizeProducts = (raw: any): Product[] => unwrap<Product[]>(raw, []);

  const getTotal = (raw: any, list: any[]): number => {
    if (
      raw &&
      typeof raw === "object" &&
      typeof (raw as any).total === "number"
    )
      return (raw as any).total as number;
    return Array.isArray(list) ? list.length : 0;
  };

  /** GET */
  const fetchProducts = async () => {
    if (!token) {
      setTotal(0);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${PRODUCTS_URL}?limit=${pageSize}&skip=${(page - 1) * pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        let errMsg = "Gagal mengambil data produk.";
        try {
          const errJson = await res.json();
          errMsg = errJson?.error || errMsg;
        } catch {
          const text = await res.text();
          if (text) console.error("Fetch products (non-JSON):", text);
        }
        throw new Error(errMsg);
      }

      const raw = await res.json().catch(() => null);
      /* total set later */
      const list = normalizeProducts(raw);
      setItems(list);
      setTotal(getTotal(raw, list));
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(error?.message || "Gagal mengambil data produk.");
      /* total set later */
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, PRODUCTS_URL, page]);

  /** CREATE/UPDATE */
  const submit = async (payload: {
    name: string;
    kategori: string;
    grade: "A" | "B" | "REJECT";
    hargaPcs?: number;
    hargaBorongan?: number;
    hargaKilo?: number;
    stock: number;
    images: File[];
  }) => {
    if (!token) {
      toast.error("Anda harus login untuk membuat/mengubah produk.");
      return;
    }

    setLoading(true);
    try {
      // Upload media jika ada
      const uploadedUrls: string[] = [];
      if (payload.images?.length) {
        for (const f of payload.images) {
          const fd = new FormData();
          fd.append("file", f);
          const up = await fetch(UPLOAD_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (!up.ok) {
            const err = await up.json().catch(() => ({}));
            throw new Error(err.error || "Gagal upload file");
          }
          const { url } = await up.json();
          uploadedUrls.push(url);
        }
      }

      const body = {
        name: payload.name,
        category: payload.kategori,
        grade: payload.grade,
        pricePcs: payload.hargaPcs ?? null,
        priceBulk: payload.hargaBorongan ?? null,
        priceKg: payload.hargaKilo ?? null,
        stock: payload.stock ?? 0,
        media: uploadedUrls.map((u) => ({
          url: u,
          kind: /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(u)
            ? "IMAGE"
            : "DOCUMENT",
        })),
      };

      if (editingProduct) {
        const res = await fetch(`${PRODUCTS_URL}/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal update produk");
        }
        const raw = await res.json().catch(() => null);
        const updated = unwrap<Product>(raw, editingProduct);

        // Pastikan bentuknya objek Product, bukan envelope
        /* total set later */
        setItems((prev) =>
          prev.map((x) => (x.id === updated.id ? updated : x))
        );
        setEditingProduct(null);
        setShowForm(false);
        toast.success("Produk berhasil diupdate!");
      } else {
        const res = await fetch(`${PRODUCTS_URL}?limit=${pageSize}&skip=${(page - 1) * pageSize}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal membuat produk");
        }
        const raw = await res.json().catch(() => null);
        const created = unwrap<Product>(raw, null as any);

        // Jika backend mengembalikan {status,data}, created = data (obj product)
        // kalau gagal unwrap, kita lakukan refetch saja
        if (created && typeof created === "object" && "id" in created) {
          /* total set later */
          setItems((prev) => [created, ...prev]);
        } else {
          await fetchProducts();
        }

        setShowForm(false);
        toast.success("Produk berhasil dibuat!");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menyimpan produk.");
    } finally {
      setLoading(false);
    }
  };

  /** DELETE */
  const handleDelete = (id: number) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetId || !token) {
      setConfirmOpen(false);
      return;
    }
    try {
      const res = await fetch(`${PRODUCTS_URL}/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menghapus produk");
      }
      /* total set later */
      setItems((prev) => prev.filter((x) => x.id !== targetId));
      toast.success("Produk berhasil dihapus!");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menghapus produk.");
    } finally {
      setConfirmOpen(false);
      setTargetId(null);
    }
  };

  // ---- Pemisahan data: manual vs hasil sortir ----
  const isSortir = (p: any) =>
    !!(p?.ballCode || p?.ball?.code || p?.source === "SORTIR");

  const baseItems: Product[] = Array.isArray(items) ? items : [];
  const itemsSortir = useMemo(() => baseItems.filter(isSortir), [baseItems]);
  const itemsManual = useMemo(
    () => baseItems.filter((p) => !isSortir(p)),
    [baseItems]
  );

  // Helper tampilan
  const rupiah = (n: number | null | undefined) =>
    n == null ? "-" : `Rp ${n.toLocaleString("id-ID")}`;

  const pickPrice = (p: Product) =>
    p.pricePcs ?? p.priceBulk ?? p.priceKg ?? null;

  const columns = [
    {
      header: "Media",
      accessor: (row: Product) => {
        const first = row?.media?.length
          ? row.media[0].url
          : row?.imageUrl || null;
        if (!first) return <span className="text-xs opacity-60">-</span>;
        const src = /^https?:\/\//i.test(first) ? first : `${API_BASE}${first}`;
        return (
          <img
            src={src}
            alt="thumb"
            className="w-10 h-10 object-cover border rounded"
          />
        );
      },
    },
    { header: "Nama", accessor: (p: Product) => p.name || "-" },
    { header: "Kategori", accessor: (p: Product) => p.category || "-" },
    {
      header: "Grade",
      accessor: (p: Product) => (
        <span
          className={`badge ${
            p.grade === "A"
              ? "badge-success"
              : p.grade === "B"
              ? "badge-warning"
              : "badge-gray"
          }`}
        >
          {p.grade || "-"}
        </span>
      ),
    },
    { header: "Harga", accessor: (p: Product) => rupiah(pickPrice(p)) },
    { header: "Stok", accessor: (p: Product) => p.stock ?? 0 },
    {
      header: "Aksi",
      className: "whitespace-normal align-top p-1",
      accessor: (p: Product) => (
        <div className="grid gap-1 w-[96px]">
          <button
            className="btn btn-primary btn-xs w-full"
            onClick={() => setEditingProduct(p)}
          >
            Edit
          </button>
          <Link
            href={`/products/${p.id}`}
            className="btn btn-primary btn-xs w-full bg-transparent border border-neutral-700 text-neutral-200 hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-white/10"
          >
            Detail
          </Link>
          <button
            onClick={() => handleDelete(p.id)}
            className="btn btn-danger btn-xs w-full"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {!token && (
        <Alert message="Anda belum login. Data di bawah adalah template. Silakan login untuk data live." />
      )}

      {!showForm && !editingProduct && (
        <button
          className="btn btn-primary mb-4 self-start"
          onClick={() => setShowForm(true)}
        >
          + Tambah Produk
        </button>
      )}

      {(showForm || !!editingProduct) && (
        <div className="card bg-base-100 shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">
                {editingProduct ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <p className="text-sm text-slate-400">
                {editingProduct
                  ? "Edit data produk"
                  : "CRUD produk, multi-pricing, upload media"}
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            >
              Tutup
            </button>
          </div>

          <FormProduk
            onSubmit={submit}
            initialData={
              editingProduct
                ? {
                    name: editingProduct.name,
                    kategori: editingProduct.category,
                    grade:
                      (editingProduct.grade as "A" | "B" | "REJECT") ?? "A",
                    hargaPcs: editingProduct.pricePcs ?? undefined,
                    hargaBorongan: editingProduct.priceBulk ?? undefined,
                    hargaKilo: editingProduct.priceKg ?? undefined,
                    stock: editingProduct.stock,
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* ===== TABEL PRODUK MANUAL ===== */}
      <div className="card bg-base-100 shadow">
        <h3 className="font-medium mb-3">Produk (Manual)</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ReusableTable
            data={itemsManual}
            columns={columns}
            loading={false}
            emptyMessage="Belum ada produk manual."
            rowKey="id"
          />
        )}
      </div>

      {/* ===== TABEL PRODUK HASIL SORTIR ===== */}
      <div className="card bg-base-100 shadow">
        <h3 className="font-medium mb-3">Produk Hasil Sortir</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ReusableTable
            data={itemsSortir}
            columns={columns}
            loading={false}
            emptyMessage="Belum ada produk hasil sortir."
            rowKey="id"
          />
        )}
      </div>

      
      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />
<ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini?"
      />
    </div>
  );
}
