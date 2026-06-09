// MsgMate Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const backendUrlInput = document.getElementById('backendUrlInput');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const toggleKey = document.getElementById('toggleKey');
  const assistantButtons = document.querySelectorAll('[data-open-panel]');

 const DEFAULT_BACKEND_URL = 'https://aichat-3-il3q.onrender.com';

const {
  backendApiKey = '',
  backendUrl = DEFAULT_BACKEND_URL,
  msgmateUserId,
  scheduledMessages = []
} = await chrome.storage.local.get([
  'backendApiKey',
  'backendUrl',
  'msgmateUserId',
  'scheduledMessages'
]);

  if (!msgmateUserId) {
    await chrome.storage.local.set({ msgmateUserId: crypto.randomUUID() });
  }

  if (backendApiKey) apiKeyInput.value = backendApiKey;
  backendUrlInput.value = backendUrl;

  const pending = scheduledMessages.filter(m => m.status === 'pending').length;
  const sent = scheduledMessages.filter(m => m.status === 'sent').length;
  document.getElementById('stat-scheduled').textContent = pending;
  document.getElementById('stat-sent').textContent = sent;

  saveBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const url = backendUrlInput.value.trim().replace(/\/$/, '');

    if (!url) return showToast('Please enter backend URL');
    if (!key) return showToast('Please enter backend API key');

    await chrome.storage.local.set({ backendApiKey: key, backendUrl: url });
    showToast('Backend settings saved');
  });

  testBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const url = backendUrlInput.value.trim().replace(/\/$/, '');

    if (key && url) {
      await chrome.storage.local.set({ backendApiKey: key, backendUrl: url });
    }

    const response = await chrome.runtime.sendMessage({ action: 'testBackend' });
    if (response?.ok) {
      document.getElementById('status-text').textContent = 'Backend connected';
      showToast('Backend connected');
      return;
    }

    showToast(response?.error || 'Backend connection failed');
  });

  toggleKey.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKey.textContent = isPassword ? 'Hide' : 'Show';
  });

  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });

  backendUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });

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
