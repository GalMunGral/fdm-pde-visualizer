import { sinusoid2D, zeros } from "./utils";
import { FDM } from "./FDM";

const ctx = document.querySelector("canvas")?.getContext("2d")!;
const height = ctx.canvas.height;
const width = ctx.canvas.width;
const imageData = new ImageData(width, height);

const Sol = FDM(
  sinusoid2D(50, 50, 1),
  zeros(50, 50),
  (i, j, { v }) => v(i, j),
  (i, j, { d2udx2, d2udy2 }) => 50 * (d2udx2(i, j) + d2udy2(i, j)),
  1,
  0.0001
);

requestAnimationFrame(function render() {
  Sol.step(100);
  Sol.transfer(imageData, -1, 1);
  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(render);
});
