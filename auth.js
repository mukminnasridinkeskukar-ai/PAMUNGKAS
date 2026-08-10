/**
 * ============================================
 * PAMUNGKAS - Authentication Module
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. Login / Logout
 * 2. Session management
 * 3. Password reset
 * 4. Protected route guard
 * 5. User role checking (placeholder)
 * 
 * KEAMANAN:
 * - Menggunakan Supabase Auth (bukan custom auth)
 * - Session disimpan di localStorage (managed by Supabase)
 * - Token refresh otomatis oleh Supabase client
 */

// ==========================================
// AUTH STATE MANAGEMENT
// ==========================================

/**
 * Current user session state
 * @type {Object|null}
 */
let currentUser = null;

/**
 * Auth state change listeners
 * @type {Array<Function>}
 */
const authStateListeners = [];

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChange(callback) {
    authStateListeners.push(callback);
    return () => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1) authStateListeners.splice(index, 1);
    };
}

/**
 * Notify all auth state listeners
 * @param {Object|null} user - Current user or null if logged out
 */
function notifyAuthStateChange(user) {
    currentUser = user;
    authStateListeners.forEach(listener => listener(user));
    debugLog('Auth state changed', { 
        isLoggedIn: !!user,
        email: user?.email || null
    });
}

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

/**
 * Login dengan email dan password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, error: string|null, user: Object|null}>}
 */
async function login(email, password) {
    const supabase = getSupabase();
    
    // Validasi input
    if (!email || !password) {
        return {
            success: false,
            error: 'Email dan password harus diisi',
            user: null
        };
    }
    
    // Validasi format email
    const emailRegex = PAMUNGKAS_CONFIG.VALIDATION.EMAIL.pattern;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            error: 'Format email tidak valid',
            user: null
        };
    }
    
    // Cek Supabase client
    if (!supabase) {
        return {
            success: false,
            error: 'Koneksi ke server tidak tersedia. Silakan coba lagi nanti.',
            user: null
        };
    }
    
    try {
        debugLog('Attempting login', { email });
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        
        if (error) throw error;
        
        if (data.user && data.session) {
            notifyAuthStateChange(data.user);
            
            debugLog('Login successful', { 
                userId: data.user.id,
                email: data.user.email
            });
            
            return {
                success: true,
                error: null,
                user: data.user
            };
        } else {
            throw new Error('Login gagal: Tidak ada data user dikembalikan');
        }
        
    } catch (error) {
        console.error('[PAMUNGKAS] Login error:', error);
        
        // Mapping error messages ke bahasa Indonesia
        let errorMessage = mapAuthError(error.message);
        
        return {
            success: false,
            error: errorMessage,
            user: null
        };
    }
}

/**
 * Logout dari sistem
 * 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function logout() {
    const supabase = getSupabase();
    
    if (!supabase) {
        // Force local logout jika Supabase tidak tersedia
        clearLocalSession();
        notifyAuthStateChange(null);
        redirectToLogin();
        return { success: null, error: null };
    }
    
    try {
        debugLog('Attempting logout');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        // Clear local state
        clearLocalSession();
        notifyAuthStateChange(null);
        
        debugLog('Logout successful');
        
        // Redirect ke halaman login
        redirectToLogin();
        
        return { success: true, error: null };
        
    } catch (error) {
        console.error('[PAMUNGKAS] Logout error:', error);
        
        // Tetap logout lokal jika ada error
        clearLocalSession();
        notifyAuthStateChange(null);
        redirectToLogin();
        
        return { success: true, error: null }; // Return success karena user tetap logged out
    }
}

/**
 * Register user baru (hanya jika fitur diaktifkan)
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Additional user metadata
 * @returns {Promise<{success: boolean, error: string|null, user: Object|null}>}
 */
async function register(email, password, metadata = {}) {
    // Cek apakah registrasi diizinkan
    if (!PAMUNGKAS_CONFIG.FEATURES.REGISTRATION) {
        return {
            success: false,
            error: 'Pendaftaran akun baru tidak tersedia. Silakan hubungi administrator.',
            user: null
        };
    }
    
    const supabase = getSupabase();
    if (!supabase) {
        return {
            success: false,
            error: 'Koneksi ke server tidak tersedia',
            user: null
        };
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: metadata
            }
        });
        
        if (error) throw error;
        
        debugLog('Registration successful', { userId: data.user?.id });
        
        return {
            success: true,
            error: null,
            user: data.user
        };
        
    } catch (error) {
        console.error('[PAMUNGKAS] Registration error:', error);
        return {
            success: false,
            error: mapAuthError(error.message),
            user: null
        };
    }
}

/**
 * Request password reset
 * 
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function requestPasswordReset(email) {
    const supabase = getSupabase();
    if (!supabase) {
        return {
            success: false,
            error: 'Koneksi ke server tidak tersedia'
        };
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        debugLog('Password reset requested', { email });
        
        return {
            success: true,
            error: null
        };
        
    } catch (error) {
        console.error('[PAMUNGKAS] Password reset error:', error);
        return {
            success: false,
            error: mapAuthError(error.message)
        };
    }
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Get current session
 * 
 * @returns {Promise<Object|null>} Session object atau null
 */
async function getSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            return session;
        }
        
        return null;
        
    } catch (error) {
        console.error('[PAMUNGKAS] Get session error:', error);
        return null;
    }
}

/**
 * Get current user
 * 
 * @returns {Promise<Object|null>} User object atau null
 */
async function getCurrentUser() {
    if (currentUser) return currentUser;
    
    const session = await getSession();
    return session?.user || null;
}

/**
 * Check if user is authenticated
 * 
 * @returns {Promise<boolean>}
 */
async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

/**
 * Clear local session data
 */
function clearLocalSession() {
    currentUser = null;
    // Note: Supabase manages its own session in localStorage
    // We only clear our app-specific state
}

// ==========================================
// ROUTE PROTECTION
// ==========================================

/**
 * Protect a route - redirect to login if not authenticated
 * Call this function on pages that require authentication
 * 
 * @returns {Promise<boolean>} true if authenticated, false if redirected
 */
async function requireAuth() {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
        debugLog('Access denied, redirecting to login');
        window.location.href = PAMUNGKAS_CONFIG.LOGIN_PAGE_URL + '?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }
    
    return true;
}

/**
 * Redirect away from login page if already authenticated
 * Call this on the login page
 * 
 * @returns {Promise<boolean>} false if redirected, true if should show login
 */
async function redirectIfAuthenticated() {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || PAMUNGKAS_CONFIG.LOGIN_REDIRECT_URL;
        debugLog('Already authenticated, redirecting to', redirectUrl);
        window.location.href = redirectUrl;
        return false;
    }
    
    return true;
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    window.location.href = PAMUNGKAS_CONFIG.LOGIN_PAGE_URL;
}

/**
 * Redirect after successful login
 */
function redirectToDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || PAMUNGKAS_CONFIG.LOGIN_REDIRECT_URL;
    window.location.href = redirectUrl;
}

// ==========================================
// USER ROLE & PERMISSIONS (Placeholder)
// ==========================================

/**
 * Get user role from metadata (akan diimplementasikan di PROMPT 02)
 * 
 * @param {Object} user - User object
 * @returns {string} User role
 */
function getUserRole(user) {
    // Placeholder - akan mengambil dari tabel users/roles
    return user?.user_metadata?.role || PAMUNGKAS_CONFIG.ROLES.VIEWER;
}

/**
 * Check if user has required role (placeholder)
 * 
 * @param {string|string[]} requiredRoles - Role(s) yang dibutuhkan
 * @returns {Promise<boolean>}
 */
async function hasRole(requiredRoles) {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const userRole = getUserRole(user);
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return roles.includes(userRole);
}

// ==========================================
// ERROR MAPPING
// ==========================================

/**
 * Map Supabase auth errors to Indonesian messages
 * 
 * @param {string} errorMessage - Original error message
 * @returns {string} Indonesian error message
 */
function mapAuthError(errorMessage) {
    const errorMap = {
        'Invalid login credentials': 'Email atau password salah',
        'Email not confirmed': 'Email belum diverifikasi. Silakan cek inbox Anda.',
        'Invalid email': 'Format email tidak valid',
        'Password should be at least 6 characters': 'Password minimal 6 karakter',
        'User already registered': 'Email sudah terdaftar. Gunakan email lain.',
        'Too many requests': 'Terlalu banyak percobaan. Silakan coba lagi beberapa saat.',
        'Network request failed': 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
        'Session not found': 'Sesi tidak ditemukan. Silakan login kembali.'
    };
    
    // Cek exact match
    if (errorMap[errorMessage]) {
        return errorMap[errorMessage];
    }
    
    // Cek partial match
    for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    // Default message
    return `Terjadi kesalahan: ${errorMessage}`;
}

// ==========================================
// UI HELPERS FOR AUTH
// ==========================================

/**
 * Show error message on login form
 * 
 * @param {string} message - Error message to display
 */
function showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    const messageEl = document.getElementById('errorMessage');
    
    if (errorEl && messageEl) {
        messageEl.textContent = message;
        errorEl.style.display = 'flex';
        
        // Auto hide setelah 5 detik
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

/**
 * Hide error message on login form
 */
function hideLoginError() {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Show success message on login form
 * 
 * @param {string} message - Success message to display
 */
function showLoginSuccess(message) {
    const successEl = document.getElementById('loginSuccess');
    const messageEl = document.getElementById('successMessage');
    
    if (successEl && messageEl) {
        messageEl.textContent = message;
        successEl.style.display = 'flex';
    }
}

/**
 * Set button loading state
 * 
 * @param {boolean} isLoading - Loading state
 */
function setLoginButtonLoading(isLoading) {
    const btn = document.getElementById('loginBtn');
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    if (isLoading) {
        btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-flex';
    } else {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

// ==========================================
// AUTH STATE LISTENER SETUP
// ==========================================

/**
 * Setup Supabase auth state listener
 * Dipanggil saat DOM ready
 */
function setupAuthListener() {
    const supabase = getSupabase();
    if (!supabase) return;
    
    supabase.auth.onAuthStateChange((event, session) => {
        debugLog('Auth state event:', event);
        
        switch (event) {
            case 'SIGNED_IN':
                notifyAuthStateChange(session?.user || null);
                break;
            case 'SIGNED_OUT':
                clearLocalSession();
                notifyAuthStateChange(null);
                break;
            case 'TOKEN_REFRESHED':
                debugLog('Token refreshed');
                break;
            case 'USER_UPDATED':
                notifyAuthStateChange(session?.user || null);
                break;
            default:
                debugLog('Unhandled auth event:', event);
        }
    });
}

// ==========================================
// INITIALIZATION
// ============================================

// Setup auth listener saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListener();
    
    // Jika di halaman login, cek redirect parameter
    if (window.location.pathname.includes('login.html')) {
        redirectIfAuthenticated();
    }
});

// Export untuk penggunaan global
if (typeof window !== 'undefined') {
    window.PamungkasAuth = {
        login,
        logout,
        register,
        requestPasswordReset,
        getSession,
        getCurrentUser,
        isAuthenticated,
        requireAuth,
        redirectIfAuthenticated,
        hasRole,
        getUserRole,
        onAuthStateChange,
        showLoginError,
        hideLoginError,
        showLoginSuccess,
        setLoginButtonLoading
    };
}

debugLog('Auth module loaded');
