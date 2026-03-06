# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in SafePrompt, please report it responsibly:

1. **Do NOT open a public issue**
2. Use GitHub's **private vulnerability reporting** (Security tab > Report a vulnerability)
3. Include: description, reproduction steps, and potential impact
4. We will respond within 48 hours

## Security Principles

SafePrompt is built on these security principles:

- **100% Local Processing** - All PII detection happens in your browser. No data is ever sent to external servers.
- **Zero Dependencies** - No npm packages in production. Zero supply chain risk.
- **Minimal Permissions** - Only `storage` (settings), `activeTab` (content script), and `contextMenus` (right-click masking).
- **No Telemetry** - No analytics, no tracking, no usage data collection.
- **Auditable Code** - Every line of code is open source and reviewable.
- **Token Auto-Expiry** - Redaction token mappings automatically expire after 4 hours.
- **Memory-Only Tokens** - Token mappings are stored only in memory, cleared when browser closes.

## What We Store

SafePrompt stores the following data locally in your browser (via `chrome.storage`):
- Settings (sensitivity level, enabled languages, enabled categories)
- Activity log (detection counts and types, NOT the actual sensitive data)
- Allowlist entries
- Disabled sites list

We **never** store:
- The actual text you type
- The PII values detected
- Token-to-value mappings on disk (memory only)
- Any data on external servers

## Permissions Explained

| Permission | Why |
|-----------|-----|
| `storage` | Save user settings and activity log locally |
| `activeTab` | Inject content scripts on AI chatbot pages |
| `contextMenus` | Right-click "Mask with SafePrompt" functionality |

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x  | Yes       |
