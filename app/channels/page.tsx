"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/Alert";
import { useAuth } from "@/lib/useAuth";
import api from "@/lib/api";
import ShopeeQuickImport from "@/components/forms/ShopeeQuickImport";
import { toast } from "sonner";
import Link from "next/link";

type Store = { id: number; name: string; type?: string };

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

type StatusMap = Record<
  number,
  { connected?: boolean; message?: string } | undefined
>;

export default function ChannelPage() {
  const { token, role } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const shopeeStores = useMemo(
    () => stores.filter((s) => (s.type || "").toUpperCase() === "SHOPEE"),
    [stores]
  );
  const tiktokStores = useMemo(
    () => stores.filter((s) => (s.type || "").toUpperCase() === "TIKTOK"),
    [stores]
  );
  const offlineStores = useMemo(
    () => stores.filter((s) => (s.type || "").toUpperCase() === "OFFLINE"),
    [stores]
  );

  async function fetchStores() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.Stores.list(token);
      const arr: Store[] = Array.isArray(data) ? data : [];
      setStores(arr);
      await fetchStatuses(arr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatuses(arr: Store[]) {
    const entries: StatusMap = {};
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
            const js = await res.json();
            entries[s.id] = js;
          } catch {
            entries[s.id] = { connected: false };
          }
        })
    );
    setStatusMap(entries);
  }

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // NB: di schema Role kita hanya punya OWNER/STAFF,
  // jadi canManage efektifnya true saat OWNER.
  const canManage = role === "OWNER" || role === "STAFF"; 

  return (
    <div className="space-y-4">
{!token && (
        <Alert message="Anda belum login. Silakan login untuk melihat data live." />
      )}

      {!canManage && (
        <Alert message="Hanya Owner/Admin yang dapat mengelola channel. Anda tetap bisa melihat status." />
      )}

      <div className="card bg-base-100 shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Channel</h2>
            <p className="text-sm text-muted-foreground">
              Kelola integrasi Shopee & input manual TikTok/Offline.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/settingss/stores" className="btn btn-ghost">
              Kelola Stores
            </Link>
            <Link href="/sales" className="btn btn-primary">
              Ke Transaksi
            </Link>
          </div>
        </div>

        {/* Shopee Section */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Shopee</h3>
            {shopeeStores.length > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowImport((v) => !v)}
              >
                {showImport ? "Tutup Import" : "Import Transaksi"}
              </button>
            )}
          </div>

          {showImport && (
            <div className="mb-4">
              <ShopeeQuickImport
                token={token}
                stores={shopeeStores}
                onImported={() => toast.success("Import selesai")}
              />
            </div>
          )}

          {loading && (
            <div className="text-sm text-muted-foreground">Memuat store...</div>
          )}

          {!loading && shopeeStores.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Belum ada store Shopee. Tambahkan di menu <b>Setting → Stores</b>.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shopeeStores.map((s) => {
              const st = statusMap[s.id];
              const connected = !!st?.connected;
              return (
                <div
                  key={s.id}
                  className="border rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Shopee
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        connected ? "badge-success" : "badge-amber"
                      }`}
                    >
                      {connected ? "Connected" : "Not Connected"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!connected ? (
                      <button
                        disabled={!canManage}
                        onClick={async () => {
                          try {
                            const headers: HeadersInit | undefined = token
                              ? { Authorization: `Bearer ${token}` }
                              : undefined;
                            const res = await fetch(
                              `${BASE}/api/stores/${s.id}/shopee/connect`,
                              { method: "POST", headers }
                            );
                            if (!res.ok) {
                              throw new Error(`Gagal connect (${res.status})`);
                            }
                            toast.success(
                              "Silakan selesaikan proses connect jika diminta."
                            );
                            await fetchStatuses(stores);
                          } catch (e: any) {
                            toast.error(e?.message || "Gagal menghubungkan");
                          }
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        Connect
                      </button>
                    ) : (
                      <>
                        <Link
                          href="/sales"
                          className="btn btn-sm btn-ghost"
                        >
                          Import di Transaksi
                        </Link>
                        <button
                          onClick={() => setShowImport(true)}
                          className="btn btn-sm btn-ghost"
                        >
                          Quick Import
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TikTok Section */}
        <section className="mt-8">
          <h3 className="font-semibold mb-2">TikTok (Manual)</h3>
          {!loading && tiktokStores.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Belum ada store TikTok. Tambahkan di menu <b>Setting → Stores</b>.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiktokStores.map((s) => (
              <div
                key={s.id}
                className="border rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    TikTok (Manual)
                  </div>
                </div>
                <Link href="/sales" className="btn btn-sm btn-ghost">
                  Tambah Transaksi
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Offline Section */}
        <section className="mt-8">
          <h3 className="font-semibold mb-2">Offline (Manual)</h3>
          {!loading && offlineStores.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Belum ada store Offline. Tambahkan di menu <b>Setting → Stores</b>
              .
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offlineStores.map((s) => (
              <div
                key={s.id}
                className="border rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Offline (Manual)
                  </div>
                </div>
                <Link href="/sales" className="btn btn-sm btn-ghost">
                  Tambah Transaksi
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
