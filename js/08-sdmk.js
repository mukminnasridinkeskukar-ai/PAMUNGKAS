/* ============================================================
   PAMUNGKAS — MODUL PROFIL SDMK TERLATIH
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/08-sdmk.js
   ============================================================ */

/* ========== PROFIL SDMK (Modern Redesign) ========== */
// Field names SESUAI dengan tabel sdmk di Nhost/Hasura
const SDMK_COLS = [
  {key:'nama',           tryLabels:['nama','Nama','Nama Lengkap','Nama Lengkap dengan Gelar']},
  {key:'nik',            tryLabels:['nik','NIK','NIP','NIK/NIP','NIK_NIP']},
  {key:'profesi',        tryLabels:['profesi','Profesi','Jenis Profesi']},
  {key:'unit_kerja',     tryLabels:['unit_kerja','Unit Kerja','Unit_Kerja','Unit']},
  {key:'nomor_sertifikat',tryLabels:['nomor_sertifikat','No. Sertifikat','Nomor Sertifikat','No Sertifikat','Sertifikat']},
  {key:'judul_kegiatan', tryLabels:['judul_kegiatan','Judul Kegiatan','Judul Pelatihan','Pelatihan','Kegiatan']},
  {key:'tanggal_pelaksanaan',tryLabels:['tanggal_pelaksanaan','Tgl Pelaksanaan','Tanggal Pelaksanaan','Tgl Pelaksana','Tanggal']},
  {key:'tahun',          tryLabels:['tahun','Tahun','Year','Tahun Pelatihan']},
  {key:'tempat_pelaksanaan',tryLabels:['tempat_pelaksanaan','Tempat','Tempat Pelaksanaan','Lokasi']}
];
// Tidak ada status_pelatihan di tabel sdmk Nhost - dihapus
const SENSITIVE_KEYS = ['nik','NIK','NIP','NIK/NIP','NIK_NIP','Nik','Nip'];

const _sdmk = {
  filtered: [],
  page: 1,
  perPage: 10,
  acIndex: -1,
  acItems: [],
  loaded: false
};

function _sdmkResolveCols(row) {
  const map = {};
  for (const col of SDMK_COLS) {
    for (const label of col.tryLabels) {
      if (row.hasOwnProperty(label)) { map[col.key] = label; break; }
    }
  }
  return map;
}

function _sdmkGetName(row) {
  const m = _sdmkResolveCols(row);
  return row[m.nama] || row.nama || '';
}

function extractYear(dateStr) {
  if (!dateStr) return '';
  dateStr = String(dateStr).trim();
  var m = dateStr.match(/(20\d{2})/);
  if (m) return m[1];
  return '';
}

function renderSDMKRekap(dataArray, targetId) {
  var container = document.getElementById(targetId);
  if (!container) return;
  if (!dataArray || !dataArray.length) { container.style.display = 'none'; return; }
  container.style.display = 'block';

  var years = [2022, 2023, 2024, 2025, 2026, 2027];
  var counts = {};
  years.forEach(function(y){ counts[y] = 0; });

  dataArray.forEach(function(r) {
    var m = _sdmkResolveCols(r);
    var yr = r[m.tahun] || extractYear(r[m.tglPelaksanaan] || '');
    yr = String(yr).trim();
    var numYr = parseInt(yr);
    if (numYr >= 2022 && numYr <= 2027) {
      counts[numYr]++;
    }
  });

  var grid = document.getElementById(targetId.replace('Section','Grid'));
  var totalEl = document.getElementById(targetId.replace('Section','Total'));
  var totalCnt = document.getElementById(targetId.replace('Section','TotalCount'));
  if (!grid) return;

  var html = '';
  var total = 0;
  years.forEach(function(y) {
    var c = counts[y];
    total += c;
    html += '<div class="sdmk-rekap-card">';
    html += '<div class="sdmk-rekap-year">' + y + '</div>';
    html += '<div class="sdmk-rekap-count">' + c + '</div>';
    html += '<div class="sdmk-rekap-label">SDMK Terlatih</div>';
    html += '</div>';
  });
  grid.innerHTML = html;

  if (totalEl && totalCnt) {
    totalEl.style.display = 'flex';
    totalCnt.textContent = total;
  }
}


function loadSDMK() {
  if (_sdmk.loaded) { renderTable(); return; }
  const skeleton = document.getElementById('sdmkSkeleton');
  const empty = document.getElementById('sdmkEmpty');
  const tbody = document.getElementById('sdmkTableBody');
  skeleton.classList.add('visible');
  empty.style.display = 'none';
  tbody.innerHTML = '';

  callServer('getSDMK').then(res => {
    skeleton.classList.remove('visible');
    if (!res || !res.success) { showToast(res ? res.message : 'Gagal memuat SDMK', 'error'); return; }
    _allSDMK = res.data || [];
    _sdmk.filtered = [..._allSDMK];
    _sdmk.loaded = true;
    renderSDMKRekap(_allSDMK, 'sdmkRekapSection');
    _sdmk.page = 1;
    renderTable();
    showAdminButtons();
  }).catch(e => {
    skeleton.classList.remove('visible');
    showToast('Error: ' + (e.message || e), 'error');
  });
}

function filterData(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) { _sdmk.filtered = [..._allSDMK]; }
  else {
    _sdmk.filtered = _allSDMK.filter(r => {
      const name = _sdmkGetName(r).toLowerCase();
      return name.indexOf(q) !== -1;
    });
  }
  _sdmk.page = 1;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('sdmkTableBody');
  const empty = document.getElementById('sdmkEmpty');
  const pagination = document.getElementById('sdmkPagination');
  const aksiTh = document.getElementById('sdmkAksiTh');
  const data = _sdmk.filtered;
  const totalPages = Math.max(1, Math.ceil(data.length / _sdmk.perPage));
  if (_sdmk.page > totalPages) _sdmk.page = totalPages;
  const start = (_sdmk.page - 1) * _sdmk.perPage;
  const pageData = data.slice(start, start + _sdmk.perPage);
  const writable = canWrite('sdmk');

  if (writable) { aksiTh.style.display = ''; } else { aksiTh.style.display = 'none'; }

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    pagination.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  const _driveThumb = function(url) {
    if (!url || typeof url !== 'string') return null; url = url.trim();
    if (/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url)) return url;
    let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w200';
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w200';
    return null;
  };
  const _driveFull = function(url) {
    if (!url) return '';
    let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800';
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800';
    return url;
  };
  const _v = function(row, names) { for (const n of names) { if (row[n] !== undefined && row[n] !== '') return row[n]; } return ''; };

  let html = '';
  pageData.forEach((r, i) => {
    const origIdx = _allSDMK.indexOf(r);
    const m = _sdmkResolveCols(r);
    // Gunakan field names SESUAI tabel sdmk Nhost/Hasura
    const nama = escHTML(r[m.nama] || r.nama || '-');
    const profesi = escHTML(r[m.profesi] || r.profesi || '-');
    const unit = escHTML(r[m.unit_kerja] || r.unit_kerja || '-');
    const noSertifikat = escHTML(r[m.nomor_sertifikat] || r.nomor_sertifikat || '-');
    const kegiatan = escHTML(r[m.judul_kegiatan] || r.judul_kegiatan || '-');
    const tglPelaksanaan = escHTML(r[m.tanggal_pelaksanaan] || r.tanggal_pelaksanaan || '-');
    const tempat = escHTML(r[m.tempat_pelaksanaan] || r.tempat_pelaksanaan || '-');
    // Foto dari field 'foto' di tabel sdmk
    const fotoRaw = r.foto || '';
    const thumb = _driveThumb(fotoRaw);
    const fullUrl = _driveFull(fotoRaw);

    html += '<tr data-idx="' + origIdx + '" data-full="' + escHTML(fullUrl) + '" data-name="' + nama + '">';
    if (thumb) {
      html += '<td><div class="sdmk-photo"><img src="' + escHTML(thumb) + '" alt="Foto" loading="lazy" onerror="this.parentElement.innerHTML=\'<i class=\\\'fas fa-user ph-icon\\\'></i>\'" /></div></td>';
    } else {
      html += '<td><div class="sdmk-photo"><i class="fas fa-user ph-icon"></i></div></td>';
    }
    html += '<td class="sdmk-cell-nama">' + nama + '</td>';
    // Tambah kolom NIK
    const nikVal = r[m.nik] || r.nik || '-';
    html += '<td>' + escHTML(nikVal) + '</td>';
    html += '<td class="sdmk-cell-profesi">' + profesi + '</td>';
    html += '<td>' + unit + '</td>';
    html += '<td>' + noSertifikat + '</td>';
    html += '<td class="sdmk-cell-kegiatan">' + kegiatan + '</td>';
    html += '<td>' + tglPelaksanaan + '</td>';
    const tahunRaw = r[m.tahun] || r.tahun || extractYear(tglPelaksanaan);
    html += '<td>' + escHTML(tahunRaw || '-') + '</td>';
    html += '<td>' + tempat + '</td>';
    // Status Pelatihan dihapus karena tidak ada di tabel sdmk Nhost
    if (writable) {
      html += '<td><div class="sdmk-aksi">';
      html += '<button class="btn btn-sm btn-warning" onclick="event.stopPropagation();editSDMK(' + origIdx + ')"><i class="fas fa-edit"></i></button>';
      html += '<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();confirmDelete(\'SDMK\',' + origIdx + ')"><i class="fas fa-trash"></i></button>';
      html += '</div></td>';
    }
    html += '</tr>';
  });
  tbody.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const tmp = document.createElement('div');
  tmp.innerHTML = '<table><tbody>' + html + '</tbody></table>';
  const rows = tmp.querySelectorAll('tr');
  rows.forEach(tr => {
    const idx = parseInt(tr.getAttribute('data-idx'));
    tr.addEventListener('click', e => {
      if (e.target.closest('.btn')) return;
      if (e.target.closest('.sdmk-photo')) {
        const fullUrl = tr.getAttribute('data-full');
        const phName = tr.getAttribute('data-name');
        if (fullUrl) {
          const lb = document.getElementById('sdmkLightbox');
          document.getElementById('sdmkLightboxImg').src = fullUrl;
          document.getElementById('sdmkLightboxName').textContent = phName || '';
          lb.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
        return;
      }
      const safeRow = {..._allSDMK[idx]};
      SENSITIVE_KEYS.forEach(k => { delete safeRow[k]; });
      openDetailModal('Detail SDMK: ' + (_allSDMK[idx].nama || ''), safeRow);
    });
    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('sdmkPagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  const p = _sdmk.page;
  let html = '';
  html += '<button ' + (p <= 1 ? 'disabled' : '') + ' onclick="_sdmk.page=' + (p-1) + ';renderTable();">&#9664;</button>';

  const range = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) range.push(i);
  } else {
    range.push(1);
    if (p > 3) range.push('...');
    for (let i = Math.max(2, p - 1); i <= Math.min(totalPages - 1, p + 1); i++) range.push(i);
    if (p < totalPages - 2) range.push('...');
    range.push(totalPages);
  }

  for (const item of range) {
    if (item === '...') {
      html += '<span class="sdmk-page-info">...</span>';
    } else {
      html += '<button class="' + (item === p ? 'active' : '') + '" onclick="_sdmk.page=' + item + ';renderTable();">' + item + '</button>';
    }
  }

  html += '<button ' + (p >= totalPages ? 'disabled' : '') + ' onclick="_sdmk.page=' + (p+1) + ';renderTable();">&#9654;</button>';
  html += '<span class="sdmk-page-info">' + _sdmk.filtered.length + ' data</span>';
  el.innerHTML = html;
}

function renderAutocomplete(query) {
  const ac = document.getElementById('sdmkAutocomplete');
  const clearBtn = document.getElementById('sdmkSearchClear');
  const q = (query || '').trim();

  if (q.length < 2) {
    ac.classList.remove('active');
    ac.innerHTML = '';
    _sdmk.acItems = [];
    _sdmk.acIndex = -1;
    clearBtn.classList.toggle('visible', q.length > 0);
    return;
  }

  clearBtn.classList.add('visible');
  const lower = q.toLowerCase();
  const matches = _allSDMK.filter(r => _sdmkGetName(r).toLowerCase().indexOf(lower) !== -1).slice(0, 8);

  if (!matches.length) {
    ac.innerHTML = '<div class="sdmk-ac-empty"><i class="fas fa-user-slash" style="margin-right:6px;"></i>Tidak ditemukan</div>';
    ac.classList.add('active');
    _sdmk.acItems = [];
    _sdmk.acIndex = -1;
    return;
  }

  _sdmk.acItems = matches;
  _sdmk.acIndex = -1;
  let html = '';
  matches.forEach((r, i) => {
    const name = _sdmkGetName(r);
    const m = _sdmkResolveCols(r);
    const prof = r[m.profesi] || '';
    html += '<div class="sdmk-ac-item" data-acidx="' + i + '">';
    html += '<i class="fas fa-user-md ac-ico"></i>';
    html += '<span>' + escHTML(name) + '</span>';
    if (prof) html += '<span class="ac-sub">' + escHTML(prof) + '</span>';
    html += '</div>';
  });
  ac.innerHTML = html;
  ac.classList.add('active');

  ac.querySelectorAll('.sdmk-ac-item').forEach(item => {
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      selectParticipant(parseInt(item.getAttribute('data-acidx')));
    });
    item.addEventListener('mouseenter', () => {
      ac.querySelectorAll('.sdmk-ac-item').forEach(el => el.classList.remove('highlighted'));
      item.classList.add('highlighted');
      _sdmk.acIndex = parseInt(item.getAttribute('data-acidx'));
    });
  });
}

function selectParticipant(acIdx) {
  const r = _sdmk.acItems[acIdx];
  if (!r) return;
  const name = _sdmkGetName(r);
  document.getElementById('sdmkSearch').value = name;
  document.getElementById('sdmkAutocomplete').classList.remove('active');
  document.getElementById('sdmkSearchClear').classList.add('visible');
  filterData(name);
}

function clearSearch() {
  const input = document.getElementById('sdmkSearch');
  input.value = '';
  input.focus();
  document.getElementById('sdmkAutocomplete').classList.remove('active');
  document.getElementById('sdmkSearchClear').classList.remove('visible');
  _sdmk.acItems = [];
  _sdmk.acIndex = -1;
  filterData('');
}

// SDMK search input events — autocomplete + keyboard nav (direct, script at bottom of body so DOM is ready)
(function initSDMKSearch() {
  const input = document.getElementById('sdmkSearch');
  if (!input) return;

  input.addEventListener('input', e => {
    renderAutocomplete(e.target.value);
  });

  input.addEventListener('keydown', e => {
    const ac = document.getElementById('sdmkAutocomplete');
    const items = ac.querySelectorAll('.sdmk-ac-item');

    if (!ac.classList.contains('active') || !_sdmk.acItems.length) {
      if (e.key === 'Enter') { e.preventDefault(); filterData(input.value); }
      if (e.key === 'Escape') clearSearch();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _sdmk.acIndex = Math.min(_sdmk.acIndex + 1, _sdmk.acItems.length - 1);
      items.forEach((el, i) => el.classList.toggle('highlighted', i === _sdmk.acIndex));
      items[_sdmk.acIndex].scrollIntoView({block:'nearest'});
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _sdmk.acIndex = Math.max(_sdmk.acIndex - 1, 0);
      items.forEach((el, i) => el.classList.toggle('highlighted', i === _sdmk.acIndex));
      items[_sdmk.acIndex].scrollIntoView({block:'nearest'});
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (_sdmk.acIndex >= 0 && _sdmk.acItems[_sdmk.acIndex]) {
        selectParticipant(_sdmk.acIndex);
      } else {
        filterData(input.value);
      }
    } else if (e.key === 'Escape') {
      ac.classList.remove('active');
      _sdmk.acIndex = -1;
    }
  });

  // Close autocomplete on outside click
  document.addEventListener('click', e => {
    const ac = document.getElementById('sdmkAutocomplete');
    if (ac && !e.target.closest('#sdmkSearchWrap')) {
      ac.classList.remove('active');
      _sdmk.acIndex = -1;
    }
  });

  // Clear button
  document.getElementById('sdmkSearchClear').addEventListener('click', clearSearch);
})();

// Alias for backward compatibility (admin panel uses filterSDMK in some contexts)
function filterSDMK(){ filterData(document.getElementById('sdmkSearch').value); }
function renderSDMKTable(data){ _sdmk.filtered = data || [..._allSDMK]; _sdmk.page = 1; renderTable(); }
function openSDMKForm(idx){
  document.getElementById('sdmkEditIndex').value = idx !== undefined ? idx : -1;
  document.getElementById('sdmkFormTitle').textContent = idx !== undefined ? 'Edit SDMK' : 'Tambah SDMK';
  if (idx !== undefined) {
    var r = _allSDMK[idx];
    // Gunakan field names SESUAI tabel sdmk Nhost/Hasura
    document.getElementById('sdmkNama').value = r.nama || '';
    document.getElementById('sdmkNIK').value = r.nik || '';
    document.getElementById('sdmkProfesi').value = r.profesi || '';
    document.getElementById('sdmkUnit').value = r.unit_kerja || '';
    document.getElementById('sdmkNoSertifikat').value = r.nomor_sertifikat || '';
    document.getElementById('sdmkJudulKegiatan').value = r.judul_kegiatan || '';
    document.getElementById('sdmkTglPelaksanaan').value = r.tanggal_pelaksanaan || '';
    document.getElementById('sdmkTahun').value = r.tahun || extractYear(r.tanggal_pelaksanaan || '') || '';
    document.getElementById('sdmkTempat').value = r.tempat_pelaksanaan || '';
  } else {
    document.getElementById('sdmkForm').reset();
  }
  openModal('sdmkFormModal');
}
function editSDMK(i){ openSDMKForm(i); }
function submitSDMK(e){
  e.preventDefault();
  var idx = parseInt(document.getElementById('sdmkEditIndex').value);
  // Gunakan field names SESUAI tabel sdmk Nhost/Hasura
  var data = {
    nama: document.getElementById('sdmkNama').value,
    nik: document.getElementById('sdmkNIK').value,
    profesi: document.getElementById('sdmkProfesi').value,
    unit_kerja: document.getElementById('sdmkUnit').value,
    nomor_sertifikat: document.getElementById('sdmkNoSertifikat').value,
    judul_kegiatan: document.getElementById('sdmkJudulKegiatan').value,
    tanggal_pelaksanaan: document.getElementById('sdmkTglPelaksanaan').value,
    tahun: document.getElementById('sdmkTahun').value,
    tempat_pelaksanaan: document.getElementById('sdmkTempat').value
  };
  showLoading('Menyimpan...');
  var done=function(res){hideLoading();closeModal('sdmkFormModal');showToast(res.message,res.success?'success':'error');if(res.success){_sdmk.loaded=false;loadSDMK();}};
  var fail=function(e){hideLoading();showToast('Error: '+(e.message||e),'error');};
  if(idx>=0)callServer('updateSDMK',{idx:idx,data:data}).then(done).catch(fail);
  else callServer('tambahSDMK',data).then(done).catch(fail);
}

/**
 * openImportSDMK() - Buka modal import khusus SDMK
 * Mode: DATA GANDA DIPERBOLEHKAN (NIK/NIP/Nama boleh sama)
 */
function openImportSDMK() {
  console.log('[IMPORT] Opening SDMK Import Modal - Data Ganda Diperbolehkan');
  
  // Set sheet type ke sdmk
  _crud.sheetType = 'sdmk';
  
  // Reset state import
  _importData = [];
  
  // Reset UI
  document.getElementById('importPreview').style.display = 'none';
  document.getElementById('importSubmitBtn').disabled = true;
  document.getElementById('importFileInput').value = '';
  
  // Tampilkan info khusus SDMK
  var sdmkInfo = document.getElementById('importSdmkInfo');
  var sdmkTemplate = document.getElementById('sdmkTemplateHint');
  if (sdmkInfo) sdmkInfo.style.display = 'block';
  if (sdmkTemplate) sdmkTemplate.style.display = 'block';
  document.getElementById('importSheetName').textContent = 'SDMK (Data Ganda Diperbolehkan)';
  
  // Buka modal
  openModal('importModal');
}
