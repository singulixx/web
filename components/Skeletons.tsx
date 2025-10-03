"use client";
export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-24 bg-slate-700/50 rounded mb-2" />
      <div className="h-8 w-40 bg-slate-600/50 rounded" />
    </div>
  );
}
export function SkeletonChart() {
  return (
    <div className="card h-72 animate-pulse">
      <div className="h-full w-full bg-slate-700/40 rounded" />
    </div>
  );
}
