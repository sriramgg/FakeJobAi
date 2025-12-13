// ================= FakeJobAI Chrome Extension - Enhanced =================

const API_BASE = 'http://127.0.0.1:8000/analyze';
let currentResult = null;

// ================= MAIN SCAN BUTTON =================
document.getElementById('scanBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    showLoading(true);
    animateLoadingSteps();

    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrapePageContent
        });

        if (!results || !results[0] || !results[0].result) {
            throw new Error("Could not read page content.");
        }

        const { title, company, description, url } = results[0].result;

        // Try URL-based analysis first (has domain checking)
        let response;
        if (url && (url.includes('linkedin') || url.includes('indeed') || url.includes('glassdoor'))) {
            const fd = new FormData();
            fd.append('url', url);
            response = await fetch(`${API_BASE}/predict-url`, { method: 'POST', body: fd });
        } else {
            // Fall back to text analysis
            const fd = new FormData();
            fd.append('title', title || "Unknown Job");
            fd.append('company_profile', company || "Unknown Company");
            fd.append('description', description || "");
            response = await fetch(`${API_BASE}/predict-text`, { method: 'POST', body: fd });
        }

        const data = await response.json();

        if (response.ok) {
            showResult(data, company, title);
        } else {
            showAlert("Error: " + (data.error || "Analysis failed"));
            showLoading(false);
        }
    } catch (err) {
        showAlert("Error: " + err.message);
        showLoading(false);
    }
});

// ================= SCRAPE PAGE CONTENT =================
function scrapePageContent() {
    let title = "";
    let company = "";
    let description = "";
    const url = window.location.href;

    // 1. Try JSON-LD (Best Source)
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (let s of scripts) {
            const content = s.innerText;
            if (content.includes("JobPosting")) {
                const json = JSON.parse(content);
                const items = Array.isArray(json) ? json : [json];
                for (let obj of items) {
                    if (obj['@type'] === 'JobPosting') {
                        title = obj.title || "";
                        if (obj.hiringOrganization) company = obj.hiringOrganization.name || "";
                        description = obj.description || "";
                    }
                }
            }
        }
    } catch (e) { }

    // 2. Parse Page Title
    if (!company || !title) {
        const pageTitle = document.title;

        if (pageTitle.includes(" at ")) {
            const parts = pageTitle.split(" at ");
            if (!title) title = parts[0].trim();
            if (!company) company = parts[1].split('|')[0].split('-')[0].trim();
        }
        else if (pageTitle.includes(" | ")) {
            const parts = pageTitle.split(" | ");
            if (!title) title = parts[0].trim();
            if (!company && parts.length > 1) {
                const candidate = parts[1].trim();
                if (!candidate.includes("LinkedIn") && !candidate.includes("Indeed")) company = candidate;
            }
        }
        else if (pageTitle.includes(" - ")) {
            const parts = pageTitle.split(" - ");
            if (!title) title = parts[0].trim();
            if (!company && parts.length > 1) company = parts[1].trim();
        }
    }

    // 3. DOM fallbacks
    if (!title) title = document.querySelector('h1')?.innerText || "";
    if (!company) {
        const meta = document.querySelector('meta[property="og:site_name"]');
        if (meta) company = meta.content;
    }

    // 4. Description
    if (!description || description.length < 50) {
        const liDesc = document.querySelector('#job-details, .jobs-description__content');
        if (liDesc) description = liDesc.innerText;

        const indDesc = document.querySelector('#jobDescriptionText');
        if (indDesc) description = indDesc.innerText;

        if (!description) {
            const main = document.querySelector('main') || document.body;
            description = main.innerText;
        }
    }

    // Strip HTML
    if (description.includes('</')) {
        const div = document.createElement('div');
        div.innerHTML = description;
        description = div.innerText;
    }

    return {
        title: title.substring(0, 100),
        company: company.substring(0, 100),
        description: description.substring(0, 10000),
        url: url
    };
}

// ================= LOADING ANIMATION =================
function showLoading(show) {
    const main = document.getElementById('main-view');
    const load = document.getElementById('loading');
    const result = document.getElementById('result-view');
    const domain = document.getElementById('domain-view');

    if (show) {
        main.classList.add('hidden');
        result.classList.add('hidden');
        domain.classList.add('hidden');
        load.classList.remove('hidden');
    } else {
        load.classList.add('hidden');
        main.classList.remove('hidden');
    }
}

function animateLoadingSteps() {
    const steps = ['step1', 'step2', 'step3'];
    let current = 0;

    const interval = setInterval(() => {
        if (current > 0) {
            document.getElementById(steps[current - 1]).classList.remove('active');
            document.getElementById(steps[current - 1]).classList.add('done');
        }

        if (current < steps.length) {
            document.getElementById(steps[current]).classList.add('active');
            current++;
        } else {
            clearInterval(interval);
        }
    }, 600);
}

// ================= SHOW RESULT =================
function showResult(data, companyName, jobTitle) {
    document.getElementById('loading').classList.add('hidden');
    const resView = document.getElementById('result-view');
    resView.classList.remove('hidden');

    currentResult = { data, companyName, jobTitle };

    // Determine result type
    let isReal = false;
    let isBlacklisted = data.is_blacklisted || data.risk_analysis?.is_blacklisted || false;

    if (typeof data.prediction === 'number') isReal = (data.prediction === 1);
    else isReal = (data.result || "").toLowerCase().includes('real');

    const icon = document.getElementById('status-icon');
    const text = document.getElementById('result-text');
    const conf = document.getElementById('confidence-text');

    // Status Icon & Text
    if (isBlacklisted) {
        icon.innerHTML = '🚫';
        text.innerText = "BLACKLISTED SCAM";
        text.className = "blacklisted";
    } else if (isReal) {
        icon.innerHTML = '✅';
        text.innerText = "Real Job";
        text.className = "safe";
    } else {
        icon.innerHTML = '🚨';
        text.innerText = "Fake Job";
        text.className = "danger";
    }

    if (companyName && companyName !== "Unknown Company") {
        text.innerText += ` • ${companyName}`;
    }

    conf.innerText = `AI Confidence: ${data.confidence}`;

    // === RISK METER ===
    const riskScore = data.risk_analysis?.overall_score || 30;
    const riskLevel = data.risk_analysis?.risk_level || 'medium';

    document.getElementById('risk-score-text').innerText = `Risk Score: ${riskScore}/100`;

    // Animate risk meter indicator
    const meter = document.querySelector('.risk-meter');
    setTimeout(() => {
        meter.style.setProperty('--indicator-position', `${riskScore}%`);
        meter.setAttribute('style', `--indicator-left: ${riskScore}%`);
        const style = document.createElement('style');
        style.textContent = `.risk-meter::after { left: ${riskScore}% !important; }`;
        document.head.appendChild(style);
    }, 100);

    // === RISK FLAGS ===
    const flagsContainer = document.getElementById('risk-flags');
    const flags = data.risk_analysis?.flags || [];

    if (flags.length > 0) {
        flagsContainer.innerHTML = '<h5>⚠️ Risk Flags</h5>' +
            flags.slice(0, 4).map(f => {
                const type = f.includes('🚨') ? 'danger' : f.includes('✅') ? 'success' : 'warning';
                return `<span class="flag-pill ${type}">${f}</span>`;
            }).join('');
        flagsContainer.classList.remove('hidden');
    } else {
        flagsContainer.classList.add('hidden');
    }

    // === KEY WORDS ===
    const keywordsContainer = document.getElementById('key-words');
    const keywords = data.explanation?.top_words || [];

    if (keywords.length > 0) {
        keywordsContainer.innerHTML = '<h5>🔑 AI Key Indicators</h5>' +
            keywords.slice(0, 5).map(w => `<span class="keyword">${w}</span>`).join('');
        keywordsContainer.classList.remove('hidden');
    } else {
        keywordsContainer.classList.add('hidden');
    }

    // === RECOMMENDATION ===
    const recContainer = document.getElementById('recommendation');
    const recs = data.risk_analysis?.recommendations || [];

    if (recs.length > 0) {
        const recClass = isBlacklisted ? 'danger' : (isReal ? 'safe' : (riskLevel === 'critical' ? 'danger' : 'warning'));
        recContainer.innerHTML = `<strong>💡 Recommendation:</strong><br>${recs[0]}`;
        recContainer.className = `recommendation ${recClass}`;
        recContainer.classList.remove('hidden');
    } else {
        recContainer.classList.add('hidden');
    }

    // Reset feedback
    document.getElementById('feedbackMsg').classList.add('hidden');
}

// ================= FEEDBACK BUTTONS =================
document.getElementById('feedbackYes').addEventListener('click', () => submitFeedback(true));
document.getElementById('feedbackNo').addEventListener('click', () => submitFeedback(false));

async function submitFeedback(isCorrect) {
    if (!currentResult) return;

    try {
        const fd = new FormData();
        fd.append('title', currentResult.jobTitle || 'Unknown');
        fd.append('correct', isCorrect);

        await fetch(`${API_BASE}/feedback`, { method: 'POST', body: fd });

        const msg = document.getElementById('feedbackMsg');
        msg.innerText = isCorrect ? '✅ Thanks for confirming!' : '📝 Got it, we\'ll improve!';
        msg.classList.remove('hidden');

    } catch (e) {
        console.error('Feedback error:', e);
    }
}

// ================= REPORT SCAM =================
document.getElementById('reportBtn').addEventListener('click', async () => {
    const btn = document.getElementById('reportBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const fd = new FormData();
        fd.append('url', tab.url || '');
        fd.append('company', currentResult?.companyName || '');
        fd.append('details', 'Reported via Chrome Extension');
        fd.append('reporter', 'Chrome Extension User');

        await fetch(`${API_BASE}/report-scam`, { method: 'POST', body: fd });

        btn.innerHTML = '✅ Reported!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-flag"></i> Report Scam';
            btn.disabled = false;
        }, 2000);

    } catch (e) {
        btn.innerHTML = '❌ Failed';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-flag"></i> Report Scam';
            btn.disabled = false;
        }, 2000);
    }
});

// ================= DOMAIN CHECK =================
document.getElementById('domainBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    document.getElementById('main-view').classList.add('hidden');
    document.getElementById('domain-view').classList.remove('hidden');

    const resultDiv = document.getElementById('domain-result');
    resultDiv.innerHTML = '<div style="text-align:center"><div class="spinner"></div><p>Checking domain...</p></div>';

    try {
        const fd = new FormData();
        fd.append('url', tab.url);

        const response = await fetch(`${API_BASE}/check-domain`, { method: 'POST', body: fd });
        const data = await response.json();

        const riskColor = {
            'critical': '#dc2626',
            'high': '#ef4444',
            'medium': '#f59e0b',
            'low': '#10b981'
        }[data.risk_level] || '#6b7280';

        let flagsHtml = (data.flags || []).slice(0, 4).map(f => {
            const type = f.includes('🚨') ? 'danger' : f.includes('✅') ? 'success' : 'warning';
            return `<span class="flag-pill ${type}">${f}</span>`;
        }).join('');

        resultDiv.innerHTML = `
            <div style="text-align:center; margin-bottom:15px;">
                <p style="font-size:12px;color:#6b7280;">Domain: ${data.domain || 'Unknown'}</p>
                <span style="background:${riskColor};color:white;padding:6px 16px;border-radius:20px;font-weight:600;">
                    ${(data.risk_level || 'unknown').toUpperCase()} RISK
                </span>
                <p style="margin-top:10px;font-weight:600;">Score: ${data.risk_score || 0}/100</p>
            </div>
            <div style="margin-bottom:10px;">${flagsHtml}</div>
            ${data.trusted ? '<div style="background:#ecfdf5;padding:8px;border-radius:8px;color:#065f46;font-size:12px;">✅ Trusted job platform</div>' : ''}
            ${data.domain_age?.details ? `<div style="background:#eff6ff;padding:8px;border-radius:8px;color:#1e40af;font-size:12px;margin-top:8px;">📅 ${data.domain_age.details}</div>` : ''}
        `;

    } catch (e) {
        resultDiv.innerHTML = `<p style="color:#ef4444;">Failed to check domain: ${e.message}</p>`;
    }
});

document.getElementById('domainBackBtn').addEventListener('click', () => {
    document.getElementById('domain-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');
});

// ================= BACK BUTTON =================
document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('result-view').classList.add('hidden');
    document.getElementById('main-view').classList.remove('hidden');

    // Reset loading steps
    ['step1', 'step2', 'step3'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'done');
    });
});

// ================= UTILITIES =================
function showAlert(message) {
    alert(message); // Simple alert for extension popup
}
