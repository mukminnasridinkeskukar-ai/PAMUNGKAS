/* ============================================================
   PAMUNGKAS — APP BOOTSTRAP (Navigasi, Handler Global, Restore Sesi & Init)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/19-app.js
   ============================================================ */

/* ========== NAVIGASI ========== */
function navigateTo(page){
  /* SECURITY v7.5 — PROTECTED ROUTE: halaman internal (panel-admin) wajib
     sesi valid (token + sesi server + tidak idle). Gagal → forceSecureLogout
     → redirect https://mukminnasri.com/ (replace, tidak bisa Back). */
  if (window.Sec && !Sec.assertProtectedPage(page)) return;
  currentPage=page;
  if (window.Sec) Sec.touchActivity(); // perpindahan halaman = aktivitas
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
  if (lbImg) { lbImg.onerror=null; lbImg.src = ''; lbImg.style.opacity = '1'; lbImg.dataset.chainStop = '1'; } /* v7.6.2: onerror dibersihkan + reset opacity + hentikan fallback chain */
  
  document.body.style.overflow = '';
}

/* ========== SESSION RESTORATION (SECURITY v7.5) ==========
 * Sesi dipulihkan HANYA bila Nhost Auth valid (refresh token → server,
 * sesi tercatat aktif di security.session_tracking, user aktif di registry).
 * Bukan sekadar localStorage flag — server yang memutuskan.
 * ============================================================ */
function restoreUserSession() {
  if (!window.Sec) {
    console.error('[SECURITY] Modul keamanan tidak termuat!');
    renderDynamicSidebar();
    return Promise.resolve(false);
  }
  return Sec.init().then(function (restored) {
    if (restored) {
      updateAdminUI();
    } else {
      // mode publik
      try {
        var topbarRight = document.getElementById('topbarRight');
        if (topbarRight && !topbarRight.innerHTML.trim()) {
          topbarRight.innerHTML = '<button class="btn-admin-login" onclick="openLoginModal()"><i class="fas fa-lock"></i><span>Login Admin</span></button>';
        }
      } catch (e) {}
    }
    renderDynamicSidebar();
    return restored;
  }).catch(function (e) {
    console.warn('[SECURITY] init warning:', e);
    renderDynamicSidebar();
    return false;
  });
}

// Auto-restore session when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('[INIT] DOM Content Loaded - initializing PAMUNGKAS RBAC + SECURITY...');

  // Validasi sesi Nhost dulu (async), lalu render UI sesuai hasil
  restoreUserSession();

  console.log('[INIT] PAMUNGKAS security initialized');
});
