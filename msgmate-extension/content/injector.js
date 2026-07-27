(function () {
  if (document.getElementById('msgmate-fab')) return;

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

  let activeTab = 'reply';
  let selectedTone = 'Friendly';
  let scheduledMessages = [];
  let aiLoading = false;

  const toneMap = { Friendly: 'friendly', Concise: 'concise', Formal: 'formal' };
  const reverseToneMap = { friendly: 'Friendly', concise: 'Concise', formal: 'Formal' };

  const fab = document.createElement('button');
  fab.id = 'msgmate-fab';
  fab.title = 'MsgMate AI Assistant';
  fab.innerHTML = '<span class="fab-ring"></span><span class="fab-mark"></span>';

  const panel = document.createElement('div');
  panel.id = 'msgmate-panel';
  panel.className = 'is-hidden';
  panel.innerHTML = buildPanelHTML();

  document.body.appendChild(fab);
  document.body.appendChild(panel);
  hydrateAutoContext();

  fab.addEventListener('click', () => {
    panel.classList.remove('is-hidden');
    fab.style.display = 'none';
    refreshActiveTabData();
  });

  panel.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) {
      document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      const idx = Array.from(document.querySelectorAll('.tab')).indexOf(tab);
      document.getElementById('tabIndicator').style.transform = `translateX(${idx * 100}%)`;
      document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('is-active'));
      document.getElementById(tab.dataset.view).classList.add('is-active');
      activeTab = tab.dataset.view.replace('view-', '');
      if (activeTab === 'reply') hydrateAutoContext();
      if (activeTab === 'summary') hydrateAutoSummary();
      if (activeTab === 'schedule') loadScheduled();
      return;
    }

    const chip = e.target.closest('#toneChips .chip');
    if (chip) {
      document.querySelectorAll('#toneChips .chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      selectedTone = chip.textContent.trim();
      return;
    }

    const insertBtn = e.target.closest('[data-insert]');
    if (insertBtn) {
      const text = insertBtn.closest('.reply-card')?.querySelector('.reply-text')?.textContent;
      if (text) {
        injectText(text);
        insertBtn.textContent = 'Inserted \u2713';
        insertBtn.classList.add('is-done');
        setTimeout(() => { insertBtn.textContent = 'Insert'; insertBtn.classList.remove('is-done'); }, 1600);
      }
      return;
    }

    const regenBtn = e.target.closest('[data-regen]');
    if (regenBtn) {
      generateAIReply();
      return;
    }

    const suggestion = e.target.closest('.msgmate-suggestion-chip');
    if (suggestion) injectText(suggestion.textContent.trim());

    if (e.target.id === 'msgmate-summarize-btn' || e.target.id === 'copyBtn') summarizeChat();

    const schedChip = e.target.closest('#scheduleChips .chip');
    if (schedChip) {
      document.querySelectorAll('#scheduleChips .chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
      schedChip.setAttribute('aria-pressed', 'true');
      const label = schedChip.textContent.trim();
      if (label === 'Custom') {
        const el = document.getElementById('customTime');
        el.style.display = el.style.display === 'flex' ? 'none' : 'flex';
        return;
      }
      document.getElementById('customTime').style.display = 'none';
      const text = document.getElementById('msgmate-sched-text')?.value?.trim();
      if (!text) return showToast('Type a reply message first');
      scheduleMessage(label);
      schedChip.setAttribute('aria-pressed', 'false');
    }

    if (e.target.id === 'customConfirm') {
      const val = document.getElementById('customTimeInput')?.value;
      if (!val) return;
      const text = document.getElementById('msgmate-sched-text')?.value?.trim();
      if (!text) return showToast('Type a reply message first');
      scheduleMessage(val);
      document.getElementById('customTime').style.display = 'none';
      document.getElementById('customChip')?.setAttribute('aria-pressed', 'false');
    }

    if (e.target.id === 'collapseBtn') {
      panel.classList.add('is-hidden');
      fab.style.display = 'flex';
      return;
    }

    const cancelBtn = e.target.closest('[data-cancel]');
    if (cancelBtn) {
      const item = cancelBtn.closest('.queue-item');
      if (item) item.remove();
      return;
    }
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !fab.contains(e.target)) {
      panel.classList.add('is-hidden');
      fab.style.display = 'flex';
    }
  });

  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if (req.action !== 'openMsgmatePanel') return;
    panel.classList.remove('is-hidden');
    fab.style.display = 'none';
    if (req.tab) {
      const tabMap = { ai: 'reply', schedule: 'schedule', summary: 'summary' };
      const target = tabMap[req.tab] || 'reply';
      document.querySelectorAll('.tab').forEach(t => {
        t.setAttribute('aria-selected', t.dataset.view === `view-${target}`);
      });
      const idx = Array.from(document.querySelectorAll('.tab')).findIndex(t => t.dataset.view === `view-${target}`);
      document.getElementById('tabIndicator').style.transform = `translateX(${idx * 100}%)`;
      document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('is-active'));
      document.getElementById(`view-${target}`).classList.add('is-active');
      activeTab = target;
    }
    refreshActiveTabData();
    sendResponse({ success: true });
  });

  function buildPanelHTML() {
    const senderEl = document.querySelector('h2.hP') || document.querySelector('.gD, .go') || document.querySelector('header span[title]');
    const contextName = senderEl?.textContent?.trim() || senderEl?.getAttribute('title')?.trim() || platformName;
    return `
    <header class="panel-header">
      <div class="brand">
        <span class="brand-mark"></span>
        <div style="min-width:0;">
          <div class="brand-name">MsgMate</div>
          <div class="brand-context">Thread with ${escHtml(contextName)}</div>
        </div>
      </div>
      <button class="icon-btn" id="collapseBtn" aria-label="Collapse MsgMate">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </header>
    <div class="tabs" role="tablist" aria-label="MsgMate actions">
      <span class="tab-indicator" id="tabIndicator"></span>
      <button class="tab" role="tab" aria-selected="true" data-view="view-reply">Reply</button>
      <button class="tab" role="tab" aria-selected="false" data-view="view-summary">Summary</button>
      <button class="tab" role="tab" aria-selected="false" data-view="view-schedule">Schedule</button>
    </div>
    <div class="panel-body">
      <div class="panel-view is-active" id="view-reply" role="tabpanel">
        <div class="chip-row" id="toneChips">
          <button class="chip" aria-pressed="true">Friendly</button>
          <button class="chip" aria-pressed="false">Concise</button>
          <button class="chip" aria-pressed="false">Formal</button>
        </div>
        <div id="msgmate-suggestions-area">
          <div class="msgmate-spinner"><div class="msgmate-dot-pulse"><span></span><span></span><span></span></div> Reading chat...</div>
        </div>
      </div>
      <div class="panel-view" id="view-summary" role="tabpanel">
        <p class="section-label">Thread summary</p>
        <textarea class="msgmate-textarea" id="msgmate-chat-input" rows="4" placeholder="Open a conversation and MsgMate will read it automatically..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn-secondary" id="msgmate-summarize-btn" style="flex:1">Summarize</button>
        </div>
        <div id="msgmate-summary-result"></div>
      </div>
      <div class="panel-view" id="view-schedule" role="tabpanel">
        <p class="section-label">Reply to send</p>
        <textarea class="msgmate-textarea" id="msgmate-sched-text" rows="2" placeholder="Type or generate a reply first..."></textarea>
        <p class="section-label" style="margin-top:10px">Send time</p>
        <div class="chip-row" id="scheduleChips">
          <button class="chip" aria-pressed="false">In 1 hour</button>
          <button class="chip" aria-pressed="false">Tonight 8pm</button>
          <button class="chip" aria-pressed="false">Tomorrow 9am</button>
          <button class="chip" id="customChip" aria-pressed="false">Custom</button>
        </div>
        <div class="msgmate-datetime-row" id="customTime" style="display:none">
          <input type="datetime-local" id="customTimeInput">
          <button class="btn-primary" id="customConfirm">Set</button>
        </div>
        <p class="section-label" style="margin-top:12px">Scheduled</p>
        <div id="msgmate-schedule-list"><p class="empty-note">Nothing scheduled yet</p></div>
      </div>
    </div>
    <footer class="panel-footer">
      <span class="avatar" id="auth-avatar">?</span>
      <span class="footer-text" id="auth-footer">Checking sign-in...</span>
    </footer>`;
  }

  function refreshActiveTabData() {
    if (activeTab === 'reply') setTimeout(() => hydrateAutoContext({ force: true }), 400);
    if (activeTab === 'summary') setTimeout(() => hydrateAutoSummary({ force: true }), 400);
    if (activeTab === 'schedule') loadScheduled();
    updateAuthFooter();
  }

  async function updateAuthFooter() {
    const avatar = document.getElementById('auth-avatar');
    const text = document.getElementById('auth-footer');
    if (!avatar || !text) return;
    try {
      const status = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });
      if (status?.signedIn) {
        const initial = status.email ? status.email[0].toUpperCase() : 'U';
        avatar.textContent = initial;
        avatar.style.background = '#EFEAFF';
        avatar.style.color = '#5136C4';
        text.innerHTML = `Signed in as <strong>${escHtml(status.email || 'your account')}</strong>`;
      } else {
        avatar.textContent = '?';
        avatar.style.background = '#F4F2FB';
        avatar.style.color = '#A7A3B8';
        text.textContent = 'Not signed in — open the popup';
      }
    } catch {
      avatar.textContent = '?';
      text.textContent = 'Could not check sign-in';
    }
  }

  async function isSignedIn() {
    try {
      const status = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });
      return Boolean(status?.signedIn);
    } catch { return false; }
  }

  function showSignInRequired(container) {
    if (!container) return;
    container.innerHTML = '<div class="msgmate-summary-box" style="color:#D14343">Sign-in required. Open the MsgMate popup and sign in.</div>';
  }

  function hydrateAutoContext(options = {}) {
    const area = document.getElementById('msgmate-suggestions-area');
    if (!area) return;
    generateAIReply();
  }

  function hydrateAutoSummary(options = {}) {
    const chatEl = document.getElementById('msgmate-chat-input');
    if (!chatEl || (chatEl.value.trim() && !options.force)) return;
    const context = extractConversationContext();
    if (context) {
      chatEl.value = context;
      chatEl.rows = Math.min(6, Math.max(4, context.split('\n').length));
    }
  }

  async function generateAIReply() {
    const area = document.getElementById('msgmate-suggestions-area');
    if (!area) return;
    if (!(await isSignedIn())) return showSignInRequired(area);

    area.innerHTML = '<div class="msgmate-spinner"><div class="msgmate-dot-pulse"><span></span><span></span><span></span></div> Reading chat...</div>';

    let structuredMessages = [];
    try {
      const chatData = await chrome.runtime.sendMessage({ action: 'READ_CHAT' });
      structuredMessages = chatData?.messages ?? [];
    } catch {}

    const context = extractConversationContext();

    area.innerHTML = '<div class="msgmate-spinner"><div class="msgmate-dot-pulse"><span></span><span></span><span></span></div> Generating replies...</div>';

    try {
      const data = await chrome.runtime.sendMessage({
        action: 'generateReplies',
        data: {
          platform: currentPlatform,
          tone: toneMap[selectedTone] || 'friendly',
          messages: structuredMessages.length > 0 ? structuredMessages : undefined,
          context: structuredMessages.length === 0 ? context : undefined,
        }
      });

      if (data.error) throw new Error(data.error);
      const replies = data.replies || [];

      area.innerHTML = replies.map(r => `
        <div class="reply-card">
          <p class="reply-text">${escHtml(r)}</p>
          <div class="reply-actions">
            <button class="btn-primary" data-insert>Insert</button>
            <button class="btn-ghost" data-regen aria-label="Regenerate this reply">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 3.5A5 5 0 1 0 12.5 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M11.5 1.5V4H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>`).join('') + `<p class="regen-note">Suggestions based on your ${platformName} conversation</p>`;
    } catch (err) {
      area.innerHTML = `<div class="msgmate-summary-box" style="color:#D14343">${err.message.includes('Sign in') ? 'Sign-in required. Open the MsgMate popup and sign in.' : 'Error: ' + err.message}</div>`;
    }
  }

  async function summarizeChat() {
    const chatText = document.getElementById('msgmate-chat-input')?.value || '';
    const result = document.getElementById('msgmate-summary-result');
    if (!result || !chatText.trim()) return;
    if (!(await isSignedIn())) return showSignInRequired(result);

    result.innerHTML = '<div class="msgmate-spinner" style="margin-top:8px"><div class="msgmate-dot-pulse"><span></span><span></span><span></span></div> Summarizing...</div>';

    try {
      const data = await chrome.runtime.sendMessage({
        action: 'summarizeChat', data: { conversation: chatText }
      });
      if (data.error) throw new Error(data.error);

      const points = data.summary.split('\n').filter(Boolean);
      result.innerHTML = `
        <ul class="summary-list">${points.map(p => `<li>${escHtml(p)}</li>`).join('')}</ul>
        <div class="summary-actions">
          <button class="btn-secondary" onclick="navigator.clipboard.writeText('${escHtml(data.summary).replace(/'/g, "\\'")}');this.textContent='Copied \u2713';this.classList.add('is-done');setTimeout(()=>{this.textContent='Copy summary';this.classList.remove('is-done')},1600)">Copy summary</button>
        </div>`;
    } catch (err) {
      result.innerHTML = `<div class="msgmate-summary-box" style="color:#D14343">${err.message}</div>`;
    }
  }

  async function scheduleMessage(timeLabel) {
    const text = document.getElementById('msgmate-sched-text')?.value?.trim();
    if (!text) return showToast('Type a reply message first');

    let sendAt;
    if (timeLabel === 'In 1 hour') {
      sendAt = Date.now() + 3600000;
    } else if (timeLabel === 'Tonight 8pm') {
      const d = new Date(); d.setHours(20, 0, 0, 0);
      sendAt = d.getTime() > Date.now() ? d.getTime() : d.getTime() + 86400000;
    } else if (timeLabel === 'Tomorrow 9am') {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
      sendAt = d.getTime();
    } else {
      sendAt = new Date(timeLabel).getTime();
    }

    if (sendAt <= Date.now()) return showToast('Please choose a future time');
    if (!(await isSignedIn())) return showToast('Sign in required');

    const response = await chrome.runtime.sendMessage({
      action: 'scheduleMessage',
      data: { text, platform: currentPlatform, sendAt }
    });

    if (response?.success) {
      document.getElementById('msgmate-sched-text').value = '';
      showToast('Message scheduled!');
      loadScheduled();
    } else {
      showToast(response?.error || 'Could not schedule');
    }
  }

  async function loadScheduled() {
    const listEl = document.getElementById('msgmate-schedule-list');
    if (!listEl) return;
    scheduledMessages = await chrome.runtime.sendMessage({ action: 'getScheduled' }) || [];
    if (scheduledMessages.length === 0) {
      listEl.innerHTML = '<p class="empty-note">Nothing scheduled yet</p>';
      return;
    }
    listEl.innerHTML = scheduledMessages.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10).map(m => `
      <div class="queue-item">
        <span class="queue-dot"></span>
        <div class="queue-text">
          <div class="queue-title">${escHtml(m.text.slice(0, 40))}${m.text.length > 40 ? '...' : ''}</div>
          <div class="queue-time">${formatTime(m.sendAt)}</div>
        </div>
        ${m.status === 'PENDING' ? `<button class="link-btn" data-cancel data-id="${m.id}">Cancel</button>` : `<span class="msgmate-schedule-status ${m.status}">${m.status}</span>`}
      </div>`).join('');
  }

  function injectText(text) {
    const selector = INPUT_SELECTORS[currentPlatform];
    if (!selector) return showToast('Auto-fill not supported. Text copied!', true, text);
    const el = findBestInput(selector);
    if (!el) return showToast('Could not find input box. Text copied!', true, text);
    try {
      insertIntoInput(el, text);
      showToast('Text inserted!');
      panel.classList.add('is-hidden');
      fab.style.display = 'flex';
    } catch (err) {
      showToast('Could not insert text. Text copied!', true, text);
    }
  }

  function extractConversationContext() {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && selectedText.length > 20) return cleanExtractedText(selectedText);
    const extractors = {
      gmail: extractGmailContext, googlechat: extractGoogleChatContext,
      whatsapp: extractWhatsAppContext, telegram: extractTelegramContext,
      slack: extractContentEditableChatContext, discord: extractContentEditableChatContext,
      instagram: extractContentEditableChatContext, twitter: extractContentEditableChatContext,
      x: extractContentEditableChatContext, teams: extractContentEditableChatContext
    };
    const extractor = extractors[currentPlatform];
    return extractor ? cleanExtractedText(extractor()) : '';
  }

  function findBestInput(selector) {
    const active = document.activeElement;
    if (active && typeof active.matches === 'function' && active.matches(selector) && isVisible(active)) return active;
    const inputs = Array.from(document.querySelectorAll(selector)).filter(isVisible);
    if (inputs.length === 0) return null;
    const editableInputs = inputs.filter(el => el.getAttribute('contenteditable') === 'true' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
    return editableInputs.at(-1) || inputs.at(-1);
  }

  function insertIntoInput(el, text) {
    el.focus();
    if (el.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection();
      if (!selection) { el.textContent = text; el.dispatchEvent(new Event('input', { bubbles: true })); return; }
      const range = document.createRange();
      range.selectNodeContents(el); range.collapse(false);
      selection.removeAllRanges(); selection.addRange(range);
      const inserted = typeof document.execCommand === 'function' ? document.execCommand('insertText', false, text) : false;
      if (!inserted) el.textContent = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, text); else el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function extractGmailContext() {
    const subject = document.querySelector('h2.hP')?.innerText || '';
    const sender = document.querySelector('.gD[email], .go')?.getAttribute('email') || document.querySelector('.gD, .go')?.innerText || '';
    const bodies = Array.from(document.querySelectorAll('.a3s.aiL, .a3s, [data-message-id] .ii, [role="main"] .adn')).filter(isVisible).map(el => el.innerText).map(cleanExtractedText).filter(t => t.length > 30);
    if (bodies.length > 0) return [subject ? `Subject: ${subject}` : '', sender ? `From: ${sender}` : '', bodies.slice(-10).join('\n\n---\n\n')].filter(Boolean).join('\n\n');
    const text = getVisibleTextFromRoot(document.querySelector('[role="main"]') || document.body);
    return [subject ? `Subject: ${subject}` : '', sender ? `From: ${sender}` : '', text].filter(Boolean).join('\n\n');
  }

  function extractGoogleChatContext() {
    return Array.from(document.querySelectorAll('[data-message-id], [aria-label*="Message"]')).filter(isVisible).map(el => el.innerText).filter(Boolean).slice(-10).join('\n\n');
  }

  function extractWhatsAppContext() {
    const chatTitle = document.querySelector('header span[title]')?.getAttribute('title') || '';
    const messages = Array.from(document.querySelectorAll('[data-pre-plain-text], .message-in, .message-out, [role="row"]')).filter(isVisible).map(el => {
      const meta = el.getAttribute('data-pre-plain-text') || '';
      const text = Array.from(el.querySelectorAll('span.selectable-text, [dir="ltr"], [dir="auto"]')).map(c => c.innerText || c.textContent || '').filter(Boolean).join(' ');
      return `${meta} ${text}`.trim();
    }).map(cleanExtractedText).filter(t => t.length > 1);
    return [chatTitle ? `Chat: ${chatTitle}` : '', messages.slice(-10).join('\n')].filter(Boolean).join('\n\n');
  }

  function extractTelegramContext() {
    const messages = Array.from(document.querySelectorAll('.bubble, .message, [data-message-id], .im_history_message, .messages-container .message')).filter(isVisible).map(el => el.innerText).filter(t => t && t.length > 15 && t.length < 1500);
    if (messages.length > 0) return messages.slice(-10).join('\n\n');
    const chatTitle = document.querySelector('.chat-title, .peer-title')?.textContent?.trim() || '';
    const bodyText = Array.from(document.querySelectorAll('.chat-container, .messages-container, .im_history_messages_wrap, [class*="messages"]')).filter(isVisible).map(el => el.innerText).filter(t => t.length > 50).slice(0, 3).join('\n\n');
    return [chatTitle ? `Chat: ${chatTitle}` : '', bodyText].filter(Boolean).join('\n\n');
  }

  function extractContentEditableChatContext() {
    return Array.from(document.querySelectorAll('[role="listitem"], [data-list-item-id], article, main div')).filter(isVisible).map(el => el.innerText).filter(t => t && t.length > 15 && t.length < 1500).slice(-10).join('\n\n');
  }

  function cleanExtractedText(text) {
    return (text || '').replace(/\u00a0/g, ' ').split('\n').map(l => l.trim()).filter(Boolean).filter(l => !/^(reply|forward|archive|report spam|delete|mark unread|snoozed?|more)$/i.test(l)).join('\n').slice(0, 8000);
  }

  function getVisibleTextFromRoot(root) {
    const skip = '#msgmate-panel,#msgmate-fab,[aria-label="Message Body"],[g_editable="true"],[role="textbox"],.nH.Hd,.gb_,.aKh';
    return Array.from(root.querySelectorAll('h1, h2, h3, span, div, p, td')).filter(el => !el.closest(skip)).filter(isVisible).map(el => el.innerText || el.textContent || '').map(t => t.trim()).filter(t => t.length > 20 && t.length < 2000).filter((t, i, a) => a.indexOf(t) === i).slice(-10).join('\n');
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function showToast(msg, copy = false, copyText = '') {
    if (copy && copyText) navigator.clipboard.writeText(copyText).catch(() => {});
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:90px;right:28px;background:#17151F;color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;font-family:system-ui;z-index:2147483648;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:msgmate-slide-up 0.2s ease;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  hydrateAutoContext();
})();