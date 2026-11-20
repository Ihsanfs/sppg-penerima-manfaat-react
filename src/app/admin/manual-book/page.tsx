import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import Link from "next/link";
import {
  LuBookOpen,
  LuChartColumn,
  LuDownload,
  LuHistory,
  LuMapPinned,
  LuSettings,
  LuShieldCheck,
  LuUsers,
} from "react-icons/lu";

const sections = [
  {
    title: "Dashboard Publik",
    icon: LuBookOpen,
    body: "Halaman utama (/') dapat diakses tanpa login dan hanya menampilkan data agregat: total penerima, rekap kategori, komposisi gender, serta rincian penerima per sekolah dan posyandu. Tidak ada NIK, NISN, atau identitas perorangan.",
    href: "/",
    link: "Buka dashboard publik",
  },
  {
    title: "Login & Role",
    icon: LuShieldCheck,
    body: "Area /admin dilindungi middleware. Akun admin dapat mengelola seluruh data, termasuk menghapus data, mengimpor file, mengubah profil, dan mengelola pengguna. Akun petugas dapat mengelola data namun tidak dapat menghapus, mengimpor, atau mengubah pengaturan.",
  },
  {
    title: "Data Master",
    icon: LuUsers,
    body: "Penerima manfaat, lembaga, dan kategori dapat ditambah, diubah, dan dicari. Tabel mendukung pencarian, sorting per kolom, pagination, serta filter tambahan. Setiap perubahan penerima wajib mencantumkan alasan dan tercatat di riwayat.",
    href: "/admin/beneficiaries",
    link: "Kelola penerima",
  },
  {
    title: "Snapshot & Operasional",
    icon: LuChartColumn,
    body: "Simpan Snapshot mengambil data penerima aktif terkini. Halaman Operasional LIVE/ARSIP menampilkan data hari ini atau snapshot tanggal lampau. Jika suatu tanggal belum punya snapshot, sistem menampilkan data LIVE sebagai fallback.",
    href: "/admin/operational",
    link: "Buka operasional",
  },
  {
    title: "Laporan Mingguan",
    icon: LuChartColumn,
    body: "Rekap Senin–Jumat menampilkan status Sudah diupdate, Otomatis, Belum ada data, atau Belum jatuh tempo, lengkap dengan selisih terhadap snapshot sebelumnya dan tren 20 laporan terbaru.",
    href: "/admin/weekly-report",
    link: "Buka laporan mingguan",
  },
  {
    title: "GIS Lembaga",
    icon: LuMapPinned,
    body: "Peta menampilkan titik sekolah dan posyandu serta pusat SPPG. Jarak dihitung dari koordinat profil. Simulasi rute dan radius 15 km dapat diaktifkan untuk keperluan perencanaan distribusi.",
    href: "/admin/gis",
    link: "Buka peta",
  },
  {
    title: "Impor / Ekspor",
    icon: LuDownload,
    body: "Unduh template CSV/XLSX, isi sesuai contoh, lalu unggah pada jenis data yang sesuai. Format .xlsx, .xls, dan .csv didukung. Hasil impor menampilkan jumlah berhasil/gagal serta maksimal 200 baris error. Ekspor tersedia untuk penerima, lembaga, dan riwayat.",
    href: "/admin/impor-ekspor",
    link: "Buka impor/ekspor",
  },
  {
    title: "Riwayat & Audit",
    icon: LuHistory,
    body: "Riwayat Penerima mencatat dibuat, diperbarui, dan dihapus beserta alasan serta field yang berubah. Audit Log mencatat aktivitas snapshot harian, termasuk total sebelum/sesudah dan selisihnya.",
    href: "/admin/history",
    link: "Lihat riwayat",
  },
  {
    title: "Profil SPPG",
    icon: LuSettings,
    body: "Nama, alamat, kecamatan, kabupaten, provinsi, dan koordinat SPPG diisi di sini. Perubahan langsung memengaruhi identitas pada dashboard publik dan titik pusat peta GIS.",
    href: "/admin/profile",
    link: "Ubah profil",
  },
];

export default function ManualBookPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Data & Pengaturan"
        title="Manual Book"
        description="Panduan singkat penggunaan sistem penerima manfaat SPPG Samarang."
        action={<Badge color="brand">Versi Next.js</Badge>}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="surface flex flex-col p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                    Bagian {index + 1}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{section.title}</h2>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {section.body}
              </p>
              {section.href && (
                <Link href={section.href} className={`${buttonStyles({ variant: "soft", size: "sm" })} mt-5 self-start`}>
                  {section.link}
                </Link>
              )}
            </section>
          );
        })}
      </div>

      <div className="surface mt-6 p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Akun Uji</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
            <p className="font-semibold text-slate-800 dark:text-white">Admin</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">admin@sppg.test / password</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
            <p className="font-semibold text-slate-800 dark:text-white">Petugas</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">petugas@sppg.test / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
