const { SafePromptPlatforms } = require('../src/platforms/platform-detector');

function createElement({
  disabled = false,
  attrs = {},
  style = {},
  rect = { width: 10, height: 10 },
  text = '',
  className = '',
  id = '',
} = {}) {
  return {
    disabled,
    attrs,
    className,
    id,
    innerText: text,
    textContent: text,
    getAttribute(name) {
      return this.attrs[name];
    },
    getBoundingClientRect() {
      return rect;
    },
    matches(selector) {
      if (selector === '[data-message-author-role]') return !!this.attrs['data-message-author-role'];
      if (selector === '[data-role]') return !!this.attrs['data-role'];
      if (selector === '[data-author]') return !!this.attrs['data-author'];
      return false;
    },
    closest(selector) {
      if (this.matches(selector)) return this;
      return null;
    },
  };
}

describe('Platform detector helpers', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
  });

  test('prefers a visible input element over hidden matches', () => {
    const hidden = createElement({ style: { display: 'none', visibility: 'visible' }, rect: { width: 0, height: 0 } });
    const visible = createElement();

    global.window = {
      getComputedStyle: (el) => el === hidden
        ? { display: 'none', visibility: 'visible' }
        : { display: 'block', visibility: 'visible' },
    };
    global.document = {
      querySelectorAll: jest.fn(() => [hidden, visible]),
    };

    const platform = { inputSelector: 'textarea' };
    expect(SafePromptPlatforms.getInputElement(platform)).toBe(visible);
  });

  test('ignores disabled submit buttons when a usable one exists', () => {
    const disabled = createElement({ disabled: true });
    const enabled = createElement();

    global.window = {
      getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    };
    global.document = {
      querySelectorAll: jest.fn(() => [disabled, enabled]),
    };

    const platform = { submitSelector: 'button[type="submit"]' };
    expect(SafePromptPlatforms.getSubmitButton(platform)).toBe(enabled);
  });

  test('filters out hidden response elements', () => {
    const visible = createElement();
    const hidden = createElement({ rect: { width: 0, height: 0 } });

    global.window = {
      getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    };
    global.document = {
      querySelectorAll: jest.fn(() => [visible, hidden]),
    };

    const platform = { responseSelector: '.response' };
    expect(SafePromptPlatforms.getResponseElements(platform)).toEqual([visible]);
  });

  test('extracts conversation turns with inferred roles', () => {
    const user = createElement({ attrs: { 'data-message-author-role': 'user' }, text: 'My API key is key_abcdef1234567890abcdef' });
    const assistant = createElement({ attrs: { 'data-message-author-role': 'assistant' }, text: 'I can help redact that.' });

    global.window = {
      getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    };
    global.document = {
      querySelectorAll: jest.fn(() => [user, assistant]),
    };

    const platform = { conversationSelector: '[data-message-author-role]' };
    expect(SafePromptPlatforms.getConversationTurns(platform)).toEqual([
      { role: 'user', text: 'My API key is key_abcdef1234567890abcdef', index: 0 },
      { role: 'assistant', text: 'I can help redact that.', index: 1 },
    ]);
  });
});
