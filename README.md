<p align="center">
  <img src="src/icons/icon128.png" alt="SafePrompt Logo" width="100" />
</p>

<h1 align="center">SafePrompt - AI Privacy Shield</h1>

<p align="center">
  <strong>Protect your sensitive data before sending it to AI chatbots — and catch leaks in their responses.</strong><br>
  100% local. Open source. 11 languages. Zero data collection.
</p>

<p align="center">
  <a href="https://github.com/Alarpi1995/safeprompt/releases"><img src="https://img.shields.io/github/v/release/Alarpi1995/safeprompt?style=flat-square&color=blue" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/tests-195%20passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/patterns-221+-purple?style=flat-square" alt="Patterns" />
  <img src="https://img.shields.io/badge/languages-11-orange?style=flat-square" alt="Languages" />
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3" />
</p>

<p align="center">
  <a href="#installation">Install</a> |
  <a href="#how-it-works">How It Works</a> |
  <a href="#supported-languages">Languages</a> |
  <a href="#vs-competitors">Comparison</a> |
  <a href="#contributing">Contribute</a>
</p>

---

## The Problem

Every time you use ChatGPT, Claude, or Gemini, you risk accidentally sharing:
- Credit card numbers, SSNs, national IDs
- API keys, passwords, tokens
- Phone numbers, emails, addresses
- Personal names, dates of birth

**52% of AI browser extensions collect user data.** Most privacy tools are closed-source - you can't verify their claims.

## The Solution

SafePrompt scans your text **locally in your browser** before it reaches any AI. It detects 221+ PII patterns across 11 languages, replaces sensitive data with safe placeholders, and lets you unmask the AI's response to see your real data. **Response Guard** also monitors AI responses for any PII that may have been echoed or leaked back.

**No servers. No telemetry. No trust required - read the code yourself.**

---

## How It Works

```
You type:  "My SSN is 123-45-6789, email john@test.com"
                    |
             SafePrompt scans locally
                    |
          Warning: 2 sensitive items detected!
                    |
         [Block]  [Redact & Send]  [Preview]
                    |
AI receives:  "My SSN is [SSN_1], email [EMAIL_2]"
                    |
            AI responds with tokens
                    |
      [Unmask Data] button restores your real data
                    |
        Response Guard scans AI output
                    |
    Badge alert if PII leaked  →  [Hide PII] [Dismiss]
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Detection** | Scans as you type, warns before you send |
| **Smart Redaction** | Replaces PII with consistent placeholder tokens |
| **One-click Unmask** | Toggle to see real data in AI responses |
| **Response Guard** | Scans AI responses for PII that was echoed or leaked back |
| **Clipboard Guardian** | Intercepts paste events containing PII before they reach the chatbot |
| **Memory Guard** | Tracks conversation context to detect PII across multiple messages |
| **221+ Patterns** | Covers identity, financial, credentials, medical, crypto, and more |
| **11 Languages** | English, Arabic, Spanish, French, Chinese, German, Portuguese, Turkish, Hindi, Korean, Japanese |
| **500+ Names Dictionary** | Detects personal names across all supported languages |
| **Context-Aware** | Understands "my password is X" vs normal text |
| **Luhn Validation** | Validates credit cards, not just pattern matches |
| **Privacy Score** | 0-100 score based on severity, count, and context of detections |
| **Reversible Anonymization** | Session-level token mapping that persists across conversation turns |
| **File Upload Guard** | Scans .txt, .csv, .docx, .pdf files before upload to AI (zero dependencies) |
| **Multi-Browser** | Chrome, Firefox, and Edge support with unified browser API layer |
| **4-Hour Auto-Expiry** | Token mappings expire automatically for security |
| **Activity Log** | Track what was blocked with source (input/response), export as CSV |
| **Safe Export** | Export conversations with PII auto-redacted (TXT, JSON, Markdown) |
| **False Positive Trainer** | Mark false positives so they're ignored in future scans |

---

## Supported Languages

| Language | Patterns | Key PII Types |
|----------|----------|---------------|
| **English** | 35+ | SSN, credit cards, API keys, JWT, AWS keys, GitHub tokens, Bitcoin/Ethereum, GPS, medical records |
| **Arabic** | 20+ | Saudi/UAE/Egypt national IDs, IBAN, phone numbers, vehicle plates, driver's licenses |
| **Spanish** | 20+ | DNI, NIE, CURP, RFC, IBAN, driver's licenses (Spain + Mexico) |
| **French** | 18+ | NIR, CNI, SIRET, SIREN, IBAN, driver's license |
| **Chinese** | 15+ | ID card (18-digit validated), bank card, WeChat, QQ, Alipay |
| **German** | 15+ | Personalausweis, Steuer-ID, Sozialversicherung, IBAN (DE/AT/CH), driver's license |
| **Portuguese** | 18+ | CPF (validated), CNPJ, NIF, PIX, CNH, IBAN (BR + PT) |
| **Turkish** | 15+ | TC Kimlik (validated), IBAN TR, vehicle plates, tax number |
| **Hindi** | 15+ | Aadhaar (validated), PAN, IFSC, GSTIN, UPI, vehicle registration |
| **Korean** | 12+ | RRN (validated), driver's license, BRN, phone numbers |
| **Japanese** | 12+ | My Number (validated), Zairyu Card, postal codes, phone numbers |

Plus **context-aware patterns** that detect PII in natural sentences across all languages.

---

## Supported AI Platforms

Works automatically on:

| Platform | Status |
|----------|--------|
| ChatGPT (chat.openai.com / chatgpt.com) | Supported |
| Claude (claude.ai) | Supported |
| Gemini (gemini.google.com) | Supported |
| Microsoft Copilot | Supported |
| DeepSeek | Supported |
| Perplexity AI | Supported |
| Grok (x.ai) | Supported |
| Poe | Supported |
| Mistral AI | Supported |
| HuggingChat | Supported |

---

## vs Competitors

| Feature | SafePrompt | Cloak | ChatWall | Private AI |
|---------|-----------|-------|----------|------------|
| **Open Source** | Yes (GPL-3.0) | No | No | No |
| **100% Local** | Yes | Yes | No (cloud API) | No (cloud API) |
| **Languages** | 11 | 1 (English) | 1 | 48 (cloud) |
| **Patterns** | 221+ | 320+ | Unknown | Unknown |
| **Response Guard** | Yes | No | No | No |
| **Clipboard Guard** | Yes | No | No | No |
| **Names Detection** | Yes (11 langs) | No | Yes | Yes |
| **Validation (Luhn, etc.)** | Yes | Unknown | Unknown | Yes |
| **Price** | Free | $4.99/mo | $9.99/mo | Enterprise |
| **Auditable Code** | Yes | No | No | No |
| **Arabic/RTL Support** | Yes | No | No | Limited |

**SafePrompt is the only free, open-source, multi-language PII protection extension for AI chatbots.**

---

## Installation

### From Source (Developer)
```bash
git clone https://github.com/Alarpi1995/safeprompt.git
cd safeprompt
npm install
npm test    # 195 tests should pass
```

#### Chrome / Edge
1. Go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `safeprompt` folder

#### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.firefox.json` from the `safeprompt` folder

#### Build for Distribution
```bash
npm run build:chrome    # Build for Chrome/Edge
npm run build:firefox   # Build for Firefox
npm run build:all       # Build all browsers
npm run zip:chrome      # Create Chrome zip
npm run zip:firefox     # Create Firefox zip
```

### Chrome Web Store
Coming soon.

### Firefox Add-ons (AMO)
Coming soon.

---

## Detection Categories

| Category | Examples | Severity |
|----------|----------|----------|
| **Identity** | SSN, national IDs, passports, driver's licenses | Critical |
| **Financial** | Credit cards (Luhn), IBAN, bank accounts, routing numbers | Critical |
| **Credentials** | API keys, AWS keys, JWT, GitHub/Slack tokens, passwords | Critical |
| **Crypto** | Bitcoin addresses, Ethereum addresses | Critical |
| **Medical** | MRN, NPI, insurance policy numbers | Critical/High |
| **Names** | Personal names dictionary (500+ names, 11 languages) | High |
| **Contact** | Email, phone numbers, street addresses, ZIP/postal codes | High |
| **URLs** | URLs containing PII in query parameters | Critical |
| **Network** | IPv4, IPv6, MAC addresses | Medium |
| **Location** | GPS coordinates | High |
| **Vehicle** | VIN, license plates (multi-country) | Medium/High |
| **Social** | Social media handles (with context) | Low |

---

## Configuration

### Sensitivity Levels
- **Low** - Only critical items (SSN, credit cards, API keys)
- **Medium** (default) - Critical + high + medium
- **High** - Everything including low severity

### Behavior Guards
- **Response Guard** - Scan AI responses for PII (enabled by default)
- **Clipboard Guardian** - Intercept PII in paste events
- **Memory Guard** - Track PII across conversation turns
- **File Upload Guard** - Scan files before they are uploaded to AI chatbots
- **Reversible Anonymization** - Auto-restore real data in AI responses using session-level token maps
- **False Positive Trainer** - Mark false positives to improve accuracy

### Settings
Access via the extension popup or options page:
- Toggle specific languages on/off
- Enable/disable detection categories
- Enable/disable individual behavior guards
- Add values to the allowlist
- Disable SafePrompt on specific sites
- Export activity log as CSV (includes source: input/response)

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Quick scan current input |
| `Alt+R` | Toggle original/redacted text |
| Right-click | "Mask with SafePrompt" on selected text |

---

## Architecture

```
safeprompt/
  manifest.json            # Chrome/Edge manifest (Manifest V3)
  manifest.firefox.json    # Firefox manifest (Manifest V3)
  src/
    core/
      detector.js          # PII detection engine (221+ patterns)
      interceptor.js       # Form interceptor + Response Guard + unmask + reversible anonymization
      browser-compat.js    # Unified browser API layer (Chrome/Firefox/Edge)
      file-scanner.js      # Zero-dependency file text extraction (.txt, .csv, .docx, .pdf)
      context-patterns.js  # Context-aware detection (all languages)
      names-dictionary.js  # 500+ names across 11 languages
    languages/
      en.js, ar.js, es.js, fr.js, zh.js, de.js, pt.js
      tr.js, hi.js, ko.js, ja.js
      registry.js          # Auto-registration
    platforms/
      platform-detector.js # AI chatbot detection + streaming detection
    ui/
      warning-banner.js    # Warning overlay + preview
      popup.html/js        # Extension popup + stats (incl. Resp PII)
      options.html/js      # Settings + behavior guards + activity log
      styles.css           # Dark mode + RTL + Response Guard badges
    background.js          # Service worker (Chrome) / background script (Firefox)
  scripts/
    build.js               # Multi-browser build script
    zip.js                 # Multi-browser packaging script
  tests/
    detector.test.js       # Core PII detection tests
    platform-detector.test.js # Platform detection tests
    response-guard.test.js # Response Guard tests
    browser-compat.test.js # Browser compatibility layer tests
    file-scanner.test.js   # File scanner tests
```

---

## Tech Stack

- **Pure JavaScript** - No frameworks, no build tools required
- **Chrome Extension Manifest V3** - Latest extension platform
- **Multi-Browser** - Chrome, Firefox, and Edge via unified browser API layer
- **Jest** - Testing framework (195 tests across 5 suites)
- **Zero Dependencies** - No npm packages in production

---

## Testing

```bash
npm test              # Run all 195 tests
npm test -- --watch   # Watch mode
```

Tests cover:
- **detector.test.js** - PII patterns, validation, redaction, CSV export across 11 languages
- **platform-detector.test.js** - Platform detection and selectors
- **response-guard.test.js** - Response scanning, fingerprinting, masking, activity log integration
- **browser-compat.test.js** - Unified browser API, storage, runtime, tabs, action APIs
- **file-scanner.test.js** - File type detection, text extraction, DOCX/PDF parsing

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start: Add a New Language
1. Create `src/languages/xx.js` following existing pattern files
2. Add names to `src/core/names-dictionary.js`
3. Register in `src/languages/registry.js` and `manifest.json`
4. Add tests in `tests/detector.test.js`
5. Submit a PR

### Pattern Format
```javascript
{
  type: 'ssn',                    // Unique identifier
  label: 'Social Security Number', // Human-readable name
  pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', // Regex pattern
  flags: 'g',                     // Regex flags
  severity: 'critical',           // critical|high|medium|low
  validate(v) { ... },            // Optional validation function
  keywords: ['SSN', 'social'],    // Optional context keywords
  contextRequired: true,          // Require keywords to match
}
```

---

## Privacy & Security

SafePrompt processes everything locally in your browser. We never:
- Send data to external servers
- Use analytics or telemetry
- Store sensitive data (only detection counts in local storage)
- Require unnecessary permissions

Response Guard scans AI outputs locally in your browser using the same detection engine. No response text is ever transmitted, stored, or logged - only detection counts and types are recorded in the activity log.

**Permissions used:** `storage` (settings), `activeTab` (scan current page), `contextMenus` (right-click menu)

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) | [SECURITY.md](SECURITY.md)

---

## License

GPL-3.0-only - see [LICENSE](LICENSE)

---

## Star History

If SafePrompt helps protect your privacy, consider giving it a star! It helps others discover the project.

---

<p align="center">
  <strong>SafePrompt</strong> - Because your data should stay yours.<br>
  <a href="https://www.aitechcx.com">aitechcx.com</a>
</p>
