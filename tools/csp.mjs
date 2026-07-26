#!/usr/bin/env node
/**
 * The Content-Security-Policy, in one place, plus the check that keeps it
 * honest.
 *
 * The page has exactly one inline <script> and no on*= handlers anywhere, so
 * script-src can be a bare SHA-256 hash — no 'unsafe-inline', no nonce, no
 * server. That is the directive that actually matters.
 *
 * style-src has to keep 'unsafe-inline' because the markup carries 29
 * style="" attributes, which a hash cannot cover. That is a much smaller
 * concession than it looks: a style attribute cannot execute anything, and
 * the usual CSS exfiltration trick needs to reach the network, which
 * connect-src 'none' and img-src 'self' data: between them prevent.
 *
 * Everything else is off. The page loads no fonts (system stacks only), makes
 * no requests (no fetch, XHR, EventSource or WebSocket anywhere in it), embeds
 * nothing, and submits nothing. The external URLs in the document are all
 * <a href> navigations, which CSP does not gate.
 *
 * The hash is the fragile part: change one byte of the inline script and the
 * browser silently refuses to run it. So `npm run build` verifies it, which
 * means a mismatch fails the Netlify deploy and Netlify keeps serving the last
 * good build. Loud, and safe.
 */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

/** SHA-256 of every inline <script> body in a document, CSP-formatted. */
export function scriptHashes(html) {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`
  );
}

/** The policy. `extra` adds script hashes — the dev server needs its own. */
export function csp(hashes, extra = []) {
  return [
    "default-src 'none'",
    `script-src ${[...hashes, ...extra].join(" ")}`,
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'none'",
    "font-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Verify netlify.toml's policy still matches index.html. Throws if not. */
export async function check() {
  const html = await readFile("index.html", "utf8");
  const toml = await readFile("netlify.toml", "utf8");
  const want = scriptHashes(html);

  if (want.length !== 1) {
    throw new Error(
      `expected exactly 1 inline <script> in index.html, found ${want.length} — ` +
        `update tools/csp.mjs if that is deliberate`
    );
  }
  if (/\son[a-z]+=["']/i.test(html)) {
    throw new Error(
      "index.html has an inline event handler (onclick=...). CSP blocks those " +
        "under a hash-based script-src — move it into the <script> block."
    );
  }
  if (!toml.includes(want[0])) {
    throw new Error(
      `netlify.toml's script-src hash is stale.\n\n  expected: ${want[0]}\n\n` +
        `The inline <script> in index.html changed. Put that hash in the\n` +
        `Content-Security-Policy in netlify.toml and rebuild.`
    );
  }
  return want[0];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--print")) {
    const html = await readFile("index.html", "utf8");
    console.log(csp(scriptHashes(html)));
  } else {
    console.log(`  CSP script hash OK  ${await check()}`);
  }
}
