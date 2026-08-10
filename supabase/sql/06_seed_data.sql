-- ============================================
-- PAMUNGKAS - Seed Data
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Data awal untuk testing/development
-- 2. Contoh organisasi/fasilitas kesehatan
-- 3. Contoh user administrator
-- 4. Data master referensi (provinsi)
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan TERAKHIR (setelah semua file lain)
-- 
-- PERHATIAN:
-- - File ini untuk development/testing saja
-- - Jangan jalankan di production tanpa review
-- - Sesuaikan data dengan kebutuhan organisasi Anda
-- ============================================

-- ============================================
-- 1. SEED DATA: PROVINSI INDONESIA
-- ============================================

-- Hapus data existing jika ada (untuk clean insert)
TRUNCATE TABLE public.provinces RESTART IDENTITY CASCADE;

INSERT INTO public.provinces (code, name) VALUES
    ('11', 'Aceh'),
    ('12', 'Sumatera Utara'),
    ('13', 'Sumatera Barat'),
    ('14', 'Riau'),
    ('15', 'Jambi'),
    ('16', 'Sumatera Selatan'),
    ('17', 'Bengkulu'),
    ('18', 'Lampung'),
    ('19', 'Kepulauan Bangka Belitung'),
    ('21', 'Kepulauan Riau'),
    ('31', 'DKI Jakarta'),
    ('32', 'Jawa Barat'),
    ('33', 'Jawa Tengah'),
    ('34', 'DI Yogyakarta'),
    ('35', 'Jawa Timur'),
    ('36', 'Banten'),
    ('51', 'Bali'),
    ('52', 'Nusa Tenggara Barat'),
    ('53', 'Nusa Tenggara Timur'),
    ('61', 'Kalimantan Barat'),
    ('62', 'Kalimantan Tengah'),
    ('63', 'Kalimantan Selatan'),
    ('64', 'Kalimantan Timur'),
    ('65', 'Kalimantan Utara'),
    ('71', 'Sulawesi Utara'),
    ('72', 'Sulawesi Tengah'),
    ('73', 'Sulawesi Selatan'),
    ('74', 'Sulawesi Tenggara'),
    ('75', 'Gorontalo'),
    ('76', 'Sulawesi Barat'),
    ('81', 'Maluku'),
    ('82', 'Maluku Utara'),
    ('91', 'Papua'),
    ('94', 'Papua Selatan'),
    ('93', 'Papua Pegunungan'),
    ('92', 'Papua Barat'),
    ('95', 'Papua Barat Daya');

DO $$
BEGIN
    RAISE NOTICE '✅ Seed provinsi berhasil: % records inserted', (SELECT COUNT(*) FROM provinces);
END $$;

-- ============================================
-- 2. SEED DATA: ORGANISASI CONTOH
-- ============================================

-- Insert contoh organisasi (sesuaikan dengan kebutuhan)
INSERT INTO public.organizations (code, name, type, address, city, province, phone, email) VALUES
    (
        'RS-PUSAT-001',
        'Rumah Sakit Umum Pusat Contoh',
        'RS Kelas B',
        'Jl. Kesehatan No. 1',
        'Jakarta Pusat',
        'DKI Jakarta',
        '021-12345678',
        'info@rspusatcontoh.go.id'
    ),
    (
        'PUSKESMAS-001',
        'Puskesmas Pembantu Sehat',
        'Puskesmas',
        'Jl. Masyarakat Sehat No. 10',
        'Jakarta Selatan',
        'DKI Jakarta',
        '021-87654321',
        'puskesmassehat@dinkes.go.id'
    ),
    (
        'KLINIK-001',
        'Klinik Pratama Sejahtera',
        'Klinik Pratama',
        'Jl. Raya Sejahtera No. 5',
        'Bandung',
        'Jawa Barat',
        '022-11223344',
        'info@kliniksejahtera.com'
    )
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Seed organisasi berhasil: % records inserted', 
        (SELECT COUNT(*) FROM organizations);
END $$;

-- ============================================
-- 3. SEED DATA: DEPARTEMEN CONTOH
-- ============================================

-- Ambil organization IDs yang baru di-insert
DO $$
DECLARE
    v_org_rs UUID;
    v_org_pus UUID;
BEGIN
    SELECT id INTO v_org_rs FROM organizations WHERE code = 'RS-PUSAT-001' LIMIT 1;
    SELECT id INTO v_org_pus FROM organizations WHERE code = 'PUSKESMAS-001' LIMIT 1;
    
    IF v_org_rs IS NOT NULL THEN
        INSERT INTO public.departments (organization_id, code, name, description) VALUES
            (v_org_rs, 'DIR', 'Direktur', 'Jajaran Direksi'),
            (v_org_rs, 'MEDIS', 'Instalasi Medis', 'Unit pelayanan medis'),
            (v_org_rs, 'NERS', 'Keperawatan', 'Unit keperawatan'),
            (v_org_rs, 'FARM', 'Farmasi', 'Unit farmasi'),
            (v_org_rs, 'LAB', 'Laboratorium', 'Unit laboratorium'),
            (v_org_rs, 'SDM', 'SDM & Pendidikan', 'Unit pengelolaan SDM')
        ON CONFLICT ON CONSTRAINT departments_org_code DO NOTHING;
    END IF;
    
    IF v_org_pus IS NOT NULL THEN
        INSERT INTO public.departments (organization_id, code, name, description) VALUES
            (v_org_pus, 'PUSTU', 'Pustu', 'Puskesmas Pembantu Kelurahan'),
            (v_org_pus, 'UKS', 'UKS', 'Usaha Kesehatan Sekolah'),
            (v_org_pus, 'GIZI', 'Gizi', 'Pos Gizi Masyarakat')
        ON CONFLICT ON CONSTRAINT departments_org_code DO NOTHING;
    END IF;
    
    RAISE NOTICE '✅ Seed departemen berhasil';
END $$;

-- ============================================
-- 4. SEED DATA: POSISI/JABATAN CONTOH
-- ============================================

INSERT INTO public.positions (code, name, description, category, level) VALUES
    ('DIREKTUR', 'Direktur RS', 'Kepala Rumah Sakit', 'Struktural', 1),
    ('WADIR', 'Wakil Direktur', 'Wakil Kepala Rumah Sakit', 'Struktural', 2),
    ('KABAG', 'Kepala Bagian', 'Kepala unit/bagian', 'Struktural', 3),
    ('DOKTER-UMUM', 'Dokter Umum', 'Dokter umum', 'Fungsional', 4),
    ('DOKTER-SPESIALIS', 'Dokter Spesialis', 'Dokter spesialis', 'Fungsional', 4),
    ('PERAWAT', 'Perawat', 'Tenaga perawat', 'Fungsional', 5),
    ('BIDAN', 'Bidan', 'Tenaga bidan', 'Fungsional', 5),
    ('FARMASI', 'Tenaga Farmasi', 'Apoteker/Asisten Apoteker', 'Fungsional', 5),
    ('ANALIS', 'Analis Laboratorium', 'Tenaga laboratorium', 'Fungsional', 5),
    ('SANITARIAN', 'Sanitarian', 'Tenaga kesehatan lingkungan', 'Fungsional', 5),
    ('GIZI', 'Ahli Gizi', 'Nutritionist/Dietisien', 'Fungsional', 5),
    ('ADMIN', 'Administrasi', 'Staf administrasi', 'Umum', 6),
    ('OPERATOR', 'Operator Data', 'Entry data', 'Umum', 7)
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Seed posisi/jabatan berhasil: % records inserted', 
        (SELECT COUNT(*) FROM positions);
END $$;

-- ============================================
-- 5. SEED DATA: JENIS SERTIFIKASI CONTOH
-- ============================================

INSERT INTO public.certification_types (code, name, description, issuing_body, validity_period_months, category) VALUES
    ('STR-DOKTER', 'Surat Tanda Registrasi Dokter', 'Registrasi dokter', 'KKI', 60, 'Registrasi Profesi'),
    ('STR-PERAWAT', 'Surat Tanda Registrasi Perawat', 'Registrasi perawat', 'PPNI', 60, 'Registrasi Profesi'),
    ('STR-BIDAN', 'Surat Tanda Registrasi Bidan', 'Registrasi bidan', 'IBI', 60, 'Registrasi Profesi'),
    ('SIP', 'Surat Izin Praktik', 'Izin praktik di fasilitas kesehatan', 'Dinas Kesehatan', 36, 'Lisensi Praktik'),
    ('ALSIN', 'Angka Kredit Luar Jabatan Fungsional', 'Poin pengembangan profesi', 'Kemenkes', NULL, 'Kompetensi'),
    ('BLS', 'Basic Life Support', 'Penanganan darurat dasar', 'Organisasi Resmi', 24, 'Pelatihan Wajib'),
    ('ACLS', 'Advanced Cardiovascular Life Support', 'Penanganan jantung darurat lanjutan', 'AHA/PPDS', 24, 'Pelatihan Spesialis'),
    ('HIPAA', 'Pelatihan Etik Kedokteran', 'Etika dan hukum kedokteran', 'IDI/Rumah Sakit', NULL, 'Pelatihan Wajib')
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Seed jenis sertifikasi berhasil: % records inserted', 
        (SELECT COUNT(*) FROM certification_types);
END $$;

-- ============================================
-- 6. SEED DATA: JENIS PELATIHAN CONTOH
-- ============================================

INSERT INTO public.training_types (code, name, description, category, default_duration_hours) VALUES
    ('DIKLAT-PIM', 'Diklat Kepemimpinan Manajerial', 'Pelatihan manajemen dan kepemimpinan', 'Diklat Struktural', 40),
    ('WORKSHOP-KLINIS', 'Workshop Klinis', 'Pelatihan peningkatan skill klinis', 'Pelatihan Teknis', 16),
    ('SEMINAR-ILMIAH', 'Seminar Ilmiah', 'Kegiatan ilmiah dan presentasi', 'Simposium/Kongres', 8),
    ('E-LEARNING', 'E-Learning / Online Course', 'Pelatihan berbasis online', 'E-Learning', 20),
    ('MAGANG', 'Program Magang', 'Magang di institusi mitra', 'Magang', 480),
    ('SIMPOSIUM', 'Simposium Medis', 'Kumpulan ilmiah bidang kesehatan', 'Simposium/Kongres', 12),
    ('BLETING', 'Bletting / Orientasi', 'Orientasi pegawai baru', 'Lainnya', 8)
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Seed jenis pelatihan berhasil: % records inserted', 
        (SELECT COUNT(*) FROM training_types);
END $$;

-- ============================================
-- 7. INSTRUCTIONS FOR FIRST ADMIN USER
-- ============================================

/*
 * CARA MEMBUAT ADMIN USER PERTAMA:
 * ================================
 * 
 * Opsi 1: Melalui Supabase Dashboard Authentication
 * -------------------------------------------------
 * 1. Buka Supabase Dashboard > Authentication > Users
 * 2. Klik "Add user" > "Create new user"
 * 3. Masukkan email admin (contoh: admin@pamungkas.go.id)
 * 4. Set password yang kuat
 * 5. Klik "Add user"
 * 
 * Opsi 2: Melalui SQL (setelah user dibuat di auth.users)
 * ----------------------------------------------------------------
 * -- Update role user menjadi super_admin:
 * UPDATE user_profiles up
 * SET role_id = (SELECT id FROM roles WHERE name = 'super_admin')
 * FROM auth.users au
 * WHERE up.user_id = au.id
 * AND au.email = 'admin@pamungkas.go.id';
 * 
 * Opsi 3: Menggunakan Signup dari Aplikasi (jika fitur registration aktif)
 * --------------------------------------------------------------------------------
 * - Aktifkan FEATURES.REGISTRATION = true di config.js
 * - Register melalui halaman login
 * - Lalu update role manual via SQL seperti opsi 2
 */

-- ============================================
-- VERIFIKASI AKHIR
-- ============================================

DO $$
DECLARE
    v_provinces INTEGER;
    v_organizations INTEGER;
    v_departments INTEGER;
    v_positions INTEGER;
    v_cert_types INTEGER;
    v_training_types INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_provinces FROM provinces;
    SELECT COUNT(*) INTO v_organizations FROM organizations;
    SELECT COUNT(*) INTO v_departments FROM departments;
    SELECT COUNT(*) INTO v_positions FROM positions;
    SELECT COUNT(*) INTO v_cert_types FROM certification_types;
    SELECT COUNT(*) INTO v_training_types FROM training_types;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  PAMUNGKAS - SEED DATA COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  Provinsi: %', v_provinces;
    RAISE NOTICE '  Organisasi: %', v_organizations;
    RAISE NOTICE '  Departemen: %', v_departments;
    RAISE NOTICE '  Posisi/Jabatan: %', v_positions;
    RAISE NOTICE '  Jenis Sertifikasi: %', v_cert_types;
    RAISE NOTICE '  Jenis Pelatihan: %', v_training_types;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  LANGKAH SELANJUTNYA:';
    RAISE NOTICE '   1. Buat user admin pertama via Supabase Auth';
    RAISE NOTICE '   2. Update role user menjadi super_admin';
    RAISE NOTICE '   3. Update config.js dengan credentials Supabase Anda';
    RAISE NOTICE '   4. Deploy ke GitHub Pages';
    RAISE NOTICE '========================================';
END $$;
