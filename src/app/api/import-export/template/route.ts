import { fail } from "@/lib/api-response";
import {
  BENEFICIARY_TEMPLATE,
  INSTITUTION_TEMPLATE,
  toCsv,
  toXlsx,
} from "@/lib/import-export";
import { notAuthenticated, requireUser } from "@/lib/route-auth";
import { NextResponse } from "next/server";

const SAMPLES: Record<string, Record<string, string>> = {
  beneficiaries: {
    institution_id: "1",
    nama: "Nama Penerima",
    nik: "3201xxxxxxxxxxxx",
    nisn: "",
    jenis_kelamin: "L",
    kategori: "sd",
    kelas: "3",
    jurusan: "",
    status: "aktif",
    bulan: "",
    tahun: "2026",
    keterangan: "Contoh",
  },
  institutions: {
    nama: "SD Negeri Contoh",
    tipe: "sekolah",
    jenjang: "sd",
    kode_kategori: "",
    alamat: "Jl. Contoh No. 1",
    penanggung_jawab: "Nama Kepala",
    telepon: "",
    urutan: "1",
    is_active: "true",
    latitude: "-7.2275",
    longitude: "107.8720",
  },
};

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "beneficiaries";
  const format = url.searchParams.get("format") ?? "csv";
  const headers = type === "institutions" ? INSTITUTION_TEMPLATE : BENEFICIARY_TEMPLATE;
  const sample = SAMPLES[type] ?? SAMPLES.beneficiaries;

  if (format === "xlsx") {
    const buffer = toXlsx([sample], "Template", headers);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template-${type}.xlsx"`,
      },
    });
  }
  if (format === "csv") {
    return new NextResponse(toCsv([sample], headers), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="template-${type}.csv"`,
      },
    });
  }
  return fail("Format tidak dikenal. Gunakan csv atau xlsx.", 422);
}
