# 🚀 PAMUNGKAS - GitHub Pages Deployment Guide

## 📋 File yang Diperlukan

Pastikan folder GitHub Anda berisi **2 file ini** (di root/akar):

```
📁 repository-anda/
├── 📄 index.html          (utama - sudah diperbaiki)
└── 📄 nhost-config.js     (konfigurasi Nhost - sudah diperbaiki)
```

---

## 🔧 Langkah Deploy ke GitHub Pages

### 1. Buat Repository Baru (atau gunakan existing)

1. Login ke [github.com](https://github.com)
2. Klik **+** → **New repository**
3. Nama: `pamungkas-app` (atau nama lain)
4. Pilih **Public** atau **Private**
5. **Jangan centang** "Add README file"
6. Klik **Create repository**

### 2. Upload Files

**Opsi A: Drag & Drop (Paling Mudah)**
1. Buka repository baru
2. Klik **"uploading an existing file"**
3. Drag file `index.html` dan `nhost-config.js` dari folder download
4. Klik **Commit changes**

**Opsi B: Git Command Line**
```bash
# Clone repo
git clone https://github.com/USERNAME/pamungkas-app.git
cd pamungkas-app

# Copy files
cp /home/z/my-project/download/index.html .
cp /home/z/my-project/download/nhost-config.js .

# Commit & push
git add .
git commit -m "Deploy PAMUNGKAS app"
git push origin main
```

### 3. Aktifkan GitHub Pages

1. Buka repository → tab **Settings**
2. Scroll ke bagian **Pages** (menu kiri)
3. Source: **Deploy from a branch**
4. Branch: **main** → **/ (root)**
5. Klik **Save**

### 4. Tunggu Deploy (1-2 menit)

GitHub akan memberikan URL:
```
https://USERNAME.github.io/pamungkas-app/
```

---

## ✅ Cek Aplikasi

Buka URL GitHub Pages Anda:

1. **Landing page** harus muncul dengan animasi
2. Tekan **F12** → Console browser
3. Harus muncul:
   ```
   🚀 PAMUNGKAS + NHOST
   ✅ Nhost Client initialized
   🌍 Running on GitHub Pages
   🔄 Using CORS Proxy mode
   ```
4. Tunggu 2 detik, harus muncul:
   ```
   ✅ SUCCESS! Connected to Nhost/Hasura
   ```

### Test Login:
- Username: `admin`
- Password: `admin123`

---

## 🔧 Troubleshooting

### Error: "Gagal memuat nhost-config.js"
**Penyebab:** File tidak ada di folder yang sama
**Solusi:** Pastikan kedua file di root repository (bukan di subfolder)

### Error: "CORS policy blocked"
**Penyebab:** Browser memblokir request cross-origin
**Solusi:** File sudah dilengkapi CORS proxy otomatis! Jika masih gagal:
- Refresh halaman (Ctrl+F5)
- Coba browser lain
- Tunggu beberapa menit (proxy bisa down sementara)

### Error: "ERR_NAME_NOT_RESOLVED"
**Penyebab:** URL Nhost salah atau project tidak aktif
**Solusi:**
1. Cek [console.nhost.io](https://console.nhost.io) - pastikan project **Running**
2. Verifikasi URL di `nhost-config.js` benar

### Error: "GraphQL error"
**Penyebab:** Schema belum di-import ke Nhost
**Solusi:** Import SQL schema terlebih dahulu:
1. Buka [console.nhost.io](https://console.nhost.io)
2. Project → Hasura → SQL
3. Paste isi file `pamungkas_nhost_schema.sql`
4. Klik **Run**

---

## 📊 Fitur yang Sudah Diimplementasikan

| Fitur | Status | Keterangan |
|-------|--------|------------|
| Auto Environment Detect | ✅ | Otomatis detect GitHub Pages / Localhost |
| Multi Transport Mode | ✅ | Direct / CORS Proxy / JSONP |
| CORS Proxy Fallback | ✅ | 3 proxy alternatif (AllOrigins, CORSProxy, ThingProxy) |
| Connection Test | ✅ | Auto-test saat load, bisa manual via `testConnection()` |
| Error Handling | ✅ | Fallback config jika file gagal load |
| CSP Headers | ✅ | Content Security Policy untuk GitHub Pages |

---

## 🌐 URL Penting

| Service | URL |
|---------|-----|
| **GitHub Pages App** | `https://USERNAME.github.io/pamungkas-app/` |
| **Nhost Dashboard** | [console.nhost.io](https://console.nhost.io) |
| **Hasura GraphQL** | `https://fxqicegiwzfonrugxine.nhost.run/v1/graphql` |
| **Nhost Auth** | `https://fxqicegiwzfonrugxine.nhost.run/v1/auth` |

---

## 💡 Tips

1. **Debug Mode**: Buka console browser, ketik `testConnection()` untuk test ulang koneksi
2. **Password Admin**: Ganti password default (`admin123`) setelah login pertama
3. **Backup Data**: Nhost sudah auto-backup, tapi export SQL secara berkala tetap disarankan
4. **Custom Domain**: Bisa tambahkan custom domain di Settings → Pages → Custom domain

---

## 🆘 Bantuan

Jika ada masalah:
1. Cek console browser (F12) untuk error detail
2. Pastikan semua file sudah ter-upload
3. Verifikasi Nhost project status: Running
4. Import SQL schema jika belum

**File siap deploy:**
- `/home/z/my-project/download/index.html` 
- `/home/z/my-project/download/nhost-config.js`
- `/home/z/my-project/download/pamungkas_nhost_schema.sql` (untuk import ke Nhost)

---

**Selamat menggunakan PAMUNGKAS di GitHub Pages! 🎉**
