"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

export interface FileItem {
  file: File;
  previewUrl?: string; // for images
}

interface Props {
  label?: string;
  accept?: string;
  value: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

function isImage(file: File) {
  return /^image\//.test(file.type);
}

export default function MultiFileUpload({ label = "Upload File", accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt", value, onChange, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<{ url: string; idx: number }[]>([]);

  useEffect(() => {
    const urls = value
      .map((f, idx) => (isImage(f) ? { url: URL.createObjectURL(f), idx } : null))
      .filter(Boolean) as { url: string; idx: number }[];
    setPreviews(urls);
    return () => {
      urls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [value]);

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="input mt-1"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) {
            onChange([...(value || []), ...files]);
          }
          // reset to allow re-select same files
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      {/* Previews */}
      {!!value?.length && (
        <div className="mt-3 space-y-3">
          {/* image thumbnails */}
          <div className="flex flex-wrap gap-3">
            {previews.map((p) => (
              <div key={p.idx} className="relative">
                <img src={p.url} alt={`preview-${p.idx}`} className="w-24 h-24 object-cover border rounded" />
                <button
                  type="button"
                  className="btn btn-ghost btn-xs absolute -top-2 -right-2"
                  onClick={() => removeAt(p.idx)}
                  aria-label="hapus"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* document list */}
          <div className="flex flex-col gap-2">
            {value.map((f, i) =>
              isImage(f) ? null : (
                <div key={i} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                  <div className="truncate">
                    <span className="font-medium">{f.name}</span>{" "}
                    <span className="opacity-60">({Math.ceil(f.size / 1024)} KB)</span>
                  </div>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeAt(i)}>
                    Hapus
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
