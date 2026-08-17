# Bolt EUV Head Unit — Unlock Research

Personal right-to-repair / usability research on the **2023 Chevrolet Bolt EUV**
infotainment head unit. Goal: understand the system well enough to run our own
software on it (custom apps, tweaks) for better usability and stability.

This repo is documentation and tooling notes only. Nothing here modifies a
vehicle. Working on your own car's software can void warranties and — done
wrong — can brick the module. Proceed on your own hardware, at your own risk.

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

## The realistic unlock path

Breaking GM's signing is not the route. The tractable angles, easiest first:

1. **Hidden engineering/debug menu** — tap the empty area of the Gallery app
   **12 times**, then enter a passcode. Known codes (found in LG's published
   OSS): `1029475638185` (all menus), `20150105`, `20150106` (limited). Menus
   reset on radio reboot (`HOME` + `Fast Forward` held).
2. **Enumerate the debug menu** for any developer / app-install / filesystem /
   network diagnostics it exposes before touching firmware at all.
3. **Physical acquisition** — pull the module, read the eMMC/NAND directly, get
   a plaintext QNX IFS to study on the bench. This bypasses the encrypted
   *update* channel entirely.
4. **On-target key extraction** — the device holds the keys it uses to decrypt
   updates; recovering them from a dumped image is the only path to reading the
   official packages.

## Documents

- [docs/FIRMWARE.md](docs/FIRMWARE.md) — obtaining & analyzing firmware
- [docs/HARDWARE.md](docs/HARDWARE.md) — module IDs, teardown, SoC confirmation
- [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md) — prioritized research plan

## Prior art

- `kallisti5/chevybolt` — community documentation of Bolt internals. Primary
  source for most of the above.
