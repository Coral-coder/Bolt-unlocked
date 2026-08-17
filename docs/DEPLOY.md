# Deploying the Weather Radar app + auto-update from GitHub

The app lives in [`/app`](../app). It's a plain HTML5/JS web app — exactly the
shape of a GM **NGI** app (`gmapp.json` + `index.html`) — so it runs three ways:

1. In a normal browser (dev/testing).
2. In the **NGI simulator** (`ngi-sdk`) on a laptop.
3. On the head unit, once we have a way to register it (see the repo README).

## How "auto-update from GitHub" works

The manifest sets `"type": "RemoteHigh"` — a **remotely-hosted** NGI app. Instead
of copying files onto the unit, the on-device app is a thin shell that loads the
content from a URL. We host that URL on **GitHub Pages**, served from `/app`:

```
push to GitHub  ─►  GitHub Actions (deploy-pages.yml)  ─►  GitHub Pages URL
                                                              ▲
                              head unit / browser loads ──────┘  (always latest)
```

- Every push that touches `app/**` redeploys Pages automatically
  (`.github/workflows/deploy-pages.yml`).
- The running app also polls `version.json` every 30 min and reloads itself when
  the version changes — so even a long-running session picks up new builds.

To cut a new version: edit the app, bump `version` in **both**
`app/version.json` and `app/gmapp.json` (and `VERSION` in `app/app.js`), commit,
push. Done.

## One-time GitHub setup (REQUIRED — do this once)

The deploy workflow tries to enable Pages itself (`configure-pages` with
`enablement: true`), **but in this repo the Actions token is not permitted to
create the Pages site** (`Resource not accessible by integration`). So you must
enable it by hand, once:

1. **Settings → Pages → Build and deployment → Source = GitHub Actions.**
2. Re-run the failed workflow: **Actions → Deploy Weather Radar app → the failed
   run → Re-run all jobs** (or just push any change under `app/`).
3. After it goes green, the site URL prints under the **deploy** job →
   `page_url`, and looks like `https://<owner>.github.io/<repo>/`.
4. Open that URL to confirm the app loads. (Geolocation needs HTTPS — Pages is
   HTTPS, so it works. Locally, use `http://localhost`.)

Until step 1 is done, the **deploy check on the PR will stay red** — that's the
missing setting, not a bug in the app or workflow.

## Pointing the head unit at it

Once we have filesystem/registration access on the unit (debug menu explorer,
UART, or dump — see [DEBUG-MENU.md](DEBUG-MENU.md) / [FIRMWARE.md](FIRMWARE.md)):

- For a **RemoteHigh** app, the registration record carries the **remote URL** —
  set it to the Pages URL above. The unit then fetches the live app each launch.
- Confirm the exact field name for the remote URL from the `ngi-sdk` docs / a
  decompiled AppShop record — this is an open item in
  [CUSTOM-APPS.md](CUSTOM-APPS.md).
- If the unit blocks remote apps without the (now-dead) AppShop signing, fall
  back to a **local** app type: `dist/` is self-contained, so the same files can
  be copied to the unit's app directory and loaded locally. Only the base map,
  radar, and NWS calls need network (the unit's Wi-Fi/data).

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
