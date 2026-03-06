/**
 * SafePrompt - Popup Script
 * Controls the extension popup UI, quick scan, and stats display.
 */

(function () {
  // Create a local detector instance for the popup
  const detector = new SafePromptDetector();

  // Register all languages
  const langs = [SafePromptEN, SafePromptAR, SafePromptES, SafePromptFR, SafePromptZH,
    typeof SafePromptDE !== 'undefined' ? SafePromptDE : null,
    typeof SafePromptPT !== 'undefined' ? SafePromptPT : null,
    typeof SafePromptContext !== 'undefined' ? SafePromptContext : null,
  ].filter(Boolean);
  for (const lang of langs) {
    if (lang) detector.registerLanguage(lang.code, lang);
  }

  // DOM elements
  const toggleActive = document.getElementById('toggleActive');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const totalBlockedEl = document.getElementById('totalBlocked');
  const thisMonthEl = document.getElementById('thisMonth');
  const scanInput = document.getElementById('scanInput');
  const scanBtn = document.getElementById('scanBtn');
  const resultsDiv = document.getElementById('results');
  const resultsList = document.getElementById('resultsList');
  const settingsBtn = document.getElementById('settingsBtn');
  const activityBtn = document.getElementById('activityBtn');

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  async function init() {
    await detector.loadSettings();
    toggleActive.checked = !detector.settings.isPaused;
    updateStatusUI();
    loadStats();
  }

  function updateStatusUI() {
    const active = !detector.settings.isPaused;
    statusDot.className = `status__dot status__dot--${active ? 'active' : 'paused'}`;
    statusText.textContent = active ? 'Protection active' : 'Protection paused';
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async function loadStats() {
    const stats = await detector.getStats();
    totalBlockedEl.textContent = stats.totalBlocked;
    thisMonthEl.textContent = stats.thisMonth;
  }

  // ---------------------------------------------------------------------------
  // Toggle
  // ---------------------------------------------------------------------------

  toggleActive.addEventListener('change', async () => {
    detector.settings.isPaused = !toggleActive.checked;
    await detector.saveSettings();
    updateStatusUI();
  });

  // ---------------------------------------------------------------------------
  // Quick Scan
  // ---------------------------------------------------------------------------

  scanBtn.addEventListener('click', () => {
    const text = scanInput.value.trim();
    if (!text) return;

    const detections = detector.scan(text);
    resultsList.innerHTML = '';

    if (detections.length === 0) {
      resultsList.innerHTML = '<div class="results__empty">No sensitive data found</div>';
    } else {
      for (const d of detections) {
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

  // ---------------------------------------------------------------------------
  // File Drop Scan
  // ---------------------------------------------------------------------------

  const dropHint = document.getElementById('dropHint');
  const allowedTypes = ['text/plain', 'text/csv', 'application/json', 'text/html'];

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

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  activityBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/options.html#activity') });
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  init();
})();
