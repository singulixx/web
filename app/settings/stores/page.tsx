"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import api from "@/lib/api";
import FormStore from "@/components/forms/FormStore";
import ReusableTable from "@/components/ui/ReusableTable";
import SkeletonList from "@/components/ui/SkeletonList";
import { toast } from "sonner";
import Pagination from "@/components/ui/Pagination";

type Store = { id: number; name: string; type?: string };

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

export default function StoresPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const { token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState<Store | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<number, any>>({});

  const fetchStores = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.Stores.list({
        authToken: token,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      const arr: Store[] = Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray(data)
        ? (data as any)
        : [];
      setStores(arr);
      setTotal(
        typeof (data as any)?.total === "number"
          ? (data as any).total
          : arr.length
      );

      // status Shopee di-background; kalau gagal, jangan ganggu UI
      fetchStatuses(arr).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async (arr: Store[]) => {
    const entries: Record<number, any> = {};
    await Promise.all(
      arr
        .filter((s) => (s.type || "").toUpperCase() === "SHOPEE")
        .map(async (s) => {
          try {
            const headers: HeadersInit | undefined = token
              ? { Authorization: `Bearer ${token}` }
              : undefined;
            const res = await fetch(`${BASE}/api/stores/${s.id}/status`, {
              headers,
            });
            entries[s.id] = res.ok ? await res.json() : { connected: false };
          } catch {
            entries[s.id] = { connected: false };
          }
        })
    );
    setStatusMap(entries);
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleCreate = async (data: any) => {
    if (!token) return;
    try {
      await api.Stores.create(data, token);
      toast.success("Store dibuat");
      setShowForm(false);
      await fetchStores();
    } catch (e: any) {
      toast.error(e?.message || "Gagal membuat store");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!token || !selected) return;
    try {
      await api.Stores.update(selected.id, data, token);
      toast.success("Store diupdate");
      setShowForm(false);
      setSelected(null);
      await fetchStores();
    } catch (e: any) {
      toast.error(e?.message || "Gagal update store");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("Yakin hapus store ini?")) return;
    try {
      await api.Stores.remove(id, token);
      toast.success("Store dihapus");
      await fetchStores();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const connectShopee = async (id: number) => {
    try {
      // find store to include name in payload
      const store = stores.find((x) => x.id === id);
      const payload = {
        name: store?.name || `Store ${id}`,
        type: "SHOPEE",
      };
      const headers: HeadersInit | undefined = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
      const res = await fetch(`${BASE}/api/stores/${id}/shopee/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const js = await res.json().catch(() => ({}));
      if (js?.url) window.location.href = js.url;
      else toast.success("Permintaan koneksi Shopee dikirim");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memulai koneksi Shopee");
    }
  };

  // ---------- ReusableTable columns ----------
  const columns = useMemo(
    () => [
      { header: "ID", accessor: (s: Store) => s.id },
      {
        header: "Nama",
        accessor: (s: Store) => (
          <span className="whitespace-pre-wrap break-words">{s.name}</span>
        ),
      },
      {
        header: "Tipe",
        accessor: (s: Store) => (
          <span className="badge badge-outline">{s.type}</span>
        ),
      },
      {
        header: "Aksi",
        width: 72, // kolom sempit seperti di Ball
        className: "whitespace-normal align-top p-1",
        accessor: (s: Store) => (
          <div className="grid gap-1 w-[72px]">
            {String(s.type || "").toUpperCase() === "SHOPEE" && (
              <button
                onClick={() => connectShopee(s.id)}
                title="Connect Shopee"
                className="btn btn-primary btn-xs w-full bg-transparent border border-neutral-700 text-neutral-200 hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-white/10"
              >
                Connect
              </button>
            )}

            <button
              onClick={() => {
                setSelected(s);
                setShowForm(true);
              }}
              className="btn btn-xs w-full bg-transparent border border-[color:var(--border)] text-[color:var(--text-primary)] hover:bg-neutral-700/30 dark:text-[color:var(--text-secondary)] dark:border-[color:var(--border-soft)] dark:hover:bg-neutral-700/30"
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(s.id)}
              className="btn btn-danger btn-xs w-full"
            >
              Hapus
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Store Management</h1>
        {!showForm && (
          <button
            onClick={() => {
              setSelected(null);
              setShowForm(true);
            }}
            className="btn btn-primary btn-sm sm:btn-md self-start sm:self-auto"
          >
            + Tambah Store
          </button>
        )}
      </div>

      {/* Status Shopee (opsional) */}
      {stores.some((s) => (s.type || "").toUpperCase() === "SHOPEE") && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores
            .filter((s) => (s.type || "").toUpperCase() === "SHOPEE")
            .map((s) => {
              const st = statusMap[s.id] || {};
              return (
                <div key={s.id} className="card bg-base-100 shadow">
                  <div className="card-body gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        Shopee: {s.name}
                      </div>
                      <div className="text-sm opacity-70">
                        Status:{" "}
                        <span
                          className={`badge ${
                            st.connected ? "badge-success" : "badge-ghost"
                          }`}
                        >
                          {st.connected ? "Connected" : "Not connected"}
                        </span>
                        {st.expiresAt && (
                          <span className="ml-2">
                            • Exp:{" "}
                            {new Date(st.expiresAt).toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        onClick={() => connectShopee(s.id)}
                        className="btn btn-primary btn-sm bg-transparent border border-neutral-700 text-neutral-200 hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-white/10"
                      >
                        Connect Shopee
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Daftar store */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Daftar Store</h2>
          {loading ? (
            <SkeletonList rows={8} />
          ) : (
            <ReusableTable<Store>
              data={stores}
              columns={columns as any}
              loading={loading}
              emptyMessage="Belum ada store. Klik + Tambah Store untuk membuat store (OFFLINE / TIKTOK / SHOPEE)."
              rowKey={(s) => s.id}
            />
          )}
        </div>
      </div>

      {/* Sidebar form (muncul ketika add/edit) */}
      {showForm && (
        <div className="card bg-base-100 shadow h-fit">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h2 className="card-title">
                {selected ? "Edit Store" : "Tambah Store"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelected(null);
                }}
                className="btn btn-ghost btn-sm sm:btn-md"
              >
                Tutup
              </button>
            </div>
            <FormStore
              initialData={selected ?? undefined}
              onSubmit={(data) =>
                selected ? handleUpdate(data) : handleCreate(data)
              }
            />
          </div>
        </div>
      )}
    
<Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
</div>
  );
}