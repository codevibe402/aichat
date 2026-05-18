# MsgMate Chrome Extension

This folder contains the Manifest V3 Chrome extension for MsgMate.

For the full project overview, backend setup, and GitHub-ready documentation, see the root [README.md](../README.md).

## What The Extension Does

- Injects the floating MsgMate panel into supported messaging platforms
- Reads visible message/thread context where possible
- Sends AI reply and summary requests to the backend
- Inserts selected AI replies into the active compose/reply editor
- Creates, cancels, and reads schedules through the backend
- Polls due schedules through the background service worker

## Local Setup

1. Start the backend from `../msgmate-backend`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this `msgmate-extension` folder.
6. Open the MsgMate toolbar popup.
7. Set:

```text
Backend URL: http://localhost:3000
Backend API Key: APP_API_KEY from ../msgmate-backend/.env
```

8. Click Test Backend.
9. Open Gmail or another supported platform and click the purple floating MsgMate button.

## Files

```text
manifest.json
background/service_worker.js
content/injector.js
content/overlay.css
popup/popup.html
popup/popup.js
icons/
```

## Notes

- The extension cannot run on Chrome internal pages like `chrome://extensions`.
- Platform selectors may need maintenance when sites update their UI.
- Browser-side sending requires the user to already be logged in.
