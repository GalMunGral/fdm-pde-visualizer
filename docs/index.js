(() => {
  // src/utils.ts
  function zeros(m2, n2) {
    return Array(m2).fill(0).map(() => Array(n2).fill(0));
  }
  function sinusoid2D(m2, n2, k) {
    return Array(m2).fill(0).map(
      (_, i) => Array(n2).fill(0).map(
        (_2, j) => Math.sin(k * Math.sqrt((i - m2 / 2) ** 2 + (j - n2 / 2) ** 2))
      )
    );
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // src/FDM.ts
  function FiniteDifference(U, V, dudt, dvdt, h, dt) {
    const m2 = U.length;
    const n2 = U[0].length;
    const u = (i, j) => U[(i + m2) % m2][(j + n2) % n2];
    const v = (i, j) => V[(i + m2) % m2][(j + n2) % n2];
    const dudx = (i, j) => (u(i, j + 1) - u(i, j - 1)) / (2 * h);
    const dudy = (i, j) => (u(i + 1, j) - u(i - 1, j)) / (2 * h);
    const d2udx2 = (i, j) => (u(i, j - 1) - 2 * u(i, j) + u(i, j + 1)) / h ** 2;
    const d2udy2 = (i, j) => (u(i - 1, j) - 2 * u(i, j) + u(i + 1, j)) / h ** 2;
    function step(iterations) {
      let dMax = -Infinity;
      while (iterations--) {
        let U$ = zeros(m2, n2);
        let V$ = zeros(m2, n2);
        for (let i = 0; i < m2; ++i) {
          for (let j = 0; j < n2; ++j) {
            const du = dt * dudt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
            const dv = dt * dvdt(i, j, { u, v, dudx, dudy, d2udx2, d2udy2 });
            if (isNaN(du) || isNaN(dv))
              throw new Error("NaN");
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
    function transfer(imageData2, min, max) {
      for (let i = 0; i < m2; ++i) {
        for (let j = 0; j < n2; ++j) {
          const base = (m2 - 1 - i) * n2 + j;
          const t = (U[i][j] - min) / (max - min);
          const I = 255 * clamp(t, 0, 1);
          imageData2[base * 4] = I;
          imageData2[base * 4 + 1] = I;
          imageData2[base * 4 + 2] = I;
          imageData2[base * 4 + 3] = 255;
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
  var n = ctx.canvas.width;
  var m = ctx.canvas.height;
  var imageData = new ImageData(n, m);
  var Solution = FiniteDifference(
    sinusoid2D(m, n, 0.5),
    zeros(m, n),
    (i, j, { v }) => v(i, j),
    (i, j, { d2udx2, d2udy2 }) => 100 * (d2udx2(i, j) + d2udy2(i, j)),
    1,
    1e-4
  );
  requestAnimationFrame(function render() {
    Solution.step(100);
    Solution.transfer(imageData.data, -1, 1);
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(render);
  });
})();
