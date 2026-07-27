# MsgMate — Session Handoff

## Project Structure
```
msgmate-extension/          # Root (monorepo-ish)
├── msgmate-extension/      # Chrome extension (MV3)
│   ├── background/service_worker.js
│   ├── content/content.js, injector.js, overlay.css
│   ├── popup/popup.html, popup.js
│   └── src/background-auth.js, popup-auth.js
├── msgmate-backend/        # Next.js backend (Render)
│   ├── app/api/            # Route handlers
│   ├── lib/ai/groq.ts      # AI prompts
│   ├── lib/auth.ts, http.ts, prisma.ts, redis.ts
│   └── prisma/schema.prisma
├── frontend/               # Landing page (Vite+React)
└── New folder/             # AI Studio (experimental)
```

## Changes Made This Session

### 1. Schedule → chrome.alarms (`msgmate-extension/background/service_worker.js`)
- Removed 1-min periodic `msgmate-poll-due-schedules` alarm
- On `scheduleMessage`: registers `chrome.alarms.create(scheduleId, {when: dueAt})`
- `handleDueSchedule`: fetches only that schedule's payload on alarm fire
- `cancelSchedule`: clears the corresponding chrome alarm
- `getScheduled`: re-registers missing alarms for PENDING schedules

### 2. AI Result Cache (`msgmate-extension/background/service_worker.js`)
- Cache in `chrome.storage.session` (auto-cleared on browser restart)
- Keyed by `hash(platform + tone + messages)` or `hash(conversation)`
- `normalizeForCache` strips whitespace + timestamps for better hit rate
- `generateReplies` and `summarizeChat` check cache before calling backend

### 3. Auth Session Cache (`msgmate-extension/background/service_worker.js`)
- `getValidToken()`: checks `chrome.storage.local` for token with 55min expiry
- Only calls `Clerk.getClerkToken()` when cached token is within 5min of expiry
- `getAuthStatus` cached in-memory for 60s
- On 401, invalidates cached token

### 4. Context Capped to 10 Messages
- `content/content.js`: all adapter `slice(-20)` → `slice(-10)`
- `content/injector.js`: all `slice(-30)`/`slice(-20)` → `slice(-10)`

### 5. Removed Auto-Retry Storms
- `content/injector.js`: `refreshActiveTabData` triple setTimeout → single 400ms delay
- `background/service_worker.js`: `requestBackend` max 1 retry (5xx only)

### 6. Trimmed Backend Prompts (`msgmate-backend/lib/ai/groq.ts`)
- System prompt: `"Valid JSON only. Concise, polite replies."`
- Generate prompt: removed redundant formatting instructions
- Summary prompt: stripped boilerplate

### 7. Fixed Popup Buttons Not Clickable (`msgmate-extension/popup/popup.js`)
- Removed `import * as THREE from 'three'` + dead scene/camera setup
- Classic `<script>` tags can't use `import`; caused silent crash, preventing all event listeners from attaching

### 8. Important + Tasks Backend & UI
**Prisma models** (`msgmate-backend/prisma/schema.prisma`):
- `ImportantMessage`: platform, senderName, preview, urgency (URGENT/HIGH/MEDIUM/LOW), isRead
- `Task`: title, description, priority (HIGH/MEDIUM/LOW), source, dueDate, isCompleted
- Both have proper relations to User + indexes

**API routes** (`msgmate-backend/app/api/`):
- `GET/POST /api/important` — list (sorted by urgency/time, unread by default), create
- `PATCH/DELETE /api/important/[id]` — mark read, delete
- `GET/POST /api/tasks` — list (incomplete by default, sorted by priority), create
- `PATCH/DELETE /api/tasks/[id]` — update, toggle complete, delete

**Extension wiring** (`msgmate-extension/background/service_worker.js`):
- New handlers: `getImportant`, `saveImportant`, `markImportantRead`, `deleteImportant`
- New handlers: `getTasks`, `saveTask`, `completeTask`, `deleteTask`

**Popup UI** (`msgmate-extension/popup/popup.js`, `popup/popup.html`):
- Important tab: renders urgency-colored cards with platform, subject, preview, sender
- Tasks tab: renders checkbox-togglable cards with priority colors, due dates
- Data fetched on tab switch via chrome.runtime.sendMessage

### 9. Database Migration
- Ran: `npx prisma migrate dev --name add_important_and_tasks`
- Migration applied to Neon DB (public schema)
- Prisma Client regenerated

## Pending / Next Steps

### High Priority
- **Content script integration**: Wire `content/injector.js` to detect important messages (e.g., via urgency heuristics or platform-specific signals) and call `saveImportant` to the background worker
- **Task extraction from conversations**: Use AI (summarize or dedicated prompt) to extract action items from chat context and call `saveTask`
- **Mark as read from popup**: Add click-to-dismiss on important cards
- **Delete task from popup**: Add delete button on task cards

### Medium Priority
- **Memory tab**: This tab still shows static mock data — needs a backend model and API routes if it's to be functional (stores people, projects, preferences per user)
- **Stats in settings**: Could show important/task counts alongside scheduled/sent
- **Offline support**: Cache important messages and tasks in `chrome.storage.local` for offline viewing (similar to schedule cache pattern)

### Low Priority / Polish
- Remove `three` from `msgmate-extension/package.json` dependencies (no longer used)
- Add loading spinners to important/tasks lists while fetching
- Error states for network failures in the popup

## Key URLs
- Backend: `https://aichat-3-il3q.onrender.com`
- Clerk: `https://awaited-mutt-93.clerk.accounts.dev`
- Neon DB: `ep-green-dawn-a7b3cx0l-pooler.ap-southeast-2.aws.neon.tech`

## CLI Commands
```powershell
# Build Clerk auth bundles
cd msgmate-extension\msgmate-extension
npm run build

# Run migrations
cd msgmate-extension\msgmate-backend
npx prisma migrate dev --name <migration_name>

# Start backend dev
cd msgmate-extension\msgmate-backend
npm run dev
```
