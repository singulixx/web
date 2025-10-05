"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import MultiFileUpload from "@/components/inputs/MultiFileUpload";
import { toast } from "sonner";

type Media = { id: number; url: string; kind: "IMAGE" | "DOCUMENT" };
type Product = {
  id: number;
  name: string;
  category: string;
  grade: string;
  pricePcs: number | null;
  priceBulk: number | null;
  priceKg: number | null;
  stock: number;
  media?: Media[];
  imageUrl?: string | null; // legacy
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

export default function ProductDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams() as { id?: string };
  const productId = Number(params?.id || 0);
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const fetchOne = async () => {
    if (!token || !productId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil produk");
      const data = await res.json();
      setItem(data);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOne(); }, [token, productId]);

  const handleAddMedia = async () => {
    if (!token || !item) return;
    if (!newFiles.length) return toast.info("Pilih file terlebih dahulu.");
    setAdding(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of newFiles) {
        const fd = new FormData();
        fd.append("file", f);
        const up = await fetch(`${API_BASE}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (!up.ok) throw new Error("Upload gagal");
        const { url } = await up.json();
        uploadedUrls.push(url);
      }
      const existing = (item.media || []).map((m) => ({ url: m.url, kind: m.kind }));
      const appends = uploadedUrls.map((u) => ({ url: u, kind: /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(u) ? "IMAGE" : "DOCUMENT" as const }));
      const res = await fetch(`${API_BASE}/api/products/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ media: [...existing, ...appends] }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan media");
      const updated = await res.json();
      setItem(updated);
      setNewFiles([]);
      setAdding(false);
      toast.success("Media berhasil ditambahkan");
    } catch (e: any) {
      setAdding(false);
      toast.error(e.message || "Gagal menambah media");
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!token || !item) return;
    if (!confirm("Hapus media ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${item.id}/media/${mediaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus media");
      setItem((prev) => prev ? { ...prev, media: (prev.media || []).filter((m) => m.id !== mediaId) } : prev);
      toast.success("Media dihapus");
    } catch (e: any) {
      toast.error(e.message || "Gagal hapus media");
    }
  };

  return (
    <div className="space-y-4">
<div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detail Produk</h1>
          {item && <p className="text-sm text-slate-500">{item.name} • {item.category} • Grade {item.grade}</p>}
        </div>
        <div className="flex gap-2">
          <a href="/products" className="btn btn-ghost">Kembali</a>
        </div>
      </div>

      {/* Tambah media */}
      <div className="card bg-base-100 shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Tambah Media</h2>
          <button className="btn btn-primary" disabled={adding} onClick={handleAddMedia}>
            {adding ? "Mengunggah..." : "Simpan Media"}
          </button>
        </div>
        <MultiFileUpload value={newFiles} onChange={setNewFiles} />
      </div>

      {/* Grid media */}
      <div className="card bg-base-100 shadow p-4">
        <h3 className="font-medium mb-3">Semua Media</h3>
        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(item?.media || []).map((m) => (
              <div key={m.id} className="border rounded p-2 flex flex-col gap-2">
                {m.kind === "IMAGE" ? (
                  <img src={`${API_BASE}${m.url}`} alt={m.url} className="w-full h-40 object-cover rounded" />
                ) : (
                  <a href={`${API_BASE}${m.url}`} target="_blank" className="block p-3 border rounded text-sm hover:bg-slate-50">
                    {m.url.split("/").pop()}
                  </a>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMedia(m.id)}>Hapus</button>
              </div>
            ))}
            {!item?.media?.length && <p className="text-sm opacity-60">Belum ada media.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
