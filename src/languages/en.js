/**
 * SafePrompt - English Language Patterns
 * Covers US/UK PII: SSN, credit cards, phones, emails, API keys, passwords, etc.
 */

const SafePromptEN = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  rtl: false,
  patterns: {
    // ── Identity ──────────────────────────────────────────────────────────────
    identity: [
      {
        type: 'ssn',
        label: 'Social Security Number',
        pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
        flags: 'g',
        severity: 'critical',
        validate(v) {
          const clean = v.replace(/\D/g, '');
          if (clean.startsWith('000') || clean.startsWith('666')) return false;
          if (clean.substring(3, 5) === '00') return false;
          if (clean.substring(5) === '0000') return false;
          return true;
        },
      },
      {
        type: 'passport_us',
        label: 'US Passport Number',
        pattern: '\\b[A-Z]\\d{8}\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'drivers_license',
        label: 'Driver\'s License Number',
        pattern: '\\b[A-Z]\\d{7,14}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['license', 'licence', 'driver', 'DL', 'driving'],
        contextRequired: true,
      },
      {
        type: 'national_insurance_uk',
        label: 'UK National Insurance Number',
        pattern: '\\b[A-CEGHJ-PR-TW-Z]{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?[A-D]\\b',
        flags: 'gi',
        severity: 'critical',
      },
    ],

    // ── Financial ─────────────────────────────────────────────────────────────
    financial: [
      {
        type: 'credit_card',
        label: 'Credit Card Number',
        pattern: '\\b(?:4\\d{3}|5[1-5]\\d{2}|3[47]\\d{2}|6(?:011|5\\d{2}))[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{1,4}\\b',
        flags: 'g',
        severity: 'critical',
        validate(v) {
          const digits = v.replace(/\D/g, '');
          if (digits.length < 13 || digits.length > 19) return false;
          // Luhn algorithm
          let sum = 0;
          let alt = false;
          for (let i = digits.length - 1; i >= 0; i--) {
            let n = parseInt(digits[i], 10);
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n;
            alt = !alt;
          }
          return sum % 10 === 0;
        },
      },
      {
        type: 'iban_gb',
        label: 'UK IBAN',
        pattern: '\\bGB\\d{2}\\s?[A-Z]{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2}\\b',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'bank_account_us',
        label: 'US Bank Account Number',
        pattern: '\\b\\d{8,17}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['account number', 'bank account', 'routing', 'checking', 'savings'],
        contextRequired: true,
      },
      {
        type: 'routing_number',
        label: 'US Bank Routing Number',
        pattern: '\\b\\d{9}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['routing number', 'ABA', 'routing'],
        contextRequired: true,
        validate(v) {
          const d = v.split('').map(Number);
          const checksum = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10;
          return checksum === 0;
        },
      },
    ],

    // ── Contact ───────────────────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: 'Email Address',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_us',
        label: 'US Phone Number',
        pattern: '(?:\\+?1[\\s.-])?\\(?\\d{3}\\)?[\\s.-]\\d{3}[\\s.-]\\d{4}\\b',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'phone_uk',
        label: 'UK Phone Number',
        pattern: '(?:\\+?44[\\s.-])(?:\\d[\\s.-]?){9,10}\\b',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'address',
        label: 'Street Address',
        pattern: '\\b\\d{1,5}\\s[A-Z][a-z]+(?:\\s[A-Z][a-z]+)*\\s(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Ln|Lane|Rd|Road|Ct|Court|Pl(?:ace)?|Way|Cir(?:cle)?)\\b',
        flags: 'g',
        severity: 'medium',
      },
      {
        type: 'zip_code',
        label: 'ZIP Code',
        pattern: '\\b\\d{5}(?:-\\d{4})?\\b',
        flags: 'g',
        severity: 'low',
        keywords: ['zip', 'postal', 'zip code'],
        contextRequired: true,
      },
    ],

    // ── Medical ───────────────────────────────────────────────────────────────
    medical: [
      {
        type: 'dob',
        label: 'Date of Birth',
        pattern: '\\b(?:0[1-9]|1[0-2])[/\\-](?:0[1-9]|[12]\\d|3[01])[/\\-](?:19|20)\\d{2}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['born', 'birth', 'DOB', 'birthday', 'date of birth'],
        contextRequired: true,
      },
    ],

    // ── Credentials ───────────────────────────────────────────────────────────
    credentials: [
      {
        type: 'api_key',
        label: 'API Key',
        pattern: '\\b(?:sk|pk|api|key)[_-][a-zA-Z0-9_\\-]{20,}\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'aws_key',
        label: 'AWS Access Key',
        pattern: '\\bAKIA[0-9A-Z]{16}\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'aws_secret',
        label: 'AWS Secret Key',
        pattern: '\\b[A-Za-z0-9/+=]{40}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['aws_secret', 'secret_access_key', 'AWS_SECRET'],
        contextRequired: true,
      },
      {
        type: 'jwt',
        label: 'JWT Token',
        pattern: '\\beyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'private_key',
        label: 'Private Key',
        pattern: '-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\\s\\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'password',
        label: 'Password',
        pattern: '(?:password|passwd|pwd|pass)\\s*[:=]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'github_token',
        label: 'GitHub Token',
        pattern: '\\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'slack_token',
        label: 'Slack Token',
        pattern: '\\bxox[baprs]-[0-9a-zA-Z-]{10,}\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'generic_secret',
        label: 'Secret/Token',
        pattern: '(?:secret|token|bearer)\\s*[:=]\\s*["\']?([A-Za-z0-9_\\-\\.]{8,})["\']?',
        flags: 'gi',
        severity: 'high',
      },
    ],

    // ── Network ───────────────────────────────────────────────────────────────
    network: [
      {
        type: 'ipv4',
        label: 'IP Address (v4)',
        pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
        flags: 'g',
        severity: 'medium',
        validate(v) {
          // Skip common non-PII IPs
          if (v === '0.0.0.0' || v === '127.0.0.1' || v === '255.255.255.255') return false;
          if (v.startsWith('192.168.') || v.startsWith('10.')) return false;
          return true;
        },
      },
      {
        type: 'ipv6',
        label: 'IP Address (v6)',
        pattern: '\\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\\b',
        flags: 'g',
        severity: 'medium',
        validate(v) {
          if (v === '0000:0000:0000:0000:0000:0000:0000:0001') return false;
          return true;
        },
      },
      {
        type: 'mac_address',
        label: 'MAC Address',
        pattern: '\\b[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}\\b',
        flags: 'g',
        severity: 'medium',
      },
    ],

    // ── Crypto ────────────────────────────────────────────────────────────────
    crypto: [
      {
        type: 'bitcoin_address',
        label: 'Bitcoin Address',
        pattern: '\\b(?:bc1[a-zA-HJ-NP-Z0-9]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\\b',
        flags: 'g',
        severity: 'critical',
      },
      {
        type: 'ethereum_address',
        label: 'Ethereum Address',
        pattern: '\\b0x[0-9a-fA-F]{40}\\b',
        flags: 'g',
        severity: 'critical',
      },
    ],

    // ── Location ──────────────────────────────────────────────────────────────
    location: [
      {
        type: 'gps_coordinates',
        label: 'GPS Coordinates',
        pattern: '[-+]?(?:[1-8]?\\d(?:\\.\\d{4,})|90(?:\\.0{4,}))\\s*,\\s*[-+]?(?:1[0-7]\\d|0?\\d{1,2})(?:\\.\\d{4,})',
        flags: 'g',
        severity: 'high',
      },
    ],

    // ── Social Media ──────────────────────────────────────────────────────────
    social: [
      {
        type: 'social_handle',
        label: 'Social Media Handle',
        pattern: '(?:@[a-zA-Z_][a-zA-Z0-9_.]{2,30})',
        flags: 'g',
        severity: 'low',
        keywords: ['twitter', 'instagram', 'tiktok', 'handle', 'username', 'follow', 'account', 'profile', 'snap', 'x.com'],
        contextRequired: true,
      },
    ],

    // ── Vehicle ───────────────────────────────────────────────────────────────
    vehicle: [
      {
        type: 'vin',
        label: 'Vehicle Identification Number',
        pattern: '\\b[A-HJ-NPR-Z0-9]{17}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['VIN', 'vehicle', 'chassis', 'car'],
        contextRequired: true,
      },
    ],

    // ── Medical / Insurance ───────────────────────────────────────────────────
    medical_insurance: [
      {
        type: 'mrn',
        label: 'Medical Record Number',
        pattern: '(?:MRN|MR#|Med\\s*Rec)[:\\s]\\s*[A-Z0-9]{5,15}\\b',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'npi',
        label: 'NPI Number',
        pattern: '(?:NPI)[:\\s]\\s*\\d{10}\\b',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'insurance_id',
        label: 'Insurance Policy Number',
        pattern: '(?:policy|insurance|member)\\s*(?:number|no\\.?|#|id)[:\\s]\\s*[A-Z0-9\\-]{6,20}\\b',
        flags: 'gi',
        severity: 'high',
      },
    ],

    // ── URLs with PII ─────────────────────────────────────────────────────────
    urls: [
      {
        type: 'url_pii',
        label: 'URL with Personal Data',
        pattern: 'https?://[^\\s]+[?&](?:email|mail|user|name|phone|ssn|password|token|key|secret|auth|session)=[^\\s&]{2,}[^\\s]*',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptEN = SafePromptEN;
if (typeof module !== 'undefined') module.exports = { SafePromptEN };
