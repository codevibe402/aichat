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
2. Build the Clerk auth bundles (required before loading — `background/clerk-bundle.js` and `popup/clerk-bundle.js` are build output, not checked in):

```bash
npm install
npm run build
```

3. Open Chrome and go to `chrome://extensions`.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select this `msgmate-extension` folder.
7. Open the MsgMate toolbar popup — it will show "Not signed in". Click **Sign in to MsgMate**, which opens the backend web app in a new tab; sign in or sign up there.
8. Reopen the popup — it should now show "Signed in as `<your email>`" (Clerk's sync-host mirrors the session into the extension).
9. Open Gmail or another supported platform and click the purple floating MsgMate button.

Re-run `npm run build` (or `npm run watch`) after editing `src/background-auth.js` or `src/popup-auth.js`.

## Files

```text
manifest.json
package.json               # build tooling for the Clerk bundles
src/background-auth.js      # source for background/clerk-bundle.js
src/popup-auth.js           # source for popup/clerk-bundle.js
background/service_worker.js
background/clerk-bundle.js  # build output, not checked in
content/injector.js
content/overlay.css
popup/popup.html
popup/popup.js
popup/clerk-bundle.js       # build output, not checked in
icons/
```

## Notes

- The extension cannot run on Chrome internal pages like `chrome://extensions`.
- Platform selectors may need maintenance when sites update their UI.
- Browser-side sending requires the user to already be logged in.
