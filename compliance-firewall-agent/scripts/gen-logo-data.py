#!/usr/bin/env python3
"""Regenerate lib/reports/logo-data.ts from public/logo.png.

The HoundShield brand mark (doberman shield) is compiled into the PDF pipeline as
a base64 PNG so every report — server-rendered AND browser-bundled — embeds the
real logo with no filesystem/network dependency and no CSP concern.

The source PNG is dark-on-transparent; jsPDF mishandles PNG alpha, so we flatten
onto white (it is seated in a white chip on the dark cover band anyway) and
downscale to 256x256 for a small footprint (~35 KB PNG / ~46 KB base64).

Usage:  python3 scripts/gen-logo-data.py   (run from compliance-firewall-agent/)
Requires Pillow (pip install Pillow).
"""
import base64
import io
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "logo.png")
OUT = os.path.join(ROOT, "lib", "reports", "logo-data.ts")


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    flat = Image.alpha_composite(white, src).convert("RGB").resize((256, 256), Image.LANCZOS)
    buf = io.BytesIO()
    flat.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()

    ts = (
        "/**\n"
        " * logo-data — the HoundShield brand mark as a compiled-in base64 PNG, so every\n"
        " * PDF (server AND browser bundle) can embed the real logo with no filesystem or\n"
        " * network dependency and no CSP concern. Source: public/logo.png (the doberman\n"
        " * shield), flattened onto white and downscaled to 256x256 for a small footprint.\n"
        " *\n"
        " * Regenerate: python3 scripts/gen-logo-data.py (see that file), then commit.\n"
        " * Consumed by drawBadge() in lib/reports/pdf-brand.ts via doc.addImage().\n"
        " */\n"
        "export const LOGO_PNG_DATA_URI =\n"
        '  "data:image/png;base64,' + b64 + '";\n'
    )
    with open(OUT, "w") as f:
        f.write(ts)
    print(f"wrote {OUT} ({len(ts)} chars, {len(b64)} base64)")


if __name__ == "__main__":
    main()
