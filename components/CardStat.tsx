import { ReactNode } from 'react';
export default function CardStat({ title, value, subtitle, icon }: { title: string, value: string | number, subtitle?: string, icon?: ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 text-slate-400">{subtitle}</p>}
        </div>
        {icon && <div className="p-2 rounded-xl bg-white/5">{icon}</div>}
      </div>
    </div>
  )
}
