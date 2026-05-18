# MsgMate — AI Chat Assistant Chrome Extension

AI-powered reply suggestions, message scheduling, and chat summarization across 9 platforms.

## Supported Platforms
- Gmail · WhatsApp Web · Telegram Web
- Instagram DMs · Slack · Discord
- Twitter/X DMs · Microsoft Teams · Google Chat

## Features
- ✨ **AI Reply Suggestions** — 3 smart replies in your chosen tone (friendly, professional, casual, concise, empathetic, assertive)
- ⏰ **Message Scheduling** — schedule messages to auto-send at any future date/time, even opens the tab if needed
- 📋 **Chat Summarizer** — paste any conversation and get bullet-point summary
- 🔌 **Floating Panel** — purple button injected on every supported platform, non-intrusive

## Setup Instructions

### 1. Install in Chrome
1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `msgmate-extension` folder
5. Pin the extension from the Extensions toolbar

### 2. Add Your API Key
1. Click the MsgMate icon in Chrome toolbar
2. Paste your **Anthropic API key** (`sk-ant-api03-...`)
3. Click **Save Key**

Get your key at: https://console.anthropic.com

### 3. Use It
1. Open any supported platform (e.g. WhatsApp Web, Gmail)
2. Look for the **purple ✦ button** at bottom-right of the page
3. Click it to open the MsgMate panel
4. Choose a tab: **AI Reply**, **Schedule**, or **Summary**

## How Scheduling Works
- Messages are stored with `chrome.storage` and use `chrome.alarms` API
- When the scheduled time hits, the extension finds the platform tab (or opens it)
- It injects and sends the message automatically
- You get a browser notification when the message is sent

## File Structure
```
msgmate-extension/
├── manifest.json              # Extension config & permissions
├── background/
│   └── service_worker.js      # Alarm handling & scheduling logic
├── content/
│   ├── injector.js            # Floating panel injected into pages
│   └── overlay.css            # Panel styles
├── popup/
│   ├── popup.html             # Extension popup UI
│   └── popup.js               # Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions Explained
| Permission | Why |
|---|---|
| `storage` | Save API key & scheduled messages |
| `alarms` | Fire scheduled messages at the right time |
| `tabs` | Find or open platform tabs when sending |
| `scripting` | Inject message text into platform inputs |
| `notifications` | Notify you when a scheduled message is sent |

## Limitations & Notes
- **Auto-send** works best when you're already logged into the platform
- Platform DOM selectors may need updates if sites change their HTML
- Discord sends via Enter key (no visible Send button in DMs)
- Instagram auto-fill requires the DM conversation to be open

## Extending
To add a new platform, add entries to:
1. `manifest.json` → `host_permissions` and `content_scripts.matches`
2. `content/injector.js` → `PLATFORM_MAP`, `PLATFORM_NAMES`, `INPUT_SELECTORS`
3. `background/service_worker.js` → `getPlatformPattern()`, `getPlatformUrl()`, `injectAndSend()`
