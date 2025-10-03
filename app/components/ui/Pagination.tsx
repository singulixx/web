"use client";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;

  // Backward-compat (ignored)
  onPageSizeChange?: (size: number) => void;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
};

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  className = "",
}: Props) {
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / Math.max(1, pageSize)));
  const goPrev = () => onPageChange(Math.max(1, page - 1));
  const goNext = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className={`flex items-center justify-center gap-3 mt-4 ${className}`}>
      <button className="btn btn-sm" onClick={goPrev} disabled={page <= 1}>
        Prev
      </button>
      <span className="px-3 py-1 rounded-md bg-base-200 text-sm text-slate-200">
        {page} <span className="text-slate-500">/</span> {totalPages}
      </span>
      <button className="btn btn-sm" onClick={goNext} disabled={page >= totalPages}>
        Next
      </button>
    </div>
  );
}
