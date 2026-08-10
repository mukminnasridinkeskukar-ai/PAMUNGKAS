-- ============================================
-- PAMUNGKAS - Permissions & Role Permissions Schema
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Tabel permissions (daftar semua permission)
-- 2. Tabel role_permissions (relasi role-permission)
-- 3. Helper functions untuk permission checking
-- 4. View untuk user permissions lengkap
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 01_auth_users_roles.sql
--
-- ARSITEKTUR:
-- roles → role_permissions → permissions
-- 
-- KEAMANAN:
-- - Permission checking dilakukan di database level (RLS)
-- - Frontend hanya menggunakan permission untuk UI
-- - JANGAN percaya role dari JavaScript sebagai security!
-- ============================================

-- ============================================
-- 1. TABEL PERMISSIONS
-- ============================================

-- Tabel definisi permission granular
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Permission identifier (format: module.action)
    -- Contoh: sdmk.view, user.create, report.export
    name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Display name untuk UI
    display_name VARCHAR(200) NOT NULL,
    
    -- Deskripsi detail
    description TEXT,
    
    -- Module/grouping (dashboard, sdmk, competency, activity, dll)
    module VARCHAR(50) NOT NULL DEFAULT 'general',
    
    -- Action type (view, create, update, delete, verify, export, manage)
    action VARCHAR(20) NOT NULL DEFAULT 'view',
    
    -- Sorting order
    sort_order INT DEFAULT 0,
    
    -- Status aktif/non-aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.permissions IS 'Tabel definisi permission granular untuk sistem PAMUNGKAS';
COMMENT ON COLUMN public.permissions.name IS 'Identifier permission (format: module.action)';
COMMENT ON COLUMN public.permissions.module IS 'Module pengelompokan (dashboard, sdmk, competency, dll)';
COMMENT ON COLUMN public.permissions.action IS 'Tipe aksi (view, create, update, delete, verify, export)';

-- Index untuk pencarian permission
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON public.permissions(is_active);

-- ============================================
-- 2. TABEL ROLE_PERMISSIONS (Junction Table)
-- ============================================

-- Tabel relasi many-to-many antara roles dan permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key ke tabel roles
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    
    -- Foreign key ke tabel permissions
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Unique constraint: satu role tidak bisa memiliki permission yang sama dua kali
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Tabel junction relasi role-permission (many-to-many)';
COMMENT ON COLUMN public.role_permissions.role_id IS 'Foreign key ke tabel roles';
COMMENT ON COLUMN public.role_permissions.permission_id IS 'Foreign key ke tabel permissions';

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- ============================================
-- 3. TRIGGER: UPDATED_AT UNTUK PERMISSIONS
-- ============================================

CREATE TRIGGER on_permissions_updated
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. SEED PERMISSIONS (Data Awal)
-- ============================================

-- Insert default permissions jika belum ada
INSERT INTO public.permissions (name, display_name, description, module, action, sort_order) VALUES
    -- DASHBOARD MODULE
    ('dashboard.view', 'Lihat Dashboard', 'Melihat halaman dashboard utama', 'dashboard', 'view', 1),
    ('dashboard.access', 'Akses Dashboard', 'Mengakses menu dashboard', 'dashboard', 'access', 2),
    
    -- SDMK (SDM KESEHATAN) MODULE
    ('sdmk.view', 'Lihat Data SDM', 'Melihat data SDM kesehatan', 'sdmk', 'view', 10),
    ('sdmk.create', 'Tambah Data SDM', 'Menambahkan data SDM kesehatan baru', 'sdmk', 'create', 11),
    ('sdmk.update', 'Edit Data SDM', 'Mengubah data SDM kesehatan', 'sdmk', 'update', 12),
    ('sdmk.delete', 'Hapus Data SDM', 'Menghapus data SDM kesehatan', 'sdmk', 'delete', 13),
    ('sdmk.verify', 'Verifikasi Data SDM', 'Memverifikasi data SDM kesehatan', 'sdmk', 'verify', 14),
    ('sdmk.export', 'Export Data SDM', 'Mengekspor data SDM kesehatan', 'sdmk', 'export', 15),
    ('sdmk.import', 'Import Data SDM', 'Mengimpor data SDM kesehatan', 'sdmk', 'import', 16),
    
    -- COMPETENCY MODULE
    ('competency.view', 'Lihat Kompetensi', 'Melihat data kompetensi', 'competency', 'view', 20),
    ('competency.create', 'Tambah Kompetensi', 'Menambahkan data kompetensi baru', 'competency', 'create', 21),
    ('competency.update', 'Edit Kompetensi', 'Mengubah data kompetensi', 'competency', 'update', 22),
    ('competency.delete', 'Hapus Kompetensi', 'Menghapus data kompetensi', 'competency', 'delete', 23),
    ('competency.verify', 'Verifikasi Kompetensi', 'Memverifikasi data kompetensi', 'competency', 'verify', 24),
    
    -- ACTIVITY/TRAINING MODULE
    ('activity.view', 'Lihat Aktivitas', 'Melihat data aktivitas/kegiatan pelatihan', 'activity', 'view', 30),
    ('activity.create', 'Tambah Aktivitas', 'Menambahkan aktivitas/kegiatan baru', 'activity', 'create', 31),
    ('activity.update', 'Edit Aktivitas', 'Mengubah data aktivitas/kegiatan', 'activity', 'update', 32),
    ('activity.delete', 'Hapus Aktivitas', 'Menghapus data aktivitas/kegiatan', 'activity', 'delete', 33),
    ('activity.approve', 'Setujui Aktivitas', 'Menyetujui aktivitas/kegiatan', 'activity', 'approve', 34),
    
    -- PARTICIPANT MODULE
    ('participant.view', 'Lihat Peserta', 'Melihat data peserta kegiatan', 'participant', 'view', 40),
    ('participant.create', 'Tambah Peserta', 'Menambahkan peserta kegiatan', 'participant', 'create', 41),
    ('participant.update', 'Edit Peserta', 'Mengubah data peserta', 'participant', 'update', 42),
    ('participant.delete', 'Hapus Peserta', 'Menghapus data peserta', 'participant', 'delete', 43),
    
    -- CERTIFICATE MODULE
    ('certificate.view', 'Lihat Sertifikat', 'Melihat data sertifikat', 'certificate', 'view', 50),
    ('certificate.create', 'Buat Sertifikat', 'Membuat sertifikat baru', 'certificate', 'create', 51),
    ('certificate.update', 'Edit Sertifikat', 'Mengubah data sertifikat', 'certificate', 'update', 52),
    ('certificate.verify', 'Verifikasi Sertifikat', 'Memverifikasi sertifikat', 'certificate', 'verify', 53),
    
    -- REPORT MODULE
    ('report.view', 'Lihat Laporan', 'Melihat laporan', 'report', 'view', 60),
    ('report.export', 'Export Laporan', 'Mengekspor laporan (PDF/Excel)', 'report', 'export', 61),
    ('report.custom', 'Laporan Kustom', 'Membuat laporan kustom', 'report', 'custom', 62),
    
    -- USER MANAGEMENT MODULE
    ('user.view', 'Lihat User', 'Melihat data user/pengguna', 'user', 'view', 70),
    ('user.create', 'Buat User', 'Membuat user baru', 'user', 'create', 71),
    ('user.update', 'Edit User', 'Mengubah data user', 'user', 'update', 72),
    ('user.delete', 'Hapus User', 'Menghapus user', 'user', 'delete', 73),
    ('user.manage_roles', 'Kelola Role', 'Mengelola role user', 'user', 'manage_roles', 74),
    ('user.manage_permissions', 'Kelola Permission', 'Mengelola permission', 'user', 'manage_permissions', 75),
    ('user.activate_deactivate', 'Aktif/Nonaktif User', 'Mengaktifkan/menonaktifkan user', 'user', 'activate_deactivate', 76),
    
    -- SETTINGS MODULE
    ('settings.view', 'Lihat Pengaturan', 'Melihat pengaturan sistem', 'settings', 'view', 80),
    ('settings.manage', 'Kelola Pengaturan', 'Mengubah pengaturan sistem', 'settings', 'manage', 81),
    ('settings.master_data', 'Data Master', 'Mengelola data master (unit kerja, jabatan, dll)', 'settings', 'master_data', 82),
    
    -- ORGANIZATION/UNIT MODULE
    ('organization.view', 'Lihat Organisasi', 'Melihat data organisasi/unit kerja', 'organization', 'view', 90),
    ('organization.manage', 'Kelola Organisasi', 'Mengelola data organisasi/unit kerja', 'organization', 'manage', 91),
    
    -- AUDIT LOG MODULE
    ('audit_log.view', 'Lihat Log Audit', 'Melihat log audit sistem', 'audit_log', 'view', 100),
    ('audit_log.export', 'Export Log Audit', 'Mengekspor log audit', 'audit_log', 'export', 101)

ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. HELPER FUNCTIONS FOR PERMISSION CHECKING
-- ============================================

-- Fungsi untuk cek apakah user memiliki permission tertentu
-- Ini digunakan dalam RLS policies
CREATE OR REPLACE FUNCTION has_permission(p_permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_perm BOOLEAN := FALSE;
BEGIN
    -- Cek apakah user terautentikasi
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Query: user → profile → role → role_permissions → permission
    SELECT EXISTS(
        SELECT 1 
        FROM user_profiles up
        JOIN role_permissions rp ON rp.role_id = up.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE up.user_id = auth.uid()
        AND p.name = p_permission_name
        AND p.is_active = TRUE
        AND up.is_active = TRUE
    ) INTO v_has_perm;
    
    RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user memiliki salah satu dari beberapa permission
CREATE OR REPLACE FUNCTION has_any_permission(VARIADIC p_permission_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin selalu return true
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Cek setiap permission
    FOR i IN 1..array_length(p_permission_names, 1) LOOP
        IF has_permission(p_permission_names[i]) THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk mendapatkan semua permission user saat ini
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TEXT[] AS $$
DECLARE
    v_permissions TEXT[] := '{}';
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN v_permissions;
    END IF;
    
    SELECT COALESCE(array_agg(p.name ORDER BY p.module, p.sort_order), '{}')
    INTO v_permissions
    FROM user_profiles up
    JOIN role_permissions rp ON rp.role_id = up.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE up.user_id = auth.uid()
    AND p.is_active = TRUE
    AND up.is_active = TRUE;
    
    RETURN v_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk mendapatkan unit_id user saat ini
CREATE OR REPLACE FUNCTION get_current_user_unit_id()
RETURNS UUID AS $$
DECLARE
    v_unit_id UUID;
BEGIN
    SELECT unit_id INTO v_unit_id
    FROM profiles
    WHERE id = (
        SELECT id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1
    )
    LIMIT 1;
    
    RETURN v_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. VIEW: V_USER_PERMISSIONS
-- ============================================

-- View untuk mendapatkan lengkap info user + roles + permissions
CREATE OR REPLACE VIEW public.v_user_permissions AS
SELECT 
    u.id as auth_uid,
    u.email,
    u.raw_user_meta_data,
    up.id as profile_id,
    up.full_name,
    up.phone,
    up.avatar_url,
    up.unit_id,
    up.position,
    up.is_active as profile_active,
    r.id as role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    r.description as role_description,
    r.level as role_level,
    array_agg(DISTINCT p.name) as permissions,
    array_agg(DISTINCT p.module) as modules,
    up.created_at as profile_created_at,
    up.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN roles r ON r.id = up.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id AND p.is_active = TRUE
GROUP BY u.id, u.email, u.raw_user_meta_data, up.id, r.id;

COMMENT ON VIEW public.v_user_permissions IS 'View lengkap: user + profile + role + permissions';

-- ============================================
-- VERIFIKASI
-- ============================================

-- Cek apakah tabel sudah terbuat dengan benar
SELECT 
    'permissions' as table_name, count(*) as row_count 
FROM public.permissions
UNION ALL
SELECT 
    'role_permissions' as table_name, count(*) 
FROM public.role_permissions;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Permissions & Role Permissions schema berhasil dibuat';
    RAISE NOTICE '   - Tabel: permissions (%)', (SELECT count(*) FROM permissions);
    RAISE NOTICE '   - Tabel: role_permissions';
    RAISE NOTICE '   - Functions: has_permission(), has_any_permission(), get_user_permissions(), get_current_user_unit_id()';
    RAISE NOTICE '   - View: v_user_permissions';
END $$;
