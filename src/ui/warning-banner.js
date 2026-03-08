/**
 * SafePrompt - Warning Banner UI
 * Shows a dismissible warning when PII is detected in the user's input.
 * Supports: Block, Rewrite Safely, Redact & Send, Preview, Edit, Dismiss.
 */

class SafePromptBanner {
  constructor() {
    this._container = null;
    this._currentDetections = [];
    this._currentPlatform = null;
    this._onAction = null;
    this._indicator = null;
    this._analysisContext = {};
  }

  // ---------------------------------------------------------------------------
  // Typing Indicator
  // ---------------------------------------------------------------------------

  showIndicator(level, anchorEl, score = null) {
    if (!this._indicator) {
      this._indicator = document.createElement('div');
      this._indicator.className = 'sp-indicator';
      document.body.appendChild(this._indicator);
    }

    const colors = { safe: '#22c55e', low: '#3b82f6', medium: '#eab308', high: '#f97316', critical: '#ef4444' };
    this._indicator.style.background = colors[level] || colors.safe;
    this._indicator.title = level === 'safe'
      ? 'No PII detected'
      : `Privacy score ${score ?? '?'}: ${level} risk`;

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

  show(detections, platform, onAction, context = {}) {
    this.hide();
    this._currentDetections = detections;
    this._currentPlatform = platform;
    this._onAction = onAction;
    this._analysisContext = context;

    if (!detections || detections.length === 0) return;

    this._container = document.createElement('div');
    this._container.className = 'sp-banner';
    this._container.setAttribute('dir', 'auto');
    this._container.setAttribute('role', 'alert');
    this._container.innerHTML = this._buildHTML(detections);

    document.body.appendChild(this._container);
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
    const previewText = this._analysisContext?.text || window.SafePromptPlatforms?.getInputText(this._currentPlatform) || '';
    const analysis = detector
      ? detector.analyzeDetections(previewText, detections, this._analysisContext)
      : { score: 50, reasons: [], simulator: { narrative: '' }, recommendedAction: 'redact', profile: { name: 'Balanced' }, level: 'medium' };

    const severityClass = `sp-banner--${highest}`;
    this._container.classList.add(severityClass);

    const title = this._getTitle(highest, summary.total, analysis.score);
    const detectionList = detections.slice(0, 10).map((d) => this._buildDetectionItem(d)).join('');
    const moreCount = detections.length > 10 ? detections.length - 10 : 0;
    const reasons = (analysis.reasons || []).map((reason) => `<li>${this._escapeHTML(reason)}</li>`).join('');

    return `
      <div class="sp-banner__header">
        <div class="sp-banner__icon">${this._getSeverityIcon(highest)}</div>
        <div class="sp-banner__title">${title}</div>
        <button class="sp-banner__close" data-action="dismiss" aria-label="Close">&times;</button>
      </div>
      <div class="sp-banner__body">
        <div class="sp-insights">
          <div class="sp-score-card sp-score-card--${analysis.level}">
            <div class="sp-score-card__value">${analysis.score}</div>
            <div class="sp-score-card__meta">
              <div class="sp-score-card__label">Privacy Score</div>
              <div class="sp-score-card__hint">Profile: ${this._escapeHTML(analysis.profile?.name || 'Balanced')}</div>
            </div>
          </div>
          <div class="sp-score-bar"><span style="width:${analysis.score}%;"></span></div>
          <div class="sp-simulator">
            <div class="sp-simulator__title">${this._escapeHTML(analysis.simulator.title)}</div>
            <div class="sp-simulator__text">${this._escapeHTML(analysis.simulator.narrative)}</div>
            <div class="sp-simulator__impact">${this._escapeHTML(analysis.simulator.impact || '')}</div>
          </div>
          ${reasons ? `<ul class="sp-risk-list">${reasons}</ul>` : ''}
        </div>
        <div class="sp-banner__list">
          ${detectionList}
          ${moreCount > 0 ? `<div class="sp-banner__more">+${moreCount} more items detected</div>` : ''}
        </div>
      </div>
      <div class="sp-banner__actions">
        <button class="sp-btn sp-btn--danger" data-action="block">
          <span class="sp-btn__icon">&#x1F6D1;</span> Block
        </button>
        <button class="sp-btn sp-btn--primary" data-action="rewrite">
          <span class="sp-btn__icon">&#x2728;</span> Rewrite Safely
        </button>
        <button class="sp-btn sp-btn--secondary" data-action="redact">
          <span class="sp-btn__icon">&#x1F510;</span> Redact & Send
        </button>
        <button class="sp-btn sp-btn--secondary" data-action="preview">
          <span class="sp-btn__icon">&#x1F441;</span> Preview
        </button>
        <button class="sp-btn sp-btn--secondary" data-action="edit">
          <span class="sp-btn__icon">&#x270F;</span> Edit
        </button>
        <button class="sp-btn sp-btn--secondary" data-action="false-positive">
          <span class="sp-btn__icon">&#x1F9E0;</span> Train Ignore
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

  _getTitle(severity, count, score) {
    const titles = {
      critical: `&#x1F6A8; Score ${score}: ${count} critical sensitive item${count > 1 ? 's' : ''} detected`,
      high: `&#x26A0;&#xFE0F; Score ${score}: ${count} sensitive item${count > 1 ? 's' : ''} detected`,
      medium: `&#x1F50D; Score ${score}: ${count} potentially sensitive item${count > 1 ? 's' : ''} found`,
      low: `&#x2139;&#xFE0F; Score ${score}: ${count} item${count > 1 ? 's' : ''} flagged`,
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
        const text = this._analysisContext?.text || window.SafePromptPlatforms?.getInputText(this._currentPlatform) || '';
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

    const analysis = detector.analyzeDetections(originalText, detections, this._analysisContext || {});
    const { text: redacted } = detector.redact(originalText, detections);
    const rewritten = analysis.rewrite.text;
    const reasons = (analysis.reasons || []).map((reason) => `<li>${this._escapeHTML(reason)}</li>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'sp-preview-overlay';
    overlay.innerHTML = `
      <div class="sp-preview">
        <div class="sp-preview__header">
          <h3 class="sp-preview__title">Preview: What AI will see</h3>
          <button class="sp-preview__close">&times;</button>
        </div>
        <div class="sp-preview__body">
          <div class="sp-score-card sp-score-card--${analysis.level}">
            <div class="sp-score-card__value">${analysis.score}</div>
            <div class="sp-score-card__meta">
              <div class="sp-score-card__label">Privacy Score</div>
              <div class="sp-score-card__hint">Recommended: ${this._escapeHTML(analysis.recommendedAction)}</div>
            </div>
          </div>
          <div class="sp-score-bar"><span style="width:${analysis.score}%;"></span></div>
          <div class="sp-simulator sp-simulator--preview">
            <div class="sp-simulator__title">${this._escapeHTML(analysis.simulator.title)}</div>
            <div class="sp-simulator__text">${this._escapeHTML(analysis.simulator.narrative)}</div>
            <div class="sp-simulator__impact">${this._escapeHTML(analysis.simulator.impact || '')}</div>
          </div>
          ${reasons ? `<ul class="sp-risk-list sp-risk-list--preview">${reasons}</ul>` : ''}
          <div class="sp-heatmap-legend">
            <span class="sp-heatmap-chip sp-heatmap-chip--critical">Critical</span>
            <span class="sp-heatmap-chip sp-heatmap-chip--high">High</span>
            <span class="sp-heatmap-chip sp-heatmap-chip--medium">Medium</span>
            <span class="sp-heatmap-chip sp-heatmap-chip--low">Low</span>
          </div>
          <div class="sp-preview__section">
            <div class="sp-preview__label">Original Heatmap</div>
            <div class="sp-preview__text sp-preview__text--original">${this._highlightPII(this._escapeHTML(originalText), detections)}</div>
          </div>
          <div class="sp-preview__section">
            <div class="sp-preview__label">Rewrite Safely</div>
            <div class="sp-preview__text sp-preview__text--rewrite">${this._escapeHTML(rewritten)}</div>
          </div>
          <div class="sp-preview__section">
            <div class="sp-preview__label">Redacted Tokens</div>
            <div class="sp-preview__text sp-preview__text--redacted">${this._escapeHTML(redacted)}</div>
          </div>
        </div>
        <div class="sp-preview__footer">
          <button class="sp-btn sp-btn--primary" data-preview-action="rewrite">Send Safe Rewrite</button>
          <button class="sp-btn sp-btn--secondary" data-preview-action="redact">Send Redacted</button>
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

      if (action === 'rewrite' || action === 'redact') {
        overlay.remove();
        if (this._onAction) this._onAction(action, this._currentDetections);
        this.hide();
      } else if (action === 'cancel' || isClose || isOverlay) {
        overlay.remove();
      }
    });
  }

  _highlightPII(html, detections) {
    let result = html;
    const sorted = [...detections].sort((a, b) => b.index - a.index);
    for (const d of sorted) {
      const escaped = this._escapeHTML(d.value);
      const colors = { critical: '#fecaca', high: '#fed7aa', medium: '#fef08a', low: '#bfdbfe' };
      const bg = colors[d.severity] || colors.medium;
      result = result.replaceAll(
        escaped,
        `<span style="background:${bg};padding:1px 3px;border-radius:3px;font-weight:600;box-shadow:inset 0 -2px 0 rgba(0,0,0,0.08);">${escaped}</span>`
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
