export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role?: string | null;
};

export type Beneficiary = {
  id: number;
  institution_id: number;
  nama: string;
  nik: string | null;
  nisn: string | null;
  jenis_kelamin: string;
  kategori: string;
  kelas: number | null;
  jurusan: string | null;
  status: string;
  bulan: number | null;
  tahun: number | null;
  keterangan: string | null;
  alasan?: string | null;
  institution_nama?: string | null;
  institution_tipe?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Institution = {
  id: number;
  nama: string;
  tipe: string;
  jenjang: string | null;
  category_id: number | null;
  category_nama?: string | null;
  alamat: string | null;
  penanggung_jawab: string | null;
  telepon: string | null;
  urutan: number | null;
  is_active: boolean;
  latitude: number | string | null;
  longitude: number | string | null;
  jumlah_penerima?: number;
  created_at?: string;
  updated_at?: string;
};

export type Category = {
  id: number;
  kode: string;
  nama: string;
  jenis: string;
  grup: string | null;
  urutan: number | null;
  is_active: boolean;
  keterangan: string | null;
  has_class: boolean;
  usage_count?: number;
  institution_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type DailyReport = {
  id: number;
  tanggal: string;
  sumber: string;
  saved_by: number | null;
  saved_by_name?: string | null;
  saved_at: string;
  catatan: string | null;
  total: number;
  total_sebelum?: number | null;
  selisih?: number | null;
  kategori_json?: Record<string, number> | string;
  [key: string]: unknown;
};

export type DailyReportDetail = {
  id: number;
  daily_report_id: number;
  institution_id: number | null;
  institution_nama?: string | null;
  institution_tipe?: string | null;
  tk_paud: number;
  kelas_1: number;
  kelas_2: number;
  kelas_3: number;
  kelas_4: number;
  kelas_5: number;
  kelas_6: number;
  smk: number;
  guru: number;
  balita: number;
  bumil: number;
  busui: number;
  kader: number;
  total: number;
  kategori_json?: Record<string, number> | string;
};

export type AuditLog = {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  tanggal_data?: string;
  aksi: string;
  sumber: string | null;
  total_sebelum: number | null;
  total_sesudah: number | null;
  selisih: number | null;
  catatan: string | null;
  created_at?: string;
  [key: string]: unknown;
};

export type SnapshotInstitution = {
  id: number;
  nama: string;
  tipe: string;
  jenjang: string | null;
  rincian: Record<string, number>;
  total: number;
  alamat: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

export type Snapshot = {
  totals: Record<string, number>;
  total: number;
  kategori_json: Record<string, number>;
  institusi: SnapshotInstitution[];
};

export type RekapItem = { kode: string; label: string; nilai: number };

export type PublicDashboardData = {
  profile: Record<string, unknown> | null;
  tanggal: string;
  snapshot: Snapshot;
  sekolah: SnapshotInstitution[];
  posyandu: SnapshotInstitution[];
  totalSekolah: number;
  totalPosyandu: number;
  jumlahLaki: number;
  jumlahPerempuan: number;
  savedToday: DailyReport | null;
  rekap: RekapItem[];
};

export type AdminDashboardData = {
  snapshot: Snapshot;
  gender: { L: number; P: number };
  counts: {
    aktif: number;
    nonaktif: number;
    lembaga: number;
    kategori: number;
    laporan: number;
  };
  recent: AuditLog[];
  rekap: RekapItem[];
};

export type OptionsData = {
  penerima: { kode: string; nama: string; grup: string | null }[];
  lembaga: { kode: string; nama: string }[];
  jenjang: { kode: string; nama: string }[];
  institutions: { id: number; nama: string; tipe: string }[];
};

export type SppgProfile = {
  id: number;
  nama: string;
  alamat: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  telepon: string | null;
  email: string | null;
  kepala_sppg: string | null;
  logo: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

export type GisInstitution = {
  id: number;
  nama: string;
  tipe: string;
  jenjang: string | null;
  alamat: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  jumlah: number;
  distance_km?: number;
};

export type GisData = {
  profile: SppgProfile | null;
  hub: { lat: number; lon: number; nama: string; alamat: string | null } | null;
  institutions: GisInstitution[];
  stats: {
    jumlah: number;
    totalPenerima: number;
    rataRataKm: number;
    terdekatKm: number;
    terjauhKm: number;
  };
  // Database belum menyimpan polygon batas wilayah; disiapkan untuk future use.
  boundaries: { nama: string; koordinat: [number, number][] }[];
};

export type BeneficiaryHistory = {
  id: number;
  beneficiary_id: number | null;
  user_id: number | null;
  user_name?: string | null;
  aksi: string;
  beneficiary_nama: string;
  institution_nama: string | null;
  kategori: string | null;
  tanggal: string;
  hari: string;
  alasan: string | null;
  perubahan: Record<string, unknown>;
  created_at?: string;
};

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  email_verified_at?: string | null;
  created_at?: string;
};

export type OperationalData = {
  tanggal: string;
  status: "LIVE" | "ARSIP";
  isToday: boolean;
  saved: DailyReport | null;
  snapshot: Snapshot;
  sumber: string | null;
  catatan: string | null;
  fallback: boolean;
  calendar: { tanggal: string; tersimpan: boolean; total: number | null }[];
};

export type WeeklyDay = {
  tanggal: string;
  hari: string;
  status: "Belum jatuh tempo" | "Sudah diupdate" | "Otomatis" | "Belum ada data";
  report: DailyReport | null;
  selisih: number | null;
};

export type WeeklyReportData = {
  start: string;
  end: string;
  days: WeeklyDay[];
  recent: { tanggal: string; total: number; selisih: number | null }[];
  totalUpdate: number;
  totalOtomatis: number;
};

export type ImportResult = {
  berhasil: number;
  gagal: number;
  errors: { baris: number; pesan: string }[];
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
