/* ============================================================
   PAMUNGKAS — UTILITAS DASAR (DOM Helper, Storage, Toast & Modal)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/02-utils.js
   ============================================================ */

/* ========== NULL-SAFE DOM HELPERS ========== */
/**
 * Safe DOM helpers - prevent "Cannot read properties of null" errors
 * All functions return boolean: true if successful, false if element not found
 */
function _safeDisplay(id, val) {
  try {
    var el = document.getElementById(id);
    if (!el) { console.warn('[DOM] _safeDisplay: #' + id + ' tidak ditemukan'); return false; }
    el.style.display = val;
    return true;
  } catch (e) {
    console.error('[DOM] _safeDisplay error:', id, e);
    return false;
  }
}

function _safeHTML(id, html) {
  try {
    var el = document.getElementById(id);
    if (!el) { console.warn('[DOM] _safeHTML: #' + id + ' tidak ditemukan'); return false; }
    el.innerHTML = html;
    return true;
  } catch (e) {
    console.error('[DOM] _safeHTML error:', id, e);
    return false;
  }
}

function _safeText(id, text) {
  try {
    var el = document.getElementById(id);
    if (!el) { console.warn('[DOM] _safeText: #' + id + ' tidak ditemukan'); return false; }
    el.textContent = text;
    return true;
  } catch (e) {
    console.error('[DOM] _safeText error:', id, e);
    return false;
  }
}

/**
 * Safe classList operations
 */
function _safeClassList(id, action, className) {
  try {
    var el = document.getElementById(id);
    if (!el) { console.warn('[DOM] _safeClassList: #' + id + ' tidak ditemukan'); return false; }
    switch(action) {
      case 'add': el.classList.add(className); break;
      case 'remove': el.classList.remove(className); break;
      case 'toggle': el.classList.toggle(className); break;
      case 'contains': return el.classList.contains(className);
      default: console.warn('[DOM] _safeClassList: action tidak valid:', action); return false;
    }
    return true;
  } catch (e) {
    console.error('[DOM] _safeClassList error:', id, e);
    return false;
  }
}

/**
 * Safe value get/set
 */
function _safeValue(id, newVal) {
  try {
    var el = document.getElementById(id);
    if (!el) { 
      if (newVal !== undefined) console.warn('[DOM] _safeValue: #' + id + ' tidak ditemukan (set)');
      return newVal !== undefined ? false : '';
    }
    if (newVal !== undefined) {
      el.value = newVal;
      return true;
    }
    return el.value;
  } catch (e) {
    console.error('[DOM] _safeValue error:', id, e);
    return newVal !== undefined ? false : '';
  }
}

/**
 * Safe style property set
 */
function _safeStyle(id, prop, val) {
  try {
    var el = document.getElementById(id);
    if (!el) { console.warn('[DOM] _safeStyle: #' + id + ' tidak ditemukan'); return false; }
    el.style[prop] = val;
    return true;
  } catch (e) {
    console.error('[DOM] _safeStyle error:', id, e);
    return false;
  }
}

/**
 * Get element safely - returns null with warning if not found
 */
function _getEl(id) {
  var el = document.getElementById(id);
  if (!el) console.warn('[DOM] _getEl: #' + id + ' tidak ditemukan');
  return el;
}

/**
 * Query selector safe
function _qs(selector) {
  var el = document.querySelector(selector);
  if (!el) console.warn('[DOM] _qs: "' + selector + '" tidak ditemukan');
  return el;
}
 */

/* ---------- SAFE STORAGE ---------- */
/* ========== SAFE STORAGE WRAPPER (Sandbox-Friendly) ========== 
 * Mengatasi error: "Failed to read 'localStorage' from 'Window': document is sandboxed"
 * Fallback ke memory storage jika localStorage tidak tersedia
 */
var _memoryStorage = {};
var safeStorage = {
  getItem: function(key) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('[Storage] localStorage tidak tersedia, menggunakan memory fallback:', e.message);
    }
    return _memoryStorage[key] || null;
  },
  setItem: function(key, value) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('[Storage] localStorage tidak tersedia, menyimpan di memory:', e.message);
    }
    _memoryStorage[key] = value;
  },
  removeItem: function(key) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn('[Storage] localStorage tidak tersedia, menghapus dari memory:', e.message);
    }
    delete _memoryStorage[key];
  },
  clear: function() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn('[Storage] localStorage tidak tersedia, membersihkan memory:', e.message);
    }
    _memoryStorage = {};
  }
};

/* ---------- UTILITAS UI ---------- */
/* ========== UTILITAS UI ========== */
function showLoading(t){
  var o = document.getElementById('loading-overlay');
  if (!o) { console.warn('[DOM] showLoading: #loading-overlay tidak ditemukan'); return; }
  var textEl = o.querySelector('.loading-text');
  if (textEl) textEl.textContent = t || 'Memuat data...';
  o.classList.add('active');
}
function hideLoading(){
  var o = document.getElementById('loading-overlay');
  if (o) o.classList.remove('active');
  else console.warn('[DOM] hideLoading: #loading-overlay tidak ditemukan');
}
function showToast(msg, type){
  type = type || 'info';
  var c = document.getElementById('toastContainer');
  if (!c) { console.warn('[DOM] showToast: #toastContainer tidak ditemukan'); return; }
  var d = document.createElement('div');
  d.className = 'toast ' + type;
  var ic = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  d.innerHTML = '<i class="fas ' + ic + '"></i><span class="toast-text">' + msg + '</span>';
  c.appendChild(d);
  setTimeout(function(){ 
    d.style.opacity = '0'; 
    d.style.transform = 'translateX(40px)'; 
    d.style.transition = 'all .3s ease'; 
    setTimeout(function(){ if(d.parentNode) d.remove(); }, 300); 
  }, 4000);
}
function openModal(id){
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  else console.warn('[DOM] openModal: #' + id + ' tidak ditemukan');
}
function closeModal(id){
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
  else console.warn('[DOM] closeModal: #' + id + ' tidak ditemukan');
}
function escHTML(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
