/**
 * ============================================
 * PAMUNGKAS - Main Application Logic
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. UI Interactions (navigation, sidebar, dropdowns)
 * 2. Form handling (login form)
 * 3. Page-specific initialization
 * 4. Utility functions
 * 
 * INISIALISASI:
 * File ini di-load terakhir setelah config.js, supabase.js, dan auth.js
 */

// ==========================================
// APPLICATION STATE
// ==========================================

/**
 * Application state object
 */
const AppState = {
    isSidebarOpen: false,
    isMobileMenuOpen: false,
    isUserMenuOpen: false,
    currentPage: '',
    isLoading: false
};

// ==========================================
// DOM READY INITIALIZATION
// ==========================================

/**
 * Main initialization function
 * Dipanggil saat DOM sudah siap
 */
document.addEventListener('DOMContentLoaded', () => {
    debugLog('App initializing...');
    
    // Detect current page
    detectCurrentPage();
    
    // Initialize components based on page
    initializePageComponents();
    
    // Setup global event listeners
    setupGlobalEventListeners();
    
    // Check authentication status for protected pages
    checkPageAuth();
    
    debugLog('App initialized', { page: AppState.currentPage });
});

// ==========================================
// PAGE DETECTION
// ==========================================

/**
 * Detect current page from URL
 */
function detectCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    
    switch (filename) {
        case 'index.html':
        case '':
            AppState.currentPage = 'landing';
            break;
        case 'login.html':
            AppState.currentPage = 'login';
            break;
        case 'dashboard.html':
            AppState.currentPage = 'dashboard';
            break;
        default:
            AppState.currentPage = filename.replace('.html', '');
    }
    
    document.body.setAttribute('data-page', AppState.currentPage);
}

// ==========================================
// PAGE-SPECIFIC INITIALIZATION
// ==========================================

/**
 * Initialize components based on current page
 */
function initializePageComponents() {
    switch (AppState.currentPage) {
        case 'landing':
            initLandingPage();
            break;
        case 'login':
            initLoginPage();
            break;
        case 'dashboard':
            initDashboardPage();
            break;
    }
}

/**
 * Initialize Landing Page components
 */
function initLandingPage() {
    // Smooth scroll untuk anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 72;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar scroll effect
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.style.boxShadow = 'var(--shadow-md)';
        } else {
            navbar.classList.remove('scrolled');
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollY = window.scrollY;
    }, { passive: true });
}

/**
 * Initialize Login Page components
 */
async function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const passwordToggle = document.querySelector('.password-toggle');
    
    // Check if already authenticated - redirect to dashboard
    // This is handled by redirectIfAuthenticated() in auth.js
    // But we add an extra check here for immediate feedback
    if (isAuthenticated()) {
        debugLog('User already authenticated, redirecting...');
        redirectToDashboard();
        return;
    }
    
    // Wait for auth initialization to complete
    // (in case session is being restored)
    await waitForAuthInit();
    
    // Double-check after initialization
    if (isAuthenticated()) {
        debugLog('User authenticated after init, redirecting...');
        redirectToDashboard();
        return;
    }
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }
    
    // Password visibility toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', handlePasswordToggle);
    }
    
    // Input focus effects
    const inputs = loginForm?.querySelectorAll('input');
    inputs?.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement?.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement?.classList.remove('focused');
        });
    });
}

/**
 * Initialize Dashboard Page components
 */
async function initDashboardPage() {
    // Show loading state while checking auth
    showDashboardLoading(true);
    
    // Require authentication (will redirect if not logged in)
    const hasAccess = await requireAuth();
    
    if (!hasAccess) {
        // Will redirect automatically, no need to continue
        return;
    }
    
    // Hide loading and show content
    showDashboardLoading(false);
    
    // Sidebar navigation
    initSidebarNavigation();
    
    // User menu dropdown
    initUserMenuDropdown();
    
    // Mobile menu button
    initMobileMenuButton();
    
    // Sidebar overlay click to close
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
    
    // Breadcrumb update based on active nav
    updateBreadcrumb();
    
    // Update user info display (if functions available)
    if (typeof displayUserInfo === 'function') {
        displayUserInfo();
    }
}

// ==========================================
// LOGIN FORM HANDLER
// ==========================================

/**
 * Handle login form submission
 * @param {Event} e - Submit event
 */
async function handleLoginFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Hide previous errors
    hideLoginError();
    
    // Validate inputs
    if (!email) {
        showLoginError('Email harus diisi');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        showLoginError('Password harus diisi');
        passwordInput.focus();
        return;
    }
    
    // Set loading state
    setLoginButtonLoading(true);
    
    try {
        // Attempt login
        const result = await login(email, password);
        
        if (result.success) {
            showLoginSuccess('Login berhasil! Mengalihkan...');
            
            // Redirect ke dashboard setelah delay singkat
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
        } else {
            showLoginError(result.error || 'Login gagal. Silakan coba lagi.');
            
            // Shake animation pada form
            const form = document.getElementById('loginForm');
            if (form) {
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 500);
            }
        }
        
    } catch (error) {
        console.error('[PAMUNGKAS] Login error:', error);
        showLoginError('Terjadi kesalahan sistem. Silakan coba lagi nanti.');
        
    } finally {
        setLoginButtonLoading(false);
    }
}

/**
 * Handle password visibility toggle
 */
function handlePasswordToggle() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');
    const eyeOffIcon = document.querySelector('.eye-off-icon');
    
    if (!passwordInput) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (eyeIcon) eyeIcon.style.display = 'none';
        if (eyeOffIcon) eyeOffIcon.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        if (eyeIcon) eyeIcon.style.display = 'block';
        if (eyeOffIcon) eyeOffIcon.style.display = 'none';
    }
}

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

/**
 * Initialize sidebar navigation interactions
 */
function initSidebarNavigation() {
    // Nav items with children (dropdown)
    const navItemsWithChildren = document.querySelectorAll('.nav-item-has-children > .nav-link');
    
    navItemsWithChildren.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const parentItem = item.parentElement;
            const isOpen = parentItem.classList.contains('open');
            
            // Close all other open items
            document.querySelectorAll('.nav-item-has-children.open').forEach(openItem => {
                if (openItem !== parentItem) {
                    openItem.classList.remove('open');
                }
            });
            
            // Toggle current item
            parentItem.classList.toggle('open', !isOpen);
        });
    });
    
    // Active state handling
    setActiveNavItem();
}

/**
 * Set active navigation item based on current URL
 */
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
            
            // Open parent if in submenu
            const parentItem = link.closest('.nav-item-has-children');
            if (parentItem) {
                parentItem.classList.add('open');
            }
        }
    });
}

/**
 * Toggle sidebar open/close (mobile)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    AppState.isSidebarOpen = !AppState.isSidebarOpen;
    
    sidebar.classList.toggle('open', AppState.isSidebarOpen);
    overlay?.classList.toggle('active', AppState.isSidebarOpen);
    
    // Prevent body scroll when sidebar is open on mobile
    document.body.style.overflow = AppState.isSidebarOpen ? 'hidden' : '';
}

/**
 * Close sidebar (mobile)
 */
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    AppState.isSidebarOpen = false;
    sidebar.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
}

// ==========================================
// USER MENU DROPDOWN
// ==========================================

/**
 * Initialize user menu dropdown
 */
function initUserMenuDropdown() {
    const userMenuBtn = document.querySelector('.user-menu-btn');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserMenu();
        });
    }
    
    // Logout button handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (AppState.isUserMenuOpen) {
            const userMenu = document.getElementById('userMenu');
            if (userMenu && !userMenu.contains(e.target)) {
                closeUserMenu();
            }
        }
    });
}

/**
 * Toggle user menu dropdown
 */
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    
    AppState.isUserMenuOpen = !AppState.isUserMenuOpen;
    userMenu.classList.toggle('open', AppState.isUserMenuOpen);
}

/**
 * Close user menu dropdown
 */
function closeUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    
    AppState.isUserMenuOpen = false;
    userMenu.classList.remove('open');
}

// ==========================================
// MOBILE MENU
// ==========================================

/**
 * Initialize mobile menu button
 */
function initMobileMenuButton() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
}

/**
 * Toggle mobile navigation menu (landing page)
 */
function toggleMobileNav() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (!navMenu || !navToggle) return;
    
    AppState.isMobileMenuOpen = !AppState.isMobileMenuOpen;
    
    navMenu.classList.toggle('open', AppState.isMobileMenuOpen);
    navToggle.classList.toggle('active', AppState.isMobileMenuOpen);
}

// ==========================================
// GLOBAL EVENT LISTENERS
// ==========================================

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Mobile nav toggle (landing page)
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileNav);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window resize handler
    window.addEventListener('debouncedResize', handleWindowResize);
    
    // Debounce resize events
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            window.dispatchEvent(new Event('debouncedResize'));
        }, 150);
    });
    
    // Logout button global handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    }
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Escape key closes modals/dropdowns
    if (e.key === 'Escape') {
        if (AppState.isUserMenuOpen) {
            closeUserMenu();
        }
        if (AppState.isSidebarOpen) {
            closeSidebar();
        }
        if (AppState.isMobileMenuOpen) {
            toggleMobileNav();
        }
    }
    
    // Ctrl/Cmd + K untuk search (placeholder)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.topbar-search input');
        if (searchInput) {
            searchInput.focus();
        }
    }
}

/**
 * Handle window resize
 */
function handleWindowResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth >= 1024) {
        if (AppState.isSidebarOpen) {
            closeSidebar();
        }
        if (AppState.isMobileMenuOpen) {
            const navMenu = document.querySelector('.nav-menu');
            const navToggle = document.querySelector('.nav-toggle');
            navMenu?.classList.remove('open');
            navToggle?.classList.remove('active');
            AppState.isMobileMenuOpen = false;
        }
    }
}

// ==========================================
// AUTH CHECK FOR PROTECTED PAGES
// ==========================================

/**
 * Check if current page requires authentication
 */
async function checkPageAuth() {
    // Dashboard dan halaman lainnya memerlukan auth
    const protectedPages = ['dashboard'];
    
    if (protectedPages.includes(AppState.currentPage)) {
        // Note: requireAuth() is now called in initDashboardPage()
        // This is kept for backward compatibility but the main logic is in initDashboardPage
        if (!isAuthenticated()) {
            debugLog('Protected page accessed without auth, waiting for init...');
        }
    }
    
    // For login page: redirect if already authenticated
    if (AppState.currentPage === 'login') {
        // This is handled in initLoginPage() with more robust checks
    }
}

// ==========================================
// BREADCRUMB UPDATE
// ============================================

/**
 * Update breadcrumb berdasarkan halaman aktif
 */
function updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb .current');
    if (!breadcrumb) return;
    
    const pageNames = {
        'dashboard': 'Dashboard',
        // Akan ditambahkan saat modul dibuat
    };
    
    breadcrumb.textContent = pageNames[AppState.currentPage] || 'Halaman';
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Wait for authentication initialization to complete
 * @param {number} maxWait - Maximum wait time in ms (default 5000)
 */
async function waitForAuthInit(maxWait = 5000) {
    const startTime = Date.now();
    
    while (isAuthLoading && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

/**
 * Show/hide dashboard loading state
 * @param {boolean} show - Show loading if true
 */
function showDashboardLoading(show) {
    const loadingEl = document.getElementById('dashboardLoading');
    const contentEl = document.getElementById('dashboardMainContent');
    
    if (loadingEl) loadingEl.style.display = show ? 'flex' : 'none';
    if (contentEl) contentEl.style.display = show ? 'none' : 'block';
}

/**
 * Format tanggal ke format Indonesia
 * @param {Date|string} date - Tanggal yang akan diformat
 * @returns {string} Tanggal terformat
 */
function formatDate(date) {
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return d.toLocaleDateString('id-ID', options);
}

/**
 * Format angka dengan pemisah ribuan
 * @param {number} num - Angka yang akan diformat
 * @returns {string} Angka terformat
 */
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Debounce function
 * @param {Function} func - Function yang akan di-debounce
 * @param {number} wait - Waktu tunggu dalam ms
 * @returns {Function} Function yang sudah di-debounce
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Show toast notification (placeholder)
 * @param {string} message - Pesan notifikasi
 * @param {'success'|'error'|'warning'|'info'} type - Tipe notifikasi
 * @param {number} duration - Durasi tampil dalam ms
 */
function showToast(message, type = 'info', duration = 3000) {
    // Placeholder - akan diimplementasikan jika diperlukan
    console.log(`[Toast ${type}]`, message);
}

/**
 * Confirm dialog wrapper
 * @param {string} message - Pesan konfirmasi
 * @returns {Promise<boolean>}
 */
async function confirmAction(message) {
    return new Promise((resolve) => {
        resolve(window.confirm(message));
    });
}

// ==========================================
// CSS ANIMATION HELPERS
// ============================================

/**
 * Add shake animation class ke element
 * @param {HTMLElement} element - Element yang akan di-animasi
 */
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
}

// Add shake animation styles dynamically
const shakeStyles = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.5s ease-in-out;
    }
`;

if (!document.querySelector('#pamungkas-dynamic-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'pamungkas-dynamic-styles';
    styleSheet.textContent = shakeStyles;
    document.head.appendChild(styleSheet);
}

// ==========================================
// EXPORTS
// ==========================================

if (typeof window !== 'undefined') {
    window.PamungkasApp = {
        state: AppState,
        toggleSidebar,
        closeSidebar,
        toggleUserMenu,
        closeUserMenu,
        formatDate,
        formatNumber,
        debounce,
        showToast,
        confirmAction,
        shakeElement
    };
}

debugLog('App module loaded');
