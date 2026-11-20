import { fail, serverError } from "@/lib/api-response";
import { many } from "@/lib/db";
import { getBeneficiaryHistory, listInstitutions, toCsv, toXlsx } from "@/lib/import-export";
import { notAuthenticated, requireUser } from "@/lib/route-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "beneficiaries";
    const format = url.searchParams.get("format") ?? "xlsx";

    let rows: Record<string, unknown>[];
    if (type === "beneficiaries") {
      rows = await many<Record<string, unknown>>(`
        SELECT b.id, i.nama AS institution_nama, b.nama, b.nik, b.nisn,
          b.jenis_kelamin, b.kategori, b.kelas, b.jurusan, b.status,
          b.bulan, b.tahun, b.keterangan
        FROM beneficiaries b LEFT JOIN institutions i ON i.id = b.institution_id
        ORDER BY b.id
      `);
    } else if (type === "institutions") {
      rows = (await listInstitutions()) as unknown as Record<string, unknown>[];
    } else if (type === "history") {
      rows = (await getBeneficiaryHistory()).map((item) => ({
        ...item,
        perubahan: JSON.stringify(item.perubahan),
      })) as unknown as Record<string, unknown>[];
    } else {
      return fail("Jenis export tidak dikenal.", 422);
    }

    const filename = `sppg-${type}-${new Date().toISOString().slice(0, 10)}`;
    if (format === "csv") {
      return new NextResponse(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }
    if (format === "xlsx") {
      const buffer = toXlsx(rows, "Data");
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
    return fail("Format tidak dikenal. Gunakan csv atau xlsx.", 422);
  } catch (error) {
    return serverError(error);
  }
}
