/**
 * ============================================
 * PAMUNGKAS - Competency Management Module
 * Pengelolaan Pengembangan Mutu dan 
 * Peningkatan Kompetensi SDM Kesehatan
 * ============================================
 * 
 * FILE INI MENANGANI:
 * 1. Master Data Kompetensi (CRUD)
 * 2. Kompetensi SDMK (Assign & Assess)
 * 3. Analisis GAP Kompetensi
 * 4. Dashboard Statistik & Grafik
 * 5. Filter, Search, Pagination
 * 6. Export Data
 * 
 * ⚠️ KEAMANAN:
 * - Semua operasi melalui Supabase Client (RLS enforced)
 * - Frontend permission checks untuk UX saja
 * - Security sebenarnya di RLS PostgreSQL
 * 
 * PENGGUNAAN:
 * // Inisialisasi
 * await PamungkasCompetency.init();
 * 
 * // Load dashboard
 * await PamungkasCompetency.loadDashboard();
 * 
 * // Load data kompetensi SDMK
 * await PamungkasCompetency.loadSDMKCompetencies(sdmkId);
 */

// ==========================================
// COMPETENCY STATE MANAGEMENT
// ==========================================

/**
 * Global state untuk modul Kompetensi
 */
const CompetencyState = {
    // Current active tab/section
    activeTab: 'dashboard',     // dashboard | competencies | sdmk-profile | gap-analysis
    
    // Master data caches
    masterData: {
        competencies: [],       // All competency definitions
        categories: [],         // Competency categories
        units: [],
        professions: []
    },
    
    // SDMK Competencies (current view)
    sdmkCompetencies: {
        data: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 20,
        totalPages: 0,
        currentSDMKId: null,
        currentSDMKName: null
    },
    
    // Gap Analysis data
    gapAnalysis: {
        data: [],
        summaryByUnit: [],
        summaryByProfession: [],
        topGaps: [],
        filters: {
            unit_id: null,
            profession_id: null,
            priority: null,
            status: null,
            min_gap: null
        }
    },
    
    // Dashboard statistics
    dashboard: {
        totalSDMK: 0,
        totalCompetencies: 0,
        totalGaps: 0,
        avgGap: 0,
        highPriorityGaps: 0,
        gapsInProgress: 0,
        gapsClosed: 0,
        chartData: {}
    },
    
    // Form state
    formMode: 'create',      // create | edit | view
    formType: null,          // competency | sdmk-competency | gap
    currentRecord: null,
    
    // Loading states
    isLoading: false,
    isSaving: false,
    
    // Error state
    error: null
};

// Level mappings untuk kalkulasi dan display
const COMPETENCY_LEVELS = {
    'BELUM': { value: 0, color: '#6c757d', label: 'Belum' },
    'KURANG': { value: 1, color: '#dc3545', label: 'Kurang' },
    'CUKUP': { value: 2, color: '#ffc107', label: 'Cukup' },
    'BAIK': { value: 3, color: '#28a745', label: 'Baik' },
    'SANGAT_BAIK': { value: 4, color: '#17a2b8', label: 'Sangat Baik' },
    'AHLI': { value: 5, color: '#6f42c1', label: 'Ahli' }
};

const GAP_PRIORITIES = {
    'TINGGI': { color: '#dc3545', icon: 'exclamation-circle', label: 'Tinggi' },
    'SEDANG': { color: '#ffc107', icon: 'exclamation-triangle', label: 'Sedang' },
    'RENDAH': { color: '#28a745', icon: 'info-circle', label: 'Rendah' }
};

const GAP_STATUSES = {
    'TERIDENTIFIKASI': { color: '#6c757d', badge: 'secondary' },
    'DALAM_PENANGANAN': { color: '#17a2b8', badge: 'info' },
    'TERTUTUP': { color: '#28a745', badge: 'success' },
    'DITUNDA': { color: '#ffc107', badge: 'warning' },
    'TIDAK_RELEVAN': { color: '#e9ecef', badge: 'light' }
};

// ==========================================
// SUPABASE CLIENT
// ==========================================

function getCompetencySupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        return supabase.createClient(
            PAMUNGKAS_CONFIG.SUPABASE_URL,
            PAMUNGKAS_CONFIG.SUPABASE_ANON_KEY
        );
    }
    throw new Error('Supabase client tidak tersedia');
}

let _compSupabase = null;

function getCompSupabase() {
    if (!_compSupabase) {
        _compSupabase = getCompetencySupabase();
    }
    return _compSupabase;
}

// ==========================================
// MAIN MODULE
// ==========================================

const PamungkasCompetency = {
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    /**
     * Inisialisasi modul Kompetensi
     */
    async init() {
        try {
            console.log('🚀 [PAMUNGKAS-COMPETENCY] Initializing module...');
            
            // Cek permission
            if (typeof hasPermission === 'function') {
                const canView = await hasPermission('competency.view');
                if (!canView) {
                    this.showAccessDenied();
                    return false;
                }
            }
            
            // Load master data
            await this.loadMasterData();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Load initial dashboard
            await this.loadDashboard();
            
            console.log('✅ [PAMUNGKAS-COMPETENCY] Module initialized');
            return true;
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-COMPETENCY] Init error:', error);
            this.showError('Gagal menginisialisasi modul Kompetensi');
            return false;
        }
    },
    
    // ==========================================
    // MASTER DATA LOADING
    // ==========================================
    
    async loadMasterData() {
        const supabase = getCompSupabase();
        
        try {
            console.log('📦 [PAMUNGKAS-COMPETENCY] Loading master data...');
            
            const [
                compResult,
                catResult,
                unitResult,
                profResult
            ] = await Promise.all([
                supabase.from('competencies').select('*, competency_categories(id, name)').eq('is_active', true).order('code'),
                supabase.from('competency_categories').select('*').eq('is_active', true).order('sort_order'),
                supabase.from(PAMUNGKAS_CONFIG.DB_TABLES.UNITS).select('id, name, code').eq('is_active', true).order('name'),
                supabase.from(PAMUNGKAS_CONFIG.DB_TABLES.PROFESSIONS).select('id, name, short_name').eq('is_active', true).order('name')
            ]);
            
            if (compResult.error) throw compResult.error;
            if (catResult.error) throw catResult.error;
            if (unitResult.error) throw unitResult.error;
            if (profResult.error) throw profResult.error;
            
            CompetencyState.masterData.competencies = compResult.data || [];
            CompetencyState.masterData.categories = catResult.data || [];
            CompetencyState.masterData.units = unitResult.data || [];
            CompetencyState.masterData.professions = profResult.data || [];
            
            this.populateDropdowns();
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-COMPETENCY] Error loading master data:', error);
            throw error;
        }
    },
    
    populateDropdowns() {
        // Category dropdowns
        this.populateSelect('filterCategory', CompetencyState.masterData.categories, 'id', 'name', '-- Semua Kategori --');
        this.populateSelect('inputCategory', CompetencyState.masterData.categories, 'id', 'name', '-- Pilih Kategori --');
        
        // Unit dropdowns
        this.populateSelect('gapFilterUnit', CompetencyState.masterData.units, 'id', 'name', '-- Semua Unit --');
        
        // Profession dropdowns
        this.populateSelect('gapFilterProfession', CompetencyState.masterData.professions, 'id', 'name', '-- Semua Profesi --');
        
        // Competency dropdowns
        this.populateSelect('inputCompetency', CompetencyState.masterData.competencies, 'id', 'name', '-- Pilih Kompetensi --');
        
        // Priority dropdown
        const prioritySelect = document.getElementById('gapFilterPriority');
        if (prioritySelect) {
            prioritySelect.innerHTML = '<option value="">-- Semua Prioritas --</option>' +
                Object.entries(GAP_PRIORITIES).map(([key, val]) => 
                    `<option value="${key}">${val.label}</option>`
                ).join('');
        }
        
        // Status dropdown
        const statusSelect = document.getElementById('gapFilterStatus');
        if (statusSelect) {
            statusSelect.innerHTML = '<option value="">-- Semua Status --</option>' +
                Object.keys(GAP_STATUSES).map(key => 
                    `<option value="${key}">${key.replace(/_/g, ' ')}</option>`
                ).join('');
        }
        
        // Level dropdowns
        const levelOptions = Object.entries(COMPETENCY_LEVELS).map(([key, val]) => 
            `<option value="${key}">${val.label}</option>`
        ).join('');
        
        ['inputLevel', 'inputRequiredLevel', 'inputCurrentLevel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<option value="">-- Pilih Level --</option>' + levelOptions;
        });
    },
    
    populateSelect(elementId, data, valueField, textField, placeholder) {
        const select = document.getElementById(elementId);
        if (!select) return;
        
        select.innerHTML = '';
        if (placeholder) {
            select.innerHTML = `<option value="">${placeholder}</option>`;
        }
        
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item[valueField];
            opt.textContent = item[textField];
            select.appendChild(opt);
        });
    },
    
    // ==========================================
    // DASHBOARD
    // ==========================================
    
    async loadDashboard() {
        const supabase = getCompSupabase();
        
        try {
            CompetencyState.isLoading = true;
            this.updateLoadingUI(true);
            
            console.log('📊 [PAMUNGKAS-COMPETENCY] Loading dashboard...');
            
            // Load summary stats in parallel
            const [
                totalSDMKResult,
                totalCompResult,
                gapSummaryResult,
                topGapsResult,
                unitSummaryResult,
                profSummaryResult
            ] = await Promise.all([
                // Total SDMK aktif
                supabase.from('sdmk').select('*', { count: 'exact', head: true }).eq('is_active', true),
                
                // Total kompetensi aktif
                supabase.from('competencies').select('*', { count: 'exact', head: true }).eq('is_active', true),
                
                // GAP summary
                supabase.from('v_competency_gaps_detail').select('*'),
                
                // Top GAP kompetensi
                supabase.from('v_top_gap_competencies').select('*'),
                
                // Summary per unit
                supabase.from('v_gap_summary_by_unit').select('*'),
                
                // Summary per profesi
                supabase.from('v_gap_summary_by_profession').select('*')
            ]);
            
            // Update state
            CompetencyState.dashboard.totalSDMK = totalSDMKResult.count || 0;
            CompetencyState.dashboard.totalCompetencies = totalCompResult.count || 0;
            CompetencyState.gapAnalysis.data = gapSummaryResult.data || [];
            CompetencyState.gapAnalysis.topGaps = topGapsResult.data || [];
            CompetencyState.gapAnalysis.summaryByUnit = unitSummaryResult.data || [];
            CompetencyState.gapAnalysis.summaryByProfession = profSummaryResult.data || [];
            
            // Calculate statistics
            this.calculateDashboardStats();
            
            // Render UI
            this.renderDashboardStats();
            this.renderCharts();
            this.renderTopGapsTable();
            this.renderGapSummaries();
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-COMPETENCY] Dashboard error:', error);
            this.showError('Gagal memuat dashboard');
        } finally {
            CompetencyState.isLoading = false;
            this.updateLoadingUI(false);
        }
    },
    
    calculateDashboardStats() {
        const gaps = CompetencyState.gapAnalysis.data;
        
        CompetencyState.dashboard.totalGaps = gaps.length;
        CompetencyState.dashboard.avgGap = gaps.length > 0 
            ? (gaps.reduce((sum, g) => sum + (g.gap_value || 0), 0) / gaps.length).toFixed(2)
            : 0;
        CompetencyState.dashboard.highPriorityGaps = gaps.filter(g => g.priority === 'TINGGI').length;
        CompetencyState.dashboard.gapsInProgress = gaps.filter(g => g.status === 'DALAM_PENANGANAN').length;
        CompetencyState.dashboard.gapsClosed = gaps.filter(g => g.status === 'TERTUTUP').length;
        
        // Prepare chart data
        CompetencyState.dashboard.chartData = {
            byPriority: {
                labels: Object.keys(GAP_PRIORITIES).map(k => GAP_PRIORITIES[k].label),
                data: Object.keys(GAP_PRIORITIES).map(k => gaps.filter(g => g.priority === k).length),
                colors: Object.values(GAP_PRIORITIES).map(p => p.color)
            },
            byStatus: {
                labels: Object.keys(GAP_STATUSES).map(k => k.replace(/_/g, ' ')),
                data: Object.keys(GAP_STATUSES).map(k => gaps.filter(g => g.status === k).length),
                colors: Object.values(GAP_STATUSES).map(s => s.color)
            },
            byLevel: {
                labels: Object.values(COMPETENCY_LEVELS).map(l => l.label),
                data: Object.keys(COMPETENCY_LEVELS).map(k => 
                    gaps.filter(g => g.current_level === k).length
                ),
                colors: Object.values(COMPETENCY_LEVELS).map(l => l.color)
            },
            gapDistribution: {
                labels: ['Gap 1', 'Gap 2', 'Gap 3', 'Gap 4', 'Gap 5'],
                data: [1, 2, 3, 4, 5].map(v => gaps.filter(g => Math.abs(g.gap_value) === v).length),
                color: '#667eea'
            }
        };
    },
    
    renderDashboardStats() {
        const container = document.getElementById('dashboardStats');
        if (!container) return;
        
        const d = CompetencyState.dashboard;
        
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="card card-stats border-start border-4 border-primary">
                        <div class="card-body py-3">
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                    <i class="fas fa-users text-primary fa-lg"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0 fw-bold">${d.totalSDMK.toLocaleString()}</h4>
                                    <small class="text-muted">Total SDMK</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stats border-start border-4 border-info">
                        <div class="card-body py-3">
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                    <i class="fas fa-award text-info fa-lg"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0 fw-bold">${d.totalCompetencies.toLocaleString()}</h4>
                                    <small class="text-muted">Kompetensi</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stats border-start border-4 border-warning">
                        <div class="card-body py-3">
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                    <i class="fas fa-exclamation-triangle text-warning fa-lg"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0 fw-bold">${d.totalGaps.toLocaleString()}</h4>
                                    <small class="text-muted">Total GAP</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-stats border-start border-4 border-danger">
                        <div class="card-body py-3">
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                    <i class="fas fa-fire text-danger fa-lg"></i>
                                </div>
                                <div>
                                    <h4 class="mb-0 fw-bold">${d.highPriorityGaps.toLocaleString()}</h4>
                                    <small class="text-muted">Prioritas Tinggi</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Secondary Stats Row -->
            <div class="row g-3 mt-2">
                <div class="col-md-4">
                    <div class="card bg-gradient-primary text-white">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Rata-rata GAP:</span>
                                <span class="fs-4 fw-bold">${d.avgGap}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-gradient-info text-white">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Sedang Ditangani:</span>
                                <span class="fs-4 fw-bold">${d.gapsInProgress.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-gradient-success text-white">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Sudah Tertutup:</span>
                                <span class="fs-4 fw-bold">${d.gapsClosed.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderCharts() {
        this.renderPriorityChart();
        this.renderStatusChart();
        this.renderLevelChart();
        this.renderGapDistributionChart();
    },
    
    renderPriorityChart() {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;
        
        const cd = CompetencyState.dashboard.chartData.byPriority;
        
        if (window.priorityChartInstance) window.priorityChartInstance.destroy();
        
        window.priorityChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: cd.labels,
                datasets: [{
                    data: cd.data,
                    backgroundColor: cd.colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: 'Distribusi GAP berdasarkan Prioritas'
                    }
                }
            }
        });
    },
    
    renderStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        const cd = CompetencyState.dashboard.chartData.byStatus;
        
        if (window.statusChartInstance) window.statusChartInstance.destroy();
        
        window.statusChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: cd.labels,
                datasets: [{
                    data: cd.data,
                    backgroundColor: cd.colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: {
                        display: true,
                        text: 'Status Penutupan GAP'
                    }
                }
            }
        });
    },
    
    renderLevelChart() {
        const ctx = document.getElementById('levelChart');
        if (!ctx) return;
        
        const cd = CompetencyState.dashboard.chartData.byLevel;
        
        if (window.levelChartInstance) window.levelChartInstance.destroy();
        
        window.levelChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: cd.labels,
                datasets: [{
                    label: 'Jumlah SDMK',
                    data: cd.data,
                    backgroundColor: cd.colors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Distribusi Level Kompetensi Saat Ini'
                    }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    },
    
    renderGapDistributionChart() {
        const ctx = document.getElementById('gapDistChart');
        if (!ctx) return;
        
        const cd = CompetencyState.dashboard.chartData.gapDistribution;
        
        if (window.gapDistChartInstance) window.gapDistChartInstance.destroy();
        
        window.gapDistChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: cd.labels,
                datasets: [{
                    label: 'Jumlah GAP',
                    data: cd.data,
                    backgroundColor: cd.color,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Distribusi Nilai GAP'
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },
    
    renderTopGapsTable() {
        const tbody = document.getElementById('topGapsBody');
        if (!tbody) return;
        
        const gaps = CompetencyState.gapAnalysis.topGaps.slice(0, 10);
        
        if (gaps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="fas fa-check-circle fa-2x mb-2 d-block"></i>
                        Belum ada data GAP kompetensi
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = gaps.map((g, i) => `
            <tr>
                <td class="fw-bold">${i + 1}</td>
                <td>
                    <div>${this.escapeHtml(g.competency_name)}</div>
                    <small class="text-muted">${g.category_name || '-'}</small>
                </td>
                <td><span class="badge bg-light text-dark">${g.total_sdmk_with_gap} SDMK</span></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 8px;">
                            <div class="progress-bar ${g.avg_gap >= 3 ? 'bg-danger' : g.avg_gap >= 2 ? 'bg-warning' : 'bg-success'}" 
                                 style="width: ${(g.avg_gap / 5) * 100}%"></div>
                        </div>
                        <span class="fw-bold small">${g.avg_gap}</span>
                    </div>
                </td>
                <td>
                    <span class="badge bg-danger">${g.critical_count} kritikal</span>
                </td>
            </tr>
        `).join('');
    },
    
    renderGapSummaries() {
        // Summary per Unit
        this.renderGapSummaryTable(
            'unitGapBody',
            CompetencyState.gapAnalysis.summaryByUnit.slice(0, 10),
            ['unit_name', 'total_gaps', 'high_gaps', 'avg_gap']
        );
        
        // Summary per Profesi
        this.renderGapSummaryTable(
            'professionGapBody',
            CompetencyState.gapAnalysis.summaryByProfession.slice(0, 10),
            ['profession_name', 'total_gaps', 'high_gaps', 'avg_gap']
        );
    },
    
    renderGapSummaryTable(tbodyId, data, columns) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center py-3 text-muted">Belum ada data</td></tr>`;
            return;
        }
        
        tbody.innerHTML = data.map(row => `
            <tr>
                <td class="fw-semibold">${this.escapeHtml(row[columns[0]])}</td>
                <td><span class="badge bg-secondary">${row[columns[1]]}</span></td>
                <td>
                    ${row[columns[2]] > 0 ? 
                        `<span class="badge bg-danger">${row[columns[2]]}</span>` : 
                        '<span class="text-success">-</span>'
                    }
                </td>
                <td>
                    <span class="fw-bold ${row[columns[3]] >= 3 ? 'text-danger' : row[columns[3]] >= 2 ? 'text-warning' : 'text-success'}">
                        ${row[columns[3]]}
                    </span>
                </td>
            </tr>
        `).join('');
    },
    
    // ==========================================
    // COMPETENCIES MASTER DATA (CRUD)
    // ==========================================
    
    async loadCompetencies(options = {}) {
        const supabase = getCompSupabase();
        
        try {
            let query = supabase
                .from('competencies')
                .select('*, competency_categories(id, name)')
                .eq('is_active', true);
            
            if (options.search) {
                query = query.or(`name.ilike.%${options.search}%,code.ilike.%${options.search}%`);
            }
            if (options.category_id) {
                query = query.eq('category_id', options.category_id);
            }
            
            query = query.order('code', { ascending: true });
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            CompetencyState.masterData.competencies = data || [];
            this.renderCompetenciesTable(data || []);
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-COMPETENCY] Error loading competencies:', error);
            throw error;
        }
    },
    
    renderCompetenciesTable(data) {
        const tbody = document.getElementById('competenciesTableBody');
        if (!tbody) return;
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-award fa-2x text-muted mb-2 d-block"></i>
                        Belum ada data kompetensi
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.map(comp => `
            <tr>
                <td><code>${this.escapeHtml(comp.code)}</code></td>
                <td class="fw-semibold">${this.escapeHtml(comp.name)}</td>
                <td>${comp.category?.name || '<span class="text-muted">-</span>'}</td>
                <td><span class="badge bg-light text-dark">${comp.domain || '-'}</span></td>
                <td>${comp.description ? `<small class="text-muted">${this.escapeHtml(comp.description.substring(0, 50))}${comp.description.length > 50 ? '...' : ''}</small>` : '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="PamungkasCompetency.viewCompetency('${comp.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${this.canManage() ? `
                            <button class="btn btn-outline-warning btn-sm" onclick="PamungkasCompetency.editCompetency('${comp.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    async createCompetency(formData) {
        const supabase = getCompSupabase();
        
        try {
            const { data, error } = await supabase
                .from('competencies')
                .insert({
                    code: formData.code,
                    name: formData.name,
                    category_id: formData.category_id || null,
                    description: formData.description || null,
                    level: formData.level || null,
                    domain: formData.domain || null
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.showSuccess('Kompetensi berhasil ditambahkan');
            this.closeModal();
            await this.loadCompetencies();
            await this.loadMasterData();
            
            return data;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    },
    
    async updateCompetency(id, formData) {
        const supabase = getCompSupabase();
        
        try {
            const { error } = await supabase
                .from('competencies')
                .update({
                    code: formData.code,
                    name: formData.name,
                    category_id: formData.category_id || null,
                    description: formData.description || null,
                    level: formData.level || null,
                    domain: formData.domain || null
                })
                .eq('id', id);
            
            if (error) throw error;
            
            this.showSuccess('Kompetensi berhasil diperbarui');
            this.closeModal();
            await this.loadCompetencies();
            await this.loadMasterData();
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    },
    
    // ==========================================
    // SDMK COMPETENCIES (ASSIGN & ASSESS)
    // ==========================================
    
    async loadSDMKCompetencies(sdmkId) {
        const supabase = getCompSupabase();
        
        try {
            CompetencyState.sdmkCompetencies.currentSDMKId = sdmkId;
            
            // Get SDMK info
            const { data: sdmk, error: sdmkError } = await supabase
                .from('v_sdmk_detail')
                .select('*')
                .eq('id', sdmkId)
                .single();
            
            if (sdmkError) throw sdmkError;
            
            CompetencyState.sdmkCompetencies.currentSDMKName = sdmk.nama_lengkap;
            
            // Get competencies for this SDMK
            const { data, error } = await supabase
                .from('v_sdmk_competencies_detail')
                .select('*')
                .eq('sdmk_id', sdmkId)
                .order('competency_code', { ascending: true });
            
            if (error) throw error;
            
            CompetencyState.sdmkCompetencies.data = data || [];
            
            this.renderSDMKProfile(sdmk, data || []);
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-COMPETENCY] Error loading SDMK competencies:', error);
            throw error;
        }
    },
    
    renderSDMKProfile(sdmk, competencies) {
        // Update header info
        const profileHeader = document.getElementById('sdmkProfileHeader');
        if (profileHeader) {
            profileHeader.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    ${sdmk.foto_url ? 
                        `<img src="${sdmk.foto_url}" class="rounded-circle" style="width: 60px; height: 60px; object-fit: cover;">` :
                        `<div class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                            <i class="fas fa-user fa-2x text-muted"></i>
                        </div>`
                    }
                    <div>
                        <h4 class="mb-1">${this.escapeHtml(sdmk.nama_lengkap)}</h4>
                        <p class="mb-0 text-muted">
                            ${sdmk.profession_name || '-'} • ${sdmk.unit_name || '-'}
                        </p>
                    </div>
                </div>
            `;
        }
        
        // Calculate stats
        const total = CompetencyState.masterData.competencies.length;
        const measured = competencies.filter(c => c.status === 'TERUKUR').length;
        const levelCounts = {};
        Object.keys(COMPETENCY_LEVELS).forEach(k => levelCounts[k] = 0);
        competencies.forEach(c => {
            if (c.level) levelCounts[c.level]++;
        });
        
        // Render stats cards
        const statsContainer = document.getElementById('sdmkCompStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="row g-2">
                    <div class="col-6 col-md-3">
                        <div class="card text-center py-2">
                            <div class="fs-4 fw-bold text-primary">${total}</div>
                            <small class="text-muted">Total Kompetensi</small>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card text-center py-2">
                            <div class="fs-4 fw-bold text-success">${measured}</div>
                            <small class="text-muted">Terukur</small>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card text-center py-2">
                            <div class="fs-4 fw-bold text-warning">${total - measured}</div>
                            <small class="text-muted">Belum Terukur</small>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card text-center py-2">
                            <div class="fs-4 fw-bold ${levelCounts['AHLI'] + levelCounts['SANGAT_BAIK'] + levelCounts['BAIK'] >= total/2 ? 'text-success' : 'text-danger'}">
                                ${Object.entries(levelCounts).reduce((max, [k, v]) => v > max[1] ? [k, v] : max, ['', 0])[0] || '-'}
                            </div>
                            <small class="text-muted">Dominan</small>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Render radar chart
        this.renderSDMKRadarChart(competencies);
        
        // Render table
        const tbody = document.getElementById('sdmkCompBody');
        if (tbody) {
            if (competencies.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <p class="text-muted mb-2">Belum ada kompetensi yang tercatat</p>
                            <button class="btn btn-primary btn-sm" onclick="PamungkasCompetency.openAssignModal('${sdmkId}')">
                                <i class="fas fa-plus"></i> Assign Kompetensi
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = competencies.map(comp => `
                <tr>
                    <td><code>${comp.competency_code || '-'}</code></td>
                    <td class="fw-semibold">${this.escapeHtml(comp.competency_name)}</td>
                    <td>${comp.category_name || '-'}</td>
                    <td>
                        <span class="badge" style="background-color: ${COMPETENCY_LEVELS[comp.level]?.color || '#6c757d'}">
                            ${COMPETENCY_LEVELS[comp.level]?.label || comp.level || '-'}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-${this.getCompetencyStatusBadge(comp.status)}">
                            ${comp.status?.replace(/_/g, ' ') || '-'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" onclick="PamungkasCompetency.viewSDMKCompetency('${comp.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${this.canManage() ? `
                                <button class="btn btn-outline-warning btn-sm" onclick="PamungkasCompetency.assessSDMKCompetency('${comp.id}')">
                                    <i class="fas fa-clipboard-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    },
    
    renderSDMKRadarChart(competencies) {
        const ctx = document.getElementById('sdmkRadarChart');
        if (!ctx) return;
        
        // Group by domain or use all
        const labels = competencies.map(c => c.competency_name);
        const data = competencies.map(c => COMPETENCY_LEVELS[c.level]?.value ?? 0);
        const colors = competencies.map(c => COMPETENCY_LEVELS[c.level]?.color ?? '#e9ecef');
        
        if (window.sdmkRadarInstance) window.sdmkRadarInstance.destroy();
        
        window.sdmkRadarInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Level Kompetensi',
                    data: data,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    pointBackgroundColor: colors,
                    pointBorderColor: colors,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Profil Kompetensi'
                    }
                }
            }
        });
    },
    
    async assignCompetencyToSDMK(sdmkId, competencyId, level, notes) {
        const supabase = getCompSupabase();
        
        try {
            const userId = (await supabase.auth.getUser())?.data?.user?.id;
            
            const { data, error } = await supabase
                .from('sdmk_competencies')
                .upsert({
                    sdmk_id: sdmkId,
                    competency_id: competencyId,
                    level: level,
                    status: 'TERUKUR',
                    assessed_date: new Date().toISOString().split('T')[0],
                    assessed_by: userId,
                    notes: notes || null,
                    created_by: userId
                }, {
                    onConflict: 'sdmk_id,competency_id',
                    ignoreDuplicates: false
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // Trigger gap analysis update
            await supabase.rpc('update_sdmk_gap_analysis', { p_sdmk_id: sdmkId });
            
            this.showSuccess('Kompetensi berhasil diassign/dinilai');
            await this.loadSDMKCompetencies(sdmkId);
            
            return data;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    },
    
    // ==========================================
    // GAP ANALYSIS
    // ==========================================
    
    async loadGapAnalysis(filters = {}) {
        const supabase = getCompSupabase();
        
        try {
            Object.assign(CompetencyState.gapAnalysis.filters, filters);
            
            let query = supabase
                .from('v_competency_gaps_detail')
                .select('*');
            
            const f = CompetencyState.gapAnalysis.filters;
            
            if (f.unit_id) query = query.eq('unit_id', f.unit_id);
            if (f.profession_id) query = query.eq('profession_id', f.profession_id);
            if (f.priority) query = eq('priority', f.priority);
            if (f.status) query = eq('status', f.status);
            if (f.min_gap) query = query.gte('gap_value', parseInt(f.min_gap));
            
            const { data, error } = await query.order('gap_value', { ascending: false });
            
            if (error) throw error;
            
            CompetencyState.gapAnalysis.data = data || [];
            this.renderGapAnalysisTable(data || []);
            this.calculateDashboardStats(); // Recalculate with filters
            
        } catch (error) {
            console.error('❌ [PAMUNGKAS-COMPETENCY] Error loading gap analysis:', error);
            throw error;
        }
    },
    
    renderGapAnalysisTable(gaps) {
        const tbody = document.getElementById('gapAnalysisBody');
        if (!tbody) return;
        
        if (gaps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <i class="fas fa-check-circle fa-2x text-success mb-2 d-block"></i>
                        Tidak ada GAP teridentifikasi dengan filter ini
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = gaps.map(gap => `
            <tr class="${gap.gap_value >= 3 ? 'table-danger' : gap.gap_value >= 2 ? 'table-warning' : ''}">
                <td>
                    <div class="fw-semibold">${this.escapeHtml(gap.nama_lengkap)}</div>
                    <small class="text-muted">${gap.nik || '-'}</small>
                </td>
                <td>${this.escapeHtml(gap.unit_name || '-')}</td>
                <td>${this.escapeHtml(gap.profession_name || '-')}</td>
                <td>
                    <div>${this.escapeHtml(gap.competency_name)}</div>
                    <small class="text-muted">${gap.category_name || ''}</small>
                </td>
                <td>
                    <span class="badge" style="background-color: ${COMPETENCY_LEVELS[gap.required_level]?.color}">
                        ${COMPETENCY_LEVELS[gap.required_level]?.label}
                    </span>
                </td>
                <td>
                    <span class="badge" style="background-color: ${COMPETENCY_LEVELS[gap.current_level]?.color}">
                        ${COMPETENCY_LEVELS[gap.current_level]?.label}
                    </span>
                </td>
                <td>
                    <span class="badge ${gap.gap_value >= 3 ? 'bg-danger' : gap.gap_value >= 2 ? 'bg-warning' : 'bg-success'} fs-6">
                        ${gap.gap_value > 0 ? '+' : ''}${gap.gap_value}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${GAP_PRIORITIES[gap.priority]?.badge || 'secondary'}">
                        <i class="fas fa-${GAP_PRIORITIES[gap.priority]?.icon} me-1"></i>
                        ${GAP_PRIORITIES[gap.priority]?.label || gap.priority}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${GAP_STATUSES[gap.status]?.badge || 'secondary'}">
                        ${gap.status?.replace(/_/g, ' ') || '-'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        ${this.canManage() ? `
                            <button class="btn btn-outline-info btn-sm" onclick="PamungkasCompetency.editGap('${gap.id}')" title="Edit GAP">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-primary btn-sm" onclick="PamungkasCompetency.viewGapDetail('${gap.id}')" title="Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    async createGap(gapData) {
        const supabase = getCompSupabase();
        
        try {
            const userId = (await supabase.auth.getUser())?.data?.user?.id;
            
            const { data, error } = await supabase
                .from('competency_gaps')
                .insert({
                    sdmk_id: gapData.sdmk_id,
                    competency_id: gapData.competency_id,
                    required_level: gapData.required_level,
                    current_level: gapData.current_level,
                    priority: gapData.priority || 'SEDANG',
                    recommendation: gapData.recommendation || null,
                    target_date: gapData.target_date || null,
                    due_date: gapData.due_date || null,
                    training_type_id: gapData.training_type_id || null,
                    pic_id: gapData.pic_id || null,
                    notes: gapData.notes || null,
                    created_by: userId
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.showSuccess('GAP berhasil dibuat');
            this.closeModal();
            await this.loadGapAnalysis();
            
            return data;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    },
    
    async updateGap(id, gapData) {
        const supabase = getCompSupabase();
        
        try {
            const userId = (await supabase.auth.getUser())?.data?.user?.id;
            
            const { error } = await supabase
                .from('competency_gaps')
                .update({
                    required_level: gapData.required_level,
                    current_level: gapData.current_level,
                    priority: gapData.priority,
                    recommendation: gapData.recommendation,
                    target_date: gapData.target_date,
                    due_date: gapData.due_date,
                    status: gapData.status,
                    training_type_id: gapData.training_type_id,
                    pic_id: gapData.pic_id,
                    notes: gapData.notes,
                    updated_by: userId
                })
                .eq('id', id);
            
            if (error) throw error;
            
            // If status changed to TERTUTUP, set closed_at
            if (gapData.status === 'TERTUTUP') {
                await supabase
                    .from('competency_gaps')
                    .update({ closed_at: new Date().toISOString() })
                    .eq('id', id);
            }
            
            this.showSuccess('GAP berhasil diperbarui');
            this.closeModal();
            await this.loadGapAnalysis();
            
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    },
    
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    
    setupEventHandlers() {
        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Search inputs
        const compSearch = document.getElementById('compSearchInput');
        if (compSearch) {
            compSearch.addEventListener('input', debounce((e) => {
                this.loadCompetencies({ search: e.target.value });
            }, 500));
        }
        
        // Filter selects
        ['gapFilterUnit', 'gapFilterProfession', 'gapFilterPriority', 'gapFilterStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    const filterType = id.replace('gapFilter', '').toLowerCase();
                    this.applyGapFilter(filterType, el.value);
                });
            }
        });
        
        // Refresh buttons
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboard());
        }
        
        // Export buttons
        const exportBtn = document.getElementById('exportCompetencyBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Modal close handlers
        document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    },
    
    switchTab(tabName) {
        CompetencyState.activeTab = tabName;
        
        // Update tab UI
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.id === `${tabName}Content` ? 'block' : 'none';
        });
        
        // Load data for tab
        switch (tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'competencies':
                this.loadCompetencies();
                break;
            case 'gap-analysis':
                this.loadGapAnalysis();
                break;
        }
    },
    
    applyGapFilter(filterType, value) {
        CompetencyState.gapAnalysis.filters[filterType] = value || null;
        this.loadGapAnalysis(CompetencyState.gapAnalysis.filters);
    },
    
    resetGapFilters() {
        CompetencyState.gapAnalysis.filters = {
            unit_id: null,
            profession_id: null,
            priority: null,
            status: null,
            min_gap: null
        };
        
        ['gapFilterUnit', 'gapFilterProfession', 'gapFilterPriority', 'gapFilterStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.selectedIndex = 0;
        });
        
        this.loadGapAnalysis();
    },
    
    // ==========================================
    // MODAL HANDLERS
    // ==========================================
    
    openCreateCompetencyModal() {
        CompetencyState.formMode = 'create';
        CompetencyState.formType = 'competency';
        this.resetForm('competencyForm');
        document.getElementById('modalTitle').textContent = 'Tambah Kompetensi Baru';
        this.openModal();
    },
    
    editCompetency(id) {
        // Implementation for editing competency
        console.log('Edit competency:', id);
    },
    
    viewCompetency(id) {
        // Implementation for viewing competency detail
        console.log('View competency:', id);
    },
    
    openAssignModal(sdmkId) {
        CompetencyState.formType = 'sdmk-competency';
        this.resetForm('assignForm');
        document.getElementById('assignSDMKId').value = sdmkId;
        document.getElementById('modalTitle').textContent = 'Assign Kompetensi ke SDMK';
        this.openModal();
    },
    
    openCreateGapModal() {
        CompetencyState.formMode = 'create';
        CompetencyState.formType = 'gap';
        this.resetForm('gapForm');
        document.getElementById('modalTitle').textContent = 'Buat GAP Analysis Baru';
        this.openModal();
    },
    
    editGap(id) {
        // Load existing gap and show in modal
        console.log('Edit gap:', id);
    },
    
    viewGapDetail(id) {
        // Show gap detail modal
        console.log('View gap detail:', id);
    },
    
    openModal() {
        const modal = document.getElementById('competencyModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    },
    
    closeModal() {
        const modal = document.getElementById('competencyModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    },
    
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },
    
    // ==========================================
    // EXPORT
    // ==========================================
    
    async exportData() {
        try {
            const data = CompetencyState.activeTab === 'gap-analysis' 
                ? CompetencyState.gapAnalysis.data 
                : CompetencyState.masterData.competencies;
            
            if (data.length === 0) {
                this.showError('Tidak ada data untuk diekspor');
                return;
            }
            
            // Determine headers based on active tab
            let headers, rows;
            
            if (CompetencyState.activeTab === 'gap-analysis') {
                headers = ['Nama SDMK', 'NIK', 'Unit', 'Profesi', 'Kompetensi', 'Required', 'Current', 'GAP', 'Prioritas', 'Status'];
                rows = data.map(g => [
                    g.nama_lengkap, g.nik, g.unit_name, g.profession_name,
                    g.competency_name, g.required_level, g.current_level, g.gap_value,
                    g.priority, g.status
                ]);
            } else {
                headers = ['Kode', 'Nama', 'Kategori', 'Domain', 'Deskripsi'];
                rows = data.map(c => [c.code, c.name, c.category?.name, c.domain, c.description]);
            }
            
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
            ].join('\n');
            
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kompetensi_${CompetencyState.activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            
            this.showSuccess('Data berhasil diekspor');
        } catch (error) {
            this.showError('Gagal ekspor data');
        }
    },
    
    // ==========================================
    // PERMISSION HELPERS
    // ==========================================
    
    canManage() {
        if (window.PamungkasPermissions) {
            return window.PamungkasPermissions.hasPermissionSync('competency.manage') ||
                   window.PamungkasPermissions.hasPermissionSync('competency.update');
        }
        return true;
    },
    
    showAccessDenied() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="access-denied-container text-center py-5">
                    <i class="fas fa-lock fa-4x text-warning mb-4"></i>
                    <h2>Akses Ditolak</h2>
                    <p class="text-muted mb-4">Anda tidak memiliki izin untuk mengakses modul Kompetensi.</p>
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
    
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    
    getCompetencyStatusBadge(status) {
        const map = {
            'TERUKUR': 'success',
            'DALAM_PROSES': 'info',
            'BELUM_TERUKUR': 'secondary',
            'KADALUARSA': 'warning',
            'DITANGGUHKAN': 'dark'
        };
        return map[status] || 'secondary';
    },
    
    updateLoadingUI(isLoading) {
        const loader = document.getElementById('competencyLoader');
        if (loader) loader.style.display = isLoading ? 'block' : 'none';
        
        const content = document.getElementById('competencyContent');
        if (content) content.style.opacity = isLoading ? '0.5' : '1';
    },
    
    showSuccess(message) {
        this.showToast(message, 'success');
    },
    
    showError(message) {
        this.showToast(message, 'error');
    },
    
    showToast(message, type = 'info') {
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());
        
        const icons = {
            success: 'fa-check-circle text-success',
            error: 'fa-exclamation-circle text-danger',
            warning: 'fa-exclamation-triangle text-warning',
            info: 'fa-info-circle text-info'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-notification`;
        toast.innerHTML = `
            <div class="toast-content d-flex align-items-center p-3 bg-white shadow rounded">
                <i class="fas ${icons[type]} me-2"></i>
                <span>${this.escapeHtml(message)}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.closest('.toast-notification').remove()"></button>
            </div>
        `;
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease;';
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 5000);
    }
};

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Export
window.PamungkasCompetency = PamungkasCompetency;
window.CompetencyState = CompetencyState;

console.log('📦 [PAMUNGKAS-COMPETENCY] Module loaded v1.0.0');
