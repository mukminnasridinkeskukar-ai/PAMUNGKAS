/**
 * ============================================
 * PAMUNGKAS - Permission Management Module
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. Permission checking (hasPermission, hasRole)
 * 2. User info retrieval (getCurrentUser, getCurrentProfile)
 * 3. Role management helpers
 * 4. Dynamic menu/sidebar control based on permissions
 * 5. Permission caching for performance
 * 
 * ⚠️ KEAMANAN PENTING:
 * - Permission di frontend HANYA untuk UI/UX!
 * - Keamanan sebenarnya ada di RLS (PostgreSQL)
 * - JANGAN gunakan ini sebagai satu-satunya security layer!
 * 
 * ARSITEKTUR:
 * auth.users → profiles → user_roles → roles
 *                              ↓
 *                        role_permissions → permissions
 * 
 * PENGGUNAAN:
 * // Cek permission tunggal
 * if (await hasPermission('sdmk.view')) { ... }
 * 
 * // Cek role
 * if (hasRole('ADMIN')) { ... }
 * 
 * // Dapatkan user saat ini
 * const user = await getCurrentUser();
 * const profile = await getCurrentProfile();
 */

// ==========================================
// PERMISSION STATE MANAGEMENT
// ==========================================

/**
 * Current permission state
 */
const PermissionState = {
    // Array of permission names (e.g., ['sdmk.view', 'dashboard.view', ...])
    permissions: [],
    
    // Array of role objects
    roles: [],
    
    // Primary role object (most powerful)
    primaryRole: null,
    
    // User profile data
    profile: null,
    
    // Auth user data (from Supabase Auth)
    authUser: null,
    
    // Loading state
    isLoading: true,
    
    // Last fetch timestamp
    lastFetched: null,
    
    // Error state
    error: null
};

// Cache duration untuk permissions (5 menit)
const PERMISSION_CACHE_DURATION = 5 * 60 * 1000;

// ==========================================
// CORE FUNCTIONS
// ==========================================

/**
 * Get current authenticated user from Supabase Auth
 * 
 * @returns {Promise<Object|null>} User object atau null jika tidak terautentikasi
 * 
 * @example
 * const user = await getCurrentUser();
 * console.log(user.email); // user@domain.com
 */
async function getCurrentUser() {
    try {
        // Return from cache jika ada
        if (PermissionState.authUser) {
            return PermissionState.authUser;
        }
        
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (!client) {
            console.warn('[PAMUNGKAS] Supabase client tidak tersedia');
            return null;
        }
        
        const { data: { user }, error } = await client.auth.getUser();
        
        if (error) throw error;
        if (!user) return null;
        
        // Cache user data
        PermissionState.authUser = user;
        
        debugLog('Current user fetched', { email: user.email, id: user.id });
        return user;
        
    } catch (error) {
        errorLog('Error getting current user', error);
        return null;
    }
}

/**
 * Get current user profile dari tabel profiles
 * 
 * @returns {Promise<Object|null>} Profile object atau null
 * 
 * Profile berisi:
 * - id, full_name, email, phone, avatar_url
 * - unit_id, position, is_active
 * - created_at, updated_at
 * 
 * @example
 * const profile = await getCurrentProfile();
 * console.log(profile.full_name); // "John Doe"
 * console.log(profile.unit_id); // UUID unit kerja
 */
async function getCurrentProfile() {
    try {
        // Return from cache jika valid
        if (PermissionState.profile && isPermissionCacheValid()) {
            return PermissionState.profile;
        }
        
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (!client) return null;
        
        const user = await getCurrentUser();
        if (!user) return null;
        
        // Fetch profile dari tabel profiles
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFILES)
            .select('*')
            .eq('id', user.id)  // Asumsi id di profiles = auth.users.id
            .single();
        
        if (error) {
            // Coba dengan user_id jika id tidak cocok
            const { data: data2, error: error2 } = await client
                .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFILES)
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (error2) throw error2;
            
            PermissionState.profile = data2;
            return data2;
        }
        
        PermissionState.profile = data;
        
        debugLog('Current profile fetched', { full_name: data.full_name });
        return data;
        
    } catch (error) {
        errorLog('Error getting current profile', error);
        return null;
    }
}

/**
 * Get all user roles
 * 
 * @returns {Promise<Array>} Array of role objects
 * 
 * Setiap role object berisi:
 * - id, name, display_name, level, description
 * - assigned_at (kapan role ditetapkan)
 * 
 * @example
 * const roles = await getUserRoles();
 * roles.forEach(role => {
 *     console.log(`${role.display_name} (Level ${role.level})`);
 * });
 */
async function getUserRoles() {
    try {
        // Return from cache jika valid
        if (PermissionState.roles.length > 0 && isPermissionCacheValid()) {
            return PermissionState.roles;
        }
        
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (!client) return [];
        
        const profile = await getCurrentProfile();
        if (!profile) return [];
        
        // Fetch roles via user_roles junction table
        const { data, error } = await client
            .from(PAMUNGKAS_CONFIG.DB_TABLES.USER_ROLES)
            .select(`
                role_id,
                assigned_at:created_at,
                roles (
                    id,
                    name,
                    display_name,
                    level,
                    description
                )
            `)
            .eq('user_id', profile.id);
        
        if (error) throw error;
        
        // Extract dan format roles
        const roles = (data || []).map(ur => ({
            id: ur.roles.id,
            name: ur.roles.name,
            display_name: ur.roles.display_name,
            level: ur.roles.level,
            description: ur.roles.description,
            assigned_at: ur.assigned_at
        }));
        
        // Sort by level (lowest = most powerful)
        roles.sort((a, b) => a.level - b.level);
        
        // Update state
        PermissionState.roles = roles;
        PermissionState.primaryRole = roles.length > 0 ? roles[0] : null;
        
        debugLog('User roles fetched', { 
            count: roles.length, 
            primaryRole: PermissionState.primaryRole?.name,
            roles: roles.map(r => r.name)
        });
        
        return roles;
        
    } catch (error) {
        errorLog('Error getting user roles', error);
        return [];
    }
}

/**
 * Get all user permissions
 * 
 * @returns {Promise<Array<string>>} Array of permission names
 * 
 * @example
 * const perms = await getUserPermissions();
 * console.log(perms.includes('sdmk.view')); // true/false
 */
async function getUserPermissions() {
    try {
        // Return from cache jika valid
        if (PermissionState.permissions.length > 0 && isPermissionCacheValid()) {
            return PermissionState.permissions;
        }
        
        const client = typeof getSupabase === 'function' ? getSupabase() : null;
        if (!client) return [];
        
        const profile = await getCurrentProfile();
        if (!profile) return [];
        
        // Fetch permissions via view atau manual query
        let permissions = [];
        
        // Coba dari view v_user_permissions dulu
        try {
            const { data, error } = await client
                .from('v_user_permissions')
                .select('permissions')
                .eq('auth_uid', (await getCurrentUser())?.id)
                .single();
            
            if (!error && data?.permissions) {
                permissions = data.permissions;
            }
        } catch (viewError) {
            // View tidak ada, fallback ke manual query
            debugLog('View not found, using manual query');
        }
        
        // Manual query jika view gagal
        if (permissions.length === 0) {
            const { data: rolesData } = await getUserRoles();
            
            if (rolesData.length > 0) {
                const roleIds = rolesData.map(r => r.id);
                
                const { data: permData, error: permError } = await client
                    .from('role_permissions')
                    .select(`
                        permissions (
                            name
                        )
                    `)
                    .in('role_id', roleIds);
                
                if (!permError && permData) {
                    permissions = permData
                        .map(rp => rp.permissions?.name)
                        .filter(p => p); // filter null/undefined
                }
            }
        }
        
        // Remove duplicates and update state
        PermissionState.permissions = [...new Set(permissions)];
        PermissionState.lastFetched = Date.now();
        
        debugLog('User permissions fetched', { 
            count: PermissionState.permissions.length,
            sample: PermissionState.permissions.slice(0, 5)
        });
        
        return PermissionState.permissions;
        
    } catch (error) {
        errorLog('Error getting user permissions', error);
        return [];
    }
}

// ==========================================
// CHECKING FUNCTIONS
// ==========================================

/**
 * Check apakah user memiliki permission tertentu
 * 
 * ⚠️ INI UNTUK UI SAJA! Keamanan sebenarnya di RLS!
 * 
 * @param {string} permissionName - Nama permission (e.g., 'sdmk.view')
 * @returns {Promise<boolean>} True jika user memiliki permission
 * 
 * @example
 * // Di halaman SDMK
 * if (await hasPermission('sdmk.create')) {
 *     showCreateButton();
 * }
 * 
 * // Multiple checks
 * if (await hasPermission('sdmk.delete')) {
 *     showDeleteButton();
 * }
 */
async function hasPermission(permissionName) {
    try {
        // Jika belum load, fetch dulu
        if (PermissionState.permissions.length === 0) {
            await getUserPermissions();
        }
        
        const hasPerm = PermissionState.permissions.includes(permissionName);
        
        debugLog('Permission check', { 
            permission: permissionName, 
            result: hasPerm 
        });
        
        return hasPerm;
        
    } catch (error) {
        errorLog('Error checking permission', error);
        return false;
    }
}

/**
 * Check apakah user memiliki salah satu dari beberapa permission
 * 
 * @param {...string} permissionNames - Nama-nama permission
 * @returns {Promise<boolean>} True jika user memiliki salah satu
 * 
 * @example
 * // User bisa view ATAU create
 * if (await hasAnyPermission('sdmk.view', 'sdmk.create')) {
 *     showSDMKMenu();
 * }
 */
async function hasAnyPermission(...permissionNames) {
    for (const perm of permissionNames) {
        if (await hasPermission(perm)) {
            return true;
        }
    }
    return false;
}

/**
 * Check apakah user memiliki semua permission yang disebutkan
 * 
 * @param {...string} permissionNames - Nama-nama permission
 * @returns {Promise<boolean>} True jika user memiliki semua
 * 
 * @example
 * // User harus punya view DAN create
 * if (await hasAllPermissions('sdmk.view', 'sdmk.create')) {
 *     showFullSDMKAccess();
 * }
 */
async function hasAllPermissions(...permissionNames) {
    for (const perm of permissionNames) {
        if (!(await hasPermission(perm))) {
            return false;
        }
    }
    return true;
}

/**
 * Check apakah user memiliki role tertentu
 * 
 * ⚠️ INI UNTUK UI SAJA! Keamanan sebenarnya di RLS!
 * 
 * @param {string} roleName - Nama role (e.g., 'SUPER_ADMIN', 'ADMIN')
 * @returns {Promise<boolean>} True jika user memiliki role
 * 
 * @example
 * if (await hasRole('SUPER_ADMIN')) {
 *     showAdminPanel();
 * }
 */
async function hasRole(roleName) {
    try {
        const roles = await getUserRoles();
        const hasRole = roles.some(r => r.name === roleName);
        
        debugLog('Role check', { role: roleName, result: hasRole });
        
        return hasRole;
        
    } catch (error) {
        errorLog('Error checking role', error);
        return false;
    }
}

/**
 * Check apakah user memiliki salah satu role (synchronous version from cache)
 * 
 * Berguna untuk quick check setelah permissions di-load
 * 
 * @param {string} roleName - Nama role
 * @returns {boolean} True jika user memiliki role (dari cache)
 * 
 * @example
 * // Quick check (setelah ensurePermissionsLoaded())
 * if (hasRoleSync('ADMIN')) {
 *     // do something
 * }
 */
function hasRoleSync(roleName) {
    return PermissionState.roles.some(r => r.name === roleName);
}

/**
 * Check apakah user adalah admin (SUPER_ADMIN atau ADMIN)
 * 
 * @returns {Promise<boolean>}
 */
async function isAdminUser() {
    return await hasAnyRole('SUPER_ADMIN', 'ADMIN');
}

/**
 * Check apakah user memiliki salah satu dari beberapa role
 * 
 * @param {...string} roleNames - Nama-nama role
 * @returns {Promise<boolean>}
 */
async function hasAnyRole(...roleNames) {
    const roles = await getUserRoles();
    return roles.some(r => roleNames.includes(r.name));
}

// ==========================================
// PERMISSION LOADING & CACHE
// ==========================================

/**
 * Pastikan permissions sudah di-load
 * Dipanggil saat init dashboard/halaman protected
 * 
 * @returns {Promise<Object>} Permission state
 */
async function ensurePermissionsLoaded() {
    try {
        if (!isPermissionCacheValid()) {
            debugLog('Loading fresh permissions...');
            
            // Parallel load semua data
            await Promise.all([
                getCurrentUser(),
                getCurrentProfile(),
                getUserRoles(),
                getUserPermissions()
            ]);
        }
        
        PermissionState.isLoading = false;
        return PermissionState;
        
    } catch (error) {
        errorLog('Error loading permissions', error);
        PermissionState.error = error;
        PermissionState.isLoading = false;
        return PermissionState;
    }
}

/**
 * Check apakah permission cache masih valid
 * @returns {boolean}
 */
function isPermissionCacheValid() {
    if (!PermissionState.lastFetched) return false;
    
    const age = Date.now() - PermissionState.lastFetched;
    return age < PERMISSION_CACHE_DURATION;
}

/**
 * Clear permission cache (force reload next time)
 */
function clearPermissionCache() {
    PermissionState.permissions = [];
    PermissionState.roles = [];
    PermissionState.primaryRole = null;
    PermissionState.profile = null;
    PermissionState.authUser = null;
    PermissionState.lastFetched = null;
    
    debugLog('Permission cache cleared');
}

/**
 * Refresh permissions (force reload dari server)
 * @returns {Promise<Object>} Updated permission state
 */
async function refreshPermissions() {
    clearPermissionCache();
    return await ensurePermissionsLoaded();
}

// ==========================================
// MENU/SIDEBAR HELPERS
// ============================================

/**
 * Definisi menu items beserta permission yang dibutuhkan
 * Format: { id, label, icon, href, permission, [children], [roles] }
 */
const MENU_DEFINITION = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        href: 'dashboard.html',
        permission: 'dashboard.view',
        order: 1
    },
    {
        id: 'sdmk',
        label: 'SDM Kesehatan',
        icon: 'users',
        href: '#',
        permission: 'sdmk.view',
        order: 10,
        children: [
            { id: 'sdmk-list', label: 'Data SDM', href: 'pages/sdmk.html', permission: 'sdmk.view' },
            { id: 'sdmk-add', label: 'Tambah Data', href: 'pages/sdmk-form.html', permission: 'sdmk.create' },
            { id: 'sdmk-verify', label: 'Verifikasi', href: 'pages/sdmk-verify.html', permission: 'sdmk.verify' },
            { id: 'sdmk-import', label: 'Import/Export', href: 'pages/sdmk-import.html', permission: 'sdmk.import' }
        ]
    },
    {
        id: 'competency',
        label: 'Kompetensi',
        icon: 'award',
        href: '#',
        permission: 'competency.view',
        order: 20,
        children: [
            { id: 'comp-list', label: 'Data Kompetensi', href: 'pages/competency.html', permission: 'competency.view' },
            { id: 'comp-add', label: 'Input Kompetensi', href: 'pages/competency-form.html', permission: 'competency.create' },
            { id: 'comp-verify', label: 'Verifikasi', href: 'pages/competency-verify.html', permission: 'competency.verify' }
        ]
    },
    {
        id: 'activity',
        label: 'Aktivitas',
        icon: 'calendar',
        href: '#',
        permission: 'activity.view',
        order: 30,
        children: [
            { id: 'act-list', label: 'Daftar Kegiatan', href: 'pages/activity.html', permission: 'activity.view' },
            { id: 'act-add', label: 'Tambah Kegiatan', href: 'pages/activity-form.html', permission: 'activity.create' },
            { id: 'act-participants', label: 'Peserta', href: 'pages/participants.html', permission: 'participant.view' }
        ]
    },
    {
        id: 'certificate',
        label: 'Sertifikat',
        icon: 'file-text',
        href: '#',
        permission: 'certificate.view',
        order: 40,
        children: [
            { id: 'cert-list', label: 'Daftar Sertifikat', href: 'pages/certificate.html', permission: 'certificate.view' },
            { id: 'cert-create', label: 'Buat Sertifikat', href: 'pages/certificate-form.html', permission: 'certificate.create' }
        ]
    },
    {
        id: 'report',
        label: 'Laporan',
        icon: 'bar-chart',
        href: '#',
        permission: 'report.view',
        order: 50,
        children: [
            { id: 'rpt-view', label: 'Lihat Laporan', href: 'pages/report.html', permission: 'report.view' },
            { id: 'rpt-export', label: 'Export Laporan', href: 'pages/report-export.html', permission: 'report.export' },
            { id: 'rpt-custom', label: 'Laporan Kustom', href: 'pages/report-custom.html', permission: 'report.custom' }
        ]
    },
    // Separator untuk menu admin
    {
        id: 'separator-admin',
        type: 'separator',
        permission: 'user.view',
        order: 90
    },
    {
        id: 'users',
        label: 'Manajemen User',
        icon: 'user-plus',
        href: '#',
        permission: 'user.view',
        order: 100,
        children: [
            { id: 'usr-list', label: 'Daftar User', href: 'pages/users.html', permission: 'user.view' },
            { id: 'usr-add', label: 'Tambah User', href: 'pages/user-form.html', permission: 'user.create' },
            { id: 'usr-roles', label: 'Kelola Role', href: 'pages/user-roles.html', permission: 'user.manage_roles' }
        ]
    },
    {
        id: 'settings',
        label: 'Pengaturan',
        icon: 'settings',
        href: '#',
        permission: 'settings.view',
        order: 110,
        children: [
            { id: 'set-general', label: 'Umum', href: 'pages/settings.html', permission: 'settings.view' },
            { id: 'set-master', label: 'Data Master', href: 'pages/master-data.html', permission: 'settings.master_data' },
            { id: 'set-permissions', label: 'Permissions', href: 'pages/permissions.html', permission: 'user.manage_permissions' }
        ]
    }
];

/**
 * Filter menu items berdasarkan user permissions
 * 
 * @param {Array} menuItems - Array of menu definitions
 * @returns {Array} Filtered menu items (hanya yang boleh diakses user)
 */
async function filterMenuByPermissions(menuItems = MENU_DEFINITION) {
    const result = [];
    
    for (const item of menuItems) {
        // Skip separator tanpa permission
        if (item.type === 'separator') {
            if (item.permission && await hasPermission(item.permission)) {
                result.push(item);
            }
            continue;
        }
        
        // Cek permission utama
        if (item.permission && !(await hasPermission(item.permission))) {
            continue; // Skip item ini
        }
        
        // Jika ada children, filter juga
        if (item.children && item.children.length > 0) {
            const filteredChildren = [];
            
            for (const child of item.children) {
                if (child.permission && !(await hasPermission(child.permission))) {
                    continue;
                }
                filteredChildren.push(child);
            }
            
            // Hanya tambahkan parent jika ada children yang visible
            if (filteredChildren.length > 0) {
                result.push({
                    ...item,
                    children: filteredChildren
                });
            }
        } else {
            result.push(item);
        }
    }
    
    return result.sort((a, b) => (a.order || 999) - (b.order || 999));
}

/**
 * Generate sidebar HTML berdasarkan permissions
 * 
 * @returns {Promise<string>} HTML string untuk sidebar navigation
 */
async function generateSidebarHTML() {
    const filteredMenu = await filterMenuByPermissions();
    
    let html = '<ul class="nav-list">';
    
    for (const item of filteredMenu) {
        if (item.type === 'separator') {
            html += '<li class="nav-separator"></li>';
            continue;
        }
        
        const hasChildren = item.children && item.children.length > 0;
        const isActive = window.location.pathname.includes(item.href.replace('.html', '')) || 
                        (item.href !== '#' && window.location.pathname.endsWith(item.href));
        
        if (hasChildren) {
            html += `
                <li class="nav-item nav-item-has-children ${isActive ? 'open' : ''}">
                    <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
                        <span class="nav-icon">${getIconSVG(item.icon)}</span>
                        <span class="nav-label">${item.label}</span>
                        <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </a>
                    <ul class="nav-submenu">
                        ${item.children.map(child => `
                            <li class="nav-subitem">
                                <a href="${child.href}" class="nav-sublink">${child.label}</a>
                            </li>
                        `).join('')}
                    </ul>
                </li>
            `;
        } else {
            html += `
                <li class="nav-item">
                    <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
                        <span class="nav-icon">${getIconSVG(item.icon)}</span>
                        <span class="nav-label">${item.label}</span>
                    </a>
                </li>
            `;
        }
    }
    
    html += '</ul>';
    
    return html;
}

/**
 * Update sidebar dengan menu berdasarkan permissions
 * Harus dipanggil setelah user login/load permissions
 */
async function updateSidebarWithPermissions() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    
    try {
        const html = await generateSidebarHTML();
        sidebarNav.innerHTML = html;
        
        // Re-initialize sidebar interactions
        if (typeof initSidebarNavigation === 'function') {
            initSidebarNavigation();
        }
        
        debugLog('Sidebar updated with permissions');
        
    } catch (error) {
        errorLog('Error updating sidebar', error);
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get SVG icon sederhana
 * @param {string} iconName - Nama icon
 * @returns {string} SVG string
 */
function getIconSVG(iconName) {
    const icons = {
        'dashboard': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
        'users': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        'award': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
        'calendar': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        'file-text': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        'bar-chart': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
        'user-plus': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
        'settings': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
    };
    
    return icons[iconName] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>';
}

/**
 * Display user info di topbar/dashboard
 * Menggunakan data dari permission module
 */
async function displayUserInfo() {
    try {
        const profile = await getCurrentProfile();
        const roles = await getUserRoles();
        const primaryRole = PermissionState.primaryRole;
        
        // Update nama user
        const userNameEl = document.getElementById('userName');
        if (userNameEl && profile) {
            userNameEl.textContent = profile.full_name || 'User';
        }
        
        // Update email/user identifier
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl && profile) {
            userEmailEl.textContent = profile.email || '';
        }
        
        // Update role badge
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl && primaryRole) {
            userRoleEl.textContent = primaryRole.display_name || primaryRole.name;
            userRoleEl.className = `user-role-badge role-${primaryRole.name.toLowerCase()}`;
        }
        
        // Update avatar
        const userAvatarEl = document.getElementById('userAvatar');
        if (userAvatarEl) {
            if (profile?.avatar_url) {
                userAvatarEl.src = profile.avatar_url;
            } else {
                // Initial avatar
                const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                userAvatarEl.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="#4F46E5" width="40" height="40" rx="20"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">${initials}</text></svg>`)}`;
            }
        }
        
        // Update unit/position info jika ada
        const userUnitEl = document.getElementById('userUnit');
        if (userUnitEl && profile?.unit_id) {
            // Fetch unit name jika perlu (placeholder untuk sekarang)
            userUnitEl.textContent = profile.position || '';
        }
        
        debugLog('User info displayed', { 
            name: profile?.full_name, 
            role: primaryRole?.name 
        });
        
    } catch (error) {
        errorLog('Error displaying user info', error);
    }
}

// ==========================================
// EXPORTS & GLOBAL ACCESS
// ============================================

if (typeof window !== 'undefined') {
    window.PamungkasPermissions = {
        // Core functions
        getCurrentUser,
        getCurrentProfile,
        getUserRoles,
        getUserPermissions,
        
        // Checking functions
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasRoleSync,
        isAdminUser,
        hasAnyRole,
        
        // Cache management
        ensurePermissionsLoaded,
        refreshPermissions,
        clearPermissionCache,
        
        // Menu/Sidebar
        filterMenuByPermissions,
        generateSidebarHTML,
        updateSidebarWithPermissions,
        displayUserInfo,
        
        // State access
        getState: () => PermissionState,
        getMenuDefinition: () => MENU_DEFINITION
    };
}

debugLog('Permissions module loaded');
