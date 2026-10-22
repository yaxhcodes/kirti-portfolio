"""Draw a self-hosted social card with native shapes and typography (Pillow)."""
import json
import os
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

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
        pixels[x, y] = tuple(round(a + (b - a) * mix) for a, b in zip((41, 76, 120), (127, 143, 166)))
draw = ImageDraw.Draw(image)
draw.ellipse((-300, -500, 1450, 330), fill='#667c98')
draw.ellipse((770, -190, 1510, 1050), fill='#7f8fa6')
draw.ellipse((-740, 445, 980, 1200), fill='#436b7b')
shadow = Image.new('RGBA', image.size)
ImageDraw.Draw(shadow).rounded_rectangle((64, 60, 1136, 591), radius=27, fill=(12, 26, 48, 90))
image = Image.alpha_composite(image.convert('RGBA'), shadow.filter(ImageFilter.GaussianBlur(23)))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((64, 45, 1136, 573), radius=24, fill='#ffffff', outline='#c5cad3', width=1)
draw.rounded_rectangle((65, 46, 1135, 101), radius=23, fill='#f5f5f7')
draw.rectangle((65, 74, 1135, 101), fill='#f5f5f7')
draw.line((65, 101, 1135, 101), fill='#c7cbd3', width=1)
for x, color in [(91, '#ff6057'), (114, '#ffbd2e'), (137, '#28c840')]:
    draw.ellipse((x, 66, x + 13, 79), fill=color)
draw.text((600, 70), 'Portfolio', font=font(17, bold=True), fill='#41444b', anchor='mm')

name = profile.get('fullName') or profile['name']
draw.text((116, 142), 'ENGINEERING CLEAR EXPERIENCES', font=font(15, bold=True), fill='#555b65')
name_size = 78
while draw.textlength(name, font=font(name_size, serif=True)) > 650:
    name_size -= 1
draw.text((111, 177), name, font=font(name_size, serif=True), fill='#1d1d1f')
draw.text((116, 286), profile['role'], font=font(32, bold=True), fill='#1d1d1f')
draw.text((116, 346), f"{profile['experience']} years of experience", font=font(24, bold=True), fill='#295783')
draw.text((116, 390), 'Accessible interfaces. Reliable products.', font=font(24), fill='#515154')
draw.text((116, 427), 'Enterprise & financial services.', font=font(24), fill='#515154')

x = 116
for tag in ['React', 'TypeScript', 'Accessibility']:
    text_font = font(18, bold=True)
    width = int(draw.textlength(tag, font=text_font)) + 32
    draw.rounded_rectangle((x, 486, x + width, 528), radius=10, fill='#f5f5f7', outline='#d2d2d7')
    draw.text((x + 16, 494), tag, font=text_font, fill='#515154')
    x += width + 10

if profile.get('portrait'):
    portrait_path = (root / 'dist' / profile['portrait']).resolve()
    if not portrait_path.is_relative_to((root / 'dist' / 'assets').resolve()):
        raise ValueError('The social card portrait must be a local asset.')
    with Image.open(portrait_path) as source:
        photo = ImageOps.fit(ImageOps.exif_transpose(source).convert('RGB'), (291, 388), Image.Resampling.LANCZOS, bleed=.065, centering=(.5, .65))
    mask = Image.new('L', photo.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 290, 387), radius=20, fill=255)
    image.paste(photo, (809, 141), mask)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((809, 141, 1099, 528), radius=20, outline='#c5cad3', width=1)
else:
    draw.rounded_rectangle((842, 164, 1062, 461), radius=25, fill='#edf2f9', outline='#c8d4e5', width=1)
    draw.text((951, 291), profile['experience'], font=font(71, serif=True), fill='#295783', anchor='mm')
    draw.text((951, 363), 'YEARS OF', font=font(15, bold=True), fill='#515154', anchor='mm')
    draw.text((951, 388), 'EXPERIENCE', font=font(15, bold=True), fill='#515154', anchor='mm')
image.convert('RGB').save(output, optimize=True)
print(f'Created {output} (1200 x 630)')
