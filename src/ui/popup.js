/**
 * SafePrompt - Popup Script
 * Controls the extension popup UI, quick scan, stats display, and safe export.
 */

(function () {
  const detector = new SafePromptDetector();

  if (typeof register === 'function') {
    register(detector);
  }

  const toggleActive = document.getElementById('toggleActive');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const profileSelect = document.getElementById('profileSelect');
  const profileHint = document.getElementById('profileHint');
  const totalBlockedEl = document.getElementById('totalBlocked');
  const thisMonthEl = document.getElementById('thisMonth');
  const averageScoreEl = document.getElementById('averageScore');
  const responseGuardCountEl = document.getElementById('responseGuardCount');
  const scanInput = document.getElementById('scanInput');
  const scanBtn = document.getElementById('scanBtn');
  const resultsDiv = document.getElementById('results');
  const resultsSummary = document.getElementById('resultsSummary');
  const resultsList = document.getElementById('resultsList');
  const resultsRewrite = document.getElementById('resultsRewrite');
  const settingsBtn = document.getElementById('settingsBtn');
  const activityBtn = document.getElementById('activityBtn');
  const exportFormat = document.getElementById('exportFormat');
  const safeExportBtn = document.getElementById('safeExportBtn');
  const dropHint = document.getElementById('dropHint');
  const allowedTypes = ['text/plain', 'text/csv', 'application/json', 'text/html'];

  async function init() {
    await detector.loadSettings();
    toggleActive.checked = !detector.settings.isPaused;
    updateStatusUI();
    updateProfileUI();
    loadStats();
  }

  function updateStatusUI() {
    const active = !detector.settings.isPaused;
    statusDot.className = `status__dot status__dot--${active ? 'active' : 'paused'}`;
    statusText.textContent = active ? 'Protection active' : 'Protection paused';
  }

  function updateProfileUI() {
    const profile = detector.getProfile(detector.settings.profile);
    profileSelect.value = detector.settings.profile || 'balanced';
    profileHint.textContent = profile.description;
  }

  async function loadStats() {
    const stats = await detector.getStats();
    totalBlockedEl.textContent = stats.totalBlocked;
    thisMonthEl.textContent = stats.thisMonth;
    averageScoreEl.textContent = stats.averageScore;
    if (responseGuardCountEl) responseGuardCountEl.textContent = stats.responseGuardDetections || 0;
  }

  function showInlineMessage(message) {
    resultsDiv.classList.add('results--visible');
    resultsSummary.innerHTML = `<div class="results__summary-subtitle">${escapeHTML(message)}</div>`;
    resultsList.innerHTML = '';
    resultsRewrite.innerHTML = '';
  }

  function downloadText(text, filename, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleActive.addEventListener('change', async () => {
    detector.settings.isPaused = !toggleActive.checked;
    await detector.saveSettings();
    updateStatusUI();
  });

  profileSelect.addEventListener('change', async () => {
    const profileId = profileSelect.value;
    if (profileId === 'custom') {
      profileHint.textContent = 'Custom rules are edited in Settings.';
      return;
    }
    detector.applyProfile(profileId);
    await detector.saveSettings();
    updateProfileUI();
  });

  scanBtn.addEventListener('click', () => {
    const text = scanInput.value.trim();
    if (!text) return;

    const analysis = detector.analyzeText(text);
    resultsList.innerHTML = '';
    renderSummary(analysis);
    renderRewrite(analysis);

    if (analysis.detections.length === 0) {
      resultsList.innerHTML = '<div class="results__empty">No sensitive data found</div>';
    } else {
      for (const d of analysis.detections) {
        const item = document.createElement('div');
        item.className = 'results__item';
        item.innerHTML = `
          <span>${d.icon}</span>
          <span><strong>${escapeHTML(d.label)}</strong></span>
          <span style="flex:1;text-align:end;color:var(--text2);font-family:monospace;font-size:11px;">${escapeHTML(d.masked)}</span>
        `;
        resultsList.appendChild(item);
      }
    }

    resultsDiv.classList.add('results--visible');
  });

  function renderSummary(analysis) {
    const reasons = (analysis.reasons || []).map((reason) => `<li>${escapeHTML(reason)}</li>`).join('');
    resultsSummary.innerHTML = `
      <div class="results__summary-header">
        <div class="results__score">${analysis.score}</div>
        <div>
          <div class="results__summary-title">Privacy Score ${analysis.score}</div>
          <div class="results__summary-subtitle">Recommended: ${escapeHTML(analysis.recommendedAction)} | ${escapeHTML(analysis.profile.name)}</div>
        </div>
      </div>
      <div class="results__bar"><span style="width:${analysis.score}%"></span></div>
      <div class="results__summary-subtitle">${escapeHTML(analysis.simulator.narrative)}</div>
      ${reasons ? `<ul class="results__reasons">${reasons}</ul>` : ''}
    `;
  }

  function renderRewrite(analysis) {
    resultsRewrite.innerHTML = `
      <div class="results__rewrite-title">Rewrite Safely</div>
      <div class="results__rewrite-body">${escapeHTML(analysis.rewrite.text)}</div>
    `;
  }

  scanInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropHint.style.display = 'block';
    scanInput.style.borderColor = 'var(--primary)';
  });

  scanInput.addEventListener('dragleave', () => {
    dropHint.style.display = 'none';
    scanInput.style.borderColor = '';
  });

  scanInput.addEventListener('drop', (e) => {
    e.preventDefault();
    dropHint.style.display = 'none';
    scanInput.style.borderColor = '';

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|csv|json|log|md)$/i)) {
      scanInput.value = 'Unsupported file type. Use .txt, .csv, .json, .log, or .md files.';
      return;
    }

    if (file.size > 1024 * 1024) {
      scanInput.value = 'File too large (max 1MB).';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      scanInput.value = reader.result;
      scanBtn.click();
    };
    reader.readAsText(file);
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  activityBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/options.html#activity') });
  });

  safeExportBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.id) {
        showInlineMessage('Open a supported AI tab first.');
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'safeExportConversation', format: exportFormat.value }, (response) => {
        if (chrome.runtime.lastError || !response?.content) {
          showInlineMessage('Safe export is available only on supported AI conversation pages.');
          return;
        }

        downloadText(
          response.content,
          response.filename || `safeprompt-export-${new Date().toISOString().slice(0, 10)}.txt`,
          response.mimeType || 'text/plain;charset=utf-8'
        );

        if (response.analysis) {
          renderSummary(response.analysis);
          renderRewrite(response.analysis);
          resultsList.innerHTML = `<div class="results__empty">Conversation exported as ${escapeHTML(response.format || exportFormat.value)} with local safe rewrite.</div>`;
          resultsDiv.classList.add('results--visible');
        }
      });
    });
  });

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
})();
