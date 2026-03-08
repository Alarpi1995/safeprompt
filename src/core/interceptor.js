/**
 * SafePrompt - Form Interceptor
 * Monitors user input on AI chatbot pages, scans for PII,
 * and intercepts form submission when sensitive data is detected.
 */

(function () {
  const detector = window.safeprompt;
  const platforms = window.SafePromptPlatforms;
  const BannerClass = window.SafePromptBanner;

  if (!detector || !platforms || !BannerClass) {
    console.warn('[SafePrompt] Missing dependencies. Extension may not work properly.');
    return;
  }

  const banner = new BannerClass();
  let currentPlatform = null;
  let unmaskMap = null;
  let scanDebounceTimer = null;
  let lastScanText = '';
  let originalText = null;
  let isShowingRedacted = false;
  let bypassInterceptionUntil = 0;
  let lastClipboardCapture = null;
  let responseGuardTimers = new WeakMap();

  async function init() {
    await detector.loadSettings();

    if (detector.settings.isPaused) {
      updateBadge(0);
      return;
    }

    if (detector.isSiteDisabled(window.location.hostname)) {
      updateBadge(0);
      return;
    }

    currentPlatform = platforms.detect();
    if (!currentPlatform) return;

    observeInput();
    interceptSubmit();
    interceptClipboard();
    observeResponses();
    registerKeyboardShortcut();
    registerToggleShortcut();
    updateBadge(0);
  }

  function observeInput() {
    const observer = new MutationObserver(() => {
      const input = platforms.getInputElement(currentPlatform);
      if (input && !input._spBound) {
        input._spBound = true;
        bindInputEvents(input);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const input = platforms.getInputElement(currentPlatform);
    if (input) {
      input._spBound = true;
      bindInputEvents(input);
    }
  }

  function bindInputEvents(input) {
    const handler = () => {
      clearTimeout(scanDebounceTimer);
      scanDebounceTimer = setTimeout(() => scanInput(), 300);
    };

    input.addEventListener('input', handler);
    input.addEventListener('keyup', handler);

    if (input.getAttribute('contenteditable') === 'true') {
      input.addEventListener('DOMSubtreeModified', handler);
    }
  }

  function scanInput() {
    const text = platforms.getInputText(currentPlatform);
    if (!text) {
      banner.hideIndicator();
      updateBadge(0);
      lastScanText = '';
      return;
    }
    if (text === lastScanText) return;
    lastScanText = text;

    const detections = detector.scan(text);
    const inputEl = platforms.getInputElement(currentPlatform);
    const analysis = detector.analyzeDetections(text, detections, { platform: currentPlatform.name });

    if (detections.length > 0) {
      banner.showIndicator(analysis.level, inputEl, analysis.score);
      updateBadge(detections.length);
    } else {
      banner.showIndicator('safe', inputEl, 0);
      updateBadge(0);
    }
  }

  function interceptSubmit() {
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
  }

  function handleKeydown(e) {
    if (!currentPlatform || shouldBypassInterception()) return;
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key !== 'Enter' || e.shiftKey) return;

    const text = platforms.getInputText(currentPlatform);
    if (!text) return;

    const detections = detector.scan(text);
    if (detections.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showWarning(detections, text, { platform: currentPlatform.name });
    }
  }

  function handleClick(e) {
    if (!currentPlatform || shouldBypassInterception()) return;
    const submitBtn = platforms.getSubmitButton(currentPlatform);
    if (!submitBtn) return;

    if (submitBtn.contains(e.target) || e.target === submitBtn) {
      const text = platforms.getInputText(currentPlatform);
      if (!text) return;

      const detections = detector.scan(text);
      if (detections.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning(detections, text, { platform: currentPlatform.name });
      }
    }
  }

  function handleSubmit(e) {
    if (!currentPlatform || shouldBypassInterception()) return;
    const submitContainer = platforms.getSubmitContainer(currentPlatform);
    if (!submitContainer) return;
    if (e.target !== submitContainer && !submitContainer.contains(e.target)) return;

    const text = platforms.getInputText(currentPlatform);
    if (!text) return;

    const detections = detector.scan(text);
    if (detections.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showWarning(detections, text, { platform: currentPlatform.name });
    }
  }

  function shouldBypassInterception() {
    return Date.now() < bypassInterceptionUntil;
  }

  function interceptClipboard() {
    document.addEventListener('copy', captureClipboard, true);
    document.addEventListener('cut', captureClipboard, true);
    document.addEventListener('paste', handlePaste, true);
  }

  function captureClipboard() {
    if (!detector.settings.clipboardGuardianEnabled) return;
    const selected = window.getSelection()?.toString() || '';
    if (!selected || selected.length < 3) return;

    const detections = detector.scan(selected);
    if (detections.length === 0) return;

    lastClipboardCapture = {
      timestamp: Date.now(),
      fingerprints: detections.map((det) => detector._fingerprintValue(det.value, det.type)),
      preview: selected.slice(0, 120),
    };
  }

  function handlePaste(e) {
    if (detector.settings.isPaused || !detector.settings.clipboardGuardianEnabled) return;

    const pastedText = e.clipboardData?.getData('text/plain');
    if (!pastedText || pastedText.length < 3) return;

    const detections = detector.scan(pastedText);
    if (detections.length > 0) {
      e.preventDefault();
      e.stopPropagation();

      const combinedText = platforms.getInputText(currentPlatform) + pastedText;
      const clipboardMatch = hasClipboardMatch(detections);
      const analysis = detector.analyzeDetections(combinedText, detector.scan(combinedText), {
        platform: currentPlatform?.name,
        clipboard: clipboardMatch || true,
      });
      banner.showIndicator(analysis.level, platforms.getInputElement(currentPlatform), analysis.score);
      showWarning(detections, combinedText, { platform: currentPlatform?.name, clipboard: true });
    }
  }

  function hasClipboardMatch(detections) {
    if (!lastClipboardCapture || (Date.now() - lastClipboardCapture.timestamp) > 5 * 60 * 1000) return false;
    return detections.some((det) => lastClipboardCapture.fingerprints.includes(detector._fingerprintValue(det.value, det.type)));
  }

  function registerKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (detector.settings.isPaused) return;

        const text = platforms.getInputText(currentPlatform);
        if (!text) return;

        const detections = detector.scan(text);
        if (detections.length > 0) {
          showWarning(detections, text, { platform: currentPlatform.name });
        } else {
          banner.showIndicator('safe', platforms.getInputElement(currentPlatform), 0);
        }
      }
    });
  }

  function registerToggleShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (detector.settings.isPaused || !currentPlatform) return;

        const currentText = platforms.getInputText(currentPlatform);
        if (!currentText) return;

        if (!isShowingRedacted) {
          const detections = detector.scan(currentText);
          if (detections.length === 0) return;

          originalText = currentText;
          const result = detector.redact(currentText, detections);
          unmaskMap = result.map;
          platforms.setInputText(currentPlatform, result.text);
          isShowingRedacted = true;
          banner.showIndicator('safe', platforms.getInputElement(currentPlatform), 0);
        } else if (originalText) {
          platforms.setInputText(currentPlatform, originalText);
          originalText = null;
          isShowingRedacted = false;
          const detections = detector.scan(platforms.getInputText(currentPlatform));
          if (detections.length > 0) {
            const analysis = detector.analyzeDetections(platforms.getInputText(currentPlatform), detections, { platform: currentPlatform.name });
            banner.showIndicator(analysis.level, platforms.getInputElement(currentPlatform), analysis.score);
          }
        }
      }
    });
  }

  function showWarning(detections, textToProcess, context = {}) {
    banner.show(detections, currentPlatform, (action, dets) => {
      switch (action) {
        case 'block':
          handleBlock(textToProcess, dets, context);
          break;
        case 'rewrite':
          handleRewrite(textToProcess, dets, context);
          break;
        case 'redact':
          handleRedact(textToProcess, dets, context);
          break;
        case 'edit':
          handleEdit();
          break;
        case 'false-positive':
          handleFalsePositive(dets);
          break;
      }
    }, { ...context, text: textToProcess });
  }

  function handleBlock(textToProcess, detections, context = {}) {
    detector.rememberDetections(currentPlatform.name, detections, 'blocked').catch(() => {});
    detector.logActivity(currentPlatform.name, detections, context);
  }

  function handleRewrite(textToProcess, detections, context = {}) {
    const rewritten = detector.rewriteSafely(textToProcess, detections);
    unmaskMap = null;
    platforms.setInputText(currentPlatform, rewritten.text);
    detector.rememberDetections(currentPlatform.name, detections, 'rewrite').catch(() => {});
    detector.logActivity(currentPlatform.name, detections, context);
    submitCurrentInput();
  }

  function handleRedact(textToProcess, detections, context = {}) {
    const result = detector.redact(textToProcess, detections);
    unmaskMap = result.map;
    platforms.setInputText(currentPlatform, result.text);
    detector.rememberDetections(currentPlatform.name, detections, 'redact').catch(() => {});
    detector.logActivity(currentPlatform.name, detections, context);
    submitCurrentInput();
  }

  function handleFalsePositive(detections) {
    detector.trainFalsePositive(detections).catch(() => {});
    banner.hideIndicator();
    updateBadge(0);
  }

  function submitCurrentInput() {
    setTimeout(() => {
      const submitBtn = platforms.getSubmitButton(currentPlatform);
      const submitContainer = platforms.getSubmitContainer(currentPlatform);
      bypassInterceptionUntil = Date.now() + 1000;

      if (submitBtn) {
        submitBtn.click();
        return;
      }

      if (submitContainer && typeof submitContainer.requestSubmit === 'function') {
        submitContainer.requestSubmit();
      }
    }, 200);
  }

  function handleEdit() {
    const input = platforms.getInputElement(currentPlatform);
    if (input) input.focus();
  }

  function observeResponses() {
    const observer = new MutationObserver(() => {
      // --- Existing unmask token flow ---
      if (unmaskMap && unmaskMap.size > 0) {
        const responses = platforms.getResponseElements(currentPlatform);
        for (const el of responses) {
          if (el._spUnmasked) continue;
          const text = el.textContent || '';
          let hasTokens = false;
          for (const [token] of unmaskMap) {
            if (text.includes(token)) {
              hasTokens = true;
              break;
            }
          }
          if (hasTokens) addUnmaskButton(el);
        }
      }

      // --- Response Guard flow ---
      if (!detector.settings.responseGuardEnabled || detector.settings.isPaused) return;
      const allResponses = platforms.getResponseElements(currentPlatform);
      let processed = 0;
      for (const el of allResponses) {
        if (processed >= 5) break;
        if (el._spResponseScanned) continue;
        scheduleResponseScan(el);
        processed++;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function addUnmaskButton(el) {
    if (el._spHasUnmaskBtn) return;
    el._spHasUnmaskBtn = true;

    const btn = document.createElement('button');
    btn.className = 'sp-unmask-btn';
    btn.textContent = 'Unmask Data';
    btn.title = 'Toggle between masked and unmasked data';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!el._spUnmasked) {
        el._spMaskedHTML = el.innerHTML;
        unmaskElement(el);
        btn.textContent = 'Mask Data';
        // Clear Response Guard flags so revealed PII gets re-scanned
        el._spResponseScanned = false;
        el._spResponseFP = null;
        if (el._spResponseBadge) {
          el._spResponseBadge.remove();
          el._spResponseBadge = null;
        }
      } else {
        el.innerHTML = el._spMaskedHTML;
        el._spUnmasked = false;
        btn.textContent = 'Unmask Data';
      }
    });

    if (el.parentNode) {
      const wrapper = document.createElement('div');
      wrapper.className = 'sp-unmask-wrapper';
      wrapper.appendChild(btn);
      el.parentNode.insertBefore(wrapper, el);
    }
  }

  function unmaskElement(el) {
    if (!unmaskMap || el._spUnmasked) return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      let text = node.textContent;
      let changed = false;
      for (const [token, original] of unmaskMap) {
        if (text.includes(token)) {
          text = text.replaceAll(token, original);
          changed = true;
        }
      }
      if (changed) node.textContent = text;
    }

    el._spUnmasked = true;
  }

  // ---------------------------------------------------------------------------
  // Response Guard
  // ---------------------------------------------------------------------------

  function textFingerprint(text) {
    if (!text) return '';
    const len = text.length;
    const head = text.slice(0, 50);
    const tail = text.slice(-50);
    return `${len}:${head}:${tail}`;
  }

  function scanResponseElement(el) {
    if (!el || el._spResponseScanned) return;
    if (detector.settings.isPaused) return;
    if (!detector.settings.responseGuardEnabled) return;

    const text = platforms._extractText(el);
    if (!text || text.length < 3) return;

    const fp = textFingerprint(text);
    if (el._spResponseFP === fp) return;
    el._spResponseFP = fp;

    const detections = detector.scan(text);
    el._spResponseScanned = true;

    if (detections.length === 0) return;

    attachResponseGuardBadge(el, detections, text);
    detector.logActivity(currentPlatform?.name || 'unknown', detections, {
      platform: currentPlatform?.name || 'unknown',
      source: 'response',
    });
  }

  function scheduleResponseScan(el) {
    if (el._spResponseScanned) return;
    if (!detector.settings.responseGuardEnabled) return;

    if (responseGuardTimers.has(el)) {
      clearTimeout(responseGuardTimers.get(el));
    }

    if (platforms.isResponseStreaming(currentPlatform, el)) {
      responseGuardTimers.set(el, setTimeout(() => scheduleResponseScan(el), 800));
      return;
    }

    responseGuardTimers.set(el, setTimeout(() => {
      responseGuardTimers.delete(el);
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => scanResponseElement(el), { timeout: 2000 });
      } else {
        setTimeout(() => scanResponseElement(el), 50);
      }
    }, 800));
  }

  function attachResponseGuardBadge(el, detections, text) {
    if (el._spResponseBadge) {
      el._spResponseBadge.remove();
    }

    const analysis = detector.analyzeDetections(text, detections, {
      platform: currentPlatform?.name || 'unknown',
      source: 'response',
    });
    const level = analysis.level || 'medium';
    const colors = { safe: '#22c55e', low: '#3b82f6', medium: '#eab308', high: '#f97316', critical: '#ef4444' };
    const color = colors[level] || colors.medium;
    const count = detections.length;

    const badge = document.createElement('div');
    badge.className = `sp-response-guard sp-response-guard--${level}`;
    badge.setAttribute('dir', 'auto');

    const items = detections.slice(0, 5).map((d) => `
      <div class="sp-response-guard__item">
        <span>${d.icon || ''}</span>
        <span>${escapeHTMLLocal(d.label)}</span>
        <span class="sp-response-guard__value">${escapeHTMLLocal(d.masked)}</span>
      </div>
    `).join('');
    const moreCount = count > 5 ? count - 5 : 0;

    badge.innerHTML = `
      <div class="sp-response-guard__dot" style="background:${color}"></div>
      <span class="sp-response-guard__count">${count} PII</span>
      <div class="sp-response-guard__panel">
        <div class="sp-response-guard__panel-title">Response Guard: ${count} item${count > 1 ? 's' : ''} detected</div>
        ${items}
        ${moreCount > 0 ? `<div class="sp-response-guard__more">+${moreCount} more</div>` : ''}
        <div class="sp-response-guard__actions">
          <button class="sp-response-guard__btn" data-rg-action="hide">Hide PII</button>
          <button class="sp-response-guard__btn" data-rg-action="dismiss">Dismiss</button>
        </div>
      </div>
    `;

    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const actionBtn = e.target.closest('[data-rg-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.rgAction;
        if (action === 'hide') {
          hideResponsePII(el, detections);
          badge.remove();
          el._spResponseBadge = null;
        } else if (action === 'dismiss') {
          badge.remove();
          el._spResponseBadge = null;
        }
        return;
      }
      const panel = badge.querySelector('.sp-response-guard__panel');
      if (panel) panel.classList.toggle('sp-response-guard__panel--visible');
    });

    if (el.parentNode) {
      const style = window.getComputedStyle(el.parentNode);
      if (style.position === 'static') {
        el.parentNode.style.position = 'relative';
      }
      el.parentNode.insertBefore(badge, el);
    }

    el._spResponseBadge = badge;
  }

  function hideResponsePII(el, detections) {
    if (!detections.length) return;
    el._spOriginalHTML = el.innerHTML;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      let text = node.textContent;
      let changed = false;
      for (const det of detections) {
        if (text.includes(det.value)) {
          text = text.replaceAll(det.value, det.masked);
          changed = true;
        }
      }
      if (changed) node.textContent = text;
    }
    el._spResponseRedacted = true;
  }

  function escapeHTMLLocal(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function collectConversationExportTurns() {
    const turns = platforms.getConversationTurns(currentPlatform);
    const draft = platforms.getInputText(currentPlatform).trim();

    if (draft && !turns.some((turn) => turn.role === 'user' && turn.text === draft)) {
      turns.push({ role: 'user', text: draft, index: turns.length, source: 'draft' });
    }

    return turns
      .map((turn, index) => {
        const detections = detector.scan(turn.text);
        const rewritten = detector.rewriteSafely(turn.text, detections).text;
        return {
          role: turn.role || 'assistant',
          source: turn.source || 'conversation',
          order: index + 1,
          text: rewritten,
          originalLength: turn.text.length,
          detectionCount: detections.length,
        };
      })
      .filter((turn) => turn.text);
  }

  function formatConversationExport(messages, format, metadata) {
    if (format === 'markdown') {
      const sections = messages.map((message) => `## ${message.role === 'user' ? 'User' : 'Assistant'} ${message.order}\n\n${message.text}`);
      return {
        content: [
          '# SafePrompt Export',
          '',
          `- Platform: ${metadata.platform}`,
          `- Exported: ${metadata.exportedAt}`,
          `- Messages: ${messages.length}`,
          '',
          ...sections,
        ].join('\n'),
        extension: 'md',
        mimeType: 'text/markdown;charset=utf-8',
      };
    }

    if (format === 'json') {
      return {
        content: JSON.stringify({
          ...metadata,
          messages,
        }, null, 2),
        extension: 'json',
        mimeType: 'application/json;charset=utf-8',
      };
    }

    const lines = messages.map((message) => `${message.role.toUpperCase()} ${message.order}:\n${message.text}`);
    return {
      content: lines.join('\n\n'),
      extension: 'txt',
      mimeType: 'text/plain;charset=utf-8',
    };
  }

  function buildSafeConversationExport(format = 'txt') {
    const normalizedFormat = format === 'md' ? 'markdown' : format;
    const messages = collectConversationExportTurns();
    const exportedAt = new Date().toISOString();
    const metadata = {
      platform: currentPlatform?.name || 'Unknown',
      platformId: currentPlatform?.id || 'chat',
      exportedAt,
      messageCount: messages.length,
    };

    const transcript = messages.map((message) => message.text).join('\n\n');
    const analysis = detector.analyzeText(transcript, { platform: currentPlatform?.name });
    const formatted = formatConversationExport(messages, normalizedFormat, metadata);

    return {
      text: formatted.content,
      content: formatted.content,
      analysis,
      format: normalizedFormat,
      mimeType: formatted.mimeType,
      messages,
      filename: `safeprompt-export-${metadata.platformId}-${new Date().toISOString().slice(0, 10)}.${formatted.extension}`,
    };
  }

  function updateBadge(count) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'updateBadge', count }).catch(() => {});
    }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'contextMask' && msg.text) {
        const detections = detector.scan(msg.text);
        if (detections.length > 0) {
          const result = detector.redact(msg.text, detections);
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(result.text));
            unmaskMap = result.map;
          }
          detector.rememberDetections(currentPlatform?.name || 'unknown', detections, 'context-mask').catch(() => {});
          detector.logActivity(currentPlatform?.name || 'unknown', detections, { platform: currentPlatform?.name || 'unknown' });
          updateBadge(detections.length);
        }
      }

      if (msg.type === 'contextScan' && msg.text) {
        const detections = detector.scan(msg.text);
        if (detections.length > 0) {
          showWarning(detections, msg.text, { platform: currentPlatform?.name });
        } else {
          banner.showIndicator('safe', platforms.getInputElement(currentPlatform), 0);
        }
      }

      if (msg.type === 'safeExportConversation') {
        sendResponse(buildSafeConversationExport(msg.format || 'txt'));
      }

      return true;
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.isPaused) {
        detector.settings.isPaused = changes.isPaused.newValue;
        if (detector.settings.isPaused) {
          banner.hide();
          banner.hideIndicator();
          updateBadge(0);
        }
      }
      if (changes.profile) detector.settings.profile = changes.profile.newValue || 'balanced';
      if (changes.policyPack) detector.settings.policyPack = changes.policyPack.newValue || 'none';
      if (changes.sensitivity) detector.settings.sensitivity = changes.sensitivity.newValue;
      if (changes.enabledCategories) {
        detector.settings.enabledCategories = changes.enabledCategories.newValue
          ? new Set(changes.enabledCategories.newValue) : null;
      }
      if (changes.enabledLanguages) {
        detector.settings.enabledLanguages = changes.enabledLanguages.newValue
          ? new Set(changes.enabledLanguages.newValue) : null;
      }
      if (changes.allowlist) detector.settings.allowlist = changes.allowlist.newValue || [];
      if (changes.protectedTerms) detector.settings.protectedTerms = changes.protectedTerms.newValue || [];
      if (changes.disabledSites) detector.settings.disabledSites = changes.disabledSites.newValue || [];
      if (changes.memoryGuardEnabled) detector.settings.memoryGuardEnabled = changes.memoryGuardEnabled.newValue;
      if (changes.clipboardGuardianEnabled) detector.settings.clipboardGuardianEnabled = changes.clipboardGuardianEnabled.newValue;
      if (changes.falsePositiveTrainerEnabled) detector.settings.falsePositiveTrainerEnabled = changes.falsePositiveTrainerEnabled.newValue;
      if (changes.falsePositiveRules) detector.settings.falsePositiveRules = changes.falsePositiveRules.newValue || {};
      if (changes.responseGuardEnabled !== undefined) detector.settings.responseGuardEnabled = changes.responseGuardEnabled.newValue;
    });
  }

  // Expose Response Guard internals for testing
  if (typeof window !== 'undefined') {
    window._spResponseGuard = { scanResponseElement, textFingerprint, hideResponsePII };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

