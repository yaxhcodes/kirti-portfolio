"""Draw a self-hosted social card with native shapes and typography (Pillow)."""
import json
import os
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

profile = json.load(sys.stdin)
root = Path(__file__).resolve().parents[1]
output = root / 'dist' / 'assets' / 'og-image.png'
fonts = Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts'


def font(size, bold=False, serif=False):
    filename = 'georgia.ttf' if serif else ('segoeuib.ttf' if bold else 'segoeui.ttf')
    path = fonts / filename
    if not path.exists():
        raise FileNotFoundError(f'Font unavailable: {path}. Set the fonts path for this authoring environment.')
    return ImageFont.truetype(str(path), size)


image = Image.new('RGB', (1200, 630))
pixels = image.load()
for y in range(630):
    for x in range(1200):
        mix = (x / 1200 * .4 + y / 630 * .6)
        pixels[x, y] = tuple(round(a + (b - a) * mix) for a, b in zip((56, 76, 106), (143, 150, 164)))
draw = ImageDraw.Draw(image)
draw.ellipse((-300, -500, 1450, 330), fill='#697e9a')
draw.ellipse((770, -190, 1510, 1050), fill='#ad9594')
draw.ellipse((-740, 445, 980, 1200), fill='#536b79')
shadow = Image.new('RGBA', image.size)
ImageDraw.Draw(shadow).rounded_rectangle((64, 60, 1136, 591), radius=27, fill=(12, 26, 48, 90))
image = Image.alpha_composite(image.convert('RGBA'), shadow.filter(ImageFilter.GaussianBlur(23)))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((64, 45, 1136, 573), radius=24, fill='#ffffff', outline='#c5cad3', width=1)
draw.rounded_rectangle((65, 46, 1135, 101), radius=23, fill='#e8ebf0')
draw.rectangle((65, 74, 1135, 101), fill='#e8ebf0')
draw.line((65, 101, 1135, 101), fill='#c7cbd3', width=1)
for x, color in [(91, '#de897d'), (114, '#dab466'), (137, '#8eae7c')]:
    draw.ellipse((x, 66, x + 13, 79), fill=color)
draw.text((600, 70), 'Portfolio', font=font(17, bold=True), fill='#41444b', anchor='mm')

name = profile.get('fullName') or profile['name']
draw.text((116, 142), 'ENGINEERING CLEAR EXPERIENCES', font=font(15, bold=True), fill='#555b65')
name_size = 78
while draw.textlength(name, font=font(name_size, serif=True)) > 650:
    name_size -= 1
draw.text((111, 177), name, font=font(name_size, serif=True), fill='#1d1d1f')
draw.text((116, 286), profile['role'], font=font(32, bold=True), fill='#1d1d1f')
draw.text((116, 351), 'Accessible interfaces. Reliable products.', font=font(24), fill='#424247')
draw.text((116, 388), 'Enterprise & financial services.', font=font(24), fill='#424247')

x = 116
for tag in ['React', 'TypeScript', 'Accessibility']:
    text_font = font(18, bold=True)
    width = int(draw.textlength(tag, font=text_font)) + 32
    draw.rounded_rectangle((x, 464, x + width, 506), radius=10, fill='#edf2f9', outline='#c8d4e5')
    draw.text((x + 16, 472), tag, font=text_font, fill='#295783')
    x += width + 10

draw.rounded_rectangle((842, 164, 1062, 461), radius=25, fill='#e3eaf4', outline='#bdcbdc', width=1)
draw.rounded_rectangle((863, 185, 1041, 440), radius=18, fill='#f1f5fa', outline='#c9d4e2', width=1)
draw.text((951, 291), profile['experience'], font=font(71, serif=True), fill='#215381', anchor='mm')
draw.text((951, 363), 'YEARS OF', font=font(15, bold=True), fill='#44596e', anchor='mm')
draw.text((951, 388), 'EXPERIENCE', font=font(15, bold=True), fill='#44596e', anchor='mm')
image.convert('RGB').save(output, optimize=True)
print(f'Created {output} (1200 x 630)')
