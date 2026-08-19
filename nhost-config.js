/**
 * =====================================================
 * PAMUNGKAS - NHOST/HASURA CONFIGURATION
 * VERSI: ULTIMATE GitHub Pages Compatible
 * 
 * SOLUSI UNTUK GITHUB PAGES:
 * - JSONP mode (GET request) untuk bypass CORS
 * - Fallback ke multiple CORS proxies
 * - Auto-retry dengan metode berbeda
 * 
 * CARA KERJA:
 * 1. Coba Direct fetch (untuk localhost)
 * 2. Jika gagal → Coba JSONP (bypass CORS)
 * 3. Jika gagal → Coba CORS Proxies
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
    
    // Settings
    timeout: 30000,
    debug: true
};

// ==========================================
// DETECT ENVIRONMENT
// ==========================================

function detectEnvironment() {
    const hostname = window.location.hostname;
    return {
        isGitHubPages: hostname.includes('github.io') || hostname.endsWith('github.io'),
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1',
        isFileProtocol: window.location.protocol === 'file:',
        hostname: hostname
    };
}

const ENV = detectEnvironment();

// ==========================================
// GRAPHQL QUERIES & MUTATIONS
// ==========================================

const QUERIES = {
    GET_ADMINS: `query GetAdmins { admin_users(order_by: {created_at: desc}) { id username level is_active created_at } }`,
    VALIDATE_LOGIN: `query ValidateLogin($username: String!, $password: String!) { admin_users(where: {username: {_eq: $username}, password: {_eq: $password}}, limit: 1) { id username level } }`,
    INSERT_ADMIN: `mutation InsertAdmin($object: admin_users_insert_input!) { insert_admin_users_one(object: $object) { id username level } }`,
    UPDATE_ADMIN: `mutation UpdateAdmin($id: UUID!, $object: admin_users_set_input!) { update_admin_users_by_pk(pk_columns: {id: $id}, _set: $object) { id username level } }`,
    DELETE_ADMIN: `mutation DeleteAdmin($id: UUID!) { delete_admin_users_by_pk(id: $id) { id } }`,
    GET_PENGUMUMAN: `query GetPengumuman { pengumuman(order_by: {tanggal: desc, created_at: desc}) { id judul isi tanggal status created_at } }`,
    INSERT_PENGUMUMAN: `mutation InsertPengumuman($object: pengumuman_insert_input!) { insert_pengumuman_one(object: $object) { id } }`,
    UPDATE_PENGUMUMAN: `mutation UpdatePengumuman($id: UUID!, $object: pengumuman_set_input!) { update_pengumuman_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
    DELETE_PENGUMUMAN: `mutation DeletePengumuman($id: UUID!) { delete_pengumuman_by_pk(id: $id) { id } }`,
    GET_PENDAFTARAN: `query GetPendaftaran { pendaftaran(order_by: {created_at: desc}) { id nomor_pendaftaran foto nama_lengkap nik nip jenis_kelamin tempat_tgl_lahir unit_kerja jenis_sdmk jenis_profesi status_pekerjaan lama_bekerja email_plataran kontak alamat surat_pernyataan judul_kegiatan tanggal status catatan_status diubah_oleh tanggal_ubah_status tanggal_perbaikan created_at updated_at } }`,
    GET_PENDAFTARAN_BY_NIK: `query GetPendaftaranByNIK($nik: String!) { pendaftaran(where: {nik: {_eq: $nik}}) { id nomor_pendaftaran nama_lengkap nik nip unit_kerja jenis_profesi judul_kegiatan status created_at } }`,
    INSERT_PENDAFTARAN: `mutation InsertPendaftaran($object: pendaftaran_insert_input!) { insert_pendaftaran_one(object: $object) { id nomor_pendaftaran } }`,
    UPDATE_PENDAFTARAN: `mutation UpdatePendaftaran($id: UUID!, $object: pendaftaran_set_input!) { update_pendaftaran_by_pk(pk_columns: {id: $id}, _set: $object) { id status updated_at } }`,
    DELETE_PENDAFTARAN: `mutation DeletePendaftaran($id: UUID!) { delete_pendaftaran_by_pk(id: $id) { id } }`,
    GET_SDMK: `query GetSDMK { sdmk(order_by: {nama_lengkap: asc}) { id nama_lengkap nik_nip profesi unit_kerja no_sertifikat judul_kegiatan tgl_pelaksanaan tahun tempat status_pelatihan created_at } }`,
    INSERT_SDMK: `mutation InsertSDMK($object: sdmk_insert_input!) { insert_sdmk_one(object: $object) { id } }`,
    UPDATE_SDMK: `mutation UpdateSDMK($id: UUID!, $object: sdmk_set_input!) { update_sdmk_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
    DELETE_SDMK: `mutation DeleteSDMK($id: UUID!) { delete_sdmk_by_pk(id: $id) { id } }`,
    GET_SERTIFIKAT: `query GetSertifikat { sertifikat(order_by: {tanggal_terbit: desc}) { id nomor_sertifikat nama_penerima pelatihan tanggal_terbit created_at } }`,
    INSERT_SERTIFIKAT: `mutation InsertSertifikat($object: sertifikat_insert_input!) { insert_sertifikat_one(object: $object) { id } }`,
    UPDATE_SERTIFIKAT: `mutation UpdateSertifikat($id: UUID!, $object: sertifikat_set_input!) { update_sertifikat_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
    DELETE_SERTIFIKAT: `mutation DeleteSertifikat($id: UUID!) { delete_sertifikat_by_pk(id: $id) { id } }`,
    GET_MATERI: `query GetMateri { materi(where: {is_active: {_eq: true}}, order_by: {kategori: asc, judul: asc}) { id judul kategori link_file is_active created_at } }`,
    INSERT_MATERI: `mutation InsertMateri($object: materi_insert_input!) { insert_materi_one(object: $object) { id } }`,
    UPDATE_MATERI: `mutation UpdateMateri($id: UUID!, $object: materi_set_input!) { update_materi_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
    DELETE_MATERI: `mutation DeleteMateri($id: UUID!) { delete_materi_by_pk(id: $id) { id } }`,
    DASHBOARD_STATS: `query DashboardStats { pendaftaran_aggregate { aggregate { count } } sdmk_aggregate { aggregate { count } } sertifikat_aggregate { aggregate { count } } pengumuman_aggregate(where: {status: {_eq: "Aktif"}}) { aggregate { count } } pendaftaran(where: {status: {_eq: "Menunggu"}}) { aggregate { count } } pendaftaran(where: {status: {_eq: "Disetujui"}}) { aggregate { count } } }`
};

// ==========================================
// NHOST CLIENT - MULTI STRATEGY
// ==========================================

class NhostClient {
    constructor(config) {
        this.config = config;
        this.env = ENV;
        
        if (config.debug) {
            console.log('%c🌐 Environment:', 'color: #6B7280;', this.env);
            console.log('%c🚀 Transport:', 'color: #3B82F6;', this.env.isGitHubPages ? 'JSONP + CORS Hybrid' : 'Direct Fetch');
        }
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.adminSecret && this.config.adminSecret !== 'ISI_PASSWORD_ANDA_DISINI') {
            headers['x-hasura-admin-secret'] = this.config.adminSecret;
        }
        return headers;
    }

    // ========================================
    // METHOD 1: DIRECT FETCH (for localhost)
    // ========================================
    async directFetch(query, variables) {
        if (this.config.debug) console.log('[Nhost] Trying: Direct Fetch...');
        
        const response = await fetch(this.config.hasuraUrl, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    // ========================================
    // METHOD 2: JSONP (GET request - bypass CORS)
    // ========================================
    jsonpFetch(query, variables) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            
            // Build GET URL with query as parameter
            const params = new URLSearchParams({
                query: query,
                ...(variables && Object.keys(variables).length > 0 && { variables: JSON.stringify(variables) })
            });
            
            const url = `${this.config.hasuraUrl}?${params.toString()}`;
            
            if (this.config.debug) console.log('[Nhost] Trying: JSONP...');
            
            // Create script element for JSONP
            const script = document.createElement('script');
            
            // Timeout handler
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP timeout'));
            }, this.config.timeout);
            
            function cleanup() {
                if (window[callbackName]) delete window[callbackName];
                clearTimeout(timeout);
                if (script.parentNode) script.remove();
            }
            
            // Callback handler
            window[callbackName] = (data) => {
                cleanup();
                
                // Hasura returns data directly in JSONP-like format
                resolve(data);
            };
            
            // Error handler
            script.onerror = () => {
                cleanup();
                reject(new Error('JSONP load error'));
            };
            
            script.src = url;
            document.head.appendChild(script);
        });
    }

    // ========================================
    // METHOD 3: IMAGE-based transport (no-CORS)
    // ========================================
    imageBeaconFetch(query, variables) {
        return new Promise((resolve, reject) => {
            if (this.config.debug) console.log('[Nhost] Trying: Image Beacon...');
            
            const params = new URLSearchParams({
                query: query,
                ...(variables && { variables: JSON.stringify(variables) })
            });
            
            const img = new Image();
            const timeout = setTimeout(() => {
                reject(new Error('Image beacon timeout'));
            }, this.config.timeout);
            
            img.onload = () => {
                clearTimeout(timeout);
                // Image loaded means request went through, but we can't read response
                // This is a last resort for write operations only
                resolve({ success: true, message: 'Request sent (response unreadable)' });
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Image beacon failed'));
            };
            
            // Add cache buster
            img.src = `${this.config.hasuraUrl}?${params.toString()}&_cb=${Date.now()}`;
        });
    }

    // ========================================
    // METHOD 4: CORS PROXIES
    // ========================================
    async corsProxyFetch(query, variables) {
        const proxies = [
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        ];
        
        const body = JSON.stringify({ query, variables });
        
        for (let i = 0; i < proxies.length; i++) {
            try {
                const proxyFn = proxies[i];
                const proxyUrl = proxyFn(this.config.hasuraUrl);
                
                if (this.config.debug) console.log(`[Nhost] Trying: CORS Proxy ${i+1}/${proxies.length}...`);
                
                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: body,
                    signal: AbortSignal.timeout(15000)
                });
                
                if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
                
                const text = await response.text();
                let data;
                
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Some proxies wrap response
                    data = { contents: text };
                }
                
                return data;
                
            } catch (err) {
                console.warn(`[Nhost] Proxy ${i+1} failed:`, err.message);
                if (i === proxies.length - 1) throw new Error('All proxies failed');
            }
        }
    }

    // ========================================
    // MAIN QUERY METHOD - AUTO FALLBACK
    // ========================================
    async query(query, variables = {}) {
        if (this.config.debug) {
            const qName = query.match(/(?:query|mutation)\s+(\w+)/)?.[1] || 'unknown';
            console.log(`%c[Nhost] Query: ${qName}`, 'color: #3B82F6; font-weight:bold;');
        }

        let lastError;

        // Strategy 1: Try direct first (works on localhost)
        if (!this.env.isGitHubPages) {
            try {
                const result = await this.directFetch(query, variables);
                return this.handleResponse(result);
            } catch (e) {
                lastError = e;
                console.warn('[Nhost] Direct failed, trying alternatives...', e.message);
            }
        }

        // Strategy 2: Try JSONP (works for GET queries)
        if (!query.trim().startsWith('mutation')) {
            try {
                const result = await this.jsonpFetch(query, variables);
                return this.handleResponse(result);
            } catch (e) {
                lastError = e;
                console.warn('[Nhost] JSONP failed, trying CORS proxy...', e.message);
            }
        }

        // Strategy 3: Try CORS proxies
        try {
            const result = await this.corsProxyFetch(query, variables);
            return this.handleResponse(result);
        } catch (e) {
            lastError = e;
            console.error('[Nhost] All methods failed!');
        }

        // All strategies failed
        throw new Error(lastError?.message || 'Connection failed. Check internet and try again.');
    }

    handleResponse(data) {
        // Handle different response formats from proxies
        let parsedData = data;
        
        // Some proxies wrap in .contents or .data
        if (data?.contents) {
            try {
                parsedData = typeof data.contents === 'string' 
                    ? JSON.parse(data.contents) 
                    : data.contents;
            } catch (e) {
                parsedData = data.contents;
            }
        }
        
        // Check for GraphQL errors
        if (parsedData?.errors) {
            console.error('[Nhost] GraphQL Errors:', parsedData.errors);
            throw new Error(parsedData.errors[0]?.message || 'GraphQL error');
        }
        
        return parsedData?.data || parsedData;
    }

    // ========================================
    // HELPER METHODS
    // ========================================
    async getAdmins() { return this.query(QUERIES.GET_ADMINS); }
    async validateLogin(u, p) { const r = await this.query(QUERIES.VALIDATE_LOGIN, { username: u, password: p }); return r?.admin_users?.[0] || null; }
    async createAdmin(d) { return this.query(QUERIES.INSERT_ADMIN, { object: d }); }
    async updateAdmin(id, d) { return this.query(QUERIES.UPDATE_ADMIN, { id, object: d }); }
    async deleteAdmin(id) { return this.query(QUERIES.DELETE_ADMIN, { id }); }
    async getPengumuman() { return this.query(QUERIES.GET_PENGUMUMAN); }
    async createPengumuman(d) { return this.query(QUERIES.INSERT_PENGUMUMAN, { object: d }); }
    async updatePengumuman(id, d) { return this.query(QUERIES.UPDATE_PENGUMUMAN, { id, object: d }); }
    async deletePengumuman(id) { return this.query(QUERIES.DELETE_PENGUMUMAN, { id }); }
    async getPendaftaran() { return this.query(QUERIES.GET_PENDAFTARAN); }
    async getPendaftaranByNIK(nik) { return this.query(QUERIES.GET_PENDAFTARAN_BY_NIK, { nik }); }
    async createPendaftaran(d) { return this.query(QUERIES.INSERT_PENDAFTARAN, { object: d }); }
    async updatePendaftaran(id, d) { return this.query(QUERIES.UPDATE_PENDAFTARAN, { id, object: d }); }
    async deletePendaftaran(id) { return this.query(QUERIES.DELETE_PENDAFTARAN, { id }); }
    async getSDMK() { return this.query(QUERIES.GET_SDMK); }
    async createSDMK(d) { return this.query(QUERIES.INSERT_SDMK, { object: d }); }
    async updateSDMK(id, d) { return this.query(QUERIES.UPDATE_SDMK, { id, object: d }); }
    async deleteSDMK(id) { return this.query(QUERIES.DELETE_SDMK, { id }); }
    async getSertifikat() { return this.query(QUERIES.GET_SERTIFIKAT); }
    async createSertifikat(d) { return this.query(QUERIES.INSERT_SERTIFIKAT, { object: d }); }
    async updateSertifikat(id, d) { return this.query(QUERIES.UPDATE_SERTIFIKAT, { id, object: d }); }
    async deleteSertifikat(id) { return this.query(QUERIES.DELETE_SERTIFIKAT, { id }); }
    async getMateri() { return this.query(QUERIES.GET_MATERI); }
    async createMateri(d) { return this.query(QUERIES.INSERT_MATERI, { object: d }); }
    async updateMateri(id, d) { return this.query(QUERIES.UPDATE_MATERI, { id, object: d }); }
    async deleteMateri(id) { return this.query(QUERIES.DELETE_MATERI, { id }); }
    async getDashboardStats() { return this.query(QUERIES.DASHBOARD_STATS); }
}

// ==========================================
// INITIALIZE
// ==========================================

const nhost = new NhostClient(NHOST_CONFIG);

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
                    result = await nhost.getAdmins();
                    resolve({ success: true, data: g(result.admin_users) });
                    break;
                    
                case 'validateAdminLogin':
                    const user = await nhost.validateLogin(data.username, data.password);
                    resolve(user 
                        ? { success: true, username: user.username, level: user.level, message: 'Login berhasil' }
                        : { success: false, message: 'Username atau password salah' }
                    );
                    break;
                    
                case 'tambahAdmin':
                    await nhost.createAdmin(data);
                    resolve({ success: true, message: 'Admin berhasil ditambahkan' });
                    break;
                    
                case 'updateAdmin':
                    if (typeof _allAdmin !== 'undefined' && safeGet(_allAdmin, data.idx)) {
                        await nhost.updateAdmin(_allAdmin[data.idx].id, data.data);
                        resolve({ success: true, message: 'Admin berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteAdmin':
                    if (typeof _allAdmin !== 'undefined' && safeGet(_allAdmin, data.idx)) {
                        await nhost.deleteAdmin(_allAdmin[data.idx].id);
                        resolve({ success: true, message: 'Admin berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getPengumuman':
                    result = await nhost.getPengumuman();
                    if (typeof _allPengumuman !== 'undefined') _allPengumuman = g(result.pengumuman);
                    resolve({ success: true, data: g(result.pengumuman) });
                    break;
                    
                case 'tambahPengumuman':
                    await nhost.createPengumuman(data);
                    resolve({ success: true, message: 'Pengumuman berhasil ditambahkan' });
                    break;
                    
                case 'updatePengumuman':
                    if (typeof _allPengumuman !== 'undefined' && safeGet(_allPengumuman, data.idx)) {
                        await nhost.updatePengumuman(_allPengumuman[data.idx].id, data.data);
                        resolve({ success: true, message: 'Pengumuman berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deletePengumuman':
                    if (typeof _allPengumuman !== 'undefined' && safeGet(_allPengumuman, data.idx)) {
                        await nhost.deletePengumuman(_allPengumuman[data.idx].id);
                        resolve({ success: true, message: 'Pengumuman berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getPendaftaran':
                    result = await nhost.getPendaftaran();
                    if (typeof _allPendaftaran !== 'undefined') _allPendaftaran = g(result.pendaftaran);
                    resolve({ success: true, data: g(result.pendaftaran) });
                    break;
                    
                case 'tambahPendaftaran':
                    result = await nhost.createPendaftaran(data);
                    resolve({ success: true, message: 'Pendaftaran berhasil dikirim', nomor: result?.insert_pendaftaran_one?.nomor_pendaftaran });
                    break;
                    
                case 'updatePendaftaran':
                    if (typeof _allPendaftaran !== 'undefined' && safeGet(_allPendaftaran, data.idx)) {
                        await nhost.updatePendaftaran(_allPendaftaran[data.idx].id, data.data);
                        resolve({ success: true, message: 'Data berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deletePendaftaran':
                    if (typeof _allPendaftaran !== 'undefined' && safeGet(_allPendaftaran, data.idx)) {
                        await nhost.deletePendaftaran(_allPendaftaran[data.idx].id);
                        resolve({ success: true, message: 'Pendaftaran berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'checkDuplicateNIK':
                    result = await nhost.getPendaftaranByNIK(data.NIK);
                    const dup = result?.pendaftaran?.find(p => p.id !== (typeof _allPendaftaran !== 'undefined' ? _allPendaftaran[data.excludeIdx]?.id : undefined));
                    resolve(dup ? { success: false, message: 'NIK sudah terdaftar' } : { success: true, message: 'NIK tersedia' });
                    break;
                    
                case 'getSDMK':
                    result = await nhost.getSDMK();
                    if (typeof _allSDMK !== 'undefined') _allSDMK = g(result.sdmk);
                    resolve({ success: true, data: g(result.sdmk) });
                    break;
                    
                case 'tambahSDMK':
                    await nhost.createSDMK(data);
                    resolve({ success: true, message: 'Data SDMK berhasil ditambahkan' });
                    break;
                    
                case 'updateSDMK':
                    if (typeof _allSDMK !== 'undefined' && safeGet(_allSDMK, data.idx)) {
                        await nhost.updateSDMK(_allSDMK[data.idx].id, data.data);
                        resolve({ success: true, message: 'Data SDMK berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteSDMK':
                    if (typeof _allSDMK !== 'undefined' && safeGet(_allSDMK, data.idx)) {
                        await nhost.deleteSDMK(_allSDMK[data.idx].id);
                        resolve({ success: true, message: 'Data SDMK berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getSertifikat':
                    result = await nhost.getSertifikat();
                    if (typeof _allSertifikat !== 'undefined') _allSertifikat = g(result.sertifikat);
                    resolve({ success: true, data: g(result.sertifikat) });
                    break;
                    
                case 'tambahSertifikat':
                    await nhost.createSertifikat(data);
                    resolve({ success: true, message: 'Sertifikat berhasil ditambahkan' });
                    break;
                    
                case 'updateSertifikat':
                    if (typeof _allSertifikat !== 'undefined' && safeGet(_allSertifikat, data.idx)) {
                        await nhost.updateSertifikat(_allSertifikat[data.idx].id, data.data);
                        resolve({ success: true, message: 'Sertifikat berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteSertifikat':
                    if (typeof _allSertifikat !== 'undefined' && safeGet(_allSertifikat, data.idx)) {
                        await nhost.deleteSertifikat(_allSertifikat[data.idx].id);
                        resolve({ success: true, message: 'Sertifikat berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getMateri':
                    result = await nhost.getMateri();
                    if (typeof _allMateri !== 'undefined') _allMateri = g(result.materi);
                    resolve({ success: true, data: g(result.materi) });
                    break;
                    
                case 'tambahMateri':
                    await nhost.createMateri(data);
                    resolve({ success: true, message: 'Materi berhasil ditambahkan' });
                    break;
                    
                case 'updateMateri':
                    if (typeof _allMateri !== 'undefined' && safeGet(_allMateri, data.idx)) {
                        await nhost.updateMateri(_allMateri[data.idx].id, data.data);
                        resolve({ success: true, message: 'Materi berhasil diperbarui' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'deleteMateri':
                    if (typeof _allMateri !== 'undefined' && safeGet(_allMateri, data.idx)) {
                        await nhost.deleteMateri(_allMateri[data.idx].id);
                        resolve({ success: true, message: 'Materi berhasil dihapus' });
                    } else resolve({ success: false, message: 'Data tidak ditemukan' });
                    break;
                    
                case 'getDashboardData':
                    result = await nhost.getDashboardStats();
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
// INITIALIZATION LOG
// ==========================================

console.log('%c🚀 PAMUNGKAS + NHOST', 'color: #0D6EFD; font-size: 16px; font-weight: bold;');
console.log('%c✅ Client initialized', 'color: #10B981;');
console.log('%c📡 URL:', 'color: #6B7280;', NHOST_CONFIG.hasuraUrl);

if (ENV.isGitHubPages) {
    console.log('%c🌍 GitHub Pages Mode', 'color: #8B5CF6; font-weight: bold;');
    console.log('%c🔄 Using: JSONP + CORS Proxy', 'color: #F59E0B;');
} else {
    console.log('%c💻 Local/Server Mode', 'color: #10B981; font-weight: bold;');
}

if (NHOST_CONFIG.adminSecret === 'ISI_PASSWORD_ANDA_DISINI') {
    console.warn('%c⚠️ Admin Secret not set!', 'color: #F59E0B;');
} else {
    console.log('%c🔑 Auth: ✓', 'color: #10B981;');
}

// Connection test
async function testConnection() {
    console.log('\n%c🔍 Testing connection...', 'color: #3B82F6; font-weight: bold;');
    
    try {
        const result = await nhost.query('{ __typename }');
        console.log('%c✅ SUCCESS! Connected!', 'color: #10B981; font-weight: bold;');
        return true;
    } catch (e) {
        console.error('%c❌ FAILED!', 'color: #EF4444; font-weight: bold;', e.message);
        console.log('\n%cTroubleshooting:', 'color: #F59E0B; font-weight: bold;');
        console.log('1. Check internet connection');
        console.log('2. Verify Nhost project is running');
        console.log('3. Open URL directly:', NHOST_CONFIG.hasuraUrl);
        return false;
    }
}

// Auto test after 2 seconds
if (NHOST_CONFIG.debug) {
    setTimeout(testConnection, 2000);
    window.testConnection = testConnection;
}
