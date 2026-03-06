/**
 * SafePrompt - Spanish Language Patterns (Español)
 * Covers Spain and Mexico PII patterns
 */

const SafePromptES = {
  code: 'es',
  name: 'Spanish',
  nativeName: 'Español',
  rtl: false,
  patterns: {
    // ── Identidad (Identity) ──────────────────────────────────────────────────
    identity: [
      {
        type: 'dni_es',
        label: 'DNI (España)',
        pattern: '\\b\\d{8}[A-Z]\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['DNI', 'documento', 'identidad', 'documento nacional'],
        validate(v) {
          const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
          const num = parseInt(v.slice(0, 8), 10);
          return v[8] === letters[num % 23];
        },
      },
      {
        type: 'nie_es',
        label: 'NIE (España)',
        pattern: '\\b[XYZ]\\d{7}[A-Z]\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['NIE', 'extranjero', 'identidad extranjero'],
        validate(v) {
          const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
          const prefix = { X: '0', Y: '1', Z: '2' };
          const num = parseInt(prefix[v[0]] + v.slice(1, 8), 10);
          return v[8] === letters[num % 23];
        },
      },
      {
        type: 'curp_mx',
        label: 'CURP (México)',
        pattern: '\\b[A-Z]{4}\\d{6}[HM][A-Z]{5}[A-Z0-9]\\d\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['CURP', 'clave única', 'registro de población'],
      },
      {
        type: 'rfc_mx',
        label: 'RFC (México)',
        pattern: '\\b[A-ZÑ&]{3,4}\\d{6}[A-Z0-9]{3}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['RFC', 'registro federal', 'contribuyentes'],
      },
      {
        type: 'nss_mx',
        label: 'NSS (México)',
        pattern: '\\b\\d{11}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['NSS', 'seguro social', 'número de seguro', 'IMSS'],
        contextRequired: true,
      },
      {
        type: 'passport_es',
        label: 'Pasaporte (España)',
        pattern: '\\b[A-Z]{3}\\d{6}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['pasaporte', 'passport', 'número de pasaporte'],
        contextRequired: true,
      },
    ],

    // ── Financiero (Financial) ────────────────────────────────────────────────
    financial: [
      {
        type: 'iban_es',
        label: 'IBAN (España)',
        pattern: '\\bES\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2}\\s?\\d{10}\\b',
        flags: 'gi',
        severity: 'critical',
        keywords: ['IBAN', 'cuenta bancaria', 'número de cuenta'],
      },
      {
        type: 'clabe_mx',
        label: 'CLABE (México)',
        pattern: '\\b\\d{18}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['CLABE', 'cuenta', 'interbancaria'],
        contextRequired: true,
      },
      {
        type: 'credit_card',
        label: 'Tarjeta de Crédito',
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

    // ── Contacto (Contact) ───────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: 'Correo Electrónico',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_es',
        label: 'Teléfono (España)',
        pattern: '\\b(?:\\+?34)?\\s?[6789]\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['teléfono', 'móvil', 'celular', 'número'],
      },
      {
        type: 'phone_mx',
        label: 'Teléfono (México)',
        pattern: '\\b(?:\\+?52)[\\s.-]?(?:1[\\s.-]?)?\\d{2,3}[\\s.-]?\\d{3,4}[\\s.-]?\\d{4}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['teléfono', 'celular', 'cel', 'número'],
      },
      {
        type: 'address_es',
        label: 'Dirección',
        pattern: '(?:(?:C(?:alle)?|Av(?:enida)?|Pza|Plaza|Paseo|Carrera|Cra)\\.?)\\s[A-ZÁ-Ú][a-záéíóúñ]+(?:\\s[A-ZÁ-Ú][a-záéíóúñ]+)*\\s(?:No?\\.?|#|núm\\.?)\\s?\\d{1,5}',
        flags: 'g',
        severity: 'medium',
      },
    ],

    // ── Personal ─────────────────────────────────────────────────────────────
    personal: [
      {
        type: 'dob_es',
        label: 'Fecha de Nacimiento',
        pattern: '\\b(?:0[1-9]|[12]\\d|3[01])[/\\-](?:0[1-9]|1[0-2])[/\\-](?:19|20)\\d{2}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['nacimiento', 'fecha de nacimiento', 'nacido', 'nacida', 'nació'],
      },
    ],

    // ── Credenciales (Credentials) ───────────────────────────────────────────
    credentials: [
      {
        type: 'password',
        label: 'Contraseña',
        pattern: '(?:contraseña|clave|password|passwd)\\s*[:=]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptES = SafePromptES;
if (typeof module !== 'undefined') module.exports = { SafePromptES };
