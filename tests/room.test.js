import { test, vi } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";

const file = name => fs.readFileSync(new URL("../" + name, import.meta.url), "utf8");
async function loadCore() {
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
  vi.resetModules();
  return import("../src/core.js");
}

test("the room, its doors and window, the layouts and the prints come from the room file, not the code", async () => {
  const room = JSON.parse(file("rooms/femi.json"));
  const { DEFAULT, BUILTIN, PRINTS, THEME, LINKS } = await loadCore();
  assert.deepEqual(DEFAULT.room, room.room);
  assert.deepEqual(DEFAULT.openings, room.openings);
  assert.deepEqual(DEFAULT.items.map(i => i.name), room.start.map(i => i.name));
  assert.deepEqual(THEME, room.theme);
  assert.deepEqual(Object.keys(PRINTS), Object.keys(room.prints));
  assert.deepEqual(BUILTIN.map(p => [p.id, p.name, p.items.length]), room.layouts.map(l => [l.id, l.name, l.items.length]));
  assert.deepEqual(LINKS, Object.fromEntries(room.layouts.filter(l => l.slug).map(l => [l.slug, l.id])));
  assert.doesNotMatch(file("src/core.js"), /VILHATTEN|Laurel Garland|Great Sand Dunes|Bed facing the window/, "nothing about one room is written into the code");
});

test("a room file's pieces fill in their colour, solidity and headboard from their kind", async () => {
  const { BUILTIN, KIND_COLOR } = await loadCore();
  const items = BUILTIN.flatMap(p => p.items);
  const rug = items.find(i => i.kind === "rug"), bed = items.find(i => i.kind === "bed");
  assert.deepEqual([rug.solid, rug.color], [false, KIND_COLOR.rug]);
  assert.deepEqual([bed.solid, bed.headH, bed.headT], [true, 46, 3]);
});

test("loading a saved room keeps its own ceiling and closet door", async () => {
  const { normalize } = await loadCore();
  const s = normalize({
    room: { W: 120, L: 140, bx: 0, by: 0, H: 96 },
    openings: [{ id: "closet", name: "Closet", kind: "closet", wall: "W", off: 12, w: 30, sill: 0, h: 80, hinge: "start", swing: "in" }],
    items: []
  });
  assert.equal(s.room.H, 96);
  assert.deepEqual([s.openings[0].off, s.openings[0].hinge], [12, "start"]);
});
