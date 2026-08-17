# Firmware: obtaining & analyzing

## 1. The official channel (signed, encrypted)

GM ships infotainment firmware through the dealer programming system, not as a
public download. There is **no legitimate public mirror of the full signed
`.bin` firmware** — forum "USB update" how-tos (e.g. the 2018 Electrek Bolt AA
guide) trigger GM's own *Settings → Software Information → Software Update* flow,
which pulls a GM-hosted package to the car; they do not hand you extractable
firmware files. Treat any random site hosting "GM firmware .bin" as suspect.

- **Portal:** `acdelcotds.com` → *Vehicle Programming Software*.
- **Account:** ~$40 per VIN, valued for roughly two years of access.
- **Interface hardware:** a GDS2 / MDI-class pass-thru adapter (genuine, or a
  Chinese clone ~$105) connected to the OBD-II port.
- **Flow:** *Programming* → type *Normal* → match the RPO codes from the
  glovebox label → follow the on-screen steps exactly, uninterrupted.

> Warning from prior researchers: **do not reprogram safety systems**, and never
> interrupt a flash. A failed session can brick the module — or the car.

Capturing the package during an SPS2 session (proxy/PCAP or grabbing the staged
files off the programming laptop) is how the community obtained the sample
layout below.

## 2. Package layout

```
indication.<id>.0            # checksum / index
update/<part>_CPU.bin        # encrypted QNX IFS  (main filesystem)
update/<part>_OP.bin         # encrypted update payload
update/<part>.mnf            # manifest
update/<part>.smd            # public PEM keys + sha256WithRSAEncryption sums
```

Example ids seen in the wild: `indication.16008211.0`,
`update/42615022_CPU.bin`, `update/42615022_OP.bin`.

## 3. Why you can't just unpack it

The `.bin` files are **QNX IFS** images, but **encrypted**. Normally:

```sh
# QNX SDP ships dumpifs; unpacks an IFS into its files
dumpifs -x 42615022_CPU.bin
```

...works only on a *plaintext* IFS. The update packages are encrypted and the
`.smd` only carries **public** keys + checksums (for verifying the signature),
not the decryption key. So the update channel is a dead end for reading firmware
until you have a plaintext image.

## 4. The way in: read the module, not the update

The device necessarily holds a decrypted, running filesystem and the keys it
uses. So the productive path is to get firmware *off the module itself*:

1. **Bench the module.** Remove the LC10 head unit (radio receiver
   `86511119`-family). Power it on a bench harness.
2. **Locate storage.** Identify the eMMC/NAND. An eMMC can often be read via a
   test-point clip or by reballing; NAND via a programmer.
3. **Dump raw flash.** Get a full image. A QNX system partition should be a
   *plaintext* IFS — feed it to `dumpifs` and you have the real filesystem,
   binaries, configs, and the keys used against the update channel.
4. **Confirm the SoC first** ([docs/HARDWARE.md](HARDWARE.md)) so you know which
   dump/JTAG tooling applies.

## 5. Serial / debug console

Before invasive work, check for a **UART/serial console** on the board (QNX
systems commonly expose one). A shell there may hand you the filesystem and logs
with no chip-off at all. Look for labeled TX/RX/GND test pads during teardown.

## Open questions to close

- [ ] Exact eMMC/NAND part and capacity on the 2022–2023 LC10SB board.
- [ ] Is a UART console present and unauthenticated?
- [ ] Does the on-screen debug menu expose a filesystem browser or app installer?
- [ ] What signs the OP payload — same key class as `.smd` public keys?
