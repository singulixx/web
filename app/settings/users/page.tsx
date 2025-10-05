"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Users } from "@/lib/api";
import { toast } from "sonner";

type Staff = {
  id: number;
  name: string;
  username: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const [list, setList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await Users.list();
      setList(res.users || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      toast.error("Lengkapi semua field terlebih dulu");
      return;
    }
    setCreating(true);
    try {
      await Users.create(form);
      toast.success("Staff berhasil dibuat");
      setForm({ name: "", username: "", password: "" });
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal membuat staff");
    } finally {
      setCreating(false);
    }
  }

  async function genToken(id: number) {
    try {
      const { token, expiresAt } = await Users.generateResetToken(id);
      try {
        await navigator.clipboard.writeText(token);
      } catch {}
      toast.success("Recovery token dibuat & disalin ke clipboard", {
        description: `Berlaku s/d ${new Date(expiresAt).toLocaleString()}`,
      });
    } catch (e: any) {
      toast.error(e?.message || "Gagal membuat token");
    }
  }

  const columns = useMemo(
    () => [
      { header: "ID", accessor: (u: Staff) => u.id },
      {
        header: "Nama",
        accessor: (u: Staff) => (
          <span className="whitespace-pre-wrap break-words">{u.name}</span>
        ),
      },
      { header: "Username", accessor: (u: Staff) => u.username },
      {
        header: "Aksi",
        width: 160,
        accessor: (u: Staff) => (
          <button
            onClick={() => genToken(u.id)}
            className="btn btn-outline btn-xs sm:btn-sm"
            title="Generate Recovery Code"
          >
            Generate Recovery Code
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header senada */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pengguna / Staff</h1>
          <p className="text-sm opacity-70">
            Owner dapat menambahkan staff dan membuat recovery token saat staff
            lupa password.
          </p>
        </div>
      </div>

      {/* Card: Tambah staff (mengikuti style StoresPage: card bg-base-100 shadow) */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Tambah Staff</h2>
          <form onSubmit={createStaff} className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="block text-xs opacity-70 mb-1">Nama</label>
              <input
                className="input input-bordered w-full"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs opacity-70 mb-1">Username</label>
              <input
                className="input input-bordered w-full"
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs opacity-70 mb-1">Password</label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="minimal 8 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                className={`btn btn-primary w-full md:w-auto ${
                  creating ? "loading" : ""
                }`}
                disabled={creating}
              >
                {creating ? "Menyimpan..." : "Tambah Staff"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Card: Daftar staff (senada dengan StoresPage) */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Daftar Staff</h2>

          {loading ? (
            <div className="text-sm opacity-70">Memuat…</div>
          ) : list.length === 0 ? (
            <div className="text-sm opacity-70">Belum ada staff.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    {columns.map((c, i) => (
                      <th
                        key={i}
                        style={c.width ? { width: c.width } : undefined}
                      >
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id}>
                      <td>{columns[0].accessor(u)}</td>
                      <td>{columns[1].accessor(u)}</td>
                      <td>{columns[2].accessor(u)}</td>
                      <td>{columns[3].accessor(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
