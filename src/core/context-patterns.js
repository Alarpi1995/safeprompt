/**
 * SafePrompt - Context-Aware Detection Patterns
 *
 * Detects PII embedded in natural language sentences.
 * e.g. "my password is abc123", "call me at 555-1234", "born on 01/15/1990"
 *
 * These patterns look for keyword + value combinations that indicate
 * the user is sharing sensitive information in conversational text.
 */

const SafePromptContext = {
  code: 'context',
  name: 'Context-Aware',
  nativeName: 'Context Detection',
  rtl: false,
  patterns: {
    // ── Credentials in Sentences ──────────────────────────────────────────────
    credentials: [
      {
        type: 'password_context',
        label: 'Password in Sentence',
        pattern: '(?:my |the |our |enter |use |with |is |was )(?:password|passwd|pass|pin|passcode)(?:\\s+(?:is|was|=|:))?\\s+["\']?([^\\s"\']{3,30})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'username_password',
        label: 'Username & Password',
        pattern: '(?:user(?:name)?|login)\\s*[:=]\\s*["\']?([^\\s"\']+)["\']?\\s+(?:and|&|,)?\\s*(?:pass(?:word)?|pwd)\\s*[:=]\\s*["\']?([^\\s"\']+)["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'secret_context',
        label: 'Secret/Key in Sentence',
        pattern: '(?:my |the |our |use |enter )(?:secret|api[- ]?key|access[- ]?key|token|auth)(?:\\s+(?:is|was|=|:))?\\s+["\']?([A-Za-z0-9_\\-\\.]{6,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],

    // ── Identity in Sentences ─────────────────────────────────────────────────
    identity: [
      {
        type: 'ssn_context',
        label: 'SSN in Sentence',
        pattern: '(?:my |the |his |her )(?:ssn|social\\s*security(?:\\s*number)?)(?:\\s+(?:is|was|:))?\\s+(\\d{3}[- ]?\\d{2}[- ]?\\d{4})',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'id_context',
        label: 'ID Number in Sentence',
        pattern: '(?:my |the |his |her )(?:id|identity|national\\s*id|passport|license)(?:\\s*(?:number|no\\.?|#))?(?:\\s+(?:is|was|:))?\\s+([A-Z0-9][A-Z0-9\\- ]{4,20})',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'dob_context',
        label: 'Date of Birth in Sentence',
        pattern: '(?:born\\s+(?:on|in)|date\\s+of\\s+birth(?:\\s+(?:is|was|:))?|birthday(?:\\s+(?:is|was|:))?|dob(?:\\s*[:=])?)\\s+(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}|\\w+\\s+\\d{1,2},?\\s+\\d{4})',
        flags: 'gi',
        severity: 'high',
      },
    ],

    // ── Contact in Sentences ──────────────────────────────────────────────────
    contact: [
      {
        type: 'phone_context',
        label: 'Phone in Sentence',
        pattern: '(?:call\\s+(?:me|us|him|her)\\s+(?:at|on)|(?:my |the |his |her )(?:phone|cell|mobile|number|tel)(?:\\s*(?:is|was|:))?)\\s+([+]?[\\d\\s\\-().]{7,20})',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'email_context',
        label: 'Email in Sentence',
        pattern: '(?:(?:my |the |his |her )(?:email|e-mail|mail)(?:\\s*(?:is|was|:))?|(?:email|reach|contact)\\s+(?:me|us|him|her)\\s+(?:at|on))\\s+([a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'address_context',
        label: 'Address in Sentence',
        pattern: '(?:(?:i |we )live(?:s)?\\s+(?:at|in|on)|(?:my |the |our )(?:address|home|residence)(?:\\s+(?:is|was|:))?)\\s+([\\d]+[\\s][A-Z][a-zA-Z\\s,\\.]+(?:St|Ave|Rd|Dr|Blvd|Ln|Way|Ct|Pl|street|avenue|road|drive|boulevard)[\\s,\\.]*[A-Za-z\\s,]*\\d{5}(?:-\\d{4})?)',
        flags: 'gi',
        severity: 'high',
      },
    ],

    // ── Financial in Sentences ────────────────────────────────────────────────
    financial: [
      {
        type: 'card_context',
        label: 'Card Number in Sentence',
        pattern: '(?:(?:my |the |his |her )(?:card|credit\\s*card|debit\\s*card|visa|mastercard|amex)(?:\\s*(?:number|no\\.?|#))?(?:\\s+(?:is|was|:))?)\\s+(\\d{4}[\\s\\-]?\\d{4}[\\s\\-]?\\d{4}[\\s\\-]?\\d{1,4})',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'account_context',
        label: 'Account Number in Sentence',
        pattern: '(?:(?:my |the |our )(?:account|bank\\s*account|routing|iban)(?:\\s*(?:number|no\\.?|#))?(?:\\s+(?:is|was|:))?)\\s+([A-Z]{0,2}\\d{8,30})',
        flags: 'gi',
        severity: 'critical',
      },
    ],

    // ── Name Detection in Sentences ──────────────────────────────────────────
    names: [
      {
        type: 'name_context_en',
        label: 'Personal Name (English)',
        pattern: '(?:(?:my |his |her |the )(?:name|full\\s*name)(?:\\s+(?:is|was|:))?)\\s+([A-Z][a-z]{1,20}(?:\\s+[A-Z][a-z]{1,20}){1,3})',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'name_intro_en',
        label: 'Name Introduction',
        pattern: '(?:(?:I\'m|I\\s+am|this\\s+is|call\\s+me)\\s+)([A-Z][a-z]{1,20}(?:\\s+[A-Z][a-z]{1,20}){0,2})',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'name_context_ar',
        label: 'Personal Name (Arabic)',
        pattern: '(?:(?:اسمي|اسمه|اسمها|الاسم)\\s*(?:هو|هي|:)?\\s*)([\\u0600-\\u06FF]{2,20}(?:\\s+[\\u0600-\\u06FF]{2,20}){1,4})',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'name_context_es',
        label: 'Personal Name (Spanish)',
        pattern: '(?:(?:me\\s+llamo|mi\\s+nombre\\s+(?:es|:)|soy)\\s+)([A-ZÁ-Ú][a-záéíóúñ]{1,20}(?:\\s+[A-ZÁ-Ú][a-záéíóúñ]{1,20}){0,3})',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'name_context_fr',
        label: 'Personal Name (French)',
        pattern: '(?:(?:je\\s+m\'appelle|mon\\s+nom\\s+(?:est|:)|je\\s+suis)\\s+)([A-ZÀ-Ü][a-zà-ü]{1,20}(?:\\s+[A-ZÀ-Ü][a-zà-ü]{1,20}){0,3})',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'name_context_de',
        label: 'Personal Name (German)',
        pattern: '(?:(?:ich\\s+(?:hei(?:ss|ß)e|bin)|mein\\s+Name\\s+(?:ist|:))\\s+)([A-ZÄ-Ü][a-zä-ü]{1,20}(?:\\s+[A-ZÄ-Ü][a-zä-ü]{1,20}){0,3})',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'name_context_zh',
        label: 'Personal Name (Chinese)',
        pattern: '(?:(?:我叫|我的名字(?:是|叫)|我姓)\\s*)([\u4e00-\u9fff]{2,4})',
        flags: 'g',
        severity: 'high',
      },
      {
        type: 'name_context_pt',
        label: 'Personal Name (Portuguese)',
        pattern: '(?:(?:me\\s+chamo|meu\\s+nome\\s+(?:é|:)|sou\\s+o|sou\\s+a)\\s+)([A-ZÀ-Ú][a-zà-ú]{1,20}(?:\\s+[A-ZÀ-Ú][a-zà-ú]{1,20}){0,3})',
        flags: 'gi',
        severity: 'high',
      },
    ],

    // ── Arabic Context Patterns ───────────────────────────────────────────────
    personal: [
      {
        type: 'password_context_ar',
        label: 'Password in Arabic Sentence',
        pattern: '(?:كلمة\\s*(?:ال)?(?:مرور|سر)|الباسورد|الرقم السري)\\s*(?:هي|هو|:)?\\s*["\']?([^\\s"\']{3,30})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'phone_context_ar',
        label: 'Phone in Arabic Sentence',
        pattern: '(?:(?:رقمي|رقم\\s*(?:جوالي|هاتفي|تلفوني|موبايلي))\\s*(?:هو|:)?|اتصل\\s*(?:بي|علي)\\s*(?:على)?)\\s+([+]?[\\d\\s\\-]{7,20})',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'id_context_ar',
        label: 'ID in Arabic Sentence',
        pattern: '(?:رقم\\s*(?:هويتي|جوازي|بطاقتي|حسابي|الآيبان))\\s*(?:هو|:)?\\s+([A-Z0-9][A-Z0-9\\- ]{4,30})',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'password_context_es',
        label: 'Password in Spanish Sentence',
        pattern: '(?:mi\\s+)?(?:contrase[nñ]a|clave)\\s+(?:es|:)\\s+["\']?([^\\s"\']{3,30})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'password_context_fr',
        label: 'Password in French Sentence',
        pattern: '(?:mon\\s+)?(?:mot\\s+de\\s+passe|mdp)\\s+(?:est|:)\\s+["\']?([^\\s"\']{3,30})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'password_context_zh',
        label: 'Password in Chinese Sentence',
        pattern: '(?:我的)?(?:密码|口令)\\s*(?:是|:)\\s*["\']?([^\\s"\']{3,30})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptContext = SafePromptContext;
if (typeof module !== 'undefined') module.exports = { SafePromptContext };
