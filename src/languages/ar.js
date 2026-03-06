/**
 * SafePrompt - Arabic Language Patterns (العربية)
 * Covers Saudi Arabia, UAE, Egypt PII patterns
 */

const SafePromptAR = {
  code: 'ar',
  name: 'Arabic',
  nativeName: 'العربية',
  rtl: true,
  patterns: {
    // ── الهوية (Identity) ─────────────────────────────────────────────────────
    identity: [
      {
        type: 'national_id_sa',
        label: 'رقم الهوية السعودية',
        pattern: '\\b[12]\\d{9}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['هوية', 'رقم الهوية', 'الهوية الوطنية', 'سجل مدني', 'national id', 'ID number'],
        validate(v) {
          // Saudi ID: starts with 1 (citizen) or 2 (resident), 10 digits
          if (v.length !== 10) return false;
          // Luhn-like check for Saudi IDs
          let sum = 0;
          for (let i = 0; i < 10; i++) {
            const digit = parseInt(v[i], 10);
            if (i % 2 === 0) {
              const doubled = digit * 2;
              sum += doubled > 9 ? doubled - 9 : doubled;
            } else {
              sum += digit;
            }
          }
          return sum % 10 === 0;
        },
      },
      {
        type: 'national_id_eg',
        label: 'الرقم القومي المصري',
        pattern: '\\b[23]\\d{13}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['رقم قومي', 'البطاقة', 'الرقم القومي', 'بطاقة شخصية'],
      },
      {
        type: 'emirates_id',
        label: 'رقم الهوية الإماراتية',
        pattern: '\\b784-?\\d{4}-?\\d{7}-?\\d\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['هوية إماراتية', 'Emirates ID', 'الهوية'],
      },
      {
        type: 'passport_sa',
        label: 'رقم جواز السفر السعودي',
        pattern: '\\b[A-Z]\\d{7,8}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['جواز', 'جواز سفر', 'passport', 'رقم الجواز'],
      },
    ],

    // ── المالية (Financial) ───────────────────────────────────────────────────
    financial: [
      {
        type: 'iban_sa',
        label: 'آيبان سعودي',
        pattern: '\\bSA\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\b',
        flags: 'gi',
        severity: 'critical',
        keywords: ['آيبان', 'IBAN', 'حساب بنكي', 'رقم الحساب'],
      },
      {
        type: 'iban_uae',
        label: 'آيبان إماراتي',
        pattern: '\\bAE\\d{2}\\s?\\d{3}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{3}\\b',
        flags: 'gi',
        severity: 'critical',
        keywords: ['آيبان', 'IBAN'],
      },
      {
        type: 'iban_eg',
        label: 'آيبان مصري',
        pattern: '\\bEG\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{3}\\b',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'credit_card',
        label: 'رقم بطاقة ائتمان',
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

    // ── الاتصال (Contact) ────────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: 'بريد إلكتروني',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_sa',
        label: 'رقم هاتف سعودي',
        pattern: '\\b(?:\\+?966|00966|0)?\\s?5[0-9]\\s?\\d{3}\\s?\\d{4}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['جوال', 'هاتف', 'رقم الجوال', 'موبايل', 'تلفون'],
      },
      {
        type: 'phone_uae',
        label: 'رقم هاتف إماراتي',
        pattern: '\\b(?:\\+?971|00971|0)?\\s?5[024568]\\s?\\d{3}\\s?\\d{4}\\b',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'phone_eg',
        label: 'رقم هاتف مصري',
        pattern: '\\b(?:\\+?20|0020|0)?\\s?1[0125]\\s?\\d{4}\\s?\\d{4}\\b',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'address_ar',
        label: 'عنوان',
        pattern: '(?:شارع|حي|طريق|ش\\.|منطقة|مدينة|بناية)\\s[\\u0600-\\u06FF\\s]{3,30}',
        flags: 'g',
        severity: 'medium',
      },
    ],

    // ── البيانات الشخصية (Personal) ──────────────────────────────────────────
    personal: [
      {
        type: 'dob_ar',
        label: 'تاريخ الميلاد',
        pattern: '\\b(?:0[1-9]|[12]\\d|3[01])[/\\-](?:0[1-9]|1[0-2])[/\\-](?:1[34]|14|19|20)\\d{2}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['تاريخ الميلاد', 'مواليد', 'ميلاد', 'تاريخ ميلاد'],
      },
    ],

    // ── المركبات (Vehicle) ──────────────────────────────────────────────────
    vehicle: [
      {
        type: 'plate_sa',
        label: 'لوحة سيارة سعودية',
        pattern: '\\b[A-Z]{3}\\s?\\d{3,4}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['لوحة', 'سيارة', 'مركبة', 'plate', 'رقم اللوحة'],
        contextRequired: true,
      },
      {
        type: 'plate_eg',
        label: 'لوحة سيارة مصرية',
        pattern: '\\b[\\u0600-\\u06FF]{1,3}\\s?\\d{1,4}\\s?[\\u0600-\\u06FF]{1,3}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['لوحة', 'سيارة', 'عربية', 'plate'],
        contextRequired: true,
      },
    ],

    // ── بيانات الاعتماد (Credentials) ────────────────────────────────────────
    credentials: [
      {
        type: 'password',
        label: 'كلمة المرور',
        pattern: '(?:كلمة[\\s]?(?:ال)?(?:مرور|سر)|password|passwd|pwd)\\s*[:=]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'api_key',
        label: 'مفتاح API',
        pattern: '\\b(?:sk|pk|api|key)[_-][a-zA-Z0-9_\\-]{20,}\\b',
        flags: 'g',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptAR = SafePromptAR;
if (typeof module !== 'undefined') module.exports = { SafePromptAR };
