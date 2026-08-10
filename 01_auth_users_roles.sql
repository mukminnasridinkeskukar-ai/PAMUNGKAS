-- ============================================
-- PAMUNGKAS - Auth Users & Roles Schema
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Extensi Supabase auth.users dengan metadata
-- 2. Tabel roles untuk manajemen peran
-- 3. Tabel user_profiles untuk data tambahan user
-- 4. Relasi antara users dan roles
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: File ini harus dijalankan PERTAMA
-- ============================================

-- ============================================
-- 1. EXTENSI ROLE (ENUM TYPE)
-- ============================================

-- Buat tipe enum untuk role
CREATE TYPE app_role AS ENUM (
    'super_admin',    -- Akses penuh ke semua fitur
    'admin',          -- Admin organisasi/fasilitas
    'manajer',        -- Manajer SDM kesehatan
    'operator',       -- Operator input data
    'viewer'          -- Hanya bisa melihat (read-only)
);

COMMENT ON TYPE app_role IS 'Enum untuk role pengguna PAMUNGKAS';

-- ============================================
-- 2. TABEL ROLES
-- ============================================

-- Tabel definisi role dengan deskripsi
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name app_role NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Tabel definisi role/permission di sistem PAMUNGKAS';
COMMENT ON COLUMN public.roles.name IS 'Nama role (enum)';
COMMENT ON COLUMN public.roles.display_name IS 'Nama tampilan role';
COMMENT ON COLUMN public.roles.permissions IS 'Permission dalam format JSON';

-- Index untuk pencarian role
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- ============================================
-- 3. TABEL USER_PROFILES
-- ============================================

-- Tabel profil user yang extend auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    
    -- Data pribadi
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    photo_url TEXT,
    
    -- Data kepegawaian/organisasi
    nip VARCHAR(18),           -- Nomor Induk Pegawai
    nik VARCHAR(16),           -- Nomor Induk Kependudukan
    jabatan VARCHAR(200),
    unit_kerja VARCHAR(200),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE public.user_profiles IS 'Tabel profil user yang extend Supabase auth.users';
COMMENT ON COLUMN public.user_profiles.user_id IS 'Foreign key ke auth.users';
COMMENT ON COLUMN public.user_profiles.role_id IS 'Foreign key ke tabel roles';
COMMENT ON COLUMN public.user_profiles.nip IS 'Nomor Induk Pegawai (18 digit)';

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_nip ON public.user_profiles(nip);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- ============================================
-- 4. TRIGGER: UPDATED_AT
-- ============================================

-- Fungsi trigger untuk update otomatis field updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk tabel roles
CREATE TRIGGER on_roles_updated
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk tabel user_profiles
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TRIGGER: AUTO CREATE USER PROFILE
-- ============================================

-- Fungsi untuk membuat profile otomatis saat user baru register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Ambil role viewer sebagai default
    SELECT id INTO default_role_id FROM roles WHERE name = 'viewer' LIMIT 1;
    
    INSERT INTO public.user_profiles (user_id, role_id, full_name)
    VALUES (
        NEW.id,
        COALESCE(default_role_id, NULL),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create profile saat user baru dibuat
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 6. SEED ROLES (Data Awal)
-- ============================================

-- Insert default roles jika belum ada
INSERT INTO public.roles (name, display_name, description, is_system_role) VALUES
    ('super_admin', 'Super Administrator', 'Akses penuh ke seluruh sistem dan konfigurasi', TRUE),
    ('admin', 'Administrator', 'Mengelola data dan pengguna dalam organisasi', TRUE),
    ('manajer', 'Manajer SDM', 'Mengelola pengembangan kompetensi SDM kesehatan', TRUE),
    ('operator', 'Operator', 'Memasukkan dan mengelola data operasional', TRUE),
    ('viewer', 'Viewer', 'Hanya dapat melihat data dan laporan', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Fungsi untuk mendapatkan role user saat ini
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role AS $$
DECLARE
    user_role app_role;
BEGIN
    SELECT r.name INTO user_role
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.user_id = auth.uid();
    
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah admin atau super_admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFIKASI
-- ============================================

-- Cek apakah tabel sudah terbuat dengan benar
SELECT 
    'roles' as table_name, count(*) as row_count 
FROM public.roles
UNION ALL
SELECT 
    'user_profiles' as table_name, count(*) as row_count 
FROM public.user_profiles;

-- Log info
DO $$ 
BEGIN
    RAISE NOTICE '✅ Auth Users & Roles schema berhasil dibuat';
    RAISE NOTICE '   - Tipe enum: app_role';
    RAISE NOTICE '   - Tabel: roles, user_profiles';
    RAISE NOTICE '   - Trigger: auto create user profile';
    RAISE NOTICE '   - Functions: get_current_user_role(), is_admin_user(), is_super_admin()';
END $$;
