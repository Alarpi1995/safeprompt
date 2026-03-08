/**
 * SafePrompt - Browser Compatibility Layer Tests
 */

describe('SafePromptBrowser (no browser APIs)', () => {
  let SafePromptBrowser;

  beforeAll(() => {
    // In test environment, no chrome/browser APIs exist
    // The module exports via globalThis and module.exports
    const mod = require('../src/core/browser-compat.js');
    SafePromptBrowser = mod.SafePromptBrowser || globalThis.SafePromptBrowser;
  });

  test('exports SafePromptBrowser', () => {
    expect(SafePromptBrowser).toBeDefined();
  });

  test('has browser detection flags', () => {
    expect(typeof SafePromptBrowser.isFirefox).toBe('boolean');
    expect(typeof SafePromptBrowser.isChrome).toBe('boolean');
    expect(typeof SafePromptBrowser.isEdge).toBe('boolean');
  });

  test('storage API returns promises', async () => {
    const data = await SafePromptBrowser.storage.sync.get({});
    expect(data).toEqual({});

    await SafePromptBrowser.storage.sync.set({ test: 1 });
    // No error thrown

    const localData = await SafePromptBrowser.storage.local.get({});
    expect(localData).toEqual({});
  });

  test('runtime API has expected methods', () => {
    expect(typeof SafePromptBrowser.runtime.sendMessage).toBe('function');
    expect(typeof SafePromptBrowser.runtime.onMessage.addListener).toBe('function');
    expect(typeof SafePromptBrowser.runtime.openOptionsPage).toBe('function');
    expect(typeof SafePromptBrowser.runtime.getURL).toBe('function');
  });

  test('runtime.getURL returns the path', () => {
    expect(SafePromptBrowser.runtime.getURL('test.html')).toBe('test.html');
  });

  test('tabs API has expected methods', async () => {
    expect(typeof SafePromptBrowser.tabs.query).toBe('function');
    expect(typeof SafePromptBrowser.tabs.create).toBe('function');
    expect(typeof SafePromptBrowser.tabs.sendMessage).toBe('function');

    const tabs = await SafePromptBrowser.tabs.query({});
    expect(tabs).toEqual([]);
  });

  test('action API has expected methods', async () => {
    expect(typeof SafePromptBrowser.action.setBadgeText).toBe('function');
    expect(typeof SafePromptBrowser.action.setBadgeBackgroundColor).toBe('function');

    await SafePromptBrowser.action.setBadgeText({ text: '1' });
    // No error thrown
  });

  test('contextMenus API has expected methods', () => {
    expect(typeof SafePromptBrowser.contextMenus.create).toBe('function');
    expect(typeof SafePromptBrowser.contextMenus.removeAll).toBe('function');
  });
});
