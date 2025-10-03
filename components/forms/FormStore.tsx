"use client";

import React, { useState } from "react";

interface FormStoreProps {
  initialData?: any;
  onSubmit: (data: any) => void;
}

export default function FormStore({ initialData, onSubmit }: FormStoreProps) {
  const [formData, setFormData] = useState(
    initialData
      ? { name: initialData.name ?? "", type: initialData.type ?? "OFFLINE" }
      : { name: "", type: "OFFLINE" }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: formData.name.trim(), type: formData.type });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="form-control w-full sm:col-span-2">
        <label className="label">
          <span className="label-text">Nama Store</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="contoh: Toko Blok M"
          required
        />
      </div>

      <div className="form-control w-full sm:col-span-1">
        <label className="label">
          <span className="label-text">Tipe</span>
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="select select-bordered w-full"
        >
          <option value="OFFLINE">Offline</option>
          <option value="TIKTOK">TikTok</option>
          <option value="SHOPEE">Shopee</option>
        </select>
      </div>

      <div className="sm:col-span-1 flex items-end justify-end">
        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          {initialData ? "Update Store" : "Create Store"}
        </button>
      </div>
    </form>
  );
}
