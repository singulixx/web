"use client";
import { useState } from "react";

interface FormSortirProps {
  onSubmit: (payload: any) => Promise<void>;
  initialData?: {
    id?: number;
    gradeA?: number;
    gradeB?: number;
    reject?: number;
    code?: string; // kode ball
  };
  ballCodes?: string[];
}

export default function FormSortir({
  onSubmit,
  initialData,
  ballCodes = [],
}: FormSortirProps) {
  const [code, setCode] = useState(initialData?.code || "");
  const [a, setA] = useState<string>(initialData?.gradeA?.toString() ?? "");
  const [b, setB] = useState<string>(initialData?.gradeB?.toString() ?? "");
  const [r, setR] = useState<string>(initialData?.reject?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  const handleNum =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(e.target.value.replace(/[^\d]/g, "")); // angka saja

  const total =
    (a === "" ? 0 : Number(a)) +
    (b === "" ? 0 : Number(b)) +
    (r === "" ? 0 : Number(r));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      alert("Kode Ball harus diisi untuk sortir.");
      return;
    }
    setLoading(true);
    await onSubmit({
      code,
      gradeA: a === "" ? 0 : Number(a),
      gradeB: b === "" ? 0 : Number(b),
      reject: r === "" ? 0 : Number(r),
    });
    setLoading(false);
  };

  // dropdown state
  const isEditing = Boolean(initialData?.code);
  const hasOptions = ballCodes.length > 0;

  return (
    <form onSubmit={handle} className="space-y-4">
      {/* Grid 2 kolom di md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KIRI */}
        <div className="space-y-4">
          <div>
            <label className="text-sm">Kode Ball</label>
            <select
              className="input mt-1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading || isEditing || !hasOptions}
              required
            >
              {/* Placeholder selalu ada agar elemen stabil */}
              <option value="" disabled>
                {hasOptions ? "Pilih Kode Ball" : "Memuat kode ball…"}
              </option>
              {/* Saat edit, pakai 1 opsi fixed agar tidak berubah bentuk */}
              {isEditing ? (
                <option value={initialData!.code!}>{initialData!.code}</option>
              ) : (
                ballCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-sm">Jumlah Grade A</label>
            <input
              type="number"
              className="input mt-1 placeholder:text-slate-400"
              value={a}
              onChange={handleNum(setA)}
              disabled={loading}
              min={0}
              placeholder="0"
            />
          </div>
        </div>

        {/* KANAN */}
        <div className="space-y-4">
          <div>
            <label className="text-sm">Jumlah Grade B</label>
            <input
              type="number"
              className="input mt-1 placeholder:text-slate-400"
              value={b}
              onChange={handleNum(setB)}
              disabled={loading}
              min={0}
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-sm">Jumlah Reject</label>
            <input
              type="number"
              className="input mt-1 placeholder:text-slate-400"
              value={r}
              onChange={handleNum(setR)}
              disabled={loading}
              min={0}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Total + aksi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm">
          <span className="opacity-70">Total:</span>{" "}
          <span className="font-semibold">{total}</span>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setA("");
              setB("");
              setR("");
            }}
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !code}
          >
            {loading
              ? "Memproses..."
              : isEditing
              ? "Update Data"
              : "Generate Produk"}
          </button>
        </div>
      </div>
    </form>
  );
}
