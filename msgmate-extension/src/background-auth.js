const BACKEND_URL = 'https://aichat-9bwl.onrender.com';

let cachedToken = null;
let tokenExpiry = 0;

async function getClerkToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.token;
    tokenExpiry = Date.now() + 55 * 60 * 1000;
    return cachedToken;
  } catch {
    return null;
  }
}

async function getClerkStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (!res.ok) return { signedIn: false, email: null };
    const data = await res.json();
    return { signedIn: true, email: data.userId || 'your account' };
  } catch {
    return { signedIn: false, email: null };
  }
}

self.MsgMateClerk = { getClerkToken, getClerkStatus };