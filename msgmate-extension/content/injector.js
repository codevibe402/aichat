// MsgMate Content Script — injected into all supported platforms
(function () {
  if (document.getElementById('msgmate-fab')) return; // already injected

  // ── Detect current platform ──────────────────────────────────────────────
  const PLATFORM_MAP = {
    'mail.google.com': 'gmail',
    'web.whatsapp.com': 'whatsapp',
    'web.telegram.org': 'telegram',
    'www.instagram.com': 'instagram',
    'app.slack.com': 'slack',
    'discord.com': 'discord',
    'twitter.com': 'twitter',
    'x.com': 'x',
    'teams.microsoft.com': 'teams',
    'chat.google.com': 'googlechat'
  };

  const PLATFORM_NAMES = {
    gmail: 'Gmail', whatsapp: 'WhatsApp', telegram: 'Telegram',
    instagram: 'Instagram', slack: 'Slack', discord: 'Discord',
    twitter: 'Twitter', x: 'X (Twitter)', teams: 'MS Teams', googlechat: 'Google Chat'
  };

  const currentPlatform = PLATFORM_MAP[location.hostname] || 'unknown';
  const platformName = PLATFORM_NAMES[currentPlatform] || 'Unknown';

  // ── Input selectors per platform ─────────────────────────────────────────
  const INPUT_SELECTORS = {
    gmail: '[aria-label="Message Body"][contenteditable="true"], [g_editable="true"][contenteditable="true"], div[role="textbox"][contenteditable="true"]',
    whatsapp: 'footer [contenteditable="true"][role="textbox"], [aria-label="Type a message"], [aria-label="Type a message"][contenteditable="true"], [data-tab="10"][contenteditable="true"], [data-lexical-editor="true"][contenteditable="true"]',
    telegram: '.input-message-input[contenteditable="true"]',
    instagram: '[placeholder="Message..."], [aria-label="Message"]',
    slack: '[data-qa="message_input"] [contenteditable="true"]',
    discord: '[role="textbox"][data-slate-editor="true"]',
    twitter: '[data-testid="dmComposerTextInput"]',
    x: '[data-testid="dmComposerTextInput"]',
    teams: '[data-tid="ckeditor"]',
    googlechat: '[aria-label="Message"] [contenteditable]'
  };

  let activeTab = 'ai';
  let selectedTone = 'friendly';
  let scheduledMessages = [];
  let aiLoading = false;

  // ── Build UI ──────────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.id = 'msgmate-fab';
  fab.title = 'MsgMate AI Assistant';
  fab.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 13H7v-2h4v2zm6 0h-4v-2h4v2zm0-4H7V9h10v2z"/>
  </svg>`;

  const panel = document.createElement('div');
  panel.id = 'msgmate-panel';
  panel.innerHTML = buildPanelHTML();

  document.body.appendChild(fab);
  document.body.appendChild(panel);
  hydrateAutoContext();

  // ── Event listeners ───────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible')) {
      refreshActiveTabData();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !fab.contains(e.target)) {
      panel.classList.remove('visible');
    }
  });

  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if (req.action !== 'openMsgmatePanel') return;

    if (req.tab && ['ai', 'schedule', 'summary', 'important'].includes(req.tab)) {
      activeTab = req.tab;
      renderActiveTab();
    }

    panel.classList.add('visible');
    refreshActiveTabData();
    sendResponse({ success: true });
  });

  // Tab switching
  panel.addEventListener('click', (e) => {
    const tab = e.target.closest('.msgmate-tab');
    if (tab) {
      activeTab = tab.dataset.tab;
      renderActiveTab();
    }

    // Tone selection
    const toneBtn = e.target.closest('.msgmate-tone-btn');
    if (toneBtn) {
      selectedTone = toneBtn.dataset.tone;
      panel.querySelectorAll('.msgmate-tone-btn').forEach(b => b.classList.remove('active'));
      toneBtn.classList.add('active');
    }

    // Generate AI reply
    if (e.target.id === 'msgmate-generate-btn') generateAIReply();

    // Use suggestion
    const chip = e.target.closest('.msgmate-suggestion-chip');
    if (chip) injectText(chip.textContent.trim());

    // Summarize
    if (e.target.id === 'msgmate-summarize-btn') summarizeChat();

    // Schedule message
    if (e.target.id === 'msgmate-schedule-btn') scheduleMessage();

    // Mark as Important
    if (e.target.id === 'msgmate-mark-important-btn' || e.target.closest('#msgmate-quick-important')) {
      markAsImportant();
    }

    // Dismiss important
    const dismissBtn = e.target.closest('.msgmate-important-dismiss');
    if (dismissBtn) dismissImportant(dismissBtn.dataset.id);

    // Cancel scheduled
    const cancelBtn = e.target.closest('.msgmate-cancel-btn');
    if (cancelBtn) cancelScheduled(cancelBtn.dataset.id);
  });

  // ── Panel HTML ────────────────────────────────────────────────────────────
  function buildPanelHTML() {
    return `
    <div class="msgmate-header">
      <div class="msgmate-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#a5b4fc">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
        </svg>
        MsgMate
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="msgmate-important-btn" id="msgmate-quick-important" title="Mark as important">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <span class="msgmate-platform-badge">${platformName}</span>
      </div>
    </div>
    <div class="msgmate-tabs">
      <button class="msgmate-tab active" data-tab="ai">✨ AI Reply</button>
      <button class="msgmate-tab" data-tab="important">⭐ Important</button>
      <button class="msgmate-tab" data-tab="schedule">⏰ Schedule</button>
      <button class="msgmate-tab" data-tab="summary">📋 Summary</button>
    </div>
    <div class="msgmate-body" id="msgmate-body">
      ${renderTabContent('ai')}
    </div>`;
  }

  function renderActiveTab() {
    panel.querySelectorAll('.msgmate-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === activeTab);
    });
    document.getElementById('msgmate-body').innerHTML = renderTabContent(activeTab);
    if (activeTab === 'ai') hydrateAutoContext();
    if (activeTab === 'summary') hydrateAutoSummary();
    if (activeTab === 'important') loadImportantList();
    if (activeTab === 'schedule') loadScheduled();
  }

  function refreshActiveTabData() {
    if (activeTab === 'ai') {
      setTimeout(() => hydrateAutoContext({ force: true }), 400);
    }
    if (activeTab === 'summary') {
      setTimeout(() => hydrateAutoSummary({ force: true }), 400);
    }
    if (activeTab === 'important') {
      setTimeout(() => hydrateImportantContext({ force: true }), 400);
      loadImportantList();
    }
    if (activeTab === 'schedule') loadScheduled();
  }

  function renderTabContent(tab) {
    if (tab === 'ai') return `
      <div class="msgmate-section">
        <div class="msgmate-label">Detected message context</div>
        <textarea class="msgmate-textarea" id="msgmate-context" rows="3"
          placeholder="Open a message thread and MsgMate will read it automatically..."></textarea>
      </div>
      <div class="msgmate-section">
        <div class="msgmate-label">Tone</div>
        <div class="msgmate-tone-row">
          ${['friendly','professional','casual','concise','empathetic','assertive'].map(t =>
            `<button class="msgmate-tone-btn ${t === selectedTone ? 'active' : ''}" data-tone="${t}">${t}</button>`
          ).join('')}
        </div>
      </div>
      <button class="msgmate-btn msgmate-btn-primary" id="msgmate-generate-btn">✨ Generate Replies</button>
      <div id="msgmate-suggestions-area"></div>`;

    if (tab === 'important') return `
      <div class="msgmate-section">
        <div class="msgmate-label">Current conversation</div>
        <textarea class="msgmate-textarea" id="msgmate-important-context" rows="3"
          placeholder="Open a conversation and click the star to mark it important..."></textarea>
        <button class="msgmate-btn msgmate-btn-primary" id="msgmate-mark-important-btn" style="margin-top:8px">
          ⭐ Mark as Important
        </button>
      </div>
      <div class="msgmate-section">
        <div class="msgmate-label">Saved important messages</div>
        <div id="msgmate-important-list"><div class="msgmate-empty">Loading...</div></div>
      </div>`;

    if (tab === 'schedule') return `
      <div class="msgmate-section">
        <div class="msgmate-label">Platform</div>
        <select class="msgmate-platform-select" id="msgmate-sched-platform">
          ${Object.entries(PLATFORM_NAMES).map(([k,v]) =>
            `<option value="${k}" ${k === currentPlatform ? 'selected' : ''}>${v}</option>`
          ).join('')}
        </select>
        <div class="msgmate-label">Message</div>
        <textarea class="msgmate-textarea" id="msgmate-sched-text" rows="3"
          placeholder="Type your message to schedule..."></textarea>
        <div class="msgmate-datetime-row" style="margin-top:8px">
          <input type="date" class="msgmate-input" id="msgmate-sched-date"
            value="${new Date().toISOString().slice(0,10)}">
          <input type="time" class="msgmate-input" id="msgmate-sched-time"
            value="${getNextHour()}">
        </div>
        <button class="msgmate-btn msgmate-btn-primary" id="msgmate-schedule-btn">⏰ Schedule Message</button>
      </div>
      <div class="msgmate-section">
        <div class="msgmate-label">Scheduled</div>
        <div id="msgmate-schedule-list"><div class="msgmate-empty">Loading...</div></div>
      </div>`;

    if (tab === 'summary') return `
      <div class="msgmate-section">
        <div class="msgmate-label">Detected chat</div>
        <textarea class="msgmate-textarea" id="msgmate-chat-input" rows="6"
          placeholder="Open a conversation and MsgMate will read it automatically..."></textarea>
        <button class="msgmate-btn msgmate-btn-primary" id="msgmate-summarize-btn" style="margin-top:8px">📋 Summarize</button>
        <div id="msgmate-summary-result"></div>
      </div>`;

    return '';
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  // Cheap local check (background worker just reads its in-memory Clerk
  // session — no network call) so we never even attempt a backend action
  // while signed out, and can show a clear prompt instead of a fetch error.
  async function isSignedIn() {
    try {
      const status = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });
      return Boolean(status?.signedIn);
    } catch (_err) {
      return false;
    }
  }

  function showSignInRequired(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="msgmate-summary-box" style="color:#f87171;margin-top:10px">
        🔑 Sign-in required. Open the MsgMate popup and sign in.
      </div>`;
  }

  // ── AI Reply Generation ───────────────────────────────────────────────────
  function hydrateAutoContext(options = {}) {
    const contextEl = document.getElementById('msgmate-context');
    if (!contextEl || (contextEl.value.trim() && !options.force)) return;

    const context = extractConversationContext();
    if (context) {
      contextEl.value = context;
      contextEl.rows = Math.min(8, Math.max(3, context.split('\n').length));
    }
  }

  function hydrateAutoSummary(options = {}) {
    const chatEl = document.getElementById('msgmate-chat-input');
    if (!chatEl || (chatEl.value.trim() && !options.force)) return;

    const context = extractConversationContext();
    if (context) {
      chatEl.value = context;
      chatEl.rows = Math.min(10, Math.max(6, context.split('\n').length));
    }
  }

  async function generateAIReply() {
    const area = document.getElementById('msgmate-suggestions-area');
    if (!area) return;

    if (!(await isSignedIn())) return showSignInRequired(area);

    area.innerHTML = `<div class="msgmate-spinner">
      <div class="msgmate-dot-pulse"><span></span><span></span><span></span></div>
      Reading chat...
    </div>`;

    // ── Step 1: ask content.js for structured messages ──────────────────────
    // content.js runs in the same tab and returns { platform, messages[] }.
    // We prefer this structured array over the raw text blob because it lets
    // the backend clearly tell "me" from "them", improving reply quality.
    // If content.js isn't loaded yet (e.g. extension just installed), we fall
    // back gracefully to whatever is in the context textarea.
    let structuredMessages = [];
    try {
      const chatData = await chrome.runtime.sendMessage({ action: 'READ_CHAT' });
      structuredMessages = chatData?.messages ?? [];
    } catch (_) {
      // content.js not available on this tab — fall back to textarea text below
    }

    // ── Step 2: also keep the textarea context as a human-readable fallback ─
    // If the structured reader returned nothing, use whatever text the user
    // (or the auto-hydrate) put in the context box.
    hydrateAutoContext();
    const fallbackContext = document.getElementById('msgmate-context')?.value || '';

    // If we got structured messages, show them in the textarea so the user can
    // verify what the AI will receive — this is the in-UI debug view.
    if (structuredMessages.length > 0) {
      const contextEl = document.getElementById('msgmate-context');
      if (contextEl) {
        const preview = structuredMessages
          .map(m => `[${m.sender === 'me' ? 'Me' : 'Them'}] ${m.text}`)
          .join('\n');
        contextEl.value = preview;
        contextEl.rows = Math.min(10, Math.max(3, structuredMessages.length + 1));
      }
    }

    area.innerHTML = `<div class="msgmate-spinner">
      <div class="msgmate-dot-pulse"><span></span><span></span><span></span></div>
      Generating replies...
    </div>`;

    try {
      const data = await chrome.runtime.sendMessage({
        action: 'generateReplies',
        data: {
          platform: currentPlatform,
          tone: selectedTone,
          // Send structured messages when available; background worker should
          // prefer `messages` over `context` if both are present.
          messages: structuredMessages.length > 0 ? structuredMessages : undefined,
          context: structuredMessages.length === 0 ? fallbackContext : undefined,
        }
      });

      if (data.error) throw new Error(data.error);
      const replies = data.replies || [];

      area.innerHTML = `
        <div class="msgmate-label" style="margin-top:10px">Suggestions — click to use</div>
        <div class="msgmate-suggestions">
          ${replies.map(r => `<button class="msgmate-suggestion-chip">${escHtml(r)}</button>`).join('')}
        </div>`;
    } catch (err) {
      area.innerHTML = `
        <div class="msgmate-summary-box" style="color:#f87171;margin-top:10px">
          ${err.message.includes('Sign in') || err.message.includes('Unauthorized')
            ? '🔑 Sign-in required. Open the MsgMate popup and sign in.'
            : '⚠️ Error: ' + err.message}
        </div>`;
    }
  }

  // ── Chat Summarizer ───────────────────────────────────────────────────────
  async function summarizeChat() {
    const chatText = document.getElementById('msgmate-chat-input')?.value || '';
    const result = document.getElementById('msgmate-summary-result');
    if (!result || !chatText.trim()) return;

    if (!(await isSignedIn())) return showSignInRequired(result);

    result.innerHTML = `<div class="msgmate-spinner" style="margin-top:8px">
      <div class="msgmate-dot-pulse"><span></span><span></span><span></span></div>
      Summarizing...
    </div>`;

    try {
      const data = await chrome.runtime.sendMessage({
        action: 'summarizeChat',
        data: {
          conversation: chatText
        }
      });

      if (data.error) throw new Error(data.error);
      const summary = data.summary;

      result.innerHTML = `<div class="msgmate-summary-box" style="margin-top:10px">${escHtml(summary).replace(/\n/g,'<br>')}</div>`;
    } catch (err) {
      result.innerHTML = `<div class="msgmate-summary-box" style="color:#f87171;margin-top:10px">⚠️ ${err.message}</div>`;
    }
  }

  // ── Message Scheduling ────────────────────────────────────────────────────
  async function scheduleMessage() {
    const text = document.getElementById('msgmate-sched-text')?.value?.trim();
    const date = document.getElementById('msgmate-sched-date')?.value;
    const time = document.getElementById('msgmate-sched-time')?.value;
    const platform = document.getElementById('msgmate-sched-platform')?.value;

    if (!text) return showToast('Please enter a message');
    if (!date || !time) return showToast('Please set date and time');

    const sendAt = new Date(`${date}T${time}`).getTime();
    if (sendAt <= Date.now()) return showToast('Please choose a future time');

    if (!(await isSignedIn())) return showToast('🔑 Sign in required. Open the MsgMate popup and sign in.');

    const response = await chrome.runtime.sendMessage({
      action: 'scheduleMessage',
      data: { text, platform, sendAt }
    });

    if (response?.success) {
      document.getElementById('msgmate-sched-text').value = '';
      showToast('✅ Message scheduled!');
      loadScheduled();
    } else {
      showToast(response?.error || 'Could not schedule message');
    }
  }

  async function loadScheduled() {
    const listEl = document.getElementById('msgmate-schedule-list');
    if (!listEl) return;

    scheduledMessages = await chrome.runtime.sendMessage({ action: 'getScheduled' }) || [];

    if (scheduledMessages.length === 0) {
      listEl.innerHTML = `<div class="msgmate-empty">No scheduled messages yet</div>`;
      return;
    }

    listEl.innerHTML = scheduledMessages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(m => `
        <div class="msgmate-schedule-item">
          <div class="msgmate-schedule-item-info">
            <div class="msgmate-schedule-item-text">${escHtml(m.text)}</div>
            <div class="msgmate-schedule-item-meta">
              ${PLATFORM_NAMES[m.platform] || m.platform} · ${formatTime(m.sendAt)}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="msgmate-schedule-status ${m.status}">${m.status}</span>
            ${m.status === 'PENDING' ? `<button class="msgmate-cancel-btn" data-id="${m.id}" title="Cancel">✕</button>` : ''}
          </div>
        </div>`).join('');
  }

  async function cancelScheduled(id) {
    await chrome.runtime.sendMessage({ action: 'cancelSchedule', id });
    loadScheduled();
  }

  // ── Inject text into platform input ──────────────────────────────────────
  function injectText(text) {
    const selector = INPUT_SELECTORS[currentPlatform];
    if (!selector) return showToast('Auto-fill not supported here. Text copied!', true, text);

    const el = findBestInput(selector);
    if (!el) return showToast('Could not find input box. Text copied!', true, text);

    try {
      insertIntoInput(el, text);
      showToast('✅ Text inserted!');
      panel.classList.remove('visible');
    } catch (err) {
      console.warn('[MsgMate] Insert failed:', err);
      showToast('Could not insert text. Text copied!', true, text);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function extractConversationContext() {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && selectedText.length > 20) {
      return cleanExtractedText(selectedText);
    }

    const platformExtractors = {
      gmail: extractGmailContext,
      googlechat: extractGoogleChatContext,
      whatsapp: extractWhatsAppContext,
      telegram: extractContentEditableChatContext,
      slack: extractContentEditableChatContext,
      discord: extractContentEditableChatContext,
      instagram: extractContentEditableChatContext,
      twitter: extractContentEditableChatContext,
      x: extractContentEditableChatContext,
      teams: extractContentEditableChatContext
    };

    const extractor = platformExtractors[currentPlatform];
    const text = extractor ? extractor() : '';
    return cleanExtractedText(text);
  }

  function findBestInput(selector) {
    const active = document.activeElement;
    if (active && typeof active.matches === 'function' && active.matches(selector) && isVisible(active)) {
      return active;
    }

    const inputs = Array.from(document.querySelectorAll(selector)).filter(isVisible);
    if (inputs.length === 0) return null;

    const editableInputs = inputs.filter(el =>
      el.getAttribute('contenteditable') === 'true' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'INPUT'
    );

    return editableInputs.at(-1) || inputs.at(-1);
  }

  function insertIntoInput(el, text) {
    el.focus();

    if (el.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection();
      if (!selection) {
        el.textContent = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }

      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      const inserted = typeof document.execCommand === 'function'
        ? document.execCommand('insertText', false, text)
        : false;
      if (!inserted) {
        el.textContent = text;
      }

      el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text
      }));
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

  function extractGmailContext() {
    const subject = document.querySelector('h2.hP')?.innerText || '';
    const sender = document.querySelector('.gD[email], .go')?.getAttribute('email') ||
      document.querySelector('.gD, .go')?.innerText || '';

    const messageBodies = Array.from(document.querySelectorAll('.a3s.aiL, .a3s, [data-message-id] .ii, [role="main"] .adn'))
      .filter(el => isVisible(el))
      .map(el => el.innerText)
      .map(cleanExtractedText)
      .filter(text => text.length > 30);

    if (messageBodies.length > 0) {
      return [
        subject ? `Subject: ${subject}` : '',
        sender ? `From: ${sender}` : '',
        messageBodies.slice(-10).join('\n\n---\n\n')
      ].filter(Boolean).join('\n\n');
    }

    const visibleThreadText = getVisibleTextFromRoot(document.querySelector('[role="main"]') || document.body);
    return [
      subject ? `Subject: ${subject}` : '',
      sender ? `From: ${sender}` : '',
      visibleThreadText
    ].filter(Boolean).join('\n\n');
  }

  function extractGoogleChatContext() {
    const messages = Array.from(document.querySelectorAll('[data-message-id], [aria-label*="Message"]'))
      .filter(el => isVisible(el))
      .map(el => el.innerText)
      .filter(Boolean);

    return messages.slice(-10).join('\n\n');
  }

  function extractWhatsAppContext() {
    const chatTitle = document.querySelector('header span[title]')?.getAttribute('title') || '';
    const messages = Array.from(document.querySelectorAll(
      '[data-pre-plain-text], .message-in, .message-out, [role="row"]'
    ))
      .filter(el => isVisible(el))
      .map(el => {
        const meta = el.getAttribute('data-pre-plain-text') || '';
        const text = Array.from(el.querySelectorAll('span.selectable-text, [dir="ltr"], [dir="auto"]'))
          .map(child => child.innerText || child.textContent || '')
          .filter(Boolean)
          .join(' ');
        return `${meta} ${text}`.trim();
      })
      .map(cleanExtractedText)
      .filter(text => text.length > 1);

    return [
      chatTitle ? `Chat: ${chatTitle}` : '',
      messages.slice(-10).join('\n')
    ].filter(Boolean).join('\n\n');
  }

  function extractContentEditableChatContext() {
    const candidates = Array.from(document.querySelectorAll('[role="listitem"], [data-list-item-id], article, main div'))
      .filter(el => isVisible(el))
      .map(el => el.innerText)
      .filter(text => text && text.length > 15 && text.length < 1500);

    return candidates.slice(-10).join('\n\n');
  }

  function cleanExtractedText(text) {
    return (text || '')
      .replace(/\u00a0/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => !/^(reply|forward|archive|report spam|delete|mark unread|snoozed?|more)$/i.test(line))
      .join('\n')
      .slice(0, 8000);
  }

  function getVisibleTextFromRoot(root) {
    const skipSelectors = [
      '#msgmate-panel',
      '#msgmate-fab',
      '[aria-label="Message Body"]',
      '[g_editable="true"]',
      '[role="textbox"]',
      '.nH.Hd',
      '.gb_',
      '.aKh'
    ].join(',');

    return Array.from(root.querySelectorAll('h1, h2, h3, span, div, p, td'))
      .filter(el => !el.closest(skipSelectors))
      .filter(isVisible)
      .map(el => el.innerText || el.textContent || '')
      .map(text => text.trim())
      .filter(text => text.length > 20 && text.length < 2000)
      .filter((text, index, list) => list.indexOf(text) === index)
      .slice(-10)
      .join('\n');
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function showToast(msg, copy = false, copyText = '') {
    if (copy && copyText) navigator.clipboard.writeText(copyText).catch(() => {});

    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:90px;right:28px;background:#1e1b4b;
      color:#a5b4fc;padding:10px 16px;border-radius:8px;font-size:13px;
      font-family:system-ui;z-index:2147483648;border:1px solid rgba(99,102,241,0.3);
      box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:msgmate-slide-up 0.2s ease;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function getNextHour() {
    const d = new Date(); d.setHours(d.getHours() + 1, 0, 0);
    return d.toTimeString().slice(0, 5);
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Important Messages ──────────────────────────────────────────────────────
  function hydrateImportantContext(options = {}) {
    const el = document.getElementById('msgmate-important-context');
    if (!el || (el.value.trim() && !options.force)) return;
    const context = extractConversationContext();
    if (context) {
      el.value = context;
      el.rows = Math.min(8, Math.max(3, context.split('\n').length));
    }
  }

  async function markAsImportant() {
    const context = document.getElementById('msgmate-important-context')?.value?.trim() || extractConversationContext();
    if (!context) return showToast('Open a conversation first');

    if (!(await isSignedIn())) return showToast('🔑 Sign in required. Open the MsgMate popup and sign in.');

    const senderName = document.querySelector('h2.hP')?.innerText ||
      document.querySelector('.gD, .go')?.innerText ||
      document.querySelector('header span[title]')?.getAttribute('title') ||
      platformName;

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'saveImportant',
        data: {
          platform: currentPlatform,
          senderName: senderName,
          subject: document.querySelector('h2.hP')?.innerText || '',
          preview: context.slice(0, 500),
          url: location.href,
          urgency: 'MEDIUM'
        }
      });

      if (result?.message || result?.id) {
        showToast('⭐ Marked as important!');
        if (activeTab === 'important') loadImportantList();
      } else {
        showToast(result?.error || 'Could not save');
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  }

  async function loadImportantList() {
    const listEl = document.getElementById('msgmate-important-list');
    if (!listEl) return;

    if (!(await isSignedIn())) {
      listEl.innerHTML = `<div class="msgmate-empty">🔑 Sign in to see important messages</div>`;
      return;
    }

    try {
      const messages = await chrome.runtime.sendMessage({ action: 'getImportant' }) || [];
      if (messages.length === 0) {
        listEl.innerHTML = `<div class="msgmate-empty">No important messages yet</div>`;
        return;
      }
      listEl.innerHTML = messages.map(m => `
        <div class="msgmate-important-item">
          <div class="msgmate-important-item-info">
            <div class="msgmate-important-item-sender">${escHtml(m.senderName || m.platform)}</div>
            <div class="msgmate-important-item-preview">${escHtml((m.preview || '').slice(0, 120))}</div>
            <div class="msgmate-important-item-meta">
              ${escHtml(PLATFORM_NAMES[m.platform] || m.platform)}
              ${m.subject ? ' · ' + escHtml(m.subject) : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="msgmate-schedule-status ${m.urgency}">${m.urgency}</span>
            <button class="msgmate-important-dismiss" data-id="${m.id}" title="Dismiss">✕</button>
          </div>
        </div>`).join('');
    } catch {
      listEl.innerHTML = `<div class="msgmate-empty">Could not load</div>`;
    }
  }

  async function dismissImportant(id) {
    if (!id) return;
    await chrome.runtime.sendMessage({ action: 'markImportantRead', id });
    loadImportantList();
  }
})();
