// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const dir = new URL("../site/", import.meta.url);
const read = name => fs.readFileSync(new URL(name, dir), "utf8");

// Loads the shared planner script the way a page does and returns an evaluator for its globals.
function loadCore() {
  const store = new Map();
  const ctx = vm.createContext({
    console, structuredClone,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) }
  });
  vm.runInContext(read("core.js"), ctx, { filename: "core.js" });
  return src => vm.runInContext(src, ctx);
}

test("both pages load the shared core and neither keeps its own copy of the layouts", () => {
  for (const page of ["plan.html", "index.html"]) {
    const html = read(page);
    assert.match(html, /<script src="core\.js"><\/script>/, page + " loads the core");
    assert.doesNotMatch(html, /const BUILTIN\b/, page + " has no inline layouts");
  }
});

test("the core ships the measured room and the ready-made layouts", () => {
  const run = loadCore();
  assert.equal(run("state.room.W"), 129);
  assert.equal(run("BUILTIN.map(p => p.name).join(' | ')"), "Bed facing the window | Corner bed, maximum storage | Centred bed, both sides open");
});

test("every ready-made layout uses the measured 46 x 16 upholstered storage bench", () => {
  const run = loadCore();
  const benches = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => p.items.filter(i => i.kind === "ottoman").map(i => [i.w, i.d].sort((a, b) => b - a))))`));
  assert.deepEqual(benches, [[[46, 16]], [[46, 16]], [[46, 16]]]);
  assert.equal(run(`PRESETS.find(p => p[7] === "ottoman").slice(1, 3).join("x")`), "46x16");
});

test("the window-facing layout has a PAX wardrobe facing south and nothing blocked", () => {
  const run = loadCore();
  const out = JSON.parse(run(`(() => {
    const plan = BUILTIN.find(p => p.name === "Bed facing the window");
    state.items = plan.items;
    return JSON.stringify({
      pax: plan.items.filter(i => /PAX/.test(i.name)).map(frontDir),
      blocked: plan.items.filter(isBad).map(i => i.name)
    });
  })()`));
  assert.deepEqual(out, { pax: ["S"], blocked: [] });
});

test("a piece standing where a wardrobe's doors open is blocked", () => {
  const run = loadCore();
  const blocked = rackY => run(`(() => {
    const pax = { id: "w", name: "PAX", kind: "wardrobe", x: 0, y: 0, w: 39.375, d: 22.875, h: 93, z: 0, solid: true, headH: 0, headT: 3, headSide: "S" };
    const rack = { id: "r", name: "Rack", kind: "rack", x: 0, y: ${rackY}, w: 20.125, d: 30, h: 69, z: 0, solid: true, headH: 0, headT: 3, headSide: "S" };
    state.items = [pax, rack];
    return isBad(rack);
  })()`);
  assert.equal(blocked(22.875), true, "rack against the doors");
  assert.equal(blocked(43), false, "rack past the door sweep");
});

test("wardrobe doors open toward the front, one sweep per door, hinged on the outer edges", () => {
  const run = loadCore();
  const doors = JSON.parse(run(`JSON.stringify(wardrobeSwings({ id: "w", name: "PAX", kind: "wardrobe", x: 0, y: 0, w: 40, d: 23, h: 93, z: 0, headH: 0 }))`));
  assert.deepEqual(doors.map(d => [d.hx, d.hy, d.ox, d.oy, d.r]), [[0, 23, 0, 43, 20], [40, 23, 40, 43, 20]]);
});

test("a piece against a wall faces into the room", () => {
  const run = loadCore();
  const face = it => run(`frontDir(${JSON.stringify(it)})`);
  const base = { z: 0, h: 30, headH: 0 };
  assert.equal(face({ ...base, name: "Dresser", kind: "dresser", x: 0, y: 17, w: 18.875, d: 63 }), "E");
  assert.equal(face({ ...base, name: "Wardrobe", kind: "wardrobe", x: 0, y: 0, w: 39.375, d: 22.875 }), "S");
  assert.equal(face({ ...base, name: "Park print", kind: "art", x: 39, y: 163, w: 18, d: 1 }), "N");
  assert.equal(face({ ...base, name: "Wall hanging", kind: "textile", x: 128, y: 85, w: 1, d: 30 }), "W");
});

test("a piece on the in-push faces away from it", () => {
  const run = loadCore();
  assert.equal(run(`frontDir({ name: "Summit photos", kind: "art", x: 100, y: 48, w: 24, d: 1, h: 20, z: 50 })`), "S");
  assert.equal(run(`frontDir({ name: "Mirror", kind: "mirror", x: 97, y: 10, w: 1, d: 24, h: 60, z: 12 })`), "W");
});

test("a bed faces away from its headboard, and a chosen facing wins over the guess", () => {
  const run = loadCore();
  assert.equal(run(`frontDir(state.items[0])`), "N");
  assert.equal(run(`frontDir({ name: "Dresser", kind: "dresser", x: 0, y: 17, w: 18.875, d: 63, h: 30, z: 0, face: "N" })`), "N");
});

test("rotating a piece swaps its footprint and turns its headboard and chosen facing clockwise", () => {
  const run = loadCore();
  const out = run(`(() => {
    const it = { id: "t", name: "Dresser", kind: "dresser", x: 40, y: 60, w: 36, d: 18, h: 34, z: 0, solid: true, headH: 0, headT: 3, headSide: "S", face: "N" };
    state.items = [it];
    rotateItem(it);
    return JSON.stringify(it);
  })()`);
  const it = JSON.parse(out);
  assert.deepEqual([it.w, it.d, it.face, it.headSide], [18, 36, "E", "W"]);
});

test("rotating a piece whose facing was guessed turns that facing too", () => {
  const run = loadCore();
  const out = run(`(() => {
    const it = { id: "c", name: "Armchair", kind: "chair", x: 40, y: 60, w: 32, d: 34, h: 32, z: 0, solid: true, headH: 0, headT: 3, headSide: "S" };
    state.items = [it];
    const before = frontDir(it);
    rotateItem(it);
    return JSON.stringify([before, frontDir(it)]);
  })()`);
  const [before, after] = JSON.parse(out);
  assert.equal(after, { N: "E", E: "S", S: "W", W: "N" }[before]);
});

test("no ready-made layout has a blocked piece", () => {
  const run = loadCore();
  const blocked = JSON.parse(run(`JSON.stringify(BUILTIN.flatMap(p => { state.items = p.items; return p.items.filter(isBad).map(i => p.name + ": " + i.name); }))`));
  assert.deepEqual(blocked, []);
});

test("every piece in every ready-made layout resolves to a compass facing", () => {
  const run = loadCore();
  const faces = JSON.parse(run(`JSON.stringify(BUILTIN.flatMap(p => p.items.map(frontDir)))`));
  assert.ok(faces.length > 30);
  for (const f of faces) assert.match(f, /^[NESW]$/);
});

test("every ready-made layout puts the same KALLAX shoe tower beside the PAX", () => {
  const run = loadCore();
  const shoes = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => p.items.filter(i => i.kind === "shoe").map(i => [i.name, i.x, i.y, i.w, i.d, i.h])))`));
  const tower = [["KALLAX 1x4 shoe tower", 39.375, 0, 15.375, 16.5, 57.875]];
  assert.deepEqual(shoes, [tower, tower, tower]);
});

test("the window-facing layout has a nightstand by the head of the bed on its open side", () => {
  const run = loadCore();
  const out = JSON.parse(run(`(() => {
    const plan = BUILTIN.find(p => p.name === "Bed facing the window");
    state.items = plan.items;
    const bed = plan.items.find(i => i.kind === "bed"), ns = plan.items.filter(i => i.kind === "nightstand");
    return JSON.stringify(ns.map(n => ({
      againstBed: n.y + n.d === bed.y,
      byHead: n.x + n.w === bed.x + bed.w,
      topNearMattress: Math.abs(n.z + n.h - bed.h) <= 3,
      blocked: isBad(n)
    })));
  })()`));
  assert.deepEqual(out, [{ againstBed: true, byHead: true, topNearMattress: true, blocked: false }]);
});
