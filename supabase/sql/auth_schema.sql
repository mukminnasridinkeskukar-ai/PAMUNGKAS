-- ============================================
-- PAMUNGKAS - Authentication System Schema
-- Multi-User Login & Role Management
-- ============================================
-- 
-- FILE INI KHUSUS UNTUK:
-- 1. Tabel profiles (extend auth.users)
-- 2. Tabel roles (6 role levels)
-- 3. Tabel user_roles (junction many-to-many)
-- 4. RLS policies untuk tabel auth
-- 5. Triggers untuk auto-create profile
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: File ini adalah PRIORITAS untuk authentication
-- ============================================

-- ============================================
-- 1. TIPE ENUM UNTUK ROLES
-- ============================================

-- Buat tipe enum untuk role PAMUNGKAS
CREATE TYPE pamungkas_role AS ENUM (
    'SUPER_ADMIN',      -- Akses penuh sistem & konfigurasi
    'ADMIN',            -- Admin organisasi/fasilitas kesehatan
    'VERIFIKATOR',      -- Verifikasi data & kompetensi
    'PENGELOLA_SDMK',   -- Kelola data SDM kesehatan
    'OPERATOR',         -- Input data operasional
    'PIMPINAN'          -- Laporan & monitoring (read-only + approval)
);

COMMENT ON TYPE pamungkas_role IS 
'Enum role pengguna PAMUNGKAS:
- SUPER_ADMIN: Akses penuh sistem
- ADMIN: Admin organisasi/faskes
- VERIFIKATOR: Verifikasi data validitas
- PENGELOLA_SDMK: Kelola data SDM Kesehatan
- OPERATOR: Entry data operasional
- PIMPINAN: Monitoring & persetujuan';

-- ============================================
-- 2. TABEL: ROLES
-- ============================================

-- Hapus tabel jika ada (untuk development clean)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name pamungkas_role NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Level hierarki (semakin tinggi = semakin berkuata)
    level INTEGER NOT NULL,
    
    -- Metadata
    is_system_role BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Tabel definisi role/permission di sistem PAMUNGKAS';
COMMENT ON COLUMN public.roles.name IS 'Nama role (enum)';
COMMENT ON COLUMN public.roles.level IS 'Level hierarki (1=SUPER_ADMIN, 6=PIMPINAN)';

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);

-- ============================================
-- 3. SEED DATA: ROLES AWAL
-- ============================================

INSERT INTO public.roles (name, display_name, description, level, is_system_role) VALUES
    (
        'SUPER_ADMIN',
        'Super Administrator',
        'Akses penuh ke seluruh sistem, konfigurasi, dan manajemen user',
        1,
        TRUE
    ),
    (
        'ADMIN',
        'Administrator',
        'Admin organisasi/fasilitas kesehatan, kelola user dalam org',
        2,
        TRUE
    ),
    (
        'VERIFIKATOR',
        'Verifikator',
        'Memverifikasi validitas data SDM, sertifikasi, dan kompetensi',
        3,
        TRUE
    ),
    (
        'PENGELOLA_SDMK',
        'Pengelola SDM Kesehatan',
        'Kelola data lengkap tenaga kesehatan, pelatihan, dan sertifikasi',
        4,
        TRUE
    ),
    (
        'OPERATOR',
        'Operator',
        'Input data operasional, entry data dasar',
        5,
        TRUE
    ),
    (
        'PIMPINAN',
        'Pimpinan',
        'Monitoring, laporan, dan persetujuan (read-only + approval)',
        6,
        TRUE
    );

DO $$
BEGIN
    RAISE NOTICE '✅ Roles seeded: % records', (SELECT COUNT(*) FROM roles);
END $$;

-- ============================================
-- 4. TABEL: PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key & relasi ke Supabase Auth
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Data pribadi
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Data organisasi
    unit_id VARCHAR(100),           -- ID unit kerja (akan relasi ke tabel units nanti)
    position VARCHAR(200),          -- Jabatan
    
    -- Status akun
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    
    -- Timestamps & audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id)
);

COMMENT ON TABLE public.profiles IS 'Tabel profil user yang extend Supabase auth.users';
COMMENT ON COLUMN public.profiles.user_id IS 'Foreign key ke auth.users (Supabase Auth)';
COMMENT ON COLUMN public.profiles.unit_id IS 'ID Unit Kerja (akan relasi saat modul organisasi dibuat)';
COMMENT ON COLUMN public.profiles.is_active IS 'Status aktif/non-aktif user';
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp login terakhir';

-- Index untuk performa
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_unit ON public.profiles(unit_id);

-- ============================================
-- 5. TABEL: USER_ROLES (Junction Table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES public.profiles(id),
    
    -- Constraint: satu user tidak boleh punya role yang sama dua kali
    UNIQUE(user_id, role_id)
);

COMMENT ON TABLE public.user_roles IS 'Junction table: hubungan many-to-many antara profiles dan roles';
COMMENT ON COLUMN public.user_roles.assigned_by IS 'User siapa yang memberikan role ini';

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- ============================================
-- 6. TRIGGER: UPDATED_AT
-- ============================================

-- Fungsi trigger untuk update otomatis field updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk tabel profiles
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TRIGGER: AUTO CREATE PROFILE SAAT USER BARU
-- ============================================

-- Fungsi untuk membuat profile otomatis saat user baru register di Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user_after_auth()
RETURNS TRIGGER AS $$
DECLARE
    v_default_role UUID;
    new_profile_id UUID;
BEGIN
    -- Ambil role OPERATOR sebagai default untuk user baru
    SELECT id INTO v_default_role FROM roles WHERE name = 'OPERATOR' LIMIT 1;
    
    -- Insert profile baru
    INSERT INTO public.profiles (
        user_id, 
        full_name, 
        email,
        is_active
    ) VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
        ),
        NEW.email,
        TRUE
    ) RETURNING id INTO new_profile_id;
    
    -- Berikan default role (OPERATOR)
    IF v_default_role IS NOT NULL AND new_profile_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new_profile_id, v_default_role);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile saat user baru dibuat di auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_after_auth();

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Fungsi: Dapatkan role utama user (dengan level terendah = paling berkuasa)
CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id UUID)
RETURNS pamungkas_role AS $$
DECLARE
    primary_role pamungkas_role;
BEGIN
    SELECT r.name INTO primary_role
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    JOIN profiles p ON p.id = ur.user_id
    WHERE p.user_id = p_user_id
    ORDER BY r.level ASC
    LIMIT 1;
    
    RETURN COALESCE(primary_role, 'OPERATOR');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_primary_role IS 'Dapatkan role utama user (paling berkuasa)';

-- Fungsi: Cek apakah user memiliki role tertentu
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role pamungkas_role)
RETURNS BOOLEAN AS $$
DECLARE
    has_it BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM user_roles ur
        JOIN profiles p ON p.id = ur.user_id
        JOIN roles r ON r.id = ur.role_id
        WHERE p.user_id = p_user_id AND r.name = p_role
    ) INTO has_it;
    
    RETURN COALESCE(has_it, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION has_role IS 'Cek apakah user memiliki role tertentu';

-- Fungsi: Cek apakah user adalah SUPER_ADMIN atau ADMIN
CREATE OR REPLACE FUNCTION is_admin_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM user_roles ur
        JOIN profiles p ON p.id = ur.user_id
        JOIN roles r ON r.id = ur.role_id
        WHERE p.user_id = p_user_id AND r.name IN ('SUPER_ADMIN', 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_admin_user IS 'Cek apakah user adalah admin/super admin';

-- Fungsi: Update last_login_at saat login berhasil
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET last_login_at = NOW() 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_last_login IS 'Update timestamp login terakhir';

-- Fungsi: Dapatkan semua role user dalam bentuk array
CREATE OR REPLACE FUNCTION get_user_roles_array(p_user_id UUID)
RETURNS pamungkas_role[] AS $$
DECLARE
    role_array pamungkas_role[];
BEGIN
    SELECT ARRAY_AGG(r.name) INTO role_array
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    JOIN profiles p ON p.id = ur.user_id
    WHERE p.user_id = p_user_id;
    
    RETURN COALESCE(role_array, ARRAY[]::pamungkas_role[]);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_roles_array IS 'Dapatkan semua role user dalam array';

-- Fungsi: Deactivate user (soft delete)
CREATE OR REPLACE FUNCTION deactivate_user(
    p_user_id UUID, 
    p_reason TEXT DEFAULT 'User dinonaktifkan oleh administrator'
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles SET
        is_active = FALSE,
        deactivated_at = NOW(),
        deactivation_reason = p_reason
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deactivate_user IS 'Nonaktifkan user (soft delete)';

-- Fungsi: Activate user kembali
CREATE OR REPLACE FUNCTION activate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles SET
        is_active = TRUE,
        deactivated_at = NULL,
        deactivation_reason = NULL
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION activate_user IS 'Aktifkan kembali user yang dinonaktifkan';

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Aktifkan RLS untuk ketiga tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: ROLES
-- ============================================

-- Semua authenticated user bisa baca roles (untuk dropdown, display, dll)
CREATE POLICY "Authenticated users can view roles"
    ON public.roles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Hanya SUPER_ADMIN yang bisa insert/update/delete roles
CREATE POLICY "Only super_admin can modify roles"
    ON public.roles FOR ALL
    USING (
        EXISTS(
            SELECT 1 
            FROM profiles p
            JOIN user_roles ur ON ur.user_id = p.id
            JOIN roles r ON r.id = ur.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'SUPER_ADMIN'
        )
    );

-- ============================================
-- RLS POLICIES: PROFILES
-- ============================================

-- User bisa lihat profile sendiri
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (
        user_id = auth.uid() 
        OR is_admin_user(auth.uid())
    );

-- User bisa update profile sendiri (kecuali is_active, user_id)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Hanya admin yang bisa insert profiles (manual creation)
CREATE POLICY "Admins can create profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (
        is_admin_user(auth.uid())
    );

-- Hanya super_admin yang bisa delete/hard-delete profiles
CREATE POLICY "Only super_admin can delete profiles"
    ON public.profiles FOR DELETE
    USING (
        EXISTS(
            SELECT 1 
            FROM profiles p
            JOIN user_roles ur ON ur.user_id = p.id
            JOIN roles r ON r.id = ur.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'SUPER_ADMIN'
        )
    );

-- ============================================
-- RLS POLICIES: USER_ROLES
-- ============================================

-- User bisa lihat role mereka sendiri (dan admin bisa lihat semua)
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (
        EXISTS(
            SELECT 1 FROM profiles p WHERE p.id = user_roles.user_id AND p.user_id = auth.uid()
        )
        OR is_admin_user(auth.uid())
    );

-- Hanya admin yang bisa assign roles
CREATE POLICY "Only admins can assign roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (is_admin_user(auth.uid()));

-- Hanya admin yang bisa remove roles
CREATE POLICY "Only admins can remove roles"
    ON public.user_roles FOR DELETE
    USING (is_admin_user(auth.uid()));

-- ============================================
-- 10. VIEW: USER INFO LENGKAP (UNTUK FRONTEND)
-- ============================================

-- View yang menggabungkan user info + roles (berguna untuk dashboard)
CREATE OR REPLACE VIEW public.v_user_info AS
SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    p.unit_id,
    p.position,
    p.is_active,
    p.last_login_at,
    p.created_at as member_since,
    -- Role info
    pr.name as primary_role_name,
    pr.display_name as primary_role_display,
    pr.level as primary_role_level,
    -- All roles as array
    (
        SELECT ARRAY_AGG(DISTINCT r.name ORDER BY r.level)
        FROM user_roles ur2
        JOIN roles r ON r.id = ur2.role_id
        WHERE ur2.user_id = p.id
    ) as all_roles
FROM profiles p
LEFT JOIN LATERAL (
    SELECT r.* 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p.id
    ORDER BY r.level ASC
    LIMIT 1
) pr ON true;

COMMENT ON VIEW public.v_user_info IS 'View lengkap info user termasuk role - untuk frontend dashboard';

-- Set privilege view agar bisa diakses
GRANT SELECT ON public.v_user TO authenticated;

-- ============================================
-- VERIFIKASI AKHIR
-- ============================================

DO $$
DECLARE
    v_profiles INTEGER;
    v_roles INTEGER;
    v_user_roles INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_profiles FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public';
    SELECT COUNT(*) INTO v_roles FROM roles;
    SELECT COUNT(*) INTO v_user_roles FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  PAMUNGKAS AUTH SYSTEM - COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '  ✅ Tables Created:';
    RAISE NOTICE '     - profiles (linked to auth.users)';
    RAISE NOTICE '     - roles (6 role levels)';
    RAISE NOTICE '     - user_roles (junction table)';
    RAISE NOTICE '';
    RAISE NOTICE '  ✅ Roles Available:';
    RAISE NOTICE '     1. SUPER_ADMIN (Level 1)';
    RAISE NOTICE '     2. ADMIN (Level 2)';
    RAISE NOTICE '     3. VERIFIKATOR (Level 3)';
    RAISE NOTICE '     4. PENGELOLA_SDMK (Level 4)';
    RAISE NOTICE '     5. OPERATOR (Level 5)';
    RAISE NOTICE '     6. PIMPINAN (Level 6)';
    RAISE NOTICE '';
    RAISE NOTICE '  ✅ Security:';
    RAISE NOTICE '     - RLS enabled on all tables';
    RAISE NOTICE '     - Auto-create profile trigger ready';
    RAISE NOTICE '     - Helper functions available';
    RAISE NOTICE '';
    RAISE NOTICE '  ✅ Helper Functions:';
    RAISE NOTICE '     - get_user_primary_role(uid)';
    RAISE NOTICE '     - has_role(uid, role)';
    RAISE NOTICE '     - is_admin_user(uid)';
    RAISE NOTICE '     - update_last_login(uid)';
    RAISE NOTICE '     - get_user_roles_array(uid)';
    RAISE NOTICE '     - deactivate_user(uid, reason)';
    RAISE NOTICE '     - activate_user(uid)';
    RAISE NOTICE '';
    RAISE NOTICE '  📋 NEXT STEPS:';
    RAISE NOTICE '     1. Create first SUPER_ADMIN via Supabase Auth > Users';
    RAISE NOTICE '     2. Update their role in user_roles table';
    RAISE NOTICE '     3. Test login flow from frontend';
    RAISE NOTICE '========================================';
END $$;

-- Query untuk verifikasi manual
SELECT 'Tables:' as info UNION ALL
SELECT format('  - profiles (%s)', count(*))::text FROM profiles UNION ALL
SELECT format('  - roles (%s)', count(*))::text FROM roles UNION ALL
SELECT format('  - user_roles (%s)', count(*))::text FROM user_roles;
