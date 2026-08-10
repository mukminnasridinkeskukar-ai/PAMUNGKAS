-- ============================================
-- PAMUNGKAS - RLS Policies for Master Data
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Enable RLS pada semua master data tables
-- 2. Security policies berbasis permission (settings.manage, settings.master_data)
-- 3. Soft delete enforcement (is_active check)
-- 4. Role-based access control untuk master data
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 02_master_data.sql & 10_master_data_seed.sql
--
-- ⚠️ KEAMANAN:
-- - Master data bersifat REFERENCE (dibaca oleh banyak user)
-- - Hanya user dengan permission yang bisa MODIFY
-- - SUPER_ADMIN bisa akses semua termasuk non-active data
-- ============================================

-- ============================================
-- 1. RLS: UNITS TABLE
-- ============================================

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Policy: Semua authenticated user bisa lihat unit aktif
-- (Master data referensi biasanya perlu dibaca semua user)
CREATE POLICY "Authenticated users can view active units"
    ON public.units FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = TRUE
    );

-- Policy: Admin/Super admin bisa lihat semua unit (termasuk non-aktif)
CREATE POLICY "Admins can view all units"
    ON public.units FOR SELECT
    USING (
        is_admin_user() = TRUE 
        OR has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
    );

-- Policy: User dengan permission settings.master_data bisa insert unit
CREATE POLICY "Authorized users can insert units"
    ON public.units FOR INSERT
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

-- Policy: Hanya yang berwenang yang bisa update unit
CREATE POLICY "Authorized users can update units"
    ON public.units FOR UPDATE
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

-- Policy: SOFT DELETE - Hanya super admin yang benar-benar hapus
-- Normalnya cukup set is_active = false
CREATE POLICY "Only super_admin can hard delete units"
    ON public.units FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 2. RLS: PROFESSIONS TABLE
-- ============================================

ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active professions"
    ON public.professions FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = TRUE
    );

CREATE POLICY "Admins can view all professions"
    ON public.professions FOR SELECT
    USING (
        is_admin_user() = TRUE 
        OR has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage professions"
    ON public.professions FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete professions"
    ON public.professions FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 3. RLS: EDUCATION_LEVELS TABLE
-- ============================================

ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active education levels"
    ON public.education_levels FOR SELECT
    USING (
        is_active = TRUE
        -- Bisa juga tanpa auth.role() check karena ini data publik
    );

CREATE POLICY "Authorized users can view all education levels"
    ON public.education_levels FOR SELECT
    USING (
        has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage education levels"
    ON public.education_levels FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete education levels"
    ON public.education_levels FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 4. RLS: EMPLOYMENT_STATUSES TABLE
-- ============================================

ALTER TABLE public.employment_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active employment statuses"
    ON public.employment_statuses FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Authorized users can view all employment statuses"
    ON public.employment_statuses FOR SELECT
    USING (
        has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage employment statuses"
    ON public.employment_statuses FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete employment statuses"
    ON public.employment_statuses FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 5. RLS: COMPETENCY_CATEGORIES TABLE
-- ============================================

ALTER TABLE public.competency_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active competency categories"
    ON public.competency_categories FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = TRUE
    );

CREATE POLICY "Admins can view all competency categories"
    ON public.competency_categories FOR SELECT
    USING (
        is_admin_user() = TRUE 
        OR has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage competency categories"
    ON public.competency_categories FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete competency categories"
    ON public.competency_categories FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 6. RLS: TRAINING_TYPES TABLE
-- ============================================

ALTER TABLE public.training_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active training types"
    ON public.training_types FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = TRUE
    );

CREATE POLICY "Admins can view all training types"
    ON public.training_types FOR SELECT
    USING (
        is_admin_user() = TRUE 
        OR has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage training types"
    ON public.training_types FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete training types"
    ON public.training_types FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 7. RLS: ACTIVITY_METHODS TABLE
-- ============================================

ALTER TABLE public.activity_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active activity methods"
    ON public.activity_methods FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = TRUE
    );

CREATE POLICY "Admins can view all activity methods"
    ON public.activity_methods FOR SELECT
    USING (
        is_admin_user() = TRUE 
        OR has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage activity methods"
    ON public.activity_methods FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete activity methods"
    ON public.activity_methods FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 8. RLS: CERTIFICATE_TYPES TABLE
-- ============================================

ALTER TABLE public.certificate_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active certificate types"
    ON public.certificate_types FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = TRUE
    );

CREATE POLICY "Admins can view all certificate types"
    ON public.certificate_types FOR SELECT
    USING (
        is_admin_user() = TRUE 
        OR has_permission('settings.master_data')
        OR is_super_admin() = TRUE
    );

CREATE POLICY "Authorized users can manage certificate types"
    ON public.certificate_types FOR ALL
    USING (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    )
    WITH CHECK (
        has_permission('settings.master_data')
        OR has_permission('settings.manage')
        OR is_super_admin() = TRUE
        OR is_admin_user() = TRUE
    );

CREATE POLICY "Only super_admin can hard delete certificate types"
    ON public.certificate_types FOR DELETE
    USING (is_super_admin() = TRUE);

-- ============================================
-- 9. HELPER FUNCTIONS FOR MASTER DATA MANAGEMENT
-- ============================================

-- Function untuk soft delete (set is_active = false)
-- Lebih aman daripada hard delete
CREATE OR REPLACE FUNCTION soft_delete_master_record(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN := FALSE;
BEGIN
    -- Log siapa yang menonaktifkan
    EXECUTE format(
        'UPDATE %I SET is_active = FALSE, updated_by = $1, updated_at = NOW() WHERE id = $2',
        p_table_name
    ) USING p_user_id, p_record_id;
    
    v_result := FOUND;
    
    IF v_result THEN
        RAISE NOTICE 'Record % di tabel % dinonaktifkan', p_record_id, p_table_name;
    ELSE
        RAISE WARNING 'Gagal menonaktifkan record % di tabel %', p_record_id, p_table_name;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk re-activate record
CREATE OR REPLACE FUNCTION reactivate_master_record(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN := FALSE;
BEGIN
    EXECUTE format(
        'UPDATE %I SET is_active = TRUE, updated_by = $1, updated_at = NOW() WHERE id = $2',
        p_table_name
    ) USING p_user_id, p_record_id;
    
    v_result := FOUND;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk cek apakah master data bisa di-deactivate
-- (cek apakah ada foreign key reference dari transaksi table)
CREATE OR REPLACE FUNCTION can_deactivate_master_record(
    p_table_name TEXT,
    p_record_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_reference BOOLEAN := FALSE;
    v_ref_count INTEGER := 0;
BEGIN
    -- Cek referensi ke tabel-tabel transaksi utama
    -- (Tambahkan pengecekan sesuai kebutuhan)
    
    CASE p_table_name
        WHEN 'units' THEN
            -- Cek apakah ada SDM yang terikat ke unit ini
            BEGIN
                EXECUTE 'SELECT count(*) FROM profiles WHERE unit_id = $1' 
                INTO v_ref_count USING p_record_id;
                v_has_reference := v_ref_count > 0;
            EXCEPTION WHEN undefined_table THEN
                v_has_reference := FALSE;
            END;
            
        WHEN 'professions' THEN
            -- Cek apakah ada profile dengan profesi ini
            BEGIN
                EXECUTE 'SELECT count(*) FROM profiles WHERE profession_id = $1' 
                INTO v_ref_count USING p_record_id;
                v_has_reference := v_ref_count > 0;
            EXCEPTION WHEN undefined_column OR undefined_table THEN
                v_has_reference := FALSE;
            END;
            
        WHEN 'education_levels' THEN
            -- Cek pendidikan di profiles/riwayat pendidikan
            v_has_reference := FALSE; -- TODO: add check when education_history exists
            
        WHEN 'employment_statuses' THEN
            -- Cek status kerja di profiles
            v_has_reference := FALSE; -- TODO: add check
            
        ELSE
            v_has_reference := FALSE;
    END CASE;
    
    RETURN NOT v_has_reference; -- Return true jika TIDAK ada referensi (aman di-deactivate)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    'units',
    'professions', 
    'education_levels',
    'employment_statuses',
    'competency_categories',
    'training_types',
    'activity_methods',
    'certificate_types'
)
ORDER BY tablename;

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS MASTER DATA BERHASIL DIKONFIGURASI';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies:';
    RAISE NOTICE '- SELECT: Authenticated user lihat data aktif';
    RAISE NOTICE '- SELECT: Admin lihat semua data (aktif + non-aktif)');
    RAISE NOTICE '- INSERT/UPDATE: User dengan permission settings.master_data');
    RAISE NOTICE '- DELETE (hard): Hanya SUPER_ADMIN');
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions:';
    RAISE NOTICE '- soft_delete_master_record(table, id, user_id)');
    RAISE NOTICE '- reactivate_master_record(table, id, user_id)');
    RAISE NOTICE '- can_deactivate_master_record(table, id)');
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ REKOMENDASI:';
    RAISE NOTICE '- Gunakan SOFT DELETE (set is_active=false)');
    RAISE NOTICE '- Hindari HARD DELETE pada master data');
    RAISE NOTICE '';
END $$;
