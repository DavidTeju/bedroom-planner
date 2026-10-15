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
      onFloor: n.z === 0,
      blocked: isBad(n)
    })));
  })()`));
  assert.deepEqual(out, [{ againstBed: true, byHead: true, topNearMattress: true, onFloor: true, blocked: false }]);
});

test("the centred layout has a short chest west of the bed, under the window sill", () => {
  const run = loadCore();
  const out = JSON.parse(run(`(() => {
    const plan = BUILTIN.find(p => p.name === "Centred bed, both sides open");
    const bed = plan.items.find(i => i.kind === "bed"), win = state.openings.find(o => o.id === "window");
    return JSON.stringify(plan.items.filter(i => i.kind === "dresser" && i.x + i.w <= bed.x).map(i => ({
      onWestWall: i.x === 0,
      underWindow: i.y >= win.off && i.y + i.d <= win.off + win.w + 0.01,
      belowSill: i.z + i.h < win.sill
    })));
  })()`));
  assert.deepEqual(out, [{ onWestWall: true, underWindow: true, belowSill: true }]);
});

test("every ready-made layout is lit by lamps alone: a floor lamp and nothing on the ceiling", () => {
  const run = loadCore();
  const out = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => {
    const lights = p.items.filter(i => i.kind === "lamp" || i.kind === "sconce");
    return {
      name: p.name,
      floorLamp: lights.some(i => i.kind === "lamp" && i.z === 0 && i.h >= 55),
      onCeiling: lights.filter(i => i.z + i.h >= state.room.H - 6).map(i => i.name)
    };
  }))`));
  for (const p of out) assert.deepEqual(p, { name: p.name, floorLamp: true, onCeiling: [] });
});

test("every open side of the bed has a reading light at the head", () => {
  const run = loadCore();
  const out = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => {
    state.items = p.items;
    const bed = p.items.find(i => i.kind === "bed"), c = clearances(bed), flush = state.room.flush;
    const head = bed.headSide, along = head === "N" || head === "S";
    const headLine = { N: bed.y, S: bed.y + bed.d, W: bed.x, E: bed.x + bed.w }[head];
    const sides = along ? [["W", bed.x], ["E", bed.x + bed.w]] : [["N", bed.y], ["S", bed.y + bed.d]];
    const lights = p.items.filter(i => (i.kind === "lamp" || i.kind === "sconce") && i.z >= 20);
    const unlit = sides.filter(([s]) => c[s] > flush).filter(([, edge]) => !lights.some(l => {
      const cx = l.x + l.w / 2, cy = l.y + l.d / 2;
      const corner = along ? [edge, headLine] : [headLine, edge];
      return Math.hypot(cx - corner[0], cy - corner[1]) <= 20;
    })).map(([s]) => s);
    return { name: p.name, unlit };
  }))`));
  for (const p of out) assert.deepEqual(p, { name: p.name, unlit: [] });
});

test("a plug-in sconce is a thin wall piece that both views draw", () => {
  const run = loadCore();
  assert.equal(run(`KINDS.sconce`), "Wall sconce");
  assert.equal(run(`kindOf({ name: "Plug-in swing-arm sconce" })`), "sconce");
  const sconces = JSON.parse(run(`JSON.stringify(BUILTIN.flatMap(p => { state.items = p.items; return p.items.filter(i => i.kind === "sconce").map(i => {
    const c = clearances(i); return { thin: Math.min(i.w, i.d) <= 4, onWall: Math.min(c.N, c.S, c.E, c.W) <= state.room.flush, raised: i.z > 0 }; }); }))`));
  assert.ok(sconces.length > 0, "some layout uses a sconce");
  for (const s of sconces) assert.deepEqual(s, { thin: true, onWall: true, raised: true });
  assert.match(read("index.html"), /^\s+sconce\(g,/m, "the 3D view has a sconce model");
  assert.match(read("plan.html"), /k === "sconce"/, "the 2D plan draws sconces");
});

test("the 3D view can switch the room to lamplight", () => {
  assert.match(read("index.html"), /data-toggle="lamps"/);
});

test("a lamp lights a point by the inverse-square and cosine laws", () => {
  const run = loadCore();
  const out = JSON.parse(run(`(() => {
    const src = { x: 0, y: 0, z: 39.3701, lm: 1000, down: 1 };
    return JSON.stringify([directLux(src, 0, 0, 0, []), directLux(src, 39.3701, 0, 0, []), directLux(src, 0, 0, 50, [])]);
  })()`));
  const I = 0.85 * 1000 / (2 * Math.PI);
  assert.ok(Math.abs(out[0] - I) < 0.5, "straight below, 1 m away: " + out[0]);
  assert.ok(Math.abs(out[1] - I * Math.SQRT1_2 / 2) < 0.5, "1 m below and 1 m across: " + out[1]);
  assert.equal(out[2], 0, "a plane above the lamp gets no direct light");
});

test("a solid piece between a lamp and a point shades it", () => {
  const run = loadCore();
  const lux = JSON.parse(run(`JSON.stringify(directLux({ x: 0, y: 0, z: 60, lm: 1000, down: 0.5 }, 40, 0, 0, [{ x: 15, y: -5, w: 10, d: 10, z: 0, h: 50 }]))`));
  assert.equal(lux, 0);
});

test("the light map reports each layout's reading spots, average and darkest tenth", () => {
  const run = loadCore();
  const out = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => { const r = lightReport(p.items); return { spots: r.reading.length, avg: r.avg > 0, p10: r.p10 >= 0, cells: r.map.vals.length > 0 }; }))`));
  assert.deepEqual(out, [{ spots: 1, avg: true, p10: true, cells: true }, { spots: 1, avg: true, p10: true, cells: true }, { spots: 2, avg: true, p10: true, cells: true }]);
});

test("with only the lamps on, every reading spot gets 300 lux and the room averages 50", () => {
  const run = loadCore();
  const out = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => { const r = lightReport(p.items);
    return { name: p.name, dimSpots: r.reading.filter(s => s.lux < READ_LUX).map(s => s.side + " " + Math.round(s.lux)), avgOk: r.avg >= ROOM_LUX }; }))`));
  for (const p of out) assert.deepEqual(p, { name: p.name, dimSpots: [], avgOk: true });
});

test("the 2D plan can overlay the lamps-only light map", () => {
  const html = read("plan.html");
  assert.match(html, /id="lightBtn"/);
  assert.match(html, /lightReport\(state\.items\)/);
});

test("the 2D plan colours the light map from the core, and the 3D view has no light map", () => {
  const run = loadCore();
  assert.equal(run(`luxColor(10)`), "#1f2a44");
  assert.equal(run(`luxColor(1000)`), "#fff6d6");
  assert.doesNotMatch(read("plan.html"), /function luxColor/, "the 2D plan uses the shared colours");
  assert.doesNotMatch(read("index.html"), /data-toggle="lightmap"|lightReport\(/);
});

test("a white bulb's colour temperature turns into the right RGB", () => {
  const run = loadCore();
  const near = (got, want) => got.every((v, i) => Math.abs(v - want[i]) <= 3);
  const warm = JSON.parse(run(`JSON.stringify(kelvinRGB(2700))`)), cool = JSON.parse(run(`JSON.stringify(kelvinRGB(6500))`));
  assert.ok(near(warm, [255, 167, 87]), "2700K: " + warm);
  assert.ok(near(cool, [255, 254, 250]), "6500K: " + cool);
});

test("lamps-only mode lets the bulbs be any white temperature or any colour", () => {
  const html = read("index.html");
  assert.match(html, /id="kelvin"[^>]*min="2500"[^>]*max="6500"/);
  assert.match(html, /id="bulbColor"[^>]*type="color"|type="color"[^>]*id="bulbColor"/);
});

test("every lamp that takes a bulb gets Femi's 1100 lm Tapo L535E", () => {
  const run = loadCore();
  const lm = JSON.parse(run(`JSON.stringify(Object.fromEntries(BUILTIN[1].items.filter(i => i.kind === "lamp" || i.kind === "sconce").map(i => [i.name, lightSpec(i).lm])))`));
  assert.deepEqual(lm, { "Floor lamp": 1100, "Plug-in swing-arm sconce": 1100, "BÖJA table lamp (yours)": 1100, "Mika cactus lamp (yours)": 1100, "PELARBOJ glow lamp (yours)": 25 });
});

const LINK_SLUGS = { window: "Bed facing the window", corner: "Corner bed, maximum storage", centred: "Centred bed, both sides open" };

test("each ready-made layout has a link slug that opens it", () => {
  const run = loadCore();
  for (const [slug, name] of Object.entries(LINK_SLUGS)) {
    assert.equal(run(`linkedPlan("?layout=${slug}")?.name`), name, slug);
    assert.equal(run(`linkOf(BUILTIN.find(p => p.name === ${JSON.stringify(name)}))`), "/" + slug + "/");
  }
  assert.equal(run(`linkedPlan("?layout=nope")`), null);
  assert.equal(run(`linkedPlan("")`), null);
});

// Width and height from a PNG's IHDR chunk.
const pngSize = buf => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

test("each layout link has its own preview card and image, and sends people to that layout", () => {
  for (const [slug, name] of Object.entries(LINK_SLUGS)) {
    const html = read(slug + "/index.html");
    assert.match(html, new RegExp(`<meta property="og:title" content="[^"]*${name}`), slug + " title");
    assert.match(html, /<meta property="og:description" content="[^"]{20,}">/, slug + " description");
    assert.match(html, new RegExp(`<meta property="og:image" content="https://bedroom\\.davidteju\\.dev/og/${slug}\\.png">`), slug + " image");
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    assert.match(html, new RegExp(`location\\.replace\\("/\\?layout=${slug}"\\)`), slug + " redirect");
    assert.deepEqual(pngSize(fs.readFileSync(new URL(`og/${slug}.png`, dir))), [1200, 630], slug + " image size");
  }
  assert.match(read("index.html"), /<meta property="og:image" content="https:\/\/bedroom\.davidteju\.dev\/og\/window\.png">/);
});

test("the 3D toolbar has a view picker, a show menu and a simulate-lights switch", () => {
  const html = read("index.html");
  const views = [...html.match(/<select id="viewSel"[^>]*>([\s\S]*?)<\/select>/)[1].matchAll(/<option value="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(views, ["3d", "top", "N", "E", "S", "W", "inside"]);
  assert.doesNotMatch(html, /data-view=/);
  const menu = html.match(/<details id="showMenu"[\s\S]*?<\/details>/)[0];
  assert.deepEqual([...menu.matchAll(/data-toggle="(\w+)"/g)].map(m => m[1]), ["grid", "swings", "names"]);
  assert.match(html, /<button data-toggle="lamps"><i class="glow"><\/i>Simulate lights<\/button>/);
  assert.doesNotMatch(html, /Lamps only/);
});

test("the simulate-lights switch keeps its bulb controls beside it without stretching the toolbar", () => {
  const html = read("index.html");
  // A flex row stretches every item to the tallest one unless told otherwise.
  assert.match(html, /\.bar \{[^}]*align-items: center/);
  const group = html.match(/<span class="lights">[\s\S]*?<\/span><\/span>/)[0];
  assert.match(group, /data-toggle="lamps"/);
  assert.match(group, /id="bulbCtl"/);
  assert.deepEqual([...group.matchAll(/data-bulb-mode="(\w+)"/g)].map(m => m[1]), ["white", "colour"]);
});

test("each plan row stacks its note under the name and ends in a same-size copy-link icon", () => {
  const core = read("core.js"), css = read("core.css");
  assert.match(core, /<span class="pl"><span>\$\{esc\(p\.name\)\}<\/span><small>\$\{note\}<\/small><\/span>/);
  assert.match(core, /<button class="link" data-copy="[^"]*" title="Copy a link that opens this layout" aria-label="Copy link"><svg/);
  // a click lands on the icon inside the button, so the handler must look up from the target
  assert.match(core, /e\.target\.closest\("\[data-copy\]"\)/);
  assert.match(css, /ul\.plans \.link \{[^}]*width: 28px/);
});

test("every sidebar section but Selected collapses, and the room section starts collapsed", () => {
  const run = loadCore();
  const side = run("SIDEBAR");
  assert.deepEqual([...side.matchAll(/<div class="card"[^>]*>/g)].map(m => m[0]), ['<div class="card" id="selCard">']);
  const sections = [...side.matchAll(/<details class="card" data-section="(\w+)"( open)?>\s*<summary>/g)].map(m => [m[1], !!m[2]]);
  assert.deepEqual(sections, [["furniture", true], ["plans", true], ["room", false], ["save", true], ["keys", true]]);
  assert.doesNotMatch(side, /<h2>/);
});

test("the snowboard, its boots, a ladder shelf and a bean bag are pieces both views draw", () => {
  const run = loadCore();
  const kinds = { board: "Snowboard wall rack", boots: "Snowboard boots on a tray", ladder: "Ladder shelf", beanbag: "Bean bag" };
  for (const [kind, name] of Object.entries(kinds)) {
    assert.ok(run(`KINDS.${kind}`), kind + " is a kind");
    assert.equal(run(`PRESETS.filter(p => p[7] === "${kind}").map(p => p[0]).join()`), name, kind + " has a preset");
    assert.equal(run(`kindOf({ name: "${name}" })`), kind, name + " is recognised by name");
    assert.match(read("index.html"), new RegExp(`^\\s+${kind}\\(g,`, "m"), "the 3D view has a " + kind + " model");
    assert.match(read("plan.html"), new RegExp(`k === "${kind}"`), "the 2D plan draws " + kind);
  }
});

test("every ready-made layout hangs the snowboard upright on a wall over its boots", () => {
  const run = loadCore();
  const out = JSON.parse(run(`JSON.stringify(BUILTIN.map(p => {
    state.items = p.items;
    const board = p.items.filter(i => i.kind === "board"), boots = p.items.filter(i => i.kind === "boots");
    if (board.length !== 1 || boots.length !== 1) return { name: p.name, board: board.length, boots: boots.length };
    const b = board[0], t = boots[0], c = clearances(b);
    return { name: p.name, onWall: Math.min(c.N, c.S, c.E, c.W) <= state.room.flush, upright: b.h > 4 * Math.max(b.w, b.d),
      clearsBoots: b.z >= t.z + t.h, over: overlap(b, t), bootsOnFloor: t.z === 0 };
  }))`));
  for (const p of out) assert.deepEqual(p, { name: p.name, onWall: true, upright: true, clearsBoots: true, over: true, bootsOnFloor: true });
});

test("the window layout has a ladder shelf on the in-push instead of an open clothes rack", () => {
  const run = loadCore();
  const out = JSON.parse(run(`(() => {
    const plan = BUILTIN.find(p => p.name === "Bed facing the window");
    state.items = plan.items;
    return JSON.stringify({
      racks: plan.items.filter(i => i.kind === "rack").length,
      ladder: plan.items.filter(i => i.kind === "ladder").map(i => [i.x, i.y, i.w, i.d, i.h, frontDir(i)]),
      count: plan.items.length, mentionsRack: /RIGGA|rack/.test(plan.why)
    });
  })()`));
  assert.deepEqual(out, { racks: 0, ladder: [[101, 48, 24, 16, 72, "S"]], count: 22, mentionsRack: false });
});

test("the bean bag is one sagging fabric sack, not stacked spheres", () => {
  const html = read("index.html");
  const model = html.match(/^\s+beanbag\(g,[\s\S]*?^\s{2}\},$/m)[0];
  assert.match(model, /sackGeometry\(/, "built from one deformed sack");
  assert.match(model, /fabricMat\(/, "covered in a woven fabric");
  assert.doesNotMatch(model, /SphereGeometry/);
  assert.match(html, /function sackGeometry\(/);
});

test("Print waits for the page to get ready before opening the browser's print dialog", () => {
  const run = loadCore();
  assert.equal(run("typeof onPrint"), "function", "pages can hook printing");
  assert.match(read("core.js"), /\$\("#print"\)\.addEventListener\("click", async \(\) => \{ await onPrint\(\); window\.print\(\); \}\)/);
});

test("the 3D view prints a still picture, since the canvas keeps its screen size and is not redrawn for paper", () => {
  const html = read("index.html");
  assert.match(html, /onPrint = takePrintShot/);
  const shot = html.match(/async function takePrintShot\(\) \{[\s\S]*?\n\}/)[0];
  assert.match(shot, /renderer\.render\(scene, camera\)/, "draws a fresh frame first");
  assert.match(shot, /toDataURL\(/);
  assert.match(shot, /\.decode\(\)/, "waits for the picture before printing");
  assert.match(html, /addEventListener\("beforeprint"/, "Ctrl/Cmd+P gets the picture too");
  assert.match(html, /addEventListener\("afterprint"/);
  const print = html.match(/@media print \{[^\n]*\}/)[0];
  assert.match(print, /#stage canvas, #labels \{ display: none !important; \}/);
  assert.match(print, /#printShot \{ display: block;/);
  assert.match(html, /#printShot \{ display: none; \}/);
});
