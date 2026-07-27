# MsgMate

MsgMate is an AI-powered Chrome extension for drafting replies, summarizing conversations, and scheduling messages across popular web messaging platforms. It includes a Next.js backend that keeps AI keys, schedule persistence, queue processing, and delivery status tracking outside the browser extension.

## Features

- AI reply suggestions with selectable tones
- Automatic message/thread context detection on supported pages
- Chat and email summarization
- Message scheduling with backend persistence
- Floating in-page assistant panel
- Chrome toolbar popup for backend connection and quick actions
- PostgreSQL-backed schedule and usage storage
- Redis + BullMQ worker for delayed schedule processing
- Groq-powered AI generation through a secure backend API

## Supported Platforms

Current extension targets:

- Gmail
- WhatsApp Web
- Telegram Web
- Instagram DMs
- Slack
- Discord
- X / Twitter DMs
- Microsoft Teams
- Google Chat

Platform support depends on each product's web UI. DOM selectors may need updates when those sites change.

## Tech Stack

### Chrome Extension

- Manifest V3
- Content scripts
- Background service worker
- Chrome Storage, Tabs, Scripting, Alarms, and Notifications APIs
- Plain HTML/CSS/JavaScript

### Backend

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Groq API

## Repository Structure

```text
.
+-- msgmate-extension/
|   +-- manifest.json
|   +-- background/
|   |   +-- service_worker.js
|   +-- content/
|   |   +-- injector.js
|   |   +-- overlay.css
|   +-- popup/
|   |   +-- popup.html
|   |   +-- popup.js
|   +-- icons/
+-- msgmate-backend/
    +-- app/api/
    +-- lib/
    +-- prisma/
    |   +-- schema.prisma
    +-- workers/
    |   +-- scheduler.ts
    +-- docker-compose.yml
    +-- .env.example
```

## How It Works

```text
Chrome Extension
  |
  | sends AI and schedule requests
  v
Next.js Backend
  |
  | stores schedules and usage
  v
PostgreSQL

Redis + BullMQ worker marks scheduled messages as due.
The extension polls due schedules and performs browser-side insertion/sending.
```

The backend does not directly log in to personal messaging accounts. For platforms without official sending APIs, the extension uses browser automation in the user's active logged-in session.

## Backend Setup

Go to the backend folder:

```bash
cd msgmate-backend
```

Create your environment file:

```bash
cp .env.example .env
```

Update `.env`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_API_KEY=change-me-to-a-long-random-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/msgmate?schema=public
REDIS_URL=redis://localhost:6379
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your-groq-key-here
GROQ_MODEL=llama-3.3-70b-versatile
EXTENSION_ORIGIN=chrome-extension://your-extension-id
```

Start Postgres and Redis:

```bash
docker compose up -d
```

Install dependencies and migrate the database:

```bash
npm install
npx prisma migrate dev --name init
```

Start the API:

```bash
npm run dev
```

Start the worker in another terminal:

```bash
npm run worker
```

Health check:

```text
http://localhost:3000/api/health
```

## Extension Setup

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `msgmate-extension` folder.
5. Pin MsgMate from the Chrome extensions toolbar.
6. Open the MsgMate popup.
7. Set:

```text
Backend URL: http://localhost:3000
Backend API Key: value of APP_API_KEY from msgmate-backend/.env
```

8. Click Test Backend.
9. Open a supported platform, such as Gmail.
10. Click the purple MsgMate floating button on the page.

## Usage

### AI Reply

1. Open an email or chat thread.
2. Click the floating MsgMate button.
3. Open AI Reply.
4. MsgMate attempts to detect the current conversation automatically.
5. Choose a tone and generate replies.
6. Click a suggestion to insert it into the active compose/reply box.

### Summary

1. Open a conversation.
2. Open the Summary tab.
3. MsgMate attempts to read the visible conversation.
4. Click Summarize.

### Scheduling

1. Open the Schedule tab.
2. Choose platform, message, date, and time.
3. The schedule is stored in PostgreSQL.
4. BullMQ marks it as due at the scheduled time.
5. The extension picks it up, opens/finds the platform tab, and attempts to send.

## API Routes

```text
GET  /api/health

POST /api/ai/replies
POST /api/ai/summary

GET  /api/schedules
POST /api/schedules
GET  /api/schedules/due
PATCH /api/schedules/:id
DELETE /api/schedules/:id
POST /api/schedules/:id/status
```

Protected routes require:

```http
x-msgmate-api-key: APP_API_KEY
x-msgmate-user-id: stable-extension-user-id
```

The extension generates and stores `x-msgmate-user-id` locally.

## Current Limitations

- Browser automation can break when messaging platforms change their DOM.
- Auto-send works only when the user is logged in to the target platform.
- Gmail reading works best when a full email thread is open.
- Reply insertion works best when a compose or reply editor is active.
- Some platforms limit or prohibit automated sending. Use responsibly and follow each platform's terms.
- This project currently uses a simple shared backend API key, not full user authentication.

## Roadmap

- Add proper user authentication
- Add deployment guide
- Add automated tests for backend routes
- Add platform adapter modules
- Add official API integrations where available
- Add retry and failure dashboards
- Add encrypted per-user settings

## Development Notes

Useful commands:

```bash
# Backend
cd msgmate-backend
npm run dev
npm run worker
npm run build
npx prisma studio

# Extension syntax checks
node --check msgmate-extension/content/injector.js
node --check msgmate-extension/background/service_worker.js
node --check msgmate-extension/popup/popup.js
```

## License

Add your preferred license before publishing.
