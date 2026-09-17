/* ============================================================
   PAMUNGKAS — PETUNJUK PENGGUNAAN (v7.6.5)
   Bagian dari refactor modular (dimuat sebagai: js/21-petunjuk.js)
   ------------------------------------------------------------
   - Kartu panduan di menu Dashboard → Petunjuk Penggunaan
   - Panduan PENDAFTAR : tertanam di sini, tampil di pembaca
     baca-saja (tanpa unduhan/cetak; klik-kanan & shortcut
     Ctrl+P/S/U diblokir; anti-print via CSS).
   - Panduan ADMIN     : konten TIDAK tertanam di file JS —
     diambil dari tabel database `petunjuk_admin` via GraphQL
     hanya setelah sesi admin valid (proteksi server-side).
   ============================================================ */

/* ========== KONTEN: PANDUAN PENDAFTAR / PESERTA (9 BAB) ========== */
var PANDUAN_PENDAFTAR = [
  {
    t: 'Tentang Sistem PAMUNGKAS',
    i: 'fa-info-circle',
    c: '<p><b>PAMUNGKAS</b> adalah sistem informasi pengembangan SDM Kesehatan di bawah naungan <b>Mukmin Nasri</b> yang dapat diakses melalui <b>pamungkas.mukminnasri.com</b>. Sistem ini menjadi satu pintu bagi tenaga kesehatan untuk melihat informasi pelatihan, mendaftar kegiatan pelatihan, mengunduh materi, hingga memverifikasi sertifikat kompetensi yang telah diterbitkan.</p>' +
       '<p>Seluruh data yang tampil di sistem ini bersumber langsung dari database resmi yang dikelola oleh tim admin Dinas. Karena itu, data yang Anda lihat pada Dashboard, Pengumuman, dan Profil SDMK Terlatih selalu mencerminkan kondisi terkini. Apabila Anda menemukan ketidaksesuaian data, silakan hubungi admin melalui kanal resmi untuk perbaikan.</p>' +
       '<div class="g-tip"><i class="fas fa-lightbulb"></i><span>Sistem dapat diakses dari komputer, tablet, maupun ponsel. Untuk pengalaman terbaik gunakan browser terbaru (Chrome, Edge, atau Firefox) dan muat ulang halaman dengan <b>Ctrl+Shift+R</b> bila tampilan terasa tidak mutakhir.</span></div>'
  },
  {
    t: 'Menjelajah Dashboard',
    i: 'fa-th-large',
    c: '<p>Dashboard adalah halaman pertama yang tampil ketika sistem dibuka. Di bagian atas terdapat <b>Indikator Kinerja Program</b> yang menampilkan capaian program pengembangan SDM Kesehatan tahun berjalan, lengkap dengan nilai, target, dan satuannya. Kartu-kartu statistik di bawahnya merangkum jumlah SDMK terlatih, pendaftar, sertifikat terbit, pengumuman, serta rincian berdasarkan profesi, status kepegawaian, dan jenis kelamin.</p>' +
       '<p><b>Klik salah satu kartu statistik</b> untuk membuka popup berisi seluruh data asal statistik tersebut diambil langsung dari database. Di bagian bawah terdapat tabel <b>Pendaftar Terbaru</b> berisi 20 data pendaftaran terakhir; klik <b>foto pendaftar</b> untuk melihat gambarnya dalam ukuran besar (lightbox). Tabel dapat digulir ke bawah dan ke samping bila kolom tidak muat.</p>' +
       '<div class="g-tip"><i class="fas fa-hand-pointer"></i><span>Semua angka pada kartu dashboard dihitung langsung di server (database Nhost/Hasura), bukan hitungan sementara di perangkat Anda — sehingga selalu akurat dan sama untuk semua pengunjung.</span></div>'
  },
  {
    t: 'Membaca Pengumuman',
    i: 'fa-bullhorn',
    c: '<p>Menu <b>Pengumuman</b> (grup Dashboard pada sidebar) memuat informasi resmi: jadwal pelatihan terbaru, persyaratan pendaftaran, kuota, hingga pemberitahuan perubahan layanan. Pengumuman terbaru selalu berada di urutan atas sehingga Anda cukup membuka halaman ini secara berkala untuk tidak melewatkan informasi penting.</p>' +
       '<p>Setiap kartu pengumuman menampilkan judul, tanggal, dan isi lengkapnya. Pengumuman dengan label <b>aktif</b> adalah informasi yang masih berlaku. Sebelum mendaftar pelatihan, biasakan membaca pengumuman terlebih dahulu agar Anda memahami syarat, jadwal, dan kegiatan yang sedang dibuka.</p>'
  },
  {
    t: 'Profil SDMK Terlatih',
    i: 'fa-user-md',
    c: '<p>Menu <b>Profil SDMK Terlatih</b> merupakan direktori tenaga kesehatan yang telah mengikuti pelatihan dan tercatat memiliki kompetensi terstandar. Data ditampilkan per halaman (20 baris) dan dilengkapi kolom nama dengan gelar, profesi, unit kerja, nomor sertifikat, serta judul kegiatan pelatihan yang pernah diikuti.</p>' +
       '<p>Gunakan <b>kotak pencarian</b> untuk mencari nama atau profesi tertentu, dan gunakan tombol <b>pindah halaman</b> di bagian bawah tabel untuk menelusuri seluruh data. Klik foto profil untuk memperbesar tampilan foto tersebut. Direktori ini berguna bagi instansi maupun sesama nakes untuk memverifikasi bahwa seseorang telah terlatih melalui program resmi.</p>' +
       '<div class="g-tip"><i class="fas fa-shield-alt"></i><span>Data pribadi sensitif seperti NIK, NIP, dan kontak <b>tidak ditampilkan</b> kepada publik. Hanya informasi profil umum yang dipublikasikan demi perlindungan data pribadi.</span></div>'
  },
  {
    t: 'Cara Mendaftar Pelatihan',
    i: 'fa-clipboard-list',
    c: '<p>Menu <b>Pendaftaran</b> (grup Layanan) adalah formulir pendaftaran pelatihan. Ikuti langkah berikut secara berurutan:</p>' +
       '<ol>' +
       '<li>Buka menu <b>Pendaftaran</b> lalu isi <b>data diri lengkap</b>: NIK, NIP (bila ASN), nama lengkap dengan gelar, jenis kelamin, tempat &amp; tanggal lahir, unit kerja, jenis SDMK, jenis profesi, pekerjaan, nomor WhatsApp, email Plataran Sehat, alamat rumah, dan lama bekerja di unit sekarang.</li>' +
       '<li><b>Unggah pas foto</b> terbaru (format JPG/PNG). Pratinjau foto akan tampil setelah dipilih — pastikan wajah terlihat jelas.</li>' +
       '<li><b>Unggah Surat Pernyataan</b> yang telah ditandatangani (foto/scan/PDF).</li>' +
       '<li>Tempel <b>link SPJ Google Drive</b> bila diminta pada kegiatan tersebut. Pastikan link dibagikan dengan akses <i>“Siapa saja yang memiliki link dapat melihat”</i> agar admin dapat membukanya.</li>' +
       '<li>Pilih <b>Judul Kegiatan</b> dari daftar — daftar ini terisi otomatis dari pengumuman kegiatan yang dibuka admin.</li>' +
       '<li>Periksa kembali seluruh isian pada halaman konfirmasi, lalu klik tombol <b>Daftar</b>.</li>' +
       '<li>Setelah berhasil, sistem menampilkan <b>bukti pendaftaran</b>. Simpan tangkapan layarnya sebagai tanda terima.</li>' +
       '</ol>' +
       '<div class="g-tip"><i class="fas fa-triangle-exclamation"></i><span>NIK dan nama harus <b>benar-benar sesuai identitas resmi</b>. Nama pada sertifikat diterbitkan persis seperti nama yang Anda daftarkan — kesalahan penulisan dapat mengharuskan penerbitan ulang sertifikat.</span></div>'
  },
  {
    t: 'Mengecek Status Pendaftaran',
    i: 'fa-search-location',
    c: '<p>Setelah mendaftar, Anda dapat memantau proses verifikasi melalui menu <b>Cek Pendaftaran</b>. Masukkan <b>NIK</b> (atau NIP) yang Anda gunakan saat mendaftar, lalu klik tombol cari. Sistem akan menampilkan data pendaftaran Anda beserta statusnya.</p>' +
       '<p>Makna status: <span class="g-badge g-yellow">pending</span> berarti pendaftaran diterima sistem dan menunggu verifikasi admin; <span class="g-badge g-green">approved</span> berarti pendaftaran disetujui — Anda tercatat sebagai peserta; <span class="g-badge g-red">rejected</span> berarti pendaftaran ditolak, dan <b>catatan admin</b> pada halaman yang sama menjelaskan alasannya beserta langkah perbaikan yang diminta.</p>' +
       '<div class="g-tip"><i class="fas fa-clock"></i><span>Verifikasi umumnya selesai dalam jam kerja. Bila status masih <i>pending</i> lebih dari beberapa hari, hubungi admin melalui kanal resmi dan siapkan bukti pendaftaran Anda.</span></div>'
  },
  {
    t: 'Mengunduh Materi Pelatihan',
    i: 'fa-book-open',
    c: '<p>Menu <b>Cek Materi</b> menyediakan materi pelatihan yang dibagikan panitia. Materi dikelompokkan berdasarkan kategori/kegiatan sehingga mudah dicari. Buka menu tersebut, temukan kegiatan pelatihan yang Anda ikuti, lalu klik tautan <b>unduh</b> pada materi yang tersedia.</p>' +
       '<p>Materi dapat berupa dokumen PDF, presentasi, atau tautan berkas lainnya. Gunakan materi ini sebagai bekal pra-pelatihan maupun bahan penyegaran pasca-pelatihan. Bila sebuah tautan materi tidak dapat dibuka, laporkan kepada admin agar tautan diperbarui.</p>'
  },
  {
    t: 'Verifikasi Sertifikat',
    i: 'fa-certificate',
    c: '<p>Sertifikat pelatihan yang diterbitkan melalui PAMUNGKAS dapat diverifikasi keasliannya kapan saja melalui menu <b>Cek Sertifikat</b>. Masukkan <b>nomor sertifikat</b> yang tertera pada dokumen Anda, atau cari berdasarkan nama penerima.</p>' +
       '<p>Hasil verifikasi menampilkan nama penerima, judul pelatihan, dan tanggal terbit. Verifikasi ini dapat digunakan oleh instansi/tempat kerja Anda untuk memastikan keabsahan sertifikat tanpa perlu menghubungi panitia secara langsung. Bila sertifikat Anda tidak ditemukan, pastikan nomor ditulis tepat; bila tetap tidak ditemukan, hubungi admin untuk pemeriksaan data.</p>'
  },
  {
    t: 'Pertanyaan Umum (FAQ)',
    i: 'fa-comments',
    c: '<p><b>Lupa atau ragu NIK yang didaftarkan?</b> Buka kembali bukti pendaftaran Anda, atau gunakan Cek Pendaftaran dengan NIP bila Anda ASN. Data pendaftaran hanya dapat dicari dengan NIK/NIP yang benar.</p>' +
       '<p><b>Nama pada sertifikat salah tulis?</b> Laporkan kepada admin beserta bukti identitas; admin akan memperbaiki data pendaftaran/sertifikat pada database. Perbaikan hanya dapat dilakukan oleh admin, bukan oleh pendaftar.</p>' +
       '<p><b>Halaman tidak tampil sempurna?</b> Tekan <b>Ctrl+Shift+R</b> untuk memuat ulang dengan bersih (mengabaikan cache browser). Bila foto pada dashboard tidak tampil, coba muat ulang sekali lagi — foto dimuat langsung dari penyimpanan aman.</p>' +
       '<p><b>Ingin mengubah data pendaftaran setelah terkirim?</b> Hubungi admin melalui kanal resmi (WhatsApp/alamat email resmi Dinas) dengan menyertakan NIK dan bukti pendaftaran. Admin akan membantu memperbarui data melalui Panel Admin.</p>'
  }
];
/* ========== STATE & ELEMEN ========== */
var _panduanState = { open: false, type: null };

function _pdEl(id){ return document.getElementById(id); }

/* ========== PROTEKSI BACA-SAJA (berlaku saat pembaca terbuka) ========== */
(function(){
  /* klik-kanan diblok hanya di dalam pembaca panduan */
  document.addEventListener('contextmenu', function(e){
    if(!_panduanState.open) return;
    e.preventDefault();
  });
  /* Ctrl/Cmd+P (cetak), Ctrl/Cmd+S (simpan), Ctrl/Cmd+U (sumber) diblok */
  document.addEventListener('keydown', function(e){
    if(!_panduanState.open) return;
    var k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey) && (k==='p'||k==='s'||k==='u')){
      e.preventDefault();
      showToast('Panduan hanya bisa dibaca — unduh & cetak dinonaktifkan.','info');
    }
  });
})();

/* ========== RENDER PEMBACA ========== */
function _panduanRender(data, meta){
  var toc=_pdEl('panduanToc'), ct=_pdEl('panduanContent');
  if(!toc||!ct) return;
  var tocHTML='', bodyHTML='';
  data.forEach(function(ch,idx){
    var num=idx+1;
    tocHTML+='<a class="panduan-toc-item" id="ptoc_'+num+'" onclick="panduanGo('+num+')">'+
             '<span class="ptoc-num">'+num+'</span><span class="ptoc-t">'+escHTML(ch.t)+'</span></a>';
    bodyHTML+='<section class="g-ch" id="pch_'+num+'">'+
              '<h3 class="g-ch-title"><i class="fas '+ch.i+'"></i> '+num+'. '+escHTML(ch.t)+'</h3>'+
              '<div class="g-ch-body">'+ch.c+'</div></section>';
  });
  toc.innerHTML='<div class="panduan-toc-label"><i class="fas fa-list-ul"></i> Daftar Isi</div>'+tocHTML;
  ct.innerHTML=bodyHTML;
  /* v7.6.5 FIX: meta boleh null — judul/sub/ikon/badge sudah diatur lebih
     awal oleh _panduanOpenShell. Sebelumnya membaca meta.title dari null
     sehingga Panduan Admin gagal render ("Cannot read properties of null
     (reading 'title')") padahal isi sudah berhasil diambil dari database. */
  if(meta){
    if(_pdEl('panduanReaderTitle')) _pdEl('panduanReaderTitle').textContent=meta.title;
    if(_pdEl('panduanReaderSub')) _pdEl('panduanReaderSub').textContent=meta.sub;
    var iconBox=_pdEl('panduanReaderIcon');
    if(iconBox) iconBox.innerHTML='<i class="fas '+meta.icon+'"></i>';
    var badge=_pdEl('panduanReaderBadge');
    if(badge) badge.innerHTML=meta.badge||'';
  }
  panduanGo(1);
}

function panduanGo(num){
  var target=_pdEl('pch_'+num);
  if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
  document.querySelectorAll('.panduan-toc-item').forEach(function(a){ a.classList.remove('active'); });
  var tocItem=_pdEl('ptoc_'+num);
  if(tocItem){ tocItem.classList.add('active'); if(tocItem.scrollIntoView) tocItem.scrollIntoView({block:'nearest'}); }
}

/* ========== BUKA / TUTUP PEMBACA ========== */
function openPanduan(type){
  var reader=_pdEl('panduanReader');
  if(!reader){ console.error('[Petunjuk] #panduanReader tidak ditemukan'); return; }

  /* --- PANDUAN ADMIN: proteksi login admin (server-side fetch) --- */
  if(type==='admin'){
    var sesiValid = !!(window.Sec && Sec.hasSession && Sec.hasSession());
    var adminValid = (typeof isAdminUser==='function') && isAdminUser();
    if(!sesiValid || !adminValid){
      showToast('Panduan Admin hanya dapat diakses melalui login admin. Silakan login terlebih dahulu.','error');
      if(typeof openLoginModal==='function') openLoginModal();
      return;
    }
    _panduanOpenShell({
      title:'Panduan Admin', icon:'fa-user-shield',
      sub:'Petunjuk Pengelolaan Sistem PAMUNGKAS — khusus admin',
      badge:'<span class="panduan-reader-badge" style="background:rgba(139,92,246,.12);color:#7C3AED;"><i class="fas fa-lock"></i> Admin</span>'
    });
    _panduanContentLoading();
    _panduanFetchAdmin();
    return;
  }

  /* --- PANDUAN PENDAFTAR: konten tertanam, baca-saja --- */
  _panduanOpenShell({
    title:'Panduan Pendaftar / Peserta', icon:'fa-book-open',
    sub:'Petunjuk Penggunaan Sistem PAMUNGKAS bagi pendaftar pelatihan',
    badge:'<span class="panduan-reader-badge" style="background:rgba(14,165,233,.12);color:#0284C7;"><i class="fas fa-eye"></i> Baca Saja</span>'
  });
  _panduanRender(PANDUAN_PENDAFTAR, null);
}

function _panduanOpenShell(meta){
  var reader=_pdEl('panduanReader');
  if(_pdEl('panduanReaderTitle')) _pdEl('panduanReaderTitle').textContent=meta.title;
  if(_pdEl('panduanReaderSub')) _pdEl('panduanReaderSub').textContent=meta.sub;
  var iconBox=_pdEl('panduanReaderIcon');
  if(iconBox) iconBox.innerHTML='<i class="fas '+meta.icon+'"></i>';
  var badge=_pdEl('panduanReaderBadge');
  if(badge) badge.innerHTML=meta.badge||'';
  if(_pdEl('panduanToc')) _pdEl('panduanToc').innerHTML='';
  if(_pdEl('panduanContent')) _pdEl('panduanContent').innerHTML='';
  reader.classList.add('active');
  document.body.style.overflow='hidden';
  _panduanState.open=true;
  _panduanState.type=meta.icon==='fa-user-shield'?'admin':'pendaftar';
}

function _panduanContentLoading(){
  var ct=_pdEl('panduanContent');
  if(ct) ct.innerHTML='<div style="padding:60px 20px;text-align:center;color:var(--text-muted);">'+
    '<i class="fas fa-circle-notch fa-spin" style="font-size:2rem;display:block;margin-bottom:12px;color:var(--primary);"></i>'+
    'Memuat panduan dari database...</div>';
}

function _panduanContentError(msg){
  var ct=_pdEl('panduanContent');
  if(ct) ct.innerHTML='<div style="padding:50px 24px;text-align:center;">'+
    '<i class="fas fa-triangle-exclamation" style="font-size:2.2rem;color:var(--accent);display:block;margin-bottom:14px;"></i>'+
    '<p style="font-weight:700;margin-bottom:8px;color:var(--text-primary);">Panduan Admin belum dapat dimuat</p>'+
    '<p style="color:var(--text-secondary);font-size:.88rem;line-height:1.7;max-width:520px;margin:0 auto;">'+msg+'</p></div>';
}

/* v7.6.4: konten Panduan Admin diambil dari tabel `petunjuk_admin`
   (proteksi di sisi server — role tanpa izin SELECT tidak akan menerima isi). */
function _panduanFetchAdmin(){
  if(typeof graphqlRequest!=='function'){ _panduanContentError('Modul GraphQL tidak termuat. Muat ulang halaman (Ctrl+Shift+R).'); return; }
  var q='query GetPetunjukAdmin { petunjuk_admin(order_by: {updated_at: desc_nulls_last}, limit: 1) { id judul konten updated_at } }';
  graphqlRequest('GetPetunjukAdmin', q, {}).then(function(res){
    if(!_panduanState.open || _panduanState.type!=='admin') return; /* pembaca sudah ditutup */
    var row=res && res.petunjuk_admin && res.petunjuk_admin[0];
    if(!row || !row.konten){
      _panduanContentError('Tabel <b>petunjuk_admin</b> belum berisi data. Jalankan berkas SQL <b>nhost_petunjuk_admin.sql</b> pada Nhost SQL Editor untuk mengisi panduan.');
      return;
    }
    var chapters=null;
    try{ chapters=JSON.parse(row.konten); }catch(e){ chapters=null; }
    /* v7.6.5: validasi lebih tegas — tiap bab wajib punya t (judul) & c (isi).
       Menangkap struktur salah SEBELUM render agar pesan error lebih jelas. */
    var _fmtOk = Array.isArray(chapters) && chapters.length>0 &&
      chapters.every(function(ch){ return ch && typeof ch.t==='string' && typeof ch.c==='string'; });
    if(!_fmtOk){
      _panduanContentError('Data panduan pada database tidak dalam format yang diharapkan. Setiap bab pada kolom <b>konten</b> tabel <b>petunjuk_admin</b> wajib berupa objek {t, i, c}. Periksa kembali isi data.');
      return;
    }
    /* v7.6.5: jaring pengaman — bila render gagal karena data tak terduga,
       tampilkan pesan jelas, jangan biarkan error mentah menutup konten. */
    try{ _panduanRender(chapters, null); }
    catch(_rErr){ _panduanContentError('Gagal menampilkan panduan: '+escHTML((_rErr&&_rErr.message)||_rErr)); }
  }).catch(function(err){
    if(!_panduanState.open) return;
    var m=(err && err.message)||'';
    if(m.indexOf('petunjuk_admin')!==-1 || m.indexOf('not found')!==-1 || m.indexOf('not-exist')!==-1){
      _panduanContentError('Tabel <b>petunjuk_admin</b> belum dibuat / belum diberi izin pada Hasura. Langkah aktifasi: (1) jalankan <b>nhost_petunjuk_admin.sql</b> di Nhost SQL Editor, (2) pada Hasura → Permissions, beri izin <b>SELECT</b> tabel <b>petunjuk_admin</b> untuk role <b>admin</b>, <b>operator</b>, dan <b>superadmin</b>. Detail: '+escHTML(m));
    } else if(m.indexOf('Sesi')!==-1){
      _panduanContentError('Sesi Anda telah berakhir. Silakan login kembali sebagai admin, lalu buka panduan ini lagi. Detail: '+escHTML(m));
    } else {
      _panduanContentError('Gagal memuat panduan: '+escHTML(m));
    }
  });
}

function closePanduan(){
  var reader=_pdEl('panduanReader');
  if(reader) reader.classList.remove('active');
  else console.warn('[DOM] closePanduan: #panduanReader tidak ditemukan');
  if(_pdEl('panduanContent')) _pdEl('panduanContent').innerHTML='';
  if(_pdEl('panduanToc')) _pdEl('panduanToc').innerHTML='';
  document.body.style.overflow='';
  _panduanState.open=false;
  _panduanState.type=null;
}

/* klik latar pembaca (di luar kotak) = tutup */
(function(){
  var reader=document.getElementById('panduanReader');
  if(reader) reader.addEventListener('click', function(e){ if(e.target===reader) closePanduan(); });
})();

/* ========== INIT HALAMAN PETUNJUK ========== */
function initPetunjukPage(){
  /* v7.6.4: halaman kartu panduan bersifat statis — tidak ada data dinamis
     yang perlu dimuat. Fungsi disediakan agar alur navigateTo konsisten
     dan untuk penandaan status kartu admin bila diperlukan kelak. */
  console.log('[Petunjuk] Halaman Petunjuk Penggunaan dibuka');
}
