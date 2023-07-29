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
    function transfer(imageData, min, max) {
      const { width, height, data } = imageData;
      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          const x = n / width * j;
          const y = m / height * i;
          const j1 = Math.floor(x);
          const j2 = j1 + 1;
          const i1 = Math.floor(y);
          const i2 = i1 + 1;
          const tx = (x - j1) / (j2 - j1);
          const ty = (y - i1) / (i2 - i1);
          const v2 = u(i1, j1) * (1 - tx) * (1 - ty) + u(i1, j2) * tx * (1 - ty) + u(i2, j1) * (1 - tx) * ty + u(i2, j2) * tx * ty;
          const I = 255 * clamp((v2 - min) / (max - min), 0, 1);
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
      transfer
    };
  }

  // src/index.ts
  var N = 40;
  setup(
    document.querySelector("#advection\u2013diffusion"),
    (i, j, { dudx, d2udx2, d2udy2 }) => 20 * dudx(i, j) + 20 * (d2udx2(i, j) + d2udy2(i, j))
  );
  setup(
    document.querySelector("#wave"),
    (i, j, { v }) => v(i, j),
    (i, j, { d2udx2, d2udy2 }) => 200 * (d2udx2(i, j) + d2udy2(i, j))
  );
  function initialValue() {
    const gaussians = [];
    let n = 20;
    while (n--) {
      gaussians.push([
        (Math.random() * 0.8 + 0.1) * N,
        (Math.random() * 0.8 + 0.1) * N,
        Math.random() * 0.01 + 0.1
      ]);
    }
    return (i, j) => {
      let u = 0;
      for (const [ci, cj, k] of gaussians) {
        u += Math.exp(-k * ((i - ci) ** 2 + (j - cj) ** 2));
      }
      return u;
    };
  }
  function setup(canvas, dudt, dvdt = () => 0) {
    const ctx = canvas.getContext("2d");
    const height = ctx.canvas.height;
    const width = ctx.canvas.width;
    const imageData = new ImageData(width, height);
    let rafHandle = -1;
    (function reset() {
      cancelAnimationFrame(rafHandle);
      const Sol = FDM(
        makeGrid(N, N, initialValue()),
        zeros(50, 50),
        dudt,
        dvdt,
        1,
        1e-4
      );
      rafHandle = requestAnimationFrame(function render() {
        Sol.step(100);
        Sol.transfer(imageData, 0, 1);
        ctx.putImageData(imageData, 0, 0);
        rafHandle = requestAnimationFrame(render);
      });
      setTimeout(reset, 1e4);
    })();
  }
})();
