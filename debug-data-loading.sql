-- ============================================================
-- SIMBAKES v3.0 - FIX DATA LOADING (Public View)
-- Jalankan ini jika data tidak muncul di web padahal ada di database
-- ============================================================

-- ============================================================
-- BAGIAN 1: PASTIKAN RLS POLICIES UNTUK PUBLIC READ SUDAH BENAR
-- ============================================================

-- 1.1 Hapus policy lama (jika ada) dan buat baru untuk data_pengusulan
DROP POLICY IF EXISTS "pol_public_dp_read" ON data_pengusulan;
CREATE POLICY "pol_public_dp_read" ON data_pengusulan 
    FOR SELECT 
    USING (true);  -- Siapa saja bisa baca (termasuk anon)

-- 1.2 Untuk data_penetapan
DROP POLICY IF EXISTS "pol_public_dpt_read" ON data_penetapan;
CREATE POLICY "pol_public_dpt_read" ON data_penetapan 
    FOR SELECT 
    USING (true);  -- Siapa saja bisa baca

-- 1.3 Untuk roadmap_kebutuhan
DROP POLICY IF EXISTS "pol_public_rm_read" ON roadmap_kebutuhan;
CREATE POLICY "pol_public_rm_read" ON roadmap_kebutuhan 
    FOR SELECT 
    USING (true);  -- Siapa saja bisa baca

-- ============================================================
-- BAGIAN 2: VERIFIKASI - Cek Apakah Data Benar-benar Ada
-- ============================================================

-- Cek jumlah data di setiap tabel
SELECT 'data_pengusulan' as tabel, COUNT(*) as jumlah FROM data_pengusulan
UNION ALL
SELECT 'data_penetapan', COUNT(*) FROM data_penetapan
UNION ALL
SELECT 'roadmap_kebutuhan', COUNT(*) FROM roadmap_kebutuhan;

-- Sample data dari setiap tabel (limit 5)
SELECT '--- SAMPLE data_pengusulan ---' as info;
SELECT id, nama_lengkap, nik, status_pengusulan, created_at 
FROM data_pengusulan 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '--- SAMPLE data_penetapan ---' as info;
SELECT id, nama_lengkap, nik, status_penetapan, tanggal_penetapan 
FROM data_penetapan 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '--- SAMPLE roadmap_kebutuhan ---' as info;
SELECT id, jurusan, status, nama_penerima 
FROM roadmap_kebutuhan 
LIMIT 5;

-- ============================================================
-- BAGIAN 3: CEK RLS STATUS
-- ============================================================

-- Pastikan RLS enabled tapi dengan policy yang benar
SELECT tablename, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('data_pengusulan', 'data_penetapan', 'roadmap_kebutuhan');

-- List semua policies untuk ketiga tabel
SELECT 
    tablename,
    policyname,
    cmd as operation,
    roles,
    qual as condition
FROM pg_policies 
WHERE tablename IN ('data_pengusulan', 'data_penetapan', 'roadmap_kebutuhan')
ORDER BY tablename, cmd;

-- ============================================================
-- BAGIAN 4: TEST QUERY SEBAGAI ANON USER (SIMULASI)
-- ============================================================

-- Set role ke anon untuk test (akan gagal jika tidak ada permission)
-- SET ROLE anon;
-- SELECT COUNT(*) FROM data_pengusulan;  -- Harus return angka, bukan error
-- RESET ROLE;

-- ============================================================
-- CATATAN PENTING:
-- ============================================================
-- Jika setelah menjankan SQL ini data masih tidak muncul:
-- 1. Refresh halaman web (Ctrl+F5)
-- 2. Buka F12 Console, cari error merah
-- 3. Cek Network tab > apakah ada request ke Supabase API?
-- 4. Pastikan URL & API Key sudah benar di file HTML
-- ============================================================
