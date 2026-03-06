/**
 * SafePrompt - Core PII Detection Engine
 *
 * Scans text for sensitive data across multiple languages using
 * regex patterns + contextual keyword detection. 100% local processing.
 *
 * @license GPL-3.0-only
 */

class SafePromptDetector {
  constructor() {
    this.languages = new Map();
    this.settings = {
      sensitivity: 'medium',
      enabledCategories: null,
      enabledLanguages: null,
      allowlist: [],
      isPaused: false,
      disabledSites: [],
    };
    this._maskMap = new Map();
    this._maskCounter = 0;
    this._consistentTokens = new Map(); // value -> token (session-persistent)
    this._tokenExpiry = Date.now() + (4 * 60 * 60 * 1000); // 4h auto-expiry
  }

  // ---------------------------------------------------------------------------
  // Language Registration
  // ---------------------------------------------------------------------------

  registerLanguage(code, definition) {
    if (!definition || !definition.patterns) return;
    this.languages.set(code, definition);
  }

  getRegisteredLanguages() {
    const result = [];
    for (const [code, def] of this.languages) {
      result.push({ code, name: def.name, nativeName: def.nativeName, rtl: !!def.rtl });
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  updateSettings(patch) {
    Object.assign(this.settings, patch);
  }

  async loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(
          ['sensitivity', 'enabledCategories', 'enabledLanguages', 'allowlist', 'isPaused', 'disabledSites'],
          (data) => {
            if (data.sensitivity) this.settings.sensitivity = data.sensitivity;
            if (data.enabledCategories) this.settings.enabledCategories = new Set(data.enabledCategories);
            if (data.enabledLanguages) this.settings.enabledLanguages = new Set(data.enabledLanguages);
            if (data.allowlist) this.settings.allowlist = data.allowlist;
            if (data.isPaused !== undefined) this.settings.isPaused = data.isPaused;
            if (data.disabledSites) this.settings.disabledSites = data.disabledSites;
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const data = {
          sensitivity: this.settings.sensitivity,
          enabledCategories: this.settings.enabledCategories
            ? Array.from(this.settings.enabledCategories) : null,
          enabledLanguages: this.settings.enabledLanguages
            ? Array.from(this.settings.enabledLanguages) : null,
          allowlist: this.settings.allowlist,
          isPaused: this.settings.isPaused,
          disabledSites: this.settings.disabledSites,
        };
        chrome.storage.sync.set(data, resolve);
      } else {
        resolve();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Core Scanning
  // ---------------------------------------------------------------------------

  scan(text) {
    if (!text || text.trim().length === 0) return [];
    if (this.settings.isPaused) return [];

    const detections = [];
    const occupied = [];

    for (const [langCode, langDef] of this.languages) {
      if (this._isLanguageDisabled(langCode)) continue;

      for (const [category, patterns] of Object.entries(langDef.patterns)) {
        if (this._isCategoryDisabled(category)) continue;

        for (const pat of patterns) {
          if (this._isBelowSensitivity(pat.severity)) continue;

          const regex = new RegExp(pat.pattern, pat.flags || 'g');
          let match;

          while ((match = regex.exec(text)) !== null) {
            if (match[0].length === 0) { regex.lastIndex++; continue; }
            const value = match[0].trim();
            if (!value || value.length < 2) continue;
            if (this._isAllowlisted(value)) continue;
            if (this._overlaps(occupied, match.index, match.index + value.length)) continue;

            if (pat.validate && !pat.validate(value)) continue;
            if (pat.contextRequired && pat.keywords && !this._hasKeywordContext(text, match.index, pat.keywords)) continue;

            occupied.push([match.index, match.index + value.length]);

            detections.push({
              type: pat.type,
              category,
              label: pat.label,
              value,
              masked: this._mask(value, pat.type),
              index: match.index,
              length: value.length,
              severity: pat.severity || 'medium',
              language: langCode,
              icon: this._severityIcon(pat.severity),
            });
          }
        }
      }
    }

    detections.sort((a, b) => a.index - b.index);
    return detections;
  }

  // ---------------------------------------------------------------------------
  // Redaction & Smart Unmasking
  // ---------------------------------------------------------------------------

  redact(text, detections) {
    if (!detections || detections.length === 0) return { text, map: new Map() };

    this._maskMap = new Map();
    this._maskCounter = 0;

    let result = text;
    let offset = 0;

    const sorted = [...detections].sort((a, b) => a.index - b.index);

    for (const det of sorted) {
      const token = this._generateToken(det.type, det.value);
      this._maskMap.set(token, det.value);

      const start = det.index + offset;
      const end = start + det.length;
      result = result.slice(0, start) + token + result.slice(end);
      offset += token.length - det.length;
    }

    return { text: result, map: new Map(this._maskMap) };
  }

  unmask(text, map) {
    if (!map || map.size === 0) return text;
    let result = text;
    for (const [token, original] of map) {
      result = result.replaceAll(token, original);
    }
    return result;
  }

  _generateToken(type, value) {
    // Consistent tokens: same value always maps to the same token per session
    if (this._consistentTokens.has(value)) {
      // Check expiry
      if (Date.now() < this._tokenExpiry) {
        return this._consistentTokens.get(value);
      }
      // Expired: reset all tokens
      this._consistentTokens.clear();
      this._tokenExpiry = Date.now() + (4 * 60 * 60 * 1000);
    }
    this._maskCounter++;
    const tag = type.toUpperCase().replace(/[^A-Z]/g, '');
    const token = `[${tag}_${this._maskCounter}]`;
    this._consistentTokens.set(value, token);
    return token;
  }

  // ---------------------------------------------------------------------------
  // Severity Summary & Stats
  // ---------------------------------------------------------------------------

  summarize(detections) {
    const summary = { total: detections.length, critical: 0, high: 0, medium: 0, low: 0, byType: {} };
    for (const d of detections) {
      summary[d.severity] = (summary[d.severity] || 0) + 1;
      summary.byType[d.type] = (summary.byType[d.type] || 0) + 1;
    }
    return summary;
  }

  highestSeverity(detections) {
    const order = ['critical', 'high', 'medium', 'low'];
    for (const level of order) {
      if (detections.some((d) => d.severity === level)) return level;
    }
    return 'low';
  }

  // ---------------------------------------------------------------------------
  // Activity Log
  // ---------------------------------------------------------------------------

  async logActivity(platform, detections) {
    if (!detections.length) return;
    const entry = {
      timestamp: Date.now(),
      platform,
      count: detections.length,
      severity: this.highestSeverity(detections),
      types: [...new Set(detections.map((d) => d.type))],
    };

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['activityLog'], (data) => {
          const log = data.activityLog || [];
          log.push(entry);
          if (log.length > 500) log.splice(0, log.length - 500);
          chrome.storage.local.set({ activityLog: log }, resolve);
        });
      } else {
        resolve();
      }
    });
  }

  async getActivityLog() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['activityLog'], (data) => resolve(data.activityLog || []));
      } else {
        resolve([]);
      }
    });
  }

  async getStats() {
    const log = await this.getActivityLog();
    const stats = { totalBlocked: 0, thisMonth: 0, byType: {}, byPlatform: {}, bySeverity: {} };
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const entry of log) {
      stats.totalBlocked += entry.count;
      if (entry.timestamp >= monthStart.getTime()) {
        stats.thisMonth += entry.count;
      }
      stats.byPlatform[entry.platform] = (stats.byPlatform[entry.platform] || 0) + entry.count;
      stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
      for (const type of entry.types) {
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }
    }
    return stats;
  }

  exportLogCSV(log) {
    const header = 'Timestamp,Platform,Count,Severity,Types\n';
    const rows = log.map((e) => {
      const date = new Date(e.timestamp).toISOString();
      return `${date},${e.platform},${e.count},${e.severity},"${e.types.join(', ')}"`;
    });
    return header + rows.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  _mask(value, type) {
    if (value.length <= 3) return '*'.repeat(value.length);
    switch (type) {
      case 'email': {
        const parts = value.split('@');
        if (parts.length !== 2) return '***@***';
        return parts[0][0] + '***@' + parts[1];
      }
      case 'phone':
      case 'phone_sa':
      case 'phone_uae':
      case 'phone_eg':
      case 'phone_us':
      case 'phone_uk':
      case 'phone_mx':
      case 'phone_es':
      case 'phone_fr':
      case 'phone_cn':
        return value.slice(0, 4) + '****' + value.slice(-2);
      case 'credit_card':
        return '****-****-****-' + value.replace(/\D/g, '').slice(-4);
      case 'iban':
      case 'iban_sa':
      case 'iban_uae':
      case 'iban_es':
      case 'iban_fr':
      case 'iban_gb':
        return value.slice(0, 4) + ' **** **** ' + value.slice(-4);
      case 'ssn':
      case 'national_id':
      case 'national_id_sa':
      case 'national_id_eg':
      case 'dni_es':
      case 'nie_es':
      case 'nir_fr':
      case 'id_cn':
        return '***' + value.slice(-4);
      case 'api_key':
      case 'aws_key':
      case 'jwt':
      case 'private_key':
        return value.slice(0, 6) + '••••••' + value.slice(-4);
      case 'password':
        return '••••••••';
      case 'name_context_en':
      case 'name_intro_en':
      case 'name_context_ar':
      case 'name_context_es':
      case 'name_context_fr':
      case 'name_context_de':
      case 'name_context_zh':
      case 'name_context_pt':
      case 'name_dict_en':
      case 'name_dict_ar':
      case 'name_dict_es':
      case 'name_dict_fr':
      case 'name_dict_de':
      case 'name_dict_pt':
      case 'name_dict_zh':
        return value[0] + '***';
      case 'bitcoin_address':
      case 'ethereum_address':
        return value.slice(0, 6) + '••••' + value.slice(-4);
      case 'gps_coordinates':
        return '**.****, **,****';
      case 'url_pii':
        return value.replace(/=[^&\s]{2,}/g, '=***');
      case 'social_handle':
        return '@***';
      case 'mrn':
      case 'npi':
      case 'insurance_id':
        return '***' + value.slice(-4);
      case 'plate_sa':
      case 'plate_eg':
      case 'us_plate':
        return '***' + value.slice(-3);
      case 'ipv6':
        return value.slice(0, 5) + ':••••:••••';
      case 'vin':
        return value.slice(0, 3) + '**************';
      default:
        if (value.length <= 6) return value[0] + '*'.repeat(value.length - 1);
        return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
    }
  }

  _severityIcon(severity) {
    switch (severity) {
      case 'critical': return '\u{1F534}';
      case 'high': return '\u{1F7E0}';
      case 'medium': return '\u{1F7E1}';
      case 'low': return '\u{1F535}';
      default: return '\u{26AA}';
    }
  }

  _isLanguageDisabled(code) {
    return this.settings.enabledLanguages && !this.settings.enabledLanguages.has(code);
  }

  _isCategoryDisabled(category) {
    return this.settings.enabledCategories && !this.settings.enabledCategories.has(category);
  }

  _isBelowSensitivity(severity) {
    const levels = { low: 0, medium: 1, high: 2, critical: 3 };
    const threshold = { low: 0, medium: 1, high: 2 };
    return (levels[severity] || 1) < (threshold[this.settings.sensitivity] || 1);
  }

  _isAllowlisted(value) {
    return this.settings.allowlist.some(
      (item) => value.toLowerCase().includes(item.toLowerCase())
    );
  }

  _hasKeywordContext(text, matchIndex, keywords) {
    // Check if any keyword appears within 50 chars before or after the match
    const windowSize = 50;
    const start = Math.max(0, matchIndex - windowSize);
    const end = Math.min(text.length, matchIndex + windowSize);
    const context = text.slice(start, end).toLowerCase();
    return keywords.some((kw) => context.includes(kw.toLowerCase()));
  }

  _overlaps(occupied, start, end) {
    return occupied.some(([s, e]) => start < e && end > s);
  }

  isSiteDisabled(hostname) {
    return this.settings.disabledSites.some(
      (site) => hostname.includes(site)
    );
  }

  clearTokenCache() {
    this._consistentTokens.clear();
    this._maskCounter = 0;
    this._tokenExpiry = Date.now() + (4 * 60 * 60 * 1000);
  }
}

if (typeof window !== 'undefined') window.SafePromptDetector = SafePromptDetector;
if (typeof module !== 'undefined') module.exports = { SafePromptDetector };
