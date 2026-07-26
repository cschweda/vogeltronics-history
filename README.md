<p align="center">
  <img src="assets/vogeltronics-logo.svg" alt="VogelTronics — Games That Think!" width="680">
</p>

# VogelTronics — The Whole Story

**Live site:** [vogeltronics.com](https://vogeltronics.com) — the bare domain is the landing page. `www` and `history.vogeltronics.com` redirect to it.

A single-page, magazine-style corporate history of **VogelTronics** ("Games That Think!") — a completely fictional American toy company, founded as the **Vogel Novelty Company** in Elk Grove Village, Illinois in 1961, renamed **VogelTronics** in the electronics craze of 1977, and dead by 1983 — forever in the wrong place at the wrong time.

<p align="center">
  <img src="assets/vogel-at-his-desk-web.jpg" alt="Walter T. Vogel at his office desk in shirtsleeves, cigar in mouth, pen in hand over stacks of paper, beneath the VogelTronics &quot;Games That Think!&quot; sign" width="680">
  <br>
  <em>Walter T. Vogel in his Elk Grove Village office, autumn 1982 — signing off on the forecast that contained the company's best prediction and its worst. He is fictional. So is the company, the sign behind him, and the office park out the window.</em>
</p>

## Why a fictional company?

This project exists to give a family of retro-toy homage projects a shared backstory. The goal was to recreate the feel of the golden age of electronic handhelds and programmable toys — but the real things are protected trademarks and trade dress. So instead of imitating a real company, VogelTronics was invented from scratch: its own founder, its own catalog, its own logos, and its own string of heartbreaking near-misses.

Game *mechanics* are not copyrightable; the invented VogelTronics branding stands in for the real-world brands the projects deliberately avoid.

This history is the background lore for the playable recreations of VogelTronics' fictional catalog, indexed at [MetaIncognita](https://metaincognita.com) — including **Rovacon** (the programmable tank) and **Gridiron** / **Gridiron II** (the LED football handhelds). The games themselves are still being rebuilt, but Rovacon's voice is done: the history's games grid previews the three actual in-game voice clips, generated with [vogel-vox](https://github.com/cschweda/vogeltronics-vogel-vox).

## The story

The page covers, era by era:

- **1961 — The Founding** of the Vogel Novelty Company in Elk Grove Village, Illinois
- **1966–1976 — The Heritage Hits and the Lean Years** (Sergeant Steele, Meadow, Derby — all under the Vogel Novelty name)
- **1977 — The Electronic Reinvention**: Vogel Novelty officially becomes **VogelTronics** — "Games That Think!"
- **1979 — The Flagship**: Rovacon, and the voice that shouldn't exist
- **1979–1982 — Electrify Everything**: the misfires (The Oracle, The Handicapper, Stargazer, Whirlwind…)
- **1980–1981 — The Grandmaster Affair** and the ghost in the machine
- **1981 — The Cordless Detour**: VogelTronics leaves the toy aisle
- **1983 — The Colossus and the Crash**: the last, fatal bet
- **Epilogue** — and links to play the games

## Tech

There is no build step and there are no dependencies. The entire site — markup, styles, all 21 images, and the three Rovacon voice clips (all embedded as data URIs) — is one self-contained `index.html` (~3 MB). The box art and logos are PNG; the four photographs are JPEG, resized to 1000 px wide (480 px for the portrait) so the page stays a reasonable download. The `assets/` folder holds the README logo artwork (`vogeltronics-logo.svg` and its PNG render), drawn as pure vector paths so it needs no fonts, the SVG source for the 1961 Vogel Novelty badge (`vogel-novelty-badge.svg`), the full-resolution photograph sources (`vogelheadshot-*.png`, `pinewoodderby.png`, `vogel_at_his_desk.png`, `christmasparty.png`) plus the web-sized copy this README displays (`vogel-at-his-desk-web.jpg`), and the source WAVs for the embedded Rovacon clips. `tools/gen_badge.py` regenerates the badge SVG and re-embeds its PNG into `index.html` (needs `rsvg-convert` and the DejaVu Sans font); it is never required to view or deploy the site.

`tools/make-og-image.py` regenerates the social card (`assets/og-image.png`). **This repo is its canonical home** — it is the one generator every VogelTronics property uses, so the whole catalog's cards match. Game repos do not keep a copy; they run it from a sibling checkout and commit only the resulting PNG. For this site:

```bash
python3 tools/make-og-image.py \
  --boxart assets/larry-box-art.png \
  --logo assets/vogeltronics-logo.svg \
  --title "THE WHOLE STORY" \
  --subtitle "VOGELTRONICS · 1961–1983" \
  --url vogeltronics.com \
  --out assets/og-image.png
```

For a game repo, from a sibling checkout:

```bash
cd ../vogeltronics-gridiron-i
python3 ../vogeltronics-history/tools/make-og-image.py \
  --boxart docs/images/gridiron-boxart.png \
  --logo docs/images/vogeltronics-logo.svg \
  --title GRIDIRON \
  --subtitle "ELECTRONIC FOOTBALL · 1977" \
  --url gridiron.vogeltronics.com \
  --out docs/images/og-image.png
```

To view locally, open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deployment

Deployed on [Netlify](https://www.netlify.com/) at [vogeltronics.com](https://vogeltronics.com). `netlify.toml` publishes the repo root as-is; every push to `main` deploys.

## Legal

VogelTronics, the Vogel Novelty Company, VogelVox, Walter T. Vogel, Viktor Ozerov, and every product named in this history are original inventions created for a set of retro-toy homage projects. They deliberately use no Hasbro, Mattel, Milton Bradley, Parker Brothers, or Fidelity trademarks, logos, or trade dress. Any resemblance to real companies or persons is affectionate parody.

## License

[MIT](LICENSE)
