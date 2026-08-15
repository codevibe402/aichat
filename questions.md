# MsgMate — Common Questions & Answers

This document compiles the most frequent questions about the MsgMate Chrome extension project, drawn from the interview prep guide, resume STAR points, handoff document, and source code.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Communication](#architecture--communication)
3. [Platform Support](#platform-support)
4. [Authentication](#authentication)
5. [AI & LLM](#ai--llm)
6. [Database & Storage](#database--storage)
7. [Rate Limiting](#rate-limiting)
8. [Security](#security)
9. [Performance & Caching](#performance--caching)
10. [Bug Fixes & Trade-offs](#bug-fixes--trade-offs)
11. [Debugging & Testing](#debugging--testing)
12. [Setup & Configuration](#setup--configuration)
13. [Known Issues & Future Work](#known-issues--future-work)

---

## Project Overview

### Q: What is MsgMate?

**A:** MsgMate is a Chrome extension (MV3) + Next.js backend that provides AI-powered assistant capabilities inside messaging platforms (WhatsApp, Gmail, Telegram, Slack, Discord, and more). It reads the conversation you're viewing, generates contextual reply suggestions with tone control (Friendly/Concise/Formal), detects urgent/important messages via AI classification, summarizes chat threads, and injects replies directly into the native input field — all without leaving the page.

### Q: What are the core features?

**A:** The four main features are:

| Feature | Description |
|---|---|
| **AI Reply Generation** | Reads current chat context, sends it to the backend's Groq LLM API, and shows 3 reply suggestions with tone selection |
| **Important Message Detection** | AI scans the conversation and flags URGENT/HIGH/MEDIUM/LOW messages that need attention; results persist server-side and appear in a dedicated "Important" tab |
| **Chat Summarization** | Generates a bullet-point summary of the conversation thread |
| **Message Scheduling** | Lets users schedule a reply to be sent at a future time; uses BullMQ delayed jobs with Redis |

### Q: What platforms does MsgMate support?

**A:** 10 platforms total: WhatsApp, Gmail, Telegram, Instagram, Slack, Discord, Twitter, X (Twitter), Microsoft Teams, and Google Chat. Of these, 5 have dedicated DOM adapters with real message extraction (WhatsApp, Gmail, Telegram, Slack, Discord). The remaining 5 (Instagram, Twitter, X, Teams, Google Chat) use a generic fallback that returns an empty array — intentionally conservative to avoid wrong sender attribution.

---

## Architecture & Communication

### Q: How does the extension communicate with the backend?

**A:** The content script (running inside the page) communicates with the background service worker via `chrome.runtime.sendMessage`. The service worker then makes `fetch` calls to the Next.js backend with `credentials: 'include'` for cookie-based auth. The content script never calls the backend directly — all requests go through the service worker, which handles auth, retries, and error responses.

The flow is:
```
Content Script ←→ chrome.runtime.sendMessage ←→ Service Worker ←→ fetch() ←→ Backend (Next.js)
```

### Q: How does the floating panel work?

**A:** The panel is injected by `injector.js` (a content script) as a floating FAB (Floating Action Button) on supported pages. When clicked, it renders an HTML panel with four tabs: Reply, Summary, Important, and Schedule. The panel communicates with the service worker via `chrome.runtime.sendMessage` using actions like `READ_CHAT`, `generateReplies`, `summarizeChat`, `detectImportant`, `getImportant`, `scheduleMessage`, etc.

### Q: How do you handle cross-origin requests from a browser extension?

**A:** The extension's service worker runs in its own isolated context, not in a web page. Fetch requests from the service worker are not subject to CORS restrictions — they're treated like same-origin requests. The backend still needs to handle `OPTIONS` preflight requests (we have a shared `OPTIONS` handler that sets CORS headers) because extension popup pages do run in a web context and need CORS. The `EXTENSION_ORIGIN` environment variable is used to validate the request origin on the backend.

### Q: How does the platform detection work?

**A:** The content script checks `location.hostname` against a `PLATFORM_MAP` dictionary that maps hostnames to platform keys (e.g., `"web.whatsapp.com": "whatsapp"`). The platform key is then used to select the appropriate DOM adapter function and input selector for text injection.

### Q: How does message extraction work for each platform?

**A:** Each platform has a dedicated adapter function in `content.js`:

- **WhatsApp**: Queries `.message-in, .message-out, [data-testid='msg-container']` and checks for `.message-out` class to determine if a message was sent by the user
- **Gmail**: Queries `.a3s.aiL` and `.gD[email]` to extract message bodies and sender emails, comparing against the logged-in user's email from the Google account switcher
- **Telegram**: Queries `.message` elements and checks for `.own` or `.out` class for sent messages
- **Slack**: Uses `[data-qa='virtual-list-item']` and `[data-qa='message_sender_name']`, comparing sender name to the current user's display name
- **Discord**: Uses `[class*='messageContent']` selectors and walks up the DOM to find the username

All adapters return `{sender: "me" | "them", text: string}` arrays, are wrapped in try/catch, and log to console with `console.table` for debugging.

### Q: How does reply injection work?

**A:** The `injectText()` function in `injector.js` uses platform-specific `INPUT_SELECTORS` to find the correct contenteditable input element. It then calls `insertIntoInput()`, which:

1. Focuses the element
2. Creates a selection range at the end of the content
3. Uses `document.execCommand('insertText', false, text)` for contenteditable elements
4. Falls back to `el.textContent = text` + dispatching an `input` event if execCommand fails
5. For textarea/input elements, sets the value via the property descriptor setter and dispatches `input` and `change` events

For platforms without a matching selector, the text is copied to the clipboard as a fallback.

---

## Authentication

### Q: What auth system does MsgMate use?

**A:** MsgMate uses custom Google OAuth via Chrome's `chrome.identity.getAuthToken()` API, paired with server-side session cookies. The extension obtains a Google OAuth token, sends it to `POST /api/auth/google` on the backend, which verifies it via Google's `tokeninfo` or `userinfo` APIs, then sets an HttpOnly, SameSite=None, Secure JWT session cookie (`msgmate_session`) using the `jose` library.

### Q: Why did you replace Clerk with custom Google OAuth?

**A:** Clerk added 100KB+ of vendored JavaScript libraries, required external SDK calls from content scripts, and had frequent token refresh failures in the browser extension context. Replacing Clerk with `chrome.identity.getAuthToken()` + a simple session cookie check simplified auth to a single `GET /api/auth/session` call with `credentials: 'include'`. This eliminated token refresh race conditions and removed dependency on external auth SDK lifecycle management.

### Q: Why session cookies over Bearer tokens?

**A:** Bearer tokens require the extension to store them in `chrome.storage` and attach them to every request. A session cookie is automatically sent by the browser with `credentials: 'include'`, eliminating token management code entirely. The HttpOnly flag prevents XSS access, SameSite=None allows cross-origin requests from extension pages, and Secure ensures it only transmits over HTTPS. The JWT is signed with a server secret, so we verify authenticity without a database lookup on every request.

### Q: What's the auth flow end-to-end?

**A:**

```
Extension (Popup)           Backend
    │                            │
    │── getAuthToken() ────────→│  (chrome.identity API, Google OAuth)
    │←── token ─────────────────│
    │── POST /api/auth/google ─→│  (verify token via Google API)
    │                            │── upsert User in Prisma
    │                            │── createSessionToken(JWT, 30d)
    │                            │── set HttpOnly cookie
    │←── {signedIn, email} ─────│
    │                             │
    │── GET /api/auth/session ─→│  (on every extension startup/polling)
    │←── {signedIn, email} ─────│  (cookie auto-sent with credentials: 'include')
```

### Q: How does auth work when the service worker is idle?

**A:** Service workers are terminated by Chrome after ~30 seconds of inactivity. The content script (`injector.js`) caches auth status with a 2-minute TTL (`cachedAuth` with `{status, time}`). When the panel opens, `getCachedAuth()` returns the cached signed-in state immediately, while silently refreshing from the service worker in the background. If the service worker message fails during wake-up, the content script falls back to the last known good auth state instead of showing "Sign-in required". The service worker also caches auth in `chrome.storage.local` (`msgmate_auth_status`).

### Q: What permissions does the extension need?

**A:** From `manifest.json`:
- `storage` — for caching auth status and schedules locally
- `alarms` — for scheduling messages with `chrome.alarms.create()`
- `tabs` / `activeTab` — for reading the current tab URL and injecting content scripts
- `scripting` — for programmatic content script injection
- `notifications` — for schedule-due notifications
- `identity` — for Google OAuth via `chrome.identity.getAuthToken()`
- Host permissions for all supported platforms plus the backend URL

---

## AI & LLM

### Q: Why Groq over Anthropic (or OpenAI)?

**A:** The project initially used Anthropic Claude for reply generation, but latency was 8-12 seconds per reply. Switching to Groq's LPU inference engine reduced latency to 1.5-3 seconds — a 4x improvement. The API interface is nearly identical (both use chat completions format with `response_format: { type: "json_object" }`), so the migration only required changing the API endpoint and key. Groq also offers competitive pricing, reducing per-reply cost by roughly 90%.

### Q: Why not run a local model?

**A:** Running a local LLM would eliminate latency and cost, but requires significant resources (8GB+ VRAM for a capable model). Browser extensions run on consumer hardware where that's not guaranteed. A cloud API also simplifies updates — prompts and models can be swapped server-side without pushing extension updates.

### Q: How does the AI prompt work?

**A:** The system prompt is: `"You are the user. Write 3 {tone} replies to the other person's message. Only the person marked THEM needs a reply. Ignore YOUR own messages."` The conversation is formatted with `THEM:` / `YOU:` prefixes, and only "them" messages are included in the "THEM said:" section that the AI is asked to reply to. The AI is explicitly instructed to only reply to THEM messages, never to generate the user's own replies.

### Q: How do you prevent the AI from replying to the user's own messages?

**A:** Two mechanisms work together:
1. **Prompt-level guard**: The prompt says "Reply to THEM only. Never write a message from ME." and includes separate `ME said:` and `THEM said:` sections.
2. **Application-level filtering**: In `groq.ts`, `themMessages` is computed as `input.messages.filter(m => m.sender === "them")`, so only "them" messages are included in the "THEM said:" prompt section. The full conversation is still included for context.

### Q: How does important message detection differ from reply generation?

**A:** Important detection uses a different prompt that classifies messages by urgency (URGENT/HIGH/MEDIUM/LOW) with a reasoning field. It scans the last 20 messages (vs 10 for replies). Results are persisted to PostgreSQL with a 24-hour deduplication window (matching on the first 200 characters of the preview). The endpoint has a stricter rate limit since it consumes more tokens per request.

### Q: What does the classify prompt do?

**A:** The `buildClassifyPrompt` in `lib/ai/prompts/classify.ts` classifies a single message to determine which panel tab it belongs in:

- **`isTask: true`** → message is about the user needing to DO something → goes into the **Tasks tab**
- **`isImportant: true`** → unread email requiring the user's attention → goes into the **Important tab**
- A message can be both a task AND important.

The prompt returns structured JSON with `isTask`, `isImportant`, `summary`, `priority` (0-100), and `deadline` (string or null). The `classifyMessage()` function in `groq.ts` wraps this prompt call and returns the parsed classification result.

Example with the message "Can you send me the report before 5 PM?":
```json
{
  "isTask": true,
  "isImportant": true,
  "summary": "User needs to send a report before 5 PM deadline",
  "priority": 80,
  "deadline": "2024-01-15T17:00:00"
}
```

### Q: What does the AI return?

**A:** For replies: `{"replies": ["reply1", "reply2", "reply3"]}` — exactly 3 strings. If the count isn't exactly 3, an `InvalidReplyCountError` is thrown. For important detection: `{"messages": [{"text": "...", "senderName": "...", "urgency": "HIGH", "reason": "..."}]}`. For summary: a bulleted string.

### Q: How do you handle malformed AI responses?

**A:** The `parseJsonObject()` function first tries `JSON.parse()`. If that fails, it uses a regex (`/\{"[\s\S]*"\}/`) to extract the first JSON object from the response text. If no JSON object is found, an `InvalidJsonError` is thrown. The backend catches these errors and returns appropriate HTTP responses with descriptive error messages.

### Q: What Groq error types are handled?

**A:** From `lib/ai/aierror.ts`:
- `EmptyResponseError` — AI returned no content
- `GroqRequestError` — General API error with status code and message
- `GroqRateLimitError` — HTTP 429 (rate limited)
- `GroqUnauthorizedError` — HTTP 401 (invalid API key)
- `InvalidReplyCountError` — AI didn't return exactly 3 replies
- `InvalidJsonError` — Response wasn't valid JSON

---

## Database & Storage

### Q: Why Prisma + PostgreSQL?

**A:** Prisma provides type-safe database access with auto-generated TypeScript types — when querying the `ImportantMessage` table, the result is fully typed without manual type definitions. PostgreSQL was chosen because it's the most widely supported production database on cloud platforms (Render, Railway, Supabase). The data model (users, important messages, scheduled messages) has clear relational semantics that PostgreSQL handles well. SQLite would be simpler but can't handle concurrent writes; MongoDB would work but Prisma's relational features are stronger with SQL.

### Q: What's the data model?

**A:** The Prisma schema (`schema.prisma`) defines these models:

| Model | Fields | Purpose |
|---|---|---|
| **User** | id, externalId, email, name, timestamps | Auth user record |
| **UserSettings** | id, userId, defaultTone, timezone | Per-user preferences |
| **ScheduledMessage** | id, userId, platform, text, targetUrl, sendAt, status, attempts, timestamps | Scheduled reply messages |
| **AiRequest** | id, userId, type, platform, tone, inputTokens, outputTokens, timestamps | Usage logging |
| **ImportantMessage** | id, userId, platform, senderName, senderEmail, subject, preview, url, urgency, isRead, timestamps | Persisted important messages |
| **Task** | id, userId, title, description, priority, source, sourceUrl, dueDate, isCompleted, timestamps | User tasks |

### Q: What are the status enums for scheduled messages?

**A:** `PENDING`, `DUE`, `SENDING`, `SENT`, `FAILED`, `CANCELLED`, `NEEDS_USER_LOGIN`, `PLATFORM_NOT_OPEN`, `SELECTOR_FAILED`.

---

## Rate Limiting

### Q: How do you handle rate limiting?

**A:** The backend uses a token bucket / sliding window rate limiter stored in Redis (`lib/ratelimit.ts`). Each request is tracked by a Redis sorted set keyed by `ratelimit:{endpoint}:{userId}`. The window is configurable via `RATE_LIMIT_WINDOW_MS` (default: 60000ms = 1 minute) and the limit via `RATE_LIMIT_REPLIES` (default: 20) and `RATE_LIMIT_SUMMARY` (default: 10). The `detect-important` endpoint has its own stricter limit since it consumes more tokens. When the limit is exceeded, the backend returns HTTP 429 with `{ error: "Too many requests" }`.

### Q: How is rate limiting implemented technically?

**A:** It uses Redis sorted sets:
1. Remove entries older than the window (`ZREMRANGEBYSCORE`)
2. Add the current request with timestamp (`ZADD`)
3. Count total entries (`ZCARD`)
4. Set expiry on the key
5. If count exceeds limit, return 429
6. On failure or Redis unavailability, falls back to allowing the request (fail-open)

### Q: How do retries work in the service worker?

**A:** `requestBackend()` in `service_worker.js` implements a retry loop: it retries once on 5xx server errors and on `AbortError` (timeout). The timeout is 25 seconds via `AbortController`, with an additional 30-second guard timer in the UI (`scanCurrentChat()`) that resets the button if no response arrives. 401 responses clear the local auth cache and throw "Session expired" to prompt re-login.

---

## Security

### Q: What security measures are in place?

**A:**

1. **HttpOnly session cookies** — prevents XSS from stealing auth tokens
2. **`ALLOWED_ACTIONS` filter** in `content.js` — only accepts `READ_CHAT` and `scanUnreadMail` messages; ignores all others
3. **Zod input validation** — every API route validates its request body with Zod schemas (e.g., message text max 4000 chars, max 50 messages per request)
4. **CORS validation** — the backend checks `EXTENSION_ORIGIN` and only allows requests from the known extension origin
5. **No direct backend calls from content scripts** — all requests go through the service worker, which is harder for a malicious page to reach
6. **Plain text extraction** — no HTML is preserved in extracted messages (`cleanText()` strips everything), eliminating XSS risk when rendering
7. **User-scoped queries** — all database queries filter by `userId`, preventing IDOR attacks

### Q: What are the OAuth client IDs?

**A:** The current `manifest.json` uses: `857582910778-kb3tcaqahk8151kpvltfnsdlioohisel.apps.googleusercontent.com` with scopes `openid`, `profile`, `email`. (The handoff document mentions an older one: `571610066939-sd96f1s3i3sf6oq5lsmhbblpgitdvsif.apps.googleusercontent.com`.)

### Q: What are the backend environment variables?

**A:** From `lib/env.ts`:
- `DATABASE_URL` (required) — PostgreSQL connection string
- `REDIS_URL` (required) — Redis connection string
- `GROQ_API_KEY` (required) — LLM API key
- `GROQ_MODEL` (required) — Model name (e.g., `llama-3.1-8b-instant`)
- `EXTENSION_ORIGIN` (optional) — Allowed extension origin for CORS
- `SESSION_SECRET` (optional) — JWT signing secret
- `GOOGLE_CLIENT_ID` (optional) — For token audience verification
- `RATE_LIMIT_REPLIES` (default: "20") — Replies per window
- `RATE_LIMIT_SUMMARY` (default: "10") — Summary per window
- `RATE_LIMIT_WINDOW_MS` (default: "60000") — Rate limit window in ms

### Q: Which functions are kept private (must never reach the client)?

**A:** The following functions are marked `@internal` / prefixed with `_` to signal they must never be exposed to the extension or web pages:

| Function | File | Why keep private |
|---|---|---|
| `_callGroq()` | `lib/ai/groq.ts` | Contains the Groq API key; bypassing it allows unlimited AI costs |
| `_parseJsonObject()` | `lib/ai/groq.ts` | Internal JSON parsing implementation detail |
| `createSessionToken()` | `lib/session.ts` | JWT signing; exposing would allow session forgery |
| `_verifySession()` | `lib/session.ts` | JWT verification; only called internally by `getSessionUserId` |
| `_getSecret()` | `lib/session.ts` | Extracts `SESSION_SECRET` from env; server-only |
| `SESSION_COOKIE_OPTIONS` | `lib/session.ts` | Cookie security flags (httpOnly, SameSite, Secure) must not be overridden |
| `prisma` | `lib/prisma.ts` | Direct DB access; all queries go through auth-checked API routes |
| `checkRateLimit()` | `lib/ratelimit.ts` | Redis key patterns and limit logic; bypassing allows API abuse |
| `_requestBackend()` | `service_worker.js` | Handles `credentials: 'include'` cookie sending; bypassing skips auth checks |
| `_getCachedAuthStatus()` | `service_worker.js` | Auth cache; if spoofable, allows auth bypass |
| `_hashString()`, `_normalizeForCache()`, `_makeCacheKey()` | `service_worker.js` | Internal cache management; not overridable |
| `ALLOWED_ACTIONS` | `content.js` | Security boundary — only `READ_CHAT` and `scanUnreadMail` accepted |

**Naming convention:** Functions prefixed with `_` are module-private/internal. Functions without the prefix are the public API surface (callable from route handlers or message routers). The `@internal` JSDoc tag further signals "do not import from outside this module."

### Q: What should the extension NEVER be able to do?

| Capability | Handled by | Why private |
|---|---|---|
| AI API calls | Backend only | Protects `GROQ_API_KEY`, enforces rate limits |
| Session token creation/verification | Backend only | Prevents session forgery |
| Direct DB queries | Backend via API routes | Prevents data leaks, enforces user-scoped queries |
| Rate limit checking | Backend only | Prevents abuse/cost overruns |
| Auth cookie management | Browser + backend | HttpOnly prevents XSS theft |
| Message extraction | Content script (read-only) | Isolated world prevents page JS interference |

---

## Performance & Caching

### Q: How does AI result caching work?

**A:** The service worker caches AI results in `chrome.storage.session` (cleared on browser restart):
- Cache key = `msgmate_ai_cache_` + hash of (platform, tone, messages, requestType)
- Messages are normalized (whitespace collapsed, timestamps scrubbed) before hashing
- Only the last 10 messages are included in the hash
- If a cache hit is found, the cached result is returned without calling the backend
- Each result is cached for the session duration (no explicit TTL — cleared on restart)

### Q: How does the auth cache TTL work?

**A:** The content script (`injector.js`) caches auth status with a 120-second (2-minute) TTL: `if (cachedAuth.status?.signedIn && Date.now() - cachedAuth.time < 120_000)`. The service worker caches auth for 60 seconds: `authStatusExpiry = Date.now() + 60000`. On cache miss, both fall back to checking `chrome.storage.local` first, then making a `fetch` to `GET /api/auth/session`.

### Q: How does important message deduplication work?

**A:** The backend checks for an existing `ImportantMessage` with the same `userId`, `preview` (first 200 chars), and `detectedAt` within the last 24 hours. If a match exists, the message is skipped (not re-saved). This prevents duplicate important messages from repeated scans.

---

## Bug Fixes & Trade-offs

### Q: What was the auth flicker bug and how was it fixed?

**A:** When switching browser tabs or returning after minimizing, the floating panel briefly showed "Sign-in required" even though the user was signed in. Root cause: Chrome terminates service workers after ~30 seconds of inactivity, and `chrome.runtime.sendMessage` calls can fail or timeout while the worker restarts.

**Fix:** Added a cached auth state (`cachedAuth`) in the content script with a 2-minute TTL. `getCachedAuth()` returns the cached signed-in status immediately on panel open, while silently refreshing from the service worker in the background. If the service worker message fails, the content script falls back to the last known good auth state.

### Q: How was the WhatsApp double-reply injection bug fixed?

**A:** After `execCommand('insertText')` successfully placed text into the contenteditable input, the code also dispatched a synthetic `InputEvent` to trigger React's change detection. The redundant dispatch caused WhatsApp Web's React handler to process the insertion again, resulting in a double-write. **Fix:** Removed the `InputEvent` dispatch after `insertText`, keeping only `execCommand('insertText')` followed by triggering the native input's `oninput` via React's internal `Object.getOwnPropertyDescriptor` pattern.

### Q: What was the Telegram issue and how was it fixed?

**A:** Telegram Web K showed "no chat context" errors, suggested replies to the user's own messages instead of the other party, and failed to inject replies into the input field.

**Fix (3 parts):**
1. Updated the Telegram adapter in `content.js` and context extractor in `injector.js` to target Telegram Web K's DOM structure (`.messages-container`, `.message`, `.bubble`)
2. Added sender distinction — `.bubble.is-you` maps to "me", other bubbles to "them"
3. Updated `INPUT_SELECTORS` for Telegram to: `#message-input-text #editable-message-text, #editable-message-text, [contenteditable="true"][aria-label="Message"], ...`
4. The AI prompt (`groq.ts`) explicitly separates ME/THEM messages and instructs the AI to only reply to THEM

### Q: Why did you switch from MV2 to MV3?

**A:** MV3 is Google's current standard — new extensions must use it, and MV2 is being phased out. The main difference is that background pages became service workers (event-driven, no persistent DOM). This caused the auth flicker bug, but it also improves security and resource usage. In MV2, the persistent background page would have kept auth state always available without caching. In MV3, we had to design the auth state caching system specifically because service workers can terminate at any time.

### Q: What's the biggest trade-off in this architecture?

**A:** The extension's content script cannot persist state across page reloads or browser restarts — all persistent state lives in `chrome.storage` or the backend. This means the auth cache is volatile (cleared on restart), requiring a fresh session check. The upside is better security (isolated worlds, no persistent background DOM) and lower memory usage.

---

## Guardrails & Security

### Q: What is the SecurityGuardrails service?

**A:** The `services/guardrails/` module provides input sanitization and threat detection for untrusted content. It's composed of 4 files:

| File | Contents |
|---|---|
| `types.ts` | `ThreatType` enum (task_override, prompt_injection, sensitive_data, dangerous_action) and interfaces (`SecurityPattern`, `SanitizationResult`, `ValidationResult`) |
| `patterns.ts` | `SECURITY_PATTERNS` (PII, prompt injection, spam regexes), `STRICT_PATTERNS` (credentials, emails, bypass attempts), `getPatterns()`, `PRESERVED_TAGS` |
| `sanitizer.ts` | `sanitizeContent()` (redacts threats), `detectThreats()` (detection only), `cleanEmptyTags()` (cleanup) |
| `index.ts` | `SecurityGuardrails` class with `sanitize()`, `detectThreats()`, `validate()`, and strict-mode variants; exports a default `guardrails` singleton |

### Q: How does the SecurityGuardrails class work?

**A:** The class wraps the sanitizer functions in a stateful service with:

- **`sanitize(content, options?)`** — Removes threats from content, returns sanitized text + detected threats
- **`detectThreats(content, options?)`** — Detects threats without modifying content
- **`validate(content, options?)`** — Returns `{isValid, threats, message}`. In strict mode, any threat = invalid. In normal mode, only `TASK_OVERRIDE` and `DANGEROUS_ACTION` are critical
- **`cleanEmptyTags(content)`** — Removes leftover empty HTML tags after sanitization
- **`setEnabled()` / `setStrictMode()`** — Toggles configured at runtime

A default singleton (`guardrails`) is exported for convenient use: `import { guardrails } from '@/services/guardrails'`.

### Q: What threats does it detect?

**A:**

**Core patterns** (always active):
- Task override attempts (`ignore previous instructions`, `your new task is`, `ultimate task`)
- Prompt injection (system prompt references, fake tags like `nano_untrusted_content`, XML injection)
- Sensitive data (SSN, credit card numbers)

**Strict patterns** (enabled via `strict: true` or `setStrictMode(true)`):
- Credential detection (passwords, API keys, secrets in key=value format)
- Email address redaction
- Security bypass attempts (`bypass security`, `circumvent safety`)

---

## Debugging & Testing

### Q: How do you debug the extension?

**A:**

1. **Service worker logs**: `chrome://extensions` → "Inspect views" → service worker console
2. **Content script console**: Open DevTools on any supported page → Console (use `console.groupCollapsed` with `console.table` for structured message extraction logs)
3. **Backend logs**: `npm run dev` in `msgmate-backend/` shows request logs, AI errors, and rate limit events
4. **Network tab**: Check `fetch` calls from the service worker (they appear under the service worker's network context, not the page's)
5. **Storage inspection**: `chrome://extensions` → "Inspect views" → Application tab → Local/Session storage

### Q: How did you test this project?

**A:** Manual testing on live WhatsApp, Gmail, and Telegram (no automated E2E — DOM-based testing is fragile across platforms that frequently update their UI). The `console.groupCollapsed` + `console.table` logs in `content.js` let you verify exactly what messages the AI receives. The backend validates all input with Zod schemas, and the `/api/health` endpoint checks both database and Redis connectivity.

### Q: What's the debugging tip for wrong AI replies?

**A:** Open DevTools → Console on the messaging platform page. When the panel reads the chat, `[MsgMate] Extracted N messages from {platform}` appears with a `console.table` of the extracted `{sender, text}` pairs. This shows exactly what the AI receives — if the suggestions are wrong, check if the sender attribution is correct or if the message text was extracted properly.

---

## Setup & Configuration

### Q: How do you run the backend?

**A:**

```bash
cd msgmate-backend
npm install
npx prisma db push    # set up the database schema
npm run dev           # start the Next.js dev server
npm run worker        # (separate terminal) start the BullMQ scheduler worker
```

Requires `.env` with `DATABASE_URL`, `REDIS_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, and `EXTENSION_ORIGIN`.

### Q: How do you load the extension for development?

**A:**

1. Start the backend from `../msgmate-backend`
2. Build the Clerk auth bundles: `npm install && npm run build` in the `msgmate-extension/` folder
3. Open `chrome://extensions`, enable Developer mode, click "Load unpacked"
4. Select the `msgmate-extension/` folder
5. Open the popup → "Sign in to MsgMate" → signs in via Google OAuth
6. Navigate to a supported platform (WhatsApp/Gmail/Telegram) and click the purple FAB

### Q: What's the difference between the backend README and the actual implementation?

**A:** The backend README (`msgmate-backend/README.md`) still references Clerk (`requireUser()` in `lib/auth.ts` checks session cookies, but the README says `Authorization: Bearer <clerk-session-token>`). The `handoff.md` and actual code use session cookies via `GET /api/auth/session`, not bearer tokens. The README also mentions API routes `/api/ai/replies` and `/api/ai/summary` (which exist), as well as `/api/schedules` endpoints (which exist). The README is partially outdated — the auth implementation has moved from Clerk to custom session cookies, but the API route structure matches.

### Q: How do I rebuild after editing auth source?

**A:** After editing `src/background-auth.js` or `src/popup-auth.js`, re-run `npm run build` (or `npm run watch`) in the `msgmate-extension/` folder to regenerate the bundled `background/clerk-bundle.js` and `popup/clerk-bundle.js` files, then reload the extension in `chrome://extensions`.

---

## Known Issues & Future Work

### Q: What are the known issues?

**A:**

| Issue | Status | Notes |
|---|---|---|
| Telegram injection confirmation | ⚠️ | Selectors updated but not yet verified working end-to-end |
| Scheduled message delivery | ⚠️ | Half-built — alarms fire but don't actually inject/send |
| Theme sync | Not started | Panel doesn't match system theme |
| Saved replies | Not started | No way to save/categorize frequent responses |
| Generic platform adapters | Partial | Instagram, Twitter, Teams, Google Chat return empty arrays |
| No .gitignore | Warning | `node_modules` in `frontend/` and `New folder/` are untracked but not gitignored |

### Q: How does the schedule flow work (and why is it incomplete)?

**A:** The intended flow is:

1. Extension creates a schedule via `POST /api/schedules`
2. Backend stores it in PostgreSQL and adds a delayed BullMQ job via Redis
3. The scheduler worker (`workers/scheduler.ts`) marks the schedule as `DUE` when its time arrives
4. Extension polls `GET /api/schedules/due` via the service worker
5. Extension sends the message through browser automation
6. Extension reports the result to `POST /api/schedules/:id/status`

**Current state:** Step 2-3 work (BullMQ job fires, worker updates status to `DUE`), but step 4-6 are incomplete. The service worker polls `/api/schedules` (not `/due`), and `handleDueSchedule()` only creates a notification — it doesn't inject the text. The `chrome.alarms` system in the extension mirrors the backend schedule for client-side notifications.

---

## Key Numbers

| Metric | Value |
|---|---|
| Auth bundle size reduction (removing Clerk) | ~100KB |
| Reply generation latency (Groq vs Anthropic) | 1.5-3s vs 8-12s |
| Cost per reply reduction | ~90% |
| Supported platforms | 10 total, 5 with full adapters |
| Auth cache TTL (content script) | 2 minutes |
| Auth cache TTL (service worker) | 1 minute |
| Important message dedup window | 24 hours |
| Fetch timeout | 25s (AbortController) |
| Scan guard timer | 30s |
| Rate limit retries | 1 (on 5xx / timeout) |
| Max messages per AI request | 50 (input capped at 10 displayed) |
| Max message text length | 4000 characters |
| Session cookie lifetime | 30 days |
| Messages read from chat | Last 10 |
| Important messages scanned | Last 20 |

---

## Basic Concepts & Fundamentals

### Q: What is a browser extension?

**A:** A browser extension is a small software program that adds functionality to a web browser. Extensions are built with web technologies (HTML, CSS, JavaScript) and run in the browser's context. In Chrome (and most Chromium-based browsers), extensions use a **manifest file** (`manifest.json`) that declares what the extension does, what permissions it needs, and what files to load.

### Q: What is "Load Unpacked" in Chrome?

**A:** "Load unpacked" is a Chrome DevTools feature at `chrome://extensions` that lets you load a directory of extension files (that aren't bundled as a `.crx` file) directly into the browser for development. You enable "Developer mode" in the extensions page, click "Load unpacked", and select the folder containing the extension's `manifest.json`. Chrome then treats that folder as an installed extension — any changes you make to the source files trigger a live reload. This is how MsgMate is developed and tested locally.

### Q: What is Manifest V3 (MV3)?

**A:** Chrome Manifest V3 is the current standard for Chrome extensions. The key differences from MV2:
- **Service Worker**: Background pages became event-driven service workers (no persistent DOM). They start when needed and terminate after ~30s of inactivity.
- **Content Security Policy**: Stricter CSP rules — fewer inline scripts allowed, `eval()` is blocked.
- **API changes**: Some APIs were updated or deprecated. MV2 is being phased out entirely.

### Q: What is a content script?

**A:** A content script is a JavaScript file that runs in the context of the web page (injected by the extension). It can read and modify the page's DOM, but runs in an **isolated world** — it has its own JavaScript environment separate from the page's scripts. In MsgMate, `content.js` reads chat messages from WhatsApp/Gmail/Telegram, and `injector.js` injects the floating panel UI.

### Q: What is a service worker in the context of Chrome extensions?

**A:** In MV3, the service worker replaces the background page. It's an event-driven script that handles long-running tasks, message routing, alarms, and API calls. It doesn't have a DOM and can be terminated by the browser at any time (after ~30s of inactivity). This is why MsgMate caches auth state — because `chrome.runtime.sendMessage` calls can fail while the worker is waking up.

### Q: What is `chrome.runtime.sendMessage`?

**A:** It's the message-passing API in Chrome extensions for communication between different extension components (content scripts, service workers, popups). You call `chrome.runtime.sendMessage({action: "X", data: {...}})` and the service worker receives it in its `onMessage` listener. The response can be sent synchronously or asynchronously (returning `true` keeps the channel open for async responses).

### Q: What is `chrome.identity.getAuthToken()`?

**A:** A Chrome extension API that handles the OAuth 2.0 flow with Google (or other providers) without requiring a popup redirect. It uses the `oauth2` section of `manifest.json` (which includes the `client_id` and `scopes`). It returns an access token that can be exchanged for user profile information. MsgMate uses this for Google sign-in — the token is sent to the backend, which verifies it with Google's APIs and creates a session cookie.

### Q: What are host permissions in a Chrome extension?

**A:** Host permissions (declared in `manifest.json` under `host_permissions`) grant the extension access to specific websites. They control which pages the extension's content scripts can run on and which origins the service worker can make `fetch` requests to. MsgMate declares permissions for all supported platforms (WhatsApp, Gmail, Telegram, etc.) plus the backend URL.

### Q: What is an HttpOnly cookie?

**A:** An HttpOnly cookie is a cookie that cannot be accessed via JavaScript (`document.cookie`), preventing XSS attacks from stealing session cookies. The browser still sends it automatically with requests. MsgMate's session cookie uses `HttpOnly: true` along with `SameSite=None` and `Secure` flags for proper cross-origin extension-to-backend authentication.

### Q: What is CORS?

**A:** Cross-Origin Resource Sharing is a browser security mechanism that controls whether a web page can make requests to a different domain than the one it was loaded from. Since browser extensions use content scripts that run in web page contexts (for popups), the backend needs to send proper CORS headers. However, service worker `fetch` calls are not subject to CORS restrictions.

### Q: What is Next.js API Routes?

**A:** Next.js API Routes let you write backend endpoints as TypeScript/JavaScript files in the `app/api/` directory (or `pages/api/` in older Next.js). Each file automatically becomes an API endpoint with the same path. This means you don't need a separate Express server — the framework handles routing, JSON parsing, and CORS. MsgMate's backend uses API routes for all endpoints (`/api/auth/google`, `/api/ai/replies`, `/api/important`, etc.).

---

## Architecture Patterns

### Q: What is the MessageService and what workflow does it implement?

**A:** The `messages/service.ts` file contains the `MessageService` class — an orchestration layer between API routes and the AI/guardrails/prompts subsystems. It implements this workflow:

```
Route (POST /api/ai/replies)
  ↓
MessageService.generateReply()
  ↓
Guardrails.sanitize(prompt)     ← strips PII, injection, spam
  ↓
AIProvider.chat(prompt)         ← Groq LLM API call
  ↓
Guardrails.validate(raw)        ← validates AI output
  ↓
Parse JSON → { replies: [...], usage, threats }
```

Instead of the route calling `generateReplies()` from `groq.ts` directly, it now calls `messageService.generateReply(body)`, which:
1. Builds the prompt using `buildReplyPrompt()` from `lib/ai/prompts/replies.ts`
2. Sanitizes the prompt with `guardrails.sanitize()` (strict mode — redacts PII, emails, credentials)
3. Sends the sanitized prompt to the AI via `chat()` from `groq.ts`
4. Validates the AI response with `guardrails.validate()` (normal mode — only rejects critical threats)
5. Parses the JSON into structured reply suggestions

This separates concerns: routes handle HTTP/auth, MessageService handles orchestration, guardrails handle security, and groq.ts handles the raw LLM API.

### Q: How does the Guardrails service fit into the workflow?

**A:** The `services/guardrails/` module provides:
- **Input sanitization**: `guardrails.sanitize(prompt)` redacts PII (SSN, credit cards, emails in strict mode) and blocks prompt injection attempts before they reach the AI
- **Output validation**: `guardrails.validate(raw)` checks the AI's response for threats (task override, injection, XML tags) — in normal mode only critical threats are rejected, in strict mode any threat fails validation
- **Threat reporting**: Both steps return detected threat types (`ThreatType`), which are included in the API response so the extension can inform the user

### Q: Where are the prompt templates stored?

**A:** All AI prompt templates are in `lib/ai/prompts/`:
- `system.ts` — shared system prompt ("Valid JSON only. Concise, polite replies.")
- `replies.ts` — reply generation prompt (uses `THEM:/YOU:` prefixes, filters to "them" messages only)
- `summary.ts` — chat summarization prompt (3-5 bullet points)
- `important.ts` — important message detection (urgency classification)
- `classify.ts` — message classification (routes to Tasks vs Important tab)
- `index.ts` — barrel export re-exporting all types and functions

They're separated from the LLM client logic (`groq.ts`) so prompts can be iterated on independently of the API integration code.

---

## Questions to Ask the Interviewer

> *"This project taught me a lot about Chrome extension architecture and the tradeoffs between third-party SDKs and custom implementations. I'm curious — how does your team handle service worker lifecycle in your extension products, if you have any?"*

> *"We chose Next.js for the backend because of API routes and future flexibility. What's your team's preferred backend stack for API services, and why?"*
