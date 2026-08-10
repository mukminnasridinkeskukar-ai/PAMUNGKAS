/**
 * ============================================
 * PAMUNGKAS - Configuration File
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * INSTRUKSI PENTING:
 * 1. Ganti nilai di bawah dengan kredensial Supabase Anda
 * 2. JANGAN pernah menambahkan service_role key ke file ini
 * 3. Hanya gunakan anon/public key untuk frontend
 * 4. File ini akan di-load oleh semua halaman
 * 
 * CARA MENDAPATKAN KREDENSIAL:
 * 1. Buka dashboard Supabase: https://supabase.com/dashboard
 * 2. Pilih project Anda
 * 3. Menu Settings > API
 * 4. Copy "Project URL" dan "anon public" key
 */

const PAMUNGKAS_CONFIG = {
    // ==========================================
    // SUPABASE CONFIGURATION
    // ==========================================
    
    /**
     * Supabase Project URL
     * Format: https://your-project-id.supabase.co
     * @type {string}
     */
    SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
    
    /**
     * Supabase Anonymous (Public) Key
     * INI ADALAH KEY YANG AMAN UNTUK FRONTEND
     * Key ini memiliki akses terbatas via RLS policies
     * @type {string}
     */
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    
    // ==========================================
    // APPLICATION CONFIGURATION
    // ==========================================
    
    /**
     * Nama Aplikasi
     * @type {string}
     */
    APP_NAME: 'PAMUNGKAS',
    
    /**
     * Nama Lengkap Aplikasi
     * @type {string}
     */
    APP_FULL_NAME: 'Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan',
    
    /**
     * Versi Aplikasi
     * @type {string}
     */
    APP_VERSION: '1.3.0-master-data',
    
    /**
     * Environment (development | staging | production)
     * @type {string}
     */
    ENVIRONMENT: 'development',
    
    // ==========================================
    // AUTHENTICATION CONFIGURATION
    // ==========================================
    
    /**
     * Halaman setelah login berhasil
     * @type {string}
     */
    LOGIN_REDIRECT_URL: 'dashboard.html',
    
    /**
     * Halaman login (untuk redirect jika belum auth)
     * @type {string}
     */
    LOGIN_PAGE_URL: 'login.html',
    
    /**
     * Halaman home/landing
     * @type {string}
     */
    HOME_PAGE_URL: 'index.html',
    
    /**
     * Halaman setelah logout
     * @type {string}
     */
    LOGOUT_REDIRECT_URL: 'login.html',
    
    // ==========================================
    // ROLES CONFIGURATION (sesuai database)
    // ==========================================
    
    /**
     * Daftar role yang tersedia di sistem PAMUNGKAS
     * Sesuai dengan enum pamungkas_role di database
     */
    ROLES: {
        SUPER_ADMIN: {
            name: 'SUPER_ADMIN',
            display: 'Super Administrator',
            level: 1,
            description: 'Akses penuh ke seluruh sistem & konfigurasi'
        },
        ADMIN: {
            name: 'ADMIN',
            display: 'Administrator',
            level: 2,
            description: 'Admin organisasi/fasilitas kesehatan'
        },
        VERIFIKATOR: {
            name: 'VERIFIKATOR',
            display: 'Verifikator',
            level: 3,
            description: 'Verifikasi data & kompetensi'
        },
        PENGELOLA_SDMK: {
            name: 'PENGELOLA_SDMK',
            display: 'Pengelola SDM Kesehatan',
            level: 4,
            description: 'Kelola data tenaga kesehatan'
        },
        OPERATOR: {
            name: 'OPERATOR',
            display: 'Operator',
            level: 5,
            description: 'Input data operasional'
        },
        PIMPINAN: {
            name: 'PIMPINAN',
            display: 'Pimpinan',
            level: 6,
            description: 'Monitoring & persetujuan'
        }
    },
    
    /**
     * Default role untuk user baru (otomatis saat register)
     * @type {string}
     */
    DEFAULT_ROLE: 'OPERATOR',
    
    /**
     * Role yang bisa mengelola user lain
     * @type {string[]}
     */
    ADMIN_ROLES: ['SUPER_ADMIN', 'ADMIN'],
    
    // ==========================================
    // SESSION CONFIGURATION
    // ==========================================
    
    /**
     * Key untuk menyimpan session info di localStorage
     * @type {string}
     */
    SESSION_STORAGE_KEY: 'pamungkas_auth_state',
    
    /**
     * Key untuk menyimpan user profile cache
     * @type {string}
     */
    PROFILE_CACHE_KEY: 'pamungkas_user_profile',
    
    /**
     * Durasi cache profile dalam milidetik (5 menit)
     * @type {number}
     */
    PROFILE_CACHE_DURATION: 5 * 60 * 1000,
    
    // ==========================================
    // TABLE NAMES (sesuai schema)
    // ==========================================
    
    DB_TABLES: {
        // Auth & Permission Tables
        PROFILES: 'profiles',
        ROLES: 'roles',
        USER_ROLES: 'user_roles',
        PERMISSIONS: 'permissions',
        ROLE_PERMISSIONS: 'role_permissions',
        V_USER_INFO: 'v_user_info',
        V_USER_PERMISSIONS: 'v_user_permissions',
        
        // Master Data Tables
        UNITS: 'units',
        PROFESSIONS: 'professions',
        EDUCATION_LEVELS: 'education_levels',
        EMPLOYMENT_STATUSES: 'employment_statuses',
        COMPETENCY_CATEGORIES: 'competency_categories',
        TRAINING_TYPES: 'training_types',
        ACTIVITY_METHODS: 'activity_methods',
        CERTIFICATE_TYPES: 'certificate_types'
    },
    
    // ==========================================
    // FEATURE FLAGS
    // ==========================================
    
    FEATURES: {
        REGISTRATION: false,      // Pendaftaran user baru (default: off, admin only)
        SOCIAL_LOGIN: false,      // Login dengan Google/GitHub (placeholder)
        REMEMBER_ME: true,        // Fitur "Ingat Saya"
        RESET_PASSWORD: true,     // Reset password via email
        DARK_MODE: false,         // Mode gelap (future enhancement)
        NOTIFICATIONS: true,      // Sistem notifikasi
        EXPORT_DATA: true         // Export data ke Excel/PDF
    },
    
    // ==========================================
    // VALIDATION RULES
    // ==========================================
    
    VALIDATION: {
        EMAIL: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Format email tidak valid'
        },
        PASSWORD: {
            minLength: 8,
            requireUppercase: false,  // Relaxed untuk kemudahan
            requireLowercase: true,
            requireNumber: true,
            message: 'Password minimal 8 karakter dengan huruf dan angka'
        },
        NAME: {
            minLength: 3,
            maxLength: 200,
            message: 'Nama minimal 3 karakter, maksimal 200 karakter'
        },
        PHONE: {
            pattern: /^[\d\s\-\+\(\)]+$/,
            message: 'Format nomor telepon tidak valid'
        }
    },
    
    // ==========================================
    // UI CONFIGURATION
    // ==========================================
    
    UI: {
        SIDEBAR_COLLAPSED_KEY: 'pamungkas_sidebar_collapsed',
        THEME_KEY: 'pamungkas_theme',
        ANIMATION_DURATION: 300
    }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Cek apakah konfigurasi sudah diisi dengan benar
 * @returns {boolean}
 */
function isConfigValid() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = PAMUNGKAS_CONFIG;
    
    if (!SUPABASE_URL || SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') {
        console.warn('⚠️ [PAMUNGKAS] SUPABASE_URL belum dikonfigurasi');
        return false;
    }
    
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ [PAMUNGKAS] SUPABASE_ANON_KEY belum dikonfigurasi');
        return false;
    }
    
    return true;
}

/**
 * Dapatkan semua nama role sebagai array
 * @returns {string[]}
 */
function getRoleNames() {
    return Object.keys(PAMUNGKAS_CONFIG.ROLES);
}

/**
 * Dapatkan display name untuk role tertentu
 * @param {string} roleName - Nama role
 * @returns {string} Display name atau roleName jika tidak ditemukan
 */
function getRoleDisplayName(roleName) {
    return PAMUNGKAS_CONFIG.ROLES[roleName]?.display || roleName;
}

/**
 * Cek apakah role adalah admin role
 * @param {string} roleName - Nama role
 * @returns {boolean}
 */
function isAdminRole(roleName) {
    return PAMUNGKAS_CONFIG.ADMIN_ROLES.includes(roleName);
}

/**
 * Log informasi debug (hanya di development)
 * @param {string} message - Pesan log
 * @param {*} data - Data tambahan (opsional)
 */
function debugLog(message, data = null) {
    if (PAMUNGKAS_CONFIG.ENVIRONMENT === 'development') {
        console.log(`🔧 [PAMUNGKAS] ${message}`, data || '');
    }
}

/**
 * Log error (selalu tampilkan)
 * @param {string} message - Pesan error
 * @param {*} data - Data tambahan (opsional)
 */
function errorLog(message, data = null) {
    console.error(`❌ [PAMUNGKAS] ${message}`, data || '');
}

// Export untuk penggunaan di module lain (jika menggunakan ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PAMUNGKAS_CONFIG, isConfigValid, getRoleNames, getRoleDisplayName };
}

// Log saat config dimuat
debugLog('Configuration loaded v' + PAMUNGKAS_CONFIG.APP_VERSION, { 
    env: PAMUNGKAS_CONFIG.ENVIRONMENT,
    configValid: isConfigValid(),
    rolesAvailable: getRoleNames().length
});
