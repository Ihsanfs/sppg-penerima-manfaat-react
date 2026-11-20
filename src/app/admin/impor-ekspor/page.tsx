"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, Select } from "@/components/ui/field";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import { isAdmin } from "@/lib/permissions";
import type { ImportResult } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { LuDownload, LuUpload } from "react-icons/lu";

type DataType = "beneficiaries" | "institutions";
type Format = "csv" | "xlsx";

export default function ImportExportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<DataType>("beneficiaries");
  const [format, setFormat] = useState<Format>("xlsx");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    api.me()
      .then((me) => { if (active) setAdmin(isAdmin(me.user)); })
      .catch(() => { if (active) setAdmin(false); });
    return () => { active = false; };
  }, []);

  const downloadTemplate = async () => {
    setError(null);
    try {
      await api.downloadTemplate(type, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunduh template.");
    }
  };

  const downloadExport = async (exportType: "beneficiaries" | "institutions" | "history") => {
    setError(null);
    try {
      await api.downloadExport(exportType, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengekspor data.");
    }
  };

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file .xlsx, .xls, atau .csv terlebih dahulu.");
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    setResult(null);
    try {
      const response = await api.importFile(type, file);
      setResult(response);
      setNotice(`Import selesai: ${response.berhasil} berhasil, ${response.gagal} gagal.`);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengimpor file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeading
        eyebrow="Data & Pengaturan"
        title="Impor / Ekspor"
        description="Unduh template, impor data massal, dan ekspor data untuk keperluan audit."
      />

      <Alert message={error} onClose={() => setError(null)} />
      <Alert message={notice} variant="success" onClose={() => setNotice(null)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <div className="mb-5 flex items-center gap-2">
            <LuUpload className="size-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Impor Data</h2>
            {!admin && <Badge color="warning" className="ms-auto">Admin saja</Badge>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Jenis data">
              <Select value={type} onChange={(event) => setType(event.target.value as DataType)}>
                <option value="beneficiaries">Penerima Manfaat</option>
                <option value="institutions">Lembaga</option>
              </Select>
            </FormField>
            <FormField label="Format template">
              <Select value={format} onChange={(event) => setFormat(event.target.value as Format)}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </Select>
            </FormField>
          </div>

          <div className="mt-4">
            <FormField label="File data" hint="Maksimal 10 MB. Kolom boleh memakai nama Indonesia, misalnya 'jenis kelamin'." >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="field h-auto py-2"
              />
            </FormField>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void downloadTemplate()}>
              <LuDownload className="size-4" /> Unduh Template
            </Button>
            <Button onClick={() => void upload()} disabled={uploading || !admin}>
              <LuUpload className="size-4" /> {uploading ? "Mengimpor..." : "Impor Sekarang"}
            </Button>
          </div>

          {result && (
            <div className="mt-6 space-y-3">
              <div className="flex gap-2">
                <Badge color="success">{result.berhasil} berhasil</Badge>
                <Badge color="danger">{result.gagal} gagal</Badge>
              </div>
              {result.errors.length > 0 && (
                <div className="scrollbar-thin max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 text-start">Baris</th>
                        <th className="px-3 py-2 text-start">Pesan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.errors.map((item, index) => (
                        <tr key={`${item.baris}-${index}`} className="text-slate-600 dark:text-slate-300">
                          <td className="px-3 py-2">{item.baris}</td>
                          <td className="px-3 py-2">{item.pesan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="surface p-6">
          <div className="mb-5 flex items-center gap-2">
            <LuDownload className="size-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Ekspor Data</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pilih format di atas, lalu unduh salah satu dataset berikut.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { key: "beneficiaries" as const, label: "Penerima Manfaat", hint: "Seluruh data penerima beserta lembaga" },
              { key: "institutions" as const, label: "Lembaga", hint: "Sekolah dan posyandu" },
              { key: "history" as const, label: "Riwayat Penerima", hint: "200 perubahan terbaru" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.hint}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void downloadExport(item.key)}>
                  <LuDownload className="size-4" /> Unduh
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Ekspor tersedia setelah login. File dihasilkan langsung oleh server sehingga data sensitif tidak
            pernah dikirim ke halaman publik.
          </p>
        </section>
      </div>
    </div>
  );
}
