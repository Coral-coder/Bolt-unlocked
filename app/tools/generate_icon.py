#!/usr/bin/env python3
"""Generate app/Icon.png — a radar-sweep icon — using only the stdlib.

No Pillow/ImageMagick required. Draws a 128x128 RGBA PNG: dark rounded
background, concentric radar rings, crosshair, and a green sweep wedge.
"""
import math
import struct
import zlib
import os

SIZE = 128
BG = (11, 22, 34)          # #0b1622
RING = (74, 168, 255)      # #4aa8ff
SWEEP = (55, 214, 122)     # #37d67a
CENTER = SIZE / 2.0
R = SIZE / 2.0 - 6         # outer radius
CORNER = 22                # rounded-corner radius


def rounded_alpha(x, y):
    """Alpha (0..1) for a rounded-square mask with anti-aliased edge."""
    cx = min(max(x, CORNER), SIZE - CORNER)
    cy = min(max(y, CORNER), SIZE - CORNER)
    d = math.hypot(x - cx, y - cy)
    if x < CORNER or x > SIZE - CORNER:
        if y < CORNER or y > SIZE - CORNER:
            return max(0.0, min(1.0, CORNER - d + 0.5))
    return 1.0


def blend(dst, src, a):
    return tuple(int(round(dst[i] * (1 - a) + src[i] * a)) for i in range(3))


def build():
    px = [[BG for _ in range(SIZE)] for _ in range(SIZE)]
    alpha = [[0.0 for _ in range(SIZE)] for _ in range(SIZE)]

    sweep_dir = -45.0  # degrees
    sweep_width = 62.0

    for y in range(SIZE):
        for x in range(SIZE):
            ma = rounded_alpha(x + 0.5, y + 0.5)
            if ma <= 0:
                continue
            alpha[y][x] = ma
            dx, dy = x + 0.5 - CENTER, y + 0.5 - CENTER
            dist = math.hypot(dx, dy)
            color = BG

            # sweep wedge (fades from center outward, within an angular slice)
            if dist <= R:
                ang = math.degrees(math.atan2(dy, dx))
                da = (ang - sweep_dir + 180) % 360 - 180
                if 0 <= da <= sweep_width:
                    fade = (1 - da / sweep_width) * (1 - dist / R) * 0.85
                    color = blend(color, SWEEP, fade)

            # concentric rings + outer circle
            for rr in (R, R * 0.66, R * 0.33):
                if abs(dist - rr) < 1.3:
                    color = blend(color, RING, 0.9)
            # crosshair
            if dist <= R and (abs(dx) < 1.0 or abs(dy) < 1.0):
                color = blend(color, RING, 0.5)
            # center dot
            if dist < 4:
                color = blend(color, SWEEP, 1.0)

            px[y][x] = color

    return px, alpha


def write_png(path, px, alpha):
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)  # filter type 0
        for x in range(SIZE):
            r, g, b = px[y][x]
            a = int(round(alpha[y][x] * 255))
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = (b"\x89PNG\r\n\x1a\n" +
           chunk(b"IHDR", ihdr) +
           chunk(b"IDAT", zlib.compress(bytes(raw), 9)) +
           chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "Icon.png")
    px, alpha = build()
    write_png(os.path.abspath(out), px, alpha)
    print("wrote", os.path.abspath(out))
