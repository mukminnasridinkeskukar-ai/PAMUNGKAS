/* ============================================================
   PAMUNGKAS — PANEL ADMIN — Import Massal (Tab CSV & Modal Multi-Modul)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/17-admin-import.js
   ============================================================ */

/* ================================================================
 * INPUT MASSAL / BULK IMPORT SYSTEM FOR PENDAFTARAN
 * ================================================================ */

/**
 * renderImportMassalUI() - Render UI untuk Input Massal (TAB 2)
 */
function renderImportMassalUI() {
  var html = '';
  html += '<div class="import-container">';
  
  // Section 1: Download Template
  html += '<div class="import-section">';
  html += '  <div class="import-section-header">';
  html += '    <span class="step-number">1</span>';
  html += '    <i class="fas fa-download"></i>';
  html += '    <h3>Download Template</h3>';
  html += '  </div>';
  html += '  <p style="color:var(--text-secondary);margin-bottom:16px;font-size:.88rem;">Download template CSV untuk memastikan format data yang benar sebelum melakukan import.</p>';
  html += '  <button class="template-download-btn" onclick="downloadPendaftaranTemplate()">';
  html += '    <i class="fas fa-file-csv"></i> Download Template CSV';
  html += '  </button>';
  html += '</div>';
  
  // Section 2: Upload Data
  html += '<div class="import-section">';
  html += '  <div class="import-section-header">';
  html += '    <span class="step-number">2</span>';
  html += '    <i class="fas fa-upload"></i>';
  html += '    <h3>Upload Data</h3>';
  html += '  </div>';
  html += '  <div class="upload-zone" id="uploadZone" onclick="document.getElementById(\'csvFileInput\').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">';
  html += '    <i class="fas fa-cloud-upload-alt"></i>';
  html += '    <p>Tarik file CSV ke sini</p>';
  html += '    <p style="margin:0;">atau</p>';
  html += '    <button type="button" class="btn btn-primary" style="margin-top:12px;" onclick="event.stopPropagation();document.getElementById(\'csvFileInput\').click()">';
  html += '      <i class="fas fa-folder-open"></i> Pilih File CSV';
  html += '    </button>';
  html += '    <small style="display:block;margin-top:12px;">Format: .csv (maks 5MB)</small>';
  html += '    <div class="file-name" id="selectedFileName" style="display:none;">';
  html += '      <i class="fas fa-file-csv"></i>';
  html += '      <span id="fileNameText"></span>';
  html += '    </div>';
  html += '  </div>';
  html += '  <input type="file" id="csvFileInput" accept=".csv" style="display:none;" onchange="handleCSVFileSelect(event)">';
  html += '</div>';
  
  // Section 3: Preview & Validasi (hidden initially)
  html += '<div class="import-section" id="validationSection" style="display:none;">';
  html += '  <div class="import-section-header">';
  html += '    <span class="step-number">3</span>';
  html += '    <i class="fas fa-check-double"></i>';
  html += '    <h3>Preview & Validasi</h3>';
  html += '  </div>';
  html += '  <div id="validationStatsContainer"></div>';
  html += '  <div id="previewTableContainer" class="import-preview-table"></div>';
  html += '  <div id="validationActions" style="display:flex;gap:12px;margin-top:20px;justify-content:flex-end;"></div>';
  html += '</div>';
  
  // Section 4: Progress Import (hidden initially)
  html += '<div class="import-section" id="progressSection" style="display:none;">';
  html += '  <div class="import-section-header">';
  html += '    <span class="step-number">4</span>';
  html += '    <i class="fas fa-spinner fa-spin"></i>';
  html += '    <h3>Proses Import</h3>';
  html += '  </div>';
  html += '  <div class="import-progress-container" id="importProgressContainer"></div>';
  html += '</div>';
  
  // Section 5: Hasil Import (hidden initially)
  html += '<div class="import-section" id="resultSection" style="display:none;">';
  html += '  <div id="resultContent"></div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

/**
 * downloadPendaftaranTemplate() - Download template CSV untuk Pendaftaran
 */
function downloadPendaftaranTemplate() {
  console.log('[IMPORT] Generating template CSV...');
  
  // Header sesuai schema Nhost tabel pendaftaran
  var headers = ['nik', 'nama_lengkap_dengan_gelar', 'jenis_kelamin', 'tempat_dan_tanggal_lahir', 'nip', 'unit_kerja', 'jenis_sdmk', 'jenis_profesi', 'pekerjaan', 'nomor_whatsapp', 'email_plataran_sehat', 'alamat_rumah'];
  var sampleData = [
    ['3201234567890001', 'Ahmad Fauzi, S.Kep', 'Laki-laki', 'Jakarta, 1990-05-15', '198705152010011001', 'Puskesmas Central', 'Perawat', 'Perawat', 'Perawat Pelaksana', '08123456789', 'ahmad@email.com', 'Jl. Merdeka No. 1'],
    ['3201234567890002', 'Siti Nurhaliza, S.Tr.Keb', 'Perempuan', 'Bandung, 1992-08-22', '199208222015032002', 'Puskesmas Utara', 'Bidan', 'Bidan', 'Bidan Terampil', '08234567890', 'siti@email.com', 'Jl. Sudirman No. 5'],
    ['3201234567890003', 'Budi Santoso', 'Laki-laki', 'Surabaya, 1988-12-10', '198812102012011003', 'Puskesmas Selatan', 'Sanitarian', 'Sanitarian', 'Sanitarian', '08345678901', 'budi@email.com', 'Jl. Thamrin No. 10']
  ];
  
  var csvContent = headers.join(',') + '\n';
  sampleData.forEach(function(row) {
    csvContent += row.map(function(cell) {
      var cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',') + '\n';
  });
  
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_pendaftaran.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Template CSV berhasil didownload!', 'success');
  console.log('[IMPORT] Template downloaded successfully');
}

/**
 * resetImportState() - Reset state import ke awal
 */
function resetImportMassalState() {
  _importState = {
    file: null,
    fileName: '',
    rawData: [],
    validatedData: [],
    errors: [],
    duplicates: [],
    validCount: 0,
    errorCount: 0,
    duplicateCount: 0,
    isImporting: false,
    importProgress: 0,
    importSuccess: 0,
    importFailed: 0,
    expectedHeaders: ['nik', 'nama_lengkap_dengan_gelar', 'jenis_kelamin', 'tempat_dan_tanggal_lahir', 'nip', 'unit_kerja', 'jenis_sdmk', 'jenis_profesi', 'pekerjaan', 'nomor_whatsapp', 'email_plataran_sehat', 'alamat_rumah']
  };
  
  var validationSection = document.getElementById('validationSection');
  var progressSection = document.getElementById('progressSection');
  var resultSection = document.getElementById('resultSection');
  var selectedFileName = document.getElementById('selectedFileName');
  var uploadZone = document.getElementById('uploadZone');
  
  if (validationSection) validationSection.style.display = 'none';
  if (progressSection) progressSection.style.display = 'none';
  if (resultSection) resultSection.style.display = 'none';
  if (selectedFileName) selectedFileName.style.display = 'none';
  if (uploadZone) uploadZone.classList.remove('has-file');
  
  console.log('[IMPORT] State reset');
}

/** Drag & Drop Handlers **/
function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  var zone = document.getElementById('uploadZone');
  if (zone) zone.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  var zone = document.getElementById('uploadZone');
  if (zone) zone.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  var zone = document.getElementById('uploadZone');
  if (zone) zone.classList.remove('drag-over');
  
  var files = event.dataTransfer.files;
  if (files.length > 0) {
    processCSVFile(files[0]);
  }
}

function handleCSVFileSelect(event) {
  var file = event.target.files[0];
  if (file) {
    processCSVFile(file);
  }
}

/**
 * processCSVFile() - Process uploaded CSV file
 */
function processCSVFile(file) {
  console.log('[IMPORT] Processing file:', file.name, 'Size:', file.size);
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('Hanya file CSV yang diperbolehkan!', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showToast('Ukuran file terlalu besar! Maksimal 5MB.', 'error');
    return;
  }
  
  _importState.file = file;
  _importState.fileName = file.name;
  
  var selectedFileName = document.getElementById('selectedFileName');
  var fileNameText = document.getElementById('fileNameText');
  var uploadZone = document.getElementById('uploadZone');
  
  if (selectedFileName) selectedFileName.style.display = 'flex';
  if (fileNameText) fileNameText.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
  if (uploadZone) uploadZone.classList.add('has-file');
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var csvData = parseCSV(e.target.result);
      _importState.rawData = csvData;
      console.log('[IMPORT] CSV parsed:', csvData.length, 'rows');
      validateAndPreview(csvData);
    } catch (err) {
      console.error('[IMPORT] Error parsing CSV:', err);
      showToast('Error parsing file CSV: ' + err.message, 'error');
    }
  };
  reader.onerror = function() { showToast('Error membaca file!', 'error'); };
  reader.readAsText(file);
}

/**
 * parseCSV() - Parse CSV string ke array of objects
 */
function parseCSV(csvString) {
  var lines = csvString.split('\n').filter(function(line) { return line.trim() !== ''; });
  if (lines.length < 2) {
    throw new Error('File CSV kosong atau hanya memiliki header!');
  }
  
  var headers = parseCSVLine(lines[0]).map(function(h) { return h.trim().toLowerCase().replace(/\s+/g, '_'); });
  console.log('[IMPORT] Headers detected:', headers);
  
  var missingHeaders = _importState.expectedHeaders.filter(function(h) { return !headers.includes(h); });
  if (missingHeaders.length > 0) {
    throw new Error('Header wajib tidak ditemukan: ' + missingHeaders.join(', '));
  }
  
  var data = [];
  for (var i = 1; i < lines.length; i++) {
    var values = parseCSVLine(lines[i]);
    var row = {};
    headers.forEach(function(header, idx) {
      row[header] = values[idx] || '';
    });
    row._rowNum = i;
    data.push(row);
  }
  
  return data;
}

function parseCSVLine(line) {
  var result = [];
  var current = '';
  var inQuotes = false;
  
  for (var i = 0; i < line.length; i++) {
    var char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

/**
 * validateAndPreview() - Validasi data dan tampilkan preview
 */
function validateAndPreview(data) {
  console.log('[IMPORT] Validating', data.length, 'rows...');
  
  _importState.validatedData = [];
  _importState.errors = [];
  _importState.duplicates = [];
  _importState.validCount = 0;
  _importState.errorCount = 0;
  _importState.duplicateCount = 0;
  
  var nikSet = new Set();
  
  data.forEach(function(row, idx) {
    var rowErrors = [];
    var isDuplicate = false;
    
    // Validate NIK - FORMAT SAJA, tidak cek unik!
    // ✅ PERUBAHAN: NIK BOLEH DUPLIKAT - satu orang bisa mendaftar berkali-kali
    if (!row.nik || row.nik.trim() === '') {
      rowErrors.push({ field: 'nik', message: 'NIK wajib diisi' });
    } else if (!/^\d{16}$/.test(row.nik.replace(/\s/g, ''))) {
      rowErrors.push({ field: 'nik', message: 'NIK harus 16 digit angka' });
    } else {
      // Track NIK untuk statistik saja, bukan blocking
      nikSet.add(row.nik.replace(/\s/g, ''));
    }
    
    // Validate nama_lengkap
    if (!row.nama_lengkap || row.nama_lengkap.trim() === '') {
      rowErrors.push({ field: 'nama_lengkap', message: 'Nama lengkap wajib diisi' });
    } else if (row.nama_lengkap.length > 200) {
      rowErrors.push({ field: 'nama_lengkap', message: 'Nama maksimal 200 karakter' });
    }
    
    // Validate jenis_kelamin
    if (row.jenis_kelamin && !['Laki-laki', 'Perempuan', 'laki-laki', 'perempuan', 'L', 'P'].includes(row.jenis_kelamin)) {
      rowErrors.push({ field: 'jenis_kelamin', message: 'Jenis kelamin: Laki-laki atau Perempuan' });
    }
    
    // Validate tempat_dan_tanggal_lahir (format: "Kota, YYYY-MM-DD")
    if (row.tempat_dan_tanggal_lahir && row.tempat_dan_tanggal_lahir.trim() !== '') {
      var tglPattern = /,\s*\d{4}-\d{2}-\d{2}/;
      if (!tglPattern.test(row.tempat_dan_tanggal_lahir)) {
        rowErrors.push({ field: 'tempat_dan_tanggal_lahir', message: 'Format: "Kota, YYYY-MM-DD" (contoh: Jakarta, 1990-05-15)' });
      }
    }
    
    // Validate email_plataran_sehat
    if (row.email_plataran_sehat && row.email_plataran_sehat.trim() !== '') {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email_plataran_sehat)) {
        rowErrors.push({ field: 'email_plataran_sehat', message: 'Format email tidak valid' });
      }
    }
    
    // Validate nomor_whatsapp
    if (row.nomor_whatsapp && row.nomor_whatsapp.trim() !== '') {
      var phoneRegex = /^[\d+\-\s()]+$/;
      if (!phoneRegex.test(row.nomor_whatsapp) || row.nomor_whatsapp.replace(/\D/g, '').length < 10) {
        rowErrors.push({ field: 'nomor_whatsapp', message: 'Nomor WhatsApp minimal 10 digit' });
      }
    }
    
    // Classify row
    if (isDuplicate) {
      row._status = 'duplicate';
    } else if (rowErrors.length > 0) {
      row._status = 'error';
      row._errors = rowErrors;
      _importState.errorCount++;
      _importState.errors.push({ rowNum: row._rowNum, data: row, errors: rowErrors });
    } else {
      row._status = 'valid';
      _importState.validCount++;
      _importState.validatedData.push(row);
    }
  });
  
  console.log('[IMPORT] Validation complete:', {
    total: data.length,
    valid: _importState.validCount,
    error: _importState.errorCount,
    duplicate: _importState.duplicateCount
  });
  
  showValidationResults(data);
}

/**
 * showValidationResults() - Tampilkan hasil validasi
 */
function showValidationResults(data) {
  var validationSection = document.getElementById('validationSection');
  var statsContainer = document.getElementById('validationStatsContainer');
  var previewContainer = document.getElementById('previewTableContainer');
  var actionsContainer = document.getElementById('validationActions');
  
  if (!validationSection) return;
  
  validationSection.style.display = 'block';
  
  statsContainer.innerHTML = 
    '<div class="validation-stats">' +
      '<div class="validation-stat-card total">' +
        '<div class="stat-number">' + data.length + '</div>' +
        '<div class="stat-label">Total Baris</div>' +
      '</div>' +
      '<div class="validation-stat-card valid">' +
        '<div class="stat-number">' + _importState.validCount + '</div>' +
        '<div class="stat-label">Valid</div>' +
      '</div>' +
      '<div class="validation-stat-card error">' +
        '<div class="stat-number">' + _importState.errorCount + '</div>' +
        '<div class="stat-label">Error</div>' +
      '</div>' +
      '<div class="validation-stat-card duplicate">' +
        '<div class="stat-number">' + _importState.duplicateCount + '</div>' +
        '<div class="stat-label">Duplikat</div>' +
      '</div>' +
    '</div>';
  
  var previewData = data.slice(0, 100);
  var tableHtml = '<table><thead><tr>';
  tableHtml += '<th>No</th>';
  _importState.expectedHeaders.forEach(function(h) {
    tableHtml += '<th>' + escHTML(h.replace(/_/g, ' ').toUpperCase()) + '</th>';
  });
  tableHtml += '<th>Status</th>';
  tableHtml += '</tr></thead><tbody>';
  
  previewData.forEach(function(row, idx) {
    var statusClass = 'row-' + row._status;
    var statusBadge = '';
    
    if (row._status === 'valid') {
      statusBadge = '<span class="status-badge valid"><i class="fas fa-check"></i> VALID</span>';
    } else if (row._status === 'error') {
      statusBadge = '<span class="status-badge error"><i class="fas fa-times"></i> ERROR</span>';
    } else if (row._status === 'duplicate') {
      statusBadge = '<span class="status-badge duplicate"><i class="fas fa-copy"></i> DUPLIKAT</span>';
    }
    
    tableHtml += '<tr class="' + statusClass + '">';
    tableHtml += '<td>' + (idx + 1) + '</td>';
    _importState.expectedHeaders.forEach(function(h) {
      tableHtml += '<td>' + escHTML(row[h] || '-') + '</td>';
    });
    tableHtml += '<td>' + statusBadge + '</td>';
    tableHtml += '</tr>';
  });
  
  tableHtml += '</tbody></table>';
  
  if (data.length > 100) {
    tableHtml += '<p style="text-align:center;color:var(--text-muted);margin-top:12px;">Menampilkan 100 dari ' + data.length + ' baris...</p>';
  }
  
  previewContainer.innerHTML = tableHtml;
  
  actionsContainer.style.display = 'flex';
  actionsContainer.innerHTML = 
    '<button class="btn btn-secondary" onclick="resetImportMassalState()">' +
      '<i class="fas fa-times"></i> Batal' +
    '</button>' +
    (_importState.validCount > 0 
      ? '<button class="btn btn-primary" onclick="executeImportMassal()">' +
          '<i class="fas fa-upload"></i> Import ' + _importState.validCount + ' Data Valid' +
        '</button>'
      : ''
    );
}

/**
 * executeBulkImport() - Eksekusi import data valid ke database
 */
function executeImportMassal() {
  if (_importState.isImporting) {
    showToast('Import sedang berlangsung...', 'warning');
    return;
  }
  
  if (_importState.validatedData.length === 0) {
    showToast('Tidak ada data valid untuk di-import!', 'error');
    return;
  }
  
  console.log('[IMPORT] Starting bulk import of', _importState.validatedData.length, 'records...');
  
  _importState.isImporting = true;
  _importState.importProgress = 0;
  _importState.importSuccess = 0;
  _importState.importFailed = 0;
  
  var progressSection = document.getElementById('progressSection');
  var validationSection = document.getElementById('validationSection');
  
  if (validationSection) validationSection.style.display = 'none';
  if (progressSection) progressSection.style.display = 'block';
  
  renderImportProgress();
  
  var batchSize = 10;
  var totalRecords = _importState.validatedData.length;
  var processedRecords = 0;
  
  function processBatch() {
    var batch = _importState.validatedData.slice(processedRecords, processedRecords + batchSize);
    
    if (batch.length === 0) {
      finishImport(totalRecords);
      return;
    }
    
    callServer('bulkInsertPendaftaran', { data: batch })
      .then(function(res) {
        processedRecords += batch.length;
        _importState.importProgress = Math.round((processedRecords / totalRecords) * 100);
        
        if (res && res.success) {
          _importState.importSuccess += batch.length;
        } else {
          _importState.importFailed += batch.length;
          console.warn('[IMPORT] Batch failed:', res ? res.message : 'Unknown error');
        }
        
        renderImportProgress();
        setTimeout(processBatch, 100);
      })
      .catch(function(err) {
        processedRecords += batch.length;
        _importState.importProgress = Math.round((processedRecords / totalRecords) * 100);
        _importState.importFailed += batch.length;
        
        console.error('[IMPORT] Batch error:', err);
        renderImportProgress();
        setTimeout(processBatch, 100);
      });
  }
  
  processBatch();
}

/**
 * renderImportProgress() - Render progress bar during import
 */
function renderImportProgress() {
  var container = document.getElementById('importProgressContainer');
  if (!container) return;
  
  container.innerHTML = 
    '<div class="import-progress-header">' +
      '<h4><i class="fas fa-database"></i> Import Pendaftaran</h4>' +
      '<span class="progress-percent">' + _importState.importProgress + '%</span>' +
    '</div>' +
    '<div class="import-progress-bar">' +
      '<div class="import-progress-fill" style="width:' + _importState.importProgress + '%"></div>' +
    '</div>' +
    '<div class="import-progress-stats">' +
      '<div class="import-progress-stat">' +
        '<div class="stat-value" style="color:var(--primary);">' + (_importState.importSuccess + _importState.importFailed) + '</div>' +
        '<div class="stat-label">/ ' + _importState.validatedData.length + '</div>' +
      '</div>' +
      '<div class="import-progress-stat">' +
        '<div class="stat-value" style="color:var(--secondary);">' + _importState.importSuccess + '</div>' +
        '<div class="stat-label">Berhasil</div>' +
      '</div>' +
      '<div class="import-progress-stat">' +
        '<div class="stat-value" style="color:var(--danger);">' + _importState.importFailed + '</div>' +
        '<div class="stat-label">Gagal</div>' +
      '</div>' +
    '</div>';
}

/**
 * finishImport() - Tampilkan hasil akhir import
 */
function finishImport(totalAttempted) {
  _importState.isImporting = false;
  
  var progressSection = document.getElementById('progressSection');
  var resultSection = document.getElementById('resultSection');
  var resultContent = document.getElementById('resultContent');
  
  if (progressSection) progressSection.style.display = 'none';
  if (resultSection) resultSection.style.display = 'block';
  
  resultContent.innerHTML = 
    '<div class="import-result success">' +
      '<div class="import-result-icon">' +
        '<i class="fas fa-check"></i>' +
      '</div>' +
      '<h3>IMPORT SELESAI</h3>' +
      '<div class="import-result-stats">' +
        '<div class="import-result-stat">' +
          '<span class="label">Total data</span>' +
          '<span class="value">' + totalAttempted + '</span>' +
        '</div>' +
        '<div class="import-result-stat">' +
          '<span class="label">Berhasil</span>' +
          '<span class="value" style="color:var(--secondary);">' + _importState.importSuccess + '</span>' +
        '</div>' +
        '<div class="import-result-stat">' +
          '<span class="label">Gagal</span>' +
          '<span class="value" style="color:var(--danger);">' + _importState.importFailed + '</span>' +
        '</div>' +
        '<div class="import-result-stat">' +
          '<span class="label">Duplikat</span>' +
          '<span class="value" style="color:var(--accent);">' + _importState.duplicateCount + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="import-result-actions">' +
        '<button class="btn btn-primary" onclick="backToPendaftaranData()">' +
          '<i class="fas fa-table"></i> Lihat Data Pendaftaran' +
        '</button>' +
        '<button class="btn btn-secondary" onclick="downloadErrorReport()">' +
          '<i class="fas fa-file-alt"></i> Download Laporan Error' +
        '</button>' +
        '<button class="btn btn-secondary" onclick="resetImportMassalState()">' +
          '<i class="fas fa-redo"></i> Import Lagi' +
        '</button>' +
      '</div>' +
    '</div>';
  
  console.log('[IMPORT] Complete:', {
    total: totalAttempted,
    success: _importState.importSuccess,
    failed: _importState.importFailed,
    duplicates: _importState.duplicateCount
  });
  
  showToast('Import selesai! ' + _importState.importSuccess + ' data berhasil di-import.', 'success');
}

/**
 * backToPendaftaranData() - Kembali ke tab Data Pendaftaran dan refresh
 */
function backToPendaftaranData() {
  console.log('[IMPORT] Switching back to Data Pendaftaran tab...');
  switchPendaftaranTab('pendaftaran-data');
  refreshPendaftaranData();
}

/**
 * downloadErrorReport() - Download laporan error dalam format CSV
 */
function downloadErrorReport() {
  if (_importState.errors.length === 0 && _importState.duplicates.length === 0) {
    showToast('Tidak ada error untuk didownload', 'info');
    return;
  }
  
  var reportData = [];
  
  _importState.errors.forEach(function(item) {
    var row = Object.assign({}, item.data, { _errorType: 'Error', _errorMessage: item.errors.map(function(e) { return e.message; }).join('; ') });
    reportData.push(row);
  });
  
  _importState.duplicates.forEach(function(item) {
    var row = Object.assign({}, item.data, { _errorType: 'Duplikat', _errorMessage: item.reason });
    reportData.push(row);
  });
  
  var headers = _importState.expectedHeaders.concat(['Error_Type', 'Error_Message']);
  var csvContent = headers.join(',') + '\n';
  
  reportData.forEach(function(row) {
    var values = headers.map(function(h) {
      var val = row[h] || '';
      if (val.includes(',') || val.includes('"')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    csvContent += values.join(',') + '\n';
  });
  
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'laporan_error_import_' + new Date().toISOString().slice(0,10) + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Laporan error berhasil didownload!', 'success');
}

/* ========== BULK IMPORT SYSTEM ========== */
var _importData = [];
var _importModule = '';
var _importFileName = '';

// Module configurations for import
const IMPORT_CONFIG = {
  sdmk: {
    table: 'sdmk',
    requiredFields: ['nama', 'nik'],
    fields: ['nama', 'nik', 'profesi', 'unit_kerja', 'nomor_sertifikat', 'judul_kegiatan', 
              'tanggal_pelaksanaan', 'tahun', 'tempat_pelaksanaan', 'foto'],
    fieldMapping: {
      'Nama Lengkap dengan Gelar': 'nama',
      'Nama': 'nama',
      'NIK/NIP': 'nik',
      'NIK': 'nik',
      'Profesi': 'profesi',
      'Jenis Profesi': 'profesi',
      'Unit Kerja': 'unit_kerja',
      'No. Sertifikat': 'nomor_sertifikat',
      'Nomor Sertifikat': 'nomor_sertifikat',
      'Judul Kegiatan': 'judul_kegiatan',
      'Tgl Pelaksanaan': 'tanggal_pelaksanaan',
      'Tanggal Pelaksanaan': 'tanggal_pelatsanaan',
      'Tahun': 'tahun',
      'Tempat': 'tempat_pelaksanaan',
      'Tempat Pelaksanaan': 'tempat_pelaksanaan',
      'Foto': 'foto'
    },
    mutation: 'InsertSDMK',
    templateInfo: 'Kolom wajib: Nama Lengkap dengan Gelar, NIK/NIP. Opsional: Profesi, Unit Kerja, No. Sertifikat, dll.'
  },
  
  pendaftaran: {
    table: 'pendaftaran',
    requiredFields: ['nama_lengkap_dengan_gelar', 'nik'],
    fields: ['nama_lengkap_dengan_gelar', 'nik', 'nip', 'unit_kerja', 'jenis_sdmk', 
              'jenis_profesi', 'pekerjaan', 'jenis_kelamin', 'email_plataran_sehat',
              'nomor_whatsapp', 'alamat_rumah', 'judul_kegiatan', 'foto'],
    fieldMapping: {
      'Nama Lengkap dengan Gelar': 'nama_lengkap_dengan_gelar',
      'NIK': 'nik',
      'NIP': 'nip',
      'Unit Kerja': 'unit_kerja',
      'Jenis SDMK': 'jenis_sdmk',
      'Jenis Profesi': 'jenis_profesi',
      'Pekerjaan': 'pekerjaan',
      'Jenis Kelamin': 'jenis_kelamin',
      'Email': 'email_plataran_sehat',
      'Nomor WhatsApp': 'nomor_whatsapp',
      'Alamat Rumah': 'alamat_rumah',
      'Judul Kegiatan': 'judul_kegiatan',
      'Foto': 'foto'
    },
    mutation: 'InsertPendaftaran',
    templateInfo: 'Kolom wajib: Nama Lengkap dengan Gelar, NIK. Opsional: NIP, Unit Kerja, Jenis Profesi, dll.'
  },
  
  sertifikat: {
    table: 'sertifikat',
    requiredFields: ['nomor_sertifikat', 'nama_penerima'],
    fields: ['nomor_sertifikat', 'nama_penerima', 'judul_pelatihan', 'tanggal_terbit', 'link_sertifikat'],
    fieldMapping: {
      'Nomor Sertifikat': 'nomor_sertifikat',
      'Nama Penerima': 'nama_penerima',
      'Judul Pelatihan': 'judul_pelatihan',
      'Tanggal Terbit': 'tanggal_terbit',
      'Link/File': 'link_sertifikat'
    },
    mutation: 'InsertSertifikat',
    templateInfo: 'Kolom wajib: Nomor Sertifikat, Nama Penerima, Judul Pelatihan. Opsional: Tanggal Terbit, Link.'
  },
  
  pengumuman: {
    table: 'pengumuman',
    requiredFields: ['judul', 'isi_pengumuman'],
    fields: ['judul', 'isi_pengumuman', 'tanggal', 'status'],
    fieldMapping: {
      'Judul': 'judul',
      'Isi': 'isi_pengumuman',
      'Isi Pengumuman': 'isi_pengumuman',
      'Tanggal': 'tanggal',
      'Status': 'status'
    },
    mutation: 'InsertPengumuman',
    templateInfo: 'Kolom wajib: Judul, Isi Pengumuman. Opsional: Tanggal (default: hari ini), Status (default: published).'
  },
  
  materi: {
    table: 'materi',
    requiredFields: ['judul_materi'],
    fields: ['judul_materi', 'kategori', 'link_download', 'deskripsi'],
    fieldMapping: {
      'Judul Materi': 'judul_materi',
      'Kategori': 'kategori',
      'Link Download': 'link_download',
      'Deskripsi': 'deskripsi'
    },
    mutation: 'InsertMateri',
    templateInfo: 'Kolom wajib: Judul Materi. Opsional: Kategori, Link Download, Deskripsi.'
  },
  
  indikator: {
    table: 'indikator',
    requiredFields: ['indikator'],
    fields: ['indikator', 'nilai', 'target', 'satuan', 'periode'],
    fieldMapping: {
      'Indikator': 'indikator',
      'Nama': 'indikator',
      'Nilai': 'nilai',
      'Value': 'nilai',
      'Target': 'target',
      'Satuan': 'satuan',
      'Periode': 'periode'
    },
    mutation: '', // Custom handler needed
    templateInfo: 'Kolom wajib: Indikator/Nama. Opsional: Nilai, Target, Satuan, Periode.'
  },
  
  admin: {
    table: 'multiusers',
    requiredFields: ['username', 'password'],
    fields: ['username', 'password', 'level', 'status'],
    fieldMapping: {
      'Username': 'username',
      'Password': 'password',
      'Level': 'level',
      'Status': 'status'
    },
    mutation: 'InsertMultiuser',
    templateInfo: 'Kolom wajib: Username, Password. Opsional: Level (default: observer), Status (default: active).'
  }
};

// Open bulk import modal (SECURITY: Only for logged-in admins)
function openBulkImportModal() {
  // Security check: Must be logged in as admin
  if (!isAdminUser()) {
    showToast('Anda harus login sebagai admin untuk mengakses fitur ini.', 'error');
    return;
  }
  
  resetImportState();
  document.getElementById('bulkImportModal').classList.add('active');
  
  console.log('[Import] Modal opened by user:', adminUsername, '(Level:', adminLevel, ')');
}

// Close bulk import modal
function closeBulkImportModal() {
  document.getElementById('bulkImportModal').classList.remove('active');
  resetImportState();
}

// Open bulk import for specific module from admin CRUD (SECURITY CHECKED)
function openBulkImportForModule(moduleType) {
  // Double security check
  if (!isAdminUser()) {
    showToast('Akses ditolak. Login sebagai admin diperlukan.', 'error');
    return;
  }
  
  if (!canWrite(moduleType)) {
    showToast('Anda tidak memiliki akses tulis untuk modul ini.', 'error');
    return;
  }
  
  console.log('[Import] Opening import for:', moduleType, 'by:', adminUsername);
  
  resetImportState();
  
  // Set the module
  _importModule = moduleType;
  document.getElementById('importModule').value = moduleType;
  
  // Trigger module change to show template info
  onImportModuleChange();
  
  // Open modal
  document.getElementById('bulkImportModal').classList.add('active');
}

// Reset import state
function resetImportState() {
  _importData = [];
  _importModule = '';
  _importFileName = '';
  document.getElementById('importModule').value = '';
  document.getElementById('importFileInput').value = '';
  document.getElementById('selectedFileName').textContent = '';
  document.getElementById('importTemplateInfo').style.display = 'none';
  document.getElementById('btnPreviewImport').disabled = true;
  
  // Show step 1, hide others
  document.getElementById('importStep1').style.display = 'block';
  document.getElementById('importStep2').style.display = 'none';
  document.getElementById('importStep3').style.display = 'none';
  document.getElementById('importProgressOverlay').style.display = 'none';
}

// Module change handler
function onImportModuleChange() {
  const module = document.getElementById('importModule').value;
  _importModule = module;
  
  if (module && IMPORT_CONFIG[module]) {
    document.getElementById('importTemplateInfo').style.display = 'flex';
    document.getElementById('templateInfoText').textContent = IMPORT_CONFIG[module].templateInfo;
  } else {
    document.getElementById('importTemplateInfo').style.display = 'none';
  }
}

// File select handler
function handleImportFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  const validTypes = ['.xlsx', '.xls', '.csv'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!validTypes.includes(ext)) {
    showToast('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv', 'error');
    return;
  }
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('Ukuran file terlalu besar. Maksimal 10MB.', 'error');
    return;
  }
  
  _importFileName = file.name;
  document.getElementById('selectedFileName').textContent = file.name + ' (' + formatFileSize(file.size) + ')';
  document.getElementById('btnPreviewImport').disabled = !_importModule;
  
  // Parse the file
  parseImportFile(file);
}

// Drag and drop handlers
(function setupDragDrop() {
  const dropZone = document.getElementById('importDropZone');
  if (!dropZone) return;
  
  dropZone.addEventListener('click', () => document.getElementById('importFileInput').click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('importFileInput').files = e.dataTransfer.files;
      handleImportFileSelect({ target: { files: [file] } });
    }
  });
})();

// Parse Excel/CSV file
function parseImportFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      if (jsonData.length === 0) {
        showToast('File kosong atau tidak ada data yang bisa dibaca.', 'error');
        return;
      }
      
      _importData = jsonData;
      console.log('[Import] Parsed', jsonData.length, 'rows from', file.name);
      showToast(`Berhasil membaca ${jsonData.length} baris data`, 'success');
      
    } catch (error) {
      console.error('[Import] Parse error:', error);
      showToast('Gagal membaca file: ' + error.message, 'error');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

// Preview import data
function previewImportData() {
  if (!_importModule || _importData.length === 0) {
    showToast('Pilih modul dan file terlebih dahulu.', 'error');
    return;
  }
  
  const config = IMPORT_CONFIG[_importModule];
  const skipHeader = document.getElementById('importSkipHeader').checked;
  
  // Get headers from first row
  let dataToProcess = [..._importData];
  let headers = [];
  
  if (skipHeader && dataToProcess.length > 0) {
    headers = Object.keys(dataToProcess[0]);
  }
  
  // Map columns using field mapping
  let validCount = 0;
  let invalidCount = 0;
  const processedData = [];
  
  dataToProcess.forEach((row, idx) => {
    const mappedRow = {};
    let isValid = true;
    let missingFields = [];
    
    // Map each field
    for (const [excelField, dbField] of Object.entries(config.fieldMapping)) {
      if (row.hasOwnProperty(excelField)) {
        mappedRow[dbField] = row[excelField];
      }
    }
    
    // Check required fields
    for (const reqField of config.requiredFields) {
      if (!mappedRow[reqField] || String(mappedRow[reqField]).trim() === '') {
        isValid = false;
        missingFields.push(reqField);
      }
    }
    
    processedData.push({
      index: idx,
      original: row,
      mapped: mappedRow,
      isValid: isValid,
      missingFields: missingFields
    });
    
    if (isValid) validCount++;
    else invalidCount++;
  });
  
  // Render preview table
  renderImportPreview(processedData, headers, config);
  
  // Update counts
  document.getElementById('previewRowCount').textContent = processedData.length;
  document.getElementById('previewValidCount').textContent = `✓ ${validCount} valid`;
  document.getElementById('previewInvalidCount').textContent = invalidCount > 0 ? `✗ ${invalidCount} invalid` : '';
  document.getElementById('importCountDisplay').textContent = validCount;
  
  // Switch to step 2
  document.getElementById('importStep1').style.display = 'none';
  document.getElementById('importStep2').style.display = 'block';
}

// Render preview table
function renderImportPreview(data, headers, config) {
  const thead = document.getElementById('importPreviewHead');
  const tbody = document.getElementById('importPreviewBody');
  
  // Build header
  let headerHtml = '<tr>';
  headerHtml += '<th>#</th>';
  
  // Show key fields only (first 6)
  const keyFields = config.fields.slice(0, 6);
  for (const field of keyFields) {
    headerHtml += `<th>${field}</th>`;
  }
  headerHtml += '<th>Status</th>';
  headerHtml += '</tr>';
  thead.innerHTML = headerHtml;
  
  // Build body (show first 50 rows)
  let bodyHtml = '';
  const displayData = data.slice(0, 50);
  
  displayData.forEach((row, idx) => {
    bodyHtml += `<tr class="${row.isValid ? '' : 'row-invalid'}">`;
    bodyHtml += `<td>${row.index + 1}</td>`;
    
    for (const field of keyFields) {
      const value = row.mapped[field] || '-';
      bodyHtml += `<td title="${escHTML(String(value))}">${escHTML(String(value).substring(0, 30))}</td>`;
    }
    
    if (row.isValid) {
      bodyHtml += '<td><span class="status-badge disetujui">✓ Valid</span></td>';
    } else {
      bodyHtml += `<td><span class="status-badge ditolak" title="Missing: ${row.missingFields.join(', ')}">✗ Invalid</span></td>`;
    }
    
    bodyHtml += '</tr>';
  });
  
  if (data.length > 50) {
    bodyHtml += `<tr><td colspan="${keyFields.length + 2}" class="text-center text-muted">... dan ${data.length - 50} baris lainnya</td></tr>`;
  }
  
  tbody.innerHTML = bodyHtml;
}

// Back to step 1
function backToImportStep1() {
  document.getElementById('importStep1').style.display = 'block';
  document.getElementById('importStep2').style.display = 'none';
}

// Execute bulk import (SECURITY: Verify admin session before importing)
async function executeBulkImport() {
  // Final security check before executing import
  if (!isAdminUser()) {
    document.getElementById('importProgressOverlay').style.display = 'none';
    showToast('Sesi admin tidak valid. Silakan login ulang.', 'error');
    closeBulkImportModal();
    return;
  }
  
  if (!_importModule || _importData.length === 0) {
    showToast('Tidak ada data untuk diimport.', 'error');
    return;
  }
  
  console.log('[Import] Executing import by:', adminUsername, 'Module:', _importModule);
  
  const config = IMPORT_CONFIG[_importModule];
  const skipDuplicates = document.getElementById('importSkipDuplicates').checked;
  
  // Show progress
  document.getElementById('importProgressOverlay').style.display = 'flex';
  
  // Filter valid data only
  const validData = _importData.map((row, idx) => {
    const mapped = {};
    for (const [excelField, dbField] of Object.entries(config.fieldMapping)) {
      if (row.hasOwnProperty(excelField)) {
        mapped[dbField] = row[excelField];
      }
    }
    
    // Validate required fields
    const isValid = config.requiredFields.every(field => 
      mapped[field] && String(mapped[field]).trim() !== ''
    );
    
    return { index: idx, mapped, isValid };
  }).filter(item => item.isValid);
  
  if (validData.length === 0) {
    document.getElementById('importProgressOverlay').style.display = 'none';
    showToast('Tidak ada data valid untuk diimport.', 'error');
    return;
  }
  
  const total = validData.length;
  let success = 0;
  let failed = 0;
  const errors = [];
  
  // Process in batches of 10 to avoid overwhelming
  const batchSize = 10;
  
  for (let i = 0; i < total; i += batchSize) {
    const batch = validData.slice(i, i + batchSize);
    
    // Update progress
    const progress = Math.min(Math.round((i / total) * 100), 100);
    updateImportProgress(progress, i, total);
    
    // Process batch
    for (const item of batch) {
      try {
        await callServer('tambah' + config.table.charAt(0).toUpperCase() + config.table.slice(1), item.mapped);
        success++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        failed++;
        errors.push({
          row: item.index + 1,
          error: error.message || 'Unknown error',
          data: item.mapped
        });
      }
    }
  }
  
  // Complete
  updateImportProgress(100, total, total);
  
  // Show results
  setTimeout(() => {
    showImportResults(success, failed, errors, total);
  }, 500);
}

// Update import progress
function updateImportProgress(current, done, total) {
  document.getElementById('importProgressBar').style.width = current + '%';
  document.getElementById('importProgressText').textContent = `${done} / ${total}`;
  
  if (current < 100) {
    document.getElementById('importStatusText').textContent = `Mengimpor data... (${current}%)`;
  } else {
    document.getElementById('importStatusText').textContent = 'Menyelesaikan...';
  }
}

// Show import results
function showImportResults(success, failed, errors, total) {
  document.getElementById('importProgressOverlay').style.display = 'none';
  document.getElementById('importStep2').style.display = 'none';
  document.getElementById('importStep3').style.display = 'block';
  
  const summaryDiv = document.getElementById('importResultSummary');
  const allSuccess = failed === 0;
  
  summaryDiv.className = 'result-summary ' + (allSuccess ? '' : 'warning');
  summaryDiv.innerHTML = `
    <i class="fas ${allSuccess ? 'fa-check-circle text-success' : 'fa-exclamation-triangle text-warning'}" 
       style="font-size:48px;color:${allSuccess ? '#059669' : '#d97706'}"></i>
    <h3>${allSuccess ? 'Import Berhasil!' : 'Import Selesai dengan Warning'}</h3>
    <div style="display:flex;justify-content:center;gap:30px;margin-top:15px;">
      <div><strong>Total:</strong> ${total}</div>
      <div class="text-success"><strong>Berhasil:</strong> ${success}</div>
      ${failed > 0 ? `<div class="text-danger"><strong>Gagal:</strong> ${failed}</div>` : ''}
    </div>
  `;
  
  // Show error log if any failures
  if (errors.length > 0) {
    document.getElementById('importErrorLog').style.display = 'block';
    document.getElementById('importErrorDetails').textContent = 
      errors.map((e, i) => `${i+1}. Baris ${e.row}: ${e.error}\n   Data: ${JSON.stringify(e.data).substring(0, 100)}`).join('\n');
  } else {
    document.getElementById('importErrorLog').style.display = 'none';
  }
  
  // Log to console
  console.log('[Import] Complete:', { success, failed, total });
}

// Download import template
function downloadImportTemplate() {
  if (!_importModule || !IMPORT_CONFIG[_importModule]) return;
  
  const config = IMPORT_CONFIG[_importModule];
  
  // Create sample data
  const sampleData = [{}];
  
  // Add sample values for each field
  const samples = {
    nama: 'Contoh Nama Lengkap',
    nik: '1234567890123456',
    profesi: 'Perawat',
    unit_kerja: 'RSUD Contoh',
    nomor_sertifikat: 'CERT/2024/001',
    judul_kegiatan: 'Pelatihan Contoh',
    tanggal_pelaksanaan: '2024-01-15',
    tahun: '2024',
    tempat_pelaksanaan: 'Jakarta',
    foto: '',
    nama_lengkap_dengan_gelar: 'dr. Contoh Nama, Sp.PD',
    nip: '198001012020031001',
    jenis_sdmk: 'Nakes RS',
    jenis_kelamin: 'Laki-laki',
    pekerjaan: 'PNS',
    email_plataran_sehat: 'email@contoh.com',
    nomor_whatsapp: '08123456789',
    alamat_rumah: 'Jl. Contoh No. 1',
    nama_penerima: 'Contoh Penerima',
    judul_pelatihan: 'Pelatihan LAN',
    tanggal_terbit: '2024-01-20',
    link_sertifikat: '',
    judul: 'Contoh Judul Pengumuman',
    isi_pengumuman: 'Ini adalah isi pengumuman contoh...',
    tanggal: new Date().toISOString().split('T')[0],
    status: 'published',
    judul_materi: 'Contoh Materi',
    kategori: 'Modul 1',
    link_download: '',
    deskripsi: 'Deskripsi materi contoh',
    indikator: 'Contoh Indikator',
    nilai: '100',
    target: '200',
    satuan: 'Orang',
    username: 'admin_user',
    password: 'password123',
    level: 'observer',
    status: 'active'
  };
  
  // Build header row with original Excel column names
  const headerRow = {};
  for (const [excelField, dbField] of Object.entries(config.fieldMapping)) {
    headerRow[excelField] = samples[dbField] || '';
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([headerRow]);
  
  // Set column widths
  ws['!cols'] = Object.keys(config.fieldMapping).map(() => ({ wch: 20 }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Download
  const fileName = `Template_Import_${config.table}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  showToast(`Template ${config.table} berhasil didownload`, 'success');
}

// Helper: Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Load current module data after import (refresh)
function loadCurrentModuleData() {
  switch(currentPage) {
    case 'dashboard': loadDashboard(); break;
    case 'pengumuman': loadPengumuman(); break;
    case 'profil-sdmk': loadSDMK(); break;
    case 'pendaftaran': loadPendaftaran(); break;
    case 'cek-sertifikat': loadCekSertifikat(); break;
    case 'panel-admin': 
      if(isAdminUser()) renderAdminDashboard();
      break;
  }
}

console.log('[Bulk Import] System initialized');
