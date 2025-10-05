"use client";
import { Menu, LogOut } from "lucide-react";
import TokenCountdown from "@/components/TokenCountdown";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

type Props = { onMenu?: () => void };

export default function Topbar({ onMenu }: Props) {
  const { token, role, logout } = useAuth();

  const handleLogout = () => {
    toast("Anda telah logout.");
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/5 backdrop-blur border-b border-[color:var(--border-soft)] border-white/10">
      <div className="h-14 px-3 md:px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle menu"
            onClick={onMenu}
            className="p-2 rounded-lg hover:bg-white/10 text-white md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-white font-semibold">
            {token ? `Welcome ${role ?? ""}` : "Welcome Guest"}
          </div>
        </div>

        {token && (
          <div className="flex items-center gap-3">
            {/* <TokenCountdown /> */}
            <button
              aria-label="Logout"
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 text-white"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
