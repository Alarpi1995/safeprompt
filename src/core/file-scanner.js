/**
 * SafePrompt - File Scanner
 * Extracts text from files before upload to AI platforms.
 * Supports: .txt, .csv, .json, .log, .md, .docx, .pdf
 * 100% local processing - no server calls.
 */

(function () {
  'use strict';

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  // Supported file extensions and their MIME types
  const TEXT_EXTENSIONS = /\.(txt|csv|json|log|md|xml|yaml|yml|ini|conf|cfg|env|properties|tsv|sql|html|htm)$/i;
  const DOCX_EXTENSIONS = /\.(docx)$/i;
  const PDF_EXTENSIONS = /\.(pdf)$/i;

  const TEXT_MIMES = [
    'text/plain', 'text/csv', 'text/html', 'text/xml', 'text/markdown',
    'application/json', 'application/xml', 'application/yaml',
  ];
  const DOCX_MIMES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const PDF_MIMES = ['application/pdf'];

  const SafePromptFileScanner = {
    /**
     * Check if a file can be scanned.
     */
    canScan(file) {
      if (!file || !file.name) return false;
      if (file.size > MAX_FILE_SIZE) return false;
      return this._getFileType(file) !== null;
    },

    /**
     * Extract text content from a file.
     * Returns a Promise that resolves to a string.
     */
    async extractText(file) {
      if (!file) return '';
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      const type = this._getFileType(file);

      switch (type) {
        case 'text':
          return this._readAsText(file);
        case 'docx':
          return this._extractDocx(file);
        case 'pdf':
          return this._extractPdf(file);
        default:
          throw new Error(`Unsupported file type: ${file.name}`);
      }
    },

    /**
     * Get supported file extensions as a human-readable string.
     */
    getSupportedFormats() {
      return '.txt, .csv, .json, .log, .md, .docx, .pdf';
    },

    // -------------------------------------------------------------------------
    // Internal methods
    // -------------------------------------------------------------------------

    _getFileType(file) {
      const name = file.name || '';
      const mime = file.type || '';

      if (TEXT_EXTENSIONS.test(name) || TEXT_MIMES.includes(mime)) return 'text';
      if (DOCX_EXTENSIONS.test(name) || DOCX_MIMES.includes(mime)) return 'docx';
      if (PDF_EXTENSIONS.test(name) || PDF_MIMES.includes(mime)) return 'pdf';

      return null;
    },

    /**
     * Read a text-based file directly.
     */
    _readAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    },

    /**
     * Extract text from a .docx file.
     * DOCX is a ZIP file containing XML documents.
     * We extract the main document body text without external libraries
     * by reading the ZIP structure and parsing the XML.
     */
    async _extractDocx(file) {
      const arrayBuffer = await this._readAsArrayBuffer(file);
      const zipEntries = this._parseZip(arrayBuffer);

      // Find document.xml (the main document body)
      const docEntry = zipEntries.find((e) =>
        e.filename === 'word/document.xml'
      );

      if (!docEntry) {
        throw new Error('Invalid DOCX: word/document.xml not found');
      }

      const xmlText = this._decodeUTF8(docEntry.data);
      return this._stripXmlToText(xmlText);
    },

    /**
     * Extract text from a PDF file.
     * Uses a lightweight text extraction approach that handles
     * most common PDF text encodings without external libraries.
     */
    async _extractPdf(file) {
      const arrayBuffer = await this._readAsArrayBuffer(file);
      const bytes = new Uint8Array(arrayBuffer);
      const text = this._extractPdfText(bytes);

      if (!text || text.trim().length < 3) {
        // Fallback: try to find any readable text strings in the PDF
        return this._extractPdfStrings(bytes);
      }

      return text;
    },

    _readAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });
    },

    // -------------------------------------------------------------------------
    // Lightweight ZIP parser for DOCX
    // -------------------------------------------------------------------------

    _parseZip(arrayBuffer) {
      const view = new DataView(arrayBuffer);
      const entries = [];
      let offset = 0;

      while (offset < view.byteLength - 4) {
        const sig = view.getUint32(offset, true);

        // Local file header signature: 0x04034b50
        if (sig !== 0x04034b50) break;

        const compMethod = view.getUint16(offset + 8, true);
        const compSize = view.getUint32(offset + 18, true);
        const uncompSize = view.getUint32(offset + 22, true);
        const nameLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);

        const nameBytes = new Uint8Array(arrayBuffer, offset + 30, nameLen);
        const filename = this._decodeUTF8(nameBytes);

        const dataStart = offset + 30 + nameLen + extraLen;
        const dataEnd = dataStart + (compMethod === 0 ? uncompSize : compSize);

        // Only handle uncompressed (stored) entries for simplicity
        // Most DOCX generators store document.xml compressed with deflate,
        // but some tools (especially for small docs) store them uncompressed
        if (compMethod === 0) {
          const data = new Uint8Array(arrayBuffer, dataStart, uncompSize);
          entries.push({ filename, data, compressed: false });
        } else if (compMethod === 8) {
          // Deflate: try to decompress using DecompressionStream if available
          const compData = new Uint8Array(arrayBuffer, dataStart, compSize);
          entries.push({ filename, data: compData, compressed: true, uncompSize });
        }

        offset = dataEnd;
      }

      // For compressed entries, try to decompress
      return Promise.all(entries.map(async (entry) => {
        if (entry.compressed && typeof DecompressionStream !== 'undefined') {
          try {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            const reader = ds.readable.getReader();

            writer.write(entry.data);
            writer.close();

            const chunks = [];
            let done = false;
            while (!done) {
              const result = await reader.read();
              if (result.value) chunks.push(result.value);
              done = result.done;
            }

            const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
            const merged = new Uint8Array(totalLen);
            let pos = 0;
            for (const chunk of chunks) {
              merged.set(chunk, pos);
              pos += chunk.length;
            }

            return { filename: entry.filename, data: merged };
          } catch (e) {
            // Decompression failed, skip
            return { filename: entry.filename, data: new Uint8Array(0) };
          }
        }
        return entry;
      }));
    },

    _decodeUTF8(data) {
      if (typeof data === 'string') return data;
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(data);
    },

    /**
     * Strip XML tags and extract text content from DOCX XML.
     * Handles paragraph breaks and table cells.
     */
    _stripXmlToText(xml) {
      // Replace paragraph/line break markers with newlines
      let text = xml
        .replace(/<w:p\b[^>]*\/>/g, '\n')                  // Self-closing paragraphs
        .replace(/<\/w:p>/g, '\n')                           // End of paragraph
        .replace(/<w:br[^>]*\/>/g, '\n')                     // Line breaks
        .replace(/<w:tab[^>]*\/>/g, '\t')                    // Tabs
        .replace(/<\/w:tc>/g, '\t')                          // Table cell separator
        .replace(/<\/w:tr>/g, '\n')                          // Table row separator
        .replace(/<[^>]+>/g, '')                             // Remove all other tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\n{3,}/g, '\n\n')                          // Collapse multiple newlines
        .trim();

      return text;
    },

    // -------------------------------------------------------------------------
    // Lightweight PDF text extraction
    // -------------------------------------------------------------------------

    /**
     * Extract text from PDF stream objects.
     * Looks for text-showing operators: Tj, TJ, ', "
     */
    _extractPdfText(bytes) {
      const text = this._decodeUTF8(bytes);
      const textParts = [];

      // Find text between BT (begin text) and ET (end text) operators
      const btPattern = /BT\s([\s\S]*?)ET/g;
      let match;

      while ((match = btPattern.exec(text)) !== null) {
        const block = match[1];

        // Extract Tj strings: (text) Tj
        const tjPattern = /\(([^)]*)\)\s*Tj/g;
        let tj;
        while ((tj = tjPattern.exec(block)) !== null) {
          textParts.push(this._decodePdfString(tj[1]));
        }

        // Extract TJ arrays: [(text) num (text)] TJ
        const tjArrayPattern = /\[([\s\S]*?)\]\s*TJ/g;
        let tjArr;
        while ((tjArr = tjArrayPattern.exec(block)) !== null) {
          const inner = tjArr[1];
          const strPattern = /\(([^)]*)\)/g;
          let s;
          while ((s = strPattern.exec(inner)) !== null) {
            textParts.push(this._decodePdfString(s[1]));
          }
        }

        // Extract ' operator: (text) '
        const tickPattern = /\(([^)]*)\)\s*'/g;
        let tick;
        while ((tick = tickPattern.exec(block)) !== null) {
          textParts.push(this._decodePdfString(tick[1]));
          textParts.push('\n');
        }
      }

      return textParts.join('').replace(/\s{3,}/g, '\n').trim();
    },

    /**
     * Decode PDF string escape sequences.
     */
    _decodePdfString(str) {
      return str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\([()])/g, '$1')
        .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
    },

    /**
     * Fallback: extract readable ASCII/UTF-8 strings from binary PDF data.
     * Used when structured text extraction yields no results.
     */
    _extractPdfStrings(bytes) {
      const parts = [];
      let current = '';

      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        // Printable ASCII range + common whitespace
        if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
          current += String.fromCharCode(byte);
        } else {
          if (current.length >= 4) {
            // Filter out PDF operators and structural tokens
            const trimmed = current.trim();
            if (trimmed.length >= 4 && !this._isPdfOperator(trimmed)) {
              parts.push(trimmed);
            }
          }
          current = '';
        }
      }

      if (current.length >= 4) {
        const trimmed = current.trim();
        if (trimmed.length >= 4 && !this._isPdfOperator(trimmed)) {
          parts.push(trimmed);
        }
      }

      return parts.join(' ').replace(/\s{3,}/g, '\n').trim();
    },

    /**
     * Check if a string looks like a PDF structural operator.
     */
    _isPdfOperator(str) {
      const operators = [
        'endobj', 'endstream', 'stream', 'xref', 'trailer',
        'startxref', 'obj', '/Type', '/Subtype', '/Font',
        '/Length', '/Filter', '/Pages', '/Page', '/Resources',
      ];
      return operators.some((op) => str.startsWith(op) || str === op);
    },
  };

  // Handle the async _parseZip by making extractText properly wait
  const originalExtractDocx = SafePromptFileScanner._extractDocx;
  SafePromptFileScanner._extractDocx = async function (file) {
    const arrayBuffer = await this._readAsArrayBuffer(file);
    const zipEntries = await this._parseZip(arrayBuffer);

    const docEntry = zipEntries.find((e) =>
      e.filename === 'word/document.xml'
    );

    if (!docEntry) {
      throw new Error('Invalid DOCX: word/document.xml not found');
    }

    const xmlText = this._decodeUTF8(docEntry.data);
    return this._stripXmlToText(xmlText);
  };

  // Export
  if (typeof window !== 'undefined') window.SafePromptFileScanner = SafePromptFileScanner;
  if (typeof module !== 'undefined') module.exports = { SafePromptFileScanner };
})();
