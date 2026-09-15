/* ============================================================
   PAMUNGKAS — AUTENTIKASI ADMIN (Login, Logout, Sesi & UI Admin)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/14-admin-auth.js
   ============================================================ */

/* ========== AUTHENTICATION HELPERS (NHOST) ========== */
async function nhostLogin(email, password) {
  try {
    const response = await fetch(`${NHOST_CONFIG.authUrl}/password/signIn`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.sessionToken) {
      safeStorage.setItem('nhost_token', result.sessionToken);
      safeStorage.setItem('nhost_user', JSON.stringify(result.user));
      return { success: true, user: result.user };
    }
    throw new Error(result.message || 'Login gagal');
  } catch (error) {
    console.error('Nhost Login Error:', error);
    throw error;
  }
}

function nhostLogout() {
  safeStorage.removeItem('nhost_token');
  safeStorage.removeItem('nhost_user');
  window.location.reload();
}

function getCurrentUser() {
  const userData = safeStorage.getItem('nhost_user');
  return userData ? JSON.parse(userData) : null;
}

/**
 * getCurrentUserNIK() - Mendapatkan NIK user yang login
 * Digunakan untuk filter data pendaftaran berdasarkan role 'user'
 */
function getCurrentUserNIK() {
  // Coba dari session currentUser
  if (currentUser && currentUser.nik) {
    return currentUser.nik;
  }
  
  // Coba dari nhost_user data
  const nhostUser = getCurrentUser();
  if (nhostUser && (nhostUser.nik || nhostUser.NIK)) {
    return nhostUser.nik || nhostUser.NIK;
  }
  
  // Coba dari username (jika NIK digunakan sebagai username)
  if (adminUsername && /^\d{16}$/.test(adminUsername)) {
    return adminUsername;
  }
  
  console.warn('[AUTH] Tidak dapat menemukan NIK user');
  return null;
}

/**
 * getUserDataFilter() - Mengembang filter GraphQL berdasarkan role
 * - superadmin/admin: tidak ada filter (semua data)
 * - user: filter by nik
 */
function getUserDataFilter(tableType) {
  var role = getCurrentRole();
  
  if (role === 'user' && tableType === 'pendaftaran') {
    var nik = getCurrentUserNIK();
    if (nik) {
      return { nik: { _eq: nik } };
    }
  }
  
  return null; // Tidak ada filter
}

function isAuthenticated() {
  return !!safeStorage.getItem('nhost_token');
}

/* ========== API CONFIGURATION LOADED ABOVE ==========
 * callServer() sekarang menggunakan GraphQL ke Nhost/Hasura
 * Fungsi ini tetap kompatibel dengan kode existing
 * ============================================================
 * Note: pageConfig sudah dipindahkan ke atas script untuk menghindari error
 * */

/* pageConfig already defined above - keeping this comment for reference */

/* ---------- LOGIN ADMIN ---------- */
/* ========== ADMIN: LOGIN/LOGOUT ========== */
function openLoginModal(){if(isAdminUser()){navigateTo('panel-admin');return;}openModal('loginModal');document.getElementById('loginUsername').focus();}
function handleLogin(e){
  e.preventDefault();
  var u = document.getElementById('loginUsername').value.trim();
  var p = document.getElementById('loginPassword').value.trim();
  if(!u || !p) {showToast('Username dan password wajib diisi.', 'error'); return;}
  
  var btn = document.getElementById('btnSubmitLogin');
  if(btn){btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';}
  
  // Query directly from Nhost multiusers table
  callServer('validateAdminLogin', {username: u, password: p}).then(function(res){
    if(btn){btn.disabled=false; btn.innerHTML='<i class="fas fa-sign-in-alt"></i> Masuk';}
    
    if(res && res.success){
      // Get raw role from database response
      var rawRole = res.level || res.role || '';
      
      // NORMALIZE role using normalizeRole() function
      var normalizedRole = normalizeRole(rawRole);
      
      console.log('[AUTH] Login successful:', {
        username: u,
        rawRole: rawRole,
        normalizedRole: normalizedRole,
        userData: res
      });
      
      // VALIDATE: Check if role is valid for admin access
      if(!normalizedRole || !isValidRole(normalizedRole)) {
        console.error('[AUTH] Invalid role after normalization:', rawRole, '→', normalizedRole);
        showToast('Login gagal. Role user tidak valid untuk akses admin.', 'error');
        return;
      }
      
      // Set state variables (NEW RBAC SYSTEM)
      adminLevel = normalizedRole;
      adminUsername = res.username || res.nama_lengkap || u;
      
      // Build currentUser object from database response
      currentUser = {
        id: res.id || null,
        username: res.username || u,
        nama_lengkap: res.nama_lengkap || res.name || u,
        role: normalizedRole,
        level: normalizedRole, // backward compatibility
        status: res.status || 'active'
      };
      
      // Set currentRole (main RBAC variable)
      currentRole = normalizedRole;
      
      // Store session data (minimal, non-sensitive)
      sessionStorage.setItem('pamungkas_admin_level', adminLevel);
      sessionStorage.setItem('pamungkas_admin_user', adminUsername);
      sessionStorage.setItem('pamungkas_current_role', currentRole);
      sessionStorage.setItem('pamungkas_current_user', JSON.stringify(currentUser));
      
      console.log('[AUTH] Current user:', currentUser);
      console.log('[AUTH] Current role:', currentRole);
      console.log('[AUTH] Permissions:', ROLE_PERMISSIONS[currentRole]);
      
      closeModal('loginModal');
      showToast('Login berhasil! Selamat datang, ' + (currentUser.nama_lengkap || adminUsername) + ' (' + levelLabel() + ').', 'success');
      
      // Update UI components
      updateAdminUI();
      renderDynamicSidebar(); // Re-render sidebar with role-based menu
      navigateTo('panel-admin');
    } else {
      showToast('Login gagal. ' + (res ? res.message : 'Username atau password salah.'), 'error');
    }
  }).catch(function(e){
    if(btn){btn.disabled=false; btn.innerHTML='<i class="fas fa-sign-in-alt"></i> Masuk';}
    showToast('Error: ' + (e.message || e), 'error');
    console.error('Login error:', e);
  });
}

/* ---------- UI ADMIN & LOGOUT ---------- */
function updateAdminUI(){
  var topbarRight = document.getElementById('topbarRight');
  if (topbarRight) {
    topbarRight.innerHTML = '<button class="btn-logout" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i><span>' + levelBadgeHTML() + ' ' + escHTML(adminUsername) + '</span></button>';
  } else {
    console.warn('[DOM] updateAdminUI: #topbarRight tidak ditemukan');
  }
}
function updateAdminView(){
  if (isAdminUser()) {
    _safeDisplay('adminContent', 'none');
    _safeDisplay('adminDashboard', 'block');
    _safeText('adminName', adminUsername + ' (' + levelLabel() + ')');
  } else {
    _safeDisplay('adminContent', 'block');
    _safeDisplay('adminDashboard', 'none');
  }
}
function handleLogout(){
  // Clear all session data
  adminLevel = '';
  adminUsername = '';
  currentUser = null;
  currentRole = '';
  
  sessionStorage.removeItem('pamungkas_admin_level');
  sessionStorage.removeItem('pamungkas_admin_user');
  sessionStorage.removeItem('pamungkas_current_user');
  sessionStorage.removeItem('pamungkas_current_role');
  
  // Also clear any Nhost auth tokens
  safeStorage.removeItem('nhost_token');
  safeStorage.removeItem('nhost_user');
  
  var topbarRight = document.getElementById('topbarRight');
  if (topbarRight) {
    topbarRight.innerHTML = '<button class="btn-admin-login" onclick="openLoginModal()"><i class="fas fa-lock"></i><span>Login Admin</span></button>';
  }
  
  // Re-render sidebar to show public menu
  renderDynamicSidebar();
  
  showToast('Anda telah logout.', 'info');
  navigateTo('dashboard');
  showAdminButtons();
}
