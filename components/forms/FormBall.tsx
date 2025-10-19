"use client";

import React, { useEffect, useState } from "react";

type BallStatus = "BELUM_DIBUKA" | "DIBUKA" | "SELESAI_SORTIR";

export type BallForm = {
  id?: number;
  code: string;
  asal: string;
  kategori: string;
  supplier: string;
  beratKg?: number;
  hargaBeli?: number;
  status: BallStatus;
  docUrl?: string | null;
  totalPcsOpened?: number | null
};

type Props = {
  onSubmit: (payload: BallForm & { nota?: File[] | null }) => Promise<void>;
  initialData?: BallForm;
  onCancel?: () => void;
};

const DEFAULT_FORM: BallForm = {
  code: "",
  asal: "",
  kategori: "",
  supplier: "",
  beratKg: undefined,
  hargaBeli: undefined,
  status: "BELUM_DIBUKA",
  docUrl: null,
};

export default function FormBall({ onSubmit, initialData, onCancel }: Props) {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState<BallForm>(initialData ?? DEFAULT_FORM);
  const [nota, setNota] = useState<File[] | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [hargaBeliDisplay, setHargaBeliDisplay] = useState<string>("");
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
    /\/+$/,
    ""
  );

  useEffect(() => {
    setForm(initialData ?? DEFAULT_FORM);

    if (initialData?.docUrl) {
      try {
        const urls = JSON.parse(initialData.docUrl);
        if (Array.isArray(urls)) {
          setPreviewUrls(urls);
        } else if (typeof urls === "string") {
          setPreviewUrls([urls]);
        } else {
          setPreviewUrls([]);
        }
      } catch {
        setPreviewUrls([]);
      }
    } else {
      setPreviewUrls([]);
    }

    setHargaBeliDisplay(
      initialData?.hargaBeli ? formatRupiah(String(initialData.hargaBeli)) : ""
    );
    setNota(null);
    setFileInputKey((k) => k + 1);
  }, [initialData]);

  function formatRupiah(value: string) {
    const numeric = value.replace(/\D/g, "");
    if (!numeric) return "";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(numeric));
  }

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: value === "" ? undefined : Number(value),
    }));
  };

  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = raw.replace(/\D/g, "");
    setHargaBeliDisplay(formatRupiah(numeric));
    setForm((p) => ({
      ...p,
      hargaBeli: numeric === "" ? undefined : Number(numeric),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : null;
    setNota(files);
    setPreviewUrls([]); // Hapus preview lama saat pilih file baru
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...form, nota });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid md:grid-cols-2 gap-3" onSubmit={handleSubmit}>
      {/* Input fields lain */}
      {isEdit && (
        <div>
          <label className="text-sm" htmlFor="code">
            Kode Ball
          </label>
          <input
            id="code"
            name="code"
            className="input mt-1"
            value={form.code}
            onChange={handleTextChange}
            placeholder="Masukkan kode ball"
            required
          />
        </div>
      )}

      <div>
        <label className="text-sm" htmlFor="asal">
          Asal
        </label>
        <input
          id="asal"
          name="asal"
          className="input mt-1"
          value={form.asal}
          onChange={handleTextChange}
          placeholder="Masukkan asal ball"
          required
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="kategori">
          Kategori
        </label>
        <input
          id="kategori"
          name="kategori"
          className="input mt-1"
          value={form.kategori}
          onChange={handleTextChange}
          placeholder="Masukkan kategori"
          required
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="supplier">
          Supplier
        </label>
        <input
          id="supplier"
          name="supplier"
          className="input mt-1"
          value={form.supplier}
          onChange={handleTextChange}
          placeholder="Masukkan supplier"
          required
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="beratKg">
          Berat (kg)
        </label>
        <input
          id="beratKg"
          name="beratKg"
          type="number"
          className="input mt-1"
          value={form.beratKg ?? ""}
          onChange={handleNumberChange}
          placeholder="contoh: 50 (boleh kosong)"
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="hargaBeli">
          Harga Beli (IDR)
        </label>
        <input
          id="hargaBeli"
          name="hargaBeliDisplay"
          type="text"
          className="input mt-1"
          value={hargaBeliDisplay}
          onChange={handleHargaChange}
          placeholder="Rp 0 (boleh kosong)"
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          className="select mt-1"
          value={form.status}
          onChange={handleTextChange}
          required
        >
          <option value="BELUM_DIBUKA">Belum dibuka</option>
          <option value="DIBUKA">Dibuka</option>
          <option value="SELESAI_SORTIR">Selesai sortir</option>
        </select>
      </div>

      <div>
        <label className="text-sm" htmlFor="nota">
          Upload Nota (opsional, multiple)
        </label>
        <input
          key={fileInputKey}
          id="nota"
          type="file"
          className="input mt-1"
          onChange={handleFileChange}
          multiple
        />
        <div className="flex gap-3 mt-2 flex-wrap">
          {previewUrls.map((url, i) => (
            <img
              key={i}
              src={`${API_BASE}${url}`}
              alt={`Preview file ${i + 1}`}
              className="w-24 h-24 object-contain border p-1"
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          ))}
        </div>
      </div>

      <div className="md:col-span-2 flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Menyimpan..." : form.id ? "Update Ball" : "Simpan Ball"}
        </button>
      </div>
    </form>
  );
}
