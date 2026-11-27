/* ============ CONFIG: edit these to earn commissions ============ */
window.CONFIG = {
  // Amazon Associates tracking IDs. Each Amazon store has its own program and its own tag.
  // Amazon.ca: https://associates.amazon.ca   Amazon.com: https://affiliate-program.amazon.com
  stores: [
    { name: "Amazon.ca", flag: "🇨🇦", domain: "www.amazon.ca", tag: "squishfinder-20" },
    { name: "Amazon.com", flag: "🇺🇸", domain: "www.amazon.com", tag: "squishfinde0e-20" }
  ],
  // Shared poll: Google Apps Script web app URL (see apps-script.gs). Empty = votes stay on this device.
  voteEndpoint: "https://script.google.com/macros/s/AKfycbwqpz3QB9vG-Jt8uThlZAInjkT9w-5cvu0fkqL-2dpk3LDBiHDekKw38NZxGRQF0RTi/exec"
};

/* ============ SQUISH DATABASE ============
   All 24 confirmed with plush listings on Amazon.ca (Nov 2026). Bios are fan-written. */
window.SQUISHES = [
  { id: "cam", name: "Cam the Cat", type: "cat", body: "#fbf3e8", belly: "#fffdf8", accent: "#ffb3c6",
    spots: [[52,84,20,15,"#b5793f"],[146,72,15,11,"#3a2e2e"],[150,152,18,13,"#3a2e2e"],[58,150,14,10,"#b5793f"]],
    squad: "Cozy Squad", fav: "Warm blankets & cookies",
    bio: "Cam is a calico cuddle expert with brown and black patches. Give Cam a sunny windowsill and a soft blanket and you have a friend for life. Quiet, loyal, and always up for a nap." },
  { id: "wendy", name: "Wendy the Frog", type: "frog", body: "#8fd36b", belly: "#e6f7c9", accent: "#ff9fb5",
    squad: "Pond Pals", fav: "Leaping into puddles",
    bio: "Wendy is a giggly, bouncy frog who never met a puddle she didn't jump into. She loves spring rain, crunchy salads, and making her friends laugh." },
  { id: "malcolm", name: "Malcolm the Mushroom", type: "mushroom", body: "#fff3df", belly: null, accent: "#e8473f",
    squad: "Forest Friends", fav: "Quiet walks in the woods",
    bio: "Malcolm is a gentle little mushroom who is a bit shy at first. Once you get to know him, he'll tell you every secret of the forest floor." },
  { id: "archie", name: "Archie the Axolotl", type: "axolotl", body: "#ffc2d9", belly: "#ffe6ef", accent: "#ff7fae",
    squad: "Water Buddies", fav: "Bubbles & strawberries",
    bio: "Archie is a goofy, wiggly axolotl who's always smiling. He loves blowing bubbles, trying new snacks, and swimming in circles just for fun." },
  { id: "connor", name: "Connor the Cow", type: "cow", body: "#ffffff", belly: null, accent: "#2b2b33",
    squad: "Farm Squad", fav: "Milkshakes in the meadow",
    bio: "Connor is the most chill cow on the farm. He spends sunny days lounging in the grass and is famous for making the best milkshakes around." },
  { id: "fifi", name: "Fifi the Fox", type: "fox", body: "#f2645f", belly: "#fff4e8", accent: "#ffffff",
    squad: "Forest Friends", fav: "Exploring new trails",
    bio: "Fifi is a brave little red fox with a big heart. If there's a new trail, a hidden cave, or a mystery to solve, Fifi is first in line." },
  { id: "hans", name: "Hans the Hedgehog", type: "hedgehog", body: "#9a6440", belly: "#f3c99a", accent: "#6e4128",
    squad: "Cozy Squad", fav: "Autumn leaves & cocoa",
    bio: "Hans looks prickly but he's a total softie. He collects colorful fall leaves and shares his cocoa with anyone who looks like they need a hug." },
  { id: "winston", name: "Winston the Owl", type: "owl", body: "#4fb3b0", belly: "#d7f2ef", accent: "#ffb547",
    squad: "Night Owls", fav: "Stargazing & stories",
    bio: "Winston is a wise, dreamy teal owl who stays up late to count the stars. He knows a bedtime story for every night of the year." },
  { id: "maui", name: "Maui the Pineapple", type: "pineapple", body: "#ffd85a", belly: null, accent: "#4caf50",
    squad: "Snack Squad", fav: "Beach days & smoothies",
    bio: "Maui is a sunshiny pineapple who brings the party wherever she goes. Sandy toes, fruity smoothies, and dance-offs are her favorite things." },
  { id: "lola", name: "Lola the Unicorn", type: "unicorn", body: "#c58fe0", belly: null, accent: "#a46be0", dyeUnder: true,
    spots: [[56,92,36,28,"#e57fc8",.55],[146,80,34,26,"#9b7be8",.55],[50,150,30,22,"#9b7be8",.5],[152,146,32,24,"#e57fc8",.5],[100,60,30,16,"#f0b6ff",.6],[100,166,36,12,"#e57fc8",.45],[104,104,22,16,"#f0b6ff",.4]],
    squad: "Magic Squad", fav: "Rainbows & cupcakes",
    bio: "Lola is a sparkly tie-dye unicorn who believes in magic. She paints rainbows, bakes cupcakes, and sprinkles a little glitter on every day." },
  { id: "gordon", name: "Gordon the Shark", type: "shark", body: "#a3aab3", belly: "#f2f6fa", accent: "#ff9fb5",
    squad: "Water Buddies", fav: "Surfing big waves",
    bio: "Gordon is a bold, friendly shark who only looks tough. He loves surfing, pizza parties, and protecting his friends from scary seaweed." },
  { id: "benny", name: "Benny the Bigfoot", type: "bigfoot", body: "#8a5a38", belly: "#6e4529", accent: "#a87850", face: "#efe2d2",
    squad: "Legends Squad", fav: "Hiking & taking photos",
    bio: "Benny is a fuzzy, friendly bigfoot who loves hiking deep in the woods. He's always snapping photos of his adventures, but somehow he's never in any of them." },
  { id: "avery", name: "Avery the Mallard", type: "duck", body: "#b39a80", belly: "#efe4d4", accent: "#2f8f5b",
    squad: "Pond Pals", fav: "Paddling & bread crumbs",
    bio: "Avery is a cheerful mallard duck with a shiny green head. She waddles to the pond every morning and quacks hello to everyone she meets." },
  { id: "stacy", name: "Stacy the Squid", type: "squid", body: "#a9b6ef", belly: "#f3f5ff", accent: "#8f9de2",
    squad: "Sea Squad", fav: "Deep-sea dance parties",
    bio: "Stacy is a sweet periwinkle-blue squid who can wave all her arms at once. She's a little shy, but at an underwater dance party she's the star." },
  { id: "danny", name: "Danny the Dinosaur", type: "dino", body: "#98dc62", belly: "#f1fadf", accent: "#5fb043",
    squad: "Dino Squad", fav: "Stomping & big snacks",
    bio: "Danny is a big-hearted dinosaur who loves to stomp around and play. His roar sounds scary, but it's really just his way of saying \"let's be friends!\"" },
  { id: "sunny", name: "Sunny the Bee", type: "bee", body: "#ffd84d", belly: "#fffaf0", accent: "#2b2235",
    squad: "Garden Squad", fav: "Flowers & honey",
    bio: "Sunny is a busy little bumblebee with a rainbow heart. She buzzes from flower to flower and shares honey with all her garden friends." },
  { id: "leonard", name: "Leonard the Lion", type: "lion", body: "#e3b27a", belly: "#fff3e0", accent: "#e0812e",
    mane: ["#ff8fc8", "#ffd85a", "#7fd8c0", "#8fc8ff", "#c9a4ff", "#ffb37a", "#a8e07a", "#ff9fb0"],
    squad: "Safari Squad", fav: "Sunbathing on rocks",
    bio: "Leonard is a gentle lion with a big fluffy rainbow mane. He looks like a king, but his favorite thing is a long nap in the warm sun." },
  { id: "claudia", name: "Claudia the Beet", type: "beet", body: "#8e2150", belly: null, accent: "#c25a86", ink: "#2b1630",
    squad: "Veggie Squad", fav: "Gardens & sunshine",
    bio: "Claudia is a deep purple beet with leafy green sprouts. She loves sunny garden days, is calm and kind, and is always rooting for her friends." },
  { id: "olma", name: "Olma the Strawberry Cat", type: "cat", body: "#f2545b", belly: "#ffc4cf", accent: "#ff9fb0", leaf: "#4caf50",
    spots: [[62,96,3,5,"#fff1b3"],[138,96,3,5,"#fff1b3"],[46,128,3,5,"#fff1b3"],[154,128,3,5,"#fff1b3"],[80,70,3,5,"#fff1b3"],[120,70,3,5,"#fff1b3"]],
    squad: "Snack Squad", fav: "Berry picking & naps",
    bio: "Olma is a sweet strawberry cat with a leafy green top. She loves berry picking, all things pink, and curling up for long afternoon naps." },
  { id: "noelani", name: "Noelani the Teal Axolotl", type: "axolotl", body: "#3fcfd0", belly: "#3a6fd8", accent: "#4b4fc2", wings: "#e9e2ff",
    squad: "Magic Squad", fav: "Lagoon splashes & stargazing",
    bio: "Noelani is a dreamy teal axolotl with tiny wings. She splashes around the lagoon by day and flutters up to visit the stars at night." },
  { id: "marcella", name: "Marcella the Watermelon Octopus", type: "squid", body: "#6cc56f", belly: "#ff6f83", accent: "#55b05c", fin: false, stripes: "#3f9a4e", flower: "#ff8fb5",
    spots: [[78,146,2.5,4,"#2b2235"],[100,140,2.5,4,"#2b2235"],[122,146,2.5,4,"#2b2235"],[88,162,2.5,4,"#2b2235"],[112,162,2.5,4,"#2b2235"]],
    squad: "Sea Squad", fav: "Summer picnics",
    bio: "Marcella is a juicy watermelon octopus who lives for summer picnics. With eight arms, she can hand out snacks to everyone at once!" },
  { id: "simon", name: "Simon the Sloth", type: "sloth", body: "#a8794f", belly: "#f6ecdc", accent: "#9fb4c6",
    squad: "Safari Squad", fav: "Hammock naps",
    bio: "Simon is an easygoing brown sloth who never rushes anything. His favorite things are hammock naps, slow snacks, and very long hugs." },
  { id: "reginald", name: "Reginald the Corgi", type: "dog", body: "#fffaf3", belly: "#ffffff", accent: "#d9893f", ear: "#d9893f", collar: false, tongue: true,
    spots: [[58,84,36,30,"#d9893f"],[142,84,36,30,"#d9893f"]],
    squad: "Pup Pack", fav: "Walks & belly rubs",
    bio: "Reginald is a proud white-and-tan corgi with his tongue always out. He trots everywhere with his tail wagging and never misses a walk, a treat, or a belly rub." },
  { id: "glady", name: "Glady the Rainbow Ice Cream", type: "icecream", body: "#ffc4e1", belly: null, accent: "#7a4a2a", cone: "#c98a4e", dyeUnder: true,
    spots: [[48,104,18,13,"#9fd9ff"],[152,100,18,13,"#fff0a0"],[72,128,15,8,"#b8f0c8"],[134,128,16,8,"#d9c4ff"],[100,90,13,8,"#fff0a0"]],
    squad: "Snack Squad", fav: "Sprinkles & parties",
    bio: "Glady is a rainbow ice cream scoop and the life of every party. She sprinkles joy wherever she goes and never melts under pressure." }
];

/* ============ 6 QUESTIONS ============ */
window.QUESTIONS = [
  { q: "Pick a color vibe!", g: "What colors do they love?", mascot: "lola", a: [
    { t: "Pink & purple", e: "💗", p: ["archie", "lola", "claudia", "glady"] },
    { t: "Green & leafy", e: "🌿", p: ["wendy", "danny", "avery", "marcella"] },
    { t: "Blues & teals", e: "💙", p: ["winston", "gordon", "noelani", "stacy"] },
    { t: "Warm orange & red", e: "🧡", p: ["fifi", "malcolm", "olma", "reginald"] },
    { t: "Sunny yellow", e: "💛", p: ["sunny", "maui", "leonard"] },
    { t: "Browns, black & white", e: "🤎", p: ["connor", "cam", "hans", "benny", "simon"] } ] },
  { q: "Where would you rather hang out?", g: "Where would they rather hang out?", mascot: "wendy", a: [
    { t: "Cozy couch", e: "🛋️", p: ["cam", "hans", "simon"] },
    { t: "Enchanted forest", e: "🌲", p: ["malcolm", "fifi", "lola", "benny"] },
    { t: "Pond or ocean", e: "🌊", p: ["wendy", "archie", "gordon", "stacy", "avery", "marcella"] },
    { t: "Farm or garden", e: "🌻", p: ["connor", "sunny", "claudia", "olma", "reginald"] },
    { t: "Jungle or beach", e: "🏝️", p: ["maui", "leonard", "danny", "simon", "glady"] },
    { t: "Under the stars", e: "🌙", p: ["winston", "benny", "noelani"] } ] },
  { q: "Choose a snack!", g: "What's their go-to snack?", mascot: "maui", a: [
    { t: "Fresh fruit", e: "🍓", p: ["maui", "archie", "avery", "olma", "marcella"] },
    { t: "Cookies & milk", e: "🍪", p: ["cam", "connor", "hans", "reginald"] },
    { t: "Crunchy veggies", e: "🥕", p: ["wendy", "malcolm", "claudia"] },
    { t: "Pizza", e: "🍕", p: ["gordon", "fifi", "leonard", "danny"] },
    { t: "Cupcakes & honey", e: "🍯", p: ["lola", "sunny", "stacy", "glady", "noelani"] },
    { t: "Movie popcorn", e: "🍿", p: ["winston", "benny", "simon"] } ] },
  { q: "Which one sounds most like you?", g: "Which one sounds most like them?", mascot: "fifi", a: [
    { t: "Shy & sweet", e: "🥺", p: ["hans", "malcolm", "cam", "stacy", "olma"] },
    { t: "Silly & goofy", e: "🤪", p: ["wendy", "maui", "archie", "avery", "glady"] },
    { t: "Brave & bold", e: "💪", p: ["gordon", "leonard", "fifi", "danny", "reginald"] },
    { t: "Calm & chill", e: "😌", p: ["connor", "cam", "claudia", "simon"] },
    { t: "Dreamy & creative", e: "🎨", p: ["lola", "winston", "sunny", "noelani"] },
    { t: "Curious explorer", e: "🔎", p: ["fifi", "benny", "wendy", "marcella"] } ] },
  { q: "Favorite season?", g: "What's their favorite season?", mascot: "hans", a: [
    { t: "Spring", e: "🌷", p: ["wendy", "lola", "archie", "sunny", "claudia", "olma"] },
    { t: "Summer", e: "☀️", p: ["maui", "gordon", "connor", "stacy", "leonard", "marcella", "glady", "simon"] },
    { t: "Fall", e: "🍂", p: ["fifi", "hans", "malcolm", "benny", "reginald"] },
    { t: "Winter", e: "❄️", p: ["cam", "winston", "avery", "danny", "noelani"] } ] },
  { q: "What kind of squish do you want to hug?", g: "What kind of squish would they love?", mascot: "cam", a: [
    { t: "A furry animal friend", e: "🐾", p: ["cam", "connor", "fifi", "hans", "leonard", "simon", "reginald", "olma"] },
    { t: "Something magical", e: "✨", p: ["lola", "winston", "noelani"] },
    { t: "Something yummy or leafy", e: "🍄", p: ["maui", "malcolm", "claudia", "glady"] },
    { t: "A water buddy", e: "💧", p: ["wendy", "archie", "gordon", "stacy", "avery", "marcella"] },
    { t: "A buzzy little bug", e: "🐝", p: ["sunny"] },
    { t: "A dino or a legend", e: "🦖", p: ["danny", "benny"] } ] }
];

/* ============ CHRISTMAS LOOK (Nov 27 - Dec 25) ============
   window.squishXmas(s) -> { back, front } SVG bits in the 200x200 art space, or null when the season is off.
   app.js adds them inside squishSVG; pages with pre-built art (squish pages, gift guide) get them on load below.
   Each squish gets the accessory that fits its shape (ears, horns, fins, cones). ?xmas=1 / ?xmas=0 forces it. */
(function () {
  var on = (function () {
    var m = /[?&]xmas=([01])/.exec(location.search);
    if (m) return m[1] === "1";
    var d = new Date(), mo = d.getMonth(), day = d.getDate();
    return (mo === 10 && day >= 27) || (mo === 11 && day <= 25);
  })();
  window.XMAS = on;
  var RED = "#e53b3b", WHITE = "#fffdf9", TRIM = "#e6dbe3", GREEN = "#2f9e5a", GREEN_D = "#24804a", BROWN = "#a8703f";
  function g(x, y, sc, rot, inner) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + (sc || 1) + ')">' + inner + "</g>";
  }
  // Santa hat: brim centred on (x, y), floppy tip to the right with a pompom
  function hat(x, y, sc, rot) {
    return g(x, y, sc, rot,
      '<path d="M-38 -2 C-36 -36 -14 -60 14 -62 C38 -63 54 -48 60 -26 C52 -31 44 -37 34 -39 C38 -27 38 -13 37 -2Z" fill="' + RED + '"/>' +
      '<path d="M-22 -26 C-14 -42 0 -50 14 -53" stroke="#ff8a80" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>' +
      '<rect x="-45" y="-11" width="90" height="19" rx="9.5" fill="' + WHITE + '" stroke="' + TRIM + '" stroke-width="2"/>' +
      '<circle cx="60" cy="-25" r="10.5" fill="' + WHITE + '" stroke="' + TRIM + '" stroke-width="2"/>');
  }
  // knitted scarf around the lower body with a hanging tail and fringe
  function scarf(c, c2) {
    var fringe = "";
    for (var i = 0; i < 4; i++) fringe += "M" + (138 + i * 5.5) + " " + (189 - i * 0.4) + " l0 5 ";
    return '<path d="M21 140 Q100 170 179 140 L173 160 Q100 190 27 160Z" fill="' + c + '"/>' +
      '<path d="M24 150 Q100 180 176 150" stroke="' + c2 + '" stroke-width="4.5" fill="none" stroke-dasharray="9 6" stroke-linecap="round"/>' +
      '<path d="M130 166 L152 160 L159 188 L135 191Z" fill="' + c + '"/>' +
      '<path d="M133 179 L156 174" stroke="' + c2 + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="' + fringe + '" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"/>';
  }
  // holly sprig: two leaves and three berries centred on (x, y)
  function holly(x, y, sc, rot) {
    var leaf = "M0 0 C5 -7 10 -5 14 -11 C16 -5 22 -5 26 -9 C26 -3 30 1 35 1 C29 6 27 10 21 12 C18 8 12 8 8 11 C8 5 4 2 0 0Z";
    return g(x, y, sc, rot,
      '<path d="' + leaf + '" fill="' + GREEN + '" transform="rotate(-14)"/><path d="' + leaf + '" fill="' + GREEN_D + '" transform="scale(-1 1) rotate(-14)"/>' +
      '<path d="M3 -1 L30 -6 M-3 -1 L-30 -6" stroke="#1b6a3b" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="-6" cy="4" r="6" fill="' + RED + '"/><circle cx="6" cy="4" r="6" fill="' + RED + '"/><circle cx="0" cy="-4" r="6.5" fill="#d92f35"/>' +
      '<circle cx="-2" cy="-6.5" r="1.8" fill="#fff" opacity=".8"/>');
  }
  function antlers() {
    var one = "M73 52 C67 38 62 26 58 10 M62 30 C54 28 46 22 42 12 M59 19 C64 15 68 10 70 4";
    return '<g stroke="' + BROWN + '" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="' + one + '"/><path d="' + one + '" transform="translate(200 0) scale(-1 1)"/></g>';
  }
  // kind + where it sits in the 200x200 art (x, y, scale, rotation in degrees); automation/coverstudio.html
  // reads the same list through window.squishXmasLook(id) to build 3D versions for reel covers
  var HAT = { kind: "hat", x: 100, y: 56, sc: 0.78, rot: -8 }, ANT = { kind: "antlers", x: 100, y: 44, sc: 0.75, rot: 0 };
  var LOOK = {
    cam: HAT, connor: HAT, hans: HAT, avery: HAT, sunny: HAT, simon: HAT, reginald: HAT,
    benny: { kind: "hat", x: 100, y: 54, sc: 0.8, rot: -8 }, leonard: { kind: "hat", x: 100, y: 52, sc: 0.8, rot: -8 },
    wendy: { kind: "hat", x: 136, y: 34, sc: 0.55, rot: 14 },
    archie: ANT, noelani: ANT,
    fifi: { kind: "scarf", c: GREEN, c2: WHITE }, winston: { kind: "scarf", c: RED, c2: WHITE }, maui: { kind: "scarf", c: RED, c2: WHITE },
    lola: { kind: "scarf", c: GREEN, c2: RED }, gordon: { kind: "scarf", c: RED, c2: WHITE }, danny: { kind: "scarf", c: RED, c2: WHITE },
    claudia: { kind: "scarf", c: GREEN, c2: WHITE }, olma: { kind: "scarf", c: GREEN, c2: WHITE },
    malcolm: { kind: "holly", x: 142, y: 30, sc: 1, rot: 22 }, stacy: { kind: "holly", x: 148, y: 58, sc: 0.9, rot: 24 },
    marcella: { kind: "holly", x: 138, y: 56, sc: 0.9, rot: 18 }, glady: { kind: "holly", x: 100, y: 44, sc: 1, rot: 0 }
  };
  window.squishXmasLook = function (id) { return on ? LOOK[id] || null : null; };
  window.squishXmasHolly = holly;
  window.squishXmas = function (s) {
    var L = on && s && LOOK[s.id];
    if (!L) return null;
    if (L.kind === "hat") return { back: "", front: hat(L.x, L.y, L.sc, L.rot) };
    if (L.kind === "scarf") return { back: "", front: scarf(L.c, L.c2) };
    if (L.kind === "antlers") return { back: antlers(), front: holly(L.x, L.y, L.sc, L.rot) };
    return { back: "", front: holly(L.x, L.y, L.sc, L.rot) };
  };
  // pre-built pages: decorate their art once the page has loaded
  if (!on) return;
  function decorate() {
    var byName = {};
    (window.SQUISHES || []).forEach(function (s) { byName[s.name + " illustration"] = s; });
    [].forEach.call(document.querySelectorAll("svg.squish:not(.xmas)"), function (svg) {
      var x = window.squishXmas(byName[svg.getAttribute("aria-label")]);
      if (!x) return;
      svg.classList.add("xmas");
      if (x.back) svg.firstElementChild.insertAdjacentHTML("afterend", x.back);
      svg.insertAdjacentHTML("beforeend", x.front);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate); else decorate();
})();
