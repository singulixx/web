"use client";
import { useEffect, useState } from "react";
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

export default function TokenCountdown() {
  const { token } = useAuth();
  const [left, setLeft] = useState<number | null>(null);
  const [expStr, setExpStr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLeft(null); setExpStr(null); return; }
    const exp = decodeExp(token);
    if (!exp) { setLeft(null); setExpStr(null); return; }
    setExpStr(new Date(exp * 1000).toLocaleTimeString());
    const update = () => {
      const ms = exp * 1000 - Date.now();
      setLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [token]);

  if (left == null) return null;
  const mm = Math.floor(left / 60);
  const ss = left % 60;

  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <span className="hidden md:inline">Session</span>
      <span className="font-mono px-2 py-1 rounded bg-white/10">{mm}:{ss.toString().padStart(2,"0")}</span>
      {expStr ? <span className="hidden lg:inline text-white/50">exp {expStr}</span> : null}
    </div>
  );
}
