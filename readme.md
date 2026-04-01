# Zayar (ဇယား)

A personal Mermaid chart editor with unlimited chart storage, live preview, and multi-device sync via Firebase. Built as a better alternative to the Mermaid Live Editor for small teams.

## Features

- **Mermaid syntax** — same syntax you already know, compatible with AI-generated diagrams
- **Live preview** — chart renders as you type (300ms debounce)
- **Unlimited charts** — no project limits, organised in a sidebar library
- **Multi-device sync** — Firestore keeps charts in sync across all your devices in real time
- **Theme picker** — switch between Default, Forest, Dark, and Neutral themes
- **Export** — download charts as SVG or PNG
- **Shareable links** — share any chart via a URL (no account needed to view)
- **Google Sign-In** — one-click auth, restricted to a whitelist of allowed emails

## Tech Stack

| Layer | Technology |
|---|---|
| Build tool | Vite 5 |
| Frontend | Vanilla JS + HTML + CSS |
| Editor | CodeMirror 6 |
| Renderer | Mermaid.js 11 |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |

## Project Structure

```
flowdraft/
├── index.html
├── package.json
├── vite.config.js
├── .env                  ← Firebase config (never commit)
├── .env.example          ← Template for env vars
├── .gitignore
├── firebase.json         ← Firebase Hosting config
├── .firebaserc           ← Firebase project alias
└── src/
    ├── main.js           ← App entry point, wires all modules
    ├── firebase.js       ← Firebase initialisation
    ├── auth.js           ← Google Sign-In + allowed email whitelist
    ├── storage.js        ← Firestore CRUD + real-time listener
    ├── editor.js         ← CodeMirror 6 setup
    ├── preview.js        ← Mermaid render, theme switching, export
    └── style.css         ← All styles
```

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/flowdraft.git
cd flowdraft
npm install
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `flowdraft`)
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** → Start in production mode
5. Enable **Firebase Hosting**
6. Go to Project Settings → Your apps → Add a Web app → copy the config

### 3. Set up environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Fill in your Firebase config in `.env`:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Set allowed users

Open `src/auth.js` and add the Google account emails that should have access:

```js
const ALLOWED_EMAILS = [
  "you@gmail.com",
  "coworker@company.com",
];
```

Anyone not on this list will be signed out immediately after login.

### 5. Set Firestore security rules

In the Firebase Console → Firestore → Rules, paste:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/charts/{chartId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```

### 6. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Deployment

### First-time setup

Install the Firebase CLI and log in:

```bash
npm install -g firebase-tools
firebase login
firebase init
```

When prompted during `firebase init`:
- Select **Hosting** and **Firestore**
- Set public directory to `dist`
- Configure as a single-page app: **Yes**
- Do not overwrite `dist/index.html`

### Deploy

```bash
npm run deploy
```

This runs `vite build` then `firebase deploy`. Your app will be live at `https://your-project.web.app`.

## Usage

### Creating a chart

Click **New chart** in the top bar. A new untitled chart opens in the editor. Start typing Mermaid syntax — the preview updates as you type.

### Saving

Charts save automatically to Firestore 1.5 seconds after you stop typing. No save button needed.

### Renaming

Click the chart name in the sidebar to rename it inline.

### Switching themes

Use the theme pills at the bottom of the preview pane: **Default**, **Forest**, **Dark**, **Neutral**.

### Exporting

- **Export SVG** — downloads a `.svg` file of the current chart
- **Export PNG** — downloads a `.png` file at 2× resolution

### Sharing

Click **Copy link** in the top bar. The chart code is encoded into the URL. Anyone with the link can view the chart — no account required.

## Mermaid Syntax Reference

FlowDraft supports all Mermaid diagram types. Most commonly used:

```
flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Do this]
  B -->|No| D[Do that]
```

```
sequenceDiagram
  Alice->>Bob: Hello
  Bob-->>Alice: Hi back
```

```
erDiagram
  USER ||--o{ ORDER : places
  ORDER ||--|{ ITEM : contains
```

Full syntax reference: [mermaid.js.org](https://mermaid.js.org/intro/)

## Firestore Free Tier Limits

The Firebase Spark (free) plan includes:

| Quota | Limit | Expected usage |
|---|---|---|
| Reads per day | 50,000 | Well under for a small team |
| Writes per day | 20,000 | Well under with 1.5s debounce |
| Storage | 1 GB | ~1M charts at typical size |

This project is designed to stay within the free tier indefinitely.

## V2 Ideas

- Folder / tag organisation for the chart library
- Per-chart version history (Firestore subcollection of snapshots)
- Custom theme editor (visual color picker → Mermaid `themeVariables`)
- Import Mermaid code from a `.md` file
- Optional team-shared chart library (shared Firestore collection)

## License

MIT — use freely for personal and team projects.