"use client";
import React, { useMemo } from "react";
import { useState } from "react";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
}: Props) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages = useMemo(() => {
    const list: (number | string)[] = [];
    const push = (v: number | string) => list.push(v);
    const addRange = (s: number, e: number) => { for (let i=s; i<=e; i++) push(i); };
    if (totalPages <= 7) addRange(1, totalPages);
    else {
      const left = Math.max(2, page - 1);
      const right = Math.min(totalPages - 1, page + 1);
      push(1);
      if (left > 2) push("…");
      addRange(left, right);
      if (right < totalPages - 1) push("…");
      push(totalPages);
    }
    return list;
  }, [page, totalPages]);

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="text-xs opacity-70">
        Halaman <b>{page}</b> dari <b>{totalPages}</b> • {pageSize} baris/halaman
      </div>

      <div className="flex items-center gap-2">
        <select
          aria-label="Items per page"
          className="border rounded px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / halaman
            </option>
          ))}
        </select>

        <div className="inline-flex rounded overflow-hidden border">
          <button
            className="px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={!canPrev}
          >
            Prev
          </button>

          {pages.map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={idx}
                className={`px-3 py-1.5 text-sm border-l ${p === page ? "bg-black text-white" : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-3 py-1.5 text-sm border-l select-none">{p}</span>
            )
          )}

          <button
            className="px-3 py-1.5 text-sm border-l disabled:opacity-40"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={!canNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
