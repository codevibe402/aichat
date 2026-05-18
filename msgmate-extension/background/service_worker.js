// MsgMate Background Service Worker
// Handles scheduled messages via chrome.alarms API

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('msgmate_scheduled_')) return;

  const scheduleId = alarm.name.replace('msgmate_scheduled_', '');
  const { scheduledMessages = [] } = await chrome.storage.local.get('scheduledMessages');
  const msg = scheduledMessages.find(m => m.id === scheduleId);

  if (!msg) return;

  // Find or open the target tab
  const tabs = await chrome.tabs.query({ url: getPlatformPattern(msg.platform) });

  if (tabs.length > 0) {
    // Tab is open — inject and send
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: injectAndSend,
      args: [msg]
    });
  } else {
    // Open tab and queue the message
    const tab = await chrome.tabs.create({ url: getPlatformUrl(msg.platform), active: false });
    // Wait for load then send
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: injectAndSend,
            args: [msg]
          });
        }, 3000);
      }
    });
  }

  // Mark as sent
  const updated = scheduledMessages.map(m =>
    m.id === scheduleId ? { ...m, status: 'sent', sentAt: Date.now() } : m
  );
  await chrome.storage.local.set({ scheduledMessages: updated });

  // Notify user
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'MsgMate — Message Sent!',
    message: `Scheduled message delivered on ${msg.platform}`
  });
});

function getPlatformPattern(platform) {
  const patterns = {
    gmail: 'https://mail.google.com/*',
    whatsapp: 'https://web.whatsapp.com/*',
    telegram: 'https://web.telegram.org/*',
    instagram: 'https://www.instagram.com/*',
    slack: 'https://app.slack.com/*',
    discord: 'https://discord.com/*',
    twitter: 'https://twitter.com/*',
    x: 'https://x.com/*',
    teams: 'https://teams.microsoft.com/*',
    googlechat: 'https://chat.google.com/*'
  };
  return patterns[platform] || '*://*/*';
}

function getPlatformUrl(platform) {
  const urls = {
    gmail: 'https://mail.google.com',
    whatsapp: 'https://web.whatsapp.com',
    telegram: 'https://web.telegram.org',
    instagram: 'https://www.instagram.com/direct/inbox/',
    slack: 'https://app.slack.com',
    discord: 'https://discord.com/channels/@me',
    twitter: 'https://twitter.com/messages',
    x: 'https://x.com/messages',
    teams: 'https://teams.microsoft.com',
    googlechat: 'https://chat.google.com'
  };
  return urls[platform] || 'https://google.com';
}

// This function runs in the page context to find the input and send
function injectAndSend(msg) {
  const selectors = {
    gmail: {
      compose: '[data-tooltip="Compose"]',
      input: '[aria-label="Message Body"]',
      send: '[data-tooltip*="Send"]'
    },
    whatsapp: {
      input: '[data-tab="10"][contenteditable="true"], [data-testid="conversation-compose-box-input"]',
      send: '[data-testid="send"], [data-icon="send"]'
    },
    telegram: {
      input: '.input-message-input[contenteditable="true"]',
      send: '.btn-send'
    },
    instagram: {
      input: '[placeholder="Message..."], [aria-label="Message"]',
      send: '[type="submit"]'
    },
    slack: {
      input: '[data-qa="message_input"] [contenteditable="true"]',
      send: '[data-qa="texty_send_button"]'
    },
    discord: {
      input: '[role="textbox"][data-slate-editor="true"]',
      send: null // Discord sends on Enter
    },
    twitter: {
      input: '[data-testid="dmComposerTextInput"]',
      send: '[data-testid="dmComposerSendButton"]'
    },
    x: {
      input: '[data-testid="dmComposerTextInput"]',
      send: '[data-testid="dmComposerSendButton"]'
    },
    teams: {
      input: '[data-tid="ckeditor"]',
      send: '[data-tid="send-message-button"]'
    },
    googlechat: {
      input: '[aria-label="Message"] [contenteditable]',
      send: '[aria-label="Send message"]'
    }
  };

  const sel = selectors[msg.platform];
  if (!sel) return;

  const inputEl = document.querySelector(sel.input);
  if (!inputEl) {
    console.warn('[MsgMate] Could not find input for', msg.platform);
    return;
  }

  // Focus and type the message
  inputEl.focus();

  // Handle contenteditable vs input
  if (inputEl.getAttribute('contenteditable') === 'true') {
    inputEl.textContent = msg.text;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(inputEl, msg.text);
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Wait briefly then send
  setTimeout(() => {
    if (sel.send) {
      const sendBtn = document.querySelector(sel.send);
      if (sendBtn) sendBtn.click();
    } else {
      // Send via Enter key (Discord, etc.)
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    }
  }, 800);
}

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'scheduleMessage') {
    scheduleMessage(req.data).then(sendResponse);
    return true;
  }
  if (req.action === 'cancelSchedule') {
    cancelSchedule(req.id).then(sendResponse);
    return true;
  }
  if (req.action === 'getScheduled') {
    chrome.storage.local.get('scheduledMessages').then(({ scheduledMessages = [] }) => {
      sendResponse(scheduledMessages);
    });
    return true;
  }
});

async function scheduleMessage(data) {
  const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  const { scheduledMessages = [] } = await chrome.storage.local.get('scheduledMessages');

  const newMsg = { ...data, id, status: 'pending', createdAt: Date.now() };
  scheduledMessages.push(newMsg);
  await chrome.storage.local.set({ scheduledMessages });

  const delayMs = data.sendAt - Date.now();
  if (delayMs > 0) {
    chrome.alarms.create(`msgmate_scheduled_${id}`, { when: data.sendAt });
  }

  return { success: true, id };
}

async function cancelSchedule(id) {
  chrome.alarms.clear(`msgmate_scheduled_${id}`);
  const { scheduledMessages = [] } = await chrome.storage.local.get('scheduledMessages');
  const updated = scheduledMessages.filter(m => m.id !== id);
  await chrome.storage.local.set({ scheduledMessages: updated });
  return { success: true };
}
