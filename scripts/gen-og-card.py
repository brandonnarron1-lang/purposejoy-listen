#!/usr/bin/env python3
"""Generate OG card for listen.purposejoy.org using Pillow + system fonts."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

W, H = 1200, 630
GOLD       = (212, 175, 55)    # #D4AF37
GOLD_HI    = (255, 215, 80)    # #FFD750
GOLD_DEEP  = (184, 148, 31)
SAND       = (240, 220, 160)   # #F0DCA0
DARK       = (20, 10, 5)       # #140A05
DARK_DEEP  = (10, 5, 0)        # #0A0500

# Canvas with radial gradient background
img = Image.new("RGB", (W, H), DARK_DEEP)
px = img.load()
cx_bg, cy_bg = W * 0.38, H * 0.5
max_r = math.hypot(W * 0.65, H * 0.65)
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx_bg, y - cy_bg) / max_r
        t = min(1.0, d)
        px[x, y] = tuple(int(DARK[i] * (1 - t) + DARK_DEEP[i] * t) for i in range(3))

d = ImageDraw.Draw(img, "RGBA")

# Sun aura (soft warm halo)
aura = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ad = ImageDraw.Draw(aura)
for r, a in [(260, 28), (200, 36), (140, 48), (90, 65)]:
    ad.ellipse((320 - r, 320 - r, 320 + r, 320 + r), fill=GOLD + (a,))
aura = aura.filter(ImageFilter.GaussianBlur(radius=18))
img.paste(aura, (0, 0), aura)

# Rays — 12, alternating long/short
sun_x, sun_y = 320, 320
for i in range(12):
    angle = (i / 12) * 2 * math.pi - math.pi / 2
    is_long = i % 2 == 0
    r_in, r_out = 145, 215 if is_long else 175
    x1 = sun_x + r_in * math.cos(angle)
    y1 = sun_y + r_in * math.sin(angle)
    x2 = sun_x + r_out * math.cos(angle)
    y2 = sun_y + r_out * math.sin(angle)
    color = GOLD_HI if is_long else GOLD
    width = 6 if is_long else 3
    d.line((x1, y1, x2, y2), fill=color, width=width)

# Halo ring + disc
d.ellipse((sun_x - 135, sun_y - 135, sun_x + 135, sun_y + 135),
          outline=GOLD, width=2)

# Disc with gradient (simulated via concentric circles)
for r in range(115, 0, -3):
    t = 1 - (r / 115)
    color = tuple(int(GOLD_DEEP[i] * (1 - t) + GOLD_HI[i] * t) for i in range(3))
    d.ellipse((sun_x - r, sun_y - r, sun_x + r, sun_y + r), fill=color)

# Highlight
d.ellipse((280 - 50, 288 - 26, 280 + 50, 288 + 26), fill=GOLD_HI + (115,))

# Font resolution — serif italic + sans
font_paths_serif = [
    "/Library/Fonts/Cormorant Garamond Italic.ttf",
    "/Users/" + os.getenv("USER", "") + "/Library/Fonts/CormorantGaramond-MediumItalic.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
    "/Library/Fonts/Georgia Italic.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
]
font_paths_sans = [
    "/System/Library/Fonts/Supplemental/Futura.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]

def first_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default(size=size)

italic_96 = first_font(font_paths_serif, 96)
italic_36 = first_font(font_paths_serif, 36)
sans_20   = first_font(font_paths_sans, 20)
sans_15   = first_font(font_paths_sans, 15)

# Eyebrow
eyebrow = "A  C O U N T R Y   G O S P E L   A L B U M"
d.text((610, 155), eyebrow, font=sans_20, fill=GOLD)

# Title (italic serif, two lines)
d.text((610, 195), "Live With",       font=italic_96, fill=(255, 255, 255))
d.text((610, 295), "Purpose And Joy", font=italic_96, fill=(255, 255, 255))

# Hairline
d.line((610, 415, 900, 415), fill=GOLD, width=1)

# Attribution
d.text((610, 428), "Mike Eatmon", font=italic_36, fill=SAND)

# Footer credit
d.text((610, 498), "L I S T E N . P U R P O S E J O Y . O R G",
       font=sans_15, fill=SAND)

# Bottom hairline
d.line((100, 530, 1100, 530), fill=GOLD + (140,), width=1)

os.makedirs("public/og", exist_ok=True)
img.save("public/og/og-card.png", "PNG", optimize=True)
print("✓ wrote public/og/og-card.png")

# Twitter card — same image, crop to 1200x600
img.crop((0, 15, W, 615)).save("public/og/twitter-card.png", "PNG", optimize=True)
print("✓ wrote public/og/twitter-card.png")

# Report which fonts were resolved
print(f"  serif font: {italic_96}")
print(f"  sans  font: {sans_20}")
