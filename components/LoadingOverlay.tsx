// web/components/LoadingOverlay.tsx
"use client";
import Image from "next/image";

export default function LoadingOverlay({
  show,
  text = "Memuat...",
}: {
  show: boolean;
  text?: string;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20">
          <Image
            src="/logo.png"
            alt="GIGAN"
            fill
            className="object-contain animate-[pulse_1.4s_ease-in-out_infinite]"
            priority
          />
          <div className="absolute inset-0 rounded-full border border-white/15 animate-[spin_5s_linear_infinite]" />
        </div>
        <p className="text-slate-100 text-sm">{text}</p>
      </div>
    </div>
  );
}
