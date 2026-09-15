/* ============================================================
   PAMUNGKAS — SESSION SECURITY (Nhost Auth asli, bukan simulasi)
   Dimuat sebagai: js/20-session-security.js  (setelah 02-utils, sebelum 03-rbac)
   ============================================================
   Fitur:
   - Autentikasi via Nhost Auth REST (/v1/signin/email-password, /v1/token, /v1/signout)
   - Access token di sessionStorage, refresh token di localStorage (satu sesi
     per browser, dibagi antar-tab) — keabsahan SELALU diverifikasi server.
   - Idle timeout 15 menit (timestamp lastActivity; TIDAK mengandalkan setTimeout
     saja — dicek berkala + saat tab aktif kembali).
   - Validasi saat visibilitychange / focus / pageshow.
   - Single-session per user (server: security.session_tracking + trigger).
   - Lockout 3x salah password (server: security.login_security, 15 menit).
   - Sinkronisasi antar-tab via BroadcastChannel (+ storage event fallback).
   - forceSecureLogout(reason) → bersihkan semuanya → redirect mukminnasri.com
   ============================================================ */
(function () {
  'use strict';

  var CFG = {
    IDLE_MS: 15 * 60 * 1000,              // 15 menit
    LOCK_ATTEMPTS: 3,
    LOCK_MINUTES: 15,
    SESSION_HOURS: 24,
    REDIRECT_URL: 'https://mukminnasri.com/',
    AUTH_EMAIL_DOMAIN: 'pamungkas.mukminnasri.com',
    CHECK_INTERVAL_MS: 20000,             // tick internal 20 dtk
    SERVER_VALIDATE_MS: 60000,            // validasi sesi ke server maks 1x/menit
    REFRESH_SKEW_MS: 120000               // refresh access token 2 mnt sebelum exp
  };
  // override untuk pengujian (mis. window.PAMUNGKAS_IDLE_TEST_MS = 15000)
  if (window.PAMUNGKAS_IDLE_TEST_MS) CFG.IDLE_MS = Number(window.PAMUNGKAS_IDLE_TEST_MS) || CFG.IDLE_MS;

  var K = {
    REFRESH: 'pk_refresh_token',
    ACCESS: 'pk_access_token',
    SESSION_ID: 'pk_session_id',
    LAST_ACT: 'pk_last_activity',
    USER: 'pk_user_display',              // display-only (bukan sumber auth)
    BROADCAST: 'pk_security_broadcast'
  };

  var BC = null;
  try { BC = new BroadcastChannel('pamungkas-security'); } catch (e) { BC = null; }
  var _locked = false;          // true = sedang proses forceSecureLogout
  var _lastServerValidate = 0;
  var _refreshInFlight = null;
  var _tickTimer = null;

  /* ---------- helpers ---------- */
  function _now() { return Date.now(); }
  function _getLS(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function _setLS(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function _delLS(k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  function _getSS(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function _setSS(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  function _delSS(k) { try { window.sessionStorage.removeItem(k); } catch (e) {} }

  function decodeJwtPayload(token) {
    try {
      var p = String(token).split('.')[1];
      if (!p) return null;
      p = p.replace(/-/g, '+').replace(/_/g, '/');
      while (p.length % 4) p += '=';
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return null; }
  }
  function jwtExp(token) {
    var pl = decodeJwtPayload(token);
    return pl && pl.exp ? pl.exp * 1000 : 0;
  }
  function jwtHasuraClaims(token) {
    var pl = decodeJwtPayload(token) || {};
    return pl['https://hasura.io/jwt/claims'] || {};
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }) + '-' + _now().toString(36);
  }
  function toAuthEmail(input) {
    var s = String(input || '').trim().toLowerCase();
    if (!s) return '';
    if (s.indexOf('@') !== -1) return s;
    return s + '@' + CFG.AUTH_EMAIL_DOMAIN;
  }
  function broadcast(type, extra) {
    var msg = JSON.stringify(Object.assign({ type: type, ts: _now(), tab: uuid().slice(0, 8) }, extra || {}));
    if (BC) { try { BC.postMessage(msg); } catch (e) {} }
    // fallback storage-event utk browser tanpa BroadcastChannel
    _setLS(K.BROADCAST, msg);
  }

  /* ---------- token store ---------- */
  function getAccessToken() { return _getSS(K.ACCESS) || ''; }
  function getRefreshToken() { return _getLS(K.REFRESH) || ''; }
  function getSessionId() { return _getLS(K.SESSION_ID) || ''; }
  function setTokens(access, refresh) {
    if (access) _setSS(K.ACCESS, access);
    if (refresh) _setLS(K.REFRESH, refresh);
  }
  function clearTokens() {
    _delSS(K.ACCESS); _delLS(K.REFRESH); _delLS(K.SESSION_ID);
    _delSS(K.USER); _delLS(K.LAST_ACT);
  }
  function hasSession() { return !!(getRefreshToken() || getAccessToken()); }

  /* ---------- refresh access token (Web Locks + smart retry antar-tab) ----------
     Rotasi refresh token Nhost: tiap pemakaian menghasilkan token baru. Bila
     tab lain memakai refresh token yang sama lebih dulu (race antar-tab), kita
     MENDETEKSI perubahan token di localStorage lalu mencoba ulang dgn token
     terbaru (hingga 3x). Kegagalan ditandai .genuine bila server MENOLAK token
     (true-invalid), bukan sekadar error jaringan/race. */
  function _retryDelay() { return new Promise(function (r) { setTimeout(r, 450); }); }
  function refreshAccessToken(force) {
    if (_refreshInFlight && !force) return _refreshInFlight;
    _refreshInFlight = (function () {
      var attempts = 0;
      function attempt() {
        attempts++;
        var rt = getRefreshToken();
        if (!rt) { var e0 = new Error('no-refresh-token'); e0.genuine = true; return Promise.reject(e0); }
        var tried = rt;
        return fetch(NHOST_CONFIG.authUrl + '/token', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tried })
        }).then(function (r) {
          return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; });
        }).then(function (res) {
          /* CATATAN: /v1/token Nhost mengembalikan token di LEVEL ATAS
             {accessToken, refreshToken, accessTokenExpiresIn, ...} — berbeda
             dengan /v1/signin yang membungkusnya di dalam {session:{...}}. */
          var s = (res.body && (res.body.session || res.body)) || null;
          if (res.ok && s && s.accessToken) {
            setTokens(s.accessToken, s.refreshToken || tried);
            broadcast('SESSION_SYNC', { access: s.accessToken, refresh: s.refreshToken || tried });
            return s.accessToken;
          }
          var err = new Error('refresh-failed'); err.status = res.status;
          var cur = getRefreshToken();
          if (attempts < 3 && cur && cur !== tried) return _retryDelay().then(attempt); // tab lain sudah rotasi
          if (res.status >= 400 && res.status < 500) err.genuine = true;               // server menolak token
          throw err;
        }).catch(function (e) {
          if (e && (e.genuine || e.status)) throw e;
          if (attempts < 3) return _retryDelay().then(attempt);                        // jaringan → coba lagi
          throw e;
        });
      }
      var run;
      if (window.navigator && navigator.locks && navigator.locks.request) {
        run = navigator.locks.request('pk-token-refresh', attempt);
      } else { run = attempt(); }
      return run.finally(function () { setTimeout(function () { _refreshInFlight = null; }, 0); });
    })();
    return _refreshInFlight;
  }

  /** Pastikan access token valid (refresh bila mendekati kadaluarsa). Reject → sesi invalid. */
  function ensureAccessToken() {
    var at = getAccessToken();
    if (at && jwtExp(at) - _now() > CFG.REFRESH_SKEW_MS) return Promise.resolve(at);
    if (!getRefreshToken()) return Promise.reject(new Error('no-session'));
    return refreshAccessToken(false);
  }

  /* ---------- Nhost Auth REST ---------- */
  function nhostSignIn(email, password) {
    return fetch(NHOST_CONFIG.authUrl + '/signin/email-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; });
    });
  }
  function nhostSignOut() {
    var at = getAccessToken(), rt = getRefreshToken();
    if (!at && !rt) return Promise.resolve();
    return fetch(NHOST_CONFIG.authUrl + '/signout', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, at ? { 'Authorization': 'Bearer ' + at } : {}),
      body: JSON.stringify({ refreshToken: rt, all: false })
    }).catch(function () {}).then(function () { return; });
  }

  /* ---------- GraphQL mini-client utk operasi sesi (module mandiri) ---------- */
  function gql(query, variables) {
    return ensureAccessToken().then(function (at) {
      return fetch(NHOST_CONFIG.graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + at },
        body: JSON.stringify({ query: query, variables: variables || {} })
      }).then(function (r) { return r.json(); });
    }).then(function (res) {
      if (res.errors) {
        var code = (res.errors[0] && res.errors[0].extensions && res.errors[0].extensions.code) || '';
        var err = new Error(res.errors[0].message || 'graphql-error'); err.code = code; throw err;
      }
      return res.data;
    });
  }

  /* ---------- aktivitas & idle ---------- */
  var _lastLSWrite = 0;
  function touchActivity(force) {
    var now = _now();
    if (!force && now - _lastLSWrite < 5000) return; // throttle tulis localStorage 5 dtk
    _lastLSWrite = now;
    _setLS(K.LAST_ACT, String(now));
  }
  function idleElapsed() {
    var last = Number(_getLS(K.LAST_ACT) || 0);
    return last ? (_now() - last) : 0;
  }
  function isIdleExpired() {
    var last = Number(_getLS(K.LAST_ACT) || 0);
    return last > 0 && (_now() - last) >= CFG.IDLE_MS;
  }
  var ACT_EVENTS = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown', 'touchstart', 'touchmove'];
  ACT_EVENTS.forEach(function (ev) {
    window.addEventListener(ev, function () { touchActivity(false); }, { passive: true });
  });

  /* ---------- validasi sesi server ---------- */
  function validateSessionOnServer() {
    if (!hasSession()) return Promise.resolve({ valid: false, reason: 'no-session' });
    var sid = getSessionId();
    if (!sid) return Promise.resolve({ valid: false, reason: 'no-session-id' });
    var nowIso = new Date().toISOString();
    return ensureAccessToken().then(function () {
      return gql(
        'query V($sid: String!) { s: securitySessionTracking(where: {session_identifier: {_eq: $sid}}, limit: 1) { status expires_at } }',
        { sid: sid }
      ).then(function (d) {
        var rows = (d && d.s) || [];
        if (!rows.length) {
          // Self-heal: baris sesi belum ada (mis. createServerSession gagal saat
          // login) — coba buat sekali, lalu validasi ulang. Sesi yang DICABUT
          // server tetap ada (status revoked) sehingga tidak lolos jalur ini.
          return createServerSession('recovery').then(function () {
            return gql(
              'query V2($sid: String!) { s: securitySessionTracking(where: {session_identifier: {_eq: $sid}}, limit: 1) { status expires_at } }',
              { sid: sid }
            ).then(function (d2) {
              var rows2 = (d2 && d2.s) || [];
              if (!rows2.length) return { valid: false, reason: 'session-not-found' };
              var r2 = rows2[0];
              if (r2.status !== 'active') return { valid: false, reason: 'session-' + r2.status };
              _lastServerValidate = _now();
              return { valid: true };
            });
          }).catch(function () { return { valid: false, reason: 'session-not-found' }; });
        }
        var row = rows[0];
        if (row.status !== 'active') return { valid: false, reason: 'session-' + row.status };
        if (row.expires_at && new Date(row.expires_at).getTime() < _now()) return { valid: false, reason: 'session-expired' };
        // touch last_activity (server) — senyap
        gql('mutation T($sid: String!, $now: timestamptz!) { u: update_security_session_tracking(where: {session_identifier: {_eq: $sid}}, _set: {last_activity: $now}) { affected_rows } }',
          { sid: sid, now: nowIso }).catch(function () {});
        _lastServerValidate = _now();
        return { valid: true };
      });
    });
  }

  function tokenValid() {
    var at = getAccessToken();
    if (!at) return !!getRefreshToken(); // akan di-refresh saat request
    return jwtExp(at) > _now();
  }

  /* ---------- forceSecureLogout (pusat reset) ----------
     opts.clearShared (default TRUE): hapus juga refresh token + session id yang
     dipakai bersama antar-tab. FALSE utk logout "lokal saja" (error sementara/
     race refresh) agar tab lain yang sesinya masih valid TIDAK ikut terbunuh. */
  function forceSecureLogout(reason, opts) {
    opts = opts || {};
    var clearShared = opts.clearShared !== false;
    if (_locked) return; _locked = true;
    try { console.warn('[SECURITY] forceSecureLogout:', reason, clearShared ? '(shared)' : '(local-only)'); } catch (e) {}

    // 1) blokir request baru
    window.__PK_SECURITY_LOCKED = _now();

    // 2) broadcast ke tab lain (hanya utk logout yang benar-benar mengakhiri sesi)
    if (!opts.fromBroadcast && clearShared) {
      var evType = reason === 'idle_timeout' ? 'IDLE_TIMEOUT'
        : reason === 'account_locked' ? 'SECURITY_LOCK'
        : reason === 'session_revoked' ? 'SESSION_REVOKED'
        : 'LOGOUT';
      broadcast(evType, { reason: reason });
    }

    // 3-4) audit + akhiri sesi server + signout Nhost (best effort, cepat)
    var sid = getSessionId();
    var at = getAccessToken();
    var email = '';
    try { email = (JSON.parse(_getSS(K.USER) || '{}').email) || ''; } catch (e) {}
    var audit = fetch(NHOST_CONFIG.graphqlUrl, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, at ? { 'Authorization': 'Bearer ' + at } : {}),
      body: JSON.stringify({ query: 'mutation($e:String,$d:String){ security_log_event(args: {pEvent:$e, pDetail:$d, pEmail:""}) { status } }', variables: { e: 'security_logout', d: String(reason), }, })
    }).catch(function () {});
    var endSess = sid ? fetch(NHOST_CONFIG.graphqlUrl, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, at ? { 'Authorization': 'Bearer ' + at } : {}),
      body: JSON.stringify({ query: 'mutation($s:String){ u: update_security_session_tracking(where: {session_identifier: {_eq: $s}}, _set: {status: "logged_out", revoked_reason: "' + String(reason).replace(/"/g, '') + '"}) { affected_rows } }', variables: { s: sid } })
    }).catch(function () {}) : Promise.resolve();
    var signout = nhostSignOut();

    // 5-6) bersihkan state aplikasi + data sensitif
    function cleanup() {
      _delSS(K.ACCESS); _delSS(K.USER);
      if (clearShared) { _delLS(K.REFRESH); _delLS(K.SESSION_ID); _delLS(K.LAST_ACT); }
      try {
        ['pamungkas_admin_level', 'pamungkas_admin_user', 'pamungkas_current_role',
         'pamungkas_current_user', 'nhost_token', 'nhost_user'].forEach(function (k) {
          sessionStorage.removeItem(k); localStorage.removeItem(k);
        });
      } catch (e) {}
      try {
        adminLevel = ''; adminUsername = ''; currentUser = null; currentRole = '';
        _dataCache = {}; _allPengumuman = []; _allSDMK = []; _allPendaftaran = [];
        _allSertifikat = []; _allMateri = []; _allAdmin = [];
      } catch (e) {}
      try { for (var key in _authFileCache) { try { URL.revokeObjectURL(_authFileCache[key]); } catch (e) {} _authFileCache[key] = null; } } catch (e) {}
      if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }
      if (BC) { try { BC.close(); } catch (e) {} BC = null; }
    }

    function redirect() {
      try { window.location.replace(CFG.REDIRECT_URL); }
      catch (e) { window.location.href = CFG.REDIRECT_URL; }
    }

    // 7) tunggu maks 2.5 dtk utk best-effort ops, lalu redirect dgn replace()
    Promise.race([
      Promise.all([audit, endSess, signout]),
      new Promise(function (res) { setTimeout(res, 2500); })
    ]).then(function () { cleanup(); redirect(); });
    // jaringan mati pun tetap redirect:
    setTimeout(function () { cleanup(); if (!window.__PK_REDIRECTED__) { window.__PK_REDIRECTED__ = true; redirect(); } }, 4000);
  }
  window.forceSecureLogout = forceSecureLogout;

  /* ---------- lockout (3x salah password) ---------- */
  function checkLock(email) {
    return fetch(NHOST_CONFIG.graphqlUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query($e:String!){ l: security_check_lock(args: {pEmail: $e}) { failed_attempts locked_until is_locked } }', variables: { e: String(email || '').toLowerCase() } })
    }).then(function (r) { return r.json(); }).then(function (res) {
      var rows = (res.data && res.data.l) || [];
      return rows.length ? rows[0] : { failed_attempts: 0, locked_until: null, is_locked: false };
    }).catch(function () { return { failed_attempts: 0, locked_until: null, is_locked: false }; });
  }
  function recordFailedLogin(email) {
    return fetch(NHOST_CONFIG.graphqlUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'mutation($e:String!){ l: security_record_failed_login(args: {pEmail: $e}) { failed_attempts locked_until is_locked } }', variables: { e: String(email || '').toLowerCase() } })
    }).then(function (r) { return r.json(); }).then(function (res) {
      var rows = (res.data && res.data.l) || [];
      return rows.length ? rows[0] : { failed_attempts: 0, locked_until: null, is_locked: false };
    }).catch(function () { return { failed_attempts: 0, locked_until: null, is_locked: false }; });
  }

  /* ---------- sesi: buat / role ---------- */
  function createServerSession(deviceLabel) {
    var sid = getSessionId() || uuid();
    _setLS(K.SESSION_ID, sid);
    var expires = new Date(_now() + CFG.SESSION_HOURS * 3600 * 1000).toISOString();
    return gql(
      'mutation M($sid: String!, $dev: String, $exp: timestamptz!) {' +
      ' i: insert_security_session_tracking_one(object: {session_identifier: $sid, device_label: $dev, expires_at: $exp}, on_conflict: {constraint: session_tracking_session_identifier_key, update_columns: [last_activity, status, expires_at]}) { id status } }',
      { sid: sid, dev: deviceLabel || null, exp: expires }
    ).then(function (d) {
      broadcast('LOGIN');
      return d && d.i;
    });
  }

  function applyRoleFromToken() {
    var at = getAccessToken();
    if (!at) return '';
    var claims = jwtHasuraClaims(at);
    var role = claims['x-hasura-default-role'] || '';
    var uid = claims['x-hasura-user-id'] || '';
    // display-only cache (bukan sumber auth)
    _setSS(K.USER, JSON.stringify({ id: uid, role: role }));
    try { currentRole = role; adminLevel = role; } catch (e) {}
    return role;
  }

  /** Ambil baris multiusers milik user (role/status) via permission filter server. */
  function fetchOwnRegistry() {
    return gql('query { m: multiusers(limit: 1) { username level status email } }')
      .then(function (d) { return (d && d.m && d.m[0]) || null; })
      .catch(function () { return null; });
  }

  /* ---------- guard ---------- */
  function isLoggedIn() {
    return hasSession() && !_locked && !window.__PK_SECURITY_LOCKED__;
  }
  function assertProtectedPage(page) {
    if (page !== 'panel-admin') return true;
    if (!isLoggedIn() || isIdleExpired() || !tokenValid()) {
      forceSecureLogout(isIdleExpired() ? 'idle_timeout' : 'unauthorized_access');
      return false;
    }
    return true;
  }

  /* ---------- tick berkala + event lifecycle ---------- */
  function securityTick() {
    if (_locked) return;
    if (isIdleExpired()) { forceSecureLogout('idle_timeout'); return; }
    if (!hasSession()) return;
    if (_now() - _lastServerValidate > CFG.SERVER_VALIDATE_MS) {
      validateSessionOnServer().then(function (res) {
        if (!res.valid && res.reason !== 'no-session' && res.reason !== 'no-session-id') {
          forceSecureLogout(res.reason === 'session-revoked' ? 'session_revoked' : res.reason);
        }
      }).catch(function () {});
    }
  }
  function onVisibleAgain() {
    if (_locked) return;
    touchActivity(false);
    if (isIdleExpired()) { if (hasSession()) forceSecureLogout('idle_timeout'); return; }
    if (!hasSession()) return;
    // Refresh senyap bila perlu — GAGAL TIDAK langsung logout (bisa cuma race/
    // jaringan). Status sesi sesungguhnya diputuskan oleh validateSessionOnServer.
    ensureAccessToken().catch(function () { /* tick/berikutnya menangani */ });
    validateSessionOnServer().then(function (res) {
      if (!res.valid && hasSession()) {
        forceSecureLogout(res.reason === 'session-revoked' ? 'session_revoked' : 'session_invalid');
      }
    }).catch(function () {});
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') onVisibleAgain();
  });
  window.addEventListener('focus', onVisibleAgain);
  window.addEventListener('pageshow', function (e) { onVisibleAgain(); });

  /* ---------- BroadcastChannel + storage fallback ---------- */
  function handleSecurityMessage(msg) {
    var m = msg; try { if (typeof msg === 'string') m = JSON.parse(msg); } catch (e) { return; }
    if (!m || !m.type) return;
    switch (m.type) {
      case 'LOGOUT': forceSecureLogout(m.reason || 'logout', { fromBroadcast: true }); break;
      case 'IDLE_TIMEOUT': forceSecureLogout('idle_timeout', { fromBroadcast: true }); break;
      case 'SESSION_REVOKED': forceSecureLogout('session_revoked', { fromBroadcast: true }); break;
      case 'SECURITY_LOCK': forceSecureLogout('account_locked', { fromBroadcast: true }); break;
      case 'SESSION_SYNC':
        if (m.access) _setSS(K.ACCESS, m.access);
        if (m.refresh) _setLS(K.REFRESH, m.refresh);
        break;
      case 'LOGIN': _lastServerValidate = 0; break; // paksa validasi ulang
    }
  }
  if (BC) BC.onmessage = function (e) { handleSecurityMessage(e.data); };
  window.addEventListener('storage', function (e) {
    if (e.key === K.BROADCAST && e.newValue) handleSecurityMessage(e.newValue);
  });

  /* ---------- init / restore sesi saat boot ---------- */
  function init() {
    touchActivity(true);
    _tickTimer = setInterval(securityTick, CFG.CHECK_INTERVAL_MS);
    if (isIdleExpired() && hasSession()) { forceSecureLogout('idle_timeout'); return Promise.resolve(false); }
    if (!hasSession()) {
      // mode publik — pastikan tidak ada sisa role lama
      try { currentRole = ''; adminLevel = ''; currentUser = null; } catch (e) {}
      return Promise.resolve(false);
    }
    return ensureAccessToken().then(function () {
      applyRoleFromToken();
      return validateSessionOnServer();
    }).then(function (res) {
      if (!res.valid) { forceSecureLogout(res.reason || 'session_invalid'); return false; }
      return fetchOwnRegistry().then(function (reg) {
        if (!reg || reg.status !== 'active') { forceSecureLogout('unauthorized'); return false; }
        var role = applyRoleFromToken();
        try {
          currentUser = { id: (JSON.parse(_getSS(K.USER) || '{}').id), username: reg.username, nama_lengkap: reg.username, role: role, level: role, status: reg.status };
          adminUsername = reg.username;
          currentRole = role; adminLevel = role;
          sessionStorage.setItem('pamungkas_admin_level', role);
          sessionStorage.setItem('pamungkas_admin_user', reg.username);
          sessionStorage.setItem('pamungkas_current_role', role);
          sessionStorage.setItem('pamungkas_current_user', JSON.stringify(currentUser));
        } catch (e) {}
        console.log('[SECURITY] Sesi dipulihkan:', reg.username, role);
        return true;
      });
    }).catch(function (e) {
      if (e && e.genuine) {
        // Server MENOLAK token (invalid/expired) → logout sungguhan
        forceSecureLogout('session_expired');
      } else {
        // Error jaringan/race → jangan bunuh sesi tab lain; jalani mode publik
        try { console.warn('[SECURITY] init transient error:', (e && (e.message || e)) || e); } catch (x) {}
        try { currentRole = ''; adminLevel = ''; currentUser = null; } catch (x) {}
      }
      return false;
    });
  }

  /* ---------- API publik modul ---------- */
  window.PamungkasSecurity = {
    CFG: CFG,
    init: init,
    toAuthEmail: toAuthEmail,
    decodeJwtPayload: decodeJwtPayload,
    getAccessToken: getAccessToken,
    ensureAccessToken: ensureAccessToken,
    hasSession: hasSession,
    isLoggedIn: isLoggedIn,
    isIdleExpired: isIdleExpired,
    assertProtectedPage: assertProtectedPage,
    forceSecureLogout: forceSecureLogout,
    checkLock: checkLock,
    recordFailedLogin: recordFailedLogin,
    createServerSession: createServerSession,
    fetchOwnRegistry: fetchOwnRegistry,
    applyRoleFromToken: applyRoleFromToken,
    touchActivity: function () { touchActivity(true); },
    nhostSignIn: nhostSignIn,
    nhostSignOut: nhostSignOut,
    setTokens: setTokens,
    validateSessionOnServer: validateSessionOnServer
  };
  // alias pendek
  window.Sec = window.PamungkasSecurity;
})();
