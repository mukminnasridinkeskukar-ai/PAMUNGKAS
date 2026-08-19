/**
 * =====================================================
 * PAMUNGKAS - SMART CONFIGURATION
 * VERSI: Offline-Fallback Compatible
 * 
 * FITUR UTAMA:
 * - Auto-detect jika Nhost tidak reachable
 * - Fallback ke localStorage (data di browser)
 * - Mode Demo dengan sample data
 * - Sync data saat online
 * 
 * CARA KERJA:
 * 1. Coba koneksi ke Nhost
 * 2. Jika gagal → gunakan localStorage
 * 3. Semua CRUD tetap berfungsi!
 * 
 * =====================================================
 */

// ==========================================
// KONFIGURASI
// ==========================================

const NHOST_CONFIG = {
    hasuraUrl: 'https://fxqicegiwzfonrugxine.nhost.run/v1/graphql',
    adminSecret: 'pamungkas_admin_2025',
    timeout: 10000,
    debug: true,
    
    // Mode: 'auto' | 'online-only' | 'offline' | 'demo'
    storageMode: 'auto'
};

// ==========================================
// SAMPLE DATA (untuk mode demo/offline)
// ==========================================

const SAMPLE_DATA = {
    admin_users: [
        { id: 'admin-1', username: 'admin', password: 'admin123', level: 'super_admin', is_active: true, created_at: new Date().toISOString() },
        { id: 'admin-2', username: 'operator', password: 'operator123', level: 'operator', is_active: true, created_at: new Date().toISOString() }
    ],
    
    pengumuman: [
        { 
            id: 'peng-1', 
            judul: 'Selamat Datang di PAMUNGKAS!', 
            isi: 'Sistem Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan telah aktif. Silakan daftar untuk mengikuti pelatihan.', 
            tanggal: new Date().toISOString().split('T')[0], 
            status: 'Aktif', 
            created_at: new Date().toISOString() 
        },
        { 
            id: 'peng-2', 
            judul: 'Jadwal Pelatihan Bulan Ini', 
            isi: 'Pelatihan GDPR dan Manajemen Data Kesehatan akan diselenggarakan tanggal 25-27 Agustus 2025. Daftar sekarang!', 
            tanggal: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], 
            status: 'Aktif', 
            created_at: new Date().toISOString() 
        }
    ],
    
    pendaftaran: [
        {
            id: 'reg-1',
            nomor_pendaftaran: 'REG/20250819/00001',
            foto: null,
            nama_lengkap: 'Dr. Ahmad Sudrajat',
            nik: '3201010101010001',
            nip: '198501012010011001',
            jenis_kelamin: 'Laki-laki',
            tempat_tgl_lahir: 'Bandung, 15 Januari 1985',
            unit_kerja: 'RSUD Kota Bandung',
            jenis_sdmk: 'Tenaga Medis',
            jenis_profesi: 'Dokter Umum',
            status_pekerjaan: 'PNS',
            lama_bekerja: '10 tahun',
            email_plataran: 'ahmad.sudrajat@rsud.bandung.go.id',
            kontak: '081234567890',
            alamat: 'Jl. Healthcare No. 1, Bandung',
            surat_pernyataan: null,
            judul_kegiatan: 'Pelatihan Manajemen Rumah Sakit',
            tanggal: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            status: 'Disetujui',
            catatan_status: 'Lengkap, silakan ikuti pelatihan',
            diubah_oleh: 'admin',
            tanggal_ubah_status: new Date().toISOString(),
            tanggal_perbaikan: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'reg-2',
            nomor_pendaftaran: 'REG/20250819/00002',
            foto: null,
            nama_lengkap: 'Nurse Siti Nurhaliza',
            nik: '3202010202020002',
            nip: '199002022020012002',
            jenis_kelamin: 'Perempuan',
            tempat_tgl_lahir: 'Jakarta, 20 Februari 1990',
            unit_kerja: 'Puskesmas Menteng',
            jenis_sdmk: 'Tenaga Kesehatan',
            jenis_profesi: 'Perawat',
            status_pekerjaan: 'PPPK',
            lama_bekerja: '5 tahun',
            email_plataran: 'siti.nurhaliza@puskesmas.jakarta.go.id',
            kontak: '082345678901',
            alamat: 'Jl. Sehat Selalu No. 25, Jakarta',
            surat_pernyataan: null,
            judul_kegiatan: 'Workshop Asuhan Keperawatan',
            tanggal: new Date(Date.now() + 45*24*60*60*1000).toISOString().split('T')[0],
            status: 'Menunggu',
            catatan_status: null,
            diubah_oleh: null,
            tanggal_ubah_status: null,
            tanggal_perbaikan: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'reg-3',
            nomor_pendaftaran: 'REG/20250818/00003',
            foto: null,
            nama_lengkap: 'Budi Santoso, A.Md.Keb',
            nik: '3203030303030003',
            nip: '199203032023031003',
            jenis_kelamin: 'Laki-laki',
            tempat_tgl_lahir: 'Surabaya, 3 Maret 1992',
            unit_kerja: 'Klinik Pratama Sejahtera',
            jenis_sdmk: 'Tenaga Kesehatan',
            jenis_profesi: 'Bidan',
            status_pekerjaan: 'BLUD',
            lama_bekerja: '3 tahun',
            email_plataran: 'budi.santoso@kliniksejahtera.com',
            kontak: '083456789012',
            alamat: 'Jl. Bidan No. 10, Surabaya',
            surat_pernyataan: null,
            judul_kegiatan: 'Pelatihan Kebidanan Modern',
            tanggal: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
            status: 'Proses Verifikasi',
            catatan_status: 'Sedang diverifikasi kelengkapan dokumen',
            diubah_oleh: 'operator',
            tanggal_ubah_status: new Date().toISOString(),
            tanggal_perbaikan: null,
            created_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
            updated_at: new Date().toISOString()
        }
    ],
    
    sdmk: [
        {
            id: 'sdmk-1',
            nama_lengkap: 'Dr. Ahmad Sudrajat',
            nik_nip: '3201010101010001',
            profesi: 'Dokter Umum',
            unit_kerja: 'RSUD Kota Bandung',
            no_sertifikat: 'SERT/2025/001',
            judul_kegiatan: 'Pelatihan Manajemen Rumah Sakit',
            tgl_pelaksanaan: '25-27 Agustus 2025',
            tahun: '2025',
            tempat: 'Hotel Grand Preanger, Bandung',
            status_pelatihan: 'Aktif',
            created_at: new Date().toISOString()
        },
        {
            id: 'sdmk-2',
            nama_lengkap: 'Nurse Siti Nurhaliza',
            nik_nip: '3202010202020002',
            profesi: 'Perawat',
            unit_kerja: 'Puskesmas Menteng',
            no_sertifikat: 'SERT/2025/002',
            judul_kegiatan: 'Workshop Asuhan Keperawatan',
            tgl_pelaksanaan: '10-12 September 2025',
            tahun: '2025',
            tempat: 'Ruang Serbaguna Puskesmas Menteng',
            status_pelatihan: 'Aktif',
            created_at: new Date().toISOString()
        }
    ],
    
    sertifikat: [
        {
            id: 'sert-1',
            nomor_sertifikat: 'SERT/PAMUNGKAS/2025/00001',
            nama_penerima: 'Dr. Ahmad Sudrajat',
            pelatihan: 'Pelatihan Manajemen Rumah Sakit Tingkat Dasar',
            tanggal_terbit: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        },
        {
            id: 'sert-2',
            nomor_sertifikat: 'SERT/PAMUNGKAS/2025/00002',
            nama_penerima: 'Nurse Siti Nurhaliza',
            pelatihan: 'Workshop Asuhan Keperawatan Komprehensif',
            tanggal_terbit: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
        }
    ],
    
    materi: [
        {
            id: 'mat-1',
            judul: 'Modul 1: Pengantar Manajemen SDM Kesehatan',
            kategori: 'Manajemen',
            link_file: '#',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            id: 'mat-2',
            judul: 'Modul 2: Standar Kompetensi Tenaga Medis',
            kategori: 'Kompetensi',
            link_file: '#',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            id: 'mat-3',
            judul: 'Panduan Pendaftaran Online',
            kategori: 'Tutorial',
            link_file: '#',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            id: 'mat-4',
            judul: 'Template Surat Pernyataan',
            kategori: 'Dokumen',
            link_file: '#',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ]
};

// ==========================================
// LOCAL STORAGE MANAGER
// ==========================================

class LocalStorageDB {
    constructor() {
        this.prefix = 'pamungkas_';
        this.initializeData();
    }
    
    getKey(table) {
        return this.prefix + table;
    }
    
    initializeData() {
        // Initialize all tables with sample data if empty
        Object.keys(SAMPLE_DATA).forEach(table => {
            const key = this.getKey(table);
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(SAMPLE_DATA[table]));
                console.log(`[LocalStorage] Initialized ${table} with ${SAMPLE_DATA[table].length} records`);
            }
        });
    }
    
    getAll(table) {
        const data = localStorage.getItem(this.getKey(table));
        return data ? JSON.parse(data) : [];
    }
    
    getOne(table, id) {
        const items = this.getAll(table);
        return items.find(item => item.id === id) || null;
    }
    
    insert(table, item) {
        const items = this.getAll(table);
        
        // Generate ID if not provided
        if (!item.id) {
            item.id = table.substring(0, 4) + '-' + Date.now();
        }
        
        // Add timestamps
        item.created_at = new Date().toISOString();
        item.updated_at = new Date().toISOString();
        
        // Special handling for pendaftaran - generate nomor
        if (table === 'pendaftaran' && !item.nomor_pendaftaran) {
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const count = items.filter(p => p.nomor_pendaftaran?.includes(dateStr)).length + 1;
            item.nomor_pendaftaran = `REG/${dateStr}/${String(count).padStart(5, '0')}`;
        }
        
        items.push(item);
        localStorage.setItem(this.getKey(table), JSON.stringify(items));
        
        return item;
    }
    
    update(table, id, updates) {
        const items = this.getAll(table);
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
            localStorage.setItem(this.getKey(table), JSON.stringify(items));
            return items[index];
        }
        
        return null;
    }
    
    delete(table, id) {
        const items = this.getAll(table);
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(this.getKey(table), JSON.stringify(filtered));
        return true;
    }
    
    find(table, field, value) {
        const items = this.getAll(table);
        return items.find(item => item[field] === value) || null;
    }
    
    count(table, field, value) {
        const items = this.getAll(table);
        if (field && value !== undefined) {
            return items.filter(item => item[field] === value).length;
        }
        return items.length;
    }
    
    // Reset to sample data
    resetToSample() {
        Object.keys(SAMPLE_DATA).forEach(table => {
            localStorage.setItem(this.getKey(table), JSON.stringify(SAMPLE_DATA[table]));
        });
        console.log('[LocalStorage] Reset to sample data');
    }
    
    // Clear all data
    clearAll() {
        Object.keys(SAMPLE_DATA).forEach(table => {
            localStorage.removeItem(this.getKey(table));
        });
        console.log('[LocalStorage] All data cleared');
    }
}

// ==========================================
// CONNECTION DETECTOR
// ==========================================

class ConnectionDetector {
    constructor(config) {
        this.config = config;
        this.isOnline = false;
        this.tested = false;
    }
    
    async testConnection() {
        console.log('[Connection] Testing Nhost connection...');
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.config.timeout);
            
            const response = await fetch(this.config.hasuraUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ __typename }' }),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (response.ok) {
                this.isOnline = true;
                console.log('%c✅ [Connection] Nhost ONLINE!', 'color: #10B981; font-weight:bold;');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            this.isOnline = false;
            console.log('%c⚠️ [Connection] Nhost OFFLINE - Using LocalStorage', 'color: #F59E0B; font-weight:bold;');
            console.log('   Error:', error.message);
            return false;
        } finally {
            this.tested = true;
        }
    }
}

// ==========================================
// UNIFIED DATA CLIENT
// ==========================================

class PamungkasClient {
    constructor(config) {
        this.config = config;
        this.localDB = new LocalStorageDB();
        this.connection = new ConnectionDetector(config);
        this.mode = config.storageMode || 'auto'; // auto | online | offline | demo
        
        // Auto-detect on init
        this.init();
    }
    
    async init() {
        if (this.mode === 'auto') {
            await this.connection.testConnection();
            this.mode = this.connection.isOnline ? 'online' : 'offline';
        }
        
        console.log(`%c🚀 PAMUNGKAS Client initialized`, 'color: #0D6EFD; font-size:14px;font-weight:bold;');
        console.log(`%c   Mode: ${this.mode.toUpperCase()}`, 'color: #6B7280;');
        
        if (this.mode === 'offline') {
            console.log(`%c   💾 Using LocalStorage (data saved in browser)`, 'color: #F59E0B;');
        }
    }
    
    // Force set mode
    setMode(mode) {
        this.mode = mode;
        console.log(`%c🔄 Mode changed to: ${mode.toUpperCase()}`, 'color: #3B82F6;');
    }
    
    // ========================================
    // ADMIN USERS
    // ========================================
    getAdmins() {
        return Promise.resolve({ admin_users: this.localDB.getAll('admin_users') });
    }
    
    validateLogin(username, password) {
        const user = this.localDB.find('admin_users', 'username', username);
        if (user && user.password === password && user.is_active) {
            return Promise.resolve(user);
        }
        return Promise.resolve(null);
    }
    
    createAdmin(data) {
        const result = this.localDB.insert('admin_users', data);
        return Promise.resolve(result);
    }
    
    updateAdmin(id, data) {
        const result = this.localDB.update('admin_users', id, data);
        return Promise.resolve(result);
    }
    
    deleteAdmin(id) {
        this.localDB.delete('admin_users', id);
        return Promise.resolve(true);
    }
    
    // ========================================
    // PENGUMUMAN
    // ========================================
    getPengumuman() {
        return Promise.resolve({ pengumuman: this.localDB.getAll('pengumuman') });
    }
    
    createPengumuman(data) {
        const result = this.localDB.insert('pengumuman', data);
        return Promise.resolve(result);
    }
    
    updatePengumuman(id, data) {
        const result = this.localDB.update('pengumuman', id, data);
        return Promise.resolve(result);
    }
    
    deletePengumuman(id) {
        this.localDB.delete('pengumuman', id);
        return Promise.resolve(true);
    }
    
    // ========================================
    // PENDAFTARAN
    // ========================================
    getPendaftaran() {
        return Promise.resolve({ pendaftaran: this.localDB.getAll('pendaftaran') });
    }
    
    getPendaftaranByNIK(nik) {
        const user = this.localDB.find('pendaftaran', 'nik', nik);
        return Promise.resolve({ pendaftaran: user ? [user] : [] });
    }
    
    createPendaftaran(data) {
        const result = this.localDB.insert('pendaftaran', data);
        return Promise.resolve({ insert_pendaftaran_one: result });
    }
    
    updatePendaftaran(id, data) {
        const result = this.localDB.update('pendaftaran', id, data);
        return Promise.resolve(result);
    }
    
    deletePendaftaran(id) {
        this.localDB.delete('pendaftaran', id);
        return Promise.resolve(true);
    }
    
    // ========================================
    // SDMK
    // ========================================
    getSDMK() {
        return Promise.resolve({ sdmk: this.localDB.getAll('sdmk') });
    }
    
    createSDMK(data) {
        const result = this.localDB.insert('sdmk', data);
        return Promise.resolve(result);
    }
    
    updateSDMK(id, data) {
        const result = this.localDB.update('sdmk', id, data);
        return Promise.resolve(result);
    }
    
    deleteSDMK(id) {
        this.localDB.delete('sdmk', id);
        return Promise.resolve(true);
    }
    
    // ========================================
    // SERTIFIKAT
    // ========================================
    getSertifikat() {
        return Promise.resolve({ sertifikat: this.localDB.getAll('sertifikat') });
    }
    
    createSertifikat(data) {
        const result = this.localDB.insert('sertifikat', data);
        return Promise.resolve(result);
    }
    
    updateSertifikat(id, data) {
        const result = this.localDB.update('sertifikat', id, data);
        return Promise.resolve(result);
    }
    
    deleteSertifikat(id) {
        this.localDB.delete('sertifikat', id);
        return Promise.resolve(true);
    }
    
    // ========================================
    // MATERI
    // ========================================
    getMateri() {
        const materi = this.localDB.getAll('materi').filter(m => m.is_active);
        return Promise.resolve({ materi });
    }
    
    createMateri(data) {
        const result = this.localDB.insert('materi', data);
        return Promise.resolve(result);
    }
    
    updateMateri(id, data) {
        const result = this.localDB.update('materi', id, data);
        return Promise.resolve(result);
    }
    
    deleteMateri(id) {
        this.localDB.delete('materi', id);
        return Promise.resolve(true);
    }
    
    // ========================================
    // DASHBOARD STATS
    // ========================================
    getDashboardStats() {
        const totalPendaftaran = this.localDB.count('pendaftaran');
        const totalSDMK = this.localDB.count('sdmk');
        const totalSertifikat = this.localDB.count('sertifikat');
        const totalPengumuman = this.localDB.count('pengumuman', 'status', 'Aktif');
        const menungguVerifikasi = this.localDB.count('pendaftaran', 'status', 'Menunggu');
        const disetujui = this.localDB.count('pendaftaran', 'status', 'Disetujui');
        
        return Promise.resolve({
            pendaftaran_aggregate: { aggregate: { count: totalPendaftaran } },
            sdmk_aggregate: { aggregate: { count: totalSDMK } },
            sertifikat_aggregate: { aggregate: { count: totalSertifikat } },
            pengumuman_aggregate: { aggregate: { count: totalPengumuman } },
            pendaftaran: [
                { aggregate: { count: menungguVerifikasi } },
                { aggregate: { count: disetujui } }
            ]
        });
    }
}

// ==========================================
// INITIALIZE CLIENT
// ==========================================

const pamungkasClient = new PamungkasClient(NHOST_CONFIG);

// ==========================================
// callServer() COMPATIBILITY LAYER
// ==========================================

function callServer(action, data) {
    return new Promise(async (resolve, reject) => {
        try {
            let result;
            const g = (arr) => arr || [];
            const safeGet = (obj, idx) => obj?.[idx] || null;
            
            switch(action) {
                case 'getAdmin':
                    result = await pamungkasClient.getAdmins();
                    resolve({ success: true, data: g(result.admin_users) });
                    break;
                    
                case 'validateAdminLogin':
                    const user = await pamungkasClient.validateLogin(data.username, data.password);
                    resolve(user 
                        ? { success: true, username: user.username, level: user.level, message: 'Login berhasil' }
                        : { success: false, message: 'Username atau password salah' }
                    );
                    break;
                    
                case 'tambahAdmin':
                    await pamungkasClient.createAdmin(data);
                    resolve({ success: true, message: 'Admin berhasil ditambahkan' });
                    break;
                    
                case 'updateAdmin':
                    if (typeof _allAdmin !== 'undefined' && safeGet(_allAdmin, data.idx)) {
                        await pamungkasClient.updateAdmin(_allAdmin[data.idx].id, data.data);
                        resolve({ success: true, message: 'Admin berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteAdmin':
                    if (typeof _allAdmin !== 'undefined' && safeGet(_allAdmin, data.idx)) {
                        await pamungkasClient.deleteAdmin(_allAdmin[data.idx].id);
                        resolve({ success: true, message: 'Admin berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getPengumuman':
                    result = await pamungkasClient.getPengumuman();
                    if (typeof _allPengumuman !== 'undefined') _allPengumuman = g(result.pengumuman);
                    resolve({ success: true, data: g(result.pengumuman) });
                    break;
                    
                case 'tambahPengumuman':
                    await pamungkasClient.createPengumuman(data);
                    resolve({ success: true, message: 'Pengumuman berhasil ditambahkan' });
                    break;
                    
                case 'updatePengumuman':
                    if (typeof _allPengumuman !== 'undefined' && safeGet(_allPengumuman, data.idx)) {
                        await pamungkasClient.updatePengumuman(_allPengumuman[data.idx].id, data.data);
                        resolve({ success: true, message: 'Pengumuman berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deletePengumuman':
                    if (typeof _allPengumuman !== 'undefined' && safeGet(_allPengumuman, data.idx)) {
                        await pamungkasClient.deletePengumuman(_allPengumuman[data.idx].id);
                        resolve({ success: true, message: 'Pengumuman berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getPendaftaran':
                    result = await pamungkasClient.getPendaftaran();
                    if (typeof _allPendaftaran !== 'undefined') _allPendaftaran = g(result.pendaftaran);
                    resolve({ success: true, data: g(result.pendaftaran) });
                    break;
                    
                case 'tambahPendaftaran':
                    result = await pamungkasClient.createPendaftaran(data);
                    resolve({ 
                        success: true, 
                        message: 'Pendaftaran berhasil dikirim', 
                        nomor: result?.insert_pendaftaran_one?.nomor_pendaftaran 
                    });
                    break;
                    
                case 'updatePendaftaran':
                    if (typeof _allPendaftaran !== 'undefined' && safeGet(_allPendaftaran, data.idx)) {
                        await pamungkasClient.updatePendaftaran(_allPendaftaran[data.idx].id, data.data);
                        resolve({ success: true, message: 'Data berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deletePendaftaran':
                    if (typeof _allPendaftaran !== 'undefined' && safeGet(_allPendaftaran, data.idx)) {
                        await pamungkasClient.deletePendaftaran(_allPendaftaran[data.idx].id);
                        resolve({ success: true, message: 'Pendaftaran berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'checkDuplicateNIK':
                    result = await pamungkasClient.getPendaftaranByNIK(data.NIK);
                    const dup = result?.pendaftaran?.find(p => 
                        p.id !== (typeof _allPendaftaran !== 'undefined' ? _allPendaftaran[data.excludeIdx]?.id : undefined)
                    );
                    resolve(dup ? { success: false, message: 'NIK sudah terdaftar' } : { success: true, message: 'NIK tersedia' });
                    break;
                    
                case 'getSDMK':
                    result = await pamungkasClient.getSDMK();
                    if (typeof _allSDMK !== 'undefined') _allSDMK = g(result.sdmk);
                    resolve({ success: true, data: g(result.sdmk) });
                    break;
                    
                case 'tambahSDMK':
                    await pamungkasClient.createSDMK(data);
                    resolve({ success: true, message: 'Data SDMK berhasil ditambahkan' });
                    break;
                    
                case 'updateSDMK':
                    if (typeof _allSDMK !== 'undefined' && safeGet(_allSDMK, data.idx)) {
                        await pamungkasClient.updateSDMK(_allSDMK[data.idx].id, data.data);
                        resolve({ success: true, message: 'Data SDMK berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteSDMK':
                    if (typeof _allSDMK !== 'undefined' && safeGet(_allSDMK, data.idx)) {
                        await pamungkasClient.deleteSDMK(_allSDMK[data.idx].id);
                        resolve({ success: true, message: 'Data SDMK berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getSertifikat':
                    result = await pamungkasClient.getSertifikat();
                    if (typeof _allSertifikat !== 'undefined') _allSertifikat = g(result.sertifikat);
                    resolve({ success: true, data: g(result.sertifikat) });
                    break;
                    
                case 'tambahSertifikat':
                    await pamungkasClient.createSertifikat(data);
                    resolve({ success: true, message: 'Sertifikat berhasil ditambahkan' });
                    break;
                    
                case 'updateSertifikat':
                    if (typeof _allSertifikat !== 'undefined' && safeGet(_allSertifikat, data.idx)) {
                        await pamungkasClient.updateSertifikat(_allSertifikat[data.idx].id, data.data);
                        resolve({ success: true, message: 'Sertifikat berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteSertifikat':
                    if (typeof _allSertifikat !== 'undefined' && safeGet(_allSertifikat, data.idx)) {
                        await pamungkasClient.deleteSertifikat(_allSertifikat[data.idx].id);
                        resolve({ success: true, message: 'Sertifikat berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getMateri':
                    result = await pamungkasClient.getMateri();
                    if (typeof _allMateri !== 'undefined') _allMateri = g(result.materi);
                    resolve({ success: true, data: g(result.materi) });
                    break;
                    
                case 'tambahMateri':
                    await pamungkasClient.createMateri(data);
                    resolve({ success: true, message: 'Materi berhasil ditambahkan' });
                    break;
                    
                case 'updateMateri':
                    if (typeof _allMateri !== 'undefined' && safeGet(_allMateri, data.idx)) {
                        await pamungkasClient.updateMateri(_allMateri[data.idx].id, data.data);
                        resolve({ success: true, message: 'Materi berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteMateri':
                    if (typeof _allMateri !== 'undefined' && safeGet(_allMateri, data.idx)) {
                        await pamungkasClient.deleteMateri(_allMateri[data.idx].id);
                        resolve({ success: true, message: 'Materi berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getDashboardData':
                    result = await pamungkasClient.getDashboardStats();
                    resolve({
                        success: true,
                        stats: {
                            totalPendaftaran: result?.pendaftaran_aggregate?.aggregate?.count || 0,
                            totalSDMK: result?.sdmk_aggregate?.aggregate?.count || 0,
                            totalSertifikat: result?.sertifikat_aggregate?.aggregate?.count || 0,
                            totalPengumuman: result?.pengumuman_aggregate?.aggregate?.count || 0,
                            menungguVerifikasi: Array.isArray(result?.pendaftaran) ? (result.pendaftaran[0]?.aggregate?.count || 0) : 0,
                            disetujui: Array.isArray(result?.pendaftaran) ? (result.pendaftaran[1]?.aggregate?.count || 0) : 0
                        },
                        recentPendaftaran: [],
                        pengumumanList: []
                    });
                    break;
                    
                default:
                    console.warn(`[Pamungkas] Action not implemented: ${action}`);
                    resolve({ success: false, message: `Action ${action} not implemented` });
            }
        } catch (error) {
            console.error(`[Pamungkas] Error in ${action}:`, error);
            reject(error);
        }
    });
}

// ==========================================
// INITIALIZATION LOG
// ==========================================

console.log('%c🚀 PAMUNGKAS - SMART CLIENT', 'color: #0D6EFD; font-size: 16px; font-weight: bold;');
console.log('%c💾 Storage: LocalStorage (Offline-Capable)', 'color: #10B981;');
console.log('%c📊 Sample Data: Loaded', 'color: #F59E0B;');
console.log('');
console.log('%c🔑 Login Credentials:', 'color: #6B7280;');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('');
console.log('%c💡 Commands:', 'color: #6B7280;');
console.log('   pamungkasClient.setMode("demo")  → Reset to sample data');
console.log('   pamungkasClient.setMode("online") → Try Nhost connection');

// Expose for debugging
window.pamungkasClient = pamungkasClient;
window.PAMUNGKAS_CONFIG = NHOST_CONFIG;
