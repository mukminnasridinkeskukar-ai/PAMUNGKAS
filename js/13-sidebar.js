/* ============================================================
   PAMUNGKAS — SIDEBAR (Toggle, Mobile, Render 3 Grup: Dashboard/Layanan/Admin)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/13-sidebar.js
   ============================================================ */

/* ========== SIDEBAR ========== */
function toggleSidebar(){
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
  else console.warn('[DOM] toggleSidebar: #sidebar tidak ditemukan');
}
function toggleMobileSidebar(){
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('mobile-open');
  else console.warn('[DOM] toggleMobileSidebar: #sidebar tidak ditemukan');
  if (overlay) overlay.classList.toggle('active');
  else console.warn('[DOM] toggleMobileSidebar: #sidebarOverlay tidak ditemukan');
}
function closeMobileSidebar(){
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');
}
// Safe event listener for sidebar overlay
(function() {
  var overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);
  else console.warn('[DOM] Init: #sidebarOverlay tidak ditemukan untuk event listener');
})();

/* ========== DYNAMIC SIDEBAR (RBAC - 3 GRUP: DASHBOARD / LAYANAN / ADMIN) ========== */

/*
 * Pengelompokan ulang (v7.4):
 *   - DASHBOARD : Dashboard + Pengumuman + Profil SDMK Terlatih
 *   - LAYANAN   : Pendaftaran + Cek Sertifikat + Cek Materi + Cek Pendaftaran
 * Menu di grup DASHBOARD (selain Dashboard itu sendiri) dikontrol DASHBOARD_GROUP_PAGES.
 * Untuk user yang login, partisi tetap mengikuti mainMenu di SIDEBAR_MENU_CONFIG
 * (RBAC per role tetap berlaku — halaman yang tidak diizinkan role tidak muncul).
 */
var DASHBOARD_GROUP_PAGES = { 'pengumuman': true, 'profil-sdmk': true };

/**
 * renderDynamicSidebar() - Render sidebar dengan 3 bagian grup:
 *   1. DASHBOARD - dashboard, pengumuman & profil SDMK terlatih
 *   2. LAYANAN   - layanan publik (pendaftaran, cek sertifikat, cek materi, cek pendaftaran)
 *   3. ADMIN     - login admin / panel admin & kelola data (sesuai role)
 * Menu yang tidak memiliki permission TIDAK akan dirender sama sekali.
 * Dipanggil setelah login, logout, atau perubahan role.
 */
function renderDynamicSidebar() {
  var sidebarNav = document.getElementById('sidebarNav');
  if (!sidebarNav) {
    console.warn('[DOM] renderDynamicSidebar: #sidebarNav tidak ditemukan');
    return;
  }

  var role = getCurrentRole();
  console.log('[ADMIN] Rendering sidebar (grup: Dashboard/Layanan/Admin; pengumuman & profil SDMK di grup Dashboard) untuk role:', role);

  var html = '';
  var visibleMenus = [];

  /* ===== GRUP 1: DASHBOARD (Dashboard + Pengumuman + Profil SDMK Terlatih) ===== */
  var dashboardItems = [];
  var layanan = [];
  if (!role || !isValidRole(role)) {
    // Menu publik (belum login)
    dashboardItems = [
      { page: 'pengumuman',  icon: 'fa-bullhorn', label: 'Pengumuman' },
      { page: 'profil-sdmk', icon: 'fa-user-md',  label: 'Profil SDMK Terlatih' }
    ];
    layanan = [
      { page: 'pendaftaran',     icon: 'fa-clipboard-list',  label: 'Pendaftaran' },
      { page: 'cek-sertifikat',  icon: 'fa-certificate',     label: 'Cek Sertifikat' },
      { page: 'cek-materi',      icon: 'fa-book-open',       label: 'Cek Materi' },
      { page: 'cek-pendaftaran', icon: 'fa-search-location', label: 'Cek Pendaftaran' }
    ];
  } else {
    // Partisi mainMenu role: item grup DASHBOARD vs LAYANAN (RBAC tetap dari config)
    var mc = SIDEBAR_MENU_CONFIG[role];
    if (mc && mc.mainMenu) {
      mc.mainMenu.forEach(function(menu) {
        if (menu.page === 'dashboard') return; // Dashboard sudah dirender di bawah
        if (DASHBOARD_GROUP_PAGES[menu.page]) dashboardItems.push(menu);
        else layanan.push(menu);
      });
    }
  }

  html += '<div class="nav-label">Dashboard</div>';
  html += '<a class="nav-item" data-page="dashboard" onclick="navigateTo(\'dashboard\')"><i class="fas fa-th-large"></i><span>Dashboard</span></a>';
  visibleMenus.push('Dashboard');
  dashboardItems.forEach(function(menu) {
    html += '<a class="nav-item" data-page="' + menu.page + '" onclick="navigateTo(\'' + menu.page + '\')"><i class="fas ' + menu.icon + '"></i><span>' + menu.label + '</span></a>';
    visibleMenus.push(menu.label);
  });

  /* ===== GRUP 2: LAYANAN ===== */
  if (layanan.length > 0) {
    html += '<div class="nav-divider"></div>';
    html += '<div class="nav-label">Layanan</div>';
    layanan.forEach(function(menu) {
      html += '<a class="nav-item" data-page="' + menu.page + '" onclick="navigateTo(\'' + menu.page + '\')"><i class="fas ' + menu.icon + '"></i><span>' + menu.label + '</span></a>';
      visibleMenus.push(menu.label);
    });
  }

  /* ===== GRUP 3: ADMIN ===== */
  html += '<div class="nav-divider"></div>';
  html += '<div class="nav-label">Admin</div>';

  if (!role || !isValidRole(role)) {
    // Belum login: hanya tombol Login Admin
    html += '<a class="nav-item" onclick="openLoginModal()"><i class="fas fa-lock"></i><span>Login Admin</span></a>';
    visibleMenus.push('Login Admin');
  } else {
    var menuConfig = SIDEBAR_MENU_CONFIG[role];
    if (!menuConfig) {
      console.error('[RBAC] No menu config for role:', role);
      sidebarNav.innerHTML = html;
      return;
    }

    // 3a. Dashboard Admin (panel-admin)
    if (menuConfig.panelAdmin && menuConfig.panelAdmin.length > 0) {
      menuConfig.panelAdmin.forEach(function(menu) {
        html += '<a class="nav-item" data-page="' + menu.page + '" onclick="navigateTo(\'' + menu.page + '\')"><i class="fas ' + menu.icon + '"></i><span>' + menu.label + '</span></a>';
        visibleMenus.push(menu.label);
      });
    }

    // 3b. Modul kelola data (CRUD per modul, sesuai permission) → tab di frame Panel Admin
    // data-admin-tab dipakai untuk highlight sidebar sesuai tab aktif
    var groups = [
      ['dataUtama', 'Data Utama'],
      ['informasi', 'Informasi'],
      ['sistem',    'Sistem']
    ];
    groups.forEach(function(grp) {
      var items = menuConfig[grp[0]] || menuConfig[grp[1]] || [];
      items.forEach(function(menu) {
        if (hasPermission(role, menu.module, 'read')) {
          html += '<a class="nav-item" data-admin-tab="' + menu.module + '" onclick="openAdminCrud(\'' + menu.module + '\')"><i class="fas ' + menu.icon + '"></i><span>' + menu.label + '</span></a>';
          visibleMenus.push(menu.label);
        }
      });
    });

    // 3c. Logout
    html += '<a class="nav-item" onclick="handleLogout()" style="color:var(--danger);"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a>';
    visibleMenus.push('Logout');
  }

  sidebarNav.innerHTML = html;

  console.log('[ADMIN] Visible menus for ' + (role || 'public') + ':', visibleMenus);
  if (role && isValidRole(role)) {
    console.log('[AUTH] Current user:', currentUser);
    console.log('[AUTH] Current role:', currentRole);
    console.log('[AUTH] Permissions:', ROLE_PERMISSIONS[role]);
  }
}

/**
 * initSidebar() - Initialize sidebar on page load
 * Called from DOMContentLoaded or after app initialization
 */
function initSidebar() {
  console.log('[ADMIN] Initializing sidebar...');
  renderDynamicSidebar();
}
