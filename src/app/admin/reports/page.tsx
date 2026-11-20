"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import { GRUP_LABELS } from "@/lib/constants";
import type { DailyReport, DailyReportDetail } from "@/lib/types";
import { formatWaktu, parseKategori, todayString } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { LuEye, LuFilePlus2, LuPrinter } from "react-icons/lu";

const column = createColumn<DailyReport>();

function today(): string {
  return todayString();
}

export default function ReportsPage() {
  const [rows, setRows] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tanggal: today(), sumber: "manual", catatan: "" });
  const [detail, setDetail] = useState<{ report: DailyReport; details: DailyReportDetail[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.dailyReports();
      setRows(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (row: DailyReport) => {
    setDetail({ report: row, details: [] });
    setDetailLoading(true);
    setError(null);
    try {
      setDetail(await api.dailyReportDetail(row.id));
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Gagal memuat detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const submit = async () => {
    if (form.tanggal > today()) {
      setError("Tanggal snapshot tidak boleh di masa depan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await api.saveDailyReport(form);
      setNotice(`Snapshot tersimpan. Total ${result.total} penerima.`);
      setSaveOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan snapshot.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    column.accessor("tanggal", {
      header: "Tanggal",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
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
    column.accessor("sumber", {
      header: "Sumber",
      cell: (info) => <Badge color={info.getValue() === "cron" ? "info" : "neutral"}>{info.getValue()}</Badge>,
    }),
    column.accessor("saved_by_name", { header: "Petugas", cell: (info) => info.getValue() || "-" }),
    column.accessor("saved_at", { header: "Waktu Simpan", cell: (info) => formatWaktu(info.getValue()) }),
    column.display({
      id: "actions",
      header: "Aksi",
      cell: (info) => (
        <Button size="sm" variant="outline" onClick={() => void openDetail(info.row.original)}>
          <LuEye className="size-4" /> Detail
        </Button>
      ),
    }),
  ];

  const detailKategori = detail ? parseKategori(detail.report.kategori_json) : {};

  return (
    <div>
      <PageHeading
        eyebrow="Laporan"
        title="Laporan Harian"
        description="Simpan snapshot harian dan lihat rincian per lembaga."
        action={
          <Button onClick={() => { setForm((prev) => ({ ...prev, tanggal: today() })); setSaveOpen(true); }}>
            <LuFilePlus2 className="size-4" /> Simpan Snapshot
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />
      {loading && !rows.length ? (
        <LoadingState />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          title="Riwayat Laporan"
          description="Klik header untuk sorting; gunakan pencarian untuk filter cepat."
          searchPlaceholder="Cari tanggal, sumber, atau petugas..."
          pageSize={10}
        />
      )}

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Simpan Snapshot Harian"
        description="Data diambil langsung dari penerima aktif saat ini."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>Batal</Button>
            <Button type="button" onClick={() => void submit()} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Snapshot"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tanggal" required>
            <Input type="date" max={today()} value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} />
          </FormField>
          <FormField label="Sumber">
            <Select value={form.sumber} onChange={(event) => setForm({ ...form, sumber: event.target.value })}>
              <option value="manual">Manual</option>
              <option value="cron">Otomatis</option>
            </Select>
          </FormField>
          <FormField label="Catatan" className="sm:col-span-2">
            <Textarea value={form.catatan} onChange={(event) => setForm({ ...form, catatan: event.target.value })} placeholder="Catatan opsional" />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Detail Laporan ${detail?.report.tanggal ?? ""}`}
        description={detail ? `Total ${detail.report.total} penerima · ${detail.details.length} lembaga` : undefined}
        size="xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <LuPrinter className="size-4" /> Cetak
            </Button>
            <Button type="button" variant="outline" onClick={() => setDetail(null)}>Tutup</Button>
          </>
        }
      >
        {detailLoading && <LoadingState label="Memuat detail..." />}
        {detail && !detailLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
              {Object.entries(GRUP_LABELS).map(([kode, label]) => (
                <div key={kode} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{detailKategori[kode] ?? 0}</p>
                </div>
              ))}
            </div>

            <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-start">Lembaga</th>
                    <th className="px-4 py-3 text-start">Tipe</th>
                    <th className="px-4 py-3 text-end">TK/PAUD</th>
                    <th className="px-4 py-3 text-end">Kelas 1-3</th>
                    <th className="px-4 py-3 text-end">Kelas 4-6</th>
                    <th className="px-4 py-3 text-end">SMK</th>
                    <th className="px-4 py-3 text-end">Guru</th>
                    <th className="px-4 py-3 text-end">Balita</th>
                    <th className="px-4 py-3 text-end">Bumil</th>
                    <th className="px-4 py-3 text-end">Busui</th>
                    <th className="px-4 py-3 text-end">Kader</th>
                    <th className="px-4 py-3 text-end">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detail.details.map((item) => (
                    <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3 font-medium">{item.institution_nama ?? "-"}</td>
                      <td className="px-4 py-3">{item.institution_tipe ?? "-"}</td>
                      <td className="px-4 py-3 text-end">{item.tk_paud}</td>
                      <td className="px-4 py-3 text-end">{item.kelas_1 + item.kelas_2 + item.kelas_3}</td>
                      <td className="px-4 py-3 text-end">{item.kelas_4 + item.kelas_5 + item.kelas_6}</td>
                      <td className="px-4 py-3 text-end">{item.smk}</td>
                      <td className="px-4 py-3 text-end">{item.guru}</td>
                      <td className="px-4 py-3 text-end">{item.balita}</td>
                      <td className="px-4 py-3 text-end">{item.bumil}</td>
                      <td className="px-4 py-3 text-end">{item.busui}</td>
                      <td className="px-4 py-3 text-end">{item.kader}</td>
                      <td className="px-4 py-3 text-end font-bold text-brand-600 dark:text-brand-400">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold dark:bg-slate-800/50">
                  <tr>
                    <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.tk_paud, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.kelas_1 + d.kelas_2 + d.kelas_3, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.kelas_4 + d.kelas_5 + d.kelas_6, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.smk, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.guru, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.balita, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.bumil, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.busui, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.kader, 0)}</td>
                    <td className="px-4 py-3 text-end">{detail.details.reduce((s, d) => s + d.total, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
