// A painter's filter (Kuwahara): each pixel takes the average colour of whichever of the four
// r-pixel squares touching it varies least, so flat areas lose their speckle while edges stay sharp.
// Squares are clipped to the image, so nothing wraps round from the far side. RGBA in, RGBA out.
const QUADRANTS: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
export function kuwahara(src: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  // Summed-area tables, one row and column larger than the image: red, green, blue, luminance and
  // luminance squared. Every index below lies inside the image or its table, so reads are asserted.
  const W = w + 1, size = W * (h + 1);
  const sum = [0, 1, 2, 3, 4].map(() => new Float64Array(size));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, red = src[i]!, green = src[i + 1]!, blue = src[i + 2]!, l = 0.299 * red + 0.587 * green + 0.114 * blue;
    const v = [red, green, blue, l, l * l], o = (y + 1) * W + x + 1;
    for (let c = 0; c < 5; c++) { const t = sum[c]!; t[o] = v[c]! + t[o - 1]! + t[o - W]! - t[o - W - 1]!; }
  }
  const box = (c: number, x0: number, y0: number, x1: number, y1: number) => {
    const t = sum[c]!;
    return t[(y1 + 1) * W + x1 + 1]! - t[y0 * W + x1 + 1]! - t[(y1 + 1) * W + x0]! + t[y0 * W + x0]!;
  };
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = Infinity, red = 0, green = 0, blue = 0;
    for (const [sx, sy] of QUADRANTS) {
      const x0 = Math.max(0, Math.min(x, x + sx * r)), x1 = Math.min(w - 1, Math.max(x, x + sx * r));
      const y0 = Math.max(0, Math.min(y, y + sy * r)), y1 = Math.min(h - 1, Math.max(y, y + sy * r));
      const n = (x1 - x0 + 1) * (y1 - y0 + 1), mean = box(3, x0, y0, x1, y1) / n, v = box(4, x0, y0, x1, y1) / n - mean * mean;
      if (v < best) { best = v; red = box(0, x0, y0, x1, y1) / n; green = box(1, x0, y0, x1, y1) / n; blue = box(2, x0, y0, x1, y1) / n; }
    }
    const i = (y * w + x) * 4;
    out[i] = red; out[i + 1] = green; out[i + 2] = blue; out[i + 3] = src[i + 3]!;
  }
  return out;
}
