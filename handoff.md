# MsgMate — Handoff Document

## Project Overview

MsgMate is a Chrome extension (MV3) + Next.js backend that provides AI-powered assistant capabilities inside messaging platforms (WhatsApp, Gmail, Telegram). It reads the open conversation, generates contextual reply suggestions with tone control, detects important/urgent messages via AI, and injects replies into the native input field.

---

## Project Structure

```
msgmate-extension/
├── msgmate-extension/       # Chrome extension source
│   ├── manifest.json
│   ├── content/
│   │   ├── injector.js      # Floating panel UI + auth caching + scan logic
│   │   ├── overlay.css       # Panel styles
│   │   └── content.js        # Platform DOM adapters + READ_CHAT handler
│   ├── background/
│   │   ├── service_worker.js # Auth, API calls, message routing, important CRUD
│   │   └── background-auth.js # Bundled auth helper
│   └── popup/
│       ├── popup.html
│       └── popup.js          # Important tab rendering
├── msgmate-backend/         # Next.js API backend
│   ├── app/api/
│   │   ├── auth/google/route.ts
│   │   ├── ai/reply/route.ts
│   │   ├── ai/detect-important/route.ts
│   │   └── important/route.ts       # CRUD for important messages
│   ├── lib/
│   │   ├── auth.ts           # requireUser() — session cookie check
│   │   ├── session.ts        # JWT cookie create/verify via jose
│   │   ├── prisma.ts         # Prisma client
│   │   ├── ratelimit.ts      # Token bucket rate limiter
│   │   ├── http.ts           # CORS helper, json/unauthorized/OPTIONS
│   │   ├── env.ts            # Zod env validation
│   │   └── ai/
│   │       ├── groq.ts       # Groq LLM client (HTTP calls, error handling)
│   │       ├── aierror.ts    # Custom error classes
│   │       └── prompts/      # AI prompt templates (separated from logic)
│   │           ├── system.ts      # System prompt
│   │           ├── replies.ts     # Reply generation prompt
│   │           ├── summary.ts     # Summary prompt
│   │           ├── important.ts   # Important detection prompt
│   │       └── classify.ts    # Message classification (tasks vs important tab)
│   ├── services/
│   │   └── guardrails/        # Security guardrails for input/output sanitization
│   │       ├── types.ts       # ThreatType enum, interfaces
│   │       ├── patterns.ts    # Regex patterns (PII, injection, spam)
│   │       ├── sanitizer.ts   # sanitizeContent, detectThreats, cleanEmptyTags
│   │       └── index.ts       # SecurityGuardrails class + default singleton
│   ├── messages/
│   │   └── service.ts         # MessageService — orchestrates Route → Guardrails → AI
│   └── prisma/schema.prisma  # User, ImportantMessage, ScheduledMessage
├── frontend/                 # Unrelated frontend (ignore)
├── interview.md              # STAR resume points
└── interview-prep.md         # Interview Q&A prep
```

---

## Current State

### Working Features

| Feature | Status | Details |
|---------|--------|---------|
| Google OAuth | ✅ | `chrome.identity.getAuthToken()` → session cookie |
| AI Reply Generation | ✅ | WhatsApp, Gmail, Telegram. Tone: Friendly/Concise/Formal |
| Important Message Detection | ✅ | AI scans chat, stores server-side, shows in Important tab |
| Important Tab (floating panel) | ✅ | New tab added, loads persisted messages from backend |
| Scan Button | ✅ | Manual trigger in Reply tab, refreshes Important tab |
| WhatsApp Reply | ✅ | Single insert (double-insert bug fixed) |
| Gmail Reply | ✅ | Works |
| Telegram Reply | ✅ | Extraction + injection working (Web K selectors) |
| Auth Caching | ✅ | 2-min TTL in content script, no flicker on tab switch |
| Fetch Timeout | ✅ | 25s AbortController + 30s guard timer |

### Recently Completed

| Item | What |
|------|------|
| Auth flicker fix | Cached auth state in content script to survive service worker wake-up |
| Important tab in panel | 4th tab in floating panel, fetches from `GET /api/important` |
| Scan awaits response | `scanForImportant()` returns result, `loadImportant()` called after |
| Fetch timeouts | `requestBackend()` uses AbortController with 25s timeout |
| Guard timer | Button resets after 30s if service worker doesn't respond |

### Known Issues / Not Yet Done

| Issue | Notes |
|-------|-------|
| Telegram — verify injection | Selectors updated but not yet confirmed working |
| Scheduled messages | Half-built — alarms fire but don't actually inject |
| Theme sync | Not implemented |
| Saved replies | Not implemented |
| "Copy to clipboard" for schedules | Suggested but not built |
| No .gitignore | `node_modules` in `frontend/` and `New folder/` are untracked but not gitignored |

---

## Architecture

### Auth Flow

```
Extension            Service Worker               Backend
    │                     │                          │
    │── getAuthStatus ───→│── GET /api/auth/session ─→│ (cookie check)
    │←──── {signedIn} ────│←──── {signedIn, email} ──│
    │                     │                          │
    │── detectImportant ─→│── POST /api/ai/detect ──→│
    │                     │   important               │ (verify cookie,
    │←── {messages} ─────│←── {saved[], count} ─────│  Groq AI, Prisma save)
    │                     │                          │
    │── getImportant ────→│── GET /api/important ───→│
    │←── {messages[]} ───│←── {messages[]} ────────│
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Session cookies over Bearer tokens | Auto-sent with `credentials: 'include'`, no manual token storage |
| Groq over Anthropic/OpenAI | 4x faster latency (1.5-3s vs 8-12s), 90% cost reduction |
| Next.js over Express | File-based API routes, no middleware setup, future frontend flexibility |
| Prisma + PostgreSQL | Type-safe queries, relational data model, widely supported on cloud |
| Content script auth cache | Survives service worker termination (MV3 requirement) |
| Fire-and-forget auto-scan | Auto-scan on panel open (dedup by hash), manual button for re-scan |

---

## Configuration

### Extension (manifest.json)
- OAuth client ID: `571610066939-sd96f1s3i3sf6oq5lsmhbblpgitdvsif.apps.googleusercontent.com`
- Permissions: `identity`, `storage`, `alarms`
- Host permissions: `https://aichat-9bwl.onrender.com/*`, `https://web.whatsapp.com/*`, `https://mail.google.com/*`, `https://web.telegram.org/*`

### Backend Environment
- `BACKEND_URL`: `https://aichat-9bwl.onrender.com`
- `SESSION_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Same as extension
- `GROQ_API_KEY`: For LLM inference
- `DATABASE_URL`: PostgreSQL connection string
- `RATE_LIMIT_SUMMARY`: Rate limit for detect-important endpoint
- `RATE_LIMIT_WINDOW_MS`: Rate limit window

---

## How to Run

### Backend
```bash
cd msgmate-backend
npm install
npx prisma db push
npm run dev
```

### Extension
1. Go to `chrome://extensions`
2. Enable Developer Mode
3. Load unpacked → select `msgmate-extension/msgmate-extension/`
4. Sign in via the popup
5. Navigate to WhatsApp/Gmail/Telegram, open a chat, click the MsgMate FAB

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `msgmate-extension/content/injector.js` | Panel UI, auth cache, scan/important display, reply injection |
| `msgmate-extension/content/content.js` | Platform-specific DOM adapters, READ_CHAT handler |
| `msgmate-extension/background/service_worker.js` | Message routing, API calls, auth management |
| `msgmate-backend/app/api/ai/detect-important/route.ts` | Important detection endpoint |
| `msgmate-backend/app/api/important/route.ts` | Important message CRUD |
| `msgmate-backend/lib/ai/groq.ts`        | Groq LLM client, prompt templates (delegates to `lib/ai/prompts/`) |
| `msgmate-backend/lib/ai/prompts/`       | Separated AI prompt templates (system, replies, summary, important, classify) |
| `msgmate-backend/services/guardrails/`  | Security guardrails: input sanitization, threat detection, pattern matching |
| `msgmate-backend/messages/service.ts`   | MessageService — orchestrates Route → Guardrails → AI workflow |
| `msgmate-backend/lib/session.ts` | JWT session cookie creation/verification |

---

## Next Steps / Priorities

1. **Verify Telegram** — confirm injection works with updated selectors
2. **Complete scheduled messages** — wire alarm callback to actually inject
3. **Add .gitignore** — prevent node_modules tracking
4. **Saved replies** — let users save/categorize frequent responses
5. **Theme sync** — match extension panel to user's system theme