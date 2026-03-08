/**
 * SafePrompt - File Scanner Tests
 */

const { SafePromptFileScanner } = require('../src/core/file-scanner.js');

describe('SafePromptFileScanner', () => {
  describe('canScan', () => {
    test('accepts text files', () => {
      expect(SafePromptFileScanner.canScan({ name: 'test.txt', type: 'text/plain', size: 100 })).toBe(true);
      expect(SafePromptFileScanner.canScan({ name: 'data.csv', type: 'text/csv', size: 100 })).toBe(true);
      expect(SafePromptFileScanner.canScan({ name: 'config.json', type: 'application/json', size: 100 })).toBe(true);
      expect(SafePromptFileScanner.canScan({ name: 'readme.md', type: 'text/markdown', size: 100 })).toBe(true);
      expect(SafePromptFileScanner.canScan({ name: 'debug.log', type: '', size: 100 })).toBe(true);
    });

    test('accepts docx files', () => {
      expect(SafePromptFileScanner.canScan({
        name: 'document.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 100,
      })).toBe(true);
    });

    test('accepts pdf files', () => {
      expect(SafePromptFileScanner.canScan({ name: 'report.pdf', type: 'application/pdf', size: 100 })).toBe(true);
    });

    test('rejects unsupported files', () => {
      expect(SafePromptFileScanner.canScan({ name: 'image.png', type: 'image/png', size: 100 })).toBe(false);
      expect(SafePromptFileScanner.canScan({ name: 'video.mp4', type: 'video/mp4', size: 100 })).toBe(false);
      expect(SafePromptFileScanner.canScan({ name: 'archive.zip', type: 'application/zip', size: 100 })).toBe(false);
    });

    test('rejects files over size limit', () => {
      expect(SafePromptFileScanner.canScan({ name: 'large.txt', type: 'text/plain', size: 11 * 1024 * 1024 })).toBe(false);
    });

    test('rejects null/undefined', () => {
      expect(SafePromptFileScanner.canScan(null)).toBe(false);
      expect(SafePromptFileScanner.canScan(undefined)).toBe(false);
      expect(SafePromptFileScanner.canScan({})).toBe(false);
    });
  });

  describe('getSupportedFormats', () => {
    test('returns human-readable format list', () => {
      const formats = SafePromptFileScanner.getSupportedFormats();
      expect(formats).toContain('.txt');
      expect(formats).toContain('.csv');
      expect(formats).toContain('.docx');
      expect(formats).toContain('.pdf');
    });
  });

  describe('_stripXmlToText', () => {
    test('extracts text from DOCX XML', () => {
      const xml = '<w:p><w:r><w:t>Hello World</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p>';
      const text = SafePromptFileScanner._stripXmlToText(xml);
      expect(text).toContain('Hello World');
      expect(text).toContain('Second paragraph');
    });

    test('handles XML entities', () => {
      const xml = '<w:r><w:t>Tom &amp; Jerry &lt;email@test.com&gt;</w:t></w:r>';
      const text = SafePromptFileScanner._stripXmlToText(xml);
      expect(text).toContain('Tom & Jerry');
      expect(text).toContain('<email@test.com>');
    });

    test('handles empty XML', () => {
      expect(SafePromptFileScanner._stripXmlToText('')).toBe('');
    });
  });

  describe('_decodePdfString', () => {
    test('decodes escape sequences', () => {
      expect(SafePromptFileScanner._decodePdfString('Hello\\nWorld')).toBe('Hello\nWorld');
      expect(SafePromptFileScanner._decodePdfString('Tab\\there')).toBe('Tab\there');
      expect(SafePromptFileScanner._decodePdfString('\\(parens\\)')).toBe('(parens)');
      expect(SafePromptFileScanner._decodePdfString('back\\\\slash')).toBe('back\\slash');
    });

    test('decodes octal sequences', () => {
      expect(SafePromptFileScanner._decodePdfString('\\101')).toBe('A');
    });
  });

  describe('_isPdfOperator', () => {
    test('identifies PDF structural tokens', () => {
      expect(SafePromptFileScanner._isPdfOperator('endobj')).toBe(true);
      expect(SafePromptFileScanner._isPdfOperator('stream')).toBe(true);
      expect(SafePromptFileScanner._isPdfOperator('/Type')).toBe(true);
      expect(SafePromptFileScanner._isPdfOperator('/Font')).toBe(true);
    });

    test('does not flag regular text', () => {
      expect(SafePromptFileScanner._isPdfOperator('Hello World')).toBe(false);
      expect(SafePromptFileScanner._isPdfOperator('John Smith')).toBe(false);
    });
  });

  describe('_getFileType', () => {
    test('identifies text files by extension', () => {
      expect(SafePromptFileScanner._getFileType({ name: 'test.txt', type: '' })).toBe('text');
      expect(SafePromptFileScanner._getFileType({ name: 'data.csv', type: '' })).toBe('text');
      expect(SafePromptFileScanner._getFileType({ name: 'config.yml', type: '' })).toBe('text');
      expect(SafePromptFileScanner._getFileType({ name: 'query.sql', type: '' })).toBe('text');
    });

    test('identifies text files by MIME type', () => {
      expect(SafePromptFileScanner._getFileType({ name: 'unknown', type: 'text/plain' })).toBe('text');
      expect(SafePromptFileScanner._getFileType({ name: 'unknown', type: 'application/json' })).toBe('text');
    });

    test('identifies docx files', () => {
      expect(SafePromptFileScanner._getFileType({ name: 'doc.docx', type: '' })).toBe('docx');
    });

    test('identifies pdf files', () => {
      expect(SafePromptFileScanner._getFileType({ name: 'report.pdf', type: '' })).toBe('pdf');
    });

    test('returns null for unsupported files', () => {
      expect(SafePromptFileScanner._getFileType({ name: 'image.png', type: 'image/png' })).toBeNull();
    });
  });
});
