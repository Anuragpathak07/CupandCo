from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
ASSETS.mkdir(parents=True, exist_ok=True)

INK = "#1C1C1E"
CANVAS = "#FBFBFA"
ACCENT = "#D97706"
WHITE = "#FFFFFF"


def draw_mark(size: int, dark_background: bool = False, monochrome: bool = False) -> Image.Image:
    scale = size / 1024
    image = Image.new("RGBA", (size, size), INK if dark_background else (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    body_fill = INK if monochrome else (WHITE if dark_background else INK)
    accent = INK if monochrome else ACCENT
    inner = INK if (monochrome or dark_background) else (0, 0, 0, 0)

    def box(values):
        return tuple(round(value * scale) for value in values)

    # Cup handle, with a transparent/dark center to create the ring.
    draw.ellipse(box((585, 395, 830, 610)), fill=accent)
    draw.ellipse(box((640, 445, 780, 565)), fill=inner)

    # Tapered cup body.
    draw.polygon(
        [(round(250 * scale), round(315 * scale)), (round(650 * scale), round(315 * scale)),
         (round(605 * scale), round(700 * scale)), (round(300 * scale), round(700 * scale))],
        fill=body_fill,
    )
    draw.rounded_rectangle(box((278, 670, 628, 760)), radius=round(45 * scale), fill=body_fill)

    # Coffee surface and lower accent line.
    draw.ellipse(box((225, 280, 675, 385)), fill=accent)
    draw.ellipse(box((270, 298, 630, 350)), fill=INK if not monochrome and dark_background else (INK if monochrome else CANVAS))

    # Saucer.
    draw.rounded_rectangle(box((175, 755, 760, 815)), radius=round(30 * scale), fill=accent)

    # Steam marks.
    for x in (345, 445, 545):
        draw.arc(box((x - 28, 115, x + 28, 255)), start=205, end=335, fill=accent, width=max(2, round(14 * scale)))

    return image


def save(image: Image.Image, name: str, size: int) -> None:
    image.resize((size, size), Image.Resampling.LANCZOS).save(ASSETS / name)


save(draw_mark(1024, dark_background=True), "icon.png", 1024)
save(draw_mark(1024, dark_background=False), "android-icon-foreground.png", 1024)
save(draw_mark(1024, dark_background=False, monochrome=True), "android-icon-monochrome.png", 1024)
save(draw_mark(512, dark_background=False), "splash-icon.png", 512)
save(draw_mark(64, dark_background=True), "favicon.png", 64)

# Keep Expo's generated iOS icon directory coherent by placing the branded mark in its icon slot.
expo_icon = ROOT / "assets" / "expo.icon" / "icon.png"
expo_icon.parent.mkdir(parents=True, exist_ok=True)
draw_mark(1024, dark_background=True).save(expo_icon)

print("Generated Cup & Co app icons and splash artwork.")
