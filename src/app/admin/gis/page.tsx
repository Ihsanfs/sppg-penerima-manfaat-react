"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createColumn, DataTable } from "@/components/ui/data-table";
import { CheckboxField } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/loading";
import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/client";
import type { GisData, GisInstitution } from "@/lib/types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LuMapPinned, LuPrinter, LuUsers } from "react-icons/lu";

const MapView = dynamic(
  () => import("@/components/gis/map-view").then((module) => module.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[30rem] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Memuat peta...
      </div>
    ),
  },
);

const column = createColumn<GisInstitution>();

function km(value: number | undefined): string {
  return typeof value === "number" ? `${value.toFixed(2)} km` : "-";
}

export default function GisPage() {
  const [data, setData] = useState<GisData | null>(null);
  const [simulation, setSimulation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.gis()
      .then((result) => { if (active) setData(result); })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const columns = [
    column.accessor("nama", {
      header: "Lembaga",
      cell: (info) => <span className="font-semibold text-slate-800 dark:text-slate-100">{info.getValue()}</span>,
    }),
    column.accessor("tipe", {
      header: "Tipe",
      cell: (info) => <Badge color={info.getValue() === "sekolah" ? "info" : "warning"}>{info.getValue()}</Badge>,
    }),
    column.accessor("jenjang", { header: "Jenjang", cell: (info) => info.getValue() || "-" }),
    column.accessor("jumlah", {
      header: "Penerima",
      cell: (info) => <span className="font-bold text-brand-600 dark:text-brand-400">{info.getValue()}</span>,
    }),
    column.accessor("distance_km", {
      header: "Jarak dari SPPG",
      cell: (info) => km(info.getValue()),
    }),
    column.accessor("alamat", { header: "Alamat", cell: (info) => info.getValue() || "-" }),
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Laporan & GIS"
        title="Sebaran Geografis Lembaga"
        description="Peta sekolah dan posyandu relatif terhadap pusat SPPG Samarang."
        action={
          <Button variant="outline" onClick={() => window.print()}>
            <LuPrinter className="size-4" /> Cetak
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError(null)} />
      {!data && !error && <LoadingState label="Memuat data geografis..." />}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Lembaga berkoordinat" value={data.stats.jumlah} hint="Titik pada peta" icon={<LuMapPinned className="size-5" />} />
            <StatCard label="Total penerima" value={data.stats.totalPenerima} hint="Di lembaga berkoordinat" accent="blue" icon={<LuUsers className="size-5" />} />
            <StatCard label="Jarak rata-rata" value={`${data.stats.rataRataKm} km`} hint="Dari pusat SPPG" accent="amber" />
            <StatCard label="Jarak terdekat / terjauh" value={`${data.stats.terdekatKm} / ${data.stats.terjauhKm} km`} hint="Rentang wilayah" accent="violet" />
          </section>

          {data.hub && (
            <div className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-xs text-slate-400">Pusat distribusi</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{data.hub.nama}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {data.hub.alamat || `${data.hub.lat}, ${data.hub.lon}`}
                </p>
              </div>
              <CheckboxField
                label="Simulasi rute & radius 15 km"
                description="Menampilkan garis rute dari SPPG ke tiap lembaga."
                checked={simulation}
                onChange={setSimulation}
              />
            </div>
          )}

          <div className="surface overflow-hidden p-2">
            <MapView institutions={data.institutions} hub={data.hub} simulation={simulation} />
          </div>

          <DataTable
            data={data.institutions}
            columns={columns}
            title="Daftar Jarak Lembaga"
            description="Diurutkan dari yang terdekat terhadap SPPG."
            searchPlaceholder="Cari lembaga atau alamat..."
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
}
