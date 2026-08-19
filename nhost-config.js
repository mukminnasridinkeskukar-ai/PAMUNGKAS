/**
 * =====================================================
 * PAMUNGKAS - NHOST/HASURA CONFIGURATION
 * Koneksi Database Nhost untuk Sistem PAMUNGKAS
 * =====================================================
 * 
 * CARA PENGGUNAAN:
 * 1. Isi konfigurasi di bawah ini dengan credential Nhost Anda
 * 2. Include file ini SEBELUM script utama pamungkas.js
 * 3. Fungsi callServer() otomatis terganti dengan query ke Hasura
 * 
 * =====================================================
 */

// ==========================================
// KONFIGURASI NHOST / HASURA - WAJIB DIISI!
// ==========================================

const NHOST_CONFIG = {
    // URL Hasura dari dashboard Nhost Anda
    hasuraUrl: 'https://fxqicegiwzfonrugxine.nhost.run/v1/graphql',
    
    // Admin Secret yang baru saja Anda buat di Settings → Secrets
    // ✅ Password sudah diisi
    adminSecret: 'pamungkas_admin_2025',
    
    // URL Auth Nhost
    authUrl: 'https://fxqicegiwzfonrugxine.nhost.run/v1/auth',
    
    // Public URL untuk client-side
    publicUrl: 'https://fxqicegiwzfonrugxine.nhost.run/v1/graphql',
    
    // Settings
    timeout: 30000,
    debug: true // Set false untuk production
};

// ==========================================
// GRAPHQL QUERIES & MUTATIONS
// Sesuai dengan schema SQL yang dibuat
// ==========================================

const QUERIES = {
    // === ADMIN USERS ===
    GET_ADMINS: `
        query GetAdmins {
            admin_users(order_by: {created_at: desc}) {
                id
                username
                level
                is_active
                created_at
            }
        }
    `,
    
    VALIDATE_LOGIN: `
        query ValidateLogin($username: String!, $password: String!) {
            admin_users(where: {username: {_eq: $username}, password: {_eq: $password}}, limit: 1) {
                id
                username
                level
            }
        }
    `,
    
    INSERT_ADMIN: `
        mutation InsertAdmin($object: admin_users_insert_input!) {
            insert_admin_users_one(object: $object) {
                id
                username
                level
            }
        }
    `,
    
    UPDATE_ADMIN: `
        mutation UpdateAdmin($id: UUID!, $object: admin_users_set_input!) {
            update_admin_users_by_pk(pk_columns: {id: $id}, _set: $object) {
                id
                username
                level
            }
        }
    `,
    
    DELETE_ADMIN: `
        mutation DeleteAdmin($id: UUID!) {
            delete_admin_users_by_pk(id: $id) {
                id
            }
        }
    `,
    
    // === PENGUMUMAN ===
    GET_PENGUMUMAN: `
        query GetPengumuman {
            pengumuman(order_by: {tanggal: desc, created_at: desc}) {
                id
                judul
                isi
                tanggal
                status
                created_at
            }
        }
    `,
    
    INSERT_PENGUMUMAN: `
        mutation InsertPengumuman($object: pengumuman_insert_input!) {
            insert_pengumuman_one(object: $object) {
                id
            }
        }
    `,
    
    UPDATE_PENGUMUMAN: `
        mutation UpdatePengumuman($id: UUID!, $object: pengumuman_set_input!) {
            update_pengumuman_by_pk(pk_columns: {id: $id}, _set: $object) {
                id
            }
        }
    `,
    
    DELETE_PENGUMUMAN: `
        mutation DeletePengumuman($id: UUID!) {
            delete_pengumuman_by_pk(id: $id) {
                id
            }
        }
    `,
    
    // === PENDAFTARAN ===
    GET_PENDAFTARAN: `
        query GetPendaftaran {
            pendaftaran(order_by: {created_at: desc}) {
                id
                nomor_pendaftaran
                foto
                nama_lengkap
                nik
                nip
                jenis_kelamin
                tempat_tgl_lahir
                unit_kerja
                jenis_sdmk
                jenis_profesi
                status_pekerjaan
                lama_bekerja
                email_plataran
                kontak
                alamat
                surat_pernyataan
                judul_kegiatan
                tanggal
                status
                catatan_status
                diubah_oleh
                tanggal_ubah_status
                tanggal_perbaikan
                created_at
                updated_at
            }
        }
    `,
    
    GET_PENDAFTARAN_BY_NIK: `
        query GetPendaftaranByNIK($nik: String!) {
            pendaftaran(where: {nik: {_eq: $nik}}) {
                id
                nomor_pendaftaran
                nama_lengkap
                nik
                nip
                unit_kerja
                jenis_profesi
                judul_kegiatan
                status
                created_at
            }
        }
    `,
    
    INSERT_PENDAFTARAN: `
        mutation InsertPendaftaran($object: pendaftaran_insert_input!) {
            insert_pendaftaran_one(object: $object) {
                id
                nomor_pendaftaran
            }
        }
    `,
    
    UPDATE_PENDAFTARAN: `
        mutation UpdatePendaftaran($id: UUID!, $object: pendaftaran_set_input!) {
            update_pendaftaran_by_pk(pk_columns: {id: $id}, _set: $object) {
                id
                status
                updated_at
            }
        }
    `,
    
    DELETE_PENDAFTARAN: `
        mutation DeletePendaftaran($id: UUID!) {
            delete_pendaftaran_by_pk(id: $id) {
                id
            }
        }
    `,
    
    // === SDMK ===
    GET_SDMK: `
        query GetSDMK {
            sdmk(order_by: {nama_lengkap: asc}) {
                id
                nama_lengkap
                nik_nip
                profesi
                unit_kerja
                no_sertifikat
                judul_kegiatan
                tgl_pelaksanaan
                tahun
                tempat
                status_pelatihan
                created_at
            }
        }
    `,
    
    INSERT_SDMK: `
        mutation InsertSDMK($object: sdmk_insert_input!) {
            insert_sdmk_one(object: $object) {
                id
            }
        }
    `,
    
    UPDATE_SDMK: `
        mutation UpdateSDMK($id: UUID!, $object: sdmk_set_input!) {
            update_sdmk_by_pk(pk_columns: {id: $id}, _set: $object) {
                id
            }
        }
    `,
    
    DELETE_SDMK: `
        mutation DeleteSDMK($id: UUID!) {
            delete_sdmk_by_pk(id: $id) {
                id
            }
        }
    `,
    
    // === SERTIFIKAT ===
    GET_SERTIFIKAT: `
        query GetSertifikat {
            sertifikat(order_by: {tanggal_terbit: desc}) {
                id
                nomor_sertifikat
                nama_penerima
                pelatihan
                tanggal_terbit
                created_at
            }
        }
    `,
    
    INSERT_SERTIFIKAT: `
        mutation InsertSertifikat($object: sertifikat_insert_input!) {
            insert_sertifikat_one(object: $object) {
                id
            }
        }
    `,
    
    UPDATE_SERTIFIKAT: `
        mutation UpdateSertifikat($id: UUID!, $object: sertifikat_set_input!) {
            update_sertifikat_by_pk(pk_columns: {id: $id}, _set: $object) {
                id
            }
        }
    `,
    
    DELETE_SERTIFIKAT: `
        mutation DeleteSertifikat($id: UUID!) {
            delete_sertifikat_by_pk(id: $id) {
                id
            }
        }
    `,
    
    // === MATERI ===
    GET_MATERI: `
        query GetMateri {
            materi(where: {is_active: {_eq: true}}, order_by: {kategori: asc, judul: asc}) {
                id
                judul
                kategori
                link_file
                is_active
                created_at
            }
        }
    `,
    
    INSERT_MATERI: `
        mutation InsertMateri($object: materi_insert_input!) {
            insert_materi_one(object: $object) {
                id
            }
        }
    `,
    
    UPDATE_MATERI: `
        mutation UpdateMateri($id: UUID!, $object: materi_set_input!) {
            update_materi_by_pk(pk_columns: {id: $id}, _set: $object) {
                id
            }
        }
    `,
    
    DELETE_MATERI: `
        mutation DeleteMateri($id: UUID!) {
            delete_materi_by_pk(id: $id) {
                id
            }
        }
    `,
    
    // === DASHBOARD STATS ===
    DASHBOARD_STATS: `
        query DashboardStats {
            pendaftaran_aggregate {
                aggregate {
                    count
                }
            }
            sdmk_aggregate {
                aggregate {
                    count
                }
            }
            sertifikat_aggregate {
                aggregate {
                    count
                }
            }
            pengumuman_aggregate(where: {status: {_eq: "Aktif"}}) {
                aggregate {
                    count
                }
            }
            pendaftaran(where: {status: {_eq: "Menunggu"}}) {
                aggregate {
                    count
                }
            }
            pendaftaran(where: {status: {_eq: "Disetujui"}}) {
                aggregate {
                    count
                }
            }
        }
    `
};

// ==========================================
// NHOST API CLIENT
// ==========================================

class NhostClient {
    constructor(config) {
        this.config = config;
        this.headers = {
            'Content-Type': 'application/json'
        };
        
        if (config.adminSecret && config.adminSecret !== 'ISI_PASSWORD_ANDA_DISINI') {
            this.headers['x-hasura-admin-secret'] = config.adminSecret;
        }
    }
    
    async query(query, variables = {}) {
        const url = this.config.hasuraUrl;
        
        if (this.config.debug) {
            console.log('[Nhost] Query:', query.split('(')[0]);
            if (Object.keys(variables).length > 0) {
                console.log('[Nhost] Variables:', variables);
            }
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    query: query,
                    variables: variables
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });
            
            const data = await response.json();
            
            if (data.errors) {
                console.error('[Nhost] GraphQL Errors:', data.errors);
                throw new Error(data.errors[0].message || 'GraphQL error');
            }
            
            return data.data;
            
        } catch (error) {
            console.error('[Nhost] Request Error:', error);
            throw error;
        }
    }
    
    // Helper methods for common operations
    async getAdmins() {
        return this.query(QUERIES.GET_ADMINS);
    }
    
    async validateLogin(username, password) {
        const result = await this.query(QUERIES.VALIDATE_LOGIN, { username, password });
        return result.admin_users?.[0] || null;
    }
    
    async getPengumuman() {
        return this.query(QUERIES.GET_PENGUMUMAN);
    }
    
    async createPengumuman(data) {
        return this.query(QUERIES.INSERT_PENGUMUMAN, { object: data });
    }
    
    async updatePengumuman(id, data) {
        return this.query(QUERIES.UPDATE_PENGUMUMAN, { id, object: data });
    }
    
    async deletePengumuman(id) {
        return this.query(QUERIES.DELETE_PENGUMUMAN, { id });
    }
    
    async getPendaftaran() {
        return this.query(QUERIES.GET_PENDAFTARAN);
    }
    
    async getPendaftaranByNIK(nik) {
        return this.query(QUERIES.GET_PENDAFTARAN_BY_NIK, { nik });
    }
    
    async createPendaftaran(data) {
        return this.query(QUERIES.INSERT_PENDAFTARAN, { object: data });
    }
    
    async updatePendaftaran(id, data) {
        return this.query(QUERIES.UPDATE_PENDAFTARAN, { id, object: data });
    }
    
    async deletePendaftaran(id) {
        return this.query(QUERIES.DELETE_PENDAFTARAN, { id });
    }
    
    async getSDMK() {
        return this.query(QUERIES.GET_SDMK);
    }
    
    async createSDMK(data) {
        return this.query(QUERIES.INSERT_SDMK, { object: data });
    }
    
    async updateSDMK(id, data) {
        return this.query(QUERIES.UPDATE_SDMK, { id, object: data });
    }
    
    async deleteSDMK(id) {
        return this.query(QUERIES.DELETE_SDMK, { id });
    }
    
    async getSertifikat() {
        return this.query(QUERIES.GET_SERTIFIKAT);
    }
    
    async createSertifikat(data) {
        return this.query(QUERIES.INSERT_SERTIFIKAT, { object: data });
    }
    
    async updateSertifikat(id, data) {
        return this.query(QUERIES.UPDATE_SERTIFIKAT, { id, object: data });
    }
    
    async deleteSertifikat(id) {
        return this.query(QUERIES.DELETE_SERTIFIKAT, { id });
    }
    
    async getMateri() {
        return this.query(QUERIES.GET_MATERI);
    }
    
    async createMateri(data) {
        return this.query(QUERIES.INSERT_MATERI, { object: data });
    }
    
    async updateMateri(id, data) {
        return this.query(QUERIES.UPDATE_MATERI, { id, object: data });
    }
    
    async deleteMateri(id) {
        return this.query(QUERIES.DELETE_MATERI, { id });
    }
    
    async getDashboardStats() {
        return this.query(QUERIES.DASHBOARD_STATS);
    }
}

// ==========================================
// COMPATIBILITY LAYER - Mengganti callServer()
// ==========================================

const nhost = new NhostClient(NHOST_CONFIG);

/**
 * callServer() - Fungsi kompatibilitas
 * Menggantikan JSONP Google Sheets dengan GraphQL Nhost
 */
function callServer(action, data) {
    return new Promise(async (resolve, reject) => {
        try {
            let result;
            
            switch(action) {
                // === ADMIN ===
                case 'getAdmin':
                    result = await nhost.getAdmins();
                    resolve({ success: true, data: result.admin_users });
                    break;
                    
                case 'validateAdminLogin':
                    const user = await nhost.validateLogin(data.username, data.password);
                    if (user) {
                        resolve({
                            success: true,
                            username: user.username,
                            level: user.level,
                            message: 'Login berhasil'
                        });
                    } else {
                        resolve({
                            success: false,
                            message: 'Username atau password salah'
                        });
                    }
                    break;
                    
                case 'tambahAdmin':
                    await nhost.createAdmin(data);
                    resolve({ success: true, message: 'Admin berhasil ditambahkan' });
                    break;
                    
                case 'updateAdmin':
                    const adminData = _allAdmin[data.idx];
                    await nhost.updateAdmin(adminData.id, data.data);
                    resolve({ success: true, message: 'Admin berhasil diperbarui' });
                    break;
                    
                case 'deleteAdmin':
                    const delAdmin = _allAdmin[data.idx];
                    await nhost.deleteAdmin(delAdmin.id);
                    resolve({ success: true, message: 'Admin berhasil dihapus' });
                    break;
                    
                // === PENGUMUMAN ===
                case 'getPengumuman':
                    result = await nhost.getPengumuman();
                    _allPengumuman = result.pengumuman || [];
                    resolve({ success: true, data: _allPengumuman });
                    break;
                    
                case 'tambahPengumuman':
                    await nhost.createPengumuman(data);
                    resolve({ success: true, message: 'Pengumuman berhasil ditambahkan' });
                    break;
                    
                case 'updatePengumuman':
                    const annData = _allPengumuman[data.idx];
                    await nhost.updatePengumuman(annData.id, data.data);
                    resolve({ success: true, message: 'Pengumuman berhasil diperbarui' });
                    break;
                    
                case 'deletePengumuman':
                    const delAnn = _allPengumuman[data.idx];
                    await nhost.deletePengumuman(delAnn.id);
                    resolve({ success: true, message: 'Pengumuman berhasil dihapus' });
                    break;
                    
                // === PENDAFTARAN ===
                case 'getPendaftaran':
                    result = await nhost.getPendaftaran();
                    _allPendaftaran = result.pendaftaran || [];
                    resolve({ success: true, data: _allPendaftaran });
                    break;
                    
                case 'tambahPendaftaran':
                    result = await nhost.createPendaftaran(data);
                    resolve({ 
                        success: true, 
                        message: 'Pendaftaran berhasil dikirim',
                        nomor: result.insert_pendaftaran_one?.nomor_pendaftaran 
                    });
                    break;
                    
                case 'updatePendaftaran':
                    const regData = _allPendaftaran[data.idx];
                    await nhost.updatePendaftaran(regData.id, data.data);
                    resolve({ success: true, message: 'Data berhasil diperbarui' });
                    break;
                    
                case 'deletePendaftaran':
                    const delReg = _allPendaftaran[data.idx];
                    await nhost.deletePendaftaran(delReg.id);
                    resolve({ success: true, message: 'Pendaftaran berhasil dihapus' });
                    break;
                    
                case 'checkDuplicateNIK':
                    result = await nhost.getPendaftaranByNIK(data.NIK);
                    const duplicate = result.pendaftaran?.find(p => 
                        p.id !== (_allPendaftaran[data.excludeIdx]?.id)
                    );
                    if (duplicate) {
                        resolve({ success: false, message: 'NIK sudah terdaftar' });
                    } else {
                        resolve({ success: true, message: 'NIK tersedia' });
                    }
                    break;
                    
                // === SDMK ===
                case 'getSDMK':
                    result = await nhost.getSDMK();
                    _allSDMK = result.sdmk || [];
                    resolve({ success: true, data: _allSDMK });
                    break;
                    
                case 'tambahSDMK':
                    await nhost.createSDMK(data);
                    resolve({ success: true, message: 'Data SDMK berhasil ditambahkan' });
                    break;
                    
                case 'updateSDMK':
                    const sdmkData = _allSDMK[data.idx];
                    await nhost.updateSDMK(sdmkData.id, data.data);
                    resolve({ success: true, message: 'Data SDMK berhasil diperbarui' });
                    break;
                    
                case 'deleteSDMK':
                    const delSdmk = _allSDMK[data.idx];
                    await nhost.deleteSDMK(delSdmk.id);
                    resolve({ success: true, message: 'Data SDMK berhasil dihapus' });
                    break;
                    
                // === SERTIFIKAT ===
                case 'getSertifikat':
                    result = await nhost.getSertifikat();
                    _allSertifikat = result.sertifikat || [];
                    resolve({ success: true, data: _allSertifikat });
                    break;
                    
                case 'tambahSertifikat':
                    await nhost.createSertifikat(data);
                    resolve({ success: true, message: 'Sertifikat berhasil ditambahkan' });
                    break;
                    
                case 'updateSertifikat':
                    const sertData = _allSertifikat[data.idx];
                    await nhost.updateSertifikat(sertData.id, data.data);
                    resolve({ success: true, message: 'Sertifikat berhasil diperbarui' });
                    break;
                    
                case 'deleteSertifikat':
                    const delSert = _allSertifikat[data.idx];
                    await nhost.deleteSertifikat(delSert.id);
                    resolve({ success: true, message: 'Sertifikat berhasil dihapus' });
                    break;
                    
                // === MATERI ===
                case 'getMateri':
                    result = await nhost.getMateri();
                    _allMateri = result.materi || [];
                    resolve({ success: true, data: _allMateri });
                    break;
                    
                case 'tambahMateri':
                    await nhost.createMateri(data);
                    resolve({ success: true, message: 'Materi berhasil ditambahkan' });
                    break;
                    
                case 'updateMateri':
                    const matData = _allMateri[data.idx];
                    await nhost.updateMateri(matData.id, data.data);
                    resolve({ success: true, message: 'Materi berhasil diperbarui' });
                    break;
                    
                case 'deleteMateri':
                    const delMat = _allMateri[data.idx];
                    await nhost.deleteMateri(delMat.id);
                    resolve({ success: true, message: 'Materi berhasil dihapus' });
                    break;
                    
                // === DASHBOARD ===
                case 'getDashboardData':
                    result = await nhost.getDashboardStats();
                    resolve({
                        success: true,
                        stats: {
                            totalPendaftaran: result.pendaftaran_aggregate?.aggregate?.count || 0,
                            totalSDMK: result.sdmk_aggregate?.aggregate?.count || 0,
                            totalSertifikat: result.sertifikat_aggregate?.aggregate?.count || 0,
                            totalPengumuman: result.pengumuman_aggregate?.aggregate?.count || 0,
                            menungguVerifikasi: result.pendaftaran?.length || 0,
                            disetujui: result.pendaftaran?.length || 0
                        },
                        recentPendaftaran: [],
                        pengumumanList: []
                    });
                    break;
                    
                default:
                    console.warn(`[Nhost] Action not implemented: ${action}`);
                    resolve({ success: false, message: `Action ${action} not implemented` });
            }
            
        } catch (error) {
            console.error(`[Nhost] Error in ${action}:`, error);
            reject(error);
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

console.log('%c🚀 PAMUNGKAS + NHOST', 'color: #0D6EFD; font-size: 16px; font-weight: bold;');
console.log('%c✅ Nhost Client initialized', 'color: #10B981;');

if (NHOST_CONFIG.debug && NHOST_CONFIG.adminSecret === 'ISI_PASSWORD_ANDA_DISINI') {
    console.warn('%c⚠️ Please configure NHOST_CONFIG with your credentials!', 'color: #F59E0B; font-weight: bold;');
}
