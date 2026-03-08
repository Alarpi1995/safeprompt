/**
 * SafePrompt - Browser Compatibility Layer
 * Provides a unified API across Chrome, Firefox, and Edge.
 * Edge uses Chrome APIs natively (Chromium-based).
 * Firefox uses browser.* with Promises instead of chrome.* with callbacks.
 */

(function () {
  'use strict';

  // Detect browser environment
  const isFirefox = typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined';
  const isChrome = typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined';

  // If neither is available (e.g., test environment), create a no-op
  if (!isFirefox && !isChrome) {
    const noop = {
      isFirefox: false,
      isChrome: false,
      isEdge: false,
      browserName: 'unknown',
      storage: { sync: { get: () => Promise.resolve({}), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }, local: { get: () => Promise.resolve({}), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }, onChanged: { addListener: () => {} } },
      runtime: { sendMessage: () => Promise.resolve(), onMessage: { addListener: () => {} }, onInstalled: { addListener: () => {} }, openOptionsPage: () => {}, getURL: (p) => p, lastError: null, id: '' },
      action: { setBadgeText: () => Promise.resolve(), setBadgeBackgroundColor: () => Promise.resolve() },
      tabs: { query: () => Promise.resolve([]), create: () => Promise.resolve(), sendMessage: () => Promise.resolve() },
      contextMenus: { create: () => {}, removeAll: (cb) => cb?.(), onClicked: { addListener: () => {} } },
    };
    if (typeof window !== 'undefined') window.SafePromptBrowser = noop;
    if (typeof globalThis !== 'undefined') globalThis.SafePromptBrowser = noop;
    if (typeof module !== 'undefined') module.exports = { SafePromptBrowser: noop };
    return;
  }

  const isEdge = isChrome && navigator.userAgent.includes('Edg/');

  /**
   * Wraps a Chrome callback-style API method into a Promise-based one.
   * Firefox already uses Promises, so we just return the method directly.
   */
  function promisify(api, method) {
    if (isFirefox) {
      return (...args) => {
        try {
          return api[method](...args);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    }
    // Chrome/Edge: wrap callback into Promise
    return (...args) => new Promise((resolve, reject) => {
      try {
        api[method](...args, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // Build unified storage API
  function buildStorageArea(area) {
    const nativeArea = isFirefox ? browser.storage[area] : chrome.storage[area];
    if (!nativeArea) return { get: () => Promise.resolve({}), set: () => Promise.resolve() };
    return {
      get: promisify(nativeArea, 'get'),
      set: promisify(nativeArea, 'set'),
      remove: promisify(nativeArea, 'remove'),
      clear: promisify(nativeArea, 'clear'),
    };
  }

  // Build unified runtime API
  const nativeRuntime = isFirefox ? browser.runtime : chrome.runtime;

  const unifiedRuntime = {
    sendMessage: (...args) => {
      if (isFirefox) {
        return browser.runtime.sendMessage(...args).catch(() => undefined);
      }
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(...args, (response) => {
          resolve(response);
        });
      });
    },
    onMessage: {
      addListener: (listener) => {
        if (isFirefox) {
          // Firefox listeners can return a Promise
          browser.runtime.onMessage.addListener((msg, sender) => {
            return new Promise((resolve) => {
              listener(msg, sender, resolve);
            });
          });
        } else {
          chrome.runtime.onMessage.addListener(listener);
        }
      },
    },
    onInstalled: nativeRuntime.onInstalled || { addListener: () => {} },
    openOptionsPage: () => {
      if (isFirefox) {
        browser.runtime.openOptionsPage();
      } else {
        chrome.runtime.openOptionsPage();
      }
    },
    getURL: (path) => {
      if (isFirefox) return browser.runtime.getURL(path);
      return chrome.runtime.getURL(path);
    },
    get lastError() {
      if (isFirefox) return null; // Firefox uses Promises, no lastError
      return chrome.runtime.lastError;
    },
    get id() {
      return nativeRuntime.id;
    },
  };

  // Build unified tabs API
  const unifiedTabs = {
    query: (...args) => {
      if (isFirefox) return browser.tabs.query(...args);
      return new Promise((resolve) => {
        chrome.tabs.query(...args, resolve);
      });
    },
    create: (opts) => {
      if (isFirefox) return browser.tabs.create(opts);
      return new Promise((resolve) => {
        chrome.tabs.create(opts, resolve);
      });
    },
    sendMessage: (tabId, message) => {
      if (isFirefox) return browser.tabs.sendMessage(tabId, message).catch(() => undefined);
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          resolve(response);
        });
      });
    },
  };

  // Build unified action API (browserAction for Firefox MV2, action for MV3)
  const nativeAction = isFirefox
    ? (browser.action || browser.browserAction)
    : (chrome.action || chrome.browserAction);

  const unifiedAction = nativeAction ? {
    setBadgeText: (opts) => {
      if (isFirefox) return nativeAction.setBadgeText(opts);
      return new Promise((resolve) => { nativeAction.setBadgeText(opts, resolve); });
    },
    setBadgeBackgroundColor: (opts) => {
      if (isFirefox) return nativeAction.setBadgeBackgroundColor(opts);
      return new Promise((resolve) => { nativeAction.setBadgeBackgroundColor(opts, resolve); });
    },
  } : {
    setBadgeText: () => Promise.resolve(),
    setBadgeBackgroundColor: () => Promise.resolve(),
  };

  // Build unified contextMenus API
  const nativeMenus = isFirefox ? browser.contextMenus : chrome.contextMenus;
  const unifiedContextMenus = nativeMenus ? {
    create: (opts) => nativeMenus.create(opts),
    removeAll: (cb) => {
      if (isFirefox) {
        return browser.contextMenus.removeAll().then(cb);
      }
      return chrome.contextMenus.removeAll(cb);
    },
    onClicked: nativeMenus.onClicked || { addListener: () => {} },
  } : {
    create: () => {},
    removeAll: (cb) => cb?.(),
    onClicked: { addListener: () => {} },
  };

  // Build unified storage.onChanged
  const nativeStorage = isFirefox ? browser.storage : chrome.storage;

  const unified = {
    isFirefox,
    isChrome: isChrome && !isEdge,
    isEdge,
    browserName: isFirefox ? 'Firefox' : (isEdge ? 'Edge' : 'Chrome'),
    storage: {
      sync: buildStorageArea('sync'),
      local: buildStorageArea('local'),
      onChanged: nativeStorage?.onChanged || { addListener: () => {} },
    },
    runtime: unifiedRuntime,
    action: unifiedAction,
    tabs: unifiedTabs,
    contextMenus: unifiedContextMenus,
  };

  // Export
  if (typeof window !== 'undefined') window.SafePromptBrowser = unified;
  if (typeof globalThis !== 'undefined') globalThis.SafePromptBrowser = unified;
  if (typeof module !== 'undefined') module.exports = { SafePromptBrowser: unified };
})();
