"use client";

import React from "react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string; // className untuk <td>
  headerClassName?: string; // opsional: className untuk <th>
}

interface ReusableTableProps<T> {
  data: T[] | unknown; // biarkan longgar di runtime, kita guard di dalam
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: keyof T | ((item: T) => string | number);
  tableClassName?: string; // opsional: styling table
  rowClassName?: string; // opsional: styling row
}

/**
 * ReusableTable: Tabel generik yang aman terhadap data non-array (tidak meledak).
 * - Menangani loading & empty state.
 * - Memastikan data selalu array di runtime (fallback ke []).
 * - rowKey bisa function atau field name.
 */
export default function ReusableTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = "Tidak ada data.",
  rowKey,
  tableClassName = "table",
  rowClassName = "",
}: ReusableTableProps<T>) {
  // Guard runtime — pastikan selalu array agar .map tidak error
  const safeData: T[] = Array.isArray(data) ? (data as T[]) : [];

  // Beri warning di dev jika data bukan array (membantu debugging)
  if (process.env.NODE_ENV !== "production" && !Array.isArray(data)) {
    // eslint-disable-next-line no-console
    console.warn("[ReusableTable] Prop `data` bukan Array. Menerima:", data);
  }

  const getRowKey = (item: T, index: number): string | number => {
    if (typeof rowKey === "function") {
      try {
        const key = rowKey(item);
        return key ?? index;
      } catch {
        return index;
      }
    }
    const value = (item as Record<string, unknown>)[rowKey as string];
    return (value as string | number) ?? index;
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (safeData.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={tableClassName} role="table">
        <thead>
          <tr role="row">
            {columns.map((column, index) => (
              <th
                key={index}
                className={column.headerClassName}
                role="columnheader"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.map((item, index) => (
            <tr
              key={getRowKey(item, index)}
              className={rowClassName}
              role="row"
            >
              {columns.map((column, colIndex) => {
                let cell: React.ReactNode = null;

                if (typeof column.accessor === "function") {
                  // Custom render
                  try {
                    cell = column.accessor(item);
                  } catch (e) {
                    if (process.env.NODE_ENV !== "production") {
                      // eslint-disable-next-line no-console
                      console.error(
                        "[ReusableTable] Error akses kolom (function accessor):",
                        e
                      );
                    }
                    cell = null;
                  }
                } else {
                  // Akses field langsung
                  const key = column.accessor as keyof T;
                  cell = (item as Record<string, unknown>)[
                    key as string
                  ] as React.ReactNode;
                }

                return (
                  <td key={colIndex} className={column.className} role="cell">
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
