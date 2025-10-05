'use client';
import React, { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ResetPasswordTokenPage() {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setPwd] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.Account.reset({ username, token, newPassword });
      toast.success('Password berhasil direset. Silakan login.');
      setUsername(''); setToken(''); setPwd('');
    } catch (e: any) {
      toast.error(e?.message || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reset Password (Token)</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full border rounded p-2" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Token</label>
          <input className="w-full border rounded p-2" value={token} onChange={e=>setToken(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password Baru</label>
          <input type="password" className="w-full border rounded p-2" value={newPassword} onChange={e=>setPwd(e.target.value)} required />
        </div>
        <button disabled={loading} className="btn btn-primary px-4 py-2 rounded">{loading? 'Memproses...' : 'Reset'}</button>
      </form>
      <div className="text-sm text-gray-500">
        Atau gunakan halaman <code>/account/recovery-reset</code> (kompat) dengan memasukkan token di kolom <em>Recovery Code</em>.
      </div>
    </div>
  );
}
