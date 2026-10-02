# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools>=4.50", "requests>=2.28", "brotli>=1.1"]
# ///
"""Generate an SVG wordmark from text using Clash Display font outlines.

Converts text into SVG path elements so the result renders without the font installed.
Styled to match the personal brand: Clash Display, normal weight, tight tracking.

Usage:
    uv run generate_wordmark.py "Barry Dobson"
    uv run generate_wordmark.py "PROJECTS" --style mono-label
    uv run generate_wordmark.py "Hello" --color "#FAFAFA" --size 48 --output hello.svg
    uv run generate_wordmark.py "Bold" --style display --weight 600
"""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

import requests
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

FONT_CACHE_DIR = Path(tempfile.gettempdir()) / "personal-brand-fonts"

# Local font search paths, in priority order
LOCAL_FONT_DIRS = [
    Path.home() / "Library" / "Fonts",
    Path.home() / "Downloads" / "ClashDisplay_Complete" / "Fonts" / "WEB" / "fonts",
    Path.home() / "Downloads" / "ClashDisplay_Complete" / "Fonts" / "ttf",
    Path.home() / "Downloads" / "ClashGrotesk_Complete" / "Fonts" / "WEB" / "fonts",
    Path.home() / "Downloads" / "ClashGrotesk_Complete" / "Fonts" / "ttf",
]

# Weight name mapping for local font file lookup
WEIGHT_NAMES = {
    200: "Extralight",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "Semibold",
    700: "Bold",
}

# Remote fallbacks for when local fonts aren't available
REMOTE_FONTS = {
    "clash-display": {
        "css_url": "https://api.fontshare.com/v2/css?f[]=clash-display@400&display=swap",
        "filename": "ClashDisplay-Regular.woff2",
    },
    "clash-grotesk": {
        "css_url": "https://api.fontshare.com/v2/css?f[]=clash-grotesk@400&display=swap",
        "filename": "ClashGrotesk-Regular.woff2",
    },
    "jetbrains-mono": {
        "css_url": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap",
        "filename": "JetBrainsMono-Regular.woff2",
    },
}

# Font family to file prefix mapping
FONT_FILE_PREFIXES = {
    "clash-display": "ClashDisplay",
    "clash-grotesk": "ClashGrotesk",
    "jetbrains-mono": "JetBrainsMono",
}

STYLES = {
    "display": {
        "font": "clash-display",
        "color": "#CAEA28",
        "size": 64,
        "weight": 400,
        "tracking": -0.03,
        "transform": None,
    },
    "heading": {
        "font": "clash-grotesk",
        "color": "#FAFAFA",
        "size": 32,
        "weight": 500,
        "tracking": -0.02,
        "transform": None,
    },
    "mono-label": {
        "font": "jetbrains-mono",
        "color": "#A1A1AA",
        "size": 12,
        "weight": 400,
        "tracking": 0.15,
        "transform": "uppercase",
    },
}


def find_local_font(font_key: str, weight: int) -> Path | None:
    """Search local font directories for a matching font file."""
    prefix = FONT_FILE_PREFIXES.get(font_key)
    if not prefix:
        return None

    weight_name = WEIGHT_NAMES.get(weight, "Regular")

    for font_dir in LOCAL_FONT_DIRS:
        if not font_dir.exists():
            continue
        # Prefer exact weight, then variable font, across formats
        for name in (f"{prefix}-{weight_name}", f"{prefix}-Variable"):
            for ext in ("ttf", "otf", "woff2", "woff"):
                candidate = font_dir / f"{name}.{ext}"
                if candidate.exists():
                    return candidate

    return None


def download_font(font_key: str) -> Path:
    """Download a font to the cache directory, returning the local path."""
    FONT_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    font_info = REMOTE_FONTS[font_key]
    local_path = FONT_CACHE_DIR / font_info["filename"]

    if local_path.exists():
        return local_path

    print(f"Downloading {font_key} font...", file=sys.stderr)

    font_url = None
    try:
        css_resp = requests.get(
            font_info["css_url"],
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
            timeout=10,
        )
        if css_resp.ok:
            urls = re.findall(r"url\(([^)]+\.woff2[^)]*)\)", css_resp.text)
            if urls:
                font_url = urls[0].strip("'\"")
                if font_url.startswith("//"):
                    font_url = "https:" + font_url
    except requests.RequestException:
        pass

    if not font_url:
        print(
            f"Could not resolve download URL for {font_key}. "
            "Download fonts from https://www.fontshare.com/ to ~/Downloads/",
            file=sys.stderr,
        )
        sys.exit(1)

    resp = requests.get(font_url, timeout=30)
    resp.raise_for_status()
    local_path.write_bytes(resp.content)
    print(f"Cached to {local_path}", file=sys.stderr)
    return local_path


def resolve_font(font_key: str, weight: int) -> Path:
    """Find the best font file: local first, then download."""
    local = find_local_font(font_key, weight)
    if local:
        return local
    return download_font(font_key)


def text_to_svg_paths(
    text: str,
    font_path: Path,
    font_size: float,
    tracking: float,
) -> tuple[list[tuple[str, float]], float, float, float]:
    """Convert text to a list of (svg_path_d, x_offset) tuples.

    Path coordinates and offsets are in font units (unscaled).
    The caller applies a single scale transform to the SVG group.

    Returns (paths, total_width_units, ascender_units, scale).
    """
    font = TTFont(font_path)
    cmap = font.getBestCmap()
    units_per_em = font["head"].unitsPerEm
    scale = font_size / units_per_em

    hmtx = font["hmtx"]
    os2 = font["OS/2"]

    ascender = os2.sTypoAscender
    tracking_units = tracking * units_per_em

    glyph_set = font.getGlyphSet()
    paths = []
    cursor_x = 0.0

    for i, char in enumerate(text):
        code_point = ord(char)
        glyph_name = cmap.get(code_point)

        if glyph_name is None:
            advance = hmtx.metrics.get(".notdef", (units_per_em // 2, 0))[0]
            if char == " ":
                advance = hmtx.metrics.get("space", (units_per_em // 4, 0))[0]
            cursor_x += advance
            continue

        advance_width = hmtx.metrics[glyph_name][0]

        pen = SVGPathPen(glyph_set)
        try:
            glyph_set[glyph_name].draw(pen)
            path_d = pen.getCommands()
        except Exception:
            path_d = ""

        if path_d:
            paths.append((path_d, cursor_x))

        extra = tracking_units if i < len(text) - 1 else 0
        cursor_x += advance_width + extra

    return paths, cursor_x, ascender, scale


def build_svg(
    text: str,
    paths: list[tuple[str, float]],
    total_width_units: float,
    ascender_units: float,
    scale: float,
    color: str,
    bg_color: str | None,
    padding: float,
) -> str:
    """Build an SVG document from glyph paths.

    Paths are in font units. A single scale transform on the group converts to pixels.
    """
    pixel_width = total_width_units * scale + (padding * 2)
    pixel_height = ascender_units * scale * 1.4 + (padding * 2)

    svg = Element("svg")
    svg.set("xmlns", "http://www.w3.org/2000/svg")
    svg.set("viewBox", f"0 0 {pixel_width:.1f} {pixel_height:.1f}")
    svg.set("width", f"{pixel_width:.1f}")
    svg.set("height", f"{pixel_height:.1f}")
    svg.set("role", "img")
    svg.set("aria-label", text)

    if bg_color:
        bg = SubElement(svg, "rect")
        bg.set("width", "100%")
        bg.set("height", "100%")
        bg.set("fill", bg_color)
        bg.set("rx", "8")

    # Scale from font units to pixels, flip Y (font Y is up, SVG Y is down),
    # then translate so the ascender line sits below the top padding.
    g = SubElement(svg, "g")
    g.set("fill", color)
    g.set(
        "transform",
        f"translate({padding:.1f}, {padding + ascender_units * scale:.1f}) scale({scale:.6f}, -{scale:.6f})",
    )

    for path_d, x_offset in paths:
        path_el = SubElement(g, "path")
        if x_offset != 0:
            path_el.set("transform", f"translate({x_offset:.1f}, 0)")
        path_el.set("d", path_d)

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + tostring(
        svg, encoding="unicode"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate an SVG wordmark using brand fonts"
    )
    parser.add_argument("text", help="Text to render as SVG wordmark")
    parser.add_argument(
        "--style",
        choices=list(STYLES.keys()),
        default="display",
        help="Preset style (default: display)",
    )
    parser.add_argument("--color", help="Override text colour (hex)")
    parser.add_argument("--bg", help="Background colour (hex), omit for transparent")
    parser.add_argument("--size", type=float, help="Override font size in px")
    parser.add_argument(
        "--weight",
        type=int,
        choices=sorted(WEIGHT_NAMES.keys()),
        help="Font weight (200=Extralight, 300=Light, 400=Regular, 500=Medium, 600=Semibold, 700=Bold)",
    )
    parser.add_argument(
        "--tracking", type=float, help="Override letter-spacing as em fraction"
    )
    parser.add_argument(
        "--padding", type=float, default=0, help="Padding around text in px"
    )
    parser.add_argument(
        "--output", "-o", help="Output file path (default: stdout)"
    )

    args = parser.parse_args()

    style = STYLES[args.style]
    color = args.color or style["color"]
    font_size = args.size or style["size"]
    weight = args.weight or style["weight"]
    tracking = args.tracking if args.tracking is not None else style["tracking"]
    text = args.text
    if style["transform"] == "uppercase":
        text = text.upper()

    font_path = resolve_font(style["font"], weight)

    paths, total_width_units, ascender_units, scale = text_to_svg_paths(
        text, font_path, font_size, tracking
    )

    svg = build_svg(
        text=args.text,
        paths=paths,
        total_width_units=total_width_units,
        ascender_units=ascender_units,
        scale=scale,
        color=color,
        bg_color=args.bg,
        padding=args.padding,
    )

    if args.output:
        Path(args.output).write_text(svg)
        print(f"Written to {args.output}", file=sys.stderr)
    else:
        print(svg)


if __name__ == "__main__":
    main()
