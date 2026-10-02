# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Generate the static rose-three logo as SVG and PNG.

PNG is rendered from the SVG using ImageMagick (magick/convert), which must be installed.

Usage:
    uv run generate_logo.py                          # outputs logo.svg + logo.png to current dir
    uv run generate_logo.py --output-dir assets/     # outputs to assets/
    uv run generate_logo.py --size 512               # PNG at 512x512
    uv run generate_logo.py --color "#CAEA28"        # custom colour
    uv run generate_logo.py --svg-only               # skip PNG generation
"""

from __future__ import annotations

import argparse
import math
import shutil
import subprocess
import sys
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

# Rose curve parameters (matching the animated version)
ROSE_A = 9.2
ROSE_A_BOOST = 0.6
ROSE_BREATH_BASE = 0.72
ROSE_BREATH_BOOST = 0.28
ROSE_SCALE = 3.25
DETAIL_SCALE = 0.76  # mid-pulse for a balanced static shape
STROKE_WIDTH = 4.6
STEPS = 480
VIEWBOX = 100  # SVG viewBox is 0-100


def rose_point(progress: float) -> tuple[float, float]:
    """Calculate a point on the rose curve at a given progress (0-1)."""
    t = progress * math.pi * 2
    a = ROSE_A + DETAIL_SCALE * ROSE_A_BOOST
    r = a * (ROSE_BREATH_BASE + DETAIL_SCALE * ROSE_BREATH_BOOST) * math.cos(3 * t)
    x = 50 + math.cos(t) * r * ROSE_SCALE
    y = 50 + math.sin(t) * r * ROSE_SCALE
    return x, y


def build_path_d() -> str:
    """Build the SVG path data string for the rose curve."""
    parts = []
    for i in range(STEPS + 1):
        x, y = rose_point(i / STEPS)
        cmd = "M" if i == 0 else "L"
        parts.append(f"{cmd} {x:.2f} {y:.2f}")
    return " ".join(parts)


def generate_svg(color: str) -> str:
    """Generate the rose curve as a standalone SVG."""
    svg = Element("svg")
    svg.set("xmlns", "http://www.w3.org/2000/svg")
    svg.set("viewBox", f"0 0 {VIEWBOX} {VIEWBOX}")
    svg.set("width", str(VIEWBOX))
    svg.set("height", str(VIEWBOX))
    svg.set("fill", "none")

    path = SubElement(svg, "path")
    path.set("d", build_path_d())
    path.set("stroke", color)
    path.set("stroke-width", str(STROKE_WIDTH))
    path.set("stroke-linecap", "round")
    path.set("stroke-linejoin", "round")
    path.set("opacity", "0.9")

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + tostring(
        svg, encoding="unicode"
    )


def svg_to_png(svg_path: Path, png_path: Path, size: int) -> None:
    """Convert SVG to PNG. Prefers rsvg-convert, falls back to ImageMagick."""
    if shutil.which("rsvg-convert"):
        subprocess.run(
            [
                "rsvg-convert",
                "-w", str(size),
                "-h", str(size),
                "--background-color", "none",
                str(svg_path),
                "-o", str(png_path),
            ],
            check=True,
        )
        print(f"PNG: {png_path} ({size}x{size})")
        return

    for cmd in ("magick", "convert"):
        if shutil.which(cmd):
            subprocess.run(
                [
                    cmd,
                    "-density", "300",
                    "-background", "none",
                    str(svg_path),
                    "-resize", f"{size}x{size}",
                    str(png_path),
                ],
                check=True,
            )
            print(f"PNG: {png_path} ({size}x{size})")
            return

    print(
        "No SVG renderer found. Install with: brew install librsvg",
        file=sys.stderr,
    )
    print(f"SVG generated — convert manually with any SVG renderer.", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate static rose-three logo")
    parser.add_argument(
        "--color", default="#CAEA28", help="Stroke colour (default: brand lime)"
    )
    parser.add_argument(
        "--size",
        type=int,
        default=1024,
        help="PNG output size in pixels (default: 1024)",
    )
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Output directory (default: current directory)",
    )
    parser.add_argument(
        "--svg-only",
        action="store_true",
        help="Only generate SVG, skip PNG",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    svg_content = generate_svg(args.color)
    svg_path = output_dir / "logo.svg"
    svg_path.write_text(svg_content)
    print(f"SVG: {svg_path}")

    if not args.svg_only:
        png_path = output_dir / "logo.png"
        svg_to_png(svg_path, png_path, args.size)


if __name__ == "__main__":
    main()
