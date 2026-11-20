// Logika snapshot penerima manfaat — port dari DailyReportService.php (Laravel).
// Angka yang dihasilkan identik dengan aplikasi Laravel dan aplikasi React sebelumnya.
import {
  DETAIL_KEYS,
  DETAIL_INSERT_KEYS,
  GRUP_LABELS,
  GRUP_URUTAN,
  KATEGORI_KEYS,
  LEGACY_TO_GRUP,
} from "@/lib/constants";
import { many, one } from "@/lib/db";
import type { Snapshot, SnapshotInstitution } from "@/lib/types";

export {
  DETAIL_KEYS,
  DETAIL_INSERT_KEYS,
  GRUP_LABELS,
  GRUP_URUTAN,
  LEGACY_TO_GRUP,
} from "@/lib/constants";

function emptyDetail(): Record<string, number> {
  return Object.fromEntries([...DETAIL_KEYS, "total"].map((key) => [key, 0]));
}

function emptyByKeys(keys: readonly string[]): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

type CategoryRow = { kode: string; nama: string | null; jenis: string; grup: string | null };

function applyCount(
  detail: Record<string, number>,
  kategori: string,
  kelas: number | null,
  jumlah: number,
  categoryMap: Map<string, CategoryRow>,
) {
  if (kategori === "tk_paud") {
    detail.tk_paud += jumlah;
    return;
  }
  if (kategori === "sd" && kelas !== null && kelas >= 1 && kelas <= 6) {
    detail[`kelas_${kelas}`] += jumlah;
    return;
  }

  const grup = categoryMap.get(kategori)?.grup;
  const grupKeys: Record<string, string> = {
    smk: "smk", guru: "guru", balita: "balita", bumil: "bumil",
    busui: "busui", kader: "kader",
  };
  if (grup && grupKeys[grup]) {
    detail[grupKeys[grup]] += jumlah;
    return;
  }
  if (Object.hasOwn(detail, kategori)) detail[kategori] += jumlah;
}

function addDetailToTotals(totals: Record<string, number>, detail: Record<string, number>) {
  totals.tk_paud += detail.tk_paud;
  totals.sd_1_3 += detail.kelas_1 + detail.kelas_2 + detail.kelas_3;
  totals.sd_4_6 += detail.kelas_4 + detail.kelas_5 + detail.kelas_6;
  for (const key of ["smk", "guru", "balita", "bumil", "busui", "kader"]) {
    totals[key] += detail[key];
  }
}

export function kategoriJsonFromDetail(rincian: Record<string, number>) {
  const json = emptyByKeys(GRUP_URUTAN);
  for (const [legacy, grup] of Object.entries(LEGACY_TO_GRUP)) {
    if (rincian[legacy] !== undefined) {
      json[grup] = Number(json[grup] ?? 0) + Number(rincian[legacy]);
    }
  }
  return json;
}

export async function getCurrentProfile() {
  return one<Record<string, unknown>>("SELECT * FROM sppg_profiles ORDER BY id LIMIT 1");
}

export async function buildSnapshot(): Promise<Snapshot> {
  type InstRow = {
    id: number; nama: string; tipe: string; jenjang: string | null;
    category_id: number | null; category_kode: string | null;
    category_nama: string | null; category_jenis: string | null;
    urutan: number | null; alamat: string | null;
    latitude: number | string | null; longitude: number | string | null;
  };

  const institutions = await many<InstRow>(`
    SELECT i.*, c.kode AS category_kode, c.nama AS category_nama, c.jenis AS category_jenis
    FROM institutions i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.is_active = true
    ORDER BY i.urutan, i.nama
  `);

  institutions.sort((a, b) => {
    const sa = (a.tipe === "sekolah" ? 0 : 1000) + Number(a.urutan ?? 0);
    const sb = (b.tipe === "sekolah" ? 0 : 1000) + Number(b.urutan ?? 0);
    return sa - sb;
  });

  const raw = await many<{
    institution_id: number; kategori: string; kelas: number | null; jumlah: number;
  }>(`
    SELECT b.institution_id, b.kategori, b.kelas, COUNT(*)::int AS jumlah
    FROM beneficiaries b
    JOIN institutions i ON i.id = b.institution_id
    WHERE i.is_active = true AND b.status = 'aktif'
    GROUP BY b.institution_id, b.kategori, b.kelas
  `);

  const categories = await many<CategoryRow>(`
    SELECT kode, nama, jenis, grup FROM categories
    WHERE jenis = 'penerima' AND is_active = true
  `);
  const categoryMap = new Map(categories.map((category) => [category.kode, category]));

  const counts = new Map<string, Map<string, Map<string, number>>>();
  for (const row of raw) {
    const instId = String(row.institution_id);
    if (!counts.has(instId)) counts.set(instId, new Map());
    const byKategori = counts.get(instId)!;
    if (!byKategori.has(row.kategori)) byKategori.set(row.kategori, new Map());
    byKategori.get(row.kategori)!.set(String(row.kelas ?? ""), Number(row.jumlah));
  }

  const totals = emptyByKeys(KATEGORI_KEYS);
  const kategoriJson = emptyByKeys(GRUP_URUTAN);

  const institusi: SnapshotInstitution[] = institutions.map((inst) => {
    const detail = emptyDetail();
    const instCounts = counts.get(String(inst.id));
    if (instCounts) {
      for (const [kode, byKelas] of instCounts) {
        for (const [kelas, jumlah] of byKelas) {
          applyCount(detail, kode, kelas === "" ? null : Number(kelas), jumlah, categoryMap);
        }
      }
    }
    detail.total = DETAIL_KEYS.reduce((sum, key) => sum + detail[key], 0);
    addDetailToTotals(totals, detail);
    for (const [legacy, grup] of Object.entries(LEGACY_TO_GRUP)) {
      if (detail[legacy] !== undefined) kategoriJson[grup] += Number(detail[legacy]);
    }

    return {
      id: Number(inst.id),
      nama: inst.nama,
      tipe: inst.tipe,
      jenjang: inst.jenjang,
      rincian: detail,
      total: detail.total,
      alamat: inst.alamat,
      latitude: inst.latitude,
      longitude: inst.longitude,
    };
  });

  return {
    totals,
    total: Object.values(totals).reduce((sum, value) => sum + value, 0),
    kategori_json: kategoriJson,
    institusi,
  };
}

export async function genderCounts(): Promise<{ L: number; P: number }> {
  const rows = await many<{ jenis_kelamin: string; jumlah: number }>(`
    SELECT jenis_kelamin, COUNT(*)::int AS jumlah
    FROM beneficiaries WHERE status = 'aktif' GROUP BY jenis_kelamin
  `);
  const result = { L: 0, P: 0 };
  for (const row of rows) result[row.jenis_kelamin as "L" | "P"] = Number(row.jumlah);
  return result;
}
