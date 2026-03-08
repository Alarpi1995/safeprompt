/**
 * SafePrompt - Platform Detector
 * Identifies which AI chatbot the user is on and provides platform-specific selectors.
 */

const SafePromptPlatforms = {
  platforms: {
    chatgpt: {
      name: 'ChatGPT',
      hostnames: ['chat.openai.com', 'chatgpt.com'],
      inputSelector: '#prompt-textarea, textarea[data-id="root"]',
      submitSelector: 'button[data-testid="send-button"], button[data-testid="fruitjuice-send-button"]',
      responseSelector: '.markdown, .result-streaming, [data-message-author-role="assistant"]',
      streamingSelector: '.result-streaming',
      conversationSelector: '[data-message-author-role]',
      formSelector: 'form',
    },
    claude: {
      name: 'Claude',
      hostnames: ['claude.ai'],
      inputSelector: '[contenteditable="true"].ProseMirror, div[contenteditable="true"]',
      submitSelector: 'button[aria-label="Send Message"], button[aria-label="Send message"]',
      responseSelector: '.font-claude-message, [data-is-streaming]',
      streamingSelector: '[data-is-streaming]',
      conversationSelector: '[data-testid*="message"], .font-claude-message',
      formSelector: 'fieldset, form',
    },
    gemini: {
      name: 'Gemini',
      hostnames: ['gemini.google.com'],
      inputSelector: '.ql-editor, rich-textarea .textarea',
      submitSelector: 'button.send-button, button[aria-label="Send message"]',
      responseSelector: '.response-content, .model-response-text',
      streamingSelector: null,
      conversationSelector: 'message-content, .query-text, .response-content, .model-response-text',
      formSelector: 'form',
    },
    copilot: {
      name: 'Copilot',
      hostnames: ['copilot.microsoft.com'],
      inputSelector: '#searchbox, textarea',
      submitSelector: 'button[aria-label="Submit"]',
      responseSelector: '.ac-textBlock',
      streamingSelector: null,
      conversationSelector: '.ac-textBlock, [data-author], [class*="message"]',
      formSelector: 'form',
    },
    deepseek: {
      name: 'DeepSeek',
      hostnames: ['chat.deepseek.com'],
      inputSelector: 'textarea#chat-input, textarea',
      submitSelector: 'button[data-testid="send-button"], div[role="button"]',
      responseSelector: '.ds-markdown, .markdown-body',
      streamingSelector: null,
      conversationSelector: '.ds-markdown, .markdown-body, [class*="message"]',
      formSelector: 'form',
    },
    perplexity: {
      name: 'Perplexity',
      hostnames: ['www.perplexity.ai'],
      inputSelector: 'textarea[placeholder]',
      submitSelector: 'button[aria-label="Submit"]',
      responseSelector: '.prose, .markdown',
      streamingSelector: null,
      conversationSelector: '.prose, .markdown, [data-testid*="message"]',
      formSelector: 'form',
    },
    grok: {
      name: 'Grok',
      hostnames: ['grok.x.ai'],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      responseSelector: '.message-content',
      streamingSelector: null,
      conversationSelector: '.message-content, [class*="message"]',
      formSelector: 'form',
    },
    poe: {
      name: 'Poe',
      hostnames: ['poe.com'],
      inputSelector: 'textarea[class*="TextArea"]',
      submitSelector: 'button[class*="SendButton"]',
      responseSelector: '.Message_botMessageBubble__aYctV, [class*="Message_botMessage"]',
      streamingSelector: null,
      conversationSelector: '[class*="Message_"], .Message_botMessageBubble__aYctV',
      formSelector: 'form, footer',
    },
    mistral: {
      name: 'Mistral',
      hostnames: ['chat.mistral.ai'],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      responseSelector: '.prose',
      streamingSelector: null,
      conversationSelector: '.prose, [class*="message"]',
      formSelector: 'form',
    },
    huggingface: {
      name: 'HuggingChat',
      hostnames: ['huggingface.co'],
      inputSelector: 'textarea[placeholder]',
      submitSelector: 'button[type="submit"]',
      responseSelector: '.prose',
      streamingSelector: null,
      conversationSelector: '.prose, [class*="message"]',
      formSelector: 'form',
    },
  },

  detect() {
    const hostname = window.location.hostname;
    for (const [key, platform] of Object.entries(this.platforms)) {
      if (platform.hostnames.some((h) => hostname.includes(h))) {
        return { id: key, ...platform };
      }
    }
    return null;
  },

  getInputElement(platform) {
    if (!platform) return null;
    return this._pickPreferredElement(platform.inputSelector, this._isUsableElement);
  },

  getSubmitButton(platform) {
    if (!platform) return null;
    return this._pickPreferredElement(platform.submitSelector, (el) => this._isUsableElement(el) && !el.disabled);
  },

  isResponseStreaming(platform, el) {
    if (!platform?.streamingSelector) return false;
    try {
      return (typeof el.matches === 'function' && el.matches(platform.streamingSelector)) ||
        (typeof el.closest === 'function' && !!el.closest(platform.streamingSelector));
    } catch (_) {
      return false;
    }
  },

  getResponseElements(platform) {
    if (!platform) return [];
    return this._getCandidates(platform.responseSelector).filter((el) => this._isVisible(el));
  },

  getConversationElements(platform) {
    if (!platform) return [];
    return this._getCandidates(platform.conversationSelector || platform.responseSelector).filter((el) => this._isVisible(el));
  },

  getConversationTurns(platform) {
    const elements = this.getConversationElements(platform);
    const turns = [];
    const seen = new Set();

    elements.forEach((el, index) => {
      const text = this._extractText(el);
      if (!text) return;

      const role = this._inferMessageRole(platform, el);
      const key = `${role}:${text}`;
      if (seen.has(key)) return;
      seen.add(key);

      turns.push({
        role,
        text,
        index,
      });
    });

    return turns;
  },

  getInputText(platform) {
    const el = this.getInputElement(platform);
    if (!el) return '';
    if (el.getAttribute('contenteditable') === 'true') {
      return el.innerText || el.textContent || '';
    }
    return el.value || el.innerText || '';
  },

  setInputText(platform, text) {
    const el = this.getInputElement(platform);
    if (!el) return;
    if (el.getAttribute('contenteditable') === 'true') {
      el.innerHTML = '';
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },

  getSubmitContainer(platform) {
    if (!platform?.formSelector) return null;
    return this._pickPreferredElement(platform.formSelector, this._isVisible);
  },

  _pickPreferredElement(selector, predicate) {
    const elements = this._getCandidates(selector);
    for (const el of elements) {
      if (!predicate || predicate.call(this, el)) return el;
    }
    return elements[0] || null;
  },

  _getCandidates(selector) {
    if (!selector || typeof document === 'undefined') return [];
    return Array.from(document.querySelectorAll(selector));
  },

  _extractText(el) {
    return (el?.innerText || el?.textContent || '').trim();
  },

  _matchesSelector(el, selector) {
    if (!el || !selector) return false;
    try {
      if (typeof el.matches === 'function' && el.matches(selector)) return true;
      if (typeof el.closest === 'function' && el.closest(selector)) return true;
    } catch (_) {
      return false;
    }
    return false;
  },

  _normalizeRole(role) {
    const raw = String(role || '').toLowerCase();
    if (!raw) return '';
    if (raw.includes('assistant') || raw.includes('bot') || raw.includes('model') || raw.includes('ai')) return 'assistant';
    if (raw.includes('user') || raw.includes('human') || raw.includes('prompt') || raw.includes('visitor')) return 'user';
    return '';
  },

  _inferMessageRole(platform, el) {
    if (platform?.assistantMessageSelector && this._matchesSelector(el, platform.assistantMessageSelector)) return 'assistant';
    if (platform?.userMessageSelector && this._matchesSelector(el, platform.userMessageSelector)) return 'user';

    const roleCandidates = [
      el?.getAttribute?.('data-message-author-role'),
      el?.getAttribute?.('data-role'),
      el?.getAttribute?.('data-author'),
      el?.getAttribute?.('author'),
      typeof el?.closest === 'function' ? el.closest('[data-message-author-role]')?.getAttribute?.('data-message-author-role') : '',
      typeof el?.closest === 'function' ? el.closest('[data-role]')?.getAttribute?.('data-role') : '',
      typeof el?.closest === 'function' ? el.closest('[data-author]')?.getAttribute?.('data-author') : '',
      el?.getAttribute?.('aria-label'),
      el?.className,
      el?.id,
    ];

    for (const candidate of roleCandidates) {
      const normalized = this._normalizeRole(candidate);
      if (normalized) return normalized;
    }

    if (!platform?.conversationSelector || platform.conversationSelector === platform.responseSelector) {
      return 'assistant';
    }

    return 'assistant';
  },

  _isUsableElement(el) {
    return !!el && this._isVisible(el) && !el.disabled && el.getAttribute('aria-hidden') !== 'true';
  },

  _isVisible(el) {
    if (!el) return false;
    const style = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) {
      return false;
    }
    const rect = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
    if (!rect) return true;
    return rect.width > 0 || rect.height > 0;
  },
};

if (typeof window !== 'undefined') window.SafePromptPlatforms = SafePromptPlatforms;
if (typeof module !== 'undefined') module.exports = { SafePromptPlatforms };
