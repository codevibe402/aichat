// ReplyGenie Popup Script

// ── Theme System ─────────────────────────────────────────
const THEMES = [
  { id: 'dark',       name: 'Dark',      bg: '#070B1F',    primary: '#7C4DFF',   secondary: '#4F8CFF',  accent: '#00E5FF',  success: '#22C55E', swatch: 'linear-gradient(135deg, #070B1F, #1a1040)' },
  { id: 'purple',     name: 'Purple',    bg: '#0f0624',    primary: '#A855F7',   secondary: '#7C3AED',  accent: '#C084FC',  success: '#22C55E', swatch: 'linear-gradient(135deg, #2e1065, #581c87)' },
  { id: 'blue',       name: 'Ocean',     bg: '#061b2e',    primary: '#3B82F6',   secondary: '#06B6D4',  accent: '#22D3EE',  success: '#10B981', swatch: 'linear-gradient(135deg, #164e63, #0c4a6e)' },
  { id: 'green',      name: 'Forest',    bg: '#052014',    primary: '#22C55E',   secondary: '#10B981',  accent: '#34D399',  success: '#22C55E', swatch: 'linear-gradient(135deg, #064e3b, #065f46)' },
  { id: 'rose',       name: 'Rose',      bg: '#1f0612',    primary: '#E11D48',   secondary: '#FB7185',  accent: '#FDA4AF',  success: '#22C55E', swatch: 'linear-gradient(135deg, #4c0519, #701a3b)' },
  { id: 'amber',      name: 'Sunset',    bg: '#1f1306',    primary: '#F59E0B',   secondary: '#FB923C',  accent: '#FBBF24',  success: '#22C55E', swatch: 'linear-gradient(135deg, #78350f, #92400e)' },
  { id: 'cyan',       name: 'Cyan',      bg: '#061f1f',    primary: '#06B6D4',   secondary: '#22D3EE',  accent: '#67E8F9',  success: '#10B981', swatch: 'linear-gradient(135deg, #164e63, #155e75)' },
  { id: 'slate',      name: 'Slate',     bg: '#0b1120',    primary: '#6366F1',   secondary: '#818CF8',  accent: '#A5B4FC',  success: '#22C55E', swatch: 'linear-gradient(135deg, #1e293b, #334155)' },
  { id: 'midnight',   name: 'Midnight',  bg: '#000212',    primary: '#6C5CE7',   secondary: '#2D46B9',  accent: '#00D2D3',  success: '#00B894', swatch: 'linear-gradient(135deg, #000212, #0a0a2e)' },
];

function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--success', theme.success);
  root.style.setProperty('--stat-gradient', `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`);
  root.style.setProperty('--btn-gradient', `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`);
  root.style.setProperty('--header-glow-1', `color-mix(in srgb, ${theme.primary} 15%, transparent)`);
  root.style.setProperty('--header-glow-2', `color-mix(in srgb, ${theme.accent} 8%, transparent)`);

  document.querySelectorAll('.theme-option').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === themeId);
  });
}

function saveTheme(themeId) {
  applyTheme(themeId);
  try {
    chrome.storage.local.set({ 'replygenie-theme': themeId });
  } catch (e) {
    // storage may not be available in some contexts
  }
}

function buildThemePicker() {
  const grid = document.getElementById('themeGrid');
  if (!grid) return;
  grid.innerHTML = '';
  THEMES.forEach((theme, i) => {
    const btn = document.createElement('button');
    btn.className = 'theme-option';
    btn.dataset.theme = theme.id;
    btn.innerHTML = `
      <div class="theme-swatch" style="background:${theme.swatch}"></div>
      <span class="theme-name">${theme.name}</span>
    `;
    btn.addEventListener('click', () => saveTheme(theme.id));
    grid.appendChild(btn);
  });
}

// ── Interactive Sparkle Particles ───────────────────────
function createParticles(x, y) {
  const container = document.getElementById('particles-container');
  if (!container) return;

  const colors = ['#7C4DFF', '#4F8CFF', '#00E5FF', '#A855F7', '#22D3EE', '#C084FC', '#67E8F9'];
  const count = 24;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const isStar = i % 3 === 0;
    particle.className = `particle${isStar ? ' star' : ''}`;

    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 40 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const dr = (Math.random() - 0.5) * 720;
    const size = isStar ? 5 + Math.random() * 4 : 3 + Math.random() * 3;

    particle.style.cssText = `
      left: ${x}px; top: ${y}px;
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${isStar ? '2px' : '50%'};
      --dx: ${dx}px; --dy: ${dy}px; --dr: ${dr}deg;
      box-shadow: 0 0 ${2 + Math.random() * 4}px ${colors[Math.floor(Math.random() * colors.length)]};
    `;

    if (isStar) {
      particle.style.transform = 'rotate(45deg)';
    }

    particle.style.animationDelay = `${Math.random() * 0.1}s`;
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 900);
  }
}

// ── DOM Ready ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  buildThemePicker();

  // Load saved theme
  try {
    const result = await chrome.storage.local.get('replygenie-theme');
    const savedTheme = result['replygenie-theme'];
    if (savedTheme) applyTheme(savedTheme);
  } catch (e) {
    // storage might not be ready
  }

  // ── Theme Toggle ──
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themePicker = document.getElementById('themePicker');
  if (themeToggleBtn && themePicker) {
    themeToggleBtn.addEventListener('click', () => {
      const opening = !themePicker.classList.contains('open');
      themePicker.classList.toggle('open');
      themeToggleBtn.innerHTML = opening
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Appearance';
    });
  }

  // ── Sparkle Button ──
  const sparkleBtn = document.getElementById('sparkleBtn');
  if (sparkleBtn) {
    sparkleBtn.addEventListener('click', (e) => {
      const rect = sparkleBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      createParticles(cx, cy);
    });
  }

  // ── Data loading per view ──
  async function loadImportant() {
    const container = document.getElementById('view-important');
    if (!container) return;
    try {
      const messages = await chrome.runtime.sendMessage({ action: 'getImportant' }) || [];
      const list = container.querySelector('.important-list');
      if (!list) return;
      if (messages.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:11px">No unread important messages</div>`;
        return;
      }
      list.innerHTML = messages.map(m => `
        <div class="important-card" style="position:relative;cursor:pointer" data-url="${escHtml(m.url || '')}" data-id="${m.id}">
          <strong>${escHtml(m.platform)}${m.subject ? ' • ' + escHtml(m.subject) : ''}</strong>
          <span>${escHtml(m.preview || m.senderName)}</span>
          <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
            <span style="font-size:9px;color:var(--text-muted)">${escHtml(m.senderName)}</span>
            <span style="font-size:9px;padding:1px 5px;border-radius:4px;background:${urgencyColor(m.urgency)};color:#fff">${m.urgency}</span>
            <button class="important-dismiss-btn" data-id="${m.id}" style="margin-left:auto;background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;padding:2px 6px;border-radius:4px">✕</button>
          </div>
        </div>`).join('');

      list.querySelectorAll('.important-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.important-dismiss-btn')) return;
          const url = card.dataset.url;
          if (url) chrome.tabs.create({ url });
        });
      });

      list.querySelectorAll('.important-dismiss-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await chrome.runtime.sendMessage({ action: 'markImportantRead', id: btn.dataset.id });
          loadImportant();
        });
      });
    } catch { /* ignore */ }
  }

  async function loadTasks() {
    const container = document.getElementById('view-actions');
    if (!container) return;
    try {
      const tasks = await chrome.runtime.sendMessage({ action: 'getTasks' }) || [];
      const list = container.querySelector('.tasks-list');
      if (!list) return;
      if (tasks.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:11px">No tasks yet</div>`;
        return;
      }
      list.innerHTML = tasks.map(t => `
        <div class="task-card" style="position:relative">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <input type="checkbox" style="margin-top:2px;accent-color:var(--primary);cursor:pointer"
              ${t.isCompleted ? 'checked' : ''}
              data-task-id="${t.id}">
            <div style="flex:1">
              <strong style="${t.isCompleted ? 'text-decoration:line-through;opacity:0.5' : ''}">${escHtml(t.title)}</strong>
              ${t.description ? `<span>${escHtml(t.description)}</span>` : ''}
              <div style="display:flex;gap:6px;margin-top:4px;align-items:center;flex-wrap:wrap">
                ${t.source ? `<span style="font-size:9px;color:var(--text-muted)">${escHtml(t.source)}</span>` : ''}
                <span style="font-size:9px;padding:1px 5px;border-radius:4px;background:${priorityColor(t.priority)};color:#fff">${t.priority}</span>
                ${t.dueDate ? `<span style="font-size:9px;color:var(--warning)">Due ${formatDate(t.dueDate)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>`).join('');

      list.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', async () => {
          await chrome.runtime.sendMessage({ action: 'completeTask', id: cb.dataset.taskId, completed: cb.checked });
        });
      });
    } catch { /* ignore */ }
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function urgencyColor(u) { return u === 'URGENT' ? '#ef4444' : u === 'HIGH' ? '#f59e0b' : '#64748b'; }
  function priorityColor(p) { return p === 'HIGH' ? '#ef4444' : p === 'MEDIUM' ? '#f59e0b' : '#22c55e'; }
  function formatDate(ts) { return new Date(ts).toLocaleDateString([], { month:'short', day:'numeric' }); }

  // ── Popup view switching ──
  document.querySelectorAll('.view-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.view-pill').forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.popup-view').forEach((view) => view.classList.remove('active'));
      pill.classList.add('active');
      const target = document.getElementById(`view-${pill.dataset.view}`);
      if (target) target.classList.add('active');
      if (pill.dataset.view === 'important') loadImportant();
      if (pill.dataset.view === 'actions') loadTasks();
    });
  });

  // ── Auth ──
  const assistantButtons = document.querySelectorAll('[data-open-panel]');
  const authStatusText = document.getElementById('auth-status-text');
  const signInBtn = document.getElementById('signInBtn');
  const authDot = document.getElementById('auth-dot');

  signInBtn.addEventListener('click', () => {
    window.MsgMateClerk.signIn();
  });

  try {
    const status = await window.MsgMateClerk.getClerkStatus();
    if (status.signedIn) {
      authStatusText.textContent = `Signed in as ${status.email || 'your account'}`;
      authDot.className = 'status-dot active';
    } else {
      authStatusText.textContent = 'Not signed in';
      signInBtn.classList.add('visible');
      authDot.className = 'status-dot inactive';
    }
  } catch (err) {
    console.warn('[ReplyGenie] Clerk status check failed:', err);
    authStatusText.textContent = 'Could not check sign-in status';
    signInBtn.classList.add('visible');
    authDot.className = 'status-dot loading';
  }

  // ── Extension Status ──
  const extDot = document.getElementById('ext-dot');
  const statusText = document.getElementById('status-text');

  try {
    const scheduledMessages = await chrome.runtime.sendMessage({ action: 'getScheduled' }) || [];
    const pending = scheduledMessages.filter(m => m.status === 'PENDING').length;
    const sent = scheduledMessages.filter(m => m.status === 'SENT').length;
    document.getElementById('stat-scheduled').textContent = pending;
    document.getElementById('stat-sent').textContent = sent;
    extDot.className = 'status-dot active';
    statusText.textContent = 'Extension active on supported platforms';
  } catch (e) {
    extDot.className = 'status-dot loading';
    statusText.textContent = 'Checking extension status...';
  }

  // ── Assistant Buttons ──
  assistantButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const tabName = button.dataset.openPanel;
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!activeTab?.id) return showToast('Open a supported platform tab first');

      try {
        await chrome.tabs.sendMessage(activeTab.id, {
          action: 'openMsgmatePanel',
          tab: tabName
        });
        window.close();
      } catch (_error) {
        showToast('Refresh this platform tab, then try again');
      }
    });
  });

  // ── Debug Button ──
  const debugBtn = document.getElementById('debugReadChat');
  if (debugBtn) {
    debugBtn.addEventListener('click', async () => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) return showToast('Open a supported platform tab first');

      try {
        const result = await chrome.tabs.sendMessage(activeTab.id, { action: 'READ_CHAT' });
        console.group('[ReplyGenie Debug] READ_CHAT result');
        console.log('Platform:', result?.platform);
        console.table(result?.messages ?? []);
        console.groupEnd();

        const count = result?.messages?.length ?? 0;
        showToast(count > 0
          ? `Read ${count} messages from ${result.platform}. Check DevTools console.`
          : `No messages found on ${result?.platform || 'this page'}`
        );
      } catch (_err) {
        showToast('content.js not loaded — refresh the platform tab first');
      }
    });
  }
});

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}
