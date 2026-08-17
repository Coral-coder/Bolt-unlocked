# Debug / engineering menu — Bolt EUV (Infotainment 3 Plus, LG LC10SB)

**Confidence:** community-documented for the LG **LC10** head-unit family
(2017–2021 Bolt, from `kallisti5/chevybolt` and codes found in LG's published
OSS). The 2022–2023 EUV is the same LC10SB family, so these very likely carry
over — **but unverified on a 2023 specifically.** Nothing here writes anything;
it only opens hidden read/diagnostic menus. Do it **parked**.

## Method — hidden engineering menu via the Gallery app

1. Open the built-in **Gallery** (photo viewer) app on the touchscreen.
2. **Tap the empty/black area 12 times**, fairly rapidly.
3. A **passcode prompt** appears. Enter one of:
   - `1029475638185` — unlocks **all** known engineering/diagnostic menus
   - `20150105` or `20150106` — limited access (fallbacks)
4. Hidden entries now appear in **Settings** (engineering info, diagnostics,
   version/network screens).
5. **Reset/exit:** reboot the radio — hold **`HOME` + `»` (seek/fast-forward)**
   ~10–15s until it restarts. Hidden menus clear on every reboot.

*Also reported on other GM units (try only if the Gallery method shows no
diagnostics): hold `CONFIG` + `TONE` ~6s. Less certain on Infotainment 3.*

## Recon checklist (feeds the app-install work)

While you're in there, capture:

- [ ] **Build/version string** (e.g. `W41E…` / `W46E…`) — record it.
- [ ] Any **"development mode" / "Explorer" / file-browser** entry (GM's exposes
      internal `NORDATA` storage + USB). This is the prize.
- [ ] **Network** screens — IP, Wi-Fi, any adb-like or telnet/ssh service.
- [ ] **App/AppShop** entries — does an "Activities"/app catalog exist at all?
- [ ] Anything letting you **mount USB** or browse the filesystem.
- [ ] Screenshot **every** submenu (phone photo is fine) and log it back here.

## What we're looking for and why

The goal is a path to **write a folder into wherever installed apps live** and
register it with the launcher — replicating the (now-dead) AppShop. A file
browser / explorer mode that reaches internal storage, or a network shell, is
the cheapest route. If the menu is read-only, we fall back to a UART console or
a flash dump (see [FIRMWARE.md](FIRMWARE.md), [NEXT-STEPS.md](NEXT-STEPS.md)).
