const BACKEND_URL = 'https://aichat-9bwl.onrender.com';

async function signInWithGoogle() {
  const manifest = chrome.runtime.getManifest();
  const clientId = '857582910778-kb3tcaqahk8151kpvltfnsdlioohisel.apps.googleusercontent.com';
  const redirectUri = chrome.identity.getRedirectURL('oauth/callback');
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'id_token');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('nonce', nonce);

  try {
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    if (!redirectUrl) return null;

    const fragment = new URLSearchParams(redirectUrl.split('#')[1]);
    const idToken = fragment.get('id_token');
    if (!idToken) return null;

    const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();
    if (data.signedIn) {
      await chrome.storage.local.set({
        msgmate_auth_status: { signedIn: true, email: data.email || 'your account' }
      });
      return data;
    }
  } catch (err) {
    console.warn('[MsgMate] Google sign-in failed:', err);
  }
  return null;
}

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

function signIn() {
  signInWithGoogle();
}

window.MsgMateClerk = { getClerkStatus, getClerkToken, signIn };