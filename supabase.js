/**
 * ============================================
 * PAMUNGKAS - Supabase Client Initialization
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. Inisialisasi Supabase client
 * 2. Koneksi ke Supabase menggunakan anon key
 * 3. Helper functions untuk operasi dasar
 * 
 * KEAMANAN:
 * - Hanya menggunakan ANON KEY (bukan service_role)
 * - Semua operasi data dilindungi oleh RLS (Row Level Security)
 * - Tidak ada akses langsung ke database tanpa autentikasi
 */

// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================

/**
 * Supabase Client Instance
 * @type {SupabaseClient|null}
 */
let supabaseClient = null;

/**
 * Inisialisasi Supabase Client
 * Harus dipanggil setelah config.js dimuat
 * 
 * @returns {SupabaseClient} Instance Supabase client
 * @throws {Error} Jika Supabase library tidak tersedia atau config tidak valid
 */
function initSupabase() {
    // Cek apakah Supabase JS library sudah dimuat
    if (typeof window.supabase === 'undefined' && typeof window.createClient === 'undefined') {
        console.error('❌ [PAMUNGKAS] Supabase JS library belum dimuat. Pastikan script tag sudah ditambahkan.');
        console.info('💡 Tambahkan ini di HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    // Cek konfigurasi
    if (!isConfigValid()) {
        console.error('❌ [PAMUNGKAS] Konfigurasi tidak valid. Periksa config.js');
        return null;
    }
    
    try {
        // Gunakan createClient dari Supabase JS v2
        const createClient = window.supabase?.createClient || window.createClient;
        
        supabaseClient = createClient(
            PAMUNGKAS_CONFIG.SUPABASE_URL,
            PAMUNGKAS_CONFIG.SUPABASE_ANON_KEY,
            {
                // Opsi auth
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage,
                    storageKey: PAMUNGKAS_CONFIG.SESSION_STORAGE_KEY
                },
                // Opsi global
                global: {
                    headers: {
                        'x-app-name': PAMUNGKAS_CONFIG.APP_NAME,
                        'x-app-version': PAMUNGKAS_CONFIG.APP_VERSION
                    }
                },
                // Opsi realtime (untuk fitur future)
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );
        
        debugLog('Supabase client initialized successfully', {
            url: PAMUNGKAS_CONFIG.SUPABASE_URL.replace(/(https:\/\/).*?(@.*)/, '$1***$2'),
            hasAnonKey: !!PAMUNGKAS_CONFIG.SUPABASE_ANON_KEY
        });
        
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ [PAMUNGKAS] Gagal inisialisasi Supabase:', error);
        return null;
    }
}

/**
 * Get Supabase Client Instance
 * Mengembalikan instance yang sudah diinisialisasi atau null
 * 
 * @returns {SupabaseClient|null}
 */
function getSupabase() {
    if (!supabaseClient) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}

// ==========================================
// DATABASE HELPER FUNCTIONS
// ==========================================
// Fungsi-fungsi ini akan digunakan di tahap berikutnya (PROMPT 02)
// Saat ini disediakan sebagai placeholder

/**
 * Fetch data dari tabel dengan error handling
 * 
 * @param {string} tableName - Nama tabel
 * @param {Object} options - Query options (select, filter, order, dll)
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
async function fetchData(tableName, options = {}) {
    const client = getSupabase();
    if (!client) {
        return { data: null, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        let query = client.from(tableName).select(options.select || '*');
        
        // Apply filters jika ada
        if (options.filter && Object.keys(options.filter).length > 0) {
            Object.entries(options.filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }
        
        // Apply order jika ada
        if (options.order) {
            query = query.order(options.order.column, { 
                ascending: options.order.ascending ?? false 
            });
        }
        
        // Apply limit jika ada
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        // Apply range untuk pagination
        if (options.range) {
            query = query.range(options.range.from, options.range.to);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return { data, error: null };
        
    } catch (error) {
        console.error(`[PAMUNGKAS] Error fetching from ${tableName}:`, error);
        return { data: null, error };
    }
}

/**
 * Insert data ke tabel
 * 
 * @param {string} tableName - Nama tabel
 * @param {Object|Array} records - Data yang akan diinsert
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function insertData(tableName, records) {
    const client = getSupabase();
    if (!client) {
        return { data: null, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        const { data, error } = await client
            .from(tableName)
            .insert(records)
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
        
    } catch (error) {
        console.error(`[PAMUNGKAS] Error inserting to ${tableName}:`, error);
        return { data: null, error };
    }
}

/**
 * Update data di tabel
 * 
 * @param {string} tableName - Nama tabel
 * @param {Object} updates - Data yang akan diupdate
 * @param {string} matchColumn - Kolom untuk matching
 * @param {*} matchValue - Nilai untuk matching
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function updateData(tableName, updates, matchColumn, matchValue) {
    const client = getSupabase();
    if (!client) {
        return { data: null, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        const { data, error } = await client
            .from(tableName)
            .update(updates)
            .eq(matchColumn, matchValue)
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
        
    } catch (error) {
        console.error(`[PAMUNGKAS] Error updating ${tableName}:`, error);
        return { data: null, error };
    }
}

/**
 * Delete data dari tabel
 * 
 * @param {string} tableName - Nama tabel
 * @param {string} matchColumn - Kolom untuk matching
 * @param {*} matchValue - Nilai untuk matching
 * @returns {Promise<{error: Error|null}>}
 */
async function deleteData(tableName, matchColumn, matchValue) {
    const client = getSupabase();
    if (!client) {
        return { error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        const { error } = await client
            .from(tableName)
            .delete()
            .eq(matchColumn, matchValue);
            
        if (error) throw error;
        
        return { error: null };
        
    } catch (error) {
        console.error(`[PAMUNGKAS] Error deleting from ${tableName}:`, error);
        return { error };
    }
}

// ==========================================
// REALTIME SUBSCRIPTIONS (Placeholder)
// ==========================================

/**
 * Subscribe ke perubahan realtime (akan digunakan di tahap berikutnya)
 * 
 * @param {string} tableName - Nama tabel
 * @param {string} event - Event type (INSERT, UPDATE, DELETE, *)
 * @param {Function} callback - Callback function
 * @returns {Subscription|null}
 */
function subscribeToTable(tableName, event = '*', callback) {
    const client = getSupabase();
    if (!client) {
        console.warn('[PAMUNGKAS] Cannot subscribe: Supabase client not available');
        return null;
    }
    
    try {
        const subscription = client
            .channel(`${tableName}_${event}_changes`)
            .on(
                'postgres_changes',
                { event, schema: 'public', table: tableName },
                callback
            )
            .subscribe();
            
        debugLog(`Subscribed to ${tableName} ${event} changes`);
        return subscription;
        
    } catch (error) {
        console.error(`[PAMUNGKAS] Error subscribing to ${tableName}:`, error);
        return null;
    }
}

// ==========================================
// STORAGE HELPER FUNCTIONS (Placeholder)
// ==========================================

/**
 * Upload file ke Supabase Storage (akan digunakan di tahap berikutnya)
 * 
 * @param {string} bucketName - Nama bucket
 * @param {string} path - Path file dalam bucket
 * @param {File|Blob} file - File yang akan diupload
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function uploadFile(bucketName, path, file) {
    const client = getSupabase();
    if (!client) {
        return { data: null, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        const { data, error } = await client.storage
            .from(bucketName)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) throw error;
        
        return { data, error: null };
        
    } catch (error) {
        console.error(`[PAMUNGKAS] Error uploading file:`, error);
        return { data: null, error };
    }
}

/**
 * Get public URL untuk file di Storage
 * 
 * @param {string} bucketName - Nama bucket
 * @param {string} path - Path file
 * @returns {string|null} Public URL atau null jika error
 */
function getPublicUrl(bucketName, path) {
    const client = getSupabase();
    if (!client) return null;
    
    try {
        const { data } = client.storage.from(bucketName).getPublicUrl(path);
        return data.publicUrl;
    } catch (error) {
        console.error('[PAMUNGKAS] Error getting public URL:', error);
        return null;
    }
}

// ==========================================
// HEALTH CHECK
// ==========================================

/**
 * Cek koneksi ke Supabase
 * 
 * @returns {Promise<boolean>} true jika terhubung, false jika tidak
 */
async function checkConnection() {
    const client = getSupabase();
    if (!client) return false;
    
    try {
        // Simple health check dengan mencoba ambil session
        const { data, error } = await client.auth.getSession();
        
        if (error) throw error;
        
        debugLog('Supabase connection successful', { hasSession: !!data.session });
        return true;
        
    } catch (error) {
        console.error('[PAMUNGKAS] Supabase connection failed:', error);
        return false;
    }
}

// ==========================================
// AUTO-INITIALIZATION
// ==========================================

// Inisialisasi Supabase saat file dimuat
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});

// Export untuk penggunaan di module lain
if (typeof window !== 'undefined') {
    window.PamungkasSupabase = {
        init: initSupabase,
        getClient: getSupabase,
        fetchData,
        insertData,
        updateData,
        deleteData,
        subscribeToTable,
        uploadFile,
        getPublicUrl,
        checkConnection
    };
}

debugLog('Supabase module loaded');
