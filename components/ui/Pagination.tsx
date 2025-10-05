
"use client";
import React from "react";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  className?: string;
};

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  className = "",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  return (
    <div className={`flex items-center justify-between mt-3 ${className}`}>
      <span className="text-xs text-slate-400">
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          className="btn"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          className="btn"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
