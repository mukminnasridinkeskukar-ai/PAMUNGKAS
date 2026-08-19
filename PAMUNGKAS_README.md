# 🚀 PAMUNGKAS - Single Page App + Nhost

## 📁 File yang Dibuat

| File | Deskripsi | Ukuran |
|------|-----------|--------|
| `pamungkas-single-page.html` | **1 file HTML lengkap** (Frontend) | ~50KB |
| `pamungkas_schema_simple.sql` | **SQL Schema** untuk Nhost (Backend/Database) | ~8KB |

**Total: Hanya 2 file!** ✅

---

## 🎯 Cara Pakai (3 Langkah Mudah)

### Langkah 1: Setup Database di Nhost

1. Buka [console.nhost.io](https://console.nhost.io)
2. Buat project baru (gratis!)
3. Copy **Subdomain** Anda (contoh: `my-pamungkas`)
4. Menuju **Database → SQL Editor**
5. Paste isi file `pamungkas_schema_simple.sql`
6. Klik **Run** ▶️

### Langkah 2: Buka File HTML

1. Download/buka file `pamungkas-single-page.html`
2. Klik icon ⚙️ **Settings** (pojok kanan atas)
3. Isi konfigurasi:
   ```
   Nhost Subdomain: my-pamungkas  ← ganti dengan subdomain Anda
   Region: ap-southeast-1
   Admin Secret: (kosongkan dulu untuk mode demo)
   ```
4. Klik **Simpan Konfigurasi**
5. Klik **Test Connection**

### Langkah 3: Mulai Gunakan! 🎉

- **Dashboard**: Lihat statistik, klik kartu untuk lihat data
- **Import CSV**: Upload data dari Excel/CSV
- **Semua Tabel**: SDMK, Sertifikat, Pendaftaran, dll.

---

## ✨ Fitur Lengkap dalam 1 File HTML

### 🎨 Desain Modern
- ✅ Warna cerah & soft (Coral, Teal, Lavender, Amber, Rose, Sky)
- ✅ Animasi smooth & hover effects
- ✅ Responsive (mobile & desktop)
- ✅ Lightbox/Popup untuk semua data

### 📊 Dashboard Interaktif
- ✅ Stat Cards dengan angka real-time
- ✅ Chart distribusi profesi
- ✅ Aktivitas terbaru
- ✅ Quick actions (Import, Export, Tambah Data)

### 💾 Fitur Data
- ✅ **Popup Sumber Data** - Klik kartu → lihat tabel lengkap
- ✅ **CSV Import** - Drag & drop, preview, progress bar
- ✅ **Export CSV** - Download data kapan saja
- ✅ **Search & Filter** - Cari data instan
- ✅ **Pagination** - Navigasi halaman mudah

### 🔐 Integrasi Nhost
- ✅ Konfigurasi sederhana (Settings modal)
- ✅ Auto-connect ke Nhost REST API
- ✅ Support JWT authentication
- ✅ Ready untuk production

---

## 🗄️ Struktur Database (7 Tabel)

```
┌─────────────────────────────────────┐
│            users                    │  Autentikasi
├─────────────────────────────────────┤
│            sdmk                     │  Data SDM Kesehatan (utama)
├─────────────────────────────────────┤
│         sertifikat                  │  Sertifikat pelatihan
├─────────────────────────────────────┤
│        pendaftaran                  │  Registrasi peserta
├─────────────────────────────────────┤
│        pengumuman                   │  Pengumuman/pemberitahuan
├─────────────────────────────────────┤
│           materi                    │  Materi pelatihan
├─────────────────────────────────────┤
│         indikator                   │  KPI/Indikator kinerja
└─────────────────────────────────────┘
              +
┌─────────────────────────────────────┐
│        import_logs                  │  Log audit import CSV
└─────────────────────────────────────┘
```

Plus **4 Views** untuk dashboard:
- `v_dashboard_stats` - Statistik ringkasan
- `v_sdmk_per_profesi` - Distribusi per profesi
- `v_sdmk_per_unit_kerja` - Distribusi per unit kerja
- `v_sertifikat_per_tahun` - Sertifikat per tahun

---

## 🔌 API Endpoints (Nhost REST)

Setelah setup, gunakan endpoint ini:

### Base URL
```
https://{subdomain}.nhost.run/v1/rest/{tabel}
```

### Contoh Endpoint

```bash
# Get all SDMK
GET /v1/rest/sdmk

# Get by ID
GET /v1/rest/sdmk/id/{uuid}

# Create new record
POST /v1/rest/sdmk
Body: { "nama": "...", "nik": "..." }

# Update record
PATCH /v1/rest/sdmk/id/{uuid}
Body: { "kompeten": true }

# Delete record
DELETE /v1/rest/sdmk/id/{uuid}

# With filters
GET /v1/rest/sdmk?profesi=eq.Perawat&kompeten=eq.true&order=tanggal_pelaksanaan.desc&limit=50
```

### Headers (untuk authenticated requests)
```json
{
  "Authorization": "Bearer {jwt_token}",
  "x-hasura-admin-secret": "{admin_secret}"
}
```

---

## 🚀 Deploy ke Production

### Opsi 1: GitHub Pages (Gratis)
1. Push `pamungkas-single-page.html` ke repo GitHub
2. Settings → Pages → Source: main branch
3. Akses: `https://{username}.github.io/{repo}/`

### Opsi 2: Netlify (Gratis)
1. Drag & drop file HTML ke [netlify.com/drop](https://app.netlify.com/drop)
2. Dapat URL langsung!

### Opsi 3: Vercel (Gratis)
1. Connect GitHub repo
2. Auto-deploy setiap push

### Opsi 4: Nhost Hosting (Recommended)
1. Upload file ke Nhost Storage
2. Satu platform untuk frontend + backend!

---

## 📱 Mode Demo vs Production

### Mode Demo (Default)
- Menggunakan sample data bawaan
- Tidak perlu koneksi internet
- Cocok untuk presentasi/testing

### Mode Production (Terhubung Nhost)
- Data real dari database
- Multi-user support
- Persistent data
- Aktifkan dengan mengisi subdomain di Settings

---

## ❓ FAQ

**Q: Apa yang dimaksud "1 HTML + 1 Database"?**
A: Frontend = 1 file HTML (tidak perlu build/compile). Backend = 1 database PostgreSQL di Nhost.

**Q: Bisakah tambah fitur baru?**
A: Ya! Edit file HTML langsung, tidak perlu framework kompleks.

**Q: Apakah aman untuk production?**
A: Ya! Nhost menyediakan auth, RLS (Row Level Security), dan HTTPS otomatis.

**Q: Berapa user yang bisa akses?**
A: Unlimited! Nhost free tier cukup untuk ratusan user aktif.

**Q: Bagaimana backup data?**
A: Nhost auto-backup harian. Bisa juga export manual.

---

## 🎓 Tutorial Video (Coming Soon)

Subscribe untuk update tutorial lengkap!

---

## 📞 Support

Ada pertanyaan? 
- Dokumentasi Nhost: [docs.nhost.io](https://docs.nhost.io)
- Issue/Bug: Buat issue di repository

---

**Dibuat dengan ❤️ untuk SDM Kesehatan Indonesia**
