/* ============================================================
   PAMUNGKAS — MODUL PENDAFTARAN PELATIHAN (+ Bukti PDF)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/09-pendaftaran.js
   ============================================================ */

/* ========== PENDAFTARAN ========== */
function _generateRegID(){
  var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
  return 'REG-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());
}
function _formatRegDateTime(){
  var d=new Date(),p=function(n){return String(n).padStart(2,'0');};
  var hari=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var bulan=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return hari[d.getDay()]+', '+p(d.getDate())+' '+bulan[d.getMonth()]+' '+d.getFullYear()+' - '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds())+' WIB';
}
function _initRegInfoBar(){
  document.getElementById('regAutoID').textContent=_generateRegID();
  document.getElementById('regAutoDateTime').textContent=_formatRegDateTime();
}
function _driveToThumb(url){
  if(!url||typeof url!=='string')return null;url=url.trim();
  if(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url))return url;
  var m=url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if(m)return'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w200';
  m=url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if(m)return'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w200';
  return null;
}
/* ========== NHOST STORAGE (Upload File & Akses Terproteksi) ========== */
var _authFileCache = {}; // url storage -> objectURL (hindari fetch berulang)
function _isStorageUrl(url){ return typeof url === 'string' && url.indexOf('/v1/files/') !== -1; }
function _storageAuthHeaders(){
  /* SECURITY v7.5: upload/read storage pakai JWT Nhost (user login) atau
     permission publik (form pendaftaran anonim) — TANPA admin secret. */
  var h = {};
  var at = window.Sec ? Sec.getAccessToken() : '';
  if (at) h['Authorization'] = 'Bearer ' + at;
  return h;
}
/** Upload file ke Nhost Storage → Promise<{url,name,size,mimeType}> */
function uploadPamungkasFile(file){
  return new Promise(function(resolve,reject){
    if(!file){reject(new Error('File tidak ada'));return;}
    var fd=new FormData();
    fd.append('file[]',file,file.name);
    fetch(NHOST_CONFIG.storageUrl+'/v1/files',{
      method:'POST',
      headers:_storageAuthHeaders(),
      body:fd
    }).then(function(r){
      return r.json().then(function(j){return {ok:r.ok,body:j};});
    }).then(function(res){
      if(!res.ok || !res.body || !res.body.processedFiles || !res.body.processedFiles.length){
        var msg=(res.body && res.body.error && (res.body.error.message||res.body.error)) || 'Upload ke penyimpanan gagal';
        reject(new Error(typeof msg==='string'?msg:JSON.stringify(msg)));
        return;
      }
      var f=res.body.processedFiles[0];
      resolve({url:NHOST_CONFIG.storageUrl+'/v1/files/'+f.id, name:f.name, size:f.size, mimeType:f.mimeType});
    }).catch(function(e){reject(e);});
  });
}
/** Fetch file storage → blob objectURL (cache). Link eksternal (Drive dll) dibalikkan apa adanya.
    Akses file memakai JWT user (bila login) atau permission publik (anonim). */
function fetchAuthFileBlobUrl(url){
  if(!url)return Promise.reject(new Error('URL kosong'));
  if(_authFileCache[url])return Promise.resolve(_authFileCache[url]);
  if(!_isStorageUrl(url))return Promise.resolve(url);
  return fetch(url,{headers:_storageAuthHeaders()})
    .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob();})
    .then(function(b){var u=URL.createObjectURL(b);_authFileCache[url]=u;return u;});
}
/** Buka file: link eksternal langsung; file storage via fetch auth → tab baru */
function openAuthFile(url){
  if(!url||url==='-'){showToast('Link file tidak tersedia.','error');return;}
  if(!_isStorageUrl(url)){window.open(url,'_blank');return;}
  showLoading('Membuka file...');
  fetchAuthFileBlobUrl(url).then(function(u){hideLoading();window.open(u,'_blank');})
    .catch(function(e){hideLoading();showToast('Gagal membuka file: '+(e.message||e),'error');});
}
/** Thumbnail foto untuk tabel (fetch auth utk file storage, Drive thumb utk link lama) */
function _authImgTag(url){
  if(!url||url==='-')return '<span style="color:var(--text-muted);font-size:.75rem;">-</span>';
  if(!_isStorageUrl(url)){
    var t=_driveToThumb(url);
    if(t)return '<img src="'+escHTML(t)+'" class="reg-table-thumb" onerror="this.replaceWith(document.createTextNode(\'-\'))"/>';
    return '<span style="color:var(--text-muted);font-size:.75rem;">Link</span>';
  }
  var pid='authimg_'+Math.random().toString(36).slice(2,10);
  var img='<img id="'+pid+'" src="data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" class="reg-table-thumb" alt="foto" style="background:#e2e8f0;"/>';
  setTimeout(function(){
    fetchAuthFileBlobUrl(url).then(function(u){var im=document.getElementById(pid);if(im)im.src=u;})
      .catch(function(){var im=document.getElementById(pid);if(im)im.replaceWith(document.createTextNode('-'));});
  },0);
  return img;
}

function previewRegFoto(){
  var input=document.getElementById('regFoto');
  var box=document.getElementById('regFotoPreview');
  if(!input||!box)return;
  var f=input.files&&input.files[0];
  if(!f){box.classList.remove('has-image');box.innerHTML='<i class="fas fa-camera"></i><span>Preview Foto</span>';return;}
  if(!/^image\//.test(f.type)){box.classList.remove('has-image');box.innerHTML='<i class="fas fa-exclamation-triangle" style="color:var(--danger);"></i><span style="color:var(--danger);">File bukan gambar</span>';return;}
  var reader=new FileReader();
  reader.onload=function(e){box.innerHTML='<img src="'+e.target.result+'" alt="Preview Foto"/>';box.classList.add('has-image');};
  reader.onerror=function(){box.classList.remove('has-image');box.innerHTML='<i class="fas fa-exclamation-triangle" style="color:var(--danger);"></i><span style="color:var(--danger);">Gagal membaca file</span>';};
  reader.readAsDataURL(f);
}
function showSuratFileName(){
  var input=document.getElementById('regSuratPernyataan');
  var lbl=document.getElementById('regSuratFileName');
  if(!input||!lbl)return;
  var f=input.files&&input.files[0];
  lbl.innerHTML=f?'<i class="fas fa-file-arrow-up" style="margin-right:4px;"></i>'+escHTML(f.name)+' ('+(f.size/1024).toFixed(0)+' KB)':'';
}
function loadPendaftaran(){
  _initRegInfoBar();
  _loadJudulKegiatanOptions();
  /* FIX v7.5.1 — error "field 'foto' not found in type: 'pendaftaran'":
     Query GetPendaftaran memuat kolom PII (foto, nik, surat_pernyataan, dll)
     yang TIDAK tersedia bagi role public (pengunjung anonim) di permission
     Hasura v7.5 → schema GraphQL role public tidak punya field 'foto'.
     Selain itu halaman form ini tidak lagi memiliki kontainer tabel pendaftaran
     (data dikelola di Panel Admin dengan loader tersendiri).
     Maka: muat data HANYA bila ada sesi login DAN kontainer tabel tersedia.
     Pengunjung anonim tetap bisa: form pendaftaran + dropdown judul kegiatan. */
  if (!(window.Sec && window.Sec.hasSession && window.Sec.hasSession())) return;
  if (!document.getElementById('pendaftaranTableBody')) return;
  showLoading('Memuat data pendaftaran...');
  callServer('getPendaftaran').then(function(res){
    hideLoading();if(!res||!res.success){showToast(res?res.message:'Gagal memuat pendaftaran','error');return;}
    _allPendaftaran=res.data||[];renderPendaftaranTable(_allPendaftaran);
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}
/** Isi dropdown Judul Kegiatan dari kolom judul tabel pengumuman (Hasura) */
function _loadJudulKegiatanOptions(){
  var sel=document.getElementById('regJudulKegiatan');
  if(!sel)return;
  callServer('getPengumuman').then(function(res){
    if(!res||!res.success||!res.data)return;
    var juduls=[],seen={};
    (res.data||[]).forEach(function(p){
      var j=String(p.Judul||p.judul||'').trim();
      if(j && !seen[j.toLowerCase()]){seen[j.toLowerCase()]=1;juduls.push(j);}
    });
    var current=sel.value;
    if(!juduls.length){
      sel.innerHTML='<option value="">-- Belum ada kegiatan dibuka --</option>';
      return;
    }
    var h='<option value="">-- Pilih Judul Kegiatan --</option>';
    juduls.forEach(function(j){h+='<option value="'+escHTML(j)+'">'+escHTML(j)+'</option>';});
    sel.innerHTML=h;
    if(current && seen[current.toLowerCase()])sel.value=current; // pertahankan pilihan bila masih ada
  }).catch(function(e){console.warn('[PENDAFTARAN] Gagal memuat opsi judul kegiatan:',e);});
}
function renderPendaftaranTable(data){
  var tb=document.getElementById('pendaftaranTableBody'),hd=document.getElementById('pendaftaranTableHead'),em=document.getElementById('pendaftaranEmpty');
  if(!tb||!hd)return;
  if(!data.length){hd.innerHTML='';tb.innerHTML='';if(em)em.style.display='block';return;}if(em)em.style.display='none';
  var keys=Object.keys(data[0]);
  hd.innerHTML='<tr><th>No</th>';
  keys.forEach(function(k){if(k!=='ID')hd.innerHTML+='<th>'+escHTML(k.replace(/_/g,' '))+'</th>';});
  if(canWrite('pendaftaran')){
    hd.innerHTML+='<th>Aksi Status</th><th>Perbaikan</th><th>Edit</th>';
  } else {
    hd.innerHTML+='<th>Aksi</th>';
  }
  hd.innerHTML+='</tr>';
  tb.innerHTML='';
  data.forEach(function(r,i){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td>';
    keys.forEach(function(k){
      if(k!=='ID'){
        var v=r[k]||'-';
        if(k==='Foto'){tr.innerHTML+='<td>'+_authImgTag(v)+'</td>';return;}
        if(k==='Surat Pernyataan'||k==='Link Google Drive SPJ'){
          if(v&&v!=='-'){
            var urlAttr=String(v).replace(/'/g,'%27');
            tr.innerHTML+='<td><button class="btn btn-sm btn-secondary" onclick="openAuthFile(\''+urlAttr+'\')" title="Buka file"><i class="fas fa-external-link-alt"></i> Buka</button></td>';
          } else {
            tr.innerHTML+='<td>-</td>';
          }
          return;
        }
        if(k.toLowerCase().indexOf('status')!==-1 || k==='Status'){
          var statusLabel=getStatusLabel(v);
          v='<span class="status-badge '+statusClass(v)+'">'+escHTML(statusLabel)+'</span>';
        }
        tr.innerHTML+='<td>'+v+'</td>';
      }
    });
    if(canWrite('pendaftaran')){
      /* Kolom Aksi Status - Tombol Workflow */
      var workflowBtn='<button class="btn btn-sm btn-primary" onclick="openStatusWorkflowModal('+i+')" title="Ubah Status Workflow"><i class="fas fa-exchange-alt"></i></button>';
      tr.innerHTML+='<td><div class="workflow-actions">'+workflowBtn+'</div></td>';
      
      /* Kolom Perbaikan - HANYA muncul jika status = "Perbaikan" */
      var currentStatus=getStatusLabel(r.Status||'Menunggu');
      var perbaikanCell='';
      if(currentStatus==='Perbaikan'){
        perbaikanCell='<button class="btn btn-sm btn-warning" onclick="openPerbaikanForm('+i+')" title="Perbaiki Data"><i class="fas fa-wrench"></i> Perbaiki</button>';
      } else {
        perbaikanCell='<span style="color:var(--text-muted);font-size:.75rem;">-</span>';
      }
      tr.innerHTML+='<td>'+perbaikanCell+'</td>';
      
      /* Kolom Edit/Delete */
      tr.innerHTML+='<td><button class="btn btn-sm btn-warning" onclick="editPendaftaran('+i+')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="confirmDelete(\'Pendaftaran\','+i+')"><i class="fas fa-trash"></i></button></td>';
    } else {
      tr.innerHTML+='<td>-</td>';
    }
    tr.style.cursor='pointer';
    tr.addEventListener('click',function(e){if(!e.target.closest('.btn'))editPendaftaran(i);});
    tb.appendChild(tr);
  });
}
function filterPendaftaran(){var el=document.getElementById('searchPendaftaran');if(!el)return;var q=el.value.toLowerCase();var f=_allPendaftaran.filter(function(r){return Object.values(r).some(function(v){return String(v).toLowerCase().indexOf(q)!==-1;});});renderPendaftaranTable(f);}

/* ========== BUKTI PENDAFTARAN (PDF) ========== */
function showBuktiModal(d){
  var id=d['ID Pendaftaran']||d['ID']||'-';
  var nama=d['Nama Lengkap dengan Gelar']||'-';
  var unit=d['Unit Kerja']||'-';
  var judul=d['Judul Kegiatan']||'-';
  var tgl=d['Tanggal']||d['Tanggal & Jam Daftar']||new Date().toLocaleDateString('id-ID');

  var h='<div class="bukti-modal-overlay" id="buktiModalOverlay" onclick="if(event.target===this)closeBuktiModal()">';
  h+='<div class="bukti-modal-box">';
  h+='<div class="bukti-modal-header"><h3>Pendaftaran Berhasil!</h3><p>Data Anda telah tersimpan di sistem.</p></div>';
  h+='<div class="bukti-modal-body">';
  h+='<div class="bukti-icon"><i class="fas fa-check-circle"></i></div>';
  h+='<div class="bukti-fields">';
  h+='<div class="bukti-field"><span class="bf-label">ID Pendaftaran</span><span class="bf-value">'+escHTML(id)+'</span></div>';
  h+='<div class="bukti-field"><span class="bf-label">Nama</span><span class="bf-value">'+escHTML(nama)+'</span></div>';
  h+='<div class="bukti-field"><span class="bf-label">Unit Kerja</span><span class="bf-value">'+escHTML(unit)+'</span></div>';
  h+='<div class="bukti-field"><span class="bf-label">Judul Kegiatan</span><span class="bf-value">'+escHTML(judul)+'</span></div>';
  h+='<div class="bukti-field"><span class="bf-label">Tanggal</span><span class="bf-value">'+escHTML(tgl)+'</span></div>';
  h+='</div></div>';
  h+='<div class="bukti-modal-footer">';
  h+='<button class="btn btn-secondary" onclick="closeBuktiModal()"><i class="fas fa-times"></i> Tutup</button>';
  h+='<button class="btn btn-primary" onclick="generateBuktiPendaftaran()"><i class="fas fa-file-pdf"></i> Download Bukti</button>';
  h+='</div></div></div>';

  // Store data for PDF generation
  window._buktiData={id:id,nama:nama,unit:unit,judul:judul,tgl:tgl};
  document.body.insertAdjacentHTML('beforeend',h);
}

function closeBuktiModal(){
  var el=document.getElementById('buktiModalOverlay');
  if(el)el.remove();
}

function generateBuktiPendaftaran(){
  if(typeof jspdf==='undefined'){showToast('Library jsPDF belum dimuat.','error');return;}
  var d=window._buktiData;
  if(!d){showToast('Data bukti tidak tersedia.','error');return;}

  var {jsPDF}=jspdf;
  var doc=new jsPDF('p','mm','a4');
  var pw=doc.internal.pageSize.getWidth();
  var ph=doc.internal.pageSize.getHeight();
  var lm=20,rm=20,tm=15;

  /* ===== BORDER FRAME ===== */
  doc.setDrawColor(13,110,253);
  doc.setLineWidth(1.2);
  doc.roundedRect(lm-4,tm-4,pw-lm-rm+8,ph-tm-15+8,4,4,'S');
  doc.setLineWidth(0.3);
  doc.roundedRect(lm-1.5,tm-1.5,pw-lm-rm+3,ph-tm-15+3,2,2,'S');

  /* ===== HEADER ===== */
  doc.setFillColor(13,110,253);
  doc.roundedRect(lm,tm,pw-lm-rm,28,3,3,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16);
  doc.setFont('helvetica','bold');
  doc.text('PAMUNGKAS',pw/2,tm+12,{align:'center'});
  doc.setFontSize(8);
  doc.setFont('helvetica','normal');
  doc.text('Pengelolaan Pengembangan Mutu dan Peningkatan Kompetensi SDM Kesehatan',pw/2,tm+19,{align:'center'});

  /* ===== TITLE ===== */
  var y=tm+40;
  doc.setTextColor(30,41,59);
  doc.setFontSize(14);
  doc.setFont('helvetica','bold');
  doc.text('BUKTI PENDAFTARAN',pw/2,y,{align:'center'});
  doc.setDrawColor(13,110,253);
  doc.setLineWidth(0.6);
  doc.line(lm+20,y+3,rm+20,y+3);

  /* ===== DATA FIELDS ===== */
  y+=16;
  doc.autoTable({
    startY:y,
    margin:{left:lm+8,right:rm+8},
    body:[
      ['ID Pendaftaran',d.id],
      ['Nama Lengkap dengan Gelar',d.nama],
      ['Unit Kerja',d.unit],
      ['Judul Kegiatan',d.judul],
      ['Tanggal',d.tgl]
    ],
    columnStyles:{
      0:{fontStyle:'bold',cellWidth:55,fontSize:9.5,textColor:[100,116,139]},
      1:{cellWidth:'auto',fontSize:10,textColor:[30,41,59]}
    },
    theme:'plain',
    styles:{cellPadding:{top:5,bottom:5,left:4,right:4},lineColor:[226,232,240],lineWidth:0.2},
    alternateRowStyles:{fillColor:[248,250,252]}
  });

  /* ===== STATUS BADGE ===== */
  y=doc.lastAutoTable.finalY+14;
  doc.setFillColor(16,185,129);
  doc.roundedRect(pw/2-22,y-4,44,8,2,2,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(8);
  doc.setFont('helvetica','bold');
  doc.text('STATUS: PENDING',pw/2,y+1.5,{align:'center'});

  /* ===== FOOTER ===== */
  doc.setTextColor(148,163,184);
  doc.setFontSize(7);
  doc.setFont('helvetica','normal');
  var footerY=ph-22;
  doc.setDrawColor(226,232,240);
  doc.setLineWidth(0.3);
  doc.line(lm,footerY-3,pw-rm,footerY-3);
  doc.text('Dokumen ini digenerate secara otomatis oleh sistem PAMUNGKAS.',pw/2,footerY+2,{align:'center'});
  doc.text('Waktu cetak: '+new Date().toLocaleString('id-ID'),pw/2,footerY+7,{align:'center'});

  doc.save('Bukti_Pendaftaran_'+d.id+'.pdf');
  showToast('Bukti pendaftaran berhasil didownload.','success');
}

/* ========== BUKTI PENDAFTARAN PDF ========== */
function generateBuktiPendaftaran(regID, data){
  try {
    var nama = data['Nama Lengkap dengan Gelar'] || '-';
    var unit = data['Unit Kerja'] || '-';
    var judul = data['Judul Kegiatan'] || '-';
    var tanggal = data['Tanggal'] || '-';
    var tanggalJam = data['Tanggal & Jam Daftar'] || '-';

    var { jsPDF } = window.jspdf;
    var doc = new jsPDF('p', 'mm', 'a4');
    var pw = doc.internal.pageSize.getWidth();
    var ph = doc.internal.pageSize.getHeight();
    var lm = 25; // left margin
    var rm = 25; // right margin
    var cw = pw - lm - rm; // content width

    // ===== HEADER BORDER =====
    doc.setDrawColor(0, 70, 140);
    doc.setLineWidth(1.2);
    doc.rect(15, 12, pw - 30, ph - 24);
    doc.setLineWidth(0.4);
    doc.rect(17, 14, pw - 34, ph - 28);

    // ===== TITLE =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 70, 140);
    doc.text('BUKTI PENDAFTARAN', pw / 2, 30, { align: 'center' });

    // ===== SUBTITLE =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Dokumen ini merupakan bukti resmi pendaftaran kegiatan.', pw / 2, 37, { align: 'center' });

    // ===== SEPARATOR LINE =====
    doc.setDrawColor(0, 70, 140);
    doc.setLineWidth(0.6);
    doc.line(lm, 42, pw - rm, 42);

    // ===== DATA TABLE using autoTable =====
    var tableData = [
      ['ID Pendaftaran', regID],
      ['Nama Lengkap dengan Gelar', nama],
      ['Unit Kerja', unit],
      ['Judul Kegiatan', judul],
      ['Tanggal Kegiatan', tanggal],
      ['Tanggal & Jam Daftar', tanggalJam],
      ['Status', 'Pending (Menunggu Verifikasi)']
    ];

    doc.autoTable({
      startY: 48,
      margin: { left: lm, right: rm },
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 30, 30]
      },
      columnStyles: {
        0: {
          fontStyle: 'bold',
          cellWidth: 58,
          textColor: [0, 70, 140],
          halign: 'left'
        },
        1: {
          cellWidth: cw - 58,
          halign: 'left'
        }
      },
      didDrawCell: function(data) {
        // Draw bottom border on last row
        if (data.row.index === tableData.length - 1 && data.section === 'body') {
          doc.setDrawColor(0, 70, 140);
          doc.setLineWidth(0.3);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    // ===== FOOTER NOTE =====
    var finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Bukti pendaftaran ini digenerate secara otomatis pada saat pendaftaran berhasil disubmit.', lm, finalY, { maxWidth: cw });
    doc.text('Simpan dokumen ini sebagai bukti pendaftaran Anda.', lm, finalY + 5, { maxWidth: cw });

    // ===== TIMESTAMP BOTTOM-RIGHT =====
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated: ' + new Date().toLocaleString('id-ID'), pw - rm, ph - 18, { align: 'right' });

    // ===== SAVE =====
    var filename = 'Bukti_Pendaftaran_' + regID.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
    doc.save(filename);
    showToast('Bukti pendaftaran berhasil diunduh!', 'success');
  } catch(err) {
    console.error('PDF generation error:', err);
    showToast('Gagal membuat bukti pendaftaran: ' + (err.message || err), 'error');
  }
}

function submitPendaftaran(e){e.preventDefault();
  /* ===== VALIDASI SEMUA FIELD WAJIB DIISI ===== */
  var requiredFields=[
    {id:'regFoto',label:'Foto',type:'file'},
    {id:'regNama',label:'Nama Lengkap dengan Gelar'},
    {id:'regUnitKerja',label:'Unit Kerja'},
    {id:'regJenisSDMK',label:'Jenis SDMK'},
    {id:'regJenisProfesi',label:'Jenis Profesi'},
    {id:'regNIK',label:'NIK'},
    {id:'regNIP',label:'NIP'},
    {id:'regStatusPekerjaan',label:'Status Pekerjaan'},
    {id:'regJenisKelamin',label:'Jenis Kelamin'},
    {id:'regTempatTglLahir',label:'Tempat dan Tanggal Lahir'},
    {id:'regEmailPlataran',label:'Email Plataran Sehat'},
    {id:'regLamaBekerja',label:'Lama Bekerja'},
    {id:'regKontak',label:'Nomor WhatsApp / Telepon'},
    {id:'regAlamat',label:'Alamat Rumah'},
    {id:'regSuratPernyataan',label:'Surat Pernyataan',type:'file'},
    {id:'regLinkSPJ',label:'Link Google Drive SPJ'},
    {id:'regJudulKegiatan',label:'Judul Kegiatan'},
    {id:'regTanggal',label:'Tanggal'}
  ];
  for(var i=0;i<requiredFields.length;i++){
    var rf=requiredFields[i];
    var el=document.getElementById(rf.id);
    if(!el){showToast('Field '+rf.label+' tidak ditemukan.','error');return;}
    if(rf.type==='file'){
      if(!el.files||!el.files.length){showToast(rf.label+' wajib dipilih (upload file)!','error');el.focus();el.style.borderColor='var(--danger)';setTimeout((function(e2){return function(){e2.style.borderColor='';};})(el),3000);return;}
    } else {
      var v=(el.value||'').trim();
      if(!v){showToast(rf.label+' wajib diisi!','error');el.focus();el.style.borderColor='var(--danger)';setTimeout((function(e2){return function(){e2.style.borderColor='';};})(el),3000);return;}
    }
  }
  /* ===== VALIDASI FILE ===== */
  var fotoFile=document.getElementById('regFoto').files[0];
  var suratFile=document.getElementById('regSuratPernyataan').files[0];
  if(!/^image\//.test(fotoFile.type)){showToast('Foto harus berupa file gambar (JPG/PNG/WEBP).','error');return;}
  if(fotoFile.size>2*1024*1024){showToast('Ukuran foto maksimal 2 MB.','error');return;}
  var suratOk=/^(image\/|application\/pdf$)/.test(suratFile.type)||/\.pdf$/i.test(suratFile.name);
  if(!suratOk){showToast('Surat Pernyataan harus file PDF atau gambar (JPG/PNG).','error');return;}
  if(suratFile.size>5*1024*1024){showToast('Ukuran Surat Pernyataan maksimal 5 MB.','error');return;}
  /* ===== AMBIL SEMUA DATA ===== */
  var regID=document.getElementById('regAutoID').textContent;
  var regDateTime=document.getElementById('regAutoDateTime').textContent;
  var linkSPJ=document.getElementById('regLinkSPJ').value.trim();
  var btn=document.getElementById('btnSubmitPendaftaran');
  btn.disabled=true;btn.innerHTML='<i class=\'fas fa-spinner fa-spin\'></i> Mengupload file...';
  /* ===== UPLOAD FOTO & SURAT PERNYATAAN KE NHOST STORAGE ===== */
  Promise.all([uploadPamungkasFile(fotoFile),uploadPamungkasFile(suratFile)]).then(function(results){
    var fotoUp=results[0],suratUp=results[1];
    btn.innerHTML='<i class=\'fas fa-spinner fa-spin\'></i> Mengirim pendaftaran...';
    var data={
      'ID Pendaftaran':regID,
      'Tanggal & Jam Daftar':regDateTime,
      'Foto':fotoUp.url,
      'Nama Lengkap dengan Gelar':document.getElementById('regNama').value.trim(),
      'Unit Kerja':document.getElementById('regUnitKerja').value.trim(),
      'Jenis SDMK':document.getElementById('regJenisSDMK').value.trim(),
      'Jenis Profesi':document.getElementById('regJenisProfesi').value.trim(),
      'NIK':document.getElementById('regNIK').value.trim(),
      'NIP':document.getElementById('regNIP').value.trim(),
      'NIK (Nomor Induk Kependudukan)':document.getElementById('regNIK').value.trim(),
      'NIP (Nomor Induk Pegawai)':document.getElementById('regNIP').value.trim(),
      'Status Pekerjaan':document.getElementById('regStatusPekerjaan').value.trim(),
      'Jenis Kelamin':document.getElementById('regJenisKelamin').value.trim(),
      'Tempat dan Tanggal Lahir':document.getElementById('regTempatTglLahir').value.trim(),
      'Email Plataran Sehat':document.getElementById('regEmailPlataran').value.trim(),
      'Lama Bekerja di Unit Sekarang':document.getElementById('regLamaBekerja').value.trim(),
      'Nomor WhatsApp / Telepon':document.getElementById('regKontak').value.trim(),
      'Alamat Rumah':document.getElementById('regAlamat').value.trim(),
      'Surat Pernyataan':suratUp.url,
      'Link Google Drive SPJ':linkSPJ,
      'Judul Kegiatan':document.getElementById('regJudulKegiatan').value.trim(),
      'Tanggal':document.getElementById('regTanggal').value.trim(),
      'Status':'Pending'
    };
    return callServer('tambahPendaftaran',data).then(function(res){
      btn.disabled=false;btn.innerHTML='<i class=\'fas fa-paper-plane\'></i> Kirim Pendaftaran';
      showToast(res.message,res.success?'success':'error');
      if(res.success){
        generateBuktiPendaftaran(regID, data);
        document.getElementById('pendaftaranForm').reset();
        document.getElementById('regFotoPreview').classList.remove('has-image');
        document.getElementById('regFotoPreview').innerHTML='<i class=\'fas fa-camera\'></i><span>Preview Foto</span>';
        showSuratFileName();
        _initRegInfoBar();loadPendaftaran();
      }
    });
  }).catch(function(err){
    btn.disabled=false;btn.innerHTML='<i class=\'fas fa-paper-plane\'></i> Kirim Pendaftaran';
    showToast('Upload gagal: '+(err.message||err),'error');
  });
}
function editPendaftaran(i){
  if(i < 0 || !_allPendaftaran || i >= _allPendaftaran.length){showToast('Data tidak ditemukan.','error');return;}
  var r=_allPendaftaran[i];
  var currentStatus=getStatusLabel(r.Status||'Menunggu');
  var catatanStatus=r['Catatan Status']||r['Catatan']||'';
  
  // Workflow Section
  var b='<div class="edit-workflow-section">';
  b+='<div class="edit-workflow-header"><h4><i class="fas fa-exchange-alt"></i> Status Workflow</h4>';
  b+='<span class="status-badge '+statusClass(currentStatus)+'">'+escHTML(currentStatus)+'</span></div>';
  b+='<div class="edit-workflow-status"><label>Ubah Status:</label>';
  b+='<select id="editWorkflowStatus">';
  b+='<option value="">-- Pilih Status --</option>';
  b+='<option value="Menunggu" '+(currentStatus==='Menunggu'?'selected':'')+'>Menunggu</option>';
  b+='<option value="Proses Verifikasi" '+(currentStatus==='Proses Verifikasi'?'selected':'')+'>Proses Verifikasi</option>';
  b+='<option value="Perbaikan" '+(currentStatus==='Perbaikan'?'selected':'')+'>Perbaikan</option>';
  b+='<option value="Disetujui" '+(currentStatus==='Disetujui'?'selected':'')+'>Disetujui</option>';
  b+='<option value="Ditolak" '+(currentStatus==='Ditolak'?'selected':'')+'>Ditolak</option>';
  b+='</select></div>';
  b+='<div class="edit-workflow-catatan"><label>Catatan Perubahan Status:</label>';
  b+='<textarea id="editWorkflowCatatan" placeholder="Tambahkan catatan jika mengubah status...">'+escHTML(catatanStatus)+'</textarea>';
  b+='</div></div>';
  
  // Data Fields
  b+='<div class="detail-grid">';
  
  // ✅ Track apakah catatan sudah ditambahkan (untuk avoid duplicate)
  var catatanAdminAdded = false;
  
  Object.keys(r).forEach(function(k){
    if(k==='ID') return;
    var v=escHTML(r[k]||'');
    if(k==='Status' || k==='Catatan Status' || k==='Diubah Oleh' || k==='Tanggal Ubah Status' || k==='Tanggal Perbaikan') return;
    
    // ✅ Handle catatan_admin secara khusus (textarea dengan styling menonjol)
    if(k==='catatan_admin' || k==='Catatan Admin'){
      b+='<div class="detail-item full" style="background:#FFF7ED;border:2px solid #FDBA74;border-radius:8px;padding:12px;margin:10px 0;">';
      b+='<label style="color:#92400E;font-weight:700;display:block;margin-bottom:6px;"><i class="fas fa-sticky-note" style="margin-right:6px;color:#F59E0B;"></i>Catatan Admin</label>';
      b+='<textarea id="editReg_catatan_admin" rows="4" style="padding:10px 12px;border:1.5px solid #FDBA74;border-radius:6px;font-family:inherit;font-size:.9rem;width:100%;resize:vertical;background:#FFFBEB;color:#78350F;" placeholder="Tambahkan catatan admin...">'+v+'</textarea>';
      b+='</div>';
      catatanAdminAdded = true;
      return; // Skip processing lanjutan
    }
    
    if((k==='Surat Pernyataan'||k==='Link Google Drive SPJ') && v && v!=='-'){
      var urlAttrEdit=String(v).replace(/'/g,'%27');
      b+='<div class="detail-item full"><label>'+escHTML(k)+'</label><div style="display:flex;gap:8px;align-items:center;"><input type="url" value="'+v+'" id="editReg_'+k.replace(/[^a-zA-Z0-9]/g,'_')+'" style="flex:1;height:38px;padding:0 10px;border:1.5px solid var(--border-color);border-radius:6px;font-family:inherit;font-size:.85rem;" /><button type="button" class="btn btn-sm btn-primary" style="flex-shrink:0;" onclick="openAuthFile(\''+urlAttrEdit+'\')"><i class="fas fa-external-link-alt"></i></button></div></div>';
    }
    else if(k==='Alamat Rumah'){
      b+='<div class="detail-item full"><label>'+escHTML(k)+'</label><textarea id="editReg_'+k.replace(/[^a-zA-Z0-9]/g,'_')+'" rows="3" style="padding:8px 10px;border:1.5px solid var(--border-color);border-radius:6px;font-family:inherit;font-size:.85rem;width:100%;resize:vertical;">'+v+'</textarea></div>';
    }
    else{
      b+='<div class="detail-item"><label>'+escHTML(k.replace(/_/g,' '))+'</label><input type="text" value="'+v+'" id="editReg_'+k.replace(/[^a-zA-Z0-9]/g,'_')+'" style="height:38px;padding:0 10px;border:1.5px solid var(--border-color);border-radius:6px;font-family:inherit;font-size:.85rem;" /></div>';
    }
  });
  
  // ✅ Jika catatan_admin belum ditambahkan (tidak ada di r), tambahkan manual
  if(!catatanAdminAdded){
    b+='<div class="detail-item full" style="background:#FFF7ED;border:2px solid #FDBA74;border-radius:8px;padding:12px;margin:10px 0;">';
    b+='<label style="color:#92400E;font-weight:700;display:block;margin-bottom:6px;"><i class="fas fa-sticky-note" style="margin-right:6px;color:#F59E0B;"></i>Catatan Admin</label>';
    b+='<textarea id="editReg_catatan_admin" rows="4" style="padding:10px 12px;border:1.5px solid #FDBA74;border-radius:6px;font-family:inherit;font-size:.9rem;width:100%;resize:vertical;background:#FFFBEB;color:#78350F;" placeholder="Tambahkan catatan admin..."></textarea>';
    b+='</div>';
  }
  
  b+='</div>';
  
  document.getElementById('detailModalTitle').textContent='Edit Pendaftar: '+(r['Nama Lengkap dengan Gelar']||r.Nama||'');
  document.getElementById('detailModalBody').innerHTML=b;
  document.getElementById('detailModal').querySelector('.modal-footer').innerHTML=
    '<button class="btn btn-secondary" onclick="closeModal(\'detailModal\');loadPendaftaran();">Batal</button>'+
    '<button class="btn btn-warning" onclick="openStatusWorkflowModal('+i+')" title="Buka Workflow Detail"><i class="fas fa-exchange-alt"></i> Workflow</button>'+
    '<button class="btn btn-primary" onclick="saveEditPendaftaran('+i+')"><i class="fas fa-save"></i> Simpan</button>';
  openModal('detailModal');
}
function saveEditPendaftaran(i){
  var r=_allPendaftaran[i],data={};
  // Collect all fields from the edit form
  Object.keys(r).forEach(function(k){var el=document.getElementById('editReg_'+k.replace(/[^a-zA-Z0-9]/g,'_'));if(el)data[k]=el.value;});
  
  // ✅ PERBAIKAN KRITIS: Pastikan catatan_admin selalu dikumpulkan (meskipun tidak ada di r)
  var catatanEl=document.getElementById('editReg_catatan_admin');
  if(catatanEl){
    data.catatan_admin=catatanEl.value;
    console.log('[saveEdit] ✅ catatan_admin collected:', data.catatan_admin);
  } else {
    console.log('[saveEdit] ⚠️ catatan_admin element not found');
  }
  
  console.log('[saveEdit] Data keys:', Object.keys(data));
  showLoading('Menyimpan...');callServer('updatePendaftaran',{idx:i,data:data}).then(function(res){hideLoading();closeModal('detailModal');showToast(res.message,res.success?'success':'error');if(res.success)loadPendaftaran();resetDetailFooter();}).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}
function resetDetailFooter(){document.getElementById('detailModal').querySelector('.modal-footer').innerHTML='<button class="btn btn-secondary" onclick="closeModal(\'detailModal\')">Tutup</button>';}
