-- ============================================
-- PAMUNGKAS - Master Data Seed Data
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Seed data untuk semua tabel master data
-- 2. Data contoh realistis untuk Indonesia
-- 3. Struktur hierarki unit kesehatan
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 02_master_data.sql
--
-- ⚠️ CATATAN:
-- - Data ini adalah CONTOH/DEMO
-- - Sesuaikan dengan data aktual organisasi Anda
-- ============================================

-- ============================================
-- HELPER FUNCTION UNTUK SEED DATA
-- ============================================

CREATE OR REPLACE FUNCTION seed_master_data()
RETURNS VOID AS $$
DECLARE
    v_dinkes_id UUID;
    v_uptd_id UUID;
    v_bidang_sdk_id UUID;
    v_bidang_sdk_id UUID;
BEGIN
    RAISE NOTICE '🌱 Memulai seeding master data...';
    
    -- ==========================================
    -- 1. SEED: UNITS (Unit Kerja/Organisasi)
    -- ==========================================
    
    RAISE NOTICE '   → Seeding units...';
    
    -- Level 0: Root Organization (Dinas Kesehatan)
    INSERT INTO public.units (code, name, unit_type, parent_id, level, address, district, regency, province, phone, email) VALUES
        ('DINKES-001', 'Dinas Kesehatan Kabupaten Sejahtera', 'DINKES', NULL, 0, 
         'Jl. Kesehatan No. 1', 'Kota Sejahtera', 'Kab. Sejahtera', 'Provinsi Sejahtera',
         '(021) 1234567', 'dinkes@sejahtera.go.id')
    ON CONFLICT (code) DO NOTHING;
    
    SELECT id INTO v_dinkes_id FROM public.units WHERE code = 'DINKES-001' LIMIT 1;
    
    -- Level 1: Bidang di Dinkes
    INSERT INTO public.units (code, name, unit_type, parent_id, level, description) VALUES
        ('BID-SDK', 'Bidang Sumber Daya Kesehatan', 'BIDANG', v_dinkes_id, 1, 'Pengelolaan SDM Kesehatan'),
        ('BID-UKM', 'Bidang Upaya Kesehatan Masyarakat', 'BIDANG', v_dinkes_id, 1, 'Pelayanan Kesehatan Masyarakat'),
        ('BID-P2P', 'Bidang Pencegahan dan Pengendalian Penyakit', 'BIDANG', v_dinkes_id, 1, 'Surveilans dan P2P')
    ON CONFLICT (code) DO NOTHING;
    
    SELECT id INTO v_bidang_sdk_id FROM public.units WHERE code = 'BID-SDK' LIMIT 1;
    
    -- Level 1: UPTD
    INSERT INTO public.units (code, name, unit_type, parent_id, level, address, district, phone) VALUES
        ('UPTD-001', 'UPTD Puskesmas Kabupaten Sejahtera', 'UPTD', v_dinkes_id, 1,
         'Jl. Puskesmas No. 5', 'Kota Sejahtera', '(021) 2345678')
    ON CONFLICT (code) DO NOTHING;
    
    SELECT id INTO v_uptd_id FROM public.units WHERE code = 'UPTD-001' LIMIT 1;
    
    -- Level 2: Puskesmas (child of UPTD)
    INSERT INTO public.units (code, name, unit_type, parent_id, level, address, village, district, phone, accreditation) VALUES
        ('PUS-001', 'Puskesmas Sejahtera I', 'PUSKESMAS', v_uptd_id, 2,
         'Jl. Merdeka No. 10', 'Kel. Sejahtera', 'Kec. Makmur', '(021) 3456789', 'Madya'),
        ('PUS-002', 'Puskesmas Sejahtera II', 'PUSKESMAS', v_uptd_id, 2,
         'Jl. Sudirman No. 25', 'Kel. Makmur', 'Kec. Sejahtera', '(021) 4567890', 'Utama'),
        ('PUS-003', 'Puskesmas Pembantu Desa Harapan', 'PUSKESMAS', v_uptd_id, 2,
         'Jl. Raya Desa Harapan', 'Desa Harapan', 'Kec. Asri', '(021) 5678901', 'Pratama')
    ON CONFLICT (code) DO NOTHING;
    
    -- Level 3: Pustu/Posyandu (child of Puskesmas)
    INSERT INTO public.units (code, name, unit_type, parent_id, level, address, village) VALUES
        ('PUSTU-001', 'Posyandu Melati', 'PUSKESMAS', 
         (SELECT id FROM public.units WHERE code = 'PUS-001'), 3,
         'RT 01/RW 03 Kel. Sejahtera', 'Kel. Sejahtera'),
        ('PUSTU-002', 'Posyandu Mawar', 'PUSKESMAS',
         (SELECT id FROM public.units WHERE code = 'PUS-001'), 3,
         'RT 05/RW 02 Kel. Sejahtera', 'Kel. Sejahtera'),
        ('PUSTU-003', 'Pustu Desa Harapan', 'PUSKESMAS',
         (SELECT id FROM public.units WHERE code = 'PUS-003'), 3,
         'Desa Harapan RT 001', 'Desa Harapan')
    ON CONFLICT (code) DO NOTHING;
    
    -- Contoh Rumah Sakit (langsung child Dinkes atau mandiri)
    INSERT INTO public.units (code, name, unit_type, parent_id, level, address, village, district, phone, bed_count, accreditation) VALUES
        ('RS-001', 'RSUD Kabupaten Sejahtera', 'RS_KELAS_B', v_dinkes_id, 1,
         'Jl. RS No. 100', 'Kel. Sejahtera', 'Kec. Kota', '(021) 6789012', 200, 'Paripurna'),
        ('KLINIK-001', 'Klinik Pratama Sehat Sejahtera', 'KLINIK_PRATAMA', NULL, 0,
         'Jl. Klinik No. 5', 'Kel. Makmur', 'Kec. Sejahtera', '(021) 7890123', NULL, NULL),
        ('APOTEK-001', 'Apotek Sejahtera Farma', 'APOTEK', NULL, 0,
         'Jl. Apotek No. 10', 'Kel. Sejahtera', 'Kec. Kota', '(021) 8901234', NULL, NULL)
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Units seeded (%)', (SELECT count(*) FROM public.units);
    
    -- ==========================================
    -- 2. SEED: PROFESSIONS (Jenis Tenaga Kesehatan)
    -- ==========================================
    
    RAISE NOTICE '   → Seeding professions...';
    
    INSERT INTO public.professions (code, name, short_name, category, group_type, sort_order, description, regulation_reference) VALUES
        -- Tenaga Medis (Nakes)
        ('DR', 'Dokter Umum', 'Dr.', 'Medis', 'Nakes', 1, 'Dokter umum/lengkap', 'UU Praktik Kedokteran'),
        ('DRSP', 'Dokter Spesialis', 'Dr.Sp.', 'Medis', 'Nakes', 2, 'Dokter dengan spesialisasi tertentu', 'Permenkes tentang Spesialis'),
        ('DG', 'Dokter Gigi', 'Drg.', 'Medis Gigi', 'Nakes', 3, 'Dokter gigi/spesialis gigi', 'UU Praktik Kedokteran Gigi'),
        
        -- Tenaga Keperawatan
        ('PR', 'Perawat', 'Pr.', 'Keperawatan', 'Nakes', 10, 'Tenaga keperawatan profesional', 'UU Keperawatan'),
        ('PRNS', 'Perawat Spesialis', 'Pr.Sp.', 'Keperawatan', 'Nakes', 11, 'Perawat dengan spesialisasi klinis', 'PPNI'),
        ('BD', 'Bidan', 'Bd.', 'Kebidanan', 'Nakes', 20, 'Tenaga kebidanan profesional', 'UU Kebidanan'),
        
        -- Tenaga Kefarmasian
        ('FF', 'Farmasi (Apotheker)', 'FF.', 'Kefarmasian', 'Nakes', 30, 'Apoteker profesional', 'UU Kefarmasian'),
        ('TTF', 'Tenaga Teknis Farmasi', 'TTF.', 'Kefarmasian', 'Nakes', 31, 'Asisten apotek/teknisi farmasi', 'Permenkes Nakes'),
        
        -- Tenaga Kesehatan Masyarakat
        ('TKM', 'Tenaga Kesehatan Masyarakat', 'TKM.', 'KesMas', 'Nakes', 40, 'Sanitarian/kesehatan masyarakat', 'Permenkes Nakes'),
        ('SAN', 'Sanitarian', 'San.', 'KesMas', 'Nakes', 41, 'Tenaga sanitarian lingkungan', 'Permenkes Nakes'),
        ('EPL', 'Epidemiolog Kesehatan', 'Epl.', 'KesMas', 'Nakes', 42, 'Tenaga epidemiolog', 'Permenkes Nakes'),
        
        -- Tenaga Gizi
        ('GZ', 'Ahli Gizi', 'Gz.', 'Gizi', 'Nakes', 50, 'Nutrisis/dietisien', 'UU Praktik Gizi'),
        ('TGG', 'Tenaga Gizi', 'TGG.', 'Gizi', 'Non-Nakes', 51, 'Ahli gizi terampil', 'Permenkes Nakes'),
        
        -- Tenaga Keterapian Fisik
        ('TF', 'Fisioterapis', 'FT.', 'Keterapian Fisik', 'Nakes', 60, 'Tenaga fisioterapi', 'Permenkes Nakes'),
        ('OKUP', 'Terapis Okupasi', 'TO.', 'Keterapian Fisik', 'Nakes', 61, 'Terapis okupasi', 'Permenkes Nakes'),
        ('TUMUM', 'Terapis Wicara', 'TW.', 'Keterapian Fisik', 'Nakes', 62, 'Terapis wicara/bahasa', 'Permenkes Nakes'),
        
        -- Tenaga Keteknisian Medis
        ('ELMED', 'Elektromedis', 'Elmed.', 'Teknis Medis', 'Nakes', 70, 'Teknisi elektromedikal', 'Permenkes Nakes'),
        ('RAD', 'Radiografer', 'Rad.', 'Teknis Medis', 'Nakes', 71, 'Teknisi radiologi', 'Permenkes Nakes'),
        
        -- Tenaga Laboratorium
        ('LAB', 'Analisis Kesehatan', 'Ak.', 'Laboratorium', 'Nakes', 80, 'Analis laboratorium medik', 'Permenkes Nakes'),
        ('TLM', 'Tenaga Teknologi Laboratorium Medik', 'TLM.', 'Laboratorium', 'Nakes', 81, 'Asisten laboratorium medik', 'Permenkes Nakes'),
        
        -- Tenaga Lainnya
        ('AKPR', 'Akupuntur Medis', 'Akpr.', 'Tradisional', 'Nakes', 90, 'Akupuntur terlatih', 'Permenkes Nakes'),
        ('REFRAKSIOLOGI', 'Refraksionis', 'Rfr.', 'Optometri', 'Non-Nakes', 91, 'Spesialis refraksi mata', 'Permenkes Nakes'),
        ('PODOLOGI', 'Podiatri/Podologis', 'Pod.', 'Kaki', 'Nakes', 92, 'Spesialis kaki dan pergelangan kaki', 'Permenkes Nakes'),
        ('HYGIENE', 'Tenaga Hygiene', 'Hgn.', 'Lingkungan', 'Non-Nakes', 93, 'Tenaga hygiene kerja dan kesehatan lingkungan', 'Permenkes Nakes'),
        
        -- Non-Nakes / Support
        ('ADM', 'Administrasi', 'Adm.', 'Admin', 'Non-Nakes', 100, 'Staf administrasi', NULL),
        ('IT', 'Teknologi Informasi', 'IT', 'IT', 'Non-Nakes', 101, 'Staf IT/support sistem', NULL),
        ('KEU', 'Keuangan', 'Keu.', 'Keuangan', 'Non-Nakes', 102, 'Staf keuangan/bendahara', NULL),
        ('BM', 'Pramubakti/Bidan Montiri', 'BM.', 'Support', 'Non-Nakes', 103, 'Tenaga pendukung pelayanan', NULL),
        ('SOPIR', 'Sopir Ambulans', 'Spr.', 'Support', 'Non-Nakes', 104, 'Sopir kendaraan dinas', NULL),
        ('OB', 'Office Boy/Girl', 'OB', 'Support', 'Non-Nakes', 105, 'Petugas kebersihan', NULL),
        ('LAINNYA', 'Lainnya', '-', 'Lainnya', 'Non-Nakes', 199, 'Tenaga lainnya yang belum terklasifikasi', NULL)
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Professions seeded (%)', (SELECT count(*) FROM public.professions);
    
    -- ==========================================
    -- 3. SEED: EDUCATION_LEVELS
    -- ==========================================
    
    RAISE NOTICE '   → Seeding education_levels...';
    
    INSERT INTO public.education_levels (code, name, name_formal, level, education_type, duration_years) VALUES
        -- Pendidikan Dasar
        ('SD', 'SD / Sederajat', 'Sekolah Dasar', 1, 'Formal', 6),
        ('MI', 'MI', 'Madrasah Ibtidaiyah', 1, 'Formal', 6),
        ('SMP', 'SMP / Sederajat', 'Sekolah Menengah Pertama', 2, 'Formal', 3),
        ('MTS', 'MTS', 'Madrasah Tsanawiyah', 2, 'Formal', 3),
        
        -- Pendidikan Menengah
        ('SMA', 'SMA / Sederajat', 'Sekolah Menengah Atas', 3, 'Formal', 3),
        ('SMK', 'SMK', 'Sekolah Menengah Kejuruan', 3, 'Formal', 3),
        ('MA', 'MA', 'Madrasah Aliyah', 3, 'Formal', 3),
        
        -- Pendidikan Tinggi - Diploma
        ('D1', 'Diploma I (Ahli Muda)', 'Program Diploma I', 4, 'Formal', 1),
        ('D2', 'Diploma II', 'Program Diploma II', 5, 'Formal', 2),
        ('D3', 'Diploma III (Ahli Madya)', 'Program Diploma III/Ahli Madya', 6, 'Formal', 3),
        ('D4', 'Diploma IV / Sarjana Terapan', 'Program Diploma IV/Sarjana Terapan', 7, 'Formal', 4),
        
        -- Pendidikan Tinggi - Sarjana & Pascasarjana
        ('S1', 'Sarjana (S1)', 'Program Sarjana/Strata Satu', 8, 'Formal', 4),
        ('S2', 'Magister (S2)', 'Program Magister/Strata Dua', 9, 'Formal', 2),
        ('S3', 'Doktor (S3)', 'Program Doktor/Striga Tiga', 10, 'Formal', 3),
        
        -- Pendidikan Profesional
        ('PROF', 'Profesi (Prof.)', 'Program Pendidikan Profesi', 11, 'Formal', 2),
        ('SPES-I', 'Spesialis I (Sp.I)', 'Program Pendidikan Spesialis I', 12, 'Formal', 3),
        ('SPES-II', 'Spesialis II (Sp.II)', 'Program Pendidikan Spesialis II', 13, 'Formal', 2),
        
        -- Non-Formal
        ('PAKET-A', 'Paket A (Setara SD)', 'Ujian Kesetaraan Paket A', 20, 'Non-Formal', NULL),
        ('PAKET-B', 'Paket B (Setara SMP)', 'Ujian Kesetaraan Paket B', 21, 'Non-Formal', NULL),
        ('PAKET-C', 'Paket C (Setara SMA)', 'Ujian Kesetaraan Paket C', 22, 'Non-Formal', NULL),
        ('KURSUS', 'Kursus/Pelatihan', 'Program Kursus/Pelatihan Singkat', 30, 'Non-Formal', NULL)
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Education levels seeded (%)', (SELECT count(*) FROM public.education_levels);
    
    -- ==========================================
    -- 4. SEED: EMPLOYMENT_STATUSES
    -- ==========================================
    
    RAISE NOTICE '   → Seeding employment_statuses...';
    
    INSERT INTO public.employment_statuses (code, name, status_type, category, has_benefits, color_hex, sort_order, description) VALUES
        -- ASN (Aparatur Sipil Negara)
        ('PNS', 'Pegawai Negeri Sipil (PNS)', 'PNS', 'ASN', TRUE, '#2563EB', 1, 'Pegawai Negeri Sipil dengan status tetap'),
        ('PPPK', 'Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)', 'PPPK', 'ASN', TRUE, '#059669', 2, 'Pegawai kontrak pemerintah dengan jaminan tertentu'),
        
        -- Non-ASN Pemerintah
        ('HONORER', 'Tenaga Honorer', 'HONORER', 'Non-ASN', FALSE, '#DC2626', 10, 'Tenaga honorer daerah/pusat (tidak ada jaminan pasti)'),
        ('KONTRAK', 'Pegawai Kontrak', 'KONTRAK', 'Non-ASN', FALSE, '#EA580C', 11, 'Pegawai kontrak dengan periode tertentu'),
        ('THL', 'Tenaga Harian Lepas (THL)', 'HONORER', 'Non-ASN', FALSE, '#B91C1C', 12, 'Dibayar harian sesuai kehadiran'),
        
        -- Swasta
        ('TETAP_SWASTA', 'Pegawai Tetap Swasta', 'TETAP_SWASTA', 'Swasta', TRUE, '#16A34A', 20, 'Karyawan tetap perusahaan swasta'),
        ('TD_SWASTA', 'Pegawai Tidak Tetap Swasta', 'TIDAK_TETAP_SWASTA', 'Swasta', FALSE, '#65A30D', 21, 'Karyawan kontrak/swasta tidak tetap'),
        
        -- Lainnya
        ('MAGANG', 'Peserta Magang', 'MAGANG', 'Lainnya', FALSE, '#8B5CF6', 30, 'Sedang menjalani masa magang'),
        ('SUKARELAWAN', 'Sukarelawan', 'SUKARELAWAN', 'Lainnya', FALSE, '#EC4899', 31, 'Bekerja secara sukarela/tidak dibayar'),
        ('PENSIUN', 'Pensiunan', 'PNS', 'ASN', TRUE, '#6B7280', 99, 'Sudah pensiun (data historis)'),
        ('LAINNYA', 'Status Lainnya', 'LAINNYA', 'Lainnya', FALSE, '#64748B', 100, 'Status kepegawaian lainnya')
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Employment statuses seeded (%)', (SELECT count(*) FROM public.employment_statuses);
    
    -- ==========================================
    -- 5. SEED: COMPETENCY_CATEGORIES
    -- ==========================================
    
    RAISE NOTICE '   → Seeding competency_categories...';
    
    INSERT INTO public.competency_categories (code, name, competency_type, domain, sort_order, description) VALUES
        -- Domain: Pengetahuan (Knowledge)
        ('KNOW-MEDIS', 'Pengetahuan Medis Klinis', 'Spesialis', 'Pengetahuan', 1, 'Pengetahuan dasar kedokteran klinis'),
        ('KNOW-KEP', 'Pengetahuan Keperawatan', 'Umum', 'Pengetahuan', 2, 'Teori dan konsep keperawatan'),
        ('KNOW-KESMAS', 'Pengetahuan Kesehatan Masyarakat', 'Umum', 'Pengetahuan', 3, 'Konsep kesmas dan promosi kesehatan'),
        ('KNOW-FARMASI', 'Pengetahuan Farmasi', 'Spesialis', 'Pengetahuan', 4, 'Farmakologi dan teknologi farmasi'),
        ('KNOW-GIZI', 'Pengetahuan Gizi', 'Spesialis', 'Pengetahuan', 5, 'Ilmu gizi dan dietetika'),
        ('KNOW-LAB', 'Pengetahuan Laboratorium', 'Spesialis', 'Pengetahuan', 6, 'Ilmu laboratorium medik'),
        
        -- Domain: Keterampilan (Skills)
        ('SKILL-KLINIS', 'Keterampilan Klinis', 'Klinis', 'Keterampilan', 10, 'Keterampilan tindakan medis/perawatan'),
        ('SKILL-PROSEDUR', 'Keterampilan Prosedur', 'Klinis', 'Keterampilan', 11, 'Keterampilan prosedur medis tertentu'),
        ('SKILL-KOMUNIKASI', 'Komunikasi Efektif', 'Manajerial', 'Keterampilan', 12, 'Komunikasi dengan pasien dan keluarga'),
        ('SKILL-MANAJEMEN', 'Manajemen Kasus', 'Manajerial', 'Keterampilan', 13, 'Manajemen kasus dan asuhan keperawatan'),
        ('SKILL-EDUKASI', 'Edukasi Kesehatan', 'Umum', 'Keterampilan', 14, 'Keterampilan edukasi pasien dan masyarakat'),
        ('SKILL-Teknis', 'Keterampilan Teknis', 'Teknis', 'Keterampilan', 15, 'Keterampilan operasional alat/sistem'),
        
        -- Domain: Sikap dan Perilaku (Attitude)
        ('ATT-ETIKA', 'Etika Profesi', 'Umum', 'Sikap', 20, 'Etika dan moral profesi kesehatan'),
        ('ATT-PELAYAN', 'Budaya Pelayanan Prima', 'Manajerial', 'Sikap', 21, 'Sikap pelayanan prima dan ramah'),
        ('ATT-KERJASAMA', 'Kerjasama Tim', 'Manajerial', 'Sikap', 22, 'Kemampuan bekerja dalam tim multidisiplin'),
        ('ATT-PEMBELAJAR', 'Pembelajar Berkelanjutan', 'Umum', 'Sikap', 23, 'Motivasi belajar dan pengembangan diri'),
        ('ATT-LEADERSHIP', 'Kepemimpinan', 'Manajerial', 'Sikap', 24, 'Kemampuan memimpin dan mengambil inisiatif'),
        
        -- Sub-kategori spesifik
        ('COMP-UKPP', 'Kompetensi UKPP (Upaya Kesehatan Perorangan)', 'Klinis', 'Pengetahuan', 30, 'Standar kompetensi UKPP'),
        ('COMP-UKBM', 'Kompetensi UKBM (Upaya Kesehatan Berbasis Masyarakat)', 'Umum', 'Pengetahuan', 31, 'Standar kompetensi UKBM'),
        ('COMP-UKPS', 'Kompetensi UKPS (Upaya Kesehatan Sarana)', 'Teknis', 'Pengetahuan', 32, 'Standar kompetensi sarana kesehatan'),
        ('COMP-Emergensi', 'Penanganan Emergensi', 'Klinis', 'Keterampilan', 33, 'Kompetensi penanganan darurat/emergensi')
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Competency categories seeded (%)', (SELECT count(*) FROM public.competency_categories);
    
    -- ==========================================
    -- 6. SEED: TRAINING_TYPES
    -- ==========================================
    
    RAISE NOTICE '   → Seeding training_types...';
    
    INSERT INTO public.training_types (code, name, category, sub_category, default_duration_hours, default_duration_days, produces_certificate, sort_order, description) VALUES
        -- Pelatihan Teknis
        ('TEKNIS-BASIC', 'Pelatihan Teknis Dasar', 'Pelatihan Teknis', 'Dasar', 40, 5, TRUE, 1, 'Pelatihan teknis dasar untuk tenaga baru'),
        ('TEKNIS-LANSUT', 'Pelatihan Teknis Lanjutan', 'Pelatihan Teknis', 'Lanjut', 80, 10, TRUE, 2, 'Pelatihan teknis tingkat lanjutan'),
        ('TEKNIS-Spesialis', 'Pelatihan Spesialisasi', 'Pelatihan Teknis', 'Spesialis', 160, 20, TRUE, 3, 'Pelatihan untuk spesialisasi tertentu'),
        
        -- Workshop/Seminar
        ('WS-INTERNAL', 'Workshop Internal', 'Workshop/Seminar', 'Internal', 8, 1, TRUE, 10, 'Workshop internal organisasi'),
        ('WS-EKSTERNAL', 'Workshop Eksternal', 'Workshop/Seminar', 'Eksternal', 16, 2, TRUE, 11, 'Workshop dari lembaga eksternal'),
        ('SEMINAR-ILMIAH', 'Seminar Ilmiah', 'Workshop/Seminar', 'Akademik', 6, 1, TRUE, 12, 'Seminar presentasi ilmiah'),
        
        -- Diklat
        ('DIKLAT-STRUKTURAL', 'Diklat Struktural', 'Diklat Struktural', 'Kepemimpinan', 200, 25, TRUE, 20, 'Diklat untuk jabatan struktural'),
        ('DIKLAT-FUNGSIONAL', 'Diklat Fungsional', 'Diklat Fungsional', 'Teknis', 160, 20, TRUE, 21, 'Diklat untuk jabatan fungsional'),
        ('DIKLAT-LEADERSHIP', 'Diklat Kepemimpinan', 'Diklat Struktural', 'Leadership', 120, 15, TRUE, 22, 'Diklat kepemimpinan dan manajemen'),
        
        -- Magang
        ('MAGANG-INTENSIIF', 'Magang Intensif', 'Magang', 'Full-time', 1440, 180, TRUE, 30, 'Program magang intensif (6 bulan)'),
        ('MAGANG-PARSIAL', 'Magang Parsial', 'Magang', 'Part-time', 480, 60, TRUE, 31, 'Program magang paruh waktu (3 bulan)'),
        ('MAGANG-OBSERVASI', 'Observasi Lapangan', 'Magang', 'Observasi', 40, 5, FALSE, 32, 'Program observasi singkat'),
        
        -- Simposium/Kongres
        ('SYMPOSIUM', 'Simposium Ilmiah', 'Simposium/Kongres', 'Regional', 24, 3, TRUE, 40, 'Simposium tingkat regional'),
        ('KONGRES', 'Kongres Nasional', 'Simposium/Kongres', 'Nasional', 32, 4, TRUE, 41, 'Kongres nasional'),
        ('WORKSHOP-INTERNASIONAL', 'Workshop Internasional', 'Simposium/Kongres', 'Internasional', 40, 5, TRUE, 42, 'Workshop/konferensi internasional'),
        
        -- E-Learning
        ('ELEARNING-MODUL', 'E-Learning Berbasis Modul', 'E-Learning', 'Self-paced', 30, NULL, TRUE, 50, 'Pembelajaran online modul mandiri'),
        ('ELEARNING-WEBINAR', 'Webinar (Online Seminar)', 'E-Learning', 'Live-online', 3, NULL, TRUE, 51, 'Seminar via web conference'),
        ('ELEARNING-BLENDED', 'Pembelajaran Campuran (Blended)', 'E-Learning', 'Blended', 60, 7, TRUE, 52, 'Kombinasi online dan tatap muka'),
        
        -- Lainnya
        ('ORIENTASI', 'Orientasi Pegawai Baru', 'Lainnya', 'Onboarding', 16, 2, TRUE, 60, 'Program orientasi pegawai baru'),
        ('INDUKSI', 'Induksi Kerja', 'Lainnya', 'Onboarding', 80, 10, TRUE, 61, 'Program induksi kerja terstruktur'),
        ('BREFING-TEKNIS', 'Brefing Teknis', 'Lainnya', 'Update', 4, NULL, FALSE, 62, 'Brefing teknis singkat')
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Training types seeded (%)', (SELECT count(*) FROM public.training_types);
    
    -- ==========================================
    -- 7. SEED: ACTIVITY_METHODS
    -- ==========================================
    
    RAISE NOTICE '   → Seeding activity_methods...';
    
    INSERT INTO public.activity_methods (code, name, method_type, requires_venue, requires_instructor, supports_group, sort_order, description) VALUES
        -- Offline Methods
        ('OFFLINE-KLASIKAL', 'Kelas/Tatap Muka Konvensional', 'Offline', TRUE, TRUE, TRUE, 1, 'Pembelajaran klasikal di ruang kelas'),
        ('OFFLINE-PRAKTIK', 'Praktik/Laboratorium', 'Offline', TRUE, TRUE, TRUE, 2, 'Praktikum di lab/ruang praktik'),
        ('OFFLINE-LAPANGAN', 'Praktek Lapangan', 'Offline', TRUE, TRUE, TRUE, 3, 'Pembelajaran di lapangan/tempat kerja nyata'),
        ('OFFLINE-SIMULASI', 'Simulasi/Roleplay', 'Offline', TRUE, TRUE, TRUE, 4, 'Latihan situasi dengan simulasi'),
        ('OFFLINE-KUNJUNGAN', 'Kunjungan/Studi Banding', 'Offline', TRUE, TRUE, TRUE, 5, 'Kunjungan ke tempat lain untuk belajar'),
        ('OFFLINE-MENTORING', 'Mentoring/Clinical Coaching', 'Offline', FALSE, TRUE, FALSE, 6, 'Bimbingan satu-satu dengan mentor'),
        
        -- Online Methods
        ('ONLINE-ASYNC', 'E-Learning Asinkron (Self-Paced)', 'Online', FALSE, FALSE, TRUE, 10, 'Modul online yang bisa diakses kapan saja'),
        ('ONLINE-SYNC', 'Webinar/Video Conference', 'Online', FALSE, TRUE, TRUE, 11, 'Siaran langsung via video conference'),
        ('ONLINE-HYBRID-FULL', 'Fully Online Hybrid', 'Online', FALSE, TRUE, TRUE, 12, 'Kombinasi async + sync fully online'),
        ('ONLINE-MICROLEARNING', 'Microlearning', 'Online', FALSE, FALSE, TRUE, 13, 'Konten pembelajaran singkat (5-10 menit)'),
        ('ONLINE-GAMIFICATION', 'Gamification Based Learning', 'Online', FALSE, FALSE, TRUE, 14, 'Pembelajaran berbasis game/points'),
        
        -- Blended Methods
        ('BLENDED-STANDARD', 'Blended Learning Standar', 'Blended', TRUE, TRUE, TRUE, 20, 'Kombinasi online + offline standar'),
        ('BLENDED-FLIPPED', 'Flipped Classroom', 'Blended', TRUE, TRUE, TRUE, 21, 'Belajar materi dulu, praktik di kelas'),
        ('BLENDED-ROTASI', 'Rotasi Stasiun', 'Blended', TRUE, TRUE, TRUE, 22, 'Berputar antar stasiun belajar'),
        ('BLENDED-FLEX', 'Flexible Blended', 'Blended', TRUE, TRUE, TRUE, 23, 'Model blended yang fleksibel'),
        
        -- Hybrid Methods
        ('HYBRID-SYNC', 'Hybrid Synchronous', 'Hybrid', TRUE, TRUE, TRUE, 30, 'Peserta bisa offline atau online bersamaan'),
        ('HYBRID-MIXED', 'Mixed Mode Delivery', 'Hybrid', TRUE, TRUE, TRUE, 31, 'Campuran peserta online dan offline')
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Activity methods seeded (%)', (SELECT count(*) FROM public.activity_methods);
    
    -- ==========================================
    -- 8. SEED: CERTIFICATE_TYPES
    -- ==========================================
    
    RAISE NOTICE '   → Seeding certificate_types...';
    
    INSERT INTO public.certificate_types (code, name, category, issuing_body, validity_period_months, is_permanent, sort_order, description) VALUES
        -- Sertifikasi Kompetensi
        ('CERT-UKOMPP', 'Sertifikat Kompetensi UKPP', 'Sertifikasi Kompetensi', 'LSP Kesehatan', 60, FALSE, 1, 'Sertifikat kompetensi Upaya Kesehatan Perorangan'),
        ('CERT-UKBM', 'Sertifikat Kompetensi UKBM', 'Sertifikasi Kompetensi', 'LSP Kesehatan', 60, FALSE, 2, 'Sertifikat kompetensi Upaya Kesehatan Berbasis Masyarakat'),
        ('CERT-UKPS', 'Sertifikat Kompetensi UKPS', 'Sertifikasi Kompetensi', 'LSP Kesehatan', 60, FALSE, 3, 'Sertifikat kompetensi Upaya Kesehatan Sarana'),
        ('CERT-ALS', 'Advanced Life Support (ALS)', 'Sertifikasi Kompetensi', 'PPDS/PPGD', 60, FALSE, 4, 'Sertifikat ALS untuk dokter/perawat'),
        ('CERT-BLS', 'Basic Life Support (BLS)', 'Sertifikasi Kompetensi', 'PMI/PPGD', 24, FALSE, 5, 'Sertifikat BLS resusitasi dasar'),
        ('CERT-ACLS', 'Advanced Cardiovascular Life Support', 'Sertifikasi Kompetensi', 'American Heart Assc', 24, FALSE, 6, 'Sertifikat ACLS'),
        ('CERT-NRP', 'NRP (Nomor Registrasi Perawat)', 'Registrasi', 'PPNI', 60, FALSE, 10, 'Nomor registrasi perawat aktif'),
        ('CERT-SIK', 'SIK (Surat Izin Kebidanan)', 'Registrasi', 'IBI', 60, FALSE, 11, 'Surat izan praktik bidan'),
        ('CERT-SIA', 'SIA (Surat Izin Apoteker)', 'Registrasi', 'PFI', 60, FALSE, 12, 'Surat izin praktik apoteker'),
        ('CERT-STR', 'STR (Surat Tanda Registrasi)', 'Registrasi', 'Kemenkes', 60, FALSE, 13, 'STR umum untuk tenaga kesehatan'),
        
        -- Lisensi
        ('LIS-SIP', 'SIP (Surat Izin Praktik)', 'Lisensi', 'Dinkes/Dinkes Prov', 60, FALSE, 20, 'Surat izin praktik di wilayah tertentu'),
        ('LIS-SIKA', 'SIKA (Surat Izin Kerja Apoteker)', 'Lisensi', 'Dinkes/Dinkes Prov', 60, FALSE, 21, 'Izin kerja apoteker'),
        ('LIS-SIPB', 'SIPB (Surat Izin Praktik Bidan)', 'Lisensi', 'Dinkes/Dinkes Prov', 60, FALSE, 22, 'Izin praktik bidan'),
        
        -- Sertifikat Digital
        ('DIGITAL-BADGE', 'Digital Badge/Micro-credential', 'Sertifikat Digital', 'Various Provider', 12, FALSE, 30, 'Badge digital untuk skill micro'),
        ('DIGITAL-COURSE', 'Sertifikat Penyelesaian Course Online', 'Sertifikat Digital', 'Platform E-learning', NULL, TRUE, 31, 'Sertifikat kursus e-learning'),
        
        -- Piagam/Penghargaan
        ('PIAGAM-PENGHARGAAN', 'Piagam Penghargaan', 'Piagam', 'Organisasi', NULL, TRUE, 40, 'Piagam penghargaan/prestasi'),
        ('PIAGAM-KEikutsertaan', 'Sertifikat Keikutsertaan', 'Piagam', 'Panitia', NULL, TRUE, 41, 'Sertifikat keikutsertaan kegiatan'),
        ('PIAGAM-PRESENTASI', 'Sertifikat Presenter/Pemakalah', 'Piagam', 'Panitia', NULL, TRUE, 42, 'Sertifikat sebagai pemakalah'),
        
        -- Akademik
        ('AKADEMIK-DIPLOMA', 'Ijazah Diploma', 'Akademik', 'PT', NULL, TRUE, 50, 'Ijazah pendidikan diploma'),
        ('AKADEMIK-SARJANA', 'Ijazah Sarjana (S1)', 'Akademik', 'PT', NULL, TRUE, 51, 'Ijazah sarjana'),
        ('AKADEMIK-MAGISTER', 'Ijazah Magister (S2)', 'Akademik', 'PT', NULL, TRUE, 52, 'Ijazah pascasarjana magister'),
        ('AKADEMIK-DOKTOR', 'Ijazah Doktor (S3)', 'Akademik', 'PT', NULL, TRUE, 53, 'Ijazah doktoral'),
        ('AKADEMIK-PROFESI', 'Ijazah Profesi', 'Akademik', 'PT', NULL, TRUE, 54, 'Ijazah pendidikan profesi'),
        ('AKADEMIK-SPESIALIS', 'Ijazah Spesialis', 'Akademik', 'PT', NULL, TRUE, 55, 'Ijazah pendidikan spesialis')
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE '      ✓ Certificate types seeded (%)', (SELECT count(*) FROM public.certificate_types);
    
    -- ==========================================
    -- SUMMARY
    -- ==========================================
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MASTER DATA SEED BERHASIL!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTE 'Ringkasan Data:';
    RAISE NOTE '- Units (Organisasi): %', (SELECT count(*) FROM public.units);
    RAISE NOTE '- Professions (Profesi): %', (SELECT count(*) FROM public.professions);
    RAISE NOTE '- Education Levels: %', (SELECT count(*) FROM public.education_levels);
    RAISE NOTE '- Employment Statuses: %', (SELECT count(*) FROM public.employment_statuses);
    RAISE NOTE '- Competency Categories: %', (SELECT count(*) FROM public.competency_categories);
    RAISE NOTE '- Training Types: %', (SELECT count(*) FROM public.training_types);
    RAISE NOTE '- Activity Methods: %', (SELECT count(*) FROM public.activity_methods);
    RAISE NOTE '- Certificate Types: %', (SELECT count(*) FROM public.certificate_types);
    RAISE NOTICE '';
END $$;

-- Execute the function
SELECT seed_master_data();

-- Cleanup function (optional - keep if you want to re-seed)
-- DROP FUNCTION IF EXISTS seed_master_data();
