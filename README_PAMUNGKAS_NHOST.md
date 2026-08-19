# 🏥 PAMUNGKAS — Platform Manajemen SDM Kesehatan

## Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan

![Nhost](https://img.shields.io/badge/Backend-Nhost-1E293B) ![Hasura](https://img.shields.io/badge/API-Hasura%20GraphQL-5963F0) ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-181717) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)

---

## 📋 Daftar Isi

- [Tentang Project](#tentang-project)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Struktur Database](#struktur-database)
- [Prasyarat](#prasyarat)
- [Instalasi & Setup](#instalasi--setup)
- [Konfigurasi Frontend](#konfigurasi-frontend]
- [Deploy ke GitHub Pages](#deploy-ke-github-pages)
- [Penggunaan Aplikasi](#penggunaan-aplikasi)
- [Struktur File](#struktur-file)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

---

## 🎯 Tentang Project

**PAMUNGKAS** adalah sistem informasi manajemen **Sumber Daya Manusia Kesehatan (SDMK)** yang dirancang untuk:

- ✅ Mengelola data tenaga kesehatan yang telah dilatih
- ✅ Mencatat dan memverifikasi sertifikat pelatihan
- ✅ Mengelola pendaftaran pelatihan baru
- ✅ Menyediakan materi pembelajaran
- ✅ Memantau indikator kinerja program (IKP)
- ✅ Mengelola pengumuman dan informasi

Sistem ini menggunakan **Nhost** sebagai backend platform dengan database **PostgreSQL** dan API **Hasura GraphQL**, sehingga dapat di-deploy secara gratis dan mudah dikelola.

---

## ✨ Fitur Utama

### 📊 Dashboard
- Ringkasan data statistik real-time
- Indikator Kinerja Program (IKP) visual
- Data terbaru SDMK terlatih
- Status pendaftaran terkini

### 👥 Profil SDMK Terlatih
- Database 906+ tenaga kesehatan
- Filter berdasarkan profesi, unit kerja, tahun
- Foto profil dan detail lengkap
- Export ke Excel/PDF/CSV

### 📝 Pendaftaran Pelatihan
- Form pendaftaran online
- Upload dokumen pendukung
- Tracking status (Pending → Verifikasi → Disetujui/Ditolak)

### 📜 Cek Sertifikat
- Verifikasi sertifikat digital
- Link download sertifikat
- Search by nama/NIK

### 📚 Materi Pelatihan
- Download materi pelatihan
- Kategori: Modul, Video, Template, Panduan
- Upload oleh admin

### 🔐 Panel Admin
- Kelola semua data (CRUD)
- Manajemen user & hak akses
- Import/Export data bulk
- Advanced filtering & sorting

### 🎨 UI/UX Premium
- Landing page animasi premium
- Responsive design (mobile-friendly)
- Dark sidebar navigation
- Toast notifications
- Loading skeletons

---

## 🛠 Teknologi

| Komponen | Teknologi | Fungsi |
|----------|-----------|--------|
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript | Single-file application |
| **Backend** | Nhost (BaaS) | Authentication, Storage, Functions |
| **Database** | PostgreSQL 15+ | Penyimpanan data |
| **API** | Hasura GraphQL | Real-time GraphQL API |
| **Auth** | Nhost Auth | Email/password authentication |
| **Storage** | Nhost Storage | File upload (foto, dokumen) |
| **Deploy** | GitHub Pages | Static hosting gratis |
| **Fonts** | Google Fonts (Inter) | Typography |
| **Icons** | Font Awesome 6.5 | Icon library |
| **Export** | SheetJS + jsPDF | Excel/PDF generation |

---

## 🗄 Struktur Database

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   multiusers    │     │   pengumuman    │     │   indikator     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID, PK)   │◄────│ created_by (FK) │     │ id (UUID, PK)   │
│ username        │     │ id (UUID, PK)   │     │ indikator       │
│ password        │     │ judul           │     │ nilai            │
│ level           │     │ isi_pengumuman  │     │ target           │
│ status          │     │ tanggal         │     │ satuan           │
│ created_at      │     │ status          │     └─────────────────┘
│ updated_at      │     │ created_at      │
└─────────────────┘     │ updated_at      │
                         └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      sdmk       │◄────│   sertifikat    │     │     materi      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID, PK)   │     │ id (UUID, PK)   │     │ id (UUID, PK)   │
│ foto            │     │ sdmk_id (FK)    │◄────│ created_by (FK) │
│ nama            │     │ nomor_sertifikat│     │ judul_materi    │
│ nik             │     │ nama_penerima   │     │ kategori        │
│ profesi         │     │ judul_pelatihan │     │ link_download   │
│ unit_kerja      │     │ tanggal_terbit  │     │ deskripsi       │
│ nomor_sertifikat│     │ link_sertifikat │     │ created_at      │
│ judul_kegiatan  │     │ created_at      │     │ updated_at      │
│ tanggal_...     │     │ updated_at      │     └─────────────────┘
│ tahun           │     └─────────────────┘
│ tempat_...      │
│ created_at      │     ┌─────────────────┐
│ updated_at      │     │  pendaftaran    │
└─────────────────┘     ├─────────────────┤
                         │ id (UUID, PK)   │
                         │ foto            │
                         │ nama_lengkap... │
                         │ nik             │
                         │ nip             │
                         │ unit_kerja      │
                         │ jenis_profesi   │
                         │ email           │
                         │ judul_kegiatan  │
                         │ status          │
                         │ created_at      │
                         │ updated_at      │
                         └─────────────────┘
```

### Tabel Detail

#### 1. `multiusers` — User Management
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key auto-generated |
| username | VARCHAR(255) UNIQUE | Username login |
| password | VARCHAR(255) | Password (hash di production) |
| level | VARCHAR(50) | admin / operator / user |
| status | VARCHAR(20) | active / inactive / suspended |

#### 2. `pengumuman` — Announcements
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key |
| judul | VARCHAR(500) | Judul pengumuman |
| isi_pengumuman | TEXT | Isi konten |
| tanggal | DATE | Tanggal publikasi |
| status | VARCHAR(20) | published / draft / archived |
| created_by | UUID (FK) | Reference ke multiusers |

#### 3. `indikator` — Performance Indicators
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key |
| indikator | TEXT | Nama indikator |
| nilai | DECIMAL(10,2) | Nilai capaian |
| target | DECIMAL(10,2) | Target |
| satuan | VARCHAR(50) | Orang / Persen |

#### 4. `sdmk` — Healthcare Worker Data
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key |
| foto | TEXT | URL foto (Google Drive) |
| nama | VARCHAR(255) | Nama lengkap + gelar |
| nik | VARCHAR(20) | Nomor induk kependudukan |
| profesi | VARCHAR(100) | Perawat / Bidan / Dokter |
| unit_kerja | VARCHAR(255) | Unit/tempat tugas |
| nomor_sertifikat | VARCHAR(100) | No. sertifikat |
| judul_kegiatan | TEXT | Nama pelatihan |
| tanggal_pelaksanaan | VARCHAR(100) | Tanggal pelaksanaan |
| tahun | INTEGER | Tahun pelatihan |
| tempat_pelaksanaan | TEXT | Lokasi |

#### 5. `pendaftaran` — Registrations
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key |
| foto | TEXT | URL foto peserta |
| nama_lengkap_dengan_gelar | VARCHAR(255) | Nama lengkap |
| nik | VARCHAR(20) UNIQUE | NIK |
| nip | VARCHAR(30) | NIP pegawai |
| jenis_kelamin | VARCHAR(10) | Laki-laki / Perempuan |
| email_plataran_sehat | VARCHAR(255) UNIQUE | Email |
| unit_kerja | VARCHAR(255) | Unit kerja |
| jenis_profesi | VARCHAR(100) | Profesi |
| judul_kegiatan | VARCHAR(500) | Kegiatan didaftari |
| status | VARCHAR(30) | pending / approved / rejected |

#### 6. `sertifikat` — Certificates
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key |
| nomor_sertifikat | VARCHAR(100) UNIQUE | No. unik sertifikat |
| nama_penerima | VARCHAR(255) | Nama penerima |
| judul_pelatihan | TEXT | Judul pelatihan |
| tanggal_terbit | DATE | Tanggal terbit |
| link_sertifikat | TEXT | URL file sertifikat |
| sdmk_id | UUID (FK) | Reference ke sdmk |

#### 7. `materi` — Training Materials
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID (PK) | Primary key |
| judul_materi | VARCHAR(500) | Judul materi |
| kategori | VARCHAR(100) | Modul / Video / Template |
| link_download | TEXT | URL download |
| deskripsi | TEXT | Deskripsi |
| created_by | UUID (FK) | Reference ke multiusers |

---

## 📦 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

### Akun & Services
- [x] **Akun Nhost** (Gratis di [nhost.io](https://nhost.io))
- [x] **Akun GitHub** (Untuk deploy GitHub Pages)
- [x] **Google Account** (Untuk upload foto/dokumen ke Google Drive - optional)

### Tools
- [x] Browser modern (Chrome/Firefox/Edge/Safari)
- [x] Text editor (VS Code recommended)
- [x] Git (untuk push ke GitHub)

---

## 🚀 Instalasi & Setup

### Step 1: Buat Project Nhost

1. Buka [console.nhost.io](https://console.nhost.io)
2. Login atau daftar akun baru
3. Klik **"New Project"**
4. Beri nama project: `pamungkas-sdmk`
5. Pilih region: **Singapore** (terdekat Indonesia)
6. Tunggu hingga project siap (±2 menit)

### Step 2: Setup Database

1. Di Nhost Dashboard, klik menu **"Database"**
2. Klik tab **"SQL Editor"**
3. Copy seluruh isi file **`nhost_schema_pamungkas.sql`**
4. Paste ke SQL Editor
5. Klik **"Run"** untuk eksekusi
6. Pastikan tidak ada error message

```sql
-- Contoh query yang akan dijalankan:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.multiusers (...);
-- ... dan seterusnya
```

### Step 3: Track Tables di Hasura

1. Di Nhost Dashboard, klik **"Hasura"** → buka **"Console"**
2. Klik menu **"Data"** di sidebar kiri
3. Track tabel-tabel berikut satu per satu:

```
✅ public.multiusers
✅ public.pengumuman  
✅ public.indikator
✅ public.sdmk
✅ public.pendaftaran
✅ public.sertifikat
✅ public.materi
```

Cara track:
- Klik nama tabel
- Klik tombol **"Track Table"**
- Ulangi untuk semua 7 tabel

### Step 4: Dapatkan Admin Secret

1. Di Nhost Dashboard, klik **"Hasura"** → **"Settings"**
2. Scroll ke bagian **"Admin Secret"**
3. Copy **Admin Secret** value
4. Simpan di tempat aman (diperlukan untuk konfigurasi frontend) 6zFaZ5::7R5^Rwg!zPM%s,7XHicFuwvB

⚠️ **PENTING**: Admin secret ini seperti password super-admin. Jangan bagikan ke sembarang orang!

### Step 5: Insert Data Awal (Optional)

Jika ingin langsung ada data contoh, jalankan query ini di SQL Editor:

```sql
-- Insert sample indikator
INSERT INTO public.indikator (indikator, nilai, target, satuan) VALUES
('Jumlah SDM Kesehatan', NULL, NULL, 'Orang'),
('Jumlah SDM Kesehatan yang Dilatih', NULL, NULL, 'Orang'),
('Jumlah SDMK Yang Dilatih sesuai Kompetensinya', NULL, NULL, 'Orang'),
('Persentase SDMK yang mendapat peningkatan kompetensi', NULL, NULL, 'Persen'),
('Persentase SDMK yang dilatih sesuai Kompetensinya', NULL, NULL, 'Persen');

-- Insert default admin user (GANTI PASSWORD!)
INSERT INTO public.multiusers (username, password, level, status) VALUES
('admin', 'admin123', 'admin', 'active');
```

---

## ⚙️ Konfigurasi Frontend

Buka file **`pamungkas_nhost.html`** dengan text editor, cari bagian ini (sekitar baris 1707):

```javascript
var NHOST_CONFIG = {
  // Hasura GraphQL Endpoint (WAJIB DIUBAH)
  graphqlUrl: 'https://YOUR_PROJECT.nhost.run/v1/graphql',
  
  // Admin Secret dari Nhost Dashboard > Hasura > Settings > Admin Secret
  // Untuk production, gunakan Nhost Auth token, bukan admin secret
  adminSecret: 'YOUR_ADMIN_SECRET',
  
  // Nhost Auth endpoint (untuk authentication)
  authUrl: 'https://YOUR_PROJECT.nhost.run/v1/auth',
  
  // Storage URL (untuk upload file)
  storageUrl: 'https://YOUR_PROJECT.nhost.run/v1/storage'
};
```

### Ganti dengan Konfigurasi Anda:

```javascript
var NHOST_CONFIG = {
  // Ganti "pamungkas-sdmk" dengan nama project Anda
  graphqlUrl: 'https://pamungkas-sdmk.nhost.run/v1/graphql',
  
  // Paste admin secret dari Step 4
  adminSecret: 'nhost_admin_secret_anda_disini',
  
  authUrl: 'https://pamungkas-sdmk.nhost.run/v1/auth',
  storageUrl: 'https://pamungkas-sdmk.nhost.run/v1/storage'
};
```

### Cara Mendapatkan URL:
1. Buka Nhost Dashboard
2. Lihat di bagian atas: **"GraphQL API URL"**
3. Format: `https://[project-name].nhost.run/v1/graphql`

---

## 🌐 Deploy ke GitHub Pages

### Step 1: Buat Repository GitHub

1. Buka [github.com/new](https://github.com/new)
2. Repository name: `pamungkas-sdmk` (atau nama lain)
3. Pilih **Public** atau **Private**
4. Jangan centang "Add README"
5. Klik **"Create repository"**

### Step 2: Upload Files

**Opsi A: Via GitHub Web Interface**

1. Klik **"uploading an existing file"**
2. Drag & drop file:
   - `pamungkas_nhost.html`
   - `README.md` (file ini)
3. Klik **"Commit changes"**

**Opsi B: Via Git Command Line**

```bash
# Clone repository
git clone https://github.com/USERNAME/pamungkas-sdmk.git
cd pamungkas-sdmk

# Copy files
cp /path/to/pamungkas_nhost.html .
cp /path/to/README_PAMUNGKAS_NHOST.md ./README.md

# Commit & push
git add .
git commit -m "Initial commit: PAMUNGKAS SDMK System"
git branch -M main
git remote add origin https://github.com/USERNAME/pamungkas-sdmk.git
git push -u origin main
```

### Step 3: Aktifkan GitHub Pages

1. Di repository GitHub, klik **"Settings"**
2. Scroll ke **"Pages"** (sidebar kiri bawah)
3. Source: **"Deploy from a branch"**
4. Branch: **main** → Folder: **/(root)**
5. Klik **"Save"**
6. Tunggu 1-2 menit, lalu refresh halaman

### Step 4: Akses Aplikasi

URL aplikasi Anda akan menjadi:
```
https://USERNAME.github.io/pamungkas-sdmk/pamungkas_nhost.html
```

---

## 📖 Penggunaan Aplikasi

### Login Default

| Role | Username | Password | Hak Akses |
|------|----------|----------|-----------|
| Super Admin | `admin` | `admin123` | Full access |
| Operator | (buat sendiri) | (buat sendiri) | Read + Write |
| User | (buat sendiri) | (buat sendiri) | Read only |

> ⚠️ **SEGERA GANTI PASSWORD DEFAULT** di production!

### Navigasi Menu

```
📊 Dashboard          → Halaman utama dengan statistik
📢 Pengumuman        → Informasi & pengumuman resmi
👨‍⚕️ Profil SDMK      → Database tenaga kesehatan terlatih
📝 Pendaftaran       → Form pendaftaran pelatihan
📜 Cek Sertifikat    → Verifikasi sertifikat digital
📚 Cek Materi        → Download materi pelatihan
🔍 Cek Pendaftaran  → Track status pendaftaran (by NIK)
⚙️ Panel Admin       → Kelola data & pengguna
```

### Fitur CRUD (Create, Read, Update, Delete)

Semua modul mendukung operasi CRUD lengkap:

1. **Tambah Data**: Klik tombol **"+"** atau **"Tambah"**
2. **Lihat Detail**: Klik tombol **"👁 Detail"** atau klik row
3. **Edit Data**: Klik tombol **"✏ Edit"**
4. **Hapus Data**: Klik tombol **"🗑 Hapus"** → Konfirmasi

### Export Data

Di Panel Admin, tersedia fitur export:
- **CSV** → Comma-separated values
- **Excel** → Format .xlsx (SheetJS)
- **PDF** → Laporan format PDF (jsPDF)

### Import Data

1. Buka **Panel Admin** → Pilih modul
2. Klik tombol **"Import"**
3. Upload file Excel (.xlsx/.xls) atau CSV
4. System akan otomatis mapping kolom

---

## 📁 Struktur File

```
pamungkas-project/
├── 📄 pamungkas_nhost.html      # Main HTML file (Single Page App)
├── 📄 nhost_schema_pamungkas.sql # SQL schema untuk database
├── 📄 README.md                  # Dokumentasi ini
│
└── 📂 (opsional untuk development)
    ├── scripts/
    │   └── generate_nhost_html.py # Script generator
    └── download/
        ├── pamungkas_nhost.html   # Output file
        └── nhost_schema_pamungkas.sql
```

---

## 🔧 Troubleshooting

### ❌ Error: "Gagal memuat data dari server"

**Penyebab**: URL GraphQL salah atau server down

**Solusi**:
1. Cek koneksi internet
2. Pastikan `graphqlUrl` di config benar
3. Test URL di browser: `https://[project].nhost.run/v1/graphql`
4. Cek status Nhost di [status.nhost.io](https://status.nhost.io)

### ❌ Error: "GraphQL Errors: permission denied"

**Penyebab**: Admin secret salah atau belum diset

**Solusi**:
1. Copy ulang admin secret dari Nhost Dashboard
2. Update di file HTML: `adminSecret: '...'`
3. Refresh browser (Ctrl+F5)

### ❌ Error: "Table not found"

**Penyebab**: Belum tracking tabel di Hasura

**Solusi**:
1. Buka Hasura Console → Data
2. Track semua 7 tabel (lihat Step 3)
3. Refresh aplikasi

### ❌ CORS Error di Browser Console

**Penyebab**: Domain tidak diizinkan

**Solusi**:
1. Nhost sudah mengizinkan semua origins (CORS: *)
2. Jika masih error, cek custom domain settings
3. Clear browser cache

### ❌ Data tidak muncul di Dashboard

**Penyebab**: Database kosong

**Solusi**:
1. Insert data awal (lihat Step 5)
2. Atau gunakan fitur Import di Panel Admin
3. Upload file Excel dengan data

### ⚠️ Loading terlalu lambat

**Tips optimasi**:
1. Gunakan jaringan stabil
2. Nhost region Singapore optimal untuk Indonesia
3. Gambar/foto sebaiknya di-compress
4. Hindari data >1000 rows dalam satu query

---

## 🔒 Security Best Practices

### Production Checklist

- [ ] **Ganti password default admin** (`admin123`)
- [ ] **Gunakan HTTPS** (otomatis di GitHub Pages + Nhost)
- [ ] **Set Admin Secret yang kuat** (min 32 karakter)
- [ ] **Enable Nhost Auth** (jangan hanya rely admin secret)
- [ ] **Limit IP address** (jika possible)
- [ ] **Backup database rutin** (Nhost auto-backup)
- [ ] **Monitor logs** di Nhost Dashboard
- [ ] **Update dependencies** secara berkala

### Environment Variables (Advanced)

Untuk production lebih aman, pertimbangkan menggunakan environment variables:

```javascript
// Daripada hardcode, load dari secure source
var NHOST_CONFIG = {
  graphqlUrl: window.APP_CONFIG?.GRAPHQL_URL || 'fallback-url',
  adminSecret: window.APP_CONFIG?.ADMIN_SECRET || ''
};

// Config bisa di-inject via build process atau secure endpoint
```

---

## 📈 Roadmap / Future Enhancements

- [ ] **Authentication UI** — Form login/register di frontend
- [ ] **Role-based Access Control (RBAC)** — Granular permissions
- [ ] **File Upload** — Upload foto langsung ke Nhost Storage
- [ ] **Real-time Updates** — WebSocket subscriptions via Hasura
- [ ] **Mobile App** — React Native / PWA version
- [ ] **Email Notifications** — Notifikasi pendaftaran via Nhost Functions
- [ ] **Audit Log** — Track semua perubahan data
- [ ] **Multi-language** — Support Bahasa Inggris
- [ ] **Dark Mode** — Toggle light/dark theme
- [ ] **Charts/Analytics** — Grafik interaktif dengan Chart.js

---

## 🤝 Kontribusi

Ingin berkontribusi?

1. Fork repository ini
2. Buat branch feature: `git checkout -b fitur-baru`
3. Commit changes: `git commit -m 'Tambah fitur baru'`
4. Push ke branch: `git push origin fitur-baru`
5. Buat Pull Request

---

## 📞 Support & Kontak

### Dokumentasi Resmi
- **Nhost Docs**: [docs.nhost.io](https://docs.nhost.io)
- **Hasura Docs**: [hasura.io/docs](https://hasura.io/docs)
- **GitHub Pages**: [pages.github.com](https://pages.github.com)

### Community
- **Nhost Discord**: [discord.gg/nhost](https://discord.gg/nhost)
- **Hasura Discord**: [discord.gg/hasura](https://discord.gg/hasura)

### Issue & Bug Report
Jika menemukan bug atau memiliki saran, silakan buat issue di repository GitHub.

---

## 📄 Lisensi

Project ini dibuat untuk keperluan **Dinas Kesehatan** dalam pengelolaan SDM Kesehatan.

© 2024 PAMUNGKAS — Platform Pengembangan Mutu SDM Kesehatan

---

<div align="center">

**Made with ❤️ for Indonesian Healthcare Workers**

*Dibuat dengan Nhost • Hasura • GitHub Pages*

[⬆ Back to Top](#--pamungkas--platform-manajemen-sdm-kesehatan)

</div>
