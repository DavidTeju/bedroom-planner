import { test } from "vitest";
import assert from "node:assert/strict";
import type { LayoutSpec, RoomFile } from "../src/types.ts";
import { file, loadCore } from "./helpers.ts";

test("the room, its doors and window, the layouts and the prints come from the room file, not the code", async () => {
  const room: RoomFile = JSON.parse(file("rooms/femi.json"));
  const { DEFAULT, BUILTIN, PRINTS, THEME, LINKS } = await loadCore();
  assert.deepEqual(DEFAULT.room, room.room);
  assert.deepEqual(DEFAULT.openings, room.openings);
  assert.deepEqual(DEFAULT.items.map(i => i.name), room.start.map(i => i.name));
  assert.deepEqual(THEME, room.theme);
  assert.deepEqual(Object.keys(PRINTS), Object.keys(room.prints));
  assert.deepEqual(BUILTIN.map(p => [p.id, p.name, p.items.length]), room.layouts.map(l => [l.id, l.name, l.items.length]));
  assert.deepEqual(LINKS, Object.fromEntries(room.layouts.filter((l: LayoutSpec) => l.slug).map(l => [l.slug, l.id])));
  assert.doesNotMatch(file("src/core.ts"), /VILHATTEN|Laurel Garland|Great Sand Dunes|Bed facing the window/, "nothing about one room is written into the code");
});

test("a room file's pieces fill in their colour, solidity and headboard from their kind", async () => {
  const { BUILTIN, KIND_COLOR } = await loadCore();
  const items = BUILTIN.flatMap(p => p.items);
  const rug = items.find(i => i.kind === "rug"), bed = items.find(i => i.kind === "bed");
  assert.ok(rug && bed);
  assert.deepEqual([rug.solid, rug.color], [false, KIND_COLOR.rug]);
  assert.deepEqual([bed.solid, bed.headH, bed.headT], [true, 46, 3]);
});

test("loading a saved room keeps its own ceiling and closet door", async () => {
  const { normalize } = await loadCore();
  const s = normalize({
    planId: null,
    room: { W: 120, L: 140, bx: 0, by: 0, H: 96, flush: 3, near: 24 },
    openings: [{ id: "closet", name: "Closet", kind: "closet", wall: "W", off: 12, w: 30, sill: 0, h: 80, hinge: "start", swing: "in" }],
    items: []
  });
  assert.equal(s.room.H, 96);
  assert.deepEqual([s.openings[0]?.off, s.openings[0]?.hinge], [12, "start"]);
});

test("a room file with a mistake is refused with a message that says where", async () => {
  const { parseRoom } = await import("../src/room.ts");
  const good = JSON.parse(file("rooms/femi.json"));
  assert.equal(parseRoom(good).layouts.length, 3);
  const bad = (change: (r: any) => void) => { const r = structuredClone(good); change(r); return () => parseRoom(r); };
  assert.throws(bad(r => { r.openings[1].wall = "North"; }), /openings\[1\]\.wall must be one of N, E, S, W/);
  assert.throws(bad(r => { r.layouts[0].items[2].kind = "sofa"; }), /layouts\[0\]\.items\[2\]\.kind must be one of bed, /);
  assert.throws(bad(r => { delete r.room.H; }), /room\.H must be a number/);
  assert.throws(bad(r => { r.layouts[1].items[0].photos = ["nowhere"]; }), /layouts\[1\]\.items\[0\]\.photos names "nowhere", which is not in prints/);
});
