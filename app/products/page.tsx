"use client";

import Alert from "@/components/Alert";
import { useEffect, useState } from "react";
import FormProduk from "@/components/forms/FormProduk";
import { useAuth } from "@/lib/useAuth";
import ReusableTable from "@/components/ui/ReusableTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SkeletonList from "@/components/ui/SkeletonList";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import api, { API_BASE } from "@/lib/api";

const PRODUCTS_URL = `${API_BASE}/api/products`;
const UPLOAD_URL = `${API_BASE}/api/upload`;

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
  const { token } = useAuth();

  const pageSize = 20;

  // Server-side pagination per table
  const [pageManual, setPageManual] = useState(1);
  const [itemsManual, setItemsManual] = useState<Product[]>([]);
  const [totalManual, setTotalManual] = useState(0);
  const [loadingManual, setLoadingManual] = useState(false);

  const [pageSortir, setPageSortir] = useState(1);
  const [itemsSortir, setItemsSortir] = useState<Product[]>([]);
  const [totalSortir, setTotalSortir] = useState(0);
  const [loadingSortir, setLoadingSortir] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  // ---------- Helpers ----------
  const rupiah = (n: number | null | undefined) =>
    n == null
      ? "-"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(n);

  const pickPrice = (p: Product) =>
    p.pricePcs ?? p.priceBulk ?? p.priceKg ?? null;
  const isSortir = (p: Product) =>
    !!(p?.ballCode || p?.ball?.code || p?.source === "SORTIR");

  // ---------- Columns ----------
  const columns = [
    {
      header: "Nama",
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrl}
              alt={p.name}
              className="w-8 h-8 rounded object-cover"
            />
          ) : null}
          <Link className="link" href={`/produk/${p.id}`}>
            {p.name}
          </Link>
        </div>
      ),
    },
    { header: "Kategori", accessor: (p: Product) => p.category },
    { header: "Grade", accessor: (p: Product) => p.grade },
    { header: "Stok", accessor: (p: Product) => p.stock },
    {
      header: "Harga",
      accessor: (p: Product) => rupiah(pickPrice(p)),
    },
    {
      header: "Asal",
      accessor: (p: Product) => (isSortir(p) ? "Sortir" : "Manual"),
    },
    {
      header: "Aksi",
      accessor: (p: Product) => (
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setEditingProduct(p);
              setShowForm(true);
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-primary btn-xs"
            onClick={() => handleDelete(p.id)}
          >
            Hapus
          </button>
        </div>
      ),
    },
  ] as const;

  // ---------- Fetchers (server-side pagination) ----------
  const fetchManual = async () => {
    if (!token) {
      setItemsManual([]);
      setTotalManual(0);
      return;
    }
    try {
      setLoadingManual(true);
      const resp = (await api.Products.list({
        authToken: token,
        limit: pageSize,
        offset: (pageManual - 1) * pageSize,
        query: { kind: "manual" },
      })) as { items: Product[]; total: number };

      setItemsManual(Array.isArray(resp?.items) ? resp.items : []);
      setTotalManual(
        Number.isFinite(resp?.total as number)
          ? (resp.total as number)
          : resp?.items?.length ?? 0
      );
    } catch (e: any) {
      console.error(e);
      setItemsManual([]);
      setTotalManual(0);
      toast.error(e?.message || "Gagal mengambil produk manual.");
    } finally {
      setLoadingManual(false);
    }
  };

  const fetchSortir = async () => {
    if (!token) {
      setItemsSortir([]);
      setTotalSortir(0);
      return;
    }
    try {
      setLoadingSortir(true);
      const resp = (await api.Products.list({
        authToken: token,
        limit: pageSize,
        offset: (pageSortir - 1) * pageSize,
        query: { kind: "sortir" },
      })) as { items: Product[]; total: number };

      setItemsSortir(Array.isArray(resp?.items) ? resp.items : []);
      setTotalSortir(
        Number.isFinite(resp?.total as number)
          ? (resp.total as number)
          : resp?.items?.length ?? 0
      );
    } catch (e: any) {
      console.error(e);
      setItemsSortir([]);
      setTotalSortir(0);
      toast.error(e?.message || "Gagal mengambil produk sortir.");
    } finally {
      setLoadingSortir(false);
    }
  };

  useEffect(() => {
    fetchManual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pageManual]);

  useEffect(() => {
    fetchSortir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pageSortir]);

  // ---------- CRUD ----------
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
      toast.success("Produk berhasil dihapus!");
      // Refresh kedua tabel (biar pasti)
      await Promise.all([fetchManual(), fetchSortir()]);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menghapus produk.");
    } finally {
      setConfirmOpen(false);
      setTargetId(null);
    }
  };

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
        toast.success("Produk berhasil diupdate!");
      } else {
        const res = await fetch(PRODUCTS_URL, {
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
        toast.success("Produk berhasil dibuat!");
      }

      setShowForm(false);
      setEditingProduct(null);
      await Promise.all([fetchManual(), fetchSortir()]);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menyimpan produk.");
    }
  };

  return (
    <div className="space-y-4">
      {!token && (
        <Alert message="Anda belum login. Silakan login untuk melihat data live." />
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
                  : "CRUD produk & upload media"}
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
        {loadingManual ? (
          <SkeletonList rows={8} />
        ) : (
          <ReusableTable
            data={itemsManual}
            columns={columns as any}
            loading={false}
            emptyMessage="Belum ada produk manual."
            rowKey="id"
          />
        )}
      </div>
      <Pagination
        page={pageManual}
        total={totalManual}
        pageSize={pageSize}
        onPageChange={setPageManual}
      />

      {/* ===== TABEL PRODUK HASIL SORTIR ===== */}
      <div className="card bg-base-100 shadow">
        <h3 className="font-medium mb-3">Produk Hasil Sortir</h3>
        {loadingSortir ? (
          <SkeletonList rows={8} />
        ) : (
          <ReusableTable
            data={itemsSortir}
            columns={columns as any}
            loading={false}
            emptyMessage="Belum ada produk hasil sortir."
            rowKey="id"
          />
        )}
      </div>
      <Pagination
        page={pageSortir}
        total={totalSortir}
        pageSize={pageSize}
        onPageChange={setPageSortir}
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
