"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { api } from "@/lib/client";
import type { AuditLog } from "@/lib/types";
import { formatWaktu } from "@/lib/utils";
import { useEffect, useState } from "react";

const column = createColumn<AuditLog>();

function aksiColor(aksi: string) {
  if (aksi.includes("simpan") || aksi.includes("dibuat")) return "success";
  if (aksi.includes("hapus") || aksi.includes("dihapus")) return "danger";
  if (aksi.includes("ubah") || aksi.includes("perbarui")) return "info";
  return "neutral";
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.auditLogs()
      .then((result) => { if (active) setRows(result.data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const columns = [
    column.accessor("created_at", {
      header: "Waktu",
      cell: (info) => formatWaktu(info.getValue()),
    }),
    column.accessor("user_name", { header: "Petugas", cell: (info) => info.getValue() || "-" }),
    column.accessor("tanggal_data", { header: "Tanggal Data", cell: (info) => String(info.getValue() ?? "-") }),
    column.accessor("aksi", {
      header: "Aksi",
      cell: (info) => <Badge color={aksiColor(String(info.getValue()))}>{String(info.getValue())}</Badge>,
    }),
    column.accessor("sumber", { header: "Sumber", cell: (info) => info.getValue() || "-" }),
    column.accessor("total_sebelum", { header: "Sebelum", cell: (info) => Number(info.getValue() ?? 0) }),
    column.accessor("total_sesudah", { header: "Sesudah", cell: (info) => Number(info.getValue() ?? 0) }),
    column.accessor("selisih", {
      header: "Selisih",
      cell: (info) => {
        const value = Number(info.getValue() ?? 0);
        return <Badge color={value > 0 ? "success" : value < 0 ? "danger" : "neutral"}>{value > 0 ? "+" : ""}{value}</Badge>;
      },
    }),
    column.accessor("catatan", { header: "Catatan", cell: (info) => info.getValue() || "-" }),
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Laporan & GIS"
        title="Audit Log"
        description="Catatan sistem saat snapshot harian dibuat atau data penerima berubah."
      />

      <Alert message={error} onClose={() => setError(null)} />
      {loading && !rows.length ? (
        <LoadingState label="Memuat audit log..." />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          title="Aktivitas Sistem"
          description="Pencarian, sorting, dan pagination tersedia."
          searchPlaceholder="Cari aksi, petugas, atau catatan..."
          pageSize={12}
        />
      )}
    </div>
  );
}
