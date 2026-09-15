/* ============================================================
   PAMUNGKAS — API LAYER — GraphQL Nhost/Hasura (Query, Request, callServer)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/04-graphql.js
   ============================================================ */

/* ========== GRAPHQL QUERY DEFINITIONS ========== */
const GRAPHQL_QUERIES = {
  // === QUERIES ===
  getDashboardData: `
    query GetDashboardData {
      indikator(order_by: {id: asc}) { id indikator nilai target satuan periode }
      sdmk_aggregate { aggregate { count } }
      pendaftaran_aggregate { aggregate { count } }
      sertifikat_aggregate { aggregate { count } }
      pengumuman { id judul isi_pengumuman tanggal status created_at created_by }
      
      # SDMK Data dengan field lengkap
      sdmk(order_by: {created_at: desc_nulls_last}, limit: 50) { 
        id foto nama nik profesi unit_kerja nomor_sertifikat judul_kegiatan 
        tanggal_pelaksanaan tahun tempat_pelaksanaan created_at updated_at
      }
      
      # Pendaftaran Data dengan SEMUA field untuk dashboard lengkap
      pendaftaran(order_by: {created_at: desc_nulls_last}, limit: 20) {
        id foto nama_lengkap_dengan_gelar nik nip unit_kerja jenis_sdmk
        jenis_profesi pekerjaan jenis_kelamin tempat_dan_tanggal_lahir
        nomor_whatsapp email_plataran_sehat alamat_rumah
        lama_bekerja_di_unit_sekarang surat_pernyataan
        judul_kegiatan status created_at updated_at
      }
      
      # Aggregate untuk statistik detail berdasarkan profesi SDMK
      sdmk_profesi_aggregate: sdmk_aggregate {
        aggregate {
          count
        }
      }
      
      # Aggregate untuk statistik detail berdasarkan pekerjaan pendaftaran  
      pendaftaran_pekerjaan_aggregate: pendaftaran_aggregate {
        aggregate {
          count
        }
      }
    }
  `,
  
  getPengumuman: `
    query GetPengumuman($order: [pengumuman_order_by!]) {
      pengumuman(order_by: $order) {
        id judul isi_pengumuman tanggal status created_at created_by
      }
    }
  `,
  
  getSDMK: `
    query GetSDMK($limit: Int, $offset: Int, $order: [sdmk_order_by!], $where: sdmk_bool_exp) {
      sdmk(limit: $limit, offset: $offset, order_by: $order, where: $where) {
        id foto nama nik profesi unit_kerja nomor_sertifikat judul_kegiatan 
        tanggal_pelaksanaan tahun tempat_pelaksanaan created_at updated_at
      }
      sdmk_aggregate(where: $where) { aggregate { count } }
    }
  `,
  
  getPendaftaran: `
    query GetPendaftaran($limit: Int, $offset: Int, $order: [pendaftaran_order_by!], $where: pendaftaran_bool_exp) {
      pendaftaran(limit: $limit, offset: $offset, order_by: $order, where: $where) {
        id foto nama_lengkap_dengan_gelar nik nip unit_kerja jenis_sdmk jenis_profesi
        pekerjaan jenis_kelamin tempat_dan_tanggal_lahir email_plataran_sehat
        lama_bekerja_di_unit_sekarang nomor_whatsapp alamat_rumah surat_pernyataan
        judul_kegiatan status created_at updated_at catatan_admin
      }
      pendaftaran_aggregate(where: $where) { aggregate { count } }
    }
  `,
  
  getSertifikat: `
    query GetSertifikat($limit: Int, $offset: Int, $order: [sertifikat_order_by!]) {
      sertifikat(limit: $limit, offset: $offset, order_by: $order) {
        id nomor_sertifikat nama_penerima judul_pelatihan tanggal_terbit link_sertifikat
        sdmk_id created_at updated_at
      }
      sertifikat_aggregate { aggregate { count } }
    }
  `,
  
  getMateri: `
    query GetMateri($limit: Int, $offset: Int, $order: [materi_order_by!]) {
      materi(limit: $limit, offset: $offset, order_by: $order) {
        id judul_materi kategori link_download deskripsi created_at created_by updated_at
      }
      materi_aggregate { aggregate { count } }
    }
  `,
  
  getMultiusers: `
    query GetMultiusers {
      multiusers { id username level status created_at }
    }
  `,
  
  getIndikator: `
    query GetIndikator {
      indikator(order_by: {id: asc}) { id indikator nilai target satuan periode }
    }
  `,
  
  cekSertifikat: `
    query CekSertifikat($search: String!) {
      sertifikat(where: {_or: [{nama_penerima: {_ilike: $search}}]}) {
        id nomor_sertifikat nama_penerima judul_pelatihan tanggal_terbit link_sertifikat
      }
    }
  `,
  
  cekPendaftaran: `
    query CekPendaftaran($nik: String!) {
      pendaftaran(where: {nik: {_eq: $nik}}) {
        id foto nama_lengkap_dengan_gelar nik nip unit_kerja jenis_sdmk jenis_profesi
        pekerjaan jenis_kelamin tempat_dan_tanggal_lahir email_plataran_sehat
        lama_bekerja_di_unit_sekarang nomor_whatsapp alamat_rumah surat_pernyataan
        judul_kegiatan status created_at updated_at catatan_admin
      }
    }
  `,

  // === MUTATIONS ===
  insertPengumuman: `mutation InsertPengumuman($object: pengumuman_insert_input!) { insert_pengumuman_one(object: $object) { id } }`,
  updatePengumuman: `mutation UpdatePengumuman($id: uuid!, $object: pengumuman_set_input!) { update_pengumuman_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
  deletePengumuman: `mutation DeletePengumuman($id: uuid!) { delete_pengumuman_by_pk(id: $id) { id } }`,
  
  insertSDMK: `mutation InsertSDMK($object: sdmk_insert_input!) { insert_sdmk_one(object: $object) { id } }`,
  updateSDMK: `mutation UpdateSDMK($id: uuid!, $object: sdmk_set_input!) { update_sdmk_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
  deleteSDMK: `mutation DeleteSDMK($id: uuid!) { delete_sdmk_by_pk(id: $id) { id } }`,
  
  insertPendaftaran: `mutation InsertPendaftaran($object: pendaftaran_insert_input!) { insert_pendaftaran_one(object: $object) { id } }`,
  updatePendaftaran: `mutation UpdatePendaftaran($id: uuid!, $object: pendaftaran_set_input!) { update_pendaftaran_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
  deletePendaftaran: `mutation DeletePendaftaran($id: uuid!) { delete_pendaftaran_by_pk(id: $id) { id } }`,
  
  insertSertifikat: `mutation InsertSertifikat($object: sertifikat_insert_input!) { insert_sertifikat_one(object: $object) { id } }`,
  updateSertifikat: `mutation UpdateSertifikat($id: uuid!, $object: sertifikat_set_input!) { update_sertifikat_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
  deleteSertifikat: `mutation DeleteSertifikat($id: uuid!) { delete_sertifikat_by_pk(id: $id) { id } }`,
  
  insertMateri: `mutation InsertMateri($object: materi_insert_input!) { insert_materi_one(object: $object) { id } }`,
  updateMateri: `mutation UpdateMateri($id: uuid!, $object: materi_set_input!) { update_materi_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
  deleteMateri: `mutation DeleteMateri($id: uuid!) { delete_materi_by_pk(id: $id) { id } }`,
  
  insertMultiuser: `mutation InsertMultiuser($object: multiusers_insert_input!) { insert_multiusers_one(object: $object) { id } }`,
  updateMultiuser: `mutation UpdateMultiuser($id: uuid!, $object: multiusers_set_input!) { update_multiusers_by_pk(pk_columns: {id: $id}, _set: $object) { id } }`,
  deleteMultiuser: `mutation DeleteMultiuser($id: uuid!) { delete_multiusers_by_pk(id: $id) { id } }`,
  
  // === INDIKATOR MUTATIONS (Previously Missing!) ===
  insertIndikator: `mutation InsertIndikator($object: indikator_insert_input!) { insert_indikator_one(object: $object) { id indikator nilai target satuan } }`,
  updateIndikator: `mutation UpdateIndikator($id: uuid!, $object: indikator_set_input!) { update_indikator_by_pk(pk_columns: {id: $id}, _set: $object) { id indikator nilai target satuan } }`,
  deleteIndikator: `mutation DeleteIndikator($id: uuid!) { delete_indikator_by_pk(id: $id) { id } }`,
  
  // Special query for authentication (returns password field)
  getAllUsersForAuth: `
    query GetAllUsersForAuth {
      multiusers {
        id
        username
        password
        level
        status
        created_at
      }
    }
  `
};

/* ========== GRAPHQL HELPER FUNCTIONS ========== */

async function graphqlRequest(operationName, query, variables = {}) {
  const url = NHOST_CONFIG.graphqlUrl;
  const headers = { 'Content-Type': 'application/json' };
  
  if (NHOST_CONFIG.adminSecret && NHOST_CONFIG.adminSecret !== 'YOUR_ADMIN_SECRET') {
    headers['x-hasura-admin-secret'] = NHOST_CONFIG.adminSecret;
  }
  
  const authToken = safeStorage.getItem('nhost_token');
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  // ✅ DEEP DEBUG: Log semua detail request SEBELUM kirim ke Hasura
  console.log('[GQL] === REQUEST START ===');
  console.log('[GQL] Operation:', operationName);
  console.log('[GQL] Variables:', JSON.stringify(variables, null, 2));
  
  // ✅ INSPECTION KRITIS: Cek setiap value dalam variables
  if (variables && typeof variables === 'object') {
    Object.keys(variables).forEach(function(key) {
      var val = variables[key];
      var type = typeof val;
      console.log(`[GQL] Var "${key}":`, type, '=', 
        type === 'object' ? JSON.stringify(val).substring(0, 150) : 
        type === 'string' ? `"${val}"`.substring(0, 50) : val);
      
      // ✅ PERBAIKAN: Variable $object MEMANG harus bertipe object (input type)
      // Jangan anggap sebagai error! Hanya log untuk debugging
      if (type === 'object' && val !== null && !Array.isArray(val)) {
        console.log(`[GQL] ℹ️ Variable "${key}" is object (this is OK for input types)`);
        // Cek apakah ada nilai undefined/null DI DALAM object
        if (val) {
          Object.keys(val).forEach(function(innerKey) {
            var innerVal = val[innerKey];
            if (innerVal === undefined) {
              console.warn(`[GQL] ⚠️ Inner field "${innerKey}" is UNDEFINED!`);
            }
          });
        }
      }
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query: query, variables: variables, operationName: operationName })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    
    // ✅ Log response dari Hasura
    console.log('[GQL] Response status:', response.status);
    
    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      console.error('[GQL] Full error details:', JSON.stringify(result.errors, null, 2));
      throw new Error(result.errors[0].message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error(`GraphQL Request Error (${operationName}):`, error);
    throw error;
  }
}

/**
 * Legacy callServer function - now uses GraphQL internally
 * Maintains backward compatibility with existing code structure
 */
function callServer(action, data) {
  return new Promise(async function(resolve, reject) {
    try {
      let result;
      
      switch(action) {
        case 'getDashboardData':
          result = await graphqlRequest('GetDashboardData', GRAPHQL_QUERIES.getDashboardData);
          
          // Extract base counts
          var sdmkData = result.sdmk || [];
          var pendaftaranData = result.pendaftaran || [];
          var pengumumanData = result.pengumuman || [];
          
          // Calculate detailed statistics from SDMK data
          var dokterCount = 0, perawatCount = 0, bidanCount = 0, nakesLainCount = 0;
          sdmkData.forEach(function(s) {
            var prof = (s.profesi || '').toLowerCase();
            if (prof.indexOf('dokter') !== -1 || prof.indexOf('dr.') !== -1 || prof.indexOf('dr ') !== -1) {
              dokterCount++;
            } else if (prof.indexOf('perawat') !== -1) {
              perawatCount++;
            } else if (prof.indexOf('bidan') !== -1) {
              bidanCount++;
            } else {
              nakesLainCount++;
            }
          });
          
          // Calculate detailed statistics from Pendaftaran data
          var pnsCount = 0, pppkCount = 0, nonAsnCount = 0;
          var lakiCount = 0, perempuanCount = 0;
          pendaftaranData.forEach(function(p) {
            var pekerjaan = (p.pekerjaan || '').toLowerCase();
            if (pekerjaan.indexOf('pns') !== -1) {
              pnsCount++;
            } else if (pekerjaan.indexOf('pppk') !== -1) {
              pppkCount++;
            } else if (p.pekerjaan) {
              nonAsnCount++;
            }
            
            var jk = (p.jenis_kelamin || '').toLowerCase();
            if (jk === 'laki-laki' || jk === 'l') {
              lakiCount++;
            } else if (jk === 'perempuan' || jk === 'p') {
              perempuanCount++;
            }
          });
          
          // Map SDMK data to expected format
          var mappedSdmk = sdmkData.map(function(s) {
            return {
              ID: s.id,
              Foto: s.foto,
              'Nama Lengkap dengan Gelar': s.nama,
              Nama: s.nama,
              'NIK/NIP': s.nik,
              NIK: s.nik,
              Profesi: s.profesi,
              'Jenis Profesi': s.profesi,
              'Unit Kerja': s.unit_kerja,
              Unit_Kerja: s.unit_kerja,
              Unit: s.unit_kerja,
              'No. Sertifikat': s.nomor_sertifikat,
              Nomor_Sertifikat: s.nomor_sertifikat,
              'Judul Kegiatan': s.judul_kegiatan,
              'Tgl Pelaksanaan': s.tanggal_pelaksanaan,
              Tahun: String(s.tahun || ''),
              Tempat: s.tempat_pelaksanaan,
              'Status Pelatihan': 'Lulus',
              Pekerjaan: '-'
            };
          });
          
          // Map Pendaftaran data to expected format with ALL fields
          var mappedPendaftaran = pendaftaranData.map(function(p) {
            return {
              ID: p.id,
              Foto: p.foto,
              'Nama Lengkap dengan Gelar': p.nama_lengkap_dengan_gelar || '-',
              Nama: p.nama_lengkap_dengan_gelar || '-',
              NIK: p.nik || '',
              NIP: p.nip || '',
              'NIK/NIP': p.nik || p.nip || '',
              'Unit Kerja': p.unit_kerja || '-',
              Unit_Kerja: p.unit_kerja || '-',
              Unit: p.unit_kerja || '-',
              'Jenis SDMK': p.jenis_sdmk || '-',
              'Jenis Profesi': p.jenis_profesi || '-',
              Profesi: p.jenis_profesi || '-',
              Pekerjaan: p.pekerjaan || '-',
              'Status Pekerjaan': p.pekerjaan || '-',
              'Jenis Kelamin': p.jenis_kelamin || '-',
              'Tempat Lahir': p.tempat_dan_tanggal_lahir ? (p.tempat_dan_tanggal_lahir.split(',')[0] || '-') : '-',
              'Tanggal Lahir': p.tempat_dan_tanggal_lahir ? ((p.tempat_dan_tanggal_lahir.split(',')[1] || '').trim() || '-') : '-',
              Jabatan: p.pekerjaan || '-',
              'Pendidikan Terakhir': p.jenis_profesi || '-',
              'No Telepon': p.nomor_whatsapp || '-',
              WhatsApp: p.nomor_whatsapp || '-',
              Email: p.email_plataran_sehat || '-',
              Alamat: p.alamat_rumah || '-',
              'Judul Kegiatan': p.judul_kegiatan || '-',
              Status: p.status || 'pending',
              created_at: p.created_at
            };
          });
          
          resolve({
            success: true,
            data: {
              indikator: (result.indikator || []).map(function(ind) {
                return {
                  id: ind.id,
                  label: ind.indikator,
                  value: ind.nilai,
                  target: ind.target,
                  unit: ind.satuan,
                  desc: ind.deskripsi,
                  source: 'Nhost'
                };
              }),
              summary: {
                totalSDMK: result.sdmk_aggregate?.aggregate?.count || 0,
                totalPendaftar: result.pendaftaran_aggregate?.aggregate?.count || 0,
                totalSertifikat: result.sertifikat_aggregate?.aggregate?.count || 0,
                totalPengumuman: pengumumanData.length,
                // Detailed statistics for stat cards
                dokter: dokterCount,
                perawat: perawatCount,
                bidan: bidanCount,
                nakesLainnya: nakesLainCount,
                pns: pnsCount,
                pppk: pppkCount,
                nonAsn: nonAsnCount,
                laki: lakiCount,
                perempuan: perempuanCount
              },
              allSdmk: mappedSdmk,
              allPendaftaran: mappedPendaftaran,
              recentRegistrations: mappedPendaftaran.slice(0, 10)
            }
          });
          break;

        case 'getPengumuman':
          result = await graphqlRequest('GetPengumuman', GRAPHQL_QUERIES.getPengumuman, {
            order: { created_at: 'desc_nulls_last' }
          });
          resolve({ success: true, data: (result.pengumuman || []).map(p => ({
            ID: p.id, Judul: p.judul, Isi: p.isi_pengumuman,
            Tanggal: p.tanggal ? p.tanggal.split('T')[0] : '',
            Status: p.status === 'published' ? 'Aktif' : p.status
          })) });
          break;

        case 'getSDMK':
          result = await graphqlRequest('GetSDMK', GRAPHQL_QUERIES.getSDMK, {
            order: { created_at: 'desc_nulls_last' }
          });
          resolve({ success: true, data: (result.sdmk || []).map(s => ({
            ID: s.id, Foto: s.foto, 'Nama Lengkap dengan Gelar': s.nama, Nama: s.nama,
            'NIK/NIP': s.nik, NIK: s.nik, Profesi: s.profesi, 'Unit Kerja': s.unit_kerja,
            Unit_Kerja: s.unit_kerja, 'No. Sertifikat': s.nomor_sertifikat, Nomor_Sertifikat: s.nomor_sertifikat,
            'Judul Kegiatan': s.judul_kegiatan, 'Tgl Pelaksanaan': s.tanggal_pelaksanaan,
            Tahun: String(s.tahun || ''), Tempat: s.tempat_pelaksanaan, 'Status Pelatihan': 'Lulus'
          })) });
          break;

        case 'getPendaftaran':
          // Gunakan filter berdasarkan role (user hanya lihat data NIK sendiri)
          var pendaftaranFilter = getUserDataFilter('pendaftaran');
          var pendaftaranVars = {
            order: { created_at: 'desc_nulls_last' }
          };
          
          // Jika ada filter (role user), tambahkan ke variables
          if (pendaftaranFilter) {
            pendaftaranVars.where = pendaftaranFilter;
            console.log('[FILTER] Pendaftaran filter applied:', pendaftaranFilter);
          }
          
          result = await graphqlRequest('GetPendaftaran', GRAPHQL_QUERIES.getPendaftaran, pendaftaranVars);
          resolve({ success: true, data: (result.pendaftaran || []).map(p => ({
            ID: p.id, Foto: p.foto, 'Nama Lengkap dengan Gelar': p.nama_lengkap_dengan_gelar,
            NIK: p.nik, NIP: p.nip, 'Unit Kerja': p.unit_kerja, 'Jenis SDMK': p.jenis_sdmk,
            'Jenis Profesi': p.jenis_profesi, Pekerjaan: p.pekerjaan, 'Jenis Kelamin': p.jenis_kelamin,
            'Tempat dan Tanggal Lahir': p.tempat_dan_tanggal_lahir, Email: p.email_plataran_sehat,
            'Lama Bekerja di Unit Sekarang': p.lama_bekerja_di_unit_sekarang, WhatsApp: p.nomor_whatsapp,
            'Alamat Rumah': p.alamat_rumah, 'Surat Pernyataan': p.surat_pernyataan,
            'Judul Kegiatan': p.judul_kegiatan, Status: p.status,
            'Tanggal Pendaftaran': p.created_at ? p.created_at.split('T')[0] : '',
            'Tanggal Update': p.updated_at ? p.updated_at.split('T')[0] : '',
            'Catatan Admin': p.catatan_admin || ''
          })) });
          break;

        case 'getSertifikat':
          result = await graphqlRequest('GetSertifikat', GRAPHQL_QUERIES.getSertifikat, {
            order: { tanggal_terbit: 'desc_nulls_last' }
          });
          resolve({ success: true, data: (result.sertifikat || []).map(s => ({
            ID: s.id, 'Nomor Sertifikat': s.nomor_sertifikat, 'Nama Penerima': s.nama_penerima,
            'Judul Pelatihan': s.judul_pelatihan, 'Tanggal Terbit': s.tanggal_terbit ? s.tanggal_terbit.split('T')[0] : '',
            'Link/File': s.link_sertifikat
          })) });
          break;

        case 'getMateri':
          result = await graphqlRequest('GetMateri', GRAPHQL_QUERIES.getMateri, {
            order: { created_at: 'desc_nulls_last' }
          });
          resolve({ success: true, data: (result.materi || []).map(m => ({
            ID: m.id, 'Judul Materi': m.judul_materi, Kategori: m.kategori,
            'Link Download': m.link_download, Deskripsi: m.deskripsi
          })) });
          break;

        case 'cekPendaftaran':
          // Query berdasarkan NIK untuk Cek Pendaftaran
          var cekNik = data.nik || data.NIK || data.nik || '';
          if (!cekNik) { reject(new Error('NIK diperlukan untuk pencarian pendaftaran')); return; }
          
          result = await graphqlRequest('CekPendaftaran', GRAPHQL_QUERIES.cekPendaftaran, { nik: cekNik });
          resolve({ 
            success: true, 
            data: (result.pendaftaran || []).map(p => ({
              ID: p.id,
              Foto: p.foto,
              'Nama Lengkap dengan Gelar': p.nama_lengkap_dengan_gelar,
              NIK: p.nik,
              NIP: p.nip,
              'Unit Kerja': p.unit_kerja,
              'Jenis SDMK': p.jenis_sdmk,
              'Jenis Profesi': p.jenis_profesi,
              'Status Pekerjaan': p.pekerjaan,
              'Jenis Kelamin': p.jenis_kelamin,
              'Tempat dan Tanggal Lahir': p.tempat_dan_tanggal_lahir,
              'Email Plataran Sehat': p.email_plataran_sehat,
              'Lama Bekerja di Unit Sekarang': p.lama_bekerja_di_unit_sekarang,
              'No. WhatsApp / Telepon': p.nomor_whatsapp,
              'Alamat Rumah': p.alamat_rumah,
              'Surat Pernyataan': p.surat_pernyataan,
              'Judul Kegiatan': p.judul_kegiatan,
              Status: p.status,
              'Tanggal Pendaftaran': p.created_at ? p.created_at.split('T')[0] : '',
              'Tanggal Update': p.updated_at ? p.updated_at.split('T')[0] : '',
              'Catatan Admin': p.catatan_admin || ''
            }))
          });
          break;

        case 'getAdmin':
        case 'getMultiusers':
          result = await graphqlRequest('GetMultiusers', GRAPHQL_QUERIES.getMultiusers);
          resolve({ success: true, data: (result.multiusers || []).map(u => ({
            ID: u.id, Username: u.username, Password: '********',
            Level: u.level.charAt(0).toUpperCase() + u.level.slice(1), Status: u.status
          })) });
          break;

        case 'getIndikator':
          result = await graphqlRequest('GetIndikator', GRAPHQL_QUERIES.getIndikator);
          resolve({ success: true, data: result.indikator || [] });
          break;

        // === INDIKATOR CRUD (Previously Missing!) ===
        case 'tambahIndikator':
          console.log('[ADMIN] CREATE Indikator:', data);
          await graphqlRequest('InsertIndikator', GRAPHQL_QUERIES.insertIndikator, {
            object: { 
              indikator: data.indikator || data.Indikator, 
              nilai: data.nilai !== undefined ? parseFloat(data.nilai) : null,
              target: data.target !== undefined ? parseFloat(data.target) : null,
              satuan: data.satuan || data.Satuan || 'Orang',
              periode: data.periode || data.Periode || null
            }
          });
          resolve({ success: true, message: 'Indikator berhasil ditambahkan' });
          break;

        case 'updateIndikator':
          console.log('[ADMIN] UPDATE Indikator:', data);
          const indikatorId = data.id || _allIndikator?.[data.idx]?.id;
          if (!indikatorId) { reject(new Error('ID Indikator tidak ditemukan')); return; }
          await graphqlRequest('UpdateIndikator', GRAPHQL_QUERIES.updateIndikator, {
            id: indikatorId,
            object: { 
              indikator: data.indikator, 
              nilai: data.nilai !== undefined ? parseFloat(data.nilai) : null,
              target: data.target !== undefined ? parseFloat(data.target) : null,
              satuan: data.satuan, 
              periode: data.periode 
            }
          });
          resolve({ success: true, message: 'Indikator berhasil diperbarui' });
          break;

        case 'deleteIndikator':
          console.log('[ADMIN] DELETE Indikator:', data);
          const delIndikatorId = data.id || _allIndikator?.[data.idx]?.id;
          if (!delIndikatorId) { reject(new Error('ID Indikator tidak ditemukan')); return; }
          await graphqlRequest('DeleteIndikator', GRAPHQL_QUERIES.deleteIndikator, { id: delIndikatorId });
          resolve({ success: true, message: 'Indikator berhasil dihapus' });
          break;

        // CREATE OPERATIONS
        case 'tambahPengumuman':
          await graphqlRequest('InsertPengumuman', GRAPHQL_QUERIES.insertPengumuman, {
            object: { judul: data.Judul, isi_pengumuman: data.Isi, tanggal: data.Tanggal,
              status: (data.Status || 'Aktif').toLowerCase() === 'aktif' ? 'published' : data.Status?.toLowerCase() }
          });
          resolve({ success: true, message: 'Pengumuman berhasil ditambahkan' });
          break;

        case 'tambahSDMK':
          // Gunakan field names SESUAI tabel sdmk Nhost/Hasura
          await graphqlRequest('InsertSDMK', GRAPHQL_QUERIES.insertSDMK, {
            object: {
              foto: data.foto || null,
              nama: data.nama,
              nik: data.nik,
              profesi: data.profesi,
              unit_kerja: data.unit_kerja,
              nomor_sertifikat: data.nomor_sertifikat,
              judul_kegiatan: data.judul_kegiatan,
              tanggal_pelaksanaan: data.tanggal_pelaksanaan,
              tahun: data.tahun ? parseInt(data.tahun) : null,
              tempat_pelaksanaan: data.tempat_pelaksanaan
            }
          });
          resolve({ success: true, message: 'Data SDMK berhasil ditambahkan' });
          break;

        case 'tambahPendaftaran':
          await graphqlRequest('InsertPendaftaran', GRAPHQL_QUERIES.insertPendaftaran, {
            object: { 
              foto: data.Foto || null, 
              nama_lengkap_dengan_gelar: data['Nama Lengkap dengan Gelar'],
              nik: data.NIK, 
              nip: data.NIP, 
              unit_kerja: data['Unit Kerja'], 
              jenis_sdmk: data['Jenis SDMK'],
              jenis_profesi: data['Jenis Profesi'], 
              pekerjaan: data.Pekerjaan || data['Status Pekerjaan'],
              jenis_kelamin: data['Jenis Kelamin'],
              tempat_dan_tanggal_lahir: data['Tempat dan Tanggal Lahir'], 
              email_plataran_sehat: data.Email || data['Email Plataran Sehat'],
              lama_bekerja_di_unit_sekarang: data['Lama Bekerja'] || data['Lama Bekerja di Unit Sekarang'],
              nomor_whatsapp: data.WhatsApp || data['Nomor WhatsApp / Telepon'] || data.Kontak,
              alamat_rumah: data['Alamat Rumah'], 
              surat_pernyataan: data['Surat Pernyataan'],
              judul_kegiatan: data['Judul Kegiatan'], 
              status: 'pending',
              catatan_admin: data['Catatan Admin'] || data.catatan_admin || null  // ✅ TAMBAHAN
            }
          });
          resolve({ success: true, message: 'Pendaftaran berhasil dikirim' });
          break;

        case 'tambahSertifikat':
          await graphqlRequest('InsertSertifikat', GRAPHQL_QUERIES.insertSertifikat, {
            object: { nomor_sertifikat: data['Nomor Sertifikat'], nama_penerima: data['Nama Penerima'],
              judul_pelatihan: data['Judul Pelatihan'], tanggal_terbit: data['Tanggal Terbit'],
              link_sertifikat: data['Link/File'] || data.Link }
          });
          resolve({ success: true, message: 'Sertifikat berhasil ditambahkan' });
          break;

        case 'tambahMateri':
          await graphqlRequest('InsertMateri', GRAPHQL_QUERIES.insertMateri, {
            object: { judul_materi: data['Judul Materi'], kategori: data.Kategori,
              link_download: data['Link Download'] || data.Link, deskripsi: data.Deskripsi }
          });
          resolve({ success: true, message: 'Materi berhasil ditambahkan' });
          break;

        case 'tambahAdmin':
        case 'tambahMultiuser':
          await graphqlRequest('InsertMultiuser', GRAPHQL_QUERIES.insertMultiuser, {
            object: { username: data.Username, password: data.Password,
              level: data.Level?.toLowerCase() || 'user', status: 'active' }
          });
          resolve({ success: true, message: 'Admin berhasil ditambahkan' });
          break;

        // UPDATE OPERATIONS
        case 'updatePengumuman':
          const pengumumanId = _allPengumuman[data.idx]?.ID || data.idx;
          await graphqlRequest('UpdatePengumuman', GRAPHQL_QUERIES.updatePengumuman, {
            id: pengumumanId, object: { judul: data.Judul, isi_pengumuman: data.Isi,
              tanggal: data.Tanggal, status: (data.Status || 'Aktif').toLowerCase() === 'aktif' ? 'published' : data.Status?.toLowerCase() }
          });
          resolve({ success: true, message: 'Pengumuman berhasil diperbarui' });
          break;

        case 'updateSDMK':
          const sdmkId = _allSDMK[data.idx]?.id || _allSDMK[data.idx]?.ID || data.idx;
          // Gunakan field names SESUAI tabel sdmk Nhost/Hasura
          await graphqlRequest('UpdateSDMK', GRAPHQL_QUERIES.updateSDMK, {
            id: sdmkId,
            object: {
              foto: data.foto,
              nama: data.nama,
              nik: data.nik,
              profesi: data.profesi,
              unit_kerja: data.unit_kerja,
              nomor_sertifikat: data.nomor_sertifikat,
              judul_kegiatan: data.judul_kegiatan,
              tanggal_pelaksanaan: data.tanggal_pelaksanaan,
              tahun: data.tahun ? parseInt(data.tahun) : undefined,
              tempat_pelaksanaan: data.tempat_pelaksanaan
            }
          });
          resolve({ success: true, message: 'Data SDMK berhasil diperbarui' });
          break;

        case 'updatePendaftaran':
          // ✅ PERBAIKAN KRITIS: Extract nested data object
          // doSaveCrud mengirim {idx: idx, data: formData}
          // Handler harus extract data.data untuk mendapatkan field-field sebenarnya
          var actualIdx = data.idx !== undefined ? data.idx : data;
          var formData = data.data || data;  // Extract nested data if exists
          
          console.log('[UPDATE] === PENDAFTARAN UPDATE START ===');
          console.log('[UPDATE] actualIdx:', actualIdx);
          console.log('[UPDATE] Has nested data:', !!data.data);
          console.log('[UPDATE] Raw parameter:', JSON.stringify(data).substring(0, 200));
          console.log('[UPDATE] Form data keys:', Object.keys(formData));
          
          // Ambil ID dari data (bisa id atau ID)
          const pendaftaranId = _crud.allData[actualIdx]?.id || _crud.allData[actualIdx]?.ID || actualIdx;
          
          console.log('[UPDATE] pendaftaranId:', pendaftaranId);
          console.log('[UPDATE] _crud.allData[idx]:', _crud.allData[actualIdx]);
          
          // Build object dengan SEMUA field yang valid (sesuai schema Nhost/Hasura)
          var pendaftaranUpdate = {};
          
          // Field yang boleh diupdate (HARUS SESUAI SCHEMA DATABASE EXACT!)
          var allowedFields = [
            'nama_lengkap_dengan_gelar', 'nik', 'nip', 'unit_kerja',
            'jenis_sdmk', 'jenis_profesi', 'pekerjaan', 'jenis_kelamin',
            'tempat_dan_tanggal_lahir', 'email_plataran_sehat',
            'alamat_rumah', 'lama_bekerja_di_unit_sekarang',
            'surat_pernyataan', 'judul_kegiatan', 'status',
            'catatan_admin'
          ];
          
          // ✅ PERBAIKAN KRITIS: Support BOTH display names AND DB column names
          // Form mengirim data dengan key sesuai _crud.headers (DB column names)
          // Tapi bisa juga dapat display names dari sumber lain
          var fieldMapping = {
            // Display names → DB column names
            'Nama Lengkap dengan Gelar': 'nama_lengkap_dengan_gelar',
            'NIK': 'nik', 'NIP': 'nip',
            'Unit Kerja': 'unit_kerja',
            'Jenis SDMK': 'jenis_sdmk',
            'Jenis Profesi': 'jenis_profesi',
            'Pekerjaan': 'pekerjaan',
            'Status Pekerjaan': 'pekerjaan',
            'Jenis Kelamin': 'jenis_kelamin',
            'Tempat dan Tanggal Lahir': 'tempat_dan_tanggal_lahir',
            'Email Plataran Sehat': 'email_plataran_sehat',
            'Email': 'email_plataran_sehat',
            'Alamat Rumah': 'alamat_rumah',
            'Lama Bekerja': 'lama_bekerja_di_unit_sekarang',
            'Lama Bekerja di Unit Sekarang': 'lama_bekerja_di_unit_sekarang',
            'Surat Pernyataan': 'surat_pernyataan',
            'Judul Kegiatan': 'judul_kegiatan',
            'Status': 'status',
            'Catatan Admin': 'catatan_admin',
            'Catatan': 'catatan_admin',
            // DB column names → DB column names (direct pass-through untuk key yang sudah benar)
            'nama_lengkap_dengan_gelar': 'nama_lengkap_dengan_gelar',
            'nik': 'nik',
            'nip': 'nip',
            'unit_kerja': 'unit_kerja',
            'jenis_sdmk': 'jenis_sdmk',
            'jenis_profesi': 'jenis_profesi',
            'pekerjaan': 'pekerjaan',
            'jenis_kelamin': 'jenis_kelamin',
            'tempat_dan_tanggal_lahir': 'tempat_dan_tanggal_lahir',
            'email_plataran_sehat': 'email_plataran_sehat',
            'alamat_rumah': 'alamat_rumah',
            'lama_bekerja_di_unit_sekarang': 'lama_bekerja_di_unit_sekarang',
            'surat_pernyataan': 'surat_pernyataan',
            'judul_kegiatan': 'judul_kegiatan',
            'status': 'status',
            'catatan_admin': 'catatan_admin'
          };
          
          // Internal fields yang harus di-skip
          var skipFields = ['_user', 'idx', 'ID', 'id', 'created_at', 'updated_at', 
                           'Diubah Oleh', 'Tanggal Ubah Status', 'Tanggal Perbaikan',
                           'Catatan Status', 'foto'];
          
          // Proses setiap field dari formData (bukan 'data' yang berisi wrapper object)
          Object.keys(formData).forEach(function(key) {
            // Skip internal fields
            if (skipFields.includes(key)) {
              console.log('[UPDATE] SKIP internal field:', key);
              return;
            }
            
            // Cari nama field yang sesusi (prioritaskan mapping)
            var dbField = fieldMapping[key];
            
            // Jika tidak ada di mapping, coba konversi otomatis (lowercase + underscore)
            if (!dbField) {
              dbField = key.toLowerCase()
                .replace(/ /g, '_')
                .replace(/\//g, '_')
                .replace(/[^a-z0-9_]/g, '');
              console.log('[UPDATE] Auto-convert key:', key, '→', dbField);
            } else {
              console.log('[UPDATE] Mapped key:', key, '→', dbField);
            }
            
            // ✅ Hanya tambahkan jika field ada di allowedFields
            if (allowedFields.includes(dbField)) {
              var value = formData[key];  // ✅ GUNAKAN formData, bukan data
              
              // Debug value
              console.log('[UPDATE] Processing:', key, '→', dbField, '= ', value, '(type:', typeof value, ')');
              
              // Normalisasi value
              if (value === null || value === undefined) {
                console.log('[UPDATE] SKIP null/undefined value for:', dbField);
                return; // Skip null/undefined
              }
              
              if (typeof value === 'string') {
                value = value.trim();
              } else if (typeof value !== 'number' && typeof value !== 'boolean') {
                value = String(value).trim();
              }
              
              // ✅ KRITIS: Include value meskipun empty string (untuk clear field)
              // Kecuali jika value benar-benar kosong setelah trim
              if (value !== '') {
                pendaftaranUpdate[dbField] = value;
                console.log('[UPDATE] ✅ ADDED:', dbField, '=', value);
              } else {
                console.log('[UPDATE] ⚠️ SKIP empty value for:', dbField);
              }
            } else {
              console.log('[UPDATE] ❌ NOT in allowedFields:', dbField, '(from key:', key, ')');
            }
          });
          
          // ✅ Handle STATUS - normalize ke nilai valid Hasura (gunakan formData)
          var statusVal = formData.Status || formData.status || '';
          if (statusVal) {
            statusVal = String(statusVal).toLowerCase().trim();
            var validStatuses = ['pending', 'approved', 'rejected', 'verified'];
            if (validStatuses.includes(statusVal)) {
              pendaftaranUpdate.status = statusVal;
            } else if (statusVal === 'aktif' || statusVal === 'active') {
              pendaftaranUpdate.status = 'approved';
            } else if (statusVal === 'ditolak') {
              pendaftaranUpdate.status = 'rejected';
            } else if (statusVal === 'menunggu') {
              pendaftaranUpdate.status = 'pending';
            } else if (statusVal === 'proses verifikasi') {
              pendaftaranUpdate.status = 'verified';
            } else {
              pendaftaranUpdate.status = 'pending';
            }
            console.log('[UPDATE] Status normalized →', pendaftaranUpdate.status);
          }
          
          // ✅ Handle CATATAN_ADMIN - khusus handle untuk memastikan ter-capture (gunakan formData)
          // Cek semua kemungkinan key name untuk catatan_admin
          var catatanVal = formData['Catatan Admin'] || formData.catatan_admin || formData.Catatan || formData['catatan_admin'] || '';
          console.log('[UPDATE] 🔍 DEBUG catatan_admin sources:');
          console.log('  - formData["Catatan Admin"]:', formData['Catatan Admin']);
          console.log('  - formData.catatan_admin:', formData.catatan_admin);
          console.log('  - formData.Catatan:', formData.Catatan);
          console.log('  - Final catatanVal:', catatanVal);
          
          // ✅ PERBAIKAN: Handle catatan_admin dengan lebih robust
          // Selalu coba kirim catatan_admin jika ada nilainya (termasuk string kosong untuk clear)
          var catatanFieldExists = formData.hasOwnProperty('catatan_admin') || 
                                   formData.hasOwnProperty('Catatan Admin') || 
                                   formData.hasOwnProperty('Catatan');
          var catatanStrVal = String(catatanVal || '').trim();
          
          if (catatanStrVal) {
            // Ada nilai → kirim ke database
            pendaftaranUpdate.catatan_admin = catatanStrVal;
            console.log('[UPDATE] ✅ Catatan Admin ADDED →', pendaftaranUpdate.catatan_admin);
          } else if (catatanFieldExists) {
            // Field ada tapi kosong/hanya whitespace → log info saja (tidak perlu kirim kosong)
            console.log('[UPDATE] ℹ️ Catatan Admin field exists but empty/whitespace-only');
          } else {
            console.log('[UPDATE] ⚠️ Catatan Admin NOT FOUND in formData');
          }
          
          console.log('[UPDATE] === FINAL RESULT ===');
          console.log('[UPDATE] Final pendaftaranUpdate:', pendaftaranUpdate);
          console.log('[UPDATE] Pendaftaran fields count:', Object.keys(pendaftaranUpdate).length);
          console.log('[UPDATE] Pendaftaran fields:', Object.keys(pendaftaranUpdate));
          
          // ✅ SANITASI KRITIS: Hapus semua nilai undefined/null sebelum kirim ke GraphQL
          // Hasura akan error "unexpected variables" jika ada value undefined/null
          var sanitizedUpdate = {};
          Object.keys(pendaftaranUpdate).forEach(function(key) {
            var val = pendaftaranUpdate[key];
            if (val !== undefined && val !== null) {
              // Pastikan string kosong juga di-skip (Hasura tidak terima "" untuk field required)
              if (typeof val === 'string' && val.trim() === '') {
                console.log('[UPDATE] ⚠️ SANITIZE: Removing empty string for', key);
                return;
              }
              // ✅ Cek apakah value adalah object (bukan scalar) - SKIP jika iya
              // Dalam pendaftaran_update, semua values harus scalar (string/number/boolean)
              if (typeof val === 'object' && !Array.isArray(val)) {
                console.warn('[UPDATE] ⚠️ Skipping object value for:', key, '(values must be scalar)');
                return; 
              }
              sanitizedUpdate[key] = val;
              console.log('[UPDATE] ✅ SANITIZED:', key, '=', typeof val, 
                typeof val === 'string' ? '"' + val.substring(0, 30) + '"' : val);
            } else {
              console.log('[UPDATE] ❌ SANITIZE: Removing null/undefined for', key);
            }
          });
          
          console.log('[UPDATE] === SANITIZED OBJECT ===');
          console.log('[UPDATE] Sanitized update:', JSON.stringify(sanitizedUpdate, null, 2));
          console.log('[UPDATE] Sanitized keys:', Object.keys(sanitizedUpdate));
          
          // ✅ VALIDASI: Pastikan object tidak kosong setelah sanitasi
          if (Object.keys(sanitizedUpdate).length === 0) {
            resolve({ success: false, message: 'Tidak ada data yang valid untuk disimpan' });
            break;
          }
          
          await graphqlRequest('UpdatePendaftaran', GRAPHQL_QUERIES.updatePendaftaran, {
            id: pendaftaranId,
            object: sanitizedUpdate  // ✅ Gunakan sanitized object
          });
          resolve({ success: true, message: 'Data Pendaftaran berhasil diperbarui' });
          break;

        case 'updateAdmin':
        case 'updateMultiuser':
          const adminId = _allAdmin[data.idx]?.ID || data.idx;
          const adminUpdateObj = { level: data.Level?.toLowerCase() };
          if (data.Password) adminUpdateObj.password = data.Password;
          await graphqlRequest('UpdateMultiuser', GRAPHQL_QUERIES.updateMultiuser, { id: adminId, object: adminUpdateObj });
          resolve({ success: true, message: 'Admin berhasil diperbarui' });
          break;

        case 'updateSertifikat':
          const sertifikatId = _crud.allData[data.idx]?.ID || data.idx;
          await graphqlRequest('UpdateSertifikat', GRAPHQL_QUERIES.updateSertifikat, {
            id: sertifikatId, object: { nomor_sertifikat: data['Nomor Sertifikat'],
              nama_penerima: data['Nama Penerima'], judul_pelatihan: data['Judul Pelatihan'],
              tanggal_terbit: data['Tanggal Terbit'], link_sertifikat: data['Link/File'] || data.Link }
          });
          resolve({ success: true, message: 'Sertifikat berhasil diperbarui' });
          break;

        case 'updateMateri':
          const materiId = _crud.allData[data.idx]?.ID || data.idx;
          await graphqlRequest('UpdateMateri', GRAPHQL_QUERIES.updateMateri, {
            id: materiId, object: { judul_materi: data['Judul Materi'], kategori: data.Kategori,
              link_download: data['Link Download'] || data.Link, deskripsi: data.Deskripsi }
          });
          resolve({ success: true, message: 'Materi berhasil diperbarui' });
          break;

        // DELETE OPERATIONS
        case 'hapusPengumuman':
          await graphqlRequest('DeletePengumuman', GRAPHQL_QUERIES.deletePengumuman, {
            id: _allPengumuman[data.idx]?.ID || _allPengumuman[data.idx]?.id || data.idx
          });
          resolve({ success: true, message: 'Pengumuman berhasil dihapus' });
          break;

        case 'hapusSDMK':
          await graphqlRequest('DeleteSDMK', GRAPHQL_QUERIES.deleteSDMK, {
            id: _allSDMK[data.idx]?.ID || _allSDMK[data.idx]?.id || data.idx
          });
          resolve({ success: true, message: 'Data SDMK berhasil dihapus' });
          break;

        case 'hapusPendaftaran':
          await graphqlRequest('DeletePendaftaran', GRAPHQL_QUERIES.deletePendaftaran, {
            id: _crud.allData[data.idx]?.ID || _crud.allData[data.idx]?.id || data.idx
          });
          resolve({ success: true, message: 'Pendaftaran berhasil dihapus' });
          break;

        case 'hapusSertifikat':
          await graphqlRequest('DeleteSertifikat', GRAPHQL_QUERIES.deleteSertifikat, {
            id: _crud.allData[data.idx]?.ID || _crud.allData[data.idx]?.id || data.idx
          });
          resolve({ success: true, message: 'Sertifikat berhasil dihapus' });
          break;

        case 'hapusMateri':
          await graphqlRequest('DeleteMateri', GRAPHQL_QUERIES.deleteMateri, {
            id: _crud.allData[data.idx]?.ID || _crud.allData[data.idx]?.id || data.idx
          });
          resolve({ success: true, message: 'Materi berhasil dihapus' });
          break;

        case 'hapusAdmin':
        case 'hapusMultiuser':
          await graphqlRequest('DeleteMultiuser', GRAPHQL_QUERIES.deleteMultiuser, {
            id: _allAdmin[data.idx]?.ID || _allAdmin[data.idx]?.id || data.idx
          });
          resolve({ success: true, message: 'Admin berhasil dihapus' });
          break;

        case 'checkDuplicateSDMK':
        case 'checkDuplicatePendaftaran':
          resolve({ duplicate: false, message: 'Tidak ada duplikasi' });
          break;

        // VALIDATE ADMIN LOGIN - Enhanced version with full logging
        case 'validateAdminLogin':
          try {
            console.log('%c[AUTH] Starting login process...', 'color: blue; font-weight: bold;');
            console.log('[AUTH] Input username:', JSON.stringify(data.username));
            console.log('[AUTH] Input password length:', data.password ? data.password.length : 0);
            
            // CRITICAL: Fetch ALL fields including password for comparison
            result = await graphqlRequest('GetAllUsersForAuth', `
              query GetAllUsersForAuth {
                multiusers {
                  id
                  username
                  password
                  level
                  status
                  created_at
                }
              }
            `);
            
            const users = result.multiusers || [];
            
            console.log('%c[AUTH] Database query complete', 'color: green;');
            console.log('[AUTH] Total users in DB:', users.length);
            console.table(users.map(u => ({
              username: u.username,
              password_preview: (u.password || '').substring(0, 3) + '***',
              level: u.level,
              status: u.status
            })));
            
            let adminUser = null;
            let matchReason = '';
            
            // STRATEGY 1: Exact match (most strict)
            console.log('[AUTH] Strategy 1: Exact match...');
            adminUser = users.find(u => 
              String(u.username || '') === String(data.username || '') && 
              String(u.password || '') === String(data.password || '') && 
              String(u.status || '') === 'active'
            );
            if (adminUser) { matchReason = 'EXACT_MATCH'; console.log('[AUTH] ✓ Strategy 1 SUCCESS'); }
            
            // STRATEGY 2: Case-insensitive username
            if (!adminUser) {
              console.log('[AUTH] Strategy 2: Case-insensitive username...');
              adminUser = users.find(u => 
                String(u.username || '').toLowerCase() === String(data.username || '').toLowerCase() && 
                String(u.password || '') === String(data.password || '') && 
                String(u.status || '') === 'active'
              );
              if (adminUser) { matchReason = 'CASE_INSENSITIVE'; console.log('[AUTH] ✓ Strategy 2 SUCCESS'); }
            }
            
            // STRATEGY 3: Trim whitespace
            if (!adminUser) {
              console.log('[AUTH] Strategy 3: Trimmed values...');
              adminUser = users.find(u => 
                String(u.username || '').trim() === String(data.username || '').trim() && 
                String(u.password || '').trim() === String(data.password || '').trim() && 
                String(u.status || '').trim() === 'active'
              );
              if (adminUser) { matchReason = 'TRIMMED'; console.log('[AUTH] ✓ Strategy 3 SUCCESS'); }
            }
            
            // STRATEGY 4: Compare char by char (for hidden characters)
            if (!adminUser) {
              console.log('[AUTH] Strategy 4: Character analysis...');
              const similarUser = users.find(u => 
                String(u.username || '').toLowerCase().includes(String(data.username || '').toLowerCase()) ||
                String(data.username || '').toLowerCase().includes(String(u.username || '').toLowerCase())
              );
              
              if (similarUser) {
                console.log('[AUTH] Similar user found, analyzing differences:');
                console.log('[AUTH] DB username chars:', [...(similarUser.username || '')].map(c => c.charCodeAt(0)));
                console.log('[AUTH] Input username chars:', [...(data.username || '')].map(c => c.charCodeAt(0)));
                console.log('[AUTH] DB password chars:', [...(similarUser.password || '')].map(c => c.charCodeAt(0)));
                console.log('[AUTH] Input password chars:', [...(data.password || '')].map(c => c.charCodeAt(0)));
              }
            }
            
            if (adminUser) {
              console.log('%c[AUTH] ✅ LOGIN SUCCESS!', 'color: green; font-size: 16px; font-weight: bold;');
              console.log('[AUTH] Match reason:', matchReason);
              console.log('[AUTH] Logged in as:', adminUser.username, '(' + adminUser.level + ')');
              
              // Store session
              sessionStorage.setItem('pamungkas_admin_level', adminUser.level);
              sessionStorage.setItem('pamungkas_admin_user', adminUser.username);
              
              resolve({ 
                success: true, 
                username: adminUser.username, 
                level: adminUser.level,
                message: 'Login berhasil'
              });
            } else {
              console.log('%c[AUTH] ❌ LOGIN FAILED', 'color: red; font-size: 16px; font-weight: bold;');
              
              // Detailed failure analysis
              const inputUserLower = String(data.username || '').toLowerCase();
              const dbUser = users.find(u => String(u.username || '').toLowerCase() === inputUserLower);
              
              if (dbUser) {
                console.log('[AUTH] Failure analysis: USER EXISTS but credentials invalid');
                console.log('[AUTH] DB password:', JSON.stringify(dbUser.password));
                console.log('[AUTH] Input password:', JSON.stringify(data.password));
                console.log('[AUTH] Passwords equal?', dbUser.password === data.password);
                
                if (dbUser.status !== 'active') {
                  resolve({ success: false, message: 'Akun "' + dbUser.username + '" tidak aktif. Status: ' + dbUser.status });
                } else {
                  resolve({ success: false, message: 'Password salah untuk user "' + data.username + '". Periksa spasi atau karakter tersembunyi.' });
                }
              } else {
                console.log('[AUTH] Failure analysis: USERNAME NOT FOUND');
                console.log('[AUTH] Available usernames:', users.map(u => '"' + u.username + '"'));
                
                resolve({ 
                  success: false, 
                  message: 'Username "' + data.username + '" tidak ditemukan. User tersedia: ' + users.map(u => u.username).join(', ')
                });
              }
            }
          } catch (loginError) {
            console.error('[AUTH] System error:', loginError);
            reject(loginError);
          }
          break;

        // === IMPORT OPERATIONS (Legacy Import Modal) ===
        case 'importPendaftaran': {
          console.log('[IMPORT] Starting legacy import for', data.rows?.length || 0, 'records');
          
          if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
            reject(new Error('Tidak ada data untuk di-import'));
            break;
          }
          
          let importSuccess = 0;
          let importFailed = 0;
          let importSkipped = 0;  // For duplicates
          const importErrors = [];
          const legacyNikSet = new Set();  // Track NIK to detect duplicates
          const legacyEmailSet = new Set();  // Track email to detect duplicates
          
          // Process each row
          for (let i = 0; i < data.rows.length; i++) {
            try {
              const row = data.rows[i];
              
              // Extract and normalize fields according to DATABASE SCHEMA
              const nik = String(row.nik || row.NIK || row['NIK/NIP'] || '').trim();
              const email = String(row.email || row.Email || row.email_plataran_sehat || '').trim();
              
              // Check for duplicate NIK in this batch
              if (nik && legacyNikSet.has(nik)) {
                importSkipped++;
                importErrors.push({ 
                  row: i + 1, 
                  error: 'NIK duplikat dalam file ini', 
                  data: { nik }
                });
                console.warn('[IMPORT] Skipping duplicate NIK in batch:', nik, 'row:', i + 1);
                continue;  // Skip this row
              }
              
              // Check for duplicate email in this batch
              if (email && legacyEmailSet.has(email)) {
                importSkipped++;
                importErrors.push({ 
                  row: i + 1, 
                  error: 'Email duplikat dalam file ini', 
                  data: { email }
                });
                console.warn('[IMPORT] Skipping duplicate email in batch:', email, 'row:', i + 1);
                continue;  // Skip this row
              }
              
              // Build object matching EXACT database schema
              const pendaftaranObject = {
                // Required fields (NOT NULL in DB)
                nama_lengkap_dengan_gelar: String(
                  row.nama_lengkap || row.Nama || row['Nama Lengkap dengan Gelar'] || ''
                ).trim() || 'Tidak Diketahui',
                
                nik: nik,
                
                unit_kerja: String(
                  row.unit_kerja || row.unitKerja || row['Unit Kerja'] || row.unit || ''
                ).trim() || 'Belum Ditentukan',
                
                judul_kegiatan: String(
                  row.judul_kegiatan || row['Judul Kegiatan'] || row.kegiatan || 'Pelatihan SDMK'
                ).trim(),
                
                // Optional fields
                nip: String(row.nip || row.NIP || '').trim() || null,
                jenis_kelamin: String(
                  row.jenis_kelamin || row.kelamin || row['Jenis Kelamin'] || ''
                ).trim() || null,
                
                tempat_dan_tanggal_lahir: [
                  String(row.tempat_lahir || row.Tempat_Lahir || ''),
                  String(row.tanggal_lahir || row.Tanggal_Lahir || '')
                ].filter(Boolean).join(', ') || null,
                
                email_plataran_sehat: email || null,
                nomor_whatsapp: String(
                  row.nomor_whatsapp || row.whatsapp || row.no_telepon || row.telepon || row['No Telepon'] || ''
                ).trim() || null,
                
                alamat_rumah: String(
                  row.alamat_rumah || row.alamat || row.Alamat || row['Alamat Rumah'] || ''
                ).trim() || null,
                
                jenis_sdmk: String(
                  row.jenis_sdmk || row['Jenis SDMK'] || ''
                ).trim() || null,
                
                jenis_profesi: String(
                  row.jenis_profesi || row.profesi || row.Profesi || row['Jenis Profesi'] || ''
                ).trim() || null,
                
                pekerjaan: String(
                  row.pekerjaan || row.Pekerjaan || ''
                ).trim() || null,
                
                lama_bekerja_di_unit_sekarang: String(
                  row.lama_bekerja || row.lama_bekerja_di_unit_sekarang || row['Lama Bekerja'] || ''
                ).trim() || null,
                
                surat_pernyataan: String(
                  row.surat_pernyataan || row.surat || row['Surat Pernyataan'] || ''
                ).trim() || null,
                
                foto: String(row.foto || row.Foto || '').trim() || null,
                
                status: 'pending'
              };
              
              // Validate REQUIRED fields
              if (!pendaftaranObject.nik) {
                throw new Error('NIK wajib diisi');
              }
              if (!pendaftaranObject.nama_lengkap_dengan_gelar || pendaftaranObject.nama_lengkap_dengan_gelar === 'Tidak Diketahui') {
                throw new Error('Nama lengkap wajib diisi');
              }
              
              // Insert to database with detailed logging
              console.log('[IMPORT] Inserting row', i + 1, ':', {
                nik: pendaftaranObject.nik,
                nama: pendaftaranObject.nama_lengkap_dengan_gelar.substring(0, 30) + '...'
              });
              
              const result = await graphqlRequest('InsertPendaftaran', GRAPHQL_QUERIES.insertPendaftaran, {
                object: pendaftaranObject
              });
              
              // Verify insertion was successful
              if (result && result.insert_pendaftaran_one && result.insert_pendaftaran_one.id) {
                importSuccess++;
                // Track NIK and email to prevent duplicates
                if (nik) legacyNikSet.add(nik);
                if (email) legacyEmailSet.add(email);
                console.log('[INSERT] ✓ Success row', i + 1, '- ID:', result.insert_pendaftaran_one.id);
              } else {
                throw new Error('Insert returned no ID');
              }
              
            } catch (rowError) {
              importFailed++;
              const errorMsg = rowError.message || 'Unknown error';
              importErrors.push({ 
                row: i + 1, 
                error: errorMsg, 
                data: data.rows[i],
                isDuplicate: errorMsg.includes('unique') || errorMsg.includes('duplicate') || errorMsg.includes('duplikat')
              });
              console.error('[INSERT] ✗ Failed row', i + 1, ':', errorMsg);
            }
          }
          
          console.log('[IMPORT] Legacy import complete:', {
            total: data.rows.length,
            success: importSuccess,
            failed: importFailed,
            skipped: importSkipped
          });
          
          resolve({
            success: importSuccess > 0,
            message: `Import selesai!\n✅ Berhasil: ${importSuccess} data\n❌ Gagal: ${importFailed} data\n⚠️ Lewati (duplikat): ${importSkipped} data`,
            successCount: importSuccess,
            failedCount: importFailed,
            skippedCount: importSkipped,
            errors: importErrors
          });
          break;
        }

        case 'importSDMK':
          console.log('[IMPORT] Starting SDMK import for', data.rows?.length || 0, 'records');
          console.log('[IMPORT] ⚠️ Mode: DATA GANDA DIPERBOLEHKAN (NIK/NIP/Nama boleh sama)');
          
          if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
            reject(new Error('Tidak ada data untuk di-import'));
            return;
          }
          
          let sdmkSuccess = 0;
          let sdmkFailed = 0;
          const sdmkErrors = [];
          
          for (let i = 0; i < data.rows.length; i++) {
            try {
              const row = data.rows[i];
              
              // === FLEKSIBEL: NIK/NIP/Nama boleh kosong, boleh sama/duplikat ===
              const sdmkObject = {
                // Nama - wajib tapi bisa duplikat
                nama: String(row.nama || row.Nama || row['Nama Lengkap'] || row['Nama Lengkap dengan Gelar'] || '').trim(),
                // NIK - opsional, boleh duplikat
                nik: String(row.nik || row.NIK || row['NIK/NIP'] || '').trim() || null,
                // Profesi
                profesi: String(row.profesi || row.Profesi || row['Jenis Profesi'] || '').trim() || null,
                // Unit Kerja
                unit_kerja: String(row.unit_kerja || row['Unit Kerja'] || row.Unit_Kerja || '').trim() || null,
                // Nomor Sertifikat - boleh duplikat
                nomor_sertifikat: String(row.nomor_sertifikat || row['No. Sertifikat'] || row['Nomor Sertifikat'] || '').trim() || null,
                // Judul Kegiatan/Pelatihan
                judul_kegiatan: String(row.judul_kegiatan || row['Judul Kegiatan'] || row['Judul Pelatihan'] || '').trim() || null,
                // Tanggal Pelaksanaan
                tanggal_pelaksanaan: String(row.tanggal_pelaksanaan || row['Tgl Pelaksanaan'] || row['Tanggal Pelaksanaan'] || '').trim() || null,
                // Tahun
                tahun: row.tahun ? parseInt(String(row.tahun).replace(/\D/g, '')) : (row.Tahun ? parseInt(String(row.Tahun).replace(/\D/g, '')) : null),
                // Tempat Pelaksanaan
                tempat_pelaksanaan: String(row.tempat_pelaksanaan || row.Tempat || row['Tempat Pelaksanaan'] || '').trim() || null,
                // Foto URL
                foto: String(row.foto || row.Foto || row['Pas Foto'] || '').trim() || null
              };
              
              // VALIDASI MINIMAL: Hanya nama yang wajib (bisa duplikat)
              if (!sdmkObject.nama) {
                console.warn('[IMPORT] Row', i + 1, ': Nama kosong, tetap diimport dengan nama "-"');
                sdmkObject.nama = '-'; // Default jika kosong
              }
              
              // Insert ke database TANPA cek duplikat
              await graphqlRequest('InsertSDMK', GRAPHQL_QUERIES.insertSDMK, {
                object: sdmkObject
              });
              
              sdmkSuccess++;
              console.log('[IMPORT] ✅ Row', i + 1, 'berhasil:', sdmkObject.nama);
              
            } catch (sdmkErr) {
              sdmkFailed++;
              sdmkErrors.push({ 
                row: i + 1, 
                error: sdmkErr.message, 
                data: data.rows[i],
                note: 'Data gagal diimport (bukan karena duplikat)'
              });
              console.warn('[IMPORT] ❌ Row', i + 1, 'gagal:', sdmkErr.message);
            }
          }
          
          resolve({
            success: true,
            message: `✅ Import SDMK Selesai!\n📊 Total: ${data.rows.length} baris\n✅ Berhasil: ${sdmkSuccess} data\n❌ Gagal: ${sdmkFailed} data\n\n⚠️ Catatan: Data ganda (NIK/NIP/Nama sama) DIPERBOLEHKAN`,
            successCount: sdmkSuccess,
            failedCount: sdmkFailed,
            errors: sdmkErrors,
            duplicatesAllowed: true
          });
          break;

        // === BULK IMPORT OPERATIONS (New Tab System) ===
        case 'bulkInsertPendaftaran':
          console.log('[IMPORT] Starting bulk insert for', data.data?.length || 0, 'records');
          
          if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            reject(new Error('Tidak ada data untuk di-import'));
            return;
          }
          
          let successCount = 0;
          let failedCount = 0;
          let skippedCount = 0;
          const errors = [];
          const nikSet = new Set();
          const emailSet = new Set();
          
          // Process each record
          // CATATAN KRITIS: NIK BOLEH DUPLIKAT! Satu orang bisa mendaftar berkali-kali
          // Setiap pendaftaran = record/transaksi baru dengan ID unik sendiri
          for (let i = 0; i < data.data.length; i++) {
            try {
              const row = data.data[i];
              
              // Extract and normalize fields according to DATABASE SCHEMA
              const nik = String(row.nik || '').trim();
              const email = String(row.email || row.email_plataran_sehat || '').trim();
              
              // ✅ PERUBAHAN: NIK BOLEH SAMA - tidak ada pengecekan duplikat NIK
              // Satu peserta boleh mendaftar untuk kegiatan yang berbeda
              // Hanya track NIK untuk logging (bukan blocking)
              if (nik) {
                nikSet.add(nik);  // Track only, don't block
              }
              
              // Check for duplicate email in this batch (optional validation)
              if (email && emailSet.has(email)) {
                // Email duplikat hanya warning, tidak block
                console.warn('[BULK IMPORT] Warning: Email sudah ada dalam batch:', email);
              }
              if (email) {
                emailSet.add(email);
              }
              
              // Map CSV fields to EXACT database columns (matching schema)
              const pendaftaranObject = {
                // Required fields (NOT NULL in database)
                nama_lengkap_dengan_gelar: String(
                  row.nama_lengkap || row.nama || row.Nama || ''
                ).trim() || 'Tidak Diketahui',
                
                nik: nik,
                
                unit_kerja: String(
                  row.unit_kerja || row.unitKerja || row['Unit Kerja'] || ''
                ).trim() || 'Belum Ditentukan',
                
                judul_kegiatan: String(
                  row.judul_kegiatan || row['Judul Kegiatan'] || 'Pelatihan SDMK'
                ).trim(),
                
                // Optional fields (exact column names from schema)
                nip: String(row.nip || '').trim() || null,
                jenis_kelamin: String(
                  row.jenis_kelamin || row.kelamin || ''
                ).trim() || null,
                
                tempat_dan_tanggal_lahir: [
                  String(row.tempat_lahir || ''),
                  String(row.tanggal_lahir || '')
                ].filter(Boolean).join(', ') || null,
                
                email_plataran_sehat: email || null,
                nomor_whatsapp: String(
                  row.nomor_whatsapp || row.whatsapp || row.no_telepon || ''
                ).trim() || null,
                
                alamat_rumah: String(
                  row.alamat_rumah || row.alamat || ''
                ).trim() || null,
                
                jenis_sdmk: String(
                  row.jenis_sdmk || ''
                ).trim() || null,
                
                jenis_profesi: String(
                  row.jenis_profesi || row.profesi || ''
                ).trim() || null,
                
                pekerjaan: String(
                  row.pekerjaan || ''
                ).trim() || null,
                
                lama_bekerja_di_unit_sekarang: String(
                  row.lama_bekerja || ''
                ).trim() || null,
                
                surat_pernyataan: String(
                  row.surat_pernyataan || row.surat || ''
                ).trim() || null,
                
                foto: String(row.foto || '').trim() || null,
                
                // ✅ TAMBAHAN: Catatan Admin (paragraf/textarea)
                catatan_admin: String(
                  row.catatan_admin || row.catatan || row['Catatan Admin'] || ''
                ).trim() || null,
                
                status: 'pending'
              };
              
              // Validate required fields
              if (!pendaftaranObject.nik) {
                throw new Error('NIK wajib diisi');
              }
              if (!pendaftaranObject.nama_lengkap_dengan_gelar || pendaftaranObject.nama_lengkap_dengan_gelar === 'Tidak Diketahui') {
                throw new Error('Nama lengkap wajib diisi');
              }
              
              // Insert into database with verification
              console.log('[BULK INSERT] Processing record', i + 1, '- NIK:', nik);
              
              const result = await graphqlRequest('InsertPendaftaran', GRAPHQL_QUERIES.insertPendaftaran, {
                object: pendaftaranObject
              });
              
              // Verify insertion was successful
              if (result && result.insert_pendaftaran_one && result.insert_pendaftaran_one.id) {
                successCount++;
                // Track to prevent duplicates in this batch
                if (nik) nikSet.add(nik);
                if (email) emailSet.add(email);
                console.log('[BULK INSERT] ✓ Success - ID:', result.insert_pendaftaran_one.id);
              } else {
                throw new Error('Insert gagal - tidak ada ID dikembalikan');
              }
              
            } catch (recordError) {
              failedCount++;
              const errorMsg = recordError.message || 'Unknown error';
              errors.push({
                rowNum: i + 1,
                error: errorMsg,
                data: data.data[i],
                isDuplicate: errorMsg.toLowerCase().includes('unique') || 
                             errorMsg.toLowerCase().includes('duplicate') ||
                             errorMsg.toLowerCase().includes('duplikat')
              });
              console.error('[BULK INSERT] ✗ Failed record', i + 1, ':', errorMsg);
            }
          }
          
          console.log('[BULK IMPORT] Complete:', { 
            total: data.data.length, 
            success: successCount, 
            failed: failedCount, 
            skipped: skippedCount 
          });
          
          resolve({ 
            success: successCount > 0,
            message: `Import selesai!\n✅ Berhasil: ${successCount} data\n❌ Gagal: ${failedCount} data\n⚠️ Lewati (duplikat): ${skippedCount} data`,
            successCount: successCount,
            failedCount: failedCount,
            skippedCount: skippedCount,
            errors: errors
          });
          break;

        default:
          reject(new Error(`Action tidak dikenali: ${action}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}
