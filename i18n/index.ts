import { id } from "./id";
type Dict = typeof id;
type Path<T> = T extends object ? { [K in keyof T]: `${K}` | `${K}.${Path<T[K]>}` }[keyof T] : never;
const dict = id;

export function t(path: Path<Dict>, fallback?: string) {
  return path.split(".").reduce<any>((acc, k) => (acc && k in acc ? (acc as any)[k] : undefined), dict) ?? fallback ?? path;
}
