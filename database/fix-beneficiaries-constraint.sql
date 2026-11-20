-- PostgreSQL menyimpan kolom enum lama sebagai VARCHAR + CHECK constraint.
-- Migration Laravel sudah menghapus constraint serupa di categories dan
-- institutions, tetapi bukan di beneficiaries. Akibatnya kategori baru seperti
-- "smp" ditolak walaupun sudah ada di tabel categories.
--
-- Jalankan sekali pada database Supabase yang dipakai aplikasi ini:
--   psql "postgresql://postgres:<password>@db.mxuxyvqkowabydsscgth.supabase.co:5432/postgres?sslmode=require" \
--        -f database/fix-beneficiaries-constraint.sql

ALTER TABLE beneficiaries DROP CONSTRAINT IF EXISTS beneficiaries_kategori_check;
