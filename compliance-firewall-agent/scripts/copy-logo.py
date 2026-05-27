"""Copy user's pre-processed transparent logo PNG into all needed sizes + OG card."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SRC = Path("/Users/yantr/Desktop/reference pic/houndshield-logo.png")
OUT = Path("compliance-firewall-agent/public")
OUT.mkdir(parents=True, exist_ok=True)

src = Image.open(SRC).convert("RGBA")
w, h = src.size
side = max(w, h)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(src, ((side - w) // 2, (side - h) // 2))

for size, name in [
    (512, "houndshield-logo.png"),
    (192, "houndshield-logo-192.png"),
    (48,  "houndshield-logo-48.png"),
    (32,  "houndshield-logo-32.png"),
    (16,  "houndshield-logo-16.png"),
]:
    square.resize((size, size), Image.LANCZOS).save(OUT / name, "PNG", optimize=True)

og = Image.new("RGBA", (1200, 630), (250, 252, 255, 255))
mark = square.resize((280, 280), Image.LANCZOS)
og.paste(mark, ((1200 - 280) // 2, (630 - 280) // 2 - 40), mark)
draw = ImageDraw.Draw(og)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia.ttf", 56)
except Exception:
    font = ImageFont.load_default()
text = "HoundShield"
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
draw.text(((1200 - tw) // 2, 470), text, fill=(15, 30, 46, 255), font=font)
og.convert("RGB").save(OUT / "og-image.png", "PNG", optimize=True)

print("Processed:", sorted(p.name for p in
    list(OUT.glob("houndshield-logo*")) + list(OUT.glob("og-image*"))))
