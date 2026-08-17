# Bolt Weather Radar (NGI app)

Full-screen weather **radar + current conditions** for your GPS location.
An HTML5 GM **NGI** app (`gmapp.json` + `index.html`) that also runs as a plain
web page.

## Files

| File | Purpose |
|---|---|
| `index.html` | Entry point (manifest `main`) |
| `app.js` | Geolocation, radar animation, NWS conditions, auto-update |
| `style.css` | Layout tuned for a ~10.2" landscape car display |
| `gmapp.json` | NGI manifest (`type: RemoteHigh`) |
| `version.json` | Polled at runtime to trigger auto-reload on new builds |
| `Icon.png` | 128×128 launcher icon (regenerate: `python3 tools/generate_icon.py`) |

## Data sources (free, no keys, CORS-enabled)

- **Radar:** RainViewer — `api.rainviewer.com` (global)
- **Conditions:** US NWS — `api.weather.gov` (US-only)
- **Base map:** CARTO dark basemap (OpenStreetMap data)

## Run locally

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080  (geolocation works on localhost / HTTPS)
```

## Deploy + wire to the head unit

See [../docs/DEPLOY.md](../docs/DEPLOY.md). Short version: GitHub Pages serves
this folder; the `RemoteHigh` app points at that URL, so every push updates the
app the unit loads.

## Bump a version

Set the same value in `version.json`, `gmapp.json`, and `VERSION` in `app.js`,
then commit + push.
