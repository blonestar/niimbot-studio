import type { LabelDoc } from "../../../shared/doc";
import { specFor } from "../model/elements/registry";

const THRESHOLD = 128;

/**
 * Draw the label at print resolution and reduce it to pure black and white,
 * so the on-screen preview is exactly what the thermal head will burn.
 */
export function renderLabel(doc: LabelDoc, dpmm: number, canvas: HTMLCanvasElement = document.createElement("canvas")): HTMLCanvasElement {
  canvas.width = Math.round(doc.label.widthMm * dpmm);
  canvas.height = Math.round(doc.label.heightMm * dpmm);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is not available");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const el of doc.elements) {
    ctx.save();
    specFor(el).render(ctx, el, dpmm);
    ctx.restore();
  }

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
    const v = lum < THRESHOLD ? 0 : 255;
    px[i] = px[i + 1] = px[i + 2] = v;
    px[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
