-- ============================================
-- PAMUNGKAS - Main Data Schema
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Tabel utama data SDM Kesehatan
-- 2. Tabel pelatihan dan diklat
-- 3. Tabel sertifikasi dan kompetensi
-- 4. Tabel relasi dan tracking
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 02_master_data.sql
-- ============================================

-- ============================================
-- 1. TABEL UTAMA: SDM KESEHATAN (Nakes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.sdm_kesehatan (
    -- Primary key & relasi
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Data organisasi
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    
    -- Data pribadi
    full_name VARCHAR(200) NOT NULL,
    nip VARCHAR(18),                    -- Nomor Induk Pegawai
    nik VARCHAR(16),                    -- Nomor Induk Kependudukan
    nira VARCHAR(30),                   -- Nomor Registrasi (untuk profesi tertentu)
    gender gender_type NOT NULL,
    birth_place VARCHAR(100),
    birth_date DATE,
    
    -- Kontak
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    
    -- Data kepegawaian
    employee_status employee_status DEFAULT 'Aktif',
    golongan golongan_pangkat,
    hire_date DATE,
    retirement_date DATE,
    
    -- Data pendidikan terakhir
    education_level education_level,
    education_major VARCHAR(200),
    education_institution VARCHAR(200),
    graduation_year INTEGER,
    
    -- Data profesi
    nakes_type nakes_type NOT NULL,
    specialization VARCHAR(200),        -- Spesialisasi (jika ada)
    
    -- Status & metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',       -- Data tambahan fleksibel
    
    -- Timestamps & audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

COMMENT ON TABLE public.sdm_kesehatan IS 'Tabel utama data Tenaga Kesehatan (SDM Kesehatan)';
COMMENT ON COLUMN public.sdm_kesehatan.nip IS 'Nomor Induk Pegawai (18 digit)';
COMMENT ON COLUMN public.sdm_kesehatan.nik IS 'Nomor Induk Kependudukan (16 digit)';
COMMENT ON COLUMN public.sdm_kesehatan.nira IS 'Nomor Registrasi profesi kesehatan';

-- Index untuk performa pencarian
CREATE INDEX IF NOT EXISTS idx_sdm_org ON public.sdm_kesehatan(organization_id);
CREATE INDEX IF NOT EXISTS idx_sdm_dept ON public.sdm_kesehatan(department_id);
CREATE INDEX IF NOT EXISTS idx_sdm_nakes_type ON public.sdm_kesehatan(nakes_type);
CREATE INDEX IF NOT EXISTS idx_sdm_status ON public.sdm_kesehatan(employee_status);
CREATE INDEX IF NOT EXISTS idx_sdm_active ON public.sdm_kesehatan(is_active);
CREATE INDEX IF NOT EXISTS idx_sdm_name ON public.sdm_kesehatan(full_name);
CREATE INDEX IF NOT EXISTS idx_sdm_nip ON public.sdm_kesehatan(nip);

-- Trigger untuk updated_at
CREATE TRIGGER on_sdm_updated
    BEFORE UPDATE ON public.sdm_kesehatan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABEL: RIWAYAT PENDIDIKAN
-- ============================================

CREATE TABLE IF NOT EXISTS public.education_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sdm_id UUID NOT NULL REFERENCES sdm_kesehatan(id) ON DELETE CASCADE,
    
    level education_level NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    major VARCHAR(200),
    degree_title VARCHAR(200),
    
    start_date DATE,
    end_date DATE,
    graduation_date DATE,
    gpa NUMERIC(4,2),                 -- IPK
    
    certificate_number VARCHAR(100),
    certificate_file_url TEXT,         -- Storage URL
    
    is_highest BOOLEAN DEFAULT FALSE,  -- Pendidikan tertinggi?
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.education_history IS 'Riwayat pendidikan formal tenaga kesehatan';
COMMENT ON COLUMN public.education_history.gpa IS 'Indek Prestasi Kumulatif (0.00 - 4.00)';

CREATE INDEX IF NOT EXISTS idx_edu_hist_sdm ON public.education_history(sdm_id);
CREATE INDEX IF NOT EXISTS idx_edu_hist_level ON public.education_history(level);

CREATE TRIGGER on_education_history_updated
    BEFORE UPDATE ON public.education_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TABEL: PROGRAM PELATIHAN / DIKLAT
-- ============================================

CREATE TABLE IF NOT EXISTS public.training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informasi program
    name VARCHAR(255) NOT NULL,
    description TEXT,
    training_type_id UUID REFERENCES training_types(id) ON DELETE RESTRICT,
    
    -- Penyelenggara
    organizer VARCHAR(200),            -- Nama penyelenggara
    organizer_type VARCHAR(100),      -- Internal, Eksternal, Lembaga Pemerintah, dll
    
    -- Lokasi & waktu
    location VARCHAR(200),
    is_online BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    duration_hours INTEGER,
    
    -- Kapasitas & biaya
    max_participants INTEGER,
    cost_budget DECIMAL(15,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Terbuka, Sedang Berlangsung, Selesai, Dibatalkan
    
    -- Metadata
    requirements TEXT,                 -- Syarat peserta
    learning_outcomes TEXT[],          -- Capaian pembelajaran
    certificate_template TEXT,
    
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.training_programs IS 'Master program/paket pelatihan dan diklat';

CREATE INDEX IF NOT EXISTS idx_training_prog_status ON public.training_programs(status);
CREATE INDEX IF NOT EXISTS idx_training_prog_type ON public.training_programs(training_type_id);
CREATE INDEX IF NOT EXISTS idx_training_prog_dates ON public.training_programs(start_date, end_date);

CREATE TRIGGER on_training_programs_updated
    BEFORE UPDATE ON public.training_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. TABEL: PESERTA PELATIHAN
-- ============================================

CREATE TABLE IF NOT EXISTS public.training_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    sdm_id UUID NOT NULL REFERENCES sdm_kesehatan(id) ON DELETE CASCADE,
    
    -- Status pendaftaran
    registration_status VARCHAR(50) DEFAULT 'Terdaftar', 
    -- Terdaftar, Diterima, Ditolak, Mengundurkan Diri, Hadir, Tidak Hadir
    
    -- Status kelulusan
    completion_status VARCHAR(50),     -- Belum Selesai, Selesai, Lulus, Tidak Lulus
    final_score NUMERIC(5,2),          -- Nilai akhir
    
    -- Sertifikat
    certificate_number VARCHAR(100),
    certificate_issued_date DATE,
    certificate_file_url TEXT,
    
    -- Kehadiran
    attendance_percentage DECIMAL(5,2), -- Persentase kehadiran
    
    -- Feedback
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    registered_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.training_participants IS 'Data peserta dalam program pelatihan';
COMMENT ON COLUMN public.training_participants.attendance_percentage IS 'Persentase kehadiran (0-100)';
COMMENT ON COLUMN public.training_participants.final_score IS 'Nilai akhir pelatihan';

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_part_unique ON public.training_participants(training_program_id, sdm_id);
CREATE INDEX IF NOT EXISTS idx_train_part_prog ON public.training_participants(training_program_id);
CREATE INDEX IF NOT EXISTS idx_train_part_sdm ON public.training_participants(sdm_id);
CREATE INDEX IF NOT EXISTS idx_train_part_status ON public.training_participants(registration_status);

CREATE TRIGGER on_training_participants_updated
    BEFORE UPDATE ON public.training_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TABEL: SERTIFIKASI / KOMPETENSI
-- ============================================

CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sdm_id UUID NOT NULL REFERENCES sdm_kesehatan(id) ON DELETE CASCADE,
    certification_type_id UUID REFERENCES certification_types(id) ON DELETE RESTRICT,
    
    -- Detail sertifikasi
    certificate_number VARCHAR(100) NOT NULL,
    issuing_body VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    
    -- Masa berlaku
    valid_until DATE,                  -- NULL = permanent/tidak expired
    status certification_status DEFAULT 'Aktif',
    
    -- Dokumen
    document_file_url TEXT,
    
    -- Reminder
    reminder_sent BOOLEAN DEFAULT FALSE,
    last_reminder_date DATE,
    
    -- Verifikasi
    verified_by UUID REFERENCES user_profiles(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.certifications IS 'Data sertifikasi dan kompetensi tenaga kesehatan';
COMMENT ON COLUMN public.certifications.valid_until IS 'Tanggal berakhir (NULL=permanent)';
COMMENT ON COLUMN public.certifications.status IS 'Status sertifikasi saat ini';

CREATE INDEX IF NOT EXISTS idx_cert_sdm ON public.certifications(sdm_id);
CREATE INDEX IF NOT EXISTS idx_cert_type ON public.certifications(certification_type_id);
CREATE INDEX IF NOT EXISTS idx_cert_status ON public.certifications(status);
CREATE INDEX IF NOT EXISTS idx_cert_valid_until ON public.certifications(valid_until);
CREATE INDEX IF NOT EXISTS idx_cert_number ON public.certifications(certificate_number);

CREATE TRIGGER on_certifications_updated
    BEFORE UPDATE ON public.certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. TABEL: LOG AKTIVITAS (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- User yang melakukan aksi
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Detail aktivitas
    action VARCHAR(50) NOT NULL,       -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    entity_type VARCHAR(50) NOT NULL,  -- sdm_kesehatan, training_programs, certifications, etc.
    entity_id UUID,                    -- ID record yang diakses/diubah
    
    -- Deskripsi
    description TEXT NOT NULL,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Data lama & baru (untuk update)
    old_values JSONB,
    new_values JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.activity_logs IS 'Log audit trail untuk semua aktivitas di sistem';

CREATE INDEX IF NOT EXISTS idx_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs(created_at);

-- Fungsi trigger untuk logging otomatis
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    action_text TEXT;
BEGIN
        -- Tentukan jenis aksi
        IF TG_OP = 'INSERT' THEN
            action_text := 'CREATE';
        ELSIF TG_OP = 'UPDATE' THEN
            action_text := 'UPDATE';
        ELSIF TG_OP = 'DELETE' THEN
            action_text := 'DELETE';
        ELSE
            action_text := TG_OP;
        END IF;
        
        INSERT INTO activity_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            old_values,
            new_values
        ) VALUES (
            COALESCE(auth.uid()::UUID, NULL),
            action_text,
            TG_TABLE_NAME,
            CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
            action_text || ' record in ' || TG_TABLE_NAME || 
                CASE WHEN TG_OP = 'DELETE' THEN ' (id=' || OLD.id || ')' 
                     ELSE ' (id=' || NEW.id || ')' END,
            CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::JSONB ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::JSONB ELSE NULL END
        );
        
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFIKASI
-- ============================================

SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns
FROM (
    SELECT 'sdm_kesehatan' as table_name UNION ALL
    SELECT 'education_history' UNION ALL
    SELECT 'training_programs' UNION ALL
    SELECT 'training_participants' UNION ALL
    SELECT 'certifications' UNION ALL
    SELECT 'activity_logs'
) t;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Main Data schema berhasil dibuat';
    RAISE NOTICE '   - Tables: sdm_kesehatan, education_history, training_programs, training_participants, certifications, activity_logs';
    RAISE NOTICE '   - Audit trigger function: log_activity() ready to be attached';
END $$;
