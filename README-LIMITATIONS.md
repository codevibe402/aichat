# MsgMate — What the Extension Should NOT Do

A clear reference of the security, privacy, and design boundaries that the MsgMate
extension intentionally enforces. These are not bugs or missing features — they
are deliberate constraints that keep user data safe and the architecture sound.

---

## Table of Contents

1. [Security & Secrets](#security--secrets)
2. [What the Content Script Cannot Do](#what-the-content-script-cannot-do)
3. [What the Service Worker Cannot Do](#what-the-service-worker-cannot-do)
4. [What the Backend API Will Not Allow](#what-the-backend-api-will-not-allow)
5. [Design Principles: Out of Scope](#design-principles-out-of-scope)
6. [Privacy: What We Don't Collect](#privacy-what-we-dont-collect)

---

## Security & Secrets

The extension **must never** possess or handle these secrets. They live only on
the backend server.

| Asset | Why It Must Stay Server-Only |
|---|---|
| `GROQ_API_KEY` | If the extension had this, any user could make unlimited LLM calls and rack up costs |
| `SESSION_SECRET` | The JWT signing key; exposing it allows forging session cookies |
| `GOOGLE_CLIENT_ID` (server-side) | Used for token audience verification; must not be overridable |
| `DATABASE_URL` | Direct DB access would bypass all auth checks |
| `REDIS_URL` | Rate limiter state; bypassing allows unlimited requests |

**Key principle:** The extension authenticates via a browser-managed `HttpOnly`
session cookie only. It never stores, reads, or manipulates tokens directly.

---

## What the Content Script Cannot Do

The content script (`content.js`) runs inside the web page's isolated world but
is still subject to strict limitations:

### ❌ No arbitrary message handling
- **Restricted by `ALLOWED_ACTIONS`**: Only `READ_CHAT` and `scanUnreadMail` messages
  are accepted. Any other action sent via `chrome.runtime.sendMessage` is silently
  ignored. This prevents a malicious web page from tricking the content script into
  executing unintended operations.
- **Cannot send messages to the backend directly** — must go through the service worker.

### ❌ No DOM writes (text injection)
- The content script only **reads** the DOM. It never modifies page content,
  injects text, or manipulates page elements.
- Text injection happens in a **separate** script (`injector.js`) with different
  scoping and user-initiated click requirements.

### ❌ No access to page JavaScript
- Runs in an **isolated world** (Chrome MV3 default), so it cannot access variables,
  functions, or objects defined by the page's own JavaScript.
- Can only read the DOM structure, never execute page-side code.

### ❌ No network requests
- Cannot make `fetch` calls to external servers or the backend.
- All backend communication goes through the service worker.

### ❌ No file system access
- Cannot read or write local files.

### ❌ No cookie access
- Cannot read, write, or manipulate `document.cookie` (the session cookie is
  `HttpOnly`).

---

## What the Service Worker Cannot Do

The service worker (`service_worker.js`) is the only component that can make
authenticated backend requests, but it has its own constraints:

### ❌ Cannot bypass auth
- `_getCachedAuthStatus()` caches auth state, but the cache is **in-memory only**
  and cleared when the service worker restarts. A content script or page script
  cannot set `cachedAuthStatus = { signedIn: true }` — the cache lives in the
  service worker's scope.

### ❌ Cannot be called directly by web pages
- The `chrome.runtime.onMessage` router is the only entry point.
- Web pages cannot call `_requestBackend()` directly — it's a private function
  that handles `credentials: 'include'` cookie sending.

### ❌ Cannot override backend configuration
- `DEFAULT_BACKEND_URL` is a hard-coded constant.
- Retry count is fixed at 1 (no configurable retries from the extension).
- Timeout is 25 seconds (via `AbortController`) — not configurable from the page.

### ❌ Cannot access the user's full message history
- Only reads the current chat context via `READ_CHAT` — no persistent message store.
- AI result cache is session-scoped (`chrome.storage.session`) — cleared on browser restart.

---

## What the Backend API Will Not Allow

### ❌ No unauthenticated access
- Every API route calls `requireUser(req)`, which checks the session cookie.
- Requests without a valid session cookie return `401 Unauthorized`.

### ❌ No unvalidated input
- Every endpoint uses Zod schemas to validate input:
  - Message text: max 4,000 characters
  - Messages array: max 50 messages per request
  - Schedule text: max 10,000 characters
  - Summary conversation: max 20,000 characters

### ❌ No rate-limit bypass
- All AI endpoints check `checkRateLimit()` using Redis.
- If Redis is unavailable, the limiter **fails open** (allows the request) but logs
  the error. This is a deliberate tradeoff — blocking all users during Redis
  downtime would be worse than a temporary rate-limit gap.
- Bypassing rate limits from the extension is impossible because the extension
  doesn't know the rate-limit keys (`ratelimit:{endpoint}:{userId}`).

### ❌ No CORS bypass
- The backend checks `EXTENSION_ORIGIN` in `getCorsHeaders()`.
- Only requests from the known extension origin receive CORS headers.
- `OPTIONS` preflight requests from unknown origins return 403.

### ❌ No direct database access
- All data access goes through Prisma queries in API route handlers.
- Every query filters by `userId`, preventing IDOR (Insecure Direct Object Reference) attacks.

---

## Design Principles: Out of Scope

These are intentional architectural decisions — features that were considered but
explicitly excluded to maintain simplicity and security:

### ❌ No auto-send
- AI suggestions must be manually selected and inserted by the user.
- The extension **never** auto-sends messages without explicit user action.
- Even scheduled messages require the user to open the target platform tab when the
  alarm fires — the extension shows a notification, not automatic injection.

### ❌ No message history storage on the client
- The extension does not persist chat messages locally.
- Important messages are stored server-side; the extension fetches them on demand.

### ❌ No cross-device sync of panel state
- Auth status, selected tone, and panel state are per-browser-instance.
- The server stores important messages and schedules, but not transient UI state.

### ❌ No third-party analytics in the extension
- The extension does not collect usage analytics, telemetry, or crash reports.
- The backend may use analytics for debugging, but user message content is never logged.

### ❌ No offline mode
- The extension requires a connection to the backend for all AI features.
- Chat content extraction works offline (DOM reads), but generating replies,
  summaries, and detecting important messages all require the backend API.

### ❌ No extension-to-extension messaging
- The extension does not communicate with other installed extensions.
- All inter-component communication uses the standard Chrome extension message bus.

### ❌ No persistent background listeners
- Uses MV3 service workers (event-driven, no persistent DOM).
- Cannot run long-running background processes.

---

## Privacy: What We Don't Collect

| Data | Stored? | Notes |
|---|---|---|
| Chat message content | No | Read into memory, sent to backend for AI processing, then discarded |
| User's Google OAuth token | No | Sent to backend once for verification, not stored by extension |
| Session cookie | HttpOnly | Browser-managed, not accessible via JS, expires in 30 days |
| AI reply contents | No | Generated fresh per request; cached only in session storage |
| Important message content | Yes (server) | Stored in PostgreSQL, associated with user ID, can be deleted |
| Scheduled message text | Yes (server) | Stored in PostgreSQL until sent or cancelled |
| Task list | Yes (server) | Stored in PostgreSQL, user-scoped |
| Platform URLs | Partial | Schedule `targetUrl` stored for scheduled messages only |
| User email/name | Yes (server) | Stored in PostgreSQL during OAuth, never exposed to client beyond email display |
| IP address | No | Not logged or stored |
| Browser fingerprinting data | No | Not collected |

---

## Summary: The Security Model

```
Web Page (untrusted)
  │  DOM read-only (isolated world, ALLOWED_ACTIONS filter)
  ▼
Content Script
  │  chrome.runtime.sendMessage (action allow-list: READ_CHAT, scanUnreadMail)
  ▼
Service Worker
  │  _requestBackend() with credentials:'include' (PRIVATE)
  ▼
Backend API Routes
  │  requireUser() auth check + Zod validation + rate limiting
  ▼
PostgreSQL + Redis + Groq API (server secrets, never exposed)
```

**The extension never holds secrets. The backend never trusts the client.**
