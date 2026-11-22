/* Squish Finder mini quizzes: KPop Demon Hunters Squishmallows, NeeDoh, Mystery Squishy Dumplings.
   Page sets <body data-mini="kpdh|needoh|dumpling"> and has <div id="mq"></div>.
   Fan-made. All art is original. Counters are anonymous (see squishes/page.js). */
(function () {
  var INK = "#2e2433";

  /* ---------------- art helpers (viewBox 0 0 200 200) ---------------- */
  function shadow() { return '<ellipse cx="100" cy="188" rx="62" ry="7" fill="rgba(46,36,51,.14)"/>'; }
  function eyes(y, o) {
    o = o || {}; var c = o.ink || INK, s = "";
    if (o.derpy) {
      s += '<circle cx="80" cy="' + y + '" r="13" fill="#fff" stroke="' + c + '" stroke-width="3"/><circle cx="84" cy="' + (y + 3) + '" r="6" fill="' + c + '"/>';
      s += '<circle cx="122" cy="' + (y - 2) + '" r="8" fill="#fff" stroke="' + c + '" stroke-width="3"/><circle cx="119" cy="' + (y - 4) + '" r="3.5" fill="' + c + '"/>';
      return s;
    }
    if (o.happy) {
      [82, 118].forEach(function (x) { s += '<path d="M' + (x - 7) + ' ' + (y + 2) + ' q7 -10 14 0" stroke="' + c + '" stroke-width="4" fill="none" stroke-linecap="round"/>'; });
      return s;
    }
    if (o.big) {
      [82, 118].forEach(function (x) { s += '<circle cx="' + x + '" cy="' + y + '" r="10" fill="#fff" stroke="' + c + '" stroke-width="3"/><circle cx="' + x + '" cy="' + (y + 1) + '" r="5.5" fill="' + c + '"/><circle cx="' + (x + 2) + '" cy="' + (y - 2) + '" r="1.8" fill="#fff"/>'; });
      return s;
    }
    [84, 116].forEach(function (x) { s += '<ellipse cx="' + x + '" cy="' + y + '" rx="6" ry="7.5" fill="' + c + '"/><circle cx="' + (x + 2) + '" cy="' + (y - 3) + '" r="2" fill="#fff"/>'; });
    return s;
  }
  function cheeks(y, col) { return '<ellipse cx="66" cy="' + y + '" rx="10" ry="6" fill="' + (col || "#ff8fb1") + '" opacity=".55"/><ellipse cx="134" cy="' + y + '" rx="10" ry="6" fill="' + (col || "#ff8fb1") + '" opacity=".55"/>'; }
  function smile(y, o) {
    o = o || {}; var c = o.ink || INK;
    if (o.grin) return '<path d="M78 ' + y + ' q22 26 44 0 Z" fill="#fff" stroke="' + c + '" stroke-width="3" stroke-linejoin="round"/><path d="M84 ' + (y + 1) + ' l4 7 l4 -7" fill="#fff" stroke="' + c + '" stroke-width="2"/>';
    if (o.open) return '<path d="M92 ' + y + ' q8 11 16 0Z" fill="#ff6b8f" stroke="' + c + '" stroke-width="2.5" stroke-linejoin="round"/>';
    return '<path d="M91 ' + y + ' q9 9 18 0" stroke="' + c + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  }
  function svgWrap(inner, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="' + label + ' illustration">' + inner + "</svg>";
  }
  var uid = 0;

  /* ---------------- KPop Demon Hunters squish art ---------------- */
  function artKpdh(id) {
    var s = shadow();
    if (id === "derpy") {
      s += '<circle cx="58" cy="52" r="17" fill="#3f6fd6"/><circle cx="58" cy="52" r="8" fill="#ffb3cf"/><circle cx="142" cy="52" r="17" fill="#3f6fd6"/><circle cx="142" cy="52" r="8" fill="#ffb3cf"/>';
      s += '<rect x="28" y="44" width="144" height="142" rx="68" fill="#3f6fd6"/>';
      s += '<ellipse cx="100" cy="146" rx="44" ry="32" fill="#d8e6ff"/>';
      s += '<path d="M92 46 l8 18 l8 -18Z M30 100 l20 6 l-20 8Z M170 100 l-20 6 l20 8Z M40 140 l18 2 l-14 10Z M160 140 l-18 2 l14 10Z" fill="#1d3480"/>';
      s += '<ellipse cx="100" cy="112" rx="13" ry="9" fill="#1d3480"/>';
      s += eyes(92, { derpy: true }) + smile(124, { grin: true }) + cheeks(118);
      return svgWrap(s, "Derpy the tiger");
    }
    if (id === "sussie") {
      s += '<ellipse cx="38" cy="128" rx="18" ry="34" fill="#2f5bd3" transform="rotate(18 38 128)"/><ellipse cx="162" cy="128" rx="18" ry="34" fill="#2f5bd3" transform="rotate(-18 162 128)"/>';
      s += '<rect x="34" y="50" width="132" height="136" rx="64" fill="#26222e"/>';
      s += '<ellipse cx="100" cy="148" rx="40" ry="32" fill="#fff"/>';
      s += '<path d="M93 116 l7 10 l7 -10Z" fill="#f2b33d" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
      s += '<ellipse cx="100" cy="44" rx="66" ry="10" fill="#141218"/><rect x="74" y="12" width="52" height="34" rx="14" fill="#141218"/>';
      s += '<path d="M40 48 q-6 40 14 64" stroke="#e8c66a" stroke-width="3" fill="none" stroke-dasharray="3 5" stroke-linecap="round"/>';
      s += eyes(96, { big: true, ink: "#141218" }) + cheeks(116, "#ff7fae");
      return svgWrap(s, "Sussie the magpie");
    }
    if (id === "rumi") {
      s += '<g>' + [0, 1, 2, 3, 4].map(function (i) { return '<ellipse cx="' + (168 - i * 2) + '" cy="' + (84 + i * 20) + '" rx="12" ry="13" fill="#5b3596"/>'; }).join("") + '<circle cx="164" cy="186" r="6" fill="#ffd34d"/></g>';
      s += '<rect x="34" y="40" width="132" height="146" rx="64" fill="#ffe2cc"/>';
      s += '<path d="M34 104 Q34 36 100 36 Q166 36 166 104 Q150 70 120 66 Q96 84 64 80 Q44 86 34 104Z" fill="#5b3596"/>';
      s += '<path d="M136 52 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1Z" fill="#ffd34d"/>';
      s += '<rect x="56" y="146" width="88" height="40" rx="18" fill="#8b5cf6"/><path d="M80 150 l20 14 l20 -14" stroke="#ffd34d" stroke-width="4" fill="none" stroke-linecap="round"/>';
      s += eyes(108) + cheeks(124) + smile(128, { open: true });
      return svgWrap(s, "Rumi squish");
    }
    if (id === "jinu") {
      s += '<rect x="34" y="40" width="132" height="146" rx="64" fill="#ffe2cc"/>';
      s += '<path d="M34 108 Q30 34 102 34 Q170 36 166 104 Q154 80 132 76 Q118 96 70 88 Q48 92 34 108Z" fill="#1f1b2b"/>';
      s += '<path d="M118 78 q-6 22 -26 30" stroke="#1f1b2b" stroke-width="9" fill="none" stroke-linecap="round"/>';
      s += '<circle cx="164" cy="126" r="4" fill="#ffd34d"/>';
      s += '<rect x="56" y="146" width="88" height="40" rx="18" fill="#2b2540"/><path d="M100 148 v36" stroke="#ff4f7b" stroke-width="5"/>';
      s += eyes(110, { happy: true }) + cheeks(124) + smile(130);
      return svgWrap(s, "Jinu squish");
    }
    return "";
  }

  /* ---------------- NeeDoh-style squishy art ---------------- */
  function gloss(x, y, rx, ry) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity=".55" transform="rotate(-25 ' + x + ' ' + y + ')"/>'; }
  function artNeedoh(id) {
    var s = shadow();
    if (id === "glob") {
      s += '<path d="M100 44 C150 44 172 86 170 126 C168 168 136 186 100 186 C62 186 30 168 30 124 C30 84 52 44 100 44Z" fill="#ff6fb5"/>' + gloss(70, 76, 18, 10);
      s += eyes(110) + cheeks(126, "#ff3d8b") + smile(130, { open: true });
      return svgWrap(s, "Groovy glob squishy");
    }
    if (id === "cube") {
      s += '<rect x="38" y="56" width="124" height="128" rx="30" fill="#5cc8ff"/><rect x="38" y="56" width="124" height="128" rx="30" fill="none" stroke="#2ea7e8" stroke-width="4"/>';
      s += '<path d="M52 70 h40" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".6"/>';
      s += eyes(112) + cheeks(128) + smile(132);
      return svgWrap(s, "Nice cube squishy");
    }
    if (id === "gumdrop") {
      var d = "";
      [[70, 90], [120, 76], [140, 120], [60, 140], [96, 150], [148, 160], [84, 70]].forEach(function (p) { d += '<rect x="' + p[0] + '" y="' + p[1] + '" width="7" height="4" rx="2" fill="#fff" opacity=".8" transform="rotate(30 ' + p[0] + ' ' + p[1] + ')"/>'; });
      s += '<path d="M34 184 Q30 60 100 46 Q170 60 166 184 Z" fill="#ffa53d"/>' + d;
      s += eyes(118) + cheeks(134, "#ff6f4f") + smile(138);
      return svgWrap(s, "Gumdrop squishy");
    }
    if (id === "snowball") {
      var b = "";
      [[64, 80], [92, 66], [128, 74], [150, 106], [52, 116], [148, 146], [60, 156], [102, 172], [136, 170], [80, 92]].forEach(function (p, i) { b += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (3 + (i % 3)) + '" fill="' + ["#bfe3ff", "#d7c8ff", "#ffd1e8"][i % 3] + '"/>'; });
      s += '<circle cx="100" cy="118" r="68" fill="#f7fbff" stroke="#cfe6ff" stroke-width="4"/>' + b;
      s += '<path d="M156 52 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3Z" fill="#ffd34d"/>';
      s += eyes(114) + cheeks(130) + smile(134);
      return svgWrap(s, "Snowball crunch squishy");
    }
    if (id === "cat") {
      s += '<path d="M46 80 L52 30 L88 60Z M154 80 L148 30 L112 60Z" fill="#b48cff"/><path d="M56 66 L58 44 L76 60Z M144 66 L142 44 L124 60Z" fill="#ffb3d9"/>';
      s += '<ellipse cx="100" cy="120" rx="70" ry="66" fill="#b48cff"/>' + gloss(64, 86, 14, 8);
      s += '<path d="M40 124 h26 M42 136 l24 -6 M160 124 h-26 M158 136 l-24 -6" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
      s += '<path d="M96 122 l4 4 l4 -4Z" fill="#ff6b8f"/>';
      s += eyes(110) + cheeks(130) + smile(130);
      return svgWrap(s, "Cool cat squishy");
    }
    if (id === "teenie") {
      var one = function (cx, cy, r, col) {
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + col + '"/>' + gloss(cx - r * .35, cy - r * .4, r * .25, r * .14) +
          '<circle cx="' + (cx - r * .3) + '" cy="' + cy + '" r="' + r * .1 + '" fill="' + INK + '"/><circle cx="' + (cx + r * .3) + '" cy="' + cy + '" r="' + r * .1 + '" fill="' + INK + '"/>' +
          '<path d="M' + (cx - r * .15) + ' ' + (cy + r * .25) + ' q' + r * .15 + ' ' + r * .18 + ' ' + r * .3 + ' 0" stroke="' + INK + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      };
      s += one(60, 150, 34, "#ff8fc4") + one(140, 150, 34, "#7fe0c4") + one(100, 92, 38, "#ffe066");
      return svgWrap(s, "Teenie squishies");
    }
    return "";
  }

  /* ---------------- mystery dumpling art ---------------- */
  function artDumpling(id) {
    var s = shadow(), g = "dg" + (++uid), fill = "#fff3e4", extra = "", defs = "";
    var shape = "M26 150 Q24 62 100 52 Q176 62 174 150 Q100 176 26 150Z";
    if (id === "glitter") {
      fill = "#ffc9e3";
      [[60, 100, "#ffd34d"], [84, 80, "#7fd8ff"], [120, 86, "#a37bff"], [146, 110, "#ffd34d"], [56, 134, "#a37bff"], [150, 140, "#7fd8ff"], [110, 70, "#fff"], [70, 70, "#fff"]].forEach(function (p) {
        extra += '<path d="M' + p[0] + ' ' + (p[1] - 6) + ' l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2Z" fill="' + p[2] + '"/>';
      });
    } else if (id === "rainbow") {
      defs = '<linearGradient id="' + g + '" x1="0" x2="1"><stop offset="0" stop-color="#ffb3c7"/><stop offset=".25" stop-color="#ffe08a"/><stop offset=".5" stop-color="#b8f0b0"/><stop offset=".75" stop-color="#a8dcff"/><stop offset="1" stop-color="#d8b8ff"/></linearGradient>';
      fill = "url(#" + g + ")";
    } else if (id === "glow") {
      fill = "#d4ffb8";
      s += '<ellipse cx="100" cy="112" rx="94" ry="70" fill="#d4ffb8" opacity=".35"/><ellipse cx="100" cy="112" rx="84" ry="60" fill="#c3ff9e" opacity=".35"/>';
    } else if (id === "colour") {
      defs = '<linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ed2"/><stop offset=".5" stop-color="#c49bff"/><stop offset="1" stop-color="#7fc8ff"/></linearGradient>';
      fill = "url(#" + g + ")";
    } else if (id === "swirl") {
      fill = "#fff6ea";
      extra += '<path d="M60 120 q10 -30 40 -20 q26 10 14 30 q-10 14 -24 4 q-10 -8 0 -16" stroke="#ff8fb8" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>';
      extra += '<path d="M120 76 q20 0 30 20" stroke="#a37bff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>';
    }
    s += (defs ? "<defs>" + defs + "</defs>" : "") + '<g transform="translate(0 20)"><path d="' + shape + '" fill="' + fill + '" stroke="#e8c9a8" stroke-width="3"/>' + extra;
    s += '<path d="M62 66 q6 12 2 22 M84 58 q4 12 0 22 M108 56 q2 12 -2 22 M132 60 q-2 12 -6 22 M152 70 q-4 10 -10 18" stroke="#d9b48c" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
    s += eyes(124) + cheeks(138) + smile(140, { open: true }) + "</g>";
    return svgWrap(s, "squishy dumpling");
  }

  /* ---------------- the three quizzes ---------------- */
  var MINIS = {
    kpdh: {
      slug: "kpop-demon-hunters-squishmallows", art: artKpdh,
      quizName: "Which KPop Demon Hunters Squishmallow are you?",
      cardHead: "My KPop Demon Hunters Squishmallow is…",
      theme: { bg: ["#1b0b3a", "#5a1a7a"], panel: "#fff", accent: "#ff4fd8", accent2: "#44e6ff", gold: "#ffd34d", head: "#ff4fd8", ink: "#2a1446", soft: "#7a5a9c", dark: true },
      results: [
        { id: "derpy", name: "Derpy", tag: "Goofy, loyal & always hungry", loves: "snacks and silly faces",
          desc: "The big blue tiger with the wonky eyes. You're the friend who makes everyone laugh, sticks around when it counts, and never says no to a snack.",
          q: "Squishmallows KPop Demon Hunters Derpy", plush: "Official 12-inch and 8-inch Squishmallows" },
        { id: "sussie", name: "Sussie", tag: "Quiet, clever & always on time", loves: "delivering messages",
          desc: "The little magpie in the tall hat. You notice everything, you show up exactly when you're needed, and your friends trust you with their secrets.",
          q: "Squishmallows KPop Demon Hunters Sussie", plush: "Official 8-inch Squishmallow" },
        { id: "rumi", name: "Rumi", tag: "Brave leader with a golden voice", loves: "big stages and her team",
          desc: "The lead singer with the long purple braid. You go first when things get scary, you protect your friends, and you're learning that being yourself is your superpower.",
          q: "Squishmallows KPop Demon Hunters Rumi", plush: "Official 8-inch Squishmallow" },
        { id: "jinu", name: "Jinu", tag: "Smooth talker with a soft heart", loves: "music and second chances",
          desc: "The charming one with the secret soft side. You're cool on the outside, kind on the inside, and people always want to hear your story.",
          q: "Squishmallows KPop Demon Hunters Jinu", plush: "Official 8-inch Squishmallow" }
      ],
      questions: [
        { q: "Your friends are putting on a show. What's your job?", a: [
          { t: "🎤 Lead singer, obviously", p: ["rumi"] }, { t: "😎 The cool one everyone watches", p: ["jinu"] },
          { t: "🤪 Comic relief between songs", p: ["derpy"] }, { t: "✉️ Running notes backstage", p: ["sussie"] } ] },
        { q: "Pick a pre-show snack:", a: [
          { t: "🍙 Kimbap and a pep talk", p: ["rumi"] }, { t: "🍜 Midnight ramyeon", p: ["jinu"] },
          { t: "🍪 Whatever's closest (all of it)", p: ["derpy"] }, { t: "🍒 Something small and shiny", p: ["sussie"] } ] },
        { q: "Your friends would describe you as…", a: [
          { t: "Brave & determined", p: ["rumi"] }, { t: "Charming & mysterious", p: ["jinu"] },
          { t: "Goofy & loyal", p: ["derpy"] }, { t: "Quiet but always there", p: ["sussie"] } ] },
        { q: "Pick a colour combo:", a: [
          { t: "💜 Purple & gold", p: ["rumi"] }, { t: "🖤 Midnight black & red", p: ["jinu"] },
          { t: "💙 Big bright blue", p: ["derpy"] }, { t: "🤍 Black, white & a little blue", p: ["sussie"] } ] }
      ]
    },
    needoh: {
      slug: "which-needoh-are-you", art: artNeedoh,
      quizName: "Which NeeDoh are you?",
      cardHead: "My squishy match is…",
      theme: { bg: ["#fff07a", "#8ff0d6"], panel: "#fff", accent: "#ff5fa2", accent2: "#5cc8ff", gold: "#ffa53d", head: "#ff5fa2", ink: "#3a2e4a", soft: "#7a6a8c" },
      results: [
        { id: "glob", name: "The Groovy Glob", tag: "The classic. Slow, gooey, calm.", loves: "long slow squeezes",
          desc: "The original squishy ball. You're easygoing, you go with the flow, and people feel calmer just being around you.",
          q: "NeeDoh Groovy Glob" },
        { id: "cube", name: "Nice Cube", tag: "Firm on the outside, soft inside", loves: "a satisfying squish",
          desc: "Cool, square and surprisingly squishy. You look tough, but your friends know you're a big softie.",
          q: "NeeDoh Nice Cube" },
        { id: "gumdrop", name: "Gumdrop", tag: "Sweet, bouncy & bright", loves: "candy colours",
          desc: "Stretchy and sugar-sweet. You bring the energy, you bounce back fast, and you're everyone's favourite treat.",
          q: "NeeDoh Gumdrop" },
        { id: "snowball", name: "Snowball Crunch", tag: "Crunchy, sparkly, a little extra", loves: "crunchy sounds",
          desc: "Soft with a satisfying crunch. You like things a bit different, a bit noisy and a lot of fun.",
          q: "NeeDoh Snowball Crunch" },
        { id: "cat", name: "Cool Cats", tag: "Cute, curious & a bit sassy", loves: "naps and attention",
          desc: "A squishy with ears and attitude. You're adorable, independent, and you get your way most of the time.",
          q: "NeeDoh Cool Cats" },
        { id: "teenie", name: "Teenie NeeDohs", tag: "Small, mighty & better in a group", loves: "collecting them all",
          desc: "Tiny squishies that come in packs. You're happiest with your crew and you can fit fun into any pocket.",
          q: "Teenie NeeDoh" }
      ],
      questions: [
        { q: "How do you like to squeeze?", a: [
          { t: "🫠 Slow and gooey", p: ["glob"] }, { t: "🧊 Firm, then squish", p: ["cube"] },
          { t: "🍬 Stretchy and bouncy", p: ["gumdrop"] }, { t: "❄️ With a crunch", p: ["snowball"] } ] },
        { q: "Where does your squishy live?", a: [
          { t: "🎒 Clipped to my backpack, with friends", p: ["teenie"] }, { t: "🛏️ On my pillow", p: ["cat", "glob"] },
          { t: "📚 On my desk for homework", p: ["cube"] }, { t: "🧸 In a big collection on display", p: ["gumdrop", "snowball"] } ] },
        { q: "Pick a vibe:", a: [
          { t: "😌 Calm and cozy", p: ["glob"] }, { t: "😼 Cute but sassy", p: ["cat"] },
          { t: "🤩 Bright and bouncy", p: ["gumdrop", "teenie"] }, { t: "✨ Sparkly and extra", p: ["snowball", "cube"] } ] },
        { q: "Your friends call you…", a: [
          { t: "The chill one", p: ["glob", "cube"] }, { t: "The funny one", p: ["gumdrop", "cat"] },
          { t: "The collector", p: ["teenie"] }, { t: "The one with the cool stuff", p: ["snowball"] } ] }
      ],
      safety: true
    },
    dumpling: {
      slug: "which-squishy-dumpling-are-you", art: artDumpling,
      quizName: "Which Mystery Squishy Dumpling are you?",
      cardHead: "My squishy dumpling is…",
      theme: { bg: ["#fff1d6", "#ffc9a3"], panel: "#fff", accent: "#e0893a", accent2: "#ff8fb8", gold: "#c9853f", head: "#c0682a", ink: "#5a3a20", soft: "#8a6a4c" },
      results: [
        { id: "glitter", name: "Glitter Dumpling", tag: "Sparkly, bold & full of surprises", loves: "anything shiny",
          desc: "You light up every room. Life's more fun with a bit of sparkle, and you're always the first to try something new.",
          q: "mystery squishy dumpling glitter" },
        { id: "rainbow", name: "Rainbow Dumpling", tag: "Cheerful, kind & colourful", loves: "making friends smile",
          desc: "You see the bright side of everything. You're friendly to everyone and your good mood is contagious.",
          q: "rainbow squishy dumpling" },
        { id: "glow", name: "Glow-in-the-Dark Dumpling", tag: "Night owl with a secret glow", loves: "sleepovers and starry skies",
          desc: "Quiet in the day, amazing at night. You're the one telling stories with a flashlight at the sleepover.",
          q: "glow in the dark squishy dumpling" },
        { id: "colour", name: "Colour-Change Dumpling", tag: "Full of surprises, always changing", loves: "trying new things",
          desc: "You never stay the same for long, and that's what makes you fun. New hobby every week? That's you.",
          q: "color changing squishy dumpling" },
        { id: "swirl", name: "Sugar Swirl Dumpling", tag: "Sweet, cozy & a little dreamy", loves: "treats and daydreams",
          desc: "Soft, sweet and calm. You're the cozy friend everyone wants to hang out with on a rainy day.",
          q: "swirl squishy dumpling" }
      ],
      questions: [
        { q: "Open the steamer basket! You hope it's…", a: [
          { t: "✨ Something sparkly", p: ["glitter"] }, { t: "🌈 Something colourful", p: ["rainbow"] },
          { t: "🌙 Something that glows", p: ["glow"] }, { t: "🔮 A total surprise", p: ["colour"] }, { t: "🍡 Something sweet", p: ["swirl"] } ] },
        { q: "Pick a weekend plan:", a: [
          { t: "🎉 A party", p: ["glitter"] }, { t: "🛝 The park with friends", p: ["rainbow"] },
          { t: "🏕️ A sleepover", p: ["glow"] }, { t: "🎨 Trying a new craft", p: ["colour"] }, { t: "🧁 Baking and movies", p: ["swirl"] } ] },
        { q: "Your favourite time of day:", a: [
          { t: "☀️ Morning, full of energy", p: ["rainbow"] }, { t: "🌆 Afternoon adventures", p: ["colour", "glitter"] },
          { t: "🌙 Night time", p: ["glow"] }, { t: "🛋️ Cozy evenings", p: ["swirl"] } ] },
        { q: "Your friends say you're…", a: [
          { t: "Bold", p: ["glitter"] }, { t: "Kind", p: ["rainbow", "swirl"] },
          { t: "Mysterious", p: ["glow"] }, { t: "Unpredictable", p: ["colour"] } ] }
      ],
      safety: true
    }
  };
  window.MINIS = MINIS;

  var key = document.body.getAttribute("data-mini"), M = MINIS[key], box = document.getElementById("mq");
  if (!M || !box) return;
  var byId = {}; M.results.forEach(function (r) { byId[r.id] = r; });
  var stores = (window.CONFIG && CONFIG.stores) || [{ name: "Amazon.ca", flag: "🇨🇦", domain: "www.amazon.ca", tag: "" }];
  var PAGE = "https://squishfinder.ca/" + M.slug;

  function track(ev) {
    var url = window.CONFIG && CONFIG.voteEndpoint; if (!url) return;
    try { fetch(url, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ev: ev }) }).catch(function () {}); } catch (e) {}
  }
  function buyUrl(r, st) { return "https://" + st.domain + "/s?k=" + encodeURIComponent(r.q) + (st.tag ? "&tag=" + encodeURIComponent(st.tag) : ""); }
  function buyBtns(r, small) {
    return stores.map(function (st, i) {
      return '<a class="btn buy' + (i ? " alt" : "") + '" data-buy="' + (st.domain.indexOf(".ca") > -1 ? "ca" : "com") + '" data-id="' + r.id + '" href="' + buyUrl(r, st) +
        '" target="_blank" rel="sponsored noopener">' + st.flag + " " + (small ? st.name : "Find " + r.name + " on " + st.name) + "</a>";
    }).join("");
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var step = 0, answers = [];
  function setUrl(q) { try { history.replaceState(null, "", location.pathname + (q || "")); } catch (e) {} }

  function start() {
    box.innerHTML = '<div class="mq-box mq-start"><div class="mq-strip">' + M.results.map(function (r) { return M.art(r.id); }).join("") + "</div>" +
      "<h2>" + esc(M.quizName) + '</h2><p class="sub">' + M.questions.length + " quick questions. Free, no sign-up.</p>" +
      '<button class="btn" data-go>Start the quiz ✨</button></div>';
  }
  function question() {
    var Q = M.questions[step];
    box.innerHTML = '<div class="mq-box"><div class="mq-prog"><i style="width:' + (step / M.questions.length * 100) + '%"></i></div>' +
      '<p class="mq-count">Question ' + (step + 1) + " of " + M.questions.length + '</p><h2 class="mq-q">' + esc(Q.q) + '</h2><div class="mq-ans">' +
      Q.a.map(function (a, i) { return '<button data-a="' + i + '">' + esc(a.t) + "</button>"; }).join("") + "</div></div>";
    requestAnimationFrame(function () { var i = box.querySelector(".mq-prog i"); if (i) i.style.width = ((step + 1) / M.questions.length * 100) + "%"; });
  }
  function winner() {
    var sc = {}, tie = {};
    M.results.forEach(function (r) { sc[r.id] = 0; tie[r.id] = Math.random(); });
    answers.forEach(function (ai, qi) { M.questions[qi].a[ai].p.forEach(function (id) { sc[id]++; }); });
    return M.results.slice().sort(function (a, b) { return sc[b.id] - sc[a.id] || tie[b.id] - tie[a.id]; })[0];
  }
  function result(r, shared) {
    setUrl("?r=" + r.id);
    box.innerHTML = '<div class="mq-box mq-res">' +
      (shared ? '<p class="mq-banner">💌 A friend got <b>' + esc(r.name) + "</b>! Which one are <b>you</b>?</p>" : '<p class="mq-count">You got…</p>') +
      M.art(r.id).replace("<svg ", '<svg class="big" ') +
      "<h2>" + esc(r.name) + '</h2><p class="mq-tag">' + esc(r.tag) + '</p><p class="mq-desc">' + esc(r.desc) + "</p>" +
      (r.plush ? '<p class="mq-plush">🧸 ' + esc(r.plush) + "</p>" : "") +
      '<div class="mq-row">' + buyBtns(r) + "</div>" +
      '<div class="mq-row">' + (shared ? '<button class="btn" data-go>Take the quiz ✨</button>' :
        '<button class="btn" data-card="' + r.id + '">🖼️ Get my card</button><button class="btn alt" data-share="' + r.id + '">📤 Share</button><button class="btn alt" data-go>↺ Retake</button>') +
      "</div></div>";
    if (!shared) box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- themed result card ---------------- */
  function roundRect(c, x, y, w, h, rr) { c.beginPath(); c.moveTo(x + rr, y); c.arcTo(x + w, y, x + w, y + h, rr); c.arcTo(x + w, y + h, x, y + h, rr); c.arcTo(x, y + h, x, y, rr); c.arcTo(x, y, x + w, y, rr); c.closePath(); }
  function fit(c, text, maxW, size, weight) { do { c.font = weight + " " + size + 'px "Baloo 2", system-ui, sans-serif'; size -= 3; } while (c.measureText(text).width > maxW && size > 26); }
  function decorate(c, W, H, T) {
    if (key === "kpdh") {
      for (var i = 0; i < 70; i++) { var x = (i * 397) % W, y = (i * 613) % H, r = 1 + (i % 3); c.fillStyle = i % 5 ? "rgba(255,255,255,.7)" : T.gold; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      c.lineWidth = 10; c.strokeStyle = "rgba(255,79,216,.35)"; c.beginPath(); c.arc(W / 2, -200, 560, 0, 7); c.stroke();
      c.strokeStyle = "rgba(68,230,255,.3)"; c.beginPath(); c.arc(W / 2, H + 220, 600, 0, 7); c.stroke();
    } else if (key === "needoh") {
      [[110, 140, 90, "#ff8fc4"], [980, 200, 70, "#5cc8ff"], [80, 1150, 80, "#ffa53d"], [1000, 1120, 100, "#b48cff"], [540, 60, 40, "#ffffff"], [960, 650, 40, "#ff8fc4"], [60, 640, 34, "#5cc8ff"]].forEach(function (d) {
        c.fillStyle = d[3]; c.globalAlpha = .55; c.beginPath(); c.arc(d[0], d[1], d[2], 0, 7); c.fill(); c.globalAlpha = 1;
      });
    } else {
      c.strokeStyle = "rgba(201,133,63,.35)"; c.lineWidth = 14;
      [1306, 1330].forEach(function (y) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); });
      c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 10; c.lineCap = "round";
      [[200, 40], [540, 30], [880, 40]].forEach(function (p) { c.beginPath(); c.moveTo(p[0], p[1] + 55); c.bezierCurveTo(p[0] - 28, p[1] + 35, p[0] + 28, p[1] + 20, p[0], p[1]); c.stroke(); });
    }
  }
  function makeCard(r) {
    var W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var c = cv.getContext("2d"), T = M.theme, img = new Image();
    var svg = M.art(r.id).replace("<svg ", '<svg width="600" height="600" ');
    var fontReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 80px "Baloo 2"'), document.fonts.load('700 40px "Baloo 2"')]).catch(function () {}) : Promise.resolve();
    var imgReady = new Promise(function (ok, bad) { img.onload = ok; img.onerror = bad; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    return Promise.all([fontReady, imgReady]).then(function () {
      var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      decorate(c, W, H, T);
      c.fillStyle = T.dark ? "rgba(255,79,216,.45)" : "rgba(0,0,0,.08)"; roundRect(c, 70, 128, W - 140, 980, 64); c.fill();
      c.fillStyle = T.panel; roundRect(c, 70, 110, W - 140, 980, 64); c.fill();
      c.textAlign = "center"; c.textBaseline = "alphabetic";
      c.fillStyle = T.head; fit(c, M.cardHead, W - 220, 54, 700); c.fillText(M.cardHead, W / 2, 205);
      c.drawImage(img, (W - 600) / 2, 220, 600, 600);
      c.fillStyle = T.ink; fit(c, r.name, W - 220, 100, 800); c.fillText(r.name, W / 2, 900);
      var tag = r.tag; c.font = '800 42px "Baloo 2", system-ui, sans-serif'; fit(c, tag, W - 300, 42, 800);
      var bw = Math.min(W - 200, c.measureText(tag).width + 70); c.fillStyle = T.accent; roundRect(c, (W - bw) / 2, 935, bw, 74, 37); c.fill();
      c.fillStyle = "#fff"; c.fillText(tag, W / 2, 987);
      c.fillStyle = T.soft; fit(c, "Loves " + r.loves, W - 260, 38, 700); c.fillText("Loves " + r.loves, W / 2, 1058);
      c.fillStyle = T.dark ? "#fff" : T.ink; c.font = '800 58px "Baloo 2", system-ui, sans-serif'; c.fillText("Which one are YOU? ✨", W / 2, 1192);
      c.fillStyle = T.dark ? T.gold : T.head; fit(c, "squishfinder.ca/" + M.slug, W - 120, 46, 800); c.fillText("squishfinder.ca/" + M.slug, W / 2, 1262);
      return new Promise(function (ok) { cv.toBlob(ok, "image/png"); });
    });
  }
  function showCard(r) {
    var old = document.querySelector(".card-modal"); if (old) old.remove();
    var m = document.createElement("div");
    m.className = "card-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Your card");
    m.innerHTML = '<div class="card-box"><button class="card-x" aria-label="Close">✕</button><p class="sub">Making your card…</p></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest(".card-x")) m.remove(); });
    makeCard(r).then(function (blob) {
      var url = URL.createObjectURL(blob), name = "my-" + key + "-" + r.id + ".png", file = null;
      try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      var canShare = file && navigator.canShare && navigator.canShare({ files: [file] });
      m.querySelector(".card-box").innerHTML = '<button class="card-x" aria-label="Close">✕</button><img src="' + url + '" alt="' + esc(r.name) + ' card">' +
        '<div class="row">' + (canShare ? '<button class="btn" data-cshare>📤 Share picture</button>' : "") +
        '<a class="btn' + (canShare ? " alt" : "") + '" href="' + url + '" download="' + name + '">⬇️ Save picture</a></div>' +
        '<div class="row mq-cardbuy">' + buyBtns(r, true) + "</div>" +
        '<p class="note">Post it to your Story or send it to a friend! On a phone you can also press and hold the picture to save it.</p>';
      var sb = m.querySelector("[data-cshare]");
      if (sb) sb.addEventListener("click", function () {
        track("share");
        navigator.share({ files: [file], title: M.quizName, text: "I got " + r.name + "! " + M.quizName + " " + PAGE }).catch(function () {});
      });
    }, function () {
      m.querySelector(".card-box").innerHTML = '<button class="card-x" aria-label="Close">✕</button><p class="sub">Sorry, we couldn\'t make the picture on this device. Try the Share button instead.</p>';
    });
  }
  function shareLink(r) {
    var url = PAGE + "?r=" + r.id + "&from=share", text = "I got " + r.name + "! " + M.quizName;
    track("share");
    if (navigator.share) { navigator.share({ title: M.quizName, text: text, url: url }).catch(function () {}); return; }
    var done = function () { var t = document.createElement("div"); t.className = "toast"; t.textContent = "Link copied! Paste it anywhere 💗"; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text + " " + url).then(done, function () { prompt("Copy this link:", url); });
    else prompt("Copy this link:", url);
  }

  /* ---------------- "meet them all" grid ---------------- */
  var all = document.getElementById("mq-all");
  if (all) all.innerHTML = M.results.map(function (r) {
    return '<div class="mq-item">' + M.art(r.id) + "<b>" + esc(r.name) + '</b><span class="note">' + esc(r.tag) + "</span>" +
      (r.plush ? '<span class="note">' + esc(r.plush) + "</span>" : "") + '<div class="mq-buys">' + buyBtns(r, true) + "</div></div>";
  }).join("");

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("button,[data-buy]");
    if (!t) return;
    if (t.hasAttribute("data-go")) { step = 0; answers = []; setUrl(""); question(); box.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.hasAttribute("data-a")) {
      answers[step] = +t.getAttribute("data-a"); step++;
      if (step < M.questions.length) question(); else result(winner());
      return;
    }
    if (t.dataset.card) return showCard(byId[t.dataset.card]);
    if (t.dataset.share) return shareLink(byId[t.dataset.share]);
  });

  var pre = (location.search.match(/[?&]r=([a-z]+)/) || [])[1];
  if (pre && byId[pre]) result(byId[pre], /[?&]from=share/.test(location.search)); else start();
})();
