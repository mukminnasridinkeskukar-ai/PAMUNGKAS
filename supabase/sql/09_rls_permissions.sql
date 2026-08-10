-- ============================================
-- PAMUNGKAS - Row Level Security (RLS) Policies
-- Berbasis Permission System
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Enable RLS pada tabel permissions & role_permissions
-- 2. Security policies berbasis permission
-- 3. Data isolation per unit kerja
-- 4. Role-based access control dengan permission checking
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 08_role_permissions_seed.sql
--
-- ⚠️ PENTING:
-- - RLS adalah lapisan keamanan UTAMA di database
-- - Frontend HANYA menggunakan permission untuk UI
-- - JANGAN PERNAH percaya JavaScript untuk security!
-- - Service role key bypass RLS (hanya untuk backend/service)
--
-- ARSITEKTUR KEAMANAN:
-- SUPER_ADMIN → Akses semua data (bypass RLS checks)
-- ADMIN       → Data organisasi + sesuai permission
-- VERIFIKATOR→ Data yang bisa diverifikasi + read-only sebagian
-- PENGELOLA_SDMK → Data SDM sesuai kewenangan
-- OPERATOR    → Data unit sendiri SAJA (RLS enforcement)
-- PIMPINAN    → Read-only sesuai kewenangan
-- ============================================

-- ============================================
-- 1. RLS: TABEL PERMISSIONS
-- ============================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa lihat permission (untuk UI)
CREATE POLICY "Authenticated users can view permissions"
    ON public.permissions FOR SELECT
    USING (auth.role() = 'authenticated');

-- Hanya super admin yang bisa modify permissions
CREATE POLICY "Only super_admin can modify permissions"
    ON public.permissions FOR ALL
    USING (is_super_admin() = TRUE)
    WITH CHECK (is_super_admin() = TRUE);

-- ============================================
-- 2. RLS: TABEL ROLE_PERMISSIONS
-- ============================================

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Semua user bisa lihat role_permissions (untuk cek permission sendiri)
CREATE POLICY "Users can view own_role_permissions"
    ON public.role_permissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM roles r 
            JOIN user_profiles up ON up.role_id = r.id 
            WHERE r.id = role_permissions.role_id 
            AND up.user_id = auth.uid()
        )
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

-- Hanya admin/super_admin yang bisa assign permissions
CREATE POLICY "Only admins can manage role_permissions"
    ON public.role_permissions FOR ALL
    USING (
        is_super_admin() = TRUE 
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        is_super_admin() = TRUE 
        OR is_admin_user() = TRUE
    );

-- ============================================
-- 3. RLS: TABEL PROFILES (Update/Enhanced)
-- ============================================

-- Drop existing policies if they exist (for clean re-application)
DROP POLICY IF EXISTS "Users can view own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert users" ON public.profiles;
DROP POLICY IF EXISTS "Only super_admin can delete users" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User bisa lihat profile sendiri, user viewer bisa lihat semua, admin bisa lihat semua
CREATE POLICY "Users can view profiles"
    ON public.profiles FOR SELECT
    USING (
        id = (SELECT id FROM profiles WHERE id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) LIMIT 1)
        OR has_permission('user.view')
        OR is_admin_user() = TRUE
        OR is_super_admin() = TRUE
    );

-- User bisa update profile sendiri
CREATE POLICY "Users can update own_profile"
    ON public.profiles FOR UPDATE
    USING (
        id = (SELECT id FROM profiles WHERE id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) LIMIT 1)
        OR has_permission('user.update')
    )
    WITH CHECK (
        id = (SELECT id FROM profiles WHERE id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) LIMIT 1)
        OR has_permission('user.update')
    );

-- User dengan permission user.create bisa insert
CREATE POLICY "Users with permission can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (
        has_permission('user.create')
        OR is_admin_user() = TRUE
    );

-- Hanya super admin yang bisa delete
CREATE POLICY "Only super_admin can delete profiles"
    ON public.profiles FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 4. RLS: TABEL ROLES (Update/Enhanced)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Only super_admin can modify roles" ON public.roles;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa lihat roles (untuk info)
CREATE POLICY "Authenticated users can view roles"
    ON public.roles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Hanya super_admin atau user dengan permission yang bisa modify roles
CREATE POLICY "Authorized users can modify roles"
    ON public.roles FOR ALL
    USING (
        is_super_admin() = TRUE
        OR has_permission('settings.manage')
    )
    WITH CHECK (
        is_super_admin() = TRUE
        OR has_permission('settings.manage')
    );

-- ============================================
-- 5. RLS: TABEL USER_PROFILES (jika ada terpisah)
-- ============================================

-- Cek apakah tabel user_profiles ada dan sudah punya RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        -- Enable RLS jika belum
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN
            ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own_profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update own_profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Only admins can insert users" ON public.user_profiles;
        DROP POLICY IF EXISTS "Only super_admin can delete users" ON public.user_profiles;
        
        -- Policy: View profile
        CREATE POLICY "User_profiles view policy"
            ON public.user_profiles FOR SELECT
            USING (
                user_id = auth.uid()
                OR has_permission('user.view')
                OR is_admin_user() = TRUE
                OR is_super_admin() = TRUE
            );
        
        -- Policy: Update own profile or with permission
        CREATE POLICY "User_profiles update policy"
            ON public.user_profiles FOR UPDATE
            USING (user_id = auth.uid() OR has_permission('user.update'))
            WITH CHECK (user_id = auth.uid() OR has_permission('user.update'));
        
        -- Policy: Insert with permission
        CREATE POLICY "User_profiles insert policy"
            ON public.user_profiles FOR INSERT
            WITH CHECK (has_permission('user.create') OR is_admin_user() = TRUE);
        
        -- Policy: Delete only super_admin
        CREATE POLICY "User_profiles delete policy"
            ON public.user_profiles FOR DELETE
            USING (is_super_admin() = TRUE);
            
        RAISE NOTICE '✅ RLS policies applied to user_profiles';
    END IF;
END $$;

-- ============================================
-- 6. HELPER FUNCTIONS UNTUK DATA ISOLATION
-- ============================================

-- Fungsi untuk mendapatkan unit_id user saat ini (dari profiles)
CREATE OR REPLACE FUNCTION get_my_unit_id()
RETURNS UUID AS $$
DECLARE
    v_unit_id UUID;
BEGIN
    -- Coba dari profiles table dulu
    BEGIN
        SELECT unit_id INTO v_unit_id 
        FROM profiles 
        WHERE id = (
            SELECT id FROM user_profiles 
            WHERE user_id = auth.uid() 
            LIMIT 1
        )
        LIMIT 1;
        
        IF v_unit_id IS NOT NULL THEN
            RETURN v_unit_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Fallback: cari dari user_profiles langsung jika ada kolom unit_id
    BEGIN
        EXECUTE '
            SELECT unit_id FROM user_profiles 
            WHERE user_id = $1 
            LIMIT 1
        ' INTO v_unit_id USING auth.uid();
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    RETURN v_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah operator (hanya akses unit sendiri)
CREATE OR REPLACE FUNCTION is_operator_only()
RETURNS BOOLEAN AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(v_role_name = 'OPERATOR', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah pimpinan (read-only access)
CREATE OR REPLACE FUNCTION is_pimpinan()
RETURNS BOOLEAN AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(v_role_name = 'PIMPINAN', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah verifikator
CREATE OR REPLACE FUNCTION is_verifikator()
RETURNS BOOLEAN AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(v_role_name = 'VERIFIKATOR', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah pengelola_sdmk
CREATE OR REPLACE FUNCTION is_pengelola_sdmk()
RETURNS BOOLEAN AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.name INTO v_role_name
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(v_role_name = 'PENGELOLA_SDMK', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. SECURITY POLICY PATTERNS (Template)
-- ============================================
-- 
-- Pattern untuk tabel data operasional (SDMK, Competency, dll):
-- 
-- Untuk SELECT:
-- - Super Admin: semua data
-- - Admin: data organisasi/unit yang sama
-- - Verifikator: semua data (untuk verifikasi)
-- - Pengelola SDMK: data sesuai scope
-- - Operator: HANYA data dengan unit_id = unit_id user
-- - Pimpinan: semua data (read-only)
--
-- Contoh implementasi untuk tabel sdm_kesehatan:
/*
ALTER TABLE public.sdm_kesehatan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sdm_select_policy"
    ON public.sdm_kesehatan FOR SELECT
    USING (
        -- Super admin lihat semua
        is_super_admin() = TRUE
        -- Atau user memiliki permission sdmk.view
        OR has_permission('sdmk.view')
        -- Operator hanya lihat data unitnya
        AND (
            NOT is_operator_only()
            OR unit_id = get_my_unit_id()
            OR get_my_unit_id() IS NULL
        )
    );
*/

-- ============================================
-- VERIFIKASI RLS STATUS
-- ============================================

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'permissions',
    'role_permissions', 
    'profiles',
    'roles',
    'user_profiles'
)
ORDER BY tablename;

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS PERMISSIONS BERHASIL DIKONFIGURASI';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabel dengan RLS enabled:';
    RAISE NOTICE '- permissions (read all, manage admin only)';
    RAISE NOTICE '- role_permissions (view assigned, manage admin only)';
    RAISE NOTICE '- profiles (own profile + permission based)';
    RAISE NOTICE '- roles (view all, manage authorized only)';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper functions tersedia:';
    RAISE NOTICE '- get_my_unit_id()';
    RAISE NOTICE '- is_operator_only()';
    RAISE NOTICE '- is_pimpinan()';
    RAISE NOTICE '- is_verifikator()';
    RAISE NOTICE '- is_pengelola_sdmk()';
    RAISE NOTICE '- has_permission(permission_name)';
    RAISE NOTICE '- has_any_permission(...)';
    RAISE NOTICE '- get_user_permissions()';
    RAISE NOTICE '';
END $$;
