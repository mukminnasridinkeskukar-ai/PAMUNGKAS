-- ============================================================================
-- PAMUNGKAS — MIGRASI TABEL `petunjuk_admin` (v7.6.4)
-- ----------------------------------------------------------------------------
-- FUNGSI : Menyimpan isi "Panduan Admin" (Petunjuk Penggunaan bagi admin)
--          di DATABASE sehingga konten hanya dapat diambil lewat GraphQL
--          oleh role yang memiliki izin SELECT — proteksi server-side,
--          bukan sekadar disembunyikan di layar.
--
-- CARA AKTIFASI (wajib, sekali saja):
--   1. Buka Nhost Dashboard → bagian Database/SQL (SQL Editor)
--   2. Tempel seluruh isi berkas ini lalu jalankan (Run)
--   3. Buka Nhost Dashboard → Hasura → Data → tabel `petunjuk_admin`
--      → tab "Permissions" → tambah/atur role berikut:
--         - superadmin : SELECT ✓ (full/prefixed semua kolom)
--         - admin      : SELECT ✓
--         - operator   : SELECT ✓
--         (role `public` dan `user` TIDAK diberi izin → konten terlindungi)
--   4. Selesai — kartu "Panduan Admin" di menu Petunjuk Penggunaan akan
--      memuat isi langsung dari tabel ini setiap dibuka oleh admin login.
--
-- UJI CEK cepat (harus GAGAL/error permission bila dijalankan tanpa login):
--   query { petunjuk_admin { id judul } }
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.petunjuk_admin (
  id serial PRIMARY KEY,
  judul text NOT NULL DEFAULT 'Panduan Admin PAMUNGKAS',
  konten text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

COMMENT ON TABLE  public.petunjuk_admin IS 'Isi Panduan Admin (Petunjuk Penggunaan) — dibaca aplikasi via GraphQL, hanya untuk role admin/operator/superadmin';
COMMENT ON COLUMN public.petunjuk_admin.konten    IS 'JSON array bab: [{t: judul bab, i: ikon FontAwesome, c: HTML isi bab}]';
COMMENT ON COLUMN public.petunjuk_admin.updated_by IS 'Username admin yang terakhir memperbarui isi panduan';

-- Isi awal Panduan Admin (10 bab). Guard NOT EXISTS mencegah duplikasi bila
-- berkas dijalankan ulang — untuk memperbarui isi, UPDATE baris lewat SQL.
INSERT INTO public.petunjuk_admin (judul, konten, updated_by)
SELECT
  'Panduan Admin PAMUNGKAS',
  $konten$[
    {
      "t": "Tentang Panel Admin & Peran Pengguna",
      "i": "fa-user-shield",
      "c": "<p><b>Panel Admin</b> adalah pusat pengelolaan sistem PAMUNGKAS: seluruh data indikator, SDMK, pendaftaran, materi, pengumuman, sertifikat, hingga akun pengguna dikelola dari sini. Panel hanya dapat diakses setelah login berhasil, dan setiap aktivitas tunduk pada aturan keamanan sesi (bab 2).</p><p>Sistem mengenal <b>tiga level admin</b>: <b>superadmin</b> memiliki akses penuh termasuk manajemen akun pengguna; <b>admin</b> mengelola seluruh data operasional dan informasi; <b>operator</b> fokus pada input dan verifikasi data harian. Menu pada sidebar grup <b>ADMIN</b> otomatis menyesuaikan dengan level Anda — modul yang tidak diizinkan tidak akan tampil sama sekali.</p><div class='g-tip'><i class='fas fa-lightbulb'></i><span>Gunakan akun sesuai kebutuhan tugas Anda. Jangan menggunakan akun superadmin untuk pekerjaan harian yang cukup dengan level operator — ini mengurangi risiko bila akun terpapar.</span></div>"
    },
    {
      "t": "Login, Sesi & Keluar dengan Aman",
      "i": "fa-lock",
      "c": "<p>Login dilakukan melalui tombol <b>Login Admin</b> pada sidebar (atau halaman Panel Admin). Masukkan <b>username</b> dan <b>password</b> akun yang terdaftar pada tabel Multiusers. Setelah login berhasil, identitas dan level Anda tampil pada bagian atas aplikasi dan menu ADMIN terbuka.</p><p>Aturan keamanan sesi yang berlaku: <b>(1)</b> salah password 3 kali berturut-turut → akun terkunci <b>15 menit</b> (dicatat di server, tidak bisa diatasi dengan refresh); <b>(2)</b> tanpa aktivitas selama <b>15 menit</b> → sesi diakhiri otomatis dan Anda dialihkan ke halaman utama mukminnasri.com; <b>(3)</b> sesi tervalidasi berlapis — token autentikasi, pencatatan sesi di database <i>security.session_tracking</i>, dan status akun aktif diperiksa berkala.</p><p><b>Selalu keluar melalui tombol Logout</b> di sidebar, terutama pada komputer bersama. Menutup tab saja tidak mengakhiri sesi. Setelah logout, seluruh jejak sesi pada perangkat dibersihkan dan kembali ke halaman publik.</p><div class='g-tip'><i class='fas fa-triangle-exclamation'></i><span>Jangan pernah membagikan kredensial melalui pesan/email. Bila terpaksa tercatat, segera ganti password dan laporkan kepada superadmin untuk pemeriksaan riwayat sesi.</span></div>"
    },
    {
      "t": "Dashboard Admin",
      "i": "fa-th-large",
      "c": "<p>Dashboard menampilkan Indikator Kinerja Program dan kartu-kartu statistik: Total SDMK, Total Pendaftar, Sertifikat Terbit, Pengumuman, rincian per profesi (dokter, perawat, bidan, nakes lainnya), per status kepegawaian (PNS, PPPK, Non ASN), dan per jenis kelamin.</p><p><b>Klik kartu mana pun</b> untuk membuka popup berisi SELURUH baris data asal statistik — bukan hanya sampel — sehingga Anda dapat memverifikasi angka langsung dari database. Popup memuat data penuh dari Nhost/Hasura setiap kali dibuka, sehingga jumlahnya selalu sesuai kondisi database saat itu.</p><p>Tabel <b>Pendaftar Terbaru</b> (20 baris terakhir) menampilkan foto pendaftar, nama, unit kerja, profesi, pekerjaan, judul kegiatan, dan status. Klik foto untuk memperbesar. Ini cara tercepat mengecek pendaftar yang baru masuk sebelum membuka Panel Admin.</p>"
    },
    {
      "t": "Struktur Panel Admin",
      "i": "fa-sitemap",
      "c": "<p>Panel Admin menggunakan pola <b>satu frame multi-tab</b>: satu halaman berisi tab <b>Ringkasan</b> plus tab untuk setiap modul data yang Anda boleh kelola. Berpindah modul cukup dengan memilih tab di bagian atas panel atau melalui menu grup ADMIN pada sidebar — halaman tidak perlu dimuat ulang.</p><p>Modul dikelompokkan menjadi tiga kategori: <b>Data Utama</b> (Indikator, SDMK, Pendaftaran, Materi), <b>Informasi</b> (Pengumuman, Sertifikat), dan <b>Sistem</b> (Multiusers). Setiap modul memiliki toolbar pencarian, tombol tambah data, dan aksi per baris (lihat detail, ubah, hapus).</p><p>Tab <b>Ringkasan</b> menyajikan ringkasan jumlah seluruh tabel. Gunakan sebagai titik awal setiap kali login untuk memantau apakah ada pendaftar baru atau tugas verifikasi yang tertunda.</p>"
    },
    {
      "t": "Mengelola Data Utama",
      "i": "fa-database",
      "c": "<p><b>Indikator</b> — kelola capaian kinerja program yang tampil di dashboard publik: indikator, nilai, target, satuan, dan periode. Pastikan nilai diperbarui berkala agar dashboard publik selalu akurat.</p><p><b>SDMK</b> — direktori tenaga kesehatan terlatih yang tampil pada menu publik Profil SDMK Terlatih. Isi nama dengan gelar, NIK, profesi, unit kerja, nomor sertifikat, judul kegiatan, tanggal &amp; tempat pelaksanaan, tahun, dan link foto (Google Drive atau unggahan). Baris di sini berbeda dari Pendaftaran: SDMK adalah data tenaga kesehatan yang SUDAH terlatih.</p><p><b>Pendaftaran</b> — seluruh pendaftaran pelatihan yang masuk dari form publik, lengkap dengan foto, surat pernyataan, dan link SPJ. Klik detail untuk melihat semua kolom termasuk file yang diunggah pendaftar.</p><p><b>Materi</b> — materi pelatihan yang tampil di menu publik Cek Materi: judul, kategori, link unduhan, dan deskripsi. Tambahkan materi baru setiap kegiatan pelatihan selesai.</p><div class='g-tip'><i class='fas fa-pen'></i><span>Selalu gunakan tombol <b>Ubah</b> pada baris data untuk mengedit — jangan menghapus lalu membuat ulang, karena ID data akan berubah dan dapat merusak rujukan (mis. nomor sertifikat).</span></div>"
    },
    {
      "t": "Verifikasi Pendaftaran (Workflow)",
      "i": "fa-clipboard-check",
      "c": "<p>Setiap pendaftaran baru berstatus <b>pending</b>. Tugas admin/operator: buka tab Pendaftaran → klik baris pendaftar → periksa kelengkapan: data diri sesuai identitas, pas foto jelas, surat pernyataan terlampir, dan link SPJ dapat dibuka (bila kegiatan mensyaratkan).</p><p>Setelah pemeriksaan, ubah status: <b>approved</b> bila lengkap dan benar (pendaftar tercatat sebagai peserta), atau <b>rejected</b> bila tidak memenuhi syarat. Saat menolak, <b>wajib mengisi catatan admin</b> yang jelas — catatan ini tampil pada halaman Cek Pendaftaran milik pendaftar sehingga ia tahu apa yang harus diperbaiki (contoh: “Foto tidak jelas, unggah ulang pas foto terbaru” atau “Link SPJ tidak dapat diakses, periksa izin berbagi Google Drive”).</p><p>Pendaftar yang ditolak dapat memperbaiki data dan dikonfirmasi ulang; ubah status kembali menjadi approved setelah perbaikan sesuai. Riwayat status tersimpan pada baris data yang sama, sehingga cukup satu baris per pendaftar.</p><div class='g-tip'><i class='fas fa-clock'></i><span>Lakukan verifikasi secara berkala setiap hari kerja. Pendaftar melihat statusnya real-time dari database — semakin cepat diverifikasi, semakin baik pelayanan.</span></div>"
    },
    {
      "t": "Mengelola Pengumuman & Sertifikat",
      "i": "fa-bullhorn",
      "c": "<p><b>Pengumuman</b> — kartu informasi yang tampil pada menu publik Pengumuman dan menjadi sumber Judul Kegiatan pada form pendaftaran. Isi judul yang deskriptif, isi pengumuman yang lengkap (syarat, jadwal, kuota), tanggal, dan status <b>aktif</b> agar tampil di depan. Nonaktifkan (ubah status) pengumuman yang sudah berlalu — jangan dihapus bila masih berguna sebagai arsip.</p><p><b>Sertifikat</b> — catat setiap sertifikat yang diterbitkan: nomor sertifikat (unik), nama penerima sesuai identitas, judul pelatihan, tanggal terbit, dan link unduhan sertifikat. Data ini menjadi dasar verifikasi publik pada menu Cek Sertifikat — pastikan penulisan nama persis sama dengan yang tertera pada PDF sertifikat.</p><p>Kombinasi keduanya membentuk alur layanan: pengumuman membuka pendaftaran → pendaftaran diverifikasi → pelatihan berjalan → sertifikat diterbitkan dan tercatat → peserta memverifikasi secara mandiri.</p>"
    },
    {
      "t": "Manajemen Pengguna (Multiusers)",
      "i": "fa-users-cog",
      "c": "<p>Modul <b>Multiusers</b> (kategori Sistem) digunakan untuk membuat dan mengelola akun admin. Setiap akun memiliki username, nama tampilan, <b>level</b> (superadmin/admin/operator/user), dan <b>status</b> (aktif/nonaktif). Akun nonaktif tidak dapat login meski kredensial benar.</p><p>Praktik yang dianjurkan: satu akun per orang (tanpa akun bersama), level sesuai tugas, dan status segera dinonaktifkan ketika petugas berhenti atau berpindah tugas. Pembuatan akun baru sebaiknya hanya oleh superadmin, lalu ganti password pada login pertama.</p><p>Modul ini juga menjadi dasar kontrol akses: menu pada sidebar dan tab pada Panel Admin menyesuaikan level akun. Bila seorang operator membutuhkan akses tambahan, tingkatkan levelnya — tidak perlu berbagi akun dengan rekan.</p><div class='g-tip'><i class='fas fa-key'></i><span>Gunakan password kuat (minimal 8 karakter, gabungan huruf besar/kecil, angka, simbol). Sistem mencatat percobaan login gagal dan mengunci akun 15 menit setelah 3 kegagalan.</span></div>"
    },
    {
      "t": "Import Data Massal dari Excel",
      "i": "fa-file-excel",
      "c": "<p>Untuk memasukkan data dalam jumlah besar (mis. hasil rekap SDMK dari Excel), gunakan menu <b>Import Massal</b>. Siapkan berkas Excel dengan header persis sesuai format wajib: <i>nik, nama_lengkap_dengan_gelar, jenis_kelamin, tempat_dan_tanggal_lahir, nip, unit_kerja, jenis_sdmk, jenis_profesi, pekerjaan, nomor_whatsapp, email_plataran_sehat, alamat_rumah</i>.</p><p>Alur import: unggah berkas → sistem membaca dan menampilkan <b>pratinjau validasi</b> → periksa baris error (data wajib kosong/format salah) dan baris <b>duplikat</b> (NIK sudah ada di database) → perbaiki bila perlu pada berkas lalu unggah ulang, atau lanjutkan hanya baris valid → klik eksekusi dan pantau progres.</p><p>Hasil import ditampilkan setelah selesai (jumlah berhasil/gagal). Selalu lakukan pengecekan akhir pada tabel terkait melalui Panel Admin — bila terjadi salah import dalam jumlah besar, hubungi superadmin untuk pembersihan terkendali.</p><div class='g-tip'><i class='fas fa-triangle-exclamation'></i><span>Jangan mengubah nama header pada berkas Excel. Import membaca header, bukan posisi kolom — header yang salah membuat seluruh baris ditandai error.</span></div>"
    },
    {
      "t": "Praktik Keamanan Terbaik",
      "i": "fa-shield-alt",
      "c": "<p>Keamanan sistem adalah tanggung jawab bersama. Perilaku wajib bagi seluruh admin: <b>(1)</b> logout melalui tombol Logout setiap selesai bekerja, terutama di komputer bersama; <b>(2)</b> jangan pernah menuliskan/membagikan password di media apa pun; <b>(3)</b> jangan meninggalkan sesi terbuka tanpa pengawasan — sistem mengunci otomatis setelah 15 menit idle, tetapi kebiasaan aman tetap utama; <b>(4)</b> gunakan level akun seminimal mungkin sesuai tugas (prinsip hak akses terkecil).</p><p>Kesadaran terhadap data pribadi: NIK, alamat, dan kontak pendaftar adalah data sensitif. Jangan mengundang orang yang tidak berkepentingan melihat layar Panel Admin, dan jangan menyalin data pribadi ke perangkat pribadi tanpa keperluan resmi. Query publik pada aplikasi sudah dirancang menyembunyikan kolom PII — pertahankan konfigurasi izin Hasura tersebut.</p><p>Bila terjadi indikasi kebocoran akun (login tak dikenal, password berubah sendiri, akun terkunci tanpa sebab), segera laporkan ke superadmin: akun dinonaktifkan, sesi diperiksa pada <i>security.session_tracking</i>, dan password diganti. Untuk perubahan konfigurasi keamanan tingkat lanjut, rujuk dokumen README keamanan pada repositori sistem.</p>"
    }
  ]$konten$,
  'setup v7.6.4'
FROM (SELECT 1) AS _seed
WHERE NOT EXISTS (SELECT 1 FROM public.petunjuk_admin);
