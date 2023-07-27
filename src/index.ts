import { sinusoid2D, zeros } from "./utils";
import { FDM } from "./FDM";

const ctx = document.querySelector("canvas")?.getContext("2d")!;
const m = ctx.canvas.height;
const n = ctx.canvas.width;
const imageData = new ImageData(n, m);

const Sol = FDM(
  sinusoid2D(m, n, 0.5),
  zeros(m, n),
  (i, j, { v }) => v(i, j),
  (i, j, { d2udx2, d2udy2 }) => 50 * (d2udx2(i, j) + d2udy2(i, j)),
  1,
  0.0001
);

requestAnimationFrame(function render() {
  Sol.step(100);
  Sol.transfer(imageData.data, -1, 1);
  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(render);
});
