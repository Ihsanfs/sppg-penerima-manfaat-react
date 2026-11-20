"use client";

import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { api } from "@/lib/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { LuArrowLeft, LuLockKeyhole, LuMail } from "react-icons/lu";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      const destination = next?.startsWith("/admin") ? next : "/admin";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition hover:gap-3 dark:text-brand-400">
        <LuArrowLeft className="size-4" /> Kembali ke dashboard publik
      </Link>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-9">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-black text-white shadow-lg shadow-brand-600/25">
          S
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Masuk ke area admin</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Gunakan akun yang sudah terdaftar di sistem SPPG.
        </p>

        <div className="mt-6">
          <Alert message={error} onClose={() => setError(null)} />
        </div>

        <form onSubmit={submit} className="mt-2 space-y-5">
          <label className="block">
            <span className="field-label">Email</span>
            <div className="relative">
              <LuMail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@sppg.test"
                className="pl-10"
              />
            </div>
          </label>

          <label className="block">
            <span className="field-label">Password</span>
            <div className="relative">
              <LuLockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memeriksa..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Akun contoh: <strong className="text-slate-700 dark:text-slate-200">admin@sppg.test</strong>{" "}
          / <strong className="text-slate-700 dark:text-slate-200">password</strong>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-400">
        Data identitas penerima hanya tersedia setelah login.
      </p>
    </div>
  );
}

export function LoginPublicLink() {
  return (
    <Link href="/" className={buttonStyles({ variant: "outline", size: "sm" })}>
      Dashboard Publik
    </Link>
  );
}
