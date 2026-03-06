# Contributing to SafePrompt

Thank you for your interest in making AI safer for everyone! Here's how you can help.

## Ways to Contribute

### 1. Add a New Language
The easiest and most impactful contribution. Each language is a single file.

**Steps:**
1. Fork the repo and create a branch: `git checkout -b lang/language-name`
2. Copy `src/languages/en.js` as a template
3. Create `src/languages/xx.js` (use ISO 639-1 code)
4. Define patterns for your language's PII types
5. Register the language in `src/languages/registry.js`
6. Add tests in `tests/detector.test.js`
7. Submit a PR

**Language file structure:**
```javascript
const SafePromptXX = {
  code: 'xx',           // ISO 639-1 code
  name: 'Language',      // English name
  nativeName: 'Native',  // Native name
  rtl: false,            // Right-to-left?
  patterns: {
    identity: [...],     // National IDs, passports
    financial: [...],    // IBANs, bank accounts
    contact: [...],      // Phone, email, address
    credentials: [...],  // Passwords
    personal: [...],     // DOB
  },
};
```

### 2. Improve Existing Patterns
- Fix false positives or false negatives
- Add validation functions (like Luhn for credit cards)
- Add missing PII types for supported languages

### 3. Add Platform Support
- Identify CSS selectors for new AI chatbot platforms
- Update `src/platforms/platform-detector.js`
- Test on the actual platform

### 4. Report Bugs
Open an issue with:
- Browser version
- Platform where the issue occurred
- Text that triggered the bug (redact actual PII!)
- Expected vs actual behavior

### 5. Improve Documentation
- README improvements
- Pattern documentation
- Translation of docs

## Development Setup

```bash
git clone https://github.com/Alarpi1995/safeprompt.git
cd safeprompt
npm install
npm test
```

Load the extension in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the repo folder

## Pattern Guidelines

### Do
- Use `\b` word boundaries to prevent substring matches
- Add `validate()` functions for patterns with checksums (Luhn, mod checks)
- Use `contextRequired: true` for generic patterns (like `\d{9}`)
- Include `keywords` array for context-aware detection
- Test with real-world examples (redacted)
- Set appropriate severity levels

### Don't
- Create patterns that match common words or short strings
- Use overly broad regex that causes false positives
- Forget to handle optional spaces/dashes in formatted numbers
- Skip the `\b` boundary - it prevents matching digits inside larger numbers

### Severity Levels
- **critical** - Uniquely identifying (SSN, national ID, API keys)
- **high** - Highly sensitive (email, phone, credit card)
- **medium** - Moderately sensitive (IP address, DOB)
- **low** - Potentially sensitive (ZIP code)

## Code Style

- Pure JavaScript (no TypeScript, no frameworks)
- No external dependencies in production code
- Use descriptive variable names
- Follow existing code patterns
- Test every new pattern

## Pull Request Process

1. Ensure all tests pass: `npm test`
2. Add tests for new patterns
3. Update README if adding languages/platforms
4. One PR per feature/language
5. Keep PRs focused and reviewable

## Code of Conduct

Be respectful, inclusive, and constructive. We're building something to protect everyone's privacy.

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.
