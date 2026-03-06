# SafePrompt - AI Privacy Shield

**Protect your sensitive data before sending it to AI chatbots.**

SafePrompt is an open-source browser extension that detects and blocks personally identifiable information (PII) from being sent to AI platforms like ChatGPT, Claude, Gemini, and more. 100% local processing, zero data collection, fully auditable.

## Why SafePrompt?

- **52% of AI browser extensions collect user data** (2026 research)
- **30+ malicious extensions** caught stealing data this year alone
- Most privacy tools are **closed source** - you can't verify their claims
- No existing solution offers **multi-language + open source + multi-platform**

SafePrompt is the first **free, open-source, multi-language** PII protection extension for AI chatbots.

## Features

### Core Protection
- **Real-time PII Detection** - Scans text as you type, before you send
- **Smart Unmasking** - AI sees redacted tokens, you see real data in responses
- **One-click Redact & Send** - Replace sensitive data with safe placeholders
- **Block & Warn** - Prevents accidental submission of sensitive information
- **Consistent Placeholders** - Same value always maps to the same token per session
- **Auto-Expiry** - Token mappings expire after 4 hours for security
- **Manual Unmask Button** - Click to restore original data in AI responses

### Multi-Language Support (8 Languages)
| Language | PII Types | Examples |
|----------|-----------|----------|
| English | 25+ patterns | SSN, credit cards, API keys, JWT, passwords |
| Arabic (RTL) | 15+ patterns | Saudi/UAE/Egypt IDs, IBAN, phone numbers |
| Spanish | 15+ patterns | DNI, NIE, CURP, RFC, IBAN |
| French | 15+ patterns | NIR, CNI, SIRET, IBAN |
| Chinese | 12+ patterns | ID card, bank card, phone, WeChat |
| German | 12+ patterns | Personalausweis, Steuer-ID, IBAN |
| Portuguese | 12+ patterns | CPF, CNPJ, NIF, PIX |
| Context-Aware | 20+ patterns | Names, passwords, IDs in natural sentences |

### Name Detection (7 Languages)
Detects personal names shared in context:
- "My name is John Smith" / "I'm Jane Doe"
- "Je m'appelle Pierre Dupont"
- "Me llamo Carlos Garcia"

### Supported Platforms (10+)
ChatGPT | Claude | Gemini | Copilot | DeepSeek | Perplexity | Grok | Poe | Mistral | HuggingChat

### Privacy & Trust
- **100% Local Processing** - Nothing leaves your browser
- **Zero Telemetry** - No analytics, no tracking, no data collection
- **Minimal Permissions** - Only `storage`, `activeTab`, and `contextMenus`
- **Fully Auditable** - Every line of code is open source
- **No External Dependencies** - Zero supply chain risk

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Quick scan current input |
| `Alt+R` | Toggle between original/redacted text |
| Right-click | "Mask with SafePrompt" on selected text |

### Additional Features
- Right-click context menu (Mask / Scan selected text)
- Per-site enable/disable settings
- Drag & drop file scanning (.txt, .csv, .json)
- Severity levels (critical / high / medium / low)
- Typing indicator (colored dot shows PII status)
- Activity log with CSV export
- Allowlist (whitelist specific values)
- Pause/resume protection
- Dark mode support
- RTL layout support
- Badge counter for detected items
- Quick scan in popup

## Installation

### From Source (Developer)
```bash
git clone https://github.com/user/safeprompt.git
cd safeprompt
npm install
npm test
```

Then load in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `safeprompt` folder

### Chrome Web Store
Coming soon.

## How It Works

```
You type: "My name is Ahmed, SSN is 123-45-6789, email john@test.com"
                    |
              SafePrompt scans locally
                    |
          Warning: 3 sensitive items detected!
                    |
        [Block]  [Redact & Send]  [Preview]  [Edit]
                    |
AI receives: "My name is [NAME_1], SSN is [SSN_2], email [EMAIL_3]"
                    |
           AI responds with tokens
                    |
     [Unmask Data] button appears above response
                    |
You see: The real response with your actual data
```

## Architecture

```
safeprompt/
  src/
    core/
      detector.js          # PII detection engine (consistent tokens + auto-expiry)
      interceptor.js       # Form interceptor (Alt+R toggle + context menu + unmask)
      context-patterns.js  # Context-aware + name detection (7 languages)
    languages/
      en.js                # English patterns (25+)
      ar.js                # Arabic patterns (15+)
      es.js                # Spanish patterns (15+)
      fr.js                # French patterns (15+)
      zh.js                # Chinese patterns (12+)
      de.js                # German patterns (12+)
      pt.js                # Portuguese patterns (12+)
      registry.js          # Language auto-registration
    platforms/
      platform-detector.js # AI chatbot detection (10 platforms)
    ui/
      warning-banner.js    # Warning overlay + preview modal
      popup.html/js        # Extension popup + file drop scan
      options.html/js      # Settings page + per-site disable
      styles.css           # Styles (dark mode + RTL + unmask button)
    background.js          # Service worker + context menu
  tests/
    detector.test.js       # 79 test cases
```

## Detection Categories

| Category | Examples | Severity |
|----------|----------|----------|
| **Identity** | SSN, National ID, Passport, Driver's License | Critical |
| **Financial** | Credit Card (Luhn validated), IBAN, Bank Account | Critical |
| **Credentials** | API Keys, AWS Keys, JWT, GitHub Tokens, Passwords | Critical |
| **Names** | Personal names in context (7 languages) | High |
| **Contact** | Email, Phone Numbers, Addresses | High |
| **Network** | IP Addresses, MAC Addresses | Medium |
| **Personal** | Date of Birth | Medium |

## Configuration

### Sensitivity Levels
- **Low** - Only critical items (SSN, credit cards, API keys)
- **Medium** (default) - Critical + high + medium severity
- **High** - Everything including low severity items

### Settings
Access via the extension popup or options page:
- Toggle specific languages on/off
- Enable/disable detection categories
- Add values to the allowlist
- Disable SafePrompt on specific sites
- Export activity log as CSV

## Testing

```bash
npm test              # Run all 79 tests
npm test -- --watch   # Watch mode
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding a New Language
1. Create `src/languages/xx.js` following the existing pattern files
2. Add the language to `src/languages/registry.js`
3. Add tests in `tests/detector.test.js`
4. Submit a PR

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

## Tech Stack

- **Pure JavaScript** - No frameworks, no build tools required
- **Chrome Extension Manifest V3** - Latest extension platform
- **Jest** - Testing framework
- **Zero Dependencies** - No npm packages in production

## Security

SafePrompt processes everything locally in your browser. We never:
- Send data to external servers
- Use analytics or telemetry
- Store sensitive data (only detection counts in local storage)
- Require unnecessary permissions

If you find a security vulnerability, please report it responsibly. See [SECURITY.md](SECURITY.md).

## License

GPL-3.0-only - see [LICENSE](LICENSE)

## Acknowledgments

Built with the goal of making AI safer for everyone, in every language.

---

**SafePrompt** - Because your data should stay yours.
