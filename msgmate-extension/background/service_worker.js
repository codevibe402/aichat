// MsgMate Background Service Worker
// Talks to the backend for AI, schedule storage, due-message polling, and status updates.

const DEFAULT_BACKEND_URL = 'http://localhost:3000';
const DUE_POLL_ALARM = 'msgmate_poll_due';

chrome.alarms.create(DUE_POLL_ALARM, { periodInMinutes: 1 });

chrome.runtime.onInstalled.addListener(async () => {
  await ensureClientConfig();
  chrome.alarms.create(DUE_POLL_ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureClientConfig();
  chrome.alarms.create(DUE_POLL_ALARM, { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === DUE_POLL_ALARM) {
    await processDueSchedules();
    return;
  }

  // Backward compatibility for schedules created before backend wiring.
  if (!alarm.name.startsWith('msgmate_scheduled_')) return;
});

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.action === 'generateReplies') {
    backendRequest('/api/ai/replies', {
      method: 'POST',
      body: req.data
    }).then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (req.action === 'summarizeChat') {
    backendRequest('/api/ai/summary', {
      method: 'POST',
      body: req.data
    }).then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (req.action === 'scheduleMessage') {
    createSchedule(req.data).then(sendResponse).catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (req.action === 'cancelSchedule') {
    cancelSchedule(req.id).then(sendResponse).catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (req.action === 'getScheduled') {
    getSchedules().then(sendResponse).catch(() => sendResponse([]));
    return true;
  }

  if (req.action === 'testBackend') {
    backendRequest('/api/health').then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

async function ensureClientConfig() {
  const { backendUrl, msgmateUserId } = await chrome.storage.local.get(['backendUrl', 'msgmateUserId']);
  const updates = {};

  if (!backendUrl) {
    updates.backendUrl = DEFAULT_BACKEND_URL;
  }

  if (!msgmateUserId) {
    updates.msgmateUserId = crypto.randomUUID();
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

async function getBackendConfig() {
  await ensureClientConfig();

  const {
    backendUrl = DEFAULT_BACKEND_URL,
    backendApiKey = '',
    msgmateUserId
  } = await chrome.storage.local.get(['backendUrl', 'backendApiKey', 'msgmateUserId']);

  if (!backendApiKey) {
    throw new Error('Backend API key missing. Save it from the MsgMate popup.');
  }

  return {
    backendUrl: backendUrl.replace(/\/$/, ''),
    backendApiKey,
    msgmateUserId
  };
}

async function backendRequest(path, options = {}) {
  const { backendUrl, backendApiKey, msgmateUserId } = await getBackendConfig();

  const response = await fetch(`${backendUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-msgmate-api-key': backendApiKey,
      'x-msgmate-user-id': msgmateUserId,
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Backend request failed with ${response.status}`);
  }

  return data;
}

async function createSchedule(data) {
  const result = await backendRequest('/api/schedules', {
    method: 'POST',
    body: {
      platform: data.platform,
      text: data.text,
      sendAt: new Date(data.sendAt).toISOString()
    }
  });

  return {
    success: true,
    id: result.schedule.id,
    schedule: normalizeSchedule(result.schedule)
  };
}

async function cancelSchedule(id) {
  await backendRequest(`/api/schedules/${id}`, { method: 'DELETE' });
  return { success: true };
}

async function getSchedules() {
  const result = await backendRequest('/api/schedules');
  return (result.schedules || []).map(normalizeSchedule);
}

async function processDueSchedules() {
  let due = [];

  try {
    const result = await backendRequest('/api/schedules/due');
    due = result.schedules || [];
  } catch (error) {
    console.warn('[MsgMate] Due schedule poll failed:', error.message);
    return;
  }

  for (const schedule of due) {
    await markScheduleStatus(schedule.id, 'SENDING');
    const delivery = await sendScheduledMessage(normalizeSchedule(schedule));

    if (delivery.success) {
      await markScheduleStatus(schedule.id, 'SENT');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'MsgMate - Message Sent',
        message: `Scheduled message delivered on ${schedule.platform}`
      });
    } else {
      await markScheduleStatus(schedule.id, delivery.status || 'FAILED', delivery.reason);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'MsgMate - Send Failed',
        message: delivery.reason || `Could not send message on ${schedule.platform}`
      });
    }
  }
}

async function markScheduleStatus(id, status, error) {
  try {
    await backendRequest(`/api/schedules/${id}/status`, {
      method: 'POST',
      body: { status, error }
    });
  } catch (err) {
    console.warn('[MsgMate] Could not update schedule status:', err.message);
  }
}

async function sendScheduledMessage(msg) {
  const tabs = await chrome.tabs.query({ url: getPlatformPattern(msg.platform) });
  const tab = tabs[0] || await chrome.tabs.create({ url: getPlatformUrl(msg.platform), active: false });

  if (!tabs[0]) {
    await waitForTabComplete(tab.id);
    await sleep(3000);
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectAndSend,
      args: [msg]
    });

    return results?.[0]?.result || { success: false, status: 'FAILED', reason: 'No injection result returned' };
  } catch (error) {
    return { success: false, status: 'FAILED', reason: error.message };
  }
}

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSchedule(schedule) {
  return {
    id: schedule.id,
    text: schedule.text,
    platform: schedule.platform,
    sendAt: new Date(schedule.sendAt).getTime(),
    status: String(schedule.status || 'pending').toLowerCase(),
    createdAt: new Date(schedule.createdAt || Date.now()).getTime(),
    sentAt: schedule.deliveredAt ? new Date(schedule.deliveredAt).getTime() : undefined,
    error: schedule.lastError
  };
}

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

// This function runs in the page context to find the input and send.
function injectAndSend(msg) {
  const selectors = {
    gmail: {
      input: '[aria-label="Message Body"]',
      send: '[data-tooltip*="Send"]'
    },
    whatsapp: {
      input: 'footer [contenteditable="true"][role="textbox"], [aria-label="Type a message"], [aria-label="Type a message"][contenteditable="true"], [data-tab="10"][contenteditable="true"], [data-lexical-editor="true"][contenteditable="true"]',
      send: '[aria-label="Send"], [data-testid="send"], [data-icon="send"], button span[data-icon="send"]'
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
      send: null
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
  if (!sel) {
    return { success: false, status: 'FAILED', reason: `Unsupported platform: ${msg.platform}` };
  }

  const inputEl = findBestInput(sel.input);
  if (!inputEl) {
    return { success: false, status: 'SELECTOR_FAILED', reason: `Could not find input for ${msg.platform}` };
  }

  insertIntoInput(inputEl, msg.text);

  if (sel.send) {
    const sendBtn = findSendButton(sel.send);
    if (!sendBtn) {
      return { success: false, status: 'SELECTOR_FAILED', reason: `Could not find send button for ${msg.platform}` };
    }
    sendBtn.click();
  } else {
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
  }

  return { success: true };
}

function findBestInput(selector) {
  const active = document.activeElement;
  if (active && typeof active.matches === 'function' && active.matches(selector) && isVisible(active)) {
    return active;
  }

  return Array.from(document.querySelectorAll(selector)).filter(isVisible).at(-1) || null;
}

function insertIntoInput(el, text) {
  el.focus();

  if (el.getAttribute('contenteditable') === 'true') {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const inserted = typeof document.execCommand === 'function'
      ? document.execCommand('insertText', false, text)
      : false;

    if (!inserted) {
      el.textContent = text;
    }

    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  const prototype = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (setter) {
    setter.call(el, text);
  } else {
    el.value = text;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function findSendButton(selector) {
  const direct = Array.from(document.querySelectorAll(selector)).filter(isVisible).at(-1);
  return direct?.closest('button') || direct || null;
}

function isVisible(el) {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
}
