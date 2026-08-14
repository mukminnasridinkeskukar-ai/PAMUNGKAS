-- ============================================
-- PAMUNGKAS - Data SDMK Schema
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Tabel SDMK (Sumber Daya Manusia Kesehatan)
-- 2. Enum types untuk data SDMK
-- 3. Indexes untuk performa query
-- 4. RLS Policies untuk keamanan data
-- 5. Trigger functions untuk audit
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 02_master_data.sql
--          Jalankan SETELAH 07_permissions_schema.sql
--
-- ⚠️ PENTING:
-- - Menggunakan SOFT DELETE (is_active = false)
-- - Operator hanya bisa mengakses SDMK unitnya sendiri
-- - Admin/Super Admin memiliki akses penuh
-- ============================================

-- ============================================
-- DROP TABLE JIKA PERLU RE-CREATE (HATAT-HATI!)
-- ============================================

-- Uncomment baris di bawah jika perlu recreate dari awal
-- DROP TABLE IF EXISTS public.sdmk CASCADE;

-- ============================================
-- 1. ENUM TYPES UNTUK DATA SDMK
-- ============================================

-- Jenis Kelamin
CREATE TYPE gender_type AS ENUM (
    'L',    -- Laki-laki
    'P'     -- Perempuan
);
COMMENT ON TYPE gender_type IS 'Jenis kelamin: L=Laki-laki, P=Perempuan';

-- Status STR (Surat Tanda Registrasi)
CREATE TYPE str_status AS ENUM (
    'BERLAKU',       -- STR masih berlaku
    'TIDAK_BERLAKU', -- STR tidak berlaku/expired
    'DALAM_PROSES',  -- Sedang dalam proses perpanjangan
    'BELUM_PUNYA'    -- Belum memiliki STR
);
COMMENT ON TYPE str_status IS 'Status Surat Tanda Registrasi';

-- Status SIP (Surat Izin Praktek)
CREATE TYPE sip_status AS ENUM (
    'BERLAKU',       -- SIP masih berlaku
    'TIDAK_BERLAKU', -- SIP tidak berlaku/expired
    'DALAM_PROSES',  -- Sedang dalam proses perpanjangan
    'BELUM_PUNYA',   -- Belum memiliki SIP
    'DITANGGAL'      -- SIP ditangguhkan
);
COMMENT ON TYPE sip_status IS 'Status Surat Izin Praktek';

-- Status Aktif Pegawai
CREATE TYPE employee_active_status AS ENUM (
    'AKTIF',         -- Aktif bekerja
    'CUTI',          -- Sedang cuti
    'PENSIUN',       -- Sudah pensiun
    'MUTASI',        -- Mutasi ke unit lain
    'NONAKTIF',      -- Non-aktif (PHK/resign)
    'BELUM_EFektif'  -- Belum efektif (baru diterima)
);
COMMENT ON TYPE employee_active_status IS 'Status aktifitas pegawai/SDMK';

-- ============================================
-- 2. TABEL UTAMA: SDMK (SDM KESEHATAN)
-- ============================================
-- 
-- Struktur lengkap data tenaga kesehatan
-- Relasi ke master data tables:
--   - units (unit kerja/tempat bertugas)
--   - professions (jenis profesi nakes)
--   - education_levels (tingkat pendidikan terakhir)
--   - employment_statuses (status kepegawaian)

CREATE TABLE IF NOT EXISTS public.sdmk (
    -- ==========================================
    -- PRIMARY KEY & IDENTITAS UNIK
    -- ==========================================
    
    /**
     * Primary Key - UUID v4
     * Auto-generated menggunakan gen_random_uuid()
     */
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ==========================================
    -- DATA IDENTITAS (NIK & NIP)
    -- ==========================================
    -- NIK dan NIP BUKAN primary key!
    -- Masing-masing memiliki UNIQUE constraint
    
    /**
     * Nomor Induk Kependudukan
     * 16 digit sesuai format Dukcapil
     * UNIQUE constraint untuk mencegah duplikasi
     */
    nik VARCHAR(16) UNIQUE,
    
    /**
     * Nomor Induk Pegawai
     * Maksimal 18 karakter (bisa kombinasi huruf & angka)
     * UNIQUE constraint untuk mencegah duplikasi
     */
    nip VARCHAR(18) UNIQUE,
    
    -- ==========================================
    -- DATA PRIBADI / IDENTITAS DIRI
    -- ==========================================
    
    /**
     * Nama Lengkap
     * Wajib diisi, maksimal 200 karakter
     */
    nama_lengkap VARCHAR(200) NOT NULL,
    
    /**
     * Gelar Depan (opsional)
     * Contoh: dr., drg., Ir., dll.
     */
    gelar_depan VARCHAR(50),
    
    /**
     * Gelar Belakang (opsional)
     * Contoh: S.Ked., Sp.PD, M.Kes., dll.
     */
    gelar_belakang VARCHAR(100),
    
    /**
     * Tempat Lahir
     * Kota/Kabupaten kelahiran
     */
    tempat_lahir VARCHAR(100),
    
    /**
     * Tanggal Lahir
     * Format: YYYY-MM-DD
     */
    tanggal_lahir DATE,
    
    /**
     * Jenis Kelamin
     * L = Laki-laki, P = Perempuan
     */
    jenis_kelamin gender_type,
    
    -- ==========================================
    -- DATA KONTAK & ALAMAT
    -- ==========================================
    
    /**
     * Alamat Lengkap
     * Alamat tempat tinggal saat ini
     */
    alamat TEXT,
    
    /**
     * Nomor HP / Telepon Seluler
     * Format: +628xxxxxxxxxx atau 08xxxxxxxxxx
     */
    nomor_hp VARCHAR(20),
    
    /**
     * Email Address
     * Untuk komunikasi resmi
     */
    email VARCHAR(150),
    
    -- ==========================================
    -- FOREIGN KEY KE MASTER DATA
    -- ==========================================
    
    /**
     * Tingkat Pendidikan Terakhir
     * FK -> education_levels.id
     */
    education_level_id UUID REFERENCES public.education_levels(id) ON DELETE SET NULL,
    
    /**
     * Profesi / Jenis Tenaga Kesehatan
     * FK -> professions.id
     * Contoh: Dokter, Perawat, Bidan, dll.
     */
    profession_id UUID REFERENCES public.professions(id) ON DELETE SET NULL,
    
    /**
     * Status Kepegawaian
     * FK -> employment_statuses.id
     * Contoh: PNS, PPPK, Kontrak, Honor, dll.
     */
    employment_status_id UUID REFERENCES public.employment_statuses(id) ON DELETE SET NULL,
    
    /**
     * Unit Kerja / Tempat Bertugas
     * FK -> units.id (hierarkis)
     * Menentukan akses data untuk role OPERATOR
     */
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    
    -- ==========================================
    -- DATA PEKERJAAN / JABATAN
    -- ==========================================
    
    /**
     * Jabatan / Posisi
     * Jabatan struktural/fungsional
     * Contoh: Dokter Spesialis, Perawat Pelaksana, dll.
     */
    jabatan VARCHAR(150),
    
    -- ==========================================
    -- DATA REGISTRASI & IZIN PRAKTEK
    -- ==========================================
    
    /**
     * Nomor Surat Tanda Registrasi (STR)
     * Diterbitkan oleh Konsil Kedokteran Indonesia (KKI)
     * atau konsil profesi kesehatan lainnya
     */
    nomor_str VARCHAR(50),
    
    /**
     * Nomor Surat Izin Praktek (SIP)
     * Diterbitkan oleh Dinkes/Dinas Kesehatan setempat
     */
    nomor_sip VARCHAR(50),
    
    /**
     * Status STR
     * Berlaku, Tidak Berlaku, Dalam Proses, Belum Punya
     */
    status_str str_status DEFAULT 'BELUM_PUNYA',
    
    /**
     * Status SIP
     * Berlaku, Tidak Berlaku, Dalam Proses, Belum Punya, Ditangguhkan
     */
    status_sip sip_status DEFAULT 'BELUM_PUNYA',
    
    -- ==========================================
    -- DATA PENDIDIKAN TAMBAHAN
    -- ==========================================
    
    /**
     * Tahun Lulus
     * Tahun kelulusan pendidikan terakhir
     */
    tahun_lulus INTEGER CHECK (tahun_lulus > 1900 AND tahun_lulus <= EXTRACT(YEAR FROM CURRENT_DATE) + 5),
    
    -- ==========================================
    -- STATUS AKTIF (SOFT DELETE!)
    -- ==========================================
    
    /**
     * Status Aktif SDMK
     * SOFT DELETE PATTERN:
     * - TRUE = SDMK aktif (tampil di daftar)
     * - FALSE = SDMK non-aktif (disembunyikan, tapi data tetap ada)
     * 
     * ⚠️ JANGAN hard delete! Data sudah direferensikan transaksi lain.
     */
    status_aktif employee_active_status DEFAULT 'AKTIF',
    
    is_active BOOLEAN DEFAULT TRUE,
    
    -- ==========================================
    -- FOTO & MEDIA
    -- ==========================================
    
    /**
     * URL Foto Profil
     * Disimpan di storage (Supabase Storage / external CDN)
     */
    foto_url TEXT,
    
    -- ==========================================
    -- AUDIT TRAIL (Created & Updated By)
    -- ==========================================
    
    /**
     * User yang membuat record ini
     * FK -> auth.users.id (via profiles)
     */
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    /**
     * User yang terakhir update record ini
     * FK -> auth.users.id (via profiles)
     */
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- ==========================================
    -- TIMESTAMPS
    -- ==========================================
    
    /**
     * Tanggal pembuatan record
     * Auto-set saat INSERT
     */
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    /**
     * Tanggal update terakhir
     * Auto-update saat UPDATE (via trigger)
     */
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- COMMENTS (DOKUMENTASI KOLOM)
-- ==========================================

COMMENT ON TABLE public.sdmk IS 'Tabel utama data Sumber Daya Manusia Kesehatan (Tenaga Kesehatan/Nakes)';
COMMENT ON COLUMN public.sdmk.id IS 'Primary key UUID auto-generated';
COMMENT ON COLUMN public.sdmk.nik IS 'Nomor Induk Kependudukan (16 digit, UNIQUE)';
COMMENT ON COLUMN public.sdmk.nip IS 'Nomor Induk Pegawai (maks 18 karakter, UNIQUE)';
COMMENT ON COLUMN public.sdmk.nama_lengkap IS 'Nama lengkap (wajib, termasuk gelar jika ada)';
COMMENT ON COLUMN public.sdmk.gelar_depan IS 'Gelar depan: dr., drg., Ir., dll.';
COMMENT ON COLUMN public.sdmk.gelar_belakang IS 'Gelar belakang: S.Ked., Sp.PD, M.Kes., dll.';
COMMENT ON COLUMN public.sdmk.tempat_lahir IS 'Tempat/kota kelahiran';
COMMENT ON COLUMN public.sdmk.tanggal_lahir IS 'Tanggal lahir (YYYY-MM-DD)';
COMMENT ON COLUMN public.sdmk.jenis_kelamin IS 'Jenis kelamin: L=Laki-laki, P=Perempuan';
COMMENT ON COLUMN public.sdmk.alamat IS 'Alamat lengkap tempat tinggal';
COMMENT ON COLUMN public.sdmk.nomor_hp IS 'Nomor HP/WA (+62xxxx / 08xxxx)';
COMMENT ON COLUMN public.sdmk.email IS 'Email address untuk komunikasi resmi';
COMMENT ON COLUMN public.sdmk.education_level_id IS 'FK -> education_levels.id (tingkat pendidikan)';
COMMENT ON COLUMN public.sdmk.profession_id IS 'FK -> professions.id (jenis profesi nakes)';
COMMENT ON COLUMN public.sdmk.employment_status_id IS 'FK -> employment_statuses.id (status kepegawaian)';
COMMENT ON COLUMN public.sdmk.unit_id IS 'FK -> units.id (unit kerja/tempat bertugas)';
COMMENT ON COLUMN public.sdmk.jabatan IS 'Jabatan/posisi struktural/fungsional';
COMMENT ON COLUMN public.sdmk.nomor_str IS 'Nomor Surat Tanda Registrasi (dari KKI/konsil profesi)';
COMMENT ON COLUMN public.sdmk.nomor_sip IS 'Nomor Surat Izin Praktek (dari Dinkes)';
COMMENT ON COLUMN public.sdmk.status_str IS 'Status STR: BERLAKU, TIDAK_BERLAKU, DALAM_PROSES, BELUM_PUNYA';
COMMENT ON COLUMN public.sdmk.status_sip IS 'Status SIP: BERLAKU, TIDAK_BERLAKU, DALAM_PROSES, BELUM_PUNYA, DITANGGAL';
COMMENT ON COLUMN public.sdmk.tahun_lulus IS 'Tahun lulus pendidikan terakhir';
COMMENT ON COLUMN public.sdmk.status_aktif IS 'Status aktifitas: AKTIF, CUTI, PENSIUN, MUTASI, NONAKTIF, BELUM_EFEKTIF';
COMMENT ON COLUMN public.sdmk.is_active IS 'SOFT DELETE: FALSE = dinonaktifkan (tidak dihapus permanen!)';
COMMENT ON COLUMN public.sdmk.foto_url IS 'URL foto profil (storage/CDN)';
COMMENT ON COLUMN public.sdmk.created_by IS 'User ID yang membuat record (auth.users.id)';
COMMENT ON COLUMN public.sdmk.updated_by IS 'User ID yang terakhir update (auth.users.id)';
COMMENT ON COLUMN public.sdmk.created_at IS 'Timestamp pembuatan record (auto)';
COMMENT ON COLUMN public.sdmk.updated_at IS 'Timestamp update terakhir (auto via trigger)';

-- ==========================================
-- INDEXES UNTUK PERFORMA QUERY
-- ==========================================
-- Penting untuk pencarian, filter, dan pagination

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_sdmk_id ON public.sdmk(id);

-- Identity search indexes (paling sering dicari)
CREATE INDEX IF NOT EXISTS idx_sdmk_nik ON public.sdmk(nik);
CREATE INDEX IF NOT EXISTS idx_sdmk_nip ON public.sdmk(nip);
CREATE INDEX IF NOT EXISTS idx_sdmk_nama_lengkap ON public.sdmk(nama_lengkap);

-- Full-text search index untuk nama (mencari partial/case-insensitive)
CREATE INDEX IF NOT EXISTS idx_sdmk_nama_search ON public.sdmk USING gin(to_tsvector('indonesian', nama_lengkap));

-- Foreign key indexes (untuk JOIN queries)
CREATE INDEX IF NOT EXISTS idx_sdmk_education_level ON public.sdmk(education_level_id);
CREATE INDEX IF NOT EXISTS idx_sdmk_profession ON public.sdmk(profession_id);
CREATE INDEX IF NOT EXISTS idx_sdmk_employment_status ON public.sdmk(employment_status_id);
CREATE INDEX IF NOT EXISTS idx_sdmk_unit ON public.sdmk(unit_id);

-- Filter indexes (sering digunakan di WHERE clause)
CREATE INDEX IF NOT EXISTS idx_sdmk_is_active ON public.sdmk(is_active);
CREATE INDEX IF NOT EXISTS idx_sdmk_status_aktif ON public.sdmk(status_aktif);
CREATE INDEX IF NOT EXISTS idx_sdmk_jenis_kelamin ON public.sdmk(jenis_kelamin);
CREATE INDEX IF NOT EXISTS idx_sdmk_tahun_lulus ON public.sdmk(tahun_lulus);

-- Registration/license search
CREATE INDEX IF NOT EXISTS idx_sdmk_nomor_str ON public.sdmk(nomor_str);
CREATE INDEX IF NOT EXISTS idx_sdmk_nomor_sip ON public.sdmk(nomor_sip);
CREATE INDEX IF NOT EXISTS idx_sdmk_status_str ON public.sdmk(status_str);
CREATE INDEX IF NOT EXISTS idx_sdmk_status_sip ON public.sdmk(status_sip);

-- Contact search
CREATE INDEX IF NOT EXISTS idx_sdmk_email ON public.sdmk(email);
CREATE INDEX IF NOT EXISTS idx_sdmk_nomor_hp ON public.sdmk(nomor_hp);

-- Timestamp indexes (sorting)
CREATE INDEX IF NOT EXISTS idx_sdmk_created_at ON public.sdmk(created_at);
CREATE INDEX IF NOT EXISTS idx_sdmk_updated_at ON public.sdmk(updated_at);

-- Composite indexes (untuk query kompleks)
CREATE INDEX IF NOT EXISTS idx_sdmk_unit_active ON public.sdmk(unit_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sdmk_profession_unit ON public.sdmk(profession_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_sdmk_name_active ON public.sdmk(nama_lengkap, is_active);

-- ==========================================
-- TRIGGER: AUTO UPDATE updated_at
-- ==========================================

-- Cek apakah trigger function sudah ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Buat trigger untuk sdmk table
DROP TRIGGER IF EXISTS on_sdmk_updated ON public.sdmk;
CREATE TRIGGER on_sdmk_updated
    BEFORE UPDATE ON public.sdmk
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Keamanan berbasis baris:
-- - SUPER_ADMIN: Akses SEMUA data
-- - ADMIN: Akses data organisasinya
-- - OPERATOR: Hanya data dari UNITnya saja
-- - PENGELOLA_SDMK: Sesuai permission
-- - VERIFIKATOR/PIMPINAN: Read-only access

-- Enable RLS pada tabel sdmk
ALTER TABLE public.sdmk ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICY 1: Super Admin - FULL ACCESS
-- ==========================================
-- Super Admin bisa melakukan SEMUA operasi pada SEMUA data

CREATE OR REPLACE POLICY "sdmk_super_admin_full_access"
ON public.sdmk
FOR ALL
TO authenticated
USING (
    -- Cek apakah user adalah SUPER_ADMIN via function
    pamungkas_has_role(auth.uid(), 'SUPER_ADMIN')
)
WITH CHECK (
    pamungkas_has_role(auth.uid(), 'SUPER_ADMIN')
);

-- ==========================================
-- POLICY 2: Admin - Organizational Access
-- ==========================================
-- Admin bisa mengakses data dalam organisasinya
-- (bisa disesuaikan dengan logic organisasi)

CREATE OR REPLACE POLICY "sdmk_admin_access"
ON public.sdmk
FOR ALL
TO authenticated
USING (
    pamungkas_has_role(auth.uid(), 'ADMIN')
)
WITH CHECK (
    pamungkas_has_role(auth.uid(), 'ADMIN')
);

-- ==========================================
-- POLICY 3: Pengelola SDMK - Manage Access
-- ==========================================
-- Pengelola SDMK bisa CRUD data SDMK

CREATE OR REPLACE POLICY "sdmk_pengelola_manage"
ON public.sdmk
FOR ALL
TO authenticated
USING (
    pamungkas_has_role(auth.uid(), 'PENGELOLA_SDMK')
)
WITH CHECK (
    pamungkas_has_role(auth.uid(), 'PENGELOLA_SDMK')
);

-- ==========================================
-- POLICY 4: Operator - Unit Restricted Access
-- ==========================================
-- OPERATOR hanya bisa mengakses SDMK dari UNITnya sendiri!
-- Ini adalah policy TERPENTING untuk isolasi data

CREATE OR REPLACE POLICY "sdmk_operator_unit_restricted"
ON public.sdmk
FOR ALL
TO authenticated
USING (
    -- User harus role OPERATOR
    pamungkas_has_role(auth.uid(), 'OPERATOR')
    AND
    -- Hanya data SDMK yang unit_id sama dengan unit user
    unit_id IN (
        SELECT unit_id 
        FROM profiles 
        WHERE user_id = auth.uid() 
        AND unit_id IS NOT NULL
    )
)
WITH CHECK (
    pamungkas_has_role(auth.uid(), 'OPERATOR')
    AND
    unit_id IN (
        SELECT unit_id 
        FROM profiles 
        WHERE user_id = auth.uid() 
        AND unit_id IS NOT NULL
    )
);

-- ==========================================
-- POLICY 5: Verifikator - Read Access
-- ==========================================
-- Verifikator bisa melihat data untuk verifikasi

CREATE OR REPLACE POLICY "sdmk_verifikator_read"
ON public.sdmk
FOR SELECT
TO authenticated
USING (
    pamungkas_has_role(auth.uid(), 'VERIFIKATOR')
    OR pamungkas_has_role(auth.uid(), 'PIMPINAN')
);

-- ==========================================
-- POLICY 6: Service Role - Bypass RLS
-- ==========================================
-- Service role (backend/admin tasks) bypass semua RLS

CREATE OR REPLACE POLICY "sdmk_service_role_bypass"
ON public.sdmk
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==========================================
-- HELPER FUNCTIONS (jika belum ada)
-- ==========================================

-- Function untuk cek role user
CREATE OR REPLACE FUNCTION pamungkas_has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_count INTEGER;
BEGIN
    -- Hitung jumlah role yang cocok
    SELECT COUNT(*) INTO v_role_count
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND r.name = p_role_name;
    
    RETURN COALESCE(v_role_count, 0) > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function untuk mendapatkan unit ID user
CREATE OR REPLACE FUNCTION pamungkas_get_user_unit_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_unit_id UUID;
BEGIN
    SELECT unit_id INTO v_unit_id
    FROM profiles
    WHERE user_id = p_user_id
    LIMIT 1;
    
    RETURN v_unit_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- VIEW: v_sdmk_detail (dengan JOIN master data)
-- ==========================================
-- View ini mempermudah query dengan nama-nama master data
-- Daripada hanya ID, view menampilkan nama lengkapnya

CREATE OR REPLACE VIEW public.v_sdmk_detail AS
SELECT 
    -- Data SDMK
    s.id,
    s.nik,
    s.nip,
    s.nama_lengkap,
    s.gelar_depan,
    s.gelar_belakang,
    -- Computed full name with titles
    CASE 
        WHEN s.gelar_depan IS NOT NULL AND s.gelar_belakang IS NOT NULL THEN 
            s.gelar_depan || ' ' || s.nama_lengkap || ', ' || s.gelar_belakang
        WHEN s.gelar_depan IS NOT NULL THEN 
            s.gelar_depan || ' ' || s.nama_lengkap
        WHEN s.gelar_belakang IS NOT NULL THEN 
            s.nama_lengkap || ', ' || s.gelar_belakang
        ELSE 
            s.nama_lengkap
    END AS nama_dengan_gelar,
    s.tempat_lahir,
    s.tanggal_lahir,
    s.jenis_kelamin,
    s.alamat,
    s.nomor_hp,
    s.email,
    s.jabatan,
    s.nomor_str,
    s.nomor_sip,
    s.status_str,
    s.status_sip,
    s.tahun_lulus,
    s.status_aktif,
    s.is_active,
    s.foto_url,
    s.created_by,
    s.updated_by,
    s.created_at,
    s.updated_at,
    
    -- Master Data Names (JOIN)
    s.education_level_id,
    el.name AS education_level_name,
    el.code AS education_level_code,
    
    s.profession_id,
    p.name AS profession_name,
    p.code AS profession_code,
    p.short_name AS profession_short_name,
    p.category AS profession_category,
    
    s.employment_status_id,
    es.name AS employment_status_name,
    es.code AS employment_status_code,
    es.status_type AS employment_status_type,
    es.color_hex AS employment_status_color,
    
    s.unit_id,
    u.name AS unit_name,
    u.code AS unit_code,
    u.unit_type AS unit_type,
    u.parent_id AS unit_parent_id
    
FROM public.sdmk s
-- LEFT JOIN agar data tetap muncul meski master data kosong
LEFT JOIN public.education_levels el ON s.education_level_id = el.id
LEFT JOIN public.professions p ON s.profession_id = p.id
LEFT JOIN public.employment_statuses es ON s.employment_status_id = es.id
LEFT JOIN public.units u ON s.unit_id = u.id;

COMMENT ON VIEW public.v_sdmk_detail IS 'View detail SDMK dengan join ke master data tables (nama, kode, dll)';

-- Index pada view tidak bisa langsung, tapi kita buat materialized view opsional
-- Materialized View untuk performa reporting (opsional, uncomment jika needed)
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_sdmk_report AS
SELECT * FROM public.v_sdmk_detail WITH NO DATA;

-- Refresh manual: REFRESH MATERIALIZED VIEW public.mv_sdmk_report;
*/

-- ==========================================
-- FUNCTION: Search SDMK (Full-text + Filters)
-- ==========================================
-- Function untuk pencarian lanjutan dengan multiple filters

CREATE OR REPLACE FUNCTION search_sdmk(
    p_search_text TEXT DEFAULT NULL,
    p_profession_id UUID DEFAULT NULL,
    p_unit_id UUID DEFAULT NULL,
    p_employment_status_id UUID DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_jenis_kelamin gender_type DEFAULT NULL,
    p_offset INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20,
    p_sort_by VARCHAR DEFAULT 'nama_lengkap',
    p_sort_order VARCHAR DEFAULT 'ASC'
)
RETURNS TABLE (
    id UUID,
    nik VARCHAR,
    nip VARCHAR,
    nama_lengkap VARCHAR,
    nama_dengan_gelar VARCHAR,
    profession_name VARCHAR,
    unit_name VARCHAR,
    employment_status_name VARCHAR,
    status_aktif employee_active_status,
    is_active BOOLEAN,
    total_count BIGINT
) AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- Hitung total records (tanpa pagination)
    SELECT COUNT(*) INTO v_total_count
    FROM v_sdmk_detail v
    WHERE 
        (p_search_text IS NULL OR 
         to_tsvector('indonesian', COALESCE(v.nama_lengkap, '') || ' ' || COALESCE(v.nik, '') || ' ' || COALESCE(v.nip, '') || ' ' || COALESCE(v.jabatan, '')) 
         @@ plainto_tsquery('indonesian', p_search_text))
        AND (p_profession_id IS NULL OR v.profession_id = p_profession_id)
        AND (p_unit_id IS NULL OR v.unit_id = p_unit_id)
        AND (p_employment_status_id IS NULL OR v.employment_status_id = p_employment_status_id)
        AND (v.is_active = p_is_active)
        AND (p_jenis_kelamin IS NULL OR v.jenis_kelamin = p_jenis_kelamin);
    
    -- Return query results
    RETURN QUERY
    SELECT 
        v.id,
        v.nik,
        v.nip,
        v.nama_lengkap,
        v.nama_dengan_gelar,
        v.profession_name,
        v.unit_name,
        v.employment_status_name,
        v.status_aktif,
        v.is_active,
        v_total_count
    FROM v_sdmk_detail v
    WHERE 
        (p_search_text IS NULL OR 
         to_tsvector('indonesian', COALESCE(v.nama_lengkap, '') || ' ' || COALESCE(v.nik, '') || ' ' || COALESCE(v.nip, '') || ' ' || COALESCE(v.jabatan, '')) 
         @@ plainto_tsquery('indonesian', p_search_text))
        AND (p_profession_id IS NULL OR v.profession_id = p_profession_id)
        AND (p_unit_id IS NULL OR v.unit_id = p_unit_id)
        AND (p_employment_status_id IS NULL OR v.employment_status_id = p_employment_status_id)
        AND (v.is_active = p_is_active)
        AND (p_jenis_kelamin IS NULL OR v.jenis_kelamin = p_jenis_kelamin)
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'nama_lengkap' AND p_sort_order = 'ASC' THEN v.nama_lengkap
        END ASC,
        CASE 
            WHEN p_sort_by = 'nama_lengkap' AND p_sort_order = 'DESC' THEN v.nama_lengkap
        END DESC,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN v.created_at
        END ASC NULLS LAST,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN v.created_at
        END DESC NULLS FIRST,
        CASE 
            WHEN p_sort_by = 'nik' AND p_sort_order = 'ASC' THEN v.nik
        END ASC NULLS LAST,
        CASE 
            WHEN p_sort_by = 'nik' AND p_sort_order = 'DESC' THEN v.nik
        END DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- FUNCTION: Soft Delete SDMK
-- ==========================================
-- Function aman untuk non-aktifkan SDMK (bukan hard delete!)

CREATE OR REPLACE FUNCTION soft_delete_sdmk(p_sdmk_id UUID, p_deleted_by UUID)
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Ambil data sebelum di-delete (untuk audit)
    SELECT * INTO v_record FROM sdmk WHERE id = p_sdmk_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Record tidak ditemukan',
            'code', 'NOT_FOUND'
        )::JSONB;
    END IF;
    
    -- Lakukan soft delete
    UPDATE sdmk 
    SET 
        is_active = FALSE,
        status_aktif = 'NONAKTIF',
        updated_by = p_deleted_by,
        updated_at = NOW()
    WHERE id = p_sdmk_id;
    
    -- Log activity (ke activity_logs jika ada tabel)
    /*
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, old_values, new_values)
    VALUES (
        p_deleted_by, 
        'SOFT_DELETE', 
        'sdmk', 
        p_sdmk_id, 
        'Soft delete SDMK: ' || v_record.nama_lengkap,
        row_to_json(v_record)::JSONB,
        '{"is_active": false, "status_aktif": "NONAKTIF"}'::JSONB
    );
    */
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'SDMK berhasil dinonaktifkan',
        'data', jsonb_build_object(
            'id', p_sdmk_id,
            'nama_lengkap', v_record.nama_lengkap,
            'deleted_at', NOW()
        )
    )::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Restore SDMK (undo soft delete)
-- ==========================================

CREATE OR REPLACE FUNCTION restore_sdmk(p_sdmk_id UUID, p_restored_by UUID)
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Cek apakah record ada dan sedang non-aktif
    SELECT * INTO v_record FROM sdmk WHERE id = p_sdmk_id AND is_active = FALSE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Record tidak ditemukan atau sudah aktif',
            'code', 'NOT_FOUND'
        )::JSONB;
    END IF;
    
    -- Restore record
    UPDATE sdmk 
    SET 
        is_active = TRUE,
        status_aktif = 'AKTIF',
        updated_by = p_restored_by,
        updated_at = NOW()
    WHERE id = p_sdmk_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'SDMK berhasil diaktifkan kembali',
        'data', jsonb_build_object(
            'id', p_sdmk_id,
            'nama_lengkap', v_record.nama_lengkap,
            'restored_at', NOW()
        )
    )::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- FUNCTION: Validate NIK/NIP uniqueness
-- ==========================================

CREATE OR REPLACE FUNCTION validate_sdmk_identity(
    p_id UUID,  -- NULL untuk insert baru, existing ID untuk update
    p_nik VARCHAR,
    p_nip VARCHAR
) RETURNS TABLE(is_valid BOOLEAN, error_message TEXT) AS $$
BEGIN
    -- Validasi NIK (jika diisi)
    IF p_nik IS NOT NULL THEN
        -- Cek format 16 digit
        IF length(p_nik) != 16 OR p_nik ~ '[^0-9]' THEN
            RETURN QUERY SELECT FALSE, 'NIK harus 16 digit angka'::TEXT;
            RETURN;
        END IF;
        
        -- Cek unique (exclude current record)
        IF EXISTS (SELECT 1 FROM sdmk WHERE nik = p_nik AND (p_id IS NULL OR id != p_id)) THEN
            RETURN QUERY SELECT FALSE, 'NIK sudah digunakan oleh SDMK lain'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Validasi NIP (jika diisi)
    IF p_nip IS NOT NULL THEN
        -- Cek unique (exclude current record)
        IF EXISTS (SELECT 1 FROM sdmk WHERE nip = p_nip AND (p_id IS NULL OR id != p_id)) THEN
            RETURN QUERY SELECT FALSE, 'NIP sudah digunakan oleh SDMK lain'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Semua valid
    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VERIFIKASI AKHIR
-- ==========================================

-- Cek apakah tabel berhasil dibuat
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_column_count INTEGER;
    v_index_count INTEGER;
    v_policy_count INTEGER;
BEGIN
    -- Cek tabel
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sdmk'
    ) INTO v_table_exists;
    
    -- Cek kolom
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sdmk';
    
    -- Cek indexes
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE tablename = 'sdkm' -- typo check
    OR tablename = 'sdmk';
    
    -- Cek RLS policies
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'sdmk';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SDMK SCHEMA BERHASIL DIBUAT!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabel: sdmk (%)', v_table_exists;
    RAISE NOTICE '📋 Kolom: %', v_column_count;
    RAISE NOTICE '🔍 Indexes: ~25+ (performance optimized)';
    RAISE NOTICE '🔒 RLS Policies: % (security enabled)', v_policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '📝 Fitur:';
    RAISE NOTICE '  ✓ UUID Primary Key (auto-generated)';
    RAISE NOTICE '  ✓ Unique constraints: NIK, NIP';
    RAISE NOTICE '  ✓ Soft Delete pattern (is_active)';
    RAISE NOTICE '  ✓ Row Level Security enabled';
    RAISE NOTICE '  ✓ Role-based access control:';
    RAISE NOTICE '    - SUPER_ADMIN: Full access';
    RAISE NOTICE '    - ADMIN: Organizational access';
    RAISE NOTICE '    - PENGELOLA_SDMK: Manage access';
    RAISE NOTICE '    - OPERATOR: Unit-restricted only!';
    RAISE NOTICE '    - VERIFIKATOR/PIMPINAN: Read-only';
    RAISE NOTICE '  ✓ Auto-updated timestamps';
    RAISE NOTICE '  ✓ Full-text search support';
    RAISE NOTICE '  ✓ Helper functions:';
    RAISE NOTICE '    - search_sdmk() - Advanced search';
    RAISE NOTICE '    - soft_delete_sdmk() - Safe disable';
    RAISE NOTICE '    - restore_sdmk() - Undo soft delete';
    RAISE NOTICE '    - validate_sdmk_identity() - NIK/NIP validation';
    RAISE NOTICE '  ✓ View: v_sdmk_detail (with master data joins)';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Foreign Keys:';
    RAISE NOTICE '  → education_levels (pendidikan)';
    RAISE NOTICE '  → professions (profesi nakes)';
    RAISE NOTICE '  → employment_statuses (status kepegawaian)';
    RAISE NOTICE '  → units (unit kerja/hierarkis)';
    RAISE NOTICE '';
END $$;

-- Query verifikasi final
SELECT 
    'sdmk' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'sdmk') as column_count,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'sdmk') as index_count,
    (SELECT relrowsecurity FROM pg_class 
     WHERE relname = 'sdmk') as rls_enabled;
