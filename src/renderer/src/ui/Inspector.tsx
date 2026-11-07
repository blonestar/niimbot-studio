import type { HAlign, LabelElement, TextElement, VAlign } from "../../../shared/doc";
import { useT, type MessageKey } from "../i18n";
import { useEditor, useSelected } from "../model/editor";
import { round1 } from "../model/units";
import { useFonts } from "./fonts";
import { NumberField } from "./NumberField";

const H_ALIGN: { value: HAlign; label: MessageKey }[] = [
  { value: "left", label: "inspector.left" },
  { value: "center", label: "inspector.center" },
  { value: "right", label: "inspector.right" },
];
const V_ALIGN: { value: VAlign; label: MessageKey }[] = [
  { value: "top", label: "inspector.top" },
  { value: "middle", label: "inspector.middle" },
  { value: "bottom", label: "inspector.bottom" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: MessageKey }[];
  value: T;
  onChange(v: T): void;
}) {
  const t = useT();
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? "on" : ""} onClick={() => onChange(o.value)}>
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

function TextFields({ el }: { el: TextElement }) {
  const update = (patch: Partial<TextElement>) => useEditor.getState().update(el.id, patch);
  const fonts = useFonts();
  const t = useT();
  const families = fonts.includes(el.fontFamily) ? fonts : [el.fontFamily, ...fonts];

  return (
    <>
      <label className="field">
        <span>{t("inspector.text")}</span>
        <textarea id="text-input" rows={3} value={el.text} onChange={(e) => update({ text: e.target.value })} />
      </label>
      <label className="field">
        <span>{t("inspector.font")}</span>
        <select value={el.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} style={{ fontFamily: el.fontFamily }}>
          {families.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <button className={`toggle${el.bold ? " on" : ""}`} onClick={() => update({ bold: !el.bold })} title={t("inspector.bold")}>
          <b>B</b>
        </button>
        <button className={`toggle${el.italic ? " on" : ""}`} onClick={() => update({ italic: !el.italic })} title={t("inspector.italic")}>
          <i>I</i>
        </button>
        <label className="check">
          <input type="checkbox" checked={el.autoFit} onChange={(e) => update({ autoFit: e.target.checked })} />
          {t("inspector.autoFit")}
        </label>
      </div>
      <div className="row">
        <NumberField
          label={t("inspector.size")}
          unit={t("unit.pt")}
          value={el.fontSizePt}
          min={2}
          max={200}
          step={0.5}
          disabled={el.autoFit}
          onChange={(fontSizePt) => update({ fontSizePt })}
        />
        <NumberField
          label={t("inspector.lineHeight")}
          value={el.lineHeight}
          min={0.6}
          max={3}
          step={0.05}
          onChange={(lineHeight) => update({ lineHeight })}
        />
      </div>
      <div className="field">
        <span>{t("inspector.alignment")}</span>
        <Segmented options={H_ALIGN} value={el.align} onChange={(align) => update({ align })} />
        <Segmented options={V_ALIGN} value={el.vAlign} onChange={(vAlign) => update({ vAlign })} />
      </div>
    </>
  );
}

function GeometryFields({ el }: { el: LabelElement }) {
  const { widthMm, heightMm } = useEditor((s) => s.doc.label);
  const update = (patch: Partial<LabelElement>) => useEditor.getState().update(el.id, patch);
  const t = useT();
  return (
    <div className="field">
      <span>{t("inspector.geometry")}</span>
      <div className="row">
        <NumberField label="X" value={el.x} step={0.5} onChange={(x) => update({ x })} />
        <NumberField label="Y" value={el.y} step={0.5} onChange={(y) => update({ y })} />
        <NumberField label={t("inspector.width")} value={el.w} min={1} step={0.5} onChange={(w) => update({ w })} />
        <NumberField label={t("inspector.height")} value={el.h} min={1} step={0.5} onChange={(h) => update({ h })} />
      </div>
      <div className="row">
        <button onClick={() => update({ x: round1((widthMm - el.w) / 2) })}>{t("inspector.centerH")}</button>
        <button onClick={() => update({ y: round1((heightMm - el.h) / 2) })}>{t("inspector.centerV")}</button>
        <button onClick={() => update({ x: 0, y: 0, w: widthMm, h: heightMm })}>{t("inspector.fill")}</button>
      </div>
    </div>
  );
}

export function Inspector() {
  const el = useSelected();
  const t = useT();
  if (!el) {
    return <p className="hint">{t("inspector.empty")}</p>;
  }
  return (
    <div className="inspector">
      {el.kind === "text" && <TextFields el={el} />}
      <GeometryFields el={el} />
      <button className="danger" onClick={() => useEditor.getState().remove(el.id)}>
        {t("inspector.delete")}
      </button>
    </div>
  );
}
