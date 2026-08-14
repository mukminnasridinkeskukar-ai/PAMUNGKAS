/**
 * ============================================
 * PAMUNGKAS - SDMK Management Module
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. CRUD Operations untuk data SDMK
 * 2. Pencarian & Filter lanjutan
 * 3. Pagination (server-side friendly)
 * 4. Import/Export CSV
 * 5. Form validation
 * 6. Permission-based UI control
 * 
 * ⚠️ KEAMANAN:
 * - Semua operasi melalui Supabase Client (RLS enforced)
 * - Frontend permission checks untuk UX saja
 * - Security sebenarnya di RLS PostgreSQL
 * 
 * PENGGUNAAN:
 * // Inisialisasi
 * await PamungkasSDMK.init();
 * 
 * // Load data dengan pagination
 * await PamungkasSDMK.loadData({ page: 1, limit: 20 });
 * 
 * // Tambah SDMK baru
 * await PamungkasSDMK.create(formData);
 * 
 * // Export CSV
 * PamungkasSDMK.exportToCSV();
 */

// ==========================================
// SDMK STATE MANAGEMENT
// ==========================================

/**
 * Global state untuk modul SDMK
 * Mengelola semua state terkait data SDMK
 */
const SDMKState = {
    // Data array (current page)
    data: [],
    
    // Total records (untuk pagination)
    totalCount: 0,
    
    // Pagination state
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,
    
    // Filter state
    filters: {
        search: '',           // Text search (nama, NIK, NIP)
        profession_id: null,  // Filter profesi
        unit_id: null,        // Filter unit
        employment_status_id: null, // Filter status kepegawaian
        jenis_kelamin: null,  // Filter gender
        is_active: true       // Tampilkan aktif saja (default)
    },
    
    // Sort state
    sortBy: 'nama_lengkap',
    sortOrder: 'asc',        // asc | desc
    
    // Form state
    formMode: 'create',      // create | edit | view
    currentRecord: null,     // Record sedang diedit/dilihat
    
    // Loading states
    isLoading: false,
    isSaving: false,
    isImporting: false,
    
    // Error state
    error: null,
    
    // Master data caches (untuk dropdowns)
    masterData: {
        professions: [],
        units: [],
        educationLevels: [],
        employmentStatuses: []
    }
};

// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================

/**
 * Get Supabase client instance
 * Menggunakan config dari config.js
 * @returns {SupabaseClient}
 */
function getSupabaseClient() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        return supabase.createClient(
            PAMUNGKAS_CONFIG.SUPABASE_URL,
            PAMUNGKAS_CONFIG.SUPABASE_ANON_KEY
        );
    }
    throw new Error('Supabase client tidak tersedia. Pastikan supabase-js sudah di-load.');
}

let _supabase = null;

function getSupabase() {
    if (!_supabase) {
        _supabase = getSupabaseClient();
    }
    return _supabase;
}

// ==========================================
// CORE DATA OPERATIONS
// ==========================================

const PamungkasSDMK = {
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    /**
     * Inisialisasi modul SDMK
     * Load master data & setup event listeners
     */
    async init() {
        try {
            console.log('🚀 [PAMUNGKAS-SDMK] Initializing module...');
            
            // Cek permission dulu
            if (typeof hasPermission === 'function') {
                const canView = await hasPermission('sdmk.view');
                const canManage = await hasPermission('sdmk.manage');
                
                console.log(`📋 [PAMUNGKAS-SDMK] Permissions: view=${canView}, manage=${canManage}`);
                
                if (!canView) {
                    this.showAccessDenied();
                    return false;
                }
            }
            
            // Load master data untuk dropdowns
            await this.loadMasterData();
            
            // Setup form handlers
            this.setupFormHandlers();
            
            // Setup table handlers
            this.setupTableHandlers();
            
            // Load initial data
            await this.loadData();
            
            console.log('✅ [PAMUNGKAS-SDMK] Module initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Init error:', error);
            this.showError('Gagal menginisialisasi modul SDMK: ' + error.message);
            return false;
        }
    },
    
    // ==========================================
    // MASTER DATA LOADING
    // ==========================================
    
    /**
     * Load semua master data yang dibutuhkan untuk dropdowns
     * Data di-cache di SDMKState.masterData
     */
    async loadMasterData() {
        const supabase = getSupabase();
        
        try {
            console.log('📦 [PAMUNGKAS-SDMK] Loading master data...');
            
            // Parallel load semua master data
            const [
                professionsResult,
                unitsResult,
                educationLevelsResult,
                employmentStatusesResult
            ] = await Promise.all([
                // Professions (aktif saja, sorted by name)
                supabase
                    .from(PAMUNGKAS_CONFIG.DB_TABLES.PROFESSIONS)
                    .select('id, code, name, short_name, category')
                    .eq('is_active', true)
                    .order('name', { ascending: true }),
                
                // Units (aktif saja, sorted by name)
                supabase
                    .from(PAMUNGKAS_CONFIG.DB_TABLES.UNITS)
                    .select('id, code, name, unit_type, parent_id')
                    .eq('is_active', true)
                    .order('name', { ascending: true }),
                
                // Education Levels (aktif saja, sorted by level)
                supabase
                    .from(PAMUNGKAS_CONFIG.DB_TABLES.EDUCATION_LEVELS)
                    .select('id, code, name, level')
                    .eq('is_active', true)
                    .order('level', { ascending: true }),
                
                // Employment Statuses (aktif saja, sorted by sort_order)
                supabase
                    .from(PAMUNGKAS_CONFIG.DB_TABLES.EMPLOYMENT_STATUSES)
                    .select('id, code, name, status_type, color_hex')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true })
            ]);
            
            // Check errors
            if (professionsResult.error) throw professionsResult.error;
            if (unitsResult.error) throw unitsResult.error;
            if (educationLevelsResult.error) throw educationLevelsResult.error;
            if (employmentStatusesResult.error) throw employmentStatusesResult.error;
            
            // Cache ke state
            SDMKState.masterData.professions = professionsResult.data || [];
            SDMKState.masterData.units = unitsResult.data || [];
            SDMKState.masterData.educationLevels = educationLevelsResult.data || [];
            SDMKState.masterData.employmentStatuses = employmentStatuses.data || [];
            
            console.log(`✅ [PAMUNGKAS-SDMK] Master data loaded:`, {
                professions: SDMKState.masterData.professions.length,
                units: SDMKState.masterData.units.length,
                educationLevels: SDMKState.masterData.educationLevels.length,
                employmentStatuses: SDMKState.masterData.employmentStatuses.length
            });
            
            // Populate dropdowns
            this.populateDropdowns();
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error loading master data:', error);
            throw error;
        }
    },
    
    /**
     * Populate semua dropdown/select elements dengan master data
     */
    populateDropdowns() {
        // Profession dropdown
        this.populateSelect(
            'filterProfession', 
            SDMKState.masterData.professions, 
            'id', 
            'name',
            '-- Semua Profesi --'
        );
        
        this.populateSelect(
            'inputProfession', 
            SDMKState.masterData.professions, 
            'id', 
            'name',
            '-- Pilih Profesi --'
        );
        
        // Unit dropdown
        this.populateSelect(
            'filterUnit', 
            SDMKState.masterData.units, 
            'id', 
            'name',
            '-- Semua Unit --'
        );
        
        this.populateSelect(
            'inputUnit', 
            SDMKState.masterData.units, 
            'id', 
            'name',
            '-- Pilih Unit --'
        );
        
        // Education Level dropdown
        this.populateSelect(
            'inputEducationLevel', 
            SDMKState.masterData.educationLevels, 
            'id', 
            'name',
            '-- Pilih Pendidikan --'
        );
        
        // Employment Status dropdown
        this.populateSelect(
            'filterEmploymentStatus', 
            SDMKState.masterData.employmentStatuses, 
            'id', 
            'name',
            '-- Semua Status --'
        );
        
        this.populateSelect(
            'inputEmploymentStatus', 
            SDMKState.masterData.employmentStatuses, 
            'id', 
            'name',
            '-- Pilih Status --'
        );
    },
    
    /**
     * Helper function to populate a select element
     * @param {string} elementId - ID of select element
     * @param {Array} data - Array of objects
     * @param {string} valueField - Field name for value
     * @param {string} textField - Field name for display text
     * @param {string} placeholder - Default option text
     */
    populateSelect(elementId, data, valueField, textField, placeholder) {
        const select = document.getElementById(elementId);
        if (!select) return;
        
        // Clear existing options except first
        select.innerHTML = '';
        
        // Add placeholder option
        if (placeholder) {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholder;
            select.appendChild(placeholderOption);
        }
        
        // Add data options
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            select.appendChild(option);
        });
    },
    
    // ==========================================
    // DATA LOADING & PAGINATION
    // ==========================================
    
    /**
     * Load data SDMK dengan filter & pagination
     * @param {Object} options - Options untuk query
     * @param {number} options.page - Halaman saat ini (default: 1)
     * @param {number} options.limit - Jumlah per halaman (default: 20)
     * @param {Object} options.filters - Filter object
     * @param {string} options.sortBy - Kolom sort
     * @param {string} options.sortOrder - Arah sort (asc/desc)
     */
    async loadData(options = {}) {
        const supabase = getSupabase();
        
        try {
            // Update state dari options
            SDMKState.currentPage = options.page || SDMKState.currentPage;
            SDMKState.pageSize = options.limit || SDMKState.pageSize;
            if (options.filters) Object.assign(SDMKState.filters, options.filters);
            if (options.sortBy) SDMKState.sortBy = options.sortBy;
            if (options.sortOrder) SDMKState.sortOrder = options.sortOrder;
            
            // Set loading state
            SDMKState.isLoading = true;
            this.updateLoadingUI(true);
            
            console.log(`📊 [PAMUNGKAS-SDMK] Loading data page ${SDMKState.currentPage}...`);
            
            // Build query - menggunakan v_sdmk_detail view untuk join
            let query = supabase
                .from('v_sdmk_detail')
                .select('*', { count: 'exact' });
            
            // Apply filters
            query = this.applyFilters(query);
            
            // Apply sorting
            query = query.order(SDMKState.sortBy, { 
                ascending: SDMKState.sortOrder === 'asc',
                nullsFirst: false 
            });
            
            // Apply pagination
            const from = (SDMKState.currentPage - 1) * SDMKState.pageSize;
            const to = from + SDMKState.pageSize - 1;
            query = query.range(from, to);
            
            // Execute query
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            // Update state
            SDMKState.data = data || [];
            SDMKState.totalCount = count || 0;
            SDMKState.totalPages = Math.ceil(SDMKState.totalCount / SDMKState.pageSize);
            
            console.log(`✅ [PAMUNGKAS-SDMK] Loaded ${SDMKState.data.length} records (total: ${SDMKState.totalCount})`);
            
            // Render UI
            this.renderTable();
            this.renderPagination();
            this.updateStats();
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error loading data:', error);
            this.showError('Gagal memuat data: ' + error.message);
        } finally {
            SDMKState.isLoading = false;
            this.updateLoadingUI(false);
        }
    },
    
    /**
     * Apply filters ke Supabase query
     * @param {object} query - Supabase query builder
     * @returns {object} Modified query
     */
    applyFilters(query) {
        const f = SDMKState.filters;
        
        // Text search (nama, NIK, NIP, jabatan)
        if (f.search && f.search.trim()) {
            const searchTerm = f.search.trim();
            // Gunakan OR untuk multiple columns
            // Note: Full-text search lebih baik tapi ini basic implementation
            query = query.or(`nama_lengkap.ilike.%${searchTerm}%,nik.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%,jabatan.ilike.%${searchTerm}%`);
        }
        
        // Filter profesi
        if (f.profession_id) {
            query = query.eq('profession_id', f.profession_id);
        }
        
        // Filter unit
        if (f.unit_id) {
            query = query.eq('unit_id', f.unit_id);
        }
        
        // Filter status kepegawaian
        if (f.employment_status_id) {
            query = query.eq('employment_status_id', f.employment_status_id);
        }
        
        // Filter gender
        if (f.jenis_kelamin) {
            query = query.eq('jenis_kelamin', f.jenis_kelamin);
        }
        
        // Filter active/non-active
        if (f.is_active !== null && f.is_active !== undefined) {
            query = query.eq('is_active', f.is_active);
        }
        
        return query;
    },
    
    /**
     * Refresh data (reload current page)
     */
    async refresh() {
        await this.loadData({ page: SDMKState.currentPage });
    },
    
    // ==========================================
    // CRUD OPERATIONS
    // ==========================================
    
    /**
     * Buat record SDMK baru
     * @param {Object} formData - Form data
     * @returns {Object} Created record atau error
     */
    async create(formData) {
        const supabase = getSupabase();
        
        try {
            // Cek permission
            if (typeof hasPermission === 'function') {
                const canCreate = await hasPermission('sdmk.create');
                if (!canCreate) {
                    throw new Error('Anda tidak memiliki izin untuk menambah data SDMK');
                }
            }
            
            SDMKState.isSaving = true;
            this.updateSavingUI(true);
            
            console.log('➕ [PAMUNGKAS-SDMK] Creating new record...');
            
            // Prepare data
            const recordData = {
                nik: formData.nik || null,
                nip: formData.nip || null,
                nama_lengkap: formData.nama_lengkap,
                gelar_depan: formData.gelar_depan || null,
                gelar_belakang: formData.gelar_belakang || null,
                tempat_lahir: formData.tempat_lahir || null,
                tanggal_lahir: formData.tanggal_lahir || null,
                jenis_kelamin: formData.jenis_kelamin || null,
                alamat: formData.alamat || null,
                nomor_hp: formData.nomor_hp || null,
                email: formData.email || null,
                education_level_id: formData.education_level_id || null,
                profession_id: formData.profession_id || null,
                employment_status_id: formData.employment_status_id || null,
                unit_id: formData.unit_id || null,
                jabatan: formData.jabatan || null,
                nomor_str: formData.nomor_str || null,
                nomor_sip: formData.nomor_sip || null,
                status_str: formData.status_str || 'BELUM_PUNYA',
                status_sip: formData.status_sip || 'BELUM_PUNYA',
                tahun_lulus: formData.tahun_lulus ? parseInt(formData.tahun_lulus) : null,
                foto_url: formData.foto_url || null,
                created_by: (await supabase.auth.getUser())?.data?.user?.id
            };
            
            // Insert ke database
            const { data, error } = await supabase
                .from('sdmk')
                .insert(recordData)
                .select()
                .single();
            
            if (error) {
                // Handle unique constraint violations
                if (error.code === '23505') {
                    if (error.message.includes('nik')) {
                        throw new Error('NIK sudah digunakan oleh SDMK lain');
                    }
                    if (error.message.includes('nip')) {
                        throw new Error('NIP sudah digunakan oleh SDMK lain');
                    }
                }
                throw error;
            }
            
            console.log('✅ [PAMUNGKAS-SDMK] Record created:', data.id);
            
            // Show success message
            this.showSuccess('Data SDMK berhasil ditambahkan');
            
            // Close modal and refresh
            this.closeModal();
            await this.refresh();
            
            return data;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error creating record:', error);
            this.showError(error.message || 'Gagal menambah data SDMK');
            throw error;
        } finally {
            SDMKState.isSaving = false;
            this.updateSavingUI(false);
        }
    },
    
    /**
     * Update record SDMK yang ada
     * @param {string|UUID} id - Record ID
     * @param {Object} formData - Form data
     * @returns {Object} Updated record atau error
     */
    async update(id, formData) {
        const supabase = getSupabase();
        
        try {
            // Cek permission
            if (typeof hasPermission === 'function') {
                const canUpdate = await hasPermission('sdmk.update');
                if (!canUpdate) {
                    throw new Error('Anda tidak memiliki izin untuk mengubah data SDMK');
                }
            }
            
            SDMKState.isSaving = true;
            this.updateSavingUI(true);
            
            console.log(`✏️ [PAMUNGKAS-SDMK] Updating record ${id}...`);
            
            // Prepare update data
            const updateData = {
                nik: formData.nik || null,
                nip: formData.nip || null,
                nama_lengkap: formData.nama_lengkap,
                gelar_depan: formData.gelar_depan || null,
                gelar_belakang: formData.gelar_belakang || null,
                tempat_lahir: formData.tempat_lahir || null,
                tanggal_lahir: formData.tanggal_lahir || null,
                jenis_kelamin: formData.jenis_kelamin || null,
                alamat: formData.alamat || null,
                nomor_hp: formData.nomor_hp || null,
                email: formData.email || null,
                education_level_id: formData.education_level_id || null,
                profession_id: formData.profession_id || null,
                employment_status_id: formData.employment_status_id || null,
                unit_id: formData.unit_id || null,
                jabatan: formData.jabatan || null,
                nomor_str: formData.nomor_str || null,
                nomor_sip: formData.nomor_sip || null,
                status_str: formData.status_str || 'BELUM_PUNYA',
                status_sip: formData.status_sip || 'BELUM_PUNYA',
                tahun_lulus: formData.tahun_lulus ? parseInt(formData.tahun_lulus) : null,
                foto_url: formData.foto_url || null,
                updated_by: (await supabase.auth.getUser())?.data?.user?.id
            };
            
            // Update database
            const { data, error } = await supabase
                .from('sdmk')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                // Handle unique constraint violations
                if (error.code === '23505') {
                    if (error.message.includes('nik')) {
                        throw new Error('NIK sudah digunakan oleh SDMK lain');
                    }
                    if (error.message.includes('nip')) {
                        throw new Error('NIP sudah digunakan oleh SDMK lain');
                    }
                }
                throw error;
            }
            
            console.log('✅ [PAMUNGKAS-SDMK] Record updated:', data.id);
            
            // Show success message
            this.showSuccess('Data SDMK berhasil diperbarui');
            
            // Close modal and refresh
            this.closeModal();
            await this.refresh();
            
            return data;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error updating record:', error);
            this.showError(error.message || 'Gagal memperbarui data SDMK');
            throw error;
        } finally {
            SDMKState.isSaving = false;
            this.updateSavingUI(false);
        }
    },
    
    /**
     * Soft delete / non-aktifkan record SDMK
     * @param {string|UUID} id - Record ID
     * @returns {boolean} Success status
     */
    async softDelete(id) {
        const supabase = getSupabase();
        
        try {
            // Cek permission
            if (typeof hasPermission === 'function') {
                const canDelete = await hasPermission('sdmk.delete');
                if (!canDelete) {
                    throw new Error('Anda tidak memiliki izin untuk menonaktifkan data SDMK');
                }
            }
            
            // Konfirmasi dulu
            const confirmed = confirm(
                'Apakah Anda yakin ingin menonaktifkan data SDMK ini?\n\n' +
                '⚠️ Data tidak akan dihapus permanen dan dapat dikembalikan nanti.'
            );
            
            if (!confirmed) return false;
            
            console.log(`🗑️ [PAMUNGKAS-SDMK] Soft deleting record ${id}...`);
            
            // Soft delete via RPC function (lebih aman)
            const userId = (await supabase.auth.getUser())?.data?.user?.id;
            
            const { data, error } = await supabase.rpc('soft_delete_sdmk', {
                p_sdmk_id: id,
                p_deleted_by: userId
            });
            
            if (error) throw error;
            
            // Fallback jika RPC tidak ada, langsung update
            if (!data?.success) {
                const { error: updateError } = await supabase
                    .from('sdmk')
                    .update({
                        is_active: false,
                        status_aktif: 'NONAKTIF',
                        updated_by: userId
                    })
                    .eq('id', id);
                
                if (updateError) throw updateError;
            }
            
            console.log('✅ [PAMUNGKAS-SDMK] Record soft deleted:', id);
            
            // Show success message
            this.showSuccess('Data SDMK berhasil dinonaktifkan');
            
            // Refresh data
            await this.refresh();
            
            return true;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error soft deleting:', error);
            this.showError(error.message || 'Gagal menonaktifkan data SDMK');
            return false;
        }
    },
    
    /**
     * Restore soft-deleted record
     * @param {string|UUID} id - Record ID
     * @returns {boolean} Success status
     */
    async restore(id) {
        const supabase = getSupabase();
        
        try {
            // Cek permission
            if (typeof hasPermission === 'function') {
                const canRestore = await hasPermission('sdmk.restore');
                if (!canRestore) {
                    throw new Error('Anda tidak memiliki izin untuk mengaktifkan kembali data SDMK');
                }
            }
            
            console.log(`♻️ [PAMUNGKAS-SDMK] Restoring record ${id}...`);
            
            const userId = (await supabase.auth.getUser())?.data?.user?.id;
            
            // Restore via RPC function
            const { data, error } = await supabase.rpc('restore_sdmk', {
                p_sdmk_id: id,
                p_restored_by: userId
            });
            
            if (error) throw error;
            
            // Fallback
            if (!data?.success) {
                const { error: updateError } = await supabase
                    .from('sdmk')
                    .update({
                        is_active: true,
                        status_aktif: 'AKTIF',
                        updated_by: userId
                    })
                    .eq('id', id);
                
                if (updateError) throw updateError;
            }
            
            console.log('✅ [PAMUNGKAS-SDMK] Record restored:', id);
            
            this.showSuccess('Data SDMK berhasil diaktifkan kembali');
            await this.refresh();
            
            return true;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error restoring:', error);
            this.showError(error.message || 'Gagal mengaktifkan data SDMK');
            return false;
        }
    },
    
    /**
     * Get detail satu record SDMK
     * @param {string|UUID} id - Record ID
     * @returns {Object} Record detail
     */
    async getById(id) {
        const supabase = getSupabase();
        
        try {
            const { data, error } = await supabase
                .from('v_sdmk_detail')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Error getting detail:', error);
            throw error;
        }
    },
    
    // ==========================================
    // SEARCH & FILTER
    // ==========================================
    
    /**
     * Handle search input change
     * Debounced untuk performa
     */
    handleSearch: debounce(function(searchText) {
        SDMKState.filters.search = searchText;
        SDMKState.currentPage = 1; // Reset to first page
        PamungkasSDMK.loadData();
    }, 500),
    
    /**
     * Apply filter dan reload data
     * @param {string} filterType - Type of filter
     * @param {*} value - Filter value
     */
    applyFilter(filterType, value) {
        SDMKState.filters[filterType] = value || null;
        SDMKState.currentPage = 1; // Reset to first page
        this.loadData();
    },
    
    /**
     * Reset semua filters ke default
     */
    resetFilters() {
        SDMKState.filters = {
            search: '',
            profession_id: null,
            unit_id: null,
            employment_status_id: null,
            jenis_kelamin: null,
            is_active: true
        };
        
        // Reset form inputs
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        // Reset selects
        ['filterProfession', 'filterUnit', 'filterEmploymentStatus', 'filterGender'].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.selectedIndex = 0;
        });
        
        // Reload data
        SDMKState.currentPage = 1;
        this.loadData();
    },
    
    /**
     * Toggle show inactive records
     */
    toggleShowInactive(showInactive) {
        SDMKState.filters.is_active = !showInactive;
        SDMKState.currentPage = 1;
        this.loadData();
    },
    
    // ==========================================
    // SORTING
    // ==========================================
    
    /**
     * Handle sort click pada header tabel
     * @param {string} column - Column name
     */
    handleSort(column) {
        if (SDMKState.sortBy === column) {
            // Toggle sort order
            SDMKState.sortOrder = SDMKState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default asc
            SDMKState.sortBy = column;
            SDMKState.sortOrder = 'asc';
        }
        
        this.loadData();
    },
    
    // ==========================================
    // PAGINATION
    // ==========================================
    
    /**
     * Navigate ke halaman tertentu
     * @param {number} page - Page number
     */
    goToPage(page) {
        if (page < 1 || page > SDMKState.totalPages) return;
        this.loadData({ page });
    },
    
    /**
     * Go to next page
     */
    nextPage() {
        if (SDMKState.currentPage < SDMKState.totalPages) {
            this.goToPage(SDMKState.currentPage + 1);
        }
    },
    
    /**
     * Go to previous page
     */
    prevPage() {
        if (SDMKState.currentPage > 1) {
            this.goToPage(SDMKState.currentPage - 1);
        }
    },
    
    /**
     * Change page size
     * @param {number} size - New page size
     */
    changePageSize(size) {
        SDMKState.pageSize = size;
        SDMKState.currentPage = 1;
        this.loadData({ limit: size });
    },
    
    // ==========================================
    // FORM HANDLING
    // ==========================================
    
    /**
     * Setup form event listeners
     */
    setupFormHandlers() {
        // Form submit handler
        const form = document.getElementById('sdmkForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
    },
    
    /**
     * Handle form submission (create or update)
     */
    async handleFormSubmit() {
        // Validate form
        const formData = this.getFormData();
        const validation = this.validateFormData(formData);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }
        
        try {
            if (SDMKState.formMode === 'create') {
                await this.create(formData);
            } else if (SDMKState.formMode === 'edit') {
                await this.update(SDMKState.currentRecord.id, formData);
            }
        } catch (error) {
            // Error already handled in create/update methods
        }
    },
    
    /**
     * Get form data dari form element
     * @returns {Object} Form data
     */
    getFormData() {
        const form = document.getElementById('sdmkForm');
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Manual gets untuk checkboxes yang mungkin tidak termasuk FormData
        data.is_active = document.getElementById('inputIsActive')?.checked ?? true;
        
        return data;
    },
    
    /**
     * Validate form data
     * @param {Object} data - Form data
     * @returns {Object} Validation result { isValid, errors }
     */
    validateFormData(data) {
        const errors = [];
        
        // Nama lengkap wajib
        if (!data.nama_lengkap || data.nama_lengkap.trim().length < 3) {
            errors.push({ field: 'nama_lengkap', message: 'Nama lengkap minimal 3 karakter' });
        }
        
        // NIK validation (jika diisi)
        if (data.nik) {
            if (data.nik.length !== 16 || !/^\d{16}$/.test(data.nik)) {
                errors.push({ field: 'nik', message: 'NIK harus 16 digit angka' });
            }
        }
        
        // NIP validation (jika diisi)
        if (data.nip && data.nip.length > 18) {
            errors.push({ field: 'nip', message: 'NIP maksimal 18 karakter' });
        }
        
        // Email validation (jika diisi)
        if (data.email && !PAMUNGKAS_CONFIG.VALIDATION.EMAIL.pattern.test(data.email)) {
            errors.push({ field: 'email', message: 'Format email tidak valid' });
        }
        
        // Phone validation (jika diisi)
        if (data.nomor_hp && !PAMUNGKAS_CONFIG.VALIDATION.PHONE.pattern.test(data.nomor_hp)) {
            errors.push({ field: 'nomor_hp', message: 'Format nomor HP tidak valid' });
        }
        
        // Tahun lulus validation
        if (data.tahun_lulus) {
            const year = parseInt(data.tahun_lulus);
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear + 5) {
                errors.push({ field: 'tahun_lulus', message: `Tahun lulus harus antara 1900 - ${currentYear + 5}` });
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Show validation errors di form
     * @param {Array} errors - Array of { field, message }
     */
    showValidationErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.validation-error').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        
        // Show new errors
        errors.forEach(err => {
            const field = document.getElementById(`input${err.field.charAt(0).toUpperCase() + err.field.slice(1)}`);
            if (field) {
                field.classList.add('is-invalid');
                
                const errorEl = document.createElement('div');
                errorEl.className = 'validation-error text-danger small mt-1';
                errorEl.textContent = err.message;
                field.parentNode.appendChild(errorEl);
            }
        });
        
        this.showError('Mohon perbaiki kesalahan pada form');
    },
    
    /**
     * Open modal untuk tambah data baru
     */
    openCreateModal() {
        SDMKState.formMode = 'create';
        SDMKState.currentRecord = null;
        
        // Reset form
        const form = document.getElementById('sdmkForm');
        if (form) form.reset();
        
        // Clear validation errors
        document.querySelectorAll('.validation-error').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        
        // Update modal title
        const title = document.getElementById('modalTitle');
        if (title) title.textContent = 'Tambah Data SDMK Baru';
        
        // Show modal
        this.openModal();
    },
    
    /**
     * Open modal untuk edit data
     * @param {string|UUID} id - Record ID
     */
    async openEditModal(id) {
        try {
            SDMKState.formMode = 'edit';
            
            // Load record data
            const record = await this.getById(id);
            SDMKState.currentRecord = record;
            
            // Populate form
            this.populateForm(record);
            
            // Update modal title
            const title = document.getElementById('modalTitle');
            if (title) title.textContent = `Edit Data SDMK: ${record.nama_lengkap}`;
            
            // Show modal
            this.openModal();
            
        } catch (error) {
            this.showError('Gagal memuat data untuk editing');
        }
    },
    
    /**
     * Open modal untuk lihat detail (read-only)
     * @param {string|UUID} id - Record ID
     */
    async openDetailModal(id) {
        try {
            SDMKState.formMode = 'view';
            
            // Load record data
            const record = await this.getById(id);
            SDMKState.currentRecord = record;
            
            // Populate form (disabled)
            this.populateForm(record, true);
            
            // Update modal title
            const title = document.getElementById('modalTitle');
            if (title) title.textContent = `Detail SDMK: ${record.nama_lengkap}`;
            
            // Show modal
            this.openModal();
            
        } catch (error) {
            this.showError('Gagal memuat data detail');
        }
    },
    
    /**
     * Populate form dengan data record
     * @param {Object} record - Record data
     * @param {boolean} disabled - Disable all fields?
     */
    populateForm(record, disabled = false) {
        // Map fields
        const fieldMap = {
            'inputNIK': 'nik',
            'inputNIP': 'nip',
            'inputNamaLengkap': 'nama_lengkap',
            'inputGelarDepan': 'gelar_depan',
            'inputGelarBelakang': 'gelar_belakang',
            'inputTempatLahir': 'tempat_lahir',
            'inputTanggalLahir': 'tanggal_lahir',
            'inputJenisKelamin': 'jenis_kelamin',
            'inputAlamat': 'alamat',
            'inputNomorHP': 'nomor_hp',
            'inputEmail': 'email',
            'inputEducationLevel': 'education_level_id',
            'inputProfession': 'profession_id',
            'inputEmploymentStatus': 'employment_status_id',
            'inputUnit': 'unit_id',
            'inputJabatan': 'jabatan',
            'inputNomorSTR': 'nomor_str',
            'inputNomorSIP': 'nomor_sip',
            'inputStatusSTR': 'status_str',
            'inputStatusSIP': 'status_sip',
            'inputTahunLulus': 'tahun_lulus',
            'inputFotoURL': 'foto_url'
        };
        
        // Set values
        Object.entries(fieldMap).forEach(([elementId, fieldName]) => {
            const element = document.getElementById(elementId);
            if (element && record[fieldName] !== undefined && record[fieldName] !== null) {
                element.value = record[fieldName];
            }
            if (disabled && element) {
                element.disabled = true;
            } else if (!disabled && element) {
                element.disabled = false;
            }
        });
        
        // Show photo if exists
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview && record.foto_url) {
            photoPreview.src = record.foto_url;
            photoPreview.style.display = 'block';
        }
    },
    
    /**
     * Show modal
     */
    openModal() {
        const modal = document.getElementById('sdmkModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    },
    
    /**
     * Hide modal
     */
    closeModal() {
        const modal = document.getElementById('sdmkModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        
        // Re-enable form fields if they were disabled
        document.querySelectorAll('#sdmkForm input, #sdmkForm select, #sdmkForm textarea').forEach(el => {
            el.disabled = false;
        });
    },
    
    // ==========================================
    // TABLE RENDERING
    // ==========================================
    
    /**
     * Setup table event listeners
     */
    setupTableHandlers() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Filter selects
        ['filterProfession', 'filterUnit', 'filterEmploymentStatus', 'filterGender'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', (e) => {
                    const filterType = id.replace('filter', '').toLowerCase();
                    this.applyFilter(filterType === 'profession' ? 'profession_id' :
                                   filterType === 'unit' ? 'unit_id' :
                                   filterType === 'employmentstatus' ? 'employment_status_id' :
                                   'jenis_kelamin', e.target.value);
                });
            }
        });
        
        // Reset filters button
        const resetBtn = document.getElementById('resetFiltersBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }
        
        // Show inactive toggle
        const showInactiveToggle = document.getElementById('showInactiveToggle');
        if (showInactiveToggle) {
            showInactiveToggle.addEventListener('change', (e) => {
                this.toggleShowInactive(e.target.checked);
            });
        }
        
        // Page size selector
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.changePageSize(parseInt(e.target.value));
            });
        }
        
        // Add button
        const addBtn = document.getElementById('addSdmkBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openCreateModal());
        }
        
        // Export buttons
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportToCSV());
        }
        
        const importCsvBtn = document.getElementById('importCsvBtn');
        if (importCsvBtn) {
            importCsvBtn.addEventListener('click', () => this.triggerCSVImport());
        }
        
        // Modal close buttons
        document.querySelectorAll('[data-dismiss="modal"], .modal-backdrop').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    },
    
    /**
     * Render data ke tabel
     */
    renderTable() {
        const tbody = document.getElementById('sdmkTableBody');
        if (!tbody) return;
        
        // Empty state
        if (SDMKState.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-users-slash fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Tidak ada data SDMK</h5>
                            <p class="text-muted small">Belum ada data SDMK yang sesuai dengan filter</p>
                            <button class="btn btn-primary btn-sm mt-2" onclick="PamungkasSDMK.openCreateModal()">
                                <i class="fas fa-plus"></i> Tambah Data Baru
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Render rows
        tbody.innerHTML = SDMKState.data.map((record, index) => `
            <tr class="${!record.is_active ? 'table-secondary' : ''}">
                <!-- No -->
                <td class="text-center">
                    ${(SDMKState.currentPage - 1) * SDMKState.pageSize + index + 1}
                </td>
                
                <!-- Nama -->
                <td>
                    <div class="d-flex align-items-center">
                        ${record.foto_url ? 
                            `<img src="${record.foto_url}" alt="${record.nama_lengkap}" 
                                class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">` :
                            `<div class="avatar-placeholder rounded-circle me-2 d-flex align-items-center justify-content-center" 
                                style="width: 32px; height: 32px; background-color: #e9ecef;">
                                <i class="fas fa-user text-muted small"></i>
                            </div>`
                        }
                        <div>
                            <strong>${this.escapeHtml(record.nama_lengkap)}</strong>
                            ${record.gelar_depan || record.gelar_belakang ? 
                                `<br><small class="text-muted">${this.escapeHtml(record.gelar_depan || '')} ${this.escapeHtml(record.gelar_belakang || '')}</small>` : ''
                            }
                        </div>
                    </div>
                </td>
                
                <!-- NIK -->
                <td>
                    <code>${record.nik || '-'}</code>
                </td>
                
                <!-- Profesi -->
                <td>
                    ${record.profession_name ? 
                        `<span class="badge bg-light text-dark">${this.escapeHtml(record.profession_name)}</span>` : 
                        '<span class="text-muted">-</span>'
                    }
                </td>
                
                <!-- Unit -->
                <td>
                    ${record.unit_name ? 
                        `<span class="badge bg-info text-dark">${this.escapeHtml(record.unit_name)}</span>` : 
                        '<span class="text-muted">-</span>'
                    }
                </td>
                
                <!-- Status -->
                <td>
                    <span class="badge ${this.getStatusBadgeClass(record.status_aktif, record.is_active)}">
                        ${this.escapeHtml(record.status_aktif || '-')}
                    </span>
                    ${!record.is_active ? '<br><small class="text-danger">(Non-aktif)</small>' : ''}
                </td>
                
                <!-- Aksi -->
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <!-- Detail -->
                        <button type="button" class="btn btn-outline-primary" 
                            onclick="PamungkasSDMK.openDetailModal('${record.id}')"
                            title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <!-- Edit -->
                        ${this.canEdit() ? `
                            <button type="button" class="btn btn-outline-warning"
                                onclick="PamungkasSDMK.openEditModal('${record.id}')"
                                title="Edit Data">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        
                        <!-- Delete/Restore -->
                        ${record.is_active ? (
                            this.canDelete() ? `
                                <button type="button" class="btn btn-outline-danger"
                                    onclick="PamungkasSDMK.softDelete('${record.id}')"
                                    title="Non-aktifkan">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''
                        ) : (
                            this.canRestore() ? `
                                <button type="button" class="btn btn-outline-success"
                                    onclick="PamungkasSDMK.restore('${record.id}')"
                                    title="Aktifkan Kembali">
                                    <i class="fas fa-undo"></i>
                                </button>
                            ` : ''
                        )}
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    /**
     * Render pagination controls
     */
    renderPagination() {
        const container = document.getElementById('paginationContainer');
        if (!container) return;
        
        if (SDMKState.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const start = (SDMKState.currentPage - 1) * SDMKState.pageSize + 1;
        const end = Math.min(SDMKState.currentPage * SDMKState.pageSize, SDMKState.totalCount);
        
        let html = `
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div class="text-muted small">
                    Menampilkan <strong>${start}-${end}</strong> dari <strong>${SDMKState.totalCount}</strong> data
                </div>
                <nav aria-label="Page navigation">
                    <ul class="pagination pagination-sm mb-0">
        `;
        
        // Previous button
        html += `
            <li class="page-item ${SDMKState.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="PamungkasSDMK.prevPage(); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, SDMKState.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;
        
        if (endPage > SDMKState.totalPages) {
            endPage = SDMKState.totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="PamungkasSDMK.goToPage(1); return false;">1</a></li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === SDMKState.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="PamungkasSDMK.goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }
        
        if (endPage < SDMKState.totalPages) {
            if (endPage < SDMKState.totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" onclick="PamungkasSDMK.goToPage(${SDMKState.totalPages}); return false;">${SDMKState.totalPages}</a></li>`;
        }
        
        // Next button
        html += `
            <li class="page-item ${SDMKState.currentPage === SDMKState.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="PamungkasSDMK.nextPage(); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        html += `
                    </ul>
                </nav>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    /**
     * Update statistics display
     */
    updateStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;
        
        // Hitung statistik dari data
        const totalActive = SDMKState.data.filter(d => d.is_active).length;
        const totalInactive = SDMKState.data.filter(d => !d.is_active).length;
        
        statsContainer.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="card card-stats">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="stats-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0">${SDMKState.totalCount}</h4>
                                    <small class="text-muted">Total SDMK</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stats">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="stats-icon bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <i class="fas fa-user-check"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0">${totalActive}</h4>
                                    <small class="text-muted">Aktif</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stats">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="stats-icon bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <i class="fas fa-user-clock"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0">${totalInactive}</h4>
                                    <small class="text-muted">Non-Aktif</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stats">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="stats-icon bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <i class="fas fa-stethoscope"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0">${new Set(SDMKState.data.map(d => d.profession_name).filter(Boolean)).size}</h4>
                                    <small class="text-muted">Profesi</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==========================================
    // CSV IMPORT/EXPORT
    // ==========================================
    
    /**
     * Export data SDMK ke CSV
     * Export berdasarkan filter saat ini (bukan semua data!)
     */
    exportToCSV() {
        try {
            console.log('📤 [PAMUNGKAS-SDMK] Exporting to CSV...');
            
            // Headers
            const headers = [
                'No',
                'Nama Lengkap',
                'Gelar Depan',
                'Gelar Belakang',
                'NIK',
                'NIP',
                'Tempat Lahir',
                'Tanggal Lahir',
                'Jenis Kelamin',
                'Alamat',
                'No. HP',
                'Email',
                'Profesi',
                'Pendidikan',
                'Status Kepegawaian',
                'Unit',
                'Jabatan',
                'No. STR',
                'No. SIP',
                'Status STR',
                'Status SIP',
                'Tahun Lulus',
                'Status Aktif',
                'Is Active'
            ];
            
            // Convert data to rows
            const rows = SDMKState.data.map((record, index) => [
                index + 1,
                this.csvEscape(record.nama_lengkap),
                this.csvEscape(record.gelar_depan),
                this.csvEscape(record.gelar_belakang),
                record.nik || '',
                record.nip || '',
                this.csvEscape(record.tempat_lahir),
                record.tanggal_lahir || '',
                record.jenis_kelamin || '',
                this.csvEscape(record.alamat),
                record.nomor_hp || '',
                record.email || '',
                this.csvEscape(record.profession_name),
                this.csvEscape(record.education_level_name),
                this.csvEscape(record.employment_status_name),
                this.csvEscape(record.unit_name),
                this.csvEscape(record.jabatan),
                record.nomor_str || '',
                record.nomor_sip || '',
                record.status_str || '',
                record.status_sip || '',
                record.tahun_lulus || '',
                record.status_aktif || '',
                record.is_active
            ]);
            
            // Build CSV content
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
            
            // Create blob and download
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `sdmk_export_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ [PAMUNGKAS-SDMK] CSV exported successfully');
            this.showSuccess('Data berhasil dieksport ke CSV');
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Export error:', error);
            this.showError('Gagal export data ke CSV');
        }
    },
    
    /**
     * Trigger file input untuk import CSV
     */
    triggerCSVImport() {
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.click();
        }
    },
    
    /**
     * Handle file upload untuk import CSV
     * @param {Event} event - File input change event
     */
    async handleCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validasi file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('File harus format CSV (.csv)');
            return;
        }
        
        // Validasi file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('Ukuran file maksimal 5MB');
            return;
        }
        
        try {
            SDMKState.isImporting = true;
            this.updateImportUI(true);
            
            console.log(`📥 [PAMUNGKAS-SDMK] Importing CSV: ${file.name} (${(file.size/1024).toFixed(2)} KB)`);
            
            // Parse CSV
            const csvContent = await this.readCSVFile(file);
            const records = this.parseCSV(csvContent);
            
            if (records.length === 0) {
                throw new Error('Tidak ada data valid dalam file CSV');
            }
            
            // Konfirmasi import
            const confirmed = confirm(
                `Ditemukan ${records.length} record data SDMK dalam file.\n\n` +
                `Apakah Anda ingin melanjutkan import?\n\n` +
                `⚠️ Record dengan NIK/NIP yang sama akan dilewati.`
            );
            
            if (!confirmed) return;
            
            // Process import
            const result = await this.processImport(records);
            
            // Show result
            alert(
                `Import Selesai!\n\n` +
                `✅ Berhasil: ${result.success} record\n` +
                `❌ Gagal: ${result.failed} record\n` +
                `⏭️ Dilewati: ${result.skipped} record (duplikat)`
            );
            
            // Refresh data
            await this.refresh();
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-SDMK] Import error:', error);
            this.showError(error.message || 'Gagal import data CSV');
        } finally {
            SDMKState.isImporting = false;
            this.updateImportUI(false);
            // Reset file input
            event.target.value = '';
        }
    },
    
    /**
     * Read file as text
     * @param {File} file - File object
     * @returns {Promise<string>} File content
     */
    readCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Gagal membaca file'));
            reader.readAsText(file);
        });
    },
    
    /**
     * Parse CSV content ke array of objects
     * @param {string} csvContent - Raw CSV string
     * @returns {Array} Parsed records
     */
    parseCSV(csvContent) {
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return []; // Need at least header + 1 row
        
        // Parse header
        const headers = this.parseCSVLine(lines[0]);
        
        // Parse data rows
        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= 5) { // Minimal harus ada beberapa kolom
                const record = {};
                headers.forEach((header, idx) => {
                    record[this.normalizeHeader(header)] = values[idx] || null;
                });
                records.push(record);
            }
        }
        
        return records;
    },
    
    /**
     * Parse single CSV line (handle quoted commas)
     * @param {string} line - CSV line
     * @returns {Array} Array of values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim()); // Last value
        
        return result;
    },
    
    /**
     * Normalize header name ke field name database
     * @param {string} header - CSV header
     * @returns {string} Normalized field name
     */
    normalizeHeader(header) {
        const mapping = {
            'nama lengkap': 'nama_lengkap',
            'nama': 'nama_lengkap',
            'gelar depan': 'gelar_depan',
            'gelar belakang': 'gelar_belakang',
            'nik': 'nik',
            'nip': 'nip',
            'tempat lahir': 'tempat_lahir',
            'tanggal lahir': 'tanggal_lahir',
            'jenis kelamin': 'jenis_kelamin',
            'alamat': 'alamat',
            'no hp': 'nomor_hp',
            'nomor hp': 'nomor_hp',
            'no. hp': 'nomor_hp',
            'telepon': 'nomor_hp',
            'email': 'email',
            'profesi': 'profession_name',
            'pendidikan': 'education_level_name',
            'tingkat pendidikan': 'education_level_name',
            'status kepegawaian': 'employment_status_name',
            'status pegawai': 'employment_status_name',
            'unit': 'unit_name',
            'jabatan': 'jabatan',
            'no str': 'nomor_str',
            'nomor str': 'nomor_str',
            'str': 'nomor_str',
            'no sip': 'nomor_sip',
            'nomor sip': 'nomor_sip',
            'sip': 'nomor_sip',
            'status str': 'status_str',
            'status sip': 'status_sip',
            'tahun lulus': 'tahun_lulus',
            'tahun': 'tahun_lulus'
        };
        
        const normalized = header.toLowerCase().trim();
        return mapping[normalized] || normalized.replace(/[^a-z0-9]/g, '_');
    },
    
    /**
     * Process imported records (insert ke database)
     * @param {Array} records - Records to import
     * @returns {Object} Result { success, failed, skipped }
     */
    async processImport(records) {
        const supabase = getSupabase();
        const result = { success: 0, failed: 0, skipped: 0 };
        
        for (let i = 0; i < records.length; i++) {
            try {
                const record = records[i];
                
                // Cek duplikat NIK/NIP
                if (record.nik || record.nip) {
                    let duplicateCheck = supabase.from('sdmk').select('id');
                    
                    if (record.nik) duplicateCheck = duplicateCheck.eq('nik', record.nik);
                    if (record.nip) duplicateCheck = duplicateCheck.eq('nip', record.nip);
                    
                    const { data: existing } = await duplicateCheck.limit(1);
                    
                    if (existing && existing.length > 0) {
                        result.skipped++;
                        continue; // Skip duplicate
                    }
                }
                
                // Prepare insert data
                const insertData = {
                    nik: record.nik || null,
                    nip: record.nip || null,
                    nama_lengkap: record.nama_lengkap || `Imported_${i+1}`,
                    gelar_depan: record.gelar_depan || null,
                    gelar_belakang: record.gelar_belakang || null,
                    tempat_lahir: record.tempat_lahir || null,
                    tanggal_lahir: record.tanggal_lahir || null,
                    jenis_kelamin: record.jenis_kelamin || null,
                    alamat: record.alamat || null,
                    nomor_hp: record.nomor_hp || null,
                    email: record.email || null,
                    jabatan: record.jabatan || null,
                    nomor_str: record.nomor_str || null,
                    nomor_sip: record.nomor_sip || null,
                    tahun_lulus: record.tahun_lulus ? parseInt(record.tahun_lulus) : null,
                    created_by: (await supabase.auth.getUser())?.data?.user?.id
                };
                
                // Resolve foreign keys (by name)
                if (record.profession_name) {
                    const prof = SDMKState.masterData.professions.find(p => 
                        p.name.toLowerCase() === record.profession_name.toLowerCase()
                    );
                    if (prof) insertData.profession_id = prof.id;
                }
                
                if (record.unit_name) {
                    const unit = SDMKState.masterData.units.find(u => 
                        u.name.toLowerCase() === record.unit_name.toLowerCase()
                    );
                    if (unit) insertData.unit_id = unit.id;
                }
                
                if (record.education_level_name) {
                    const edu = SDMKState.masterData.educationLevels.find(e => 
                        e.name.toLowerCase() === record.education_level_name.toLowerCase()
                    );
                    if (edu) insertData.education_level_id = edu.id;
                }
                
                if (record.employment_status_name) {
                    const emp = SDMKState.masterData.employmentStatuses.find(e => 
                        e.name.toLowerCase() === record.employment_status_name.toLowerCase()
                    );
                    if (emp) insertData.employment_status_id = emp.id;
                }
                
                // Insert
                const { error } = await supabase.from('sdmk').insert(insertData);
                
                if (error) {
                    console.warn(`⚠️ [PAMUNGKAS-SDMK] Import row ${i+1} failed:`, error.message);
                    result.failed++;
                } else {
                    result.success++;
                }
                
            } catch (error) {
                console.warn(`⚠️ [PAMUNGKAS-SDMK] Import row ${i+1} error:`, error);
                result.failed++;
            }
        }
        
        return result;
    },
    
    /**
     * Escape value untuk CSV
     * @param {*} value - Value to escape
     * @returns {string} Escaped value
     */
    csvEscape(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Quote if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },
    
    // ==========================================
    // PERMISSION HELPERS
    // ==========================================
    
    /**
     * Cek apakah user bisa edit
     * @returns {boolean}
     */
    canEdit() {
        // Check frontend permission cache
        if (window.PamungkasPermissions) {
            return window.PamungkasPermissions.hasPermissionSync('sdmk.update') ||
                   window.PamungkasPermissions.hasPermissionSync('sdmk.manage');
        }
        return true; // Default allow if permission system not loaded
    },
    
    /**
     * Cek apakah user bisa delete
     * @returns {boolean}
     */
    canDelete() {
        if (window.PamungkasPermissions) {
            return window.PamungkasPermissions.hasPermissionSync('sdmk.delete') ||
                   window.PamungkasPermissions.hasPermissionSync('sdmk.manage');
        }
        return true;
    },
    
    /**
     * Cek apakah user bisa restore
     * @returns {boolean}
     */
    canRestore() {
        if (window.PamungkasPermissions) {
            return window.PamungkasPermissions.hasPermissionSync('sdmk.restore') ||
                   window.PamungkasPermissions.hasPermissionSync('sdmk.manage');
        }
        return true;
    },
    
    /**
     * Show access denied message
     */
    showAccessDenied() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="access-denied-container text-center py-5">
                    <i class="fas fa-lock fa-4x text-warning mb-4"></i>
                    <h2>Akses Ditolak</h2>
                    <p class="text-muted mb-4">
                        Anda tidak memiliki izin untuk mengakses modul Data SDMK.<br>
                        Silakan hubungi administrator untuk mendapatkan akses.
                    </p>
                    <a href="../dashboard.html" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
                    </a>
                </div>
            `;
        }
    },
    
    // ==========================================
    // UI HELPERS
    // ==========================================
    
    /**
     * Escape HTML untuk prevent XSS
     * @param {string} unsafe - Unsafe string
     * @returns {string} Escaped string
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    /**
     * Get badge CSS class untuk status
     * @param {string} status - Status value
     * @param {boolean} isActive - Is active flag
     * @returns {string} CSS classes
     */
    getStatusBadgeClass(status, isActive) {
        if (!isActive) return 'bg-secondary';
        
        const statusMap = {
            'AKTIF': 'bg-success',
            'CUTI': 'bg-warning text-dark',
            'PENSIUN': 'bg-info text-dark',
            'MUTASI': 'bg-primary',
            'NONAKTIF': 'bg-danger',
            'BELUM_EFEKTIF': 'bg-secondary'
        };
        
        return statusMap[status] || 'bg-light text-dark';
    },
    
    /**
     * Update loading UI state
     * @param {boolean} isLoading - Loading state
     */
    updateLoadingUI(isLoading) {
        const loader = document.getElementById('tableLoader');
        const tableContainer = document.getElementById('tableContainer');
        
        if (loader) loader.style.display = isLoading ? 'block' : 'none';
        if (tableContainer) tableContainer.style.opacity = isLoading ? '0.5' : '1';
    },
    
    /**
     * Update saving UI state
     * @param {boolean} isSaving - Saving state
     */
    updateSavingUI(isSaving) {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.disabled = isSaving;
            saveBtn.innerHTML = isSaving ? 
                '<i class="fas fa-spinner fa-spin"></i> Menyimpan...' : 
                '<i class="fas fa-save"></i> Simpan';
        }
    },
    
    /**
     * Update import UI state
     * @param {boolean} isImporting - Importing state
     */
    updateImportUI(isImporting) {
        const importBtn = document.getElementById('importCsvBtn');
        if (importBtn) {
            importBtn.disabled = isImporting;
            importBtn.innerHTML = isImporting ?
                '<i class="fas fa-spinner fa-spin"></i> Importing...' :
                '<i class="fas fa-file-import"></i> Import CSV';
        }
    },
    
    /**
     * Show success toast/message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },
    
    /**
     * Show error toast/message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showToast(message, 'error');
    },
    
    /**
     * Show toast notification
     * @param {string} message - Message
     * @param {string} type - Type: success | error | warning | info
     */
    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());
        
        const icons = {
            success: 'fa-check-circle text-success',
            error: 'fa-exclamation-circle text-danger',
            warning: 'fa-exclamation-triangle text-warning',
            info: 'fa-info-circle text-info'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content d-flex align-items-center p-3 bg-white shadow rounded">
                <i class="fas ${icons[type]} me-2 fa-lg"></i>
                <span>${this.escapeHtml(message)}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.closest('.toast-notification').remove()"></button>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
    }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Debounce function untuk limit frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// EXPORT FOR GLOBAL USE
// ==========================================

window.PamungkasSDMK = PamungkasSDMK;
window.SDMKState = SDMKState;

console.log('📦 [PAMUNGKAS-SDMK] Module loaded v1.0.0');
