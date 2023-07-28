import { clamp, zeros } from "./utils";

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
    // let dMax = -Infinity;
    while (iters--) {
      let U$ = zeros(m, n);
      let V$ = zeros(m, n);
      for (let i = 0; i < m; ++i) {
        for (let j = 0; j < n; ++j) {
          const du = dt * dudt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
          const dv = dt * dvdt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
          if (isNaN(du) || isNaN(dv)) throw new Error("NaN");
          // dMax = Math.max(dMax, Math.abs(du), Math.abs(dv));
          U$[i][j] = U[i][j] + du;
          V$[i][j] = V[i][j] + dv;
        }
      }
      U = U$;
      V = V$;
    }
    // console.debug(dMax);
  }

  function transfer(imageData: ImageData, min: Float, max: Float): void {
    const { width, height, data } = imageData;
    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        const x = (n / width) * j;
        const y = (m / height) * i;
        const x1 = Math.floor(x);
        const x2 = x1 + 1;
        const y1 = Math.floor(y);
        const y2 = y1 + 1;
        const tx = (x - x1) / (x2 - x1);
        const ty = (y - y1) / (y2 - y1);

        const v =
          u(x1, y1) * (1 - tx) * (1 - ty) +
          u(x1, y2) * (1 - tx) * ty +
          u(x2, y1) * tx * (1 - ty) +
          u(x2, y2) * tx * ty;

        const I = 255 * clamp((v - min) / (max - min), 0, 1);
        const base = (height - 1 - i) * width + j;
        data[base * 4] = I;
        data[base * 4 + 1] = I;
        data[base * 4 + 2] = I;
        data[base * 4 + 3] = 255;
      }
    }
  }

  return {
    step,
    transfer,
  };
}
