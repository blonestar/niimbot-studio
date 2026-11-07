import { useState } from "react";
import { markPrinted, saveCurrent } from "../library/library";
import { useEditor } from "../model/editor";
import { describeError, printCanvas, useConnection } from "../printers/connection";
import { useProfile } from "../printers/settings";
import { dotsPerMm } from "../printers/types";
import { renderLabel } from "../render/renderLabel";
import { useT } from "../i18n";
import { NumberField } from "./NumberField";

export function PrintPanel() {
  const printer = useConnection();
  const profile = useProfile();
  const t = useT();
  const [copies, setCopies] = useState(1);
  const [density, setDensity] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok"; copies: number } | { kind: "error"; error: unknown } | null>(null);

  const connected = printer.status === "connected";
  const effectiveDensity = Math.min(profile.density.max, density ?? profile.density.default);
  const job = connected ? printer.job : undefined;

  const print = async () => {
    setMessage(null);
    try {
      await printCanvas(renderLabel(useEditor.getState().doc, dotsPerMm(profile)), copies, effectiveDensity);
      await saveCurrent();
      await markPrinted(useEditor.getState().doc.id);
      setMessage({ kind: "ok", copies });
    } catch (err) {
      setMessage({ kind: "error", error: err });
    }
  };

  return (
    <div className="print-panel">
      <div className="row">
        <NumberField label={t("print.copies")} value={copies} min={1} max={99} onChange={(n) => setCopies(Math.round(n))} />
        <NumberField
          label={t("print.density")}
          value={effectiveDensity}
          min={profile.density.min}
          max={profile.density.max}
          onChange={(n) => setDensity(Math.round(n))}
        />
      </div>
      <button className="primary big" disabled={!connected || !!job} onClick={() => void print()}>
        {job ? t("print.progress", { percent: Math.round(job.progress * 100) }) : t("print.print")}
      </button>
      {!connected && <p className="hint">{t("print.connectFirst")}</p>}
      {message?.kind === "ok" && (
        <p className="ok">{message.copies === 1 ? t("print.doneOne") : t("print.doneMany", { n: message.copies })}</p>
      )}
      {message?.kind === "error" && <p className="error">{describeError(message.error)}</p>}
    </div>
  );
}
