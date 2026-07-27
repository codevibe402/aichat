# MsgMate Backend

Next.js App Router backend for MsgMate with PostgreSQL, Prisma, Redis, and BullMQ.

## What This Backend Handles

- AI reply generation through a server-side Groq API key
- Chat summarization through a server-side Groq API key
- Scheduled message persistence in PostgreSQL
- Delayed schedule processing through BullMQ and Redis
- Delivery status callbacks from the Chrome extension

The extension should still perform browser-based message insertion/sending for platforms that do not expose a suitable official API.

## Local Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run dev
```

Run the scheduler worker in a second terminal:

```bash
npm run worker
```

## Auth

All protected API routes use Clerk (`requireUser()` in `lib/auth.ts`) and expect:

```http
Authorization: Bearer <clerk-session-token>
```

A signed-in browser tab on this app authenticates via Clerk's session cookie
(`app/layout.tsx`); the Chrome extension attaches a session token obtained
via `@clerk/chrome-extension`'s sync-host instead. Either way, the request
resolves to a `User` row via `externalId`.

For a `User` row to exist, `app/api/webhooks/clerk/route.ts` must be
registered as a webhook endpoint in the Clerk Dashboard (Webhooks > Add
Endpoint > `https://<your-deployment>/api/webhooks/clerk`, subscribed to at
least `user.created`), with the endpoint's signing secret set as
`CLERK_WEBHOOK_SIGNING_SECRET` in `.env`.

## API Routes

```text
GET  /api/health

POST /api/webhooks/clerk   (Clerk-only, not for extension/browser use)

POST /api/ai/replies
POST /api/ai/summary

GET  /api/schedules
POST /api/schedules
GET  /api/schedules/due
PATCH /api/schedules/:id
DELETE /api/schedules/:id
POST /api/schedules/:id/status
```

## Schedule Flow

1. Extension creates a schedule with `POST /api/schedules`.
2. Backend stores it in PostgreSQL and adds a delayed BullMQ job.
3. Worker marks the schedule as `DUE` when its time arrives.
4. Extension polls `GET /api/schedules/due`.
5. Extension sends through browser automation.
6. Extension reports the result to `POST /api/schedules/:id/status`.

## Example Requests

Replace `<token>` with a real Clerk session token (from a signed-in browser's
dev tools, or `clerk.session.getToken()` in the extension):

```bash
curl -X POST http://localhost:3000/api/ai/replies \
  -H "content-type: application/json" \
  -H "authorization: Bearer <token>" \
  -d '{"platform":"gmail","tone":"professional","messages":[{"sender":"them","text":"Can we move the meeting to tomorrow?"}]}'
```

```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "content-type: application/json" \
  -H "authorization: Bearer <token>" \
  -d '{"platform":"whatsapp","text":"Following up here.","sendAt":"2026-05-19T09:30:00.000Z"}'
```
