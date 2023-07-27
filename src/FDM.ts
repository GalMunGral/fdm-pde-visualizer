import { clamp, zeros } from "./utils";

type Fn = (i: number, j: number) => number;

type Helpers = {
  u: Fn;
  v: Fn;
  dudx: Fn;
  dudy: Fn;
  d2udx2: Fn;
  d2udy2: Fn;
};

type Derivative = (
  i: number,
  j: number,
  { u, v, dudx, dudy, d2udx2, d2udy2 }: Helpers
) => number;

export function FiniteDifference(
  U: Array<Array<number>>,
  V: Array<Array<number>>,
  dudt: Derivative,
  dvdt: Derivative,
  h: number,
  dt: number
) {
  const m = U.length;
  const n = U[0].length;

  type Fn = (i: number, j: number) => number;
  const u: Fn = (i, j) => U[(i + m) % m][(j + n) % n];
  const v: Fn = (i, j) => V[(i + m) % m][(j + n) % n];
  const dudx: Fn = (i, j) => (u(i, j + 1) - u(i, j - 1)) / (2 * h);
  const dudy: Fn = (i, j) => (u(i + 1, j) - u(i - 1, j)) / (2 * h);
  const d2udx2: Fn = (i, j) =>
    (u(i, j - 1) - 2 * u(i, j) + u(i, j + 1)) / h ** 2;
  const d2udy2: Fn = (i, j) =>
    (u(i - 1, j) - 2 * u(i, j) + u(i + 1, j)) / h ** 2;

  function step(iterations: number) {
    let dMax = -Infinity;
    while (iterations--) {
      let U$ = zeros(m, n);
      let V$ = zeros(m, n);
      for (let i = 0; i < m; ++i) {
        for (let j = 0; j < n; ++j) {
          const du = dt * dudt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
          const dv = dt * dvdt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
          if (isNaN(du) || isNaN(dv)) throw new Error("NaN");
          dMax = Math.max(dMax, Math.abs(du), Math.abs(dv));
          U$[i][j] = U[i][j] + du;
          V$[i][j] = V[i][j] + dv;
        }
      }
      U = U$;
      V = V$;
    }
    console.debug(dMax);
  }

  function transfer(imageData: Uint8ClampedArray, min: number, max: number) {
    for (let i = 0; i < m; ++i) {
      for (let j = 0; j < n; ++j) {
        const base = (m - 1 - i) * n + j;
        const t = (U[i][j] - min) / (max - min);
        const I = 255 * clamp(t, 0, 1);
        imageData[base * 4] = I;
        imageData[base * 4 + 1] = I;
        imageData[base * 4 + 2] = I;
        imageData[base * 4 + 3] = 255;
      }
    }
  }

  return {
    step,
    transfer,
  };
}
