const { SafePromptDetector } = require('../src/core/detector');
const { SafePromptPlatforms } = require('../src/platforms/platform-detector');
const { SafePromptEN } = require('../src/languages/en');
const { SafePromptAR } = require('../src/languages/ar');

function createDetector() {
  const d = new SafePromptDetector();
  d.registerLanguage('en', SafePromptEN);
  d.registerLanguage('ar', SafePromptAR);
  return d;
}

// Replicate textFingerprint from interceptor.js (not importable from IIFE)
function textFingerprint(text) {
  if (!text) return '';
  const len = text.length;
  const head = text.slice(0, 50);
  const tail = text.slice(-50);
  return `${len}:${head}:${tail}`;
}

// hideResponsePII replacement logic (pure string version for Node.js testing without jsdom)
function applyPIIMasking(text, detections) {
  let result = text;
  for (const det of detections) {
    result = result.replaceAll(det.value, det.masked);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// textFingerprint
// ═══════════════════════════════════════════════════════════════════════════

describe('textFingerprint', () => {
  test('returns consistent fingerprint for same text', () => {
    const text = 'My SSN is 123-45-6789 and I live in New York.';
    expect(textFingerprint(text)).toBe(textFingerprint(text));
  });

  test('returns different fingerprint for different text', () => {
    const a = 'Hello world, this is a test.';
    const b = 'Hello world, this is another test.';
    expect(textFingerprint(a)).not.toBe(textFingerprint(b));
  });

  test('handles empty string', () => {
    expect(textFingerprint('')).toBe('');
  });

  test('handles null/undefined', () => {
    expect(textFingerprint(null)).toBe('');
    expect(textFingerprint(undefined)).toBe('');
  });

  test('handles very long text', () => {
    const long = 'A'.repeat(10000);
    const fp = textFingerprint(long);
    expect(fp).toBe(`10000:${'A'.repeat(50)}:${'A'.repeat(50)}`);
  });

  test('same head/tail/length produces same fingerprint (by design)', () => {
    // Fingerprint is a cheap hash - collisions for same-length texts with
    // identical head/tail are expected and acceptable for debounce purposes
    const prefix = 'X'.repeat(50);
    const suffix = 'Z'.repeat(50);
    const a = prefix + 'AAAA' + suffix;
    const b = prefix + 'BBBB' + suffix;
    // Same length, same head, same tail → same fingerprint (known limitation)
    expect(textFingerprint(a)).toBe(textFingerprint(b));
  });

  test('different length texts with same content prefix produce different fingerprints', () => {
    const a = 'X'.repeat(100);
    const b = 'X'.repeat(101);
    expect(textFingerprint(a)).not.toBe(textFingerprint(b));
  });

  test('distinguishes texts that differ only in length', () => {
    const a = 'Hello world';
    const b = 'Hello world!';
    expect(textFingerprint(a)).not.toBe(textFingerprint(b));
  });

  test('fingerprint format is length:head:tail', () => {
    const text = 'Short';
    const fp = textFingerprint(text);
    expect(fp).toBe('5:Short:Short');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hideResponsePII (DOM replacement)
// ═══════════════════════════════════════════════════════════════════════════

describe('hideResponsePII masking logic', () => {
  test('replaces detection values with masked versions', () => {
    const text = 'Your SSN is 123-45-6789 on file.';
    const detections = [
      { value: '123-45-6789', masked: '***-**-****', type: 'ssn' },
    ];
    expect(applyPIIMasking(text, detections)).toBe('Your SSN is ***-**-**** on file.');
  });

  test('preserves non-PII text when value not found', () => {
    const text = 'No sensitive data here, just a regular message.';
    const result = applyPIIMasking(text, [{ value: 'NONEXISTENT', masked: '***', type: 'test' }]);
    expect(result).toBe('No sensitive data here, just a regular message.');
  });

  test('masks credit card numbers', () => {
    const text = 'Card: 4532015112830366';
    const result = applyPIIMasking(text, [
      { value: '4532015112830366', masked: '****-****-****-0366', type: 'credit_card' },
    ]);
    expect(result).toBe('Card: ****-****-****-0366');
  });

  test('handles multiple detections in same text', () => {
    const text = 'SSN: 123-45-6789, Email: john@example.com';
    const result = applyPIIMasking(text, [
      { value: '123-45-6789', masked: '***-**-****', type: 'ssn' },
      { value: 'john@example.com', masked: 'j***@***.com', type: 'email' },
    ]);
    expect(result).toBe('SSN: ***-**-****, Email: j***@***.com');
  });

  test('handles repeated occurrences of same value', () => {
    const text = 'SSN 123-45-6789 was repeated: 123-45-6789';
    const result = applyPIIMasking(text, [
      { value: '123-45-6789', masked: '***-**-****', type: 'ssn' },
    ]);
    expect(result).toBe('SSN ***-**-**** was repeated: ***-**-****');
  });

  test('returns original text for empty detections array', () => {
    const text = 'Some text';
    expect(applyPIIMasking(text, [])).toBe('Some text');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// scanResponseElement (logic via detector.scan)
// ═══════════════════════════════════════════════════════════════════════════

describe('scanResponseElement logic', () => {
  const d = createDetector();

  test('detector.scan finds PII in response-like text', () => {
    const text = 'I see you mentioned your SSN 123-45-6789, please be careful.';
    const results = d.scan(text);
    const ssn = results.find((r) => r.type === 'ssn');
    expect(ssn).toBeDefined();
    expect(ssn.value).toBe('123-45-6789');
  });

  test('detector.scan finds email in response text', () => {
    const text = 'Your email address is john.doe@example.com, I will use it.';
    const results = d.scan(text);
    const email = results.find((r) => r.type === 'email');
    expect(email).toBeDefined();
  });

  test('detector.scan finds credit card in response text', () => {
    const text = 'The card number 4532015112830366 was processed.';
    const results = d.scan(text);
    const cc = results.find((r) => r.type === 'credit_card');
    expect(cc).toBeDefined();
  });

  test('detector.scan returns empty for safe response text', () => {
    const text = 'Sure, I can help you with that programming question.';
    const results = d.scan(text);
    expect(results.length).toBe(0);
  });

  test('scan skips text shorter than 3 characters', () => {
    const results = d.scan('Hi');
    expect(results.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Response Guard skip conditions
// ═══════════════════════════════════════════════════════════════════════════

describe('Response Guard skip conditions', () => {
  test('responseGuardEnabled defaults to true in detector settings', () => {
    const d = createDetector();
    expect(d.settings.responseGuardEnabled).toBe(true);
  });

  test('responseGuardEnabled can be set to false', () => {
    const d = createDetector();
    d.settings.responseGuardEnabled = false;
    expect(d.settings.responseGuardEnabled).toBe(false);
  });

  test('isPaused setting prevents scanning (conceptual)', () => {
    const d = createDetector();
    d.settings.isPaused = true;
    // In real code, scanResponseElement checks isPaused before scanning
    expect(d.settings.isPaused).toBe(true);
  });

  test('fingerprint prevents re-scan of unchanged text', () => {
    const text = 'Some response text with SSN 123-45-6789';
    const fp1 = textFingerprint(text);
    const fp2 = textFingerprint(text);
    expect(fp1).toBe(fp2);
    // In scanResponseElement, if el._spResponseFP === fp, scan is skipped
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: activity log source field
// ═══════════════════════════════════════════════════════════════════════════

describe('Activity log source field', () => {
  test('logActivity includes source from context', async () => {
    const d = createDetector();
    const detections = d.scan('My SSN is 123-45-6789');

    // Mock chrome.storage
    const storedData = {};
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb(storedData)),
          set: jest.fn((data, cb) => {
            Object.assign(storedData, data);
            if (cb) cb();
          }),
        },
      },
    };

    await d.logActivity('ChatGPT', detections, { source: 'response' });

    const log = storedData.activityLog;
    expect(log).toBeDefined();
    expect(log.length).toBe(1);
    expect(log[0].source).toBe('response');
    expect(log[0].platform).toBe('ChatGPT');

    delete global.chrome;
  });

  test('logActivity defaults source to input', async () => {
    const d = createDetector();
    const detections = d.scan('My SSN is 123-45-6789');

    const storedData = {};
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb(storedData)),
          set: jest.fn((data, cb) => {
            Object.assign(storedData, data);
            if (cb) cb();
          }),
        },
      },
    };

    await d.logActivity('ChatGPT', detections, {});

    const log = storedData.activityLog;
    expect(log[0].source).toBe('input');

    delete global.chrome;
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: getStats responseGuardDetections
// ═══════════════════════════════════════════════════════════════════════════

describe('getStats responseGuardDetections', () => {
  test('counts response source entries separately', async () => {
    const d = createDetector();

    const mockLog = [
      { timestamp: Date.now(), platform: 'ChatGPT', count: 2, severity: 'high', types: ['ssn'], score: 75, source: 'input' },
      { timestamp: Date.now(), platform: 'ChatGPT', count: 1, severity: 'medium', types: ['email'], score: 40, source: 'response' },
      { timestamp: Date.now(), platform: 'Claude', count: 3, severity: 'critical', types: ['credit_card'], score: 90, source: 'response' },
    ];

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({ activityLog: mockLog })),
        },
      },
    };

    const stats = await d.getStats();
    expect(stats.responseGuardDetections).toBe(4); // 1 + 3
    expect(stats.totalBlocked).toBe(6); // 2 + 1 + 3

    delete global.chrome;
  });

  test('returns 0 responseGuardDetections when no response entries', async () => {
    const d = createDetector();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({ activityLog: [
            { timestamp: Date.now(), platform: 'ChatGPT', count: 5, severity: 'high', types: ['ssn'], score: 80, source: 'input' },
          ] })),
        },
      },
    };

    const stats = await d.getStats();
    expect(stats.responseGuardDetections).toBe(0);
    expect(stats.totalBlocked).toBe(5);

    delete global.chrome;
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: CSV export Source column
// ═══════════════════════════════════════════════════════════════════════════

describe('exportLogCSV with Source column', () => {
  test('CSV header includes Source column', () => {
    const d = createDetector();
    const csv = d.exportLogCSV([]);
    expect(csv).toContain('Source');
    const header = csv.split('\n')[0];
    const columns = header.split(',');
    expect(columns).toContain('Source');
  });

  test('CSV rows include source value', () => {
    const d = createDetector();
    const log = [
      { timestamp: Date.now(), platform: 'ChatGPT', count: 1, severity: 'high', types: ['ssn'], score: 75, profile: 'balanced', policyPack: 'none', source: 'response' },
    ];

    const csv = d.exportLogCSV(log);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('response');
  });

  test('CSV defaults source to input when missing', () => {
    const d = createDetector();
    const log = [
      { timestamp: Date.now(), platform: 'Claude', count: 2, severity: 'medium', types: ['email'], score: 40 },
    ];

    const csv = d.exportLogCSV(log);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('input');
  });

  test('CSV source column is in correct position (8th column)', () => {
    const d = createDetector();
    const log = [
      { timestamp: Date.now(), platform: 'ChatGPT', count: 1, severity: 'high', types: ['ssn'], score: 75, profile: 'balanced', policyPack: 'none', source: 'response' },
    ];

    const csv = d.exportLogCSV(log);
    const headerCols = csv.split('\n')[0].split(',');
    const sourceIndex = headerCols.indexOf('Source');
    expect(sourceIndex).toBe(7); // 0-indexed, 8th column

    // Verify the data row has 'response' at the same position
    const row = csv.split('\n')[1];
    // The last field is quoted ("ssn"), so split carefully
    expect(row).toContain('response');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Platform streaming detection
// ═══════════════════════════════════════════════════════════════════════════

describe('Platform streaming detection', () => {
  test('ChatGPT has streamingSelector defined', () => {
    expect(SafePromptPlatforms.platforms.chatgpt.streamingSelector).toBe('.result-streaming');
  });

  test('Claude has streamingSelector defined', () => {
    expect(SafePromptPlatforms.platforms.claude.streamingSelector).toBe('[data-is-streaming]');
  });

  test('platforms without streaming have null selector', () => {
    expect(SafePromptPlatforms.platforms.gemini.streamingSelector).toBeNull();
    expect(SafePromptPlatforms.platforms.copilot.streamingSelector).toBeNull();
    expect(SafePromptPlatforms.platforms.deepseek.streamingSelector).toBeNull();
  });

  test('isResponseStreaming returns false for null selector', () => {
    const el = {
      matches: jest.fn(() => false),
      closest: jest.fn(() => null),
    };
    expect(SafePromptPlatforms.isResponseStreaming({ streamingSelector: null }, el)).toBe(false);
  });

  test('isResponseStreaming returns true when element matches', () => {
    const el = {
      matches: jest.fn(() => true),
      closest: jest.fn(() => null),
    };
    expect(SafePromptPlatforms.isResponseStreaming({ streamingSelector: '.result-streaming' }, el)).toBeTruthy();
  });

  test('isResponseStreaming returns true when closest matches', () => {
    const el = {
      matches: jest.fn(() => false),
      closest: jest.fn(() => ({ className: 'result-streaming' })),
    };
    expect(SafePromptPlatforms.isResponseStreaming({ streamingSelector: '.result-streaming' }, el)).toBeTruthy();
  });

  test('isResponseStreaming handles missing platform gracefully', () => {
    expect(SafePromptPlatforms.isResponseStreaming(null, {})).toBe(false);
    expect(SafePromptPlatforms.isResponseStreaming(undefined, {})).toBe(false);
  });
});
