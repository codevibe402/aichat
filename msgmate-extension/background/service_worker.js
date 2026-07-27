importScripts('./background-auth.js');

const DEFAULT_BACKEND_URL = 'https://aichat-9bwl.onrender.com';
const SCHEDULE_ALARM_PREFIX = 'msgmate-schedule-';
const SCHEDULE_CACHE_KEY = 'msgmate_schedule_cache';
const AI_CACHE_PREFIX = 'msgmate_ai_cache_';

// ── Auth status cache ──────────────────────────────────────────────────────
let cachedAuthStatus = null;
let authStatusExpiry = 0;

function getCachedAuthStatus() {
  if (cachedAuthStatus && Date.now() < authStatusExpiry) return cachedAuthStatus;
  return null;
}

// ── AI result cache (chrome.storage.session, cleared on browser restart) ───
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizeForCache(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}/g, '')
    .trim();
}

function makeCacheKey(platform, tone, messages, requestType) {
  const raw = [platform, tone, ...messages.map(m => `${m.sender}:${normalizeForCache(m.text)}`)].join('|');
  return AI_CACHE_PREFIX + hashString(raw) + '_' + requestType;
}

async function getCachedAIResult(key) {
  const stored = await chrome.storage.session.get(key);
  return stored[key] || null;
}

async function setCachedAIResult(key, data) {
  await chrome.storage.session.set({ [key]: data });
}

// ── Start up ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith(SCHEDULE_ALARM_PREFIX)) {
    const scheduleId = alarm.name.slice(SCHEDULE_ALARM_PREFIX.length);
    handleDueSchedule(scheduleId).catch(error => {
      console.warn('[MsgMate] Schedule alarm handler failed:', error);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = message?.action;

  if (action === 'READ_CHAT') {
    relayReadChat(sender)
      .then(sendResponse)
      .catch((error) => sendResponse({ platform: 'unknown', messages: [], error: error.message }));
    return true;
  }

  if (action === 'getAuthStatus') {
    const cached = getCachedAuthStatus();
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
    testBackend()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (action === 'generateReplies') {
    generateReplies(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'summarizeChat') {
    summarizeChat(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'scheduleMessage') {
    scheduleMessage(message.data, sender)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (action === 'getScheduled') {
    getScheduled()
      .then(sendResponse)
      .catch(() => sendResponse([]));
    return true;
  }

  if (action === 'cancelSchedule') {
    cancelSchedule(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (action === 'getImportant') {
    getImportant()
      .then(sendResponse)
      .catch(() => sendResponse([]));
    return true;
  }

  if (action === 'saveImportant') {
    saveImportant(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'markImportantRead') {
    markImportantRead(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'deleteImportant') {
    deleteImportant(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'getTasks') {
    getTasks()
      .then(sendResponse)
      .catch(() => sendResponse([]));
    return true;
  }

  if (action === 'saveTask') {
    saveTask(message.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'completeTask') {
    completeTask(message.id, message.completed)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (action === 'deleteTask') {
    deleteTask(message.id)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  return false;
});

async function relayReadChat(sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { platform: 'unknown', messages: [] };
  return chrome.tabs.sendMessage(tabId, { action: 'READ_CHAT' });
}

async function testBackend() {
  const response = await fetch(`${DEFAULT_BACKEND_URL}/api/health`);
  const data = await readJson(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Backend returned ${response.status}`);
  }
  return { ok: true };
}

// ── AI Reply Generation (with local cache) ─────────────────────────────────
async function generateReplies(data = {}) {
  const messages = normalizeMessages(data.messages, data.context);
  const cacheKey = makeCacheKey(data.platform, data.tone || 'friendly', messages, 'replies');

  const cached = await getCachedAIResult(cacheKey);
  if (cached) return cached;

  const result = await requestBackend('/api/ai/replies', {
    method: 'POST',
    body: JSON.stringify({
      platform: data.platform,
      tone: data.tone || 'friendly',
      messages,
    }),
  });

  await setCachedAIResult(cacheKey, result);
  return result;
}

// ── Summarize Chat (with local cache) ──────────────────────────────────────
async function summarizeChat(data = {}) {
  const conversation = data.conversation || '';
  const cacheKey = AI_CACHE_PREFIX + hashString(normalizeForCache(conversation)) + '_summary';

  const cached = await getCachedAIResult(cacheKey);
  if (cached) return cached;

  const result = await requestBackend('/api/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ conversation }),
  });

  await setCachedAIResult(cacheKey, result);
  return result;
}

// ── Schedule Message — register chrome.alarm on successful create ──────────
async function scheduleMessage(data = {}, sender) {
  const sendAt = new Date(data.sendAt).toISOString();
  const body = {
    platform: data.platform,
    text: data.text,
    targetUrl: sender?.tab?.url,
    sendAt,
  };

  const result = await requestBackend('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const schedule = result.schedule;

  const dueAt = new Date(schedule.sendAt || data.sendAt).getTime();
  if (dueAt > Date.now()) {
    chrome.alarms.create(SCHEDULE_ALARM_PREFIX + schedule.id, { when: dueAt });
  }

  const cache = await readScheduleCache();
  const schedules = [schedule, ...(cache?.schedules || [])];
  await writeScheduleCache(schedules);

  return { success: true, schedule };
}

// ── Handle a due schedule alarm ────────────────────────────────────────────
async function handleDueSchedule(scheduleId) {
  let schedule;
  try {
    const result = await requestBackend(`/api/schedules/${encodeURIComponent(scheduleId)}`);
    schedule = result;
  } catch {
    const cache = await readScheduleCache();
    schedule = cache?.schedules?.find(s => s.id === scheduleId);
  }
  if (!schedule || schedule.status === 'CANCELLED' || schedule.status === 'SENT') return;

  await chrome.notifications.create(`msgmate-schedule-${scheduleId}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'MsgMate scheduled message',
    message: schedule.text || 'A scheduled message is due.',
  });

  const cache = await readScheduleCache();
  if (cache?.schedules?.length) {
    const schedules = cache.schedules.map(s =>
      s.id === scheduleId ? { ...s, status: 'SENT', sentAt: new Date().toISOString() } : s
    );
    await writeScheduleCache(schedules);
  }
}

// ── Get Scheduled — re-register alarms for pending that lack one ───────────
async function getScheduled() {
  const status = getCachedAuthStatus() || await self.MsgMateClerk.getClerkStatus();
  if (!status.signedIn) {
    const cache = await readScheduleCache();
    return cache?.schedules || [];
  }

  const result = await requestBackend('/api/schedules');
  const schedules = result.schedules || [];
  await writeScheduleCache(schedules);

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
async function cancelSchedule(id) {
  if (!id) throw new Error('Missing schedule id');
  await requestBackend(`/api/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });

  chrome.alarms.clear(SCHEDULE_ALARM_PREFIX + id);

  const cache = await readScheduleCache();
  if (cache?.schedules?.length) {
    const schedules = cache.schedules.map((s) =>
      s.id === id ? { ...s, status: 'CANCELLED', cancelledAt: new Date().toISOString() } : s
    );
    await writeScheduleCache(schedules);
  }

  return { success: true };
}

// ── Important Messages ─────────────────────────────────────────────────────
async function getImportant() {
  const data = await requestBackend('/api/important');
  return data.messages || [];
}

async function saveImportant(data = {}) {
  const result = await requestBackend('/api/important', {
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

async function markImportantRead(id) {
  return requestBackend(`/api/important/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead: true }),
  });
}

async function deleteImportant(id) {
  return requestBackend(`/api/important/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Tasks ──────────────────────────────────────────────────────────────────
async function getTasks() {
  const data = await requestBackend('/api/tasks');
  return data.tasks || [];
}

async function saveTask(data = {}) {
  const result = await requestBackend('/api/tasks', {
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

async function completeTask(id, completed = true) {
  return requestBackend(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isCompleted: completed }),
  });
}

async function deleteTask(id) {
  return requestBackend(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Schedule cache helpers ─────────────────────────────────────────────────
async function readScheduleCache() {
  const stored = await chrome.storage.local.get(SCHEDULE_CACHE_KEY);
  return stored[SCHEDULE_CACHE_KEY] || null;
}

async function writeScheduleCache(schedules) {
  await chrome.storage.local.set({
    [SCHEDULE_CACHE_KEY]: {
      schedules,
      fetchedAt: Date.now(),
      nextDueAt: computeNextDueAt(schedules),
    },
  });
}

function computeNextDueAt(schedules) {
  const pendingTimes = schedules
    .filter((s) => s.status === 'PENDING')
    .map((s) => new Date(s.sendAt).getTime())
    .filter((t) => Number.isFinite(t));
  return pendingTimes.length > 0 ? Math.min(...pendingTimes) : null;
}

// ── Backend request with session cookie ────────────────────────────────────
async function requestBackend(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let attempts = 0;
  const maxRetries = 1;

  while (true) {
    attempts++;
    const response = await fetch(`${DEFAULT_BACKEND_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    const data = await readJson(response);

    if (response.ok) return data;

    if (response.status === 401) {
      chrome.storage.local.remove('msgmate_auth_status');
      throw new Error(data?.error || 'Session expired. Please sign in again.');
    }

    if (attempts > maxRetries || response.status < 500) {
      throw new Error(data?.error || `Backend returned ${response.status}`);
    }
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeMessages(messages, context) {
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