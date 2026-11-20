(function () {
  "use strict";
  var CONFIG = window.CONFIG, SQUISHES = window.SQUISHES, QUESTIONS = window.QUESTIONS;
  var byId = {};
  SQUISHES.forEach(function (s) { byId[s.id] = s; });
  var app = document.getElementById("app");

  /* ---------------- storage (never throws) ---------------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------------- squish art (original SVG, zero downloads) ---------------- */
  function squishSVG(s, mood, cls) {
    mood = mood || "open";
    var b = s.body, a = s.accent, ink = s.ink || "#3a2e45", eye = s.eye || "#2b2235";
    var back = "", front = "", face = 0, ex = 26, ey = 110, showMouth = true, eyeR = 1;
    // clip patterns (tie-dye, cone lattice) to the body outline; ids stay unique on a page with many squishes
    var BODY_D = "M100 40C152 40 182 70 182 116C182 162 150 180 100 180C50 180 18 162 18 116C18 70 48 40 100 40Z";
    var clipId = "sqc" + (squishSVG.n = (squishSVG.n || 0) + 1);
    var clipped = function (svg) { return svg ? '<g clip-path="url(#' + clipId + ')">' + svg + "</g>" : ""; };
    var t = s.type;
    if (t === "cat" || t === "fox") {
      var h = t === "fox" ? 22 : 30;
      back += '<polygon points="38,82 50,' + h + ' 88,50" fill="' + b + '"/><polygon points="162,82 150,' + h + ' 112,50" fill="' + b + '"/>';
      back += t === "fox"
        ? '<polygon points="46,48 50,' + h + ' 60,42" fill="' + a + '"/><polygon points="154,48 150,' + h + ' 140,42" fill="' + a + '"/>'
        : '<polygon points="50,64 54,42 74,52" fill="' + a + '"/><polygon points="150,64 146,42 126,52" fill="' + a + '"/>';
    }
    if (t === "frog") {
      back += '<circle cx="66" cy="56" r="24" fill="' + b + '"/><circle cx="134" cy="56" r="24" fill="' + b + '"/>';
      front += '<circle cx="66" cy="56" r="14" fill="#fff"/><circle cx="134" cy="56" r="14" fill="#fff"/>';
      ey = 57; ex = 34; face = 20;
    }
    if (t === "axolotl") {
      [[34,72,-35],[24,94,-10],[30,116,20]].forEach(function (g) {
        back += '<ellipse cx="' + g[0] + '" cy="' + g[1] + '" rx="20" ry="7" transform="rotate(' + g[2] + ' ' + g[0] + ' ' + g[1] + ')" fill="' + a + '"/>';
        back += '<ellipse cx="' + (200 - g[0]) + '" cy="' + g[1] + '" rx="20" ry="7" transform="rotate(' + (-g[2]) + ' ' + (200 - g[0]) + ' ' + g[1] + ')" fill="' + a + '"/>';
      });
    }
    if (t === "cow") {
      back += '<polygon points="62,48 56,22 74,42" fill="#f3e2b8"/><polygon points="138,48 144,22 126,42" fill="#f3e2b8"/>';
      back += '<ellipse cx="30" cy="78" rx="20" ry="10" fill="' + b + '" stroke="#e6e0ea" stroke-width="2"/><ellipse cx="170" cy="78" rx="20" ry="10" fill="' + a + '"/>';
      // one big black patch on the lower left (as on the real plush) plus a patch around the right ear
      front += '<path d="M19 112 C30 120 50 132 58 154 C64 168 70 176 78 179 C46 177 20 160 19 112Z" fill="' + a + '"/>';
      front += '<ellipse cx="148" cy="74" rx="22" ry="16" transform="rotate(20 148 74)" fill="' + a + '"/>';
      front += '<ellipse cx="100" cy="140" rx="30" ry="17" fill="#ffc6d6"/><ellipse cx="90" cy="140" rx="4" ry="5" fill="#d9879f"/><ellipse cx="110" cy="140" rx="4" ry="5" fill="#d9879f"/>';
      showMouth = false;
    }
    if (t === "hedgehog") {
      var pts = [];
      for (var i = 0; i <= 18; i++) {
        var ang = Math.PI * (1.05 + 0.9 * i / 18), r = i % 2 ? 98 : 80;
        pts.push((100 + Math.cos(ang) * r).toFixed(1) + "," + (118 + Math.sin(ang) * r * 0.9).toFixed(1));
      }
      back += '<polygon points="' + pts.join(" ") + '" fill="' + a + '"/>';
    }
    if (t === "owl") {
      back += '<polygon points="40,66 44,22 76,48" fill="' + b + '"/><polygon points="160,66 156,22 124,48" fill="' + b + '"/>';
      front += '<circle cx="74" cy="104" r="19" fill="#fff"/><circle cx="126" cy="104" r="19" fill="#fff"/>';
      front += '<polygon points="92,118 108,118 100,132" fill="' + a + '"/>';
      ey = 104; eyeR = 1.25; showMouth = false;
    }
    if (t === "pineapple") {
      back += '<polygon points="100,52 84,6 96,30 100,0 104,30 116,6" fill="' + a + '"/><polygon points="100,52 64,18 92,40" fill="#3d9a41"/><polygon points="100,52 136,18 108,40" fill="#3d9a41"/>';
      var dots = [[48,78],[152,78],[40,140],[160,140],[70,160],[130,160],[100,60]];
      dots.forEach(function (d) { front += '<path d="M' + (d[0]-6) + ' ' + (d[1]-6) + 'l12 12M' + (d[0]+6) + ' ' + (d[1]-6) + 'l-12 12" stroke="#e5b52e" stroke-width="3" stroke-linecap="round"/>'; });
    }
    if (t === "unicorn") {
      // white ears, pink horn with a darker swirl, white snout with pink nostrils (tie-dye comes from s.spots)
      back += '<polygon points="34,74 30,42 70,52" fill="#fbf6fd" stroke="#dcc6ec" stroke-width="2.5"/><polygon points="166,74 170,42 130,52" fill="#fbf6fd" stroke="#dcc6ec" stroke-width="2.5"/>';
      back += '<polygon points="40,64 37,49 56,54" fill="#ffc6e2"/><polygon points="160,64 163,49 144,54" fill="#ffc6e2"/>';
      back += '<polygon points="90,46 100,6 110,46" fill="#ffb3d9"/><path d="M92 38 l16 -5 M94 27 l12 -4 M96 16 l8 -3" stroke="#e05aa0" stroke-width="2.5" stroke-linecap="round"/>';
      front += '<ellipse cx="100" cy="136" rx="23" ry="13" fill="#fff"/><ellipse cx="92" cy="136" rx="3" ry="4" fill="#ff8fc0"/><ellipse cx="108" cy="136" rx="3" ry="4" fill="#ff8fc0"/>';
      showMouth = false;
    }
    if (t === "shark") {
      back += '<polygon points="80,46 112,6 132,50" fill="' + b + '"/>';
      back += '<polygon points="22,120 0,150 34,140" fill="' + b + '"/><polygon points="178,120 200,150 166,140" fill="' + b + '"/>';
    }
    if (t === "mushroom") {
      face = 18;
      front += '<path d="M12 104 C10 40 58 12 100 12 C142 12 190 40 188 104 C150 90 50 90 12 104Z" fill="' + a + '"/>';
      front += '<circle cx="62" cy="50" r="11" fill="#fff"/><circle cx="104" cy="34" r="9" fill="#fff"/><circle cx="144" cy="58" r="13" fill="#fff"/><circle cx="92" cy="72" r="7" fill="#fff"/><circle cx="34" cy="84" r="6" fill="#fff"/><circle cx="168" cy="88" r="5" fill="#fff"/>';
    }
    if (t === "bigfoot") {
      // shaggy tufts on top, big floppy ears, pale face mask and one little tooth
      back += '<path d="M56 56 Q60 26 78 44 Q84 16 98 40 Q106 12 116 40 Q130 18 134 46 Q148 30 146 58Z" fill="' + a + '"/>';
      back += '<ellipse cx="20" cy="104" rx="18" ry="28" transform="rotate(-12 20 104)" fill="' + a + '"/><ellipse cx="180" cy="104" rx="18" ry="28" transform="rotate(12 180 104)" fill="' + a + '"/>';
      if (s.face) front += '<ellipse cx="100" cy="114" rx="50" ry="34" fill="' + s.face + '"/>';
      front += '<rect x="108" y="126" width="6" height="7" rx="1.5" fill="#fff" stroke="#c9b9a8" stroke-width="1"/>';
    }
    if (t === "duck") {
      front += '<path d="M18 112 C18 66 50 40 100 40 C150 40 182 66 182 112 C150 98 50 98 18 112Z" fill="' + a + '"/>';
      front += '<path d="M24 114 C60 102 140 102 176 114" stroke="#fff" stroke-width="6" fill="none"/>';
      front += '<ellipse cx="100" cy="126" rx="22" ry="11" fill="#ffb02e"/><path d="M84 126 q16 7 32 0" stroke="#d58a10" stroke-width="2" fill="none"/>';
      ey = 82; showMouth = false;
    }
    if (t === "squid") {
      if (s.fin !== false) back += '<path d="M60 52 L100 0 L140 52Z" fill="' + a + '"/>';
      for (var k = 0; k < 6; k++) back += '<rect x="' + (34 + k * 23) + '" y="150" width="16" height="44" rx="8" fill="' + (k % 2 ? a : b) + '"/>';
    }
    if (t === "dino") {
      var sp = "";
      for (var j = 0; j < 5; j++) { var sx = 52 + j * 24; sp += '<polygon points="' + (sx - 12) + ',' + (54 - (j === 2 ? 4 : 0) + Math.abs(j - 2) * 6) + ' ' + sx + ',' + (22 + Math.abs(j - 2) * 8) + ' ' + (sx + 12) + ',' + (54 + Math.abs(j - 2) * 6) + '" fill="' + a + '"/>'; }
      back += sp;
    }
    if (t === "bee") {
      back += '<ellipse cx="44" cy="54" rx="26" ry="18" fill="#dff3ff" stroke="#b9dcf2" stroke-width="2"/><ellipse cx="156" cy="54" rx="26" ry="18" fill="#dff3ff" stroke="#b9dcf2" stroke-width="2"/>';
      back += '<path d="M84 44 Q76 18 64 14" stroke="' + a + '" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="64" cy="14" r="6" fill="' + a + '"/>';
      back += '<path d="M116 44 Q124 18 136 14" stroke="' + a + '" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="136" cy="14" r="6" fill="' + a + '"/>';
      // black-and-white striped belly, like the real plush
      [124, 138, 152, 166].forEach(function (y) {
        var hw = 50 * Math.sqrt(Math.max(0, 1 - Math.pow((y + 3 - 146) / 30, 2)));
        front += '<rect x="' + (100 - hw).toFixed(1) + '" y="' + y + '" width="' + (2 * hw).toFixed(1) + '" height="7" rx="3" fill="' + a + '"/>';
      });
    }
    if (t === "lion") {
      var m = "";
      for (var q = 0; q < 16; q++) { var ang2 = q / 16 * Math.PI * 2; m += '<circle cx="' + (100 + Math.cos(ang2) * 84).toFixed(1) + '" cy="' + (112 + Math.sin(ang2) * 76).toFixed(1) + '" r="20" fill="' + (s.mane ? s.mane[q % s.mane.length] : a) + '"/>'; }
      back += m + '<circle cx="54" cy="52" r="13" fill="' + b + '"/><circle cx="146" cy="52" r="13" fill="' + b + '"/>';
    }
    if (t === "beet") {
      // short red stem and two green leaves with red veins; lighter stripes across the front
      back += '<rect x="96" y="26" width="8" height="22" rx="4" fill="#a8304f"/>';
      back += '<path d="M100 32 C82 10 66 8 66 20 C70 30 88 32 100 32Z" fill="#4caf50"/><path d="M100 32 C78 22 72 18 68 18" stroke="#c0395a" stroke-width="2" fill="none"/>';
      back += '<path d="M100 30 C116 6 134 6 134 18 C130 28 112 30 100 30Z" fill="#3d9a41"/><path d="M100 30 C122 18 128 16 132 16" stroke="#c0395a" stroke-width="2" fill="none"/>';
      front += '<path d="M44 150 Q100 168 156 150 M58 166 Q100 178 142 166" stroke="' + a + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>';
    }
    if (s.wings) {
      back += '<ellipse cx="30" cy="60" rx="30" ry="15" transform="rotate(-40 30 60)" fill="' + s.wings + '" stroke="#b9a8f0" stroke-width="2.5"/>' +
              '<ellipse cx="170" cy="60" rx="30" ry="15" transform="rotate(40 170 60)" fill="' + s.wings + '" stroke="#b9a8f0" stroke-width="2.5"/>';
    }
    if (s.leaf) {
      back += '<path d="M100 46 C88 30 70 30 62 40 C78 42 90 46 100 52Z" fill="' + s.leaf + '"/><path d="M100 46 C112 30 130 30 138 40 C122 42 110 46 100 52Z" fill="' + s.leaf + '"/>' +
              '<rect x="96" y="22" width="8" height="24" rx="4" fill="' + s.leaf + '"/>';
    }
    if (t === "sloth") {
      front += '<ellipse cx="100" cy="114" rx="70" ry="40" fill="' + s.belly + '"/>';
      front += '<ellipse cx="72" cy="112" rx="24" ry="15" transform="rotate(-18 72 112)" fill="' + a + '"/><ellipse cx="128" cy="112" rx="24" ry="15" transform="rotate(18 128 112)" fill="' + a + '"/>';
      front += '<ellipse cx="100" cy="126" rx="7" ry="5" fill="#5a3a22"/>';
    }
    if (t === "dog") {
      var ear = s.ear || b;
      back += '<path d="M38 80 Q26 4 86 48Z" fill="' + ear + '"/><path d="M162 80 Q174 4 114 48Z" fill="' + ear + '"/>' +
              '<path d="M48 70 Q40 24 74 50Z" fill="#fff"/><path d="M152 70 Q160 24 126 50Z" fill="#fff"/>';
      front += '<ellipse cx="100" cy="134" rx="36" ry="24" fill="' + s.belly + '"/><ellipse cx="100" cy="120" rx="9" ry="6.5" fill="#2b2235"/>';
      if (s.tongue) front += '<path d="M94 128 q6 16 12 0Z" fill="#ff7fa0"/>';
      if (s.collar !== false) front += '<path d="M36 150 Q100 178 164 150 L156 166 Q100 192 44 166Z" fill="' + a + '"/><path d="M86 170 L114 170 L100 194Z" fill="' + a + '"/>';
    }
    if (t === "icecream") {
      // chocolate topping with sprinkles, tie-dye scoop (s.spots), and a waffle cone with a diamond pattern
      front += '<path d="M32 76 C44 50 70 41 100 41 C130 41 156 50 168 76 Q158 86 148 76 Q137 90 125 77 Q113 91 101 77 Q89 91 77 77 Q65 89 54 76 Q43 86 32 76Z" fill="' + a + '"/>';
      var sp2 = [[64,62,"#ff6b6b",20],[86,52,"#ffd166",-30],[118,54,"#7fd8c0",40],[140,64,"#a37bff",-15],[100,66,"#9fd9ff",35],[76,72,"#ff9fc2",-40],[128,72,"#ffd166",25]];
      sp2.forEach(function (q) { front += '<rect x="' + (q[0] - 6) + '" y="' + (q[1] - 2) + '" width="12" height="4.5" rx="2.2" fill="' + q[2] + '" transform="rotate(' + q[3] + ' ' + q[0] + ' ' + q[1] + ')"/>'; });
      front += '<path d="M20 138 Q30 148 40 138 Q50 148 60 138 Q70 148 80 138 Q90 148 100 138 Q110 148 120 138 Q130 148 140 138 Q150 148 160 138 Q170 148 180 138 C178 166 150 180 100 180 C50 180 22 166 20 138Z" fill="' + (s.cone || "#c98a4e") + '"/>';
      var lat = "";
      for (var d = 0; d < 6; d++) { var lx0 = 34 + d * 24; lat += "M" + lx0 + " 148 l26 26 M" + (lx0 + 26) + " 148 l-26 26 "; }
      front += clipped('<path d="' + lat + '" stroke="#9c6533" stroke-width="2.5" stroke-linecap="round"/>');
    }
    if (s.flower) {
      front += '<g transform="translate(66 56)">' + [0, 72, 144, 216, 288].map(function (r) { return '<ellipse cx="0" cy="-8" rx="6" ry="8" fill="' + s.flower + '" transform="rotate(' + r + ')"/>'; }).join("") + '<circle r="4.5" fill="#fff"/></g>';
    }
    var spotsSvg = "";
    (s.spots || []).forEach(function (p) { spotsSvg += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="' + p[4] + '"' + (p[5] ? ' opacity="' + p[5] + '"' : "") + '/>'; });
    // tie-dye blotches sit under the type's features (snout, cone, topping); patches and seeds sit on top
    spotsSvg = clipped(spotsSvg);
    if (s.dyeUnder) front = spotsSvg + front; else front += spotsSvg;

    var body = '<clipPath id="' + clipId + '"><path d="' + BODY_D + '"/></clipPath><path d="' + BODY_D + '" fill="' + b + '"/>';
    if (s.stripes) body += '<path d="M100 42 L100 178 M70 46 Q56 110 68 176 M130 46 Q144 110 132 176 M42 66 Q26 116 44 166 M158 66 Q174 116 156 166" stroke="' + s.stripes + '" stroke-width="8" fill="none" stroke-linecap="round"/>';
    var belly = s.belly ? '<ellipse cx="100" cy="146" rx="' + (t === "hedgehog" ? 62 : 50) + '" ry="' + (t === "hedgehog" ? 44 : 30) + '" fill="' + s.belly + '"/>' : "";
    if (t === "hedgehog") belly = '<ellipse cx="100" cy="128" rx="60" ry="46" fill="' + s.belly + '"/>';

    var fy = ey + (t === "frog" ? 0 : face);
    function eyeOpen(x) {
      return '<ellipse cx="' + x + '" cy="' + fy + '" rx="' + 6.5 * eyeR + '" ry="' + 8.5 * eyeR + '" fill="' + eye + '"/>' +
        (s.eye ? '<ellipse cx="' + x + '" cy="' + fy + '" rx="2.2" ry="6" fill="#1d1d24"/>' : "") +
        '<circle cx="' + (x - 2) + '" cy="' + (fy - 3.5) + '" r="2.4" fill="#fff"/>';
    }
    function eyeHappy(x) { return '<path d="M' + (x - 7) + ' ' + (fy + 2) + ' q7 -10 14 0" stroke="' + (s.eye || ink) + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'; }
    var lx = 100 - ex, rx = 100 + ex;
    var eyes = mood === "happy" ? eyeHappy(lx) + eyeHappy(rx) : mood === "wink" ? eyeOpen(lx) + eyeHappy(rx) : eyeOpen(lx) + eyeOpen(rx);
    var cy = 126 + face, my = 124 + face;
    var cheeks = '<ellipse cx="' + (lx - 14) + '" cy="' + cy + '" rx="10" ry="5.5" fill="#ff8fb0" opacity=".6"/><ellipse cx="' + (rx + 14) + '" cy="' + cy + '" rx="10" ry="5.5" fill="#ff8fb0" opacity=".6"/>';
    var mouth = showMouth ? '<path d="M93 ' + my + ' q3.5 5 7 0 q3.5 5 7 0" stroke="' + ink + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' : "";
    if (mood === "happy" && showMouth) mouth = '<path d="M92 ' + my + ' q8 11 16 0Z" fill="#ff6b8f" stroke="' + ink + '" stroke-width="2" stroke-linejoin="round"/>';

    return '<svg class="squish ' + (cls || "") + '" viewBox="0 0 200 200" role="img" aria-label="' + s.name + ' illustration">' +
      '<ellipse cx="100" cy="186" rx="64" ry="8" fill="rgba(74,59,92,.13)"/>' +
      back + body + belly + front + cheeks + eyes + mouth + "</svg>";
  }

  /* ---------------- links ---------------- */
  function buyUrl(s, st) {
    st = st || CONFIG.stores[0];
    var q = encodeURIComponent("Squishmallows " + s.name + " plush");
    return "https://" + st.domain + "/s?k=" + q + (st.tag ? "&tag=" + encodeURIComponent(st.tag) : "");
  }
  document.getElementById("disclosure").textContent = CONFIG.stores.some(function (st) { return st.tag; })
    ? "As an Amazon Associate we earn from qualifying purchases. Buying through our links supports this site at no extra cost to you."
    : "Shopping links may earn us a small commission at no extra cost to you.";
  // dress up the static home-page footer with squish art
  Array.prototype.forEach.call(document.querySelectorAll(".sq-strip a[data-id]"), function (a) {
    var s = SQUISHES.filter(function (x) { return x.id === a.getAttribute("data-id"); })[0];
    if (s) a.innerHTML = squishSVG(s, "happy") + "<span>" + a.textContent + "</span>";
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-art]"), function (el) {
    el.innerHTML = el.getAttribute("data-art").split(",").map(function (id, i) {
      var s = SQUISHES.filter(function (x) { return x.id === id; })[0];
      return s ? squishSVG(s, i ? "wink" : "happy") : "";
    }).join("");
  });

  /* ---------------- quiz state ---------------- */
  var step = 0, answers = [], mode = "me";
  function scores() {
    var sc = {};
    SQUISHES.forEach(function (s) { sc[s.id] = 0; });
    answers.forEach(function (ai, qi) { QUESTIONS[qi].a[ai].p.forEach(function (id) { sc[id]++; }); });
    return sc;
  }
  function ranked() {
    var sc = scores(), tie = {};
    SQUISHES.forEach(function (s) { tie[s.id] = Math.random(); }); // fair random tie-break
    return SQUISHES.slice().sort(function (x, y) { return sc[y.id] - sc[x.id] || tie[y.id] - tie[x.id]; }).map(function (s) { return { s: s, score: sc[s.id] }; });
  }

  var BASE = location.origin + location.pathname;
  var TITLE = document.title;
  function render(html, query, title) {
    app.innerHTML = '<section class="screen">' + html + "</section>";
    document.title = title || TITLE;
    try { history.replaceState(null, "", BASE + (query || "")); } catch (e) {}
    window.scrollTo(0, 0);
  }

  /* ---------------- anonymous counters (no cookies, no personal data: just +1 on a named event) ---------------- */
  function track(ev) {
    if (!CONFIG.voteEndpoint) return;
    try {
      fetch(CONFIG.voteEndpoint, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ ev: ev }) }).catch(function () {});
    } catch (e) {}
  }
  function source(sharedId) {
    var utm = (location.search.match(/[?&]utm_source=([a-z]+)/i) || [])[1], host = "";
    try { host = new URL(document.referrer).hostname; } catch (e) {}
    var known = { pinterest: /pinterest|pin\.it/, google: /google\./, bing: /bing\.|duckduckgo|yahoo/, reddit: /reddit/,
                  facebook: /facebook|fb\.|messenger/, instagram: /instagram/, tiktok: /tiktok/ };
    if (utm && known[utm.toLowerCase()]) return utm.toLowerCase();
    for (var k in known) if (known[k].test(host)) return k;
    if (sharedId) return "shared";
    if (!host) return "direct";
    return host === location.hostname ? null : "other";
  }

  /* ---------------- sharing ---------------- */
  function toast(html, ms) {
    var old = document.querySelector(".toast"); if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 2600);
    return t;
  }
  function share(text, url) {
    if (navigator.share) { navigator.share({ title: "Squish Finder", text: text, url: url }).catch(function () {}); return; }
    var full = text + " " + url;
    function manual() {
      var t = toast('Copy this link: <input readonly aria-label="Share link">', 8000), inp = t.querySelector("input");
      inp.value = full; inp.focus(); inp.select();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(full).then(function () { toast("Link copied! Paste it anywhere 💗"); }, manual);
    } else manual();
  }

  /* ---------------- result card (a picture people can save or post) ---------------- */
  function slugOf(s) { return s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function matchPct(id) {
    if (answers.length !== QUESTIONS.length) return 0;
    return Math.max(10, Math.round((scores()[id] / QUESTIONS.length) * 100));
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function fitText(c, text, maxW, size, weight) {
    do { c.font = weight + " " + size + 'px "Baloo 2", system-ui, sans-serif'; size -= 4; } while (c.measureText(text).width > maxW && size > 30);
  }
  function makeCard(s, gift) {
    var W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var c = cv.getContext("2d"), pct = matchPct(s.id);
    var svg = squishSVG(s, "happy").replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="620" height="620" ');
    var img = new Image();
    var fontReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 80px "Baloo 2"'), document.fonts.load('700 40px "Baloo 2"')]).catch(function () {}) : Promise.resolve();
    var imgReady = new Promise(function (ok, bad) { img.onload = ok; img.onerror = bad; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    return Promise.all([fontReady, imgReady]).then(function () {
      var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#ffd6e8"); g.addColorStop(1, "#dcd2ff");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,255,255,.5)";
      [[120, 160, 60], [960, 240, 44], [90, 1080, 50], [990, 1010, 70], [540, 70, 26]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1], d[2], 0, 7); c.fill(); });
      c.fillStyle = "rgba(163,123,255,.18)"; roundRect(c, 70, 128, W - 140, 1000, 64); c.fill();
      c.fillStyle = "#fff"; roundRect(c, 70, 110, W - 140, 1000, 64); c.fill();
      c.textAlign = "center"; c.textBaseline = "alphabetic";
      c.fillStyle = "#a37bff"; c.font = '700 54px "Baloo 2", system-ui, sans-serif';
      c.fillText(gift ? "The perfect gift pick is…" : "My Squishmallow match is…", W / 2, 210);
      c.drawImage(img, (W - 620) / 2, 225, 620, 620);
      c.fillStyle = "#4a3b5c"; fitText(c, s.name, W - 220, 96, 800); c.fillText(s.name, W / 2, 900);
      if (pct) {
        var label = pct + "% match 💗"; c.font = '800 46px "Baloo 2", system-ui, sans-serif';
        var bw = c.measureText(label).width + 70; c.fillStyle = "#ff7fae"; roundRect(c, (W - bw) / 2, 930, bw, 76, 38); c.fill();
        c.fillStyle = "#fff"; c.fillText(label, W / 2, 984);
      }
      c.fillStyle = "#8a7a9c"; fitText(c, s.squad + " · loves " + s.fav.toLowerCase(), W - 240, 40, 700);
      c.fillText(s.squad + " · loves " + s.fav.toLowerCase(), W / 2, pct ? 1068 : 990);
      c.fillStyle = "#4a3b5c"; c.font = '800 60px "Baloo 2", system-ui, sans-serif';
      c.fillText(gift ? "Who should YOU gift? 🎁" : "Which one are YOU? 🧸", W / 2, 1210);
      c.fillStyle = "#ff7fae"; c.font = '800 50px "Baloo 2", system-ui, sans-serif'; c.fillText("squishfinder.ca", W / 2, 1282);
      return new Promise(function (ok) { cv.toBlob(ok, "image/png"); });
    });
  }
  function showCard(s, gift) {
    track("card");
    var old = document.querySelector(".card-modal"); if (old) old.remove();
    var m = document.createElement("div");
    m.className = "card-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Your squish card");
    m.innerHTML = '<div class="card-box"><button class="card-x" aria-label="Close">✕</button><p class="sub">Making your card…</p></div>';
    document.body.appendChild(m);
    function close() { m.remove(); }
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest(".card-x")) close(); });
    makeCard(s, gift).then(function (blob) {
      var url = URL.createObjectURL(blob), name = "my-squish-" + slugOf(s) + ".png";
      var file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      var canShare = file && navigator.canShare && navigator.canShare({ files: [file] });
      m.querySelector(".card-box").innerHTML = '<button class="card-x" aria-label="Close">✕</button>' +
        '<img src="' + url + '" alt="' + s.name + ' result card">' +
        '<div class="row">' + (canShare ? '<button class="btn" data-cshare>📤 Share picture</button>' : "") +
        '<a class="btn' + (canShare ? " alt" : "") + '" data-csave href="' + url + '" download="' + name + '">⬇️ Save picture</a></div>' +
        '<p class="note">Post it to your Story or send it to a friend! On a phone you can also press and hold the picture to save it.</p>';
      var sb = m.querySelector("[data-cshare]");
      if (sb) sb.addEventListener("click", function () {
        track("card_share");
        navigator.share({ files: [file], title: "My Squishmallow match", text: (gift ? "Perfect gift pick: " : "I got ") + s.name + "! Which one are you? squishfinder.ca" }).catch(function () {});
      });
      m.querySelector("[data-csave]").addEventListener("click", function () { track("card_save"); });
    }, function () {
      m.querySelector(".card-box").innerHTML = '<button class="card-x" aria-label="Close">✕</button><p class="sub">Sorry, we couldn\'t make the picture on this device. Try the Share button instead.</p>';
    });
  }

  /* ---------------- screens ---------------- */
  function home() {
    step = 0; answers = [];
    render('<div class="center">' +
      '<div class="hero-row">' + squishSVG(byId.archie, "happy") + squishSVG(byId.cam, "open") + squishSVG(byId.wendy, "wink") + "</div>" +
      '<h1>Find the perfect <span class="hl">Squishmallow</span></h1>' +
      '<p class="sub">A 6-question quiz for collectors and gift-shoppers. ' + SQUISHES.length + ' squishes, one perfect match, for you or someone you love.</p>' +
      '<div class="row"><button class="btn" data-go="start">Start the quiz ✨</button>' +
      '<button class="btn alt" data-go="all">Browse all squishes</button></div></div>');
  }

  function who() {
    render('<div class="center"><h2>Who is it for?</h2><p class="sub">We\'ll word the questions to fit.</p></div>' +
      '<div class="who">' +
      '<button class="ans" data-who="me">' + squishSVG(byId.cam, "happy") + '<b>For me</b><span class="note">I\'m picking my own favorite</span></button>' +
      '<button class="ans" data-who="gift" style="animation-delay:.06s">' + squishSVG(byId.lola, "wink") + '<b>It\'s a gift 🎁</b><span class="note">I\'m shopping for someone else</span></button>' +
      "</div>" +
      '<div class="center"><button class="back" data-go="home">← Back</button></div>');
  }

  function question() {
    var Q = QUESTIONS[step], pct = (step / QUESTIONS.length) * 100;
    var qText = mode === "gift" && Q.g ? Q.g : Q.q;
    render('<div class="progress" role="progressbar" aria-valuenow="' + step + '" aria-valuemax="6"><i style="width:' + pct + '%"></i></div>' +
      '<div class="qhead">' + squishSVG(byId[Q.mascot], step % 2 ? "happy" : "open") +
      '<div class="center"><div class="qnum">Question ' + (step + 1) + " of " + QUESTIONS.length + "</div><h2>" + qText + "</h2></div></div>" +
      '<div class="answers">' + Q.a.map(function (a, i) {
        return '<button class="ans" style="animation-delay:' + i * 0.05 + 's" data-ans="' + i + '"><span class="em">' + a.e + "</span>" + a.t + "</button>";
      }).join("") + "</div>" +
      '<div class="center"><button class="back" data-go="back">← ' + (step ? "Back" : "Start over") + "</button></div>");
    requestAnimationFrame(function () { var i = app.querySelector(".progress i"); if (i) i.style.width = ((step + 1) / QUESTIONS.length) * 100 + "%"; });
  }

  function results() {
    var r = ranked(), top = r.slice(0, 3), rest = r.slice(3);
    var maxPossible = QUESTIONS.length;
    confetti();
    var gift = mode === "gift";
    track(gift ? ["done", "done_gift"] : "done");
    render('<div class="center"><h2>' + (gift ? "Top gift picks! 🎁" : "Your top squish matches! 🎉") + '</h2><p class="sub">' +
      (gift ? "Tap the one you think they'll love most." : "Tap the one that is <b>your</b> favorite.") + "</p></div>" +
      '<div class="cards">' + top.map(function (x, i) {
        return '<div class="card' + (i === 0 ? " top1" : "") + '" style="animation-delay:' + i * 0.1 + 's">' +
          (i === 0 ? '<span class="badge">Best match</span>' : "") + squishSVG(x.s, i === 0 ? "happy" : "open") +
          "<b>" + x.s.name + '</b><span class="match">' + Math.max(10, Math.round((x.score / maxPossible) * 100)) + "% match</span>" +
          '<button class="btn pick" data-fav="' + x.s.id + '">This one! 💗</button></div>';
      }).join("") + "</div>" +
      '<div class="center" style="margin-top:22px"><h2 style="font-size:1.3rem">Or pick another favorite</h2></div>' +
      grid(rest.map(function (x) { return x.s; })) +
      '<div class="row"><button class="btn alt" data-go="start">Retake quiz</button></div>');
  }

  function grid(list) {
    return '<div class="cards small-grid">' + list.map(function (s, i) {
      return '<button class="card" style="animation-delay:' + i * 0.03 + 's" data-fav="' + s.id + '">' + squishSVG(s, "open") + "<b>" + s.name + "</b></button>";
    }).join("") + "</div>";
  }

  function all() {
    render('<div class="center"><h2>All the squishes</h2><p class="sub">Tap your favorite to vote!</p></div>' + grid(SQUISHES) +
      '<div class="row"><button class="btn" data-go="start">Take the quiz instead ✨</button></div>');
  }

  function detail(id, shared) {
    var s = byId[id];
    if (!s) return home();
    if (!shared) { vote(id); track("pick_" + id); } // a shared link is someone else's pick, not a vote
    confetti();
    var gift = mode === "gift" && !shared;
    var badge = shared ? "Shared with you 💌" : gift ? "Great gift pick 🎁" : "Your favorite 💗";
    var shareBtns = '<div class="share-row">' + (shared ? "" : '<button class="btn share" data-card="' + s.id + '">🖼️ ' + (gift ? "Get a gift-pick card" : "Get my squish card") + "</button>") +
      '<button class="btn alt share" data-share="' + s.id + '">📤 ' + (gift ? "Share this pick" : "Share my result") + "</button>" +
      (gift ? '<button class="btn alt share" data-go="invite">🎁 Send them the quiz</button>' : "") + "</div>";
    var buttons = CONFIG.stores.map(function (st, i) {
      return '<a class="btn buy' + (i ? " alt" : "") + '" data-buy="' + (/\.ca$/.test(st.domain) ? "ca" : "com") + '" data-id="' + s.id +
        '" target="_blank" rel="sponsored noopener" href="' + buyUrl(s, st) + '">' +
        st.flag + " Buy on " + st.name + "</a>";
    }).join("");
    render((shared ? '<div class="center shared-cta"><p class="sub">Someone shared this squish with you! Which one are <b>you</b>?</p>' +
        '<button class="btn" data-go="start">Find yours ✨</button></div>' : "") +
      '<div class="detail">' +
      '<div class="center main-art">' + squishSVG(s, "happy", "jump") +
      '<div class="poses"><figure>' + squishSVG(s, "open") + "<figcaption>Hello!</figcaption></figure>" +
      "<figure>" + squishSVG(s, "wink") + "<figcaption>Wink!</figcaption></figure>" +
      "<figure>" + squishSVG(s, "happy") + "<figcaption>Hug me!</figcaption></figure></div></div>" +
      '<div><span class="badge">' + badge + '</span><h2>' + s.name + '</h2><p class="bio">' + s.bio + "</p>" +
      '<ul class="facts"><li>🏷️ <b>Squad:</b> ' + s.squad + "</li><li>💖 <b>Loves:</b> " + s.fav + "</li></ul>" +
      '<div class="buy-row">' + buttons + "</div>" +
      '<p class="tips"><b>🛍️ Shopping tips:</b> Squishmallows come in several sizes, commonly 5", 8", 12", 16" and 24". Big ones are best for hugging, small ones for collecting. Check the size in the listing before you buy.</p>' +
      shareBtns +
      '<p class="note"><a href="/squishes/' + s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + '">📖 ' + s.name.split(" ")[0] + "'s full profile: rarity, editions & collector notes →</a></p>" +
      '<p class="note"><a href="/squishmallow-coloring-pages#' + s.id + '">🖍️ Print a free ' + s.name.split(" ")[0] + " colouring page →</a></p>" +
      '<p class="note">🇨🇦 Canada? Use Amazon.ca. 🇺🇸 USA? Use Amazon.com. ' + (shared ? "" : "Your vote was counted! ") + 'Prices and stock vary by store.</p></div></div>' +
      '<div class="row"><button class="btn alt" data-go="poll">📊 See the poll</button><button class="btn alt" data-go="start">' + (shared ? "Take the quiz" : "Retake quiz") + "</button></div>",
      "?s=" + s.id, s.name + " | Squish Finder");
  }

  /* ---------------- voting / poll ---------------- */
  function vote(id) {
    if (load("lm_myfav", null) === id) return; // already voted for this one
    var prev = load("lm_myfav", null), v = load("lm_votes", {});
    if (prev && v[prev]) v[prev]--; // one vote per device; changing fav moves it
    v[id] = (v[id] || 0) + 1;
    save("lm_votes", v); save("lm_myfav", id);
    if (CONFIG.voteEndpoint) {
      try {
        fetch(CONFIG.voteEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ id: id, prev: prev }) }).catch(function () {});
      } catch (e) {}
    }
  }

  function poll() {
    render('<div class="center"><h2>📊 Favorite Squish Poll</h2><p class="sub" id="pollsrc">Loading votes…</p></div><div class="poll" id="pollBox"></div>' +
      '<div class="row"><button class="btn" data-go="start">Take the quiz ✨</button></div>');
    var local = load("lm_votes", {});
    drawPoll(local, CONFIG.voteEndpoint ? "Showing this device's votes (loading everyone's…)" : "Votes from this device");
    if (CONFIG.voteEndpoint) {
      fetch(CONFIG.voteEndpoint).then(function (r) { return r.json(); }).then(function (data) {
        if (document.getElementById("pollBox")) drawPoll(data, "Votes from everyone 🌍");
      }).catch(function () {
        var el = document.getElementById("pollsrc"); if (el) el.textContent = "Couldn't reach the shared poll, showing this device's votes";
      });
    }
  }

  function drawPoll(counts, label) {
    var box = document.getElementById("pollBox"), src = document.getElementById("pollsrc");
    if (!box) return;
    src.textContent = label;
    var mine = load("lm_myfav", null);
    var list = SQUISHES.map(function (s) { return { s: s, n: Math.max(0, +counts[s.id] || 0) }; }).sort(function (a, b) { return b.n - a.n; });
    var max = Math.max(1, list[0].n);
    box.innerHTML = list.map(function (x) {
      return '<div class="bar' + (x.s.id === mine ? " mine" : "") + '">' + squishSVG(x.s, "open") +
        '<div class="track"><div class="fill" style="width:0"></div><span class="lbl">' + x.s.name + (x.s.id === mine ? " 💗" : "") + "</span></div>" +
        '<span class="ct">' + x.n + "</span></div>";
    }).join("");
    requestAnimationFrame(function () {
      box.querySelectorAll(".fill").forEach(function (f, i) { f.style.width = (list[i].n / max) * 100 + "%"; });
    });
  }

  /* ---------------- confetti (few DOM nodes, auto-removed) ---------------- */
  function confetti() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var colors = ["#ff7fae", "#a37bff", "#7fd8c0", "#ffd166", "#9fd9ff"];
    for (var i = 0; i < 28; i++) {
      var c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(c);
      setTimeout(function (el) { el.remove(); }.bind(null, c), 2400);
    }
  }

  /* ---------------- happy music (WebAudio, no files) ---------------- */
  var Music = (function () {
    var ctx, master, timer, on = false, nextT = 0, idx = 0;
    var BPM = 128, EIGHTH = 60 / BPM / 2;
    // melody in C major; 0 = rest. 32 eighth notes per loop
    var N = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, C6: 1046.5 };
    var mel = ["C5","E5","G5","E5","F5","A5","G5",0, "E5","G5","C6","G5","A5","F5","E5",0,
               "D5","F5","A5","F5","E5","G5","C5",0, "D5","E5","F5","D5","C5",0,"G4",0];
    var bass = ["C4","G4","F4","C4","D4","G4","C4","G4"]; // one per 4 eighths
    function tone(f, t, dur, type, vol) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    function schedule() {
      while (nextT < ctx.currentTime + 0.15) {
        var m = mel[idx % mel.length];
        if (m) tone(N[m], nextT, EIGHTH * 0.9, "triangle", 0.22);
        if (idx % 4 === 0) tone(N[bass[(idx / 4) % bass.length]] / 2, nextT, EIGHTH * 3.5, "sine", 0.28);
        if (idx % 2 === 1) tone(2400, nextT, 0.03, "square", 0.02); // tiny hi-hat tick
        nextT += EIGHTH; idx++;
      }
    }
    function start() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.18; master.connect(ctx.destination); }
      if (ctx.state === "suspended") ctx.resume();
      nextT = ctx.currentTime + 0.05; on = true;
      clearInterval(timer); timer = setInterval(schedule, 40); schedule();
      return true;
    }
    function stop() { on = false; clearInterval(timer); if (ctx) ctx.suspend(); }
    return { start: start, stop: stop, isOn: function () { return on; } };
  })();

  var musicBtn = document.getElementById("musicBtn");
  function setMusic(want) {
    var ok = want ? Music.start() : (Music.stop(), false);
    musicBtn.textContent = ok ? "🎵 Music" : "🔇 Music";
    musicBtn.setAttribute("aria-pressed", ok ? "true" : "false");
    save("lm_music", !!want);
  }
  musicBtn.addEventListener("click", function () { setMusic(!Music.isOn()); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && Music.isOn()) { Music.stop(); musicBtn.dataset.resume = "1"; }
    else if (!document.hidden && musicBtn.dataset.resume) { delete musicBtn.dataset.resume; Music.start(); }
  });

  /* ---------------- events (one delegated listener) ---------------- */
  app.addEventListener("click", function (e) {
    var buy = e.target.closest("a[data-buy]");
    if (buy) { track(["buy_" + buy.dataset.buy, "buy_" + buy.dataset.id]); return; }
    var t = e.target.closest("button");
    if (!t) return;
    // browsers only allow audio after a tap: start music on first quiz start unless muted
    if (t.dataset.go === "start" && !Music.isOn() && load("lm_music", true)) setMusic(true);
    if (t.dataset.ans != null) {
      if (app.dataset.busy) return;
      app.dataset.busy = "1";
      t.classList.add("picked");
      answers[step] = +t.dataset.ans;
      setTimeout(function () {
        delete app.dataset.busy;
        step++;
        step >= QUESTIONS.length ? results() : question();
      }, 220);
      return;
    }
    if (t.dataset.fav) return detail(t.dataset.fav);
    if (t.dataset.card) return showCard(byId[t.dataset.card], mode === "gift");
    if (t.dataset.share) {
      track("share");
      var sh = byId[t.dataset.share];
      // link to the squish's profile page so the preview shows that squish's own picture
      var shareUrl = location.origin + "/squishes/" + sh.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "?from=share" + (mode === "gift" ? "&gift=1" : "");
      return share(mode === "gift" ? "I think " + sh.name + " is the perfect Squishmallow gift 🎁 Find your own match:" :
        "I got " + sh.name + "! 💗 Which Squishmallow are you? Take the 6-question quiz:", shareUrl);
    }
    if (t.dataset.who) { mode = t.dataset.who; step = 0; answers = []; track(mode === "gift" ? ["start", "start_gift"] : "start"); return question(); }
    switch (t.dataset.go) {
      case "start": who(); break;
      case "home": home(); break;
      case "back": if (step === 0) who(); else { step--; answers.length = step; question(); } break;
      case "all": all(); break;
      case "poll": poll(); break;
      case "invite": track("invite"); share("Take this quick quiz so I know which Squishmallow to get you 🎁", BASE); break;
    }
  });
  document.getElementById("homeBtn").addEventListener("click", home);
  document.getElementById("pollBtn").addEventListener("click", poll);

  // expose for tests
  window.__squish = { scores: scores, ranked: ranked, squishSVG: squishSVG, buyUrl: buyUrl, setAnswers: function (a) { answers = a.slice(); }, share: share };

  // a shared link (?s=wendy) opens that squish; anything else starts at home
  var sid = (location.search.match(/[?&]s=([a-z]+)/) || [])[1];
  // count one visit per browser session, with where it came from
  try {
    if (!sessionStorage.getItem("sf_v")) {
      sessionStorage.setItem("sf_v", "1");
      var src = source(sid && byId[sid] ? sid : null);
      track(src ? ["visit", "src_" + src] : "visit");
    }
  } catch (e) {}
  // /?gift=1 (used by the gift guide) jumps straight into the gift quiz
  if (sid && byId[sid]) detail(sid, true);
  else if (/[?&]gift=1/.test(location.search)) { mode = "gift"; step = 0; answers = []; track(["start", "start_gift"]); question(); }
  else home();
})();
