import type { AuthUser } from "@/lib/auth";
import { one } from "@/lib/db";
import {
  createBeneficiary,
  createInstitution,
  getBeneficiaryHistory,
  listInstitutions,
} from "@/lib/queries";
import type { ImportResult } from "@/lib/types";
import * as XLSX from "xlsx";

export const BENEFICIARY_TEMPLATE = [
  "institution_id", "nama", "nik", "nisn", "jenis_kelamin", "kategori",
  "kelas", "jurusan", "status", "bulan", "tahun", "keterangan",
];

export const INSTITUTION_TEMPLATE = [
  "nama", "tipe", "jenjang", "kode_kategori", "alamat", "penanggung_jawab",
  "telepon", "urutan", "is_active", "latitude", "longitude",
];

const BENEFICIARY_ALIASES: Record<string, string[]> = {
  institution_id: ["institution_id", "id lembaga", "lembaga_id", "lembaga"],
  nama: ["nama", "nama penerima", "nama lengkap"],
  nik: ["nik"],
  nisn: ["nisn"],
  jenis_kelamin: ["jenis_kelamin", "jenis kelamin", "jk", "gender"],
  kategori: ["kategori", "kode kategori", "kategori penerima"],
  kelas: ["kelas"],
  jurusan: ["jurusan"],
  status: ["status"],
  bulan: ["bulan"],
  tahun: ["tahun"],
  keterangan: ["keterangan", "catatan"],
};

const INSTITUTION_ALIASES: Record<string, string[]> = {
  nama: ["nama", "nama lembaga", "nama sekolah", "nama posyandu"],
  tipe: ["tipe", "jenis lembaga"],
  jenjang: ["jenjang"],
  kode_kategori: ["kode_kategori", "kode kategori", "category_id"],
  alamat: ["alamat"],
  penanggung_jawab: ["penanggung_jawab", "penanggung jawab", "pic"],
  telepon: ["telepon", "no telepon", "hp"],
  urutan: ["urutan"],
  is_active: ["is_active", "aktif", "status"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "lon"],
};

function normKey(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function pickAliases(
  row: Record<string, unknown>,
  aliases: Record<string, string[]>,
): Record<string, unknown> {
  const normalized = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) normalized.set(normKey(key), value);

  const output: Record<string, unknown> = {};
  for (const [field, names] of Object.entries(aliases)) {
    for (const name of names) {
      const key = normKey(name);
      if (normalized.has(key)) {
        output[field] = normalized.get(key);
        break;
      }
    }
  }
  return output;
}

async function readRows(file: File): Promise<Record<string, unknown>[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("File tidak memiliki worksheet.");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: "" },
  );
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  const text = String(value).trim().toLowerCase();
  return ["1", "true", "ya", "yes", "aktif", "active"].includes(text);
}

function failureMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Baris tidak valid.";
}

export async function importBeneficiaries(
  file: File,
  user: AuthUser | null,
): Promise<ImportResult> {
  const rows = await readRows(file);
  const institutions = await listInstitutions();
  const byName = new Map(
    institutions.map((item) => [normKey(item.nama), item.id]),
  );

  const errors: ImportResult["errors"] = [];
  let berhasil = 0;
  let gagal = 0;

  for (const [index, row] of rows.entries()) {
    const item = pickAliases(row, BENEFICIARY_ALIASES);
    const lembaga = String(item.institution_id ?? "").trim();
    const institutionId = /^\d+$/.test(lembaga)
      ? Number(lembaga)
      : byName.get(normKey(lembaga));

    try {
      const nik = String(item.nik ?? "").trim();
      if (nik) {
        const duplicate = await one("SELECT id FROM beneficiaries WHERE nik = $1", [nik]);
        if (duplicate) throw new Error(`NIK ${nik} sudah terdaftar.`);
      }

      await createBeneficiary(
        {
          institution_id: institutionId,
          nama: item.nama,
          nik,
          nisn: String(item.nisn ?? "").trim(),
          jenis_kelamin: String(item.jenis_kelamin ?? "").trim().toUpperCase().slice(0, 1),
          kategori: String(item.kategori ?? "").trim().toLowerCase(),
          kelas: item.kelas === "" ? null : Number(item.kelas),
          jurusan: item.jurusan,
          status: String(item.status ?? "aktif").trim().toLowerCase(),
          bulan: item.bulan === "" ? null : Number(item.bulan),
          tahun: item.tahun === "" ? null : Number(item.tahun),
          keterangan: item.keterangan,
        },
        user,
      );
      berhasil += 1;
    } catch (error) {
      gagal += 1;
      if (errors.length < 200) errors.push({ baris: index + 2, pesan: failureMessage(error) });
    }
  }

  return { berhasil, gagal, errors };
}

export async function importInstitutions(file: File): Promise<ImportResult> {
  const rows = await readRows(file);
  const errors: ImportResult["errors"] = [];
  let berhasil = 0;
  let gagal = 0;

  for (const [index, row] of rows.entries()) {
    const item = pickAliases(row, INSTITUTION_ALIASES);
    try {
      const nama = String(item.nama ?? "").trim();
      if (!nama) throw new Error("Nama lembaga wajib diisi.");
      const duplicate = await one(
        "SELECT id FROM institutions WHERE lower(nama) = lower($1)",
        [nama],
      );
      if (duplicate) throw new Error(`Lembaga "${nama}" sudah terdaftar.`);

      await createInstitution({
        nama,
        tipe: String(item.tipe ?? "sekolah").trim().toLowerCase() === "posyandu"
          ? "posyandu"
          : "sekolah",
        jenjang: item.jenjang,
        category_id: /^\d+$/.test(String(item.kode_kategori ?? ""))
          ? Number(item.kode_kategori)
          : null,
        alamat: item.alamat,
        penanggung_jawab: item.penanggung_jawab,
        telepon: item.telepon,
        urutan: item.urutan === "" ? 0 : Number(item.urutan),
        is_active: toBoolean(item.is_active),
        latitude: item.latitude === "" ? null : Number(item.latitude),
        longitude: item.longitude === "" ? null : Number(item.longitude),
      });
      berhasil += 1;
    } catch (error) {
      gagal += 1;
      if (errors.length < 200) errors.push({ baris: index + 2, pesan: failureMessage(error) });
    }
  }

  return { berhasil, gagal, errors };
}

export function toCsv(
  rows: Record<string, unknown>[],
  headers?: string[],
): string {
  const keys = headers ?? Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => {
    const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [
    `\uFEFF${keys.map(escape).join(",")}`,
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ].join("\r\n");
}

export function toXlsx(
  rows: Record<string, unknown>[],
  sheetName = "Data",
  headers?: string[],
): Buffer {
  const keys = headers ?? Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: keys });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export { getBeneficiaryHistory, listInstitutions };
