// components/ui/ConfirmDialog.tsx
"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi Hapus",
  message = "Apakah Anda yakin ingin menghapus ini?",
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
}: ConfirmDialogProps) {
  const scrollbarWidthRef = useRef(0);

  // Hitung lebar scrollbar dan pertahankan layout
  useEffect(() => {
    if (open) {
      // Simpan lebar scrollbar sebelum menghilangkannya
      scrollbarWidthRef.current =
        window.innerWidth - document.documentElement.clientWidth;

      // Simpan posisi scroll saat ini
      const scrollY = window.scrollY;

      // Tambahkan padding ke body untuk mengkompensasi scrollbar yang hilang
      document.body.style.paddingRight = `${scrollbarWidthRef.current}px`;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Kembalikan style body ke semula
      const scrollY = document.body.style.top;
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      // Scroll kembali ke posisi semula
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/20 sm:p-4">
      <div className="w-full max-w-xs sm:max-w-md rounded-md bg-slate-100 p-4 shadow-lg border border-slate-200 mx-auto">
        {/* Header dengan ikon */}
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-neutral-200"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-slate-800 sm:text-base">
              {title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 sm:text-sm">{message}</p>
          </div>
        </div>

        {/* Tombol untuk mobile dan desktop */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded border border-slate-300 hover:bg-slate-50 transition-colors sm:px-3 sm:py-1.5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary px-4 py-2 text-sm font-medium text-white bg-neutral-700 rounded border border-neutral-700 hover: transition-colors sm:px-3 sm:py-1.5"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
