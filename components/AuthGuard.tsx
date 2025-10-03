"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

function decodeExp(token: string): number | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const b64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 2 ? "==" : b64.length % 4 === 3 ? "=" : "";
    const json = atob(b64 + pad);
    const obj = JSON.parse(json);
    return typeof obj.exp === "number" ? obj.exp : null;
  } catch { return null; }
}

function isAuthUrl(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : (input as any)?.url || "";
  return typeof url === "string" && url.includes("/api/auth/");
}

export default function AuthGuard() {
  const { token, logout } = useAuth();

  const enforce = () => {
    const t = useAuth.getState().token;
    if (!t) return;
    const exp = decodeExp(t);
    if (!exp || exp * 1000 <= Date.now()) logout();
  };

  // Auto-logout tepat saat exp
  useEffect(() => {
    if (!token) return;
    const exp = decodeExp(token);
    if (!exp) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) { logout(); return; }
    const t = setTimeout(() => logout(), ms);
    return () => clearTimeout(t);
  }, [token, logout]);

  // Optional console countdown (enabled when NEXT_PUBLIC_SHOW_SESSION_TIMER=1)
  useEffect(() => {
    if (!token) return;
    const show = process.env.NEXT_PUBLIC_SHOW_SESSION_TIMER === "1";
    if (!show) return;
    const exp = decodeExp(token);
    if (!exp) return;

    const log = () => {
      const leftMs = exp * 1000 - Date.now();
      const left = Math.max(0, Math.ceil(leftMs / 1000));
      console.log(`⏳ Session expires in ${left}s (exp: ${new Date(exp * 1000).toLocaleTimeString()})`);
    };

    log();
    const iv = setInterval(() => {
      log();
      if (exp * 1000 <= Date.now()) {
        console.log("🔒 Session expired — logging out…");
        clearInterval(iv);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [token]);

  // Re-check saat kembali fokus/visible & sync antar tab
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") enforce(); };
    const onFocus = () => enforce();
    const onStorage = (e: StorageEvent) => { if (e.key === "auth-storage") enforce(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Global fetch wrapper: attach token & logout on 401
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let i = init ?? {};
      const t = useAuth.getState().token;
      const headers = new Headers(i.headers || (input instanceof Request ? input.headers : undefined));
      if (t && !isAuthUrl(input) && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${t}`);

      if (input instanceof Request) {
        i = { ...i, headers };
        input = new Request(input, i);
      } else {
        i = { ...i, headers };
      }

      const res = await original(input, i);
      if (res.status === 401 && !isAuthUrl(input)) {
        try { await res.clone().json(); } catch {}
        logout();
      }
      return res;
    };
    return () => { window.fetch = original; };
  }, [logout]);

  return null;
}
