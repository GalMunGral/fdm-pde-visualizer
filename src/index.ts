import { random, sinusoid2D, zeros } from "./utils.js";
import { FiniteDifference } from "./FDM.js";

const ctx = document.querySelector("canvas")?.getContext("2d")!;
const n = ctx.canvas.width;
const m = ctx.canvas.height;
const imageData = new ImageData(n, m);

const Solution = FiniteDifference(
  sinusoid2D(m, n, 0.5),
  zeros(m, n),
  (i, j, { v }) => v(i, j),
  (i, j, { d2udx2, d2udy2 }) => 100 * (d2udx2(i, j) + d2udy2(i, j)),
  1,
  0.0001
);

requestAnimationFrame(function render() {
  Solution.step(100);
  Solution.transfer(imageData.data, -1, 1);
  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(render);
});
