export type Role = "OWNER" | "STAFF";
export type BallStatus = "BELUM_DIBUKA" | "DIBUKA" | "SELESAI_SORTIR";
export type ChannelType = "SHOPEE" | "TIKTOK" | "OFFLINE";

export interface Ball {
  id: string;
  code: string;
  asal: string;
  kategori: string;
  supplierId: string;
  beratKg: number;
  hargaBeli: number;
  status: BallStatus;
  notaUrl?: string;
  createdAt: string;
  totalPcsOpened?: number | null; // ✅ tambahkan field baru di sini
}

export interface SortirInput {
  gradeA: number;
  gradeB: number;
  reject: number;
}

export interface Product {
  id: string;
  name: string;
  kategori: string;
  grade: "A" | "B" | "REJECT";
  hargaPcs?: number;
  hargaBorongan?: number;
  hargaKilo?: number;
  stock: number;
  imageUrl?: string;
  deletedAt?: string | null;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  index: number;
  active: boolean;
}

export interface SyncLog {
  id: string;
  channelId: string;
  action: string;
  success: boolean;
  message?: string;
  createdAt: string;
}
