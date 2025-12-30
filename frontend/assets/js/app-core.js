/**
 * FakeJobAI - Core Logic
 */

/* ================= CONFIGURATION ================= */
// Backend API Base - Dynamic detection
const getApiBase = () => {
    const loc = window.location;
    try {
        if (loc.protocol === 'file:') return "http://127.0.0.1:8000/analyze";
        if (loc.port === "8000") return "/analyze";
        return "http://127.0.0.1:8000/analyze";
    } catch (e) {
        return "http://127.0.0.1:8000/analyze";
    }
};

const API_BASE = getApiBase();

// State
let history = [];
try {
    history = JSON.parse(localStorage.getItem('historyData') || '[]');
} catch (e) {
    console.error("Failed to load history", e);
    history = [];
}

let pieChartInstance = null;
let trendChartInstance = null;
let currentResult = null;

// DOM Elements Container (Initialized later)
let els = {};

/* ================= INITIALIZATION ================= */
document.addEventListener('DOMContentLoaded', () => {
    initElements();

    // 1. Initialize Charts & Stats
    if (els.statTotal) renderDashboard();

    // 2. Fetch Real Data from Backend
    fetchDashboardData();

    // 3. Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }

    // 4. Setup Event Listeners
    setupEventListeners();

    // 5. Start Live Simulation
    initLiveSimulation();

    // 6. Check for pending Quick Scan
    try {
        const pendingUrl = sessionStorage.getItem('pendingUrl');
        if (pendingUrl) {
            sessionStorage.removeItem('pendingUrl');
            const urlInput = document.getElementById('inputUrl');
            if (urlInput) {
                urlInput.value = pendingUrl;
                setTimeout(() => {
                    if (els.urlModal && els.urlModal.show) els.urlModal.show();
                    handleUrlSubmit();
                }, 500);
            }
        }
    } catch (e) { console.warn("Session storage error", e); }
});

function initElements() {
    // Safe Element Getter
    const get = (id) => document.getElementById(id);

    els = {
        statTotal: get('statTotal'),
        statFake: get('statFake'),
        statReal: get('statReal'),
        statBlacklist: get('statBlacklist'),
        recentTbody: get('recentHistoryTbody'),
        loadingSpinner: get('loadingSpinner'),
        filter: get('filterPred'),

        // Modals - Wrap in try/catch for safety
        urlModal: safeInitModal('urlInputModal'),
        manualModal: safeInitModal('manualInputModal'),
        domainModal: safeInitModal('domainCheckModal'),

        // Buttons
        manualBtn: get('manualBtn'),
        urlBtn: get('urlBtn'),
        domainCheckBtn: get('domainCheckBtn'),
        submitUrlBtn: get('submitUrlBtn'),
        submitManualBtn: get('submitManualBtn'),
        submitDomainBtn: get('submitDomainBtn'),
        clearLocalBtn: get('clearLocalBtn'),
        copyResults: get('copyResults'),
        exportPdfBtn: get('exportPdfBtn'),
        csvFile: get('csvFile'),

        // Modal Specifics
        modalTitle: get('modalTitle'),
        modalCompany: get('modalCompany'),
        modalPrediction: get('modalPrediction'),
        modalConfidence: get('modalConfidence'),
        modalRiskScore: get('modalRiskScore'),
        riskIndicator: get('riskIndicator'),
        modalFlags: get('modalFlags'),
        modalPositive: get('modalPositive'),
        modalExplanation: get('modalExplanation'),
        modalRecommendations: get('modalRecommendations'),
        feedbackMsg: get('feedbackMsg')
    };
}

// Lazy Proxy for Modals - Fixes initialization race conditions
function safeInitModal(id) {
    return {
        show: () => {
            const el = document.getElementById(id);
            if (el && typeof bootstrap !== 'undefined') {
                // Check if instance exists, else create
                let modal = bootstrap.Modal.getInstance(el);
                if (!modal) modal = new bootstrap.Modal(el);
                modal.show();
            } else {
                console.error(`Cannot show modal: ${id}. Element or Bootstrap missing.`);
                alert("Interface not fully loaded. Please refresh.");
            }
        },
        hide: () => {
            const el = document.getElementById(id);
            if (el && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(el);
                if (modal) modal.hide();
            }
        }
    };
}

async function fetchDashboardData() {
    try {
        // Fetch History
        const res = await fetch(`${API_BASE}/history`);
        if (res.ok) {
            const data = await res.json();
            if (data.history && Array.isArray(data.history)) {
                // Map backend format to frontend format
                const serverHistory = data.history.map(h => ({
                    title: h.title,
                    company: h.company,
                    prediction: h.result,
                    confidence: h.confidence + (typeof h.confidence === 'number' ? '%' : ''),
                    risk_level: h.risk_level,
                    risk_score: h.risk_score,
                    date: h.timestamp,
                    explanation: {} // Detailed explanation might not be in summary list
                }));

                // Merge with local history if needed, or just replace
                // For "proper" operation, let's rely on server truth + local recent
                // But to be safe, let's just use server history as truth for the table
                history = serverHistory;
                localStorage.setItem('historyData', JSON.stringify(history));
                renderDashboard();
            }
        }

        // Fetch Analytics Stats
        const statRes = await fetch(`${API_BASE}/analytics`);
        if (statRes.ok) {
            const stats = await statRes.json();
            if (stats.predictions) {
                if (els.statTotal) els.statTotal.innerText = stats.predictions.total || 0;
                // You can update other global stats here if backend provides them
            }
        }
    } catch (e) {
        console.warn("Backend connection failed, using local data", e);
    }
}

function setupEventListeners() {
    // Filter Change
    if (els.filter) els.filter.addEventListener('change', renderTable);

    // URL Analysis
    if (els.urlBtn) els.urlBtn.addEventListener('click', () => {
        const field = document.getElementById('inputUrl');
        if (field) field.value = '';
        if (els.urlModal) els.urlModal.show();
    });
    if (els.submitUrlBtn) els.submitUrlBtn.addEventListener('click', handleUrlSubmit);

    // Manual Analysis
    if (els.manualBtn) els.manualBtn.addEventListener('click', () => {
        if (els.manualModal) els.manualModal.show();
    });
    if (els.submitManualBtn) els.submitManualBtn.addEventListener('click', handleManualSubmit);

    // Domain Check
    if (els.domainCheckBtn) els.domainCheckBtn.addEventListener('click', () => {
        const field = document.getElementById('inputDomain');
        const res = document.getElementById('domainResults');
        if (field) field.value = '';
        if (res) res.style.display = 'none';
        if (els.domainModal) els.domainModal.show();
    });
    if (els.submitDomainBtn) els.submitDomainBtn.addEventListener('click', handleDomainSubmit);

    // CSV Upload
    if (els.csvFile) els.csvFile.addEventListener('change', handleCsvUpload);

    // Clear History
    if (els.clearLocalBtn) els.clearLocalBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all history? This will invoke the backend.")) {
            try {
                // Clear Backend
                await fetch(`${API_BASE}/clear-history`, { method: 'DELETE' });
                // Clear Local
                history = [];
                localStorage.setItem('historyData', '[]');
                renderDashboard();
                if (els.statTotal) els.statTotal.innerText = '0';
            } catch (e) {
                alert("Failed to clear backend history");
            }
        }
    });

    // Copy Results
    if (els.copyResults) els.copyResults.addEventListener('click', () => {
        const text = history.map(h => `${h.title} | ${h.company} | ${h.prediction}`).join('\n');
        navigator.clipboard.writeText(text).then(() => alert('History copied to clipboard!'));
    });

    // Main Export PDF
    if (els.exportPdfBtn) els.exportPdfBtn.addEventListener('click', () => {
        alert("To export a specific report, please analyze a job and click 'Download Report' in the result popup.");
    });
}

function setLoading(isLoading) {
    if (els.loadingSpinner) els.loadingSpinner.style.display = isLoading ? 'block' : 'none';
}

/* ================= HANDLERS ================= */

// 1. URL Handler
async function handleUrlSubmit() {
    const url = document.getElementById('inputUrl').value.trim();
    if (!url) return;

    els.urlModal.hide();
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append('url', url);

        const response = await fetch(`${API_BASE}/predict-url`, { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed');

        const norm = normalizeData(data);
        const entry = createEntry(
            data.scraped_data?.title || 'External Job',
            data.scraped_data?.company || 'Unknown',
            norm,
            data
        );
        entry.location = data.scraped_data?.location || 'Unknown Location';
        entry.source_url = url;

        // Add to local history list immediately for UI responsiveness
        // (Backend already saved it to DB)
        addToHistory(entry);
        showResultPopup(entry, data);

        // Update Map
        if (entry.location && entry.location !== 'Unknown Location' && window.updateMapWithJob) {
            const isFake = norm.result.includes('Fake');
            window.updateMapWithJob(entry.location, isFake, entry.title);
        }

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        setLoading(false);
    }
}

// 2. Manual Handler
async function handleManualSubmit() {
    const t = document.getElementById('inputTitle').value.trim();
    const c = document.getElementById('inputCompany').value.trim();
    const l = document.getElementById('inputLocation').value.trim();
    const d = document.getElementById('inputDesc').value.trim();
    const isDeep = document.getElementById('deepScanCheck') ? document.getElementById('deepScanCheck').checked : false;

    if (!t || !d) { alert('Title and Description are required'); return; }

    els.manualModal.hide();
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append('title', t);
        formData.append('company_profile', c);
        formData.append('description', d);

        const response = await fetch(`${API_BASE}/predict-text`, { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed');

        // === DEEP SCAN INTEGRATION ===
        if (isDeep && c) {
            try {
                const dsFd = new FormData();
                dsFd.append('company', c);
                const dsRes = await fetch(`${API_BASE}/deep-scan`, { method: 'POST', body: dsFd });
                const dsData = await dsRes.json();

                // Merge into data explanation or a new field
                if (dsData.profiles) {
                    data.explanation = data.explanation || {};
                    data.explanation.ai_summary = (data.explanation.ai_summary || "") +
                        `<br><br><strong>🕵️ Deep Social Scan Results:</strong><br>` +
                        `Social Risk Score: ${dsData.social_risk_score}/100<br>` +
                        dsData.profiles.map(p => `- <i class="fab fa-${p.platform.toLowerCase()}"></i> ${p.platform}: ${p.status} (${p.followers} followers)`).join('<br>');

                    // Adjust risk score if deep scan is bad
                    if (dsData.verdict === "High Risk" && data.risk_analysis) {
                        data.risk_analysis.overall_score = Math.min(100, (data.risk_analysis.overall_score || 0) + 20);
                        data.risk_analysis.risk_level = "high";
                        data.risk_analysis.flags.push("Deep Scan: High Social Risk");
                    }
                }
            } catch (dsErr) {
                console.error("Deep scan failed", dsErr);
            }
        }

        const norm = normalizeData(data);
        const entry = createEntry(t, c, norm, data);
        entry.description = d;
        entry.location = l;

        addToHistory(entry);
        showResultPopup(entry, data);

        // Update Map
        if (l && window.updateMapWithJob) {
            const isFake = norm.result.includes('Fake');
            window.updateMapWithJob(l, isFake, t);
        }

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        setLoading(false);
    }
}

// 3. Domain Handler
async function handleDomainSubmit() {
    const domain = document.getElementById('inputDomain').value.trim();
    if (!domain) return;

    const btn = document.getElementById('submitDomainBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Checking...';
    btn.disabled = true;

    try {
        const fd = new FormData(); fd.append('url', domain);
        const res = await fetch(`${API_BASE}/check-domain`, { method: 'POST', body: fd });
        const data = await res.json();

        const resultsDiv = document.getElementById('domainResults');
        let flagsHtml = data.flags?.map(f => `<div class="small mb-1"><i class="fas fa-info-circle me-1"></i>${f}</div>`).join('') || '';
        let ageHtml = data.domain_age?.details ? `<div class="alert alert-info py-2 px-3 mt-2 mb-0 small text-start"><i class="fas fa-history me-2"></i>${data.domain_age.details}</div>` : '';

        resultsDiv.innerHTML = `
          <div class="p-3 rounded glass-card border">
            <h6 class="fw-bold mb-2">${data.domain || domain}</h6>
            <span class="badge ${data.risk_level === 'high' || data.risk_level === 'critical' ? 'bg-danger' : (data.risk_level === 'medium' ? 'bg-warning' : 'bg-success')}">${(data.risk_level || 'UNKNOWN').toUpperCase()} RISK</span>
            <div class="mt-2 mb-2 fw-bold">Security Score: ${data.risk_score || 0}/100</div>
            <div class="mt-2 text-start">${flagsHtml}</div>
            ${ageHtml}
          </div>
        `;
        resultsDiv.style.display = 'block';

    } catch (err) {
        alert('Domain check failed: ' + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 4. CSV Handler
async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch(`${API_BASE}/predict-csv`, { method: 'POST', body: fd });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed');

        let rows = data.results || [];
        // Map rows to entry format
        rows.forEach(r => {
            const pRaw = r.Prediction || r.result || 'Unknown';
            const norm = normalizeData({ result: pRaw, confidence: r['Confidence (%)'] || 0 });

            const entry = {
                title: r.Title || 'CSV Job',
                company: r.Company || 'Unknown',
                prediction: norm.result,
                confidence: norm.confidence,
                risk_level: norm.result.includes('Fake') ? 'high' : 'low',
                risk_score: norm.result.includes('Fake') ? 85 : 10,
                date: new Date().toLocaleString(),
                source: 'CSV'
            };
            history.unshift(entry);
        });

        // Limit history size
        if (history.length > 100) history = history.slice(0, 100);
        localStorage.setItem('historyData', JSON.stringify(history));

        renderDashboard();
        alert(`Successfully analyzed ${rows.length} jobs from CSV!`);

    } catch (err) {
        alert("CSV Error: " + err.message);
    } finally {
        setLoading(false);
        e.target.value = ''; // Reset input
    }
}

/* ================= HELPERS ================= */

function createEntry(title, company, norm, data) {
    return {
        title: title,
        company: company || 'N/A',
        prediction: norm.result,
        confidence: norm.confidence,
        risk_level: data.risk_analysis?.risk_level || (norm.result.includes('Fake') ? 'high' : 'low'),
        risk_score: data.risk_analysis?.overall_score || 0,
        explanation: data.explanation,
        date: new Date().toLocaleString()
    };
}

function normalizeData(data) {
    let res = data.result || "Unknown";
    let conf = data.confidence || 0;

    // Standardize result string
    if (res.toString().toLowerCase().includes('real')) res = 'Real Job';
    else if (res.toString().toLowerCase().includes('fake')) res = 'Fake Job';
    else if (res === 1) res = 'Real Job';
    else if (res === 0) res = 'Fake Job';

    // Format confidence
    let confStr = conf.toString();
    if (!confStr.includes('%')) confStr += '%';

    return { result: res, confidence: confStr };
}

function addToHistory(entry) {
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem('historyData', JSON.stringify(history));
    renderDashboard();
}

/* ================= RENDERING ================= */

function renderDashboard() {
    renderStats();
    renderTable();
    renderCharts();
}

function renderStats() {
    const total = history.length;
    const fake = history.filter(h => h.prediction && h.prediction.includes('Fake')).length;
    const real = history.filter(h => h.prediction && h.prediction.includes('Real')).length;
    const blacklist = history.filter(h => h.risk_level === 'critical').length;

    if (els.statTotal) els.statTotal.innerText = total;
    if (els.statFake) els.statFake.innerText = fake;
    if (els.statReal) els.statReal.innerText = real;
    if (els.statBlacklist) els.statBlacklist.innerText = blacklist;
}

function renderTable() {
    const filter = els.filter ? els.filter.value : 'all';
    let data = history;

    if (filter === 'real') data = history.filter(h => h.prediction.includes('Real'));
    if (filter === 'fake') data = history.filter(h => h.prediction.includes('Fake'));
    if (filter === 'critical') data = history.filter(h => h.risk_level === 'critical');

    if (els.recentTbody) {
        if (data.length === 0) {
            els.recentTbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No analysis data found. Start by scanning a job!</td></tr>';
            return;
        }

        els.recentTbody.innerHTML = data.map(h => {
            const isReal = h.prediction.includes('Real');
            const badgeClass = isReal ? 'bg-success' : 'bg-danger';
            const riskClass = h.risk_level === 'critical' ? 'bg-dark' : (h.risk_level === 'high' ? 'bg-danger' : (h.risk_level === 'medium' ? 'bg-warning' : 'bg-success'));

            return `
                <tr>
                    <td class="fw-bold">${h.title}</td>
                    <td>${h.company}</td>
                    <td><span class="badge ${badgeClass}">${isReal ? 'Real' : 'Fake'}</span></td>
                    <td><span class="badge ${riskClass}">${(h.risk_level || 'N/A').toUpperCase()}</span></td>
                    <td>${h.confidence}</td>
                    <td class="text-muted small">${(h.date || '').split(',')[0]}</td>
                </tr>
            `;
        }).join('');
    }
}

function renderCharts() {
    const real = history.filter(h => h.prediction && h.prediction.includes('Real')).length;
    const fake = history.filter(h => h.prediction && h.prediction.includes('Fake')).length;

    // Pie Chart
    const ctxPie = document.getElementById('pieChart');
    if (ctxPie) {
        const ctx = ctxPie.getContext('2d');
        if (pieChartInstance) pieChartInstance.destroy();

        pieChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Real', 'Fake'],
                datasets: [{
                    data: [real, fake],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Trend Chart (Mock logic for now based on history)
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        const ctx = ctxTrend.getContext('2d');
        if (trendChartInstance) trendChartInstance.destroy();

        // Create simple trend data from last 10 entries reversed
        const recent = history.slice(0, 10).reverse();
        const riskScores = recent.map(h => h.risk_score || 0);
        const labels = recent.map(h => (h.date || '').split(',')[0]);

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Risk Score',
                    data: riskScores,
                    borderColor: '#f59e0b',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { min: 0, max: 100 } }
            }
        });
    }
}

// Result Popup - Professional Edition
function showResultPopup(entry, fullData) {
    currentResult = entry;
    const isReal = entry.prediction.toString().includes('Real') || entry.prediction === 1;

    // 1. Header Info
    if (els.modalTitle) els.modalTitle.innerText = entry.title || "Job Analysis";
    if (els.modalCompany) els.modalCompany.innerText = entry.company || "Company Profile";

    // Add/Update Location in Popup
    const locId = 'modalLocation';
    let locEl = document.getElementById(locId);
    if (!locEl && els.modalCompany) {
        locEl = document.createElement('div');
        locEl.id = locId;
        locEl.className = 'text-muted small mb-2';
        locEl.style.fontSize = '0.8rem';
        els.modalCompany.parentNode.insertBefore(locEl, els.modalCompany.nextSibling);
    }
    if (locEl) {
        locEl.innerHTML = `<i class="fas fa-map-marker-alt me-1"></i> ${entry.location || 'Remote / Not Specified'}`;
    }

    // 2. Main Prediction Badge
    if (els.modalPrediction) {
        if (isReal) {
            els.modalPrediction.innerHTML = `
                <div class="text-center py-2">
                    <span class="badge bg-success px-4 py-2 rounded-pill fs-6 shadow-sm">
                        <i class="fas fa-check-shield me-2"></i>LEGITIMATE OPPORTUNITY
                    </span>
                    <h5 class="mt-2 text-success fw-bold">Verified Professional Job</h5>
                </div>`;
        } else {
            els.modalPrediction.innerHTML = `
                <div class="text-center py-2">
                    <span class="badge bg-danger px-4 py-2 rounded-pill fs-6 shadow-sm">
                        <i class="fas fa-exclamation-triangle me-2"></i>POTENTIAL THREAT DETECTED
                    </span>
                    <h5 class="mt-2 text-danger fw-bold">High Risk of Fraud</h5>
                </div>`;
        }
    }

    // Confidence
    if (els.modalConfidence) {
        els.modalConfidence.innerHTML = `<span class="text-muted text-uppercase small fw-bold"><span class="sky-blue-ai">AI</span> Confidence Level</span><br><span class="fs-4 fw-bold text-primary">${entry.confidence}</span>`;
    }

    // 3. Risk Meter
    const score = entry.risk_score || 0;
    if (els.modalRiskScore) els.modalRiskScore.innerText = `${score}/100`;
    if (els.riskIndicator) {
        setTimeout(() => {
            els.riskIndicator.style.left = `${score}%`;
            els.riskIndicator.style.backgroundColor = score > 50 ? '#dc3545' : '#198754';
        }, 300);
    }

    // 4. Flags (Clean Text)
    if (els.modalFlags) {
        const flags = fullData.risk_analysis?.flags || [];
        if (flags.length > 0) {
            els.modalFlags.innerHTML = '<h6 class="small fw-bold text-uppercase text-muted border-bottom pb-1">Risk Indicators</h6>' +
                flags.map(f => {
                    const clean = f.replace(/[^\w\s-]/g, '').trim(); // Remove emojis
                    return `<div class="d-flex align-items-center mb-2 text-danger small bg-danger bg-opacity-10 p-2 rounded">
                    <i class="fas fa-times-circle me-2"></i>${clean}
                </div>`;
                }).join('');
        } else {
            els.modalFlags.innerHTML = `<div class="text-muted small"><i class="fas fa-check-circle text-success me-1"></i> No suspicious patterns detected.</div>`;
        }
    }

    // 5. Positive Signals
    if (els.modalPositive) {
        if (isReal) {
            els.modalPositive.innerHTML = '<h6 class="small fw-bold text-uppercase text-muted border-bottom pb-1 mt-3">Verified Signals</h6>' +
                `<div class="d-flex flex-wrap gap-2">
                <span class="badge bg-light text-success border border-success"><i class="fas fa-check me-1"></i>Established Entity</span>
                <span class="badge bg-light text-success border border-success"><i class="fas fa-check me-1"></i>Professional Context</span>
             </div>`;
        } else {
            els.modalPositive.innerHTML = '';
        }
    }

    // 6. Explanation
    if (els.modalExplanation) {
        let content = "";
        const exp = entry.explanation || fullData.explanation;

        // Parse Logic
        if (exp && typeof exp === 'object' && exp.ai_summary) {
            content = exp.ai_summary;
        } else if (exp && typeof exp === 'object' && exp.top_words) {
            content = `Analysis triggered by keyword vectorization: <strong>${exp.top_words.join(', ')}</strong>`;
        } else if (typeof exp === 'string') {
            content = exp;
        } else {
            content = "Standard pattern matching analysis complete.";
        }

        // Sanitize Emojis
        content = content.replace(/✅|🚨|❌|⚠️|🕵️/g, '');

        els.modalExplanation.innerHTML = `
            <div class="mt-3 bg-light p-3 rounded border-start border-4 border-primary">
                <h6 class="fw-bold small text-primary mb-2"><i class="fas fa-microchip me-2"></i><span class="sky-blue-ai">AI</span> ANALYSIS REPORT</h6>
                <p class="mb-0 small text-dark">${content}</p>
            </div>
        `;
    }
    // 7. Recommendations
    if (els.modalRecommendations) {
        els.modalRecommendations.innerHTML = isReal
            ? `<div class="alert alert-success small mb-0"><i class="fas fa-check me-2"></i>You can proceed with caution. Always verify interview requests.</div>`
            : `<div class="alert alert-danger small mb-0"><i class="fas fa-ban me-2"></i>Do not provide personal info or money. Report this job.</div>`;
    }

    // 8. Download Button & Report Logic
    if (els.modalRecommendations) {
        const dlBtnId = `dl-btn-${Date.now()}`;
        const container = document.createElement('div');
        container.className = 'd-grid mt-3';
        container.innerHTML = `
            <button id="${dlBtnId}" class="btn btn-outline-dark btn-sm">
                <i class="fas fa-file-pdf me-2"></i>Download PDF Report
            </button>`;
        els.modalRecommendations.appendChild(container);

        // Bind Click
        setTimeout(() => {
            const btn = document.getElementById(dlBtnId);
            if (btn) btn.addEventListener('click', () => {
                if (window.downloadReport) window.downloadReport(entry);
                else alert("Report generation module loading...");
            });
        }, 100);
    }

    // 9. Setup Feedback & Show
    const modalEl = document.getElementById('resultModalCustom');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function submitFeedback(isAccurate) {
    if (!currentResult) return;
    // Here we would typically send this to backend
    // For now, just show UI confirmation
    if (els.feedbackMsg) {
        els.feedbackMsg.style.display = 'block';
        els.feedbackMsg.innerText = isAccurate ? "Thanks! We'll use this to improve." : "We've noted this inaccuracy. Thanks!";
    }
    setTimeout(() => {
        closeResultModal();
    }, 1500);
}

function closeResultModal() {
    // Hide Custom Modal via Bootstrap if possible
    const el = document.getElementById('resultModalCustom');
    if (el) {
        const modal = bootstrap.Modal.getInstance(el);
        if (modal) modal.hide();
    }
}



// Global action for report download
window.downloadReport = async (entry) => {
    try {
        const btn = document.querySelector('#resultModalCustom .btn-outline-dark');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...'; }

        const res = await fetch(`${API_BASE}/generate-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });

        if (!res.ok) throw new Error('Failed to generate report');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fakejobai_Report_${(entry.company || 'Job').replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (err) {
        alert("Report Error: " + err.message);
    } finally {
        const btn = document.querySelector('#resultModalCustom .btn-outline-dark');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download me-2"></i>Download PDF Report'; }
    }
};

// Close Result Modal - Exposed Globally
window.closeResultModal = function () {
    const el = document.getElementById('resultModalCustom');
    if (el) {
        const modal = bootstrap.Modal.getInstance(el);
        if (modal) modal.hide();
        // Fallback
        el.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style = '';
    }
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.style.display = 'none';
};

window.submitFeedback = submitFeedback; // Expose to global scope for HTML onclick

/* ================= LIVE SIMULATION ================= */
function initLiveSimulation() {
    // 1. Randomly increment global counters (UI visual effect only)
    setInterval(() => {
        if (Math.random() > 0.7) {
            const el = document.getElementById('statTotal');
            if (el) {
                let val = parseInt(el.innerText || "0");
                el.innerText = val + Math.floor(Math.random() * 3) + 1;
            }
        }
    }, 2000);

    // 2. Feed the Map with 'Ghost' data (other users)
    setInterval(() => {
        if (Math.random() > 0.5 && window.updateMapWithJob) {
            const cities = ["New York", "London", "Berlin", "Tokyo", "Mumbai", "Paris", "Sydney", "Toronto", "Dubai", "Singapore"];
            const city = cities[Math.floor(Math.random() * cities.length)];
            const isFake = Math.random() > 0.8; // mostly real traffic
            window.updateMapWithJob(city, isFake, isFake ? "Suspicious Job" : "Verified Job");
        }
    }, 4000);
}

// Global Modal Helper for HTML onclicks
window.openModal = function (id) {
    const el = document.getElementById(id);
    if (!el) return console.error("Modal not found: " + id);
    if (typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(el);
        modal.show();
    } else {
        alert("System loading... please wait.");
    }
};
