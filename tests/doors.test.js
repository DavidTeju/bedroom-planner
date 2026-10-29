import { test } from "vitest";
import assert from "node:assert/strict";
import { stepDoor } from "../src/doors.js";

test("a shut door stays shut when the first frame's timestamp is earlier than the page's clock", () => {
  // requestAnimationFrame stamps a frame with when it began, which can be before the module read performance.now()
  const door = { t: 0, want: 0 };
  stepDoor(door, -800);
  assert.equal(door.t, 0);
});

test("a door opens and closes over about half a second, and a long pause does not jump it", () => {
  const door = { t: 0, want: 1 };
  for (let i = 0; i < 5; i++) stepDoor(door, 55);
  assert.ok(Math.abs(door.t - 0.5) < 1e-9, "half open after 275 ms: " + door.t);
  stepDoor(door, 5000);
  assert.ok(Math.abs(door.t - (0.5 + 0.1 / 0.55)) < 1e-9, "a stalled frame counts as 100 ms: " + door.t);
  door.want = 0;
  for (let i = 0; i < 10; i++) stepDoor(door, 100);
  assert.equal(door.t, 0);
});
