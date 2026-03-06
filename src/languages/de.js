/**
 * SafePrompt - German Language Patterns (Deutsch)
 * Covers Germany, Austria, Switzerland PII patterns
 */

const SafePromptDE = {
  code: 'de',
  name: 'German',
  nativeName: 'Deutsch',
  rtl: false,
  patterns: {
    // ── Identitaet (Identity) ────────────────────────────────────────────────
    identity: [
      {
        type: 'personalausweis_de',
        label: 'Personalausweisnummer',
        pattern: '\\b[CFGHJKLMNPRTVWXYZ0-9]{9}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['Personalausweis', 'Ausweis', 'Ausweisnummer', 'ID'],
        contextRequired: true,
      },
      {
        type: 'reisepass_de',
        label: 'Reisepassnummer',
        pattern: '\\b[CFGHJKLMNPRTVWXYZ][CFGHJKLMNPRTVWXYZ0-9]{8}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['Reisepass', 'Pass', 'Passnummer', 'passport'],
        contextRequired: true,
      },
      {
        type: 'steuer_id_de',
        label: 'Steuerliche Identifikationsnummer',
        pattern: '\\b\\d{11}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['Steuer-ID', 'Steueridentifikationsnummer', 'IdNr', 'Identifikationsnummer', 'TIN'],
        contextRequired: true,
      },
      {
        type: 'sozialversicherung_de',
        label: 'Sozialversicherungsnummer',
        pattern: '\\b\\d{2}\\s?\\d{6}\\s?[A-Z]\\s?\\d{3}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['Sozialversicherung', 'SV-Nummer', 'Versicherungsnummer', 'Rentenversicherung'],
        contextRequired: true,
      },
    ],

    // ── Finanzen (Financial) ─────────────────────────────────────────────────
    financial: [
      {
        type: 'iban_de',
        label: 'IBAN (Deutschland)',
        pattern: '\\bDE\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2}\\b',
        flags: 'gi',
        severity: 'critical',
        keywords: ['IBAN', 'Konto', 'Kontonummer', 'Bankverbindung'],
      },
      {
        type: 'iban_at',
        label: 'IBAN (Oesterreich)',
        pattern: '\\bAT\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\b',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'iban_ch',
        label: 'IBAN (Schweiz)',
        pattern: '\\bCH\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{1}\\b',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'bic_de',
        label: 'BIC/SWIFT Code',
        pattern: '\\b[A-Z]{4}DE[A-Z0-9]{2}(?:[A-Z0-9]{3})?\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['BIC', 'SWIFT', 'Bankleitzahl'],
      },
      {
        type: 'credit_card',
        label: 'Kreditkartennummer',
        pattern: '\\b(?:4\\d{3}|5[1-5]\\d{2}|3[47]\\d{2}|6(?:011|5\\d{2}))[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{1,4}\\b',
        flags: 'g',
        severity: 'critical',
        validate(v) {
          const digits = v.replace(/\D/g, '');
          if (digits.length < 13 || digits.length > 19) return false;
          let sum = 0, alt = false;
          for (let i = digits.length - 1; i >= 0; i--) {
            let n = parseInt(digits[i], 10);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n;
            alt = !alt;
          }
          return sum % 10 === 0;
        },
      },
    ],

    // ── Kontakt (Contact) ────────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: 'E-Mail-Adresse',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_de',
        label: 'Telefonnummer (Deutschland)',
        pattern: '\\b(?:\\+?49|0049|0)[\\s.-]?(?:\\d[\\s.-]?){9,11}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['Telefon', 'Tel', 'Handy', 'Mobil', 'Nummer', 'Rufnummer'],
      },
      {
        type: 'plz_de',
        label: 'Postleitzahl',
        pattern: '\\b\\d{5}\\b',
        flags: 'g',
        severity: 'low',
        keywords: ['PLZ', 'Postleitzahl'],
        contextRequired: true,
      },
    ],

    // ── Persoenlich (Personal) ───────────────────────────────────────────────
    personal: [
      {
        type: 'dob_de',
        label: 'Geburtsdatum',
        pattern: '\\b(?:0[1-9]|[12]\\d|3[01])\\.(?:0[1-9]|1[0-2])\\.(?:19|20)\\d{2}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['geboren', 'Geburtsdatum', 'Geburtstag', 'geb'],
        contextRequired: true,
      },
    ],

    // ── Zugangsdaten (Credentials) ──────────────────────────────────────────
    credentials: [
      {
        type: 'password',
        label: 'Passwort',
        pattern: '(?:Passwort|Kennwort|password|passwd)\\s*[:=]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptDE = SafePromptDE;
if (typeof module !== 'undefined') module.exports = { SafePromptDE };
