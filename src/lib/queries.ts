import type { AuthUser } from "@/lib/auth";
import { many, one, pool, query, withTransaction } from "@/lib/db";
import {
  buildSnapshot,
  DETAIL_INSERT_KEYS,
  DETAIL_KEYS,
  genderCounts,
  getCurrentProfile,
  GRUP_LABELS,
  GRUP_URUTAN,
  kategoriJsonFromDetail,
} from "@/lib/snapshot";
import type {
  AdminDashboardData,
  AuditLog,
  Beneficiary,
  BeneficiaryHistory,
  Category,
  DailyReport,
  DailyReportDetail,
  GisData,
  Institution,
  OperationalData,
  OptionsData,
  Paginated,
  PublicDashboardData,
  Snapshot,
  SppgProfile,
  UserRecord,
  WeeklyDay,
  WeeklyReportData,
} from "@/lib/types";
import {
  clean,
  hariIndo,
  numOrNull,
  parseKategori,
  todayString,
} from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BENEF_FIELDS = [
  "institution_id", "nama", "nik", "nisn", "jenis_kelamin", "kategori",
  "kelas", "jurusan", "status", "bulan", "tahun", "keterangan",
] as const;

const INST_FIELDS = [
  "nama", "tipe", "jenjang", "category_id", "alamat", "penanggung_jawab",
  "telepon", "urutan", "is_active", "latitude", "longitude",
] as const;

const CAT_FIELDS = [
  "kode", "nama", "jenis", "grup", "urutan", "is_active", "keterangan", "has_class",
] as const;

type Input = Record<string, unknown>;

function pick(input: Input, fields: readonly string[]): Input {
  const out: Input = {};
  for (const field of fields) {
    if (Object.hasOwn(input ?? {}, field)) out[field] = input[field];
  }
  return out;
}

function normalizeBeneficiary(input: Input) {
  const b = pick(input, BENEF_FIELDS);
  return {
    institution_id: numOrNull(b.institution_id),
    nama: clean(b.nama),
    nik: clean(b.nik),
    nisn: clean(b.nisn),
    jenis_kelamin: clean(b.jenis_kelamin),
    kategori: clean(b.kategori),
    kelas: numOrNull(b.kelas),
    jurusan: clean(b.jurusan),
    status: clean(b.status) ?? "aktif",
    bulan: numOrNull(b.bulan),
    tahun: numOrNull(b.tahun),
    keterangan: clean(b.keterangan),
  };
}

function validateBeneficiary(b: ReturnType<typeof normalizeBeneficiary>): string | null {
  if (!b.nama) return "Nama wajib diisi.";
  if (!b.institution_id) return "Lembaga wajib dipilih.";
  if (!b.jenis_kelamin) return "Jenis kelamin wajib dipilih.";
  if (!b.kategori) return "Kategori wajib dipilih.";
  if (b.nik && !/^\d{16}$/.test(b.nik)) return "NIK harus terdiri dari 16 digit angka.";
  if (b.nisn && !/^\d{10}$/.test(b.nisn)) return "NISN harus terdiri dari 10 digit angka.";
  return null;
}

function normalizeInstitution(input: Input) {
  return {
    nama: clean(input.nama),
    tipe: clean(input.tipe) ?? "sekolah",
    jenjang: clean(input.jenjang),
    category_id: numOrNull(input.category_id),
    alamat: clean(input.alamat),
    penanggung_jawab: clean(input.penanggung_jawab),
    telepon: clean(input.telepon),
    urutan: numOrNull(input.urutan) ?? 0,
    is_active: input.is_active === undefined ? true : Boolean(input.is_active),
    latitude: numOrNull(input.latitude),
    longitude: numOrNull(input.longitude),
  };
}

function normalizeCategory(input: Input) {
  return {
    kode: clean(input.kode),
    nama: clean(input.nama),
    jenis: clean(input.jenis) ?? "penerima",
    grup: clean(input.grup),
    urutan: numOrNull(input.urutan) ?? 0,
    is_active: input.is_active === undefined ? true : Boolean(input.is_active),
    keterangan: clean(input.keterangan),
    has_class: input.has_class === undefined ? false : Boolean(input.has_class),
  };
}

async function institutionName(id: number | null): Promise<string | null> {
  if (!id) return null;
  const row = await one<{ nama: string }>("SELECT nama FROM institutions WHERE id = $1", [id]);
  return row?.nama ?? null;
}

async function writeBeneficiaryHistory(
  action: "dibuat" | "diperbarui" | "dihapus",
  beneficiary: Beneficiary | null,
  institutionNama: string | null,
  userId: number | null,
  alasan: string | null,
  perubahan: unknown,
) {
  await query(
    `INSERT INTO beneficiary_histories
      (beneficiary_id, user_id, aksi, beneficiary_nama, institution_nama, kategori,
       tanggal, hari, alasan, perubahan, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE,$7,$8,$9::json,NOW(),NOW())`,
    [
      beneficiary?.id ?? null,
      userId ?? null,
      action,
      beneficiary?.nama ?? "-",
      institutionNama ?? null,
      beneficiary?.kategori ?? null,
      hariIndo(),
      alasan ?? null,
      JSON.stringify(perubahan ?? {}),
    ],
  );
}

function rekapFrom(snapshot: Awaited<ReturnType<typeof buildSnapshot>>) {
  return GRUP_URUTAN.map((kode) => ({
    kode,
    label: GRUP_LABELS[kode] ?? kode,
    nilai: Number(snapshot.kategori_json[kode] ?? 0),
  }));
}

/* ------------------------------------------------------------------ */
/* Public + dashboard                                                  */
/* ------------------------------------------------------------------ */

export async function getPublicDashboard(): Promise<PublicDashboardData> {
  const [profile, snapshot, gender, savedToday] = await Promise.all([
    getCurrentProfile(),
    buildSnapshot(),
    genderCounts(),
    one<DailyReport>(
      "SELECT saved_at, sumber, total, catatan FROM daily_reports WHERE tanggal = $1",
      [todayString()],
    ),
  ]);

  const sekolah = snapshot.institusi.filter((item) => item.tipe === "sekolah");
  const posyandu = snapshot.institusi.filter((item) => item.tipe === "posyandu");

  return {
    profile,
    tanggal: todayString(),
    snapshot,
    sekolah,
    posyandu,
    totalSekolah: sekolah.reduce((sum, item) => sum + item.total, 0),
    totalPosyandu: posyandu.reduce((sum, item) => sum + item.total, 0),
    jumlahLaki: gender.L,
    jumlahPerempuan: gender.P,
    savedToday,
    rekap: rekapFrom(snapshot),
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const [snapshot, gender, counts, recent] = await Promise.all([
    buildSnapshot(),
    genderCounts(),
    one<AdminDashboardData["counts"]>(`
      SELECT
        (SELECT COUNT(*)::int FROM beneficiaries WHERE status='aktif') AS aktif,
        (SELECT COUNT(*)::int FROM beneficiaries WHERE status!='aktif') AS nonaktif,
        (SELECT COUNT(*)::int FROM institutions WHERE is_active=true) AS lembaga,
        (SELECT COUNT(*)::int FROM categories WHERE is_active=true) AS kategori,
        (SELECT COUNT(*)::int FROM daily_reports) AS laporan
    `),
    many<AuditLog>(`
      SELECT a.*, u.name AS user_name FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 8
    `),
  ]);

  return {
    snapshot,
    gender,
    counts: counts ?? { aktif: 0, nonaktif: 0, lembaga: 0, kategori: 0, laporan: 0 },
    recent,
    rekap: rekapFrom(snapshot),
  };
}

export async function getOptions(): Promise<OptionsData> {
  const [penerima, lembaga, jenjang, institutions] = await Promise.all([
    many<OptionsData["penerima"][number]>(
      "SELECT kode, nama, grup FROM categories WHERE jenis='penerima' AND is_active=true ORDER BY urutan, nama",
    ),
    many<OptionsData["lembaga"][number]>(
      "SELECT kode, nama FROM categories WHERE jenis='lembaga' AND is_active=true ORDER BY urutan, nama",
    ),
    many<OptionsData["jenjang"][number]>(
      "SELECT kode, nama FROM categories WHERE jenis='jenjang' AND is_active=true ORDER BY urutan, nama",
    ),
    many<OptionsData["institutions"][number]>(
      "SELECT id, nama, tipe FROM institutions WHERE is_active=true ORDER BY nama",
    ),
  ]);
  return { penerima, lembaga, jenjang, institutions };
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return many<AuditLog>(`
    SELECT a.*, u.name AS user_name FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 50
  `);
}

/* ------------------------------------------------------------------ */
/* Beneficiaries                                                       */
/* ------------------------------------------------------------------ */

export async function listBeneficiaries(params: {
  q?: string;
  status?: string;
  institutionId?: string;
  kategori?: string;
  jenisKelamin?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Beneficiary>> {
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const institutionId = (params.institutionId ?? "").trim();
  const kategori = (params.kategori ?? "").trim();
  const jenisKelamin = (params.jenisKelamin ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const offset = (page - 1) * limit;

  const clauses: string[] = [];
  const values: unknown[] = [];

  if (q) {
    values.push(`%${q}%`);
    const index = values.length;
    clauses.push(
      `(b.nama ILIKE $${index} OR COALESCE(b.nik,'') ILIKE $${index} OR COALESCE(b.nisn,'') ILIKE $${index})`,
    );
  }
  if (status) {
    values.push(status);
    clauses.push(`b.status = $${values.length}`);
  }
  if (institutionId) {
    values.push(Number(institutionId));
    clauses.push(`b.institution_id = $${values.length}`);
  }
  if (kategori) {
    values.push(kategori);
    clauses.push(`b.kategori = $${values.length}`);
  }
  if (jenisKelamin) {
    values.push(jenisKelamin);
    clauses.push(`b.jenis_kelamin = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const totalRow = await one<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM beneficiaries b ${where}`,
    values,
  );
  values.push(limit);
  const limitIndex = values.length;
  values.push(offset);
  const offsetIndex = values.length;

  const data = await many<Beneficiary>(
    `SELECT b.*, i.nama AS institution_nama, i.tipe AS institution_tipe
     FROM beneficiaries b LEFT JOIN institutions i ON i.id = b.institution_id
     ${where}
     ORDER BY b.id DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    values,
  );

  return { data, total: totalRow?.n ?? 0, page, limit };
}

export async function createBeneficiary(input: Input, user: AuthUser | null) {
  const b = normalizeBeneficiary(input);
  const error = validateBeneficiary(b);
  if (error) throw new ValidationError(error);

  const row = await one<Beneficiary>(
    `INSERT INTO beneficiaries (${BENEF_FIELDS.join(", ")}, created_at, updated_at)
     VALUES (${BENEF_FIELDS.map((_, i) => `$${i + 1}`).join(", ")}, NOW(), NOW()) RETURNING *`,
    BENEF_FIELDS.map((field) => b[field as keyof typeof b]),
  );
  await writeBeneficiaryHistory(
    "dibuat", row, await institutionName(row?.institution_id ?? null),
    user?.id ?? null, "Dibuat dari aplikasi Next.js", row,
  );
  return row;
}

export async function updateBeneficiary(id: number, input: Input, user: AuthUser | null) {
  const before = await one<Beneficiary>("SELECT * FROM beneficiaries WHERE id = $1", [id]);
  if (!before) throw new NotFoundError("Penerima tidak ditemukan.");

  const b = normalizeBeneficiary(input);
  const error = validateBeneficiary(b);
  if (error) throw new ValidationError(error);

  const alasan = clean(input.alasan);
  if (!alasan) throw new ValidationError("Alasan perubahan wajib diisi.");

  const values = BENEF_FIELDS.map((field) => b[field as keyof typeof b]);
  values.push(id);
  const row = await one<Beneficiary>(
    `UPDATE beneficiaries SET ${BENEF_FIELDS.map((field, i) => `${field} = $${i + 1}`).join(", ")}, updated_at = NOW()
     WHERE id = $${values.length} RETURNING *`,
    values,
  );

  const perubahan: Record<string, { dari: unknown; ke: unknown }> = {};
  for (const field of BENEF_FIELDS) {
    const key = field as keyof typeof b;
    if (String(before[key]) !== String(b[key])) perubahan[field] = { dari: before[key], ke: b[key] };
  }
  await writeBeneficiaryHistory(
    "diperbarui", row, await institutionName(row?.institution_id ?? null),
    user?.id ?? null, alasan, perubahan,
  );
  return row;
}

export async function deleteBeneficiary(id: number, user: AuthUser | null) {
  const before = await one<Beneficiary>("SELECT * FROM beneficiaries WHERE id = $1", [id]);
  if (!before) throw new NotFoundError("Penerima tidak ditemukan.");

  await writeBeneficiaryHistory(
    "dihapus", before, await institutionName(before.institution_id),
    user?.id ?? null, "Dihapus dari aplikasi Next.js", before,
  );
  await query("DELETE FROM beneficiaries WHERE id = $1", [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Institutions                                                        */
/* ------------------------------------------------------------------ */

const INST_SELECT = `
  SELECT i.*, c.nama AS category_nama,
    (SELECT COUNT(*)::int FROM beneficiaries b WHERE b.institution_id = i.id AND b.status = 'aktif') AS jumlah_penerima
  FROM institutions i LEFT JOIN categories c ON c.id = i.category_id
`;

export async function listInstitutions(
  params: { q?: string; tipe?: string; jenjang?: string; isActive?: string } = {},
): Promise<Institution[]> {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (params.q?.trim()) {
    values.push(`%${params.q.trim()}%`);
    clauses.push(`(i.nama ILIKE $${values.length} OR i.alamat ILIKE $${values.length})`);
  }
  if (params.tipe?.trim()) {
    values.push(params.tipe.trim());
    clauses.push(`i.tipe = $${values.length}`);
  }
  if (params.jenjang?.trim()) {
    values.push(params.jenjang.trim());
    clauses.push(`i.jenjang = $${values.length}`);
  }
  if (params.isActive === "true" || params.isActive === "false") {
    values.push(params.isActive === "true");
    clauses.push(`i.is_active = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return many<Institution>(`${INST_SELECT} ${where} ORDER BY i.tipe, i.urutan, i.nama`, values);
}

export async function createInstitution(input: Input) {
  const v = normalizeInstitution(input);
  if (!v.nama) throw new ValidationError("Nama lembaga wajib diisi.");
  return one<Institution>(
    `INSERT INTO institutions (${INST_FIELDS.join(", ")}, created_at, updated_at)
     VALUES (${INST_FIELDS.map((_, i) => `$${i + 1}`).join(", ")}, NOW(), NOW()) RETURNING *`,
    INST_FIELDS.map((field) => v[field as keyof typeof v]),
  );
}

export async function updateInstitution(id: number, input: Input) {
  const v = normalizeInstitution(input);
  if (!v.nama) throw new ValidationError("Nama lembaga wajib diisi.");
  const values = INST_FIELDS.map((field) => v[field as keyof typeof v]);
  values.push(id);
  const row = await one<Institution>(
    `UPDATE institutions SET ${INST_FIELDS.map((field, i) => `${field} = $${i + 1}`).join(", ")}, updated_at = NOW()
     WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (!row) throw new NotFoundError("Lembaga tidak ditemukan.");
  return row;
}

export async function deleteInstitution(id: number) {
  const used = await one<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM beneficiaries WHERE institution_id = $1", [id],
  );
  if ((used?.n ?? 0) > 0) {
    throw new ValidationError(`Lembaga masih memiliki ${used?.n} penerima. Pindahkan dulu.`);
  }
  await query("DELETE FROM institutions WHERE id = $1", [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

const CAT_SELECT = `
  SELECT c.*,
    (SELECT COUNT(*)::int FROM beneficiaries b WHERE b.kategori = c.kode) AS usage_count,
    (SELECT COUNT(*)::int FROM institutions i WHERE i.category_id = c.id) AS institution_count
  FROM categories c
`;

export async function listCategories(): Promise<Category[]> {
  return many<Category>(`${CAT_SELECT} ORDER BY c.jenis, c.urutan, c.nama`);
}

export async function createCategory(input: Input) {
  const v = normalizeCategory(input);
  if (!v.kode || !v.nama) throw new ValidationError("Kode dan nama wajib diisi.");
  return one<Category>(
    `INSERT INTO categories (${CAT_FIELDS.join(", ")}, created_at, updated_at)
     VALUES (${CAT_FIELDS.map((_, i) => `$${i + 1}`).join(", ")}, NOW(), NOW()) RETURNING *`,
    CAT_FIELDS.map((field) => v[field as keyof typeof v]),
  );
}

export async function updateCategory(id: number, input: Input) {
  const v = normalizeCategory(input);
  if (!v.kode || !v.nama) throw new ValidationError("Kode dan nama wajib diisi.");
  const values = CAT_FIELDS.map((field) => v[field as keyof typeof v]);
  values.push(id);
  const row = await one<Category>(
    `UPDATE categories SET ${CAT_FIELDS.map((field, i) => `${field} = $${i + 1}`).join(", ")}, updated_at = NOW()
     WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (!row) throw new NotFoundError("Kategori tidak ditemukan.");
  return row;
}

export async function deleteCategory(id: number) {
  const used = await one<{ beneficiary_count: number; institution_count: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM beneficiaries WHERE kategori = (SELECT kode FROM categories WHERE id = $1)) AS beneficiary_count,
       (SELECT COUNT(*)::int FROM institutions WHERE category_id = $1) AS institution_count`,
    [id],
  );
  if ((used?.beneficiary_count ?? 0) > 0 || (used?.institution_count ?? 0) > 0) {
    throw new ValidationError("Kategori masih digunakan. Hapus/nonaktifkan saja.");
  }
  await query("DELETE FROM categories WHERE id = $1", [id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Daily reports                                                       */
/* ------------------------------------------------------------------ */

export async function listDailyReports(page = 1, limit = 20): Promise<Paginated<DailyReport>> {
  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (currentPage - 1) * perPage;
  const total = await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM daily_reports");
  const data = await many<DailyReport>(
    `SELECT dr.*, u.name AS saved_by_name FROM daily_reports dr
     LEFT JOIN users u ON u.id = dr.saved_by
     ORDER BY dr.tanggal DESC LIMIT $1 OFFSET $2`,
    [perPage, offset],
  );
  return { data, total: total?.n ?? 0, page: currentPage, limit: perPage };
}

export async function getDailyReport(id: number) {
  const report = await one<DailyReport>(
    `SELECT dr.*, u.name AS saved_by_name FROM daily_reports dr
     LEFT JOIN users u ON u.id = dr.saved_by WHERE dr.id = $1`,
    [id],
  );
  if (!report) throw new NotFoundError("Laporan tidak ditemukan.");
  const details = await many<DailyReportDetail>(
    `SELECT d.*, i.nama AS institution_nama, i.tipe AS institution_tipe
     FROM daily_report_details d LEFT JOIN institutions i ON i.id = d.institution_id
     WHERE d.daily_report_id = $1 ORDER BY i.tipe, i.urutan, i.nama`,
    [id],
  );
  return { report, details };
}

export async function saveDailyReport(
  input: { tanggal?: string; sumber?: string; catatan?: string },
  user: AuthUser | null,
) {
  const tanggal = String(input.tanggal || todayString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    throw new ValidationError("Format tanggal tidak valid.");
  }
  if (tanggal > todayString()) {
    throw new ValidationError("Tanggal snapshot tidak boleh di masa depan.");
  }

  const snapshot = await buildSnapshot();
  const rawSumber = String(input.sumber || "manual");
  const sumber = rawSumber === "cron" ? "otomatis" : rawSumber;
  const catatan = clean(input.catatan);

  return withTransaction(async (client) => {
    const before = await client.query("SELECT total FROM daily_reports WHERE tanggal = $1", [tanggal]);
    const totalSebelum = before.rows[0]?.total ?? 0;
    const totals = snapshot.totals;
    const cols = [
      ...Object.keys(totals), "total", "sumber", "saved_by", "saved_at", "catatan", "kategori_json",
    ];
    const values = [
      ...Object.values(totals),
      snapshot.total,
      sumber,
      user?.id ?? null,
      new Date(),
      catatan,
      JSON.stringify(snapshot.kategori_json),
    ];
    const placeholders = cols.map((_, i) => `$${i + 2}`).join(", ");
    const updates = cols
      .filter((column) => column !== "tanggal")
      .map((column) => `${column} = EXCLUDED.${column}`)
      .join(", ");

    const saved = await client.query(
      `INSERT INTO daily_reports (tanggal, ${cols.join(", ")}, created_at, updated_at)
       VALUES ($1, ${placeholders}, NOW(), NOW())
       ON CONFLICT (tanggal) DO UPDATE SET ${updates}, updated_at = NOW()
       RETURNING *`,
      [tanggal, ...values],
    );

    const reportId = saved.rows[0].id;
    await client.query("DELETE FROM daily_report_details WHERE daily_report_id = $1", [reportId]);

    for (const row of snapshot.institusi) {
      const detail = row.rincian;
      const detailValues = [
        ...DETAIL_INSERT_KEYS.map((key) => Number(detail[key] || 0)),
        JSON.stringify(kategoriJsonFromDetail(detail)),
      ];
      await client.query(
        `INSERT INTO daily_report_details
          (daily_report_id, institution_id, ${DETAIL_INSERT_KEYS.join(", ")}, kategori_json, created_at, updated_at)
         VALUES ($1, $2, ${DETAIL_INSERT_KEYS.map((_, i) => `$${i + 3}`).join(", ")}, $${DETAIL_INSERT_KEYS.length + 3}, NOW(), NOW())`,
        [reportId, row.id, ...detailValues],
      );
    }

    await client.query(
      `INSERT INTO audit_logs
        (user_id, tanggal_data, aksi, sumber, total_sebelum, total_sesudah, selisih, catatan, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
      [
        user?.id ?? null,
        tanggal,
        before.rowCount ? "update" : "simpan",
        sumber,
        totalSebelum,
        snapshot.total,
        snapshot.total - totalSebelum,
        catatan,
      ],
    );

    return { report: saved.rows[0] as DailyReport, total: snapshot.total };
  });
}

/* ------------------------------------------------------------------ */
/* GIS                                                                 */
/* ------------------------------------------------------------------ */

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getGis(): Promise<GisData> {
  const [profileRow, institutions] = await Promise.all([
    getCurrentProfile(),
    many<GisData["institutions"][number]>(`
      SELECT i.id, i.nama, i.tipe, i.jenjang, i.alamat, i.latitude, i.longitude,
        (SELECT COUNT(*)::int FROM beneficiaries b WHERE b.institution_id = i.id AND b.status = 'aktif') AS jumlah
      FROM institutions i
      WHERE i.is_active = true AND i.latitude IS NOT NULL AND i.longitude IS NOT NULL
      ORDER BY i.tipe, i.nama
    `),
  ]);

  const profile = profileRow as SppgProfile | null;
  const hubLat = Number(profile?.latitude);
  const hubLon = Number(profile?.longitude);
  const hub =
    profile && Number.isFinite(hubLat) && Number.isFinite(hubLon)
      ? {
          lat: hubLat,
          lon: hubLon,
          nama: profile.nama,
          alamat: profile.alamat,
        }
      : null;

  const enriched = institutions
    .map((item) => {
      const lat = Number(item.latitude);
      const lon = Number(item.longitude);
      return {
        ...item,
        distance_km:
          hub && Number.isFinite(lat) && Number.isFinite(lon)
            ? Number(distanceKm(hub.lat, hub.lon, lat, lon).toFixed(2))
            : undefined,
      };
    })
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));

  const distances = enriched
    .map((item) => item.distance_km)
    .filter((value): value is number => typeof value === "number");

  return {
    profile,
    hub,
    institutions: enriched,
    stats: {
      jumlah: enriched.length,
      totalPenerima: enriched.reduce((sum, item) => sum + Number(item.jumlah || 0), 0),
      rataRataKm: distances.length
        ? Number((distances.reduce((sum, value) => sum + value, 0) / distances.length).toFixed(2))
        : 0,
      terdekatKm: distances.length ? Math.min(...distances) : 0,
      terjauhKm: distances.length ? Math.max(...distances) : 0,
    },
    boundaries: [],
  };
}

/* ------------------------------------------------------------------ */
/* Profil SPPG                                                         */
/* ------------------------------------------------------------------ */

const PROFILE_FIELDS = [
  "nama", "alamat", "kecamatan", "kabupaten", "provinsi", "telepon",
  "email", "kepala_sppg", "logo", "latitude", "longitude",
] as const;

export async function getProfile(): Promise<SppgProfile | null> {
  return (await getCurrentProfile()) as SppgProfile | null;
}

export async function updateProfile(input: Record<string, unknown>) {
  const values: unknown[] = [];
  const assignments = PROFILE_FIELDS.map((field) => {
    if (field === "latitude" || field === "longitude") {
      values.push(numOrNull(input[field]));
    } else {
      values.push(clean(input[field]));
    }
    return `${field} = $${values.length}`;
  });
  const nama = clean(input.nama);
  if (!nama) throw new ValidationError("Nama SPPG wajib diisi.");

  const row = await one<SppgProfile>(
    `UPDATE sppg_profiles SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE id = (SELECT MIN(id) FROM sppg_profiles) RETURNING *`,
    values,
  );
  if (!row) throw new NotFoundError("Profil SPPG tidak ditemukan.");
  return row;
}

/* ------------------------------------------------------------------ */
/* Riwayat penerima                                                    */
/* ------------------------------------------------------------------ */

export async function getBeneficiaryHistory(
  beneficiaryId?: number | null,
): Promise<BeneficiaryHistory[]> {
  const rows = await many<
    Omit<BeneficiaryHistory, "perubahan"> & { perubahan: unknown }
  >(
    `SELECT h.*, u.name AS user_name FROM beneficiary_histories h
     LEFT JOIN users u ON u.id = h.user_id
     ${beneficiaryId ? "WHERE h.beneficiary_id = $1" : ""}
     ORDER BY h.id DESC LIMIT 200`,
    beneficiaryId ? [beneficiaryId] : [],
  );
  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    beneficiary_id: row.beneficiary_id === null ? null : Number(row.beneficiary_id),
    user_id: row.user_id === null ? null : Number(row.user_id),
    perubahan: parseKategori(row.perubahan),
  }));
}

/* ------------------------------------------------------------------ */
/* Operasional LIVE / ARSIP                                            */
/* ------------------------------------------------------------------ */

async function snapshotFromReport(reportId: number): Promise<Snapshot> {
  type DetailRow = DailyReportDetail & {
    institution_nama: string | null;
    institution_tipe: string | null;
  };

  const rows = await many<DetailRow>(
    `SELECT d.*, i.nama AS institution_nama, i.tipe AS institution_tipe
     FROM daily_report_details d LEFT JOIN institutions i ON i.id = d.institution_id
     WHERE d.daily_report_id = $1 ORDER BY i.tipe, i.urutan, i.nama`,
    [reportId],
  );

  const totals = Object.fromEntries(GRUP_URUTAN.map((kode) => [kode, 0]));
  const institusi = rows.map((row) => {
    const rincian = Object.fromEntries(
      [...DETAIL_KEYS, "total"].map((key) => [
        key,
        Number((row as unknown as Record<string, unknown>)[key] ?? 0),
      ]),
    );
    const computedTotal = DETAIL_KEYS.reduce((sum, key) => sum + Number(rincian[key] ?? 0), 0);
    rincian.total = computedTotal;
    const kategoriJson = kategoriJsonFromDetail(rincian);
    for (const kode of GRUP_URUTAN) totals[kode] += Number(kategoriJson[kode] ?? 0);

    return {
      id: Number(row.institution_id),
      nama: row.institution_nama ?? `Lembaga #${row.institution_id}`,
      tipe: row.institution_tipe ?? "-",
      jenjang: null,
      rincian,
      total: computedTotal,
      alamat: null,
      latitude: null,
      longitude: null,
    };
  });

  return {
    totals,
    total: institusi.reduce((sum, item) => sum + item.total, 0),
    kategori_json: totals,
    institusi,
  };
}

function shiftDate(tanggal: string, days: number): string {
  const date = new Date(`${tanggal}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOf(tanggal: string): string {
  const date = new Date(`${tanggal}T00:00:00Z`);
  const dayIndex = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayIndex);
  return date.toISOString().slice(0, 10);
}

function namaHari(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${tanggal}T00:00:00Z`));
}

export async function getOperational(tanggalInput?: string): Promise<OperationalData> {
  const today = todayString();
  const tanggal = tanggalInput && /^\d{4}-\d{2}-\d{2}$/.test(tanggalInput)
    ? tanggalInput
    : today;
  if (tanggal > today) {
    throw new ValidationError("Tanggal tidak boleh di masa depan.");
  }

  const [saved, liveSnapshot, calendarRows] = await Promise.all([
    one<DailyReport>("SELECT * FROM daily_reports WHERE tanggal = $1", [tanggal]),
    buildSnapshot(),
    many<{ tanggal: string; total: number }>(
      `SELECT tanggal::text AS tanggal, total::int AS total FROM daily_reports
       WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
       ORDER BY tanggal`,
      [tanggal],
    ),
  ]);

  const [year, month] = tanggal.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const savedMap = new Map(calendarRows.map((row) => [String(row.tanggal), Number(row.total)]));
  const calendar = Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const key = `${year}-${String(month).padStart(2, "0")}-${day}`;
    return { tanggal: key, tersimpan: savedMap.has(key), total: savedMap.get(key) ?? null };
  });

  const isToday = tanggal === today;
  const snapshot = saved ? await snapshotFromReport(Number(saved.id)) : liveSnapshot;

  return {
    tanggal,
    status: isToday ? "LIVE" : "ARSIP",
    isToday,
    saved,
    snapshot,
    sumber: saved?.sumber ?? null,
    catatan:
      saved?.catatan ??
      (isToday
        ? null
        : "Belum ada snapshot tersimpan untuk tanggal ini. Data yang tampil adalah data terkini (LIVE)."),
    fallback: !saved && !isToday,
    calendar,
  };
}

/* ------------------------------------------------------------------ */
/* Laporan mingguan                                                    */
/* ------------------------------------------------------------------ */

export async function getWeeklyReport(tanggalInput?: string): Promise<WeeklyReportData> {
  const today = todayString();
  const reference = tanggalInput && /^\d{4}-\d{2}-\d{2}$/.test(tanggalInput) ? tanggalInput : today;
  const start = mondayOf(reference);
  const end = shiftDate(start, 4);

  const [rows, recentRows] = await Promise.all([
    many<DailyReport>(
      "SELECT * FROM daily_reports WHERE tanggal BETWEEN $1 AND $2 ORDER BY tanggal",
      [start, end],
    ),
    many<DailyReport>(
      "SELECT * FROM daily_reports WHERE tanggal <= $1 ORDER BY tanggal DESC LIMIT 20",
      [reference],
    ),
  ]);

  const byDate = new Map(rows.map((row) => [String(row.tanggal), row]));
  const ordered = [...recentRows].reverse();
  const previousTotal = (tanggal: string) =>
    [...ordered]
      .reverse()
      .find((row) => String(row.tanggal) < tanggal);

  const days: WeeklyDay[] = Array.from({ length: 5 }, (_, index) => {
    const tanggal = shiftDate(start, index);
    const report = byDate.get(tanggal) ?? null;
    const status: WeeklyDay["status"] =
      tanggal > today
        ? "Belum jatuh tempo"
        : !report
          ? "Belum ada data"
          : String(report.sumber) === "otomatis" || String(report.sumber) === "cron"
            ? "Otomatis"
            : "Sudah diupdate";
    return {
      tanggal,
      hari: namaHari(tanggal),
      status,
      report,
      selisih: report
        ? Number(report.total) - Number(previousTotal(tanggal)?.total ?? 0)
        : null,
    };
  });

  const recent = ordered.map((row, index) => ({
    tanggal: String(row.tanggal),
    total: Number(row.total),
    selisih: index === 0 ? Number(row.total) : Number(row.total) - Number(ordered[index - 1].total),
  }));

  return {
    start,
    end,
    days,
    recent,
    totalUpdate: days.filter((day) => day.status === "Sudah diupdate").length,
    totalOtomatis: days.filter((day) => day.status === "Otomatis").length,
  };
}

/* ------------------------------------------------------------------ */
/* Pengguna & role                                                     */
/* ------------------------------------------------------------------ */

const USER_ROLE_SQL = `(SELECT r.name FROM model_has_roles mr
  JOIN roles r ON r.id = mr.role_id
  WHERE mr.model_id = u.id AND mr.model_type = 'App\\Models\\User'
  ORDER BY r.name LIMIT 1)`;

export async function listUsers(): Promise<UserRecord[]> {
  const rows = await many<Record<string, unknown>>(
    `SELECT u.id, u.name, u.email, u.created_at, u.email_verified_at,
      ${USER_ROLE_SQL} AS role FROM users u ORDER BY u.id`,
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role ? String(row.role) : null,
    created_at: row.created_at === null ? undefined : String(row.created_at),
    email_verified_at: row.email_verified_at === null ? null : String(row.email_verified_at),
  }));
}

async function setUserRole(client: import("pg").PoolClient, userId: number, role: string) {
  const roleRow = await client.query<{ id: string }>(
    "SELECT id FROM roles WHERE name = $1 LIMIT 1",
    [role],
  );
  if (!roleRow.rows[0]) throw new ValidationError(`Role "${role}" tidak ditemukan.`);
  await client.query(
    "DELETE FROM model_has_roles WHERE model_id = $1 AND model_type = 'App\\Models\\User'",
    [userId],
  );
  await client.query(
    `INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES ($1, 'App\\Models\\User', $2)`,
    [roleRow.rows[0].id, userId],
  );
}

export async function createUser(input: Record<string, unknown>) {
  const name = clean(input.name);
  const email = clean(input.email)?.toLowerCase();
  const password = String(input.password ?? "");
  const role = String(input.role || "petugas");

  if (!name || !email) throw new ValidationError("Nama dan email wajib diisi.");
  if (password.length < 6) throw new ValidationError("Password minimal 6 karakter.");
  const exists = await one("SELECT id FROM users WHERE lower(email) = lower($1)", [email]);
  if (exists) throw new ValidationError("Email sudah terdaftar.");

  const bcrypt = (await import("bcryptjs")).default;
  const hash = bcrypt.hashSync(password, 10);

  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [name, email, hash],
    );
    const userId = Number(inserted.rows[0].id);
    await setUserRole(client, userId, role);
    return { id: userId, name, email, role };
  });
}

export async function updateUser(id: number, input: Record<string, unknown>) {
  const current = await one<UserRecord>(
    `SELECT u.id, u.name, u.email, ${USER_ROLE_SQL} AS role FROM users u WHERE u.id = $1`,
    [id],
  );
  if (!current) throw new NotFoundError("Pengguna tidak ditemukan.");

  const name = clean(input.name) ?? current.name;
  const email = clean(input.email)?.toLowerCase() ?? current.email;
  const password = clean(input.password);
  const role = clean(input.role) ?? current.role ?? "petugas";

  return withTransaction(async (client) => {
    if (password) {
      const bcrypt = (await import("bcryptjs")).default;
      await client.query(
        "UPDATE users SET name = $1, email = $2, password = $3, updated_at = NOW() WHERE id = $4",
        [name, email, bcrypt.hashSync(password, 10), id],
      );
    } else {
      await client.query(
        "UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3",
        [name, email, id],
      );
    }
    await setUserRole(client, id, role);
    return { id, name, email, role };
  });
}

export async function deleteUser(id: number, currentUserId: number) {
  if (id === currentUserId) throw new ValidationError("Tidak dapat menghapus akun sendiri.");
  const current = await one("SELECT id FROM users WHERE id = $1", [id]);
  if (!current) throw new NotFoundError("Pengguna tidak ditemukan.");
  await withTransaction(async (client) => {
    await client.query(
      "DELETE FROM model_has_roles WHERE model_id = $1 AND model_type = 'App\\Models\\User'",
      [id],
    );
    await client.query("DELETE FROM users WHERE id = $1", [id]);
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// Dipakai oleh halaman statis untuk memastikan koneksi database aktif.
export async function checkDatabase() {
  await query("SELECT 1");
  return true;
}

export { pool };
