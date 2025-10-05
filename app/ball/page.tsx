"use client";

import React, { useEffect, useMemo, useState } from "react";
import Alert from "@/components/Alert";
import FormBall, { BallForm } from "@/components/forms/FormBall";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ReusableTable from "@/components/ui/ReusableTable";
import SkeletonList from "@/components/ui/SkeletonList";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

type Ball = {
  id: number;
  code: string;
  origin: string;
  category: string;
  supplier: string;
  weightKg?: number;
  buyPrice?: number;
  status: "UNOPENED" | "OPENED" | "SORTED";
  docUrl?: string | null;
};

export default function Page() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { token } = useAuth();
  const [balls, setBalls] = useState<Ball[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBallForm, setShowBallForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBall, setEditingBall] = useState<Ball | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, ""),
    []
  );
  const BALLS_URL = `${API_BASE}/api/balls`;

  const statusLabel = (s: Ball["status"]) =>
    s === "UNOPENED"
      ? "Belum dibuka"
      : s === "OPENED"
      ? "Dibuka"
      : "Selesai sortir";

  const fetchBalls = async () => {
    if (!token) {
      setBalls([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ limit: String(pageSize), skip: String((page-1)*pageSize) }).toString();
      const res = await fetch(`${BALLS_URL}?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const raw = await res.json();

      // Backend mengirim envelope { status, message, data, meta }
      // Unwrap agar menjadi array Ball[]
      const items: Ball[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
        ? raw.items
        : [];

      setBalls(items);
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(err?.message || "Gagal memuat data Ball.");
      setBalls([]);
      toast.error("❌ Gagal memuat data Ball");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = (id: number) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetId || !token) {
      setConfirmOpen(false);
      return;
    }

    setConfirmOpen(false);
    try {
      const res = await fetch(`${BALLS_URL}/${targetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      setBalls((prev) => prev.filter((b) => b.id !== targetId));
      toast.success("Ball berhasil dihapus!");
    } catch (err: any) {
      console.error("❌ Delete error:", err);
      toast.error(`❌ Gagal menghapus Ball: ${err.message}`);
    }
  };

  const mapToForm = (b: Ball): BallForm => ({
    id: b.id,
    code: b.code,
    asal: b.origin,
    kategori: b.category,
    supplier: b.supplier ?? "",
    beratKg: b.weightKg ?? undefined,
    hargaBeli: b.buyPrice ?? undefined,
    status:
      b.status === "UNOPENED"
        ? "BELUM_DIBUKA"
        : b.status === "OPENED"
        ? "DIBUKA"
        : "SELESAI_SORTIR",
    docUrl: b.docUrl ?? null,
  });

  const handleSubmit = async (payload: BallForm & { nota?: File[] | null }) => {
    if (!token) {
      setError("Anda belum login.");
      toast.error("⚠️ Anda belum login.");
      return;
    }

    const fd = new FormData();
    fd.append("code", payload.code);
    fd.append("asal", payload.asal);
    fd.append("kategori", payload.kategori);
    fd.append("supplier", payload.supplier);
    if (payload.beratKg !== undefined)
      fd.append("beratKg", String(payload.beratKg));
    if (payload.hargaBeli !== undefined)
      fd.append("hargaBeli", String(payload.hargaBeli));
    fd.append("status", payload.status);

    if (payload.nota && payload.nota.length > 0) {
      payload.nota.forEach((file) => fd.append("nota", file));
    }

    setSaving(true);
    try {
      const res = await fetch(
        payload.id ? `${BALLS_URL}/${payload.id}` : BALLS_URL,
        {
          method: payload.id ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );

      if (!res.ok) throw new Error(await res.text());
      await fetchBalls();
      setEditingBall(null);
      setShowBallForm(false);
      toast.success(`Ball berhasil ${payload.id ? "diupdate" : "disimpan"}!`);
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      toast.error("❌ Gagal menyimpan Ball.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Kode", accessor: (ball: Ball) => ball.code },
    { header: "Asal", accessor: (ball: Ball) => ball.origin },
    { header: "Kategori", accessor: (ball: Ball) => ball.category },
    { header: "Berat (kg)", accessor: (ball: Ball) => ball.weightKg ?? "-" },
    {
      header: "Harga Beli",
      accessor: (ball: Ball) => (ball.buyPrice ?? 0).toLocaleString("id-ID"),
    },
    {
      header: "Status",
      accessor: (ball: Ball) => (
        <span
          className={`badge ${
            ball.status === "OPENED"
              ? "badge-warning"
              : ball.status === "SORTED"
              ? "badge-success"
              : "badge-gray"
          }`}
        >
          {ball.status === "UNOPENED"
            ? "Belum dibuka"
            : ball.status === "OPENED"
            ? "Dibuka"
            : "Selesai sortir"}
        </span>
      ),
    },
    { header: "Supplier", accessor: (ball: Ball) => ball.supplier ?? "-" },
    {
      header: "Nota",
      accessor: (ball: Ball) => {
        if (!ball.docUrl) return "-";
        try {
          const parsed = JSON.parse(ball.docUrl);
          if (Array.isArray(parsed)) {
            return (
              <div className="flex flex-col gap-1">
                {parsed.map((url: string, i: number) => (
                  <a
                    key={i}
                    className="link"
                    href={`${API_BASE}${url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat File {i + 1}
                  </a>
                ))}
              </div>
            );
          } else if (typeof parsed === "string") {
            return (
              <a
                className="link"
                href={`${API_BASE}${parsed}`}
                target="_blank"
                rel="noreferrer"
              >
                Lihat
              </a>
            );
          }
        } catch {
          return (
            <a
              className="link"
              href={`${API_BASE}${ball.docUrl}`}
              target="_blank"
              rel="noreferrer"
            >
              Lihat
            </a>
          );
        }
        return "-";
      },
    },
    {
      header: "Aksi",
      width: 56,
      className: "whitespace-normal align-top p-1",
      accessor: (ball: Ball) => (
        <div className="grid gap-1 w-[56px]">
          {/* Edit: outline netral sama seperti Detail */}
          <button
            className="btn btn-primary btn-xs w-full bg-transparent border border-neutral-700 text-neutral-200 hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-white/10"
            onClick={() => setEditingBall(ball)}
          >
            Edit
          </button>

          {/* Detail (tetap) */}
          <Link
            href={`/ball/${ball.id}`}
            className="btn btn-primary btn-xs w-full bg-transparent border border-neutral-700 text-neutral-200 hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-white/10"
          >
            Detail
          </Link>

          {/* Delete (tetap merah) */}
          <button
            onClick={() => handleDelete(ball.id)}
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
        <Alert message="Anda belum login. Silakan login untuk mengelola data Ball." />
      )}
      {error && <Alert message={error} />}

      {!showBallForm && !editingBall && (
        <button
          className="btn btn-primary mb-4"
          onClick={() => setShowBallForm(true)}
        >
          + Tambah Ball
        </button>
      )}

      {(showBallForm || !!editingBall) && (
        <div className="card bg-base-100 shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">
                {editingBall ? "Edit Ball" : "Tambah Ball"}
              </h2>
              <p className="text-sm text-slate-400">
                {editingBall
                  ? "Perbarui data Ball yang dipilih"
                  : "Input data Ball baru"}
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowBallForm(false);
                setEditingBall(null);
              }}
            >
              Tutup
            </button>
          </div>

          <FormBall
            key={editingBall ? `edit-${editingBall.id}` : "create"}
            onSubmit={handleSubmit}
            initialData={editingBall ? mapToForm(editingBall) : undefined}
            onCancel={() => setEditingBall(null)}
          />
          {saving && (
            <p className="text-sm text-slate-500 mt-2">Menyimpan...</p>
          )}
        </div>
      )}

      <div className="card bg-base-100 shadow">
        <h3 className="font-medium mb-3">Daftar Ball</h3>
        {loading ? (
          <SkeletonList rows={8} />
        ) : (
          <ReusableTable
            data={balls}
            columns={columns}
            loading={loading}
            emptyMessage="Tidak ada data Ball."
            rowKey="id"
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Ball"
        message="Apakah Anda yakin ingin menghapus ball ini?"
      />
    
<Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
</div>
  );
}