/* ============================================================
   PAMUNGKAS — MODUL PENGUMUMAN
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/07-pengumuman.js
   ============================================================ */

/* ========== PENGUMUMAN ========== */
function loadPengumuman(){
  showLoading('Memuat pengumuman...');
  callServer('getPengumuman').then(function(res){
    hideLoading();
    if(!res||!res.success){showToast(res?res.message:'Gagal memuat pengumuman','error');return;}
    _allPengumuman=res.data||[];renderPengumuman(_allPengumuman);showAdminButtons();
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}
function renderPengumuman(data){
  // NULL-SAFE: Check elements exist before accessing
  var g=document.getElementById('pengumumanGrid');
  var em=document.getElementById('pengumumanEmpty');
  
  if(!g){console.error('[Pengumuman] #pengumumanGrid not found!');return;}
  
  g.innerHTML='';
  
  // Handle empty data safely
  if(!data||!data.length){
    if(em)em.style.display='block';
    else console.warn('[Pengumuman] #pengumumanEmpty not found');
    return;
  }
  
  if(em)em.style.display='none';
  
  data.forEach(function(r,i){
    var d=document.createElement('div');d.className='ann-card';d.setAttribute('data-index',i);
    d.innerHTML='<div class="ann-card-header"><h4>'+escHTML(r.Judul||'-')+'</h4><span class="status-badge '+statusClass(r.Status)+'">'+escHTML(r.Status||'-')+'</span></div><div class="ann-card-body">'+escHTML(r.Isi||'-')+'</div><div class="ann-card-meta"><span><i class="fas fa-calendar-alt"></i> '+(r.Tanggal||'-')+'</span><span><i class="fas fa-hashtag"></i> '+(r.ID||'-')+'</span></div><div class="ann-card-actions"><button class="btn btn-sm btn-primary" onclick="openDetailModal(\'Detail Pengumuman\',_allPengumuman['+i+'])"><i class="fas fa-eye"></i> Detail</button>'+(canWrite('pengumuman')?'<button class="btn btn-sm btn-warning" onclick="editPengumuman('+i+')"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-sm btn-danger" onclick="confirmDelete(\'Pengumuman\','+i+')"><i class="fas fa-trash"></i> Hapus</button>':'')+'</div>';
    g.appendChild(d);
  });
  
  console.log('[Pengumuman] Rendered', data.length, 'items');
}
function filterPengumuman(){var q=document.getElementById('searchPengumuman').value.toLowerCase();var f=_allPengumuman.filter(function(r){return(r.Judul||'').toLowerCase().indexOf(q)!==-1||(r.Isi||'').toLowerCase().indexOf(q)!==-1;});renderPengumuman(f);}
function openPengumumanForm(idx){document.getElementById('pengumumanEditIndex').value=idx!==undefined?idx:-1;document.getElementById('pengumumanFormTitle').textContent=idx!==undefined?'Edit Pengumuman':'Tambah Pengumuman';if(idx!==undefined){var r=_allPengumuman[idx];document.getElementById('annJudul').value=r.Judul||'';document.getElementById('annIsi').value=r.Isi||'';document.getElementById('annTanggal').value=r.Tanggal||'';document.getElementById('annStatus').value=r.Status||'Aktif';}else{document.getElementById('pengumumanForm').reset();document.getElementById('annTanggal').value=new Date().toISOString().split('T')[0];}openModal('pengumumanFormModal');}
function editPengumuman(i){openPengumumanForm(i);}
function submitPengumuman(e){e.preventDefault();var idx=parseInt(document.getElementById('pengumumanEditIndex').value);var data={Judul:document.getElementById('annJudul').value,Isi:document.getElementById('annIsi').value,Tanggal:document.getElementById('annTanggal').value,Status:document.getElementById('annStatus').value};
  showLoading('Menyimpan...');
  var done=function(res){hideLoading();closeModal('pengumumanFormModal');showToast(res.message,res.success?'success':'error');if(res.success)loadPengumuman();};
  var fail=function(e){hideLoading();showToast('Error: '+(e.message||e),'error');};
  if(idx>=0)callServer('updatePengumuman',{idx:idx,data:data}).then(done).catch(fail);
  else callServer('tambahPengumuman',data).then(done).catch(fail);
}
