import { useState } from "react";
import { useT } from "../i18n";
import { useEditor } from "../model/editor";
import { useProfile } from "../printers/settings";
import { printheadMm, rollSize } from "../printers/types";
import { NumberField } from "./NumberField";

export function LabelSizePicker() {
  const label = useEditor((s) => s.doc.label);
  const setLabel = useEditor.getState().setLabel;
  const profile = useProfile();
  const t = useT();
  const preset = profile.labels.find((p) => p.widthMm === label.widthMm && p.heightMm === label.heightMm);
  const [customMode, setCustomMode] = useState(false);
  const custom = customMode || !preset;

  return (
    <div className="label-size">
      <label className="field">
        <span>{t("label.title", { printer: `${profile.vendor} ${profile.name}` })}</span>
        <select
          value={custom ? "custom" : preset.id}
          onChange={(e) => {
            const p = profile.labels.find((x) => x.id === e.target.value);
            setCustomMode(!p);
            if (p) setLabel({ widthMm: p.widthMm, heightMm: p.heightMm });
          }}
        >
          {profile.labels.map((p) => (
            <option key={p.id} value={p.id}>
              {rollSize(profile, p)} {t("unit.mm")}
              {p.note ? ` (${t(p.note)})` : ""}
            </option>
          ))}
          <option value="custom">{t("label.custom")}</option>
        </select>
      </label>
      {custom && (
        <>
          <NumberField
            label={t("label.width")}
            unit={t("unit.mm")}
            value={label.widthMm}
            min={5}
            max={300}
            onChange={(widthMm) => setLabel({ ...label, widthMm })}
          />
          <NumberField
            label={t("label.height")}
            unit={t("unit.mm")}
            value={label.heightMm}
            min={4}
            max={300}
            onChange={(heightMm) => setLabel({ ...label, heightMm })}
          />
          <span className="hint">{t("label.head", { mm: Math.round(printheadMm(profile)) })}</span>
        </>
      )}
    </div>
  );
}
