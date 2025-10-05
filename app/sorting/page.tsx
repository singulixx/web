"use client";
import Alert from "@/components/Alert";
import FormSortir from "@/components/forms/FormSortir";
import ReusableTable from "@/components/ui/ReusableTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/lib/useAuth";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import Pagination from "@/components/ui/Pagination";

interface Product {
  id: number;
  name: string;
  category: string;
  grade: string;
  stock: number;
}

interface SortSession {
  id: number;
  ballId: number;
  gradeA: number;
  gradeB: number;
  reject: number;
  userId: number;
  createdAt: string;
  ball: { code: string; category: string };
  user: { name: string };
}

export default function Page() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
    .replace(/\/+$/, "")
    .replace(/\/+$/, "");
  const { token } = useAuth();

  const [produkHasilSortir, setProdukHasilSortir] = useState<Product[]>([]);
  const [dataSortir, setDataSortir] = useState<SortSession[]>([]);
  const [ballCodes, setBallCodes] = useState<string[]>([]);
  const [editingSortir, setEditingSortir] = useState<SortSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  const unwrap = <T,>(raw: any, fall: T): T => {
    if (Array.isArray(raw)) return raw as T;
    if (Array.isArray(raw?.data)) return raw.data as T;
    if (Array.isArray(raw?.items)) return raw.items as T;
    return fall;
  };

  const fetchBallCodes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/balls`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const raw = await res.json();
      const balls = unwrap<any[]>(raw, []);
      setBallCodes(balls.map((b: any) => b.code));
    } catch (e) {
      console.error("Error fetching ball codes:", e);
    }
  };

  const fetchDataSortir = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/sort`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) {
        const raw = await response.json();
        setDataSortir(unwrap<SortSession[]>(raw, []));
      } else {
        const err = await response.text();
        console.error("Fetch sortir failed:", err);
      }
    } catch (error) {
      console.error("Error fetching sortir data:", error);
      toast.error("Terjadi kesalahan saat mengambil data sortir.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBallCodes();
      fetchDataSortir();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async (payload: {
    code: string;
    gradeA: number;
    gradeB: number;
    reject: number;
  }) => {
    if (!token) {
      toast.error("Anda harus login untuk melakukan sortir.");
      return;
    }

    try {
      setLoading(true);

      const ballCode = editingSortir?.ball.code || payload.code;
      if (!ballCode) {
        toast.error("Kode Ball harus tersedia untuk sortir.");
        return;
      }

      const url = editingSortir
        ? `${API_BASE}/api/sort/${editingSortir.id}` // ✔️ backend expect :id untuk update
        : `${API_BASE}/api/sort/${ballCode}`; // ✔️ backend expect :code untuk create

      const method = editingSortir ? "PUT" : "POST";
      const bodyData = {
        gradeA: payload.gradeA,
        gradeB: payload.gradeB,
        reject: payload.reject,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(
          `Error: ${error.error || error.message || response.statusText}`
        );
        return;
      }

      const result = await response.json();

      if (editingSortir) {
        toast.success("Data sortir berhasil diupdate!");
        setEditingSortir(null);
      } else {
        setProdukHasilSortir(result.products || []);
        toast.success("Sortir berhasil! Produk telah digenerate.");
      }

      fetchDataSortir();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan jaringan saat mengirim data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sortirData: SortSession) => setEditingSortir(sortirData);
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
      const response = await fetch(`${API_BASE}/api/sort/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Data sortir berhasil dihapus!");
        fetchDataSortir();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Terjadi kesalahan saat menghapus data.");
    } finally {
      setConfirmOpen(false);
      setTargetId(null);
    }
  };

  const sortirColumns = [
    { header: "ID", accessor: (item: SortSession) => item.id },
    { header: "Kode Ball", accessor: (item: SortSession) => item.ball.code },
    { header: "Kategori", accessor: (item: SortSession) => item.ball.category },
    { header: "Grade A", accessor: (item: SortSession) => item.gradeA },
    { header: "Grade B", accessor: (item: SortSession) => item.gradeB },
    { header: "Reject", accessor: (item: SortSession) => item.reject },
    {
      header: "Total",
      accessor: (item: SortSession) => item.gradeA + item.gradeB + item.reject,
    },
    {
      header: "Dibuat Oleh",
      accessor: (item: SortSession) => item.user?.name || "-",
    },
    {
      header: "Tanggal",
      accessor: (item: SortSession) =>
        new Date(item.createdAt).toLocaleDateString("id-ID"),
    },
    {
      header: "Aksi",
      accessor: (item: SortSession) => (
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-xs"
            onClick={() => handleEdit(item)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-xs"
            onClick={() => handleDelete(item.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const produkColumns = [
    { header: "Nama", accessor: (item: Product) => item.name },
    { header: "Kategori", accessor: (item: Product) => item.category },
    { header: "Grade", accessor: (item: Product) => item.grade },
    { header: "Stok", accessor: (item: Product) => item.stock },
  ];

  return (
    <>
{!token && (
        <Alert message="Anda belum login. Data di bawah adalah template. Silakan login untuk data live." />
      )}

      <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">
                {editingSortir ? "Edit Sortir" : "Sortir → Produk"}
              </h2>
              <p className="text-sm text-slate-400">
                {editingSortir
                  ? "Edit hasil sortir"
                  : "Input hasil sortir dan generate produk otomatis"}
              </p>
            </div>
            {editingSortir && (
              <button
                className="btn btn-ghost"
                onClick={() => setEditingSortir(null)}
              >
                Batal Edit
              </button>
            )}
          </div>

          <FormSortir
            onSubmit={submit}
            initialData={
              editingSortir
                ? {
                    id: editingSortir.ballId,
                    gradeA: editingSortir.gradeA,
                    gradeB: editingSortir.gradeB,
                    reject: editingSortir.reject,
                    code: editingSortir.ball.code,
                  }
                : undefined
            }
            ballCodes={ballCodes} // ✔️ supaya user bisa pilih kode yang valid
          />
        </div>

        {produkHasilSortir.length > 0 && (
          <div className="card">
            <h3 className="font-medium mb-3">Produk hasil sortir</h3>
            <ReusableTable
              data={produkHasilSortir}
              columns={produkColumns}
              loading={loading}
              emptyMessage="Belum ada produk hasil sortir."
              rowKey="id"
            />
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Data Sortir</h3>
            <button
              className="btn btn-primary"
              onClick={fetchDataSortir}
              disabled={!token || loading}
            >
              {loading ? "Loading..." : "Refresh Data"}
            </button>
          </div>
          <ReusableTable
            data={dataSortir}
            columns={sortirColumns}
            loading={loading}
            emptyMessage={
              token
                ? "Belum ada data sortir."
                : "Silakan login untuk melihat data sortir."
            }
            rowKey="id"
          />
        </div>
      
<Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
</div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Data Sortir"
        message="Apakah Anda yakin ingin menghapus data sortir ini?"
      />
    </>
  );
}