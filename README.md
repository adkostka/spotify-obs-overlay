<img width="1315" height="574" alt="image" src="https://github.com/user-attachments/assets/468b42f3-b958-4525-b2aa-11eb949d058d" />


A free, **open-source** now-playing overlay for OBS / streaming — inspired by paid
tools like Amuse, but yours to host, theme and extend.

- **Local-first** — runs on your machine, your Spotify token never leaves it.
- **Multi-theme** — switch looks with a single URL param (`?theme=premium`).
- **Zero database** — one local file holds your refresh token. That's it.
- **Smooth** — the progress bar interpolates between polls, no jumpy updates.

Built with **Next.js (App Router) + TypeScript**.

---

## ✨ Themes

| `?theme=` | Look |
| --------- | ---- |
| `premium` *(default)* | Glassmorphism card with album art + animated equalizer |
| `minimal` | Clean single line, no chrome — gets out of the way |
| `retro`   | Synthwave cassette deck with neon + scanlines |
| `neon`    | High-glow pulsing border, reads well over busy footage |

> Adding your own theme is one component + one registry entry. See
> [Adding a theme](#-adding-a-theme).

---

## 🚀 Quick start

> **Prerequisites:** [Node.js **20 or newer**](https://nodejs.org) and [git](https://git-scm.com) installed.
> Check with `node -v`. Any package manager works — **npm** (ships with Node), **pnpm**, or **yarn**.
> You don't need to know how to code to run this — just follow the steps in order.

### 1. Create a Spotify app (free · ~2 min)

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   and click **Create app**.
2. Give it any name/description.
3. Under **Redirect URIs**, add **exactly**:

   ```
   http://127.0.0.1:3000/api/auth/callback
   ```

   > ⚠️ **Important:** Spotify no longer accepts `localhost` as a redirect URI
   > (policy change from April 2025). You **must** use the loopback IP
   > `127.0.0.1`. Using `localhost` returns `INVALID_CLIENT: Insecure redirect URI`.
4. Under **APIs used**, tick **Web API**.
5. Save, then copy your **Client ID** and **Client Secret**.

### 2. Configure the project

```bash
# 1) Clone the repo (or download the ZIP from the GitHub page → "Code" → "Download ZIP")
git clone https://github.com/YOUR_USERNAME/spotify-obs-overlay.git
cd spotify-obs-overlay

# 2) Install dependencies — pick ONE:
npm install        # or:  pnpm install   or:  yarn

# 3) Create your local env file from the template:
cp env.example .env.local      # macOS / Linux
copy env.example .env.local    # Windows (PowerShell or CMD)
```

Open `.env.local` and fill in your credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
```

### 3. Run it

```bash
npm run dev        # or:  pnpm dev   or:  yarn dev
```

Open **http://127.0.0.1:3000** (use `127.0.0.1`, **not** `localhost`, so the
OAuth redirect matches) and click **Connect Spotify**. Authorize once — your
refresh token is saved to `.spotify/tokens.json` (gitignored, never committed).

### 4. Add it to OBS

1. In OBS: **Sources → + → Browser**.
2. Paste the overlay URL (copy it from the setup page):

   ```
   http://127.0.0.1:3000/overlay?theme=premium
   ```
3. Set **Width ≈ 480**, **Height ≈ 140**.
4. Enable **“Refresh browser when scene becomes active.”**

Play something on Spotify and it appears. Done. 🎉

---

## 🔧 Overlay URL options

```
http://127.0.0.1:3000/overlay?theme=premium&poll=3000&hideWhenIdle=true
```

| Param | Default | Description |
| ----- | ------- | ----------- |
| `theme` | `premium` | `premium` \| `minimal` \| `retro` \| `neon` |
| `poll` | `3000` | Poll interval in ms (min `1000`). Lower = snappier, more API calls |
| `hideWhenIdle` | `false` | `true` hides the overlay entirely when nothing is playing |

---

## 🧠 How it works

```
OBS Browser Source
        │  http://127.0.0.1:3000/overlay?theme=…
        ▼
  Next.js overlay page ──poll──► /api/now-playing ──► Spotify Web API
        │                              │
        │                     (server-only: refresh token + client secret)
        ▼
   theme component renders the now-playing card
```

Why a backend at all? Because Spotify access tokens **expire every hour**, and
refreshing them needs your **client secret** — which can never live in the
browser. The Next.js API routes hold the secret, refresh the token, and expose
only clean, normalized JSON to the overlay.

- **OAuth**: Authorization Code flow with CSRF `state` protection.
- **Token storage**: refresh token on disk (`.spotify/tokens.json`); access
  token cached in memory with a 30s safety margin.
- **Smoothness**: the client re-stamps each snapshot with its own clock and
  ticks the progress bar every 250ms between polls.

---

## 🎨 Adding a theme

1. Create `components/themes/MyTheme.tsx` (and an optional
   `MyTheme.module.css`). It receives a single prop:

   ```tsx
   import { ThemeProps } from "./types";
   export function MyTheme({ track }: ThemeProps) {
     return <div>{track.title} — {track.artist}</div>;
   }
   ```

   `track` is a normalized [`NowPlaying`](lib/types.ts) object with
   `title`, `artist`, `albumArt`, `progressMs` (already interpolated),
   `durationMs`, `isPlaying`, and more.

2. Register it in [`components/themes/index.ts`](components/themes/index.ts):

   ```ts
   import { MyTheme } from "./MyTheme";
   export const THEMES = { /* … */, mytheme: MyTheme };
   ```

3. Use it: `/overlay?theme=mytheme`.

---

## 📁 Project structure

```
app/
  api/auth/login/      → start OAuth
  api/auth/callback/   → exchange code, store refresh token
  api/auth/status/     → is Spotify connected?
  api/auth/disconnect/ → forget the token
  api/now-playing/     → the only endpoint the overlay calls
  overlay/             → the page you add to OBS
  page.tsx             → setup / control panel
components/
  Overlay.tsx          → polling + theme selection + re-animation
  useNowPlaying.ts     → poll + smooth progress interpolation
  themes/              → premium · minimal · retro · neon
lib/
  spotify.ts           → Spotify API client (server-only secrets)
  tokenStore.ts        → local refresh-token persistence
  types.ts             → the NowPlaying contract
```

---

## ❓ Troubleshooting

**`INVALID_CLIENT: Insecure redirect URI`**
Your redirect URI uses `localhost`. Change it to `http://127.0.0.1:3000/api/auth/callback`
in both the Spotify dashboard **and** `.env.local`, and open the app via
`http://127.0.0.1:3000`.

**Overlay says “Spotify not connected”**
You haven't authorized yet, or `.spotify/tokens.json` was deleted. Open
`http://127.0.0.1:3000` and click **Connect Spotify**.

**Nothing shows in OBS but works in the browser**
Make sure OBS points at `127.0.0.1` (the same host you authorized with) and that
`npm run dev` is still running.

**`node` or `npm` is not recognized**
Node.js isn't installed (or your terminal needs a restart). Install the **LTS**
version from [nodejs.org](https://nodejs.org), reopen your terminal, and run
`node -v` to confirm before retrying.

**`npm install` fails**
Make sure you're inside the project folder (`cd spotify-obs-overlay`) and on
Node 20+. If it still fails, delete `node_modules` and try again.

**Album art doesn't load**
It's served from Spotify's CDN (`i.scdn.co`) — check your network/firewall.

---

## 📜 License

[MIT](LICENSE) — do whatever you want, just keep the notice.

## ⚖️ Disclaimer

Not affiliated with, endorsed by, or based on **Amuse** or **6klabs**. This is an
independent, open-source project built from scratch — no code, assets, or branding
from Amuse are used here.

Not affiliated with **Spotify**. "Spotify" is a trademark of Spotify AB.
