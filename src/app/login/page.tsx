import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LuChartPie, LuDatabase, LuMapPinned, LuShieldCheck } from "react-icons/lu";

const highlights = [
  { icon: LuChartPie, text: "Rekap penerima manfaat per kategori" },
  { icon: LuDatabase, text: "Kelola penerima, lembaga, dan kategori" },
  { icon: LuMapPinned, text: "Sebaran geografis sekolah dan posyandu" },
  { icon: LuShieldCheck, text: "Data agregat publik tanpa login" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-900 p-12 text-white lg:flex">
        <div className="absolute -top-32 -right-32 size-125 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-40 -left-24 size-125 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-lg font-black">S</div>
            <span className="font-bold tracking-wide">SPPG SAMARANG</span>
          </div>
          <h1 className="mt-14 max-w-lg text-4xl leading-tight font-bold xl:text-5xl">
            Sistem Informasi Penerima Manfaat MBG
          </h1>
          <p className="mt-6 max-w-md text-brand-50/80">
            Satu tempat untuk mengelola data penerima, lembaga, kategori, laporan harian, dan sebaran geografis.
          </p>
          <div className="mt-12 grid max-w-md gap-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <Icon className="size-5 shrink-0 text-brand-200" />
                  <span className="text-sm text-white/90">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative text-sm text-brand-100/70">
          Dashboard publik tersedia tanpa login di halaman utama.
        </p>
      </div>

      <div className="relative flex w-full items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="absolute top-5 right-5 lg:hidden">
          <ThemeToggle />
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
