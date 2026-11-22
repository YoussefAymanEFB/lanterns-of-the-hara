/*
  The hara, drawn in code.
  ------------------------------------------------------------
  Every place is composed from a small kit (buildings, shops, lanterns, khayameya, people
  drawn like shadow-play figures). Time of day changes the sky and tints the whole street,
  while lit windows, lanterns and shop interiors stay bright on top of the tint.

  HARA.art.scene(place, time, show)  -> <svg> for a story scene
  HARA.art.hub(litFn, todayIndex)    -> <svg> for the hara overview with 30 lanterns
  HARA.art.places                    -> { id: { name } } (used for the place label)

  These drawings are placeholders for the final illustrated art; the engine only needs
  a function that returns an <svg> (or <img>) per place and time.
*/
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var W = 400, H = 460, G = 404;
  var UID = 0;

  function E(tag, a, parent) {
    var el = document.createElementNS(NS, tag);
    if (a) for (var k in a) if (a[k] != null) el.setAttribute(k, a[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  function rng(seed) {
    var s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))); }
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  function q(p0, pc, p1, t) { // quadratic bezier point
    var u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * pc[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * pc[1] + t * t * p1[1]];
  }

  var C = {
    walls: ["#E3CBA2", "#D5B58A", "#C99F78", "#EAD8B8", "#C9A6A0", "#B3C2BA", "#D9C2A7"],
    stone: "#E6D5B8", ablaq: "#B86E52",
    trim: "#8E6A4C", shutter: "#5E7F7A", shutterDark: "#3F5C58", win: "#4A3A33",
    door: "#6B4A33", ground: "#A88A6C", curb: "#8C7158", far: "#CDB6A0",
    brass: "#C08A2E", lit: "#FFC75E", cream: "#F1E3C6", copper: "#B8733A", wood: "#7A5238",
    glass: ["#A2344A", "#2E7D5B", "#2F5DA8", "#C07A1E"],
    kh: ["#C8432F", "#2F5DA8", "#E2A43A", "#3F8A4E"]
  };

  var TIMES = {
    asr:     { sky: ["#7FB0D8", "#C4DAE4", "#F0D9AA"], tint: null,             lit: 0,    lanterns: false, body: "sun",    ink: "#2B1E31", stars: false },
    pre:     { sky: ["#46438A", "#C27A8E", "#F5AE66"], tint: ["#E07F98", 0.30], lit: 0.12, lanterns: false, body: "lowsun", ink: "#24172C", stars: false },
    maghrib: { sky: ["#141238", "#553872", "#D97E58"], tint: ["#3E2C78", 0.58], lit: 0.45, lanterns: true,  body: "moon",   ink: "#130D22", stars: true },
    night:   { sky: ["#05041A", "#120F38", "#261C4C"], tint: ["#1C1856", 0.74], lit: 0.55, lanterns: true,  body: "moon",   ink: "#0A0818", stars: true }
  };

  /* ---------------- context ---------------- */
  function makeCtx(svg, time, seed, show) {
    var id = ++UID, P = TIMES[time] || TIMES.asr, defs = E("defs", null, svg);

    var sky = E("linearGradient", { id: "sky" + id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    P.sky.forEach(function (col, i) { E("stop", { offset: i / (P.sky.length - 1), "stop-color": col }, sky); });

    function radial(name, color, op) {
      var g = E("radialGradient", { id: name + id }, defs);
      E("stop", { offset: 0, "stop-color": color, "stop-opacity": op }, g);
      E("stop", { offset: 1, "stop-color": color, "stop-opacity": 0 }, g);
    }
    radial("glow", "#FFC75E", 0.85);
    radial("warm", "#FFF1D0", 0.9);
    radial("cool", "#D8F7FF", 0.9);
    radial("fire", "#FF7A2E", 0.95);
    radial("green", "#7CFF9A", 0.9);

    var kh = E("pattern", { id: "kh" + id, width: 24, height: 18, patternUnits: "userSpaceOnUse" }, defs);
    E("rect", { width: 24, height: 18, fill: "#B8392B" }, kh);
    E("path", { d: "M0 18 L6 6 L12 18 Z", fill: "#E2A43A" }, kh);
    E("path", { d: "M12 18 L18 6 L24 18 Z", fill: "#2F5DA8" }, kh);
    E("path", { d: "M12 0 L15 3 L12 6 L9 3 Z", fill: "#F1E3C6" }, kh);
    E("rect", { width: 24, height: 1.5, fill: "#1E3E78" }, kh);

    var sh = E("pattern", { id: "sh" + id, width: 10, height: 8, patternUnits: "userSpaceOnUse" }, defs);
    E("rect", { width: 10, height: 8, fill: "#8A8794" }, sh);
    E("rect", { y: 6, width: 10, height: 2, fill: "#66637A" }, sh);

    var rl = E("pattern", { id: "rl" + id, width: 8, height: 14, patternUnits: "userSpaceOnUse" }, defs);
    E("rect", { x: 3, width: 2, height: 14, fill: "#4E4038" }, rl);

    if (P.tint) {
      var f = E("filter", { id: "tint" + id, x: -40, y: -40, width: W + 80, height: H + 80, filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" }, defs);
      E("feFlood", { "flood-color": P.tint[0], result: "fl" }, f);
      E("feBlend", { "in": "SourceGraphic", in2: "fl", mode: "multiply", result: "mu" }, f);
      E("feComposite", { "in": "mu", in2: "SourceGraphic", operator: "in", result: "cl" }, f);
      E("feComposite", { "in": "cl", in2: "SourceGraphic", operator: "arithmetic", k1: 0, k2: P.tint[1], k3: 1 - P.tint[1], k4: 0 }, f);
    }

    var skyG = E("g", null, svg);
    var scene = E("g", P.tint ? { filter: "url(#tint" + id + ")" } : null, svg);
    var c = {
      id: id, P: P, time: time, defs: defs, sky: skyG,
      far: E("g", null, scene), mid: E("g", null, scene), front: E("g", null, scene),
      back: E("g", null, svg), actors: E("g", null, svg), lights: E("g", null, svg),
      r: rng(seed || 7), show: show || []
    };
    c.has = function (n) { return c.show.indexOf(n) > -1; };
    return c;
  }

  /* ---------------- kit ---------------- */
  function text(g, x, y, str, size, fill) {
    var t = E("text", { x: x, y: y, "text-anchor": "middle", "font-family": "'Aref Ruqaa', 'Amiri', serif", "font-size": size, "font-weight": 700, fill: fill, direction: "rtl" }, g);
    t.textContent = str;
    return t;
  }

  function skyAndBody(c) {
    E("rect", { x: -60, y: -60, width: W + 120, height: H + 120, fill: "url(#sky" + c.id + ")" }, c.sky);
    var b = c.P.body;
    if (b === "sun") {
      E("circle", { cx: 322, cy: 92, r: 46, fill: "#FFF6DA", opacity: 0.35 }, c.sky);
      E("circle", { cx: 322, cy: 92, r: 22, fill: "#FFF4D6" }, c.sky);
    } else if (b === "lowsun") {
      E("circle", { cx: 300, cy: 262, r: 80, fill: "#FFC98A", opacity: 0.3 }, c.sky);
      E("circle", { cx: 300, cy: 262, r: 38, fill: "#FFB866" }, c.sky);
    } else if (b === "moon") {
      var my = c.moonY || 70;
      var m = E("mask", { id: "moon" + c.id }, c.defs);
      E("rect", { x: 0, y: 0, width: W, height: H, fill: "#000" }, m);
      E("circle", { cx: 318, cy: my, r: 15, fill: "#fff" }, m);
      E("circle", { cx: 325, cy: my - 6, r: 13, fill: "#000" }, m);
      E("circle", { cx: 318, cy: my, r: 30, fill: "#F6E7C1", opacity: 0.08 }, c.sky);
      E("circle", { cx: 318, cy: my, r: 15, fill: "#F6E7C1", mask: "url(#moon" + c.id + ")" }, c.sky);
    }
    if (c.P.stars) {
      var r = rng(31);
      for (var i = 0; i < 34; i++) {
        var s = E("circle", { cx: (r() * W).toFixed(1), cy: (r() * 230).toFixed(1), r: (0.5 + r() * 1).toFixed(2), fill: "#F6E7C1", "class": "twinkle" }, c.sky);
        s.style.animationDelay = (r() * 3).toFixed(2) + "s";
      }
    }
  }

  function ground(c) {
    E("rect", { x: -40, y: G, width: W + 80, height: H - G + 40, fill: C.ground }, c.mid);
    E("rect", { x: -40, y: G, width: W + 80, height: 4, fill: C.curb }, c.mid);
    for (var x = -20; x < W + 40; x += 46) E("rect", { x: x, y: G + 4, width: 1.5, height: H - G, fill: shade(C.ground, -0.12) }, c.mid);
  }

  function minaret(c, x, top, base, s, g, col, lightsOn) {
    var w = 16 * s;
    E("rect", { x: x - w / 2, y: top, width: w, height: base - top, fill: col }, g);
    [0.32, 0.62].forEach(function (k) {
      var y = top + (base - top) * k;
      E("rect", { x: x - w / 2 - 5 * s, y: y, width: w + 10 * s, height: 5 * s, fill: shade(col, -0.12) }, g);
      if (lightsOn) for (var i = 0; i < 5; i++) {
        E("circle", { cx: x - w / 2 - 3 * s + i * (w + 6 * s) / 4, cy: y - 1.5 * s, r: 1.8 * s, fill: "#8DFFAA", "class": "flicker" }, c.lights);
      }
    });
    E("path", { d: "M" + (x - w / 2) + " " + top + " L" + x + " " + (top - 30 * s) + " L" + (x + w / 2) + " " + top + " Z", fill: col }, g);
    E("circle", { cx: x, cy: top - 34 * s, r: 3 * s, fill: "#E2A43A" }, g);
    if (lightsOn) E("circle", { cx: x, cy: top + (base - top) * 0.32, r: 26 * s, fill: "url(#green" + c.id + ")", opacity: 0.35 }, c.lights);
  }

  function dome(c, cx, base, r, g, col) {
    E("path", { d: "M" + (cx - r) + " " + base + " A" + r + " " + (r * 0.92) + " 0 0 1 " + (cx + r) + " " + base + " Z", fill: col }, g);
    E("rect", { x: cx - 1.5, y: base - r * 0.92 - 12, width: 3, height: 12, fill: col }, g);
    E("circle", { cx: cx, cy: base - r * 0.92 - 15, r: 3, fill: "#E2A43A" }, g);
  }

  function farSkyline(c, base, minaretX) {
    var r = c.r, x = -30, col = c.time === "asr" ? C.far : shade(C.far, -0.08);
    while (x < W + 30) {
      var w = 28 + r() * 46, h = 26 + r() * 72;
      E("rect", { x: x, y: base - h, width: w + 1, height: h + 80, fill: col }, c.far);
      if (r() < 0.35) E("rect", { x: x + w * 0.3, y: base - h - 7, width: 7, height: 7, fill: col }, c.far);
      x += w;
    }
    if (minaretX != null) minaret(c, minaretX, base - 150, base, 0.7, c.far, col, c.P.lanterns);
  }

  function win(c, x, y, w, h) {
    var lit = c.r() < c.P.lit;
    E("rect", { x: x - 3, y: y - 3, width: w + 6, height: h + 5, fill: C.trim }, c.mid);
    E("path", { d: "M" + (x - 4) + " " + (y - 3) + " Q" + (x + w / 2) + " " + (y - 12) + " " + (x + w + 4) + " " + (y - 3) + " Z", fill: C.trim }, c.mid);
    if (lit) {
      E("rect", { x: x - 12, y: y - 12, width: w + 24, height: h + 24, fill: "url(#glow" + c.id + ")", opacity: 0.5 }, c.back);
      E("rect", { x: x, y: y, width: w, height: h, fill: C.lit }, c.back);
      E("rect", { x: x + w / 2 - 0.6, y: y, width: 1.2, height: h, fill: "#B9773A" }, c.back);
    } else if (c.r() < 0.6) {
      E("rect", { x: x, y: y, width: w, height: h, fill: C.shutter }, c.mid);
      for (var i = 1; i < 6; i++) E("rect", { x: x, y: y + i * h / 6, width: w, height: 1, fill: C.shutterDark }, c.mid);
      E("rect", { x: x + w / 2 - 0.6, y: y, width: 1.2, height: h, fill: C.shutterDark }, c.mid);
    } else {
      E("rect", { x: x, y: y, width: w, height: h, fill: C.win }, c.mid);
    }
  }

  function balcony(c, x, y, w, g) {
    E("rect", { x: x, y: y - 15, width: w, height: 15, fill: "url(#rl" + c.id + ")" }, g);
    E("rect", { x: x, y: y - 16, width: w, height: 2.5, fill: "#4E4038" }, g);
    E("rect", { x: x - 3, y: y, width: w + 6, height: 4, fill: "#9C8574" }, g);
    if (c.r() < 0.6) {
      var px = x + 10 + c.r() * (w - 30);
      E("rect", { x: px, y: y - 10, width: 9, height: 10, fill: "#A65A3A" }, g);
      E("circle", { cx: px + 4.5, cy: y - 14, r: 7, fill: "#4F7E4A" }, g);
    }
  }

  function dish(c, x, y, g) {
    E("rect", { x: x - 1, y: y - 14, width: 2, height: 14, fill: "#777" }, g);
    E("ellipse", { cx: x, cy: y - 18, rx: 10, ry: 5, fill: "#D8D8D2", transform: "rotate(-20 " + x + " " + (y - 18) + ")" }, g);
  }

  function tank(c, x, y, g) {
    E("rect", { x: x - 12, y: y - 26, width: 24, height: 26, fill: "#8FA3A8" }, g);
    E("ellipse", { cx: x, cy: y - 26, rx: 12, ry: 3.5, fill: "#A9BCC0" }, g);
  }

  function building(c, o) {
    var g = c[o.layer || "mid"], base = o.base || G, col = o.color;
    E("rect", { x: o.x, y: o.top, width: o.w, height: base - o.top + 2, fill: col }, g);
    E("rect", { x: o.x - 3, y: o.top - 4, width: o.w + 6, height: 7, fill: shade(col, -0.22) }, g);
    var fh = o.fh || 64, cols = o.cols || Math.max(1, Math.round(o.w / 62)), cw = o.w / cols;
    var stop = o.stop || base - 20, floors = [];
    for (var y = o.top + 20; y + 34 < stop; y += fh) {
      floors.push(y);
      if (floors.length > 1) E("rect", { x: o.x, y: y - 14, width: o.w, height: 2, fill: shade(col, -0.1) }, g);
      for (var k = 0; k < cols; k++) win(c, o.x + k * cw + cw / 2 - 10, y, 20, 32);
    }
    (o.balconies || []).forEach(function (fi) { if (floors[fi] != null) balcony(c, o.x + 8, floors[fi] + 36, o.w - 16, g); });
    if (o.dish) dish(c, o.x + o.w * 0.72, o.top - 4, g);
    if (o.tank) tank(c, o.x + o.w * 0.25, o.top - 4, g);
    return { floors: floors };
  }

  function door(c, x, w, h) {
    var top = G - h, r = w / 2;
    E("path", { d: "M" + (x - 6) + " " + G + " V" + (top + r) + " A" + (r + 6) + " " + (r + 6) + " 0 0 1 " + (x + w + 6) + " " + (top + r) + " V" + G + " Z", fill: shade(C.walls[0], -0.25) }, c.mid);
    E("path", { d: "M" + x + " " + G + " V" + (top + r) + " A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (top + r) + " V" + G + " Z", fill: C.door }, c.mid);
    E("rect", { x: x + w / 2 - 1, y: top + r, width: 2, height: h - r, fill: shade(C.door, -0.3) }, c.mid);
    E("path", { d: "M" + (x + 6) + " " + (top + r) + " A" + (r - 6) + " " + (r - 6) + " 0 0 1 " + (x + w - 6) + " " + (top + r) + " Z", fill: c.P.lanterns ? "#FFC75E" : "#3B2C24" }, c.P.lanterns ? c.back : c.mid);
  }

  function shop(c, o) {
    var top = G - o.h;
    E("rect", { x: o.x - 8, y: top - 36, width: o.w + 16, height: o.h + 36, fill: o.wall || "#9C8064" }, c.mid);
    E("rect", { x: o.x, y: top - 32, width: o.w, height: 26, rx: 2, fill: o.signBg || "#2E6A4E" }, c.mid);
    if (o.sign) text(c.mid, o.x + o.w / 2, top - 12, o.sign, o.signSize || 18, o.signInk || C.cream);
    if (o.state === "shut") {
      E("rect", { x: o.x, y: top, width: o.w, height: o.h, fill: "url(#sh" + c.id + ")" }, c.mid);
      E("rect", { x: o.x, y: G - 8, width: o.w, height: 4, fill: "#55526A" }, c.mid);
    } else {
      E("rect", { x: o.x, y: top, width: o.w, height: o.h, fill: o.interior || "#F0B46A" }, c.back);
      E("ellipse", { cx: o.x + o.w / 2, cy: top + o.h * 0.4, rx: o.w * 0.55, ry: o.h * 0.6, fill: "url(#warm" + c.id + ")", opacity: 0.55 }, c.back);
    }
    return top;
  }

  function steps(c, x, w, n) {
    for (var i = 0; i < n; i++) {
      var y = G - (n - i) * 9, col = shade("#A3958A", -i * 0.07);
      E("rect", { x: x - i * 6, y: y, width: w + i * 12, height: 9, fill: col }, c.mid);
      E("rect", { x: x - i * 6, y: y, width: w + i * 12, height: 1.5, fill: shade(col, 0.25) }, c.mid);
    }
    return G - n * 9;
  }

  var LAN_FRAME =
    '<circle cx="0" cy="-36" r="3" fill="none" stroke-width="1.6"/>' +
    '<path d="M-9 -26 L0 -33.5 L9 -26 Z" stroke="none"/>' +
    '<rect x="-11.5" y="-26" width="23" height="4" rx="1" stroke="none"/>' +
    '<path d="M-10.5 -22 H10.5 L14 -2 L10.5 17 H-10.5 L-14 -2 Z" fill="none" stroke-width="1.6"/>' +
    '<path d="M0 -22 V17 M-14 -2 H14 M-10.5 -22 L-6 -2 L-10.5 17 M10.5 -22 L6 -2 L10.5 17" fill="none" stroke-width="1.1"/>' +
    '<rect x="-11.5" y="17" width="23" height="4" rx="1" stroke="none"/>' +
    '<path d="M-8 21 H8 L0 32 Z" stroke="none"/>';
  var LAN_GLASS = "M-10.5 -22 H10.5 L14 -2 L10.5 17 H-10.5 L-14 -2 Z";

  // (x, y) is the hanging point at the top ring.
  function lantern(c, x, y, s, lit, parent, glassIdx, cls) {
    // outer group positions the lantern; the inner group carries any CSS animation (sway, pulse)
    var outer = E("g", { transform: "translate(" + x + " " + (y + 36 * s) + ") scale(" + s + ")" }, parent || (lit ? c.lights : c.mid));
    var g = E("g", cls ? { "class": cls } : null, outer);
    if (lit) E("circle", { cx: 0, cy: -2, r: 46, fill: "url(#glow" + c.id + ")", opacity: 0.75, "class": "flicker" }, g);
    E("path", { d: LAN_GLASS, fill: lit ? C.lit : C.glass[(glassIdx || 0) % 4], opacity: lit ? 1 : 0.9 }, g);
    var fr = E("g", { fill: C.brass, stroke: C.brass }, g);
    fr.innerHTML = LAN_FRAME;
    return outer;
  }

  function lanternString(c, x1, y1, x2, y2, sag, n, o) {
    o = o || {};
    var p0 = [x1, y1], p1 = [x2, y2], pc = [(x1 + x2) / 2, (y1 + y2) / 2 + sag * 2];
    E("path", { d: "M" + x1 + " " + y1 + " Q" + pc[0] + " " + pc[1] + " " + x2 + " " + y2, fill: "none", stroke: "#3B302C", "stroke-width": 1.2, opacity: 0.8 }, c.mid);
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = (i + 1) / (n + 1), p = q(p0, pc, p1, t);
      var lit = o.litFn ? o.litFn(i) : c.P.lanterns;
      E("line", { x1: p[0], y1: p[1], x2: p[0], y2: p[1] + 6, stroke: "#3B302C", "stroke-width": 1 }, lit ? c.lights : c.mid);
      out.push(lantern(c, p[0], p[1] + 5, o.s || 0.5, lit, null, i, o.clsFn ? o.clsFn(i) : "sway"));
    }
    return out;
  }

  function bunting(c, x1, y1, x2, y2, sag, size) {
    var p0 = [x1, y1], p1 = [x2, y2], pc = [(x1 + x2) / 2, (y1 + y2) / 2 + sag * 2];
    E("path", { d: "M" + x1 + " " + y1 + " Q" + pc[0] + " " + pc[1] + " " + x2 + " " + y2, fill: "none", stroke: "#3B302C", "stroke-width": 1 }, c.mid);
    var len = Math.abs(x2 - x1), steps = Math.floor(len / (size * 1.6)), k = 0;
    for (var i = 0; i < steps; i++) {
      var a = q(p0, pc, p1, i / steps), b = q(p0, pc, p1, (i + 0.7) / steps);
      E("path", { d: "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + " L" + b[0].toFixed(1) + " " + b[1].toFixed(1) + " L" + ((a[0] + b[0]) / 2).toFixed(1) + " " + ((a[1] + b[1]) / 2 + size).toFixed(1) + " Z", fill: C.kh[k++ % 4] }, c.mid);
    }
  }

  function tent(c, x, w, top, h) {
    E("rect", { x: x, y: top, width: w, height: h, fill: "url(#kh" + c.id + ")" }, c.mid);
    for (var fx = x, i = 0; fx < x + w; fx += 12, i++) {
      E("path", { d: "M" + fx + " " + (top + h) + " L" + (fx + 12) + " " + (top + h) + " L" + (fx + 6) + " " + (top + h + 8) + " Z", fill: C.kh[i % 4] }, c.mid);
    }
    [x + 4, x + w - 7].forEach(function (px) { E("rect", { x: px, y: top + h, width: 3, height: G - top - h, fill: "#5A4636" }, c.mid); });
  }

  function tableCloth(c, x, w, y) {
    E("rect", { x: x, y: y, width: w, height: 8, fill: "#EFE7D8" }, c.mid);
    E("rect", { x: x, y: y + 8, width: w, height: G - y - 8, fill: "#D9CFBD" }, c.mid);
    for (var fx = x + 14; fx < x + w; fx += 22) E("rect", { x: fx, y: y + 10, width: 1.2, height: G - y - 12, fill: "#C6BBA6" }, c.mid);
  }

  /* ---------------- people (shadow-play figures) ---------------- */
  var FIG = {
    man: '<circle cx="0" cy="-91" r="8.5"/><path d="M-10 -80 Q0 -84 10 -80 L14 -46 L17 0 L-17 0 L-14 -46 Z"/>',
    old: '<circle cx="5" cy="-87" r="8"/><path d="M-6 -77 Q4 -81 12 -74 L15 -44 L16 0 L-15 0 L-12 -44 Z"/><path d="M18 -50 L24 0" stroke-width="2.4" fill="none"/>',
    woman: '<path d="M0 -101 C-10 -101 -12 -90 -11 -82 C-15 -76 -16 -60 -17 -40 L-19 0 L19 0 L17 -40 C16 -60 15 -76 11 -82 C12 -90 10 -101 0 -101 Z"/>',
    sit: '<circle cx="-1" cy="-50" r="8"/><path d="M-12 -41 Q-3 -45 7 -40 L10 -22 L10 -6 L27 -6 L29 24 L20 24 L19 4 L-14 4 L-14 -20 Z"/><path d="M5 -34 L23 -14 L19 -10 L1 -28 Z"/>',
    bust: '<circle cx="0" cy="-30" r="8"/><path d="M-15 0 L-15 -11 Q0 -22 15 -11 L15 0 Z"/>',
    bustW: '<path d="M0 -41 C-9 -41 -11 -32 -10 -25 C-14 -21 -17 -12 -17 0 L17 0 C17 -12 14 -21 10 -25 C11 -32 9 -41 0 -41 Z"/>',
    cat: '<path d="M0 0 C-3 -10 -2 -18 2 -22 L1 -30 L6 -25 L10 -25 L14 -30 L13 -22 C17 -17 17 -8 15 0 Z"/><path d="M15 -2 C24 -2 27 -8 24 -14" fill="none" stroke-width="2.2"/>'
  };

  function person(c, kind, x, base, s, o) {
    o = o || {};
    var outer = E("g", { transform: "translate(" + x + " " + base + ") scale(" + (o.flip ? -s : s) + " " + s + ")" }, c[o.layer || "actors"]);
    var g = E("g", { fill: c.P.ink, stroke: c.P.ink }, outer);
    if (o.cls) g.setAttribute("class", o.cls);
    g.innerHTML = FIG[kind];
    if (o.cap) E("path", { d: kind === "sit" ? "M-9 -55 Q-1 -64 7 -55 Z" : "M-8 -35 Q0 -44 8 -35 Z", fill: "#E9DEC8", stroke: "none" }, g);
    if (o.turban) E("ellipse", { cx: 0, cy: -98, rx: 10, ry: 5.5, fill: "#EFE3CA", stroke: "none" }, g);
    if (o.crate) {
      E("rect", { x: -26, y: -116, width: 52, height: 14, fill: C.wood, stroke: "none" }, g);
      [-16, 0, 16].forEach(function (dx) { E("ellipse", { cx: dx, cy: -118, rx: 9, ry: 3.5, fill: "#D9A262", stroke: "none" }, g); });
    }
    if (o.lantern) {
      E("path", { d: "M8 -60 L20 -44", "stroke-width": 3, fill: "none" }, g);
      lantern(c, 22, -46, 0.38, c.P.lanterns, g, o.glass || 0);
    }
    return outer;
  }

  function kids(c, x1, x2, s) {
    person(c, "man", x1, G + 2, s, { cls: "bob", lantern: true, glass: 0 });
    var k2 = person(c, "woman", x2, G + 2, s * 0.95, { cls: "bob", lantern: true, glass: 2, flip: true });
    k2.firstChild.style.animationDelay = "0.4s";
  }

  function diners(c, xs, y) {
    xs.forEach(function (x, i) {
      person(c, i % 3 === 1 ? "bustW" : "bust", x, y, 0.8 + (i % 2) * 0.08);
      E("ellipse", { cx: x, cy: y + 4, rx: 9, ry: 2.5, fill: "#F4EEE2" }, c.mid);
    });
  }

  function steam(c, x, y, n) {
    for (var i = 0; i < (n || 3); i++) {
      var s = E("circle", { cx: x + (i - 1) * 8, cy: y, r: 7 + i * 1.5, fill: "#FFFFFF", opacity: 0, "class": "steam" }, c.actors);
      s.style.animationDelay = (i * 0.9).toFixed(1) + "s";
    }
  }

  /* ---------------- places ---------------- */
  var PLACES = {
    home: {
      name: "البيت",
      draw: function (c) {
        farSkyline(c, 300, 352);
        building(c, { x: -40, w: 130, top: 118, color: C.walls[3], cols: 2 });
        building(c, { x: 310, w: 130, top: 96, color: C.walls[4], cols: 2, dish: true });
        var b = building(c, { x: 86, w: 228, top: 26, color: C.walls[0], cols: 3, balconies: [1, 2, 3], stop: G - 112, tank: true });
        door(c, 170, 60, 104);
        bunting(c, -10, 66, 410, 66, 24, 13);
        lanternString(c, 86, 150, 314, 150, 22, 5, { s: 0.55 });
        ground(c);
        if (c.has("nemat")) {
          var rail = b.floors[2] + 36 - 16;
          person(c, "bustW", 206, rail, 0.95);
          E("line", { x1: 220, y1: rail - 8, x2: 220, y2: 332, stroke: "#5B4A3D", "stroke-width": 1.3 }, c.actors);
          E("path", { d: "M208 332 H232 L228 350 H212 Z", fill: "#B98A4E" }, c.actors);
          E("path", { d: "M210 338 H230 M211 344 H229", stroke: "#8D6534", "stroke-width": 1 }, c.actors);
        }
      }
    },

    street: {
      name: "الشارع الكبير",
      draw: function (c) {
        farSkyline(c, 280, null);
        minaret(c, 132, 30, 196, 1, c.mid, C.stone, c.P.lanterns);
        dome(c, 66, 196, 50, c.mid, shade(C.stone, -0.06));
        E("rect", { x: -20, y: 190, width: 176, height: G - 188, fill: C.stone }, c.mid);
        for (var i = 0; i < 4; i++) E("rect", { x: -20, y: 196 + i * 12, width: 176, height: 6, fill: i % 2 ? C.stone : C.ablaq }, c.mid);
        door(c, 40, 52, 96);
        building(c, { x: 336, w: 90, top: 150, color: C.walls[2], cols: 1, stop: G - 120 });
        shop(c, { x: 344, w: 76, h: 104, state: "shut", signBg: "#6E8B7E" });
        var st = steps(c, 336, 84, 2);
        tent(c, 152, 184, 268, 22);
        tableCloth(c, 158, 172, 350);
        for (var x = 166; x < 326; x += 24) {
          E("rect", { x: x, y: 362, width: 14, height: 3, fill: "#5C4B3E" }, c.mid);
          E("rect", { x: x + 11, y: 344, width: 3, height: 20, fill: "#5C4B3E" }, c.mid);
          E("rect", { x: x + 1, y: 365, width: 2, height: G - 365, fill: "#5C4B3E" }, c.mid);
        }
        bunting(c, -10, 40, 410, 52, 20, 12);
        lanternString(c, 140, 120, 400, 150, 18, 5, { s: 0.5 });
        ground(c);
        person(c, "man", 190, G + 2, 0.92, {});
        E("rect", { x: 175, y: G - 106, width: 30, height: 18, fill: "#5C4B3E" }, c.actors);
        if (c.has("sheikh")) person(c, "man", 262, G + 2, 1, { turban: true, flip: true });
        if (c.has("saber_far")) person(c, "sit", 366, st + 1, 0.72, { cap: true, flip: true });
      }
    },

    alley: {
      name: "جوّه الحارة",
      draw: function (c) {
        building(c, { x: 116, w: 170, top: 156, color: C.walls[6], cols: 3, fh: 56, stop: G - 80 });
        shop(c, { x: 150, w: 100, h: 62, state: "shut", signBg: "#6E8B7E" });
        var st = steps(c, 150, 100, 1);
        building(c, { x: -50, w: 178, top: -20, color: C.walls[2], cols: 2, balconies: [1, 3] });
        building(c, { x: 272, w: 180, top: -10, color: C.walls[5], cols: 2, balconies: [2] });
        [[128, 118, 274, 104], [128, 214, 274, 226]].forEach(function (L, li) {
          E("line", { x1: L[0], y1: L[1], x2: L[2], y2: L[3], stroke: "#4E4038", "stroke-width": 1 }, c.mid);
          for (var i = 0; i < 6; i++) {
            var t = (i + 0.6) / 6.5, x = L[0] + (L[2] - L[0]) * t, y = L[1] + (L[3] - L[1]) * t;
            E("rect", { x: x - 7, y: y, width: 14, height: 16 + ((i + li) % 3) * 6, fill: [C.kh[0], C.cream, C.kh[1], C.kh[2], "#6E9C7B", "#E7C9C9"][(i + li * 2) % 6] }, c.mid);
          }
        });
        lanternString(c, 128, 160, 274, 160, 14, 1, { s: 1.25 });
        ground(c);
        if (c.has("saber_far")) person(c, "sit", 186, st + 1, 0.55, { cap: true });
        if (c.has("kids")) kids(c, 106, 296, 0.46);
      }
    },

    bakery: {
      name: "الفرن",
      draw: function (c) {
        building(c, { x: -30, w: 460, top: 18, color: C.walls[1], cols: 6, stop: G - 200 });
        var top = shop(c, { x: 24, w: 352, h: 164, sign: "فرن الحارة", signBg: "#2E6A4E", interior: "#E9A65C" });
        E("path", { d: "M160 " + (G - 58) + " V" + (G - 112) + " A40 40 0 0 1 240 " + (G - 112) + " V" + (G - 58) + " Z", fill: "#3A1E14" }, c.back);
        E("ellipse", { cx: 200, cy: G - 74, rx: 46, ry: 26, fill: "url(#fire" + c.id + ")", "class": "flicker" }, c.back);
        [[42, 140], [262, 360]].forEach(function (span) {
          for (var row = 0; row < 3; row++) for (var x = span[0]; x < span[1]; x += 21) {
            E("circle", { cx: x + 9, cy: top + 26 + row * 28, r: 9.5, fill: "#C98A4E" }, c.back);
            E("circle", { cx: x + 9, cy: top + 26 + row * 28, r: 5, fill: "#DDA76C" }, c.back);
          }
          E("rect", { x: span[0], y: top + 38, width: span[1] - span[0], height: 2, fill: "#7A5238" }, c.back);
          E("rect", { x: span[0], y: top + 66, width: span[1] - span[0], height: 2, fill: "#7A5238" }, c.back);
        });
        E("rect", { x: 24, y: G - 50, width: 352, height: 50, fill: "#8A6244" }, c.back);
        E("rect", { x: 24, y: G - 50, width: 352, height: 4, fill: "#A77B57" }, c.back);
        ground(c);
        person(c, "woman", 62, G + 2, 0.95);
        person(c, "man", 104, G + 2, 1);
        person(c, "man", 146, G + 2, 0.97, { flip: true });
        if (c.has("hassan")) person(c, "man", 318, G + 2, 1.05, { crate: true, flip: true });
      }
    },

    corner: {
      name: "الناصية",
      draw: function (c) {
        farSkyline(c, 300, 308);
        building(c, { x: 236, w: 200, top: 150, color: C.walls[5], cols: 3, stop: G - 130 });
        building(c, { x: -30, w: 270, top: 66, color: C.walls[2], cols: 4, stop: G - 150 });
        shop(c, { x: 8, w: 196, h: 118, state: "shut", sign: "بقالة البركة", signBg: "#6E8B7E", signInk: "#E9E0CC" });
        var st = steps(c, 4, 206, 3);
        tent(c, 236, 190, 282, 22);
        tableCloth(c, 244, 170, 352);
        E("line", { x1: 214, y1: 196, x2: 236, y2: 196, stroke: "#3B302C", "stroke-width": 2 }, c.mid);
        E("line", { x1: 232, y1: 196, x2: 232, y2: 204, stroke: "#3B302C", "stroke-width": 1.2 }, c.mid);
        lantern(c, 232, 203, 0.95, c.P.lanterns, null, 0, "sway");
        bunting(c, -10, 52, 410, 60, 20, 12);
        lanternString(c, 240, 250, 410, 254, 10, 3, { s: 0.45 });
        ground(c);
        var n = c.time === "pre" ? 3 : 6, xs = [];
        for (var i = 0; i < n; i++) xs.push(262 + i * 26);
        diners(c, xs, 352);
        if (c.has("saber")) person(c, "sit", 98, st + 1, 1.05, { cap: true });
      }
    },

    koshk: {
      name: "الكشك",
      draw: function (c) {
        farSkyline(c, 290, 60);
        building(c, { x: -30, w: 160, top: 96, color: C.walls[0], cols: 2, stop: G - 40 });
        building(c, { x: 270, w: 170, top: 70, color: C.walls[4], cols: 2, stop: G - 40 });
        var top = G - 196, x = 116, w = 176;
        E("rect", { x: x, y: top, width: w, height: G - top, fill: "#3C7C83" }, c.mid);
        E("rect", { x: x - 8, y: top - 8, width: w + 16, height: 10, fill: "#2B5C61" }, c.mid);
        E("rect", { x: x + 12, y: top - 36, width: w - 24, height: 26, rx: 2, fill: "#B8392B" }, c.mid);
        text(c.mid, x + w / 2, top - 17, "كشك أبو ياسر", 17, C.cream);
        var wx = x + 14, wy = top + 24, ww = w - 28, wh = 84;
        E("rect", { x: wx, y: wy, width: ww, height: wh, fill: "#253238" }, c.back);
        E("rect", { x: wx + ww - 52, y: wy + 6, width: 46, height: wh - 8, fill: "#CFF4FF" }, c.back);
        E("ellipse", { cx: wx + ww - 29, cy: wy + 40, rx: 50, ry: 50, fill: "url(#cool" + c.id + ")", opacity: 0.55 }, c.back);
        for (var r = 0; r < 3; r++) for (var i = 0; i < 6; i++) {
          E("rect", { x: wx + 6 + i * 13, y: wy + 30 + r * 18, width: 9, height: 12, fill: [C.kh[0], C.kh[2], C.kh[1], "#F1E3C6", C.kh[3], "#E07A3A"][(i + r) % 6] }, c.back);
        }
        for (var j = 0; j < 9; j++) E("rect", { x: wx + 4 + j * 16, y: wy, width: 11, height: 16, fill: [C.kh[2], C.kh[0], C.kh[1]][j % 3] }, c.back);
        E("rect", { x: x + 6, y: wy + wh, width: w - 12, height: 8, fill: "#2B5C61" }, c.mid);
        E("rect", { x: 300, y: G - 34, width: 44, height: 34, fill: "#B8392B" }, c.mid);
        for (var k = 0; k < 4; k++) E("circle", { cx: 307 + k * 10, cy: G - 38, r: 3.5, fill: "#2E7D5B" }, c.mid);
        lanternString(c, -10, 40, 410, 46, 16, 6, { s: 0.45 });
        ground(c);
        person(c, "bust", wx + 40, wy + wh, 0.95);
        if (c.has("saber")) person(c, "old", 352, G + 2, 1, { flip: true });
      }
    },

    fulcart: {
      name: "عربية عم حسن",
      draw: function (c) {
        farSkyline(c, 290, 330);
        building(c, { x: -30, w: 200, top: 80, color: C.walls[2], cols: 3, stop: G - 40 });
        building(c, { x: 210, w: 230, top: 56, color: C.walls[0], cols: 3, stop: G - 40 });
        var st = steps(c, 0, 118, 3);
        var x = 196, w = 172;
        E("circle", { cx: x + 30, cy: G - 14, r: 15, fill: "#3A2A22" }, c.mid);
        E("circle", { cx: x + 140, cy: G - 14, r: 15, fill: "#3A2A22" }, c.mid);
        E("rect", { x: x, y: G - 76, width: w, height: 48, fill: "#B5402F" }, c.mid);
        E("rect", { x: x, y: G - 76, width: w, height: 11, fill: "url(#kh" + c.id + ")" }, c.mid);
        E("rect", { x: x - 4, y: G - 80, width: w + 8, height: 5, fill: "#7A2E22" }, c.mid);
        E("rect", { x: x + w - 18, y: G - 176, width: 3, height: 98, fill: "#3A2A22" }, c.mid);
        E("circle", { cx: x + w - 16, cy: G - 178, r: 30, fill: "url(#glow" + c.id + ")", "class": "flicker" }, c.lights);
        E("circle", { cx: x + w - 16, cy: G - 178, r: 5, fill: "#FFE6A8" }, c.lights);
        lanternString(c, -10, 36, 410, 44, 16, 6, { s: 0.45 });
        ground(c);
        if (c.has("hassan")) person(c, "bust", x + w - 46, G - 80, 1.15, { flip: true });
        var px = x + 70;
        E("rect", { x: px - 15, y: G - 140, width: 30, height: 14, fill: shade(C.copper, -0.18) }, c.actors);
        E("ellipse", { cx: px, cy: G - 106, rx: 36, ry: 28, fill: C.copper }, c.actors);
        E("ellipse", { cx: px - 12, cy: G - 114, rx: 10, ry: 14, fill: shade(C.copper, 0.3), opacity: 0.6 }, c.actors);
        E("ellipse", { cx: px, cy: G - 141, rx: 17, ry: 4, fill: shade(C.copper, -0.3) }, c.actors);
        steam(c, px, G - 150, 3);
        if (c.has("saber")) {
          person(c, "sit", 56, st + 1, 1.05, { cap: true });
          E("ellipse", { cx: 80, cy: st - 30, rx: 10, ry: 3, fill: "#EFE7D8" }, c.actors);
        }
      }
    },

    table: {
      name: "مائدة الرحمن",
      draw: function (c) {
        E("rect", { x: -20, y: 132, width: W + 40, height: 230, fill: "url(#kh" + c.id + ")" }, c.mid);
        E("rect", { x: -20, y: 126, width: W + 40, height: 10, fill: "#1E3E78" }, c.mid);
        for (var fx = -20, i = 0; fx < W + 20; fx += 14, i++) {
          E("path", { d: "M" + fx + " 136 L" + (fx + 14) + " 136 L" + (fx + 7) + " 146 Z", fill: C.kh[i % 4] }, c.mid);
        }
        lanternString(c, -10, 150, 410, 150, 16, 6, { s: 0.6 });
        tableCloth(c, -20, W + 40, 352);
        ground(c);
        var xs = [24, 62, 100, 140, 260, 300, 338, 376];
        diners(c, xs, 352);
        if (c.has("saber")) {
          E("ellipse", { cx: 200, cy: 330, rx: 70, ry: 50, fill: "url(#glow" + c.id + ")", opacity: 0.55 }, c.back);
          person(c, "bust", 200, 352, 1.12, { cap: true });
          E("ellipse", { cx: 200, cy: 356, rx: 10, ry: 2.8, fill: "#F4EEE2" }, c.mid);
        }
        if (c.has("kids")) kids(c, 232, 168, 0.55);
      }
    },

    koshari: {
      name: "محل الكشري",
      draw: function (c) {
        building(c, { x: -30, w: 460, top: 26, color: C.walls[6], cols: 6, stop: G - 210 });
        var top = shop(c, { x: 30, w: 340, h: 172, sign: "كشري الحارة", signBg: "#1F4E8C", interior: "#FFE2A8" });
        for (var bx = 34; bx < 368; bx += 14) {
          var b = E("circle", { cx: bx, cy: top - 34, r: 2.2, fill: "#FFE08A", "class": "twinkle" }, c.lights);
          b.style.animationDelay = ((bx % 5) * 0.3).toFixed(1) + "s";
        }
        [[80, 46], [140, 40], [196, 34]].forEach(function (p) {
          E("rect", { x: p[0] - p[1] / 2, y: G - 60 - p[1] * 1.3, width: p[1], height: p[1] * 1.3, fill: "#C8C6CF" }, c.back);
          E("ellipse", { cx: p[0], cy: G - 60 - p[1] * 1.3, rx: p[1] / 2, ry: 5, fill: "#E4E2EA" }, c.back);
        });
        for (var s = 0; s < 3; s++) for (var j = 0; j < 5; j++) {
          E("ellipse", { cx: 252 + j * 22, cy: top + 30 + s * 30, rx: 8, ry: 4, fill: "#F4EEE2" }, c.back);
        }
        E("rect", { x: 30, y: G - 60, width: 340, height: 60, fill: "#B33A2C" }, c.back);
        for (var t = 30; t < 370; t += 20) E("rect", { x: t, y: G - 60, width: 1.2, height: 60, fill: "#8E2B20" }, c.back);
        ground(c);
        if (c.has("saber")) person(c, "old", 302, G + 2, 1.02, { flip: true });
      }
    },

    kebab: {
      name: "الكبابجي",
      draw: function (c) {
        building(c, { x: -30, w: 460, top: 36, color: C.walls[5], cols: 6, stop: G - 200 });
        var top = shop(c, { x: 20, w: 252, h: 162, sign: "كبابجي الحارة", signBg: "#7A2E22", interior: "#F3A55B" });
        E("rect", { x: 46, y: G - 92, width: 132, height: 22, fill: "#2A1A14" }, c.back);
        E("ellipse", { cx: 112, cy: G - 88, rx: 74, ry: 24, fill: "url(#fire" + c.id + ")", "class": "flicker" }, c.back);
        for (var i = 0; i < 10; i++) E("rect", { x: 52 + i * 12, y: G - 96, width: 3, height: 10, fill: "#6B3A24" }, c.back);
        E("rect", { x: 20, y: G - 52, width: 252, height: 52, fill: "#6B3A24" }, c.back);
        steam(c, 100, G - 112, 3);
        lanternString(c, 10, top - 50, 290, top - 48, 10, 6, { s: 0.35 });
        E("rect", { x: 296, y: G - 62, width: 96, height: 6, fill: "#EFE7D8" }, c.mid);
        E("rect", { x: 300, y: G - 56, width: 3, height: 56, fill: "#5C4B3E" }, c.mid);
        E("rect", { x: 386, y: G - 56, width: 3, height: 56, fill: "#5C4B3E" }, c.mid);
        ground(c);
        if (c.has("saber")) {
          person(c, "bust", 330, G - 62, 1.05, { cap: true });
          E("rect", { x: 356, y: G - 80, width: 9, height: 16, fill: "#F7F3EA" }, c.actors);
          E("ellipse", { cx: 340, cy: G - 63, rx: 12, ry: 3, fill: "#F4EEE2" }, c.actors);
        }
      }
    },

    mosque: {
      name: "الجامع",
      draw: function (c) {
        farSkyline(c, 260, null);
        minaret(c, 350, -10, 120, 1.4, c.mid, C.stone, c.P.lanterns);
        dome(c, 70, 124, 66, c.mid, shade(C.stone, -0.06));
        E("rect", { x: -20, y: 118, width: W + 40, height: G - 116, fill: C.stone }, c.mid);
        for (var i = 0; i < 5; i++) E("rect", { x: -20, y: 122 + i * 10, width: W + 40, height: 5, fill: i % 2 ? C.stone : C.ablaq }, c.mid);
        [40, 330].forEach(function (x) {
          E("path", { d: "M" + x + " 250 V214 A16 16 0 0 1 " + (x + 32) + " 214 V250 Z", fill: "#FFC75E" }, c.back);
          E("rect", { x: x - 10, y: 200, width: 52, height: 70, fill: "url(#glow" + c.id + ")", opacity: 0.4 }, c.back);
        });
        var dx = 140, dw = 120, dtop = G - 176;
        E("path", { d: "M" + (dx - 10) + " " + G + " V" + (dtop + 60) + " A70 70 0 0 1 " + (dx + dw + 10) + " " + (dtop + 60) + " V" + G + " Z", fill: shade(C.stone, -0.18) }, c.mid);
        E("path", { d: "M" + dx + " " + G + " V" + (dtop + 60) + " A60 60 0 0 1 " + (dx + dw) + " " + (dtop + 60) + " V" + G + " Z", fill: "#FFD08A" }, c.back);
        E("ellipse", { cx: dx + dw / 2, cy: dtop + 90, rx: 90, ry: 110, fill: "url(#warm" + c.id + ")", opacity: 0.6 }, c.back);
        E("rect", { x: dx, y: G - 26, width: dw, height: 26, fill: "#9E2F2A" }, c.back);
        E("line", { x1: dx + dw / 2, y1: dtop + 2, x2: dx + dw / 2, y2: dtop + 40, stroke: "#6B4A2E", "stroke-width": 1.2 }, c.back);
        E("path", { d: "M" + (dx + dw / 2 - 16) + " " + (dtop + 40) + " H" + (dx + dw / 2 + 16) + " L" + (dx + dw / 2 + 8) + " " + (dtop + 52) + " H" + (dx + dw / 2 - 8) + " Z", fill: "#B8862F" }, c.back);
        lanternString(c, -10, 96, 300, 100, 12, 5, { s: 0.42 });
        ground(c);
        person(c, "man", 180, G - 4, 0.78);
        person(c, "man", 222, G - 6, 0.74, { flip: true });
        if (c.has("saber")) person(c, "old", 300, G + 2, 1.02, { flip: true });
      }
    },

    roof: {
      name: "السطوح",
      draw: function (c) {
        var r = c.r;
        minaret(c, 86, 140, 300, 0.9, c.far, shade(C.far, -0.08), c.P.lanterns);
        dome(c, 140, 300, 34, c.far, shade(C.far, -0.08));
        for (var row = 0; row < 2; row++) {
          var x = -20, base = 300 + row * 54;
          while (x < W + 20) {
            var w = 34 + r() * 50, h = 30 + r() * 50, col = shade(C.walls[Math.floor(r() * 7)], -0.15 - row * 0.05);
            E("rect", { x: x, y: base - h, width: w + 1, height: h + 60, fill: col }, c.far);
            for (var wy = base - h + 8; wy < base - 4; wy += 14) for (var wx = x + 6; wx < x + w - 6; wx += 12) {
              if (r() < 0.4) E("rect", { x: wx, y: wy, width: 4, height: 6, fill: C.lit, opacity: 0.85 }, c.back);
            }
            x += w;
          }
        }
        [[0, 236, 400, 246], [0, 290, 400, 296]].forEach(function (L) {
          var p0 = [L[0], L[1]], p1 = [L[2], L[3]], pc = [200, (L[1] + L[3]) / 2 + 26];
          for (var i = 1; i < 26; i++) {
            var p = q(p0, pc, p1, i / 26);
            E("circle", { cx: p[0], cy: p[1], r: 1.8, fill: ["#FFC75E", "#FF8A6A", "#8DFFAA", "#9EC4FF"][i % 4], "class": "twinkle" }, c.lights).style.animationDelay = (i % 7) * 0.4 + "s";
          }
        });
        E("rect", { x: -20, y: 352, width: W + 40, height: 22, fill: C.walls[0] }, c.mid);
        E("rect", { x: -20, y: 348, width: W + 40, height: 6, fill: shade(C.walls[0], -0.15) }, c.mid);
        E("rect", { x: -20, y: 374, width: W + 40, height: 100, fill: "#9B8A78" }, c.mid);
        tank(c, 344, 352, c.mid);
        E("rect", { x: 104, y: 300, width: 3, height: 52, fill: "#777" }, c.mid);
        E("ellipse", { cx: 106, cy: 296, rx: 22, ry: 10, fill: "#D8D8D2", transform: "rotate(-24 106 296)" }, c.mid);
        E("line", { x1: 106, y1: 296, x2: 140, y2: 278, stroke: "#777", "stroke-width": 2 }, c.mid);
        E("line", { x1: 140, y1: 278, x2: 140, y2: 286, stroke: "#3B302C", "stroke-width": 1 }, c.mid);
        lantern(c, 140, 285, 0.9, true, null, 0, "sway");
        E("line", { x1: 230, y1: 318, x2: 400, y2: 300, stroke: "#4E4038", "stroke-width": 1 }, c.mid);
        for (var k = 0; k < 5; k++) E("rect", { x: 244 + k * 30, y: 316 - k * 3, width: 16, height: 22, fill: [C.cream, C.kh[1], "#E7C9C9", C.kh[2], C.cream][k] }, c.mid);
        if (c.has("kids")) {
          person(c, "man", 176, 396, 0.6, { cls: "bob" });
          person(c, "woman", 214, 396, 0.56, { cls: "bob", lantern: true, glass: 1, flip: true });
        }
      }
    },

    workshop: {
      name: "الورشة القديمة",
      draw: function (c) {
        farSkyline(c, 280, 330);
        building(c, { x: -30, w: 460, top: 70, color: C.walls[2], cols: 5, stop: G - 210 });
        E("path", { d: "M300 120 L312 150 L304 170 L318 200", fill: "none", stroke: shade(C.walls[2], -0.3), "stroke-width": 1.4 }, c.mid);
        shop(c, { x: 64, w: 272, h: 182, state: "shut", sign: "ورشة صابر للنجارة", signBg: "#5A4636", signInk: "#D9C7A4", signSize: 17 });
        E("rect", { x: 64, y: G - 182, width: 272, height: 182, fill: "#8A4B32", opacity: 0.35 }, c.mid);
        E("rect", { x: 194, y: G - 70, width: 14, height: 12, rx: 2, fill: "#4A3A33" }, c.mid);
        E("path", { d: "M196 " + (G - 70) + " V" + (G - 77) + " A5 5 0 0 1 206 " + (G - 77) + " V" + (G - 70), fill: "none", stroke: "#4A3A33", "stroke-width": 2 }, c.mid);
        E("rect", { x: 318, y: G - 176, width: 4, height: 168, fill: "#120C08" }, c.mid);
        E("rect", { x: 56, y: G - 10, width: 288, height: 10, fill: "#9B8E84" }, c.mid);
        lanternString(c, -10, 40, 410, 48, 14, 6, { s: 0.42 });
        ground(c);
        person(c, "cat", 112, G - 9, 1.15);
      }
    }
  };

  function newSvg(viewBox) {
    var svg = E("svg", { viewBox: viewBox || "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMax slice", "aria-hidden": "true", focusable: "false" });
    return svg;
  }

  function scene(place, time, show) {
    var svg = newSvg();
    var seed = 0;
    for (var i = 0; i < place.length; i++) seed = (seed * 31 + place.charCodeAt(i)) % 100000;
    var c = makeCtx(svg, time, seed + 17, show);
    skyAndBody(c);
    (PLACES[place] || PLACES.home).draw(c);
    return svg;
  }

  // Overview of the hara: 30 lanterns on two strings, one per episode.
  function hub(litFn, today) {
    var svg = newSvg();
    var c = makeCtx(svg, "night", 99, []);
    c.moonY = 132;
    skyAndBody(c);
    farSkyline(c, 372, 300);
    minaret(c, 250, 230, 380, 0.85, c.mid, shade(C.stone, -0.05), true);
    dome(c, 196, 382, 46, c.mid, shade(C.stone, -0.05));
    building(c, { x: -30, w: 140, top: 320, color: C.walls[2], cols: 2, fh: 50 });
    building(c, { x: 290, w: 150, top: 306, color: C.walls[0], cols: 2, fh: 50 });
    E("rect", { x: 110, y: 380, width: 180, height: 30, fill: C.stone }, c.mid);
    ground(c);
    var cls = function (i) { return i === today ? "sway pulse" : "sway"; };
    lanternString(c, -10, 178, 410, 186, 26, 15, { s: 0.5, litFn: function (i) { return litFn(i); }, clsFn: cls });
    lanternString(c, -10, 250, 410, 256, 22, 15, { s: 0.5, litFn: function (i) { return litFn(i + 15); }, clsFn: function (i) { return cls(i + 15); } });
    return svg;
  }

  window.HARA = window.HARA || {};
  HARA.art = {
    scene: scene,
    hub: hub,
    places: Object.keys(PLACES).reduce(function (m, k) { m[k] = { name: PLACES[k].name }; return m; }, {}),
    times: Object.keys(TIMES)
  };
})();
