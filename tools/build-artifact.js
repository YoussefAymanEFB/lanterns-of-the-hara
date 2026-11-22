#!/usr/bin/env node
/*
  Makes artifact.html from index.html for the shareable claude.ai prototype link.
    node tools/build-artifact.js
  The artifact host adds its own <html>, <head>, <body>, charset and viewport,
  so those are removed here. Everything else (css/, js/, episodes/) is published as-is.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const TITLE = "عم صابر";

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html
  .replace(/<!doctype html>\s*/i, "")
  .replace(/<\/?html[^>]*>\s*/gi, "")
  .replace(/<\/?head>\s*/gi, "")
  .replace(/<\/?body[^>]*>\s*/gi, "")
  .replace(/<meta charset[^>]*>\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "")
  .replace(/<title>[^<]*<\/title>/i, `<title>${TITLE}</title>`);

fs.writeFileSync(path.join(root, "artifact.html"), html);
console.log("Wrote artifact.html");
