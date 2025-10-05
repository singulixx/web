// web/app/loading.tsx
import Image from "next/image";

export default function GlobalAppLoading() {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          {/* logo */}
          <Image
            src="/logo.png"
            alt="GIGAN"
            fill
            className="object-contain animate-[pulse_1.4s_ease-in-out_infinite]"
            priority
          />
          {/* ring anim */}
          <div className="absolute inset-0 rounded-full border-2 border-white/15 animate-[spin_4s_linear_infinite]" />
        </div>
        <p className="text-slate-100 text-sm">Memuat halaman...</p>
      </div>
    </div>
  );
}
