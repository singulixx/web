"use client";

import React, { useEffect, useMemo, useState } from "react";
import MultiFileUpload from "@/components/inputs/MultiFileUpload";

export type FormProdukValues = {
  name: string;
  kategori: string;
  grade: "A" | "B" | "REJECT";
  hargaPcs?: number;
  hargaBorongan?: number;
  hargaKilo?: number;
  stock: number;
  images: File[];
};

type InitialData = Partial<Omit<FormProdukValues, "images">> & {
  grade?: "A" | "B" | "REJECT";
};

type FormProdukProps = {
  onSubmit: (payload: FormProdukValues) => Promise<void> | void;
  initialData?: InitialData;
  onCancel?: () => void;
};

export default function FormProduk({
  onSubmit,
  initialData,
  onCancel,
}: FormProdukProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [kategori, setKategori] = useState(initialData?.kategori ?? "");
  const [grade, setGrade] = useState<"A" | "B" | "REJECT">(
    initialData?.grade ?? "A"
  );

  // ===== Harga: simpan RAW digit, tampilkan formatted Rp =====
  const [hargaPcsRaw, setHargaPcsRaw] = useState<string>(
    initialData?.hargaPcs != null ? String(initialData.hargaPcs) : ""
  );
  const [hargaBoronganRaw, setHargaBoronganRaw] = useState<string>(
    initialData?.hargaBorongan != null ? String(initialData.hargaBorongan) : ""
  );
  const [hargaKiloRaw, setHargaKiloRaw] = useState<string>(
    initialData?.hargaKilo != null ? String(initialData.hargaKilo) : ""
  );

  const [stock, setStock] = useState<string>(
    initialData?.stock != null ? String(initialData.stock) : "0"
  );

  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setKategori(initialData.kategori ?? "");
      setGrade(initialData.grade ?? "A");
      setHargaPcsRaw(
        initialData.hargaPcs != null ? String(initialData.hargaPcs) : ""
      );
      setHargaBoronganRaw(
        initialData.hargaBorongan != null
          ? String(initialData.hargaBorongan)
          : ""
      );
      setHargaKiloRaw(
        initialData.hargaKilo != null ? String(initialData.hargaKilo) : ""
      );
      setStock(initialData.stock != null ? String(initialData.stock) : "0");
      setImages([]); // reset upload baru saat edit
    }
  }, [initialData]);

  // helper format
  const formatRupiah = (raw: string) =>
    raw === "" ? "" : `Rp ${Number(raw).toLocaleString("id-ID")}`;

  const digitsOnly = (s: string) => s.replace(/[^\d]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: FormProdukValues = {
      name: name.trim(),
      kategori: kategori.trim(),
      grade,
      hargaPcs: hargaPcsRaw !== "" ? Number(hargaPcsRaw) : undefined,
      hargaBorongan:
        hargaBoronganRaw !== "" ? Number(hargaBoronganRaw) : undefined,
      hargaKilo: hargaKiloRaw !== "" ? Number(hargaKiloRaw) : undefined,
      stock: stock !== "" ? Number(stock) : 0,
      images,
    };

    await onSubmit(payload);
  };

  return (
    <form className="grid md:grid-cols-2 gap-3" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm" htmlFor="name">
          Nama Produk
        </label>
        <input
          id="name"
          className="input mt-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masukkan nama produk"
          required
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="kategori">
          Kategori
        </label>
        <input
          id="kategori"
          className="input mt-1 w-full"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          placeholder="Kategori"
          required
        />
      </div>

      <div>
        <label className="text-sm" htmlFor="grade">
          Grade
        </label>
        <select
          id="grade"
          className="select mt-1 w-full"
          value={grade}
          onChange={(e) => setGrade(e.target.value as "A" | "B" | "REJECT")}
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="REJECT">REJECT</option>
        </select>
      </div>

      <div>
        <label className="text-sm" htmlFor="stock">
          Stok
        </label>
        <input
          id="stock"
          type="number"
          className="input mt-1 w-full"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="0"
          min={0}
        />
      </div>

      {/* ====== Harga (pcs) ====== */}
      <div>
        <label className="text-sm" htmlFor="hargaPcs">
          Harga (pcs)
        </label>
        <input
          id="hargaPcs"
          type="text"
          inputMode="numeric"
          className="input mt-1 w-full placeholder:text-slate-400"
          value={formatRupiah(hargaPcsRaw)}
          onChange={(e) => setHargaPcsRaw(digitsOnly(e.target.value))}
          placeholder="Rp 15.000"
        />
      </div>

      {/* ====== Harga (borongan) ====== */}
      <div>
        <label className="text-sm" htmlFor="hargaBorongan">
          Harga (borongan)
        </label>
        <input
          id="hargaBorongan"
          type="text"
          inputMode="numeric"
          className="input mt-1 w-full placeholder:text-slate-400"
          value={formatRupiah(hargaBoronganRaw)}
          onChange={(e) => setHargaBoronganRaw(digitsOnly(e.target.value))}
          placeholder="Rp 250.000"
        />
      </div>

      {/* ====== Harga (kilo) - kiri ====== */}
      <div>
        <label className="text-sm" htmlFor="hargaKilo">
          Harga (kilo)
        </label>
        <input
          id="hargaKilo"
          type="text"
          inputMode="numeric"
          className="input mt-1 w-full placeholder:text-slate-400"
          value={formatRupiah(hargaKiloRaw)}
          onChange={(e) => setHargaKiloRaw(digitsOnly(e.target.value))}
          placeholder="Rp 30.000"
        />
      </div>

      {/* ====== Upload - kanan dari Harga (kilo) ====== */}
      <div className="self-end">
        <MultiFileUpload
          label="Upload Gambar/Dokumen"
          value={images}
          onChange={setImages}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
        />
      </div>

      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Batal
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          Simpan
        </button>
      </div>
    </form>
  );
}
