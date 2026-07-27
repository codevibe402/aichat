// Bundled by esbuild into popup/clerk-bundle.js and loaded via a <script>
// tag before popup.js. Exposes `window.MsgMateClerk`.
import { createClerkClient } from '@clerk/chrome-extension/client';

const PUBLISHABLE_KEY = 'pk_test_YXdhaXRlZC1tdXR0LTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
const SYNC_HOST = 'https://aichat-3-il3q.onrender.com';

let clerkPromise = null;

function getClerk() {
  if (!clerkPromise) {
    clerkPromise = createClerkClient({
      publishableKey: PUBLISHABLE_KEY,
      syncHost: SYNC_HOST
    });
  }
  return clerkPromise;
}

async function getClerkStatus() {
  const clerk = await getClerk();

  if (typeof clerk.load === 'function') {
    await clerk.load();
  }

  return {
    signedIn: Boolean(clerk.session),
    email: clerk.user?.primaryEmailAddress?.emailAddress ?? null
  };
}

function signIn() {
  chrome.tabs.create({ url: SYNC_HOST });
}

window.MsgMateClerk = { getClerkStatus, signIn };
