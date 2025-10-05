"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SessionGuard from "@/components/SessionGuard";
import BackgroundFX from "@/components/BackgroundFX";
import AmbientSpotlight from "@/components/AmbientSpotlight";
import { useNetworkWatcher } from "@/lib/useNetwork";

function ClientLayout({ children }: { children: React.ReactNode }) {
  useNetworkWatcher();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Tutup sidebar saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll saat sidebar terbuka (mobile)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (open) {
      const hasScrollBar = window.innerWidth > html.clientWidth;
      const scrollBarWidth = hasScrollBar
        ? window.innerWidth - html.clientWidth
        : 0;
      body.style.overflow = "hidden";
      body.style.paddingRight = scrollBarWidth ? `${scrollBarWidth}px` : "";
    } else {
      body.style.overflow = "";
      body.style.paddingRight = "";
    }
    return () => {
      body.style.overflow = "";
      body.style.paddingRight = "";
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <SessionGuard />
      <AuthGuard />

      <div className="min-h-[100svh] relative flex bg-gradient-to-br from-[color:var(--bg-1)] via-[color:var(--bg-2)] to-[color:var(--bg-1)]">
        <BackgroundFX />
        <AmbientSpotlight />

        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* KUNCI: sidebar sudah sticky di md+, jadi tidak perlu offset margin kiri */}
        <div className="flex-1">
          <Topbar onMenu={() => setOpen(true)} />

          {/* Area konten */}
          <main className="min-h-[calc(100svh-4rem)] w-full px-4 lg:px-6 py-4 max-w-none fx-watermark nice-scrollbar motion-safe:transition-[padding] motion-safe:duration-300">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}

export default ClientLayout;
export { ClientLayout };
