import { makeGrid, sinusoid2D, zeros } from "./utils";
import { FDM } from "./FDM";

const ctx = document.querySelector("canvas")?.getContext("2d")!;
const height = ctx.canvas.height;
const width = ctx.canvas.width;
const imageData = new ImageData(width, height);

function gaussians(points: Array<[Int, Int]>): Fn {
  return (i, j) => {
    let u = 0;
    for (const [ci, cj] of points) {
      u += Math.exp(-0.1 * ((i - ci) ** 2 + (j - cj) ** 2));
    }
    return 2 * u - 1;
  };
}

let rafHandle = -1;

(function reset() {
  cancelAnimationFrame(rafHandle);

  const N = 50;

  const initialValue = gaussians(
    Array(20)
      .fill(0)
      .map(
        () =>
          Array(2)
            .fill(0)
            .map(() => Math.random() * N) as [Int, Int]
      )
  );

  const Sol = FDM(
    makeGrid(N, N, initialValue),
    zeros(50, 50),
    (i, j, { v }) => v(i, j),
    (i, j, { d2udx2, d2udy2 }) => 100 * (d2udx2(i, j) + d2udy2(i, j)),
    1,
    0.0001
  );

  rafHandle = requestAnimationFrame(function render() {
    Sol.step(100);
    Sol.transfer(imageData, -1, 1);
    ctx.putImageData(imageData, 0, 0);
    rafHandle = requestAnimationFrame(render);
  });

  setTimeout(reset, 10000);
})();
