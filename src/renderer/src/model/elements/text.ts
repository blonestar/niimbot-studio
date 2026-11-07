import type { LabelSize, TextElement } from "../../../../shared/doc";
import { t } from "../../i18n";
import { newId, ptToMm } from "../units";
import type { ElementSpec } from "./spec";

export const DEFAULT_FONT = "Noto Sans";

function fontString(el: TextElement, px: number): string {
  return `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${px}px "${el.fontFamily}", sans-serif`;
}

type Block = { lines: { text: string; left: number; width: number }[]; width: number; ascent: number; descent: number; advance: number };

/** Measure the ink of every line so tiny labels use every available dot. */
function measure(ctx: CanvasRenderingContext2D, el: TextElement, px: number): Block {
  ctx.font = fontString(el, px);
  let ascent = 0;
  let descent = 0;
  const lines = el.text.split("\n").map((text) => {
    const m = ctx.measureText(text || " ");
    ascent = Math.max(ascent, m.actualBoundingBoxAscent);
    descent = Math.max(descent, m.actualBoundingBoxDescent);
    return { text, left: m.actualBoundingBoxLeft, width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight };
  });
  return { lines, width: Math.max(0, ...lines.map((l) => l.width)), ascent, descent, advance: px * el.lineHeight };
}

const blockHeight = (b: Block) => b.ascent + b.descent + b.advance * (b.lines.length - 1);

/** Font size in dots: either the user's size or the largest that fits the box. */
function fontPx(ctx: CanvasRenderingContext2D, el: TextElement, dpmm: number, boxW: number, boxH: number): number {
  if (!el.autoFit) return ptToMm(el.fontSizePt) * dpmm;
  const probe = 100;
  const b = measure(ctx, el, probe);
  const h = blockHeight(b);
  if (b.width <= 0 || h <= 0) return probe;
  return Math.max(4, Math.floor(probe * Math.min(boxW / b.width, boxH / h)));
}

export const textSpec: ElementSpec<TextElement> = {
  kind: "text",
  title: "element.text",

  create(label: LabelSize): TextElement {
    return {
      id: newId(),
      kind: "text",
      x: 1,
      y: 0.5,
      w: label.widthMm - 2,
      h: label.heightMm - 1,
      text: t("element.text"),
      fontFamily: DEFAULT_FONT,
      fontSizePt: 14,
      autoFit: true,
      bold: true,
      italic: false,
      align: "center",
      vAlign: "middle",
      lineHeight: 1.15,
    };
  },

  render(ctx, el, dpmm) {
    const s = dpmm;
    const [bx, by, bw, bh] = [el.x * s, el.y * s, el.w * s, el.h * s];
    const block = measure(ctx, el, fontPx(ctx, el, dpmm, bw, bh));
    const totalH = blockHeight(block);
    const top = el.vAlign === "top" ? by : el.vAlign === "bottom" ? by + bh - totalH : by + (bh - totalH) / 2;

    ctx.fillStyle = "#000";
    ctx.textBaseline = "alphabetic";
    block.lines.forEach((line, i) => {
      const inkX = el.align === "left" ? bx : el.align === "right" ? bx + bw - line.width : bx + (bw - line.width) / 2;
      ctx.fillText(line.text, inkX + line.left, top + block.ascent + i * block.advance);
    });
  },
};

/** Plain-language description for lists and default document names. */
export const textSummary = (el: TextElement) => el.text.split("\n")[0]?.trim() ?? "";
