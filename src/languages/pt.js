/**
 * SafePrompt - Portuguese Language Patterns (Portugues)
 * Covers Brazil and Portugal PII patterns
 */

const SafePromptPT = {
  code: 'pt',
  name: 'Portuguese',
  nativeName: 'Portugues',
  rtl: false,
  patterns: {
    // ── Identidade (Identity) ────────────────────────────────────────────────
    identity: [
      {
        type: 'cpf_br',
        label: 'CPF (Brasil)',
        pattern: '\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['CPF', 'cadastro', 'pessoa fisica'],
        validate(v) {
          const digits = v.replace(/\D/g, '');
          if (digits.length !== 11) return false;
          // All same digits
          if (/^(\d)\1+$/.test(digits)) return false;
          // Checksum validation
          let sum = 0;
          for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
          let check = 11 - (sum % 11);
          if (check >= 10) check = 0;
          if (parseInt(digits[9], 10) !== check) return false;
          sum = 0;
          for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
          check = 11 - (sum % 11);
          if (check >= 10) check = 0;
          return parseInt(digits[10], 10) === check;
        },
      },
      {
        type: 'cnpj_br',
        label: 'CNPJ (Brasil)',
        pattern: '\\b\\d{2}\\.?\\d{3}\\.?\\d{3}/?\\d{4}-?\\d{2}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['CNPJ', 'empresa', 'cadastro nacional'],
      },
      {
        type: 'rg_br',
        label: 'RG (Brasil)',
        pattern: '\\b\\d{2}\\.?\\d{3}\\.?\\d{3}-?[\\dXx]\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['RG', 'identidade', 'carteira de identidade', 'registro geral'],
        contextRequired: true,
      },
      {
        type: 'nif_pt',
        label: 'NIF (Portugal)',
        pattern: '\\b[123568]\\d{8}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['NIF', 'contribuinte', 'fiscal'],
        validate(v) {
          if (v.length !== 9) return false;
          const weights = [9, 8, 7, 6, 5, 4, 3, 2, 1];
          let sum = 0;
          for (let i = 0; i < 9; i++) sum += parseInt(v[i], 10) * weights[i];
          return sum % 11 === 0;
        },
      },
      {
        type: 'cc_pt',
        label: 'Cartao de Cidadao (Portugal)',
        pattern: '\\b\\d{8}\\s?\\d\\s?[A-Z]{2}\\d\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['CC', 'cidadao', 'cartao de cidadao', 'BI'],
      },
      {
        type: 'passport_br',
        label: 'Passaporte (Brasil)',
        pattern: '\\b[A-Z]{2}\\d{6}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['passaporte', 'passport'],
        contextRequired: true,
      },
    ],

    // ── Financeiro (Financial) ───────────────────────────────────────────────
    financial: [
      {
        type: 'iban_pt',
        label: 'IBAN (Portugal)',
        pattern: '\\bPT\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{1}\\b',
        flags: 'gi',
        severity: 'critical',
      },
      {
        type: 'pix_br',
        label: 'Chave PIX (CPF/Email/Phone)',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
        keywords: ['PIX', 'chave pix', 'pix'],
        contextRequired: true,
      },
      {
        type: 'credit_card',
        label: 'Cartao de Credito',
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

    // ── Contato (Contact) ────────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: 'E-mail',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_br',
        label: 'Telefone (Brasil)',
        pattern: '\\b(?:\\+?55)?\\s?\\(?\\d{2}\\)?\\s?9?\\d{4}[- ]?\\d{4}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['telefone', 'celular', 'cel', 'whatsapp', 'fone'],
      },
      {
        type: 'phone_pt',
        label: 'Telefone (Portugal)',
        pattern: '\\b(?:\\+?351)?\\s?9[1236]\\d\\s?\\d{3}\\s?\\d{3}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['telefone', 'telemovel', 'contacto'],
      },
      {
        type: 'cep_br',
        label: 'CEP (Brasil)',
        pattern: '\\b\\d{5}-?\\d{3}\\b',
        flags: 'g',
        severity: 'low',
        keywords: ['CEP', 'codigo postal'],
        contextRequired: true,
      },
    ],

    // ── Pessoal (Personal) ──────────────────────────────────────────────────
    personal: [
      {
        type: 'dob_pt',
        label: 'Data de Nascimento',
        pattern: '\\b(?:0[1-9]|[12]\\d|3[01])[/\\-](?:0[1-9]|1[0-2])[/\\-](?:19|20)\\d{2}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['nascimento', 'data de nascimento', 'nascido', 'nascida'],
        contextRequired: true,
      },
    ],

    // ── Credenciais (Credentials) ───────────────────────────────────────────
    credentials: [
      {
        type: 'password',
        label: 'Senha',
        pattern: '(?:senha|password|passwd)\\s*[:=]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptPT = SafePromptPT;
if (typeof module !== 'undefined') module.exports = { SafePromptPT };
