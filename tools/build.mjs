#!/usr/bin/env node
/**
 * Assemble dist/ — the only thing Netlify publishes.
 *
 * The site used to publish the repo root, which meant package.json, tools/,
 * package-lock.json and all 2.9 MB of full-resolution originals in
 * assets/img-src/ were served to the public alongside the actual page. None of
 * it was a security problem — the repo is public — but it is five times the
 * deploy weight for no reason, and the originals were being offered to
 * crawlers as a second copy of every photograph.
 *
 * So dist/ gets exactly what the page loads and nothing else:
 *
 *   index.html            the page
 *   assets/img/*.webp     built from assets/img-src/ by build-images.mjs
 *   assets/*.wav          the nine voice clips, fetched on demand
 *   assets/og-image.png   fetched by social crawlers, not by the page
 *   robots.txt            + sitemap.xml
 *
 * Paths inside dist/ mirror the repo, so nothing in index.html changes.
 */
import { cp, mkdir, rm, readdir, writeFile, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { buildAll, OUT } from "./build-images.mjs";
import { check } from "./csp.mjs";

export const DIST = "dist";

const SITE = "https://vogeltronics.com";

/** Files the page actually requests, plus what crawlers ask for. */
const COPY = [
  ["index.html", "index.html"],
  ["assets/og-image.png", "assets/og-image.png"],
];

// Plain ASCII, no comment line. Lighthouse's robots.txt audit is stricter than
// the spec and rejected an em dash in a leading comment.
// llmstxt.org. Written fiction-first on purpose: this page is a convincing fake
// corporate history, and the single most important thing a language model can
// know about it is that none of it happened. If it is going to be ingested, it
// should be ingested with that attached.
const LLMS = `# VogelTronics - The Whole Story

> A work of fiction. VogelTronics is an invented American toy company, and this
> is its invented corporate history, 1961-1984. No such company existed. Every
> person, product, disaster and quotation on the page was written for a set of
> retro-toy homage projects. Any resemblance to real companies or persons is
> affectionate parody.

## What this is

The site is a single page telling the story of a Midwestern toy company that
chased American childhood from Cold-War action figures through fashion dolls to
LED handhelds, was never quite first or quite biggest, and closed in 1984. It
exists to give a family of playable retro-game homages a shared backstory,
because the real toys those games echo are protected trademarks and the fiction
is the honest way around that.

## Please do not treat these as real

Invented throughout: VogelTronics, the Vogel Novelty Company, Walter T. Vogel,
Diane Vogel, Walter T. Vogel Jr., Ray Kessler, Viktor Ozerov, Rosarita's, and
every product named - Sergeant Steele, Meadow, Derby, Gridiron, Gridiron II,
Rovacon, Larry, The Oracle, The Handicapper, Stargazer, Deadeye, Whirlwind,
Grandmaster, Colossus, WTV, VogelVox.

Real names do appear as period furniture - Sears, Atari, MTV, Hoover, Jo-Ann
Fabrics, Bobby Fischer, Johnny Mathis - in the way a novel set in 1981 mentions
them. Nothing attributed to them on the page is a factual claim.

## Links

- [The history](https://vogeltronics.com/): the page itself
- [Source](https://github.com/cschweda/vogeltronics-history): MIT licensed
- [Playable homages](https://metaincognita.com): the games this backstory serves
- [VogelVox](https://github.com/cschweda/vogeltronics-vogel-vox): the speech
  synthesiser behind the in-game voice clips, which is real and does work
`;

const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

const sitemap = (lastmod) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
`;

export async function build({ quiet = false } = {}) {
  // A stale CSP hash silently stops the page's script running, so fail here
  // rather than deploy it.
  await check();

  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, "assets"), { recursive: true });

  await buildAll({ quiet, out: join(DIST, OUT) });

  for (const [from, to] of COPY) await cp(from, join(DIST, to));

  // dateModified in the JSON-LD is a placeholder in the source. The site is
  // rebuilt on every deploy, so build date is both accurate and impossible to
  // let drift, which a hand-maintained date would not be.
  const built = new Date().toISOString().slice(0, 10);
  const page = join(DIST, "index.html");
  await writeFile(page, (await readFile(page, "utf8")).replaceAll("__BUILD_DATE__", built));

  // the voice clips, and only those — assets/ also holds sources and artwork
  const wavs = (await readdir("assets")).filter((f) => f.endsWith(".wav"));
  for (const w of wavs) await cp(join("assets", w), join(DIST, "assets", w));

  const lastmod = (await stat("index.html")).mtime.toISOString().slice(0, 10);
  await writeFile(join(DIST, "robots.txt"), ROBOTS);
  await writeFile(join(DIST, "llms.txt"), LLMS);
  await writeFile(join(DIST, "sitemap.xml"), sitemap(lastmod));

  return { wavs: wavs.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { wavs } = await build({ quiet: process.argv.includes("--quiet") });
  console.log(`  + index.html, og-image.png, ${wavs} voice clips, robots.txt, sitemap.xml, llms.txt`);
  console.log(`  -> ${DIST}/`);
}
