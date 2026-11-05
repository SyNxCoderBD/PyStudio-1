# PyStudio

PyStudio is a collaborative, browser-based Python workspace with a shared editor, terminal, and room chat.

## Run locally

Prerequisite: Node.js.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Python runs in the browser through Pyodide, which is loaded from a CDN. Room collaboration uses the Firebase configuration in `src/services/firebase.ts`.

## Optional yt-dlp API

The server's `/api/yt-dlp/*` endpoints are disabled unless `YTDLP_API_TOKEN` is configured in the server environment. Requests must include that value as a bearer token. Do not expose the token in browser code.
