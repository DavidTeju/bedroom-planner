// Pure shape maths for the 3D cloth, with no three.js, so the tests can run it directly.
// A stuffed pillow, lying flat: u runs across its width and v along its length, both -1 to 1, and
// side is 1 for the top and -1 for the underside. The two halves meet at a seam round the edge, the
// stuffing pulls the middle of each edge in so the corners stick out as ears, the underside settles
// flatter than the top, creases fan in from each corner, and `dent` sinks the middle where a head goes.
export interface PillowShape { w: number; len: number; t: number; seed?: number; dent?: number }
export type Point = [x: number, y: number, z: number];
export function pillowPoint(u: number, v: number, side: number, o: PillowShape): Point {
  const { w, len, t, seed = 0, dent = 0 } = o;
  const puff = Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), 0.55), inset = 0.22 * t;
  const x = u * (w / 2 - inset * (1 - v * v)), z = v * (len / 2 - inset * (1 - u * u));
  const cu = 1 - Math.abs(u), cv = 1 - Math.abs(v), corner = Math.exp(-(cu * cu + cv * cv) / 0.07);
  const crease = 0.1 * t * corner * Math.sin(Math.atan2(cv, cu) * 9 + seed * 2.1 + side) * Math.sqrt(puff);
  const lump = 0.04 * t * Math.sin(u * 3.1 + seed) * Math.sin(v * 2.6 + seed * 1.7) * puff;
  let y = (side > 0 ? 1 : 0.75) * side * (t / 2) * puff + crease + lump;
  if (side > 0) y -= dent * 0.32 * t * Math.exp(-((u / 0.45) ** 2) - ((v / 0.5) ** 2)) * puff;
  return [x, y, z];
}
// Where a point of a cloth laid flat over a bed ends up once it drapes. The bed's top is at `top`,
// between x0 and x1 and up to its foot at z1, with edges rounded to radius r. Cloth past an edge rolls
// over it and hangs straight down, past a corner it falls in a cone so the corner hangs lowest, it
// gathers into folds the further it hangs, and any that reaches the floor lies on it. `rest` is the
// height of anything past the foot that the cloth lies on.
// The bed the cloth lies on: x0 to x1 across, its foot at z1, its top `top` high with edges rounded
// to r, the floor at `floor`; seed and folds shape the folds, and rest is anything past the foot.
export interface DrapeBed { x0: number; x1: number; z1: number; top: number; r: number; floor?: number; seed?: number; folds?: number; rest?: number | undefined }
export function drapePoint(px: number, pz: number, b: DrapeBed): Point {
  const { x0, x1, z1, top, r, floor = 0, seed = 0, folds = 1 } = b;
  const sx = px > (x0 + x1) / 2 ? 1 : -1, edge = sx > 0 ? x1 : x0;
  const ex = sx * (px - edge) + r, ez = pz - z1 + r;
  if (ex <= 0 && ez <= 0) return [px, top, pz];
  // how far past the start of the rounding, which way it falls, and where it is along the edge
  let e: number, dir: [number, number], s: number;
  if (ez <= 0) { e = ex; dir = [sx, 0]; s = ez; }
  else if (ex <= 0) { e = ez; dir = [0, 1]; s = ez * Math.PI / 2 - ex; }
  else { e = Math.hypot(ex, ez); const phi = Math.atan2(ez, ex); dir = [sx * Math.cos(phi), Math.sin(phi)]; s = e * phi; }
  const arc = Math.PI * r / 2;
  let out = e < arc ? r * Math.sin(e / r) : r, drop = e < arc ? r * (1 - Math.cos(e / r)) : r + e - arc;
  const hang = folds * Math.min(2.6, Math.max(0, e - r) * 0.2);
  const fold = hang * (0.5 + 0.3 * Math.sin(s * 0.75 + seed) + 0.2 * Math.sin(s * 1.9 + seed * 3) * Math.cos(s * 0.31 + seed));
  out += fold;
  drop -= 0.6 * fold * Math.min(1, Math.max(0, e - arc) / 8);
  const cx = ex > 0 ? edge - sx * r : px, cz = ez > 0 ? z1 - r : pz;
  // a surface past the foot, such as a bench, catches the cloth; the catch fades in round the corner
  // as the cloth moves out over the foot, so the long side's hang meets it without a tear
  if (b.rest !== undefined && ez > 0) {
    const k = Math.min(1, Math.max(0, dir[1] * out / r)), limit = (top - b.rest) / Math.max(k * k * (3 - 2 * k), 1e-6);
    drop = Math.min(drop, limit);
  }
  if (top - drop < floor) { out += floor - (top - drop); drop = top - floor; }
  return [cx + dir[0] * out, top - drop, cz + dir[1] * out];
}
