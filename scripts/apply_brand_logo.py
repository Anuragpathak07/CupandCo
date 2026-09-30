"""Regenerate all Cup & Co brand assets from assets/images/image.png (the coffee-cup logo)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "images" / "image.png"
ASSETS = ROOT / "assets" / "images"
PUBLIC = ROOT / "public"

CREAM = (250, 249, 246, 255)  # #FAF9F6
INK = (28, 28, 30, 255)


def load_logo() -> Image.Image:
    return Image.open(SRC).convert("RGBA")


def fitted(logo: Image.Image, size: int, pad_ratio: float) -> Image.Image:
    """Scale logo to fit inside `size` with padding, preserving aspect ratio."""
    target = round(size * (1 - pad_ratio * 2))
    fitted_logo = logo.copy()
    fitted_logo.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(
        fitted_logo, ((size - fitted_logo.width) // 2, (size - fitted_logo.height) // 2)
    )
    return canvas


def on_background(logo: Image.Image, size: int, bg, pad_ratio: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    canvas.alpha_composite(fitted(logo, size, pad_ratio))
    return canvas.convert("RGB")


def silhouette(logo: Image.Image) -> Image.Image:
    """Single-color mark preserving the logo's alpha channel."""
    alpha = logo.split()[3]
    solid = Image.new("L", logo.size, INK[0])
    return Image.merge("RGBA", (solid, solid, solid, alpha))


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    print(f"wrote {path.relative_to(ROOT)}")


def main() -> None:
    logo = load_logo()

    # Expo / native artwork.
    save(on_background(logo, 1024, CREAM, 0.14), ASSETS / "icon.png")
    save(fitted(logo, 1024, 0.12), ASSETS / "android-icon-foreground.png")
    save(fitted(silhouette(logo), 1024, 0.12), ASSETS / "android-icon-monochrome.png")
    save(fitted(logo, 512, 0.08), ASSETS / "splash-icon.png")
    save(on_background(logo, 64, CREAM, 0.10), ASSETS / "favicon.png")

    # PWA / web artwork.
    for size in (72, 96, 128, 144, 152, 192, 384, 512):
        save(on_background(logo, size, CREAM, 0.12), PUBLIC / f"icon-{size}.png")
    save(on_background(logo, 180, CREAM, 0.12), PUBLIC / "apple-touch-icon.png")

    ico_base = on_background(logo, 64, CREAM, 0.10)
    favicon_ico = PUBLIC / "favicon.ico"
    ico_base.save(
        favicon_ico,
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print(f"wrote {favicon_ico.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
