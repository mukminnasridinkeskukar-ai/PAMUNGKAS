/* ============================================================
   PAMUNGKAS — PANEL ADMIN — Statistik & Dashboard Admin (+ CRUD Indikator)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/15-admin-dashboard.js
   ============================================================ */

// Store for Indikator data (global)
var _allIndikator = [];

/**
 * Load real statistics from Nhost for Admin Dashboard
 */
function loadAdminStats() {
  console.log('[ADMIN] Loading dashboard statistics from Nhost...');
  
  var statsContainer = document.getElementById('adminStatsGrid');
  if (!statsContainer) {
    console.warn('[DOM] loadAdminStats: #adminStatsGrid tidak ditemukan');
    return;
  }
  
  var role = getCurrentRole();
  
  // Show loading state
  statsContainer.innerHTML = '<div class="admin-stats-loading"><i class="fas fa-spinner fa-spin"></i> Memuat statistik...</div>';
  
  // Query Nhost for aggregate data
  graphqlRequest('GetDashboardData', GRAPHQL_QUERIES.getDashboardData)
    .then(function(result) {
      console.log('[ADMIN] Dashboard stats response:', result);
      
      if (!result) {
        throw new Error('Response kosong dari Nhost');
      }
      
      // Extract counts from aggregates
      var sdmkCount = result.sdmk_aggregate?.aggregate?.count || 0;
      var pendaftaranCount = result.pendaftaran_aggregate?.aggregate?.count || 0;
      var sertifikatCount = result.sertifikat_aggregate?.aggregate?.count || 0;
      var pengumumanCount = (result.pengumuman || []).length;
      var indikatorCount = (result.indikator || []).length;
      
      // Build statistics data array
      var allStats = [
        { type: 'sdmk', label: 'Total SDMK', count: sdmkCount, icon: 'fa-user-md', color: 'var(--primary)', module: 'sdmk' },
        { type: 'pendaftaran', label: 'Pendaftaran', count: pendaftaranCount, icon: 'fa-clipboard-list', color: 'var(--secondary)', module: 'pendaftaran' },
        { type: 'sertifikat', label: 'Sertifikat', count: sertifikatCount, icon: 'fa-certificate', color: 'var(--accent)', module: 'sertifikat' },
        { type: 'pengumuman', label: 'Pengumuman', count: pengumumanCount, icon: 'fa-bullhorn', color: '#8B5CF6', module: 'pengumuman' },
        { type: 'indikator', label: 'Indikator', count: indikatorCount, icon: 'fa-chart-line', color: '#06B6D4', module: 'indikator' }
      ];
      
      // FILTER statistics based on role permissions
      var visibleStats = allStats.filter(function(stat) {
        return hasPermission(role, stat.module, 'read');
      });
      
      console.log('[ADMIN] Filtered statistics for role ' + role + ':', visibleStats.length, 'of', allStats.length, 'cards');
      
      // Render filtered statistics cards
      var html = '';
      if (visibleStats.length === 0) {
        html = '<div class="empty-state" style="padding:20px;"><i class="fas fa-chart-bar" style="font-size:2rem;color:var(--text-muted);"></i><p style="margin-top:8px;">Tidak ada statistik yang dapat ditampilkan untuk role ini.</p></div>';
      } else {
        visibleStats.forEach(function(stat) {
          html += createStatCard(stat.type, stat.label, stat.count, stat.icon, stat.color);
        });
      }
      
      statsContainer.innerHTML = html;
      
      console.log('[ADMIN] Statistics loaded successfully:', visibleStats.length, 'cards rendered');
    })
    .catch(function(error) {
      console.error('[ADMIN] Failed to load statistics:', error);
      statsContainer.innerHTML = `
        <div class="admin-stats-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Gagal memuat statistik dari Nhost</p>
          <small>${escHTML(error.message || 'Unknown error')}</small>
        </div>
      `;
    });
}

/**
 * Create a statistic card for dashboard
 */
function createStatCard(type, label, count, icon, color) {
  return `
    <div class="admin-stat-card" onclick="openAdminCrud('${type}')" title="Klik untuk kelola ${label}">
      <div class="admin-stat-icon" style="background: ${color}20; color: ${color};">
        <i class="fas ${icon}"></i>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-count">${count.toLocaleString('id-ID')}</span>
        <span class="admin-stat-label">${label}</span>
      </div>
      <i class="fas fa-chevron-right admin-stat-arrow" style="color: ${color};"></i>
    </div>
  `;
}

/**
 * Main render function for Admin Dashboard
 * Shows: User info + Real Stats + Menu Grid organized by category
 */
function renderAdminDashboard(){
  console.log('[ADMIN] Rendering admin dashboard...');
  
  var role = getCurrentRole();
  var displayName = (currentUser && currentUser.nama_lengkap) ? currentUser.nama_lengkap : adminUsername;
  
  // 1. Render user info bar with DYNAMIC role badge
  var bar = document.getElementById('adminInfoBar');
  if (bar) {
    bar.innerHTML = '<div class="admin-info-bar">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<i class="fas ' + levelIcon() + '" style="font-size:1.5rem;color:' + (ROLE_LABELS[role] ? ROLE_LABELS[role].color : 'var(--primary)') + ';"></i>' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<strong style="font-size:1.1rem;">' + escHTML(displayName) + '</strong>' +
            levelBadgeHTML() +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span class="level-badge ' + (ROLE_LABELS[role] ? ROLE_LABELS[role].bgClass : '') + '" style="font-size:.7rem;padding:2px 8px;border-radius:4px;background:' + (ROLE_LABELS[role] ? ROLE_LABELS[role].color : '#666') + ';color:#fff;font-weight:600;">' +
            (ROLE_LABELS[role] ? ROLE_LABELS[role].name : 'UNKNOWN') +
            '</span>' +
            '<span style="font-size:.78rem;color:var(--text-secondary);">' +
            (ROLE_LABELS[role] ? ROLE_LABELS[role].description : '') +
            '</span>' +
          '</div>' +
          '<span style="font-size:.75rem;color:var(--text-muted);display:block;margin-top:4px;">' +
          (ROLE_LABELS[role] ? ROLE_LABELS[role].detail : '') +
          '</span>' +
        '</div>' +
      '</div></div>';
  } else {
    console.warn('[DOM] renderAdminDashboard: #adminInfoBar tidak ditemukan');
  }
  
  // 2. Load real statistics from Nhost (filtered by role)
  loadAdminStats();
  
  // 3. Render menu grid - SEMUA 7 TABEL NHOST BERURUTAN (tanpa kategori)
  var grid = document.getElementById('adminMenuGrid');
  if (!grid) {
    console.warn('[DOM] renderAdminDashboard: #adminMenuGrid tidak ditemukan');
    return;
  }
  
  var html = '';
  var visibleMenuCount = 0;
  var cards = '';

  // Urutan tabel sesuai permintaan: 7 tabel Nhost berurutan
  var tableOrder = ['indikator', 'sdmk', 'pendaftaran', 'materi', 'pengumuman', 'sertifikat', 'multiusers'];
  
  tableOrder.forEach(function(tableId) {
    var tableConfig = ADMIN_TABLES[tableId];
    if (!tableConfig) {
      console.warn('[ADMIN] Table config not found:', tableId);
      return;
    }
    
    // Check access permissions using RBAC system
    var hasAccess = hasPermission(role, tableConfig.id, 'read');
    var canWriteTable = hasPermission(role, tableConfig.id, 'create');
    
    // Special check for multiusers (requires superadmin access)
    if (tableConfig.id === 'multiusers' && role !== 'superadmin') {
      hasAccess = false;
    }
    
    // Untuk admin/superadmin/operator, berikan akses sesuai permission
    if (role === 'admin' || role === 'superadmin' || role === 'operator') {
      // Override hasAccess based on actual permissions for operator
      if (role === 'operator') {
        // Operator hanya mendapat akses jika explicitly diizinkan
        hasAccess = hasPermission(role, tableConfig.id, 'read');
        canWriteTable = hasPermission(role, tableConfig.id, 'create');
      } else {
        // Admin & superadmin selalu full access
        hasAccess = true;
        canWriteTable = true;
      }
    }
    
    if (!hasAccess) return;
    
    visibleMenuCount++;
    
    // Badge CRUD (semua tabel bisa CRUD)
    var writeBadge = canWriteTable 
      ? '<span class="badge badge-success" style="background:var(--secondary);color:#fff;padding:3px 8px;border-radius:4px;font-size:.7rem;"><i class="fas fa-check-circle" style="margin-right:3px;"></i>CRUD</span>'
      : '<span class="badge badge-secondary" style="background:var(--text-muted);color:#fff;padding:3px 8px;border-radius:4px;font-size:.7rem;"><i class="fas fa-eye" style="margin-right:3px;"></i>Read Only</span>';
    
    // Warna icon berbeda per tabel
    var iconColors = {
      'indikator': 'background:#FEF3C7;color:#D97706',
      'sdmk': 'background:#DBEAFE;color:#2563EB',
      'pendaftaran': 'background:#DCFCE7;color:#16A34A',
      'materi': 'background:#F3E8FF;color:#9333EA',
      'pengumuman': 'background:#FFE4E6;color:#DC2626',
      'sertifikat': 'background:#FFEDD5;color:#EA580C',
      'multiusers': 'background:#E0E7FF;color:#4F46E5'
    };
    var iconStyle = iconColors[tableConfig.id] || 'background:var(--primary-light);color:var(--primary)';
    
    cards += '<div class="admin-menu-card" onclick="openAdminCrud(\'' + tableConfig.id + '\')" style="cursor:pointer;transition:transform .2s;">';
    cards += '  <div class="admin-menu-card-icon" style="' + iconStyle + '"><i class="fas ' + tableConfig.icon + '"></i></div>';
    cards += '  <div class="admin-menu-card-content">';
    cards += '    <h4>' + tableConfig.label + '</h4>';
    cards += '    <p>' + tableConfig.description + '</p>';
    cards += '    ' + writeBadge;
    cards += '  </div>';
    cards += '</div>';
  });
  
  // Header dengan jumlah modul sesuai role (dinamis, bukan hardcoded "7 Tabel")
  html += '<div class="admin-category-header" style="color:var(--primary);margin-bottom:10px;">';
  html += '  <i class="fas fa-table"></i> <h3>MODUL DATA (' + visibleMenuCount + ' Tabel)</h3>';
  html += '</div>';
  html += '<div class="admin-category-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px,1fr));">';
  html += cards;
  html += '</div>'; // end grid
  
  grid.innerHTML = html;
  console.log('[ADMIN] Dashboard rendered with', visibleMenuCount, '/ 7 tables for role:', role);
}

/* ---------- CRUD INDIKATOR ---------- */

/**
 * Load Indikator list specifically (with proper CRUD support)
 */
function loadIndikatorList() {
  console.log('[ADMIN] Loading Indikator data from Nhost...');
  
  showLoading('Memuat data Indikator...');
  
  callServer('getIndikator').then(function(res) {
    hideLoading();
    
    var ct = document.getElementById('adminCrudTable');
    if (!ct) { console.warn('[DOM] loadIndikatorList: #adminCrudTable tidak ditemukan'); return; }
    
    if (!res || !res.success) {
      ct.innerHTML = '<div class="empty-state"><p>' + escHTML(res ? res.message : 'Gagal memuat data Indikator') + '</p></div>';
      return;
    }
    
    _allIndikator = res.data || [];
    console.log('[ADMIN] Indikator data loaded:', _allIndikator.length, 'items');
    
    var html = '';
    
    // Add button
    if (canWrite('indikator')) {
      html += '<div class="toolbar" style="margin-bottom:16px;">';
      html += '  <button class="btn btn-primary" onclick="openIndikatorForm()"><i class="fas fa-plus"></i> Tambah Indikator</button>';
      html += '  <button class="btn btn-secondary ml-2" onclick="loadIndikatorList()"><i class="fas fa-sync-alt"></i> Refresh</button>';
      html += '</div>';
    }
    
    if (_allIndikator.length === 0) {
      html += '<div class="empty-state">';
      html += '  <i class="fas fa-chart-line" style="font-size:2rem;color:var(--text-muted);"></i>';
      html += '  <p>Belum ada data Indikator.</p>';
      html += '  <small>Tambahkan indikator kinerja untuk memulai.</small>';
      html += '</div>';
      ct.innerHTML = html;
      return;
    }
    
    // Render table
    html += '<div class="crud-table-container"><div class="crud-table-scroll">';
    html += '<table class="crud-table">';
    html += '<thead><tr>';
    html += '<th class="no-sort" style="text-align:center;width:50px;">No</th>';
    html += '<th>Indikator</th>';
    html += '<th>Nilai</th>';
    html += '<th>Target</th>';
    html += '<th>Satuan</th>';
    html += '<th>Periode</th>';
    if (canWrite('indikator')) {
      html += '<th class="no-sort" style="text-align:center;">Aksi</th>';
    }
    html += '</tr></thead><tbody>';
    
    _allIndikator.forEach(function(item, idx) {
      html += '<tr>';
      html += '<td class="td-no">' + (idx + 1) + '</td>';
      html += '<td><strong>' + escHTML(item.indikator || item.Indikator || '-') + '</strong></td>';
      html += '<td>' + (item.nilai !== null && item.nilai !== undefined ? item.nilai : '-') + '</td>';
      html += '<td>' + (item.target !== null && item.target !== undefined ? item.target : '-') + '</td>';
      html += '<td>' + escHTML(item.satuan || item.Satuan || '-') + '</td>';
      html += '<td>' + escHTML(item.periode || item.Periode || '-') + '</td>';
      if (canWrite('indikator')) {
        html += '<td style="text-align:center;">';
        html += '  <button class="btn btn-sm btn-warning" onclick="openIndikatorForm(' + idx + ')" title="Edit"><i class="fas fa-edit"></i></button>';
        html += '  <button class="btn btn-sm btn-danger" onclick="confirmDeleteIndikator(' + idx + ')" title="Hapus"><i class="fas fa-trash"></i></button>';
        html += '</td>';
      }
      html += '</tr>';
    });
    
    html += '</tbody></table></div></div>';
    html += '<div class="table-info">Total: ' + _allIndikator.length + ' data indikator</div>';
    
    ct.innerHTML = html;
    
  }).catch(function(e) {
    hideLoading();
    console.error('[ADMIN] Error loading Indikator:', e);
    showToast('Error: ' + (e.message || e), 'error');
  });
}

/**
 * Open form to add/edit Indikator
 */
function openIndikatorForm(idx) {
  console.log('[ADMIN] Opening Indikator form, index:', idx);
  
  var editMode = idx !== undefined;
  var item = editMode ? _allIndikator[idx] : null;
  
  // Set form values
  _safeValue('indikatorEditIndex', idx !== undefined ? idx : -1);
  _safeText('indikatorFormTitle', editMode ? 'Edit Indikator' : 'Tambah Indikator Baru');
  
  if (editMode && item) {
    _safeValue('indikatorNama', item.indikator || '');
    _safeValue('indikatorNilai', item.nilai !== null ? item.nilai : '');
    _safeValue('indikatorTarget', item.target !== null ? item.target : '');
    _safeValue('indikatorSatuan', item.satuan || 'Orang');
    _safeValue('indikatorPeriode', item.periode || '');
  } else {
    // Reset form
    _safeValue('indikatorNama', '');
    _safeValue('indikatorNilai', '');
    _safeValue('indikatorTarget', '');
    _safeValue('indikatorSatuan', 'Orang');
    _safeValue('indikatorPeriode', '');
  }
  
  openModal('indikatorFormModal');
}

/**
 * Submit Indikator form (Create/Update)
 */
function submitIndikatorForm(e) {
  e.preventDefault();
  
  console.log('[ADMIN] Submitting Indikator form...');
  
  var idx = parseInt(_safeValue('indikatorEditIndex'));
  var isEdit = idx >= 0;
  
  var data = {
    indikator: _safeValue('indikatorNama'),
    nilai: _safeValue('indikatorNilai'),
    target: _safeValue('indikatorTarget'),
    satuan: _safeValue('indikatorSatuan'),
    periode: _safeValue('indikatorPeriode')
  };
  
  // Validation
  if (!data.indikator) {
    showToast('Nama indikator wajib diisi!', 'warning');
    return;
  }
  
  showLoading(isEdit ? 'Menyimpan perubahan...' : 'Menambahkan indikator...');
  
  var action = isEdit ? 'updateIndikator' : 'tambahIndikator';
  var payload = isEdit ? { idx: idx, id: _allIndikator[idx]?.id, ...data } : data;
  
  callServer(action, payload).then(function(res) {
    hideLoading();
    closeModal('indikatorFormModal');
    
    if (res.success) {
      showToast(res.message, 'success');
      loadIndikatorList(); // Refresh from Nhost
      loadAdminStats(); // Update dashboard stats
    } else {
      showToast(res.message || 'Operasi gagal', 'error');
    }
  }).catch(function(err) {
    hideLoading();
    console.error('[ADMIN] Indikator form error:', err);
    showToast('Error: ' + (err.message || err), 'error');
  });
}

/**
 * Confirm and delete Indikator
 */
function confirmDeleteIndikator(idx) {
  var item = _allIndikator[idx];
  if (!item) return;

  var itemName = item.indikator || 'Indikator #' + (idx + 1);

  if (confirm('Apakah Anda yakin ingin menghapus indikator "' + itemName + '"?')) {
    console.log('[ADMIN] Deleting Indikator:', idx, item.id);

    showLoading('Menghapus indikator...');

    callServer('deleteIndikator', { idx: idx, id: item.id }).then(function(res) {
      hideLoading();

      if (res.success) {
        showToast(res.message, 'success');
        loadIndikatorList(); // Refresh from Nhost
        loadAdminStats(); // Update dashboard stats
      } else {
        showToast(res.message || 'Gagal menghapus', 'error');
      }
    }).catch(function(err) {
      hideLoading();
      console.error('[ADMIN] Delete Indikator error:', err);
      showToast('Error: ' + (err.message || err), 'error');
    });
  }
}

/* ============================================================
   ADMIN PANEL FRAME — Satu frame, beberapa tab
   (Ringkasan + tab modul data; menggantikan sub-halaman terpisah)
   ============================================================ */

// Tab aktif terakhir (persist selama sesi login)
var _adminPanelActiveTab = 'ringkasan';

/**
 * ADMIN_PANEL_TABS - Konfigurasi tab Panel Admin (single source of truth).
 * Urutan modul = urutan 7 tabel Nhost: indikator, sdmk, pendaftaran,
 * materi, pengumuman, sertifikat, multiusers.
 */
var ADMIN_PANEL_TABS = [
  { id: 'ringkasan',   label: 'Ringkasan',   icon: 'fa-tachometer-alt' },
  { id: 'indikator',   label: 'Indikator',   icon: 'fa-chart-line',     module: 'indikator' },
  { id: 'sdmk',        label: 'SDMK',        icon: 'fa-user-md',        module: 'sdmk' },
  { id: 'pendaftaran', label: 'Pendaftaran', icon: 'fa-clipboard-list', module: 'pendaftaran' },
  { id: 'materi',      label: 'Materi',      icon: 'fa-book-open',      module: 'materi' },
  { id: 'pengumuman',  label: 'Pengumuman',  icon: 'fa-bullhorn',       module: 'pengumuman' },
  { id: 'sertifikat',  label: 'Sertifikat',  icon: 'fa-certificate',    module: 'sertifikat' },
  { id: 'multiusers',  label: 'Multiusers',  icon: 'fa-users-cog',      module: 'multiusers', superadminOnly: true }
];

/**
 * getAdminPanelTabs() - Daftar tab yang terlihat untuk role saat ini (RBAC).
 * Tab tanpa permission TIDAK dirender sama sekali.
 */
function getAdminPanelTabs() {
  var role = getCurrentRole();
  return ADMIN_PANEL_TABS.filter(function(tab) {
    if (!tab.module) return true; // Ringkasan selalu tampil
    if (tab.superadminOnly && role !== 'superadmin') return false;
    return hasPermission(role, tab.module, 'read');
  });
}

/**
 * renderAdminPanel() - Render seluruh frame Panel Admin (tab bar + panel).
 * Dipanggil dari navigateTo('panel-admin').
 */
function renderAdminPanel() {
  if (!isAdminUser()) return;
  console.log('[ADMIN PANEL] Rendering frame (tab aktif: ' + _adminPanelActiveTab + ')');

  // Badge role di header frame
  _safeHTML('adminPanelRoleBadge', levelBadgeHTML());

  // Validasi: tab terakhir mungkin tidak tersedia lagi untuk role ini
  var stillThere = getAdminPanelTabs().some(function(t) { return t.id === _adminPanelActiveTab; });
  if (!stillThere) _adminPanelActiveTab = 'ringkasan';

  renderAdminPanelTabs();
  switchAdminTab(_adminPanelActiveTab);
}

/**
 * renderAdminPanelTabs() - Bangun tab bar + container panel di dalam frame.
 * Panel modul berupa wadah kosong; kontennya diisi lazy oleh
 * loadAdminModuleTab() setiap tab dibuka (data selalu fresh dari Nhost).
 */
function renderAdminPanelTabs() {
  var tabsBar = document.getElementById('adminPanelTabs');
  var panelsWrap = document.getElementById('adminTabPanels');
  if (!tabsBar || !panelsWrap) {
    console.warn('[DOM] renderAdminPanelTabs: #adminPanelTabs / #adminTabPanels tidak ditemukan');
    return;
  }

  var tabs = getAdminPanelTabs();

  // --- Tab bar ---
  var btns = '';
  tabs.forEach(function(tab) {
    btns += '<button class="admin-panel-tab' + (tab.id === _adminPanelActiveTab ? ' active' : '') + '"' +
      ' id="apt-' + tab.id + '" role="tab" data-tab="' + tab.id + '"' +
      ' onclick="switchAdminTab(\'' + tab.id + '\')">' +
      '<i class="fas ' + tab.icon + '"></i><span>' + tab.label + '</span></button>';
  });
  tabsBar.innerHTML = btns;

  // --- Panel containers ---
  var panels = '';
  tabs.forEach(function(tab) {
    if (tab.id === 'ringkasan') {
      // Panel ringkasan: info user + statistik real + menu grid (ID dipertahankan utk kompatibilitas)
      // Catatan: #adminMenuGrid TANPA class .admin-grid — grid ditangani .admin-category-grid di dalamnya
      panels += '<div class="admin-tab-panel' + (tab.id === _adminPanelActiveTab ? ' active' : '') + '" id="panel-ringkasan">' +
        '<div id="adminInfoBar"></div>' +
        '<div id="adminStatsGrid" class="admin-stats-grid"></div>' +
        '<div id="adminMenuGrid"></div>' +
        '</div>';
    } else {
      panels += '<div class="admin-tab-panel' + (tab.id === _adminPanelActiveTab ? ' active' : '') + '" id="panel-' + tab.id + '"></div>';
    }
  });
  panelsWrap.innerHTML = panels;
}

/**
 * switchAdminTab(tabId) - Pindah tab di dalam frame Panel Admin.
 * - Ringkasan  : render info bar + statistik + menu grid.
 * - Tab modul  : panel modul lain dikosongkan (mencegah ID ganda di DOM),
 *                lalu konten dimuat ulang (fresh data dari Nhost).
 */
function switchAdminTab(tabId) {
  console.log('[ADMIN PANEL] Switch tab →', tabId);
  _adminPanelActiveTab = tabId;

  // State tombol tab
  document.querySelectorAll('#adminPanelTabs .admin-panel-tab').forEach(function(b) {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  // State panel
  document.querySelectorAll('#adminTabPanels .admin-tab-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'panel-' + tabId);
  });

  if (tabId === 'ringkasan') {
    updateAdminSidebarHighlight(null);
    renderAdminDashboard();
    return;
  }

  // Kosongkan panel modul lain agar tidak ada duplikasi #adminCrudTable dsb.
  document.querySelectorAll('#adminTabPanels .admin-tab-panel').forEach(function(p) {
    if (p.id !== 'panel-' + tabId && p.id !== 'panel-ringkasan') p.innerHTML = '';
  });

  updateAdminSidebarHighlight(tabId);
  if (typeof loadAdminModuleTab === 'function') loadAdminModuleTab(tabId);
}

/**
 * updateAdminSidebarHighlight(tabId) - Sinkronkan highlight sidebar dengan tab aktif.
 * tabId null → highlight item "Panel Admin"; selain itu → item modul terkait.
 */
function updateAdminSidebarHighlight(tabId) {
  document.querySelectorAll('.nav-item').forEach(function(i) { i.classList.remove('active'); });
  var modItem = tabId ? document.querySelector('.nav-item[data-admin-tab="' + tabId + '"]') : null;
  if (modItem) { modItem.classList.add('active'); return; }
  var panelItem = document.querySelector('.nav-item[data-page="panel-admin"]');
  if (panelItem) panelItem.classList.add('active');
}
