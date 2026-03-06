/**
 * SafePrompt - Options Page Script
 * Manages settings, language toggles, category toggles, allowlist, and activity log.
 */

(function () {
  const detector = new SafePromptDetector();

  // DOM
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  const sensitivitySelect = document.getElementById('sensitivity');
  const savedMsg = document.getElementById('savedMsg');
  const allowlistInput = document.getElementById('allowlistInput');
  const saveAllowlistBtn = document.getElementById('saveAllowlist');
  const activityLogDiv = document.getElementById('activityLog');
  const exportCSVBtn = document.getElementById('exportCSV');
  const clearLogBtn = document.getElementById('clearLog');
  const disabledSitesInput = document.getElementById('disabledSitesInput');
  const saveDisabledSitesBtn = document.getElementById('saveDisabledSites');

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab--active'));
      panels.forEach((p) => p.classList.remove('tab-panel--active'));
      tab.classList.add('tab--active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('tab-panel--active');

      if (tab.dataset.tab === 'activity') loadActivityLog();
    });
  });

  // Handle hash-based navigation
  if (window.location.hash === '#activity') {
    tabs.forEach((t) => t.classList.remove('tab--active'));
    panels.forEach((p) => p.classList.remove('tab-panel--active'));
    document.querySelector('[data-tab="activity"]').classList.add('tab--active');
    document.getElementById('panel-activity').classList.add('tab-panel--active');
    loadActivityLog();
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  async function init() {
    await detector.loadSettings();

    // Sensitivity
    sensitivitySelect.value = detector.settings.sensitivity;

    // Languages
    if (detector.settings.enabledLanguages) {
      document.querySelectorAll('[data-lang]').forEach((el) => {
        el.checked = detector.settings.enabledLanguages.has(el.dataset.lang);
      });
    }

    // Categories
    if (detector.settings.enabledCategories) {
      document.querySelectorAll('[data-cat]').forEach((el) => {
        el.checked = detector.settings.enabledCategories.has(el.dataset.cat);
      });
    }

    // Allowlist
    if (detector.settings.allowlist && detector.settings.allowlist.length > 0) {
      allowlistInput.value = detector.settings.allowlist.join('\n');
    }

    // Disabled sites
    if (detector.settings.disabledSites && detector.settings.disabledSites.length > 0) {
      disabledSitesInput.value = detector.settings.disabledSites.join('\n');
    }
  }

  // ---------------------------------------------------------------------------
  // Save Settings
  // ---------------------------------------------------------------------------

  function showSaved() {
    savedMsg.classList.add('saved-msg--visible');
    setTimeout(() => savedMsg.classList.remove('saved-msg--visible'), 2000);
  }

  sensitivitySelect.addEventListener('change', async () => {
    detector.settings.sensitivity = sensitivitySelect.value;
    await detector.saveSettings();
    showSaved();
  });

  // Language toggles
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.addEventListener('change', async () => {
      const checked = [];
      document.querySelectorAll('[data-lang]').forEach((cb) => {
        if (cb.checked) checked.push(cb.dataset.lang);
      });
      detector.settings.enabledLanguages = checked.length > 0 ? new Set(checked) : null;
      await detector.saveSettings();
      showSaved();
    });
  });

  // Category toggles
  document.querySelectorAll('[data-cat]').forEach((el) => {
    el.addEventListener('change', async () => {
      const checked = [];
      document.querySelectorAll('[data-cat]').forEach((cb) => {
        if (cb.checked) checked.push(cb.dataset.cat);
      });
      detector.settings.enabledCategories = checked.length > 0 ? new Set(checked) : null;
      await detector.saveSettings();
      showSaved();
    });
  });

  // Allowlist
  saveAllowlistBtn.addEventListener('click', async () => {
    const lines = allowlistInput.value.split('\n').map((l) => l.trim()).filter(Boolean);
    detector.settings.allowlist = lines;
    await detector.saveSettings();
    showSaved();
  });

  // Disabled Sites
  saveDisabledSitesBtn.addEventListener('click', async () => {
    const lines = disabledSitesInput.value.split('\n').map((l) => l.trim()).filter(Boolean);
    detector.settings.disabledSites = lines;
    await detector.saveSettings();
    showSaved();
  });

  // ---------------------------------------------------------------------------
  // Activity Log
  // ---------------------------------------------------------------------------

  async function loadActivityLog() {
    const log = await detector.getActivityLog();

    if (log.length === 0) {
      activityLogDiv.innerHTML = '<div class="log-empty">No activity recorded yet.</div>';
      return;
    }

    const rows = log.slice().reverse().slice(0, 100).map((entry) => {
      const date = new Date(entry.timestamp).toLocaleString();
      return `<tr>
        <td>${escapeHTML(date)}</td>
        <td>${escapeHTML(entry.platform)}</td>
        <td>${entry.count}</td>
        <td>${escapeHTML(entry.severity)}</td>
        <td>${escapeHTML(entry.types.join(', '))}</td>
      </tr>`;
    }).join('');

    activityLogDiv.innerHTML = `
      <table class="log-table">
        <thead><tr><th>Date</th><th>Platform</th><th>Count</th><th>Severity</th><th>Types</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Export CSV
  exportCSVBtn.addEventListener('click', async () => {
    const log = await detector.getActivityLog();
    const csv = detector.exportLogCSV(log);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeprompt-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Clear log
  clearLogBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all activity logs?')) return;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ activityLog: [] }, () => {
        loadActivityLog();
      });
    }
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
