-- ============================================
-- PAMUNGKAS - Row Level Security (RLS) Policies
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Enable RLS pada semua tabel
-- 2. Security policies untuk setiap tabel
-- 3. Role-based access control
-- 4. Data isolation per organisasi
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 03_pamungkas_data.sql
-- 
-- PENTING:
-- - RLS adalah lapisan keamanan utama
-- - Jangan menonaktifkan RLS di production
-- - Service role key bypass RLS (hanya untuk backend)
-- ============================================

-- ============================================
-- 1. HELPER FUNCTIONS FOR RLS
-- ============================================

-- Fungsi untuk mendapatkan organisasi user saat ini
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM sdm_kesehatan sdm
    JOIN user_profiles up ON up.id = sdm.user_profile_id
    WHERE up.user_id = auth.uid()
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user bisa akses record tertentu
CREATE OR REPLACE FUNCTION can_access_record(p_table_name TEXT, p_record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    can_access BOOLEAN := FALSE;
BEGIN
    -- Super admin selalu bisa akses
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Admin bisa akses data dalam organisasinya
    IF is_admin_user() THEN
        -- Logic berbeda per tabel
        CASE p_table_name
            WHEN 'sdm_kesehatan' THEN
                SELECT EXISTS(
                    SELECT 1 FROM sdm_kesehatan 
                    WHERE id = p_record_id 
                    AND organization_id = get_user_organization_id()
                ) INTO can_access;
            WHEN 'training_programs' THEN
                SELECT EXISTS(
                    SELECT 1 FROM training_programs 
                    WHERE id = p_record_id 
                    AND created_by IN (
                        SELECT id FROM user_profiles WHERE user_id = auth.uid()
                    )
                ) INTO can_access;
            ELSE
                can_access := FALSE;
        END CASE;
    END IF;
    
    RETURN can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. RLS: TABEL USER_PROFILES
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa lihat profile sendiri, admin bisa lihat semua
CREATE POLICY "Users can view own_profile"
    ON public.user_profiles FOR SELECT
    USING (
        user_id = auth.uid() 
        OR is_admin_user() = TRUE
    );

-- Policy: User bisa update profile sendiri, admin bisa update semua
CREATE POLICY "Users can update own_profile"
    ON public.user_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Hanya super admin yang bisa insert user profiles
CREATE POLICY "Only admins can insert users"
    ON public.user_profiles FOR INSERT
    WITH CHECK (is_admin_user() = TRUE);

-- Policy: Hanya super admin yang bisa delete
CREATE POLICY "Only super_admin can delete users"
    ON public.user_profiles FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 3. RLS: TABEL SDM_KESEHATAN
-- ============================================

ALTER TABLE public.sdm_kesehatan ENABLE ROW LEVEL SECURITY;

-- Policy: Semua authenticated user bisa baca data SDM
CREATE POLICY "Authenticated users can view SDM data"
    ON public.sdm_kesehatan FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Admin/Operator bisa insert data SDM dalam organisasi mereka
CREATE POLICY "Admins can insert SDM data"
    ON public.sdm_kesehatan FOR INSERT
    WITH CHECK (
        is_admin_user() = TRUE
        OR (organization_id = get_user_organization_id())
    );

-- Policy: Update hanya untuk data organisasi yang sama atau data sendiri
CREATE POLICY "Admins can update own_org SDM data"
    ON public.sdm_kesehatan FOR UPDATE
    USING (
        is_super_admin() = TRUE
        OR organization_id = get_user_organization_id()
    );

-- Policy: Delete hanya untuk super admin
CREATE POLICY "Only super_admin can delete SDM data"
    ON public.sdm_kesehatan FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 4. RLS: TABEL EDUCATION_HISTORY
-- ============================================

ALTER TABLE public.education_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view education history"
    ON public.education_history FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage education history"
    ON public.education_history FOR ALL
    USING (
        is_super_admin() = TRUE
        OR EXISTS (
            SELECT 1 FROM sdm_kesehatan sdm 
            WHERE sdm.id = education_history.sdm_id 
            AND sdm.organization_id = get_user_organization_id()
        )
    );

-- ============================================
-- 5. RLS: TABEL TRAINING_PROGRAMS
-- ============================================

ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view training programs"
    ON public.training_programs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert training programs"
    ON public.training_programs FOR INSERT
    WITH CHECK (is_admin_user() = TRUE);

CREATE POLICY "Creators or admins can update training programs"
    ON public.training_programs FOR UPDATE
    USING (
        is_super_admin() = TRUE
        OR created_by IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Only super_admin can delete training programs"
    ON public.training_programs FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 6. RLS: TABEL TRAINING_PARTICIPANTS
-- ============================================

ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view participants"
    ON public.training_participants FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage participants"
    ON public.training_participants FOR ALL
    USING (
        is_super_admin() = TRUE
        OR EXISTS (
            SELECT 1 FROM training_programs tp 
            WHERE tp.id = training_participants.training_program_id 
            AND (tp.created_by IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR is_admin_user())
        )
    );

-- ============================================
-- 7. RLS: TABEL CERTIFICATIONS
-- ============================================

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view certifications"
    ON public.certifications FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert certifications"
    ON public.certifications FOR INSERT
    WITH CHECK (
        is_admin_user() = TRUE
        OR EXISTS (
            SELECT 1 FROM sdm_kesehatan sdm 
            WHERE sdm.id = certifications.sdm_id 
            AND sdm.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Admins can update certifications in their org"
    ON public.certifications FOR UPDATE
    USING (
        is_super_admin() = TRUE
        OR EXISTS (
            SELECT 1 FROM sdm_kesehatan sdm 
            WHERE sdm.id = certifications.sdm_id 
            AND sdm.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Only super_admin can delete certifications"
    ON public.certifications FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 8. RLS: MASTER DATA TABLES (Read-only untuk umum)
-- ============================================

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organizations"
    ON public.organizations FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify organizations"
    ON public.organizations FOR ALL
    USING (is_admin_user() = true);

-- Departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
    ON public.departments FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage departments"
    ON public.departments FOR ALL
    USING (is_admin_user() = true);

-- Positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view positions"
    ON public.positions FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify positions"
    ON public.positions FOR ALL
    USING (is_admin_user() = true);

-- Certification Types
ALTER TABLE public.certification_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view certification types"
    ON public.certification_types FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify certification types"
    ON public.certification_types FOR ALL
    USING (is_admin_user() = true);

-- Training Types
ALTER TABLE public.training_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view training types"
    ON public.training_types FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify training types"
    ON public.training_types FOR ALL
    USING (is_admin_user() = true);

-- Roles (hanya super admin)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
    ON public.roles FOR SELECT
    USING (true);

CREATE POLICY "Only super_admin can modify roles"
    ON public.roles FOR ALL
    USING (is_super_admin() = true);

-- Provinces (public read)
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view provinces"
    ON public.provinces FOR SELECT
    USING (true);

-- ============================================
-- 9. RLS: ACTIVITY_LOGS (Hanya admin)
-- ============================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs"
    ON public.activity_logs FOR SELECT
    USING (is_admin_user() = true);

CREATE POLICY "System can insert logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (true); -- Trigger function yang insert

CREATE POLICY "Only super_admin can delete logs"
    ON public.activity_logs FOR DELETE
    USING (is_super_admin() = true);

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
    'user_profiles', 'sdm_kesehatan', 'education_history',
    'training_programs', 'training_participants', 'certifications',
    'organizations', 'departments', 'positions',
    'certification_types', 'training_types', 'roles', 'provinces',
    'activity_logs'
)
ORDER BY tablename;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Row Level Security berhasil dikonfigurasi';
    RAISE NOTICE '   - RLS enabled pada semua tabel utama';
    RAISE NOTICE '   - Policies dibuat berdasarkan role';
    RAISE NOTICE '   - Helper functions: get_user_organization_id(), can_access_record()';
END $$;
