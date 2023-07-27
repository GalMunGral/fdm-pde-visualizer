import { clamp, zeros } from "./utils";

type Fn = (i: Int, j: Int) => Float;
type HelperKeys = "u" | "v" | "dudx" | "dudy" | "d2udx2" | "d2udy2";
type Helper = Record<HelperKeys, Fn>;
type UserFn = (i: Int, j: Int, helper: Helper) => Float;

export function FDM(
  U: Grid,
  V: Grid,
  dudt: UserFn,
  dvdt: UserFn,
  h: Float,
  dt: Float
) {
  const m = U.length;
  const n = U[0].length;

  const u: Fn = (i, j) => U[(i + m) % m][(j + n) % n];
  const v: Fn = (i, j) => V[(i + m) % m][(j + n) % n];
  const dudx: Fn = (i, j) => (u(i, j + 1) - u(i, j - 1)) / (2 * h);
  const dudy: Fn = (i, j) => (u(i + 1, j) - u(i - 1, j)) / (2 * h);
  const d2udx2: Fn = (i, j) =>
    (u(i, j - 1) - 2 * u(i, j) + u(i, j + 1)) / h ** 2;
  const d2udy2: Fn = (i, j) =>
    (u(i - 1, j) - 2 * u(i, j) + u(i + 1, j)) / h ** 2;

  function step(iters: Int): void {
    let dMax = -Infinity;
    while (iters--) {
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

  function transfer(
    imageData: Uint8ClampedArray,
    min: Float,
    max: Float
  ): void {
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
