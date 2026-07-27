// MsgMate — content.js
// ─────────────────────────────────────────────────────────────────────────────
// PURPOSE
//   This script runs inside the browser tab (injected via manifest content_scripts).
//   It does ONE focused job: read the visible chat messages on the current page
//   and return them as a clean, structured array to whoever asks.
//
//   It does NOT render any UI and does NOT talk to any external server.
//   All sensitive work (AI calls, scheduling) stays in the background service
//   worker, which is harder for a malicious page to reach.
//
// SECURITY NOTES (for future hardening)
//   • This file runs in an ISOLATED WORLD by default (Chrome MV3), so it cannot
//     access the page's JavaScript variables — it can only read the DOM.
//   • We respond ONLY to messages whose `action` field matches an allow-list
//     (currently just "READ_CHAT"). Unknown action types are silently ignored.
//   • We intentionally do NOT expose any write capability from here — text
//     injection stays inside injector.js which is a separate, UI-bound script.
//   • All extracted text is plain strings — no HTML is preserved, so there is
//     no XSS risk when the popup renders these messages.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

// ── 1. Platform detection ─────────────────────────────────────────────────────
//
// We derive the platform once at load-time. Each key is the exact hostname the
// site uses. "unknown" means we are on a page we don't know — adapters should
// gracefully return an empty array for unknown platforms.

const PLATFORM_MAP = {
  "mail.google.com":      "gmail",
  "web.whatsapp.com":     "whatsapp",
  "web.telegram.org":     "telegram",
  "www.instagram.com":    "instagram",
  "app.slack.com":        "slack",
  "discord.com":          "discord",
  "twitter.com":          "twitter",
  "x.com":                "x",
  "teams.microsoft.com":  "teams",
  "chat.google.com":      "googlechat",
};

const currentPlatform = PLATFORM_MAP[location.hostname] ?? "unknown";


// ── 2. ChatMessage type ───────────────────────────────────────────────────────
//
// Every adapter returns an array of this shape. Keeping it simple and typed
// makes it easy to validate before we send data anywhere.
//
//   { sender: "me" | "them", text: string }
//
// "me"   = a message sent by the logged-in user
// "them" = a message received from someone else
// If we genuinely cannot tell, we default to "them" so the AI treats it as
// context it should reply to — the safer assumption.


// ── 3. DOM helpers ────────────────────────────────────────────────────────────

/**
 * Returns true if an element is actually rendered on screen.
 * We use this to skip hidden duplicate nodes that some SPAs keep in the DOM.
 */
function isVisible(el) {
  const rect  = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none"
  );
}

/**
 * Strips whitespace noise from a single message string.
 * Does NOT truncate — callers decide how many messages to keep.
 */
function cleanText(raw) {
  return (raw ?? "")
    .replace(/\u00a0/g, " ")   // non-breaking spaces → regular space
    .replace(/\s+/g, " ")      // collapse runs of whitespace
    .trim();
}


// ── 4. Platform adapters ──────────────────────────────────────────────────────
//
// Each adapter is a function () => ChatMessage[].
// They target the latest 10 messages (slice(-10)) so we don't send a wall of
// text to the AI — this also keeps token costs low.
//
// HOW TO ADD A NEW PLATFORM
//   1. Add its hostname to PLATFORM_MAP above.
//   2. Write a new readXxxMessages() function below.
//   3. Register it in the ADAPTERS map at the bottom of this section.
//
// SELECTOR FRAGILITY
//   Web apps (especially WhatsApp) change their DOM frequently. When an adapter
//   stops working, open DevTools → inspect a message bubble → update the
//   selector here. The rest of the pipeline stays the same.

// ── 4a. WhatsApp Web ──────────────────────────────────────────────────────────
//
// WhatsApp renders two kinds of rows:
//   .message-out  → sent by you
//   .message-in   → received
//
// The actual text lives inside a <span> with class "selectable-text".
// We fall back to `data-pre-plain-text` (a meta attribute WA adds) if the
// span is absent, which gives us something like "[10:30, 6/10/2026] Alice: ".

function readWhatsAppMessages() {
  const rows = Array.from(
    document.querySelectorAll(".message-in, .message-out, [data-testid='msg-container']")
  ).filter(isVisible);

    return rows.slice(-10).map((row) => {
    // .message-out is present on rows the current user sent
    const isMine = row.classList.contains("message-out");

    // Prefer the dedicated text span; fall back to full row text
    const textSpan = row.querySelector("span.selectable-text, [data-testid='msg-container'] span");
    const text = cleanText(textSpan?.innerText ?? row.innerText);

    return { sender: isMine ? "me" : "them", text };
  }).filter((m) => m.text.length > 0);
}

// ── 4b. Gmail ─────────────────────────────────────────────────────────────────
//
// Gmail thread messages all live in elements with class ".a3s.aiL" (the actual
// body div). We treat the last message as "them" and everything before as
// context — we don't try to read the From header per-bubble because it's
// expensive DOM traversal and rarely needed for short replies.
//
// For a more accurate "me / them" split, a future version could read
// `.gD[email]` on each message and compare it to the logged-in user's address
// (visible in the account switcher: `[aria-label*="Google Account:"]`).

function readGmailMessages() {
  const bodies = Array.from(
    document.querySelectorAll(".a3s.aiL, .a3s")
  ).filter(isVisible);
  const senderNodes = Array.from(
    document.querySelectorAll(".gD[email], .gD, .go")
  ).filter(isVisible);
  const myEmail = getGoogleAccountEmail();

  return bodies.slice(-10).map((el, i, arr) => {
    const text = cleanText(el.innerText);
    const senderEl = senderNodes.at(i);
    const senderEmail = cleanText(senderEl?.getAttribute("email") ?? "");
    const senderName = cleanText(senderEl?.innerText ?? "");
    const sender = myEmail && (senderEmail === myEmail || senderName.includes(myEmail)) ? "me" : "them";
    return { sender, text };
  }).filter((m) => m.text.length > 0);
}

function getGoogleAccountEmail() {
  const accountLabel = document.querySelector('[aria-label*="Google Account"]')?.getAttribute("aria-label") ?? "";
  const match = accountLabel.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? "";
}

// ── 4c. Telegram Web ─────────────────────────────────────────────────────────
//
// Each message bubble has class `.message`. Outgoing messages also have
// `.message.own` (or `.out` on some builds).

function readTelegramMessages() {
  const bubbles = Array.from(
    document.querySelectorAll(".message")
  ).filter(isVisible);

  return bubbles.slice(-10).map((bubble) => {
    // The "own" class marks messages sent by the current user
    const isMine = bubble.classList.contains("own") || bubble.classList.contains("out");
    const textEl  = bubble.querySelector(".text-content, .message-text span");
    const text    = cleanText(textEl?.innerText ?? bubble.innerText);
    return { sender: isMine ? "me" : "them", text };
  }).filter((m) => m.text.length > 0);
}

// ── 4d. Slack ─────────────────────────────────────────────────────────────────
//
// Slack's message list items use `[data-qa="virtual-list-item"]`.
// The sender name is in `[data-qa="message_sender_name"]`.
// We detect "me" by comparing the sender name to the current user's display
// name shown in the sidebar: `[data-qa="current-user-customstatus-profile"]`.

function readSlackMessages() {
  const myName = cleanText(
    document.querySelector("[data-qa='current-user-customstatus-profile']")?.innerText ?? ""
  );

  const items = Array.from(
    document.querySelectorAll("[data-qa='virtual-list-item']")
  ).filter(isVisible);

  return items.slice(-10).map((item) => {
    const senderEl = item.querySelector("[data-qa='message_sender_name']");
    const senderName = cleanText(senderEl?.innerText ?? "");
    const bodyEl   = item.querySelector(".p-rich_text_block");
    const text     = cleanText(bodyEl?.innerText ?? item.innerText);
    const isMine   = myName.length > 0 && senderName === myName;
    return { sender: isMine ? "me" : "them", text };
  }).filter((m) => m.text.length > 0);
}

// ── 4e. Discord ───────────────────────────────────────────────────────────────
//
// Discord uses `[class^='message-']` for message wrappers.
// Their own messages get an extra wrapper with the class `repliedMessage`
// on parent elements, but the most reliable signal is the presence of the
// username matching the logged-in user shown in the lower-left panel.

function readDiscordMessages() {
  const myName = cleanText(
    document.querySelector("[class*='nameTag'] [class*='username']")?.innerText ?? ""
  );

  const messages = Array.from(
    document.querySelectorAll("[id^='chat-messages-'] [class*='messageContent']")
  ).filter(isVisible);

  return messages.slice(-10).map((el) => {
    // Walk up to find the username for this message group
    const header    = el.closest("[class*='message-']")
                        ?.querySelector("[class*='username']");
    const sender    = cleanText(header?.innerText ?? "");
    const isMine    = myName.length > 0 && sender === myName;
    const text      = cleanText(el.innerText);
    return { sender: isMine ? "me" : "them", text };
  }).filter((m) => m.text.length > 0);
}

// ── 4f. Generic fallback ──────────────────────────────────────────────────────
//
// For platforms we haven't written a specific adapter for yet (Instagram,
// Twitter DMs, Teams, Google Chat) we return an empty array. This is
// intentionally conservative — a wrong label ("me" vs "them") would produce
// confusing AI replies, so we'd rather show nothing than show wrong data.
//
// Replace this with a real adapter once you've inspected the DOM for that site.

function readGenericMessages() {
  return [];
}


// ── ADAPTERS registry ─────────────────────────────────────────────────────────
//
// Maps platform key → reader function. Adding support for a new site means
// writing a reader above and adding one line here.

const ADAPTERS = {
  whatsapp:   readWhatsAppMessages,
  gmail:      readGmailMessages,
  telegram:   readTelegramMessages,
  slack:      readSlackMessages,
  discord:    readDiscordMessages,
  // Not yet implemented — will return []
  instagram:  readGenericMessages,
  twitter:    readGenericMessages,
  x:          readGenericMessages,
  teams:      readGenericMessages,
  googlechat: readGenericMessages,
};


// ── 5. Main reader entry point ────────────────────────────────────────────────
//
// This is what every caller should use. It:
//   1. Picks the right adapter for the current site.
//   2. Runs it inside a try/catch so a broken adapter never crashes the whole
//      extension.
//   3. Logs the extracted messages to the console in a table so you can verify
//      what the AI will actually receive — crucial for debugging wrong replies.

function readCurrentChat() {
  const adapter = ADAPTERS[currentPlatform] ?? readGenericMessages;

  let messages = [];
  try {
    messages = adapter();
  } catch (err) {
    // Log the error but don't crash — the popup will show an empty context
    // instead of a broken UI.
    console.warn("[MsgMate] Adapter error on platform:", currentPlatform, err);
    messages = [];
  }

  // ── DEBUG: show what will be sent to the AI ─────────────────────────────
  // Open DevTools → Console on any supported page to see this table.
  // Remove or gate behind a flag before publishing to the Chrome Web Store.
  if (messages.length > 0) {
    console.groupCollapsed(`[MsgMate] Extracted ${messages.length} messages from ${currentPlatform}`);
    console.table(messages);
    console.groupEnd();
  } else {
    console.debug(`[MsgMate] No messages extracted on ${currentPlatform} — adapter returned empty array`);
  }

  return messages;
}


// ── 6. Message listener ───────────────────────────────────────────────────────
//
// The popup (via chrome.tabs.sendMessage) or background worker sends us a
// message with action: "READ_CHAT". We respond synchronously with the current
// platform name and the extracted messages.
//
// SECURITY: We explicitly check the action name against an allow-list.
// Any message with an unrecognised action is ignored entirely — this prevents
// a malicious page script from accidentally (or intentionally) triggering
// unintended behaviour through the extension message bus.
//
// NOTE: sendResponse must be called synchronously here (no async/await) or
// Chrome will close the message channel before the response is sent.
// If you ever need an async adapter, return `true` from the listener to keep
// the channel open, then call sendResponse inside the promise callback.

const ALLOWED_ACTIONS = new Set(["READ_CHAT"]);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!ALLOWED_ACTIONS.has(message?.action)) return; // ignore unknown actions

  if (message.action === "READ_CHAT") {
    sendResponse({
      platform: currentPlatform,
      messages: readCurrentChat(),
    });
  }

  // Returning false (implicit) tells Chrome we called sendResponse synchronously.
});
