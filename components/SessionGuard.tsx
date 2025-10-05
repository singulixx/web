"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function decodeJwtExp(token: string): number | null {
  try {
    const p = token.split(".")[1];
    if (!p) return null;
    const s = p.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const json = atob(s + pad);
    const obj = JSON.parse(json);
    return typeof obj.exp === "number" ? obj.exp : null;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  try {
    const direct = localStorage.getItem("token");
    if (direct) return direct;
    const z = JSON.parse(localStorage.getItem("auth-storage") || "{}");
    return z?.state?.token ?? null;
  } catch {
    return null;
  }
}

export default function SessionGuard() {
  const router = useRouter();
  const logoutTimer = useRef<number | null>(null);
  const warnTimer = useRef<number | null>(null);

  useEffect(() => {
    const schedule = (token: string) => {
      const exp = decodeJwtExp(token);
      const now = Date.now();
      const ms = exp ? exp * 1000 - now : 0;
      const doLogout = () => {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-storage");
        } catch {}
        toast.error("Sesi kadaluarsa. Silakan login lagi.");
        // Use replace to avoid back navigation to authed page
        router.replace("/login");
      };

      // Clear previous timers
      if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
      if (warnTimer.current) window.clearTimeout(warnTimer.current);

      if (!exp || ms <= 0) {
        doLogout();
        return;
      }

      logoutTimer.current = window.setTimeout(doLogout, ms);

      // Pre-warn: 5 minutes before expiry if possible; else 60s; else skip
      const fiveMin = 5 * 60 * 1000;
      const oneMin = 60 * 1000;
      const warnAt = ms > fiveMin ? ms - fiveMin : (ms > oneMin ? ms - oneMin : null);
      if (warnAt) {
        warnTimer.current = window.setTimeout(() => {
          const left = exp * 1000 - Date.now();
          const minutes = Math.max(1, Math.round(left / 60000));
          toast.warning(`Sesi akan berakhir dalam ${minutes} menit.`);
        }, warnAt);
      }
    };

    // Boot check
    const t = readToken();
    if (t) schedule(t);

    // Watch storage changes for cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "auth-storage") {
        const next = readToken();
        if (!next) {
          toast("Anda telah logout.");
          router.replace("/login");
        } else {
          schedule(next);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
    };
  }, [router]);

  return null;
}
