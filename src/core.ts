// Shared by plan.html (2D) and index.html (3D): the room from its file, the ready-made layouts,
// saved state, the collision rules and the sidebar. Each page supplies only its own view.
import ROOM from "./room.ts";
import { among, HINGES, ITEM_KINDS, SWINGS, WALL_SIDES } from "./types.ts";
import type { Item, ItemSpec, Kind, Opening, Plan, Print, Rect, State, Theme, Wall } from "./types.ts";
export const KEY = "bedroom-planner-v1";
export const PLANS_KEY = "bedroom-planner-plans-v1";
// An upholstered storage bench, 46 x 16 and 18 in high.
export const BENCH = "Tufted storage bench";
// name, width, depth, height, off floor, colour, solid, kind
export type Preset = [name: string, w: number, d: number, h: number, z: number, color: string, solid: boolean, kind: Kind];
export const PRESETS: Preset[] = [
  ["Dresser", 36, 18, 34, 0, "#b98b5e", true, "dresser"], ["Tall drawers", 28, 19, 48, 0, "#b98b5e", true, "dresser"],
  ["Wardrobe", 39, 23, 79, 0, "#a98f6f", true, "wardrobe"], ["Clothes rack", 48, 18, 65, 0, "#9aa3ad", true, "rack"],
  ["Shoe cabinet", 31, 9, 40, 0, "#c7b08e", true, "shoe"], ["Bench", 48, 16, 18, 0, "#a9825a", true, "bench"], [BENCH, 46, 16, 18, 0, "#4a4d55", true, "ottoman"],
  ["Nightstand", 20, 16, 24, 0, "#d1b48c", true, "nightstand"], ["Bookshelf", 32, 12, 72, 0, "#9c7b55", true, "shelf"],
  ["Armchair", 32, 34, 32, 0, "#7fae8f", true, "chair"], ["Rug", 96, 60, 0.5, 0, "#d9a5a0", false, "rug"],
  ["Wall shelf", 36, 8, 2, 60, "#a8a29e", true, "other"], ["Mirror", 24, 1, 60, 12, "#9fc5d8", true, "mirror"],
  ["Floor lamp", 12, 12, 64, 0, "#e3c66b", true, "lamp"], ["Table lamp", 10, 10, 18, 0, "#e3c66b", true, "lamp"], ["Plug-in sconce", 6, 4, 12, 46, "#e3c66b", true, "sconce"],
  ["Ladder shelf", 24, 16, 72, 0, "#b08a62", true, "ladder"], ["Bean bag", 36, 34, 26, 0, "#b5653f", true, "beanbag"],
  ["Snowboard wall rack", 12, 8, 63, 16, "#2f5d7c", true, "board"], ["Snowboard boots on a tray", 14, 15, 12, 0, "#2b2d33", true, "boots"],
  ["Framed art", 24, 1, 30, 50, "#efe4cc", true, "art"], ["Wall hanging", 30, 1, 45, 40, "#3f5f9e", true, "textile"], ["Peg rail with gear", 36, 2, 20, 50, "#c9b592", true, "pegs"],
  ["Custom box", 24, 24, 24, 0, "#bdbdbd", true, "other"]
];
export const KINDS: Record<Kind, string> = { bed: "Bed", bench: "Bench", ottoman: "Upholstered storage bench", dresser: "Dresser / drawers", wardrobe: "Wardrobe", rack: "Clothes rack", shoe: "Shoe storage",
  nightstand: "Nightstand", shelf: "Shelving", ladder: "Ladder shelf", beanbag: "Bean bag", board: "Snowboard on a wall rack", boots: "Snowboard boots", chair: "Chair", rug: "Rug", mirror: "Mirror",
  art: "Framed art", textile: "Wall hanging", pegs: "Peg rail with gear", lamp: "Lamp", sconce: "Wall sconce", plant: "Plant", other: "Plain box" };
// The room's palette: wall and floor colours and the bed's textiles, from the room file.
export const THEME: Theme = ROOM.theme;
// Starting points that ship with the page.
export const KIND_COLOR: Record<Kind, string> = { bed: "#a9ae95", bench: "#a9825a", ottoman: "#4a4d55", dresser: "#565d49", wardrobe: "#68705c", rack: "#9aa3ad", shoe: "#2a2421",
  nightstand: "#8b4a24", shelf: "#9c7b55", ladder: "#b08a62", beanbag: "#b5653f", board: "#2f5d7c", boots: "#2b2d33", chair: "#7fae8f", rug: "#c8b48a", mirror: "#9fc5d8", lamp: "#e3c66b", sconce: "#e3c66b", plant: "#7fae8f",
  art: "#efe4cc", textile: "#3f5f9e", pegs: "#c9b592", other: "#bdbdbd" };
// Photographs for the frames, described in the room file; each one's picture is public/prints/<key>.jpg.
export const PRINTS: Record<string, Print> = Object.fromEntries(Object.entries(ROOM.prints).map(([key, p]) => [key, { ...p, file: `prints/${key}.jpg` }]));
// The panes of a frame pw by ph: one photo fills it; several sit in a grid of up to three across.
// x is each pane's centre from the frame's middle, y its bottom edge up from the frame's bottom.
export interface Pane { key: string; w: number; h: number; x: number; y: number }
export function photoPanes(photos: string[], pw: number, ph: number): Pane[] {
  const cols = Math.min(3, photos.length), rows = Math.ceil(photos.length / cols), gap = photos.length > 1 ? Math.min(pw, ph) * 0.04 : 0;
  const cw = (pw - gap * (cols - 1)) / cols, ch = (ph - gap * (rows - 1)) / rows;
  return photos.map((key, i) => ({ key, w: cw, h: ch, x: -pw / 2 + cw / 2 + (i % cols) * (cw + gap), y: ph - ch - Math.floor(i / cols) * (ch + gap) }));
}
// The ornate gilt moulding every frame wears, for a piece w by h (inches, outer size). From the
// outside in: a gilt lip, a dark cove, a carved band and a bright bead, then a linen liner and the
// picture. inset is each band's distance from the outer edge; rise how far it stands off the wall.
// Mouldings 2 in or wider carry a rosette at each corner, d in from both edges.
export type BandTone = "gilt" | "shadow" | "carved" | "bead";
export interface Band { tone: BandTone; color: string; inset: number; width: number; rise: number }
export interface GiltFrame {
  fw: number; liner: number; linen: string; bands: [lip: Band, shadow: Band, carved: Band, bead: Band];
  corners: { d: number; r: number; rise: number } | null;
  opening: { inset: number; w: number; h: number };
}
const GILT_BANDS: [tone: BandTone, share: number, rise: number, color: string][] = [["gilt", 0.2, 1, "#c9a04a"], ["shadow", 0.16, 0.7, "#6b4d20"], ["carved", 0.44, 1.3, "#d4ad55"], ["bead", 0.2, 0.85, "#e5c46a"]];
export function giltFrame(w: number, h: number): GiltFrame {
  const short = Math.min(w, h), fw = Math.min(4.5, Math.max(1.25, short * 0.12));
  const liner = Math.min(1.75, Math.max(0.4, short * 0.045)), depth = 0.5 + fw / 9;
  let inset = 0;
  const bands = GILT_BANDS.map(([tone, share, rise, color]) => {
    const b: Band = { tone, color, inset, width: fw * share, rise: rise * depth };
    inset += b.width;
    return b;
  }) as GiltFrame["bands"]; // one band per row of GILT_BANDS
  const [, , carved] = bands, m = fw + liner;
  return {
    fw, liner, linen: "#e8dec6", bands,
    corners: fw >= 2 ? { d: carved.inset + carved.width / 2, r: carved.width * 0.65, rise: carved.rise + 0.3 } : null,
    opening: { inset: m, w: w - 2 * m, h: h - 2 * m }
  };
}
// A piece as the room file writes it, filled in from its kind: the kind's colour, solid unless it is
// a rug, and a 46 in headboard on headSide when it names one. Anything else on it, such as photos, is kept.
export function expandItem(spec: ItemSpec, i: number): Item {
  const { id = spec.kind + i, name, kind, x, y, w, d, h, z = 0, headSide, color = KIND_COLOR[kind], ...extra } = spec;
  return { id, name, kind, x, y, w, d, h, z, color, solid: kind !== "rug", headH: headSide ? 46 : 0, headT: 3, headSide: headSide ?? "S", ...extra };
}
export const DEFAULT: State = { planId: null, room: ROOM.room, openings: ROOM.openings, items: ROOM.start.map(expandItem) };
export const BUILTIN: Plan[] = ROOM.layouts.map(({ id, name, note, why, items }) => ({ id, name, note, why, items: items.map(expandItem) }));
// Shareable addresses. /window/ and the others are small pages with their own link preview
// that send people on to /?layout=window, which opens that layout.
export const LINKS: Record<string, string> = Object.fromEntries(ROOM.layouts.flatMap(l => (l.slug ? [[l.slug, l.id]] : [])));
export const linkOf = (p: Plan): string | null => { const slug = Object.keys(LINKS).find(k => LINKS[k] === p.id); return slug ? `/${slug}/` : null; };
export function linkedPlan(search: string): Plan | null {
  const slug = (/[?&]layout=([\w-]+)/.exec(search) || [])[1];
  return slug && Object.hasOwn(LINKS, slug) ? BUILTIN.find(p => p.id === LINKS[slug]) ?? null : null;
}
export const WALLS: Record<Wall, string> = { N: "North", E: "East", S: "South", W: "West" };
export const ENDS: Record<Wall, [Wall, Wall]> = { N: ["W", "E"], E: ["N", "S"], S: ["E", "W"], W: ["S", "N"] };
export const CLOCKWISE: Record<Wall, Wall> = { N: "E", E: "S", S: "W", W: "N" };

export let state = load();
export let selId: string | null = null;
export let storageOk = true;
export let plans: Plan[] = loadPlans();
export let armedKey: string | null = null, armTimer: ReturnType<typeof setTimeout> | undefined;

export function loadPlans(): Plan[] {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY) || "[]"); }
  catch (e) { console.warn("Could not read saved plans:", e); storageOk = false; return []; }
}
export function savePlans() {
  try { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); }
  catch (e) { console.warn("Could not save plans:", e); storageOk = false; }
}

// Fill in fields added after a layout was saved, so old saves and imports keep working.
// Saves and imports are whatever an older version wrote, so any field may be missing.
export function normalize(s: State): State {
  s.room.flush ??= DEFAULT.room.flush;
  s.room.near ??= DEFAULT.room.near;
  for (const o of s.openings) {
    const d = DEFAULT.openings.find(x => x.id === o.id);
    if (!o.hinge) o.hinge = d ? d.hinge : "none";
    if (!o.swing) o.swing = "in";
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
export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn("Could not read saved layout:", e); }
  return structuredClone(DEFAULT);
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn("Could not save layout:", e); storageOk = false; }
}
// The element a selector names; the pages own their markup, so a missing one is a bug.
export const $ = <T extends HTMLElement = HTMLElement>(s: string): T => {
  const el = document.querySelector<T>(s);
  if (!el) throw new Error("No element matches " + s);
  return el;
};
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ESCAPES[c] ?? c);
// An object's keys, typed as the keys it was declared with.
export const keys = <K extends string>(o: Record<K, unknown>): K[] => Object.keys(o) as K[];
export const n = (v: number | string): number => +(+v).toFixed(1);
export const ftin = (v: number): string => { const f = Math.floor(v / 12), i = n(v - f * 12); return f + "′" + (i ? " " + i + "″" : ""); };
export const sel = (): Item | null => state.items.find(i => i.id === selId) || null;
export const uid = () => "i" + Date.now().toString(36) + Math.floor(Math.random() * 1e4);

/* ---------- geometry ---------- */
export const bumpRect = (): Rect => { const r = state.room; return { x: r.W - r.bx, y: 0, w: r.bx, d: r.by }; };
// Round and soft pieces, and rugs, can sit at any angle; hard furniture stays square to the walls.
// A turned piece keeps its own width and depth, and the rules use the wall-aligned box that holds
// it, which for a round piece is barely larger.
export const TURNABLE = new Set<Kind>(["beanbag", "plant", "lamp", "rug"]);
// Anything with a footprint: a piece, or a plain box such as the in-push.
export type Turnable = { kind?: Kind | undefined; name?: string; turn?: number | undefined };
export type Placed = Rect & Turnable;
export const canTurn = (it: Turnable): boolean => TURNABLE.has(kindOf(it));
export const turnOf = (it: Turnable): number => canTurn(it) ? ((it.turn || 0) % 360 + 360) % 360 : 0;
export function footprint(it: Placed): Rect {
  const t = it.turn ? turnOf(it) * Math.PI / 180 : 0;
  if (!t) return it;
  const c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
  const [w, d] = kindOf(it) === "rug"
    ? [it.w * c + it.d * s, it.w * s + it.d * c]
    : [2 * Math.hypot(it.w / 2 * c, it.d / 2 * s), 2 * Math.hypot(it.w / 2 * s, it.d / 2 * c)];
  return { x: it.x + (it.w - w) / 2, y: it.y + (it.d - d) / 2, w, d };
}
export const overlap = (p: Placed, q: Placed): boolean => { const a = footprint(p), b = footprint(q); return a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.d - 0.01 && b.y < a.y + a.d - 0.01; };
export const topOf = (it: Item): number => it.z + Math.max(it.h, it.headH || 0);
export function outside(it: Item): boolean { const r = state.room, f = footprint(it); return f.x < 0 || f.y < 0 || f.x + f.w > r.W || f.y + f.d > r.L; }
// Everything this item is not allowed to overlap: the in-push, and other solid pieces at the same height.
export function blockers(it: Item): Rect[] {
  const out: Rect[] = [];
  const b = bumpRect();
  if (b.w > 0 && b.d > 0 && overlap(it, b)) out.push(b);
  if (it.solid) for (const o of state.items) {
    if (o !== it && o.solid && overlap(it, o) && it.z < topOf(o) && o.z < topOf(it)) out.push(o);
  }
  return out;
}
// Slide along one axis toward a target, stopping flush against whatever is in the way.
export function slide(it: Item, axis: "x" | "y", target: number): void {
  const old = it[axis], size = axis === "x" ? "w" : "d";
  if (target === old) return;
  it[axis] = target;
  const hit = blockers(it);
  if (!hit.length) return;
  const f = footprint(it), off = f[axis] - it[axis];
  const stops = hit.map(b => target > old ? b[axis] - f[size] - off : b[axis] + b[size] - off);
  const stop = target > old ? Math.min(...stops) : Math.max(...stops);
  it[axis] = stop;
  if ((target > old ? stop < old : stop > old) || blockers(it).length) it[axis] = old;
}
export function moveTo(it: Item, x: number, y: number): void {
  const r = state.room, f = footprint(it), ox = f.x - it.x, oy = f.y - it.y;
  slide(it, "x", Math.min(Math.max(x, -ox), Math.max(r.W - f.w - ox, -ox)));
  slide(it, "y", Math.min(Math.max(y, -oy), Math.max(r.L - f.d - oy, -oy)));
}
// Put a new piece in the first open spot, scanning from where it was asked to go.
export function placeFree(it: Item): void {
  if (!blockers(it).length) return;
  const r = state.room, x0 = it.x, y0 = it.y, f = footprint(it), ox = f.x - it.x, oy = f.y - it.y;
  for (let y = 0; y <= r.L - f.d; y += 3) for (let x = 0; x <= r.W - f.w; x += 3) {
    it.x = x - ox; it.y = y - oy;
    if (!blockers(it).length) return;
  }
  it.x = x0; it.y = y0;
}
export interface Clearances { N: number; S: number; W: number; E: number; northWall: number; eastWall: number }
export function clearances(item: Placed): Clearances {
  const r = state.room, it = footprint(item);
  const northWall = it.x + it.w > r.W - r.bx ? r.by : 0;
  const eastWall = it.y < r.by ? r.W - r.bx : r.W;
  return { N: it.y - northWall, S: r.L - (it.y + it.d), W: it.x, E: eastWall - (it.x + it.w), northWall, eastWall };
}
// The boxes that make up a piece: its body, plus a headboard strip if it has one.
export interface Part extends Rect { it: Item; z: number; h: number; head: boolean }
export function parts(it: Item): Part[] {
  const f = footprint(it), out: Part[] = [{ it, x: f.x, y: f.y, w: f.w, d: f.d, z: it.z, h: it.h, head: false }];
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
// How far below the bed's top the 3D throw hangs: down each long side, and over the foot end.
export const THROW_DROP = { side: 16, foot: 5 };
// Clear inches beside the foot of a bed for the throw to hang into: on the model's left and right
// (seen from the foot) along the 30 in nearest the foot, and past the foot end. Walls, the in-push
// and solid pieces count; a piece lower than the throw's hem on that side does not. `shelf` is the
// top of the tallest such low piece within a foot of the foot end, which the throw lies on.
export function throwRoom(bed: Item): { left: number; right: number; foot: number; shelf: number } {
  const r = state.room, foot = frontDir(bed), right = ({ S: "E", N: "W", E: "N", W: "S" } as const)[foot], top = bed.z + bed.h;
  const band: Rect = { x: bed.x, y: bed.y, w: bed.w, d: bed.d };
  if (foot === "N") band.d = Math.min(30, bed.d);
  if (foot === "S") { band.d = Math.min(30, bed.d); band.y = bed.y + bed.d - band.d; }
  if (foot === "W") band.w = Math.min(30, bed.w);
  if (foot === "E") { band.w = Math.min(30, bed.w); band.x = bed.x + bed.w - band.w; }
  let shelf = 0;
  const gap = (s: Rect, dir: Wall, hem: number): number => {
    const across = dir === "E" || dir === "W"
      ? (o: Rect) => o.y < s.y + s.d - 0.01 && s.y < o.y + o.d - 0.01
      : (o: Rect) => o.x < s.x + s.w - 0.01 && s.x < o.x + o.w - 0.01;
    const away = (o: Rect) => ({ E: o.x - (s.x + s.w), W: s.x - (o.x + o.w), N: s.y - (o.y + o.d), S: o.y - (s.y + s.d) })[dir];
    let best = { E: r.W - (s.x + s.w), W: s.x, N: s.y, S: r.L - (s.y + s.d) }[dir];
    const b = bumpRect(), others = b.w > 0 && b.d > 0 ? [b] : [];
    for (const o of state.items) if (o !== bed && o.solid && o.z < top) {
      if (topOf(o) > hem) others.push(footprint(o));
      else if (dir === foot && across(footprint(o)) && away(footprint(o)) > -0.01 && away(footprint(o)) < 12) shelf = Math.max(shelf, topOf(o));
    }
    for (const o of others) if (across(o) && away(o) > -0.01) best = Math.min(best, away(o));
    return Math.max(0, Math.round(best * 100) / 100);
  };
  const sides = { left: gap(band, OPPOSITE[right], top - THROW_DROP.side), right: gap(band, right, top - THROW_DROP.side), foot: gap(bed, foot, top - THROW_DROP.foot) };
  return { ...sides, shelf };
}
// Wall segment an opening sits on, plus the unit normal pointing into the room.
export interface Segment { x1: number; y1: number; x2: number; y2: number; nx: number; ny: number }
export function opSeg(o: Opening): Segment {
  const { W, L, bx, by } = state.room, mid = o.off + o.w / 2;
  if (o.wall === "N" || o.wall === "S") {
    const y = o.wall === "S" ? L : (mid > W - bx ? by : 0);
    return { x1: o.off, y1: y, x2: o.off + o.w, y2: y, nx: 0, ny: o.wall === "S" ? -1 : 1 };
  }
  const x = o.wall === "W" ? 0 : (mid < by ? W - bx : W);
  return { x1: x, y1: o.off, x2: x, y2: o.off + o.w, nx: o.wall === "W" ? 1 : -1, ny: 0 };
}
// Hinge point, closed-leaf tip and fully open (90 degree) tip of a swinging door.
// hinge (hx, hy), the shut leaf's tip (fx, fy), the open tip (ox, oy), the leaf's length r.
export interface Swing { hx: number; hy: number; fx: number; fy: number; ox: number; oy: number; r: number; inward: boolean }
export function swingGeom(o: Opening): Swing | null {
  if (!o.hinge || o.hinge === "none") return null;
  const s = opSeg(o), dir = o.swing === "out" ? -1 : 1;
  const [hx, hy, fx, fy] = o.hinge === "start" ? [s.x1, s.y1, s.x2, s.y2] : [s.x2, s.y2, s.x1, s.y1];
  return { hx, hy, fx, fy, ox: hx + s.nx * dir * o.w, oy: hy + s.ny * dir * o.w, r: o.w, inward: dir === 1 };
}
// True when a piece overlaps the quarter circle a hinged door sweeps through.
export function inQuarter(item: Item, g: Swing): boolean {
  const it = footprint(item), qx0 = Math.min(g.hx, g.fx, g.ox), qx1 = Math.max(g.hx, g.fx, g.ox);
  const qy0 = Math.min(g.hy, g.fy, g.oy), qy1 = Math.max(g.hy, g.fy, g.oy);
  const x0 = Math.max(it.x, qx0), x1 = Math.min(it.x + it.w, qx1);
  const y0 = Math.max(it.y, qy0), y1 = Math.min(it.y + it.d, qy1);
  if (x0 >= x1 || y0 >= y1) return false;
  const px = Math.min(Math.max(g.hx, x0), x1), py = Math.min(Math.max(g.hy, y0), y1);
  return Math.hypot(px - g.hx, py - g.hy) < g.r - 0.01;
}
// True when an item sits where a room door swings.
export function inSwing(it: Item): boolean {
  return it.solid && state.openings.some(o => {
    const g = swingGeom(o);
    return g && g.inward && it.z < o.sill + o.h && inQuarter(it, g);
  });
}
// A wardrobe has a hinged door for about every 20 in of front, in pairs hinged on their outer
// edges; each sweeps a quarter circle as wide as the door. Same shape as swingGeom's result.
export function wardrobeSwings(w: Item): Swing[] {
  if (kindOf(w) !== "wardrobe" || /sliding|nordkisa/i.test(w.name)) return [];
  const face = frontDir(w), across = face === "N" || face === "S" ? w.w : w.d;
  const doors = Math.max(1, Math.round(across / 20)), dw = across / doors;
  // where the front edge starts on the viewer's left, which way it runs, and which way is out
  const edges: Record<Wall, [number, number, number, number, number, number]> = {
    S: [w.x, w.y + w.d, 1, 0, 0, 1], N: [w.x + w.w, w.y, -1, 0, 0, -1],
    E: [w.x + w.w, w.y + w.d, 0, -1, 1, 0], W: [w.x, w.y, 0, 1, -1, 0]
  };
  const [x0, y0, ux, uy, nx, ny] = edges[face];
  const at = (t: number) => [x0 + ux * t, y0 + uy * t] as const;
  return [...Array(doors)].map((_, i) => {
    const [hx, hy] = at(i % 2 ? (i + 1) * dw : i * dw), [fx, fy] = at(i % 2 ? i * dw : (i + 1) * dw);
    return { hx, hy, fx, fy, ox: hx + nx * dw, oy: hy + ny * dw, r: dw, inward: true };
  });
}
// True when an item stands where another piece's wardrobe doors open.
export function inWardrobeSwing(it: Item): boolean {
  return it.solid && state.items.some(w => w !== it && it.z < w.z + w.h && wardrobeSwings(w).some(g => inQuarter(it, g)));
}
export const isBad = (it: Item): boolean => outside(it) || blockers(it).length > 0 || inSwing(it) || inWardrobeSwing(it);

/* ---------- light: an estimate of how bright each spot is with only the lamps on ---------- */
// Lumens per light and the share its shade sends downward. Every lamp with a socket takes Femi's
// Tapo L535E smart bulb (1100 lm, E26, 2500-6500K); the PELARBOJ has its own built-in LED.
export function lightSpec(it: Item): { lm: number; down: number } {
  const nm = it.name.toLowerCase();
  if (it.lm && it.lm > 0) return { lm: it.lm, down: it.down ?? 0.5 };
  if (/pelarboj/.test(nm)) return { lm: 25, down: 0.5 };
  if (kindOf(it) === "sconce") return { lm: 1100, down: 0.8 };
  if (it.z === 0 && it.h >= 40) return { lm: 1100, down: 0.45 };
  return { lm: 1100, down: 0.5 };
}
export const LIGHT_STEP: Record<Wall, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// Where each bulb sits: inside the shade, or just off the wall for a sconce.
export interface Light { it: Item; x: number; y: number; z: number; lm: number; down: number }
export function lightSources(items: Item[]): Light[] {
  return items.filter(it => kindOf(it) === "lamp" || kindOf(it) === "sconce").map(it => {
    const sconce = kindOf(it) === "sconce", [dx, dy] = sconce ? LIGHT_STEP[frontDir(it)] : [0, 0];
    return { it, x: it.x + it.w / 2 + dx * 4, y: it.y + it.d / 2 + dy * 4,
      z: sconce ? it.z + it.h * 0.7 : it.z + it.h - Math.min(it.h * 0.3, 10) / 2, ...lightSpec(it) };
  });
}
export const LUM_EFF = 0.85, REFLECT = 0.5, M_PER_IN = 0.0254;
// Light straight from one bulb onto a face-up spot, in lux; nothing gets through a solid box.
// A box in 3D: a footprint, how far off the floor it starts and how tall it is.
export interface Box extends Rect { z: number; h: number }
export function directLux(src: Pick<Light, "x" | "y" | "z" | "lm" | "down">, px: number, py: number, pz: number, boxes: Box[]): number {
  const dz = src.z - pz;
  if (dz <= 0) return 0;
  const dx = px - src.x, dy = py - src.y, d2 = (dx * dx + dy * dy + dz * dz) * M_PER_IN * M_PER_IN;
  for (const b of boxes) if (segHitsBox(src.x, src.y, src.z, px, py, pz, b)) return 0;
  return LUM_EFF * src.lm * src.down / (2 * Math.PI) * (dz * M_PER_IN / Math.sqrt(d2)) / d2;
}
export function segHitsBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, b: Box): boolean {
  let lo = 0.001, hi = 0.999;
  const axes: [number, number, number, number][] = [[x0, x1 - x0, b.x, b.x + b.w], [y0, y1 - y0, b.y, b.y + b.d], [z0, z1 - z0, b.z, b.z + b.h]];
  for (const [a, e, mn, mx] of axes) {
    if (Math.abs(e) < 1e-9) { if (a <= mn || a >= mx) return false; continue; }
    let t0 = (mn - a) / e, t1 = (mx - a) / e;
    if (t0 > t1) [t0, t1] = [t1, t0];
    lo = Math.max(lo, t0); hi = Math.min(hi, t1);
    if (lo >= hi) return false;
  }
  return true;
}
// Light bounced off walls, ceiling and floor, spread evenly: the room as an integrating sphere.
export function bounceLux(sources: Light[]): number {
  const { W, L, H } = state.room, area = (2 * W * L + 2 * (W + L) * H) * M_PER_IN * M_PER_IN;
  return LUM_EFF * sources.reduce((s, l) => s + l.lm, 0) * REFLECT / (area * (1 - REFLECT));
}
export function lightBoxes(items: Item[]): Box[] {
  const b = bumpRect(), out: Box[] = b.w > 0 && b.d > 0 ? [{ ...b, z: 0, h: state.room.H }] : [];
  for (const it of items) if (it.solid && kindOf(it) !== "lamp" && kindOf(it) !== "sconce") out.push(...parts(it));
  return out;
}
// Lamps-only lux, dark navy at 10 lux or less to pale yellow at 1000.
export const LUX_STOPS = ["#1f2a44", "#6b4f7a", "#d9825b", "#ffd36b", "#fff6d6"];
export function luxColor(v: number): string {
  const t = Math.min(Math.max(Math.log10(Math.max(v, 1) / 10) / 2, 0), 1) * (LUX_STOPS.length - 1), i = Math.min(Math.floor(t), LUX_STOPS.length - 2), f = t - i;
  const mix = (a: string, b: string) => Math.round(parseInt(a, 16) * (1 - f) + parseInt(b, 16) * f).toString(16).padStart(2, "0");
  const a = LUX_STOPS[i]!, b = LUX_STOPS[i + 1]!;
  return "#" + [1, 3, 5].map(k => mix(a.slice(k, k + 2), b.slice(k, k + 2))).join("");
}
// RGB of a white bulb at a colour temperature, in kelvin (Tanner Helland's fit to blackbody colours).
export function kelvinRGB(k: number): [number, number, number] {
  const t = k / 100, c = (v: number) => Math.round(Math.min(Math.max(v, 0), 255));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [c(r), c(g), c(b)];
}
export const READ_LUX = 300, ROOM_LUX = 50;
// Lux over a face-up plane (default 30 in, about where a book or a folded shirt is), the bed's
// reading spots, and the room's average and darkest tenth. Spots under furniture taller than the
// plane, or in the in-push, are left blank.
export interface ReadingSpot { side: Wall; x: number; y: number; z: number; lux: number }
export interface LightReport {
  map: { step: number; cols: number; rows: number; vals: (number | null)[]; pz: number };
  reading: ReadingSpot[]; bounce: number; avg: number; p10: number;
}
export function lightReport(items: Item[], pz = 30, step = 3): LightReport {
  const { W, L } = state.room, src = lightSources(items), boxes = lightBoxes(items), bounce = bounceLux(src);
  const at = (x: number, y: number, z: number) => bounce + src.reduce((s, l) => s + directLux(l, x, y, z, boxes), 0);
  const cols = Math.floor(W / step), rows = Math.floor(L / step), vals: (number | null)[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c + 0.5) * step, y = (r + 0.5) * step;
    const covered = boxes.some(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.d && b.z <= pz && b.z + b.h > pz);
    vals.push(covered ? null : at(x, y, pz));
  }
  const open = vals.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const bed = items.find(i => kindOf(i) === "bed"), reading: ReadingSpot[] = [];
  if (bed) {
    const prev = state.items; state.items = items;
    const c = clearances(bed), head = bed.headSide, along = head === "N" || head === "S";
    state.items = prev;
    const into = ({ N: 1, S: -1, W: 1, E: -1 } as const)[head], line = ({ N: bed.y, S: bed.y + bed.d, W: bed.x, E: bed.x + bed.w } satisfies Record<Wall, number>)[head];
    const sides: [Wall, number, number][] = along ? [["W", bed.x, 1], ["E", bed.x + bed.w, -1]] : [["N", bed.y, 1], ["S", bed.y + bed.d, -1]];
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
export function alongWall(wall: Wall, start: number, size: number): number {
  const r = state.room;
  if (wall === "N" || wall === "E") return start;
  return (wall === "S" ? r.W : r.L) - start - size;
}
// Gap between a box and the wall being looked at (the in-push counts as wall).
export function wallGap(wall: Wall, p: Item | Part): number {
  const c = clearances(p);
  return Math.max(c[wall], 0);
}
export function tier(gap: number): "flush" | "near" | "far" { return gap <= state.room.flush ? "flush" : gap <= state.room.near ? "near" : "far"; }

// Pieces saved before "kind" existed are recognised by name.
export function kindOf(it: Turnable): Kind {
  if (it.kind) return it.kind;
  const nm = (it.name ?? "").toLowerCase();
  const table: [Kind, RegExp][] = [["board", /snowboard(?! boot)/], ["boots", /boot/], ["ladder", /ladder/], ["beanbag", /bean ?bag/], ["nightstand", /night|bedside/], ["bed", /\bbed\b/], ["ottoman", /ottoman|storage bench|upholstered/], ["bench", /bench/], ["shoe", /shoe/], ["wardrobe", /wardrobe|armoire|pax/],
    ["rack", /rack|rail/], ["dresser", /dresser|drawer|chest/], ["shelf", /shel|book/], ["chair", /chair|sofa/], ["rug", /rug|carpet/],
    ["mirror", /mirror/], ["sconce", /sconce/], ["lamp", /lamp/], ["plant", /plant/],
    ["textile", /hanging|tapestry|textile/], ["pegs", /peg/], ["art", /art|print|photo|poster|map|frame|panorama/]];
  const hit = table.find(([, re]) => re.test(nm));
  return hit ? hit[0] : "other";
}

/* ---------- sidebar ---------- */
export function drawList() {
  $("#list").innerHTML = state.items.map(it =>
    `<li data-id="${it.id}" class="${it.id === selId ? "sel" : ""}"><span class="sw" style="background:${esc(it.color)}"></span>${esc(it.name)}<small>${n(it.w)}×${n(it.d)}×${n(it.h)}</small></li>`).join("");
}
export function num(label: string, key: string, v: number, attrs = ""): string {
  return `<label>${label}<input type="number"${/step=/.test(attrs) ? "" : ' step="0.5"'} data-k="${key}" value="${n(v)}" ${attrs}></label>`;
}
export function buildSelForm() {
  const it = sel(), el = $("#selCard");
  if (!it) { el.innerHTML = `<h2>Selected</h2><p class="hint" style="margin:0">Click a piece of furniture to edit it, or add one below.</p>`; return; }
  el.innerHTML = `<h2>Selected</h2>
    <div class="row"><label>Name<input data-k="name" value="${esc(it.name)}"></label>
      <label>Looks like<select data-k="kind">${keys(KINDS).map(k => `<option value="${k}"${k === kindOf(it) ? " selected" : ""}>${KINDS[k]}</option>`).join("")}</select></label>
      <label>Colour<input type="color" data-k="color" value="${esc(it.color)}"></label></div>
    <div class="row">${num("Width (E–W)", "w", it.w, 'min="0.5"')}${num("Depth (N–S)", "d", it.d, 'min="0.5"')}${num("Height", "h", it.h, 'min="0"')}</div>
    <div class="row">${num("From west wall", "x", it.x)}${num("From north wall", "y", it.y)}${num("Off the floor", "z", it.z, 'min="0"')}</div>
    <div class="row">${num("Headboard height", "headH", it.headH, 'min="0"')}${num("Headboard thick", "headT", it.headT, 'min="0.5"')}
      <label>Headboard end<select data-k="headSide">${keys(WALLS).map(w => `<option value="${w}"${w === it.headSide ? " selected" : ""}>${WALLS[w]}</option>`).join("")}</select></label></div>
    <div class="row two"><label>Front faces (3D view)<select data-k="face"><option value="auto">Away from the nearest wall</option>${keys(WALLS).map(w => `<option value="${w}"${w === it.face ? " selected" : ""}>${WALLS[w]}</option>`).join("")}</select></label>
      <label class="check" style="margin:0;align-self:end"><input type="checkbox" data-k="solid"${it.solid ? " checked" : ""}>Solid (untick for rugs)</label></div>
    ${canTurn(it) ? `<div class="row two">${num("Turn (degrees clockwise)", "turn", it.turn || 0, 'step="5"')}</div>` : ""}
    ${kindOf(it) === "art" ? `<div class="row two"><label>Photo<select data-k="photo"><option value="">${it.photos && it.photos.length > 1 ? "A grid of " + it.photos.length : "A made-up picture"}</option>${Object.entries(PRINTS).map(([k, p]) => `<option value="${k}"${it.photos?.length === 1 && it.photos[0] === k ? " selected" : ""}>${esc(p.title)}</option>`).join("")}</select></label></div>` : ""}
    <div class="btns"><button data-act="rot">Rotate 90°</button><button data-act="dup">Duplicate</button><button data-act="del">Delete</button></div>
    <p class="hint">Headboard height 0 means no headboard. Its thickness is part of the depth.</p>`;
}
export function buildRoomForm() {
  const r = state.room;
  let h = `<div class="row">${num("Width (E–W)", "room.W", r.W)}${num("Length (N–S)", "room.L", r.L)}${num("Ceiling", "room.H", r.H)}</div>
    <div class="row two">${num("In-push width (E–W)", "room.bx", r.bx)}${num("In-push length (N–S)", "room.by", r.by)}</div>
    <div class="row two">${num("Counts as on the wall within", "room.flush", r.flush, 'min="0"')}${num("Counts as close within", "room.near", r.near, 'min="0"')}</div>`;
  state.openings.forEach((o, i) => {
    const ns = o.wall === "N" || o.wall === "S";
    h += `<div class="opbox"><div class="row two"><label>Name<input data-k="openings.${i}.name" value="${esc(o.name)}"></label>
      <label>Wall<select data-k="openings.${i}.wall">${keys(WALLS).map(w => `<option value="${w}"${w === o.wall ? " selected" : ""}>${WALLS[w]}</option>`).join("")}</select></label></div>
      <div class="row two">${num("Start, from " + (ns ? "west" : "north") + " end", `openings.${i}.off`, o.off)}${num("Width", `openings.${i}.w`, o.w)}</div>
      <div class="row two">${num("Sill height", `openings.${i}.sill`, o.sill)}${num("Height", `openings.${i}.h`, o.h)}</div>
      <div class="row two"><label>Hinge<select data-k="openings.${i}.hinge">${[["none", "No swing"], ["start", (ns ? "West" : "North") + " side"], ["end", (ns ? "East" : "South") + " side"]].map(([v, t]) => `<option value="${v}"${v === o.hinge ? " selected" : ""}>${t}</option>`).join("")}</select></label>
      <label>Opens<select data-k="openings.${i}.swing"><option value="in"${o.swing !== "out" ? " selected" : ""}>Into the room</option><option value="out"${o.swing === "out" ? " selected" : ""}>Out of the room</option></select></label></div></div>`;
  });
  $("#roomForm").innerHTML = h;
}

export const currentPlan = (): Plan | null => [...BUILTIN, ...plans].find(p => p.id === state.planId) || null;
export const isSaved = (p: Plan): boolean => plans.includes(p);
export function isDirty() { const p = currentPlan(); return JSON.stringify(p ? p.items : DEFAULT.items) !== JSON.stringify(state.items); }
export function drawPlans() {
  const cur = currentPlan(), dirty = isDirty();
  const row = (p: Plan) => {
    const armedLoad = armedKey === "load:" + p.id, armedDel = armedKey === "del:" + p.id;
    const note = armedLoad ? "click again, unsaved changes go" : armedDel ? "click again to delete"
      : p === cur ? (dirty ? "open, edited" : "open") : isSaved(p) ? p.items.length + " pieces" : p.note;
    return `<li data-plan="${p.id}" class="${p === cur ? "cur" : ""}${armedLoad || armedDel ? " armed" : ""}"><span class="pl"><span>${esc(p.name)}</span><small>${note}</small></span>${isSaved(p) ? `<button class="x" data-del="${p.id}" title="Delete this plan">✕</button>` : ""}${linkOf(p) ? `<button class="link" data-copy="${linkOf(p)}" title="Copy a link that opens this layout" aria-label="Copy link"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" class="i-link"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 0 1 4.5 9l1-1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" class="i-done"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ""}</li>`;
  };
  $("#plansBox").innerHTML = `<div class="sub">Ready-made</div><ul class="plans">${BUILTIN.map(row).join("")}</ul>
    <div class="sub">Yours</div><ul class="plans">${plans.length ? plans.map(row).join("") : `<li style="cursor:default;color:var(--muted)">None saved yet</li>`}</ul>`;
  const up = $("#updatePlan");
  up.hidden = !(cur && isSaved(cur) && dirty);
  if (cur && !up.hidden) up.textContent = `Save changes to “${cur.name}”`;
  $("#planWhy").textContent = cur && cur.why ? cur.why : "";
  $("#planHint").textContent = storageOk ? "Click a plan to open it." : "This browser is blocking storage, so plans will not survive closing the tab. Use Export JSON to keep them.";
}
// Destructive clicks need a second click within four seconds.
export function confirmTwice(key: string, fn: () => void): void {
  clearTimeout(armTimer);
  if (armedKey === key) { armedKey = null; fn(); return; }
  armedKey = key;
  armTimer = setTimeout(() => { armedKey = null; drawPlans(); }, 4000);
  drawPlans();
}
export function openPlan(p: Plan): void {
  state.items = normalize({ planId: null, room: { ...state.room }, openings: [], items: structuredClone(p.items) }).items;
  state.planId = p.id; selId = null; buildSelForm(); draw();
}
// Each page sets these: onDraw repaints its view, nudge turns an arrow key into a move across the floor,
// onPrint gets the page ready before the print dialog opens.
export const hooks = {
  onDraw: (): void => {},
  onPrint: async (): Promise<void> => {},
  nudge: (dx: number, dy: number): [number, number] => [dx, dy]
};
export function refresh() { hooks.onDraw(); drawList(); drawPlans(); }
export function draw() { refresh(); save(); }
export function select(id: string | null): void { selId = id; buildSelForm(); draw(); }

/* ---------- sidebar wiring ---------- */
export const SIDEBAR = `<div class="card" id="selCard"></div>
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
  <p class="hint" id="keysHint" style="margin:0">Arrow keys nudge 1″ (Shift = 6″), R rotates, Shift+R turns 15° (bean bags, plants, lamps and rugs), Delete removes, Esc deselects. Solid pieces stop at walls and at each other. A red dashed outline means a piece blocks a door swing, a room door's or a wardrobe's, or overlaps something.</p>
</details>`;
// Which sidebar sections this browser has opened or closed, by data-section name.
export const SECTIONS_KEY = "bedroom-planner-sections-v1";
export const OPPOSITE: Record<Wall, Wall> = { N: "S", E: "W", S: "N", W: "E" };
// Which way a piece's front points. Beds face away from the headboard; everything else faces
// away from the wall it is nearest, measured across its short side, unless a facing was chosen.
export function frontDir(it: Item): Wall {
  if (it.headH > 0) return OPPOSITE[it.headSide];
  if (it.face && it.face !== "auto") return it.face;
  const c = clearances(it), ratio = it.w / it.d;
  const sides: Wall[] = ratio > 1.15 ? ["S", "N"] : ratio < 0.87 ? ["E", "W"] : ["S", "E", "N", "W"];
  return sides.reduce((a, b) => (c[b] > c[a] + 0.01 ? b : a));
}
export function rotateItem(it: Item): void {
  const facing = it.headH > 0 ? null : frontDir(it), cx = it.x + it.w / 2, cy = it.y + it.d / 2, r = state.room;
  [it.w, it.d] = [it.d, it.w];
  it.x = Math.min(Math.max(Math.round(cx - it.w / 2), 0), Math.max(r.W - it.w, 0));
  it.y = Math.min(Math.max(Math.round(cy - it.d / 2), 0), Math.max(r.L - it.d, 0));
  it.headSide = CLOCKWISE[it.headSide];
  if (facing) it.face = CLOCKWISE[facing];
  placeFree(it);
}
export function act(a: "rot" | "dup" | "del"): void {
  const it = sel();
  if (!it) return;
  if (a === "rot") rotateItem(it);
  if (a === "dup") { const c = { ...it, id: uid(), name: it.name + " copy", x: it.x + 6, y: it.y + 6 }; state.items.push(c); placeFree(c); selId = c.id; }
  if (a === "del") { state.items = state.items.filter(i => i !== it); selId = null; }
  buildSelForm(); draw();
}
// What a click or keypress landed on in the planner's own markup: an HTML element or an SVG icon.
export type Target = HTMLElement | SVGElement;
export const targetOf = (e: Event): Target => e.target as Target;
const ITEM_NUMBERS = ["w", "d", "h", "x", "y", "z", "headH", "headT", "turn"] as const;
const OPENING_NUMBERS = ["off", "w", "sill", "h"] as const;
const ROOM_NUMBERS = ["W", "L", "H", "bx", "by", "flush", "near"] as const;
// A number typed into a field, or null while it is half-typed.
const typedNumber = (el: HTMLInputElement | HTMLSelectElement): number | null => { const v = parseFloat(el.value); return Number.isNaN(v) ? null : v; };

// Copies one field of the Selected panel onto the piece. False when there is nothing to redraw.
function setItemField(it: Item, k: string, el: HTMLInputElement | HTMLSelectElement): boolean {
  if (k === "photo") { if (el.value) it.photos = [el.value]; else if ((it.photos || []).length < 2) delete it.photos; return true; }
  if (k === "solid" && el instanceof HTMLInputElement) it.solid = el.checked;
  else if (among(ITEM_NUMBERS, k)) { const v = typedNumber(el); if (v === null) return false; it[k] = v; }
  else if (k === "name" || k === "color") it[k] = el.value;
  else if (k === "kind" && among(ITEM_KINDS, el.value)) it.kind = el.value;
  else if (k === "headSide" && among(WALL_SIDES, el.value)) it.headSide = el.value;
  else if (k === "face" && (among(WALL_SIDES, el.value) || el.value === "auto")) it.face = el.value;
  else return false;
  return true;
}
// Copies one field of the room form, "room.W" or "openings.2.off", onto the state.
function setRoomField(path: string, el: HTMLInputElement | HTMLSelectElement): boolean {
  const [group, a, b] = path.split(".");
  if (group === "room" && a && among(ROOM_NUMBERS, a)) { const v = typedNumber(el); if (v === null) return false; state.room[a] = v; return true; }
  const o = group === "openings" ? state.openings[Number(a)] : undefined;
  if (!o || !b) return false;
  if (among(OPENING_NUMBERS, b)) { const v = typedNumber(el); if (v === null) return false; o[b] = v; }
  else if (b === "name") o.name = el.value;
  else if (b === "wall" && among(WALL_SIDES, el.value)) o.wall = el.value;
  else if (b === "hinge" && among(HINGES, el.value)) o.hinge = el.value;
  else if (b === "swing" && among(SWINGS, el.value)) o.swing = el.value;
  else return false;
  return true;
}
export const formField = (e: Event): HTMLInputElement | HTMLSelectElement | null =>
  e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement ? e.target : null;

export function initPlanner(): void {
  $("#side").innerHTML = SIDEBAR;
  let sections: Record<string, boolean> = {};
  try { sections = JSON.parse(localStorage.getItem(SECTIONS_KEY) ?? "null") || {}; } catch { /* no storage: every section starts as shipped */ }
  for (const d of document.querySelectorAll<HTMLDetailsElement>("#side details[data-section]")) {
    const key = d.dataset.section ?? "";
    if (Object.hasOwn(sections, key)) d.open = sections[key] ?? d.open;
    d.addEventListener("toggle", () => {
      sections[key] = d.open;
      try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections)); } catch { /* still toggles, just not remembered */ }
    });
  }
  $("#list").addEventListener("click", e => { const li = targetOf(e).closest("li"); if (li) select(li.dataset.id ?? null); });
  $("#selCard").addEventListener("input", e => {
    const it = sel(), el = formField(e), k = el?.dataset.k;
    if (!it || !el || !k) return;
    if (setItemField(it, k, el)) draw();
  });
  $("#selCard").addEventListener("click", e => { const a = targetOf(e).dataset.act; if (a === "rot" || a === "dup" || a === "del") act(a); });
  $("#roomForm").addEventListener("input", e => {
    const el = formField(e), k = el?.dataset.k;
    if (!el || !k || !setRoomField(k, el)) return;
    if (k.endsWith(".wall")) buildRoomForm();
    draw();
  });

  $("#preset").innerHTML = PRESETS.map((p, i) => `<option value="${i}">${p[0]} (${p[1]}×${p[2]}×${p[3]})</option>`).join("");
  $("#add").addEventListener("click", () => {
    const preset = PRESETS[+$<HTMLSelectElement>("#preset").value];
    if (!preset) return;
    const [name, w, d, h, z, color, solid, kind] = preset, r = state.room;
    const it: Item = { id: uid(), name, kind, w, d, h, z, color, solid, headH: 0, headT: 3, headSide: "S",
      x: Math.max(Math.round((r.W - r.bx - w) / 2), 0), y: Math.round(r.by + 6) };
    state.items.push(it); placeFree(it); select(it.id);
  });
  document.addEventListener("keydown", e => {
    if (/INPUT|SELECT|TEXTAREA/.test(targetOf(e).tagName)) return;
    const it = sel();
    if (!it) return;
    const step = e.shiftKey ? 6 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (move) { const [dx, dy] = hooks.nudge(...move); moveTo(it, it.x + dx, it.y + dy); e.preventDefault(); buildSelForm(); draw(); }
    else if (e.key === "R" && canTurn(it)) { it.turn = (turnOf(it) + 15) % 360; buildSelForm(); draw(); }
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
  const fileInput = $<HTMLInputElement>("#file");
  $("#import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const f = fileInput.files?.[0];
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
    } catch (err) { alert("Could not import that file: " + (err instanceof Error ? err.message : String(err))); }
    fileInput.value = "";
  });
  $("#plansBox").addEventListener("click", e => {
    const b = targetOf(e).closest<HTMLElement>("[data-copy]");
    if (b) {
      const url = location.origin + b.dataset.copy;
      navigator.clipboard.writeText(url).then(() => { b.classList.add("done"); b.title = "Copied"; setTimeout(() => { b.classList.remove("done"); b.title = "Copy a link that opens this layout"; }, 1500); },
        () => window.prompt("Copy this link", url));
      return;
    }
    const del = targetOf(e).dataset.del;
    if (del) {
      confirmTwice("del:" + del, () => { plans = plans.filter(p => p.id !== del); savePlans(); draw(); });
      return;
    }
    const li = targetOf(e).closest<HTMLElement>("li[data-plan]");
    const p = li && [...BUILTIN, ...plans].find(x => x.id === li.dataset.plan);
    if (!p) return;
    if (isDirty()) confirmTwice("load:" + p.id, () => openPlan(p)); else openPlan(p);
  });
  const planName = $<HTMLInputElement>("#planName");
  $("#savePlan").addEventListener("click", () => {
    const name = planName.value.trim() || "Plan " + (plans.length + 1);
    const p = { id: uid(), name, items: structuredClone(state.items) };
    plans.push(p); state.planId = p.id; planName.value = ""; savePlans(); draw();
  });
  planName.addEventListener("keydown", e => { if (e.key === "Enter") $("#savePlan").click(); });
  $("#updatePlan").addEventListener("click", () => {
    const p = currentPlan();
    if (!p || !isSaved(p)) return;
    p.items = structuredClone(state.items); savePlans(); draw();
  });
  $("#print").addEventListener("click", async () => { await hooks.onPrint(); window.print(); });
  // Two clicks instead of a browser confirm box, which some browsers suppress on local files.
  const resetBtn = $("#reset");
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
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
  const linked = linkedPlan(location.search), first = BUILTIN[0];
  if (linked) { openPlan(linked); history.replaceState(null, "", location.pathname + location.hash); }
  else if (!state.planId && !isDirty() && first) openPlan(first);
  buildRoomForm(); buildSelForm(); draw();
}
