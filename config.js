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
    APP_VERSION: '1.0.0',
    
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
    
    // ==========================================
    // SESSION CONFIGURATION
    // ==========================================
    
    /**
     * Durasi session dalam milidetik (default: 24 jam)
     * @type {number}
     */
    SESSION_DURATION: 24 * 60 * 60 * 1000,
    
    /**
     * Key untuk menyimpan session di localStorage
     * @type {string}
     */
    SESSION_STORAGE_KEY: 'pamungkas_session',
    
    // ==========================================
    // API ENDPOINTS (untuk referensi)
    // ==========================================
    
    /**
     * Base API endpoints yang tersedia
     * Endpoint ini akan digunakan di tahap berikutnya
     */
    API_ENDPOINTS: {
        // Auth endpoints (managed by Supabase client)
        AUTH: {
            SIGNUP: '/auth/v1/signup',
            LOGIN: '/auth/v1/token?grant_type=password',
            LOGOUT: '/auth/v1/logout',
            USER: '/auth/v1/user',
            RESET_PASSWORD: '/auth/v1/recover'
        },
        // Data endpoints (akan dibuat di PROMPT 02)
        DATA: {
            USERS: '/rest/v1/users',
            SDM: '/rest/v1/sdm_kesehatan',
            PELATIHAN: '/rest/v1/pelatihan',
            SERTIFIKASI: '/rest/v1/sertifikasi'
        }
    },
    
    // ==========================================
    // ROLES & PERMISSIONS (untuk referensi)
    // ==========================================
    
    /**
     * Daftar role yang tersedia di sistem
     * Akan digunakan di modul autentikasi
     */
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        ADMIN: 'admin',
        MANAJER: 'manajer',
        OPERATOR: 'operator',
        VIEWER: 'viewer'
    },
    
    // ==========================================
    // FEATURE FLAGS
    // ==========================================
    
    /**
     * Fitur yang aktif/non-aktif
     * Gunakan untuk mengontrol fitur tanpa deploy ulang
     */
    FEATURES: {
        REGISTRATION: false,      // Pendaftaran user baru (default: off, admin only)
        SOCIAL_LOGIN: false,      // Login dengan Google/GitHub (placeholder)
        DARK_MODE: false,         // Mode gelap (future enhancement)
        NOTIFICATIONS: true,      // Sistem notifikasi
        EXPORT_DATA: true,        // Export data ke Excel/PDF
    },
    
    // ==========================================
    // VALIDATION RULES
    // ==========================================
    
    /**
     * Aturan validasi input
     */
    VALIDATION: {
        EMAIL: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Format email tidak valid'
        },
        PASSWORD: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            message: 'Password minimal 8 karakter dengan huruf besar, kecil, dan angka'
        },
        NIP: {
            pattern: /^\d{18}$/,
            message: 'NIP harus 18 digit angka'
        }
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
    
    if (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') {
        console.warn('⚠️ PAMUNGKAS: SUPABASE_URL belum dikonfigurasi');
        return false;
    }
    
    if (SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ PAMUNGKAS: SUPABASE_ANON_KEY belum dikonfigurasi');
        return false;
    }
    
    return true;
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

// Export untuk penggunaan di module lain (jika menggunakan ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PAMUNGKAS_CONFIG;
}

// Log saat config dimuat
debugLog('Configuration loaded', { 
    version: PAMUNGKAS_CONFIG.APP_VERSION,
    env: PAMUNGKAS_CONFIG.ENVIRONMENT,
    configValid: isConfigValid()
});
