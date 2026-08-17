# Getting the app onto the unit WITHOUT opening it

Goal: get our web app onto the 2023 Bolt EUV head unit using only
**already-exposed interfaces**. No dash disassembly, no soldering, no chip-off.

## What the unit actually is (updated)

The owner reached **Settings → About → tap Build number → Developer options →
USB debugging**, and `adb` connects. That's the **Android** flow — so this unit
is GM **"Google built-in" = Android Automotive OS (AAOS)**, not the QNX box the
earlier docs assumed. (GM's Google-built-in infotainment shipped on the 2023
refreshes; the QNX/NGI notes lower down are kept only as background.)

## ⛔ adb connects, but native install is BLOCKED (and there's no public bypass)

adb turning on does **not** mean you can install apps. On GM AAOS the owner finds
adb "protected" — and that matches the whole community's experience:

- **Policy-level sideload block.** GM sets a device-owner policy that disallows
  installs from unknown sources, so `adb install` / `pm install` are **denied**
  even with USB debugging on. There is no "Install unknown apps" toggle to flip.
- **Locked bootloader + verified boot.** No custom flashing, no root, no
  remounting `/system`.
- **Community status:** the XDA "GM Google Built-In — Tinkering" thread (25+
  pages) reports **zero success** sideloading apps this way, and GM's developer
  portal explicitly answered **"No"** to third-party sideloading.

**Conclusion: there is currently no public method to natively install an app on
this head unit.** Chasing an adb/`pm install` bypass is a dead end today.

➡️ **The working approach is projection, not installation:** run our web app on
your **phone** and display it on the car screen over **Android Auto**. It's
reversible, needs no head-unit modification, and works on the stock locked unit.
See **[PROJECTION-ANDROID-AUTO.md](PROJECTION-ANDROID-AUTO.md)** — this is the
recommended path now.

### One cheap thing to confirm first (tell me the exact symptom)

If adb shell *does* give a prompt, capture what actually fails so we're certain:

```bash
adb shell id                         # do we even get a shell user?
adb install ./any-small.apk          # note the exact error, e.g. INSTALL_FAILED_USER_RESTRICTED
adb shell pm list packages | grep -iE 'browser|chrome|webview|vending'
adb shell am start -a android.intent.action.VIEW \
  -d "https://coral-coder.github.io/Bolt-unlocked/app/"   # any handler? (usually none on AAOS)
```

If `am start` unexpectedly opens our page in some built-in webview, great — but
don't count on it. Projection is the reliable route.

---

## Honest status (pre-adb background)

Before adb was confirmed, there was **no published no-teardown method**. What we
knew:

- **Sanctioned path is dead.** GM's NGI **Dev Client** (the only official way to
  load a test app into a real vehicle) required VIN approval **and** downloading
  the Dev Client from the in-vehicle **AppShop** — whose servers GM shut down
  **2025-09-30**. No documented USB or local-server sideload ever existed.
- **The unit is locked down.** Community consensus on the LC10 head unit: no
  web browser, apps are GM-signed/validated, and the main head unit exposes
  little or nothing writable over the network.
- **The known-good shell is internal.** The reliable ADB/debug access people
  found is a **4-pin header on the infotainment PCB behind the dash** — i.e. it
  needs the dash trim off. That's the thing we're trying to avoid.

So this doc is a **ranked set of things to actually test**, not a recipe. Two of
them are real no-teardown leads; the rest are for completeness.

## Vector ranking (no teardown)

### 1. Engineering menu → "Device Eye Pattern" USB host-mode  ★ best lead
Multiple reports: inside the engineering/diagnostic menu there's a **"Device Eye
Pattern"** control that **switches the front USB port from device to host mode**,
and doing it for USB2 then USB1 exposed a debug/**ADB** channel over that
**external** USB port — no teardown.

- Unproven on the 2023 LC10SB; "ADB" terminology is murky (this is QNX, so it may
  be a QNX debug interface, not Android `adb`).
- **Test:** open the engineering menu (see [DEBUG-MENU.md](DEBUG-MENU.md)), find
  "Device Eye Pattern" for USB1/USB2, toggle it, and watch a connected laptop for
  a new USB device. Then probe for a shell (see test plan below).

### 2. Wi-Fi hotspot → network service scan  ★ worth doing
Reports conflict: one says the HU exposes **"some open ports"**; another says
**"no TCP/IP ports."** The confirmed telnet-as-root box is the **separate dashcam
accessory**, *not* the head unit. Settle it empirically on the actual car.

- **Test:** put the HU in Wi-Fi **hotspot** mode, join it from a laptop, find the
  gateway IP, and port-scan it (and the HU's own IP). Any listening service
  (telnet 23, QNX `qconn` 8000, http 80/8080, adb 5555) is a no-teardown channel.

### 3. Engineering menu → hidden "development/explorer" or USB-install entry
No LC10 report of a writable file browser, but the full menu has never been
mapped publicly. Enumerate every submenu for: "development mode", "Explorer",
"USB", "download mode", "install", "app", "network", "adb".

### 4. OBD-II / SPS2 programming — NOT an app path
Reflashing through the OBD port (GDS2 adapter + acdelcotds) is no-teardown, but
it only writes **signed GM firmware**. It can toggle RPO-gated *features* and
calibrations, but cannot install our app. Listed only so it's not re-explored.

### 5. Just open the app's URL in a browser — dead
Would be the softest path (our app is a remote URL), but the unit **has no
browser**. No known way to point it at an arbitrary URL.

## Concrete no-teardown test plan

All you need: the car, a laptop, and USB cables. Nothing gets opened.

**Phase 1 — map the engineering menu**
1. Gallery app → tap empty area 12× → passcode `1029475638185`.
2. Screenshot every submenu. Specifically locate: **Device Eye Pattern**, USB
   mode toggles, "development", "network", "adb", "install".

**Phase 2 — USB debug attempt (the ★ lead)**
1. Connect the front USB port to a laptop (USB-A↔USB-A or the port's cable).
2. In the engineering menu, trigger **Device Eye Pattern** for **USB2, then
   USB1**.
3. On the laptop, watch for a new device:
   - Linux: `dmesg -w` (look for a new USB serial/gadget); `lsusb`.
   - Then try Android tooling: `adb devices` → if listed, `adb shell`,
     `adb push app/ /<apps-dir>/`.
   - If it's QNX not Android: look for **`qconn`** (QNX remote debug, TCP 8000) or
     a serial `/dev/ttyACM*` login instead of `adb`.

**Phase 3 — Wi-Fi service scan**
1. HU → Settings → Wi-Fi Hotspot → on. Join it from the laptop.
2. `ip route` (or `ipconfig`) → note the gateway. Confirm it's the **HU**, not
   the OnStar modem or a dashcam.
3. `nmap -p- -sV <gateway>` and scan the HU's client IP too.
4. Probe anything open: `telnet <ip> 23`, `nc <ip> 8000` (qconn), `curl <ip>`.

**Phase 4 — if a shell/filesystem appears**
1. Find where installed NGI apps live and what the launcher reads to list them
   (open questions in [CUSTOM-APPS.md](CUSTOM-APPS.md)).
2. Copy `/app` into the apps dir; add its catalog/registration entry (what the
   dead AppShop used to do).
3. Relaunch the HMI / reboot the radio; confirm the app appears and runs.

## If all of the above fail

The fallback is the **4-pin ADB header behind the dash**. That's trim removal +
a header cable — **far less invasive than opening the module** (no soldering, no
chip-off), and fully reversible. Decide separately whether that crosses your
"don't open it up" line; document results either way.

## Log results here

- [ ] Engineering menu opens on the 2023 EUV? (codes verified?)
- [ ] "Device Eye Pattern" present? Did USB host-mode expose a device?
- [ ] `adb`/`qconn`/serial shell obtained over external USB?
- [ ] Wi-Fi scan: which ports are actually open on the HU?
- [ ] Apps directory + launcher catalog located?
