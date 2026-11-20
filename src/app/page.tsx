import { InstitutionTable } from "@/components/public/institution-table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getPublicDashboard } from "@/lib/queries";
import { formatTanggal } from "@/lib/utils";
import Link from "next/link";
import {
  LuArrowRight,
  LuBuilding2,
  LuCalendarDays,
  LuHeartHandshake,
  LuInfo,
  LuUsers,
} from "react-icons/lu";

export const dynamic = "force-dynamic";

function profileName(profile: Record<string, unknown> | null): string {
  if (!profile) return "SPPG Samarang";
  for (const key of ["nama_sppg", "nama", "nama_instansi", "instansi"]) {
    const value = profile[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "SPPG Samarang";
}

function profileLocation(profile: Record<string, unknown> | null): string {
  if (!profile) return "Samarang, Garut, Jawa Barat";
  const parts = ["kecamatan", "kabupaten", "provinsi"]
    .map((key) => profile[key])
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  return parts.length ? parts.join(", ") : "Lokasi SPPG belum diisi";
}

export default async function PublicDashboardPage() {
  let data: Awaited<ReturnType<typeof getPublicDashboard>> | null = null;
  let error: string | null = null;

  try {
    data = await getPublicDashboard();
  } catch (err) {
    error = err instanceof Error ? err.message : "Gagal memuat data publik.";
  }

  const maxRekap = Math.max(1, ...(data?.rekap.map((item) => item.nilai) ?? [1]));
  const totalGender = Math.max(1, (data?.jumlahLaki ?? 0) + (data?.jumlahPerempuan ?? 0));
  const lakiPersen = Math.round(((data?.jumlahLaki ?? 0) / totalGender) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-emerald-950 text-white">
        <div className="absolute -top-40 -right-32 size-125 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-20 size-125 rounded-full bg-brand-300/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black shadow-lg backdrop-blur-sm">
              S
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[.2em] text-brand-200 uppercase">
                {profileName(data?.profile ?? null)}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Dashboard Penerima Manfaat
              </h1>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-brand-100/80">
                <LuCalendarDays className="size-4" /> {formatTanggal(data?.tanggal)} · Data agregat
              </p>
              <p className="mt-1 text-xs text-brand-200/80">
                {profileLocation(data?.profile ?? null)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle className="border-white/25 bg-white/10 text-white hover:border-white/50 hover:text-white dark:border-white/25 dark:bg-white/10" />
            <Link href="/login" className={buttonStyles({ variant: "soft", className: "bg-white text-brand-800 hover:bg-brand-50" })}>
              Area Admin <LuArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8 sm:py-10">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="surface px-6 py-20 text-center text-sm text-slate-500">Memuat data publik...</div>
        )}

        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total penerima aktif"
                value={data.snapshot.total}
                hint="Seluruh lembaga"
                icon={<LuUsers className="size-5" />}
              />
              <StatCard
                label="Sekolah"
                value={data.totalSekolah}
                hint={`${data.sekolah.length} lembaga`}
                accent="blue"
                icon={<LuBuilding2 className="size-5" />}
              />
              <StatCard
                label="Posyandu"
                value={data.totalPosyandu}
                hint={`${data.posyandu.length} lembaga`}
                accent="amber"
                icon={<LuHeartHandshake className="size-5" />}
              />
              <StatCard
                label="Laki-laki / Perempuan"
                value={`${data.jumlahLaki} / ${data.jumlahPerempuan}`}
                hint="Komposisi gender"
                accent="violet"
                icon={<LuUsers className="size-5" />}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="surface p-6 lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rekap Kategori Penerima</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Ringkasan jumlah penerima berdasarkan kelompok kategori.
                    </p>
                  </div>
                  <Badge color="brand">{data.rekap.length} kategori</Badge>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {data.rekap.map((item) => (
                    <div key={item.kode}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.nilai}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                          style={{ width: `${Math.max(2, (item.nilai / maxRekap) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface flex flex-col items-center justify-center p-6">
                <h2 className="self-start text-lg font-bold text-slate-900 dark:text-white">Komposisi Gender</h2>
                <p className="mt-1 self-start text-xs text-slate-500 dark:text-slate-400">
                  Perbandingan penerima aktif
                </p>
                <div
                  className="relative mt-6 flex size-44 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#10b981 0% ${lakiPersen}%, #ec4899 ${lakiPersen}% 100%)`,
                  }}
                >
                  <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.snapshot.total}</span>
                    <span className="text-[11px] text-slate-400">total penerima</span>
                  </div>
                </div>
                <div className="mt-6 grid w-full grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                    <LuUsers className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">{data.jumlahLaki}</p>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Laki-laki</p>
                  </div>
                  <div className="rounded-xl bg-pink-50 p-3 text-center dark:bg-pink-500/10">
                    <LuUsers className="mx-auto size-4 text-pink-600 dark:text-pink-400" />
                    <p className="mt-1 text-lg font-bold text-pink-700 dark:text-pink-300">{data.jumlahPerempuan}</p>
                    <p className="text-[11px] text-pink-600/80 dark:text-pink-400/80">Perempuan</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <InstitutionTable
                data={data.sekolah}
                title="Sekolah"
                description="Jumlah penerima manfaat per sekolah."
                searchPlaceholder="Cari sekolah..."
              />
              <InstitutionTable
                data={data.posyandu}
                title="Posyandu"
                description="Jumlah penerima manfaat per posyandu."
                searchPlaceholder="Cari posyandu..."
              />
            </section>

            {data.savedToday && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Snapshot hari ini tersimpan pukul {String(data.savedToday.saved_at).slice(11, 19)} · total{" "}
                {data.savedToday.total} penerima
              </p>
            )}

            <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4 text-xs text-brand-900 dark:border-brand-500/20 dark:bg-brand-500/5 dark:text-brand-200">
              <LuInfo className="mt-0.5 size-4 shrink-0" />
              <p>
                Halaman ini hanya menampilkan data agregat. Data identitas penerima tersedia di area admin setelah login.
              </p>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} SPPG Samarang · Sistem Informasi Penerima Manfaat
      </footer>
    </div>
  );
}
