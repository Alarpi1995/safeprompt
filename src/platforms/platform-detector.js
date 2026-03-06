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
      formSelector: 'form',
    },
    claude: {
      name: 'Claude',
      hostnames: ['claude.ai'],
      inputSelector: '[contenteditable="true"].ProseMirror, div[contenteditable="true"]',
      submitSelector: 'button[aria-label="Send Message"], button[aria-label="Send message"]',
      responseSelector: '.font-claude-message, [data-is-streaming]',
      formSelector: 'fieldset, form',
    },
    gemini: {
      name: 'Gemini',
      hostnames: ['gemini.google.com'],
      inputSelector: '.ql-editor, rich-textarea .textarea',
      submitSelector: 'button.send-button, button[aria-label="Send message"]',
      responseSelector: '.response-content, .model-response-text',
      formSelector: 'form',
    },
    copilot: {
      name: 'Copilot',
      hostnames: ['copilot.microsoft.com'],
      inputSelector: '#searchbox, textarea',
      submitSelector: 'button[aria-label="Submit"]',
      responseSelector: '.ac-textBlock',
      formSelector: 'form',
    },
    deepseek: {
      name: 'DeepSeek',
      hostnames: ['chat.deepseek.com'],
      inputSelector: 'textarea#chat-input, textarea',
      submitSelector: 'button[data-testid="send-button"], div[role="button"]',
      responseSelector: '.ds-markdown, .markdown-body',
      formSelector: 'form',
    },
    perplexity: {
      name: 'Perplexity',
      hostnames: ['www.perplexity.ai'],
      inputSelector: 'textarea[placeholder]',
      submitSelector: 'button[aria-label="Submit"]',
      responseSelector: '.prose, .markdown',
      formSelector: 'form',
    },
    grok: {
      name: 'Grok',
      hostnames: ['grok.x.ai'],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      responseSelector: '.message-content',
      formSelector: 'form',
    },
    poe: {
      name: 'Poe',
      hostnames: ['poe.com'],
      inputSelector: 'textarea[class*="TextArea"]',
      submitSelector: 'button[class*="SendButton"]',
      responseSelector: '.Message_botMessageBubble__aYctV, [class*="Message_botMessage"]',
      formSelector: 'form, footer',
    },
    mistral: {
      name: 'Mistral',
      hostnames: ['chat.mistral.ai'],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      responseSelector: '.prose',
      formSelector: 'form',
    },
    huggingface: {
      name: 'HuggingChat',
      hostnames: ['huggingface.co'],
      inputSelector: 'textarea[placeholder]',
      submitSelector: 'button[type="submit"]',
      responseSelector: '.prose',
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
    return document.querySelector(platform.inputSelector);
  },

  getSubmitButton(platform) {
    if (!platform) return null;
    return document.querySelector(platform.submitSelector);
  },

  getResponseElements(platform) {
    if (!platform) return [];
    return document.querySelectorAll(platform.responseSelector);
  },

  getInputText(platform) {
    const el = this.getInputElement(platform);
    if (!el) return '';
    // Handle contenteditable (Claude uses ProseMirror)
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
      // Trigger input event for frameworks
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Use native setter to trigger React/Vue state updates
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
};

if (typeof window !== 'undefined') window.SafePromptPlatforms = SafePromptPlatforms;
if (typeof module !== 'undefined') module.exports = { SafePromptPlatforms };
