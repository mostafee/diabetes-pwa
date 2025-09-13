# Diabetes Log — PWA (Offline First)

This is a super-simple Progressive Web App that runs entirely in the browser and works offline after the first load. It records entries for glucose (mg/dL), insulin (U), carbs (g), and a free-text note. Data is stored locally in the browser using IndexedDB. You can export a CSV anytime.

## How to run locally (quick check)

1. Open `index.html` in a local web server (service workers require http://localhost or https).  
   - If you have Python installed: `python -m http.server 8080` then open http://localhost:8080
2. Click around, add entries, and test offline by turning off your internet — it still loads.

## Deploy to GitHub Pages (free + HTTPS)

1. Create a **new GitHub repository** (e.g., `diabetes-pwa`).
2. Upload all files from this folder to the repository root.
3. In GitHub repo Settings → Pages, set **Source** to `Deploy from a branch`, then choose the branch (usually `main`) and `/ (root)`. Save.  
4. After a minute, your site will be live at a URL like `https://<your-username>.github.io/diabetes-pwa/`.
5. Open that URL on **Android Chrome**, open the ⋮ menu, and tap **Install app**.

## Features

- Installable PWA (works like an app, no store required)
- Offline caching via a Service Worker
- Local data storage via IndexedDB
- Add / list / delete entries
- Export entries to CSV

## Next steps (optional)

- Add mmol/L toggle (UI + conversion)
- Add categories/tags (fasting, pre-meal, post-meal)
- Charts (e.g., use Chart.js)
- Cloud sync (e.g., Firebase) with user accounts
- Reminders/Notifications (requires push service & service worker logic)

---

**Safety & Privacy**: All data stays on the device unless you add sync features. Always export backups if the data is important.
