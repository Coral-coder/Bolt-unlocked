# Debug & undocumented modes + getting adb to actually connect

Target: **Chevrolet Infotainment 3 / 3 Plus** (the QNX LG unit, the generation
**just before** GM's Google-built-in). Confirmed features on this unit: SiriusXM,
CarPlay, Android Auto, a GM **"apps"** section, **no Google apps**. It has an
Android-style Settings with a **Developer options** unlock and an **adb** toggle.

Everything here is read/diagnostic or a mode toggle — none of it writes firmware.
Do it **parked**. Sourcing/confidence is noted per item.

---

## Part 1 — ways into hidden / undocumented modes (try in this order)

### A. Android-style Developer options + adb  ✅ (you've done this)
`Settings → About / System info → tap Build number ~7×` → **Developer options**
appears → enable **USB debugging (ADB)**. This is the front door and it's
already on. The blocker after this is the **connection/driver** side — see Part 2.

### B. Gallery hidden engineering menu  ★ (undocumented service menus)
Source: codes found in **LG's open-source software** (via `kallisti5/chevybolt`).

1. Open the built-in **Gallery** app.
2. **Tap the empty area of the apps/Gallery screen 12 times.**
3. Enter a passcode:
   - `1029475638185` — unlocks **all** known menus
   - `20150105` or `20150106` — fewer menus
4. **Three new menus** appear at the **bottom of Settings**.
5. They **disappear on reboot**. Heads-up (verbatim from the source): *"most of
   these functions either don't do anything or crash the radio"* — so tread
   lightly and note what each does.

This is the menu most likely to contain low-level toggles (USB mode, network,
version, diagnostics). Screenshot every submenu.

### C. "Device Eye Pattern" — USB host/device toggle  ★ (the adb enabler)
Source: XDA reports (unverified on your exact build). Inside the engineering
menu there's a **"Device Eye Pattern"** control; hitting it for **USB2 then
USB1** reportedly **switches the external USB port from device↔host mode** and
that's what exposed **adb over the front USB port**. This matters because the
console USB is otherwise "media only" — the toggle is likely what makes your
laptop actually enumerate the unit. **Try this right before plugging in.**

### D. Service Mode  (diagnostic power state)
Source: `kallisti5/chevybolt`. **Vehicle off, foot off all pedals, hold the
power button 5 seconds.** Car goes to a "not ready" state but systems stay
online. Press power again to exit. Useful to keep the HU powered for bench-style
poking without the car fully "on."

### E. Radio reboot (recover from lockups)
Hold **`HOME` + `»` (Fast-Forward)** ~10–15s. Clears the Gallery menus too.

### F. Older GM combos — try only if the above come up short
- **`CONFIG` + `TONE`** held ~6s → diagnostics on older MyLink/Cruze.
- **POWER → (hold) HOME → (hold) MENU** press-sequence → developer/diag on some
  MyLink units.
Less certain on Infotainment 3; harmless to try.

---

## Part 2 — "no drivers": make adb actually connect

adb is enabled but your computer can't see the unit. Fix the connection:

### Fastest fix: use Linux (no vendor drivers needed)  ★ recommended
Linux talks to any adb device via udev — no Windows-style driver hunt.

1. Boot any Linux (an **Ubuntu live USB** is perfect — nothing to install on your
   PC).
2. `sudo apt update && sudo apt install -y android-tools-adb`
3. Do **Part 1C** (Device Eye Pattern → USB host/device) on the HU, then connect
   the console USB to the laptop.
4. `adb devices`
   - shows a serial + `device` → you're in; go to Part 3.
   - shows `unauthorized` → accept the RSA "allow debugging" prompt **on the car
     screen** (if it appears), then re-run.
   - shows nothing → try the other USB port, a known-good **data** cable
     (USB-A↔USB-A if needed), and re-toggle Device Eye Pattern.

### Windows fix (if you must use Windows)
1. Plug in (adb enabled). Open **Device Manager** → find the unknown/yellow-bang
   device → **Properties → Details → Hardware IDs** → note the **USB\VID_xxxx&PID_xxxx**.
2. Install a driver for it, easiest first:
   - **Google USB Driver** (from the Android SDK), or a **Universal ADB Driver**
     package, or
   - **Zadig** → select the device → install the **WinUSB** (or "ADB") driver.
3. If adb still can't see it, add the vendor id to
   `%USERPROFILE%\.android\adb_usb.ini` (one line: `0x<VID>`), then
   `adb kill-server && adb devices`.

### If `adb devices` shows `unauthorized` and no prompt ever appears
That's the "protected" wall some GM builds have (the allow-debugging dialog is
suppressed). Options: try a different USB port/mode via Device Eye Pattern; try
`adb devices` immediately after a radio reboot (Part 1E) to catch the prompt; if
it never authorizes, native adb is blocked on your build and projection
([PROJECTION-ANDROID-AUTO.md](PROJECTION-ANDROID-AUTO.md)) is the fallback.

---

## Part 3 — once adb connects (read-only recon)

Run [`../tools/adb-recon.sh`](../tools/adb-recon.sh) (nothing writes). Goal: find
where the **"apps"** live and how the launcher lists them — that's where our
web app goes. Key probes:

```bash
adb shell id
adb shell uname -a
adb shell "find / -iname gmapp.json 2>/dev/null"   # NGI/GM app manifests
adb shell "find / -type d -iname '*app*' 2>/dev/null | head"
adb shell ls -la /               # learn the filesystem shape (QNX vs Linux)
```

Paste the output back and we design the install step from real data — no more
platform guessing.

## Recon checklist (log results here)

- [ ] Gallery 12-tap menu opens on your unit? which passcode?
- [ ] "Device Eye Pattern" present? Did toggling it make the laptop see the unit?
- [ ] `adb devices` → `device`, `unauthorized`, or nothing?
- [ ] Did the RSA allow-prompt appear on the car screen?
- [ ] `adb shell id` → what user? root?
- [ ] Where do the "apps" live (path from `find`)?
