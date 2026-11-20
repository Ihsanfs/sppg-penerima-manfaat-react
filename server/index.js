import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool, query, one, many } from './db.js';
import {
  buildSnapshot,
  getCurrentProfile,
  genderCounts,
  GRUP_URUTAN,
  GRUP_LABELS,
  kategoriJsonFromDetail,
} from './snapshot.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.API_PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'sppg-dev-secret-ganti-di-produksi';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Belum login.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Sesi berakhir. Silakan login lagi.' });
  }
}

function todayString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function hariIndo() {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(new Date());
}

function pick(body, fields) {
  const out = {};
  for (const f of fields) if (Object.hasOwn(body || {}, f)) out[f] = body[f];
  return out;
}

function clean(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value.trim() || null;
  return value;
}

function numOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildPagination(req) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

async function writeBeneficiaryHistory(action, beneficiary, institutionNama, userId, alasan, perubahan) {
  await query(
    `INSERT INTO beneficiary_histories
      (beneficiary_id, user_id, aksi, beneficiary_nama, institution_nama, kategori,
       tanggal, hari, alasan, perubahan, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE,$7,$8,$9::json,NOW(),NOW())`,
    [
      beneficiary?.id ?? null,
      userId ?? null,
      action,
      beneficiary?.nama ?? '-',
      institutionNama ?? null,
      beneficiary?.kategori ?? null,
      hariIndo(),
      alasan ?? null,
      JSON.stringify(perubahan ?? {}),
    ],
  );
}

async function institutionName(id) {
  if (!id) return null;
  const row = await one('SELECT nama FROM institutions WHERE id = $1', [id]);
  return row?.nama ?? null;
}

/* ------------------------------------------------------------------ */
/* HEALTH + PUBLIC                                                      */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/api/public/dashboard', asyncRoute(async (_req, res) => {
  const [profile, snapshot, gender, savedToday] = await Promise.all([
    getCurrentProfile(),
    buildSnapshot(),
    genderCounts(),
    one('SELECT saved_at, sumber, total, catatan FROM daily_reports WHERE tanggal = $1', [todayString()]),
  ]);

  const sekolah = snapshot.institusi.filter((i) => i.tipe === 'sekolah');
  const posyandu = snapshot.institusi.filter((i) => i.tipe === 'posyandu');
  const rekap = GRUP_URUTAN.map((kode) => ({
    kode,
    label: GRUP_LABELS[kode] || kode,
    nilai: Number(snapshot.kategori_json[kode] || 0),
  }));

  res.json({
    profile,
    tanggal: todayString(),
    snapshot,
    sekolah,
    posyandu,
    totalSekolah: sekolah.reduce((s, i) => s + i.total, 0),
    totalPosyandu: posyandu.reduce((s, i) => s + i.total, 0),
    jumlahLaki: gender.L,
    jumlahPerempuan: gender.P,
    savedToday,
    rekap,
  });
}));

/* ------------------------------------------------------------------ */
/* AUTH                                                                 */
/* ------------------------------------------------------------------ */

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await one('SELECT id, name, email, password FROM users WHERE lower(email) = lower($1) LIMIT 1', [
    String(email || ''),
  ]);

  const hash = user?.password?.startsWith('$2y$')
    ? '$2a$' + user.password.slice(4)
    : user?.password;
  if (!user || !hash || !bcrypt.compareSync(String(password || ''), hash)) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  const payload = { id: Number(user.id), name: user.name, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user: payload });
}));

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

/* ------------------------------------------------------------------ */
/* OPTIONS (untuk dropdown form)                                        */
/* ------------------------------------------------------------------ */

app.get('/api/options', auth, asyncRoute(async (_req, res) => {
  const [penerima, lembaga, jenjang, institutions] = await Promise.all([
    many("SELECT kode, nama, grup FROM categories WHERE jenis='penerima' AND is_active=true ORDER BY urutan, nama"),
    many("SELECT kode, nama FROM categories WHERE jenis='lembaga' AND is_active=true ORDER BY urutan, nama"),
    many("SELECT kode, nama FROM categories WHERE jenis='jenjang' AND is_active=true ORDER BY urutan, nama"),
    many('SELECT id, nama, tipe FROM institutions WHERE is_active=true ORDER BY nama'),
  ]);
  res.json({ penerima, lembaga, jenjang, institutions });
}));

/* ------------------------------------------------------------------ */
/* DASHBOARD STATS                                                      */
/* ------------------------------------------------------------------ */

app.get('/api/dashboard', auth, asyncRoute(async (_req, res) => {
  const [snapshot, gender, counts, recent] = await Promise.all([
    buildSnapshot(),
    genderCounts(),
    one(`SELECT
           (SELECT COUNT(*)::int FROM beneficiaries WHERE status='aktif') AS aktif,
           (SELECT COUNT(*)::int FROM beneficiaries WHERE status!='aktif') AS nonaktif,
           (SELECT COUNT(*)::int FROM institutions WHERE is_active=true) AS lembaga,
           (SELECT COUNT(*)::int FROM categories WHERE is_active=true) AS kategori,
           (SELECT COUNT(*)::int FROM daily_reports) AS laporan`),
    many(`SELECT a.*, u.name AS user_name FROM audit_logs a
          LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 8`),
  ]);

  res.json({
    snapshot,
    gender,
    counts,
    recent,
    rekap: GRUP_URUTAN.map((kode) => ({
      kode,
      label: GRUP_LABELS[kode] || kode,
      nilai: Number(snapshot.kategori_json[kode] || 0),
    })),
  });
}));

/* ------------------------------------------------------------------ */
/* BENEFICIARIES                                                        */
/* ------------------------------------------------------------------ */

const BENEF_FIELDS = [
  'institution_id', 'nama', 'nik', 'nisn', 'jenis_kelamin', 'kategori',
  'kelas', 'jurusan', 'status', 'bulan', 'tahun', 'keterangan',
];

function normalizeBeneficiary(input) {
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
    status: clean(b.status) || 'aktif',
    bulan: numOrNull(b.bulan),
    tahun: numOrNull(b.tahun),
    keterangan: clean(b.keterangan),
  };
}

function validateBeneficiary(b) {
  if (!b.nama) return 'Nama wajib diisi.';
  if (!b.institution_id) return 'Lembaga wajib dipilih.';
  if (!b.jenis_kelamin) return 'Jenis kelamin wajib dipilih.';
  if (!b.kategori) return 'Kategori wajib dipilih.';
  return null;
}

app.get('/api/beneficiaries', auth, asyncRoute(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const status = String(req.query.status || '').trim();
  const institutionId = String(req.query.institution_id || '').trim();
  const { page, limit, offset } = buildPagination(req);

  const clauses = [];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    clauses.push(`(b.nama ILIKE $${i} OR COALESCE(b.nik,'') ILIKE $${i} OR COALESCE(b.nisn,'') ILIKE $${i})`);
  }
  if (status) {
    params.push(status);
    clauses.push(`b.status = $${params.length}`);
  }
  if (institutionId) {
    params.push(Number(institutionId));
    clauses.push(`b.institution_id = $${params.length}`);
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

  const totalRow = await one(`SELECT COUNT(*)::int AS n FROM beneficiaries b ${where}`, params);
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const data = await many(
    `SELECT b.*, i.nama AS institution_nama, i.tipe AS institution_tipe
     FROM beneficiaries b LEFT JOIN institutions i ON i.id = b.institution_id
     ${where}
     ORDER BY b.id DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );

  res.json({ data, total: totalRow?.n ?? 0, page, limit });
}));

app.post('/api/beneficiaries', auth, asyncRoute(async (req, res) => {
  const b = normalizeBeneficiary(req.body);
  const error = validateBeneficiary(b);
  if (error) return res.status(422).json({ message: error });

  const values = BENEF_FIELDS.map((f) => b[f]);
  const placeholders = BENEF_FIELDS.map((_, i) => `$${i + 1}`).join(', ');
  const row = await one(
    `INSERT INTO beneficiaries (${BENEF_FIELDS.join(', ')}, created_at, updated_at)
     VALUES (${placeholders}, NOW(), NOW()) RETURNING *`,
    values,
  );

  await writeBeneficiaryHistory(
    'dibuat', row, await institutionName(row.institution_id), req.user?.id,
    'Dibuat dari aplikasi React', row,
  );
  res.status(201).json(row);
}));

app.put('/api/beneficiaries/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const before = await one('SELECT * FROM beneficiaries WHERE id = $1', [id]);
  if (!before) return res.status(404).json({ message: 'Penerima tidak ditemukan.' });

  const b = normalizeBeneficiary(req.body);
  const error = validateBeneficiary(b);
  if (error) return res.status(422).json({ message: error });

  const fields = [...BENEF_FIELDS];
  const params = fields.map((f) => b[f]);
  params.push(id);
  const idIdx = params.length;
  const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const row = await one(
    `UPDATE beneficiaries SET ${sets}, updated_at = NOW() WHERE id = $${idIdx} RETURNING *`,
    params,
  );

  const perubahan = {};
  for (const f of fields) if (String(before[f]) !== String(row[f])) perubahan[f] = { dari: before[f], ke: row[f] };
  await writeBeneficiaryHistory(
    'diperbarui', row, await institutionName(row.institution_id), req.user?.id,
    'Diubah dari aplikasi React', perubahan,
  );
  res.json(row);
}));

app.delete('/api/beneficiaries/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const before = await one('SELECT * FROM beneficiaries WHERE id = $1', [id]);
  if (!before) return res.status(404).json({ message: 'Penerima tidak ditemukan.' });

  await writeBeneficiaryHistory(
    'dihapus', before, await institutionName(before.institution_id), req.user?.id,
    'Dihapus dari aplikasi React', before,
  );
  await query('DELETE FROM beneficiaries WHERE id = $1', [id]);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/* INSTITUTIONS                                                         */
/* ------------------------------------------------------------------ */

const INST_FIELDS = [
  'nama', 'tipe', 'jenjang', 'category_id', 'alamat', 'penanggung_jawab',
  'telepon', 'urutan', 'is_active', 'latitude', 'longitude',
];

function normalizeInstitution(input) {
  return {
    nama: clean(input?.nama),
    tipe: clean(input?.tipe) || 'sekolah',
    jenjang: clean(input?.jenjang),
    category_id: numOrNull(input?.category_id),
    alamat: clean(input?.alamat),
    penanggung_jawab: clean(input?.penanggung_jawab),
    telepon: clean(input?.telepon),
    urutan: numOrNull(input?.urutan) ?? 0,
    is_active: input?.is_active === undefined ? true : Boolean(input.is_active),
    latitude: numOrNull(input?.latitude),
    longitude: numOrNull(input?.longitude),
  };
}

const INST_SELECT = `
  SELECT i.*, c.nama AS category_nama,
    (SELECT COUNT(*)::int FROM beneficiaries b WHERE b.institution_id = i.id AND b.status = 'aktif') AS jumlah_penerima
  FROM institutions i LEFT JOIN categories c ON c.id = i.category_id
`;

app.get('/api/institutions', auth, asyncRoute(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const params = [];
  let where = '';
  if (q) {
    params.push(`%${q}%`);
    where = `WHERE i.nama ILIKE $${params.length} OR i.alamat ILIKE $${params.length}`;
  }
  const data = await many(`${INST_SELECT} ${where} ORDER BY i.tipe, i.urutan, i.nama`, params);
  res.json({ data });
}));

app.post('/api/institutions', auth, asyncRoute(async (req, res) => {
  const v = normalizeInstitution(req.body);
  if (!v.nama) return res.status(422).json({ message: 'Nama lembaga wajib diisi.' });
  const values = INST_FIELDS.map((f) => v[f]);
  const row = await one(
    `INSERT INTO institutions (${INST_FIELDS.join(', ')}, created_at, updated_at)
     VALUES (${INST_FIELDS.map((_, i) => `$${i + 1}`).join(', ')}, NOW(), NOW()) RETURNING *`,
    values,
  );
  res.status(201).json(row);
}));

app.put('/api/institutions/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const v = normalizeInstitution(req.body);
  if (!v.nama) return res.status(422).json({ message: 'Nama lembaga wajib diisi.' });
  const params = INST_FIELDS.map((f) => v[f]);
  params.push(id);
  const row = await one(
    `UPDATE institutions SET ${INST_FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING *`,
    params,
  );
  if (!row) return res.status(404).json({ message: 'Lembaga tidak ditemukan.' });
  res.json(row);
}));

app.delete('/api/institutions/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const used = await one('SELECT COUNT(*)::int AS n FROM beneficiaries WHERE institution_id = $1', [id]);
  if (used?.n > 0) return res.status(400).json({ message: `Lembaga masih memiliki ${used.n} penerima. Pindahkan dulu.` });
  await query('DELETE FROM institutions WHERE id = $1', [id]);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/* CATEGORIES                                                           */
/* ------------------------------------------------------------------ */

const CAT_FIELDS = ['kode', 'nama', 'jenis', 'grup', 'urutan', 'is_active', 'keterangan', 'has_class'];

function normalizeCategory(input) {
  return {
    kode: clean(input?.kode),
    nama: clean(input?.nama),
    jenis: clean(input?.jenis) || 'penerima',
    grup: clean(input?.grup),
    urutan: numOrNull(input?.urutan) ?? 0,
    is_active: input?.is_active === undefined ? true : Boolean(input.is_active),
    keterangan: clean(input?.keterangan),
    has_class: input?.has_class === undefined ? false : Boolean(input.has_class),
  };
}

const CAT_SELECT = `
  SELECT c.*,
    (SELECT COUNT(*)::int FROM beneficiaries b WHERE b.kategori = c.kode) AS usage_count,
    (SELECT COUNT(*)::int FROM institutions i WHERE i.category_id = c.id) AS institution_count
  FROM categories c
`;

app.get('/api/categories', auth, asyncRoute(async (req, res) => {
  const data = await many(`${CAT_SELECT} ORDER BY c.jenis, c.urutan, c.nama`);
  res.json({ data });
}));

app.post('/api/categories', auth, asyncRoute(async (req, res) => {
  const v = normalizeCategory(req.body);
  if (!v.kode || !v.nama) return res.status(422).json({ message: 'Kode dan nama wajib diisi.' });
  const row = await one(
    `INSERT INTO categories (${CAT_FIELDS.join(', ')}, created_at, updated_at)
     VALUES (${CAT_FIELDS.map((_, i) => `$${i + 1}`).join(', ')}, NOW(), NOW()) RETURNING *`,
    CAT_FIELDS.map((f) => v[f]),
  );
  res.status(201).json(row);
}));

app.put('/api/categories/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const v = normalizeCategory(req.body);
  if (!v.kode || !v.nama) return res.status(422).json({ message: 'Kode dan nama wajib diisi.' });
  const params = CAT_FIELDS.map((f) => v[f]);
  params.push(id);
  const row = await one(
    `UPDATE categories SET ${CAT_FIELDS.map((f, i) => `${f} = $${i + 1}`).join(', ')}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING *`,
    params,
  );
  if (!row) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
  res.json(row);
}));

app.delete('/api/categories/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const used = await one(
    `SELECT
       (SELECT COUNT(*)::int FROM beneficiaries WHERE kategori = (SELECT kode FROM categories WHERE id = $1)) AS beneficiary_count,
       (SELECT COUNT(*)::int FROM institutions WHERE category_id = $1) AS institution_count`,
    [id],
  );
  if ((used?.beneficiary_count ?? 0) > 0 || (used?.institution_count ?? 0) > 0) {
    return res.status(400).json({ message: 'Kategori masih digunakan. Hapus/nonaktifkan saja.' });
  }
  await query('DELETE FROM categories WHERE id = $1', [id]);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/* DAILY REPORTS                                                        */
/* ------------------------------------------------------------------ */

app.get('/api/daily-reports', auth, asyncRoute(async (req, res) => {
  const { page, limit, offset } = buildPagination(req);
  const total = await one('SELECT COUNT(*)::int AS n FROM daily_reports');
  const data = await many(
    `SELECT dr.*, u.name AS saved_by_name FROM daily_reports dr
     LEFT JOIN users u ON u.id = dr.saved_by
     ORDER BY dr.tanggal DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  res.json({ data, total: total?.n ?? 0, page, limit });
}));

app.get('/api/daily-reports/:id', auth, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const report = await one(
    `SELECT dr.*, u.name AS saved_by_name FROM daily_reports dr
     LEFT JOIN users u ON u.id = dr.saved_by WHERE dr.id = $1`,
    [id],
  );
  if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
  const details = await many(
    `SELECT d.*, i.nama AS institution_nama, i.tipe AS institution_tipe
     FROM daily_report_details d LEFT JOIN institutions i ON i.id = d.institution_id
     WHERE d.daily_report_id = $1 ORDER BY i.tipe, i.urutan, i.nama`,
    [id],
  );
  res.json({ report, details });
}));

app.post('/api/daily-reports/save', auth, asyncRoute(async (req, res) => {
  const snapshot = await buildSnapshot();
  const tanggal = String(req.body?.tanggal || todayString());
  const sumber = String(req.body?.sumber || 'manual');
  const catatan = clean(req.body?.catatan);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const before = await client.query('SELECT total FROM daily_reports WHERE tanggal = $1', [tanggal]);
    const totalSebelum = before.rows[0]?.total ?? 0;

    const totals = snapshot.totals;
    const cols = [...Object.keys(totals), 'total', 'sumber', 'saved_by', 'saved_at', 'catatan', 'kategori_json'];
    const values = [
      ...Object.values(totals),
      snapshot.total,
      sumber,
      req.user?.id ?? null,
      new Date(),
      catatan,
      JSON.stringify(snapshot.kategori_json),
    ];
    const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
    const updates = cols
      .filter((c) => c !== 'tanggal')
      .map((c, i) => `${c} = EXCLUDED.${c}`)
      .join(', ');

    const saved = await client.query(
      `INSERT INTO daily_reports (tanggal, ${cols.join(', ')}, created_at, updated_at)
       VALUES ($1, ${placeholders}, NOW(), NOW())
       ON CONFLICT (tanggal) DO UPDATE SET ${updates}, updated_at = NOW()
       RETURNING *`,
      [tanggal, ...values],
    );

    await client.query('DELETE FROM daily_report_details WHERE daily_report_id = $1', [saved.rows[0].id]);

    for (const row of snapshot.institusi) {
      const detail = row.rincian;
      const detailCols = [
        'tk_paud', 'kelas_1', 'kelas_2', 'kelas_3', 'kelas_4', 'kelas_5', 'kelas_6',
        'smk', 'guru', 'balita', 'bumil', 'busui', 'kader', 'total',
      ];
      const detailValues = [
        ...detailCols.map((k) => Number(detail[k] || 0)),
        JSON.stringify(kategoriJsonFromDetail(detail)),
      ];
      await client.query(
        `INSERT INTO daily_report_details
          (daily_report_id, institution_id, ${detailCols.join(', ')}, kategori_json, created_at, updated_at)
         VALUES ($1, $2, ${detailCols.map((_, i) => `$${i + 3}`).join(', ')}, $${detailCols.length + 3}, NOW(), NOW())`,
        [saved.rows[0].id, row.id, ...detailValues],
      );
    }

    await client.query(
      `INSERT INTO audit_logs
        (user_id, tanggal_data, aksi, sumber, total_sebelum, total_sesudah, selisih, catatan, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
      [
        req.user?.id ?? null,
        tanggal,
        before.rowCount ? 'update' : 'simpan',
        sumber,
        totalSebelum,
        snapshot.total,
        snapshot.total - totalSebelum,
        catatan,
      ],
    );

    await client.query('COMMIT');
    res.json({ report: saved.rows[0], total: snapshot.total });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

/* ------------------------------------------------------------------ */
/* GIS + AUDIT                                                          */
/* ------------------------------------------------------------------ */

app.get('/api/gis', auth, asyncRoute(async (_req, res) => {
  const [profile, institutions] = await Promise.all([
    getCurrentProfile(),
    many(`
      SELECT i.id, i.nama, i.tipe, i.jenjang, i.alamat, i.latitude, i.longitude,
        (SELECT COUNT(*)::int FROM beneficiaries b WHERE b.institution_id = i.id AND b.status = 'aktif') AS jumlah
      FROM institutions i
      WHERE i.is_active = true AND i.latitude IS NOT NULL AND i.longitude IS NOT NULL
      ORDER BY i.tipe, i.nama
    `),
  ]);
  res.json({ profile, institutions });
}));

app.get('/api/audit-logs', auth, asyncRoute(async (req, res) => {
  const data = await many(
    `SELECT a.*, u.name AS user_name FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 50`,
  );
  res.json({ data });
}));

/* ------------------------------------------------------------------ */

app.use((err, _req, res, _next) => {
  console.error('[api]', err);
  if (err.code === '23503') return res.status(400).json({ message: 'Data masih digunakan oleh data lain.' });
  if (err.code === '23505') return res.status(400).json({ message: 'Data sudah ada (duplikat).' });
  if (err.code === '23514') return res.status(400).json({ message: 'Nilai tidak sesuai format yang diizinkan database.' });
  res.status(500).json({ message: err.message || 'Terjadi kesalahan server.' });
});

app.listen(PORT, () => {
  console.log(`API SPPG berjalan di http://127.0.0.1:${PORT}`);
});
