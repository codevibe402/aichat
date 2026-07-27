const BACKEND_URL = 'https://aichat-9bwl.onrender.com';

async function getClerkStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) {
      return { signedIn: false, email: null };
    }
    const data = await res.json();
    return { signedIn: true, email: data.userId || 'your account' };
  } catch {
    return { signedIn: false, email: null };
  }
}

async function getClerkToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

function signIn() {
  chrome.tabs.create({ url: BACKEND_URL });
}

window.MsgMateClerk = { getClerkStatus, getClerkToken, signIn };