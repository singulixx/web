'use client';
import React, { useState } from 'react';
import { Account } from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1|2>(1);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await Account.forgotStart({ username });
      setExpiresAt(res.expiresAt);
      if (res.token) {
        // In dev: backend returns token in body; in prod this should be sent via email/wa
        setToken(res.token);
        toast.success('Token dibuat (dev only). Lanjut ke langkah 2.');
      } else {
        toast.success('Link reset telah dikirim. Buka link dari email/WA (prod).');
      }
      setStep(2);
    } catch (e:any) {
      toast.error(e.message || 'Gagal memulai reset');
    } finally {
      setLoading(false);
    }
  }

  async function complete(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await Account.forgotComplete({ username, token, newPassword });
      toast.success('Password berhasil direset. Silakan login.');
      setUsername(''); setToken(''); setNewPassword(''); setStep(1);
    } catch (e:any) {
      toast.error(e.message || 'Gagal menyelesaikan reset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Lupa Password (Token)</h1>

      {step === 1 && (
        <form onSubmit={start} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border rounded p-2" value={username} onChange={e=>setUsername(e.target.value)} required/>
          </div>
          <button disabled={loading} className="btn btn-primary px-4 py-2 rounded">{loading? 'Memproses...' : 'Buat Token'}</button>
          <p className="text-xs text-gray-500">Di lingkungan development, token akan tampil di bawah. Di produksi, token/link dikirim via email/WA.</p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={complete} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border rounded p-2" value={username} onChange={e=>setUsername(e.target.value)} required/>
          </div>
          <div>
            <label className="block text-sm mb-1">Token</label>
            <input className="w-full border rounded p-2 font-mono" value={token} onChange={e=>setToken(e.target.value)} required/>
            {expiresAt && <p className="text-xs text-gray-500 mt-1">Kadaluarsa: {new Date(expiresAt).toLocaleString()}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Password Baru</label>
            <input type="password" className="w-full border rounded p-2" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={()=>setStep(1)} className="px-3 py-2 rounded border">Kembali</button>
            <button disabled={loading} className="btn btn-primary px-4 py-2 rounded">{loading? 'Memproses...' : 'Reset Password'}</button>
          </div>
        </form>
      )}

      {step === 2 && token && (
        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm text-gray-600 mb-1">Token (dev only):</div>
          <code className="text-sm break-all">{token}</code>
        </div>
      )}
    </div>
  );
}
