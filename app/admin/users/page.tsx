'use client';
import React, { useEffect, useState } from 'react';
import { Users } from '@/lib/api';
import { toast } from 'sonner';

type Staff = { id:number; name:string; username:string; role:'STAFF'|'OWNER'; createdAt:string };

export default function AdminUsersPage() {
  const [list, setList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await Users.list();
      setList(res.users);
    } catch (e:any) {
      toast.error(e.message || 'Gagal memuat');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    try {
      await Users.create({ name, username, password });
      toast.success('Staff dibuat');
      setName(''); setUsername(''); setPassword('');
      load();
    } catch (e:any) { toast.error(e.message || 'Gagal'); }
  }

  async function resetPwd(id:number) {
    const np = prompt('Password sementara baru:');
    if (!np) return;
    try { await Users.resetPassword(id, np); toast.success('Password direset'); } catch (e:any) { toast.error(e.message); }
  }
  async function remove(id:number) {
    if (!confirm('Yakin hapus staff?')) return;
    try { await Users.remove(id); toast.success('Staff dihapus'); load(); } catch (e:any) { toast.error(e.message); }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Manajemen Staff</h1>
        <form onSubmit={createStaff} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input placeholder="Nama (opsional)" className="border p-2 rounded" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Username" className="border p-2 rounded" value={username} onChange={e=>setUsername(e.target.value)} required />
          <input placeholder="Password" type="password" className="border p-2 rounded" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="btn btn-primary rounded px-4 py-2">Tambah</button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Daftar Staff</h2>
        {loading? <div>Loading...</div> : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 border">ID</th>
                <th className="text-left p-2 border">Nama</th>
                <th className="text-left p-2 border">Username</th>
                <th className="text-left p-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td className="p-2 border">{u.id}</td>
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.username}</td>
                  <td className="p-2 border space-x-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>resetPwd(u.id)}>Reset Password</button>
                    <button className="px-2 py-1 border rounded" onClick={()=>remove(u.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
