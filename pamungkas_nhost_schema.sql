-- =====================================================
-- PAMUNGKAS - Database Schema untuk Nhost (PostgreSQL)
-- VERSI: Idempotent (bisa dijalankan ulang tanpa error)
-- =====================================================

-- Enable UUID extension for Nhost compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- HELPER: Drop existing objects if exist (for re-run safety)
-- =====================================================

-- Drop triggers first (if exist)
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_pengumuman_updated_at ON pengumuman;
DROP TRIGGER IF EXISTS update_pendaftaran_updated_at ON pendaftaran;
DROP TRIGGER IF EXISTS update_sdmk_updated_at ON sdmk;
DROP TRIGGER IF EXISTS update_sertifikat_updated_at ON sertifikat;
DROP TRIGGER IF EXISTS update_materi_updated_at ON materi;
DROP TRIGGER IF EXISTS generate_nomor_pendaftaran_trigger ON pendaftaran;

-- Drop indexes (if exist) - using IF NOT EXISTS later
DROP INDEX IF EXISTS idx_admin_users_username;
DROP INDEX IF EXISTS idx_pengumuman_status;
DROP INDEX IF EXISTS idx_pengumuman_tanggal;
DROP INDEX IF EXISTS idx_pendaftaran_nik;
DROP INDEX IF EXISTS idx_pendaftaran_nip;
DROP INDEX IF EXISTS idx_pendaftaran_status;
DROP INDEX IF EXISTS idx_pendaftaran_nama;
DROP INDEX IF EXISTS idx_pendaftaran_unit_kerja;
DROP INDEX IF EXISTS idx_pendaftaran_tanggal;
DROP INDEX IF EXISTS idx_pendaftaran_nomor;
DROP INDEX IF EXISTS idx_sdmk_nama;
DROP INDEX IF EXISTS idx_sdmk_profesi;
DROP INDEX IF EXISTS idx_sdmk_unit_kerja;
DROP INDEX IF EXISTS idx_sdmk_tahun;
DROP INDEX IF EXISTS idx_sdmk_status;
DROP INDEX IF EXISTS idx_sertifikat_nomor;
DROP INDEX IF EXISTS idx_sertifikat_penerima;
DROP INDEX IF EXISTS idx_sertifikat_pelatihan;
DROP INDEX IF EXISTS idx_materi_judul;
DROP INDEX IF EXISTS idx_materi_kategori;

-- =====================================================
-- 1. TABLE: admin_users
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL DEFAULT 'observer' CHECK (level IN ('super_admin', 'operator', 'observer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Insert default admin account (password: admin123 - should be changed)
INSERT INTO admin_users (username, password, level) VALUES 
('admin', 'admin123', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 2. TABLE: pengumuman
-- =====================================================
CREATE TABLE IF NOT EXISTS pengumuman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    isi TEXT NOT NULL,
    tanggal DATE,
    status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pengumuman_status ON pengumuman(status);
CREATE INDEX IF NOT EXISTS idx_pengumuman_tanggal ON pengumuman(tanggal DESC);

-- =====================================================
-- 3. TABLE: pendaftaran
-- =====================================================
CREATE TABLE IF NOT EXISTS pendaftaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Auto-generated registration info
    nomor_pendaftaran VARCHAR(50) UNIQUE,
    
    -- Data Personal
    foto TEXT,
    nama_lengkap VARCHAR(255) NOT NULL,
    nik VARCHAR(20) NOT NULL,
    nip VARCHAR(30) NOT NULL,
    jenis_kelamin VARCHAR(15) NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    tempat_tgl_lahir VARCHAR(100) NOT NULL,
    
    -- Data Kepegawaian & Profesi
    unit_kerja VARCHAR(150) NOT NULL,
    jenis_sdmk VARCHAR(50) NOT NULL CHECK (jenis_sdmk IN ('Tenaga Medis', 'Tenaga Kesehatan', 'Tenaga Penunjang/Pendukung')),
    jenis_profesi VARCHAR(100) NOT NULL,
    status_pekerjaan VARCHAR(30) NOT NULL CHECK (status_pekerjaan IN ('PNS', 'PPPK', 'BLUD', 'BKKD', 'Magang', 'Penugasan Khusus')),
    lama_bekerja VARCHAR(50) NOT NULL,
    
    -- Kontak
    email_plataran VARCHAR(150) NOT NULL,
    kontak VARCHAR(20) NOT NULL,
    alamat TEXT NOT NULL,
    
    -- Dokumen & Kegiatan
    surat_pernyataan TEXT,
    judul_kegiatan VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    
    -- Workflow Status
    status VARCHAR(30) DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Proses Verifikasi', 'Perbaikan', 'Disetujui', 'Ditolak')),
    catatan_status TEXT,
    diubah_oleh VARCHAR(100),
    tanggal_ubah_status TIMESTAMPTZ,
    tanggal_perbaikan TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pendaftaran_nik ON pendaftaran(nik);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_nip ON pendaftaran(nip);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran(status);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_nama ON pendaftaran(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_unit_kerja ON pendaftaran(unit_kerja);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_tanggal ON pendaftaran(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_nomor ON pendaftaran(nomor_pendaftaran);

-- =====================================================
-- 4. TABLE: sdmk
-- =====================================================
CREATE TABLE IF NOT EXISTS sdmk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Data SDMK
    nama_lengkap VARCHAR(255) NOT NULL,
    nik_nip VARCHAR(50),
    profesi VARCHAR(100) NOT NULL,
    unit_kerja VARCHAR(150),
    
    -- Data Sertifikat/Pelatihan
    no_sertifikat VARCHAR(100),
    judul_kegiatan VARCHAR(255),
    tgl_pelaksanaan VARCHAR(100),
    tahun VARCHAR(10),
    tempat VARCHAR(200),
    
    -- Status
    status_pelatihan VARCHAR(30) DEFAULT 'Aktif' CHECK (status_pelatihan IN ('Aktif', 'Nonaktif', 'Sertifikasi Ulang')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sdmk_nama ON sdmk(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_sdmk_profesi ON sdmk(profesi);
CREATE INDEX IF NOT EXISTS idx_sdmk_unit_kerja ON sdmk(unit_kerja);
CREATE INDEX IF NOT EXISTS idx_sdmk_tahun ON sdmk(tahun);
CREATE INDEX IF NOT EXISTS idx_sdmk_status ON sdmk(status_pelatihan);

-- =====================================================
-- 5. TABLE: sertifikat
-- =====================================================
CREATE TABLE IF NOT EXISTS sertifikat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_sertifikat VARCHAR(100) UNIQUE NOT NULL,
    nama_penerima VARCHAR(255) NOT NULL,
    pelatihan VARCHAR(255) NOT NULL,
    tanggal_terbit DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sertifikat_nomor ON sertifikat(nomor_sertifikat);
CREATE INDEX IF NOT EXISTS idx_sertifikat_penerima ON sertifikat(nama_penerima);
CREATE INDEX IF NOT EXISTS idx_sertifikat_pelatihan ON sertifikat(pelatihan);

-- =====================================================
-- 6. TABLE: materi
-- =====================================================
CREATE TABLE IF NOT EXISTS materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    link_file TEXT,
    
    -- Status & Timestamps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materi_judul ON materi(judul);
CREATE INDEX IF NOT EXISTS idx_materi_kategori ON materi(kategori);

-- =====================================================
-- 7. FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengumuman_updated_at BEFORE UPDATE ON pengumuman FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pendaftaran_updated_at BEFORE UPDATE ON pendaftaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sdmk_updated_at BEFORE UPDATE ON sdmk FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sertifikat_updated_at BEFORE UPDATE ON sertifikat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materi_updated_at BEFORE UPDATE ON materi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FUNCTION: Auto-generate Nomor Pendaftaran
-- Format: REG/YYYYMMDD/XXXXX
-- =====================================================
CREATE OR REPLACE FUNCTION generate_nomor_pendaftaran()
RETURNS TRIGGER AS $$
DECLARE
    date_prefix TEXT;
    sequence_num INTEGER;
BEGIN
    date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(nomor_pendaftaran FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM pendaftaran
    WHERE nomor_pendaftaran LIKE 'REG/' || date_prefix || '/%';
    
    NEW.nomor_pendaftaran := 'REG/' || date_prefix || '/' || LPAD(sequence_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_nomor_pendaftaran_trigger 
    BEFORE INSERT ON pendaftaran 
    FOR EACH ROW 
    WHEN (NEW.nomor_pendaftaran IS NULL)
    EXECUTE FUNCTION generate_nomor_pendaftaran();

-- =====================================================
-- COMMENTS / Documentation
-- =====================================================
COMMENT ON TABLE admin_users IS 'Tabel penyimpanan akun administrator sistem PAMUNGKAS';
COMMENT ON TABLE pengumuman IS 'Tabel pengumuman dan berita sistem';
COMMENT ON TABLE pendaftaran IS 'Tabel utama pendaftaran pelatihan SDM Kesehatan dengan workflow status';
COMMENT ON TABLE sdmk IS 'Tabel data SDMK terlatih beserta riwayat pelatihan/sertifikasi';
COMMENT ON TABLE sertifikat IS 'Tabel data sertifikat yang diterbitkan oleh sistem';
COMMENT ON TABLE materi IS 'Tabel materi pelatihan yang tersedia untuk diakses';

COMMENT ON COLUMN pendaftaran.status IS 'Workflow status: Menunggu, Proses Verifikasi, Perbaikan, Disetujui, Ditolak';
COMMENT ON COLUMN pendaftaran.nomor_pendaftaran IS 'Format otomatis: REG/YYYYMMDD/XXXXX';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ PAMUNGKAS Schema berhasil di-install/di-update!';
    RAISE NOTICE '📊 Tabel yang dibuat: admin_users, pengumuman, pendaftaran, sdmk, sertifikat, materi';
    RAISE NOTICE '🔑 Default login: admin / admin123';
END $$;
