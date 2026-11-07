import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { LabelElement } from "../../../shared/doc";
import { useT } from "../i18n";
import { useEditor } from "../model/editor";
import { round1 } from "../model/units";
import { useProfile } from "../printers/settings";
import { acrossHeadMm, dotsPerMm, printheadMm } from "../printers/types";
import { renderLabel } from "../render/renderLabel";

const MAX_ZOOM = 24;
const SNAP_MM = 0.6;

type Drag = { id: string; mode: "move" | "resize"; startX: number; startY: number; orig: LabelElement };

/** Snap a value to any of the targets that is close enough. */
function snap(value: number, targets: number[]): number {
  for (const t of targets) if (Math.abs(value - t) < SNAP_MM) return t;
  return value;
}

export function LabelCanvas() {
  const doc = useEditor((s) => s.doc);
  const selectedId = useEditor((s) => s.selectedId);
  const { select, update } = useEditor.getState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(16);
  const drag = useRef<Drag | null>(null);
  const { widthMm, heightMm } = doc.label;
  const profile = useProfile();
  const t = useT();
  const dpmm = dotsPerMm(profile);
  const headMm = printheadMm(profile);
  const tooWide = acrossHeadMm(profile, doc.label) > headMm + 0.5;

  useEffect(() => {
    if (canvasRef.current) renderLabel(doc, dpmm, canvasRef.current);
  }, [doc, dpmm]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const fit = () => {
      const { width, height } = wrap.getBoundingClientRect();
      setZoom(Math.min(MAX_ZOOM, (width - 64) / widthMm, (height - 64) / heightMm));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [widthMm, heightMm]);

  const begin = (e: ReactPointerEvent, el: LabelElement, mode: Drag["mode"]) => {
    e.stopPropagation();
    select(el.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, orig: el };
  };

  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / zoom;
    const dy = (e.clientY - d.startY) / zoom;
    const o = d.orig;
    if (d.mode === "move") {
      let x = o.x + dx;
      let y = o.y + dy;
      x = snap(x, [0, (widthMm - o.w) / 2, widthMm - o.w]);
      y = snap(y, [0, (heightMm - o.h) / 2, heightMm - o.h]);
      update(d.id, { x: round1(x), y: round1(y) });
    } else {
      const w = snap(o.x + Math.max(1, o.w + dx), [widthMm]) - o.x;
      const h = snap(o.y + Math.max(1, o.h + dy), [heightMm]) - o.y;
      update(d.id, { w: round1(w), h: round1(h) });
    }
  };

  const end = () => {
    drag.current = null;
  };

  return (
    <div className="stage" ref={wrapRef} onPointerDown={() => select(null)}>
      <div className="label" style={{ width: widthMm * zoom, height: heightMm * zoom }}>
        <canvas ref={canvasRef} className="label-canvas" />
        {doc.elements.map((el) => (
          <div
            key={el.id}
            className={`box${el.id === selectedId ? " selected" : ""}`}
            style={{ left: el.x * zoom, top: el.y * zoom, width: el.w * zoom, height: el.h * zoom }}
            onPointerDown={(e) => begin(e, el, "move")}
            onPointerMove={move}
            onPointerUp={end}
          >
            {el.id === selectedId && (
              <div className="handle" onPointerDown={(e) => begin(e, el, "resize")} onPointerMove={move} onPointerUp={end} />
            )}
          </div>
        ))}
      </div>
      <div className="stage-caption">
        {t("label.caption", {
          size: `${widthMm} × ${heightMm}`,
          dots: `${Math.round(widthMm * dpmm)} × ${Math.round(heightMm * dpmm)}`,
          dpi: `${profile.dpi} dpi`,
        })}
      </div>
      {tooWide && <div className="error">{t("label.tooWide", { mm: headMm.toFixed(1) })}</div>}
    </div>
  );
}
