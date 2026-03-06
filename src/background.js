/**
 * SafePrompt - Background Service Worker
 * Handles badge updates, context menu, and extension lifecycle.
 */

// Badge update from content scripts
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'updateBadge' && sender.tab) {
    const count = msg.count || 0;
    const text = count > 0 ? String(count) : '';
    const color = count > 0 ? '#ef4444' : '#22c55e';

    chrome.action.setBadgeText({ text, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color, tabId: sender.tab.id });
  }
});

// Set default badge and create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

  // Right-click context menu for manual masking
  chrome.contextMenus.create({
    id: 'safeprompt-mask',
    title: 'Mask with SafePrompt',
    contexts: ['selection'],
  });

  // Right-click to scan selected text
  chrome.contextMenus.create({
    id: 'safeprompt-scan',
    title: 'Scan with SafePrompt',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  if (info.menuItemId === 'safeprompt-mask' || info.menuItemId === 'safeprompt-scan') {
    chrome.tabs.sendMessage(tab.id, {
      type: info.menuItemId === 'safeprompt-mask' ? 'contextMask' : 'contextScan',
      text: info.selectionText,
    });
  }
});
