/**
 * SafePrompt - Warning Banner UI
 * Shows a dismissible warning when PII is detected in the user's input.
 * Supports: Block, Redact & Send, Edit & Retry, Dismiss.
 */

class SafePromptBanner {
  constructor() {
    this._container = null;
    this._currentDetections = [];
    this._currentPlatform = null;
    this._onAction = null;
    this._indicator = null;
  }

  // ---------------------------------------------------------------------------
  // Typing Indicator (small colored dot near the input)
  // ---------------------------------------------------------------------------

  showIndicator(level, anchorEl) {
    if (!this._indicator) {
      this._indicator = document.createElement('div');
      this._indicator.className = 'sp-indicator';
      document.body.appendChild(this._indicator);
    }

    const colors = { safe: '#22c55e', low: '#3b82f6', medium: '#eab308', high: '#f97316', critical: '#ef4444' };
    this._indicator.style.background = colors[level] || colors.safe;
    this._indicator.title = level === 'safe' ? 'No PII detected' : `PII detected: ${level} severity`;

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      this._indicator.style.top = `${rect.top - 12}px`;
      this._indicator.style.left = `${rect.right - 12}px`;
    }

    this._indicator.style.display = 'block';
  }

  hideIndicator() {
    if (this._indicator) this._indicator.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // Warning Banner
  // ---------------------------------------------------------------------------

  show(detections, platform, onAction) {
    this.hide();
    this._currentDetections = detections;
    this._currentPlatform = platform;
    this._onAction = onAction;

    if (!detections || detections.length === 0) return;

    this._container = document.createElement('div');
    this._container.className = 'sp-banner';
    this._container.setAttribute('dir', 'auto');
    this._container.setAttribute('role', 'alert');
    this._container.innerHTML = this._buildHTML(detections);

    document.body.appendChild(this._container);

    // Animate in
    requestAnimationFrame(() => this._container.classList.add('sp-banner--visible'));

    this._bindEvents();
  }

  hide() {
    if (this._container) {
      this._container.classList.remove('sp-banner--visible');
      setTimeout(() => {
        if (this._container && this._container.parentNode) {
          this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
      }, 300);
    }
  }

  // ---------------------------------------------------------------------------
  // Build HTML
  // ---------------------------------------------------------------------------

  _buildHTML(detections) {
    const detector = window.safeprompt;
    const summary = detector ? detector.summarize(detections) : { total: detections.length };
    const highest = detector ? detector.highestSeverity(detections) : 'medium';

    const severityClass = `sp-banner--${highest}`;
    this._container.classList.add(severityClass);

    const title = this._getTitle(highest, summary.total);
    const detectionList = detections.slice(0, 10).map((d) => this._buildDetectionItem(d)).join('');
    const moreCount = detections.length > 10 ? detections.length - 10 : 0;

    return `
      <div class="sp-banner__header">
        <div class="sp-banner__icon">${this._getSeverityIcon(highest)}</div>
        <div class="sp-banner__title">${title}</div>
        <button class="sp-banner__close" data-action="dismiss" aria-label="Close">&times;</button>
      </div>
      <div class="sp-banner__body">
        <div class="sp-banner__list">
          ${detectionList}
          ${moreCount > 0 ? `<div class="sp-banner__more">+${moreCount} more items detected</div>` : ''}
        </div>
      </div>
      <div class="sp-banner__actions">
        <button class="sp-btn sp-btn--danger" data-action="block">
          <span class="sp-btn__icon">&#x1F6D1;</span> Block
        </button>
        <button class="sp-btn sp-btn--primary" data-action="redact">
          <span class="sp-btn__icon">&#x1F510;</span> Redact & Send
        </button>
        <button class="sp-btn sp-btn--secondary" data-action="preview">
          <span class="sp-btn__icon">&#x1F441;</span> Preview
        </button>
        <button class="sp-btn sp-btn--secondary" data-action="edit">
          <span class="sp-btn__icon">&#x270F;&#xFE0F;</span> Edit
        </button>
      </div>
    `;
  }

  _buildDetectionItem(d) {
    return `
      <div class="sp-detection">
        <span class="sp-detection__icon">${d.icon || ''}</span>
        <span class="sp-detection__label">${this._escapeHTML(d.label)}</span>
        <span class="sp-detection__value">${this._escapeHTML(d.masked)}</span>
        <span class="sp-detection__severity sp-severity--${d.severity}">${d.severity}</span>
      </div>
    `;
  }

  _getTitle(severity, count) {
    const titles = {
      critical: `&#x1F6A8; ${count} critical sensitive item${count > 1 ? 's' : ''} detected!`,
      high: `&#x26A0;&#xFE0F; ${count} sensitive item${count > 1 ? 's' : ''} detected`,
      medium: `&#x1F50D; ${count} potentially sensitive item${count > 1 ? 's' : ''} found`,
      low: `&#x2139;&#xFE0F; ${count} item${count > 1 ? 's' : ''} flagged`,
    };
    return titles[severity] || titles.medium;
  }

  _getSeverityIcon(severity) {
    const icons = { critical: '&#x1F534;', high: '&#x1F7E0;', medium: '&#x1F7E1;', low: '&#x1F535;' };
    return icons[severity] || '&#x26AA;';
  }

  // ---------------------------------------------------------------------------
  // Event Handling
  // ---------------------------------------------------------------------------

  _bindEvents() {
    if (!this._container) return;
    this._container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'dismiss') {
        this.hide();
        return;
      }

      if (action === 'preview') {
        const text = window.SafePromptPlatforms?.getInputText(this._currentPlatform) || '';
        this.showPreview(text, this._currentDetections);
        return;
      }

      if (this._onAction) {
        this._onAction(action, this._currentDetections);
      }

      this.hide();
    });
  }

  // ---------------------------------------------------------------------------
  // Preview Modal
  // ---------------------------------------------------------------------------

  showPreview(originalText, detections) {
    const detector = window.safeprompt;
    if (!detector) return;

    const { text: redacted } = detector.redact(originalText, detections);

    const overlay = document.createElement('div');
    overlay.className = 'sp-preview-overlay';
    overlay.innerHTML = `
      <div class="sp-preview">
        <div class="sp-preview__header">
          <h3 class="sp-preview__title">Preview: What AI will see</h3>
          <button class="sp-preview__close">&times;</button>
        </div>
        <div class="sp-preview__body">
          <div class="sp-preview__section">
            <div class="sp-preview__label">Original (your text)</div>
            <div class="sp-preview__text sp-preview__text--original">${this._highlightPII(this._escapeHTML(originalText), detections)}</div>
          </div>
          <div class="sp-preview__section">
            <div class="sp-preview__label">Redacted (what AI receives)</div>
            <div class="sp-preview__text sp-preview__text--redacted">${this._escapeHTML(redacted)}</div>
          </div>
        </div>
        <div class="sp-preview__footer">
          <button class="sp-btn sp-btn--primary" data-preview-action="send">Send Redacted</button>
          <button class="sp-btn sp-btn--secondary" data-preview-action="cancel">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('sp-preview-overlay--visible'));

    overlay.addEventListener('click', (e) => {
      const action = e.target.dataset.previewAction;
      const isClose = e.target.classList.contains('sp-preview__close');
      const isOverlay = e.target === overlay;

      if (action === 'send') {
        overlay.remove();
        if (this._onAction) this._onAction('redact', this._currentDetections);
        this.hide();
      } else if (action === 'cancel' || isClose || isOverlay) {
        overlay.remove();
      }
    });
  }

  _highlightPII(html, detections) {
    // Highlight detected PII values in the text
    let result = html;
    const sorted = [...detections].sort((a, b) => b.index - a.index);
    for (const d of sorted) {
      const escaped = this._escapeHTML(d.value);
      const colors = { critical: '#fecaca', high: '#fed7aa', medium: '#fef08a', low: '#bfdbfe' };
      const bg = colors[d.severity] || colors.medium;
      result = result.replace(escaped,
        `<span style="background:${bg};padding:1px 3px;border-radius:3px;font-weight:600;">${escaped}</span>`
      );
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

if (typeof window !== 'undefined') window.SafePromptBanner = SafePromptBanner;
if (typeof module !== 'undefined') module.exports = { SafePromptBanner };
