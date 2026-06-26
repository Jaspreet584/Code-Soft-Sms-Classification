/* =====================================================================
   SMS Spam Classifier Dashboard – Frontend JavaScript
   ===================================================================== */

'use strict';

// ── Constants ──────────────────────────────────────────────────────────
const API_BASE = '';           // empty = same origin
const MAX_HISTORY = 20;
const MAX_CHARS    = 5000;

// ── State ──────────────────────────────────────────────────────────────
const state = {
  history: [],         // Array of ClassifyResponse objects
  serverOnline: false,
};

// ── DOM refs ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
  // Nav
  navBtns:    document.querySelectorAll('.nav-btn'),
  tabPanels:  document.querySelectorAll('.tab-panel'),

  // Single classifier
  singleMsg:      $('single-message'),
  charCount:      $('char-count'),
  classifyBtn:    $('classify-btn'),
  classifySpinner:$('classify-spinner'),
  resultCard:     $('result-card'),
  resultLabel:    $('result-label'),
  resultIcon:     $('result-icon'),
  resultConf:     $('result-confidence'),
  resultConfBar:  $('result-conf-bar'),
  resultTime:     $('result-time'),
  resultTs:       $('result-timestamp'),

  // Batch
  batchMsg:       $('batch-messages'),
  batchBtn:       $('batch-btn'),
  batchSpinner:   $('batch-spinner'),
  batchResults:   $('batch-results'),
  batchTotal:     $('batch-total'),
  batchSpam:      $('batch-spam'),
  batchHam:       $('batch-ham'),
  batchTime:      $('batch-time'),
  batchTable:     $('batch-table-body'),
  uploadZone:     $('upload-zone'),
  fileInput:      $('file-input'),
  clearBatch:     $('clear-batch-btn'),

  // History
  historyTable:   $('history-table-body'),
  historyClear:   $('history-clear'),
  historyEmpty:   $('history-empty'),
  historyWrapper: $('history-wrapper'),

  // Stats
  statTotal:      $('stat-total'),
  statSpam:       $('stat-spam'),
  statHam:        $('stat-ham'),
  statSpamPct:    $('stat-spam-pct'),
  statHamPct:     $('stat-ham-pct'),
  statAccuracy:   $('stat-accuracy'),

  // Model info
  infoAlgo:       $('info-algo'),
  infoAccuracy:   $('info-accuracy'),
  infoDataset:    $('info-dataset'),
  infoFeatures:   $('info-features'),
  infoVectorizer: $('info-vectorizer'),
  infoClasses:    $('info-classes'),

  // Status
  statusDot:      $('status-dot'),
  statusText:     $('status-text'),

  // Toast
  toastContainer: $('toast-container'),
};


// ── Navigation ─────────────────────────────────────────────────────────
dom.navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    dom.navBtns.forEach(b => b.classList.toggle('active', b === btn));
    dom.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
  });
});


// ── Health check ────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      state.serverOnline = data.model_loaded;
      dom.statusDot.className  = 'status-dot' + (data.model_loaded ? '' : ' offline');
      dom.statusText.textContent = data.model_loaded ? 'Model Online' : 'Model Offline';
    } else {
      throw new Error('Non-200');
    }
  } catch {
    state.serverOnline = false;
    dom.statusDot.className = 'status-dot offline';
    dom.statusText.textContent = 'Server Offline';
  }
}


// ── Stats ───────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) return;
    const d = await res.json();

    dom.statTotal.textContent    = d.total_classified.toLocaleString();
    dom.statSpam.textContent     = d.spam_count.toLocaleString();
    dom.statHam.textContent      = d.ham_count.toLocaleString();
    dom.statSpamPct.textContent  = `${d.spam_percentage}%`;
    dom.statHamPct.textContent   = `${d.ham_percentage}%`;
    dom.statAccuracy.textContent = `${d.model_accuracy}%`;

    // Model info card
    dom.infoAlgo.textContent      = d.model_type;
    dom.infoAccuracy.textContent  = `${d.model_accuracy}%`;
    dom.infoDataset.textContent   = `${d.dataset_size.toLocaleString()} messages`;
    dom.infoFeatures.textContent  = `${d.feature_count.toLocaleString()} features`;
    dom.infoVectorizer.textContent = 'TF-IDF (stop_words=english)';
    dom.infoClasses.textContent   = 'Ham (0) · Spam (1)';
  } catch (e) {
    console.warn('Could not load stats:', e);
  }
}


// ── Single Classify ─────────────────────────────────────────────────────
dom.singleMsg.addEventListener('input', () => {
  const len = dom.singleMsg.value.length;
  dom.charCount.textContent = `${len} / ${MAX_CHARS}`;
});

dom.classifyBtn.addEventListener('click', async () => {
  const message = dom.singleMsg.value.trim();
  if (!message) { showToast('Please enter a message first.', 'error'); return; }

  setLoading(dom.classifyBtn, dom.classifySpinner, true);

  try {
    const res = await fetch(`${API_BASE}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Classification failed');
    }

    const data = await res.json();
    renderResult(data);
    addToHistory(data);
    await loadStats();
    showToast(`Classified as ${data.label.toUpperCase()} (${(data.confidence * 100).toFixed(1)}% confidence)`, 'success');
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
  } finally {
    setLoading(dom.classifyBtn, dom.classifySpinner, false);
  }
});

function renderResult(data) {
  const isSpam = data.label === 'spam';
  dom.resultCard.className  = `result-card visible ${data.label}`;
  dom.resultLabel.className = `result-label ${data.label}`;
  dom.resultLabel.innerHTML = `
    <span class="result-icon ${data.label}">${isSpam ? '🚫' : '✅'}</span>
    ${data.label.toUpperCase()}
  `;
  dom.resultConf.textContent  = `${(data.confidence * 100).toFixed(2)}%`;
  dom.resultTime.textContent  = `${data.processing_time_ms.toFixed(2)} ms`;
  dom.resultTs.textContent    = new Date(data.timestamp).toLocaleTimeString();

  // Animate confidence bar
  dom.resultConfBar.style.width = '0%';
  requestAnimationFrame(() => {
    setTimeout(() => {
      dom.resultConfBar.style.width = `${(data.confidence * 100).toFixed(1)}%`;
    }, 50);
  });
}


// ── Batch Classify ──────────────────────────────────────────────────────
dom.batchBtn.addEventListener('click', async () => {
  const raw = dom.batchMsg.value.trim();
  if (!raw) { showToast('Please enter at least one message.', 'error'); return; }

  const messages = raw.split('\n').map(m => m.trim()).filter(Boolean);
  if (messages.length > 100) {
    showToast('Maximum 100 messages per batch.', 'error');
    return;
  }

  setLoading(dom.batchBtn, dom.batchSpinner, true);

  try {
    const res = await fetch(`${API_BASE}/classify/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Batch classification failed');
    }

    const data = await res.json();
    renderBatchResults(data);
    data.results.forEach(r => addToHistory(r));
    await loadStats();
    showToast(`Classified ${data.total} messages successfully.`, 'success');
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
  } finally {
    setLoading(dom.batchBtn, dom.batchSpinner, false);
  }
});

function renderBatchResults(data) {
  dom.batchTotal.textContent = data.total;
  dom.batchSpam.textContent  = data.spam_count;
  dom.batchHam.textContent   = data.ham_count;
  dom.batchTime.textContent  = `${data.total_processing_time_ms.toFixed(1)} ms`;

  dom.batchTable.innerHTML = data.results.map(r => `
    <tr>
      <td class="msg-cell" title="${escHtml(r.message)}">${escHtml(truncate(r.message, 80))}</td>
      <td><span class="pill pill-${r.label}">${r.label === 'spam' ? '🚫' : '✅'} ${r.label}</span></td>
      <td class="mono">${(r.confidence * 100).toFixed(1)}%</td>
      <td class="mono">${r.processing_time_ms.toFixed(2)} ms</td>
    </tr>
  `).join('');

  dom.batchResults.classList.add('visible');
}

dom.clearBatch.addEventListener('click', () => {
  dom.batchMsg.value = '';
  dom.batchResults.classList.remove('visible');
});

// File upload
dom.uploadZone.addEventListener('click', () => dom.fileInput.click());
dom.uploadZone.addEventListener('dragover', e => { e.preventDefault(); dom.uploadZone.classList.add('dragover'); });
dom.uploadZone.addEventListener('dragleave', () => dom.uploadZone.classList.remove('dragover'));
dom.uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  dom.uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) readTextFile(file);
});
dom.fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) readTextFile(file);
});

function readTextFile(file) {
  if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
    showToast('Please upload a .txt file.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    dom.batchMsg.value = e.target.result;
    showToast(`Loaded ${file.name}`, 'success');
  };
  reader.readAsText(file);
}


// ── History ─────────────────────────────────────────────────────────────
function addToHistory(data) {
  state.history.unshift(data);
  if (state.history.length > MAX_HISTORY) state.history.pop();
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    dom.historyEmpty.style.display  = 'block';
    dom.historyWrapper.style.display = 'none';
    return;
  }

  dom.historyEmpty.style.display   = 'none';
  dom.historyWrapper.style.display = 'block';

  dom.historyTable.innerHTML = state.history.map((r, i) => `
    <tr>
      <td style="color:var(--text-muted);width:36px">${state.history.length - i}</td>
      <td class="msg-cell" title="${escHtml(r.message)}">${escHtml(truncate(r.message, 80))}</td>
      <td><span class="pill pill-${r.label}">${r.label === 'spam' ? '🚫' : '✅'} ${r.label}</span></td>
      <td class="mono">${(r.confidence * 100).toFixed(1)}%</td>
      <td class="mono" style="color:var(--text-muted)">${new Date(r.timestamp).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

dom.historyClear.addEventListener('click', () => {
  state.history = [];
  renderHistory();
  showToast('History cleared.', 'success');
});


// ── Helpers ──────────────────────────────────────────────────────────────
function setLoading(btn, spinner, loading) {
  btn.disabled = loading;
  spinner.classList.toggle('visible', loading);
  if (loading) {
    btn.dataset.origText = btn.querySelector('.btn-text')?.textContent || btn.textContent;
    const textEl = btn.querySelector('.btn-text');
    if (textEl) textEl.textContent = 'Analyzing…';
  } else {
    const textEl = btn.querySelector('.btn-text');
    if (textEl && btn.dataset.origText) textEl.textContent = btn.dataset.origText;
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '⚠️'}</span>
    <span>${escHtml(message)}</span>
  `;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}


// ── Sample messages (quick test) ─────────────────────────────────────────
const SAMPLES = [
  "Congratulations! You've won a FREE iPhone. Click here to claim your prize now!!!",
  "Hey, are you coming to dinner tonight? Let me know!",
  "URGENT: Your account has been compromised. Call 0800-FREE now to secure it.",
  "Can you pick up some milk on the way home? Thanks!",
  "You have been selected for a CASH PRIZE of £5000. Text WIN to 82277.",
];

document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    dom.singleMsg.value = btn.dataset.msg || SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    dom.charCount.textContent = `${dom.singleMsg.value.length} / ${MAX_CHARS}`;
    dom.singleMsg.focus();
  });
});

$('random-sample-btn')?.addEventListener('click', () => {
  dom.singleMsg.value = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  dom.charCount.textContent = `${dom.singleMsg.value.length} / ${MAX_CHARS}`;
});


// ── Init ─────────────────────────────────────────────────────────────────
(async () => {
  await checkHealth();
  await loadStats();
  renderHistory();

  // Refresh health every 30 s
  setInterval(checkHealth, 30_000);
  setInterval(loadStats,   60_000);
})();
