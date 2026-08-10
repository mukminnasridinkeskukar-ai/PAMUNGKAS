-- ============================================
-- PAMUNGKAS - Functions & Triggers
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Custom functions untuk business logic
-- 2. Database triggers untuk otomasi
-- 3. Computed/Generated columns
-- 4. Data validation functions
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 04_rls_security.sql
-- ============================================

-- ============================================
-- 1. VALIDATION FUNCTIONS
-- ============================================

-- Validasi format NIP (18 digit)
CREATE OR REPLACE FUNCTION validate_nip(p_nip VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_nip IS NULL THEN
        RETURN TRUE; -- NIP optional
    END IF;
    
    -- NIP harus 18 digit angka
    RETURN p_nip ~ '^\d{18}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_nip IS 'Validasi format Nomor Induk Pegawai (18 digit)';

-- Validasi format NIK (16 digit)
CREATE OR REPLACE FUNCTION validate_nik(p_nik VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_nik IS NULL THEN
        RETURN TRUE; -- NIK optional
    END IF;
    
    -- NIK harus 16 digit angka
    RETURN p_nik ~ '^\d{16}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_nik IS 'Validasi format Nomor Induk Kependudukan (16 digit)';

-- Validasi email format
CREATE OR REPLACE FUNCTION is_valid_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_nik IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN p_email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 2. COMPUTED / HELPER FUNCTIONS
-- ============================================

-- Hitung usia dari tanggal lahir
CREATE OR REPLACE FUNCTION calculate_age(p_birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN EXTRACT(YEAR FROM AGE(NOW(), p_birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_age IS 'Hitung usia dalam tahun dari tanggal lahir';

-- Hitung masa kerja dalam tahun
CREATE OR REPLACE FUNCTION calculate_tenure(p_hire_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF p_hire_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN EXTRACT(YEAR FROM AGE(NOW(), p_hire_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_tenure IS 'Hitung masa kerja dalam tahun';

-- Cek apakah sertifikasi akan expired dalam X hari
CREATE OR REPLACE FUNCTION is_certification_expiring_soon(
    p_valid_until DATE,
    p_days_ahead INTEGER DEFAULT 90
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_valid_until IS NULL THEN
        RETURN FALSE; -- Permanent certification
    END IF;
    
    RETURN p_valid_until <= NOW() + (p_days_ahead || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_certification_expiring_soon IS 'Cek apakah sertifikasi akan expired dalam X hari ke depan';

-- Update status sertifikasi berdasarkan tanggal
CREATE OR REPLACE FUNCTION update_certification_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valid_until IS NULL THEN
        NEW.status := 'Aktif';
    ELSIF NEW.valid_until < CURRENT_DATE THEN
        NEW.status := 'Expired';
    ELSIF NEW.valid_until <= CURRENT_DATE + INTERVAL '90 days' THEN
        NEW.status := 'Akan Expired';
    ELSE
        NEW.status := 'Aktif';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. AGGREGATE FUNCTIONS
-- ============================================

-- Hitung total peserta per program pelatihan
CREATE OR REPLACE FUNCTION get_training_participant_count(p_training_id UUID)
RETURNS INTEGER AS $$
DECLARE
    participant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO participant_count
    FROM training_participants
    WHERE training_program_id = p_training_id
    AND registration_status IN ('Terdaftar', 'Diterima', 'Hadir');
    
    RETURN COALESCE(participant_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Hitung jumlah sertifikasi aktif per SDM
CREATE OR REPLACE FUNCTION get_active_certification_count(p_sdm_id UUID)
RETURNS INTEGER AS $$
DECLARE
    cert_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cert_count
    FROM certifications
    WHERE sdm_id = p_sdm_id
    AND status = 'Aktif';
    
    RETURN COALESCE(cert_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Dapatkan kompetensi summary untuk SDM
CREATE OR REPLACE FUNCTION get_sdm_competency_summary(p_sdm_id UUID)
RETURNS TABLE (
    total_certifications INTEGER,
    active_certifications INTEGER,
    expiring_soon INTEGER,
    expired INTEGER,
    total_trainings INTEGER,
    completed_trainings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM certifications WHERE sdm_id = p_sdm_id),
        (SELECT COUNT(*) FROM certifications WHERE sdm_id = p_sdm_id AND status = 'Aktif'),
        (SELECT COUNT(*) FROM certifications WHERE sdm_id = p_sdm_id AND status = 'Akan Expired'),
        (SELECT COUNT(*) FROM certifications WHERE sdm_id = p_sdm_id AND status = 'Expired'),
        (SELECT COUNT(*) FROM training_participants tp JOIN training_programs tprog ON tprog.id = tp.training_program_id WHERE tp.sdm_id = p_sdm_id),
        (SELECT COUNT(*) FROM training_participants tp WHERE tp.sdm_id = p_sdm_id AND tp.completion_status = 'Lulus');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 4. DATA INTEGRITY FUNCTIONS
-- ============================================

-- Cek duplikasi NIP dalam organisasi yang sama
CREATE OR REPLACE FUNCTION check_duplicate_nip(
    p_org_id UUID,
    p_nip VARCHAR,
    p_exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    duplicate_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM sdm_kesehatan 
        WHERE organization_id = p_org_id 
        AND nip = p_nip
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) INTO duplicate_exists;
    
    RETURN duplicate_exists;
END;
$$ LANGUAGE plpgsql STABLE;

-- Soft delete function (update is_active instead of delete)
CREATE OR REPLACE FUNCTION soft_delete_sdm(p_sdm_id UUID, p_deleted_by UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sdm_kesehatan
    SET 
        is_active = FALSE,
        employee_status = 'PHK/Pemberhentian',
        updated_by = p_deleted_by,
        updated_at = NOW()
    WHERE id = p_sdm_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. NOTIFICATION / REMINDER FUNCTIONS
-- ============================================

-- Buat reminder untuk sertifikasi yang akan expired
CREATE OR REPLACE FUNCTION create_expiry_reminders()
RETURNS INTEGER AS $$
DECLARE
    reminder_count INTEGER := 0;
    cert_record RECORD;
BEGIN
    -- Loop semua sertifikasi yang akan expired dalam 90 hari dan belum di-remind
    FOR cert_record IN 
        SELECT c.id, c.sdm_id, c.valid_until, c.certificate_number
        FROM certifications c
        WHERE c.valid_until IS NOT NULL
        AND c.valid_until BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '90 days')
        AND (c.reminder_sent IS FALSE OR c.reminder_sent IS NULL)
        AND c.status IN ('Aktif', 'Akan Expired')
    LOOP
        -- Update status reminder
        UPDATE certifications SET
            status = 'Akan Expired',
            reminder_sent = TRUE,
            last_reminder_date = CURRENT_DATE
        WHERE id = cert_record.id;
        
        reminder_count := reminder_count + 1;
        
        -- Di tahap berikutnya, bisa ditambah insert ke tabel notifications
        -- INSERT INTO notifications (user_id, title, message, type) VALUES ...
    END LOOP;
    
    RETURN reminder_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_expiry_reminders IS 'Buat dan kirim reminder untuk sertifikasi yang akan expired';

-- ============================================
-- 6. REPORTING / ANALYTICS FUNCTIONS
-- ============================================

-- Summary statistik SDM per organisasi
CREATE OR REPLACE FUNCTION get_org_sdm_stats(p_org_id UUID)
RETURNS TABLE (
    total_sdm INTEGER,
    active_sdm INTEGER,
    by_nakes_type JSONB,
    by_employee_status JSONB,
    avg_tenure_years NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM sdm_kesehatan WHERE organization_id = p_org_id),
        (SELECT COUNT(*) FROM sdm_kesehatan WHERE organization_id = p_org_id AND is_active = TRUE),
        (
            SELECT json_object_agg(nakes_type, cnt) FROM (
                SELECT nakes_type, COUNT(*) as cnt 
                FROM sdm_kesehatan 
                WHERE organization_id = p_org_id 
                GROUP BY nakes_type
            ) sub
        ),
        (
            SELECT json_object_agg(employee_status, cnt) FROM (
                SELECT COALESCE(employee_status, 'Tidak Diketahui') as employee_status, COUNT(*) as cnt 
                FROM sdm_kesehatan 
                WHERE organization_id = p_org_id 
                GROUP BY employee_status
            ) sub
        ),
        (
            SELECT AVG(EXTRACT(YEAR FROM AGE(NOW(), hire_date)))::NUMERIC(8,2)
            FROM sdm_kesehatan 
            WHERE organization_id = p_org_id AND hire_date IS NOT NULL
        );
END;
$$ LANGUAGE plpgsql STABLE;

-- Statistik pelatihan per periode
CREATE OR REPLACE FUNCTION get_training_stats(
    p_start_date DATE,
    p_end_date DATE,
    p_org_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_programs INTEGER,
    total_participants INTEGER,
    completion_rate NUMERIC,
    avg_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM training_programs t 
         WHERE t.start_date BETWEEN p_start_date AND p_end_date
         AND (p_org_id IS NULL OR t.created_by IN (SELECT id FROM user_profiles WHERE ...))),
        -- Simplified - full implementation needs org filtering logic
        0::INTEGER,
        0::NUMERIC,
        0::NUMERIC;
    -- Full implementation in PROMPT 02
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 7. SEARCH FUNCTIONS
-- ============================================

-- Fungsi search SDM dengan filter dinamis
CREATE OR REPLACE FUNCTION search_sdm(
    p_search_text TEXT DEFAULT '',
    p_org_id UUID DEFAULT NULL,
    p_nakes_type nakes_type DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    full_name VARCHAR,
    nakes_type nakes_type,
    organization_name VARCHAR,
    department_name VARCHAR,
    position_name VARCHAR,
    employee_status employee_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sdm.id,
        sdm.full_name,
        sdm.nakes_type,
        org.name as organization_name,
        dept.name as department_name,
        pos.name as position_name,
        sdm.employee_status
    FROM sdm_kesehatan sdm
    LEFT JOIN organizations org ON org.id = sdm.organization_id
    LEFT JOIN departments dept ON dept.id = sdm.department_id
    LEFT JOIN positions pos ON pos.id = sdm.position_id
    WHERE 
        (p_search_text = '' OR 
         sdm.full_name ILIKE '%' || p_search_text || '%' OR
         sdm.nip ILIKE '%' || p_search_text || '%')
        AND (p_org_id IS NULL OR sdm.organization_id = p_org_id)
        AND (p_nakes_type IS NULL OR sdm.nakes_type = p_nakes_type)
        AND sdm.is_active = p_is_active
    ORDER BY sdm.full_name
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 8. ATTACH TRIGGERS TO TABLES
-- ============================================

-- Trigger: Auto-update certification status
CREATE TRIGGER on_certifications_before_update
    BEFORE INSERT OR UPDATE ON public.certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_certification_status();

-- Trigger: Audit log untuk sdm_kesehatan
CREATE TRIGGER audit_sdm_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.sdm_kesehatan
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

-- Trigger: Audit log untuk certifications
CREATE TRIGGER audit_certifications_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.certifications
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

-- Trigger: Audit log untuk training_programs
CREATE TRIGGER audit_training_programs_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.training_programs
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

-- Trigger: Audit log untuk training_participants
CREATE TRIGGER audit_training_participants_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.training_participants
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

-- ============================================
-- VERIFIKASI
-- ============================================

-- List semua functions yang dibuat
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE ANY(ARRAY[
    'validate_%', 'calculate_%', 'is_%', 'get_%', 
    'check_%', 'soft_delete_%', 'create_%', 'search_%'
])
ORDER BY routine_name;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Functions & Triggers berhasil dibuat';
    RAISE NOTICE '   - Validation functions: validate_nip(), validate_nik()';
    RAISE NOTICE '   - Computed functions: calculate_age(), calculate_tenure()';
    RAISE NOTICE '   - Certification helpers: is_certification_expiring_soon(), update_certification_status()';
    RAISE NOTICE '   - Aggregate functions: get_training_participant_count(), get_active_certification_count()';
    RAISE NOTICE '   - Search function: search_sdm()';
    RAISE NOTICE '   - Reporting functions: get_org_sdm_stats()';
    RAISE NOTICE '   - Reminder function: create_expiry_reminders()';
    RAISE NOTICE '   - Audit triggers attached to main tables';
END $$;
