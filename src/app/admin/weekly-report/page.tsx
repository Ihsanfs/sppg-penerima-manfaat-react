"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { FormField, Input } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/client";
import type { WeeklyDay, WeeklyReportData } from "@/lib/types";
import { formatTanggal, todayString } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { LuCalendarDays, LuChartColumn, LuPrinter } from "react-icons/lu";

type RecentRow = { id: string; tanggal: string; total: number; selisih: number | null };

const column = createColumn<RecentRow>();
const dayColumn = createColumn<WeeklyDay>();

function statusColor(status: WeeklyDay["status"]): "success" | "info" | "warning" | "neutral" {
  if (status === "Sudah diupdate") return "success";
  if (status === "Otomatis") return "info";
  if (status === "Belum ada data") return "warning";
  return "neutral";
}

export default function WeeklyReportPage() {
  const today = todayString();
  const [tanggal, setTanggal] = useState(today);
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.weeklyReport(tanggal));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan mingguan.");
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => { void load(); }, [load]);

  const columns = [
    dayColumn.accessor("hari", { header: "Hari", cell: (info) => <span className="font-semibold">{info.getValue()}</span> }),
    dayColumn.accessor("tanggal", { header: "Tanggal" }),
    dayColumn.accessor("status", {
      header: "Status",
      cell: (info) => <Badge color={statusColor(info.getValue())}>{info.getValue()}</Badge>,
    }),
    dayColumn.accessor("report", {
      header: "Total",
      cell: (info) => info.getValue() ? Number(info.getValue()?.total ?? 0) : "-",
    }),
    dayColumn.accessor("selisih", {
      header: "Selisih",
      cell: (info) => {
        const value = Number(info.getValue() ?? 0);
        return <Badge color={value > 0 ? "success" : value < 0 ? "danger" : "neutral"}>{value > 0 ? "+" : ""}{value}</Badge>;
      },
    }),
    dayColumn.accessor("report", {
      id: "catatan",
      header: "Catatan",
      cell: (info) => info.getValue()?.catatan || "-",
    }),
  ];

  const recentColumns = [
    column.accessor("tanggal", { header: "Tanggal" }),
    column.accessor("total", {
      header: "Total",
      cell: (info) => <span className="font-bold text-brand-600 dark:text-brand-400">{info.getValue()}</span>,
    }),
    column.accessor("selisih", {
      header: "Selisih",
      cell: (info) => {
        const value = Number(info.getValue() ?? 0);
        return <Badge color={value > 0 ? "success" : value < 0 ? "danger" : "neutral"}>{value > 0 ? "+" : ""}{value}</Badge>;
      },
    }),
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Laporan"
        title="Laporan Mingguan"
        description="Rekap Senin–Jumat beserta status pembaruan dan tren snapshot terbaru."
        action={
          <Button variant="outline" onClick={() => window.print()}>
            <LuPrinter className="size-4" /> Cetak
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />

      <div className="surface mb-6 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <FormField label="Acuan tanggal" className="sm:w-64">
          <Input type="date" max={today} value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
        </FormField>
        {data && (
          <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <LuCalendarDays className="size-4" /> {formatTanggal(data.start)} s.d. {formatTanggal(data.end)}
          </p>
        )}
      </div>

      {loading && !data && <LoadingState label="Memuat laporan mingguan..." />}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Hari kerja" value={data.days.length} hint="Senin sampai Jumat" icon={<LuCalendarDays className="size-5" />} />
            <StatCard label="Sudah diupdate" value={data.totalUpdate} hint="Snapshot manual" accent="blue" icon={<LuChartColumn className="size-5" />} />
            <StatCard label="Otomatis" value={data.totalOtomatis} hint="Snapshot cron" accent="amber" />
            <StatCard label="Belum ada data" value={data.days.filter((day) => day.status === "Belum ada data").length} hint="Perlu diperiksa" accent="rose" />
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Rekap Senin–Jumat</h2>
            </div>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-start">Hari</th>
                    <th className="px-4 py-3 text-start">Tanggal</th>
                    <th className="px-4 py-3 text-start">Status</th>
                    <th className="px-4 py-3 text-end">Total</th>
                    <th className="px-4 py-3 text-end">Selisih</th>
                    <th className="px-4 py-3 text-start">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.days.map((day) => (
                    <tr key={day.tanggal} className="text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3 font-semibold">{day.hari}</td>
                      <td className="px-4 py-3">{day.tanggal}</td>
                      <td className="px-4 py-3"><Badge color={statusColor(day.status)}>{day.status}</Badge></td>
                      <td className="px-4 py-3 text-end">{day.report ? Number(day.report.total) : "-"}</td>
                      <td className="px-4 py-3 text-end">{day.selisih === null ? "-" : day.selisih}</td>
                      <td className="px-4 py-3">{day.report?.catatan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <DataTable
            data={data.recent.map((row) => ({ ...row, id: row.tanggal }))}
            columns={recentColumns}
            title="Tren Snapshot Terbaru"
            description="Dua puluh snapshot terakhir sebelum tanggal acuan."
            searchPlaceholder="Cari tanggal..."
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
}
