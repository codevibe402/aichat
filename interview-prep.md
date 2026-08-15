# MsgMate — Interview Preparation Guide

---

## Project Overview (30-Second Elevator Pitch)

> *"MsgMate is a browser extension that brings AI-powered assistant capabilities directly into messaging platforms like WhatsApp, Gmail, and Telegram. It reads the conversation you're currently viewing, generates contextual reply suggestions with adjustable tone, detects urgent messages using AI classification, and injects replies directly into the native input field — all without leaving the page. The backend is built on Next.js with a PostgreSQL database for persistence, and the extension uses Google OAuth for authentication."*

---

## How to Explain the Architecture (Structured Narrative)

Start high-level, then drill into details only if asked:

**1. Extension Layer (Chrome MV3)**
- Content scripts inject a floating panel into messaging sites
- Service worker manages auth tokens, API calls, and chrome API interactions
- Popup provides settings and cross-platform important message view
- All communication uses `chrome.runtime.sendMessage`

**2. Backend Layer (Next.js on Node.js)**
- Next.js API routes handle AI requests (reply generation, important detection)
- Prisma ORM with PostgreSQL for user data, important messages, schedules
- Session-based auth via JWT cookies (HttpOnly, SameSite=None, Secure)
- Groq API for LLM inference (replaced Anthropic for speed/cost)

**3. Auth Layer (Google OAuth)**
- Extension uses `chrome.identity.getAuthToken()` for seamless sign-in
- Backend verifies token and issues session cookie
- No third-party auth SDKs — reduces bundle size and lifecycle complexity

---

## Stack Choices & Follow-Up Questions

### Why Next.js for the Backend?

| Property | How MsgMate Uses It |
|---|---|
| **API Routes** | All AI endpoints (`/api/ai/reply`, `/api/ai/detect-important`) are Next.js API routes. No separate Express server needed. |
| **File-based Routing** | Routes map to the filesystem (`app/api/ai/reply/route.ts`), making the project navigable without a router config. |
| **Serverless-ready** | Deployed on Render as a Node.js service, but could be migrated to Vercel serverless functions with zero code changes. |
| **Request/Response Helpers** | Next.js `NextRequest`/`NextResponse` provide typed request handling, JSON parsing, and CORS header management without Express middleware. |
| **Edge/GROQ Compatibility** | API routes run on Node.js runtime, compatible with any fetch-based LLM client (Groq SDK). |

**Follow-up: Why not Express or Fastify?**

> *"MsgMate has no frontend UI — it's purely an API backend for a browser extension. Next.js API routes eliminate the need for a separate router, middleware setup, and deployment configuration. With Express I'd need to add CORS middleware, JSON body parsers, and a deployment wrapper manually. Next.js provides all of that out of the box in a single framework. If the backend grew to need a dashboard or admin panel, Next.js App Router would handle that too without adding another framework."*

**Follow-up: What are Next.js core properties?**

| Property | Explanation |
|---|---|
| **React-based** | Built on React, supports server components and client components |
| **File-based Routing** | Both pages (`/app/page.tsx`) and API routes (`/app/api/route.ts`) use filesystem routing |
| **Server-side Rendering** | Pages can render on server (SSR) or at build time (SSG) |
| **API Routes** | Backend endpoints as files under `app/api/` — no Express required |
| **Middleware** | `middleware.ts` runs before requests hit routes (used for redirects, headers) |
| **App Router** | Modern layout system with nested routes, loading states, error boundaries |
| **Server Actions** | Directly call server functions from client components (RPC-style) |
| **Edge Runtime** | Routes can run on Vercel Edge for low-latency global responses |
| **ISR** | Incremental Static Regeneration for hybrid static/dynamic content |

**Follow-up: What are the tradeoffs of Next.js for an API-only backend?**

> *"The main tradeoff is that Next.js is optimized for full-stack apps, not pure APIs. You get framework overhead (build pipeline, routing internals) that a lightweight Express app wouldn't have. For a pure API, Express + TypeScript would be faster to boot and simpler to debug. However, the benefits of standardized route patterns, built-in TypeScript support, and easy future frontend expansion outweighed the overhead for this project."*

---

### Why Groq over Anthropic (or OpenAI)?

> *"We initially used Anthropic Claude for reply generation, but latency was 8-12 seconds per reply. We switched to Groq for their LPU inference engine, which reduced latency to 1.5-3 seconds — a 4x improvement. The API interface is nearly identical (both use chat completions format), so the migration required changing only the API endpoint and key. Groq also offers competitive pricing, reducing per-reply cost by roughly 90%. The tradeoff is that Groq supports fewer models and has less mature documentation, but their Mixtral and Llama models produce comparable quality for this use case."*

**Follow-up: Why not run a local model?**

> *"Running a local LLM would eliminate latency and cost, but requires significant resources (8GB+ VRAM for a capable model). Browser extensions run on consumer hardware where that's not guaranteed. A cloud API also simplifies updates — we can swap models or adjust prompts without pushing extension updates."*

---

### Why Prisma + PostgreSQL over other databases?

> *"Prisma provides type-safe database access with auto-generated TypeScript types — when I query the `importantMessage` table, the result is fully typed without manual type definitions. PostgreSQL was chosen because it's the most widely supported production database on cloud platforms (Render, Vercel, Railway). For this project's data model (users, important messages, scheduled messages), a relational database is natural because the data has clear relationships and needs transactional integrity. MongoDB would also work, but Prisma's relational features (relations, cascading, filtering) are stronger with SQL. SQLite would be simpler but can't handle concurrent writes from multiple extension instances."*

---

### Why Chrome Extension MV3 over MV2?

> *"Manifest V3 is Google's current standard — new extensions must use it, and MV2 is being phased out. The main difference is that background pages became service workers (event-driven, no persistent DOM). This caused the auth flicker bug we fixed, but it also improves security and resource usage. We had to design the auth state caching system specifically because service workers can terminate at any time. If we'd used MV2 with a persistent background page, the auth state would always be available, but the extension would consume memory constantly."*

**Follow-up: How do you handle service worker lifecycle?**

> *"We cache auth state in the content script with a 2-minute TTL. When the service worker wakes up (after being idle), content script messages might fail. The cache ensures the panel shows the correct signed-in state during wake-up. We also use `chrome.storage.local` in the service worker to persist auth status across restarts."*

---

### Why JWT Session Cookies over Bearer Tokens?

> *"Bearer tokens require the extension to store them in `chrome.storage` and attach them to every request. A session cookie is automatically sent by the browser with `credentials: 'include'`, eliminating token management code entirely. The HttpOnly flag prevents XSS access, SameSite=None allows cross-origin requests from extension pages, and Secure ensures it only transmits over HTTPS. The JWT is signed with a server secret, so we verify authenticity without a database lookup on every request."*

---

## Depth Questions (Be Ready For)

### Q: How does the extension communicate with the backend?

> *"The content script communicates with the service worker via `chrome.runtime.sendMessage`. The service worker then makes `fetch` calls to the Next.js backend with `credentials: 'include'` for cookie-based auth. The content script never calls the backend directly — all requests go through the service worker, which handles auth, retries, and error responses."*

### Q: How do you handle cross-origin requests from a browser extension?

> *"The extension's service worker runs in its own isolated context, not in a web page. Fetch requests from the service worker are not subject to CORS restrictions — they're treated like same-origin requests. The backend still needs to handle `OPTIONS` preflight requests (we have a shared `OPTIONS` handler that sets CORS headers) because extension popup pages do run in a web context and need CORS."*

### Q: How does the AI prompt work? How do you prevent it from replying to the user's own messages?

> *"The backend formats messages into two sections — `ME said:` and `THEM said:` — and includes an explicit instruction: 'Reply to THEM only. Never write a message from ME.' This is a prompt-level guard. We also considered filtering at the application layer (removing 'me' messages before sending), but keeping them gives the AI context about what's already been said while the instruction prevents it from generating the user's side of the conversation."*

### Q: What happens if the AI returns a bad reply?

> *"The extension shows multiple suggestion chips — the user selects one and it gets injected into the input field. There's no auto-send. The user can edit the reply before sending. If none of the suggestions work, they can close the panel, regenerate with a different tone, or type manually. The AI is a suggestion engine, not an autonomous agent."*

### Q: How do you handle rate limiting?

> *"The backend uses a token bucket rate limiter per user, stored in-memory. The limit is configurable via environment variables. The `detectImportant` endpoint has a separate, stricter rate limit since it consumes more tokens per request (it scans an entire conversation). Rate limit responses return 429 with a descriptive error, and the extension shows a user-friendly message."*

### Q: How would you scale this to thousands of users?

> *"The current architecture would handle hundreds of concurrent users on a single Render instance. To scale: (1) Move rate limiting to Redis for distributed accuracy, (2) Add a queue system (Bull/BullMQ with Redis) for AI requests to prevent backend overload, (3) Horizontally scale the Next.js app behind a load balancer, (4) Use a connection pooler (PgBouncer) for PostgreSQL connections, (5) Add request caching for frequently accessed data. The extension architecture itself is stateless — all state lives in the backend, so users can be routed to any instance."*

---

## Common Interview Follow-Up Patterns

| If they ask... | Respond with... |
|---|---|
| "What was the hardest bug?" | The auth flicker — caused by service worker lifecycle, fixed with content script caching |
| "What would you do differently?" | Start with Google OAuth instead of Clerk to avoid the migration, and choose a simpler AI provider from day one |
| "How did you test this?" | Manual testing on live WhatsApp/Gmail/Telegram (no automated E2E — DOM-based testing is fragile across platforms) |
| "Security concerns?" | HttpOnly session cookies prevent XSS token theft, `ALLOWED_ACTIONS` filter in content script prevents malicious message actions, backend validates all input with Zod |
| "How do you debug the extension?" | `chrome://extensions` inspector for service worker logs, `console.groupCollapsed` formatting for structured platform extraction logs, browser devtools for content script debugging |

---

## Key Numbers to Remember

| Metric | Value |
|---|---|
| Auth bundle size reduction | ~100KB (removing Clerk) |
| Reply generation latency | 1.5-3s (down from 8-12s with Anthropic) |
| Cost per reply reduction | ~90% (Anthropic → Groq) |
| Supported platforms | 10 (WhatsApp, Gmail, Telegram + 7 generic) |
| Auth cache TTL | 2 minutes |
| Important message dedup window | 24 hours |
| Rate limit retries | 1 (service worker auto-retries once on 5xx) |

---

## Questions to Ask the Interviewer

> *"This project taught me a lot about Chrome extension architecture and the tradeoffs between third-party SDKs and custom implementations. I'm curious — how does your team handle service worker lifecycle in your extension products, if you have any?"*

> *"We chose Next.js for the backend because of API routes and future flexibility. What's your team's preferred backend stack for API services, and why?"*