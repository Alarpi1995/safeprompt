# SafePrompt - Competitor Deep Analysis
## Last Updated: March 2026

---

## ALL COMPETITORS MAP

### Tier 1: Direct Competitors (Browser Extensions for AI Privacy)

---

### 1. LLM Guard Extension (llmguard.net)
**Type:** Open Source | Free
**Stars:** Small
**Platforms:** ChatGPT only (Claude, Gemini "coming soon")

**Features:**
- 10+ detection patterns (email, SSN, credit card, API keys, JWT, AWS, IP)
- Blocks submission + shows warning
- Enable/disable specific patterns
- Custom regex rules
- Custom keywords
- Adjustable severity levels
- Full config UI
- Zero telemetry
- Works on Chrome, Edge, Brave

**Weaknesses:**
- ChatGPT ONLY (no Claude, Gemini, etc.)
- English ONLY
- No smart unmasking (redact only, no restore)
- No file scanning
- No activity log
- No allowlist
- Basic UI
- Small community

---

### 2. ChatWall (chatwall.io)
**Type:** Closed Source | Freemium
**Platforms:** ChatGPT, Gemini, Claude, Grok, Copilot, DeepSeek

**Features:**
- 25+ entity types detection
- 100% local processing (browser version)
- Smart overlay (text never touches the host page)
- Enterprise Docker deployment (ChatWall Box)
- AI-powered contextual anonymization (enterprise)
- LLM usage control & audit logs (enterprise)
- Connect to any model (public or local/RAG)
- Budget tracking per LLM
- Privacy policy violation monitoring

**Weaknesses:**
- NOT open source
- Freemium (advanced features = paid)
- No multi-language support mentioned
- Enterprise focus (not community-friendly)
- No community contribution model

---

### 3. PiiBlock (piiblock.com)
**Type:** Closed Source | Free
**Platforms:** All AI chatbots

**Features:**
- 15+ PII types detection
- 100% local processing
- Smart unmasking (AI sees placeholders, you see real data in response)
- Risk-based classification (severity levels)
- Automatic highlighting of detected PII
- No account needed
- 10-second install

**Weaknesses:**
- NOT open source (can't verify privacy claims)
- English-focused
- No file scanning
- No activity log
- No custom patterns
- No community contributions
- No enterprise features

---

### 4. Cloak / anonym.legal
**Type:** Closed Source | Paid (enterprise)
**Platforms:** ChatGPT, Claude, Gemini, DeepSeek, Perplexity, Abacus.ai

**Features:**
- 260+ entity types (MOST comprehensive)
- 48 languages (including Arabic RTL)
- 317 regex + NLP models
- Real-time interception
- Reversible encryption (de-anonymization)
- Preview modal before sending
- Configurable confidence thresholds
- MCP integration (coding assistants)
- Microsoft Word integration
- Enterprise API

**Weaknesses:**
- NOT open source
- PAID (enterprise pricing)
- Chrome Extension in "preview" (not publicly available yet)
- Requires API connection (not 100% local in full mode)
- Complex setup for non-technical users
- No community contribution model

---

### 5. PasteSecure (pastesecure.com)
**Type:** Closed Source | Freemium
**Platforms:** ChatGPT, Claude, Gemini, webforms, email

**Features:**
- Clipboard paste monitoring
- Real-time typing monitoring
- FILE SCANNING (.docx, .xlsx, .csv, .txt) - UNIQUE
- Activity log (full redaction history)
- CSV export for compliance/auditing
- Global allowlist (whitelist specific strings)
- Mute function (pause for 3 minutes)
- Granular category toggles
- Credentials detection (username + password combos)

**Weaknesses:**
- NOT open source
- Freemium model
- English-focused
- No smart unmasking
- No multi-language support
- Limited platform coverage

---

### 6. ChatGPT Privacy Shield (redact.tools)
**Type:** Open Source | Free
**Platforms:** ChatGPT only

**Features:**
- Auto-redaction with smart placeholders
- Optional unmasking in chat
- 100% local processing
- Free Chrome extension
- Simple 5-step workflow

**Weaknesses:**
- ChatGPT ONLY
- English ONLY
- Limited PII types
- Basic functionality
- Small user base

---

### 7. Strac (strac.io)
**Type:** Closed Source | Enterprise
**Platforms:** ChatGPT (primary), multi-browser

**Features:**
- Real-time chat monitoring
- PII, PHI, PCI detection
- Code snippet detection
- Multiple modes: Audit, Alert, Block, Redact
- Corporate email enforcement
- Full interaction recording
- Chrome, Edge, Safari, Firefox
- Compliance-focused (HIPAA, SOC2, GDPR)
- 30-day free trial

**Weaknesses:**
- Enterprise-only pricing
- NOT open source
- Complex setup
- Requires corporate deployment
- Not for individual users

---

### 8. PromptSafe
**Type:** Closed Source | Free
**Platforms:** Limited

**Features:**
- PII protection for AI prompts
- Basic detection patterns

**Weaknesses:**
- Very limited features
- Small user base
- No advanced features

---

### 9. PII Guardian
**Type:** Closed Source | Free
**Platforms:** ChatGPT, Claude

**Features:**
- AI-powered LLM protection
- PII detection using AI models

**Weaknesses:**
- Uses AI for detection (requires API calls = not local)
- Privacy concern (sends data to detect data)
- Limited platforms

---

## Tier 2: Developer Libraries (Not user-facing)

| Library | Stars | Languages | Local? | Note |
|---------|-------|-----------|--------|------|
| Microsoft Presidio | ~6K | English default, extensible | Yes | Server-side library, not browser |
| LLM Guard (Protect AI) | ~2.5K | English | Yes | Server middleware |
| Blindfold | Small | 86 entity types | Yes | SDK, not user-facing |
| NeMo Guardrails | Large | English | Yes | NVIDIA, server-side |

---

## FEATURE COMPARISON MATRIX

| Feature | SafePrompt | LLMGuard | ChatWall | PiiBlock | Cloak | PasteSecure | Strac |
|---------|-----------|----------|----------|---------|-------|-------------|-------|
| **CORE** | | | | | | | |
| Open Source | YES | YES | NO | NO | NO | NO | NO |
| Free Forever | YES | YES | Freemium | YES | PAID | Freemium | PAID |
| 100% Local | YES | YES | YES* | YES | NO | YES | NO |
| No Account | YES | YES | YES | YES | NO | YES | NO |
| **DETECTION** | | | | | | | |
| Entity Types | 50+ | 10+ | 25+ | 15+ | 260+ | 15+ | 20+ |
| Languages | 5+ | 1 | 1 | 1 | 48 | 1 | 1 |
| Arabic | YES | NO | NO | NO | YES | NO | NO |
| Chinese | YES | NO | NO | NO | YES | NO | NO |
| Spanish | YES | NO | NO | NO | YES | NO | NO |
| Custom Patterns | YES | YES | NO | NO | YES | NO | NO |
| NLP + Regex | YES | NO | YES* | NO | YES | NO | NO |
| **PLATFORMS** | | | | | | | |
| ChatGPT | YES | YES | YES | YES | YES | YES | YES |
| Claude | YES | NO | YES | YES | YES | YES | NO |
| Gemini | YES | NO | YES | YES | YES | YES | NO |
| Copilot | YES | NO | YES | NO | NO | NO | NO |
| DeepSeek | YES | NO | YES | YES | YES | NO | NO |
| Perplexity | YES | NO | NO | YES | YES | NO | NO |
| **ACTIONS** | | | | | | | |
| Block & Warn | YES | YES | YES | YES | YES | YES | YES |
| Redact & Send | YES | NO | YES | YES | YES | YES | YES |
| Smart Unmask | YES | NO | YES | YES | YES | NO | NO |
| Edit & Retry | YES | NO | NO | NO | YES | NO | NO |
| **UX** | | | | | | | |
| Severity Levels | YES | YES | NO | YES | YES | NO | YES |
| Dark Mode | YES | NO | YES | YES | YES | NO | NO |
| RTL Support | YES | NO | NO | NO | YES | NO | NO |
| Preview Modal | YES | NO | NO | NO | YES | NO | NO |
| Badge Counter | YES | NO | NO | NO | NO | NO | NO |
| **ADVANCED** | | | | | | | |
| File Scanning | v2 | NO | NO | NO | NO | YES | NO |
| Activity Log | YES | NO | YES* | NO | NO | YES | YES |
| Export Report | YES | NO | YES* | NO | NO | YES | YES |
| Allowlist | YES | NO | NO | NO | YES | YES | NO |
| Mute/Pause | YES | NO | NO | NO | NO | YES | NO |
| Community Patterns | YES | NO | NO | NO | NO | NO | NO |
| Stats Dashboard | YES | NO | NO | NO | NO | NO | NO |
| **TRUST** | | | | | | | |
| Auditable Code | YES | YES | NO | NO | NO | NO | NO |
| Min Permissions | YES | YES | ? | ? | NO | ? | NO |
| No Telemetry | YES | YES | ? | ? | NO | ? | NO |
| Security Policy | YES | NO | ? | ? | YES | ? | YES |

* = Enterprise only

---

## UNIQUE FEATURES WE SHOULD BUILD (Not in any competitor)

### 1. Community Pattern Marketplace
No competitor allows community contributions. SafePrompt will have:
- GitHub-based pattern contributions via PRs
- Each language = separate file, easy to contribute
- Pattern quality scoring based on test coverage
- "Contributed by" credits in the extension

### 2. Privacy Score Dashboard
Show users their privacy protection stats:
- "You've protected 47 sensitive items this month"
- "3 credit cards, 12 emails, 8 phone numbers blocked"
- "Your most common exposure: email addresses"
- Shareable badge: "Protected by SafePrompt"

### 3. Smart Context Detection
Not just regex — understand CONTEXT:
- "my password is abc123" → detect password in sentence
- "call me at" + number → detect phone in context
- "born on" + date → detect DOB in context
- Works across all supported languages

### 4. Drag & Drop Quick Scan
Drag any text file onto the extension popup = instant scan
No need to paste into a chatbot first

### 5. Real-Time Typing Indicator
As user types, show a small colored dot:
- Green = no PII detected
- Yellow = low-severity PII
- Red = critical PII detected
Non-intrusive, always visible

### 6. Per-Platform Settings
Different sensitivity for different platforms:
- Claude: medium sensitivity
- ChatGPT: high sensitivity (trains on data)
- Local LLM: low sensitivity (stays on device)

### 7. Keyboard Shortcut Scan
Ctrl+Shift+S = scan clipboard before pasting
Quick protection without the full workflow

### 8. One-Click Privacy Report
Generate a PDF: "What data you almost shared with AI this month"
Useful for compliance, personal awareness

---

## COMPETITOR WEAKNESSES TO EXPLOIT

### 1. Trust Problem
52% of AI Chrome extensions collect user data.
30+ malicious extensions caught stealing data in 2026.
SafePrompt answer: 100% open source, minimal permissions, zero telemetry.

### 2. Language Gap
Only Cloak/anonym.legal supports multiple languages, but:
- It's PAID and CLOSED source
- Chrome extension is in "preview" (not available)
- Can't verify their privacy claims
SafePrompt answer: First FREE, OPEN SOURCE multi-language solution.

### 3. Platform Coverage
Most extensions only support 1-3 platforms.
SafePrompt answer: 6+ platforms from day one.

### 4. Community Gap
Zero competitors have community contribution models.
SafePrompt answer: GitHub-driven community patterns.

### 5. Transparency Gap
Users can't verify if closed-source extensions actually protect them.
SafePrompt answer: Every line of code is auditable.

---

## FEATURES PRIORITY FOR SafePrompt v1.0

### Must Have (Launch):
1. Multi-language PII detection (EN, AR, ES, FR, ZH)
2. Multi-platform support (6 AI chatbots)
3. Block & warn before sending
4. One-click redact & send
5. Smart unmasking (restore data in AI responses)
6. Severity levels (critical/high/medium/low)
7. Settings page (toggle languages, categories)
8. Dark mode + RTL support
9. Real-time typing indicator
10. Badge counter
11. 100% local, zero permissions beyond needed
12. Activity log (local storage only)

### Should Have (v1.1):
13. Allowlist (whitelist specific strings)
14. Mute/pause function
15. Custom regex patterns
16. Per-platform sensitivity settings
17. Keyboard shortcut (Ctrl+Shift+S)
18. Stats dashboard
19. Community pattern contributions guide

### Nice to Have (v2.0):
20. File scanning (.docx, .pdf, .csv)
21. Privacy report export (PDF/CSV)
22. Firefox + Edge versions
23. Context-aware NLP detection
24. Drag & drop quick scan
25. Browser notification on high-severity
