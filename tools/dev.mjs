#!/usr/bin/env node
/**
 * Dev server: build the images, serve the repo root, reload on change.
 *
 * There is no HMR and there is nothing here for it to do. HMR swaps JS modules
 * in place; this page has no modules, no imports, and all of its CSS lives in
 * one <style> block inside index.html — so any edit is a full reload whatever
 * tooling sits in front of it. Live reload is the honest version of the same
 * convenience.
 *
 * No dependencies. It is a static file server plus about ten lines of
 * server-sent events, which is the whole of what this page needs; a bundler or
 * a browser-sync install would be several hundred packages to reload one file.
 *
 * Watches:
 *   index.html       reload
 *   assets/img-src/  re-encode just the file that changed, then reload
 *
 * Usage:  npm run dev            → http://localhost:3000
 *         PORT=4000 npm run dev  → pick your own; if it's taken, the next
 *                                  free port up is used
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { buildAll, buildOne, isImage, SRC } from "./build-images.mjs";

const ROOT = resolve(".");
const START_PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

// Injected before </body>. Reconnects on its own if the server restarts.
const RELOAD = `
<script>
(function(){
  var es = new EventSource("/__reload");
  es.onmessage = function(){ location.reload(); };
  es.onerror = function(){ es.close(); setTimeout(function(){ location.reload(); }, 1000); };
})();
</script>
`;

const clients = new Set();
const reloadAll = () => {
  for (const res of clients) res.write("data: reload\n\n");
};

console.log("building images…");
await buildAll({ quiet: true });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("retry: 500\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  // resolve inside ROOT only — no traversal out of the repo
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = join(ROOT, normalize(rel));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }

  try {
    if ((await stat(file)).isDirectory()) throw new Error("dir");
    const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
    let body = await readFile(file);
    if (type.startsWith("text/html")) {
      body = Buffer.from(String(body).replace(/<\/body>/i, RELOAD + "</body>"));
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end(`404 ${rel}`);
  }
});

// If the requested port is busy, walk up rather than dying.
let port = START_PORT;
server.on("error", (err) => {
  if (err.code === "EADDRINUSE" && port < START_PORT + 20) {
    console.log(`  port ${port} busy, trying ${port + 1}`);
    server.listen(++port);
  } else {
    throw err;
  }
});
server.listen(port, () => {
  console.log(`\n  http://localhost:${port}`);
  console.log(`  watching index.html and ${SRC}/ — live reload on\n`);
});

// --------------------------------------------------------------- watchers
watch("index.html", () => reloadAll());

// fs.watch fires more than once per write on macOS; collapse bursts per file
const pending = new Map();
watch(SRC, (_event, filename) => {
  if (!filename || !isImage(filename)) return;
  clearTimeout(pending.get(filename));
  pending.set(
    filename,
    setTimeout(async () => {
      pending.delete(filename);
      try {
        const r = await buildOne(filename);
        const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
        console.log(
          `  rebuilt ${r.name}.webp  ${r.width}x${r.height}  ${kb(r.before)} -> ${kb(r.after)}`
        );
        reloadAll();
      } catch (err) {
        // a half-written file mid-copy is normal; the next event catches it
        console.warn(`  skipped ${filename}: ${err.message}`);
      }
    }, 250)
  );
});
