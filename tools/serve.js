#!/usr/bin/env node
/*
  Tiny local web server for testing the game in a browser or on a phone on the same Wi-Fi.
    node tools/serve.js            -> http://localhost:5173
    PORT=8080 node tools/serve.js
  No dependencies.
*/
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".woff2": "font/woff2"
};

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`Lanterns of the Hara running at http://localhost:${port}`);
  // Addresses a phone on the same Wi-Fi can use (skips virtual adapters such as WSL and Hyper-V).
  const nets = require("os").networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (/vEthernet|WSL|Hyper-V|VirtualBox|VMware|Loopback/i.test(name)) continue;
    for (const n of nets[name] || []) {
      if (n.family === "IPv4" && !n.internal && !n.address.startsWith("169.254.")) {
        console.log(`On your phone (same Wi-Fi, ${name}): http://${n.address}:${port}`);
      }
    }
  }
});
