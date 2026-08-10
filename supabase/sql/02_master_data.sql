-- ============================================
-- PAMUNGKAS - Master Data Schema (Enhanced)
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Tabel UNITS (Organisasi Kesehatan dengan hierarki parent-child)
-- 2. Tabel PROFESSIONS (Jenis Tenaga Kesehatan)
-- 3. Tabel EDUCATION_LEVELS (Tingkat Pendidikan)
-- 4. Tabel EMPLOYMENT_STATUSES (Status Kepegawaian)
-- 5. Tabel COMPETENCY_CATEGORIES (Kategori Kompetensi)
-- 6. Tabel TRAINING_TYPES (Jenis Pelatihan)
-- 7. Tabel ACTIVITY_METHODS (Metode Pelaksanaan)
-- 8. Tabel CERTIFICATE_TYPES (Jenis Sertifikat)
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 01_auth_users_roles.sql
--          Jalankan SETELAH 07_permissions_schema.sql
--
-- ⚠️ PENTING:
-- - Menggunakan SOFT DELETE (is_active = false)
-- - Jangan DELETE data yang sudah direferensikan transaksi
-- - Semua tabel memiliki RLS enabled
-- ============================================

-- ============================================
-- DROP TABLES JIKA PERLU RE-CREATE (HATAT-HATI!)
-- ============================================

-- Uncomment baris di bawah jika perlu recreate dari awal
-- DROP TABLE IF EXISTS public.certificate_types CASCADE;
-- DROP TABLE IF EXISTS public.activity_methods CASCADE;
-- DROP TABLE IF EXISTS public.training_types CASCADE;
-- DROP TABLE IF EXISTS public.competency_categories CASCADE;
-- DROP TABLE IF EXISTS public.employment_statuses CASCADE;
-- DROP TABLE IF EXISTS public.education_levels CASCADE;
-- DROP TABLE IF EXISTS public.professions CASCADE;
-- DROP TABLE IF EXISTS public.units CASCADE;

-- ============================================
-- 1. ENUM TYPES UNTUK MASTER DATA
-- ============================================

-- Jenis Unit/Organisasi Kesehatan
CREATE TYPE unit_type AS ENUM (
    'DINKES',           -- Dinas Kesehatan
    'BIDANG',           -- Bidang/Tim Kerja
    'UPTD',             -- UPTD Puskesmas
    'PUSKESMAS',        -- Puskesmas
    'RS_KELAS_A',       -- Rumah Sakit Kelas A
    'RS_KELAS_B',       -- Rumah Sakit Kelas B
    'RS_KELAS_C',       -- Rumah Sakit Kelas C
    'RS_KELAS_D',       -- Rumah Sakit Kelas D
    'RS_PRATAMA',       -- Rumah Sakit Pratama
    'KLINIK_PRATAMA',   -- Klinik Pratama
    'KLINIK_UTAMA',     -- Klinik Utama
    'APOTEK',           -- Apotek
    'LABKES',           -- Laboratorium Kesehatan
    'PRAKTEK_MANDIRI',  -- Praktek Mandiri
    'FASYANKES_LAIN',   -- Fasilitas Kesehatan Lainnya
    'Kantor_Pusat'      -- Kantor Pusat/Regional
);
COMMENT ON TYPE unit_type IS 'Jenis unit organisasi kesehatan';

-- Status Kepegawaian
CREATE TYPE employment_status_type AS ENUM (
    'PNS',              -- Pegawai Negeri Sipil
    'PPPK',             -- Pegawai Pemerintah dengan Perjanjian Kerja
    'HONORER',         -- Tenaga Honorer
    'KONTRAK',         -- Pegawai Kontrak
    'TETAP_SWASTA',    -- Pegawai Tetap Swasta
    'TIDAK_TETAP_SWASTA', -- Pegawai Tidak Tetap Swasta
    'MAGANG',           -- Magang
    'SUKARELAWAN',      -- Sukarelawan
    'LAINNYA'           -- Lainnya
);
COMMENT ON TYPE employment_status_type IS 'Status kepegawaian tenaga kesehatan';

-- ============================================
-- 2. TABEL: UNITS (Unit Kerja / Organisasi Kesehatan)
-- ============================================
-- Struktur HIERARKIS (Parent-Child):
-- 
-- Contoh Struktur:
-- Dinkes Kab. X (parent_id = NULL)
-- ├── Bidang SDK (parent_id = Dinkes)
-- │   ├── Sub Bidang Upaya Kesehatan Masyarakat
-- │   └── Sub Bidang Sumber Daya Kesehatan
-- └── UPTD Puskesmas (parent_id = Dinkes)
--     ├── Puskesmas A (parent_id = UPTD)
--     │   └── Pustu/Posyandu (parent_id = Puskesmas A)
--     └── Puskesmas B

CREATE TABLE IF NOT EXISTS public.units (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas Unit
    code VARCHAR(50) UNIQUE NOT NULL,           -- Kode unik (auto-generated atau manual)
    name VARCHAR(255) NOT NULL,                -- Nama unit
    
    -- Jenis Unit
    unit_type unit_type NOT NULL DEFAULT 'PUSKESMAS',
    
    -- Hierarki Parent-Child
    parent_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    
    -- Level kedalaman (untuk query performance)
    level INTEGER DEFAULT 0,                    -- 0 = root, 1 = child, dst.
    
    -- Path materialized (untuk tree query cepat)
    path TEXT DEFAULT '',                       -- "/uuid1/uuid2/uuid3"
    
    -- Alamat Lengkap
    address TEXT,
    village VARCHAR(100),                       -- Desa/Kelurahan
    district VARCHAR(100),                      -- Kecamatan
    regency VARCHAR(100),                       -- Kabupaten/Kota
    province VARCHAR(100),                      -- Provinsi
    postal_code VARCHAR(10),
    
    -- Koordinat GPS (opsional, untuk peta)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Kontak
    phone VARCHAR(30),
    email VARCHAR(150),
    website VARCHAR(200),
    
    -- Kepala Unit (foreign key ke profiles nanti)
    head_name VARCHAR(200),
    head_nip VARCHAR(18),
    
    -- Kapasitas & Fasilitas (metadata)
    employee_count INTEGER DEFAULT 0,           -- Jumlah pegawai (cached)
    bed_count INTEGER,                         -- Jumlah tempat tidur (untuk RS)
    accreditation VARCHAR(50),                  -- Akreditasi (Paripurna, Utama, Madya, dll)
    
    -- Status Aktif (SOFT DELETE!)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata tambahan
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.units IS 'Master data unit kerja/organisasi kesehatan dengan struktur hierarkis';
COMMENT ON COLUMN public.units.code IS 'Kode unik unit (contoh: DINKES-001, PUS-001)';
COMMENT ON COLUMN public.units.parent_id IS 'Parent unit untuk struktur hierarki';
COMMENT ON COLUMN public.units.level IS 'Level kedalaman dalam tree (root=0)';
COMMENT ON COLUMN public.units.path IS 'Path untuk tree query optimisasi';
COMMENT ON COLUMN public.units.is_active IS 'SOFT DELETE: set false untuk menonaktifkan';

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(code);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON public.units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_parent_id ON public.units(parent_id);
CREATE INDEX IF NOT EXISTS idx_units_level ON public.units(level);
CREATE INDEX IF NOT EXISTS idx_units_is_active ON public.units(is_active);
CREATE INDEX IF NOT EXISTS idx_units_path ON public.units(path);
CREATE INDEX IF NOT EXISTS idx_units_district ON public.units(district);
CREATE INDEX IF NOT EXISTS idx_units_regency ON public.units(regency);

-- Trigger untuk updated_at
CREATE TRIGGER on_units_updated
    BEFORE UPDATE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function untuk auto-update path saat insert/update
CREATE OR REPLACE FUNCTION update_unit_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := '/' || NEW.id::TEXT;
        NEW.level := 0;
    ELSE
        SELECT '/' || COALESCE(path, '') || NEW.id::TEXT, level + 1
        INTO NEW.path, NEW.level
        FROM units WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_units_path_update
    BEFORE INSERT OR UPDATE OF parent_id ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION update_unit_path();

-- Recursive CTE Helper untuk mendapatkan semua descendants
CREATE OR REPLACE FUNCTION get_unit_descendants(p_unit_id UUID)
RETURNS TABLE(id UUID, code VARCHAR, name VARCHAR, level INT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE unit_tree AS (
        -- Base case: direct children
        SELECT id, code, name, level, id as root_id
        FROM units WHERE parent_id = p_unit_id AND is_active = TRUE
        
        UNION ALL
        
        -- Recursive case: children of children
        SELECT u.id, u.code, u.name, u.level, ut.root_id
        FROM units u
        INNER JOIN unit_tree ut ON u.parent_id = ut.id
        WHERE u.is_active = TRUE
    )
    SELECT id, code, name, level FROM unit_tree;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 3. TABEL: PROFESSIONS (Jenis Tenaga Kesehatan)
-- ============================================
-- Sesuai regulasi Permenkes tentang Nakes

CREATE TABLE IF NOT EXISTS public.professions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas Profesi
    code VARCHAR(20) UNIQUE NOT NULL,            -- Kode profesi (DR, PR, BD, dll)
    name VARCHAR(200) NOT NULL,                 -- Nama lengkap profesi
    short_name VARCHAR(50),                     -- Nama singkat
    
    -- Klasifikasi
    category VARCHAR(100),                      -- Medis, Keperawatan, Kefarmasian, dll
    group_type VARCHAR(50),                     -- Nakes, Non-Nakes, Support
    
    -- Regulasi terkait
    regulation_reference VARCHAR(200),          -- Referensi regulasi (UU/Permenkes)
    education_required VARCHAR(100),            -- Pendidikan minimal wajib
    
    -- Urutan/tampilan
    sort_order INTEGER DEFAULT 0,
    
    -- Deskripsi
    description TEXT,
    
    -- Status Aktif (SOFT DELETE!)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.professions IS 'Master data jenis profesi/tenaga kesehatan sesuai regulasi';
COMMENT ON COLUMN public.professions.code IS 'Kode profesi singkat (DR, PR, BD, FF, GM, dll)';
COMMENT ON COLUMN public.professions.category IS 'Kategori: Medis, Keperawatan, Kefarmasian, Teknis, dll';
COMMENT ON COLUMN public.professions.group_type IS 'Grup: Nakes (Tenaga Kesehatan), Non-Nakes, Support';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_professions_code ON public.professions(code);
CREATE INDEX IF NOT EXISTS idx_professions_category ON public.professions(category);
CREATE INDEX IF NOT EXISTS idx_professions_active ON public.professions(is_active);

-- Trigger
CREATE TRIGGER on_professions_updated
    BEFORE UPDATE ON public.professions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. TABEL: EDUCATION_LEVELS (Tingkat Pendidikan)
-- ============================================

CREATE TABLE IF NOT EXISTS public.education_levels (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas
    code VARCHAR(20) UNIQUE NOT NULL,            -- Kode (SD, SMP, SMA, D3, S1, dll)
    name VARCHAR(100) NOT NULL,                 -- Nama lengkap
    name_formal VARCHAR(200),                   -- Nama formal/resmi
    
    -- Level/Pangkat
    level INTEGER NOT NULL,                      -- Urutan (SD=1, SMP=2, ..., S3=11)
    
    -- Jenis
    education_type VARCHAR(50) DEFAULT 'Formal', -- Formal, Non-Formal, Informal
    
    -- Durasi normal (tahun)
    duration_years INTEGER,
    
    -- Setara
    equivalent_to VARCHAR(100),                  -- Setara dengan jenjang lain
    
    -- Deskripsi
    description TEXT,
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.education_levels IS 'Master data tingkat/jenjang pendidikan';
COMMENT ON COLUMN public.education_levels.code IS 'Kode: SD, SMP, SMA, D1-D4, S1, S2, S3';
COMMENT ON COLUMN public.education_levels.level IS 'Urutan numerik untuk sorting';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edu_levels_code ON public.education_levels(code);
CREATE INDEX IF NOT EXISTS idx_edu_levels_level ON public.education_levels(level);
CREATE INDEX IF NOT EXISTS idx_edu_levels_active ON public.education_levels(is_active);

-- Trigger
CREATE TRIGGER on_education_levels_updated
    BEFORE UPDATE ON public.education_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TABEL: EMPLOYMENT_STATUSES (Status Kepegawaian)
-- ============================================

CREATE TABLE IF NOT EXISTS public.employment_statuses (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas
    code VARCHAR(20) UNIQUE NOT NULL,            -- Kode status
    name VARCHAR(100) NOT NULL,                 -- Nama status
    description TEXT,
    
    -- Enum value (menggunakan enum type)
    status_type employment_status_type NOT NULL,
    
    -- Klasifikasi
    category VARCHAR(50),                       -- ASN, Non-ASN, Swasta
    has_benefits BOOLEAN DEFAULT FALSE,         -- Apakah ada tunjangan/benefit
    
    -- Warna untuk UI (opsional)
    color_hex VARCHAR(7),                      -- Warna tampilan (#FF5722)
    
    -- Urutan
    sort_order INTEGER DEFAULT 0,
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.employment_statuses IS 'Master data status kepegawaian/kerja';
COMMENT ON COLUMN public.employment_statuses.status_type IS 'Tipe status menggunakan enum employment_status_type';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emp_status_code ON public.employment_statuses(code);
CREATE INDEX IF NOT EXISTS idx_emp_status_type ON public.employment_statuses(status_type);
CREATE INDEX IF NOT EXISTS idx_emp_status_active ON public.employment_statuses(is_active);

-- Trigger
CREATE TRIGGER on_employment_statuses_updated
    BEFORE UPDATE ON public.employment_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. TABEL: COMPETENCY_CATEGORIES (Kategori Kompetensi)
-- ============================================

CREATE TABLE IF NOT EXISTS public.competency_categories (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas
    code VARCHAR(30) UNIQUE NOT NULL,            -- Kode kategori
    name VARCHAR(200) NOT NULL,                 -- Nama kategori
    description TEXT,
    
    -- Parent Category (jika sub-kategori)
    parent_id UUID REFERENCES public.competency_categories(id) ON DELETE SET NULL,
    
    -- Jenis Kompetensi
    competency_type VARCHAR(50) DEFAULT 'Umum', -- Umum, Spesialis, Klinis, Manajerial, Teknis
    
    -- Domain (berdasarkan kompetensi SDMK)
    domain VARCHAR(50),                         -- Pengetahuan, Keterampilan, Sikap/Perilaku
    
    -- Standar referensi
    standard_ref VARCHAR(100),                  -- UKPP, UKNPP, dll
    
    -- Urutan
    sort_order INTEGER DEFAULT 0,
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.competency_categories IS 'Master data kategori kompetensi SDM kesehatan';
COMMENT ON COLUMN public.competency_categories.competency_type IS 'Tipe: Umum, Spesialis, Klinis, Manajerial, Teknis';
COMMENT ON COLUMN public.competency_categories.domain IS 'Domain: Knowledge, Skills, Attitude';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comp_cat_code ON public.competency_categories(code);
CREATE INDEX IF NOT EXISTS idx_comp_cat_type ON public.competency_categories(competency_type);
CREATE INDEX IF NOT EXISTS idx_comp_cat_parent ON public.competency_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_comp_cat_active ON public.competency_categories(is_active);

-- Trigger
CREATE TRIGGER on_competency_categories_updated
    BEFORE UPDATE ON public.competency_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TABEL: TRAINING_TYPES (Jenis Program Pelatihan)
-- ============================================

CREATE TABLE IF NOT EXISTS public.training_types (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas
    code VARCHAR(30) UNIQUE NOT NULL,            -- Kode jenis pelatihan
    name VARCHAR(200) NOT NULL,                 -- Nama pelatihan
    description TEXT,
    
    -- Kategori
    category VARCHAR(100) NOT NULL,              -- Pelatihan Teknis, Workshop, Diklat, dll
    
    -- Sub-kategori
    sub_category VARCHAR(100),
    
    -- Detail pelatihan
    default_duration_hours INTEGER,             -- Durasi default (jam)
    default_duration_days INTEGER,               -- Durasi default (hari)
    min_participants INTEGER DEFAULT 1,          -- Minimal peserta
    max_participants INTEGER,                    -- Maksimal peserta
    
    -- Penyelenggara default
    organizer_default VARCHAR(200),              -- Penyelenggara default
    
    -- Sertifikasi yang dihasilkan
    produces_certificate BOOLEAN DEFAULT FALSE,
    certificate_type_id UUID,                    -- FK ke certificate_types
    
    -- Urutan
    sort_order INTEGER DEFAULT 0,
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.training_types IS 'Master data jenis program pelatihan/diklat/pengembangan';
COMMENT ON COLUMN public.training_types.category IS 'Kategori: Pelatihan Teknis, Workshop/Seminar, Diklat Struktural, Diklat Fungsional, Magang, E-Learning';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_types_code ON public.training_types(code);
CREATE INDEX IF NOT EXISTS idx_training_types_category ON public.training_types(category);
CREATE INDEX IF NOT EXISTS idx_training_types_active ON public.training_types(is_active);

-- Trigger
CREATE TRIGGER on_training_types_updated
    BEFORE UPDATE ON public.training_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. TABEL: ACTIVITY_METHODS (Metode Pelaksanaan Aktivitas)
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_methods (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas
    code VARCHAR(30) UNIQUE NOT NULL,            -- Kode metode
    name VARCHAR(200) NOT NULL,                 -- Nama metode
    description TEXT,
    
    -- Kategori metode
    method_type VARCHAR(50) DEFAULT 'Offline',  -- Offline, Online, Blended, Hybrid
    
    -- Detail pelaksanaan
    requires_venue BOOLEAN DEFAULT TRUE,        -- Butuh tempat/fasilitas
    requires_instructor BOOLEAN DEFAULT TRUE,    -- Butuh instruktur/pengajar
    supports_group BOOLEAN DEFAULT TRUE,        -- Mendukung kelompok
    max_online_participants INTEGER,            -- Maks peserta online (NULL = unlimited)
    
    -- Platform (jika online/blended)
    platform VARCHAR(100),                      -- Zoom, Teams, Google Meet, LMS, dll
    
    -- Urutan
    sort_order INTEGER DEFAULT 0,
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.activity_methods IS 'Master data metode pelaksanaan aktivitas/pelatihan';
COMMENT ON COLUMN public.activity_methods.method_type IS 'Tipe: Offline, Online, Blended, Hybrid';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_act_methods_code ON public.activity_methods(code);
CREATE INDEX IF NOT EXISTS idx_act_methods_type ON public.activity_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_act_methods_active ON public.activity_methods(is_active);

-- Trigger
CREATE TRIGGER on_activity_methods_updated
    BEFORE UPDATE ON public.activity_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. TABEL: CERTIFICATE_TYPES (Jenis Sertifikat)
-- ============================================

CREATE TABLE IF NOT EXISTS public.certificate_types (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas
    code VARCHAR(30) UNIQUE NOT NULL,            -- Kode sertifikat
    name VARCHAR(200) NOT NULL,                 -- Nama sertifikat
    description TEXT,
    
    -- Kategori
    category VARCHAR(100) NOT NULL,              -- Kompetensi, Lisensi, Sertifikasi, Piagam, dll
    
    -- Lembaga penerbit (jika spesifik)
    issuing_body VARCHAR(200),                  -- Lembaga yang berwenang menerbitkan
    
    -- Masa berlaku
    validity_period_months INTEGER,              -- Bulan berlaku (NULL = permanent/selamanya)
    validity_period_years INTEGER,               -- Tahun berlaku (alternatif)
    is_permanent BOOLEAN DEFAULT FALSE,          -- True = tidak ada masa expired
    
    -- Persyaratan
    requirements JSONB DEFAULT '[]',             -- Array persyaratan [{type, description}]
    
    -- Template/Format
    template_url TEXT,                          -- URL template file (PDF/docx)
    
    -- Urutan
    sort_order INTEGER DEFAULT 0,
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.certificate_types IS 'Master data jenis sertifikat/kompetensi/lisensi';
COMMENT ON COLUMN public.certificate_types.category IS 'Kategori: Sertifikasi Kompetensi, Registrasi, Lisensi, Sertifikat Digital, Piagam, dll';
COMMENT ON COLUMN public.certificate_types.validity_period_months IS 'Masa berlaku dalam bulan (NULL/permanent = selamanya)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cert_types_code ON public.certificate_types(code);
CREATE INDEX IF NOT EXISTS idx_cert_types_category ON public.certificate_types(category);
CREATE INDEX IF NOT EXISTS idx_cert_types_active ON public.certificate_types(is_active);

-- Trigger
CREATE TRIGGER on_certificate_types_updated
    BEFORE UPDATE ON public.certificate_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFIKASI AKHIR
-- ============================================

SELECT 
    'units' as table_name, count(*) as row_count 
FROM public.units
UNION ALL
SELECT 
    'professions' as table_name, count(*) 
FROM public.professions
UNION ALL
SELECT 
    'education_levels' as table_name, count(*) 
FROM public.education_levels
UNION ALL
SELECT 
    'employment_statuses' as table_name, count(*) 
FROM public.employment_statuses
UNION ALL
SELECT 
    'competency_categories' as table_name, count(*) 
FROM public.competency_categories
UNION ALL
SELECT 
    'training_types' as table_name, count(*) 
FROM public.training_types
UNION ALL
SELECT 
    'activity_methods' as table_name, count(*) 
FROM public.activity_methods
UNION ALL
SELECT 
    'certificate_types' as table_name, count(*) 
FROM public.certificate_types;

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MASTER DATA SCHEMA BERHASIL DIBUAT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabel Master Data:';
    RAISE NOTICE '  1. units                - Organisasi/Unit Kerja (hierarkis)';
    RAISE NOTICE '  2. professions           - Jenis Tenaga Kesehatan';
    RAISE NOTICE '  3. education_levels      - Tingkat Pendidikan';
    RAISE NOTICE '  4. employment_statuses   - Status Kepegawaian';
    RAISE NOTICE '  5. competency_categories - Kategori Kompetensi';
    RAISE NOTICE '  6. training_types        - Jenis Pelatihan';
    RAISE NOTICE '  7. activity_methods      - Metode Pelaksanaan';
    RAISE NOTICE '  8. certificate_types     - Jenis Sertifikat';
    RAISE NOTICE '';
    RAISE NOTICE 'Fitur:';
    RAISE NOTICE '  ✓ Soft delete (is_active field)';
    RAISE NOTICE '  ✓ Hierarki parent-child (units, competency_categories)';
    RAISE NOTICE '  ✓ Auto-updated timestamps';
    RAISE NOTICE '  ✓ Tree path optimization (units.path)';
    RAISE NOTICE '';
END $$;
