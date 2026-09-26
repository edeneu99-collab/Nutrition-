# Nutrition study hub (PWA)

A Plan / Read & quiz / Mock exams tool for the Nutrition exam, built only from the
project's own summary and past questions. Runs entirely in the browser — no
backend, no account. Your plan, notes, tags and scores are saved on your device
via `localStorage`; use **Export** regularly to keep a backup, and **Import** to
load it back (e.g. after this hub gets updated with new content).

## Put it on GitHub Pages

1. Create a new repository on GitHub (public or private both work with Pages on
   most plans), e.g. `nutrition-hub`.
2. Add every file in this folder to the repository, keeping the structure:
   ```
   index.html
   style.css
   data.js
   app.js
   sw.js
   manifest.webmanifest
   favicon.ico
   icons/icon-192.png
   icons/icon-512.png
   icons/icon-maskable-512.png
   README.md
   ```
   Either drag-and-drop them in the GitHub web UI ("Add file → Upload files"),
   or from a terminal:
   ```bash
   git init
   git add .
   git commit -m "Nutrition study hub"
   git branch -M main
   git remote add origin https://github.com/<your-username>/nutrition-hub.git
   git push -u origin main
   ```
3. In the repository: **Settings → Pages → Build and deployment → Source**,
   choose **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
4. GitHub gives you a URL after a minute or two, typically:
   `https://<your-username>.github.io/nutrition-hub/`
   Open it — the hub should load, and on phones you'll get an "Add to Home
   Screen" / install prompt (the **Install app** button in the header does the
   same on supported browsers).

No build step, no dependencies to install — these are static files.

## Updating later

When the hub is regenerated with new chapters or questions, replace `data.js`
(and `app.js`/`style.css` if those changed too), commit and push. Because the
service worker caches the app shell for offline use, bump the version string
at the top of `sw.js` (e.g. `nutrition-hub-v1` → `v2`) whenever you replace any
cached file — that tells returning visitors' browsers to fetch the new files
instead of serving the old cached copy. Before updating, export your data from
the old version; after the update, import it back so your ticked topics, tags,
notes and scores carry over (the export format doesn't change).

## Notes

- Works offline after the first visit (service worker caches the app shell).
  The Google Fonts stylesheet needs a connection the first time; after that
  it's cached too.
- Everything is a plain static file — you can also just open `index.html`
  directly in a browser to try it locally, though the service worker and
  "Install app" prompt only activate over `http://localhost` or `https://`.
- If you ever want the data separate from the app, `data.js` contains all
  chapters, readings, MCQs and the past-MCQ bank as plain JS objects.
