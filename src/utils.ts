export function zeros(m: number, n: number): Array<Array<number>> {
  return Array(m)
    .fill(0)
    .map(() => Array(n).fill(0));
}

export function random(m: number, n: number) {
  return Array(m)
    .fill(0)
    .map((_, i) =>
      Array(n)
        .fill(0)
        .map((_, j) => Math.random())
    );
}

export function sinusoid1D(m: number, n: number, nx: number, ny: number) {
  return Array(m)
    .fill(0)
    .map((_, i) =>
      Array(n)
        .fill(0)
        .map((_, j) =>
          Math.sin(((ny * 2 * Math.PI) / m) * i + ((nx * 2 * Math.PI) / n) * j)
        )
    );
}

export function sinusoid2D(m: number, n: number, k: number) {
  return Array(m)
    .fill(0)
    .map((_, i) =>
      Array(n)
        .fill(0)
        .map((_, j) =>
          Math.sin(k * Math.sqrt((i - m / 2) ** 2 + (j - n / 2) ** 2))
        )
    );
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
