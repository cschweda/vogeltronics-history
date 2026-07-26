#!/usr/bin/env python3
"""Regenerate VogelTronics Gridiron box art.

Shared brand tooling: one copy, one look across the whole catalog. By
default (no arguments) this reproduces exactly what it always has —
No. 2100's art, re-rendered and re-embedded as the base64 PNG on this
repo's own <img id="art-gridiron"> tag, which the history page's catalog
gallery clones via data-art.

Pass --out to instead write a standalone box art pair for some other game
in the catalog: a <title>+<image> SVG wrapper (so the file is technically
vector but always renders pixel-identical, regardless of the viewer's
fonts) plus the sibling PNG it embeds. Every other flag defaults to
No. 2100's copy, so unless you override it, --out alone still reproduces
that same art in the new location.

All copy on the box is original VogelTronics material — do not use real
manufacturers' advertising lines.

Usage:
  python3 tools/gen_gridiron_boxart.py
  python3 tools/gen_gridiron_boxart.py \\
      --title "GRIDIRON II" --year 1978 \\
      --footer2 "2 PLAYERS · PRO 1 / PRO 2 · THE FORWARD PASS · REQUIRES 9-VOLT BATTERY · NO. 2200" \\
      --svg-title "Gridiron II box art — VogelTronics, 1978" \\
      --out ../vogeltronics-gridiron-ii/docs/images/gridiron-ii-boxart.svg
"""

import argparse
import base64
import pathlib
import re
import subprocess
import tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 600, 780

# No. 2100's copy — every CLI flag below defaults to one of these, so that
# running this script with no arguments changes nothing about today's art.
TITLE = "GRIDIRON"
TITLE_SIZE, TITLE_LS = 82, 10
YEAR = "1977"
FOOTER_1 = "ALL THE ACTION OF THE GRIDIRON · IT THINKS TWO PLAYS AHEAD"
FOOTER1_SIZE, FOOTER1_LS = 13, 1.4
FOOTER_2 = "2 PLAYERS · PRO 1 / PRO 2 · REQUIRES 9-VOLT BATTERY · NO. 2100"
FOOTER2_SIZE, FOOTER2_LS = 13, 2
SVG_TITLE = "Gridiron box art — VogelTronics, 1977"

# blip grid: 3 rows x 9 cols; a handful lit "bright" for drama
BRIGHT = {(0, 4), (0, 7), (1, 1), (1, 5), (2, 5)}


def blips() -> str:
    out = []
    for row in range(3):
        for col in range(9):
            cx, cy = 108 + col * 48, 210 + row * 52
            if (row, col) in BRIGHT:
                out.append(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#ff3b2a" opacity=".22"/>')
                out.append(f'<circle cx="{cx}" cy="{cy}" r="11" fill="#ff3b2a"/>')
            else:
                out.append(f'<circle cx="{cx}" cy="{cy}" r="9" fill="#4a0b06"/>')
    return "\n    ".join(out)


def _fmt(n: float) -> str:
    """Render a size/spacing number the way the old hand-written constants
    were written: '82' rather than '82.0', but '1.4' where that's genuine."""
    return f"{round(n, 1):g}"


def _scaled(base_size: float, base_ls: float, base_text: str, text: str):
    """Shrink font-size/letter-spacing to fit copy longer than the No. 2100
    original; never grow shorter copy past that original size. At the
    original length (the default case) this is an exact no-op."""
    scale = min(1.0, len(base_text) / len(text)) if text else 1.0
    return _fmt(base_size * scale), _fmt(base_ls * scale)


def build_svg(title: str, year: str, footer1: str, footer2: str) -> str:
    title_size, title_ls = _scaled(TITLE_SIZE, TITLE_LS, TITLE, title)
    f1_size, f1_ls = _scaled(FOOTER1_SIZE, FOOTER1_LS, FOOTER_1, footer1)
    f2_size, f2_ls = _scaled(FOOTER2_SIZE, FOOTER2_LS, FOOTER_2, footer2)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="#101014"/>
  <rect x="14" y="14" width="{W - 28}" height="{H - 28}" rx="6" fill="none" stroke="#2e2e33" stroke-width="2"/>

  <text x="48" y="74" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="36"><tspan fill="#f4efe6">Vogel</tspan><tspan fill="#e8322a">Tronics</tspan></text>
  <text x="552" y="70" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="17" letter-spacing="5" fill="#9a9aa2">{year}</text>

  <rect x="70" y="115" width="460" height="230" rx="18" fill="#1c0605" stroke="#3a0c08" stroke-width="4"/>
  <text x="300" y="172" text-anchor="middle" font-family="Menlo, Courier New, monospace" font-weight="700" font-size="32" letter-spacing="6" fill="#ff5040">1st &amp; 10</text>
  <g>
    {blips()}
  </g>

  <text x="300" y="472" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="{title_size}" letter-spacing="{title_ls}" fill="#f2ead8">{title}</text>
  <text x="300" y="520" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="25" letter-spacing="8" fill="#e01f10">ELECTRONIC FOOTBALL</text>

  <g transform="translate(300 600) rotate(-4)">
    <rect x="-218" y="-33" width="436" height="66" rx="9" fill="#e01f10"/>
    <text x="0" y="11" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-style="italic" font-size="30" letter-spacing="3" fill="#ffffff">GAMES THAT THINK!</text>
  </g>

  <text x="300" y="702" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="{f1_size}" letter-spacing="{f1_ls}" fill="#c9c9cf">{footer1}</text>
  <text x="300" y="740" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="500" font-size="{f2_size}" letter-spacing="{f2_ls}" fill="#85858d">{footer2}</text>
</svg>
"""


def render_png(svg: str) -> bytes:
    with tempfile.TemporaryDirectory() as td:
        page = pathlib.Path(td) / "box.html"
        out = pathlib.Path(td) / "box.png"
        page.write_text(
            "<!doctype html><html><head><meta charset='utf-8'>"
            "<style>html,body{margin:0;padding:0;overflow:hidden}</style></head>"
            f"<body>{svg}</body></html>"
        )
        subprocess.run(
            [CHROME, "--headless=new", f"--screenshot={out}", f"--window-size={W},{H}",
             "--hide-scrollbars", "--disable-gpu", f"file://{page}"],
            check=True, capture_output=True,
        )
        return out.read_bytes()


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--title", default=TITLE, help=f"on-card product name (default: {TITLE!r})")
    parser.add_argument("--year", default=YEAR, help=f"top-corner year mark (default: {YEAR!r})")
    parser.add_argument("--footer1", default=FOOTER_1, help="upper footer line (tagline)")
    parser.add_argument("--footer2", default=FOOTER_2, help="lower footer line (players/spec/model no.)")
    parser.add_argument(
        "--svg-title", dest="svg_title", default=SVG_TITLE,
        help="<title> metadata for the standalone SVG wrapper; only used with --out",
    )
    parser.add_argument(
        "--out", default=None,
        help="write a standalone <title>+<image> SVG (and a sibling .png next to it) here, "
             "instead of re-embedding into this repo's own index.html",
    )
    args = parser.parse_args()

    svg = build_svg(args.title, args.year, args.footer1, args.footer2)
    png_bytes = render_png(svg)

    if args.out is None:
        index = ROOT / "index.html"
        html = index.read_text()
        b64 = base64.b64encode(png_bytes).decode()
        pattern = r'(<img src="data:image/png;base64,)[A-Za-z0-9+/=]+("[^>]*id="art-gridiron")'
        new_html, n = re.subn(pattern, lambda m: m.group(1) + b64 + m.group(2), html, count=1)
        if n != 1:
            raise SystemExit("could not find the art-gridiron master image tag")
        index.write_text(new_html)
        print(f"re-embedded art-gridiron ({len(b64)} b64 chars)")
    else:
        out_svg = pathlib.Path(args.out)
        out_png = out_svg.with_suffix(".png")
        out_svg.parent.mkdir(parents=True, exist_ok=True)
        out_png.write_bytes(png_bytes)
        b64 = base64.b64encode(png_bytes).decode()
        wrapper = (
            f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'viewBox="0 0 {W} {H}" width="{W}" height="{H}">\n'
            f'  <title>{args.svg_title}</title>\n'
            f'  <image width="{W}" height="{H}" xlink:href="data:image/png;base64,{b64}"/>\n'
            f'</svg>\n'
        )
        out_svg.write_text(wrapper)
        print(f"wrote {out_svg} and {out_png}")


if __name__ == "__main__":
    main()
