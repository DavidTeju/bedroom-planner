// How far a door has swung: t runs from 0 (shut) to 1 (open) and moves toward want, taking 0.55 s
// end to end. elapsed is the time since the last frame, in milliseconds. It can come out negative,
// because requestAnimationFrame stamps a frame with when it began, so that counts as no time at all;
// a stalled frame counts as 100 ms, so the door never jumps.
export interface DoorSwing { t: number; want: 0 | 1 }
export function stepDoor(door: DoorSwing, elapsed: number): void {
  const dt = Math.min(Math.max(elapsed / 1000, 0), 0.1);
  door.t = Math.min(Math.max(door.t + (door.want ? 1 : -1) * dt / 0.55, 0), 1);
}
