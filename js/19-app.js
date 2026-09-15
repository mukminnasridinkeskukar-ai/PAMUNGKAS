/* ============================================================
   PAMUNGKAS — APP BOOTSTRAP (Navigasi, Handler Global, Restore Sesi & Init)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/19-app.js
   ============================================================ */

/* ========== NAVIGASI ========== */
function navigateTo(page){
  currentPage=page;
  document.querySelectorAll('.nav-item').forEach(function(i){i.classList.remove('active');if(i.getAttribute('data-page')===page)i.classList.add('active');});
  document.querySelectorAll('.page-section').forEach(function(s){s.classList.remove('active');});
  var t=document.getElementById('page-'+page);if(t)t.classList.add('active');
  // Safety: Triple-check pageConfig availability
if(typeof pageConfig==='undefined' || !pageConfig || typeof window.pageConfig==='undefined'){
  // Emergency fallback - should NEVER reach here with super fix
  var pageConfig=window.pageConfig||{
    'dashboard':{title:'Dashboard',subtitle:''},'pengumuman':{title:'Pengumuman',subtitle:''},
    'profil-sdmk':{title:'Profil SDMK',subtitle:''},'pendaftaran':{title:'Pendaftaran',subtitle:''},
    'cek-sertifikat':{title:'Cek Sertifikat',subtitle:''},'cek-materi':{title:'Cek Materi',subtitle:''},
    'cek-pendaftaran':{title:'Cek Pendaftaran',subtitle:''},'panel-admin':{title:'Panel Admin',subtitle:''}
  };
  if(!window.pageConfig) window.pageConfig = pageConfig;
  console.warn('[INFO] Using pageConfig fallback - this is normal on first load');
}
var c=pageConfig[page]||{title:page,subtitle:''};
_safeText('topbarTitle', c.title);
_safeText('topbarSubtitle', c.subtitle);
closeMobileSidebar();
  // Muat data halaman
  switch(page){
    case 'dashboard':loadDashboard();break;
    case 'pengumuman':loadPengumuman();break;
    case 'profil-sdmk':loadSDMK();break;
    case 'pendaftaran':loadPendaftaran();break;
    case 'cek-sertifikat':loadCekSertifikat();break;
    case 'cek-materi':loadCekMateriPublic();break;
    case 'cek-pendaftaran':initCekPendaftaran();break;
    case 'panel-admin':updateAdminView();break;
  }
  // Panel Admin: SATU FRAME multi-tab (Ringkasan + modul data sesuai role)
  if(page === 'panel-admin'){
    _safeDisplay('adminContent', isAdminUser() ? 'none' : 'block');
    _safeDisplay('adminPanelFrame', isAdminUser() ? 'block' : 'none');
    if(isAdminUser() && typeof renderAdminPanel === 'function') renderAdminPanel();
  }
}

/* ========== MODAL OVERLAY CLICK & ESC ========== */
// Safe modal overlay event listeners
(function() {
  var overlays = document.querySelectorAll('.modal-overlay');
  if (overlays.length > 0) {
    overlays.forEach(function(o){ 
      o.addEventListener('click', function(e){ 
        if (e.target === o) o.classList.remove('active'); 
      }); 
    });
  } else {
    console.warn('[DOM] Init: Tidak ada .modal-overlay yang ditemukan');
  }
})();

document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(function(m){ m.classList.remove('active'); });
    closeDashLightbox();
    closeSDMKLightbox();
    if (typeof closeCekRegLightbox === 'function') closeCekRegLightbox();
  }
});

// Safe lightbox event listeners
(function() {
  var dashLightbox = document.getElementById('dashLightbox');
  if (dashLightbox) dashLightbox.addEventListener('click', function(e){ if (e.target === this) closeDashLightbox(); });
  
  var sdmkLightbox = document.getElementById('sdmkLightbox');
  if (sdmkLightbox) sdmkLightbox.addEventListener('click', function(e){ if (e.target === this) closeSDMKLightbox(); });
})();

function closeSDMKLightbox(){
  var lb = document.getElementById('sdmkLightbox');
  if (lb) lb.classList.remove('active');
  else console.warn('[DOM] closeSDMKLightbox: #sdmkLightbox tidak ditemukan');
  
  var lbImg = document.getElementById('sdmkLightboxImg');
  if (lbImg) lbImg.src = '';
  
  document.body.style.overflow = '';
}

/* ========== SESSION RESTORATION (RBAC) ==========
 * Restore user session on page load
 * Called automatically when DOM is ready
 * ============================================================ */
function restoreUserSession() {
  console.log('[AUTH] Restoring user session...');
  
  // Check for existing session
  var savedLevel = sessionStorage.getItem('pamungkas_admin_level');
  var savedUser = sessionStorage.getItem('pamungkas_admin_user');
  var savedRole = sessionStorage.getItem('pamungkas_current_role');
  var savedCurrentUser = sessionStorage.getItem('pamungkas_current_user');
  
  if (savedLevel && savedUser) {
    // Restore state variables
    adminLevel = savedLevel;
    adminUsername = savedUser;
    currentRole = savedRole || normalizeRole(savedLevel);
    
    // Parse currentUser object if exists
    if (savedCurrentUser) {
      try {
        currentUser = JSON.parse(savedCurrentUser);
      } catch(e) {
        console.warn('[AUTH] Failed to parse currentUser, creating basic object');
        currentUser = {
          username: savedUser,
          nama_lengkap: savedUser,
          role: currentRole,
          level: currentRole
        };
      }
    } else {
      // Create basic currentUser from available data
      currentUser = {
        username: savedUser,
        nama_lengkap: savedUser,
        role: currentRole,
        level: currentRole
      };
    }
    
    // Validate role is still valid
    if (!isValidRole(currentRole)) {
      console.warn('[AUTH] Invalid role in session:', currentRole, '- clearing session');
      handleLogout();
      return false;
    }
    
    console.log('[AUTH] Session restored successfully:');
    console.log('[AUTH] Current user:', currentUser);
    console.log('[AUTH] Current role:', currentRole);
    console.log('[AUTH] Permissions:', ROLE_PERMISSIONS[currentRole]);
    
    // Update UI components
    updateAdminUI();
    renderDynamicSidebar();
    
    return true;
  } else {
    console.log('[AUTH] No existing session found - user not logged in');
    
    // Render public sidebar (no admin menu)
    renderDynamicSidebar();
    
    return false;
  }
}

// Auto-restore session when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('[INIT] DOM Content Loaded - initializing PAMUNGKAS RBAC system...');
  
  // Restore user session
  restoreUserSession();
  
  // Initialize sidebar
  initSidebar();
  
  console.log('[INIT] PAMUNGKAS RBAC system initialized');
});
