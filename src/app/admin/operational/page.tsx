"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/client";
import { GRUP_LABELS } from "@/lib/constants";
import type { OperationalData } from "@/lib/types";
import { formatTanggal, formatWaktu, todayString } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { LuCalendarDays, LuChartNoAxesCombined, LuFilePlus2 } from "react-icons/lu";

export default function OperationalPage() {
  const today = todayString();
  const [tanggal, setTanggal] = useState(today);
  const [data, setData] = useState<OperationalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.operational(tanggal));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data operasional.");
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => { void load(); }, [load]);

  const simpanSnapshot = async () => {
    if (tanggal > today) {
      setError("Tanggal tidak boleh di masa depan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await api.saveDailyReport({
        tanggal,
        sumber: "manual",
        catatan: "Snapshot dari halaman operasional",
      });
      setNotice(`Snapshot ${tanggal} tersimpan dengan total ${result.total} penerima.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan snapshot.");
    } finally {
      setSaving(false);
    }
  };

  const kategori = data?.snapshot.kategori_json ?? {};

  return (
    <div>
      <PageHeading
        eyebrow="Operasional"
        title="Data LIVE & ARSIP"
        description="Lihat data terkini (LIVE) atau snapshot yang sudah tersimpan (ARSIP) per tanggal."
        action={
          <Button onClick={() => void simpanSnapshot()} disabled={saving || tanggal > today}>
            <LuFilePlus2 className="size-4" /> {saving ? "Menyimpan..." : "Simpan Snapshot"}
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />

      <div className="surface mb-6 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <FormField label="Tanggal data" className="sm:w-64">
          <Input type="date" max={today} value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
        </FormField>
        {data && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={data.status === "LIVE" ? "success" : "warning"}>{data.status}</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatTanggal(data.tanggal)} · {data.saved ? "Snapshot tersedia" : "Mengikuti data terkini"}
            </span>
          </div>
        )}
      </div>

      {loading && !data && <LoadingState label="Memuat data operasional..." />}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total penerima" value={data.snapshot.total} hint={data.saved ? "Dari snapshot tersimpan" : "Data LIVE terkini"} icon={<LuChartNoAxesCombined className="size-5" />} />
            <StatCard label="Sumber" value={data.sumber || "-"} hint={data.saved ? formatWaktu(data.saved.saved_at) : "Belum ada snapshot"} accent="blue" />
            <StatCard label="Lembaga" value={data.snapshot.institusi.length} hint="Termasuk sekolah & posyandu" accent="amber" />
            <StatCard label="Status arsip" value={data.status} hint={data.isToday ? "Hari ini" : "Tanggal lampau"} accent="violet" />
          </section>

          {data.fallback && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {data.catatan || "Belum ada snapshot tersimpan untuk tanggal ini. Data LIVE ditampilkan sebagai fallback."}
            </div>
          )}

          <section className="surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <LuCalendarDays className="size-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Kalender Snapshot</h2>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[19rem] grid-cols-7 gap-1.5 text-center sm:min-w-0 sm:gap-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                  <div key={day} className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{day}</div>
                ))}
                {data.calendar.map((item) => {
                  const weekday = new Date(`${item.tanggal}T00:00:00Z`).getUTCDay();
                  const selected = item.tanggal === tanggal;
                  return (
                    <button
                      key={item.tanggal}
                      type="button"
                      disabled={item.tanggal > today}
                      onClick={() => setTanggal(item.tanggal)}
                      className={`flex h-14 flex-col items-center justify-center rounded-xl border text-xs transition disabled:opacity-30 sm:h-16 ${
                        selected
                          ? "border-brand-500 bg-brand-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-500/10"
                      }`}
                      style={{ gridColumn: item.tanggal === data.calendar[0]?.tanggal ? weekday + 1 : undefined }}
                    >
                      <span className="font-semibold">{Number(item.tanggal.slice(-2))}</span>
                      <span className={`mt-0.5 text-[10px] ${selected ? "text-white/80" : "text-slate-400"}`}>
                        {item.tersimpan ? item.total : "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Rekap Kategori</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
              {Object.entries(GRUP_LABELS).map(([kode, label]) => (
                <div key={kode} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{Number(kategori[kode] ?? 0)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Rincian per Lembaga</h2>
            </div>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-start">Lembaga</th>
                    <th className="px-4 py-3 text-start">Tipe</th>
                    <th className="px-4 py-3 text-end">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.snapshot.institusi.map((item) => (
                    <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3 font-medium">{item.nama}</td>
                      <td className="px-4 py-3">{item.tipe}</td>
                      <td className="px-4 py-3 text-end font-bold text-brand-600 dark:text-brand-400">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold dark:bg-slate-800/50">
                  <tr>
                    <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-end">{data.snapshot.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
