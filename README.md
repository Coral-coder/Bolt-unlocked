# Bolt EUV Head Unit — Unlock Research

Personal right-to-repair / usability research on the **2023 Chevrolet Bolt EUV**
infotainment head unit. Goal: understand the system well enough to run our own
software on it (custom apps, tweaks) for better usability and stability.

This repo is documentation and tooling notes only. Nothing here modifies a
vehicle. Working on your own car's software can void warranties and — done
wrong — can brick the module. Proceed on your own hardware, at your own risk.

## Read this first — two hard truths

1. **APKs will never run on this unit.** The head unit is **QNX** (a real-time
   OS), not Android. Apple CarPlay / Android Auto are *phone projection*, not a
   native app runtime. The "tap build number → enable ADB → sideload APK" hacks
   you've seen are for **Android** head units (Kia/Hyundai, and GM's *newer*
   Ultium cars running Google built-in). They do not apply here. The right
   question isn't "how do I install an APK" — it's "how do I place a **native
   NGI app** in the QNX filesystem." See [docs/CUSTOM-APPS.md](docs/CUSTOM-APPS.md).

2. **Native apps on this platform are HTML5, and GM already shut the front door.**
   GM's Next-Gen Infotainment (NGI) apps are **HTML5/CSS/JS** with a `gmapp.json`
   manifest — and GM **shut down the NGI AppShop + dev-client servers on
   2025-09-30**. So the *sanctioned* delivery pipe (VIN approval → AppShop) is
   dead. The runtime is still on the car; what's gone is GM's way of pushing an
   app to it. That's exactly why we need filesystem access — to place the app
   the way the AppShop used to.

## TL;DR — what the head unit is

The 2023 Bolt EUV ships with **Chevrolet Infotainment 3 Plus** (10.2" screen).

| Component | Identity |
|---|---|
| Head unit family | LG **LC10** "silver box" radio, built by **LG Innotek** for GM |
| Model designations | `LC10S` / `LC10-S` / `LC10SB` / `LC10-SB` |
| FCC ID | `BEJLC10SB` |
| Operating system | **QNX**-based (BlackBerry QNX RTOS) |
| 2022–2023 EUV radio receiver (OEM) | `86511119` (and supersessions) |
| 2022–2023 display/touch panel | `42820321` |
| Connectivity | Bluetooth, 2.4 GHz + 5 GHz Wi-Fi, wireless Android Auto / Apple CarPlay |

> Note on the SoC: the exact application processor / RAM / flash are **not yet
> confirmed from a primary source**. The FCC internal-photo filing for
> `BEJLC10SB` is the place to confirm silicon; it was egress-blocked from this
> environment. See [docs/FIRMWARE.md](docs/FIRMWARE.md) for how to pull it.

## Where the firmware lives

Firmware is **not** an open download. It is distributed through GM's dealer
programming channel and is **signed + encrypted**:

- **Source:** `acdelcotds.com` → *Vehicle Programming Software* (SPS2 /
  GDS2-style flow). Access is ~$40 per VIN for a ~2-year window.
- **Delivery to the car:** the radio checks in over TLS to
  `vtmpub.oboservices.mobi`. Only ECDSA (secp256r1) cipher suites are accepted
  and certs are validated against GM's CA pool — MITM is not a practical entry.
- **Package layout** (per community teardown):
  - `indication.<id>.0` — checksum/index
  - `update/<part>_CPU.bin` — encrypted QNX IFS (main filesystem)
  - `update/<part>_OP.bin` — encrypted update payload
  - `update/<part>.mnf` — manifest
  - `update/<part>.smd` — public PEM keys + `sha256WithRSAEncryption` checksums

The `.bin` images are QNX IFS filesystems. `dumpifs` can unpack an IFS, but the
images are **encrypted**, so decryption is the wall — and the private keys are
not in the package. See [docs/FIRMWARE.md](docs/FIRMWARE.md).

## The realistic path to running our own app

Breaking GM's firmware signing is **not** the route. Two workstreams that meet
in the middle:

**A. Learn the app format (no car needed, do this now).** NGI apps are plain
HTML5. A valid app is a folder with an `index.html` and a `gmapp.json` manifest.
The old `ngi-sdk` (a Node.js `.tgz`) shipped a local **simulator** so you can
build and run one on a laptop today. Working samples exist on GitHub. This tells
us *exactly* what a droppable app looks like. See
[docs/CUSTOM-APPS.md](docs/CUSTOM-APPS.md).

**B. Get write access to the unit's app directory (the actual "unlock").**
Easiest → most invasive:

1. **Hidden engineering/debug menu** — tap the empty area of the Gallery app
   **12 times**, then a passcode: `1029475638185` (all menus), `20150105`,
   `20150106` (limited). Also try `CONFIG`+`TONE` held ~6s for diagnostics.
   Menus reset on radio reboot (`HOME` + `Fast Forward` held). Hunt for a
   "development mode" / "Explorer Mode" file browser (GM's exposes internal
   `NORDATA` storage + USB).
2. **UART/serial console** on the board — a QNX shell here may hand over the
   filesystem with no chip-off. Check first when the module is on the bench.
3. **Physical acquisition** — pull the module, read the eMMC/NAND directly for a
   *plaintext* QNX IFS. This bypasses the encrypted *update* channel entirely
   and shows us where apps live + how they're registered.
4. **On-target key extraction** — the device holds the keys it uses to decrypt
   updates; recovering them from a dumped image is the only path to reading the
   official signed packages (a means, not the goal).

The win condition: place an HTML5 NGI app (format from A) into the app location
we find in B, and register it the way the dead AppShop used to.

## Example app — Weather Radar

Our first NGI app lives in [`/app`](app): a full-screen **weather radar +
current conditions** display that uses your GPS location. Radar tiles from
RainViewer, conditions from the US NWS, dark map from CARTO — all free, no API
keys. It's a `RemoteHigh` NGI app served from **GitHub Pages** (branch-based),
so pushing to the served branch **auto-updates** what the unit loads. Live at
`https://coral-coder.github.io/Bolt-unlocked/app/` once Pages is on. See
[docs/DEPLOY.md](docs/DEPLOY.md).

## Documents

- [docs/NO-TEARDOWN-ACCESS.md](docs/NO-TEARDOWN-ACCESS.md) — **getting the app on the unit without opening it** (test plan)
- [docs/DEBUG-MENU.md](docs/DEBUG-MENU.md) — hidden engineering menu: how to open it
- [docs/CUSTOM-APPS.md](docs/CUSTOM-APPS.md) — the app runtime, format & how to build one
- [docs/DEPLOY.md](docs/DEPLOY.md) — deploy the example app + auto-update wiring
- [docs/FIRMWARE.md](docs/FIRMWARE.md) — obtaining & analyzing firmware
- [docs/HARDWARE.md](docs/HARDWARE.md) — module IDs, teardown, SoC confirmation
- [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md) — prioritized research plan

## Prior art

- `kallisti5/chevybolt` — community documentation of Bolt internals. Primary
  source for most of the above.
