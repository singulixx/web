"use client";
import Link from "next/link";
import Image from "next/image";
import clsx from "classnames";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { menuTree, publicMenu } from "@/config/menu";
import { INDICATOR_STYLE } from "@/config/ui";
import { ChevronDown } from "lucide-react";

type SidebarProps = { open: boolean; onClose?: () => void };

// helper agar path konsisten (tanpa trailing slash)
const normalize = (s?: string) => {
  if (!s) return "/";
  const n = s.replace(/\/+$/, "");
  return n === "" ? "/" : n;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathnameRaw = usePathname();
  const pathname = useMemo(() => normalize(pathnameRaw || "/"), [pathnameRaw]);
  const router = useRouter();
  const { token } = useAuth();
  const menu = token ? menuTree : publicMenu;

  // ACTIVE RULES
  // - Single item (tanpa children): aktif jika exact atau startsWith (biar aktif di sub-route)
  const isActiveSection = (href?: string) => {
    if (!href) return false;
    const h = normalize(href);
    return pathname === h || pathname.startsWith(h + "/");
  };
  // - Leaf/child: aktif HANYA jika EXACT
  const isActiveLeaf = (href?: string) => {
    if (!href) return false;
    return pathname === normalize(href);
  };
  // - Parent open jika ada child yang aktif (section)
  const isParentOpen = (children?: { href?: string }[]) =>
    !!children?.some((c) => isActiveSection(c.href));

  // prefetch ringan
  useEffect(() => {
    const id = (window as any).requestIdleCallback?.(
      () => {
        menu.forEach((m) => {
          if (m.href) router.prefetch(m.href);
          m.children?.forEach((c) => c.href && router.prefetch(c.href));
        });
      },
      { timeout: 1500 }
    );
    return () =>
      id &&
      (window as any).cancelIdleCallback &&
      (window as any).cancelIdleCallback(id);
  }, [menu, router]);

  const easeOpen = "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]";
  const easeClose = "[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]";

  return (
    <>
      {/* overlay (mobile) */}
      <button
        aria-hidden={!open}
        aria-label="Close sidebar backdrop"
        onClick={() => onClose?.()}
        className={clsx(
          "fixed inset-0 z-30 md:hidden backdrop-blur-[1px] bg-black/40 motion-safe:transition-opacity",
          open
            ? `opacity-100 duration-300 ${easeOpen}`
            : `opacity-0 duration-200 ${easeClose}`,
          !open && "pointer-events-none"
        )}
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 sidebar-shell text-white overflow-x-hidden",
          "transform-gpu will-change-transform shadow-2xl ring-1 ring-white/10 motion-safe:transition-transform",
          open
            ? `translate-x-0 duration-400 ${easeOpen}`
            : `-translate-x-full duration-300 ${easeClose}`,
          "md:sticky md:top-0 md:translate-x-0 md:pointer-events-auto md:h-screen md:duration-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-expanded={open}
      >
        <div className="h-full flex flex-col p-3 md:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {/* logo */}
          <div className="mb-3 px-2 flex justify-center items-center logo-wrap">
            <Image
              src="/logo.png"
              alt="Gigan Logo"
              width={180}
              height={108}
              className="object-contain w-40 md:w-48 h-auto"
              priority
            />
          </div>

          {/* badge */}
          <div className="px-2 -mt-2 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-300 bg-neutral-900/60 border border-neutral-800 rounded-full px-2 py-1">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="text-emerald-400 opacity-90"
              >
                <circle cx="12" cy="12" r="9" fill="currentColor" />
              </svg>
              Created by Singulix
            </span>
          </div>

          {/* menu dengan tree line */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-3 overscroll-contain nice-scrollbar">
            {menu.map((item) => (
              <div key={item.key}>
                {item.children ? (
                  <details className="group" open={isParentOpen(item.children)}>
                    <summary className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5">
                      <span className="flex items-center gap-2">
                        {item.icon ? (
                          <item.icon
                            className="w-4 h-4 opacity-90"
                            aria-hidden
                          />
                        ) : null}
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={clsx(
                          "w-4 h-4 shrink-0 transition-transform",
                          "group-open:rotate-0",
                          !isParentOpen(item.children) && "-rotate-90"
                        )}
                      />
                    </summary>

                    {/* UL anak: tree line */}
                    <ul className="mt-1 ml-3">
                      {item.children.map((c, i) => {
                        const active = isActiveLeaf(c.href); // EXACT match untuk leaf
                        const isLast = i === item.children!.length - 1;
                        return (
                          <li
                            key={c.key ?? i}
                            className={clsx(
                              "relative py-1 pl-7",
                              "before:content-[''] before:absolute before:left-2 before:top-0 before:bottom-0 before:border-l before:border-dashed before:border-slate-300/70",
                              isLast && "before:h-1/2 before:bottom-auto"
                            )}
                          >
                            <span
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-4 border-b border-dashed border-slate-300/70"
                              aria-hidden
                            />
                            <Link
                              prefetch
                              href={c.href!}
                              onClick={() => onClose?.()}
                              className={clsx(
                                "relative flex items-center gap-2 px-3 py-2 pr-6 rounded-lg hover:bg-white/5",
                                active && "bg-white/10"
                              )}
                            >
                              {c.icon ? (
                                <c.icon
                                  className="w-4 h-4 opacity-90"
                                  aria-hidden
                                />
                              ) : null}
                              <span className="text-sm flex-1 truncate">
                                {c.label}
                              </span>

                              {/* DOT hanya untuk leaf aktif */}
                              {INDICATOR_STYLE === "dot" && active ? (
                                <span
                                  aria-hidden
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                                />
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ) : (
                  <Link
                    prefetch
                    href={item.href!}
                    onClick={() => onClose?.()}
                    className={clsx(
                      "relative flex items-center gap-3 px-3 py-2 pr-6 rounded-xl motion-safe:transition-[background-color,transform,color] motion-safe:duration-200 hover:scale-[1.01]",
                      isActiveSection(item.href) &&
                        "bg-neutral-800 text-white border border-neutral-700"
                    )}
                  >
                    {item.icon ? (
                      <item.icon className="w-4 h-4 opacity-90" aria-hidden />
                    ) : null}
                    <span className="text-sm flex-1 truncate">
                      {item.label}
                    </span>
                    {/* DOT boleh untuk single/top-level aktif */}
                    {INDICATOR_STYLE === "dot" && isActiveSection(item.href) ? (
                      <span
                        aria-hidden
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                      />
                    ) : null}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <p className="text-[11px] copyright mt-6 px-2 select-none">
            © 2025 Gigan · Created by Singulix
          </p>
        </div>
      </aside>
    </>
  );
}
