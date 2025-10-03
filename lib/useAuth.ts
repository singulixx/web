"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "OWNER" | "STAFF";

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

let logoutTimer: any = null;
function scheduleAutoLogout(token: string | null, logout: () => void) {
  if (logoutTimer) clearTimeout(logoutTimer);
  if (!token) return;
  const exp = decodeExp(token);
  if (!exp) return;
  const ms = exp * 1000 - Date.now();
  if (ms <= 0) logout();
  else logoutTimer = setTimeout(() => logout(), ms);
}

type AuthState = {
  token: string | null;
  role: Role | null;
  setAuth: (token: string, role: Role) => void;
  login: (token: string, role: Role) => void; // alias
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      setAuth: (token, role) => {
        set({ token, role });
        scheduleAutoLogout(token, () => get().logout());
      },
      login: (token, role) => {
        get().setAuth(token, role);
      },
      logout: () => {
        set({ token: null, role: null });
        if (typeof window !== "undefined") window.location.href = "/login";
      },
    }),
    { name: "auth-storage" }
  )
);

// Boot-time check
if (typeof window !== "undefined") {
  const { token } = useAuth.getState();
  if (token) {
    const exp = decodeExp(token);
    if (!exp || exp * 1000 <= Date.now()) useAuth.getState().logout();
    else scheduleAutoLogout(token, () => useAuth.getState().logout());
  }
}
