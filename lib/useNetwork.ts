"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export function useNetworkWatcher() {
  useEffect(() => {
    function onOffline() {
      toast.warning("Koneksi internet terputus. Beberapa aksi mungkin gagal.", { duration: 4000 });
    }
    function onOnline() {
      toast.success("Koneksi kembali online.", { duration: 2500 });
    }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    // initial state hint
    if (typeof navigator !== "undefined" && !navigator.onLine) onOffline();
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);
}
