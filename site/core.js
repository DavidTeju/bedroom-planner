"use strict";
// Shared by plan.html (2D) and index.html (3D): the measured room, the ready-made
// layouts, saved state, the collision rules and the sidebar. Each page supplies only its own view.
const KEY = "bedroom-planner-v1";
const PLANS_KEY = "bedroom-planner-plans-v1";
const DEFAULT = {
  planId: null,
  room: { W: 129, L: 164, bx: 31, by: 48, H: 111, flush: 3, near: 24 },
  openings: [
    { id: "door", name: "Door", kind: "door", wall: "N", off: 59, w: 39, sill: 0, h: 80, hinge: "end", swing: "in" },
    { id: "closet", name: "Closet door", kind: "closet", wall: "W", off: 82, w: 35, sill: 0, h: 80, hinge: "end", swing: "in" },
    { id: "window", name: "Window", kind: "window", wall: "W", off: 130, w: 34, sill: 39, h: 48, hinge: "none", swing: "in" }
  ],
  items: [
    { id: "bed", name: "Bed", x: 39, y: 78, w: 66, d: 86, h: 24, z: 0, color: "#7c93c4", kind: "bed", solid: true, headH: 46, headT: 3, headSide: "S" }
  ]
};
// Femi's own bench, measured 46 x 16; its 18 in height is read off photos.
const BENCH = "Tufted storage bench";
// name, width, depth, height, off floor, colour, solid, kind
const PRESETS = [
  ["Dresser", 36, 18, 34, 0, "#b98b5e", true, "dresser"], ["Tall drawers", 28, 19, 48, 0, "#b98b5e", true, "dresser"],
  ["Wardrobe", 39, 23, 79, 0, "#a98f6f", true, "wardrobe"], ["Clothes rack", 48, 18, 65, 0, "#9aa3ad", true, "rack"],
  ["Shoe cabinet", 31, 9, 40, 0, "#c7b08e", true, "shoe"], ["Bench", 48, 16, 18, 0, "#a9825a", true, "bench"], [BENCH, 46, 16, 18, 0, "#4a4d55", true, "ottoman"],
  ["Nightstand", 20, 16, 24, 0, "#d1b48c", true, "nightstand"], ["Bookshelf", 32, 12, 72, 0, "#9c7b55", true, "shelf"],
  ["Armchair", 32, 34, 32, 0, "#7fae8f", true, "chair"], ["Rug", 96, 60, 0.5, 0, "#d9a5a0", false, "rug"],
  ["Wall shelf", 36, 8, 2, 60, "#a8a29e", true, "other"], ["Mirror", 24, 1, 60, 12, "#9fc5d8", true, "mirror"],
  ["Floor lamp", 12, 12, 64, 0, "#e3c66b", true, "lamp"], ["Table lamp", 10, 10, 18, 0, "#e3c66b", true, "lamp"], ["Plug-in sconce", 6, 4, 12, 46, "#e3c66b", true, "sconce"],
  ["Ladder shelf", 24, 16, 72, 0, "#b08a62", true, "ladder"], ["Bean bag", 36, 34, 26, 0, "#a65d3f", true, "beanbag"],
  ["Snowboard wall rack", 12, 8, 63, 16, "#2f5d7c", true, "board"], ["Snowboard boots on a tray", 14, 15, 12, 0, "#2b2d33", true, "boots"],
  ["Framed art", 24, 1, 30, 50, "#efe4cc", true, "art"], ["Wall hanging", 30, 1, 45, 40, "#3f5f9e", true, "textile"], ["Peg rail with gear", 36, 2, 20, 50, "#c9b592", true, "pegs"],
  ["Custom box", 24, 24, 24, 0, "#bdbdbd", true, "other"]
];
const KINDS = { bed: "Bed", bench: "Bench", ottoman: "Upholstered storage bench", dresser: "Dresser / drawers", wardrobe: "Wardrobe", rack: "Clothes rack", shoe: "Shoe storage",
  nightstand: "Nightstand", shelf: "Shelving", ladder: "Ladder shelf", beanbag: "Bean bag", board: "Snowboard on a wall rack", boots: "Snowboard boots", chair: "Chair", rug: "Rug", mirror: "Mirror",
  art: "Framed art", textile: "Wall hanging", pegs: "Peg rail with gear", lamp: "Lamp", sconce: "Wall sconce", plant: "Plant", other: "Plain box" };
// Starting points that ship with the page.
const KIND_COLOR = { bed: "#7c93c4", bench: "#a9825a", ottoman: "#4a4d55", dresser: "#b98b5e", wardrobe: "#a98f6f", rack: "#9aa3ad", shoe: "#c7b08e",
  nightstand: "#d1b48c", shelf: "#9c7b55", ladder: "#b08a62", beanbag: "#a65d3f", board: "#2f5d7c", boots: "#2b2d33", chair: "#7fae8f", rug: "#d9a5a0", mirror: "#9fc5d8", lamp: "#e3c66b", sconce: "#e3c66b", plant: "#7fae8f",
  art: "#efe4cc", textile: "#3f5f9e", pegs: "#c9b592", other: "#bdbdbd" };
// [name, kind, x, y, width, depth, height, off floor, headboard side]
const pc = ([name, kind, x, y, w, d, h, z = 0, headSide = ""], i) => ({ id: kind + i, name, kind, x, y, w, d, h, z, color: KIND_COLOR[kind],
  solid: kind !== "rug", headH: headSide ? 46 : 0, headT: 3, headSide: headSide || "S" });
const layout = (id, name, note, why, rows) => ({ id, name, note, why, items: rows.map(pc) });
const BUILTIN = [
  layout("b3", "Bed facing the window", "wake to light",
    "Bed turned with its head on the east wall and its foot toward the window, so the middle of the room is one open floor. A tall PAX wardrobe fills the north-west corner facing south, with a KALLAX shoe tower beside it and clear of the door swing. Its doors open onto clear floor: the MALM tall chest starts on the west wall just past them. A ladder shelf leans on the in-push facing south, under the summit photos. A small nightstand stands at the head of the bed's open side. The bench sits across the foot of the bed. The snowboard hangs upright on the south wall at the window end of the bench, with its boots on a tray under it, so it sits in the dead end beside the floor lamp. No ceiling light: a floor lamp stands in the window corner, a plug-in swing-arm sconce over the bed's head corner, just above the headboard, is the reading light, and your BÖJA, Mika and PELARBOJ lamps sit on the chest, the nightstand and the KALLAX. Tightest walkway is 27 in, between the bench and the window wall; the lamp sits at its dead end.", [
    ["Bed", "bed", 43, 98, 86, 66, 24, 0, "E"], [BENCH, "ottoman", 27, 117, 16, 46, 18],
    ["PAX wardrobe 39 3/8, tall", "wardrobe", 0, 0, 39.375, 22.875, 93.125], ["KALLAX 1x4 shoe tower", "shoe", 39.375, 0, 15.375, 16.5, 57.875],
    ["MALM 6-drawer tall chest", "dresser", 0, 44, 18.875, 31.5, 48.375],
    ["Ladder shelf", "ladder", 101, 48, 24, 16, 72], ["Small nightstand, 1 drawer", "nightstand", 117, 82, 12, 16, 24], ["Jute rug 5'3 x 7'7", "rug", 36, 48, 90.5, 63, 0.5],
    ["Floor lamp", "lamp", 1, 151, 12, 12, 64], ["Snowboard wall rack", "board", 14, 156, 12, 8, 63, 16], ["Snowboard boots on a tray", "boots", 13, 149, 14, 15, 12], ["Plug-in swing-arm sconce", "sconce", 125, 99, 4, 6, 12, 46], ["Mika cactus lamp (yours)", "lamp", 119, 86, 8, 8, 15, 24],
    ["BÖJA table lamp (yours)", "lamp", 4.5, 55, 9.75, 9.75, 9.5, 48.375], ["PELARBOJ glow lamp (yours)", "lamp", 44.75, 6, 4.5, 4.5, 4, 57.875],
    ["Yosemite panorama", "art", 128, 107, 1, 48, 30, 54], ["Park print", "art", 55, 163, 18, 1, 24, 50], ["Park print", "art", 77, 163, 18, 1, 24, 50], ["Park print", "art", 99, 163, 18, 1, 24, 50], ["Adire wall hanging", "textile", 128, 68.25, 1, 29.5, 40, 54], ["Framed topo map", "art", 0, 47.75, 1, 24, 24, 56], ["Summit photos", "art", 100, 48, 24, 1, 20, 72]]),
  layout("a1", "Corner bed, maximum storage", "most storage",
    "Bed in the south-east corner. A tall PAX wardrobe in the north-west corner takes hanging clothes with the KALLAX shoe tower beside it, and a 63 in MALM dresser sits under the window and doubles as the nightstand. Bench stays at the foot. The snowboard hangs upright on the east wall in the corner by the in-push, its boots on a tray under it. No ceiling light: a floor lamp stands just north of the bed's foot corner, a plug-in swing-arm sconce on the south wall, just above the headboard's open corner, is the reading light, and your BÖJA and Mika lamps sit on the dresser with the PELARBOJ on the KALLAX. Main walkway is 51 in; the tightest spot is 24 in in front of the wardrobe doors. The bed is reachable from one side only and the north-west corner is furniture-heavy.", [
    ["Bed", "bed", 63, 78, 66, 86, 24, 0, "S"], [BENCH, "ottoman", 64, 62, 46, 16, 18],
    ["PAX wardrobe 39 3/8, tall", "wardrobe", 0, 0, 39.375, 22.875, 93.125], ["MALM 6-drawer dresser", "dresser", 0, 145.125, 63, 18.875, 30.75],
    ["KALLAX 1x4 shoe tower", "shoe", 39.375, 0, 15.375, 16.5, 57.875], ["Hook rail", "other", 104, 48, 18.875, 3.5, 5.5, 62],
    ["Runner rug 30 x 84", "rug", 28, 55, 30, 84, 0.5],
    ["Floor lamp", "lamp", 117, 65, 12, 12, 64], ["Snowboard wall rack", "board", 121, 52, 8, 12, 63, 16], ["Snowboard boots on a tray", "boots", 115, 51, 14, 14, 12], ["Plug-in swing-arm sconce", "sconce", 63, 160, 6, 4, 12, 46], ["BÖJA table lamp (yours)", "lamp", 51, 150, 9.75, 9.75, 9.5, 30.75],
    ["Mika cactus lamp (yours)", "lamp", 4, 150, 8, 8, 15, 30.75], ["PELARBOJ glow lamp (yours)", "lamp", 44.75, 6, 4.5, 4.5, 4, 57.875],
    ["Yosemite panorama", "art", 72, 163, 48, 1, 32, 54], ["Trip photo grid", "art", 8, 163, 48, 1, 28, 38], ["Adire wall hanging", "textile", 128, 90, 1, 30, 40, 48], ["Framed topo map", "art", 0, 53, 1, 24, 28, 44], ["Summit photo", "art", 40, 0, 14, 1, 20, 66]]),
  layout("a3", "Centred bed, both sides open", "two-sided bed",
    "Bed stays almost where it is, so you can get in from either side: 38 in on the west (22 in beside the low chest under the window), 25 in on the east. Tall PAX in the north-west corner with the KALLAX shoe tower beside it, a narrow KULLEN 5-drawer chest south of the in-push, a low KULLEN 3-drawer chest under the window, a nightstand and a shelf over the headboard. The snowboard hangs upright on the west wall just north of the closet door, its boots on a tray under it. No ceiling light: a pair of plug-in swing-arm sconces sit just above the headboard's two corners, a floor lamp stands on the west wall between the closet door and the window, and your BÖJA, Mika and PELARBOJ lamps sit on the tall chest, the nightstand and the KALLAX. Bench keeps its place at the foot. Tightest walkway is 22 in.", [
    ["Bed", "bed", 38, 78, 66, 86, 24, 0, "S"], [BENCH, "ottoman", 39, 62, 46, 16, 18],
    ["PAX wardrobe 39 3/8, tall", "wardrobe", 0, 0, 39.375, 22.875, 93.125], ["KALLAX 1x4 shoe tower", "shoe", 39.375, 0, 15.375, 16.5, 57.875],
    ["KULLEN 5-drawer chest", "dresser", 113.25, 48, 15.75, 27.5, 44.125], ["KULLEN 3-drawer chest", "dresser", 0, 136.5, 15.75, 27.5, 28.375], ["MALM 2-drawer nightstand", "nightstand", 110.125, 148.25, 18.875, 15.75, 21.625],
    ["Wall shelf over bed", "other", 49, 153.75, 43.25, 10.25, 2, 60], ["Hook rail", "other", 0, 46.5, 3.5, 18.875, 5.5, 62],
    ["Rug 60 x 96", "rug", 14, 48, 96, 60, 0.5], ["Snowboard wall rack", "board", 0, 66, 8, 12, 63, 16], ["Snowboard boots on a tray", "boots", 0, 65, 15, 14, 12],
    ["Floor lamp", "lamp", 1, 119, 12, 12, 64], ["Plug-in swing-arm sconce", "sconce", 38, 160, 6, 4, 12, 46], ["Plug-in swing-arm sconce", "sconce", 98, 160, 6, 4, 12, 46],
    ["BÖJA table lamp (yours)", "lamp", 116, 60, 9.75, 9.75, 9.5, 44.125], ["Mika cactus lamp (yours)", "lamp", 114, 152, 8, 8, 15, 21.625], ["PELARBOJ glow lamp (yours)", "lamp", 44.75, 6, 4.5, 4.5, 4, 57.875],
    ["Park print", "art", 52, 163, 18, 1, 22, 63], ["Park print", "art", 73, 163, 18, 1, 22, 63], ["Adire wall hanging", "textile", 128, 85, 1, 30, 45, 40], ["Framed topo map", "art", 0, 44, 1, 20, 28, 72], ["Summit photos", "art", 102, 48, 24, 1, 20, 50], ["Summit photo", "art", 40, 0, 14, 1, 20, 66]])
];
// Shareable addresses. /window/ and the others are small pages with their own link preview
// that send people on to /?layout=window, which opens that layout.
const LINKS = { window: "b3", corner: "a1", centred: "a3" };
const linkOf = p => { const slug = Object.keys(LINKS).find(k => LINKS[k] === p.id); return slug ? `/${slug}/` : null; };
function linkedPlan(search) {
  const slug = (/[?&]layout=([\w-]+)/.exec(search) || [])[1];
  return slug && Object.hasOwn(LINKS, slug) ? BUILTIN.find(p => p.id === LINKS[slug]) : null;
}
const WALLS = { N: "North", E: "East", S: "South", W: "West" };
const ENDS = { N: ["W", "E"], E: ["N", "S"], S: ["E", "W"], W: ["S", "N"] };
const CLOCKWISE = { N: "E", E: "S", S: "W", W: "N" };

let state = load();
let selId = null;
let storageOk = true;
let plans = loadPlans();
let armedKey = null, armTimer = null;

function loadPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY) || "[]"); }
  catch (e) { console.warn("Could not read saved plans:", e); storageOk = false; return []; }
}
function savePlans() {
  try { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); }
  catch (e) { console.warn("Could not save plans:", e); storageOk = false; }
}

// Fill in fields added after a layout was saved, so old saves and imports keep working.
function normalize(s) {
  s.room.flush ??= DEFAULT.room.flush;
  s.room.near ??= DEFAULT.room.near;
  if (s.room.H === 96) s.room.H = 111; // first version guessed the ceiling; it measures 111"
  for (const o of s.openings) {
    const d = DEFAULT.openings.find(x => x.id === o.id);
    if (!o.hinge) o.hinge = d ? d.hinge : "none";
    if (!o.swing) o.swing = "in";
    // The first version guessed the closet door at the north end; it is 13" from the window.
    if (o.id === "closet" && o.off === 12) { o.off = 82; o.hinge = "end"; }
  }
  const head = s.items.find(i => i.id === "head"), bed = s.items.find(i => i.id === "bed");
  if (head && bed) {
    s.items = s.items.filter(i => i !== head);
    Object.assign(bed, { headH: head.h, headT: 3, headSide: bed.w >= bed.d ? "N" : "S" });
  }
  for (const it of s.items) {
    if (it.name === "Bench (size assumed)") {
      const long = it.w >= it.d ? "w" : "d", at = long === "w" ? "x" : "y";
      it[at] += (it[long] - 46) / 2; it[long] = 46;
      Object.assign(it, { name: BENCH, kind: "ottoman", color: KIND_COLOR.ottoman });
    }
    it.solid ??= it.h > 1;
    it.headH ??= 0; it.headT ??= 3; it.headSide ??= "S";
  }
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn("Could not read saved layout:", e); }
  return structuredClone(DEFAULT);
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn("Could not save layout:", e); storageOk = false; }
}
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const n = v => +(+v).toFixed(1);
const ftin = v => { const f = Math.floor(v / 12), i = n(v - f * 12); return f + "′" + (i ? " " + i + "″" : ""); };
const sel = () => state.items.find(i => i.id === selId) || null;
const uid = () => "i" + Date.now().toString(36) + Math.floor(Math.random() * 1e4);

/* ---------- geometry ---------- */
const bumpRect = () => { const r = state.room; return { x: r.W - r.bx, y: 0, w: r.bx, d: r.by }; };
const overlap = (a, b) => a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.d - 0.01 && b.y < a.y + a.d - 0.01;
const topOf = it => it.z + Math.max(it.h, it.headH || 0);
function outside(it) { const r = state.room; return it.x < 0 || it.y < 0 || it.x + it.w > r.W || it.y + it.d > r.L; }
// Everything this item is not allowed to overlap: the in-push, and other solid pieces at the same height.
function blockers(it) {
  const out = [];
  const b = bumpRect();
  if (b.w > 0 && b.d > 0 && overlap(it, b)) out.push(b);
  if (it.solid) for (const o of state.items) {
    if (o !== it && o.solid && overlap(it, o) && it.z < topOf(o) && o.z < topOf(it)) out.push(o);
  }
  return out;
}
// Slide along one axis toward a target, stopping flush against whatever is in the way.
function slide(it, axis, target) {
  const old = it[axis], size = axis === "x" ? "w" : "d";
  if (target === old) return;
  it[axis] = target;
  const hit = blockers(it);
  if (!hit.length) return;
  const stops = hit.map(b => target > old ? b[axis] - it[size] : b[axis] + b[size]);
  const stop = target > old ? Math.min(...stops) : Math.max(...stops);
  it[axis] = stop;
  if ((target > old ? stop < old : stop > old) || blockers(it).length) it[axis] = old;
}
function moveTo(it, x, y) {
  const r = state.room;
  slide(it, "x", Math.min(Math.max(x, 0), Math.max(r.W - it.w, 0)));
  slide(it, "y", Math.min(Math.max(y, 0), Math.max(r.L - it.d, 0)));
}
// Put a new piece in the first open spot, scanning from where it was asked to go.
function placeFree(it) {
  if (!blockers(it).length) return;
  const r = state.room, x0 = it.x, y0 = it.y;
  for (let y = 0; y <= r.L - it.d; y += 3) for (let x = 0; x <= r.W - it.w; x += 3) {
    it.x = x; it.y = y;
    if (!blockers(it).length) return;
  }
  it.x = x0; it.y = y0;
}
function clearances(it) {
  const r = state.room;
  const northWall = it.x + it.w > r.W - r.bx ? r.by : 0;
  const eastWall = it.y < r.by ? r.W - r.bx : r.W;
  return { N: it.y - northWall, S: r.L - (it.y + it.d), W: it.x, E: eastWall - (it.x + it.w), northWall, eastWall };
}
// The boxes that make up a piece: its body, plus a headboard strip if it has one.
function parts(it) {
  const out = [{ it, x: it.x, y: it.y, w: it.w, d: it.d, z: it.z, h: it.h, head: false }];
  if (it.headH > 0) {
    const t = Math.min(it.headT, it.headSide === "N" || it.headSide === "S" ? it.d : it.w);
    const p = { it, x: it.x, y: it.y, w: it.w, d: it.d, z: it.z, h: it.headH, head: true };
    if (it.headSide === "N") p.d = t;
    if (it.headSide === "S") { p.y = it.y + it.d - t; p.d = t; }
    if (it.headSide === "W") p.w = t;
    if (it.headSide === "E") { p.x = it.x + it.w - t; p.w = t; }
    out.push(p);
  }
  return out;
}
// Wall segment an opening sits on, plus the unit normal pointing into the room.
function opSeg(o) {
  const { W, L, bx, by } = state.room, mid = o.off + o.w / 2;
  if (o.wall === "N" || o.wall === "S") {
    const y = o.wall === "S" ? L : (mid > W - bx ? by : 0);
    return { x1: o.off, y1: y, x2: o.off + o.w, y2: y, nx: 0, ny: o.wall === "S" ? -1 : 1 };
  }
  const x = o.wall === "W" ? 0 : (mid < by ? W - bx : W);
  return { x1: x, y1: o.off, x2: x, y2: o.off + o.w, nx: o.wall === "W" ? 1 : -1, ny: 0 };
}
// Hinge point, closed-leaf tip and fully open (90 degree) tip of a swinging door.
function swingGeom(o) {
  if (!o.hinge || o.hinge === "none") return null;
  const s = opSeg(o), dir = o.swing === "out" ? -1 : 1;
  const [hx, hy, fx, fy] = o.hinge === "start" ? [s.x1, s.y1, s.x2, s.y2] : [s.x2, s.y2, s.x1, s.y1];
  return { hx, hy, fx, fy, ox: hx + s.nx * dir * o.w, oy: hy + s.ny * dir * o.w, r: o.w, inward: dir === 1 };
}
// True when an item sits inside the quarter circle a door sweeps through.
// True when a box overlaps the quarter circle a hinged door sweeps through.
function inQuarter(it, g) {
  const qx0 = Math.min(g.hx, g.fx, g.ox), qx1 = Math.max(g.hx, g.fx, g.ox);
  const qy0 = Math.min(g.hy, g.fy, g.oy), qy1 = Math.max(g.hy, g.fy, g.oy);
  const x0 = Math.max(it.x, qx0), x1 = Math.min(it.x + it.w, qx1);
  const y0 = Math.max(it.y, qy0), y1 = Math.min(it.y + it.d, qy1);
  if (x0 >= x1 || y0 >= y1) return false;
  const px = Math.min(Math.max(g.hx, x0), x1), py = Math.min(Math.max(g.hy, y0), y1);
  return Math.hypot(px - g.hx, py - g.hy) < g.r - 0.01;
}
// True when an item sits where a room door swings.
function inSwing(it) {
  return it.solid && state.openings.some(o => {
    const g = swingGeom(o);
    return g && g.inward && it.z < o.sill + o.h && inQuarter(it, g);
  });
}
// A wardrobe has a hinged door for about every 20 in of front, in pairs hinged on their outer
// edges; each sweeps a quarter circle as wide as the door. Same shape as swingGeom's result.
function wardrobeSwings(w) {
  if (kindOf(w) !== "wardrobe" || /sliding|nordkisa/i.test(w.name)) return [];
  const face = frontDir(w), across = face === "N" || face === "S" ? w.w : w.d;
  const doors = Math.max(1, Math.round(across / 20)), dw = across / doors;
  // where the front edge starts on the viewer's left, which way it runs, and which way is out
  const [x0, y0, ux, uy, nx, ny] = {
    S: [w.x, w.y + w.d, 1, 0, 0, 1], N: [w.x + w.w, w.y, -1, 0, 0, -1],
    E: [w.x + w.w, w.y + w.d, 0, -1, 1, 0], W: [w.x, w.y, 0, 1, -1, 0]
  }[face];
  const at = t => [x0 + ux * t, y0 + uy * t];
  return [...Array(doors)].map((_, i) => {
    const [hx, hy] = at(i % 2 ? (i + 1) * dw : i * dw), [fx, fy] = at(i % 2 ? i * dw : (i + 1) * dw);
    return { hx, hy, fx, fy, ox: hx + nx * dw, oy: hy + ny * dw, r: dw, inward: true };
  });
}
// True when an item stands where another piece's wardrobe doors open.
function inWardrobeSwing(it) {
  return it.solid && state.items.some(w => w !== it && it.z < w.z + w.h && wardrobeSwings(w).some(g => inQuarter(it, g)));
}
const isBad = it => outside(it) || blockers(it).length > 0 || inSwing(it) || inWardrobeSwing(it);

/* ---------- light: an estimate of how bright each spot is with only the lamps on ---------- */
// Lumens per light and the share its shade sends downward. Every lamp with a socket takes Femi's
// Tapo L535E smart bulb (1100 lm, E26, 2500-6500K); the PELARBOJ has its own built-in LED.
function lightSpec(it) {
  const nm = it.name.toLowerCase();
  if (it.lm > 0) return { lm: it.lm, down: it.down ?? 0.5 };
  if (/pelarboj/.test(nm)) return { lm: 25, down: 0.5 };
  if (kindOf(it) === "sconce") return { lm: 1100, down: 0.8 };
  if (it.z === 0 && it.h >= 40) return { lm: 1100, down: 0.45 };
  return { lm: 1100, down: 0.5 };
}
const LIGHT_STEP = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// Where each bulb sits: inside the shade, or just off the wall for a sconce.
function lightSources(items) {
  return items.filter(it => kindOf(it) === "lamp" || kindOf(it) === "sconce").map(it => {
    const sconce = kindOf(it) === "sconce", [dx, dy] = sconce ? LIGHT_STEP[frontDir(it)] : [0, 0];
    return { it, x: it.x + it.w / 2 + dx * 4, y: it.y + it.d / 2 + dy * 4,
      z: sconce ? it.z + it.h * 0.7 : it.z + it.h - Math.min(it.h * 0.3, 10) / 2, ...lightSpec(it) };
  });
}
const LUM_EFF = 0.85, REFLECT = 0.5, M_PER_IN = 0.0254;
// Light straight from one bulb onto a face-up spot, in lux; nothing gets through a solid box.
function directLux(src, px, py, pz, boxes) {
  const dz = src.z - pz;
  if (dz <= 0) return 0;
  const dx = px - src.x, dy = py - src.y, d2 = (dx * dx + dy * dy + dz * dz) * M_PER_IN * M_PER_IN;
  for (const b of boxes) if (segHitsBox(src.x, src.y, src.z, px, py, pz, b)) return 0;
  return LUM_EFF * src.lm * src.down / (2 * Math.PI) * (dz * M_PER_IN / Math.sqrt(d2)) / d2;
}
function segHitsBox(x0, y0, z0, x1, y1, z1, b) {
  let lo = 0.001, hi = 0.999;
  for (const [a, e, mn, mx] of [[x0, x1 - x0, b.x, b.x + b.w], [y0, y1 - y0, b.y, b.y + b.d], [z0, z1 - z0, b.z, b.z + b.h]]) {
    if (Math.abs(e) < 1e-9) { if (a <= mn || a >= mx) return false; continue; }
    let t0 = (mn - a) / e, t1 = (mx - a) / e;
    if (t0 > t1) [t0, t1] = [t1, t0];
    lo = Math.max(lo, t0); hi = Math.min(hi, t1);
    if (lo >= hi) return false;
  }
  return true;
}
// Light bounced off walls, ceiling and floor, spread evenly: the room as an integrating sphere.
function bounceLux(sources) {
  const { W, L, H } = state.room, area = (2 * W * L + 2 * (W + L) * H) * M_PER_IN * M_PER_IN;
  return LUM_EFF * sources.reduce((s, l) => s + l.lm, 0) * REFLECT / (area * (1 - REFLECT));
}
function lightBoxes(items) {
  const b = bumpRect(), out = b.w > 0 && b.d > 0 ? [{ ...b, z: 0, h: state.room.H }] : [];
  for (const it of items) if (it.solid && kindOf(it) !== "lamp" && kindOf(it) !== "sconce") out.push(...parts(it));
  return out;
}
// Lamps-only lux, dark navy at 10 lux or less to pale yellow at 1000.
const LUX_STOPS = ["#1f2a44", "#6b4f7a", "#d9825b", "#ffd36b", "#fff6d6"];
function luxColor(v) {
  const t = Math.min(Math.max(Math.log10(Math.max(v, 1) / 10) / 2, 0), 1) * (LUX_STOPS.length - 1), i = Math.min(Math.floor(t), LUX_STOPS.length - 2), f = t - i;
  const mix = (a, b) => Math.round(parseInt(a, 16) * (1 - f) + parseInt(b, 16) * f).toString(16).padStart(2, "0");
  const a = LUX_STOPS[i], b = LUX_STOPS[i + 1];
  return "#" + [1, 3, 5].map(k => mix(a.slice(k, k + 2), b.slice(k, k + 2))).join("");
}
// RGB of a white bulb at a colour temperature, in kelvin (Tanner Helland's fit to blackbody colours).
function kelvinRGB(k) {
  const t = k / 100, c = v => Math.round(Math.min(Math.max(v, 0), 255));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [c(r), c(g), c(b)];
}
const READ_LUX = 300, ROOM_LUX = 50;
// Lux over a face-up plane (default 30 in, about where a book or a folded shirt is), the bed's
// reading spots, and the room's average and darkest tenth. Spots under furniture taller than the
// plane, or in the in-push, are left blank.
function lightReport(items, pz = 30, step = 3) {
  const { W, L } = state.room, src = lightSources(items), boxes = lightBoxes(items), bounce = bounceLux(src);
  const at = (x, y, z) => bounce + src.reduce((s, l) => s + directLux(l, x, y, z, boxes), 0);
  const cols = Math.floor(W / step), rows = Math.floor(L / step), vals = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c + 0.5) * step, y = (r + 0.5) * step;
    const covered = boxes.some(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.d && b.z <= pz && b.z + b.h > pz);
    vals.push(covered ? null : at(x, y, pz));
  }
  const open = vals.filter(v => v !== null).sort((a, b) => a - b);
  const bed = items.find(i => kindOf(i) === "bed"), reading = [];
  if (bed) {
    const prev = state.items; state.items = items;
    const c = clearances(bed), head = bed.headSide, along = head === "N" || head === "S";
    state.items = prev;
    const into = { N: 1, S: -1, W: 1, E: -1 }[head], line = { N: bed.y, S: bed.y + bed.d, W: bed.x, E: bed.x + bed.w }[head];
    const sides = along ? [["W", bed.x, 1], ["E", bed.x + bed.w, -1]] : [["N", bed.y, 1], ["S", bed.y + bed.d, -1]];
    for (const [side, edge, inward] of sides) if (c[side] > state.room.flush) {
      const a = edge + inward * 10, b = line + into * 14, z = bed.h + 8;
      const [x, y] = along ? [a, b] : [b, a];
      reading.push({ side, x, y, z, lux: at(x, y, z) });
    }
  }
  return { map: { step, cols, rows, vals, pz }, reading, bounce,
    avg: open.reduce((s, v) => s + v, 0) / Math.max(open.length, 1), p10: open[Math.floor(open.length * 0.1)] ?? 0 };
}
// Position along a wall as seen from inside the room, left to right.
function alongWall(wall, start, size) {
  const r = state.room;
  if (wall === "N" || wall === "E") return start;
  return (wall === "S" ? r.W : r.L) - start - size;
}
// Gap between a box and the wall being looked at (the in-push counts as wall).
function wallGap(wall, p) {
  const c = clearances(p);
  return Math.max(c[wall], 0);
}
function tier(gap) { return gap <= state.room.flush ? "flush" : gap <= state.room.near ? "near" : "far"; }

// Pieces saved before "kind" existed are recognised by name.
function kindOf(it) {
  if (it.kind) return it.kind;
  const nm = it.name.toLowerCase();
  const table = [["board", /snowboard(?! boot)/], ["boots", /boot/], ["ladder", /ladder/], ["beanbag", /bean ?bag/], ["nightstand", /night|bedside/], ["bed", /\bbed\b/], ["ottoman", /ottoman|storage bench|upholstered/], ["bench", /bench/], ["shoe", /shoe/], ["wardrobe", /wardrobe|armoire|pax/],
    ["rack", /rack|rail/], ["dresser", /dresser|drawer|chest/], ["shelf", /shel|book/], ["chair", /chair|sofa/], ["rug", /rug|carpet/],
    ["mirror", /mirror/], ["sconce", /sconce/], ["lamp", /lamp/], ["plant", /plant/],
    ["textile", /hanging|tapestry|textile/], ["pegs", /peg/], ["art", /art|print|photo|poster|map|frame|panorama/]];
  const hit = table.find(([, re]) => re.test(nm));
  return hit ? hit[0] : "other";
}

/* ---------- sidebar ---------- */
function drawList() {
  $("#list").innerHTML = state.items.map(it =>
    `<li data-id="${it.id}" class="${it.id === selId ? "sel" : ""}"><span class="sw" style="background:${esc(it.color)}"></span>${esc(it.name)}<small>${n(it.w)}×${n(it.d)}×${n(it.h)}</small></li>`).join("");
}
function num(label, key, v, attrs = "") {
  return `<label>${label}<input type="number" step="0.5" data-k="${key}" value="${n(v)}" ${attrs}></label>`;
}
function buildSelForm() {
  const it = sel(), el = $("#selCard");
  if (!it) { el.innerHTML = `<h2>Selected</h2><p class="hint" style="margin:0">Click a piece of furniture to edit it, or add one below.</p>`; return; }
  el.innerHTML = `<h2>Selected</h2>
    <div class="row"><label>Name<input data-k="name" value="${esc(it.name)}"></label>
      <label>Looks like<select data-k="kind">${Object.keys(KINDS).map(k => `<option value="${k}"${k === kindOf(it) ? " selected" : ""}>${KINDS[k]}</option>`).join("")}</select></label>
      <label>Colour<input type="color" data-k="color" value="${esc(it.color)}"></label></div>
    <div class="row">${num("Width (E–W)", "w", it.w, 'min="0.5"')}${num("Depth (N–S)", "d", it.d, 'min="0.5"')}${num("Height", "h", it.h, 'min="0"')}</div>
    <div class="row">${num("From west wall", "x", it.x)}${num("From north wall", "y", it.y)}${num("Off the floor", "z", it.z, 'min="0"')}</div>
    <div class="row">${num("Headboard height", "headH", it.headH, 'min="0"')}${num("Headboard thick", "headT", it.headT, 'min="0.5"')}
      <label>Headboard end<select data-k="headSide">${Object.keys(WALLS).map(w => `<option value="${w}"${w === it.headSide ? " selected" : ""}>${WALLS[w]}</option>`).join("")}</select></label></div>
    <div class="row two"><label>Front faces (3D view)<select data-k="face"><option value="auto">Away from the nearest wall</option>${Object.keys(WALLS).map(w => `<option value="${w}"${w === it.face ? " selected" : ""}>${WALLS[w]}</option>`).join("")}</select></label>
      <label class="check" style="margin:0;align-self:end"><input type="checkbox" data-k="solid"${it.solid ? " checked" : ""}>Solid (untick for rugs)</label></div>
    <div class="btns"><button data-act="rot">Rotate 90°</button><button data-act="dup">Duplicate</button><button data-act="del">Delete</button></div>
    <p class="hint">Headboard height 0 means no headboard. Its thickness is part of the depth.</p>`;
}
function buildRoomForm() {
  const r = state.room;
  let h = `<div class="row">${num("Width (E–W)", "room.W", r.W)}${num("Length (N–S)", "room.L", r.L)}${num("Ceiling", "room.H", r.H)}</div>
    <div class="row two">${num("In-push width (E–W)", "room.bx", r.bx)}${num("In-push length (N–S)", "room.by", r.by)}</div>
    <div class="row two">${num("Counts as on the wall within", "room.flush", r.flush, 'min="0"')}${num("Counts as close within", "room.near", r.near, 'min="0"')}</div>`;
  state.openings.forEach((o, i) => {
    const ns = o.wall === "N" || o.wall === "S";
    h += `<div class="opbox"><div class="row two"><label>Name<input data-k="openings.${i}.name" value="${esc(o.name)}"></label>
      <label>Wall<select data-k="openings.${i}.wall">${Object.keys(WALLS).map(w => `<option value="${w}"${w === o.wall ? " selected" : ""}>${WALLS[w]}</option>`).join("")}</select></label></div>
      <div class="row two">${num("Start, from " + (ns ? "west" : "north") + " end", `openings.${i}.off`, o.off)}${num("Width", `openings.${i}.w`, o.w)}</div>
      <div class="row two">${num("Sill height", `openings.${i}.sill`, o.sill)}${num("Height", `openings.${i}.h`, o.h)}</div>
      <div class="row two"><label>Hinge<select data-k="openings.${i}.hinge">${[["none", "No swing"], ["start", (ns ? "West" : "North") + " side"], ["end", (ns ? "East" : "South") + " side"]].map(([v, t]) => `<option value="${v}"${v === o.hinge ? " selected" : ""}>${t}</option>`).join("")}</select></label>
      <label>Opens<select data-k="openings.${i}.swing"><option value="in"${o.swing !== "out" ? " selected" : ""}>Into the room</option><option value="out"${o.swing === "out" ? " selected" : ""}>Out of the room</option></select></label></div></div>`;
  });
  $("#roomForm").innerHTML = h;
}

const currentPlan = () => [...BUILTIN, ...plans].find(p => p.id === state.planId) || null;
const isSaved = p => plans.includes(p);
function isDirty() { const p = currentPlan(); return JSON.stringify(p ? p.items : DEFAULT.items) !== JSON.stringify(state.items); }
function drawPlans() {
  const cur = currentPlan(), dirty = isDirty();
  const row = p => {
    const armedLoad = armedKey === "load:" + p.id, armedDel = armedKey === "del:" + p.id;
    const note = armedLoad ? "click again, unsaved changes go" : armedDel ? "click again to delete"
      : p === cur ? (dirty ? "open, edited" : "open") : isSaved(p) ? p.items.length + " pieces" : p.note;
    return `<li data-plan="${p.id}" class="${p === cur ? "cur" : ""}${armedLoad || armedDel ? " armed" : ""}"><span class="pl"><span>${esc(p.name)}</span><small>${note}</small></span>${isSaved(p) ? `<button class="x" data-del="${p.id}" title="Delete this plan">✕</button>` : ""}${linkOf(p) ? `<button class="link" data-copy="${linkOf(p)}" title="Copy a link that opens this layout" aria-label="Copy link"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" class="i-link"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 0 1 4.5 9l1-1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" class="i-done"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ""}</li>`;
  };
  $("#plansBox").innerHTML = `<div class="sub">Ready-made</div><ul class="plans">${BUILTIN.map(row).join("")}</ul>
    <div class="sub">Yours</div><ul class="plans">${plans.length ? plans.map(row).join("") : `<li style="cursor:default;color:var(--muted)">None saved yet</li>`}</ul>`;
  const up = $("#updatePlan");
  up.hidden = !(cur && isSaved(cur) && dirty);
  if (!up.hidden) up.textContent = `Save changes to “${cur.name}”`;
  $("#planWhy").textContent = cur && cur.why ? cur.why : "";
  $("#planHint").textContent = storageOk ? "Click a plan to open it." : "This browser is blocking storage, so plans will not survive closing the tab. Use Export JSON to keep them.";
}
// Destructive clicks need a second click within four seconds.
function confirmTwice(key, fn) {
  clearTimeout(armTimer);
  if (armedKey === key) { armedKey = null; fn(); return; }
  armedKey = key;
  armTimer = setTimeout(() => { armedKey = null; drawPlans(); }, 4000);
  drawPlans();
}
function openPlan(p) {
  state.items = normalize({ room: { ...state.room }, openings: [], items: structuredClone(p.items) }).items;
  state.planId = p.id; selId = null; buildSelForm(); draw();
}
// Each page sets these: onDraw repaints its view, nudge turns an arrow key into a move across the floor,
// onPrint gets the page ready before the print dialog opens.
let onDraw = () => {};
let onPrint = async () => {};
let nudge = (dx, dy) => [dx, dy];
function refresh() { onDraw(); drawList(); drawPlans(); }
function draw() { refresh(); save(); }
function select(id) { selId = id; buildSelForm(); draw(); }

/* ---------- sidebar wiring ---------- */
const SIDEBAR = `<div class="card" id="selCard"></div>
<details class="card" data-section="furniture" open>
  <summary>Furniture</summary>
  <ul id="list"></ul>
  <div class="row two" style="margin-top:10px">
    <select id="preset"></select>
    <button id="add">Add</button>
  </div>
</details>
<details class="card" data-section="plans" open>
  <summary>Plans</summary>
  <div id="plansBox"></div>
  <div class="row two"><input id="planName" placeholder="Name this plan"><button id="savePlan">Save as new plan</button></div>
  <button id="updatePlan" hidden></button>
  <p class="hint" id="planWhy" style="color:var(--ink)"></p>
  <p class="hint" id="planHint"></p>
</details>
<details class="card" data-section="room">
  <summary>Room, doors and window</summary>
  <div id="roomForm"></div>
</details>
<details class="card" data-section="save" open>
  <summary>Save</summary>
  <div class="btns">
    <button id="export">Export JSON</button>
    <button id="import">Import JSON</button>
    <button id="print">Print</button>
    <button id="reset">Reset to measured room</button>
  </div>
  <input type="file" id="file" accept="application/json" hidden>
  <p class="hint">Your work and saved plans stay in this browser. Export writes everything, plans included, to one JSON file.</p>
</details>
<details class="card" data-section="keys" open>
  <summary>Keys and rules</summary>
  <p class="hint" id="keysHint" style="margin:0">Arrow keys nudge 1″ (Shift = 6″), R rotates, Delete removes, Esc deselects. Solid pieces stop at walls and at each other. A red dashed outline means a piece blocks a door swing, a room door's or a wardrobe's, or overlaps something.</p>
</details>`;
// Which sidebar sections this browser has opened or closed, by data-section name.
const SECTIONS_KEY = "bedroom-planner-sections-v1";
const OPPOSITE = { N: "S", E: "W", S: "N", W: "E" };
// Which way a piece's front points. Beds face away from the headboard; everything else faces
// away from the wall it is nearest, measured across its short side, unless a facing was chosen.
function frontDir(it) {
  if (it.headH > 0) return OPPOSITE[it.headSide];
  if (it.face && it.face !== "auto") return it.face;
  const c = clearances(it), ratio = it.w / it.d;
  const sides = ratio > 1.15 ? ["S", "N"] : ratio < 0.87 ? ["E", "W"] : ["S", "E", "N", "W"];
  return sides.reduce((a, b) => (c[b] > c[a] + 0.01 ? b : a));
}
function rotateItem(it) {
  const facing = it.headH > 0 ? null : frontDir(it), cx = it.x + it.w / 2, cy = it.y + it.d / 2, r = state.room;
  [it.w, it.d] = [it.d, it.w];
  it.x = Math.min(Math.max(Math.round(cx - it.w / 2), 0), Math.max(r.W - it.w, 0));
  it.y = Math.min(Math.max(Math.round(cy - it.d / 2), 0), Math.max(r.L - it.d, 0));
  it.headSide = CLOCKWISE[it.headSide];
  if (facing) it.face = CLOCKWISE[facing];
  placeFree(it);
}
function act(a) {
  const it = sel();
  if (!it) return;
  if (a === "rot") rotateItem(it);
  if (a === "dup") { const c = { ...it, id: uid(), name: it.name + " copy", x: it.x + 6, y: it.y + 6 }; state.items.push(c); placeFree(c); selId = c.id; }
  if (a === "del") { state.items = state.items.filter(i => i !== it); selId = null; }
  buildSelForm(); draw();
}
function initPlanner() {
  $("#side").innerHTML = SIDEBAR;
  let sections = {};
  try { sections = JSON.parse(localStorage.getItem(SECTIONS_KEY)) || {}; } catch { /* no storage: every section starts as shipped */ }
  for (const d of document.querySelectorAll("#side details[data-section]")) {
    if (Object.hasOwn(sections, d.dataset.section)) d.open = sections[d.dataset.section];
    d.addEventListener("toggle", () => {
      sections[d.dataset.section] = d.open;
      try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections)); } catch { /* still toggles, just not remembered */ }
    });
  }
  $("#list").addEventListener("click", e => { const li = e.target.closest("li"); if (li) select(li.dataset.id); });
  $("#selCard").addEventListener("input", e => {
    const it = sel(), k = e.target.dataset.k;
    if (!it || !k) return;
    if (e.target.type === "checkbox") it[k] = e.target.checked;
    else if (e.target.type === "number") { const v = parseFloat(e.target.value); if (Number.isNaN(v)) return; it[k] = v; }
    else it[k] = e.target.value;
    draw();
  });
  $("#selCard").addEventListener("click", e => { if (e.target.dataset.act) act(e.target.dataset.act); });
  $("#roomForm").addEventListener("input", e => {
    const k = e.target.dataset.k;
    if (!k) return;
    const path = k.split("."), last = path.pop();
    const obj = path.reduce((o, p) => o[p], state);
    if (e.target.type === "number") { const v = parseFloat(e.target.value); if (Number.isNaN(v)) return; obj[last] = v; }
    else obj[last] = e.target.value;
    if (last === "wall") buildRoomForm();
    draw();
  });

  $("#preset").innerHTML = PRESETS.map((p, i) => `<option value="${i}">${p[0]} (${p[1]}×${p[2]}×${p[3]})</option>`).join("");
  $("#add").addEventListener("click", () => {
    const [name, w, d, h, z, color, solid, kind] = PRESETS[+$("#preset").value], r = state.room;
    const it = { id: uid(), name, kind, w, d, h, z, color, solid, headH: 0, headT: 3, headSide: "S",
      x: Math.max(Math.round((r.W - r.bx - w) / 2), 0), y: Math.round(r.by + 6) };
    state.items.push(it); placeFree(it); select(it.id);
  });
  document.addEventListener("keydown", e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const it = sel();
    if (!it) return;
    const step = e.shiftKey ? 6 : 1;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) { const [dx, dy] = nudge(...moves[e.key]); moveTo(it, it.x + dx, it.y + dy); e.preventDefault(); buildSelForm(); draw(); }
    else if (e.key === "r" || e.key === "R") act("rot");
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); act("del"); }
    else if (e.key === "Escape") select(null);
  });
  // The 2D and 3D pages share one saved layout, so an edit in one shows up in the other.
  window.addEventListener("storage", e => {
    if (e.key === KEY && e.newValue) {
      try { state = normalize(JSON.parse(e.newValue)); }
      catch (err) { console.warn("Could not read the layout changed in another tab:", err); return; }
      if (!sel()) selId = null;
      buildRoomForm(); buildSelForm(); refresh();
    } else if (e.key === PLANS_KEY) { plans = loadPlans(); drawPlans(); }
  });

  $("#export").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...state, plans }, null, 2)], { type: "application/json" }));
    a.download = "bedroom-layout.json"; a.click(); URL.revokeObjectURL(a.href);
  });
  $("#import").addEventListener("click", () => $("#file").click());
  $("#file").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!s.room || !Array.isArray(s.items) || !Array.isArray(s.openings)) throw new Error("not a bedroom layout file");
      for (const p of Array.isArray(s.plans) ? s.plans : []) {
        if (!p.id || !Array.isArray(p.items)) throw new Error("a saved plan in the file is malformed");
        plans = plans.filter(x => x.id !== p.id).concat(p);
      }
      delete s.plans; savePlans();
      state = normalize(s); selId = null; buildRoomForm(); buildSelForm(); draw();
    } catch (err) { alert("Could not import that file: " + err.message); }
    e.target.value = "";
  });
  $("#plansBox").addEventListener("click", e => {
    const b = e.target.closest("[data-copy]");
    if (b) {
      const url = location.origin + b.dataset.copy;
      navigator.clipboard.writeText(url).then(() => { b.classList.add("done"); b.title = "Copied"; setTimeout(() => { b.classList.remove("done"); b.title = "Copy a link that opens this layout"; }, 1500); },
        () => window.prompt("Copy this link", url));
      return;
    }
    const del = e.target.dataset.del;
    if (del) {
      confirmTwice("del:" + del, () => { plans = plans.filter(p => p.id !== del); savePlans(); draw(); });
      return;
    }
    const li = e.target.closest("li[data-plan]");
    if (!li) return;
    const p = [...BUILTIN, ...plans].find(x => x.id === li.dataset.plan);
    if (isDirty()) confirmTwice("load:" + p.id, () => openPlan(p)); else openPlan(p);
  });
  $("#savePlan").addEventListener("click", () => {
    const name = $("#planName").value.trim() || "Plan " + (plans.length + 1);
    const p = { id: uid(), name, items: structuredClone(state.items) };
    plans.push(p); state.planId = p.id; $("#planName").value = ""; savePlans(); draw();
  });
  $("#planName").addEventListener("keydown", e => { if (e.key === "Enter") $("#savePlan").click(); });
  $("#updatePlan").addEventListener("click", () => {
    const p = currentPlan();
    if (!p || !isSaved(p)) return;
    p.items = structuredClone(state.items); savePlans(); draw();
  });
  $("#print").addEventListener("click", async () => { await onPrint(); window.print(); });
  // Two clicks instead of a browser confirm box, which some browsers suppress on local files.
  const resetBtn = $("#reset");
  let resetTimer = null;
  function disarmReset() { clearTimeout(resetTimer); resetBtn.classList.remove("armed"); resetBtn.textContent = "Reset to measured room"; }
  resetBtn.addEventListener("click", () => {
    if (!resetBtn.classList.contains("armed")) {
      resetBtn.classList.add("armed"); resetBtn.textContent = "Click again to discard this layout";
      resetTimer = setTimeout(disarmReset, 4000);
      return;
    }
    disarmReset();
    state = structuredClone(DEFAULT); selId = null; buildRoomForm(); buildSelForm(); draw();
  });
  // A layout link opens that layout once, then leaves the address bare so a reload keeps your edits.
  // A first visit opens the first layout rather than an empty room.
  const linked = linkedPlan(location.search);
  if (linked) { openPlan(linked); history.replaceState(null, "", location.pathname + location.hash); }
  else if (!state.planId && !isDirty()) openPlan(BUILTIN[0]);
  buildRoomForm(); buildSelForm(); draw();
}
