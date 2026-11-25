/* Dream Catcher 3D: a Squishmallow claw machine for squishfinder.ca/games
   three.js draws it, cannon-es does the physics. The claw is real physics: a kinematic hub with three hinged prongs,
   each driven by its own motor whose force limit is the "give" threshold. Squishes are puffy pillows wearing the
   site's own squish art, each type with its own size, shape, weight and slipperiness. */
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const SQ = window.SQUISHES, byId = {};
SQ.forEach((s) => { byId[s.id] = s; });
const Sound = window.ClawSound;
function load(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);
const slug = (s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ================= layout (world units; the bin is 2.6 wide and 1.8 deep) ================= */
const BX0 = -1.3, BX1 = 1.3, BZ0 = -0.9, BZ1 = 0.9, CEIL = 2.75;
const CHX = -0.12, CHZ = -0.16, CH_H = 1.45;                // prize chute: front-left corner, x < CHX and z > CHZ
const HOME = { x: (BX0 + CHX) / 2, z: (CHZ + BZ1) / 2 };
const LIM = { x0: -0.92, x1: 0.92, z0: -0.55, z1: 0.55 }; // the whole bin is reachable, HOME (over the chute) included
const TOP_Y = 2.36, MIN_Y = 0.5, RAIL_Y = 2.62;
const STEP = 1 / 120, GRAV = 18;
const MOVE_V = 0.9, MOVE_A = 5, DROP_V = 1.25, LIFT_V = 0.8, CARRY_V = 0.9;
const TURN_TIME = 25, START_TOKENS = 10, BIN_COUNT = 20, REFILL_BELOW = 15;
const G_SQ = 1, G_CLAW = 2, G_ST = 4;

/* claw geometry (arm local frame: +x points out from the hub, -y down) */
const PIVOT_R = 0.13, PIVOT_Y = -0.05, UP_LEN = 0.42, UP_TILT = 0.22, HOOK_LEN = 0.17, HOOK_ANG = -0.55, TIP_R = 0.036;
const IDLE = 0.08, OPEN_MAX = 1.12, CLOSE_MIN = -0.62;
const T = {
  grip: 6.0,       // base motor force limit of each prong while gripping (the give threshold)
  spread: 0.22,    // each prong gets a random strength of grip * (1 +- spread) per turn
  relax: 0.92,     // the claw loosens a little once it reaches the top, like real machines
  open: 0.98,      // how wide the prongs spread on the way down (wider than the biggest squish)
  openForce: 7,    // how hard the open prongs resist when they land on squishes
  closeSpeed: 1.3, // how fast the prongs close (rad/s); too fast and squishes squirt out
  closed: -0.3,    // fully closed prong angle
  capK: 2.6,       // grip capacity = sum of touching prongs' strength x squish friction x centring x capK
  twoArm: 0.5,   // only two prongs touching holds this much of a three-prong grip
  hug: 0.0008,       // prong motor force while holding, as a share of its strength: weight that pries a prong open
                   // past this makes it give, so each prong's own strength decides whether the cradle holds
  // note: cannon applies motor limits per step, so motor numbers act ~120x stronger than they read (the joint uses cap*STEP)
  // tuned with automation/claw3d-test.js (2026-11-25, smaller squishes, fresh pile every 5 drops): centred ~55-65% caught,
  // half-off ~40%, edge ~10%
  slipDist: 0.09   // a gripped squish that sags this far out of the claw slips free
};
const GRIP_FRIC = [0.78, 0.88, 1.0]; // slippery, plush, grippy

/* ================= squish grab profiles =================
   [size, width/height, thickness/width, weight, grip (0 slippery, 1 normal, 2 grippy)] */
const TYPE = {
  cat: [1, 1.15, 0.56, 1, 1], fox: [1, 1.15, 0.55, 1, 1], frog: [1, 1.2, 0.56, 1, 1], axolotl: [1, 1.2, 0.54, 1, 0],
  cow: [1.12, 1.2, 0.58, 1.25, 1], hedgehog: [0.94, 1.1, 0.62, 1, 2], owl: [0.88, 1.0, 0.66, 0.9, 1], pineapple: [0.95, 0.88, 0.6, 1.05, 1],
  unicorn: [1.04, 1.15, 0.55, 1.05, 0], shark: [1.14, 1.45, 0.5, 1.15, 0], mushroom: [1.05, 1.35, 0.45, 0.95, 1], bigfoot: [1.18, 1.05, 0.62, 1.25, 2],
  duck: [1, 1.35, 0.46, 1, 0], squid: [0.95, 0.82, 0.58, 0.95, 1], dino: [1.05, 1.15, 0.56, 1.1, 2], bee: [0.86, 1.1, 0.6, 0.8, 1],
  lion: [1.14, 1.05, 0.62, 1.2, 2], beet: [0.9, 0.95, 0.72, 1.05, 0], sloth: [1.14, 1.35, 0.46, 1.15, 1], dog: [1.04, 1.15, 0.56, 1.05, 1],
  icecream: [0.95, 0.82, 0.6, 1, 0]
};
const DEF = [1, 1.15, 0.56, 1, 1];
function profile(s) {
  const t = TYPE[s.type] || DEF, k = t[0] * rnd(0.95, 1.05);
  const w = 0.72 * k, h = w / t[1], d = w * t[2];
  return { w, h, d, mass: t[3] * k * 0.85, grip: t[4] };
}
// difficulty stars per squish (1 easy .. 3 tricky), from automated grab tests (each squish alone, near-centred drops,
// automation/claw3d-test.js single(id, 0.8): 8 sloppy-aim drops each, 2026-11-25 after shrinking): 7-8 caught = 1 star,
// 5-6 = 2, 4 or fewer = 3. Re-measure if T or TYPE changes.
let STARS = { simon: 3, gordon: 3, benny: 3, leonard: 3, olma: 3,
  cam: 2, wendy: 2, malcolm: 2, connor: 2, hans: 2, maui: 2, lola: 2, avery: 2, claudia: 2, reginald: 2,
  archie: 1, fifi: 1, winston: 1, stacy: 1, danny: 1, sunny: 1, noelani: 1, marcella: 1, glady: 1 };
function starsFor(s) {
  if (STARS[s.id]) return STARS[s.id];
  const t = TYPE[s.type] || DEF;
  const score = (t[0] - 1) * 6 + (t[3] - 1) * 2.5 + (t[4] === 0 ? 1 : t[4] === 2 ? -0.8 : 0) + (t[2] < 0.5 ? 0.6 : 0);
  return score > 1 ? 3 : score > 0.2 ? 2 : 1;
}

/* ================= storage ================= */
const store = load("sf_claw3d", null) || { shelf: {}, gold: {}, best: 0, plays: 0 };
store.shelf = store.shelf || {}; store.gold = store.gold || {};

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);
const el = {
  canvas: $("game"), stage: $("stage"), machine: $("machine"), pip: $("pip"), loading: $("loading"), toast: $("toast"),
  title: $("title"), over: $("over"), overText: $("overText"), overGot: $("overGot"), play: $("playBtn"), again: $("againBtn"),
  tokens: $("tokens"), caught: $("caught"), timer: $("timer"),
  left: $("leftBtn"), right: $("rightBtn"), up: $("upBtn"), down: $("downBtn"), drop: $("dropBtn"),
  music: $("musicBtn"), sfx: $("sfxBtn"), pipBtn: $("pipBtn"), gfx: $("gfxBtn"), shelfGrid: $("shelfGrid"), shelfSub: $("shelfSub")
};

/* ================= graphics level =================
   HD: velvet-sheen plush, clearcoat paint, soft shadows, full resolution.
   Lite (default on phones and low-memory devices): matte plush with the same fibre texture but simpler lighting maths,
   plain paint, smaller textures and shadow map, capped resolution. Looks close, costs far less GPU per pixel. */
const LITE = (() => {
  const saved = load("sf_claw3d_lite", null);
  if (saved !== null) return !!saved;
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(screen.width, screen.height) < 820;
  return (coarse && small) || (navigator.deviceMemory && navigator.deviceMemory <= 4) || false;
})();
document.documentElement.classList.toggle("lite", LITE);
const DROP_KEYS = ["sheen", "sheenColor", "sheenRoughness", "clearcoat", "clearcoatRoughness"];
function physMat(p) {
  if (!LITE) return new THREE.MeshPhysicalMaterial(p);
  const q = Object.assign({}, p); DROP_KEYS.forEach((k) => delete q[k]);
  return new THREE.MeshStandardMaterial(q);
}
function plushMat(p) { // squishes and felt: Lambert is matte by nature and much cheaper than PBR on phones
  if (!LITE) return new THREE.MeshPhysicalMaterial(p);
  const q = Object.assign({}, p); DROP_KEYS.concat(["roughness", "metalness", "envMapIntensity"]).forEach((k) => delete q[k]);
  return new THREE.MeshLambertMaterial(q);
}

/* ================= three.js scene ================= */
const renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true });
renderer.setPixelRatio(Math.min(LITE ? 1.5 : 2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = LITE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#1f1745");
// soft studio reflections for the chrome, glass and lacquer, and gentle wrap-around light for the plush
{
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pm.dispose();
}
const cam = new THREE.PerspectiveCamera(40, 0.82, 0.1, 40);
const sideCam = new THREE.PerspectiveCamera(36, 1.25, 0.1, 40);
sideCam.position.set(3.4, 1.25, 0.05); sideCam.lookAt(0, 0.95, 0.05);

// Lite's Lambert plush gets no light from the environment map, so its sky light makes up for it
scene.add(new THREE.HemisphereLight(0xfff4ff, 0x5a3f99, LITE ? 1.25 : 0.55));
const sun = new THREE.DirectionalLight(0xfff6ee, 1.5);
sun.position.set(1.1, 5.5, 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(LITE ? 512 : 1024, LITE ? 512 : 1024);
Object.assign(sun.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 1, far: 10 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
scene.add(sun);
const glow = new THREE.PointLight(0xff9cc8, 2.2, 6, 1.6); glow.position.set(0, 2.4, 0.6); scene.add(glow);
const fill = new THREE.DirectionalLight(0xc8d4ff, 0.45); fill.position.set(-2.5, 1.5, 3); scene.add(fill);

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/* tileable fabric normal map: thousands of short fibres plus fine grain, turned into surface normals.
   On the squishes it breaks up the smooth "plastic ball" shading into minky fuzz; on the floor it reads as felt. */
function fabricNormal(N, fibres, fibreLen, strength) {
  const h = new Float32Array(N * N), at = (x, y) => ((y + N) % N) * N + ((x + N) % N);
  for (let i = 0; i < h.length; i++) h[i] = Math.random() * 0.35;
  for (let f = 0; f < fibres; f++) {
    let x = Math.random() * N, y = Math.random() * N;
    const a = Math.random() * Math.PI * 2, L = fibreLen * (0.5 + Math.random()), dx = Math.cos(a), dy = Math.sin(a);
    for (let s = 0; s < L; s++) { h[at(Math.round(x), Math.round(y))] += 0.55; x += dx; y += dy; }
  }
  const b = new Float32Array(N * N); // one soft blur so fibres look fuzzy, not scratched
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) b[at(x, y)] = (h[at(x, y)] * 4 + h[at(x - 1, y)] + h[at(x + 1, y)] + h[at(x, y - 1)] + h[at(x, y + 1)]) / 8;
  const c = document.createElement("canvas"); c.width = c.height = N;
  const ctx = c.getContext("2d"), img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const nx = (b[at(x - 1, y)] - b[at(x + 1, y)]) * strength, ny = (b[at(x, y - 1)] - b[at(x, y + 1)]) * strength;
    const l = Math.hypot(nx, ny, 1), o = (y * N + x) * 4;
    img.data[o] = (nx / l * 0.5 + 0.5) * 255; img.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const plushNormal = fabricNormal(256, 9000, 5, 1.6); plushNormal.repeat.set(4, 4);
const feltNormal = fabricNormal(256, 6000, 7, 1.2); feltNormal.repeat.set(5, 4);
const skyTex = canvasTex(512, 512, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1f1745"); g.addColorStop(0.6, "#3b2a78"); g.addColorStop(1, "#6a4aa8");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 110; i++) { c.globalAlpha = rnd(0.3, 0.9); c.fillStyle = "#fff"; c.beginPath(); c.arc(rnd(0, w), rnd(0, h * 0.75), rnd(0.6, 2.2), 0, 7); c.fill(); }
  c.globalAlpha = 0.09; c.fillStyle = "#fff";
  [[120, 250, 60], [380, 190, 75], [260, 330, 50]].forEach((k) => { c.beginPath(); c.arc(k[0], k[1], k[2] * 0.6, 0, 7); c.arc(k[0] + k[2] * 0.6, k[1] + 6, k[2] * 0.5, 0, 7); c.arc(k[0] - k[2] * 0.6, k[1] + 8, k[2] * 0.45, 0, 7); c.fill(); });
  c.globalAlpha = 1; c.fillStyle = "#fff4c4"; c.beginPath(); c.arc(420, 80, 34, 0, 7); c.fill();
  c.fillStyle = "#24194f"; c.beginPath(); c.arc(436, 70, 30, 0, 7); c.fill();
});

const mats = {
  floor: plushMat({ color: "#b9a2ea", roughness: 1, normalMap: feltNormal, normalScale: new THREE.Vector2(0.8, 0.8), sheen: 0.6, sheenColor: new THREE.Color("#efe4ff"), sheenRoughness: 0.8, envMapIntensity: 0.5 }),
  hole: new THREE.MeshBasicMaterial({ color: "#140d29" }),
  sky: new THREE.MeshBasicMaterial({ map: skyTex }),
  skySide: new THREE.MeshBasicMaterial({ map: skyTex, color: "#9d90c8" }),
  plexi: physMat({ color: "#e6f2ff", transparent: true, opacity: 0.12, depthWrite: false, roughness: 0.04, metalness: 0, envMapIntensity: 1.3 }),
  trim: physMat({ color: "#ff86bb", roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12 }),
  frame: physMat({ color: "#d96aae", roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.15 }),
  metal: new THREE.MeshStandardMaterial({ color: "#eceaf8", metalness: 1, roughness: 0.2 }),
  metalDark: new THREE.MeshStandardMaterial({ color: "#a59dd0", metalness: 1, roughness: 0.32 }),
  tip: new THREE.MeshStandardMaterial({ color: "#ff6fa6", roughness: 0.55 }),
  laser: new THREE.MeshBasicMaterial({ color: "#ff9cc2", transparent: true, opacity: 0.7, depthWrite: false }),
  ring: new THREE.MeshBasicMaterial({ color: "#7dffb0", transparent: true, opacity: 0.95, depthWrite: false, depthTest: false, side: THREE.DoubleSide })
};
function box(w, h, d, mat, x, y, z, shadow) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  if (shadow) { m.receiveShadow = true; m.castShadow = shadow === 2; }
  scene.add(m); return m;
}
// floor (two slabs leave the chute open) and the dark chute hole
const floorMeshes = [
  box(BX1 - BX0, 0.2, CHZ - BZ0, mats.floor, 0, -0.1, (BZ0 + CHZ) / 2, 1),
  box(BX1 - CHX, 0.2, BZ1 - CHZ, mats.floor, (CHX + BX1) / 2, -0.1, (CHZ + BZ1) / 2, 1)
];
box(CHX - BX0, 0.02, BZ1 - CHZ, mats.hole, HOME.x, -0.35, HOME.z);
box(CHX - BX0, 0.35, 0.01, mats.hole, HOME.x, -0.17, CHZ);
box(0.01, 0.35, BZ1 - CHZ, mats.hole, CHX, -0.17, HOME.z);
// back and side walls with the night sky, plexi chute walls with pink trim
const back = new THREE.Mesh(new THREE.PlaneGeometry(BX1 - BX0, CEIL + 0.1), mats.sky); back.position.set(0, CEIL / 2 - 0.05, BZ0); scene.add(back);
[BX0, BX1].forEach((x, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(BZ1 - BZ0, CEIL + 0.1), mats.skySide); p.position.set(x, CEIL / 2 - 0.05, 0); p.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; scene.add(p); });
box(0.03, CH_H, BZ1 - CHZ, mats.plexi, CHX, CH_H / 2, HOME.z);
box(CHX - BX0, CH_H, 0.03, mats.plexi, HOME.x, CH_H / 2, CHZ);
box(0.05, 0.05, BZ1 - CHZ, mats.trim, CHX, CH_H, HOME.z);
box(CHX - BX0, 0.05, 0.05, mats.trim, HOME.x, CH_H, CHZ);
// front base panel with the prize door, corner posts, rails
box(BX1 - BX0 + 0.16, 0.6, 0.08, mats.frame, 0, -0.3, BZ1 + 0.04);
const doorTex = canvasTex(256, 96, (c, w, h) => { c.fillStyle = "#1a1233"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffb3d1"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#ffb3d1"; c.font = "800 44px 'Baloo 2', sans-serif"; c.textAlign = "center"; c.fillText("PRIZE", w / 2, 64); });
const door = new THREE.Mesh(new THREE.PlaneGeometry(CHX - BX0 - 0.1, 0.3), new THREE.MeshBasicMaterial({ map: doorTex })); door.position.set(HOME.x, -0.28, BZ1 + 0.081); scene.add(door);
[[BX0, BZ0], [BX1, BZ0], [BX0, BZ1], [BX1, BZ1]].forEach((p) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, CEIL + 0.6, 10), mats.frame); m.position.set(p[0], CEIL / 2 - 0.3, p[1]); scene.add(m); });
box(BX1 - BX0, 0.05, 0.06, mats.metal, 0, RAIL_Y, BZ0 + 0.06);
box(BX1 - BX0, 0.05, 0.06, mats.metal, 0, RAIL_Y, BZ1 - 0.06);
const bridge = box(0.08, 0.06, BZ1 - BZ0 - 0.06, mats.metalDark, 0, RAIL_Y - 0.04, 0);
const carriage = box(0.2, 0.1, 0.2, mats.trim, 0, RAIL_Y - 0.08, 0);
const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), mats.metal); scene.add(cable);
const prizeSign = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 110, (c, w) => { c.fillStyle = "rgba(255,255,255,.9)"; c.font = "800 60px 'Baloo 2', sans-serif"; c.textAlign = "center"; c.fillText("PRIZE ▼", w / 2, 80); }), transparent: true, depthWrite: false }));
prizeSign.scale.set(0.5, 0.215, 1); prizeSign.position.set(HOME.x, CH_H + 0.2, HOME.z); scene.add(prizeSign);
// front glass: just faint diagonal reflections, so the bin reads as behind glass; LED strip along the top
{
  const glassTex = canvasTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    [[0.12, 0.10, 0.22], [0.30, 0.045, 0.14], [0.70, 0.07, 0.12]].forEach(([x, bw, a]) => {
      const g = c.createLinearGradient((x - bw) * w, 0, (x + bw) * w, 0);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255," + a + ")"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.save(); c.translate(w / 2, h / 2); c.rotate(-0.5); c.translate(-w / 2, -h / 2);
      c.fillStyle = g; c.fillRect(-w, -h, w * 3, h * 3); c.restore();
    });
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(BX1 - BX0, CEIL), new THREE.MeshBasicMaterial({ map: glassTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, toneMapped: false }));
  glass.position.set(0, CEIL / 2, BZ1 + 0.02); glass.renderOrder = 10; scene.add(glass);
  const led = box(BX1 - BX0, 0.03, 0.03, new THREE.MeshBasicMaterial({ color: "#ffd3ea", toneMapped: false }), 0, CEIL - 0.02, BZ1 - 0.02);
  led.renderOrder = 1;
}
// aim laser and ring
const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 8), mats.laser); scene.add(laser);
const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.095, 28), mats.ring); ring.rotation.x = -Math.PI / 2; scene.add(ring);

/* ================= physics world ================= */
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAV, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.solver.iterations = 16;
world.defaultContactMaterial.contactEquationStiffness = 4e6;
world.defaultContactMaterial.contactEquationRelaxation = 4;
const matSq = [new CANNON.Material("slippery"), new CANNON.Material("plush"), new CANNON.Material("grippy")];
const matArm = new CANNON.Material("arm"), matSt = new CANNON.Material("static");
const SQ_ARM_FRIC = [0.45, 0.8, 1.1];
const armCMs = [];
function cm(a, b, friction, restitution) {
  const c = new CANNON.ContactMaterial(a, b, { friction, restitution: restitution || 0.04, contactEquationStiffness: 4e6, contactEquationRelaxation: 4 });
  world.addContactMaterial(c); return c;
}
matSq.forEach((m, i) => {
  armCMs.push(cm(m, matArm, SQ_ARM_FRIC[i]));
  cm(m, matSt, 0.35);
  matSq.forEach((n, j) => { if (j >= i) cm(m, n, 0.45); });
});
cm(matArm, matSt, 0.1);

const statics = new CANNON.Body({ mass: 0, material: matSt, collisionFilterGroup: G_ST, collisionFilterMask: G_SQ | G_CLAW });
function sbox(x0, x1, y0, y1, z0, z1) {
  statics.addShape(new CANNON.Box(new CANNON.Vec3((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2)), new CANNON.Vec3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
}
sbox(BX0, BX1, -0.3, 0, BZ0, CHZ);              // floor behind the chute
sbox(CHX, BX1, -0.3, 0, CHZ, BZ1);              // floor right of the chute
sbox(BX0 - 0.2, BX0, -2, CEIL, BZ0, BZ1);        // left wall
sbox(BX1, BX1 + 0.2, -2, CEIL, BZ0, BZ1);        // right wall
sbox(BX0, BX1, -2, CEIL, BZ0 - 0.2, BZ0);        // back wall
sbox(BX0, BX1, -2, CEIL, BZ1, BZ1 + 0.2);        // front glass
sbox(BX0, BX1, CEIL, CEIL + 0.2, BZ0, BZ1);      // ceiling
sbox(CHX - 0.015, CHX + 0.015, 0, CH_H, CHZ, BZ1); // chute walls
sbox(BX0, CHX, 0, CH_H, CHZ - 0.015, CHZ + 0.015);
sbox(BX0, CHX, -1.6, -1.4, CHZ, BZ1);           // catch tray far below the chute
world.addBody(statics);

/* ================= the claw ================= */
const hub = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, collisionFilterGroup: G_CLAW, collisionFilterMask: G_SQ, allowSleep: false });
hub.addShape(new CANNON.Sphere(0.12), new CANNON.Vec3(0, -0.01, 0));
hub.position.set(HOME.x, TOP_Y, HOME.z);
hub.isHub = true;
world.addBody(hub);
const hubMesh = new THREE.Group();
{
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.16, 20), mats.metal); cyl.position.y = 0.05; cyl.castShadow = true;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), mats.metalDark); ball.position.y = -0.01; ball.castShadow = true;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, 0.06, 20), mats.trim); cap.position.y = 0.16;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 8, 24), mats.tip); band.rotation.x = Math.PI / 2; band.position.y = 0.05;
  hubMesh.add(cyl, ball, cap, band); scene.add(hubMesh);
}
const Y = new CANNON.Vec3(0, 1, 0), Z = new CANNON.Vec3(0, 0, 1), DOWN = new CANNON.Vec3(0, -1, 0);
const qAxis = (axis, ang) => new CANNON.Quaternion().setFromAxisAngle(axis, ang);
const dir1 = [Math.sin(UP_TILT), -Math.cos(UP_TILT)], dir2 = [Math.sin(HOOK_ANG), -Math.cos(HOOK_ANG)];
const P1 = [dir1[0] * UP_LEN, dir1[1] * UP_LEN], TIP = [P1[0] + dir2[0] * HOOK_LEN, P1[1] + dir2[1] * HOOK_LEN];
const arms = [];
let MOTOR_SIGN = 1;
for (let k = 0; k < 3; k++) {
  const a = k * Math.PI * 2 / 3, rx = Math.sin(a), rz = Math.cos(a);
  const phi = Math.atan2(-rz, rx), qY = qAxis(Y, phi);
  const pivotA = new CANNON.Vec3(rx * PIVOT_R, PIVOT_Y, rz * PIVOT_R);
  const body = new CANNON.Body({ mass: 0.12, material: matArm, collisionFilterGroup: G_CLAW, collisionFilterMask: G_SQ | G_ST, angularDamping: 0.6, linearDamping: 0.1, allowSleep: false });
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.024, UP_LEN / 2, 0.042)), new CANNON.Vec3(P1[0] / 2, P1[1] / 2, 0), qAxis(Z, UP_TILT));
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.024, HOOK_LEN / 2, 0.042)), new CANNON.Vec3((P1[0] + TIP[0]) / 2, (P1[1] + TIP[1]) / 2, 0), qAxis(Z, HOOK_ANG));
  body.addShape(new CANNON.Sphere(TIP_R), new CANNON.Vec3(TIP[0], TIP[1], 0));
  body.position.set(hub.position.x + pivotA.x, hub.position.y + pivotA.y, hub.position.z + pivotA.z);
  body.quaternion.copy(qY.mult(qAxis(Z, IDLE)));
  body.armIdx = k;
  world.addBody(body);
  const hinge = new CANNON.HingeConstraint(hub, body, { pivotA, axisA: new CANNON.Vec3(-rz, 0, rx), pivotB: new CANNON.Vec3(0, 0, 0), axisB: new CANNON.Vec3(0, 0, 1), collideConnected: false });
  hinge.enableMotor();
  world.addConstraint(hinge);
  // matching visual
  const g = new THREE.Group();
  const up = new THREE.Mesh(new THREE.BoxGeometry(0.048, UP_LEN, 0.07), mats.metal); up.position.set(P1[0] / 2, P1[1] / 2, 0); up.rotation.z = UP_TILT;
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.048, HOOK_LEN, 0.07), mats.metal); hook.position.set((P1[0] + TIP[0]) / 2, (P1[1] + TIP[1]) / 2, 0); hook.rotation.z = HOOK_ANG;
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), mats.metalDark); knee.position.set(P1[0], P1[1], 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(TIP_R + 0.006, 14, 10), mats.tip); tip.position.set(TIP[0], TIP[1], 0);
  [up, hook, knee, tip].forEach((m) => { m.castShadow = true; g.add(m); });
  scene.add(g);
  arms.push({ k, body, hinge, mesh: g, qY, pivotA, qInv: qY.inverse(), target: IDLE, force: 40, speed: 3, grip: T.grip, th: IDLE });
}
function armAngle(a) {
  const v = a.qInv.mult(a.body.quaternion).vmult(DOWN);
  return Math.atan2(v.x, -v.y);
}
function snapArm(a, ang) {
  // hard mechanical stop: put a prong that got shoved past its range back on its hinge at the limit
  a.body.quaternion.copy(a.qY.mult(qAxis(Z, ang)));
  a.body.position.set(hub.position.x + a.pivotA.x, hub.position.y + a.pivotA.y, hub.position.z + a.pivotA.z);
  a.body.velocity.copy(hub.velocity); a.body.angularVelocity.set(0, 0, 0);
}
function driveArms() {
  for (const a of arms) {
    let th = armAngle(a);
    if (th > OPEN_MAX + 0.08 || th < CLOSE_MIN - 0.08) { th = clamp(th, CLOSE_MIN, OPEN_MAX); snapArm(a, th); }
    a.th = th;
    let w = clamp((a.target - th) * 10, -a.speed, a.speed), F = a.force;
    if (th > OPEN_MAX) { w = -3; F = 400; } else if (th < CLOSE_MIN) { w = 3; F = 400; } // mechanical stops
    a.hinge.setMotorSpeed(MOTOR_SIGN * w);
    a.hinge.setMotorMaxForce(F);
  }
}
function setArms(target, force, speed) { for (const a of arms) { a.target = target; a.force = force; a.speed = speed || 3; } }

/* ================= squishes ================= */
const SHADOW = '<ellipse cx="100" cy="186" rx="64" ry="8" fill="rgba(74,59,92,.13)"/>';
const looks = {}; // id -> {front, back} materials
const MOODS = ["open", "happy", "wink"];
function artCanvas(s, mood, isBack) {
  return new Promise((ok) => {
    let svg = window.squishSVG(s, mood).replace(SHADOW, "");
    const S = LITE ? 256 : 512;
    svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" ');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = S;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0, S, S);
      if (isBack) { // plain back: cover the face, add the little tag
        x.save(); x.scale(S / 200, S / 200);
        x.fillStyle = s.body; x.beginPath(); x.ellipse(100, 118, 60, 32, 0, 0, 7); x.fill();
        x.fillStyle = "#fff"; x.fillRect(140, 150, 13, 18); x.fillStyle = "#ff7fae"; x.fillRect(140, 150, 13, 5);
        x.restore();
      }
      ok(c);
    };
    img.onerror = () => ok(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}
function texFrom(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t;
}
async function makeLooks() {
  await Promise.all(SQ.map(async (s, i) => {
    const [f, b] = await Promise.all([artCanvas(s, MOODS[i % 3], false), artCanvas(s, "open", true)]);
    // plush: fully matte, fibre normals for fuzz, and a soft velvet sheen that lights up the edges like minky fabric
    const plush = (c) => plushMat({
      map: c ? texFrom(c) : null, color: c ? "#fff" : s.body, alphaTest: 0.5,
      roughness: 1, metalness: 0, envMapIntensity: 0.55,
      normalMap: plushNormal, normalScale: new THREE.Vector2(0.55, 0.55),
      sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffffff").lerp(new THREE.Color(s.body), 0.6)
    });
    const core = plush(null); core.color.set(s.body); core.alphaTest = 0;
    looks[s.id] = { front: plush(f), back: plush(b), core };
  }));
}
// one shared puffy-pillow geometry: the squish art's body ellipse becomes a dome, ears and fins stay as thin flaps
const pillow = (() => {
  const seg = LITE ? 28 : 48, g = new THREE.PlaneGeometry(1, 1, seg, seg), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const sx = (p.getX(i) + 0.5) * 200, sy = (0.5 - p.getY(i)) * 200;
    const e = ((sx - 100) / 82) ** 2 + ((sy - 110) / 70) ** 2;
    const z = e < 1 ? 0.5 * Math.pow(1 - e, 0.42) : 0.012;
    p.setXYZ(i, (sx - 100) / 164, -(sy - 110) / 140, z);
  }
  g.computeVertexNormals();
  return g;
})();

const coreGeo = new THREE.SphereGeometry(1, 28, 16);
let squishes = [], uid = 0, bag = [];
const pickMeshes = [];
function nextSquish() {
  if (!bag.length) { bag = SQ.map((s) => s.id); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } }
  return byId[bag.pop()];
}
const FACE = new CANNON.Vec3(0, 0.8, 0.6).unit();
function addSquish(x, y, z, forceId) {
  const s = forceId ? byId[forceId] : nextSquish(), p = profile(s);
  const body = new CANNON.Body({ mass: p.mass, material: matSq[p.grip], linearDamping: 0.12, angularDamping: 0.45,
    collisionFilterGroup: G_SQ, collisionFilterMask: G_SQ | G_CLAW | G_ST, allowSleep: true, sleepSpeedLimit: 0.12, sleepTimeLimit: 0.8 });
  const r = p.d / 2, ox = p.w / 2 - r, oy = p.h / 2 - r;
  body.addShape(new CANNON.Sphere(r * 1.04));
  if (ox > 0.02) { body.addShape(new CANNON.Sphere(r), new CANNON.Vec3(ox, 0, 0)); body.addShape(new CANNON.Sphere(r), new CANNON.Vec3(-ox, 0, 0)); }
  if (oy > 0.02) { body.addShape(new CANNON.Sphere(r * 0.95), new CANNON.Vec3(0, oy, 0)); body.addShape(new CANNON.Sphere(r * 0.95), new CANNON.Vec3(0, -oy, 0)); }
  body.position.set(x, y, z);
  body.quaternion.copy(qAxis(Y, rnd(-Math.PI, Math.PI)).mult(qAxis(new CANNON.Vec3(1, 0, 0), -Math.PI / 2 + rnd(-0.6, 0.6))));
  const sq = { id: ++uid, s, p, body, gold: false, squash: 0, slip: 0 };
  body.sq = sq;
  body.addEventListener("collide", (e) => {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (v > 2.4) { if (claw.state !== "title") Sound.boing(Math.min(1, (v - 2.4) / 6)); sq.squash = Math.min(0.16, v * 0.022); }
  });
  world.addBody(body);
  const L = looks[s.id];
  const g = new THREE.Group(), front = new THREE.Mesh(pillow, L.front), backM = new THREE.Mesh(pillow, L.back);
  backM.scale.z = -1;
  [front, backM].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.userData.sq = sq; g.add(m); pickMeshes.push(m); });
  // solid body between the two halves, so a squish seen edge-on shows a soft seam instead of a see-through gap
  const coreM = new THREE.Mesh(coreGeo, L.core); coreM.scale.set(0.47, 0.47, 0.16); coreM.position.y = 0.005; coreM.receiveShadow = true; g.add(coreM);
  g.scale.set(p.w, p.h, p.d);
  scene.add(g);
  sq.group = g; sq.meshes = [front, backM];
  squishes.push(sq);
  return sq;
}
function removeSquish(sq) {
  world.removeBody(sq.body);
  scene.remove(sq.group);
  sq.meshes.forEach((m) => { const i = pickMeshes.indexOf(m); if (i >= 0) pickMeshes.splice(i, 1); });
  if (sq.sparkle) scene.remove(sq.sparkle);
  squishes = squishes.filter((q) => q !== sq);
}
const sparkleTex = canvasTex(64, 64, (c) => { c.font = "48px serif"; c.textAlign = "center"; c.fillText("✨", 32, 48); });
function makeGold(sq) {
  sq.gold = true;
  const mk = (m) => { const n = m.clone(); n.emissive = new THREE.Color("#ffb020"); n.emissiveIntensity = 0.35; return n; };
  sq.meshes[0].material = mk(sq.meshes[0].material); sq.meshes[1].material = mk(sq.meshes[1].material);
  sq.sparkle = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTex, transparent: true, depthWrite: false }));
  sq.sparkle.scale.set(0.22, 0.22, 1); scene.add(sq.sparkle);
}
function ensureGold() {
  if (squishes.some((q) => q.gold)) return;
  const top = squishes.filter((q) => !(q.body.position.x < CHX && q.body.position.z > CHZ)).sort((a, b) => b.body.position.y - a.body.position.y).slice(0, 8);
  if (top.length) makeGold(top[Math.floor(Math.random() * top.length)]);
}
// spawn in non-overlapping cells, layer by layer (overlapping spawns explode in a physics engine)
const CELLS = [];
[-0.95, -0.32, 0.31, 0.94].forEach((x) => [-0.55, 0, 0.55].forEach((z) => { if (!(x < CHX + 0.3 && z > CHZ - 0.1)) CELLS.push([x, z]); }));
function spawnRain(n, high) {
  const cells = CELLS.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const c = cells[i % cells.length], layer = Math.floor(i / cells.length);
    const y = high ? 2.05 + layer * 0.5 : 0.35 + layer * 0.58;
    addSquish(c[0] + rnd(-0.06, 0.06), Math.min(y, CEIL - 0.35), c[1] + rnd(-0.05, 0.05));
  }
}

/* ================= game state ================= */
const claw = { x: HOME.x, y: TOP_Y, z: HOME.z, vx: 0, vz: 0, state: "loading", t: 0, timer: TURN_TIME, lastTick: 99, carrying: null, said: {} };
const game = { tokens: START_TOKENS, caught: 0, got: [], newBest: false, flash: 0 };
const input = { left: false, right: false, up: false, down: false, target: null };
let dragId = null;
let contactInfo = { hub: false, support: new Set(), touch: new Map() };

function startGame() {
  if (claw.state === "loading") return;
  Sound.init(); Sound.musicStart(); Sound.coin();
  game.tokens = START_TOKENS; game.caught = 0; game.got = []; game.newBest = false;
  store.plays++; save("sf_claw3d", store);
  el.title.hidden = true; el.over.hidden = true;
  if (squishes.length < REFILL_BELOW) refill();
  ensureGold();
  nextTurn();
}
function nextTurn() {
  claw.state = "ready"; claw.timer = TURN_TIME; claw.lastTick = 99; claw.carrying = null; claw.said = {};
  arms.forEach((a) => { a.grip = T.grip * rnd(1 - T.spread, 1 + T.spread); });
  setArms(IDLE, 40, 3);
  updatePad();
}
function doDrop() {
  if (claw.state !== "ready") return;
  game.tokens--; Sound.coin(); Sound.zip(false);
  claw.state = "drop"; claw.t = 0; claw.vx = claw.vz = 0; input.target = null;
  setArms(T.open, T.openForce, 3);
  updatePad();
}
function refill() {
  const n = Math.min(6, BIN_COUNT - squishes.length);
  if (n <= 0) return;
  spawnRain(n, true); Sound.rain(); ensureGold();
}

/* one fixed 1/120 s step of the claw logic */
function control(dt) {
  const c = claw;
  switch (c.state) {
    case "ready": {
      const ix = (input.left ? -1 : 0) + (input.right ? 1 : 0), iz = (input.up ? -1 : 0) + (input.down ? 1 : 0);
      if (ix || iz) input.target = null;
      let wx, wz;
      if (input.target) {
        const gx = clamp(input.target.x, LIM.x0, LIM.x1) - c.x, gz = clamp(input.target.z, LIM.z0, LIM.z1) - c.z;
        const dist = Math.hypot(gx, gz), sp = Math.min(MOVE_V, dist * 6);
        wx = dist > 1e-6 ? gx / dist * sp : 0; wz = dist > 1e-6 ? gz / dist * sp : 0;
        if (dist < 0.003 && dragId === null) { c.x += gx; c.z += gz; c.vx = c.vz = 0; wx = wz = 0; input.target = null; }
      } else {
        const n = ix && iz ? Math.SQRT1_2 : 1;
        wx = ix * MOVE_V * n; wz = iz * MOVE_V * n;
      }
      c.vx += clamp(wx - c.vx, -MOVE_A * dt, MOVE_A * dt);
      c.vz += clamp(wz - c.vz, -MOVE_A * dt, MOVE_A * dt);
      c.x += c.vx * dt; c.z += c.vz * dt;
      if (c.x < LIM.x0) { c.x = LIM.x0; c.vx = 0; } if (c.x > LIM.x1) { c.x = LIM.x1; c.vx = 0; }
      if (c.z < LIM.z0) { c.z = LIM.z0; c.vz = 0; } if (c.z > LIM.z1) { c.z = LIM.z1; c.vz = 0; }
      const sp = Math.hypot(c.vx, c.vz) / MOVE_V;
      Sound.motor(Math.min(1, sp), 0.8 + sp * 0.5);
      c.timer -= dt;
      const sec = Math.ceil(c.timer);
      if (sec <= 5 && sec < c.lastTick && sec > 0) { c.lastTick = sec; Sound.tick(false); }
      if (c.timer <= 0) { Sound.tick(true); pop("Time's up!", hubTip(), "#ffd166"); doDrop(); }
      break;
    }
    case "drop": {
      Sound.motor(0.75, 1.5);
      c.t += dt;
      const ci = contactInfo;
      const stop = c.t > 0.25 && (ci.hub || ci.support.size >= 2 || c.y <= MIN_Y);
      if (stop) {
        c.state = "grab"; c.t = 0; Sound.motor(0, 1);
        Sound.thunk(!(ci.hub || ci.support.size)); if (ci.hub || ci.support.size) Sound.boing(0.25);
        const near = nearestUnder();
        if (near && near.off < 0.22) pop("Nice aim!", hubTip(), "#7dffb0");
        // remember how centred the claw landed on each squish: that's the player's aim, before the prongs drag things
        c.landing = new Map();
        for (const q of squishes) {
          const p = q.body.position;
          c.landing.set(q, Math.hypot(p.x - hub.position.x, p.z - hub.position.z) / (Math.max(q.p.w, q.p.h) / 2));
        }
      } else c.y = Math.max(MIN_Y, c.y - DROP_V * dt * Math.min(1, c.t * 4));
      break;
    }
    case "grab": {
      c.t += dt;
      if (c.t > 0.12 && !c.said.close) { c.said.close = true; Sound.clack(); arms.forEach((a) => { a.target = T.closed; a.force = a.grip; a.speed = T.closeSpeed; }); }
      if (c.t > 0.7 && !c.said.grip) { c.said.grip = true; tryGrip(); }
      if (c.t > 0.95) { c.state = "lift"; c.t = 0; Sound.zip(true); }
      break;
    }
    case "lift": {
      c.t += dt;
      Sound.motor(0.8, 1.15);
      c.y = Math.min(TOP_Y, c.y + LIFT_V * dt * Math.min(1, c.t * 3));
      if (c.y >= TOP_Y) {
        c.state = "carry"; c.t = 0;
        arms.forEach((a) => { a.force *= T.relax; }); // the claw loosens a touch at the top
        if (grip) setGripCap(grip.cap * T.relax);
      }
      break;
    }
    case "carry": {
      c.t += dt;
      const gx = HOME.x - c.x, gz = HOME.z - c.z, dist = Math.hypot(gx, gz);
      const sp = Math.min(CARRY_V, dist * 2.5, c.t * 1.8); // ease in/out: jerky starts would rip squishes out
      if (dist < 0.004) { c.x = HOME.x; c.z = HOME.z; c.state = "release"; c.t = 0; Sound.motor(0, 1); }
      else { c.x += gx / dist * sp * dt; c.z += gz / dist * sp * dt; Sound.motor(Math.min(1, sp / CARRY_V) * 0.9, 0.9); }
      break;
    }
    case "release": {
      c.t += dt;
      if (c.t > 0.15 && !c.said.open) { c.said.open = true; dropGrip(); setArms(0.98, 30, 3); }
      // a little shake so tall squishes don't stay wedged between the prongs
      c.y = TOP_Y + (c.t > 0.45 && c.t < 1.05 ? Math.sin((c.t - 0.45) * 42) * 0.03 : 0);
      if (c.t > 1.1 && !c.said.idle) { c.said.idle = true; setArms(IDLE, 40, 3); }
      if (c.t > 1.5) {
        if (squishes.length < REFILL_BELOW) refill();
        if (game.tokens > 0) nextTurn(); else { c.state = "ending"; c.t = 0; updatePad(); }
      }
      break;
    }
    case "ending": {
      c.t += dt;
      if (game.tokens > 0) nextTurn(); else if (c.t > 1.8) gameOver();
      break;
    }
  }
  // kinematic hub follows the claw position exactly
  hub.velocity.set((c.x - hub.position.x) / dt, (c.y - hub.position.y) / dt, (c.z - hub.position.z) / dt);
  driveArms();
  // a gentle nudge so resting squishes tend to lie face up toward the player (not while the claw has them)
  for (const q of squishes) {
    const b = q.body;
    if (b.sleepState === CANNON.Body.SLEEPING || contactInfo.touch.has(q)) continue;
    const f = b.quaternion.vmult(Z), tq = f.cross(FACE);
    b.torque.x += tq.x * 0.9 * b.mass; b.torque.y += tq.y * 0.9 * b.mass; b.torque.z += tq.z * 0.9 * b.mass;
  }
}

function afterStep(dt) {
  // read this step's contacts: what the hub and each prong are touching
  const ci = { hub: false, support: new Set(), touch: new Map() };
  for (const c of world.contacts) {
    const A = c.bi, B = c.bj;
    let sq, other, ny;
    if (A.sq && !B.sq) { sq = A.sq; other = B; ny = c.ni.y; } else if (B.sq && !A.sq) { sq = B.sq; other = A; ny = -c.ni.y; } else continue;
    if (other === hub) { ci.hub = true; continue; }
    if (other.armIdx === undefined) continue;
    let set = ci.touch.get(sq); if (!set) ci.touch.set(sq, (set = new Set()));
    set.add(other.armIdx);
    if (ny > 0.45) ci.support.add(other.armIdx); // prong resting on top of a squish
  }
  contactInfo = ci;
  const c = claw;
  // is the grip holding? an overloaded grip joint lets the squish sag, and past slipDist it pulls free
  if (grip) {
    const p = grip.sq.body.position, hp = hub.position, pa = grip.pA;
    const sag = Math.hypot(hp.x + pa.x - p.x, hp.y + pa.y - p.y, hp.z + pa.z - p.z);
    grip.sag = sag;
    if (!c.said.got && (c.state === "lift" || c.state === "carry") && p.y > 1.0) { c.said.got = true; pop("Got one!", hubTip(), "#fff"); Sound.grip(grip.off); }
    if (sag > T.slipDist) {
      // the grip let go, but the closed prongs may still cradle it all the way to the chute, so don't call it lost yet
      const sq = grip.sq; dropGrip();
      arms.forEach((a) => { a.target = T.closed; });
      c.slipping = { sq, loose: 0, carry: c.state === "carry" };
    }
  }
  // a slipping squish only counts as lost once it has really fallen away from the claw
  if (c.slipping) {
    const s = c.slipping, p = s.sq.body.position;
    if (!squishes.includes(s.sq) || c.state === "release" || c.state === "ready" || c.state === "ending") c.slipping = null; // caught or turn over
    else {
      s.loose = contactInfo.touch.has(s.sq) ? 0 : s.loose + dt;
      if (s.carry || c.state === "carry") s.carry = true;
      if (hub.position.y - p.y > 0.95 || (s.loose > 0.35 && hub.position.y - p.y > 0.5)) {
        if (!(p.x < CHX && p.z > CHZ)) { pop(s.carry ? "So close!" : "Oops!", p, "#ffd166"); Sound.slip(); }
        c.slipping = null;
      }
    }
  }
  // the prize chute: anything that drops out of the bottom on the chute side is caught
  for (const q of squishes.slice()) {
    const p = q.body.position;
    if (p.y < -0.3 && p.x < CHX && p.z > CHZ) { removeSquish(q); if (c.state !== "title" && c.state !== "loading") onCatch(q); }
    else if (p.y < -3 || isNaN(p.x) || isNaN(p.y)) removeSquish(q);
  }
}

function tick() { control(STEP); world.step(STEP); afterStep(STEP); }

function nearestUnder() {
  let best = null;
  for (const q of squishes) {
    const p = q.body.position, dx = p.x - claw.x, dz = p.z - claw.z;
    if (p.y > claw.y) continue;
    const off = Math.hypot(dx, dz) / (Math.max(q.p.w, q.p.h) / 2);
    if (off < 1 && (!best || p.y > best.q.body.position.y - 0.15 && off < best.off)) best = { q, off };
  }
  return best;
}
/* the grip: when at least two prongs are pressing on one squish, a joint forms between the hub and that squish.
   Its force limit is built from each touching prong's own strength, how slippery the squish is, how centred the
   claw is and whether all three prongs made contact. Weight and jolts beyond that limit make it sag and slip. */
let grip = null;
function tryGrip() {
  let best = null;
  for (const [sq, set] of contactInfo.touch) {
    if (set.size < 2) continue;
    const p = sq.body.position;
    if (p.y > hub.position.y) continue;
    const offNow = Math.hypot(p.x - hub.position.x, p.z - hub.position.z) / (Math.max(sq.p.w, sq.p.h) / 2);
    if (offNow > 0.95) continue;
    const off = Math.max(offNow, (claw.landing && claw.landing.get(sq)) || 0);
    const score = set.size * 2 - off;
    if (!best || score > best.score) best = { sq, set, off, score };
  }
  claw.lastGrip = best ? { id: best.sq.s.id, arms: best.set.size, off: best.off } : null;
  if (!best) return;
  let sum = 0; for (const i of best.set) sum += arms[i].grip;
  const center = Math.max(0.15, 1 - 0.85 * best.off * best.off);
  const cap = sum * GRIP_FRIC[best.sq.p.grip] * center * (best.set.size === 3 ? 1 : T.twoArm) * T.capK;
  const p = best.sq.body.position;
  const pA = new CANNON.Vec3(p.x - hub.position.x, p.y - hub.position.y, p.z - hub.position.z);
  // cannon clamps constraint impulses per step, so a force limit in newtons is cap * STEP
  const con = new CANNON.PointToPointConstraint(hub, pA, best.sq.body, new CANNON.Vec3(0, 0, 0), cap * STEP);
  world.addConstraint(con);
  grip = { sq: best.sq, con, cap, pA, off: best.off, arms: best.set.size, weight: best.sq.body.mass * GRAV, sag: 0 };
  claw.lastGrip.cap = cap; claw.lastGrip.weight = grip.weight;
  // prongs hug where they are instead of squeezing further, and lightly: the grip joint's limit decides what holds
  for (const a of arms) { a.target = a.th - 0.06; a.force = a.grip * T.hug; }
}
function setGripCap(cap) {
  if (!grip) return;
  grip.cap = cap;
  grip.con.equations.forEach((e) => { e.maxForce = cap * STEP; e.minForce = -cap * STEP; });
}
function dropGrip() {
  if (!grip) return;
  world.removeConstraint(grip.con);
  grip.sq.body.wakeUp();
  grip = null;
}
function hubTip() { return { x: claw.x, y: claw.y - 0.55, z: claw.z }; }

function onCatch(q) {
  const s = q.s, isNew = !store.shelf[s.id];
  store.shelf[s.id] = (store.shelf[s.id] || 0) + 1;
  if (q.gold) store.gold[s.id] = true;
  game.caught++; game.got.push({ s, gold: q.gold });
  const bonus = (isNew ? 1 : 0) + (q.gold ? 2 : 0);
  game.tokens += bonus;
  if (game.caught > store.best) { store.best = game.caught; game.newBest = true; }
  save("sf_claw3d", store);
  Sound.win(q.gold); if (bonus) setTimeout(() => Sound.bonus(), 650);
  game.flash = q.gold ? 2.4 : 1.6;
  pop(q.gold ? "GOLDEN!" : "Caught!", { x: HOME.x, y: 0.5, z: HOME.z }, q.gold ? "#ffd166" : "#7dffb0");
  showToast(s, isNew, q.gold, bonus);
  renderShelf(); updatePad();
}
function gameOver() {
  claw.state = "over"; Sound.over(); Sound.motor(0, 1);
  const n = game.caught;
  el.overText.innerHTML = n === 0 ? "No squishes this time. Aim for the middle, check the side view, and try again!" :
    "You caught <b>" + n + "</b> squish" + (n === 1 ? "" : "es") + "!" + (game.newBest ? " 🏆 New best!" : " Best: " + store.best + ".");
  el.overGot.innerHTML = game.got.map((g) => window.squishSVG(g.s, "happy")).join("");
  el.over.hidden = false; updatePad();
  setTimeout(() => { try { el.again.focus({ preventScroll: true }); } catch (e) {} }, 50);
}

/* ================= rendering ================= */
let W = 1, H = 1;
const tmpV = new THREE.Vector3();
let camFrozen = false;
function fitCamera() {
  if (camFrozen) return;
  const aspect = W / H; cam.aspect = aspect; cam.updateProjectionMatrix();
  const tgt = new THREE.Vector3(0, 0.95, 0.05), dir = new THREE.Vector3(0, 0.58, 1).normalize();
  const pts = [[-1.36, -0.5, 0.98], [1.36, -0.5, 0.98], [-1.34, 2.66, BZ0], [1.34, 2.66, BZ0], [-1.34, 2.62, 0], [1.34, 2.62, 0]];
  let d = 2;
  for (; d < 14; d += 0.04) {
    cam.position.copy(tgt).addScaledVector(dir, d); cam.lookAt(tgt); cam.updateMatrixWorld();
    if (pts.every((p) => { tmpV.set(p[0], p[1], p[2]).project(cam); return Math.abs(tmpV.x) <= 0.99 && Math.abs(tmpV.y) <= 0.99; })) break;
  }
}
function resize() {
  const r = el.canvas.getBoundingClientRect();
  W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  renderer.setSize(W, H, false);
  fitCamera();
}
window.addEventListener("resize", resize);

const ray = new THREE.Raycaster();
const DOWN3 = new THREE.Vector3(0, -1, 0);
let showPip = load("sf_claw3d_pip", true);
function render(time) {
  // squishes follow their bodies, with a little squash when they land
  for (const q of squishes) {
    q.group.position.copy(q.body.position); q.group.quaternion.copy(q.body.quaternion);
    q.squash *= 0.86;
    q.group.scale.set(q.p.w * (1 + q.squash * 0.5), q.p.h * (1 + q.squash * 0.3), q.p.d * (1 - q.squash));
    if (q.gold) {
      const e = 0.25 + 0.2 * Math.sin(time * 5);
      q.meshes.forEach((m) => { m.material.emissiveIntensity = e; });
      q.sparkle.position.set(q.body.position.x + 0.18, q.body.position.y + 0.32, q.body.position.z);
      q.sparkle.material.opacity = 0.5 + 0.5 * Math.sin(time * 7);
    }
  }
  hubMesh.position.copy(hub.position);
  for (const a of arms) { a.mesh.position.copy(a.body.position); a.mesh.quaternion.copy(a.body.quaternion); }
  bridge.position.x = claw.x;
  carriage.position.set(claw.x, RAIL_Y - 0.08, claw.z);
  const top = RAIL_Y - 0.13, bot = hub.position.y + 0.18;
  cable.position.set(claw.x, (top + bot) / 2, claw.z); cable.scale.y = Math.max(0.01, top - bot);
  // aim: straight down from the claw onto whatever it would land on
  const aiming = claw.state === "ready";
  laser.visible = ring.visible = aiming;
  if (aiming) {
    ray.set(new THREE.Vector3(claw.x, claw.y - 0.2, claw.z), DOWN3);
    const hit = ray.intersectObjects(pickMeshes.concat(floorMeshes), false)[0];
    const hy = hit ? hit.point.y : 0;
    laser.position.set(claw.x, (claw.y - 0.2 + hy) / 2, claw.z); laser.scale.y = Math.max(0.01, claw.y - 0.2 - hy);
    ring.position.set(claw.x, hy + 0.012, claw.z);
    let col = "#ffffff";
    const q = hit && hit.object.userData.sq;
    if (q) {
      const off = Math.hypot(q.body.position.x - claw.x, q.body.position.z - claw.z) / (Math.max(q.p.w, q.p.h) / 2);
      col = off < 0.25 ? "#7dffb0" : off < 0.55 ? "#ffffff" : "#ffd166";
    }
    mats.ring.color.set(col);
  }
  if (game.flash > 0) game.flash -= 1 / 60;
  el.machine.classList.toggle("flash", game.flash > 0);

  renderer.shadowMap.needsUpdate = true;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, W, H);
  renderer.render(scene, cam);
  if (showPip) {
    const pr = el.pip.getBoundingClientRect(), cr = el.canvas.getBoundingClientRect();
    const x = pr.left - cr.left, y = cr.bottom - pr.bottom, w = pr.width, h = pr.height;
    sideCam.aspect = w / h; sideCam.updateProjectionMatrix();
    laser.visible = ring.visible = false; // keep the side view clean, it's for judging depth
    renderer.setScissorTest(true); renderer.setScissor(x, y, w, h); renderer.setViewport(x, y, w, h);
    renderer.render(scene, sideCam);
    renderer.setScissorTest(false);
  }
  // HUD
  setText(el.tokens, game.tokens); setText(el.caught, game.caught);
  const tsec = Math.max(0, Math.ceil(claw.timer));
  setText(el.timer, claw.state === "ready" ? "⏱ " + tsec : "⏱ –");
  el.timer.classList.toggle("low", claw.state === "ready" && tsec <= 5);
}
function setText(n, v) { v = String(v); if (n.textContent !== v) n.textContent = v; }

/* floating words over the 3D scene */
function pop(text, p, color) {
  tmpV.set(p.x, p.y, p.z).project(cam);
  const d = document.createElement("div");
  d.className = "pop"; d.textContent = text; d.style.color = color || "#fff";
  d.style.left = clamp((tmpV.x + 1) / 2 * 100, 18, 82) + "%"; d.style.top = clamp((1 - tmpV.y) / 2 * 100, 10, 90) + "%";
  el.stage.appendChild(d);
  setTimeout(() => d.remove(), 1350);
}

/* ================= loop ================= */
let last = 0, acc = 0, running = true, simOn = false;
function frame(ts) {
  if (!running) return;
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
  if (simOn) {
    acc += dt; let n = 0;
    while (acc >= STEP && n < 8) { tick(); acc -= STEP; n++; }
    if (n >= 8) acc = 0;
  }
  render(ts / 1000);
  requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { running = false; Sound.suspend(); releaseAll(); }
  else if (!running) { running = true; last = 0; Sound.resume(); requestAnimationFrame(frame); }
});

/* ================= input ================= */
const held = { left: {}, right: {}, up: {}, down: {} };
function syncInput() {
  for (const k in held) input[k] = !!(held[k].key || held[k].btn);
  el.left.classList.toggle("on", input.left); el.right.classList.toggle("on", input.right);
  el.up.classList.toggle("on", input.up); el.down.classList.toggle("on", input.down);
}
function releaseAll() { for (const k in held) held[k] = {}; dragId = null; syncInput(); }
function updatePad() {
  const ready = claw.state === "ready";
  [el.left, el.right, el.up, el.down, el.drop].forEach((b) => { b.disabled = !ready; });
  if (!ready) { for (const k in held) held[k].btn = false; syncInput(); }
}
function nudge(k) {
  if (claw.state !== "ready") return;
  const d = 0.012;
  if (k === "left") claw.x = clamp(claw.x - d, LIM.x0, LIM.x1);
  if (k === "right") claw.x = clamp(claw.x + d, LIM.x0, LIM.x1);
  if (k === "up") claw.z = clamp(claw.z - d, LIM.z0, LIM.z1);
  if (k === "down") claw.z = clamp(claw.z + d, LIM.z0, LIM.z1);
}
const KEYS = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", Space: "drop", Enter: "drop" };
window.addEventListener("keydown", (e) => {
  const k = KEYS[e.code]; if (!k) return;
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.target && e.target.tagName === "A" && e.code === "Enter") return;
  e.preventDefault();
  if (k === "drop") {
    if (e.repeat) return;
    if (claw.state === "title" || claw.state === "over") return startGame();
    return doDrop();
  }
  if (!held[k].key && !e.repeat) nudge(k);
  held[k].key = true; syncInput();
});
window.addEventListener("keyup", (e) => { const k = KEYS[e.code]; if (!k) return; e.preventDefault(); if (k !== "drop") { held[k].key = false; syncInput(); } });
window.addEventListener("blur", releaseAll);
function holdButton(btn, k) {
  const up = () => { held[k].btn = false; syncInput(); };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault(); if (btn.disabled) return;
    Sound.init();
    try { btn.setPointerCapture(e.pointerId); } catch (x) {}
    if (!held[k].btn) nudge(k);
    held[k].btn = true; syncInput();
  });
  btn.addEventListener("pointerup", up); btn.addEventListener("pointercancel", up); btn.addEventListener("lostpointercapture", up);
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
}
holdButton(el.left, "left"); holdButton(el.right, "right"); holdButton(el.up, "up"); holdButton(el.down, "down");
el.drop.addEventListener("pointerdown", (e) => {
  e.preventDefault(); if (el.drop.disabled) return;
  el.drop.classList.add("on"); setTimeout(() => el.drop.classList.remove("on"), 140);
  doDrop();
});
el.drop.addEventListener("click", (e) => { if (e.detail === 0) doDrop(); });
el.drop.addEventListener("contextmenu", (e) => e.preventDefault());

// tap / click a spot in the machine and the claw travels there (a squish you tap, or the floor)
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function aimAtPointer(e) {
  const r = el.canvas.getBoundingClientRect();
  if (showPip) { const p = el.pip.getBoundingClientRect(); if (e.clientX >= p.left && e.clientX <= p.right && e.clientY >= p.top && e.clientY <= p.bottom) return false; }
  const nd = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(nd, cam);
  const hit = ray.intersectObjects(pickMeshes, false)[0];
  const pt = hit ? hit.point : ray.ray.intersectPlane(floorPlane, new THREE.Vector3());
  if (!pt) return false;
  // a tap lands on the squish's surface facing you, which sits in front of its middle; pull 80% toward its centre
  const q = hit && hit.object.userData.sq;
  input.target = q ? { x: q.body.position.x + (pt.x - q.body.position.x) * 0.2, z: q.body.position.z + (pt.z - q.body.position.z) * 0.2, sq: q } : { x: pt.x, z: pt.z };
  return true;
}
el.canvas.addEventListener("pointerdown", (e) => {
  if (claw.state !== "ready") return;
  e.preventDefault(); Sound.init();
  if (!aimAtPointer(e)) return;
  dragId = e.pointerId; try { el.canvas.setPointerCapture(e.pointerId); } catch (x) {}
});
el.canvas.addEventListener("pointermove", (e) => { if (dragId === e.pointerId && claw.state === "ready") aimAtPointer(e); });
const endDrag = (e) => { if (dragId === e.pointerId) dragId = null; };
el.canvas.addEventListener("pointerup", endDrag); el.canvas.addEventListener("pointercancel", endDrag);
el.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

el.play.addEventListener("click", startGame);
el.again.addEventListener("click", startGame);
function setToggle(btn, on, a, b) {
  const t = on ? a : b, i = t.indexOf(" ");
  btn.innerHTML = t.slice(0, i) + '<span class="lbl">' + t.slice(i) + "</span>";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}
setToggle(el.gfx, LITE, "⚡ Lite", "✨ HD");
// switching graphics rebuilds every material, so it reloads the page (the shelf is saved; the current game restarts)
el.gfx.addEventListener("click", () => { save("sf_claw3d_lite", !LITE); location.reload(); });
setToggle(el.music, Sound.musicOn(), "🎵 Music", "🔇 Music");
setToggle(el.sfx, Sound.sfxOn(), "🔊 Sounds", "🔈 Sounds");
setToggle(el.pipBtn, showPip, "👀 Side", "👀 Side");
el.pip.hidden = !showPip;
el.music.addEventListener("click", () => { const on = !Sound.musicOn(); Sound.init(); Sound.setMusic(on); if (on) Sound.musicStart(); setToggle(el.music, on, "🎵 Music", "🔇 Music"); el.music.blur(); });
el.sfx.addEventListener("click", () => { const on = !Sound.sfxOn(); Sound.init(); Sound.setSfx(on); if (on) Sound.blip(); setToggle(el.sfx, on, "🔊 Sounds", "🔈 Sounds"); el.sfx.blur(); });
el.pipBtn.addEventListener("click", () => { showPip = !showPip; save("sf_claw3d_pip", showPip); el.pip.hidden = !showPip; setToggle(el.pipBtn, showPip, "👀 Side", "👀 Side"); el.pipBtn.blur(); });

/* ================= toast + shelf ================= */
let toastTimer;
const starStr = (n) => "★".repeat(n) + "☆".repeat(3 - n);
function showToast(s, isNew, gold, bonus) {
  const st = starsFor(s);
  el.toast.className = "toast show" + (gold ? " gold" : "");
  el.toast.innerHTML = window.squishSVG(s, "happy") + "<div><b>" + (gold ? "✨ Golden " : "") + s.name + "!</b><span>" +
    (isNew ? "New on your shelf!" : "Another one for the shelf") + (bonus ? " +" + bonus + " token" + (bonus > 1 ? "s" : "") : "") +
    "</span><span>" + (st === 3 ? "Tricky catch " : st === 2 ? "Nice catch " : "Catch ") + starStr(st) + "</span></div>";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.className = "toast" + (gold ? " gold" : ""); }, 2600);
}
function renderShelf() {
  const have = SQ.filter((s) => store.shelf[s.id]).length;
  el.shelfSub.textContent = have === SQ.length ? "You caught all 24! 🏆 Best game: " + store.best + "." :
    have + " of " + SQ.length + " caught" + (store.best ? ". Best game: " + store.best + "." : ". Catch them all!") + " ★ = how tricky to grab.";
  el.shelfGrid.innerHTML = SQ.map((s) => {
    const n = store.shelf[s.id] || 0, st = "<em>" + starStr(starsFor(s)) + "</em>";
    if (!n) return '<div class="cell no">' + window.squishSVG(s, "open") + "???" + st + "</div>";
    return '<a class="cell' + (store.gold[s.id] ? " gold" : "") + '" href="/squishes/' + slug(s) + '">' + window.squishSVG(s, "happy") +
      (n > 1 ? "<i>×" + n + "</i>" : "") + s.name.replace(/ the /, "<br>the ") + st + "</a>";
  }).join("");
}

/* ================= boot ================= */
function calibrateMotor() {
  // find which motor direction opens the prongs (keeps the code independent of cannon's sign convention)
  const a = arms[0], before = armAngle(a);
  a.hinge.setMotorSpeed(1); a.hinge.setMotorMaxForce(60);
  for (let i = 0; i < 6; i++) world.step(STEP);
  MOTOR_SIGN = armAngle(a) > before ? 1 : -1;
}
(async function boot() {
  resize(); renderShelf(); updatePad();
  try { if (document.fonts) await document.fonts.load("800 40px 'Baloo 2'"); } catch (e) {}
  await makeLooks();
  calibrateMotor();
  claw.state = "title";
  spawnRain(BIN_COUNT, false);
  for (let i = 0; i < 360; i++) tick(); // let most of the pile settle before anyone sees it
  ensureGold();
  el.loading.hidden = true; el.title.hidden = false;
  simOn = true;
  requestAnimationFrame(frame);
})();

/* hooks for automated tests */
window.__claw3d = {
  claw, game, arms, store, T, input, squishes: () => squishes, world, contact: () => contactInfo,
  start: startGame, drop: doDrop, nearestUnder, armAngle, profile, starsFor, setStars: (s) => { STARS = s; renderShelf(); },
  setXZ: (x, z) => { claw.x = clamp(x, LIM.x0, LIM.x1); claw.z = clamp(z, LIM.z0, LIM.z1); claw.vx = claw.vz = 0; },
  sim: (sec) => { const n = Math.round(sec / STEP); for (let i = 0; i < n; i++) tick(); },
  resetPile: () => { squishes.slice().forEach(removeSquish); spawnRain(BIN_COUNT, false); for (let i = 0; i < 360; i++) tick(); ensureGold(); },
  pause: (v) => { simOn = !v; }, getGrip: () => grip, armCMs, cam, fitCamera, freezeCam: (v) => { camFrozen = v; }, addSquish, removeSquish, motorSign: () => MOTOR_SIGN, LIM, HOME
};
