/* ============================================================
   PAMUNGKAS — RBAC — Role & Permission
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/03-rbac.js
   ============================================================ */

/* ============================================================
 * SISTEM ROLE & HAK AKSES (RBAC) - PAMUNGKAS v7.2
 * Role dari database multiusers.role: superadmin | admin | operator
 * ============================================================ */

/**
 * ROLE_PERMISSIONS - Konfigurasi terpusat hak akses
 * Single source of truth untuk seluruh permission system
 * 
 * Role mapping dari DB (multiusers.role):
 * - superadmin = Full Access (semua 7 modul + bulk_import)
 * - admin      = Pendaftaran + SDMK (kelola data)
 * - user       = Lihat data pendaftaran sendiri (berdasarkan NIK)
 */
const ROLE_PERMISSIONS = {
  // SUPERADMIN = Full Access (semua 7 modul + bulk import)
  superadmin: {
    dashboard: true,
    indikator: ['read', 'create', 'update', 'delete'],
    materi: ['read', 'create', 'update', 'delete'],
    multiusers: ['read', 'create', 'update', 'delete'],
    pendaftaran: ['read', 'create', 'update', 'delete', 'bulk_import'],
    pengumuman: ['read', 'create', 'update', 'delete'],
    sdmk: ['read', 'create', 'update', 'delete'],
    sertifikat: ['read', 'create', 'update', 'delete'],
    user_accounts: ['read', 'create', 'update', 'delete']
  },
  
  // ADMIN = Pendaftaran + SDMK (kelola data)
  admin: {
    dashboard: true,
    pendaftaran: ['read', 'create', 'update', 'delete', 'bulk_import'],
    sdmk: ['read', 'create', 'update', 'delete']
  },
  
  // OPERATOR = Pendaftaran ONLY (kelola data pendaftaran, tanpa bulk import)
  operator: {
    dashboard: true,
    pendaftaran: ['read', 'create', 'update', 'delete']  // No bulk_import for operator
  },
  
  // USER = Hanya lihat data pendaftaran sendiri (berdasarkan NIK)
  user: {
    dashboard: false,
    pendaftaran: ['read']  // Hanya baca, filter by NIK
  }
};

/**
 * SIDEBAR_MENU_CONFIG - Konfigurasi menu sidebar per role
 * Menu yang tidak memiliki permission TIDAK akan dirender
 * Role dari DB: superadmin | admin | operator
 */
const SIDEBAR_MENU_CONFIG = {
  // SUPERADMIN = Full Access (semua menu)
  superadmin: {
    mainMenu: [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', page: 'dashboard' },
      { id: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', page: 'pengumuman' },
      { id: 'profil-sdmk', label: 'Profil SDMK Terlatih', icon: 'fa-user-md', page: 'profil-sdmk' },
      { id: 'pendaftaran', label: 'Pendaftaran', icon: 'fa-clipboard-list', page: 'pendaftaran' },
      { id: 'cek-sertifikat', label: 'Cek Sertifikat', icon: 'fa-certificate', page: 'cek-sertifikat' },
      { id: 'cek-materi', label: 'Cek Materi', icon: 'fa-book-open', page: 'cek-materi' },
      { id: 'cek-pendaftaran', label: 'Cek Pendaftaran', icon: 'fa-search-location', page: 'cek-pendaftaran' }
    ],
    panelAdmin: [
      { id: 'panel-admin-dashboard', label: 'Panel Admin', icon: 'fa-tachometer-alt', page: 'panel-admin' }
    ],
    dataUtama: [
      { id: 'indikator', label: 'Indikator', icon: 'fa-chart-line', module: 'indikator' },
      { id: 'materi', label: 'Materi', icon: 'fa-book-open', module: 'materi' },
      { id: 'sdmk', label: 'SDMK', icon: 'fa-user-md', module: 'sdmk' },
      { id: 'pendaftaran-admin', label: 'Pendaftaran', icon: 'fa-clipboard-list', module: 'pendaftaran' }
    ],
    informasi: [
      { id: 'pengumuman-admin', label: 'Pengumuman', icon: 'fa-bullhorn', module: 'pengumuman' },
      { id: 'sertifikat', label: 'Sertifikat', icon: 'fa-certificate', module: 'sertifikat' }
    ],
    sistem: [
      { id: 'multiusers', label: 'Multiusers', icon: 'fa-users-cog', module: 'multiusers' }
    ]
  },
  
  // ADMIN = Pendaftaran + Sertifikat only
  admin: {
    mainMenu: [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', page: 'dashboard' },
      { id: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', page: 'pengumuman' },
      { id: 'profil-sdmk', label: 'Profil SDMK Terlatih', icon: 'fa-user-md', page: 'profil-sdmk' },
      { id: 'pendaftaran', label: 'Pendaftaran', icon: 'fa-clipboard-list', page: 'pendaftaran' },
      { id: 'cek-sertifikat', label: 'Cek Sertifikat', icon: 'fa-certificate', page: 'cek-sertifikat' },
      { id: 'cek-materi', label: 'Cek Materi', icon: 'fa-book-open', page: 'cek-materi' },
      { id: 'cek-pendaftaran', label: 'Cek Pendaftaran', icon: 'fa-search-location', page: 'cek-pendaftaran' }
    ],
    panelAdmin: [
      { id: 'panel-admin-dashboard', label: 'Panel Admin', icon: 'fa-tachometer-alt', page: 'panel-admin' }
    ],
    dataUtama: [
      { id: 'indikator', label: 'Indikator', icon: 'fa-chart-line', module: 'indikator' },
      { id: 'materi', label: 'Materi', icon: 'fa-book-open', module: 'materi' },
      { id: 'sdmk', label: 'SDMK', icon: 'fa-user-md', module: 'sdmk' },
      { id: 'pendaftaran-admin', label: 'Pendaftaran', icon: 'fa-clipboard-list', module: 'pendaftaran' }
    ],
    informasi: [
      { id: 'pengumuman-admin', label: 'Pengumuman', icon: 'fa-bullhorn', module: 'pengumuman' },
      { id: 'sertifikat', label: 'Sertifikat', icon: 'fa-certificate', module: 'sertifikat' }
    ],
    sistem: [
      { id: 'multiusers', label: 'Multiusers', icon: 'fa-users-cog', module: 'multiusers' }
    ]
  },
  
  // OPERATOR = Pendaftaran ONLY (terbatas)
  operator: {
    mainMenu: [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', page: 'dashboard' },
      { id: 'pendaftaran', label: 'Pendaftaran', icon: 'fa-clipboard-list', page: 'pendaftaran' },
      { id: 'cek-sertifikat', label: 'Cek Sertifikat', icon: 'fa-certificate', page: 'cek-sertifikat' }
    ],
    panelAdmin: [
      { id: 'panel-admin-dashboard', label: 'Panel Admin', icon: 'fa-tachometer-alt', page: 'panel-admin' }
    ],
    dataUtama: [
      { id: 'pendaftaran-admin', label: 'Pendaftaran', icon: 'fa-clipboard-list', module: 'pendaftaran' }
    ],
    informasi: [],  // Tidak ada akses menu informasi
    sistem: []      // Tidak ada akses menu sistem
  },
  
  // USER = Hanya lihat data pendaftaran sendiri
  user: {
    mainMenu: [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', page: 'dashboard' },
      { id: 'pendaftaran', label: 'Pendaftaran Saya', icon: 'fa-clipboard-list', page: 'pendaftaran' }
    ],
    panelAdmin: [],  // Tidak ada akses Panel Admin
    data: []  // Tidak ada menu data
  }
};

/**
 * ROLE_LABELS - Label dan deskripsi untuk setiap role
 * Sesuai dengan nilai di multiusers.role
 */
const ROLE_LABELS = {
  superadmin: {
    name: 'SUPERADMIN',
    description: 'Full Access (7 Data)',
    detail: 'Akses penuh ke semua 7 data dan fitur sistem termasuk Input Massal.',
    icon: 'fa-crown',
    color: '#EF4444',
    bgClass: 'role-superadmin'
  },
  admin: {
    name: 'ADMIN',
    description: 'Pendaftaran & SDMK',
    detail: 'Mengelola data pendaftaran dan SDMK.',
    icon: 'fa-user-shield',
    color: '#0D6EFD',
    bgClass: 'role-admin'
  },
  operator: {
    name: 'OPERATOR',
    description: 'Pendaftaran Only',
    detail: 'Mengelola data pendaftaran (CRUD tanpa import massal).',
    icon: 'fa-user-cog',
    color: '#F59E0B',
    bgClass: 'role-operator'
  },
  user: {
    name: 'USER',
    description: 'Data Sendiri',
    detail: 'Hanya dapat melihat data pendaftaran sendiri berdasarkan NIK.',
    icon: 'fa-user',
    color: '#10B981',
    bgClass: 'role-user'
  }
};

/**
 * VALID_ROLES - Daftar role yang valid (sesuai multiusers.role di database)
 * Role: superadmin (full access), admin (pendaftaran+sdmk), operator (pendaftaran only), user (read-only)
 */
const VALID_ROLES = ['superadmin', 'admin', 'operator', 'user'];

/**
 * hasPermission() - Helper utama untuk pengecekan hak akses
 * @param {string} role - Role user (superadmin, admin, operator)
 * @param {string} module - Module/modul yang diakses
 * @param {string} action - Aksi yang dilakukan (read, create, update, delete, bulk_import)
 * @returns {boolean} - True jika diizinkan, false jika tidak
 */
function hasPermission(role, module, action) {
  // Normalize role to lowercase
  var normalizedRole = (role || '').toLowerCase().trim();
  var normalizedModule = (module || '').toLowerCase().trim();
  var normalizedAction = (action || '').toLowerCase().trim();
  
  // Check if role is valid
  if (!normalizedRole || !VALID_ROLES.includes(normalizedRole)) {
    console.warn('[RBAC] Invalid role:', role);
    return false;
  }
  
  // Get permissions for this role
  var rolePermissions = ROLE_PERMISSIONS[normalizedRole];
  if (!rolePermissions) {
    console.error('[RBAC] No permissions defined for role:', normalizedRole);
    return false;
  }
  
  // Check if module exists in permissions
  var modulePermissions = rolePermissions[normalizedModule];
  if (!modulePermissions) {
    // Module not found = no access
    console.log('[RBAC] Module not found for role:', normalizedRole, '-', normalizedModule);
    return false;
  }
  
  // If it's a boolean (like dashboard: true), return it
  if (typeof modulePermissions === 'boolean') {
    var allowed = modulePermissions;
    console.log('[RBAC] Permission check:', {
      role: normalizedRole,
      module: normalizedModule,
      action: normalizedAction,
      allowed: allowed
    });
    return allowed;
  }
  
  // Check if action is in the array
  var hasAccess = modulePermissions.includes(normalizedAction);
  
  console.log('[RBAC] Permission check:', {
    role: normalizedRole,
    module: normalizedModule,
    action: normalizedAction,
    allowed: hasAccess
  });
  
  return hasAccess;
}

/**
 * getCurrentRole() - Mendapatkan role saat ini
 * @returns {string} Current role or empty string
 */
function getCurrentRole() {
  return currentRole || adminLevel || '';
}

/**
 * isValidRole() - Validasi apakah role valid
 * @param {string} role - Role yang dicek
 * @returns {boolean}
 */
function isValidRole(role) {
  return VALID_ROLES.includes((role || '').toLowerCase().trim());
}

/**
 * normalizeRole() - Normalisasi role dari database ke format standar
 * Database field: multiusers.role
 * Values: 'superadmin', 'admin', 'operator'
 * @param {string} rawRole - Role asli dari database (multiusers.role)
 * @returns {string} Role ternormalisasi (superadmin, admin, operator, atau empty)
 */
function normalizeRole(rawRole) {
  if (!rawRole) return '';
  
  var role = rawRole.toString().toLowerCase().trim();
  
  // Mapping role dari database ke format standar
  // Database multiusers.role values: superadmin, admin, operator
  var roleMapping = {
    // Super Admin variants (Full Access + Bulk Import)
    'superadmin': 'superadmin',
    'super_admin': 'superadmin',
    'super-admin': 'superadmin',
    'root': 'superadmin',
    
    // Admin variants (Pendaftaran + Sertifikat + Bulk Import)
    'admin': 'admin',
    'administrator': 'admin',
    'admin_full': 'admin',
    
    // Operator variants (Pendaftaran ONLY, no bulk_import)
    'operator': 'operator',
    'operator_basic': 'operator',
    'observer': 'operator',      // Legacy observer → operator
    'staff': 'operator',         // Legacy staff → operator
    
    // No Access / Invalid
    'user': '',
    'verifikator': '',
    'guest': '',
    'public': ''
  };
  
  var normalized = roleMapping[role];
  
  // If mapping exists and is valid, return it
  if (normalized !== undefined && (normalized === '' || isValidRole(normalized))) {
    console.log('[RBAC] Role normalized:', rawRole, '→', normalized || '(no access)');
    return normalized;
  }
  
  // If already valid, return as-is
  if (isValidRole(role)) {
    return role;
  }
  
  // Default: empty (no access)
  console.warn('[AUTH] Unknown role normalized to empty:', rawRole, '→', role);
  return '';
}

/* ---------- SISTEM LEVEL ADMIN ---------- */
/* ========== SISTEM LEVEL ADMIN (RBAC v7.1) ===========
 * Role dari database multiusers.level:
 * - admin     : FULL ACCESS - Semua tabel + kelola user
 * - operator  : PENDAFTARAN + SERTIFIKAT saja
 * - user      : Tidak ada akses admin (hanya view publik)
 * Menggunakan hasPermission() untuk pengecekan hak akses
 * ========================================================== */

/**
 * isAdminUser() - Cek apakah user login sebagai admin (any role)
 */
function isAdminUser(){
  var role = getCurrentRole();
  var isValid = isValidRole(role);
  console.log('[AUTH] isAdminUser:', { role, isValid });
  return isValid;
}

/**
 * canWrite() - Cek apakah role memiliki akses tulis pada module
 */
function canWrite(module){
  var role = getCurrentRole();
  if (!role) return false;
  return hasPermission(role, module, 'create') || 
         hasPermission(role, module, 'update') || 
         hasPermission(role, module, 'delete');
}

/**
 * canRead() - Cek apakah role memiliki akses baca pada module
 */
function canRead(module){
  return hasPermission(getCurrentRole(), module, 'read');
}

/**
 * canAccessAdminMenu() - Cek apakah role dapat mengakses menu admin
 */
function canAccessAdminMenu(module){
  var role = getCurrentRole();
  if (!role) return false;
  return canRead(module);
}

/**
 * canCreate(), canUpdate(), canDelete() - Shortcut functions
 */
function canCreate(module) { return hasPermission(getCurrentRole(), module, 'create'); }
function canUpdate(module) { return hasPermission(getCurrentRole(), module, 'update'); }
function canDelete(module) { return hasPermission(getCurrentRole(), module, 'delete'); }

/**
 * levelLabel() - Mendapatkan label role saat ini
 */
function levelLabel(){
  var role = getCurrentRole();
  var labels = ROLE_LABELS[role];
  return labels ? labels.name : '';
}

/**
 * levelDescription() - Mendapatkan deskripsi role
 */
function levelDescription(){
  var role = getCurrentRole();
  var labels = ROLE_LABELS[role];
  return labels ? labels.description : '';
}

/**
 * levelDetail() - Mendapatkan detail deskripsi role
 */
function levelDetail(){
  var role = getCurrentRole();
  var labels = ROLE_LABELS[role];
  return labels ? labels.detail : '';
}

/**
 * levelBadgeHTML() - Generate HTML badge untuk role
 */
function levelBadgeHTML(){
  var role = getCurrentRole();
  if (!role) return '';
  
  var labels = ROLE_LABELS[role];
  if (!labels) return '';
  
  return '<span class="level-badge ' + labels.bgClass + '" style="background:' + labels.color + '20;color:' + labels.color + ';border:1px solid ' + labels.color + '40;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:600;">' +
         '<i class="fas ' + labels.icon + '" style="margin-right:4px;"></i> ' + labels.name + '</span>';
}

/**
 * levelIcon() - Mendapatkan icon class untuk role
 */
function levelIcon(){
  var role = getCurrentRole();
  var labels = ROLE_LABELS[role];
  return labels ? labels.icon : 'fa-user';
}

/**
 * requirePermission() - Helper untuk memblokir aksi tanpa permission
 * Gunakan di awal setiap fungsi CRUD
 */
function requirePermission(module, action) {
  var role = getCurrentRole();
  
  if (!hasPermission(role, module, action)) {
    var actionLabels = {
      create: 'menambah',
      read: 'melihat',
      update: 'mengedit',
      delete: 'menghapus'
    };
    
    showToast('Anda tidak memiliki izin untuk ' + (actionLabels[action] || action) + ' data ' + module + '.', 'error');
    console.error('[RBAC] Access denied:', { role, module, action });
    return false;
  }
  
  return true;
}
