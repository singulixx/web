'use client';
import React, { useState } from 'react';
import { Account } from '@/lib/api';
import { toast } from 'sonner';

export default function RecoveryCodesPage() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function gen() {
    setLoading(true);
    try {
      const res = await Account.generateRecoveryCodes();
      setCodes(res.codes || []);
      toast.success('Recovery codes dibuat. Simpan sekarang!');
    } catch (e:any) {
      toast.error(e.message || 'Gagal');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Recovery Codes (OWNER)</h1>
      <p className="text-sm text-gray-600">Kode hanya ditampilkan sekali. Simpan di tempat aman (cetak / catat offline).</p>
      <button onClick={gen} className="btn btn-primary rounded px-4 py-2" disabled={loading}>{loading? 'Membuat...' : 'Generate Codes'}</button>
      {codes && (
        <div className="mt-4 border rounded p-4 bg-gray-50">
          <ul className="list-disc pl-6 space-y-1">
            {codes.map((c, i)=> <li key={i} className="font-mono">{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
