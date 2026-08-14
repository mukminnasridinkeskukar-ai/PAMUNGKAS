-- ============================================
-- PAMUNGKAS - Competency Schema
-- Pengelolaan Pengembangan Mutu dan 
-- Peningkatan Kompetensi SDM Kesehatan
-- ============================================
-- 
-- FILE INI MENANGANI:
-- 1. Tabel COMPETENCIES (Master Data Kompetensi)
-- 2. Tabel SDMK_COMPETENCIES (Relasi SDMK-Kompetensi)
-- 3. Tabel COMPETENCY_GAPS (Analisis Gap Kompetensi)
-- 4. Functions untuk analisis GAP
-- 5. Views untuk reporting & dashboard
-- 6. RLS Policies untuk keamanan data
--
-- EKSEKUSI: Jalankan di Supabase SQL Editor
-- URUTAN: Jalankan SETELAH 02_master_data.sql
--          Jalankan SETELAH 03_pamungkas_data.sql
--
-- ⚠️ PENTING:
-- - Menggunakan SOFT DELETE (is_active = false)
-- - GAP dihitung otomatis: REQUIRED_LEVEL - CURRENT_LEVEL
-- - Operator hanya akses kompetensi unitnya sendiri
-- ============================================

-- ============================================
-- DROP TABLES JIKA PERLU RE-CREATE (HATAT-HATI!)
-- ============================================

-- Uncomment baris di bawah jika perlu recreate dari awal
-- DROP TABLE IF EXISTS public.competency_gaps CASCADE;
-- DROP TABLE IF EXISTS public.sdmk_competencies CASCADE;
-- DROP TABLE IF EXISTS public.competencies CASCADE;

-- ============================================
-- 1. ENUM TYPES UNTUK KOMPETENSI
-- ============================================

-- Level Kompetensi (skala standar)
CREATE TYPE competency_level_type AS ENUM (
    'BELUM',        -- Belum kompeten / belum terukur
    'KURANG',       -- Kurang kompeten (perlu pengembangan signifikan)
    'CUKUP',        -- Cukup kompeten (memenuhi standar minimal)
    'BAIK',         -- Baik (di atas standar)
    'SANGAT_BAIK',  -- Sangat baik (excellent)
    'AHLI'          -- Ahli/Expert level
);
COMMENT ON competency_level_type IS 'Level kompetensi: BELUM, KURANG, CUKUP, BAIK, SANGAT_BAIK, AHLI';

-- Status Kompetensi SDMK
CREATE TYPE competency_status AS ENUM (
    'TERUKUR',      -- Sudah diukur/dinilai
    'DALAM_PROSES', -- Sedang dalam proses pengembangan
    'BELUM_TERUKUR',-- Belum diukur
    'KADALUARSA',   -- Kompetensi kadaluarsa (perlu re-assessment)
    'DITANGGUHKAN'  -- Ditangguhkan sementara
);
COMMENT ON competency_status IS 'Status kompetensi SDMK';

-- Prioritas Gap
CREATE TYPE gap_priority AS ENUM (
    'TINGGI',       -- Prioritas tinggi (gap besar, segera ditangani)
    'SEDANG',       -- Prioritas sedang
    'RENDAH'        -- Prioritas rendah (opsional/nice to have)
);
COMMENT ON gap_priority IS 'Prioritas penutupan gap kompetensi';

-- Status Gap
CREATE TYPE gap_status AS ENUM (
    'TERIDENTIFIKASI',   -- Gap sudah teridentifikasi
    'DALAM_PENANGANAN',  -- Sedang dalam program penutupan gap
    'TERTUTUP',          -- Gap sudah tertutup
    'DITUNDA',           -- Penutupan ditunda
    'TIDAK_RELEVAN'      -- Tidak relevan lagi
);
COMMENT ON gap_status IS 'Status progress penutupan gap';

-- ============================================
-- 2. TABEL: COMPETENCIES (Master Data Kompetensi)
-- ============================================
-- 
-- Master data jenis-jenis kompetensi yang bisa dimiliki SDMK
-- Terstruktur berdasarkan kategori (dari competency_categories)

CREATE TABLE IF NOT EXISTS public.competencies (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identitas Kompetensi
    code VARCHAR(50) UNIQUE NOT NULL,            -- Kode unik kompetensi
    name VARCHAR(255) NOT NULL,                 -- Nama kompetensi
    
    -- Kategori (FK ke master data)
    category_id UUID REFERENCES public.competency_categories(id) ON DELETE SET NULL,
    
    -- Deskripsi detail
    description TEXT,
    
    -- Level/Grade kompetensi (untuk standardisasi)
    level VARCHAR(50),                          -- Level default/tipe: Dasar, Menengah, Lanjutan
    
    -- Indikator/Kriteria (JSON array of criteria)
    indicators JSONB DEFAULT '[]',              -- Array indikator pencapaian
    
    -- Standar referensi
    standard_ref VARCHAR(100),                  -- UKPP, UKNPP, CPKB, dll
    standard_version VARCHAR(20),               -- Versi standar
    
    -- Domain kompetensi
    domain VARCHAR(50),                         -- Pengetahuan, Keterampilan, Sikap
    
    -- Urutan tampilan
    sort_order INTEGER DEFAULT 0,
    
    -- Status Aktif (SOFT DELETE!)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata tambahan
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.competencies IS 'Master data jenis kompetensi SDM kesehatan';
COMMENT ON COLUMN public.competencies.code IS 'Kode unik kompetensi (contoh: KOMP-001)';
COMMENT ON COLUMN public.competencies.category_id IS 'FK -> competency_categories.id';
COMMENT ON COLUMN public.competencies.indicators IS 'Array indikator pencapaian kompetensi';
COMMENT ON COLUMN public.competencies.is_active IS 'SOFT DELETE: FALSE = dinonaktifkan';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competencies_code ON public.competencies(code);
CREATE INDEX IF NOT EXISTS idx_competencies_category ON public.competencies(category_id);
CREATE INDEX IF NOT EXISTS idx_competencies_domain ON public.competencies(domain);
CREATE INDEX IF NOT EXISTS idx_competencies_active ON public.competencies(is_active);

-- Trigger untuk updated_at
CREATE TRIGGER on_competencies_updated
    BEFORE UPDATE ON public.competencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TABEL: SDMK_COMPETENCIES (Relasi SDMK-Kompetensi)
-- ============================================
-- 
-- Many-to-Many relationship:
-- Satu SDMK bisa memiliki banyak kompetensi
-- Satu kompetensi bisa dimiliki banyak SDMK
-- 
-- Setiap record menyimpan LEVEL dan STATUS kompetensi
-- untuk SDMK spesifik pada kompetensi spesifik

CREATE TABLE IF NOT EXISTS public.sdmk_competencies (
    -- Primary Key (composite atau UUID tunggal)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    sdmk_id UUID NOT NULL REFERENCES public.sdmk(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    
    -- Level Kompetensi SDMK (hasil assessment)
    level competency_level_type NOT NULL DEFAULT 'BELUM',
    
    -- Status kompetensi
    status competency_status DEFAULT 'BELUM_TERUKUR',
    
    -- Bukti/Evidence (URL dokumen/sertifikat)
    evidence TEXT,                               -- URL ke file evidence
    evidence_type VARCHAR(50),                   -- Jenis: sertifikat, portofolio, asesmen
    
    -- Tanggal Pengukuran/Penetapan
    assessed_date DATE,                          -- Tanggal kompetensi diukur/dinilai
    valid_until DATE,                            -- Masa berlaku kompetensi (NULL = permanent)
    
    -- Assessor/Verifier
    assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Catatan/Remarks
    notes TEXT,
    
    -- Metadata tambahan
    score NUMERIC(5,2),                          -- Nilai numerik (0-100) jika ada
    metadata JSONB DEFAULT '{}',
    
    -- Status Aktif
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Unique Constraint: satu SDMK hanya punya SATU record per kompetensi (aktif)
    CONSTRAINT uq_sdmk_competency_active UNIQUE (sdmk_id, competency_id)
    WHERE (is_active = true)
);

COMMENT ON TABLE public.sdmk_competencies IS 'Relasi many-to-many antara SDMK dan Kompetensi (menyimpan level & status)';
COMMENT ON COLUMN public.sdmk_competencies.level IS 'Level kompetensi SDMK: BELUM, KURANG, CUKUP, BAIK, SANGAT_BAIK, AHLI';
COMMENT ON COLUMN public.sdmk_competencies.status IS 'Status: TERUKUR, DALAM_PROSES, BELUM_TERUKUR, KADALUARSA';
COMMENT ON COLUMN public.sdmk_competencies.evidence IS 'URL bukti/evidence (dokumen, sertifikat)';
COMMENT ON COLUMN public.sdmk_competencies.assessed_date IS 'Tanggal kompetensi diukur/dinilai';
COMMENT ON COLUMN public.sdmk_competencies.valid_until IS 'Masa berlaku (NULL=permanent)';
COMMENT ON COLUMN public.sdmk_competencies.score IS 'Nilai numerik (0-100) opsional';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_sdmk ON public.sdmk_competencies(sdmk_id);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_competency ON public.sdmk_competencies(competency_id);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_level ON public.sdmk_competencies(level);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_status ON public.sdmk_competencies(status);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_active ON public.sdmk_competencies(is_active);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_assessed_date ON public.sdmk_competencies(assessed_date);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_valid_until ON public.sdmk_competencies(valid_until);

-- Composite indexes untuk query performa
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_sdmk_active ON public.sdmk_competencies(sdmk_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sdmk_comp_competency_active ON public.sdmk_competencies(competency_id, is_active);

-- Trigger untuk updated_at
CREATE TRIGGER on_sdmk_competencies_updated
    BEFORE UPDATE ON public.sdmk_competencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. TABEL: COMPETENCY_GAPS (Analisis Gap Kompetensi)
-- ============================================
-- 
-- Menyimpan analisis GAP antara REQUIRED vs CURRENT level
-- GAP = Required Level - Current Level
-- 
-- Digunakan untuk:
-- - Identifikasi kebutuhan pelatihan
-- - Perencanaan pengembangan karir
-- - Analisis organisasional

CREATE TABLE IF NOT EXISTS public.competency_gaps (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    sdmk_id UUID NOT NULL REFERENCES public.sdmk(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    
    -- Level yang DIBUTUHKAN (standar jabatan/unit)
    required_level competency_level_type NOT NULL,
    
    -- Level yang DIMILIKI SAAT INI (dari sdmk_competencies)
    current_level competency_level_type NOT NULL DEFAULT 'BELUM',
    
    -- GAP Calculation (auto-computed via trigger)
    gap_value INTEGER GENERATED ALWAYS AS (
        CASE required_level
            WHEN 'AHLI' THEN 5
            WHEN 'SANGAT_BAIK' THEN 4
            WHEN 'BAIK' THEN 3
            WHEN 'CUKUP' THEN 2
            WHEN 'KURANG' THEN 1
            WHEN 'BELUM' THEN 0
        END -
        CASE current_level
            WHEN 'AHLI' THEN 5
            WHEN 'SANGAT_BAIK' THEN 4
            WHEN 'BAIK' THEN 3
            WHEN 'CUKUP' THEN 2
            WHEN 'KURANG' THEN 1
            WHEN 'BELUM' THEN 0
        END
    ) STORED,
    
    -- Prioritas Penutupan
    priority gap_priority DEFAULT 'SEDANG',
    
    -- Rekomendasi Program
    recommendation TEXT,                       -- Rekomendasi pelatihan/pengembangan
    recommended_program VARCHAR(255),          -- Nama program yang direkomendasikan
    training_type_id UUID REFERENCES public.training_types(id) ON DELETE SET NULL,
    
    -- Target Timeline
    target_date DATE,                          -- Target penutupan gap
    due_date DATE,                            -- Batas waktu (deadline)
    
    -- Status Progress
    status gap_status DEFAULT 'TERIDENTIFIKASI',
    
    -- PIC / Penanggung Jawab
    pic_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Catatan
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    identified_at TIMESTAMPTZ DEFAULT NOW(),   -- Tanggal gap teridentifikasi
    closed_at TIMESTAMPTZ,                    // Tanggal gap tertutup
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.competency_gaps IS 'Analisis GAP kompetensi SDMK (Required vs Current Level)';
COMMENT ON COLUMN public.competency_gaps.required_level IS 'Level yang dibutuhkan (standar jabatan)';
COMMENT ON COLUMN public.competency_gaps.current_level IS 'Level yang dimiliki saat ini';
COMMENT ON COLUMN public.competency_gaps.gap_value IS 'GAP auto-calculated: required(0-5) - current(0-5)';
COMMENT ON COLUMN public.competency_gaps.priority IS 'Prioritas: TINGGI, SEDANG, RENDAH';
COMMENT ON COLUMN public.competency_gaps.status IS 'Progress: TERIDENTIFIKASI, DALAM_PENANGANAN, TERTUTUP, DITUNDA';
COMMENT ON COLUMN public.competency_gaps.target_date IS 'Target penyelesaian gap';
COMMENT ON COLUMN public.competency_gaps.due_date IS 'Deadline penutupan gap';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comp_gap_sdmk ON public.competency_gaps(sdmk_id);
CREATE INDEX IF NOT EXISTS idx_comp_gap_competency ON public.competency_gaps(competency_id);
CREATE INDEX IF NOT EXISTS idx_comp_gap_value ON public.competency_gaps(gap_value);
CREATE INDEX IF NOT EXISTS idx_comp_gap_priority ON public.competency_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_comp_gap_status ON public.competency_gaps(status);
CREATE INDEX IF NOT EXISTS idx_comp_gap_target ON public.competency_gaps(target_date);
CREATE INDEX IF NOT EXISTS idx_comp_gap_due ON public.competency_gaps(due_date);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_comp_gap_sdmk_status ON public.competency_gaps(sdmk_id, status);
CREATE INDEX IF NOT EXISTS idx_comp_gap_priority_status ON public.competency_gaps(priority, status);

-- Trigger untuk updated_at
CREATE TRIGGER on_competency_gaps_updated
    BEFORE UPDATE ON public.competency_gaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. VIEWS UNTUK REPORTING & DASHBOARD
-- ============================================

-- View: Detail kompetensi SDMK (dengan join ke master data)
CREATE OR REPLACE VIEW public.v_sdmk_competencies_detail AS
SELECT 
    sc.id,
    sc.sdmk_id,
    sc.competency_id,
    sc.level,
    sc.status,
    sc.evidence,
    sc.evidence_type,
    sc.assessed_date,
    sc.valid_until,
    sc.score,
    sc.notes,
    sc.is_active,
    sc.created_at,
    sc.updated_at,
    
    -- SDMK Info
    s.nama_lengkap,
    s.nik,
    s.nip,
    s.jenis_kelamin,
    s.unit_id,
    s.profession_id,
    s.jabatan,
    s.foto_url,
    
    -- Competency Info
    c.code AS competency_code,
    c.name AS competency_name,
    c.description AS competency_description,
    c.category_id,
    c.domain AS competency_domain,
    c.level AS competency_tier,
    
    -- Category Name
    cc.name AS category_name,
    
    -- Unit Name
    u.name AS unit_name,
    u.unit_type,
    
    -- Profession Name
    p.name AS profession_name

FROM public.sdmk_competencies sc
JOIN public.sdmk s ON sc.sdmk_id = s.id
JOIN public.competencies c ON sc.competency_id = c.id
LEFT JOIN public.competency_categories cc ON c.category_id = cc.id
LEFT JOIN public.units u ON s.unit_id = u.id
LEFT JOIN public.professions p ON s.profession_id = p.id
WHERE sc.is_active = TRUE;

COMMENT ON VIEW public.v_sdmk_competencies_detail IS 'View detail kompetensi SDMK dengan join ke semua master data';

-- View: Detail GAP dengan info lengkap
CREATE OR REPLACE VIEW public.v_competency_gaps_detail AS
SELECT 
    cg.id,
    cg.sdmk_id,
    cg.competency_id,
    cg.required_level,
    cg.current_level,
    cg.gap_value,
    cg.priority,
    cg.recommendation,
    cg.recommended_program,
    cg.target_date,
    cg.due_date,
    cg.status,
    cg.notes,
    cg.identified_at,
    cg.closed_at,
    
    -- SDMK Info
    s.nama_lengkap,
    s.nik,
    s.nip,
    s.jenis_kelamin,
    s.unit_id,
    s.profession_id,
    s.jabatan,
    s.email,
    
    -- Competency Info
    c.code AS competency_code,
    c.name AS competency_name,
    c.description AS competency_description,
    c.category_id,
    c.domain AS competency_domain,
    
    -- Category Name
    cc.name AS category_name,
    
    -- Unit Name
    u.name AS unit_name,
    u.parent_id AS unit_parent_id,
    
    -- Profession Name
    p.name AS profession_name,
    p.short_name AS profession_short,

    -- Training Type (jika ada)
    tt.name AS training_type_name

FROM public.competency_gaps cg
JOIN public.sdmk s ON cg.sdmk_id = s.id
JOIN public.competencies c ON cg.competency_id = c.id
LEFT JOIN public.competency_categories cc ON c.category_id = cc.id
LEFT JOIN public.units u ON s.unit_id = u.id
LEFT JOIN public.professions p ON s.profession_id = p.id
LEFT JOIN public.training_types tt ON cg.training_type_id = tt.id;

COMMENT ON VIEW public.v_competency_gaps_detail IS 'View detail GAP kompetensi dengan semua relasi';

-- View: Summary statistik GAP per Unit
CREATE OR REPLACE VIEW public.v_gap_summary_by_unit AS
SELECT 
    u.id AS unit_id,
    u.name AS unit_name,
    u.code AS unit_code,
    u.unit_type,
    
    COUNT(*) AS total_gaps,
    SUM(CASE WHEN cg.gap_value >= 3 THEN 1 ELSE 0 END) AS high_gaps,
    SUM(CASE WHEN cg.gap_value = 2 THEN 1 ELSE 0 END) AS medium_gaps,
    SUM(CASE WHEN cg.gap_value <= 1 THEN 1 ELSE 0 END) AS low_gaps,
    AVG(cg.gap_value)::NUMERIC(10,2) AS avg_gap,
    MAX(cg.gap_value) AS max_gap,
    
    SUM(CASE WHEN cg.status = 'TERIDENTIFIKASI' THEN 1 ELSE 0 END) AS identified_count,
    SUM(CASE WHEN cg.status = 'DALAM_PENANGANAN' THEN 1 ELSE 0 END) AS in_progress_count,
    SUM(CASE WHEN cg.status = 'TERTUTUP' THEN 1 ELSE 0 END) AS closed_count

FROM public.competency_gaps cg
JOIN public.sdmk s ON cg.sdmk_id = s.id
JOIN public.units u ON s.unit_id = u.id
WHERE s.is_active = TRUE
GROUP BY u.id, u.name, u.code, u.unit_type
ORDER BY total_gaps DESC;

COMMENT ON VIEW public.v_gap_summary_by_unit IS 'Summary statistik GAP per Unit Kerja';

-- View: Summary statistik GAP per Profesi
CREATE OR REPLACE VIEW public.v_gap_summary_by_profession AS
SELECT 
    p.id AS profession_id,
    p.name AS profession_name,
    p.code AS profession_code,
    p.short_name,
    p.category AS profession_category,
    
    COUNT(*) AS total_gaps,
    SUM(CASE WHEN cg.gap_value >= 3 THEN 1 ELSE 0 END) AS high_gaps,
    SUM(CASE WHEN cg.gap_value = 2 THEN 1 ELSE 0 END) AS medium_gaps,
    SUM(CASE WHEN cg.gap_value <= 1 THEN 1 ELSE 0 END) AS low_gaps,
    AVG(cg.gap_value)::NUMERIC(10,2) AS avg_gap,
    MAX(cg.gap_value) AS max_gap,
    
    SUM(CASE WHEN cg.priority = 'TINGGI' THEN 1 ELSE 0 END) AS high_priority_count,
    SUM(CASE WHEN cg.priority = 'SEDANG' THEN 1 ELSE 0 END) AS medium_priority_count,
    SUM(CASE WHEN cg.priority = 'RENDAH' THEN 1 ELSE 0 END) AS low_priority_count

FROM public.competency_gaps cg
JOIN public.sdmk s ON cg.sdmk_id = s.id
JOIN public.professions p ON s.profession_id = p.id
WHERE s.is_active = TRUE
GROUP BY p.id, p.name, p.code, p.short_name, p.category
ORDER BY total_gaps DESC;

COMMENT ON VIEW public.v_gap_summary_by_profession IS 'Summary statistik GAP per Profesi';

-- View: Top kompetensi dengan GAP tertinggi
CREATE OR REPLACE VIEW public.v_top_gap_competencies AS
SELECT 
    c.id AS competency_id,
    c.code AS competency_code,
    c.name AS competency_name,
    c.category_id,
    cc.name AS category_name,
    c.domain,
    
    COUNT(*) AS total_sdmk_with_gap,
    AVG(cg.gap_value)::NUMERIC(10,2) AS avg_gap,
    MAX(cg.gap_value) AS max_gap,
    SUM(CASE WHEN cg.gap_value >= 3 THEN 1 ELSE 0 END) AS critical_count,
    
    SUM(CASE WHEN cg.status = 'TERIDENTIFIKASI' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN cg.status = 'DALAM_PENANGANAN' THEN 1 ELSE 0 END) AS addressing_count

FROM public.competency_gaps cg
JOIN public.competencies c ON cg.competency_id = c.id
LEFT JOIN public.competency_categories cc ON c.category_id = cc.id
GROUP BY c.id, c.code, c.name, c.category_id, cc.name, c.domain
ORDER BY total_sdmk_with_gap DESC
LIMIT 20;

COMMENT ON VIEW public.v_top_gap_competencies IS 'Top 20 kompetensi dengan GAP tertinggi';

-- ============================================
-- 6. FUNCTIONS UNTUK ANALISIS GAP
-- ============================================

-- Function: Hitung GAP value dari dua level
CREATE OR REPLACE FUNCTION calculate_gap(
    p_required competency_level_type,
    p_current competency_level_type
) RETURNS INTEGER AS $$
DECLARE
    v_required_int INTEGER;
    v_current_int INTEGER;
BEGIN
    -- Convert enum to integer
    v_required_int := CASE p_required
        WHEN 'AHLI' THEN 5
        WHEN 'SANGAT_BAIK' THEN 4
        WHEN 'BAIK' THEN 3
        WHEN 'CUKUP' THEN 2
        WHEN 'KURANG' THEN 1
        ELSE 0  -- BELUM
    END;
    
    v_current_int := CASE p_current
        WHEN 'AHLI' THEN 5
        WHEN 'SANGAT_BAIK' THEN 4
        WHEN 'BAIK' THEN 3
        WHEN 'CUKUP' THEN 2
        WHEN 'KURANG' THEN 1
        ELSE 0  -- BELUM
    END;
    
    RETURN v_required_int - v_current_int;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Auto-generate GAP records untuk SDMK
-- Menganalisis semua kompetensi SDMK dan membuat GAP jika diperlukan
CREATE OR REPLACE FUNCTION generate_competency_gaps_for_sdmk(
    p_sdmk_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_required_level competency_level_type;
    v_current_level competency_level_type;
    v_gap_exists BOOLEAN;
BEGIN
    -- Loop semua kompetensi aktif
    FOR comp IN SELECT id, name FROM competencies WHERE is_active = TRUE LOOP
        -- Cek apakah SDMK sudah punya kompetensi ini
        SELECT level INTO v_current_level
        FROM sdmk_competencies
        WHERE sdmk_id = p_sdmk_id AND competency_id = comp.id AND is_active = TRUE
        LIMIT 1;
        
        -- Default required level (bisa disesuaikan berdasarkan jabatan/profesi)
        v_required_level := 'BAIK'; -- Default requirement
        
        -- Hitung gap
        IF calculate_gap(v_required_level, COALESCE(v_current_level, 'BELUM')) > 0 THEN
            -- Cek apakah gap sudah ada
            SELECT EXISTS(
                SELECT 1 FROM competency_gaps 
                WHERE sdmk_id = p_sdmk_id AND competency_id = comp.id 
                AND status NOT IN ('TERTUTUP', 'TIDAK_RELEVAN')
            ) INTO v_gap_exists;
            
            IF NOT v_gap_exists THEN
                -- Insert new gap
                INSERT INTO competency_gaps (
                    sdmk_id, competency_id, required_level, current_level,
                    priority, status, created_by
                ) VALUES (
                    p_sdmk_id, comp.id, v_required_level, COALESCE(v_current_level, 'BELUM'),
                    CASE 
                        WHEN calculate_gap(v_required_level, COALESCE(v_current_level, 'BELUM')) >= 3 THEN 'TINGGI'
                        WHEN calculate_gap(v_required_level, COALESCE(v_current_level, 'BELUM')) >= 2 THEN 'SEDANG'
                        ELSE 'RENDAH'
                    END,
                    'TERIDENTIFIKASI',
                    p_user_id
                );
                
                v_count := v_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update GAP analysis untuk satu SDMK
CREATE OR REPLACE FUNCTION update_sdmk_gap_analysis(p_sdmk_id UUID) RETURNS VOID AS $$
BEGIN
    -- Update existing gaps dengan current level terbaru
    UPDATE competency_gaps cg
    SET current_level = COALESCE(sc.level, 'BELUM'),
        updated_at = NOW()
    FROM sdmk_competencies sc
    WHERE cg.sdmk_id = p_sdmk_id
    AND cg.competency_id = sc.competency_id
    AND sc.is_active = TRUE
    AND cg.status NOT IN ('TERTUTUP', 'TIDAK_RELEVAN');
    
    -- Generate new gaps jika ada kompetensi baru
    PERFORM generate_competency_gaps_for_sdmk(p_sdmk_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get competency profile untuk satu SDMK (summary)
CREATE OR REPLACE FUNCTION get_sdmk_competency_profile(p_sdmk_id UUID)
RETURNS TABLE (
    total_competencies INTEGER,
    measured INTEGER,
    not_measured INTEGER,
    avg_score NUMERIC,
    ahli INTEGER,
    sangat_baik INTEGER,
    baik INTEGER,
    cukup INTEGER,
    kurang INTEGER,
    belum INTEGER,
    gap_count INTEGER,
    avg_gap NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM competencies WHERE is_active = TRUE),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND status = 'TERUKUR'), 0),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND status != 'TERUKUR'), 0),
        (SELECT AVG(score)::NUMERIC(10,2) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND score IS NOT NULL),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND level = 'AHLI'), 0),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND level = 'SANGAT_BAIK'), 0),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND level = 'BAIK'), 0),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND level = 'CUKUP'), 0),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND level = 'KURANG'), 0),
        COALESCE((SELECT COUNT(*) FROM sdmk_competencies WHERE sdmk_id = p_sdmk_id AND is_active = TRUE AND level = 'BELUM'), 0),
        COALESCE((SELECT COUNT(*) FROM competency_gaps WHERE sdmk_id = p_sdmk_id AND status NOT IN ('TERTUTUP', 'TIDAK_RELEVAN')), 0),
        (SELECT AVG(gap_value)::NUMERIC(10,2) FROM competency_gaps WHERE sdmk_id = p_sdmk_id AND status NOT IN ('TERTUTUP', 'TIDAK_RELEVAN'));
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS pada semua tabel kompetensi
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdmk_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_gaps ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin - Full Access ke semua tabel
CREATE POLICY "comp_super_admin_all" ON public.competencies
    FOR ALL TO authenticated
    USING (pamungkas_has_role(auth.uid(), 'SUPER_ADMIN'))
    WITH CHECK (pamungkas_has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "sdmk_comp_super_admin_all" ON public.sdmk_competencies
    FOR ALL TO authenticated
    USING (pamungkas_has_role(auth.uid(), 'SUPER_ADMIN'))
    WITH CHECK (pamungkas_has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "gap_super_admin_all" ON public.competency_gaps
    FOR ALL TO authenticated
    USING (pamungkas_has_role(auth.uid(), 'SUPER_ADMIN'))
    WITH CHECK (pamungkas_has_role(auth.uid(), 'SUPER_ADMIN'));

-- Policy: Admin - Organizational Access
CREATE POLICY "comp_admin_access" ON public.competencies
    FOR ALL TO authenticated
    USING (pamungkas_has_role(auth.uid(), 'ADMIN'))
    WITH CHECK (pamungkas_has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "sdmk_comp_admin_access" ON public.sdmk_competencies
    FOR ALL TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'ADMIN')
    )
    WITH CHECK (pamungkas_has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "gap_admin_access" ON public.competency_gaps
    FOR ALL TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'ADMIN')
    )
    WITH CHECK (pamungkas_has_role(auth.uid(), 'ADMIN'));

-- Policy: Operator - Unit Restricted (Hanya SDMK dari unitnya!)
CREATE POLICY "sdmk_comp_operator_unit" ON public.sdmk_competencies
    FOR ALL TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'OPERATOR')
        AND sdmk_id IN (
            SELECT id FROM sdmk 
            WHERE unit_id = pamungkas_get_user_unit_id(auth.uid())
            AND is_active = TRUE
        )
    )
    WITH CHECK (
        pamungkas_has_role(auth.uid(), 'OPERATOR')
        AND sdmk_id IN (
            SELECT id FROM sdmk 
            WHERE unit_id = pamungkas_get_user_unit_id(auth.uid())
            AND is_active = TRUE
        )
    );

CREATE POLICY "gap_operator_unit" ON public.competency_gaps
    FOR ALL TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'OPERATOR')
        AND sdmk_id IN (
            SELECT id FROM sdmk 
            WHERE unit_id = pamungkas_get_user_unit_id(auth.uid())
            AND is_active = TRUE
        )
    )
    WITH CHECK (
        pamungkas_has_role(auth.uid(), 'OPERATOR')
        AND sdmk_id IN (
            SELECT id FROM sdmk 
            WHERE unit_id = pamungkas_get_user_unit_id(auth.uid())
            AND is_active = TRUE
        )
    );

-- Policy: Verifikator/Pimpinan - Read Only
CREATE POLICY "comp_verifikator_read" ON public.competencies
    FOR SELECT TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'VERIFIKATOR')
        OR pamungkas_has_role(auth.uid(), 'PIMPINAN')
    );

CREATE POLICY "sdmk_comp_verifikator_read" ON public.sdmk_competencies
    FOR SELECT TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'VERIFIKATOR')
        OR pamungkas_has_role(auth.uid(), 'PIMPINAN')
    );

CREATE POLICY "gap_verifikator_read" ON public.competency_gaps
    FOR SELECT TO authenticated
    USING (
        pamungkas_has_role(auth.uid(), 'VERIFIKATOR')
        OR pamungkas_has_role(auth.uid(), 'PIMPINAN')
    );

-- Policy: Service Role - Bypass RLS
CREATE POLICY "comp_service_role" ON public.competencies
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "sdmk_comp_service_role" ON public.sdmk_competencies
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "gap_service_role" ON public.competency_gaps
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================
-- 8. VERIFIKASI AKHIR
-- ============================================

DO $$
DECLARE
    v_tables TEXT[];
    v_views TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ KOMPETENCI SCHEMA BERHASIL DIBUAT!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabel:';
    RAISE NOTICE '  1. competencies         - Master data kompetensi';
    RAISE NOTICE '  2. sdmk_competencies     - Relasi SDMK-Kompetensi';
    RAISE NOTICE '  3. competency_gaps       - Analisis GAP';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Views (Dashboard):';
    RAISE NOTICE '  • v_sdmk_competencies_detail - Detail kompetensi SDMK';
    RAISE NOTICE '  • v_competency_gaps_detail   - Detail GAP';
    RAISE NOTICE '  • v_gap_summary_by_unit      - Statistik GAP per Unit';
    RAISE NOTICE '  • v_gap_summary_by_profession - Statistik GAP per Profesi';
    RAISE NOTICE '  • v_top_gap_competencies     - Top kompetensi GAP tertinggi';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Functions:';
    RAISE NOTICE '  • calculate_gap()           - Hitung GAP value';
    RAISE NOTICE '  • generate_competency_gaps_for_sdmk() - Generate GAP otomatis';
    RAISE NOTICE '  • update_sdmk_gap_analysis() - Update analisis GAP';
    RAISE NOTICE '  • get_sdmk_competency_profile() - Profile kompetensi SDMK';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS Policies:';
    RAISE NOTICE '  ✓ SUPER_ADMIN: Full access';
    RAISE NOTICE '  ✓ ADMIN: Organizational access';
    RAISE NOTICE '  ✓ OPERATOR: Unit-restricted only!';
    RAISE NOTICE '  ✓ VERIFIKATOR/PIMPINAN: Read-only';
    RAISE NOTICE '';
    RAISE NOTICE '📐 Enum Types:';
    RAISE NOTICE '  • competency_level_type (6 levels)';
    RAISE NOTICE '  • competency_status (5 statuses)';
    RAISE NOTICE '  • gap_priority (3 priorities)';
    RAISE NOTICE '  • gap_status (5 statuses)';
    RAISE NOTICE '';
END $$;

-- Query verifikasi final
SELECT 
    'competencies' as table_name, 
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'competencies' AND table_schema = 'public') as columns
UNION ALL
SELECT 
    'sdmk_competencies', 
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'sdmk_competencies' AND table_schema = 'public')
UNION ALL
SELECT 
    'competency_gaps', 
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'competency_gaps' AND table_schema = 'public');
