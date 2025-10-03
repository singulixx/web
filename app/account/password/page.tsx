'use client';
import React, { useState } from 'react';
import { Account } from '@/lib/api';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await Account.changePassword({ currentPassword, newPassword });
      toast.success('Password updated');
      setCurrent(''); setNew('');
    } catch (e: any) {
      toast.error(e.message || 'Gagal'); 
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Ganti Password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Password Sekarang</label>
          <input type="password" className="w-full border rounded p-2" value={currentPassword} onChange={e=>setCurrent(e.target.value)} required/>
        </div>
        <div>
          <label className="block text-sm mb-1">Password Baru</label>
          <input type="password" className="w-full border rounded p-2" value={newPassword} onChange={e=>setNew(e.target.value)} required/>
        </div>
        <button disabled={loading} className="btn btn-primary px-4 py-2 rounded">{loading? 'Menyimpan...' : 'Simpan'}</button>
      </form>
    </div>
  );
}
