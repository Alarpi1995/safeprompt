# SafePrompt - Project Plan
## AI Privacy Shield - Protect Your Data Before It Leaves Your Browser

---

## 1. VISION & MISSION

### What is SafePrompt?
Open-source browser extension that detects and warns users about sensitive personal
data BEFORE they send it to AI chatbots (Claude, ChatGPT, Gemini, etc.).

### Why does it matter?
- 23.8 million secrets leaked on GitHub in 2025, AI increases leaks by 40%
- No AI chatbot warns you before you paste your credit card number
- Enterprise DLP solutions cost $$$, regular people have NOTHING
- No existing tool supports Arabic, Spanish, Chinese, Hindi properly
- Anthropic's mission: "Make AI safe for everyone" — this serves that mission

### One-line pitch:
"The seatbelt for AI chatbots — protects your private data before it reaches the cloud."

---

## 2. TARGET USERS

| User Type | Example | Pain Point |
|-----------|---------|------------|
| Regular people | Your parents using ChatGPT | Don't know they're sharing sensitive data |
| Students | Pasting assignments with personal info | Unaware of privacy risks |
| Small business | Sharing contracts with AI for analysis | Leaking business secrets |
| Freelancers | Using AI for client work | Exposing client data |
| Healthcare workers | Asking AI about patient cases | HIPAA/privacy violations |
| Developers | Pasting code with API keys | Credential exposure |
| Arabic/non-English speakers | 491M+ Arabic speakers | Zero protection tools available |

---

## 3. SUPPORTED AI PLATFORMS

### Phase 1 (Launch):
1. ChatGPT (chat.openai.com, chatgpt.com)
2. Claude (claude.ai)
3. Gemini (gemini.google.com)
4. Copilot (copilot.microsoft.com)
5. DeepSeek (chat.deepseek.com)
6. Perplexity (perplexity.ai)

### Phase 2 (Post-launch):
7. Grok (grok.x.ai)
8. Poe (poe.com)
9. Mistral (chat.mistral.ai)
10. HuggingFace Chat (huggingface.co/chat)
11. Any custom AI chatbot (generic interceptor)

---

## 4. SUPPORTED LANGUAGES & PII TYPES

### Phase 1 Languages (Launch):

#### English (en)
| PII Type | Example | Severity |
|----------|---------|----------|
| Email | john@example.com | medium |
| Phone (US/UK/INT) | +1-555-123-4567 | medium |
| SSN | 123-45-6789 | critical |
| Credit Card | 4111-1111-1111-1111 | critical |
| IBAN | GB29 NWBK 6016 1331 9268 19 | critical |
| API Key | sk-proj-abc123... | critical |
| AWS Key | AKIA1234567890ABCDEF | critical |
| Private Key | -----BEGIN RSA PRIVATE KEY----- | critical |
| JWT Token | eyJhbGciOiJIUzI1NiIs... | high |
| Password patterns | password: mySecret123 | high |
| IP Address | 192.168.1.1 | low |
| Date of Birth | DOB: 01/15/1990 | medium |
| Passport Number | AB1234567 | high |
| Driver License | DL: D1234567 | high |
| Bitcoin Address | 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa | medium |

#### Arabic (ar)
| PII Type | Example | Severity |
|----------|---------|----------|
| Arabic Name patterns | الاسم: محمد أحمد العلي | medium |
| Saudi Phone | 0551234567, +966551234567 | medium |
| UAE Phone | 0501234567, +971501234567 | medium |
| Egypt Phone | 01012345678, +201012345678 | medium |
| Saudi National ID | 1098765432 (10 digits, starts with 1/2) | critical |
| Saudi IBAN | SA03 8000 0000 6080 1016 7519 | critical |
| UAE IBAN | AE07 0331 2345 6789 0123 456 | critical |
| Egypt National ID | 28501011234567 (14 digits) | critical |
| Arabic Email patterns | البريد: user@example.com | medium |
| Arabic Address patterns | العنوان: شارع الملك فهد، الرياض | medium |
| Kuwaiti Civil ID | 123456789012 (12 digits) | critical |

#### Spanish (es)
| PII Type | Example | Severity |
|----------|---------|----------|
| DNI (Spain) | 12345678A | critical |
| NIE (Spain) | X1234567A | critical |
| CURP (Mexico) | GARC850101HDFRRL09 | critical |
| RFC (Mexico) | GARC850101AB3 | high |
| Spain Phone | +34 612 345 678 | medium |
| Mexico Phone | +52 55 1234 5678 | medium |
| Spain IBAN | ES91 2100 0418 4502 0005 1332 | critical |
| CUIT (Argentina) | 20-12345678-9 | high |

#### French (fr)
| PII Type | Example | Severity |
|----------|---------|----------|
| NIR/INSEE (France) | 1 85 01 75 116 005 42 | critical |
| France Phone | +33 6 12 34 56 78 | medium |
| France IBAN | FR76 3000 6000 0112 3456 7890 189 | critical |
| Carte Vitale | 1234567890123 | high |
| SIRET | 123 456 789 00012 | medium |

#### Chinese (zh)
| PII Type | Example | Severity |
|----------|---------|----------|
| China ID Card | 110101199001011234 (18 digits) | critical |
| China Phone | 13812345678, +86 138 1234 5678 | medium |
| China Bank Card | 6222021234567890123 | critical |
| Passport (China) | E12345678 | high |

### Phase 2 Languages (Post-launch, community-driven):
- Hindi (hi) - Aadhaar, PAN Card, Indian phone
- Portuguese (pt) - CPF, CNPJ, Brazilian phone
- Turkish (tr) - TC Kimlik, Turkish phone
- Russian (ru) - Passport, SNILS, Russian phone
- German (de) - Personalausweis, Steuer-ID
- Japanese (ja) - My Number, Japanese phone
- Korean (ko) - Resident Registration Number

---

## 5. TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Extension                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │  Platform     │    │   Core       │   │  Language    │ │
│  │  Detector     │───▶│   Detection  │◀──│  Registry   │ │
│  │              │    │   Engine     │   │             │ │
│  │ - Claude     │    │             │   │ - en.js     │ │
│  │ - ChatGPT   │    │ - scan()    │   │ - ar.js     │ │
│  │ - Gemini    │    │ - redact()  │   │ - es.js     │ │
│  │ - Copilot   │    │ - mask()    │   │ - fr.js     │ │
│  │ - DeepSeek  │    │             │   │ - zh.js     │ │
│  │ - Perplexity│    └──────┬───────┘   └─────────────┘ │
│  └──────────────┘           │                            │
│                              │                            │
│  ┌──────────────┐    ┌──────▼───────┐   ┌─────────────┐ │
│  │  Interceptor  │    │   Warning    │   │  Settings   │ │
│  │              │───▶│   UI         │   │  Manager    │ │
│  │ - Keyboard   │    │             │   │             │ │
│  │ - Submit btn │    │ - Banner    │   │ - Languages │ │
│  │ - Paste      │    │ - Details   │   │ - Categories│ │
│  │              │    │ - Actions   │   │ - Severity  │ │
│  └──────────────┘    └──────────────┘   └─────────────┘ │
│                                                           │
│  100% LOCAL - No data leaves your browser                │
└─────────────────────────────────────────────────────────┘
```

### File Structure:
```
safeprompt/
├── manifest.json              # Chrome extension manifest v3
├── package.json               # Project metadata
├── LICENSE                    # MIT License
├── README.md                  # Project documentation
├── CONTRIBUTING.md            # How to add new languages
├── SECURITY.md                # Security policy
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── new_language.md    # Template for adding languages
│   └── workflows/
│       └── ci.yml             # Automated testing
├── src/
│   ├── core/
│   │   ├── detector.js        # Main PII detection engine
│   │   └── interceptor.js     # Form submission interceptor
│   ├── languages/
│   │   ├── registry.js        # Language loader & registry
│   │   ├── en.js              # English patterns
│   │   ├── ar.js              # Arabic patterns
│   │   ├── es.js              # Spanish patterns
│   │   ├── fr.js              # French patterns
│   │   └── zh.js              # Chinese patterns
│   ├── platforms/
│   │   └── platform-detector.js # Detects which AI platform
│   ├── ui/
│   │   ├── popup.html         # Extension popup
│   │   ├── popup.js           # Popup logic
│   │   ├── options.html       # Settings page
│   │   ├── options.js         # Settings logic
│   │   ├── warning-banner.js  # In-page warning component
│   │   └── styles.css         # All styles
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── utils/
│       └── i18n.js            # Internationalization strings
├── tests/
│   ├── detector.test.js       # Detection engine tests
│   ├── languages/
│   │   ├── en.test.js         # English pattern tests
│   │   ├── ar.test.js         # Arabic pattern tests
│   │   ├── es.test.js         # Spanish pattern tests
│   │   ├── fr.test.js         # French pattern tests
│   │   └── zh.test.js         # Chinese pattern tests
│   └── interceptor.test.js    # Interceptor tests
└── assets/
    ├── screenshots/           # For Chrome Web Store
    └── promo/                 # Marketing materials
```

---

## 6. HOW IT WORKS (User Flow)

```
Step 1: User opens Claude/ChatGPT/Gemini
         └─▶ SafePrompt activates silently

Step 2: User types or pastes text containing sensitive data
         └─▶ SafePrompt scans in real-time

Step 3: User clicks Send/Submit button
         └─▶ SafePrompt INTERCEPTS before sending

Step 4: Warning banner appears (if PII detected)
         ┌─────────────────────────────────────────────┐
         │ ⚠ SafePrompt found 3 sensitive items:       │
         │                                              │
         │ 🔴 Credit Card: ****-****-****-1234          │
         │ 🟡 Phone: +966****67                         │
         │ 🟡 Email: m***@gmail.com                     │
         │                                              │
         │ [🛡 Redact & Send] [📤 Send Anyway] [✏ Edit] │
         └─────────────────────────────────────────────┘

Step 5: User chooses action:
         ├─ "Redact & Send" → PII replaced with [REDACTED] → sent
         ├─ "Send Anyway"   → sent as-is (user's choice)
         └─ "Edit"          → back to editing
```

---

## 7. KEY FEATURES

### Core Features (v1.0):
1. Real-time PII scanning as user types
2. Submit interception (blocks send until user decides)
3. One-click PII redaction
4. Multi-language support (5 languages at launch)
5. Multi-platform support (6 AI chatbots at launch)
6. Severity levels (critical/high/medium/low)
7. Visual warning banner with details
8. Settings page (toggle languages, categories, sensitivity)
9. 100% local processing (zero data transmission)
10. Badge counter showing detected items

### Future Features (v2.0+):
- Firefox & Edge support
- Custom pattern rules (user-defined regex)
- Keyboard shortcut to scan
- Statistics dashboard (how much data you've protected)
- Team/organization patterns sharing
- Auto-redact mode (no confirmation needed)
- File upload scanning (PDF, DOCX before upload)
- Context-aware detection (NLP-based, not just regex)

---

## 8. DEVELOPMENT PHASES

### Phase 1: Core Engine (Week 1)
- [x] Project structure & manifest
- [x] Core detection engine (detector.js)
- [ ] English language patterns (en.js)
- [ ] Arabic language patterns (ar.js)
- [ ] Spanish language patterns (es.js)
- [ ] French language patterns (fr.js)
- [ ] Chinese language patterns (zh.js)
- [ ] Language registry (registry.js)
- [ ] Unit tests for all patterns

### Phase 2: Browser Integration (Week 2)
- [ ] Platform detector (which AI chatbot)
- [ ] Form submission interceptor
- [ ] Warning banner UI component
- [ ] Popup UI (extension icon click)
- [ ] Settings/options page
- [ ] CSS styling (light/dark mode, RTL support)
- [ ] Icon design (SVG → PNG export)

### Phase 3: Polish & Testing (Week 3)
- [ ] Test on ChatGPT
- [ ] Test on Claude
- [ ] Test on Gemini
- [ ] Test on Copilot
- [ ] Test on DeepSeek
- [ ] Test on Perplexity
- [ ] Edge cases & false positive tuning
- [ ] Performance optimization
- [ ] Accessibility (screen readers, keyboard nav)

### Phase 4: Launch (Week 4)
- [ ] Write README with screenshots & demo GIF
- [ ] Write CONTRIBUTING.md (how to add languages)
- [ ] Write SECURITY.md
- [ ] Create GitHub issue templates
- [ ] Publish to Chrome Web Store
- [ ] Write launch post (Hacker News, Reddit, X)
- [ ] Submit to Anthropic's Claude for Open Source program

---

## 9. COMPETITIVE ADVANTAGE TABLE

| Feature | SafePrompt | LLM Guard | ChatWall | PiiBlock | Cloak |
|---------|-----------|-----------|----------|---------|-------|
| Open Source | YES | YES | NO | NO | NO |
| Free | YES | YES | Freemium | Freemium | Paid |
| Arabic | YES | NO | NO | NO | NO |
| Spanish | YES | NO | NO | NO | NO |
| Chinese | YES | NO | NO | NO | NO |
| French | YES | NO | NO | NO | NO |
| Multi-platform | 6+ | ChatGPT only | 5 | All | 6 |
| Community patterns | YES | NO | NO | NO | NO |
| RTL Support | YES | NO | NO | NO | NO |
| Redact & Send | YES | Warn only | YES | YES | YES |
| Severity levels | YES | NO | NO | NO | NO |
| Dark mode | YES | NO | YES | YES | YES |

---

## 10. SUCCESS METRICS

### Short-term (3 months):
- 1,000+ Chrome Web Store installs
- 500+ GitHub stars
- 5+ community language contributions
- Featured on Hacker News / Reddit

### Medium-term (6 months):
- 5,000+ installs
- 2,000+ GitHub stars
- 10+ languages supported
- Firefox extension published
- Apply for Anthropic Claude for Open Source

### Long-term (12 months):
- 20,000+ installs
- 5,000+ GitHub stars
- 20+ languages
- Enterprise version (team features)
- Partnership with AI companies

---

## 11. MARKETING STRATEGY

### Launch Day:
1. Hacker News "Show HN: SafePrompt - Protect your data before AI sees it"
2. Reddit: r/privacy, r/ChatGPT, r/artificial, r/opensource
3. X/Twitter: Thread with demo GIF
4. Product Hunt launch
5. Dev.to article: "I built an open-source privacy shield for AI chatbots"

### Ongoing:
- Blog post for each new language added
- Security research posts (stats on what data people share with AI)
- Partner with privacy advocates
- Arabic tech community outreach
- University CS department outreach

### Key Messages:
- "20% of data sent to AI chatbots contains sensitive information"
- "The first privacy shield that speaks Arabic, Spanish, Chinese"
- "100% local - we never see your data"
- "Open source - trust, but verify"

---

## 12. ANTHROPIC APPLICATION STRATEGY

### Why Anthropic will love SafePrompt:
1. Protects Claude users directly
2. Aligns with "AI safety for everyone" mission
3. Open source & community-driven
4. Serves underrepresented languages (Arabic, etc.)
5. Makes AI safer without limiting its utility
6. Not a competing product - a complementary safety layer

### Application talking points:
- "SafePrompt protects [X] users across [Y] AI platforms"
- "First open-source, multi-language PII shield for AI"
- "Community has contributed [Z] language patterns"
- "Prevented [N] potential data exposures"

---

## 13. TECH STACK

- Pure JavaScript (no build tools needed for v1)
- Chrome Extension Manifest V3
- CSS3 with CSS Variables (theming)
- No external dependencies (security principle)
- Jest for testing
- GitHub Actions for CI

### Why no frameworks?
- Smaller extension size (faster install)
- No supply chain attack surface
- Easier to audit (security tool must be auditable)
- Lower barrier for community contributions
- No build step needed

---

## 14. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positives (detecting non-PII as PII) | User annoyance | Tunable sensitivity + easy dismiss |
| False negatives (missing real PII) | Security gap | Multiple pattern layers + community testing |
| AI platforms change their DOM | Extension breaks | Platform-agnostic interceptor as fallback |
| Competition copies features | Lose differentiation | Move fast, build community, stay open source |
| Chrome Web Store rejection | Can't distribute | Follow all Chrome policies strictly |
| Performance impact on chat | Slow user experience | Debounced scanning, efficient regex |

---

## NEXT STEP: Start building Phase 1
