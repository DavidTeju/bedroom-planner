// The room the planner opens. To plan a different room, copy rooms/femi.json, measure, and import
// your file here instead.
import data from "../rooms/femi.json";
import { among, HINGES, ITEM_KINDS, OPENING_KINDS, SWINGS, WALL_SIDES } from "./types.ts";
import type { ItemSpec, LayoutSpec, Opening, RoomFile } from "./types.ts";

type Obj = Record<string, unknown>;

class RoomFileError extends Error {}
const fail = (path: string, what: string): never => { throw new RoomFileError(`${path} ${what}`); };
const obj = (v: unknown, path: string): Obj => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : fail(path, "must be an object"));
const list = (v: unknown, path: string): unknown[] => (Array.isArray(v) ? v : fail(path, "must be a list"));
const num = (v: unknown, path: string): number => (typeof v === "number" && Number.isFinite(v) ? v : fail(path, "must be a number"));
const str = (v: unknown, path: string): string => (typeof v === "string" ? v : fail(path, "must be text"));
function oneOf<T extends string>(options: readonly T[], v: unknown, path: string): T {
  return typeof v === "string" && among(options, v) ? v : fail(path, "must be one of " + options.join(", "));
}
function opening(v: unknown, path: string): Opening {
  const o = obj(v, path);
  return {
    id: str(o.id, path + ".id"), name: str(o.name, path + ".name"), kind: oneOf(OPENING_KINDS, o.kind, path + ".kind"),
    wall: oneOf(WALL_SIDES, o.wall, path + ".wall"), off: num(o.off, path + ".off"), w: num(o.w, path + ".w"),
    sill: num(o.sill, path + ".sill"), h: num(o.h, path + ".h"), hinge: oneOf(HINGES, o.hinge, path + ".hinge"),
    swing: oneOf(SWINGS, o.swing, path + ".swing")
  };
}

function item(v: unknown, path: string, prints: Obj): ItemSpec {
  const o = obj(v, path);
  const photos = o.photos === undefined ? undefined : list(o.photos, path + ".photos").map((p, i) => {
    const key = str(p, `${path}.photos[${i}]`);
    return key in prints ? key : fail(path + ".photos", `names "${key}", which is not in prints`);
  });
  const spec: ItemSpec = {
    name: str(o.name, path + ".name"), kind: oneOf(ITEM_KINDS, o.kind, path + ".kind"),
    x: num(o.x, path + ".x"), y: num(o.y, path + ".y"), w: num(o.w, path + ".w"), d: num(o.d, path + ".d"), h: num(o.h, path + ".h")
  };
  if (o.id !== undefined) spec.id = str(o.id, path + ".id");
  if (o.z !== undefined) spec.z = num(o.z, path + ".z");
  if (o.headSide !== undefined) spec.headSide = oneOf(WALL_SIDES, o.headSide, path + ".headSide");
  if (o.color !== undefined) spec.color = str(o.color, path + ".color");
  if (o.face !== undefined) spec.face = oneOf([...WALL_SIDES, "auto"] as const, o.face, path + ".face");
  if (o.turn !== undefined) spec.turn = num(o.turn, path + ".turn");
  if (photos) spec.photos = photos;
  if (o.lm !== undefined) spec.lm = num(o.lm, path + ".lm");
  if (o.down !== undefined) spec.down = num(o.down, path + ".down");
  return spec;
}

// Checks a room file and returns it typed, or throws naming the first field that is wrong.
export function parseRoom(v: unknown): RoomFile {
  const f = obj(v, "the room file");
  const r = obj(f.room, "room"), t = obj(f.theme, "theme"), prints = obj(f.prints, "prints");
  const text = (key: string) => str(t[key], "theme." + key);
  return {
    name: str(f.name, "name"),
    room: { W: num(r.W, "room.W"), L: num(r.L, "room.L"), bx: num(r.bx, "room.bx"), by: num(r.by, "room.by"), H: num(r.H, "room.H"), flush: num(r.flush, "room.flush"), near: num(r.near, "room.near") },
    openings: list(f.openings, "openings").map((o, i) => opening(o, `openings[${i}]`)),
    start: list(f.start, "start").map((s, i) => item(s, `start[${i}]`, prints)),
    theme: { name: text("name"), walls: text("walls"), floor: text("floor"), sheets: text("sheets"), throw: text("throw"), accent: text("accent"), wardrobePaint: text("wardrobePaint"), chestPaint: text("chestPaint") },
    prints: Object.fromEntries(Object.entries(prints).map(([key, p]) => {
      const o = obj(p, `prints.${key}`), at = (k: string) => `prints.${key}.${k}`;
      return [key, { title: str(o.title, at("title")), place: str(o.place, at("place")), taken: str(o.taken, at("taken")), w: num(o.w, at("w")), h: num(o.h, at("h")) }];
    })),
    layouts: list(f.layouts, "layouts").map((l, i): LayoutSpec => {
      const o = obj(l, `layouts[${i}]`), at = (k: string) => `layouts[${i}].${k}`;
      const layout: LayoutSpec = {
        id: str(o.id, at("id")), name: str(o.name, at("name")), note: str(o.note, at("note")), why: str(o.why, at("why")),
        items: list(o.items, at("items")).map((s, j) => item(s, `layouts[${i}].items[${j}]`, prints))
      };
      if (o.slug !== undefined) layout.slug = str(o.slug, at("slug"));
      return layout;
    })
  };
}

const ROOM: RoomFile = parseRoom(data);
export default ROOM;
