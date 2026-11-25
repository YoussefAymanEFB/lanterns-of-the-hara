/* فوانيس الحارة · pixel art for the walking hara (walk.html).
   Everything is painted in code, one art pixel per canvas pixel, then scaled up crisp by js/map.js.
   Look: warm, saturated, hue-shifted shading (shadows lean plum, lights lean cream), coloured outlines.
   H.art.person(spec)  people with 4 directions x 4 walking frames, blink and sitting poses
   H.art.cat(coat) / H.art.pigeon()  animals
   H.art.prop(name, opts)  street things: carts, tables, palms, lanterns...
   H.art.P / outline / flip / rng / mix  helpers shared with js/hara-world.js */
(function () {
  "use strict";
  var H = window.HARA = window.HARA || {};

  /* ---------------- helpers ---------------- */
  function cv(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rgb(h) { var n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function cl(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  function hex(r, g, b) { return "#" + ((1 << 24) | (cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).slice(1); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  function dk(c, t) { return mix(c, "#2B1B3A", t); }   // shade leans plum
  function lt(c, t) { return mix(c, "#FFF4D8", t); }   // light leans warm cream
  function pick(R, list) { return list[(R() * list.length) | 0]; }

  // A painter bound to one canvas. All coordinates are whole art pixels.
  function Pt(c) {
    var g = c.getContext("2d");
    var P = {
      c: c, g: g,
      r: function (x, y, w, h, col) { if (col && w > 0 && h > 0) { g.fillStyle = col; g.fillRect(x, y, w, h); } return P; },
      p: function (x, y, col) { if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } return P; },
      el: function (x, y, w, h, col) { // filled ellipse inside the box
        g.fillStyle = col;
        for (var j = 0; j < h; j++) {
          var yy = (j + 0.5 - h / 2) / (h / 2), hw = (w / 2) * Math.sqrt(Math.max(0, 1 - yy * yy));
          var x0 = Math.round(x + w / 2 - hw), x1 = Math.round(x + w / 2 + hw);
          if (x1 > x0) g.fillRect(x0, y + j, x1 - x0, 1);
        }
        return P;
      },
      map: function (x, y, rows, pal) {
        for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
          var col = pal[rows[j][i]];
          if (col) { g.fillStyle = col; g.fillRect(x + i, y + j, 1, 1); }
        }
        return P;
      },
      dots: function (x, y, w, h, cols, n, R) {
        for (var i = 0; i < n; i++) { g.fillStyle = cols[(R() * cols.length) | 0]; g.fillRect(x + ((R() * w) | 0), y + ((R() * h) | 0), 1, 1); }
        return P;
      },
      line: function (x0, y0, x1, y1, col) {
        g.fillStyle = col;
        var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
        for (var n = 0; n < 2000; n++) {
          g.fillRect(x0, y0, 1, 1);
          if (x0 === x1 && y0 === y1) break;
          var e2 = 2 * e;
          if (e2 >= dy) { e += dy; x0 += sx; }
          if (e2 <= dx) { e += dx; y0 += sy; }
        }
        return P;
      },
      img: function (src, x, y) { g.drawImage(src, x, y); return P; }
    };
    return P;
  }

  // Coloured outline: every empty pixel touching the sprite takes a darkened copy of its neighbour.
  function outline(c, amt) {
    var w = c.width, h = c.height, g = c.getContext("2d"), im = g.getImageData(0, 0, w, h), a = im.data, o = new Uint8ClampedArray(a);
    var I = [40, 22, 44], t = amt == null ? 0.68 : amt;
    function on(i) { return a[i + 3] > 90; }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4;
      if (on(i)) continue;
      var n = -1;
      if (y < h - 1 && on(i + w * 4)) n = i + w * 4;
      else if (y > 0 && on(i - w * 4)) n = i - w * 4;
      else if (x > 0 && on(i - 4)) n = i - 4;
      else if (x < w - 1 && on(i + 4)) n = i + 4;
      if (n < 0) continue;
      o[i] = a[n] + (I[0] - a[n]) * t; o[i + 1] = a[n + 1] + (I[1] - a[n + 1]) * t; o[i + 2] = a[n + 2] + (I[2] - a[n + 2]) * t; o[i + 3] = 255;
    }
    im.data.set(o); g.putImageData(im, 0, 0);
    return c;
  }
  function flip(c) { var o = cv(c.width, c.height), g = o.getContext("2d"); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
  // Paint, outline, then slide a soft shadow underneath.
  function sprite(w, h, paint, sh) {
    var c = cv(w, h);
    paint(Pt(c), w, h);
    outline(c);
    if (!sh) return c;
    var o = cv(w, h), P = Pt(o);
    P.el(sh[0], sh[1], sh[2], sh[3], "rgba(46,24,52," + (sh[4] || 0.3) + ")");
    P.img(c, 0, 0);
    return o;
  }

  /* ---------------- palette ---------------- */
  var SKIN = {
    fair: ["#F4CDA6", "#DDA885"], mid: ["#E5B088", "#C68862"], tan: ["#CF9566", "#AE734C"], deep: ["#AD754D", "#8A5838"]
  };
  var EYE = "#2A1A2C";
  var WOOD = ["#9C6542", "#BA8155", "#7A4A31", "#5C3524"];
  var BRASS = ["#C8963E", "#F2C76C", "#8A6224"];
  var GLASS = ["#E8503F", "#4CBF73", "#4F97E8", "#FFD25A", "#B86BE0", "#FF8F3F"];
  var LEAF = ["#4C9A4C", "#6EBE58", "#33703F", "#9BD670", "#255633"];

  /* ================= people ================= */
  // spec: { kid, build: thin|normal|fat, skin, hair: {style, c}, head: {kind, c, c2, pat}, top: {kind: robe|shirt|tee|dress, c, trim},
  //         legs, shoes, apron, vest, mus, musBig, beard, glasses, lantern, brows }
  function person(o) {
    var f = [[], [], [], []], blink = [], sit = [], lan = [];
    for (var d = 0; d < 3; d++) for (var k = 0; k < 4; k++) {
      var L = {};
      f[d][k] = outline(drawPerson(o, d, k, false, false, L));
      if (k === 0) lan[d] = L.lan;
    }
    f[3] = f[2].map(flip);
    lan[3] = lan[2] ? [-lan[2][0], lan[2][1]] : null;
    blink[0] = outline(drawPerson(o, 0, 0, false, true, {}));
    blink[2] = outline(drawPerson(o, 2, 0, false, true, {}));
    blink[3] = flip(blink[2]); blink[1] = f[1][0];
    sit[0] = outline(drawPerson(o, 0, 0, true, false, {}));
    sit[2] = outline(drawPerson(o, 2, 0, true, false, {}));
    sit[3] = flip(sit[2]);
    // seen from behind, sitting on a sofa or a chair facing away: the back, three pixels lower (the seat hides the legs)
    sit[1] = (function () { var c = cv(22, 32), g = c.getContext("2d"); g.drawImage(f[1][0], 0, 0, 22, 28, 0, 3, 22, 28); return c; })();
    return { f: f, blink: blink, sit: sit, w: 22, h: 32, ax: 11, ay: 30, lan: lan, kid: !!o.kid, spec: o };
  }

  function drawPerson(o, d, k, sitting, blink, out) {
    var c = cv(22, 32), P = Pt(c), cx = 11;
    var kid = !!o.kid, ht = kid ? 9 : 5;
    if (sitting) ht += kid ? 2 : 3;
    var L = {
      cx: cx, ht: ht, bt: ht + 10, d: d, step: k === 1 ? 1 : k === 3 ? -1 : 0, sit: sitting, kid: kid, blink: blink,
      tw: kid ? 8 : o.build === "fat" ? 10 : o.build === "thin" ? 6 : 8
    };
    L.tx0 = cx - L.tw / 2; L.tx1 = cx + L.tw / 2 - 1;
    var sk = o.skin || SKIN.mid;
    L.sk = sk[0]; L.skS = sk[1];
    if (d === 2) bodySide(P, o, L); else bodyFront(P, o, L);
    head(P, o, L);
    if (o.lantern && !sitting) heldLantern(P, o, L);
    if (o.drum && !sitting) heldDrum(P, o, L);
    out.lan = L.lan || null;
    return c;
  }

  /* Prayer, seen from behind (the rows face the qibla, away from you). Each pose is drawn from the person's own
     clothes: ruku is a flat back with the arms down to the knees and only the crown of the head showing past the
     shoulders; sujood is a small mound with the soles of the feet towards you and the elbows out; jalsa is sitting
     back on the heels. "bow" is halfway down to ruku, for the moment in between. */
  function prayPoses(o) {
    var kid = !!o.kid, cx = 11, ht = kid ? 9 : 5, bt = ht + 10, FY = 28;
    var tw = kid ? 8 : o.build === "fat" ? 10 : o.build === "thin" ? 6 : 8;
    var t = o.top, T = cloth(t.c), robe = t.kind === "robe" || t.kind === "dress";
    var hip = bt + (kid ? 5 : 7);
    var low = cloth(robe ? t.c : (o.legs || "#3D4266"));
    var sk = (o.skin || SKIN.mid)[0], skS = (o.skin || SKIN.mid)[1];
    var hd = o.head || {}, veil = hd.kind === "hijab" || hd.kind === "khimar", khimar = hd.kind === "khimar", V = veil ? cloth(hd.c) : null;
    var hr = o.hair || { style: "short", c: "#2E2229" };
    // what you see of a head from above and behind: the veil, the cap, or the hair
    var crownC = veil ? V : (hd.kind === "taqiyah" || hd.kind === "cap") ? cloth(hd.c || "#F3EFE6") : hd.kind === "turban" ? cloth("#F4F1E8")
      : hr.style === "bald" || hr.style === "sides" ? cloth(sk) : cloth(hr.c || "#2E2229");
    var sleeve = t.kind === "tee" ? 2 : 9;
    var back = drawPerson(o, 1, 0, false, false, {});
    function rows(g, y0, y1, dy) { if (y1 > y0) g.drawImage(back, 0, y0, 22, y1 - y0, 0, y0 + dy, 22, y1 - y0); }
    function make(fn) { var c = cv(22, 32), g = c.getContext("2d"); g.imageSmoothingEnabled = false; fn(Pt(c), g); return outline(c); }
    function crown(P, y, w) { // the top of a head, seen from above and behind
      var x0 = cx - (w >> 1);
      P.r(x0 + 1, y, w - 2, 1, crownC.c); P.r(x0, y + 1, w, 2, crownC.c);
      P.r(x0 + 1, y, 2, 1, crownC.L); P.r(x0 + w - 2, y + 1, 2, 2, crownC.S);
    }
    // a back seen from above: rounded at the shoulders, lit from the upper left, the spine down the middle
    function block(P, y0, y1, w, C, spine) {
      var x0 = cx - (w >> 1);
      P.r(x0 + 1, y0, w - 2, 1, C.L);
      P.r(x0, y0 + 1, w, y1 - y0 - 1, C.c);
      P.r(x0, y0 + 1, 1, y1 - y0 - 2, C.L); P.r(x0 + w - 2, y0 + 1, 2, y1 - y0 - 1, C.S);
      if (spine) P.r(cx, y0 + 2, 1, y1 - y0 - 3, C.S);
    }
    function drape(P, y0, w, deep) { // a scarf over the shoulders, its hem a little darker
      var x0 = cx - (w >> 1);
      P.r(x0 + 1, y0, w - 2, 1, V.L); P.r(x0, y0 + 1, w, deep - 1, V.c); P.r(x0 + w - 2, y0 + 1, 2, deep - 1, V.S);
      P.r(x0 + 1, y0 + deep, w - 2, 1, V.S);
    }
    function arms(P, x0, x1, y0, y1) {
      [x0, x1].forEach(function (x) {
        var lit = x < cx, s = Math.min(sleeve, y1 - y0);
        P.r(x, y0, 1, s, lit ? T.c : T.S);
        if (s < y1 - y0) P.r(x, y0 + s, 1, y1 - y0 - s, lit ? sk : skS);
        P.p(x, y1, lit ? sk : skS);
      });
    }
    var poses = { qiyam: outline(drawPerson(o, 1, 0, false, false, {})) };
    // halfway down: the head dips and the shoulders round forward
    poses.bow = make(function (P, g) {
      rows(g, 0, veil ? bt - 1 : bt, 3);
      rows(g, hip, 32, 0);
      var w = tw + 2, y0 = bt + 1;
      block(P, y0, hip + 1, w, khimar ? V : T, !khimar);
      if (veil && !khimar) drape(P, y0, w, 2);
      if (!khimar) arms(P, cx - (w >> 1) - 1, cx + (w >> 1), y0 + 1, hip + 1);
    });
    // ruku: legs straight, the back flat and wide like a table, only the crown of the head showing past the shoulders,
    // hands on the knees
    poses.ruku = make(function (P, g) {
      rows(g, hip, 32, 0);
      var w = tw + 4, y0 = hip - (kid ? 4 : 5);
      crown(P, y0 - 3, 6);
      block(P, y0, hip + 1, w, khimar ? V : T, !khimar);
      if (veil && !khimar) drape(P, y0, w, 2);
      if (khimar) P.r(cx - (w >> 1) + 1, hip, w - 2, 1, V.S);
      else arms(P, cx - (w >> 1) - 1, cx + (w >> 1), y0 + 1, hip + (kid ? 2 : 3));
    });
    // sujood: a low rounded mound, the back sloping away from the raised hips, the soles of the feet towards you
    poses.sujood = make(function (P) {
      var top = FY - (kid ? 8 : 10), w = tw + 4, mid = top + (kid ? 4 : 5), x0 = cx - (w >> 1);
      // the back, rounded at the shoulders
      P.r(x0 + 3, top, w - 6, 1, (khimar ? V : T).L);
      P.r(x0 + 1, top + 1, w - 2, 1, (khimar ? V : T).c);
      block(P, top + 1, mid + 1, w, khimar ? V : T, !khimar);
      if (veil && !khimar) { P.r(x0 + 3, top, w - 6, 1, V.L); P.r(x0 + 1, top + 1, w - 2, 2, V.c); P.r(x0 + w - 3, top + 1, 2, 2, V.S); }
      // hips and the folded legs under them, a little wider
      var lw = w + 1, lx = cx - (lw >> 1);
      P.r(lx, mid, lw, FY - mid, low.c);
      P.r(lx, mid, 1, FY - mid - 1, low.L); P.r(lx + lw - 2, mid, 2, FY - mid, low.S);
      P.r(lx + 1, mid, lw - 2, 1, robe && !khimar ? low.S : low.c);   // the fold at the waist
      if (khimar) P.r(lx + 1, mid, lw - 2, 1, V.S);                  // the veil's hem
      if (!robe) P.r(cx, mid + 1, 1, FY - mid - 2, low.S);
      P.r(lx + 1, FY - 1, lw - 2, 1, low.S);
      // the soles, toes curled under, towards you
      P.r(cx - 4, FY, 3, 2, lt(sk, 0.1)); P.r(cx + 2, FY, 3, 2, sk);
      P.p(cx - 4, FY + 1, skS); P.p(cx + 4, FY + 1, skS);
    });
    // jalsa: sitting back on the heels, upright
    poses.jalsa = make(function (P, g) {
      var drop = kid ? 4 : 6;
      rows(g, 0, hip, drop);
      var lw = tw + 6, lx = cx - lw / 2, y0 = hip + drop - 1;
      P.r(lx + 1, y0, lw - 2, 1, low.c); P.r(lx, y0 + 1, lw, FY + 1 - y0, low.c);
      P.r(lx, y0 + 1, 1, FY - y0, low.L); P.r(lx + lw - 2, y0 + 1, 2, FY + 1 - y0, low.S);
      P.r(lx + 1, FY + 1, lw - 2, 1, low.S);
      P.r(cx + 2, FY - 1, 2, 2, sk); P.p(cx + 2, FY + 1, skS);   // the right foot upright, toes bent
    });
    return poses;
  }

  function cloth(c) { return { c: c, S: dk(c, 0.27), L: lt(c, 0.24), D: dk(c, 0.45) }; }

  function bodyFront(P, o, L) {
    var t = o.top, T = cloth(t.c), trim = t.trim || T.D, cx = L.cx, bt = L.bt, x0 = L.tx0, x1 = L.tx1, tw = L.tw, s = L.step;
    var fat = o.build === "fat", back = L.d === 1, FY = 28;
    var shoe = o.shoes || "#5A3A2C", shoeS = dk(shoe, 0.3);
    var pant = cloth(o.legs || "#3D4266");
    var armC = T.c, armS = T.S, aLen = L.kid ? 4 : 5, sleeve = aLen;
    if (t.kind === "tee") sleeve = 2;

    if (t.kind === "robe" || t.kind === "dress") {
      var tH = L.kid ? 4 : 7, sTop = bt + tH, sBot = L.sit ? sTop + 3 : (t.kind === "dress" && L.kid ? FY - 1 : FY);
      P.r(x0, bt, tw, tH, T.c);
      var sw = tw + (fat ? 2 : 2) + (L.sit ? 2 : 0), sx = cx - sw / 2;
      if (fat) P.r(x0 - 1, bt + 2, tw + 2, tH - 2, T.c);
      P.r(sx, sTop, sw, sBot - sTop, T.c);
      // light from the upper left, shade to the right
      P.r(x0, bt + 1, 1, tH - 1, T.L);
      P.r(x1 - 1, bt + 1, 2, tH - 1, T.S);
      if (fat) { P.p(x0 - 1, bt + 3, T.L); P.r(x1 + 1, bt + 2, 1, tH - 2, T.S); }
      P.r(sx + sw - 3, sTop, 3, sBot - sTop, T.S);
      P.r(sx, sTop, 1, sBot - sTop - 1, T.L);
      if (!L.sit) P.r(cx + 1, sTop + 2, 1, sBot - sTop - 3, T.S); // fold
      P.r(sx + s, sBot - 1, sw, 1, T.S); // hem sways with the step
      P.r(sx + sw - 3 + s, sBot - 1, 3, 1, T.D);
      if (!back) { // neck opening and the front placket
        P.r(cx - 1, bt, 2, 1, L.skS);
        if (t.kind === "robe" && !L.kid) P.r(cx - 1, bt + 1, 1, 3, trim);
      }
      if (o.vest) { var V = cloth(o.vest); P.r(x0, bt, 2, tH, V.c); P.r(x1 - 1, bt, 2, tH, V.S); if (back) P.r(x0, bt, tw, tH, V.c); P.r(x0, bt + tH - 1, tw, 1, V.S); }
      if (o.apron && !back) { var A = cloth(o.apron); P.r(cx - 3, bt + 3, 6, sBot - bt - 4, A.c); P.r(cx + 1, bt + 3, 2, sBot - bt - 4, A.S); P.r(x0, bt + 3, tw, 1, A.S); }
      if (o.apron && back) P.r(x0, bt + 3, tw, 1, cloth(o.apron).S);
      if (L.kid && t.kind === "dress") { // legs under a child's dress
        P.r(cx - 3, sBot, 2, FY - sBot, L.skS); P.r(cx + 1, sBot, 2, FY - sBot, L.skS);
      }
      if (L.sit) { // knees forward, feet below
        P.r(cx - 3, sBot, 2, FY - sBot, L.skS); P.r(cx + 1, sBot, 2, FY - sBot, L.skS);
        P.r(cx - 4, FY, 3, 2, shoe); P.r(cx + 1, FY, 3, 2, shoeS);
      } else feetFront(P, cx, FY, s, shoe, shoeS);
    } else { // shirt or tee over trousers / shorts
      var sh = L.kid ? 5 : 6, belt = bt + sh, lTop = belt + (L.kid ? 0 : 1), lBot = L.sit ? lTop + 3 : FY;
      P.r(x0, bt, tw, sh, T.c);
      if (fat) P.r(x0 - 1, bt + 2, tw + 2, sh - 1, T.c);
      P.r(x0, bt + 1, 1, sh - 1, T.L);
      P.r(x1 - 1, bt + 1, 2, sh - 1, T.S);
      if (fat) P.r(x1 + 1, bt + 2, 1, sh - 1, T.S);
      if (!back) { P.r(cx - 1, bt, 2, 1, L.skS); if (!L.kid) { P.p(cx - 2, bt, T.L); P.p(cx + 1, bt, T.L); P.r(cx - 1, bt + 1, 1, 3, T.S); } }
      if (!L.kid) P.r(x0 - (fat ? 1 : 0), belt, tw + (fat ? 2 : 0), 1, "#3A2A26");
      if (!L.kid && !back) P.p(cx, belt, "#D9B45A");
      // legs
      var lw = L.kid ? 3 : tw / 2;
      var lx0 = L.kid ? cx - 3 : x0, lx1 = L.kid ? cx : cx;
      var short = L.kid ? 2 : 0; // shorts then bare legs
      var lenL = lBot - lTop - (s === -1 ? 1 : 0), lenR = lBot - lTop - (s === 1 ? 1 : 0);
      if (short) {
        P.r(lx0, lTop, lw, short, pant.c); P.r(lx1, lTop, lw, short, pant.S);
        P.r(lx0 + 1, lTop + short, 2, lenL - short, L.sk); P.r(lx1, lTop + short, 2, lenR - short, L.skS);
      } else {
        P.r(lx0, lTop, lw, lenL, pant.c); P.r(lx1, lTop, lw, lenR, pant.c);
        P.r(lx1 + lw - 1, lTop, 1, lenR, pant.S); P.r(cx - 1, lTop + 1, 1, Math.min(lenL, lenR) - 1, pant.S);
      }
      if (L.sit) { P.r(cx - 4, FY, 3, 2, shoe); P.r(cx + 1, FY, 3, 2, shoeS); }
      else feetFront(P, cx, FY, s, shoe, shoeS);
    }
    // arms and hands
    var ax0 = x0 - 1 - (fat ? 1 : 0), ax1 = x1 + 1 + (fat ? 1 : 0);
    P.r(ax0, bt + 1, 1, sleeve, armC); P.r(ax1, bt + 1, 1, sleeve, armS);
    if (sleeve < aLen) { P.r(ax0, bt + 1 + sleeve, 1, aLen - sleeve, L.sk); P.r(ax1, bt + 1 + sleeve, 1, aLen - sleeve, L.skS); }
    P.p(ax0, bt + 1 + aLen, L.sk); P.p(ax1, bt + 1 + aLen, L.skS);
    L.hand = [ax1, bt + 1 + aLen];
  }
  function feetFront(P, cx, FY, s, shoe, shoeS) {
    P.r(cx - 3, FY - (s === -1 ? 1 : 0), 3, s === -1 ? 2 : 2, shoe);
    P.r(cx, FY - (s === 1 ? 1 : 0), 3, 2, shoeS);
    if (s === -1) P.r(cx - 3, FY + 1, 3, 1, "rgba(0,0,0,0)");
    P.p(cx - 3, FY, lt(shoe, 0.25));
  }

  function bodySide(P, o, L) { // facing left
    var t = o.top, T = cloth(t.c), cx = L.cx, bt = L.bt, s = L.step, fat = o.build === "fat", FY = 28;
    var shoe = o.shoes || "#5A3A2C", shoeS = dk(shoe, 0.35);
    var pant = cloth(o.legs || "#3D4266");
    var aLen = L.kid ? 4 : 5, sleeve = t.kind === "tee" ? 2 : aLen;
    var tx = cx - 3, tw = L.kid ? 6 : fat ? 7 : 6;
    if (fat) tx = cx - 4;
    if (t.kind === "robe" || t.kind === "dress") {
      var tH = L.kid ? 4 : 7, sTop = bt + tH, sBot = L.sit ? sTop + 2 : (t.kind === "dress" && L.kid ? FY - 1 : FY);
      P.r(tx, bt, tw, tH, T.c);
      P.r(tx + tw - 2, bt + 1, 2, tH - 1, T.S);
      P.r(tx, bt + 1, 1, tH - 1, T.L);
      if (L.sit) {
        P.r(cx - 7, sTop, 11, 3, T.c); P.r(cx - 7, sTop + 2, 11, 1, T.S);
        P.r(cx - 7, sTop + 3, 3, FY - sTop - 3, T.S);
        P.r(cx - 9, FY, 4, 2, shoe);
      } else {
        P.r(cx - 4, sTop, 8, sBot - sTop, T.c);
        P.r(cx + 1, sTop, 3, sBot - sTop, T.S);
        P.r(cx - 4, sTop, 1, sBot - sTop - 1, T.L);
        P.r(cx - 4 - s, sBot - 1, 8, 1, T.S);
        if (L.kid && t.kind === "dress") P.r(cx - 2, sBot, 2, FY - sBot, L.skS);
        feetSide(P, cx, FY, s, shoe, shoeS);
      }
      if (o.vest) { var V = cloth(o.vest); P.r(tx + 2, bt, tw - 2, tH, V.c); P.r(tx + tw - 2, bt, 2, tH, V.S); }
      if (o.apron) { var A = cloth(o.apron); P.r(cx - 5, bt + 3, 2, (L.sit ? sTop + 2 : sBot) - bt - 4, A.c); }
    } else {
      var sh = L.kid ? 5 : 6, belt = bt + sh, lTop = belt + (L.kid ? 0 : 1);
      P.r(tx, bt, tw, sh, T.c);
      if (fat) P.r(tx - 1, bt + 2, 2, sh - 2, T.c);
      P.r(tx + tw - 2, bt + 1, 2, sh - 1, T.S);
      P.r(tx, bt + 1, 1, sh - 1, T.L);
      if (!L.kid) P.r(tx, belt, tw, 1, "#3A2A26");
      if (L.sit) {
        P.r(cx - 7, lTop, 10, 2, pant.c); P.r(cx - 7, lTop + 2, 2, FY - lTop - 2, L.kid ? L.skS : pant.S);
        P.r(cx - 9, FY, 4, 2, shoe);
      } else {
        var short = L.kid ? 2 : 0;
        if (s === 0) {
          P.r(cx - 2, lTop, 4, FY - lTop, short ? L.sk : pant.c);
          if (short) P.r(cx - 3, lTop, 6, short, pant.c);
          P.r(cx + 1, lTop, 1, FY - lTop, short ? L.skS : pant.S);
        } else {
          var mid = lTop + ((FY - lTop) >> 1);
          var near = s === 1 ? (short ? L.sk : pant.c) : (short ? L.skS : pant.S), far = s === 1 ? (short ? L.skS : pant.S) : (short ? L.sk : pant.c);
          P.r(cx, lTop, 2, mid - lTop, far); P.r(cx + 1, mid, 2, FY - mid, far);
          P.r(cx - 2, lTop, 2, mid - lTop, near); P.r(cx - 3, mid, 2, FY - mid, near);
          if (short) P.r(cx - 3, lTop, 6, short, pant.c);
        }
        feetSide(P, cx, FY, s, shoe, shoeS);
      }
    }
    // the near arm swings with the step
    var sw = L.sit ? -2 : -s, ax = cx - 1 + sw;
    P.r(ax, bt + 1, 2, sleeve, T.c); P.p(ax + 1, bt + 1, T.S);
    if (sleeve < aLen) P.r(ax, bt + 1 + sleeve, 2, aLen - sleeve, L.sk);
    P.r(ax, bt + 1 + aLen, 2, 1, L.sk);
    L.hand = [ax, bt + 1 + aLen];
  }
  function feetSide(P, cx, FY, s, shoe, shoeS) {
    if (s === 0) { P.r(cx - 3, FY, 5, 2, shoe); P.p(cx - 3, FY, lt(shoe, 0.25)); return; }
    var front = s === 1 ? shoe : shoeS, back = s === 1 ? shoeS : shoe;
    P.r(cx + 1, FY, 3, 2, back);
    P.r(cx - 5, FY, 4, 2, front);
  }

  // the head: face, hair or headwear, eyes
  function headBox(P, cx, ht, col, side) {
    P.r(cx - 3, ht, 6, 1, col); P.r(cx - 4, ht + 1, 8, 1, col); P.r(cx - 5, ht + 2, 10, 6, col);
    if (side) { P.r(cx - 5, ht + 8, 9, 1, col); P.r(cx - 4, ht + 9, 7, 1, col); }
    else { P.r(cx - 4, ht + 8, 8, 1, col); P.r(cx - 3, ht + 9, 6, 1, col); }
  }
  function head(P, o, L) {
    var cx = L.cx, ht = L.ht, d = L.d, sk = L.sk, skS = L.skS;
    var hd = o.head || {}, hr = o.hair || { style: "short", c: "#2E2229" };
    var hc = hr.c || "#2E2229", hL = lt(hc, 0.28), hS = dk(hc, 0.3);
    var veil = hd.kind === "hijab" || hd.kind === "khimar";
    if (veil) { veilHead(P, o, L); return; }

    // face
    headBox(P, cx, ht, sk, d === 2);
    if (d === 0) { P.r(cx + 4, ht + 2, 1, 6, skS); P.p(cx + 3, ht + 8, skS); P.p(cx + 2, ht + 9, skS); }
    if (d === 2) { P.r(cx + 3, ht + 2, 2, 6, skS); P.p(cx - 6, ht + 6, sk); P.p(cx - 6, ht + 5, skS); }
    // ears
    if (d === 0) { P.r(cx - 6, ht + 5, 1, 2, sk); P.r(cx + 5, ht + 5, 1, 2, skS); }
    if (d === 1) { P.r(cx - 6, ht + 5, 1, 2, skS); P.r(cx + 5, ht + 5, 1, 2, skS); }

    // hair
    var st = hr.style;
    if (d === 1) { // back of the head
      if (st !== "bald") { P.r(cx - 3, ht, 6, 1, hc); P.r(cx - 4, ht + 1, 8, 1, hc); P.r(cx - 5, ht + 2, 10, 6, hc); P.r(cx - 4, ht + 8, 8, 1, hS); P.r(cx + 2, ht + 2, 3, 6, hS); P.r(cx - 2, ht + 1, 3, 1, hL); }
      if (st === "sides") { P.r(cx - 3, ht, 6, 4, sk); P.r(cx - 4, ht + 1, 8, 2, sk); P.p(cx - 2, ht + 1, lt(sk, 0.4)); }
      if (st === "braids") { P.r(cx - 6, ht + 6, 1, 7, hc); P.r(cx + 5, ht + 6, 1, 7, hS); P.r(cx - 1, ht + 8, 2, 5, hc); P.p(cx - 1, ht + 13, "#E8507A"); P.p(cx, ht + 13, "#E8507A"); }
      if (st === "curly") { P.p(cx - 4, ht - 1, hc); P.p(cx - 1, ht - 1, hc); P.p(cx + 2, ht - 1, hc); P.p(cx - 6, ht + 3, hc); P.p(cx + 5, ht + 4, hS); }
    } else if (d === 0) {
      if (st === "short" || st === "curly" || st === "braids" || st === "grey") {
        P.r(cx - 3, ht, 6, 1, hc); P.r(cx - 4, ht + 1, 8, 1, hc); P.r(cx - 5, ht + 2, 10, 1, hc);
        P.r(cx - 5, ht + 3, 4, 1, hc); P.r(cx + 1, ht + 3, 4, 1, hc);
        P.r(cx - 5, ht + 4, 1, 2, hc); P.r(cx + 4, ht + 4, 1, 2, hS);
        P.r(cx + 2, ht + 3, 3, 1, hS); P.r(cx - 2, ht + 1, 3, 1, hL); P.p(cx - 3, ht + 2, hL);
      }
      if (st === "curly") {
        P.p(cx - 4, ht - 1, hc); P.p(cx - 1, ht - 1, hc); P.p(cx + 2, ht - 1, hc);
        P.p(cx - 6, ht + 3, hc); P.p(cx + 5, ht + 3, hS); P.p(cx - 2, ht + 3, hc); P.p(cx - 2, ht + 4, hc); P.p(cx + 1, ht + 4, hc);
        P.p(cx - 1, ht, hL); P.p(cx + 1, ht + 1, hL);
      }
      if (st === "braids") {
        P.r(cx - 5, ht + 4, 1, 4, hc); P.r(cx + 4, ht + 4, 1, 4, hS);
        for (var b = 0; b < 7; b++) { P.p(cx - 6, ht + 6 + b, b % 2 ? hS : hc); P.p(cx + 5, ht + 6 + b, b % 2 ? hc : hS); }
        P.p(cx - 6, ht + 13, "#E8507A"); P.p(cx + 5, ht + 13, "#E8507A");
      }
      if (st === "sides") { P.r(cx - 5, ht + 3, 1, 3, hc); P.r(cx + 4, ht + 3, 1, 3, hS); P.p(cx - 2, ht + 1, lt(sk, 0.45)); P.p(cx - 1, ht + 1, lt(sk, 0.3)); }
    } else { // side, facing left
      if (st === "short" || st === "curly" || st === "braids" || st === "grey") {
        P.r(cx - 3, ht, 6, 1, hc); P.r(cx - 4, ht + 1, 8, 1, hc); P.r(cx - 5, ht + 2, 10, 1, hc); P.r(cx - 4, ht + 3, 9, 1, hc);
        P.r(cx + 1, ht + 4, 4, 3, hc); P.r(cx + 2, ht + 7, 2, 1, hS); P.r(cx + 3, ht + 4, 2, 3, hS); P.r(cx - 2, ht + 1, 3, 1, hL);
      }
      if (st === "curly") { P.p(cx - 3, ht - 1, hc); P.p(cx, ht - 1, hc); P.p(cx + 3, ht, hc); P.p(cx - 5, ht + 3, hc); P.p(cx + 5, ht + 3, hS); }
      if (st === "braids") { for (var bb = 0; bb < 7; bb++) P.p(cx + 4, ht + 7 + bb, bb % 2 ? hS : hc); P.p(cx + 4, ht + 14, "#E8507A"); }
      if (st === "sides") { P.r(cx + 1, ht + 3, 4, 4, hc); P.r(cx + 3, ht + 3, 2, 4, hS); P.p(cx - 1, ht + 1, lt(sk, 0.45)); }
      P.r(cx + 1, ht + 5, 1, 2, skS); // ear
    }

    // headwear on top
    var k = hd.kind;
    if (k === "taqiyah") {
      var tq = hd.c || "#F3EFE6", tqS = dk(tq, 0.16);
      P.r(cx - 3, ht, 6, 1, tq); P.r(cx - 4, ht + 1, 8, 1, tq); P.r(cx - 5, ht + 2, 10, 1, tq);
      P.r(cx + 2, ht + 1, 3, 2, tqS);
      for (var q = -5; q < 5; q += 2) P.p(cx + q, ht + 2, tqS);
    } else if (k === "cap") {
      var cp = hd.c || "#F6F3EC", cpS = dk(cp, 0.16);
      P.r(cx - 3, ht - 2, 6, 1, cp); P.r(cx - 5, ht - 1, 10, 3, cp); P.r(cx - 5, ht + 2, 10, 1, cpS);
      P.r(cx + 2, ht - 1, 3, 3, cpS); P.p(cx - 3, ht - 1, lt(cp, 0.5));
    } else if (k === "turban") {
      P.r(cx - 3, ht - 2, 6, 3, "#B8342E"); P.r(cx + 1, ht - 2, 2, 3, "#8E2523"); P.p(cx - 2, ht - 2, "#D6524A");
      P.r(cx - 6, ht + 1, 12, 3, "#F4F1E8"); P.r(cx + 2, ht + 1, 4, 3, "#D8D2C4"); P.r(cx - 6, ht + 2, 12, 1, "#E2DCCD");
    }

    // face details
    if (d !== 1) faceDetails(P, o, L, d === 2 ? [cx - 3] : [cx - 3, cx + 2], ht + 5);
  }

  function faceDetails(P, o, L, eyes, ey) {
    var cx = L.cx, ht = L.ht, side = L.d === 2, sk = L.sk, skS = L.skS;
    var blush = mix(sk, "#EC7A70", 0.42);
    if (o.glasses) { // thin round rims
      var gc = o.glasses === true ? "#7A6460" : o.glasses, glint = "#F4F0F6";
      eyes.forEach(function (x) { P.p(x - 1, ey, gc); P.p(x + 1, ey, gc); P.p(x - 1, ey + 1, gc); P.p(x + 1, ey + 1, gc); P.p(x + 1, ey, glint); });
      if (!side && eyes.length === 2) P.r(eyes[0] + 2, ey, eyes[1] - eyes[0] - 3, 1, gc);
      if (side) P.p(eyes[0] + 2, ey, gc);
    }
    eyes.forEach(function (x) {
      if (L.blink) P.p(x, ey + 1, EYE);
      else { P.r(x, ey, 1, 2, EYE); }
    });
    if (o.brows) eyes.forEach(function (x) { P.p(x, ey - 1, o.brows); P.p(x + (side ? -1 : x < cx ? -1 : 1), ey - 1, o.brows); });
    if (!side && eyes.length === 2) { P.p(eyes[0] - 1, ey + 2, blush); P.p(eyes[1] + 1, ey + 2, blush); }
    if (side) P.p(eyes[0] - 1, ey + 2, blush);
    var mouthY = ht + 8;
    if (o.mus) {
      var mc = o.mus;
      if (side) { P.r(cx - 6, ht + 7, 3, 1, mc); if (o.musBig) P.p(cx - 4, ht + 8, mc); }
      else { P.r(cx - 2, ht + 7, 4, 1, mc); if (o.musBig) { P.p(cx - 3, ht + 7, mc); P.p(cx + 2, ht + 7, mc); P.p(cx - 3, ht + 8, mc); P.p(cx + 2, ht + 8, mc); } }
    } else if (!side) { P.r(cx - 1, mouthY, 2, 1, dk(sk, 0.32)); }
    else P.p(cx - 5, mouthY, dk(sk, 0.32));
    if (o.beard) {
      var bc = o.beard;
      if (side) { P.r(cx - 5, ht + 8, 5, 1, bc); P.r(cx - 4, ht + 9, 4, 1, bc); P.p(cx - 2, ht + 7, bc); }
      else { P.r(cx - 3, ht + 9, 6, 1, bc); P.p(cx - 4, ht + 8, bc); P.p(cx + 3, ht + 8, bc); P.p(cx - 2, ht + 8, bc); P.p(cx + 1, ht + 8, bc); P.p(cx - 4, ht + 7, mix(bc, sk, 0.5)); P.p(cx + 3, ht + 7, mix(bc, sk, 0.5)); }
    }
  }

  function veilHead(P, o, L) {
    var cx = L.cx, ht = L.ht, d = L.d, sk = L.sk, skS = L.skS, hd = o.head;
    var V = cloth(hd.c), long = hd.kind === "khimar";
    var R = rng(7);
    // a rounded scarf, one pixel wider than the head, then a drape over the shoulders
    P.r(cx - 3, ht - 1, 6, 1, V.c); P.r(cx - 4, ht, 8, 1, V.c); P.r(cx - 5, ht + 1, 10, 1, V.c); P.r(cx - 6, ht + 2, 12, 8, V.c);
    var dBot = long ? ht + 17 : ht + 12;
    if (long) { P.r(cx - 6, ht + 10, 12, dBot - ht - 11, V.c); P.r(cx - 5, dBot - 1, 10, 1, V.c); }
    else P.r(cx - 5, ht + 10, 10, 2, V.c);
    // light on the upper left, shade on the right
    P.r(cx - 2, ht - 1, 3, 1, V.L); P.p(cx - 4, ht + 1, V.L); P.r(cx - 6, ht + 3, 1, 4, V.L);
    P.r(cx + 4, ht + 2, 2, 8, V.S); P.r(cx + 3, ht + 10, 2, dBot - ht - 11, V.S);
    if (long) P.r(cx + 4, ht + 10, 2, dBot - ht - 12, V.S);
    // pattern (a printed scarf)
    if (hd.pat) {
      for (var y = ht; y < dBot; y++) for (var x = cx - 6; x < cx + 6; x++) if (((x * 3 + y * 5) % 7 === 0) && R() < 0.85) P.p(x, y, hd.pat[(x + y) % hd.pat.length]);
    }
    if (d === 1) { P.r(cx, ht + 2, 1, dBot - ht - 3, V.S); return; }
    if (d === 0) {
      // the face opening
      P.r(cx - 3, ht + 3, 6, 1, sk); P.r(cx - 4, ht + 4, 8, 4, sk); P.r(cx - 3, ht + 8, 6, 1, sk); P.r(cx - 2, ht + 9, 4, 1, sk);
      P.r(cx + 3, ht + 4, 1, 4, skS); P.p(cx + 2, ht + 8, skS); P.p(cx + 1, ht + 9, skS);
      P.r(cx - 1, ht + 10, 3, 1, V.S); P.p(cx + 2, ht + 11, V.S); // fold from the chin to the shoulder
      faceDetails(P, o, L, [cx - 3, cx + 2], ht + 5);
    } else {
      P.r(cx - 5, ht + 3, 3, 1, sk); P.r(cx - 6, ht + 4, 5, 4, sk); P.r(cx - 5, ht + 8, 4, 1, sk); P.r(cx - 4, ht + 9, 2, 1, sk);
      P.p(cx - 7, ht + 6, sk);
      P.r(cx - 2, ht + 3, 1, 7, V.S);
      faceDetails(P, o, L, [cx - 4], ht + 5);
    }
  }

  function heldLantern(P, o, L) {
    var h = L.hand, d = L.d, x, y = h[1] + 1;
    if (d === 0) x = h[0] - 1; else if (d === 2) x = h[0] - 1; else x = L.tx0 - 3;
    var g = o.lantern === true ? GLASS[3] : o.lantern;
    P.p(x + 1, y, BRASS[2]);
    P.r(x, y + 1, 3, 1, BRASS[0]);
    P.r(x, y + 2, 3, 2, g); P.p(x + 1, y + 2, lt(g, 0.6)); P.p(x + 2, y + 3, dk(g, 0.2));
    P.r(x, y + 4, 3, 1, BRASS[2]); P.p(x + 1, y + 5, BRASS[0]);
    L.lan = [x + 1.5 - 11, y + 3 - 30];
  }

  // the musaharati's drum (بازة) on a strap across the chest, and the leather beater in the other hand
  function heldDrum(P, o, L) {
    var cx = L.cx, bt = L.bt, d = L.d, rim = "#8A5A2A", skin = "#F2E2BE";
    if (d === 1) { P.line(cx - 3, bt + 1, cx + 2, bt + 6, "#6A3E22"); return; } // from behind: just the strap
    P.line(cx - 3, bt, cx + 2, bt + 5, "#6A3E22");
    if (d === 0) {
      P.el(cx - 4, bt + 5, 8, 5, rim); P.el(cx - 3, bt + 5, 6, 3, skin); P.p(cx - 2, bt + 5, "#FFF8E4");
      P.r(cx + 4, bt + 1, 1, 6, "#4A2E1E"); // the beater
    } else {
      var hx = L.hand[0];
      P.r(hx - 2, bt + 4, 3, 6, rim); P.r(hx + 1, bt + 4, 1, 6, skin); P.p(hx + 1, bt + 4, "#FFF8E4");
      P.r(hx + 2, bt + 2, 1, 4, "#4A2E1E");
    }
  }

  /* ================= animals ================= */
  var CATS = {
    ginger: { b: "#E8964A", d: "#C46E33", l: "#F7DDBB" },
    grey: { b: "#9E99A8", d: "#77727F", l: "#E4E0E6" },
    calico: { b: "#F2E8DA", d: "#E08A44", l: "#FFFFFF", s: "#3B3238" },
    black: { b: "#3E3644", d: "#2C2531", l: "#5B5263" }
  };
  function cat(coat) {
    var c = CATS[coat] || CATS.ginger, pal = { b: c.b, d: c.d, l: c.l, e: "#9FD36A", n: "#F09AA0", s: c.s || c.d, k: "#2A1A2C" };
    var walkA = [
      ".b.b.........",
      ".bbbb.......d",
      "nkbbb.......d",
      ".lbbbbbbdbbd.",
      "..lbbdbbdbbb.",
      "..lbbbbbbbb..",
      "..b.b...b.b..",
      "..b.b...b.b.."];
    var walkB = walkA.slice(0, 6).concat([
      "...bb...bb...",
      "...b.....b..."]);
    var sitRows = [
      ".b.b.....",
      ".bbbb....",
      "nkbbb....",
      ".lbbbb...",
      ".lbbdbb..",
      ".lbbbdb..",
      ".lbbbbbb.",
      ".lb.bbbbd",
      ".lb.bbdd."];
    var sleepRows = [
      "....b.b....",
      "..bbbbbbb..",
      ".bbdbbdbbbd",
      "lbbbbbbbbbd",
      ".llbbbbbbd."];
    function make(rows) { return outline((function () { var cc = cv(rows[0].length + 2, rows.length + 2); Pt(cc).map(1, 1, rows, pal); return cc; })()); }
    var w = [make(walkA), make(walkB)], s = make(sitRows), z = make(sleepRows);
    return { walk: [w, w.map(flip)], sit: [s, flip(s)], sleep: z };
  }
  function pigeon(tint) {
    var g = tint || "#9C98A6", pal = { g: g, G: dk(g, 0.25), w: lt(g, 0.4), i: "#5FA7A0", j: "#8B6FB0", e: "#E8603C", k: "#E9D9C8", f: "#E07A80" };
    var stand = [
      ".gg....",
      "kegi...",
      ".gjggg.",
      "..wgGGG",
      "..gGGG.",
      "...f.f."];
    var peck = [
      ".......",
      "..gg...",
      ".kegig.",
      "..jgGGG",
      "..gGGG.",
      "...f.f."];
    var fly1 = [
      "....GG...",
      "...GgG...",
      "kegggggGG",
      "..gggGG..",
      "........."];
    var fly2 = [
      ".........",
      ".........",
      "keggggGGG",
      "..gGgGG..",
      "...GG...."];
    function make(rows) { var cc = cv(rows[0].length + 2, rows.length + 2); Pt(cc).map(1, 1, rows, pal); return outline(cc, 0.5); }
    var a = [make(stand), make(peck), make(fly1), make(fly2)];
    return { L: a, R: a.map(flip) };
  }

  /* ================= props ================= */
  var PROPS = {};
  function prop(name, o) { var f = PROPS[name]; return f ? f(o || {}) : null; }

  // round flatbread (عيش بلدي)
  function loaf(P, x, y, R) { P.el(x, y, 6, 3, "#D9A25E"); P.p(x + 1, y, "#EFC88A"); P.p(x + 2, y, "#EFC88A"); P.p(x + 3 + ((R() * 2) | 0), y + 1, "#B57A3E"); }

  // عربية عم سيد: the copper pot on the left, his plates and bread in the middle where he stands,
  // his son's ta'meya pan on the right, a gas cylinder underneath, a bulb and a little fanoos on the pole.
  // The front panel is left plain cream for the painted name (drawn as a sign in js/hara-world.js).
  PROPS.fulCart = function () {
    return sprite(50, 44, function (P) {
      var R = rng(11), i;
      // wheels, and the butane cylinder between them
      P.el(4, 33, 10, 10, "#4A3328"); P.el(6, 35, 6, 6, "#7A5A44"); P.p(8, 37, "#4A3328");
      P.el(36, 33, 10, 10, "#4A3328"); P.el(38, 35, 6, 6, "#7A5A44"); P.p(40, 37, "#4A3328");
      P.r(21, 32, 8, 10, "#4F7FA6"); P.r(22, 33, 1, 8, "#7FA8C8"); P.r(21, 41, 8, 1, "#3A5F80"); P.r(24, 31, 2, 1, "#C9C2B6");
      // the box: green, a yellow band with red diamonds, a cream panel for the name
      P.r(2, 24, 46, 10, "#2F8A5A"); P.r(2, 24, 46, 1, "#4FAE78"); P.r(2, 32, 46, 2, "#22683F");
      P.dots(2, 25, 46, 7, ["#2A7A50", "#38966A"], 20, R);
      P.r(2, 26, 46, 1, "#F2C14A"); P.r(2, 31, 46, 1, "#F2C14A");
      for (i = 4; i < 14; i += 4) { P.p(i, 28, "#D2413A"); P.p(i + 1, 27, "#D2413A"); P.p(i + 1, 29, "#D2413A"); P.p(i + 2, 28, "#D2413A"); P.p(i + 1, 28, "#F2C14A"); }
      for (i = 37; i < 47; i += 4) { P.p(i, 28, "#D2413A"); P.p(i + 1, 27, "#D2413A"); P.p(i + 1, 29, "#D2413A"); P.p(i + 2, 28, "#D2413A"); P.p(i + 1, 28, "#F2C14A"); }
      P.r(15, 26, 20, 6, "#F4E6C4"); P.r(15, 26, 20, 1, "#C8443A"); P.r(15, 31, 20, 1, "#C8443A");
      P.r(1, 22, 48, 2, "#C9C2B6"); P.r(1, 22, 48, 1, "#EDE8DE"); // steel top
      // the copper pot (قدرة الفول), sunk into the cart, a ladle resting in it
      P.el(4, 8, 16, 15, "#C98A3A"); P.el(5, 9, 9, 8, "#E2A95A"); P.p(7, 10, "#FFE1A0"); P.p(8, 10, "#FFE1A0"); P.el(13, 13, 6, 8, "#A86C2C");
      P.r(7, 5, 10, 4, "#B97B33"); P.r(8, 4, 8, 1, "#D9A050"); P.r(10, 3, 4, 1, "#8A5A24");
      P.r(3, 20, 18, 2, "#8A5A24");
      P.p(16, 4, "#9AA0A8"); P.p(17, 3, "#9AA0A8"); P.p(18, 2, "#9AA0A8"); P.p(19, 1, "#B8C0C8");
      // the middle: a stack of enamel plates, a basket of bread, a lemon
      for (i = 0; i < 3; i++) { P.r(22, 17 + i * 2, 7, 1, "#F4EFE6"); P.r(22, 18 + i * 2, 7, 1, "#3E78C2"); }
      P.el(29, 16, 7, 6, "#B98A55"); P.r(30, 16, 5, 1, "#D9AA70"); P.el(30, 14, 4, 3, "#E0AE6A"); P.p(31, 14, "#F0C888");
      P.el(32, 20, 3, 2, "#F2D06A");
      // the ta'meya pan on its burner: black rim, golden oil, discs frying
      P.r(38, 21, 8, 1, "#5A5560");
      P.el(35, 15, 13, 7, "#2A2428"); P.el(36, 16, 11, 4, "#C99A3A"); P.r(38, 16, 6, 1, "#E8C060");
      P.el(37, 17, 3, 2, "#7A4A22"); P.el(41, 16, 3, 2, "#8A5A28"); P.el(43, 18, 3, 2, "#6A3E1E");
      // the pole: a bulb and a small fanoos hang from it
      P.r(48, 1, 1, 21, "#5A4030"); P.r(40, 1, 9, 1, "#5A4030");
      P.p(41, 2, "#5A4030"); P.r(40, 3, 3, 2, "#FFF1B8"); P.p(41, 5, "#FFE08A");
      P.p(45, 2, "#5A4030"); P.r(44, 3, 3, 1, "#C8963E"); P.r(44, 4, 3, 3, "#E8503F"); P.p(45, 5, "#FFD25A"); P.p(45, 7, "#C8963E");
    }, [1, 38, 48, 6]);
  };

  // a round tin table by the ful cart; o.set: plates of ful, bread, ta'meya and pickles (after maghrib)
  PROPS.fulTable = function (o) {
    return sprite(14, 12, function (P) {
      P.r(6, 6, 2, 5, "#7A7680"); P.r(3, 10, 8, 1, "#7A7680");
      P.el(0, 2, 14, 6, "#2F8A7A"); P.el(1, 2, 12, 4, "#4FAE9C"); P.r(3, 7, 8, 1, "#22685C");
      if (o.set) {
        P.el(1, 2, 6, 3, "#F4EFE6"); P.el(2, 2, 4, 2, "#9A5A2E"); P.p(3, 2, "#E8B040");
        P.el(8, 1, 5, 3, "#D9A25E"); P.p(10, 1, "#EFC88A");
        P.p(5, 5, "#F08A2A"); P.p(6, 5, "#6EBE58"); P.p(9, 5, "#7A4A22"); P.p(10, 4, "#7A4A22");
        P.r(12, 3, 1, 2, "#BFE0E8");
      }
    }, [1, 9, 12, 3, 0.22]);
  };

  PROPS.breadRack = function (o) {
    var tiers = o.tiers || 3;
    return sprite(20, 6 + tiers * 6, function (P, w, h) {
      var R = rng(o.seed || 5);
      for (var t = 0; t < tiers; t++) {
        var y = h - 5 - (t + 1) * 6;
        P.r(1, y, 18, 6, "#C9A46A"); P.r(1, y, 18, 1, "#E2C38C"); P.r(1, y + 5, 18, 1, "#9C7A48");
        for (var i = 1; i < 18; i += 3) P.r(i, y + 1, 1, 4, "#A8844E");
        loaf(P, 2, y + 1, R); loaf(P, 7, y + 2, R); loaf(P, 12, y + 1, R);
      }
      P.r(2, h - 5, 2, 4, "#7A5A3A"); P.r(16, h - 5, 2, 4, "#7A5A3A");
    }, [0, 0, 20, 4]);
  };

  PROPS.chair = function (o) { // plastic chair; o.c colour, o.f: 0 front, 2 left, 3 right
    var col = o.c || "#D8473C", S = dk(col, 0.25), Lc = lt(col, 0.25);
    var c = sprite(10, 14, function (P) {
      if (o.f === 2 || o.f === 3) {
        P.r(6, 1, 2, 8, col); P.r(6, 1, 1, 8, Lc); // back
        P.r(2, 7, 6, 2, col); P.r(2, 7, 6, 1, Lc);
        P.r(2, 9, 1, 4, S); P.r(7, 9, 1, 4, S);
      } else {
        P.r(2, 1, 6, 6, col); P.r(2, 1, 6, 1, Lc); P.r(3, 3, 4, 2, S);
        P.r(1, 7, 8, 2, col); P.r(1, 7, 8, 1, Lc);
        P.r(1, 9, 1, 4, S); P.r(8, 9, 1, 4, S);
      }
    }, [1, 11, 8, 3, 0.22]);
    return o.f === 3 ? flip(c) : c;
  };

  PROPS.cafeTable = function (o) {
    return sprite(12, 12, function (P) {
      P.r(5, 5, 2, 5, "#5A5560"); P.r(3, 9, 6, 1, "#5A5560");
      P.el(1, 3, 10, 4, "#C9CDD3"); P.el(2, 3, 8, 2, "#E6E9EC");
      // tea glasses, once the cannon has gone (o.set 0: an empty table while people fast)
      if (o.set !== 0) { P.r(3, 1, 2, 3, "#C2552E"); P.p(3, 1, "#F2E2C8"); P.r(7, 2, 2, 2, "#C2552E"); P.p(7, 2, "#F2E2C8"); }
      if (o.tawla) { P.r(2, 3, 8, 2, "#8A5435"); P.p(4, 3, "#F4EFE6"); P.p(7, 4, "#2A1A2C"); }
    }, [1, 9, 10, 3, 0.22]);
  };

  PROPS.shisha = function (o) {
    o = o || {};
    return sprite(8, 18, function (P) {
      P.el(1, 11, 6, 6, "#6FB7C9"); P.el(2, 12, 3, 3, "#A6DCE8"); P.p(2, 12, "#FFFFFF");
      P.r(3, 4, 2, 8, "#C8963E"); P.r(3, 4, 1, 8, "#F2C76C");
      P.r(2, 2, 4, 2, "#B5473B"); P.r(2, 1, 4, 1, "#7A3A30"); if (o.set !== 0) { P.p(3, 1, "#FF8A3D"); P.p(4, 1, "#FFC24A"); } // the coal is lit after iftar
      P.r(5, 9, 2, 1, "#3A2A26"); P.p(7, 10, "#3A2A26");
    }, [0, 15, 8, 3, 0.22]);
  };

  PROPS.iftarTable = function (o) {
    var w = o.w || 72, set = !!o.set;
    return sprite(w, 26, function (P) {
      var R = rng(w + (set ? 1 : 0));
      // chairs on the far side
      for (var x = 4; x < w - 6; x += 9) { var cc = pick(R, ["#D8473C", "#3E78C2", "#F2F0EA", "#3F9A62"]); if (o.noChairs) continue; P.r(x, 2, 6, 7, cc); P.r(x, 2, 6, 1, lt(cc, 0.3)); P.r(x + 1, 4, 4, 2, dk(cc, 0.2)); }
      // table with a white cloth and a khayameya runner
      P.r(1, 9, w - 2, 9, "#F4EFE4"); P.r(1, 9, w - 2, 1, "#FFFFFF"); P.r(1, 16, w - 2, 2, "#D9D1C2");
      P.r(1, 12, w - 2, 3, "#C8443A");
      for (var i = 2; i < w - 2; i += 4) { P.p(i, 13, "#F2C14A"); P.p(i + 2, 12, "#2F5D9A"); P.p(i + 2, 14, "#2F5D9A"); }
      P.r(1, 18, w - 2, 1, "#B9AE9C");
      for (var lx = 3; lx < w; lx += Math.max(16, (w - 6) / 3)) P.r(Math.round(lx), 19, 2, 6, "#8A7A66");
      if (set) for (var px = 4; px < w - 6; px += 9) {
        P.el(px, 9, 6, 3, "#FFFFFF"); P.el(px + 1, 9, 4, 2, pick(R, ["#C98A3A", "#E8C26A", "#D9653A", "#9C6B3A"]));
        if (R() < 0.55) { P.r(px + 6, 7, 2, 4, pick(R, ["#B8233A", "#E88A2A", "#6A3A20"])); P.p(px + 6, 7, "#FFFFFF"); }
        else { P.p(px + 6, 10, "#5A2A1E"); P.p(px + 7, 10, "#6A3420"); }
      }
    }, [0, 21, w, 5, 0.25]);
  };

  PROPS.palm = function (o) {
    var sw = o.sway || 0, tall = o.tall || 54;
    return sprite(56, tall + 10, function (P, w, h) {
      var base = h - 3, cx = 28, top = 16;
      // trunk: a gentle curve with a ringed, diamond bark
      for (var y = top; y < base; y++) {
        var t = (y - top) / (base - top), x = Math.round(cx - 1 + Math.sin(t * 2.4) * 2.5), tw = t > 0.85 ? 6 : 5;
        P.r(x - 2, y, tw, 1, "#A07448"); P.p(x - 2, y, "#C49A68"); P.p(x + tw - 3, y, "#73502F"); P.p(x + tw - 2, y, "#5E3E26");
        if (y % 3 === 0) { P.r(x - 1, y, tw - 2, 1, "#86603C"); P.p(x, y, "#C49A68"); }
      }
      P.r(cx - 6, base - 1, 12, 2, "#73502F");
      // dates hanging under the crown
      P.el(cx - 8, top, 6, 7, "#D9762E"); P.p(cx - 7, top + 1, "#F2A24A"); P.p(cx - 5, top + 3, "#A8521E");
      P.el(cx + 2, top + 1, 6, 6, "#C2552E"); P.p(cx + 3, top + 2, "#E8823E");
      // fronds: long arcs that droop at the tips, darker underneath
      var fr = [[-25, 6], [-22, -4], [-15, -11], [-6, -15], [4, -15], [13, -11], [21, -4], [25, 6], [-18, 12], [19, 12]];
      fr.forEach(function (f, i) {
        var ex = cx + f[0] + (i % 2 ? sw : -sw), ey = top + f[1] + Math.abs(sw);
        var n = 20;
        for (var s = 0; s <= n; s++) {
          var t = s / n, x = Math.round(cx + (ex - cx) * t), y = Math.round(top + (ey - top) * t - Math.sin(t * Math.PI) * 5 + (t > 0.65 ? (t - 0.65) * 14 : 0));
          var col = i % 2 ? LEAF[0] : LEAF[1];
          P.p(x, y, s % 4 === 0 ? LEAF[3] : col);
          P.p(x, y + 1, i % 2 ? LEAF[2] : LEAF[0]);
          if (s > 2 && s < n && s % 2) { var side = f[0] < 0 ? -1 : 1; P.p(x + side, y + 2, LEAF[2]); P.p(x - side, y + 2, LEAF[4]); }
        }
      });
      P.el(cx - 5, top - 3, 10, 7, LEAF[0]); P.el(cx - 3, top - 3, 5, 3, LEAF[3]);
    }, [16, tall + 4, 24, 6, 0.25]);
  };

  PROPS.tree = function (o) { // a big shady ficus for the kids' square
    var sw = o.sway || 0;
    return sprite(56, 60, function (P) {
      var R = rng(31);
      P.r(25, 34, 6, 23, "#7A5236"); P.r(25, 34, 2, 23, "#9C7048"); P.r(29, 36, 2, 21, "#5E3E2A");
      P.r(22, 54, 12, 3, "#6A4630"); P.p(21, 56, "#6A4630"); P.p(34, 56, "#6A4630");
      P.line(27, 40, 18, 30, "#7A5236"); P.line(29, 38, 38, 29, "#7A5236");
      var blobs = [[4, 14, 20, 18], [16, 4, 24, 20], [30, 8, 22, 20], [8, 22, 22, 16], [26, 22, 26, 16], [18, 16, 22, 18]];
      blobs.forEach(function (b) { P.el(b[0] + sw, b[1], b[2], b[3], LEAF[2]); });
      blobs.forEach(function (b) { P.el(b[0] + 1 + sw, b[1] + 1, b[2] - 3, b[3] - 4, LEAF[0]); });
      [[8, 15, 12, 9], [19, 5, 14, 10], [33, 9, 12, 9], [22, 17, 10, 7]].forEach(function (b) { P.el(b[0] + sw, b[1], b[2], b[3], LEAF[1]); });
      [[10, 15, 5, 3], [21, 6, 6, 3], [35, 10, 5, 3]].forEach(function (b) { P.el(b[0] + sw, b[1], b[2], b[3], LEAF[3]); });
      P.dots(6 + sw, 8, 44, 28, [LEAF[2], LEAF[4]], 60, R);
      P.dots(8 + sw, 6, 40, 14, [LEAF[3], LEAF[1]], 26, R);
    }, [12, 53, 34, 7, 0.3]);
  };

  PROPS.lamp = function () {
    return sprite(11, 44, function (P) {
      P.r(4, 12, 2, 29, "#2E4A4A"); P.r(4, 12, 1, 29, "#4A6E6C");
      P.r(3, 38, 4, 4, "#2E4A4A"); P.r(2, 41, 6, 1, "#243A3A");
      P.r(4, 9, 2, 3, "#2E4A4A"); P.r(1, 7, 8, 2, "#243A3A");
      P.r(2, 1, 6, 6, "#FFD77A"); P.r(2, 1, 6, 1, "#2E4A4A"); P.p(4, 2, "#FFF4C8"); P.r(2, 6, 6, 1, "#2E4A4A");
      P.r(4, 0, 2, 1, "#2E4A4A"); P.r(1, 1, 1, 6, "#2E4A4A"); P.r(8, 1, 1, 6, "#2E4A4A");
    }, [2, 40, 7, 3, 0.22]);
  };

  PROPS.gas = function () {
    return sprite(8, 13, function (P) {
      P.r(1, 3, 6, 8, "#3F7FB0"); P.r(1, 3, 2, 8, "#5E9CC8"); P.r(5, 3, 2, 8, "#2E5F88"); P.r(1, 3, 6, 1, "#7AB4DC");
      P.r(3, 1, 2, 2, "#9AA0A8"); P.r(2, 0, 4, 1, "#C9CDD3");
    }, [1, 10, 7, 3, 0.25]);
  };

  PROPS.crate = function (o) {
    var fruit = o.fruit || "#F08A2A";
    return sprite(14, 12, function (P) {
      var R = rng(o.seed || 3);
      P.r(1, 4, 12, 7, "#B98A55"); P.r(1, 4, 12, 1, "#D9AA70"); P.r(1, 7, 12, 1, "#8A6238"); P.r(1, 10, 12, 1, "#7A5230");
      P.r(1, 4, 1, 7, "#8A6238"); P.r(12, 4, 1, 7, "#7A5230");
      for (var i = 0; i < 8; i++) { var x = 2 + ((R() * 9) | 0), y = 1 + ((R() * 3) | 0); P.el(x, y, 3, 3, fruit); P.p(x, y, lt(fruit, 0.4)); }
    }, [0, 9, 14, 3, 0.25]);
  };

  PROPS.sacks = function () {
    return sprite(16, 12, function (P) {
      P.el(1, 2, 8, 9, "#E8DFCB"); P.el(2, 3, 4, 5, "#F6F0E2"); P.r(3, 6, 3, 2, "#5A7AB0");
      P.el(7, 1, 8, 10, "#DED3BC"); P.el(8, 2, 4, 5, "#F1EADB"); P.r(10, 5, 3, 2, "#5A7AB0");
      P.r(3, 1, 3, 1, "#C9BDA6"); P.r(9, 0, 3, 1, "#C9BDA6");
    }, [0, 9, 16, 3, 0.25]);
  };

  PROPS.planks = function () {
    return sprite(14, 28, function (P) {
      var cols = ["#C08A5A", "#A8714A", "#D29A66", "#9A6440"];
      for (var i = 0; i < 4; i++) { var x = 1 + i * 3; P.r(x, 1 + i, 3, 26 - i, cols[i]); P.r(x, 1 + i, 1, 26 - i, lt(cols[i], 0.2)); P.p(x + 1, 8 + i * 3, dk(cols[i], 0.3)); }
    }, [0, 25, 14, 3, 0.2]);
  };

  PROPS.sawhorse = function () {
    return sprite(20, 12, function (P) {
      P.r(1, 2, 18, 2, "#C08A5A"); P.r(1, 2, 18, 1, "#D9A774");
      P.line(3, 4, 1, 10, "#8A5A3A"); P.line(5, 4, 7, 10, "#8A5A3A"); P.line(14, 4, 12, 10, "#8A5A3A"); P.line(16, 4, 18, 10, "#8A5A3A");
      P.r(8, 0, 4, 2, "#E2D6BE"); // wood shavings
    }, [0, 9, 20, 3, 0.22]);
  };

  PROPS.zeer = function () { // a clay water jar for passers-by (سبيل)
    return sprite(14, 22, function (P) {
      P.r(2, 12, 1, 9, "#3A3030"); P.r(11, 12, 1, 9, "#3A3030"); P.r(2, 12, 10, 1, "#3A3030"); P.r(3, 18, 8, 1, "#3A3030");
      P.el(2, 3, 10, 12, "#C9784A"); P.el(3, 4, 4, 6, "#E09A68"); P.el(4, 11, 7, 4, "#9E5636");
      P.r(4, 1, 6, 2, "#B5643C"); P.r(3, 0, 8, 1, "#8A5A3A"); P.r(3, 0, 8, 1, "#9C6B45");
      P.r(12, 6, 2, 3, "#C9CDD3"); P.p(12, 5, "#8A8E94");
    }, [1, 19, 12, 3, 0.25]);
  };

  PROPS.goal = function () {
    return sprite(8, 7, function (P) { P.r(1, 3, 6, 3, "#C2553A"); P.r(1, 3, 6, 1, "#E07A58"); P.r(2, 1, 5, 2, "#B04A34"); P.r(2, 1, 5, 1, "#D86A4C"); }, [0, 5, 8, 2, 0.2]);
  };

  PROPS.pot = function (o) {
    var fl = o.flower;
    return sprite(9, 11, function (P) {
      P.r(2, 6, 5, 4, "#C9683E"); P.r(1, 5, 7, 2, "#DB7E50"); P.r(5, 6, 2, 4, "#A8522E");
      P.el(1, 0, 7, 6, LEAF[0]); P.p(3, 1, LEAF[3]); P.p(5, 2, LEAF[2]);
      if (fl) { P.p(2, 1, fl); P.p(5, 0, fl); P.p(6, 3, fl); P.p(3, 3, lt(fl, 0.4)); }
    }, [1, 8, 7, 3, 0.2]);
  };

  PROPS.bench = function () {
    return sprite(26, 10, function (P) {
      P.r(1, 2, 24, 3, "#E3D2B0"); P.r(1, 2, 24, 1, "#F3E6CB"); P.r(1, 4, 24, 1, "#C4AE88");
      P.r(3, 5, 3, 4, "#C4AE88"); P.r(20, 5, 3, 4, "#C4AE88");
    }, [0, 7, 26, 3, 0.2]);
  };

  PROPS.shoes = function () {
    return sprite(18, 5, function (P) {
      var cs = ["#3A2A26", "#7A4A30", "#2F4A7A", "#E8E2D6", "#5A3A2C", "#B5473B"];
      for (var i = 0; i < 6; i++) { P.r(1 + i * 3, 1 + (i % 2), 2, 2, cs[i]); }
    });
  };

  PROPS.grill = function () {
    return sprite(24, 18, function (P) {
      P.r(2, 12, 1, 5, "#3A3434"); P.r(21, 12, 1, 5, "#3A3434");
      P.r(1, 6, 22, 6, "#5A5456"); P.r(1, 6, 22, 1, "#8A8488"); P.r(1, 11, 22, 1, "#3A3434");
      P.r(2, 4, 20, 2, "#2A2224");
      for (var x = 3; x < 21; x += 2) P.p(x, 4, x % 4 ? "#FF7A2A" : "#FFC04A");
      for (var s = 0; s < 6; s++) { P.r(2, 1 + (s % 2), 20, 1, "#A8A0A0"); P.r(4 + s * 3, 2 + (s % 2) * 0, 2, 2, "#7A3A20"); }
      P.r(3, 2, 18, 1, "#B9B2B2");
      for (var k = 0; k < 5; k++) P.r(4 + k * 4, 2, 3, 2, "#8A4024");
    }, [0, 15, 24, 3, 0.25]);
  };

  PROPS.tuktuk = function () {
    return sprite(34, 28, function (P) {
      // canopy and body (side view, nose to the left)
      P.r(9, 2, 22, 3, "#2F5D9A"); P.r(9, 2, 22, 1, "#5A86C4");
      for (var i = 9; i < 31; i += 2) P.p(i, 5, i % 4 ? "#F2C14A" : "#E8503F"); // fringe
      P.r(10, 5, 1, 9, "#3A3434"); P.r(29, 5, 1, 9, "#3A3434");
      P.r(5, 13, 27, 8, "#D23B33"); P.r(5, 13, 27, 1, "#F06A5A"); P.r(5, 19, 27, 2, "#A82A26");
      P.r(1, 12, 9, 7, "#D23B33"); P.r(1, 12, 9, 1, "#F06A5A"); P.r(2, 8, 6, 5, "#A8D8E8"); P.r(2, 8, 6, 1, "#E8F6FA");
      P.r(12, 7, 10, 6, "#2A2234"); P.r(14, 9, 4, 4, "#E8E2D6"); // seat
      P.r(6, 15, 3, 2, "#F2C14A"); P.r(14, 15, 14, 1, "#F2C14A");
      P.el(3, 19, 7, 7, "#2A2224"); P.el(5, 21, 3, 3, "#9AA0A8");
      P.el(24, 19, 7, 7, "#2A2224"); P.el(26, 21, 3, 3, "#9AA0A8");
      P.r(1, 14, 1, 2, "#FFE7A0");
    }, [1, 23, 32, 5, 0.3]);
  };

  PROPS.bicycle = function () {
    return sprite(24, 15, function (P) {
      P.el(1, 6, 8, 8, "#3A3434"); P.el(3, 8, 4, 4, "rgba(0,0,0,0)");
      P.el(15, 6, 8, 8, "#3A3434");
      var g = P.g; g.clearRect(3, 8, 4, 4); g.clearRect(17, 8, 4, 4);
      P.line(5, 10, 10, 4, "#3E78C2"); P.line(10, 4, 18, 4, "#3E78C2"); P.line(10, 4, 12, 10, "#3E78C2"); P.line(12, 10, 19, 10, "#3E78C2"); P.line(18, 4, 19, 10, "#3E78C2");
      P.r(8, 2, 4, 1, "#2A2224"); P.r(17, 1, 1, 3, "#5A5456"); P.r(16, 1, 3, 1, "#5A5456");
      P.r(11, 3, 9, 2, "#C9A46A"); // a bread tray on the rack
    }, [0, 12, 24, 3, 0.2]);
  };

  PROPS.bigLantern = function () { // a tall Ramadan fanous on a stand
    return sprite(22, 42, function (P) {
      var cols = [GLASS[0], GLASS[3], GLASS[1], GLASS[2]];
      P.r(10, 1, 2, 3, BRASS[0]); P.p(9, 0, BRASS[1]); P.p(12, 0, BRASS[1]); // crescent finial
      P.el(5, 3, 12, 7, BRASS[0]); P.el(6, 3, 8, 4, BRASS[1]);
      P.r(4, 9, 14, 2, BRASS[2]);
      for (var i = 0; i < 4; i++) { P.r(5 + i * 3, 11, 3, 13, cols[i]); P.r(5 + i * 3, 11, 1, 13, lt(cols[i], 0.4)); P.p(6 + i * 3, 14, lt(cols[i], 0.7)); P.p(6 + i * 3, 19, dk(cols[i], 0.25)); }
      P.r(4, 11, 1, 13, BRASS[2]); P.r(17, 11, 1, 13, BRASS[2]); for (var j = 7; j < 17; j += 3) P.r(j, 11, 1, 13, BRASS[0]);
      P.r(4, 16, 14, 1, BRASS[0]);
      P.r(4, 24, 14, 2, BRASS[2]); P.r(6, 26, 10, 2, BRASS[0]); P.r(9, 28, 4, 2, BRASS[2]);
      P.r(10, 30, 2, 9, "#5A4030"); P.r(6, 39, 10, 2, "#5A4030");
    }, [3, 38, 16, 4, 0.25]);
  };

  PROPS.sabil = function () { // a small stone fountain with a brass tap
    return sprite(30, 28, function (P) {
      P.r(5, 2, 20, 16, "#E3D2B0"); P.r(5, 2, 20, 1, "#F3E6CB"); P.r(22, 3, 3, 15, "#C9B48F");
      P.el(9, 4, 12, 10, "#B8A27C"); P.r(9, 9, 12, 8, "#B8A27C"); P.el(10, 5, 10, 8, "#3F7F86"); P.r(10, 9, 10, 8, "#3F7F86");
      for (var i = 0; i < 4; i++) P.p(11 + i * 3, 7, "#5FB0A8");
      P.r(14, 11, 2, 3, BRASS[0]); P.p(14, 11, BRASS[1]);
      P.r(2, 18, 26, 5, "#D7C49F"); P.r(2, 18, 26, 1, "#F1E3C2"); P.r(4, 19, 22, 3, "#4F9AAA"); P.r(4, 19, 22, 1, "#86C8D2");
      P.r(2, 23, 26, 2, "#B39E7A");
    }, [0, 23, 30, 5, 0.25]);
  };

  PROPS.tent = function (o) { // a khayameya backdrop for the iftar tables
    var w = o.w || 100;
    return sprite(w, 34, function (P) {
      var cols = ["#C8443A", "#2F5D9A", "#F2C14A", "#3F8F5F"];
      P.r(1, 4, w - 2, 26, "#F1E3C0");
      for (var x = 1; x < w - 1; x += 12) {
        var c1 = cols[(x / 12 | 0) % 4], c2 = cols[((x / 12 | 0) + 2) % 4];
        P.r(x, 6, 12, 22, c1);
        P.el(x + 2, 9, 8, 14, "#F1E3C0"); P.el(x + 4, 12, 4, 8, c2); P.p(x + 5, 15, "#F1E3C0"); P.p(x + 6, 16, "#F1E3C0");
        P.r(x, 6, 12, 1, "#F2C14A"); P.r(x, 27, 12, 1, "#F2C14A");
        P.r(x, 6, 1, 22, "#F1E3C0");
      }
      for (var s = 1; s < w - 1; s += 4) { P.r(s, 1, 4, 3, s % 8 ? "#C8443A" : "#2F5D9A"); P.p(s + 1, 4, s % 8 ? "#C8443A" : "#2F5D9A"); P.p(s + 2, 4, s % 8 ? "#C8443A" : "#2F5D9A"); }
      P.r(0, 0, 2, 32, "#7A5236"); P.r(w - 2, 0, 2, 32, "#7A5236");
    });
  };

  /* roof things */
  PROPS.tank = function (o) {
    var col = o.c || "#2E2A30";
    return sprite(12, 15, function (P) {
      P.r(1, 10, 10, 3, "#8A8E94"); P.r(2, 13, 1, 1, "#6A6E74"); P.r(9, 13, 1, 1, "#6A6E74");
      P.r(1, 2, 10, 9, col); P.r(1, 2, 3, 9, lt(col, 0.18)); P.r(8, 2, 3, 9, dk(col, 0.2));
      P.el(1, 0, 10, 4, lt(col, 0.12)); P.el(3, 1, 6, 2, dk(col, 0.1));
      P.r(1, 5, 10, 1, dk(col, 0.25));
    }, [0, 11, 12, 3, 0.25]);
  };
  PROPS.dish = function () {
    return sprite(11, 11, function (P) {
      P.r(5, 6, 1, 4, "#8A8E94"); P.r(3, 9, 5, 1, "#6A6E74");
      P.el(1, 0, 9, 8, "#D6D9DE"); P.el(2, 1, 6, 5, "#B9BEC6"); P.p(3, 2, "#F2F4F6");
      P.line(5, 4, 8, 6, "#6A6E74");
    }, [1, 8, 9, 3, 0.2]);
  };
  PROPS.coop = function () { // a pigeon tower (غية حمام): a lattice cage on stilts, with a flag on a pole
    return sprite(22, 40, function (P) {
      P.r(18, 0, 1, 22, "#5A3A2A"); P.r(19, 1, 3, 2, "#E8503F"); P.r(19, 3, 2, 1, "#C8443A");
      P.r(4, 24, 1, 14, "#6A4430"); P.r(16, 24, 1, 14, "#5A3A28"); P.r(9, 26, 1, 12, "#6A4430"); P.r(12, 26, 1, 12, "#5A3A28");
      P.line(4, 30, 16, 36, "#7A5236"); P.line(16, 30, 4, 36, "#7A5236");
      P.r(2, 10, 18, 15, "#3A2830");
      for (var x = 2; x < 20; x += 2) P.r(x, 10, 1, 15, x < 11 ? "#C9A46A" : "#A8844E");
      for (var y = 10; y < 25; y += 3) P.r(2, y, 18, 1, y < 14 ? "#D9B47A" : "#B08A54");
      P.r(2, 10, 1, 15, "#E2C38C"); P.r(19, 10, 1, 15, "#8A6238");
      P.r(1, 24, 20, 2, "#8A5A3A"); P.r(1, 24, 20, 1, "#A8714A");
      P.r(0, 7, 22, 3, "#9C6542"); P.r(1, 6, 20, 1, "#BA8155"); P.r(3, 5, 16, 1, "#9C6542"); P.r(0, 9, 22, 1, "#6A4430");
      P.r(0, 17, 3, 1, "#C9A46A"); P.r(19, 15, 3, 1, "#C9A46A");
      P.p(8, 13, "#C9C2B8"); P.p(13, 19, "#9C98A6");
    }, [3, 35, 16, 4, 0.25]);
  };
  PROPS.hut = function (o) { // a little room on the roof
    var w = o.w || 24, wall = o.c || "#E6D7BC";
    return sprite(w, 22, function (P) {
      P.r(1, 4, w - 2, 16, wall); P.r(1, 4, w - 2, 1, lt(wall, 0.4)); P.r(w - 4, 5, 3, 15, dk(wall, 0.18));
      P.r(0, 2, w, 3, "#A8987E"); P.r(0, 2, w, 1, "#CDBFA6");
      P.r(4, 9, 6, 11, "#3F6FA6"); P.r(4, 9, 1, 11, "#5E8DC4"); P.p(8, 14, "#F2C76C");
      P.r(13, 9, 5, 5, "#2A2234"); P.r(13, 9, 5, 1, "#8A6A4A"); P.r(15, 9, 1, 5, "#8A6A4A");
    }, [0, 18, w, 4, 0.25]);
  };
  PROPS.junk = function () {
    return sprite(18, 12, function (P) {
      P.r(1, 6, 7, 5, "#C2553A"); P.r(1, 6, 7, 1, "#E07A58"); // bricks
      P.r(9, 3, 7, 1, "#D8473C"); P.r(10, 4, 1, 6, "#D8473C"); P.r(15, 4, 1, 6, "#D8473C"); P.r(9, 7, 7, 1, "#D8473C"); // old chair
      P.r(3, 3, 4, 3, "#9AA0A8");
    }, [0, 9, 18, 3, 0.2]);
  };
  PROPS.plants = function () {
    return sprite(16, 12, function (P) {
      var R = rng(9);
      [[1, "#D8473C"], [6, null], [11, "#F2C14A"]].forEach(function (p) {
        P.r(p[0] + 1, 7, 4, 4, "#C9683E"); P.r(p[0], 6, 6, 2, "#DB7E50");
        P.el(p[0], 1, 6, 6, LEAF[(R() * 2) | 0]); P.p(p[0] + 2, 2, LEAF[3]);
        if (p[1]) { P.p(p[0] + 1, 2, p[1]); P.p(p[0] + 4, 1, p[1]); P.p(p[0] + 3, 4, p[1]); }
      });
    }, [0, 9, 16, 3, 0.2]);
  };

  // little sprites the map draws by hand
  function ball() { return sprite(6, 6, function (P) { P.el(1, 1, 4, 4, "#F6F2EA"); P.p(2, 2, "#2A2234"); P.p(3, 3, "#2A2234"); P.p(3, 1, "#FFFFFF"); }); }
  function heart() { var c = cv(7, 6); Pt(c).map(0, 0, [".hh.hh.", "hHhhhhh", "hhhhhhh", ".hhhhh.", "..hhh..", "...h..."], { h: "#F0506A", H: "#FFB3C0" }); return c; }
  function bubble(icon) { // a small speech bubble with an icon
    var c = cv(13, 13), P = Pt(c);
    P.r(1, 0, 11, 9, "#2B1B30"); P.r(0, 1, 13, 7, "#2B1B30"); P.r(1, 1, 11, 7, "#FFF8EA"); P.r(5, 9, 3, 1, "#2B1B30"); P.r(6, 10, 1, 1, "#2B1B30"); P.r(6, 9, 1, 1, "#FFF8EA");
    if (icon === "!") { P.r(6, 2, 1, 3, "#E8503F"); P.p(6, 6, "#E8503F"); }
    else if (icon === "?") { P.r(5, 2, 3, 1, "#3E78C2"); P.p(8, 3, "#3E78C2"); P.p(7, 4, "#3E78C2"); P.p(6, 4, "#3E78C2"); P.p(6, 6, "#3E78C2"); }
    else if (icon === "♥") { P.map(3, 2, [".h.h.", "hhhhh", ".hhh.", "..h.."], { h: "#F0506A" }); }
    else if (icon === "…") { P.p(3, 4, "#6A5A70"); P.p(6, 4, "#6A5A70"); P.p(9, 4, "#6A5A70"); }
    else if (icon === "♪") { P.r(7, 2, 1, 4, "#4C9A4C"); P.r(7, 2, 2, 1, "#4C9A4C"); P.r(5, 5, 3, 2, "#4C9A4C"); }
    return c;
  }
  function marker() { // the errand lantern that bobs over a place
    return sprite(11, 17, function (P) {
      P.r(5, 0, 1, 2, BRASS[2]);
      P.el(2, 2, 7, 4, BRASS[0]); P.p(4, 3, BRASS[1]);
      P.r(2, 5, 7, 6, "#FFC94A"); P.r(3, 6, 2, 4, "#FFF0B0"); P.r(7, 6, 1, 4, "#F29A2E");
      P.r(2, 5, 7, 1, BRASS[2]); P.r(2, 10, 7, 1, BRASS[2]); P.r(5, 5, 1, 6, BRASS[0]);
      P.r(3, 11, 5, 2, BRASS[0]); P.r(5, 13, 1, 2, BRASS[2]);
    });
  }

  H.pix = {
    cv: cv, rng: rng, mix: mix, dk: dk, lt: lt, rgb: rgb, Pt: Pt, outline: outline, flip: flip, sprite: sprite, pick: pick,
    SKIN: SKIN, WOOD: WOOD, BRASS: BRASS, GLASS: GLASS, LEAF: LEAF,
    person: person, prayPoses: prayPoses, cat: cat, pigeon: pigeon, prop: prop, PROPS: PROPS, loaf: loaf,
    ball: ball, heart: heart, bubble: bubble, marker: marker
  };
})();
