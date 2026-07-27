// Bundled by esbuild into background/clerk-bundle.js and loaded into the
// service worker via importScripts(). Exposes `self.MsgMateClerk`.
//
// The publishable key is not a secret — Clerk's naming convention marks it
// safe to ship in client-side bundles. Sign-in itself happens on the backend
// web app (which already has full Clerk UI); this just reads the session
// that syncHost mirrors into the extension afterward.
import { createClerkClient } from '@clerk/chrome-extension/client';

const PUBLISHABLE_KEY = 'pk_test_YXdhaXRlZC1tdXR0LTkzLmNsZXJrLmFjY291bnRzLmRldiQ';
const SYNC_HOST = 'https://aichat-3-il3q.onrender.com';

let clerkPromise = null;

function getClerk() {
  if (!clerkPromise) {
    clerkPromise = createClerkClient({
      publishableKey: PUBLISHABLE_KEY,
      syncHost: SYNC_HOST,
      background: true
    });
  }
  return clerkPromise;
}

async function getClerkToken() {
  const clerk = await getClerk();
  if (!clerk.session) return null;
  return clerk.session.getToken();
}

// Cheap, no-network-call check other extension surfaces (content scripts,
// the popup) can use to decide whether it's worth asking the background
// worker to talk to the backend at all.
async function getClerkStatus() {
  const clerk = await getClerk();
  return {
    signedIn: Boolean(clerk.session),
    email: clerk.user?.primaryEmailAddress?.emailAddress ?? null
  };
}

self.MsgMateClerk = { getClerkToken, getClerkStatus };
