/* ============================================================
   PAMUNGKAS — KONFIGURASI UTAMA (State, Page Config, Nhost Config, Admin Tables)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/01-config.js
   ============================================================ */

// === PAMUNGKAS NHOST v7.0 - CLEAN & SECURE ===

/* ========== STATE ========== */
var adminLevel = '';  // superadmin, admin, operator (dari multiusers.role)
var adminUsername = '';
var currentUser = null;  // { id, username, nama_lengkap, role }
var currentRole = '';    // normalized: superadmin, admin, operator
var currentPage = 'dashboard';
var _dataCache = {}; // cache data per sheet
var _allPengumuman = [], _allSDMK = [], _allPendaftaran = [], _allSertifikat = [], _allMateri = [], _allAdmin = [];

/* ========== IMPORT STATE ========== */
var _importState = {
  file: null,
  fileName: '',
  rawData: [],
  validatedData: [],
  errors: [],
  duplicates: [],
  validCount: 0,
  errorCount: 0,
  duplicateCount: 0,
  isImporting: false,
  importProgress: 0,
  importSuccess: 0,
  importFailed: 0,
  expectedHeaders: ['nik', 'nama_lengkap_dengan_gelar', 'jenis_kelamin', 'tempat_dan_tanggal_lahir', 'nip', 'unit_kerja', 'jenis_sdmk', 'jenis_profesi', 'pekerjaan', 'nomor_whatsapp', 'email_plataran_sehat', 'alamat_rumah']
};

/* ---------- PAGE CONFIG ---------- */
/* ========== PAGE CONFIG - ULTIMATE FORCE ========== */
// Using IIFE to ensure immediate execution and scope isolation
(function() {
  // Define the config object
  const _cfg = {
    'dashboard':{title:'Dashboard',subtitle:'Ringkasan data dan statistik'},
    'pengumuman':{title:'Pengumuman',subtitle:'Informasi dan pengumuman resmi'},
    'profil-sdmk':{title:'Profil SDMK Terlatih',subtitle:'Database tenaga kesehatan terlatih'},
    'pendaftaran':{title:'Pendaftaran',subtitle:'Pendaftaran pelatihan'},
    'cek-sertifikat':{title:'Cek Sertifikat',subtitle:'Verifikasi sertifikat pelatihan'},
    'cek-materi':{title:'Cek Materi',subtitle:'Materi pelatihan'},
    'cek-pendaftaran':{title:'Cek Pendaftaran',subtitle:'Cari data pendaftaran berdasarkan NIK atau NIP'},
    'panel-admin':{title:'Panel Admin',subtitle:'Pengelolaan sistem'}
  };
  
  // Assign using ALL possible methods for maximum compatibility
  var pageConfig = _cfg;
  window.pageConfig = _cfg;
  this.pageConfig = _cfg;  // In global scope, this === window
  
  console.log("[ULTIMATE] pageConfig defined with", Object.keys(_cfg).length, "pages via IIFE");
})();

/* ---------- KONFIGURASI NHOST / HASURA ---------- */
/* ========== KONFIGURASI NHOST / HASURA GRAPHQL ==========
 * GANTI nilai di bawah ini sesuai dengan project Nhost Anda
 * Dapatkan dari: Nhost Dashboard > Hasura > Settings > API Endpoint
 * ============================================================ */
var NHOST_CONFIG = {
  // Hasura GraphQL Endpoint (WAJIB DIUBAH)
  graphqlUrl: 'https://tphsxlntogpbpauvhuum.hasura.ap-southeast-1.nhost.run/v1/graphql',
  
  // Admin Secret dari Nhost Dashboard > Hasura > Settings > Admin Secret
  // Untuk production, gunakan Nhost Auth token, bukan admin secret
  adminSecret: '6zFaZ5::7R5^Rwg!zPM%s,7XHicFuwvB',
  
  // Nhost Auth endpoint (untuk authentication)
  authUrl: 'https://tphsxlntogpbpauvhuum.hasura.ap-southeast-1.nhost.run/v1/auth',
  
  // Storage URL (untuk upload file) — layanan storage Nhost (domain storage.*, bukan hasura.*)
  storageUrl: 'https://tphsxlntogpbpauvhuum.storage.ap-southeast-1.nhost.run'
};

/* ---------- ADMIN TABLES (Peta modul Panel Admin) ---------- */
/* ========== ADMIN: DASHBOARD MENU ========== */

/**
 * ADMIN_TABLES Configuration - Complete mapping of all Nhost tables
 * This is the single source of truth for Panel Admin menu structure
 */
const ADMIN_TABLES = {
  // DATA UTAMA (Main Data)
  indikator: {
    id: 'indikator',
    label: 'Indikator',
    table: 'indikator',
    icon: 'fa-chart-line',
    description: 'Kelola indikator kinerja program SDM Kesehatan',
    category: 'data-utama',
    fields: ['id', 'indikator', 'nilai', 'target', 'satuan', 'periode'],
    displayFields: ['id', 'indikator', 'nilai', 'target', 'satuan', 'periode'],
    canWrite: true,
    queryAction: 'getIndikator',
    createAction: 'tambahIndikator',
    updateAction: 'updateIndikator',
    deleteAction: 'deleteIndikator'
  },
  
  sdmk: {
    id: 'sdmk',
    label: 'SDMK',
    table: 'sdmk',
    icon: 'fa-user-md',
    description: 'Data tenaga kesehatan terlatih',
    category: 'data-utama',
    fields: ['id', 'foto', 'nama', 'nik', 'profesi', 'unit_kerja', 'nomor_sertifikat', 'judul_kegiatan', 'tanggal_pelaksanaan', 'tahun', 'tempat_pelaksanaan'],
    displayFields: ['nama', 'nik', 'profesi', 'unit_kerja', 'nomor_sertifikat', 'judul_kegiatan', 'tahun'],
    canWrite: true,
    queryAction: 'getSDMK',
    createAction: 'tambahSDMK',
    updateAction: 'updateSDMK',
    deleteAction: 'deleteSDMK'
  },
  
  pendaftaran: {
    id: 'pendaftaran',
    label: 'Pendaftaran',
    table: 'pendaftaran',
    icon: 'fa-clipboard-list',
    description: 'Data pendaftaran pelatihan',
    category: 'data-utama',
    fields: ['id', 'foto', 'nama_lengkap_dengan_gelar', 'nik', 'nip', 'unit_kerja', 'jenis_sdmk', 'jenis_profesi', 'pekerjaan', 'jenis_kelamin', 'tempat_dan_tanggal_lahir', 'email_plataran_sehat', 'alamat_rumah', 'lama_bekerja_di_unit_sekarang', 'surat_pernyataan', 'link_spj', 'judul_kegiatan', 'status', 'catatan_admin'],
    displayFields: ['nama_lengkap_dengan_gelar', 'nik', 'unit_kerja', 'jenis_sdmk', 'jenis_profesi', 'status', 'catatan_admin'],
    canWrite: true,
    queryAction: 'getPendaftaran',
    createAction: 'tambahPendaftaran',
    updateAction: 'updatePendaftaran',
    deleteAction: 'deletePendaftaran'
  },
  
  materi: {
    id: 'materi',
    label: 'Materi',
    table: 'materi',
    icon: 'fa-book-open',
    description: 'Materi dan bahan pelatihan',
    category: 'data-utama',
    fields: ['id', 'judul_materi', 'kategori', 'link_download', 'deskripsi', 'created_at', 'updated_at'],
    displayFields: ['id', 'judul_materi', 'kategori', 'link_download', 'deskripsi', 'created_at', 'updated_at'],
    canWrite: true,
    queryAction: 'getMateri',
    createAction: 'tambahMateri',
    updateAction: 'updateMateri',
    deleteAction: 'deleteMateri'
  },
  
  // INFORMASI (Information)
  pengumuman: {
    id: 'pengumuman',
    label: 'Pengumuman',
    table: 'pengumuman',
    icon: 'fa-bullhorn',
    description: 'Informasi dan pengumuman resmi',
    category: 'informasi',
    fields: ['id', 'judul', 'isi_pengumuman', 'tanggal', 'status', 'created_at', 'created_by'],
    displayFields: ['id', 'judul', 'isi_pengumuman', 'tanggal', 'status', 'created_at', 'created_by'],
    canWrite: true,
    queryAction: 'getPengumuman',
    createAction: 'tambahPengumuman',
    updateAction: 'updatePengumuman',
    deleteAction: 'deletePengumuman'
  },
  
  sertifikat: {
    id: 'sertifikat',
    label: 'Sertifikat',
    table: 'sertifikat',
    icon: 'fa-certificate',
    description: 'Data sertifikat pelatihan',
    category: 'informasi',
    fields: ['id', 'nomor_sertifikat', 'nama_penerima', 'judul_pelatihan', 'tanggal_terbit', 'link_sertifikat', 'created_at'],
    displayFields: ['id', 'nomor_sertifikat', 'nama_penerima', 'judul_pelatihan', 'tanggal_terbit', 'link_sertifikat', 'created_at'],
    canWrite: true,
    queryAction: 'getSertifikat',
    createAction: 'tambahSertifikat',
    updateAction: 'updateSertifikat',
    deleteAction: 'deleteSertifikat'
  },
  
  // SISTEM (System)
  multiusers: {
    id: 'multiusers',
    label: 'Multiusers',
    table: 'multiusers',
    icon: 'fa-users-cog',
    description: 'Manajemen pengguna dan akun admin',
    category: 'sistem',
    fields: ['id', 'username', 'display_name', 'level', 'status', 'last_login', 'created_at'],
    displayFields: ['id', 'username', 'display_name', 'level', 'status', 'last_login', 'created_at'],
    canWrite: true, // Only admin (full access) should write
    queryAction: 'getAdmin', // Uses getAdmin which maps to getMultiusers
    createAction: 'tambahMultiuser',
    updateAction: 'updateMultiuser',
    deleteAction: 'deleteMultiuser',
    requireAdmin: true
  }
};
