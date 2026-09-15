/* ============================================================
   PAMUNGKAS — MODUL CEK MATERI (Card View + CRUD Admin)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/11-cek-materi.js
   ============================================================ */

/* ========== CEK MATERI (Public Table) - CARD VIEW ========== */
function loadCekMateriPublic(){
  showLoading('Memuat materi...');
  callServer('getMateri').then(function(res){
    hideLoading();if(!res||!res.success){showToast(res?res.message:'Gagal memuat materi','error');return;}
    _allMateri=res.data||[];renderMateriCards(_allMateri);
  }).catch(function(e){hideLoading();showToast('Error: '+(e.message||e),'error');});
}

/**
 * renderMateriCards() - Render materi dalam bentuk KARTU yang rapi
 * Setiap kartu bisa diklik untuk melihat detail di popup
 */
function renderMateriCards(data){
  var container = document.getElementById('cekMatBody');
  var hd = document.getElementById('cekMatHead');
  var em = document.getElementById('cekMatEmpty');
  
  // Sembunyikan header tabel (karena pakai card view)
  if (hd) hd.style.display = 'none';
  
  if (!data.length) {
    container.innerHTML = '';
    if (em) em.style.display = 'block';
    return;
  }
  if (em) em.style.display = 'none';
  
  // Color palette for books - each book gets different color
  var bookColors = [
    { cover: 'book-color-1', gradient: '#667eea' },
    { cover: 'book-color-2', gradient: '#f093fb' },
    { cover: 'book-color-3', gradient: '#4facfe' },
    { cover: 'book-color-4', gradient: '#43e97b' },
    { cover: 'book-color-5', gradient: '#fa709a' },
    { cover: 'book-color-6', gradient: '#a8edea' },
    { cover: 'book-color-7', gradient: '#ff9a9e' },
    { cover: 'book-color-8', gradient: '#ffecd2' },
    { cover: 'book-color-9', gradient: '#a1c4fd' },
    { cover: 'book-color-10', gradient: '#d299c2' },
    { cover: 'book-color-11', gradient: '#89f7fe' },
    { cover: 'book-color-12', gradient: '#cd9cf2' }
  ];
  
  // Category icons mapping
  var categoryIcons = {
    'Modul': 'fa-book',
    'modul': 'fa-book',
    'Video': 'fa-video',
    'video': 'fa-video',
    'E-Book': 'fa-file-pdf',
    'e-book': 'fa-file-pdf',
    'ebook': 'fa-file-pdf',
    'Presentasi': 'fa-presentation-screen',
    'presentasi': 'fa-presentation-screen',
    'Lainnya': 'fa-folder-open',
    'default': 'fa-file-alt'
  };
  
  var html = '';
  
  // Grid container untuk cards
  html += '<div class="materi-card-grid">';
  
  data.forEach(function(r, i) {
    var judul = _getSertField(r, ['Judul Materi', 'Judul_Materi', 'judul_materi', 'Judul']);
    var kategori = _getSertField(r, ['Kategori', 'kategori']);
    var link = _getSertField(r, ['Link Download', 'link_download', 'Link/File', 'Link', 'link', 'Link_File']);
    var deskripsi = _getSertField(r, ['Deskripsi', 'deskripsi', 'Description']) || 'Tidak ada deskripsi.';
    
    // Get color for this card (cycle through colors)
    var colorIndex = i % bookColors.length;
    var bookColor = bookColors[colorIndex];
    
    // Get icon for category
    var catIcon = categoryIcons[kategori] || categoryIcons['default'];
    
    // Cek apakah ada link
    var hasLink = link && link !== '-';
    
    // Book card HTML with 3D effect
    html += '<div class="materi-card" onclick="openMateriDetail(' + i + ')">';
    html += '  <div class="book-cover ' + bookColor.cover + '">';
    html += '    <div class="book-spine">';
    html += '      <span class="book-spine-text">' + escHTML(kategori || 'MATERI') + '</span>';
    html += '    </div>';
    html += '    <div class="book-pages"></div>';
    html += '    <div class="book-content">';
    html += '      <span class="book-badge"><i class="fas ' + catIcon + '"></i> ' + escHTML(kategori || 'Umum') + '</span>';
    html += '      <h3 class="book-title">' + escHTML(judul) + '</h3>';
    html += '      <p class="book-desc">' + escHTML(deskripsi.substring(0, 90)) + (deskripsi.length > 90 ? '...' : '') + '</p>';
    html += '      <div class="book-footer">';
    if (hasLink) {
      html += '        <a href="' + escHTML(link) + '" target="_blank" class="book-link-btn" onclick="event.stopPropagation();" style="color: ' + bookColor.gradient + ';">';
      html += '          <i class="fas fa-download"></i> Unduh';
      html += '        </a>';
    } else {
      html += '        <span class="book-no-link"><i class="fas fa-lock"></i> Tidak tersedia</span>';
    }
    html += '        <button class="book-detail-btn" onclick="event.stopPropagation(); openMateriDetail(' + i + ');">';
    html += '          <i class="fas fa-eye"></i> Detail';
    html += '        </button>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  });
  
  html += '</div>'; // end grid
  
  container.innerHTML = html;
}
/**
 * openMateriDetail() - Buka popup detail materi dengan animasi cantik
 */
function openMateriDetail(idx) {
  if (!_allMateri || !_allMateri[idx]) return;
  
  var r = _allMateri[idx];
  var judul = _getSertField(r, ['Judul Materi', 'Judul_Materi', 'judul_materi', 'Judul']);
  var kategori = _getSertField(r, ['Kategori', 'kategori']);
  var link = _getSertField(r, ['Link Download', 'link_download', 'Link/File', 'Link', 'link', 'Link_File']);
  var deskripsi = _getSertField(r, ['Deskripsi', 'deskripsi', 'Description']) || 'Tidak ada deskripsi.';
  
  // Color palette matching the card colors
  var headerGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)'
  ];
  
  var gradientColor = headerGradients[idx % headerGradients.length];
  
  // Category icons mapping
  var categoryIcons = {
    'Modul': 'fa-book',
    'modul': 'fa-book',
    'Video': 'fa-video',
    'video': 'fa-video',
    'E-Book': 'fa-file-pdf',
    'e-book': 'fa-file-pdf',
    'ebook': 'fa-file-pdf',
    'Presentasi': 'fa-presentation-screen',
    'presentasi': 'fa-presentation-screen',
    'Lainnya': 'fa-folder-open',
    'default': 'fa-book-open'
  };
  
  var catIcon = categoryIcons[kategori] || categoryIcons['default'];
  
  var modalHtml = '';
  modalHtml += '<div class="materi-detail-modal" id="materiDetailModalInner">';
  modalHtml += '  <div class="materi-detail-header" style="background: ' + gradientColor + ';">';
  modalHtml += '    <div class="materi-detail-icon"><i class="fas ' + catIcon + '"></i></div>';
  modalHtml += '    <div>';
  modalHtml += '      <h2>' + escHTML(judul) + '</h2>';
  modalHtml += '      <span class="materi-detail-cat"><i class="fas fa-tag"></i> ' + escHTML(kategori || 'Umum') + '</span>';
  modalHtml += '    </div>';
  modalHtml += '  </div>';
  modalHtml += '  <div class="materi-detail-body">';
  modalHtml += '    <div class="detail-row">';
  modalHtml += '      <label><i class="fas fa-heading"></i> Judul Materi</label>';
  modalHtml += '      <value>' + escHTML(judul) + '</value>';
  modalHtml += '    </div>';
  modalHtml += '    <div class="detail-row">';
  modalHtml += '      <label><i class="fas fa-folder"></i> Kategori</label>';
  modalHtml += '      <value>' + escHTML(kategori || '-') + '</value>';
  modalHtml += '    </div>';
  modalHtml += '    <div class="detail-row">';
  modalHtml += '      <label><i class="fas fa-align-left"></i> Deskripsi</label>';
  modalHtml += '      <value>' + escHTML(deskripsi.replace(/\n/g, '<br>')) + '</value>';
  modalHtml += '    </div>';
  modalHtml += '    <div class="detail-row">';
  modalHtml += '      <label><i class="fas fa-link"></i> Link / File</label>';
  modalHtml += '      <value>';
  if (link && link !== '-') {
    modalHtml += '        <a href="' + escHTML(link) + '" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: linear-gradient(135deg, ' + (headerGradients[idx % headerGradients.length].split(',')[0].replace('#', '').trim()) + ', transparent); border-radius: 25px; text-decoration: none; color: white; font-weight: 600; font-size: 0.88rem; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">';
    modalHtml += '          <i class="fas fa-external-link-alt"></i> Buka / Unduh Materi';
    modalHtml += '        </a>';
  } else {
    modalHtml += '        <span style="color: var(--text-muted); display: flex; align-items: center; gap: 6px;"><i class="fas fa-lock"></i> Tidak tersedia</span>';
  }
  modalHtml += '      </value>';
  modalHtml += '    </div>';
  modalHtml += '  </div>';
  modalHtml += '  <div class="materi-detail-footer">';
  modalHtml += '    <button onclick="closeMateriDetailModal()" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #f1f5f9; border: none; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 0.88rem; color: var(--text-secondary); transition: all 0.25s ease;">';
  modalHtml += '      <i class="fas fa-times"></i> Tutup';
  modalHtml += '    </button>';
  if (link && link !== '-') {
    modalHtml += '    <a href="' + escHTML(link) + '" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 25px; text-decoration: none; color: white; font-weight: 700; font-size: 0.88rem; transition: all 0.25s ease; box-shadow: 0 4px 15px rgba(102,126,234,0.35);">';
    modalHtml += '      <i class="fas fa-download"></i> Unduh Sekarang';
    modalHtml += '    </a>';
  }
  modalHtml += '  </div>';
  modalHtml += '</div>';
  
  // Buat modal dinamis jika belum ada
  var modalContainer = document.getElementById('materiDetailModal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'materiDetailModal';
    modalContainer.className = 'modal-overlay';
    modalContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); background: rgba(0,0,0,0.5); z-index: 250;';
    document.body.appendChild(modalContainer);
  }
  
  modalContainer.innerHTML = modalHtml;
  modalContainer.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * closeMateriDetailModal() - Tutup popup detail materi dengan animasi
 */
function closeMateriDetailModal() {
  var modalContainer = document.getElementById('materiDetailModal');
  var innerModal = document.getElementById('materiDetailModalInner');
  
  if (innerModal) {
    innerModal.classList.add('closing');
    setTimeout(function() {
      if (modalContainer) {
        modalContainer.style.display = 'none';
        document.body.style.overflow = '';
      }
    }, 300);
  } else if (modalContainer) {
    modalContainer.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function filterCekMateri(){
  var el = document.getElementById('searchMateriJudul');
  if (!el) return;
  var q = el.value.toLowerCase();
  var f = _allMateri.filter(function(r) {
    var judul = _getSertField(r, ['Judul Materi', 'Judul_Materi', 'Judul']).toLowerCase();
    var kategori = _getSertField(r, ['Kategori']).toLowerCase();
    return judul.indexOf(q) !== -1 || kategori.indexOf(q) !== -1;
  });
  renderMateriCards(f);
}
function openMateriForm(idx){document.getElementById('materiEditIndex').value=idx!==undefined?idx:-1;document.getElementById('materiFormTitle').textContent=idx!==undefined?'Edit Materi':'Tambah Materi';if(idx!==undefined){var r=_allMateri[idx];document.getElementById('matJudul').value=r.Judul_Materi||r.Judul||'';document.getElementById('matKategori').value=r.Kategori||'';document.getElementById('matLink').value=r['Link Download']||r.link_download||r['Link/File']||r.Link||r.Link_File||'';}else{document.getElementById('materiForm').reset();}openModal('materiFormModal');}
function editMateri(i){openMateriForm(i);}
function submitMateri(e){e.preventDefault();var idx=parseInt(document.getElementById('materiEditIndex').value);var data={'Judul Materi':document.getElementById('matJudul').value,Kategori:document.getElementById('matKategori').value,'Link/File':document.getElementById('matLink').value};
  showLoading('Menyimpan...');
  var done=function(res){hideLoading();closeModal('materiFormModal');showToast(res.message,res.success?'success':'error');if(res.success)loadCekMateriPublic();};
  var fail=function(e){hideLoading();showToast('Error: '+(e.message||e),'error');};
  if(idx>=0)callServer('updateMateri',{idx:idx,data:data}).then(done).catch(fail);
  else callServer('tambahMateri',data).then(done).catch(fail);
}
