# Aplikasi Penerima Manfaat SPPG Samarang — Versi React

Versi React JS dari aplikasi penerima manfaat SPPG Samarang. Memakai **database PostgreSQL Supabase yang sudah ada** (project `mxuxyvqkowabydsscgth`) — tidak membuat database baru dan tidak mengubah data Laravel.

## Arsitektur

```
Browser  →  React (Vite, port 5173)
              ↓ /api
           Express API (port 3001)
              ↓ pg (SSL)
           Supabase PostgreSQL
```

- **Frontend**: React 18 + React Router + Vite
- **Backend**: Express + `node-postgres` (`pg`)
- **Auth**: bcrypt (cek hash Laravel di tabel `users`) + JWT
- **Database**: PostgreSQL Supabase `db.mxuxyvqkowabydsscgth.supabase.co:5432`

> Koneksi database hanya ada di server API. Kredensial tidak pernah dikirim ke browser.

## Menjalankan

```powershell
cd "F:\aplikasi sppg garut samarang"
npm install
npm run dev
```

Buka:
- Halaman publik: http://localhost:5173/
- Admin: http://localhost:5173/login

Akun demo:
- `admin@sppg.test` / `password`
- `petugas@sppg.test` / `password`

Untuk produksi:
```powershell
npm run build
npm run preview
```
Lalu serve folder `dist/` lewat web server dan jalankan `node server/index.js` sebagai service API (atur `API_TARGET` / proxy).

## Fitur

| Halaman | Keterangan |
|---|---|
| `/` | Data publik tanpa login: total, gender, rekap kategori, tabel sekolah & posyandu |
| `/login` | Login dengan akun dari tabel `users` Laravel (bcrypt) |
| `/admin` | Ringkasan statistik & aktivitas terbaru |
| `/admin/beneficiaries` | CRUD penerima + pencarian, filter, pagination, riwayat perubahan |
| `/admin/institutions` | CRUD lembaga (sekolah/posyandu), koordinat, jumlah penerima |
| `/admin/categories` | CRUD kategori penerima/lembaga/jenjang |
| `/admin/reports` | Arsip laporan harian + simpan snapshot |
| `/admin/gis` | Peta sebaran lembaga (OpenStreetMap) + jarak dari SPPG |

Logika `buildSnapshot()` di `server/snapshot.js` adalah port langsung dari `DailyReportService.php`, supaya angka di React **identik** dengan aplikasi Laravel.

## Konfigurasi

Salin `.env.example` menjadi `.env`, lalu isi:

```dotenv
DB_HOST=db.mxuxyvqkowabydsscgth.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<database password>
DB_SSLMODE=require

API_PORT=3001
JWT_SECRET=<secret acak panjang>
API_TARGET=http://127.0.0.1:3001
```

`.env` masuk `.gitignore` — password tidak akan ter-commit.

## Catatan

- `kelas`, `jenis_kelamin`, dan `kategori` memakai kode yang sama seperti aplikasi Laravel.
- Snapshot laporan dibuat dalam satu transaksi: `daily_reports` → `daily_report_details` → `audit_logs`.
- Menghapus lembaga/kategori yang masih dipakai akan ditolak (pesan jelas ditampilkan di UI).
- Untuk produksi, ganti `JWT_SECRET` dan simpan kredensial DB sebagai environment variable server.
