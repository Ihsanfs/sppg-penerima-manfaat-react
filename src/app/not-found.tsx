import { buttonStyles } from "@/components/ui/button";
import Link from "next/link";
import { LuArrowLeft, LuLayoutDashboard } from "react-icons/lu";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center dark:bg-slate-950">
      <p className="text-sm font-bold tracking-[.3em] text-brand-600 uppercase dark:text-brand-400">404</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Alamat yang Anda buka tidak tersedia. Kembali ke dashboard publik atau masuk ke area administrasi.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonStyles()}>
          <LuLayoutDashboard className="size-4" /> Dashboard Publik
        </Link>
        <Link href="/login" className={buttonStyles({ variant: "outline" })}>
          <LuArrowLeft className="size-4" /> Area Admin
        </Link>
      </div>
    </div>
  );
}
