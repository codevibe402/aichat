importScripts('./background-auth.js');

// ── Constants (private to this module) ───────────────────────────────────────
const DEFAULT_BACKEND_URL = 'https://aichat-9bwl.onrender.com';
const SCHEDULE_ALARM_PREFIX = 'msgmate-schedule-';
const SCHEDULE_CACHE_KEY = 'msgmate_schedule_cache';
const AI_CACHE_PREFIX = 'msgmate_ai_cache_';

// ── Auth status cache ──────────────────────────────────────────────────────
let cachedAuthStatus = null;
let authStatusExpiry = 0;

function _getCachedAuthStatus() {
  if (cachedAuthStatus && Date.now() < authStatusExpiry) return cachedAuthStatus;
  return null;
}

// ── Private: AI result cache helpers (chrome.storage.session) ───────────────

function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function _normalizeForCache(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}/g, '')
    .trim();
}

function _makeCacheKey(platform, tone, messages, requestType) {
  const raw = [platform, tone, ...messages.map(m => `${m.sender}:${_normalizeForCache(m.text)}`)].join('|');
  return AI_CACHE_PREFIX + _hashString(raw) + '_' + requestType;
}

async function _getCachedAIResult(key) {
  const stored = await chrome.storage.session.get(key);
  return stored[key] || null;
}

async function _setCachedAIResult(key, data) {
  await chrome.storage.session.set({ [key]: data });
}

// ── Private: Schedule cache helpers ─────────────────────────────────────────

async function _readScheduleCache() {
  const stored = await chrome.storage.local.get(SCHEDULE_CACHE_KEY);
  return stored[SCHEDULE_CACHE_KEY] || null;
}

async function _writeScheduleCache(schedules) {
  await chrome.storage.local.set({
    [SCHEDULE_CACHE_KEY]: {
      schedules,
      fetchedAt: Date.now(),
      nextDueAt: _computeNextDueAt(schedules),
    },
  });
}

function _computeNextDueAt(schedules) {
  const pendingTimes = schedules
    .filter((s) => s.status === 'PENDING')
    .map((s) => new Date(s.sendAt).getTime())
    .filter((t) => Number.isFinite(t));
  return pendingTimes.length > 0 ? Math.min(...pendingTimes) : null;
}

// ── Private: HTTP helpers ──────────────────────────────────────────────────

async function _readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * @private Makes an authenticated fetch to the backend with a 25s timeout and 1 retry on 5xx.
 * Uses credentials:'include' so the session cookie is sent automatically.
 * This function handles session cookies and must never be exposed to content scripts or web pages.
 */
async function _requestBackend(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let attempts = 0;
  const maxRetries = 1;

  while (true) {
    attempts++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`${DEFAULT_BACKEND_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await _readJson(response);

      if (response.ok) return data;

      if (response.status === 401) {
        chrome.storage.local.remove('msgmate_auth_status');
        throw new Error(data?.error || 'Session expired. Please sign in again.');
      }

      if (attempts > maxRetries || response.status < 500) {
        throw new Error(data?.error || `Backend returned ${response.status}`);
      }
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('Backend request timed out');
      if (attempts > maxRetries) throw err;
    }
  }
}

// ── Private: Message normalization ──────────────────────────────────────────

function _normalizeMessages(messages, context) {
  if (Array.isArray(messages) && messages.length > 0) {
    return messages
      .slice(-10)
      .map((message) => ({
        sender: message.sender === 'me' ? 'me' : 'them',
        text: String(message.text || '').trim(),
      }))
      .filter((message) => message.text.length > 0);
  }

  const text = String(context || '').trim();
  if (!text) throw new Error('No chat context found');
  return [{ sender: 'them', text }];
}

// ── Start up ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith(SCHEDULE_ALARM_PREFIX)) {
    const scheduleId = alarm.name.slice(SCHEDULE_ALARM_PREFIX.length);
    _handleDueSchedule(scheduleId).catch(error => {
      console.warn('[MsgMate] Schedule alarm handler failed:', error);
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Public message router
// Receives messages from content scripts and popup via chrome.runtime.sendMessage.
// Each action below delegates to an internal handler that calls _requestBackend.
// ────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = message?.action;

  if (action === 'scanUnreadMail') {
    _scanUnreadMail(message.keywords)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (action === 'READ_CHAT') {
    _relayReadChat(sender)
      .then(sendResponse)
      .catch((error) => sendResponse({ platform: 'unknown', messages: [], error: error.message }));
    return true;
  }

  if (action === 'getAuthStatus') {
    const cached = _getCachedAuthStatus();
    if (cached) { sendResponse(cached); return; }
    (async () => {
      try {
        const status = await self.MsgMateClerk.getClerkStatus();
        if (status.signedIn) {
          cachedAuthStatus = status;
          authStatusExpiry = Date.now() + 60000;
          sendResponse(status);
          return;
        }
      } catch {}
      sendResponse({ signedIn: false, email: null });
    })();
    return true;
  }

  if (action === 'testBackend') {
    _testBackend()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (action === 'generateReplies') {
    _generateReplies(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'summarizeChat') {
    _summarizeChat(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'detectImportant') {
    _detectImportant(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'scheduleMessage') {
    _scheduleMessage(message.data, sender)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (action === 'getScheduled') {
    _getScheduled()
      .then(sendResponse)
      .catch(() => sendResponse([]));
    return true;
  }

  if (action === 'cancelSchedule') {
    _cancelSchedule(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (action === 'getImportant') {
    _getImportant()
      .then(sendResponse)
      .catch(() => sendResponse([]));
    return true;
  }

  if (action === 'saveImportant') {
    _saveImportant(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'markImportantRead') {
    _markImportantRead(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'deleteImportant') {
    _deleteImportant(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'getTasks') {
    _getTasks()
      .then(sendResponse)
      .catch(() => sendResponse([]));
    return true;
  }

  if (action === 'saveTask') {
    _saveTask(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'completeTask') {
    _completeTask(message.id, message.completed)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'deleteTask') {
    _deleteTask(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  return false;
});

// ── Internal message handlers (private) ─────────────────────────────────────

async function _scanUnreadMail(keywords) {
  const gmailTabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });
  if (!gmailTabs.length) {
    return {
      ok: false,
      code: 'GMAIL_NOT_OPEN',
      error: 'Open Gmail in a desktop Chrome tab to scan unread mail.',
    };
  }

  const tab = gmailTabs
    .sort((a, b) => Number(b.active) - Number(a.active) || (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];

  let scan;
  try {
    scan = await chrome.tabs.sendMessage(tab.id, { action: 'scanUnreadMail' });
  } catch {
    return {
      ok: false,
      code: 'GMAIL_NOT_READY',
      error: 'Gmail is no longer available or is not ready. Open or refresh the Gmail tab and try again.',
    };
  }

  if (!scan?.supported) {
    return { ok: false, code: 'UNSUPPORTED', error: scan?.reason || 'This Gmail tab cannot be scanned.' };
  }

  const terms = String(keywords || '')
    .split(/[,\n]/)
    .map((term) => term.trim().toLocaleLowerCase())
    .filter(Boolean)
    .slice(0, 20);
  const matches = scan.threads.filter((thread) => {
    if (!terms.length) return true;
    const searchable = `${thread.sender} ${thread.subject} ${thread.snippet}`.toLocaleLowerCase();
    return terms.some((term) => searchable.includes(term));
  });

  const previous = await chrome.storage.session.get('msgmate_gmail_scan_account');
  const previousAccount = previous.msgmate_gmail_scan_account || null;
  const accountChanged = Boolean(
    previousAccount && scan.accountEmail && previousAccount !== scan.accountEmail
  );
  if (scan.accountEmail) {
    await chrome.storage.session.set({ msgmate_gmail_scan_account: scan.accountEmail });
  }

  return {
    ok: true,
    accountEmail: scan.accountEmail,
    accountChanged,
    keywordCount: terms.length,
    scannedCount: scan.threads.length,
    threads: matches,
  };
}

async function _relayReadChat(sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { platform: 'unknown', messages: [] };
  return chrome.tabs.sendMessage(tabId, { action: 'READ_CHAT' });
}

async function _testBackend() {
  const response = await fetch(`${DEFAULT_BACKEND_URL}/api/health`);
  const data = await _readJson(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Backend returned ${response.status}`);
  }
  return { ok: true };
}

async function _generateReplies(data = {}) {
  const messages = _normalizeMessages(data.messages, data.context);
  const cacheKey = _makeCacheKey(data.platform, data.tone || 'friendly', messages, 'replies');

  const cached = await _getCachedAIResult(cacheKey);
  if (cached) return cached;

  const result = await _requestBackend('/api/ai/replies', {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      tone: data.tone || 'friendly',
      messages,
    }),
  });

  await _setCachedAIResult(cacheKey, result);
  return result;
}

async function _summarizeChat(data = {}) {
  const conversation = data.conversation || '';
  const cacheKey = AI_CACHE_PREFIX + _hashString(_normalizeForCache(conversation)) + '_summary';

  const cached = await _getCachedAIResult(cacheKey);
  if (cached) return cached;

  const result = await _requestBackend('/api/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ conversation }),
  });

  await _setCachedAIResult(cacheKey, result);
  return result;
}

// ── Schedule Message — register chrome.alarm on successful create ──────────
async function _scheduleMessage(data = {}, sender) {
  const sendAt = new Date(data.sendAt).toISOString();
  const body = {
    platform: data.platform,
    text: data.text,
    targetUrl: sender?.tab?.url,
    sendAt,
  };

  const result = await _requestBackend('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const schedule = result.schedule;

  const dueAt = new Date(schedule.sendAt || data.sendAt).getTime();
  if (dueAt > Date.now()) {
    chrome.alarms.create(SCHEDULE_ALARM_PREFIX + schedule.id, { when: dueAt });
  }

  const cache = await _readScheduleCache();
  const schedules = [schedule, ...(cache?.schedules || [])];
  await _writeScheduleCache(schedules);

  return { success: true, schedule };
}

// ── Handle a due schedule alarm ────────────────────────────────────────────
async function _handleDueSchedule(scheduleId) {
  let schedule;
  try {
    const result = await _requestBackend(`/api/schedules/${encodeURIComponent(scheduleId)}`);
    schedule = result;
  } catch {
    const cache = await _readScheduleCache();
    schedule = cache?.schedules?.find(s => s.id === scheduleId);
  }
  if (!schedule || schedule.status === 'CANCELLED' || schedule.status === 'SENT') return;

  await chrome.notifications.create(`msgmate-schedule-${scheduleId}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'MsgMate scheduled message',
    message: schedule.text || 'A scheduled message is due.',
  });

  const cache = await _readScheduleCache();
  if (cache?.schedules?.length) {
    const schedules = cache.schedules.map(s =>
      s.id === scheduleId ? { ...s, status: 'SENT', sentAt: new Date().toISOString() } : s
    );
    await _writeScheduleCache(schedules);
  }
}

// ── Get Scheduled — re-register alarms for pending that lack one ───────────
async function _getScheduled() {
  const status = _getCachedAuthStatus() || await self.MsgMateClerk.getClerkStatus();
  if (!status.signedIn) {
    const cache = await _readScheduleCache();
    return cache?.schedules || [];
  }

  const result = await _requestBackend('/api/schedules');
  const schedules = result.schedules || [];
  await _writeScheduleCache(schedules);

  for (const s of schedules) {
    if (s.status !== 'PENDING') continue;
    const alarmName = SCHEDULE_ALARM_PREFIX + s.id;
    const existing = await chrome.alarms.get(alarmName);
    if (!existing) {
      const dueAt = new Date(s.sendAt).getTime();
      if (dueAt > Date.now()) {
        chrome.alarms.create(alarmName, { when: dueAt });
      }
    }
  }

  return schedules;
}

// ── Cancel Schedule — also cancel the chrome alarm ─────────────────────────
async function _cancelSchedule(id) {
  if (!id) throw new Error('Missing schedule id');
  await _requestBackend(`/api/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });

  chrome.alarms.clear(SCHEDULE_ALARM_PREFIX + id);

  const cache = await _readScheduleCache();
  if (cache?.schedules?.length) {
    const schedules = cache.schedules.map((s) =>
      s.id === id ? { ...s, status: 'CANCELLED', cancelledAt: new Date().toISOString() } : s
    );
    await _writeScheduleCache(schedules);
  }

  return { success: true };
}

// ── Important Messages ─────────────────────────────────────────────────────

async function _detectImportant(data = {}) {
  if (!data.messages?.length) return { messages: [], count: 0 };
  const result = await _requestBackend('/api/ai/detect-important', {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      messages: data.messages,
    }),
  });
  return result;
}

async function _getImportant() {
  const data = await _requestBackend('/api/important');
  return data.messages || [];
}

async function _saveImportant(data = {}) {
  const result = await _requestBackend('/api/important', {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      subject: data.subject,
      preview: data.preview,
      url: data.url,
      urgency: data.urgency || 'MEDIUM',
    }),
  });
  return result;
}

async function _markImportantRead(id) {
  return _requestBackend(`/api/important/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead: true }),
  });
}

async function _deleteImportant(id) {
  return _requestBackend(`/api/important/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Tasks ──────────────────────────────────────────────────────────────────

async function _getTasks() {
  const data = await _requestBackend('/api/tasks');
  return data.tasks || [];
}

async function _saveTask(data = {}) {
  const result = await _requestBackend('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      source: data.source,
      sourceUrl: data.sourceUrl,
      dueDate: data.dueDate,
    }),
  });
  return result;
}

async function _completeTask(id, completed = true) {
  return _requestBackend(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isCompleted: completed }),
  });
}

async function _deleteTask(id) {
  return _requestBackend(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
