import { id } from "./id";
type Dict = typeof id;

// ⬇️ filter key agar hanya string (hindari symbol)
type Path<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: `${K}` | `${K}.${Path<T[K]>}`;
    }[Extract<keyof T, string>]
  : never;

const dict = id;

export function t(path: Path<Dict>, fallback?: string) {
  const keys = String(path).split(".");
  let cur: any = dict;
  for (const k of keys) cur = cur?.[k];
  return (cur as string) ?? fallback ?? path;
}
