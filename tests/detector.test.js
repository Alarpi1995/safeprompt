const { SafePromptDetector } = require('../src/core/detector');
const { SafePromptEN } = require('../src/languages/en');
const { SafePromptAR } = require('../src/languages/ar');
const { SafePromptES } = require('../src/languages/es');
const { SafePromptFR } = require('../src/languages/fr');
const { SafePromptZH } = require('../src/languages/zh');
const { SafePromptDE } = require('../src/languages/de');
const { SafePromptPT } = require('../src/languages/pt');
const { SafePromptTR } = require('../src/languages/tr');
const { SafePromptHI } = require('../src/languages/hi');
const { SafePromptKO } = require('../src/languages/ko');
const { SafePromptJA } = require('../src/languages/ja');
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
  d.registerLanguage('tr', SafePromptTR);
  d.registerLanguage('hi', SafePromptHI);
  d.registerLanguage('ko', SafePromptKO);
  d.registerLanguage('ja', SafePromptJA);
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
      { timestamp: 1709750400000, platform: 'ChatGPT', count: 3, severity: 'high', score: 64, profile: 'developer', policyPack: 'internal_ops', types: ['email', 'ssn'] },
    ];
    const csv = d.exportLogCSV(log);
    expect(csv).toContain('Timestamp,Platform,Count,Severity,Score,Profile,PolicyPack,Source,Types');
    expect(csv).toContain('ChatGPT');
    expect(csv).toContain('developer');
    expect(csv).toContain('internal_ops');
    expect(csv).toContain('email, ssn');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// New Patterns - v1.1
// ═══════════════════════════════════════════════════════════════════════════

describe('English - Crypto', () => {
  const d = createDetector();

  test('detects Bitcoin address', () => {
    const results = d.scan('Send to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    const btc = results.find((r) => r.type === 'bitcoin_address');
    expect(btc).toBeDefined();
  });

  test('detects Ethereum address', () => {
    const results = d.scan('ETH: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
    const eth = results.find((r) => r.type === 'ethereum_address');
    expect(eth).toBeDefined();
  });
});

describe('English - Network Extended', () => {
  const d = createDetector();

  test('detects IPv6 address', () => {
    const results = d.scan('Server: 2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    const ipv6 = results.find((r) => r.type === 'ipv6');
    expect(ipv6).toBeDefined();
  });

  test('skips localhost IPv4', () => {
    const results = d.scan('localhost: 127.0.0.1');
    const ip = results.find((r) => r.type === 'ipv4');
    expect(ip).toBeUndefined();
  });
});

describe('English - Location', () => {
  const d = createDetector();

  test('detects GPS coordinates', () => {
    const results = d.scan('Location: 37.7749, -122.4194');
    const gps = results.find((r) => r.type === 'gps_coordinates');
    expect(gps).toBeDefined();
  });
});

describe('English - Medical/Insurance', () => {
  const d = createDetector();

  test('detects medical record number', () => {
    const results = d.scan('MRN: AB12345678');
    const mrn = results.find((r) => r.type === 'mrn');
    expect(mrn).toBeDefined();
  });

  test('detects NPI number', () => {
    const results = d.scan('NPI: 1234567890');
    const npi = results.find((r) => r.type === 'npi');
    expect(npi).toBeDefined();
  });

  test('detects insurance policy number', () => {
    const results = d.scan('policy number: ABC-123456789');
    const ins = results.find((r) => r.type === 'insurance_id');
    expect(ins).toBeDefined();
  });
});

describe('English - URLs with PII', () => {
  const d = createDetector();

  test('detects PII inside URL with email parameter', () => {
    const results = d.scan('Link: https://example.com/form?email=john@test.com&ref=123');
    // The email inside URL is detected (either as url_pii or email)
    const pii = results.find((r) => r.type === 'url_pii' || r.type === 'email');
    expect(pii).toBeDefined();
  });

  test('detects URL with session token parameter', () => {
    const results = d.scan('https://api.site.com/auth?session=abc123def456ghi789jkl');
    const url = results.find((r) => r.type === 'url_pii');
    expect(url).toBeDefined();
  });
});

describe('English - Social Media', () => {
  const d = createDetector();

  test('detects social handle with context', () => {
    const results = d.scan('follow me on twitter @johndoe123');
    const handle = results.find((r) => r.type === 'social_handle');
    expect(handle).toBeDefined();
  });

  test('does not detect social handle without context', () => {
    const results = d.scan('use @override annotation');
    const handle = results.find((r) => r.type === 'social_handle');
    expect(handle).toBeUndefined();
  });
});

describe('Arabic - Vehicle', () => {
  const d = createDetector();

  test('detects Saudi plate with context', () => {
    const results = d.scan('رقم اللوحة ABC 1234');
    const plate = results.find((r) => r.type === 'plate_sa');
    expect(plate).toBeDefined();
  });
});

describe('Names Dictionary', () => {
  const { SafePromptNames } = require('../src/core/names-dictionary');

  test('builds English pattern', () => {
    const pat = SafePromptNames.buildPattern('en');
    expect(pat).toBeDefined();
    expect(pat).toContain('James');
    expect(pat).toContain('Mary');
  });

  test('builds Arabic pattern', () => {
    const pat = SafePromptNames.buildPattern('ar');
    expect(pat).toBeDefined();
    expect(pat).toContain('محمد');
    expect(pat).toContain('فاطمة');
  });

  test('detects English name via dictionary', () => {
    const d = createDetector();
    const names = require('../src/core/names-dictionary').SafePromptNames;
    const pat = names.buildPattern('en');
    d.registerLanguage('names_en', {
      code: 'names_en', name: 'EN Names', nativeName: 'EN Names',
      patterns: { names: [{ type: 'name_dict_en', label: 'Name', pattern: pat, flags: 'g', severity: 'high' }] },
    });
    const results = d.scan('Please contact Jennifer about the project');
    const name = results.find((r) => r.type === 'name_dict_en');
    expect(name).toBeDefined();
    expect(name.value).toBe('Jennifer');
  });

  test('detects Arabic name via dictionary', () => {
    const d = createDetector();
    const names = require('../src/core/names-dictionary').SafePromptNames;
    const pat = names.buildPattern('ar');
    d.registerLanguage('names_ar', {
      code: 'names_ar', name: 'AR Names', nativeName: 'AR Names',
      patterns: { names: [{ type: 'name_dict_ar', label: 'Name', pattern: '(?:' + pat + ')', flags: 'g', severity: 'high' }] },
    });
    const results = d.scan('تواصل مع فاطمة بخصوص الطلب');
    const name = results.find((r) => r.type === 'name_dict_ar');
    expect(name).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Turkish Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Turkish - Identity', () => {
  const d = createDetector();

  test('detects Turkish IBAN', () => {
    const results = d.scan('IBAN: TR330006100519786457841326');
    const iban = results.find((r) => r.type === 'iban_tr');
    expect(iban).toBeDefined();
  });

  test('detects Turkish phone number', () => {
    const results = d.scan('cep telefonu +90 532 123 45 67');
    const phone = results.find((r) => r.type === 'phone_tr');
    expect(phone).toBeDefined();
  });

  test('detects Turkish password', () => {
    const results = d.scan('sifre: MySecretPass123');
    const pw = results.find((r) => r.type === 'password');
    expect(pw).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Hindi/Indian Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Hindi - Identity', () => {
  const d = createDetector();

  test('detects Aadhaar number with context', () => {
    const results = d.scan('aadhaar number 2345 6789 0123');
    const aadhaar = results.find((r) => r.type === 'aadhaar_in');
    expect(aadhaar).toBeDefined();
  });

  test('detects PAN card number', () => {
    const results = d.scan('PAN card ABCPD1234E');
    const pan = results.find((r) => r.type === 'pan_in');
    expect(pan).toBeDefined();
  });

  test('detects Indian phone number', () => {
    const results = d.scan('mobile +91 98765 43210');
    const phone = results.find((r) => r.type === 'phone_in');
    expect(phone).toBeDefined();
  });

  test('detects IFSC code', () => {
    const results = d.scan('IFSC: SBIN0001234');
    const ifsc = results.find((r) => r.type === 'ifsc_in');
    expect(ifsc).toBeDefined();
  });

  test('detects GSTIN', () => {
    const results = d.scan('GST: 22AAAAA0000A1Z5');
    const gst = results.find((r) => r.type === 'gst_in');
    expect(gst).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Korean Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Korean - Identity', () => {
  const d = createDetector();

  test('detects Korean drivers license', () => {
    const results = d.scan('license 11-22-333333-44');
    const dl = results.find((r) => r.type === 'drivers_license_kr');
    expect(dl).toBeDefined();
  });

  test('detects Korean phone number', () => {
    const results = d.scan('call +82 10-1234-5678');
    const phone = results.find((r) => r.type === 'phone_kr');
    expect(phone).toBeDefined();
  });

  test('detects Korean business registration number', () => {
    const results = d.scan('business registration 123-45-67890');
    const brn = results.find((r) => r.type === 'brn_kr');
    expect(brn).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Japanese Patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Japanese - Identity', () => {
  const d = createDetector();

  test('detects Zairyu card number', () => {
    const results = d.scan('zairyu AB12345678CD');
    const zairyu = results.find((r) => r.type === 'zairyu_card_jp');
    expect(zairyu).toBeDefined();
  });

  test('detects Japanese phone number', () => {
    const results = d.scan('phone: +81 90-1234-5678');
    const phone = results.find((r) => r.type === 'phone_jp');
    expect(phone).toBeDefined();
  });

  test('detects Japanese postal code with context', () => {
    const results = d.scan('postal code 100-0001');
    const postal = results.find((r) => r.type === 'postal_code_jp');
    expect(postal).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Names Dictionary - New Languages
// ═══════════════════════════════════════════════════════════════════════════

describe('Names Dictionary - New Languages', () => {
  const { SafePromptNames } = require('../src/core/names-dictionary');

  test('builds Turkish pattern', () => {
    const pat = SafePromptNames.buildPattern('tr');
    expect(pat).toBeDefined();
    expect(pat).toContain('Mehmet');
  });

  test('builds Hindi pattern', () => {
    const pat = SafePromptNames.buildPattern('hi');
    expect(pat).toBeDefined();
    expect(pat).toContain('Rahul');
  });

  test('builds Korean pattern', () => {
    const pat = SafePromptNames.buildPattern('ko');
    expect(pat).toBeDefined();
    expect(pat).toContain('Minjun');
  });

  test('builds Japanese pattern', () => {
    const pat = SafePromptNames.buildPattern('ja');
    expect(pat).toBeDefined();
    expect(pat).toContain('Haruto');
  });
});

describe('Language filtering', () => {
  const { SafePromptNames } = require('../src/core/names-dictionary');

  function registerEnglishNames(detector) {
    detector.registerLanguage('names_en', {
      code: 'names_en',
      name: 'English Names',
      nativeName: 'English Names Dictionary',
      patterns: {
        names: [{
          type: 'name_dict_en',
          label: 'Personal Name (English)',
          pattern: SafePromptNames.buildPattern('en'),
          flags: 'g',
          severity: 'high',
        }],
      },
    });
  }

  test('keeps dictionary names active when the base language is enabled', () => {
    const d = new SafePromptDetector();
    d.settings.enabledLanguages = new Set(['en']);
    registerEnglishNames(d);

    const results = d.scan('James shared his draft');
    const name = results.find((r) => r.type === 'name_dict_en');

    expect(name).toBeDefined();
    expect(name.value).toBe('James');
  });

  test('disables dictionary names when the base language is disabled', () => {
    const d = new SafePromptDetector();
    d.settings.enabledLanguages = new Set(['ar']);
    registerEnglishNames(d);

    const results = d.scan('James shared his draft');
    const name = results.find((r) => r.type === 'name_dict_en');

    expect(name).toBeUndefined();
  });
});

describe('Privacy analysis features', () => {
  test('applies developer profile with higher sensitivity and focused categories', () => {
    const d = new SafePromptDetector();
    const profile = d.applyProfile('developer');

    expect(profile.id).toBe('developer');
    expect(d.settings.profile).toBe('developer');
    expect(d.settings.sensitivity).toBe('high');
    expect(d.settings.enabledCategories.has('credentials')).toBe(true);
    expect(d.settings.enabledCategories.has('network')).toBe(true);
  });

  test('rewrites sensitive values into readable local placeholders', () => {
    const d = createDetector();
    const text = 'Contact me at john.doe@example.com and use password = "superSecret123"';
    const detections = d.scan(text);
    const rewritten = d.rewriteSafely(text, detections);

    expect(rewritten.text).toContain('[redacted email address]');
    expect(rewritten.text).toContain('[redacted password]');
    expect(rewritten.text).not.toContain('john.doe@example.com');
  });

  test('computes a high privacy score for mixed critical detections', () => {
    const d = createDetector();
    const text = 'My SSN is 123-45-6789 and my AWS key is AKIAIOSFODNN7EXAMPLE';
    const analysis = d.analyzeText(text);

    expect(analysis.score).toBeGreaterThanOrEqual(55);
    expect(['high', 'critical']).toContain(analysis.level);
    expect(['rewrite', 'block']).toContain(analysis.recommendedAction);
    expect(analysis.reasons.length).toBeGreaterThan(0);
    expect(analysis.simulator.narrative).toContain('plain text');
  });

  test('returns zero score for clean text', () => {
    const d = createDetector();
    const analysis = d.analyzeText('Summarize this product roadmap without personal data.');

    expect(analysis.score).toBe(0);
    expect(analysis.level).toBe('safe');
    expect(analysis.recommendedAction).toBe('allow');
  });
});



describe('Local protection workflows', () => {
  test('detects protected terms from the active policy pack', () => {
    const d = createDetector();
    d.settings.policyPack = 'enterprise_strict';
    d.settings.protectedTerms = ['AcmeClient'];

    const detections = d.scan('Share the AcmeClient pricing memo with the assistant.');
    const match = detections.find((entry) => entry.type === 'policy_term');

    expect(match).toBeDefined();
    expect(match.severity).toBe('critical');
    expect(match.policyPack).toBe('enterprise_strict');
  });

  test('re-surfaces repeated sensitive values through conversation memory guard', async () => {
    const d = createDetector();
    const text = 'Email me at john.doe@example.com';
    const detections = d.scan(text);

    await d.rememberDetections('ChatGPT', detections, 'rewrite');
    const analysis = d.analyzeText(text, { platform: 'ChatGPT' });

    expect(analysis.memoryMatches.length).toBeGreaterThan(0);
    expect(analysis.reasons.join(' ')).toContain('Conversation Memory Guard');
  });

  test('suppresses a trained false positive locally', async () => {
    const d = createDetector();
    const text = 'Contact me at john.doe@example.com';
    const initial = d.scan(text);

    await d.trainFalsePositive([initial[0]]);
    const rescanned = d.scan(text);

    expect(initial.length).toBeGreaterThan(0);
    expect(rescanned.find((entry) => entry.type === initial[0].type)).toBeUndefined();
    expect(d.getFalsePositiveRuleCount()).toBe(1);
  });
});

describe('Policy pack JSON workflows', () => {
  test('exports policy pack settings as JSON-ready config', () => {
    const d = createDetector();
    d.settings.policyPack = 'internal_ops';
    d.settings.protectedTerms = ['AcmeClient', 'Project Falcon', 'AcmeClient'];

    const exported = d.exportPolicyPackConfig();

    expect(exported.version).toBe(1);
    expect(exported.policyPack).toBe('internal_ops');
    expect(exported.protectedTerms).toEqual(['AcmeClient', 'Project Falcon']);
    expect(typeof exported.exportedAt).toBe('string');
  });

  test('imports policy pack settings from JSON payload', async () => {
    const d = createDetector();

    const result = await d.importPolicyPackConfig({
      policyPack: 'enterprise_strict',
      protectedTerms: ['TopSecret', 'AcmeClient'],
    });

    expect(d.settings.policyPack).toBe('enterprise_strict');
    expect(d.settings.protectedTerms).toEqual(['TopSecret', 'AcmeClient']);
    expect(result.policyPack.id).toBe('enterprise_strict');
  });
});
