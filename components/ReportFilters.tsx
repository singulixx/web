"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

type Channel = { id: number; platform: string; label: string };
type Store = { id: number; name: string };

export interface Filters {
  from?: string;
  to?: string;
  channelId?: string;
  storeId?: string;
}

export default function ReportFilters({ value, onChange }: { value: Filters; onChange: (f: Filters)=>void }) {
  const { token } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          fetch("/api/channels", { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
          fetch("/api/stores", { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
        ]);
        setChannels(Array.isArray(c)? c: (c?.items || []));
        setStores(Array.isArray(s)? s: (s?.items || []));
      } catch (e) { /* ignore */ }
    })();
  }, [token]);

  return (
    <div className="grid md:grid-cols-4 gap-3 items-end">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Dari</label>
        <input type="date" className="input" value={value.from || ''} onChange={e=>onChange({ ...value, from: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Sampai</label>
        <input type="date" className="input" value={value.to || ''} onChange={e=>onChange({ ...value, to: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Channel</label>
        <select className="input" value={value.channelId || ''} onChange={e=>onChange({ ...value, channelId: e.target.value || undefined })}>
          <option value="">Semua</option>
          {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.platform} - {ch.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Store</label>
        <select className="input" value={value.storeId || ''} onChange={e=>onChange({ ...value, storeId: e.target.value || undefined })}>
          <option value="">Semua</option>
          {stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
        </select>
      </div>
    </div>
  );
}
