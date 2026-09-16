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

/* ========== v7.6.1: FOTO GOOGLE DRIVE TAHAN GAGAL (FALLBACK BERANTAI) ==========
   Google Drive menolak sebagian request thumbnail secara SEMENTARA (404/429,
   throttle per file/IP) sehingga banyak foto gagal tampil walau URL-nya valid.
   Strategi: untuk tiap file ID tersedia 3 endpoint alternatif, dicoba berurutan;
   bila semua gagal, tunggu jeda lalu ulangi rantai SEKALI lagi sebelum menyerah
   (ikon placeholder). Dipakai dashboard & Profil SDMK Terlatih. */

/** Ekstrak file ID Google Drive dari berbagai bentuk URL */
function driveIdFromUrl(url){
  if(!url||typeof url!=='string')return null;url=url.trim();
  var m=url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);if(m)return m[1];
  m=url.match(/[?&]id=([a-zA-Z0-9_-]+)/);if(m)return m[1];
  return null;
}

/** Daftar kandidat URL gambar Drive utk ukuran tertentu (fallback berantai).
    Bukan link Drive → kembalikan [url] apa adanya (gambar langsung). */
function driveImgCandidates(url, size){
  size=size||200;
  var fid=driveIdFromUrl(url);
  if(!fid)return (url&&typeof url==='string')?[url]:[];
  return [
    'https://drive.google.com/thumbnail?id='+fid+'&sz=w'+size,
    'https://drive.google.com/uc?export=view&id='+fid,
    'https://lh3.googleusercontent.com/d/'+fid+'=w'+size
  ];
}

/* v7.6.2: siluet placeholder utk lightbox bila SEMUA kandidat foto gagal
   (mis. file Drive benar-benar privat & tidak punya thumbnail publik). */
var LB_IMG_PLACEHOLDER='data:image/svg+xml;utf8,'+encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">'+
  '<rect width="240" height="240" rx="16" fill="#eef1f5"/>'+
  '<circle cx="120" cy="92" r="36" fill="#c3ccd9"/>'+
  '<path d="M48 198c12-38 40-58 72-58s60 20 72 58z" fill="#c3ccd9"/>'+
  '</svg>');

/** Pasang rantai fallback pada <img>: coba tiap kandidat; semua gagal → jeda
    & ulang sekali; tetap gagal → onFinalFail(). Hentikan dgn img.dataset.chainStop='1'.
    v7.6.2: tiap mount diberi token unik — rantai lama (termasuk timer retry
    yang masih tertunda) otomatis mati saat img dipasangi rantai baru, sehingga
    perpindahan foto cepat di lightbox tidak bisa menampilkan foto yang salah. */
function mountResilientImg(img, candidates, onFinalFail, retryDelay, onSettled){
  if(!img||!candidates||!candidates.length)return;
  var token=String(Math.random());
  img.dataset.chainToken=token;
  var attempt=0, round=0, settled=false, _wd=null;
  function settle(){ /* v7.6.2: dipanggil SEKALI — sukses, gagal final, atau rantai mati; dipakai antrean utk melepas slot */
    if(_wd){ clearTimeout(_wd); _wd=null; }
    if(settled)return; settled=true;
    if(typeof onSettled==='function')onSettled();
  }
  function alive(){
    return img.isConnected&&img.dataset.chainToken===token&&img.dataset.chainStop!=='1';
  }
  function tryOne(){
    if(!alive()){ settle(); return; }
    img.src=candidates[attempt++];
  }
  function tryNext(){
    if(!alive()){ settle(); return; }
    if(attempt>=candidates.length){
      round++;
      if(round>=2){ if(typeof onFinalFail==='function')onFinalFail(); settle(); return; }
      attempt=0;
      setTimeout(function(){ if(alive())tryOne(); else settle(); },retryDelay||2500);
      return;
    }
    tryOne();
  }
  img.onload=function(){ if(alive())settle(); };
  img.onerror=function(){ tryNext(); };
  /* v7.6.2: pengawas — img `loading="lazy"` di section tersembunyi TIDAK PERNAH
     memicu onload/onerror sehingga slot antrean bisa macet; paksa lepas setelah 12s */
  _wd=setTimeout(function(){ settle(); },12000);
  tryOne();
}

/* v7.6.2: ANTREAN PEMUAT FOTO — burst puluhan request thumbnail serentak
   memicu throttle sementara Google Drive (404/429) sehingga banyak foto gagal
   tampil lalu diganti ikon placeholder. Antrean membatasi 3 request aktif dan
   memberi jeda antar-start sehingga Drive tidak menolak request. */
var _imgQueue={jobs:[],active:0,MAX:3,GAP:130};
function queueResilientImg(img,candidates,onFinalFail,retryDelay){
  if(!img||!candidates||!candidates.length)return;
  _imgQueue.jobs.push({img:img,c:candidates,f:onFinalFail,d:retryDelay});
  _pumpImgQueue();
}
function _pumpImgQueue(){
  if(_imgQueue.active>=_imgQueue.MAX||!_imgQueue.jobs.length)return;
  var j=_imgQueue.jobs.shift();
  if(!j.img.isConnected){ _pumpImgQueue(); return; } /* baris sudah tak ada di DOM → lewati */
  _imgQueue.active++;
  (function(job){
    mountResilientImg(job.img,job.c,function(){ if(typeof job.f==='function')job.f(); },job.d,function(){
      _imgQueue.active--;
      setTimeout(_pumpImgQueue,_imgQueue.GAP);
    });
  })(j);
  setTimeout(_pumpImgQueue,_imgQueue.GAP);
}
