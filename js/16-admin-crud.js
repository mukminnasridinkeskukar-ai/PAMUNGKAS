/* ============================================================
   PAMUNGKAS — PANEL ADMIN — CRUD Engine, Tab Pendaftaran, Export & Import Excel
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/16-admin-crud.js
   ============================================================ */

/* ========== KONFIRMASI HAPUS ========== */
function confirmDelete(sheet,idx){
  document.getElementById('confirmText').textContent='Apakah Anda yakin ingin menghapus data ini dari tabel '+sheet+'?';  // ✅ Updated from "sheet" to "tabel"
  document.getElementById('confirmDeleteBtn').onclick=function(){executeDelete(sheet,idx);};
  openModal('confirmModal');
}
function executeDelete(sheet,idx){
  closeModal('confirmModal');showLoading('Menghapus...');
  var fnMap={Pengumuman:'hapusPengumuman',SDMK:'hapusSDMK',Pendaftaran:'hapusPendaftaran',Sertifikat:'hapusSertifikat',Materi:'hapusMateri',Admin:'hapusAdmin',Multiusers:'hapusMultiuser'};
  if(!canWrite(sheet.toLowerCase())){hideLoading();showToast('Anda tidak memiliki izin untuk menghapus data ini.','error');return;}
  var fn=fnMap[sheet];if(!fn){hideLoading();showToast('Sheet tidak dikenali.','error');return;}
  var reloadFn=null;
  switch(sheet){case 'Pengumuman':reloadFn=loadPengumuman;break;case 'SDMK':reloadFn=function(){_sdmk.loaded=false;loadSDMK();};break;case 'Pendaftaran':reloadFn=loadPendaftaran;break;case 'Sertifikat':reloadFn=function(){if(typeof loadAdminSertifikat==='function')loadAdminSertifikat();};break;case 'Materi':reloadFn=loadCekMateriPublic;break;case 'Admin':case 'Multiusers':reloadFn=function(){if(typeof loadAdminList==='function')loadAdminList();};break;}
  callServer(fn,{idx:idx}).then(function(res){hideLoading();showToast(res.message,res.success?'success':'error');if(res.success&&reloadFn)reloadFn();}).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}

/* ========== ADMIN: NAVIGATION (Tab dalam SATU frame Panel Admin) ========== */
/**
 * closeAdminCrud() - Kompatibilitas: kembali ke tab Ringkasan.
 * Sub-halaman terpisah sudah digantikan tab di dalam satu frame.
 */
function closeAdminCrud(){
  _adminPanelActiveTab = 'ringkasan';
  if (currentPage === 'panel-admin' && typeof switchAdminTab === 'function') switchAdminTab('ringkasan');
}

/* ================================================================
 * PENDAFTARAN TAB SYSTEM - Data Pendaftaran | Input Massal
 * ================================================================ */

/**
 * renderPendaftaranTabSystem() - Render TAB system untuk halaman Pendaftaran
 * TAB 1: Data Pendaftaran (CRUD biasa)
 * TAB 2: Input Massal (CSV Import) - Hanya untuk superadmin & admin
 */
function renderPendaftaranTabSystem(container, tableConfig, titles, writable, canBulkImport, readOnly) {
  var role = getCurrentRole();
  console.log('[PENDAFTARAN] Rendering Tab System for role:', role, '| bulk_import:', canBulkImport);
  
  // Build HTML structure with tabs
  var html = '';
  
  // Page Header
  html += '<div class="page-header">';
  html += '<h2><i class="fas ' + tableConfig.icon + '" style="margin-right:8px;color:var(--primary);"></i>Pendaftaran</h2>';
  html += '<p>Kelola seluruh data pendaftaran dari database Nhost.</p>';
  html += '</div>';
  
  // TAB NAVIGATION
  html += '<div class="admin-tabs" id="pendaftaranTabs">';
  html += '  <button class="admin-tab active" data-tab="pendaftaran-data" onclick="switchPendaftaranTab(\'pendaftaran-data\')">';
  html += '    <i class="fas fa-table"></i> Data Pendaftaran';
  html += '  </button>';
  
  // Tab Input Massal - Hanya tampilkan jika role punya permission bulk_import
  if (canBulkImport) {
    html += '  <button class="admin-tab" data-tab="pendaftaran-import" id="tabInputMassal" onclick="switchPendaftaranTab(\'pendaftaran-import\')">';
    html += '    <i class="fas fa-file-import"></i> Input Massal';
    html += '  </button>';
    console.log('[PENDAFTARAN] Input Massal tab VISIBLE for role:', role);
  } else {
    console.log('[PENDAFTARAN] Input Massal tab HIDDEN for role:', role);
  }
  
  html += '</div>'; // end tabs
  
  // TAB PANEL 1: Data Pendaftaran (CRUD)
  html += '<div class="tab-panel active" id="panel-pendaftaran-data">';
  html += '  <div id="pendaftaranCrudContent"></div>';
  html += '</div>';
  
  // TAB PANEL 2: Input Massal (CSV Import)
  if (canBulkImport) {
    html += '<div class="tab-panel" id="panel-pendaftaran-import">';
    html += renderImportMassalUI();
    html += '</div>';
  }
  
  container.innerHTML = html;
  
  // Load data into Tab 1 (Data Pendaftaran)
  loadPendaftaranCrudData(writable, readOnly);
}

/**
 * switchPendaftaranTab() - Switch antara tab di Pendaftaran
 */
function switchPendaftaranTab(tabId) {
  console.log('[PENDAFTARAN] Switching to tab:', tabId);
  
  // Update tab buttons
  var tabs = document.querySelectorAll('#pendaftaranTabs .admin-tab');
  tabs.forEach(function(tab) {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update panels
  var panels = document.querySelectorAll('.tab-panel');
  panels.forEach(function(panel) {
    if (panel.id === 'panel-' + tabId) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
  
  // Special handling when switching to import tab
  if (tabId === 'pendaftaran-import') {
    resetImportState();
  }
}

/**
 * loadPendaftaranCrudData() - Load data Pendaftaran ke dalam Tab 1
 */
function loadPendaftaranCrudData(writable, readOnly) {
  console.log('[PENDAFTARAN] Loading CRUD data...');
  
  var contentDiv = document.getElementById('pendaftaranCrudContent');
  if (!contentDiv) {
    console.warn('[DOM] #pendaftaranCrudContent tidak ditemukan');
    return;
  }
  
  _crud.sheetType = 'pendaftaran';
  _crud.writable = writable;
  _crud.page = 1;
  _crud.perPage = 10;
  _crud.sortCol = '';
  _crud.sortDir = 'asc';
  _crud.searchTerm = '';
  _crud.filters = {};
  
  showLoading('Memuat data Pendaftaran...');
  
  callServer('getPendaftaran').then(function(res) {
    hideLoading();
    
    if (!res || !res.success) {
      contentDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle" style="font-size:2rem;color:var(--accent);"></i><p>' + 
        escHTML(res ? res.message : 'Gagal memuat data Pendaftaran') + '</p></div>';
      return;
    }
    
    _crud.allData = res.data || [];
    _crud.filteredData = [..._crud.allData];
    _allPendaftaran = res.data || [];
    
    if (_crud.allData.length > 0) {
      _crud.headers = Object.keys(_crud.allData[0]);
      // ✅ PASTIKAN catatan_admin selalu ada di headers (jika belum ada dari database)
      if (_crud.headers.indexOf('catatan_admin') === -1) {
        _crud.headers.push('catatan_admin');
        console.log('[PENDAFTARAN] Added catatan_admin to headers (not in DB response)');
      }
    } else {
      // ✅ Fallback headers - include catatan_admin
      _crud.headers = ['nik', 'nama_lengkap_dengan_gelar', 'jenis_kelamin', 'tempat_dan_tanggal_lahir', 'nip', 'pekerjaan', 'unit_kerja', 'jenis_sdmk', 'jenis_profesi', 'nomor_whatsapp', 'email_plataran_sehat', 'alamat_rumah', 'lama_bekerja_di_unit_sekarang', 'surat_pernyataan', 'judul_kegiatan', 'status', 'catatan_admin'];
    }
    
    // Gunakan displayFields dari config (maks 7 kolom), filter hanya yang ada di data
    var pendaftaranConfig = ADMIN_TABLES.pendaftaran;
    var availPendFields = _crud.headers;
    if (pendaftaranConfig && pendaftaranConfig.displayFields && pendaftaranConfig.displayFields.length > 0) {
      _crud.visibleCols = pendaftaranConfig.displayFields.filter(function(f) {
        return availPendFields.indexOf(f) !== -1;
      });
      if (_crud.visibleCols.length === 0) {
        _crud.visibleCols = [...availPendFields];
      }
    } else {
      _crud.visibleCols = [...availPendFields];
    }
    _crud.filterCols = detectFilterColumns('pendaftaran');
    
    renderPendaftaranCrudUI(contentDiv);
    console.log('[PENDAFTARAN] Data loaded:', _crud.allData.length, 'records');
    
  }).catch(function(e) {
    hideLoading();
    console.error('[PENDAFTARAN] Error loading data:', e);
    showToast('Gagal memuat data: ' + (e.message || e), 'error');
    contentDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:2rem;color:var(--danger);"></i><p>Error: ' + 
      escHTML(e.message || 'Unknown error') + '</p></div>';
  });
}

/**
 * renderPendaftaranCrudUI() - Render CRUD table khusus untuk Pendaftaran Tab 1
 */
function renderPendaftaranCrudUI(container) {
  if (!_crud.allData.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox" style="font-size:2.5rem;color:var(--text-muted);"></i><p>Belum ada data Pendaftaran.</p>' +
    (_crud.writable ? '<button class="btn btn-primary" style="margin-top:16px;" onclick="openDynForm(-1)"><i class="fas fa-plus"></i> Tambah Data</button>' : '') + '</div>';
    return;
  }

  var filterHTML = '';
  if (_crud.filterCols.length > 0) {
    filterHTML = '<div class="crud-filters">';
    _crud.filterCols.forEach(function(col) {
      var opts = getUniqueValues(col);
      filterHTML += '<select onchange="applyFilter(\'' + escHTML(col).replace(/'/g, "\\'") + '\',this.value)" id="filter_' + col.replace(/[^a-zA-Z0-9]/g, '_') + '">';
      filterHTML += '<option value="">Semua ' + escHTML(col) + '</option>';
      opts.forEach(function(v) {
        var sel = _crud.filters[col] === v ? ' selected' : '';
        filterHTML += '<option value="' + escHTML(v) + '"' + sel + '>' + escHTML(v || '(kosong)') + '</option>';
      });
      filterHTML += '</select>';
    });
    filterHTML += '</div>';
  }

  var html = '';

  /* Toolbar */
  html += '<div class="crud-toolbar">';
  html += '<div class="crud-search"><i class="fas fa-search"></i><input type="text" id="crudSearchInput" placeholder="Cari berdasarkan Nama, NIK, NIP, Profesi, Unit Kerja..." value="' + escHTML(_crud.searchTerm) + '" oninput="crudSearch(this.value)" /></div>';
  html += filterHTML;
  html += '<div class="crud-actions">';
  if (_crud.writable) html += '<button class="btn btn-primary" onclick="openDynForm(-1)"><i class="fas fa-plus"></i> Tambah Pendaftaran</button>';
  html += '<button class="btn btn-secondary" onclick="refreshPendaftaranData()"><i class="fas fa-sync-alt"></i> Refresh</button>';
  html += '<div class="col-vis-wrap"><button class="col-vis-btn" onclick="toggleColVis()"><i class="fas fa-columns"></i> Kolom</button><div class="col-vis-dropdown" id="colVisDropdown"></div></div>';
  html += '<button class="btn btn-secondary" onclick="exportCSV()"><i class="fas fa-file-csv"></i> CSV</button>';
  if (typeof XLSX !== 'undefined') html += '<button class="btn btn-secondary" onclick="exportExcel()"><i class="fas fa-file-excel"></i> Excel</button>';
  if (typeof jspdf !== 'undefined') html += '<button class="btn btn-secondary" onclick="exportPDF()"><i class="fas fa-file-pdf"></i> PDF</button>';
  html += '</div></div>';

  /* Table */
  html += '<div class="crud-table-container"><div class="crud-table-scroll"><table class="crud-table"><thead><tr>';
  html += '<th class="no-sort" style="width:50px;text-align:center;">No</th>';
  _crud.visibleCols.forEach(function(col) {
    var isSorted = _crud.sortCol === col;
    var icon = isSorted ? (_crud.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
    html += '<th class="' + (isSorted ? 'sorted' : '') + '" onclick="crudSort(\'' + escHTML(col).replace(/'/g, "\\'") + '\')">' + escHTML(col) + ' <i class="fas ' + icon + ' sort-icon"></i></th>';
  });
  html += '<th class="no-sort" style="text-align:center;">Aksi</th>';
  html += '</tr></thead><tbody id="crudTableBody"></tbody></table></div></div>';

  /* Pagination */
  html += '<div class="crud-pagination"><div class="crud-page-info">Menampilkan <strong id="crudPageStart">0</strong>-<strong id="crudPageEnd">0</strong> dari <strong id="crudTotalRows">0</strong> data</div>';
  html += '<div class="crud-page-size"><label>Tampilkan:</label><select id="crudPageSize" onchange="crudChangePageSize(this.value)">';
  [10, 25, 50, 100].forEach(function(n) { html += '<option value="' + n + '"' + (_crud.perPage === n ? ' selected' : '') + '>' + n + '</option>'; });
  html += '<option value="all"' + (_crud.perPage === 99999 ? ' selected' : '') + '>Semua</option>';
  html += '</select></div>';
  html += '<div class="crud-page-btns" id="crudPageBtns"></div></div>';

  container.innerHTML = html;

  buildColVisDropdown();
  renderCrudTable();

  /* Focus search */
  var si = document.getElementById('crudSearchInput');
  if (si) {
    si.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { this.value = ''; crudSearch(''); }
    });
  }
}

/**
 * refreshPendaftaranData() - Refresh data Pendaftaran dari Nhost
 */
function refreshPendaftaranData() {
  console.log('[PENDAFTARAN] Refreshing data from Nhost...');
  loadPendaftaranCrudData(_crud.writable, !_crud.writable);
}

/* ========== ADMIN: KELOLA AKUN ADMIN ========== */
function loadAdminList(){
  showLoading('Memuat...');callServer('getAdmin').then(function(res){hideLoading();
  var ct=document.getElementById('adminCrudTable');
  if(!res||!res.success){ct.innerHTML='<div class="empty-state"><p>'+escHTML(res?res.message:'Gagal memuat')+'</p></div>';return;}
  _allAdmin=res.data||[];
  var html='';
  if(canWrite('multiusers'))html+='<div class="toolbar" style="margin-bottom:16px;"><button class="btn btn-primary" onclick="openAdminForm()"><i class="fas fa-plus"></i> Tambah Admin</button></div>';
  if(!_allAdmin.length){html+='<div class="empty-state"><i class="fas fa-users-cog" style="font-size:2rem;color:var(--text-muted);"></i><p>Belum ada akun admin di database. Akun default (admin/admin123) aktif sebagai Admin (Full Access).</p></div>';ct.innerHTML=html;return;}
  html+='<div class="crud-table-container"><div class="crud-table-scroll"><table class="crud-table"><thead><tr><th class="no-sort" style="text-align:center;width:50px;">No</th><th>Username</th><th>Password</th><th>Level</th><th class="no-sort" style="text-align:center;">Aksi</th></tr></thead><tbody>';
  _allAdmin.forEach(function(r,i){
    var lv=String(r.Level||'user').toLowerCase();
    var cls=lv==='admin'?'aktif':lv==='operator'?'pending':'inactive';
    html+='<tr><td class="td-no">'+(i+1)+'</td><td>'+escHTML(r.Username||'-')+'</td><td>********</td><td><span class="crud-status '+cls+'">'+escHTML(r.Level||lv)+'</span></td><td style="text-align:center;">'+(canWrite('multiusers')?'<button class="btn btn-sm btn-warning" onclick="openAdminForm('+i+')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="confirmDelete(\'Multiusers\','+i+')"><i class="fas fa-trash"></i></button>':'')+'</td></tr>';
  });
  html+='</tbody></table></div></div>';ct.innerHTML=html;
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}
function openAdminForm(idx){
  document.getElementById('admEditIndex').value=idx!==undefined?idx:-1;
  document.getElementById('adminFormTitle').textContent=idx!==undefined?'Edit Akun Admin':'Tambah Akun Admin';
  if(idx!==undefined){
    var r=_allAdmin[idx];
    document.getElementById('admUsername').value=r.Username||'';
    document.getElementById('admPassword').value='';
    document.getElementById('admPassword').placeholder='Kosongkan jika tidak ingin mengubah';
    var lv=String(r.Level||'user').toLowerCase();
    document.getElementById('admLevel').value=lv;
  }else{
    document.getElementById('adminForm').reset();
    document.getElementById('admPassword').placeholder='Password (plain text)';
    document.getElementById('admLevel').value='user';
  }
  openModal('adminFormModal');
}
function submitAdmin(e){
  e.preventDefault();
  var idx=parseInt(document.getElementById('admEditIndex').value);
  var data={Username:document.getElementById('admUsername').value,Password:document.getElementById('admPassword').value,Level:document.getElementById('admLevel').value};
  showLoading('Menyimpan...');
  if(idx>=0){
    if(!data.Password)data.Password=undefined;
    callServer('updateAdmin',{idx:idx,data:data}).then(function(res){hideLoading();closeModal('adminFormModal');document.getElementById('adminForm').reset();showToast(res.message,res.success?'success':'error');if(res.success)loadAdminList();}).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
  }else{
    callServer('tambahAdmin',data).then(function(res){hideLoading();closeModal('adminFormModal');document.getElementById('adminForm').reset();showToast(res.message,res.success?'success':'error');if(res.success)loadAdminList();}).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
  }
}

/* ========== ADMIN: ADVANCED DATA TABLE ENGINE ========== */
var _crud = {
  sheetType: '',
  allData: [],
  filteredData: [],
  headers: [],
  visibleCols: [],
  sortCol: '',
  sortDir: 'asc',
  page: 1,
  perPage: 10,
  searchTerm: '',
  filters: {},
  filterCols: [],
  writable: false,
  debounceTimer: null
};

/* Open CRUD for a sheet type → kini cukup mengaktifkan tab modul di frame Panel Admin */
function openAdminCrud(type){
  if(!canAccessAdminMenu(type)){showToast('Anda tidak memiliki akses ke menu ini.','error');return;}
  _adminPanelActiveTab = type;
  if(currentPage !== 'panel-admin'){
    // navigateTo('panel-admin') → renderAdminPanel() → switchAdminTab(type)
    navigateTo('panel-admin');
    return;
  }
  if(typeof switchAdminTab === 'function') switchAdminTab(type);
}

/**
 * loadAdminModuleTab(type) - Isi panel tab modul (header modul + tabel CRUD).
 * Dipanggil oleh switchAdminTab() setiap kali tab modul dibuka.
 * Konten ditargetkan ke #adminCrudTable di dalam panel tab aktif.
 */
function loadAdminModuleTab(type){
  // Alias kompatibilitas: 'admin' (Akun Admin legacy) & 'user_accounts' → tab multiusers
  if(type==='admin' || type==='user_accounts') type='multiusers';

  var panel=document.getElementById('panel-'+type);
  if (!panel) { console.warn('[DOM] loadAdminModuleTab: #panel-'+type+' tidak ditemukan'); return; }

  var titles={pengumuman:'Kelola Pengumuman',sdmk:'Kelola SDMK',pendaftaran:'Kelola Pendaftaran',sertifikat:'Kelola Sertifikat',materi:'Kelola Materi',indikator:'Kelola Indikator',multiusers:'Kelola Akun Pengguna (Multiusers)'};
  var writable=canWrite(type);
  var readOnly=!writable;

  // Header modul + aksi
  var infoBar=readOnly?'<div class="admin-info-bar"><i class="fas fa-eye"></i> Anda login sebagai <strong>'+levelLabel()+'</strong> \u2014 mode <strong>hanya lihat</strong>. Tombol tambah, edit, dan hapus tidak ditampilkan.</div>':'';
  const isAdminLoggedIn = isAdminUser() && canWrite(type);
  const importBtn = (isAdminLoggedIn && ['pengumuman','sdmk','pendaftaran','sertifikat','materi'].includes(type))
    ? '<button class="btn btn-success" onclick="openBulkImportForModule(\''+type+'\')"><i class="fas fa-file-import"></i> Import Data Massal</button>'
    : '';
  var moduleIcon=(ADMIN_TABLES[type]&&ADMIN_TABLES[type].icon)?ADMIN_TABLES[type].icon:'fa-table';

  panel.innerHTML='<div class="admin-module-head">'+
    '<div class="admin-module-title">'+
      '<div class="admin-module-icon"><i class="fas '+moduleIcon+'"></i></div>'+
      '<div><h3>'+(titles[type]||type)+'</h3><p>Kelola data dari database Nhost.</p></div>'+
    '</div>'+
    '<div class="admin-module-actions">'+importBtn+'</div>'+
  '</div>'+infoBar+
  '<div id="adminCrudTable"></div>';

  if(type==='multiusers'){loadAdminList();return;}
  if(type==='indikator'){loadIndikatorList();return;}

  _crud.sheetType=type;
  _crud.writable=writable;
  _crud.page=1;
  _crud.perPage=10;
  _crud.sortCol='';
  _crud.sortDir='asc';
  _crud.searchTerm='';
  _crud.filters={};

  var actionMap={pengumuman:'getPengumuman',sdmk:'getSDMK',pendaftaran:'getPendaftaran',sertifikat:'getSertifikat',materi:'getMateri'};
  showLoading('Memuat data...');
  callServer(actionMap[type]).then(function(res){
    hideLoading();
    if(!res||!res.success){
      document.getElementById('adminCrudTable').innerHTML='<div class="empty-state"><i class="fas fa-exclamation-triangle" style="font-size:2rem;color:var(--accent);"></i><p>'+escHTML(res?res.message:'Gagal memuat data')+'</p></div>';
      return;
    }
    _crud.allData=res.data||[];
    _crud.filteredData=[..._crud.allData];
    if(_crud.allData.length>0){
      _crud.headers=Object.keys(_crud.allData[0]);
    } else {
      _crud.headers=[];
    }
    // Gunakan displayFields dari config (maks 7 kolom), filter hanya yang ada di data
    var tableConfig2=ADMIN_TABLES[type];
    var availFields=_crud.headers;
    if(tableConfig2&&tableConfig2.displayFields&&tableConfig2.displayFields.length>0){
      _crud.visibleCols=tableConfig2.displayFields.filter(function(f){return availFields.indexOf(f)!==-1;});
      if(_crud.visibleCols.length===0)_crud.visibleCols=[...availFields];
    } else {
      _crud.visibleCols=[...availFields];
    }
    _crud.filterCols=detectFilterColumns(type);
    buildCrudUI();
    if(type==='sdmk'&&_crud.allData.length>0){var rh='<div class="sdmk-rekap-section" id="adminSdmkRekapSection" style="display:none;margin-bottom:20px;padding:0 4px;"><div class="sdmk-rekap-header"><div class="sdmk-rekap-header-icon"><i class="fas fa-chart-bar"></i></div><div><h3>REKAP DATA SDMK TERLATIH SESUAI KOMPETENSI</h3><p>Jumlah SDMK terlatih berdasarkan tahun pelaksanaan pelatihan</p></div></div><div class="sdmk-rekap-grid" id="adminSdmkRekapGrid"></div><div class="sdmk-rekap-total" id="adminSdmkRekapTotal" style="display:none;"><span>Total SDMK Terlatih</span><strong id="adminSdmkRekapTotalCount">0</strong></div></div>';var ce=document.getElementById('adminCrudTable');if(ce){ce.insertAdjacentHTML('afterbegin',rh);renderSDMKRekap(_crud.allData,'adminSdmkRekapSection');}}
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}

/* Detect which columns should have filter dropdowns */
function detectFilterColumns(type){
  var cols=[];
  if(type==='sdmk'||type==='pendaftaran'){
    _crud.headers.forEach(function(h){
      var hl=h.toLowerCase();
      if(hl.indexOf('unit')!==-1||hl.indexOf('profesi')!==-1||hl.indexOf('jenis')!==-1||hl.indexOf('status')!==-1||hl.indexOf('kelamin')!==-1||hl.indexOf('pendidikan')!==-1||hl.indexOf('jenis sdmk')!==-1||hl.indexOf('tahun')!==-1||hl.indexOf('judul')!==-1){
        cols.push(h);
      }
    });
  } else {
    _crud.headers.forEach(function(h){
      var hl=h.toLowerCase();
      if(hl.indexOf('status')!==-1||hl.indexOf('kategori')!==-1||hl.indexOf('jenis')!==-1){
        cols.push(h);
      }
    });
  }
  return cols;
}

/* Build the full CRUD UI */
function buildCrudUI(){
  var ct=document.getElementById('adminCrudTable');
  if(!_crud.allData.length){
    ct.innerHTML='<div class="empty-state"><i class="fas fa-inbox" style="font-size:2.5rem;color:var(--text-muted);"></i><p>Belum ada data '+_crud.sheetType+'.</p>'+
    (_crud.writable?'<button class="btn btn-primary" style="margin-top:16px;" onclick="openDynForm(-1)"><i class="fas fa-plus"></i> Tambah Data</button>':'')+'</div>';
    return;
  }

  var filterHTML='';
  if(_crud.filterCols.length>0){
    filterHTML='<div class="crud-filters">';
    _crud.filterCols.forEach(function(col){
      var opts=getUniqueValues(col);
      filterHTML+='<select onchange="applyFilter(\''+escHTML(col).replace(/'/g,"\\'")+'\',this.value)" id="filter_'+col.replace(/[^a-zA-Z0-9]/g,'_')+'">';
      filterHTML+='<option value="">Semua '+escHTML(col)+'</option>';
      opts.forEach(function(v){
        var sel=_crud.filters[col]===v?' selected':'';
        filterHTML+='<option value="'+escHTML(v)+'"'+sel+'>'+escHTML(v||'(kosong)')+'</option>';
      });
      filterHTML+='</select>';
    });
    filterHTML+='</div>';
  }

  var html='';

  /* Toolbar */
  html+='<div class="crud-toolbar">';
  html+='<div class="crud-search"><i class="fas fa-search"></i><input type="text" id="crudSearchInput" placeholder="Cari berdasarkan Nama, NIK, NIP, Profesi, Unit Kerja..." value="'+escHTML(_crud.searchTerm)+'" oninput="crudSearch(this.value)" /></div>';
  html+=filterHTML;
  html+='<div class="crud-actions">';
  if(_crud.writable) html+='<button class="btn btn-primary" onclick="openDynForm(-1)"><i class="fas fa-plus"></i> Tambah</button>';
  html+='<button class="btn btn-secondary" onclick="refreshCrudData()"><i class="fas fa-sync-alt"></i> Refresh</button>';
  html+='<div class="col-vis-wrap"><button class="col-vis-btn" onclick="toggleColVis()"><i class="fas fa-columns"></i> Kolom</button><div class="col-vis-dropdown" id="colVisDropdown"></div></div>';
  html+='<button class="btn btn-secondary" onclick="exportCSV()"><i class="fas fa-file-csv"></i> CSV</button>';
  if(typeof XLSX!=='undefined') html+='<button class="btn btn-secondary" onclick="exportExcel()"><i class="fas fa-file-excel"></i> Excel</button>';
  if(typeof jspdf!=='undefined') html+='<button class="btn btn-secondary" onclick="exportPDF()"><i class="fas fa-file-pdf"></i> PDF</button>';
  if(_crud.writable && typeof XLSX!=='undefined') html+='<button class="btn btn-secondary" onclick="openImportModal()"><i class="fas fa-file-import"></i> Import</button>';
  html+='</div></div>';

  /* Table */
  html+='<div class="crud-table-container"><div class="crud-table-scroll"><table class="crud-table"><thead><tr>';
  html+='<th class="no-sort" style="width:50px;text-align:center;">No</th>';
  _crud.visibleCols.forEach(function(col){
    var isSorted=_crud.sortCol===col;
    var icon=isSorted?(_crud.sortDir==='asc'?'fa-sort-up':'fa-sort-down'):'fa-sort';
    html+='<th class="'+(isSorted?'sorted':'')+'" onclick="crudSort(\''+escHTML(col).replace(/'/g,"\\'")+'\')">'+escHTML(col)+' <i class="fas '+icon+' sort-icon"></i></th>';
  });
  html+='<th class="no-sort" style="text-align:center;">Aksi</th>';
  html+='</tr></thead><tbody id="crudTableBody"></tbody></table></div>';

  /* Pagination */
  html+='<div class="crud-pagination"><div class="crud-page-info">Menampilkan <strong id="crudPageStart">0</strong>-<strong id="crudPageEnd">0</strong> dari <strong id="crudTotalRows">0</strong> data</div>';
  html+='<div class="crud-page-size"><label>Tampilkan:</label><select id="crudPageSize" onchange="crudChangePageSize(this.value)">';
  [10,25,50,100].forEach(function(n){html+='<option value="'+n+'"'+(_crud.perPage===n?' selected':'')+'>'+n+'</option>';});
  html+='<option value="all"'+(_crud.perPage===99999?' selected':'')+'>Semua</option>';
  html+='</select></div>';
  html+='<div class="crud-page-btns" id="crudPageBtns"></div></div>';
  html+='</div>';

  ct.innerHTML=html;

  /* Column visibility dropdown */
  buildColVisDropdown();
  renderCrudTable();

  /* Focus search */
  var si=document.getElementById('crudSearchInput');
  if(si){si.addEventListener('keydown',function(e){if(e.key==='Escape'){this.value='';crudSearch('');}});}
}

/* Get unique values for a column (for filter dropdown) */
function getUniqueValues(col){
  var vals=new Set();
  _crud.allData.forEach(function(r){vals.add(String(r[col]||''));});
  return Array.from(vals).sort();
}

/* Build column visibility dropdown */
function buildColVisDropdown(){
  var dd=document.getElementById('colVisDropdown');
  if(!dd)return;
  var html='';
  _crud.headers.forEach(function(col,i){
    var checked=_crud.visibleCols.indexOf(col)!==-1?'checked':'';
    html+='<label><input type="checkbox" '+checked+' onchange="toggleColumn(\''+escHTML(col).replace(/'/g,"\\'")+'\',this.checked)" /> '+escHTML(col)+'</label>';
  });
  dd.innerHTML=html;
}

function toggleColVis(){
  var dd=document.getElementById('colVisDropdown');
  if(dd)dd.classList.toggle('active');
}

function toggleColumn(col,visible){
  if(visible){
    if(_crud.visibleCols.indexOf(col)===-1)_crud.visibleCols.push(col);
  } else {
    _crud.visibleCols=_crud.visibleCols.filter(function(c){return c!==col;});
  }
  buildCrudUI();
}

/* Search with debounce */
function crudSearch(term){
  clearTimeout(_crud.debounceTimer);
  _crud.debounceTimer=setTimeout(function(){
    _crud.searchTerm=term.toLowerCase().trim();
    _crud.page=1;
    applyCrudFilters();
  },250);
}

/* Apply filter from dropdown */
function applyFilter(col,value){
  if(value){_crud.filters[col]=value;}else{delete _crud.filters[col];}
  _crud.page=1;
  applyCrudFilters();
}

/* Apply all filters and search */
function applyCrudFilters(){
  var data=[..._crud.allData];
  // Search
  if(_crud.searchTerm){
    var q=_crud.searchTerm;
    data=data.filter(function(r){
      return Object.values(r).some(function(v){return String(v).toLowerCase().indexOf(q)!==-1;});
    });
  }
  // Filters
  Object.keys(_crud.filters).forEach(function(col){
    var val=_crud.filters[col];
    if(val){
      data=data.filter(function(r){return String(r[col]||'')===val;});
    }
  });
  _crud.filteredData=data;
  renderCrudTable();
}

/* Sort */
function crudSort(col){
  if(_crud.sortCol===col){
    _crud.sortDir=_crud.sortDir==='asc'?'desc':'asc';
  } else {
    _crud.sortCol=col;
    _crud.sortDir='asc';
  }
  _crud.filteredData.sort(function(a,b){
    var va=String(a[col]||'').toLowerCase();
    var vb=String(b[col]||'').toLowerCase();
    var numA=parseFloat(va),numB=parseFloat(vb);
    if(!isNaN(numA)&&!isNaN(numB)){return _crud.sortDir==='asc'?numA-numB:numB-numA;}
    if(va<vb)return _crud.sortDir==='asc'?-1:1;
    if(va>vb)return _crud.sortDir==='asc'?1:-1;
    return 0;
  });
  _crud.page=1;
  buildCrudUI();
}

/* Change page size */
function crudChangePageSize(val){
  _crud.perPage=val==='all'?99999:parseInt(val);
  _crud.page=1;
  renderCrudTable();
}

/* Render table rows */
function renderCrudTable(){
  var tbody=document.getElementById('crudTableBody');
  if(!tbody)return;
  var data=_crud.filteredData;
  var total=data.length;
  var pp=_crud.perPage;
  var totalPages=Math.max(1,Math.ceil(total/pp));
  if(_crud.page>totalPages)_crud.page=totalPages;
  var start=(_crud.page-1)*pp;
  var end=Math.min(start+pp,total);
  var pageData=data.slice(start,end);

  if(!total){
    tbody.innerHTML='<tr><td colspan="'+(_crud.visibleCols.length+2)+'" style="text-align:center;padding:40px;color:var(--text-muted);">Tidak ada data yang cocok.</td></tr>';
    updateCrudPagination(0,0,0);
    return;
  }

  var html='';
  var fotoCol=null;
  _crud.visibleCols.forEach(function(c){if(c.toLowerCase().indexOf('foto')!==-1)fotoCol=c;});
  var linkCols=[];
  _crud.visibleCols.forEach(function(c){var cl=c.toLowerCase();if(cl.indexOf('surat')!==-1||cl.indexOf('link')!==-1||cl.indexOf('url')!==-1)linkCols.push(c);});
  pageData.forEach(function(r,rowIdx){
    var origIdx=_crud.allData.indexOf(r);
    html+='<tr>';
    html+='<td class="td-no">'+(start+rowIdx+1)+'</td>';
    _crud.visibleCols.forEach(function(col){
      var val=r[col]||'';
      if(fotoCol && col===fotoCol && val){
        var thumbUrl=val;
        if(val.indexOf('drive.google.com')!==-1){
          var fid='';
          var m=val.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if(m)fid=m[1];
          else{var m2=val.match(/id=([a-zA-Z0-9_-]+)/);if(m2)fid=m2[1];}
          if(fid)thumbUrl='https://drive.google.com/thumbnail?sz=w80&id='+fid;
        } else if(val.indexOf('lh3.googleusercontent.com')===-1 && val.indexOf('http')!==0){
          thumbUrl='https://drive.google.com/thumbnail?sz=w80&id='+val;
        }
        html+='<td class="crud-foto-cell"><img class="crud-photo-thumb" src="'+escHTML(thumbUrl)+'" onerror="this.style.display=\x27none\x27" onclick="window.open(\x27'+escHTML(val).replace(/\x27/g,"\\x27")+'\x27,\x27_blank\x27)" title="Klik untuk memperbesar" /></td>';
      } else if(linkCols.indexOf(col)!==-1 && val && String(val).indexOf('http')===0){
        html+='<td class="crud-link-cell"><a href="'+escHTML(val)+'" target="_blank" title="'+escHTML(val)+'"><i class="fas fa-external-link-alt" style="margin-right:4px;"></i>Buka Dokumen</a></td>';
      } else {
        var vl=String(val).toLowerCase();
        if(vl==='aktif'||vl==='lulus'||vl==='diterima'||vl==='verified'||vl==='asn'||vl==='pppk'||vl==='kontrak'||vl==='pns'){
          html+='<td><span class="crud-status aktif">'+escHTML(val)+'</span></td>';
        } else if(vl==='nonaktif'||vl==='ditolak'){
          html+='<td><span class="crud-status nonaktif">'+escHTML(val)+'</span></td>';
        } else if(vl==='pending'||vl==='menunggu'||vl==='proses'){
          html+='<td><span class="crud-status pending">'+escHTML(val)+'</span></td>';
        } else {
          html+='<td title="'+escHTML(val)+'">'+escHTML(val)+'</td>';
        }
      }
    });
    /* AKSI column - moved to RIGHTMOST position */
    html+='<td class="td-aksi">';
    html+='<button class="btn btn-sm btn-primary" onclick="viewCrudRow('+origIdx+')" title="Lihat Detail"><i class="fas fa-eye"></i></button> ';
    if(_crud.writable){
      html+='<button class="btn btn-sm btn-warning" onclick="openDynForm('+origIdx+')" title="Edit"><i class="fas fa-edit"></i></button> ';
      html+='<button class="btn btn-sm btn-danger" onclick="confirmDeleteCrud('+origIdx+')" title="Hapus"><i class="fas fa-trash"></i></button>';
    }
    html+='</td>';
    html+='</tr>';
  });
  tbody.innerHTML=html;
  updateCrudPagination(start+1,end,total);
  renderCrudPageBtns(totalPages);
  // Update scroll shadow indicators
  var scrollEl=document.querySelector('.crud-table-scroll');
  if(scrollEl){
    function updateScrollShadow(){
      var sl=scrollEl.scrollLeft>4;
      var sr=scrollEl.scrollWidth-scrollEl.scrollLeft-scrollEl.clientWidth>4;
      scrollEl.classList.toggle('shadow-left',sl);
      scrollEl.classList.toggle('shadow-right',sr);
    }
    scrollEl.addEventListener('scroll',updateScrollShadow);
    setTimeout(updateScrollShadow,100);
  }
}

function updateCrudPagination(start,end,total){
  var s=document.getElementById('crudPageStart');if(s)s.textContent=start;
  var e=document.getElementById('crudPageEnd');if(e)e.textContent=end;
  var t=document.getElementById('crudTotalRows');if(t)t.textContent=total;
}

function renderCrudPageBtns(totalPages){
  var el=document.getElementById('crudPageBtns');
  if(!el)return;
  if(totalPages<=1){el.innerHTML='';return;}
  var p=_crud.page;
  var html='';
  html+='<button '+(p<=1?'disabled':'')+' onclick="_crud.page--;renderCrudTable();">&#9664;</button>';
  var range=[];
  if(totalPages<=7){for(var i=1;i<=totalPages;i++)range.push(i);}
  else{range.push(1);if(p>3)range.push('...');for(var i=Math.max(2,p-1);i<=Math.min(totalPages-1,p+1);i++)range.push(i);if(p<totalPages-2)range.push('...');range.push(totalPages);}
  range.forEach(function(item){
    if(item==='...'){html+='<span style="padding:0 4px;color:var(--text-muted);">...</span>';}
    else{html+='<button class="'+(item===p?'active':'')+'" onclick="_crud.page='+item+';renderCrudTable();">'+item+'</button>';}
  });
  html+='<button '+(p>=totalPages?'disabled':'')+' onclick="_crud.page++;renderCrudTable();">&#9654;</button>';
  el.innerHTML=html;
}

/* View detail */
function viewCrudRow(idx){
  var r=_crud.allData[idx];
  if(!r)return;
  openDetailModal('Detail '+_crud.sheetType.charAt(0).toUpperCase()+_crud.sheetType.slice(1),r);
}

/* Open dynamic form for Add/Edit */
function openDynForm(idx){
  var isEdit=idx>=0;
  document.getElementById('dynFormIdx').value=idx;
  document.getElementById('dynFormSheetType').value=_crud.sheetType;
  document.getElementById('dynFormTitle').textContent=isEdit?'Edit Data '+_crud.sheetType.charAt(0).toUpperCase()+_crud.sheetType.slice(1):'Tambah Data '+_crud.sheetType.charAt(0).toUpperCase()+_crud.sheetType.slice(1);

  var grid=document.getElementById('dynFormFields');
  var row=isEdit?_crud.allData[idx]:null;
  var html='';

  // Determine which columns to show in form (exclude audit/internal)
  var skipCols=['ID','id','Tanggal_Dibuat','Tanggal Dibuat','Diubah_Oleh','Diubah Oleh'];
  var formCols=_crud.headers.filter(function(h){return skipCols.indexOf(h)===-1;});
  
  // ✅ FORCE INCLUDE: Pastikan catatan_admin selalu muncul di form (jika belum ada)
  if (_crud.sheetType === 'pendaftaran' && formCols.indexOf('catatan_admin') === -1) {
    formCols.push('catatan_admin');
    console.log('[DYNFORM] Force-added catatan_admin to form');
  }
  
  console.log('[DYNFORM] Form columns for', _crud.sheetType, ':', formCols);

  // Define fixed options for specific fields (STATUS: pending, approved, rejected, verified)
  var fixedSelectOptions = {
    'status': ['pending', 'approved', 'rejected', 'verified'],
    'Status': ['pending', 'approved', 'rejected', 'verified'],
    'status_pelatihan': ['Aktif', 'Nonaktif', 'Sertifikasi Ulang'],
    'jenis_kelamin': ['Laki-laki', 'Perempuan']
  };

  formCols.forEach(function(col){
    var val=row?row[col]||'':'';
    var label=col.replace(/_/g,' ');
    var hl=col.toLowerCase();

    // === DETERMINE INPUT TYPE ===
    var inputType='text';
    var isTextarea=false;
    var isFixedSelect=false;
    var isAutoSelect=false;

    // 1. TEMPAT DAN TANGGAL LAHIR - Selalu TEXTAREA (bukan date/select)
    if(hl.indexOf('tempat')!==-1 && (hl.indexOf('tanggal')!==-1 || hl.indexOf('lahir')!==-1 || hl.indexOf('tgl')!==-1)){
      isTextarea=true; // Force textarea untuk tempat/tanggal lahir
    }
    // 2. STATUS fields - Fixed select options
    else if(fixedSelectOptions[col] || fixedSelectOptions[hl]){
      isFixedSelect=true;
    }
    // 3. Email fields
    else if(hl.indexOf('email')!==-1){inputType='email';}
    // 4. Date fields (EXCEPT tempat/tanggal lahir)
    else if((hl.indexOf('tanggal')!==-1||hl.indexOf('date')!==-1||hl.indexOf('tgl')!==-1) && hl.indexOf('tempat')===-1){inputType='date';}
    // 5. Phone/WhatsApp fields
    else if(hl.indexOf('telepon')!==-1||hl.indexOf('hp')!==-1||hl.indexOf('phone')!==-1||hl.indexOf('whatsapp')!==-1||hl.indexOf('kontak')!==-1){inputType='tel';}
    // 6. URL/Link/Foto/Surat fields
    else if(hl.indexOf('link')!==-1||hl.indexOf('url')!==-1||hl.indexOf('foto')!==-1||hl.indexOf('surat')!==-1){inputType='url';}
    // 7. Number fields
    else if(hl.indexOf('jumlah')!==-1||hl.indexOf('umur')!==-1||hl.indexOf('tahun')!==-1){inputType='number';}
    // 8. Textarea fields (alamat, keterangan, catatan, isi, deskripsi)
    else if(hl.indexOf('alamat')!==-1||hl.indexOf('keterangan')!==-1||hl.indexOf('catatan')!==-1||hl.indexOf('isi')!==-1||hl.indexOf('deskripsi')!==-1){isTextarea=true;}
    // 9. Auto-select for fields with limited unique values (max 20 options)
    else {
      var uvals=getUniqueValues(col);
      if(uvals.length>1 && uvals.length<=20 && uvals.length<_crud.allData.length*0.8){isAutoSelect=true;}
    }

    // === RENDER FIELD ===
    html+='<div class="form-group'+(isTextarea?' full':'')+'">';
    html+='<label>'+escHTML(label)+'</label>';
    
    if(isTextarea){
      // TEXTAREA - untuk alamat, keterangan, tempat/tanggal lahir
      html+='<textarea id="dynf_'+col.replace(/[^a-zA-Z0-9]/g,'_')+'" placeholder="Masukkan '+escHTML(label)+'">'+escHTML(val)+'</textarea>';
    }
    else if(isFixedSelect){
      // FIXED SELECT - status: pending, approved, rejected, verified
      var options = fixedSelectOptions[col] || fixedSelectOptions[hl];
      html+='<select id="dynf_'+col.replace(/[^a-zA-Z0-9]/g,'_')+'">';
      html+='<option value="">-- Pilih '+escHTML(label)+' --</option>';
      options.forEach(function(opt){
        var optVal = String(opt).toLowerCase();
        var currentVal = String(val).toLowerCase();
        html+='<option value="'+escHTML(opt)+'"'+(currentVal===optVal?' selected':'')+'>'+escHTML(opt)+'</option>';
      });
      // Jika nilai existing tidak ada di options, tambahkan sebagai opsi tambahan
      if(val && !options.some(function(o){ return String(o).toLowerCase() === String(val).toLowerCase(); })){
        html+='<option value="'+escHTML(val)+'" selected>'+escHTML(val)+' (current)</option>';
      }
      html+='</select>';
    }
    else if(isAutoSelect){
      // AUTO SELECT - dari unique values existing data
      html+='<select id="dynf_'+col.replace(/[^a-zA-Z0-9]/g,'_')+'">';
      html+='<option value="">-- Pilih '+escHTML(label)+' --</option>';
      getUniqueValues(col).forEach(function(opt){
        html+='<option value="'+escHTML(opt)+'"'+(val===opt?' selected':'')+'>'+escHTML(opt||'(kosong)')+'</option>';
      });
      html+='</select>';
    }
    else {
      // INPUT TEXT/NUMBER/DATE/EMAIL/TEL/URL
      html+='<input type="'+inputType+'" id="dynf_'+col.replace(/[^a-zA-Z0-9]/g,'_')+'" value="'+escHTML(val)+'" placeholder="Masukkan '+escHTML(label)+'" />';
    }
    html+='</div>';
  });

  // Audit info for edit
  if(isEdit && row){
    var auditHTML='<div class="dyn-form-audit" style="margin-top:16px;padding:12px;background:var(--bg-body);border-radius:8px;font-size:.78rem;color:var(--text-secondary);">';
    if(row['created_at'])auditHTML+='<div style="margin-bottom:4px;"><i class="fas fa-calendar-plus" style="margin-right:6px;color:var(--primary);"></i>Dibuat: '+row['created_at']+'</div>';
    if(row['updated_at'])auditHTML+='<div style="margin-bottom:4px;"><i class="fas fa-calendar-check" style="margin-right:6px;color:var(--secondary);"></i>Diperbarui: '+row['updated_at']+'</div>';
    auditHTML+='</div>';
    html+=auditHTML;
  }

  grid.innerHTML=html;
  openModal('dynFormModal');
  
  console.log('[DYNFORM] Form opened for', _crud.sheetType, '- Edit:', isEdit, '- Fields:', formCols.length);
}

/* Submit dynamic form */
function submitDynForm(e){
  e.preventDefault();
  var idx=parseInt(document.getElementById('dynFormIdx').value);
  var sheetType=document.getElementById('dynFormSheetType').value;
  var data={_user:adminUsername};

  // Collect values from form fields
  var skipCols=['ID','id','Tanggal_Dibuat','Tanggal Dibuat','Diubah_Oleh','Diubah Oleh'];
  var formCols=_crud.headers.filter(function(h){return skipCols.indexOf(h)===-1;});
  
  // ✅ PERBAIKAN KRITIS: Force-include catatan_admin saat submit (sama seperti openDynForm)
  if (sheetType === 'pendaftaran' && formCols.indexOf('catatan_admin') === -1) {
    formCols.push('catatan_admin');
    console.log('[SUBMIT] Force-added catatan_admin to formCols for data collection');
  }

  formCols.forEach(function(col){
    var fieldId='dynf_'+col.replace(/[^a-zA-Z0-9]/g,'_');
    var el=document.getElementById(fieldId);
    if(el)data[col]=el.value;
  });

  // Validate required fields (Nama, NIK/NIP for SDMK/Pendaftaran)
  var hasValue=false;
  formCols.forEach(function(col){if(data[col]&&data[col].trim())hasValue=true;});
  if(!hasValue){showToast('Minimal satu field harus diisi.','error');return;}

  // ✅ PERUBAHAN KRITIS: HAPUS CEK DUPLIKAT NIK/NIP
  // NIK dan NIP BOLEH SAMA - satu orang boleh mendaftar berkali-kali
  // Sistem menggunakan ID record (UUID) sebagai identifier unik, bukan NIK
  // Setiap pendaftaran adalah transaksi baru dengan ID unik sendiri
  // Langsung simpan tanpa pengecekan duplikasi
  
  doSaveCrud(idx,sheetType,data);
}

function doSaveCrud(idx,sheetType,data){
  showLoading('Menyimpan data...');
  var addAction={pengumuman:'tambahPengumuman',sdmk:'tambahSDMK',pendaftaran:'tambahPendaftaran',sertifikat:'tambahSertifikat',materi:'tambahMateri',indikator:'tambahIndikator',multiusers:'tambahMultiuser'};
  var updateAction={pengumuman:'updatePengumuman',sdmk:'updateSDMK',pendaftaran:'updatePendaftaran',sertifikat:'updateSertifikat',materi:'updateMateri',indikator:'updateIndikator',multiusers:'updateMultiuser'};

  var done=function(res){
    hideLoading();
    closeModal('dynFormModal');
    showToast(res.message,res.success?'success':'error');
    if(res.success){
      refreshCrudData();
      refreshDashboardSilent();
    }
  };
  var fail=function(err){hideLoading();showToast('Error: '+(err.message||err),'error');};

  if(idx>=0){
    callServer(updateAction[sheetType],{idx:idx,data:data}).then(done).catch(fail);
  } else {
    callServer(addAction[sheetType],data).then(done).catch(fail);
  }
}

/* Confirm delete from CRUD table */
function confirmDeleteCrud(idx){
  var r=_crud.allData[idx];
  var nama=r?r['Nama Lengkap dengan Gelar']||r.Nama||r['Nama Penerima']||r.Indikator||r.Judul||r.username||'':'data ini';
  document.getElementById('confirmText').textContent='Apakah Anda yakin ingin menghapus data "'+nama+'"?';
  document.getElementById('confirmDeleteBtn').onclick=function(){
    closeModal('confirmModal');
    showLoading('Menghapus...');
    var fnMap={pengumuman:'hapusPengumuman',sdmk:'hapusSDMK',pendaftaran:'hapusPendaftaran',sertifikat:'hapusSertifikat',materi:'hapusMateri',indikator:'deleteIndikator',multiusers:'deleteMultiuser'};
    var fn=fnMap[_crud.sheetType];
    if(!fn){hideLoading();showToast('Tabel tidak dikenali: '+_crud.sheetType,'error');return;}
    callServer(fn,{idx:idx,id:r.ID||r.id}).then(function(res){
      hideLoading();
      showToast(res.message,res.success?'success':'error');
      if(res.success){
        refreshCrudData();
        refreshDashboardSilent();
      }
    }).catch(function(err){hideLoading();showToast('Error: '+(err.message||err),'error');});
  };
  openModal('confirmModal');
}

/* Refresh CRUD data */
function refreshCrudData(){
  var actionMap={pengumuman:'getPengumuman',sdmk:'getSDMK',pendaftaran:'getPendaftaran',sertifikat:'getSertifikat',materi:'getMateri',indikator:'getIndikator',multiusers:'getAdmin'};
  callServer(actionMap[_crud.sheetType]).then(function(res){
    if(!res||!res.success){showToast(res?res.message:'Gagal refresh','error');return;}
    _crud.allData=res.data||[];
    _crud.filteredData=[..._crud.allData];
    if(_crud.allData.length>0)_crud.headers=Object.keys(_crud.allData[0]);
    else _crud.headers=[];
    _crud.filterCols=detectFilterColumns(_crud.sheetType);
    applyCrudFilters();
    showToast('Data berhasil diperbarui.','success');
  }).catch(function(e){showToast('Error refresh: '+(e.message||e),'error');});
}

/* Silent dashboard refresh (no loading overlay) */
function refreshDashboardSilent(){
  callServer('getDashboardData').then(function(res){
    if(!res||!res.success)return;
    renderStatCards(res.data.summary||{});
  }).catch(function(){});
}

/* ============================================================
   EXPORT FUNCTIONS
   ============================================================ */
function getExportData(){
  return _crud.filteredData.map(function(r){
    var row={};
    _crud.visibleCols.forEach(function(col){row[col]=r[col]||'';});
    return row;
  });
}

function exportCSV(){
  var data=getExportData();
  if(!data.length){showToast('Tidak ada data untuk diekspor.','error');return;}
  var cols=_crud.visibleCols;
  var csv=cols.map(function(c){return '"'+c.replace(/"/g,'""')+'"';}).join(',')+'\n';
  data.forEach(function(r){
    csv+=cols.map(function(c){return '"'+String(r[c]||'').replace(/"/g,'""')+'"';}).join(',')+'\n';
  });
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=_crud.sheetType+'_data_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast('Export CSV berhasil ('+data.length+' baris).','success');
}

function exportExcel(){
  if(typeof XLSX==='undefined'){showToast('Library SheetJS belum dimuat.','error');return;}
  var data=getExportData();
  if(!data.length){showToast('Tidak ada data untuk diekspor.','error');return;}
  var ws=XLSX.utils.json_to_sheet(data);
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,_crud.sheetType.charAt(0).toUpperCase()+_crud.sheetType.slice(1));
  XLSX.writeFile(wb,_crud.sheetType+'_data_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast('Export Excel berhasil ('+data.length+' baris).','success');
}

function exportPDF(){
  if(typeof jspdf==='undefined'){showToast('Library jsPDF belum dimuat.','error');return;}
  var data=getExportData();
  if(!data.length){showToast('Tidak ada data untuk diekspor.','error');return;}
  var {jsPDF}=jspdf;
  var doc=new jsPDF('l','mm','a4');
  var title='Data '+_crud.sheetType.charAt(0).toUpperCase()+_crud.sheetType.slice(1)+' - PAMUNGKAS';
  doc.setFontSize(14);
  doc.text(title,14,15);
  doc.setFontSize(9);
  doc.text('Diekspor pada: '+new Date().toLocaleString('id-ID'),14,22);
  doc.text('Total: '+data.length+' data',14,27);

  var cols=_crud.visibleCols;
  var head=[cols.map(function(c){return c;})];
  var body=data.map(function(r){return cols.map(function(c){return String(r[c]||'').substring(0,50);});});

  doc.autoTable({
    head:head,
    body:body,
    startY:32,
    styles:{fontSize:7,cellPadding:2},
    headStyles:{fillColor:[13,110,253],textColor:255,fontStyle:'bold'},
    alternateRowStyles:{fillColor:[240,244,248]},
    margin:{left:14,right:14}
  });

  doc.save(_crud.sheetType+'_data_'+new Date().toISOString().slice(0,10)+'.pdf');
  showToast('Export PDF berhasil ('+data.length+' baris).','success');
}

/* ============================================================
   IMPORT FUNCTIONS
   ============================================================ */
var _importData=[];

function openImportModal(){
  document.getElementById('importSheetName').textContent=_crud.sheetType.charAt(0).toUpperCase()+_crud.sheetType.slice(1);
  document.getElementById('importPreview').style.display='none';
  document.getElementById('importSubmitBtn').disabled=true;
  document.getElementById('importFileInput').value='';
  _importData=[];
  openModal('importModal');
}

function handleImportFile(e){
  var file=e.target.files[0];
  if(!file)return;
  if(file.size>5*1024*1024){showToast('Ukuran file maksimal 5MB.','error');return;}
  
  // Tampilkan info khusus jika sheetType adalah sdmk
  var sdmkInfo = document.getElementById('importSdmkInfo');
  var sdmkTemplate = document.getElementById('sdmkTemplateHint');
  if (_crud.sheetType === 'sdmk') {
    if (sdmkInfo) sdmkInfo.style.display = 'block';
    if (sdmkTemplate) sdmkTemplate.style.display = 'block';
    document.getElementById('importSheetName').textContent = 'SDMK (Data Ganda Diperbolehkan)';
  } else {
    if (sdmkInfo) sdmkInfo.style.display = 'none';
    if (sdmkTemplate) sdmkTemplate.style.display = 'none';
    document.getElementById('importSheetName').textContent = _crud.sheetType || '-';
  }
  
  var reader=new FileReader();
  reader.onload=function(ev){
    try{
      var data=new Uint8Array(ev.target.result);
      var workbook=XLSX.read(data,{type:'array'});
      var sheetName=workbook.SheetNames[0];
      var sheet=workbook.Sheets[sheetName];
      var json=XLSX.utils.sheet_to_json(sheet,{defval:''});
      if(!json.length){showToast('File Excel kosong.','error');return;}
      _importData=json;
      document.getElementById('importRowCount').textContent=json.length;
      document.getElementById('importColCount').textContent=Object.keys(json[0]).length;

      // Preview table
      var cols=Object.keys(json[0]);
      var previewHTML='<table><thead><tr><th>No</th>';
      cols.forEach(function(c){previewHTML+='<th>'+escHTML(c)+'</th>';});
      previewHTML+='</tr></thead><tbody>';
      var previewRows=json.slice(0,10);
      previewRows.forEach(function(r,i){
        previewHTML+='<tr><td>'+(i+1)+'</td>';
        cols.forEach(function(c){previewHTML+='<td>'+escHTML(String(r[c]||'')).substring(0,40)+'</td>';});
        previewHTML+='</tr>';
      });
      if(json.length>10)previewHTML+='<tr><td colspan="'+(cols.length+1)+'" style="text-align:center;color:var(--text-muted);">... dan '+(json.length-10)+' baris lainnya</td></tr>';
      previewHTML+='</tbody></table>';
      document.getElementById('importPreviewTable').innerHTML=previewHTML;
      document.getElementById('importPreview').style.display='block';
      document.getElementById('importSubmitBtn').disabled=false;
      
      // Log untuk debugging
      console.log('[IMPORT] File loaded:', file.name, '- Rows:', json.length, '- Type:', _crud.sheetType);
      if (_crud.sheetType === 'sdmk') {
        console.log('[IMPORT] ⚠️ SDMK Mode: Data ganda DIPERBOLEHKAN');
      }
    }catch(err){
      showToast('Gagal membaca file: '+err.message,'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function executeImport(){
  if(!_importData.length)return;
  var mode=document.querySelector('input[name="importMode"]:checked').value;
  var actionMap={sdmk:'importSDMK',pendaftaran:'importPendaftaran'};

  if(!actionMap[_crud.sheetType]){
    showToast('Import hanya tersedia untuk SDMK dan Pendaftaran.','error');return;
  }

  showLoading('Mengimpor '+_importData.length+' baris...');
  callServer(actionMap[_crud.sheetType],{rows:_importData,mode:mode,_user:adminUsername}).then(function(res){
    hideLoading();
    closeModal('importModal');
    showToast(res.message,res.success?'success':'error');
    if(res.success){
      refreshCrudData();
      refreshDashboardSilent();
    }
  }).catch(function(err){hideLoading();showToast('Error: '+(err.message||err),'error');});
}

/* Drag & drop for import zone */
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var zone=document.getElementById('importZone');
    if(!zone)return;
    zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('drag-over');});
    zone.addEventListener('dragleave',function(){zone.classList.remove('drag-over');});
    zone.addEventListener('drop',function(e){
      e.preventDefault();zone.classList.remove('drag-over');
      var files=e.dataTransfer.files;
      if(files.length>0){
        document.getElementById('importFileInput').files=files;
        handleImportFile({target:{files:files}});
      }
    });
  });
})();

/* Close column visibility dropdown on outside click */
document.addEventListener('click',function(e){
  if(!e.target.closest('.col-vis-wrap')){
    var dd=document.getElementById('colVisDropdown');
    if(dd)dd.classList.remove('active');
  }
});

/* ===== UNIVERSAL HORIZONTAL SCROLL ENHANCEMENT ===== */
(function(){
  document.addEventListener('wheel',function(e){
    if(!e.shiftKey)return;
    var el=e.target.closest('.crud-table-scroll,.sdmk-table-container,.dash-table-container,.table-wrap,.scrollable-table-wrap,.import-preview');
    if(!el)return;
    e.preventDefault();
    el.scrollLeft+=e.deltaY;
  },{passive:false});

  document.addEventListener('DOMContentLoaded',function(){
    var sel='.crud-table-scroll,.sdmk-table-container,.dash-table-container,.table-wrap';
    document.querySelectorAll(sel).forEach(function(el){
      var isDown=false,startX=0,scrollL=0,hasMoved=false;
      el.style.cursor='grab';
      el.addEventListener('mousedown',function(e){
        if(e.target.closest('button,a,input,select,textarea,.btn'))return;
        isDown=true;hasMoved=false;el.style.cursor='grabbing';
        startX=e.pageX-el.offsetLeft;scrollL=el.scrollLeft;
      });
      el.addEventListener('mouseleave',function(){isDown=false;el.style.cursor='grab';});
      el.addEventListener('mouseup',function(){isDown=false;el.style.cursor='grab';});
      el.addEventListener('mousemove',function(e){
        if(!isDown)return;e.preventDefault();
        var walk=(e.pageX-el.offsetLeft-startX)*1.5;
        if(Math.abs(walk)>3)hasMoved=true;
        el.scrollLeft=scrollL-walk;
      });
      el.addEventListener('click',function(e){if(hasMoved){e.stopPropagation();hasMoved=false;}},true);
    });
  });
})();
