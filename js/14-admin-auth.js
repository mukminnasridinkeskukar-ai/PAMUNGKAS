/* ============================================================
   PAMUNGKAS — AUTENTIKASI ADMIN (Nhost Auth asli + Lockout + Sesi)
   Dimuat sebagai: js/14-admin-auth.js
   ============================================================
   SECURITY v7.5:
   - Login via Nhost Auth (/v1/signin/email-password) — TIDAK ADA
     pencocokan password di browser / query tabel password.
   - Lockout 3x salah password DIVERIFIKASI SERVER (security.login_security).
   - Sesi tunggal per user: dibuat di security.session_tracking (server
     mencabut sesi aktif lain / perangkat lain via trigger).
   - Logout selalu forceSecureLogout → bersihkan state → redirect
     https://mukminnasri.com/ (window.location.replace).
   ============================================================ */

/* ---------- UI ADMIN & SESSION HELPERS ---------- */
function isAuthenticated() {
  return !!(window.Sec && Sec.hasSession() && Sec.isLoggedIn());
}
function getCurrentUser() {
  if (currentUser) return currentUser;
  try { return JSON.parse(sessionStorage.getItem('pamungkas_current_user') || 'null'); }
  catch (e) { return null; }
}
function getCurrentUserNIK() {
  if (currentUser && currentUser.nik) return currentUser.nik;
  if (adminUsername && /^\d{16}$/.test(adminUsername)) return adminUsername;
  return null;
}
/** COMPAT v7.5: filter data per role kini ditangani HASURA PERMISSION server-side
 *  (row-level: user hanya melihat baris miliknya bila permission mengatur itu).
 *  Fungsi ini dipertahankan agar kode lama tetap jalan — selalu tanpa filter. */
function getUserDataFilter(tableType) {
  return null;
}

/* ---------- LOGIN MODAL ---------- */
function openLoginModal() {
  if (isAdminUser()) { navigateTo('panel-admin'); return; }
  openModal('loginModal');
  var u = document.getElementById('loginUsername');
  if (u) u.focus();
}

function _loginBtnState(busy) {
  var btn = document.getElementById('btnSubmitLogin');
  if (!btn) return;
  btn.disabled = busy;
  btn.innerHTML = busy
    ? '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...'
    : '<i class="fas fa-sign-in-alt"></i> Masuk';
}

/** Cek lockout SERVER sebelum mencoba login. Return true jika TERKUNCI. */
function _checkLockoutOrRedirect(email) {
  return Sec.checkLock(email).then(function (st) {
    if (st.is_locked && st.locked_until) {
      var sisa = Math.max(1, Math.ceil((new Date(st.locked_until).getTime() - Date.now()) / 60000));
      showToast('Akun dikunci karena ' + Sec.CFG.LOCKOUT_ATTEMPTS + 'x kesalahan password. Coba lagi dalam ~' + sisa + ' menit.', 'error');
      _loginBtnState(false);
      // Kebijakan keamanan: lockout → bersihkan state & redirect ke situs utama
      setTimeout(function () { Sec.forceSecureLogout('account_locked'); }, 2200);
      return true;
    }
    return false;
  });
}

/** Sukses login: sinkron registry + role + buat sesi server (single-session). */
function _afterLoginSuccess(session) {
  var user = session.user || {};
  var at = session.accessToken;
  var role = Sec.applyRoleFromToken();

  return Sec.fetchOwnRegistry().then(function (reg) {
    if (!reg) {
      showToast('Akun Nhost valid, tetapi tidak terdaftar di registri aplikasi (multiusers).', 'error');
      Sec.forceSecureLogout('unauthorized');
      return;
    }
    if (reg.status !== 'active') {
      showToast('Akun tidak aktif. Hubungi superadmin.', 'error');
      Sec.forceSecureLogout('unauthorized');
      return;
    }
    // role final = registry level (server-side), disimpan display-only
    role = reg.level || role;
    try {
      adminLevel = role;
      adminUsername = reg.username || user.email || '';
      currentUser = {
        id: user.id || (Sec.decodeJwtPayload(at) || {}).sub || null,
        username: reg.username,
        nama_lengkap: reg.username,
        email: reg.email || user.email || '',
        role: role, level: role,
        status: reg.status
      };
      currentRole = role;
      sessionStorage.setItem('pamungkas_admin_level', role);
      sessionStorage.setItem('pamungkas_admin_user', adminUsername);
      sessionStorage.setItem('pamungkas_current_role', role);
      sessionStorage.setItem('pamungkas_current_user', JSON.stringify(currentUser));
    } catch (e) { console.error('[AUTH] state error', e); }

    closeModal('loginModal');
    _loginBtnState(false);
    showToast('Login berhasil! Selamat datang, ' + adminUsername + ' (' + levelLabel() + ').', 'success');
    _adminPanelActiveTab = 'ringkasan';
    updateAdminUI();
    renderDynamicSidebar();

    // buat sesi tercatat di server (trigger mencabut sesi aktif perangkat lain)
    var dev = (navigator.userAgent || '').slice(0, 120);
    Sec.createServerSession(dev).catch(function (e) {
      console.warn('[AUTH] create session warning:', e && e.message);
    });

    navigateTo('panel-admin');
  });
}

function handleLogin(e) {
  e.preventDefault();
  var uEl = document.getElementById('loginUsername');
  var pEl = document.getElementById('loginPassword');
  var u = (uEl && uEl.value || '').trim();
  var p = (pEl && pEl.value || '').trim();
  if (!u || !p) { showToast('Username dan password wajib diisi.', 'error'); return; }
  var email = Sec.toAuthEmail(u);

  _loginBtnState(true);

  // 1) CEK LOCKOUT (server-side)
  _checkLockoutOrRedirect(email).then(function (locked) {
    if (locked) return;

    // 2) LOGIN VIA NHOST AUTH
    Sec.nhostSignIn(email, p).then(function (res) {
      if (res.ok && res.body && res.body.session && res.body.session.accessToken) {
        // sukses → simpan token (access: sessionStorage, refresh: localStorage)
        var s = res.body.session;
        Sec.setTokens(s.accessToken, s.refreshToken);
        Sec.applyRoleFromToken();
        _afterLoginSuccess(s);
        return;
      }

      // gagal → catat kegagalan di SERVER (counter + lockout otomatis)
      var errMsg = (res.body && (res.body.message || res.body.error)) || 'Email atau password salah.';
      Sec.recordFailedLogin(email).then(function (st) {
        _loginBtnState(false);
        if (st.is_locked) {
          showToast('Login gagal ' + st.failed_attempts + 'x. Akun DIKUNCI ' + Sec.CFG.LOCKOUT_MINUTES + ' menit.', 'error');
          setTimeout(function () { Sec.forceSecureLogout('account_locked'); }, 2200);
          return;
        }
        var sisa = Sec.CFG.LOCKOUT_ATTEMPTS - (st.failed_attempts || 0);
        showToast('Login gagal. ' + errMsg + ' Sisa percobaan: ' + sisa + '.', 'error');
      });
    }).catch(function (err) {
      _loginBtnState(false);
      showToast('Error koneksi login: ' + (err.message || err), 'error');
    });
  });
}

/* ---------- UI ADMIN ---------- */
function updateAdminUI() {
  var topbarRight = document.getElementById('topbarRight');
  if (topbarRight) {
    topbarRight.innerHTML = '<button class="btn-logout" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i><span>' + levelBadgeHTML() + ' ' + escHTML(adminUsername || '') + '</span></button>';
  } else {
    console.warn('[DOM] updateAdminUI: #topbarRight tidak ditemukan');
  }
}
function updateAdminView() {
  if (isAdminUser()) {
    _safeDisplay('adminContent', 'none');
    _safeDisplay('adminPanelFrame', 'block');
    _safeText('adminName', adminUsername + ' (' + levelLabel() + ')');
  } else {
    _safeDisplay('adminContent', 'block');
    _safeDisplay('adminPanelFrame', 'none');
  }
}

/* ---------- LOGOUT (terpusat via forceSecureLogout) ---------- */
function handleLogout() {
  // Reset UI state sebelum redirect
  try {
    _adminPanelActiveTab = 'ringkasan';
    var topbarRight = document.getElementById('topbarRight');
    if (topbarRight) {
      topbarRight.innerHTML = '<button class="btn-admin-login" onclick="openLoginModal()"><i class="fas fa-lock"></i><span>Login Admin</span></button>';
    }
  } catch (e) {}
  showToast('Sesi diakhiri. Mengalihkan...', 'info');
  // forceSecureLogout: signout Nhost + bersihkan state + broadcast antar-tab
  // + redirect replace() ke https://mukminnasri.com/
  Sec.forceSecureLogout('manual_logout');
}

/* ---------- COMPAT STUBS ---------- */
// nhostLogin lama (sessionToken palsu) dihapus — gunakan Sec.nhostSignIn.
function nhostLogout() { Sec.forceSecureLogout('manual_logout'); }
