/* Dream Catcher: a Squishmallow claw machine for squishfinder.ca/games
   Canvas game, no downloads: squish art from squish-art.js, all music and sounds made with WebAudio.
   World is 720 x 1000 units; physics is a small position-based circle solver at 120 steps a second. */
(function () {
  "use strict";
  var SQ = window.SQUISHES, byId = {};
  SQ.forEach(function (s) { byId[s.id] = s; });

  /* ---------------- layout ---------------- */
  var W = 720, H = 1000;
  var GL = 24, GR = 696, GT = 104, FLOOR = 930;      // glass box
  var WALL_X = 172, WALL_T = 400, WALL_R = 9;          // plexi wall between bin and prize chute
  var HOME_X = 96, TOP_Y = 172, MIN_X = 96, MAX_X = 628;
  var HUB_R = 24, SINK = 7, MAX_HUB_Y = FLOOR - HUB_R - 46;
  var G = 2100, STEP = 1 / 120, ITER = 7, STIFF = 0.75, FRIC = 0.09;
  var MOVE_V = 270, MOVE_A = 1700, DROP_V = 340, LIFT_V = 250, CARRY_V = 290;
  var TURN_TIME = 20, START_TOKENS = 10, BIN_COUNT = 44, REFILL_BELOW = 34;

  /* ---------------- storage (never throws) ---------------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var store = load("sf_claw", null) || { shelf: {}, gold: {}, best: 0, plays: 0 };
  store.shelf = store.shelf || {}; store.gold = store.gold || {};

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function slug(s) { return s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  /* ================= sound: music + sfx, all synthesized ================= */
  var Sound = (function () {
    var ctx, master, musicG, sfxG, noiseBuf, motorG, motorO1, motorO2, motorF, timer;
    var musicOn = load("sf_claw_music", true), sfxOn = load("sf_claw_sfx", true), playing = false;
    function init() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
        musicG = ctx.createGain(); musicG.gain.value = musicOn ? 0.34 : 0; musicG.connect(master);
        sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 0.9 : 0; sfxG.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        // gantry motor: two detuned low oscillators through a resonant low-pass, gain at 0 until it moves
        motorG = ctx.createGain(); motorG.gain.value = 0;
        motorF = ctx.createBiquadFilter(); motorF.type = "lowpass"; motorF.frequency.value = 420; motorF.Q.value = 5;
        motorO1 = ctx.createOscillator(); motorO1.type = "sawtooth"; motorO1.frequency.value = 58;
        motorO2 = ctx.createOscillator(); motorO2.type = "square"; motorO2.frequency.value = 87.3;
        var o2g = ctx.createGain(); o2g.gain.value = 0.35;
        motorO1.connect(motorF); motorO2.connect(o2g); o2g.connect(motorF); motorF.connect(motorG); motorG.connect(sfxG);
        motorO1.start(); motorO2.start();
      }
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    function now() { return ctx.currentTime; }
    function tone(f, t, dur, type, vol, dest, slide, attack) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
    }
    function noise(t, dur, vol, ftype, freq, dest, q) {
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; f.type = ftype || "bandpass"; f.frequency.value = freq || 1000; f.Q.value = q || 1;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    function nf(n) {
      var m = /^([A-G])(b|#)?(\d)$/.exec(n);
      var semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
      return 440 * Math.pow(2, ((+m[3] + 1) * 12 + semi - 69) / 12);
    }

    /* ---- music: bouncy toy-arcade tune in F major, 16 bars, 136 BPM ---- */
    var BPM = 136, E8 = 60 / BPM / 2;
    var MEL = ("C5 - A4 C5 F5 - E5 F5|D5 - F5 - A5 G5 F5 -|Bb4 D5 F5 D5 G5 F5 D5 -|C5 E5 G5 - E5 - C5 -|" +
               "A5 - G5 F5 A5 - C6 -|A5 G5 F5 D5 F5 - A5 -|G5 F5 D5 Bb4 C5 E5 G5 Bb5|A5 - F5 - C5 - F5 -|" +
               "D6 - C6 Bb5 A5 - F5 -|E5 G5 C6 - Bb5 A5 G5 -|A5 - E5 - C6 - A5 -|F5 - D5 F5 A5 - D6 -|" +
               "D6 C6 Bb5 A5 G5 - F5 -|G5 - A5 - Bb5 - C6 -|C6 - Bb5 - G5 - E5 -|F5 - - - 0 0 C5 E5").replace(/\|/g, " ").split(" ");
    var CH = ["F", "Dm", "Bb", "C", "F", "Dm", "Bb", "F", "Bb", "C", "Am", "Dm", "Bb", "C", "C", "F"];
    var CHORD = { F: ["F4", "A4", "C5"], Dm: ["D4", "F4", "A4"], Bb: ["Bb3", "D4", "F4"], C: ["C4", "E4", "G4"], Am: ["A3", "C4", "E4"] };
    var ROOT = { F: "F3", Dm: "D3", Bb: "Bb2", C: "C3", Am: "A2" };
    var BASS = [0, -1, 7, -1, 0, 12, 7, -1]; // semitone offsets per eighth (-1 = rest)
    var step = 0, nextT = 0;
    function lead(f, t, dur) {
      tone(f, t, dur, "square", 0.05, musicG, 0, 0.01);
      tone(f * 2, t, dur * 0.7, "triangle", 0.035, musicG, 0, 0.01);
    }
    function schedule() {
      while (nextT < ctx.currentTime + 0.14) {
        var i = step % MEL.length, bar = Math.floor(i / 8), e = i % 8, ch = CH[bar], t = nextT;
        var n = MEL[i];
        if (n && n !== "-" && n !== "0") {
          var len = 1; while (MEL[(i + len) % MEL.length] === "-" && len < 4) len++;
          lead(nf(n), t, E8 * len * 0.92);
        }
        if (BASS[e] >= 0) tone(nf(ROOT[ch]) * Math.pow(2, BASS[e] / 12), t, E8 * 0.9, "triangle", 0.2, musicG);
        if (e % 2 === 1) CHORD[ch].forEach(function (c) { tone(nf(c), t, 0.09, "triangle", 0.03, musicG); });
        if (e === 0 || e === 4) tone(150, t, 0.16, "sine", 0.45, musicG, 45);
        if (e === 2 || e === 6) { noise(t, 0.12, 0.16, "bandpass", 1800, musicG, 0.8); tone(210, t, 0.06, "triangle", 0.08, musicG, 160); }
        noise(t, 0.03, e % 2 ? 0.05 : 0.03, "highpass", 7500, musicG);
        nextT += E8; step++;
      }
    }
    function musicStart() {
      if (!ctx || playing) return;
      playing = true; nextT = ctx.currentTime + 0.08;
      clearInterval(timer); timer = setInterval(schedule, 30); schedule();
    }
    function musicStop() { playing = false; clearInterval(timer); }
    function duck(sec) {
      if (!ctx || !musicOn) return;
      var t = now(); musicG.gain.cancelScheduledValues(t);
      musicG.gain.setTargetAtTime(0.1, t, 0.05); musicG.gain.setTargetAtTime(0.34, t + sec, 0.3);
    }
    function setMusic(on) {
      musicOn = on; save("sf_claw_music", on);
      if (ctx) { musicG.gain.cancelScheduledValues(now()); musicG.gain.setTargetAtTime(on ? 0.34 : 0, now(), 0.05); }
    }
    function setSfx(on) {
      sfxOn = on; save("sf_claw_sfx", on);
      if (ctx) sfxG.gain.setTargetAtTime(on ? 0.9 : 0, now(), 0.03);
    }

    /* ---- sound effects ---- */
    var lastBoing = 0;
    var fx = {
      coin: function () { var t = now(); tone(988, t, 0.09, "square", 0.12); tone(1319, t + 0.08, 0.32, "square", 0.12); noise(t, 0.05, 0.1, "highpass", 5000); },
      blip: function () { tone(660, now(), 0.07, "triangle", 0.15); },
      motor: function (level, pitch) {
        if (!ctx) return; var t = now();
        motorG.gain.setTargetAtTime(level * 0.11, t, 0.04);
        motorO1.frequency.setTargetAtTime(52 * pitch, t, 0.05); motorO2.frequency.setTargetAtTime(78 * pitch, t, 0.05);
        motorF.frequency.setTargetAtTime(300 + 260 * pitch, t, 0.05);
      },
      zip: function (up) { var t = now(); tone(up ? 300 : 900, t, 0.25, "sawtooth", 0.04, sfxG, up ? 700 : 260); },
      thunk: function (soft) { var t = now(); tone(soft ? 140 : 110, t, 0.18, "sine", soft ? 0.25 : 0.4, sfxG, 50); noise(t, 0.08, soft ? 0.08 : 0.15, "lowpass", 600); },
      clack: function () { var t = now(); noise(t, 0.04, 0.3, "bandpass", 2600, sfxG, 3); noise(t + 0.07, 0.05, 0.25, "bandpass", 1900, sfxG, 3); tone(1200, t, 0.04, "square", 0.05); },
      grip: function (q) { var t = now(); var base = q < 0.15 ? 784 : q < 0.4 ? 659 : 523; tone(base, t, 0.12, "triangle", 0.18); tone(base * 1.25, t + 0.09, 0.18, "triangle", 0.16); },
      slip: function () { var t = now(); tone(520, t, 0.5, "triangle", 0.2, sfxG, 180); tone(380, t + 0.18, 0.45, "triangle", 0.14, sfxG, 140); boingAt(t + 0.05, 0.25); },
      miss: function () { var t = now(); tone(330, t, 0.16, "square", 0.06); tone(262, t + 0.16, 0.3, "square", 0.06, sfxG, 220); },
      boing: function (v) { var t = now(); if (t - lastBoing < 0.07) return; lastBoing = t; boingAt(t, v); },
      win: function (gold) {
        var t = now(); duck(1.6);
        ["C5", "E5", "G5", "C6", "E6"].forEach(function (n, k) { tone(nf(n), t + k * 0.07, 0.3, "square", 0.08); tone(nf(n) * 2, t + k * 0.07, 0.25, "triangle", 0.05); });
        tone(nf("C6"), t + 0.38, 0.7, "triangle", 0.16); tone(nf("G5"), t + 0.38, 0.7, "triangle", 0.1);
        for (var k = 0; k < (gold ? 14 : 7); k++) tone(rnd(1800, 3800), t + 0.4 + k * 0.06, 0.12, "sine", 0.06);
        noise(t, 0.2, 0.2, "lowpass", 400);
      },
      tick: function (last) { tone(last ? 1320 : 990, now(), 0.06, "square", 0.08); },
      over: function () { var t = now(); duck(2.2); ["G4", "E4", "C4"].forEach(function (n, k) { tone(nf(n), t + k * 0.22, 0.3, "square", 0.08); }); tone(nf("C3"), t + 0.66, 0.6, "triangle", 0.2); },
      rain: function () { var t = now(); for (var k = 0; k < 8; k++) boingAt(t + 0.25 + k * 0.09 + Math.random() * 0.05, 0.12); noise(t, 0.5, 0.06, "bandpass", 900); },
      bonus: function () { var t = now(); tone(nf("A5"), t, 0.1, "square", 0.08); tone(nf("D6"), t + 0.1, 0.2, "square", 0.08); }
    };
    function boingAt(t, v) {
      var f = rnd(230, 330);
      tone(f, t, 0.22, "sine", 0.12 + v * 0.35, sfxG, f * 1.9, 0.004);
      tone(f * 0.5, t, 0.12, "triangle", 0.05 + v * 0.1, sfxG, f, 0.004);
    }
    var api = {
      init: init, musicStart: musicStart, musicStop: musicStop, setMusic: setMusic, setSfx: setSfx,
      musicOn: function () { return musicOn; }, sfxOn: function () { return sfxOn; },
      suspend: function () { if (ctx) { musicStop(); ctx.suspend(); } },
      resume: function () { if (ctx) { ctx.resume(); musicStart(); } }
    };
    Object.keys(fx).forEach(function (k) { api[k] = function () { if (ctx && ctx.state !== "closed") try { fx[k].apply(null, arguments); } catch (e) { console.warn("sound " + k, e); } }; });
    api.fxNames = Object.keys(fx);
    api.state = function () { return ctx ? ctx.state + (playing ? " playing" : " stopped") : "none"; };
    return api;
  })();

  /* ================= sprites ================= */
  var SPR = 200; // pre-rendered sprite size in device pixels
  var sprites = {}; // id -> {open, happy, wink}
  function makeSprites() {
    var jobs = [];
    SQ.forEach(function (s) {
      sprites[s.id] = {};
      ["open", "happy", "wink"].forEach(function (mood) {
        var svg = window.squishSVG(s, mood).replace('<ellipse cx="100" cy="186" rx="64" ry="8" fill="rgba(74,59,92,.13)"/>', "");
        svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" ');
        jobs.push(new Promise(function (ok) {
          var img = new Image();
          img.onload = function () {
            var c = document.createElement("canvas"); c.width = c.height = SPR;
            c.getContext("2d").drawImage(img, 0, 0, SPR, SPR);
            sprites[s.id][mood] = c; ok();
          };
          img.onerror = function () { ok(); };
          img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        }));
      });
    });
    return Promise.all(jobs);
  }

  /* ================= physics bodies ================= */
  var bodies = [], uid = 0;
  var bag = [];
  function nextSquish() {
    if (!bag.length) { bag = SQ.map(function (s) { return s.id; }); for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; } }
    return byId[bag.pop()];
  }
  function addBody(x, y, gold) {
    var r = rnd(33, 41), s = nextSquish();
    var b = { id: ++uid, s: s, r: r, x: x, y: y, px: x - rnd(-1, 1), py: y, rot: rnd(-0.5, 0.5), w: 0,
      mood: ["open", "happy", "wink"][Math.floor(Math.random() * 3)], gold: !!gold, kin: false, press: 0, blink: rnd(2, 6) };
    bodies.push(b); return b;
  }
  function fillBin(n, fromTop) {
    for (var k = 0; k < n; k++) {
      var x = rnd(WALL_X + WALL_R + 45, GR - 45);
      var y = fromTop ? rnd(140, 330) - k * 18 : FLOOR - 45 - Math.floor(k / 6) * 70 - rnd(0, 20);
      addBody(x, y, false);
    }
  }
  function ensureGold() {
    if (bodies.some(function (b) { return b.gold; })) return;
    // the golden squish sits somewhere in the top half of the pile, so it's reachable but not a gift
    var top = bodies.slice().sort(function (a, b) { return a.y - b.y; }).slice(0, 14);
    var pick = top[Math.floor(Math.random() * top.length)];
    if (pick) pick.gold = true;
  }

  var hub = { x: HOME_X, y: TOP_Y, r: HUB_R };
  var events = { impacts: 0, maxImpact: 0 };

  function physics(dt) {
    var i, j, a, b, n = bodies.length, dt2 = dt * dt, maxStep = 1500 * dt;
    for (i = 0; i < n; i++) {
      b = bodies[i]; b.press = 0;
      if (b.kin) continue;
      var vx = (b.x - b.px) * 0.995, vy = (b.y - b.py) * 0.995;
      var sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > maxStep) { vx *= maxStep / sp; vy *= maxStep / sp; }
      b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + G * dt2;
      b.ground = false;
    }
    for (var it = 0; it < ITER; it++) {
      var first = it === 0;
      for (i = 0; i < n; i++) {
        a = bodies[i];
        for (j = i + 1; j < n; j++) {
          b = bodies[j];
          var dx = b.x - a.x, dy = b.y - a.y, R = a.r + b.r;
          if (dx > R || dx < -R || dy > R || dy < -R) continue;
          var d2 = dx * dx + dy * dy;
          if (d2 >= R * R || d2 < 1e-6) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = R - d;
          var wa = a.kin ? 0 : 1, wb = b.kin ? 0 : 1, ws = wa + wb;
          if (!ws) continue;
          if (first) {
            a.press += ov; b.press += ov;
            if (ny > 0.5) b.ground = true; else if (ny < -0.5) a.ground = true;
            var rvx = (a.x - a.px) - (b.x - b.px), rvy = (a.y - a.py) - (b.y - b.py);
            var vn = (rvx * nx + rvy * ny) / dt;
            if (vn > 0) { events.impacts++; if (vn > events.maxImpact) events.maxImpact = vn; }
            var tx = -ny, ty = nx, vt = (rvx * tx + rvy * ty) * FRIC;
            a.px += tx * vt * wa / ws; a.py += ty * vt * wa / ws;
            b.px -= tx * vt * wb / ws; b.py -= ty * vt * wb / ws;
          }
          var c = ov * STIFF / ws;
          a.x -= nx * c * wa; a.y -= ny * c * wa;
          b.x += nx * c * wb; b.y += ny * c * wb;
        }
        if (!a.kin) collideStatic(a, first, dt);
      }
    }
    // rolling and a gentle pull back to upright so most faces stay readable
    for (i = 0; i < n; i++) {
      b = bodies[i];
      if (b.kin) continue;
      var v = (b.x - b.px) / dt;
      if (b.ground) b.w += (v / b.r - b.w) * 0.25;
      b.w += -Math.sin(b.rot) * 5 * dt; b.w *= 0.985;
      b.rot += b.w * dt;
      if (b.rot > Math.PI) b.rot -= 2 * Math.PI; else if (b.rot < -Math.PI) b.rot += 2 * Math.PI;
    }
  }
  function collideStatic(b, first, dt) {
    var r = b.r;
    // claw hub (kinematic)
    // same radius the drop uses to stop, so the hub settles on a squish instead of shoving it down
    var hx = b.x - hub.x, hy = b.y - hub.y, hR = r + HUB_R - SINK, h2 = hx * hx + hy * hy;
    if (h2 < hR * hR && h2 > 1e-6) {
      var hd = Math.sqrt(h2), hov = hR - hd;
      if (first) b.press += hov;
      b.x += hx / hd * hov * STIFF; b.y += hy / hd * hov * STIFF;
    }
    if (b.x < GL + r) { b.x = GL + r; }
    if (b.x > GR - r) { b.x = GR - r; }
    if (b.y < GT + r) { b.y = GT + r; }
    // plexi wall: vertical capsule from (WALL_X, WALL_T) downwards
    var wy = Math.max(b.y, WALL_T), wx = b.x - WALL_X, wyy = b.y - wy, wR = r + WALL_R, w2 = wx * wx + wyy * wyy;
    if (w2 < wR * wR) {
      var wd = Math.sqrt(w2) || 0.001, wov = wR - wd;
      b.x += wx / wd * wov; b.y += wyy / wd * wov;
      if (first && wyy < -0.5 * wd) b.ground = true;
    }
    // bin floor (the chute side has no floor: that's the prize hole)
    if (b.x > WALL_X && b.y > FLOOR - r) {
      if (first) {
        var vy = (b.y - b.py) / dt;
        if (vy > 0) { events.impacts++; if (vy > events.maxImpact) events.maxImpact = vy; }
        b.px += (b.x - b.px) * 0.18; // floor friction
      }
      b.y = FLOOR - r; b.ground = true;
    }
  }

  /* ================= game state ================= */
  var claw = { x: HOME_X, y: TOP_Y, vx: 0, sway: 0, swayV: 0, open: 0, openT: 0, state: "title", t: 0, hold: null, timer: TURN_TIME, lastTick: 99, dropT: 0 };
  var game = { tokens: START_TOKENS, caught: 0, got: [], flash: 0, shake: 0, newBest: false };
  var input = { left: false, right: false, dragX: null };
  var dragId = null; // pointer currently steering by touch/mouse on the machine
  var particles = [], texts = [];

  function headX() { return claw.x + claw.sway; }

  function startGame() {
    Sound.init(); Sound.musicStart(); Sound.coin();
    game.tokens = START_TOKENS; game.caught = 0; game.got = []; game.newBest = false;
    store.plays++; save("sf_claw", store);
    claw.x = HOME_X; claw.y = TOP_Y; claw.vx = 0; claw.sway = 0; claw.swayV = 0; claw.open = 0; claw.openT = 0; claw.hold = null;
    if (bodies.length < REFILL_BELOW) refill();
    ensureGold();
    nextTurn();
    el.title.hidden = true; el.over.hidden = true;
  }
  function nextTurn() {
    claw.state = "ready"; claw.timer = TURN_TIME; claw.lastTick = 99;
    updatePad();
  }
  function doDrop() {
    if (claw.state !== "ready") return;
    game.tokens--; Sound.coin(); Sound.zip(false);
    claw.state = "drop"; claw.t = 0; claw.vx = 0; claw.openT = 1; input.dragX = null;
    updatePad();
  }
  function refill() {
    var n = Math.min(12, BIN_COUNT - bodies.length);
    if (n <= 0) return;
    fillBin(n, true); ensureGold(); Sound.rain();
    float("Refill!", W / 2, 260, "#9fe7ff");
  }

  /* the grab: how centred the claw is on the squish decides how well it holds */
  function evalGrab() {
    var hx = headX(), best = null, bestOff = 9;
    bodies.forEach(function (b) {
      if (b.kin) return;
      var dx = b.x - hx, dy = b.y - claw.y;
      if (dy < -4 || dy > b.r + HUB_R + 34) return;
      var off = Math.abs(dx) / b.r;
      if (off < 1.0 && off < bestOff) { bestOff = off; best = b; }
    });
    if (!best) return null;
    var load = 0;
    bodies.forEach(function (o) {
      if (o === best || o.kin) return;
      var dx = o.x - best.x, dy = o.y - best.y, R = o.r + best.r + 4;
      if (dx * dx + dy * dy < R * R && dy < -best.r * 0.35) load++;
    });
    // 95% when dead centre, about 50/50 halfway to the edge, hopeless on the very edge
    var p = bestOff < 0.15 ? 0.95 : bestOff > 0.8 ? 0.05 : 0.95 - (bestOff - 0.15) / 0.65 * 0.9;
    p -= load * 0.12;
    if (best.gold) p -= 0.07;
    p = clamp(p, 0.03, 0.98);
    var ok = Math.random() < p;
    return { b: best, off: bestOff, p: p, load: load, dx: clamp(best.x - hx, -best.r * 0.55, best.r * 0.55),
      slipAt: ok ? -1 : (bestOff > 0.7 ? rnd(0.05, 0.3) : rnd(0.35, 2.2)), t: 0, ang: 0, av: 0 };
  }
  function releaseHold(kick) {
    var h = claw.hold; if (!h) return;
    var b = h.b; b.kin = false;
    var vx = (b.x - b.px), vy = (b.y - b.py);
    b.px = b.x - vx - (kick || 0) * STEP; b.py = b.y - vy;
    b.w = (h.dx > 0 ? 1 : -1) * 2;
    claw.hold = null;
  }

  function update(dt) {
    var c = claw, prevVx = c.vx;
    // claw opening animation
    var targetOpen = c.openT;
    // arms rest wrapped around the held squish: tips hug its sides instead of closing through it
    if (c.hold && targetOpen < 0.5) targetOpen = (Math.asin(clamp((c.hold.b.r * 0.62 - 15) / 74, -1, 1)) + 0.47) / 0.8;
    c.open += clamp(targetOpen - c.open, -dt * 3.2, dt * 4);

    switch (c.state) {
      case "ready": {
        var dir = (input.left ? -1 : 0) + (input.right ? 1 : 0), want;
        if (dir) input.dragX = null; // arrows / buttons take over from a tap target
        if (input.dragX != null) {
          var gap = clamp(input.dragX, MIN_X, MAX_X) - c.x;
          want = clamp(gap * 7, -MOVE_V, MOVE_V);
          // tap target reached: park exactly on it (keeps going after the finger lifts, so a tap works like "go here")
          if (Math.abs(gap) < 0.6 && dragId === null) { c.x += gap; c.vx = 0; want = 0; input.dragX = null; }
        } else want = dir * MOVE_V;
        c.vx += clamp(want - c.vx, -MOVE_A * dt, MOVE_A * dt);
        c.x += c.vx * dt;
        if (c.x < MIN_X) { c.x = MIN_X; c.vx = 0; }
        if (c.x > MAX_X) { c.x = MAX_X; c.vx = 0; }
        Sound.motor(Math.min(1, Math.abs(c.vx) / MOVE_V), 0.8 + Math.abs(c.vx) / MOVE_V * 0.5);
        c.timer -= dt;
        var sec = Math.ceil(c.timer);
        if (sec <= 5 && sec < c.lastTick && sec > 0) { c.lastTick = sec; Sound.tick(false); }
        if (c.timer <= 0) { Sound.tick(true); float("Time's up!", headX(), c.y + 120, "#ffd166"); doDrop(); }
        break;
      }
      case "drop": {
        Sound.motor(0.75, 1.5);
        var ny = c.y + DROP_V * dt, hx = headX(), stop = false, hitBody = false;
        if (c.open < 0.95) ny = c.y + DROP_V * dt * 0.5; // still opening: ease in
        bodies.forEach(function (b) {
          if (b.kin) return;
          var R = HUB_R + b.r - SINK, dx = b.x - hx;
          if (Math.abs(dx) >= R) return;
          var yc = b.y - Math.sqrt(R * R - dx * dx);
          if (yc > c.y - 2 && ny >= yc) { ny = Math.min(ny, yc); stop = true; hitBody = true; }
        });
        if (ny >= MAX_HUB_Y) { ny = MAX_HUB_Y; stop = true; }
        c.y = ny;
        if (stop) { c.state = "grab"; c.t = 0; Sound.thunk(!hitBody); Sound.motor(0, 1); if (hitBody) Sound.boing(0.3); }
        break;
      }
      case "grab": {
        c.t += dt;
        if (c.t > 0.12 && c.openT) { c.openT = 0; Sound.clack(); }
        if (c.t > 0.34 && !c.hold && !c.grabbed) {
          c.grabbed = true;
          var h = evalGrab();
          c.lastGrab = h;
          if (h) {
            c.hold = h; h.b.kin = true; h.b.mood = "happy";
            var label = h.off < 0.15 ? "Perfect grab!" : h.off < 0.4 ? "Good grab" : "Wobbly...";
            float(label, headX(), c.y - 40, h.off < 0.15 ? "#7dffb0" : h.off < 0.4 ? "#fff" : "#ffd166");
            Sound.grip(h.off);
          } else { float("Missed!", headX(), c.y - 40, "#ff9cc2"); Sound.miss(); }
        }
        if (c.t > 0.7) { c.state = "lift"; c.t = 0; c.grabbed = false; Sound.zip(true); }
        break;
      }
      case "lift": {
        Sound.motor(0.8, c.hold ? 1.1 : 1.35);
        c.y -= LIFT_V * dt;
        if (c.y <= TOP_Y) { c.y = TOP_Y; c.state = "carry"; c.shakeT = 0; if (c.hold) c.hold.av += (c.hold.dx > 0 ? 1 : -1) * 2.5; }
        break;
      }
      case "carry": {
        var d = HOME_X - c.x;
        var v = clamp(d * 4, -CARRY_V, CARRY_V);
        c.vx = v; c.x += v * dt;
        Sound.motor(Math.min(1, Math.abs(v) / CARRY_V) * 0.9, 0.9);
        if (Math.abs(d) < 1.5) { c.x = HOME_X; c.vx = 0; c.state = "release"; c.t = 0; c.openT = 1; Sound.motor(0, 1); }
        break;
      }
      case "release": {
        c.t += dt;
        if (c.t > 0.12 && c.hold) { releaseHold(0); }
        if (c.t > 0.75 && c.openT) c.openT = 0;
        if (c.t > 1.1) {
          if (bodies.length < REFILL_BELOW) refill();
          if (game.tokens > 0) nextTurn(); else { c.state = "ending"; c.t = 0; updatePad(); }
        }
        break;
      }
      case "ending": {
        c.t += dt;
        if (game.tokens > 0) { nextTurn(); break; } // a late catch won a bonus token
        if (c.t > 1.6) gameOver();
        break;
      }
    }
    if (c.state !== "ready") { if (c.state !== "carry") c.vx = 0; }

    // pendulum sway of the claw head from the gantry's acceleration
    var acc = (c.vx - prevVx) / dt;
    c.swayV += (-c.sway * 70 - acc * 0.012 - c.swayV * (c.state === "drop" ? 14 : 5.5)) * dt;
    c.sway += c.swayV * dt;
    c.sway = clamp(c.sway, -12, 12);

    hub.x = headX(); hub.y = c.y;

    // held squish follows the claw with a little swing; maybe it slips
    var h2 = c.hold;
    if (h2) {
      var b = h2.b;
      if (c.state === "lift" || c.state === "carry") {
        h2.t += dt;
        if (h2.slipAt >= 0 && h2.t > h2.slipAt) {
          float(c.state === "carry" ? "So close!" : "Oops!", b.x, b.y - b.r - 10, "#ffd166");
          b.mood = "open"; Sound.slip();
          releaseHold(c.vx * 0.6);
          h2 = null;
        }
      }
      if (h2) {
        h2.av += (-h2.ang * 38 - acc * 0.0022 - h2.av * 3.2) * dt;
        h2.ang += h2.av * dt; h2.ang = clamp(h2.ang, -0.6, 0.6);
        var len = b.r * 0.9 + HUB_R * 0.6;
        var tx = hub.x + h2.dx * 0.8 + Math.sin(h2.ang) * len * 0.5;
        var ty = hub.y + HUB_R + b.r * 0.92 - (1 - Math.cos(h2.ang)) * len * 0.5;
        b.px = b.x; b.py = b.y;
        b.x += (tx - b.x) * 0.35; b.y += (ty - b.y) * 0.35;
        var tilt = h2.dx / b.r * 0.6 + h2.ang * 0.8;
        b.rot += (tilt - b.rot) * 0.2;
      }
    }

    events.impacts = 0; events.maxImpact = 0;
    physics(dt);
    if (events.maxImpact > 650) Sound.boing(Math.min(1, (events.maxImpact - 650) / 1400));

    // prize chute: anything that falls out the bottom on the chute side is caught
    for (var i = bodies.length - 1; i >= 0; i--) {
      var q = bodies[i];
      if (q.y > FLOOR + q.r + 6 && q.x < WALL_X) { bodies.splice(i, 1); if (c.state !== "title") onCatch(q); } // spills while the pile settles don't count
      else if (q.y > H + 300 || isNaN(q.x) || isNaN(q.y)) bodies.splice(i, 1);
    }

    // blinking
    bodies.forEach(function (b) { b.blink -= dt; if (b.blink < -0.13) b.blink = rnd(2, 7); });

    // particles and floating text
    for (var p = particles.length - 1; p >= 0; p--) {
      var pt = particles[p]; pt.life -= dt;
      if (pt.life <= 0) { particles.splice(p, 1); continue; }
      pt.vy += pt.g * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.rot += pt.vr * dt;
    }
    for (var k = texts.length - 1; k >= 0; k--) { texts[k].life -= dt; texts[k].y -= 34 * dt; if (texts[k].life <= 0) texts.splice(k, 1); }
    if (game.flash > 0) game.flash -= dt;
    if (game.shake > 0) game.shake -= dt;
  }

  function onCatch(b) {
    var s = b.s, isNew = !store.shelf[s.id];
    store.shelf[s.id] = (store.shelf[s.id] || 0) + 1;
    if (b.gold) store.gold[s.id] = true;
    game.caught++; game.got.push({ s: s, gold: b.gold });
    var bonus = (isNew ? 1 : 0) + (b.gold ? 2 : 0);
    game.tokens += bonus;
    if (game.caught > store.best) { store.best = game.caught; game.newBest = true; }
    save("sf_claw", store);
    Sound.win(b.gold); if (bonus) setTimeout(Sound.bonus, 650);
    game.flash = b.gold ? 2.4 : 1.6; game.shake = 0.25;
    burst(HOME_X, FLOOR + 10, b.gold ? 46 : 28, b.gold);
    float(b.gold ? "GOLDEN!" : "Caught!", HOME_X + 40, FLOOR - 80, b.gold ? "#ffd166" : "#7dffb0");
    if (bonus) float("+" + bonus + " token" + (bonus > 1 ? "s" : ""), HOME_X + 60, FLOOR - 40, "#ffd166");
    showToast(s, isNew, b.gold, bonus);
    renderShelf();
    updatePad();
  }
  function burst(x, y, n, gold) {
    var chars = gold ? ["✨", "⭐", "💛"] : ["💗", "⭐", "💜", "✨", "💙"];
    for (var i = 0; i < n; i++) {
      var a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), v = rnd(250, 620);
      particles.push({ x: x + rnd(-30, 30), y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 900, life: rnd(0.9, 1.6), max: 1.6,
        ch: chars[i % chars.length], size: rnd(18, 32), rot: rnd(-1, 1), vr: rnd(-4, 4) });
    }
  }
  function float(text, x, y, color) { texts.push({ text: text, x: clamp(x, 110, W - 110), y: y, life: 1.3, color: color || "#fff" }); }

  function gameOver() {
    claw.state = "over"; Sound.over(); Sound.motor(0, 1);
    var n = game.caught;
    el.overText.innerHTML = n === 0 ? "No squishes this time. Line the claw up with the middle of one and try again!" :
      "You caught <b>" + n + "</b> squish" + (n === 1 ? "" : "es") + "!" + (game.newBest ? " 🏆 New best!" : " Best: " + store.best + ".");
    el.overGot.innerHTML = game.got.map(function (g) { return window.squishSVG(g.s, "happy"); }).join("");
    el.over.hidden = false; updatePad();
    setTimeout(function () { try { el.again.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }

  /* ================= rendering ================= */
  var cv = document.getElementById("game"), ctx = cv.getContext("2d"), scale = 1, dpr = 1;
  var bg = null, stars = [];
  for (var si = 0; si < 60; si++) stars.push({ x: rnd(GL, GR), y: rnd(GT, FLOOR - 40), r: rnd(0.8, 2.4), p: rnd(0, 6) });
  function resize() {
    var cssW = cv.clientWidth || 360;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssW * H / W * dpr);
    scale = cv.width / W;
    bg = null;
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  function buildBg() {
    // static parts of the cabinet drawn once into an offscreen canvas
    var b = document.createElement("canvas"); b.width = cv.width; b.height = cv.height;
    var c = b.getContext("2d"); c.setTransform(scale, 0, 0, scale, 0, 0);
    var fr = c.createLinearGradient(0, 0, 0, H); fr.addColorStop(0, "#ff8fbd"); fr.addColorStop(0.5, "#c46ee0"); fr.addColorStop(1, "#7a4fd6");
    rr(c, 0, 0, W, H, 30); c.fillStyle = fr; c.fill();
    // marquee
    rr(c, 12, 10, W - 24, 82, 22); var mq = c.createLinearGradient(0, 10, 0, 92); mq.addColorStop(0, "#43307a"); mq.addColorStop(1, "#2a1d52"); c.fillStyle = mq; c.fill();
    // glass back wall: a dreamy night sky
    var sky = c.createLinearGradient(0, GT, 0, FLOOR); sky.addColorStop(0, "#1f1745"); sky.addColorStop(0.55, "#3b2a78"); sky.addColorStop(1, "#6a4aa8");
    rr(c, GL, GT, GR - GL, FLOOR - GT, 14); c.fillStyle = sky; c.fill();
    c.save(); rr(c, GL, GT, GR - GL, FLOOR - GT, 14); c.clip();
    c.fillStyle = "rgba(255,255,255,.08)";
    [[150, 330, 70], [560, 260, 90], [380, 200, 55]].forEach(function (k) { // soft clouds
      c.beginPath(); c.arc(k[0], k[1], k[2] * 0.6, 0, 7); c.arc(k[0] + k[2] * 0.6, k[1] + 6, k[2] * 0.5, 0, 7); c.arc(k[0] - k[2] * 0.6, k[1] + 8, k[2] * 0.45, 0, 7); c.fill();
    });
    c.fillStyle = "#fff4c4"; c.beginPath(); c.arc(610, 170, 30, 0, 7); c.fill();               // moon
    c.fillStyle = "#3b2a78"; c.beginPath(); c.arc(624, 160, 26, 0, 7); c.fill();
    // floor shadow
    var fl = c.createLinearGradient(0, FLOOR - 90, 0, FLOOR); fl.addColorStop(0, "rgba(0,0,0,0)"); fl.addColorStop(1, "rgba(20,10,40,.45)");
    c.fillStyle = fl; c.fillRect(GL, FLOOR - 90, GR - GL, 90);
    // chute: a darker hole with arrows
    var ch = c.createLinearGradient(0, WALL_T, 0, FLOOR); ch.addColorStop(0, "rgba(255,127,174,.05)"); ch.addColorStop(1, "rgba(255,127,174,.28)");
    c.fillStyle = ch; c.fillRect(GL, WALL_T, WALL_X - GL, FLOOR - WALL_T);
    c.restore();
    c.fillStyle = "rgba(255,255,255,.55)"; c.font = '800 22px "Baloo 2", sans-serif'; c.textAlign = "center";
    c.fillText("PRIZE", (GL + WALL_X) / 2, WALL_T + 40);
    c.font = '800 26px "Baloo 2", sans-serif'; c.fillText("⬇", (GL + WALL_X) / 2, WALL_T + 74);
    // front panel below the glass
    rr(c, 14, FLOOR + 8, W - 28, H - FLOOR - 20, 16); c.fillStyle = "rgba(42,29,82,.55)"; c.fill();
    rr(c, GL + 6, FLOOR + 14, WALL_X - GL - 12, 46, 10); c.fillStyle = "#1a1233"; c.fill();     // prize door
    c.strokeStyle = "#ffb3d1"; c.lineWidth = 3; c.stroke();
    c.fillStyle = "#ffb3d1"; c.font = '800 17px "Baloo 2", sans-serif'; c.fillText("PUSH", (GL + WALL_X) / 2, FLOOR + 44);
    rr(c, GR - 66, FLOOR + 16, 40, 42, 8); c.fillStyle = "#1a1233"; c.fill();                    // coin slot
    c.fillStyle = "#ffd166"; c.fillRect(GR - 49, FLOOR + 24, 6, 26);
    // gantry rail
    var rail = c.createLinearGradient(0, 108, 0, 124); rail.addColorStop(0, "#f3f0ff"); rail.addColorStop(1, "#9c92c4");
    c.fillStyle = rail; rr(c, GL + 6, 110, GR - GL - 12, 12, 6); c.fill();
    bg = b;
  }

  function drawStatic() { if (!bg) buildBg(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg, 0, 0); ctx.setTransform(scale, 0, 0, scale, 0, 0); }

  function drawBody(b, time) {
    var spr = sprites[b.s.id]; if (!spr) return;
    var mood = b.blink < 0 && b.mood === "open" ? "happy" : b.mood;
    var img = spr[mood] || spr.open; if (!img) return;
    var S = b.r / 0.41, sq = Math.min(0.16, b.press / b.r * 0.3);
    var sy = 1 - sq, sx = 1 + sq * 0.7;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
    if (b.gold) {
      var gl = ctx.createRadialGradient(0, 0, b.r * 0.6, 0, 0, b.r * 1.5);
      var pulse = 0.55 + 0.25 * Math.sin(time * 5);
      gl.addColorStop(0, "rgba(255,209,102," + pulse + ")"); gl.addColorStop(1, "rgba(255,209,102,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, b.r * 1.5, 0, 7); ctx.fill();
    }
    ctx.scale(sx, sy);
    ctx.drawImage(img, -S * 0.5, -S * 0.55, S, S);
    if (b.gold) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 7 + b.id);
      ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.fillText("✨", b.r * 0.6, -b.r * 0.7);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function arm(side, hx, hy, open) {
    // each arm pivots at the hub's side, swings out when open and curls in at the tip
    var ang = (-0.12 + open * 0.8) * side, L = 74;
    var px = hx + side * 15, py = hy + 10;
    var mx = px + Math.sin(ang + side * 0.28) * L * 0.62, my = py + Math.cos(ang) * L * 0.62;
    var tx = px + Math.sin(ang - side * 0.35) * L, ty = py + Math.cos(ang) * L;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#5d5486"; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(mx + side * 6, my, tx, ty); ctx.stroke();
    ctx.strokeStyle = "#d9d4f2"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(mx + side * 6, my, tx, ty); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px - side * 2, py); ctx.quadraticCurveTo(mx + side * 3, my, tx - side * 2, ty - 2); ctx.stroke();
    ctx.fillStyle = "#ff7fae"; ctx.beginPath(); ctx.arc(tx, ty, 7.5, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(tx - 2, ty - 2.5, 2.4, 0, 7); ctx.fill();
  }

  function drawClaw() {
    var hx = headX(), hy = claw.y, cx = claw.x;
    // carriage on the rail
    rr(ctx, cx - 30, 104, 60, 26, 8); var cg = ctx.createLinearGradient(0, 104, 0, 130); cg.addColorStop(0, "#ffb3d1"); cg.addColorStop(1, "#e0609a");
    ctx.fillStyle = cg; ctx.fill();
    ctx.fillStyle = "#43307a"; ctx.beginPath(); ctx.arc(cx - 16, 130, 5, 0, 7); ctx.arc(cx + 16, 130, 5, 0, 7); ctx.fill();
    // cable
    ctx.strokeStyle = "#cfc8ea"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cx, 128); ctx.lineTo(hx, hy - HUB_R + 4); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(cx + 1, 128); ctx.lineTo(hx + 1, hy - HUB_R + 4); ctx.stroke(); ctx.setLineDash([]);
    // middle prong (further back, so shorter and darker)
    var mo = claw.open;
    ctx.strokeStyle = "#4a4270"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(hx, hy + 8); ctx.quadraticCurveTo(hx + 4, hy + 40, hx - 2 + mo * 2, hy + 60 - mo * 6); ctx.stroke();
    ctx.fillStyle = "#c44f86"; ctx.beginPath(); ctx.arc(hx - 2 + mo * 2, hy + 60 - mo * 6, 5.5, 0, 7); ctx.fill();
    // hub
    var hg = ctx.createRadialGradient(hx - 8, hy - 8, 4, hx, hy, HUB_R + 4);
    hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.5, "#cdc6ee"); hg.addColorStop(1, "#7d72b0");
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, HUB_R, 0, 7); ctx.fill();
    ctx.strokeStyle = "#5d5486"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#ff7fae"; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "11px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♥", hx, hy + 1); ctx.textBaseline = "alphabetic";
  }
  // side arms are drawn after the held squish so they wrap around it
  function drawArms() { arm(-1, headX(), claw.y, claw.open); arm(1, headX(), claw.y, claw.open); }

  function aimTarget() {
    // first squish the claw would land on, straight below the head (same test as the drop)
    var hx = headX(), best = null, yBest = MAX_HUB_Y;
    bodies.forEach(function (b) {
      if (b.kin) return;
      var R = HUB_R + b.r - SINK, dx = b.x - hx;
      if (Math.abs(dx) >= R) return;
      var yc = b.y - Math.sqrt(R * R - dx * dx);
      if (yc > claw.y && yc < yBest) { yBest = yc; best = b; }
    });
    return { y: yBest, b: best };
  }
  function drawAim(time) {
    var a = aimTarget(), hx = headX();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 3; ctx.setLineDash([4, 10]); ctx.lineDashOffset = -time * 30;
    ctx.beginPath(); ctx.moveTo(hx, claw.y + 70); ctx.lineTo(hx, a.y + HUB_R); ctx.stroke(); ctx.setLineDash([]);
    if (a.b) {
      var off = Math.abs(a.b.x - hx) / a.b.r;
      ctx.strokeStyle = off < 0.15 ? "rgba(125,255,176,.95)" : off < 0.4 ? "rgba(255,255,255,.8)" : "rgba(255,209,102,.8)";
      ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(hx, a.y + HUB_R, 13, 5, 0, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }

  function drawMarquee(time) {
    // chasing bulbs
    var n = 17, flash = game.flash > 0;
    for (var i = 0; i < n; i++) {
      var x = 34 + i * ((W - 68) / (n - 1)), on = flash ? (Math.floor(time * 12) + i) % 2 === 0 : (Math.floor(time * 4) - i) % 4 === 0;
      var col = flash ? ["#ff7fae", "#ffd166", "#7dffb0", "#9fe7ff"][(i + Math.floor(time * 10)) % 4] : "#ffd166";
      ctx.fillStyle = on ? col : "rgba(255,209,102,.25)";
      ctx.beginPath(); ctx.arc(x, 18, 4.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x, 84, 4.5, 0, 7); ctx.fill();
    }
    // title
    ctx.textAlign = "center"; ctx.font = '800 42px "Baloo 2", sans-serif';
    ctx.fillStyle = "#b23d6d"; ctx.fillText("Dream Catcher", W / 2, 68);
    ctx.fillStyle = flash ? (Math.floor(time * 8) % 2 ? "#fff" : "#ffd166") : "#ffe3ef"; ctx.fillText("Dream Catcher", W / 2, 65);
    // little dreamcatchers each side
    [74, W - 74].forEach(function (x, k) {
      ctx.save(); ctx.translate(x, 46); ctx.rotate(Math.sin(time * 2 + k) * 0.08);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.2; ctx.beginPath();
      for (var q = 0; q < 6; q++) { var a = q / 6 * Math.PI * 2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); }
      ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.stroke();
      ctx.fillStyle = "#ff9cc2"; [-8, 0, 8].forEach(function (fx) { ctx.beginPath(); ctx.ellipse(fx, 25 + (fx ? 0 : 4), 3, 7, 0, 0, 7); ctx.fill(); });
      ctx.restore();
    });
  }

  function drawHud() {
    // token coin drawn by hand (the coin emoji is missing on older phones and Windows 10)
    var cx = WALL_X + 34, cy = FLOOR + 38;
    ctx.fillStyle = "#e0a526"; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(cx, cy, 11.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#e0a526"; ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = "center"; ctx.fillText("♥", cx, cy + 5);
    ctx.textAlign = "left"; ctx.font = '800 26px "Baloo 2", sans-serif';
    ctx.fillStyle = "#fff"; ctx.fillText("× " + game.tokens, cx + 22, FLOOR + 47);
    ctx.textAlign = "center"; ctx.fillText("🧸 " + game.caught + " caught", W / 2 + 50, FLOOR + 47);
    if (claw.state === "ready") {
      var t = Math.max(0, Math.ceil(claw.timer)), low = t <= 5;
      ctx.textAlign = "right"; ctx.fillStyle = low ? (Math.floor(claw.timer * 4) % 2 ? "#ff9cc2" : "#fff") : "#fff";
      ctx.fillText("⏱ " + t, GR - 82, FLOOR + 47);
    }
  }

  function drawGlass() {
    ctx.save(); rr(ctx, GL, GT, GR - GL, FLOOR - GT, 14); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,.07)";
    ctx.beginPath(); ctx.moveTo(GL + 40, GT); ctx.lineTo(GL + 120, GT); ctx.lineTo(GL - 160, FLOOR); ctx.lineTo(GL - 240, FLOOR); ctx.fill();
    ctx.beginPath(); ctx.moveTo(GR - 150, GT); ctx.lineTo(GR - 118, GT); ctx.lineTo(GR - 420, FLOOR); ctx.lineTo(GR - 452, FLOOR); ctx.fill();
    ctx.restore();
    // plexi chute wall
    ctx.fillStyle = "rgba(220,235,255,.28)"; rr(ctx, WALL_X - WALL_R, WALL_T - WALL_R, WALL_R * 2, FLOOR - WALL_T + WALL_R, WALL_R); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(WALL_X - 3, WALL_T); ctx.lineTo(WALL_X - 3, FLOOR); ctx.stroke();
    // glass frame
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 4; rr(ctx, GL, GT, GR - GL, FLOOR - GT, 14); ctx.stroke();
  }

  function render(time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawStatic();
    var sh = game.shake > 0 ? game.shake * 14 : 0;
    ctx.save(); if (sh) ctx.translate(rnd(-sh, sh), rnd(-sh, sh));
    // twinkling stars on the back wall
    stars.forEach(function (s) { ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 2 + s.p); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    if (claw.state === "ready") drawAim(time);
    var held = claw.hold && claw.hold.b;
    for (var i = 0; i < bodies.length; i++) if (bodies[i] !== held) drawBody(bodies[i], time);
    drawClaw();
    if (held) drawBody(held, time);
    drawArms();
    drawGlass();
    ctx.restore();
    drawMarquee(time);
    drawHud();
    particles.forEach(function (p) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 0.4); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.font = p.size + "px serif"; ctx.textAlign = "center"; ctx.fillText(p.ch, 0, 0); ctx.restore();
    });
    texts.forEach(function (t) {
      ctx.globalAlpha = Math.min(1, t.life / 0.35); ctx.textAlign = "center"; ctx.font = '800 34px "Baloo 2", sans-serif';
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(42,29,82,.85)"; ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); ctx.globalAlpha = 1;
    });
  }

  /* ================= loop ================= */
  var last = 0, accT = 0, running = true, simTime = 0;
  function frame(ts) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    accT += dt;
    while (accT >= STEP) { update(STEP); accT -= STEP; simTime += STEP; }
    render(ts / 1000);
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; Sound.suspend(); input.left = input.right = false; input.dragX = null; setPressed(); }
    else if (!running) { running = true; last = 0; Sound.resume(); requestAnimationFrame(frame); }
  });

  /* ================= input ================= */
  var el = {
    title: document.getElementById("title"), over: document.getElementById("over"), overText: document.getElementById("overText"),
    overGot: document.getElementById("overGot"), play: document.getElementById("playBtn"), again: document.getElementById("againBtn"),
    left: document.getElementById("leftBtn"), right: document.getElementById("rightBtn"), drop: document.getElementById("dropBtn"),
    toast: document.getElementById("toast"), music: document.getElementById("musicBtn"), sfx: document.getElementById("sfxBtn"),
    shelfGrid: document.getElementById("shelfGrid"), shelfSub: document.getElementById("shelfSub")
  };
  var held = { left: { key: false, btn: false }, right: { key: false, btn: false } };
  function syncInput() { input.left = held.left.key || held.left.btn; input.right = held.right.key || held.right.btn; setPressed(); }
  function setPressed() { el.left.classList.toggle("on", input.left); el.right.classList.toggle("on", input.right); }
  function updatePad() {
    var ready = claw.state === "ready";
    el.drop.disabled = !ready; el.left.disabled = !ready; el.right.disabled = !ready;
    if (!ready) { held.left.btn = held.right.btn = false; syncInput(); input.dragX = null; }
  }
  function nudge(dir) { if (claw.state === "ready") { claw.x = clamp(claw.x + dir * 2, MIN_X, MAX_X); } }

  var KEYS = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "drop", ArrowDown: "drop", KeyS: "drop", Enter: "drop" };
  window.addEventListener("keydown", function (e) {
    var k = KEYS[e.code]; if (!k) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.target && e.target.tagName === "A" && e.code === "Enter") return;
    e.preventDefault();
    if (k === "drop") {
      if (e.repeat) return;
      if (claw.state === "title") return startGame();
      if (claw.state === "over") return startGame();
      return doDrop();
    }
    if (!held[k].key && !e.repeat) nudge(k === "left" ? -1 : 1);
    held[k].key = true; syncInput();
  });
  window.addEventListener("keyup", function (e) {
    var k = KEYS[e.code]; if (!k) return;
    e.preventDefault();
    if (k !== "drop") { held[k].key = false; syncInput(); }
  });
  window.addEventListener("blur", function () { held.left.key = held.right.key = held.left.btn = held.right.btn = false; input.dragX = null; syncInput(); });

  function holdButton(btn, k) {
    function down(e) {
      e.preventDefault(); if (btn.disabled) return;
      Sound.init();
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      if (!held[k].btn) nudge(k === "left" ? -1 : 1);
      held[k].btn = true; syncInput();
    }
    function up(e) { held[k].btn = false; syncInput(); }
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  holdButton(el.left, "left"); holdButton(el.right, "right");
  el.drop.addEventListener("pointerdown", function (e) {
    e.preventDefault(); if (el.drop.disabled) return;
    el.drop.classList.add("on"); setTimeout(function () { el.drop.classList.remove("on"); }, 140);
    doDrop();
  });
  el.drop.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  // keyboard users who tab to the buttons
  el.drop.addEventListener("click", function (e) { if (e.detail === 0) doDrop(); });

  // drag on the machine to steer
  function worldX(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
  cv.addEventListener("pointerdown", function (e) {
    if (claw.state !== "ready") return;
    e.preventDefault(); Sound.init();
    dragId = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    input.dragX = worldX(e);
  });
  cv.addEventListener("pointermove", function (e) { if (dragId === e.pointerId && claw.state === "ready") input.dragX = worldX(e); });
  function endDrag(e) { if (dragId === e.pointerId) { dragId = null; } }
  cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  el.play.addEventListener("click", startGame);
  el.again.addEventListener("click", startGame);

  function setToggle(btn, on, onText, offText) { btn.textContent = on ? onText : offText; btn.setAttribute("aria-pressed", on ? "true" : "false"); }
  setToggle(el.music, Sound.musicOn(), "🎵 Music", "🔇 Music");
  setToggle(el.sfx, Sound.sfxOn(), "🔊 Sounds", "🔈 Sounds");
  el.music.addEventListener("click", function () { var on = !Sound.musicOn(); Sound.init(); Sound.setMusic(on); if (on) Sound.musicStart(); setToggle(el.music, on, "🎵 Music", "🔇 Music"); el.music.blur(); });
  el.sfx.addEventListener("click", function () { var on = !Sound.sfxOn(); Sound.init(); Sound.setSfx(on); if (on) Sound.blip(); setToggle(el.sfx, on, "🔊 Sounds", "🔈 Sounds"); el.sfx.blur(); });

  /* ================= toast + shelf ================= */
  var toastTimer;
  function showToast(s, isNew, gold, bonus) {
    el.toast.className = "toast show" + (gold ? " gold" : "");
    el.toast.innerHTML = window.squishSVG(s, "happy") + "<div><b>" + (gold ? "✨ Golden " : "") + s.name + "!</b><span>" +
      (isNew ? "New on your shelf!" : "Another one for the shelf") + (bonus ? " +" + bonus + " token" + (bonus > 1 ? "s" : "") : "") + "</span></div>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.className = "toast" + (gold ? " gold" : ""); }, 2300);
  }
  function renderShelf() {
    var have = SQ.filter(function (s) { return store.shelf[s.id]; }).length;
    el.shelfSub.textContent = have === SQ.length ? "You caught all 24! 🏆 Best game: " + store.best + " squishes." :
      have + " of " + SQ.length + " caught" + (store.best ? ". Best game: " + store.best + "." : ". Catch them all!");
    el.shelfGrid.innerHTML = SQ.map(function (s) {
      var n = store.shelf[s.id] || 0;
      if (!n) return '<div class="cell no">' + window.squishSVG(s, "open") + "???</div>";
      return '<a class="cell' + (store.gold[s.id] ? " gold" : "") + '" href="/squishes/' + slug(s) + '">' + window.squishSVG(s, "happy") +
        (n > 1 ? "<i>×" + n + "</i>" : "") + s.name.replace(/ the /, "<br>the ") + "</a>";
    }).join("");
  }

  /* ================= boot ================= */
  window.addEventListener("resize", resize);
  resize();
  renderShelf();
  updatePad();
  Promise.all([makeSprites(), document.fonts ? document.fonts.load('800 40px "Baloo 2"').catch(function () {}) : null]).then(function () {
    bg = null;
    fillBin(BIN_COUNT, false);
    for (var k = 0; k < 600; k++) update(STEP); // let the pile settle before anyone sees it
    for (var i = bodies.length - 1; i >= 0; i--) if (bodies[i].x < WALL_X) bodies.splice(i, 1);
    ensureGold();
    requestAnimationFrame(frame);
  });

  // hooks for automated tests
  window.__claw = {
    claw: claw, game: game, bodies: function () { return bodies; }, input: input, store: store, sound: Sound,
    start: startGame, drop: doDrop, aim: aimTarget, headX: headX, evalGrab: evalGrab,
    setX: function (x) { claw.x = clamp(x, MIN_X, MAX_X); claw.vx = 0; claw.sway = 0; claw.swayV = 0; },
    sim: function (sec) { var n = Math.round(sec / STEP); for (var i = 0; i < n; i++) update(STEP); },
    consts: { W: W, H: H, WALL_X: WALL_X, WALL_T: WALL_T, FLOOR: FLOOR, MIN_X: MIN_X, MAX_X: MAX_X, HOME_X: HOME_X }
  };
})();
