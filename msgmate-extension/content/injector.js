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
    gmail: '[aria-label="Message Body"]',
    whatsapp: '[data-tab="10"][contenteditable="true"], [data-testid="conversation-compose-box-input"]',
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

  // ── Event listeners ───────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible')) loadScheduled();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== fab) {
      panel.classList.remove('visible');
    }
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
      <span class="msgmate-platform-badge">${platformName}</span>
    </div>
    <div class="msgmate-tabs">
      <button class="msgmate-tab active" data-tab="ai">✨ AI Reply</button>
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
    if (activeTab === 'schedule') loadScheduled();
  }

  function renderTabContent(tab) {
    if (tab === 'ai') return `
      <div class="msgmate-section">
        <div class="msgmate-label">Context (optional)</div>
        <textarea class="msgmate-textarea" id="msgmate-context" rows="3"
          placeholder="Paste the message you're replying to, or describe the situation..."></textarea>
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
        <div class="msgmate-label">Paste chat here</div>
        <textarea class="msgmate-textarea" id="msgmate-chat-input" rows="6"
          placeholder="Paste your conversation here and click Summarize..."></textarea>
        <button class="msgmate-btn msgmate-btn-primary" id="msgmate-summarize-btn" style="margin-top:8px">📋 Summarize</button>
        <div id="msgmate-summary-result"></div>
      </div>`;

    return '';
  }

  // ── AI Reply Generation ───────────────────────────────────────────────────
  async function generateAIReply() {
    const context = document.getElementById('msgmate-context')?.value || '';
    const area = document.getElementById('msgmate-suggestions-area');
    if (!area) return;

    area.innerHTML = `<div class="msgmate-spinner">
      <div class="msgmate-dot-pulse"><span></span><span></span><span></span></div>
      Generating replies...
    </div>`;

    try {
      const { apiKey = '' } = await chrome.storage.local.get('apiKey');

      const prompt = `You are a messaging assistant. Generate 3 distinct reply options for the following context.
Platform: ${platformName}
Tone: ${selectedTone}
Context: ${context || 'Generate general greeting/opener replies'}

Return ONLY a JSON array of 3 strings, no explanation, no markdown. Example:
["Reply 1 here", "Reply 2 here", "Reply 3 here"]`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const text = data.content[0].text.trim();
      const replies = JSON.parse(text);

      area.innerHTML = `
        <div class="msgmate-label" style="margin-top:10px">Suggestions — click to use</div>
        <div class="msgmate-suggestions">
          ${replies.map(r => `<button class="msgmate-suggestion-chip">${r}</button>`).join('')}
        </div>`;
    } catch (err) {
      area.innerHTML = `
        <div class="msgmate-summary-box" style="color:#f87171;margin-top:10px">
          ${err.message.includes('401') || err.message.includes('api_key')
            ? '🔑 API key missing or invalid. Set it in the extension popup.'
            : '⚠️ Error: ' + err.message}
        </div>`;
    }
  }

  // ── Chat Summarizer ───────────────────────────────────────────────────────
  async function summarizeChat() {
    const chatText = document.getElementById('msgmate-chat-input')?.value || '';
    const result = document.getElementById('msgmate-summary-result');
    if (!result || !chatText.trim()) return;

    result.innerHTML = `<div class="msgmate-spinner" style="margin-top:8px">
      <div class="msgmate-dot-pulse"><span></span><span></span><span></span></div>
      Summarizing...
    </div>`;

    try {
      const { apiKey = '' } = await chrome.storage.local.get('apiKey');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Summarize this conversation in 3-5 bullet points. Be concise and capture key decisions, action items, and sentiment.\n\nConversation:\n${chatText}`
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const summary = data.content[0].text;

      result.innerHTML = `<div class="msgmate-summary-box" style="margin-top:10px">${summary.replace(/\n/g,'<br>')}</div>`;
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

    const response = await chrome.runtime.sendMessage({
      action: 'scheduleMessage',
      data: { text, platform, sendAt }
    });

    if (response?.success) {
      document.getElementById('msgmate-sched-text').value = '';
      showToast('✅ Message scheduled!');
      loadScheduled();
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
            ${m.status === 'pending' ? `<button class="msgmate-cancel-btn" data-id="${m.id}" title="Cancel">✕</button>` : ''}
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

    const el = document.querySelector(selector);
    if (!el) return showToast('Could not find input box. Text copied!', true, text);

    el.focus();
    if (el.getAttribute('contenteditable') === 'true') {
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) { setter.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); }
      else el.value = text;
    }

    showToast('✅ Text inserted!');
    panel.classList.remove('visible');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
})();
