"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // ⬅️ tambahkan ini
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import Image from "next/image";
import { Auth } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth, token } = useAuth();

  useEffect(() => {
    if (token) router.replace("/");
  }, [token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Validation Error", {
        description: "Please fill in both username and password fields",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await Auth.login({ username, password });
      if (!data?.token) throw new Error("Token tidak ditemukan di response");
      setAuth(data.token, data.user?.role);

      try {
        const maxAge = 60 * 60 * 24 * 7; // 7 hari
        document.cookie = `token=${data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        document.cookie = `Authorization=Bearer ${data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      } catch {}

      toast.success("Login successful!", {
        description: "Welcome back to Gigan",
      });
      router.replace("/");
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (/Failed to fetch|NetworkError/i.test(msg)) {
        toast.error("Connection Error", {
          description:
            "Cannot connect to server. Please check your connection.",
        });
      } else if (/Server error|502|500/i.test(msg)) {
        toast.error("Server Error", {
          description: "Please check if the server is running on port 4000",
        });
      } else {
        toast.error("Login Failed", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="h-full p-4">
      <div className="min-h-full w-full max-w-md mx-auto grid grid-rows-[1fr_auto] gap-6 md:gap-8">
        <div className="row-start-1 md:self-center">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-md md:rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 relative">
                  <Image
                    src="/logo.png"
                    alt="Gigan Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Login to Gigan Store Management
              </h1>
              <p className="text-sm text-gray-400">
                Use demo credentials or your account.
              </p>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Username
                </label>
                <input
                  className="btn btn-primary w-full"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  className="btn btn-primary w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </div>
                ) : (
                  "Login"
                )}
              </button>

              {/* ⬇️ Link lupa password ditaruh di bawah tombol */}
              <div className="mt-3 text-right">
                <Link
                  href="/account/forgot"
                  className="text-sm underline hover:no-underline"
                >
                  Lupa password?
                </Link>
              </div>
            </form>

            <div className="btn btn-primary mt-6 p-4 /10 border border-gray-600/20 rounded-lg">
              <p className="text-xs text-gray-300 text-center">
                💡 Demo credentials: <b>sowner</b> / <b>s@123</b>
              </p>
            </div>
          </div>
        </div>

        <footer className="row-start-2 text-center text-xs text-gray-500 pb-[env(safe-area-inset-bottom)]">
          © 2025 Gigan · Created by Singulix. All rights reserved.
        </footer>
      </div>
    </section>
  );
}
