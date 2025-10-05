'use client';
import React, { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.Account.forgot({ username });
      toast.success('Jika akun ada, tautan/kode reset telah dikirim.');
      if (res && res.devToken) setDevToken(res.devToken);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal mengirim reset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Lupa Password</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full border rounded p-2" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <button disabled={loading} className="btn btn-primary px-4 py-2 rounded">{loading? 'Mengirim...' : 'Kirim tautan/kode'}</button>
      </form>
      {devToken && (
        <div className="p-3 border rounded bg-yellow-50 text-sm">
          <div className="font-medium mb-1">Dev token (dev only):</div>
          <code className="break-all">{devToken}</code>
        </div>
      )}
    </div>
  );
}
