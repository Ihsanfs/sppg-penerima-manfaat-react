# SPPG Samarang — Penerima Manfaat (Next.js)

Aplikasi web Next.js (App Router) untuk pengelolaan dan publikasi data agregat penerima manfaat **SPPG Samarang**. Aplikasi ini terhubung ke database PostgreSQL Supabase yang sudah ada (tanpa membuat database baru).

## Ringkasan

- **Publik (`/`)**: dashboard agregat tanpa login. Hanya menampilkan rekap jumlah/kategori/gender dan rincian per sekolah/posyandu. Tidak menampilkan identitas personal penerima (NIK/NISN/nama).
- **Admin (`/admin/**`)**: area terproteksi login untuk pengelolaan data master, operasional (LIVE/ARSIP), laporan, GIS, riwayat, audit, impor/ekspor, profil, pengguna, dan manual book.
- **Backend**: Next.js Route Handlers (`/api/**`) dengan koneksi PostgreSQL server-side.

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL (`pg`) ke Supabase
- Tailwind CSS v4
- TanStack Table v8 (DataTable: pencarian, sorting, pagination)
- `react-icons`, `xlsx`, Leaflet/React-Leaflet (GIS)

## Persiapan

1. Install dependency:

   ```bash
   npm install
   ```

2. Siapkan environment variable. Salin `.env.example` menjadi `.env` lalu isi nilai yang sesuai:

   ```env
   DB_HOST=db.mxuxyvqkowabydsscgth.supabase.co
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=...
   DB_SSLMODE=require

   JWT_SECRET=ubah-dengan-secret-yang-kuat
   ```

   > `.env` sudah di-*gitignore*. Kredensial database hanya dipakai di server (Route Handlers/lib server-side), bukan di client.

3. Jalankan development server:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`.

## Skrip

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — jalankan hasil build
- `npm run typecheck` — pemeriksaan TypeScript (`tsc --noEmit`)

## Autentikasi & Role

- Login: `/login` (akun seed yang tersedia di database: `admin@sppg.test` dan `petugas@sppg.test`).
- Session menggunakan cookie httpOnly `sppg_token` (+ dukungan `Bearer` token untuk API).
- Proteksi route admin via `src/proxy.ts` (matcher `/admin/:path*`).
- Role diambil dari `model_has_roles` dan dipakai untuk pembatasan akses:
  - **Admin**: akses penuh (hapus data, impor, ubah profil, kelola pengguna, dsb.).
  - **Petugas**: dapat mengelola data operasional/master sesuai izin, tetapi aksi sensitif (hapus/impor/profil/pengguna) dibatasi di UI dan API.

## Fitur Utama

### Publik
- Statistik agregat penerima aktif, rekap kategori, komposisi gender.
- Tabel rincian per sekolah dan posyandu (agregat) dengan pencarian/sort/pagination.

### Admin
- **Data Master**: Penerima Manfaat, Lembaga, Kategori (CRUD, filter, DataTable).
  - Perubahan penerima mewajibkan **alasan** dan tercatat di riwayat; riwayat per penerima dapat dilihat.
- **Laporan Harian**: simpan snapshot harian, lihat detail/rincian per lembaga.
- **Operasional LIVE/ARSIP**: data terkini vs snapshot per tanggal, kalender snapshot, rekap kategori dan rincian lembaga.
- **Laporan Mingguan**: rekap Senin–Jumat, status pembaruan, tren snapshot.
- **GIS**: peta sebaran lembaga terhadap pusat SPPG, jarak, simulasi rute & radius.
- **Riwayat Penerima** & **Audit Log**: jejak perubahan data dan aktivitas snapshot.
- **Impor/Ekspor** (`/admin/impor-ekspor`): template CSV/XLSX, impor data, ekspor penerima/lembaga/riwayat.
- **Profil SPPG**: identitas & koordinat pusat (admin).
- **Pengguna & Role**: manajemen akun (admin).
- **Manual Book**: panduan penggunaan in-app.

## Struktur Penting

- `src/app/page.tsx` — dashboard publik
- `src/app/admin/**` — halaman admin
- `src/app/api/**` — Route Handlers API
- `src/proxy.ts` — proteksi route admin
- `src/lib/db.ts`, `src/lib/queries.ts`, `src/lib/snapshot.ts` — akses data & logika bisnis
- `src/components/ui/data-table.tsx` — DataTable (TanStack Table)

## Catatan

- Proyek ini menggunakan skema/data Supabase yang sudah ada (mis. `beneficiaries`, `institutions`, `daily_reports`, `beneficiary_histories`, `audit_logs`, `sppg_profiles`, dll.).
- Halaman publik tidak boleh mengekspos data identitas personal penerima; endpoint publik hanya mengembalikan agregat.
- Verifikasi yang dilakukan: `npm run typecheck` dan `npm run build` lulus; audit browser mencakup alur publik/admin (termasuk validasi alasan perubahan penerima, riwayat, snapshot/laporan, GIS, impor/ekspor, profil/pengguna, dan pembatasan role petugas).
