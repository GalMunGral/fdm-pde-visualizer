import { makeGrid, sinusoid2D, zeros } from "./utils";
import { FDM } from "./FDM";

const ctx = document.querySelector("canvas")?.getContext("2d")!;
const height = ctx.canvas.height;
const width = ctx.canvas.width;
const imageData = new ImageData(width, height);

const N = 40;

function initialValue(): Fn {
  const gaussians: Array<[Float, Float, Float]> = [];
  let n = 20;
  while (n--) {
    gaussians.push([
      (Math.random() * 0.8 + 0.1) * N,
      (Math.random() * 0.8 + 0.1) * N,
      Math.random() * 0.01 + 0.1,
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

let rafHandle = -1;

(function reset() {
  cancelAnimationFrame(rafHandle);

  const Sol = FDM(
    makeGrid(N, N, initialValue()),
    zeros(50, 50),
    (i, j, { v }) => v(i, j),
    (i, j, { d2udx2, d2udy2 }) => 200 * (d2udx2(i, j) + d2udy2(i, j)),
    1,
    0.0001
  );

  rafHandle = requestAnimationFrame(function render() {
    Sol.step(100);
    Sol.transfer(imageData, 0, 1);
    ctx.putImageData(imageData, 0, 0);
    rafHandle = requestAnimationFrame(render);
  });

  setTimeout(reset, 5000);
})();
