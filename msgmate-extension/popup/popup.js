// MsgMate Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveBtn = document.getElementById('saveBtn');
  const toggleKey = document.getElementById('toggleKey');

  // Load saved API key
  const { apiKey = '', scheduledMessages = [] } = await chrome.storage.local.get(['apiKey', 'scheduledMessages']);
  if (apiKey) apiKeyInput.value = apiKey;

  // Update stats
  const pending = scheduledMessages.filter(m => m.status === 'pending').length;
  const sent = scheduledMessages.filter(m => m.status === 'sent').length;
  document.getElementById('stat-scheduled').textContent = pending;
  document.getElementById('stat-sent').textContent = sent;

  // Save API key
  saveBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) return showToast('Please enter an API key');
    await chrome.storage.local.set({ apiKey: key });
    showToast('✅ API key saved!');
  });

  // Toggle key visibility
  toggleKey.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKey.textContent = isPassword ? '🙈' : '👁';
  });

  // Enter key saves
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
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
