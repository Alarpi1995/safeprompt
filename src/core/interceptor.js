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
  let isBlocked = false;
  let originalText = null; // for Alt+R toggle
  let isShowingRedacted = false;

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------

  async function init() {
    await detector.loadSettings();

    if (detector.settings.isPaused) {
      updateBadge(0);
      return;
    }

    // Per-site disable check
    if (detector.isSiteDisabled(window.location.hostname)) {
      updateBadge(0);
      return;
    }

    currentPlatform = platforms.detect();
    if (!currentPlatform) return;

    observeInput();
    interceptSubmit();
    interceptPaste();
    observeResponses();
    registerKeyboardShortcut();
    registerToggleShortcut();

    updateBadge(0);
  }

  // ---------------------------------------------------------------------------
  // Input Monitoring (Real-time scan as user types)
  // ---------------------------------------------------------------------------

  function observeInput() {
    // Watch for the input element to appear (SPAs load dynamically)
    const observer = new MutationObserver(() => {
      const input = platforms.getInputElement(currentPlatform);
      if (input && !input._spBound) {
        input._spBound = true;
        bindInputEvents(input);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also try binding immediately
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

    // For contenteditable elements
    if (input.getAttribute('contenteditable') === 'true') {
      input.addEventListener('DOMSubtreeModified', handler);
    }
  }

  function scanInput() {
    const text = platforms.getInputText(currentPlatform);
    if (!text || text === lastScanText) return;
    lastScanText = text;

    const detections = detector.scan(text);
    const inputEl = platforms.getInputElement(currentPlatform);

    if (detections.length > 0) {
      const severity = detector.highestSeverity(detections);
      banner.showIndicator(severity, inputEl);
      updateBadge(detections.length);
    } else {
      banner.showIndicator('safe', inputEl);
      updateBadge(0);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit Interception
  // ---------------------------------------------------------------------------

  function interceptSubmit() {
    // Intercept keyboard submit (Enter key)
    document.addEventListener('keydown', handleKeydown, true);

    // Intercept click on send button
    document.addEventListener('click', handleClick, true);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      const text = platforms.getInputText(currentPlatform);
      if (!text) return;

      const detections = detector.scan(text);
      if (detections.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        isBlocked = true;
        showWarning(detections, text);
      }
    }
  }

  function handleClick(e) {
    const submitBtn = platforms.getSubmitButton(currentPlatform);
    if (!submitBtn) return;

    // Check if click target is the submit button or inside it
    if (submitBtn.contains(e.target) || e.target === submitBtn) {
      const text = platforms.getInputText(currentPlatform);
      if (!text) return;

      const detections = detector.scan(text);
      if (detections.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        isBlocked = true;
        showWarning(detections, text);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Clipboard Paste Monitoring
  // ---------------------------------------------------------------------------

  function interceptPaste() {
    document.addEventListener('paste', (e) => {
      if (detector.settings.isPaused) return;

      const pastedText = e.clipboardData?.getData('text/plain');
      if (!pastedText || pastedText.length < 3) return;

      const detections = detector.scan(pastedText);
      if (detections.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Show warning with the pasted content
        const severity = detector.highestSeverity(detections);
        banner.showIndicator(severity, platforms.getInputElement(currentPlatform));
        showWarning(detections, platforms.getInputText(currentPlatform) + pastedText);
      }
    }, true);
  }

  // ---------------------------------------------------------------------------
  // Keyboard Shortcut (Ctrl+Shift+S = Quick Scan)
  // ---------------------------------------------------------------------------

  function registerKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+S or Cmd+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();

        if (detector.settings.isPaused) return;

        const text = platforms.getInputText(currentPlatform);
        if (!text) return;

        const detections = detector.scan(text);
        if (detections.length > 0) {
          showWarning(detections, text);
        } else {
          banner.showIndicator('safe', platforms.getInputElement(currentPlatform));
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Alt+R Toggle (switch between original/redacted text in input)
  // ---------------------------------------------------------------------------

  function registerToggleShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (detector.settings.isPaused || !currentPlatform) return;

        const currentText = platforms.getInputText(currentPlatform);
        if (!currentText) return;

        if (!isShowingRedacted) {
          // Switch to redacted view
          const detections = detector.scan(currentText);
          if (detections.length === 0) return;

          originalText = currentText;
          const result = detector.redact(currentText, detections);
          unmaskMap = result.map;
          platforms.setInputText(currentPlatform, result.text);
          isShowingRedacted = true;
          banner.showIndicator('safe', platforms.getInputElement(currentPlatform));
        } else if (originalText) {
          // Restore original text
          platforms.setInputText(currentPlatform, originalText);
          originalText = null;
          isShowingRedacted = false;
          // Re-scan to show indicator
          const detections = detector.scan(platforms.getInputText(currentPlatform));
          if (detections.length > 0) {
            banner.showIndicator(detector.highestSeverity(detections), platforms.getInputElement(currentPlatform));
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Warning & Actions
  // ---------------------------------------------------------------------------

  function showWarning(detections, originalText) {
    banner.show(detections, currentPlatform, (action, dets) => {
      switch (action) {
        case 'block':
          handleBlock();
          break;
        case 'redact':
          handleRedact(originalText, dets);
          break;
        case 'edit':
          handleEdit();
          break;
      }
    });
  }

  function handleBlock() {
    // Keep text as-is, just block submission
    isBlocked = false;
    const text = platforms.getInputText(currentPlatform);
    detector.logActivity(currentPlatform.name, detector.scan(text));
  }

  function handleRedact(originalText, detections) {
    const result = detector.redact(originalText, detections);
    unmaskMap = result.map;

    // Replace input text with redacted version
    platforms.setInputText(currentPlatform, result.text);

    // Log the activity
    detector.logActivity(currentPlatform.name, detections);

    isBlocked = false;

    // Auto-submit after a short delay to let frameworks process the text change
    setTimeout(() => {
      const submitBtn = platforms.getSubmitButton(currentPlatform);
      if (submitBtn) {
        // Temporarily remove our interceptor
        document.removeEventListener('click', handleClick, true);
        submitBtn.click();
        // Re-add interceptor
        setTimeout(() => {
          document.addEventListener('click', handleClick, true);
        }, 500);
      }
    }, 200);
  }

  function handleEdit() {
    // Focus the input so user can edit
    isBlocked = false;
    const input = platforms.getInputElement(currentPlatform);
    if (input) input.focus();
  }

  // ---------------------------------------------------------------------------
  // Smart Unmasking (restore PII in AI responses)
  // ---------------------------------------------------------------------------

  function observeResponses() {
    const observer = new MutationObserver(() => {
      if (!unmaskMap || unmaskMap.size === 0) return;

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
        if (hasTokens) {
          addUnmaskButton(el);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function addUnmaskButton(el) {
    if (el._spHasUnmaskBtn) return;
    el._spHasUnmaskBtn = true;

    const btn = document.createElement('button');
    btn.className = 'sp-unmask-btn';
    btn.textContent = 'Unmask Data';
    btn.title = 'Restore original PII values (only visible to you)';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      unmaskElement(el);
      btn.textContent = 'Unmasked';
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });

    // Insert the button before the response element or as first child
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
  // Badge
  // ---------------------------------------------------------------------------

  function updateBadge(count) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'updateBadge',
        count: count,
      }).catch(() => { /* background may not be ready */ });
    }
  }

  // ---------------------------------------------------------------------------
  // Context Menu & Message Handling
  // ---------------------------------------------------------------------------

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'contextMask' && msg.text) {
        const detections = detector.scan(msg.text);
        if (detections.length > 0) {
          const result = detector.redact(msg.text, detections);
          // Replace selection with redacted text
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(result.text));
            unmaskMap = result.map;
          }
          detector.logActivity(currentPlatform?.name || 'unknown', detections);
          updateBadge(detections.length);
        }
      }
      if (msg.type === 'contextScan' && msg.text) {
        const detections = detector.scan(msg.text);
        if (detections.length > 0) {
          showWarning(detections, msg.text);
        } else {
          banner.showIndicator('safe', platforms.getInputElement(currentPlatform));
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Listen for settings changes
  // ---------------------------------------------------------------------------

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
      if (changes.disabledSites) detector.settings.disabledSites = changes.disabledSites.newValue || [];
    });
  }

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
