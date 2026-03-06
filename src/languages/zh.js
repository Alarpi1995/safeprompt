/**
 * SafePrompt - Chinese Language Patterns (中文)
 * Covers China PII patterns
 */

const SafePromptZH = {
  code: 'zh',
  name: 'Chinese',
  nativeName: '中文',
  rtl: false,
  patterns: {
    // ── 身份 (Identity) ──────────────────────────────────────────────────────
    identity: [
      {
        type: 'id_cn',
        label: '身份证号码',
        pattern: '\\b\\d{6}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['身份证', '身份证号', '证件号', '身份证号码', 'ID card'],
        validate(v) {
          if (v.length !== 18) return false;
          const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
          const checks = '10X98765432';
          let sum = 0;
          for (let i = 0; i < 17; i++) {
            sum += parseInt(v[i], 10) * weights[i];
          }
          return v[17].toUpperCase() === checks[sum % 11];
        },
      },
      {
        type: 'passport_cn',
        label: '护照号码',
        pattern: '\\b[EeGg]\\d{8}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['护照', '护照号', '护照号码', 'passport'],
        contextRequired: true,
      },
      {
        type: 'hukou_cn',
        label: '户口本号码',
        pattern: '\\b\\d{9}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['户口', '户口本', '户口号', '户籍'],
        contextRequired: true,
      },
    ],

    // ── 金融 (Financial) ─────────────────────────────────────────────────────
    financial: [
      {
        type: 'bank_card_cn',
        label: '银行卡号',
        pattern: '\\b(?:62|60|68|9)\\d{14,18}\\b',
        flags: 'g',
        severity: 'critical',
        keywords: ['银行卡', '卡号', '银行账号', '储蓄卡', '信用卡', 'bank card'],
        validate(v) {
          // Luhn check for Chinese bank cards
          const digits = v.replace(/\D/g, '');
          if (digits.length < 15 || digits.length > 19) return false;
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
        type: 'alipay_cn',
        label: '支付宝账号',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
        keywords: ['支付宝', 'Alipay', '支付宝账号'],
        contextRequired: true,
      },
      {
        type: 'tax_id_cn',
        label: '纳税人识别号',
        pattern: '\\b[A-Z0-9]{15,20}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['纳税人', '税号', '纳税识别号', '统一社会信用代码'],
        contextRequired: true,
      },
    ],

    // ── 联系 (Contact) ───────────────────────────────────────────────────────
    contact: [
      {
        type: 'email',
        label: '电子邮箱',
        pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        severity: 'high',
      },
      {
        type: 'phone_cn',
        label: '手机号码',
        pattern: '\\b(?:\\+?86)?\\s?1[3-9]\\d\\s?\\d{4}\\s?\\d{4}\\b',
        flags: 'g',
        severity: 'high',
        keywords: ['手机', '电话', '手机号', '联系电话', '手机号码', 'phone'],
      },
      {
        type: 'landline_cn',
        label: '固定电话',
        pattern: '\\b0\\d{2,3}[- ]?\\d{7,8}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['电话', '座机', '固话', '固定电话'],
      },
      {
        type: 'qq_cn',
        label: 'QQ号',
        pattern: '\\b[1-9]\\d{4,10}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['QQ', 'QQ号', 'QQ号码'],
        contextRequired: true,
      },
      {
        type: 'wechat_cn',
        label: '微信号',
        pattern: '\\b[a-zA-Z][a-zA-Z0-9_-]{5,19}\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['微信', '微信号', 'WeChat', 'wechat'],
        contextRequired: true,
      },
    ],

    // ── 个人 (Personal) ──────────────────────────────────────────────────────
    personal: [
      {
        type: 'dob_cn',
        label: '出生日期',
        pattern: '\\b(?:19|20)\\d{2}[年/\\-](?:0?[1-9]|1[0-2])[月/\\-](?:0?[1-9]|[12]\\d|3[01])[日]?\\b',
        flags: 'g',
        severity: 'medium',
        keywords: ['出生', '出生日期', '生日', '出生年月'],
      },
    ],

    // ── 凭证 (Credentials) ──────────────────────────────────────────────────
    credentials: [
      {
        type: 'password',
        label: '密码',
        pattern: '(?:密码|口令|password|passwd)\\s*[:=：]\\s*["\']?([^\\s"\']{4,})["\']?',
        flags: 'gi',
        severity: 'critical',
      },
    ],
  },
};

if (typeof window !== 'undefined') window.SafePromptZH = SafePromptZH;
if (typeof module !== 'undefined') module.exports = { SafePromptZH };
