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
      profile: 'balanced',
      policyPack: 'none',
      sensitivity: 'medium',
      enabledCategories: null,
      enabledLanguages: null,
      allowlist: [],
      protectedTerms: [],
      isPaused: false,
      disabledSites: [],
      memoryGuardEnabled: true,
      clipboardGuardianEnabled: true,
      falsePositiveTrainerEnabled: true,
      falsePositiveRules: {},
      responseGuardEnabled: true,
    };
    this._maskMap = new Map();
    this._maskCounter = 0;
    this._consistentTokens = new Map();
    this._tokenExpiry = Date.now() + (4 * 60 * 60 * 1000);
    this._conversationMemory = [];
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
  // Profiles & Settings
  // ---------------------------------------------------------------------------

  getProfileDefinitions() {
    return {
      balanced: {
        id: 'balanced',
        name: 'Balanced',
        description: 'Good default for mixed AI usage. Catches common sensitive items without maximum noise.',
        sensitivity: 'medium',
        enabledCategories: null,
      },
      developer: {
        id: 'developer',
        name: 'Developer',
        description: 'Prioritizes secrets, tokens, network markers, and infrastructure leaks.',
        sensitivity: 'high',
        enabledCategories: ['credentials', 'network', 'financial', 'identity', 'contact'],
      },
      medical: {
        id: 'medical',
        name: 'Medical',
        description: 'Aggressive on health, identity, contact, and personal context.',
        sensitivity: 'high',
        enabledCategories: ['identity', 'contact', 'medical', 'personal', 'names'],
      },
      legal: {
        id: 'legal',
        name: 'Legal',
        description: 'Biases toward names, identifiers, contracts, financial records, and client data.',
        sensitivity: 'high',
        enabledCategories: ['identity', 'financial', 'contact', 'personal', 'names', 'credentials'],
      },
      student: {
        id: 'student',
        name: 'Student',
        description: 'Focuses on identity, contact, and school-related personal details with moderate strictness.',
        sensitivity: 'medium',
        enabledCategories: ['identity', 'contact', 'personal', 'names'],
      },
      custom: {
        id: 'custom',
        name: 'Custom',
        description: 'Manual sensitivity and category choices.',
        sensitivity: null,
        enabledCategories: null,
      },
    };
  }


  getPolicyPackDefinitions() {
    return {
      none: {
        id: 'none',
        name: 'No Policy Pack',
        description: 'Use only the built-in PII engine.',
        termSeverity: 'medium',
        scoreBoost: 0,
        preferredDescriptor: 'protected term',
      },
      client_safe: {
        id: 'client_safe',
        name: 'Client Safe',
        description: 'Treat custom protected terms as client or customer references that should never leak.',
        termSeverity: 'high',
        scoreBoost: 10,
        preferredDescriptor: 'client reference',
      },
      internal_ops: {
        id: 'internal_ops',
        name: 'Internal Ops',
        description: 'Escalates internal project names, hostnames, and operational references from protected terms.',
        termSeverity: 'high',
        scoreBoost: 8,
        preferredDescriptor: 'internal reference',
      },
      enterprise_strict: {
        id: 'enterprise_strict',
        name: 'Enterprise Strict',
        description: 'Treat protected terms as critical and bias toward blocking.',
        termSeverity: 'critical',
        scoreBoost: 18,
        preferredDescriptor: 'restricted enterprise term',
      },
    };
  }

  getPolicyPack(policyPackId = this.settings.policyPack) {
    const policies = this.getPolicyPackDefinitions();
    return policies[policyPackId] || policies.none;
  }
  getProfile(profileId = this.settings.profile) {
    const profiles = this.getProfileDefinitions();
    return profiles[profileId] || profiles.balanced;
  }

  getProfileOptions() {
    return Object.values(this.getProfileDefinitions());
  }

  getPolicyPackOptions() {
    return Object.values(this.getPolicyPackDefinitions());
  }

  exportPolicyPackConfig() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      policyPack: this.settings.policyPack || 'none',
      protectedTerms: [...new Set((this.settings.protectedTerms || []).map((term) => term.trim()).filter(Boolean))],
    };
  }

  async importPolicyPackConfig(config = {}) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('Invalid policy pack payload.');
    }

    const definitions = this.getPolicyPackDefinitions();
    const requestedPack = typeof config.policyPack === 'string' ? config.policyPack : 'none';
    const policyPack = definitions[requestedPack] ? requestedPack : 'none';
    const protectedTerms = (config.protectedTerms || config.terms || [])
      .map((term) => String(term).trim())
      .filter(Boolean)
      .slice(0, 500);

    this.settings.policyPack = policyPack;
    this.settings.protectedTerms = [...new Set(protectedTerms)];
    await this.saveSettings();

    return {
      policyPack: this.getPolicyPack(policyPack),
      protectedTerms: this.settings.protectedTerms,
    };
  }

  applyProfile(profileId) {
    const profile = this.getProfile(profileId);
    this.settings.profile = profile.id;
    if (profile.sensitivity) this.settings.sensitivity = profile.sensitivity;
    this.settings.enabledCategories = profile.enabledCategories
      ? new Set(profile.enabledCategories)
      : null;
    return profile;
  }

  markSettingsCustom() {
    this.settings.profile = 'custom';
  }

  updateSettings(patch) {
    Object.assign(this.settings, patch);
  }

  async loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve();
        return;
      }

      chrome.storage.sync.get(
        ['profile', 'policyPack', 'sensitivity', 'enabledCategories', 'enabledLanguages', 'allowlist', 'protectedTerms', 'isPaused', 'disabledSites', 'memoryGuardEnabled', 'clipboardGuardianEnabled', 'falsePositiveTrainerEnabled', 'falsePositiveRules', 'responseGuardEnabled'],
        (data) => {
          if (data.profile) this.settings.profile = data.profile;
          if (data.policyPack) this.settings.policyPack = data.policyPack;
          if (data.sensitivity) this.settings.sensitivity = data.sensitivity;
          if (data.enabledCategories) this.settings.enabledCategories = new Set(data.enabledCategories);
          if (data.enabledLanguages) this.settings.enabledLanguages = new Set(data.enabledLanguages);
          if (data.allowlist) this.settings.allowlist = data.allowlist;
          if (data.protectedTerms) this.settings.protectedTerms = data.protectedTerms;
          if (data.isPaused !== undefined) this.settings.isPaused = data.isPaused;
          if (data.disabledSites) this.settings.disabledSites = data.disabledSites;
          if (data.memoryGuardEnabled !== undefined) this.settings.memoryGuardEnabled = data.memoryGuardEnabled;
          if (data.clipboardGuardianEnabled !== undefined) this.settings.clipboardGuardianEnabled = data.clipboardGuardianEnabled;
          if (data.falsePositiveTrainerEnabled !== undefined) this.settings.falsePositiveTrainerEnabled = data.falsePositiveTrainerEnabled;
          if (data.falsePositiveRules) this.settings.falsePositiveRules = data.falsePositiveRules;
          if (data.responseGuardEnabled !== undefined) this.settings.responseGuardEnabled = data.responseGuardEnabled;

          chrome.storage.local.get(['conversationMemory'], (localData) => {
            this._conversationMemory = Array.isArray(localData.conversationMemory) ? localData.conversationMemory : [];
            resolve();
          });
        }
      );
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const data = {
          profile: this.settings.profile,
          policyPack: this.settings.policyPack,
          sensitivity: this.settings.sensitivity,
          enabledCategories: this.settings.enabledCategories
            ? Array.from(this.settings.enabledCategories) : null,
          enabledLanguages: this.settings.enabledLanguages
            ? Array.from(this.settings.enabledLanguages) : null,
          allowlist: this.settings.allowlist,
          protectedTerms: this.settings.protectedTerms,
          isPaused: this.settings.isPaused,
          disabledSites: this.settings.disabledSites,
          memoryGuardEnabled: this.settings.memoryGuardEnabled,
          clipboardGuardianEnabled: this.settings.clipboardGuardianEnabled,
          falsePositiveTrainerEnabled: this.settings.falsePositiveTrainerEnabled,
          falsePositiveRules: this.settings.falsePositiveRules,
          responseGuardEnabled: this.settings.responseGuardEnabled,
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
            if (match[0].length === 0) {
              regex.lastIndex++;
              continue;
            }
            const value = match[0].trim();
            if (!value || value.length < 2) continue;
            if (this._isAllowlisted(value)) continue;
            if (this._shouldSuppressFalsePositive({ type: pat.type, value })) continue;
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

    this._scanProtectedTerms(text, detections, occupied);
    detections.sort((a, b) => a.index - b.index);
    return detections;
  }


  _scanProtectedTerms(text, detections, occupied) {
    if (!this.settings.protectedTerms || this.settings.protectedTerms.length === 0) return;

    const pack = this.getPolicyPack();
    const uniqueTerms = [...new Set(this.settings.protectedTerms.map((term) => term.trim()).filter(Boolean))];

    for (const term of uniqueTerms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        if (!value || value.length < 2) continue;
        if (this._shouldSuppressFalsePositive({ type: 'policy_term', value })) continue;
        if (this._overlaps(occupied, match.index, match.index + value.length)) continue;

        occupied.push([match.index, match.index + value.length]);
        detections.push({
          type: 'policy_term',
          category: 'policy',
          label: 'Protected Term',
          value,
          masked: this._mask(value, 'policy_term'),
          index: match.index,
          length: value.length,
          severity: pack.termSeverity,
          language: 'policy',
          icon: this._severityIcon(pack.termSeverity),
          policyPack: pack.id,
        });
      }
    }
  }
  analyzeText(text, context = {}) {
    const detections = this.scan(text);
    return this.analyzeDetections(text, detections, context);
  }

  analyzeDetections(text, detections, context = {}) {
    const safeText = text || '';
    const safeDetections = detections || [];
    const summary = this.summarize(safeDetections);
    const policy = this.getPolicyPack();
    const memoryMatches = this.settings.memoryGuardEnabled
      ? this._findMemoryMatches(safeDetections, context.platform || '')
      : [];
    const clipboardMatches = context.clipboard ? safeDetections.length : 0;
    const score = this._calculateRiskScore(safeText, safeDetections, summary, { memoryMatches, clipboardMatches, policy });
    const level = this._scoreLevel(score);
    const reasons = this._buildRiskReasons(safeDetections, summary, { memoryMatches, clipboardMatches, policy });
    const simulator = this._buildLeakSimulator(summary, reasons, score, { memoryMatches, clipboardMatches, policy });
    const rewrite = this.rewriteSafely(safeText, safeDetections);

    return {
      detections: safeDetections,
      summary,
      score,
      level,
      reasons,
      simulator,
      recommendedAction: this._recommendedAction(score, summary, { policy }),
      rewrite,
      heatmap: safeDetections.map((d) => ({
        start: d.index,
        end: d.index + d.length,
        severity: d.severity,
        label: d.label,
        value: d.value,
      })),
      profile: this.getProfile(this.settings.profile),
      policy,
      memoryMatches,
      clipboardMatches,
      falsePositiveCount: this.getFalsePositiveRuleCount(),
    };
  }

  // ---------------------------------------------------------------------------
  // Redaction, Rewrite, and Smart Unmasking
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

  rewriteSafely(text, detections) {
    if (!detections || detections.length === 0) return { text, replacements: [] };

    let result = text;
    let offset = 0;
    const replacements = [];
    const typeCounts = {};
    const sorted = [...detections].sort((a, b) => a.index - b.index);

    for (const det of sorted) {
      typeCounts[det.type] = (typeCounts[det.type] || 0) + 1;
      const replacement = this._safeRewriteReplacement(det, typeCounts[det.type]);
      const start = det.index + offset;
      const end = start + det.length;

      result = result.slice(0, start) + replacement + result.slice(end);
      offset += replacement.length - det.length;
      replacements.push({ type: det.type, replacement });
    }

    return { text: result, replacements };
  }

  unmask(text, map) {
    if (!map || map.size === 0) return text;
    let result = text;
    for (const [token, original] of map) {
      result = result.replaceAll(token, original);
    }
    return result;
  }


  async rememberDetections(platform, detections, source = 'message') {
    if (!this.settings.memoryGuardEnabled) return;
    if (!detections || detections.length === 0) return;

    const now = Date.now();
    const freshEntries = detections.map((det) => ({
      fingerprint: this._fingerprintValue(det.value, det.type),
      type: det.type,
      label: det.label,
      platform: platform || 'unknown',
      source,
      timestamp: now,
    }));

    const seen = new Set();
    const merged = [...freshEntries, ...this._conversationMemory]
      .filter((entry) => {
        const key = `${entry.fingerprint}:${entry.platform}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter((entry) => now - entry.timestamp < 7 * 24 * 60 * 60 * 1000)
      .slice(0, 250);

    this._conversationMemory = merged;
    await this._saveConversationMemory();
  }

  async clearConversationMemory() {
    this._conversationMemory = [];
    await this._saveConversationMemory();
  }

  async trainFalsePositive(detections) {
    if (!this.settings.falsePositiveTrainerEnabled || !detections || detections.length === 0) return;

    const rules = { ...(this.settings.falsePositiveRules || {}) };
    const now = Date.now();

    for (const det of detections) {
      const key = this._falsePositiveKey(det.type, det.value);
      const current = rules[key] || { count: 0, type: det.type, preview: det.masked };
      rules[key] = {
        count: Math.min(current.count + 1, 5),
        type: det.type,
        preview: det.masked,
        updatedAt: now,
      };
    }

    const trimmedEntries = Object.entries(rules)
      .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
      .slice(0, 150);

    this.settings.falsePositiveRules = Object.fromEntries(trimmedEntries);
    await this.saveSettings();
  }

  async clearFalsePositiveRules() {
    this.settings.falsePositiveRules = {};
    await this.saveSettings();
  }

  getFalsePositiveRuleCount() {
    return Object.keys(this.settings.falsePositiveRules || {}).length;
  }
  _generateToken(type, value) {
    if (this._consistentTokens.has(value)) {
      if (Date.now() < this._tokenExpiry) {
        return this._consistentTokens.get(value);
      }
      this._consistentTokens.clear();
      this._tokenExpiry = Date.now() + (4 * 60 * 60 * 1000);
    }
    this._maskCounter++;
    const tag = type.toUpperCase().replace(/[^A-Z]/g, '');
    const token = `[${tag}_${this._maskCounter}]`;
    this._consistentTokens.set(value, token);
    return token;
  }

  _safeRewriteReplacement(det, count) {
    const descriptor = this._friendlyDescriptor(det);
    const suffix = count > 1 ? ` ${count}` : '';
    return `[redacted ${descriptor}${suffix}]`;
  }

  _friendlyDescriptor(det) {
    const typeMap = {
      email: 'email address',
      phone: 'phone number',
      phone_sa: 'phone number',
      phone_uae: 'phone number',
      phone_eg: 'phone number',
      phone_us: 'phone number',
      phone_uk: 'phone number',
      phone_mx: 'phone number',
      phone_es: 'phone number',
      phone_fr: 'phone number',
      phone_cn: 'phone number',
      phone_tr: 'phone number',
      phone_in: 'phone number',
      phone_kr: 'phone number',
      phone_jp: 'phone number',
      credit_card: 'payment card number',
      ssn: 'social security number',
      password: 'password',
      api_key: 'API key',
      aws_key: 'AWS access key',
      github_token: 'GitHub token',
      jwt: 'JWT token',
      private_key: 'private key',
      policy_term: this.getPolicyPack().preferredDescriptor,
      bitcoin_address: 'Bitcoin wallet address',
      ethereum_address: 'Ethereum wallet address',
      gps_coordinates: 'GPS coordinates',
      url_pii: 'sensitive URL parameter',
      mrn: 'medical record number',
      npi: 'medical provider identifier',
      insurance_id: 'insurance identifier',
      ipv6: 'IPv6 address',
      vin: 'vehicle VIN',
      name_context_en: 'personal name',
      name_intro_en: 'personal name',
      name_context_ar: 'personal name',
      name_context_es: 'personal name',
      name_context_fr: 'personal name',
      name_context_de: 'personal name',
      name_context_zh: 'personal name',
      name_context_pt: 'personal name',
      name_dict_en: 'personal name',
      name_dict_ar: 'personal name',
      name_dict_es: 'personal name',
      name_dict_fr: 'personal name',
      name_dict_de: 'personal name',
      name_dict_pt: 'personal name',
      name_dict_zh: 'personal name',
      name_dict_tr: 'personal name',
      name_dict_hi: 'personal name',
      name_dict_ko: 'personal name',
      name_dict_ja: 'personal name',
    };

    if (typeMap[det.type]) return typeMap[det.type];

    const categoryMap = {
      identity: 'government or identity record',
      financial: 'financial detail',
      credentials: 'secret credential',
      medical: 'medical detail',
      names: 'personal name',
      contact: 'contact detail',
      network: 'network identifier',
      location: 'location detail',
      vehicle: 'vehicle identifier',
      personal: 'personal detail',
      social: 'social handle',
      policy: this.getPolicyPack().preferredDescriptor,
      policy: this.getPolicyPack().preferredDescriptor,
    };

    return categoryMap[det.category] || det.label.toLowerCase();
  }

  // ---------------------------------------------------------------------------
  // Severity Summary, Privacy Score, and Leak Simulator
  // ---------------------------------------------------------------------------

  summarize(detections) {
    const summary = { total: detections.length, critical: 0, high: 0, medium: 0, low: 0, byType: {}, byCategory: {} };
    for (const d of detections) {
      summary[d.severity] = (summary[d.severity] || 0) + 1;
      summary.byType[d.type] = (summary.byType[d.type] || 0) + 1;
      summary.byCategory[d.category] = (summary.byCategory[d.category] || 0) + 1;
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

  _calculateRiskScore(text, detections, summary, extras = {}) {
    if (!detections.length) return 0;

    const weights = { critical: 28, high: 18, medium: 10, low: 4 };
    let score = detections.reduce((total, det) => total + (weights[det.severity] || 8), 0);

    const uniqueCategories = Object.keys(summary.byCategory).length;
    const repeatedTypes = Object.values(summary.byType).filter((count) => count > 1).length;
    const redactedChars = detections.reduce((total, det) => total + det.length, 0);
    const density = text.length > 0 ? redactedChars / text.length : 0;

    score += Math.min(detections.length * 4, 16);
    score += Math.max(0, (uniqueCategories - 1) * 6);
    score += repeatedTypes * 5;
    if (summary.byCategory.credentials) score += 15;
    if (summary.critical >= 2) score += 12;
    if (summary.byCategory.medical && summary.byCategory.identity) score += 10;
    if (summary.byCategory.financial && summary.byCategory.identity) score += 10;
    if (summary.byCategory.policy) score += extras.policy?.scoreBoost || 0;
    if (extras.memoryMatches?.length) score += Math.min(extras.memoryMatches.length * 6, 18);
    if (extras.clipboardMatches) score += 8;
    if (density > 0.25) score += 8;

    return Math.max(0, Math.min(100, score));
  }

  _scoreLevel(score) {
    if (score === 0) return 'safe';
    if (score >= 80) return 'critical';
    if (score >= 55) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  _recommendedAction(score, summary, extras = {}) {
    if (extras.policy?.id === 'enterprise_strict' && summary.byCategory.policy) return 'block';
    if (score >= 85 || summary.byCategory.credentials || summary.critical >= 2) return 'block';
    if (score >= 55) return 'rewrite';
    if (score >= 20) return 'redact';
    return 'allow';
  }

  _buildRiskReasons(detections, summary, extras = {}) {
    if (!detections.length) return ['No sensitive data detected.'];

    const reasons = [];
    const topCategory = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
    const has = (category) => !!summary.byCategory[category];

    if (has('credentials')) reasons.push('Secret-like credentials in this prompt could unlock accounts, APIs, or internal systems.');
    if (has('financial')) reasons.push('Financial identifiers may expose payment details, banking references, or transaction data.');
    if (has('identity') || has('contact') || has('names') || has('personal')) reasons.push('Identity and contact signals can be linked back to a real person or client.');
    if (has('medical')) reasons.push('Medical context increases privacy and compliance risk because it may reveal protected health details.');
    if (has('network')) reasons.push('Network markers can reveal internal hosts, environments, or infrastructure patterns.');
    if (has('policy')) reasons.push('Policy Pack ' + (extras.policy?.name || 'active') + ' flagged a protected local term.');
    if (extras.memoryMatches?.length) reasons.push('Conversation Memory Guard found this sensitive value in earlier prompts, increasing re-exposure risk.');
    if (extras.clipboardMatches) reasons.push('Clipboard Guardian caught sensitive content before it was pasted into the AI input.');
    if (topCategory.length >= 3) reasons.push('Multiple categories were detected together, which makes re-identification easier.');

    if (reasons.length === 0) {
      const topType = Object.entries(summary.byType).sort((a, b) => b[1] - a[1])[0];
      if (topType) reasons.push(`The prompt repeatedly exposes ${topType[0].replace(/_/g, ' ')} data.`);
    }

    return reasons.slice(0, 5);
  }

  _buildLeakSimulator(summary, reasons, score, extras = {}) {
    if (score === 0) {
      return {
        title: 'Leak Simulator',
        narrative: 'This prompt looks low-risk. SafePrompt did not find exposed sensitive fields.',
        impact: 'Low risk',
      };
    }

    const impact = [];
    if (summary.byCategory.credentials) impact.push('credential reuse or account takeover');
    if (summary.byCategory.identity || summary.byCategory.contact || summary.byCategory.names) impact.push('direct person or client identification');
    if (summary.byCategory.financial) impact.push('payment or banking exposure');
    if (summary.byCategory.medical) impact.push('health-information disclosure');
    if (summary.byCategory.network) impact.push('infrastructure mapping');
    if (summary.byCategory.policy) impact.push('violation of local policy pack rules');
    if (extras.memoryMatches?.length) impact.push('repeat exposure across the same conversation history');

    const impactText = impact.length > 0 ? impact.join(', ') : 'plain-text exposure of sensitive details';

    return {
      title: 'Leak Simulator',
      narrative: `If this prompt is sent as-is, the AI provider receives ${impactText} in plain text.`,
      impact: score >= 80 ? 'Severe downstream exposure' : score >= 55 ? 'Meaningful exposure risk' : 'Limited but avoidable exposure',
      reasons: reasons.slice(0, 2),
    };
  }

  // ---------------------------------------------------------------------------
  // Activity Log
  // ---------------------------------------------------------------------------

  async logActivity(platform, detections, context = {}) {
    if (!detections.length) return;
    const analysis = this.analyzeDetections('', detections, context);
    const entry = {
      timestamp: Date.now(),
      platform,
      count: detections.length,
      severity: this.highestSeverity(detections),
      types: [...new Set(detections.map((d) => d.type))],
      score: analysis.score,
      profile: this.settings.profile,
      policyPack: this.settings.policyPack,
      source: context.source || 'input',
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
    const stats = { totalBlocked: 0, thisMonth: 0, averageScore: 0, responseGuardDetections: 0, memoryEntries: this._conversationMemory.length, trainedIgnores: this.getFalsePositiveRuleCount(), byType: {}, byPlatform: {}, bySeverity: {} };
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    let totalScore = 0;

    for (const entry of log) {
      stats.totalBlocked += entry.count;
      totalScore += entry.score || 0;
      if (entry.timestamp >= monthStart.getTime()) {
        stats.thisMonth += entry.count;
      }
      if (entry.source === 'response') {
        stats.responseGuardDetections += entry.count;
      }
      stats.byPlatform[entry.platform] = (stats.byPlatform[entry.platform] || 0) + entry.count;
      stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;
      for (const type of entry.types) {
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }
    }

    stats.averageScore = log.length ? Math.round(totalScore / log.length) : 0;
    return stats;
  }

  exportLogCSV(log) {
    const header = 'Timestamp,Platform,Count,Severity,Score,Profile,PolicyPack,Source,Types\n';
    const rows = log.map((e) => {
      const date = new Date(e.timestamp).toISOString();
      return `${date},${e.platform},${e.count},${e.severity},${e.score || 0},${e.profile || 'balanced'},${e.policyPack || 'none'},${e.source || 'input'},"${e.types.join(', ')}"`;
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
      case 'phone_tr':
      case 'phone_in':
      case 'phone_kr':
      case 'phone_jp':
        return value.slice(0, 4) + '****' + value.slice(-2);
      case 'credit_card':
        return '****-****-****-' + value.replace(/\D/g, '').slice(-4);
      case 'iban':
      case 'iban_sa':
      case 'iban_uae':
      case 'iban_es':
      case 'iban_fr':
      case 'iban_gb':
      case 'iban_tr':
        return value.slice(0, 4) + ' **** **** ' + value.slice(-4);
      case 'ssn':
      case 'national_id':
      case 'national_id_sa':
      case 'national_id_eg':
      case 'dni_es':
      case 'nie_es':
      case 'nir_fr':
      case 'id_cn':
      case 'tc_kimlik':
      case 'aadhaar_in':
      case 'pan_in':
      case 'rrn_kr':
      case 'my_number_jp':
        return '***' + value.slice(-4);
      case 'api_key':
      case 'aws_key':
      case 'jwt':
      case 'private_key':
        return value.slice(0, 6) + '••••••' + value.slice(-4);
      case 'password':
        return '••••••••';
      case 'policy_term':
        return value.length <= 6 ? '[term]' : value.slice(0, 2) + '***' + value.slice(-1);
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
      case 'name_dict_tr':
      case 'name_dict_hi':
      case 'name_dict_ko':
      case 'name_dict_ja':
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
      case 'plate_tr':
      case 'plate_in':
      case 'plate_kr':
      case 'plate_jp':
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
    if (!this.settings.enabledLanguages) return false;
    const baseCode = code.startsWith('names_') ? code.slice(6) : code;
    return !this.settings.enabledLanguages.has(baseCode);
  }

  _isCategoryDisabled(category) {
    if (category === 'policy') return false;
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
    const windowSize = 50;
    const start = Math.max(0, matchIndex - windowSize);
    const end = Math.min(text.length, matchIndex + windowSize);
    const context = text.slice(start, end).toLowerCase();
    return keywords.some((kw) => context.includes(kw.toLowerCase()));
  }

  _overlaps(occupied, start, end) {
    return occupied.some(([s, e]) => start < e && end > s);
  }


  _falsePositiveKey(type, value) {
    return `${type}:${this._fingerprintValue(value, type)}`;
  }

  _shouldSuppressFalsePositive(det) {
    if (!this.settings.falsePositiveTrainerEnabled) return false;
    const key = this._falsePositiveKey(det.type, det.value);
    const rule = this.settings.falsePositiveRules?.[key];
    return !!rule && rule.count >= 1;
  }

  _fingerprintValue(value, type = '') {
    const normalized = `${type}:${String(value || '').trim().toLowerCase()}`;
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) {
      hash ^= normalized.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  _findMemoryMatches(detections, platform) {
    if (!this._conversationMemory.length || !detections.length) return [];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return detections.flatMap((det) => {
      const fingerprint = this._fingerprintValue(det.value, det.type);
      return this._conversationMemory.filter((entry) => {
        if (entry.timestamp < cutoff) return false;
        if (entry.fingerprint !== fingerprint) return false;
        if (platform && entry.platform && entry.platform !== platform) return false;
        return true;
      });
    }).slice(0, 5);
  }

  async _saveConversationMemory() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await new Promise((resolve) => {
        chrome.storage.local.set({ conversationMemory: this._conversationMemory }, resolve);
      });
    }
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

















