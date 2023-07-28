export function makeGrid(m: Int, n: Int, fn: (i: Int, j: Int) => Float): Grid {
  return Array(m)
    .fill(0)
    .map((_, i) =>
      Array(n)
        .fill(0)
        .map((_, j) => fn(i, j))
    );
}

export function zeros(m: Int, n: Int): Grid {
  return makeGrid(m, n, () => 0);
}

export function random(m: Int, n: Int): Grid {
  return makeGrid(m, n, () => Math.random());
}

export function sinusoid1D(m: Int, n: Int, kx: Float, ky: Float): Grid {
  return makeGrid(m, n, (i, j) => Math.sin(kx * j + ky * i));
}

export function sinusoid2D(m: Int, n: Int, k: Float): Grid {
  return makeGrid(m, n, (i, j) =>
    Math.sin(k * Math.sqrt((j - n / 2) ** 2 + (i - m / 2) ** 2))
  );
}

export function clamp(v: Float, min: Float, max: Float): Float {
  return Math.max(min, Math.min(max, v));
}
