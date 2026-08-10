/**
 * ============================================
 * PAMUNGKAS - Authentication Module
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. Login / Logout dengan Supabase Auth
 * 2. Session management & auto-restore
 * 3. Route protection (redirect if not authenticated)
 * 4. Password reset via email
 * 5. User active status checking
 * 6. Integration: Auth → Profile → Roles → Dashboard
 * 
 * FLOW:
 * login.html → Supabase Auth → profiles → user_roles → dashboard.html
 */

// ==========================================
// AUTH STATE MANAGEMENT
// ==========================================

/**
 * Current authentication state
 */
const AuthState = {
    isAuthenticated: false,
    isLoading: true, // Loading state saat cek session
    user: null,
    profile: null,
    roles: [],
    primaryRole: null,
    error: null
};

/**
 * Auth event listeners
 * @type {Map<string, Function[]>}
 */
const authListeners = {
    'login': [],
    'logout': [],
    'sessionRestored': [],
    'error': []
};

/**
 * Subscribe to auth events
 * @param {string} event - Event name (login, logout, sessionRestored, error)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
function onAuthEvent(event, callback) {
    if (authListeners[event]) {
        authListeners[event].push(callback);
        return () => {
            const index = authListeners[event].indexOf(callback);
            if (index > -1) authListeners[event].splice(index, 1);
        };
    }
    return () => {};
}

/**
 * Emit auth event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
function emitAuthEvent(event, data) {
    debugLog(`Auth event: ${event}`, data);
    
    if (authListeners[event]) {
        authListeners[event].forEach(listener => {
            try {
                listener(data);
            } catch (e) {
                errorLog('Error in auth listener', e);
            }
        });
    }
}

// ==========================================
// LOGIN FUNCTION
// ============================================

/**
 * Login dengan email dan password menggunakan Supabase Auth
 * 
 * Flow:
 * 1. Validate input
 * 2. Call Supabase signInWithPassword
 * 3. Check user active status in profiles table
 * 4. Load user profile and roles
 * 5. Update last_login_at
 * 6. Emit login event
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, error: string|null, user: Object|null}>}
 */
async function login(email, password) {
    const supabase = getSupabase();
    
    // Reset error
    AuthState.error = null;
    
    // ==========================================
    // STEP 1: Validate Input
    // ==========================================
    
    const validationError = validateLoginInput(email, password);
    if (validationError) {
        return { success: false, error: validationError, user: null };
    }
    
    // Check Supabase client
    if (!supabase) {
        return { 
            success: false, 
            error: 'Koneksi ke server tidak tersedia. Silakan coba lagi nanti.', 
            user: null 
        };
    }
    
    try {
        debugLog('Attempting login', { email });
        
        // ==========================================
        // STEP 2: Authenticate with Supabase Auth
        // ==========================================
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
        });
        
        if (authError) {
            throw mapSupabaseError(authError);
        }
        
        if (!authData.user || !authData.session) {
            throw new Error('Login gagal: Data autentikasi tidak lengkap');
        }
        
        const user = authData.user;
        debugLog('Authentication successful', { userId: user.id, email: user.email });
        
        // ==========================================
        // STEP 3: Check User Active Status
        // ==========================================
        
        const isActive = await isUserActive(user.id);
        
        if (isActive === false) {
            // User exists but is deactivated - logout immediately
            await supabase.auth.signOut();
            
            throw new Error(
                'Akun Anda telah dinonaktifkan. ' +
                'Silakan hubungi administrator untuk mengaktifkan kembali.'
            );
        }
        
        // ==========================================
        // STEP 4: Load Profile & Roles
        // ==========================================
        
        await loadUserState();
        const userState = getUserState();
        
        // Update AuthState
        updateAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: user,
            profile: userState.profile,
            roles: userState.roles,
            primaryRole: userState.primaryRole
        });
        
        // ==========================================
        // STEP 5: Update Last Login Timestamp
        // ==========================================
        
        try {
            // Call RPC function to update last_login_at
            await supabase.rpc('update_last_login', { p_user_id: user.id });
        } catch (e) {
            // Non-critical error, don't fail login
            warnLog('Could not update last_login_at', e);
        }
        
        // ==========================================
        // STEP 6: Success!
        // ==========================================
        
        emitAuthEvent('login', { 
            user, 
            profile: userState.profile,
            primaryRole: userState.primaryRole 
        });
        
        debugLog('Login complete', {
            name: userState.profile?.full_name,
            role: userState.primaryRole?.name
        });
        
        return {
            success: true,
            error: null,
            user: {
                id: user.id,
                email: user.email,
                ...userState.profile,
                primaryRole: userState.primaryRole
            }
        };
        
    } catch (error) {
        errorLog('Login failed', error);
        
        const errorMessage = error.message || 'Terjadi kesalahan saat login';
        AuthState.error = errorMessage;
        
        emitAuthEvent('error', { message: errorMessage, type: 'login' });
        
        return { success: false, error: errorMessage, user: null };
    }
}

/**
 * Validate login input
 * @param {string} email 
 * @param {string} password 
 * @returns {string|null} Error message or null
 */
function validateLoginInput(email, password) {
    if (!email || !email.trim()) {
        return 'Email harus diisi';
    }
    
    if (!password) {
        return 'Password harus diisi';
    }
    
    // Email format validation
    const emailRegex = PAMUNGKAS_CONFIG.VALIDATION.EMAIL.pattern;
    if (!emailRegex.test(email.trim())) {
        return 'Format email tidak valid';
    }
    
    // Password minimum length
    if (password.length < PAMUNGKAS_CONFIG.VALIDATION.PASSWORD.minLength) {
        return `Password minimal ${PAMUNGKAS_CONFIG.VALIDATION.PASSWORD.minLength} karakter`;
    }
    
    return null;
}

// ==========================================
// LOGOUT FUNCTION
// ============================================

/**
 * Logout dari sistem
 * 
 * Flow:
 * 1. Call Supabase signOut
 * 2. Clear local state
 * 3. Clear cache
 * 4. Emit logout event
 * 5. Redirect to login page
 * 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function logout() {
    const supabase = getSupabase();
    
    try {
        debugLog('Attempting logout');
        
        // ==========================================
        // STEP 1: Sign out from Supabase Auth
        // ==========================================
        
        if (supabase) {
            const { error } = await supabase.auth.signOut();
            
            if (error && !error.message?.includes('Session not found')) {
                throw error;
            }
        }
        
        // ==========================================
        // STEP 2-4: Cleanup & Events
        // ==========================================
        
        // Save current user info for event
        const previousUser = AuthState.user;
        const previousProfile = AuthState.profile;
        
        // Clear all state
        clearUserState();
        clearProfileCache();
        
        // Reset AuthState
        updateAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            profile: null,
            roles: [],
            primaryRole: null,
            error: null
        });
        
        // Emit logout event
        emitAuthEvent('logout', { 
            previousUser, 
            previousProfile 
        });
        
        debugLog('Logout successful');
        
        // ==========================================
        // STEP 5: Redirect to Login
        // ==========================================
        
        redirectTo(PAMUNGKAS_CONFIG.LOGOUT_REDIRECT_URL);
        
        return { success: true, error: null };
        
    } catch (error) {
        errorLog('Logout error', error);
        
        // Force cleanup even on error
        clearUserState();
        clearProfileCache();
        
        redirectTo(PAMUNGKAS_CONFIG.LOGOUT_REDIRECT_URL);
        
        return { success: true, error: null }; // Return success because user is logged out
    }
}

// ==========================================
// SESSION MANAGEMENT
// ============================================

/**
 * Initialize authentication system
 * Dipanggil saat DOM ready
 * Cek existing session dan restore state
 */
async function initAuth() {
    debugLog('Initializing auth system...');
    
    updateAuthState({ isLoading: true });
    
    const supabase = getSupabase();
    if (!supabase) {
        debugLog('Supabase not available, skipping auth init');
        updateAuthState({ isLoading: false });
        return;
    }
    
    try {
        // ==========================================
        // CHECK EXISTING SESSION
        // ==========================================
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session || !session.user) {
            // No valid session
            debugLog('No existing session found');
            updateAuthState({ 
                isAuthenticated: false, 
                isLoading: false 
            });
            return;
        }
        
        debugLog('Existing session found', { 
            userId: session.user.id, 
            email: session.user.email 
        });
        
        // ==========================================
        // CHECK USER ACTIVE STATUS
        // ==========================================
        
        const isActive = await isUserActive(session.user.id);
        
        if (isActive === false) {
            debugLog('User is deactivated, signing out');
            await supabase.auth.signOut();
            updateAuthState({ 
                isAuthenticated: false, 
                isLoading: false,
                error: 'Akun Anda telah dinonaktifkan'
            });
            return;
        }
        
        // ==========================================
        // LOAD USER STATE (PROFILE + ROLES)
        // ==========================================
        
        await loadUserState();
        const userState = getUserState();
        
        // Update AuthState with loaded data
        updateAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: session.user,
            profile: userState.profile,
            roles: userState.roles,
            primaryRole: userState.primaryRole
        });
        
        // Emit session restored event
        emitAuthEvent('sessionRestored', {
            user: session.user,
            profile: userState.profile,
            primaryRole: userState.primaryRole
        });
        
        debugLog('Session restored successfully', {
            name: userState.profile?.full_name,
            role: userState.primaryRole?.name
        });
        
    } catch (error) {
        errorLog('Auth initialization error', error);
        
        updateAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: error.message
        });
        
        emitAuthEvent('error', { 
            message: error.message, 
            type: 'init' 
        });
    }
}

/**
 * Setup Supabase auth state change listener
 * Listen for real-time auth changes (e.g., tab sync)
 */
function setupAuthListener() {
    const supabase = getSupabase();
    if (!supabase) return;
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        debugLog(`Auth state change event: ${event}`);
        
        switch (event) {
            case 'SIGNED_IN':
                // New sign in detected (could be from another tab)
                if (session?.user) {
                    const isActive = await isUserActive(session.user.id);
                    
                    if (isActive === false) {
                        await supabase.auth.signOut();
                        return;
                    }
                    
                    await loadUserState();
                    const state = getUserState();
                    
                    updateAuthState({
                        isAuthenticated: true,
                        user: session.user,
                        profile: state.profile,
                        roles: state.roles,
                        primaryRole: state.primaryRole
                    });
                    
                    emitAuthEvent('login', { user: session.user, profile: state.profile });
                }
                break;
                
            case 'SIGNED_OUT':
                clearUserState();
                updateAuthState({
                    isAuthenticated: false,
                    user: null,
                    profile: null,
                    roles: [],
                    primaryRole: null
                });
                emitAuthEvent('logout', {});
                break;
                
            case 'TOKEN_REFRESHED':
                debugLog('Token refreshed successfully');
                break;
                
            case 'USER_UPDATED':
                // Reload profile when user metadata changes
                if (AuthState.isAuthenticated) {
                    await loadUserState();
                    const state = getUserState();
                    updateAuthState({
                        profile: state.profile,
                        roles: state.roles,
                        primaryRole: state.primaryRole
                    });
                }
                break;
                
            default:
                debugLog(`Unhandled auth event: ${event}`);
        }
    });
}

// ==========================================
// ROUTE PROTECTION
// ============================================

/**
 * Protect a route - redirect to login if not authenticated
 * Call this on pages that require authentication
 * 
 * @param {Object} options - Protection options
 * @param {string[]} [options.allowedRoles] - Roles that can access this page
 * @returns {Promise<boolean>} true if access granted, false if redirected
 */
async function requireAuth(options = {}) {
    // Wait for auth initialization
    while (AuthState.isLoading) {
        await sleep(100);
    }
    
    // Check authentication
    if (!AuthState.isAuthenticated) {
        debugLog('Access denied: Not authenticated');
        
        const currentPath = window.location.pathname + window.location.search;
        redirectTo(`${PAMUNGKAS_CONFIG.LOGIN_PAGE_URL}?redirect=${encodeURIComponent(currentPath)}`);
        
        return false;
    }
    
    // Check role-based access (if specified)
    if (options.allowedRoles && options.allowedRoles.length > 0) {
        const hasRequiredRole = checkUserRoleAccess(options.allowedRoles);
        
        if (!hasRequiredRole) {
            debugLog('Access denied: Insufficient permissions');
            
            // Could redirect to "access denied" page or show error
            showAccessDeniedError(options.allowedRoles);
            return false;
        }
    }
    
    return true;
}

/**
 * Check if current user has any of the required roles
 * @param {string[]} allowedRoles - Array of allowed role names
 * @returns {boolean}
 */
function checkUserRoleAccess(allowedRoles) {
    if (!AuthState.roles || AuthState.roles.length === 0) {
        return false;
    }
    
    return AuthState.roles.some(role => 
        allowedRoles.includes(role.name)
    );
}

/**
 * Redirect away from login page if already authenticated
 * Call this on the login page
 * 
 * @returns {Promise<boolean>} false if redirected, true if should show login
 */
async function redirectIfAuthenticated() {
    // Wait for auth initialization
    while (AuthState.isLoading) {
        await sleep(100);
    }
    
    if (AuthState.isAuthenticated) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || PAMUNGKAS_CONFIG.LOGIN_REDIRECT_URL;
        
        debugLog('Already authenticated, redirecting to', redirectUrl);
        redirectTo(redirectUrl);
        
        return false;
    }
    
    return true;
}

/**
 * Show access denied error (for insufficient permissions)
 * @param {string[]} requiredRoles - Roles that were required
 */
function showAccessDeniedError(requiredRoles) {
    const roleNames = requiredRoles.map(r => getRoleDisplayName(r)).join(', ');
    
    alert(
        `Akses Ditolak\n\n` +
        `Halaman ini memerlukan salah satu role berikut:\n` +
        `- ${roleNames}\n\n` +
        `Role Anda saat ini: ${getRoleDisplayName(AuthState.primaryRole?.name)}\n\n` +
        `Silakan hubungi administrator jika Anda memerlukan akses.`
    );
}

// ==========================================
// PASSWORD RESET
// ============================================

/**
 * Request password reset link via email
 * 
 * @param {string} email - User's email address
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
    
    // Validate email
    if (!email || !PAMUNGKAS_CONFIG.VALIDATION.EMAIL.pattern.test(email)) {
        return { 
            success: false, 
            error: 'Format email tidak valid' 
        };
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim().toLowerCase(), 
            {
                redirectTo: `${window.location.origin}/reset-password.html`
            }
        );
        
        if (error) throw error;
        
        debugLog('Password reset requested', { email });
        
        return {
            success: true,
            error: null
        };
        
    } catch (error) {
        errorLog('Password reset error', error);
        
        return {
            success: false,
            error: mapSupabaseError(error).message || 'Gagal mengirim link reset password'
        };
    }
}

/**
 * Update password with the reset token
 * 
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function updatePassword(newPassword) {
    const supabase = getSupabase();
    
    if (!supabase) {
        return { 
            success: false, 
            error: 'Koneksi ke server tidak tersedia' 
        };
    }
    
    // Validate new password
    if (newPassword.length < PAMUNGKAS_CONFIG.VALIDATION.PASSWORD.minLength) {
        return {
            success: false,
            error: `Password minimal ${PAMUNGKAS_CONFIG.VALIDATION.PASSWORD.minLength} karakter`
        };
    }
    
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        debugLog('Password updated successfully');
        
        return { success: true, error: null };
        
    } catch (error) {
        errorLog('Update password error', error);
        
        return {
            success: false,
            error: mapSupabaseError(error).message || 'Gagal mengubah password'
        };
    }
}

// ==========================================
// AUTH STATE HELPERS
// ============================================

/**
 * Update AuthState object
 * @param {Object} updates - Fields to update
 */
function updateAuthState(updates) {
    Object.assign(AuthState, updates);
    
    // Debug log state changes
    if (PAMUNGKAS_CONFIG.ENVIRONMENT === 'development') {
        console.log('%c[AUTH STATE]', 'color: #8b5cf6; font-weight: bold;', {
            isAuthenticated: AuthState.isAuthenticated,
            isLoading: AuthState.isLoading,
            userName: AuthState.profile?.full_name,
            primaryRole: AuthState.primaryRole?.name,
            hasError: !!AuthState.error
        });
    }
}

/**
 * Get current authentication state
 * @returns {Object}
 */
function getAuthState() {
    return { ...AuthState };
}

/**
 * Check if user is currently authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    return AuthState.isAuthenticated === true && AuthState.isLoading === false;
}

/**
 * Check if auth is still loading
 * @returns {boolean}
 */
function isAuthLoading() {
    return AuthState.isLoading === true;
}

/**
 * Get current user info (from AuthState)
 * @returns {Object|null}
 */
function getCurrentUserInfo() {
    if (!isAuthenticated()) return null;
    
    return {
        id: AuthState.user?.id,
        email: AuthState.user?.email,
        ...AuthState.profile,
        primaryRole: AuthState.primaryRole,
        allRoles: AuthState.roles
    };
}

/**
 * Get display name for current user
 * @returns {string}
 */
function getCurrentUserDisplayName() {
    return AuthState.profile?.full_name || AuthState.user?.email || 'User';
}

/**
 * Get current user's primary role name
 * @returns {string|null}
 */
function getCurrentUserRoleName() {
    return AuthState.primaryRole?.name || null;
}

/**
 * Get current user's primary role display name
 * @returns {string}
 */
function getCurrentUserRoleDisplay() {
    return AuthState.primaryRole?.display_name || 'Tidak ada role';
}

// ==========================================
// REDIRECT HELPERS
// ============================================

/**
 * Redirect to URL
 * @param {string} url - URL to redirect to
 */
function redirectTo(url) {
    window.location.href = url;
}

/**
 * Redirect after successful login
 */
function redirectToDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || PAMUNGKAS_CONFIG.LOGIN_REDIRECT_URL;
    redirectTo(redirectUrl);
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    redirectTo(PAMUNGKAS_CONFIG.LOGIN_PAGE_URL);
}

// ==========================================
// ERROR MAPPING
// ============================================

/**
 * Map Supabase errors to Indonesian messages
 * @param {Object|string} error - Supabase error
 * @returns {Object} Mapped error with message
 */
function mapSupabaseError(error) {
    const errorMsg = typeof error === 'string' ? error : error?.message || '';
    
    const errorMap = {
        'Invalid login credentials': 'Email atau password salah',
        'Invalid password': 'Password salah',
        'Email not confirmed': 'Email belum diverifikasi. Silakan cek inbox Anda.',
        'Email not confirmed': 'Email belum diverifikasi. Silakan cek inbox Anda.',
        'Invalid email': 'Format email tidak valid',
        'Password should be at least 6 characters': 'Password terlalu pendek',
        'Password too short': 'Password terlalu pendek',
        'User already registered': 'Email sudah terdaftar. Gunakan email lain.',
        'Too many requests': 'Terlalu banyak percobaan. Silakan tunggu beberapa menit.',
        'Network request failed': 'Gagal terhubung ke server. Periksa koneksi internet.',
        'Session not found': 'Sesi tidak ditemukan. Silakan login kembali.',
        'refresh_token_expired': 'Sesi habis. Silakan login kembali.',
    };
    
    // Exact match first
    if (errorMap[errorMsg]) {
        return { message: errorMap[errorMsg], original: errorMsg };
    }
    
    // Partial match
    for (const [key, value] of Object.entries(errorMap)) {
        if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
            return { message: value, original: errorMsg };
        }
    }
    
    // Default
    return { 
        message: `Terjadi kesalahan: ${errorMsg}`, 
        original: errorMsg 
    };
}

// ==========================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// UI HELPER FUNCTIONS FOR LOGIN PAGE
// ============================================

/**
 * Show error message on login form
 * @param {string} message - Error message
 */
function showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    const messageEl = document.getElementById('errorMessage');
    
    if (errorEl && messageEl) {
        messageEl.textContent = message;
        errorEl.style.display = 'flex';
        
        // Auto hide after 8 seconds
        setTimeout(() => {
            hideLoginError();
        }, 8000);
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
 * @param {string} message - Success message
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
 * @param {boolean} isLoading - Loading state
 */
function setLoginButtonLoading(isLoading) {
    const btn = document.getElementById('loginBtn');
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = isLoading;
    
    if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
    if (btnLoader) btnLoader.style.display = isLoading ? 'inline-flex' : 'none';
}

/**
 * Handle login form submission (wrapper for UI)
 * @param {Event} e - Form submit event
 */
async function handleLoginFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Hide previous messages
    hideLoginError();
    
    // Set loading state
    setLoginButtonLoading(true);
    
    try {
        // Attempt login
        const result = await login(email, password);
        
        if (result.success) {
            showLoginSuccess('Login berhasil! Mengalihkan...');
            
            // Short delay before redirect
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
        } else {
            showLoginError(result.error || 'Login gagal. Silakan coba lagi.');
            
            // Shake animation
            shakeElement(document.getElementById('loginForm'));
        }
        
    } catch (error) {
        showLoginError('Terjadi kesalahan sistem. Silakan coba lagi nanti.');
        errorLog('Unexpected login error', error);
        
    } finally {
        setLoginButtonLoading(false);
    }
}

/**
 * Shake element animation
 * @param {HTMLElement} element 
 */
function shakeElement(element) {
    if (!element) return;
    
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
}

// ==========================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Setup auth listener first
    setupAuthListener();
    
    // Then initialize auth (check existing session)
    await initAuth();
});

// Export untuk penggunaan global
if (typeof window !== 'undefined') {
    window.PamungkasAuth = {
        // Core functions
        login,
        logout,
        initAuth,
        
        // Route protection
        requireAuth,
        redirectIfAuthenticated,
        
        // Password management
        requestPasswordReset,
        updatePassword,
        
        // State getters
        getAuthState,
        isAuthenticated,
        isAuthLoading,
        getCurrentUserInfo,
        getCurrentUserDisplayName,
        getCurrentUserRoleName,
        getCurrentUserRoleDisplay,
        
        // Events
        onAuthEvent,
        
        // UI helpers
        showLoginError,
        hideLoginError,
        showLoginSuccess,
        setLoginButtonLoading,
        handleLoginFormSubmit
    };
}

debugLog('Auth module loaded (Multi-User System)');
