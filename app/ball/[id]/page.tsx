"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import MultiFileUpload from "@/components/inputs/MultiFileUpload";
import { toast } from "sonner";

type Ball = {
  id: number;
  code: string;
  origin: string;
  category: string;
  supplier: string;
  weightKg?: number;
  buyPrice?: number;
  status: "UNOPENED" | "OPENED" | "SORTED";
  docUrl?: string | null; // JSON string of string[] | single string
  totalPcsOpened?: number | null; // ✅ tambahkan baris ini
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

function parseDocUrls(docUrl?: string | null): string[] {
  if (!docUrl) return [];
  try {
    const p = JSON.parse(docUrl);
    if (Array.isArray(p)) return p as string[];
    if (typeof p === "string" && p) return [p];
    return [];
  } catch {
    return [docUrl];
  }
}

export default function BallDetailPage() {
  const { token } = useAuth();
  const params = useParams() as { id?: string };
  const ballId = Number(params?.id || 0);

  const [ball, setBall] = useState<Ball | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingFiles, setAddingFiles] = useState<File[]>([]);

  const docs = useMemo(() => parseDocUrls(ball?.docUrl), [ball?.docUrl]);

  const fetchBall = async () => {
    if (!token || !ballId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/balls/${ballId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal memuat Ball");
      const data = await res.json();
      setBall(data);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat Ball");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBall(); }, [token, ballId]);

  const handleAddDocs = async () => {
    if (!token || !ball) return;
    if (!addingFiles.length) return toast.info("Pilih file terlebih dahulu.");
    setSaving(true);
    try {
      const uploaded: string[] = [];
      for (const f of addingFiles) {
        const fd = new FormData();
        fd.append("file", f);
        const up = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!up.ok) throw new Error("Upload gagal");
        const { url } = await up.json();
        uploaded.push(url);
      }
      const next = [...docs, ...uploaded];
      const resp = await fetch(`${API_BASE}/api/balls/${ball.id}/docs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ docUrls: next }),
      });
      if (!resp.ok) throw new Error("Gagal menyimpan dokumen");
      const updated = await resp.json();
      setBall(updated);
      setAddingFiles([]);
      toast.success("Dokumen berhasil ditambahkan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menambah dokumen");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (url: string) => {
    if (!token || !ball) return;
    if (!confirm("Hapus dokumen ini?")) return;
    try {
      const resp = await fetch(`${API_BASE}/api/balls/${ball.id}/docs?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Gagal menghapus dokumen");
      const updated = await resp.json();
      setBall(updated);
      toast.success("Dokumen dihapus");
    } catch (e: any) {
      toast.error(e.message || "Gagal hapus dokumen");
    }
  };

  return (
    <div className="space-y-4">
      {/* READ-ONLY: Total PCS Dibuka (ditampilkan dari field totalPcsOpened) */}
      <div className="mt-3">
        <label className="text-sm text-muted-foreground">Total PCS Dibuka</label>
        <div className="mt-1 flex items-center gap-3">
          <div className="px-3 py-2 bg-surface rounded-md">
            {ball?.totalPcsOpened ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">Nilai ini diisi otomatis saat proses sortir selesai (A+B+Reject).</p>
        </div>
      </div>

<div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detail Ball</h1>
          {ball && <p className="text-sm text-slate-500">Kode {ball.code} • {ball.category} • {ball.origin}</p>}
        </div>
        <div className="flex gap-2">
          <a href="/ball" className="btn btn-ghost">Kembali</a>
        </div>
      </div>

      {/* Tambah dokumen */}
      <div className="card bg-base-100 shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Tambah Dokumen</h2>
          <button className="btn btn-primary" disabled={saving} onClick={handleAddDocs}>
            {saving ? "Menyimpan..." : "Simpan Dokumen"}
          </button>
        </div>
        <MultiFileUpload accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" value={addingFiles} onChange={setAddingFiles} />
      </div>

      {/* Grid dokumen */}
      <div className="card bg-base-100 shadow p-4">
        <h3 className="font-medium mb-3">Semua Dokumen</h3>
        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {docs.map((u) => (
              <div key={u} className="border rounded p-2 flex flex-col gap-2">
                {/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(u) ? (
                  <img src={`${API_BASE}${u}`} alt={u} className="w-full h-40 object-cover rounded" />
                ) : (
                  <a href={`${API_BASE}${u}`} target="_blank" rel="noreferrer" className="block p-3 border rounded text-sm hover:bg-slate-50">
                    {u.split("/").pop()}
                  </a>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDoc(u)}>Hapus</button>
              </div>
            ))}
            {!docs.length && <p className="text-sm opacity-60">Belum ada dokumen.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
