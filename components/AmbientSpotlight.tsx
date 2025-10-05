"use client";
import { useEffect, useRef } from "react";

export default function AmbientSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX; const y = e.clientY;
      el.style.setProperty("--x", x + "px");
      el.style.setProperty("--y", y + "px");
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 fx-ambient" />
  );
}
