# Getting the app on the screen via Android Auto (the working method)

Native install on the head unit is (so far) blocked and unconfirmed
([NO-TEARDOWN-ACCESS.md](NO-TEARDOWN-ACCESS.md)). The nice thing about this
method: it **doesn't depend on what the head unit runs.** Your unit has **Android
Auto** — that's all this needs. We run the app on the **phone** and display it on
the car screen over Android Auto; the head unit just projects it. Nothing on the
unit changes, and it's fully reversible.

This gets **Bolt Weather Radar** on the Bolt's screen today, and because the app
is served from GitHub Pages it still **auto-updates from the repo**.

## Why this works when adb doesn't

Android Auto is phone projection. Google gates which phone apps may show on the
car screen, but the phone has a hidden **"Unknown sources"** developer toggle
that lets **unapproved / sideloaded** apps appear in Android Auto (for
parked-use apps). We use that to run a car-capable **web browser** app on the
phone and point it at our URL. No head-unit exploit required.

> Parked-use only. These apps are for use while stopped; don't interact while
> driving, and follow local law.

## Method A — Fermata Auto (fastest, no build) ✅ recommended

Fermata Auto is a free car app with a built-in web browser. Point it at our page.

1. **On the phone**, download the **Fermata Auto** APK (from the project's
   official site / F-Droid) and install it (enable "Install unknown apps" for
   your browser or file manager when prompted).
2. **Enable Android Auto developer mode + unknown sources:**
   - Phone **Settings → Connected devices → Connection preferences → Android
     Auto** (or open the Android Auto app).
   - Tap **Version** (Version and permission info) ~10 times to unlock
     **Developer settings**.
   - Open the **⋮ menu → Developer settings → enable "Unknown sources."**
   - Back out and re-open Android Auto.
3. **Add Fermata to the car launcher:** Android Auto → **Customize launcher** →
   check **Fermata Auto**.
4. **Connect** to the Bolt (wireless Android Auto or a good USB cable), open
   **Fermata Auto** on the car screen → its **Web** browser → go to:

   ```
   https://coral-coder.github.io/Bolt-unlocked/app/
   ```

   Bookmark it / set as home page. Done — radar + conditions on the Bolt screen.

Geolocation note: inside Fermata's browser, our app uses the **phone's** GPS
(fine — the phone is in the car) over the phone's data connection. Grant Fermata
location permission on the phone.

## Method B — other browser-on-Android-Auto apps

Same idea, different front-end (use whichever is current and maintained):
**CarWebGuru**, **AA Mirror / Screen2Auto** (screen-mirroring, root-free variants
exist). All rely on the same Android Auto "Unknown sources" toggle. Fermata is
the simplest for "just show this web page."

## Tradeoffs vs. a native head-unit app

| | Projection (this doc) | Native install |
|---|---|---|
| Works today on stock GM AAOS | ✅ yes | ❌ no public method |
| Modifies the head unit | no (reversible) | would require an unlock |
| App auto-updates from GitHub | ✅ yes (remote URL) | ✅ yes (RemoteHigh) |
| Runs with phone connected | required | not required |
| Effort | minutes | blocked |

## Make our web app project nicely (already mostly done)

`/app` is a responsive full-screen web app, which is exactly what a car browser
wants. Small tuning already in place / worth keeping:

- Landscape, large touch targets, dark theme (car-friendly).
- No external login; free no-key data (RainViewer + NWS).
- If a car browser reports a small viewport, the layout already uses relative
  units and fl/grid so it scales.

## If native install ever opens up

Keep an eye on the XDA "GM Google Built-In — Tinkering" thread. If a bootloader
unlock or policy bypass appears, the native path in
[CUSTOM-APPS.md](CUSTOM-APPS.md) becomes viable again. Until then, projection is
the answer.
