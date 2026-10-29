// Shapes shared by the planner, its pages and the room files. Every length is in inches.

export const WALL_SIDES = ["N", "E", "S", "W"] as const;
export type Wall = (typeof WALL_SIDES)[number];

export const ITEM_KINDS = [
  "bed", "bench", "ottoman", "dresser", "wardrobe", "rack", "shoe", "nightstand", "shelf", "ladder", "beanbag", "board",
  "boots", "chair", "rug", "mirror", "art", "textile", "pegs", "lamp", "sconce", "plant", "other"
] as const;
export type Kind = (typeof ITEM_KINDS)[number];

export const OPENING_KINDS = ["door", "closet", "window"] as const;
export type OpeningKind = (typeof OPENING_KINDS)[number];
export const HINGES = ["none", "start", "end"] as const;
export type Hinge = (typeof HINGES)[number];
export const SWINGS = ["in", "out"] as const;

// True when v is one of list's values, and says so to the type checker.
export const among = <T extends string>(list: readonly T[], v: string): v is T => (list as readonly string[]).includes(v);

// W runs west to east and L north to south. The in-push is a bx by by box cut from the north-east
// corner. A piece within flush of a wall counts as on it, within near as close to it.
export interface Room { W: number; L: number; bx: number; by: number; H: number; flush: number; near: number }

// A door or window: off is where it starts along its wall, from the west or north end.
export interface Opening {
  id: string;
  name: string;
  kind: OpeningKind;
  wall: Wall;
  off: number;
  w: number;
  sill: number;
  h: number;
  hinge: Hinge;
  swing: (typeof SWINGS)[number];
}

// A piece of furniture: (x, y) is its north-west corner, w its east-west width, d its north-south
// depth, h its height and z how far off the floor it sits. A headboard headH tall and headT thick
// runs along its headSide.
export interface Item {
  id: string;
  name: string;
  kind?: Kind; // saves from before kinds existed go by name
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  z: number;
  color: string;
  solid: boolean;
  headH: number;
  headT: number;
  headSide: Wall;
  face?: Wall | "auto";
  turn?: number; // degrees clockwise, for the pieces that can sit at any angle
  photos?: string[];
  lm?: number; // a light's lumens, when it is not the usual bulb
  down?: number; // the share of its light a shade sends downward
}

// Any box on the floor plan, such as a piece's footprint or the in-push.
export interface Rect { x: number; y: number; w: number; d: number }

export interface Plan {
  id: string;
  name: string;
  note?: string;
  why?: string;
  items: Item[];
}

export interface State {
  planId: string | null;
  room: Room;
  openings: Opening[];
  items: Item[];
}

export interface Print {
  title: string;
  place: string;
  taken: string; // YYYY-MM
  w: number; // the picture's own pixel size
  h: number;
  file: string;
}

export interface Theme {
  name: string;
  walls: string;
  floor: string;
  sheets: string;
  throw: string;
  accent: string;
  wardrobePaint: string;
  chestPaint: string;
}

// A piece as a room file writes it. Colour, solidity and the headboard come from its kind unless given.
export interface ItemSpec {
  id?: string;
  name: string;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  z?: number;
  headSide?: Wall;
  color?: string;
  face?: Wall | "auto";
  turn?: number;
  photos?: string[];
  lm?: number;
  down?: number;
}

export interface LayoutSpec {
  id: string;
  slug?: string; // a layout with a slug opens from /<slug>/
  name: string;
  note: string;
  why: string;
  items: ItemSpec[];
}

export interface RoomFile {
  name: string;
  room: Room;
  openings: Opening[];
  start: ItemSpec[];
  theme: Theme;
  prints: Record<string, Omit<Print, "file">>;
  layouts: LayoutSpec[];
}
