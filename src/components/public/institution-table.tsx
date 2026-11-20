"use client";

import { createColumn, DataTable } from "@/components/ui/data-table";
import type { SnapshotInstitution } from "@/lib/types";

const column = createColumn<SnapshotInstitution>();

function sum(rincian: Record<string, number>, keys: string[]): number {
  return keys.reduce((total, key) => total + Number(rincian[key] ?? 0), 0);
}

const detailColumns = [
  { key: "tk_paud", label: "TK / PAUD", keys: ["tk_paud"] },
  { key: "sd_1_3", label: "Kelas 1-3", keys: ["kelas_1", "kelas_2", "kelas_3"] },
  { key: "sd_4_6", label: "Kelas 4-6", keys: ["kelas_4", "kelas_5", "kelas_6"] },
  { key: "smk", label: "SMP / SMK", keys: ["smk"] },
  { key: "guru", label: "Guru", keys: ["guru"] },
  { key: "balita", label: "Balita", keys: ["balita"] },
  { key: "bumil", label: "Ibu Hamil", keys: ["bumil"] },
  { key: "busui", label: "Ibu Menyusui", keys: ["busui"] },
  { key: "kader", label: "Kader", keys: ["kader"] },
] as const;

const columns = [
  column.accessor("nama", {
    header: "Lembaga",
    cell: (info) => (
      <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>
    ),
  }),
  column.accessor("jenjang", {
    header: "Jenjang",
    cell: (info) => info.getValue() || "-",
  }),
  ...detailColumns.map((item) =>
    column.accessor((row) => sum(row.rincian, [...item.keys]), {
      id: item.key,
      header: item.label,
      cell: (info) => Number(info.getValue() ?? 0),
    }),
  ),
  column.accessor("total", {
    header: "Total",
    cell: (info) => (
      <span className="font-bold text-brand-600 dark:text-brand-400">{info.getValue()}</span>
    ),
  }),
];

export function InstitutionTable({
  data,
  title,
  description,
  searchPlaceholder,
}: {
  data: SnapshotInstitution[];
  title: string;
  description: string;
  searchPlaceholder: string;
}) {
  const footer = (
    <tr>
      <td className="px-4 py-3" colSpan={2}>TOTAL</td>
      {detailColumns.map((item) => (
        <td key={item.key} className="px-4 py-3 text-end">
          {data.reduce((total, row) => total + sum(row.rincian, [...item.keys]), 0)}
        </td>
      ))}
      <td className="px-4 py-3 text-end text-brand-600 dark:text-brand-400">
        {data.reduce((total, row) => total + Number(row.total ?? 0), 0)}
      </td>
    </tr>
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      title={title}
      description={description}
      searchPlaceholder={searchPlaceholder}
      pageSize={7}
      minWidth="min-w-[980px]"
      footer={footer}
    />
  );
}
