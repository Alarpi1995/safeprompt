/**
 * SafePrompt - Options Page Script
 * Manages profiles, settings, allowlist, policy packs, and activity log.
 */

(function () {
  const detector = new SafePromptDetector();

  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  const profileSelect = document.getElementById('profileSelect');
  const profileSummary = document.getElementById('profileSummary');
  const sensitivitySelect = document.getElementById('sensitivity');
  const policyPackSelect = document.getElementById('policyPackSelect');
  const protectedTermsInput = document.getElementById('protectedTermsInput');
  const savePolicyPackBtn = document.getElementById('savePolicyPack');
  const exportPolicyPackBtn = document.getElementById('exportPolicyPack');
  const importPolicyPackBtn = document.getElementById('importPolicyPack');
  const policyPackFile = document.getElementById('policyPackFile');
  const memoryGuardEnabled = document.getElementById('memoryGuardEnabled');
  const clipboardGuardianEnabled = document.getElementById('clipboardGuardianEnabled');
  const falsePositiveTrainerEnabled = document.getElementById('falsePositiveTrainerEnabled');
  const responseGuardEnabledEl = document.getElementById('responseGuardEnabled');
  const fileGuardEnabledEl = document.getElementById('fileGuardEnabled');
  const reversibleAnonymizationEl = document.getElementById('reversibleAnonymization');
  const clearMemoryBtn = document.getElementById('clearMemoryBtn');
  const clearTrainerBtn = document.getElementById('clearTrainerBtn');
  const savedMsg = document.getElementById('savedMsg');
  const allowlistInput = document.getElementById('allowlistInput');
  const saveAllowlistBtn = document.getElementById('saveAllowlist');
  const activityLogDiv = document.getElementById('activityLog');
  const exportCSVBtn = document.getElementById('exportCSV');
  const clearLogBtn = document.getElementById('clearLog');
  const disabledSitesInput = document.getElementById('disabledSitesInput');
  const saveDisabledSitesBtn = document.getElementById('saveDisabledSites');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab--active'));
      panels.forEach((p) => p.classList.remove('tab-panel--active'));
      tab.classList.add('tab--active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('tab-panel--active');
      if (tab.dataset.tab === 'activity') loadActivityLog();
    });
  });

  if (window.location.hash === '#activity') {
    tabs.forEach((t) => t.classList.remove('tab--active'));
    panels.forEach((p) => p.classList.remove('tab-panel--active'));
    document.querySelector('[data-tab="activity"]').classList.add('tab--active');
    document.getElementById('panel-activity').classList.add('tab-panel--active');
    loadActivityLog();
  }

  async function init() {
    await detector.loadSettings();
    renderProfileOptions();
    renderPolicyOptions();
    syncSettingsToUI();
    syncLanguageCheckboxes();
    syncCategoryCheckboxes();

    if (detector.settings.allowlist?.length) {
      allowlistInput.value = detector.settings.allowlist.join('\n');
    }
    if (detector.settings.disabledSites?.length) {
      disabledSitesInput.value = detector.settings.disabledSites.join('\n');
    }
  }

  function syncSettingsToUI() {
    profileSelect.value = detector.settings.profile || 'balanced';
    sensitivitySelect.value = detector.settings.sensitivity;
    policyPackSelect.value = detector.settings.policyPack || 'none';
    protectedTermsInput.value = (detector.settings.protectedTerms || []).join('\n');
    memoryGuardEnabled.checked = detector.settings.memoryGuardEnabled !== false;
    clipboardGuardianEnabled.checked = detector.settings.clipboardGuardianEnabled !== false;
    falsePositiveTrainerEnabled.checked = detector.settings.falsePositiveTrainerEnabled !== false;
    if (responseGuardEnabledEl) responseGuardEnabledEl.checked = detector.settings.responseGuardEnabled !== false;
    if (fileGuardEnabledEl) fileGuardEnabledEl.checked = detector.settings.fileGuardEnabled !== false;
    if (reversibleAnonymizationEl) reversibleAnonymizationEl.checked = detector.settings.reversibleAnonymization !== false;
    renderProfileSummary(detector.getProfile(detector.settings.profile));
    updateGuardButtons();
  }

  function renderProfileOptions() {
    const profiles = detector.getProfileOptions();
    profileSelect.innerHTML = profiles.map((profile) => (
      `<option value="${escapeHTML(profile.id)}">${escapeHTML(profile.name)}</option>`
    )).join('');
  }

  function renderPolicyOptions() {
    const policies = detector.getPolicyPackOptions();
    policyPackSelect.innerHTML = policies.map((policy) => (
      `<option value="${escapeHTML(policy.id)}">${escapeHTML(policy.name)}</option>`
    )).join('');
  }

  function syncLanguageCheckboxes() {
    const selected = detector.settings.enabledLanguages;
    document.querySelectorAll('[data-lang]').forEach((el) => {
      el.checked = !selected || selected.has(el.dataset.lang);
    });
  }

  function syncCategoryCheckboxes() {
    const selected = detector.settings.enabledCategories;
    document.querySelectorAll('[data-cat]').forEach((el) => {
      el.checked = !selected || selected.has(el.dataset.cat);
    });
  }

  function renderProfileSummary(profile) {
    const categories = profile.enabledCategories && profile.enabledCategories.length
      ? profile.enabledCategories.join(', ')
      : 'All categories';

    const policy = detector.getPolicyPack(detector.settings.policyPack);
    profileSummary.innerHTML = `
      <div class="profile-summary__name">${escapeHTML(profile.name)}</div>
      <div class="profile-summary__desc">${escapeHTML(profile.description)}</div>
      <div class="profile-summary__meta">
        <span class="chip">Sensitivity: ${escapeHTML(profile.sensitivity || detector.settings.sensitivity)}</span>
        <span class="chip">Scope: ${escapeHTML(categories)}</span>
        <span class="chip">Policy: ${escapeHTML(policy.name)}</span>
      </div>
    `;
  }

  function updateGuardButtons() {
    clearMemoryBtn.textContent = `Clear Memory Guard Cache (${detector._conversationMemory.length})`;
    clearTrainerBtn.textContent = `Clear Trainer Rules (${detector.getFalsePositiveRuleCount()})`;
  }

  function showSaved(message = 'Settings saved') {
    savedMsg.textContent = message;
    savedMsg.classList.add('saved-msg--visible');
    setTimeout(() => savedMsg.classList.remove('saved-msg--visible'), 2000);
  }

  function collectChecked(selector, key) {
    const all = Array.from(document.querySelectorAll(selector));
    const checked = all.filter((cb) => cb.checked).map((cb) => cb.dataset[key]);
    return checked.length === all.length ? null : checked;
  }

  function downloadText(text, filename, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveProfile(profileId) {
    detector.applyProfile(profileId);
    await detector.saveSettings();
    profileSelect.value = detector.settings.profile;
    sensitivitySelect.value = detector.settings.sensitivity;
    syncCategoryCheckboxes();
    renderProfileSummary(detector.getProfile(profileId));
    showSaved();
  }

  async function savePolicySettings() {
    detector.settings.policyPack = policyPackSelect.value;
    detector.settings.protectedTerms = protectedTermsInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    await detector.saveSettings();
    renderProfileSummary(detector.getProfile(detector.settings.profile));
    showSaved();
  }

  async function importPolicyPackFile(file) {
    if (!file) return;
    const text = await file.text();
    const payload = JSON.parse(text);
    await detector.importPolicyPackConfig(payload);
    syncSettingsToUI();
    showSaved('Policy Pack imported');
  }

  profileSelect.addEventListener('change', async () => {
    const profileId = profileSelect.value;
    if (profileId === 'custom') {
      detector.markSettingsCustom();
      await detector.saveSettings();
      renderProfileSummary(detector.getProfile('custom'));
      showSaved();
      return;
    }
    await saveProfile(profileId);
  });

  sensitivitySelect.addEventListener('change', async () => {
    detector.settings.sensitivity = sensitivitySelect.value;
    detector.markSettingsCustom();
    profileSelect.value = 'custom';
    renderProfileSummary(detector.getProfile('custom'));
    await detector.saveSettings();
    showSaved();
  });

  savePolicyPackBtn.addEventListener('click', savePolicySettings);
  policyPackSelect.addEventListener('change', savePolicySettings);

  exportPolicyPackBtn.addEventListener('click', () => {
    const payload = detector.exportPolicyPackConfig();
    downloadText(
      JSON.stringify(payload, null, 2),
      `safeprompt-policy-pack-${payload.policyPack}-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json;charset=utf-8'
    );
  });

  importPolicyPackBtn.addEventListener('click', () => {
    policyPackFile.click();
  });

  policyPackFile.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importPolicyPackFile(file);
    } catch (error) {
      alert(error?.message || 'Failed to import policy pack JSON.');
    } finally {
      policyPackFile.value = '';
    }
  });

  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.addEventListener('change', async () => {
      const checked = collectChecked('[data-lang]', 'lang');
      detector.settings.enabledLanguages = checked ? new Set(checked) : null;
      await detector.saveSettings();
      showSaved();
    });
  });

  document.querySelectorAll('[data-cat]').forEach((el) => {
    el.addEventListener('change', async () => {
      const checked = collectChecked('[data-cat]', 'cat');
      detector.settings.enabledCategories = checked ? new Set(checked) : null;
      detector.markSettingsCustom();
      profileSelect.value = 'custom';
      renderProfileSummary(detector.getProfile('custom'));
      await detector.saveSettings();
      showSaved();
    });
  });

  [
    [memoryGuardEnabled, 'memoryGuardEnabled'],
    [clipboardGuardianEnabled, 'clipboardGuardianEnabled'],
    [falsePositiveTrainerEnabled, 'falsePositiveTrainerEnabled'],
    [responseGuardEnabledEl, 'responseGuardEnabled'],
    [fileGuardEnabledEl, 'fileGuardEnabled'],
    [reversibleAnonymizationEl, 'reversibleAnonymization'],
  ].filter(([el]) => el).forEach(([el, key]) => {
    el.addEventListener('change', async () => {
      detector.settings[key] = el.checked;
      await detector.saveSettings();
      updateGuardButtons();
      showSaved();
    });
  });

  clearMemoryBtn.addEventListener('click', async () => {
    await detector.clearConversationMemory();
    updateGuardButtons();
    showSaved('Memory Guard cache cleared');
  });

  clearTrainerBtn.addEventListener('click', async () => {
    await detector.clearFalsePositiveRules();
    updateGuardButtons();
    showSaved('Trainer rules cleared');
  });

  saveAllowlistBtn.addEventListener('click', async () => {
    detector.settings.allowlist = allowlistInput.value.split('\n').map((l) => l.trim()).filter(Boolean);
    await detector.saveSettings();
    showSaved();
  });

  saveDisabledSitesBtn.addEventListener('click', async () => {
    detector.settings.disabledSites = disabledSitesInput.value.split('\n').map((l) => l.trim()).filter(Boolean);
    await detector.saveSettings();
    showSaved();
  });

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
        <td>${entry.score || 0}</td>
        <td>${escapeHTML(entry.profile || 'balanced')}</td>
        <td>${escapeHTML(entry.policyPack || 'none')}</td>
        <td>${escapeHTML(entry.source || 'input')}</td>
        <td>${escapeHTML(entry.types.join(', '))}</td>
      </tr>`;
    }).join('');

    activityLogDiv.innerHTML = `
      <table class="log-table">
        <thead><tr><th>Date</th><th>Platform</th><th>Count</th><th>Severity</th><th>Score</th><th>Profile</th><th>Policy</th><th>Source</th><th>Types</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  exportCSVBtn.addEventListener('click', async () => {
    const log = await detector.getActivityLog();
    const csv = detector.exportLogCSV(log);
    downloadText(
      csv,
      `safeprompt-log-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8'
    );
  });

  clearLogBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all activity logs?')) return;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ activityLog: [] }, () => {
        loadActivityLog();
      });
    }
  });

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
})();
