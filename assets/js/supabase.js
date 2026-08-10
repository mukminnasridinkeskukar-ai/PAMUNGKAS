/**
 * ============================================
 * PAMUNGKAS - Supabase Client & Profile/Role Helpers
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. Inisialisasi Supabase client (hanya anon key!)
 * 2. Profile management functions
 * 3. Role checking functions
 * 4. User info retrieval
 * 
 * KEAMANAN:
 * - Hanya menggunakan ANON KEY (bukan service_role)
 * - Semua operasi dilindungi oleh RLS
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
 * Current user state (cache)
 */
let currentUserState = {
    user: null,
    profile: null,
    roles: [],
    primaryRole: null,
    loadedAt: null
};

/**
 * Inisialisasi Supabase Client
 * Harus dipanggil setelah config.js dimuat
 * 
 * @returns {SupabaseClient} Instance Supabase client
 */
function initSupabase() {
    // Cek apakah Supabase JS library sudah dimuat
    if (typeof window.supabase === 'undefined' && typeof window.createClient === 'undefined') {
        errorLog('Supabase JS library belum dimuat');
        console.info('💡 Tambahkan di HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    // Cek konfigurasi
    if (!isConfigValid()) {
        errorLog('Konfigurasi tidak valid. Periksa config.js');
        return null;
    }
    
    try {
        const createClient = window.supabase?.createClient || window.createClient;
        
        supabaseClient = createClient(
            PAMUNGKAS_CONFIG.SUPABASE_URL,
            PAMUNGKAS_CONFIG.SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage,
                    storageKey: PAMUNGKAS_CONFIG.SESSION_STORAGE_KEY
                },
                global: {
                    headers: {
                        'x-app-name': PAMUNGKAS_CONFIG.APP_NAME,
                        'x-app-version': PAMUNGKAS_CONFIG.APP_VERSION
                    }
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );
        
        debugLog('Supabase client initialized', {
            url: maskUrl(PAMUNGKAS_CONFIG.SUPABASE_URL)
        });
        
        return supabaseClient;
        
    } catch (error) {
        errorLog('Gagal inisialisasi Supabase', error);
        return null;
    }
}

/**
 * Mask URL untuk logging (sembunyikan sensitif info)
 * @param {string} url - URL yang akan di-mask
 * @returns {string}
 */
function maskUrl(url) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}/***`;
    } catch {
        return '***';
    }
}

/**
 * Get Supabase Client Instance
 * @returns {SupabaseClient|null}
 */
function getSupabase() {
    if (!supabaseClient) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}

// ==========================================
// PROFILE FUNCTIONS
// ==========================================

/**
 * Ambil data profile user berdasarkan user_id (auth.users.id)
 * 
 * @param {string|UUID} userId - ID dari auth.users
 * @returns {Promise<{profile: Object|null, error: Error|null}>}
 */
async function fetchProfile(userId) {
    const client = getSupabase();
    if (!client) {
        return { profile: null, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFILES)
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error) throw error;
        
        debugLog('Profile fetched', { userId, hasProfile: !!data });
        return { profile: data, error: null };
        
    } catch (error) {
        // Jika profile tidak ditemukan, buat otomatis
        if (error.code === 'PGRST116') {
            debugLog('Profile not found, creating...', { userId });
            return await createDefaultProfile(userId);
        }
        
        errorLog('Error fetching profile', error);
        return { profile: null, error };
    }
}

/**
 * Buat default profile untuk user baru
 * 
 * @param {string|UUID} userId - ID dari auth.users
 * @returns {Promise<{profile: Object|null, error: Error|null}>}
 */
async function createDefaultProfile(userId) {
    const client = getSupabase();
    if (!client) {
        return { profile: null, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        // Ambil info user dari auth
        const { data: { user } } = await client.auth.getUser();
        
        if (!user) throw new Error('User tidak ditemukan');
        
        // Insert profile baru
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFILES)
            .insert({
                user_id: userId,
                full_name: user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 'User',
                email: user.email,
                is_active: true
            })
            .select()
            .single();
            
        if (error) throw error;
        
        // Assign default role (OPERATOR)
        await assignRoleToUser(data.id, PAMUNGKAS_CONFIG.DEFAULT_ROLE);
        
        debugLog('Default profile created', { profileId: data.id });
        return { profile: data, error: null };
        
    } catch (error) {
        errorLog('Error creating default profile', error);
        return { profile: null, error };
    }
}

/**
 * Update profile user
 * 
 * @param {Object} updates - Data yang akan diupdate
 * @returns {Promise<{profile: Object|null, error: Error|null}>}
 */
async function updateProfile(updates) {
    const client = getSupabase();
    const userId = getCurrentAuthUserId();
    
    if (!client || !userId) {
        return { profile: null, error: new Error('Tidak terautentikasi') };
    }
    
    try {
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFILES)
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();
            
        if (error) throw error;
        
        // Clear cache
        clearProfileCache();
        
        debugLog('Profile updated', updates);
        return { profile: data, error: null };
        
    } catch (error) {
        errorLog('Error updating profile', error);
        return { profile: null, error };
    }
}

/**
 * Cek apakah user aktif
 * 
 * @param {string|UUID} userId - User ID
 * @returns {Promise<boolean>}
 */
async function isUserActive(userId) {
    const client = getSupabase();
    if (!client) return false;
    
    try {
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFILES)
            .select('is_active')
            .eq('user_id', userId)
            .single();
            
        if (error || !data) return false;
        
        return data.is_active === true;
        
    } catch (error) {
        errorLog('Error checking user active status', error);
        return false;
    }
}

// ==========================================
// ROLE FUNCTIONS
// ============================================

/**
 * Ambil semua roles user dari tabel user_roles
 * 
 * @param {string|UUID} profileId - ID dari tabel profiles
 * @returns {Promise<{roles: Array, error: Error|null}>}
 */
async function fetchUserRoles(profileId) {
    const client = getSupabase();
    if (!client) {
        return { roles: [], error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.USER_ROLES)
            .select(`
                role_id,
                roles (
                    id,
                    name,
                    display_name,
                    level,
                    description
                )
            `)
            .eq('user_id', profileId);
            
        if (error) throw error;
        
        // Extract roles array
        const roles = (data || []).map(ur => ({
            ...ur.roles,
            assigned_at: ur.created_at
        }));
        
        // Sort by level (lowest first = most powerful)
        roles.sort((a, b) => a.level - b.level);
        
        debugLog('User roles fetched', { count: roles.length, roles: roles.map(r => r.name) });
        return { roles, error: null };
        
    } catch (error) {
        errorLog('Error fetching user roles', error);
        return { roles: [], error };
    }
}

/**
 * Dapatkan primary role (paling berkuasa / level terendah)
 * 
 * @param {Array} roles - Array of roles
 * @returns {Object|null}
 */
function getPrimaryRole(roles) {
    if (!roles || roles.length === 0) return null;
    
    // Role dengan level terendah adalah paling berkuasa
    return roles.reduce((primary, current) => {
        return current.level < primary.level ? current : primary;
    }, roles[0]);
}

/**
 * Cek apakah user memiliki role tertentu
 * 
 * @param {string} roleName - Nama role (SUPER_ADMIN, ADMIN, dll)
 * @returns {Promise<boolean>}
 */
async function hasUserRole(roleName) {
    const state = getUserState();
    
    // Jika roles sudah di-load, cek dari cache
    if (state.roles && state.roles.length > 0) {
        return state.roles.some(r => r.name === roleName);
    }
    
    // Jika belum, fetch dari database
    if (state.profile) {
        const { roles } = await fetchUserRoles(state.profile.id);
        return roles.some(r => r.name === roleName);
    }
    
    return false;
}

/**
 * Cek apakah user adalah admin (SUPER_ADMIN atau ADMIN)
 * 
 * @returns {Promise<boolean>}
 */
async function isAdmin() {
    const adminRoles = PAMUNGKAS_CONFIG.ADMIN_ROLES;
    
    for (const role of adminRoles) {
        if (await hasUserRole(role)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Cek apakah user adalah SUPER_ADMIN
 * 
 * @returns {Promise<boolean>}
 */
async function isSuperAdmin() {
    return await hasUserRole('SUPER_ADMIN');
}

/**
 * Assign role ke user (hanya admin)
 * 
 * @param {string|UUID} profileId - ID profile
 * @param {string} roleName - Nama role
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
async function assignRoleToUser(profileId, roleName) {
    const client = getSupabase();
    if (!client) {
        return { success: false, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        // Cari role ID
        const { data: roleData, error: roleError } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.ROLES)
            .select('id')
            .eq('name', roleName)
            .single();
            
        if (roleError || !roleData) {
            throw new Error(`Role ${roleName} tidak ditemukan`);
        }
        
        // Insert user_role
        const { error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.USER_ROLES)
            .insert({
                user_id: profileId,
                role_id: roleData.id
            });
            
        if (error) {
            // Ignore duplicate key error
            if (error.code === '23505') {
                return { success: true, error: null }; // Already exists
            }
            throw error;
        }
        
        debugLog('Role assigned', { profileId, roleName });
        return { success: true, error: null };
        
    } catch (error) {
        errorLog('Error assigning role', error);
        return { success: false, error };
    }
}

/**
 * Remove role dari user (hanya admin)
 * 
 * @param {string|UUID} profileId - ID profile
 * @param {string} roleName - Nama role
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
async function removeRoleFromUser(profileId, roleName) {
    const client = getSupabase();
    if (!client) {
        return { success: false, error: new Error('Supabase client tidak tersedia') };
    }
    
    try {
        // Cari role ID
        const { data: roleData, error: roleError } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.ROLES)
            .select('id')
            .eq('name', roleName)
            .single();
            
        if (roleError || !roleData) {
            throw new Error(`Role ${roleName} tidak ditemukan`);
        }
        
        // Delete user_role
        const { error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.USER_ROLES)
            .delete()
            .eq('user_id', profileId)
            .eq('role_id', roleData.id);
            
        if (error) throw error;
        
        debugLog('Role removed', { profileId, roleName });
        return { success: true, error: null };
        
    } catch (error) {
        errorLog('Error removing role', error);
        return { success: false, error };
    }
}

// ==========================================
// USER INFO (COMBINED)
// ============================================

/**
 * Ambil lengkap info user (profile + roles)
 * Menggunakan view v_user_info jika tersedia
 * 
 * @returns {Promise<{userInfo: Object|null, error: Error|null}>}
 */
async function fetchUserInfo() {
    const client = getSupabase();
    const userId = getCurrentAuthUserId();
    
    if (!client || !userId) {
        return { userInfo: null, error: new Error('Tidak terautentikasi') };
    }
    
    try {
        // Coba ambil dari view v_user_info
        let { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.V_USER_INFO)
            .select('*')
            .eq('user_id', userId)
            .single();
        
        // Jika view tidak ada, fallback ke manual query
        if (error && error.code === '42P01') {
            debugLog('View not found, using manual query');
            return await fetchUserInfoManual(userId);
        }
        
        if (error) throw error;
        
        return { userInfo: data, error: null };
        
    } catch (error) {
        errorLog('Error fetching user info', error);
        return { userInfo: null, error };
    }
}

/**
 * Fallback: Fetch user info manually tanpa view
 */
async function fetchUserInfoManual(userId) {
    const client = getSupabase();
    
    // Fetch profile
    const { profile } = await fetchProfile(userId);
    if (!profile) {
        return { userInfo: null, error: new Error('Profile tidak ditemukan') };
    }
    
    // Fetch roles
    const { roles } = await fetchUserRoles(profile.id);
    const primaryRole = getPrimaryRole(roles);
    
    return {
        userInfo: {
            ...profile,
            primary_role_name: primaryRole?.name,
            primary_role_display: primaryRole?.display_name,
            all_roles: roles.map(r => r.name),
            roles_info: roles
        },
        error: null
    };
}

/**
 * Load dan cache user state (profile + roles)
 * Dipanggil saat login berhasil atau page load
 * 
 * @returns {Promise<Object>} User state
 */
async function loadUserState() {
    const userId = getCurrentAuthUserId();
    
    if (!userId) {
        clearUserState();
        return currentUserState;
    }
    
    try {
        // Check cache validity
        if (currentUserState.loadedAt && isCacheValid()) {
            debugLog('Using cached user state');
            return currentUserState;
        }
        
        // Fetch fresh data
        const { userInfo, error } = await fetchUserInfo();
        
        if (error) throw error;
        
        // Update state
        currentUserState.user = await getCurrentUser(); // from auth
        currentUserState.profile = userInfo;
        currentUserState.roles = userInfo?.roles_info || [];
        currentUserState.primaryRole = getPrimaryRole(currentUserState.roles);
        currentUserState.loadedAt = Date.now();
        
        // Save to localStorage cache
        saveProfileCache(currentUserState);
        
        debugLog('User state loaded', {
            name: userInfo?.full_name,
            primaryRole: currentUserState.primaryRole?.name,
            rolesCount: currentUserState.roles.length
        });
        
        return currentUserState;
        
    } catch (error) {
        errorLog('Error loading user state', error);
        clearUserState();
        return currentUserState;
    }
}

/**
 * Get current user state
 * @returns {Object}
 */
function getUserState() {
    return currentUserState;
}

/**
 * Clear user state
 */
function clearUserState() {
    currentUserState = {
        user: null,
        profile: null,
        roles: [],
        primaryRole: null,
        loadedAt: null
    };
    clearProfileCache();
}

// ==========================================
// CACHE MANAGEMENT
// ============================================

/**
 * Cek apakah cache masih valid
 * @returns {boolean}
 */
function isCacheValid() {
    if (!currentUserState.loadedAt) return false;
    
    const age = Date.now() - currentUserState.loadedAt;
    return age < PAMUNGKAS_CONFIG.PROFILE_CACHE_DURATION;
}

/**
 * Save profile cache to localStorage
 * @param {Object} state - User state to cache
 */
function saveProfileCache(state) {
    try {
        const cacheData = {
            ...state,
            savedAt: Date.now(),
            version: PAMUNGKAS_CONFIG.APP_VERSION
        };
        localStorage.setItem(
            PAMUNGKAS_CONFIG.PROFILE_CACHE_KEY, 
            JSON.stringify(cacheData)
        );
    } catch (e) {
        warnLog('Failed to save profile cache', e);
    }
}

/**
 * Load profile cache from localStorage
 * @returns {Object|null}
 */
function loadProfileCache() {
    try {
        const cached = localStorage.getItem(PAMUNGKAS_CONFIG.PROFILE_CACHE_KEY);
        if (!cached) return null;
        
        const parsed = JSON.parse(cached);
        
        // Validate cache
        if (!parsed.savedAt || parsed.version !== PAMUNGKAS_CONFIG.APP_VERSION) {
            return null;
        }
        
        // Check expiry
        const age = Date.now() - parsed.savedAt;
        if (age > PAMUNGKAS_CONFIG.PROFILE_CACHE_DURATION) {
            return null;
        }
        
        return parsed;
    } catch (e) {
        return null;
    }
}

/**
 * Clear profile cache
 */
function clearProfileCache() {
    try {
        localStorage.removeItem(PAMUNGKAS_CONFIG.PROFILE_CACHE_KEY);
    } catch (e) {
        // Ignore
    }
}

// ==========================================
// AUTH HELPERS (wrappers for convenience)
// ============================================

/**
 * Get current authenticated user ID from Supabase Auth
 * @returns {string|null}
 */
function getCurrentAuthUserId() {
    // Try from state first
    if (currentUserState.user?.id) {
        return currentUserState.user.id;
    }
    
    // This will be populated by auth module after login
    return null; 
}

/**
 * Get current user object from Supabase Auth
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
    const client = getSupabase();
    if (!client) return null;
    
    try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        errorLog('Error getting current user', error);
        return null;
    }
}

/**
 * Get current session
 * @returns {Promise<Object|null>}
 */
async function getSession() {
    const client = getSupabase();
    if (!client) return null;
    
    try {
        const { data: { session }, error } = await client.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        errorLog('Error getting session', error);
        return null;
    }
}

/**
 * Check connection to Supabase
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
    const client = getSupabase();
    if (!client) return false;
    
    try {
        const { data, error } = await client.auth.getSession();
        return !error;
    } catch (error) {
        return false;
    }
}

// ==========================================
// UTILITY LOGGING
// ============================================

function warnLog(message, data) {
    console.warn(`⚠️ [PAMUNGKAS] ${message}`, data || '');
}

// ==========================================
// AUTO-INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});

// Export untuk penggunaan global
if (typeof window !== 'undefined') {
    window.PamungkasSupabase = {
        init: initSupabase,
        getClient: getSupabase,
        // Profile functions
        fetchProfile,
        updateProfile,
        isUserActive,
        // Role functions
        fetchUserRoles,
        getPrimaryRole,
        hasUserRole,
        isAdmin,
        isSuperAdmin,
        assignRoleToUser,
        removeRoleFromUser,
        // User info
        fetchUserInfo,
        loadUserState,
        getUserState,
        clearUserState,
        // Auth helpers
        getCurrentUser,
        getSession,
        checkConnection
    };
}

debugLog('Supabase module loaded (with Profile & Role support)');
