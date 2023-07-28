(() => {
  // src/utils.ts
  function makeGrid(m, n, fn) {
    return Array(m).fill(0).map(
      (_, i) => Array(n).fill(0).map((_2, j) => fn(i, j))
    );
  }
  function zeros(m, n) {
    return makeGrid(m, n, () => 0);
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // src/FDM.ts
  function FDM(U, V, dudt, dvdt, h, dt) {
    const m = U.length;
    const n = U[0].length;
    const u = (i, j) => U[(i + m) % m][(j + n) % n];
    const v = (i, j) => V[(i + m) % m][(j + n) % n];
    const dudx = (i, j) => (u(i, j + 1) - u(i, j - 1)) / (2 * h);
    const dudy = (i, j) => (u(i + 1, j) - u(i - 1, j)) / (2 * h);
    const d2udx2 = (i, j) => (u(i, j - 1) - 2 * u(i, j) + u(i, j + 1)) / h ** 2;
    const d2udy2 = (i, j) => (u(i - 1, j) - 2 * u(i, j) + u(i + 1, j)) / h ** 2;
    function step(iters) {
      while (iters--) {
        let U$ = zeros(m, n);
        let V$ = zeros(m, n);
        for (let i = 0; i < m; ++i) {
          for (let j = 0; j < n; ++j) {
            const du = dt * dudt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
            const dv = dt * dvdt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
            if (isNaN(du) || isNaN(dv))
              throw new Error("NaN");
            U$[i][j] = U[i][j] + du;
            V$[i][j] = V[i][j] + dv;
          }
        }
        U = U$;
        V = V$;
      }
    }
    function transfer(imageData2, min, max) {
      const { width: width2, height: height2, data } = imageData2;
      for (let i = 0; i < height2; ++i) {
        for (let j = 0; j < width2; ++j) {
          const x = n / width2 * j;
          const y = m / height2 * i;
          const x1 = Math.floor(x);
          const x2 = x1 + 1;
          const y1 = Math.floor(y);
          const y2 = y1 + 1;
          const tx = (x - x1) / (x2 - x1);
          const ty = (y - y1) / (y2 - y1);
          const v2 = x == x1 || y == y1 ? 0 : u(x1, y1) * (1 - tx) * (1 - ty) + u(x1, y2) * (1 - tx) * ty + u(x2, y1) * tx * (1 - ty) + u(x2, y2) * tx * ty;
          const I = 255 * clamp((v2 - min) / (max - min), 0, 1);
          const base = (height2 - 1 - i) * width2 + j;
          data[base * 4] = I;
          data[base * 4 + 1] = I;
          data[base * 4 + 2] = I;
          data[base * 4 + 3] = 255;
        }
      }
    }
    return {
      step,
      transfer
    };
  }

  // src/index.ts
  var ctx = document.querySelector("canvas")?.getContext("2d");
  var height = ctx.canvas.height;
  var width = ctx.canvas.width;
  var imageData = new ImageData(width, height);
  function gaussians(points) {
    return (i, j) => {
      let u = 0;
      for (const [ci, cj] of points) {
        u += Math.exp(-0.1 * ((i - ci) ** 2 + (j - cj) ** 2));
      }
      return 2 * u - 1;
    };
  }
  var rafHandle = -1;
  (function reset() {
    cancelAnimationFrame(rafHandle);
    const N = 50;
    const initialValue = gaussians(
      Array(20).fill(0).map(
        () => Array(2).fill(0).map(() => Math.random() * N)
      )
    );
    const Sol = FDM(
      makeGrid(N, N, initialValue),
      zeros(50, 50),
      (i, j, { v }) => v(i, j),
      (i, j, { d2udx2, d2udy2 }) => 100 * (d2udx2(i, j) + d2udy2(i, j)),
      1,
      1e-4
    );
    rafHandle = requestAnimationFrame(function render() {
      Sol.step(100);
      Sol.transfer(imageData, -1, 1);
      ctx.putImageData(imageData, 0, 0);
      rafHandle = requestAnimationFrame(render);
    });
    setTimeout(reset, 5e3);
  })();
})();
