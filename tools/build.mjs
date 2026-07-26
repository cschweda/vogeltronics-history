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
import { cp, mkdir, rm, readdir, writeFile, stat } from "node:fs/promises";
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

  // the voice clips, and only those — assets/ also holds sources and artwork
  const wavs = (await readdir("assets")).filter((f) => f.endsWith(".wav"));
  for (const w of wavs) await cp(join("assets", w), join(DIST, "assets", w));

  const lastmod = (await stat("index.html")).mtime.toISOString().slice(0, 10);
  await writeFile(join(DIST, "robots.txt"), ROBOTS);
  await writeFile(join(DIST, "sitemap.xml"), sitemap(lastmod));

  return { wavs: wavs.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { wavs } = await build({ quiet: process.argv.includes("--quiet") });
  console.log(`  + index.html, og-image.png, ${wavs} voice clips, robots.txt, sitemap.xml`);
  console.log(`  -> ${DIST}/`);
}
