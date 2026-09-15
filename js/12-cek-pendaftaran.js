/* ============================================================
   PAMUNGKAS — MODUL CEK PENDAFTARAN (Track by NIK/NIP + Perbaikan)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/12-cek-pendaftaran.js
   ============================================================ */

/* ========== CEK PENDAFTARAN ========== */
var _cekRegData = null;
var _cekRegOrigIdx = -1;
var _cekRegMultiData = [];

function initCekPendaftaran(){
  document.getElementById('cekRegInput').value='';
  document.getElementById('cekRegResult').innerHTML='';
  document.getElementById('cekRegResult').classList.remove('active');
  setTimeout(function(){document.getElementById('cekRegInput').focus();},200);
}

function searchCekPendaftaran(){
  var q=document.getElementById('cekRegInput').value.trim();
  if(!q){showToast('Masukkan NIK atau NIP.','error');return;}
  var ct=document.getElementById('cekRegResult');
  ct.innerHTML='<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:var(--primary);"></i><p style="margin-top:10px;color:var(--text-muted);">Mencari data...</p></div>';
  ct.classList.add('active');

  // ✅ PERBAIKAN: Gunakan query cekPendaftaran yang lebih lengkap
  callServer('cekPendaftaran', { nik: q }).then(function(res){
    if(!res||!res.success){
      ct.innerHTML='<div class="cek-reg-notfound"><i class="fas fa-exclamation-triangle"></i><p>'+(res?res.message:'Gagal memuat data')+'</p></div>';return;
    }
    var all=res.data||[];
    
    // Data sudah difilter by NIK dari server, jadi langsung tampilkan
    if(!all.length){
      ct.innerHTML='<div class="cek-reg-notfound"><i class="fas fa-user-slash"></i><p>Data pendaftaran dengan NIK/NIP <strong>'+escHTML(q)+'</strong> tidak ditemukan.</p></div>';return;
    }
    
    // Jika hanya ada 1 hasil, tampilkan langsung
    if(all.length === 1) {
      _cekRegData = all[0];
      _cekRegOrigIdx = 0;
      renderCekRegResult(ct, _cekRegData, _cekRegOrigIdx);
    } else {
      // Multiple results (seseorang bisa mendaftar beberapa kegiatan)
      _cekRegMultiData = all.map(function(data, idx) { return {data: data, idx: idx}; });
      renderCekRegMultiResult(ct, _cekRegMultiData, q);
    }
  }).catch(function(e){
    ct.innerHTML='<div class="cek-reg-notfound"><i class="fas fa-wifi"></i><p>Error: '+(e.message||e)+'</p></div>';
  });
}

function _cekRegV(row,names){for(var n of names){if(row[n]!==undefined&&row[n]!==''&&row[n]!=='-')return row[n];}return'';}

function _cekRegFoto(url){
  if(!url||typeof url!=='string')return null;url=url.trim();
  if(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url))return{thumb:url,full:url};
  var m=url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if(m)return{thumb:'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w800',full:'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w1600'};
  m=url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if(m)return{thumb:'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w800',full:'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w1600'};
  return null;
}

function renderCekRegMultiResult(ct, found, query){
  var q = escHTML(query);
  var h = '<div class="cek-reg-multi-summary">';
  h += '<div class="cek-reg-multi-icon"><i class="fas fa-users"></i></div>';
  h += '<div class="cek-reg-multi-info">';
  h += '<h3>Ditemukan ' + found.length + ' Data Pendaftaran</h3>';
  h += '<p>NIK/NIP <strong>' + q + '</strong> memiliki ' + found.length + ' data pendaftaran kegiatan. Berikut detail masing-masing:</p>';
  h += '</div></div>';

  h += '<div class="cek-reg-multi-list">';
  found.forEach(function(item, i) {
    h += '<div class="cek-reg-multi-item" id="cekRegMultiItem_' + i + '">';
    h += '<div class="cek-reg-multi-item-header" onclick="toggleCekRegMultiCard(' + i + ')">';
    var nama = _cekRegV(item.data, ['Nama Lengkap dengan Gelar','Nama Lengkap','Nama']) || '-';
    var judul = _cekRegV(item.data, ['Judul Kegiatan','Judul Pelatihan','Kegiatan','Pelatihan']) || '-';
    var statusVal = String(_cekRegV(item.data, ['Status','Status Pendaftaran']) || '-');
    var sl = statusVal.toLowerCase();
    var scClass = (sl==='diterima'||sl==='lulus'||sl==='aktif')?'diterima':sl==='ditolak'?'ditolak':'pending';
    h += '<div class="cek-reg-multi-item-num">' + (i+1) + '</div>';
    h += '<div class="cek-reg-multi-item-info">';
    h += '<div class="cek-reg-multi-item-name">' + escHTML(nama) + '</div>';
    h += '<div class="cek-reg-multi-item-sub">' + escHTML(judul) + '</div>';
    h += '</div>';
    h += '<div class="reg-status-badge ' + scClass + '" style="margin-left:auto;margin-right:12px;">' + escHTML(statusVal) + '</div>';
    h += '<i class="fas fa-chevron-down cek-reg-multi-toggle-icon" id="cekRegToggle_' + i + '"></i>';
    h += '</div>'; // end header
    h += '<div class="cek-reg-multi-item-body" id="cekRegBody_' + i + '" style="display:none;"></div>';
    h += '</div>'; // end item
  });
  h += '</div>';

  ct.innerHTML = h;
  ct.classList.add('active');
}

function toggleCekRegMultiCard(idx){
  var body = document.getElementById('cekRegBody_' + idx);
  var icon = document.getElementById('cekRegToggle_' + idx);
  if(!body) return;
  if(body.style.display === 'none'){
    /* Expand - render the card content */
    var item = _cekRegMultiData[idx];
    if(item){
      _cekRegData = item.data;
      _cekRegOrigIdx = item.idx;
      renderCekRegResult(body, item.data, item.idx);
      body.style.display = 'block';
      if(icon) icon.classList.add('rotated');
    }
  } else {
    /* Collapse */
    body.style.display = 'none';
    if(icon) icon.classList.remove('rotated');
  }
}

function renderCekRegResult(ct,r,idx){
  var fotoRaw=_cekRegV(r,['Foto','Pas Foto','Pas_Foto','Photo','Link Foto','Foto Peserta']);
  var fotoInfo=_cekRegFoto(fotoRaw);
  var nama=_cekRegV(r,['Nama Lengkap dengan Gelar','Nama Lengkap','Nama'])||'-';
  var unit=_cekRegV(r,['Unit Kerja','Unit_Kerja','Unit'])||'-';
  var statusVal=String(_cekRegV(r,['Status','Status Pendaftaran'])||'-');
  var sl=statusVal.toLowerCase();
  var scClass=(sl==='diterima'||sl==='lulus'||sl==='aktif')?'diterima':sl==='ditolak'?'ditolak':'pending';

  var h='<div class="cek-reg-card">';

  /* FOTO */
  h+='<div class="cek-reg-foto">';
  if(fotoInfo){
    h+='<img src="'+escHTML(fotoInfo.thumb)+'" alt="Foto '+escHTML(nama)+'" onclick="openCekRegLightbox(\''+escHTML(fotoInfo.full).replace(/'/g,"\\'")+'\',\''+escHTML(nama).replace(/'/g,"\\'")+'\')" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" /><div class="no-foto" style="display:none"><i class="fas fa-user"></i><span>Foto tidak tersedia</span></div>';
  } else {
    h+='<div class="no-foto"><i class="fas fa-user"></i><span>Foto tidak tersedia</span></div>';
  }
  h+='</div>';

  /* DATA */
  h+='<div class="cek-reg-data">';
  h+='<div class="reg-profile-name">'+escHTML(nama)+'</div>';
  h+='<div class="reg-profile-unit"><i class="fas fa-hospital"></i> '+escHTML(unit)+'</div>';
  
  // ✅ DEBUG: Log status untuk troubleshooting
  var normalizedStatus = getStatusLabel(statusVal);
  console.log('[CEK-REG] Status debugging:');
  console.log('  - Original statusVal:', JSON.stringify(statusVal));
  console.log('  - Normalized status:', JSON.stringify(normalizedStatus));
  console.log('  - Is Ditolak/Perbaikan:', normalizedStatus === 'Ditolak' || normalizedStatus === 'Perbaikan');
  
  // Gunakan normalizedStatus untuk badge agar konsisten
  var displayStatus = normalizedStatus !== statusVal ? normalizedStatus : statusVal;
  h+='<div class="reg-status-badge '+scClass+'">'+escHTML(displayStatus)+'</div>';

  h+='<div class="reg-fields" style="margin-top:20px;">';

  var fields=[
    {label:'Jenis SDMK',keys:['Jenis SDMK','Jenis_SDMK']},
    {label:'Jenis Profesi',keys:['Jenis Profesi','Jenis_Profesi','Profesi']},
    {label:'NIK',keys:['NIK (Nomor Induk Kependudukan)','NIK','NIK/NIP','NIK_NIP']},
    {label:'NIP',keys:['NIP (Nomor Induk Pegawai)','NIP','NIK/NIP','NIK_NIP']},
    {label:'Status Pekerjaan',keys:['Status Pekerjaan','Status_Pekerjaan']},
    {label:'Jenis Kelamin',keys:['Jenis Kelamin','Jenis_Kelamin']},
    {label:'Tempat & Tanggal Lahir',keys:['Tempat dan Tanggal Lahir','Tempat/Tanggal Lahir','Tempat Tanggal Lahir','TTL'],full:true},
    {label:'Email Platiran Sehat',keys:['Email Plataran Sehat','Email Platiran Sehat','Email','Email Plataran']},
    {label:'Lama Bekerja',keys:['Lama Bekerja di Unit Sekarang','Lama Bekerja','Lama_Bekerja']},
    {label:'No. WhatsApp / Telepon',keys:['Nomor WhatsApp / Telepon','No. WhatsApp','WhatsApp','Telepon','No HP','HP','Kontak']},
    {label:'Alamat Rumah',keys:['Alamat Rumah','Alamat'],full:true,textarea:true},
    {label:'Judul Kegiatan',keys:['Judul Kegiatan','Judul Pelatihan','Kegiatan','Pelatihan'],full:true},
    {label:'Tanggal',keys:['Tanggal','Tanggal Pendaftaran','Tgl Daftar']},
    {label:'Catatan',keys:['Catatan','Keterangan','Notes'],full:true,textarea:true},
    // ✅ TAMBAHAN: Catatan Admin (paragraf - terpisah & menonjol)
    {label:'📝 Catatan Admin',keys:['catatan_admin','Catatan Admin'],full:true,textarea:true,highlight:true}
  ];

  fields.forEach(function(f){
    var v=_cekRegV(r,f.keys);
    var isLink=false;
    if(f.label==='Surat Pernyataan'){
      v=_cekRegV(r,['Surat Pernyataan','Surat_Pernyataan']);
      if(v&&v.indexOf('http')===0)isLink=true;
    }
    // Also check Surat Pernyataan as a separate link field
    if(!isLink && (f.label==='Catatan'||f.label==='Alamat Rumah')){
      // not a link
    }

    // ✅ Special styling untuk Catatan Admin (highlight)
    var fieldClass = 'reg-field' + (f.full ? ' full' : '');
    if (f.highlight) {
      fieldClass += ' reg-field-highlight';
    }
    
    h+='<div class="'+fieldClass+'">';
    h+='<label>'+f.label+'</label>';
    if(isLink){
      h+='<div class="val"><a href="'+escHTML(v)+'" target="_blank"><i class="fas fa-external-link-alt"></i> Lihat/Download Surat Pernyataan</a></div>';
    } else if (f.highlight && v && v !== '-') {
      // Catatan Admin dengan styling khusus (paragraf)
      h+='<div class="val catatan-admin-content"><i class="fas fa-sticky-note"></i> '+escHTML(v).replace(/\n/g, '<br>')+'</div>';
    } else {
      h+='<div class="val">'+(f.textarea ? escHTML(v||'-').replace(/\n/g, '<br>') : escHTML(v||'-'))+'</div>';
    }
    h+='</div>';
  });

  /* Surat Pernyataan separate */
  var suratV=_cekRegV(r,['Surat Pernyataan','Surat_Pernyataan']);
  if(suratV&&suratV.indexOf('http')===0){
    h+='<div class="reg-field full"><label>Surat Pernyataan</label><div class="val"><a href="'+escHTML(suratV)+'" target="_blank"><i class="fas fa-file-alt"></i> Lihat/Download Surat Pernyataan</a></div></div>';
  } else if(suratV&&suratV!=='-'){
    h+='<div class="reg-field full"><label>Surat Pernyataan</label><div class="val">'+escHTML(suratV)+'</div></div>';
  }

  h+='</div>'; // end reg-fields

  /* ✅ PERBAIKAN: Tombol untuk status "Perbaikan" DAN "Ditolak" */
  // normalizedStatus sudah dideklarasikan di atas (line ~9382)
  console.log('[CEK-REG] Showing button check:', normalizedStatus, '→ Ditolak/Perbaikan?', normalizedStatus === 'Ditolak' || normalizedStatus === 'Perbaikan');
  if(normalizedStatus === 'Perbaikan' || normalizedStatus === 'Ditolak'){
    h+='<div class="cek-reg-actions">';
    if(normalizedStatus === 'Ditolak'){
      /* Tombol khusus untuk status Ditolak - warna merah/oranye */
      h+='<div class="perbaikan-notice" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;margin-bottom:14px;text-align:center;">';
      h+='<i class="fas fa-exclamation-triangle" style="color:#DC2626;margin-right:6px;"></i><span style="color:#991B1B;font-size:.88rem;font-weight:500;">Data Anda <strong>DITOLAK</strong>. Silakan perbaiki data yang belum benar dan kirim ulang.</span>';
      h+='</div>';
      h+='<button class="btn btn-danger" onclick="openPerbaikanForm('+idx+',\'rejected\')" style="background:linear-gradient(135deg,#DC2626,#EF4444);border:none;padding:10px 20px;font-size:.92rem;"><i class="fas fa-redo"></i> Perbaiki & Kirim Ulang Data</button>';
    } else {
      /* Tombol standar untuk status Perbaikan */
      h+='<button class="btn btn-warning" onclick="openPerbaikanForm('+idx+',\'perbaikan\')"><i class="fas fa-wrench"></i> Perbaiki Data</button>';
    }
    h+='</div>';
  }

  h+='</div>'; // end cek-reg-data
  h+='</div>'; // end cek-reg-card

  ct.innerHTML=h;
  ct.classList.add('active');
}

function openCekRegLightbox(url,name){
  var lb=document.getElementById('cekRegLightbox');
  document.getElementById('cekRegLightboxImg').src=url;
  document.getElementById('cekRegLightboxName').textContent=name||'';
  lb.classList.add('active');
  document.body.style.overflow='hidden';
}
function closeCekRegLightbox(){
  var lb=document.getElementById('cekRegLightbox');
  lb.classList.remove('active');
  document.getElementById('cekRegLightboxImg').src='';
  document.body.style.overflow='';
}

/* Perbaikan form for Ditolak status */
function togglePerbaikanForm(){
  var wrap=document.getElementById('perbaikanFormWrap');
  if(wrap.style.display==='none'){
    buildPerbaikanForm();
    wrap.style.display='block';
  } else {
    wrap.style.display='none';
  }
}

function buildPerbaikanForm(){
  var r=_cekRegData;
  if(!r)return;
  var wrap=document.getElementById('perbaikanFormWrap');

  var fields=[
    {label:'Nama Lengkap dengan Gelar',keys:['Nama Lengkap dengan Gelar','Nama Lengkap','Nama'],type:'text'},
    {label:'Unit Kerja',keys:['Unit Kerja','Unit_Kerja'],type:'text'},
    {label:'Jenis SDMK',keys:['Jenis SDMK','Jenis_SDMK'],type:'text'},
    {label:'Jenis Profesi',keys:['Jenis Profesi','Jenis_Profesi','Profesi'],type:'text'},
    {label:'NIK',keys:['NIK (Nomor Induk Kependudukan)','NIK','NIK/NIP','NIK_NIP'],type:'text'},
    {label:'NIP',keys:['NIP (Nomor Induk Pegawai)','NIP','NIK/NIP','NIK_NIP'],type:'text'},
    {label:'Status Pekerjaan',keys:['Status Pekerjaan','Status_Pekerjaan'],type:'text'},
    {label:'Jenis Kelamin',keys:['Jenis Kelamin','Jenis_Kelamin'],type:'text'},
    {label:'Tempat & Tanggal Lahir',keys:['Tempat dan Tanggal Lahir','Tempat/Tanggal Lahir'],type:'text',full:true},
    {label:'Email Platiran Sehat',keys:['Email Plataran Sehat','Email Platiran Sehat','Email'],type:'email'},
    {label:'Lama Bekerja',keys:['Lama Bekerja di Unit Sekarang','Lama Bekerja'],type:'text'},
    {label:'No. WhatsApp / Telepon',keys:['Nomor WhatsApp / Telepon','No. WhatsApp','WhatsApp','Telepon'],type:'tel'},
    {label:'Alamat Rumah',keys:['Alamat Rumah','Alamat'],type:'textarea',full:true},
    {label:'Surat Pernyataan (Link)',keys:['Surat Pernyataan','Surat_Pernyataan'],type:'url'},
    {label:'Judul Kegiatan',keys:['Judul Kegiatan','Judul Pelatihan'],type:'text',full:true},
    {label:'Catatan',keys:['Catatan','Keterangan'],type:'textarea',full:true}
  ];

  var h='<div class="perbaikan-form"><h4><i class="fas fa-edit" style="margin-right:6px;color:var(--primary);"></i>Form Perbaikan Data</h4>';
  h+='<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:14px;">Isi hanya field yang ingin diperbaiki. Field yang dikosongkan tidak akan mengubah data existing.</p>';
  h+='<div class="pf-grid">';

  fields.forEach(function(f){
    var val=_cekRegV(r,f.keys)||'';
    h+='<div class="pf-field'+(f.full?' full':'')+'">';
    h+='<label>'+escHTML(f.label)+'</label>';
    if(f.type==='textarea'){
      h+='<textarea id="pf_'+f.keys[0].replace(/[^a-zA-Z0-9]/g,'_')+'" placeholder="Kosongkan jika tidak diubah">'+escHTML(val)+'</textarea>';
    } else {
      h+='<input type="'+f.type+'" id="pf_'+f.keys[0].replace(/[^a-zA-Z0-9]/g,'_')+'" value="'+escHTML(val)+'" placeholder="Kosongkan jika tidak diubah" />';
    }
    h+='</div>';
  });

  h+='</div>'; // pf-grid
  h+='<div class="perbaikan-actions">';
  h+='<button class="btn btn-secondary" onclick="togglePerbaikanForm()">Batal</button>';
  h+='<button class="btn btn-primary" onclick="submitPerbaikan()"><i class="fas fa-paper-plane"></i> Kirim Perbaikan</button>';
  h+='</div></div>';

  wrap.innerHTML=h;
}

function submitPerbaikan(){
  if(!_cekRegData||_cekRegOrigIdx<0){showToast('Data tidak ditemukan.','error');return;}

  var fields=[
    {keys:['Nama Lengkap dengan Gelar','Nama Lengkap','Nama']},
    {keys:['Unit Kerja','Unit_Kerja']},
    {keys:['Jenis SDMK','Jenis_SDMK']},
    {keys:['Jenis Profesi','Jenis_Profesi','Profesi']},
    {keys:['NIK (Nomor Induk Kependudukan)','NIK','NIK/NIP','NIK_NIP']},
    {keys:['NIP (Nomor Induk Pegawai)','NIP','NIK/NIP','NIK_NIP']},
    {keys:['Status Pekerjaan','Status_Pekerjaan']},
    {keys:['Jenis Kelamin','Jenis_Kelamin']},
    {keys:['Tempat dan Tanggal Lahir','Tempat/Tanggal Lahir']},
    {keys:['Email Plataran Sehat','Email Platiran Sehat','Email']},
    {keys:['Lama Bekerja di Unit Sekarang','Lama Bekerja']},
    {keys:['Nomor WhatsApp / Telepon','No. WhatsApp','WhatsApp','Telepon']},
    {keys:['Alamat Rumah','Alamat']},
    {keys:['Surat Pernyataan','Surat_Pernyataan']},
    {keys:['Judul Kegiatan','Judul Pelatihan']},
    {keys:['Catatan','Keterangan']}
  ];

  var data={_user:adminUsername||'pendaftaran_perbaikan'};
  var changed=0;
  fields.forEach(function(f){
    var fieldId='pf_'+f.keys[0].replace(/[^a-zA-Z0-9]/g,'_');
    var el=document.getElementById(fieldId);
    if(!el)return;
    var newVal=el.value.trim();
    // Find the actual header name that exists in the data
    var headerKey=null;
    for(var k of f.keys){
      if(_cekRegData.hasOwnProperty(k)){headerKey=k;break;}
    }
    if(!headerKey)return;
    var origVal=String(_cekRegData[headerKey]||'').trim();
    // Only send if value actually changed
    if(newVal!==origVal){
      data[headerKey]=newVal;
      changed++;
    }
  });

  if(changed===0){showToast('Tidak ada data yang diubah. Semua field masih sama dengan data asli.','error');return;}

  showLoading('Mengirim perbaikan...');
  callServer('updatePendaftaran',{idx:_cekRegOrigIdx,data:data}).then(function(res){
    hideLoading();
    if(res.success){
      showToast('Perbaikan data berhasil dikirim. Silakan cek kembali.','success');
      // Refresh and re-search
      var q=document.getElementById('cekRegInput').value.trim();
      document.getElementById('cekRegResult').classList.remove('active');
      if(q)searchCekPendaftaran();
    } else {
      showToast('Gagal: '+(res.message||'Unknown error'),'error');
    }
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}
