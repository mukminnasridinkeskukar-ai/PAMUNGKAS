/* ============================================================
   PAMUNGKAS — MODUL CEK SERTIFIKAT (+ CRUD Admin)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/10-cek-sertifikat.js
   ============================================================ */

/* ========== CEK SERTIFIKAT (Public Table) ========== */
function loadCekSertifikat(){
  showLoading('Memuat data sertifikat...');
  callServer('getSertifikat').then(function(res){
    hideLoading();if(!res||!res.success){showToast(res?res.message:'Gagal memuat sertifikat','error');return;}
    _allSertifikat=res.data||[];renderCekSertifikat(_allSertifikat);
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}
function _getSertField(r,keys){
  for(var i=0;i<keys.length;i++){var v=r[keys[i]];if(v&&String(v).trim())return String(v).trim();}
  return '-';
}
function renderCekSertifikat(data){
  var tb=document.getElementById('cekSertBody'),hd=document.getElementById('cekSertHead'),em=document.getElementById('cekSertEmpty');
  hd.innerHTML='<tr><th>No</th><th>Nomor Sertifikat</th><th>Nama Penerima</th><th>Judul Pelatihan</th><th>Tanggal Terbit</th><th>Link Sertifikat</th></tr>';
  if(!data.length){tb.innerHTML='';em.style.display='block';return;}em.style.display='none';
  tb.innerHTML='';
  data.forEach(function(r,i){
    var nomor=_getSertField(r,['Nomor Sertifikat','Nomor_Sertifikat']);
    var nama=_getSertField(r,['Nama Penerima','Nama_Penerima']);
    var pelatihan=_getSertField(r,['Judul Pelatihan','Pelatihan','Judul_Pelatihan']);
    var tgl=_getSertField(r,['Tanggal Terbit','Tanggal_Terbit','Tanggal']);
    var link=_getSertField(r,['Link Sertifikat','Link_Sertifikat','Link','Link/File']);
    var linkHtml=(link!=='-')?'<a href="'+escHTML(link)+'" target="_blank" class="cek-link"><i class="fas fa-external-link-alt"></i> Lihat</a>':'<span class="cek-no-link">Tidak ada</span>';
    var tr=document.createElement('tr');
    tr.innerHTML='<td data-label="No">'+(i+1)+'</td><td data-label="Nomor Sertifikat" class="cek-nomor">'+escHTML(nomor)+'</td><td data-label="Nama Penerima" class="cek-nama">'+escHTML(nama)+'</td><td data-label="Judul Pelatihan">'+escHTML(pelatihan)+'</td><td data-label="Tanggal Terbit">'+escHTML(tgl)+'</td><td data-label="Link Sertifikat">'+linkHtml+'</td>';
    tb.appendChild(tr);
  });
}
function filterCekSertifikat(){var el=document.getElementById('searchSertNama');if(!el)return;var q=el.value.toLowerCase();var f=_allSertifikat.filter(function(r){var nama=_getSertField(r,['Nama Penerima','Nama_Penerima']).toLowerCase();return nama.indexOf(q)!==-1;});renderCekSertifikat(f);}

/* ---------- SERTIFIKAT CRUD (ADMIN) ---------- */
/* ========== SERTIFIKAT CRUD (Admin) ========== */
function openSertifikatForm(idx){document.getElementById('sertEditIndex').value=idx!==undefined?idx:-1;document.getElementById('sertifikatFormTitle').textContent=idx!==undefined?'Edit Sertifikat':'Tambah Sertifikat';if(idx!==undefined){var r=_allSertifikat[idx];document.getElementById('sertNomor').value=r.Nomor_Sertifikat||'';document.getElementById('sertPenerima').value=r.Nama_Penerima||'';document.getElementById('sertPelatihan').value=r.Pelatihan||'';document.getElementById('sertTanggal').value=r.Tanggal_Terbit||'';}else{document.getElementById('sertifikatForm').reset();}openModal('sertifikatFormModal');}
function submitSertifikat(e){e.preventDefault();var idx=parseInt(document.getElementById('sertEditIndex').value);var data={'Nomor Sertifikat':document.getElementById('sertNomor').value,'Nama Penerima':document.getElementById('sertPenerima').value,Pelatihan:document.getElementById('sertPelatihan').value,'Tanggal Terbit':document.getElementById('sertTanggal').value};
  showLoading('Menyimpan...');
  var done=function(res){hideLoading();closeModal('sertifikatFormModal');showToast(res.message,res.success?'success':'error');if(res.success){_allSertifikat=[];if(typeof loadAdminSertifikat==='function')loadAdminSertifikat();}};
  var fail=function(e){hideLoading();showToast('Error: '+(e.message||e),'error');};
  if(idx>=0)callServer('updateSertifikat',{idx:idx,data:data}).then(done).catch(fail);
  else callServer('tambahSertifikat',data).then(done).catch(fail);
}
