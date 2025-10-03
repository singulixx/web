"use client";

export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Soft aurora blobs in grayscale */}
      <div className="btn btn-primary hidden md:block absolute -top-28 left-[12%] w-[38rem] h-[38rem] rounded-full /18 blur-3xl fx-float will-change-transform" />
      <div className="hidden md:block absolute top-1/3 right-[10%] w-[42rem] h-[42rem] rounded-full bg-neutral-500/14 blur-3xl fx-float-2 will-change-transform" />

      {/* Animated subtle grid */}
      <div className="hidden md:block absolute inset-0 fx-grid" />

      {/* Vignette */}
      <div className="hidden md:block absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_10%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.25)_80%)]" />

      {/* Film grain */}
      <div className="absolute inset-0 fx-noise opacity-20 mix-blend-overlay" />
    </div>
  );
}
