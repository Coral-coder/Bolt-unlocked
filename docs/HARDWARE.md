# Hardware

## Head unit (2023 Bolt EUV — Infotainment 3 Plus)

| Item | Value |
|---|---|
| System name | Chevrolet Infotainment 3 Plus, 10.2" |
| Radio receiver (OEM) | `86511119` (2022–2023 EUV) + supersessions |
| Display / touch panel | `42820321` (2022–2023) |
| Builder | LG Innotek (for GM) |
| Model family | `LC10S` / `LC10-S` / `LC10SB` / `LC10-SB` ("silver box") |
| FCC ID | `BEJLC10SB` |
| OS | QNX RTOS (BlackBerry QNX) |
| Radios | Bluetooth, Wi-Fi 2.4 GHz + 5 GHz |

The infotainment stack is split across modules:
- **Radio receiver / HMI (CSM)** — the compute; runs QNX, drives the UI.
- **Display panel** — the 10.2" touch unit.
- These are separate part numbers and can fail/replace independently.

Earlier Bolt EV radios in the same LC10 lineage (for reference):
`42728517` (2020), `42680220` (2019), `42670713` (2018), `42671556` (2017).

## Confirming the SoC (not yet done)

The application processor, RAM, and flash are **not confirmed from a primary
source** yet. Two ways to close this:

1. **FCC internal photos** — filing `BEJLC10SB` on the FCC OET database (or a
   mirror like fccid.io). It includes internal teardown photos where the main
   SoC and RF chips are usually legible. *This host's egress proxy blocked
   fccid.io and the FCC site during research — pull it from an unrestricted
   network.* Search: FCC ID `BEJLC10SB`, grantee code `BEJ` (LG Innotek).
2. **Physical teardown** — open the recovered module and read the chip markings
   directly.

> Working hypothesis (unverified): this LG QNX generation typically runs an
> ARM Cortex-A SoC (NXP i.MX6-class or similar). Do **not** rely on this —
> confirm from photos/teardown before choosing dump/JTAG tooling.

## Related FCC filings worth pulling

- `BEJLTTC10F` / `LTTC10F` — LG telematics transceiver (LTE + Wi-Fi + BT);
  the connectivity/telematics side, separate from the radio compute.
- Grantee `YZP`, `VQT` — other LG Innotek automotive filings.
