const { SafePromptDetector } = require('../src/core/detector');
const { SafePromptEN } = require('../src/languages/en');
const { SafePromptAR } = require('../src/languages/ar');
const { SafePromptES } = require('../src/languages/es');
const { SafePromptFR } = require('../src/languages/fr');
const { SafePromptZH } = require('../src/languages/zh');
const { SafePromptDE } = require('../src/languages/de');
const { SafePromptPT } = require('../src/languages/pt');
const { SafePromptContext } = require('../src/core/context-patterns');

function createDetector() {
  const d = new SafePromptDetector();
  d.registerLanguage('en', SafePromptEN);
  d.registerLanguage('ar', SafePromptAR);
  d.registerLanguage('es', SafePromptES);
  d.registerLanguage('fr', SafePromptFR);
  d.registerLanguage('zh', SafePromptZH);
  d.registerLanguage('de', SafePromptDE);
  d.registerLanguage('pt', SafePromptPT);
  d.registerLanguage('context', SafePromptContext);
  return d;
}

// ═══════════════════════════════════════════════════════════════════════════
// English Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('English - Identity', () => {
  const d = createDetector();

  test('detects valid SSN', () => {
    const results = d.scan('My SSN is 123-45-6789');
    const ssn = results.find((r) => r.type === 'ssn');
    expect(ssn).toBeDefined();
    expect(ssn.value).toBe('123-45-6789');
    expect(ssn.severity).toBe('critical');
  });

  test('rejects invalid SSN starting with 000', () => {
    const results = d.scan('SSN: 000-12-3456');
    const ssn = results.find((r) => r.type === 'ssn');
    expect(ssn).toBeUndefined();
  });

  test('detects UK National Insurance Number', () => {
    const results = d.scan('NI number: AB 12 34 56 C');
    const ni = results.find((r) => r.type === 'national_insurance_uk');
    expect(ni).toBeDefined();
  });
});

describe('English - Financial', () => {
  const d = createDetector();

  test('detects valid Visa card', () => {
    const results = d.scan('Card: 4532015112830366');
    const cc = results.find((r) => r.type === 'credit_card');
    expect(cc).toBeDefined();
    expect(cc.severity).toBe('critical');
  });

  test('detects Visa with dashes', () => {
    const results = d.scan('Card: 4532-0151-1283-0366');
    const cc = results.find((r) => r.type === 'credit_card');
    expect(cc).toBeDefined();
  });

  test('rejects invalid credit card (bad Luhn)', () => {
    const results = d.scan('Card: 4532015112830367');
    const cc = results.find((r) => r.type === 'credit_card');
    expect(cc).toBeUndefined();
  });

  test('detects UK IBAN', () => {
    const results = d.scan('IBAN: GB29 NWBK 6016 1331 9268 19');
    const iban = results.find((r) => r.type === 'iban_gb');
    expect(iban).toBeDefined();
  });
});

describe('English - Contact', () => {
  const d = createDetector();

  test('detects email address', () => {
    const results = d.scan('Email me at john.doe@example.com');
    const email = results.find((r) => r.type === 'email');
    expect(email).toBeDefined();
    expect(email.value).toBe('john.doe@example.com');
  });

  test('detects US phone number', () => {
    const results = d.scan('Call me at (555) 123-4567');
    const phone = results.find((r) => r.type === 'phone_us');
    expect(phone).toBeDefined();
  });

  test('detects US phone with country code', () => {
    const results = d.scan('Phone: +1 555-123-4567');
    const phone = results.find((r) => r.type === 'phone_us');
    expect(phone).toBeDefined();
  });
});

describe('English - Credentials', () => {
  const d = createDetector();

  test('detects API key', () => {
    const results = d.scan('api_key: key_abcdef1234567890abcdef');
    const key = results.find((r) => r.type === 'api_key');
    expect(key).toBeDefined();
    expect(key.severity).toBe('critical');
  });

  test('detects AWS access key', () => {
    const results = d.scan('AWS key: AKIAIOSFODNN7EXAMPLE');
    const aws = results.find((r) => r.type === 'aws_key');
    expect(aws).toBeDefined();
  });

  test('detects JWT token', () => {
    const results = d.scan('token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    const jwt = results.find((r) => r.type === 'jwt');
    expect(jwt).toBeDefined();
  });

  test('detects GitHub token', () => {
    const results = d.scan('token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij');
    const gh = results.find((r) => r.type === 'github_token');
    expect(gh).toBeDefined();
  });

  test('detects password in assignment', () => {
    const results = d.scan('password = "myS3cretP@ss"');
    const pw = results.find((r) => r.type === 'password');
    expect(pw).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Arabic Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Arabic - Identity', () => {
  const d = createDetector();

  test('detects Saudi phone number', () => {
    const results = d.scan('جوالي 0512345678');
    const phone = results.find((r) => r.type === 'phone_sa');
    expect(phone).toBeDefined();
  });

  test('detects Saudi phone with country code', () => {
    const results = d.scan('رقمي +966512345678');
    const phone = results.find((r) => r.type === 'phone_sa');
    expect(phone).toBeDefined();
  });

  test('detects Saudi IBAN', () => {
    const results = d.scan('حسابي SA0380000000608010167519');
    const iban = results.find((r) => r.type === 'iban_sa');
    expect(iban).toBeDefined();
  });

  test('detects Egyptian phone number', () => {
    const results = d.scan('رقمي 01012345678');
    const phone = results.find((r) => r.type === 'phone_eg');
    expect(phone).toBeDefined();
  });

  test('detects Emirates ID', () => {
    const results = d.scan('هويتي 784-1234-1234567-1');
    const eid = results.find((r) => r.type === 'emirates_id');
    expect(eid).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Spanish Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Spanish - Identity', () => {
  const d = createDetector();

  test('detects valid DNI', () => {
    const results = d.scan('Mi DNI es 12345678Z');
    const dni = results.find((r) => r.type === 'dni_es');
    expect(dni).toBeDefined();
    expect(dni.severity).toBe('critical');
  });

  test('rejects DNI with wrong letter', () => {
    const results = d.scan('DNI: 12345678A');
    const dni = results.find((r) => r.type === 'dni_es');
    expect(dni).toBeUndefined();
  });

  test('detects valid NIE', () => {
    const results = d.scan('NIE: X1234567L');
    const nie = results.find((r) => r.type === 'nie_es');
    expect(nie).toBeDefined();
  });

  test('detects Spanish phone', () => {
    const results = d.scan('Llama al 612 34 56 78');
    const phone = results.find((r) => r.type === 'phone_es');
    expect(phone).toBeDefined();
  });

  test('detects Spanish IBAN', () => {
    const results = d.scan('IBAN: ES9121000418450200051332');
    const iban = results.find((r) => r.type === 'iban_es');
    expect(iban).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// French Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('French - Identity', () => {
  const d = createDetector();

  test('detects French phone number', () => {
    const results = d.scan('Mon numéro: 06 12 34 56 78');
    const phone = results.find((r) => r.type === 'phone_fr');
    expect(phone).toBeDefined();
  });

  test('detects French phone with country code', () => {
    const results = d.scan('Tél: +33 6 12 34 56 78');
    const phone = results.find((r) => r.type === 'phone_fr');
    expect(phone).toBeDefined();
  });

  test('detects French IBAN', () => {
    const results = d.scan('IBAN: FR7630006000011234567890189');
    const iban = results.find((r) => r.type === 'iban_fr');
    expect(iban).toBeDefined();
  });

  test('detects French password keyword', () => {
    const results = d.scan('mot de passe: MonSecret123');
    const pw = results.find((r) => r.type === 'password');
    expect(pw).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Chinese Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Chinese - Identity', () => {
  const d = createDetector();

  test('detects Chinese phone number', () => {
    const results = d.scan('我的手机号 13812345678');
    const phone = results.find((r) => r.type === 'phone_cn');
    expect(phone).toBeDefined();
  });

  test('detects Chinese ID card number', () => {
    const results = d.scan('身份证号 11010519491231002X');
    const id = results.find((r) => r.type === 'id_cn');
    expect(id).toBeDefined();
    expect(id.severity).toBe('critical');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// German Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('German - Identity', () => {
  const d = createDetector();

  test('detects German Personalausweis with keyword context', () => {
    const results = d.scan('Mein Personalausweis CF65RPN24');
    const id = results.find((r) => r.type === 'personalausweis_de');
    expect(id).toBeDefined();
    expect(id.severity).toBe('critical');
  });

  test('does not detect Personalausweis without keyword', () => {
    const results = d.scan('CF65RPN24');
    const id = results.find((r) => r.type === 'personalausweis_de');
    expect(id).toBeUndefined();
  });

  test('detects German Steuer-ID with keyword', () => {
    const results = d.scan('Steuer-ID: 12345678901');
    const tax = results.find((r) => r.type === 'steuer_id_de');
    expect(tax).toBeDefined();
  });
});

describe('German - Financial', () => {
  const d = createDetector();

  test('detects German IBAN', () => {
    const results = d.scan('IBAN: DE89370400440532013000');
    const iban = results.find((r) => r.type === 'iban_de');
    expect(iban).toBeDefined();
    expect(iban.severity).toBe('critical');
  });

  test('detects Austrian IBAN', () => {
    const results = d.scan('AT611904300234573201');
    const iban = results.find((r) => r.type === 'iban_at');
    expect(iban).toBeDefined();
  });

  test('detects credit card with Luhn validation', () => {
    const results = d.scan('Kreditkarte: 4532015112830366');
    const cc = results.find((r) => r.type === 'credit_card');
    expect(cc).toBeDefined();
  });
});

describe('German - Contact', () => {
  const d = createDetector();

  test('detects German phone number', () => {
    const results = d.scan('Telefon: +49 30 123456789');
    const phone = results.find((r) => r.type === 'phone_de');
    expect(phone).toBeDefined();
  });

  test('detects German email', () => {
    const results = d.scan('E-Mail: hans@beispiel.de');
    const email = results.find((r) => r.type === 'email');
    expect(email).toBeDefined();
  });
});

describe('German - Credentials', () => {
  const d = createDetector();

  test('detects German password', () => {
    const results = d.scan('Passwort: MeinGeheim123');
    const pw = results.find((r) => r.type === 'password');
    expect(pw).toBeDefined();
    expect(pw.severity).toBe('critical');
  });

  test('detects Kennwort keyword', () => {
    const results = d.scan('Kennwort=SuperSecret!');
    const pw = results.find((r) => r.type === 'password');
    expect(pw).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Portuguese Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Portuguese - Identity', () => {
  const d = createDetector();

  test('detects valid CPF with checksum', () => {
    // 529.982.247-25 is a valid CPF
    const results = d.scan('CPF: 529.982.247-25');
    const cpf = results.find((r) => r.type === 'cpf_br');
    expect(cpf).toBeDefined();
    expect(cpf.severity).toBe('critical');
  });

  test('rejects invalid CPF (all same digits)', () => {
    const results = d.scan('CPF: 111.111.111-11');
    const cpf = results.find((r) => r.type === 'cpf_br');
    expect(cpf).toBeUndefined();
  });

  test('detects CNPJ', () => {
    const results = d.scan('CNPJ: 11.222.333/0001-81');
    const cnpj = results.find((r) => r.type === 'cnpj_br');
    expect(cnpj).toBeDefined();
  });
});

describe('Portuguese - Financial', () => {
  const d = createDetector();

  test('detects Portuguese IBAN', () => {
    const results = d.scan('IBAN: PT50000201231234567890154');
    const iban = results.find((r) => r.type === 'iban_pt');
    expect(iban).toBeDefined();
  });
});

describe('Portuguese - Contact', () => {
  const d = createDetector();

  test('detects Brazilian phone', () => {
    const results = d.scan('Telefone: +55 11 91234-5678');
    const phone = results.find((r) => r.type === 'phone_br');
    expect(phone).toBeDefined();
  });

  test('detects Portuguese phone', () => {
    const results = d.scan('Telemóvel: +351 912 345 678');
    const phone = results.find((r) => r.type === 'phone_pt');
    expect(phone).toBeDefined();
  });
});

describe('Portuguese - Credentials', () => {
  const d = createDetector();

  test('detects Portuguese password keyword', () => {
    const results = d.scan('senha: MinhaSenh@123');
    const pw = results.find((r) => r.type === 'password');
    expect(pw).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Context-Aware Detection
// ═══════════════════════════════════════════════════════════════════════════

describe('Context - Credentials', () => {
  const d = createDetector();

  test('detects password in natural sentence', () => {
    const results = d.scan('my password is SuperSecret123');
    // May match as password_context or password depending on overlap resolution
    const pw = results.find((r) => r.type === 'password_context' || r.type === 'password');
    expect(pw).toBeDefined();
    expect(pw.severity).toBe('critical');
  });

  test('detects username and password combo', () => {
    const results = d.scan('username: admin password: hunter2');
    // May match as username_password or password depending on overlap
    const pw = results.find((r) => r.type === 'username_password' || r.type === 'password');
    expect(pw).toBeDefined();
  });

  test('detects secret/API key in sentence', () => {
    const results = d.scan('my api-key is sk_live_abc123def456ghi');
    // May match as secret_context or api_key
    const secret = results.find((r) => r.type === 'secret_context' || r.type === 'api_key');
    expect(secret).toBeDefined();
  });
});

describe('Context - Identity', () => {
  const d = createDetector();

  test('detects SSN in natural sentence', () => {
    const results = d.scan('my social security number is 123-45-6789');
    // May match as ssn_context or ssn
    const ssn = results.find((r) => r.type === 'ssn_context' || r.type === 'ssn');
    expect(ssn).toBeDefined();
  });

  test('detects date of birth in sentence', () => {
    const results = d.scan('born on 01/15/1990');
    // May match as dob_context or dob
    const dob = results.find((r) => r.type === 'dob_context' || r.type === 'dob');
    expect(dob).toBeDefined();
  });
});

describe('Context - Contact', () => {
  const d = createDetector();

  test('detects phone in natural sentence', () => {
    const results = d.scan('call me at 555-123-4567');
    // May match as phone_context or phone_us
    const phone = results.find((r) => r.type === 'phone_context' || r.type === 'phone_us');
    expect(phone).toBeDefined();
  });

  test('detects email in natural sentence', () => {
    const results = d.scan('my email is john@example.com');
    // May match as email_context or email
    const email = results.find((r) => r.type === 'email_context' || r.type === 'email');
    expect(email).toBeDefined();
  });
});

describe('Context - Multilingual', () => {
  const d = createDetector();

  test('detects Arabic password in sentence', () => {
    const results = d.scan('كلمة المرور هي MyPassword99');
    const pw = results.find((r) => r.type === 'password_context_ar');
    expect(pw).toBeDefined();
  });

  test('detects Spanish password in sentence', () => {
    const results = d.scan('mi contraseña es ClaveSecreta');
    const pw = results.find((r) => r.type === 'password_context_es');
    expect(pw).toBeDefined();
  });

  test('detects Chinese password in sentence', () => {
    const results = d.scan('我的密码是 abc12345');
    const pw = results.find((r) => r.type === 'password_context_zh');
    expect(pw).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cross-Language Collision Prevention
// ═══════════════════════════════════════════════════════════════════════════

describe('Cross-Language - No false positives', () => {
  const d = createDetector();

  test('German IBAN does not trigger French patterns', () => {
    const results = d.scan('DE89370400440532013000');
    const types = results.map((r) => r.type);
    expect(types).not.toContain('iban_fr');
  });

  test('Chinese phone does not trigger German phone', () => {
    const results = d.scan('13812345678');
    const dePhone = results.find((r) => r.type === 'phone_de');
    expect(dePhone).toBeUndefined();
  });

  test('Portuguese IBAN does not trigger other IBAN patterns', () => {
    const results = d.scan('PT50000201231234567890154');
    const deIban = results.find((r) => r.type === 'iban_de');
    expect(deIban).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Core Detector Features
// ═══════════════════════════════════════════════════════════════════════════

describe('Core - Scan', () => {
  const d = createDetector();

  test('returns empty array for empty text', () => {
    expect(d.scan('')).toEqual([]);
    expect(d.scan(null)).toEqual([]);
    expect(d.scan('   ')).toEqual([]);
  });

  test('returns empty array when paused', () => {
    d.updateSettings({ isPaused: true });
    const results = d.scan('My SSN is 123-45-6789');
    expect(results).toEqual([]);
    d.updateSettings({ isPaused: false });
  });

  test('detections are sorted by index', () => {
    const results = d.scan('Email: test@test.com SSN: 123-45-6789');
    if (results.length >= 2) {
      for (let i = 1; i < results.length; i++) {
        expect(results[i].index).toBeGreaterThanOrEqual(results[i - 1].index);
      }
    }
  });

  test('multiple PII types in one text', () => {
    const text = 'My email is john@test.com and my card is 4532015112830366';
    const results = d.scan(text);
    const types = results.map((r) => r.type);
    expect(types).toContain('email');
    expect(types).toContain('credit_card');
  });
});

describe('Core - Redact & Unmask', () => {
  const d = createDetector();

  test('redacts detected PII with tokens', () => {
    const text = 'Email: john@test.com';
    const detections = d.scan(text);
    const { text: redacted, map } = d.redact(text, detections);

    expect(redacted).not.toContain('john@test.com');
    expect(redacted).toMatch(/\[EMAIL_\d+\]/);
    expect(map.size).toBeGreaterThan(0);
  });

  test('unmask restores original text', () => {
    const text = 'Email: john@test.com';
    const detections = d.scan(text);
    const { text: redacted, map } = d.redact(text, detections);
    const restored = d.unmask(redacted, map);

    expect(restored).toBe(text);
  });

  test('redact returns original text when no detections', () => {
    const { text } = d.redact('Hello world', []);
    expect(text).toBe('Hello world');
  });
});

describe('Core - Masking', () => {
  const d = createDetector();

  test('masks email correctly', () => {
    const result = d._mask('john@example.com', 'email');
    expect(result).toBe('j***@example.com');
  });

  test('masks credit card correctly', () => {
    const result = d._mask('4532-0151-1283-0366', 'credit_card');
    expect(result).toBe('****-****-****-0366');
  });

  test('masks password as dots', () => {
    const result = d._mask('mypassword', 'password');
    expect(result).toBe('••••••••');
  });
});

describe('Core - Severity', () => {
  const d = createDetector();

  test('highestSeverity returns correct level', () => {
    expect(d.highestSeverity([{ severity: 'low' }, { severity: 'critical' }])).toBe('critical');
    expect(d.highestSeverity([{ severity: 'medium' }, { severity: 'low' }])).toBe('medium');
    expect(d.highestSeverity([{ severity: 'low' }])).toBe('low');
  });

  test('summarize counts correctly', () => {
    const detections = [
      { severity: 'critical', type: 'ssn' },
      { severity: 'critical', type: 'credit_card' },
      { severity: 'high', type: 'email' },
    ];
    const summary = d.summarize(detections);
    expect(summary.total).toBe(3);
    expect(summary.critical).toBe(2);
    expect(summary.high).toBe(1);
  });
});

describe('Core - Settings', () => {
  test('sensitivity filtering works', () => {
    const d = createDetector();
    d.updateSettings({ sensitivity: 'high' });

    const text = 'Email: test@example.com SSN: 123-45-6789';
    const highResults = d.scan(text);

    d.updateSettings({ sensitivity: 'low' });
    const lowResults = d.scan(text);

    // With low sensitivity, only critical items should be detected
    expect(lowResults.length).toBeLessThanOrEqual(highResults.length);
  });

  test('allowlist excludes matched values', () => {
    const d = createDetector();
    d.updateSettings({ allowlist: ['test@example.com'] });

    const results = d.scan('Email: test@example.com');
    const email = results.find((r) => r.type === 'email');
    expect(email).toBeUndefined();
  });

  test('language disabling works', () => {
    const d = createDetector();
    d.updateSettings({ enabledLanguages: new Set(['en']) });

    // Arabic patterns should be disabled
    const results = d.scan('جوالي 0512345678');
    const phone = results.find((r) => r.type === 'phone_sa');
    expect(phone).toBeUndefined();
  });

  test('category disabling works', () => {
    const d = createDetector();
    d.updateSettings({ enabledCategories: new Set(['identity']) });

    // Financial should be disabled
    const results = d.scan('Card: 4532015112830366');
    const cc = results.find((r) => r.type === 'credit_card');
    expect(cc).toBeUndefined();
  });
});

describe('Core - Overlap Prevention', () => {
  const d = createDetector();

  test('does not produce overlapping detections', () => {
    const text = 'Contact: john.doe@example.com for more info';
    const results = d.scan(text);

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i];
        const b = results[j];
        const overlaps = a.index < b.index + b.length && b.index < a.index + a.length;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe('Core - CSV Export', () => {
  const d = createDetector();

  test('exports valid CSV', () => {
    const log = [
      { timestamp: 1709750400000, platform: 'ChatGPT', count: 3, severity: 'high', types: ['email', 'ssn'] },
    ];
    const csv = d.exportLogCSV(log);
    expect(csv).toContain('Timestamp,Platform,Count,Severity,Types');
    expect(csv).toContain('ChatGPT');
    expect(csv).toContain('email, ssn');
  });
});
