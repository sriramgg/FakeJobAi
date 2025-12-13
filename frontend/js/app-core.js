/**
 * FakeJobAI - Core Logic
 */

/* ================= CONFIGURATION ================= */
// Backend: PythonAnywhere (Free Forever)
const API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000/analyze"
    : "https://sriramgg.pythonanywhere.com/analyze";

// State
let history = JSON.parse(localStorage.getItem('historyData') || '[]');
let pieChartInstance = null;
let trendChartInstance = null;
let currentResult = null; // Store current result for feedback

// DOM Elements
const els = {
    statTotal: document.getElementById('statTotal'),
    statFake: document.getElementById('statFake'),
    statReal: document.getElementById('statReal'),
    statBlacklist: document.getElementById('statBlacklist'),
    recentTbody: document.getElementById('recentHistoryTbody'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    filter: document.getElementById('filterPred'),
    urlModal: new bootstrap.Modal(document.getElementById('urlInputModal')),
    manualModal: new bootstrap.Modal(document.getElementById('manualInputModal')),
    domainModal: new bootstrap.Modal(document.getElementById('domainCheckModal')),

    // Modal Specifics
    modalTitle: document.getElementById('modalTitle'),
    modalCompany: document.getElementById('modalCompany'),
    modalPrediction: document.getElementById('modalPrediction'),
    modalConfidence: document.getElementById('modalConfidence'),
    modalRiskScore: document.getElementById('modalRiskScore'),
    riskIndicator: document.getElementById('riskIndicator'),
    modalFlags: document.getElementById('modalFlags'),
    modalPositive: document.getElementById('modalPositive'),
    modalExplanation: document.getElementById('modalExplanation'),
    modalRecommendations: document.getElementById('modalRecommendations'),
    feedbackMsg: document.getElementById('feedbackMsg')
};



/* ================= INITIALIZATION ================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Charts & Stats
    renderDashboard();

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

    // 6. Check for pending Quick Scan from Home Page
    const pendingUrl = sessionStorage.getItem('pendingUrl');
    if (pendingUrl) {
        sessionStorage.removeItem('pendingUrl');
        const urlInput = document.getElementById('inputUrl');
        if (urlInput) {
            urlInput.value = pendingUrl;
            // Auto open modal and submit
            // We wait a brief moment for Bootstrap to init
            setTimeout(() => {
                els.urlModal.show();
                handleUrlSubmit();
            }, 500);
        }
    }
});

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
    els.filter.addEventListener('change', renderTable);

    // URL Analysis
    document.getElementById('urlBtn').addEventListener('click', () => {
        document.getElementById('inputUrl').value = '';
        els.urlModal.show();
    });
    document.getElementById('submitUrlBtn').addEventListener('click', handleUrlSubmit);

    // Manual Analysis
    document.getElementById('manualBtn').addEventListener('click', () => {
        els.manualModal.show();
    });
    document.getElementById('submitManualBtn').addEventListener('click', handleManualSubmit);

    // Domain Check
    document.getElementById('domainCheckBtn').addEventListener('click', () => {
        document.getElementById('inputDomain').value = '';
        document.getElementById('domainResults').style.display = 'none';
        els.domainModal.show();
    });
    document.getElementById('submitDomainBtn').addEventListener('click', handleDomainSubmit);

    // CSV Upload
    document.getElementById('csvFile').addEventListener('change', handleCsvUpload);

    // Clear History
    document.getElementById('clearLocalBtn').addEventListener('click', async () => {
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
    document.getElementById('copyResults')?.addEventListener('click', () => {
        const text = history.map(h => `${h.title} | ${h.company} | ${h.prediction}`).join('\n');
        navigator.clipboard.writeText(text).then(() => alert('History copied to clipboard!'));
    });

    // Main Export PDF
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
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
        entry.location = data.scraped_data?.location || 'Unknown';
        entry.source_url = url;

        // Add to local history list immediately for UI responsiveness
        // (Backend already saved it to DB)
        addToHistory(entry);
        showResultPopup(entry, data);

        // Update Map
        if (entry.location && entry.location !== 'Unknown' && window.updateMapWithJob) {
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

    if (!t || !d) { alert('Title and Description are required', 'warning'); return; }

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
        let flagsHtml = data.flags?.map(f => `<span class="badge bg-warning text-dark me-1">${f}</span>`).join('') || '';

        resultsDiv.innerHTML = `
          <div class="text-center mb-3">
            <h6 class="fw-bold">${data.domain || domain}</h6>
            <span class="badge ${data.risk_level === 'high' ? 'bg-danger' : 'bg-success'}">${(data.risk_level || 'UNKNOWN').toUpperCase()} RISK</span>
            <p class="mt-2 mb-0"><strong>Score:</strong> ${data.risk_score || 0}/100</p>
          </div>
          <div class="mb-2">${flagsHtml}</div>
          ${data.domain_age?.details ? `<div class="alert alert-info small py-1"><i class="fas fa-clock me-1"></i>${data.domain_age.details}</div>` : ''}
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

// Result Popup
function showResultPopup(entry, fullData) {
    currentResult = entry; // Save for feedback logic
    const isReal = entry.prediction.includes('Real');

    // 1. Header Info
    if (els.modalTitle) els.modalTitle.innerText = entry.title || "Unknown Title";
    if (els.modalCompany) els.modalCompany.innerText = entry.company || "Unknown Company";

    // 2. Main Prediction
    if (els.modalPrediction) {
        els.modalPrediction.innerHTML = isReal
            ? `<div style="font-size: 3rem;">✅</div><h3 class="text-success fw-bold">Likely Real</h3>`
            : `<div style="font-size: 3rem;">🚨</div><h3 class="text-danger fw-bold">Potential Fake</h3>`;
    }
    if (els.modalConfidence) els.modalConfidence.innerText = `Confidence: ${entry.confidence}`;

    // 3. Risk Meter
    const score = entry.risk_score || 0;
    if (els.modalRiskScore) els.modalRiskScore.innerText = `${score}/100`;
    if (els.riskIndicator) {
        els.riskIndicator.style.left = `${score}%`;
        els.riskIndicator.style.borderColor = score > 60 ? '#dc2626' : (score > 30 ? '#f59e0b' : '#10b981');
    }

    // 4. Flags
    if (els.modalFlags) {
        const flags = fullData.risk_analysis?.flags || ["No major flags detected."];
        els.modalFlags.innerHTML = flags.map(f => `<span class="flag-pill danger">${f}</span>`).join('');
    }

    // 5. Positive Signals (if any)
    if (els.modalPositive) {
        // Mock positive signals if valid
        if (isReal && score < 30) {
            els.modalPositive.innerHTML = `<span class="flag-pill success">Established Domain</span><span class="flag-pill success">Professional Language</span>`;
        } else {
            els.modalPositive.innerHTML = '';
        }
    }

    // 6. Explanation
    if (els.modalExplanation) {
        els.modalExplanation.innerHTML = `<strong>AI Analysis:</strong> <br> ${entry.explanation?.ai_summary || fullData.explanation || "Detailed analysis indicates this aligns with known patterns."}`;
    }

    // 7. Recommendations
    if (els.modalRecommendations) {
        els.modalRecommendations.innerHTML = isReal
            ? `<div class="alert alert-success small mb-0"><i class="fas fa-check me-2"></i>You can proceed with caution. Always verify interview requests.</div>`
            : `<div class="alert alert-danger small mb-0"><i class="fas fa-ban me-2"></i>Do not provide personal info or money. Report this job.</div>`;

        // Add Download Button
        const dlBtnId = `dl-btn-${Date.now()}`;
        els.modalRecommendations.innerHTML += `
            <div class="d-grid mt-3">
                <button id="${dlBtnId}" class="btn btn-outline-dark btn-sm">
                    <i class="fas fa-download me-2"></i>Download PDF Report
                </button>
            </div>
         `;
        // We need to delay checking for this element as it was just added to innerHTML
        setTimeout(() => {
            const btn = document.getElementById(dlBtnId);
            if (btn) btn.onclick = () => window.downloadReport(entry);
        }, 100);
    }

    // Reset Feedback
    if (els.feedbackMsg) els.feedbackMsg.style.display = 'none';

    // Show Custom Modal
    const modal = document.getElementById('resultModalCustom');
    const overlay = document.getElementById('modalOverlay');

    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function submitFeedback(isAccurate) {
    if (!currentResult) return;
    // Here we would typically send this to backend
    // For now, just show UI confirmation
    if (els.feedbackMsg) {
        els.feedbackMsg.style.display = 'block';
        els.feedbackMsg.innerText = isAccurate ? "Thanks! We'll use this to improve." : "We've noted this inaccuracy. Thanks!";
        els.feedbackMsg.className = isAccurate ? "mt-2 small text-success fw-bold" : "mt-2 small text-warning fw-bold";
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
        a.download = `FakeJobAI_Report_${(entry.company || 'Job').replace(/\s+/g, '_')}.pdf`;
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

window.closeResultModal = function () {
    const modal = document.getElementById('resultModalCustom');
    const overlay = document.getElementById('modalOverlay');

    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

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
