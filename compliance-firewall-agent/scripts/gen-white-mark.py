#!/usr/bin/env python3
"""Generate public/logo-mark-white.png — the brand mark in white, for dark grounds.

WHY THIS EXISTS. Every HoundShield brand asset (public/logo.png,
public/houndshield-logo.png) is a NEAR-BLACK doberman shield. That is correct for
the website and the PDF cover, both of which are light. It is unusable on the
dark navy email header band: the mark renders as a dark smudge on dark navy, and
shrinking it into a small white chip only trades invisible for illegible.

So the dark band gets a white mark. This keeps the SILHOUETTE and the ALPHA
CHANNEL of the original and repaints every visible pixel white — it is a
recolour, not a redraw, so the shape stays exactly the brand's shape.

The alpha is preserved rather than thresholded, so the anti-aliased edge stays
smooth instead of turning into a jagged cutout at 44px.

Usage:  python3 scripts/gen-white-mark.py   (run from compliance-firewall-agent/)
Requires Pillow.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "logo.png")
OUT = os.path.join(ROOT, "public", "logo-mark-white.png")

# Rendered at 44px in email; 176px gives a 4x buffer for retina without the
# 1.4 MB weight of the full-size asset.
SIZE = 176


def main() -> None:
    src = Image.open(SRC).convert("RGBA")

    # The shape lives in the ALPHA channel: public/logo.png is a dark mark
    # (44,44,43) on genuine transparency — 73% of its pixels are fully clear.
    #
    # The tempting alternative, deriving coverage from luminance, is wrong here
    # and fails silently: `convert("L")` renders transparent pixels as BLACK,
    # so the transparent surround scores as maximum coverage and the whole
    # canvas comes out opaque white. Measured, not assumed — the corner pixel
    # of logo.png is (0,0,0,0).
    alpha = src.getchannel("A")

    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    white.putalpha(alpha)

    white = white.resize((SIZE, SIZE), Image.LANCZOS)
    white.save(OUT, format="PNG", optimize=True)

    kb = os.path.getsize(OUT) / 1024
    print(f"wrote {OUT} ({SIZE}x{SIZE}, {kb:.1f} KB)")


if __name__ == "__main__":
    main()
