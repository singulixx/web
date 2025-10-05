'use client';
import React, { useState } from 'react';
import { Account } from '@/lib/api';
import { toast } from 'sonner';

export default function RecoveryResetPage() {
  const [username, setUsername] = useState('');
  const [recoveryCode, setCode] = useState('');
  const [newPassword, setPwd] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await Account.recoveryReset({ username, recoveryCode, newPassword });
      toast.success('Password OWNER telah direset');
      setCode(''); setPwd('');
    } catch (e: any) {
      toast.error(e.message || 'Gagal');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Reset Password (Recovery Code)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username OWNER</label>
          <input className="w-full border rounded p-2" value={username} onChange={e=>setUsername(e.target.value)} required/>
        </div>
        <div>
          <label className="block text-sm mb-1">Recovery Code</label>
          <input className="w-full border rounded p-2" value={recoveryCode} onChange={e=>setCode(e.target.value)} required/>
        </div>
        <div>
          <label className="block text-sm mb-1">Password Baru</label>
          <input type="password" className="w-full border rounded p-2" value={newPassword} onChange={e=>setPwd(e.target.value)} required/>
        </div>
        <button disabled={loading} className="btn btn-primary px-4 py-2 rounded">{loading? 'Memproses...' : 'Reset'}</button>
      </form>
    </div>
  );
}
