// dashboard.js
// Professional dashboard logic: connects to backend endpoints, updates cards, charts, table, and localStorage.

(() => {
  const API_BASE = "http://127.0.0.1:8000/analyze";
  const csvFileInput = document.getElementById("csvFile");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const csvResults = document.getElementById("csvResults");
  const filterPred = document.getElementById("filterPred");
  const searchJob = document.getElementById("searchJob");
  const totalPred = document.getElementById("totalPred");
  const totalFake = document.getElementById("totalFake");
  const totalReal = document.getElementById("totalReal");
  const lastPred = document.getElementById("lastPred");
  const lastConf = document.getElementById("lastConf");
  const alertArea = document.getElementById("alertArea");
  const manualBtn = document.getElementById("manualBtn");

  let history = JSON.parse(localStorage.getItem("predictionHistory") || "[]");
  let pieChart = null;
  let trendChart = null;

  // small helpers
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"'`]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;' }[c]));
  }
  function showToast(message, type = "info", timeout = 3000) {
    alertArea.innerHTML = `<div class="alert alert-${type} alert-inline">${escapeHtml(message)}</div>`;
    if (timeout) setTimeout(() => { alertArea.innerHTML = ""; }, timeout);
  }
  function setLoading(on = true) {
    loadingSpinner.style.display = on ? "inline-block" : "none";
  }

  // Stats + table + charts render
  function updateStats() {
    const fake = history.filter(h => (h.prediction || "").toLowerCase().includes("fake")).length;
    const real = history.filter(h => (h.prediction || "").toLowerCase().includes("real")).length;
    totalPred.innerText = history.length;
    totalFake.innerText = fake;
    totalReal.innerText = real;
    if (history.length > 0) {
      lastPred.innerText = history[0].prediction || "—";
      lastConf.innerText = history[0].confidence || "—";
    } else {
      lastPred.innerText = "—";
      lastConf.innerText = "—";
    }
  }

  function renderTable() {
    const filter = filterPred.value;
    const search = (searchJob.value || "").toLowerCase();

    const filtered = history.filter(j => {
      const matchesFilter = filter === "all" ||
        (filter === "real" && (j.prediction || "").toLowerCase().includes("real")) ||
        (filter === "fake" && (j.prediction || "").toLowerCase().includes("fake"));
      const matchesSearch = (j.title || "").toLowerCase().includes(search) || (j.company || "").toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });

    if (!filtered.length) {
      csvResults.innerHTML = `<tr><td colspan="5" class="text-muted">No predictions yet</td></tr>`;
    } else {
      csvResults.innerHTML = filtered.map((j, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(j.title)}</td>
          <td>${escapeHtml(j.company)}</td>
          <td class="${(j.prediction || "").toLowerCase().includes('real') ? 'text-success' : 'text-danger'}">${escapeHtml(j.prediction)}</td>
          <td>${escapeHtml(j.confidence)}</td>
        </tr>
      `).join("");
    }
    updateStats();
    updateCharts();
    persist();
  }

  function updateCharts() {
    const fakeCount = history.filter(h => (h.prediction || "").toLowerCase().includes("fake")).length;
    const realCount = history.filter(h => (h.prediction || "").toLowerCase().includes("real")).length;

    // Pie
    const pieEl = document.getElementById("predictionPie");
    if (pieEl) {
      if (pieChart) pieChart.destroy();
      pieChart = new Chart(pieEl, {
        type: 'doughnut',
        data: {
          labels: ['Real', 'Fake'],
          datasets: [{ data: [realCount, fakeCount], backgroundColor: ['#28a745', '#dc3545'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });
    }

    // Trend - simple 0/1 per record
    const trendEl = document.getElementById("trendChart");
    if (trendEl) {
      const labels = history.map((_, i) => `#${i+1}`);
      const dataReal = history.map(h => (h.prediction || "").toLowerCase().includes("real") ? 1 : 0);
      const dataFake = history.map(h => (h.prediction || "").toLowerCase().includes("fake") ? 1 : 0);
      if (trendChart) trendChart.destroy();
      trendChart = new Chart(trendEl, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Real', data: dataReal, borderColor: '#28a745', tension: 0.25, fill: false },
            { label: 'Fake', data: dataFake, borderColor: '#dc3545', tension: 0.25, fill: false }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });
    }
  }

  function persist() {
    localStorage.setItem('predictionHistory', JSON.stringify(history.slice(0, 2000)));
  }

  // Manual predict (prompt)
  async function manualPredictPrompt() {
    const title = prompt("Enter Job Title:");
    if (!title) return;
    const description = prompt("Enter Job Description:") || "";
    const company = prompt("Enter Company (optional):") || "";
    await manualPredict(title, description, company);
  }

  async function manualPredict(title, description, company_profile = "") {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('company_profile', company_profile);

      const res = await fetch(`${API_BASE}/predict-text`, { method: 'POST', body: form });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error("Server returned non-JSON for text prediction. See console."); }

      if (!res.ok) throw new Error(data.error || "Prediction failed");

      // normalize prediction label
      let pred = "Unknown";
      if (typeof data.result === 'string') pred = data.result.includes('Real') ? 'Real Job' : (data.result.includes('Fake') ? 'Fake Job' : data.result);
      else if (data.prediction !== undefined) pred = Number(data.prediction) === 1 ? 'Real Job' : 'Fake Job';

      const confidence = data.confidence || data['Confidence (%)'] || data['confidence'] || 'N/A';

      history.unshift({ title, company: company_profile || 'N/A', prediction: pred, confidence });
      showToast(`Predicted: ${pred} (${confidence})`, 'success');
      renderTable();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Manual prediction failed', 'danger');
    } finally {
      setLoading(false);
    }
  }

  // CSV upload handler
  csvFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/predict-csv`, { method: 'POST', body: form });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error('Server returned non-JSON for CSV. See console.'); }

      if (!res.ok) throw new Error(data.error || 'CSV prediction failed');

      // data.results array expected
      let rows = data.results;
      if (!Array.isArray(rows)) {
        if (Array.isArray(data)) rows = data;
        else throw new Error('CSV response format unexpected');
      }

      const mapped = rows.map(r => {
        const title = r.Title || r.title || r['Job Title'] || 'N/A';
        const company = r.Company_profile || r.company_profile || r.Company || r.company || 'N/A';
        let prediction = r.Prediction || r.prediction || (r.result ? (String(r.result).includes('Real') ? 'Real Job' : 'Fake Job') : 'Unknown');
        let confidence = r['Confidence (%)'] || r['Confidence'] || r.confidence || null;
        if (confidence !== null && confidence !== undefined && !String(confidence).includes('%')) {
          confidence = String(confidence).trim() + '%';
        }
        confidence = confidence || 'N/A';
        return { title, company, prediction, confidence };
      });

      history = [...mapped, ...history];
      showToast(`CSV uploaded — ${mapped.length} records added.`, 'success');
      renderTable();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'CSV upload failed', 'danger');
    } finally {
      setLoading(false);
      csvFileInput.value = '';
    }
  });

  // Copy & Download
  document.getElementById('copyResults').addEventListener('click', () => {
    const text = history.map(h => `${h.title} | ${h.company} | ${h.prediction} | ${h.confidence}`).join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 'info')).catch(() => showToast('Copy failed', 'danger'));
  });

  document.getElementById('downloadHistory').addEventListener('click', () => {
    const csv = 'Title,Company,Prediction,Confidence\n' + history.map(h => `"${String(h.title).replace(/"/g,'""')}","${String(h.company).replace(/"/g,'""')}","${String(h.prediction).replace(/"/g,'""')}","${String(h.confidence).replace(/"/g,'""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'predictions.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // filters
  filterPred.addEventListener('change', renderTable);
  searchJob.addEventListener('input', renderTable);
  manualBtn.addEventListener('click', manualPredictPrompt);

  // Chat (optional) - keep hidden by default; you can enable by removing style display:none in HTML
  window.toggleChat = () => {
    const popup = document.getElementById('chatPopup');
    popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
  };
  window.sendMessage = () => {
    const input = document.getElementById('userInput');
    const msg = (input.value || '').trim();
    if (!msg) return;
    const container = document.getElementById('chatMessages');
    const el = document.createElement('div');
    el.className = 'message user';
    el.textContent = msg;
    container.appendChild(el);
    input.value = '';
    setTimeout(() => {
      const bot = document.createElement('div');
      bot.className = 'message bot';
      bot.textContent = 'AI: I can help with analyzing jobs and CSV uploads.';
      container.appendChild(bot);
      container.scrollTop = container.scrollHeight;
    }, 600);
  };

  // initial render
  renderTable();

  // useful console hint
  console.log('FakeJobAI dashboard ready. Backend base:', API_BASE);
})();
