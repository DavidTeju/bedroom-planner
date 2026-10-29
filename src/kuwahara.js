// A painter's filter (Kuwahara): each pixel takes the average colour of whichever of the four
// r-pixel squares touching it varies least, so flat areas lose their speckle while edges stay sharp.
// Squares are clipped to the image, so nothing wraps round from the far side. RGBA in, RGBA out.
export function kuwahara(src, w, h, r) {
  const W = w + 1, sum = [0, 1, 2, 3, 4].map(() => new Float64Array(W * (h + 1)));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, l = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    const v = [src[i], src[i + 1], src[i + 2], l, l * l], o = (y + 1) * W + x + 1;
    for (let c = 0; c < 5; c++) sum[c][o] = v[c] + sum[c][o - 1] + sum[c][o - W] - sum[c][o - W - 1];
  }
  const box = (c, x0, y0, x1, y1) => sum[c][(y1 + 1) * W + x1 + 1] - sum[c][y0 * W + x1 + 1] - sum[c][(y1 + 1) * W + x0] + sum[c][y0 * W + x0];
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = Infinity, col = null;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x0 = Math.max(0, Math.min(x, x + sx * r)), x1 = Math.min(w - 1, Math.max(x, x + sx * r));
      const y0 = Math.max(0, Math.min(y, y + sy * r)), y1 = Math.min(h - 1, Math.max(y, y + sy * r));
      const n = (x1 - x0 + 1) * (y1 - y0 + 1), mean = box(3, x0, y0, x1, y1) / n, v = box(4, x0, y0, x1, y1) / n - mean * mean;
      if (v < best) { best = v; col = [0, 1, 2].map(c => box(c, x0, y0, x1, y1) / n); }
    }
    const i = (y * w + x) * 4;
    out[i] = col[0]; out[i + 1] = col[1]; out[i + 2] = col[2]; out[i + 3] = src[i + 3];
  }
  return out;
}
