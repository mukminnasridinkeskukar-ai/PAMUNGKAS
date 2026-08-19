-- ============================================================
-- NHOST POSTGRESQL SCHEMA FOR PAMUNGKAS PLATFORM
-- Sistem Informasi Manajemen SDM Kesehatan
-- Compatible: Nhost / Hasura / PostgreSQL
-- Generated from: pamungkas versi nhost.xlsx
-- ============================================================

-- Enable UUID extension (required by Nhost)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLE: multiusers (User Management)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.multiusers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
        -- Note: In production, use Nhost Auth instead of storing passwords
        -- This field can be used for additional app-level auth if needed
    level VARCHAR(50) NOT NULL DEFAULT 'user',
        -- Values: 'admin', 'operator', 'user', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'active',
        -- Values: 'active', 'inactive', 'suspended'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for username lookup
CREATE INDEX idx_multiusers_username ON public.multiusers(username);
CREATE INDEX idx_multiusers_level ON public.multiusers(level);
CREATE INDEX idx_multiusers_status ON public.multiusers(status);

-- Add comment
COMMENT ON TABLE public.multiusers IS 'Tabel manajemen pengguna (users) untuk platform Pamungkas';
COMMENT ON COLUMN public.multiusers.level IS 'Level akses: admin, operator, user';
COMMENT ON COLUMN public.multiusers.status IS 'Status user: active, inactive, suspended';

-- ============================================================
-- 2. TABLE: pengumuman (Announcements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(500) NOT NULL,
    isi_pengumuman TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
        -- Values: 'published', 'draft', 'archived'
    created_by UUID REFERENCES public.multiusers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_pengumuman_tanggal ON public.pengumuman(tanggal);
CREATE INDEX idx_pengumuman_status ON public.pengumuman(status);
CREATE INDEX idx_pengumuman_created_by ON public.pengumuman(created_by);

-- Add comment
COMMENT ON TABLE public.pengumuman IS 'Tabel pengumuman/informasi untuk platform Pamungkas';
COMMENT ON COLUMN public.pengumuman.status IS 'Status publikasi: published, draft, archived';

-- ============================================================
-- 3. TABLE: indikator (Performance Indicators)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.indikator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indikator TEXT NOT NULL,
        -- Nama/deskripsi indikator kinerja
    nilai DECIMAL(10,2),
        -- Nilai capaian saat ini
    target DECIMAL(10,2),
        -- Target yang ingin dicapai
    satuan VARCHAR(50),
        -- Satuan pengukuran: Orang, Persen, dll.
    periode VARCHAR(20),
        -- Periode pelaporan: bulanan, tahunan, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_indikator_periode ON public.indikator(periode);

-- Add comment
COMMENT ON TABLE public.indikator IS 'Tabel indikator kinerja/capaian program SDM Kesehatan';
COMMENT ON COLUMN public.indikator.satuan IS 'Satuan: Orang, Persen, dll.';

-- ============================================================
-- 4. TABLE: sdmk (SDM Kesehatan Data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sdmk (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    foto TEXT,
        -- URL foto profil (Google Drive link, etc.)
    nama VARCHAR(255) NOT NULL,
        -- Nama lengkap dengan gelar
    nik VARCHAR(20),
        -- Nomor Induk Kependudukan (unique identifier)
    profesi VARCHAR(100),
        -- Profesi: Perawat, Bidan, Dokter, dll.
    unit_kerja VARCHAR(255),
        -- Unit kerja/tempat tugas
    nomor_sertifikat VARCHAR(100),
        -- Nomor sertifikat (reference ke tabel sertifikat)
    judul_kegiatan TEXT,
        -- Nama pelatihan/kegiatan yang diikuti
    tanggal_pelaksanaan VARCHAR(100),
        -- Tanggal pelaksanaan kegiatan
    tahun INTEGER,
        -- Tahun pelaksanaan
    tempat_pelaksanaan TEXT,
        -- Lokasi pelatihan/kegiatan
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_sdmk_nik ON public.sdmk(nik);
CREATE INDEX idx_sdmk_profesi ON public.sdmk(profesi);
CREATE INDEX idx_sdmk_unit_kerja ON public.sdmk(unit_kerja);
CREATE INDEX idx_sdmk_tahun ON public.sdmk(tahun);
CREATE INDEX idx_sdmk_nama ON public.sdmk(nama);

-- Add unique constraint on NIK if needed
-- ALTER TABLE public.sdmk ADD CONSTRAINT uq_sdmk_nik UNIQUE (nik);

-- Add comment
COMMENT ON TABLE public.sdmk IS 'Tabel data utama Sumber Daya Manusia Kesehatan (SDMK)';
COMMENT ON COLUMN public.sdmk.foto IS 'URL foto (Google Drive, storage, etc.)';
COMMENT ON COLUMN public.sdmk.nik IS 'Nomor Induk Kependudukan';

-- ============================================================
-- 5. TABLE: pendaftaran (Registrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pendaftaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Data Pribadi
    foto TEXT,
        -- URL foto pendaftar
    nama_lengkap_dengan_gelar VARCHAR(255) NOT NULL,
    nik VARCHAR(20) UNIQUE NOT NULL,
    nip VARCHAR(30),
        -- Nomor Induk Pegawai
    jenis_kelamin VARCHAR(10),
        -- Laki-laki, Perempuan
    tempat_dan_tanggal_lahir VARCHAR(100),
    email_plataran_sehat VARCHAR(255) UNIQUE,
    nomor_whatsapp VARCHAR(20),
    alamat_rumah TEXT,
    
    -- Data Pekerjaan
    unit_kerja VARCHAR(255) NOT NULL,
    pekerjaan VARCHAR(100),
    lama_bekerja_di_unit_sekarang VARCHAR(50),
        -- Contoh: "2 tahun", "5 bulan"
    jenis_sdmk VARCHAR(50),
        -- Jenis SDM Kesehatan
    jenis_profesi VARCHAR(100),
        -- Profesi spesifik
    
    -- Dokumen & Kegiatan
    surat_pernyataan TEXT,
        -- URL file surat pernyataan
    judul_kegiatan VARCHAR(500) NOT NULL,
        -- Kegiatan yang didaftari
    
    -- Status & Metadata
    status VARCHAR(30) DEFAULT 'pending',
        -- pending, approved, rejected, verified
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_pendaftaran_nik ON public.pendaftaran(nik);
CREATE INDEX idx_pendaftaran_email ON public.pendaftaran(email_plataran_sehat);
CREATE INDEX idx_pendaftaran_status ON public.pendaftaran(status);
CREATE INDEX idx_pendaftaran_judul_kegiatan ON public.pendaftaran(judul_kegiatan);
CREATE INDEX idx_pendaftaran_unit_kerja ON public.pendaftaran(unit_kerja);
CREATE INDEX idx_pendaftaran_jenis_profesi ON public.pendaftaran(jenis_profesi);

-- Add comment
COMMENT ON TABLE public.pendaftaran IS 'Tabel pendaftaran peserta pelatihan/kegiatan SDMK';
COMMENT ON COLUMN public.pendaftaran.status IS 'Status: pending, approved, rejected, verified';

-- ============================================================
-- 6. TABLE: sertifikat (Certificates)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sertifikat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_sertifikat VARCHAR(100) UNIQUE NOT NULL,
        -- Nomor unik sertifikat
    nama_penerima VARCHAR(255) NOT NULL,
        -- Nama penerima sertifikat
    judul_pelatihan TEXT NOT NULL,
        -- Nama/judul pelatihan
    tanggal_terbit DATE NOT NULL,
        -- Tanggal terbit sertifikat
    link_sertifikat TEXT NOT NULL,
        -- URL file sertifikat (Google Drive, etc.)
    
    -- Optional: Link to SDMK table
    sdmk_id UUID REFERENCES public.sdmk(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sertifikat_nomor ON public.sertifikat(nomor_sertifikat);
CREATE INDEX idx_sertifikat_nama ON public.sertifikat(nama_penerima);
CREATE INDEX idx_sertifikat_tanggal ON public.sertifikat(tanggal_terbit);
CREATE INDEX idx_sertifikat_sdmk_id ON public.sertifikat(sdmk_id);

-- Add comment
COMMENT ON TABLE public.sertifikat IS 'Tabel data sertifikat pelatihan SDMK';
COMMENT ON COLUMN public.sertifikat.link_sertifikat IS 'URL file sertifikat digital';

-- ============================================================
-- 7. TABLE: materi (Training Materials)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul_materi VARCHAR(500) NOT NULL,
        -- Judul materi pelatihan
    kategori VARCHAR(100) NOT NULL,
        -- Kategori materi: Modul, Video, Template, dll.
    link_download TEXT NOT NULL,
        -- URL download file materi
    deskripsi TEXT,
        -- Deskripsi singkat materi
    created_by UUID REFERENCES public.multiusers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_materi_kategori ON public.materi(kategori);
CREATE INDEX idx_materi_judul ON public.materi(judul_materi);
CREATE INDEX idx_materi_created_by ON public.materi(created_by);

-- Add comment
COMMENT ON TABLE public.materi IS 'Tabel materi/bahan pelatihan untuk diunduh';
COMMENT ON COLUMN public.materi.kategori IS 'Kategori: Modul, Video, Template, Panduan, dll.';

-- ============================================================
-- HASURA PERMISSIONS & CONFIGURATION
-- Run these in Hasura Console or Nhost Dashboard
-- ============================================================

/*
-- Enable Hasura tracking for all tables (run in Hasura Console)

-- Track tables:
SET LOCAL hasura.track_table = 'public.multiusers';
SET LOCAL hasura.track_table = 'public.pengumuman';
SET LOCAL hasura.track_table = 'public.indikator';
SET LOCAL hashasura.track_table = 'public.sdmk';
SET LOCAL hasura.track_table = 'public.pendaftaran';
SET LOCAL hasura.track_table = 'public.sertifikat';
SET LOCAL hasura.track_table = 'public.materi';

-- Example Role-Based Access Control (RBAC) for Hasura:

-- Create role "user" for regular users
CREATE ROLE user;

-- Grant select on public tables to user role
GRANT SELECT ON public.pengumuman TO user;
GRANT SELECT ON public.indikator TO user;
GRANT SELECT ON public.sdmk TO user;
GRANT SELECT ON public.sertifikat TO user;
GRANT SELECT ON public.materi TO user;

-- Allow users to insert their own registration
GRANT INSERT(id, nama_lengkap_dengan_gelar, nik, nip, jenis_kelamin, 
             tempat_dan_tanggal_lahir, email_plataran_sehat, nomor_whatsapp, 
             alamat_rumah, unit_kerja, pekerjaan, lama_bekerja_di_unit_sekarang, 
             jenis_sdmk, jenis_profesi, surat_pernyataan, judul_kegiatan, 
             status, created_at, updated_at) 
ON public.pendaftaran TO user;

-- Create role "admin" for administrators  
CREATE ROLE admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
*/

-- ============================================================
-- FUNCTION: Update updated_at timestamp automatically
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for each table
DROP TRIGGER IF EXISTS update_multiusers_updated_at ON public.multiusers;
CREATE TRIGGER update_multiusers_updated_at
    BEFORE UPDATE ON public.multiusers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pengumuman_updated_at ON public.pengumuman;
CREATE TRIGGER update_pengumuman_updated_at
    BEFORE UPDATE ON public.pengumuman
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_indikator_updated_at ON public.indikator;
CREATE TRIGGER update_indikator_updated_at
    BEFORE UPDATE ON public.indikator
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sdmk_updated_at ON public.sdmk;
CREATE TRIGGER update_sdmk_updated_at
    BEFORE UPDATE ON public.sdmk
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pendaftaran_updated_at ON public.pendaftaran;
CREATE TRIGGER update_pendaftaran_updated_at
    BEFORE UPDATE ON public.pendaftaran
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sertifikat_updated_at ON public.sertifikat;
CREATE TRIGGER update_sertifikat_updated_at
    BEFORE UPDATE ON public.sertifikat
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_materi_updated_at ON public.materi;
CREATE TRIGGER update_materi_updated_at
    BEFORE UPDATE ON public.materi
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SAMPLE DATA INSERTION (Optional - from your Excel data)
-- Uncomment to insert existing data
-- ============================================================

-- Insert sample indikator data
INSERT INTO public.indikator (indikator, nilai, target, satuan) VALUES
('Jumlah SDM Kesehatan', NULL, NULL, 'Orang'),
('Jumlah SDM Kesehatan yang Dilatih', NULL, NULL, 'Orang'),
('Jumlah SDM Kesehatan Yang Dilatih sesuai Kompetensinya', NULL, NULL, 'Orang'),
('Persentase SDMK yang mendapat peningkatan kompetensi', NULL, NULL, 'Persen'),
('Persentase SDMK yang dilatih sesuai Kompetensinya', NULL, NULL, 'Persen');

-- ============================================================
-- SUMMARY OF CREATED TABLES
-- ============================================================
/*
┌─────────────────┬──────────────┬──────────────────────────────────┐
│ Table Name      │ Primary Key  │ Description                      │
├─────────────────┼──────────────┼──────────────────────────────────┤
│ multiusers      │ UUID         │ User management & authentication │
│ pengumuman      │ UUID         │ Announcements/notifications       │
│ indikator       │ UUID         │ Performance indicators           │
│ sdmk            │ UUID         │ Main healthcare worker data      │
│ pendaftaran     │ UUID         │ Training registrations           │
│ sertifikat      │ UUID         │ Certificate records              │
│ materi          │ UUID         │ Training materials/downloads     │
└─────────────────┴──────────────┴──────────────────────────────────┘

Features included:
✅ UUID primary keys (Nhost standard)
✅ Auto-updating updated_at timestamps
✅ Foreign key relationships
✅ Performance indexes
✅ Table comments for documentation
✅ Ready for Hasura GraphQL integration
*/

-- ============================================================
-- END OF SCHEMA
-- ============================================================
