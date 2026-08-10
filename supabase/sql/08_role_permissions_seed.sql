-- ============================================
-- PAMUNGKAS - Role Permissions Seed Data
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Mapping role → permissions
-- 2. Setiap role mendapat permission sesuai kewenangan
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 07_permissions_schema.sql
--
-- ROLE DEFINITION:
-- 1. SUPER_ADMIN - Semua permission (full access)
-- 2. ADMIN - Operasional organisasi + user management
-- 3. VERIFIKATOR - Verifikasi data saja
-- 4. PENGELOLA_SDMK - Kelola data SDM & kompetensi
-- 5. OPERATOR - Input data unit sendiri
-- 6. PIMPINAN - Dashboard & laporan (read-only)
-- ============================================

-- ============================================
-- HELPER: Function untuk assign permission ke role
-- ============================================

CREATE OR REPLACE FUNCTION assign_permission_to_role(
    p_role_name TEXT,
    p_permission_name TEXT
) RETURNS VOID AS $$
DECLARE
    v_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Cari role ID
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name LIMIT 1;
    IF v_role_id IS NULL THEN
        RAISE NOTICE '⚠️ Role % tidak ditemukan', p_role_name;
        RETURN;
    END IF;
    
    -- Cari permission ID
    SELECT id INTO v_permission_id FROM permissions WHERE name = p_permission_name LIMIT 1;
    IF v_permission_id IS NULL THEN
        RAISE NOTICE '⚠️ Permission % tidak ditemukan', p_permission_name;
        RETURN;
    END IF;
    
    -- Insert (ignore jika sudah ada)
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. SUPER_ADMIN - SEMUA PERMISSION
-- ============================================

DO $$
DECLARE
    perm RECORD;
BEGIN
    -- Super admin mendapat SEMUA permission yang aktif
    FOR perm IN SELECT id FROM permissions WHERE is_active = TRUE LOOP
        PERFORM assign_permission_to_role('SUPER_ADMIN', 
            (SELECT name FROM permissions WHERE id = perm.id));
    END LOOP;
    
    RAISE NOTICE '✅ SUPER_ADMIN: Semua permission (%) ditetapkan', 
        (SELECT count(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.name = 'SUPER_ADMIN');
END $$;

-- ============================================
-- 2. ADMIN - OPERASIONAL ORGANISASI
-- ============================================

-- Admin bisa mengelola operasional penuh kecuali beberapa super-admin only things
DO $$
BEGIN
    -- DASHBOARD
    PERFORM assign_permission_to_role('ADMIN', 'dashboard.view');
    PERFORM assign_permission_to_role('ADMIN', 'dashboard.access');
    
    -- SDMK - Full access
    PERFORM assign_permission_to_role('ADMIN', 'sdmk.view');
    PERFORM assign_permission_to_role('ADMIN', 'sdmk.create');
    PERFORM assign_permission_to_role('ADMIN', 'sdmk.update');
    PERFORM assign_permission_to_role('ADMIN', 'sdmk.delete');
    PERFORM assign_permission_to_role('ADMIN', 'sdmk.export');
    PERFORM assign_permission_to_role('ADMIN', 'sdmk.import');
    
    -- COMPETENCY - Full access
    PERFORM assign_permission_to_role('ADMIN', 'competency.view');
    PERFORM assign_permission_to_role('ADMIN', 'competency.create');
    PERFORM assign_permission_to_role('ADMIN', 'competency.update');
    PERFORM assign_permission_to_role('ADMIN', 'competency.delete');
    
    -- ACTIVITY/TRAINING - Full access
    PERFORM assign_permission_to_role('ADMIN', 'activity.view');
    PERFORM assign_permission_to_role('ADMIN', 'activity.create');
    PERFORM assign_permission_to_role('ADMIN', 'activity.update');
    PERFORM assign_permission_to_role('ADMIN', 'activity.delete');
    PERFORM assign_permission_to_role('ADMIN', 'activity.approve');
    
    -- PARTICIPANT - Full access
    PERFORM assign_permission_to_role('ADMIN', 'participant.view');
    PERFORM assign_permission_to_role('ADMIN', 'participant.create');
    PERFORM assign_permission_to_role('ADMIN', 'participant.update');
    PERFORM assign_permission_to_role('ADMIN', 'participant.delete');
    
    -- CERTIFICATE - Full access
    PERFORM assign_permission_to_role('ADMIN', 'certificate.view');
    PERFORM assign_permission_to_role('ADMIN', 'certificate.create');
    PERFORM assign_permission_to_role('ADMIN', 'certificate.update');
    
    -- REPORT - View dan export
    PERFORM assign_permission_to_role('ADMIN', 'report.view');
    PERFORM assign_permission_to_role('ADMIN', 'report.export');
    PERFORM assign_permission_to_role('ADMIN', 'report.custom');
    
    -- USER MANAGEMENT - Full access (kecuali delete mungkin)
    PERFORM assign_permission_to_role('ADMIN', 'user.view');
    PERFORM assign_permission_to_role('ADMIN', 'user.create');
    PERFORM assign_permission_to_role('ADMIN', 'user.update');
    PERFORM assign_permission_to_role('ADMIN', 'user.manage_roles');
    PERFORM assign_permission_to_role('ADMIN', 'user.activate_deactivate');
    
    -- SETTINGS - View dan manage
    PERFORM assign_permission_to_role('ADMIN', 'settings.view');
    PERFORM assign_permission_to_role('ADMIN', 'settings.manage');
    PERFORM assign_permission_to_role('ADMIN', 'settings.master_data');
    
    -- ORGANIZATION
    PERFORM assign_permission_to_role('ADMIN', 'organization.view');
    PERFORM assign_permission_to_role('ADMIN', 'organization.manage');
    
    -- AUDIT LOG
    PERFORM assign_permission_to_role('ADMIN', 'audit_log.view');
    PERFORM assign_permission_to_role('ADMIN', 'audit_log.export');
    
    RAISE NOTICE '✅ ADMIN: Permission operasional ditetapkan';
END $$;

-- ============================================
-- 3. VERIFIKATOR - VERIFIKASI DATA SAJA
-- ============================================

DO $$
BEGIN
    -- DASHBOARD
    PERFORM assign_permission_to_role('VERIFIKATOR', 'dashboard.view');
    PERFORM assign_permission_to_role('VERIFIKATOR', 'dashboard.access');
    
    -- SDMK - Hanya view dan verify
    PERFORM assign_permission_to_role('VERIFIKATOR', 'sdmk.view');
    PERFORM assign_permission_to_role('VERIFIKATOR', 'sdmk.verify');
    PERFORM assign_permission_to_role('VERIFIKATOR', 'sdmk.export');
    
    -- COMPETENCY - View dan verify
    PERFORM assign_permission_to_role('VERIFIKATOR', 'competency.view');
    PERFORM assign_permission_to_role('VERIFIKATOR', 'competency.verify');
    
    -- CERTIFICATE - View dan verify
    PERFORM assign_permission_to_role('VERIFIKATOR', 'certificate.view');
    PERFORM assign_permission_to_role('VERIFIKATOR', 'certificate.verify');
    
    -- REPORT - View saja
    PERFORM assign_permission_to_role('VERIFIKATOR', 'report.view');
    PERFORM assign_permission_to_role('VERIFIKATOR', 'report.export');
    
    -- USER - View saja (untuk cek data pengguna)
    PERFORM assign_permission_to_role('VERIFIKATOR', 'user.view');
    
    -- ACTIVITY - View untuk verifikasi
    PERFORM assign_permission_to_role('VERIFIKATOR', 'activity.view');
    
    RAISE NOTICE '✅ VERIFIKATOR: Permission verifikasi ditetapkan';
END $$;

-- ============================================
-- 4. PENGELOLA_SDMK - KELOLA DATA SDM & KOMPETENSI
-- ============================================

DO $$
BEGIN
    -- DASHBOARD
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'dashboard.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'dashboard.access');
    
    -- SDMK - Full CRUD
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'sdmk.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'sdmk.create');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'sdmk.update');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'sdmk.export');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'sdmk.import');
    
    -- COMPETENCY - Full CRUD
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'competency.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'competency.create');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'competency.update');
    
    -- ACTIVITY - View dan create (untuk input kegiatan)
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'activity.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'activity.create');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'activity.update');
    
    -- PARTICIPANT - Manage peserta
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'participant.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'participant.create');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'participant.update');
    
    -- CERTIFICATE - View dan create
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'certificate.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'certificate.create');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'certificate.update');
    
    -- REPORT - View dan export
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'report.view');
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'report.export');
    
    -- USER - View saja (lihat data user terkait)
    PERFORM assign_permission_to_role('PENGELOLA_SDMK', 'user.view');
    
    RAISE NOTICE '✅ PENGELOLA_SDMK: Permission pengelola SDM ditetapkan';
END $$;

-- ============================================
-- 5. OPERATOR - DATA UNIT SENDIRI
-- ============================================

DO $$
BEGIN
    -- DASHBOARD
    PERFORM assign_permission_to_role('OPERATOR', 'dashboard.view');
    PERFORM assign_permission_to_role('OPERATOR', 'dashboard.access');
    
    -- SDMK - Create dan update (data unit sendiri via RLS)
    PERFORM assign_permission_to_role('OPERATOR', 'sdmk.view');
    PERFORM assign_permission_to_role('OPERATOR', 'sdmk.create');
    PERFORM assign_permission_to_role('OPERATOR', 'sdmk.update');
    
    -- COMPETENCY - Create dan update
    PERFORM assign_permission_to_role('OPERATOR', 'competency.view');
    PERFORM assign_permission_to_role('OPERATOR', 'competency.create');
    PERFORM assign_permission_to_role('OPERATOR', 'competency.update');
    
    -- ACTIVITY - View dan create
    PERFORM assign_permission_to_role('OPERATOR', 'activity.view');
    PERFORM assign_permission_to_role('OPERATOR', 'activity.create');
    
    -- PARTICIPANT - Create dan update
    PERFORM assign_permission_to_role('OPERATOR', 'participant.view');
    PERFORM assign_permission_to_role('OPERATOR', 'participant.create');
    PERFORM assign_permission_to_role('OPERATOR', 'participant.update');
    
    -- CERTIFICATE - View saja
    PERFORM assign_permission_to_role('OPERATOR', 'certificate.view');
    
    -- REPORT - View saja
    PERFORM assign_permission_to_role('OPERATOR', 'report.view');
    
    RAISE NOTICE '✅ OPERATOR: Permission input data ditetapkan';
END $$;

-- ============================================
-- 6. PIMPINAN - DASHBOARD & LAPORAN (READ-ONLY)
-- ============================================

DO $$
BEGIN
    -- DASHBOARD
    PERFORM assign_permission_to_role('PIMPINAN', 'dashboard.view');
    PERFORM assign_permission_to_role('PIMPINAN', 'dashboard.access');
    
    -- SDMK - View saja (monitoring)
    PERFORM assign_permission_to_role('PIMPINAN', 'sdmk.view');
    
    -- COMPETENCY - View saja
    PERFORM assign_permission_to_role('PIMPINAN', 'competency.view');
    
    -- ACTIVITY - View saja
    PERFORM assign_permission_to_role('PIMPINAN', 'activity.view');
    
    -- PARTICIPANT - View saja
    PERFORM assign_permission_to_role('PIMPINAN', 'participant.view');
    
    -- CERTIFICATE - View saja
    PERFORM assign_permission_to_role('PIMPINAN', 'certificate.view');
    
    -- REPORT - Full access (untuk monitoring)
    PERFORM assign_permission_to_role('PIMPINAN', 'report.view');
    PERFORM assign_permission_to_role('PIMPINAN', 'report.export');
    PERFORM assign_permission_to_role('PIMPINAN', 'report.custom');
    
    -- USER - View saja
    PERFORM assign_permission_to_role('PIMPINAN', 'user.view');
    
    -- ORGANIZATION - View saja
    PERFORM assign_permission_to_role('PIMPINAN', 'organization.view');
    
    RAISE NOTICE '✅ PIMPINAN: Permission monitoring ditetapkan';
END $$;

-- ============================================
-- VERIFIKASI AKHIR
-- ============================================

-- Tampilkan summary permission per role
SELECT 
    r.name as role_name,
    r.display_name as role_display,
    count(rp.permission_id) as total_permissions,
    array_agg(p.module ORDER BY p.module) as modules_covered
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id AND p.is_active = TRUE
GROUP BY r.name, r.display_name
ORDER BY r.level, r.name;

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SEEDING ROLE PERMISSIONS SELESAI';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTE 'Ringkasan:';
    RAISE NOTE '- SUPER_ADMIN: Semua permission (full access)';
    RAISE NOTE '- ADMIN: Operasional organisasi + user management';
    RAISE NOTE '- VERIFIKATOR: Verifikasi data (SDMK, kompetensi, sertifikat)';
    RAISE NOTE '- PENGELOLA_SDMK: Kelola data SDM & kompetensi';
    RAISE NOTE '- OPERATOR: Input data unit sendiri';
    RAISE NOTE '- PIMPINAN: Dashboard & laporan (read-only)';
    RAISE NOTICE '';
END $$;

-- Cleanup helper function (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS assign_permission_to_role(TEXT, TEXT);
