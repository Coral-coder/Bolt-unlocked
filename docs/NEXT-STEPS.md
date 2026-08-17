# Next steps (prioritized)

Ordered easiest/cheapest → most invasive. Each step should be logged back into
this repo with what worked and what didn't.

## Phase 0 — no hardware risk (start here, costs nothing)

- [ ] **Build an NGI app in the simulator.** Get the `ngi-sdk` `.tgz`, scaffold
      an app, run it locally. Produces the exact bundle we later place on the
      unit. See [CUSTOM-APPS.md](CUSTOM-APPS.md).
- [ ] **Mirror prior art now** into `prior-art/` before GM's portal fully dies:
      `AccordionGuy/hello-gm`, `SalmaLargo/DriveEasy-NGI-GM-Application`,
      `kkawtar/NGI-General-Motors-application`, `callmehiphop/gm-button-events`,
      and the `ngi-sdk` package + docs (`developer.gm.com/ngi/downloads`).
- [ ] Nail the full `gmapp.json` schema and `type` enum from the SDK docs.
- [ ] Pull FCC filing `BEJLC10SB` internal photos; identify SoC / RAM / flash.
      (Blocked by egress here — do from an open network.)
- [ ] Read `kallisti5/chevybolt` in full; mirror anything useful into `prior-art/`.
- [ ] Search XDA / Bolt forums for existing LC10 / Infotainment 3 debug findings.

## Phase 1 — on the car, non-destructive

- [ ] Open the in-dash **debug menu**: Gallery app → tap empty area **12×** →
      passcode `1029475638185` (fallbacks `20150105`, `20150106`).
- [ ] Screenshot/enumerate every submenu. Look specifically for:
  - developer / engineering mode toggle
  - filesystem or file browser
  - app install / sideload / "download mode"
  - network / adb-like diagnostics
  - version + build string (record it; e.g. `W41E` / `W46E` families)
- [ ] Note the radio-reboot combo (`HOME` + `Fast Forward`) — menus reset on it.

## Phase 2 — bench the module

- [ ] Acquire a spare LC10SB radio receiver (`86511119`) to work on off-car.
- [ ] Build a bench power harness; power it up.
- [ ] Hunt for a **UART/serial console** (labeled TX/RX/GND pads). Try 115200 8N1.
      If a shell/log appears, this may be the whole game.

## Phase 3 — firmware extraction

- [ ] With SoC known, dump eMMC/NAND (clip, chip-off, or JTAG as appropriate).
- [ ] Run `dumpifs` on the recovered QNX IFS (should be plaintext on-device).
- [ ] Inventory: init scripts, app manager, keystore, update client, cert pins.
- [ ] Locate the keys the update client uses vs. the `.smd` public keys.

## Phase 4 — get our app running

- [ ] Find where installed NGI apps live on the QNX filesystem and what catalog
      the launcher reads (see open questions in [CUSTOM-APPS.md](CUSTOM-APPS.md)).
- [ ] Manually place the Phase-0 app bundle there + add its catalog entry —
      replicating what the (now dead) AppShop did over the air.
- [ ] Determine what enforces `gmapp.json` `type`/signing at launch; find the
      least-privileged app type that runs without server contact.
- [ ] Prove the app launches and can call NGI JS APIs.
- [ ] Determine whether changes survive an official SPS2 reflash, and how to
      re-apply after updates.

## Open decisions

- Buy a donor unit vs. work on the installed one? (Strongly prefer a donor.)
- Budget for GDS2 adapter + acdelcotds VIN access if we want a genuine package
  to diff against a bench dump.
