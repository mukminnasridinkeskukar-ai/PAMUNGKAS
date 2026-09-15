/* ============================================================
   PAMUNGKAS — DASHBOARD (IKP, Kartu Statistik, Tabel Pendaftar)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/06-dashboard.js
   ============================================================ */

/* ========== DASHBOARD ========== */
function loadDashboard(){
  console.log('[Dashboard] Loading dashboard data...');
  showLoading('Memuat data dashboard...');
  
  callServer('getDashboardData').then(function(res){
    hideLoading();
    
    console.log('[Dashboard] Response:', res ? (res.success ? 'SUCCESS' : 'FAILED') : 'NULL');
    
    if(!res||!res.success){
      console.error('[Dashboard] Error:', res ? res.message : 'No response');
      showToast(res?res.message:'Data tidak tersedia. Pastikan koneksi database.','error');
      renderEmptyDashboard();
      return;
    }
    
    var data=res.data;
    console.log('[Dashboard] Data received:', {
      indikator: (data.indikator||[]).length,
      summary: data.summary,
      pendaftaran: (data.allPendaftaran||[]).length,
      sdmk: (data.allSdmk||[]).length,
      recent: (data.recentRegistrations||[]).length
    });
    
    renderIKP(data.indikator||[]);
    renderStatCards(data.summary||{});
    _dashAllPendaftaran=data.allPendaftaran||[];
    _dashAllSdmk=data.allSdmk||[];
    renderDashboardTable(data.recentRegistrations||[]);
    
    console.log('[Dashboard] Dashboard loaded successfully');
  }).catch(function(e){
    hideLoading();
    console.error('[Dashboard] Load error:', e);
    console.warn('[Dashboard] Using fallback data due to error');
    showToast('Menggunakan data default. Error: '+(e.message||e),'warning');
    // Use fallback data instead of empty dashboard
    renderIKP([]); // Empty array triggers fallback to IKP_DATA
    renderStatCards({});
    renderDashboardTable([]);
  });
}
/* ========== INDIKATOR KINERJA PROGRAM ========== */
/*
 * DATA CAPAIAN - Fallback/Default data
 * Data aktual diambil dari Nhost GraphQL (tabel: indikator)
 * Jika Nhost kosong/error, data default ini yang ditampilkan (fallback)
 * ================================================ */
var IKP_DATA = [
  // Fallback data - akan diganti dengan data dari Nhost jika tersedia
  // Sesuai struktur tabel indikator: id | label/nama | value/nilai | target | unit/satuan
  {id:'1', label:'Jumlah SDMK Dinas Kesehatan', value:2284, target:3200, unit:' Orang', barClass:'ikp-bar-1', valueClass:'ikp-value-1', icon:'fa-hospital', source:'Default'},
  {id:'2', label:'Jumlah SDMK yang Dilatih', value:30, target:2240, unit:' Orang', barClass:'ikp-bar-2', valueClass:'ikp-value-2', icon:'fa-user-graduate', source:'Default'},
  {id:'3', label:'Jumlah SDMK Yang Dilatih sesuai Kompetensinya', value:30, target:350, unit:' Orang', barClass:'ikp-bar-3', valueClass:'ikp-value-3', icon:'fa-user-check', source:'Default'},
  {id:'4', label:'Persentase SDMK yang mendapat peningkatan kompetensi', value:1.34, target:70, unit:' Persen', barClass:'ikp-bar-1', valueClass:'ikp-value-1', icon:'fa-percentage', source:'Default'},
  {id:'5', label:'Persentase SDMK yang dilatih sesuai Kompetensinya', value:1.91, target:100, unit:' Persen', barClass:'ikp-bar-2', valueClass:'ikp-value-2', icon:'fa-chart-pie', source:'Default'}
];

/**
 * Normalize IKP data from various sources (Nhost or fallback)
 * Ensures consistent structure for rendering
 */
function normalizeIKPData(data = []) {
  if (!Array.isArray(data)) {
    console.warn('[IKP] normalizeIKPData: Input bukan array, mengembalikan array kosong');
    return [];
  }
  
  return data.map((item, index) => ({
    id: item.id || item.ID || String(index + 1),
    label: item.label || item.Label || item.nama || item.Nama || item.Indikator || item.indikator || 'Indikator',
    value: item.value || item.Value || item.nilai || item.Nilai || item.capai || 0,
    target: item.target || item.Target || item.target_capai || 100,
    unit: item.unit || item.Unit || item.satuan || item.Satuan || '',
    barClass: item.barClass || ['ikp-bar-1', 'ikp-bar-2', 'ikp-bar-3'][index % 3],
    valueClass: item.valueClass || ['ikp-value-1', 'ikp-value-2', 'ikp-value-3'][index % 3],
    icon: item.icon || item.Icon || ['fa-hospital', 'fa-user-graduate', 'fa-user-check', 'fa-percentage', 'fa-chart-pie'][index % 5],
    source: item.source || 'Nhost',
    desc: item.desc || item.deskripsi || item.Deskripsi || '-',
    _index: index
  }));
}

function renderIKP(indikatorData){
  var g=document.getElementById('ikpGrid');
  if(!g){
    console.warn('[IKP] Element #ikpGrid tidak ditemukan');
    return;
  }
  
  console.log('[IKP] Loading data from Nhost...');
  console.log('[IKP] Raw input data:', indikatorData ? indikatorData.length : 0, 'items');
  
  // Determine final data source: Nhost data or fallback
  var nhostData = (indikatorData && Array.isArray(indikatorData) && indikatorData.length > 0) 
    ? indikatorData 
    : [];
  
  console.log('[IKP] Nhost data count:', nhostData.length);
  console.log('[IKP] DataSource fallback count:', IKP_DATA.length);
  
  // Use Nhost data if available, otherwise use fallback
  var finalData = nhostData.length > 0 ? nhostData : IKP_DATA;
  
  console.log('[IKP] Final data count:', finalData.length);
  console.log('[IKP] Final data source:', nhostData.length > 0 ? 'Nhost' : 'Fallback');
  
  // Normalize data for consistent rendering
  var normalizedData = normalizeIKPData(finalData);
  
  if (normalizedData.length === 0) {
    console.warn('[IKP] Tidak ada data untuk dirender (Nhost & fallback kosong)');
    g.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>Belum ada data indikator</p></div>';
    return;
  }
  
  console.log('[IKP] Rendering IKP...', normalizedData.length, 'items');
  
  var html='';
  normalizedData.forEach(function(item, idx){ // ✅ FIX: idx didefinisikan sebagai parameter kedua
    // Data sudah dinormalisasi oleh normalizeIKPData(), gunakan langsung
    var rawVal = item.value;
    var rawTgt = item.target;
    var ikpUnit = String(item.unit || '').toLowerCase();
    
    // Parse numbers - handle Indonesian comma format
    var numVal=parseFloat(String(rawVal).trim().replace(/\s/g,'').replace(',','.'))||0;
    var numTgt=parseFloat(String(rawTgt).trim().replace(/\s/g,'').replace(',','.'))||100;
    
    // For percentage units, calculate differently
    if(ikpUnit.indexOf('persen')!==-1 || ikpUnit.indexOf('%')!==-1){
      // For percentages, pct is the actual value, capped at target
      var pct=Math.min(numVal, numTgt);
      // Format value with decimal if needed
      numVal = numVal % 1 === 0 ? numVal : numVal.toFixed(2);
    } else {
      // For counts, calculate percentage of target achieved
      var pct=numTgt>0?Math.min((numVal/numTgt)*100,100):0;
    }
    html+='<div class="ikp-card" onclick="openIKPPopup(\''+escHTML(item.label)+'\', \''+escHTML(String(item.value))+'\', \''+escHTML(String(item.target))+'\', \''+escHTML(item.unit)+'\', \''+escHTML(item.source)+'\', \''+escHTML(item.desc)+'\')" title="Klik untuk detail">';
    html+='<div class="ikp-card-num">'+String(item.id).replace(/\w/g,function(c,i){return i===0?c.toUpperCase():'';}).substring(0,3)+'</div>';
    // Use pre-normalized fields - no need for fallback logic here
    var ikpLabel = item.label;
    var ikpIcon = item.icon || ['fa-hospital','fa-user-graduate','fa-user-check','fa-percentage','fa-chart-pie'][idx % 5];
    html+='<div class="ikp-card-label"><i class="fas '+ikpIcon+'"></i><span>'+ikpLabel+'</span></div>';
    html+='<div class="ikp-bar-wrap"><div class="ikp-bar '+(item.barClass||'ikp-bar-1')+'" style="width:0%" data-target="'+pct+'"></div></div>';
    html+='<div class="ikp-card-footer"><div class="ikp-value '+(item.valueClass||'ikp-value-1')+'">'+numVal+(item.unit||'')+'</div><div class="ikp-target">Target: '+(item.target||0)+(item.unit||'')+'</div></div>';
    html+='</div>';
  });
  g.innerHTML=html;
  // Animate bars after render
  setTimeout(function(){
    var bars=g.querySelectorAll('.ikp-bar');
    bars.forEach(function(bar){
      var t=parseFloat(bar.getAttribute('data-target'))||0;
      bar.style.width=t+'%';
    });
  },80);
}

var _dashAllPendaftaran=[];
var _dashAllSdmk=[];
function _getColVal(row,colNames){
  for(var i=0;i<colNames.length;i++){var v=row[colNames[i]];if(v!==undefined&&v!=='')return v;}
  return '';
}
function openStatPopup(card){
  var title=card.label;
  var rows=[];
  var src=card.src||'';
  var displayCols=[];
  if(src==='sdmk'||src==='sdmk-exclude'){
    var data=_dashAllSdmk||[];
    var colNames=['Jenis Profesi','Profesi'];
    if(src==='sdmk-exclude'&&card.excludeVals){
      var exVals=card.excludeVals.map(function(v){return v.toLowerCase();});
      rows=data.filter(function(r){
        var prof=(_getColVal(r,colNames)||'').toLowerCase();
        for(var i=0;i<exVals.length;i++){if(prof.indexOf(exVals[i])!==-1)return false;}
        return true;
      });
    } else if(card.filterCol){
      var fColNames=[card.filterCol];
      var fVal=(card.filterVal||'').toLowerCase();
      rows=data.filter(function(r){return (_getColVal(r,fColNames)||'').toLowerCase().indexOf(fVal)!==-1;});
    } else {
      rows=data;
    }
    displayCols=[{h:'Nama',k:['Nama','Nama Lengkap dengan Gelar']},{h:'Profesi',k:['Jenis Profesi','Profesi']},{h:'Unit Kerja',k:['Unit Kerja','Unit_Kerja','Unit']},{h:'Pekerjaan',k:['Pekerjaan','Status Pekerjaan','Status_Pekerjaan']},{h:'Kegiatan',k:['Judul Kegiatan','Judul Pelatihan']}];
  } else if(src==='pendaftaran'||src==='pendaftaran-exclude'){
    var data=_dashAllPendaftaran||[];
    if(src==='pendaftaran-exclude'&&card.excludeVals){
      var exVals=card.excludeVals.map(function(v){return v.toLowerCase();});
      var exColNames=[card.excludeCol];
      rows=data.filter(function(r){
        var val=(_getColVal(r,exColNames)||'').toLowerCase();
        for(var i=0;i<exVals.length;i++){if(val.indexOf(exVals[i])!==-1)return false;}
        return true;
      });
    } else if(card.filterCol){
      var fColNames=[card.filterCol];
      var fVal=(card.filterVal||'').toLowerCase();
      rows=data.filter(function(r){return (_getColVal(r,fColNames)||'').toLowerCase().indexOf(fVal)!==-1;});
    } else {
      rows=data;
    }
    displayCols=[{h:'Nama',k:['Nama Lengkap dengan Gelar','Nama']},{h:'Profesi',k:['Jenis Profesi','Profesi']},{h:'Pekerjaan',k:['Pekerjaan','Status Pekerjaan','Status_Pekerjaan']},{h:'Kegiatan',k:['Judul Kegiatan','Judul Pelatihan']}];
  } else if(src==='sertifikat'){
    displayCols=[{h:'Nama',k:['Nama Penerima','Nama']},{h:'No. Sertifikat',k:['No. Sertifikat','Nomor Sertifikat']},{h:'Pelatihan',k:['Nama Pelatihan','Judul Kegiatan']}];
  } else if(src==='pengumuman'){
    displayCols=[{h:'Judul',k:['Judul','Title']},{h:'Tanggal',k:['Tanggal','Date']}];
  }
  var countEl=rows.length;
  document.getElementById('statPopupTitle').innerHTML=title+' <span class="sp-count" style="color:var(--primary)">('+countEl+' data)</span>';
  var body=document.getElementById('statPopupBody');
  // DEBUG: Show info about why data might be empty
    console.log('[StatPopup] Source:', src);
    console.log('[StatPopup] FilterCol:', card.filterCol, 'FilterVal:', card.filterVal);
    console.log('[StatPopup] Total data available:', src.indexOf('sdmk')!==-1?(_dashAllSdmk||[]).length:(src.indexOf('pendaftaran')!==-1?(_dashAllPendaftaran||[]).length:0));
    console.log('[StatPopup] Rows found:', rows.length);
    
    if(!rows.length){
      // If filtered but no results, try showing all data for this source
      var allData = [];
      if(src==='sdmk'||src==='sdmk-exclude'){allData=_dashAllSdmk||[];}
      else if(src==='pendaftaran'||src==='pendaftaran-exclude'){allData=_dashAllPendaftaran||[];}
      
      if(allData.length > 0 && (card.filterCol || card.excludeVals)){
        // Has data but filter didn't match - show warning with option to see all
        body.innerHTML='<div style="padding:20px;text-align:center;">'+
          '<i class="fas fa-filter" style="font-size:2rem;color:var(--text-muted);margin-bottom:12px;display:block;"></i>'+
          '<p style="color:var(--text-secondary);margin-bottom:8px;">Tidak ada data dengan filter ini.</p>'+
          '<p style="font-size:0.82rem;color:var(--text-muted);">Total data tersedia: <strong>'+allData.length+'</strong> record</p>'+
          '<button onclick="this.parentElement.innerHTML=\'<p style=\'padding:20px;text-align:center;color:var(--text-muted);\'>Loading...</p>\';setTimeout(function(){showAllInPopup(\''+src+'\');},100);" '+
          'style="margin-top:12px;padding:8px 20px;background:var(--primary);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;">'+
          '<i class="fas fa-list"></i> Tampilkan Semua Data</button></div>';
      } else {
        body.innerHTML='<div class="stat-popup-empty"><i class="fas fa-inbox"></i><p>Tidak ada data.</p></div>';
      }
    }
  else{
    var html='<table class="stat-popup-table"><thead><tr><th>No</th>';
    displayCols.forEach(function(c){html+='<th>'+escHTML(c.h)+'</th>';});
    html+='</tr></thead><tbody>';
    var show=rows.slice(0,200);
    show.forEach(function(r,idx){
      html+='<tr><td>'+(idx+1)+'</td>';
      displayCols.forEach(function(c){
        html+='<td>'+escHTML(_getColVal(r,c.k)||'-')+'</td>';
      });
      html+='</tr>';
    });
    html+='</tbody></table>';
    if(rows.length>200) html+='<div style="padding:10px 14px;text-align:center;color:var(--text-muted);font-size:.8rem;">Menampilkan 200 dari '+rows.length+' data</div>';
    
    // Add data source information with timestamp
    var sourceLabel = '';
    var sourceTable = '';
    var sourceDesc = '';
    if(src==='sdmk'||src==='sdmk-exclude'){
      sourceLabel='Data SDMK (Tenaga Kesehatan Terlatih)';
      sourceTable='Tabel: sdmk';
      sourceDesc='Database tenaga kesehatan yang telah mengikuti pelatihan';
    }
    else if(src==='pendaftaran'||src==='pendaftaran-exclude'){
      sourceLabel='Data Pendaftaran Pelatihan';
      sourceTable='Tabel: pendaftaran';
      sourceDesc='Data pendaftar pelatihan SDMK dari Nhost/Hasura';
    }
    else if(src==='sertifikat'){sourceLabel='Data Sertifikat';sourceTable='Tabel: sertifikat';sourceDesc='Sertifikat pelatihan yang telah diterbitkan';}
    else if(src==='pengumuman'){sourceLabel='Data Pengumuman';sourceTable='Tabel: pengumuman';sourceDesc='Pengumuman resmi sistem';}
    else{sourceLabel='Data Dashboard';sourceTable='Nhost PostgreSQL via Hasura GraphQL';sourceDesc='Data real-time dari database Nhost';}
    
    var now = new Date();
    var timeStr = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    
    html+='<div style="margin-top:14px;padding:14px 16px;background:#F0F9FF;border-left:4px solid #0D6EFD;border-radius:0 8px 8px 0;">';
    html+='<div style="display:flex;align-items:flex-start;gap:12px;">';
    html+='<i class="fas fa-database" style="color:#0D6EFD;font-size:1.2rem;margin-top:2px;"></i>';
    html+='<div style="flex:1;">';
    html+='<div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">📊 Sumber Data</div>';
    html+='<div style="font-size:0.9rem;color:var(--text-primary);font-weight:700;">'+sourceLabel+'</div>';
    html+='<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;"><i class="fas fa-table" style="margin-right:4px;"></i>'+sourceTable+'</div>';
    if(sourceDesc){
      html+='<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;font-style:italic;">'+sourceDesc+'</div>';
    }
    html+='<div style="font-size:0.72rem;color:#059669;margin-top:6px;"><i class="fas fa-sync-alt" style="margin-right:4px;"></i>Diperbarui: '+timeStr+'</div>';
    html+='</div></div></div>';
    
    body.innerHTML=html;
  }
  var statPopup = document.getElementById('statPopupOverlay');
  if (statPopup) statPopup.classList.add('active');
  else console.warn('[DOM] openStatPopup: #statPopupOverlay tidak ditemukan');
  document.body.style.overflow='hidden';
}
function closeStatPopup(){
  var overlay = document.getElementById('statPopupOverlay');
  if (overlay) overlay.classList.remove('active');
  else console.warn('[DOM] closeStatPopup: #statPopupOverlay tidak ditemukan');
  document.body.style.overflow = '';
}

/* ========== SHOW ALL DATA IN POPUP (Fallback) ========== */
function showAllInPopup(src){
  var body = document.getElementById('statPopupBody');
  var data = [];
  var displayCols = [];
  var titleText = '';
  
  if(src==='sdmk'||src==='sdmk-exclude'){
    data = _dashAllSdmk || [];
    displayCols = [
      {h:'Nama',k:['Nama','Nama Lengkap dengan Gelar']},
      {h:'Profesi',k:['Jenis Profesi','Profesi']},
      {h:'Unit Kerja',k:['Unit Kerja','Unit_Kerja','Unit']},
      {h:'Pekerjaan',k:['Pekerjaan','Status Pekerjaan','Status_Pekerjaan']},
      {h:'Kegiatan',k:['Judul Kegiatan','Judul Pelatihan']}
    ];
    titleText = 'Semua Data SDMK';
  } else if(src==='pendaftaran'||src==='pendaftaran-exclude'){
    data = _dashAllPendaftaran || [];
    displayCols = [
      {h:'Nama',k:['Nama Lengkap dengan Gelar','Nama']},
      {h:'Profesi',k:['Jenis Profesi','Profesi']},
      {h:'Pekerjaan',k:['Pekerjaan','Status Pekerjaan','Status_Pekerjaan']},
      {h:'Kegiatan',k:['Judul Kegiatan','Judul Pelatihan']}
    ];
    titleText = 'Semua Data Pendaftar';
  } else {
    body.innerHTML = '<div class="stat-popup-empty"><p>Tidak ada data.</p></div>';
    return;
  }
  
  document.getElementById('statPopupTitle').innerHTML = titleText + ' <span style="color:var(--primary)">(' + data.length + ' data)</span>';
  
  if(!data.length){
    body.innerHTML = '<div class="stat-popup-empty"><i class="fas fa-inbox"></i><p>Tidak ada data tersedia.</p></div>';
    return;
  }
  
  var html = '<table class="stat-popup-table"><thead><tr><th>No</th>';
  displayCols.forEach(function(c){ html += '<th>' + escHTML(c.h) + '</th>'; });
  html += '</tr></thead><tbody>';
  
  var showData = data.slice(0, 200);
  showData.forEach(function(r, idx){
    html += '<tr><td>' + (idx+1) + '</td>';
    displayCols.forEach(function(c){
      var val = '-';
      for(var i=0; i<c.k.length; i++){
        if(r[c.k[i]] !== undefined && r[c.k[i]] !== ''){
          val = r[c.k[i]];
          break;
        }
      }
      html += '<td>' + escHTML(val) + '</td>';
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  if(data.length > 200){
    html += '<div style="padding:10px 14px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Menampilkan 200 dari ' + data.length + ' data</div>';
  }
  
  // Enhanced source info with timestamp
  var srcLabel = '', srcTable = '', srcDesc = '';
  if(src.indexOf('sdmk')!==-1){
    srcLabel='Data SDMK (Tenaga Kesehatan Terlatih)';
    srcTable='Tabel: sdmk';
    srcDesc='Database tenaga kesehatan yang telah mengikuti pelatihan';
  } else {
    srcLabel='Data Pendaftaran Pelatihan';
    srcTable='Tabel: pendaftaran';
    srcDesc='Data pendaftar pelatihan SDMK dari Nhost/Hasura';
  }
  
  var now = new Date();
  var timeStr = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  
  html += '<div style="margin-top:14px;padding:14px 16px;background:#F0F9FF;border-left:4px solid #0D6EFD;border-radius:0 8px 8px 0;">';
  html += '<div style="display:flex;align-items:flex-start;gap:12px;">';
  html += '<i class="fas fa-database" style="color:#0D6EFD;font-size:1.2rem;margin-top:2px;"></i>';
  html += '<div style="flex:1;">';
  html += '<div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">📊 Sumber Data</div>';
  html += '<div style="font-size:0.9rem;color:var(--text-primary);font-weight:700;">'+srcLabel+'</div>';
  html += '<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;"><i class="fas fa-table" style="margin-right:4px;"></i>'+srcTable+'</div>';
  html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;font-style:italic;">'+srcDesc+'</div>';
  html += '<div style="font-size:0.72rem;color:#059669;margin-top:6px;"><i class="fas fa-sync-alt" style="margin-right:4px;"></i>Diperbarui: '+timeStr+'</div>';
  html += '</div></div></div>';
  
  body.innerHTML = html;
}

/* ========== IKP POPUP - Detail Indikator Kinerja Program ========== */
function openIKPPopup(label, value, target, unit, source, desc){
  var overlay = document.getElementById('statPopupOverlay');
  var title = document.getElementById('statPopupTitle');
  var body = document.getElementById('statPopupBody');
  
  title.innerHTML = '<i class="fas fa-chart-line" style="color:var(--primary);margin-right:8px;"></i> ' + label;
  
  var pct = target > 0 ? Math.min((parseFloat(value) / parseFloat(target)) * 100, 100) : 0;
  var barColor = pct >= 80 ? '#059669' : pct >= 50 ? '#F59E0B' : '#EF4444';
  
  var html = '';
  html += '<div style="padding:20px;">';
  html += '<div style="background:var(--primary-light);border-radius:12px;padding:20px;margin-bottom:16px;text-align:center;">';
  html += '<div style="font-size:2.5rem;font-weight:800;color:var(--primary);">' + value + unit + '</div>';
  html += '<div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">Capaian Saat Ini</div>';
  html += '</div>';
  
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';
  html += '<div style="background:#F8FAFC;border-radius:10px;padding:14px;text-align:center;">';
  html += '<div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Target</div>';
  html += '<div style="font-size:1.3rem;font-weight:700;color:var(--text-primary);">' + target + unit + '</div>';
  html += '</div>';
  html += '<div style="background:#F8FAFC;border-radius:10px;padding:14px;text-align:center;">';
  html += '<div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Persentase</div>';
  html += '<div style="font-size:1.3rem;font-weight:700;color:' + barColor + ';">' + pct.toFixed(1) + '%</div>';
  html += '</div>';
  html += '</div>';
  
  // Progress bar
  html += '<div style="margin-bottom:16px;">';
  html += '<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">';
  html += '<span>Progress Capaian</span>';
  html += '<span>' + pct.toFixed(1) + '%</span>';
  html += '</div>';
  html += '<div style="height:12px;background:#E2E8F0;border-radius:6px;overflow:hidden;">';
  html += '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + barColor + ',' + (barColor === '#059669' ? '#10B981' : barColor === '#F59E0B' ? '#FBBF24' : '#F87171') + ');border-radius:6px;transition:width 0.5s ease;"></div>';
  html += '</div>';
  html += '</div>';
  
  // Data source info
  html += '<div style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;padding:14px;margin-bottom:12px;">';
  html += '<div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;"><i class="fas fa-database" style="margin-right:4px;"></i>Sumber Data</div>';
  html += '<div style="font-size:0.9rem;color:var(--text-primary);font-weight:600;">' + (source === 'Default' ? 'Data Fallback (Tabel indikator kosong/tidak tersedia di Nhost)' : 'Nhost - Tabel: indikator') + '</div>';  // ✅ Updated from Google Sheet references
  html += '</div>';
  
  if(desc && desc !== '-'){
    html += '<div style="background:#F0F9FF;border-left:4px solid #0D6EFD;border-radius:0 8px 8px 0;padding:14px;">';
    html += '<div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Keterangan</div>';
    html += '<div style="font-size:0.85rem;color:var(--text-primary);">' + desc + '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  
  body.innerHTML = html;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}


function renderStatCards(s){
  var g=document.getElementById('statsGrid');
  
  // Safety: return if element not found
  if(!g){console.error('[Dashboard] #statsGrid not found!');return;}
  
  var cards=[
    {icon:'fa-user-md',label:'Total SDMK',value:s.totalSDMK||0,hint:'Tenaga kesehatan terlatih',color:'var(--primary)',src:'sdmk'},
    {icon:'fa-clipboard-list',label:'Total Pendaftar',value:s.totalPendaftar||0,hint:'Pendaftaran pelatihan',color:'var(--secondary)',src:'pendaftaran'},
    {icon:'fa-certificate',label:'Sertifikat Terbit',value:s.totalSertifikat||0,hint:'Sertifikat yang telah diterbitkan',color:'var(--accent)',src:'sertifikat'},
    {icon:'fa-bullhorn',label:'Pengumuman',value:s.totalPengumuman||0,hint:'Pengumuman aktif',color:'#8B5CF6',src:'pengumuman'},
    {icon:'fa-user-md',label:'Dokter',value:s.dokter||0,hint:'Tenaga medis dokter',color:'#EC4899',src:'sdmk',filterCol:'Jenis Profesi',filterVal:'dokter'},
    {icon:'fa-user-nurse',label:'Perawat',value:s.perawat||0,hint:'Tenaga keperawatan',color:'#06B6D4',src:'sdmk',filterCol:'Jenis Profesi',filterVal:'perawat'},
    {icon:'fa-baby',label:'Bidan',value:s.bidan||0,hint:'Tenaga kebidanan',color:'#F59E0B',src:'sdmk',filterCol:'Jenis Profesi',filterVal:'bidan'},
    {icon:'fa-pills',label:'Nakes Lainnya',value:s.nakesLainnya||0,hint:'Tenaga kesehatan lainnya',color:'#10B981',src:'sdmk-exclude',excludeVals:['dokter','perawat','bidan'],excludeCol:'Jenis Profesi'},
    {icon:'fa-building',label:'PNS',value:s.pns||0,hint:'Pegawai Negeri Sipil',color:'#3B82F6',src:'pendaftaran',filterCol:'Pekerjaan',filterVal:'pns'},
    {icon:'fa-file-contract',label:'PPPK',value:s.pppk||0,hint:'Pegawai Pemerintah dengan Perjanjian Kerja',color:'#8B5CF6',src:'pendaftaran',filterCol:'Pekerjaan',filterVal:'pppk'},
    {icon:'fa-handshake',label:'Non ASN',value:s.nonAsn||0,hint:'Selain PNS dan PPPK',color:'#F97316',src:'pendaftaran-exclude',excludeVals:['pns','pppk'],excludeCol:'Pekerjaan'},
    {icon:'fa-mars',label:'Laki-laki',value:s.laki||0,hint:'Jenis kelamin laki-laki',color:'#0EA5E9',src:'pendaftaran',filterCol:'Jenis Kelamin',filterVal:'laki'},
    {icon:'fa-venus',label:'Perempuan',value:s.perempuan||0,hint:'Jenis kelamin perempuan',color:'#EC4899',src:'pendaftaran',filterCol:'Jenis Kelamin',filterVal:'perempuan'}
  ];
  
  g.innerHTML='';
  g.style.display='grid';
  g.style.gridTemplateColumns='repeat(auto-fill,minmax(180px,1fr))';
  g.style.gap='14px';
  
  cards.forEach(function(c){
    var d=document.createElement('div');d.className='stat-card';
    d.style.borderTop='3px solid '+(c.color||'var(--primary)');
    d.innerHTML='<div class="stat-card-top"><div class="stat-card-icon" style="background:'+(c.color||'var(--primary)')+'15;color:'+(c.color||'var(--primary)')+'"><i class="fas '+c.icon+'"></i></div></div><div class="stat-card-value" style="color:'+(c.color||'var(--primary)')+'">'+c.value+'</div><div class="stat-card-label">'+c.label+'</div><div class="stat-card-hint"><i class="fas fa-database"></i> '+c.hint+'</div>';
    d.addEventListener('click',function(){openStatPopup(c);});
    g.appendChild(d);
  });
  
  console.log('[Dashboard] StatCards rendered:', cards.length, 'cards');
}
function renderDashboardTable(rows){
  const tb=document.getElementById('dashboardTableBody'),
        em=document.getElementById('dashboardTableEmpty'),
        st=document.getElementById('tableSubtitle');
  
  // Safety checks
  if(!tb){console.error('[Dashboard] #dashboardTableBody not found');return;}
  
  tb.innerHTML='';
  
  if(!rows||!rows.length){
    if(em)em.style.display='block';
    if(st)st.textContent='Tidak ada data pendaftaran';
    console.log('[Dashboard] No registration data to show');
    return;
  }
  
  if(em)em.style.display='none';
  if(st)st.textContent=rows.length+' data pendaftaran terakhir';

  const _driveThumb=function(url){if(!url||typeof url!=='string')return null;url=url.trim();if(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url))return url;let m=url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);if(m)return'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w200';m=url.match(/[?&]id=([a-zA-Z0-9_-]+)/);if(m)return'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w200';return null;};
  const _driveFull=function(url){if(!url)return'';let m=url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);if(m)return'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w800';m=url.match(/[?&]id=([a-zA-Z0-9_-]+)/);if(m)return'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w800';return url;};
  const _v=function(row,names){for(const n of names){if(row[n]!==undefined&&row[n]!=='')return row[n];}return'';};

  const fragment=document.createDocumentFragment();
  rows.forEach((r,i)=>{
    const tr=document.createElement('tr');
    const fotoRaw=_v(r,['Foto','Pas Foto','Pas_Foto','Photo','Link Foto','Foto Peserta']);
    const thumb=_driveThumb(fotoRaw);
    const nama=r['Nama Lengkap dengan Gelar']||r.Nama||'-';
    const unit=_v(r,['Unit Kerja','Unit_Kerja','Unit']);
    const profesi=r['Jenis Profesi']||r.Profesi||'-';
    const statusKerja=_v(r,['Pekerjaan','Status Pekerjaan']);
    const kegiatan=_v(r,['Judul Kegiatan','Judul Pelatihan','Kegiatan','Pelatihan','Nama Pelatihan']);
    const status=String(r.Status||'-');
    const sc=statusClass(status);

    let fotoHTML;
    if(thumb){
      const fullUrl=_driveFull(fotoRaw);
      const photoDiv=document.createElement('div');
      photoDiv.className='dash-photo';
      photoDiv.setAttribute('data-full',fullUrl);
      photoDiv.setAttribute('data-name',nama);
      const img=document.createElement('img');
      img.src=thumb;img.alt='Foto';img.loading='lazy';
      img.onerror=function(){this.parentElement.innerHTML='<i class="fas fa-user ph-icon"></i>';};
      photoDiv.appendChild(img);
      const tdFoto=document.createElement('td');
      tdFoto.appendChild(photoDiv);
      tr.appendChild(tdFoto);
    } else {
      tr.insertAdjacentHTML('beforeend','<td><div class="dash-photo"><i class="fas fa-user ph-icon"></i></div></td>');
    }

    tr.insertAdjacentHTML('beforeend',
      '<td class="dash-cell-nama">'+escHTML(nama)+'</td>'+
      '<td class="dash-cell-unit">'+escHTML(unit||'-')+'</td>'+
      '<td class="dash-cell-profesi">'+escHTML(profesi)+'</td>'+
      '<td>'+escHTML(statusKerja||'-')+'</td>'+
      '<td class="dash-cell-kegiatan">'+escHTML(kegiatan||'-')+'</td>'+
      '<td><span class="status-badge '+sc+'">'+escHTML(status)+'</span></td>'
    );

    tr.addEventListener('click',e=>{
      if(!e.target.closest('.dash-photo'))return;
      const ph=e.target.closest('.dash-photo');
      const fullUrl=ph.getAttribute('data-full');
      const phName=ph.getAttribute('data-name');
      if(fullUrl){
        const lb=document.getElementById('dashLightbox');
        document.getElementById('dashLightboxImg').src=fullUrl;
        document.getElementById('dashLightboxName').textContent=phName||'';
        lb.classList.add('active');
        document.body.style.overflow='hidden';
      }
    });

    fragment.appendChild(tr);
  });
  tb.appendChild(fragment);
}

function closeDashLightbox(){
  var lb = document.getElementById('dashLightbox');
  if (lb) lb.classList.remove('active');
  else console.warn('[DOM] closeDashLightbox: #dashLightbox tidak ditemukan');
  
  var lbImg = document.getElementById('dashLightboxImg');
  if (lbImg) lbImg.src = '';
  
  document.body.style.overflow = '';
}
function renderEmptyDashboard(){
  // Call renderIKP with empty array - it will use IKP_DATA fallback automatically
  renderIKP([]);  // ✅ FIX: Pass empty array to trigger fallback to IKP_DATA

  var g=document.getElementById('statsGrid');
  if(!g){console.error('[Dashboard] #statsGrid not found in renderEmptyDashboard');return;}
  
  var cards=[{icon:'fa-user-md',label:'Total SDMK Terlatih'},{icon:'fa-clipboard-list',label:'Total Pendaftar'},{icon:'fa-certificate',label:'Sertifikat Terbit'},{icon:'fa-bullhorn',label:'Pengumuman Aktif'}];
  g.innerHTML='';
  cards.forEach(function(c){var d=document.createElement('div');d.className='stat-card';d.style.cursor='default';d.innerHTML='<div class="stat-card-top"><div class="stat-card-icon"><i class="fas '+c.icon+'"></i></div></div><div class="stat-card-value">-</div><div class="stat-card-label">'+c.label+'</div><div class="stat-card-hint"><i class="fas fa-exclamation-triangle" style="color:var(--accent);"></i> Data tidak tersedia</div>';g.appendChild(d);});
  
  console.log('[Dashboard] Dashboard rendered with fallback data (IKP: 5 items, Stats: placeholder)');  // ✅ Updated log message
}


/* ========== DETAIL MODAL UMUM ========== */
function openDetailModal(title,content){
  document.getElementById('detailModalTitle').textContent=title;
  if(typeof content==='object'){
    var b='<div class="detail-grid">';
    Object.keys(content).forEach(function(k){
      var v=String(content[k]||'-');
      var kl=k.toLowerCase();
      // Foto column: show image
      if(kl.indexOf('foto')!==-1 && v!=='-' && v){
        var imgSrc=v;
        if(v.indexOf('drive.google.com')!==-1){
          var fid='';
          var fm=v.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if(fm)fid=fm[1];else{var fm2=v.match(/id=([a-zA-Z0-9_-]+)/);if(fm2)fid=fm2[1];}
          if(fid)imgSrc='https://drive.google.com/thumbnail?sz=w400&id='+fid;
        } else if(v.indexOf('http')!==0 && v.indexOf('lh3.googleusercontent.com')===-1){
          imgSrc='https://drive.google.com/thumbnail?sz=w400&id='+v;
        }
        b+='<div class="detail-item full"><label>'+escHTML(k)+'</label><div style="margin-top:6px;"><img src="'+escHTML(imgSrc)+'" style="max-width:200px;max-height:200px;object-fit:cover;border-radius:10px;border:2px solid var(--border-color);cursor:pointer;" onclick="window.open(\x27'+escHTML(v)+'\x27,\x27_blank\x27)" onerror="this.outerHTML=\x27<span style=color:var(--text-muted);>Gagal memuat foto</span>\x27" /></div></div>';
      }
      // Link columns: clickable
      else if((k==='Surat Pernyataan'||k==='Link/File'||k==='Link'||kl.indexOf('surat')!==-1||kl.indexOf('link')!==-1||kl.indexOf('url')!==-1) && v!=='-' && v.indexOf('http')===0){
        b+='<div class="detail-item full"><label>'+escHTML(k.replace(/_/g,' '))+'</label><a href="'+escHTML(v)+'" target="_blank" class="materi-link"><i class="fas fa-external-link-alt"></i> Buka/Download Dokumen</a></div>';
      }
      // ID Pendaftaran: highlight
      else if(k==='ID Pendaftaran' && v!=='-'){
        b+='<div class="detail-item"><label>'+escHTML(k)+'</label><span style="font-weight:700;color:var(--primary);font-size:1rem;">'+escHTML(v)+'</span></div>';
      }
      // Normal fields
      else {
        b+='<div class="detail-item"><label>'+escHTML(k.replace(/_/g,' '))+'</label><span>'+escHTML(v)+'</span></div>';
      }
    });
    b+='</div>';document.getElementById('detailModalBody').innerHTML=b;
  }
  else{document.getElementById('detailModalBody').innerHTML=content;}
  openModal('detailModal');
}
