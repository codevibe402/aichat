const BACKEND_URL = 'https://aichat-9bwl.onrender.com';

async function getClerkStatus() {
  try {
    const stored = await chrome.storage.local.get('msgmate_auth_status');
    if (stored.msgmate_auth_status?.signedIn) return stored.msgmate_auth_status;

    const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (data.signedIn) {
      const status = { signedIn: true, email: data.email || 'your account' };
      await chrome.storage.local.set({ msgmate_auth_status: status });
      return status;
    }
  } catch {}
  return { signedIn: false, email: null };
}

async function getClerkToken() {
  return 'session-cookie';
}

self.MsgMateClerk = { getClerkToken, getClerkStatus };