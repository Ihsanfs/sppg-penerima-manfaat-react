// Logika snapshot penerima manfaat — port dari DailyReportService.php
// Supaya angka di aplikasi React identik dengan aplikasi Laravel.
import { many, one } from './db.js';

export const DETAIL_KEYS = [
  'tk_paud', 'kelas_1', 'kelas_2', 'kelas_3', 'kelas_4', 'kelas_5', 'kelas_6',
  'smk', 'guru', 'balita', 'bumil', 'busui', 'kader',
];

export const LEGACY_TO_GRUP = {
  tk_paud: 'tk_paud',
  kelas_1: 'sd_1_3', kelas_2: 'sd_1_3', kelas_3: 'sd_1_3',
  kelas_4: 'sd_4_6', kelas_5: 'sd_4_6', kelas_6: 'sd_4_6',
  smk: 'smk', guru: 'guru', balita: 'balita', bumil: 'bumil',
  busui: 'busui', kader: 'kader',
};

export const GRUP_URUTAN = [
  'tk_paud', 'sd_1_3', 'sd_4_6', 'smk', 'guru', 'balita', 'bumil', 'busui', 'kader',
];

export const GRUP_LABELS = {
  tk_paud: 'TK / PAUD',
  sd_1_3: 'Kelas 1-3 SD',
  sd_4_6: 'Kelas 4-6 SD',
  smk: 'SMP / SMK',
  guru: 'Guru',
  balita: 'Balita',
  bumil: 'Ibu Hamil',
  busui: 'Ibu Menyusui',
  kader: 'Kader',
};

export const KATEGORI = {
  tk_paud: 'TK / PAUD',
  sd_1_3: 'Kelas 1-3 SD',
  sd_4_6: 'Kelas 4-6 SD',
  smk: 'SMK',
  guru: 'Guru',
  balita: 'Balita',
  bumil: 'Bumil',
  busui: 'Busui',
  kader: 'Kader',
};

const emptyDetail = () => Object.fromEntries([...DETAIL_KEYS, 'total'].map((k) => [k, 0]));
const emptyTotals = () => Object.fromEntries(Object.keys(KATEGORI).map((k) => [k, 0]));
const emptyKategoriJson = () => Object.fromEntries(GRUP_URUTAN.map((k) => [k, 0]));

function applyCount(detail, kategori, kelas, jumlah, categoryMap) {
  if (kategori === 'tk_paud') {
    detail.tk_paud += jumlah;
    return;
  }
  if (kategori === 'sd' && kelas !== null && kelas >= 1 && kelas <= 6) {
    detail['kelas_' + kelas] += jumlah;
    return;
  }

  const grup = categoryMap.get(kategori)?.grup;
  const grupKeys = { smk: 'smk', guru: 'guru', balita: 'balita', bumil: 'bumil', busui: 'busui', kader: 'kader' };
  if (grup && grupKeys[grup]) {
    detail[grupKeys[grup]] += jumlah;
    return;
  }
  if (Object.hasOwn(detail, kategori)) {
    detail[kategori] += jumlah;
  }
}

function addDetailToTotals(totals, detail) {
  totals.tk_paud += detail.tk_paud;
  totals.sd_1_3 += detail.kelas_1 + detail.kelas_2 + detail.kelas_3;
  totals.sd_4_6 += detail.kelas_4 + detail.kelas_5 + detail.kelas_6;
  for (const k of ['smk', 'guru', 'balita', 'bumil', 'busui', 'kader']) totals[k] += detail[k];
}

function addDetailToKategoriJson(kategoriJson, detail) {
  for (const [legacy, grup] of Object.entries(LEGACY_TO_GRUP)) {
    if (detail[legacy] !== undefined) kategoriJson[grup] += Number(detail[legacy]);
  }
}

export function kategoriJsonFromDetail(rincian) {
  const json = emptyKategoriJson();
  for (const [legacy, grup] of Object.entries(LEGACY_TO_GRUP)) {
    if (rincian[legacy] !== undefined) json[grup] = Number(rincian[legacy]);
  }
  return json;
}

export async function getCurrentProfile() {
  return one('SELECT * FROM sppg_profiles ORDER BY id LIMIT 1');
}

export async function buildSnapshot() {
  const institutions = await many(`
    SELECT i.*, c.kode AS category_kode, c.nama AS category_nama, c.jenis AS category_jenis
    FROM institutions i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.is_active = true
    ORDER BY i.urutan, i.nama
  `);

  institutions.sort((a, b) => {
    const sa = (a.tipe === 'sekolah' ? 0 : 1000) + Number(a.urutan ?? 0);
    const sb = (b.tipe === 'sekolah' ? 0 : 1000) + Number(b.urutan ?? 0);
    return sa - sb;
  });

  const raw = await many(`
    SELECT b.institution_id, b.kategori, b.kelas, COUNT(*)::int AS jumlah
    FROM beneficiaries b
    JOIN institutions i ON i.id = b.institution_id
    WHERE i.is_active = true AND b.status = 'aktif'
    GROUP BY b.institution_id, b.kategori, b.kelas
  `);

  const categories = await many(`
    SELECT kode, nama, jenis, grup FROM categories
    WHERE jenis = 'penerima' AND is_active = true
  `);
  const categoryMap = new Map(categories.map((c) => [c.kode, c]));

  const counts = new Map();
  for (const r of raw) {
    const instId = String(r.institution_id);
    if (!counts.has(instId)) counts.set(instId, new Map());
    const byKategori = counts.get(instId);
    const kode = r.kategori;
    if (!byKategori.has(kode)) byKategori.set(kode, new Map());
    byKategori.get(kode).set(String(r.kelas ?? ''), Number(r.jumlah));
  }

  const totals = emptyTotals();
  const kategoriJson = emptyKategoriJson();
  const rows = institutions.map((inst) => {
    const detail = emptyDetail();
    const instCounts = counts.get(String(inst.id));
    if (instCounts) {
      for (const [kode, byKelas] of instCounts) {
        for (const [kelas, jumlah] of byKelas) {
          applyCount(detail, kode, kelas === '' ? null : Number(kelas), jumlah, categoryMap);
        }
      }
    }
    detail.total = DETAIL_KEYS.reduce((sum, k) => sum + detail[k], 0);
    addDetailToTotals(totals, detail);
    addDetailToKategoriJson(kategoriJson, detail);

    return {
      id: Number(inst.id),
      nama: inst.nama,
      tipe: inst.tipe,
      jenjang: inst.jenjang,
      category_id: inst.category_id,
      category: inst.category_kode
        ? { kode: inst.category_kode, nama: inst.category_nama, jenis: inst.category_jenis }
        : null,
      rincian: detail,
      total: detail.total,
      alamat: inst.alamat,
      latitude: inst.latitude,
      longitude: inst.longitude,
    };
  });

  return {
    totals,
    total: Object.values(totals).reduce((a, b) => a + b, 0),
    kategori_json: kategoriJson,
    institusi: rows,
  };
}

export async function genderCounts() {
  const rows = await many(`
    SELECT jenis_kelamin, COUNT(*)::int AS jumlah
    FROM beneficiaries WHERE status = 'aktif' GROUP BY jenis_kelamin
  `);
  const result = { L: 0, P: 0 };
  for (const r of rows) result[r.jenis_kelamin] = Number(r.jumlah);
  return result;
}
