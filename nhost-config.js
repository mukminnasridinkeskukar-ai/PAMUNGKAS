/**
 * =====================================================
 * PAMUNGKAS - NHOST/HASURA CONFIGURATION
 * VERSI: GitHub Pages Compatible (CORS Bypass)
 * 
 * FITUR:
 * - Auto-detect environment (GitHub Pages / Localhost)
 * - Multi-transport mode (Direct / CORS Proxy / JSONP)
 * - Automatic fallback jika satu metode gagal
 * 
 * CARA PENGGUNAAN:
 * 1. Upload index.html + nhost-config.js ke GitHub repo
 * 2. Enable GitHub Pages di repo settings
 * 3. Aplikasi otomatis terhubung ke Nhost!
 * 
 * =====================================================
 */

// ==========================================
// KONFIGURASI NHOST / HASURA
// ==========================================

const NHOST_CONFIG = {
    // URL Hasura dari dashboard Nhost Anda
    hasuraUrl: 'https://fxqicegiwzfonrugxine.nhost.run/v1/graphql',
    
    // Admin Secret dari Settings → Secrets
    adminSecret: 'pamungkas_admin_2025',
    
    // URL Auth Nhost  
    authUrl: 'https://fxqicegiwzfonrugxine.nhost.run/v1/auth',
    
    // Settings
    timeout: 30000,
    debug: true,
    
    // Transport mode: 'auto' | 'direct' | 'cors-proxy' | 'jsonp'
    transportMode: 'auto'
};

// ==========================================
// CORS PROXY LIST (untuk GitHub Pages)
// ==========================================

const CORS_PROXIES = [
    // Primary proxy - allorigins (winhandler)
    {
        name: 'AllOrigins',
        getUrl: (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
    },
    // Backup proxy - corsproxy.io
    {
        name: 'CORSProxy',
        getUrl: (targetUrl) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    },
    // Tertiary proxy - thingproxy
    {
        name: 'ThingProxy',
        getUrl: (targetUrl) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`
    }
];

// ==========================================
// ENVIRONMENT DETECTION
// ==========================================

function detectEnvironment() {
    const hostname = window.location.hostname;
    const isGitHubPages = hostname.includes('github.io') || hostname.endsWith('github.io');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isFileProtocol = window.location.protocol === 'file:';
    
    return {
        isGitHubPages,
        isLocalhost,
        isFileProtocol,
        hostname,
        protocol: window.location.protocol
    };
}

// ==========================================
// GRAPHQL QUERIES & MUTATIONS
// ==========================================

const QUERIES = {
    // === ADMIN USERS ===
    GET_ADMINS: `
        query GetAdmins {
            admin_users(order_by: {created_at: desc}) {
                id username level is_active created_at
            }
        }
    `,
    
    VALIDATE_LOGIN: `
        query ValidateLogin($username: String!, $password: String!) {
            admin_users(where: {username: {_eq: $username}, password: {_eq: $password}}, limit: 1) {
                id username level
            }
        }
    `,
    
    INSERT_ADMIN: `
        mutation InsertAdmin($object: admin_users_insert_input!) {
            insert_admin_users_one(object: $object) { id username level }
        }
    `,
    
    UPDATE_ADMIN: `
        mutation UpdateAdmin($id: UUID!, $object: admin_users_set_input!) {
            update_admin_users_by_pk(pk_columns: {id: $id}, _set: $object) { id username level }
        }
    `,
    
    DELETE_ADMIN: `
        mutation DeleteAdmin($id: UUID!) {
            delete_admin_users_by_pk(id: $id) { id }
        }
    `,
    
    // === PENGUMUMAN ===
    GET_PENGUMUMAN: `
        query GetPengumuman {
            pengumuman(order_by: {tanggal: desc, created_at: desc}) {
                id judul isi tanggal status created_at
            }
        }
    `,
    
    INSERT_PENGUMUMAN: `
        mutation InsertPengumuman($object: pengumuman_insert_input!) {
            insert_pengumuman_one(object: $object) { id }
        }
    `,
    
    UPDATE_PENGUMUMAN: `
        mutation UpdatePengumuman($id: UUID!, $object: pengumuman_set_input!) {
            update_pengumuman_by_pk(pk_columns: {id: $id}, _set: $object) { id }
        }
    `,
    
    DELETE_PENGUMUMAN: `
        mutation DeletePengumuman($id: UUID!) {
            delete_pengumuman_by_pk(id: $id) { id }
        }
    `,
    
    // === PENDAFTARAN ===
    GET_PENDAFTARAN: `
        query GetPendaftaran {
            pendaftaran(order_by: {created_at: desc}) {
                id nomor_pendaftaran foto nama_lengkap nik nip jenis_kelamin
                tempat_tgl_lahir unit_kerja jenis_sdmk jenis_profesi status_pekerjaan
                lama_bekerja email_plataran kontak alamat surat_pernyataan judul_kegiatan
                tanggal status catatan_status diubah_oleh tanggal_ubah_status
                tanggal_perbaikan created_at updated_at
            }
        }
    `,
    
    GET_PENDAFTARAN_BY_NIK: `
        query GetPendaftaranByNIK($nik: String!) {
            pendaftaran(where: {nik: {_eq: $nik}}) {
                id nomor_pendaftaran nama_lengkap nik nip unit_kerja
                jenis_profesi judul_kegiatan status created_at
            }
        }
    `,
    
    INSERT_PENDAFTARAN: `
        mutation InsertPendaftaran($object: pendaftaran_insert_input!) {
            insert_pendaftaran_one(object: $object) { id nomor_pendaftaran }
        }
    `,
    
    UPDATE_PENDAFTARAN: `
        mutation UpdatePendaftaran($id: UUID!, $object: pendaftaran_set_input!) {
            update_pendaftaran_by_pk(pk_columns: {id: $id}, _set: $object) { id status updated_at }
        }
    `,
    
    DELETE_PENDAFTARAN: `
        mutation DeletePendaftaran($id: UUID!) {
            delete_pendaftaran_by_pk(id: $id) { id }
        }
    `,
    
    // === SDMK ===
    GET_SDMK: `
        query GetSDMK {
            sdmk(order_by: {nama_lengkap: asc}) {
                id nama_lengkap nik_nip profesi unit_kerja no_sertifikat
                judul_kegiatan tgl_pelaksanaan tahun tempat status_pelatihan created_at
            }
        }
    `,
    
    INSERT_SDMK: `
        mutation InsertSDMK($object: sdmk_insert_input!) {
            insert_sdmk_one(object: $object) { id }
        }
    `,
    
    UPDATE_SDMK: `
        mutation UpdateSDMK($id: UUID!, $object: sdmk_set_input!) {
            update_sdmk_by_pk(pk_columns: {id: $id}, _set: $object) { id }
        }
    `,
    
    DELETE_SDMK: `
        mutation DeleteSDMK($id: UUID!) {
            delete_sdmk_by_pk(id: $id) { id }
        }
    `,
    
    // === SERTIFIKAT ===
    GET_SERTIFIKAT: `
        query GetSertifikat {
            sertifikat(order_by: {tanggal_terbit: desc}) {
                id nomor_sertifikat nama_penerima pelatihan tanggal_terbit created_at
            }
        }
    `,
    
    INSERT_SERTIFIKAT: `
        mutation InsertSertifikat($object: sertifikat_insert_input!) {
            insert_sertifikat_one(object: $object) { id }
        }
    `,
    
    UPDATE_SERTIFIKAT: `
        mutation UpdateSertifikat($id: UUID!, $object: sertifikat_set_input!) {
            update_sertifikat_by_pk(pk_columns: {id: $id}, _set: $object) { id }
        }
    `,
    
    DELETE_SERTIFIKAT: `
        mutation DeleteSertifikat($id: UUID!) {
            delete_sertifikat_by_pk(id: $id) { id }
        }
    `,
    
    // === MATERI ===
    GET_MATERI: `
        query GetMateri {
            materi(where: {is_active: {_eq: true}}, order_by: {kategori: asc, judul: asc}) {
                id judul kategori link_file is_active created_at
            }
        }
    `,
    
    INSERT_MATERI: `
        mutation InsertMateri($object: materi_insert_input!) {
            insert_materi_one(object: $object) { id }
        }
    `,
    
    UPDATE_MATERI: `
        mutation UpdateMateri($id: UUID!, $object: materi_set_input!) {
            update_materi_by_pk(pk_columns: {id: $id}, _set: $object) { id }
        }
    `,
    
    DELETE_MATERI: `
        mutation DeleteMateri($id: UUID!) {
            delete_materi_by_pk(id: $id) { id }
        }
    `,
    
    // === DASHBOARD STATS ===
    DASHBOARD_STATS: `
        query DashboardStats {
            pendaftaran_aggregate { aggregate { count } }
            sdmk_aggregate { aggregate { count } }
            sertifikat_aggregate { aggregate { count } }
            pengumuman_aggregate(where: {status: {_eq: "Aktif"}}) { aggregate { count } }
            pendaftaran(where: {status: {_eq: "Menunggu"}}) { aggregate { count } }
            pendaftaran(where: {status: {_eq: "Disetujui"}}) { aggregate { count } }
        }
    `
};

// ==========================================
// NHOST API CLIENT - MULTI TRANSPORT
// ==========================================

class NhostClient {
    constructor(config) {
        this.config = config;
        this.env = detectEnvironment();
        this.currentProxyIndex = 0;
        
        // Determine best transport mode
        if (config.transportMode === 'auto') {
            this.transportMode = this.env.isGitHubPages ? 'cors-proxy' : 'direct';
        } else {
            this.transportMode = config.transportMode;
        }
        
        if (config.debug) {
            console.log('%c🌐 Environment:', 'color: #6B7280;', this.env);
            console.log('%c🚀 Transport Mode:', 'color: #3B82F6;', this.transportMode);
        }
    }
    
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.config.adminSecret && this.config.adminSecret !== 'ISI_PASSWORD_ANDA_DISINI') {
            headers['x-hasura-admin-secret'] = this.config.adminSecret;
        }
        
        return headers;
    }
    
    /**
     * Method 1: Direct Fetch (for localhost/same-origin)
     */
    async directFetch(query, variables = {}) {
        const response = await fetch(this.config.hasuraUrl, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(this.config.timeout)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    /**
     * Method 2: CORS Proxy (for GitHub Pages)
     */
    async corsProxyFetch(query, variables = {}) {
        const requestBody = JSON.stringify({ query, variables });
        
        // Try each proxy in sequence
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            const proxy = CORS_PROXIES[(this.currentProxyIndex + i) % CORS_PROXIES.length];
            
            try {
                if (this.config.debug) {
                    console.log(`%c🔄 Trying proxy:`, 'color: #F59E0B;', proxy.name);
                }
                
                const proxyUrl = proxy.getUrl(this.config.hasuraUrl);
                
                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: requestBody,
                    signal: AbortSignal.timeout(this.config.timeout)
                });
                
                if (!response.ok) {
                    throw new Error(`Proxy ${proxy.name} returned HTTP ${response.status}`);
                }
                
                const data = await response.json();
                
                // Remember working proxy
                this.currentProxyIndex = (this.currentProxyIndex + i) % CORS_PROXIES.length;
                
                return data;
                
            } catch (error) {
                console.warn(`%c⚠️ Proxy ${proxy.name} failed:`, 'color: #F59E0B;', error.message);
                
                // If last proxy also failed, throw error
                if (i === CORS_PROXIES.length - 1) {
                    throw new Error('All CORS proxies failed. Check your internet connection.');
                }
            }
        }
    }
    
    /**
     * Method 3: JSONP-style for GET queries only (fallback)
     */
    jsonpFetch(query, variables = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Build URL with query params
            const params = new URLSearchParams({
                query: query,
                variables: JSON.stringify(variables)
            });
            
            const url = `${this.config.hasuraUrl}?${params.toString()}`;
            
            // Create script element
            const script = document.createElement('script');
            
            // Define callback
            window[callbackName] = (data) => {
                cleanup();
                resolve(data);
            };
            
            // Handle timeout
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP request timeout'));
            }, this.config.timeout);
            
            function cleanup() {
                delete window[callbackName];
                clearTimeout(timeout);
                script.remove();
            }
            
            script.onerror = () => {
                cleanup();
                reject(new Error('JSONP request failed'));
            };
            
            script.src = url;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Main query method with automatic transport selection
     */
    async query(query, variables = {}) {
        if (this.config.debug) {
            console.log('[Nhost] Query:', query.split('(')[0].trim());
            if (Object.keys(variables).length > 0) {
                console.log('[Nhost] Variables:', variables);
            }
        }
        
        let result;
        let error;
        
        try {
            // Try primary transport first
            switch (this.transportMode) {
                case 'direct':
                    result = await this.directFetch(query, variables);
                    break;
                    
                case 'cors-proxy':
                    result = await this.corsProxyFetch(query, variables);
                    break;
                    
                default:
                    // Auto: try direct first, then fallback to proxy
                    try {
                        result = await this.directFetch(query, variables);
                    } catch (directError) {
                        console.warn('[Nhost] Direct fetch failed, trying CORS proxy...');
                        result = await this.corsProxyFetch(query, variables);
                    }
            }
            
            // Check for GraphQL errors
            if (result.errors) {
                console.error('[Nhost] GraphQL Errors:', result.errors);
                throw new Error(result.errors[0].message || 'GraphQL error');
            }
            
            return result.data;
            
        } catch (err) {
            error = err;
            console.error('[Nhost] Request Error:', err.message);
            throw err;
        }
    }
    
    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    async getAdmins() { return this.query(QUERIES.GET_ADMINS); }
    
    async validateLogin(username, password) {
        const result = await this.query(QUERIES.VALIDATE_LOGIN, { username, password });
        return result.admin_users?.[0] || null;
    }
    
    async createAdmin(data) { return this.query(QUERIES.INSERT_ADMIN, { object: data }); }
    async updateAdmin(id, data) { return this.query(QUERIES.UPDATE_ADMIN, { id, object: data }); }
    async deleteAdmin(id) { return this.query(QUERIES.DELETE_ADMIN, { id }); }
    
    async getPengumuman() { return this.query(QUERIES.GET_PENGUMUMAN); }
    async createPengumuman(data) { return this.query(QUERIES.INSERT_PENGUMUMAN, { object: data }); }
    async updatePengumuman(id, data) { return this.query(QUERIES.UPDATE_PENGUMUMAN, { id, object: data }); }
    async deletePengumuman(id) { return this.query(QUERIES.DELETE_PENGUMUMAN, { id }); }
    
    async getPendaftaran() { return this.query(QUERIES.GET_PENDAFTARAN); }
    async getPendaftaranByNIK(nik) { return this.query(QUERIES.GET_PENDAFTARAN_BY_NIK, { nik }); }
    async createPendaftaran(data) { return this.query(QUERIES.INSERT_PENDAFTARAN, { object: data }); }
    async updatePendaftaran(id, data) { return this.query(QUERIES.UPDATE_PENDAFTARAN, { id, object: data }); }
    async deletePendaftaran(id) { return this.query(QUERIES.DELETE_PENDAFTARAN, { id }); }
    
    async getSDMK() { return this.query(QUERIES.GET_SDMK); }
    async createSDMK(data) { return this.query(QUERIES.INSERT_SDMK, { object: data }); }
    async updateSDMK(id, data) { return this.query(QUERIES.UPDATE_SDMK, { id, object: data }); }
    async deleteSDMK(id) { return this.query(QUERIES.DELETE_SDMK, { id }); }
    
    async getSertifikat() { return this.query(QUERIES.GET_SERTIFIKAT); }
    async createSertifikat(data) { return this.query(QUERIES.INSERT_SERTIFIKAT, { object: data }); }
    async updateSertifikat(id, data) { return this.query(QUERIES.UPDATE_SERTIFIKAT, { id, object: data }); }
    async deleteSertifikat(id) { return this.query(QUERIES.DELETE_SERTIFIKAT, { id }); }
    
    async getMateri() { return this.query(QUERIES.GET_MATERI); }
    async createMateri(data) { return this.query(QUERIES.INSERT_MATERI, { object: data }); }
    async updateMateri(id, data) { return this.query(QUERIES.UPDATE_MATERI, { id, object: data }); }
    async deleteMateri(id) { return this.query(QUERIES.DELETE_MATERI, { id }); }
    
    async getDashboardStats() { return this.query(QUERIES.DASHBOARD_STATS); }
}

// ==========================================
// INITIALIZE CLIENT
// ==========================================

const nhost = new NhostClient(NHOST_CONFIG);

// ==========================================
// COMPATIBILITY LAYER - callServer()
// ==========================================

/**
 * callServer() - Fungsi kompatibilitas
 * Menggantikan JSONP Google Sheets dengan GraphQL Nhost
 * Support multi-transport (direct/CORS proxy)
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
                    const adminData = typeof _allAdmin !== 'undefined' ? _allAdmin[data.idx] : null;
                    if (adminData) {
                        await nhost.updateAdmin(adminData.id, data.data);
                        resolve({ success: true, message: 'Admin berhasil diperbarui' });
                    } else {
                        resolve({ success: false, message: 'Data admin tidak ditemukan' });
                    }
                    break;
                    
                case 'deleteAdmin':
                    const delAdmin = typeof _allAdmin !== 'undefined' ? _allAdmin[data.idx] : null;
                    if (delAdmin) {
                        await nhost.deleteAdmin(delAdmin.id);
                        resolve({ success: true, message: 'Admin berhasil dihapus' });
                    } else {
                        resolve({ success: false, message: 'Data admin tidak ditemukan' });
                    }
                    break;
                    
                // === PENGUMUMAN ===
                case 'getPengumuman':
                    result = await nhost.getPengumuman();
                    if (typeof _allPengumuman !== 'undefined') {
                        _allPengumuman = result.pengumuman || [];
                    }
                    resolve({ success: true, data: result.pengumuman || [] });
                    break;
                    
                case 'tambahPengumuman':
                    await nhost.createPengumuman(data);
                    resolve({ success: true, message: 'Pengumuman berhasil ditambahkan' });
                    break;
                    
                case 'updatePengumuman':
                    const annData = typeof _allPengumuman !== 'undefined' ? _allPengumuman[data.idx] : null;
                    if (annData) {
                        await nhost.updatePengumuman(annData.id, data.data);
                        resolve({ success: true, message: 'Pengumuman berhasil diperbarui' });
                    } else {
                        resolve({ success: false, message: 'Data pengumuman tidak ditemukan' });
                    }
                    break;
                    
                case 'deletePengumuman':
                    const delAnn = typeof _allPengumuman !== 'undefined' ? _allPengumuman[data.idx] : null;
                    if (delAnn) {
                        await nhost.deletePengumuman(delAnn.id);
                        resolve({ success: true, message: 'Pengumuman berhasil dihapus' });
                    } else {
                        resolve({ success: false, message: 'Data pengumuman tidak ditemukan' });
                    }
                    break;
                    
                // === PENDAFTARAN ===
                case 'getPendaftaran':
                    result = await nhost.getPendaftaran();
                    if (typeof _allPendaftaran !== 'undefined') {
                        _allPendaftaran = result.pendaftaran || [];
                    }
                    resolve({ success: true, data: result.pendaftaran || [] });
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
                    const regData = typeof _allPendaftaran !== 'undefined' ? _allPendaftaran[data.idx] : null;
                    if (regData) {
                        await nhost.updatePendaftaran(regData.id, data.data);
                        resolve({ success: true, message: 'Data berhasil diperbarui' });
                    } else {
                        resolve({ success: false, message: 'Data pendaftaran tidak ditemukan' });
                    }
                    break;
                    
                case 'deletePendaftaran':
                    const delReg = typeof _allPendaftaran !== 'undefined' ? _allPendaftaran[data.idx] : null;
                    if (delReg) {
                        await nhost.deletePendaftaran(delReg.id);
                        resolve({ success: true, message: 'Pendaftaran berhasil dihapus' });
                    } else {
                        resolve({ success: false, message: 'Data pendaftaran tidak ditemukan' });
                    }
                    break;
                    
                case 'checkDuplicateNIK':
                    result = await nhost.getPendaftaranByNIK(data.NIK);
                    const duplicate = result.pendaftaran?.find(p => 
                        p.id !== (typeof _allPendaftaran !== 'undefined' ? _allPendaftaran[data.excludeIdx]?.id : undefined)
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
                    if (typeof _allSDMK !== 'undefined') {
                        _allSDMK = result.sdmk || [];
                    }
                    resolve({ success: true, data: result.sdmk || [] });
                    break;
                    
                case 'tambahSDMK':
                    await nhost.createSDMK(data);
                    resolve({ success: true, message: 'Data SDMK berhasil ditambahkan' });
                    break;
                    
                case 'updateSDMK':
                    const sdmkData = typeof _allSDMK !== 'undefined' ? _allSDMK[data.idx] : null;
                    if (sdmkData) {
                        await nhost.updateSDMK(sdmkData.id, data.data);
                        resolve({ success: true, message: 'Data SDMK berhasil diperbarui' });
                    } else {
                        resolve({ success: false, message: 'Data SDMK tidak ditemukan' });
                    }
                    break;
                    
                case 'deleteSDMK':
                    const delSdmk = typeof _allSDMK !== 'undefined' ? _allSDMK[data.idx] : null;
                    if (delSdmk) {
                        await nhost.deleteSDMK(delSdmk.id);
                        resolve({ success: true, message: 'Data SDMK berhasil dihapus' });
                    } else {
                        resolve({ success: false, message: 'Data SDMK tidak ditemukan' });
                    }
                    break;
                    
                // === SERTIFIKAT ===
                case 'getSertifikat':
                    result = await nhost.getSertifikat();
                    if (typeof _allSertifikat !== 'undefined') {
                        _allSertifikat = result.sertifikat || [];
                    }
                    resolve({ success: true, data: result.sertifikat || [] });
                    break;
                    
                case 'tambahSertifikat':
                    await nhost.createSertifikat(data);
                    resolve({ success: true, message: 'Sertifikat berhasil ditambahkan' });
                    break;
                    
                case 'updateSertifikat':
                    const sertData = typeof _allSertifikat !== 'undefined' ? _allSertifikat[data.idx] : null;
                    if (sertData) {
                        await nhost.updateSertifikat(sertData.id, data.data);
                        resolve({ success: true, message: 'Sertifikat berhasil diperbarui' });
                    } else {
                        resolve({ success: false, message: 'Data sertifikat tidak ditemukan' });
                    }
                    break;
                    
                case 'deleteSertifikat':
                    const delSert = typeof _allSertifikat !== 'undefined' ? _allSertifikat[data.idx] : null;
                    if (delSert) {
                        await nhost.deleteSertifikat(delSert.id);
                        resolve({ success: true, message: 'Sertifikat berhasil dihapus' });
                    } else {
                        resolve({ success: false, message: 'Data sertifikat tidak ditemukan' });
                    }
                    break;
                    
                // === MATERI ===
                case 'getMateri':
                    result = await nhost.getMateri();
                    if (typeof _allMateri !== 'undefined') {
                        _allMateri = result.materi || [];
                    }
                    resolve({ success: true, data: result.materi || [] });
                    break;
                    
                case 'tambahMateri':
                    await nhost.createMateri(data);
                    resolve({ success: true, message: 'Materi berhasil ditambahkan' });
                    break;
                    
                case 'updateMateri':
                    const matData = typeof _allMateri !== 'undefined' ? _allMateri[data.idx] : null;
                    if (matData) {
                        await nhost.updateMateri(matData.id, data.data);
                        resolve({ success: true, message: 'Materi berhasil diperbarui' });
                    } else {
                        resolve({ success: false, message: 'Data materi tidak ditemukan' });
                    }
                    break;
                    
                case 'deleteMateri':
                    const delMat = typeof _allMateri !== 'undefined' ? _allMateri[data.idx] : null;
                    if (delMat) {
                        await nhost.deleteMateri(delMat.id);
                        resolve({ success: true, message: 'Materi berhasil dihapus' });
                    } else {
                        resolve({ success: false, message: 'Data materi tidak ditemukan' });
                    }
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
                            menungguVerifikasi: result.pendaftaran?.[0]?.aggregate?.count || 0,
                            disetujui: result.pendaftaran?.[1]?.aggregate?.count || 0
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
// INITIALIZATION & CONNECTION TEST
// ==========================================

console.log('%c🚀 PAMUNGKAS + NHOST', 'color: #0D6EFD; font-size: 16px; font-weight: bold;');
console.log('%c✅ Nhost Client initialized', 'color: #10B981;');
console.log('%c📡 Hasura URL:', 'color: #6B7280;', NHOST_CONFIG.hasuraUrl);

if (nhost.env.isGitHubPages) {
    console.log('%c🌍 Running on GitHub Pages', 'color: #8B5CF6; font-weight: bold;');
    console.log('%c🔄 Using CORS Proxy mode', 'color: #F59E0B;');
} else if (nhost.env.isLocalhost) {
    console.log('%c💻 Running on Localhost', 'color: #10B981; font-weight: bold;');
    console.log('%c🔗 Using Direct connection', 'color: #10B981;');
}

if (NHOST_CONFIG.adminSecret === 'ISI_PASSWORD_ANDA_DISINI') {
    console.warn('%c⚠️ WARNING: Admin Secret not configured!', 'color: #F59E0B; font-weight: bold;');
} else {
    console.log('%c🔑 Admin Secret: ✓ Configured', 'color: #10B981;');
}

/**
 * Test koneksi ke Hasura
 * Panggil di console: testConnection()
 */
async function testConnection() {
    console.log('\n%c🔍 Testing Nhost Connection...', 'color: #3B82F6; font-weight: bold;');
    console.log('%c   Mode:', 'color: #6B7280;', nhost.transportMode);
    
    try {
        const result = await nhost.query('{ __typename }');
        
        console.log('%c✅ SUCCESS! Connected to Nhost/Hasura', 'color: #10B981; font-weight: bold;');
        console.log('%c   → Database ready!', 'color: #10B981;');
        console.log('%c   → Transport:', 'color: #10B981;', nhost.transportMode);
        return true;
        
    } catch (error) {
        console.error('%c❌ CONNECTION FAILED!', 'color: #EF4444; font-weight: bold;');
        console.error('%c   Error:', 'color: #EF4444;', error.message);
        console.log('');
        console.log('%c🔧 TROUBLESHOOTING:', 'color: #F59E0B; font-weight: bold;');
        console.log('   1. Check internet connection');
        console.log('   2. Verify Nhost project is RUNNING');
        console.log('   3. Open URL directly in browser:');
        console.log('      ', NHOST_CONFIG.hasuraUrl);
        console.log('');
        
        if (nhost.env.isGitHubPages) {
            console.log('%c💡 GITHUB PAGES USERS:', 'color: #8B5CF6; font-weight: bold;');
            console.log('   Using CORS proxy to bypass browser restrictions');
            console.log('   If still failing, proxies might be down temporarily');
        }
        
        return false;
    }
}

// Auto-test on load (if debug mode)
if (NHOST_CONFIG.debug) {
    setTimeout(testConnection, 2000);
    window.testConnection = testConnection;
    console.log('%c💡 Type testConnection() in console to retry', 'color: #6B7280;');
}
