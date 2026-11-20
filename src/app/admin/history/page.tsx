"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import type { BeneficiaryHistory } from "@/lib/types";
import { formatWaktu } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { LuPrinter } from "react-icons/lu";

const column = createColumn<BeneficiaryHistory>();

function aksiColor(aksi: string) {
  if (aksi === "dibuat") return "success";
  if (aksi === "dihapus") return "danger";
  if (aksi === "diperbarui") return "info";
  return "neutral";
}

export default function HistoryPage() {
  const [rows, setRows] = useState<BeneficiaryHistory[]>([]);
  const [aksi, setAksi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.history()
      .then((result) => { if (active) setRows(result.data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(
    () => (aksi ? rows.filter((row) => row.aksi === aksi) : rows),
    [rows, aksi],
  );

  const columns = [
    column.accessor("created_at", { header: "Waktu", cell: (info) => formatWaktu(info.getValue()) }),
    column.accessor("beneficiary_nama", {
      header: "Penerima",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
    column.accessor("institution_nama", { header: "Lembaga", cell: (info) => info.getValue() || "-" }),
    column.accessor("aksi", {
      header: "Aksi",
      cell: (info) => <Badge color={aksiColor(String(info.getValue()))}>{String(info.getValue())}</Badge>,
    }),
    column.accessor("alasan", { header: "Alasan", cell: (info) => info.getValue() || "-" }),
    column.accessor("user_name", { header: "Petugas", cell: (info) => info.getValue() || "-" }),
    column.accessor("kategori", { header: "Kategori", cell: (info) => info.getValue() || "-" }),
    column.accessor("perubahan", {
      header: "Perubahan",
      cell: (info) => `${Object.keys(info.getValue() ?? {}).length} field`,
    }),
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Laporan & GIS"
        title="Riwayat Penerima"
        description="Jejak perubahan data penerima lintas lembaga (maksimal 200 catatan terbaru)."
        action={
          <Button variant="outline" onClick={() => window.print()}>
            <LuPrinter className="size-4" /> Cetak
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />
      {loading && !rows.length ? (
        <LoadingState label="Memuat riwayat..." />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          title="Semua Riwayat"
          description={`${filtered.length} catatan ditampilkan.`}
          searchPlaceholder="Cari nama, alasan, atau petugas..."
          pageSize={12}
          toolbar={
            <Select
              value={aksi}
              onChange={(event) => setAksi(event.target.value)}
              className="h-10 w-full text-xs sm:w-40"
              aria-label="Filter aksi"
            >
              <option value="">Semua aksi</option>
              <option value="dibuat">Dibuat</option>
              <option value="diperbarui">Diperbarui</option>
              <option value="dihapus">Dihapus</option>
            </Select>
          }
        />
      )}
    </div>
  );
}
