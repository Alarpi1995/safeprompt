/**
 * SafePrompt - French Language Patterns (Français)
 * Covers France PII patterns
 */

const SafePromptFR = {
  code: 'fr',
  name: 'French',
  nativeName: 'Français',
  rtl: false,
  patterns: {
    // ── Identité (Identity) ──────────────────────────────────────────────────
    identity: [
      {
        type: 'nir_fr',
        label: 'Numéro de Sécurité Sociale (NIR)',
        pattern: '\\b[12]\\s?\\d{2}\\s?(?:0[1-9]|1[0-2]|[2-9]\\d)\\s?\\d{2,3}\\s?\\d{3}\\s?\\d{3}\\s?\\d{2}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['sécurité sociale', 'NIR', 'numéro sécu', 'sécu', 'numéro de sécurité'],
      },
      {
        type: 'cni_fr',
        label: 'Carte Nationale d\'Identité',
        pattern: '\\b[A-Z0-9]{12}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['carte d\'identité', 'CNI', 'carte nationale', 'pièce d\'identité'],
        contextRequired: true,
      },
      {
        type: 'passport_fr',
        label: 'Numéro de Passeport',
        pattern: '\\b\\d{2}[A-Z]{2}\\d{5}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['passeport', 'numéro de passeport', 'passport'],
        contextRequired: true,
      },
      {
        type: 'permis_conduire_fr',
        label: 'Permis de Conduire',
        pattern: '\\b\\d{2}[A-Z]{2}\\d{5}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['permis de conduire', 'permis', 'conduire'],
        contextRequired: true,
      },
    ],

    // ── Finances (Financial) ─────────────────────────────────────────────────
    financial: [
      {
        type: 'iban_fr',
        label: 'IBAN (France)',
        pattern: '\\bFR\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{3}\\b',
        flags: 'gi',
        severity: 'critical',
        keywords: ['IBAN', 'compte bancaire', 'numéro de compte', 'RIB'],
      },
      {
        type: 'bic_fr',
        label: 'Code BIC/SWIFT',
        pattern: '\\b[A-Z]{4}FR[A-Z0-9]{2}(?:[A-Z0-9]{3})?\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['BIC', 'SWIFT', 'code bancaire'],
      },
      {
        type: 'credit_card',
        label: 'Carte de Crédit',
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
      {
        type: 'siret_fr',
        label: 'Numéro SIRET',
        pattern: '\\b\\d{3}\\s?\\d{3}\\s?\\d{3}\\s?\\d{5}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['SIRET', 'numéro SIRET', 'entreprise'],
        contextRequired: true,
      },
      {
        type: 'siren_fr',
        label: 'Numéro SIREN',
        pattern: '\\b\\d{3}\\s?\\d{3}\\s?\\d{3}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['SIREN', 'numéro SIREN'],
        contextRequired: true,
      },
    ],

    // ── Contact ──────────────────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: 'Adresse Email',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_fr',
        label: 'Téléphone (France)',
        pattern: '\\b(?:\\+?33|0033|0)\\s?[1-9](?:\\s?\\d{2}){4}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['téléphone', 'tél', 'portable', 'mobile', 'numéro'],
      },
      {
        type: 'address_fr',
        label: 'Adresse Postale',
        pattern: '\\b\\d{1,4}(?:,?\\s(?:rue|avenue|boulevard|bd|place|allée|impasse|chemin|route)\\s[A-ZÀ-Ü][a-zà-ü]+(?:\\s[A-ZÀ-Ü][a-zà-ü]+)*)\\b',
        flags: 'gi',
        severity: 'medium',
      },
      {
        type: 'postal_code_fr',
        label: 'Code Postal',
        pattern: '\\b\\d{5}\\b',
        flags: 'g',
        severity: 'low',
        keywords: ['code postal', 'CP', 'cedex'],
        contextRequired: true,
      },
    ],

    // ── Personnel (Personal) ─────────────────────────────────────────────────
    personal: [
      {
        type: 'dob_fr',
        label: 'Date de Naissance',
        pattern: '\\b(?:0[1-9]|[12]\\d|3[01])[/\\-](?:0[1-9]|1[0-2])[/\\-](?:19|20)\\d{2}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['naissance', 'date de naissance', 'né le', 'née le', 'né(e)'],
      },
    ],

    // ── Identifiants (Credentials) ──────────────────────────────────────────
    credentials: [
      {
        type: 'password',
        label: 'Mot de Passe',
        pattern: '(?:mot\\s*de\\s*passe|password|mdp)\\s*[:=]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptFR = SafePromptFR;
if (typeof module !== 'undefined') module.exports = { SafePromptFR };
