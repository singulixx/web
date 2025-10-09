'use client';
import Alert from '@/components/Alert';
import { useAuth } from '@/lib/useAuth';

export default function Page() {
  const { token, role } = useAuth();
  return (
    <div className="space-y-4">
      {!token && <Alert message="Anda belum login. Data di bawah adalah template. Silakan login untuk data live." />}
      {role !== 'OWNER' && <Alert message="Hanya Owner yang dapat mengubah pengaturan." />}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Pengaturan</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Mode Marketplace</label>
            <select className="select mt-1">
              <option>mock</option>
              <option>live</option>
            </select>
          </div>
          <div>
            <label className="text-sm">API Base URL</label>
            <input className="input mt-1" defaultValue={(process.env.NEXT_PUBLIC_API_BASE_URL||"").replace(/\/+$/, "")} />
          </div>
        </div>
      </div>
    </div>
  )
}
