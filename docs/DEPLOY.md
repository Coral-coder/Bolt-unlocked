# Deploying the Weather Radar app + auto-update from GitHub

The app lives in [`/app`](../app). It's a plain HTML5/JS web app — exactly the
shape of a GM **NGI** app (`gmapp.json` + `index.html`) — so it runs three ways:

1. In a normal browser (dev/testing).
2. In the **NGI simulator** (`ngi-sdk`) on a laptop.
3. On the head unit, once we have a way to register it (see the repo README).

## Hosting: GitHub Pages (branch-based)

We serve the repo straight from a branch — no GitHub Actions, no special token
permissions (this repo's Actions token is not allowed to manage Pages, so the
branch method is the reliable one).

- Pages publishes the **entire branch** at the site root, so the app is at:
  `https://coral-coder.github.io/Bolt-unlocked/app/`
- The repo-root [`index.html`](../index.html) redirects `…/Bolt-unlocked/` →
  `…/app/`, so the short URL works too.
- [`.nojekyll`](../.nojekyll) tells Pages to serve files as-is (no Jekyll build).

### How "auto-update from GitHub" works

```
push to the served branch  ─►  GitHub Pages rebuilds (~1 min)  ─►  site URL
                                                                     ▲
                                head unit / browser loads ───────────┘  (latest)
```

- Every push to the **served branch** republishes the site automatically.
- The running app also polls `version.json` every 30 min and reloads itself when
  the version changes — so a long-running session still picks up new builds.

To cut a new version: edit the app, bump `version` in **both**
`app/version.json` and `app/gmapp.json` (and `VERSION` in `app/app.js`), commit,
push to the served branch. Done.

## One-time GitHub setup

**Settings → Pages → Build and deployment → Source = "Deploy from a branch"**,
then choose:

- **Branch:** the branch that actually contains `/app`.
  - If you serve from **main**, the app must be merged to `main` first (merge the
    PR). Then pushes to `main` update the live app.
  - If you serve from the **working branch**
    (`claude/bolt-euv-firmware-unlock-5fxzrz`), it works immediately with no
    merge, and pushes there update the live app.
- **Folder:** `/ (root)`

Give it ~1 minute, then open `https://coral-coder.github.io/Bolt-unlocked/`
(redirects to the app). Geolocation needs HTTPS — Pages is HTTPS, so it works.
Locally, use `http://localhost`.

## Pointing the head unit at it

Once we have filesystem/registration access on the unit (debug menu explorer,
UART, or dump — see [DEBUG-MENU.md](DEBUG-MENU.md) / [FIRMWARE.md](FIRMWARE.md)):

- For a **RemoteHigh** app, the registration record carries the **remote URL** —
  set it to `https://coral-coder.github.io/Bolt-unlocked/app/`. The unit then
  fetches the live app each launch.
- Confirm the exact field name for the remote URL from the `ngi-sdk` docs / a
  decompiled AppShop record — open item in [CUSTOM-APPS.md](CUSTOM-APPS.md).
- If the unit blocks remote apps without the (now-dead) AppShop signing, fall
  back to a **local** app type and copy `/app` onto the unit's app directory.

## Testing in the NGI simulator

```sh
# obtain the ngi-sdk .tgz (mirror it into prior-art/ — GM's portal is closing)
npm install -g ./package      # or: npm i -g ngi-sdk
cd app
ngi-sdk run                   # serves the app + simulates ~400 vehicle datapoints
```

Confirm the exact `ngi-sdk` run/serve command against its own README.

## Notes / limits

- **Conditions are US-only** (NWS `api.weather.gov`). The Bolt EUV is a US car,
  so that's fine; radar (RainViewer) is global.
- **Leaflet** currently loads from a CDN in `index.html`. For a fully
  self-contained/offline-tolerant bundle, vendor `leaflet.js` + `leaflet.css`
  into `app/vendor/` and update the `<link>`/`<script>` tags.
- No API keys anywhere — nothing secret is committed.
