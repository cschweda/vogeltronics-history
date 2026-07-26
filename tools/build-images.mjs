#!/usr/bin/env node
/**
 * Build the web images the page actually serves.
 *
 * Reads the committed originals in assets/img-src/ and writes right-sized
 * WebP into assets/img/. Nothing else touches assets/img/ — it is generated,
 * gitignored, and rebuilt by `npm run build` on every Netlify deploy.
 *
 * Two things are going on here, and the second matters more than the first.
 *
 * Format: WebP beats both the JPEG photographs and — by a wide margin — the
 * flat-colour box art, which is the wrong kind of image for PNG at this size.
 * No <picture> fallback: WebP has been in every shipping browser since Safari
 * 14 in 2020, and 31 elements of fallback markup to serve a rounding error of
 * traffic is a bad trade.
 *
 * Size: every image was being sent far larger than it is ever displayed. The
 * box art arrives 600px wide to be drawn at 210. WIDTHS below is the CSS
 * display width doubled, so the file is exactly right for a 2x screen and no
 * bigger. Where an image appears in two places at two sizes, the larger wins
 * — see the comments.
 *
 * Nothing is upscaled: withoutEnlargement means a source already at or under
 * its target is re-encoded but not stretched.
 */
import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";

const SRC = "assets/img-src";
const OUT = "assets/img";

// target width = CSS display width x2, for a 2x screen
const WIDTHS = {
  // masthead min(430px,82%); also the 1977 half of the .evo strip at 96px tall
  "logo-vogeltronics-1977": 860,
  // figure.badge inline min(420px,86%); also the 1961 half of .evo
  "logo-vogel-novelty-1961": 840,
  // .ft-in img, 200px
  "vogel-portrait": 400,
  // The Founding's inline min(280px,100%)
  "vogel-young": 560,
  // its own figure at inline min(280px,66%), and .boxart at min(210px,78%)
  "box-oracle": 560,
  // figure.photo min(520px,92%) — sources are already 1000px, so this is a
  // re-encode rather than a resize
  __photo: 1040,
  // everything else is .prod img at 210px, some also .boxart at min(210px,78%)
  __box: 420,
};

const widthFor = (name) =>
  WIDTHS[name] ?? (name.startsWith("photo-") ? WIDTHS.__photo : WIDTHS.__box);

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (!files.length) {
  console.error(`no source images in ${SRC}/`);
  process.exit(1);
}

let inBytes = 0;
let outBytes = 0;
const rows = [];

for (const file of files.sort()) {
  const { name } = parse(file);
  const from = join(SRC, file);
  const to = join(OUT, `${name}.webp`);

  const info = await sharp(from)
    .resize({ width: widthFor(name), withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(to);

  const before = (await stat(from)).size;
  inBytes += before;
  outBytes += info.size;
  rows.push([
    `${name}.webp`,
    `${info.width}x${info.height}`,
    before,
    info.size,
    Math.round((1 - info.size / before) * 100),
  ]);
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
for (const [n, dim, b, a, pct] of rows) {
  console.log(`  ${n.padEnd(32)} ${dim.padEnd(10)} ${kb(b).padStart(8)} -> ${kb(a).padStart(8)}  -${pct}%`);
}
console.log(
  `\n  ${files.length} images  ${kb(inBytes)} -> ${kb(outBytes)}  ` +
    `(-${Math.round((1 - outBytes / inBytes) * 100)}%)`
);
