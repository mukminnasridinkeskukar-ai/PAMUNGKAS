# 🏥 PAMUNGKAS

**Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan**

Platform terpadu untuk mengelola pengembangan mutu dan meningkatkan kompetensi sumber daya manusia kesehatan di Indonesia.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-foundation-green)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Daftar Isi

1. [Tentang Proyek](#tentang-proyek)
2. [Teknologi](#teknologi)
3. [Struktur Folder](#struktur-folder)
4. [Prasyarat](#prasyarat)
5. [Instalasi & Setup](#instalasi--setup)
   - [Membuat Repository GitHub](#1-membuat-repository-github)
   - [Membuat Project Supabase](#2-membuat-project-supabase)
   - [Menjalankan SQL Schema](#3-menjalankan-sql-schema)
   - [Menghubungkan Frontend dengan Supabase](#4-menghubungkan-frontend-dengan-supabase)
6. [Menjalankan Aplikasi](#menjalankan-aplikasi)
7. [Deploy ke GitHub Pages](#deploy-ke-github-pages)
8. [Dokumentasi API](#dokumentasi-api)
9. [Keamanan](#keamanan)
10. [Troubleshooting](#troubleshooting)
11. [Roadmap](#roadmap)
12. [Lisensi](#lisensi)

---

## 🎯 Tentang Proyek

### Visi

PAMUNGKAS hadir sebagai solusi digital modern untuk transformasi pengelolaan SDM kesehatan Indonesia. Platform ini dirancang untuk membangun tenaga kesehatan yang profesional, berkualitas, dan berdaya saing global.

### Misi

- Menyediakan sistem yang memudahkan perencanaan, pelaksanaan, dan evaluasi pengembangan kompetensi tenaga kesehatan
- Mengintegrasikan data SDM kesehatan dalam satu platform terpadu
- Mendukung pengambilan keputusan berbasis data melalui dashboard analitik
- Memastikan kepatuhan terhadap standar kompetensi nasional dan internasional

### Fitur Utama (Akan Dikembangkan)

| Modul | Deskripsi | Status |
|-------|-----------|--------|
| Manajemen SDM | Data lengkap tenaga kesehatan | 🔜 PROMPT 02 |
| Pelatihan & Diklat | Program pelatihan dan sertifikasi | 🔜 PROMPT 02 |
| Sertifikasi | Tracking lisensi dan kompetensi | 🔜 PROMPT 02 |
| Laporan & Analitik | Dashboard dan reporting | 🔜 PROMPT 02 |

> **Catatan:** Tahap saat ini adalah fondasi proyek. Modul bisnis akan dikembangkan pada tahap berikutnya (PROMPT 02).

---

## 🛠 Teknologi

### Frontend

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| HTML5 | - | Struktur halaman |
| CSS3 | - | Styling & layout |
| JavaScript ES6+ | - | Logika aplikasi |
| GitHub Pages | - | Hosting frontend |

### Backend / Database

| Teknologi | Kegunaan |
|-----------|----------|
| **Supabase** | Backend-as-a-Service (BaaS) |
| PostgreSQL | Database utama |
| Supabase Auth | Autentikasi user |
| Supabase RLS | Row Level Security |
| Supabase Storage | File storage (jika diperlukan) |

### Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    GITHUB PAGES                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ index   │  │ login    │  │    dashboard         │   │
│  │ .html   │  │ .html    │  │    .html             │   │
│  └─────────┘  └──────────┘  └──────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              assets/                              │   │
│  │  css/style.css, css/responsive.css               │   │
│  │  js/config.js, supabase.js, auth.js, app.js      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS (Supabase JS Client)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Auth       │  │  PostgreSQL  │  │  Storage       │ │
│  │  Service    │  │  Database    │  │  (opsional)     │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                    │                                     │
│              ┌─────┴─────┐                               │
│              │    RLS    │ ← Row Level Security         │
│              │ Policies  │                               │
│              └───────────┘                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Folder

```
pamungkas/
├── index.html                 # Halaman landing/beranda
├── login.html                 # Halaman login
├── dashboard.html             # Halaman dashboard (placeholder)
│
├── assets/
│   ├── css/
│   │   ├── style.css          # Stylesheet utama
│   │   └── responsive.css     # Stylesheet responsif
│   ├── js/
│   │   ├── config.js          # Konfigurasi aplikasi & Supabase
│   │   ├── supabase.js        # Supabase client & helpers
│   │   ├── auth.js            # Module autentikasi
│   │   └── app.js             # Logic utama aplikasi
│   └── img/                   # Folder gambar (kosong)
│
├── pages/                     # Halaman tambahan (untuk modul bisnis)
├── components/                # Komponen reusable (untuk pengembangan)
│
├── supabase/
│   └── sql/
│       ├── 01_auth_users_roles.sql    # Schema auth & roles
│       ├── 02_master_data.sql          # Master data tables
│       ├── 03_pamungkas_data.sql       # Main data tables
│       ├── 04_rls_security.sql         # RLS policies
│       ├── 05_functions_triggers.sql   # Functions & triggers
│       └── 06_seed_data.sql           # Data awal/seed
│
└── README.md                  # Dokumentasi proyek
```

---

## ✅ Prasyarat

Sebelum memulai, pastikan Anda memiliki:

### Akun & Tools

- [x] **Akun GitHub** - Untuk hosting dan version control
- [x] **Akun Supabase** - Untuk backend dan database (gratis di supabase.com)
- [x] **Git** - Terinstall di komputer Anda
- [x] **Code Editor** - VS Code direkomendasikan

### Pengetahuan Dasar

- Pemahaman dasar HTML/CSS/JavaScript
- Familiar dengan command line/Git basics
- Tidak perlu pengetahuan backend/server (karena menggunakan Supabase!)

---

## 🚀 Instalasi & Setup

### 1. Membuat Repository GitHub

#### Langkah-langkah:

1. **Login ke GitHub**
   - Buka https://github.com/login
   - Masukkan kredensial Anda

2. **Buat Repository Baru**
   - Klik tombol **"+"** → **"New repository"**
   - Isi detail repository:
     ```
     Repository name: pamungkas
     Description: Platform Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan
     Visibility: Private (direkomendasikan) atau Public
     ```
   - **Jangan centang** "Add a README file" (karena sudah ada)
   - Klik **"Create repository"**

3. **Upload File Proyek**
   
   **Opsi A: Menggunakan Git Command Line**
   ```bash
   # Navigasi ke folder proyek
   cd /path/to/pamungkas
   
   # Inisialisasi git
   git init
   
   # Tambah semua file
   git add .
   
   # Commit pertama
   git commit -m "Initial commit: PAMUNGKAS foundation"
   
   # Hubungkan ke remote repository
   git remote add origin https://github.com/USERNAME_ANDA/pamungkas.git
   
   # Push ke GitHub
   git branch -M main
   git push -u origin main
   ```

   **Opsi B: Upload Manual via GitHub**
   - Di halaman repository baru, klik **"uploading an existing file"**
   - Drag & drop semua folder dan file
   - Klik **"Commit changes"**

---

### 2. Membuat Project Supabase

#### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Kunjungi https://supabase.com/dashboard
   - Login atau daftar akun baru (gratis)

2. **Buat Project Baru**
   - Klik **"New Project"**
   - Pilih **"Create new project"**
   - Isi detail:
     ```
     Name: pamungkas-db
     Database Password: [buat password kuat!]
     Region: Pilih region terdekat (Singapore direkomendasikan)
     Pricing Plan: Free (cukup untuk development)
     ```
   - Klik **"Create new project"**
   - Tunggu 2-3 menit hingga project siap

3. **Ambil Credentials**
   - Setelah project siap, buka menu **Settings** → **API**
   - Catat dua informasi penting:
     
     | Credential | Lokasi | Contoh |
     |------------|--------|--------|
     | **Project URL** | API > URL | `https://abcdefg.supabase.co` |
     | **anon public key** | API > `anon` `public` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

   > ⚠️ **PENTING:** Jangan gunakan `service_role` key di frontend!

4. **Setup Authentication** (Opsional tapi direkomendasikan)
   - Buka menu **Authentication** → **Providers**
   - Aktifkan **Email** provider (default sudah aktif)
   - Konfigurasi email template jika perlu

---

### 3. Menjalankan SQL Schema

Setelah Supabase project siap, jalankan file-file SQL secara berurutan:

#### Cara Menjalankan via Supabase SQL Editor:

1. **Buka SQL Editor**
   - Di dashboard Supabase, klik menu **SQL Editor**
   - Klik **"New query"**

2. **Jalankan File SQL Secara Berurutan**

   **File 01: Auth Users & Roles**
   ```sql
   -- Copy seluruh isi file: supabase/sql/01_auth_users_roles.sql
   -- Paste ke SQL Editor
   -- Klik "Run" (atau Ctrl+Enter)
   ```
   
   **File 02: Master Data**
   ```sql
   -- Copy seluruh isi file: supabase/sql/02_master_data.sql
   -- Paste ke query baru
   -- Klik "Run"
   ```

   **File 03: Main Data Tables**
   ```sql
   -- Copy seluruh isi file: supabase/sql/03_pamungkas_data.sql
   -- Paste ke query baru
   -- Klik "Run"
   ```

   **File 04: RLS Security**
   ```sql
   -- Copy seluruh isi file: supabase/sql/04_rls_security.sql
   -- Paste ke query baru
   -- Klik "Run"
   ```

   **File 05: Functions & Triggers**
   ```sql
   -- Copy seluruh isi file: supabase/sql/05_functions_triggers.sql
   -- Paste ke query baru
   -- Klik "Run"
   ```

   **File 06: Seed Data** (Terakhir!)
   ```sql
   -- Copy seluruh isi file: supabase/sql/06_seed_data.sql
   -- Paste ke query baru
   -- Klik "Run"
   ```

3. **Verifikasi Hasil**
   - Setelah semua file berhasil dijalankan, cek:
     - Menu **Table Editor** → Seharusnya ada tabel: `roles`, `user_profiles`, `sdm_kesehatan`, dll
     - Menu **Authentication** → **Users** → Siap untuk membuat user admin

---

### 4. Menghubungkan Frontend dengan Supabase

#### Langkah-langkah:

1. **Buka File Config**
   - Buka file: `assets/js/config.js`
   - Cari bagian konfigurasi Supabase (sekitar baris 30-40)

2. **Update Credentials**
   ```javascript
   const PAMUNGKAS_CONFIG = {
       // ... kode lainnya ...
       
       SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
       //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       //           GANTI dengan URL dari Supabase Dashboard
       
       SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
       //                   ^^^^^^^^^^^^^^^^^^^^^^^^
       //                   GANTI dengan anon public key
       
       // ... kode lainnya ...
   };
   ```

3. **Contoh Konfigurasi yang Sudah Diisi:**
   ```javascript
   const PAMUNGKAS_CONFIG = {
       SUPABASE_URL: 'https://abcdefgh.supabase.co',
       SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicm9sZSI6ImFub24iLCJleHAiOjE3MDAwMDAwMDB9.example',
       // ... config lainnya ...
   };
   ```

4. **Simpan File**
   - Save file `config.js`
   - Jangan lupa commit dan push ke GitHub jika sudah deploy

---

## 💻 Menjalankan Aplikasi

### Opsi 1: Local Development (Tanpa Server)

Cukup buka file langsung di browser:

```bash
# Menggunakan file manager, double-click:
# - index.html (untuk halaman landing)
# - login.html (untuk halaman login)
# - dashboard.html (untuk dashboard)

# Atau via command line (macOS/Linux):
open index.html

# Atau via command line (Windows):
start index.html
```

> ⚠️ **Catatan:** Beberapa fitur mungkin tidak bekerja sempurna karena CORS policy saat dibuka lokal. Gunakan **Live Server** extension di VS Code untuk development lokal yang lebih baik.

### Opsi 2: VS Code Live Server (Direkomendasikan)

1. Install extension **Live Server** di VS Code
2. Klik kanan pada `index.html`
3. Pilih **"Open with Live Server"**
4. Aplikasi akan terbuka di `http://127.0.0.1:5500`

### Opsi 3: Deploy ke GitHub Pages (Production)

Lihat bagian [Deploy ke GitHub Pages](#deploy-ke-github-pages) di bawah.

---

## 🌐 Deploy ke GitHub Pages

### Langkah-langkah:

#### 1. Aktifkan GitHub Pages

1. Buka repository GitHub Anda
2. Klik tab **Settings**
3. Scroll ke bagian **Pages** (menu kiri)
4. Di bagian **Source**, pilih:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Klik **Save**

#### 2. Tunggu Deployment

- GitHub akan memproses deployment (biasanya 1-2 menit)
- Status akan muncul di halaman Settings > Pages
- Setelah selesai, Anda akan mendapat URL seperti:
  ```
  https://USERNAME.github.io/pamungkas/
  ```

#### 3. Akses Aplikasi

Buka URL GitHub Pages Anda:
- Landing page: `https://USERNAME.github.io/pamungkas/`
- Login: `https://USERNAME.github.io/pamungkas/login.html`
- Dashboard: `https://USERNAME.github.io/pamungkas/dashboard.html`

#### 4. Update DNS (Opsional)

Jika menggunakan domain custom:

1. Buat file `CNAME` di root folder:
   ```
   pamungkas.organisasi.go.id
   ```

2. Konfigurasi DNS record di domain provider:
   - Type: `CNAME`
   - Name: `@` (atau subdomain)
   - Value: `USERNAME.github.io`

---

## 📡 Dokumentasi API

### Supabase Client Methods

Setelah inisialisasi, berikut method yang tersedia:

```javascript
// Inisialisasi (otomatis oleh app.js)
const supabase = getSupabase();

// === AUTHENTICATION ===

// Login
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password'
});

// Logout
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// === DATABASE OPERATIONS ===

// Fetch data (dengan RLS protection)
const { data, error } = await supabase
    .from('sdm_kesehatan')
    .select('*')
    .eq('organization_id', 'uuid-here');

// Insert data
const { data, error } = await supabase
    .from('sdm_kesehatan')
    .insert([{ full_name: 'Dr. John Doe', nakes_type: 'Dokter' }])
    .select();

// Update data
const { data, error } = await supabase
    .from('sdm_kesehatan')
    .update({ employee_status: 'Aktif' })
    .eq('id', 'uuid-record');

// Delete data
const { error } = await supabase
    .from('sdm_kesehatan')
    .delete()
    .eq('id', 'uuid-record');
```

### Custom Helper Functions (di supabase.js)

```javascript
// Fetch dengan options
const result = await fetchData('sdm_kesehatan', {
    select: '*',
    filter: { is_active: true },
    order: { column: 'full_name', ascending: true },
    limit: 50
});

// Insert data
const result = await insertData('sdm_kesehatan', {
    full_name: 'Dr. Jane Smith',
    nakes_type: 'Dokter Spesialis'
});

// Update data
const result = await updateData('sdm_kesehatan', 
    { phone: '08123456789' },
    'id', 
    'uuid-record'
);

// Delete data
const result = await deleteData('sdm_kesehatan', 'id', 'uuid-record');
```

---

## 🔒 Keamanan

### Best Practices yang Diterapkan

| Aspek | Implementasi |
|-------|--------------|
| **No Backend Code** | Tidak ada Node.js/PHP di client-side |
| **Anon Key Only** | Hanya menggunakan `anon` key (bukan `service_role`) |
| **Row Level Security** | Semua tabel dilindungi RLS policies |
| **Role-Based Access** | 5 level role: super_admin, admin, manajer, operator, viewer |
| **Input Validation** | Validasi client + server side |
| **Password Hashing** | Ditangani oleh Supabase Auth (bcrypt) |
| **Session Management** | JWT tokens dengan auto-refresh |

### Yang HARUS Dihindari

❌ **JANGAN PERNAH:**
- Menambahkan `service_role` key ke `config.js`
- Menonaktifkan RLS di production
- Hardcode password atau credentials
- Mem-bypass autentikasi di client-side
- Mengexpose business logic sensitif di frontend

### Security Checklist

- [ ] Supabase project menggunakan password yang kuat
- [ ] RLS enabled di semua tabel
- [ ] Hanya anon key yang digunakan di frontend
- [ ] Fitur registration dimatikan (default)
- [ ] HTTPS aktif (otomatis di GitHub Pages)
- [ ] Tidak ada sensitive data di localStorage (kecuali session token)

---

## 🔧 Troubleshooting

### Masalah Umum & Solusi

#### ❌ "Supabase library belum dimuat"

**Penyebab:** Script Supabase JS tidak dimuat

**Solusi:** Tambahkan di `<head>` setiap HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

#### ❌ "Invalid API key"

**Penyebab:** Salah key atau belum update config.js

**Solusi:**
1. Cek ulang `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `config.js`
2. Pastikan menggunakan key `anon`, bukan `service_role`

#### ❌ "new row violates row-level security policy"

**Penyebab:** User tidak memiliki akses sesuai RLS

**Solusi:**
1. Pastikan user sudah login
2. Cek role user di tabel `user_profiles`
3. Pastikan data yang diakses sesuai organisasi user

#### ❌ "relation does not exist"

**Penyebab:** Belum menjalankan SQL schema

**Solusi:** Jalankan semua file SQL di `supabase/sql/` secara berurutan

#### ❌ CORS Error di local development

**Penyebab:** Browser memblokir request cross-origin

**Solusi:**
- Gunakan VS Code Live Server
- Atau deploy ke GitHub Pages untuk testing

#### ❌ CSS/Tidak tampil dengan benar

**Penyebab:** Path file salah

**Solusi:** Pastikan struktur folder sama persis dengan dokumentasi

---

## 🗺️ Roadmap

### Tahap Saat Ini: Foundation ✅
- [x] Struktur proyek
- [x] Frontend dasar (landing, login, dashboard placeholder)
- [x] Supabase integration
- [x] SQL schema (6 files)
- [x] Dokumentasi

### Tahap Berikutnya: PROMPT 02 🔜
- [ ] Modul manajemen SDM kesehatan
- [ ] CRUD operations lengkap
- [ ] Form input dengan validasi
- [ ] Tabel data dengan pagination
- [ ] Search & filter functionality
- [ ] Export data (Excel/PDF)

### Future Enhancements
- [ ] Dark mode support
- [ ] Multi-language (Bahasa Inggris)
- [ ] Real-time notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics dashboard
- [ ] Integration dengan SIMRS existing

---

## 📞 Support & Kontribusi

### Melaporkan Bug

Jika menemukan bug, silakan buka issue di GitHub dengan format:

```
**Deskripsi Bug:** [jelaskan masalah]

**Langkah Reproduksi:**
1. Buka halaman ...
2. Klik ...
3. Terjadi error ...

**Expected Behavior:** [seharusnya apa]
**Actual Behavior:** [yang terjadi]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/macOS/Linux]
- Screen size: [desktop/mobile]
```

### Request Fitur

Fitur baru bisa di-request melalui GitHub Issues dengan label `enhancement`.

---

## 📄 Lisensi

Proyek ini dilisensikan under MIT License. Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

```
MIT License

Copyright (c) 2025 PAMUNGKAS Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [GitHub Pages](https://pages.github.com) - Hosting statis gratis
- Tim Developer PAMUNGKAS

---

<div align="center">

**🏥 PAMUNGKAS**
*Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan*

*Dibuat dengan ❤️ untuk Kesehatan Indonesia*

[🏠 Home](./index.html) • [🔑 Login](./login.html) • [📊 Dashboard](./dashboard.html)

</div>
