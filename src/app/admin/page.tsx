"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/client";
import type { AdminDashboardData, AuditLog } from "@/lib/types";
import { formatWaktu } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuBuilding2,
  LuChartColumn,
  LuExternalLink,
  LuTags,
  LuUsers,
} from "react-icons/lu";

const column = createColumn<AuditLog>();
const auditColumns = [
  column.accessor("aksi", {
    header: "Aksi",
    cell: (info) => <Badge color="brand">{String(info.getValue())}</Badge>,
  }),
  column.accessor("user_name", {
    header: "Petugas",
    cell: (info) => info.getValue() || "-",
  }),
  column.accessor("tanggal_data", {
    header: "Tanggal data",
    cell: (info) => String(info.getValue() ?? "-"),
  }),
  column.accessor("total_sebelum", {
    header: "Sebelum",
    cell: (info) => Number(info.getValue() ?? 0),
  }),
  column.accessor("total_sesudah", {
    header: "Sesudah",
    cell: (info) => Number(info.getValue() ?? 0),
  }),
  column.accessor("selisih", {
    header: "Selisih",
    cell: (info) => Number(info.getValue() ?? 0),
  }),
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.dashboard()
      .then((result) => { if (active) setData(result); })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const maxRekap = Math.max(1, ...(data?.rekap.map((item) => item.nilai) ?? [1]));
  const totalGender = Math.max(1, (data?.gender.L ?? 0) + (data?.gender.P ?? 0));

  return (
    <div>
      <PageHeading
        eyebrow="Administrasi"
        title="Ringkasan SPPG"
        description="Statistik terkini dari database penerima manfaat."
        action={
          <Link href="/" className={buttonStyles({ variant: "outline" })}>
            <LuExternalLink className="size-4" /> Dashboard Publik
          </Link>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />
      {!data && !error && <LoadingState />}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Penerima aktif" value={data.counts.aktif} hint="Status aktif" icon={<LuUsers className="size-5" />} />
            <StatCard label="Non aktif / pindah" value={data.counts.nonaktif} hint="Tidak dihitung" accent="rose" icon={<LuUsers className="size-5" />} />
            <StatCard label="Lembaga" value={data.counts.lembaga} hint="Sekolah & posyandu" accent="blue" icon={<LuBuilding2 className="size-5" />} />
            <StatCard label="Kategori" value={data.counts.kategori} hint="Kategori aktif" accent="amber" icon={<LuTags className="size-5" />} />
            <StatCard label="Laporan harian" value={data.counts.laporan} hint="Snapshot tersimpan" accent="violet" icon={<LuChartColumn className="size-5" />} />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="surface p-6 xl:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <LuChartColumn className="size-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Rekap Kategori</h3>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {data.rekap.map((item) => (
                  <div key={item.kode}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.nilai}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(item.nilai / maxRekap) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Komposisi Gender</h3>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Laki-laki", value: data.gender.L, color: "bg-blue-500" },
                  { label: "Perempuan", value: data.gender.P, color: "bg-pink-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / totalGender) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Link href="/admin/beneficiaries" className={buttonStyles({ size: "sm" })}>Penerima</Link>
                <Link href="/admin/reports" className={buttonStyles({ variant: "outline", size: "sm" })}>Laporan</Link>
              </div>
            </div>
          </section>

          <DataTable
            title="Aktivitas Terbaru"
            description="Riwayat penyimpanan snapshot dan perubahan data."
            data={data.recent}
            columns={auditColumns}
            searchPlaceholder="Cari aktivitas..."
            pageSize={6}
          />

          <p className="text-center text-[11px] text-slate-400">
            Diperbarui {formatWaktu(new Date().toISOString())}
          </p>
        </div>
      )}
    </div>
  );
}
