/* ============================================================
   PAMUNGKAS — WORKFLOW STATUS Pendaftaran (Timeline & Perbaikan)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/18-workflow.js
   ============================================================ */

/* ========== STATUS WORKFLOW HELPERS (Global) ========== */
function getStatusLabel(s){
  s = String(s || '').trim();
  var map = {
    // Menunggu
    'pending': 'Menunggu',
    'menunggu': 'Menunggu',
    // Proses Verifikasi
    'verifikasi': 'Proses Verifikasi',
    'proses verifikasi': 'Proses Verifikasi',
    'verified': 'Proses Verifikasi',
    // Perbaikan
    'perbaikan': 'Perbaikan',
    'revisi': 'Perbaikan',
    'perbaikan data': 'Perbaikan',
    // Disetujui
    'disetujui': 'Disetujui',
    'diterima': 'Disetujui',
    'aktif': 'Disetujui',
    'approved': 'Disetujui',
    // Ditolak ✅ TAMBAHAN: Handle 'rejected' dari Hasura
    'ditolak': 'Ditolak',
    'nonaktif': 'Ditolak',
    'rejected': 'Ditolak',
    'declined': 'Ditolak'
  };
  return map[s.toLowerCase()] || s;
}

function statusClass(s){
  s = String(s || '').toLowerCase().trim();
  if(s === 'aktif' || s === 'diterima' || s === 'lulus' || s === 'verified' || s === 'disetujui' || s === 'approved') return 'disetujui';
  // ✅ PERBAIKAN: Tambah 'rejected' dan 'declined'
  if(s === 'nonaktif' || s === 'ditolak' || s === 'rejected' || s === 'declined') return 'ditolak';
  if(s === 'menunggu' || s === 'pending') return 'menunggu';
  if(s === 'proses verifikasi' || s === 'verifikasi') return 'proses-verifikasi';
  if(s === 'perbaikan' || s === 'revisi' || s === 'perbaikan data') return 'perbaikan';
  return 'menunggu';
}

function getStatusColor(status){
  var colors = {'Menunggu':'#6366F1','Proses Verifikasi':'#2563EB','Perbaikan':'#D97706','Disetujui':'#059669','Ditolak':'#DC2626'};
  return colors[status] || '#94A3B8';
}
function showAdminButtons(){
  // ✅ SAFE: Null checks for all admin buttons
  var btnPengumuman = document.getElementById('btnTambahPengumuman');
  var btnSDMK = document.getElementById('btnTambahSDMK');
  var btnImportSDMK = document.getElementById('btnImportSDMK');
  var btnMateri = document.getElementById('btnTambahMateri');
  
  if (btnPengumuman) btnPengumuman.style.display = canWrite('pengumuman') ? 'inline-flex' : 'none';
  else console.warn('[DOM] #btnTambahPengumuman tidak ditemukan');
  
  // Tombol Tambah & Import SDMK - tampil jika bisa write
  var sdmkWritable = canWrite('sdmk');
  if (btnSDMK) btnSDMK.style.display = sdmkWritable ? 'inline-flex' : 'none';
  else console.warn('[DOM] #btnTambahSDMK tidak ditemukan');
  
  if (btnImportSDMK) btnImportSDMK.style.display = sdmkWritable ? 'inline-flex' : 'none';
  else console.warn('[DOM] #btnImportSDMK tidak ditemukan');
  
  if (btnMateri) btnMateri.style.display = canWrite('materi') ? 'inline-flex' : 'none';
  else console.warn('[DOM] #btnTambahMateri tidak ditemukan');
}

/* ========== WORKFLOW CONFIGURATION ========== */
var WORKFLOW_STATUSES = {
  'Menunggu': { next: ['Proses Verifikasi'], color: '#6366F1', icon: 'fa-clock', desc: 'Menunggu verifikasi' },
  'Proses Verifikasi': { next: ['Perbaikan', 'Disetujui', 'Ditolak'], color: '#2563EB', icon: 'fa-spinner', desc: 'Sedang diverifikasi' },
  'Perbaikan': { next: ['Proses Verifikasi', 'Ditolak'], color: '#D97706', icon: 'fa-wrench', desc: 'Perlu diperbaiki' },
  'Disetujui': { next: [], color: '#059669', icon: 'fa-check-circle', desc: 'Telah disetujui' },
  'Ditolak': { next: ['Menunggu'], color: '#DC2626', icon: 'fa-times-circle', desc: 'Ditolak' }
};
var _workflowEditIdx = -1;

/* ========== OPEN STATUS WORKFLOW MODAL ========== */
function openStatusWorkflowModal(idx){
  if(idx < 0 || !_allPendaftaran || idx >= _allPendaftaran.length){showToast('Data tidak ditemukan.','error');return;}
  _workflowEditIdx = idx;
  var r = _allPendaftaran[idx];
  var currentStatus = getStatusLabel(r.Status || r['Status'] || 'Menunggu');
  var nama = r['Nama Lengkap dengan Gelar'] || r.Nama || 'Tidak diketahui';
  var timelineHTML = buildWorkflowTimeline(currentStatus);
  var optionsHTML = '';
  var currentConfig = WORKFLOW_STATUSES[currentStatus];
  var availableNext = currentConfig ? currentConfig.next : [];
  if(availableNext.length === 0){
    optionsHTML += '<p style="text-align:center;color:var(--text-muted);padding:20px;"><i class="fas fa-lock"></i> Status "'+escHTML(currentStatus)+'" adalah status akhir.</p>';
  } else {
    availableNext.forEach(function(nextStatus){
      var config = WORKFLOW_STATUSES[nextStatus];
      if(!config) return;
      optionsHTML += '<label class="status-option" onclick="selectWorkflowStatus(this, \''+nextStatus+'\')">';
      optionsHTML += '<input type="radio" name="workflowStatus" value="'+nextStatus+'" />';
      optionsHTML += '<span class="status-indicator" style="background:'+getStatusColor(nextStatus)+'"></span>';
      optionsHTML += '<div><span class="status-label">'+nextStatus+'</span><div class="status-desc">'+config.desc+'</div></div>';
      optionsHTML += '</label>';
    });
  }
  var html = '';
  html += '<div class="workflow-modal-overlay" id="workflowModalOverlay" onclick="if(event.target===this)closeWorkflowModal()">';
  html += '<div class="workflow-modal-box">';
  html += '<div class="workflow-modal-header"><h3><i class="fas fa-exchange-alt"></i> Ubah Status Pendaftaran</h3><button class="modal-close" onclick="closeWorkflowModal()">&times;</button></div>';
  html += '<div class="workflow-modal-body">';
  html += '<p style="margin-bottom:8px;font-size:.85rem;color:var(--text-secondary);">Pemohon: <strong>'+escHTML(nama)+'</strong></p>';
  html += '<p style="margin-bottom:12px;font-size:.82rem;">Status saat ini: <span class="status-badge '+statusClass(currentStatus)+'">'+escHTML(currentStatus)+'</span></p>';
  html += timelineHTML;
  html += '<h4 style="font-size:.88rem;margin:16px 0 12px;">Pilih Status Baru:</h4>';
  html += '<div class="status-selector">'+optionsHTML+'</div>';
  html += '<div class="form-group" style="margin-top:16px;"><label>Catatan/Keterangan <span style="color:var(--danger);">*</span></label><textarea id="workflowCatatan" rows="3" placeholder="Tambahkan catatan untuk perubahan status ini..."></textarea></div>';
  html += '</div>';
  html += '<div class="workflow-modal-footer"><button class="btn btn-secondary" onclick="closeWorkflowModal()">Batal</button><button class="btn btn-primary" id="btnSubmitWorkflow" onclick="submitWorkflowStatus()" disabled><i class="fas fa-save"></i> Simpan Perubahan</button></div>';
  html += '</div></div>';
  var existing = document.getElementById('workflowModalOverlay');
  if(existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend',html);
  document.getElementById('workflowModalOverlay').classList.add('active');
}

/* ========== BUILD WORKFLOW TIMELINE ========== */
function buildWorkflowTimeline(currentStatus){
  var order = ['Menunggu','Proses Verifikasi','Perbaikan','Disetujui','Ditolak'];
  var currentIndex = order.indexOf(currentStatus);
  if(currentIndex === -1) currentIndex = 0;
  var html = '<div class="workflow-timeline">';
  order.forEach(function(status,i){
    var state = 'pending';
    if(i < currentIndex) state = 'completed';
    else if(i === currentIndex) state = 'active';
    html += '<div class="timeline-step '+state+'"><div class="timeline-dot" style="background:'+getStatusColor(status)+'"></div><span class="timeline-label">'+status+'</span></div>';
  });
  html += '</div>';
  return html;
}

/* ========== SELECT WORKFLOW STATUS ========== */
var _selectedWorkflowStatus = '';
function selectWorkflowStatus(el,status){
  document.querySelectorAll('.status-option').forEach(function(opt){opt.classList.remove('selected');});
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
  _selectedWorkflowStatus = status;
  var btn = document.getElementById('btnSubmitWorkflow');
  if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> Simpan to "'+status+'"';}
}

/* ========== CLOSE WORKFLOW MODAL ========== */
function closeWorkflowModal(){
  var modal = document.getElementById('workflowModalOverlay');
  if(modal){modal.classList.remove('active');setTimeout(function(){modal.remove();},300);}
  _workflowEditIdx = -1;
  _selectedWorkflowStatus = '';
}

/* ========== SUBMIT WORKFLOW STATUS CHANGE ========== */
function submitWorkflowStatus(){
  if(_workflowEditIdx < 0 || !_selectedWorkflowStatus){showToast('Pilih status baru terlebih dahulu.','error');return;}
  var catatan = document.getElementById('workflowCatatan').value.trim();
  if(!catatan){showToast('Catatan/keterangan wajib diisi.','error');document.getElementById('workflowCatatan').focus();return;}
  showLoading('Mengubah status...');
  var data = {Status:_selectedWorkflowStatus,'Catatan Status':catatan,'Diubah Oleh':adminUsername||'admin','Tanggal Ubah Status':new Date().toLocaleString('id-ID')};
  callServer('updatePendaftaran',{idx:_workflowEditIdx,data:data}).then(function(res){
    hideLoading();closeWorkflowModal();
    showToast(res.message||'Status berhasil diubah.',res.success?'success':'error');
    if(res.success && typeof loadPendaftaran==='function') loadPendaftaran();
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}

/* ========== OPEN PERBAIKAN FORM (Untuk status "Perbaikan" DAN "Ditolak") ========== */
function openPerbaikanForm(idx, sourceStatus){
  var r = null;
  var perbaikanSource = sourceStatus || 'perbaikan'; // default: perbaikan
  window._perbaikanSource = perbaikanSource; // simpan untuk digunakan saat save
  
  // Prioritas 1: Gunakan _cekRegData jika sudah terisi (dari Cek Pendaftaran)
  if(_cekRegData && Object.keys(_cekRegData).length > 0){
    r = _cekRegData;
  }
  // Prioritas 2: Gunakan _allPendaftaran[idx] (dari Tabel Admin)
  else if(idx >= 0 && _allPendaftaran && idx < _allPendaftaran.length){
    r = _allPendaftaran[idx];
  }
  
  // Validasi data
  if(!r || Object.keys(r).length === 0){showToast('Data tidak ditemukan.','error');return;}
  
  var currentStatus = getStatusLabel(r.Status || 'Menunggu');
  // ✅ IZINKAN kedua status: Perbaikan DAN Ditolak
  if(currentStatus !== 'Perbaikan' && currentStatus !== 'Ditolak'){
    showToast('Tombol perbaikan hanya tersedia untuk status "Perbaikan" atau "Ditolak".','warning');return;
  }
  
  // Simpan data dan index
  _cekRegData = r;
  _cekRegOrigIdx = idx;
  
  var wrap = document.getElementById('cekRegResult');
  if(!wrap) return;
  var fields = [
    {keys:['Nama Lengkap dengan Gelar','Nama Lengkap','Nama'],label:'Nama Lengkap dengan Gelar',type:'text'},
    {keys:['Unit Kerja','Unit_Kerja'],label:'Unit Kerja',type:'text'},
    {keys:['Jenis SDMK','Jenis_SDMK'],label:'Jenis SDMK',type:'text'},
    {keys:['Jenis Profesi','Jenis_Profesi','Profesi'],label:'Jenis Profesi',type:'select'},
    {keys:['NIK (Nomor Induk Kependudukan)','NIK','NIK/NIP','NIK_NIP'],label:'NIK',type:'text'},
    {keys:['NIP (Nomor Induk Pegawai)','NIP','NIK/NIP','NIK_NIP'],label:'NIP',type:'text'},
    {keys:['Status Pekerjaan','Status_Pekerjaan'],label:'Status Pekerjaan',type:'select'},
    {keys:['Jenis Kelamin','Jenis_Kelamin'],label:'Jenis Kelamin',type:'select'},
    {keys:['Tempat dan Tanggal Lahir','Tempat/Tanggal Lahir'],label:'Tempat & Tgl Lahir',type:'text'},
    {keys:['Email Plataran Sehat','Email Platiran Sehat','Email'],label:'Email Plataran Sehat',type:'email'},
    {keys:['Lama Bekerja di Unit Sekarang','Lama Bekerja'],label:'Lama Bekerja',type:'text'},
    {keys:['Nomor WhatsApp / Telepon','No. WhatsApp','WhatsApp','Telepon'],label:'No. WhatsApp/Telepon',type:'tel'},
    {keys:['Alamat Rumah','Alamat'],label:'Alamat Rumah',type:'textarea',full:true},
    {keys:['Surat Pernyataan','Surat_Pernyataan'],label:'Surat Pernyataan (URL)',type:'url'},
    {keys:['Judul Kegiatan','Judul Pelatihan'],label:'Judul Kegiatan',type:'text'}
  ];
  var h = '<div class="perbaikan-form-container" id="perbaikanFormContainer">';
  
  // ✅ Header berbeda untuk Ditolak vs Perbaikan
  if(perbaikanSource === 'rejected'){
    h += '<div class="perbaikan-header" style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2);border-left:4px solid #DC2626;padding:16px;border-radius:8px;margin-bottom:20px;">';
    h += '<h4 style="color:#991B1B;margin:0 0 8px 0;"><i class="fas fa-redo" style="margin-right:8px;"></i>Formulir Perbaikan Data (Ditolak)</h4>';
    h += '<p style="font-size:.85rem;color:#DC2626;margin:0;font-weight:500;">⚠️ Data Anda <strong>DITOLAK</strong>. Silakan perbaiki data yang belum benar di bawah ini. Semua field sudah terisi dengan data Anda sebelumnya - ubah hanya yang salah.</p></div>';
  } else {
    h += '<div class="perbaikan-header"><h4><i class="fas fa-wrench"></i> Formulir Perbaikan Data</h4>';
    h += '<p style="font-size:.82rem;color:var(--text-secondary);margin-top:4px;">Perbaiki data yang salah. Kosongkan field jika tidak ada perubahan.</p></div>';
  }
  h += '<div class="pf-grid">';
  fields.forEach(function(f){
    var val = _cekRegV(r,f.keys)||'';
    h += '<div class="pf-field'+(f.full?' full':'')+'"><label>'+escHTML(f.label)+'</label>';
    if(f.type==='textarea'){h+='<textarea id="pf_'+f.keys[0].replace(/[^a-zA-Z0-9]/g,'_')+'" placeholder="Kosongkan jika tidak diubah">'+escHTML(val)+'</textarea>';}
    else{h+='<input type="'+f.type+'" id="pf_'+f.keys[0].replace(/[^a-zA-Z0-9]/g,'_')+'" value="'+escHTML(val)+'" placeholder="Kosongkan jika tidak diubah" />';}
    h+='</div>';
  });
  h += '</div>';
  h += '<div class="perbaikan-actions">';
  h += '<button class="btn btn-secondary" onclick="cancelPerbaikanForm()"><i class="fas fa-times"></i> Batal</button>';
  // ✅ Tombol berbeda untuk Ditolak vs Perbaikan
  if(perbaikanSource === 'rejected'){
    h += '<button class="btn btn-danger" onclick="prepareSubmitPerbaikan()" style="background:linear-gradient(135deg,#DC2626,#EF4444);border:none;padding:12px 24px;font-size:.95rem;font-weight:600;"><i class="fas fa-check-circle"></i> Simpan & Kirim Ulang</button>';
  } else {
    h += '<button class="btn btn-primary" onclick="prepareSubmitPerbaikan()"><i class="fas fa-paper-plane"></i> Kirim Perbaikan</button>';
  }
  h += '</div></div>';
  wrap.innerHTML = h;
  wrap.classList.add('active');
  // ✅ Tambah class khusus untuk styling Ditolak
  if(perbaikanSource === 'rejected'){
    var container = document.getElementById('perbaikanFormContainer');
    if(container) container.classList.add('rejected-mode');
  }
  wrap.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ========== CANCEL PERBAIKAN FORM ========== */
function cancelPerbaikanForm(){
  var wrap = document.getElementById('cekRegResult');
  if(wrap){wrap.classList.remove('active');wrap.innerHTML='';}
  _cekRegData = null;
  _cekRegOrigIdx = -1;
}

/* ========== PREPARE SUBMIT PERBAIKAN (With Confirmation) ========== */
function prepareSubmitPerbaikan(){
  if(!_cekRegData || _cekRegOrigIdx < 0){showToast('Data tidak ditemukan.','error');return;}
  var fields = [
    {keys:['Nama Lengkap dengan Gelar','Nama Lengkap','Nama'],label:'Nama Lengkap'},
    {keys:['Unit Kerja','Unit_Kerja'],label:'Unit Kerja'},
    {keys:['Jenis SDMK','Jenis_SDMK'],label:'Jenis SDMK'},
    {keys:['Jenis Profesi','Jenis_Profesi','Profesi'],label:'Jenis Profesi'},
    {keys:['NIK (Nomor Induk Kependudukan)','NIK','NIK/NIP','NIK_NIP'],label:'NIK'},
    {keys:['NIP (Nomor Induk Pegawai)','NIP','NIK/NIP','NIK_NIP'],label:'NIP'},
    {keys:['Status Pekerjaan','Status_Pekerjaan'],label:'Status Pekerjaan'},
    {keys:['Jenis Kelamin','Jenis_Kelamin'],label:'Jenis Kelamin'},
    {keys:['Tempat dan Tanggal Lahir','Tempat/Tanggal Lahir'],label:'Tempat/Tgl Lahir'},
    {keys:['Email Plataran Sehat','Email Platiran Sehat','Email'],label:'Email'},
    {keys:['Lama Bekerja di Unit Sekarang','Lama Bekerja'],label:'Lama Bekerja'},
    {keys:['Nomor WhatsApp / Telepon','No. WhatsApp','WhatsApp','Telepon'],label:'No. Telepon'},
    {keys:['Alamat Rumah','Alamat'],label:'Alamat'},
    {keys:['Surat Pernyataan','Surat_Pernyataan'],label:'Surat Pernyataan'},
    {keys:['Judul Kegiatan','Judul Pelatihan'],label:'Judul Kegiatan'}
  ];
  var changedData = [];
  var changedCount = 0;
  fields.forEach(function(f){
    var fieldId = 'pf_'+f.keys[0].replace(/[^a-zA-Z0-9]/g,'_');
    var el = document.getElementById(fieldId);
    if(!el) return;
    var newVal = el.value.trim();
    var headerKey = null;
    for(var k of f.keys){if(_cekRegData.hasOwnProperty(k)){headerKey=k;break;}}
    if(!headerKey) return;
    var origVal = String(_cekRegData[headerKey]||'').trim();
    if(newVal !== origVal){changedData.push({label:f.label,original:origVal||'-',newValue:newVal||'-',fieldKey:headerKey});changedCount++;}
  });
  if(changedCount === 0){showToast('Tidak ada data yang diubah. Semua field masih sama.','warning');return;}
  showKonfirmasiPerbaikan(changedData,changedCount);
}

/* ========== SHOW KONFIRMASI PERBAIKAN MODAL ========== */
function showKonfirmasiPerbaikan(changedData,changedCount){
  var html = '';
  html += '<div class="konfirmasi-modal-overlay" id="konfirmasiModalOverlay">';
  html += '<div class="konfirmasi-modal-box">';
  html += '<div class="konfirmasi-icon"><i class="fas fa-question-circle"></i></div>';
  html += '<div class="konfirmasi-title">Apakah Data Sudah Benar?</div>';
  html += '<div class="konfirmasi-message">Anda telah mengubah <strong>'+changedCount+'</strong> data. Pastikan semua perubahan sudah benar sebelum menyimpan.</div>';
  html += '<div class="konfirmasi-data-preview">';
  changedData.forEach(function(d){
    html += '<div class="data-row"><span class="data-label">'+escHTML(d.label)+'</span>';
    html += '<span class="data-value"><span style="text-decoration:line-through;color:var(--text-muted);margin-right:8px;">'+escHTML(d.original)+'</span>';
    html += '<span class="data-changed"><i class="fas fa-arrow-right"></i> '+escHTML(d.newValue)+'</span></span></div>';
  });
  html += '</div>';
  html += '<div class="konfirmasi-buttons">';
  html += '<button class="btn btn-secondary" onclick="tolakKonfirmasiPerbaikan()"><i class="fas fa-arrow-left"></i> Tidak, Kembali</button>';
  html += '<button class="btn btn-success" onclick="setujuKonfirmasiPerbaikan()"><i class="fas fa-check"></i> Ya, Simpan</button>';
  html += '</div></div></div>';
  window._pendingPerbaikanData = changedData;
  var existing = document.getElementById('konfirmasiModalOverlay');
  if(existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend',html);
  document.getElementById('konfirmasiModalOverlay').classList.add('active');
}

/* ========== TOLAK KONFIRMASI (Return to form) ========== */
function tolakKonfirmasiPerbaikan(){
  var modal = document.getElementById('konfirmasiModalOverlay');
  if(modal){modal.classList.remove('active');setTimeout(function(){modal.remove();},300);}
  showToast('Silakan periksa kembali data Anda.','info');
}

/* ========== SETUJU KONFIRMASI (Save data) ========== */
function setujuKonfirmasiPerbaikan(){
  var modal = document.getElementById('konfirmasiModalOverlay');
  if(modal) modal.remove();
  executeSavePerbaikan();
}

/* ========== EXECUTE SAVE PERBAIKAN ========== */
function executeSavePerbaikan(){
  if(!_cekRegData || _cekRegOrigIdx < 0 || !window._pendingPerbaikanData){showToast('Data tidak valid.','error');return;}
  
  // ✅ Tentukan status berdasarkan sumber perbaikan
  var isFromRejected = (window._perbaikanSource === 'rejected');
  var newStatus = isFromRejected ? 'pending' : 'Proses Verifikasi'; // Ditolak → pending, Perbaikan → Proses Verifikasi
  
  var data = {
    _user: adminUsername || 'pendaftaran_perbaikan',
    Status: newStatus,
    'Tanggal Perbaikan': new Date().toLocaleString('id-ID')
  };
  // Tambah catatan admin jika dari status Ditolak
  if(isFromRejected){
    data.catatan_admin = 'Data diperbaikan setelah ditolak (' + new Date().toLocaleString('id-ID') + ')';
  }
  
  window._pendingPerbaikanData.forEach(function(d){data[d.fieldKey]=d.newValue;});
  
  showLoading(isFromRejected ? 'Mengirim ulang data...' : 'Menyimpan perbaikan...');
  callServer('updatePendaftaran',{idx:_cekRegOrigIdx,data:data}).then(function(res){
    hideLoading();
    window._pendingPerbaikanData = null;
    window._perbaikanSource = null; // reset
    if(res.success){
      // ✅ Pesan sukses berbeda untuk Ditolak vs Perbaikan
      if(isFromRejected){
        showToast('✅ Data berhasil diperbaikan dan dikirim ulang! Status sekarang: "Menunggu Verifikasi".','success');
      } else {
        showToast('Perbaikan data berhasil disimpan! Status kembali ke "Proses Verifikasi".','success');
      }
      cancelPerbaikanForm();
      var q = document.getElementById('cekRegInput');
      if(q) q.value = '';
      var resultDiv = document.getElementById('cekRegResult');
      if(resultDiv) resultDiv.classList.remove('active');
      if(typeof loadPendaftaran==='function') loadPendaftaran();
    } else {
      showToast('Gagal menyimpan: '+(res.message||'Unknown error'),'error');
    }
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}

/* ========== HELPER: Get value from registration data ========== */
function _cekRegV(r,keys){
  for(var i=0;i<keys.length;i++){var v=r[keys[i]];if(v&&String(v).trim())return String(v).trim();}
  return '';
}
