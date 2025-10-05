'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

type Log = {
  id: number;
  actorId: number | null;
  actorRole: 'OWNER' | 'STAFF' | null;
  action: string;
  method?: string;
  path?: string;
  ip?: string;
  status?: number;
  success?: boolean;
  metadata?: any;
  createdAt: string;
};

export default function AuditPage() {
  const [filters, setFilters] = useState<{actorId?: string; action?: string; from?: string; to?: string; limit?: number}>({ limit: 100 });
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await api.Audit.list({
        actorId: filters.actorId ? Number(filters.actorId) : undefined,
        action: filters.action || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        limit: filters.limit || 100,
      });
      setLogs(res.logs || []);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Audit Log</h1>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Actor ID</label>
          <input className="w-full border rounded p-2" value={filters.actorId||''} onChange={e=>setFilters(f=>({...f, actorId: e.target.value}))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Action contains</label>
          <input className="w-full border rounded p-2" value={filters.action||''} onChange={e=>setFilters(f=>({...f, action: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm mb-1">From</label>
          <input type="datetime-local" className="w-full border rounded p-2" value={filters.from||''} onChange={e=>setFilters(f=>({...f, from: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm mb-1">To</label>
          <input type="datetime-local" className="w-full border rounded p-2" value={filters.to||''} onChange={e=>setFilters(f=>({...f, to: e.target.value}))} />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} className="btn btn-primary px-4 py-2 rounded" disabled={loading}>{loading? 'Memuat...' : 'Refresh'}</button>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Waktu</th>
              <th className="text-left p-2">Actor</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2">{l.actorId ?? '-'}</td>
                <td className="p-2">{l.actorRole ?? '-'}</td>
                <td className="p-2 break-all">{l.action}</td>
                <td className="p-2">{l.status ?? '-'}</td>
                <td className="p-2">{l.ip ?? '-'}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={6}>Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
